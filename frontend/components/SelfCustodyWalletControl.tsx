"use client";

import { useState } from "react";
import { useSelfCustodyWallet } from "@/lib/self-custody-wallet";

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function SelfCustodyWalletControl({ compact = false }: { compact?: boolean }) {
  const { address, connect, error } = useSelfCustodyWallet();
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    try {
      await connect();
    } catch {
      // The provider error is exposed by the shared wallet context.
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="self-custody-wallet-control">
      {address ? (
        <span className="self-custody-wallet-address" title={address}>
          {shortAddress(address)}{compact ? "" : " · Self-custody"}
        </span>
      ) : (
        <button type="button" onClick={handleConnect} disabled={connecting}>
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
      )}
      {!compact && error ? <span className="self-custody-wallet-error" role="status">{error}</span> : null}
    </div>
  );
}
