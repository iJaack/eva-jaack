export const EthereumWalletConnectors = [];

export function isEthereumWallet(wallet: unknown): wallet is {
  address: string;
  getWalletClient: () => Promise<unknown>;
} {
  return Boolean(
    wallet &&
    typeof wallet === "object" &&
    "address" in wallet &&
    "getWalletClient" in wallet &&
    typeof wallet.getWalletClient === "function",
  );
}
