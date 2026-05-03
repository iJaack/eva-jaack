"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getMarkets, type PredictionMarket } from "@/lib/api";

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

export default function MarketsPage() {
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMarkets()
      .then((response) => setMarkets(response.markets))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load markets."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Nav />
      <main className="mobile-shell">
        <section className="mobile-page-head">
          <p className="eyebrow">Markets</p>
          <h1>Live markets with Eva theses attached.</h1>
          <p>External venues provide odds. Eva adds the public reasoning layer and predictor reputation.</p>
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
          <section className="market-stack">
            {markets.map((market) => (
              <Link
                key={market.marketId}
                href={`/markets/${market.marketId}`}
                className={`prediction-card market-card-large ${providerClassName(market.provider)}`}
              >
                <div className="card-topline">
                  <span>{market.category}</span>
                  <span className="provider-badge">{providerLabel(market.provider)}</span>
                </div>
                <h2>{market.title}</h2>
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
                    <span>Status</span>
                    <strong>{market.status}</strong>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
