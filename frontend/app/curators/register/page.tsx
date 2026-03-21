"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import {
  formatTokenAmount,
  preflightCuratorRegistration,
  shortenAddress,
  type CuratorRegisterError,
  type CuratorRegisterSuccess,
} from "@/lib/curator-onboarding";

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
    title: "Broadcast from your wallet",
    body: "This page does not pretend to sign for you. If wallet-connect is not wired yet, it shows the exact prepared transactions you need to submit from your own wallet.",
  },
] as const;

const starterExamples = {
  walletAddress: "0x0000000000000000000000000000000000000000",
  agentId: "1599",
  stakeAmount: "250000",
} as const;

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

export default function CuratorRegisterPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [agentId, setAgentId] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<CuratorRegisterSuccess | CuratorRegisterError | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState<number | null>(null);

  const effectiveStakeCopy = useMemo(() => {
    if (!isSuccess(response)) return stakeAmount.trim() || "minimum network stake";
    return `${formatTokenAmount(response.stakeAmountEva)} EVA`;
  }, [response, stakeAmount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNetworkError(null);
    setResponse(null);

    try {
      const payload = {
        walletAddress: walletAddress.trim(),
        agentId: agentId.trim(),
        ...(stakeAmount.trim() ? { stakeAmount: stakeAmount.trim() } : {}),
      };

      const result = await preflightCuratorRegistration(payload);
      setResponse(result);
    } catch (error) {
      setNetworkError(error instanceof Error ? error.message : "Unable to reach curator registration API.");
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
              Eva will preflight the transaction flow and show you exactly what needs to happen next.
            </p>
            <div className="hero-actions">
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
            <p className="hero-panel-kicker">Before you start</p>
            <ul className="hero-checklist">
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
                  Honest UX: this page prepares the flow; it does not claim to sign transactions for you.
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
                  <p className="section-kicker" style={{ marginBottom: 8 }}>Next step</p>
                  <h3 style={{ margin: 0 }}>Broadcast {response.transactions.length} transaction{response.transactions.length !== 1 ? "s" : ""} from your wallet</h3>
                  <p style={{ marginTop: 10, color: "var(--muted)" }}>
                    Wallet connect is not wired on this page yet, so use the payloads below in your wallet, script, or signer flow. Stake target: {effectiveStakeCopy}.
                  </p>
                </div>

                <div className="register-transaction-stack">
                  {response.transactions.map((tx, index) => (
                    <article key={`${tx.to}-${index}`} className="surface tx-card">
                      <div className="tx-card-header">
                        <div>
                          <p className="section-kicker" style={{ marginBottom: 8 }}>Transaction {index + 1}</p>
                          <h3 style={{ margin: 0 }}>{tx.description}</h3>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: "10px 16px" }}
                          onClick={() => copyTransactionPayload(index, tx)}
                        >
                          {copiedTx === index ? "Copied" : "Copy JSON"}
                        </button>
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
                      </div>
                    </article>
                  ))}
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

        <SiteFooter />
      </main>
    </>
  );
}
