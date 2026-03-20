"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getProtocolStats, getCuratorAddresses, getCuratorInfo, type ProtocolStats } from "@/lib/contract";

const flowSteps = [
  {
    title: "Curators stake $EVA",
    description: "Registration starts with skin in the game. Curation is an economic act, not a free spam channel.",
    tone: "138, 216, 192",
    icon: "1",
  },
  {
    title: "Articles enter the trust graph",
    description: "Curators submit URLs they want the network to evaluate and stand behind.",
    tone: "133, 203, 218",
    icon: "2",
  },
  {
    title: "Eva verifies claims",
    description: "The backend fetches content, extracts factual claims, checks evidence, and produces a verifiable report.",
    tone: "156, 183, 235",
    icon: "3",
  },
  {
    title: "Trust compounds into distribution",
    description: "Over time, accurate curators become the highest-signal nodes in the feed and broader protocol surface.",
    tone: "243, 154, 142",
    icon: "4",
  },
] as const;

const productSurface = [
  {
    primitive: "Feed",
    mapping: "Live verified articles",
    detail: "A chronological feed of every article that has been through the verification pipeline.",
  },
  {
    primitive: "Curators",
    mapping: "Trust-ranked participants",
    detail: "A live leaderboard of registered curators with trust scores and verification history.",
  },
  {
    primitive: "Verify",
    mapping: "Verification API surface",
    detail: "The x402-gated endpoint for submitting articles and receiving scored evidence reports.",
  },
  {
    primitive: "Evalanche",
    mapping: "Agent wallet infrastructure",
    detail: "The signing and identity stack that will replace hard-coded private keys with agent-native wallets.",
  },
] as const;

const builtOn = [
  {
    title: "Avalanche C-Chain",
    description: "Fast finality and predictable fees for trust-graph staking and evidence-linked state changes.",
    tone: "133, 203, 218",
  },
  {
    title: "ERC-8004 registries",
    description: "Identity, validation, and reputation receipts remain legible to other agent-native tools and services.",
    tone: "178, 149, 206",
  },
  {
    title: "Provider abstractions",
    description: "LLM (Anthropic/gateway), storage (Pinata/local), and signer (private-key/Evalanche) swap without touching the pipeline.",
    tone: "198, 244, 89",
  },
] as const;

export default function AboutPage() {
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [curatorCount, setCuratorCount] = useState<number | null>(null);
  const [avgTrust, setAvgTrust] = useState<number | null>(null);

  useEffect(() => {
    getProtocolStats().then(setStats);
    getCuratorAddresses().then(async (addresses) => {
      setCuratorCount(addresses.length);
      if (addresses.length > 0) {
        const infos = await Promise.all(addresses.map((address) => getCuratorInfo(address)));
        const avg = Math.round(infos.reduce((sum, curator) => sum + curator.trustScore, 0) / infos.length);
        setAvgTrust(avg);
      }
    });
  }, []);

  return (
    <>
      <Nav />

      <main className="page-shell">
        <section className="hero">
          <span className="hero-kicker">Protocol overview</span>
          <h1 className="hero-title">Eva is building trust-weighted news distribution.</h1>
          <p className="hero-sub">
            The core product is simple: curators stake $EVA behind sources, Eva verifies the evidence, and the
            network turns consistent accuracy into on-chain reputation. The trust graph becomes the feed.
          </p>
          <div className="hero-actions">
            <Link href="/verify" className="btn btn-primary">
              See verification surface
            </Link>
            <Link href="/curators" className="btn btn-ghost">
              See curator graph
            </Link>
          </div>
        </section>

        <section className="protocol-stats grid-3" style={{ marginTop: "18px" }}>
          <div className="surface stat-card">
            <span className="stat-value">{stats ? stats.totalArticles : "—"}</span>
            <span className="stat-label">Articles verified</span>
          </div>
          <div className="surface stat-card">
            <span className="stat-value">{curatorCount ?? "—"}</span>
            <span className="stat-label">Active curators</span>
          </div>
          <div className="surface stat-card">
            <span className="stat-value">{avgTrust !== null ? avgTrust : "—"}</span>
            <span className="stat-label">Average trust score</span>
          </div>
        </section>

        <section style={{ marginTop: "40px" }}>
          <p className="section-kicker">How it works</p>
          <h2 className="section-title">Four steps from article to trust update</h2>
          <div className="grid-2" style={{ marginTop: "16px" }}>
            {flowSteps.map((step) => (
              <article
                key={step.title}
                className="surface step-card"
                style={{ background: `linear-gradient(145deg, rgba(${step.tone}, 0.22), rgba(255, 255, 255, 0.88))` }}
              >
                <h3>
                  <span className="icon-pill">{step.icon}</span>
                  {step.title}
                </h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: "44px" }}>
          <p className="section-kicker">Current product surface</p>
          <h2 className="section-title">What is live today</h2>
          <div className="grid-2" style={{ marginTop: "16px" }}>
            {productSurface.map((item) => (
              <article key={item.primitive} className="surface built-card">
                <h3>
                  {item.primitive} → {item.mapping}
                </h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: "44px" }}>
          <p className="section-kicker">Built on</p>
          <h2 className="section-title">Composable infrastructure, cleaner architecture</h2>
          <div className="grid-3" style={{ marginTop: "16px" }}>
            {builtOn.map((item) => (
              <article
                key={item.title}
                className="surface built-card"
                style={{ background: `linear-gradient(145deg, rgba(${item.tone}, 0.18), rgba(255, 255, 255, 0.9))` }}
              >
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface callout">
          <h3>North-star behavior</h3>
          <p>
            Eva becomes useful when curator reputation is reliable enough that agents and people can delegate
            attention to it. The job is not just verification accuracy — it is making high-signal curation economically legible.
          </p>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
