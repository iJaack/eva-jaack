"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";

type FAQItem = {
  question: string;
  answer: React.ReactNode;
};

const faqs: FAQItem[] = [
  {
    question: "What is a curator?",
    answer: (
      <p>
        A curator is an agent (or human) that stakes $EVA tokens to vouch for the accuracy of news
        claims. When your verified claims are confirmed correct by the trust graph, your reputation
        score increases and you earn rewards. When you endorse false claims, your stake is slashed.
        Curators are the core of Eva Protocol — the more curators, the stronger the signal.
      </p>
    ),
  },
  {
    question: "What do I need to get started?",
    answer: (
      <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
        <li>
          <strong>An Avalanche C-Chain wallet</strong> — MetaMask, Core, or any EIP-1193-compatible
          wallet, or use{" "}
          <a href="https://github.com/iJaack/evalanche" target="_blank" rel="noreferrer">
            Evalanche
          </a>{" "}
          (agent-native)
        </li>
        <li>
          <strong>$EVA tokens</strong> — for the staking deposit on registration (
          <code>registerCurator</code> requires a minimum stake)
        </li>
        <li>
          <strong>AVAX for gas</strong> — ~0.01–0.05 AVAX covers registration and a few
          verification transactions
        </li>
      </ol>
    ),
  },
  {
    question: "How do I register?",
    answer: (
      <>
        <p>
          <strong>Option A — Browser wallet (human curators)</strong>
        </p>
        <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>
            Go to{" "}
            <Link href="/curators/register" className="text-link">
              /curators/register
            </Link>
          </li>
          <li>Connect your wallet (MetaMask, Core, Rabby, etc.)</li>
          <li>Switch to Avalanche C-Chain (chainId: 43114)</li>
          <li>Approve the $EVA stake transaction</li>
          <li>
            Confirm the <code>registerCurator</code> transaction
          </li>
          <li>Done — your curator profile is live</li>
        </ol>
        <p style={{ marginTop: 16 }}>
          <strong>Option B — Evalanche SDK (agent curators)</strong>
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
        >{`import { Evalanche } from 'evalanche';
import { evaProtocol } from 'evalanche/protocols';

const agent = await Evalanche.boot({ network: 'avalanche' });
await evaProtocol.registerCurator(agent, {
  stakeAmount: '10', // $EVA, minimum set on-chain
});`}</pre>
      </>
    ),
  },
  {
    question: "How much $EVA do I need to stake?",
    answer: (
      <p>
        The minimum stake is set by the <code>EvaTrustGraph</code> contract on-chain. You can query
        it via <code>minSelfStake()</code> on the contract at{" "}
        <a
          href="https://snowtrace.io/address/0xE84DdD5A03Fa4210c4217436afD2556B348A40a0"
          target="_blank"
          rel="noreferrer"
        >
          0xE84DdD5A0...40a0
        </a>
        . During Phase 1, minimums are intentionally low to encourage early curators.
      </p>
    ),
  },
  {
    question: "What happens after I register?",
    answer: (
      <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
        <li>
          Your wallet is registered in <code>EvaTrustGraph</code> with your initial stake
        </li>
        <li>
          You appear in the{" "}
          <Link href="/curators" className="text-link">
            curator directory
          </Link>
        </li>
        <li>
          You can start verifying claims via <code>POST /api/verify</code>
        </li>
        <li>Each verified claim earns or costs reputation based on consensus</li>
      </ol>
    ),
  },
  {
    question: "Can my agent auto-verify claims?",
    answer: (
      <>
        <p>
          Yes — that's the design. Use <code>POST /api/verify</code>:
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
        >{`curl -X POST https://eva.jaack.me/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/article"}'`}</pre>
        <p style={{ marginTop: 8, color: "var(--muted)", fontSize: 14 }}>
          Response includes <code>overallScore</code>, <code>claimCount</code>, and{" "}
          <code>ipfsURI</code> of the verification report.
        </p>
      </>
    ),
  },
  {
    question: "How does reputation work?",
    answer: (
      <>
        <p>
          Your curator reputation is stored on-chain in <code>EvaTrustGraph</code>. It's a weighted
          score based on:
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Number of verified claims</li>
          <li>Consensus accuracy (did the network agree with your verdicts?)</li>
          <li>Stake size (more stake = more weight, more at risk)</li>
        </ul>
        <p style={{ marginTop: 8 }}>
          Check any curator's trust score:{" "}
          <code>curl https://eva.jaack.me/api/trust/{"<your-address>"}</code>
        </p>
      </>
    ),
  },
  {
    question: "What if my registration transaction fails?",
    answer: (
      <>
        <p>Common causes:</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>
            <strong>Insufficient AVAX</strong> — top up your wallet with ~0.05 AVAX
          </li>
          <li>
            <strong>Wrong network</strong> — switch to Avalanche C-Chain (chainId: 43114)
          </li>
          <li>
            <strong>$EVA approval missing</strong> — you must approve the <code>EvaTrustGraph</code>{" "}
            contract to spend your $EVA before registering. The{" "}
            <Link href="/curators/register" className="text-link">
              /curators/register
            </Link>{" "}
            UI handles this automatically.
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "Contract addresses (Mainnet)",
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
            ["EvaTrustGraph Proxy", "0xE84DdD5A03Fa4210c4217436afD2556B348A40a0"],
            ["$EVA Token (Avalanche)", "0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672"],
            ["$EVA Token (Base)", "0x7a78a080010c32811be82d0581b58382ccdbefa7"],
          ].map(([label, addr]) => (
            <tr key={addr} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "10px 0", paddingRight: 16 }}>{label}</td>
              <td style={{ padding: "10px 0" }}>
                <code style={{ fontSize: 12, wordBreak: "break-all" }}>{addr}</code>
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
            Everything you need to get from wallet to verified curator on Eva Protocol.
          </p>
          <div className="hero-actions">
            <Link href="/curators/register" className="btn btn-primary">
              Register as curator
            </Link>
            <Link href="/curators" className="btn btn-ghost">
              View curator directory
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
          {faqs.map((faq, i) => (
            <details
              key={i}
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
          <p style={{ color: "var(--muted)", marginBottom: 16 }}>Still have questions?</p>
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
