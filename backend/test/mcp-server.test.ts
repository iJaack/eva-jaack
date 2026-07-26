import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createThesisDraftToolSchema } from "../src/mcp-schemas.js";
import { evaMcpToolDescriptions, evaMcpToolNames } from "../src/mcp-server.js";

describe("Eva MCP server discovery", () => {
  it("keeps tool descriptions inside the agent-safe permission boundary", () => {
    for (const toolName of evaMcpToolNames) {
      const description = evaMcpToolDescriptions[toolName];

      expect(description, `${toolName} should name its negative boundary`).toMatch(/does not/i);
      expect(description, `${toolName} should not describe direct REST writes as allowed`).toContain("direct REST writes");
      expect(description, `${toolName} should not imply public publish support`).not.toMatch(/\bpublishes\b|\bpublished\b|\bmakes live\b/i);
    }

    for (const toolName of ["search_markets", "get_thesis"] as const) {
      expect(evaMcpToolDescriptions[toolName], `${toolName} should advertise read-only scope`).toContain("Read-only");
    }

    for (const toolName of ["create_thesis_draft", "prepare_revision_draft", "prepare_anchor_transaction"] as const) {
      const description = evaMcpToolDescriptions[toolName];

      expect(description, `${toolName} should expose the not-published marker`).toContain("anchor_prepared_not_published");
      expect(description, `${toolName} should preserve no-broadcast scope`).toContain("broadcast");
      expect(description, `${toolName} should preserve storage boundary scope`).toContain("storage durability");
    }
  });

  it("rejects embedded wallet sources from agent draft preparation", () => {
    const parsed = z.object(createThesisDraftToolSchema).safeParse({
      title: "External signer only",
      body: "The agent must control and sign with its own wallet.",
      xHandle: "@agentalpha",
      walletAddress: "0x1111111111111111111111111111111111111111",
      walletSource: "embedded",
    });

    expect(parsed.success).toBe(false);
  });
});
