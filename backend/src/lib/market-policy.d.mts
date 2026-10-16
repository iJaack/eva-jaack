export const MARKET_POLICY_VERSION: string;
export const ALLOWED_MARKET_HOSTS: readonly string[];
export const ALLOWED_CATEGORIES: readonly string[];
export const ALLOWED_SEED_MARKET_IDS: readonly string[];

export type MarketPolicyRejectReason =
  | "foreign_domain"
  | "unclassified"
  | "category_not_allowlisted"
  | "prohibited_pattern"
  | "unlisted_seed"
  | "invalid_market"
  | "over_limit";

export interface PolicyMarket {
  marketId: string;
  provider: string;
  url?: string | null;
  title: string;
  category: string;
}

export interface MarketPolicyDecision {
  allowed: boolean;
  reason: MarketPolicyRejectReason | null;
}

export interface MarketPolicyProviderStatus {
  provider: "polymarket" | "kalshi";
  ok: boolean;
  error: string | null;
  fetched: number;
  kept: number;
  rejected: number;
  rejectedByReason: Record<string, number>;
}

export interface MarketPolicyStatus {
  version: string;
  providers: MarketPolicyProviderStatus[];
  rejectedByReason: Record<string, number>;
}

export function classifyTitleCategory(title: string): string;
export function canonicalAllowedCategory(category: string): string | null;
export function marketUrlHost(url: string | null | undefined): string | null;
export function evaluateMarketPolicy(market: PolicyMarket): MarketPolicyDecision;
export function buildMarketPolicyReport(providers: MarketPolicyProviderStatus[]): MarketPolicyStatus;
export function emptyMarketPolicyReport(): MarketPolicyStatus;
export function failedMarketPolicyReport(error: unknown): MarketPolicyStatus;
export function summarizeInjectedProviderMarkets<T extends PolicyMarket>(markets: T[]): {
  markets: T[];
  policy: MarketPolicyStatus;
};
