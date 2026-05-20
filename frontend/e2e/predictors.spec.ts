import { expect, test } from "@playwright/test";

const predictorsPayload = {
  count: 2,
  predictors: [
    {
      predictorId: "macrodesk",
      handle: "@macrodesk",
      wallet: null,
      agentId: null,
      registered: false,
      profileState: "unclaimed",
      trustScore: 50,
      openTheses: 2,
      resolvedTheses: 0,
      accuracy: null,
      avgOddsEdge: null,
      copiedTheses: 7,
      bestCategory: "Macro",
      badges: ["Unclaimed"],
    },
    {
      predictorId: "eva-agent",
      handle: "@eva_agent",
      wallet: "0x1111111111111111111111111111111111111111",
      agentId: "1599",
      registered: true,
      profileState: "registered",
      trustScore: 83,
      openTheses: 4,
      resolvedTheses: 3,
      accuracy: 67,
      avgOddsEdge: 12,
      copiedTheses: 21,
      bestCategory: "Crypto",
      badges: ["Graph-backed"],
    },
  ],
};

test("predictors page filters graph-backed and unclaimed records", async ({ page }) => {
  await page.route("**/api/predictors", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(predictorsPayload),
    });
  });

  await page.goto("/predictors");

  await expect(page.getByRole("heading", { name: "Predictor desk" })).toBeVisible();
  await expect(page.getByRole("link", { name: /@macrodesk/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /@eva_agent/i })).toBeVisible();

  await page.getByRole("button", { name: "Graph-backed" }).click();
  await expect(page.getByRole("link", { name: /@eva_agent/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /@macrodesk/i })).toHaveCount(0);

  await page.getByRole("button", { name: "Unclaimed" }).click();
  await expect(page.getByRole("link", { name: /@macrodesk/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /@eva_agent/i })).toHaveCount(0);
});
