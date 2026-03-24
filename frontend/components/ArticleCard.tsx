"use client";

import Link from "next/link";
import type { Article } from "@/lib/api";
import { ScoreBadge } from "./TrustScore";

const STATUS_LABELS = ["Pending", "Verified", "Rejected"] as const;
const STATUS_COLORS = ["#f5b731", "#34a853", "#e74c3c"] as const;

function formatDate(ts: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function extractDomain(uri: string): string {
  try {
    return new URL(uri).hostname.replace(/^www\./, "");
  } catch {
    return uri.slice(0, 40);
  }
}

export default function ArticleCard({ article }: { article: Article }) {
  const statusLabel = STATUS_LABELS[article.status] ?? "Unknown";
  const statusColor = STATUS_COLORS[article.status] ?? "#888";

  return (
    <Link href={`/article/${article.id}`} className="article-card surface">
      <div className="article-card-header">
        <span className="article-domain">{extractDomain(article.sourceURI)}</span>
        <span
          className="status-badge"
          style={{
            background: `${statusColor}18`,
            color: statusColor,
            borderColor: `${statusColor}40`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="article-card-meta">
        <ScoreBadge score={article.verificationScore} label="Score" />
        {article.validationTag && (
          <span className="tag-pill">{article.validationTag}</span>
        )}
      </div>

      <div className="article-card-dates">
        <span>Submitted {formatDate(article.submittedAt)}</span>
        {article.verifiedAt > 0 && (
          <span>Verified {formatDate(article.verifiedAt)}</span>
        )}
      </div>
    </Link>
  );
}
