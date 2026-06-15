"use client";

import type { ReactNode } from "react";

declare global {
  interface Window {
    __evaDynamicContext?: {
      primaryWallet: unknown;
      user: unknown;
    };
  }
}

export function DynamicContextProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DynamicWidget() {
  return <button type="button">Connect Dynamic test</button>;
}

export function useDynamicContext() {
  if (typeof window !== "undefined" && window.__evaDynamicContext) return window.__evaDynamicContext;
  return {
    primaryWallet: null,
    user: null,
  };
}
