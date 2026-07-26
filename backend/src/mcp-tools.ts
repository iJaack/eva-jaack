import { createHash } from "node:crypto";
import type { ClaimVerdict, PredictionMarketStatus, ThesisDetailResponse, ThesisSignalRole } from "./lib/api-types.js";
import type { LocalPredictionLayerService, ThesisCreateInput, ThesisRevisionInput } from "./services/prediction-layer.js";
import {
  createAvalancheEvaUsageVerifier,
  createEvaUsageQuote,
  type EvaUsageVerifier,
} from "./services/eva-usage.js";
import { prepareThesisAnchorTransactions, prepareThesisRevisionAnchorTransactions } from "./services/thesis-protocol.js";

type ToolTextResult = {
  isError?: boolean;
  content: Array<{ type: "text"; text: string }>;
};

export type McpPredictionSignalInput = {
  marketId?: string;
  marketTitle?: string;
  marketUrl?: string;
  selectedOutcomeLabel: string;
  oddsAtAdd?: number;
  currentOdds?: number;
  weight: number;
  role: ThesisSignalRole;
  rationale?: string;
  status: PredictionMarketStatus;
};

export type McpFactSignalInput = {
  claimText: string;
  sourceUrl?: string;
  verifierVerdict: ClaimVerdict;
  verifierScore: number;
  reportUri?: string;
  reportHash?: string;
  weight: number;
  role: ThesisSignalRole;
  rationale?: string;
};

export type McpCreateThesisDraftInput = {
  title: string;
  body: string;
  xHandle: string;
  walletAddress: string;
  walletSource: "external";
  predictionSignals: McpPredictionSignalInput[];
  factSignals: McpFactSignalInput[];
};

export type McpPrepareRevisionDraftInput = {
  thesisId: string;
  body: string;
  note?: string;
  xHandle: string;
  walletAddress: string;
};

