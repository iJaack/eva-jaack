"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
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

type SignalUpdateDraft = {
  currentOddsPercent: string;
  weight: string;
  status: "open" | "closed" | "resolved" | "cancelled";
  resolvedOutcomeLabel: string;
};

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

function signalDraftFor(signal: ReturnType<typeof predictionSignals>[number]): SignalUpdateDraft {
  return {
    currentOddsPercent: String(Math.round(signal.currentOdds * 100)),
    weight: String(signal.weight),
    status: signal.status,
    resolvedOutcomeLabel: signal.resolvedOutcomeLabel ?? "",
  };
}

function clampPercent(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, parsed));
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

type TimelineAction = Thesis["timeline"][number]["action"];
type TimelineFilter = "all" | TimelineAction;

const timelineFilters: Array<{ value: TimelineFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "created", label: "Created" },
  { value: "revised", label: "Revised" },
  { value: "signal_added", label: "Signal added" },
  { value: "signal_updated", label: "Signal updated" },
  { value: "anchored", label: "Anchored" },
  { value: "resolved", label: "Resolved" },
];

function timelineActionLabel(action: TimelineAction): string {
  return timelineFilters.find((filter) => filter.value === action)?.label ?? action.replace(/_/g, " ");
}

function timelineFilterCount(thesis: Thesis, filter: TimelineFilter): number {
  if (filter === "all") return thesis.timeline.length;
  return thesis.timeline.filter((entry) => entry.action === filter).length;
}

