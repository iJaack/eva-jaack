"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import TrustScore from "@/components/TrustScore";
import ArticleCard from "@/components/ArticleCard";
import SiteFooter from "@/components/SiteFooter";
import { getCuratorDetail, type CuratorDetail } from "@/lib/api";
import { protocol } from "@/lib/protocol";

function formatDate(ts: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CuratorProfile() {
  const params = useParams();
  const address = params.address as string;
  const [detail, setDetail] = useState<CuratorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    getCuratorDetail(address)
      .then(setDetail)
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Failed to load curator.");
      })
      .finally(() => setLoading(false));
  }, [address]);

  const curator = detail?.curator ?? null;
  const articles = detail?.articles ?? [];

  return (
    <>
      <Nav />
      <main className="page-shell">
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <Link href="/curators" className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>
            ← Back to Curators
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : error || !curator || !curator.registered ? (
          <div className="surface" style={{ padding: 32, textAlign: "center" }}>
            <h2>Curator not found</h2>
            <p style={{ color: "var(--muted)" }}>{error ?? `Address ${address} is not a registered curator.`}</p>
          </div>
        ) : (
          <>
            <div className="curator-profile surface" style={{ padding: 24 }}>
              <div className="curator-profile-header">
                <TrustScore score={curator.trustScore} size={120} label="Trust Score" />
                <div className="curator-profile-info">
                  <h1 style={{ margin: 0, fontSize: "clamp(18px, 2.5vw, 28px)", fontFamily: "var(--mono)" }}>
                    {curator.address}
                  </h1>
                  <div className="curator-profile-meta">
                    <div className="profile-stat">
                      <span className="profile-stat-value">#{curator.curatorAgentId}</span>
                      <span className="profile-stat-label">Agent ID</span>
                    </div>
                    <div className="profile-stat">
                      <span className="profile-stat-value">{curator.articleCount}</span>
                      <span className="profile-stat-label">Articles</span>
                    </div>
                    <div className="profile-stat">
                      <span className="profile-stat-value">{formatDate(curator.registeredAt)}</span>
                      <span className="profile-stat-label">Registered</span>
                    </div>
                  </div>
                  <a
                    href={`${protocol.chain.explorerUrl}/address/${curator.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost"
                    style={{ fontSize: 13, padding: "8px 16px", marginTop: 12 }}
                  >
                    View on Snowtrace →
                  </a>
                </div>
              </div>
            </div>

            {articles.length > 0 && (
              <section style={{ marginTop: 32 }}>
                <p className="section-kicker">Curated Articles</p>
                <h2 className="section-title" style={{ fontSize: "clamp(22px, 3vw, 36px)" }}>
                  {articles.length} Article{articles.length !== 1 ? "s" : ""} Submitted
                </h2>
                <div className="grid-2" style={{ marginTop: 16 }}>
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
