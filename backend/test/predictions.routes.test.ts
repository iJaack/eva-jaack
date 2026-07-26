import { Hono } from "hono";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPredictionRoutes } from "../src/routes/predictions.js";
import { LocalPredictionLayerService } from "../src/services/prediction-layer.js";
import { fetchJson } from "./helpers.js";

const cleanupDirs: string[] = [];
const walletAddress = "0x1111111111111111111111111111111111111111";
const draftAnchorTxHash = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const revisionAnchorTxHash = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const rejectedAnchorTxHash = "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
const evaUsageTxHash = "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";

afterEach(async () => {
  await Promise.all(cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function makeService() {
  const dir = await mkdtemp(join(tmpdir(), "eva-prediction-routes-"));
  cleanupDirs.push(dir);
  return new LocalPredictionLayerService(join(dir, "index.json"), async () => [], async () => []);
}

function makeRoutedApp(service: LocalPredictionLayerService, options: { confirmedTxHashes?: string[]; wrongCalldataTxHashes?: string[] } = {}) {
  const confirmedTxHashes = new Set(options.confirmedTxHashes ?? [draftAnchorTxHash, revisionAnchorTxHash]);
  const wrongCalldataTxHashes = new Set(options.wrongCalldataTxHashes ?? []);
  const anchorVerifier = {
    async verifyPreparedAnchor({ txHash, expectedTransactions }: { txHash: string; expectedTransactions: Array<{ data: string }> }) {
      if (!confirmedTxHashes.has(txHash)) {
        return { ok: false, error: "Anchor transaction is not confirmed" };
      }
      if (wrongCalldataTxHashes.has(txHash) || expectedTransactions.length === 0) {
        return { ok: false, error: "Anchor transaction does not match prepared calldata" };
      }
      return { ok: true, confirmedAt: "2026-06-06T21:30:00.000Z" };
    },
  };
  const usageVerifier = {
    async verifyUsage({ txHash, quote }: { txHash: string; quote: { account: string; amountWei: string; permit2: boolean } }) {
      if (txHash !== evaUsageTxHash) return { ok: false as const, error: "EVA usage transaction is not confirmed on Avalanche" };
      if (quote.account.toLowerCase() !== walletAddress.toLowerCase() || BigInt(quote.amountWei) <= 0n || quote.permit2) {
        return { ok: false as const, error: "EVA usage receipt does not match this quote" };
      }
      return {
        ok: true as const,
        receiptId: `0x${"e".repeat(64)}` as `0x${string}`,
        confirmedAt: "2026-06-06T21:31:00.000Z",
        blockNumber: "90000000",
      };
    },
  };
  const app = new Hono();
  const deps = { predictions: service, anchorVerifier, usageVerifier };
  app.route("/api", createPredictionRoutes(deps));
  return app;
}

async function makeApp(options: { confirmedTxHashes?: string[]; wrongCalldataTxHashes?: string[] } = {}) {
  return makeRoutedApp(await makeService(), options);
}

function identityPayload() {
  return {
    dynamicUserId: "dyn-route-1",
    xHandle: "@routealpha",
    xProfileId: "x-route-1",
    walletAddress,
    walletSource: "embedded",
  };
}

function thesisCreatePayload(overrides: Record<string, unknown> = {}) {
  return {
    ...identityPayload(),
    title: "SpaceX IPO liquidity rotation thesis",
    body: "SpaceX IPO anticipation is absorbing speculative liquidity now.",
    predictionSignals: [
      {
        marketId: "spacex-ipo-before-2027",
        selectedOutcomeLabel: "Yes",
        oddsAtAdd: 0.24,
        currentOdds: 0.36,
        weight: 60,
        role: "core",
      },
    ],
    factSignals: [
      {
        claimText: "SpaceX has explored tender offers before a public listing.",
        verifierVerdict: "likely_true",
        verifierScore: 82,
        reportUri: "ipfs://route-fact",
        weight: 40,
        role: "second_order",
      },
    ],
    ...overrides,
  };
}

describe("prediction routes", () => {
  it("serves summary, market detail, and predictor rankings", async () => {
    const app = await makeApp();

    const summary = await fetchJson(app, "/api/prediction-summary");
    const market = await fetchJson(app, "/api/markets/spacex-ipo-before-2027");
    const predictors = await fetchJson(app, "/api/predictors");

    expect(summary.status).toBe(200);
    expect(summary.body).toMatchObject({
      stats: {
        marketCount: expect.any(Number),
        openThesisCount: expect.any(Number),
      },
    });
    expect(market.status).toBe(200);
    expect(market.body).toMatchObject({
      market: { marketId: "spacex-ipo-before-2027" },
    });
    expect(predictors.status).toBe(200);
    expect(predictors.body).toMatchObject({
      count: expect.any(Number),
    });
  });

  it("quotes deterministic direct ERC-20 EVA usage without Permit2", async () => {
    const app = await makeApp();
    const quoted = await fetchJson(app, "/api/eva/usage/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "agent_proof_bundle",
        account: walletAddress,
        resourceId: "thesis-route-proof-1",
      }),
    });

    expect(quoted.status).toBe(200);
    expect(quoted.body).toMatchObject({
      action: "agent_proof_bundle",
      amountWei: "10000000000000000000000",
      account: "0x1111111111111111111111111111111111111111",
      paymentBoundary: "wallet_approval_and_broadcast_required",
      permit2: false,
      approvalTransaction: {
        to: "0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672",
        data: expect.stringMatching(/^0x095ea7b3/),
      },
      retirementTransaction: {
        to: "0xFfEA6272e6C7e035FE529a226A9aA5D9cD98B296",
        data: expect.stringMatching(/^0x/),
      },
    });
  });

  it("creates and revises a multi-signal thesis", async () => {
    const app = await makeApp();
    const payload = thesisCreatePayload();
    const prepared = await fetchJson(app, "/api/thesis-drafts/protocol/prepare-anchor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(prepared.status).toBe(200);
    expect(prepared.body).toMatchObject({
      anchorPreparationId: expect.stringMatching(/^draft-anchor-/),
      anchorStatus: "prepared",
      transactions: expect.arrayContaining([expect.objectContaining({ description: expect.stringContaining("Create thesis protocol record") })]),
      evaUsageQuote: {
        action: "publish_thesis",
        amountWei: "100000000000000000000000",
        permit2: false,
      },
    });

    const created = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        anchorPreparationId: (prepared.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: draftAnchorTxHash,
        evaUsageTxHash,
      }),
    });

    expect(created.status).toBe(201);
    const thesisId = (created.body as { thesis: { thesisId: string; currentScore: number } }).thesis.thesisId;
    expect((created.body as { thesis: { currentScore: number } }).thesis.currentScore).toBe(70);

    const detail = await fetchJson(app, `/api/theses/${thesisId}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({
      thesis: {
        title: "SpaceX IPO liquidity rotation thesis",
        anchor: { status: "confirmed", txHash: draftAnchorTxHash, confirmedAt: "2026-06-06T21:30:00.000Z" },
        currentRevision: { anchor: { status: "confirmed", txHash: draftAnchorTxHash, confirmedAt: "2026-06-06T21:30:00.000Z" } },
        evaUsageReceipts: [
          expect.objectContaining({
            action: "publish_thesis",
            txHash: evaUsageTxHash,
            amountWei: "100000000000000000000000",
          }),
        ],
        signals: expect.arrayContaining([expect.objectContaining({ kind: "prediction_market" })]),
      },
    });

    const signalId = (created.body as { thesis: { signals: Array<{ signalId: string }> } }).thesis.signals[0]!.signalId;
    const revisionPayload = {
      ...identityPayload(),
      body: "SpaceX IPO timing odds strengthened, so the thesis confidence improved.",
      note: "IPO timing signal moved.",
      signalUpdates: [{ signalId, currentOdds: 0.45 }],
    };
    const preparedRevision = await fetchJson(app, `/api/theses/${thesisId}/revision-drafts/protocol/prepare-anchor`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(revisionPayload),
    });
    expect(preparedRevision.status).toBe(200);
    expect(preparedRevision.body).toMatchObject({
      anchorPreparationId: expect.stringMatching(/^revision-anchor-/),
      thesisId,
      anchorStatus: "prepared",
      transactions: expect.arrayContaining([expect.objectContaining({ description: expect.stringContaining("Record revision") })]),
    });

    const revised = await fetchJson(app, `/api/theses/${thesisId}/revisions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...revisionPayload,
        anchorPreparationId: (preparedRevision.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: revisionAnchorTxHash,
        evaUsageTxHash,
      }),
    });

    expect(revised.status).toBe(200);
    expect(revised.body).toMatchObject({
      thesis: {
        currentRevision: { version: 2, anchor: { status: "confirmed", txHash: revisionAnchorTxHash, confirmedAt: "2026-06-06T21:30:00.000Z" } },
        timeline: expect.arrayContaining([expect.objectContaining({ action: "revised", scoreBefore: 70 })]),
      },
    });
  });

  it("rejects no-op thesis revisions before anchor preparation", async () => {
    const app = await makeApp();
    const payload = thesisCreatePayload();
    const prepared = await fetchJson(app, "/api/thesis-drafts/protocol/prepare-anchor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const created = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        anchorPreparationId: (prepared.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: draftAnchorTxHash,
        evaUsageTxHash,
      }),
    });
    const thesis = (created.body as { thesis: { thesisId: string; body: string; signals: Array<{ signalId: string; currentOdds: number }> } }).thesis;

    const response = await fetchJson(app, `/api/theses/${thesis.thesisId}/revision-drafts/protocol/prepare-anchor`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...identityPayload(),
        body: thesis.body,
        note: "Note-only changes are not revisions.",
        signalUpdates: [{ signalId: thesis.signals[0]!.signalId, currentOdds: thesis.signals[0]!.currentOdds }],
      }),
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Revision must change the thesis body or at least one signal",
    });
  });

  it("persists anchor preparations across route instance resets", async () => {
    const service = await makeService();
    const prepareApp = makeRoutedApp(service);
    const publishApp = makeRoutedApp(service);
    const reviseApp = makeRoutedApp(service);
    const payload = thesisCreatePayload();

    const prepared = await fetchJson(prepareApp, "/api/thesis-drafts/protocol/prepare-anchor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(prepared.status).toBe(200);

    const created = await fetchJson(publishApp, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        anchorPreparationId: (prepared.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: draftAnchorTxHash,
        evaUsageTxHash,
      }),
    });

    expect(created.status).toBe(201);
    const thesisId = (created.body as { thesis: { thesisId: string; signals: Array<{ signalId: string }> } }).thesis.thesisId;
    const signalId = (created.body as { thesis: { signals: Array<{ signalId: string }> } }).thesis.signals[0]!.signalId;
    const revisionPayload = {
      ...identityPayload(),
      body: "Runtime reset did not lose the prepared revision.",
      note: "Prepared in another runtime instance.",
      signalUpdates: [{ signalId, currentOdds: 0.45 }],
    };

    const preparedRevision = await fetchJson(publishApp, `/api/theses/${thesisId}/revision-drafts/protocol/prepare-anchor`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(revisionPayload),
    });

    expect(preparedRevision.status).toBe(200);

    const revised = await fetchJson(reviseApp, `/api/theses/${thesisId}/revisions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...revisionPayload,
        anchorPreparationId: (preparedRevision.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: revisionAnchorTxHash,
        evaUsageTxHash,
      }),
    });

    expect(revised.status).toBe(200);
    expect(revised.body).toMatchObject({
      thesis: {
        currentRevision: {
          version: 2,
          anchor: { status: "confirmed", txHash: revisionAnchorTxHash },
        },
      },
    });
  });

  it("rejects thesis writes without connected X and wallet identity", async () => {
    const app = await makeApp();
    const response = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "No identity",
        body: "This should not publish.",
      }),
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Connected X identity and wallet are required",
    });
  });

  it("rejects public thesis publishing before draft anchor preparation", async () => {
    const app = await makeApp();

    const response = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(thesisCreatePayload()),
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Prepare anchor before publishing thesis",
    });
  });

  it("rejects public thesis publishing when the prepared draft changed", async () => {
    const app = await makeApp();
    const payload = thesisCreatePayload();
    const prepared = await fetchJson(app, "/api/thesis-drafts/protocol/prepare-anchor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        body: `${payload.body} Materially changed after anchor preparation.`,
        anchorPreparationId: (prepared.body as { anchorPreparationId: string }).anchorPreparationId,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Prepared anchor does not match current thesis draft",
    });
  });

  it("rejects public thesis publishing before anchor transaction submission", async () => {
    const app = await makeApp();
    const payload = thesisCreatePayload();
    const prepared = await fetchJson(app, "/api/thesis-drafts/protocol/prepare-anchor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        anchorPreparationId: (prepared.body as { anchorPreparationId: string }).anchorPreparationId,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Submit anchor transaction before publishing thesis",
    });
  });

  it("rejects public thesis publishing before anchor transaction confirmation", async () => {
    const app = await makeApp({ confirmedTxHashes: [] });
    const payload = thesisCreatePayload();
    const prepared = await fetchJson(app, "/api/thesis-drafts/protocol/prepare-anchor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        anchorPreparationId: (prepared.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: rejectedAnchorTxHash,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Anchor transaction is not confirmed",
    });
  });

  it("rejects public thesis publishing until the exact EVA usage receipt is confirmed", async () => {
    const app = await makeApp();
    const payload = thesisCreatePayload();
    const prepared = await fetchJson(app, "/api/thesis-drafts/protocol/prepare-anchor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const missing = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        anchorPreparationId: (prepared.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: draftAnchorTxHash,
      }),
    });
    expect(missing.status).toBe(400);
    expect(missing.body).toMatchObject({
      error: "Use EVA and submit its Avalanche receipt before publishing thesis",
    });

    const wrong = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        anchorPreparationId: (prepared.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: draftAnchorTxHash,
        evaUsageTxHash: rejectedAnchorTxHash,
      }),
    });
    expect(wrong.status).toBe(400);
    expect(wrong.body).toMatchObject({
      error: "EVA usage transaction is not confirmed on Avalanche",
    });
  });

  it("rejects public thesis publishing when the confirmed anchor does not match prepared calldata", async () => {
    const app = await makeApp({ confirmedTxHashes: [rejectedAnchorTxHash], wrongCalldataTxHashes: [rejectedAnchorTxHash] });
    const payload = thesisCreatePayload();
    const prepared = await fetchJson(app, "/api/thesis-drafts/protocol/prepare-anchor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        anchorPreparationId: (prepared.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: rejectedAnchorTxHash,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Anchor transaction does not match prepared calldata",
    });
  });

  it("rejects thesis revision publishing before revision anchor preparation", async () => {
    const app = await makeApp();
    const payload = thesisCreatePayload();
    const prepared = await fetchJson(app, "/api/thesis-drafts/protocol/prepare-anchor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const created = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        anchorPreparationId: (prepared.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: draftAnchorTxHash,
        evaUsageTxHash,
      }),
    });
    const thesisId = (created.body as { thesis: { thesisId: string } }).thesis.thesisId;

    const response = await fetchJson(app, `/api/theses/${thesisId}/revisions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...identityPayload(),
        body: "Unanchored revision should not publish.",
        note: "No revision anchor.",
      }),
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Prepare anchor before publishing thesis update",
    });
  });

  it("rejects thesis revision publishing when the prepared revision changed", async () => {
    const app = await makeApp();
    const payload = thesisCreatePayload();
    const prepared = await fetchJson(app, "/api/thesis-drafts/protocol/prepare-anchor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const created = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        anchorPreparationId: (prepared.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: draftAnchorTxHash,
        evaUsageTxHash,
      }),
    });
    const thesisId = (created.body as { thesis: { thesisId: string } }).thesis.thesisId;
    const revisionPayload = {
      ...identityPayload(),
      body: "Prepared revision body.",
      note: "Prepared revision.",
    };
    const preparedRevision = await fetchJson(app, `/api/theses/${thesisId}/revision-drafts/protocol/prepare-anchor`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(revisionPayload),
    });

    const response = await fetchJson(app, `/api/theses/${thesisId}/revisions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...revisionPayload,
        body: "Changed after revision anchor preparation.",
        anchorPreparationId: (preparedRevision.body as { anchorPreparationId: string }).anchorPreparationId,
        anchorTxHash: revisionAnchorTxHash,
        evaUsageTxHash,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Prepared anchor does not match current thesis update",
    });
  });
});
