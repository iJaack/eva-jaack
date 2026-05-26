import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const currentDir = dirname(fileURLToPath(import.meta.url));
const localBackendOrigin = process.env.EVA_BACKEND_ORIGIN ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: resolve(currentDir, ".."),
  },
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];

    return [
      {
        source: "/api/:path*",
        destination: `${localBackendOrigin}/api/:path*`,
      },
      {
        source: "/.well-known/:path*",
        destination: `${localBackendOrigin}/.well-known/:path*`,
      },
      {
        source: "/health",
        destination: `${localBackendOrigin}/health`,
      },
    ];
  },
};

export default nextConfig;
