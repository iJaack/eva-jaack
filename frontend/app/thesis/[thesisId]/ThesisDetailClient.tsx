"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import {
  getCopyPreview,
  getThesisDetail,
  prepareThesisAnchor,
  prepareThesisRevisionAnchor,
  recordThesisRevision,
  type PredictionThesisDetail,
  type Thesis,
} from "@/lib/api";
import { protocol } from "@/lib/protocol";
import { scoreUiStatus, statusClassName, statusLabel, thesisUiStatus } from "@/lib/status";

function formatOdds(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function predictionSignalCopy(signal: ReturnType<typeof predictionSignals>[number]): string {
  if (signal.status === "resolved") {
    const resolvedOutcome = signal.resolvedOutcomeLabel ? ` as ${signal.resolvedOutcomeLabel}` : "";
    return `${signal.selectedOutcomeLabel} resolved${resolvedOutcome} at final ${formatOdds(signal.currentOdds)}.`;
  }

  if (signal.status === "closed") {
    return `${signal.selectedOutcomeLabel} closed at ${formatOdds(signal.currentOdds)}.`;
  }

  if (signal.status === "cancelled") {
    return `${signal.selectedOutcomeLabel} market was cancelled. Last shown at ${formatOdds(signal.currentOdds)}.`;
  }

  return `${signal.selectedOutcomeLabel} priced at ${formatOdds(signal.currentOdds)}.`;
}

function predictionSignals(thesis: Thesis) {
  return thesis.signals.filter((signal) => signal.kind === "prediction_market");
}

function factSignals(thesis: Thesis) {
  return thesis.signals.filter((signal) => signal.kind === "fact");
}

function signalLabel(index: number): string {
  return `S${index + 1}`;
}

function thesisBodyParagraphs(body: string): string[] {
  return body.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function isTxHash(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value.trim());
}

function scoreDeltaLabel(scoreBefore: number | null, scoreAfter: number): string {
  if (scoreBefore === null) return `Delta new · ${scoreAfter}`;

  const delta = scoreAfter - scoreBefore;
  if (delta === 0) return "Delta ±0";

  return `Delta ${delta > 0 ? "+" : ""}${delta}`;
}

function scoreDeltaClassName(scoreBefore: number | null, scoreAfter: number): string {
  if (scoreBefore === null) return "status-chip status-chip-unresolved";

  const delta = scoreAfter - scoreBefore;
  if (delta > 0) return "status-chip status-chip-verified";
  if (delta < 0) return "status-chip status-chip-disputed";
  return "status-chip status-chip-forecast";
}

type RevisionSignalDraft = {
  currentOdds: string;
  weight: string;
  status: "open" | "closed" | "resolved" | "cancelled";
  resolvedOutcomeLabel: string;
};

function revisionSignalDrafts(thesis: Thesis): Record<string, RevisionSignalDraft> {
  return Object.fromEntries(
    predictionSignals(thesis).map((signal) => [
      signal.signalId,
      {
        currentOdds: String(Math.round(signal.currentOdds * 100)),
        weight: String(signal.weight),
        status: signal.status,
        resolvedOutcomeLabel: signal.resolvedOutcomeLabel ?? "",
      },
    ]),
  );
}

function numberInRange(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export default function ThesisDetailClient() {
  const params = useParams();
  const thesisId = params.thesisId as string;
  const [detail, setDetail] = useState<PredictionThesisDetail | null>(null);
  const [copyState, setCopyState] = useState<string | null>(null);
  const [anchorState, setAnchorState] = useState<string | null>(null);
  const [updateBody, setUpdateBody] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [updateState, setUpdateState] = useState<string | null>(null);
  const [updatePending, setUpdatePending] = useState(false);
  const [revisionAnchorPreparationId, setRevisionAnchorPreparationId] = useState<string | null>(null);
  const [revisionAnchorTxHash, setRevisionAnchorTxHash] = useState("");
  const [revisionAnchorPending, setRevisionAnchorPending] = useState(false);
  const [signalDrafts, setSignalDrafts] = useState<Record<string, RevisionSignalDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!thesisId) return;
    getThesisDetail(thesisId)
      .then((response) => {
        setDetail(response);
        setSignalDrafts(revisionSignalDrafts(response.thesis));
      })
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
      setAnchorState(`${prepared.transactions.length} anchor transaction${prepared.transactions.length === 1 ? "" : "s"} prepared. Broadcast still requires approval.`);
    } catch (reason) {
      setAnchorState(reason instanceof Error ? reason.message : "Unable to prepare protocol transactions.");
    }
  };

  const buildRevisionInput = () => {
    if (!detail || !updateBody.trim()) return;

    const nextVersion = detail.thesis.currentRevision.version + 1;
    const body = `${detail.thesis.body.trim()}\n\nUpdate v${nextVersion}\n${updateBody.trim()}`;

    return {
      dynamicUserId: detail.thesis.author.dynamicUserId,
      xHandle: detail.thesis.author.xHandle,
      xProfileId: detail.thesis.author.xProfileId,
      walletAddress: detail.thesis.author.walletAddress,
      walletSource: detail.thesis.author.walletSource,
      body,
      note: updateNote.trim() || `Published update v${nextVersion}.`,
      signalUpdates: predictionSignals(detail.thesis).map((signal) => ({
        signalId: signal.signalId,
        currentOdds: numberInRange(signalDrafts[signal.signalId]?.currentOdds, Math.round(signal.currentOdds * 100), 1, 99) / 100,
        weight: numberInRange(signalDrafts[signal.signalId]?.weight, signal.weight, 1, 100),
        status: signalDrafts[signal.signalId]?.status ?? signal.status,
        resolvedOutcomeLabel: signalDrafts[signal.signalId]?.resolvedOutcomeLabel.trim() || undefined,
      })),
    };
  };

  const resetRevisionAnchor = () => {
    setRevisionAnchorPreparationId(null);
    setRevisionAnchorTxHash("");
    setUpdateState(null);
  };

  const updateSignalDraft = (signalId: string, patch: Partial<RevisionSignalDraft>) => {
    setSignalDrafts((current) => ({
      ...current,
      [signalId]: {
        currentOdds: current[signalId]?.currentOdds ?? "50",
        weight: current[signalId]?.weight ?? "50",
        status: current[signalId]?.status ?? "open",
        resolvedOutcomeLabel: current[signalId]?.resolvedOutcomeLabel ?? "",
        ...patch,
      },
    }));
    resetRevisionAnchor();
  };

  const prepareUpdateAnchor = async () => {
    if (!detail) return;
    const input = buildRevisionInput();
    if (!input) return;

    setRevisionAnchorPending(true);
    setUpdateState(null);

    try {
      const prepared = await prepareThesisRevisionAnchor(detail.thesis.thesisId, input);
      const transactionLabel = prepared.transactions.length === 1 ? "transaction" : "transactions";
      setRevisionAnchorPreparationId(prepared.anchorPreparationId);
      setRevisionAnchorTxHash("");
      setUpdateState(`${prepared.transactions.length} update anchor ${transactionLabel} prepared.`);
    } catch (reason) {
      setRevisionAnchorPreparationId(null);
      setUpdateState(reason instanceof Error ? reason.message : "Unable to prepare update anchor.");
    } finally {
      setRevisionAnchorPending(false);
    }
  };

  const publishUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail) return;

    const input = buildRevisionInput();
    if (!input) return;
    if (!revisionAnchorPreparationId) {
      setUpdateState("Prepare update anchor before publishing.");
      return;
    }
    if (!isTxHash(revisionAnchorTxHash)) {
      setUpdateState("Confirm update anchor transaction before publishing.");
      return;
    }

    setUpdatePending(true);
    setUpdateState(null);

    try {
      const response = await recordThesisRevision(detail.thesis.thesisId, { ...input, anchorPreparationId: revisionAnchorPreparationId, anchorTxHash: revisionAnchorTxHash.trim() });
      setDetail(response);
      setUpdateBody("");
      setUpdateNote("");
      setRevisionAnchorPreparationId(null);
      setRevisionAnchorTxHash("");
      setUpdateState(`Published update v${response.thesis.currentRevision.version}.`);
    } catch (reason) {
      setRevisionAnchorPreparationId(null);
      setUpdateState(reason instanceof Error ? reason.message : "Unable to publish update.");
    } finally {
      setUpdatePending(false);
    }
  };

  const revisionPublishReady = Boolean(updateBody.trim() && revisionAnchorPreparationId && isTxHash(revisionAnchorTxHash) && !updatePending && !revisionAnchorPending);

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
          <section className="thesis-publication-layout">
            <article className="prediction-card thesis-article-panel">
              <div className="card-topline">
                <Link href={`/predictors/${detail.predictor.predictorId}`} className="handle-link">
                  {detail.thesis.author.xHandle}
                </Link>
                <span>{detail.predictor.profileState === "registered" ? "Wallet-linked" : "Record-only"}</span>
              </div>
              <p className="eyebrow">Public thesis artifact</p>
              <h1>{detail.thesis.title}</h1>
              <div className="status-row">
                <span className={statusClassName(scoreUiStatus(detail.thesis.currentScore))}>Score {detail.thesis.currentScore}</span>
                <span className={statusClassName(thesisUiStatus(detail.thesis))}>{statusLabel(thesisUiStatus(detail.thesis))}</span>
                <span className="status-chip status-chip-forecast">Anchor {detail.thesis.anchor.status}</span>
                <span className="status-chip status-chip-unresolved">v{detail.thesis.currentRevision.version}</span>
              </div>
              <div className="thesis-article-body" data-testid="thesis-body">
                {thesisBodyParagraphs(detail.thesis.body).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
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
              <div className="mobile-bottom-actions thesis-action-row">
                <button className="mobile-action mobile-action-primary" type="button" onClick={previewCopy}>
                  Preview X copy
                </button>
                <Link className="mobile-action" href={`/compose?counterTo=${detail.thesis.thesisId}`}>
                  Draft response
                </Link>
                <button className="mobile-action" type="button" onClick={previewAnchor}>
                  Prepare anchor tx
                </button>
                <a
                  className="mobile-action"
                  href={`https://x.com/intent/post?text=${encodeURIComponent(`Tracking this evolving thesis on Eva: ${detail.thesis.title}`)}&url=${encodeURIComponent(`${protocol.app.siteUrl}/thesis/${detail.thesis.thesisId}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Share on X
                </a>
              </div>
              {copyState ? <p className="inline-note">{copyState}</p> : null}
              {anchorState ? <p className="inline-note">{anchorState}</p> : null}
            </article>

            <aside className="thesis-signal-rail">
              <section className="prediction-card thesis-signal-panel">
                <p className="eyebrow">Citation basket</p>
                <h2>Signals supporting the thesis</h2>
                <div className="attached-signal-list">
                  {detail.thesis.signals.map((signal, index) => (
                    <article key={signal.signalId} className="thesis-signal-card" data-testid="thesis-signal-card">
                      <div className="card-topline">
                        <span>{signalLabel(index)}</span>
                        <span>{signal.kind === "prediction_market" ? humanize(signal.role) : "fact"}</span>
                      </div>
                      <h3>{signal.title}</h3>
                      {signal.kind === "prediction_market" ? (
                        <>
                          <p>{predictionSignalCopy(signal)}</p>
                          <div className="odds-row">
                            <div>
                              <span>Added</span>
                              <strong>{formatOdds(signal.oddsAtAdd)}</strong>
                            </div>
                            <div>
                              <span>Status</span>
                              <strong>{humanize(signal.status)}</strong>
                            </div>
                            <div>
                              <span>Weight</span>
                              <strong>{signal.weight}</strong>
                            </div>
                          </div>
                          {signal.resolvedOutcomeLabel ? <p className="inline-note">Resolved outcome: {signal.resolvedOutcomeLabel}</p> : null}
                        </>
                      ) : (
                        <>
                          <p>{signal.claimText}</p>
                          <p className="inline-note">Fact verdict: {humanize(signal.verifierVerdict)}.</p>
                          <div className="odds-row">
                            <div>
                              <span>Verdict</span>
                              <strong>{humanize(signal.verifierVerdict)}</strong>
                            </div>
                            <div>
                              <span>Score</span>
                              <strong>{signal.verifierScore}</strong>
                            </div>
                          </div>
                          {signal.sourceUrl ? (
                            <a className="section-link" href={signal.sourceUrl} target="_blank" rel="noreferrer">
                              Source evidence
                            </a>
                          ) : null}
                        </>
                      )}
                    </article>
                  ))}
                </div>
              </section>

              <form className="prediction-card thesis-update-panel" onSubmit={publishUpdate}>
                <p className="eyebrow">Author extension</p>
                <h2>Append an update</h2>
                <label className="field-group">
                  <span className="field-label">Update body</span>
                  <textarea
                    className="field-input compose-textarea compose-textarea-small"
                    value={updateBody}
                    onChange={(event) => {
                      setUpdateBody(event.target.value);
                      resetRevisionAnchor();
                    }}
                    required
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Update note</span>
                  <input
                    className="field-input"
                    value={updateNote}
                    onChange={(event) => {
                      setUpdateNote(event.target.value);
                      resetRevisionAnchor();
                    }}
                  />
                </label>
                {predictionSignals(detail.thesis).length ? (
                  <section className="revision-signal-editor" aria-label="Revision signal updates">
                    <div>
                      <p className="eyebrow">Signal updates</p>
                      <h3>Update market state for this revision</h3>
                    </div>
                    {predictionSignals(detail.thesis).map((signal, index) => {
                      const draft = signalDrafts[signal.signalId];
                      return (
                        <div className="revision-signal-row" key={signal.signalId} data-testid="revision-signal-row">
                          <div>
                            <span>{signalLabel(index)}</span>
                            <strong>{signal.title}</strong>
                          </div>
                          <div className="revision-signal-grid">
                            <label className="field-group">
                              <span className="field-label">{signalLabel(index)} current odds</span>
                              <input
                                className="field-input"
                                type="number"
                                min="1"
                                max="99"
                                value={draft?.currentOdds ?? String(Math.round(signal.currentOdds * 100))}
                                onChange={(event) => updateSignalDraft(signal.signalId, { currentOdds: event.target.value })}
                              />
                            </label>
                            <label className="field-group">
                              <span className="field-label">{signalLabel(index)} weight</span>
                              <input
                                className="field-input"
                                type="number"
                                min="1"
                                max="100"
                                value={draft?.weight ?? String(signal.weight)}
                                onChange={(event) => updateSignalDraft(signal.signalId, { weight: event.target.value })}
                              />
                            </label>
                            <label className="field-group">
                              <span className="field-label">{signalLabel(index)} status</span>
                              <select
                                className="field-input"
                                value={draft?.status ?? signal.status}
                                onChange={(event) => updateSignalDraft(signal.signalId, { status: event.target.value as RevisionSignalDraft["status"] })}
                              >
                                <option value="open">Open</option>
                                <option value="closed">Closed</option>
                                <option value="resolved">Resolved</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </label>
                            <label className="field-group">
                              <span className="field-label">{signalLabel(index)} resolved outcome</span>
                              <input
                                className="field-input"
                                value={draft?.resolvedOutcomeLabel ?? signal.resolvedOutcomeLabel ?? ""}
                                onChange={(event) => updateSignalDraft(signal.signalId, { resolvedOutcomeLabel: event.target.value })}
                                placeholder={signal.selectedOutcomeLabel}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                ) : null}
                {revisionAnchorPreparationId ? (
                  <label className="field-group">
                    <span className="field-label">Update anchor transaction hash</span>
                    <input className="field-input" value={revisionAnchorTxHash} onChange={(event) => setRevisionAnchorTxHash(event.target.value)} placeholder="0x..." />
                  </label>
                ) : null}
                <div className="thesis-update-actions">
                  <button className="mobile-action" type="button" onClick={prepareUpdateAnchor} disabled={revisionAnchorPending || updatePending || !updateBody.trim()}>
                    {revisionAnchorPending ? "Preparing..." : "Prepare update anchor"}
                  </button>
                  <button className="mobile-action mobile-action-primary" type="submit" disabled={!revisionPublishReady}>
                    {updatePending ? "Publishing..." : "Publish update"}
                  </button>
                </div>
                {updateState ? <p className="inline-note" role="status">{updateState}</p> : null}
              </form>
            </aside>

            <section className="prediction-card thesis-revision-panel">
              <p className="eyebrow">History</p>
              <h2>Revision history</h2>
              <div className="thesis-revision-list">
                {[...detail.thesis.revisions].reverse().map((revision) => (
                  <article key={revision.revisionId} className="revision-card" data-testid="revision-card">
                    <div className="card-topline">
                      <span>v{revision.version}</span>
                      <span>{formatDate(revision.createdAt)}</span>
                    </div>
                    <h3>{revision.note ?? `Revision ${revision.version}`}</h3>
                    <p>{revision.signalSnapshot.length} signals snapshotted</p>
                    <div className="status-row">
                      <span className="status-chip status-chip-forecast">Before {revision.scoreBefore ?? "new"}</span>
                      <span className="status-chip status-chip-unresolved">After {revision.scoreAfter}</span>
                      <span className={scoreDeltaClassName(revision.scoreBefore, revision.scoreAfter)}>{scoreDeltaLabel(revision.scoreBefore, revision.scoreAfter)}</span>
                      <span className="status-chip status-chip-verified">Anchor {revision.anchor.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>
        )}
        <SiteFooter />
      </main>
    </>
  );
}
