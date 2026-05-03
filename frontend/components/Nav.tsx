"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const navItems: readonly { href: string; label: string; exact?: boolean; highlight?: boolean }[] = [
  { href: "/", label: "Home", exact: true },
  { href: "/markets", label: "Markets" },
  { href: "/compose", label: "Compose" },
  { href: "/predictors", label: "Predictors" },
  { href: "/blog", label: "Blog" },
];

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <a href="#main-content" className="skip-link">
        Skip to Content
      </a>
      <Link href="/" className="brand" style={{ textDecoration: "none" }} onClick={() => setMenuOpen(false)}>
        <div className="brand-mark" aria-hidden />
        <div className="brand-text">
          <span className="brand-title">Eva Predicts</span>
          <span className="brand-sub">reputation OS</span>
        </div>
      </Link>

      <div className="topbar-actions">
        <ThemeToggle />
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
      </nav>
    </header>
  );
}
