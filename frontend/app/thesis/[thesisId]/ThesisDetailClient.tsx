"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getCopyPreview, getThesisDetail, type PredictionThesisDetail } from "@/lib/api";
import { protocol } from "@/lib/protocol";
import { statusClassName, statusLabel, thesisUiStatus } from "@/lib/status";

function formatOdds(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function ThesisDetailClient() {
  const params = useParams();
  const thesisId = params.thesisId as string;
  const [detail, setDetail] = useState<PredictionThesisDetail | null>(null);
  const [copyState, setCopyState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!thesisId) return;
    getThesisDetail(thesisId)
      .then(setDetail)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load thesis."))
      .finally(() => setLoading(false));
  }, [thesisId]);

  const previewCopy = async () => {
    const preview = await getCopyPreview(thesisId);
    setCopyState(preview.warning);
  };

  return (
    <>
      <Nav />
      <main className="mobile-shell thesis-detail-shell">
        <div className="back-row">
          <Link href="/markets" className="section-link">Back to markets</Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : error || !detail ? (
          <section className="prediction-card">
            <h2>Thesis unavailable</h2>
            <p>{error ?? "This thesis could not be loaded."}</p>
          </section>
        ) : (
          <>
            <section className="mobile-page-head thesis-hero">
              <p className="eyebrow">{detail.predictor.handle}</p>
              <h1>{detail.thesis.selectedOutcomeLabel} on {detail.market.title}</h1>
              <div className="status-row">
                <span className="status-chip status-chip-forecast">Odds forecast</span>
                <span className={statusClassName(thesisUiStatus(detail.thesis))}>{statusLabel(thesisUiStatus(detail.thesis))}</span>
              </div>
              <div className="odds-row odds-row-hero">
                <div>
                  <span>Posted odds</span>
                  <strong>{formatOdds(detail.thesis.oddsAtPost)}</strong>
                </div>
                <div>
                  <span>Current odds</span>
                  <strong>{formatOdds(detail.thesis.currentOdds)}</strong>
                </div>
                <div>
                  <span>Trust</span>
                  <strong>{detail.predictor.trustScore}</strong>
                </div>
              </div>
            </section>

            <section className="prediction-card">
              <div className="card-topline">
                <Link href={`/predictors/${detail.predictor.predictorId}`} className="handle-link">
                  {detail.predictor.handle}
                </Link>
                <span>{detail.predictor.profileState === "registered" ? "Graph-backed" : "Unclaimed"}</span>
              </div>
              <h2>Rationale</h2>
              <p>{detail.thesis.rationale}</p>
              <p className="market-boundary-note">
                This is a forecast thesis. Evidence links can support or dispute it, but truth status only changes through resolution.
              </p>
              {detail.thesis.evidenceLinks.length > 0 ? (
                <div className="evidence-list">
                  {detail.thesis.evidenceLinks.map((link) => (
                    <a key={link} href={link} target="_blank" rel="noreferrer">
                      {link}
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="sticky-action-row">
                <Link className="mobile-action" href="/verify">
                  Check another source
                </Link>
              </div>
            </section>

            <section className="prediction-card">
              <h2>Market record layers</h2>
              <div className="record-layers">
                <div>
                  <span>Eva Trust Score</span>
                  <strong>{detail.predictor.trustScore}</strong>
                  <p>Canonical graph-backed identity and trust.</p>
                </div>
                <div>
                  <span>Resolution Record</span>
                  <strong>{detail.predictor.accuracy === null ? "Pending" : `${detail.predictor.accuracy}%`}</strong>
                  <p>Forecast stats stay pending until outcomes resolve separately.</p>
                </div>
              </div>
            </section>

            {detail.counters.length > 0 ? (
              <section className="prediction-section">
                <p className="section-kicker">Counters</p>
                <div className="thesis-stack">
                  {detail.counters.map((counter) => (
                    <Link key={counter.thesisId} href={`/thesis/${counter.thesisId}`} className="prediction-card thesis-list-item">
                      <div className="card-topline">
                        <span>{counter.authorHandle}</span>
                        <span>{counter.selectedOutcomeLabel}</span>
                      </div>
                      <p>{counter.rationale}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mobile-bottom-actions">
              <button className="mobile-action mobile-action-primary" type="button" onClick={previewCopy}>
                Preview copy
              </button>
              <Link className="mobile-action" href={`/compose?counterTo=${detail.thesis.thesisId}&marketId=${detail.market.marketId}`}>
                Counter
              </Link>
              <a
                className="mobile-action"
                href={`https://x.com/intent/post?text=${encodeURIComponent(`Tracking this prediction on Eva: ${detail.market.title}`)}&url=${encodeURIComponent(`${protocol.app.siteUrl}/thesis/${detail.thesis.thesisId}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Share
              </a>
            </div>
            {copyState ? <p className="inline-note">{copyState}</p> : null}
          </>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