function thesisShareText(thesis: Thesis): string {
  const signalLabel = thesis.signals.length === 1 ? "signal" : "signals";
  return `Tracking v${thesis.currentRevision.version} of "${thesis.title}" on Eva (score ${thesis.currentScore}, ${thesis.signals.length} ${signalLabel}, revision history visible).`;
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
  const [signalUpdateDrafts, setSignalUpdateDrafts] = useState<Record<string, SignalUpdateDraft>>({});
  const [updatePending, setUpdatePending] = useState(false);
  const [revisionAnchorPreparationId, setRevisionAnchorPreparationId] = useState<string | null>(null);
  const [revisionAnchorTxHash, setRevisionAnchorTxHash] = useState("");
  const [revisionAnchorPending, setRevisionAnchorPending] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!thesisId) return;
    getThesisDetail(thesisId)
      .then(setDetail)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load thesis."))
      .finally(() => setLoading(false));
  }, [thesisId]);

  useEffect(() => {
    if (!detail) return;
    setSignalUpdateDrafts(Object.fromEntries(predictionSignals(detail.thesis).map((signal) => [signal.signalId, signalDraftFor(signal)])));
  }, [detail]);

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

    const nextSignalUpdates = predictionSignals(detail.thesis).map((signal) => {
      const draft = signalUpdateDrafts[signal.signalId] ?? signalDraftFor(signal);
      return {
        signalId: signal.signalId,
        currentOdds: clampPercent(draft.currentOddsPercent, signal.currentOdds * 100) / 100,
        weight: clampPercent(draft.weight, signal.weight),
        status: draft.status,
        resolvedOutcomeLabel: draft.resolvedOutcomeLabel.trim() || undefined,
      };
    });

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
      signalUpdates: nextSignalUpdates,
    };
  };

  const validateResolvedSignals = () => {
    if (!detail) return true;
    const missingOutcome = predictionSignals(detail.thesis).some((signal) => {
      const draft = signalUpdateDrafts[signal.signalId] ?? signalDraftFor(signal);
      return draft.status === "resolved" && !draft.resolvedOutcomeLabel.trim();
    });

    if (!missingOutcome) return true;
    setUpdateState("Resolved signals need an outcome label before preparing an update.");
    return false;
  };

  const resetRevisionAnchor = () => {
    setRevisionAnchorPreparationId(null);
    setRevisionAnchorTxHash("");
    setUpdateState(null);
  };

  const prepareUpdateAnchor = async () => {
    if (!detail) return;
    const input = buildRevisionInput();
    if (!input) return;
    if (!validateResolvedSignals()) return;

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
    if (!validateResolvedSignals()) return;
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
  const timelineEntries = detail
    ? [...detail.thesis.timeline]
        .filter((entry) => timelineFilter === "all" || entry.action === timelineFilter)
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    : [];

  return (
    <PageShell className="thesis-detail-shell">
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
          <FadeIn className="thesis-publication-layout">
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
                  href={`https://x.com/intent/post?text=${encodeURIComponent(thesisShareText(detail.thesis))}&url=${encodeURIComponent(`${protocol.app.siteUrl}/thesis/${detail.thesis.thesisId}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Share current revision on X
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
                        <span>{signal.kind === "prediction_market" ? `${humanize(signal.role)} · ${humanize(signal.status)}` : `fact · ${humanize(signal.verifierVerdict)}`}</span>
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
                {predictionSignals(detail.thesis).length > 0 ? (
                  <div className="attached-signal-list" data-testid="revision-signal-controls">
                    {predictionSignals(detail.thesis).map((signal, index) => {
                      const draft = signalUpdateDrafts[signal.signalId] ?? signalDraftFor(signal);
                      const label = signalLabel(index);
                      const updateDraft = (patch: Partial<SignalUpdateDraft>) => {
                        setSignalUpdateDrafts((drafts) => ({
                          ...drafts,
                          [signal.signalId]: { ...(drafts[signal.signalId] ?? signalDraftFor(signal)), ...patch },
                        }));
                        resetRevisionAnchor();
                      };

                      return (
                        <article key={signal.signalId} className="thesis-signal-card">
                          <div className="card-topline">
                            <span>{label}</span>
                            <span>{signal.title}</span>
                          </div>
                          <label className="field-group">
                            <span className="field-label">{label} current odds (%)</span>
                            <input
                              className="field-input"
                              type="number"
                              inputMode="decimal"
                              min="0"
                              max="100"
                              step="1"
                              value={draft.currentOddsPercent}
                              onChange={(event) => updateDraft({ currentOddsPercent: event.target.value })}
                            />
                          </label>
                          <label className="field-group">
                            <span className="field-label">{label} weight</span>
                            <input
                              className="field-input"
                              type="number"
                              inputMode="decimal"
                              min="0"
                              max="100"
                              step="1"
                              value={draft.weight}
                              onChange={(event) => updateDraft({ weight: event.target.value })}
                            />
                          </label>
                          <label className="field-group">
                            <span className="field-label">{label} status</span>
                            <select className="field-input" value={draft.status} onChange={(event) => updateDraft({ status: event.target.value as SignalUpdateDraft["status"] })}>
                              <option value="open">Open</option>
                              <option value="closed">Closed</option>
                              <option value="resolved">Resolved</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </label>
                          {draft.status === "resolved" ? (
                            <label className="field-group">
                              <span className="field-label">{label} resolved outcome</span>
                              <input className="field-input" value={draft.resolvedOutcomeLabel} onChange={(event) => updateDraft({ resolvedOutcomeLabel: event.target.value })} placeholder={signal.selectedOutcomeLabel} />
                            </label>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
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

            <section className="prediction-card thesis-timeline-panel">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Activity trail</p>
                  <h2 className="section-title section-title-sm">Thesis timeline</h2>
                </div>
                <span className="status-chip status-chip-unresolved">{detail.thesis.timeline.length} events</span>
              </div>
              <div className="filter-bar" aria-label="Timeline filters">
                {timelineFilters.map((filter) => {
                  const count = timelineFilterCount(detail.thesis, filter.value);

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      className={`filter-chip${timelineFilter === filter.value ? " filter-chip-active" : ""}`}
                      onClick={() => setTimelineFilter(filter.value)}
                      disabled={count === 0}
                    >
                      {filter.label} <span>{count}</span>
                    </button>
                  );
                })}
              </div>
              {timelineEntries.length > 0 ? (
                <div className="thesis-timeline-list" data-testid="thesis-timeline-list">
                  {timelineEntries.map((entry) => (
                    <article key={entry.timelineId} className="timeline-card" data-testid="timeline-card">
                      <div className="card-topline">
                        <span>{timelineActionLabel(entry.action)}</span>
                        <span>{formatDate(entry.at)}</span>
                      </div>
                      <h3>{entry.note ?? `${timelineActionLabel(entry.action)} event`}</h3>
                      <div className="status-row">
                        <span className="status-chip status-chip-forecast">Before {entry.scoreBefore ?? "new"}</span>
                        <span className="status-chip status-chip-unresolved">After {entry.scoreAfter}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="inline-note">No timeline events match this filter yet.</p>
              )}
            </section>
          </FadeIn>
        )}
    </PageShell>
  );
}
