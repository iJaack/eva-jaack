import type { Metadata } from "next";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { protocol } from "@/lib/protocol";

const campaign = "forecast_qa_checklist";
const campaignPath = "/campaigns/forecast-qa-checklist";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=spacex_proof_record`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=run_forecast_qa`;
const marketsHref = `/markets?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_market_signals`;
const predictorsHref = `/predictors?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_author_records`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const socialHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=checklist_post`;

export const metadata: Metadata = {
  title: "Forecast QA checklist · Eva",
  description:
    "A measurable @evapredicts campaign page for turning AI and market forecasts into source-backed, revision-ready records.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "forecasts need QA before they deserve distribution",
    description:
      "Eva turns public forecasts into reviewable records: source fit, break conditions, revision triggers, author trail, and proof links.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "forecasts need QA before they deserve distribution",
    description:
      "A campaign checklist for AI forecasts and market theses that need receipts before amplification.",
  },
};

const checklist = [
  {
    label: "source fit",
    question: "which market prices the question, which fact source constrains it, and which source is only narrative noise?",
  },
  {
    label: "break condition",
    question: "what fact would make the thesis wrong enough to revise instead of quietly moving the goalposts?",
  },
  {
    label: "revision trigger",
    question: "which signal change creates a new version: odds move, source update, deadline shift, or author judgment?",
  },
  {
    label: "author trail",
    question: "who made the call, which runtime or account wrote it, and where can readers inspect that record later?",
  },
] as const;

const audiences = [
  "agent builders who need forecast outputs to survive review after the first answer",
  "prediction-market writers turning X takes into cited, updateable public records",
  "crypto analysts who want reputation for reasoning, not only for screenshots that aged well",
  "operators comparing forecast products by source quality, revision behavior, and auditability",
] as const;

const campaignSequence = [
  "Send approved @evapredicts traffic to this checklist with utm_campaign=forecast_qa_checklist.",
  "Route readers into the SpaceX proof record so the checklist is demonstrated on a real thesis, not a generic framework.",
  "Keep the angle only if it drives proof-record reads, market-signal clicks, compose starts, author-record clicks, or follows.",
] as const;

const approvalCopy = [
  "forecast posts are cheap now.",
  "forecast QA is the scarce part.",
  "before a market thesis deserves distribution, i want to see source fit, break conditions, revision triggers, and an author trail.",
  "that is the Eva wedge: not louder predictions. better records around them.",
  `run the checklist here: ${socialHref}`,
] as const;

export default function ForecastQaChecklistCampaignPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <CampaignViewTracker campaign={campaign} channel="forecast_qa_checklist_page" />
        <section className="hero">
          <p className="eyebrow">@evapredicts campaign · forecast QA checklist</p>
          <h1>forecasts need QA before they deserve distribution.</h1>
          <p>
            AI can generate a market call in seconds. Eva makes the review object harder to fake: source fit, break
            conditions, revision triggers, author trail, and a proof link readers can inspect later.
          </p>
          <div className="hero-actions">
            <CampaignLink
              href={proofHref}
              campaign={campaign}
              cta="read_proof_record"
              channel="forecast_qa_hero"
              className="btn btn-primary"
            >
              Read proof record
            </CampaignLink>
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="run_forecast_qa"
              channel="forecast_qa_hero"
              className="btn"
            >
              Run the checklist
            </CampaignLink>
            <CampaignLink
              href={followHref}
              campaign={campaign}
              cta="follow_evapredicts"
              channel="forecast_qa_hero"
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
          <h2>checklist framing should convert skeptical builders better than another launch claim.</h2>
          <p>
            The audience already knows AI can produce forecasts. The sharper ask is whether those forecasts can be
            reviewed, revised, and attributed without trusting the author after the fact.
          </p>
        </section>

        <section className="prediction-section" aria-label="Forecast QA checklist">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">the checklist</p>
              <h2 className="section-title section-title-sm">four questions before a forecast gets amplified.</h2>
            </div>
            <CampaignLink
              href={marketsHref}
              campaign={campaign}
              cta="inspect_market_signals"
              channel="forecast_qa_checklist"
              className="section-link"
            >
              Inspect market signals
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {checklist.map((item) => (
              <article key={item.label} className="product-module">
                <p className="section-kicker">qa gate</p>
                <h3>{item.label}</h3>
                <p>{item.question}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-section" aria-label="Target audience">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">target audience</p>
              <h2 className="section-title section-title-sm">people who need forecast records to pass review.</h2>
            </div>
            <CampaignLink
              href={predictorsHref}
              campaign={campaign}
              cta="inspect_author_records"
              channel="forecast_qa_audience"
              className="section-link"
            >
              Inspect author records
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {audiences.map((audience) => (
              <article key={audience} className="product-module">
                <h3>{audience}</h3>
                <p>Show the checklist, then send them to one proof-backed thesis where the standard is visible.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign sequence">
          <p className="section-kicker">Campaign sequence</p>
          <h2>make the QA standard measurable before widening @evapredicts distribution.</h2>
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
              channel="forecast_qa_sequence"
              className="mobile-action mobile-action-primary"
            >
              Inspect proof record
            </CampaignLink>
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="start_checklisted_thesis"
              channel="forecast_qa_sequence"
              className="mobile-action"
            >
              Start checklist thesis
            </CampaignLink>
          </div>
        </section>

        <section className="paper-section" aria-label="@evapredicts copy to approve">
          <p className="section-kicker">@evapredicts copy to approve</p>
          <h2>ship the standard, not a hype post.</h2>
          <p>
            External posting still needs explicit approval. Until then, this page is the campaign destination and the
            copy below is approval-ready for @evapredicts.
          </p>
          <blockquote>
            {approvalCopy.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
          <p className="inline-note">
            Metric to watch: sessions with <strong>utm_campaign=forecast_qa_checklist</strong>, proof-record reads,
            market-signal clicks, compose starts, author-record clicks, and @evapredicts follow clicks. Do not claim
            traction until those are measured.
          </p>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
