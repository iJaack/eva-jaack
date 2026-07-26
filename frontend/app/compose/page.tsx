"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState, type ComponentType } from "react";
import DynamicAuthControl from "@/components/DynamicAuthControl";
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
import type { DynamicIdentityState, DynamicThesisIdentity } from "@/lib/dynamic-identity";
import { formatEvaAmount, readEvaTokenSnapshot } from "@/lib/eva-token";
import { protocol } from "@/lib/protocol";

type ThesisIdentity = DynamicThesisIdentity;

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
  dynamicUserId: "local-dynamic-preview",
  xHandle: "@spacethesis",
  xProfileId: "local-x-preview",
  walletAddress: "0x0fe61780bd5508b3C99e420662050e5560608cA4",
  walletSource: "embedded" as const,
};

const dynamicEnvironmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
const dynamicTestMode = process.env.NEXT_PUBLIC_DYNAMIC_TEST_CONTEXT === "1";
const previewIdentityEnabled = process.env.NEXT_PUBLIC_COMPOSE_PREVIEW_IDENTITY === "1" && process.env.NODE_ENV !== "production";
const dynamicIdentityRequired = dynamicTestMode || Boolean(dynamicEnvironmentId) || !previewIdentityEnabled;
const dynamicUnavailableMessage = dynamicEnvironmentId
  ? "Connect with Dynamic before drafting a public thesis."
  : "Dynamic identity is required before drafting a public thesis. Configure Dynamic auth before enabling the editor.";

const DynamicEvaUsageCheckout = dynamic(
  () => import("@/components/DynamicEvaUsageCheckout"),
  { ssr: false },
);

const initialBlocks: DraftBlock[] = [
  {
    id: "block-1",
    text:
      "SpaceX IPO anticipation is absorbing speculative liquidity now. My working thesis is that attention and risk capital are being held back before the listing path becomes explicit.",
  },
  {
    id: "block-2",
    text:
      "After the IPO window is resolved, that trapped attention can rotate into adjacent risk markets and make the second-order move larger than the IPO headline itself.",
  },
];

function DynamicIdentityLoader({
  onIdentity,
  onIdentityState,
}: {
  onIdentity: (identity: ThesisIdentity) => void;
  onIdentityState: (state: DynamicIdentityState) => void;
}) {
  const [Bridge, setBridge] = useState<ComponentType<{ onIdentity: (identity: ThesisIdentity) => void; onIdentityState: (state: DynamicIdentityState) => void }> | null>(null);

  useEffect(() => {
    if (!dynamicEnvironmentId && !dynamicTestMode) return;
    let cancelled = false;
    import("@/components/DynamicComposeIdentityBridge")
      .then((module) => {
        if (!cancelled) setBridge(() => module.default as ComponentType<{ onIdentity: (identity: ThesisIdentity) => void; onIdentityState: (state: DynamicIdentityState) => void }>);
      })
      .catch(() => setBridge(null));
    return () => {
      cancelled = true;
    };
  }, []);

  if ((!dynamicEnvironmentId && !dynamicTestMode) || !Bridge) return null;
  return <Bridge onIdentity={onIdentity} onIdentityState={onIdentityState} />;
}

function shortWallet(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isTxHash(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value.trim());
}

