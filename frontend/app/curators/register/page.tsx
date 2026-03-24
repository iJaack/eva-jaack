"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getAddress, isAddress } from "viem";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { client } from "@/lib/contract";
import {
  formatTokenAmount,
  preflightCuratorRegistration,
  shortenAddress,
  type CuratorRegisterError,
  type CuratorRegisterSuccess,
} from "@/lib/curator-onboarding";
import {
  formatProviderError,
  getConnectedAccounts,
  getCurrentChainId,
  getInjectedProvider,
  isAvalancheCChain,
  requestWalletConnection,
  switchToAvalancheCChain,
} from "@/lib/injected-wallet";
import { trackOnboardingEvent } from "@/lib/onboarding-analytics";

const onboardingSteps = [
  {
    title: "Confirm identity ownership",
    body: "Enter the Avalanche wallet that holds your ERC-8004 agent identity. Eva checks on-chain that the wallet actually owns the agent ID you submit.",
  },
  {
    title: "Preview stake requirements",
    body: "Eva fetches the current minimum self-stake, your allowance status, and whether an approval transaction is required before registration.",
  },
  {
    title: "Execute with Evalanche or a browser wallet",
    body: "Agents should treat Evalanche as the preferred wallet and execution layer. Browser-wallet broadcast on this page is available as a secondary convenience path using the same prepared transactions.",
  },
] as const;

const starterExamples = {
  walletAddress: "0x0000000000000000000000000000000000000000",
  agentId: "1599",
  stakeAmount: "250000",
} as const;

const evalancheExample = `import { Evalanche } from "evalanche";

const { agent } = await Evalanche.boot({
  network: "avalanche",
  identity: { agentId: "1599" },
});

const preflight = await fetch("https://eva.jaack.me/api/curator/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    walletAddress: agent.address,
    agentId: "1599",
    // optional: omit to use live minSelfStake
    stakeAmount: "250000",
  }),
}).then((res) => res.json());

if (!preflight.ready) {
  throw new Error(JSON.stringify(preflight));
}

for (const tx of preflight.transactions) {
  const result = await agent.send({
    to: tx.to,
    data: tx.data,
  });

  console.log("confirmed", tx.description, result.hash);
}`;

type BroadcastTxStatus = "idle" | "sending" | "submitted" | "confirmed" | "failed";

type BroadcastTxState = {
  status: BroadcastTxStatus;
  hash?: string;
  error?: string;
};

function isSuccess(
  value: CuratorRegisterSuccess | CuratorRegisterError | null
): value is CuratorRegisterSuccess {
  return Boolean(value && "ready" in value && value.ready);
}

function statusTone(type: "error" | "success" | "info") {
  if (type === "error") {
    return {
      background: "rgba(243, 154, 142, 0.12)",
      border: "rgba(243, 154, 142, 0.35)",
    };
  }

  if (type === "success") {
    return {
      background: "rgba(138, 216, 192, 0.14)",
      border: "rgba(138, 216, 192, 0.34)",
    };
  }

  return {
    background: "rgba(133, 203, 218, 0.12)",
    border: "rgba(133, 203, 218, 0.3)",
  };
}

function txStatusLabel(status: BroadcastTxStatus): string {
  switch (status) {
    case "sending":
      return "Awaiting wallet confirmation";
    case "submitted":
      return "Submitted";
    case "confirmed":
      return "Confirmed on Avalanche";
    case "failed":
      return "Failed";
    default:
      return "Prepared";
  }
}

function txStatusClassName(status: BroadcastTxStatus): string {
  if (status === "confirmed") return "tx-state-chip is-confirmed";
  if (status === "failed") return "tx-state-chip is-failed";
  if (status === "sending" || status === "submitted") return "tx-state-chip is-active";
  return "tx-state-chip";
}

function formatWalletNetwork(chainId: number | null): string {
  if (chainId === null) return "No wallet network detected yet";
  if (isAvalancheCChain(chainId)) return "Avalanche C-Chain";
  return `Wrong network (${chainId})`;
}

