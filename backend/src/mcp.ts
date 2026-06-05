import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getPredictionLayerService } from "./services/prediction-layer.js";
import { prepareThesisAnchorTransactions } from "./services/thesis-protocol.js";

const server = new McpServer({
  name: "eva-thesis",
  version: "0.1.0",
});

const predictions = getPredictionLayerService();

server.tool("search_markets", { query: z.string().optional() }, async ({ query }) => {
  const markets = await predictions.listMarkets();
  const normalized = query?.toLowerCase().trim();
  const filtered = normalized
    ? markets.markets.filter((market) => `${market.title} ${market.category}`.toLowerCase().includes(normalized))
    : markets.markets;
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(filtered.slice(0, 20), null, 2),
      },
    ],
  };
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
    const created = await predictions.createThesis({
      identity: {
        dynamicUserId: `mcp:${xHandle}`,
        xHandle,
        xProfileId: null,
        walletAddress,
        walletSource,
      },
      title,
      body,
      predictionSignals,
      factSignals,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(created.thesis, null, 2) }],
    };
  },
);

server.tool(
  "get_thesis",
  {
    thesisId: z.string(),
  },
  async ({ thesisId }) => {
    const detail = await predictions.getThesis(thesisId);
    return {
      content: [{ type: "text", text: JSON.stringify(detail, null, 2) }],
    };
  },
);

server.tool(
  "record_revision",
  {
    thesisId: z.string(),
    body: z.string(),
    note: z.string().optional(),
    xHandle: z.string(),
    walletAddress: z.string(),
  },
  async ({ thesisId, body, note, xHandle, walletAddress }) => {
    const revised = await predictions.recordRevision(thesisId, {
      identity: {
        dynamicUserId: `mcp:${xHandle}`,
        xHandle,
        xProfileId: null,
        walletAddress,
        walletSource: "external",
      },
      body,
      note,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(revised, null, 2) }],
    };
  },
);

server.tool(
  "prepare_anchor_transaction",
  {
    thesisId: z.string(),
  },
  async ({ thesisId }) => {
    const detail = await predictions.getThesis(thesisId);
    if (!detail) {
      return {
        isError: true,
        content: [{ type: "text", text: `Thesis not found: ${thesisId}` }],
      };
    }
    const prepared = prepareThesisAnchorTransactions(detail.thesis);
    return {
      content: [{ type: "text", text: JSON.stringify(prepared, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
