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

type EvaMcpToolName = typeof evaMcpToolNames[number];

export const evaMcpToolDescriptions = {
  search_markets:
    "Read-only search for candidate prediction-market signals from the configured market universe. Does not draft, publish, broadcast, call direct REST writes, or mutate Eva thesis state.",
  create_thesis_draft:
    "Prepare a new thesis preview and anchor calldata only. Returns anchor_prepared_not_published; does not publish, broadcast, call direct REST writes, or prove storage durability.",
  get_thesis:
    "Read-only inspection of an existing Eva thesis by thesisId. Does not revise, publish, broadcast, call direct REST writes, or mutate Eva thesis state.",
  prepare_revision_draft:
    "Prepare a full-body revision preview and revision-anchor calldata only. Returns anchor_prepared_not_published; does not update the live thesis, publish, broadcast, call direct REST writes, or prove storage durability.",
  prepare_anchor_transaction:
    "Rebuild anchor calldata for an existing thesis only. Returns anchor_prepared_not_published. Does not publish, revise, broadcast, call direct REST writes, confirm onchain state, or prove storage durability.",
} satisfies Record<EvaMcpToolName, string>;

const readOnlyToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const preparationToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export function createEvaMcpServer() {
  const server = new McpServer({
    name: "eva-thesis",
    version: "0.1.0",
  });

  const predictions = getPredictionLayerService();
  const handlers = createEvaMcpToolHandlers(predictions);

  server.registerTool("search_markets", {
    description: evaMcpToolDescriptions.search_markets,
    inputSchema: searchMarketsToolSchema,
    annotations: { ...readOnlyToolAnnotations, openWorldHint: true },
  }, async ({ query }) => {
    return handlers.searchMarkets({ query });
  });

  server.registerTool(
    "create_thesis_draft",
    {
      description: evaMcpToolDescriptions.create_thesis_draft,
      inputSchema: createThesisDraftToolSchema,
      annotations: preparationToolAnnotations,
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

  server.registerTool(
    "get_thesis",
    {
      description: evaMcpToolDescriptions.get_thesis,
      inputSchema: getThesisToolSchema,
      annotations: readOnlyToolAnnotations,
    },
    async ({ thesisId }) => {
      return handlers.getThesis({ thesisId });
    },
  );

  server.registerTool(
    "prepare_revision_draft",
    {
      description: evaMcpToolDescriptions.prepare_revision_draft,
      inputSchema: prepareRevisionDraftToolSchema,
      annotations: preparationToolAnnotations,
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

  server.registerTool(
    "prepare_anchor_transaction",
    {
      description: evaMcpToolDescriptions.prepare_anchor_transaction,
      inputSchema: prepareAnchorTransactionToolSchema,
      annotations: preparationToolAnnotations,
    },
    async ({ thesisId }) => {
      return handlers.prepareExistingThesisAnchorTransaction({ thesisId });
    },
  );

  return server;
}
