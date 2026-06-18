import { expect, test } from "@playwright/test";

test("primary navigation stays focused on the thesis product", async ({ page }) => {
  await page.goto("/");

  const header = page.locator("header.topbar");
  const isMobile = (page.viewportSize()?.width ?? 0) < 640;

  await expect(header.getByText("Eva Protocol")).toBeVisible();
  if (isMobile) {
    await expect(header.getByText("public thesis publishing")).toBeHidden();
    await header.getByRole("button", { name: "Toggle menu" }).click();
  } else {
    await expect(header.getByText("public thesis publishing")).toBeVisible();
  }

  await expect(header.getByRole("link", { name: "Markets" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Compose" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Predictors" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Evidence" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Claims" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Register" })).toHaveCount(0);

  const loop = page.locator(".participation-dock");
  if (isMobile) {
    await expect(loop.getByText("Build one public argument from markets, facts, and revisions")).toBeHidden();
  } else {
    await expect(loop.getByText("Build one public argument from markets, facts, and revisions")).toBeVisible();
  }
  await expect(loop.getByRole("link", { name: /1 Find signals/ })).toBeVisible();
  await expect(loop.getByRole("link", { name: "Start thesis" })).toBeVisible();

  const footer = page.locator("footer.site-footer");
  await expect(footer.getByText("public thesis posts built from prediction markets, facts, anchors, and revision history")).toBeVisible();
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

test("trust receipts campaign page carries measurable launch CTAs", async ({ page }) => {
  await page.goto("/campaigns/trust-receipts");

  await expect(page.getByRole("heading", { name: "prediction markets need trust receipts." })).toBeVisible();
  await expect(page.getByText("trust receipts convert better than generic prediction-market copy.")).toBeVisible();

  await expect(page.getByRole("link", { name: "Draft a thesis" })).toHaveAttribute(
    "href",
    /utm_campaign=trust_receipts_launch.*utm_content=draft_thesis/,
  );
  await expect(page.getByRole("link", { name: "Read the example" })).toHaveAttribute(
    "href",
    /utm_campaign=trust_receipts_launch.*utm_content=read_example/,
  );
  await expect(page.getByRole("link", { name: "Follow @evapredicts" })).toHaveAttribute(
    "href",
    "https://x.com/evapredicts",
  );
  await expect(page.getByRole("link", { name: "Find live signals" })).toHaveAttribute(
    "href",
    /utm_campaign=trust_receipts_launch.*utm_content=find_signals/,
  );
});
