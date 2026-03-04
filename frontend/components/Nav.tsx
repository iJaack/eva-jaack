"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <Link href="/" className="brand" style={{ textDecoration: "none" }}>
        <div className="brand-mark" aria-hidden />
        <div className="brand-text">
          <span className="brand-title">Eva Protocol</span>
          <span className="brand-sub">Trust-Weighted Social News Network</span>
        </div>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
        <Link
          href="/articles"
          className={`nav-pill${pathname === "/articles" ? " nav-pill-active" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          Articles
        </Link>
        <Link
          href="/curators"
          className={`nav-pill${pathname === "/curators" ? " nav-pill-active" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          Curators
        </Link>
        <Link
          href="/about"
          className={`nav-pill${pathname === "/about" ? " nav-pill-active" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          About
        </Link>
        <Link href="/whitepaper" className="nav-pill" onClick={() => setMenuOpen(false)}>
          Whitepaper
        </Link>
        <Link href="/evalanche" className="nav-pill nav-pill-highlight" onClick={() => setMenuOpen(false)}>
          Evalanche SDK
        </Link>
        <a
          href="https://github.com/iJaack"
          target="_blank"
          rel="noreferrer"
          className="nav-pill"
          onClick={() => setMenuOpen(false)}
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
