import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createEvaMcpToolHandlers } from "../src/mcp-tools.js";
import type { EvaUsageVerifier } from "../src/services/eva-usage.js";
import { LocalPredictionLayerService } from "../src/services/prediction-layer.js";

const cleanupDirs: string[] = [];
const walletAddress = "0x1111111111111111111111111111111111111111";

afterEach(async () => {
  await Promise.all(cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function makeService(usageVerifier?: EvaUsageVerifier) {
  const dir = await mkdtemp(join(tmpdir(), "eva-mcp-tools-"));
  cleanupDirs.push(dir);
  const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => [], async () => []);
  return { service, handlers: createEvaMcpToolHandlers(service, usageVerifier) };
}

function parseToolJson(result: { content: Array<{ type: "text"; text: string }> }) {
  return JSON.parse(result.content[0]!.text) as Record<string, unknown>;
}

function thesisInput() {
  return {
    title: "Agent-only liquidity rotation draft",
    body: "Private agent draft about liquidity rotation before publication.",
    xHandle: "@agentalpha",
    walletAddress,
    walletSource: "external" as const,
    predictionSignals: [
      {
        marketId: "spacex-ipo-before-2027",
        selectedOutcomeLabel: "Yes",
        oddsAtAdd: 0.24,
        currentOdds: 0.36,
        weight: 60,
        role: "core" as const,
      },
    ],
    factSignals: [
      {
        claimText: "SpaceX has explored tender offers before a public listing.",
        verifierVerdict: "likely_true" as const,
        verifierScore: 82,
        weight: 40,
        role: "second_order" as const,
      },
    ],
  };
}

describe("Eva MCP tool handlers", () => {
  it("prepares thesis drafts for anchoring without publishing them", async () => {
    const { service, handlers } = await makeService();

    const result = await handlers.createThesisDraft(thesisInput());
    const body = parseToolJson(result);
    const theses = await service.listTheses();

    expect(body).toMatchObject({
      publishState: "anchor_prepared_not_published",
      anchorStatus: "prepared",
      thesis: {
        title: "Agent-only liquidity rotation draft",
        anchor: { status: "unanchored" },
      },
      transactions: expect.arrayContaining([
        expect.objectContaining({ description: expect.stringContaining("Create thesis protocol record") }),
      ]),
    });
    expect(body).toHaveProperty("anchorPreparationId");
    expect(theses.theses.some((thesis) => thesis.title === "Agent-only liquidity rotation draft")).toBe(false);
  });

  it("prepares revision drafts for anchoring without mutating thesis history", async () => {
    const { service, handlers } = await makeService();
    const created = await service.createThesis({
      identity: {
        dynamicUserId: "mcp:@agentalpha",
        xHandle: "@agentalpha",
        xProfileId: null,
        walletAddress,
        walletSource: "external",
      },
      title: "Seed thesis",
      body: "Initial thesis body.",
      predictionSignals: [{ selectedOutcomeLabel: "Yes", oddsAtAdd: 0.3, currentOdds: 0.3, weight: 100 }],
    });

    const result = await handlers.prepareRevisionDraft({
      thesisId: created.thesis.thesisId,
      body: "Updated thesis body after the catalyst moved.",
      note: "Catalyst update.",
      xHandle: "@agentalpha",
      walletAddress,
    });
    const body = parseToolJson(result);
    const stored = await service.getThesis(created.thesis.thesisId);

    expect(body).toMatchObject({
      publishState: "anchor_prepared_not_published",
      anchorStatus: "prepared",
      thesis: {
        currentRevision: { version: 2 },
        body: "Updated thesis body after the catalyst moved.",
      },
      transactions: expect.arrayContaining([expect.objectContaining({ description: expect.stringContaining("Record revision") })]),
    });
    expect(stored?.thesis.currentRevision.version).toBe(1);
    expect(stored?.thesis.body).toBe("Initial thesis body.");
  });

  it("wraps existing-thesis anchor preparation in the same not-published boundary", async () => {
    const { service, handlers } = await makeService();
    const created = await service.createThesis({
      identity: {
        dynamicUserId: "seed:@agentalpha",
        xHandle: "@agentalpha",
        xProfileId: null,
        walletAddress,
        walletSource: "external",
      },
      title: "Seed thesis for re-anchor prep",
      body: "Initial thesis body.",
      predictionSignals: [{ selectedOutcomeLabel: "Yes", oddsAtAdd: 0.3, currentOdds: 0.3, weight: 100 }],
    });

    const result = await handlers.prepareExistingThesisAnchorTransaction({ thesisId: created.thesis.thesisId });
    const body = parseToolJson(result);

    expect(body).toMatchObject({
      publishState: "anchor_prepared_not_published",
      anchorStatus: "prepared",
      thesis: {
        thesisId: created.thesis.thesisId,
        title: "Seed thesis for re-anchor prep",
      },
      transactions: expect.arrayContaining([
        expect.objectContaining({ description: expect.stringContaining("Create thesis protocol record") }),
      ]),
      nextStep: expect.stringContaining("approve and confirm"),
    });
    expect(body).toHaveProperty("anchorPreparationId");
  });

  it("releases an agent proof bundle only after exact EVA receipt verification", async () => {
    const usageVerifier: EvaUsageVerifier = {
      async verifyUsage({ txHash, quote }) {
        if (txHash !== `0x${"d".repeat(64)}` || quote.action !== "agent_proof_bundle" || quote.permit2) {
          return { ok: false, error: "EVA usage receipt does not match this quote" };
        }
        return {
          ok: true,
          receiptId: `0x${"e".repeat(64)}`,
          confirmedAt: "2026-07-26T18:00:00.000Z",
          blockNumber: "90000000",
        };
      },
    };
    const { service, handlers } = await makeService(usageVerifier);
    const created = await service.createThesis({
      identity: {
        dynamicUserId: "seed:@agentalpha",
        xHandle: "@agentalpha",
        xProfileId: null,
        walletAddress,
        walletSource: "external",
      },
      title: "Paid proof bundle seed",
      body: "Initial thesis body.",
      predictionSignals: [{
        marketUrl: "https://example.com/market/paid-proof",
        selectedOutcomeLabel: "Yes",
        oddsAtAdd: 0.3,
        currentOdds: 0.3,
        weight: 100,
      }],
    });

    const quoteResult = await handlers.prepareEvaProofQuote({
      thesisId: created.thesis.thesisId,
      walletAddress,
    });
    expect(parseToolJson(quoteResult)).toMatchObject({
      action: "agent_proof_bundle",
      amountWei: "10000000000000000000000",
      permit2: false,
    });

    const released = await handlers.getPaidThesisProofBundle({
      thesisId: created.thesis.thesisId,
      walletAddress,
      evaUsageTxHash: `0x${"d".repeat(64)}`,
    });
    expect(parseToolJson(released)).toMatchObject({
      releaseState: "paid_proof_bundle_released",
      payment: {
        txHash: `0x${"d".repeat(64)}`,
        permit2: false,
      },
      proofBundle: {
        thesisId: created.thesis.thesisId,
        title: "Paid proof bundle seed",
        sources: ["https://example.com/market/paid-proof"],
      },
    });
  });

  it("does not release an agent proof bundle for a non-matching receipt", async () => {
    const usageVerifier: EvaUsageVerifier = {
      async verifyUsage() {
        return { ok: false, error: "EVA usage receipt does not match this wallet, action, amount, and resource" };
      },
    };
    const { service, handlers } = await makeService(usageVerifier);
    const created = await service.createThesis({
      identity: {
        dynamicUserId: "seed:@agentalpha",
        xHandle: "@agentalpha",
        xProfileId: null,
        walletAddress,
        walletSource: "external",
      },
      title: "Rejected proof bundle seed",
      body: "Initial thesis body.",
      predictionSignals: [{ selectedOutcomeLabel: "Yes", oddsAtAdd: 0.3, currentOdds: 0.3, weight: 100 }],
    });

    const rejected = await handlers.getPaidThesisProofBundle({
      thesisId: created.thesis.thesisId,
      walletAddress,
      evaUsageTxHash: `0x${"c".repeat(64)}`,
    });
    expect(rejected.isError).toBe(true);
    expect(rejected.content[0]!.text).toMatch(/does not match/);
  });
});
