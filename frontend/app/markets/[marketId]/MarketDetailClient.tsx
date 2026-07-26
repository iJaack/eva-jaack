"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
import SectionHeader from "@/components/ui/SectionHeader";
import { getMarketDetail, type PredictionMarketDetail } from "@/lib/api";
import { marketUiStatus, statusClassName, statusLabel, thesisUiStatus } from "@/lib/status";

function formatOdds(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function MarketDetailClient({ marketId: providedMarketId }: { marketId?: string } = {}) {
  const params = useParams<{ marketId?: string }>();
  const marketId = providedMarketId ?? params.marketId ?? "";
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
    <PageShell>
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
          <div className="market-detail-layout">
            <SectionHeader
              className="market-detail-head"
              eyebrow={detail.market.category}
              title={detail.market.title}
              description="Use this market as one cited signal inside a broader thesis. Eva keeps the venue forecast separate from the article, its facts, and its revision history."
            >
              <div className="status-row">
                <span className="status-chip status-chip-forecast">Odds forecast</span>
                <span className={statusClassName(marketUiStatus(detail.market))}>{statusLabel(marketUiStatus(detail.market))}</span>
              </div>
            </SectionHeader>

            <FadeIn className="prediction-card market-detail-signal-panel card-spotlight">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Selected source</p>
                  <h2 className="section-title section-title-sm">Turn this market into a citation</h2>
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
            </FadeIn>

            <section className="prediction-section">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Theses</p>
                  <h2 className="section-title section-title-sm">Public arguments using this signal</h2>
                </div>
              </div>
              <div className="thesis-stack">
                {detail.theses.length === 0 ? (
                  <p className="empty-copy">No theses yet. Be first to attach this market as source material.</p>
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
          </div>
        )}
    </PageShell>
  );
}
