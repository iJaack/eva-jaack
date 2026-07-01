import Link from "next/link";

const links = [
  { href: "/markets", label: "Markets" },
  { href: "/compose", label: "Compose" },
  { href: "/predictors", label: "Predictors" },
  { href: "/campaigns", label: "Campaigns" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="footer site-footer">
      <div className="footer-brand">
        <span className="eyebrow">Eva Protocol</span>
        <p>Public thesis posts built from prediction markets, facts, anchors, and revision history.</p>
      </div>
      <div className="footer-links">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <a href="https://github.com/iJaack/eva-jaack" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}
