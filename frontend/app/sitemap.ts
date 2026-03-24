import type { MetadataRoute } from "next";
import { protocol } from "@/lib/protocol";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = protocol.app.siteUrl;

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
    }
  ];
}
