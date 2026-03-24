"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { verifyArticleUrl, type VerificationResult } from "@/lib/api";

function claimTone(score: number): string {
  if (score >= 75) return "#34a853";
  if (score >= 50) return "#f5b731";
  if (score >= 25) return "#e8803a";
  return "#e74c3c";
}

export default function VerifyPage() {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await verifyArticleUrl(url.trim());
      setResult(response);
    } catch (reason) {
      setResult(null);
      setError(reason instanceof Error ? reason.message : "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="page-shell">
        <section className="hero">
          <span className="hero-kicker">Live verification</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(34px, 6vw, 78px)" }}>
            Run Eva against a source URL.
          </h1>
          <p className="hero-sub">
            This is the real product surface now: paste a source URL, let Eva extract factual claims,
            verify them, and return a scored report you can inspect immediately.
          </p>
        </section>

        <section className="surface register-guide-card">
          <div className="section-heading-row" style={{ alignItems: "start" }}>
            <div>
              <p className="section-kicker">Verification API</p>
              <h2 className="section-title section-title-sm">Submit a source URL</h2>
            </div>
            <Link href="/about" className="btn btn-ghost">
              Protocol overview
            </Link>
          </div>

          <p style={{ marginTop: 12, color: "var(--muted)" }}>
            Payment enforcement is intentionally disabled until x402 request verification is implemented
            end-to-end. The endpoint is usable now and returns the real verification report shape.
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: 18, display: "grid", gap: 14 }}>
            <input
              type="url"
              className="register-input"
              placeholder="https://example.com/article"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
            />
            <div className="hero-actions">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Verifying..." : "Verify article"}
              </button>
            </div>
          </form>
        </section>

        {error ? (
          <section className="surface status-panel" style={{ marginTop: 24, background: "rgba(243, 154, 142, 0.12)", borderColor: "rgba(243, 154, 142, 0.35)" }}>
            <p className="section-kicker" style={{ marginBottom: 8 }}>Verification failed</p>
            <h3 style={{ margin: 0 }}>{error}</h3>
          </section>
        ) : null}

        {result ? (
          <>
            <section className="surface" style={{ marginTop: 24, padding: 24 }}>
              <div className="section-heading-row" style={{ alignItems: "start" }}>
                <div>
                  <p className="section-kicker">Verification result</p>
                  <h2 className="section-title section-title-sm" style={{ marginBottom: 0 }}>
                    {result.verification.report.title || result.verification.report.url}
                  </h2>
                </div>
                <span className="score-badge" style={{ color: claimTone(result.verification.overallScore), borderColor: `${claimTone(result.verification.overallScore)}40`, background: `${claimTone(result.verification.overallScore)}18` }}>
                  Score: {result.verification.overallScore}
                </span>
              </div>

              <div className="curator-card-meta" style={{ marginTop: 14 }}>
                <span>{result.verification.claimCount} claims</span>
                <span>{result.verification.routescanClaimCount} onchain-assisted</span>
                <span>Payment required: {result.payment.required ? "Yes" : "No"}</span>
              </div>

              <p style={{ marginTop: 14, color: "var(--muted)" }}>
                {result.payment.reason}
              </p>

              <div className="detail-grid" style={{ marginTop: 18 }}>
                <div className="detail-row">
                  <span className="detail-label">Source URL</span>
                  <a href={result.verification.report.url} target="_blank" rel="noreferrer" className="detail-value detail-link">
                    {result.verification.report.url}
                  </a>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Report URI</span>
                  <a href={result.verification.ipfsURI} target="_blank" rel="noreferrer" className="detail-value detail-link">
                    {result.verification.ipfsURI}
                  </a>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Existing on-chain submission</span>
                  <span className="detail-value">
                    {result.articleMatch.matchesExistingSubmission && result.articleMatch.articleId ? (
                      <Link href={`/article/${result.articleMatch.articleId}`} className="detail-link">
                        Article #{result.articleMatch.articleId}
                      </Link>
                    ) : (
                      "No match"
                    )}
                  </span>
                </div>
              </div>
            </section>

            <section style={{ marginTop: 24 }}>
              <div className="surface" style={{ padding: 24 }}>
                <p className="section-kicker">Claim breakdown</p>
                <div className="register-transaction-stack" style={{ marginTop: 18 }}>
                  {result.verification.report.claims.map((claim, index) => {
                    const tone = claimTone(claim.score);
                    return (
                      <article key={`${claim.claim.text}-${index}`} className="surface tx-card">
                        <div className="tx-card-header">
                          <div>
                            <p className="section-kicker" style={{ marginBottom: 8 }}>Claim {index + 1}</p>
                            <h3 style={{ margin: 0 }}>{claim.claim.text}</h3>
                          </div>
                          <span className="score-badge" style={{ color: tone, borderColor: `${tone}40`, background: `${tone}18` }}>
                            {claim.score}
                          </span>
                        </div>
                        <p style={{ marginTop: 14, color: "var(--muted)" }}>{claim.explanation}</p>
                        <div className="curator-card-meta" style={{ marginTop: 12 }}>
                          <span>Type: {claim.claim.type}</span>
                          <span>Difficulty: {claim.claim.difficulty}</span>
                          <span>Source: {claim.dataSource}</span>
                        </div>
                        {claim.sources.length > 0 ? (
                          <div className="curator-card-meta" style={{ marginTop: 12 }}>
                            {claim.sources.map((source) => (
                              <span key={source}>{source}</span>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        ) : null}

        <SiteFooter />
      </main>
    </>
  );
}
