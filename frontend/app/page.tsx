"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import {
  getCopyPreview,
  getPredictionSummary,
  type PredictionMarket,
  type PredictionSummary,
  type Predictor,
  type Thesis,
} from "@/lib/api";
import { marketUiStatus, statusClassName, statusLabel, thesisUiStatus } from "@/lib/status";

const compactUsdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

const evaPredictsUrl = "https://x.com/evapredicts";
const launchThesisId = "thesis-0fdef25794b38b6e8eed7524";
const homepageProofCampaign = "homepage_spacex_proof";
const predictionMemoryCampaign = "prediction_memory";
const launchThesisHref = `/thesis/${launchThesisId}?utm_source=homepage&utm_medium=proof_cta&utm_campaign=${homepageProofCampaign}&utm_content=launch_thesis`;
const predictionMemoryHref = `/campaigns/prediction-memory?utm_source=homepage&utm_medium=campaign_cta&utm_campaign=${predictionMemoryCampaign}&utm_content=prediction_memory`;

function formatUsd(value: number | null): string {
  if (value === null) return "—";
  return compactUsdFormatter.format(value);
}

function formatOdds(value: number): string {
  return percentFormatter.format(value);
}

function leadingOutcome(market: PredictionMarket): { label: string; price: number } | null {
  return [...market.outcomes].sort((left, right) => right.price - left.price)[0] ?? null;
}

function thesisMarket(thesis: Thesis, markets: PredictionMarket[]): PredictionMarket | null {
  const firstMarketSignal = thesis.signals.find((signal) => signal.kind === "prediction_market" && signal.marketId);
  return firstMarketSignal && firstMarketSignal.kind === "prediction_market"
    ? markets.find((market) => market.marketId === firstMarketSignal.marketId) ?? null
    : null;
}

function MarketStrip({ markets }: { markets: PredictionMarket[] }) {
  return (
    <div className="mobile-strip" aria-label="Trending markets">
      {markets.map((market) => {
        const outcome = leadingOutcome(market);
        const uiStatus = marketUiStatus(market);

        return (
          <Link key={market.marketId} href={`/markets/${market.marketId}`} className="market-chip">
            <span>{market.category}</span>
            <strong>{outcome ? `${outcome.label} ${formatOdds(outcome.price)}` : "No odds"}</strong>
            <span className={statusClassName(uiStatus)}>{statusLabel(uiStatus)}</span>
          </Link>
        );
      })}
    </div>
  );
}

const productModules = [
  {
    title: "Readable thesis",
    body: "A public post that can carry a broad market idea without becoming a dashboard.",
  },
  {
    title: "Cited signals",
    body: "Prediction markets, closed forecasts, facts, and second-order effects stay attached as reviewable sources.",
  },
  {
    title: "Visible updates",
    body: "Each material change appends a revision so readers can see how the argument moved.",
  },
  {
    title: "Author record",
    body: "X plus wallet identity gives every thesis an author trail agents and readers can inspect.",
  },
] as const;

const participationQuests = [
  {
    step: "01",
    title: "Start the argument",
    body: "Write the thesis as a post first, then decide which signals deserve to support it.",
    href: "/compose",
    cta: "Open editor",
  },
  {
    step: "02",
    title: "Attach sources",
    body: "Add live markets, closed predictions, facts, and lateral effects as citations.",
    href: "/markets",
    cta: "Browse library",
  },
  {
    step: "03",
    title: "Publish the artifact",
    body: "Anchor the first version, publish the post, then append updates as the thesis evolves.",
    href: "/thesis/thesis-0fdef25794b38b6e8eed7524",
    cta: "Read example",
  },
  {
    step: "04",
    title: "Build the record",
    body: "Connect X and wallet identity so authorship can persist across posts.",
    href: "/predictors",
    cta: "View records",
  },
] as const;

const campaignProofPoints = [
  "make the memory gap concrete before asking readers to care about a new prediction surface",
  "send homepage traffic to one proof-backed thesis where sources, revisions, and author trail are inspectable",
  "measure prediction-memory clicks against broader protocol-proof and receipt framing before widening the @evapredicts push",
] as const;

