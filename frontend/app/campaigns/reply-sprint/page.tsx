import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { protocol } from "@/lib/protocol";

const campaign = "evapredicts_reply_sprint";
const campaignPath = "/campaigns/reply-sprint";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const thesisBase = "/thesis/thesis-0fdef25794b38b6e8eed7524";
const followHref = "https://x.com/evapredicts";
const exampleHref = `${thesisBase}?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=read_spacex_thesis`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=draft_sourced_thesis`;

export const metadata: Metadata = {
  title: "@evapredicts reply sprint · Eva",
  description:
    "Approval-ready X reply campaign for turning live prediction-market conversations into visits to Eva's sourced thesis record.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "@evapredicts reply sprint",
    description:
      "A narrow distribution sprint for prediction-market conversations: cited thesis, visible revisions, measurable CTA.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "@evapredicts reply sprint",
    description:
      "A narrow distribution sprint for prediction-market conversations: cited thesis, visible revisions, measurable CTA.",
  },
};

const targets = [
  {
    label: "X-native distribution",
    angle: "distribution is not enough if the market call has no inspectable record",
    content: "x_native_distribution",
  },
  {
    label: "InfoFi category gap",
    angle: "prediction-market quality should be scored by cited theses, not loose category labels",
    content: "infofi_category_gap",
  },
  {
    label: "Market friction criticism",
    angle: "Eva is the explanation layer around the trade, not another venue",
    content: "market_friction",
  },
] as const;

const replyDrafts = [
  {
    title: "distribution thread",
    body: [
      "agree. distribution is the hard part.",
      "but imo the primitive is not “a market embedded in X”. it’s a thesis people can inspect: the call, the markets behind it, the facts attached, and every revision after reality moves.",
      "example: {UTM_LINK}",
    ],
  },
  {
    title: "category gap",
    body: [
      "prediction markets probably deserve their own category, but the ranking signal should be more than “posted about markets”.",
      "best version is: did this person publish a thesis, cite the markets/facts, and update it when the world changed?",
      "that’s the object we’re testing with Eva: {UTM_LINK}",
    ],
  },
  {
    title: "market friction",
    body: [
      "yep, a lot of prediction-market UX is still too much venue and not enough argument.",
      "Eva is attacking the layer around the trade: a public thesis with market signals, fact signals, and revision history.",
      "less “trust my take”, more “inspect how the take moved”.",
      "{UTM_LINK}",
    ],
  },
] as const;

function targetHref(content: string) {
  return `${thesisBase}?utm_source=x&utm_medium=reply&utm_campaign=${campaign}&utm_content=${content}`;
}

export default function ReplySprintCampaignPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <section className="hero">
          <p className="eyebrow">@evapredicts campaign · approval required</p>
          <h1>turn live market debates into thesis clicks.</h1>
          <p>
            The next growth move is not a cold announcement. It is a small, approval-gated reply sprint under
            prediction-market conversations where Eva can contrast an odds screenshot with a cited thesis record.
          </p>
          <div className="hero-actions">
            <Link href={exampleHref} className="btn btn-primary">
              Read the proof thesis
            </Link>
            <a href={followHref} className="btn" target="_blank" rel="noreferrer">
              Follow @evapredicts
            </a>
            <Link href={composeHref} className="btn">
              Draft a sourced thesis
            </Link>
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>reply context will teach Eva faster than a generic launch post.</h2>
          <p>
            Readers already arguing about prediction markets should understand the product from one sharp contrast:
            a market price is a signal, but the durable artifact is the thesis, its sources, and its revision trail.
          </p>
        </section>

        <section className="prediction-section" aria-label="Reply targets">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">target shortlist</p>
              <h2 className="section-title section-title-sm">three reply angles, one measurable link.</h2>
            </div>
            <Link href={exampleHref} className="section-link">
              Open SpaceX thesis
            </Link>
          </div>
          <div className="product-module-grid">
            {targets.map((target) => (
              <article key={target.content} className="product-module">
                <p className="section-kicker">{target.label}</p>
                <h3>{target.angle}</h3>
                <p>
                  Send qualified readers to the SpaceX thesis with <strong>utm_content={target.content}</strong>.
                </p>
                <a href={targetHref(target.content)} className="quest-card-cta">
                  test link
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Reply drafts">
          <p className="section-kicker">copy to approve</p>
          <h2>keep it useful, not spammy.</h2>
          <p>
            Publish two replies max in the first pass after explicit approval. Re-check each thread before posting;
            if the conversation moved, adapt the copy or skip it.
          </p>
          {replyDrafts.map((draft) => (
            <blockquote key={draft.title}>
              <p>{draft.title}</p>
              {draft.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </blockquote>
          ))}
        </section>

        <section className="paper-section" aria-label="Measurement plan">
          <p className="section-kicker">metric to watch</p>
          <h2>qualified thesis visits from X replies.</h2>
          <ul>
            <li>Primary: sessions on the SpaceX thesis with utm_campaign={campaign}.</li>
            <li>Secondary: clicks into Preview X copy, thesis share/copy events, and @evapredicts follows.</li>
            <li>Decision: keep the angle only if it produces real product-learning signals, not vanity impressions.</li>
          </ul>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
