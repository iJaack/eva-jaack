"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { ScoreBadge } from "@/components/TrustScore";
import TrustScore from "@/components/TrustScore";
import SiteFooter from "@/components/SiteFooter";
import { getArticleDetail, type ArticleDetail } from "@/lib/api";

const STATUS_LABELS = ["Pending", "Verified"] as const;
const STATUS_COLORS = ["#f5b731", "#34a853"] as const;

function formatDate(ts: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function ArticleDetail() {
  const params = useParams();
  const id = Number(params.id);
  const invalidId = !Number.isFinite(id) || id <= 0;
  const [detail, setDetail] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(!invalidId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invalidId) {
      return;
    }

    let cancelled = false;

    getArticleDetail(id)
      .then((result) => {
        if (cancelled) return;
        setDetail(result);
      })
      .catch((reason) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "Failed to load article.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, invalidId]);

  const article = detail?.article ?? null;
  const report = detail?.report ?? null;
  const reportUri = detail?.reportUri ?? null;
  const reportSource = detail?.reportSource ?? "none";
  const statusLabel = article ? (STATUS_LABELS[article.status] ?? "Unknown") : "";
  const statusColor = article ? (STATUS_COLORS[article.status] ?? "#888") : "#888";

  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <div className="back-row">
          <Link href="/articles" className="btn btn-ghost btn-sm">
            ← Back to Articles
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : error || invalidId || !article ? (
          <div className="surface surface-pad centered-note">
            <h2>Article not found</h2>
            <p className="muted-copy">
              {error ?? (invalidId ? "Invalid article ID." : `Article #${id} does not exist.`)}
            </p>
          </div>
        ) : (
          <>
            <div className="article-detail">
              <div className="surface" style={{ padding: 24 }}>
                <div className="article-detail-header">
                  <div>
                    <p className="section-kicker" style={{ marginBottom: 8 }}>On-chain article</p>
                    <h1 style={{ margin: 0, fontSize: "clamp(22px, 3vw, 36px)", letterSpacing: "-0.02em" }}>
                      {report?.title || `Article #${article.id}`}
                    </h1>
                  </div>
                  <span
                    className="status-badge"
                    style={{
                      background: `${statusColor}18`,
                      color: statusColor,
                      borderColor: `${statusColor}40`,
                      fontSize: 14,
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="article-detail-score">
                  <TrustScore score={article.verificationScore} size={100} label="Verification" />
                </div>

                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">Source URL</span>
                    <a href={article.sourceURI} target="_blank" rel="noreferrer" className="detail-value detail-link">
                      {article.sourceURI}
                    </a>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Evidence report</span>
                    {reportUri ? (
                      <a href={reportUri} target="_blank" rel="noreferrer" className="detail-value detail-link">
                        {reportUri}
                      </a>
                    ) : (
                      <span className="detail-value" style={{ color: "var(--muted)" }}>—</span>
                    )}
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Report source</span>
                    <span className="detail-value">{reportSource}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Curator</span>
                    <Link href={`/curator/${article.curator}`} className="detail-value detail-link">
                      {truncateAddress(article.curator)}
                    </Link>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Submitted</span>
                    <span className="detail-value">{formatDate(article.submittedAt)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Verified</span>
                    <span className="detail-value">{formatDate(article.verifiedAt)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Validation Tag</span>
                    <span className="detail-value">
                      {article.validationTag ? <span className="tag-pill">{article.validationTag}</span> : "—"}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Premium lane</span>
                    <span className="detail-value">
                      <ScoreBadge score={article.premium ? 100 : 0} label={article.premium ? "Yes" : "No"} />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <section style={{ marginTop: 24 }}>
              <div className="surface" style={{ padding: 24 }}>
                <p className="section-kicker">Verification report</p>
                {report ? (
                  <>
                    <h2 style={{ marginTop: 0 }}>Claim breakdown</h2>
                    <p style={{ color: "var(--muted)" }}>
                      {report.claims.length} verifiable claim{report.claims.length !== 1 ? "s" : ""} extracted
                      from the source article. Overall score: {report.overallScore}.
                    </p>
                    <div className="register-transaction-stack" style={{ marginTop: 18 }}>
                      {report.claims.map((claim, index) => (
                        <article key={`${claim.claim.text}-${index}`} className="surface tx-card">
                          <div className="tx-card-header">
                            <div>
                              <p className="section-kicker" style={{ marginBottom: 8 }}>Claim {index + 1}</p>
                              <h3 style={{ margin: 0 }}>{claim.claim.text}</h3>
                            </div>
                            <ScoreBadge score={claim.score} />
                          </div>
                          <p style={{ marginTop: 14, color: "var(--muted)" }}>{claim.explanation}</p>
                          <div className="curator-card-meta" style={{ marginTop: 12 }}>
                            <span>Type: {claim.claim.type}</span>
                            <span>Difficulty: {claim.claim.difficulty}</span>
                            <span>Source: {claim.dataSource}</span>
                          </div>
                          {claim.sources.length > 0 ? (
                            <div style={{ marginTop: 14 }}>
                              <p className="section-kicker" style={{ marginBottom: 8 }}>Sources</p>
                              <div className="curator-card-meta">
                                {claim.sources.map((source) => (
                                  <span key={source}>{source}</span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ color: "var(--muted)", margin: 0 }}>
                    No verification report is available yet for this article. Once Eva records an evidence
                    bundle, it will appear here automatically.
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