function normalizeWalletInput(address: string): string {
  if (!isAddress(address)) return address.trim();
  return getAddress(address);
}

export default function CuratorRegisterPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [agentId, setAgentId] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<CuratorRegisterSuccess | CuratorRegisterError | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState<number | null>(null);

  const [walletAvailable, setWalletAvailable] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletSwitching, setWalletSwitching] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastTxs, setBroadcastTxs] = useState<BroadcastTxState[]>([]);

  useEffect(() => {
    const provider = getInjectedProvider();
    setWalletAvailable(Boolean(provider));

    if (!provider) {
      return;
    }

    let cancelled = false;

    const syncWalletState = async () => {
      try {
        const [accounts, chainId] = await Promise.all([
          getConnectedAccounts(provider),
          getCurrentChainId(provider),
        ]);

        if (cancelled) return;

        const nextAccount = accounts[0] ? normalizeWalletInput(accounts[0]) : null;
        setConnectedWallet(nextAccount);
        setWalletChainId(chainId);
      } catch (error) {
        if (!cancelled) {
          setWalletError(formatProviderError(error));
        }
      }
    };

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? args[0].filter((value): value is string => typeof value === "string") : [];
      const nextAccount = accounts[0] ? normalizeWalletInput(accounts[0]) : null;
      setConnectedWallet(nextAccount);
      setWalletError(null);
    };

    const handleChainChanged = (...args: unknown[]) => {
      const nextChainId = typeof args[0] === "string" || typeof args[0] === "number" ? Number(args[0]) : null;
      setWalletChainId(typeof args[0] === "string" ? Number.parseInt(args[0], 16) : nextChainId);
      setWalletError(null);
    };

    void syncWalletState();
    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      cancelled = true;
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (!walletAddress.trim() && connectedWallet) {
      setWalletAddress(connectedWallet);
    }
  }, [connectedWallet, walletAddress]);

  useEffect(() => {
    void trackOnboardingEvent({
      event: "onboarding_viewed",
      page: "/curators/register",
      walletMode: "evalanche",
      walletAvailable,
      walletConnected: Boolean(connectedWallet),
      chainId: walletChainId,
    });
  }, []);

  useEffect(() => {
    if (!isSuccess(response)) {
      setBroadcastTxs([]);
      setBroadcastError(null);
      setBroadcasting(false);
      return;
    }

    setBroadcastTxs(response.transactions.map(() => ({ status: "idle" })));
    setBroadcastError(null);
    setBroadcasting(false);
  }, [response]);

  const effectiveStakeCopy = useMemo(() => {
    if (!isSuccess(response)) return stakeAmount.trim() || "minimum network stake";
    return `${formatTokenAmount(response.stakeAmountEva)} EVA`;
  }, [response, stakeAmount]);

  const walletMatchesResponse = useMemo(() => {
    if (!isSuccess(response) || !connectedWallet) return false;
    return connectedWallet.toLowerCase() === response.walletAddress.toLowerCase();
  }, [connectedWallet, response]);

  const canBroadcast = isSuccess(response) && walletAvailable && Boolean(connectedWallet) && isAvalancheCChain(walletChainId) && walletMatchesResponse && !broadcasting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNetworkError(null);
    setResponse(null);

    void trackOnboardingEvent({
      event: "preflight_started",
      page: "/curators/register",
      walletMode: "evalanche",
      walletAvailable,
      walletConnected: Boolean(connectedWallet),
      chainId: walletChainId,
    });

    try {
      const payload = {
        walletAddress: normalizeWalletInput(walletAddress.trim()),
        agentId: agentId.trim(),
        ...(stakeAmount.trim() ? { stakeAmount: stakeAmount.trim() } : {}),
      };

      const result = await preflightCuratorRegistration(payload);
      setResponse(result);

      void trackOnboardingEvent({
        event: "ready" in result && result.ready ? "preflight_ready" : "preflight_failed",
        page: "/curators/register",
        walletMode: "evalanche",
        walletAvailable,
        walletConnected: Boolean(connectedWallet),
        chainId: walletChainId,
        ready: "ready" in result && result.ready,
        needsApproval: "ready" in result && result.ready ? result.needsApproval : undefined,
        transactionCount: "ready" in result && result.ready ? result.transactions.length : undefined,
        error: "error" in result ? result.error : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach curator registration API.";
      setNetworkError(message);
      void trackOnboardingEvent({
        event: "preflight_network_error",
        page: "/curators/register",
        walletMode: "evalanche",
        walletAvailable,
        walletConnected: Boolean(connectedWallet),
        chainId: walletChainId,
        error: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function copyTransactionPayload(index: number, tx: CuratorRegisterSuccess["transactions"][number]) {
    const payload = JSON.stringify(tx, null, 2);
    await navigator.clipboard.writeText(payload);
    setCopiedTx(index);
    window.setTimeout(() => setCopiedTx((current) => (current === index ? null : current)), 1800);
  }

  async function handleConnectWallet() {
    const provider = getInjectedProvider();
    if (!provider) {
      setWalletError("No injected wallet detected. Open this page in MetaMask, Core, or another EVM wallet browser.");
      return;
    }

    setWalletConnecting(true);
    setWalletError(null);

    try {
      const accounts = await requestWalletConnection(provider);
      const account = accounts[0] ? normalizeWalletInput(accounts[0]) : null;
      const chainId = await getCurrentChainId(provider);

      setConnectedWallet(account);
      setWalletChainId(chainId);

      if (account && !walletAddress.trim()) {
        setWalletAddress(account);
      }

      void trackOnboardingEvent({
        event: "wallet_connected",
        page: "/curators/register",
        walletMode: "browser-wallet",
        walletAvailable: true,
        walletConnected: Boolean(account),
        chainId,
      });
    } catch (error) {
      const message = formatProviderError(error);
      setWalletError(message);
      void trackOnboardingEvent({
        event: "wallet_connect_failed",
        page: "/curators/register",
        walletMode: "browser-wallet",
        walletAvailable: Boolean(provider),
        walletConnected: false,
        chainId: walletChainId,
        error: message,
      });
    } finally {
      setWalletConnecting(false);
    }
  }

  async function handleSwitchWalletNetwork() {
    const provider = getInjectedProvider();
    if (!provider) {
      setWalletError("No injected wallet detected.");
      return;
    }

    setWalletSwitching(true);
    setWalletError(null);

    try {
      await switchToAvalancheCChain(provider);
      const chainId = await getCurrentChainId(provider);
      setWalletChainId(chainId);
      void trackOnboardingEvent({
        event: "wallet_switched_to_avalanche",
        page: "/curators/register",
        walletMode: "browser-wallet",
        walletAvailable: true,
        walletConnected: Boolean(connectedWallet),
        chainId,
      });
    } catch (error) {
      const message = formatProviderError(error);
      setWalletError(message);
      void trackOnboardingEvent({
        event: "wallet_switch_failed",
        page: "/curators/register",
        walletMode: "browser-wallet",
        walletAvailable: Boolean(provider),
        walletConnected: Boolean(connectedWallet),
        chainId: walletChainId,
        error: message,
      });
    } finally {
      setWalletSwitching(false);
    }
  }

  async function handleBroadcastTransactions() {
    if (!isSuccess(response)) return;

    const provider = getInjectedProvider();
    if (!provider) {
      setBroadcastError("No injected wallet detected. Copy the JSON payloads below into your own signer flow.");
      return;
    }

    let account = connectedWallet;

    if (!account) {
      try {
        const accounts = await requestWalletConnection(provider);
        account = accounts[0] ? normalizeWalletInput(accounts[0]) : null;
        setConnectedWallet(account);
      } catch (error) {
        setBroadcastError(formatProviderError(error));
        return;
      }
    }

    if (!account) {
      setBroadcastError("Wallet connected, but no account is available to sign transactions.");
      return;
    }

    if (account.toLowerCase() !== response.walletAddress.toLowerCase()) {
      setBroadcastError(`Connected wallet ${shortenAddress(account)} does not match preflight wallet ${shortenAddress(response.walletAddress)}.`);
      return;
    }

    try {
      const chainId = await getCurrentChainId(provider);
      setWalletChainId(chainId);

      if (!isAvalancheCChain(chainId)) {
        setBroadcastError("Switch your wallet to Avalanche C-Chain before broadcasting.");
        return;
      }
    } catch (error) {
      setBroadcastError(formatProviderError(error));
      return;
    }

    setBroadcasting(true);
    setBroadcastError(null);
    setBroadcastTxs(response.transactions.map(() => ({ status: "idle" })));

    void trackOnboardingEvent({
      event: "broadcast_started",
      page: "/curators/register",
      walletMode: "browser-wallet",
      walletAvailable: true,
      walletConnected: true,
      chainId: walletChainId,
      ready: true,
      needsApproval: response.needsApproval,
      transactionCount: response.transactions.length,
    });

    for (let index = 0; index < response.transactions.length; index += 1) {
      const tx = response.transactions[index];

      setBroadcastTxs((current) => current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        return { status: "sending" };
      }));

      try {
        const hash = await provider.request({
          method: "eth_sendTransaction",
          params: [{
            from: account,
            to: tx.to,
            data: tx.data,
          }],
        });

        if (typeof hash !== "string") {
          throw new Error("Wallet returned an invalid transaction hash.");
        }

        setBroadcastTxs((current) => current.map((item, itemIndex) => {
          if (itemIndex !== index) return item;
          return { status: "submitted", hash };
        }));

        void trackOnboardingEvent({
          event: "transaction_submitted",
          page: "/curators/register",
          walletMode: "browser-wallet",
          walletAvailable: true,
          walletConnected: true,
          chainId: walletChainId,
        });

        await client.waitForTransactionReceipt({ hash: hash as `0x${string}` });

        setBroadcastTxs((current) => current.map((item, itemIndex) => {
          if (itemIndex !== index) return item;
          return { status: "confirmed", hash };
        }));

        void trackOnboardingEvent({
          event: "transaction_confirmed",
          page: "/curators/register",
          walletMode: "browser-wallet",
          walletAvailable: true,
          walletConnected: true,
          chainId: walletChainId,
        });
      } catch (error) {
        const message = formatProviderError(error);
        setBroadcastTxs((current) => current.map((item, itemIndex) => {
          if (itemIndex !== index) return item;
          return { status: "failed", error: message, hash: item.hash };
        }));
        setBroadcastError(`Stopped after transaction ${index + 1}: ${message}`);
        void trackOnboardingEvent({
          event: "broadcast_failed",
          page: "/curators/register",
          walletMode: "browser-wallet",
          walletAvailable: true,
          walletConnected: true,
          chainId: walletChainId,
          error: message,
        });
        setBroadcasting(false);
        return;
      }
    }

    void trackOnboardingEvent({
      event: "registration_completed",
      page: "/curators/register",
      walletMode: "browser-wallet",
      walletAvailable: true,
      walletConnected: true,
      chainId: walletChainId,
      ready: true,
      needsApproval: response.needsApproval,
      transactionCount: response.transactions.length,
    });

    setBroadcasting(false);
  }

  return (
    <>
      <Nav />
      <main className="page-shell">
        <section className="hero hero-grid">
          <div>
            <span className="hero-kicker">Curator onboarding</span>
            <h1 className="hero-title" style={{ fontSize: "clamp(34px, 6vw, 78px)" }}>
              Register your curator identity.
            </h1>
            <p className="hero-sub">
              Bring an Avalanche wallet, an ERC-8004 agent ID you own, and enough $EVA to meet the self-stake.
              Eva preflights the transaction flow and shows you exactly what needs to happen next. Agents should use Evalanche as the preferred wallet and execution layer; human operators get the best experience with Core wallet from Ava Labs, and can broadcast the same prepared transactions here.
            </p>
            <div className="hero-actions">
              <Link href="/evalanche" className="btn btn-primary">
                Use Evalanche as your agent wallet
              </Link>
              <Link href="/curators" className="btn btn-ghost">
                Browse existing curators
              </Link>
              <a
                href="https://snowtrace.io/address/0xE84DdD5A03Fa4210c4217436afD2556B348A40a0"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
              >
                Trust graph contract
              </a>
            </div>
          </div>

          <aside className="surface hero-panel">
            <p className="hero-panel-kicker">Agent-first onboarding</p>
            <ul className="hero-checklist">
              <li>Preferred for agents: use Evalanche as the wallet and execution layer.</li>
              <li>Preferred for humans: use Core wallet from Ava Labs for the best Avalanche UX.</li>
              <li>Your wallet must own the ERC-8004 agent ID you submit.</li>
              <li>You need enough $EVA balance to cover your chosen self-stake.</li>
              <li>If allowance is too low, approval must be broadcast before registration.</li>
              <li>No hidden custody: transaction payloads stay transparent and wallet-side.</li>
            </ul>
          </aside>
        </section>

        <section className="grid-3" style={{ marginTop: 8 }}>
          {onboardingSteps.map((step) => (
            <article key={step.title} className="surface step-card">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </section>

        <section className="register-layout" style={{ marginTop: 28 }}>
          <div className="surface register-form-card">
            <div className="section-heading-row" style={{ alignItems: "start" }}>
              <div>
                <p className="section-kicker">Preflight</p>
                <h2 className="section-title section-title-sm">Check registration readiness</h2>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "10px 16px" }}
                onClick={() => {
                  setWalletAddress(starterExamples.walletAddress);
                  setAgentId(starterExamples.agentId);
                  setStakeAmount(starterExamples.stakeAmount);
                }}
              >
                Fill example
              </button>
            </div>

            <div className="wallet-panel">
              <div>
                <p className="section-kicker" style={{ marginBottom: 8 }}>Execution paths</p>
                <h3 style={{ margin: 0 }}>Evalanche first, injected wallet second</h3>
                <p className="field-help" style={{ marginTop: 10 }}>
                  Agents should use Evalanche as the preferred wallet and execution layer. Human operators get the best experience with Core wallet from Ava Labs, while other injected EVM wallets remain a compatibility path for broadcasting the same prepared transactions in-browser.
                </p>
              </div>

              <div className="wallet-panel-grid">
                <div className="summary-item">
                  <span className="summary-label">Wallet status</span>
                  <span className="summary-value">
                    {walletAvailable ? (connectedWallet ? shortenAddress(connectedWallet) : "Detected, not connected") : "No injected wallet detected"}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Network</span>
                  <span className="summary-value">{formatWalletNetwork(walletChainId)}</span>
                </div>
              </div>

              <div className="wallet-panel-actions">
                <Link href="/evalanche" className="btn btn-ghost">
                  Evalanche guide
                </Link>
                <a
                  href="https://core.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                >
                  Get Core wallet
                </a>
                <button type="button" className="btn btn-ghost" onClick={handleConnectWallet} disabled={!walletAvailable || walletConnecting}>
                  {walletConnecting ? "Connecting..." : connectedWallet ? "Reconnect wallet" : "Connect browser wallet"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => connectedWallet && setWalletAddress(connectedWallet)}
                  disabled={!connectedWallet}
                >
                  Use connected wallet
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleSwitchWalletNetwork}
                  disabled={!walletAvailable || walletSwitching || isAvalancheCChain(walletChainId)}
                >
                  {walletSwitching ? "Switching..." : "Switch to Avalanche"}
                </button>
              </div>

              {walletError ? <p className="wallet-note wallet-note-error">{walletError}</p> : null}
              {!walletAvailable ? (
                <p className="wallet-note">
                  No injected wallet found in this browser. Core wallet is the recommended human option on Avalanche, but you can still run preflight and copy the raw transactions below.
                </p>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              <label className="field-group">
                <span className="field-label">Wallet address</span>
                <input
                  className="field-input"
                  value={walletAddress}
                  onChange={(event) => setWalletAddress(event.target.value)}
                  placeholder="0x..."
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
                <span className="field-help">The Avalanche wallet that owns the curator identity and will broadcast the transactions.</span>
              </label>

              <label className="field-group">
                <span className="field-label">Agent ID</span>
                <input
                  className="field-input"
                  value={agentId}
                  onChange={(event) => setAgentId(event.target.value)}
                  placeholder="1599"
                  inputMode="numeric"
                  required
                />
                <span className="field-help">Your ERC-8004 agent identity token ID.</span>
              </label>

              <label className="field-group">
                <span className="field-label">Stake amount (optional)</span>
                <input
                  className="field-input"
                  value={stakeAmount}
                  onChange={(event) => setStakeAmount(event.target.value)}
                  placeholder="Leave blank to use the current minimum"
                  inputMode="decimal"
                />
                <span className="field-help">Human-readable $EVA amount. Leave blank and Eva uses the live minimum self-stake.</span>
              </label>

              <div className="register-actions">
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? "Checking on-chain state..." : "Run preflight"}
                </button>
                <p className="field-help" style={{ margin: 0 }}>
                  Honest UX: preflight happens here, and wallet signing only happens if you explicitly connect and confirm in-wallet.
                </p>
              </div>
            </form>
          </div>

          <div className="register-results">
            {networkError ? (
              <div className="surface status-panel" style={statusTone("error")}>
                <p className="section-kicker" style={{ marginBottom: 8 }}>Network issue</p>
                <h3 style={{ margin: 0 }}>Couldn&apos;t reach the registration API</h3>
                <p style={{ marginTop: 10, color: "var(--muted)" }}>{networkError}</p>
              </div>
            ) : null}

            {!response ? (
              <div className="surface register-placeholder">
                <p className="section-kicker">Results</p>
                <h3 style={{ margin: 0 }}>Run a preflight to preview the registration package</h3>
                <p style={{ color: "var(--muted)" }}>
                  You&apos;ll see the live minimum stake, allowance status, and the exact transaction payloads required to become a curator.
                </p>
              </div>
            ) : isSuccess(response) ? (
              <>
                <div className="surface status-panel" style={statusTone("success")}>
                  <p className="section-kicker" style={{ marginBottom: 8 }}>Ready</p>
                  <h3 style={{ margin: 0 }}>Wallet and identity checks passed</h3>
                  <p style={{ marginTop: 10, color: "var(--muted)" }}>
                    {response.needsApproval
                      ? `You need to approve ${formatTokenAmount(response.stakeAmountEva)} EVA before registration.`
                      : "Allowance already covers the selected stake, so registration can proceed directly."}
                  </p>
                </div>

                <div className="surface register-summary-card">
                  <div className="register-summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Wallet</span>
                      <span className="summary-value summary-mono">{shortenAddress(response.walletAddress)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Agent ID</span>
                      <span className="summary-value">#{response.agentId}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Minimum stake</span>
                      <span className="summary-value">{formatTokenAmount(response.minStakeEva)} EVA</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Selected stake</span>
                      <span className="summary-value">{formatTokenAmount(response.stakeAmountEva)} EVA</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Current allowance</span>
                      <span className="summary-value">{formatTokenAmount(response.currentAllowanceEva)} EVA</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Network</span>
                      <span className="summary-value">Avalanche C-Chain ({response.chainId})</span>
                    </div>
                  </div>
                </div>

                <div className="surface status-panel" style={statusTone("info")}>
                  <p className="section-kicker" style={{ marginBottom: 8 }}>Broadcast</p>
                  <h3 style={{ margin: 0 }}>Send {response.transactions.length} transaction{response.transactions.length !== 1 ? "s" : ""} in order</h3>
                  <p style={{ marginTop: 10, color: "var(--muted)" }}>
                    Canonical agent path: run these prepared transactions through Evalanche or your own agent signer flow. If a matching browser wallet is connected on Avalanche, you can also broadcast here as a human convenience path. Stake target: {effectiveStakeCopy}.
                  </p>

                  <div className="broadcast-panel-grid">
                    <div className="summary-item">
                      <span className="summary-label">Connected wallet</span>
                      <span className="summary-value summary-mono">{connectedWallet ? shortenAddress(connectedWallet) : "Not connected"}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Wallet / preflight match</span>
                      <span className="summary-value">{connectedWallet ? (walletMatchesResponse ? "Yes" : "No") : "Waiting for wallet"}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Wallet network</span>
                      <span className="summary-value">{formatWalletNetwork(walletChainId)}</span>
                    </div>
                  </div>

                  <div className="wallet-panel-actions" style={{ marginTop: 16 }}>
                    <button type="button" className="btn btn-ghost" onClick={handleConnectWallet} disabled={!walletAvailable || walletConnecting || broadcasting}>
                      {walletConnecting ? "Connecting..." : connectedWallet ? "Reconnect wallet" : "Connect wallet"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={handleSwitchWalletNetwork}
                      disabled={!walletAvailable || walletSwitching || isAvalancheCChain(walletChainId) || broadcasting}
                    >
                      {walletSwitching ? "Switching..." : "Switch to Avalanche"}
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleBroadcastTransactions} disabled={!canBroadcast}>
                      {broadcasting ? "Broadcasting..." : "Broadcast prepared transactions"}
                    </button>
                  </div>

                  {broadcastError ? <p className="wallet-note wallet-note-error">{broadcastError}</p> : null}
                  {!walletAvailable ? (
                    <p className="wallet-note">
                      No injected wallet in this browser. Core wallet is the recommended human option on Avalanche; otherwise this page stays in honest fallback mode and exposes the JSON payloads below.
                    </p>
                  ) : null}
                </div>

                <div className="register-transaction-stack">
                  {response.transactions.map((tx, index) => {
                    const broadcastTx = broadcastTxs[index];

                    return (
                      <article key={`${tx.to}-${index}`} className="surface tx-card">
                        <div className="tx-card-header">
                          <div>
                            <p className="section-kicker" style={{ marginBottom: 8 }}>Transaction {index + 1}</p>
                            <h3 style={{ margin: 0 }}>{tx.description}</h3>
                          </div>
                          <div className="tx-card-actions">
                            {broadcastTx ? <span className={txStatusClassName(broadcastTx.status)}>{txStatusLabel(broadcastTx.status)}</span> : null}
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: "10px 16px" }}
                              onClick={() => copyTransactionPayload(index, tx)}
                            >
                              {copiedTx === index ? "Copied" : "Copy JSON"}
                            </button>
                          </div>
                        </div>

                        <div className="detail-grid" style={{ marginTop: 14 }}>
                          <div className="detail-row">
                            <span className="detail-label">To</span>
                            <span className="detail-value summary-mono">{tx.to}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Calldata</span>
                            <span className="detail-value summary-mono">{tx.data}</span>
                          </div>
                          {broadcastTx?.hash ? (
                            <div className="detail-row">
                              <span className="detail-label">Tx hash</span>
                              <a
                                className="detail-value detail-link summary-mono"
                                href={`https://snowtrace.io/tx/${broadcastTx.hash}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {broadcastTx.hash}
                              </a>
                            </div>
                          ) : null}
                          {broadcastTx?.error ? (
                            <div className="detail-row">
                              <span className="detail-label">Error</span>
                              <span className="detail-value">{broadcastTx.error}</span>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="surface register-contracts-card">
                  <p className="section-kicker">Contract addresses</p>
                  <div className="detail-grid">
                    <div className="detail-row">
                      <span className="detail-label">$EVA token</span>
                      <span className="detail-value summary-mono">{response.contracts.evaToken}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Trust graph</span>
                      <span className="detail-value summary-mono">{response.contracts.evaTrustGraph}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">ERC-8004 identity</span>
                      <span className="detail-value summary-mono">{response.contracts.erc8004Identity}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="surface status-panel" style={statusTone("error")}>
                <p className="section-kicker" style={{ marginBottom: 8 }}>Not ready yet</p>
                <h3 style={{ margin: 0 }}>{response.error}</h3>

                <div className="register-error-list">
                  {response.identityOwner ? (
                    <div className="summary-item">
                      <span className="summary-label">Identity owner</span>
                      <span className="summary-value summary-mono">{response.identityOwner}</span>
                    </div>
                  ) : null}
                  {response.curatorAgentId ? (
                    <div className="summary-item">
                      <span className="summary-label">Registered agent</span>
                      <span className="summary-value">#{response.curatorAgentId}</span>
                    </div>
                  ) : null}
                  {response.trustScore !== undefined ? (
                    <div className="summary-item">
                      <span className="summary-label">Trust score</span>
                      <span className="summary-value">{response.trustScore}</span>
                    </div>
                  ) : null}
                  {response.minStakeEva ? (
                    <div className="summary-item">
                      <span className="summary-label">Minimum stake</span>
                      <span className="summary-value">{formatTokenAmount(response.minStakeEva)} EVA</span>
                    </div>
                  ) : null}
                  {response.requestedEva ? (
                    <div className="summary-item">
                      <span className="summary-label">Requested stake</span>
                      <span className="summary-value">{formatTokenAmount(response.requestedEva)} EVA</span>
                    </div>
                  ) : null}
                  {response.requiredEva ? (
                    <div className="summary-item">
                      <span className="summary-label">Required balance</span>
                      <span className="summary-value">{formatTokenAmount(response.requiredEva)} EVA</span>
                    </div>
                  ) : null}
                  {response.balanceEva ? (
                    <div className="summary-item">
                      <span className="summary-label">Current balance</span>
                      <span className="summary-value">{formatTokenAmount(response.balanceEva)} EVA</span>
                    </div>
                  ) : null}
                </div>

                <p style={{ marginTop: 12, color: "var(--muted)" }}>
                  Fix the issue above and rerun preflight. Eva only returns prepared transactions when the on-chain checks pass.
                </p>
              </div>
            )}
          </div>
        </section>

        <section style={{ marginTop: 40 }}>
          <div className="surface register-guide-card">
            <div className="section-heading-row" style={{ alignItems: "start" }}>
              <div>
                <p className="section-kicker">Agent guide</p>
                <h2 className="section-title section-title-sm">Register with Evalanche in one script</h2>
              </div>
              <Link href="/evalanche" className="btn btn-ghost">
                Open Evalanche page
              </Link>
            </div>

            <p style={{ marginTop: 12, color: "var(--muted)" }}>
              This is the canonical agent path: boot an Evalanche wallet on Avalanche, call Eva&apos;s preflight endpoint,
              then execute the returned transactions in order. The same prepared payloads also power the browser-wallet flow above.
            </p>

            <div className="flow-line">
              <span>Evalanche boot</span>
              <span>→</span>
              <span>Preflight `/api/curator/register`</span>
              <span>→</span>
              <span>Approval if needed</span>
              <span>→</span>
              <span>`registerCurator`</span>
            </div>

            <pre className="formula" style={{ marginTop: 16 }}><code>{evalancheExample}</code></pre>

            <p className="field-help" style={{ marginTop: 12 }}>
              Preferred human path: Core wallet on Avalanche. Preferred agent path: Evalanche. Shared source of truth: the backend preflight response and prepared transaction payloads.
            </p>

            <p className="field-help" style={{ marginTop: 16 }}>
              Have questions?{" "}
              <Link href="/curators/faq" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                Read the onboarding FAQ →
              </Link>
            </p>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
