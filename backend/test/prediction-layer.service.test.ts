import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalPredictionLayerService } from "../src/services/prediction-layer.js";
import { samplePredictorIdentity } from "./fixtures.js";

const cleanupDirs: string[] = [];

function auth() {
  return {
    dynamicUserId: "dyn-user-1",
    xHandle: "@spacethesis",
    xProfileId: "x-42",
    walletAddress: samplePredictorIdentity.address,
    walletSource: "external" as const,
  };
}

describe("prediction layer service", () => {
  afterEach(async () => {
    await Promise.all(cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
    vi.unstubAllGlobals();
  });

  it("creates a multi-signal evolving thesis with weighted market and fact scores", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => [samplePredictorIdentity], async () => []);

    const created = await service.createThesis({
      identity: auth(),
      title: "SpaceX IPO liquidity rotation thesis",
      body:
        "SpaceX IPO anticipation is absorbing speculative liquidity now; after the IPO path is explicit, risk markets reprice.",
      predictionSignals: [
        {
          provider: "manual",
          marketTitle: "Will SpaceX IPO before the end of 2027?",
          selectedOutcomeLabel: "Yes",
          oddsAtAdd: 0.24,
          currentOdds: 0.36,
          weight: 60,
          role: "core",
          rationale: "IPO timing is the direct catalyst for the liquidity rotation thesis.",
          status: "open",
        },
      ],
      factSignals: [
        {
          claimText: "SpaceX has explored tender offers before a public listing.",
          sourceUrl: "https://example.com/spacex-tender",
          verifierScore: 82,
          verifierVerdict: "likely_true",
          reportUri: "ipfs://spacex-fact-report",
          reportHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
          weight: 40,
          role: "second_order",
        },
      ],
    });

    expect(created.created).toBe(true);
    expect(created.thesis.title).toBe("SpaceX IPO liquidity rotation thesis");
    expect(created.thesis.author.xHandle).toBe("@spacethesis");
    expect(created.thesis.author.walletAddress).toBe(samplePredictorIdentity.address);
    expect(created.thesis.signals).toHaveLength(2);
    expect(created.thesis.currentScore).toBe(70);
    expect(created.thesis.timeline[0]).toMatchObject({
      action: "created",
      scoreAfter: 70,
    });

    const detail = await service.getThesis(created.thesis.thesisId);
    expect(detail?.thesis.currentRevision.body).toContain("risk markets reprice");
    expect(detail?.predictor).toMatchObject({
      registered: true,
      wallet: samplePredictorIdentity.address,
      trustScore: samplePredictorIdentity.trustScore,
    });
  });

  it("records revisions with immutable before and after score snapshots", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => [], async () => []);
    const created = await service.createThesis({
      identity: auth(),
      title: "SpaceX IPO liquidity rotation thesis",
      body: "Initial thesis.",
      predictionSignals: [
        {
          provider: "manual",
          marketTitle: "Will SpaceX IPO before the end of 2027?",
          selectedOutcomeLabel: "Yes",
          oddsAtAdd: 0.25,
          currentOdds: 0.25,
          weight: 100,
          role: "core",
          status: "open",
        },
      ],
    });

    const revised = await service.recordRevision(created.thesis.thesisId, {
      identity: auth(),
      body: "Updated thesis after IPO timing odds improved.",
      note: "Market moved in favor of the catalyst.",
      signalUpdates: [
        {
          signalId: created.thesis.signals[0]!.signalId,
          currentOdds: 0.45,
          weight: 100,
        },
      ],
    });

    expect(revised?.thesis.currentScore).toBe(70);
    expect(revised?.thesis.currentRevision.version).toBe(2);
    expect(revised?.thesis.timeline.at(-1)).toMatchObject({
      action: "revised",
      scoreBefore: 50,
      scoreAfter: 70,
      note: "Market moved in favor of the catalyst.",
    });
    expect(revised?.thesis.revisions.map((revision) => revision.body)).toEqual([
      "Initial thesis.",
      "Updated thesis after IPO timing odds improved.",
    ]);
  });

  it("scores closed prediction signals from resolved outcomes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => [], async () => []);

    const created = await service.createThesis({
      identity: auth(),
      title: "Closed market score",
      body: "Closed market score test.",
      predictionSignals: [
        {
          provider: "manual",
          marketTitle: "Did the catalyst resolve?",
          selectedOutcomeLabel: "Yes",
          resolvedOutcomeLabel: "Yes",
          oddsAtAdd: 0.3,
          currentOdds: 1,
          weight: 100,
          role: "core",
          status: "resolved",
        },
      ],
    });

    expect(created.thesis.currentScore).toBe(100);
    expect(created.thesis.signals[0]).toMatchObject({
      kind: "prediction_market",
      signalScore: 100,
    });
  });

  it("requires verified X and wallet identity for thesis writes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => [], async () => []);

    await expect(
      service.createThesis({
        identity: {
          dynamicUserId: "dyn-user-1",
          xHandle: "",
          xProfileId: null,
          walletAddress: null,
          walletSource: null,
        },
        title: "Missing identity",
        body: "This should fail.",
      }),
    ).rejects.toThrow("Connected X identity and wallet are required");
  });

  it("loads provider markets broadly while excluding sports markets", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(
      join(dir, "index.json"),
      async () => [],
      async () => [
        {
          marketId: "polymarket-presidential-nomination",
          provider: "polymarket",
          externalId: "politics-1",
          url: "https://polymarket.com/event/will-example-win-the-presidential-nomination",
          title: "Will Example win the 2028 presidential nomination?",
          category: "Politics",
          status: "open",
          volumeUsd: 10_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.12 },
            { outcomeId: "no", label: "No", price: 0.88 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-super-bowl",
          provider: "polymarket",
          externalId: "sports-1",
          url: "https://polymarket.com/event/will-example-win-the-game",
          title: "Will Example win the game?",
          category: "Sports",
          status: "open",
          volumeUsd: 9_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.45 },
            { outcomeId: "no", label: "No", price: 0.55 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    );

    const markets = await service.listMarkets();
    expect(markets.markets.map((market) => market.marketId)).toContain("polymarket-presidential-nomination");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-super-bowl");
  });
});
