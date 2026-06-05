import { expect, test } from "@playwright/test";

const marketsPayload = {
  count: 1,
  markets: [
    {
      marketId: "fed-hold",
      provider: "external",
      externalId: "fed-hold",
      url: "https://example.com/market/fed-hold",
      title: "Will the Fed hold rates at the next meeting?",
      category: "Macro",
      status: "open",
      volumeUsd: 1_000_000,
      liquidityUsd: 250_000,
      closeTime: "2026-06-17T18:00:00.000Z",
      outcomes: [
        { outcomeId: "hold", label: "Hold", price: 0.58 },
        { outcomeId: "cut", label: "Cut", price: 0.29 },
      ],
      linkedClaimIds: [],
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
    },
  ],
};

test("compose page guides required thesis inputs before enabling publish", async ({ page }) => {
  await page.route("**/api/markets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketsPayload),
    });
  });

  await page.route("**/api/theses", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        created: true,
        thesis: {
          thesisId: "thesis-fed-hold",
          slug: "fed-hold-liquidity-thesis",
          title: "Fed hold liquidity thesis",
          body: "The next CPI print is still too sticky for a cut.",
          author: {
            dynamicUserId: "local-dynamic-preview",
            xHandle: "@spacethesis",
            xProfileId: "local-x-preview",
            walletAddress: "0x0fE61780BD5508b3C99E420662050E5560608cA4",
            walletSource: "embedded",
          },
          currentRevision: {
            revisionId: "rev-fed-hold-1",
            version: 1,
            body: "The next CPI print is still too sticky for a cut.",
            note: "Thesis published with initial signal basket.",
            signalSnapshot: [],
            scoreBefore: null,
            scoreAfter: 50,
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
              rationale: "Primary market signal for this evolving thesis.",
              weight: 60,
              signalScore: 50,
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
              oddsAtAdd: 0.58,
              currentOdds: 0.58,
              status: "open",
            },
          ],
          currentScore: 50,
          timeline: [],
          evidenceLinks: ["https://example.com/source"],
          sourceUrl: null,
          sourcePostUrl: null,
          counterToThesisId: null,
          copiedCount: 0,
          challengedCount: 0,
          status: "active",
          anchor: { status: "unanchored", txHash: null, contractAddress: null, preparedAt: null, confirmedAt: null },
          createdAt: "2026-04-22T00:00:00.000Z",
          updatedAt: "2026-04-22T00:00:00.000Z",
        },
        markets: marketsPayload.markets,
      }),
    });
  });

  await page.goto("/compose");

  const publishButton = page.getByRole("button", { name: "Publish thesis" });
  await expect(page.getByRole("heading", { name: "Build an evolving thesis." })).toBeVisible();
  await expect(publishButton).toBeEnabled();
  await page.getByLabel("Thesis title").fill("");
  await expect(publishButton).toBeDisabled();

  await page.getByLabel("Thesis title").fill("Fed hold liquidity thesis");
  await page.getByLabel("Thesis body").fill("The next CPI print is still too sticky for a cut.");
  await page.getByLabel("Primary market signal").selectOption("fed-hold");
  await page.getByLabel("Outcome").fill("Hold");
  await page.getByLabel("Lateral fact signal").fill("CPI is still running above target.");
  await page.getByLabel("Fact source URL").fill("https://example.com/source");

  await expect(publishButton).toBeEnabled();

  await publishButton.click();

  await expect(page.getByRole("heading", { name: "Fed hold liquidity thesis" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open thesis" })).toBeVisible();
});
