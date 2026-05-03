import { expect, test } from "@playwright/test";

const blogSlug = "eva-mvp-evolution-prediction-reputation";

test("blog index uses product-notes framing while keeping older context", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "Notes from the prediction layer." })).toBeVisible();
  await expect(page.getByText("Product notes, protocol updates")).toBeVisible();
  await expect(page.getByRole("link", { name: /How Eva Works as a Prediction OS/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Eva’s MVP Is Now Prediction Reputation/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /What Eva Is and Where \$EVA Fits/i })).toBeVisible();
});

test("MVP evolution post renders GTM-focused sections", async ({ page }) => {
  await page.goto(`/blog/${blogSlug}`);

  await expect(page).toHaveURL(`/blog/${blogSlug}`);
  await expect(page.getByRole("heading", { name: "Eva’s MVP Is Now Prediction Reputation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What changed" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why X first" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What the MVP tests" })).toBeVisible();
});
