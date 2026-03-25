import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { protocol } from "@/lib/protocol";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = protocol.app.siteUrl;
  const posts = getAllPosts();

  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${base}/whitepaper`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7
    },
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6
    }))
  ];
}
