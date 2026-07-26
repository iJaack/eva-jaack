"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { getMarkets, type PredictionMarket } from "@/lib/api";
import { marketUiStatus, statusClassName, statusLabel } from "@/lib/status";

function formatUsd(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatOdds(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function providerLabel(provider: PredictionMarket["provider"]): string {
  if (provider === "polymarket") return "Polymarket";
  if (provider === "kalshi") return "Kalshi";
  if (provider === "manual") return "Manual";
  return "External";
}

function MarketSkeleton() {
  return (
    <div className="eva-market-list" aria-label="Loading markets">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="eva-market-skeleton" />
      ))}
    </div>
  );
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [providerFilter, setProviderFilter] = useState<"all" | PredictionMarket["provider"]>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMarkets()
      .then((response) => setMarkets(response.markets))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load markets."))
      .finally(() => setLoading(false));
  }, []);

  const providers = useMemo(() => Array.from(new Set(markets.map((market) => market.provider))), [markets]);
  const filteredMarkets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return markets.filter((market) => {
      const matchesProvider = providerFilter === "all" || market.provider === providerFilter;
      const matchesQuery =
        !normalizedQuery ||
        market.title.toLowerCase().includes(normalizedQuery) ||
        market.category.toLowerCase().includes(normalizedQuery) ||
        providerLabel(market.provider).toLowerCase().includes(normalizedQuery);
      return matchesProvider && matchesQuery;
    });
  }, [markets, providerFilter, query]);

  return (
    <PageShell className="eva-markets-page">
      <SectionHeader
        eyebrow={`Signal library / ${markets.length.toString().padStart(2, "0")} sources`}
        title="Markets are source material."
        description="Use live forecasts as citations inside a broader thesis. Venue odds stay separate from facts, revisions, and final truth."
      >
        <ul className="route-proof-list" aria-label="Market library boundaries">
          <li>Sports excluded</li>
          <li>Odds are not verified facts</li>
          <li>Primary action: cite in thesis</li>
        </ul>
      </SectionHeader>

      <section className="eva-market-toolbar" aria-label="Market search and filters">
        <label className="eva-market-search">
          <span className="sr-only">Search markets</span>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search markets"
          />
        </label>
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
        <span className="eva-market-count">
          {filteredMarkets.length} {filteredMarkets.length === 1 ? "source" : "sources"}
        </span>
      </section>

      {loading ? (
        <MarketSkeleton />
      ) : error ? (
        <section className="eva-inline-error">
          <strong>Markets unavailable</strong>
          <span>{error}</span>
        </section>
      ) : filteredMarkets.length ? (
        <FadeIn className="eva-market-list">
          <div className="eva-market-columns" aria-hidden="true">
            <span>Source</span>
            <span>Forecast</span>
            <span>Status</span>
            <span>Volume</span>
            <span>Action</span>
          </div>
          {filteredMarkets.map((market, index) => {
            const uiStatus = marketUiStatus(market);

            return (
              <article className="eva-market-row" data-testid="market-signal-card" key={market.marketId}>
                <span className="eva-market-index">S{index + 1}</span>
                <Link href={`/markets/${market.marketId}`} className="eva-market-identity">
                  <small>{market.category} · {providerLabel(market.provider)}</small>
                  <h2>{market.title}</h2>
                </Link>
                <div className="eva-market-forecast">
                  {market.outcomes.length ? market.outcomes.slice(0, 2).map((outcome) => (
                    <span key={outcome.outcomeId}>
                      <small>{outcome.label}</small>
                      <strong>{formatOdds(outcome.price)}</strong>
                    </span>
                  )) : <span><small>Odds</small><strong>—</strong></span>}
                </div>
                <span className={statusClassName(uiStatus)}>{statusLabel(uiStatus)}</span>
                <span className="eva-market-volume">{formatUsd(market.volumeUsd)}</span>
                <div className="eva-market-actions">
                  <Link href={`/compose?marketId=${market.marketId}`}>Use in thesis</Link>
                  <Link href={`/markets/${market.marketId}`} aria-label={`Review signal: ${market.title}`}>→</Link>
                </div>
              </article>
            );
          })}
        </FadeIn>
      ) : (
        <p className="eva-empty-row">No markets match this search.</p>
      )}

      <section className="eva-source-process" aria-label="From market to proof">
        <span>From market to proof</span>
        {[
          ["Source", "Capture the live forecast."],
          ["Claim", "State the mechanism it informs."],
          ["Trigger", "Define what would change the view."],
          ["Anchor", "Preserve the published history."],
        ].map(([title, body], index) => (
          <div key={title}>
            <i>{(index + 1).toString().padStart(2, "0")}</i>
            <strong>{title}</strong>
            <small>{body}</small>
          </div>
        ))}
      </section>
    </PageShell>
  );
}
