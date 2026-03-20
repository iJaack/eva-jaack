import type { Metadata } from "next";
import Link from "next/link";
import "./evalanche.css";

export const metadata: Metadata = {
  title: "Evalanche — Agent wallet infrastructure for Eva Protocol",
  description:
    "Evalanche is the agent wallet and identity stack behind Eva Protocol's long-term signing architecture: ERC-8004 identity, x402 payments, cross-chain operations, and programmable agent wallets.",
};

const features = [
  {
    badge: "Wallet stack",
    title: "Agent-native signing infrastructure",
    body: "Evalanche is the architectural direction for moving Eva away from hard-coded private-key assumptions and toward a reusable agent wallet layer.",
  },
  {
    badge: "ERC-8004",
    title: "Identity and reputation compatibility",
    body: "Eva and Evalanche both center agent-native standards so trust, identity, and service endpoints remain legible across the Avalanche ecosystem.",
  },
  {
    badge: "x402",
    title: "Monetizable agent APIs",
    body: "The same infrastructure that powers agent wallets also supports payment-gated access patterns for verification services and protocol tooling.",
  },
  {
    badge: "Multi-chain",
    title: "Built broader than one app",
    body: "Evalanche is open-source infrastructure that can support many agent products, with Eva as the proving ground for real trust workflows.",
  },
] as const;

export default function EvalanchePage() {
  return (
    <div className="ev-root">
      <nav className="ev-nav">
        <Link href="/" className="ev-nav-home">← eva.jaack.me</Link>
        <div className="ev-nav-links">
          <a href="https://github.com/iJaack/evalanche" target="_blank" rel="noreferrer" className="ev-nav-link">GitHub</a>
          <a href="https://www.npmjs.com/package/evalanche" target="_blank" rel="noreferrer" className="ev-nav-link">npm</a>
          <a href="https://clawhub.com/skills/evalanche" target="_blank" rel="noreferrer" className="ev-nav-link">ClawHub</a>
        </div>
      </nav>

      <header className="ev-hero">
        <div className="ev-hero-bg" aria-hidden="true" />
        <div className="ev-hero-grid" aria-hidden="true" />

        <div className="ev-hero-body">
          <div className="ev-hero-left">
            <div className="ev-logo-icon">E</div>
            <h1 className="ev-wordmark">
              <span className="ev-red">eva</span>lanche
            </h1>
            <p className="ev-tagline">agent wallet infrastructure that informs Eva&apos;s signer future</p>
            <div className="ev-badges">
              <span className="ev-badge">ERC-8004</span>
              <span className="ev-badge">x402</span>
              <span className="ev-badge">Headless wallets</span>
              <span className="ev-badge">Avalanche-native</span>
              <span className="ev-badge">Multi-EVM</span>
            </div>
            <div className="ev-hero-ctas">
              <a href="https://github.com/iJaack/evalanche" target="_blank" rel="noreferrer" className="ev-btn-primary">GitHub</a>
              <Link href="/about" className="ev-btn-ghost">Back to Eva →</Link>
            </div>
          </div>

          <div className="ev-hero-code">
            <div className="ev-code-bar">
              <span className="ev-dot" /><span className="ev-dot" /><span className="ev-dot" />
              <span className="ev-code-title">signer-roadmap.ts</span>
            </div>
            <pre className="ev-code-body"><code>{`// Eva today: clean signer abstraction
// Eva tomorrow: Evalanche-backed execution

const signer = getSignerService();

await signer.writeContract({
  address: erc8004Validation,
  abi,
  functionName: 'validationResponse',
  args,
});

// provider can evolve without
// rewriting the verification pipeline`}</code></pre>
          </div>
        </div>
      </header>

      <section className="ev-section">
        <div className="ev-container">
          <h2 className="ev-section-title">Why this page exists</h2>
          <div className="ev-features">
            {features.map((feature) => (
              <div key={feature.title} className="ev-feature-card">
                <span className="ev-feature-badge">{feature.badge}</span>
                <h3 className="ev-feature-title">{feature.title}</h3>
                <p className="ev-feature-body">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ev-section" id="install">
        <div className="ev-container">
          <h2 className="ev-section-title">Eva integration direction</h2>
          <div className="ev-steps">
            {[
              ["01", "Abstract signing in the backend", "Done in this pass: blockchain writes now flow through a signer service boundary."],
              ["02", "Keep private-key mode as compatibility fallback", "Current production-safe path remains available for existing deployments."],
              ["03", "Add Evalanche-backed provider when runtime wiring is ready", "Scaffolding is in place without forcing unfinished infrastructure into the core path."],
            ].map(([step, label, text]) => (
              <div key={step} className="ev-step">
                <div className="ev-step-meta">
                  <span className="ev-step-num">{step}</span>
                  <span className="ev-step-label">{label}</span>
                </div>
                <pre className="ev-step-code"><code>{text}</code></pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="ev-footer">
        <p>built for <a href="https://eva.jaack.me">Eva Protocol</a> by Eva · open source · Avalanche-first</p>
      </footer>
    </div>
  );
}
