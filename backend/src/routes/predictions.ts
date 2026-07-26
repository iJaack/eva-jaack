import { createHash } from "node:crypto";
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
  ThesisDraftAnchorPrepareResponse,
  ThesisDetailResponse,
  ThesisListResponse,
  XCommandIngestResponse,
} from "../lib/api-types.js";
import { createAvalancheAnchorVerifier, type AnchorVerifier } from "../services/anchor-verifier.js";
import {
  createAvalancheEvaUsageVerifier,
  createEvaUsageQuote,
  isEvaUsageAction,
  type EvaUsageVerifier,
} from "../services/eva-usage.js";
import {
  getPredictionLayerService,
  type LocalPredictionLayerService,
  type ThesisCreateInput,
  type ThesisRevisionInput,
  type XCommandIngestInput,
} from "../services/prediction-layer.js";
import { prepareThesisAnchorTransactions, prepareThesisRevisionAnchorTransactions } from "../services/thesis-protocol.js";

type PredictionRouteDeps = {
  predictions: LocalPredictionLayerService;
  anchorVerifier: AnchorVerifier;
  usageVerifier: EvaUsageVerifier;
};

type PredictionSignalInputItem = NonNullable<ThesisCreateInput["predictionSignals"]>[number];
type FactSignalInputItem = NonNullable<ThesisCreateInput["factSignals"]>[number];

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeTxHash(value: unknown): `0x${string}` | null {
  const normalized = normalizeString(value);
  if (!normalized || !/^0x[a-fA-F0-9]{64}$/.test(normalized)) return null;
  return normalized as `0x${string}`;
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

function thesisCreateInputFromBody(body: Record<string, unknown>): { input: ThesisCreateInput | null; error: string | null } {
  const title = normalizeString(body.title);
  const thesisBody = normalizeString(body.body);
  if (!title || !thesisBody) {
    return { input: null, error: "Missing required fields: title, body" };
  }

  return {
    error: null,
    input: {
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
    },
  };
}

function draftFingerprint(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function createPredictionRoutes(
  deps: PredictionRouteDeps = {
    predictions: getPredictionLayerService(),
    anchorVerifier: createAvalancheAnchorVerifier(),
    usageVerifier: createAvalancheEvaUsageVerifier(),
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

  routes.post("/eva/usage/quote", async (c) => {
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "Invalid JSON body" }, 400);
    const action = body.action;
    const account = normalizeString(body.account);
    const resourceId = normalizeString(body.resourceId);
    if (!isEvaUsageAction(action) || !account || !resourceId) {
      return c.json({ error: "Missing or invalid required fields: action, account, resourceId" }, 400);
    }
    try {
      return c.json(createEvaUsageQuote({ action, account, resourceId }));
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create EVA usage quote" }, 400);
    }
  });

  routes.post("/theses", async (c) => {
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "Invalid JSON body" }, 400);

    const { input, error } = thesisCreateInputFromBody(body);
    if (error || !input) return c.json({ error }, 400);

    try {
      const detail = await deps.predictions.previewThesis(input);

      const anchorPreparationId = normalizeString(body.anchorPreparationId);
      if (!anchorPreparationId) {
        return c.json({ error: "Prepare anchor before publishing thesis" }, 400);
      }

      const prepared = await deps.predictions.getAnchorPreparation({ anchorPreparationId, kind: "draft" });
      if (!prepared) {
        return c.json({ error: "Prepare anchor before publishing thesis" }, 400);
      }
      if (prepared.fingerprint !== draftFingerprint(input)) {
        return c.json({ error: "Prepared anchor does not match current thesis draft" }, 400);
      }

      const anchorTxHash = normalizeTxHash(body.anchorTxHash);
      if (!anchorTxHash) {
        return c.json({ error: "Submit anchor transaction before publishing thesis" }, 400);
      }
      const expectedTransactions = prepareThesisAnchorTransactions(detail.thesis);
      const verification = await deps.anchorVerifier.verifyPreparedAnchor({
        txHash: anchorTxHash,
        expectedTransactions,
      });
      if (!verification.ok) {
        return c.json({ error: verification.error }, 400);
      }

      const evaUsageTxHash = normalizeTxHash(body.evaUsageTxHash);
      if (!evaUsageTxHash) {
        return c.json({ error: "Use EVA and submit its Avalanche receipt before publishing thesis" }, 400);
      }
      const usageQuote = createEvaUsageQuote({
        action: "publish_thesis",
        account: input.identity.walletAddress ?? "",
        resourceId: anchorPreparationId,
      });
      const usageVerification = await deps.usageVerifier.verifyUsage({
        txHash: evaUsageTxHash,
        quote: usageQuote,
      });
      if (!usageVerification.ok) {
        return c.json({ error: usageVerification.error }, 400);
      }

      const response = await deps.predictions.createThesis(input);
      const anchored = await deps.predictions.markThesisAnchorConfirmed(
        response.thesis.thesisId,
        anchorTxHash,
        verification.confirmedAt,
        {
          action: "publish_thesis",
          txHash: evaUsageTxHash,
          receiptId: usageVerification.receiptId,
          amountWei: usageQuote.amountWei,
          referenceHash: usageQuote.referenceHash,
          confirmedAt: usageVerification.confirmedAt,
          blockNumber: usageVerification.blockNumber,
        },
      );
      if (response.created) await deps.predictions.deleteAnchorPreparation(anchorPreparationId);
      return c.json<ThesisCreateResponse>(
        {
          created: response.created,
          thesis: anchored?.thesis ?? response.thesis,
          markets: anchored?.markets ?? response.markets,
        },
        response.created ? 201 : 200,
      );
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create thesis" }, 400);
    }
  });

  routes.post("/thesis-drafts/protocol/prepare-anchor", async (c) => {
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "Invalid JSON body" }, 400);

    const { input, error } = thesisCreateInputFromBody(body);
    if (error || !input) return c.json({ error }, 400);

    try {
      const detail = await deps.predictions.previewThesis(input);
      const fingerprint = draftFingerprint(input);
      const anchorPreparationId = `draft-anchor-${fingerprint.slice(0, 24)}`;
      await deps.predictions.saveAnchorPreparation({
        anchorPreparationId,
        kind: "draft",
        thesisId: null,
        fingerprint,
        preparedAt: new Date().toISOString(),
      });
      return c.json<ThesisDraftAnchorPrepareResponse>({
        anchorPreparationId,
        thesisId: detail.thesis.thesisId,
        anchorStatus: "prepared",
        transactions: prepareThesisAnchorTransactions(detail.thesis),
        evaUsageQuote: createEvaUsageQuote({
          action: "publish_thesis",
          account: input.identity.walletAddress ?? "",
          resourceId: anchorPreparationId,
        }),
      });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to prepare draft anchor transactions" }, 400);
    }
  });

  function thesisRevisionInputFromBody(body: Record<string, unknown>): ThesisRevisionInput {
    return {
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
    };
  }

  routes.post("/theses/:thesisId/revision-drafts/protocol/prepare-anchor", async (c) => {
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "Invalid JSON body" }, 400);

    const input = thesisRevisionInputFromBody(body);
    try {
      const detail = await deps.predictions.previewRevision(c.req.param("thesisId"), input);
      if (!detail) return c.json({ error: "Thesis not found" }, 404);

      const fingerprint = draftFingerprint({ thesisId: detail.thesis.thesisId, input });
      const anchorPreparationId = `revision-anchor-${fingerprint.slice(0, 24)}`;
      await deps.predictions.saveAnchorPreparation({
        anchorPreparationId,
        kind: "revision",
        thesisId: detail.thesis.thesisId,
        fingerprint,
        preparedAt: new Date().toISOString(),
      });
      return c.json({
        anchorPreparationId,
        thesisId: detail.thesis.thesisId,
        anchorStatus: "prepared",
        transactions: prepareThesisRevisionAnchorTransactions(detail.thesis),
        evaUsageQuote: createEvaUsageQuote({
          action: "publish_revision",
          account: input.identity.walletAddress ?? "",
          resourceId: anchorPreparationId,
        }),
      });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to prepare revision anchor transactions" }, 400);
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
      const input = thesisRevisionInputFromBody(body);
      const preview = await deps.predictions.previewRevision(c.req.param("thesisId"), input);
      if (!preview) return c.json({ error: "Thesis not found" }, 404);

      const anchorPreparationId = normalizeString(body.anchorPreparationId);
      if (!anchorPreparationId) {
        return c.json({ error: "Prepare anchor before publishing thesis update" }, 400);
      }

      const prepared = await deps.predictions.getAnchorPreparation({ anchorPreparationId, kind: "revision", thesisId: preview.thesis.thesisId });
      if (!prepared) {
        return c.json({ error: "Prepare anchor before publishing thesis update" }, 400);
      }
      if (prepared.fingerprint !== draftFingerprint({ thesisId: preview.thesis.thesisId, input })) {
        return c.json({ error: "Prepared anchor does not match current thesis update" }, 400);
      }

      const anchorTxHash = normalizeTxHash(body.anchorTxHash);
      if (!anchorTxHash) {
        return c.json({ error: "Submit anchor transaction before publishing thesis update" }, 400);
      }
      const expectedTransactions = prepareThesisRevisionAnchorTransactions(preview.thesis);
      const verification = await deps.anchorVerifier.verifyPreparedAnchor({
        txHash: anchorTxHash,
        expectedTransactions,
      });
      if (!verification.ok) {
        return c.json({ error: verification.error }, 400);
      }

      const evaUsageTxHash = normalizeTxHash(body.evaUsageTxHash);
      if (!evaUsageTxHash) {
        return c.json({ error: "Use EVA and submit its Avalanche receipt before publishing thesis update" }, 400);
      }
      const usageQuote = createEvaUsageQuote({
        action: "publish_revision",
        account: input.identity.walletAddress ?? "",
        resourceId: anchorPreparationId,
      });
      const usageVerification = await deps.usageVerifier.verifyUsage({
        txHash: evaUsageTxHash,
        quote: usageQuote,
      });
      if (!usageVerification.ok) {
        return c.json({ error: usageVerification.error }, 400);
      }

      const response = await deps.predictions.recordRevision(c.req.param("thesisId"), input);
      if (!response) return c.json({ error: "Thesis not found" }, 404);
      const anchored = await deps.predictions.markCurrentRevisionAnchorConfirmed(
        response.thesis.thesisId,
        anchorTxHash,
        verification.confirmedAt,
        {
          action: "publish_revision",
          txHash: evaUsageTxHash,
          receiptId: usageVerification.receiptId,
          amountWei: usageQuote.amountWei,
          referenceHash: usageQuote.referenceHash,
          confirmedAt: usageVerification.confirmedAt,
          blockNumber: usageVerification.blockNumber,
        },
      );
      await deps.predictions.deleteAnchorPreparation(anchorPreparationId);
      return c.json<ThesisDetailResponse>(anchored ?? response);
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
