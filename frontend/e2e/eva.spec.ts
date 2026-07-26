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
  const relationship = page.locator(".eva-token-sequence");
  await expect(relationship).toContainText("Wallet");
  await expect(relationship).toContainText("$EVA balance");
  await expect(relationship).toContainText("Author record");
  await expect(relationship).toContainText("Thesis proof");
  await expect(page.locator(".eva-token-boundaries")).toContainText("Staking, gating, yield, governance, trade execution");
  await expect(page.getByText(/price chart|buy \$EVA|swap \$EVA/i)).toHaveCount(0);
  await expect.poll(async () =>
    page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
  ).toBe(true);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
