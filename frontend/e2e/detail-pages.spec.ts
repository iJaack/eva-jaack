import { expect, test } from "@playwright/test";

const curatorAddress = "0x1111111111111111111111111111111111111111";

test("article detail page renders on-chain article and report", async ({ page }) => {
  await page.route("**/api/article/42", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        chain: "avalanche",
        chainId: 43114,
        article: {
          id: 42,
          curator: curatorAddress,
          articleHash: "0xarticlehash",
          sourceURI: "https://example.com/article",
          requestHash: "0xrequesthash",
          evidenceURI: "ipfs://report",
          responseHash: "0xresponsehash",
          validationTag: "article",
          submittedAt: 1710000000,
          verifiedAt: 1710000600,
          verificationScore: 88,
          premium: false,
          status: 1,
        },
        reportUri: "ipfs://report",
        reportSource: "evidence-uri",
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
      }),
    });
  });

  await page.goto("/article/42");

  await expect(page.getByRole("heading", { name: "Sample article" })).toBeVisible();
  await expect(page.getByText("Claim breakdown")).toBeVisible();
  await expect(page.getByText("Avalanche is an EVM chain.")).toBeVisible();
  await expect(page.getByRole("link", { name: /0x1111/i })).toBeVisible();
});

test("curator profile renders arbitrary registered curator addresses", async ({ page }) => {
  await page.route(`**/api/curator/${curatorAddress}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        chain: "avalanche",
        chainId: 43114,
        curator: {
          address: curatorAddress,
          registered: true,
          curatorAgentId: "2001",
          selfStake: "1000000000000000000",
          delegatedStake: "500000000000000000",
          pendingSelfYield: "0",
          trustScore: 72,
          registeredAt: 1710000000,
          lastTrustUpdate: 1710000500,
          lastArticleAt: 1710000600,
          articleCount: 1,
        },
        articles: [
          {
            id: 42,
            curator: curatorAddress,
            articleHash: "0xarticlehash",
            sourceURI: "https://example.com/article",
            requestHash: "0xrequesthash",
            evidenceURI: "ipfs://report",
            responseHash: "0xresponsehash",
            validationTag: "article",
            submittedAt: 1710000000,
            verifiedAt: 1710000600,
            verificationScore: 88,
            premium: false,
            status: 1,
          },
        ],
      }),
    });
  });

  await page.goto(`/curator/${curatorAddress}`);

  await expect(page.getByRole("heading", { name: curatorAddress })).toBeVisible();
  await expect(page.getByText("Agent ID")).toBeVisible();
  await expect(page.getByText("#2001")).toBeVisible();
  await expect(page.getByText("Curated Articles")).toBeVisible();
  await expect(page.getByRole("link", { name: "View on Snowtrace →" })).toBeVisible();
});
