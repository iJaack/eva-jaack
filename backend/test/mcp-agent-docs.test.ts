import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { evaMcpToolNames } from "../src/mcp-server.js";
import {
  claimVerdictValues,
  createThesisDraftToolSchema,
  factSignalInputSchema,
  getThesisToolSchema,
  predictionMarketStatusValues,
  predictionSignalInputSchema,
  prepareAnchorTransactionToolSchema,
  prepareRevisionDraftToolSchema,
  searchMarketsToolSchema,
  thesisSignalRoleValues,
} from "../src/mcp-schemas.js";

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
    "docs/MCP_AGENT_DECISION_CARDS.md",
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

  it("ships decision cards for mixed thesis prompts without expanding MCP powers", () => {
    const docs = [
      readRepoFile("README.md"),
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/MCP_AGENT_DECISION_CARDS.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "MCP_AGENT_DECISION_CARDS.md",
      "card:",
      "smallest safe tool",
      "required before call",
      "result ceiling",
      "safe final verb",
      "boundary line",
      "draft and publish this",
      "revise this thesis",
      "anchor it",
      "prove storage / launch readiness",
      "same as last time",
      "use this API key / route / token",
      "turn this PR / issue / deploy into a thesis update",
      "market-backed thesis from pasted market",
      "patch / append / small edit this thesis",
      "verify / score / certify this thesis or fact",
      "full replacement body",
      "patch-only, diff-only, append-only, or paragraph-only",
      "platform coordination status is not protocol state",
      "verifierVerdict",
      "verifierScore",
      "schema defaults, LLM opinions, and MCP draft prep do not verify",
      "does not add new powers",
    ]) {
      expect(docs, `agent decision cards should include ${phrase}`).toContain(phrase);
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

  it("documents live MCP input field placement so agents do not invent payload fields", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    expect(docs).toContain("Live input field matrix");
    expect(docs).toContain("Live input field checklist");

    const toolFieldSets = {
      search_markets: Object.keys(searchMarketsToolSchema),
      get_thesis: Object.keys(getThesisToolSchema),
      create_thesis_draft: Object.keys(createThesisDraftToolSchema),
      prepare_revision_draft: Object.keys(prepareRevisionDraftToolSchema),
      prepare_anchor_transaction: Object.keys(prepareAnchorTransactionToolSchema),
    };

    for (const [toolName, fields] of Object.entries(toolFieldSets)) {
      expect(docs, `agent docs should include schema field matrix row for ${toolName}`).toContain(toolName);
      for (const field of fields) {
        expect(docs, `agent docs should document live input field ${toolName}.${field}`).toContain(field);
      }
    }

    for (const field of Object.keys(predictionSignalInputSchema.shape)) {
      expect(docs, `agent docs should document prediction signal field ${field}`).toContain(field);
    }

    for (const field of Object.keys(factSignalInputSchema.shape)) {
      expect(docs, `agent docs should document fact signal field ${field}`).toContain(field);
    }

    for (const phrase of [
      "walletSource` is a `create_thesis_draft` field only",
      "`note` belongs to `prepare_revision_draft` only",
      "Returned or handoff-only concepts",
      "result or handoff fields, not inputs",
      "Omit unknown URLs and report the source URL gap",
    ]) {
      expect(docs, `agent docs should include field placement guardrail ${phrase}`).toContain(phrase);
    }
  });

  it("documents operation-specific walletSource handoff handling", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_HANDOFF_TEMPLATE.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Signer / Wallet Source Handling",
      "walletSource not accepted by prepare_revision_draft",
      "signer/source approval missing before broadcast",
      "Do not add walletSource to revision or anchor-rebuild payloads",
    ]) {
      expect(docs, `agent handoff docs should include walletSource boundary phrase ${phrase}`).toContain(phrase);
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

  it("documents the execution path picker so credentials do not expand agent powers", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Execution Path Picker",
      "execution path picker",
      "Credentials, route URLs, open browser sessions, merged PRs, and green deploys are not permission upgrades",
      "Access is not approval",
      "approval scope",
      "credential scope",
      "write receipt",
      "readback evidence",
      "stay on the lowest evidenced row",
    ]) {
      expect(docs, `agent docs should include execution path guardrail ${phrase}`).toContain(phrase);
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

  it("documents the pre-send audit that catches over-strong MCP handoffs", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Pre-send audit checklist",
      "MCP text JSON envelope",
      "coordination status from protocol status",
      "final verb",
      "permission ladder",
      "storage wording",
      "boundary named",
      "missing before stronger claim",
    ]) {
      expect(docs, `agent docs should include pre-send audit phrase ${phrase}`).toContain(phrase);
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

  it("documents MCP error envelopes as blockers, not partial success payloads", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("docs/MCP_AGENT_ERROR_HANDLING.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Error envelope",
      "isError: true",
      "diagnostic text",
      "not a success payload",
      "failure class",
      "Do not parse it as a partial success payload",
      "old `anchorPreparationId`",
      "no new protocol evidence was produced",
      "format-only repair",
    ]) {
      expect(docs, `agent docs should include MCP error-envelope boundary phrase ${phrase}`).toContain(phrase);
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
      "openWorldHint: true",
      "openWorldHint: false",
      "configured market universe",
      "not approval",
      "not publication",
      "storage-readiness evidence",
    ]) {
      expect(docs, `agent docs should include tool annotation boundary phrase ${phrase}`).toContain(phrase);
    }
  });

  it("documents MCP discovery descriptions as agent permission boundaries", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "MCP Discovery Description Boundary",
      "MCP discovery descriptions",
      "tool name, description, and annotations",
      "does not publish",
      "does not broadcast",
      "does not call direct REST writes",
      "does not prove storage durability",
      "first permission check",
      "live allowlist drift",
      "lower rung",
    ]) {
      expect(docs, `agent docs should include MCP discovery-description boundary phrase ${phrase}`).toContain(phrase);
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

  it("documents read-only MCP smoke before write-adjacent onboarding rehearsal", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Read-only MCP smoke",
      "read-only MCP smoke",
      "tool list smoke",
      "description boundary smoke",
      "read-only call smoke",
      "mcpOutputCeiling: \"anchor_prepared\"",
      "storageClaimDefault: \"storage_not_assessed\"",
      "safeResultVerbs",
      "notEvidenceForStrongerClaims",
      "requiredForSubmitted",
      "requiredForPublishedLive",
      "machine-readable downgrade card",
      "write-adjacent rehearsal",
      "Do not use `create_thesis_draft`, `prepare_revision_draft`, or `prepare_anchor_transaction` as a connectivity smoke test",
      "exact `xHandle`, `walletAddress`, and `walletSource`",
      "client setup failure",
      "live allowlist drift",
      "UI scraping",
      "production write paths",
    ]) {
      expect(docs, `agent docs should include read-only MCP smoke phrase ${phrase}`).toContain(phrase);
    }
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

  it("documents that README API surface is not an agent permission map", () => {
    const docs = [
      readRepoFile("README.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "## Agent MCP Boundary",
      "README API surface is not an agent permission map",
      "start with `docs/MCP_AGENT_QUICKSTART.md`",
      "five live MCP tools",
      "POST /api/theses",
      "POST /api/thesis-anchor/prepare",
      "app/runtime surfaces",
      "not default agent publish powers",
      "separate approved execution path",
    ]) {
      expect(docs, `agent docs should include README/API boundary phrase ${phrase}`).toContain(phrase);
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

  it("documents the handoff freshness gate before reusing old protocol claims", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Handoff Freshness Gate",
      "old `anchorPreparationId`",
      "get_thesis",
      "API readback",
      "public URL evidence",
      "onchain receipt/readback",
      "named readiness/readback check",
      "Fresh readback beats comment archaeology",
      "do not use an old handoff as permission",
    ]) {
      expect(docs, `agent docs should include handoff freshness phrase ${phrase}`).toContain(phrase);
    }
  });

  it("documents revision identity readback before preparing revision drafts", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Revision identity readback gate",
      "revision identity readback",
      "parsed.thesis.author.xHandle",
      "parsed.thesis.author.walletAddress",
      "parsed.thesis.author.walletSource",
      "thesis.currentRevision.body",
      "full replacement body",
      "blocked: revision identity mismatch",
      "do not prepare revision calldata",
      "creating a replacement thesis",
    ]) {
      expect(docs, `agent docs should include revision identity readback phrase ${phrase}`).toContain(phrase);
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

  it("documents a retry budget for failed write-adjacent MCP calls", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_ERROR_HANDLING.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Retry budget",
      "MCP failure journal",
      "failure class",
      "unchanged authority",
      "payload changes allowed",
      "retry budget: <0 | 1>",
      "format-only repair",
      "same operation, identity authority, and evidence set",
      "retry at most once",
      "changing signer identity",
      "guessing a thesis id",
      "direct REST writes",
    ]) {
      expect(docs, `agent retry budget docs should include ${phrase}`).toContain(phrase);
    }
  });

  it("documents context sanitizing so coordination metadata does not become MCP payload evidence", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Context sanitizer before payloads",
      "Sanitized payload rule",
      "Sanitize noisy handoffs",
      "Payload / Handoff Separation",
      "issue status",
      "PR URL",
      "deploy URL",
      "waiting_on",
      "blocked_reason",
      "old prepared JSON",
      "old `anchorPreparationId`",
      "coordination context",
      "not in the MCP payload",
      "only accepted schema fields",
    ]) {
      expect(docs, `agent docs should include context sanitizer phrase ${phrase}`).toContain(phrase);
    }
  });

  it("documents safe lower-rung fallbacks for MCP failures", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_ERROR_HANDLING.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "No silent fallback ladder",
      "client setup failure",
      "live allowlist drift",
      "input schema mismatch",
      "missing thesis/identity readback",
      "protocol readback gap",
      "approved non-MCP execution gap",
      "Fallback ceiling",
      "UI scraping",
      "direct REST writes",
      "old `anchorPreparationId`",
    ]) {
      expect(docs, `agent fallback docs should include ${phrase}`).toContain(phrase);
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

  it("documents exact identity inputs so agents do not substitute signer or thesis authority", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_ERROR_HANDLING.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Exact identity inputs",
      "task-time approval",
      "fresh `get_thesis` readback",
      "full `0x`-prefixed 40-hex-character EVM address",
      "ENS",
      "shortened address",
      "private key",
      "same as last time",
      "old metadata",
      "`anchorPreparationId`",
      "blocked: exact identity input missing",
      "do not prepare calldata",
      "swap in Eva's wallet",
    ]) {
      expect(docs, `agent docs should include exact identity boundary phrase ${phrase}`).toContain(phrase);
    }
  });

  it("ships boundary tripwire examples for urgent unsafe write prompts", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "Boundary tripwire",
      "publish now",
      "make live",
      "use this API key",
      "reuse the old anchorPreparationId",
      "just use Eva's wallet",
      "prove storage",
      "task-time identity",
      "A credential",
      "Urgency does not change the MCP permission rung",
      "safe current claim: draft prepared / anchor prepared only",
    ]) {
      expect(docs, `agent docs should include boundary tripwire phrase ${phrase}`).toContain(phrase);
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

  it("documents the market-policy screen for prediction signals", () => {
    const docs = [
      readRepoFile("docs/MCP_AGENT_GUIDE.md"),
      readRepoFile("docs/MCP_AGENT_QUICKSTART.md"),
      readRepoFile("docs/AGENT_SAFE_OUTPUTS.md"),
      readRepoFile("docs/MCP_AGENT_EXAMPLES.md"),
      readRepoFile("docs/MCP_AGENT_ERROR_HANDLING.md"),
      readRepoFile("docs/MCP_AGENT_HANDOFF_TEMPLATE.md"),
      readRepoFile("skills/eva-agent-onboarding/SKILL.md"),
    ].join("\n");

    for (const phrase of [
      "docs/MARKET_POLICY.md",
      "market policy",
      "MCP-filtered",
      "off-policy",
      "sports",
      "elections/political offices",
      "active geopolitics/armed conflict",
      "personal tragedy/private life",
      "easily manipulated social/action prompts",
      "entertainment/pop-culture novelty",
      "signal-light",
    ]) {
      expect(docs, `agent docs should include market-policy screen phrase ${phrase}`).toContain(phrase);
    }
  });
});
