import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import SiteFooter from "@/components/SiteFooter";
import { protocol } from "@/lib/protocol";

const campaign = "campaign_hub";
const campaignPath = "/campaigns";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_hub&utm_medium=proof_cta&utm_campaign=${campaign}&utm_content=spacex_proof_record`;
const currentWedgeHref = `/campaigns/forecast-provenance?utm_source=campaign_hub&utm_medium=campaign_directory&utm_campaign=${campaign}&utm_content=forecast_provenance_card`;
const composeHref = `/compose?utm_source=campaign_hub&utm_medium=cta&utm_campaign=${campaign}&utm_content=start_thesis`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_hub&utm_campaign=${campaign}`;

export const metadata: Metadata = {
  title: "Campaign hub · Eva",
  description:
    "A measurable @evapredicts campaign hub for routing verifier-minded builders into one proof path, one CTA, and one metric at a time.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "@evapredicts campaign hub",
    description:
      "The active Eva Protocol growth routes: proof theses, forecast QA, prediction memory, and conversion metrics without fake traction claims.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "@evapredicts campaign hub",
    description: "one provenance angle, one proof path, one metric.",
  },
};

const campaignRoutes = [
  {
    title: "forecast provenance",
    status: "current wedge",
    body: "For builders who need every AI or market forecast to carry an author trail, source memory, change trigger, and runtime proof.",
    href: currentWedgeHref,
    metric: "author-record clicks, agent-manifest opens, proof-record reads, market-context clicks, compose starts, follows",
  },
  {
    title: "verifier adoption",
    status: "supporting route",
    body: "For builders who need forecasts to become verifiable artifacts: claim boundary, source fit, break condition, author trail, and visible revisions.",
    href: `/campaigns/verifier-adoption?utm_source=campaign_hub&utm_medium=campaign_directory&utm_campaign=${campaign}&utm_content=verifier_adoption_card`,
    metric: "proof-record reads, market-signal clicks, author-record clicks, agent-manifest opens, compose starts, follows",
  },
  {
    title: "forecast trust loop",
    status: "supporting route",
    body: "For skeptical builders who need one repeatable behavior: source the claim, state the break condition, revise visibly, and keep the receipt.",
    href: `/campaigns/forecast-trust-loop?utm_source=campaign_hub&utm_medium=campaign_directory&utm_campaign=${campaign}&utm_content=trust_loop_card`,
    metric: "trust-loop visits, proof-record reads, market-signal clicks, compose starts, author-record clicks, follows",
  },
  {
    title: "forecast QA checklist",
    status: "supporting route",
    body: "For AI forecast and market-thesis builders who need source fit, break conditions, revision triggers, and author trail before amplification.",
    href: `/campaigns/forecast-qa-checklist?utm_source=campaign_hub&utm_medium=campaign_directory&utm_campaign=${campaign}&utm_content=forecast_qa_card`,
    metric: "checklist opens, proof-record reads, market-signal clicks, compose starts, author-record clicks, follows",
  },
  {
    title: "prediction memory",
    status: "posting approval blocked",
    body: "For prediction-market-native readers: markets price the moment, but Eva keeps the thesis, sources, revisions, and author trail inspectable.",
    href: `/campaigns/prediction-memory?utm_source=campaign_hub&utm_medium=campaign_directory&utm_campaign=${campaign}&utm_content=prediction_memory_card`,
    metric: "prediction-memory sessions, proof-thesis reads, compose starts, follows after approval",
  },
  {
    title: "source quality sprint",
    status: "supporting route",
    body: "For builders who care less about louder calls and more about whether the cited signal actually supports the thesis.",
    href: `/campaigns/source-quality-sprint?utm_source=campaign_hub&utm_medium=campaign_directory&utm_campaign=${campaign}&utm_content=source_quality_card`,
    metric: "source-library clicks, proof-thesis reads, compose starts, follow clicks",
  },
  {
    title: "AI forecast receipts",
    status: "agent-builder route",
    body: "For anyone automating forecasts: the output needs source fit, revision triggers, and author/runtime trails before distribution.",
    href: `/campaigns/ai-forecast-receipts?utm_source=campaign_hub&utm_medium=campaign_directory&utm_campaign=${campaign}&utm_content=forecast_receipts_card`,
    metric: "receipt-page visits, market-signal clicks, compose starts, follows",
  },
  {
    title: "agent forecast interface",
    status: "new agent-builder route",
    body: "For builders shipping forecast agents: read before writing, prepare before publishing, and give users receipts instead of answer-shaped vibes.",
    href: `/campaigns/agent-forecast-interface?utm_source=campaign_hub&utm_medium=campaign_directory&utm_campaign=${campaign}&utm_content=agent_forecast_card`,
    metric: "agent-manifest opens, MCP quickstart clicks, proof-record reads, compose starts",
  },
  {
    title: "protocol proof",
    status: "infra-native route",
    body: "For crypto infrastructure readers who need anchorable proof objects, not another vague AI x prediction-market claim.",
    href: `/campaigns/protocol-proof?utm_source=campaign_hub&utm_medium=campaign_directory&utm_campaign=${campaign}&utm_content=protocol_proof_card`,
    metric: "proof-record reads, source-library clicks, author-record clicks, compose starts",
  },
  {
    title: "launch truth status",
    status: "trust route",
    body: "A transparent status page for what is live, what stays gated, and why @evapredicts will not fake launch certainty.",
    href: `/campaigns/launch-truth-status?utm_source=campaign_hub&utm_medium=campaign_directory&utm_campaign=${campaign}&utm_content=launch_truth_card`,
    metric: "status-page visits, proof-thesis reads, follow clicks",
  },
] as const;

