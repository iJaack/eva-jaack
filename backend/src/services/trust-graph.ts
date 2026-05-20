import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
const readContractLoose = publicClient.readContract as unknown as (args: unknown) => Promise<unknown>;
const multicallLoose = publicClient.multicall as unknown as (args: unknown) => Promise<Array<{ status: string; result?: unknown }>>;

const curatorRegisteredEvent = evaTrustGraphAbi.find(
  (entry) => entry.type === "event" && entry.name === "CuratorRegistered",
);
const PUBLIC_LOG_BLOCK_RANGE = 50_000n; // inclusive span; RPCs cap eth_getLogs at 50k blocks per request
const CURATOR_ADDRESS_CACHE_TTL_MS = 60_000;
const CURATOR_LIST_CACHE_TTL_MS = 60_000;
const defaultCuratorIndexPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../.data/eva-curators/index.json",
);

type CacheEntry<T> = {
  value: T;
  cachedAt: number;
};

type CuratorAddressIndex = {
  version: 1;
  hydrated: boolean;
  updatedAt: string | null;
  lastScannedBlock: string | null;
  addresses: Address[];
};

type StoredCuratorAddressIndex = Omit<CuratorAddressIndex, "addresses"> & {
  addresses: string[];
};

let curatorAddressCache: CacheEntry<Address[]> | null = null;
let curatorAddressInflight: Promise<Address[]> | null = null;
let curatorListCache: CacheEntry<CuratorDto[]> | null = null;
let curatorListInflight: Promise<CuratorDto[]> | null = null;
let curatorIndexCache: CuratorAddressIndex | null = null;
let curatorIndexReadInflight: Promise<CuratorAddressIndex> | null = null;
let curatorIndexRefreshInflight: Promise<void> | null = null;

