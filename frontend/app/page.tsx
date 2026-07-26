"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CampaignLink, CampaignViewTracker } from "@/components/CampaignTelemetry";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";
import { getPredictionSummary, type PredictionMarket, type PredictionSummary, type Thesis } from "@/lib/api";
import { protocol } from "@/lib/protocol";
import { marketUiStatus, statusLabel, thesisUiStatus } from "@/lib/status";

const launchThesisId = "thesis-0fdef25794b38b6e8eed7524";
const featuredCampaign = "protocol_proof";
const launchThesisHref = `/thesis/${launchThesisId}?utm_source=homepage&utm_medium=proof_cta&utm_campaign=${featuredCampaign}&utm_content=spacex_proof_record`;

function shortAddress(address: string): string {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function formatOdds(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatUsd(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function signalValue(signal: Thesis["signals"][number]): string {
  if (signal.kind === "prediction_market") {
    return `${signal.selectedOutcomeLabel} ${formatOdds(signal.currentOdds)}`;
  }
  return signal.verifierVerdict === "unverifiable_yet" ? "Not verified" : signal.verifierVerdict.replaceAll("_", " ");
}

function ProofArtifact({ thesis, loading }: { thesis: Thesis | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="eva-proof-sheet eva-proof-loading" aria-label="Loading proof thesis">
        <span>Loading proof object</span>
      </div>
    );
  }

  if (!thesis) {
    return (
      <div className="eva-proof-sheet eva-proof-loading">
        <span>Proof object unavailable</span>
        <Link href="/markets">Browse source library</Link>
      </div>
    );
  }

  const revisions = [...thesis.revisions].sort((left, right) => left.version - right.version);

  return (
    <article className="eva-proof-sheet" aria-label={`Proof object: ${thesis.title}`}>
      <div className="eva-proof-topline">
        <span>Thesis 01</span>
        <span>Revision v{thesis.currentRevision.version}</span>
      </div>
      <h2>{thesis.title}</h2>
      <div className="eva-proof-grid">
        <div className="eva-evidence-column">
          <span className="eva-ledger-label">Evidence rail</span>
          <div className="eva-evidence-list">
            {thesis.signals.slice(0, 4).map((signal, index) => (
              <div className="eva-evidence-item" key={signal.signalId}>
                <span className="eva-evidence-node" aria-hidden="true" />
                <div>
                  <span>S{index + 1} · {signal.kind === "prediction_market" ? "Forecast" : "Fact"}</span>
                  <strong>{signal.title}</strong>
                  <em>{signalValue(signal)}</em>
                </div>
              </div>
            ))}
          </div>
        </div>
        <dl className="eva-proof-facts">
          <div>
            <dt>Author</dt>
            <dd>{thesis.author.xHandle}</dd>
          </div>
          <div>
            <dt>Score</dt>
            <dd>{thesis.currentScore}<small>/100</small></dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{statusLabel(thesisUiStatus(thesis))}</dd>
          </div>
          <div>
            <dt>Anchor</dt>
            <dd>{thesis.anchor.status}</dd>
          </div>
        </dl>
      </div>
      <div className="eva-revision-trace" aria-label="Revision trace">
        <span>Revision trace</span>
        <div>
          {revisions.map((revision, index) => (
            <span key={revision.revisionId}>
              v{revision.version}{index < revisions.length - 1 ? <i aria-hidden="true">→</i> : null}
            </span>
          ))}
        </div>
      </div>
      <Link href={`/thesis/${thesis.thesisId}`} className="eva-sheet-link">
        Inspect full proof <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}

function SourceRow({ market, index }: { market: PredictionMarket; index: number }) {
  const leadingOutcome = [...market.outcomes].sort((left, right) => right.price - left.price)[0] ?? null;

  return (
    <Link href={`/markets/${market.marketId}`} className="eva-source-row">
      <span className="eva-source-index">S{index + 1}</span>
      <div className="eva-source-title">
        <small>{market.category} · {market.provider}</small>
        <strong>{market.title}</strong>
      </div>
      <div>
        <small>Forecast</small>
        <strong>{leadingOutcome ? `${leadingOutcome.label} ${formatOdds(leadingOutcome.price)}` : "No odds"}</strong>
      </div>
      <div>
        <small>Status</small>
        <strong>{statusLabel(marketUiStatus(market))}</strong>
      </div>
      <div>
        <small>Volume</small>
        <strong>{formatUsd(market.volumeUsd)}</strong>
      </div>
      <span className="eva-row-arrow" aria-hidden="true">→</span>
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
      .catch((reason) => setError(reason instanceof Error ? reason.message : "The public record is unavailable."))
      .finally(() => setLoading(false));
  }, []);

  const launchThesis = summary?.theses.find((thesis) => thesis.thesisId === launchThesisId) ?? summary?.theses[0] ?? null;
  const markets = summary?.markets.slice(0, 3) ?? [];
  const predictors = summary?.predictors.slice(0, 3) ?? [];
  const contractUrl = `${protocol.chain.explorerUrl}/address/${protocol.contracts.evaThesisProtocol}`;
  const tokenUrl = `${protocol.chain.explorerUrl}/address/${protocol.tokens.eva.address}`;

  return (
    <PageShell variant="home">
      <CampaignViewTracker campaign={featuredCampaign} channel="homepage" />
      <section className="eva-hero">
        <FadeIn className="eva-hero-copy">
          <h1>Public predictions need proof.</h1>
          <p>
            Eva turns market theses into inspectable records—with cited signals, visible revisions,
            author identity, and an on-chain anchor.
          </p>
          <div className="eva-hero-actions">
            <CampaignLink
              href={launchThesisHref}
              campaign={featuredCampaign}
              cta="read_proof_record"
              channel="homepage_hero"
              className="eva-primary-action"
            >
              Read proof thesis
            </CampaignLink>
            <Link href="/compose" className="eva-text-action">Start a thesis <span aria-hidden="true">→</span></Link>
          </div>
          <a className="eva-chain-receipt" href={contractUrl} target="_blank" rel="noreferrer">
            <span className="eva-avalanche-mark" aria-hidden="true" />
            <span>
              <strong>Avalanche C-Chain</strong>
              <small>Live contract · {shortAddress(protocol.contracts.evaThesisProtocol)}</small>
            </span>
            <i aria-hidden="true">↗</i>
          </a>
        </FadeIn>
        <FadeIn delay={0.08} className="eva-hero-proof">
          <ProofArtifact thesis={launchThesis} loading={loading} />
        </FadeIn>
      </section>

      <section className="eva-process" aria-labelledby="process-title">
        <div>
          <h2 id="process-title">One argument.<br />Every receipt.</h2>
        </div>
        {[
          ["01", "Cite the signal", "Attach the forecast or fact that shapes the claim."],
          ["02", "Publish the thesis", "Anchor an authored, readable public record."],
          ["03", "Revise in public", "Append changes without erasing the earlier view."],
        ].map(([step, title, body]) => (
          <article key={step}>
            <span>{step}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="eva-home-section" aria-labelledby="sources-title">
        <header className="eva-section-head">
          <div>
            <span>Live source tape</span>
            <h2 id="sources-title">Forecasts ready to become citations.</h2>
          </div>
          <Link href="/markets">Open market library <span aria-hidden="true">→</span></Link>
        </header>
        {loading ? (
          <div className="eva-ruled-loading">Loading source library…</div>
        ) : error ? (
          <p className="eva-inline-error">{error}</p>
        ) : markets.length ? (
          <div className="eva-source-list">
            {markets.map((market, index) => <SourceRow key={market.marketId} market={market} index={index} />)}
          </div>
        ) : (
          <p className="eva-empty-row">No markets loaded.</p>
        )}
      </section>

      <section className="eva-record-section" aria-labelledby="record-title">
        <div className="eva-record-copy">
          <span>Public record</span>
          <h2 id="record-title">The argument stays readable. The provenance stays attached.</h2>
          <p>
            Eva keeps venue odds distinct from verified facts, turns material changes into revisions,
            and preserves the author and anchor trail for readers and agents to inspect.
          </p>
          <Link href={launchThesis ? `/thesis/${launchThesis.thesisId}` : "/markets"} className="eva-text-action">
            Inspect the proof ledger <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="eva-record-ledger">
          {[
            ["01", "Source", "Time-stamped forecast or cited fact"],
            ["02", "Claim", "Readable mechanism and break condition"],
            ["03", "Revision", "Append-only view of material changes"],
            ["04", "Anchor", "Contract and transaction receipt"],
          ].map(([step, title, body]) => (
            <div key={step}>
              <span>{step}</span>
              <strong>{title}</strong>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {predictors.length ? (
        <section className="eva-home-section eva-author-section" aria-labelledby="authors-title">
          <header className="eva-section-head">
            <div>
              <span>Author records</span>
              <h2 id="authors-title">Follow the record, not the confidence.</h2>
            </div>
            <Link href="/predictors">View all authors <span aria-hidden="true">→</span></Link>
          </header>
          <div className="eva-author-list">
            {predictors.map((predictor) => (
              <Link href={`/predictors/${predictor.predictorId}`} key={predictor.predictorId}>
                <strong>{predictor.handle}</strong>
                <span>{predictor.profileState === "registered" ? "Wallet-linked" : "Record-only"}</span>
                <span>{predictor.openTheses} open theses</span>
                <i aria-hidden="true">→</i>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="eva-home-token" aria-labelledby="home-token-title">
        <div>
          <span>Platform token / Avalanche</span>
          <h2 id="home-token-title">$EVA holder state, attached to the author record.</h2>
          <p>
            Eva reads the canonical token contract and wallet balance from Avalanche. Holder state adds inspectable
            context; it does not buy credibility or unlock publishing.
          </p>
          <Link href="/eva" className="eva-text-action">
            Inspect $EVA <span aria-hidden="true">→</span>
          </Link>
        </div>
        <dl>
          <div>
            <dt>Contract</dt>
            <dd>
              <a href={tokenUrl} target="_blank" rel="noreferrer">
                {shortAddress(protocol.tokens.eva.address)}
              </a>
            </dd>
          </div>
          <div>
            <dt>Live relationship</dt>
            <dd>Wallet → $EVA balance → author → thesis</dd>
          </div>
          <div>
            <dt>Not active</dt>
            <dd>Staking, gating, yield, governance, trading</dd>
          </div>
        </dl>
      </section>

      <section className="eva-campaign-strip" aria-label="Protocol proof campaign">
        <div>
          <span>@evapredicts / protocol proof</span>
          <strong>The product claim starts with one inspectable object.</strong>
        </div>
        <Link href="/campaigns/protocol-proof">Open campaign note <span aria-hidden="true">→</span></Link>
      </section>
    </PageShell>
  );
}
