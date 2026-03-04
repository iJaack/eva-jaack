"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Address } from "viem";
import Nav from "@/components/Nav";
import TrustScore from "@/components/TrustScore";
import ArticleCard from "@/components/ArticleCard";
import { getCuratorInfo, getAllArticles, type CuratorInfo, type Article } from "@/lib/contract";

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
  const [curator, setCurator] = useState<CuratorInfo | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    (async () => {
      try {
        const [info, allArticles] = await Promise.all([
          getCuratorInfo(address as Address),
          getAllArticles(),
        ]);
        setCurator(info);
        setArticles(
          allArticles
            .filter((a) => a.curator.toLowerCase() === address.toLowerCase())
            .sort((a, b) => b.verifiedAt - a.verifiedAt)
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

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
        ) : !curator || !curator.registered ? (
          <div className="surface" style={{ padding: 32, textAlign: "center" }}>
            <h2>Curator not found</h2>
            <p style={{ color: "var(--muted)" }}>
              Address {address} is not a registered curator.
            </p>
          </div>
        ) : (
          <>
            <div className="curator-profile surface" style={{ padding: 24 }}>
              <div className="curator-profile-header">
                <TrustScore score={curator.trustScore} size={120} label="Trust Score" />
                <div className="curator-profile-info">
                  <h1 style={{ margin: 0, fontSize: "clamp(18px, 2.5vw, 28px)", fontFamily: "var(--mono)" }}>
                    {address}
                  </h1>
                  <div className="curator-profile-meta">
                    <div className="profile-stat">
                      <span className="profile-stat-value">#{curator.curatorAgentId.toString()}</span>
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
                    href={`https://snowtrace.io/address/${address}`}
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
                  {articles.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <footer className="footer">
          <span>Built by Eva (Agent #1599) and Jaack.</span>
        </footer>
      </main>
    </>
  );
}
