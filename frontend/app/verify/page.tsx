import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";

const apiSteps = [
  "POST a source URL to Eva's verification endpoint.",
  "Eva fetches the article, extracts factual claims, and verifies evidence.",
  "The resulting report is stored to IPFS-compatible storage and can be anchored on-chain.",
  "Consumers and curators use the report to update trust and rank sources.",
] as const;

const surfaces = [
  {
    title: "Verification API",
    description: "Programmatic entrypoint for article verification and trust-scored reporting.",
    detail: "Used by curator submission flows and automation clients.",
  },
  {
    title: "x402-compatible access",
    description: "The public verification route is structured for payment-gated usage.",
    detail: "Lets Eva expose verifiable work as an agent service instead of a closed backend.",
  },
  {
    title: "Evidence receipts",
    description: "Verification output includes score, claim breakdown, and a content-addressed report URI.",
    detail: "This makes downstream trust updates inspectable instead of opaque.",
  },
] as const;

export default function VerifyPage() {
  return (
    <>
      <Nav />
      <main className="page-shell">
        <section className="hero">
          <span className="hero-kicker">Verification surface</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(34px, 6vw, 78px)" }}>
            Verify articles through Eva.
          </h1>
          <p className="hero-sub">
            Eva&apos;s live verification path fetches an article, extracts factual claims, verifies evidence,
            stores the report, and returns a score that can feed the on-chain trust graph.
          </p>
          <div className="hero-actions">
            <a href="https://eva.jaack.me/api/verify" className="btn btn-primary" target="_blank" rel="noreferrer">
              API endpoint
            </a>
            <Link href="/about" className="btn btn-ghost">
              Read protocol overview
            </Link>
          </div>
        </section>

        <section className="surface info-card">
          <h3>Current route</h3>
          <p>
            <code>POST /api/verify</code> accepts a source URL and returns a verification result including
            claim counts, evidence report metadata, and trust-oriented scoring output.
          </p>
        </section>

        <section style={{ marginTop: 40 }}>
          <p className="section-kicker">Flow</p>
          <h2 className="section-title">What happens on each request</h2>
          <div className="grid-2" style={{ marginTop: 16 }}>
            {apiSteps.map((step, index) => (
              <article key={step} className="surface step-card">
                <h3>
                  <span className="icon-pill">0{index + 1}</span>
                  {step}
                </h3>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 40 }}>
          <p className="section-kicker">Live product surface</p>
          <h2 className="section-title">Built for agents and curators</h2>
          <div className="grid-3" style={{ marginTop: 16 }}>
            {surfaces.map((surface) => (
              <article key={surface.title} className="surface built-card">
                <h3>{surface.title}</h3>
                <p>{surface.description}</p>
                <p>{surface.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface callout">
          <h3>Provider-agnostic by design</h3>
          <p>
            The verification pipeline routes through swappable service abstractions — Anthropic or gateway LLMs,
            Pinata or local storage, private-key or Evalanche signing — so infrastructure evolves without
            rewriting business logic.
          </p>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
