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
        thesis: {
          thesisId: "thesis-fed-hold",
          marketId: "fed-hold",
          authorHandle: "@macrodesk",
          authorWallet: null,
          authorAgentId: null,
          selectedOutcomeId: null,
          selectedOutcomeLabel: "Hold",
          oddsAtPost: 0.58,
          currentOdds: 0.58,
          conviction: null,
          rationale: "The next CPI print is still too sticky for a cut.",
          evidenceLinks: ["https://example.com/source"],
          sourceUrl: null,
          sourcePostUrl: null,
          counterToThesisId: null,
          copiedCount: 0,
          challengedCount: 0,
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
      }),
    });
  });

  await page.goto("/compose");

  const publishButton = page.getByRole("button", { name: "Publish thesis" });
  await expect(page.getByRole("heading", { name: "Thesis readiness" })).toBeVisible();
  await expect(publishButton).toBeDisabled();
  await expect(page.getByText("Market context needed")).toBeVisible();

  await page.getByLabel("X handle").fill("@macrodesk");
  await page.getByLabel("Existing market").selectOption("fed-hold");
  await page.getByLabel("Outcome").fill("Hold");
  await page.getByLabel("Rationale").fill("The next CPI print is still too sticky for a cut.");
  await page.getByLabel("Evidence links").fill("https://example.com/source");

  await expect(page.getByText("Ready to publish")).toBeVisible();
  await expect(publishButton).toBeEnabled();

  await publishButton.click();

  await expect(page.getByRole("heading", { name: "Hold thesis is live." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open thesis" })).toBeVisible();
});
