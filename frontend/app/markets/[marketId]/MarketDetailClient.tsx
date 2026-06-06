"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getMarketDetail, type PredictionMarketDetail } from "@/lib/api";
import { marketUiStatus, statusClassName, statusLabel, thesisUiStatus } from "@/lib/status";

function formatOdds(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function MarketDetailClient() {
  const params = useParams();
  const marketId = params.marketId as string;
  const [detail, setDetail] = useState<PredictionMarketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!marketId) return;
    getMarketDetail(marketId)
      .then(setDetail)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load market."))
      .finally(() => setLoading(false));
  }, [marketId]);

  return (
    <>
      <Nav />
      <main id="main-content" className="mobile-shell">
        <div className="back-row">
          <Link href="/markets" className="section-link">Back to markets</Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : error || !detail ? (
          <section className="prediction-card">
            <h2>Market unavailable</h2>
            <p>{error ?? "This market could not be loaded."}</p>
          </section>
        ) : (
          <>
            <section className="mobile-page-head market-detail-head">
              <p className="eyebrow">{detail.market.category}</p>
              <h1>{detail.market.title}</h1>
              <p>Use this market as a thesis signal. Eva keeps the market forecast separate from the thesis, its citations, and its revision history.</p>
              <div className="status-row">
                <span className="status-chip status-chip-forecast">Odds forecast</span>
                <span className={statusClassName(marketUiStatus(detail.market))}>{statusLabel(marketUiStatus(detail.market))}</span>
              </div>
            </section>

            <section className="prediction-card market-detail-signal-panel">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Selected source</p>
                  <h2 className="section-title section-title-sm">Use this market as a thesis signal</h2>
                </div>
              </div>
              <div className="market-outcomes market-outcomes-large">
                {detail.market.outcomes.map((outcome) => (
                  <div key={outcome.outcomeId}>
                    <span>{outcome.label}</span>
                    <strong>{formatOdds(outcome.price)}</strong>
                  </div>
                ))}
              </div>
              <div className="sticky-action-row">
                <Link className="mobile-action mobile-action-primary" href={`/compose?marketId=${detail.market.marketId}`}>
                  Use in thesis
                </Link>
                {detail.market.url ? (
                  <a className="mobile-action" href={detail.market.url} target="_blank" rel="noreferrer">
                    Open venue
                  </a>
                ) : null}
              </div>
            </section>

            <section className="prediction-section">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Theses</p>
                  <h2 className="section-title section-title-sm">Theses using this signal</h2>
                </div>
              </div>
              <div className="thesis-stack">
                {detail.theses.length === 0 ? (
                  <p className="empty-copy">No theses yet. Be first to attach a call.</p>
                ) : (
                  detail.theses.map((thesis) => (
                    <Link key={thesis.thesisId} href={`/thesis/${thesis.thesisId}`} className="prediction-card thesis-list-item">
                      <div className="card-topline">
                        <span>{thesis.author.xHandle}</span>
                        <span className={statusClassName(thesisUiStatus(thesis))}>{statusLabel(thesisUiStatus(thesis))}</span>
                      </div>
                      <h2>{thesis.title}</h2>
                      <p>{thesis.body}</p>
                      <div className="odds-row">
                        <div>
                          <span>Score</span>
                          <strong>{thesis.currentScore}</strong>
                        </div>
                        <div>
                          <span>Signals</span>
                          <strong>{thesis.signals.length}</strong>
                        </div>
                        <div>
                          <span>Revision</span>
                          <strong>v{thesis.currentRevision.version}</strong>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
