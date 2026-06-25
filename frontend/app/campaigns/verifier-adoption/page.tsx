import type { Metadata } from "next";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { protocol } from "@/lib/protocol";

const campaign = "verifier_adoption";
const campaignPath = "/campaigns/verifier-adoption";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=proof_cta&utm_campaign=${campaign}&utm_content=spacex_proof_record`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=prepare_verifiable_thesis`;
const marketsHref = `/markets?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_source_markets`;
const predictorsHref = `/predictors?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_author_records`;
const manifestHref = `/.well-known/agent.json?utm_source=campaign_page&utm_medium=agent_manifest&utm_campaign=${campaign}&utm_content=agent_manifest`;
const quickstartHref = "https://github.com/iJaack/eva-jaack/blob/main/docs/MCP_AGENT_QUICKSTART.md";
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const socialHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=verifier_checklist_post`;

export const metadata: Metadata = {
  title: "Verifier adoption · Eva",
  description:
    "A measurable @evapredicts campaign page for verifier and agent-platform builders who need forecast outputs to arrive with reviewable receipts.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "forecast verifiers need receipt-shaped inputs",
    description:
      "Eva packages public market theses with source fit, break conditions, revision history, author identity, and proof links before amplification.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "forecast verifiers need receipt-shaped inputs",
    description: "source fit, break conditions, revision history, author identity, and proof links for agent-written forecasts.",
  },
};

const verifierGates = [
  {
    label: "source fit",
    body: "The claim names which market, fact, or adjacent signal supports it instead of hiding behind a generic confidence score.",
  },
  {
    label: "break condition",
    body: "The forecast states what would make it wrong before the public thread turns into hindsight theater.",
  },
  {
    label: "revision trail",
    body: "Material updates append a visible version so a verifier can inspect how the argument changed.",
  },
  {
    label: "author boundary",
    body: "The output separates author identity, wallet source, agent/runtime context, and publish state before anyone amplifies it.",
  },
] as const;

const audiences = [
  "agent-platform teams that need a standard input before agents publish market calls",
  "prediction-market operators comparing AI forecast surfaces by auditability, not vibes",
  "protocol teams deciding whether an agent output is safe to quote, rank, or reward",
  "crypto analysts who want their public thesis history to survive beyond the original post",
] as const;

const campaignSteps = [
  "Route verifier and agent-builder traffic to this page with utm_campaign=verifier_adoption.",
  "Send high-intent readers to the proof thesis, agent manifest, MCP quickstart, source markets, or author records.",
  "Keep the campaign only if it creates proof-record reads, manifest opens, quickstart clicks, source-library clicks, author-record clicks, compose starts, or follows.",
] as const;

const approvalCopy = [
  "agent forecasts are cheap.",
  "verifiable agent forecasts are not.",
  "before a market call gets amplified, i want the receipt: source fit, break condition, revision trail, author boundary, and proof link.",
  "that is the Eva wedge for forecast verifiers. not louder predictions. better inputs for trust.",
  `start here: ${socialHref}`,
] as const;

export default function VerifierAdoptionCampaignPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <CampaignViewTracker campaign={campaign} channel="verifier_adoption_page" />
        <section className="hero">
          <p className="eyebrow">@evapredicts campaign · verifier adoption</p>
          <h1>forecast verifiers need receipt-shaped inputs.</h1>
          <p>
            If agents and analysts are going to publish market calls, the verifier should not receive a confident
            sentence. They should receive a thesis object with source fit, break conditions, revision history, author
            identity, and a proof link.
          </p>
          <div className="hero-actions">
            <CampaignLink
              href={proofHref}
              campaign={campaign}
              cta="read_proof_record"
              channel="verifier_adoption_hero"
              className="btn btn-primary"
            >
              Read proof record
            </CampaignLink>
            <CampaignLink
              href={manifestHref}
              campaign={campaign}
              cta="open_agent_manifest"
              channel="verifier_adoption_hero"
              className="btn"
            >
              Open agent manifest
            </CampaignLink>
            <CampaignLink
              href={quickstartHref}
              campaign={campaign}
              cta="read_mcp_quickstart"
              channel="verifier_adoption_hero"
              className="btn"
              target="_blank"
              rel="noreferrer"
              external
            >
              Read MCP quickstart
            </CampaignLink>
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>verifier intent is the sharper growth wedge than generic AI forecast interest.</h2>
          <p>
            Builders already know agents can produce market commentary. The conversion question is whether Eva makes the
            output easier to review, compare, and safely amplify. A verifier-first page should attract higher-intent
            clicks than another broad prediction page.
          </p>
        </section>

        <section className="prediction-section" aria-label="Verifier adoption checklist">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">verifier checklist</p>
              <h2 className="section-title section-title-sm">four gates before a forecast deserves distribution.</h2>
            </div>
            <CampaignLink
              href={marketsHref}
              campaign={campaign}
              cta="inspect_source_markets"
              channel="verifier_adoption_checklist"
              className="section-link"
            >
              Inspect source markets
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {verifierGates.map((gate) => (
              <article key={gate.label} className="product-module">
                <p className="section-kicker">verification gate</p>
                <h3>{gate.label}</h3>
                <p>{gate.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-section" aria-label="Target audience">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">target audience</p>
              <h2 className="section-title section-title-sm">people deciding whether a forecast can be trusted.</h2>
            </div>
            <CampaignLink
              href={predictorsHref}
              campaign={campaign}
              cta="inspect_author_records"
              channel="verifier_adoption_audience"
              className="section-link"
            >
              Inspect author records
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {audiences.map((audience) => (
              <article key={audience} className="product-module">
                <h3>{audience}</h3>
                <p>Lead with the verification gates, then route them into the proof-backed thesis and agent docs.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign sequence">
          <p className="section-kicker">Campaign sequence</p>
          <h2>make verifier adoption measurable before asking for public distribution.</h2>
          <ul>
            {campaignSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="route-actions">
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="prepare_verifiable_thesis"
              channel="verifier_adoption_sequence"
              className="mobile-action mobile-action-primary"
            >
              Prepare verifiable thesis
            </CampaignLink>
            <CampaignLink
              href={followHref}
              campaign={campaign}
              cta="follow_evapredicts"
              channel="verifier_adoption_sequence"
              className="mobile-action"
              target="_blank"
              rel="noreferrer"
              external
            >
              Follow @evapredicts
            </CampaignLink>
          </div>
        </section>

        <section className="paper-section" aria-label="@evapredicts copy to approve">
          <p className="section-kicker">@evapredicts copy to approve</p>
          <h2>post the verifier standard, not a traction claim.</h2>
          <p>
            External posting still needs explicit approval. Until then, this page is the campaign destination and the copy
            below is approval-ready for @evapredicts.
          </p>
          <blockquote>
            {approvalCopy.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
          <p className="inline-note">
            Metric to watch: sessions with <strong>utm_campaign=verifier_adoption</strong>, proof-record reads, agent
            manifest opens, MCP quickstart clicks, source-library clicks, author-record clicks, compose starts, and
            @evapredicts follow clicks. Do not claim traction until those are measured.
          </p>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
