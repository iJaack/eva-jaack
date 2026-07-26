import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { protocol } from "../src/protocol.js";

describe("agent manifest", () => {
  it("publishes the canonical $EVA contract with a bounded live capability set", async () => {
    const response = await createApp().request("/.well-known/agent.json");
    const manifest = await response.json();

    expect(response.status).toBe(200);
    expect(manifest.platformToken).toEqual({
      contract: `eip155:43114:${protocol.tokens.eva.address}`,
      usageBurner: `eip155:43114:${protocol.contracts.evaUsageBurner}`,
      symbol: "EVA",
      liveCapabilities: [
        "contract_metadata",
        "holder_balance_readback",
        "author_context",
        "usage_retirement",
        "usage_receipts",
      ],
      supplyAccounting: "Tokens used through Eva are transferred to 0xdead; legacy totalSupply remains unchanged.",
      priceBoundary: "Usage can create token demand and circulating-supply pressure; price appreciation is not guaranteed.",
      notActive: ["staking", "gating", "yield", "governance", "trade_execution"],
    });
  });
});
