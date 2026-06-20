import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { protocol } from "@/lib/protocol";

const campaign = "prediction_memory";
const campaignPath = "/campaigns/prediction-memory";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=spacex_proof`;
const sourceQualityHref = `/campaigns/source-quality-sprint?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=source_quality_page`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=draft_memory_thesis`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const xPostHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=memory_post`;

export const metadata: Metadata = {
  title: "Prediction memory · Eva",
  description:
    "A measurable @evapredicts campaign page for positioning Eva as prediction memory: cited sources, visible revisions, and author trails for public market theses.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "prediction markets price the moment. Eva remembers the thesis.",
    description:
      "Eva turns public market calls into inspectable thesis records with cited signals, revision triggers, and author trails.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "prediction markets price the moment. Eva remembers the thesis.",
    description:
      "A prediction-memory campaign for public theses: cited signals, visible revisions, author trails, and no stale odds screenshots.",
  },
};

const memoryProblems = [
  {
    label: "the before-state disappears",
    body: "A market call gets judged later, but the original sources, assumptions, and confidence often vanish into the feed.",
  },
  {
    label: "revision logic gets lost",
    body: "Good predictors change their minds. Readers need to see what fact or market signal forced the update.",
  },
  {
    label: "agent outputs need receipts",
    body: "Forecast automation only becomes useful when the output carries sources, runtime identity, and an audit trail.",
  },
] as const;

const targetAudiences = [
  "public predictors who already explain their market calls on X",
  "prediction-market operators trying to improve distribution quality",
  "crypto analysts whose broad theses need a record readers can revisit",
  "agent builders who need forecast outputs with receipts before automation",
] as const;

const campaignSequence = [
  "Send approved @evapredicts traffic to this page with utm_campaign=prediction_memory.",
  "Route the first click into the SpaceX proof thesis so readers inspect a real record, not abstract positioning.",
  "Keep the angle only if it beats generic launch copy on proof-thesis reads, source-quality page visits, compose starts, and follow clicks.",
] as const;

const approvalCopy = [
  "prediction markets are good at showing what people think now.",
  "but they are bad at remembering why anyone thought it.",
  "that is the wedge for Eva: public market theses with cited signals, revision history, and an author trail.",
  "not louder calls. better memory.",
  `first proof object: ${xPostHref}`,
] as const;

export default function PredictionMemoryCampaignPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <section className="hero">
          <p className="eyebrow">@evapredicts campaign · prediction memory</p>
          <h1>prediction markets price the moment. Eva remembers the thesis.</h1>
          <p>
            The public prediction feed is full of odds screenshots and confident takes. Eva turns a market call into an
            inspectable record: claim, cited signals, revision triggers, and an author trail people can check after the
            timeline moves on.
          </p>
          <div className="hero-actions">
            <Link href={proofHref} className="btn btn-primary">
              Read proof thesis
            </Link>
            <Link href={sourceQualityHref} className="btn">
              Inspect source-quality loop
            </Link>
            <a href={followHref} className="btn" target="_blank" rel="noreferrer">
              Follow @evapredicts
            </a>
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>prediction-memory framing should pull higher-intent builders than another launch announcement.</h2>
          <p>
            Prediction-market-native readers do not need Eva to explain that odds exist. The sharper pain is memory:
            what did this person think, why did they think it, and what changed later? The campaign asks them to inspect
            one concrete thesis record before following the public loop.
          </p>
        </section>

        <section className="prediction-section" aria-label="Prediction memory problems">
          <div className="product-module-grid">
            {memoryProblems.map((problem) => (
              <article key={problem.label} className="product-module">
                <p className="section-kicker">memory gap</p>
                <h3>{problem.label}</h3>
                <p>{problem.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-section" aria-label="Target audience">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">target audience</p>
              <h2 className="section-title section-title-sm">people whose predictions need to survive the feed.</h2>
            </div>
            <Link href={composeHref} className="section-link">
              Draft memory-backed thesis
            </Link>
          </div>
          <div className="product-module-grid">
            {targetAudiences.map((audience) => (
              <article key={audience} className="product-module">
                <h3>{audience}</h3>
                <p>Send them to the proof record first, then measure whether they inspect sources or start a thesis.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign sequence">
          <p className="section-kicker">Campaign sequence</p>
          <h2>one memory claim, one proof object, one measurable decision.</h2>
          <ul>
            {campaignSequence.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="route-actions">
            <Link href={proofHref} className="mobile-action mobile-action-primary">
              Inspect proof record
            </Link>
            <Link href={composeHref} className="mobile-action">
              Start a thesis record
            </Link>
          </div>
        </section>

        <section className="paper-section" aria-label="@evapredicts copy to approve">
          <p className="section-kicker">@evapredicts copy to approve</p>
          <h2>make memory the public wedge.</h2>
          <p>
            External posting still needs explicit approval. Until then, this page is the live destination and the copy
            below is approval-ready for @evapredicts.
          </p>
          <blockquote>
            {approvalCopy.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
          <p className="inline-note">
            Metric to watch: sessions with <strong>utm_campaign=prediction_memory</strong>, proof-thesis reads,
            source-quality page visits, compose starts, and @evapredicts follow clicks. Do not claim traction until those
            are measured.
          </p>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
