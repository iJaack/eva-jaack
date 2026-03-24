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
      <main className="page-shell">
        <section className="hero" style={{ paddingBottom: 0 }}>
          <span className="hero-kicker">On-Chain Evidence</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(28px, 5vw, 56px)" }}>
            Article Feed
          </h1>
          <p className="hero-sub" style={{ fontSize: "clamp(16px, 1.8vw, 22px)" }}>
            {loading
              ? "Loading articles from Avalanche..."
              : `${count} articles registered on-chain`}
          </p>
        </section>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div className="grid-2" style={{ marginTop: 24 }}>
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
