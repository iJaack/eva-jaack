"use client";

import { useCallback, useEffect, useState } from "react";
import { encodeFunctionData, formatUnits, type Hash } from "viem";
import type { EvaUsageQuote } from "@/lib/api";
import {
  evaPublicClient,
  evaTokenUsageAbi,
  evaUsageBurnerAbi,
  readEvaUsageSnapshot,
} from "@/lib/eva-usage";
import { protocol } from "@/lib/protocol";
import { useSelfCustodyWallet } from "@/lib/self-custody-wallet";

type CheckoutState =
  | { phase: "idle"; message: null; hash: null }
  | { phase: "submitting" | "confirming"; message: string; hash: Hash | null }
  | { phase: "confirmed"; message: string; hash: Hash }
  | { phase: "error"; message: string; hash: Hash | null };

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (/rejected|denied/i.test(error.message)) return "The wallet request was rejected.";
    return error.message.split("\n")[0] ?? "The wallet transaction failed.";
  }
  return "The wallet transaction failed.";
}

export default function SelfCustodyEvaUsageCheckout({
  quote,
  txHash,
  onTxHash,
}: {
  quote: EvaUsageQuote;
  txHash: string;
  onTxHash: (value: string) => void;
}) {
  const { address, sendTransaction } = useSelfCustodyWallet();
  const amount = BigInt(quote.amountWei);
  const amountLabel = `${formatUnits(amount, protocol.tokens.eva.decimals)} EVA`;
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [state, setState] = useState<CheckoutState>({ phase: "idle", message: null, hash: null });
  const matchingWallet = Boolean(address && address.toLowerCase() === quote.account.toLowerCase());

  const refreshAllowance = useCallback(async () => {
    const snapshot = await readEvaUsageSnapshot(quote.account);
    setAllowance(snapshot.walletAllowance);
  }, [quote.account]);

  useEffect(() => {
    if (!matchingWallet) {
      setAllowance(null);
      return;
    }
    let cancelled = false;
    readEvaUsageSnapshot(quote.account)
      .then((snapshot) => {
        if (!cancelled) setAllowance(snapshot.walletAllowance);
      })
      .catch(() => {
        if (!cancelled) setAllowance(null);
      });
    return () => {
      cancelled = true;
    };
  }, [matchingWallet, quote.account]);

  function requireMatchingWallet() {
    if (!address) throw new Error("Connect the quoted self-custodial wallet first.");
    if (!matchingWallet) throw new Error("The connected wallet does not match this EVA usage quote.");
    if (
      quote.chainId !== protocol.chain.id ||
      quote.token.toLowerCase() !== protocol.tokens.eva.address.toLowerCase() ||
      quote.burner.toLowerCase() !== protocol.contracts.evaUsageBurner.toLowerCase() ||
      quote.burnSink.toLowerCase() !== "0x000000000000000000000000000000000000dead" ||
      quote.permit2 !== false
    ) {
      throw new Error("The EVA usage quote does not match the canonical protocol configuration.");
    }
  }

  async function approve() {
    try {
      requireMatchingWallet();
      setState({ phase: "submitting", message: `Approve exactly ${amountLabel} in your wallet.`, hash: null });
      const hash = await sendTransaction({
        to: protocol.tokens.eva.address as `0x${string}`,
        data: encodeFunctionData({
          abi: evaTokenUsageAbi,
          functionName: "approve",
          args: [protocol.contracts.evaUsageBurner as `0x${string}`, amount],
        }),
      });
      setState({ phase: "confirming", message: "Exact allowance submitted. Waiting for Avalanche.", hash });
      await evaPublicClient.waitForTransactionReceipt({ hash });
      await refreshAllowance();
      setState({ phase: "confirmed", message: `${amountLabel} approved for EvaUsageBurner.`, hash });
    } catch (error) {
      setState({ phase: "error", message: errorMessage(error), hash: null });
    }
  }

  async function retire() {
    try {
      requireMatchingWallet();
      setState({ phase: "submitting", message: `Confirm the irreversible ${amountLabel} usage.`, hash: null });
      const hash = await sendTransaction({
        to: protocol.contracts.evaUsageBurner as `0x${string}`,
        data: encodeFunctionData({
          abi: evaUsageBurnerAbi,
          functionName: "retireForUsage",
          args: [quote.usageKind, quote.referenceHash, amount],
        }),
      });
      setState({ phase: "confirming", message: "Usage submitted. Waiting for the exact burn receipt.", hash });
      await evaPublicClient.waitForTransactionReceipt({ hash });
      onTxHash(hash);
      setState({ phase: "confirmed", message: `${amountLabel} used. Eva will verify the receipt before release.`, hash });
    } catch (error) {
      setState({ phase: "error", message: errorMessage(error), hash: null });
    }
  }

  const busy = state.phase === "submitting" || state.phase === "confirming";
  const hasAllowance = allowance !== null && allowance >= amount;
  const explorerHash = state.hash ?? (/^0x[a-fA-F0-9]{64}$/.test(txHash) ? (txHash as Hash) : null);

  return (
    <div className="eva-quote-checkout" data-testid="eva-quote-checkout">
      <div className="eva-quote-heading">
        <div>
          <p className="eyebrow">$EVA / required proof receipt</p>
          <h3>{quote.label}</h3>
        </div>
        <strong>{amountLabel}</strong>
      </div>
      <p>
        Your own wallet signs a standard ERC-20 exact allowance and the immutable EvaUsageBurner
        call. Eva never creates, holds, or controls the wallet. No Permit2 and no server spending authority.
      </p>
      {!matchingWallet ? (
        <p className="eva-usage-state is-error" role="status">
          Connect {quote.account.slice(0, 6)}…{quote.account.slice(-4)} to continue.
        </p>
      ) : null}
      <div className="eva-quote-actions">
        {!hasAllowance ? (
          <button className="mobile-action" type="button" onClick={approve} disabled={busy || !matchingWallet}>
            Approve exactly {amountLabel}
          </button>
        ) : (
          <button className="mobile-action mobile-action-primary" type="button" onClick={retire} disabled={busy || !matchingWallet}>
            Use &amp; burn {amountLabel}
          </button>
        )}
        <span>{quote.referenceHash.slice(0, 10)}…{quote.referenceHash.slice(-8)}</span>
      </div>
      <label className="field-group">
        <span className="field-label">EVA usage receipt transaction hash</span>
        <input
          className="field-input"
          value={txHash}
          onChange={(event) => onTxHash(event.target.value)}
          placeholder="0x..."
        />
      </label>
      {state.message ? <p className={`eva-usage-state is-${state.phase}`} role="status">{state.message}</p> : null}
      {explorerHash ? (
        <a className="section-link" href={`${protocol.chain.explorerUrl}/tx/${explorerHash}`} target="_blank" rel="noreferrer">
          Inspect EVA receipt ↗
        </a>
      ) : null}
    </div>
  );
}
