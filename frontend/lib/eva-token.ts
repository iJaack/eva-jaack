import { createPublicClient, formatUnits, http } from "viem";
import { avalanche } from "viem/chains";
import { protocol } from "@/lib/protocol";

const evaTokenAbi = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

const client = createPublicClient({
  chain: avalanche,
  transport: http(protocol.chain.publicRpcUrl),
});

export type EvaTokenSnapshot = {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  protocolBalance: bigint;
  walletBalance: bigint | null;
  blockNumber: bigint;
};

export async function readEvaTokenSnapshot(walletAddress?: `0x${string}` | null): Promise<EvaTokenSnapshot> {
  const contract = {
    address: protocol.tokens.eva.address as `0x${string}`,
    abi: evaTokenAbi,
  } as const;

  const [name, symbol, decimals, totalSupply, protocolBalance, walletBalance, blockNumber] = await Promise.all([
    client.readContract({ ...contract, functionName: "name" }),
    client.readContract({ ...contract, functionName: "symbol" }),
    client.readContract({ ...contract, functionName: "decimals" }),
    client.readContract({ ...contract, functionName: "totalSupply" }),
    client.readContract({
      ...contract,
      functionName: "balanceOf",
      args: [protocol.agents.eva.wallet as `0x${string}`],
    }),
    walletAddress
      ? client.readContract({
          ...contract,
          functionName: "balanceOf",
          args: [walletAddress],
        })
      : Promise.resolve(null),
    client.getBlockNumber(),
  ]);

  return {
    name,
    symbol,
    decimals,
    totalSupply,
    protocolBalance,
    walletBalance,
    blockNumber,
  };
}

export function formatEvaAmount(value: bigint, decimals: number, maximumFractionDigits = 4): string {
  const amount = Number(formatUnits(value, decimals));
  if (!Number.isFinite(amount)) return formatUnits(value, decimals);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(amount);
}
