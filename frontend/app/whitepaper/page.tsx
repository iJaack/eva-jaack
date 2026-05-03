import Link from "next/link";
import { protocol } from "@/lib/protocol";

type TocItem = {
  id: string;
  title: string;
};

const toc: TocItem[] = [
  { id: "abstract", title: "1. Abstract" },
  { id: "product", title: "2. Product" },
  { id: "flow", title: "3. Prediction Flow" },
  { id: "architecture", title: "4. Architecture" },
  { id: "contract", title: "5. Contract Boundary" },
  { id: "api", title: "6. Public API" },
  { id: "roadmap", title: "7. Roadmap" },
  { id: "archive", title: "8. Archived Concepts" },
];

function SectionTitle({ id, title }: { id: string; title: string }) {
  return <h2 id={id}>{title}</h2>;
}

function StackDiagram() {
  return (
    <div className="diagram">
      <div className="diagram-grid">
        <div className="diagram-cell">
          <h4>Frontend</h4>
          <p>Next.js on Vercel. Markets, thesis pages, predictor profiles, and evidence tools.</p>
        </div>
        <div className="diagram-cell">
          <h4>Backend</h4>
          <p>Hono API for markets, theses, predictors, X commands, verification, and trust summaries.</p>
        </div>
        <div className="diagram-cell">
          <h4>On-chain</h4>
          <p>EvaTrustGraph plus ERC-8004 registries on Avalanche C-Chain.</p>
        </div>
      </div>
      <div className="flow-line">
        <span>Publish thesis</span>
        <span>→</span>
        <span>Attach evidence</span>
        <span>→</span>
        <span>Resolve outcome</span>
        <span>→</span>
        <span>Update trust</span>
      </div>
    </div>
  );
}

