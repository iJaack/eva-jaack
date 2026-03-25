import { createPublicClient, getAddress, http, type Address } from "viem";
import { avalanche } from "viem/chains";
import { config } from "../config.js";
import { protocol } from "../protocol.js";
import { evaTrustGraphAbi } from "../generated/evaTrustGraphAbi.js";
import type { CuratorDto, OnchainArticleDto } from "../lib/api-types.js";

const publicClient = createPublicClient({
  chain: avalanche,
  transport: http(config.avalancheRpc),
});
const publicLogClient = createPublicClient({
  chain: avalanche,
  transport: http(protocol.chain.publicRpcUrl),
});

const curatorRegisteredEvent = evaTrustGraphAbi.find(
  (entry) => entry.type === "event" && entry.name === "CuratorRegistered",
);
const PUBLIC_LOG_BLOCK_WINDOW = 50_000n;

function toAddress(value: string): Address {
  return getAddress(value);
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function articleFromResult(id: number, result: Awaited<ReturnType<typeof publicClient.readContract>>): OnchainArticleDto {
  const article = result as {
    curator: Address;
    articleHash: string;
    sourceURI: string;
    requestHash: string;
    evidenceURI: string;
    responseHash: string;
    validationTag: string;
    submittedAt: bigint;
    verifiedAt: bigint;
    verificationScore: number;
    premium: boolean;
    status: number;
  };

  return {
    id,
    curator: toAddress(article.curator),
    articleHash: article.articleHash,
    sourceURI: article.sourceURI,
    requestHash: article.requestHash,
    evidenceURI: article.evidenceURI,
    responseHash: article.responseHash,
    validationTag: article.validationTag,
    submittedAt: Number(article.submittedAt),
    verifiedAt: Number(article.verifiedAt),
    verificationScore: Number(article.verificationScore),
    premium: Boolean(article.premium),
    status: Number(article.status),
  };
}

function curatorFromResult(address: Address, result: Awaited<ReturnType<typeof publicClient.readContract>>): CuratorDto {
  const curator = result as {
    registered: boolean;
    curatorAgentId: bigint;
    selfStake: bigint;
    delegatedStake: bigint;
    pendingSelfYield: bigint;
    trustScore: number;
    registeredAt: bigint;
    lastTrustUpdate: bigint;
    lastArticleAt: bigint;
    articleCount: bigint;
  };

  return {
    address,
    registered: curator.registered,
    curatorAgentId: curator.curatorAgentId.toString(),
    selfStake: curator.selfStake.toString(),
    delegatedStake: curator.delegatedStake.toString(),
    pendingSelfYield: curator.pendingSelfYield.toString(),
    trustScore: Number(curator.trustScore),
    registeredAt: Number(curator.registeredAt),
    lastTrustUpdate: Number(curator.lastTrustUpdate),
    lastArticleAt: Number(curator.lastArticleAt),
    articleCount: Number(curator.articleCount),
  };
}

export async function getCurator(address: Address): Promise<CuratorDto> {
  const result = await publicClient.readContract({
    address: config.evaTrustGraph,
    abi: evaTrustGraphAbi,
    functionName: "getCurator",
    args: [address],
  });

  return curatorFromResult(address, result);
}

export async function listCuratorAddresses(): Promise<Address[]> {
  if (!curatorRegisteredEvent) {
    return [];
  }

  const fromBlock = BigInt(protocol.contracts.deployBlock);
  const latestBlock = await publicLogClient.getBlockNumber();
  if (fromBlock > latestBlock) {
    return [];
  }

  const logs = [];

  for (let startBlock = fromBlock; startBlock <= latestBlock; startBlock += PUBLIC_LOG_BLOCK_WINDOW + 1n) {
    const endBlock = startBlock + PUBLIC_LOG_BLOCK_WINDOW;
    const toBlock = endBlock > latestBlock ? latestBlock : endBlock;
    const batch = await publicLogClient.getLogs({
      address: config.evaTrustGraph,
      event: curatorRegisteredEvent,
      fromBlock: startBlock,
      toBlock,
    });
    logs.push(...batch);
  }

  const seen = new Set<string>();
  const addresses: Address[] = [];

  for (const log of logs) {
    const address = log.args.curator ? toAddress(log.args.curator) : null;
    if (!address) continue;
    if (seen.has(address)) continue;
    seen.add(address);
    addresses.push(address);
  }

  return addresses;
}

export async function listCurators(): Promise<CuratorDto[]> {
  const addresses = await listCuratorAddresses();
  if (addresses.length === 0) return [];

  const curators = await Promise.all(addresses.map((address) => getCurator(address)));
  return curators
    .filter((curator) => curator.registered)
    .sort((left, right) => right.trustScore - left.trustScore || right.articleCount - left.articleCount);
}

export async function getArticle(articleId: number): Promise<OnchainArticleDto | null> {
  if (!Number.isInteger(articleId) || articleId <= 0) {
    return null;
  }

  try {
    const result = await publicClient.readContract({
      address: config.evaTrustGraph,
      abi: evaTrustGraphAbi,
      functionName: "getArticle",
      args: [BigInt(articleId)],
    });

    const article = articleFromResult(articleId, result);
    if (article.curator === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    return article;
  } catch {
    return null;
  }
}

export async function listArticles(): Promise<OnchainArticleDto[]> {
  const nextArticleId = await publicClient.readContract({
    address: config.evaTrustGraph,
    abi: evaTrustGraphAbi,
    functionName: "nextArticleId",
  });

  const maxId = Number(nextArticleId);
  if (!Number.isFinite(maxId) || maxId < 1) return [];

  const contracts = Array.from({ length: maxId }, (_, index) => ({
    address: config.evaTrustGraph,
    abi: evaTrustGraphAbi,
    functionName: "getArticle" as const,
    args: [BigInt(index + 1)] as const,
  }));

  const results = await publicClient.multicall({ contracts });
  const articles: OnchainArticleDto[] = [];

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (result.status !== "success" || !result.result) continue;
    const article = articleFromResult(index + 1, result.result);
    if (article.curator === "0x0000000000000000000000000000000000000000") continue;
    articles.push(article);
  }

  return articles.sort((left, right) => right.verifiedAt - left.verifiedAt || right.submittedAt - left.submittedAt);
}

export async function listArticlesForCurator(curatorAddress: Address): Promise<OnchainArticleDto[]> {
  const articles = await listArticles();
  return articles.filter((article) => article.curator.toLowerCase() === curatorAddress.toLowerCase());
}

export async function findArticleBySourceUri(url: string): Promise<OnchainArticleDto | null> {
  const normalizedUrl = normalizeUrl(url);
  const articles = await listArticles();
  return (
    articles.find((article) => normalizeUrl(article.sourceURI) === normalizedUrl) ??
    null
  );
}
