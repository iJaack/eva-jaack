import type { Metadata } from "next";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
import { protocol } from "@/lib/protocol";

const campaign = "agent_forecast_interface";
const campaignPath = "/campaigns/agent-forecast-interface";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=proof_cta&utm_campaign=${campaign}&utm_content=spacex_proof_record`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=start_agent_ready_thesis`;
const marketsHref = `/markets?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_market_signals`;
const predictorHref = `/predictors?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_author_records`;
const manifestHref = `/.well-known/agent.json?utm_source=campaign_page&utm_medium=agent_manifest&utm_campaign=${campaign}&utm_content=agent_manifest`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const quickstartHref = "https://github.com/iJaack/eva-jaack/blob/main/docs/MCP_AGENT_QUICKSTART.md";
const socialHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=interface_post`;

export const metadata: Metadata = {
  title: "Agent forecast interface · Eva",
  description:
    "A measurable @evapredicts campaign page for agent builders who need forecasts to carry sources, revision triggers, and author/runtime receipts.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "forecast agents need an interface for receipts",
    description:
      "Eva gives forecast agents a narrow path: inspect markets, prepare thesis drafts, preserve revision history, and hand users a proof object instead of a loose answer.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "forecast agents need an interface for receipts",
    description: "source fit, revision triggers, author trail, and proof links for agent-written market theses.",
  },
};

const interfaceChecks = [
  {
    label: "read path",
    body: "The agent can inspect policy-safe markets and existing thesis records before it writes anything.",
  },
  {
    label: "draft boundary",
    body: "The agent prepares a thesis or revision for review. It does not silently publish, trade, or broadcast.",
  },
  {
    label: "receipt fields",
    body: "The output carries source fit, revision trigger, author identity, wallet source, and a clear publish-state ceiling.",
  },
  {
    label: "public object",
    body: "The user gets a thesis page or proof link that survives the feed instead of trusting a one-shot answer.",
  },
] as const;

const audiences = [
  "agent builders turning prediction-market data into public forecast outputs",
  "prediction-market operators who want agent distribution without unverifiable screenshots",
  "crypto analysts using agents to draft, counter, or revise market theses",
  "protocol teams comparing AI forecast UX by source quality and permission boundaries",
] as const;

const campaignSequence = [
  "Route agent-builder traffic to this page with utm_campaign=agent_forecast_interface.",
  "Send high-intent readers to the agent manifest, MCP quickstart, proof thesis, or compose flow depending on their intent.",
  "Keep the wedge only if it produces manifest opens, quickstart clicks, proof-record reads, compose starts, author-record clicks, or follows.",
] as const;

const approvalCopy = [
  "forecast agents do not need more confidence.",
  "they need an interface for receipts.",
  "what market did the agent inspect? what source would change the thesis? who authored it? what did it actually publish, if anything?",
  "Eva's wedge is the proof object around the forecast, not a louder answer machine.",
  `start here: ${socialHref}`,
] as const;

export default function AgentForecastInterfaceCampaignPage() {
  return (
    <PageShell variant="page">
        <CampaignViewTracker campaign={campaign} channel="agent_forecast_interface_page" />
        <FadeIn className="hero">
          <p className="eyebrow">@evapredicts campaign · agent forecast interface</p>
          <h1>forecast agents need an interface for receipts.</h1>
          <p>
            If an agent can write a market call, the product question is not whether it sounds smart. It is whether the
            user can inspect the sources, revision trigger, author trail, and publish boundary after the feed moves on.
          </p>
          <div className="hero-actions">
            <CampaignLink
              href={manifestHref}
              campaign={campaign}
              cta="open_agent_manifest"
              channel="agent_forecast_hero"
              className="btn btn-primary"
            >
              Open agent manifest
            </CampaignLink>
            <CampaignLink
              href={proofHref}
              campaign={campaign}
              cta="read_proof_record"
              channel="agent_forecast_hero"
              className="btn"
            >
              Read proof record
            </CampaignLink>
            <CampaignLink
              href={quickstartHref}
              campaign={campaign}
              cta="read_mcp_quickstart"
              channel="agent_forecast_hero"
              className="btn"
              target="_blank"
              rel="noreferrer"
              external
            >
              Read MCP quickstart
            </CampaignLink>
          </div>
        </FadeIn>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>agent builders will click when the ask is interface quality, not prediction magic.</h2>
          <p>
            The audience already believes agents can generate forecasts. The sharper wedge is that public forecast agents
            need a constrained interface: read before writing, prepare before publishing, receipts before distribution.
          </p>
        </section>

        <section className="prediction-section" aria-label="Agent forecast interface checks">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">interface checks</p>
              <h2 className="section-title section-title-sm">four gates before an agent forecast gets amplified.</h2>
            </div>
            <CampaignLink
              href={marketsHref}
              campaign={campaign}
              cta="inspect_market_signals"
              channel="agent_forecast_checks"
              className="section-link"
            >
              Inspect market signals
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {interfaceChecks.map((item) => (
              <article key={item.label} className="product-module">
                <p className="section-kicker">agent gate</p>
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
              <h2 className="section-title section-title-sm">builders who need agent outputs to be inspectable.</h2>
            </div>
            <CampaignLink
              href={predictorHref}
              campaign={campaign}
              cta="inspect_author_records"
              channel="agent_forecast_audience"
              className="section-link"
            >
              Inspect author records
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {audiences.map((audience) => (
              <article key={audience} className="product-module">
                <h3>{audience}</h3>
                <p>Show the interface boundary, then route them to a proof-backed thesis where the standard is visible.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign sequence">
          <p className="section-kicker">Campaign sequence</p>
          <h2>make agent-readiness measurable before widening @evapredicts distribution.</h2>
          <ul>
            {campaignSequence.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="route-actions">
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="start_agent_ready_thesis"
              channel="agent_forecast_sequence"
              className="mobile-action mobile-action-primary"
            >
              Start agent-ready thesis
            </CampaignLink>
            <CampaignLink
              href={followHref}
              campaign={campaign}
              cta="follow_evapredicts"
              channel="agent_forecast_sequence"
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
          <h2>ship the boundary, not an agent hype post.</h2>
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
            Metric to watch: sessions with <strong>utm_campaign=agent_forecast_interface</strong>, agent-manifest opens,
            MCP quickstart clicks, proof-record reads, compose starts, author-record clicks, and @evapredicts follow
            clicks. Do not claim traction until those are measured.
          </p>
        </section>

    </PageShell>
  );
}
