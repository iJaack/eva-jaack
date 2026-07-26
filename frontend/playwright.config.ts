import { defineConfig, devices } from "@playwright/test";

const deploymentBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim().replace(/\/$/, "");
const vercelBypassSecret = (
  process.env.SMOKE_VERCEL_BYPASS_SECRET ??
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ??
  ""
).trim();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    baseURL: deploymentBaseUrl || "http://127.0.0.1:4281",
    trace: "on-first-retry",
    ...(vercelBypassSecret
      ? {
          extraHTTPHeaders: {
            "x-vercel-protection-bypass": vercelBypassSecret,
            "x-vercel-set-bypass-cookie": "true",
          },
        }
      : {}),
  },
  webServer: deploymentBaseUrl
    ? undefined
    : {
        command:
          "NEXT_PUBLIC_DYNAMIC_TEST_CONTEXT=1 pnpm exec next dev --webpack --hostname 127.0.0.1 --port 4281",
        url: "http://127.0.0.1:4281",
        cwd: ".",
        reuseExistingServer: !process.env.CI,
        stdout: "pipe",
        stderr: "pipe",
      },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
