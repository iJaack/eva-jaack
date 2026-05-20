"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getPredictorDetail, type PredictionPredictorDetail } from "@/lib/api";

function formatOdds(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function PredictorDetailClient() {
  const params = useParams();
  const id = params.id as string;
  const [detail, setDetail] = useState<PredictionPredictorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPredictorDetail(id)
      .then(setDetail)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load predictor."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <Nav />
      <main className="mobile-shell">
        <div className="back-row">
          <Link href="/predictors" className="section-link">Back to predictors</Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : error || !detail ? (
          <section className="prediction-card">
            <h2>Predictor unavailable</h2>
            <p>{error ?? "This predictor could not be loaded."}</p>
          </section>
        ) : (
          <>
            <section className="mobile-page-head predictor-detail-head">
              <p className="eyebrow">{detail.predictor.profileState === "registered" ? "Graph-backed" : "Unclaimed predictor profile"}</p>
              <h1>{detail.predictor.handle}</h1>
              <p>
                {detail.predictor.profileState === "registered"
                  ? "This predictor is linked to an Eva trust graph identity."
                  : "This product record can be claimed later by connecting a wallet and Eva identity."}
                {" "}Forecast records and truth or resolution status remain separate.
              </p>
            </section>

            <section className="mobile-metrics">
              <div>
                <strong>{detail.predictor.trustScore}</strong>
                <span>trust</span>
              </div>
              <div>
                <strong>{detail.predictor.accuracy === null ? "—" : `${detail.predictor.accuracy}%`}</strong>
                <span>accuracy</span>
              </div>
              <div>
                <strong>{detail.predictor.copiedTheses}</strong>
                <span>copied</span>
              </div>
            </section>

            <section className="prediction-card">
              <h2>Two-layer reputation</h2>
              <div className="record-layers">
                <div>
                  <span>Eva Trust Score</span>
                  <strong>{detail.predictor.trustScore}</strong>
                  <p>Canonical graph state from registered identity and reputation receipts.</p>
                </div>
                <div>
                  <span>Resolution Record</span>
                  <strong>{detail.predictor.bestCategory ?? "Pending"}</strong>
                  <p>Offchain thesis stats stay separate from resolved outcomes until evidence can feed reputation.</p>
                </div>
              </div>
              {detail.predictor.profileState === "unclaimed" ? (
                <Link className="mobile-action mobile-action-primary claim-profile-action" href="/curators/register">
                  Claim with Eva identity
                </Link>
              ) : null}
            </section>

            <section className="prediction-section">
              <p className="section-kicker">Theses</p>
              <div className="thesis-stack">
                {detail.theses.map((thesis) => (
                  <Link key={thesis.thesisId} href={`/thesis/${thesis.thesisId}`} className="prediction-card thesis-list-item">
                    <div className="card-topline">
                      <span>{thesis.selectedOutcomeLabel}</span>
                      <span>{thesis.copiedCount} copied</span>
                    </div>
                    <h2>{formatOdds(thesis.oddsAtPost)} at post</h2>
                    <p>{thesis.rationale}</p>
                  </Link>
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
