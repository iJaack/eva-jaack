import { z } from "zod";
import { describe, expect, it } from "vitest";
import {
  createThesisDraftToolSchema,
  predictionMarketStatusValues,
  predictionSignalInputSchema,
  prepareRevisionDraftToolSchema,
} from "../src/mcp-schemas.js";

describe("Eva MCP schemas", () => {
  it("keeps prediction market statuses aligned with the public API type", () => {
    expect(predictionMarketStatusValues).toEqual(["open", "closed", "resolved", "cancelled"]);
    expect(predictionSignalInputSchema.parse({ selectedOutcomeLabel: "No", status: "cancelled" })).toMatchObject({
      selectedOutcomeLabel: "No",
      status: "cancelled",
      weight: 50,
      role: "core",
    });
  });

  it("rejects unsupported prediction market statuses instead of accepting ambiguous agent input", () => {
    expect(() => predictionSignalInputSchema.parse({ selectedOutcomeLabel: "Yes", status: "archived" })).toThrow();
  });

  it("requires full 0x-prefixed EVM wallet addresses for write-adjacent tools", () => {
    const createDraftInput = z.object(createThesisDraftToolSchema);
    const prepareRevisionInput = z.object(prepareRevisionDraftToolSchema);
    const validWallet = "0x1111111111111111111111111111111111111111";

    expect(createDraftInput.parse({
      title: "Agent-safe draft",
      body: "Draft body.",
      xHandle: "@agentalpha",
      walletAddress: validWallet,
    })).toMatchObject({ walletAddress: validWallet });

    for (const walletAddress of ["vitalik.eth", "0x1111...1111", "1111111111111111111111111111111111111111"]) {
      expect(() => createDraftInput.parse({
        title: "Agent-safe draft",
        body: "Draft body.",
        xHandle: "@agentalpha",
        walletAddress,
      })).toThrow(/walletAddress/);

      expect(() => prepareRevisionInput.parse({
        thesisId: "thesis_123",
        body: "Full replacement body.",
        xHandle: "@agentalpha",
        walletAddress,
      })).toThrow(/walletAddress/);
    }
  });
});
