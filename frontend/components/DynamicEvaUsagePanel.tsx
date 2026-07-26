"use client";

import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { keccak256, parseUnits, toBytes, type Hash } from "viem";
import { avalanche } from "viem/chains";
import {
  evaPublicClient,
  evaTokenUsageAbi,
  evaUsageBurnerAbi,
  readEvaUsageSnapshot,
  type EvaUsageSnapshot,
} from "@/lib/eva-usage";
import { formatEvaAmount } from "@/lib/eva-token";
import { protocol } from "@/lib/protocol";

const usageKinds = [
  { value: 0, label: "Thesis proof" },
  { value: 1, label: "Forecast receipt" },
  { value: 2, label: "Agent verification" },
] as const;

type TransactionState =
  | { phase: "idle"; hash: null; message: null }
  | { phase: "submitting" | "confirming"; hash: Hash | null; message: string }
  | { phase: "confirmed"; hash: Hash; message: string }
  | { phase: "error"; hash: Hash | null; message: string };

function transactionError(error: unknown): string {
  if (error instanceof Error) {
    if (/rejected|denied/i.test(error.message)) return "The wallet request was rejected.";
    return error.message.split("\n")[0] ?? "The wallet transaction failed.";
  }
  return "The wallet transaction failed.";
}

export default function DynamicEvaUsagePanel() {
  const { primaryWallet } = useDynamicContext();
  const walletAddress =
    primaryWallet?.address && /^0x[0-9a-fA-F]{40}$/.test(primaryWallet.address)
      ? (primaryWallet.address as `0x${string}`)
      : null;
  const [snapshot, setSnapshot] = useState<EvaUsageSnapshot | null>(null);
  const [amount, setAmount] = useState("10");
  const [usageKind, setUsageKind] = useState(0);
  const [reference, setReference] = useState("");
  const [state, setState] = useState<TransactionState>({ phase: "idle", hash: null, message: null });

  const amountWei = useMemo(() => {
    try {
      return parseUnits(amount || "0", protocol.tokens.eva.decimals);
    } catch {
      return 0n;
    }
  }, [amount]);

  const refresh = useCallback(async () => {
    const nextSnapshot = await readEvaUsageSnapshot(walletAddress);
    setSnapshot(nextSnapshot);
  }, [walletAddress]);

  useEffect(() => {
    let cancelled = false;
    readEvaUsageSnapshot(walletAddress)
      .then((nextSnapshot) => {
        if (!cancelled) setSnapshot(nextSnapshot);
      })
      .catch(() => {
        if (!cancelled) setSnapshot(null);
      });
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const hasAllowance =
    snapshot?.walletAllowance !== null &&
    snapshot?.walletAllowance !== undefined &&
    snapshot.walletAllowance >= amountWei;
  const amountIsValid =
    amountWei >= (snapshot?.minimumRetirement ?? 10n ** BigInt(protocol.tokens.eva.decimals));
  const referenceIsValid = reference.trim().length >= 3;
  const busy = state.phase === "submitting" || state.phase === "confirming";
  const explorerHref = state.hash ? `${protocol.chain.explorerUrl}/tx/${state.hash}` : null;

  async function walletClients() {
    if (!primaryWallet || !walletAddress || !isEthereumWallet(primaryWallet)) {
      throw new Error("Connect an EVM wallet with Dynamic first.");
    }
    const walletClient = await primaryWallet.getWalletClient();
    if (walletClient.chain?.id !== avalanche.id) {
      await walletClient.switchChain({ id: avalanche.id });
    }
    return { walletClient, account: walletAddress };
  }

  async function approve() {
    try {
      setState({ phase: "submitting", hash: null, message: "Confirm the exact $EVA allowance in your wallet." });
      const { walletClient, account } = await walletClients();
      const simulation = await evaPublicClient.simulateContract({
        account,
        address: protocol.tokens.eva.address as `0x${string}`,
        abi: evaTokenUsageAbi,
        functionName: "approve",
        args: [protocol.contracts.evaUsageBurner as `0x${string}`, amountWei],
      });
      const hash = await walletClient.writeContract(simulation.request);
      setState({ phase: "confirming", hash, message: "Allowance submitted. Waiting for Avalanche." });
      await evaPublicClient.waitForTransactionReceipt({ hash });
      await refresh();
      setState({ phase: "confirmed", hash, message: `Approved exactly ${amount} EVA for one use.` });
    } catch (error) {
      setState({ phase: "error", hash: null, message: transactionError(error) });
    }
  }

  async function retire() {
    try {
      setState({ phase: "submitting", hash: null, message: "Confirm the irreversible $EVA retirement in your wallet." });
      const { walletClient, account } = await walletClients();
      const referenceHash = keccak256(toBytes(reference.trim()));
      const simulation = await evaPublicClient.simulateContract({
        account,
        address: protocol.contracts.evaUsageBurner as `0x${string}`,
        abi: evaUsageBurnerAbi,
        functionName: "retireForUsage",
        args: [usageKind, referenceHash, amountWei],
      });
      const hash = await walletClient.writeContract(simulation.request);
      setState({ phase: "confirming", hash, message: "Usage submitted. Waiting for the burn receipt." });
      await evaPublicClient.waitForTransactionReceipt({ hash });
      await refresh();
      setReference("");
      setState({ phase: "confirmed", hash, message: `${amount} EVA used and retired to 0x…dEaD.` });
    } catch (error) {
      setState({ phase: "error", hash: null, message: transactionError(error) });
    }
  }

  return (
    <div className="eva-usage-panel" data-testid="eva-usage-panel">
      <div className="eva-usage-summary">
        <p>Dead-address burn</p>
        <strong>
          {snapshot ? `${formatEvaAmount(snapshot.totalRetired, protocol.tokens.eva.decimals)} EVA` : "Reading chain…"}
        </strong>
        <span>retired through Eva · {snapshot?.receiptCount.toString() ?? "—"} receipts</span>
      </div>

      <div className="eva-usage-form">
        <label>
          Platform use
          <select value={usageKind} onChange={(event) => setUsageKind(Number(event.target.value))}>
            {usageKinds.map((usage) => (
              <option key={usage.value} value={usage.value}>{usage.label}</option>
            ))}
          </select>
        </label>
        <label>
          EVA to use
          <input
            inputMode="decimal"
            min="1"
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-describedby="eva-usage-minimum"
          />
        </label>
        <label className="eva-usage-reference">
          Proof reference
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Thesis ID, forecast, or verification"
          />
        </label>
        <p id="eva-usage-minimum">
          Minimum 1 EVA. Each wallet, use, and reference can produce one receipt.
        </p>

        {walletAddress ? (
          <div className="eva-usage-actions">
            {!hasAllowance ? (
              <button type="button" onClick={approve} disabled={!amountIsValid || busy}>
                Approve {amount || "0"} EVA
              </button>
            ) : (
              <button
                type="button"
                onClick={retire}
                disabled={!amountIsValid || !referenceIsValid || busy}
              >
                Use &amp; burn {amount || "0"} EVA
              </button>
            )}
            <span>{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)} · Avalanche</span>
          </div>
        ) : (
          <p className="eva-usage-connect">Connect a wallet above to approve an exact amount and create a receipt.</p>
        )}

        {state.message ? (
          <p className={`eva-usage-state is-${state.phase}`} role="status">
            {state.message} {explorerHref ? <a href={explorerHref} target="_blank" rel="noreferrer">Receipt ↗</a> : null}
          </p>
        ) : null}
      </div>

      <div className="eva-usage-disclosure">
        <p>
          Used tokens move irreversibly to <code>0x0000…dEaD</code>, reducing circulating supply.
          The legacy token&apos;s reported total supply does not decrease.
        </p>
        <p>
          Platform usage can create demand and supply pressure. It cannot guarantee that $EVA&apos;s market price rises.
        </p>
      </div>
    </div>
  );
}
