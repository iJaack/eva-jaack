import Link from "next/link";
import { protocol } from "@/lib/protocol";

const links = [
  { href: "/markets", label: "Markets" },
  { href: "/compose", label: "Compose" },
  { href: "/predictors", label: "Predictors" },
  { href: "/campaigns", label: "Campaigns" },
] as const;

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function SiteFooter() {
  const contractUrl = `${protocol.chain.explorerUrl}/address/${protocol.contracts.evaThesisProtocol}`;

  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <span>Eva Protocol</span>
        <p>Public theses with inspectable sources, revisions, authorship, and anchors.</p>
      </div>
      <nav className="site-footer-links" aria-label="Footer">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <a href={contractUrl} target="_blank" rel="noreferrer">
          Contract {shortAddress(protocol.contracts.evaThesisProtocol)}
        </a>
        <a href="https://github.com/iJaack/eva-jaack" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
    </footer>
  );
}
