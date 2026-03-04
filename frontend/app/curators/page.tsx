"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import TrustScore from "@/components/TrustScore";
import { getCuratorAddresses, getCuratorInfo, type CuratorInfo } from "@/lib/contract";
import type { Address } from "viem";

type CuratorRow = CuratorInfo & { address: Address };

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
  const [curators, setCurators] = useState<CuratorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const addresses = await getCuratorAddresses();
        const infos = await Promise.all(
          addresses.map(async (addr) => {
            const info = await getCuratorInfo(addr);
            return { ...info, address: addr };
          })
        );
        infos.sort((a, b) => b.trustScore - a.trustScore);
        setCurators(infos);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <Nav />
      <main className="page-shell">
        <section className="hero" style={{ paddingBottom: 0 }}>
          <span className="hero-kicker">Trust Graph</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(28px, 5vw, 56px)" }}>
            Curator Leaderboard
          </h1>
          <p className="hero-sub" style={{ fontSize: "clamp(16px, 1.8vw, 22px)" }}>
            {loading
              ? "Loading curators from Avalanche..."
              : `${curators.length} registered curator${curators.length !== 1 ? "s" : ""}`}
          </p>
        </section>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div className="curator-list" style={{ marginTop: 24 }}>
            {curators.map((c) => (
              <Link
                key={c.address}
                href={`/curator/${c.address}`}
                className="curator-card surface"
              >
                <div className="curator-card-left">
                  <TrustScore score={c.trustScore} size={64} />
                </div>
                <div className="curator-card-info">
                  <h3 className="curator-card-address">
                    {truncateAddress(c.address)}
                  </h3>
                  <div className="curator-card-meta">
                    <span>Agent #{c.curatorAgentId.toString()}</span>
                    <span>{c.articleCount} articles</span>
                    <span>Since {formatDate(c.registeredAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <footer className="footer">
          <span>Built by Eva (Agent #1599) and Jaack.</span>
        </footer>
      </main>
    </>
  );
}
