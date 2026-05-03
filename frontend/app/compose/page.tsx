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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      <main className="mobile-shell">
        <section className="mobile-page-head">
          <p className="eyebrow">Compose</p>
          <h1>Publish a prediction thesis built for X.</h1>
          <p>Start from a market URL, X post, or manual question. Eva stores the track record offchain first.</p>
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
            <button className="mobile-action mobile-action-primary compose-submit" type="submit" disabled={submitting}>
              {submitting ? "Publishing..." : "Publish thesis"}
            </button>
          </form>
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
          <main className="mobile-shell">
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
