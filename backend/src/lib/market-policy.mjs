/**
 * Fail-closed V1 market policy shared by the backend and scripts/audit-market-feed.mjs.
 * Patterns live here so the API and the GET-only audit cannot drift.
 */

export const MARKET_POLICY_VERSION = "v1-allowlist";

export const ALLOWED_MARKET_HOSTS = ["polymarket.com", "kalshi.com"];

export const ALLOWED_CATEGORIES = [
  "Macro",
  "Crypto",
  "Company/Liquidity",
  "Technology",
  "Private Markets",
];

export const ALLOWED_SEED_MARKET_IDS = [
  "spacex-ipo-before-2027",
  "fed-hold-next-meeting",
  "btc-110k-window",
];

const providerNameCategoryPattern = /^(polymarket|kalshi|manual|external|unknown|uncategorized|unclassified)$/i;

const v1ProhibitedCategoryPattern = /\b(sports?|politics?|elections?|geopolitics?|war|crime|criminal)\b/i;

const v1ProhibitedMarketPatterns = [
  /\b(nba|nfl|mlb|nhl|soccer|football|basketball|baseball|hockey|kbo|ufc|mma|tennis|golf|f1|formula 1|match|game|inning|first inning|run line|moneyline|point spread|home run|touchdown|pitcher|batter|super bowl|world cup|champions league|premier league|sports? event(?:s)?|sports? contract(?:s)?)\b/i,
  /\b(kt wiz|hanwha eagles|lg twins|kiwoom heroes|lotte giants|doosan bears|kia tigers|samsung lions|nc dinos|ssg landers)\b/i,
  /\b(elections?|presidential|president|nomination|nominee|primary|caucus|senate|senator|congress|parliament|prime minister|mayor|governor|supreme court|scotus|balance of power|trump|biden|harris|putin|xi jinping|jinping|netanyahu|starmer|macron|erdo(?:g|ğ)?an|bernie|sanders)\b/i,
  /\b(war|invade|invasion|blockade|ceasefire|missile|nuclear|airstrike|bombing|attack|terror|taiwan|ukraine|gaza|israel|iran|russia)\b/i,
  /\b(assassinat(?:e|ed|ion)?|murder|killed|shooting|death|die|dies|dead|hospitalized|illness|injury|pregnan(?:t|cy)|marriage|divorce)\b/i,
  /\b(jesus christ|messiah|rapture|second coming)\b/i,
  /\b(criminal|indict(?:ed|ment)?|convict(?:ed|ion)?|arrest(?:ed)?|prison|jail|trial|investigation|charged with)\b/i,
  /\b(tweet|tweets|post on x|post on twitter|instagram|tiktok|youtube|say on (?:x|twitter)|mention on (?:x|twitter)|endorse(?:s|d|ment)?)\b/i,
  /\b(gta\s*(?:vi|6)|grand theft auto)\b/i,
  /\b(james bond|next bond)\b/i,
  /\b(new\s+[^?]{1,80}\s+album|album\s+(?:before|released?|drops?|drop|by))\b/i,
];

const titleCategoryRules = [
  { category: "Crypto", pattern: /\b(bitcoin|btc|ethereum|ether|crypto|solana)\b/i },
  { category: "Macro", pattern: /\b(fed|inflation|rates?|cpi|gdp|recession|treasury|fomc|unemployment|nonfarm|payrolls)\b/i },
  { category: "Politics", pattern: /\b(election|president|senate|congress|nomination|endorse|trump|biden|bernie|macron|erdo(?:g|ğ)?an)\b/i },
  { category: "Sports", pattern: /\b(nba|nfl|mlb|nhl|soccer|football|basketball|baseball|hockey|kbo|match|game|wins?|inning|run line|moneyline)\b/i },
  { category: "Geopolitics", pattern: /\b(oil|iran|israel|russia|china|war|ceasefire)\b/i },
  { category: "Private Markets", pattern: /\b(spacex|pre-ipo|private markets?)\b/i },
  { category: "Technology", pattern: /\b(nvidia|semiconductor|openai|chatgpt|llm|artificial intelligence|gpt-\d+|claude|gemini|ai)\b/i },
  { category: "Company/Liquidity", pattern: /\b(ipo|earnings|market cap|share price|stock price|buyback|dividend|acquired|acquisition)\b/i },
];

