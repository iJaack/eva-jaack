import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import type {
  ClaimVerdict,
  CopyThesisPreviewResponse,
  MarketDetailResponse,
  MarketListResponse,
  PredictionMarketDto,
  PredictionMarketOutcomeDto,
  PredictionNetworkSummaryResponse,
  PredictionMarketProvider,
  PredictionMarketStatus,
  PredictorIdentityDto,
  PredictorDetailResponse,
  PredictorDto,
  PredictorListResponse,
  ThesisAnchorDto,
  ThesisAuthorDto,
  ThesisCreateResponse,
  ThesisDetailResponse,
  ThesisDto,
  ThesisFactSignalDto,
  ThesisListResponse,
  ThesisPredictionSignalDto,
  ThesisRevisionDto,
  ThesisSignalDto,
  ThesisSignalRole,
  XCommandDto,
  XCommandIngestResponse,
  XCommandType,
} from "../lib/api-types.js";

export interface ThesisIdentityInput {
  dynamicUserId: string;
  xHandle: string;
  xProfileId?: string | null;
  walletAddress?: string | null;
  walletSource?: "external" | "embedded" | null;
}

export interface ThesisPredictionSignalInput {
  marketId?: string | null;
  provider?: PredictionMarketProvider | null;
  externalId?: string | null;
  marketTitle?: string | null;
  marketUrl?: string | null;
  selectedOutcomeId?: string | null;
  selectedOutcomeLabel: string;
  resolvedOutcomeLabel?: string | null;
  oddsAtAdd?: number | null;
  currentOdds?: number | null;
  weight?: number | null;
  role?: ThesisSignalRole | null;
  rationale?: string | null;
  status?: PredictionMarketStatus | null;
}

export interface ThesisFactSignalInput {
  claimText: string;
  sourceUrl?: string | null;
  verifierVerdict?: ClaimVerdict | null;
  verifierScore?: number | null;
  reportUri?: string | null;
  reportHash?: string | null;
  weight?: number | null;
  role?: ThesisSignalRole | null;
  rationale?: string | null;
}

export interface ThesisCreateInput {
  identity: ThesisIdentityInput;
  title: string;
  body: string;
  predictionSignals?: ThesisPredictionSignalInput[];
  factSignals?: ThesisFactSignalInput[];
  evidenceLinks?: string[];
  sourceUrl?: string | null;
  sourcePostUrl?: string | null;
  counterToThesisId?: string | null;
}

export interface ThesisRevisionInput {
  identity: ThesisIdentityInput;
  body?: string | null;
  note?: string | null;
  signalUpdates?: Array<{
    signalId: string;
    currentOdds?: number | null;
    weight?: number | null;
    status?: PredictionMarketStatus | null;
    resolvedOutcomeLabel?: string | null;
  }>;
}

export interface XCommandIngestInput {
  mentionId: string;
  authorHandle: string;
  text: string;
  tweetUrl?: string | null;
  quotedTweetUrl?: string | null;
  replyToTweetUrl?: string | null;
}

type PredictionStore = {
  markets: PredictionMarketDto[];
  theses: ThesisDto[];
  commands: XCommandDto[];
};

type RegisteredIdentity = {
  wallet: `0x${string}`;
  agentId: string;
  trustScore: number;
};

type LiveMarketLoader = () => Promise<PredictionMarketDto[]>;
type PolymarketKeysetMarketResponse = {
  markets?: Record<string, unknown>[];
  next_cursor?: string;
};
type KalshiMarketListResponse = {
  markets?: Record<string, unknown>[];
  cursor?: string;
};

const localPredictionIndexPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../.data/eva-predictions/index.json",
);

export function resolvePredictionIndexPath(
  storageDir = config.storageDir,
  env: Record<string, string | undefined> = process.env,
): string {
  if (storageDir) return resolve(storageDir, "predictions.json");
  if (env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME || env.NETLIFY) {
    return resolve(tmpdir(), "eva-predictions/index.json");
  }
  return localPredictionIndexPath;
}
const liveMarketFetchTimeoutMs = 4500;
const liveMarketCacheTtlMs = 60_000;
const providerMarketLimit = 250;
const providerMarketPageLimit = 100;
const providerMarketMaxPages = 5;
const polymarketMarketsUrl =
  "https://gamma-api.polymarket.com/markets/keyset?closed=false&limit=100&order=volume_num&ascending=false";
const kalshiTradeApiBaseUrl = "https://external-api.kalshi.com/trade-api/v2";
const kalshiMarketsUrl = `${kalshiTradeApiBaseUrl}/markets?status=open&mve_filter=exclude&limit=${providerMarketPageLimit}`;
const kalshiSeriesTickers = ["KXCPI", "KXFED", "KXBTC", "KXETH"];
const optOutPattern = /\b(stop|unsubscribe|do not reply|don't reply|dont reply|leave me alone)\b/i;
const sensitivePattern = /\b(dox|address is|phone number|private key|seed phrase)\b/i;
const identityLoadTimeoutMs = 1200;
const dayMs = 24 * 60 * 60 * 1000;

const emptyResolution = {
  correct: null,
  resolvedOutcomeId: null,
  resolvedAt: null,
  oddsEdge: null,
  reputationImpact: "pending" as const,
  summary: null,
};

function isoFromNow(days: number): string {
  return new Date(Date.now() + days * dayMs).toISOString();
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * dayMs).toISOString();
}

function stableHash(data: unknown): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 24);
}

