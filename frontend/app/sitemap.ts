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
      url: `${base}/campaigns/trust-receipts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85
    },
    {
      url: `${base}/predictors`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${base}/campaigns/agent-receipts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85
    }
  ];
}
