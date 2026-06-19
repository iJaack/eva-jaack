import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { protocol } from "@/lib/protocol";

const campaign = "policy_safe_theses";
const campaignPath = "/campaigns/policy-safe-theses";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=draft_safe_thesis`;
const marketsHref = `/markets?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=review_safe_sources`;
const exampleHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=read_example`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;

export const metadata: Metadata = {
  title: "Policy-safe market theses · Eva",
  description:
    "Eva's policy-safe thesis campaign page for predictors who want cited, revisable market arguments without politics, war, sports betting, or tragedy bait.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "market theses need boundaries before distribution",
    description:
      "A transparent @evapredicts launch page for policy-safe thesis records: cited signals, visible revisions, and no prohibited-market bait.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "market theses need boundaries before distribution",
    description:
      "Policy-safe thesis records for public predictors: cited signals, visible revisions, and no prohibited-market bait.",
  },
};

const allowedAngles = [
  "company, protocol, or product theses with durable public signals",
  "market-structure calls where the reasoning can be inspected later",
  "agent or analyst forecasts that need revision history, not just screenshots",
] as const;

const excludedAngles = [
  "elections and presidential nomination markets",
  "sports betting and pure gambling prompts",
  "war, assassination, criminal investigations, personal tragedy, or easily manipulated events",
] as const;

const launchChecks = [
  {
    label: "source policy",
    body: "Only send traffic to thesis flows that keep V1-prohibited market classes out of discovery and compose selectors.",
  },
  {
    label: "public proof",
    body: "Pair each thesis with cited sources and visible revisions so @evapredicts is distributing a record, not an odds screenshot.",
  },
  {
    label: "campaign learning",
    body: "Measure whether explicit boundaries improve qualified clicks from builders who care about trustworthy agent output.",
  },
] as const;

const approvalCopy = [
  "prediction-market products do not get trust by showing more markets.",
  "they get trust by showing which markets they refuse to amplify.",
  "Eva is narrowing @evapredicts around policy-safe thesis records: cited signals, visible revisions, and no election / war / sports-betting bait.",
  `read the launch filter: ${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=policy_launch_post`,
] as const;

export default function PolicySafeThesesCampaignPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <section className="hero">
          <p className="eyebrow">@evapredicts campaign · policy-safe launch</p>
          <h1>market theses need boundaries before distribution.</h1>
          <p>
            Eva should not win attention by amplifying every market the feed can find. The sharper trust wedge is
            explicit restraint: cite durable public signals, keep revisions visible, and exclude the market classes
            that turn prediction products into controversy engines.
          </p>
          <div className="hero-actions">
            <Link href={composeHref} className="btn btn-primary">
              Draft a safe thesis
            </Link>
            <Link href={marketsHref} className="btn">
              Review source library
            </Link>
            <a href={followHref} className="btn" target="_blank" rel="noreferrer">
              Follow @evapredicts
            </a>
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>public predictors trust a thesis layer more when it shows its exclusions.</h2>
          <p>
            Most prediction surfaces optimize for breadth. Eva can earn a better first impression by saying what V1 is
            for: inspectable market theses around company, protocol, product, and market-structure questions where
            the attached evidence can improve over time.
          </p>
        </section>

        <section className="prediction-section" aria-label="Policy-safe scope">
          <div className="product-module-grid">
            <article className="product-module">
              <p className="section-kicker">Use Eva for</p>
              <h3>safe thesis surfaces</h3>
              <ul>
                {allowedAngles.map((angle) => (
                  <li key={angle}>{angle}</li>
                ))}
              </ul>
            </article>
            <article className="product-module">
              <p className="section-kicker">Do not amplify</p>
              <h3>prohibited-market bait</h3>
              <ul>
                {excludedAngles.map((angle) => (
                  <li key={angle}>{angle}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="paper-section" aria-label="Launch checks">
          <p className="section-kicker">Launch checks</p>
          <h2>ship the trust filter before asking for broader attention.</h2>
          <div className="product-module-grid">
            {launchChecks.map((check) => (
              <article key={check.label} className="product-module">
                <h3>{check.label}</h3>
                <p>{check.body}</p>
              </article>
            ))}
          </div>
          <div className="route-actions">
            <Link href={exampleHref} className="mobile-action mobile-action-primary">
              Read the safe example
            </Link>
            <Link href={composeHref} className="mobile-action">
              Draft one thesis
            </Link>
          </div>
        </section>

        <section className="paper-section" aria-label="@evapredicts copy to approve">
          <p className="section-kicker">@evapredicts copy to approve</p>
          <h2>one boundary-first post before the public reply sprint.</h2>
          <p>
            External posting still needs explicit approval. Once the source filter is verified, use this copy to make
            the policy stance part of the launch instead of hiding it in docs.
          </p>
          <blockquote>
            {approvalCopy.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
          <p className="inline-note">
            Metric to watch: sessions, follow clicks, and compose starts with <strong>utm_campaign=policy_safe_theses</strong>,
            compared against trust-receipts and reply-sprint traffic.
          </p>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
