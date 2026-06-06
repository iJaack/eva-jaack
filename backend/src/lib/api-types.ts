export interface PredictorIdentityDto {
  address: `0x${string}`;
  registered: boolean;
  agentId: string;
  trustScore: number;
}

export type ClaimVerdict =
  | "verified"
  | "likely_true"
  | "mixed"
  | "misleading"
  | "likely_false"
  | "false"
  | "unverifiable_yet"
  | "non_falsifiable";

export type PredictionMarketProvider = "polymarket" | "kalshi" | "manual" | "external";
export type PredictionMarketStatus = "open" | "closed" | "resolved" | "cancelled";
export type ThesisStatus = "draft" | "active" | "resolved" | "withdrawn" | "invalid";
export type XCommandType = "track" | "thesis" | "counter" | "copy" | "unknown";
export type XCommandStatus = "accepted" | "ignored" | "moderation_required" | "responded" | "failed";
export type ThesisSignalKind = "prediction_market" | "fact";
export type ThesisSignalRole = "core" | "lateral" | "second_order" | "third_order" | "hedge" | "contradiction";
export type ThesisAnchorStatus = "unanchored" | "prepared" | "submitted" | "confirmed" | "failed";
export type ThesisWalletSource = "external" | "embedded";

export interface PredictionMarketOutcomeDto {
  outcomeId: string;
  label: string;
  price: number;
}

export interface PredictionMarketDto {
  marketId: string;
  provider: PredictionMarketProvider;
  externalId: string | null;
  url: string | null;
  title: string;
  category: string;
  status: PredictionMarketStatus;
  volumeUsd: number | null;
  liquidityUsd: number | null;
  closeTime: string | null;
  outcomes: PredictionMarketOutcomeDto[];
  linkedClaimIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ThesisResolutionDto {
  correct: boolean | null;
  resolvedOutcomeId: string | null;
  resolvedAt: string | null;
  oddsEdge: number | null;
  reputationImpact: "positive" | "negative" | "neutral" | "pending";
  summary: string | null;
}

export interface ThesisAuthorDto {
  dynamicUserId: string;
  xHandle: string;
  xProfileId: string | null;
  walletAddress: `0x${string}`;
  walletSource: ThesisWalletSource;
}

export interface ThesisAnchorDto {
  status: ThesisAnchorStatus;
  txHash: string | null;
  contractAddress: string | null;
  preparedAt: string | null;
  confirmedAt: string | null;
}

export interface ThesisBaseSignalDto {
  signalId: string;
  kind: ThesisSignalKind;
  role: ThesisSignalRole;
  title: string;
  rationale: string | null;
  weight: number;
  signalScore: number;
  addedAt: string;
  updatedAt: string;
  anchor: ThesisAnchorDto;
}

export interface ThesisPredictionSignalDto extends ThesisBaseSignalDto {
  kind: "prediction_market";
  marketId: string | null;
  provider: PredictionMarketProvider;
  externalId: string | null;
  marketUrl: string | null;
  selectedOutcomeId: string | null;
  selectedOutcomeLabel: string;
  resolvedOutcomeLabel: string | null;
  oddsAtAdd: number;
  currentOdds: number;
  status: PredictionMarketStatus;
}

export interface ThesisFactSignalDto extends ThesisBaseSignalDto {
  kind: "fact";
  claimText: string;
  sourceUrl: string | null;
  verifierVerdict: ClaimVerdict;
  verifierScore: number;
  reportUri: string | null;
  reportHash: string | null;
}

export type ThesisSignalDto = ThesisPredictionSignalDto | ThesisFactSignalDto;

export interface ThesisRevisionDto {
  revisionId: string;
  version: number;
  body: string;
  note: string | null;
  signalSnapshot: ThesisSignalDto[];
  scoreBefore: number | null;
  scoreAfter: number;
  createdAt: string;
  anchor: ThesisAnchorDto;
}

export interface ThesisTimelineEntryDto {
  timelineId: string;
  action: "created" | "revised" | "signal_added" | "signal_updated" | "anchored" | "resolved";
  at: string;
  note: string | null;
  scoreBefore: number | null;
  scoreAfter: number;
}

export interface ThesisDto {
  thesisId: string;
  title: string;
  slug: string;
  author: ThesisAuthorDto;
  body: string;
  currentRevision: ThesisRevisionDto;
  revisions: ThesisRevisionDto[];
  signals: ThesisSignalDto[];
  currentScore: number;
  evidenceLinks: string[];
  sourceUrl: string | null;
  sourcePostUrl: string | null;
  counterToThesisId: string | null;
  copiedCount: number;
  challengedCount: number;
  status: ThesisStatus;
  resolution: ThesisResolutionDto;
  timeline: ThesisTimelineEntryDto[];
  anchor: ThesisAnchorDto;
  createdAt: string;
  updatedAt: string;
}

export interface PredictorDto {
  predictorId: string;
  handle: string;
  wallet: `0x${string}` | null;
  agentId: string | null;
  registered: boolean;
  profileState: "registered" | "unclaimed";
  trustScore: number;
  openTheses: number;
  resolvedTheses: number;
  accuracy: number | null;
  avgOddsEdge: number | null;
  copiedTheses: number;
  bestCategory: string | null;
  badges: string[];
}

export interface PredictorDetailResponse {
  predictor: PredictorDto;
  theses: ThesisDto[];
}

export interface MarketListResponse {
  count: number;
  markets: PredictionMarketDto[];
}

export interface MarketDetailResponse {
  market: PredictionMarketDto;
  theses: ThesisDto[];
}

export interface ThesisListResponse {
  count: number;
  theses: ThesisDto[];
}

export interface ThesisDetailResponse {
  thesis: ThesisDto;
  markets: PredictionMarketDto[];
  predictor: PredictorDto;
  counters: ThesisDto[];
}

export interface ThesisCreateResponse {
  created: boolean;
  thesis: ThesisDto;
  markets: PredictionMarketDto[];
}

export interface PredictorListResponse {
  count: number;
  predictors: PredictorDto[];
}

export interface PredictionNetworkSummaryResponse {
  markets: PredictionMarketDto[];
  theses: ThesisDto[];
  predictors: PredictorDto[];
  stats: {
    marketCount: number;
    openThesisCount: number;
    weeklyActivePredictors: number;
    copiedThesisEvents: number;
  };
}

export interface CopyThesisPreviewResponse {
  thesisId: string;
  marketId: string | null;
  selectedOutcomeId: string | null;
  selectedOutcomeLabel: string | null;
  originalOdds: number;
  currentOdds: number;
  venueUrl: string | null;
  execution: "external-link-only";
  warning: string;
}

export interface XCommandDto {
  commandId: string;
  mentionId: string;
  authorHandle: string;
  sourcePostUrl: string | null;
  commandType: XCommandType;
  status: XCommandStatus;
  responseText: string | null;
  responseUrl: string | null;
  createdAt: string;
}

export interface XCommandIngestResponse {
  accepted: boolean;
  command: XCommandDto;
  thesis: ThesisDto | null;
  markets: PredictionMarketDto[];
}
