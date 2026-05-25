import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import type {
  CopyThesisPreviewResponse,
  CuratorDto,
  MarketDetailResponse,
  MarketListResponse,
  PredictionMarketDto,
  PredictionMarketOutcomeDto,
  PredictionNetworkSummaryResponse,
  PredictorDetailResponse,
  PredictorDto,
  PredictorListResponse,
  ThesisCreateResponse,
  ThesisDetailResponse,
  ThesisDto,
  ThesisListResponse,
  ThesisResolutionDto,
  XCommandDto,
  XCommandIngestResponse,
  XCommandType,
} from "../lib/api-types.js";
import { listCurators } from "./trust-graph.js";

export interface ThesisCreateInput {
  authorHandle: string;
  authorWallet?: string | null;
  authorAgentId?: string | null;
  marketId?: string | null;
  marketTitle?: string | null;
  marketUrl?: string | null;
  category?: string | null;
  selectedOutcomeId?: string | null;
  selectedOutcomeLabel?: string | null;
  oddsAtPost?: number | null;
  conviction?: number | null;
  rationale: string;
  evidenceLinks?: string[];
  sourceUrl?: string | null;
  sourcePostUrl?: string | null;
  counterToThesisId?: string | null;
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
type PolymarketSearchResponse = {
  events?: Array<Record<string, unknown> & { markets?: Record<string, unknown>[] }>;
};
type KalshiMarketListResponse = {
  markets?: Record<string, unknown>[];
};

const defaultPredictionIndexPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../.data/eva-predictions/index.json",
);
const liveMarketFetchTimeoutMs = 4500;
const liveMarketCacheTtlMs = 60_000;
const providerMarketLimit = 25;
const polymarketMarketsUrl =
  "https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=100&order=volumeNum&ascending=false";
