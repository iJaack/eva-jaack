"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import {
  getCopyPreview,
  getPredictionSummary,
  type PredictionMarket,
  type PredictionSummary,
  type Predictor,
  type Thesis,
} from "@/lib/api";

const compactUsdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

function formatUsd(value: number | null): string {
  if (value === null) return "—";
  return compactUsdFormatter.format(value);
}

function formatOdds(value: number): string {
  return percentFormatter.format(value);
}

function leadingOutcome(market: PredictionMarket): { label: string; price: number } | null {
  return [...market.outcomes].sort((left, right) => right.price - left.price)[0] ?? null;
}

function thesisMarket(thesis: Thesis, markets: PredictionMarket[]): PredictionMarket | null {
  return markets.find((market) => market.marketId === thesis.marketId) ?? null;
}

function MarketStrip({ markets }: { markets: PredictionMarket[] }) {
  return (
    <div className="mobile-strip" aria-label="Trending markets">
      {markets.map((market) => {
        const outcome = leadingOutcome(market);

        return (
          <Link key={market.marketId} href={`/markets/${market.marketId}`} className="market-chip">
            <span>{market.category}</span>
            <strong>{outcome ? `${outcome.label} ${formatOdds(outcome.price)}` : "No odds"}</strong>
          </Link>
        );
      })}
    </div>
  );
}

const productModules = [
  {
    title: "Markets",
    body: "External odds and closing context for the questions Eva tracks.",
  },
  {
    title: "Theses",
    body: "Public reasoning tied to an outcome, timestamp, and odds snapshot.",
  },
  {
    title: "Evidence",
    body: "Source links and claim checks that make a prediction inspectable.",
  },
  {
    title: "Predictors",
    body: "Trust score, market record, and graph-backed identity in one profile.",
  },
] as const;

function ThesisCard({ thesis, market }: { thesis: Thesis; market: PredictionMarket | null }) {
  const [copyState, setCopyState] = useState<string | null>(null);
  const [copyPending, setCopyPending] = useState(false);

  const previewCopy = async () => {
    setCopyPending(true);
    setCopyState(null);

    try {
      const preview = await getCopyPreview(thesis.thesisId);
      setCopyState(preview.venueUrl ? "External venue opened as preview." : "Copy preview recorded. No execution in v1.");
    } catch {
      setCopyState("Copy preview failed. Refresh and try again.");
    } finally {
      setCopyPending(false);
    }
  };

  return (
    <article className="prediction-card thesis-card">
      <div className="card-topline">
        <Link href={`/predictors/${thesis.authorHandle.replace(/^@/, "")}`} className="handle-link">
          {thesis.authorHandle}
        </Link>
        <span>{thesis.copiedCount} copied</span>
      </div>
      <Link href={`/thesis/${thesis.thesisId}`} className="thesis-card-main">
        <span className="market-label">{market?.category ?? "Market"}</span>
        <h2>{market?.title ?? "Prediction thesis"}</h2>
        <p>{thesis.rationale}</p>
      </Link>
      <div className="odds-row">
        <div>
          <span>Outcome</span>
          <strong>{thesis.selectedOutcomeLabel}</strong>
        </div>
        <div>
          <span>Posted</span>
          <strong>{formatOdds(thesis.oddsAtPost)}</strong>
        </div>
        <div>
          <span>Now</span>
          <strong>{formatOdds(thesis.currentOdds)}</strong>
        </div>
      </div>
      <div className="sticky-action-row">
        <button className="mobile-action mobile-action-primary" type="button" onClick={previewCopy} disabled={copyPending}>
          {copyPending ? "Preparing…" : "Copy Thesis"}
        </button>
        <Link className="mobile-action" href={`/compose?counterTo=${thesis.thesisId}`}>
          Counter
        </Link>
      </div>
      {copyState ? <p className="inline-note" role="status" aria-live="polite">{copyState}</p> : null}
    </article>
  );
}

