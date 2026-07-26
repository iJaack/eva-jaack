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
      slug: "fed-hold-liquidity-thesis",
      title: "Fed hold liquidity thesis",
      body: "Inflation prints are not soft enough for a cut, so liquidity remains tight.",
      author: {
        dynamicUserId: "dyn-macrodesk",
        xHandle: "@macrodesk",
        xProfileId: null,
        walletAddress: "0x1111111111111111111111111111111111111111",
        walletSource: "external",
      },
      currentRevision: {
        revisionId: "rev-fed-hold-1",
        version: 1,
        body: "Inflation prints are not soft enough for a cut, so liquidity remains tight.",
        note: "Initial thesis.",
        signalSnapshot: [],
        scoreBefore: null,
        scoreAfter: 68,
        createdAt: "2026-04-22T00:00:00.000Z",
        anchor: { status: "unanchored", txHash: null, contractAddress: null, preparedAt: null, confirmedAt: null },
      },
      revisions: [],
      signals: [
        {
          signalId: "sig-fed-hold",
          kind: "prediction_market",
          role: "core",
          title: "Will the Fed hold rates at the next meeting?",
          rationale: "Primary macro signal.",
          weight: 100,
          signalScore: 68,
          addedAt: "2026-04-22T00:00:00.000Z",
          updatedAt: "2026-04-22T00:00:00.000Z",
          anchor: { status: "unanchored", txHash: null, contractAddress: null, preparedAt: null, confirmedAt: null },
          marketId: "fed-hold",
          provider: "external",
          externalId: "fed-hold",
          marketUrl: "https://example.com/market/fed-hold",
          selectedOutcomeId: "hold",
          selectedOutcomeLabel: "Hold",
          resolvedOutcomeLabel: null,
          oddsAtAdd: 0.44,
          currentOdds: 0.58,
          status: "open",
        },
      ],
      currentScore: 68,
      timeline: [],
      evidenceLinks: ["https://example.com/source"],
      sourceUrl: "https://example.com/source",
      sourcePostUrl: null,
      counterToThesisId: null,
      copiedCount: 7,
      challengedCount: 1,
      status: "active",
      anchor: { status: "unanchored", txHash: null, contractAddress: null, preparedAt: null, confirmedAt: null },
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
      badges: ["Record-only", "Evidence-backed"],
    },
  ],
};

test("homepage leads with an inspectable proof ledger", async ({ page }) => {
  await page.route("**/api/prediction-summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(summaryPayload),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Public predictions need proof." })).toBeVisible();
  await expect(page.getByText("Eva turns market theses into inspectable records")).toBeVisible();
  await expect(page.getByRole("link", { name: "Read proof thesis" })).toHaveAttribute(
    "href",
    /utm_campaign=protocol_proof.*utm_content=spacex_proof_record/,
  );
  await expect(page.getByRole("heading", { name: "Fed hold liquidity thesis" })).toBeVisible();
  await expect(page.getByText("Revision v1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "One argument. Every receipt." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Forecasts ready to become citations." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The argument stays readable. The provenance stays attached." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Follow the record, not the confidence." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "$EVA is used for public proof receipts." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Inspect $EVA" })).toHaveAttribute("href", "/eva");
  await expect(page.getByText("Wallet → platform use → dead-address burn → receipt")).toBeVisible();
});

test("homepage source tape routes a forecast into its market receipt", async ({ page }) => {
  await page.route("**/api/prediction-summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(summaryPayload),
    });
  });
  await page.goto("/");

  const sourceLink = page.getByRole("link", { name: /Will the Fed hold rates at the next meeting\?/ });
  await expect(sourceLink).toHaveAttribute("href", "/markets/fed-hold");
  await sourceLink.click();
  await expect(page).toHaveURL(/\/markets\/fed-hold$/);
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

  await expect(page.getByText("Proof object unavailable")).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse source library" })).toHaveAttribute("href", "/markets");
  await expect(page.getByText("No markets loaded.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "$EVA is used for public proof receipts." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Follow the record, not the confidence." })).toHaveCount(0);
});

test("desktop homepage keeps proof, source, and token ledgers inside the page width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/api/prediction-summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(summaryPayload),
    });
  });

  await page.goto("/");

  const proofLedger = page.locator(".eva-record-section");
  const tokenLedger = page.locator(".eva-home-token");
  const footer = page.locator("footer.site-footer");

  await expect(proofLedger).toBeVisible();
  await expect(tokenLedger).toBeVisible();
  await expect(footer).toBeVisible();
  await expect.poll(async () => {
    const productBox = await tokenLedger.boundingBox();
    const footerBox = await footer.boundingBox();
    return Boolean(productBox && footerBox && footerBox.y > productBox.y);
  }).toBe(true);
  await expect.poll(async () => {
    return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  }).toBe(true);
});

test("desktop homepage keeps primary actions inside the page width at 1280px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.route("**/api/prediction-summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(summaryPayload),
    });
  });

  await page.goto("/");

  const proofLink = page.getByRole("link", { name: "Read proof thesis" });
  const tokenLink = page.getByRole("link", { name: "Inspect $EVA" });
  await expect(proofLink).toBeInViewport();
  await tokenLink.scrollIntoViewIfNeeded();
  await expect(tokenLink).toBeInViewport();
  await expect.poll(async () => {
    return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  }).toBe(true);
});
