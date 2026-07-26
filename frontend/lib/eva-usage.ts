import { createPublicClient, http } from "viem";
import { avalanche } from "viem/chains";
import { protocol } from "@/lib/protocol";

export const evaUsageBurnerAbi = [
  {
    type: "function",
    name: "BURN_SINK",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "MINIMUM_RETIREMENT",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalRetired",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "receiptCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
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

export const evaTokenUsageAbi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
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

export const evaPublicClient = createPublicClient({
  chain: avalanche,
  transport: http(protocol.chain.publicRpcUrl),
});

export type EvaUsageSnapshot = {
  burnSink: `0x${string}`;
  minimumRetirement: bigint;
  totalRetired: bigint;
  receiptCount: bigint;
  allTimeSinkBalance: bigint;
  walletAllowance: bigint | null;
};

export async function readEvaUsageSnapshot(
  walletAddress?: `0x${string}` | null,
): Promise<EvaUsageSnapshot> {
  const burner = {
    address: protocol.contracts.evaUsageBurner as `0x${string}`,
    abi: evaUsageBurnerAbi,
  } as const;
  const token = {
    address: protocol.tokens.eva.address as `0x${string}`,
    abi: evaTokenUsageAbi,
  } as const;

  const [burnSink, minimumRetirement, totalRetired, receiptCount] = await Promise.all([
    evaPublicClient.readContract({ ...burner, functionName: "BURN_SINK" }),
    evaPublicClient.readContract({ ...burner, functionName: "MINIMUM_RETIREMENT" }),
    evaPublicClient.readContract({ ...burner, functionName: "totalRetired" }),
    evaPublicClient.readContract({ ...burner, functionName: "receiptCount" }),
  ]);
  const [allTimeSinkBalance, walletAllowance] = await Promise.all([
    evaPublicClient.readContract({ ...token, functionName: "balanceOf", args: [burnSink] }),
    walletAddress
      ? evaPublicClient.readContract({
          ...token,
          functionName: "allowance",
          args: [walletAddress, protocol.contracts.evaUsageBurner as `0x${string}`],
        })
      : Promise.resolve(null),
  ]);

  return {
    burnSink,
    minimumRetirement,
    totalRetired,
    receiptCount,
    allTimeSinkBalance,
    walletAllowance,
  };
}
