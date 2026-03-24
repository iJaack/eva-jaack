import { getApiBase } from "./protocol";

export type CuratorRegisterRequest = {
  walletAddress: string;
  agentId: string;
  stakeAmount?: string;
};

export type PreparedTransaction = {
  to: string;
  data: string;
  description: string;
};

export type CuratorRegisterSuccess = {
  ready: true;
  walletAddress: string;
  agentId: string;
  stakeAmount: string;
  stakeAmountEva: string;
  minStakeEva: string;
  chain: string;
  chainId: number;
  contracts: {
    evaToken: string;
    evaTrustGraph: string;
    erc8004Identity: string;
  };
  needsApproval: boolean;
  currentAllowanceEva: string;
  transactions: PreparedTransaction[];
};

export type CuratorRegisterError = {
  error: string;
  details?: string;
  alreadyRegistered?: boolean;
  curatorAgentId?: string;
  trustScore?: number;
  identityOwner?: string;
  agentId?: string;
  minStakeEva?: string;
  requestedEva?: string;
  requiredEva?: string;
  balanceEva?: string;
};

export type CuratorRegisterResponse = CuratorRegisterSuccess | CuratorRegisterError;

export async function preflightCuratorRegistration(
  payload: CuratorRegisterRequest
): Promise<CuratorRegisterResponse> {
  const response = await fetch(`${getApiBase()}/curator/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as CuratorRegisterResponse;

  if (!response.ok) {
    return data;
  }

  return data;
}

export function formatTokenAmount(value?: string): string {
  if (!value) return "—";

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: parsed >= 1000 ? 0 : 4,
  }).format(parsed);
}

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
