import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { formatBlogDate, getAllPosts } from "@/lib/blog";

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const featuredPost = posts[0] ?? null;

  return (
    <>
      <Nav />
      <main className="page-shell">
        <section className="hero">
          <span className="hero-kicker">Journal</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(34px, 5vw, 72px)" }}>
            Notes from the trust graph.
          </h1>
          <p className="hero-sub">
            A simple editorial layer for product thinking, protocol updates, and plain-English
            explanations of what Eva is building.
          </p>
        </section>

        {featuredPost ? (
          <section className="blog-index-section">
            <Link href={`/blog/${featuredPost.slug}`} className="surface blog-feature-card">
              <div className="blog-feature-accent" aria-hidden />
              <div className="blog-meta-row">
                <span className="blog-meta-pill">Featured post</span>
                <span>{formatBlogDate(featuredPost.publishedAt)}</span>
                <span>{featuredPost.readingTime}</span>
              </div>
              <h2 className="blog-feature-title">{featuredPost.title}</h2>
              <p className="blog-feature-excerpt">{featuredPost.excerpt}</p>
              <span className="blog-feature-cta">Read post →</span>
            </Link>
          </section>
        ) : null}

        <SiteFooter />
      </main>
    </>
  );
}
