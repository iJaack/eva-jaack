import {
  createPublicClient,
  decodeEventLog,
  encodeAbiParameters,
  encodeFunctionData,
  getAddress,
  http,
  isAddress,
  keccak256,
  type Hash,
  type Hex,
} from "viem";
import { avalanche } from "viem/chains";
import { config } from "../config.js";
import { protocol } from "../protocol.js";

export const evaUsageActionValues = [
  "publish_thesis",
  "publish_revision",
  "agent_proof_bundle",
] as const;

export type EvaUsageAction = (typeof evaUsageActionValues)[number];

const burnSink = "0x000000000000000000000000000000000000dEaD" as const;

export const evaUsageBurnerAbi = [
  {
    type: "function",
    name: "retireForUsage",
    stateMutability: "nonpayable",
    inputs: [
      { name: "usageKind", type: "uint8" },
      { name: "referenceHash", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "receiptId", type: "bytes32" }],
  },
  {
    type: "event",
    name: "EvaUsedAndRetired",
    inputs: [
      { name: "receiptId", type: "bytes32", indexed: true },
      { name: "account", type: "address", indexed: true },
      { name: "usageKind", type: "uint8", indexed: true },
      { name: "referenceHash", type: "bytes32", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "burnSink", type: "address", indexed: false },
    ],
  },
] as const;

const evaApprovalAbi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export type EvaUsageQuote = {
  quoteVersion: string;
  quoteId: Hash;
  action: EvaUsageAction;
  label: string;
  chainId: number;
  account: `0x${string}`;
  token: `0x${string}`;
  burner: `0x${string}`;
  burnSink: `0x${string}`;
  usageKind: number;
  resourceId: string;
  referenceHash: Hash;
  amountWei: string;
  approvalTransaction: {
    to: `0x${string}`;
    data: Hash;
    description: string;
  };
  retirementTransaction: {
    to: `0x${string}`;
    data: Hash;
    description: string;
  };
  paymentBoundary: "wallet_approval_and_broadcast_required";
  permit2: false;
};

function actionConfig(action: EvaUsageAction) {
  return protocol.evaUsage.actions[action];
}

export function isEvaUsageAction(value: unknown): value is EvaUsageAction {
  return typeof value === "string" && evaUsageActionValues.includes(value as EvaUsageAction);
}

export function createEvaUsageQuote(input: {
  action: EvaUsageAction;
  account: string;
  resourceId: string;
}): EvaUsageQuote {
  if (!isAddress(input.account)) throw new Error("A full EVM account is required for an EVA usage quote");
  const resourceId = input.resourceId.trim();
  if (!resourceId || resourceId.length > 256) {
    throw new Error("resourceId must contain between 1 and 256 characters");
  }

  const account = getAddress(input.account);
  const burner = getAddress(config.evaUsageBurner);
  const token = getAddress(config.evaToken);
  const action = actionConfig(input.action);
  const amount = BigInt(action.amountWei);
  const referenceHash = keccak256(
    encodeAbiParameters(
      [
        { type: "string" },
        { type: "uint256" },
        { type: "address" },
        { type: "address" },
        { type: "uint8" },
        { type: "string" },
        { type: "string" },
      ],
      [
        protocol.evaUsage.quoteVersion,
        BigInt(protocol.chain.id),
        burner,
        account,
        action.usageKind,
        input.action,
        resourceId,
      ],
    ),
  );
  const quoteId = keccak256(
    encodeAbiParameters(
      [{ type: "string" }, { type: "bytes32" }],
      [protocol.evaUsage.quoteVersion, referenceHash],
    ),
  );

  return {
    quoteVersion: protocol.evaUsage.quoteVersion,
    quoteId,
    action: input.action,
    label: action.label,
    chainId: protocol.chain.id,
    account,
    token,
    burner,
    burnSink,
    usageKind: action.usageKind,
    resourceId,
    referenceHash,
    amountWei: amount.toString(),
    approvalTransaction: {
      to: token,
      data: encodeFunctionData({
        abi: evaApprovalAbi,
        functionName: "approve",
        args: [burner, amount],
      }),
      description: `Approve exactly ${action.label.toLowerCase()} EVA usage`,
    },
    retirementTransaction: {
      to: burner,
      data: encodeFunctionData({
        abi: evaUsageBurnerAbi,
        functionName: "retireForUsage",
        args: [action.usageKind, referenceHash, amount],
      }),
      description: action.label,
    },
    paymentBoundary: "wallet_approval_and_broadcast_required",
    permit2: false,
  };
}

export type EvaUsageVerification =
  | { ok: true; receiptId: Hash; confirmedAt: string; blockNumber: string }
  | { ok: false; error: string };

export interface EvaUsageVerifier {
  verifyUsage(input: { txHash: Hash; quote: EvaUsageQuote }): Promise<EvaUsageVerification>;
}

export function matchingEvaUsageReceiptId(
  log: { address: `0x${string}`; data: Hex; topics: readonly Hex[] },
  quote: EvaUsageQuote,
): Hash | null {
  if (log.address.toLowerCase() !== quote.burner.toLowerCase()) return null;
  try {
    const decoded = decodeEventLog({
      abi: evaUsageBurnerAbi,
      eventName: "EvaUsedAndRetired",
      data: log.data,
      topics: [...log.topics] as [] | [signature: Hex, ...args: Hex[]],
    });
    const args = decoded.args;
    if (
      args.account.toLowerCase() === quote.account.toLowerCase() &&
      Number(args.usageKind) === quote.usageKind &&
      args.referenceHash.toLowerCase() === quote.referenceHash.toLowerCase() &&
      args.amount === BigInt(quote.amountWei) &&
      args.burnSink.toLowerCase() === quote.burnSink.toLowerCase()
    ) {
      return args.receiptId;
    }
  } catch {
    // Unrelated or malformed logs are not payment evidence.
  }
  return null;
}

export function createAvalancheEvaUsageVerifier(): EvaUsageVerifier {
  const publicClient = createPublicClient({
    chain: avalanche,
    transport: http(config.avalancheRpc),
  });

  return {
    async verifyUsage({ txHash, quote }) {
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
        if (receipt.status !== "success") return { ok: false, error: "EVA usage transaction is not successful" };

        for (const log of receipt.logs) {
          const receiptId = matchingEvaUsageReceiptId(log, quote);
          if (receiptId) {
            const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
            return {
              ok: true,
              receiptId,
              confirmedAt: new Date(Number(block.timestamp) * 1_000).toISOString(),
              blockNumber: receipt.blockNumber.toString(),
            };
          }
        }
        return { ok: false, error: "EVA usage receipt does not match this wallet, action, amount, and resource" };
      } catch {
        return { ok: false, error: "EVA usage transaction is not confirmed on Avalanche" };
      }
    },
  };
}
