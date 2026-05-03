import { expect, test, type Page } from "@playwright/test";

const walletAddress = "0x1111111111111111111111111111111111111111";

function registrationPayload() {
  return {
    ready: true,
    walletAddress,
    agentId: "2001",
    stakeAmount: "1000000000000000000",
    stakeAmountEva: "1",
    minStakeEva: "1",
    chain: "avalanche",
    chainId: 43114,
    contracts: {
      evaToken: "0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672",
      evaTrustGraph: "0xE84DdD5A03Fa4210c4217436afD2556B348A40a0",
      erc8004Identity: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    },
    needsApproval: true,
    currentAllowanceEva: "0",
    transactions: [
      {
        to: "0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672",
        data: "0xapprove",
        description: "Approve EvaTrustGraph to spend 1 EVA",
      },
      {
        to: "0xE84DdD5A03Fa4210c4217436afD2556B348A40a0",
        data: "0xregister",
        description: "Register as curator with agentId=2001, stake=1 EVA",
      },
    ],
  };
}

async function mockSharedApi(page: Page) {
  await page.route("**/api/analytics/onboarding", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });

  await page.route("**/api/curator/register", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(registrationPayload()),
    });
  });
}

test("curator onboarding shows honest no-wallet fallback after preflight", async ({ page }) => {
  await mockSharedApi(page);
  await page.goto("/curators/register");

  await page.getByPlaceholder("0x...").fill(walletAddress);
  await page.getByPlaceholder("Your ERC-8004 agent ID").fill("2001");
  await page.getByRole("button", { name: "Run preflight" }).click();

  await expect(page.getByText("Wallet and identity checks passed")).toBeVisible();
  await expect(page.getByText("No injected wallet in this browser.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Broadcast prepared transactions" })).toBeDisabled();
});

test("curator onboarding supports injected wallet broadcast flow", async ({ page }) => {
  await page.addInitScript((address) => {
    const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
    let txNonce = 0;

    const provider = {
      request: async ({ method }: { method: string }) => {
        switch (method) {
          case "eth_accounts":
          case "eth_requestAccounts":
            return [address];
          case "eth_chainId":
            return "0xa86a";
          case "wallet_switchEthereumChain":
          case "wallet_addEthereumChain":
            return null;
          case "eth_sendTransaction":
            txNonce += 1;
            return `0x${String(txNonce).padStart(64, "0")}`;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      },
      on: (event: string, listener: (...args: unknown[]) => void) => {
        listeners[event] ??= [];
        listeners[event].push(listener);
      },
      removeListener: (event: string, listener: (...args: unknown[]) => void) => {
        listeners[event] = (listeners[event] ?? []).filter((entry) => entry !== listener);
      },
      isMetaMask: true,
    };

    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: provider,
    });
  }, walletAddress);

  await mockSharedApi(page);
  await page.route("https://avalanche-c-chain-rpc.publicnode.com/**", async (route) => {
    const payload = route.request().postDataJSON();

    const resolveCall = (call: { id: number; method: string; params?: unknown[] }) => {
      switch (call.method) {
        case "eth_chainId":
          return "0xa86a";
        case "eth_blockNumber":
          return "0x1";
        case "eth_getTransactionReceipt":
          return {
            transactionHash: call.params?.[0],
            transactionIndex: "0x0",
            blockHash: "0x1",
            blockNumber: "0x1",
            from: walletAddress,
            to: "0xE84DdD5A03Fa4210c4217436afD2556B348A40a0",
            cumulativeGasUsed: "0x5208",
            gasUsed: "0x5208",
            contractAddress: null,
            logs: [],
            logsBloom: `0x${"0".repeat(512)}`,
            status: "0x1",
            effectiveGasPrice: "0x1",
            type: "0x2",
          };
        case "eth_getTransactionByHash":
          return {
            hash: call.params?.[0],
            blockHash: "0x1",
            blockNumber: "0x1",
            from: walletAddress,
            to: "0xE84DdD5A03Fa4210c4217436afD2556B348A40a0",
            transactionIndex: "0x0",
          };
        default:
          return null;
      }
    };

    if (Array.isArray(payload)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          payload.map((call) => ({
            jsonrpc: "2.0",
            id: call.id,
            result: resolveCall(call),
          })),
        ),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: payload.id,
        result: resolveCall(payload),
      }),
    });
  });

  await page.goto("/curators/register");
  await page.getByPlaceholder("Your ERC-8004 agent ID").fill("2001");
  await page.getByRole("button", { name: "Run preflight" }).click();

  await expect(page.getByText("Wallet and identity checks passed")).toBeVisible();
  await expect(page.getByRole("button", { name: "Broadcast prepared transactions" })).toBeEnabled();

  await page.getByRole("button", { name: "Broadcast prepared transactions" }).click();

  await expect(page.getByText("Confirmed on Avalanche")).toHaveCount(2);
});