export function classifyTitleCategory(title) {
  const normalized = String(title ?? "");
  for (const rule of titleCategoryRules) {
    if (rule.pattern.test(normalized)) return rule.category;
  }
  return "";
}

export function canonicalAllowedCategory(category) {
  const trimmed = String(category ?? "").trim();
  if (!trimmed) return null;
  return ALLOWED_CATEGORIES.find((entry) => entry.toLowerCase() === trimmed.toLowerCase()) ?? null;
}

export function marketUrlHost(url) {
  if (typeof url !== "string" || !url.trim()) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function evaluateMarketPolicy(market) {
  const provider = String(market?.provider ?? "");
  const marketId = String(market?.marketId ?? "");
  const title = String(market?.title ?? "");
  const category = String(market?.category ?? "").trim();
  const url = typeof market?.url === "string" ? market.url : "";

  if (provider === "manual" || provider === "external") {
    if (!ALLOWED_SEED_MARKET_IDS.includes(marketId)) {
      return { allowed: false, reason: "unlisted_seed" };
    }
  }

  const host = marketUrlHost(url);
  if (!host || !ALLOWED_MARKET_HOSTS.includes(host)) {
    return { allowed: false, reason: "foreign_domain" };
  }

  const searchable = `${title} ${category} ${url}`;
  if (v1ProhibitedCategoryPattern.test(category) || v1ProhibitedMarketPatterns.some((pattern) => pattern.test(searchable))) {
    return { allowed: false, reason: "prohibited_pattern" };
  }

  if (!category || providerNameCategoryPattern.test(category)) {
    return { allowed: false, reason: "unclassified" };
  }

  if (!canonicalAllowedCategory(category)) {
    return { allowed: false, reason: "category_not_allowlisted" };
  }

  return { allowed: true, reason: null };
}

export function buildMarketPolicyReport(providers) {
  const rejectedByReason = {};
  for (const provider of providers) {
    for (const [reason, count] of Object.entries(provider.rejectedByReason ?? {})) {
      rejectedByReason[reason] = (rejectedByReason[reason] ?? 0) + count;
    }
  }
  return {
    version: MARKET_POLICY_VERSION,
    providers,
    rejectedByReason,
  };
}

export function emptyMarketPolicyReport() {
  return buildMarketPolicyReport([]);
}

export function failedMarketPolicyReport(error) {
  const message = error instanceof Error ? error.message : String(error);
  return buildMarketPolicyReport(
    ["polymarket", "kalshi"].map((provider) => ({
      provider,
      ok: false,
      error: message,
      fetched: 0,
      kept: 0,
      rejected: 0,
      rejectedByReason: {},
    })),
  );
}

export function summarizeInjectedProviderMarkets(markets) {
  const rows = Array.isArray(markets) ? markets : [];
  const providers = ["polymarket", "kalshi"].map((provider) => {
    const matching = rows.filter((market) => market?.provider === provider);
    const rejectedByReason = {};
    const kept = [];
    for (const market of matching) {
      const decision = evaluateMarketPolicy(market);
      if (decision.allowed) {
        kept.push(market);
      } else {
        const reason = decision.reason ?? "prohibited_pattern";
        rejectedByReason[reason] = (rejectedByReason[reason] ?? 0) + 1;
      }
    }
    return {
      status: {
        provider,
        ok: true,
        error: null,
        fetched: matching.length,
        kept: kept.length,
        rejected: matching.length - kept.length,
        rejectedByReason,
      },
      markets: kept,
    };
  });
  const others = rows.filter((market) => market?.provider !== "polymarket" && market?.provider !== "kalshi");
  return {
    markets: [...providers.flatMap((entry) => entry.markets), ...others],
    policy: buildMarketPolicyReport(providers.map((entry) => entry.status)),
  };
}
