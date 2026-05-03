import { Hono } from "hono";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPredictionRoutes } from "../src/routes/predictions.js";
import { LocalPredictionLayerService } from "../src/services/prediction-layer.js";
import { fetchJson } from "./helpers.js";

const cleanupDirs: string[] = [];

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

describe("prediction routes", () => {
  it("serves summary, market detail, and predictor rankings", async () => {
    const app = await makeApp();

    const summary = await fetchJson(app, "/api/prediction-summary");
    const market = await fetchJson(app, "/api/markets/crude-oil-95-window");
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
      market: { marketId: "crude-oil-95-window" },
    });
    expect(predictors.status).toBe(200);
    expect(predictors.body).toMatchObject({
      count: expect.any(Number),
    });
  });

  it("creates a thesis and returns copy previews", async () => {
    const app = await makeApp();
    const created = await fetchJson(app, "/api/theses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorHandle: "@routealpha",
        marketId: "crude-oil-95-window",
        selectedOutcomeId: "yes",
        rationale: "Route tests should prove the thesis API is live.",
      }),
    });

    expect(created.status).toBe(201);
    const thesisId = (created.body as { thesis: { thesisId: string } }).thesis.thesisId;

    const detail = await fetchJson(app, `/api/theses/${thesisId}`);
    const copy = await fetchJson(app, "/api/copy-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ thesisId }),
    });

    expect(detail.status).toBe(200);
    expect(copy.status).toBe(200);
    expect(copy.body).toMatchObject({
      thesisId,
      execution: "external-link-only",
    });
  });

  it("accepts explicit @evapredicts commands without keyword scanning", async () => {
    const app = await makeApp();
    const accepted = await fetchJson(app, "/api/x/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mentionId: "route-mention-1",
        authorHandle: "@routealpha",
        text: "@evapredicts track this market call",
        tweetUrl: "https://x.com/routealpha/status/1",
      }),
    });
    const ignored = await fetchJson(app, "/api/x/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mentionId: "route-mention-2",
        authorHandle: "@routealpha",
        text: "@evapredicts hello",
      }),
    });

    expect(accepted.status).toBe(202);
    expect(accepted.body).toMatchObject({ accepted: true });
    expect(ignored.status).toBe(200);
    expect(ignored.body).toMatchObject({
      accepted: false,
      command: { status: "ignored" },
    });
  });
});
