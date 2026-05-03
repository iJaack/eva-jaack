export interface ClaimDto {
  text: string;
  type: "onchain" | "offchain";
  difficulty: number;
}

export interface ClaimVerdictDto {
  claim: ClaimDto;
  score: number;
  explanation: string;
  sources: string[];
  dataSource: "routescan" | "brave" | "routescan+brave";
}

export interface VerificationReportDto {
  url: string;
  title: string;
  claims: ClaimVerdictDto[];
  overallScore: number;
  verifiedAt: string;
  oracleAgentId: number;
  routescanUsed: boolean;
}

export interface PaymentStatusDto {
  required: boolean;
  network: string;
  scheme: string | null;
  reason: string;
}

export interface OnchainArticleDto {
  id: number;
  curator: `0x${string}`;
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
  status: number;
}

export interface CuratorDto {
  address: `0x${string}`;
  registered: boolean;
  curatorAgentId: string;
  selfStake: string;
  delegatedStake: string;
  pendingSelfYield: string;
  trustScore: number;
  registeredAt: number;
  lastTrustUpdate: number;
  lastArticleAt: number;
  articleCount: number;
}

export interface CuratorMarketActivityDto {
  claimsCreated: number;
  openClaims: number;
  resolvedClaims: number;
}

export interface CuratorListResponse {
  count: number;
  chain: string;
  chainId: number;
  curators: CuratorDto[];
}

export interface CuratorDetailResponse {
  chain: string;
  chainId: number;
  curator: CuratorDto;
  articles: OnchainArticleDto[];
  marketActivity?: CuratorMarketActivityDto;
}

export interface ArticleListResponse {
  count: number;
  chain: string;
  chainId: number;
  articles: OnchainArticleDto[];
}

export interface ArticleDetailResponse {
  chain: string;
  chainId: number;
  article: OnchainArticleDto;
  report: VerificationReportDto | null;
  reportUri: string | null;
  reportSource: "evidence-uri" | "cache" | "none";
}

export interface VerifyResponse {
  success: true;
  payment: PaymentStatusDto;
  articleMatch: {
    articleId: number | null;
    matchesExistingSubmission: boolean;
  };
  verification: {
    overallScore: number;
    claimCount: number;
    routescanClaimCount: number;
    ipfsURI: string;
    report: VerificationReportDto;
  };
}

export type ClaimSourcePlatform = "x" | "farcaster" | "web" | "manual";
export type MarketClaimStatus = "open" | "under_review" | "contested" | "soft_resolved" | "final_resolved" | "cancelled" | "archived";
export type ClaimVerdict =
  | "verified"
  | "likely_true"
  | "mixed"
  | "misleading"
  | "likely_false"
  | "false"
  | "unverifiable_yet"
  | "non_falsifiable";

export interface ClaimSourceDto {
  platform: ClaimSourcePlatform;
  ref: string;
  url: string | null;
  authorHandle: string | null;
  conversationId: string | null;
}

export interface ClaimMachineAssessmentDto {
  verdict: ClaimVerdict;
  confidence: number;
  summary: string;
  evidenceCount: number;
  generatedAt: string;
}

export interface ClaimFundingDto {
  feePool: string;
  sponsorPool: string;
  protocolTopUpPool: string;
  challengeBondPool: string;
  slashedPool: string;
  protocolFeeAccrued: string;
  totalStaked: string;
}

export interface ClaimPacketRefDto {
  uri: string | null;
  hash: string | null;
  generatedAt: string | null;
}

export interface ClaimPacketsDto {
  metadata: ClaimPacketRefDto;
  evidence: ClaimPacketRefDto;
  machineAssessment: ClaimPacketRefDto;
  resolution: ClaimPacketRefDto;
}

export interface ClaimChallengeDto {
  id: number;
  challenger: string | null;
  bondAmount: string;
  status: "open" | "accepted" | "rejected" | "expired" | "settled";
  openedAt: string;
  resolvedAt: string | null;
}

export interface ClaimResolutionDto {
  verdict: ClaimVerdict | null;
  confidenceBand: number | null;
  resolutionRoot: string | null;
  overturnedByChallenge: boolean;
  resolvedAt: string | null;
  summary: string | null;
}

