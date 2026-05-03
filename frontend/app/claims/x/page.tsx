import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";

const steps = [
  {
    title: "Tag @evapredicts on X",
    body: "Explicit commands give Eva a compliant way to track a thesis, queue evidence, or create a counter without keyword-scanning unrelated posts.",
  },
  {
    title: "Open a public claim page",
    body: "Eva normalizes the source reference, dedupes it into a canonical claim ID, and stores the claim packet so the review stays inspectable.",
  },
  {
    title: "Claims support theses",
    body: "Claim pages remain useful when a predictor needs inspectable evidence behind a market call.",
  },
] as const;

export default function ClaimsXPage() {
  return (
    <>
      <Nav />
      <main className="page-shell">
        <section className="hero">
          <span className="hero-kicker">Evidence Explainer</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(34px, 5vw, 72px)" }}>
            X commands feed the prediction layer.
          </h1>
          <p className="hero-sub">
            @evapredicts is the command surface. The website is where markets, theses, evidence, and graph-backed
            predictor records become durable.
          </p>
        </section>

        <section className="grid-3" style={{ marginTop: 16 }}>
          {steps.map((step) => (
            <article key={step.title} className="surface built-card">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </section>

        <section className="surface callout" style={{ marginTop: 32 }}>
          <h3>Evidence stays practical</h3>
          <p>
            Claim packets are proof objects for the product. They make prediction theses easier to inspect,
            challenge, and eventually score.
          </p>
          <div style={{ marginTop: 18 }}>
            <Link href="/claims" className="btn btn-primary">
              Explore claim pages
            </Link>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
