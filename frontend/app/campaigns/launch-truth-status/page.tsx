import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { protocol } from "@/lib/protocol";

const campaign = "launch_truth_status";
const campaignPath = "/campaigns/launch-truth-status";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=spacex_proof`;
const policyHref = `/campaigns/policy-safe-theses?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=policy_safe_page`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=draft_after_clearance`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const xPostHref = `${campaignUrl}?utm_source=x&utm_medium=social&utm_campaign=${campaign}&utm_content=status_post`;

export const metadata: Metadata = {
  title: "Launch truth status · Eva",
  description:
    "A transparent Eva Protocol campaign page for launch-readiness status, current proof, and the @evapredicts follow CTA before the public thesis loop widens.",
  alternates: {
    canonical: campaignPath,
  },
  openGraph: {
    title: "Eva launch truth status",
    description:
      "What is live, what stays gated, and what @evapredicts will measure before broadening the public prediction campaign.",
    url: campaignUrl,
    siteName: "Eva Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eva launch truth status",
    description:
      "Transparent launch-readiness status for Eva's thesis record before the public @evapredicts push widens.",
  },
};

const liveProof = [
  {
    label: "public proof object",
    body: "The SpaceX IPO liquidity rotation thesis is live as the first inspectable record: claim, signals, revisions, and shareable artifact.",
  },
  {
    label: "protocol identity",
    body: "Eva's deployed Avalanche thesis protocol and agent identity are visible in the product source of truth.",
  },
  {
    label: "campaign routes",
    body: "Trust receipts, agent receipts, reply sprint, and policy-safe thesis pages already carry measurable UTMs.",
  },
] as const;

const guardedGates = [
  "do not widen the public @evapredicts push until V1-prohibited market filtering is verified in production",
  "do not pretend thesis writes are launch-clear until durable write/readiness proof is observable",
  "do not claim users, revenue, accuracy, testimonials, or native trading without measured evidence",
] as const;

const statusPost = [
  "prediction products get trust from restraint, not from pretending every market is launch-safe.",
  "Eva's public push stays gated until the source basket is policy-safe and thesis writes are durable enough to defend.",
  "what is live: cited theses, revisions, author records, Avalanche thesis protocol.",
  "what is not getting hand-waved: prohibited-market filtering and write-readiness proof.",
  `follow @evapredicts for the first public thesis loop when the receipts are clean: ${xPostHref}`,
] as const;

export default function LaunchTruthStatusCampaignPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <section className="hero">
          <p className="eyebrow">@evapredicts campaign · launch truth</p>
          <h1>launch status should be a receipt, not a vibe.</h1>
          <p>
            Eva can already show the thesis object: a public argument with cited market signals, fact signals, revisions,
            and an author trail. The growth move now is sharper than hype: route qualified builders to the proof record
            while being explicit about the launch gates that still need evidence.
          </p>
          <div className="hero-actions">
            <Link href={proofHref} className="btn btn-primary">
              Read proof thesis
            </Link>
            <Link href={policyHref} className="btn">
              Review policy gate
            </Link>
            <a href={followHref} className="btn" target="_blank" rel="noreferrer">
              Follow @evapredicts
            </a>
          </div>
        </section>

        <section className="paper-section" aria-label="Campaign hypothesis">
          <p className="section-kicker">Campaign hypothesis</p>
          <h2>transparent launch gates will convert better than premature certainty.</h2>
          <p>
            Prediction-market operators and agent builders are allergic to fake confidence. A public launch-truth page
            gives them the current proof object, the current restraints, and one measurable follow CTA before the wider
            @evapredicts reply sprint asks for more attention.
          </p>
        </section>

        <section className="prediction-section" aria-label="Current proof and launch gates">
          <div className="product-module-grid">
            {liveProof.map((proof) => (
              <article key={proof.label} className="product-module">
                <p className="section-kicker">live</p>
                <h3>{proof.label}</h3>
                <p>{proof.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="paper-section" aria-label="Guarded launch gates">
          <p className="section-kicker">Guarded gates</p>
          <h2>what @evapredicts will not hand-wave.</h2>
          <ul>
            {guardedGates.map((gate) => (
              <li key={gate}>{gate}</li>
            ))}
          </ul>
          <div className="route-actions">
            <Link href={proofHref} className="mobile-action mobile-action-primary">
              Inspect the proof record
            </Link>
            <Link href={composeHref} className="mobile-action">
              Draft after clearance
            </Link>
          </div>
        </section>

        <section className="paper-section" aria-label="@evapredicts status copy to approve">
          <p className="section-kicker">@evapredicts copy to approve</p>
          <h2>one status post before widening the public loop.</h2>
          <p>
            External posting still needs explicit approval. Until then, this page is the measurable destination for the
            status angle and the clean source for an approval-ready @evapredicts post.
          </p>
          <blockquote>
            {statusPost.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
          <p className="inline-note">
            Metric to watch: sessions with <strong>utm_campaign=launch_truth_status</strong>, follow clicks from this
            page, clicks into the SpaceX proof thesis, and downstream draft starts after launch gates clear.
          </p>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
