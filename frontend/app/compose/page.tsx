"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import SelfCustodyWalletControl from "@/components/SelfCustodyWalletControl";
import PageShell from "@/components/ui/PageShell";
import {
  createThesis,
  getMarkets,
  prepareDraftThesisAnchor,
  type EvaUsageQuote,
  type PredictionMarket,
  type Thesis,
  type ThesisCreateRequest,
} from "@/lib/api";
import { formatEvaAmount, readEvaTokenSnapshot } from "@/lib/eva-token";
import { protocol } from "@/lib/protocol";
import { useSelfCustodyWallet } from "@/lib/self-custody-wallet";

type ThesisIdentity = {
  dynamicUserId: string;
  xHandle: string;
  xProfileId: string;
  walletAddress: string;
  walletSource: "external";
};

type DraftBlock = {
  id: string;
  text: string;
};

type AttachedSignal = {
  id: string;
  label: string;
  kind: "prediction" | "fact";
  title: string;
  summary: string;
  sourceUrl?: string;
  weight: number;
  role: string;
  market?: PredictionMarket | null;
  outcome?: { outcomeId: string; label: string; price: number } | null;
  claimText?: string;
};

const defaultIdentity: ThesisIdentity = {
  dynamicUserId: "local-self-custody-preview",
  xHandle: "@spacethesis",
  xProfileId: "local-x-preview",
  walletAddress: "0x0fe61780bd5508b3C99e420662050e5560608cA4",
  walletSource: "external",
};

const previewIdentityEnabled = process.env.NEXT_PUBLIC_COMPOSE_PREVIEW_IDENTITY === "1" && process.env.NODE_ENV !== "production";

const SelfCustodyEvaUsageCheckout = dynamic(
  () => import("@/components/SelfCustodyEvaUsageCheckout"),
  { ssr: false },
);

const initialBlocks: DraftBlock[] = [
  {
    id: "block-1",
    text: "",
  },
  {
    id: "block-2",
    text: "",
  },
];

function shortWallet(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function normalizePublicXHandle(value: string): string | null {
  const handle = value.trim().replace(/^@+/, "");
  return /^[A-Za-z0-9_]{1,15}$/.test(handle) ? `@${handle}` : null;
}

function isTxHash(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value.trim());
}

