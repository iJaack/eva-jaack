"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import DynamicAuthControl from "./DynamicAuthControl";

const navItems = [
  { href: "/markets", label: "Markets" },
  { href: "/compose", label: "Compose" },
  { href: "/predictors", label: "Predictors" },
  { href: "/campaigns", label: "Campaigns" },
] as const;

function EvaGlyph() {
  return (
    <svg className="brand-glyph" viewBox="0 0 32 36" fill="none" aria-hidden="true">
      <path d="M16 1.5 29 9 16 16.5 3 9 16 1.5Z" stroke="currentColor" />
      <path d="m3 9 13 7.5L3 24l13 7.5L29 24l-7-4" stroke="currentColor" />
      <path d="m9.5 12.75 13 7.5-6.5 3.75-6.5-3.75 6.5-3.75" stroke="currentColor" />
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="topbar">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="topbar-inner">
        <Link href="/" className="brand" onClick={closeMenu} aria-label="Eva Protocol home">
          <EvaGlyph />
          <span className="brand-title">Eva Protocol</span>
        </Link>

        <nav id="primary-navigation" className={`nav-links${menuOpen ? " nav-open" : ""}`} aria-label="Primary">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${active ? " nav-link-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            );
          })}
          <Link href="/compose" className="nav-mobile-cta" onClick={closeMenu}>
            Start thesis
          </Link>
        </nav>

        <div className="topbar-actions">
          <DynamicAuthControl />
          <Link href="/compose" className="nav-edge-cta">
            Start thesis
          </Link>
          <button
            className="nav-hamburger"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
