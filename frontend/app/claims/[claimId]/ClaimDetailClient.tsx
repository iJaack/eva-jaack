"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import {
  getClaimDetail,
  getClaimSettlementPreview,
  previewClaimChallenge,
  previewClaimStake,
  type MarketClaimDetail,
} from "@/lib/api";
import type {
  ClaimChallengePreviewResponse,
  ClaimSettlementPreviewResponse,
  ClaimStakePreviewResponse,
} from "../../../../backend/src/lib/api-types";

function formatTimestamp(value: string | null): string {
  if (!value) return "Pending";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ClaimDetailClient() {
  const params = useParams();
  const claimId = params.claimId as string;
  const [claim, setClaim] = useState<MarketClaimDetail | null>(null);
  const [settlementPreview, setSettlementPreview] = useState<ClaimSettlementPreviewResponse | null>(null);
  const [stakePreview, setStakePreview] = useState<ClaimStakePreviewResponse | null>(null);
  const [challengePreview, setChallengePreview] = useState<ClaimChallengePreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState("100000000000000000000");
  const [challengeBond, setChallengeBond] = useState("50000000000000000000");

  useEffect(() => {
    if (!claimId) return;

    Promise.all([getClaimDetail(claimId), getClaimSettlementPreview(claimId)])
      .then(([detail, preview]) => {
        setClaim(detail);
        setSettlementPreview(preview);
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Failed to load claim.");
      })
      .finally(() => setLoading(false));
  }, [claimId]);

  const requestStakePreview = () => {
    startTransition(() => {
      previewClaimStake(claimId, {
        amount: stakeAmount,
        verdict: "verified",
        confidenceBand: 78,
      })
        .then((preview) => setStakePreview(preview))
        .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to preview stake."));
    });
  };

  const requestChallengePreview = () => {
    startTransition(() => {
      previewClaimChallenge(claimId, {
        bondAmount: challengeBond,
      })
        .then((preview) => setChallengePreview(preview))
        .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to preview challenge."));
    });
  };

  return (
    <>
      <Nav />
      <main className="page-shell">
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <Link href="/claims" className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>
            ← Back to Claims
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : error || !claim ? (
          <div className="surface" style={{ padding: 28 }}>
            <h2 style={{ marginTop: 0 }}>Claim unavailable</h2>
            <p style={{ color: "var(--muted)" }}>{error ?? `Claim ${claimId} could not be loaded.`}</p>
          </div>
        ) : (
          <>
            <section className="surface claim-detail-header">
              <div className="claim-card-top">
                <span className="blog-meta-pill">Claim</span>
                <span className="claim-card-status">{titleCase(claim.status)}</span>
              </div>
              <h1 className="claim-detail-title">{claim.title}</h1>
              <p className="blog-post-dek">{claim.claimText}</p>
              <div className="claim-card-meta">
                <span>{claim.source.platform.toUpperCase()}</span>
                <span>{formatTimestamp(claim.createdAt)}</span>
                <span>{claim.marketEnabled ? "Market live" : "Market staged"}</span>
              </div>
            </section>

            <section className="claim-detail-grid">
              <div className="claim-detail-main">
                <article className="surface claim-panel">
                  <h2>Source context</h2>
                  <p className="claim-muted">
                    {claim.source.url ? (
                      <a href={claim.source.url} target="_blank" rel="noreferrer">
                        {claim.source.url}
                      </a>
                    ) : (
                      claim.source.ref
                    )}
                  </p>
                  <p className="claim-muted">
                    {claim.context ?? "No additional context packet yet. The backend will attach richer evidence as the channel matures."}
                  </p>
                </article>

                <article className="surface claim-panel">
                  <h2>Machine assessment</h2>
                  {claim.machineAssessment ? (
                    <>
                      <p className="claim-badge-row">
                        <span className="claim-inline-badge">{titleCase(claim.machineAssessment.verdict)}</span>
                        <span className="claim-muted">{claim.machineAssessment.confidence}% confidence</span>
                      </p>
                      <p className="claim-muted">{claim.machineAssessment.summary}</p>
                    </>
                  ) : (
                    <p className="claim-muted">No machine assessment packet has been attached yet.</p>
                  )}
                </article>

                <article className="surface claim-panel">
                  <h2>Evidence and timeline</h2>
                  {claim.evidenceLinks.length > 0 ? (
                    <div className="claim-link-list">
                      {claim.evidenceLinks.map((link) => (
                        <a key={link} href={link} target="_blank" rel="noreferrer">
                          {link}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="claim-muted">No evidence links attached yet.</p>
                  )}
                  <div className="claim-timeline">
                    {claim.timeline.map((entry) => (
                      <div key={`${entry.label}-${entry.at}`} className="claim-timeline-item">
                        <strong>{entry.label}</strong>
                        <span>{formatTimestamp(entry.at)}</span>
                        <p>{entry.note}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <aside className="claim-detail-side">
                <article className="surface claim-panel">
                  <h2>Settlement preview</h2>
                  <div className="claim-key-value">
                    <span>Participants</span>
                    <strong>{settlementPreview?.participantCount ?? 0}</strong>
                  </div>
                  <div className="claim-key-value">
                    <span>Leading verdict</span>
                    <strong>{settlementPreview?.leadingVerdict ? titleCase(settlementPreview.leadingVerdict) : "None yet"}</strong>
                  </div>
                  <div className="claim-key-value">
                    <span>Total stake</span>
                    <strong>{settlementPreview?.totalStake ?? "0"}</strong>
                  </div>
                </article>

                <article className="surface claim-panel">
                  <h2>Stake preview</h2>
                  <label className="claim-input-group">
                    <span>Stake amount (wei)</span>
                    <input value={stakeAmount} onChange={(event) => setStakeAmount(event.target.value)} />
                  </label>
                  <button className="btn btn-primary" type="button" onClick={requestStakePreview}>
                    Preview verified stake
                  </button>
                  {stakePreview ? (
                    <div className="claim-preview-output">
                      <div className="claim-key-value">
                        <span>Minimum stake</span>
                        <strong>{stakePreview.minimumStake}</strong>
                      </div>
                      <div className="claim-key-value">
                        <span>Review deadline</span>
                        <strong>{formatTimestamp(stakePreview.reviewDeadline)}</strong>
                      </div>
                      {stakePreview.warnings.length > 0 ? (
                        <p className="claim-warning">{stakePreview.warnings[0]}</p>
                      ) : null}
                    </div>
                  ) : null}
                </article>

                <article className="surface claim-panel">
                  <h2>Challenge preview</h2>
                  <label className="claim-input-group">
                    <span>Bond amount (wei)</span>
                    <input value={challengeBond} onChange={(event) => setChallengeBond(event.target.value)} />
                  </label>
                  <button className="btn btn-ghost" type="button" onClick={requestChallengePreview}>
                    Preview challenge
                  </button>
                  {challengePreview ? (
                    <div className="claim-preview-output">
                      <div className="claim-key-value">
                        <span>Minimum bond</span>
                        <strong>{challengePreview.minimumChallengeBond}</strong>
                      </div>
                      <div className="claim-key-value">
                        <span>Window ends</span>
                        <strong>{formatTimestamp(challengePreview.challengeWindowEnd)}</strong>
                      </div>
                      {challengePreview.warnings.length > 0 ? (
                        <p className="claim-warning">{challengePreview.warnings[0]}</p>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              </aside>
            </section>
          </>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
