import type { Page } from "@playwright/test";

export async function seedSelfCustodyWallet(
  page: Page,
  {
    address = "0x1111111111111111111111111111111111111111",
    xHandle = "@spacethesis",
    allowanceTransactionHash = `0x${"1".repeat(64)}`,
    retirementTransactionHash = `0x${"2".repeat(64)}`,
  }: {
    address?: string;
    xHandle?: string | null;
    allowanceTransactionHash?: string;
    retirementTransactionHash?: string;
  } = {},
) {
  await page.addInitScript(
    ({ walletAddress, publicXHandle, approveHash, retireHash }) => {
      let transactionCount = 0;
      const submittedTransactions: unknown[] = [];
      const provider = {
        request: async ({ method, params }: { method: string; params?: unknown[] | Record<string, unknown> }) => {
          if (method === "eth_accounts" || method === "eth_requestAccounts") return [walletAddress];
          if (method === "eth_chainId") return "0xa86a";
          if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") return null;
          if (method === "eth_sendTransaction") {
            submittedTransactions.push(params);
            transactionCount += 1;
            return transactionCount === 1 ? approveHash : retireHash;
          }
          throw new Error(`Unexpected test wallet method: ${method}`);
        },
        on: () => undefined,
        removeListener: () => undefined,
      };
      (window as Window & { ethereum?: unknown }).ethereum = provider;
      (window as Window & { __evaSelfCustodyTransactions?: unknown[] }).__evaSelfCustodyTransactions = submittedTransactions;
      if (publicXHandle) window.localStorage.setItem("eva.publicXHandle", publicXHandle);
      else window.localStorage.removeItem("eva.publicXHandle");
    },
    {
      walletAddress: address,
      publicXHandle: xHandle,
      approveHash: allowanceTransactionHash,
      retireHash: retirementTransactionHash,
    },
  );
}
