"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
import SectionHeader from "@/components/ui/SectionHeader";
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
    <PageShell>
      <div className="back-row">
        <Link href="/predictors" className="section-link">
          Back to predictors
        </Link>
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
          <SectionHeader
            eyebrow={detail.predictor.profileState === "registered" ? "Wallet-linked author" : "Record-only author profile"}
            title={detail.predictor.handle}
            description={
              detail.predictor.profileState === "registered"
                ? "This author has a public X label and wallet trail. Published thesis activity and resolved accuracy remain separate."
                : "This public record can be linked later by connecting X and a wallet. Published thesis activity and resolved accuracy remain separate."
            }
          />

          <FadeIn className="mobile-metrics">
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
          </FadeIn>

          <section className="prediction-card">
            <h2>Author record</h2>
            <div className="record-layers">
              <div>
                <span>Eva score</span>
                <strong>{detail.predictor.trustScore}</strong>
                <p>Record from wallet-linked identity, thesis history, and resolved outcomes.</p>
              </div>
              <div>
                <span>Resolution record</span>
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
    </PageShell>
  );
}