const polymarketSearchTerms = ["bitcoin", "ethereum", "solana", "fed", "inflation", "gdp", "recession"];
const kalshiTradeApiBaseUrl = "https://external-api.kalshi.com/trade-api/v2";
const kalshiMarketsUrl = `${kalshiTradeApiBaseUrl}/markets?status=open&mve_filter=exclude&limit=1000`;
const kalshiSeriesTickers = ["KXCPI", "KXFED", "KXBTC", "KXETH"];
const xPostPattern = /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[^\s/]+\/status\/\d+/i;
const marketUrlPattern = /https?:\/\/[^\s]+/i;
const optOutPattern = /\b(stop|unsubscribe|do not reply|don't reply|dont reply|leave me alone)\b/i;
const sensitivePattern = /\b(dox|address is|phone number|private key|seed phrase)\b/i;
const identityLoadTimeoutMs = 1200;

const emptyResolution: ThesisResolutionDto = {
  correct: null,
  resolvedOutcomeId: null,
  resolvedAt: null,
  oddsEdge: null,
  reputationImpact: "pending",
  summary: null,
};

const dayMs = 24 * 60 * 60 * 1000;

function isoFromNow(days: number): string {
  return new Date(Date.now() + days * dayMs).toISOString();
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * dayMs).toISOString();
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
  if ((market.provider === "polymarket" || market.provider === "kalshi") && category !== "crypto" && category !== "macro") {
    return false;
  }
  if (category === "politics" || category === "sports") {
    return false;
  }

  const title = market.title.toLowerCase();
  return !/\b(election|president|senate|congress|nomination|trump|biden|nba|nfl|mlb|nhl|soccer|match|game|war|ceasefire|assassination|murder|killed|dies|death|criminal|investigation|arrest|indict|convict|hostage|shooting)\b/.test(title);
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

async function loadPolymarketMarkets(): Promise<PredictionMarketDto[]> {
  const rawMarkets = await fetchJsonWithTimeout<Record<string, unknown>[]>(polymarketMarketsUrl);
  const searchedMarkets = await Promise.allSettled(polymarketSearchTerms.map(loadPolymarketSearchMarkets));

  return dedupeRawMarkets([
    ...rawMarkets,
    ...searchedMarkets.flatMap((result) => (result.status === "fulfilled" ? result.value : [])),
  ])
    .map((market, index) => normalizePolymarketMarket(market, index))
    .filter((market): market is PredictionMarketDto => market !== null)
    .filter(isAllowedV1Market)
    .sort((left, right) => marketRank(right) - marketRank(left))
    .slice(0, providerMarketLimit);
}

async function loadPolymarketSearchMarkets(term: string): Promise<Record<string, unknown>[]> {
  const response = await fetchJsonWithTimeout<PolymarketSearchResponse>(
    `https://gamma-api.polymarket.com/public-search?q=${encodeURIComponent(term)}&limit=10`,
  );

  return (response.events ?? [])
    .flatMap((event) => event.markets ?? [])
    .filter((market) => market.active !== false && market.closed !== true);
}

async function loadKalshiMarkets(): Promise<PredictionMarketDto[]> {
  const responses = await Promise.allSettled([
    fetchJsonWithTimeout<KalshiMarketListResponse>(kalshiMarketsUrl),
    ...kalshiSeriesTickers.map((ticker) =>
      fetchJsonWithTimeout<KalshiMarketListResponse>(
        `${kalshiTradeApiBaseUrl}/markets?status=open&series_ticker=${encodeURIComponent(ticker)}&limit=100`,
      ),
    ),
  ]);

  return dedupeRawMarkets(responses.flatMap((result) => (result.status === "fulfilled" ? result.value.markets ?? [] : [])))
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

function seedStore(): PredictionStore {
  const seededAt = isoDaysAgo(1);

  const markets: PredictionMarketDto[] = [
    {
      marketId: "crude-oil-95-window",
      provider: "external",
      externalId: "crude-oil-95",
      url: "https://polymarket.com/",
      title: "Will crude oil trade above $95 before this market closes?",
      category: "Geopolitics",
      status: "open",
      volumeUsd: 31200000,
      liquidityUsd: 2100000,
      closeTime: isoFromNow(45),
      outcomes: [
        { outcomeId: "yes", label: "Yes", price: 0.54 },
        { outcomeId: "no", label: "No", price: 0.46 },
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
    theses: [
      {
        thesisId: "thesis-crude-95-nairlof",
        marketId: "crude-oil-95-window",
        authorHandle: "@nairlof",
        authorWallet: null,
        authorAgentId: null,
        selectedOutcomeId: "yes",
        selectedOutcomeLabel: "Yes",
        oddsAtPost: 0.41,
        currentOdds: 0.54,
        conviction: 82,
        rationale:
          "Shipping risk, spare capacity questions, and inventory draws keep oil upside underpriced.",
        evidenceLinks: ["https://x.com/0xNairlof"],
        sourceUrl: "https://x.com/0xNairlof",
        sourcePostUrl: "https://x.com/0xNairlof/status/1914720000000000000",
        counterToThesisId: null,
        copiedCount: 12,
        challengedCount: 4,
        status: "open",
        resolution: { ...emptyResolution },
        createdAt: seededAt,
        updatedAt: seededAt,
      },
      {
        thesisId: "thesis-fed-hold-macro",
        marketId: "fed-hold-next-meeting",
        authorHandle: "@macrodesk",
        authorWallet: config.evaSovereignWallet,
        authorAgentId: config.evaAgentId,
        selectedOutcomeId: "hold",
        selectedOutcomeLabel: "Hold",
        oddsAtPost: 0.44,
        currentOdds: 0.58,
        conviction: 68,
        rationale: "Inflation prints are not soft enough for a cut, and labor weakness is not deep enough for an emergency pivot.",
        evidenceLinks: ["https://www.federalreserve.gov/"],
        sourceUrl: null,
        sourcePostUrl: null,
        counterToThesisId: null,
        copiedCount: 9,
        challengedCount: 2,
        status: "open",
        resolution: { ...emptyResolution },
        createdAt: isoDaysAgo(2),
        updatedAt: isoDaysAgo(2),
      },
      {
        thesisId: "thesis-btc-no-quarter",
        marketId: "btc-110k-window",
        authorHandle: "@chainodds",
        authorWallet: null,
        authorAgentId: null,
        selectedOutcomeId: "no",
        selectedOutcomeLabel: "No",
        oddsAtPost: 0.55,
        currentOdds: 0.63,
        conviction: 61,
        rationale: "ETF inflow strength is real, but realized volatility and liquidity argue against a clean breakout.",
        evidenceLinks: [],
        sourceUrl: null,
        sourcePostUrl: "https://x.com/chainodds/status/1914100000000000000",
        counterToThesisId: null,
        copiedCount: 6,
        challengedCount: 1,
        status: "open",
        resolution: { ...emptyResolution },
        createdAt: isoDaysAgo(3),
        updatedAt: isoDaysAgo(3),
      },
    ],
    commands: [],
  };
}

function stableHash(data: unknown): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 24);
}

function normalizeHandle(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) throw new Error("authorHandle is required");
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function normalizeUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

function normalizeProbability(value: number | null | undefined, fallback: number): number {
  if (value === undefined || value === null || Number.isNaN(value)) return fallback;
  return Math.max(0.01, Math.min(0.99, Number(value)));
}

function normalizeConviction(value: number | null | undefined): number {
  if (value === undefined || value === null || Number.isNaN(value)) return 50;
  return Math.max(1, Math.min(100, Math.trunc(value)));
}

function titleFromUrl(url: string | null): string {
  if (!url) return "External prediction market";
  try {
    const parsed = new URL(url);
    return `Prediction market on ${parsed.hostname.replace(/^www\./, "")}`;
  } catch {
    return "External prediction market";
  }
}

function providerFromUrl(url: string | null): PredictionMarketDto["provider"] {
  if (!url) return "manual";
  if (url.includes("polymarket")) return "polymarket";
  if (url.includes("kalshi")) return "kalshi";
  return "external";
}

function outcomeForMarket(market: PredictionMarketDto, outcomeId: string | null | undefined, label: string | null | undefined) {
  const byId = outcomeId ? market.outcomes.find((outcome) => outcome.outcomeId === outcomeId) : null;
  if (byId) return byId;
  const byLabel = label ? market.outcomes.find((outcome) => outcome.label.toLowerCase() === label.toLowerCase()) : null;
  return byLabel ?? market.outcomes[0]!;
}

function commandTypeFor(text: string): XCommandType {
  const value = text.toLowerCase();
  if (value.includes("track")) return "track";
  if (value.includes("verify")) return "verify";
  if (value.includes("counter")) return "counter";
  if (value.includes("copy")) return "copy";
  if (value.includes("thesis")) return "thesis";
  return "unknown";
}

function stripBotMention(text: string): string {
  return text.replace(/@evapredicts/gi, " ").replace(/\s+/g, " ").trim();
}

function isRecent(isoDate: string): boolean {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - Date.parse(isoDate) <= weekMs;
}

function isMarketLive(market: PredictionMarketDto, now = Date.now()): boolean {
  if (market.status !== "open") return false;
  if (!market.closeTime) return true;
  const closeMs = Date.parse(market.closeTime);
  return Number.isNaN(closeMs) || closeMs > now;
}

function thesisHasLiveMarket(thesis: ThesisDto, markets: PredictionMarketDto[], now = Date.now()): boolean {
  if (thesis.status !== "open") return false;
  const market = markets.find((entry) => entry.marketId === thesis.marketId);
  return market ? isMarketLive(market, now) : false;
}

function bestCategory(theses: ThesisDto[], markets: PredictionMarketDto[]): string | null {
  const counts = new Map<string, number>();
  for (const thesis of theses) {
    const market = markets.find((entry) => entry.marketId === thesis.marketId);
    if (!market) continue;
    counts.set(market.category, (counts.get(market.category) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function accuracyFor(theses: ThesisDto[]): number | null {
  const resolved = theses.filter((thesis) => thesis.resolution.correct !== null);
  if (resolved.length === 0) return null;
  const correct = resolved.filter((thesis) => thesis.resolution.correct).length;
  return Math.round((correct / resolved.length) * 100);
}

function avgOddsEdgeFor(theses: ThesisDto[]): number | null {
  const edges = theses
    .map((thesis) => thesis.resolution.oddsEdge)
    .filter((edge): edge is number => edge !== null);
  if (edges.length === 0) return null;
  return Math.round((edges.reduce((sum, edge) => sum + edge, 0) / edges.length) * 100);
}

export class LocalPredictionLayerService {
  private liveMarketCache: { loadedAt: number; markets: PredictionMarketDto[] } | null = null;

  constructor(
    private readonly indexPath = config.storageDir
      ? resolve(config.storageDir, "predictions.json")
      : defaultPredictionIndexPath,
    private readonly registeredIdentityLoader: () => Promise<CuratorDto[]> = listCurators,
    private readonly liveMarketLoader: LiveMarketLoader = loadProviderMarkets,
  ) {}

  async getSummary(): Promise<PredictionNetworkSummaryResponse> {
    const [store, predictors] = await Promise.all([this.readStore(), this.listPredictors()]);
    const now = Date.now();
    const theses = store.theses
      .filter((thesis) => thesisHasLiveMarket(thesis, store.markets, now))
      .sort((left, right) => right.copiedCount - left.copiedCount)
      .slice(0, 8);
    const markets = store.markets
      .filter((market) => isMarketLive(market, now))
      .sort((left, right) => (right.volumeUsd ?? 0) - (left.volumeUsd ?? 0))
      .slice(0, 6);

    return {
      markets,
      theses,
      predictors: predictors.predictors.slice(0, 6),
      stats: {
        marketCount: store.markets.length,
        openThesisCount: store.theses.filter((thesis) => thesisHasLiveMarket(thesis, store.markets, now)).length,
        weeklyActivePredictors: new Set(
          store.theses
            .filter((thesis) => thesisHasLiveMarket(thesis, store.markets, now))
            .filter((thesis) => isRecent(thesis.createdAt))
            .map((thesis) => thesis.authorHandle),
        ).size,
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
        .filter((thesis) => thesis.marketId === marketId)
        .sort((left, right) => right.copiedCount - left.copiedCount),
    };
  }

  async listTheses(filters: { marketId?: string | null; author?: string | null } = {}): Promise<ThesisListResponse> {
    const store = await this.readStore();
    const author = filters.author ? normalizeHandle(filters.author).toLowerCase() : null;
    const theses = store.theses
      .filter((thesis) => !filters.marketId || thesis.marketId === filters.marketId)
      .filter((thesis) => !author || thesis.authorHandle.toLowerCase() === author)
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

    return { count: theses.length, theses };
  }

  async getThesis(thesisId: string): Promise<ThesisDetailResponse | null> {
    const [store, predictors] = await Promise.all([this.readStore(), this.listPredictors()]);
    const thesis = store.theses.find((entry) => entry.thesisId === thesisId);
    if (!thesis) return null;
    const market = store.markets.find((entry) => entry.marketId === thesis.marketId);
    if (!market) return null;
    const predictor = predictors.predictors.find((entry) => entry.handle.toLowerCase() === thesis.authorHandle.toLowerCase());
    if (!predictor) return null;
    return {
      thesis,
      market,
      predictor,
      counters: store.theses.filter((entry) => entry.counterToThesisId === thesis.thesisId),
    };
  }

  async createThesis(input: ThesisCreateInput): Promise<ThesisCreateResponse> {
    if (!input.rationale.trim()) throw new Error("rationale is required");

    const store = await this.readStore();
    const market = this.resolveMarket(store, input);
    const selected = outcomeForMarket(market, input.selectedOutcomeId, input.selectedOutcomeLabel);
    const authorHandle = normalizeHandle(input.authorHandle);
    const oddsAtPost = normalizeProbability(input.oddsAtPost, selected.price);
    const createdAt = new Date().toISOString();
    const thesisId = `thesis-${stableHash({
      authorHandle: authorHandle.toLowerCase(),
      marketId: market.marketId,
      selectedOutcomeId: selected.outcomeId,
      rationale: input.rationale.trim().toLowerCase(),
      sourcePostUrl: input.sourcePostUrl ?? null,
    })}`;
    const existing = store.theses.find((thesis) => thesis.thesisId === thesisId);
    if (existing) {
      return { created: false, thesis: existing, market };
    }

    const thesis: ThesisDto = {
      thesisId,
      marketId: market.marketId,
      authorHandle,
      authorWallet: input.authorWallet?.match(/^0x[0-9a-fA-F]{40}$/) ? (input.authorWallet as `0x${string}`) : null,
      authorAgentId: input.authorAgentId?.trim() || null,
      selectedOutcomeId: selected.outcomeId,
      selectedOutcomeLabel: selected.label,
      oddsAtPost,
      currentOdds: selected.price,
      conviction: normalizeConviction(input.conviction),
      rationale: input.rationale.trim(),
      evidenceLinks: input.evidenceLinks?.filter((link) => link.trim()).map((link) => link.trim()) ?? [],
      sourceUrl: normalizeUrl(input.sourceUrl),
      sourcePostUrl: normalizeUrl(input.sourcePostUrl),
      counterToThesisId: input.counterToThesisId?.trim() || null,
      copiedCount: 0,
      challengedCount: input.counterToThesisId ? 1 : 0,
      status: "open",
      resolution: { ...emptyResolution },
      createdAt,
      updatedAt: createdAt,
    };

    store.theses.push(thesis);
    await this.writeStore(store);
    return { created: true, thesis, market };
  }

  async listPredictors(): Promise<PredictorListResponse> {
    const [store, identities] = await Promise.all([this.readStore(), this.loadRegisteredIdentities()]);
    const byHandle = new Map<string, ThesisDto[]>();
    for (const thesis of store.theses) {
      const key = thesis.authorHandle.toLowerCase();
      byHandle.set(key, [...(byHandle.get(key) ?? []), thesis]);
    }

    const predictors: PredictorDto[] = [...byHandle.entries()].map(([handleKey, theses]) => {
      const identity = this.identityFor(theses, identities);
      const copiedTheses = theses.reduce((sum, thesis) => sum + thesis.copiedCount, 0);
      const accuracy = accuracyFor(theses);
      const badges = [
        identity ? "Graph-backed" : "Unclaimed",
        copiedTheses >= 10 ? "Copied" : null,
        theses.some((thesis) => thesis.evidenceLinks.length > 0) ? "Evidence-backed" : null,
      ].filter((badge): badge is string => Boolean(badge));

      return {
        predictorId: handleKey.replace(/^@/, ""),
        handle: theses[0]!.authorHandle,
        wallet: identity?.wallet ?? null,
        agentId: identity?.agentId ?? theses.find((thesis) => thesis.authorAgentId)?.authorAgentId ?? null,
        registered: Boolean(identity),
        profileState: identity ? "registered" : "unclaimed",
        trustScore: identity?.trustScore ?? 50,
        openTheses: theses.filter((thesis) => thesis.status === "open").length,
        resolvedTheses: theses.filter((thesis) => thesis.status === "resolved").length,
        accuracy,
        avgOddsEdge: avgOddsEdgeFor(theses),
        copiedTheses,
        bestCategory: bestCategory(theses, store.markets),
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
        .filter((thesis) => thesis.authorHandle.toLowerCase() === predictor.handle.toLowerCase())
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    };
  }

  async getCopyPreview(thesisId: string): Promise<CopyThesisPreviewResponse | null> {
    const detail = await this.getThesis(thesisId);
    if (!detail) return null;
    return {
      thesisId,
      marketId: detail.market.marketId,
      selectedOutcomeId: detail.thesis.selectedOutcomeId,
      selectedOutcomeLabel: detail.thesis.selectedOutcomeLabel,
      originalOdds: detail.thesis.oddsAtPost,
      currentOdds: detail.thesis.currentOdds,
      venueUrl: detail.market.url,
      execution: "external-link-only",
      warning: "Eva does not execute trades in v1. This preview links to the external venue and records copy intent only.",
    };
  }

  async ingestXCommand(input: XCommandIngestInput): Promise<XCommandIngestResponse> {
    const store = await this.readStore();
    const commandType = commandTypeFor(input.text);
    const commandId = `xcmd-${stableHash({ mentionId: input.mentionId, authorHandle: input.authorHandle })}`;
    const existing = store.commands.find((command) => command.commandId === commandId);
    if (existing) {
      return { accepted: existing.status !== "ignored", command: existing, thesis: null, market: null };
    }

    const sourcePostUrl = normalizeUrl(input.quotedTweetUrl) ?? normalizeUrl(input.replyToTweetUrl) ?? normalizeUrl(input.tweetUrl);
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
      return { accepted: false, command, thesis: null, market: null };
    }

    if (sensitivePattern.test(input.text)) {
      command.status = "moderation_required";
      store.commands.push(command);
      await this.writeStore(store);
      return { accepted: false, command, thesis: null, market: null };
    }

    let thesis: ThesisDto | null = null;
    let market: PredictionMarketDto | null = null;
    if (commandType === "track" || commandType === "thesis" || commandType === "counter") {
      const textWithoutMention = stripBotMention(input.text);
      const url = sourcePostUrl ?? textWithoutMention.match(marketUrlPattern)?.[0] ?? null;
      const created = await this.createThesis({
        authorHandle: input.authorHandle,
        marketTitle: titleFromUrl(url),
        marketUrl: url,
        selectedOutcomeLabel: "Yes",
        rationale: textWithoutMention || "Prediction thesis created from an explicit @evapredicts command.",
        evidenceLinks: url ? [url] : [],
        sourceUrl: url,
        sourcePostUrl: textWithoutMention.match(xPostPattern)?.[0] ?? sourcePostUrl,
      });
      thesis = created.thesis;
      market = created.market;
      command.status = "responded";
      command.responseUrl = `/thesis/${thesis.thesisId}`;
      command.responseText = `Tracked. ${thesis.authorHandle} now has a public Eva thesis page: ${command.responseUrl}`;
    } else if (commandType === "copy") {
      const candidate = [...store.theses].sort((left, right) => right.copiedCount - left.copiedCount)[0] ?? null;
      command.status = candidate ? "responded" : "ignored";
      command.responseUrl = candidate ? `/thesis/${candidate.thesisId}` : null;
      command.responseText = candidate
        ? `Copy preview ready. Eva links to the external venue without executing trades: ${command.responseUrl}`
        : "No thesis is available to copy yet.";
    } else if (commandType === "verify") {
      command.status = "responded";
      command.responseUrl = sourcePostUrl ? `/claims` : `/verify`;
      command.responseText = `Queued for evidence review. Open Eva for the verification context: ${command.responseUrl}`;
    }

    const latestStore = await this.readStore();
    latestStore.commands.push(command);
    await this.writeStore(latestStore);
    return { accepted: command.status === "responded", command, thesis, market };
  }

  private resolveMarket(store: PredictionStore, input: ThesisCreateInput): PredictionMarketDto {
    const found = input.marketId ? store.markets.find((market) => market.marketId === input.marketId) : null;
    if (found) return found;

    const marketUrl = normalizeUrl(input.marketUrl);
    const title = input.marketTitle?.trim() || titleFromUrl(marketUrl);
    const marketId = `market-${stableHash({ title: title.toLowerCase(), marketUrl })}`;
    const existing = store.markets.find((market) => market.marketId === marketId);
    if (existing) return existing;

    const createdAt = new Date().toISOString();
    const market: PredictionMarketDto = {
      marketId,
      provider: providerFromUrl(marketUrl),
      externalId: null,
      url: marketUrl,
      title,
      category: input.category?.trim() || "General",
      status: "open",
      volumeUsd: null,
      liquidityUsd: null,
      closeTime: null,
      outcomes: [
        { outcomeId: "yes", label: "Yes", price: 0.5 },
        { outcomeId: "no", label: "No", price: 0.5 },
      ],
      linkedClaimIds: [],
      createdAt,
      updatedAt: createdAt,
    };
    store.markets.push(market);
    return market;
  }

  private async loadRegisteredIdentities(): Promise<RegisteredIdentity[]> {
    try {
      const curators = await Promise.race([
        this.registeredIdentityLoader(),
        new Promise<CuratorDto[]>((resolve) => {
          setTimeout(() => resolve([]), identityLoadTimeoutMs);
        }),
      ]);
      return curators
        .filter((curator) => curator.registered)
        .map((curator) => ({
          wallet: curator.address,
          agentId: curator.curatorAgentId,
          trustScore: curator.trustScore,
        }));
    } catch {
      return [];
    }
  }

  private identityFor(theses: ThesisDto[], identities: RegisteredIdentity[]): RegisteredIdentity | null {
    for (const thesis of theses) {
      if (thesis.authorWallet) {
        const match = identities.find((identity) => identity.wallet.toLowerCase() === thesis.authorWallet?.toLowerCase());
        if (match) return match;
      }
      if (thesis.authorAgentId) {
        const match = identities.find((identity) => identity.agentId === thesis.authorAgentId);
        if (match) return match;
      }
    }
    return null;
  }

  private async readStore(): Promise<PredictionStore> {
    try {
      const raw = await readFile(this.indexPath, "utf8");
      const parsed = JSON.parse(raw) as Partial<PredictionStore>;
      const store = {
        markets: Array.isArray(parsed.markets) ? applyV1MarketPolicy(parsed.markets) : seedStore().markets,
        theses: Array.isArray(parsed.theses) ? parsed.theses : seedStore().theses,
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
