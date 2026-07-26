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
        "paid_thesis_publication",
        "paid_thesis_revisions",
        "paid_agent_proof_bundles",
      ],
      paymentProtocol: {
        type: "direct_erc20_allowance",
        quoteEndpoint: "https://eva.jaack.me/api/eva/usage/quote",
        spender: `eip155:43114:${protocol.contracts.evaUsageBurner}`,
        flow: ["approve_exact_amount", "retireForUsage", "verify_EvaUsedAndRetired"],
        permit2: false,
        serverCanSpendWalletFunds: false,
      },
      supplyAccounting: "Tokens used through Eva are transferred to 0xdead; legacy totalSupply remains unchanged.",
      priceBoundary: "Usage can create token demand and circulating-supply pressure; price appreciation is not guaranteed.",
      notActive: ["staking", "balance_based_access", "yield", "governance", "trade_execution"],
    });
  });
});
