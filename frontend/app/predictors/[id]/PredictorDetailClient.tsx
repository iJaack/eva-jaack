"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getPredictorDetail, type PredictionPredictorDetail } from "@/lib/api";

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
      <main id="main-content" className="mobile-shell">
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
              <p className="eyebrow">{detail.predictor.profileState === "registered" ? "Wallet-linked" : "Record-only predictor profile"}</p>
              <h1>{detail.predictor.handle}</h1>
              <p>
                {detail.predictor.profileState === "registered"
                  ? "This predictor is linked to an X identity and wallet."
                  : "This product record can be linked later by connecting X and a wallet."}
                {" "}Forecast records and truth or resolution status remain separate.
              </p>
            </section>

            <section className="mobile-metrics">
              <div>
                <strong>{detail.predictor.trustScore}</strong>
                <span>score</span>
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
              <h2>Predictor record</h2>
              <div className="record-layers">
                <div>
                  <span>Eva score</span>
                  <strong>{detail.predictor.trustScore}</strong>
                  <p>App record from wallet-linked identity, thesis history, and resolved outcomes.</p>
                </div>
                <div>
                  <span>Resolution Record</span>
                  <strong>{detail.predictor.bestCategory ?? "Pending"}</strong>
                  <p>Offchain thesis stats stay separate from resolved outcomes until evidence can feed reputation.</p>
                </div>
              </div>
            </section>

            <section className="prediction-section">
              <p className="section-kicker">Theses</p>
              <div className="thesis-stack">
                {detail.theses.map((thesis) => (
                  <Link key={thesis.thesisId} href={`/thesis/${thesis.thesisId}`} className="prediction-card thesis-list-item">
                    <div className="card-topline">
                      <span>Score {thesis.currentScore}</span>
                      <span>{thesis.copiedCount} copied</span>
                    </div>
                    <h2>{thesis.title}</h2>
                    <p>{thesis.body}</p>
                    <div className="status-row">
                      <span className="status-chip status-chip-forecast">{thesis.signals.length} signals</span>
                      <span className="status-chip status-chip-unresolved">v{thesis.currentRevision.version}</span>
                    </div>
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
