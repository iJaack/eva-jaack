import Link from "next/link";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { formatBlogDate, getAllPosts } from "@/lib/blog";

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const featuredPost = posts.find((post) => post.featured) ?? posts[0] ?? null;
  const remainingPosts = posts.filter((post) => post.slug !== featuredPost?.slug);

  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <section className="hero">
          <span className="hero-kicker">Journal</span>
          <h1 className="hero-title">Notes from the prediction layer.</h1>
          <p className="hero-sub">
            Product notes, protocol updates, and plain-English writing on markets, theses, evidence, and
            reputation design. Eva stays an evidence and reputation layer around external forecasts, not an exchange.
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

        {remainingPosts.length > 0 ? (
          <section className="blog-index-section">
            <p className="section-kicker">Archive</p>
            <div className="thesis-stack">
              {remainingPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="prediction-card">
                  <div className="blog-meta-row">
                    <span>{formatBlogDate(post.publishedAt)}</span>
                    <span>{post.readingTime}</span>
                  </div>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <SiteFooter />
      </main>
    </>
  );
}
