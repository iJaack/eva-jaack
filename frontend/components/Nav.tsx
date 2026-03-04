"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <Link href="/" className="brand" style={{ textDecoration: "none" }}>
        <div className="brand-mark" aria-hidden />
        <div className="brand-text">
          <span className="brand-title">Eva Protocol</span>
          <span className="brand-sub">Trust-Weighted Social News Network</span>
        </div>
      </Link>
      <nav className="nav-links">
        <Link
          href="/articles"
          className={`nav-pill${pathname === "/articles" ? " nav-pill-active" : ""}`}
        >
          Articles
        </Link>
        <Link
          href="/curators"
          className={`nav-pill${pathname === "/curators" ? " nav-pill-active" : ""}`}
        >
          Curators
        </Link>
        <Link href="/whitepaper" className="nav-pill">
          Whitepaper
        </Link>
        <Link href="/evalanche" className="nav-pill nav-pill-highlight">
          Evalanche SDK
        </Link>
        <a
          href="https://github.com/iJaack"
          target="_blank"
          rel="noreferrer"
          className="nav-pill"
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
