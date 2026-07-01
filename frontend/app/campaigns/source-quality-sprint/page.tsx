import type { Metadata } from "next";
import Link from "next/link";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
import { protocol } from "@/lib/protocol";

const campaign = "source_quality_sprint";
const campaignPath = "/campaigns/source-quality-sprint";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=draft_source_quality_thesis`;
const marketsHref = `/markets?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=inspect_source_library`;
const exampleHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=read_spacex_source_record`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const xPostHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=source_quality_post`;

export const metadata: Metadata = {
  title: "Source quality sprint · Eva",
  description:
    "A measurable @evapredicts campaign page for turning source quality into the first trust test for public market theses.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "prediction feeds need source quality, not louder calls",
    description:
      "Eva turns a market call into a cited thesis with source trails, revisions, and an author record readers can inspect.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "prediction feeds need source quality, not louder calls",
    description:
      "A source-quality campaign for public theses: cited signals, visible revisions, and no loose odds screenshots.",
  },
};

const sourceQualityChecks = [
  {
    label: "signal fit",
    body: "Does the cited market or fact actually support the claim, or is it just attached because it looks impressive?",
  },
  {
    label: "revision trigger",
    body: "What would make the thesis change, and can readers see the update instead of guessing from a fresh post?",
  },
  {
    label: "author trail",
    body: "Can the reader inspect who published the call and whether the record survives outside the timeline?",
  },
] as const;

const audienceCards = [
  "prediction-market operators who need higher-quality distribution than raw odds links",
  "agent builders who want public forecasts to carry inspectable evidence before automation",
  "crypto analysts whose calls need a record readers can revisit after the market moves",
] as const;

const sprintSequence = [
  "Send one narrow @evapredicts post or approved reply to this page with utm_campaign=source_quality_sprint.",
  "Ask readers to inspect the SpaceX proof thesis before drafting their own sourced thesis.",
  "Keep or kill the angle based on example-thesis reads, source-library clicks, compose starts, and follow clicks.",
] as const;

const approvalCopy = [
  "prediction feeds do not need louder calls.",
  "they need source quality.",
  "the useful object is not “odds went up”. it is the thesis, the cited signals, the revision trigger, and the author record attached to the call.",
  `that is the loop @evapredicts is testing with Eva: ${xPostHref}`,
] as const;

export default function SourceQualitySprintCampaignPage() {
  return (
    <PageShell variant="page">
        <FadeIn className="hero">
          <p className="eyebrow">@evapredicts campaign · source quality sprint</p>
          <h1>prediction feeds need source quality, not louder calls.</h1>
          <p>
            The next trust test is simple: can a reader inspect why a public market thesis exists, what sources support
            it, and what would force it to change? Eva makes that record the product instead of asking people to trust a
            timeline screenshot.
          </p>
          <div className="hero-actions">
            <Link href={exampleHref} className="btn btn-primary">
              Inspect proof thesis
            </Link>
            <Link href={marketsHref} className="btn">
              Inspect sources
            </Link>
            <a href={followHref} className="btn" target="_blank" rel="noreferrer">
              Follow @evapredicts
            </a>
          </div>
        </FadeIn>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>source-quality framing will create higher-intent clicks than generic launch copy.</h2>
          <p>
            Prediction-market-native builders already understand probabilities. The missing trust layer is quality
            control around the claim: source fit, revision triggers, and an author trail that survives the feed.
          </p>
        </section>

        <section className="prediction-section" aria-label="Source quality checks">
          <div className="product-module-grid">
            {sourceQualityChecks.map((check) => (
              <article key={check.label} className="product-module">
                <p className="section-kicker">check</p>
                <h3>{check.label}</h3>
                <p>{check.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prediction-section" aria-label="Target audience">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">target audience</p>
              <h2 className="section-title section-title-sm">people who need market calls to be checkable later.</h2>
            </div>
            <Link href={composeHref} className="section-link">
              Draft sourced thesis
            </Link>
          </div>
          <div className="product-module-grid">
            {audienceCards.map((audience) => (
              <article key={audience} className="product-module">
                <h3>{audience}</h3>
                <p>Send them to one proof object, then measure whether they inspect sources or start a thesis.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Sprint sequence">
          <p className="section-kicker">Sprint sequence</p>
          <h2>one angle, one proof object, one decision.</h2>
          <ul>
            {sprintSequence.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="route-actions">
            <Link href={exampleHref} className="mobile-action mobile-action-primary">
              Read source record
            </Link>
            <Link href={composeHref} className="mobile-action">
              Draft after reading
            </Link>
          </div>
        </section>

        <section className="paper-section" aria-label="@evapredicts copy to approve">
          <p className="section-kicker">@evapredicts copy to approve</p>
          <h2>make source quality the public ask.</h2>
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
            Metric to watch: sessions with <strong>utm_campaign=source_quality_sprint</strong>, proof-thesis reads,
            source-library clicks, compose starts, and @evapredicts follow clicks. Do not claim traction until those are measured.
          </p>
        </section>

    </PageShell>
  );
}
