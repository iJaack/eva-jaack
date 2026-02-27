import type { Metadata } from "next";
import "./evalanche.css";

export const metadata: Metadata = {
  title: "Evalanche — Agent Wallet SDK for Avalanche",
  description:
    "Non-custodial agent wallet SDK with ERC-8004 identity, x402 payment rails, and headless key management. Built for Eva Protocol, open for the ecosystem.",
};

const FEATURES = [
  {
    badge: "ERC-8004 Identity",
    title: "Verifiable Agent Identity",
    body: "Boot with an agentId and get a fully registered ERC-8004 identity on Avalanche. Reputation, validation receipts, and task completion — all onchain.",
    code: `const { agent } = await Evalanche.boot({
  agentId: '1599',
  network: 'avalanche'
});
// routescan.io/address/0x0fE6...8cA4`,
  },
  {
    badge: "x402 Payments",
    title: "Payment-Gated API Calls",
    body: "Make x402-compatible HTTP requests that auto-pay with USDC on Base or AVAX on Avalanche. No manual wallet signing — the agent handles it.",
    code: `const res = await agent.fetch(
  'https://api.example.com/data',
  { method: 'GET' }
);
// auto-pays x402 challenge`,
  },
  {
    badge: "Headless Wallet",
    title: "Non-Custodial Key Management",
    body: "BIP-39 keygen, macOS Keychain storage, encrypted keystores, and OpenClaw secrets integration. Agents own their keys — no human in the loop.",
    code: `// Boot resolves keys from:
// 1. openclaw secrets
// 2. env vars
// 3. encrypted keystore
const { secretsSource } = await boot();`,
  },
];

const STEPS = [
  { step: "01", label: "Install via npm", code: "npm install -g evalanche" },
  { step: "02", label: "Install OpenClaw skill", code: "clawhub install evalanche" },
  {
    step: "03",
    label: "Boot your agent",
    code: `import { Evalanche } from 'evalanche';

const { agent, secretsSource } = await Evalanche.boot({
  agentId: '1599',      // routescan.io/nft/0x8004A169.../1599
  network: 'avalanche', // or 'fuji' for testnet
});

console.log('Wallet:', agent.address);
console.log('Keys from:', secretsSource);`,
  },
  {
    step: "04",
    label: "Send AVAX",
    code: `const txHash = await agent.send({
  to: '0xRecipient...',
  value: '0.1', // AVAX
});`,
  },
  {
    step: "05",
    label: "Make x402 API calls",
    code: `const data = await agent.fetch(
  'https://api.eva.jaack.me/api/verify',
  { method: 'POST',
    body: JSON.stringify({ url: 'https://...' }) }
);
// auto-handles 402 Payment Required`,
  },
];

export default function EvalanchePage() {
  return (
    <div className="ev-root">
      {/* NAV */}
      <nav className="ev-nav">
        <a href="/" className="ev-nav-home">← eva.jaack.me</a>
        <div className="ev-nav-links">
          <a href="https://github.com/iJaack/evalanche" target="_blank" rel="noreferrer" className="ev-nav-link">GitHub</a>
          <a href="https://www.npmjs.com/package/evalanche" target="_blank" rel="noreferrer" className="ev-nav-link">npm</a>
          <a href="https://clawhub.com" target="_blank" rel="noreferrer" className="ev-nav-link">ClawHub</a>
        </div>
      </nav>

      {/* HERO */}
      <header className="ev-hero">
        <div className="ev-hero-bg" aria-hidden="true" />
        <div className="ev-hero-grid" aria-hidden="true" />

        <div className="ev-hero-body">
          <div className="ev-hero-left">
            <div className="ev-logo-icon">E</div>
            <h1 className="ev-wordmark">
              <span className="ev-red">eva</span>lanche
            </h1>
            <p className="ev-tagline">agent wallet SDK for Avalanche</p>
            <div className="ev-badges">
              <span className="ev-badge">ERC-8004 Identity</span>
              <span className="ev-badge">x402 Payments</span>
              <span className="ev-badge">Headless Wallet</span>
            </div>
            <div className="ev-hero-ctas">
              <a href="#install" className="ev-btn-primary">Get Started</a>
              <a href="https://github.com/iJaack/evalanche" target="_blank" rel="noreferrer" className="ev-btn-ghost">GitHub →</a>
            </div>
          </div>

          <div className="ev-hero-code">
            <div className="ev-code-bar">
              <span className="ev-dot" /><span className="ev-dot" /><span className="ev-dot" />
              <span className="ev-code-title">boot.ts</span>
            </div>
            <pre className="ev-code-body"><code>{`import { Evalanche } from 'evalanche';

const { agent, secretsSource } =
  await Evalanche.boot({
    agentId: '1599',
    network: 'avalanche',
  });

// agent.address → sovereign wallet
// secretsSource → 'keystore'
// trust is composable ✦`}</code></pre>
          </div>
        </div>
      </header>

      {/* FEATURES */}
      <section className="ev-section">
        <div className="ev-container">
          <h2 className="ev-section-title">What it does</h2>
          <div className="ev-features">
            {FEATURES.map((f) => (
              <div key={f.badge} className="ev-feature-card">
                <span className="ev-feature-badge">{f.badge}</span>
                <h3 className="ev-feature-title">{f.title}</h3>
                <p className="ev-feature-body">{f.body}</p>
                <pre className="ev-feature-code"><code>{f.code}</code></pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTALL */}
      <section className="ev-section" id="install">
        <div className="ev-container">
          <h2 className="ev-section-title">Get started</h2>
          <div className="ev-steps">
            {STEPS.map((s) => (
              <div key={s.step} className="ev-step">
                <div className="ev-step-meta">
                  <span className="ev-step-num">{s.step}</span>
                  <span className="ev-step-label">{s.label}</span>
                </div>
                <pre className="ev-step-code"><code>{s.code}</code></pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LINKS */}
      <section className="ev-section">
        <div className="ev-container">
          <h2 className="ev-section-title">Links</h2>
          <div className="ev-link-cards">
            {[
              { label: "GitHub", sub: "iJaack/evalanche", href: "https://github.com/iJaack/evalanche" },
              { label: "npm package", sub: "npm install evalanche", href: "https://www.npmjs.com/package/evalanche" },
              { label: "ClawHub Skill", sub: "clawhub install evalanche", href: "https://clawhub.com" },
              { label: "Eva Protocol Whitepaper", sub: "eva.jaack.me/whitepaper", href: "/whitepaper" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                className="ev-link-card"
              >
                <div>
                  <div className="ev-link-label">{l.label}</div>
                  <div className="ev-link-sub">{l.sub}</div>
                </div>
                <span className="ev-link-arrow">→</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="ev-footer">
        <p>built for <a href="https://eva.jaack.me">Eva Protocol</a> by Eva · open source · Avalanche ecosystem</p>
      </footer>
    </div>
  );
}
