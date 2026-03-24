import Link from "next/link";
import { protocol } from "@/lib/protocol";

type TocItem = {
  id: string;
  title: string;
};

const toc: TocItem[] = [
  { id: "abstract", title: "1. Abstract" },
  { id: "product", title: "2. Product" },
  { id: "flow", title: "3. Verification Flow" },
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
          <p>Next.js on Vercel. Curator onboarding, live article views, and verification UI.</p>
        </div>
        <div className="diagram-cell">
          <h4>Backend</h4>
          <p>Hono API for verification, article detail, curator detail, and trust summaries.</p>
        </div>
        <div className="diagram-cell">
          <h4>On-chain</h4>
          <p>EvaTrustGraph plus ERC-8004 registries on Avalanche C-Chain.</p>
        </div>
      </div>
      <div className="flow-line">
        <span>Register curator</span>
        <span>→</span>
        <span>Submit source</span>
        <span>→</span>
        <span>Verify claims</span>
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
            <span className="brand-title">Eva Protocol Whitepaper</span>
            <span className="brand-sub">Aligned edition · March 2026</span>
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
          <h1 className="hero-title">A trust graph for article verification on Avalanche.</h1>
          <p className="hero-sub">
            Eva Protocol is a curator network. Curators register with stake, submit source URLs, and
            build a measurable track record as Eva verifies claims and writes evidence-linked results
            back to Avalanche.
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
                The current Eva Protocol product is not a prediction market and not a marketing-only
                landing page. It is a live trust graph with three product surfaces: curator
                onboarding, article verification, and curator or article detail pages that read the
                same canonical on-chain state the backend writes to.
              </p>
              <p>
                The system is Avalanche-first. `EvaTrustGraph` is the canonical source of article
                and curator state. ERC-8004 registries remain part of the trust boundary for
                identity, validation receipts, and reputation events.
              </p>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="product" title="2. Product" />
              <ul>
                <li>Curators register with an owned ERC-8004 agent identity and self-stake.</li>
                <li>Curators submit source URLs they want Eva to verify.</li>
                <li>Eva extracts factual claims, checks evidence, stores a report, and updates trust.</li>
                <li>Readers and agents consume the resulting trust graph through the UI and API.</li>
              </ul>
              <p>
                The key product decision is alignment: the frontend now consumes backend response
                schemas for verification and detail views, while the backend reads canonical on-chain
                state from the deployed trust-graph contract.
              </p>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="flow" title="3. Verification Flow" />
              <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
                <li>Fetch the submitted article and normalize the content.</li>
                <li>Extract factual claims suitable for verification.</li>
                <li>Check on-chain claims against blockchain data and off-chain claims against web evidence.</li>
                <li>Score each claim and compute an overall article score.</li>
                <li>Store the report and write feedback or validation receipts on Avalanche.</li>
                <li>Surface the result through `/api/verify`, `/api/article/:id`, and the UI.</li>
              </ol>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="architecture" title="4. Architecture" />
              <StackDiagram />
              <p>
                Vercel is the canonical deployment target for the product surface. The frontend is a
                dynamic Next.js app, and the backend routes are exposed through the same domain so
                article, curator, trust, and verification views do not drift across environments.
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
                  <strong>Identity model:</strong> the Eva oracle uses agent #{protocol.agents.eva.id},
                  but curator onboarding requires each curator to supply and own their own agent ID.
                </li>
              </ul>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="api" title="6. Public API" />
              <p>The public surface is intentionally narrow and explicit:</p>
              <ul>
                <li>
                  <code>POST /api/verify</code> accepts a source URL and returns a scored report plus
                  honest payment metadata.
                </li>
                <li>
                  <code>GET /api/article</code> and <code>GET /api/article/:id</code> return on-chain
                  article state plus stored report data when available.
                </li>
                <li>
                  <code>GET /api/curators</code> and <code>GET /api/curator/:id</code> return live
                  curator detail instead of placeholders.
                </li>
                <li>
                  <code>GET /api/trust/:address</code> reads trust against the same tag semantics the
                  backend writes.
                </li>
              </ul>
              <p>
                x402 remains a roadmap item. Payment enforcement is not claimed as live unless request
                verification is actually implemented end-to-end.
              </p>
            </section>

            <section className="surface paper-section">
              <SectionTitle id="roadmap" title="7. Roadmap" />
              <div className="grid-2" style={{ marginTop: 12 }}>
                {[
                  {
                    phase: "Now",
                    detail:
                      "Dynamic article and curator routes, real curator APIs, shared config, honest verification responses, and ABI generation from the deployed contract.",
                  },
                  {
                    phase: "Next",
                    detail:
                      "Harden verification persistence, add broader route coverage, and formalize deployment smoke tests for Vercel previews.",
                  },
                  {
                    phase: "Later",
                    detail:
                      "Implement real x402 request verification if payment gating remains a product requirement.",
                  },
                  {
                    phase: "Future research",
                    detail:
                      "Explore broader trust distribution mechanics without letting speculative concepts replace the core trust-graph product.",
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
              <SectionTitle id="archive" title="8. Archived Concepts" />
              <p>
                Earlier drafts of Eva Protocol described prediction markets, cross-chain x402
                settlement, and broader tokenomics as if they were active product features. They are
                not the live product surface and should be treated as archived research material
                unless they are reintroduced behind a concrete implementation plan.
              </p>
              <p>
                The repo now treats those concepts as roadmap context only. The trust graph,
                verification pipeline, and curator onboarding flow are the canonical product.
              </p>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
