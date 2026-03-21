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

const whatEvaDoes = [
  {
    title: "Curators stake to curate",
    body: "Curators lock $EVA tokens to register on the trust graph. Staking aligns incentives: curators with skin in the game produce better signal.",
  },
  {
    title: "Eva verifies the evidence",
    body: "When an article is submitted, Eva extracts every factual claim, checks each against on-chain and off-chain sources, and produces a scored report.",
  },
  {
    title: "Trust compounds on-chain",
    body: "Verification scores flow back into curator reputation via ERC-8004 registries on Avalanche. Accurate curators rise; unreliable ones fall.",
  },
] as const;

const howItWorks = [
  {
    step: "01",
    title: "Register",
    body: "Stake $EVA on Avalanche to join the trust graph and start curating.",
  },
  {
    step: "02",
    title: "Submit",
    body: "Post a source URL you vouch for. Eva queues it for verification.",
  },
  {
    step: "03",
    title: "Verify",
    body: "Eva fetches the article, extracts claims, checks evidence, and stores a report to IPFS.",
  },
  {
    step: "04",
    title: "Distribute",
    body: "Trust scores update on-chain. Higher-trust curators earn more visibility and protocol utility.",
  },
] as const;

const techStack = [
  {
    title: "Avalanche C-Chain",
    body: "Fast finality and low fees for trust-graph state changes and ERC-8004 receipts.",
  },
  {
    title: "ERC-8004 registries",
    body: "Identity, reputation, and validation records that agents and apps can read across the ecosystem.",
  },
  {
    title: "IPFS via Pinata",
    body: "Verification reports are content-addressed and permanently retrievable.",
  },
  {
    title: "x402 payments",
    body: "The public verification API is payment-gated so Eva can operate as an agent service.",
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
        {/* ── Hero ── */}
        <section className="hero hero-grid">
          <div>
            <span className="hero-kicker">Live on Avalanche</span>
            <h1 className="hero-title">
              News curation backed by stake, scored by evidence.
            </h1>
            <p className="hero-sub">
              Eva Protocol is a trust-weighted social news network. Curators stake $EVA to back
              sources, Eva verifies every claim against real evidence, and accuracy compounds into
              on-chain reputation that drives what surfaces in the feed.
            </p>
            <div className="hero-actions">
              <Link href="/verify" className="btn btn-primary">
                Verify an article
              </Link>
              <Link href="/curators/register" className="btn btn-ghost">
                Become a curator
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
            <p className="hero-panel-kicker">Eva in one minute</p>
            <ul className="hero-checklist">
              <li>Curators stake $EVA and submit articles they vouch for.</li>
              <li>Eva extracts factual claims and checks them against on-chain and web evidence.</li>
              <li>Scored reports go to IPFS; trust updates go to Avalanche via ERC-8004.</li>
              <li>The feed ranks by curator accuracy, not engagement.</li>
            </ul>
          </aside>
        </section>

        {/* ── Live stats ── */}
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

        {/* ── What Eva does ── */}
        <section style={{ marginTop: 40 }}>
          <p className="section-kicker">The product</p>
          <h2 className="section-title">What Eva actually does</h2>
          <div className="grid-3" style={{ marginTop: 16 }}>
            {whatEvaDoes.map((card) => (
              <article key={card.title} className="surface built-card">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ marginTop: 44 }}>
          <p className="section-kicker">Workflow</p>
          <h2 className="section-title">From article to trust update in four steps</h2>
          <div className="grid-2" style={{ marginTop: 16 }}>
            {howItWorks.map((item) => (
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

        {/* ── Differentiator callout ── */}
        <section className="surface callout" style={{ marginTop: 40 }}>
          <h3>Why not just another feed?</h3>
          <p>
            Most feeds optimize for engagement. Eva optimizes for verified accuracy. Curators don&apos;t just
            post — they stake capital, build measurable track records, and become trusted information sources
            for both humans and AI agents.
          </p>
        </section>

        {/* ── Tech stack ── */}
        <section style={{ marginTop: 44 }}>
          <p className="section-kicker">Infrastructure</p>
          <h2 className="section-title">What Eva is built on</h2>
          <div className="grid-2" style={{ marginTop: 16 }}>
            {techStack.map((item) => (
              <article key={item.title} className="surface built-card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Latest articles ── */}
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

          {/* ── Top curators ── */}
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