const activeCampaigns = [
  {
    title: "trust receipts",
    body: "A launch page for prediction-market operators who need cited theses, visible revisions, and author records instead of screenshots.",
    href: "/campaigns/trust-receipts?utm_source=homepage&utm_medium=campaign_directory&utm_campaign=trust_receipts_launch&utm_content=trust_receipts_card",
    metric: "draft-thesis clicks and example-thesis reads",
  },
  {
    title: "agent receipts",
    body: "A sharper wedge for agent builders: public market calls are only useful when the underlying signals and revisions are inspectable.",
    href: "/campaigns/agent-receipts?utm_source=homepage&utm_medium=campaign_directory&utm_campaign=agent_receipts&utm_content=agent_receipts_card",
    metric: "compose starts, follow clicks, and example-thesis clicks",
  },
  {
    title: "reply sprint",
    body: "An approval-ready @evapredicts distribution loop for live prediction-market conversations, with target-specific UTM links.",
    href: "/campaigns/reply-sprint?utm_source=homepage&utm_medium=campaign_directory&utm_campaign=evapredicts_reply_sprint&utm_content=reply_sprint_card",
    metric: "qualified thesis visits from X replies",
  },
  {
    title: "policy-safe theses",
    body: "A boundary-first launch page that explains which markets @evapredicts will not amplify before the public reply sprint widens.",
    href: "/campaigns/policy-safe-theses?utm_source=homepage&utm_medium=campaign_directory&utm_campaign=policy_safe_theses&utm_content=policy_safe_card",
    metric: "safe-thesis starts, follow clicks, and example reads",
  },
  {
    title: "launch truth status",
    body: "A transparent status page for what is live, what stays gated, and why @evapredicts will not fake launch certainty.",
    href: "/campaigns/launch-truth-status?utm_source=homepage&utm_medium=campaign_directory&utm_campaign=launch_truth_status&utm_content=launch_truth_card",
    metric: "status-page visits, follow clicks, and proof-thesis reads",
  },
  {
    title: "source quality sprint",
    body: "A tighter campaign for prediction-market builders: the useful object is the thesis, the cited signals, the revision trigger, and the author record.",
    href: "/campaigns/source-quality-sprint?utm_source=homepage&utm_medium=campaign_directory&utm_campaign=source_quality_sprint&utm_content=source_quality_card",
    metric: "proof-thesis reads, source-library clicks, compose starts, and follows",
  },
  {
    title: "prediction memory",
    body: "The current @evapredicts wedge: prediction markets price the moment, but Eva keeps the thesis, sources, revisions, and author trail inspectable.",
    href: "/campaigns/prediction-memory?utm_source=homepage&utm_medium=campaign_directory&utm_campaign=prediction_memory&utm_content=prediction_memory_card",
    metric: "prediction-memory sessions, proof-thesis reads, compose starts, and follows",
  },
  {
    title: "AI forecast receipts",
    body: "A campaign for agent builders and prediction-market people: AI forecasts should carry source fit, revision triggers, and author/runtime trails before amplification.",
    href: "/campaigns/ai-forecast-receipts?utm_source=homepage&utm_medium=campaign_directory&utm_campaign=ai_forecast_receipts&utm_content=forecast_receipts_card",
    metric: "receipt-page visits, proof-thesis reads, market-signal clicks, compose starts, and follows",
  },
  {
    title: "protocol proof",
    body: "The infra-native wedge: public predictions need cited signals, visible revisions, author identity, and anchorable proof objects before bigger claims.",
    href: "/campaigns/protocol-proof?utm_source=homepage&utm_medium=campaign_directory&utm_campaign=protocol_proof&utm_content=protocol_proof_card",
    metric: "proof-record reads, source-library clicks, author-record clicks, compose starts, and follows",
  },
] as const;

