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

  it("ships safe-start triage cards for mixed MCP prompts", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Safe-start triage",
      "requested verb",
      "smallest live MCP tool",
      "safe rung after call",
      "stop condition",
      "draft and publish",
      "revise this thesis",
      "anchor it",
      "prove launch readiness",
    ]) {
      expect(docs, `agent safe-start triage should include ${phrase}`).toContain(phrase);
    }
  });

  it("documents result evidence inventory so agents do not infer publish state", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Evidence Inventory",
      "anchorPreparationId",
      "transaction count",
      "tx hash",
      "receipt/readback",
      "source URL gaps",
      "not returned",
      "Do not infer",
    ]) {
      expect(docs, `agent docs should include evidence inventory phrase ${phrase}`).toContain(phrase);
    }
  });

  it("documents the action contract that caps write-adjacent result claims", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Four-line action contract",
      "operation:",
      "identity source:",
      "evidence source:",
      "output ceiling:",
      "result must never exceed that ceiling",
      "If `identity source` is blocked",
      "If `evidence source` is signal-light",
    ]) {
      expect(docs, `agent docs should include action contract phrase ${phrase}`).toContain(phrase);
    }
  });

  it("documents the MCP text result envelope so agents parse returned JSON before reporting", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "content[0].text",
      "parseable JSON",
      "isError: true",
      "MCP result envelope",
      "Do not infer",
      "MCP text parser",
      "parseEvaMcpTextResult",
      "fill the evidence inventory only from the parsed object",
      "A tool name",
    ]) {
      expect(docs, `agent docs should include MCP result envelope phrase ${phrase}`).toContain(phrase);
    }
  });

  it("documents MCP tool annotations without treating them as approval evidence", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Tool annotations",
      "routing hints",
      "readOnlyHint: true",
      "readOnlyHint: false",
      "destructiveHint: false",
      "idempotentHint: true",
      "openWorldHint: false",
      "not approval",
      "not publication",
      "storage-readiness evidence",
    ]) {
      expect(docs, `agent docs should include tool annotation boundary phrase ${phrase}`).toContain(phrase);
    }
  });

  it("teaches agents to downgrade over-strong publish/storage claims", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
    ].join("\n");

    for (const phrase of [
      "Common Prompt Routing Cards",
      "Claim Downgrade Pattern",
      "Blocked publish or launch-readiness request",
      "prepared for review; not published",
      "anchor calldata prepared for approval",
      "revision draft prepared; current public revision unchanged",
      "missing before stronger claim",
      "durable-storage readiness/readback check",
    ]) {
      expect(docs, `agent docs should include over-strong claim downgrade phrase ${phrase}`).toContain(phrase);
    }
  });

  it("documents that revision drafts require full replacement bodies", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "full replacement body",
      "not a patch",
      "append-only note",
      "partial paragraph",
      "note",
    ]) {
      expect(docs, `revision docs should include full replacement body phrase ${phrase}`).toContain(phrase);
    }
  });

  it("documents the local MCP stdio client configuration", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of ["eva-thesis", '"command": "pnpm"', '"--filter"', '"backend"', '"mcp"', '"cwd"']) {
      expect(docs, `agent docs should include local MCP client config phrase ${phrase}`).toContain(phrase);
    }

    expect(docs).toContain("local stdio server");
    expect(docs).toContain("remote write tools");
  });

  it("keeps direct app HTTP writes outside default agent MCP powers", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Do not bypass MCP",
      "POST /api/theses",
      "POST /api/thesis-anchor/prepare",
      "direct REST writes",
      "separate approved",
      "scoped credentials",
      "receipt/readback evidence",
    ]) {
      expect(docs, `agent docs should preserve app HTTP write boundary phrase ${phrase}`).toContain(phrase);
    }
  });

  it("documents receipt requirements for separately approved non-MCP execution paths", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "approved execution path",
      "approval evidence",
      "credential scope",
      "write receipt",
      "readback evidence",
      "safe claim after execution",
      "route URL, bearer token, wallet address",
      "stay at `draft prepared` / `anchor prepared`",
    ]) {
      expect(docs, `agent docs should include approved execution receipt phrase ${phrase}`).toContain(phrase);
    }
  });

  it("keeps platform coordination status separate from protocol state", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Platform status is not protocol status",
      "coordination signals",
      "Multica issue",
      "PR merged",
      "deployment green",
      "prior agent comments",
      "MCP output",
      "approved write receipts",
      "API readback",
      "onchain receipt/readback",
    ]) {
      expect(docs, `agent docs should separate platform status from protocol state phrase ${phrase}`).toContain(phrase);
    }
  });

  it("documents schema repair cards so agents normalize inputs without guessing", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_ERROR_HANDLING.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Schema repair cards",
      "36%",
      "0.36",
      "source URL gap",
      "verifierScore: 50",
      "full replacement body",
      "task-time `xHandle`, `walletAddress`, and signer/source approval",
      "safe boundary: I did not prepare calldata",
      "Repair only directly evidenced values",
    ]) {
      expect(docs, `agent schema repair docs should include ${phrase}`).toContain(phrase);
    }
  });

  it("documents that schema defaults are not approval or evidence", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Schema Defaults Are Not Approval",
      "schema defaults are not approval",
      'walletSource: "external"',
      "defaulted signal",
      "selectedOutcomeLabel",
      "verifierScore: 50",
      "not task approval or sourced facts",
    ]) {
      expect(docs, `agent docs should include schema-default boundary phrase ${phrase}`).toContain(phrase);
    }
  });

  it("ships concrete onboarding skill examples for agent rehearsals", () => {
    const skill = readRepoFile("skills/eva-agent-onboarding/SKILL.md");

    for (const phrase of [
      "## Onboarding Drill",
      "SpaceX IPO",
      "create_thesis_draft",
      "prepare_revision_draft",
      "expectedPublishState",
      "anchor_prepared_not_published",
      "walletSource",
      "no transaction broadcast and no public publish happened",
    ]) {
      expect(skill, `onboarding skill should include rehearsal phrase ${phrase}`).toContain(phrase);
    }
  });
});
