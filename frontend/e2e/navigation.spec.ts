import { expect, test } from "@playwright/test";

test("primary navigation stays focused while footer exposes secondary infrastructure", async ({ page }) => {
  await page.goto("/");

  const header = page.locator("header.topbar");
  await expect(header.getByText("prediction desk")).toBeVisible();
  await expect(header.getByRole("link", { name: "Markets" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Compose" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Evidence" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Predictors" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Claims" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Register" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Sources" })).toHaveCount(0);

  const footer = page.locator("footer.site-footer");
  await expect(footer.getByText("market reasoning, evidence, reputation")).toBeVisible();
  await expect(footer.getByRole("link", { name: "Verify" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Claims" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Reference" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Register" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "GitHub" })).toBeVisible();
});

test("skip link appears on keyboard focus and targets the main content", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to Content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeVisible();
});
