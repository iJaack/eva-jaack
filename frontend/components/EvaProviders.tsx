"use client";

import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import type { ReactNode } from "react";

type EvaProvidersProps = {
  children: ReactNode;
};

export default function EvaProviders({ children }: EvaProvidersProps) {
  const environmentId =
    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ||
    (process.env.NEXT_PUBLIC_DYNAMIC_TEST_CONTEXT === "1" ? "dynamic-test-environment" : undefined);
  if (!environmentId) return <>{children}</>;

  // Dynamic consumers can render anywhere in the app chrome. Keep their provider
  // present on the first render to avoid out-of-context hooks and whole-app remounts.
  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
