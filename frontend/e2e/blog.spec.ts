import { expect, test } from "@playwright/test";

const blogSlug = "what-eva-is-and-where-eva-fits";

test("homepage teaser links through blog index to the seeded post", async ({ page }) => {
  await page.route("**/api/article**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        count: 0,
        chain: "avalanche",
        chainId: 43114,
        articles: [],
      }),
    });
  });

  await page.route("**/api/curators**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        count: 0,
        chain: "avalanche",
        chainId: 43114,
        curators: [],
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByText("One plain-English note on Eva")).toBeVisible();
  await expect(page.getByRole("link", { name: "View blog" })).toBeVisible();
  await expect(page.getByRole("link", { name: /What Eva Is and Where \$EVA Fits/i })).toBeVisible();

  await page.getByRole("link", { name: "View blog" }).click();

  await expect(page).toHaveURL("/blog");
  await expect(page.getByRole("heading", { name: "Notes from the trust graph." })).toBeVisible();
  await expect(page.getByRole("link", { name: /What Eva Is and Where \$EVA Fits/i })).toBeVisible();

  await page.goto(`/blog/${blogSlug}`);

  await expect(page).toHaveURL(`/blog/${blogSlug}`);
  await expect(page.getByRole("heading", { name: "What Eva Is and Where $EVA Fits" })).toBeVisible();
  await expect(page.getByText("Eva in simple terms")).toBeVisible();
  await expect(page.getByText("How trust works")).toBeVisible();
  await expect(page.getByText("What $EVA does")).toBeVisible();
});
