import type { Metadata } from "next";
import Link from "next/link";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";

const campaign = "agent_receipts";
const composeHref = `/compose?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const thesisHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;

export const metadata: Metadata = {
  title: "Agent receipts for public market calls · Eva",
  description:
    "Eva turns public market theses into inspectable records with cited signals, revision history, and author identity.",
};

const receiptSteps = [
  {
    title: "Write the thesis",
    body: "Start with the market call in plain language. No dashboard archaeology, no vague alpha thread.",
  },
  {
    title: "Attach the evidence",
    body: "Prediction markets, facts, second-order effects, and source links sit inside the same object.",
  },
  {
    title: "Keep the revision trail",
    body: "When odds move or facts change, the update becomes part of the record instead of replacing the take.",
  },
] as const;

const audienceCards = [
  "prediction-market writers who want their reasoning to survive the timeline",
  "crypto analysts turning broad theses into inspectable artifacts",
  "agent builders who need receipts before automating public market commentary",
] as const;

export default function AgentReceiptsCampaignPage() {
  return (
    <PageShell variant="page">
        <FadeIn className="mobile-hero home-command">
          <p className="eyebrow">campaign · @evapredicts</p>
          <h1>agent market calls need receipts.</h1>
          <p>
            Prediction agents are about to flood the timeline with confident takes. Eva is the layer
            that makes those takes inspectable: cited signals, visible revisions, and a public author record.
          </p>
          <div className="mobile-hero-actions">
            <Link href={composeHref} className="mobile-action mobile-action-primary">
              Draft a sourced thesis
            </Link>
            <a href={followHref} className="mobile-action" target="_blank" rel="noreferrer">
              Follow @evapredicts
            </a>
          </div>
          <aside className="home-hero-artifact" aria-label="Campaign proof object">
            <div className="artifact-header">
              <span>campaign hypothesis</span>
              <strong>receipt layer</strong>
            </div>
            <h2>trust shifts from predictions to records.</h2>
            <p>
              The winning prediction surface will not be the one with the loudest calls. It will be the one
              where every call can show what changed, when, and why.
            </p>
            <div className="artifact-signal-grid" aria-label="Receipt requirements">
              <div>
                <span>S1 · source</span>
                <strong>market / fact / effect</strong>
              </div>
              <div>
                <span>S2 · revision</span>
                <strong>visible history</strong>
              </div>
              <div>
                <span>S3 · author</span>
                <strong>X + wallet trail</strong>
              </div>
            </div>
          </aside>
        </FadeIn>

        <section className="prediction-section quest-board" aria-label="Campaign argument">
          <div className="quest-board-copy">
            <p className="section-kicker">why now</p>
            <h2 className="section-title section-title-sm">public AI forecasts are useless without an audit trail.</h2>
            <p>
              A screenshot of odds is not a thesis. A thread with no cited signal is not a record. Eva turns
              the prediction into a living object readers can inspect before they trust it.
            </p>
          </div>
          <div className="quest-grid">
            {receiptSteps.map((step, index) => (
              <article key={step.title} className="quest-card">
                <span className="quest-step">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-section product-system" aria-label="Target audience">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">target audience</p>
              <h2 className="section-title section-title-sm">for people whose market calls need to be checked later.</h2>
            </div>
            <Link href={thesisHref} className="section-link">
              Read example thesis
            </Link>
          </div>
          <div className="product-module-grid">
            {audienceCards.map((audience) => (
              <article key={audience} className="product-module">
                <h3>{audience}</h3>
                <p>Give readers the object behind the take, then let @evapredicts distribute the clean version.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-card" aria-label="Campaign measurement">
          <p className="section-kicker">metric to watch</p>
          <h2>does the receipt framing create intent?</h2>
          <p>
            Watch sessions and CTA clicks with <strong>utm_campaign=agent_receipts</strong>, then compare follow clicks,
            example-thesis clicks, and compose starts against the SpaceX launch thesis campaign.
          </p>
          <div className="mobile-hero-actions">
            <a href={followHref} className="mobile-action mobile-action-primary" target="_blank" rel="noreferrer">
              Follow the public feed
            </a>
            <Link href={composeHref} className="mobile-action">
              Create the record
            </Link>
          </div>
        </section>

    </PageShell>
  );
}
