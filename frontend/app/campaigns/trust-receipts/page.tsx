import type { Metadata } from "next";
import Link from "next/link";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
import { protocol } from "@/lib/protocol";

const campaign = "trust_receipts_launch";
const campaignPath = "/campaigns/trust-receipts";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=draft_thesis`;
const marketsHref = `/markets?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=find_signals`;
const exampleHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=read_example`;
const xLaunchHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=launch_post`;
const followHref = "https://x.com/evapredicts";

export const metadata: Metadata = {
  title: "Eva Protocol trust receipts campaign",
  description:
    "Launch page for prediction-market operators who want public theses with citations, revisions, and author records instead of screenshots and vibes.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "prediction markets need trust receipts",
    description:
      "Turn a market take into a cited, revisable public thesis with author records and source trails.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "prediction markets need trust receipts",
    description:
      "Turn a market take into a cited, revisable public thesis with author records and source trails.",
  },
};

const launchPost = [
  "prediction markets need trust receipts, not just screenshots.",
  "Eva turns a take into a public thesis with cited odds, facts, revision history, and an author record.",
  `start with the SpaceX IPO liquidity rotation example: ${xLaunchHref}`,
] as const;

const proofPoints = [
  {
    label: "Problem",
    value: "market takes decay into screenshots",
    body: "Prediction-market posts move fast, but the reasoning, source trail, and later corrections usually disappear from the feed.",
  },
  {
    label: "Promise",
    value: "one thesis, cited and revisable",
    body: "Eva turns a take into a public object with attached markets, facts, wallet/X authorship, and a visible update path.",
  },
  {
    label: "CTA",
    value: "draft one live thesis",
    body: "The launch action is not a generic signup. It asks a high-context predictor to convert one current market opinion into a record.",
  },
] as const;

const launchSequence = [
  "Post from @evapredicts with the SpaceX IPO thesis as the concrete example.",
  "Send traffic to this page with utm_campaign=trust_receipts_launch.",
  "Measure clicks into Draft thesis, Find signals, Read example, and @evapredicts follow intent before widening the campaign.",
] as const;

export default function TrustReceiptsCampaignPage() {
  return (
    <PageShell variant="page">
        <FadeIn className="hero">
          <p className="eyebrow">@evapredicts launch path</p>
          <h1>prediction markets need trust receipts.</h1>
          <p>
            If the take matters, it should not live only as a tweet. Eva lets operators publish the thesis,
            cite the odds and facts behind it, and update the record when reality moves.
          </p>
          <div className="hero-actions">
            <Link href={composeHref} className="btn btn-primary">
              Draft a thesis
            </Link>
            <Link href={exampleHref} className="btn">
              Read the example
            </Link>
            <a href={followHref} className="btn" target="_blank" rel="noreferrer">
              Follow @evapredicts
            </a>
          </div>
        </FadeIn>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>trust receipts convert better than generic prediction-market copy.</h2>
          <p>
            The audience already knows odds. The sharper wedge is accountability: every public market thesis
            should carry sources, revision history, and an inspectable author record.
          </p>
        </section>

        <section className="prediction-section" aria-label="Proof points">
          <div className="product-module-grid">
            {proofPoints.map((point) => (
              <article key={point.label} className="product-module">
                <p className="section-kicker">{point.label}</p>
                <h3>{point.value}</h3>
                <p>{point.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Launch sequence">
          <p className="section-kicker">Launch sequence</p>
          <h2>run one narrow loop before asking for broad attention.</h2>
          <ul>
            {launchSequence.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="route-actions">
            <Link href={marketsHref} className="mobile-action mobile-action-primary">
              Find live signals
            </Link>
            <Link href={composeHref} className="mobile-action">
              Start from a draft
            </Link>
          </div>
        </section>

        <section className="paper-section" aria-label="@evapredicts launch copy">
          <p className="section-kicker">@evapredicts copy to approve</p>
          <h2>one post, one example, one measurable CTA.</h2>
          <p>
            Publishing still needs explicit approval. When approved, use this as the first post and watch
            campaign-page clicks before expanding into replies or a thread.
          </p>
          <blockquote>
            {launchPost.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
          <p className="inline-note">Primary metric: clicks to Draft a thesis and Read the example from utm_content=launch_post.</p>
        </section>

    </PageShell>
  );
}