function fullHash(data: unknown): string {
  return `0x${createHash("sha256").update(JSON.stringify(data)).digest("hex")}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseUsd(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function titleCategory(title: string, fallback: string): string {
  const normalized = title.toLowerCase();
  if (/\b(bitcoin|btc|ethereum|crypto|solana)\b/.test(normalized)) return "Crypto";
  if (/\b(fed|inflation|rates?|cpi|gdp|recession|treasury)\b/.test(normalized)) return "Macro";
  if (/\b(election|president|senate|congress|nomination|trump|biden)\b/.test(normalized)) return "Politics";
  if (/\b(nba|nfl|mlb|nhl|soccer|match|game|wins?)\b/.test(normalized)) return "Sports";
  if (/\b(oil|iran|israel|russia|china|war|ceasefire)\b/.test(normalized)) return "Geopolitics";
  return fallback;
}

function isAllowedV1Market(market: PredictionMarketDto): boolean {
  const category = market.category.toLowerCase();
  const title = market.title.toLowerCase();
  return category !== "sports" && !/\b(nba|nfl|mlb|nhl|soccer|football|basketball|baseball|hockey|ufc|mma|tennis|golf|f1|formula 1|match|game|super bowl|world cup|champions league|premier league)\b/.test(title);
}

function applyV1MarketPolicy(markets: PredictionMarketDto[]): PredictionMarketDto[] {
  return markets.filter(isAllowedV1Market);
}

function centsToProbability(value: unknown): number | null {
  const parsed = parseUsd(value);
  if (parsed === null) return null;
  return parsed > 1 ? parsed / 100 : parsed;
}

function clampProbability(value: number): number {
  return Math.max(0.01, Math.min(0.99, value));
}

function clampWeight(value: number | null | undefined): number {
  if (value === undefined || value === null || Number.isNaN(value)) return 50;
  return Math.max(1, Math.min(100, Math.trunc(value)));
}

function normalizeRole(role: ThesisSignalRole | null | undefined): ThesisSignalRole {
  return role ?? "core";
}

function emptyAnchor(): ThesisAnchorDto {
  return {
    status: "unanchored",
    txHash: null,
    contractAddress: null,
    preparedAt: null,
    confirmedAt: null,
  };
}

function confirmedAnchor(txHash: `0x${string}`, confirmedAt: string): ThesisAnchorDto {
  return {
    status: "confirmed",
    txHash,
    contractAddress: config.evaThesisProtocol,
    preparedAt: confirmedAt,
    confirmedAt,
  };
}

function normalizeHandle(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) throw new Error("Connected X identity and wallet are required");
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function normalizeIdentity(identity: ThesisIdentityInput): ThesisAuthorDto {
  const wallet = identity.walletAddress?.trim();
  const source = identity.walletSource ?? null;
  if (!identity.dynamicUserId?.trim() || !identity.xHandle?.trim() || !wallet || !source || !wallet.match(/^0x[0-9a-fA-F]{40}$/)) {
    throw new Error("Connected X identity and wallet are required");
  }
  return {
    dynamicUserId: identity.dynamicUserId.trim(),
    xHandle: normalizeHandle(identity.xHandle),
    xProfileId: identity.xProfileId?.trim() || null,
    walletAddress: wallet as `0x${string}`,
    walletSource: source,
  };
}

async function fetchJsonWithTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), liveMarketFetchTimeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Market provider returned ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function appendCursor(url: string, cursor: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("cursor", cursor);
  return parsed.toString();
}

function appendPolymarketCursor(url: string, cursor: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("after_cursor", cursor);
  return parsed.toString();
}

function polymarketPageMarkets(page: PolymarketKeysetMarketResponse | Record<string, unknown>[]): Record<string, unknown>[] {
  return Array.isArray(page) ? page : page.markets ?? [];
}

function normalizePolymarketMarket(raw: Record<string, unknown>, index: number): PredictionMarketDto | null {
  const id = String(raw.id ?? raw.conditionId ?? "").trim();
  const title = String(raw.question ?? "").trim();
  if (!id || !title) return null;
  const outcomeLabels = parseJsonArray(raw.outcomes).map((entry) => String(entry));
  const outcomePrices = parseJsonArray(raw.outcomePrices).map((entry) => Number(entry));
  const outcomes = outcomeLabels
    .map<PredictionMarketOutcomeDto | null>((label, outcomeIndex) => {
      const price = outcomePrices[outcomeIndex];
      if (!label || !Number.isFinite(price)) return null;
      return {
        outcomeId: slugify(label) || `outcome-${outcomeIndex + 1}`,
        label,
        price: clampProbability(price),
      };
    })
    .filter((outcome): outcome is PredictionMarketOutcomeDto => outcome !== null);
  if (outcomes.length === 0) return null;
  const slug = String(raw.slug ?? id);
  const category = String(raw.category ?? "").trim();
  const timestamp = String(raw.updatedAt ?? raw.createdAt ?? new Date().toISOString());
  return {
    marketId: `polymarket-${slugify(slug) || id || index}`,
    provider: "polymarket",
    externalId: id,
    url: `https://polymarket.com/event/${slug}`,
    title,
    category: category || titleCategory(title, "Polymarket"),
    status: "open",
    volumeUsd: parseUsd(raw.volumeNum) ?? parseUsd(raw.volume),
    liquidityUsd: parseUsd(raw.liquidityNum) ?? parseUsd(raw.liquidity),
    closeTime: typeof raw.endDate === "string" ? raw.endDate : null,
    outcomes,
    linkedClaimIds: [],
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : timestamp,
    updatedAt: timestamp,
  };
}

function normalizeKalshiMarket(raw: Record<string, unknown>): PredictionMarketDto | null {
  const ticker = String(raw.ticker ?? "").trim();
  const title = String(raw.title ?? "").trim();
  if (!ticker || !title) return null;
  const yesBid = centsToProbability(raw.yes_bid_dollars);
  const yesAsk = centsToProbability(raw.yes_ask_dollars);
  const lastPrice = centsToProbability(raw.last_price_dollars);
  const yesPrice = yesBid !== null && yesAsk !== null && yesAsk > 0 ? (yesBid + yesAsk) / 2 : (lastPrice ?? yesAsk ?? yesBid ?? 0.5);
  const clampedYesPrice = clampProbability(yesPrice);
  const updatedAt = typeof raw.updated_time === "string" ? raw.updated_time : new Date().toISOString();
  const createdAt = typeof raw.created_time === "string" ? raw.created_time : updatedAt;
  return {
    marketId: `kalshi-${slugify(ticker)}`,
    provider: "kalshi",
    externalId: ticker,
    url: `https://kalshi.com/markets/${ticker.toLowerCase()}`,
    title,
    category: titleCategory(title, "Kalshi"),
    status: "open",
    volumeUsd: parseUsd(raw.volume_dollars) ?? parseUsd(raw.volume_fp) ?? parseUsd(raw.volume),
    liquidityUsd: parseUsd(raw.liquidity_dollars),
    closeTime: typeof raw.close_time === "string" ? raw.close_time : null,
    outcomes: [
      { outcomeId: "yes", label: "Yes", price: clampedYesPrice },
      { outcomeId: "no", label: "No", price: clampProbability(1 - clampedYesPrice) },
    ],
    linkedClaimIds: [],
    createdAt,
    updatedAt,
  };
}

function marketRank(market: PredictionMarketDto): number {
  return (market.volumeUsd ?? 0) + (market.liquidityUsd ?? 0);
}

function dedupeRawMarkets(markets: Record<string, unknown>[]): Record<string, unknown>[] {
  const byId = new Map<string, Record<string, unknown>>();
  for (const market of markets) {
    const id = String(market.id ?? market.conditionId ?? market.ticker ?? market.slug ?? "").trim();
    if (id && !byId.has(id)) byId.set(id, market);
  }
  return [...byId.values()];
}

async function loadPolymarketMarketPages(initialUrl: string): Promise<Record<string, unknown>[]> {
  const markets: Record<string, unknown>[] = [];
  let url = initialUrl;
  for (let pageIndex = 0; pageIndex < providerMarketMaxPages; pageIndex++) {
    const page = await fetchJsonWithTimeout<PolymarketKeysetMarketResponse | Record<string, unknown>[]>(url);
    markets.push(...polymarketPageMarkets(page));
    if (Array.isArray(page) || !page.next_cursor || markets.length >= providerMarketLimit) break;
    url = appendPolymarketCursor(initialUrl, page.next_cursor);
  }
  return markets;
}

