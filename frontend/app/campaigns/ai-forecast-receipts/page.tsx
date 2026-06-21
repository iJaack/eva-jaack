import type { Metadata } from "next";
import Link from "next/link";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { protocol } from "@/lib/protocol";

const campaign = "ai_forecast_receipts";
const campaignPath = "/campaigns/ai-forecast-receipts";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=draft_receipted_forecast`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=spacex_proof_thesis`;
const marketsHref = `/markets?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_market_signals`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const socialHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=receipt_post`;

export const metadata: Metadata = {
  title: "AI forecast receipts · Eva",
  description:
    "A measurable @evapredicts landing page for AI forecasts with sources, revision triggers, and author/runtime trails.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "AI forecasts need receipts before they need reach",
    description:
      "Eva turns public forecast output into an inspectable thesis record: cited signals, visible revisions, and author/runtime context.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI forecasts need receipts before they need reach",
    description:
      "A campaign page for forecast receipts: source fit, revision triggers, and a record readers can inspect after the feed moves on.",
  },
};

const receiptRequirements = [
  {
    label: "source fit",
    body: "The forecast should show which market, fact, or second-order signal supports the claim instead of leaning on model confidence.",
  },
  {
    label: "revision trigger",
    body: "Readers need the condition that would change the call. Otherwise an update is just a fresh take with no accountability.",
  },
  {
    label: "author/runtime trail",
    body: "A useful public forecast should carry who published it, which identity stands behind it, and where the record can be checked later.",
  },
] as const;

const targetAudiences = [
  "agent builders shipping public forecast or research agents",
  "prediction-market operators who want higher-quality distribution than raw odds links",
  "crypto analysts using broad market calls as public reputation objects",
  "AI-news and research readers who need evidence before they amplify a forecast",
] as const;

const campaignSequence = [
  "Send approved @evapredicts traffic to this page with utm_campaign=ai_forecast_receipts.",
  "Route the first click into the SpaceX proof thesis so readers see a live receipted forecast, not abstract copy.",
  "Keep the angle only if it produces proof-thesis reads, market-signal clicks, compose starts, or follow clicks above the current campaign baseline.",
] as const;

const approvalCopy = [
  "AI forecasts do not need more confidence.",
  "they need receipts.",
  "what sources supported the call? what would make it change? who keeps the record after the feed moves on?",
  "that is the @evapredicts wedge for Eva: public forecast records with cited signals, visible revisions, and an author trail.",
  `start here: ${socialHref}`,
] as const;

export default function AiForecastReceiptsCampaignPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <CampaignViewTracker campaign={campaign} />
        <section className="hero">
          <p className="eyebrow">@evapredicts campaign · AI forecast receipts</p>
          <h1>AI forecasts need receipts before they need reach.</h1>
          <p>
            The next wave of public market commentary will not fail because agents are quiet. It will fail because the
            output is hard to inspect. Eva turns a forecast into a thesis record with cited signals, revision triggers,
            and author context readers can revisit.
          </p>
          <div className="hero-actions">
            <CampaignLink href={proofHref} campaign={campaign} cta="read_proof_thesis" className="btn btn-primary">
              Read proof thesis
            </CampaignLink>
            <CampaignLink href={composeHref} campaign={campaign} cta="draft_receipted_forecast" className="btn">
              Draft a receipted forecast
            </CampaignLink>
            <CampaignLink href={followHref} campaign={campaign} cta="follow_evapredicts" className="btn" target="_blank" rel="noreferrer" external>
              Follow @evapredicts
            </CampaignLink>
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>receipt framing should pull agent builders and prediction-market people into the product faster than launch copy.</h2>
          <p>
            The market already knows AI can produce confident forecasts. The sharper question is whether anyone can
            audit the before-state: source fit, revision logic, and the identity behind the output. This page gives
            @evapredicts a measurable destination for that wedge.
          </p>
        </section>

        <section className="prediction-section" aria-label="Forecast receipt requirements">
          <div className="product-module-grid">
            {receiptRequirements.map((requirement) => (
              <article key={requirement.label} className="product-module">
                <p className="section-kicker">receipt</p>
                <h3>{requirement.label}</h3>
                <p>{requirement.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-section" aria-label="Target audience">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">target audience</p>
              <h2 className="section-title section-title-sm">people whose forecasts need to be checked later.</h2>
            </div>
            <Link href={marketsHref} className="section-link">
              Inspect market signals
            </Link>
          </div>
          <div className="product-module-grid">
            {targetAudiences.map((audience) => (
              <article key={audience} className="product-module">
                <h3>{audience}</h3>
                <p>Send them to the proof record first, then measure whether they inspect signals or start a thesis.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign sequence">
          <p className="section-kicker">Campaign sequence</p>
          <h2>one receipt claim, one proof object, one measurable decision.</h2>
          <ul>
            {campaignSequence.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="route-actions">
            <CampaignLink href={proofHref} campaign={campaign} cta="inspect_proof_record" channel="campaign_sequence" className="mobile-action mobile-action-primary">
              Inspect proof record
            </CampaignLink>
            <CampaignLink href={composeHref} campaign={campaign} cta="start_receipted_forecast" channel="campaign_sequence" className="mobile-action">
              Start a receipted forecast
            </CampaignLink>
          </div>
        </section>

        <section className="paper-section" aria-label="@evapredicts copy to approve">
          <p className="section-kicker">@evapredicts copy to approve</p>
          <h2>make receipts the public ask.</h2>
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
            Metric to watch: sessions with <strong>utm_campaign=ai_forecast_receipts</strong>, proof-thesis reads,
            market-signal clicks, compose starts, and @evapredicts follow clicks. Do not claim traction until those are measured.
          </p>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
