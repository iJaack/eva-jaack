import protocol from "../protocol.config.json" with { type: "json" };

const baseUrl = (process.env.SMOKE_BASE_URL ?? process.argv[2] ?? "").trim().replace(/\/$/, "");
const verifyUrl = (process.env.SMOKE_VERIFY_URL ?? "").trim();
const articleId = (process.env.SMOKE_ARTICLE_ID ?? "").trim();
const curatorAddress = (process.env.SMOKE_CURATOR_ADDRESS ?? "").trim();

if (!baseUrl) {
  console.error("Missing SMOKE_BASE_URL or CLI base URL argument.");
  console.error("Example: SMOKE_BASE_URL=https://your-preview.vercel.app pnpm smoke:deploy");
  process.exit(1);
}

const checks = [
  { name: "home", method: "GET", path: "/" },
  { name: "verify page", method: "GET", path: "/verify" },
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

checks.push({ name: "curators API", method: "GET", path: `${protocol.app.apiBasePath}/curators` });

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
  const response = await fetch(url, {
    method: check.method,
    headers: check.headers,
    body: check.body,
  });

  if (!response.ok) {
    failures += 1;
    console.error(`FAIL ${check.name}: ${response.status} ${url}`);
    continue;
  }

  console.log(`PASS ${check.name}: ${response.status} ${url}`);
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

if (failures > 0) {
  process.exit(1);
}
