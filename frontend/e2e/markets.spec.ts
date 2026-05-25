import { expect, test } from "@playwright/test";

const marketsPayload = {
  count: 2,
  markets: [
    {
      marketId: "polymarket-fed-cut",
      provider: "polymarket",
      externalId: "poly-fed-cut",
      url: "https://polymarket.com/event/fed-cut",
      title: "Will the Fed cut rates in June?",
      category: "Macro",
      status: "open",
      volumeUsd: 12_000_000,
      liquidityUsd: 900_000,
      closeTime: "2026-06-30T00:00:00.000Z",
      outcomes: [
        { outcomeId: "yes", label: "Yes", price: 0.41 },
        { outcomeId: "no", label: "No", price: 0.59 },
      ],
      linkedClaimIds: [],
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
    },
    {
      marketId: "kalshi-cpi",
      provider: "kalshi",
      externalId: "KXCPI",
      url: "https://kalshi.com/markets/kxcpi",
      title: "Will CPI come in above forecast?",
      category: "Macro",
      status: "open",
      volumeUsd: 7_500_000,
      liquidityUsd: 500_000,
      closeTime: "2026-05-15T00:00:00.000Z",
      outcomes: [
        { outcomeId: "yes", label: "Yes", price: 0.52 },
        { outcomeId: "no", label: "No", price: 0.48 },
      ],
      linkedClaimIds: [],
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
    },
  ],
};

test("markets page color-codes Polymarket and Kalshi provider badges", async ({ page }) => {
  await page.route("**/api/markets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketsPayload),
    });
  });

  await page.goto("/markets");

  const polymarketCard = page.locator(".market-provider-polymarket");
  const kalshiCard = page.locator(".market-provider-kalshi");

  await expect(polymarketCard.getByText("Polymarket")).toBeVisible();
  await expect(kalshiCard.getByText("Kalshi")).toBeVisible();
  await expect(polymarketCard.locator(".provider-badge")).toHaveCSS("border-radius", "4px");
  await expect(kalshiCard.locator(".provider-badge")).toHaveCSS("border-radius", "4px");
});

test("markets page filters by provider without losing the market desk context", async ({ page }) => {
  await page.route("**/api/markets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketsPayload),
    });
  });

  await page.goto("/markets");

  await expect(page.getByRole("heading", { name: "Live market desk" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Will the Fed cut rates in June/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Will CPI come in above forecast/i })).toBeVisible();

  await page.getByRole("button", { name: "Kalshi" }).click();

  await expect(page.getByRole("link", { name: /Will CPI come in above forecast/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Will the Fed cut rates in June/i })).toHaveCount(0);
  await expect(page.getByText("Showing 1 of 2 markets")).toBeVisible();
});
