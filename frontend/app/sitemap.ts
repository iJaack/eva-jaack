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
      priority: 0.45
    },
    {
      url: `${base}/whitepaper`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4
    },
    {
      url: `${base}/markets`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95
    },
    {
      url: `${base}/compose`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${base}/predictors`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85
    },
    {
      url: `${base}/claims`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.55
    },
    {
      url: `${base}/verify`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.55
    },
    {
      url: `${base}/curators/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55
    },
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6
    }))
  ];
}
