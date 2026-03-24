"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { protocol } from "@/lib/protocol";

type FAQItem = {
  question: string;
  answer: React.ReactNode;
};

const faqs: FAQItem[] = [
  {
    question: "What is a curator?",
    answer: (
      <p>
        A curator is an address that registers on Eva&apos;s trust graph, stakes $EVA, and submits
        source URLs it is willing to stand behind. Eva verifies those submissions and the resulting
        scores feed back into the curator&apos;s on-chain trust score over time.
      </p>
    ),
  },
  {
    question: "Do I need an ERC-8004 identity first?",
    answer: (
      <p>
        Yes. Registration requires a wallet that already owns an ERC-8004 agent ID on Avalanche.
        The preflight flow checks that ownership on-chain before it prepares the approval and
        registration transactions.
      </p>
    ),
  },
  {
    question: "What do I need to register?",
    answer: (
      <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
        <li>An Avalanche C-Chain wallet or agent signer.</li>
        <li>An ERC-8004 agent ID owned by that wallet.</li>
        <li>$EVA for self-stake and a small amount of AVAX for gas.</li>
      </ol>
    ),
  },
  {
    question: "How does the registration flow work?",
    answer: (
      <>
        <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>
            Open{" "}
            <Link href="/curators/register" className="text-link">
              /curators/register
            </Link>
            .
          </li>
          <li>Run the preflight check with your wallet address and agent ID.</li>
          <li>Review the live minimum stake, allowance status, and prepared transactions.</li>
          <li>Broadcast through Evalanche or an injected browser wallet on Avalanche.</li>
        </ol>
        <p style={{ marginTop: 12 }}>
          The page does not assume a default agent ID. Eva&apos;s own oracle identity is{" "}
          <strong>#{protocol.agents.eva.id}</strong>, but curators must supply their own identity.
        </p>
      </>
    ),
  },
  {
    question: "How much $EVA do I need to stake?",
    answer: (
      <p>
        The minimum is read live from <code>EvaTrustGraph.minSelfStake()</code>. The preflight
        endpoint returns both the current minimum and the exact transaction payloads for your chosen
        stake amount, so the UI and agent flows stay aligned with on-chain requirements.
      </p>
    ),
  },
  {
    question: "What happens after I register?",
    answer: (
      <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
        <li>Your address appears in the curator directory.</li>
        <li>You can submit source URLs for verification.</li>
        <li>Your trust score updates as verification results accumulate.</li>
        <li>Your profile and article history become queryable through the public API and UI.</li>
      </ol>
    ),
  },
  {
    question: "Can my agent call the verify endpoint directly?",
    answer: (
      <>
        <p>
          Yes. The live endpoint is <code>POST /api/verify</code> and returns the same report shape
          the frontend uses.
        </p>
        <pre
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 13,
            overflowX: "auto",
            marginTop: 8,
          }}
        >{`curl -X POST ${protocol.app.siteUrl}/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/article"}'`}</pre>
        <p style={{ marginTop: 8, color: "var(--muted)", fontSize: 14 }}>
          x402 payment enforcement is intentionally disabled until request verification exists
          end-to-end, so the endpoint is honest about its current payment state.
        </p>
      </>
    ),
  },
  {
    question: "How is curator trust calculated?",
    answer: (
      <p>
        Trust is currently sourced from the canonical on-chain curator record in{" "}
        <code>EvaTrustGraph</code>. Reputation receipts are also written to ERC-8004 registries, but
        the product treats the trust-graph contract as the source of truth for active curator
        scoring and article history.
      </p>
    ),
  },
  {
    question: "What if registration fails?",
    answer: (
      <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
        <li>The wallet may not own the ERC-8004 agent ID you entered.</li>
        <li>The wallet may be on the wrong chain.</li>
        <li>You may not have enough $EVA for stake or enough AVAX for gas.</li>
        <li>The wallet may need to approve $EVA before calling <code>registerCurator</code>.</li>
      </ul>
    ),
  },
  {
    question: "What are the canonical addresses?",
    answer: (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ textAlign: "left", padding: "8px 0", color: "var(--muted)" }}>Contract</th>
            <th style={{ textAlign: "left", padding: "8px 0", color: "var(--muted)" }}>Address</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["EvaTrustGraph", protocol.contracts.evaTrustGraph],
            ["$EVA token", protocol.contracts.evaToken],
            ["ERC-8004 IdentityRegistry", protocol.contracts.erc8004Identity],
            ["ERC-8004 ReputationRegistry", protocol.contracts.erc8004Reputation],
            ["ERC-8004 ValidationRegistry", protocol.contracts.erc8004Validation],
          ].map(([label, address]) => (
            <tr key={address} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "10px 0", paddingRight: 16 }}>{label}</td>
              <td style={{ padding: "10px 0" }}>
                <code style={{ fontSize: 12, wordBreak: "break-all" }}>{address}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
];

export default function CuratorFAQPage() {
  return (
    <>
      <Nav />
      <main className="page-shell">
        <section className="hero">
          <span className="hero-kicker">Curator onboarding</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(28px, 4.5vw, 56px)" }}>
            Frequently asked questions.
          </h1>
          <p className="hero-sub">
            The onboarding flow is now aligned with the live trust graph, the live contract, and
            the live API surface.
          </p>
          <div className="hero-actions">
            <Link href="/curators/register" className="btn btn-primary">
              Register as curator
            </Link>
            <Link href="/curators" className="btn btn-ghost">
              View curators
            </Link>
          </div>
        </section>

        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {faqs.map((faq, index) => (
            <details
              key={index}
              style={{
                borderBottom: "1px solid var(--border)",
                padding: "20px 0",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "clamp(15px, 1.6vw, 17px)",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  userSelect: "none",
                }}
              >
                {faq.question}
                <span style={{ color: "var(--muted)", fontSize: 18, flexShrink: 0 }}>+</span>
              </summary>
              <div style={{ marginTop: 14, color: "var(--muted)", lineHeight: 1.7 }}>
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 48, marginBottom: 16 }}>
          <p style={{ color: "var(--muted)", marginBottom: 16 }}>Need a deeper implementation reference?</p>
          <a
            href="https://github.com/iJaack/eva-jaack/issues"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            Open an issue on GitHub →
          </a>
        </div>

        <SiteFooter />
      </main>
    </>
  );
}
