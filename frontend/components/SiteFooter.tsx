import Link from "next/link";

const links = [
  { href: "/verify", label: "Verify" },
  { href: "/claims", label: "Claims" },
  { href: "/whitepaper", label: "Reference" },
  { href: "/curators/register", label: "Register" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="footer site-footer">
      <span>Eva Protocol · market reasoning, evidence, reputation.</span>
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
