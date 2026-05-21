"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import ArticleCard from "@/components/ArticleCard";
import SiteFooter from "@/components/SiteFooter";
import { getArticles, type Article } from "@/lib/api";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticles()
      .then((response) => {
        setArticles(response.articles);
        setCount(response.count);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <section className="hero">
          <span className="hero-kicker">Verified Sources Archive</span>
          <h1 className="hero-title">Source reports that can support market theses.</h1>
          <p className="hero-sub">
            {loading
              ? "Loading source reports from Avalanche…"
              : `${count} source reports registered on-chain`}
          </p>
        </section>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div className="grid-2 route-section">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
