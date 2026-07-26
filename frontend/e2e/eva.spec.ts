import { expect, test } from "@playwright/test";
import { stubEvaRpc } from "./eva-rpc";

test("$EVA is a live, bounded core platform surface", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await stubEvaRpc(page);

  await page.goto("/eva");

  await expect(page.getByRole("heading", { name: "$EVA, on Avalanche." })).toBeVisible();
  const receipt = page.getByTestId("eva-token-receipt");
  await expect(receipt).toContainText("evajaack");
  await expect(receipt).toContainText("10,000,000,000 EVA");
  await expect(receipt).toContainText("0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672");
  await expect(page.getByText("Connect to read your $EVA balance.")).toBeVisible();
  await expect(page.getByText("1,000,000 EVA")).toBeVisible();
  const usagePanel = page.getByTestId("eva-usage-panel");
  await expect(usagePanel).toContainText("Dead-address burn");
  await expect(usagePanel).toContainText("0 EVA");
  await expect(usagePanel).toContainText("legacy token's reported total supply does not decrease");
  await expect(usagePanel).toContainText("cannot guarantee");
  const relationship = page.locator(".eva-token-sequence");
  await expect(relationship).toContainText("Wallet");
  await expect(relationship).toContainText("$EVA balance");
  await expect(relationship).toContainText("Platform use");
  await expect(relationship).toContainText("Burn receipt");
  await expect(page.locator(".eva-token-boundaries")).toContainText("Staking, gating, yield, governance, trade execution");
  await expect(page.getByText(/price chart|buy \$EVA|swap \$EVA/i)).toHaveCount(0);
  await expect.poll(async () =>
    page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
  ).toBe(true);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("$EVA usage burn exposes an exact-allowance wallet flow", async ({ page }) => {
  const holder = "0x1111111111111111111111111111111111111111";
  await page.addInitScript((walletAddress) => {
    (window as Window & { __evaDynamicContext?: unknown }).__evaDynamicContext = {
      primaryWallet: {
        address: walletAddress,
        getWalletClient: async () => ({
          chain: { id: 43_114 },
          switchChain: async () => undefined,
          writeContract: async () => `0x${"1".repeat(64)}`,
        }),
      },
      user: { userId: "eva-holder" },
    };
  }, holder);
  await stubEvaRpc(page, { allowance: 10n * 10n ** 18n });

  await page.goto("/eva");

  const usagePanel = page.getByTestId("eva-usage-panel");
  await expect(usagePanel.getByRole("button", { name: "Use & burn 10 EVA" })).toBeDisabled();
  await usagePanel.getByLabel("Proof reference").fill("thesis-spacex-liquidity");
  await expect(usagePanel.getByRole("button", { name: "Use & burn 10 EVA" })).toBeEnabled();
  await expect(usagePanel).toContainText("0x1111…1111 · Avalanche");
  await expect.poll(async () =>
    page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
  ).toBe(true);
});
