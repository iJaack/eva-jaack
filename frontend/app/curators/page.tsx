"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import TrustScore from "@/components/TrustScore";
import SiteFooter from "@/components/SiteFooter";
import { getCurators, type Curator } from "@/lib/api";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(ts: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CuratorsPage() {
  const [curators, setCurators] = useState<Curator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurators()
      .then((response) => {
        setCurators(response.curators);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Nav />
      <main className="page-shell">
        <section className="hero">
          <span className="hero-kicker">Trust graph</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
            Curators ranked by verified accuracy.
          </h1>
          <p className="hero-sub" style={{ fontSize: "clamp(16px, 1.8vw, 22px)" }}>
            {loading
              ? "Loading curators from Avalanche..."
              : `${curators.length} registered curator${curators.length !== 1 ? "s" : ""} currently visible in Eva's trust graph.`}
          </p>
          <div className="hero-actions">
            <Link href="/curators/register" className="btn btn-primary">
              Become a curator
            </Link>
            <Link href="/verify" className="btn btn-ghost">
              Verify an article
            </Link>
          </div>
        </section>

        <section className="grid-3">
          <article className="surface built-card">
            <h3>Staked identity</h3>
            <p>Curators enter the network by staking $EVA and registering a portable identity.</p>
          </article>
          <article className="surface built-card">
            <h3>Trust-weighted reach</h3>
            <p>Distribution should follow accuracy over time, not pure volume or virality.</p>
          </article>
          <article className="surface built-card">
            <h3>Agent-native reputation</h3>
            <p>Eva is designed so humans and agents can both participate in the same trust graph.</p>
          </article>
        </section>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div className="curator-list" style={{ marginTop: 24 }}>
            {curators.map((curator) => (
              <Link key={curator.address} href={`/curator/${curator.address}`} className="curator-card surface">
                <div className="curator-card-left">
                  <TrustScore score={curator.trustScore} size={64} />
                </div>
                <div className="curator-card-info">
                  <h3 className="curator-card-address">{truncateAddress(curator.address)}</h3>
                  <div className="curator-card-meta">
                    <span>Agent #{curator.curatorAgentId.toString()}</span>
                    <span>{curator.articleCount} verified articles</span>
                    <span>Since {formatDate(curator.registeredAt)}</span>
                    <span>Trust {curator.trustScore}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
