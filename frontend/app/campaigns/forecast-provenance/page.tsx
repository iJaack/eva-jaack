import type { Metadata } from "next";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
import { protocol } from "@/lib/protocol";

const campaign = "forecast_provenance";
const campaignPath = "/campaigns/forecast-provenance";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=proof_cta&utm_campaign=${campaign}&utm_content=spacex_proof_record`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=start_provenance_thesis`;
const predictorsHref = `/predictors?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_author_records`;
const marketsHref = `/markets?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_market_context`;
const manifestHref = `/.well-known/agent.json?utm_source=campaign_page&utm_medium=agent_manifest&utm_campaign=${campaign}&utm_content=agent_manifest`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const socialHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=provenance_post`;

export const metadata: Metadata = {
  title: "Forecast provenance · Eva",
  description:
    "A measurable @evapredicts campaign route for readers who need to know who made a forecast, what it read, and what changed.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "the missing field in AI forecasts is provenance",
    description:
      "Eva turns forecasts into records with author identity, cited sources, revision triggers, and visible change history.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "the missing field in AI forecasts is provenance",
    description: "who made the call, what it read, what would change it, and where the update lives.",
  },
};

const provenanceFields = [
  {
    label: "author trail",
    body: "The forecast points to an inspectable author record instead of floating through the feed as anonymous confidence.",
  },
  {
    label: "source memory",
    body: "Readers can see which markets, facts, and links supported the claim before deciding whether to trust it.",
  },
  {
    label: "change trigger",
    body: "The thesis names the evidence that should force an update, so revisions are part of the record, not damage control.",
  },
  {
    label: "runtime proof",
    body: "Agent-made forecasts can point to a manifest and proof path, giving builders something better than answer-shaped vibes.",
  },
] as const;

const audiences = [
  "agent builders who need forecast outputs to carry receipts before they hit distribution",
  "prediction-market teams that want public calls to stay auditable after odds move",
  "crypto analysts who care whether a thesis has sources, revision logic, and author context",
  "protocol teams evaluating AI forecasting without pretending screenshots are verification",
] as const;

const campaignSequence = [
  "Route provenance-minded traffic to this page with utm_campaign=forecast_provenance.",
  "Ask readers to inspect author records, the agent manifest, market context, or the proof thesis before composing.",
  "Keep the wedge only if it produces author-record clicks, manifest opens, proof-record reads, compose starts, or @evapredicts follows.",
] as const;

const approvalCopy = [
  "the missing field in most AI forecasts is provenance.",
  "who made the call? what did it read? what would change it? where does the revision live?",
  "Eva is building the receipt layer around public theses so forecasts can be inspected after the feed moves on.",
  "less magic answer. more accountable record.",
  `start here: ${socialHref}`,
] as const;

export default function ForecastProvenanceCampaignPage() {
  return (
    <PageShell variant="page">
        <CampaignViewTracker campaign={campaign} channel="forecast_provenance_page" />
        <FadeIn className="hero">
          <p className="eyebrow">@evapredicts campaign · forecast provenance</p>
          <h1>the missing field in AI forecasts is provenance.</h1>
          <p>
            Forecasts get less useful when the author, source trail, revision trigger, and change history disappear.
            Eva Protocol turns each public thesis into an inspectable record: who made the call, what it read, what would
            change it, and where the update lives.
          </p>
          <div className="hero-actions">
            <CampaignLink
              href={predictorsHref}
              campaign={campaign}
              cta="inspect_author_records"
              channel="forecast_provenance_hero"
              className="btn btn-primary"
            >
              Inspect author records
            </CampaignLink>
            <CampaignLink
              href={proofHref}
              campaign={campaign}
              cta="read_proof_record"
              channel="forecast_provenance_hero"
              className="btn"
            >
              Read proof record
            </CampaignLink>
            <CampaignLink
              href={manifestHref}
              campaign={campaign}
              cta="open_agent_manifest"
              channel="forecast_provenance_hero"
              className="btn"
            >
              Open agent manifest
            </CampaignLink>
          </div>
        </FadeIn>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>provenance converts better than generic AI prediction claims.</h2>
          <p>
            The sharper public ask is not “AI can forecast.” It is “show me the provenance of the forecast.” Builders and
            analysts who care about that standard should click into author records, proof links, market context, and agent
            manifests before they start a new thesis.
          </p>
        </section>

        <section className="prediction-section" aria-label="Forecast provenance fields">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">provenance fields</p>
              <h2 className="section-title section-title-sm">four receipts every public forecast should carry.</h2>
            </div>
            <CampaignLink
              href={marketsHref}
              campaign={campaign}
              cta="inspect_market_context"
              channel="forecast_provenance_fields"
              className="section-link"
            >
              Inspect market context
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {provenanceFields.map((item) => (
              <article key={item.label} className="product-module">
                <p className="section-kicker">record field</p>
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
              <h2 className="section-title section-title-sm">people who need forecasts to be inspectable, not just fast.</h2>
            </div>
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="start_provenance_thesis"
              channel="forecast_provenance_audience"
              className="section-link"
            >
              Start provenance thesis
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {audiences.map((audience) => (
              <article key={audience} className="product-module">
                <h3>{audience}</h3>
                <p>Show provenance first, then ask whether the reader wants to inspect, compose, or follow.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign sequence">
          <p className="section-kicker">Campaign sequence</p>
          <h2>turn provenance intent into measurable next steps.</h2>
          <ul>
            {campaignSequence.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="route-actions">
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="start_provenance_thesis"
              channel="forecast_provenance_sequence"
              className="mobile-action mobile-action-primary"
            >
              Start provenance thesis
            </CampaignLink>
            <CampaignLink
              href={followHref}
              campaign={campaign}
              cta="follow_evapredicts"
              channel="forecast_provenance_sequence"
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
          <h2>make provenance the public hook before broader distribution.</h2>
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
            Metric to watch: sessions with <strong>utm_campaign=forecast_provenance</strong>, author-record clicks,
            agent-manifest opens, proof-record reads, market-context clicks, compose starts, and @evapredicts follow
            clicks. Do not claim traction until measured data supports it.
          </p>
        </section>

    </PageShell>
  );
}
