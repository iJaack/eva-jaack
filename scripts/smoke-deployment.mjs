import { performance } from "node:perf_hooks";
import protocol from "../protocol.config.json" with { type: "json" };

const baseUrl = (process.env.SMOKE_BASE_URL ?? process.argv[2] ?? "").trim().replace(/\/$/, "");
const verifyUrl = (process.env.SMOKE_VERIFY_URL ?? "").trim();
const articleId = (process.env.SMOKE_ARTICLE_ID ?? "").trim();
const curatorAddress = (process.env.SMOKE_CURATOR_ADDRESS ?? "").trim();
const claimId = (process.env.SMOKE_CLAIM_ID ?? "").trim();
const thesisId = (process.env.SMOKE_THESIS_ID ?? "").trim();
const marketId = (process.env.SMOKE_MARKET_ID ?? "crude-oil-95-window").trim();
const predictorId = (process.env.SMOKE_PREDICTOR_ID ?? "nairlof").trim();
const requestTimeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? "15000");
const curatorsMaxMs = Number(process.env.SMOKE_CURATORS_MAX_MS ?? "5000");

if (!baseUrl) {
  console.error("Missing SMOKE_BASE_URL or CLI base URL argument.");
  console.error("Example: SMOKE_BASE_URL=https://your-preview.vercel.app pnpm smoke:deploy");
  process.exit(1);
}

const checks = [
  { name: "home", method: "GET", path: "/" },
  { name: "markets page", method: "GET", path: "/markets" },
  { name: "compose page", method: "GET", path: "/compose" },
  { name: "predictors page", method: "GET", path: "/predictors" },
  { name: "prediction summary API", method: "GET", path: `${protocol.app.apiBasePath}/prediction-summary` },
  { name: "markets API", method: "GET", path: `${protocol.app.apiBasePath}/markets` },
  { name: "market detail API", method: "GET", path: `${protocol.app.apiBasePath}/markets/${marketId}` },
  { name: "predictors API", method: "GET", path: `${protocol.app.apiBasePath}/predictors` },
  { name: "predictor detail API", method: "GET", path: `${protocol.app.apiBasePath}/predictors/${predictorId}` },
  { name: "verify page", method: "GET", path: "/verify" },
  { name: "claims page", method: "GET", path: "/claims" },
  { name: "claims API", method: "GET", path: `${protocol.app.apiBasePath}/claims` },
  { name: "health", method: "GET", path: protocol.app.healthPath },
  { name: "agent manifest", method: "GET", path: protocol.app.agentManifestPath },
];

if (articleId) {
  checks.push({ name: "article detail", method: "GET", path: `/article/${articleId}` });
  checks.push({ name: "article API", method: "GET", path: `${protocol.app.apiBasePath}/article/${articleId}` });
}

if (curatorAddress) {
  checks.push({ name: "curator detail", method: "GET", path: `/curator/${curatorAddress}` });
  checks.push({ name: "trust API", method: "GET", path: `${protocol.app.apiBasePath}/trust/${curatorAddress}` });
}

if (claimId) {
  checks.push({ name: "claim detail", method: "GET", path: `/claims/${claimId}` });
  checks.push({ name: "claim detail API", method: "GET", path: `${protocol.app.apiBasePath}/claims/${claimId}` });
  checks.push({
    name: "claim settlement preview API",
    method: "GET",
    path: `${protocol.app.apiBasePath}/claims/${claimId}/settlement-preview`,
  });
}

if (thesisId) {
  checks.push({ name: "thesis detail", method: "GET", path: `/thesis/${thesisId}` });
  checks.push({ name: "thesis detail API", method: "GET", path: `${protocol.app.apiBasePath}/theses/${thesisId}` });
  checks.push({
    name: "copy preview API",
    method: "POST",
    path: `${protocol.app.apiBasePath}/copy-preview`,
    body: JSON.stringify({ thesisId }),
    headers: { "content-type": "application/json" },
  });
}

checks.push({
  name: "curators API",
  method: "GET",
  path: `${protocol.app.apiBasePath}/curators`,
  maxMs: curatorsMaxMs,
});

if (verifyUrl) {
  checks.push({
    name: "verify API",
    method: "POST",
    path: `${protocol.app.apiBasePath}/verify`,
    body: JSON.stringify({ url: verifyUrl }),
    headers: { "content-type": "application/json" },
  });
}

let failures = 0;

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  const startedAt = performance.now();

  let response;
  try {
    response = await fetch(url, {
      method: check.method,
      headers: check.headers,
      body: check.body,
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${check.name}: request error for ${url} :: ${String(error)}`);
    continue;
  }

  const elapsedMs = Math.round(performance.now() - startedAt);

  if (!response.ok) {
    failures += 1;
    console.error(`FAIL ${check.name}: ${response.status} ${url} (${elapsedMs}ms)`);
    continue;
  }

  if (check.maxMs && elapsedMs > check.maxMs) {
    failures += 1;
    console.error(`FAIL ${check.name}: exceeded latency budget ${elapsedMs}ms > ${check.maxMs}ms for ${url}`);
    continue;
  }

  console.log(`PASS ${check.name}: ${response.status} ${url} (${elapsedMs}ms)`);
}

if (!verifyUrl) {
  console.log("SKIP verify API: set SMOKE_VERIFY_URL to include POST /api/verify in the smoke run.");
}

if (!articleId) {
  console.log("SKIP article routes: set SMOKE_ARTICLE_ID to include dynamic article checks.");
}

if (!curatorAddress) {
  console.log("SKIP curator/trust routes: set SMOKE_CURATOR_ADDRESS to include dynamic curator checks.");
}

if (!claimId) {
  console.log("SKIP claim detail routes: set SMOKE_CLAIM_ID to include dynamic claim checks.");
}

if (!thesisId) {
  console.log("SKIP thesis detail routes: set SMOKE_THESIS_ID to include dynamic thesis checks.");
}

if (failures > 0) {
  process.exit(1);
}
