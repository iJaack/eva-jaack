import { expect, test } from "@playwright/test";

test("primary navigation stays focused while footer exposes secondary infrastructure", async ({ page }) => {
  await page.goto("/");

  const header = page.locator("header.topbar");
  await expect(header.getByText("reputation OS")).toBeVisible();
  await expect(header.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Markets" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Compose" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Predictors" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Blog" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Verify" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Register" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Claims" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Sources" })).toHaveCount(0);

  const footer = page.locator("footer.site-footer");
  await expect(footer.getByText("Evidence")).toBeVisible();
  await expect(footer.getByRole("link", { name: "Verify" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Claims" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Sources" })).toBeVisible();
  await expect(footer.getByText("Protocol")).toBeVisible();
  await expect(footer.getByRole("link", { name: "Register" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Notes" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Reference" })).toBeVisible();
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
