import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalPredictionLayerService, resolvePredictionIndexPath, resolvePredictionStorageReadiness } from "../src/services/prediction-layer.js";
import { samplePredictorIdentity } from "./fixtures.js";

const cleanupDirs: string[] = [];

function auth() {
  return {
    dynamicUserId: "dyn-user-1",
    xHandle: "@macrodesk",
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

  it("uses tmp-backed storage on serverless hosts when no durable storage dir is configured", () => {
    expect(resolvePredictionIndexPath("/var/eva", { VERCEL: "1" })).toBe(join("/var/eva", "predictions.json"));
    expect(resolvePredictionIndexPath("", { VERCEL: "1" })).toBe(join(tmpdir(), "eva-predictions/index.json"));
    expect(resolvePredictionIndexPath("", { AWS_LAMBDA_FUNCTION_NAME: "eva-api" })).toBe(join(tmpdir(), "eva-predictions/index.json"));
  });

  it("reports whether thesis write storage is production-durable", () => {
    expect(resolvePredictionStorageReadiness("", { VERCEL: "1" })).toMatchObject({
      mode: "serverless_tmp",
      ready: false,
      durable: false,
      blobTokenConfigured: false,
    });
    expect(resolvePredictionStorageReadiness("", { VERCEL: "1", BLOB_READ_WRITE_TOKEN: "token" })).toMatchObject({
      mode: "vercel_blob",
      ready: true,
      durable: true,
      writePath: "eva-predictions/index.json",
      blobTokenConfigured: true,
    });
    expect(
      resolvePredictionStorageReadiness("", {
        VERCEL: "1",
        KV_REST_API_URL: "https://example.upstash.io",
        KV_REST_API_TOKEN: "token",
      }),
    ).toMatchObject({
      mode: "upstash_redis",
      ready: true,
      durable: true,
      writePath: "eva-predictions:index",
      kvConfigured: true,
    });
    expect(
      resolvePredictionStorageReadiness("", {
        VERCEL: "1",
        EVA_PREDICTION_STORAGE_BACKEND: "upstash_redis",
        BLOB_READ_WRITE_TOKEN: "blob-token",
        KV_REST_API_URL: "https://example.upstash.io",
        KV_REST_API_TOKEN: "kv-token",
        EVA_PREDICTION_KV_KEY: "eva:test:index",
      }),
    ).toMatchObject({
      mode: "upstash_redis",
      ready: true,
      durable: true,
      writePath: "eva:test:index",
      blobTokenConfigured: true,
      kvConfigured: true,
    });
    expect(resolvePredictionStorageReadiness("/var/eva", {})).toMatchObject({
      mode: "local_filesystem",
      ready: true,
      durable: true,
      writePath: join("/var/eva", "predictions.json"),
    });
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
    expect(created.thesis.author.xHandle).toBe("@macrodesk");
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
    expect(revised?.thesis.revisions[0]?.scoreBefore).toBeNull();
    expect(revised?.thesis.revisions[0]?.scoreAfter).toBe(50);
    expect(revised?.thesis.revisions[0]?.signalSnapshot[0]).toMatchObject({ currentOdds: 0.25, signalScore: 50 });
    expect(revised?.thesis.revisions[1]?.scoreBefore).toBe(50);
    expect(revised?.thesis.revisions[1]?.scoreAfter).toBe(70);
    expect(revised?.thesis.revisions[1]?.signalSnapshot[0]).toMatchObject({ currentOdds: 0.45, signalScore: 70 });

    const reRevised = await service.recordRevision(created.thesis.thesisId, {
      identity: auth(),
      body: "Updated thesis after IPO timing odds strengthened again.",
      note: "Second market repricing.",
      signalUpdates: [
        {
          signalId: created.thesis.signals[0]!.signalId,
          currentOdds: 0.6,
          weight: 100,
        },
      ],
    });

    expect(reRevised?.thesis.currentScore).toBe(85);
    expect(reRevised?.thesis.revisions.map((revision) => revision.scoreAfter)).toEqual([50, 70, 85]);
    expect(reRevised?.thesis.revisions.map((revision) => revision.signalSnapshot[0]?.signalScore)).toEqual([50, 70, 85]);
    expect(reRevised?.thesis.revisions.map((revision) => revision.signalSnapshot[0]?.currentOdds)).toEqual([0.25, 0.45, 0.6]);
    expect(reRevised?.thesis.timeline.map((entry) => entry.scoreBefore)).toEqual([null, 50, 70]);
    expect(reRevised?.thesis.timeline.map((entry) => entry.scoreAfter)).toEqual([50, 70, 85]);
  });

  it("persists a paid revision, confirmed anchor, and EVA receipt in one revision write", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => [], async () => []);
    const created = await service.createThesis({
      identity: auth(),
      title: "Atomic paid revision",
      body: "Initial thesis.",
      predictionSignals: [
        {
          provider: "manual",
          marketTitle: "Will the atomic path work?",
          selectedOutcomeLabel: "Yes",
          oddsAtAdd: 0.5,
          currentOdds: 0.5,
          weight: 100,
          role: "core",
          status: "open",
        },
      ],
    });
    const txHash = `0x${"b".repeat(64)}` as `0x${string}`;
    const receiptTxHash = `0x${"c".repeat(64)}` as `0x${string}`;
    const confirmedAt = "2026-07-26T12:00:00.000Z";

    const revised = await service.recordRevision(
      created.thesis.thesisId,
      {
        identity: auth(),
        body: "Updated thesis with an atomic paid receipt.",
        note: "Atomic paid revision.",
      },
      {
        txHash,
        confirmedAt,
        usageReceipt: {
          action: "publish_revision",
          txHash: receiptTxHash,
          receiptId: "usage-receipt-atomic",
          amountWei: "25000000000000000000000",
          referenceHash: `0x${"d".repeat(64)}`,
          confirmedAt,
          blockNumber: "76543210",
        },
      },
    );

    expect(revised?.thesis.currentRevision.anchor).toMatchObject({
      status: "confirmed",
      txHash,
      confirmedAt,
    });
    expect(revised?.thesis.evaUsageReceipts).toEqual([
      expect.objectContaining({
        receiptId: "usage-receipt-atomic",
        action: "publish_revision",
        txHash: receiptTxHash,
      }),
    ]);
    expect(revised?.thesis.timeline.slice(-2).map((entry) => entry.action)).toEqual(["revised", "anchored"]);
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

  it("rejects spoofed author identity payloads for existing thesis authors", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => [], async () => []);

    const created = await service.createThesis({
      identity: auth(),
      title: "Author binding thesis",
      body: "The first thesis binds X, Dynamic, and wallet identity.",
      predictionSignals: [
        {
          provider: "manual",
          marketTitle: "Will identity spoofing be blocked?",
          selectedOutcomeLabel: "Yes",
          oddsAtAdd: 0.5,
          currentOdds: 0.5,
          weight: 100,
          role: "core",
          status: "open",
        },
      ],
    });

    await expect(
      service.previewThesis({
        identity: {
          ...auth(),
          dynamicUserId: "dyn-attacker",
          walletAddress: "0x2222222222222222222222222222222222222222",
        },
        title: "Spoofed same handle thesis",
        body: "This should not preview as the existing handle.",
      }),
    ).rejects.toThrow("Identity payload conflicts with an existing thesis author");

    await expect(
      service.previewRevision(created.thesis.thesisId, {
        identity: {
          ...auth(),
          xHandle: "@spoofedhandle",
        },
        body: "A same-wallet actor cannot silently change the author handle during revision.",
      }),
    ).rejects.toThrow("Only the thesis author can revise this thesis");
  });

  it("loads provider markets broadly while excluding V1-prohibited market categories", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(
      join(dir, "index.json"),
      async () => [],
      async () => [
        {
          marketId: "polymarket-fed-cut",
          provider: "polymarket",
          externalId: "macro-1",
          url: "https://polymarket.com/event/will-the-fed-cut-rates",
          title: "Will the Fed cut rates before September?",
          category: "Macro",
          status: "open",
          volumeUsd: 12_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.42 },
            { outcomeId: "no", label: "No", price: 0.58 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
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
          marketId: "polymarket-taiwan-blockade",
          provider: "polymarket",
          externalId: "geopolitics-1",
          url: "https://polymarket.com/event/will-china-blockade-taiwan",
          title: "Will China blockade Taiwan by June 30?",
          category: "Geopolitics",
          status: "open",
          volumeUsd: 8_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.2 },
            { outcomeId: "no", label: "No", price: 0.8 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-criminal-trial",
          provider: "polymarket",
          externalId: "crime-1",
          url: "https://polymarket.com/event/will-example-be-convicted",
          title: "Will Example be convicted in a criminal trial?",
          category: "Law",
          status: "open",
          volumeUsd: 7_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.5 },
            { outcomeId: "no", label: "No", price: 0.5 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-tweet",
          provider: "polymarket",
          externalId: "manipulable-1",
          url: "https://polymarket.com/event/will-example-tweet",
          title: "Will Example tweet the word AI this week?",
          category: "Culture",
          status: "open",
          volumeUsd: 6_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.5 },
            { outcomeId: "no", label: "No", price: 0.5 },
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
        {
          marketId: "polymarket-xi-jinping",
          provider: "polymarket",
          externalId: "politics-2",
          url: "https://polymarket.com/event/xi-jinping-out-before-2027",
          title: "Xi Jinping out before 2027?",
          category: "News",
          status: "open",
          volumeUsd: 5_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.18 },
            { outcomeId: "no", label: "No", price: 0.82 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-netanyahu",
          provider: "polymarket",
          externalId: "politics-3",
          url: "https://polymarket.com/event/netanyahu-out-by-end-of-2026",
          title: "Netanyahu out by end of 2026?",
          category: "News",
          status: "open",
          volumeUsd: 4_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.3 },
            { outcomeId: "no", label: "No", price: 0.7 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-taylor-pregnant",
          provider: "polymarket",
          externalId: "personal-1",
          url: "https://polymarket.com/event/taylor-swift-pregnant-before-marriage",
          title: "Taylor Swift pregnant before marriage?",
          category: "Culture",
          status: "open",
          volumeUsd: 3_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.25 },
            { outcomeId: "no", label: "No", price: 0.75 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "kalshi-scotus-sports-contract",
          provider: "kalshi",
          externalId: "legal-sports-1",
          url: "https://kalshi.com/markets/kxscotus-sports-event-contract",
          title: "SCOTUS accepts sports event contract case by July 31, 2026?",
          category: "Law",
          status: "open",
          volumeUsd: 2_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.35 },
            { outcomeId: "no", label: "No", price: 0.65 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "kalshi-kt-wiz-hanwha-first-inning-run",
          provider: "kalshi",
          externalId: "sports-baseball-1",
          url: "https://kalshi.com/markets/ktwiz-hanwha-first-inning-run",
          title: "KT Wiz vs Hanwha Eagles: First Inning Run?",
          category: "Kalshi",
          status: "open",
          volumeUsd: 2_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.35 },
            { outcomeId: "no", label: "No", price: 0.65 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "kalshi-lg-twins-kiwoom-first-inning-run",
          provider: "kalshi",
          externalId: "sports-baseball-2",
          url: "https://kalshi.com/markets/lgtwins-kiwoom-first-inning-run",
          title: "LG Twins vs Kiwoom Heroes: First Inning Run?",
          category: "Kalshi",
          status: "open",
          volumeUsd: 2_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.35 },
            { outcomeId: "no", label: "No", price: 0.65 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "kalshi-lotte-doosan-first-inning-run",
          provider: "kalshi",
          externalId: "sports-baseball-3",
          url: "https://kalshi.com/markets/lotte-doosan-first-inning-run",
          title: "Lotte Giants vs Doosan Bears: First Inning Run?",
          category: "Kalshi",
          status: "open",
          volumeUsd: 2_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.35 },
            { outcomeId: "no", label: "No", price: 0.65 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-jesus-gta",
          provider: "polymarket",
          externalId: "religion-1",
          url: "https://polymarket.com/event/will-jesus-christ-return-before-gta-vi",
          title: "Will Jesus Christ return before GTA VI?",
          category: "Culture",
          status: "open",
          volumeUsd: 1_000_000,
          liquidityUsd: 500_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.01 },
            { outcomeId: "no", label: "No", price: 0.99 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-bitcoin-before-gta",
          provider: "polymarket",
          externalId: "entertainment-gta-1",
          url: "https://polymarket.com/event/will-bitcoin-hit-1m-before-gta-vi",
          title: "Will bitcoin hit $1m before GTA VI?",
          category: "Crypto",
          status: "open",
          volumeUsd: 1_000_000,
          liquidityUsd: 500_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.05 },
            { outcomeId: "no", label: "No", price: 0.95 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-rihanna-album-before-gta",
          provider: "polymarket",
          externalId: "entertainment-album-1",
          url: "https://polymarket.com/event/new-rihanna-album-before-gta-vi",
          title: "New Rihanna Album before GTA VI?",
          category: "Culture",
          status: "open",
          volumeUsd: 1_000_000,
          liquidityUsd: 500_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.4 },
            { outcomeId: "no", label: "No", price: 0.6 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-carti-album-before-gta",
          provider: "polymarket",
          externalId: "entertainment-album-2",
          url: "https://polymarket.com/event/new-playboi-carti-album-before-gta-vi",
          title: "New Playboi Carti Album before GTA VI?",
          category: "Culture",
          status: "open",
          volumeUsd: 1_000_000,
          liquidityUsd: 500_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.35 },
            { outcomeId: "no", label: "No", price: 0.65 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-gpt6-before-gta",
          provider: "polymarket",
          externalId: "entertainment-gta-2",
          url: "https://polymarket.com/event/will-gpt-6-be-released-before-gta-vi",
          title: "Will GPT-6 be released before GTA VI?",
          category: "Technology",
          status: "open",
          volumeUsd: 1_000_000,
          liquidityUsd: 500_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.3 },
            { outcomeId: "no", label: "No", price: 0.7 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-next-james-bond",
          provider: "polymarket",
          externalId: "entertainment-casting-1",
          url: "https://polymarket.com/event/will-example-be-announced-as-next-james-bond",
          title: "Will Example be announced as next James Bond?",
          category: "Culture",
          status: "open",
          volumeUsd: 1_000_000,
          liquidityUsd: 500_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.2 },
            { outcomeId: "no", label: "No", price: 0.8 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-starmer-out",
          provider: "polymarket",
          externalId: "politics-4",
          url: "https://polymarket.com/event/starmer-out-by-june-30-2026",
          title: "Starmer out by June 30, 2026?",
          category: "News",
          status: "open",
          volumeUsd: 1_000_000,
          liquidityUsd: 500_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.25 },
            { outcomeId: "no", label: "No", price: 0.75 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-balance-of-power-other",
          provider: "polymarket",
          externalId: "politics-5",
          url: "https://polymarket.com/event/2026-balance-of-power-other",
          title: "2026 Balance of Power: Other",
          category: "News",
          status: "open",
          volumeUsd: 1_000_000,
          liquidityUsd: 500_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.08 },
            { outcomeId: "no", label: "No", price: 0.92 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-erdogan-out",
          provider: "polymarket",
          externalId: "politics-6",
          url: "https://polymarket.com/event/erdoan-out-before-2027",
          title: "Erdoğan out by December 31, 2026?",
          category: "Polymarket",
          status: "open",
          volumeUsd: 1_000_000,
          liquidityUsd: 500_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.19 },
            { outcomeId: "no", label: "No", price: 0.81 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-macron-out",
          provider: "polymarket",
          externalId: "politics-7",
          url: "https://polymarket.com/event/macron-out-by-june-30-2026-273",
          title: "Macron out by June 30, 2026?",
          category: "Polymarket",
          status: "open",
          volumeUsd: 1_000_000,
          liquidityUsd: 500_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.22 },
            { outcomeId: "no", label: "No", price: 0.78 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-bernie-endorse-senate",
          provider: "polymarket",
          externalId: "politics-8",
          url: "https://polymarket.com/event/will-bernie-endorse-james-talarico-for-tx-sen-by-nov-2-2026-et",
          title: "Will Bernie endorse James Talarico for TX-Sen by Nov 2 2026 ET?",
          category: "Polymarket",
          status: "open",
          volumeUsd: 1_000_000,
          liquidityUsd: 500_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.31 },
            { outcomeId: "no", label: "No", price: 0.69 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    );

    const markets = await service.listMarkets();
    expect(markets.markets.map((market) => market.marketId)).toContain("polymarket-fed-cut");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-presidential-nomination");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-taiwan-blockade");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-criminal-trial");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-tweet");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-super-bowl");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-xi-jinping");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-netanyahu");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-taylor-pregnant");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("kalshi-scotus-sports-contract");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("kalshi-kt-wiz-hanwha-first-inning-run");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("kalshi-lg-twins-kiwoom-first-inning-run");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("kalshi-lotte-doosan-first-inning-run");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-jesus-gta");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-bitcoin-before-gta");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-rihanna-album-before-gta");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-carti-album-before-gta");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-gpt6-before-gta");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-next-james-bond");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-starmer-out");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-balance-of-power-other");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-erdogan-out");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-macron-out");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-bernie-endorse-senate");
  });
});
