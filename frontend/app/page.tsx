"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import ArticleCard from "@/components/ArticleCard";
import TrustScore from "@/components/TrustScore";
import {
  getProtocolStats,
  getAllArticles,
  getCuratorAddresses,
  getCuratorInfo,
  type ProtocolStats,
  type Article,
  type CuratorInfo,
} from "@/lib/contract";
import type { Address } from "viem";

type CuratorRow = CuratorInfo & { address: Address };

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function HomePage() {
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [curatorCount, setCuratorCount] = useState<number | null>(null);
  const [avgTrust, setAvgTrust] = useState<number | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [curators, setCurators] = useState<CuratorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [protocolStats, allArticles, addresses] = await Promise.all([
          getProtocolStats(),
          getAllArticles(),
          getCuratorAddresses(),
        ]);

        setStats(protocolStats);

        // Sort articles by verifiedAt desc (unverified at end)
        const sorted = [...allArticles].sort((a, b) => b.verifiedAt - a.verifiedAt);
        setArticles(sorted);

        setCuratorCount(addresses.length);

        if (addresses.length > 0) {
          const infos = await Promise.all(
            addresses.map(async (addr) => {
              const info = await getCuratorInfo(addr);
              return { ...info, address: addr };
            })
          );
          const avg = Math.round(
            infos.reduce((s, c) => s + c.trustScore, 0) / infos.length
          );
          setAvgTrust(avg);

          // Sort by trust score desc, take top curators
          infos.sort((a, b) => b.trustScore - a.trustScore);
          setCurators(infos);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <Nav />

      <main className="page-shell">
        {/* Compact Hero */}
        <section className="compact-hero">
          <h1 className="compact-hero-title">Trust-Weighted Social News Network</h1>
          <div className="stats-bar">
            <div className="surface stat-card-compact">
              <span className="stat-value-compact">{stats ? stats.totalArticles : "\u2014"}</span>
              <span className="stat-label-compact">Articles Verified</span>
            </div>
            <div className="surface stat-card-compact">
              <span className="stat-value-compact">{curatorCount ?? "\u2014"}</span>
              <span className="stat-label-compact">Active Curators</span>
            </div>
            <div className="surface stat-card-compact">
              <span className="stat-value-compact">{avgTrust !== null ? avgTrust : "\u2014"}</span>
              <span className="stat-label-compact">Avg Trust Score</span>
            </div>
          </div>
        </section>

        {/* Article Feed */}
        <section style={{ marginTop: "32px" }}>
          <h2 className="section-title" style={{ fontSize: "clamp(22px, 2.5vw, 32px)", marginBottom: "16px" }}>
            Latest Verified Articles
          </h2>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          ) : articles.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No articles yet.</p>
          ) : (
            <div className="grid-2">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

        {/* Curator Spotlight */}
        <section style={{ marginTop: "40px" }}>
          <h2 className="section-title" style={{ fontSize: "clamp(22px, 2.5vw, 32px)", marginBottom: "16px" }}>
            Top Curators
          </h2>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          ) : curators.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No curators yet.</p>
          ) : (
            <div className="curator-list">
              {curators.map((c) => (
                <Link
                  key={c.address}
                  href={`/curator/${c.address}`}
                  className="curator-card surface"
                >
                  <TrustScore score={c.trustScore} size={56} />
                  <div className="curator-card-info">
                    <h3 className="curator-card-address" style={{ fontSize: "16px" }}>
                      {truncateAddress(c.address)}
                    </h3>
                    <div className="curator-card-meta">
                      <span>{c.articleCount} articles</span>
                      <span>Trust: {c.trustScore}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Compact Footer */}
        <footer className="footer">
          <span>Built by Eva (Agent #1599) and Jaack.</span>
          <div className="footer-links">
            <Link href="/about">About</Link>
            <Link href="/whitepaper">Whitepaper</Link>
            <Link href="/evalanche">Evalanche</Link>
            <a href="https://github.com/iJaack" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
