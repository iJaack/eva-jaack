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

const loopItems = [
  { href: "/markets", label: "Pick" },
  { href: "/compose", label: "Call" },
  { href: "/verify", label: "Verify" },
  { href: "/claims", label: "Resolve" },
  { href: "/predictors", label: "Rank" },
] as const;

function activeLoopHref(pathname: string): string | null {
  if (pathname === "/") return "/markets";
  if (pathname.startsWith("/markets")) return "/markets";
  if (pathname.startsWith("/compose") || pathname.startsWith("/thesis")) return "/compose";
  if (
    pathname.startsWith("/verify") ||
    pathname.startsWith("/article") ||
    pathname.startsWith("/articles") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/whitepaper") ||
    pathname.startsWith("/claims/x")
  ) {
    return "/verify";
  }
  if (pathname.startsWith("/claims")) return "/claims";
  if (pathname.startsWith("/predictors") || pathname.startsWith("/curator") || pathname.startsWith("/curators")) {
    return "/predictors";
  }
  return null;
}

function routeCta(pathname: string): { href: string; label: string } {
  if (pathname.startsWith("/markets")) return { href: "/compose", label: "Make call" };
  if (pathname.startsWith("/compose")) return { href: "/verify", label: "Check evidence" };
  if (pathname.startsWith("/thesis")) return { href: "/compose", label: "Counter" };
  if (pathname.startsWith("/blog") || pathname.startsWith("/about") || pathname.startsWith("/whitepaper")) return { href: "/markets", label: "Apply it" };
  if (pathname.startsWith("/claims/x")) return { href: "/verify", label: "Check source" };
  if (pathname.startsWith("/verify") || pathname.startsWith("/article")) return { href: "/claims", label: "Attach claim" };
  if (pathname.startsWith("/claims")) return { href: "/predictors", label: "See rank" };
  if (pathname.startsWith("/predictors") || pathname.startsWith("/curator")) return { href: "/markets", label: "Find market" };
  return { href: "/markets", label: "Start loop" };
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
      <section className="participation-dock" aria-label="Participation loop">
        <div className="participation-dock-inner">
          <div className="participation-dock-copy">
            <span className="participation-kicker">Participation loop</span>
            <strong>Pick · call · verify · resolve · rank</strong>
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