async function loadPolymarketMarkets(): Promise<PredictionMarketDto[]> {
  const rawMarkets = await loadPolymarketMarketPages(polymarketMarketsUrl);
  return dedupeRawMarkets(rawMarkets)
    .map((market, index) => normalizePolymarketMarket(market, index))
    .filter((market): market is PredictionMarketDto => market !== null)
    .filter(isAllowedV1Market)
    .sort((left, right) => marketRank(right) - marketRank(left))
    .slice(0, providerMarketLimit);
}

async function loadKalshiMarketPages(initialUrl: string): Promise<Record<string, unknown>[]> {
  const markets: Record<string, unknown>[] = [];
  let url = initialUrl;
  for (let pageIndex = 0; pageIndex < providerMarketMaxPages; pageIndex++) {
    const page = await fetchJsonWithTimeout<KalshiMarketListResponse>(url);
    markets.push(...(page.markets ?? []));
    if (!page.cursor || markets.length >= providerMarketLimit) break;
    url = appendCursor(initialUrl, page.cursor);
  }
  return markets;
}

async function loadKalshiMarkets(): Promise<PredictionMarketDto[]> {
  const responses = await Promise.allSettled([
    loadKalshiMarketPages(kalshiMarketsUrl),
    ...kalshiSeriesTickers.map((ticker) =>
      loadKalshiMarketPages(
        `${kalshiTradeApiBaseUrl}/markets?status=open&series_ticker=${encodeURIComponent(ticker)}&limit=100`,
      ),
    ),
  ]);
  return dedupeRawMarkets(responses.flatMap((result) => (result.status === "fulfilled" ? result.value : [])))
    .map((market) => normalizeKalshiMarket(market))
    .filter((market): market is PredictionMarketDto => market !== null)
    .filter(isAllowedV1Market)
    .sort((left, right) => marketRank(right) - marketRank(left))
    .slice(0, providerMarketLimit);
}

async function loadProviderMarkets(): Promise<PredictionMarketDto[]> {
  const [polymarket, kalshi] = await Promise.allSettled([loadPolymarketMarkets(), loadKalshiMarkets()]);
  return [
    ...(polymarket.status === "fulfilled" ? polymarket.value : []),
    ...(kalshi.status === "fulfilled" ? kalshi.value : []),
  ];
}

function mergeProviderMarkets(store: PredictionStore, providerMarkets: PredictionMarketDto[]): PredictionStore {
  const allowedProviderMarkets = applyV1MarketPolicy(providerMarkets);
  const existingNonProviderMarkets = store.markets.filter((market) => {
    if (!isAllowedV1Market(market)) return false;
    if (market.provider !== "polymarket" && market.provider !== "kalshi") return true;
    return !allowedProviderMarkets.some((providerMarket) => providerMarket.marketId === market.marketId);
  });
  return {
    ...store,
    markets: [...existingNonProviderMarkets, ...allowedProviderMarkets],
  };
}

function mergeSeedMarkets(markets: PredictionMarketDto[]): PredictionMarketDto[] {
  const byId = new Map(seedStore().markets.map((market) => [market.marketId, market]));
  for (const market of markets) byId.set(market.marketId, market);
  return [...byId.values()];
}

function mergeSeedTheses(theses: ThesisDto[]): ThesisDto[] {
  const byId = new Map(theses.map((thesis) => [thesis.thesisId, thesis]));
  for (const thesis of seedStore().theses) byId.set(thesis.thesisId, thesis);
  return [...byId.values()];
}

