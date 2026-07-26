import {
  decodeFunctionData,
  encodeAbiParameters,
  encodeEventTopics,
  getAddress,
} from "viem";
import { describe, expect, it } from "vitest";
import {
  createEvaUsageQuote,
  evaUsageBurnerAbi,
  matchingEvaUsageReceiptId,
} from "../src/services/eva-usage.js";

const account = "0x1111111111111111111111111111111111111111";

describe("EVA usage quotes", () => {
  it("derives deterministic wallet-bound direct-allowance calldata without Permit2", () => {
    const quote = createEvaUsageQuote({
      action: "publish_thesis",
      account,
      resourceId: "draft-anchor-security-1",
    });
    const repeated = createEvaUsageQuote({
      action: "publish_thesis",
      account,
      resourceId: "draft-anchor-security-1",
    });
    const otherResource = createEvaUsageQuote({
      action: "publish_thesis",
      account,
      resourceId: "draft-anchor-security-2",
    });

    expect(repeated).toEqual(quote);
    expect(otherResource.referenceHash).not.toBe(quote.referenceHash);
    expect(quote).toMatchObject({
      action: "publish_thesis",
      account: getAddress(account),
      amountWei: "100000000000000000000000",
      usageKind: 0,
      paymentBoundary: "wallet_approval_and_broadcast_required",
      permit2: false,
    });
    expect(quote.approvalTransaction.to).toBe(quote.token);
    expect(quote.retirementTransaction.to).toBe(quote.burner);

    const retirement = decodeFunctionData({
      abi: evaUsageBurnerAbi,
      data: quote.retirementTransaction.data,
    });
    expect(retirement).toMatchObject({
      functionName: "retireForUsage",
      args: [0, quote.referenceHash, BigInt(quote.amountWei)],
    });
  });

  it("accepts only the exact burner event bound to the quote", () => {
    const quote = createEvaUsageQuote({
      action: "agent_proof_bundle",
      account,
      resourceId: "thesis-security-1",
    });
    const receiptId = `0x${"e".repeat(64)}` as const;
    const topics = encodeEventTopics({
      abi: evaUsageBurnerAbi,
      eventName: "EvaUsedAndRetired",
      args: {
        receiptId,
        account: quote.account,
        usageKind: quote.usageKind,
      },
    });
    const data = encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "uint256" },
        { type: "address" },
      ],
      [quote.referenceHash, BigInt(quote.amountWei), quote.burnSink],
    );

    expect(matchingEvaUsageReceiptId({
      address: quote.burner,
      data,
      topics,
    }, quote)).toBe(receiptId);
    expect(matchingEvaUsageReceiptId({
      address: quote.burner,
      data: encodeAbiParameters(
        [{ type: "bytes32" }, { type: "uint256" }, { type: "address" }],
        [quote.referenceHash, BigInt(quote.amountWei) - 1n, quote.burnSink],
      ),
      topics,
    }, quote)).toBeNull();
  });

  it("rejects invalid accounts and unbounded resource identifiers", () => {
    expect(() => createEvaUsageQuote({
      action: "publish_revision",
      account: "0x1111",
      resourceId: "revision-1",
    })).toThrow(/full EVM account/);
    expect(() => createEvaUsageQuote({
      action: "publish_revision",
      account,
      resourceId: "x".repeat(257),
    })).toThrow(/between 1 and 256/);
  });
});