function ComposeInner() {
  const searchParams = useSearchParams();
  const { address: connectedWallet } = useSelfCustodyWallet();
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<DraftBlock[]>(initialBlocks);
  const [marketId, setMarketId] = useState(searchParams.get("marketId") ?? "");
  const [selectedOutcomeLabel, setSelectedOutcomeLabel] = useState("Yes");
  const [signalWeight, setSignalWeight] = useState("60");
  const [factClaim, setFactClaim] = useState("");
  const [factUrl, setFactUrl] = useState("");
  const [attachedSignals, setAttachedSignals] = useState<AttachedSignal[]>([]);
  const [anchorPrepared, setAnchorPrepared] = useState(false);
  const [anchorPreparationId, setAnchorPreparationId] = useState<string | null>(null);
  const [anchorTxHash, setAnchorTxHash] = useState("");
  const [evaUsageQuote, setEvaUsageQuote] = useState<EvaUsageQuote | null>(null);
  const [evaUsageTxHash, setEvaUsageTxHash] = useState("");
  const [draftState, setDraftState] = useState("Private draft");
  const [created, setCreated] = useState<Thesis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [preparingAnchor, setPreparingAnchor] = useState(false);
  const [xHandleInput, setXHandleInput] = useState("");
  const [evaBalance, setEvaBalance] = useState("Not read");
  const previousWallet = useRef<string | null>(connectedWallet);

  useEffect(() => {
    getMarkets().then((response) => setMarkets(response.markets)).catch(() => setMarkets([]));
  }, []);

  const selectedMarket = markets.find((market) => market.marketId === marketId) ?? null;
  const outcomeOptions = useMemo(
    () => selectedMarket?.outcomes ?? [{ outcomeId: "manual-yes", label: selectedOutcomeLabel || "Yes", price: 0.5 }],
    [selectedMarket, selectedOutcomeLabel],
  );
  const selectedOutcome = outcomeOptions.find((outcome) => outcome.label === selectedOutcomeLabel) ?? outcomeOptions[0] ?? null;
  const selectedOutcomePrice = selectedOutcome?.price ?? 0.5;
  const normalizedFactClaim = factClaim.trim().replace(/[.]+$/, "");
  const body = blocks.map((block) => block.text.trim()).filter(Boolean).join("\n\n");
  const publicXHandle = normalizePublicXHandle(xHandleInput);
  const identity = useMemo<ThesisIdentity>(
    () =>
      previewIdentityEnabled
        ? defaultIdentity
        : {
            dynamicUserId: connectedWallet ? `wallet:${connectedWallet.toLowerCase()}` : "",
            xHandle: publicXHandle ?? "",
            xProfileId: publicXHandle ? `x:${publicXHandle.slice(1).toLowerCase()}` : "",
            walletAddress: connectedWallet ?? "",
            walletSource: "external",
          },
    [connectedWallet, publicXHandle],
  );
  const identityReady = previewIdentityEnabled || Boolean(connectedWallet && publicXHandle);
  const identityMessage = previewIdentityEnabled
    ? "Preview identity active for local compose."
    : !connectedWallet
      ? "Draft privately now. Connect your own self-custodial EVM wallet when you are ready to publish."
      : !publicXHandle
        ? "Add the public X handle that will appear on this thesis."
        : "Public X handle and self-custodial wallet are ready.";
  const anchorConfirmed = isTxHash(anchorTxHash);
  const evaUsageConfirmed = isTxHash(evaUsageTxHash);
  const canPublish = Boolean(title.trim() && body.trim() && attachedSignals.length > 0 && identityReady && anchorPrepared && anchorPreparationId && anchorConfirmed && evaUsageQuote && evaUsageConfirmed && !submitting && !preparingAnchor);
  const publishBlocker = preparingAnchor
    ? "Preparing anchor"
    : !identityReady
      ? "Connect your wallet and add a public X handle before publishing"
      : !anchorPrepared || !anchorPreparationId
        ? "Prepare anchor before publishing"
        : !anchorConfirmed
          ? "Confirm anchor transaction before publishing"
          : !evaUsageQuote
            ? "Prepare the EVA usage quote before publishing"
            : !evaUsageConfirmed
              ? "Use EVA and confirm its receipt before publishing"
              : !attachedSignals.length
                ? "Attach at least one signal before publishing"
                : null;
  const nextSignalLabel = `S${attachedSignals.length + 1}`;

  useEffect(() => {
    if (!identity.walletAddress) return;
    let cancelled = false;
    readEvaTokenSnapshot(identity.walletAddress as `0x${string}`)
      .then((snapshot) => {
        if (!cancelled && snapshot.walletBalance !== null) {
          setEvaBalance(`${formatEvaAmount(snapshot.walletBalance, snapshot.decimals)} EVA`);
        }
      })
      .catch(() => {
        if (!cancelled) setEvaBalance("Unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [identity.walletAddress]);

  useEffect(() => {
    const savedHandle = window.localStorage.getItem("eva.publicXHandle");
    if (savedHandle) queueMicrotask(() => setXHandleInput(savedHandle));
  }, []);

  const marketSignalText = selectedMarket
    ? `Prediction signal: ${selectedMarket.title} - ${selectedOutcomeLabel} is priced at ${Math.round(selectedOutcomePrice * 100)}%.`
    : `Prediction signal: Manual signal - ${selectedOutcomeLabel}.`;
  const factSignalText = normalizedFactClaim
    ? `Fact signal: ${normalizedFactClaim}${factUrl.trim() ? ` Source: ${factUrl.trim()}` : ""}.`
    : "Fact signal: Add an observed fact, source, or closed prediction that changes how readers should interpret the thesis.";

  const invalidateAnchor = (nextDraftState = "Unsaved private draft") => {
    setDraftState(nextDraftState);
    setAnchorPrepared(false);
    setAnchorPreparationId(null);
    setAnchorTxHash("");
    setEvaUsageQuote(null);
    setEvaUsageTxHash("");
  };

  useEffect(() => {
    if (previousWallet.current === connectedWallet) return;
    previousWallet.current = connectedWallet;
    setDraftState("Wallet changed — prepare a new anchor");
    setAnchorPrepared(false);
    setAnchorPreparationId(null);
    setAnchorTxHash("");
    setEvaUsageQuote(null);
    setEvaUsageTxHash("");
  }, [connectedWallet]);

  const updateXHandle = (nextHandle: string) => {
    setXHandleInput(nextHandle);
    window.localStorage.setItem("eva.publicXHandle", nextHandle);
    invalidateAnchor("Author handle changed — prepare a new anchor");
  };

  const updateTitle = (nextTitle: string) => {
    setTitle(nextTitle);
    invalidateAnchor();
  };

  const updateBlock = (id: string, text: string) => {
    setBlocks((currentBlocks) => currentBlocks.map((block) => (block.id === id ? { ...block, text } : block)));
    invalidateAnchor();
  };

  const addBlock = () => {
    setBlocks((currentBlocks) => [...currentBlocks, { id: `block-${currentBlocks.length + 1}-${Date.now()}`, text: "" }]);
    invalidateAnchor();
  };

  const attachMarketSignal = () => {
    const duplicate = attachedSignals.some((signal) => signal.id === `market-${selectedMarket?.marketId ?? "manual"}`);
    if (duplicate) return;
    setAttachedSignals((signals) => [
      ...signals,
      {
        id: `market-${selectedMarket?.marketId ?? "manual"}`,
        label: nextSignalLabel,
        kind: "prediction",
        title: selectedMarket?.title ?? "Manual prediction signal",
        summary: marketSignalText,
        sourceUrl: selectedMarket?.url ?? undefined,
        weight: Number(signalWeight || 60),
        role: "core",
        market: selectedMarket,
        outcome: selectedOutcome,
      },
    ]);
    invalidateAnchor();
  };

  const attachFactSignal = () => {
    if (!normalizedFactClaim) return;
    const duplicate = attachedSignals.some((signal) => signal.id === `fact-${normalizedFactClaim}`);
    if (duplicate) return;
    setAttachedSignals((signals) => [
      ...signals,
      {
        id: `fact-${normalizedFactClaim}`,
        label: nextSignalLabel,
        kind: "fact",
        title: normalizedFactClaim,
        summary: factSignalText,
        sourceUrl: factUrl || undefined,
        weight: Math.max(1, 100 - Number(signalWeight || 60)),
        role: "second_order",
        claimText: normalizedFactClaim,
      },
    ]);
    invalidateAnchor();
  };

  const citeSignal = (label: string) => {
    setBlocks((currentBlocks) =>
      currentBlocks.map((block, index) => (index === 0 && !block.text.includes(`[${label}]`) ? { ...block, text: `${block.text.trim()} [${label}]` } : block)),
    );
    invalidateAnchor();
  };

  const moveSignal = (id: string, direction: -1 | 1) => {
    setAttachedSignals((signals) => {
      const index = signals.findIndex((signal) => signal.id === id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= signals.length) return signals;
      const reordered = [...signals];
      const [signal] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, signal);
      return reordered;
    });
    invalidateAnchor();
  };

  const savePrivateDraft = () => {
    window.localStorage.setItem(
      "eva.compose.privateDraft",
      JSON.stringify({ title, blocks, attachedSignalIds: attachedSignals.map((signal) => signal.id), savedAt: new Date().toISOString() }),
    );
    setDraftState("Private draft saved");
  };

  const thesisPayload = (): Omit<ThesisCreateRequest, "anchorPreparationId" | "anchorTxHash"> => ({
    ...identity,
    title,
    body,
    predictionSignals: attachedSignals
      .filter((signal) => signal.kind === "prediction")
      .map((signal) => ({
        marketId: signal.market?.marketId,
        marketTitle: signal.market?.title ?? signal.title,
        marketUrl: signal.market?.url ?? signal.sourceUrl,
        provider: signal.market?.provider ?? "manual",
        selectedOutcomeId: signal.outcome?.outcomeId,
        selectedOutcomeLabel: signal.outcome?.label ?? selectedOutcomeLabel,
        oddsAtAdd: signal.outcome?.price ?? 0.5,
        currentOdds: signal.outcome?.price ?? 0.5,
        weight: signal.weight,
        role: signal.role,
        rationale: `${signal.label} inline citation from private thesis draft.`,
        status: signal.market?.status ?? "open",
      })),
    factSignals: attachedSignals
      .filter((signal) => signal.kind === "fact")
      .map((signal) => ({
        claimText: signal.claimText ?? signal.title,
        sourceUrl: signal.sourceUrl,
        verifierVerdict: "unverifiable_yet",
        verifierScore: 50,
        weight: signal.weight,
        role: signal.role,
        rationale: `${signal.label} inline citation from private thesis draft.`,
      })),
    evidenceLinks: attachedSignals.map((signal) => signal.sourceUrl).filter((url): url is string => Boolean(url)),
    sourceUrl: attachedSignals.find((signal) => signal.kind === "prediction")?.sourceUrl,
    counterToThesisId: searchParams.get("counterTo") ?? undefined,
  });

  const prepareAnchor = async () => {
    if (!identityReady) {
      setError(identityMessage);
      return;
    }
    if (!title.trim() || !body.trim() || !attachedSignals.length) {
      setError("Add a title, thesis blocks, and at least one attached signal before preparing the anchor.");
      return;
    }
    setPreparingAnchor(true);
    setError(null);
    try {
      const prepared = await prepareDraftThesisAnchor(thesisPayload());
      setAnchorPreparationId(prepared.anchorPreparationId);
      setAnchorPrepared(true);
      setAnchorTxHash("");
      setEvaUsageQuote(prepared.evaUsageQuote);
      setEvaUsageTxHash("");
      setDraftState("Anchor and EVA quote prepared");
    } catch (reason) {
      setAnchorPrepared(false);
      setAnchorPreparationId(null);
      setEvaUsageQuote(null);
      setError(reason instanceof Error ? reason.message : "Unable to prepare thesis anchor.");
    } finally {
      setPreparingAnchor(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPublish) {
      setError(publishBlocker ?? "Add a title, thesis blocks, and attached signals before publishing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await createThesis({
        ...thesisPayload(),
        anchorPreparationId: anchorPreparationId ?? undefined,
        anchorTxHash: anchorTxHash.trim(),
        evaUsageTxHash: evaUsageTxHash.trim(),
      });
      setCreated(response.thesis);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to publish thesis.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell className="compose-publication-shell">
        <section className="compose-instrument-head">
          <div className="compose-head-copy">
            <p className="eyebrow">Compose / new thesis</p>
            <h1>Build the argument. Keep the receipts.</h1>
            <p>Write clearly. Back every claim with a source. Connect and add $EVA when you are ready to publish.</p>
          </div>
          <ul className="compose-readiness-rail" aria-label="Compose state">
            <li>
              <strong>Identity — {identityReady ? "Ready" : "Required"}</strong>
              <span>{identityReady ? identity.xHandle : "Connect at publish"}</span>
            </li>
            <li>
              <strong>Sources — {attachedSignals.length} attached</strong>
              <span>{attachedSignals.length ? "Usage receipts ready" : "Attach usage receipts"}</span>
            </li>
            <li>
              <strong>Anchor — {anchorPrepared ? "Prepared" : "Not prepared"}</strong>
              <span>{anchorPrepared ? "Confirm wallet receipt" : "Define your outcome"}</span>
            </li>
            <li>
              <strong>$EVA — {evaUsageConfirmed ? "Receipt ready" : "Required"}</strong>
              <span>{evaUsageConfirmed ? "Usage verified" : "Add EVA at publish"}</span>
            </li>
          </ul>
        </section>

        {created ? (
          <section className="prediction-card publish-success">
            <p className="eyebrow">Published</p>
            <h2>{created.title}</h2>
            <p>{created.body}</p>
            <div className="odds-row">
              <div>
                <span>Signals</span>
                <strong>{created.signals.length}</strong>
              </div>
              <div>
                <span>Score</span>
                <strong>{created.currentScore}</strong>
              </div>
              <div>
                <span>Anchor</span>
                <strong>{created.anchor.status}</strong>
              </div>
            </div>
            <div className="sticky-action-row">
              <Link className="mobile-action mobile-action-primary" href={`/thesis/${created.thesisId}`}>
                Open thesis
              </Link>
              <a
                className="mobile-action"
                href={`https://x.com/intent/post?text=${encodeURIComponent(`I published an evolving thesis on Eva: ${created.title}`)}&url=${encodeURIComponent(`${protocol.app.siteUrl}/thesis/${created.thesisId}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Share on X
              </a>
            </div>
          </section>
        ) : (
          <section className="compose-layout compose-publication-layout" data-testid="compose-workspace">
            <form className="prediction-card compose-form compose-editor-panel" onSubmit={submit}>
              <div className="card-topline">
                <span>{identity.xHandle || "Private draft"}</span>
                <span>{identity.walletAddress ? `self-custodial · ${shortWallet(identity.walletAddress)}` : "Wallet not connected"}</span>
              </div>
              <div className="compose-editor-core">
              <div className="compose-editor-heading">
                <div>
                  <p className="eyebrow">Private workspace</p>
                  <h2>Thesis body</h2>
                </div>
                <span className={anchorPrepared ? "status-chip status-chip-verified" : "status-chip status-chip-unresolved"} data-testid="compose-draft-state">
                  {draftState}
                </span>
              </div>
              {!identityReady ? (
                <p className="compose-draft-permission">
                  Drafting is private and available now. Your public handle and self-custodial wallet are only required
                  when you prepare the publish receipts.
                </p>
              ) : null}

              <label className="field-group">
                <span className="field-label">Thesis title</span>
                <textarea
                  className="field-input compose-title-input"
                  value={title}
                  onChange={(event) => updateTitle(event.target.value)}
                  placeholder="State the claim readers should inspect"
                  rows={2}
                  required
                />
              </label>

              <div className="compose-block-stack">
                {blocks.map((block, index) => (
                  <label className="field-group compose-block" key={block.id}>
                    <span className="field-label">Thesis block {index + 1}</span>
                    <textarea
                      className="field-input compose-textarea compose-block-textarea"
                      value={block.text}
                      onChange={(event) => updateBlock(block.id, event.target.value)}
                      placeholder={index === 0 ? "Make the core argument." : "Add supporting logic, a counterpoint, or a revision condition."}
                      required={index === 0}
                    />
                  </label>
                ))}
              </div>

              <div className="compose-editor-actions">
                <button className="mobile-action" type="button" onClick={addBlock}>
                  Add block
                </button>
                <button className="mobile-action" type="button" onClick={savePrivateDraft}>
                  Save private draft
                </button>
                <button className="mobile-action" type="button" onClick={prepareAnchor} disabled={preparingAnchor || !identityReady}>
                  {preparingAnchor ? "Preparing..." : "Prepare anchor"}
                </button>
              </div>

              {anchorPrepared ? (
                <label className="field-group">
                  <span className="field-label">Anchor transaction hash</span>
                  <input className="field-input" value={anchorTxHash} onChange={(event) => setAnchorTxHash(event.target.value)} placeholder="0x..." />
                </label>
              ) : null}
              {evaUsageQuote ? (
                <SelfCustodyEvaUsageCheckout
                  quote={evaUsageQuote}
                  txHash={evaUsageTxHash}
                  onTxHash={setEvaUsageTxHash}
                />
              ) : null}
              <div className="compose-publish-gate">
                {publishBlocker ? <span>{publishBlocker}</span> : <span>Anchor and EVA receipt ready</span>}
                <button className="mobile-action mobile-action-primary compose-submit" type="submit" disabled={!canPublish}>
                  {submitting ? "Publishing..." : "Publish anchored thesis"}
                </button>
              </div>
              {error ? <p className="form-warning">{error}</p> : null}
              </div>
            </form>

            <aside className="compose-sidecar compose-source-rail">
              <section className="prediction-card compose-source-panel">
                <div className="compose-source-core">
                <div>
                  <p className="eyebrow">Source basket</p>
                  <h2>Signals to cite</h2>
                </div>
                <label className="field-group">
                  <span className="field-label">Primary market signal</span>
                  <select
                    className="field-input"
                    value={marketId}
                    onChange={(event) => {
                      const nextMarketId = event.target.value;
                      const nextMarket = markets.find((market) => market.marketId === nextMarketId);
                      setMarketId(nextMarketId);
                      if (nextMarket?.outcomes[0]) setSelectedOutcomeLabel(nextMarket.outcomes[0].label);
                    }}
                  >
                    <option value="">Manual signal</option>
                    {markets.map((market) => (
                      <option key={market.marketId} value={market.marketId}>
                        {market.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="compose-grid">
                  <label className="field-group">
                    <span className="field-label">Outcome</span>
                    <select className="field-input" value={selectedOutcomeLabel} onChange={(event) => setSelectedOutcomeLabel(event.target.value)} required>
                      {outcomeOptions.map((outcome) => (
                        <option key={outcome.outcomeId} value={outcome.label}>
                          {outcome.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-group">
                    <span className="field-label">Market weight</span>
                    <input className="field-input" type="number" min="1" max="100" value={signalWeight} onChange={(event) => setSignalWeight(event.target.value)} />
                  </label>
                </div>
                <div className="compose-signal-card">
                  <div>
                    <span className="status-chip status-chip-forecast">Prediction</span>
                    <p>{marketSignalText}</p>
                  </div>
                  <button className="mobile-action" type="button" onClick={attachMarketSignal}>
                    Attach market signal
                  </button>
                </div>
                <label className="field-group">
                  <span className="field-label">Lateral fact signal</span>
                  <textarea
                    className="field-input compose-textarea compose-textarea-small"
                    value={factClaim}
                    onChange={(event) => setFactClaim(event.target.value)}
                    placeholder="What observed fact changes the thesis?"
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Fact source URL</span>
                  <input className="field-input" value={factUrl} onChange={(event) => setFactUrl(event.target.value)} placeholder="https://..." />
                </label>
                <div className="compose-signal-card">
                  <div>
                    <span className="status-chip status-chip-unresolved">Fact</span>
                    <p>{factSignalText}</p>
                  </div>
                  <button className="mobile-action" type="button" onClick={attachFactSignal}>
                    Attach fact signal
                  </button>
                </div>
                </div>
              </section>

              <section className="prediction-card wallet-panel compose-identity-panel" data-testid="compose-identity-panel">
                <div>
                  <p className="eyebrow">Connect at publish</p>
                  <h2>{identityReady ? "Ready to publish" : "Draft first. Sign when ready."}</h2>
                  <p>{identityMessage}</p>
                </div>
                <div className="compose-identity-actions">
                  <label className="field-group">
                    <span className="field-label">Public X handle</span>
                    <input
                      className="field-input"
                      value={xHandleInput}
                      onChange={(event) => updateXHandle(event.target.value)}
                      placeholder="@yourhandle"
                      autoComplete="off"
                    />
                  </label>
                  <div className="field-group">
                    <span className="field-label">Your self-custodial wallet</span>
                    <SelfCustodyWalletControl />
                  </div>
                </div>
                <div className="wallet-panel-grid">
                  <div>
                    <span>Public X handle</span>
                    <strong>{identity.xHandle || "Required at publish"}</strong>
                  </div>
                  <div>
                    <span>Wallet source</span>
                    <strong>{identity.walletAddress ? "Self-custodial" : "Connect at publish"}</strong>
                  </div>
                  <div>
                    <span>Wallet</span>
                    <strong>{identity.walletAddress ? shortWallet(identity.walletAddress) : "Not connected"}</strong>
                  </div>
                  <div>
                    <span>$EVA holder state</span>
                    <strong>{evaBalance}</strong>
                  </div>
                </div>
                <p className="compose-token-boundary">
                  Balance never changes credibility or score. Publishing consumes the exact quoted EVA proof receipt.
                </p>
              </section>

              <section className="prediction-card compose-attached-panel" data-testid="attached-signals">
                <p className="eyebrow">Attached citations</p>
                <h2>Review sources</h2>
                {attachedSignals.length ? (
                  <div className="attached-signal-list">
                    {attachedSignals.map((signal, index) => (
                      <article className="compose-attached-card" data-testid="attached-signal-card" key={signal.id}>
                        <div className="card-topline">
                          <span>{signal.label}</span>
                          <span>{signal.kind}</span>
                        </div>
                        <h3>{signal.title}</h3>
                        <p>{signal.summary}</p>
                        <div className="compose-signal-actions">
                          <button className="mobile-action" type="button" onClick={() => citeSignal(signal.label)}>
                            Cite {signal.label} in draft
                          </button>
                          <button className="mobile-action" type="button" onClick={() => moveSignal(signal.id, -1)} disabled={index === 0}>
                            Move {signal.label} up
                          </button>
                          <button className="mobile-action" type="button" onClick={() => moveSignal(signal.id, 1)} disabled={index === attachedSignals.length - 1}>
                            Move {signal.label} down
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="inline-note">Attach at least one market or fact signal before anchoring the draft.</p>
                )}
              </section>

              <section className="prediction-card compose-preview-panel">
                <p className="eyebrow">Public preview</p>
                <h2>Reader view</h2>
                <article className="compose-post-preview">
                  <h3>{title || "Untitled thesis"}</h3>
                  <div data-testid="compose-preview-body">
                    {blocks.map((block) => (
                      <p key={block.id}>{block.text || "Empty block"}</p>
                    ))}
                  </div>
                </article>
              </section>
            </aside>
          </section>
        )}
    </PageShell>
  );
}

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <PageShell className="compose-publication-shell">
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        </PageShell>
      }
    >
      <ComposeInner />
    </Suspense>
  );
}
