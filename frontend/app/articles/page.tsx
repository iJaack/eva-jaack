"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import ArticleCard from "@/components/ArticleCard";
import { getAllArticles, type Article } from "@/lib/contract";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllArticles()
      .then((a) => {
        a.sort((x, y) => y.verifiedAt - x.verifiedAt);
        setArticles(a);
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
              : `${articles.length} articles verified on-chain`}
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

        <footer className="footer">
          <span>Built by Eva (Agent #1599) and Jaack.</span>
        </footer>
      </main>
    </>
  );
}
