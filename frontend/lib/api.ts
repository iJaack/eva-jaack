import { protocol, getApiBase } from "./protocol";
import type {
  ArticleDetailResponse,
  ArticleListResponse,
  ClaimChallengePreviewResponse,
  ClaimCreateResponse,
  ClaimListResponse,
  ClaimMarketDetailResponse,
  ClaimMarketSummaryDto,
  ClaimSettlementPreviewResponse,
  ClaimStakePreviewResponse,
  CopyThesisPreviewResponse,
  CuratorDetailResponse,
  CuratorListResponse,
  MarketDetailResponse,
  MarketListResponse,
  PredictionMarketDto,
  PredictionNetworkSummaryResponse,
  PredictorDetailResponse,
  PredictorDto,
  PredictorListResponse,
  ThesisCreateResponse,
  ThesisDetailResponse,
  ThesisDto,
  ThesisListResponse,
  VerifyResponse,
  OnchainArticleDto,
  CuratorDto,
} from "../../backend/src/lib/api-types";

export type Article = OnchainArticleDto;
export type Curator = CuratorDto;
export type ArticleDetail = ArticleDetailResponse;
export type CuratorDetail = CuratorDetailResponse;
export type VerificationResult = VerifyResponse;
export type MarketClaim = ClaimMarketSummaryDto;
export type MarketClaimDetail = ClaimMarketDetailResponse;
export type PredictionMarket = PredictionMarketDto;
export type Thesis = ThesisDto;
export type Predictor = PredictorDto;
export type PredictionSummary = PredictionNetworkSummaryResponse;
export type PredictionMarketDetail = MarketDetailResponse;
export type PredictionThesisDetail = ThesisDetailResponse;
export type PredictionPredictorDetail = PredictorDetailResponse;

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : `Request failed: ${response.status}`);
  }

  return data as T;
}

export async function getArticles(options?: { curator?: string; limit?: number }): Promise<ArticleListResponse> {
  const url = new URL(`${getApiBase()}/article`);
  if (options?.curator) url.searchParams.set("curator", options.curator);
  if (options?.limit) url.searchParams.set("limit", String(options.limit));
  return fetchJson<ArticleListResponse>(url.toString());
}

export async function getArticleDetail(articleId: number): Promise<ArticleDetailResponse> {
  return fetchJson<ArticleDetailResponse>(`${getApiBase()}/article/${articleId}`);
}

export async function getCurators(): Promise<CuratorListResponse> {
  return fetchJson<CuratorListResponse>(`${getApiBase()}/curators`);
}

export async function getCuratorDetail(id: string): Promise<CuratorDetailResponse> {
  return fetchJson<CuratorDetailResponse>(`${getApiBase()}/curator/${id}`);
}

export async function getPredictionSummary(): Promise<PredictionNetworkSummaryResponse> {
  return fetchJson<PredictionNetworkSummaryResponse>(`${getApiBase()}/prediction-summary`);
}

export async function getMarkets(): Promise<MarketListResponse> {
  return fetchJson<MarketListResponse>(`${getApiBase()}/markets`);
}

export async function getMarketDetail(marketId: string): Promise<MarketDetailResponse> {
  return fetchJson<MarketDetailResponse>(`${getApiBase()}/markets/${marketId}`);
}

export async function getTheses(options?: { marketId?: string; author?: string }): Promise<ThesisListResponse> {
  const url = new URL(`${getApiBase()}/theses`);
  if (options?.marketId) url.searchParams.set("marketId", options.marketId);
  if (options?.author) url.searchParams.set("author", options.author);
  return fetchJson<ThesisListResponse>(url.toString());
}

export async function getThesisDetail(thesisId: string): Promise<ThesisDetailResponse> {
  return fetchJson<ThesisDetailResponse>(`${getApiBase()}/theses/${thesisId}`);
}

export async function createThesis(input: {
  authorHandle: string;
  authorWallet?: string;
  authorAgentId?: string;
  marketId?: string;
  marketTitle?: string;
  marketUrl?: string;
  category?: string;
  selectedOutcomeId?: string;
  selectedOutcomeLabel?: string;
  oddsAtPost?: number;
  conviction?: number;
  rationale: string;
  evidenceLinks?: string[];
  sourceUrl?: string;
  sourcePostUrl?: string;
  counterToThesisId?: string;
}): Promise<ThesisCreateResponse> {
  return fetchJson<ThesisCreateResponse>(`${getApiBase()}/theses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function getPredictors(): Promise<PredictorListResponse> {
  return fetchJson<PredictorListResponse>(`${getApiBase()}/predictors`);
}

export async function getPredictorDetail(id: string): Promise<PredictorDetailResponse> {
  return fetchJson<PredictorDetailResponse>(`${getApiBase()}/predictors/${id}`);
}

export async function getCopyPreview(thesisId: string): Promise<CopyThesisPreviewResponse> {
  return fetchJson<CopyThesisPreviewResponse>(`${getApiBase()}/copy-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ thesisId }),
  });
}

export async function getClaims(): Promise<ClaimListResponse> {
  return fetchJson<ClaimListResponse>(`${getApiBase()}/claims`);
}

export async function getClaimDetail(claimId: string): Promise<ClaimMarketDetailResponse> {
  return fetchJson<ClaimMarketDetailResponse>(`${getApiBase()}/claims/${claimId}`);
}

export async function createClaim(input: {
  sourcePlatform: "x" | "farcaster" | "web" | "manual";
  sourceRef: string;
  sourceUrl?: string;
  authorHandle?: string;
  conversationId?: string;
  claimText: string;
  title?: string;
  claimType?: string;
  createdBy?: string;
  context?: string;
  evidenceLinks?: string[];
}): Promise<ClaimCreateResponse> {
  return fetchJson<ClaimCreateResponse>(`${getApiBase()}/claims`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function getClaimSettlementPreview(claimId: string): Promise<ClaimSettlementPreviewResponse> {
  return fetchJson<ClaimSettlementPreviewResponse>(`${getApiBase()}/claims/${claimId}/settlement-preview`);
}

export async function previewClaimStake(
  claimId: string,
  input: { amount: string; verdict: string; confidenceBand?: number },
): Promise<ClaimStakePreviewResponse> {
  return fetchJson<ClaimStakePreviewResponse>(`${getApiBase()}/claims/${claimId}/stake-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function previewClaimChallenge(
  claimId: string,
  input: { bondAmount: string },
): Promise<ClaimChallengePreviewResponse> {
  return fetchJson<ClaimChallengePreviewResponse>(`${getApiBase()}/claims/${claimId}/challenge-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function verifyArticleUrl(url: string): Promise<VerifyResponse> {
  return fetchJson<VerifyResponse>(`${getApiBase()}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
}

export function explorerTxUrl(hash: string): string {
  return `${protocol.chain.explorerUrl}/tx/${hash}`;
}
