"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { ScoreBadge } from "@/components/TrustScore";
import TrustScore from "@/components/TrustScore";
import { getAllArticles, type Article } from "@/lib/contract";

const STATUS_LABELS = ["Pending", "Verified", "Rejected"] as const;
const STATUS_COLORS = ["#f5b731", "#34a853", "#e74c3c"] as const;

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
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllArticles()
      .then((articles) => {
        const found = articles.find((a) => a.id === id);
        setArticle(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const statusLabel = article ? (STATUS_LABELS[article.status] ?? "Unknown") : "";
  const statusColor = article ? (STATUS_COLORS[article.status] ?? "#888") : "#888";

  return (
    <>
      <Nav />
      <main className="page-shell">
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <Link href="/articles" className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>
            ← Back to Articles
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : !article ? (
          <div className="surface" style={{ padding: 32, textAlign: "center" }}>
            <h2>Article not found</h2>
            <p style={{ color: "var(--muted)" }}>Article #{id} does not exist.</p>
          </div>
        ) : (
          <div className="article-detail">
            <div className="surface" style={{ padding: 24 }}>
              <div className="article-detail-header">
                <h1 style={{ margin: 0, fontSize: "clamp(22px, 3vw, 36px)", letterSpacing: "-0.02em" }}>
                  Article #{article.id}
                </h1>
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
                <TrustScore
                  score={article.verificationScore}
                  size={100}
                  label="Verification"
                />
              </div>

              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Source</span>
                  <a
                    href={article.sourceURI}
                    target="_blank"
                    rel="noreferrer"
                    className="detail-value detail-link"
                  >
                    {article.sourceURI}
                  </a>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Evidence</span>
                  {article.evidenceURI ? (
                    <a
                      href={article.evidenceURI}
                      target="_blank"
                      rel="noreferrer"
                      className="detail-value detail-link"
                    >
                      {article.evidenceURI}
                    </a>
                  ) : (
                    <span className="detail-value" style={{ color: "var(--muted)" }}>—</span>
                  )}
                </div>

                <div className="detail-row">
                  <span className="detail-label">Validation Tag</span>
                  <span className="detail-value">
                    {article.validationTag ? (
                      <span className="tag-pill">{article.validationTag}</span>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Curator</span>
                  <Link
                    href={`/curator/${article.curator}`}
                    className="detail-value detail-link"
                  >
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
                  <span className="detail-label">Article Hash</span>
                  <code className="detail-value detail-hash">{article.articleHash}</code>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Response Hash</span>
                  <code className="detail-value detail-hash">{article.responseHash}</code>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Premium</span>
                  <span className="detail-value">
                    <ScoreBadge score={article.premium ? 100 : 0} label={article.premium ? "Yes" : "No"} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="footer">
          <span>Built by Eva (Agent #1599) and Jaack.</span>
        </footer>
      </main>
    </>
  );
}
