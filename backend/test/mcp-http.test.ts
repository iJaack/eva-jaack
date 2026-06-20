import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { evaMcpToolNames } from "../src/mcp-server.js";
import { fetchJson } from "./helpers.js";

const mcpHeaders = {
  accept: "application/json, text/event-stream",
  "content-type": "application/json",
};

describe("MCP HTTP endpoint", () => {
  it("exposes storage readiness on health checks", async () => {
    const app = createApp();

    const response = await fetchJson(app, "/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "Eva Protocol",
      storage: {
        ready: true,
        durable: true,
        mode: "local_filesystem",
      },
    });
  });

  it("runs a non-mutating storage readiness probe", async () => {
    const app = createApp();

    const response = await fetchJson(app, "/api/storage-readiness?probe=1");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ready: true,
      durable: true,
      mode: "local_filesystem",
      probe: {
        checked: true,
        ok: true,
        kind: "local_filesystem_config",
      },
    });
  });

  it("serves discovery metadata for plain GET health checks", async () => {
    const app = createApp();

    const response = await fetchJson(app, "/api/mcp");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "Eva Protocol",
      transport: "streamable-http",
      endpoint: "/api/mcp",
      tools: evaMcpToolNames,
    });
  });

  it("handles Streamable HTTP initialize requests", async () => {
    const app = createApp();

    const response = await fetchJson(app, "/api/mcp", {
      method: "POST",
      headers: mcpHeaders,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "eva-vitest", version: "0.0.0" },
        },
      }),
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        serverInfo: { name: "eva-thesis", version: "0.1.0" },
      },
    });
  });
});
