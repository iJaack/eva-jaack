import { expect, test } from "@playwright/test";

const canonicalThesisPath = "/thesis/thesis-0fdef25794b38b6e8eed7524";

test.skip(!process.env.PLAYWRIGHT_BASE_URL, "Deployment browser regression only runs against an explicit deployed URL.");

test("deployed authoring and proof routes hydrate without client errors @deployment", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  test.skip(
    process.env.SMOKE_ALLOW_PROTECTED_SKIP === "true" &&
      (await page.getByRole("heading", { name: "Log in to Vercel" }).isVisible()),
    "Vercel preview authentication is enabled and no automation bypass secret is configured.",
  );
  await expect(page.getByRole("heading", { name: "Public predictions need proof." })).toBeVisible();

  await page.goto("/compose");
  await expect(page.getByRole("heading", { name: "Build the argument. Keep the receipts." })).toBeVisible();
  await expect(page.getByTestId("compose-auth-gate")).toBeVisible();

  await page.goto("/eva");
  await expect(page.getByRole("heading", { name: "$EVA, on Avalanche." })).toBeVisible();

  await page.goto(canonicalThesisPath);
  await expect(page.getByRole("heading", { name: "SpaceX IPO liquidity rotation" })).toBeVisible();

  expect(pageErrors, `Unexpected page errors:\n${pageErrors.join("\n")}`).toEqual([]);
  expect(consoleErrors, `Unexpected console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
});
