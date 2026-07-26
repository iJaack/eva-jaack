"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import DynamicAuthControl from "@/components/DynamicAuthControl";
import { formatEvaAmount, readEvaTokenSnapshot, type EvaTokenSnapshot } from "@/lib/eva-token";
import { protocol } from "@/lib/protocol";

const dynamicEnvironmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
const dynamicTestMode = process.env.NEXT_PUBLIC_DYNAMIC_TEST_CONTEXT === "1";

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function DynamicWalletLoader({
  onWallet,
}: {
  onWallet: (address: `0x${string}` | null) => void;
}) {
  const [Bridge, setBridge] = useState<ComponentType<{ onWallet: (address: `0x${string}` | null) => void }> | null>(null);

  useEffect(() => {
    if (!dynamicEnvironmentId && !dynamicTestMode) return;
    let cancelled = false;
    import("@/components/DynamicEvaWalletBridge")
      .then((module) => {
        if (!cancelled) setBridge(() => module.default);
      })
      .catch(() => setBridge(null));
    return () => {
      cancelled = true;
    };
  }, []);

  if ((!dynamicEnvironmentId && !dynamicTestMode) || !Bridge) return null;
  return <Bridge onWallet={onWallet} />;
}

function DynamicUsageLoader() {
  const [Panel, setPanel] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!dynamicEnvironmentId && !dynamicTestMode) return;
    let cancelled = false;
    import("@/components/DynamicEvaUsagePanel")
      .then((module) => {
        if (!cancelled) setPanel(() => module.default);
      })
      .catch(() => setPanel(null));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!dynamicEnvironmentId && !dynamicTestMode) {
    return (
      <div className="eva-usage-unconfigured">
        <p>The usage-burn contract is live on Avalanche.</p>
        <span>Wallet transactions are not configured in this environment.</span>
      </div>
    );
  }
  return Panel ? <Panel /> : <p className="eva-usage-unconfigured">Loading the Avalanche usage receipt…</p>;
}

export default function EvaTokenLedger() {
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | null>(null);
  const [snapshot, setSnapshot] = useState<EvaTokenSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedWallet, setLoadedWallet] = useState<`0x${string}` | null | undefined>(undefined);

  const updateWallet = useCallback((address: `0x${string}` | null) => {
    setWalletAddress(address);
  }, []);

  useEffect(() => {
    let cancelled = false;
    readEvaTokenSnapshot(walletAddress)
      .then((nextSnapshot) => {
        if (!cancelled) {
          setSnapshot(nextSnapshot);
          setError(null);
          setLoadedWallet(walletAddress);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Avalanche readback is temporarily unavailable.");
          setLoadedWallet(walletAddress);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const loading = loadedWallet === undefined || loadedWallet !== walletAddress;
  const contractUrl = `${protocol.chain.explorerUrl}/address/${protocol.tokens.eva.address}`;

  return (
    <div className="eva-token-ledger">
      <DynamicWalletLoader onWallet={updateWallet} />

      <section className="eva-token-row" aria-labelledby="eva-token-receipt">
        <div className="eva-token-row-label">
          <span>01</span>
          <p id="eva-token-receipt">$EVA token receipt</p>
        </div>
        <dl className="eva-token-receipt" data-testid="eva-token-receipt">
          <div>
            <dt>Name</dt>
            <dd>{snapshot?.name ?? protocol.tokens.eva.name}</dd>
          </div>
          <div>
            <dt>Symbol</dt>
            <dd>{snapshot?.symbol ?? protocol.tokens.eva.symbol}</dd>
          </div>
          <div>
            <dt>Decimals</dt>
            <dd>{snapshot?.decimals ?? protocol.tokens.eva.decimals}</dd>
          </div>
          <div>
            <dt>Contract</dt>
            <dd>
              <a href={contractUrl} target="_blank" rel="noreferrer">
                {protocol.tokens.eva.address}
              </a>
            </dd>
          </div>
          <div>
            <dt>Current supply</dt>
            <dd>{snapshot ? `${formatEvaAmount(snapshot.totalSupply, snapshot.decimals, 0)} EVA` : loading ? "Reading chain…" : "Unavailable"}</dd>
          </div>
          <div>
            <dt>Network</dt>
            <dd>{protocol.chain.name}</dd>
          </div>
          <div>
            <dt>Read block</dt>
            <dd>{snapshot ? snapshot.blockNumber.toString() : loading ? "Pending" : "Unavailable"}</dd>
          </div>
        </dl>
      </section>

      <section className="eva-token-row" aria-labelledby="eva-wallet-balance">
        <div className="eva-token-row-label">
          <span>02</span>
          <p id="eva-wallet-balance">Wallet balance</p>
        </div>
        <div className="eva-token-wallet">
          {walletAddress ? (
            <>
              <p>Connected wallet</p>
              <strong data-testid="eva-wallet-balance">
                {snapshot?.walletBalance !== null && snapshot?.walletBalance !== undefined
                  ? `${formatEvaAmount(snapshot.walletBalance, snapshot.decimals)} EVA`
                  : loading
                    ? "Reading chain…"
                    : "Unavailable"}
              </strong>
              <span>{shortAddress(walletAddress)} · read-only holder state</span>
            </>
          ) : (
            <>
              <p>Connect to read your $EVA balance.</p>
              <DynamicAuthControl />
              {!dynamicEnvironmentId ? <span>Wallet connection is not configured in this environment.</span> : null}
            </>
          )}
          <div className="eva-protocol-holding">
            <span>Eva protocol wallet</span>
            <strong>
              {snapshot ? `${formatEvaAmount(snapshot.protocolBalance, snapshot.decimals)} EVA` : loading ? "Reading chain…" : "Unavailable"}
            </strong>
            <small>{shortAddress(protocol.agents.eva.wallet)}</small>
          </div>
          {error ? <p className="eva-token-error">{error}</p> : null}
        </div>
      </section>

      <section className="eva-token-row" aria-labelledby="eva-use-and-burn">
        <div className="eva-token-row-label">
          <span>03</span>
          <p id="eva-use-and-burn">Use &amp; burn</p>
        </div>
        <DynamicUsageLoader />
      </section>

      <section className="eva-token-row" aria-labelledby="eva-platform-relationship">
        <div className="eva-token-row-label">
          <span>04</span>
          <p id="eva-platform-relationship">Platform relationship</p>
        </div>
        <ol className="eva-token-sequence">
          <li><span>1</span><strong>Wallet</strong></li>
          <li><span>2</span><strong>$EVA balance</strong></li>
          <li><span>3</span><strong>Platform use</strong></li>
          <li><span>4</span><strong>Burn receipt</strong></li>
        </ol>
      </section>

      <section className="eva-token-row" aria-labelledby="eva-boundary-ledger">
        <div className="eva-token-row-label">
          <span>05</span>
          <p id="eva-boundary-ledger">Boundary ledger</p>
        </div>
        <div className="eva-token-boundaries">
          <p><strong>Live now</strong> Paid thesis publishing, paid revisions, paid agent proof bundles, usage receipts</p>
          <p><strong>Exact v1 uses</strong> Thesis 100,000 EVA · revision 25,000 EVA · agent bundle 10,000 EVA</p>
          <p><strong>Payment path</strong> Direct ERC-20 allowance; no Permit2 and no server spending authority</p>
          <p><strong>Not active</strong> Staking, balance-based access, yield, governance, trade execution</p>
        </div>
      </section>

      <div className="eva-token-followup">
        <p>$EVA balance never changes credibility or score; valuable public actions consume an exact usage receipt.</p>
        <Link href="/compose">Start a thesis →</Link>
      </div>
    </div>
  );
}
