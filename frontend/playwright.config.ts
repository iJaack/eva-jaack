import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4281",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm exec next dev --webpack --hostname 127.0.0.1 --port 4281",
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
