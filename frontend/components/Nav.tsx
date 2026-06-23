"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import DynamicAuthControl from "./DynamicAuthControl";
import ThemeToggle from "./ThemeToggle";

const navItems: readonly { href: string; label: string; exact?: boolean; highlight?: boolean }[] = [
  { href: "/markets", label: "Markets" },
  { href: "/compose", label: "Compose" },
  { href: "/predictors", label: "Predictors" },
  { href: "/campaigns", label: "Campaigns" },
];

const loopItems = [
  { href: "/markets", label: "Find signals" },
  { href: "/compose", label: "Draft thesis" },
  { href: "/thesis/thesis-0fdef25794b38b6e8eed7524", label: "Track updates" },
  { href: "/predictors", label: "Build record" },
] as const;

function activeLoopHref(pathname: string): string | null {
  if (pathname === "/") return "/markets";
  if (pathname.startsWith("/markets")) return "/markets";
  if (pathname.startsWith("/compose")) return "/compose";
  if (pathname.startsWith("/thesis")) return "/thesis/thesis-0fdef25794b38b6e8eed7524";
  if (pathname.startsWith("/predictors")) {
    return "/predictors";
  }
  return null;
}

function routeCta(pathname: string): { href: string; label: string } {
  if (pathname.startsWith("/markets")) return { href: "/compose", label: "Use signal" };
  if (pathname.startsWith("/compose")) return { href: "/markets", label: "Add signals" };
  if (pathname.startsWith("/thesis")) return { href: "/compose", label: "Draft response" };
  if (pathname.startsWith("/predictors")) return { href: "/markets", label: "Find signals" };
  if (pathname.startsWith("/campaigns")) return { href: "/campaigns/forecast-qa-checklist", label: "Run campaign" };
  return { href: "/markets", label: "Start thesis" };
}

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const cta = routeCta(pathname);
  const activeHref = activeLoopHref(pathname);

  return (
    <>
      <header className="topbar">
        <a href="#main-content" className="skip-link">
          Skip to Content
        </a>
        <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
          <div className="brand-mark" aria-hidden />
          <div className="brand-text">
            <span className="brand-title">Eva Protocol</span>
            <span className="brand-sub">public thesis publishing</span>
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
        </nav>

        <div className="topbar-actions">
          <DynamicAuthControl />
          <ThemeToggle />
          <Link href="/compose" className="nav-edge-cta" onClick={() => setMenuOpen(false)}>
            Start thesis
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
      <section className="participation-dock" aria-label="Participation loop">
        <div className="participation-dock-inner">
          <div className="participation-dock-copy">
            <span className="participation-kicker">Thesis loop</span>
            <strong>Build one public argument from markets, facts, and revisions</strong>
          </div>
          <nav className="participation-loop" aria-label="Eva participation stages">
            {loopItems.map((item, index) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`loop-step${active ? " loop-step-active" : ""}`}
                >
                  <span>{index + 1}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link href={cta.href} className="participation-cta">
            {cta.label}
          </Link>
        </div>
      </section>
    </>
  );
}
