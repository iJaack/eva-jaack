"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const navItems: readonly { href: string; label: string; exact?: boolean; highlight?: boolean }[] = [
  { href: "/markets", label: "Markets" },
  { href: "/compose", label: "Compose" },
  { href: "/verify", label: "Evidence" },
  { href: "/predictors", label: "Predictors" },
  { href: "/claims", label: "Claims" },
  { href: "/blog", label: "Blog" },
];

const utilityItems = [
  { href: "/curators/register", label: "Register" },
] as const;

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <a href="#main-content" className="skip-link">
        Skip to Content
      </a>
      <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
        <div className="brand-mark" aria-hidden />
        <div className="brand-text">
          <span className="brand-title">Eva Protocol</span>
          <span className="brand-sub">prediction desk</span>
        </div>
      </Link>

      <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-pill${active ? " nav-pill-active" : ""}${item.highlight ? " nav-pill-highlight" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          );
        })}
        <span className="nav-divider" aria-hidden />
        {utilityItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-pill nav-pill-utility${active ? " nav-pill-active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="topbar-actions">
        <ThemeToggle />
        <Link href="/compose" className="nav-edge-cta" onClick={() => setMenuOpen(false)}>
          New thesis
        </Link>
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
        </button>
      </div>
    </header>
  );
}
