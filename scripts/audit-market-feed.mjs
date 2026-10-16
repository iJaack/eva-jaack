/**
 * GET-only market-feed audit. No secrets, no writes.
 *
 * node scripts/audit-market-feed.mjs --base http://127.0.0.1:3001
 *
 * Exits 0 when every served market passes the repo policy and an independent
 * sports/stat/player-prop keyword check. Exits 1 when any violation is present.
 * Exits 2 when the audit itself cannot be completed.
 */
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { MARKET_POLICY_VERSION, evaluateMarketPolicy } from "../backend/src/lib/market-policy.mjs";

const independentSportsStatPropPattern =
  /\b(player props?|rebounds|assists|rushing yards|receiving yards|passing yards|strikeouts|home runs?|batting average|innings pitched|shots on goal|both teams to score|moneyline|point spread|run line|anytime scorers?|first downs?|sacks|interceptions|world series|stanley cup|march madness|yellow cards?|red cards?|wickets|touchdowns?|quarterbacks?|running backs?|wide receivers?|point guards?|double-doubles?|triple-doubles?|fantasy points|corners|pitchers?|batters?|soccer|football|basketball|baseball|hockey|nba|nfl|mlb|nhl|ufc|mma|premier league|champions league|super bowl|world cup|parlay)\b/i;

function runningAsCli() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(entry)).href;
  } catch {
    return false;
  }
}

export function readBaseArg(argv) {
  const index = argv.indexOf("--base");
  if (index === -1) return "";
  return String(argv[index + 1] ?? "").trim().replace(/\/$/, "");
}

function tally(markets) {
  const byProvider = {};
  const byCategory = {};
  for (const market of markets) {
    const provider = String(market?.provider ?? "unknown");
    const category = String(market?.category ?? "").trim() || "Unclassified";
    byProvider[provider] = (byProvider[provider] ?? 0) + 1;
    byCategory[category] = (byCategory[category] ?? 0) + 1;
  }
  return { count: markets.length, byProvider, byCategory };
}

function collectViolations(markets) {
  const violations = [];
  for (const market of markets) {
    const title = String(market?.title ?? "");
    const category = String(market?.category ?? "");
    const url = typeof market?.url === "string" ? market.url : "";
    const rules = [];
    const decision = evaluateMarketPolicy({
      marketId: String(market?.marketId ?? ""),
      provider: String(market?.provider ?? ""),
      url,
      title,
      category,
    });
    if (!decision.allowed) {
      rules.push({ name: "repo_policy", reason: decision.reason });
    }
    const independent = `${title} ${category} ${url}`.match(independentSportsStatPropPattern);
    if (independent) {
      rules.push({ name: "independent_sports_stat_prop", reason: `keyword:${independent[0].toLowerCase()}` });
    }
    if (rules.length > 0) {
      violations.push({
        marketId: market?.marketId ?? null,
        provider: market?.provider ?? null,
        category: market?.category ?? null,
        title: market?.title ?? null,
        url: market?.url ?? null,
        rules,
      });
    }
  }
  return violations;
}

async function getJson(fetchImpl, url) {
  const response = await fetchImpl(url, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

export async function auditMarketFeed(base, fetchImpl = globalThis.fetch) {
  const origin = String(base ?? "").trim().replace(/\/$/, "");
  if (!origin) throw new Error("Missing --base URL");
  const marketsUrl = new URL("/api/markets", `${origin}/`);
  const readinessUrl = new URL("/api/runtime-readiness", `${origin}/`);
  const marketsBody = await getJson(fetchImpl, marketsUrl);
  const readinessBody = await getJson(fetchImpl, readinessUrl);
  const markets = Array.isArray(marketsBody?.markets) ? marketsBody.markets : [];
  const marketPolicy = readinessBody?.marketPolicy ?? marketsBody?.marketPolicy ?? null;
  return {
    timestamp: new Date().toISOString(),
    base: origin,
    revision: typeof readinessBody?.revision === "string" && readinessBody.revision.trim() ? readinessBody.revision.trim() : "unknown",
    policyVersion: MARKET_POLICY_VERSION,
    totals: tally(markets),
    providerStatus: Array.isArray(marketPolicy?.providers) ? marketPolicy.providers : [],
    rejectedByReason: marketPolicy?.rejectedByReason && typeof marketPolicy.rejectedByReason === "object" ? marketPolicy.rejectedByReason : {},
    violations: collectViolations(markets),
  };
}

async function main() {
  const base = readBaseArg(process.argv.slice(2));
  if (!base) {
    console.error("Missing --base URL. Example: node scripts/audit-market-feed.mjs --base http://127.0.0.1:3001");
    process.exit(2);
  }
  try {
    const report = await auditMarketFeed(base);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exit(report.violations.length > 0 ? 1 : 0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}

if (runningAsCli()) {
  await main();
}
