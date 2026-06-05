"use client";

import type { ReactNode } from "react";

export function DynamicContextProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DynamicWidget() {
  return null;
}

export function useDynamicContext() {
  return {
    primaryWallet: null,
    user: null,
  };
}
