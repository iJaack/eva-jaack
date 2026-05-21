"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getArticles, getCurators } from "@/lib/api";

const flowSteps = [
  {
    title: "Predictors post theses",
    description: "A thesis records the market, selected outcome, odds snapshot, rationale, and source context.",
    toneClass: "tone-mint",
    icon: "1",
  },
  {
    title: "Eva stores the record",
    description: "Markets, theses, counters, source links, and copy intent stay readable in the product surface.",
    toneClass: "tone-sky",
    icon: "2",
  },
  {
    title: "Evidence supports calls",
    description: "Source verification and claim pages remain useful when they make a prediction easier to inspect.",
    toneClass: "tone-periwinkle",
    icon: "3",
  },
  {
    title: "Trust compounds later",
    description: "Resolved outcomes can feed graph-backed reputation when a predictor links an Eva identity.",
    toneClass: "tone-coral",
    icon: "4",
  },
] as const;

const productSurface = [
  {
    primitive: "Markets",
    mapping: "Prediction context",
    detail: "External markets provide odds. Eva adds theses, counters, evidence, and predictor records.",
  },
  {
    primitive: "Predictors",
    mapping: "Trust-ranked participants",
    detail: "Profiles can start unclaimed, then become graph-backed when a user links wallet and agent identity.",
  },
  {
    primitive: "Verify",
    mapping: "Evidence tool",
    detail: "The live endpoint for checking source URLs before or after publishing a prediction thesis.",
  },
  {
    primitive: "EvaTrustGraph",
    mapping: "Canonical trust primitive",
    detail: "Registered curator identities are reinterpreted as graph-backed predictors in the new product surface.",
  },
] as const;

const builtOn = [
  {
    title: "Avalanche C-Chain",
    description: "Fast finality and predictable fees for trust-graph staking and evidence-linked state changes.",
    toneClass: "tone-sky",
  },
  {
    title: "ERC-8004 registries",
    description: "Identity, validation, and reputation receipts remain legible to other agent-native tools and services.",
    toneClass: "tone-periwinkle",
  },
  {
    title: "Provider abstractions",
    description: "LLM (Anthropic/gateway), storage (Pinata/local), and signer (private-key/Evalanche) swap without touching the pipeline.",
    toneClass: "tone-lime",
  },
] as const;

export default function AboutPage() {
  const [articleCount, setArticleCount] = useState<number | null>(null);
  const [curatorCount, setCuratorCount] = useState<number | null>(null);
  const [avgTrust, setAvgTrust] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getArticles(), getCurators()]).then(([articles, curators]) => {
      setArticleCount(articles.count);
      setCuratorCount(curators.count);
      if (curators.curators.length > 0) {
        const avg = Math.round(
          curators.curators.reduce((sum, curator) => sum + curator.trustScore, 0) / curators.curators.length
        );
        setAvgTrust(avg);
      }
    });
  }, []);

  return (
    <>
      <Nav />

      <main id="main-content" className="page-shell">
        <section className="hero">
          <span className="hero-kicker">Protocol Notes</span>
          <h1 className="hero-title">EvaTrustGraph now backs prediction reputation.</h1>
          <p className="hero-sub">
            Eva is a product surface for markets, theses, evidence, and predictor records. The trust primitive
            underneath is durable identity, stake, and reputation for people who earn trust. Market odds are forecasts; resolution status is tracked separately.
          </p>
          <div className="hero-actions">
            <Link href="/markets" className="btn btn-primary">
              See markets
            </Link>
            <Link href="/predictors" className="btn btn-ghost">
              See predictors
            </Link>
          </div>
        </section>

        <section className="protocol-stats grid-3">
          <div className="surface stat-card">
            <span className="stat-value">{articleCount ?? "—"}</span>
            <span className="stat-label">Source reports</span>
          </div>
          <div className="surface stat-card">
            <span className="stat-value">{curatorCount ?? "—"}</span>
            <span className="stat-label">Graph identities</span>
          </div>
          <div className="surface stat-card">
            <span className="stat-value">{avgTrust !== null ? avgTrust : "—"}</span>
            <span className="stat-label">Average trust score</span>
          </div>
        </section>

        <section className="route-section">
          <p className="section-kicker">How it works</p>
          <h2 className="section-title">Four steps from market call to trust update</h2>
          <div className="grid-2 section-grid">
            {flowSteps.map((step) => (
              <article
                key={step.title}
                className={`surface step-card ${step.toneClass}`}
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

        <section className="route-section">
          <p className="section-kicker">Current product surface</p>
          <h2 className="section-title">What the product shows</h2>
          <div className="grid-2 section-grid">
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

        <section className="route-section">
          <p className="section-kicker">Built on</p>
          <h2 className="section-title">Composable infrastructure, cleaner architecture</h2>
          <div className="grid-3 section-grid">
            {builtOn.map((item) => (
              <article
                key={item.title}
                className={`surface built-card ${item.toneClass}`}
              >
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface callout">
          <h3>Product behavior</h3>
          <p>
            Eva becomes useful when predictor reputation is reliable enough that people can follow, copy, and
            challenge market calls without losing the evidence trail behind them.
          </p>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
