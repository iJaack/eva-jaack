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
import { prepareThesisAnchorTransactions } from "../services/thesis-protocol.js";

type PredictionRouteDeps = {
  predictions: LocalPredictionLayerService;
};

type PredictionSignalInputItem = NonNullable<ThesisCreateInput["predictionSignals"]>[number];
type FactSignalInputItem = NonNullable<ThesisCreateInput["factSignals"]>[number];

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

function normalizeObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry));
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

    const title = normalizeString(body.title);
    const thesisBody = normalizeString(body.body);
    if (!title || !thesisBody) {
      return c.json({ error: "Missing required fields: title, body" }, 400);
    }

    const input: ThesisCreateInput = {
      identity: {
        dynamicUserId: normalizeString(body.dynamicUserId) ?? normalizeString(body.identity && typeof body.identity === "object" ? (body.identity as Record<string, unknown>).dynamicUserId : null) ?? "",
        xHandle: normalizeString(body.xHandle) ?? normalizeString(body.identity && typeof body.identity === "object" ? (body.identity as Record<string, unknown>).xHandle : null) ?? "",
        xProfileId: normalizeString(body.xProfileId) ?? normalizeString(body.identity && typeof body.identity === "object" ? (body.identity as Record<string, unknown>).xProfileId : null),
        walletAddress: normalizeString(body.walletAddress) ?? normalizeString(body.identity && typeof body.identity === "object" ? (body.identity as Record<string, unknown>).walletAddress : null),
        walletSource: (normalizeString(body.walletSource) ?? normalizeString(body.identity && typeof body.identity === "object" ? (body.identity as Record<string, unknown>).walletSource : null)) as "external" | "embedded" | null,
      },
      title,
      body: thesisBody,
      predictionSignals: normalizeObjectArray(body.predictionSignals).map((signal) => ({
        marketId: normalizeString(signal.marketId),
        provider: normalizeString(signal.provider) as PredictionSignalInputItem["provider"],
        externalId: normalizeString(signal.externalId),
        marketTitle: normalizeString(signal.marketTitle),
        marketUrl: normalizeString(signal.marketUrl),
        selectedOutcomeId: normalizeString(signal.selectedOutcomeId),
        selectedOutcomeLabel: normalizeString(signal.selectedOutcomeLabel) ?? "Yes",
        resolvedOutcomeLabel: normalizeString(signal.resolvedOutcomeLabel),
        oddsAtAdd: normalizeNumber(signal.oddsAtAdd),
        currentOdds: normalizeNumber(signal.currentOdds),
        weight: normalizeNumber(signal.weight),
        role: normalizeString(signal.role) as PredictionSignalInputItem["role"],
        rationale: normalizeString(signal.rationale),
        status: normalizeString(signal.status) as PredictionSignalInputItem["status"],
      })),
      factSignals: normalizeObjectArray(body.factSignals).map((signal) => ({
        claimText: normalizeString(signal.claimText) ?? "",
        sourceUrl: normalizeString(signal.sourceUrl),
        verifierVerdict: normalizeString(signal.verifierVerdict) as FactSignalInputItem["verifierVerdict"],
        verifierScore: normalizeNumber(signal.verifierScore),
        reportUri: normalizeString(signal.reportUri),
        reportHash: normalizeString(signal.reportHash),
        weight: normalizeNumber(signal.weight),
        role: normalizeString(signal.role) as FactSignalInputItem["role"],
        rationale: normalizeString(signal.rationale),
      })),
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

  routes.post("/theses/:thesisId/revisions", async (c) => {
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "Invalid JSON body" }, 400);

    try {
      const response = await deps.predictions.recordRevision(c.req.param("thesisId"), {
        identity: {
          dynamicUserId: normalizeString(body.dynamicUserId) ?? "",
          xHandle: normalizeString(body.xHandle) ?? "",
          xProfileId: normalizeString(body.xProfileId),
          walletAddress: normalizeString(body.walletAddress),
          walletSource: normalizeString(body.walletSource) as "external" | "embedded" | null,
        },
        body: normalizeString(body.body),
        note: normalizeString(body.note),
        signalUpdates: normalizeObjectArray(body.signalUpdates).map((update) => ({
          signalId: normalizeString(update.signalId) ?? "",
          currentOdds: normalizeNumber(update.currentOdds),
          weight: normalizeNumber(update.weight),
          status: normalizeString(update.status) as PredictionSignalInputItem["status"],
          resolvedOutcomeLabel: normalizeString(update.resolvedOutcomeLabel),
        })),
      });
      if (!response) return c.json({ error: "Thesis not found" }, 404);
      return c.json<ThesisDetailResponse>(response);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to revise thesis" }, 400);
    }
  });

  routes.post("/theses/:thesisId/protocol/prepare-anchor", async (c) => {
    const detail = await deps.predictions.getThesis(c.req.param("thesisId"));
    if (!detail) return c.json({ error: "Thesis not found" }, 404);

    try {
      return c.json({
        thesisId: detail.thesis.thesisId,
        anchorStatus: detail.thesis.anchor.status,
        transactions: prepareThesisAnchorTransactions(detail.thesis),
      });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to prepare anchor transactions" }, 400);
    }
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