function CampaignCallout() {
  return (
    <section className="prediction-section campaign-callout" aria-label="Current Eva Protocol campaign">
      <CampaignViewTracker campaign={predictionMemoryCampaign} channel="homepage_campaign_callout" />
      <div className="campaign-callout-copy">
        <p className="section-kicker">@evapredicts campaign</p>
        <h2 className="section-title section-title-sm">prediction markets price the moment. Eva remembers the thesis.</h2>
        <p>
          The current growth wedge is prediction memory: cited signals, visible revisions, and an author trail that
          keep the original market call inspectable after the timeline moves on.
        </p>
      </div>
      <div className="campaign-proof-grid" aria-label="Campaign proof points">
        {campaignProofPoints.map((point) => (
          <div key={point}>
            <span>memory</span>
            <strong>{point}</strong>
          </div>
        ))}
      </div>
      <div className="campaign-action-row">
        <CampaignLink href={predictionMemoryHref} campaign={predictionMemoryCampaign} cta="open_prediction_memory_campaign" channel="homepage_campaign_callout" className="mobile-action mobile-action-primary">
          Open prediction-memory campaign
        </CampaignLink>
        <CampaignLink href={launchThesisHref} campaign={predictionMemoryCampaign} cta="read_proof_record" channel="homepage_campaign_callout" className="mobile-action">
          Read the proof record
        </CampaignLink>
        <CampaignLink href={evaPredictsUrl} campaign={predictionMemoryCampaign} cta="follow_evapredicts" channel="homepage_campaign_callout" className="mobile-action" target="_blank" rel="noreferrer" external>
          Follow @evapredicts
        </CampaignLink>
      </div>
      <p className="inline-note">
        Metric to watch: utm_campaign=prediction_memory clicks into the campaign page, then proof-thesis reads, source-quality page visits, compose starts, and follow clicks before any broader launch push.
      </p>
    </section>
  );
}

