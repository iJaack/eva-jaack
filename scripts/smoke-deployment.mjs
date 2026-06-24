import { performance } from "node:perf_hooks";
import protocol from "../protocol.config.json" with { type: "json" };

const baseUrl = (process.env.SMOKE_BASE_URL ?? process.argv[2] ?? "").trim().replace(/\/$/, "");
const thesisId = (process.env.SMOKE_THESIS_ID ?? "thesis-0fdef25794b38b6e8eed7524").trim();
const marketId = (process.env.SMOKE_MARKET_ID ?? "spacex-ipo-before-2027").trim();
const predictorId = (process.env.SMOKE_PREDICTOR_ID ?? "spacethesis").trim();
const requestTimeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? "15000");
const vercelBypassSecret = (
  process.env.SMOKE_VERCEL_BYPASS_SECRET ??
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ??
  ""
).trim();
const allowProtectedSkip = process.env.SMOKE_ALLOW_PROTECTED_SKIP === "true";
const requireDurableStorage = process.env.SMOKE_REQUIRE_DURABLE_STORAGE !== "false";

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
  { name: "market detail page", method: "GET", path: `/markets/${marketId}` },
  { name: "market detail API", method: "GET", path: `${protocol.app.apiBasePath}/markets/${marketId}` },
  { name: "predictors API", method: "GET", path: `${protocol.app.apiBasePath}/predictors` },
  { name: "predictor detail API", method: "GET", path: `${protocol.app.apiBasePath}/predictors/${predictorId}` },
  {
    name: "health",
    method: "GET",
    path: protocol.app.healthPath,
    validate: async (response) => {
      if (!requireDurableStorage) return;
      const body = await response.json();
      if (body?.storage?.ready !== true || body?.storage?.durable !== true) {
        throw new Error(`storage not durable: ${body?.storage?.reason ?? "missing storage readiness"}`);
      }
    },
  },
  {
    name: "storage readiness probe",
    method: "GET",
    path: "/api/storage-readiness?probe=1",
    validate: async (response) => {
      if (!requireDurableStorage) return;
      const body = await response.json();
      if (body?.ready !== true || body?.durable !== true || body?.probe?.ok !== true) {
        throw new Error(`storage probe failed: ${body?.probe?.reason ?? body?.reason ?? "missing readiness probe"}`);
      }
    },
  },
  { name: "agent manifest", method: "GET", path: protocol.app.agentManifestPath },
  { name: "mcp discovery", method: "GET", path: `${protocol.app.apiBasePath}/mcp` },
  {
    name: "mcp initialize",
    method: "POST",
    path: `${protocol.app.apiBasePath}/mcp`,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "eva-smoke", version: "0.0.0" },
      },
    }),
    headers: { accept: "application/json, text/event-stream", "content-type": "application/json" },
  },
];

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

let failures = 0;
let successes = 0;
const failedChecks = [];

const sharedHeaders = vercelBypassSecret
  ? {
      "x-vercel-protection-bypass": vercelBypassSecret,
      "x-vercel-set-bypass-cookie": "true",
    }
  : {};

async function isVercelProtectedResponse(response) {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const server = response.headers.get("server") ?? "";
  const vercelId = response.headers.get("x-vercel-id") ?? "";

  if (
    (response.status === 401 || response.status === 403) &&
    server.toLowerCase().includes("vercel") &&
    setCookie.includes("_vercel_sso_nonce")
  ) {
    return true;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("text/html")) return false;

  let body = "";
  try {
    body = await response.clone().text();
  } catch {
    return false;
  }

  const snippet = body.slice(0, 8192).toLowerCase();
  const htmlLooksProtected =
    snippet.includes("authentication required") ||
    snippet.includes("vercel authentication") ||
    snippet.includes("this page requires vercel authentication") ||
    snippet.includes("x-vercel-protection-bypass") ||
    snippet.includes("_vercel_sso_nonce") ||
    snippet.includes("vercel.com/sso-api") ||
    snippet.includes("vercel.com/security");
  const responseLooksVercel = server.toLowerCase().includes("vercel") || Boolean(vercelId) || snippet.includes("vercel");

  return htmlLooksProtected && responseLooksVercel;
}

function warnVercelProtectionSkip() {
  console.warn(
    "SKIP deployment smoke: Vercel Deployment Protection blocked the deployment URL. " +
      "Configure the GitHub secret VERCEL_AUTOMATION_BYPASS_SECRET to run deployed-url smoke checks."
  );
}

if (!vercelBypassSecret && allowProtectedSkip) {
  try {
    const response = await fetch(`${baseUrl}/`, {
      method: "GET",
      headers: sharedHeaders,
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    if (await isVercelProtectedResponse(response)) {
      warnVercelProtectionSkip();
      process.exit(0);
    }
  } catch {
    // Let the full smoke suite below report the real network/application error.
  }
}

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  const startedAt = performance.now();

  let response;
  try {
    response = await fetch(url, {
      method: check.method,
      headers: { ...sharedHeaders, ...check.headers },
      body: check.body,
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch (error) {
    failures += 1;
    failedChecks.push({ name: check.name, protectedByVercel: false });
    console.error(`FAIL ${check.name}: request error for ${url} :: ${String(error)}`);
    continue;
  }

  const elapsedMs = Math.round(performance.now() - startedAt);
  const protectedByVercel = await isVercelProtectedResponse(response);

  if (protectedByVercel && !vercelBypassSecret && allowProtectedSkip) {
    warnVercelProtectionSkip();
    process.exit(0);
  }

  if (!response.ok) {
    failures += 1;
    failedChecks.push({
      name: check.name,
      protectedByVercel,
    });
    console.error(`FAIL ${check.name}: ${response.status} ${url} (${elapsedMs}ms)`);
    continue;
  }

  if (check.validate) {
    try {
      await check.validate(response);
    } catch (error) {
      failures += 1;
      failedChecks.push({ name: check.name, protectedByVercel: false });
      console.error(`FAIL ${check.name}: ${error instanceof Error ? error.message : String(error)} for ${url} (${elapsedMs}ms)`);
      continue;
    }
  }

  if (check.maxMs && elapsedMs > check.maxMs) {
    failures += 1;
    failedChecks.push({ name: check.name, protectedByVercel: false });
    console.error(`FAIL ${check.name}: exceeded latency budget ${elapsedMs}ms > ${check.maxMs}ms for ${url}`);
    continue;
  }

  successes += 1;
  console.log(`PASS ${check.name}: ${response.status} ${url} (${elapsedMs}ms)`);
}

if (!thesisId) {
  console.log("SKIP thesis detail routes: set SMOKE_THESIS_ID to include dynamic thesis checks.");
}

if (failures > 0) {
  const onlyVercelProtectionFailures =
    successes === 0 && failedChecks.length > 0 && failedChecks.every((check) => check.protectedByVercel);

  if (onlyVercelProtectionFailures && !vercelBypassSecret && allowProtectedSkip) {
    warnVercelProtectionSkip();
    process.exit(0);
  }

  if (onlyVercelProtectionFailures && vercelBypassSecret) {
    console.error(
      "Vercel Deployment Protection still blocked every smoke request even with a bypass secret. " +
        "Verify the GitHub secret VERCEL_AUTOMATION_BYPASS_SECRET matches the active project bypass secret."
    );
  }

  process.exit(1);
}