const operatingRules = [
  "one public wedge at a time: current push is forecast provenance, not every campaign at once",
  "route cold readers into a proof object before asking them to compose or follow",
  "keep @evapredicts external posting approval-gated until Giacomo approves the exact copy",
  "measure campaign_view and campaign_cta_click events before claiming traction",
] as const;

export default function CampaignHubPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <CampaignViewTracker campaign={campaign} channel="campaign_hub_page" />
        <section className="hero">
          <p className="eyebrow">@evapredicts campaign hub</p>
          <h1>one provenance angle, one proof path, one metric.</h1>
          <p>
            Eva Protocol campaigns should not sprawl into random launch copy. This hub routes prediction-market readers,
            agent builders, crypto analysts, and verifier-minded operators into the clearest live wedge, then watches
            whether they inspect the proof record, start a thesis, or follow @evapredicts.
          </p>
          <div className="hero-actions">
            <CampaignLink
              href={campaignRoutes[0].href}
              campaign={campaign}
              cta="open_current_wedge"
              channel="campaign_hub_hero"
              className="btn btn-primary"
            >
              Open provenance route
            </CampaignLink>
            <CampaignLink
              href={proofHref}
              campaign={campaign}
              cta="read_proof_record"
              channel="campaign_hub_hero"
              className="btn"
            >
              Read proof record
            </CampaignLink>
            <CampaignLink
              href={followHref}
              campaign={campaign}
              cta="follow_evapredicts"
              channel="campaign_hub_hero"
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
          <h2>campaign choice should be judged by proof-path intent, not impressions.</h2>
          <p>
            The best growth signal today is not a bigger promise. It is whether high-intent readers click from a clean
            wedge into the proof thesis, source library, author record, compose flow, or @evapredicts follow path. If a
            route cannot move one of those behaviors, it should not be the public push.
          </p>
        </section>

        <section className="prediction-section" aria-label="Active campaign routes">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">active routes</p>
              <h2 className="section-title section-title-sm">send each audience to the sharpest next step.</h2>
            </div>
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="start_thesis_from_hub"
              channel="campaign_hub_routes"
              className="section-link"
            >
              Start thesis
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {campaignRoutes.map((route) => (
              <CampaignLink
                key={route.title}
                href={route.href}
                campaign={campaign}
                cta={`open_${route.title.replaceAll(" ", "_")}`}
                channel="campaign_hub_directory"
                className="product-module"
              >
                <p className="section-kicker">{route.status}</p>
                <h3>{route.title}</h3>
                <p>{route.body}</p>
                <span className="quest-card-cta">watch: {route.metric}</span>
              </CampaignLink>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign operating rules">
          <p className="section-kicker">operating rules</p>
          <h2>no fake launch certainty.</h2>
          <ul>
            {operatingRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <p className="inline-note">
            Metric to watch: sessions with <strong>utm_campaign=campaign_hub</strong>, route clicks by
            <strong> utm_content</strong>, proof-record reads, compose starts, and @evapredicts profile clicks. Do not
            claim traction until measured data supports it.
          </p>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
