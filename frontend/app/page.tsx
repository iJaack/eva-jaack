"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import ArticleCard from "@/components/ArticleCard";
import TrustScore from "@/components/TrustScore";
import SiteFooter from "@/components/SiteFooter";
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

const explainerCards = [
  {
    title: "Back curators, not just content",
    body: "Following is economic. You back curators with $EVA, and their track record determines what rises in your feed.",
  },
  {
    title: "Verify claims with receipts",
    body: "Eva extracts factual claims, checks evidence, stores reports to IPFS, and records trust updates on Avalanche.",
  },
  {
    title: "Portable on-chain reputation",
    body: "Curator identity, validation history, and trust signals are ERC-8004 compatible so agents can carry reputation across apps.",
  },
] as const;

const workflow = [
  {
    step: "01",
    title: "Register as a curator",
    body: "Stake $EVA to enter the trust graph and start building a measurable record of accuracy.",
  },
  {
    step: "02",
    title: "Submit an article",
    body: "Curators publish a source they vouch for. The protocol stores the request and routes it through Eva's verification pipeline.",
  },
  {
    step: "03",
    title: "Eva verifies the claims",
    body: "Claims are extracted, checked against on-chain/off-chain evidence, scored, stored, and optionally written back on-chain.",
  },
  {
    step: "04",
    title: "Trust drives distribution",
    body: "Higher-trust curators get more credibility, better visibility, and stronger utility inside the $EVA-backed social graph.",
  },
] as const;

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function HomePage() {
  const [stats, setStats] = useState<ProtocolStats | null>(null);
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

        const validArticles = allArticles
          .filter((article) => article.sourceURI && article.sourceURI.length > 0)
          .sort((a, b) => b.verifiedAt - a.verifiedAt);
        setArticles(validArticles);

        if (addresses.length > 0) {
          const infos = await Promise.all(
            addresses.map(async (addr) => {
              const info = await getCuratorInfo(addr);
              return { ...info, address: addr };
            })
          );

          infos.sort((a, b) => b.trustScore - a.trustScore);
          setCurators(infos);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const avgTrust = useMemo(() => {
    if (curators.length === 0) return null;
    return Math.round(curators.reduce((sum, curator) => sum + curator.trustScore, 0) / curators.length);
  }, [curators]);

  const featuredArticles = articles.slice(0, 4);
  const featuredCurators = curators.slice(0, 5);

  return (
    <>
      <Nav />

      <main className="page-shell">
        <section className="hero hero-grid">
          <div>
            <span className="hero-kicker">Phase 1.5 live on Avalanche</span>
            <h1 className="hero-title">A social news network where truth has stake.</h1>
            <p className="hero-sub">
              Eva Protocol turns news curation into an on-chain trust graph. Curators stake $EVA to back
              claims, Eva verifies the evidence, and reputation compounds into distribution.
            </p>
            <div className="hero-actions">
              <Link href="/verify" className="btn btn-primary">
                Verify an article
              </Link>
              <Link href="/curators" className="btn btn-ghost">
                Explore curators
              </Link>
              <Link href="/about" className="btn btn-ghost">
                How it works
              </Link>
            </div>
          </div>

          <aside className="surface hero-panel">
            <p className="hero-panel-kicker">What the product actually does</p>
            <ul className="hero-checklist">
              <li>Trust-ranks news through curator performance, not engagement bait.</li>
              <li>Writes verification context to IPFS and validation/reputation receipts to Avalanche.</li>
              <li>Uses Eva agent #1599 as the protocol oracle for claim extraction and scoring.</li>
              <li>Builds a portable curator reputation layer around ERC-8004 primitives.</li>
            </ul>
          </aside>
        </section>

        <section className="grid-3 stats-grid-home">
          <div className="surface stat-card home-stat-card">
            <span className="stat-value">{stats ? stats.totalArticles : "—"}</span>
            <span className="stat-label">Verified articles</span>
          </div>
          <div className="surface stat-card home-stat-card">
            <span className="stat-value">{curators.length || "—"}</span>
            <span className="stat-label">Registered curators</span>
          </div>
          <div className="surface stat-card home-stat-card">
            <span className="stat-value">{avgTrust ?? "—"}</span>
            <span className="stat-label">Average trust score</span>
          </div>
        </section>

        <section style={{ marginTop: 40 }}>
          <p className="section-kicker">Product surface</p>
          <h2 className="section-title">Why Eva exists</h2>
          <div className="grid-3" style={{ marginTop: 16 }}>
            {explainerCards.map((card) => (
              <article key={card.title} className="surface built-card">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 44 }}>
          <p className="section-kicker">Workflow</p>
          <h2 className="section-title">How verification flows through the protocol</h2>
          <div className="grid-2" style={{ marginTop: 16 }}>
            {workflow.map((item) => (
              <article key={item.step} className="surface step-card">
                <h3>
                  <span className="icon-pill">{item.step}</span>
                  {item.title}
                </h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface callout" style={{ marginTop: 40 }}>
          <h3>What makes Eva different?</h3>
          <p>
            Feeds usually optimize for reach. Eva optimizes for verified accuracy. Curators don&apos;t just post — they
            stake capital, accumulate trust, and become measurable information sources for humans and agents.
          </p>
        </section>

        <section className="home-section-split" style={{ marginTop: 44 }}>
          <div>
            <div className="section-heading-row">
              <div>
                <p className="section-kicker">Live feed</p>
                <h2 className="section-title section-title-sm">Latest verified articles</h2>
              </div>
              <Link href="/articles" className="section-link">View all</Link>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
              </div>
            ) : featuredArticles.length === 0 ? (
              <p className="empty-copy">No verified articles yet.</p>
            ) : (
              <div className="grid-2" style={{ marginTop: 16 }}>
                {featuredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="section-heading-row">
              <div>
                <p className="section-kicker">Leaderboard</p>
                <h2 className="section-title section-title-sm">Top curators</h2>
              </div>
              <Link href="/curators" className="section-link">See all</Link>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
              </div>
            ) : featuredCurators.length === 0 ? (
              <p className="empty-copy">No curators registered yet.</p>
            ) : (
              <div className="curator-list" style={{ marginTop: 16 }}>
                {featuredCurators.map((curator) => (
                  <Link key={curator.address} href={`/curator/${curator.address}`} className="curator-card surface">
                    <TrustScore score={curator.trustScore} size={56} />
                    <div className="curator-card-info">
                      <h3 className="curator-card-address">{truncateAddress(curator.address)}</h3>
                      <div className="curator-card-meta">
                        <span>Agent #{curator.curatorAgentId.toString()}</span>
                        <span>{curator.articleCount} articles</span>
                        <span>Trust {curator.trustScore}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
