import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import protocol from "../protocol.config.json" with { type: "json" };

const protectionPage = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Authentication Required</title>
  <script type="text/llms.txt">This page requires Vercel authentication. Use x-vercel-protection-bypass.</script>
  <body>Vercel Authentication <a href="https://vercel.com/sso-api">continue</a></body>`;

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      const address = server.address();
      if (!address || typeof address === "string") reject(new Error("Missing server address"));
      else resolve(address.port);
    });
  });
}

function runSmoke(baseUrl, extraEnv = {}) {
  const child = spawn(process.execPath, ["scripts/smoke-deployment.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SMOKE_BASE_URL: baseUrl,
      SMOKE_ALLOW_PROTECTED_SKIP: "true",
      SMOKE_REQUIRE_DURABLE_STORAGE: "true",
      SMOKE_VERCEL_BYPASS_SECRET: "",
      VERCEL_AUTOMATION_BYPASS_SECRET: "",
      ...extraEnv,
    },
  });

  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  return once(child, "exit").then(([code]) => ({ code, stdout, stderr }));
}

test("deployment smoke skips 200 HTML Vercel protection pages at entry", async () => {
  const server = createServer((_req, res) => {
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      server: "Vercel",
      "x-vercel-id": "fra1::test",
    });
    res.end(protectionPage);
  });

  const port = await listen(server);
  try {
    const result = await runSmoke(`http://127.0.0.1:${port}`);
    assert.equal(result.code, 0);
    assert.match(result.stderr, /SKIP deployment smoke: Vercel Deployment Protection blocked the deployment URL/);
    assert.doesNotMatch(result.stderr, /Unexpected token/);
  } finally {
    server.close();
  }
});

test("deployment smoke skips 401 Vercel protection pages", async () => {
  const server = createServer((_req, res) => {
    res.writeHead(401, {
      "content-type": "text/html; charset=utf-8",
      server: "Vercel",
      "set-cookie": "_vercel_sso_nonce=test; Max-Age=3600; Path=/; Secure; HttpOnly; SameSite=Lax",
    });
    res.end(protectionPage);
  });

  const port = await listen(server);
  try {
    const result = await runSmoke(`http://127.0.0.1:${port}`);
    assert.equal(result.code, 0);
    assert.match(result.stderr, /SKIP deployment smoke: Vercel Deployment Protection blocked the deployment URL/);
    assert.doesNotMatch(result.stderr, /FAIL health/);
  } finally {
    server.close();
  }
});

test("deployment smoke skips when only backend JSON routes are protected", async () => {
  const genericVercelHtml = `<!doctype html><html lang="en"><head><title>Vercel</title></head><body>Preview route requires access.</body></html>`;

  const server = createServer((req, res) => {
    if (req.url?.startsWith("/health") || req.url?.startsWith("/api/storage-readiness")) {
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        server: "Vercel",
        "x-vercel-id": "fra1::test",
      });
      res.end(genericVercelHtml);
      return;
    }

    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  });

  const port = await listen(server);
  try {
    const result = await runSmoke(`http://127.0.0.1:${port}`);
    assert.equal(result.code, 0);
    assert.match(result.stderr, /SKIP deployment smoke: Vercel Deployment Protection blocked the deployment URL/);
    assert.match(result.stdout, /PASS predictors API/);
    assert.doesNotMatch(result.stderr, /Unexpected token/);
  } finally {
    server.close();
  }
});

test("deployment smoke skips Vercel dashboard HTML on backend JSON routes without Vercel headers", async () => {
  const vercelDashboardShell = `<!DOCTYPE html><html data-dpl-id="dpl_test" class="geist dash" lang="en-US"><head>
    <link rel="stylesheet" href="/_next/static/immutable/chunks/test.css" />
    <title>Vercel</title></head><body>Preview route requires access.</body></html>`;

  const server = createServer((req, res) => {
    if (req.url?.startsWith("/health") || req.url?.startsWith("/api/storage-readiness")) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(vercelDashboardShell);
      return;
    }

    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  });

  const port = await listen(server);
  try {
    const result = await runSmoke(`http://127.0.0.1:${port}`);
    assert.equal(result.code, 0);
    assert.match(result.stderr, /SKIP deployment smoke: Vercel Deployment Protection blocked the deployment URL/);
    assert.match(result.stdout, /PASS predictors API/);
    assert.doesNotMatch(result.stderr, /Unexpected token/);
  } finally {
    server.close();
  }
});

