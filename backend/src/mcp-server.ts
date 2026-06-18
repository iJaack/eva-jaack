import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createEvaMcpToolHandlers } from "./mcp-tools.js";
import {
  createThesisDraftToolSchema,
  getThesisToolSchema,
  prepareAnchorTransactionToolSchema,
  prepareRevisionDraftToolSchema,
  searchMarketsToolSchema,
} from "./mcp-schemas.js";
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

  server.tool("search_markets", searchMarketsToolSchema, async ({ query }) => {
    return handlers.searchMarkets({ query });
  });

  server.tool(
    "create_thesis_draft",
    createThesisDraftToolSchema,
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
    getThesisToolSchema,
    async ({ thesisId }) => {
      return handlers.getThesis({ thesisId });
    },
  );

  server.tool(
    "prepare_revision_draft",
    prepareRevisionDraftToolSchema,
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
    prepareAnchorTransactionToolSchema,
    async ({ thesisId }) => {
      return handlers.prepareExistingThesisAnchorTransaction({ thesisId });
    },
  );

  return server;
}
