import type { Metadata } from "next";
import Link from "next/link";
import "./evalanche.css";

export const metadata: Metadata = {
  title: "Evalanche — Multi-EVM agent wallet SDK",
  description:
    "Evalanche is a multi-EVM agent wallet SDK for identity, payments, cross-chain execution, market intelligence, and agent-native signing.",
};

const features = [
  {
    badge: "Wallet stack",
    title: "Agent-native execution layer",
    body: "Evalanche gives agents a reusable wallet and execution surface across 21+ EVM chains without browser popups or custodial dependencies.",
  },
  {
    badge: "Identity",
    title: "ERC-8004 native",
    body: "Identity resolution, service endpoints, and trust-oriented agent workflows are built in instead of bolted on later.",
  },
  {
    badge: "Markets",
    title: "More than just wallet plumbing",
    body: "Evalanche now spans DeFi, dYdX perps, CoinGecko market intelligence, and Polymarket discovery for agent-native trading and research flows.",
  },
  {
    badge: "Multi-chain",
    title: "Built broader than one app",
    body: "Evalanche is open-source infrastructure that can support many agent products, with Eva as one proving ground rather than the full product boundary.",
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
              <span className="ev-badge">CoinGecko</span>
              <span className="ev-badge">Polymarket</span>
              <span className="ev-badge">dYdX</span>
              <span className="ev-badge">Multi-EVM</span>
            </div>
            <div className="ev-hero-ctas">
              <a href="https://github.com/iJaack/evalanche" target="_blank" rel="noreferrer" className="ev-btn-primary">GitHub</a>
              <Link href="/about" className="ev-btn-ghost">Back to Eva →</Link>
            </div>
          </div>

          <figure className="ev-hero-code">
            <figcaption className="ev-code-title">evalanche-v1.5.2.ts</figcaption>
            <pre className="ev-code-body"><code>{`const { agent } = await Evalanche.boot({ network: 'avalanche' });

const quote = await agent.swap({
  fromChainId: 43114,
  toChainId: 43114,
  fromToken: 'native',
  toToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  fromAmount: '0.1',
  fromAddress: agent.address,
});

const markets = await agent.coinGecko().markets({
  vs_currency: 'usd',
  order: 'market_cap_desc',
  per_page: 10,
});`}</code></pre>
          </figure>
        </div>
      </header>

      <section className="ev-section">
        <div className="ev-container">
          <h2 className="ev-section-title">What Evalanche is now</h2>
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
          <h2 className="ev-section-title">Why v1.5.2 matters</h2>
          <div className="ev-steps">
            {[
              ["01", "Safer custom RPC handling", "Custom RPC overrides now map to the correct chain IDs across supported EVM aliases instead of defaulting everything to Avalanche/Fuji."],
              ["02", "Polymarket MCP paths cleaned up", "Search, order book lookup, and positions now call real methods. Unsupported buy/approve/redeem paths fail honestly."],
              ["03", "Sharper market workflow surface", "CoinGecko, Polymarket, dYdX references, README, ClawHub skill, and the public page are now aligned around the same product surface."],
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
        <p>built for <a href="https://eva.jaack.me">Eva Protocol</a> and broader agent infrastructure work · open source · Avalanche-first roots, multi-EVM scope</p>
      </footer>
    </div>
  );
}
