"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState, type ComponentType } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { createThesis, getMarkets, type PredictionMarket, type Thesis } from "@/lib/api";
import { protocol } from "@/lib/protocol";

type ThesisIdentity = {
  dynamicUserId: string;
  xHandle: string;
  xProfileId: string;
  walletAddress: string;
  walletSource: "external" | "embedded";
};

const defaultIdentity: ThesisIdentity = {
  dynamicUserId: "local-dynamic-preview",
  xHandle: "@spacethesis",
  xProfileId: "local-x-preview",
  walletAddress: "0x0fe61780bd5508b3C99e420662050e5560608cA4",
  walletSource: "embedded" as const,
};

function DynamicIdentityLoader({ onIdentity }: { onIdentity: (identity: ThesisIdentity) => void }) {
  const [Bridge, setBridge] = useState<ComponentType<{ onIdentity: (identity: ThesisIdentity) => void }> | null>(null);
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

  useEffect(() => {
    if (!environmentId) return;
    let cancelled = false;
    import("@/components/DynamicComposeIdentityBridge")
      .then((module) => {
        if (!cancelled) setBridge(() => module.default as ComponentType<{ onIdentity: (identity: ThesisIdentity) => void }>);
      })
      .catch(() => setBridge(null));
    return () => {
      cancelled = true;
    };
  }, [environmentId]);

  if (!environmentId || !Bridge) return null;
  return <Bridge onIdentity={onIdentity} />;
}

function ComposeInner() {
  const searchParams = useSearchParams();
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [title, setTitle] = useState("SpaceX IPO liquidity rotation thesis");
  const [body, setBody] = useState(
    "SpaceX IPO anticipation is absorbing speculative liquidity now; after the IPO path becomes explicit, risk markets can reprice as attention and liquidity rotate.",
  );
  const [marketId, setMarketId] = useState(searchParams.get("marketId") ?? "spacex-ipo-before-2027");
  const [selectedOutcomeLabel, setSelectedOutcomeLabel] = useState("Yes");
  const [signalWeight, setSignalWeight] = useState("60");
  const [factClaim, setFactClaim] = useState("SpaceX has explored tender offers before a public listing.");
  const [factUrl, setFactUrl] = useState("");
  const [created, setCreated] = useState<Thesis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [identity, setIdentity] = useState<ThesisIdentity>(defaultIdentity);

  useEffect(() => {
    getMarkets().then((response) => setMarkets(response.markets)).catch(() => setMarkets([]));
  }, []);

  const selectedMarket = markets.find((market) => market.marketId === marketId) ?? null;
  const dynamicRequired = Boolean(process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID);
  const usingPreviewIdentity = identity.dynamicUserId === defaultIdentity.dynamicUserId;
  const identityReady = !dynamicRequired || !usingPreviewIdentity;
  const canPublish = Boolean(title.trim() && body.trim() && selectedOutcomeLabel.trim() && identityReady && !submitting);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPublish) {
      setError("Add a title, thesis body, and selected market outcome before publishing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const marketOutcome = selectedMarket?.outcomes.find((outcome) => outcome.label.toLowerCase() === selectedOutcomeLabel.toLowerCase()) ?? selectedMarket?.outcomes[0] ?? null;
      const response = await createThesis({
        ...identity,
        title,
        body,
        predictionSignals: [
          {
            marketId: selectedMarket?.marketId,
            marketTitle: selectedMarket?.title ?? "Manual prediction signal",
            marketUrl: selectedMarket?.url ?? undefined,
            provider: selectedMarket?.provider ?? "manual",
            selectedOutcomeId: marketOutcome?.outcomeId,
            selectedOutcomeLabel,
            oddsAtAdd: marketOutcome?.price ?? 0.5,
            currentOdds: marketOutcome?.price ?? 0.5,
            weight: Number(signalWeight),
            role: "core",
            rationale: "Primary market signal for this evolving thesis.",
            status: selectedMarket?.status ?? "open",
          },
        ],
        factSignals: factClaim.trim()
          ? [
              {
                claimText: factClaim,
                sourceUrl: factUrl || undefined,
                verifierVerdict: "unverifiable_yet",
                verifierScore: 50,
                weight: Math.max(1, 100 - Number(signalWeight || 60)),
                role: "second_order",
                rationale: "Fact signal to be upgraded by the verifier pipeline.",
              },
            ]
          : [],
        sourceUrl: selectedMarket?.url ?? undefined,
        counterToThesisId: searchParams.get("counterTo") ?? undefined,
      });
      setCreated(response.thesis);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to publish thesis.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Nav />
      <DynamicIdentityLoader onIdentity={setIdentity} />
      <main id="main-content" className="mobile-shell">
        <section className="mobile-page-head">
          <p className="eyebrow">Compose</p>
          <h1>Build an evolving thesis.</h1>
          <p>Combine a market basket, facts, and future revisions into one public post with a visible history.</p>
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
          <section className="compose-layout">
            <form className="prediction-card compose-form" onSubmit={submit}>
              <div className="card-topline">
                <span>{identity.xHandle}</span>
                <span>{identity.walletSource} wallet</span>
              </div>
              {!identityReady ? <p className="form-warning">Connect X and a wallet before publishing a thesis.</p> : null}
              <label className="field-group">
                <span className="field-label">Thesis title</span>
                <input className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </label>
              <label className="field-group">
                <span className="field-label">Thesis body</span>
                <textarea className="field-input compose-textarea" value={body} onChange={(event) => setBody(event.target.value)} required />
              </label>
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
                  <input className="field-input" value={selectedOutcomeLabel} onChange={(event) => setSelectedOutcomeLabel(event.target.value)} required />
                </label>
                <label className="field-group">
                  <span className="field-label">Market weight</span>
                  <input className="field-input" type="number" min="1" max="100" value={signalWeight} onChange={(event) => setSignalWeight(event.target.value)} />
                </label>
              </div>
              <label className="field-group">
                <span className="field-label">Lateral fact signal</span>
                <textarea className="field-input compose-textarea compose-textarea-small" value={factClaim} onChange={(event) => setFactClaim(event.target.value)} />
              </label>
              <label className="field-group">
                <span className="field-label">Fact source URL</span>
                <input className="field-input" value={factUrl} onChange={(event) => setFactUrl(event.target.value)} placeholder="https://..." />
              </label>
              {error ? <p className="form-warning">{error}</p> : null}
              <button className="mobile-action mobile-action-primary compose-submit" type="submit" disabled={!canPublish}>
                {submitting ? "Publishing..." : "Publish thesis"}
              </button>
            </form>
            <aside className="compose-sidecar">
              <article className="prediction-card">
                <h2>Signal basket</h2>
                <p>{selectedMarket?.title ?? "Manual prediction signal"}</p>
                <div className="status-row">
                  <span className="status-chip status-chip-forecast">Market signal</span>
                  <span className="status-chip status-chip-unresolved">Fact signal</span>
                </div>
              </article>
            </aside>
          </section>
        )}
        <SiteFooter />
      </main>
    </>
  );
}

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <>
          <Nav />
          <main id="main-content" className="mobile-shell">
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          </main>
        </>
      }
    >
      <ComposeInner />
    </Suspense>
  );
}
