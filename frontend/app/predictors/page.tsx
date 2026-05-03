"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getPredictors, type Predictor } from "@/lib/api";

export default function PredictorsPage() {
  const [predictors, setPredictors] = useState<Predictor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPredictors()
      .then((response) => setPredictors(response.predictors))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load predictors."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Nav />
      <main className="mobile-shell">
        <section className="mobile-page-head">
          <p className="eyebrow">Predictors</p>
          <h1>Trust graph identity plus market record.</h1>
          <p>Registered predictors inherit Eva trust. Unclaimed X profiles can build a record before connecting a wallet.</p>
        </section>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : error ? (
          <section className="prediction-card">
            <h2>Predictors unavailable</h2>
            <p>{error}</p>
          </section>
        ) : (
          <section className="predictor-list predictor-list-large">
            {predictors.map((predictor) => (
              <Link key={predictor.predictorId} href={`/predictors/${predictor.predictorId}`} className="prediction-card predictor-card">
                <div className="card-topline">
                  <span>{predictor.handle}</span>
                  <span>{predictor.profileState === "registered" ? "Registered" : "Unclaimed"}</span>
                </div>
                <div className="predictor-card-score">
                  <strong>{predictor.trustScore}</strong>
                  <span>Eva Trust Score</span>
                </div>
                <div className="odds-row">
                  <div>
                    <span>Open</span>
                    <strong>{predictor.openTheses}</strong>
                  </div>
                  <div>
                    <span>Accuracy</span>
                    <strong>{predictor.accuracy === null ? "—" : `${predictor.accuracy}%`}</strong>
                  </div>
                  <div>
                    <span>Copied</span>
                    <strong>{predictor.copiedTheses}</strong>
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
