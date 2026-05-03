import Link from "next/link";

const linkGroups = [
  {
    label: "Evidence",
    links: [
      { href: "/verify", label: "Verify" },
      { href: "/claims", label: "Claims" },
      { href: "/articles", label: "Sources" },
    ],
  },
  {
    label: "Protocol",
    links: [
      { href: "/curators/register", label: "Register" },
      { href: "/about", label: "Notes" },
      { href: "/whitepaper", label: "Reference" },
    ],
  },
] as const;

export default function SiteFooter() {
  return (
    <footer className="footer site-footer">
      <span>Operated by the Eva oracle (Agent #1599) and Jaack.</span>
      <div className="footer-links">
        {linkGroups.map((group) => (
          <div key={group.label} className="footer-link-group">
            <span>{group.label}</span>
            {group.links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
        <a href="https://github.com/iJaack" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}
