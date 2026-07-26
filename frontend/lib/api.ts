import { protocol, getApiBase } from "./protocol";
import type {
  CopyThesisPreviewResponse,
  EvaUsageQuoteDto,
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
} from "../../backend/src/lib/api-types";

export type PredictionMarket = PredictionMarketDto;
export type Thesis = ThesisDto;
export type Predictor = PredictorDto;
export type PredictionSummary = PredictionNetworkSummaryResponse;
export type PredictionMarketDetail = MarketDetailResponse;
export type PredictionThesisDetail = ThesisDetailResponse;
export type PredictionPredictorDetail = PredictorDetailResponse;
export type EvaUsageQuote = EvaUsageQuoteDto;

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : `Request failed: ${response.status}`);
  }

  return data as T;
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

export type ThesisCreateRequest = {
  dynamicUserId: string;
  xHandle: string;
  xProfileId?: string;
  walletAddress: string;
  walletSource: "external" | "embedded";
  title: string;
  body: string;
  predictionSignals?: Array<{
    marketId?: string;
    marketTitle?: string;
    marketUrl?: string;
    provider?: string;
    selectedOutcomeId?: string;
    selectedOutcomeLabel: string;
    oddsAtAdd?: number;
    currentOdds?: number;
    weight?: number;
    role?: string;
    rationale?: string;
    status?: string;
  }>;
  factSignals?: Array<{
    claimText: string;
    sourceUrl?: string;
    verifierVerdict?: string;
    verifierScore?: number;
    reportUri?: string;
    reportHash?: string;
    weight?: number;
    role?: string;
    rationale?: string;
  }>;
  evidenceLinks?: string[];
  sourceUrl?: string;
  sourcePostUrl?: string;
  counterToThesisId?: string;
  anchorPreparationId?: string;
  anchorTxHash?: string;
  evaUsageTxHash?: string;
};

export async function createThesis(input: ThesisCreateRequest): Promise<ThesisCreateResponse> {
  return fetchJson<ThesisCreateResponse>(`${getApiBase()}/theses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function prepareDraftThesisAnchor(input: Omit<ThesisCreateRequest, "anchorPreparationId" | "anchorTxHash">): Promise<{
  anchorPreparationId: string;
  thesisId: string;
  anchorStatus: "prepared";
  transactions: Array<{ to: string; data: string; description: string }>;
  evaUsageQuote: EvaUsageQuote;
}> {
  return fetchJson(`${getApiBase()}/thesis-drafts/protocol/prepare-anchor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function recordThesisRevision(
  thesisId: string,
  input: {
    dynamicUserId: string;
    xHandle: string;
    xProfileId?: string | null;
    walletAddress: string;
    walletSource: "external" | "embedded";
    body: string;
    note?: string;
    signalUpdates?: Array<{
      signalId: string;
      currentOdds?: number;
      weight?: number;
      status?: string;
      resolvedOutcomeLabel?: string;
    }>;
    anchorPreparationId?: string;
    anchorTxHash?: string;
    evaUsageTxHash?: string;
  },
): Promise<ThesisDetailResponse> {
  return fetchJson<ThesisDetailResponse>(`${getApiBase()}/theses/${thesisId}/revisions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function prepareThesisRevisionAnchor(
  thesisId: string,
  input: {
    dynamicUserId: string;
    xHandle: string;
    xProfileId?: string | null;
    walletAddress: string;
    walletSource: "external" | "embedded";
    body: string;
    note?: string;
    signalUpdates?: Array<{
      signalId: string;
      currentOdds?: number;
      weight?: number;
      status?: string;
      resolvedOutcomeLabel?: string;
    }>;
  },
): Promise<{
  anchorPreparationId: string;
  thesisId: string;
  anchorStatus: "prepared";
  transactions: Array<{ to: string; data: string; description: string }>;
  evaUsageQuote: EvaUsageQuote;
}> {
  return fetchJson(`${getApiBase()}/theses/${thesisId}/revision-drafts/protocol/prepare-anchor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function getEvaUsageQuote(input: {
  action: EvaUsageQuote["action"];
  account: string;
  resourceId: string;
}): Promise<EvaUsageQuote> {
  return fetchJson<EvaUsageQuote>(`${getApiBase()}/eva/usage/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export async function prepareThesisAnchor(thesisId: string): Promise<{
  thesisId: string;
  anchorStatus: string;
  transactions: Array<{ to: string; data: string; description: string }>;
}> {
  return fetchJson(`${getApiBase()}/theses/${thesisId}/protocol/prepare-anchor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}

export function explorerTxUrl(hash: string): string {
  return `${protocol.chain.explorerUrl}/tx/${hash}`;
}