function ComposeInner() {
  const searchParams = useSearchParams();
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [title, setTitle] = useState("SpaceX IPO liquidity rotation thesis");
  const [blocks, setBlocks] = useState<DraftBlock[]>(initialBlocks);
  const [marketId, setMarketId] = useState(searchParams.get("marketId") ?? "spacex-ipo-before-2027");
  const [selectedOutcomeLabel, setSelectedOutcomeLabel] = useState("Yes");
  const [signalWeight, setSignalWeight] = useState("60");
  const [factClaim, setFactClaim] = useState("SpaceX has explored tender offers before a public listing.");
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
  const [identity, setIdentity] = useState<ThesisIdentity>(defaultIdentity);
  const [identityState, setIdentityState] = useState<DynamicIdentityState | null>(null);
  const [evaBalance, setEvaBalance] = useState("Not read");

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
  const identityReady = !dynamicIdentityRequired || identityState?.status === "ready";
  const identityMessage = dynamicIdentityRequired ? identityState?.message ?? dynamicUnavailableMessage : "Preview identity active for local compose.";
  const anchorConfirmed = isTxHash(anchorTxHash);
  const evaUsageConfirmed = isTxHash(evaUsageTxHash);
  const canPublish = Boolean(title.trim() && body.trim() && attachedSignals.length > 0 && identityReady && anchorPrepared && anchorPreparationId && anchorConfirmed && evaUsageQuote && evaUsageConfirmed && !submitting && !preparingAnchor);
  const publishBlocker = preparingAnchor
    ? "Preparing anchor"
    : !identityReady
      ? "Connect X and a wallet before publishing"
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
  const showComposeWorkspace = !dynamicIdentityRequired || identityReady;
  const authGateMessage = identityState?.message ?? dynamicUnavailableMessage;
  const nextSignalLabel = `S${attachedSignals.length + 1}`;

  useEffect(() => {
    if (!showComposeWorkspace) return;
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
  }, [identity.walletAddress, showComposeWorkspace]);

  const marketSignalText = selectedMarket
    ? `Prediction signal: ${selectedMarket.title} - ${selectedOutcomeLabel} is priced at ${Math.round(selectedOutcomePrice * 100)}%.`
    : `Prediction signal: Manual signal - ${selectedOutcomeLabel}.`;
  const factSignalText = normalizedFactClaim
    ? `Fact signal: ${normalizedFactClaim}${factUrl.trim() ? ` Source: ${factUrl.trim()}` : ""}.`
    : "Fact signal: Add an observed fact, source, or closed prediction that changes how readers should interpret the thesis.";

  useEffect(() => {
    if (!selectedMarket?.outcomes.length) return;
    const hasSelectedOutcome = selectedMarket.outcomes.some((outcome) => outcome.label === selectedOutcomeLabel);
    if (!hasSelectedOutcome) setSelectedOutcomeLabel(selectedMarket.outcomes[0].label);
  }, [selectedMarket, selectedOutcomeLabel]);

  const invalidateAnchor = (nextDraftState = "Unsaved private draft") => {
    setDraftState(nextDraftState);
    setAnchorPrepared(false);
    setAnchorPreparationId(null);
    setAnchorTxHash("");
    setEvaUsageQuote(null);
    setEvaUsageTxHash("");
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
      <DynamicIdentityLoader onIdentity={setIdentity} onIdentityState={setIdentityState} />
        <section className="mobile-page-head compose-page-head">
          <p className="eyebrow">Compose / new thesis</p>
          <h1>Build the argument. Keep the receipts.</h1>
          <p>Start with a claim, attach the sources that shape it, and define what would make you revise.</p>
          <ul className="route-proof-list" aria-label="Compose state">
            <li>Identity — {identityReady ? "Ready" : "Required"}</li>
            <li>Sources — {attachedSignals.length} attached</li>
            <li>Anchor — {anchorPrepared ? "Prepared" : "Not prepared"}</li>
            <li>$EVA — {evaUsageConfirmed ? "Receipt ready" : "Required to publish"}</li>
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
        ) : !showComposeWorkspace ? (
          <section className="prediction-card compose-auth-gate" data-testid="compose-auth-gate">
            <p className="eyebrow">Identity / required</p>
            <h2>Connect to start writing.</h2>
            <p>{authGateMessage}</p>
            <DynamicAuthControl />
            <ul className="route-proof-list" aria-label="Compose auth requirements">
              <li>Your draft remains private until publish</li>
              <li>Publishing needs a confirmed wallet transaction</li>
              <li>Eva prepares thesis anchors; it never submits a trade</li>
            </ul>
          </section>
        ) : (
          <section className="compose-layout compose-publication-layout">
            <form className="prediction-card compose-form compose-editor-panel" onSubmit={submit}>
              <div className="card-topline">
                <span>{identity.xHandle}</span>
                <span>{identity.walletSource} wallet · {shortWallet(identity.walletAddress)}</span>
              </div>
              <div className="wallet-panel compose-identity-panel" data-testid="compose-identity-panel">
                <div>
                  <p className="eyebrow">Author identity</p>
                  <h3>{identityReady ? "Ready to publish" : "Identity required"}</h3>
                  <p>{identityMessage}</p>
                </div>
                <div className="wallet-panel-grid">
                  <div>
                    <span>X account</span>
                    <strong>{identityReady || !dynamicIdentityRequired ? identity.xHandle : "Not connected"}</strong>
                  </div>
                  <div>
                    <span>Wallet source</span>
                    <strong>{identityReady || !dynamicIdentityRequired ? identity.walletSource : "Missing"}</strong>
                  </div>
                  <div>
                    <span>Wallet</span>
                    <strong>{identityReady || !dynamicIdentityRequired ? shortWallet(identity.walletAddress) : "Not connected"}</strong>
                  </div>
                  <div>
                    <span>$EVA holder state</span>
                    <strong>{evaBalance}</strong>
                  </div>
                </div>
                <p className="compose-token-boundary">
                  Balance never changes credibility or score. Publishing consumes the exact quoted EVA proof receipt.
                </p>
              </div>
              <div className="compose-editor-heading">
                <div>
                  <p className="eyebrow">Private workspace</p>
                  <h2>Thesis body</h2>
                </div>
                <span className={anchorPrepared ? "status-chip status-chip-verified" : "status-chip status-chip-unresolved"} data-testid="compose-draft-state">
                  {draftState}
                </span>
              </div>
              {!identityReady ? <p className="form-warning">Connect X and a wallet before publishing a thesis.</p> : null}

              <label className="field-group">
                <span className="field-label">Thesis title</span>
                <textarea className="field-input compose-title-input" value={title} onChange={(event) => updateTitle(event.target.value)} rows={2} required />
              </label>

              <div className="compose-block-stack">
                {blocks.map((block, index) => (
                  <label className="field-group compose-block" key={block.id}>
                    <span className="field-label">Thesis block {index + 1}</span>
                    <textarea
                      className="field-input compose-textarea compose-block-textarea"
                      value={block.text}
                      onChange={(event) => updateBlock(block.id, event.target.value)}
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
                <DynamicEvaUsageCheckout
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
            </form>

            <aside className="compose-sidecar compose-source-rail">
              <section className="prediction-card compose-source-panel">
                <div>
                  <p className="eyebrow">Source basket</p>
                  <h2>Signals to cite</h2>
                </div>
                <label className="field-group">
                  <span className="field-label">Primary market signal</span>
                  <select className="field-input" value={marketId} onChange={(event) => setMarketId(event.target.value)}>
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
                  <textarea className="field-input compose-textarea compose-textarea-small" value={factClaim} onChange={(event) => setFactClaim(event.target.value)} />
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
