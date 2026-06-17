import { describe, expect, it } from "vitest";
import { predictionMarketStatusValues, predictionSignalInputSchema } from "../src/mcp-schemas.js";

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
});
