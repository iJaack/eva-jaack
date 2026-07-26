"use client";

import { createContext, useContext, type ReactNode } from "react";

type DynamicTestContext = {
  primaryWallet: unknown;
  user: unknown;
};

const DynamicContext = createContext<DynamicTestContext | null>(null);

declare global {
  interface Window {
    __evaDynamicContext?: {
      primaryWallet: unknown;
      user: unknown;
    };
  }
}

export function DynamicContextProvider({
  children,
}: {
  children: ReactNode;
  settings?: {
    environmentId: string;
    walletConnectors: unknown[];
  };
}) {
  const value =
    typeof window !== "undefined" && window.__evaDynamicContext
      ? window.__evaDynamicContext
      : {
          primaryWallet: null,
          user: null,
        };

  return <DynamicContext.Provider value={value}>{children}</DynamicContext.Provider>;
}

export function DynamicWidget() {
  useDynamicContext();
  return <button type="button">Connect Dynamic test</button>;
}

export function useDynamicContext() {
  const value = useContext(DynamicContext);
  if (!value) throw new Error("Hook must be used within <DynamicContextProvider>.");
  return value;
}
