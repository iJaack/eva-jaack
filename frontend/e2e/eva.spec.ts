import { expect, test } from "@playwright/test";
import { stubEvaRpc } from "./eva-rpc";
import { seedSelfCustodyWallet } from "./self-custody-wallet";

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
  await expect(page.getByText("Connect your own wallet to read your $EVA balance.")).toBeVisible();
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
  await expect(page.locator(".eva-token-boundaries")).toContainText("Thesis 100,000 EVA");
  await expect(page.locator(".eva-token-boundaries")).toContainText("no Permit2");
  await expect(page.locator(".eva-token-boundaries")).toContainText("Staking, balance-based access, yield, governance, trade execution");
  await expect(page.getByText(/price chart|buy \$EVA|swap \$EVA/i)).toHaveCount(0);
  await expect.poll(async () =>
    page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
  ).toBe(true);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("$EVA usage burn exposes an exact-allowance wallet flow", async ({ page }) => {
  const holder = "0x1111111111111111111111111111111111111111";
  await seedSelfCustodyWallet(page, { address: holder });
  await stubEvaRpc(page, { allowance: 10n * 10n ** 18n });

  await page.goto("/eva");

  const usagePanel = page.getByTestId("eva-usage-panel");
  await expect(usagePanel.getByRole("button", { name: "Use & burn 10 EVA" })).toBeDisabled();
  await usagePanel.getByLabel("Proof reference").fill("thesis-spacex-liquidity");
  await expect(usagePanel.getByRole("button", { name: "Use & burn 10 EVA" })).toBeEnabled();
  await expect(usagePanel).toContainText("0x1111…1111 · self-custody · Avalanche");
  await usagePanel.getByRole("button", { name: "Use & burn 10 EVA" }).click();
  await expect.poll(() =>
    page.evaluate(() => {
      const transactions = (window as Window & { __evaSelfCustodyTransactions?: unknown[] }).__evaSelfCustodyTransactions;
      return transactions?.length ?? 0;
    }),
  ).toBe(1);
  const submitted = await page.evaluate(() => {
    const transactions = (window as Window & { __evaSelfCustodyTransactions?: unknown[][] }).__evaSelfCustodyTransactions;
    return transactions?.[0]?.[0] as { from?: string; to?: string; data?: string } | undefined;
  });
  expect(submitted).toMatchObject({
    from: holder,
    to: "0xFfEA6272e6C7e035FE529a226A9aA5D9cD98B296",
  });
  expect(submitted?.data).toMatch(/^0x[0-9a-f]+$/i);
  await expect(usagePanel).toContainText("10 EVA used and retired");
  await expect.poll(async () =>
    page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
  ).toBe(true);
});
