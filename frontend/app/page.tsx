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
import { marketUiStatus, statusClassName, statusLabel, thesisUiStatus } from "@/lib/status";

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
  const firstMarketSignal = thesis.signals.find((signal) => signal.kind === "prediction_market" && signal.marketId);
  return firstMarketSignal && firstMarketSignal.kind === "prediction_market"
    ? markets.find((market) => market.marketId === firstMarketSignal.marketId) ?? null
    : null;
}

function MarketStrip({ markets }: { markets: PredictionMarket[] }) {
  return (
    <div className="mobile-strip" aria-label="Trending markets">
      {markets.map((market) => {
        const outcome = leadingOutcome(market);
        const uiStatus = marketUiStatus(market);

        return (
          <Link key={market.marketId} href={`/markets/${market.marketId}`} className="market-chip">
            <span>{market.category}</span>
            <strong>{outcome ? `${outcome.label} ${formatOdds(outcome.price)}` : "No odds"}</strong>
            <span className={statusClassName(uiStatus)}>{statusLabel(uiStatus)}</span>
          </Link>
        );
      })}
    </div>
  );
}

const productModules = [
  {
    title: "Thesis posts",
    body: "Interactive essays that combine prediction markets, facts, and revision history.",
  },
  {
    title: "Signals",
    body: "Live markets, closed predictions, lateral facts, and second-order evidence in one basket.",
  },
  {
    title: "History",
    body: "Every update keeps the prior score, signal snapshot, and reasoning trail visible.",
  },
  {
    title: "Predictors",
    body: "X identity plus wallet-backed records that can later anchor to protocol state.",
  },
] as const;

const participationQuests = [
  {
    step: "01",
    title: "Write the thesis",
    body: "Start with a bigger market idea, not a single isolated call.",
    href: "/compose",
    cta: "Compose",
  },
  {
    step: "02",
    title: "Attach markets",
    body: "Add live or closed prediction markets as first, second, or third-order signals.",
    href: "/markets",
    cta: "Browse signals",
  },
  {
    step: "03",
    title: "Verify facts",
    body: "Attach factual signals so the essay has more than market odds.",
    href: "/verify",
    cta: "Check source",
  },
  {
    step: "04",
    title: "Revise over time",
    body: "Let score, signals, and history show how the thesis evolves.",
    href: "/predictors",
    cta: "View records",
  },
] as const;

function QuestBoard({ stats }: { stats: PredictionSummary["stats"] }) {
  return (
    <section className="prediction-section quest-board workbench-quests" aria-label="Participation missions">
      <div className="quest-board-copy">
        <p className="section-kicker">Start here</p>
        <h2 className="section-title section-title-sm">One loop, four actions</h2>
        <p>
          Eva should feel like a fast truth game: choose a question, publish a call, back it with evidence,
          and let the record update reputation.
        </p>
      </div>
      <div className="quest-grid">
        {participationQuests.map((quest) => (
          <Link key={quest.step} href={quest.href} className="quest-card">
            <span className="quest-step">{quest.step}</span>
            <h3>{quest.title}</h3>
            <p>{quest.body}</p>
            <span className="quest-card-cta">{quest.cta}</span>
          </Link>
        ))}
      </div>
      <div className="quest-scoreboard" aria-label="Current network activity">
        <div>
          <strong>{stats.weeklyActivePredictors}</strong>
          <span>authors</span>
        </div>
        <div>
          <strong>{stats.openThesisCount}</strong>
          <span>open theses</span>
        </div>
        <div>
          <strong>{stats.copiedThesisEvents}</strong>
          <span>shares/copies</span>
        </div>
      </div>
    </section>
  );
}

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
        <Link href={`/predictors/${thesis.author.xHandle.replace(/^@/, "")}`} className="handle-link">
          {thesis.author.xHandle}
        </Link>
        <span>{thesis.copiedCount} copied</span>
      </div>
      <Link href={`/thesis/${thesis.thesisId}`} className="thesis-card-main">
        <span className="market-label">{market?.category ?? "Market"}</span>
        <h2>{thesis.title}</h2>
        <p>{thesis.body}</p>
      </Link>
      <div className="status-row" aria-label="Thesis status">
        <span className={statusClassName("forecast")}>Forecast</span>
        <span className={statusClassName(thesisUiStatus(thesis))}>{statusLabel(thesisUiStatus(thesis))}</span>
      </div>
      <div className="odds-row">
        <div>
          <span>Signals</span>
          <strong>{thesis.signals.length}</strong>
        </div>
        <div>
          <span>Score</span>
          <strong>{thesis.currentScore}</strong>
        </div>
        <div>
          <span>Revision</span>
          <strong>v{thesis.currentRevision.version}</strong>
        </div>
      </div>
      <div className="sticky-action-row">
        <button className="mobile-action mobile-action-primary" type="button" onClick={previewCopy} disabled={copyPending}>
          {copyPending ? "Preparing…" : "Preview Copy"}
        </button>
        <Link className="mobile-action" href={`/compose?counterTo=${thesis.thesisId}`}>
          Build from this
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
        <section className="mobile-hero home-command">
          <p className="eyebrow">Thesis posts · signals · evidence · history</p>
          <h1>Publish evolving market theses.</h1>
          <p>
            Combine prediction markets, closed outcomes, and verified facts into one interactive post that evolves over time.
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
          <section className="home-workbench" aria-label="Eva prediction workbench">
            <QuestBoard stats={summary.stats} />

            <section className="prediction-section workbench-tape">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Market tape</p>
                  <h2 className="section-title section-title-sm">Scan what moved first</h2>
                </div>
                <Link href="/compose" className="section-link">
                  New thesis
                </Link>
              </div>
              <MarketStrip markets={markets} />
            </section>

            <section className="prediction-section workbench-markets">
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
                        <span className={statusClassName(marketUiStatus(market))}>{statusLabel(marketUiStatus(market))}</span>
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

            <section className="lead-thesis workbench-feature">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Featured thesis</p>
                  <h2 className="section-title section-title-sm">Inspect the live argument</h2>
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

            <aside className="workbench-rail" aria-label="Network context">
              <section className="mobile-metrics workbench-metrics" aria-label="Network metrics">
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

              <section className="prediction-section workbench-predictors">
                <div className="section-heading-row prediction-heading">
                  <div>
                    <p className="section-kicker">Predictors</p>
                    <h2 className="section-title section-title-sm">Reputation context</h2>
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

              <section className="prediction-section product-system workbench-system">
                <div className="section-heading-row prediction-heading">
                  <div>
                    <p className="section-kicker">Product system</p>
                    <h2 className="section-title section-title-sm">Reasoning layers</h2>
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
            </aside>
          </section>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