function PredictorRow({ predictor }: { predictor: Predictor }) {
  return (
    <Link href={`/predictors/${predictor.predictorId}`} className="predictor-row">
      <div>
        <strong>{predictor.handle}</strong>
        <span>{predictor.profileState === "registered" ? "Graph-backed" : "Unclaimed X profile"}</span>
      </div>
      <div className="predictor-score">
        <strong>{predictor.trustScore}</strong>
        <span>{predictor.accuracy === null ? "pending" : `${predictor.accuracy}% acc`}</span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPredictionSummary()
      .then(setSummary)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load prediction network."))
      .finally(() => setLoading(false));
  }, []);

  const markets = summary?.markets ?? [];
  const theses = summary?.theses ?? [];
  const predictors = summary?.predictors ?? [];
  const leadThesis = theses[0] ?? null;
  const leadMarket = leadThesis ? thesisMarket(leadThesis, markets) : null;

  return (
    <>
      <Nav />
      <main id="main-content" className="mobile-shell prediction-home">
        <section className="mobile-hero">
          <p className="eyebrow">Prediction OS</p>
          <h1>Track markets, publish theses, follow predictor reputation.</h1>
          <p>
            Eva connects external odds, thesis pages, evidence, and trust scores in one product surface.
          </p>
          <div className="mobile-hero-actions">
            <Link href="/compose" className="mobile-action mobile-action-primary">
              Make a thesis
            </Link>
            <Link href="/markets" className="mobile-action">
              Browse markets
            </Link>
          </div>
        </section>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : error || !summary ? (
          <section className="prediction-card">
            <h2>Network unavailable</h2>
            <p>{error ?? "Eva could not load prediction activity."}</p>
          </section>
        ) : (
          <>
            <section className="mobile-metrics">
              <div>
                <strong>{summary.stats.weeklyActivePredictors}</strong>
                <span>active predictors</span>
              </div>
              <div>
                <strong>{summary.stats.openThesisCount}</strong>
                <span>open theses</span>
              </div>
              <div>
                <strong>{summary.stats.copiedThesisEvents}</strong>
                <span>copied theses</span>
              </div>
            </section>

            <MarketStrip markets={markets} />

            <section className="lead-thesis">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Featured thesis</p>
                  <h2 className="section-title section-title-sm">Most copied thesis</h2>
                </div>
                <Link href="/markets" className="section-link">
                  See all
                </Link>
              </div>
              {leadThesis ? (
                <ThesisCard thesis={leadThesis} market={leadMarket} />
              ) : (
                <article className="prediction-card empty-state-card">
                  <h2>No Featured Thesis</h2>
                  <p>Publish a thesis to create the first featured market record.</p>
                </article>
              )}
            </section>

            <section className="prediction-section">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Markets</p>
                  <h2 className="section-title section-title-sm">Where the network is focused</h2>
                </div>
                <Link href="/markets" className="section-link">
                  Markets
                </Link>
              </div>
              {markets.length > 0 ? (
                <div className="market-list-mobile">
                  {markets.map((market) => (
                    <Link key={market.marketId} href={`/markets/${market.marketId}`} className="market-row">
                      <div>
                        <span>{market.category}</span>
                        <strong>{market.title}</strong>
                      </div>
                      <div>
                        <span>Vol</span>
                        <strong>{formatUsd(market.volumeUsd)}</strong>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <article className="prediction-card empty-state-card">
                  <h2>No Markets Loaded</h2>
                  <p>Refresh or check the API connection.</p>
                </article>
              )}
            </section>

            <section className="prediction-section">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Predictors</p>
                  <h2 className="section-title section-title-sm">Trust graph plus market record</h2>
                </div>
                <Link href="/predictors" className="section-link">
                  Rankings
                </Link>
              </div>
              {predictors.length > 0 ? (
                <div className="predictor-list">
                  {predictors.map((predictor) => (
                    <PredictorRow key={predictor.predictorId} predictor={predictor} />
                  ))}
                </div>
              ) : (
                <article className="prediction-card empty-state-card">
                  <h2>No Predictors Yet</h2>
                  <p>Published theses will create predictor records.</p>
                </article>
              )}
            </section>

            <section className="prediction-section product-system">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Product system</p>
                  <h2 className="section-title section-title-sm">One workflow for market reasoning</h2>
                </div>
              </div>
              <div className="product-module-grid">
                {productModules.map((module) => (
                  <article key={module.title} className="product-module">
                    <h3>{module.title}</h3>
                    <p>{module.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
