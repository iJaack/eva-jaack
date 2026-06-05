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

afterEach(async () => {
  await Promise.all(cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function makeApp() {
  const dir = await mkdtemp(join(tmpdir(), "eva-prediction-routes-"));
  cleanupDirs.push(dir);
  const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => [], async () => []);
  const app = new Hono();
  app.route("/api", createPredictionRoutes({ predictions: service }));
  return app;
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

  it("creates and revises a multi-signal thesis", async () => {
    const app = await makeApp();
    const created = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
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
        signals: expect.arrayContaining([expect.objectContaining({ kind: "prediction_market" })]),
      },
    });

    const signalId = (created.body as { thesis: { signals: Array<{ signalId: string }> } }).thesis.signals[0]!.signalId;
    const revised = await fetchJson(app, `/api/theses/${thesisId}/revisions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...identityPayload(),
        body: "SpaceX IPO timing odds strengthened, so the thesis confidence improved.",
        note: "IPO timing signal moved.",
        signalUpdates: [{ signalId, currentOdds: 0.45 }],
      }),
    });

    expect(revised.status).toBe(200);
    expect(revised.body).toMatchObject({
      thesis: {
        currentRevision: { version: 2 },
        timeline: expect.arrayContaining([expect.objectContaining({ action: "revised", scoreBefore: 70 })]),
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
});
