import { expect, test } from "@playwright/test";

test("primary navigation stays focused on the thesis product", async ({ page }) => {
  await page.goto("/");

  const header = page.locator("header.topbar");
  const isMobile = (page.viewportSize()?.width ?? 0) < 640;

  await expect(header.getByText("Eva Protocol")).toBeVisible();
  if (isMobile) {
    await expect(header.getByText("prediction desk")).toBeHidden();
    await header.getByRole("button", { name: "Toggle menu" }).click();
  } else {
    await expect(header.getByText("prediction desk")).toBeVisible();
  }

  await expect(header.getByRole("link", { name: "Markets" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Compose" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Predictors" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Evidence" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Claims" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Register" })).toHaveCount(0);

  const loop = page.locator(".participation-dock");
  if (isMobile) {
    await expect(loop.getByText("Find signals · write thesis · track history · build record")).toBeHidden();
  } else {
    await expect(loop.getByText("Find signals · write thesis · track history · build record")).toBeVisible();
  }
  await expect(loop.getByRole("link", { name: /1 Find/ })).toBeVisible();
  await expect(loop.getByRole("link", { name: "Start thesis" })).toBeVisible();

  const footer = page.locator("footer.site-footer");
  await expect(footer.getByText("publish evolving thesis posts from prediction markets and facts")).toBeVisible();
  await expect(footer.getByRole("link", { name: "Markets" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Compose" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Predictors" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Verify" })).toHaveCount(0);
  await expect(footer.getByRole("link", { name: "Claims" })).toHaveCount(0);
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