export default function WhitepaperPage() {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden />
          <div className="brand-text">
            <span className="brand-title">Eva Protocol Reference</span>
            <span className="brand-sub">Prediction edition · April 2026</span>
          </div>
        </div>
        <nav className="nav-links">
          <Link href="/" className="nav-pill">
            Back Home
          </Link>
          <a href="https://github.com/iJaack/eva-jaack" target="_blank" rel="noreferrer" className="nav-pill">
            GitHub
          </a>
        </nav>
      </header>

      <main className="page-shell">
        <section className="hero" style={{ paddingBottom: 8 }}>
          <span className="hero-kicker">Public whitepaper</span>
          <h1 className="hero-title">A trust graph for prediction reputation on Avalanche.</h1>
          <p className="hero-sub">
            Eva Protocol is a prediction reputation system. External markets provide odds; Eva records theses,
            evidence, copy intent, and graph-backed predictor trust.
          </p>
        </section>

        <div className="whitepaper-layout">
          <aside className="toc-wrap">
            <div className="surface toc-card">
              <h2>Table of contents</h2>
              <nav className="toc-nav">
                {toc.map((item) => (
                  <a key={item.id} href={`#${item.id}`}>
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>

            <div className="surface toc-card stat-note">
              <strong>{protocol.chain.name}</strong>
              <br />
              <br />
              EvaTrustGraph:
              <br />
              <code>{protocol.contracts.evaTrustGraph}</code>
              <br />
              <br />
              Eva oracle:
              <br />
              <code>Agent #{protocol.agents.eva.id}</code>
              <br />
              <br />
              Site:
              <br />
              <code>{protocol.app.siteUrl}</code>
            </div>
          </aside>

          <article className="paper-stack">
            <section className="surface paper-section">
              <SectionTitle id="abstract" title="1. Abstract" />
              <p>
                The current Eva Protocol product is not a trading venue and not a marketing-only
                landing page. It is a prediction reputation layer with market pages, thesis pages,
                predictor profiles, and evidence tools backed by the same trust graph.
              </p>
              <p>
                The system is Avalanche-first. `EvaTrustGraph` is the canonical source of registered
                predictor identity and trust. ERC-8004 registries remain part of the trust boundary
                for identity, validation receipts, and reputation events.
              </p>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="product" title="2. Product" />
              <ul>
                <li>Predictors publish market theses through the website or explicit @evapredicts commands.</li>
                <li>External venues provide odds; Eva stores rationale, source links, and copy intent.</li>
                <li>Evidence tools verify supporting claims when a thesis needs a stronger proof trail.</li>
                <li>Registered Eva identities make predictor reputation graph-backed instead of purely social.</li>
              </ul>
              <p>
                Prediction theses are the primary product record, while article verification remains a
                supporting evidence primitive.
              </p>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="flow" title="3. Prediction Flow" />
              <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
                <li>User publishes or is credited with a market thesis.</li>
                <li>Eva stores the market, selected outcome, odds snapshot, rationale, and evidence links.</li>
                <li>Other users can copy, counter, or inspect the claim trail.</li>
                <li>Unclaimed X profiles can accumulate offchain market records.</li>
                <li>Registered identities can later receive reputation feedback after durable resolutions.</li>
                <li>Verification reports remain available through `/api/verify` as evidence objects.</li>
              </ol>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="architecture" title="4. Architecture" />
              <StackDiagram />
              <p>
                Vercel is the canonical deployment target for the product surface. The frontend is a
                dynamic Next.js app, and the backend routes are exposed through the same domain so
                markets, theses, predictors, trust, and evidence views do not drift across environments.
              </p>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="contract" title="5. Contract Boundary" />
              <ul>
                <li>
                  <strong>Source of truth:</strong> the deployed `EvaTrustGraph` contract on Avalanche.
                </li>
                <li>
                  <strong>Generated interfaces:</strong> frontend and backend both consume ABI output
                  generated from the Solidity artifact instead of maintaining hand-written partial
                  ABIs.
                </li>
                <li>
                  <strong>Identity model:</strong> the Eva oracle uses agent #{protocol.agents.eva.id}.
                  Graph-backed predictors register their own wallet and agent identity before resolved
                  outcomes can affect canonical trust.
                </li>
              </ul>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="api" title="6. Public API" />
              <p>The public surface is intentionally narrow and explicit:</p>
              <ul>
                <li><code>GET /api/markets</code> and <code>GET /api/markets/:id</code> return external market context.</li>
                <li><code>POST /api/theses</code> and <code>GET /api/theses/:id</code> create and read prediction theses.</li>
                <li><code>GET /api/predictors</code> returns product and graph-backed predictor records.</li>
                <li><code>POST /api/copy-preview</code> records external-link-only copy intent.</li>
                <li>
                  <code>POST /api/verify</code> accepts a source URL and returns a scored evidence report.
                </li>
                <li>
                  <code>GET /api/article</code> and <code>GET /api/article/:id</code> remain available
                  as the verified source archive for older links and evidence references.
                </li>
                <li>
                  <code>GET /api/curators</code> and <code>GET /api/curator/:id</code> remain available
                  for graph identity records that now appear in-product as predictor trust.
                </li>
                <li>
                  <code>GET /api/trust/:address</code> reads trust against the same tag semantics the
                  backend writes.
                </li>
              </ul>
              <p>
                x402 and native trade execution remain out of scope for v1. Payment enforcement is not claimed as
                live unless request verification is actually implemented end-to-end.
              </p>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="roadmap" title="7. Roadmap" />
              <div className="grid-2" style={{ marginTop: 12 }}>
                {[
                  {
                    phase: "Now",
                    detail:
                      "Prediction feed, market pages, thesis pages, predictor profiles, explicit X command ingestion, and evidence tools.",
                  },
                  {
                    phase: "Next",
                    detail:
                      "Harden external market providers, add resolved-thesis scoring, and improve product freshness controls.",
                  },
                  {
                    phase: "Later",
                    detail:
                      "Promote resolved thesis outcomes into reputation adapters once the product record proves useful.",
                  },
                  {
                    phase: "Future research",
                    detail:
                      "Explore native settlement only after the external-market social layer has real active predictors.",
                  },
                ].map((item) => (
                  <article key={item.phase} className="surface roadmap-card">
                    <h3>{item.phase}</h3>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="archive" title="8. Boundary" />
              <p>
                Eva does not execute trades in v1. It does not custody funds, place market orders, or operate a native
                prediction market. The live product records theses and reputation around external markets.
              </p>
              <p>
                The trust graph, prediction-layer APIs, and evidence tools are the canonical product surface.
              </p>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
