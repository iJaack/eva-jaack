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

const marketDetailPayload = {
  market: marketsPayload.markets[0],
  theses: [
    {
      thesisId: "thesis-fed-cut",
      slug: "fed-cut-liquidity-thesis",
      title: "Fed cut liquidity thesis",
      body: "Inflation data leaves room for one policy move.",
      author: {
        dynamicUserId: "dyn-macrodesk",
        xHandle: "@macrodesk",
        xProfileId: null,
        walletAddress: "0x1111111111111111111111111111111111111111",
        walletSource: "external",
      },
      currentRevision: {
        revisionId: "rev-fed-cut-1",
        version: 1,
        body: "Inflation data leaves room for one policy move.",
        note: "Initial thesis.",
        signalSnapshot: [],
        scoreBefore: null,
        scoreAfter: 64,
        createdAt: "2026-04-22T00:00:00.000Z",
        anchor: { status: "unanchored", txHash: null, contractAddress: null, preparedAt: null, confirmedAt: null },
      },
      revisions: [],
      signals: [
        {
          signalId: "sig-fed-cut",
          kind: "prediction_market",
          role: "core",
          title: "Will the Fed cut rates in June?",
          rationale: "Primary market signal for this evolving thesis.",
          weight: 100,
          signalScore: 64,
          addedAt: "2026-04-22T00:00:00.000Z",
          updatedAt: "2026-04-22T00:00:00.000Z",
          anchor: { status: "unanchored", txHash: null, contractAddress: null, preparedAt: null, confirmedAt: null },
          marketId: "polymarket-fed-cut",
          provider: "polymarket",
          externalId: "poly-fed-cut",
          marketUrl: "https://polymarket.com/event/fed-cut",
          selectedOutcomeId: "yes",
          selectedOutcomeLabel: "Yes",
          resolvedOutcomeLabel: null,
          oddsAtAdd: 0.41,
          currentOdds: 0.43,
          status: "open",
        },
      ],
      currentScore: 64,
      timeline: [],
      evidenceLinks: ["https://example.com/source"],
      sourceUrl: "https://example.com/source",
      sourcePostUrl: null,
      counterToThesisId: null,
      copiedCount: 3,
      challengedCount: 0,
      status: "active",
      anchor: { status: "unanchored", txHash: null, contractAddress: null, preparedAt: null, confirmedAt: null },
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

test("markets page filters source signals and keeps use-in-thesis as the primary action", async ({ page }) => {
  await page.route("**/api/markets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketsPayload),
    });
  });

  await page.goto("/markets");

  await expect(page.getByRole("heading", { name: "Signal library" })).toBeVisible();
  await expect(page.getByText("Use markets as citations inside a thesis")).toBeVisible();
  await expect(page.getByTestId("market-signal-card").filter({ hasText: "Will the Fed cut rates in June?" })).toBeVisible();
  await expect(page.getByTestId("market-signal-card").filter({ hasText: "Will CPI come in above forecast?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Use in thesis: Will the Fed cut rates in June?" })).toHaveAttribute("href", "/compose?marketId=polymarket-fed-cut");
  await expect(page.getByRole("link", { name: "Use in thesis: Will CPI come in above forecast?" })).toHaveAttribute("href", "/compose?marketId=kalshi-cpi");

  await page.getByRole("button", { name: "Kalshi" }).click();

  await expect(page.getByTestId("market-signal-card").filter({ hasText: "Will CPI come in above forecast?" })).toBeVisible();
  await expect(page.getByTestId("market-signal-card").filter({ hasText: "Will the Fed cut rates in June?" })).toHaveCount(0);
  await expect(page.getByText("Showing 1 of 2 markets")).toBeVisible();
});

test("use in thesis from the market library opens compose with the selected market", async ({ page }) => {
  await page.route("**/api/markets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketsPayload),
    });
  });

  await page.goto("/markets");
  await page.getByRole("link", { name: "Use in thesis: Will the Fed cut rates in June?" }).click();

  await expect(page).toHaveURL(/\/compose\?marketId=polymarket-fed-cut$/);
});

test("market detail content starts beside the hero on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/api/markets/polymarket-fed-cut", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketDetailPayload),
    });
  });

  await page.goto("/markets/polymarket-fed-cut");

  const hero = page.locator(".market-detail-head");
  const outcomes = page.locator(".market-outcomes");
  await expect(hero).toBeVisible();
  await expect(outcomes).toBeVisible();
  await expect.poll(async () => {
    const heroBox = await hero.boundingBox();
    const outcomesBox = await outcomes.boundingBox();
    return Boolean(heroBox && outcomesBox && outcomesBox.x > heroBox.x + heroBox.width && outcomesBox.y < 360);
  }).toBe(true);
});

test("market detail prioritizes using the market as a thesis signal", async ({ page }) => {
  await page.route("**/api/markets/polymarket-fed-cut", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketDetailPayload),
    });
  });

  await page.goto("/markets/polymarket-fed-cut");

  await expect(page.getByRole("heading", { name: "Use this market as a thesis signal" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Use in thesis" })).toHaveAttribute("href", "/compose?marketId=polymarket-fed-cut");
  await expect(page.getByRole("heading", { name: "Theses using this signal" })).toBeVisible();
});