export interface ClaimTimelineEntryDto {
  label: string;
  at: string;
  note: string;
}

export interface ClaimMarketSummaryDto {
  claimId: string;
  title: string;
  excerpt: string;
  claimText: string;
  claimType: string;
  status: MarketClaimStatus;
  createdAt: string;
  updatedAt: string;
  source: ClaimSourceDto;
  machineAssessment: ClaimMachineAssessmentDto | null;
  funding: ClaimFundingDto;
  participantCount: number;
  leadingVerdict: ClaimVerdict | null;
  marketEnabled: boolean;
}

export interface ClaimMarketDetailResponse extends ClaimMarketSummaryDto {
  createdBy: string | null;
  context: string | null;
  evidenceLinks: string[];
  packets: ClaimPacketsDto;
  challenges: ClaimChallengeDto[];
  resolution: ClaimResolutionDto;
  timeline: ClaimTimelineEntryDto[];
}

export interface ClaimListResponse {
  count: number;
  chain: string;
  chainId: number;
  marketEnabled: boolean;
  claims: ClaimMarketSummaryDto[];
}

export interface ClaimCreateResponse {
  created: boolean;
  claim: ClaimMarketDetailResponse;
}

export interface ClaimStakePreviewResponse {
  claimId: string;
  marketEnabled: boolean;
  source: "offchain-preview" | "onchain";
  requiresRegisteredCurator: boolean;
  amount: string;
  verdict: ClaimVerdict;
  confidenceBand: number | null;
  minimumStake: string;
  reviewDeadline: string;
  challengeWindowEnd: string;
  warnings: string[];
}

export interface ClaimChallengePreviewResponse {
  claimId: string;
  marketEnabled: boolean;
  source: "offchain-preview" | "onchain";
  requiresRegisteredCurator: boolean;
  bondAmount: string;
  minimumChallengeBond: string;
  challengeWindowEnd: string;
  warnings: string[];
}

export interface ClaimSettlementPreviewResponse {
  claimId: string;
  marketEnabled: boolean;
  settlementReady: boolean;
  finalVerdict: ClaimVerdict | null;
  totalStake: string;
  totalEligibleRewardPool: string;
  totalProtocolFee: string;
  challengeBonusPool: string;
  participantCount: number;
  leadingVerdict: ClaimVerdict | null;
  funding: ClaimFundingDto;
}

export interface XMentionIngestResponse {
  accepted: boolean;
  created: boolean;
  reason: string | null;
  acknowledgement: string | null;
  claimId: string | null;
  claimUrl: string | null;
}

export type PredictionMarketProvider = "polymarket" | "kalshi" | "manual" | "external";
export type PredictionMarketStatus = "open" | "closed" | "resolved" | "cancelled";
export type ThesisStatus = "open" | "resolved" | "withdrawn" | "invalid";
export type XCommandType = "track" | "verify" | "thesis" | "counter" | "copy" | "unknown";
export type XCommandStatus = "accepted" | "ignored" | "moderation_required" | "responded" | "failed";

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

export interface ThesisDto {
  thesisId: string;
  marketId: string;
  authorHandle: string;
  authorWallet: `0x${string}` | null;
  authorAgentId: string | null;
  selectedOutcomeId: string;
  selectedOutcomeLabel: string;
  oddsAtPost: number;
  currentOdds: number;
  conviction: number;
  rationale: string;
  evidenceLinks: string[];
  sourceUrl: string | null;
  sourcePostUrl: string | null;
  counterToThesisId: string | null;
  copiedCount: number;
  challengedCount: number;
  status: ThesisStatus;
  resolution: ThesisResolutionDto;
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
  market: PredictionMarketDto;
  predictor: PredictorDto;
  counters: ThesisDto[];
}

export interface ThesisCreateResponse {
  created: boolean;
  thesis: ThesisDto;
  market: PredictionMarketDto;
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
  marketId: string;
  selectedOutcomeId: string;
  selectedOutcomeLabel: string;
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
  market: PredictionMarketDto | null;
}
