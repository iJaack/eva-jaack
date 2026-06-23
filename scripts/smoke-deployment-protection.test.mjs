import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { strict as assert } from "node:assert";
import { test } from "node:test";

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

function runSmoke(baseUrl) {
  const child = spawn(process.execPath, ["scripts/smoke-deployment.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SMOKE_BASE_URL: baseUrl,
      SMOKE_ALLOW_PROTECTED_SKIP: "true",
      SMOKE_REQUIRE_DURABLE_STORAGE: "true",
      SMOKE_VERCEL_BYPASS_SECRET: "",
      VERCEL_AUTOMATION_BYPASS_SECRET: "",
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

test("deployment smoke skips 200 HTML Vercel protection pages", async () => {
  const protectionPage = `<!doctype html><html lang="en"><title>Authentication Required</title>
    <script type="text/llms.txt">This page requires Vercel authentication. Use x-vercel-protection-bypass.</script>`;

  const server = createServer((_req, res) => {
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      server: "Vercel",
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
