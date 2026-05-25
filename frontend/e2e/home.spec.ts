import { expect, test } from "@playwright/test";

const summaryPayload = {
  stats: {
    marketCount: 2,
    openThesisCount: 2,
    weeklyActivePredictors: 2,
    copiedThesisEvents: 7,
  },
  markets: [
    {
      marketId: "fed-hold",
      provider: "external",
      externalId: "fed-hold",
      url: "https://example.com/market/fed-hold",
      title: "Will the Fed hold rates at the next meeting?",
      category: "Macro",
      status: "open",
      volumeUsd: 1000000,
      liquidityUsd: 250000,
      closeTime: "2026-06-17T18:00:00.000Z",
      outcomes: [
        { outcomeId: "hold", label: "Hold", price: 0.58 },
        { outcomeId: "cut", label: "Cut", price: 0.29 },
      ],
      linkedClaimIds: [],
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
    },
    {
      marketId: "btc-110k",
      provider: "external",
      externalId: "btc-110k",
      url: "https://example.com/market/btc-110k",
      title: "Will Bitcoin trade above $110k before this market closes?",
      category: "Crypto",
      status: "open",
      volumeUsd: 900000,
      liquidityUsd: 200000,
      closeTime: "2026-06-30T23:59:59.000Z",
      outcomes: [
        { outcomeId: "yes", label: "Yes", price: 0.37 },
        { outcomeId: "no", label: "No", price: 0.63 },
      ],
      linkedClaimIds: [],
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
    },
  ],
  theses: [
    {
      thesisId: "thesis-fed-hold",
      marketId: "fed-hold",
      authorHandle: "@macrodesk",
      authorWallet: null,
      authorAgentId: null,
      selectedOutcomeId: "hold",
      selectedOutcomeLabel: "Hold",
      oddsAtPost: 0.44,
      currentOdds: 0.58,
      conviction: 68,
      rationale: "Inflation prints are not soft enough for a cut.",
      evidenceLinks: ["https://example.com/source"],
      sourceUrl: "https://example.com/source",
      sourcePostUrl: null,
      counterToThesisId: null,
      copiedCount: 7,
      challengedCount: 1,
      status: "open",
      resolution: {
        correct: null,
        resolvedOutcomeId: null,
        resolvedAt: null,
        oddsEdge: null,
        reputationImpact: "pending",
        summary: null,
      },
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
    },
  ],
  predictors: [
    {
      predictorId: "macrodesk",
      handle: "@macrodesk",
      wallet: null,
      agentId: null,
      registered: false,
      profileState: "unclaimed",
      trustScore: 50,
      openTheses: 1,
      resolvedTheses: 0,
      accuracy: null,
      avgOddsEdge: null,
      copiedTheses: 7,
      bestCategory: "Macro",
      badges: ["Unclaimed", "Evidence-backed"],
    },
  ],
};

test("homepage leads with the prediction workbench layout", async ({ page }) => {
  await page.route("**/api/prediction-summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(summaryPayload),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Play the truth loop." })).toBeVisible();
  await expect(page.getByText("Pick a market, publish a call, attach evidence")).toBeVisible();
  await expect(page.getByRole("heading", { name: "One loop, four actions" })).toBeVisible();
  await expect(page.getByRole("link", { name: /01 Pick a market/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /02 Publish or counter/i })).toBeVisible();
  await expect(page.getByText("players this week")).toBeVisible();
  await expect(page.getByText("Market tape")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scan what moved first" })).toBeVisible();
  await expect(page.getByText("active predictors")).toBeVisible();
  await expect(page.getByText("copied theses")).toBeVisible();
  await expect(page.getByText("Featured thesis")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Inspect the live argument" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Where the network is focused" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reputation context" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reasoning layers" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Markets", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Theses", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Predictors", exact: true })).toBeVisible();
});

test("copy thesis button shows pending state and announces the result", async ({ page }) => {
  await page.route("**/api/prediction-summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(summaryPayload),
    });
  });
  await page.route("**/api/copy-preview*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        thesisId: "thesis-fed-hold",
        marketId: "fed-hold",
        selectedOutcomeId: "hold",
        selectedOutcomeLabel: "Hold",
        originalOdds: 0.44,
        currentOdds: 0.58,
        venueUrl: "https://example.com/market/fed-hold",
        execution: "external-link-only",
        warning: "Eva records copy intent only; execute on the external venue.",
      }),
    });
  });

  await page.goto("/");

  const copyButton = page.getByRole("button", { name: "Preview Copy" });
  await copyButton.click();

  await expect(page.getByRole("button", { name: "Preparing…" })).toBeDisabled();
  await expect(page.getByRole("status")).toHaveText("External venue opened as preview.");
});

test("homepage renders compact empty states when prediction summary has no records", async ({ page }) => {
  await page.route("**/api/prediction-summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        stats: {
          marketCount: 0,
          openThesisCount: 0,
          weeklyActivePredictors: 0,
          copiedThesisEvents: 0,
        },
        markets: [],
        theses: [],
        predictors: [],
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "No Featured Thesis" })).toBeVisible();
  await expect(page.getByText("Publish a thesis to create the first featured market record.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "No Markets Loaded" })).toBeVisible();
  await expect(page.getByText("Refresh or check the API connection.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "No Predictors Yet" })).toBeVisible();
  await expect(page.getByText("Published theses will create predictor records.")).toBeVisible();
});

test("desktop homepage keeps shared product sections in the main grid", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/api/prediction-summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(summaryPayload),
    });
  });

  await page.goto("/");

  const productSystem = page.locator(".product-system");
  const footer = page.locator("footer.site-footer");
  const marketStrip = page.locator(".mobile-strip");

  await expect(productSystem).toBeVisible();
  await expect(footer).toBeVisible();
  await expect.poll(async () => {
    const productBox = await productSystem.boundingBox();
    const footerBox = await footer.boundingBox();
    return Boolean(productBox && footerBox && footerBox.y > productBox.y);
  }).toBe(true);
  await expect.poll(async () => {
    return marketStrip.evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
  }).toBe(true);
});
