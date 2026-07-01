import type { Metadata } from "next";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
import { protocol } from "@/lib/protocol";

const campaign = "launch_truth_status";
const campaignPath = "/campaigns/launch-truth-status";
const campaignUrl = `${protocol.app.siteUrl}${campaignPath}`;
const proofHref = `/thesis/thesis-0fdef25794b38b6e8eed7524?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=spacex_proof`;
const policyHref = `/campaigns/policy-safe-theses?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=policy_safe_page`;
const composeHref = `/compose?utm_source=campaign_page&utm_medium=cta&utm_campaign=${campaign}&utm_content=draft_after_clearance`;
const followHref = `https://x.com/evapredicts?utm_source=eva_site&utm_medium=campaign_page&utm_campaign=${campaign}`;
const homepageHref = `${campaignPath}?utm_source=homepage&utm_medium=campaign_cta&utm_campaign=${campaign}&utm_content=launch_truth_status`;
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
    label: "durable storage",
    body: "Production storage readiness now reports durable Upstash Redis, so the remaining launch question is not whether the storage probe exists. It is whether the public authoring path can be safely opened.",
  },
  {
    label: "protocol identity",
    body: "Eva's deployed Avalanche thesis protocol and agent identity are visible in the product source of truth.",
  },
  {
    label: "campaign routes",
    body: "Trust receipts, agent receipts, reply sprint, policy-safe theses, and launch-truth status pages already carry measurable UTMs.",
  },
] as const;

const currentBlockers = [
  {
    label: "market policy regression",
    body: "The live provider feed recently exposed sports markets again. @evapredicts should keep the wider public push gated until /api/markets proves the V1 source basket is policy-safe in production.",
  },
  {
    label: "authoring gate",
    body: "The compose route remains safely locked behind the Dynamic auth/configuration gate. That is the right failure mode, but it is not a launch-clear authoring path yet.",
  },
  {
    label: "signer and runtime parity",
    body: "Production identity and environment assumptions still need final parity confirmation before the launch thread widens beyond proof-reading CTAs.",
  },
] as const;

const guardedGates = [
  "do not widen the public @evapredicts push while the live market feed leaks prohibited sports or other V1-excluded markets",
  "do not send cold readers into compose until Dynamic authoring is launch-clear instead of only safe-locked",
  "do not claim users, revenue, accuracy, testimonials, or native trading without measured evidence",
] as const;

const statusPost = [
  "prediction products get trust from restraint, not from pretending every market is launch-safe.",
  "Eva's public push stays gated while the live source basket still needs policy-safe proof and authoring is not launch-clear yet.",
  "what is live: cited theses, revisions, author records, durable storage readiness, Avalanche thesis protocol.",
  "what is not getting hand-waved: sports-market leakage, Dynamic authoring configuration, and runtime parity.",
  `follow @evapredicts for the first public thesis loop when the receipts are clean: ${xPostHref}`,
] as const;

export default function LaunchTruthStatusCampaignPage() {
  return (
    <PageShell variant="page">
        <CampaignViewTracker campaign={campaign} channel="launch_truth_status_page" />
        <FadeIn className="hero">
          <p className="eyebrow">@evapredicts campaign · launch truth</p>
          <h1>launch status should be a receipt, not a vibe.</h1>
          <p>
            Eva can already show the thesis object: a public argument with cited market signals, fact signals, revisions,
            and an author trail. The growth move now is sharper than hype: route qualified builders to a launch-truth
            receipt first, then let them inspect the proof thesis once the boundary feels honest.
          </p>
          <div className="hero-actions">
            <CampaignLink href={proofHref} campaign={campaign} cta="read_proof_thesis" channel="launch_truth_status_hero" className="btn btn-primary">
              Read proof thesis
            </CampaignLink>
            <CampaignLink href={policyHref} campaign={campaign} cta="review_policy_gate" channel="launch_truth_status_hero" className="btn">
              Review policy gate
            </CampaignLink>
            <CampaignLink href={followHref} campaign={campaign} cta="follow_evapredicts" channel="launch_truth_status_hero" className="btn" target="_blank" rel="noreferrer" external>
              Follow @evapredicts
            </CampaignLink>
          </div>
        </FadeIn>

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

        <section className="prediction-section" aria-label="Current launch blockers">
          <div className="section-heading-row prediction-heading">
            <div>
              <p className="section-kicker">Current blockers</p>
              <h2 className="section-title section-title-sm">the public loop waits for these receipts.</h2>
            </div>
            <CampaignLink href={homepageHref} campaign={campaign} cta="open_tracked_homepage_cta" channel="launch_truth_status_blockers" className="section-link">
              Tracked homepage CTA
            </CampaignLink>
          </div>
          <div className="product-module-grid">
            {currentBlockers.map((blocker) => (
              <article key={blocker.label} className="product-module">
                <p className="section-kicker">not launch-clear</p>
                <h3>{blocker.label}</h3>
                <p>{blocker.body}</p>
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
            <CampaignLink href={proofHref} campaign={campaign} cta="inspect_proof_record" channel="launch_truth_status_guardrails" className="mobile-action mobile-action-primary">
              Inspect the proof record
            </CampaignLink>
            <CampaignLink href={composeHref} campaign={campaign} cta="draft_after_clearance" channel="launch_truth_status_guardrails" className="mobile-action">
              Draft after clearance
            </CampaignLink>
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
            Metric to watch: sessions with <strong>utm_campaign=launch_truth_status</strong>, homepage CTA clicks into
            this page, proof-thesis reads, policy-gate clicks, follow clicks from the status page, and downstream draft
            starts only after launch gates clear.
          </p>
        </section>

    </PageShell>
  );
}
