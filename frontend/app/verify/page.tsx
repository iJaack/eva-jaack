"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { verifyArticleUrl, type VerificationResult } from "@/lib/api";
import { scoreUiStatus, statusClassName, statusLabel } from "@/lib/status";

export default function VerifyPage() {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sourceUrl = url.trim();

    if (!sourceUrl) {
      setError("Enter a source URL before running an evidence check.");
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await verifyArticleUrl(sourceUrl);
      setResult(response);
    } catch (reason) {
      setResult(null);
      setError(reason instanceof Error ? reason.message : "Verification failed. Check the URL and try again.");
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Nav />
      <main id="main-content" className="mobile-shell verify-tool-shell">
        <section className="mobile-page-head">
          <p className="eyebrow">Evidence Tool</p>
          <h1>Check a source before it backs a thesis.</h1>
          <p>
            Paste a source URL and Eva will extract factual claims, score the evidence, and return a report
            you can use when publishing or challenging a market thesis. This verifies evidence quality; it does not turn forecast odds into truth.
          </p>
          <div className="mobile-hero-actions">
            <Link href="/compose" className="mobile-action mobile-action-primary">
              Make a thesis
            </Link>
            <Link href="/claims" className="mobile-action">
              Evidence queue
            </Link>
          </div>
        </section>

        <section className="prediction-card verify-tool-card">
          <div className="card-topline">
            <span>Source URL</span>
            <span>Secondary Tool</span>
          </div>
          <form onSubmit={handleSubmit} className="compose-form" noValidate>
            <label className="field-group" htmlFor="source-url">
              <span className="field-label">URL to Check</span>
              <input
                ref={inputRef}
                id="source-url"
                name="sourceUrl"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                className="field-input"
                placeholder="https://example.com/article…"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                aria-describedby={error ? "verify-error" : undefined}
                required
              />
            </label>

            {error ? (
              <p id="verify-error" className="claim-warning" aria-live="polite">
                {error}
              </p>
            ) : null}

            <button className="mobile-action mobile-action-primary compose-submit" type="submit" disabled={submitting}>
              {submitting ? "Checking…" : "Check Evidence"}
            </button>
          </form>
          <p className="market-boundary-note">
            x402 payment enforcement is disabled until a request can be bound to the exact URL, claim ID, chain,
            amount, expiry, and replay guard. Until then this tool runs as an evidence-quality check.
          </p>
        </section>

        {result ? (
          <section className="prediction-section" aria-live="polite">
            <article className="prediction-card verify-result-card">
              <div className="card-topline">
                <span>Evidence Report</span>
                <span className={statusClassName(scoreUiStatus(result.verification.overallScore))}>
                  {statusLabel(scoreUiStatus(result.verification.overallScore))}
                </span>
              </div>
              <h2>{result.verification.report.title || result.verification.report.url}</h2>
              <p className="market-boundary-note">
                Evidence score is separate from market outcome. Use it to support, dispute, or resolve a claim bundle.
              </p>
              <div className="odds-row">
                <div>
                  <span>Evidence score</span>
                  <strong>{result.verification.overallScore}</strong>
                </div>
                <div>
                  <span>Onchain</span>
                  <strong>{result.verification.routescanClaimCount}</strong>
                </div>
                <div>
                  <span>Payment</span>
                  <strong>{result.payment.required ? "Yes" : "No"}</strong>
                </div>
              </div>

              <div className="evidence-list">
                <a href={result.verification.report.url} target="_blank" rel="noreferrer">
                  {result.verification.report.url}
                </a>
                <a href={result.verification.ipfsURI} target="_blank" rel="noreferrer">
                  {result.verification.ipfsURI}
                </a>
                {result.articleMatch.matchesExistingSubmission && result.articleMatch.articleId ? (
                  <Link href={`/article/${result.articleMatch.articleId}`}>Article #{result.articleMatch.articleId}</Link>
                ) : null}
              </div>
            </article>

            <div className="thesis-stack">
              {result.verification.report.claims.map((claim, index) => {
                const claimStatus = scoreUiStatus(claim.score);
                return (
                  <article key={`${claim.claim.text}-${index}`} className="prediction-card verify-claim-card">
                    <div className="card-topline">
                      <span>Claim {index + 1}</span>
                      <span className={statusClassName(claimStatus)}>{statusLabel(claimStatus)} · {claim.score}</span>
                    </div>
                    <h2>{claim.claim.text}</h2>
                    <p>{claim.explanation}</p>
                    <div className="odds-row">
                      <div>
                        <span>Type</span>
                        <strong>{claim.claim.type}</strong>
                      </div>
                      <div>
                        <span>Difficulty</span>
                        <strong>{claim.claim.difficulty}</strong>
                      </div>
                      <div>
                        <span>Source</span>
                        <strong>{claim.dataSource}</strong>
                      </div>
                    </div>
                    {claim.sources.length > 0 ? (
                      <div className="evidence-list">
                        {claim.sources.map((source) => (
                          <a key={source} href={source} target="_blank" rel="noreferrer">
                            {source}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <SiteFooter />
      </main>
    </>
  );
}
