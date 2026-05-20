import { expect, test } from "@playwright/test";

test("verify flow renders scored report output", async ({ page }) => {
  await page.route("**/api/verify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        payment: {
          required: false,
          network: "avalanche",
          scheme: null,
          reason: "x402 is intentionally disabled in this environment.",
        },
        articleMatch: {
          articleId: 42,
          matchesExistingSubmission: true,
        },
        verification: {
          overallScore: 88,
          claimCount: 1,
          routescanClaimCount: 1,
          ipfsURI: "ipfs://report",
          report: {
            url: "https://example.com/article",
            title: "Sample article",
            claims: [
              {
                claim: {
                  text: "Avalanche is an EVM chain.",
                  type: "onchain",
                  difficulty: 3,
                },
                score: 88,
                explanation: "Confirmed against chain metadata.",
                sources: ["https://example.com/source"],
                dataSource: "routescan",
              },
            ],
            overallScore: 88,
            verifiedAt: "2026-03-24T00:00:00.000Z",
            oracleAgentId: 1599,
            routescanUsed: true,
          },
        },
      }),
    });
  });

  await page.goto("/verify");
  await page.getByPlaceholder("https://example.com/article…").fill("https://example.com/article");
  await page.getByRole("button", { name: "Check Evidence" }).click();

  await expect(page.getByText("Evidence Report")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sample article" })).toBeVisible();
  await expect(page.locator(".verify-result-card").getByText("Evidence score", { exact: true })).toBeVisible();
  await expect(page.locator(".verify-result-card").getByText("88")).toBeVisible();
  await expect(page.getByRole("link", { name: "Article #42" })).toBeVisible();
  await expect(page.getByText("Avalanche is an EVM chain.")).toBeVisible();
});
