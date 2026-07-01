import type { Metadata } from "next";
import Link from "next/link";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
import { protocol } from "@/lib/protocol";

const campaign = "protocol_proof";
const campaignPath = "/campaigns/protocol-proof";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=spacex_proof_record`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=start_proof_backed_thesis`;
const marketsHref = `/markets?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_signal_library`;
const predictorsHref = `/predictors?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_author_records`;
const agentManifestHref = `/.well-known/agent.json?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=agent_manifest`;
const mcpQuickstartHref = "https://github.com/iJaack/eva-jaack/blob/main/docs/MCP_AGENT_QUICKSTART.md";
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const socialHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=protocol_proof_post`;
const liveThreadHref = "https://x.com/evapredicts/status/2072257036251767031";
const liveProofReplyHref = "https://x.com/evapredicts/status/2072257074587660786";

export const metadata: Metadata = {
  title: "Protocol proof · Eva",
  description:
    "A measurable @evapredicts campaign page for positioning Eva Protocol as proof infrastructure for public market theses.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "public predictions need protocol proof, not louder claims",
    description:
      "Eva Protocol turns market theses into proof-backed records: cited signals, version history, author identity, and onchain anchors.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "public predictions need protocol proof, not louder claims",
    description:
      "A campaign page for proof-backed public market theses: sources, revisions, author records, and anchorable evidence.",
  },
};

const proofLayers = [
  {
    label: "source proof",
    body: "The thesis keeps market signals and fact signals attached, so a reader can inspect what supported the argument before the market moved.",
  },
  {
    label: "revision proof",
    body: "Material updates append to the same record instead of replacing the old take with a cleaner version after the fact.",
  },
  {
    label: "author proof",
    body: "X identity plus wallet identity gives every thesis a record that can survive outside one social feed or screenshot thread.",
  },
  {
    label: "anchor proof",
    body: "The protocol layer gives public market theses a timestamped artifact path before execution, trading, or reputation claims expand.",
  },
] as const;

const targetAudiences = [
  "prediction-market operators who want higher-quality distribution than odds screenshots",
  "agent builders whose forecast outputs need receipts before users delegate decisions",
  "crypto analysts turning broad market calls into reputation-bearing public records",
  "protocol and infra buyers who care about trust rails more than another consumer feed",
] as const;

const audienceRoutes = [
  {
    title: "prediction-market operator",
    body: "Inspect the proof thesis before the protocol pitch. The question is whether the cited sources and revisions make the take easier to trust later.",
    href: proofHref,
    cta: "read_operator_proof_record",
    label: "Read proof record",
  },
  {
    title: "forecast-agent builder",
    body: "Open the live agent manifest, then use the MCP quickstart to see the draft-and-anchor boundary agents must respect before distribution.",
    href: agentManifestHref,
    cta: "open_agent_manifest",
    label: "Open agent manifest",
  },
  {
    title: "crypto analyst",
    body: "Start with one broad market thesis, attach the evidence, and keep the revision trigger visible instead of burying it in a thread.",
    href: composeHref,
    cta: "start_analyst_thesis",
    label: "Start thesis",
  },
] as const;

const campaignSequence = [
  "Keep approved @evapredicts traffic on this page with utm_campaign=protocol_proof.",
  "Route the first click into the SpaceX proof record so readers inspect the object before they hear the protocol claim.",
  "Keep the angle only if the live thread beats softer launch copy on proof-record reads, source-library clicks, compose starts, author-record clicks, or follows.",
] as const;

const liveThreadCopy = [
  "public predictions do not need louder confidence.",
  "they need proof objects.",
  "what sources supported the call? what changed? who authored it? where is the record after the feed moves on?",
  "that is the Eva Protocol wedge: market theses with cited signals, visible revisions, author identity, and anchorable evidence.",
  `start here: ${socialHref}`,
] as const;

export default function ProtocolProofCampaignPage() {
  return (
    <PageShell variant="page">
        <CampaignViewTracker campaign={campaign} channel="protocol_proof_page" />
        <FadeIn className="hero">
          <p className="eyebrow">@evapredicts campaign · protocol proof</p>
          <h1>public predictions need protocol proof, not louder claims.</h1>
          <p>
            Prediction markets already expose prices. Eva Protocol makes the argument around a price inspectable: cited
            signals, version history, author identity, and an anchorable record readers can revisit after the timeline
            moves on.
          </p>
          <div className="hero-actions">
            <CampaignLink
              href={proofHref}
              campaign={campaign}
              cta="read_proof_record"
              channel="protocol_proof_hero"
              className="btn btn-primary"
            >
              Read proof record
            </CampaignLink>
            <CampaignLink
              href={composeHref}
              campaign={campaign}
              cta="start_proof_backed_thesis"
              channel="protocol_proof_hero"
              className="btn"
            >
              Start proof-backed thesis
            </CampaignLink>
            <CampaignLink
              href={followHref}
              campaign={campaign}
              cta="follow_evapredicts"
              channel="protocol_proof_hero"
              className="btn"
              target="_blank"
              rel="noreferrer"
              external
            >
              Follow @evapredicts
            </CampaignLink>
          </div>
        </FadeIn>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>proof framing should attract infra-minded builders faster than another prediction-product launch post.</h2>
          <p>
            The best early audience for Eva is not chasing a new odds page. They care whether public forecasts can be
            audited later. This page turns that trust-infrastructure thesis into a measurable campaign path.
          </p>
        </section>

        <section className="prediction-section" aria-label="Protocol proof layers">
          <div className="product-module-grid">
            {proofLayers.map((layer) => (
              <article key={layer.label} className="product-module">
                <p className="section-kicker">proof layer</p>
                <h3>{layer.label}</h3>
                <p>{layer.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-section" aria-label="Target audience">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">target audience</p>
              <h2 className="section-title section-title-sm">people who need forecasts to become accountable records.</h2>
            </div>
            <CampaignLink
              href={predictorsHref}
              campaign={campaign}
              cta="inspect_author_records"
              channel="protocol_proof_audience"
              className="section-link"
            >
              Inspect author records
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {targetAudiences.map((audience) => (
              <article key={audience} className="product-module">
                <h3>{audience}</h3>
                <p>Send them to the proof record first, then measure whether they inspect records or start a thesis.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-section" aria-label="Protocol proof audience routes">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">conversion routes</p>
              <h2 className="section-title section-title-sm">do not send every reader to the same proof step.</h2>
            </div>
            <CampaignLink
              href={mcpQuickstartHref}
              campaign={campaign}
              cta="open_mcp_quickstart"
              channel="protocol_proof_routes"
              className="section-link"
              target="_blank"
              rel="noreferrer"
              external
            >
              Open MCP quickstart
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {audienceRoutes.map((route) => (
              <CampaignLink
                key={route.title}
                href={route.href}
                campaign={campaign}
                cta={route.cta}
                channel="protocol_proof_routes"
                className="product-module"
              >
                <p className="section-kicker">route</p>
                <h3>{route.title}</h3>
                <p>{route.body}</p>
                <span className="quest-card-cta">{route.label}</span>
              </CampaignLink>
            ))}
          </div>
          <p className="inline-note">
            Metric to watch: which audience route earns the next click: proof-record reads, agent-manifest opens, MCP
            quickstart clicks, live-thread clicks, compose starts, or @evapredicts follows.
          </p>
        </section>

        <section className="paper-section" aria-label="Campaign sequence">
          <p className="section-kicker">Campaign sequence</p>
          <h2>one protocol claim, one proof object, one measurable decision.</h2>
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
              channel="protocol_proof_sequence"
              className="mobile-action mobile-action-primary"
            >
              Inspect proof record
            </CampaignLink>
            <CampaignLink
              href={marketsHref}
              campaign={campaign}
              cta="inspect_signal_library"
              channel="protocol_proof_sequence"
              className="mobile-action"
            >
              Inspect signal library
            </CampaignLink>
          </div>
        </section>

        <section className="paper-section" aria-label="Published @evapredicts thread">
          <p className="section-kicker">live @evapredicts thread</p>
          <h2>make proof the public wedge, then measure the path.</h2>
          <p>
            The approved protocol-proof thread is live. This page now routes campaign traffic into the thread, the proof
            thesis, and audience-specific proof steps without claiming traction before the numbers exist.
          </p>
          <blockquote>
            {liveThreadCopy.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
          <div className="route-actions">
            <CampaignLink
              href={liveThreadHref}
              campaign={campaign}
              cta="read_live_thread"
              channel="protocol_proof_live_thread"
              className="mobile-action mobile-action-primary"
              target="_blank"
              rel="noreferrer"
              external
            >
              Read live thread
            </CampaignLink>
            <CampaignLink
              href={liveProofReplyHref}
              campaign={campaign}
              cta="read_live_proof_reply"
              channel="protocol_proof_live_thread"
              className="mobile-action"
              target="_blank"
              rel="noreferrer"
              external
            >
              Open proof reply
            </CampaignLink>
          </div>
          <p className="inline-note">
            Metric to watch: sessions with <strong>utm_campaign=protocol_proof</strong>, proof-record reads,
            source-library clicks, live-thread clicks, compose starts, author-record clicks, and @evapredicts follow
            clicks. Do not claim traction until those are measured.
          </p>
        </section>

    </PageShell>
  );
}
