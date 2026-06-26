import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { evaMcpToolDescriptions, evaMcpToolNames } from "../src/mcp-server.js";
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

  it("exposes Dynamic auth runtime readiness without leaking the environment id", async () => {
    const previousDynamicEnv = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID = "test-dynamic-env";
    try {
      const app = createApp();

      const response = await fetchJson(app, "/api/runtime-readiness");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: "ok",
        service: "Eva Protocol",
        dynamicAuth: {
          configured: true,
          composeGate: "user_connect",
          reason: "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is configured",
        },
      });
      expect(JSON.stringify(response.body)).not.toContain("test-dynamic-env");
    } finally {
      if (previousDynamicEnv === undefined) delete process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
      else process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID = previousDynamicEnv;
    }
  });

  it("reports missing Dynamic auth runtime readiness as a launch blocker", async () => {
    const previousDynamicEnv = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
    delete process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
    try {
      const app = createApp();

      const response = await fetchJson(app, "/api/runtime-readiness");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        dynamicAuth: {
          configured: false,
          composeGate: "configuration",
          reason: "missing NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID",
        },
      });
    } finally {
      if (previousDynamicEnv === undefined) delete process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
      else process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID = previousDynamicEnv;
    }
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

  it("describes live MCP tools with safe boundaries for clients", async () => {
    const app = createApp();

    const response = await fetchJson(app, "/api/mcp", {
      method: "POST",
      headers: mcpHeaders,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }),
    });

    expect(response.status).toBe(200);

    const body = response.body as { result: { tools: Array<{ name: string; description?: string; annotations?: Record<string, unknown> }> } };
    const toolsByName = new Map(body.result.tools.map((tool) => [tool.name, tool]));

    for (const toolName of evaMcpToolNames) {
      const tool = toolsByName.get(toolName);
      expect(tool?.description).toBe(evaMcpToolDescriptions[toolName]);
      expect(tool?.annotations).toMatchObject({ destructiveHint: false, idempotentHint: true });
    }

    expect(toolsByName.get("search_markets")?.annotations).toMatchObject({ readOnlyHint: true, openWorldHint: true });
    expect(toolsByName.get("get_thesis")?.annotations).toMatchObject({ readOnlyHint: true, openWorldHint: false });
    for (const toolName of ["create_thesis_draft", "prepare_revision_draft", "prepare_anchor_transaction"] as const) {
      expect(toolsByName.get(toolName)?.annotations).toMatchObject({ readOnlyHint: false, openWorldHint: false });
    }
    expect(toolsByName.get("create_thesis_draft")?.description).toContain("does not publish");
    expect(toolsByName.get("prepare_revision_draft")?.description).toContain("does not update the live thesis");
    expect(toolsByName.get("prepare_anchor_transaction")?.description).toContain("Does not publish");
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
