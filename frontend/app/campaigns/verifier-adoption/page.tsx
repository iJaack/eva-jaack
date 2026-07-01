import type { Metadata } from "next";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
import { protocol } from "@/lib/protocol";

const campaign = "verifier_adoption";
const campaignPath = "/campaigns/verifier-adoption";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=proof_cta&utm_campaign=${campaign}&utm_content=spacex_proof_record`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=start_verifiable_thesis`;
const marketsHref = `/markets?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_market_signals`;
const predictorsHref = `/predictors?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_author_records`;
const manifestHref = `/.well-known/agent.json?utm_source=campaign_page&utm_medium=agent_manifest&utm_campaign=${campaign}&utm_content=agent_manifest`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const socialHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=verifier_post`;

export const metadata: Metadata = {
  title: "Verifier adoption · Eva",
  description:
    "A measurable @evapredicts campaign page for builders who need forecasts to become verifiable artifacts, not screenshots.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "forecasts need verifiers before they need virality",
    description:
      "Eva routes verifier-minded builders into proof records, source checks, author trails, and explicit revision triggers for public market theses.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "forecasts need verifiers before they need virality",
    description: "source checks, break conditions, author records, and proof links for public market theses.",
  },
};

const verifierChecks = [
  {
    label: "claim boundary",
    body: "The thesis says exactly what is being asserted and what evidence would make it weaker.",
  },
  {
    label: "source fit",
    body: "Every cited market, fact, or second-order signal is inspectable and actually supports the claim being made.",
  },
  {
    label: "revision trigger",
    body: "The page names the condition that should force an update before the author gets to declare victory.",
  },
  {
    label: "author record",
    body: "The reader can inspect the author trail, wallet/source context, and historical updates after the feed has moved on.",
  },
] as const;

const audiences = [
  "prediction-market operators who need better proof objects around public calls",
  "agent builders whose forecast outputs need reviewable receipts before distribution",
  "crypto analysts who want source quality to be visible before a thesis gets amplified",
  "protocol teams evaluating whether AI x markets can produce verifiable public reasoning",
] as const;

const campaignSequence = [
  "Route verifier-minded traffic to this page with utm_campaign=verifier_adoption.",
  "Ask readers to inspect the proof record, market signals, author record, or agent manifest before starting a new thesis.",
  "Keep the wedge only if it produces proof-record reads, market-signal clicks, author-record clicks, manifest opens, compose starts, or follows.",
] as const;

const approvalCopy = [
  "prediction markets do not need more confident screenshots.",
  "they need verifiable forecast artifacts.",
  "what is the claim? which sources support it? what would break it? who authored it? where did the revision happen?",
  "Eva's wedge is the receipt around the forecast, not the loudest call in the feed.",
  `start here: ${socialHref}`,
] as const;

export default function VerifierAdoptionCampaignPage() {
  return (
    <PageShell variant="page">
        <CampaignViewTracker campaign={campaign} channel="verifier_adoption_page" />
        <FadeIn className="hero">
          <p className="eyebrow">@evapredicts campaign · verifier adoption</p>
          <h1>forecasts need verifiers before they need virality.</h1>
          <p>
            Eva Protocol turns a public market call into something a verifier can inspect: the claim boundary, cited
            sources, break condition, author trail, and revision history. Less screenshot alpha, more proof object.
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
              href={marketsHref}
              campaign={campaign}
              cta="inspect_market_signals"
              channel="verifier_adoption_hero"
              className="btn"
            >
              Inspect signals
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
          </div>
        </FadeIn>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>verifier-minded builders will click proof before they click hype.</h2>
          <p>
            The strongest adoption wedge is not another AI prediction promise. It is a narrow verifier checklist for
            market theses: source fit, break condition, author record, and visible revisions before amplification.
          </p>
        </section>

        <section className="prediction-section" aria-label="Verifier adoption checks">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">verifier checks</p>
              <h2 className="section-title section-title-sm">four things to inspect before a forecast gets distributed.</h2>
            </div>
            <CampaignLink
              href={predictorsHref}
              campaign={campaign}
              cta="inspect_author_records"
              channel="verifier_adoption_checks"
              className="section-link"
            >
              Inspect author records
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {verifierChecks.map((item) => (
              <article key={item.label} className="product-module">
                <p className="section-kicker">verifier gate</p>
                <h3>{item.label}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-section" aria-label="Target audience">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">target audience</p>
              <h2 className="section-title section-title-sm">people who need forecast receipts to survive the feed.</h2>
            </div>
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="start_verifiable_thesis"
              channel="verifier_adoption_audience"
              className="section-link"
            >
              Start verifiable thesis
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {audiences.map((audience) => (
              <article key={audience} className="product-module">
                <h3>{audience}</h3>
                <p>Show the proof path first, then ask whether the reader wants to inspect, compose, or follow.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign sequence">
          <p className="section-kicker">Campaign sequence</p>
          <h2>make verifier intent measurable before asking for public posting approval.</h2>
          <ul>
            {campaignSequence.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="route-actions">
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="start_verifiable_thesis"
              channel="verifier_adoption_sequence"
              className="mobile-action mobile-action-primary"
            >
              Start verifiable thesis
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
          <h2>ship verifier language before bigger distribution.</h2>
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
            Metric to watch: sessions with <strong>utm_campaign=verifier_adoption</strong>, proof-record reads,
            market-signal clicks, author-record clicks, agent-manifest opens, compose starts, and @evapredicts follow
            clicks. Do not claim traction until those are measured.
          </p>
        </section>

    </PageShell>
  );
}
