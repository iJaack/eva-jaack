import Link from "next/link";

const links = [
  { href: "/markets", label: "Markets" },
  { href: "/compose", label: "Compose" },
  { href: "/predictors", label: "Predictors" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="footer site-footer">
      <span>Eva Protocol · publish evolving thesis posts from prediction markets and facts.</span>
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
