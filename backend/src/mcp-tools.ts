import { createHash } from "node:crypto";
import type { ClaimVerdict, PredictionMarketStatus, ThesisSignalRole, ThesisWalletSource } from "./lib/api-types.js";
import type { LocalPredictionLayerService, ThesisCreateInput, ThesisRevisionInput } from "./services/prediction-layer.js";
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
  walletSource: ThesisWalletSource;
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

function identityFor(input: { xHandle: string; walletAddress: string; walletSource?: ThesisWalletSource }): ThesisCreateInput["identity"] {
  return {
    dynamicUserId: `mcp:${input.xHandle}`,
    xHandle: input.xHandle,
    xProfileId: null,
    walletAddress: input.walletAddress,
    walletSource: input.walletSource ?? "external",
  };
}

export function createEvaMcpToolHandlers(predictions: LocalPredictionLayerService) {
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
      const fingerprint = draftFingerprint(thesisInput);
      return toolJson({
        publishState: "anchor_prepared_not_published",
        anchorPreparationId: `mcp-draft-anchor-${fingerprint.slice(0, 24)}`,
        anchorStatus: "prepared",
        thesis: preview.thesis,
        markets: preview.markets,
        predictor: preview.predictor,
        counters: preview.counters,
        transactions: prepareThesisAnchorTransactions(preview.thesis),
        nextStep: "Have the user approve and confirm the anchor transaction before publishing this thesis through Eva.",
      });
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

      const fingerprint = draftFingerprint({ thesisId: input.thesisId, ...revisionInput });
      return toolJson({
        publishState: "anchor_prepared_not_published",
        anchorPreparationId: `mcp-revision-anchor-${fingerprint.slice(0, 24)}`,
        anchorStatus: "prepared",
        thesis: preview.thesis,
        markets: preview.markets,
        predictor: preview.predictor,
        counters: preview.counters,
        transactions: prepareThesisRevisionAnchorTransactions(preview.thesis),
        nextStep: "Have the user approve and confirm the revision anchor transaction before publishing this update through Eva.",
      });
    },

    async prepareExistingThesisAnchorTransaction({ thesisId }: { thesisId: string }): Promise<ToolTextResult> {
      const detail = await predictions.getThesis(thesisId);
      if (!detail) return toolError(`Thesis not found: ${thesisId}`);
      return toolJson(prepareThesisAnchorTransactions(detail.thesis));
    },
  };
}
