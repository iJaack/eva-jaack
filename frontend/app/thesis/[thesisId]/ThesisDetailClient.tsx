"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getCopyPreview, getThesisDetail, prepareThesisAnchor, type PredictionThesisDetail, type Thesis } from "@/lib/api";
import { protocol } from "@/lib/protocol";
import { scoreUiStatus, statusClassName, statusLabel, thesisUiStatus } from "@/lib/status";

function formatOdds(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function predictionSignals(thesis: Thesis) {
  return thesis.signals.filter((signal) => signal.kind === "prediction_market");
}

function factSignals(thesis: Thesis) {
  return thesis.signals.filter((signal) => signal.kind === "fact");
}

export default function ThesisDetailClient() {
  const params = useParams();
  const thesisId = params.thesisId as string;
  const [detail, setDetail] = useState<PredictionThesisDetail | null>(null);
  const [copyState, setCopyState] = useState<string | null>(null);
  const [anchorState, setAnchorState] = useState<string | null>(null);
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

  const previewAnchor = async () => {
    try {
      const prepared = await prepareThesisAnchor(thesisId);
      setAnchorState(`${prepared.transactions.length} unsigned protocol transactions prepared. Broadcast still requires approval.`);
    } catch (reason) {
      setAnchorState(reason instanceof Error ? reason.message : "Unable to prepare protocol transactions.");
    }
  };

  return (
    <>
      <Nav />
      <main id="main-content" className="mobile-shell thesis-detail-shell">
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
              <p className="eyebrow">{detail.thesis.author.xHandle}</p>
              <h1>{detail.thesis.title}</h1>
              <p>{detail.thesis.body}</p>
              <div className="status-row">
                <span className={statusClassName(scoreUiStatus(detail.thesis.currentScore))}>Score {detail.thesis.currentScore}</span>
                <span className={statusClassName(thesisUiStatus(detail.thesis))}>{statusLabel(thesisUiStatus(detail.thesis))}</span>
                <span className="status-chip status-chip-forecast">Anchor {detail.thesis.anchor.status}</span>
              </div>
              <div className="odds-row odds-row-hero">
                <div>
                  <span>Signals</span>
                  <strong>{detail.thesis.signals.length}</strong>
                </div>
                <div>
                  <span>Revision</span>
                  <strong>v{detail.thesis.currentRevision.version}</strong>
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
                <span>{detail.predictor.profileState === "registered" ? "Graph-backed" : "Wallet-linked"}</span>
              </div>
              <h2>Market signals</h2>
              <div className="thesis-stack">
                {predictionSignals(detail.thesis).map((signal) => (
                  <article key={signal.signalId} className="prediction-card thesis-list-item">
                    <div className="card-topline">
                      <span>{signal.role.replace(/_/g, " ")}</span>
                      <span>{signal.status}</span>
                    </div>
                    <h3>{signal.title}</h3>
                    <p>{signal.rationale ?? "No signal note yet."}</p>
                    <div className="odds-row">
                      <div>
                        <span>Outcome</span>
                        <strong>{signal.selectedOutcomeLabel}</strong>
                      </div>
                      <div>
                        <span>Added</span>
                        <strong>{formatOdds(signal.oddsAtAdd)}</strong>
                      </div>
                      <div>
                        <span>Now</span>
                        <strong>{formatOdds(signal.currentOdds)}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="prediction-card">
              <h2>Fact signals</h2>
              <div className="thesis-stack">
                {factSignals(detail.thesis).length === 0 ? (
                  <p className="empty-copy">No factual signals attached yet.</p>
                ) : (
                  factSignals(detail.thesis).map((signal) => (
                    <article key={signal.signalId} className="prediction-card thesis-list-item">
                      <div className="card-topline">
                        <span>{signal.verifierVerdict.replace(/_/g, " ")}</span>
                        <span>Score {signal.verifierScore}</span>
                      </div>
                      <h3>{signal.claimText}</h3>
                      {signal.sourceUrl ? (
                        <a href={signal.sourceUrl} target="_blank" rel="noreferrer">
                          {signal.sourceUrl}
                        </a>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="prediction-card">
              <h2>Revision history</h2>
              <div className="thesis-stack">
                {detail.thesis.timeline.map((entry) => (
                  <article key={entry.timelineId} className="thesis-list-item">
                    <div className="card-topline">
                      <span>{entry.action.replace(/_/g, " ")}</span>
                      <span>{new Date(entry.at).toLocaleDateString()}</span>
                    </div>
                    <p>{entry.note}</p>
                    <div className="status-row">
                      <span className="status-chip status-chip-forecast">Before {entry.scoreBefore ?? "new"}</span>
                      <span className="status-chip status-chip-unresolved">After {entry.scoreAfter}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <div className="mobile-bottom-actions">
              <button className="mobile-action mobile-action-primary" type="button" onClick={previewCopy}>
                Preview copy
              </button>
              <Link className="mobile-action" href={`/compose?counterTo=${detail.thesis.thesisId}`}>
                Build from this
              </Link>
              <button className="mobile-action" type="button" onClick={previewAnchor}>
                Prepare anchor
              </button>
              <a
                className="mobile-action"
                href={`https://x.com/intent/post?text=${encodeURIComponent(`Tracking this evolving thesis on Eva: ${detail.thesis.title}`)}&url=${encodeURIComponent(`${protocol.app.siteUrl}/thesis/${detail.thesis.thesisId}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Share
              </a>
            </div>
            {copyState ? <p className="inline-note">{copyState}</p> : null}
            {anchorState ? <p className="inline-note">{anchorState}</p> : null}
          </>
        )}
        <SiteFooter />
      </main>
    </>
  );
}