function toAddress(value: string): Address {
  return getAddress(value);
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function getCuratorIndexPath(): string {
  return config.storageDir ? resolve(config.storageDir, "curators.json") : defaultCuratorIndexPath;
}

function emptyCuratorIndex(): CuratorAddressIndex {
  return {
    version: 1,
    hydrated: false,
    updatedAt: null,
    lastScannedBlock: null,
    addresses: [toAddress(protocol.agents.eva.wallet)],
  };
}

function normalizeCuratorIndex(input: unknown): CuratorAddressIndex {
  if (!input || typeof input !== "object") {
    return emptyCuratorIndex();
  }

  const parsed = input as Partial<StoredCuratorAddressIndex>;
  const addresses = Array.isArray(parsed.addresses)
    ? parsed.addresses
        .map((value) => {
          try {
            return typeof value === "string" ? toAddress(value) : null;
          } catch {
            return null;
          }
        })
        .filter((value): value is Address => value !== null)
    : [];

  return {
    version: 1,
    hydrated: Boolean(parsed.hydrated),
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    lastScannedBlock: typeof parsed.lastScannedBlock === "string" ? parsed.lastScannedBlock : null,
    addresses,
  };
}

function persistableCuratorIndex(index: CuratorAddressIndex): StoredCuratorAddressIndex {
  return {
    ...index,
    addresses: index.addresses,
  };
}

function lastScannedBlockFor(index: CuratorAddressIndex): bigint {
  if (!index.lastScannedBlock) return BigInt(protocol.contracts.deployBlock) - 1n;
  try {
    return BigInt(index.lastScannedBlock);
  } catch {
    return BigInt(protocol.contracts.deployBlock) - 1n;
  }
}

function mergeAddresses(existing: Address[], discovered: Address[]): Address[] {
  const seen = new Set<string>();
  const merged: Address[] = [];

  for (const address of [...existing, ...discovered]) {
    if (seen.has(address)) continue;
    seen.add(address);
    merged.push(address);
  }

  return merged;
}

async function readCuratorIndex(): Promise<CuratorAddressIndex> {
  if (curatorIndexCache) {
    return curatorIndexCache;
  }
  if (curatorIndexReadInflight) {
    return curatorIndexReadInflight;
  }

  curatorIndexReadInflight = (async () => {
    try {
      const raw = await readFile(getCuratorIndexPath(), "utf8");
      const parsed = normalizeCuratorIndex(JSON.parse(raw));
      curatorIndexCache = parsed;
      return parsed;
    } catch {
      const empty = emptyCuratorIndex();
      curatorIndexCache = empty;
      return empty;
    }
  })();

  try {
    return await curatorIndexReadInflight;
  } finally {
    curatorIndexReadInflight = null;
  }
}

async function writeCuratorIndex(index: CuratorAddressIndex): Promise<void> {
  curatorIndexCache = index;
  curatorAddressCache = { value: index.addresses, cachedAt: Date.now() };
  curatorListCache = null;

  await mkdir(dirname(getCuratorIndexPath()), { recursive: true });
  await writeFile(getCuratorIndexPath(), JSON.stringify(persistableCuratorIndex(index), null, 2), "utf8");
}

async function refreshCuratorIndex(index: CuratorAddressIndex): Promise<CuratorAddressIndex> {
  if (!curatorRegisteredEvent) {
    const empty = {
      ...index,
      hydrated: true,
      updatedAt: new Date().toISOString(),
    };
    await writeCuratorIndex(empty);
    return empty;
  }

  const latestBlock = await publicLogClient.getBlockNumber();
  const fromBlock = BigInt(protocol.contracts.deployBlock);
  const lastScannedBlock = lastScannedBlockFor(index);
  const nextScanStart = index.hydrated ? lastScannedBlock + 1n : fromBlock;

  if (nextScanStart > latestBlock) {
    const unchanged = {
      ...index,
      hydrated: true,
      updatedAt: new Date().toISOString(),
      lastScannedBlock: latestBlock.toString(),
    };
    await writeCuratorIndex(unchanged);
    return unchanged;
  }

  const discovered: Address[] = [];

  for (let startBlock = nextScanStart; startBlock <= latestBlock; startBlock += PUBLIC_LOG_BLOCK_RANGE) {
    const endBlock = startBlock + PUBLIC_LOG_BLOCK_RANGE - 1n;
    const toBlock = endBlock > latestBlock ? latestBlock : endBlock;
    const batch = await publicLogClient.getLogs({
      address: config.evaTrustGraph,
      event: curatorRegisteredEvent,
      fromBlock: startBlock,
      toBlock,
    });

    for (const log of batch) {
      const args = log.args as { curator?: string };
      const address = args.curator ? toAddress(args.curator) : null;
      if (address) discovered.push(address);
    }
  }

  const nextIndex: CuratorAddressIndex = {
    version: 1,
    hydrated: true,
    updatedAt: new Date().toISOString(),
    lastScannedBlock: latestBlock.toString(),
    addresses: mergeAddresses(index.addresses, discovered),
  };

  await writeCuratorIndex(nextIndex);
  return nextIndex;
}

function queueCuratorIndexRefresh(index: CuratorAddressIndex): void {
  if (curatorIndexRefreshInflight) return;

  curatorIndexRefreshInflight = (async () => {
    try {
      await refreshCuratorIndex(index);
    } catch {
      // best-effort background refresh; request path keeps serving the persisted snapshot
    } finally {
      curatorIndexRefreshInflight = null;
    }
  })();
}

async function getCuratorIndex(): Promise<CuratorAddressIndex> {
  const index = await readCuratorIndex();
  if (!index.hydrated) {
    if (index.addresses.length > 0) {
      queueCuratorIndexRefresh(index);
      return index;
    }

    return refreshCuratorIndex(index);
  }

  queueCuratorIndexRefresh(index);
  return index;
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
  const result = await readContractLoose({
    address: config.evaTrustGraph,
    abi: evaTrustGraphAbi,
    functionName: "getCurator",
    args: [address],
  });

  return curatorFromResult(address, result);
}

export async function listCuratorAddresses(): Promise<Address[]> {
  const now = Date.now();
  if (curatorAddressCache && now - curatorAddressCache.cachedAt < CURATOR_ADDRESS_CACHE_TTL_MS) {
    return curatorAddressCache.value;
  }
  if (curatorAddressInflight) {
    return curatorAddressInflight;
  }

  curatorAddressInflight = (async () => {
    const index = await getCuratorIndex();
    curatorAddressCache = { value: index.addresses, cachedAt: Date.now() };
    return index.addresses;
  })();

  try {
    return await curatorAddressInflight;
  } finally {
    curatorAddressInflight = null;
  }
}

export async function listCurators(): Promise<CuratorDto[]> {
  const now = Date.now();
  if (curatorListCache && now - curatorListCache.cachedAt < CURATOR_LIST_CACHE_TTL_MS) {
    return curatorListCache.value;
  }
  if (curatorListInflight) {
    return curatorListInflight;
  }

  curatorListInflight = (async () => {
    const addresses = await listCuratorAddresses();
    if (addresses.length === 0) {
      curatorListCache = { value: [], cachedAt: Date.now() };
      return [];
    }

    const curators = await Promise.all(addresses.map((address) => getCurator(address)));
    const result = curators
      .filter((curator) => curator.registered)
      .sort((left, right) => right.trustScore - left.trustScore || right.articleCount - left.articleCount);
    curatorListCache = { value: result, cachedAt: Date.now() };
    return result;
  })();

  try {
    return await curatorListInflight;
  } finally {
    curatorListInflight = null;
  }
}

export async function getArticle(articleId: number): Promise<OnchainArticleDto | null> {
  if (!Number.isInteger(articleId) || articleId <= 0) {
    return null;
  }

  try {
    const result = await readContractLoose({
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
  const nextArticleId = await readContractLoose({
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

  const results = await multicallLoose({ contracts });
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
  return articles.find((article) => normalizeUrl(article.sourceURI) === normalizedUrl) ?? null;
}

export function resetTrustGraphCachesForTests(): void {
  curatorAddressCache = null;
  curatorAddressInflight = null;
  curatorListCache = null;
  curatorListInflight = null;
  curatorIndexCache = null;
  curatorIndexReadInflight = null;
  curatorIndexRefreshInflight = null;
}
