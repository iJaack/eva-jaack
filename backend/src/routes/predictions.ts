import { Hono } from "hono";
import type { Context } from "hono";
import type {
  CopyThesisPreviewResponse,
  MarketDetailResponse,
  MarketListResponse,
  PredictionNetworkSummaryResponse,
  PredictorDetailResponse,
  PredictorListResponse,
  ThesisCreateResponse,
  ThesisDetailResponse,
  ThesisListResponse,
  XCommandIngestResponse,
} from "../lib/api-types.js";
import {
  getPredictionLayerService,
  type LocalPredictionLayerService,
  type ThesisCreateInput,
  type XCommandIngestInput,
} from "../services/prediction-layer.js";

type PredictionRouteDeps = {
  predictions: LocalPredictionLayerService;
};

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

async function readJsonBody(c: Context): Promise<Record<string, unknown> | null> {
  try {
    return await c.req.json<Record<string, unknown>>();
  } catch {
    return null;
  }
}

export function createPredictionRoutes(
  deps: PredictionRouteDeps = {
    predictions: getPredictionLayerService(),
  },
) {
  const routes = new Hono();

  routes.get("/prediction-summary", async (c) => {
    const response = await deps.predictions.getSummary();
    return c.json<PredictionNetworkSummaryResponse>(response);
  });

  routes.get("/markets", async (c) => {
    const response = await deps.predictions.listMarkets();
    return c.json<MarketListResponse>(response);
  });

  routes.get("/markets/:marketId", async (c) => {
    const response = await deps.predictions.getMarket(c.req.param("marketId"));
    if (!response) return c.json({ error: "Market not found" }, 404);
    return c.json<MarketDetailResponse>(response);
  });

  routes.get("/theses", async (c) => {
    const response = await deps.predictions.listTheses({
      marketId: c.req.query("marketId") ?? null,
      author: c.req.query("author") ?? null,
    });
    return c.json<ThesisListResponse>(response);
  });

  routes.post("/theses", async (c) => {
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "Invalid JSON body" }, 400);

    const authorHandle = normalizeString(body.authorHandle);
    const rationale = normalizeString(body.rationale);
    if (!authorHandle || !rationale) {
      return c.json({ error: "Missing required fields: authorHandle, rationale" }, 400);
    }

    const input: ThesisCreateInput = {
      authorHandle,
      authorWallet: normalizeString(body.authorWallet),
      authorAgentId: normalizeString(body.authorAgentId),
      marketId: normalizeString(body.marketId),
      marketTitle: normalizeString(body.marketTitle),
      marketUrl: normalizeString(body.marketUrl),
      category: normalizeString(body.category),
      selectedOutcomeId: normalizeString(body.selectedOutcomeId),
      selectedOutcomeLabel: normalizeString(body.selectedOutcomeLabel),
      oddsAtPost: normalizeNumber(body.oddsAtPost),
      conviction: normalizeNumber(body.conviction),
      rationale,
      evidenceLinks: normalizeStringArray(body.evidenceLinks),
      sourceUrl: normalizeString(body.sourceUrl),
      sourcePostUrl: normalizeString(body.sourcePostUrl),
      counterToThesisId: normalizeString(body.counterToThesisId),
    };

    try {
      const response = await deps.predictions.createThesis(input);
      return c.json<ThesisCreateResponse>(response, response.created ? 201 : 200);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create thesis" }, 400);
    }
  });

  routes.get("/theses/:thesisId", async (c) => {
    const response = await deps.predictions.getThesis(c.req.param("thesisId"));
    if (!response) return c.json({ error: "Thesis not found" }, 404);
    return c.json<ThesisDetailResponse>(response);
  });

  routes.get("/predictors", async (c) => {
    const response = await deps.predictions.listPredictors();
    return c.json<PredictorListResponse>(response);
  });

  routes.get("/predictors/:id", async (c) => {
    const response = await deps.predictions.getPredictor(c.req.param("id"));
    if (!response) return c.json({ error: "Predictor not found" }, 404);
    return c.json<PredictorDetailResponse>(response);
  });

  routes.post("/copy-preview", async (c) => {
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "Invalid JSON body" }, 400);
    const thesisId = normalizeString(body.thesisId);
    if (!thesisId) return c.json({ error: "Missing required field: thesisId" }, 400);

    const response = await deps.predictions.getCopyPreview(thesisId);
    if (!response) return c.json({ error: "Thesis not found" }, 404);
    return c.json<CopyThesisPreviewResponse>(response);
  });

  routes.post("/x/ingest", async (c) => {
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "Invalid JSON body" }, 400);

    const mentionId = normalizeString(body.mentionId);
    const authorHandle = normalizeString(body.authorHandle);
    const text = normalizeString(body.text);
    if (!mentionId || !authorHandle || !text) {
      return c.json({ error: "Missing required fields: mentionId, authorHandle, text" }, 400);
    }

    const input: XCommandIngestInput = {
      mentionId,
      authorHandle,
      text,
      tweetUrl: normalizeString(body.tweetUrl),
      quotedTweetUrl: normalizeString(body.quotedTweetUrl),
      replyToTweetUrl: normalizeString(body.replyToTweetUrl),
    };

    const response = await deps.predictions.ingestXCommand(input);
    return c.json<XCommandIngestResponse>(response, response.accepted ? 202 : 200);
  });

  return routes;
}

export const predictionRoutes = createPredictionRoutes();
