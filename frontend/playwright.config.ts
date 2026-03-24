import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
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
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
