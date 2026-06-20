import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { evaMcpToolNames } from "../src/mcp-server.js";
import { claimVerdictValues, predictionMarketStatusValues, thesisSignalRoleValues } from "../src/mcp-schemas.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../..");

function readRepoFile(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("Eva MCP agent docs", () => {
  const canonicalAgentDocs = [
    "docs/MCP_AGENT_GUIDE.md",
    "docs/MCP_AGENT_QUICKSTART.md",
    "docs/MCP_AGENT_EXAMPLES.md",
    "docs/MCP_AGENT_ERROR_HANDLING.md",
    "skills/eva-agent-onboarding/SKILL.md",
  ];

  it("document every live MCP tool exposed by the server", () => {
    for (const path of canonicalAgentDocs) {
      const text = readRepoFile(path);
      for (const toolName of evaMcpToolNames) {
        expect(text, `${path} should mention live tool ${toolName}`).toContain(toolName);
      }
    }
  });

  it("keeps documented schema enums aligned with live Zod schemas", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const value of [...thesisSignalRoleValues, ...predictionMarketStatusValues, ...claimVerdictValues]) {
      expect(docs, `agent docs should mention schema enum value ${value}`).toContain(value);
    }
  });

  it("preserves the safe draft/anchor-prep boundary in agent docs", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_HANDOFF_TEMPLATE.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    expect(docs).toContain('publishState: "anchor_prepared_not_published"');
    expect(docs).toContain("not published");
    expect(docs).toContain("Broadcasts require explicit user approval");
    expect(docs).toContain("Do not expand agent powers into trades, custody, staking, claims markets, articles, or blog publishing");
  });

  it("documents the evidence ladder that prevents draft prep being reported as publish", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const rung of ["read-only", "draft prepared", "anchor prepared", "submitted", "published/live"]) {
      expect(docs, `agent docs should include permission ladder rung ${rung}`).toContain(rung);
    }

    expect(docs).toContain("MCP alone never reaches the `submitted` or `published/live` rungs");
  });

  it("keeps storage durability separate from MCP draft preparation", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("docs/MCP_AGENT_ERROR_HANDLING.md"),
      readRepoFile("docs/MCP_AGENT_HANDOFF_TEMPLATE.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
      readRepoFile("skills/eva-thesis/SKILL.md"),
    ].join("\n");

    for (const phrase of ["storage not assessed", "storage readiness blocked", "storage verified"]) {
      expect(docs, `agent docs should include storage state ${phrase}`).toContain(phrase);
    }

    expect(docs).toContain("MCP draft prep is not durable-production proof");
    expect(docs).toContain("a generic `/health`");
    expect(docs).toContain("approved readiness/readback check");
  });

  it("documents a preflight and result card for write-adjacent handoffs", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of ["intent", "approved identity", "signer/source", "evidence", "scope", "storage claim"]) {
      expect(docs, `agent preflight should include ${phrase}`).toContain(phrase);
    }

    for (const phrase of ["prepared:", "tool:", "rung:", "publishState:", "anchorStatus:", "storage:", "next evidence needed:"]) {
      expect(docs, `agent result card should include ${phrase}`).toContain(phrase);
    }
  });
});
