import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { formatBlogDate, getAllPosts, getPostBySlug } from "@/lib/blog";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} — Eva Protocol`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Nav />
      <main id="main-content" className="page-shell">
        <div className="back-row">
          <Link href="/blog" className="btn btn-ghost btn-sm">
            ← Back to Blog
          </Link>
        </div>

        <article className="blog-post-shell">
          <header className="surface blog-post-header">
            <div className="blog-post-glow" aria-hidden />
            <div className="blog-meta-row">
              <span className="blog-meta-pill">Journal</span>
              <span>{formatBlogDate(post.publishedAt)}</span>
              <span>{post.readingTime}</span>
            </div>
            <h1 className="blog-post-title">{post.title}</h1>
            <p className="blog-post-dek">{post.dek}</p>
          </header>

          <div className="surface blog-post-body">
            {post.bodySections.map((section) => (
              <section key={section.title} className="blog-post-section">
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </article>

        <SiteFooter />
      </main>
    </>
  );
}
