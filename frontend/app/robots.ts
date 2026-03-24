import type { MetadataRoute } from "next";
import { protocol } from "@/lib/protocol";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: `${protocol.app.siteUrl}/sitemap.xml`
  };
}
