import type { Metadata } from "next";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { protocol } from "@/lib/protocol";

const campaign = "forecast_trust_loop";
const campaignPath = "/campaigns/forecast-trust-loop";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=proof_cta&utm_campaign=${campaign}&utm_content=spacex_proof_record`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=start_trust_loop_thesis`;
const marketsHref = `/markets?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_market_signals`;
const predictorsHref = `/predictors?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_author_records`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const socialHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=trust_loop_post`;

export const metadata: Metadata = {
  title: "Forecast trust loop · Eva",
  description:
    "A measurable @evapredicts campaign page that turns every public forecast into a trust loop: source, claim, break condition, revision, and receipt.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "a useful forecast is a trust loop, not a confident sentence",
    description:
      "Eva Protocol gives public forecasts a repeatable loop: source the claim, state what would break it, revise visibly, and keep the receipt inspectable.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "a useful forecast is a trust loop, not a confident sentence",
    description: "source → claim → break condition → revision → receipt. that is the Eva Protocol wedge.",
  },
};

const loopSteps = [
  {
    label: "source",
    body: "Attach the market signal, fact signal, or closed forecast that earned the claim attention in the first place.",
  },
  {
    label: "claim",
    body: "Write the forecast as an inspectable thesis, not a vague timeline take that disappears when the feed moves on.",
  },
  {
    label: "break condition",
    body: "Say what would change the thesis before the market forces the update. No retrofitted confidence later.",
  },
  {
    label: "revision",
    body: "Append material changes to the same record so the audience can see how the argument evolved.",
  },
  {
    label: "receipt",
    body: "Keep the author trail and anchorable proof path intact so agents and readers can audit the call later.",
  },
] as const;

const targetAudiences = [
  "agent builders whose forecast output needs auditable context before users delegate decisions",
  "prediction-market analysts who want their reasoning to survive beyond an odds screenshot",
  "crypto infra readers evaluating whether Eva is trust infrastructure or just another content surface",
  "@evapredicts followers who need one concrete behavior to try before launch claims widen",
] as const;

const campaignSequence = [
  "Route approved @evapredicts traffic to this page with utm_campaign=forecast_trust_loop.",
  "Make the first conversion ask small: inspect the proof record or run the loop against one thesis.",
  "Keep this wedge only if trust-loop readers beat generic campaign traffic on proof-record reads, market-signal clicks, compose starts, author-record clicks, or follows.",
] as const;

const trustGapChecks = [
  {
    question: "what earned the claim?",
    body: "A forecast needs a source that actually supports the argument, not a decorative odds link.",
  },
  {
    question: "what would break it?",
    body: "The revision trigger should be visible before the timeline forces the author to explain it retroactively.",
  },
  {
    question: "where will updates live?",
    body: "If the thesis changes, the new version should attach to the same record instead of spawning a fresh screenshot.",
  },
  {
    question: "who owns the record?",
    body: "Readers and agents need an author trail they can inspect after the call starts moving through feeds.",
  },
] as const;

const approvalCopy = [
  "a useful forecast is not a confident sentence.",
  "it is a trust loop.",
  "source the claim. state what would break it. revise visibly. keep the receipt inspectable after the timeline moves on.",
  "that is the Eva Protocol wedge for public market theses.",
  `run the loop: ${socialHref}`,
] as const;

export default function ForecastTrustLoopCampaignPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <CampaignViewTracker campaign={campaign} channel="forecast_trust_loop_page" />
        <section className="hero">
          <p className="eyebrow">@evapredicts campaign · forecast trust loop</p>
          <h1>a useful forecast is a trust loop, not a confident sentence.</h1>
          <p>
            Eva Protocol turns a public market call into a repeatable loop: source the claim, state what would break it,
            revise visibly, and keep the receipt inspectable after the timeline moves on.
          </p>
          <div className="hero-actions">
            <CampaignLink
              href={proofHref}
              campaign={campaign}
              cta="read_proof_record"
              channel="forecast_trust_loop_hero"
              className="btn btn-primary"
            >
              Read proof record
            </CampaignLink>
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="start_trust_loop_thesis"
              channel="forecast_trust_loop_hero"
              className="btn"
            >
              Start trust-loop thesis
            </CampaignLink>
            <CampaignLink
              href={followHref}
              campaign={campaign}
              cta="follow_evapredicts"
              channel="forecast_trust_loop_hero"
              className="btn"
              target="_blank"
              rel="noreferrer"
              external
            >
              Follow @evapredicts
            </CampaignLink>
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>trust-loop framing should convert skeptical builders better than generic AI forecast copy.</h2>
          <p>
            The strongest early audience does not need Eva to promise better predictions. They need to see a safer
            workflow for making predictions accountable: evidence first, explicit failure conditions, visible revisions,
            and a durable author record.
          </p>
        </section>

        <section className="prediction-section" aria-label="Trust loop steps">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">the loop</p>
              <h2 className="section-title section-title-sm">make the forecast auditable before it gets amplified.</h2>
            </div>
            <CampaignLink
              href={marketsHref}
              campaign={campaign}
              cta="inspect_market_signals"
              channel="forecast_trust_loop_steps"
              className="section-link"
            >
              Inspect market signals
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {loopSteps.map((step) => (
              <article key={step.label} className="product-module">
                <p className="section-kicker">loop step</p>
                <h3>{step.label}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-section" aria-label="Target audience">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">target audience</p>
              <h2 className="section-title section-title-sm">people who will not trust forecasts without receipts.</h2>
            </div>
            <CampaignLink
              href={predictorsHref}
              campaign={campaign}
              cta="inspect_author_records"
              channel="forecast_trust_loop_audience"
              className="section-link"
            >
              Inspect author records
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {targetAudiences.map((audience) => (
              <article key={audience} className="product-module">
                <h3>{audience}</h3>
                <p>Send them to the proof record first, then measure whether they inspect, compose, or follow.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-section" aria-label="Forecast trust gap diagnostic">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">trust gap diagnostic</p>
              <h2 className="section-title section-title-sm">before amplifying a forecast, ask four questions.</h2>
            </div>
            <CampaignLink
              href={proofHref}
              campaign={campaign}
              cta="run_trust_gap_diagnostic"
              channel="forecast_trust_loop_diagnostic"
              className="section-link"
            >
              Run it on the proof record
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {trustGapChecks.map((check) => (
              <article key={check.question} className="product-module">
                <p className="section-kicker">diagnostic check</p>
                <h3>{check.question}</h3>
                <p>{check.body}</p>
              </article>
            ))}
          </div>
          <p className="inline-note">
            Campaign hypothesis: a diagnostic framing should pull skeptical agent builders into proof-record reads faster
            than softer launch copy because it makes the missing receipt obvious.
          </p>
        </section>

        <section className="paper-section" aria-label="Campaign sequence">
          <p className="section-kicker">Campaign sequence</p>
          <h2>one loop, one CTA, one decision rule.</h2>
          <ul>
            {campaignSequence.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="route-actions">
            <CampaignLink
              href={proofHref}
              campaign={campaign}
              cta="inspect_proof_record"
              channel="forecast_trust_loop_sequence"
              className="mobile-action mobile-action-primary"
            >
              Inspect proof record
            </CampaignLink>
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="compose_trust_loop_thesis"
              channel="forecast_trust_loop_sequence"
              className="mobile-action"
            >
              Compose the loop
            </CampaignLink>
          </div>
        </section>

        <section className="paper-section" aria-label="@evapredicts copy to approve">
          <p className="section-kicker">@evapredicts copy to approve</p>
          <h2>give the public one behavior to copy.</h2>
          <p>
            External posting still needs explicit approval. Until then, this page is the measurable destination and the
            copy below is approval-ready for @evapredicts.
          </p>
          <blockquote>
            {approvalCopy.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
          <p className="inline-note">
            Metric to watch: sessions with <strong>utm_campaign=forecast_trust_loop</strong>, proof-record reads,
            market-signal clicks, compose starts, author-record clicks, and @evapredicts follow clicks. Do not claim
            traction until those are measured.
          </p>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
