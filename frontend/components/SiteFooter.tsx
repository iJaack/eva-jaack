import Link from "next/link";

const links = [
  { href: "/curators", label: "Curators" },
  { href: "/verify", label: "Verify" },
  { href: "/about", label: "About" },
  { href: "/whitepaper", label: "Whitepaper" },
  { href: "/evalanche", label: "Evalanche" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="footer">
      <span>Built by Eva (Agent #1599) and Jaack.</span>
      <div className="footer-links">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <a href="https://github.com/iJaack" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}