function seedStore(): PredictionStore {
  const seededAt = isoDaysAgo(1);
  const markets: PredictionMarketDto[] = [
    {
      marketId: "spacex-ipo-before-2027",
      provider: "manual",
      externalId: "spacex-ipo-2027",
      url: "https://polymarket.com/",
      title: "Will SpaceX IPO before the end of 2027?",
      category: "Private Markets",
      status: "open",
      volumeUsd: 12500000,
      liquidityUsd: 1100000,
      closeTime: isoFromNow(580),
      outcomes: [
        { outcomeId: "yes", label: "Yes", price: 0.24 },
        { outcomeId: "no", label: "No", price: 0.76 },
      ],
      linkedClaimIds: [],
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      marketId: "fed-hold-next-meeting",
      provider: "external",
      externalId: "fed-hold",
      url: "https://kalshi.com/",
      title: "Will the Fed hold rates at the next meeting?",
      category: "Macro",
      status: "open",
      volumeUsd: 115500000,
      liquidityUsd: 5200000,
      closeTime: isoFromNow(56),
      outcomes: [
        { outcomeId: "hold", label: "Hold", price: 0.58 },
        { outcomeId: "cut", label: "Cut", price: 0.29 },
        { outcomeId: "hike", label: "Hike", price: 0.13 },
      ],
      linkedClaimIds: [],
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      marketId: "btc-110k-window",
      provider: "external",
      externalId: "btc-110k",
      url: "https://polymarket.com/",
      title: "Will Bitcoin trade above $110k before this market closes?",
      category: "Crypto",
      status: "open",
      volumeUsd: 52600000,
      liquidityUsd: 3900000,
      closeTime: isoFromNow(69),
      outcomes: [
        { outcomeId: "yes", label: "Yes", price: 0.37 },
        { outcomeId: "no", label: "No", price: 0.63 },
      ],
      linkedClaimIds: [],
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ];

  return {
    markets,
    theses: [seedSpaceXThesis(markets)],
    commands: [],
  };
}

function seedSpaceXThesis(markets: PredictionMarketDto[]): ThesisDto {
  const createdAt = "2026-06-05T20:10:00.000Z";
  const title = "SpaceX IPO liquidity rotation thesis";
  const body =
    "SpaceX IPO anticipation is absorbing speculative liquidity now; after the IPO path becomes explicit, risk markets can reprice as attention and liquidity rotate.";
  const anchoredAt = "2026-06-05T20:30:25.000Z";
  const thesisAnchor = confirmedAnchor("0xe02eae437e8dbbc9c2842c0ac087c7a51a76d164c3d484f058042aaa45c7f3bb", "2026-06-05T20:28:50.000Z");
  const author: ThesisAuthorDto = {
    dynamicUserId: "evalanche:spacex-ipo-liquidity",
    xHandle: "@spacethesis",
    xProfileId: "spaceX-ipo-liquidity",
    walletAddress: "0x0fe61780bd5508b3C99e420662050e5560608cA4",
    walletSource: "embedded",
  };
  const thesisId = `thesis-${stableHash({ title: title.toLowerCase(), author: author.xHandle.toLowerCase(), body })}`;
  const signals: ThesisSignalDto[] = [
    buildPredictionSignal(
      markets,
      {
        marketId: "spacex-ipo-before-2027",
        marketTitle: "Will SpaceX IPO before the end of 2027?",
        marketUrl: "https://polymarket.com/",
        provider: "manual",
        selectedOutcomeId: "yes",
        selectedOutcomeLabel: "Yes",
        oddsAtAdd: 0.24,
        currentOdds: 0.24,
        weight: 60,
        role: "core",
        rationale: "Primary market signal for IPO timing; if timing probability rises, liquidity rotation becomes more actionable.",
        status: "open",
      },
      createdAt,
    ),
    buildPredictionSignal(
      markets,
      {
        marketTitle: "Private-market liquidity tightness before a major SpaceX listing",
        marketUrl: "https://eva.jaack.me/",
        provider: "manual",
        selectedOutcomeLabel: "Liquidity remains constrained before IPO clarity",
        oddsAtAdd: 0.55,
        currentOdds: 0.55,
        weight: 20,
        role: "second_order",
        rationale: "Second-order signal: capital waits for liquidity and allocation clarity before rotating into adjacent risk markets.",
        status: "open",
      },
      createdAt,
    ),
    buildFactSignal(
      {
        claimText: "SpaceX has used private tender offers and secondary liquidity before pursuing a public listing.",
        sourceUrl: "https://www.spacex.com/",
        verifierVerdict: "unverifiable_yet",
        verifierScore: 50,
        weight: 10,
        role: "lateral",
        rationale: "Tender and secondary-market facts inform whether IPO anticipation can absorb liquidity before a listing path is explicit.",
      },
      createdAt,
    ),
    buildFactSignal(
      {
        claimText: "The thesis should be revised when IPO timing markets, private-market liquidity facts, or adjacent risk-market signals materially change.",
        sourceUrl: "https://eva.jaack.me/",
        verifierVerdict: "non_falsifiable",
        verifierScore: 50,
        weight: 10,
        role: "third_order",
        rationale: "This is the operating rule for the living post: market changes should produce visible thesis history.",
      },
      createdAt,
    ),
  ];
  const revision = { ...revisionFor(1, body, "Initial SpaceX liquidity thesis published.", signals, null, createdAt), anchor: thesisAnchor };
  signals[0] = { ...signals[0], anchor: confirmedAnchor("0xa0941cdfa04ba2090bef61ca290872e8dd380402fb0d616034751b2d961d73bd", "2026-06-05T20:28:53.000Z") };
  signals[1] = { ...signals[1], anchor: confirmedAnchor("0x475041c32d4f117f9d6ca5af76be42d5fe8adc8e4afed2bf895c4ba3e96e2414", "2026-06-05T20:28:55.000Z") };
  signals[2] = { ...signals[2], anchor: confirmedAnchor("0xee81e2573c828de318ef1b85dcac35c1b313753feb3793ca5daf7277961827eb", "2026-06-05T20:30:22.000Z") };
  signals[3] = { ...signals[3], anchor: confirmedAnchor("0x4a3e564bc769b7ecf2f0818054fe6e7b1f3aca0420b09a8036d12c322966db20", anchoredAt) };
  return {
    thesisId,
    title,
    slug: `${slugify(title)}-${thesisId.slice(-6)}`,
    author,
    body,
    currentRevision: revision,
    revisions: [revision],
    signals,
    currentScore: revision.scoreAfter,
    evidenceLinks: ["https://eva.jaack.me/markets"],
    sourceUrl: "https://polymarket.com/",
    sourcePostUrl: null,
    counterToThesisId: null,
    copiedCount: 0,
    challengedCount: 0,
    status: "active",
    resolution: { ...emptyResolution },
    timeline: [
      {
        timelineId: `tl-${stableHash({ thesisId, createdAt, action: "created" })}`,
        action: "created",
        at: createdAt,
        note: "Thesis published with initial signal basket.",
        scoreBefore: null,
          scoreAfter: revision.scoreAfter,
        },
        {
          timelineId: `tl-${stableHash({ thesisId, anchoredAt, action: "anchored" })}`,
          action: "anchored",
          at: anchoredAt,
          note: "Thesis and four signals anchored to EvaThesisProtocol on Avalanche.",
          scoreBefore: revision.scoreAfter,
          scoreAfter: revision.scoreAfter,
        },
      ],
    anchor: thesisAnchor,
    createdAt,
    updatedAt: anchoredAt,
  };
}

function isMarketLive(market: PredictionMarketDto, now = Date.now()): boolean {
  if (market.status !== "open") return false;
  if (!market.closeTime) return true;
  const closeMs = Date.parse(market.closeTime);
  return Number.isNaN(closeMs) || closeMs > now;
}

function commandTypeFor(text: string): XCommandType {
  const value = text.toLowerCase();
  if (value.includes("track")) return "track";
  if (value.includes("counter")) return "counter";
  if (value.includes("copy")) return "copy";
  if (value.includes("thesis")) return "thesis";
  return "unknown";
}

function stripBotMention(text: string): string {
  return text.replace(/@evapredicts/gi, " ").replace(/\s+/g, " ").trim();
}

function normalizeProbability(value: number | null | undefined, fallback: number): number {
  if (value === undefined || value === null || Number.isNaN(value)) return fallback;
  return clampProbability(Number(value));
}

function predictionSignalScore(signal: Pick<ThesisPredictionSignalDto, "status" | "selectedOutcomeLabel" | "resolvedOutcomeLabel" | "oddsAtAdd" | "currentOdds">): number {
  if (signal.status === "resolved") {
    if (!signal.resolvedOutcomeLabel) return 50;
    return signal.resolvedOutcomeLabel.toLowerCase() === signal.selectedOutcomeLabel.toLowerCase() ? 100 : 0;
  }
  return Math.round(Math.max(0, Math.min(100, 50 + (signal.currentOdds - signal.oddsAtAdd) * 100)));
}

function weightedScore(signals: ThesisSignalDto[]): number {
  const active = signals.filter((signal) => signal.weight > 0);
  const totalWeight = active.reduce((sum, signal) => sum + signal.weight, 0);
  if (totalWeight === 0) return 50;
  return Math.round(active.reduce((sum, signal) => sum + signal.signalScore * signal.weight, 0) / totalWeight);
}

function marketForSignal(markets: PredictionMarketDto[], input: ThesisPredictionSignalInput): PredictionMarketDto | null {
  if (!input.marketId) return null;
  return markets.find((market) => market.marketId === input.marketId) ?? null;
}

function outcomeForMarket(market: PredictionMarketDto | null, input: ThesisPredictionSignalInput): PredictionMarketOutcomeDto | null {
  if (!market) return null;
  if (input.selectedOutcomeId) {
    const byId = market.outcomes.find((outcome) => outcome.outcomeId === input.selectedOutcomeId);
    if (byId) return byId;
  }
  return market.outcomes.find((outcome) => outcome.label.toLowerCase() === input.selectedOutcomeLabel.toLowerCase()) ?? market.outcomes[0] ?? null;
}

function buildPredictionSignal(markets: PredictionMarketDto[], input: ThesisPredictionSignalInput, now: string): ThesisPredictionSignalDto {
  const market = marketForSignal(markets, input);
  const outcome = outcomeForMarket(market, input);
  const currentOdds = normalizeProbability(input.currentOdds, outcome?.price ?? input.oddsAtAdd ?? 0.5);
  const oddsAtAdd = normalizeProbability(input.oddsAtAdd, currentOdds);
  const title = market?.title ?? input.marketTitle?.trim() ?? "Prediction signal";
  const selectedOutcomeLabel = input.selectedOutcomeLabel.trim() || outcome?.label || "Yes";
  const base = {
    signalId: `sig-${stableHash({ title, selectedOutcomeLabel, now, kind: "prediction" })}`,
    kind: "prediction_market" as const,
    role: normalizeRole(input.role),
    title,
    rationale: input.rationale?.trim() || null,
    weight: clampWeight(input.weight),
    signalScore: 50,
    addedAt: now,
    updatedAt: now,
    anchor: emptyAnchor(),
    marketId: market?.marketId ?? null,
    provider: market?.provider ?? input.provider ?? "manual",
    externalId: market?.externalId ?? input.externalId?.trim() ?? null,
    marketUrl: market?.url ?? input.marketUrl?.trim() ?? null,
    selectedOutcomeId: outcome?.outcomeId ?? input.selectedOutcomeId?.trim() ?? null,
    selectedOutcomeLabel,
    resolvedOutcomeLabel: input.resolvedOutcomeLabel?.trim() || null,
    oddsAtAdd,
    currentOdds,
    status: input.status ?? market?.status ?? "open",
  };
  return {
    ...base,
    signalScore: predictionSignalScore(base),
  };
}

function buildFactSignal(input: ThesisFactSignalInput, now: string): ThesisFactSignalDto {
  const score = Math.max(0, Math.min(100, Math.round(input.verifierScore ?? 50)));
  return {
    signalId: `sig-${stableHash({ claimText: input.claimText, sourceUrl: input.sourceUrl ?? null, now, kind: "fact" })}`,
    kind: "fact",
    role: normalizeRole(input.role),
    title: input.claimText.length > 80 ? `${input.claimText.slice(0, 77)}...` : input.claimText,
    rationale: input.rationale?.trim() || null,
    weight: clampWeight(input.weight),
    signalScore: score,
    addedAt: now,
    updatedAt: now,
    anchor: emptyAnchor(),
    claimText: input.claimText.trim(),
    sourceUrl: input.sourceUrl?.trim() || null,
    verifierVerdict: input.verifierVerdict ?? "unverifiable_yet",
    verifierScore: score,
    reportUri: input.reportUri?.trim() || null,
    reportHash: input.reportHash?.trim() || null,
  };
}

function revisionFor(version: number, body: string, note: string | null, signals: ThesisSignalDto[], scoreBefore: number | null, createdAt: string): ThesisRevisionDto {
  const scoreAfter = weightedScore(signals);
  return {
    revisionId: `rev-${stableHash({ version, body, signals, createdAt })}`,
    version,
    body,
    note,
    signalSnapshot: structuredClone(signals),
    scoreBefore,
    scoreAfter,
    createdAt,
    anchor: emptyAnchor(),
  };
}

function buildThesisDraft(markets: PredictionMarketDto[], input: ThesisCreateInput, author: ThesisAuthorDto, createdAt: string): ThesisDto {
  const title = input.title.trim();
  const body = input.body.trim();
  const thesisId = `thesis-${stableHash({ title: title.toLowerCase(), author: author.xHandle.toLowerCase(), body })}`;
  const signals = [
    ...(input.predictionSignals ?? []).map((signal) => buildPredictionSignal(markets, signal, createdAt)),
    ...(input.factSignals ?? []).map((signal) => buildFactSignal(signal, createdAt)),
  ];
  const revision = revisionFor(1, body, "Initial thesis published.", signals, null, createdAt);
  const score = revision.scoreAfter;
  return {
    thesisId,
    title,
    slug: `${slugify(title)}-${thesisId.slice(-6)}`,
    author,
    body,
    currentRevision: revision,
    revisions: [revision],
    signals,
    currentScore: score,
    evidenceLinks: input.evidenceLinks?.filter((link) => link.trim()).map((link) => link.trim()) ?? [],
    sourceUrl: input.sourceUrl?.trim() || null,
    sourcePostUrl: input.sourcePostUrl?.trim() || null,
    counterToThesisId: input.counterToThesisId?.trim() || null,
    copiedCount: 0,
    challengedCount: input.counterToThesisId ? 1 : 0,
    status: "active",
    resolution: { ...emptyResolution },
    timeline: [
      {
        timelineId: `tl-${stableHash({ thesisId, createdAt, action: "created" })}`,
        action: "created",
        at: createdAt,
        note: "Thesis published with initial signal basket.",
        scoreBefore: null,
        scoreAfter: score,
      },
    ],
    anchor: emptyAnchor(),
    createdAt,
    updatedAt: createdAt,
  };
}

function bestCategory(theses: ThesisDto[]): string | null {
  const counts = new Map<string, number>();
  for (const thesis of theses) {
    for (const signal of thesis.signals) {
      if (signal.kind !== "prediction_market") continue;
      const category = signal.provider === "manual" ? "Thesis" : signal.provider;
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function accuracyFor(theses: ThesisDto[]): number | null {
  const resolvedSignals = theses.flatMap((thesis) =>
    thesis.signals.filter((signal): signal is ThesisPredictionSignalDto => signal.kind === "prediction_market" && signal.status === "resolved"),
  );
  if (resolvedSignals.length === 0) return null;
  const correct = resolvedSignals.filter((signal) => signal.signalScore === 100).length;
  return Math.round((correct / resolvedSignals.length) * 100);
}

function avgOddsEdgeFor(theses: ThesisDto[]): number | null {
  const edges = theses
    .flatMap((thesis) => thesis.signals)
    .filter((signal): signal is ThesisPredictionSignalDto => signal.kind === "prediction_market")
    .map((signal) => signal.currentOdds - signal.oddsAtAdd);
  if (edges.length === 0) return null;
  return Math.round((edges.reduce((sum, edge) => sum + edge, 0) / edges.length) * 100);
}

export class LocalPredictionLayerService {
  private liveMarketCache: { loadedAt: number; markets: PredictionMarketDto[] } | null = null;

  constructor(
    private readonly indexPath = resolvePredictionIndexPath(),
    private readonly registeredIdentityLoader: () => Promise<PredictorIdentityDto[]> = async () => [],
    private readonly liveMarketLoader: LiveMarketLoader = loadProviderMarkets,
  ) {}

  async getSummary(): Promise<PredictionNetworkSummaryResponse> {
    const [store, predictors] = await Promise.all([this.readStore(), this.listPredictors()]);
    const now = Date.now();
    const theses = [...store.theses]
      .filter((thesis) => thesis.status === "active")
      .sort((left, right) => right.currentScore - left.currentScore)
      .slice(0, 8);
    const markets = store.markets
      .filter((market) => isMarketLive(market, now))
      .sort((left, right) => (right.volumeUsd ?? 0) - (left.volumeUsd ?? 0))
      .slice(0, 8);
    return {
      markets,
      theses,
      predictors: predictors.predictors.slice(0, 6),
      stats: {
        marketCount: store.markets.length,
        openThesisCount: store.theses.filter((thesis) => thesis.status === "active").length,
        weeklyActivePredictors: new Set(store.theses.map((thesis) => thesis.author.xHandle)).size,
        copiedThesisEvents: theses.reduce((sum, thesis) => sum + thesis.copiedCount, 0),
      },
    };
  }

  async listMarkets(): Promise<MarketListResponse> {
    const store = await this.readStore();
    const now = Date.now();
    const markets = [...store.markets].sort((left, right) => {
      const liveDelta = Number(isMarketLive(right, now)) - Number(isMarketLive(left, now));
      if (liveDelta !== 0) return liveDelta;
      return (right.volumeUsd ?? 0) - (left.volumeUsd ?? 0);
    });
    return { count: markets.length, markets };
  }

  async getMarket(marketId: string): Promise<MarketDetailResponse | null> {
    const store = await this.readStore();
    const market = store.markets.find((entry) => entry.marketId === marketId);
    if (!market) return null;
    return {
      market,
      theses: store.theses
        .filter((thesis) =>
          thesis.signals.some((signal) => signal.kind === "prediction_market" && signal.marketId === marketId),
        )
        .sort((left, right) => right.currentScore - left.currentScore),
    };
  }

  async listTheses(filters: { marketId?: string | null; author?: string | null } = {}): Promise<ThesisListResponse> {
    const store = await this.readStore();
    const author = filters.author ? normalizeHandle(filters.author).toLowerCase() : null;
    const theses = store.theses
      .filter((thesis) => !filters.marketId || thesis.signals.some((signal) => signal.kind === "prediction_market" && signal.marketId === filters.marketId))
      .filter((thesis) => !author || thesis.author.xHandle.toLowerCase() === author)
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
    return { count: theses.length, theses };
  }

  async getThesis(thesisId: string): Promise<ThesisDetailResponse | null> {
    const [store, predictors] = await Promise.all([this.readStore(), this.listPredictors()]);
    const thesis = store.theses.find((entry) => entry.thesisId === thesisId || entry.slug === thesisId);
    if (!thesis) return null;
    const marketIds = new Set(thesis.signals.flatMap((signal) => (signal.kind === "prediction_market" && signal.marketId ? [signal.marketId] : [])));
    const markets = store.markets.filter((market) => marketIds.has(market.marketId));
    const predictor = predictors.predictors.find((entry) => entry.handle.toLowerCase() === thesis.author.xHandle.toLowerCase());
    if (!predictor) return null;
    return {
      thesis,
      markets,
      predictor,
      counters: store.theses.filter((entry) => entry.counterToThesisId === thesis.thesisId),
    };
  }

  async createThesis(input: ThesisCreateInput): Promise<ThesisCreateResponse> {
    const author = normalizeIdentity(input.identity);
    if (!input.title.trim() || !input.body.trim()) throw new Error("title and body are required");
    const store = await this.readStore();
    const createdAt = new Date().toISOString();
    const thesis = buildThesisDraft(store.markets, input, author, createdAt);
    const existing = store.theses.find((entry) => entry.thesisId === thesis.thesisId);
    if (existing) {
      return { created: false, thesis: existing, markets: this.marketsForThesis(store.markets, existing) };
    }
    store.theses.push(thesis);
    await this.writeStore(store);
    return { created: true, thesis, markets: this.marketsForThesis(store.markets, thesis) };
  }

  async previewThesis(input: ThesisCreateInput): Promise<ThesisDetailResponse> {
    const author = normalizeIdentity(input.identity);
    if (!input.title.trim() || !input.body.trim()) throw new Error("title and body are required");
    const store = await this.readStore();
    const thesis = buildThesisDraft(store.markets, input, author, new Date().toISOString());
    const predictors = await this.listPredictors();
    return {
      thesis,
      markets: this.marketsForThesis(store.markets, thesis),
      predictor:
        predictors.predictors.find((entry) => entry.handle.toLowerCase() === thesis.author.xHandle.toLowerCase()) ??
        ({
          predictorId: `predictor-${stableHash(thesis.author.walletAddress.toLowerCase())}`,
          handle: thesis.author.xHandle,
          wallet: thesis.author.walletAddress,
          agentId: null,
          registered: false,
          profileState: "unclaimed",
          trustScore: 0,
          openTheses: 0,
          resolvedTheses: 0,
          accuracy: null,
          avgOddsEdge: null,
          copiedTheses: 0,
          bestCategory: null,
          badges: [],
        } satisfies PredictorDto),
      counters: [],
    };
  }

  async previewRevision(thesisId: string, input: ThesisRevisionInput): Promise<ThesisDetailResponse | null> {
    const actor = normalizeIdentity(input.identity);
    const store = await this.readStore();
    const original = store.theses.find((entry) => entry.thesisId === thesisId || entry.slug === thesisId);
    if (!original) return null;
    if (original.author.walletAddress.toLowerCase() !== actor.walletAddress.toLowerCase()) {
      throw new Error("Only the thesis author can revise this thesis");
    }

    const thesis = structuredClone(original);
    const now = new Date().toISOString();
    const scoreBefore = thesis.currentScore;
    const signals = thesis.signals.map((signal) => {
      const update = input.signalUpdates?.find((entry) => entry.signalId === signal.signalId);
      if (!update || signal.kind !== "prediction_market") return signal;
      const next = {
        ...signal,
        currentOdds: normalizeProbability(update.currentOdds, signal.currentOdds),
        weight: clampWeight(update.weight ?? signal.weight),
        status: update.status ?? signal.status,
        resolvedOutcomeLabel: update.resolvedOutcomeLabel?.trim() || signal.resolvedOutcomeLabel,
        updatedAt: now,
      };
      return {
        ...next,
        signalScore: predictionSignalScore(next),
      };
    });
    const body = input.body?.trim() || thesis.body;
    const revision = revisionFor(thesis.revisions.length + 1, body, input.note?.trim() || null, signals, scoreBefore, now);
    thesis.body = body;
    thesis.signals = signals;
    thesis.currentRevision = revision;
    thesis.revisions.push(revision);
    thesis.currentScore = revision.scoreAfter;
    thesis.updatedAt = now;
    thesis.timeline.push({
      timelineId: `tl-${stableHash({ thesisId, now, action: "revised" })}`,
      action: "revised",
      at: now,
      note: input.note?.trim() || "Thesis revised.",
      scoreBefore,
      scoreAfter: thesis.currentScore,
    });

    const predictors = await this.listPredictors();
    const predictor = predictors.predictors.find((entry) => entry.handle.toLowerCase() === thesis.author.xHandle.toLowerCase());
    if (!predictor) return null;
    return {
      thesis,
      markets: this.marketsForThesis(store.markets, thesis),
      predictor,
      counters: store.theses.filter((entry) => entry.counterToThesisId === thesis.thesisId),
    };
  }

  async recordRevision(thesisId: string, input: ThesisRevisionInput): Promise<ThesisDetailResponse | null> {
    const actor = normalizeIdentity(input.identity);
    const store = await this.readStore();
    const thesis = store.theses.find((entry) => entry.thesisId === thesisId || entry.slug === thesisId);
    if (!thesis) return null;
    if (thesis.author.walletAddress.toLowerCase() !== actor.walletAddress.toLowerCase()) {
      throw new Error("Only the thesis author can revise this thesis");
    }
    const now = new Date().toISOString();
    const scoreBefore = thesis.currentScore;
    const signals = thesis.signals.map((signal) => {
      const update = input.signalUpdates?.find((entry) => entry.signalId === signal.signalId);
      if (!update || signal.kind !== "prediction_market") return signal;
      const next = {
        ...signal,
        currentOdds: normalizeProbability(update.currentOdds, signal.currentOdds),
        weight: clampWeight(update.weight ?? signal.weight),
        status: update.status ?? signal.status,
        resolvedOutcomeLabel: update.resolvedOutcomeLabel?.trim() || signal.resolvedOutcomeLabel,
        updatedAt: now,
      };
      return {
        ...next,
        signalScore: predictionSignalScore(next),
      };
    });
    const body = input.body?.trim() || thesis.body;
    const revision = revisionFor(thesis.revisions.length + 1, body, input.note?.trim() || null, signals, scoreBefore, now);
    thesis.body = body;
    thesis.signals = signals;
    thesis.currentRevision = revision;
    thesis.revisions.push(revision);
    thesis.currentScore = revision.scoreAfter;
    thesis.updatedAt = now;
    thesis.timeline.push({
      timelineId: `tl-${stableHash({ thesisId, now, action: "revised" })}`,
      action: "revised",
      at: now,
      note: input.note?.trim() || "Thesis revised.",
      scoreBefore,
      scoreAfter: thesis.currentScore,
    });
    await this.writeStore(store);
    return this.getThesis(thesis.thesisId);
  }

  async markThesisAnchorConfirmed(thesisId: string, txHash: `0x${string}`, confirmedAt: string): Promise<ThesisDetailResponse | null> {
    const store = await this.readStore();
    const thesis = store.theses.find((entry) => entry.thesisId === thesisId || entry.slug === thesisId);
    if (!thesis) return null;

    const anchor = confirmedAnchor(txHash, confirmedAt);
    thesis.anchor = anchor;
    thesis.currentRevision = { ...thesis.currentRevision, anchor };
    thesis.revisions = thesis.revisions.map((revision) => (revision.revisionId === thesis.currentRevision.revisionId ? { ...revision, anchor } : revision));
    thesis.updatedAt = confirmedAt;
    thesis.timeline.push({
      timelineId: `tl-${stableHash({ thesisId, txHash, action: "anchored-confirmed" })}`,
      action: "anchored",
      at: confirmedAt,
      note: "Anchor transaction confirmed.",
      scoreBefore: null,
      scoreAfter: thesis.currentScore,
    });

    await this.writeStore(store);
    return this.getThesis(thesis.thesisId);
  }

  async markCurrentRevisionAnchorConfirmed(thesisId: string, txHash: `0x${string}`, confirmedAt: string): Promise<ThesisDetailResponse | null> {
    const store = await this.readStore();
    const thesis = store.theses.find((entry) => entry.thesisId === thesisId || entry.slug === thesisId);
    if (!thesis) return null;

    const anchor = confirmedAnchor(txHash, confirmedAt);
    thesis.currentRevision = { ...thesis.currentRevision, anchor };
    thesis.revisions = thesis.revisions.map((revision) => (revision.revisionId === thesis.currentRevision.revisionId ? { ...revision, anchor } : revision));
    thesis.updatedAt = confirmedAt;
    thesis.timeline.push({
      timelineId: `tl-${stableHash({ thesisId, revisionId: thesis.currentRevision.revisionId, txHash, action: "revision-anchor-confirmed" })}`,
      action: "anchored",
      at: confirmedAt,
      note: `Revision v${thesis.currentRevision.version} anchor transaction confirmed.`,
      scoreBefore: null,
      scoreAfter: thesis.currentScore,
    });

    await this.writeStore(store);
    return this.getThesis(thesis.thesisId);
  }

  async listPredictors(): Promise<PredictorListResponse> {
    const [store, identities] = await Promise.all([this.readStore(), this.loadRegisteredIdentities()]);
    const byHandle = new Map<string, ThesisDto[]>();
    for (const thesis of store.theses) {
      const key = thesis.author.xHandle.toLowerCase();
      byHandle.set(key, [...(byHandle.get(key) ?? []), thesis]);
    }
    const predictors: PredictorDto[] = [...byHandle.entries()].map(([handleKey, theses]) => {
      const identity = this.identityFor(theses, identities);
      const copiedTheses = theses.reduce((sum, thesis) => sum + thesis.copiedCount, 0);
      const accuracy = accuracyFor(theses);
      const badges = [
        identity ? "Wallet-linked" : "Record-only",
        copiedTheses >= 10 ? "Copied" : null,
        theses.some((thesis) => thesis.signals.some((signal) => signal.kind === "fact")) ? "Evidence-backed" : null,
      ].filter((badge): badge is string => Boolean(badge));
      return {
        predictorId: handleKey.replace(/^@/, ""),
        handle: theses[0]!.author.xHandle,
        wallet: identity?.wallet ?? theses[0]!.author.walletAddress,
        agentId: identity?.agentId ?? null,
        registered: Boolean(identity),
        profileState: identity ? "registered" : "unclaimed",
        trustScore: identity?.trustScore ?? 50,
        openTheses: theses.filter((thesis) => thesis.status === "active").length,
        resolvedTheses: theses.filter((thesis) => thesis.status === "resolved").length,
        accuracy,
        avgOddsEdge: avgOddsEdgeFor(theses),
        copiedTheses,
        bestCategory: bestCategory(theses),
        badges,
      };
    });
    return {
      count: predictors.length,
      predictors: predictors.sort((left, right) => {
        if (right.trustScore !== left.trustScore) return right.trustScore - left.trustScore;
        return right.copiedTheses - left.copiedTheses;
      }),
    };
  }

  async getPredictor(id: string): Promise<PredictorDetailResponse | null> {
    const normalized = normalizeHandle(id).toLowerCase();
    const [store, predictors] = await Promise.all([this.readStore(), this.listPredictors()]);
    const predictor = predictors.predictors.find(
      (entry) => entry.handle.toLowerCase() === normalized || entry.predictorId.toLowerCase() === id.replace(/^@/, "").toLowerCase(),
    );
    if (!predictor) return null;
    return {
      predictor,
      theses: store.theses
        .filter((thesis) => thesis.author.xHandle.toLowerCase() === predictor.handle.toLowerCase())
        .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)),
    };
  }

  async getCopyPreview(thesisId: string): Promise<CopyThesisPreviewResponse | null> {
    const detail = await this.getThesis(thesisId);
    if (!detail) return null;
    const firstMarket = detail.thesis.signals.find((signal): signal is ThesisPredictionSignalDto => signal.kind === "prediction_market");
    return {
      thesisId,
      marketId: firstMarket?.marketId ?? null,
      selectedOutcomeId: firstMarket?.selectedOutcomeId ?? null,
      selectedOutcomeLabel: firstMarket?.selectedOutcomeLabel ?? null,
      originalOdds: firstMarket?.oddsAtAdd ?? 0,
      currentOdds: firstMarket?.currentOdds ?? 0,
      venueUrl: firstMarket?.marketUrl ?? null,
      execution: "external-link-only",
      warning: "Eva records thesis intent and links to external venues. It does not execute trades in v1.",
    };
  }

  async ingestXCommand(input: XCommandIngestInput): Promise<XCommandIngestResponse> {
    const store = await this.readStore();
    const commandType = commandTypeFor(input.text);
    const commandId = `xcmd-${stableHash({ mentionId: input.mentionId, authorHandle: input.authorHandle })}`;
    const existing = store.commands.find((command) => command.commandId === commandId);
    if (existing) {
      return { accepted: existing.status !== "ignored", command: existing, thesis: null, markets: [] };
    }
    const sourcePostUrl = input.quotedTweetUrl?.trim() || input.replyToTweetUrl?.trim() || input.tweetUrl?.trim() || null;
    const command: XCommandDto = {
      commandId,
      mentionId: input.mentionId,
      authorHandle: normalizeHandle(input.authorHandle),
      sourcePostUrl,
      commandType,
      status: "accepted",
      responseText: null,
      responseUrl: null,
      createdAt: new Date().toISOString(),
    };
    if (optOutPattern.test(input.text) || commandType === "unknown") {
      command.status = "ignored";
      command.responseText = optOutPattern.test(input.text) ? "Opt-out acknowledged." : null;
      store.commands.push(command);
      await this.writeStore(store);
      return { accepted: false, command, thesis: null, markets: [] };
    }
    if (sensitivePattern.test(input.text)) {
      command.status = "moderation_required";
      store.commands.push(command);
      await this.writeStore(store);
      return { accepted: false, command, thesis: null, markets: [] };
    }
    command.status = "responded";
    command.responseUrl = "/compose";
    command.responseText = "Open Eva to turn this into a multi-signal thesis page.";
    store.commands.push(command);
    await this.writeStore(store);
    return { accepted: true, command, thesis: null, markets: [] };
  }

  private marketsForThesis(markets: PredictionMarketDto[], thesis: ThesisDto): PredictionMarketDto[] {
    const ids = new Set(thesis.signals.flatMap((signal) => (signal.kind === "prediction_market" && signal.marketId ? [signal.marketId] : [])));
    return markets.filter((market) => ids.has(market.marketId));
  }

  private async loadRegisteredIdentities(): Promise<RegisteredIdentity[]> {
    try {
      const identities = await Promise.race([
        this.registeredIdentityLoader(),
        new Promise<PredictorIdentityDto[]>((resolve) => {
          setTimeout(() => resolve([]), identityLoadTimeoutMs);
        }),
      ]);
      return identities
        .filter((identity) => identity.registered)
        .map((identity) => ({
          wallet: identity.address,
          agentId: identity.agentId,
          trustScore: identity.trustScore,
        }));
    } catch {
      return [];
    }
  }

  private identityFor(theses: ThesisDto[], identities: RegisteredIdentity[]): RegisteredIdentity | null {
    for (const thesis of theses) {
      const match = identities.find((identity) => identity.wallet.toLowerCase() === thesis.author.walletAddress.toLowerCase());
      if (match) return match;
    }
    return null;
  }

  private async readStore(): Promise<PredictionStore> {
    try {
      const raw = await readFile(this.indexPath, "utf8");
      const parsed = JSON.parse(raw) as Partial<PredictionStore>;
      const store = {
        markets: Array.isArray(parsed.markets) ? applyV1MarketPolicy(mergeSeedMarkets(parsed.markets)) : seedStore().markets,
        theses: Array.isArray(parsed.theses) ? mergeSeedTheses(parsed.theses) : seedStore().theses,
        commands: Array.isArray(parsed.commands) ? parsed.commands : [],
      };
      return mergeProviderMarkets(store, await this.loadLiveMarkets());
    } catch {
      return mergeProviderMarkets(seedStore(), await this.loadLiveMarkets());
    }
  }

  private async loadLiveMarkets(): Promise<PredictionMarketDto[]> {
    if (this.liveMarketCache && Date.now() - this.liveMarketCache.loadedAt < liveMarketCacheTtlMs) {
      return this.liveMarketCache.markets;
    }
    try {
      const markets = await this.liveMarketLoader();
      this.liveMarketCache = { loadedAt: Date.now(), markets };
      return markets;
    } catch {
      return [];
    }
  }

  private async writeStore(store: PredictionStore): Promise<void> {
    await mkdir(dirname(this.indexPath), { recursive: true });
    await writeFile(this.indexPath, JSON.stringify(store, null, 2), "utf8");
  }
}

let cachedPredictionLayerService: LocalPredictionLayerService | null = null;

export function getPredictionLayerService(): LocalPredictionLayerService {
  if (!cachedPredictionLayerService) {
    cachedPredictionLayerService = new LocalPredictionLayerService();
  }
  return cachedPredictionLayerService;
}

export function thesisRevisionHash(thesis: ThesisDto): `0x${string}` {
  return fullHash({
    thesisId: thesis.thesisId,
    revisionId: thesis.currentRevision.revisionId,
    score: thesis.currentScore,
    signals: thesis.signals.map((signal) => ({
      signalId: signal.signalId,
      kind: signal.kind,
      weight: signal.weight,
      score: signal.signalScore,
    })),
  }) as `0x${string}`;
}
