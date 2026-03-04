import { createPublicClient, http, formatEther, type Address } from "viem";
import { avalanche } from "viem/chains";
import { evaTrustGraphAbi } from "./abi";

const CONTRACT = "0xE84DdD5A03Fa4210c4217436afD2556B348A40a0" as const;

export const client = createPublicClient({
  chain: avalanche,
  transport: http("https://avalanche-c-chain-rpc.publicnode.com"),
});

export type Article = {
  id: number;
  curator: Address;
  articleHash: string;
  sourceURI: string;
  requestHash: string;
  evidenceURI: string;
  responseHash: string;
  validationTag: string;
  submittedAt: number;
  verifiedAt: number;
  verificationScore: number;
  premium: boolean;
  status: number; // 0=Pending, 1=Verified, 2=Rejected
};

export type CuratorInfo = {
  registered: boolean;
  curatorAgentId: bigint;
  selfStake: bigint;
  delegatedStake: bigint;
  trustScore: number;
  registeredAt: number;
  lastTrustUpdate: number;
  lastArticleAt: number;
  articleCount: number;
};

export type ProtocolStats = {
  totalArticles: number;
  yieldReserve: string;
  minSelfStake: string;
};

export async function getProtocolStats(): Promise<ProtocolStats> {
  const results = await client.multicall({
    contracts: [
      { address: CONTRACT, abi: evaTrustGraphAbi, functionName: "nextArticleId" },
      { address: CONTRACT, abi: evaTrustGraphAbi, functionName: "yieldReserve" },
      { address: CONTRACT, abi: evaTrustGraphAbi, functionName: "minSelfStake" },
    ],
  });

  return {
    totalArticles: Number(results[0].result ?? 0n),
    yieldReserve: formatEther(results[1].result ?? 0n),
    minSelfStake: formatEther(results[2].result ?? 0n),
  };
}

export async function getAllArticles(): Promise<Article[]> {
  const nextId = await client.readContract({
    address: CONTRACT,
    abi: evaTrustGraphAbi,
    functionName: "nextArticleId",
  });

  const count = Number(nextId);
  if (count === 0) return [];

  const calls = Array.from({ length: count }, (_, i) => ({
    address: CONTRACT as Address,
    abi: evaTrustGraphAbi,
    functionName: "getArticle" as const,
    args: [BigInt(i)] as const,
  }));

  const results = await client.multicall({ contracts: calls });

  const articles: Article[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status !== "success" || !r.result) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = r.result as any;
    articles.push({
      id: i,
      curator: a.curator ?? a[0],
      articleHash: a.articleHash ?? a[1],
      sourceURI: a.sourceURI ?? a[2],
      requestHash: a.requestHash ?? a[3],
      evidenceURI: a.evidenceURI ?? a[4],
      responseHash: a.responseHash ?? a[5],
      validationTag: a.validationTag ?? a[6],
      submittedAt: Number(a.submittedAt ?? a[7]),
      verifiedAt: Number(a.verifiedAt ?? a[8]),
      verificationScore: Number(a.verificationScore ?? a[9]),
      premium: Boolean(a.premium ?? a[10]),
      status: Number(a.status ?? a[11]),
    });
  }
  return articles;
}

export async function getCuratorInfo(address: Address): Promise<CuratorInfo> {
  const result = await client.readContract({
    address: CONTRACT,
    abi: evaTrustGraphAbi,
    functionName: "getCurator",
    args: [address],
  });

  return {
    registered: result.registered,
    curatorAgentId: result.curatorAgentId,
    selfStake: result.selfStake,
    delegatedStake: result.delegatedStake,
    trustScore: result.trustScore,
    registeredAt: Number(result.registeredAt),
    lastTrustUpdate: Number(result.lastTrustUpdate),
    lastArticleAt: Number(result.lastArticleAt),
    articleCount: Number(result.articleCount),
  };
}

export async function getCuratorAddresses(): Promise<Address[]> {
  const logs = await client.getLogs({
    address: CONTRACT,
    event: evaTrustGraphAbi.find((e) => e.type === "event" && e.name === "CuratorRegistered")!,
    fromBlock: 0n,
    toBlock: "latest",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return logs.map((log) => (log as any).args.curator as Address);
}
