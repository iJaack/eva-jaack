"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { getClaims, type MarketClaim } from "@/lib/api";
import { claimUiStatus, statusClassName, statusLabel } from "@/lib/status";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<MarketClaim[]>([]);
  const [marketEnabled, setMarketEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClaims()
      .then((response) => {
        setClaims(response.claims);
        setMarketEnabled(response.marketEnabled);
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Failed to load claims.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Nav />
      <main className="page-shell">
        <section className="hero hero-grid claims-hero">
          <div>
            <span className="hero-kicker">Evidence Queue</span>
            <h1 className="hero-title">Claim bundles that can support prediction theses.</h1>
            <p className="hero-sub">
              Claim bundles stay inspectable here as supporting evidence. They preserve the audit trail behind market
              theses, counters, and source checks without treating market odds as truth.
            </p>
            <div className="hero-actions">
              <Link href="/markets" className="btn btn-primary">
                Browse markets
              </Link>
              <Link href="/compose" className="btn btn-ghost">
                Make a thesis
              </Link>
            </div>
          </div>

          <aside className="surface hero-panel">
            <p className="hero-panel-kicker">Channel state</p>
            <ul className="hero-checklist">
              <li>Claim bundles are still live and durable.</li>
              <li>@evapredicts can turn explicit X commands into thesis or evidence pages.</li>
              <li>Statuses use the evidence vocabulary: unresolved, verified, disputed, resolved, or void.</li>
              <li>{marketEnabled ? "Stake and challenge actions are live." : "Stake and challenge actions are staged until the market contract is deployed."}</li>
            </ul>
          </aside>
        </section>

        <section className="surface callout" style={{ marginTop: 28 }}>
          <h3>Evidence bundles attached to theses</h3>
          <p>
            Eva treats the trust graph as the canonical layer, while claim bundles keep source context readable.
            Bundles are useful when they make a thesis easier to inspect, challenge, or score.
          </p>
        </section>

        <section style={{ marginTop: 40 }}>
          <div className="section-heading-row">
            <div>
              <p className="section-kicker">Claim pages</p>
              <h2 className="section-title section-title-sm">Open verification work</h2>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          ) : error ? (
            <div className="surface" style={{ padding: 24 }}>
              <h3 style={{ marginTop: 0 }}>Claims unavailable</h3>
              <p style={{ color: "var(--muted)" }}>{error}</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="surface claims-empty">
              <h3>No claims yet</h3>
              <p>
                The X channel is wired, but there are no open claim pages in storage yet. Once a mention lands, the
                first claim will appear here.
              </p>
            </div>
          ) : (
            <div className="claims-grid">
              {claims.map((claim) => (
                <Link key={claim.claimId} href={`/claims/${claim.claimId}`} className="surface claim-card">
                  <div className="claim-card-top">
                    <span className="blog-meta-pill">Claim</span>
                    <span className={statusClassName(claimUiStatus(claim))}>{statusLabel(claimUiStatus(claim))}</span>
                  </div>
                  <h3>{claim.title}</h3>
                  <p>{claim.excerpt}</p>
                  <div className="claim-bundle-row" aria-label="Claim bundle summary">
                    <span className="status-chip status-chip-forecast">Evidence bundle</span>
                    <span className="status-chip status-chip-unresolved">{claim.participantCount} participants</span>
                  </div>
                  <div className="claim-card-meta">
                    <span>{claim.source.platform.toUpperCase()}</span>
                    <span>{formatTimestamp(claim.createdAt)}</span>
                    <span>{claim.machineAssessment ? `Machine: ${titleCase(claim.machineAssessment.verdict)}` : "Machine assessment pending"}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
