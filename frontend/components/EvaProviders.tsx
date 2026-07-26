"use client";

import type { ReactNode } from "react";
import { SelfCustodyWalletProvider } from "@/lib/self-custody-wallet";

type EvaProvidersProps = {
  children: ReactNode;
};

export default function EvaProviders({ children }: EvaProvidersProps) {
  return <SelfCustodyWalletProvider>{children}</SelfCustodyWalletProvider>;
}
