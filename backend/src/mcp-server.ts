import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createEvaMcpToolHandlers } from "./mcp-tools.js";
import { getPredictionLayerService } from "./services/prediction-layer.js";

export const evaMcpToolNames = [
  "search_markets",
  "create_thesis_draft",
  "get_thesis",
  "prepare_revision_draft",
  "prepare_anchor_transaction",
] as const;

export function createEvaMcpServer() {
  const server = new McpServer({
    name: "eva-thesis",
    version: "0.1.0",
  });

  const predictions = getPredictionLayerService();
  const handlers = createEvaMcpToolHandlers(predictions);

  server.tool("search_markets", { query: z.string().optional() }, async ({ query }) => {
    return handlers.searchMarkets({ query });
  });

  server.tool(
    "create_thesis_draft",
    {
      title: z.string(),
      body: z.string(),
      xHandle: z.string(),
      walletAddress: z.string(),
      walletSource: z.enum(["external", "embedded"]).default("external"),
      predictionSignals: z
        .array(
          z.object({
            marketId: z.string().optional(),
            marketTitle: z.string().optional(),
            marketUrl: z.string().url().optional(),
            selectedOutcomeLabel: z.string().default("Yes"),
            oddsAtAdd: z.number().min(0).max(1).optional(),
            currentOdds: z.number().min(0).max(1).optional(),
            weight: z.number().min(1).max(100).default(50),
            role: z.enum(["core", "lateral", "second_order", "third_order", "hedge", "contradiction"]).default("core"),
            rationale: z.string().optional(),
            status: z.enum(["open", "closed", "resolved"]).default("open"),
          }),
        )
        .default([]),
      factSignals: z
        .array(
          z.object({
            claimText: z.string(),
            sourceUrl: z.string().url().optional(),
            verifierVerdict: z.enum(["verified", "likely_true", "mixed", "misleading", "likely_false", "false", "unverifiable_yet", "non_falsifiable"]).default("unverifiable_yet"),
            verifierScore: z.number().min(0).max(100).default(50),
            reportUri: z.string().optional(),
            reportHash: z.string().optional(),
            weight: z.number().min(1).max(100).default(50),
            role: z.enum(["core", "lateral", "second_order", "third_order", "hedge", "contradiction"]).default("second_order"),
            rationale: z.string().optional(),
          }),
        )
        .default([]),
    },
    async ({ title, body, xHandle, walletAddress, walletSource, predictionSignals, factSignals }) => {
      return handlers.createThesisDraft({
        title,
        body,
        xHandle,
        walletAddress,
        walletSource,
        predictionSignals,
        factSignals,
      });
    },
  );

  server.tool(
    "get_thesis",
    {
      thesisId: z.string(),
    },
    async ({ thesisId }) => {
      return handlers.getThesis({ thesisId });
    },
  );

  server.tool(
    "prepare_revision_draft",
    {
      thesisId: z.string(),
      body: z.string(),
      note: z.string().optional(),
      xHandle: z.string(),
      walletAddress: z.string(),
    },
    async ({ thesisId, body, note, xHandle, walletAddress }) => {
      return handlers.prepareRevisionDraft({
        thesisId,
        body,
        note,
        xHandle,
        walletAddress,
      });
    },
  );

  server.tool(
    "prepare_anchor_transaction",
    {
      thesisId: z.string(),
    },
    async ({ thesisId }) => {
      return handlers.prepareExistingThesisAnchorTransaction({ thesisId });
    },
  );

  return server;
}