function createApplicationSmokeServer({
  walletMode = "self_custody",
  embeddedWallets = false,
  serverCanSign = false,
  authoringReady = true,
}) {
  return createServer((req, res) => {
    if (req.url === "/compose") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end("<main>compose route loaded</main>");
      return;
    }

    if (req.url?.startsWith("/api/runtime-readiness")) {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          status: "ok",
          walletConnection: {
            ready: walletMode === "self_custody",
            mode: walletMode,
            embeddedWallets,
            serverCanSign,
            reason: walletMode === "self_custody" ? "self-custodial wallet ready" : "embedded wallet mode is not allowed",
          },
          authoring: {
            ready: authoringReady,
            composeGate: authoringReady ? "self_custody_wallet" : "configuration",
            nextAction: authoringReady ? "Connect your own EVM wallet." : "Enable self-custodial wallet authoring.",
          },
        })
      );
      return;
    }

    if (req.url?.startsWith("/health")) {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ storage: { ready: true, durable: true } }));
      return;
    }

    if (req.url?.startsWith("/api/storage-readiness")) {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ready: true, durable: true, probe: { ok: true } }));
      return;
    }

    if (req.url?.startsWith(protocol.app.agentManifestPath)) {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          thesisProtocol: {
            walletBoundary: {
              mode: walletMode,
              embeddedWallets,
              serverCanSign,
            },
          },
          platformToken: {
            contract: `eip155:${protocol.chain.id}:${protocol.tokens.eva.address}`,
            usageBurner: `eip155:${protocol.chain.id}:${protocol.contracts.evaUsageBurner}`,
            symbol: protocol.tokens.eva.symbol,
            liveCapabilities: [
              "contract_metadata",
              "holder_balance_readback",
              "author_context",
              "usage_retirement",
              "usage_receipts",
            ],
          },
        })
      );
      return;
    }

    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  });
}

test("deployment smoke rejects embedded-wallet runtime mode", async () => {
  const server = createApplicationSmokeServer({ walletMode: "embedded", embeddedWallets: true, serverCanSign: true });

  const port = await listen(server);
  try {
    const result = await runSmoke(`http://127.0.0.1:${port}`, { SMOKE_REQUIRE_SELF_CUSTODY_WALLET: "true" });
    assert.equal(result.code, 1);
    assert.match(result.stderr, /embedded wallet mode is not allowed/);
  } finally {
    server.close();
  }
});

test("deployment smoke passes strict self-custodial wallet readiness", async () => {
  const server = createApplicationSmokeServer({});

  const port = await listen(server);
  try {
    const result = await runSmoke(`http://127.0.0.1:${port}`, { SMOKE_REQUIRE_SELF_CUSTODY_WALLET: "true" });
    assert.equal(result.code, 0);
    assert.match(result.stdout, /PASS runtime readiness API/);
    assert.doesNotMatch(result.stderr, /embedded wallet mode is not allowed/);
  } finally {
    server.close();
  }
});

test("deployment smoke fails strict self-custodial readiness when authoring remains gated", async () => {
  const server = createApplicationSmokeServer({ authoringReady: false });

  const port = await listen(server);
  try {
    const result = await runSmoke(`http://127.0.0.1:${port}`, { SMOKE_REQUIRE_SELF_CUSTODY_WALLET: "true" });
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Enable self-custodial wallet authoring/);
  } finally {
    server.close();
  }
});

test("deployment smoke fails when the agent manifest omits the canonical $EVA token", async () => {
  const server = createServer((req, res) => {
    if (req.url?.startsWith("/health")) {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ storage: { ready: true, durable: true } }));
      return;
    }
    if (req.url?.startsWith("/api/storage-readiness")) {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ready: true, durable: true, probe: { ok: true } }));
      return;
    }
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  });

  const port = await listen(server);
  try {
    const result = await runSmoke(`http://127.0.0.1:${port}`);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /agent manifest does not publish the canonical bounded \$EVA platform token/);
  } finally {
    server.close();
  }
});
