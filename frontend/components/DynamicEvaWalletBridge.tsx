"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect } from "react";

export default function DynamicEvaWalletBridge({
  onWallet,
}: {
  onWallet: (address: `0x${string}` | null) => void;
}) {
  const { primaryWallet } = useDynamicContext();

  useEffect(() => {
    const address = primaryWallet?.address;
    onWallet(address && /^0x[0-9a-fA-F]{40}$/.test(address) ? (address as `0x${string}`) : null);
  }, [onWallet, primaryWallet]);

  return null;
}
