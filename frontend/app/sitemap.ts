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
    },
    {
      url: `${base}/campaigns/reply-sprint`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85
    },
    {
      url: `${base}/campaigns/policy-safe-theses`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85
    },
    {
      url: `${base}/campaigns/launch-truth-status`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85
    },
    {
      url: `${base}/campaigns/source-quality-sprint`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85
    },
    {
      url: `${base}/campaigns/prediction-memory`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85
    },
    {
      url: `${base}/campaigns/ai-forecast-receipts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85
    },
    {
      url: `${base}/campaigns/protocol-proof`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85
    },
    {
      url: `${base}/campaigns/forecast-qa-checklist`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85
    }
  ];
}
