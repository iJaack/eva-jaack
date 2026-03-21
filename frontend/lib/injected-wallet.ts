const AVALANCHE_C_CHAIN_ID = 43114;
const AVALANCHE_C_CHAIN_HEX = "0xa86a";

export type EthereumChainParams = {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
};

export const avalancheCChainParams: EthereumChainParams = {
  chainId: AVALANCHE_C_CHAIN_HEX,
  chainName: "Avalanche C-Chain",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
  blockExplorerUrls: ["https://snowtrace.io"],
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export function normalizeChainId(chainId: string | number | null | undefined): number | null {
  if (chainId === null || chainId === undefined) return null;
  if (typeof chainId === "number") return Number.isFinite(chainId) ? chainId : null;

  const value = chainId.trim();
  if (!value) return null;

  const parsed = value.startsWith("0x") ? Number.parseInt(value, 16) : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isAvalancheCChain(chainId: number | null | undefined): boolean {
  return chainId === AVALANCHE_C_CHAIN_ID;
}

export async function getConnectedAccounts(provider: EthereumProvider): Promise<string[]> {
  const accounts = await provider.request({ method: "eth_accounts" });
  return Array.isArray(accounts) ? accounts.filter((value): value is string => typeof value === "string") : [];
}

export async function requestWalletConnection(provider: EthereumProvider): Promise<string[]> {
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  return Array.isArray(accounts) ? accounts.filter((value): value is string => typeof value === "string") : [];
}

export async function getCurrentChainId(provider: EthereumProvider): Promise<number | null> {
  const chainId = await provider.request({ method: "eth_chainId" });
  return typeof chainId === "string" || typeof chainId === "number" ? normalizeChainId(chainId) : null;
}

export async function switchToAvalancheCChain(provider: EthereumProvider): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: AVALANCHE_C_CHAIN_HEX }],
    });
  } catch (error) {
    const providerError = asProviderError(error);
    if (providerError?.code !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [avalancheCChainParams],
    });
  }
}

export function formatProviderError(error: unknown): string {
  const providerError = asProviderError(error);
  if (providerError?.message) return providerError.message;
  if (error instanceof Error && error.message) return error.message;
  return "Wallet request failed.";
}

function asProviderError(error: unknown): { code?: number; message?: string } | null {
  if (!error || typeof error !== "object") return null;

  const maybeCode = "code" in error ? error.code : undefined;
  const maybeMessage = "message" in error ? error.message : undefined;

  return {
    code: typeof maybeCode === "number" ? maybeCode : undefined,
    message: typeof maybeMessage === "string" ? maybeMessage : undefined,
  };
}