function CampaignDirectory() {
  return (
    <section className="prediction-section campaign-directory" aria-label="Active Eva Protocol campaigns">
      <div className="section-heading-row prediction-heading">
        <div>
          <p className="section-kicker">campaign directory</p>
          <h2 className="section-title section-title-sm">send curious predictors to one clean next step.</h2>
        </div>
        <Link href="/campaigns/trust-receipts?utm_source=homepage&utm_medium=campaign_directory&utm_campaign=trust_receipts_launch&utm_content=section_link" className="section-link">
          Open launch page
        </Link>
      </div>
      <div className="product-module-grid">
        {activeCampaigns.map((campaign) => (
          <Link key={campaign.title} href={campaign.href} className="product-module">
            <h3>{campaign.title}</h3>
            <p>{campaign.body}</p>
            <span className="quest-card-cta">watch: {campaign.metric}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function QuestBoard({ stats }: { stats: PredictionSummary["stats"] }) {
  return (
    <section className="prediction-section quest-board workbench-quests" aria-label="Participation missions">
      <div className="quest-board-copy">
        <p className="section-kicker">Start here</p>
        <h2 className="section-title section-title-sm">From idea to public record</h2>
        <p>
          The point is not to place a trade inside Eva. The point is to publish the broader thesis,
          attach the signals that make it legible, and keep the history honest as odds and facts move.
        </p>
      </div>
      <div className="quest-grid">
        {participationQuests.map((quest) => (
          <Link key={quest.step} href={quest.href} className="quest-card">
            <span className="quest-step">{quest.step}</span>
            <h3>{quest.title}</h3>
            <p>{quest.body}</p>
            <span className="quest-card-cta">{quest.cta}</span>
          </Link>
        ))}
      </div>
      <div className="quest-scoreboard" aria-label="Current network activity">
        <div>
          <strong>{stats.weeklyActivePredictors}</strong>
          <span>authors</span>
        </div>
        <div>
          <strong>{stats.openThesisCount}</strong>
          <span>open theses</span>
        </div>
        <div>
          <strong>{stats.copiedThesisEvents}</strong>
          <span>shares/copies</span>
        </div>
      </div>
    </section>
  );
}

function ThesisCard({ thesis, market }: { thesis: Thesis; market: PredictionMarket | null }) {
  const [copyState, setCopyState] = useState<string | null>(null);
  const [copyPending, setCopyPending] = useState(false);

  const previewCopy = async () => {
    setCopyPending(true);
    setCopyState(null);

    try {
      const preview = await getCopyPreview(thesis.thesisId);
      setCopyState(preview.venueUrl ? "External venue opened as preview." : "Copy preview recorded. No execution in v1.");
    } catch {
      setCopyState("Copy preview failed. Refresh and try again.");
    } finally {
      setCopyPending(false);
    }
  };

  return (
    <article className="prediction-card thesis-card">
      <div className="card-topline">
        <Link href={`/predictors/${thesis.author.xHandle.replace(/^@/, "")}`} className="handle-link">
          {thesis.author.xHandle}
        </Link>
        <span>{thesis.copiedCount} copied</span>
      </div>
      <Link href={`/thesis/${thesis.thesisId}`} className="thesis-card-main">
        <span className="market-label">{market?.category ?? "Market"}</span>
        <h2>{thesis.title}</h2>
        <p>{thesis.body}</p>
      </Link>
      <div className="status-row" aria-label="Thesis status">
        <span className={statusClassName("forecast")}>Forecast</span>
        <span className={statusClassName(thesisUiStatus(thesis))}>{statusLabel(thesisUiStatus(thesis))}</span>
      </div>
      <div className="odds-row">
        <div>
          <span>Signals</span>
          <strong>{thesis.signals.length}</strong>
        </div>
        <div>
          <span>Score</span>
          <strong>{thesis.currentScore}</strong>
        </div>
        <div>
          <span>Revision</span>
          <strong>v{thesis.currentRevision.version}</strong>
        </div>
      </div>
      <div className="sticky-action-row">
        <button className="mobile-action mobile-action-primary" type="button" onClick={previewCopy} disabled={copyPending}>
          {copyPending ? "Preparing…" : "Preview X copy"}
        </button>
        <Link className="mobile-action" href={`/compose?counterTo=${thesis.thesisId}`}>
          Build from this
        </Link>
      </div>
      {copyState ? <p className="inline-note" role="status" aria-live="polite">{copyState}</p> : null}
    </article>
  );
}

function PredictorRow({ predictor }: { predictor: Predictor }) {
  return (
    <Link href={`/predictors/${predictor.predictorId}`} className="predictor-row">
      <div>
        <strong>{predictor.handle}</strong>
        <span>{predictor.profileState === "registered" ? "Wallet-linked" : "Record-only X profile"}</span>
      </div>
      <div className="predictor-score">
        <strong>{predictor.trustScore}</strong>
        <span>{predictor.accuracy === null ? "pending" : `${predictor.accuracy}% acc`}</span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPredictionSummary()
      .then(setSummary)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load prediction network."))
      .finally(() => setLoading(false));
  }, []);

  const markets = summary?.markets ?? [];
  const theses = summary?.theses ?? [];
  const predictors = summary?.predictors ?? [];
  const leadThesis = theses[0] ?? null;
  const leadMarket = leadThesis ? thesisMarket(leadThesis, markets) : null;

  return (
    <>
      <Nav />
      <main id="main-content" className="mobile-shell prediction-home">
        <section className="mobile-hero home-command">
          <p className="eyebrow">Public market theses · cited signals · revision history</p>
          <h1>Turn market odds into a public thesis.</h1>
          <p>
            Eva lets predictors write an interactive post, cite prediction markets and facts inline,
            anchor the first version, and keep every update readable over time.
          </p>
          <div className="mobile-hero-actions">
            <Link href={predictionMemoryHref} className="mobile-action mobile-action-primary">
              Open prediction-memory campaign
            </Link>
            <Link href={launchThesisHref} className="mobile-action">
              Read proof thesis
            </Link>
            <Link href={evaPredictsUrl} className="mobile-action" target="_blank" rel="noreferrer">
              Follow @evapredicts
            </Link>
          </div>
          <aside className="home-hero-artifact" aria-label="Example thesis artifact">
            <div className="artifact-header">
              <span>Working thesis</span>
              <strong>v3</strong>
            </div>
            <h2>SpaceX IPO liquidity rotation</h2>
            <p>
              IPO anticipation can absorb speculative liquidity before the listing window is explicit,
              then release attention into adjacent risk markets after the path clears.
            </p>
            <div className="artifact-signal-grid" aria-label="Attached thesis signals">
              <div>
                <span>S1 · IPO timing</span>
                <strong>Yes priced at 42%</strong>
              </div>
              <div>
                <span>S2 · Tender liquidity</span>
                <strong>Fact not verified yet</strong>
              </div>
              <div>
                <span>S3 · Risk rotation</span>
                <strong>Second-order signal</strong>
              </div>
            </div>
            <div className="artifact-history">
              <span>Initial anchor confirmed</span>
              <span>2 updates appended</span>
            </div>
          </aside>
        </section>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : error || !summary ? (
          <section className="prediction-card">
            <h2>Signal network unavailable</h2>
            <p>{error ?? "Eva could not load prediction activity."}</p>
          </section>
        ) : (
          <section className="home-workbench" aria-label="Eva prediction workbench">
            <CampaignCallout />
            <CampaignDirectory />
            <QuestBoard stats={summary.stats} />

            <section className="prediction-section workbench-tape">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Live source tape</p>
                  <h2 className="section-title section-title-sm">Markets ready to become citations</h2>
                </div>
                <Link href="/compose" className="section-link">
                  Draft thesis
                </Link>
              </div>
              <MarketStrip markets={markets} />
            </section>

            <section className="prediction-section workbench-markets">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Market library</p>
                  <h2 className="section-title section-title-sm">Source cards for thesis builders</h2>
                </div>
                <Link href="/markets" className="section-link">
                  Open library
                </Link>
              </div>
              {markets.length > 0 ? (
                <div className="market-list-mobile">
                  {markets.map((market) => (
                    <Link key={market.marketId} href={`/markets/${market.marketId}`} className="market-row">
                      <div>
                        <span>{market.category}</span>
                        <strong>{market.title}</strong>
                        <span className={statusClassName(marketUiStatus(market))}>{statusLabel(marketUiStatus(market))}</span>
                      </div>
                      <div>
                        <span>Vol</span>
                        <strong>{formatUsd(market.volumeUsd)}</strong>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <article className="prediction-card empty-state-card">
                  <h2>No markets loaded</h2>
                  <p>Refresh or check the API connection before drafting a sourced thesis.</p>
                </article>
              )}
            </section>

            <section className="lead-thesis workbench-feature">
              <div className="section-heading-row prediction-heading">
                <div>
                  <p className="section-kicker">Featured artifact</p>
                  <h2 className="section-title section-title-sm">Read an evolving thesis</h2>
                </div>
                <Link href="/markets" className="section-link">
                  Find sources
                </Link>
              </div>
              {leadThesis ? (
                <ThesisCard thesis={leadThesis} market={leadMarket} />
              ) : (
                <article className="prediction-card empty-state-card">
                  <h2>No featured thesis yet</h2>
                  <p>Publish the first anchored thesis to create the opening public artifact.</p>
                </article>
              )}
            </section>

            <aside className="workbench-rail" aria-label="Network context">
              <section className="mobile-metrics workbench-metrics" aria-label="Network metrics">
                <div>
                  <strong>{summary.stats.weeklyActivePredictors}</strong>
                  <span>active predictors</span>
                </div>
                <div>
                  <strong>{summary.stats.openThesisCount}</strong>
                  <span>open theses</span>
                </div>
                <div>
                  <strong>{summary.stats.copiedThesisEvents}</strong>
                  <span>copied theses</span>
                </div>
              </section>

              <section className="prediction-section workbench-predictors">
                <div className="section-heading-row prediction-heading">
                  <div>
                    <p className="section-kicker">Author records</p>
                    <h2 className="section-title section-title-sm">Who is building a track record</h2>
                  </div>
                  <Link href="/predictors" className="section-link">
                    View records
                  </Link>
                </div>
                {predictors.length > 0 ? (
                  <div className="predictor-list">
                    {predictors.map((predictor) => (
                      <PredictorRow key={predictor.predictorId} predictor={predictor} />
                    ))}
                  </div>
                ) : (
                  <article className="prediction-card empty-state-card">
                    <h2>No predictors yet</h2>
                    <p>Published theses will create public author records.</p>
                  </article>
                )}
              </section>

              <section className="prediction-section product-system workbench-system">
                <div className="section-heading-row prediction-heading">
                  <div>
                    <p className="section-kicker">Product object</p>
                    <h2 className="section-title section-title-sm">What every thesis carries</h2>
                  </div>
                </div>
                <div className="product-module-grid">
                  {productModules.map((module) => (
                    <article key={module.title} className="product-module">
                      <h3>{module.title}</h3>
                      <p>{module.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
