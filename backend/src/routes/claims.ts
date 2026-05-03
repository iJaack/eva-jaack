import { Hono } from "hono";
import type {
  ClaimChallengePreviewResponse,
  ClaimCreateResponse,
  ClaimListResponse,
  ClaimMarketDetailResponse,
  ClaimSettlementPreviewResponse,
  ClaimStakePreviewResponse,
  XMentionIngestResponse,
} from "../lib/api-types.js";
import {
  getClaimMarketService,
  type ClaimChallengePreviewInput,
  type ClaimCreateInput,
  type ClaimMarketService,
  type ClaimStakePreviewInput,
} from "../services/claim-market.js";
import { getXChannelService, type XMentionEvent } from "../services/x-channel.js";

type ClaimRouteDeps = {
  claims: ClaimMarketService;
  ingestXMention: (event: XMentionEvent) => Promise<XMentionIngestResponse>;
};

function normalizeStringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function createClaimRoutes(
  deps: ClaimRouteDeps = {
    claims: getClaimMarketService(),
    ingestXMention: (event) => getXChannelService().ingestMention(event),
  },
) {
  const claimRoutes = new Hono();

  claimRoutes.get("/", async (c) => {
    const response = await deps.claims.listClaims();
    return c.json<ClaimListResponse>(response);
  });

  claimRoutes.post("/", async (c) => {
    let body: Record<string, unknown>;
    try {
      body = await c.req.json<Record<string, unknown>>();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const sourcePlatform = normalizeStringField(body.sourcePlatform);
    const sourceRef = normalizeStringField(body.sourceRef);
    const claimText = normalizeStringField(body.claimText);

    if (!sourcePlatform || !["x", "farcaster", "web", "manual"].includes(sourcePlatform)) {
      return c.json({ error: "Missing or invalid field: sourcePlatform" }, 400);
    }
    if (!sourceRef) {
      return c.json({ error: "Missing required field: sourceRef" }, 400);
    }
    if (!claimText) {
      return c.json({ error: "Missing required field: claimText" }, 400);
    }

    const machineAssessmentBody =
      body.machineAssessment && typeof body.machineAssessment === "object"
        ? (body.machineAssessment as Record<string, unknown>)
        : null;

    const input: ClaimCreateInput = {
      sourcePlatform: sourcePlatform as ClaimCreateInput["sourcePlatform"],
      sourceRef,
      sourceUrl: normalizeStringField(body.sourceUrl),
      authorHandle: normalizeStringField(body.authorHandle),
      conversationId: normalizeStringField(body.conversationId),
      claimText,
      title: normalizeStringField(body.title),
      claimType: normalizeStringField(body.claimType),
      createdBy: normalizeStringField(body.createdBy),
      context: normalizeStringField(body.context),
      evidenceLinks: Array.isArray(body.evidenceLinks)
        ? body.evidenceLinks.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
        : [],
      machineAssessment: machineAssessmentBody
        ? {
            verdict: String(machineAssessmentBody.verdict ?? "unverifiable_yet") as NonNullable<
              ClaimCreateInput["machineAssessment"]
            >["verdict"],
            confidence: Number(machineAssessmentBody.confidence ?? 0),
            summary: String(machineAssessmentBody.summary ?? ""),
            evidenceCount: Number(machineAssessmentBody.evidenceCount ?? 0),
          }
        : null,
    };

    try {
      const response = await deps.claims.createClaim(input);
      return c.json<ClaimCreateResponse>(response, response.created ? 201 : 200);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create claim" }, 400);
    }
  });

  claimRoutes.post("/ingest/x", async (c) => {
    let body: Record<string, unknown>;
    try {
      body = await c.req.json<Record<string, unknown>>();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const mentionId = normalizeStringField(body.mentionId);
    const authorHandle = normalizeStringField(body.authorHandle);
    const text = normalizeStringField(body.text);

    if (!mentionId || !authorHandle || !text) {
      return c.json({ error: "Missing required fields: mentionId, authorHandle, text" }, 400);
    }

    const response = await deps.ingestXMention({
      mentionId,
      authorHandle,
      text,
      tweetUrl: normalizeStringField(body.tweetUrl),
      quotedTweetUrl: normalizeStringField(body.quotedTweetUrl),
      replyToTweetId: normalizeStringField(body.replyToTweetId),
      conversationId: normalizeStringField(body.conversationId),
      createdBy: normalizeStringField(body.createdBy),
    });

    return c.json<XMentionIngestResponse>(response, response.accepted ? 202 : 200);
  });

  claimRoutes.post("/:claimId/stake-preview", async (c) => {
    let body: Record<string, unknown>;
    try {
      body = await c.req.json<Record<string, unknown>>();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const amount = body.amount;
    const verdict = normalizeStringField(body.verdict);
    if ((typeof amount !== "string" && typeof amount !== "number") || !verdict) {
      return c.json({ error: "Missing required fields: amount, verdict" }, 400);
    }

    const input: ClaimStakePreviewInput = {
      amount,
      verdict: verdict as ClaimStakePreviewInput["verdict"],
      confidenceBand: body.confidenceBand === undefined ? undefined : Number(body.confidenceBand),
    };

    try {
      const preview = await deps.claims.getStakePreview(c.req.param("claimId"), input);
      if (!preview) {
        return c.json({ error: "Claim not found" }, 404);
      }
      return c.json<ClaimStakePreviewResponse>(preview);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to build stake preview" }, 400);
    }
  });

  claimRoutes.post("/:claimId/challenge-preview", async (c) => {
    let body: Record<string, unknown>;
    try {
      body = await c.req.json<Record<string, unknown>>();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const bondAmount = body.bondAmount;
    if (typeof bondAmount !== "string" && typeof bondAmount !== "number") {
      return c.json({ error: "Missing required field: bondAmount" }, 400);
    }

    const input: ClaimChallengePreviewInput = { bondAmount };

    try {
      const preview = await deps.claims.getChallengePreview(c.req.param("claimId"), input);
      if (!preview) {
        return c.json({ error: "Claim not found" }, 404);
      }
      return c.json<ClaimChallengePreviewResponse>(preview);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to build challenge preview" }, 400);
    }
  });

  claimRoutes.get("/:claimId/settlement-preview", async (c) => {
    const preview = await deps.claims.getSettlementPreview(c.req.param("claimId"));
    if (!preview) {
      return c.json({ error: "Claim not found" }, 404);
    }

    return c.json<ClaimSettlementPreviewResponse>(preview);
  });

  claimRoutes.get("/:claimId", async (c) => {
    const claim = await deps.claims.getClaim(c.req.param("claimId"));
    if (!claim) {
      return c.json({ error: "Claim not found" }, 404);
    }

    return c.json<ClaimMarketDetailResponse>(claim);
  });

  return claimRoutes;
}

export const claimRoutes = createClaimRoutes();
