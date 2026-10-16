import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import test from "node:test";
import { auditMarketFeed } from "./audit-market-feed.mjs";

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

function listen(handler) {
  return new Promise((resolve, reject) => {
    const server = createServer(handler);
    server.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const cleanMarket = {
  marketId: "polymarket-fed-cut",
  provider: "polymarket",
  url: "https://polymarket.com/event/will-the-fed-cut-rates",
  title: "Will the Fed cut rates before September?",
  category: "Macro",
};

function serve(markets, readiness) {
  const calls = [];
  return listen((req, res) => {
    calls.push({ method: req.method, url: req.url, authorization: req.headers.authorization ?? null });
    if (req.method !== "GET") {
      json(res, 405, { error: "method" });
      return;
    }
    if (req.url === "/api/markets") {
      json(res, 200, { count: markets.length, markets, marketPolicy: readiness.marketPolicy });
      return;
    }
    if (req.url === "/api/runtime-readiness") {
      json(res, 200, readiness);
      return;
    }
    json(res, 404, { error: "missing" });
  }).then((server) => ({ server, calls, base: `http://127.0.0.1:${server.address().port}` }));
}

test("audit accepts a fail-closed feed and records revision plus provider status", async () => {
  const readiness = {
    revision: "abc123",
    marketPolicy: {
      version: "v1-allowlist",
      providers: [
        { provider: "polymarket", ok: true, error: null, fetched: 2, kept: 1, rejected: 1, rejectedByReason: { unclassified: 1 } },
      ],
      rejectedByReason: { unclassified: 1 },
    },
  };
  const { server, calls, base } = await serve([cleanMarket], readiness);
  try {
    const report = await auditMarketFeed(base, async (url, init) => {
      assert.equal(init?.method, "GET");
      const response = await fetch(url, init);
      return response;
    });
    assert.equal(report.base, base);
    assert.equal(report.revision, "abc123");
    assert.equal(report.policyVersion, "v1-allowlist");
    assert.equal(report.totals.count, 1);
    assert.equal(report.totals.byProvider.polymarket, 1);
    assert.equal(report.totals.byCategory.Macro, 1);
    assert.equal(report.providerStatus[0].kept, 1);
    assert.deepEqual(report.rejectedByReason, { unclassified: 1 });
    assert.deepEqual(report.violations, []);
    assert.ok(calls.every((call) => call.method === "GET"));
    assert.ok(calls.every((call) => call.authorization === null));
  } finally {
    server.close();
  }
});

test("audit flags repo-policy misses and independent player-prop wording", async () => {
  const markets = [
    {
      marketId: "polymarket-nba",
      provider: "polymarket",
      url: "https://polymarket.com/event/lakers-nba-game",
      title: "Will the Lakers win the NBA game?",
      category: "Sports",
    },
    {
      marketId: "polymarket-rebounds",
      provider: "polymarket",
      url: "https://polymarket.com/event/lebron-rebounds",
      title: "Will the player record 12 rebounds tonight?",
      category: "Macro",
    },
    {
      marketId: "polymarket-blank",
      provider: "polymarket",
      url: "https://polymarket.com/event/observatory-bulletin",
      title: "Will the observatory publish its next bulletin?",
      category: "",
    },
  ];
  const { server, base } = await serve(markets, { revision: "unknown", marketPolicy: { version: "v1-allowlist", providers: [], rejectedByReason: {} } });
  try {
    const report = await auditMarketFeed(base);
    const byId = Object.fromEntries(report.violations.map((violation) => [violation.marketId, violation.rules.map((rule) => rule.name)]));
    assert.ok(byId["polymarket-nba"].includes("repo_policy"));
    assert.ok(byId["polymarket-nba"].includes("independent_sports_stat_prop"));
    assert.deepEqual(byId["polymarket-rebounds"], ["independent_sports_stat_prop"]);
    assert.deepEqual(byId["polymarket-blank"], ["repo_policy"]);
    assert.equal(report.violations.find((violation) => violation.marketId === "polymarket-blank").rules[0].reason, "unclassified");
  } finally {
    server.close();
  }
});

test("audit cli exits non-zero on violations and when --base is missing", async () => {
  const missing = spawnSync(process.execPath, ["scripts/audit-market-feed.mjs"], { encoding: "utf8" });
  assert.equal(missing.status, 2);

  const { server, base } = await serve(
    [
      {
        marketId: "foreign",
        provider: "polymarket",
        url: "https://example.com/fed",
        title: "Will the Fed hold rates?",
        category: "Macro",
      },
    ],
    { revision: "rev", marketPolicy: { version: "v1-allowlist", providers: [], rejectedByReason: {} } },
  );
  try {
    const result = await runCli(["scripts/audit-market-feed.mjs", "--base", base]);
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.equal(report.revision, "rev");
    assert.equal(report.violations[0].rules[0].reason, "foreign_domain");
  } finally {
    server.close();
  }
});
