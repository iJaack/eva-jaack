"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getMarkets, type PredictionMarket } from "@/lib/api";
import { marketUiStatus, statusClassName, statusLabel } from "@/lib/status";

function formatUsd(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  return `$${value.toLocaleString()}`;
}

function formatOdds(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function providerClassName(provider: PredictionMarket["provider"]): string {
  return `market-provider-${provider}`;
}

function providerLabel(provider: PredictionMarket["provider"]): string {
  if (provider === "polymarket") return "Polymarket";
  if (provider === "kalshi") return "Kalshi";
  if (provider === "manual") return "Manual";
  return "External";
}

const marketPlaybook = [
  "Pick a signal",
  "Cite it inline",
  "Anchor the thesis",
  "Track revisions",
] as const;

export default function MarketsPage() {
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [providerFilter, setProviderFilter] = useState<"all" | PredictionMarket["provider"]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMarkets()
      .then((response) => setMarkets(response.markets))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load markets."))
      .finally(() => setLoading(false));
  }, []);

  const providers = Array.from(new Set(markets.map((market) => market.provider)));
  const filteredMarkets = providerFilter === "all" ? markets : markets.filter((market) => market.provider === providerFilter);
  const totalVolume = filteredMarkets.reduce((sum, market) => sum + (market.volumeUsd ?? 0), 0);
  const unresolvedCount = filteredMarkets.filter((market) => market.status === "open" || market.status === "closed").length;

  return (
    <>
      <Nav />
      <main id="main-content" className="mobile-shell">
        <section className="mobile-page-head">
          <p className="eyebrow">Markets</p>
          <h1>Choose thesis signals.</h1>
          <p>Use markets as citations inside a thesis. Pick the signal, carry it into compose, then let the public post track what changes.</p>
        </section>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : error ? (
          <section className="prediction-card">
            <h2>Markets unavailable</h2>
            <p>{error}</p>
          </section>
        ) : (
          <>
            <section className="prediction-card route-panel">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Source basket</p>
                  <h2 className="section-title section-title-sm">Signal library</h2>
                </div>
                <span className={statusClassName("forecast")}>Forecast</span>
              </div>
              <p className="market-boundary-note">
                Showing {filteredMarkets.length} of {markets.length} markets. Odds are venue forecasts; final truth status lives in thesis revisions, resolved records, and fact signals.
              </p>
              <div className="desk-summary">
                <div>
                  <strong>{filteredMarkets.length}</strong>
                  <span>visible markets</span>
                </div>
                <div>
                  <strong>{formatUsd(totalVolume)}</strong>
                  <span>visible volume</span>
                </div>
                <div>
                  <strong>{unresolvedCount}</strong>
                  <span>forecast / unresolved</span>
                </div>
              </div>
              <div className="quest-line" aria-label="Market participation steps">
                {marketPlaybook.map((step, index) => (
                  <span key={step} className="quest-line-step">
                    <strong>{index + 1}</strong>
                    {step}
                  </span>
                ))}
              </div>
              <div className="filter-bar" aria-label="Provider filters">
                <button
                  type="button"
                  className={`filter-chip${providerFilter === "all" ? " filter-chip-active" : ""}`}
                  onClick={() => setProviderFilter("all")}
                >
                  All
                </button>
                {providers.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    className={`filter-chip${providerFilter === provider ? " filter-chip-active" : ""}`}
                    onClick={() => setProviderFilter(provider)}
                  >
                    {providerLabel(provider)}
                  </button>
                ))}
              </div>
            </section>

            <section className="market-stack">
              {filteredMarkets.map((market) => {
                const uiStatus = marketUiStatus(market);

                return (
                  <article
                    key={market.marketId}
                    className={`prediction-card market-card-large ${providerClassName(market.provider)}`}
                    data-testid="market-signal-card"
                  >
                    <div className="card-topline">
                      <span>{market.category}</span>
                      <span className="provider-badge">{providerLabel(market.provider)}</span>
                    </div>
                    <h2>{market.title}</h2>
                    <div className="status-row">
                      <span className={statusClassName("forecast")}>Odds forecast</span>
                      <span className={statusClassName(uiStatus)}>{statusLabel(uiStatus)}</span>
                    </div>
                    <div className="market-outcomes">
                      {market.outcomes.map((outcome) => (
                        <div key={outcome.outcomeId}>
                          <span>{outcome.label}</span>
                          <strong>{formatOdds(outcome.price)}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="odds-row">
                      <div>
                        <span>Volume</span>
                        <strong>{formatUsd(market.volumeUsd)}</strong>
                      </div>
                      <div>
                        <span>Liquidity</span>
                        <strong>{formatUsd(market.liquidityUsd)}</strong>
                      </div>
                      <div>
                        <span>Resolution</span>
                        <strong>{statusLabel(uiStatus)}</strong>
                      </div>
                    </div>
                    <div className="market-card-actions">
                      <Link
                        className="mobile-action mobile-action-primary"
                        href={`/compose?marketId=${market.marketId}`}
                        aria-label={`Use in thesis: ${market.title}`}
                      >
                        Use in thesis
                      </Link>
                      <Link className="mobile-action" href={`/markets/${market.marketId}`}>
                        Review signal
                      </Link>
                      {market.url ? (
                        <a className="mobile-action" href={market.url} target="_blank" rel="noreferrer">
                          Source
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
