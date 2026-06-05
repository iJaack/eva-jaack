"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

type EvaProvidersProps = {
  children: ReactNode;
};

type DynamicProvider = ComponentType<{
  children: ReactNode;
  settings: {
    environmentId: string;
    walletConnectors: unknown[];
  };
}>;

export default function EvaProviders({ children }: EvaProvidersProps) {
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
  const [dynamic, setDynamic] = useState<{ Provider: DynamicProvider; walletConnectors: unknown[] } | null>(null);

  useEffect(() => {
    if (!environmentId) return;
    let cancelled = false;
    Promise.all([import("@dynamic-labs/sdk-react-core"), import("@dynamic-labs/ethereum")])
      .then(([core, ethereum]) => {
        if (cancelled) return;
        setDynamic({
          Provider: core.DynamicContextProvider as DynamicProvider,
          walletConnectors: [ethereum.EthereumWalletConnectors],
        });
      })
      .catch(() => setDynamic(null));
    return () => {
      cancelled = true;
    };
  }, [environmentId]);

  if (!environmentId || !dynamic) {
    return <>{children}</>;
  }

  const Provider = dynamic.Provider;
  return (
    <Provider
      settings={{
        environmentId,
        walletConnectors: dynamic.walletConnectors,
      }}
    >
      {children}
    </Provider>
  );
}
