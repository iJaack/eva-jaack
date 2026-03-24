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