function toolJson(data: unknown): ToolTextResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function toolError(message: string): ToolTextResult {
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

function draftFingerprint(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function preparedAnchorPayload(input: {
  preparationKind: "draft" | "revision" | "existing";
  fingerprintInput: unknown;
  detail: ThesisDetailResponse;
  transactions: ReturnType<typeof prepareThesisAnchorTransactions>;
  nextStep: string;
}) {
  const fingerprint = draftFingerprint(input.fingerprintInput);
  return {
    publishState: "anchor_prepared_not_published",
    anchorPreparationId: `mcp-${input.preparationKind}-anchor-${fingerprint.slice(0, 24)}`,
    anchorStatus: "prepared",
    thesis: input.detail.thesis,
    markets: input.detail.markets,
    predictor: input.detail.predictor,
    counters: input.detail.counters,
    transactions: input.transactions,
    nextStep: input.nextStep,
  };
}

function identityFor(input: { xHandle: string; walletAddress: string; walletSource?: "external" }): ThesisCreateInput["identity"] {
  return {
    dynamicUserId: `mcp:${input.xHandle}`,
    xHandle: input.xHandle,
    xProfileId: null,
    walletAddress: input.walletAddress,
    walletSource: input.walletSource ?? "external",
  };
}

export function createEvaMcpToolHandlers(
  predictions: LocalPredictionLayerService,
  usageVerifier: EvaUsageVerifier = createAvalancheEvaUsageVerifier(),
) {
  return {
    async searchMarkets({ query }: { query?: string } = {}): Promise<ToolTextResult> {
      const markets = await predictions.listMarkets();
      const normalized = query?.toLowerCase().trim();
      const filtered = normalized
        ? markets.markets.filter((market) => `${market.title} ${market.category}`.toLowerCase().includes(normalized))
        : markets.markets;
      return toolJson(filtered.slice(0, 20));
    },

    async createThesisDraft(input: McpCreateThesisDraftInput): Promise<ToolTextResult> {
      const thesisInput: ThesisCreateInput = {
        identity: identityFor(input),
        title: input.title,
        body: input.body,
        predictionSignals: input.predictionSignals,
        factSignals: input.factSignals,
      };
      const preview = await predictions.previewThesis(thesisInput);
      return toolJson(preparedAnchorPayload({
        preparationKind: "draft",
        fingerprintInput: thesisInput,
        detail: preview,
        transactions: prepareThesisAnchorTransactions(preview.thesis),
        nextStep: "Have the user approve and confirm the anchor transaction before publishing this thesis through Eva.",
      }));
    },

    async getThesis({ thesisId }: { thesisId: string }): Promise<ToolTextResult> {
      const detail = await predictions.getThesis(thesisId);
      return toolJson(detail);
    },

    async prepareRevisionDraft(input: McpPrepareRevisionDraftInput): Promise<ToolTextResult> {
      const revisionInput: ThesisRevisionInput = {
        identity: identityFor({ xHandle: input.xHandle, walletAddress: input.walletAddress, walletSource: "external" }),
        body: input.body,
        note: input.note,
      };
      const preview = await predictions.previewRevision(input.thesisId, revisionInput);
      if (!preview) return toolError(`Thesis not found: ${input.thesisId}`);

      return toolJson(preparedAnchorPayload({
        preparationKind: "revision",
        fingerprintInput: { thesisId: input.thesisId, ...revisionInput },
        detail: preview,
        transactions: prepareThesisRevisionAnchorTransactions(preview.thesis),
        nextStep: "Have the user approve and confirm the revision anchor transaction before publishing this update through Eva.",
      }));
    },

    async prepareExistingThesisAnchorTransaction({ thesisId }: { thesisId: string }): Promise<ToolTextResult> {
      const detail = await predictions.getThesis(thesisId);
      if (!detail) return toolError(`Thesis not found: ${thesisId}`);
      return toolJson(preparedAnchorPayload({
        preparationKind: "existing",
        fingerprintInput: { thesisId: detail.thesis.thesisId, revision: detail.thesis.currentRevision.version },
        detail,
        transactions: prepareThesisAnchorTransactions(detail.thesis),
        nextStep: "Have the user approve and confirm the anchor transaction before publishing or re-anchoring this thesis through Eva.",
      }));
    },

    async prepareEvaProofQuote(input: { thesisId: string; walletAddress: string }): Promise<ToolTextResult> {
      const detail = await predictions.getThesis(input.thesisId);
      if (!detail) return toolError(`Thesis not found: ${input.thesisId}`);
      try {
        return toolJson(createEvaUsageQuote({
          action: "agent_proof_bundle",
          account: input.walletAddress,
          resourceId: detail.thesis.thesisId,
        }));
      } catch (error) {
        return toolError(error instanceof Error ? error.message : "Unable to prepare EVA usage quote");
      }
    },

    async getPaidThesisProofBundle(input: {
      thesisId: string;
      walletAddress: string;
      evaUsageTxHash: `0x${string}`;
    }): Promise<ToolTextResult> {
      const detail = await predictions.getThesis(input.thesisId);
      if (!detail) return toolError(`Thesis not found: ${input.thesisId}`);

      const quote = createEvaUsageQuote({
        action: "agent_proof_bundle",
        account: input.walletAddress,
        resourceId: detail.thesis.thesisId,
      });
      const verification = await usageVerifier.verifyUsage({
        txHash: input.evaUsageTxHash,
        quote,
      });
      if (!verification.ok) return toolError(verification.error);

      const sourceUrls = Array.from(new Set([
        ...detail.thesis.evidenceLinks,
        ...detail.thesis.signals.flatMap((signal) => {
          if (signal.kind === "prediction_market") return [signal.marketUrl].filter((value): value is string => Boolean(value));
          return [signal.sourceUrl].filter((value): value is string => Boolean(value));
        }),
      ]));
      return toolJson({
        releaseState: "paid_proof_bundle_released",
        payment: {
          txHash: input.evaUsageTxHash,
          receiptId: verification.receiptId,
          confirmedAt: verification.confirmedAt,
          amountWei: quote.amountWei,
          token: quote.token,
          burner: quote.burner,
          referenceHash: quote.referenceHash,
          permit2: false,
        },
        proofBundle: {
          thesisId: detail.thesis.thesisId,
          title: detail.thesis.title,
          currentRevision: detail.thesis.currentRevision.version,
          currentScore: detail.thesis.currentScore,
          status: detail.thesis.status,
          author: detail.thesis.author,
          anchor: detail.thesis.anchor,
          sources: sourceUrls,
          signals: detail.thesis.signals,
          revisionReceipts: detail.thesis.revisions.map((revision) => ({
            revisionId: revision.revisionId,
            version: revision.version,
            note: revision.note,
            scoreBefore: revision.scoreBefore,
            scoreAfter: revision.scoreAfter,
            anchor: revision.anchor,
          })),
        },
      });
    },
  };
}
