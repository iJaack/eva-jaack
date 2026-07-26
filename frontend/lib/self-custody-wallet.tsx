"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Hash, Hex } from "viem";
import {
  formatProviderError,
  getConnectedAccounts,
  getCurrentChainId,
  getInjectedProvider,
  isAvalancheCChain,
  requestWalletConnection,
  switchToAvalancheCChain,
  type EthereumProvider,
} from "@/lib/injected-wallet";

type SendTransactionInput = {
  to: `0x${string}`;
  data: Hex;
};

type SelfCustodyWalletContextValue = {
  address: `0x${string}` | null;
  chainId: number | null;
  providerAvailable: boolean;
  error: string | null;
  connect: () => Promise<`0x${string}`>;
  ensureAvalanche: () => Promise<void>;
  sendTransaction: (input: SendTransactionInput) => Promise<Hash>;
};

const SelfCustodyWalletContext = createContext<SelfCustodyWalletContextValue | null>(null);

function validAddress(value: string | undefined): value is `0x${string}` {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

function validHash(value: unknown): value is Hash {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
}

export function SelfCustodyWalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<EthereumProvider | null>(null);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextProvider = getInjectedProvider();
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setProvider(nextProvider);
    });
    if (!nextProvider) {
      return () => {
        cancelled = true;
      };
    }

    Promise.all([getConnectedAccounts(nextProvider), getCurrentChainId(nextProvider)])
      .then(([accounts, currentChainId]) => {
        if (cancelled) return;
        setAddress(validAddress(accounts[0]) ? accounts[0] : null);
        setChainId(currentChainId);
      })
      .catch((nextError) => {
        if (!cancelled) setError(formatProviderError(nextError));
      });

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? args[0].filter((value): value is string => typeof value === "string") : [];
      setAddress(validAddress(accounts[0]) ? accounts[0] : null);
      setError(null);
    };
    const handleChainChanged = (...args: unknown[]) => {
      const value = args[0];
      const parsed =
        typeof value === "string" || typeof value === "number"
          ? Number.parseInt(String(value), String(value).startsWith("0x") ? 16 : 10)
          : Number.NaN;
      setChainId(Number.isFinite(parsed) ? parsed : null);
    };

    nextProvider.on?.("accountsChanged", handleAccountsChanged);
    nextProvider.on?.("chainChanged", handleChainChanged);
    return () => {
      cancelled = true;
      nextProvider.removeListener?.("accountsChanged", handleAccountsChanged);
      nextProvider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    const activeProvider = provider ?? getInjectedProvider();
    if (!activeProvider) {
      const message = "No browser wallet detected. Open Eva in Core, MetaMask, Rabby, or another self-custodial EVM wallet.";
      setError(message);
      throw new Error(message);
    }
    try {
      const accounts = await requestWalletConnection(activeProvider);
      const account = accounts[0];
      if (!validAddress(account)) throw new Error("The wallet did not return a valid EVM account.");
      setProvider(activeProvider);
      setAddress(account);
      setChainId(await getCurrentChainId(activeProvider));
      setError(null);
      return account;
    } catch (nextError) {
      const message = formatProviderError(nextError);
      setError(message);
      throw nextError;
    }
  }, [provider]);

  const ensureAvalanche = useCallback(async () => {
    const activeProvider = provider ?? getInjectedProvider();
    if (!activeProvider) throw new Error("No self-custodial browser wallet detected.");
    const currentChainId = await getCurrentChainId(activeProvider);
    if (!isAvalancheCChain(currentChainId)) await switchToAvalancheCChain(activeProvider);
    setChainId(await getCurrentChainId(activeProvider));
  }, [provider]);

  const sendTransaction = useCallback(
    async ({ to, data }: SendTransactionInput) => {
      const activeProvider = provider ?? getInjectedProvider();
      if (!activeProvider || !address) throw new Error("Connect your self-custodial wallet first.");
      await ensureAvalanche();
      const hash = await activeProvider.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to, data }],
      });
      if (!validHash(hash)) throw new Error("The wallet did not return a valid transaction hash.");
      return hash;
    },
    [address, ensureAvalanche, provider],
  );

  const value = useMemo<SelfCustodyWalletContextValue>(
    () => ({
      address,
      chainId,
      providerAvailable: Boolean(provider),
      error,
      connect,
      ensureAvalanche,
      sendTransaction,
    }),
    [address, chainId, connect, ensureAvalanche, error, provider, sendTransaction],
  );

  return <SelfCustodyWalletContext.Provider value={value}>{children}</SelfCustodyWalletContext.Provider>;
}

export function useSelfCustodyWallet(): SelfCustodyWalletContextValue {
  const value = useContext(SelfCustodyWalletContext);
  if (!value) throw new Error("useSelfCustodyWallet must be used inside SelfCustodyWalletProvider.");
  return value;
}
