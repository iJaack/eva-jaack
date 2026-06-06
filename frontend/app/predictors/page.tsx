"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getPredictors, type Predictor } from "@/lib/api";

const rankingLoop = ["Read thesis", "Inspect signals", "Check revisions", "Draft response"] as const;

export default function PredictorsPage() {
  const [predictors, setPredictors] = useState<Predictor[]>([]);
  const [profileFilter, setProfileFilter] = useState<"all" | Predictor["profileState"]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPredictors()
      .then((response) => setPredictors(response.predictors))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load predictors."))
      .finally(() => setLoading(false));
  }, []);

  const filteredPredictors = profileFilter === "all"
    ? predictors
    : predictors.filter((predictor) => predictor.profileState === profileFilter);
  const graphBackedCount = predictors.filter((predictor) => predictor.profileState === "registered").length;

  return (
    <>
      <Nav />
      <main id="main-content" className="mobile-shell">
        <section className="mobile-page-head">
          <p className="eyebrow">Author records</p>
          <h1>Judge predictors by their thesis trail.</h1>
          <p>Eva separates activity from proven accuracy. Read the public theses, inspect their signals, and only treat resolved outcomes as performance evidence.</p>
          <ul className="route-proof-list" aria-label="Author record rules">
            <li>Activity is separate from accuracy</li>
            <li>X plus wallet establishes authorship</li>
            <li>Thesis history comes before ranking</li>
          </ul>
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
          <>
            <section className="prediction-card route-panel">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Reputation desk</p>
                  <h2 className="section-title section-title-sm">Who is publishing thesis work</h2>
                </div>
                <span className="status-chip status-chip-unresolved">{graphBackedCount} graph-backed</span>
              </div>
              <p className="market-boundary-note">
                Trust score is an identity and activity signal. Forecast accuracy is promoted only when outcomes resolve through evidence or resolver windows.
              </p>
              <div className="quest-line quest-line-compact" aria-label="Predictor participation loop">
                {rankingLoop.map((step, index) => (
                  <span key={step} className="quest-line-step">
                    <strong>{index + 1}</strong>
                    {step}
                  </span>
                ))}
              </div>
              <div className="filter-bar" aria-label="Predictor filters">
                <button
                  type="button"
                  className={`filter-chip${profileFilter === "all" ? " filter-chip-active" : ""}`}
                  onClick={() => setProfileFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`filter-chip${profileFilter === "registered" ? " filter-chip-active" : ""}`}
                  onClick={() => setProfileFilter("registered")}
                >
                  Wallet-linked
                </button>
                <button
                  type="button"
                  className={`filter-chip${profileFilter === "unclaimed" ? " filter-chip-active" : ""}`}
                  onClick={() => setProfileFilter("unclaimed")}
                >
                  Record-only
                </button>
              </div>
            </section>

            <section className="predictor-list predictor-list-large">
              {filteredPredictors.map((predictor) => (
                <Link key={predictor.predictorId} href={`/predictors/${predictor.predictorId}`} className="prediction-card predictor-card">
                  <div className="card-topline">
                    <span>{predictor.handle}</span>
                    <span className={predictor.profileState === "registered" ? "status-chip status-chip-verified" : "status-chip status-chip-unresolved"}>
                      {predictor.profileState === "registered" ? "Wallet-linked" : "Record-only"}
                    </span>
                  </div>
                  <div className="predictor-card-score">
                    <strong>{predictor.trustScore}</strong>
                    <span>Eva score</span>
                  </div>
                  <div className="odds-row">
                    <div>
                      <span>Open forecasts</span>
                      <strong>{predictor.openTheses}</strong>
                    </div>
                    <div>
                      <span>Resolved accuracy</span>
                      <strong>{predictor.accuracy === null ? "—" : `${predictor.accuracy}%`}</strong>
                    </div>
                    <div>
                      <span>Copied</span>
                      <strong>{predictor.copiedTheses}</strong>
                    </div>
                  </div>
                </Link>
              ))}
              {filteredPredictors.length === 0 ? (
                <article className="prediction-card empty-state-card">
                  <h2>No predictors in this view</h2>
                  <p>Switch filters or wait for a new thesis record.</p>
                </article>
              ) : null}
            </section>
          </>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
