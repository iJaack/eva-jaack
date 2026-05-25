"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { createThesis, getMarkets, type PredictionMarket, type Thesis } from "@/lib/api";
import { protocol } from "@/lib/protocol";

function ComposeInner() {
  const searchParams = useSearchParams();
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [authorHandle, setAuthorHandle] = useState("");
  const [marketId, setMarketId] = useState(searchParams.get("marketId") ?? "");
  const [marketUrl, setMarketUrl] = useState("");
  const [marketTitle, setMarketTitle] = useState("");
  const [selectedOutcomeLabel, setSelectedOutcomeLabel] = useState("Yes");
  const [rationale, setRationale] = useState("");
  const [evidence, setEvidence] = useState("");
  const [created, setCreated] = useState<Thesis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMarkets().then((response) => setMarkets(response.markets)).catch(() => setMarkets([]));
  }, []);

  const selectedMarket = markets.find((market) => market.marketId === marketId) ?? null;
  const marketContextReady = Boolean(marketId || marketTitle.trim() || marketUrl.trim());
  const authorReady = Boolean(authorHandle.trim());
  const outcomeReady = Boolean(selectedOutcomeLabel.trim());
  const rationaleReady = Boolean(rationale.trim());
  const evidenceCount = evidence
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
  const canPublish = authorReady && marketContextReady && outcomeReady && rationaleReady && !submitting;
  const readinessCompleted = [authorReady, marketContextReady, outcomeReady, rationaleReady].filter(Boolean).length;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPublish) {
      setError("Add an author, market context, outcome, and rationale before publishing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await createThesis({
        authorHandle,
        marketId: marketId || undefined,
        marketUrl: marketUrl || undefined,
        marketTitle: marketTitle || undefined,
        selectedOutcomeLabel,
        rationale,
        evidenceLinks: evidence
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
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
      <main id="main-content" className="mobile-shell">
        <section className="mobile-page-head">
          <p className="eyebrow">Compose</p>
          <h1>Make the call in four fields.</h1>
          <p>Start from a market URL, X post, or manual question. Eva keeps the forecast record separate from truth until evidence resolves it.</p>
          <div className="mobile-hero-actions">
            <Link href="/verify" className="mobile-action">
              Check source first
            </Link>
          </div>
        </section>

        {created ? (
          <section className="prediction-card publish-success">
            <p className="eyebrow">Published</p>
            <h2>{created.selectedOutcomeLabel} thesis is live.</h2>
            <p>{created.rationale}</p>
            <div className="sticky-action-row">
              <Link className="mobile-action mobile-action-primary" href={`/thesis/${created.thesisId}`}>
                Open thesis
              </Link>
              <a
                className="mobile-action"
                href={`https://x.com/intent/post?text=${encodeURIComponent(`I published a prediction thesis on Eva: ${created.selectedOutcomeLabel}`)}&url=${encodeURIComponent(`${protocol.app.siteUrl}/thesis/${created.thesisId}`)}`}
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
              <label className="field-group">
                <span className="field-label">X handle</span>
                <input className="field-input" value={authorHandle} onChange={(event) => setAuthorHandle(event.target.value)} placeholder="@evapredicts" required />
              </label>

              <label className="field-group">
                <span className="field-label">Existing market</span>
                <select className="field-input" value={marketId} onChange={(event) => setMarketId(event.target.value)}>
                  <option value="">Create from URL/title</option>
                  {markets.map((market) => (
                    <option key={market.marketId} value={market.marketId}>
                      {market.title}
                    </option>
                  ))}
                </select>
              </label>

              {!marketId ? (
                <>
                  <label className="field-group">
                    <span className="field-label">Market title</span>
                    <input className="field-input" value={marketTitle} onChange={(event) => setMarketTitle(event.target.value)} placeholder="Will crude oil trade above $95 before close?" />
                  </label>
                  <label className="field-group">
                    <span className="field-label">Market or source URL</span>
                    <input className="field-input" value={marketUrl} onChange={(event) => setMarketUrl(event.target.value)} placeholder="https://x.com/... or https://polymarket.com/..." />
                  </label>
                </>
              ) : null}

              <label className="field-group">
                <span className="field-label">Outcome</span>
                <input className="field-input" value={selectedOutcomeLabel} onChange={(event) => setSelectedOutcomeLabel(event.target.value)} placeholder="Yes" required />
              </label>

              <label className="field-group">
                <span className="field-label">Rationale</span>
                <textarea className="field-input compose-textarea" value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Why is this outcome mispriced?" required />
              </label>

              <label className="field-group">
                <span className="field-label">Evidence links</span>
                <textarea className="field-input compose-textarea compose-textarea-small" value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="One URL per line" />
              </label>

              {error ? <p className="claim-warning">{error}</p> : null}
              <button className="mobile-action mobile-action-primary compose-submit" type="submit" disabled={!canPublish}>
                {submitting ? "Publishing..." : "Publish thesis"}
              </button>
            </form>

            <aside className="compose-sidecar">
              <article className="prediction-card">
                <div className="card-topline">
                  <span>Forecast record</span>
                  <span className={canPublish ? "status-chip status-chip-forecast" : "status-chip status-chip-unresolved"}>
                    {canPublish ? "Ready to publish" : "Draft"}
                  </span>
                </div>
                <h2>Thesis readiness</h2>
                <div className="mission-progress" aria-label={`Thesis readiness ${readinessCompleted} of 4`}>
                  <div className="mission-progress-head">
                    <span>Mission progress</span>
                    <strong>{readinessCompleted}/4</strong>
                  </div>
                  <div className="mission-meter">
                    <span className={`mission-meter-fill mission-meter-fill-${readinessCompleted}`} />
                  </div>
                </div>
                <p>
                  Eva records the forecast and evidence bundle. It does not mark the outcome true until a resolver or evidence process reaches a separate status.
                </p>
                <ul className="readiness-list">
                  <li><span>Author identity</span><strong>{authorReady ? authorHandle : "Needed"}</strong></li>
                  <li><span>Market context</span><strong>{marketContextReady ? ((selectedMarket?.title ?? marketTitle) || "URL attached") : "Market context needed"}</strong></li>
                  <li><span>Forecast outcome</span><strong>{outcomeReady ? selectedOutcomeLabel : "Needed"}</strong></li>
                  <li><span>Evidence links</span><strong>{evidenceCount}</strong></li>
                  <li><span>Resolution status</span><strong>Unresolved</strong></li>
                </ul>
              </article>

              <article className="prediction-card">
                <h2>Claim bundle fields</h2>
                <p>When evidence is attached, the useful bundle is claim, source, author or agent identity, confidence, conflicts, deadline, resolver, dispute window, and outcome.</p>
                <div className="status-row">
                  <span className="status-chip status-chip-forecast">Forecast</span>
                  <span className="status-chip status-chip-unresolved">Unresolved</span>
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
