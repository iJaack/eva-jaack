import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalanche } from "viem/chains";
import { getEvalancheSigner, getSignerKey } from "../src/services/signing.js";

const expectedSigner = "0x0fe61780bd5508b3C99e420662050e5560608cA4";
const defaultApiBase = "https://api.eva.jaack.me/api";
const defaultThesisId = "thesis-0fdef25794b38b6e8eed7524";
const rpcUrl = process.env.AVALANCHE_RPC_URL ?? "https://api.avax.network/ext/bc/C/rpc";
const shouldBroadcast = process.argv.includes("--broadcast");

type PreparedAnchorResponse = {
  thesisId: string;
  anchorStatus: string;
  transactions: Array<{
    to: `0x${string}`;
    data: Hex;
    description: string;
  }>;
};

function argValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function normalizeApiBase(value: string): string {
  return value.replace(/\/$/, "");
}

function assertExpectedAddress(address: string) {
  if (address.toLowerCase() !== expectedSigner.toLowerCase()) {
    throw new Error(`Evalanche resolved ${address}, expected ${expectedSigner}`);
  }
}

async function fetchPreparedTransactions(apiBase: string, thesisId: string): Promise<PreparedAnchorResponse> {
  const response = await fetch(`${apiBase}/theses/${encodeURIComponent(thesisId)}/protocol/prepare-anchor`, {
    method: "POST",
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body?.error ?? text}`);
  }
  return body as PreparedAnchorResponse;
}

const apiBase = normalizeApiBase(argValue("--api-base") ?? defaultApiBase);
const thesisId = argValue("--thesis-id") ?? defaultThesisId;
const startIndex = Number.parseInt(argValue("--start-index") ?? "1", 10);
if (!Number.isInteger(startIndex) || startIndex < 1) {
  throw new Error("--start-index must be a 1-based positive integer");
}
const [signer, privateKey, prepared] = await Promise.all([
  getEvalancheSigner(),
  getSignerKey(),
  fetchPreparedTransactions(apiBase, thesisId),
]);

assertExpectedAddress(signer.address);
const account = privateKeyToAccount(privateKey);
assertExpectedAddress(account.address);

const publicClient = createPublicClient({
  chain: avalanche,
  transport: http(rpcUrl),
});
const walletClient = createWalletClient({
  account,
  chain: avalanche,
  transport: http(rpcUrl),
});

const chainId = await publicClient.getChainId();
if (chainId !== 43114) {
  throw new Error(`Expected Avalanche mainnet chain id 43114, got ${chainId}`);
}

console.log(
  JSON.stringify(
    {
      apiBase,
      thesisId: prepared.thesisId,
      signer: account.address,
      secretsSource: signer.secretsSource,
      anchorStatus: prepared.anchorStatus,
      transactionCount: prepared.transactions.length,
      startIndex,
      dryRun: !shouldBroadcast,
    },
    null,
    2,
  ),
);

if (!shouldBroadcast) {
  for (const [index, transaction] of prepared.transactions.entries()) {
    console.log(`${index + 1}. ${transaction.description} -> ${transaction.to}`);
  }
  console.log("Dry run complete. Pass --broadcast to send transactions.");
  process.exit(0);
}

const receipts = [];
const transactions = prepared.transactions.slice(startIndex - 1);
for (const [offset, transaction] of transactions.entries()) {
  const index = startIndex - 1 + offset;
  const estimatedGas = await publicClient.estimateGas({
    account,
    to: transaction.to,
    data: transaction.data,
  });
  const gas = estimatedGas * 2n > 350_000n ? estimatedGas * 2n : 350_000n;
  const hash = await walletClient.sendTransaction({
    account,
    chain: avalanche,
    to: transaction.to,
    data: transaction.data,
    gas,
  });
  console.log(`${index + 1}/${prepared.transactions.length} ${transaction.description}: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Anchor transaction failed: ${hash}`);
  }
  receipts.push({
    description: transaction.description,
    hash,
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
  });
}

console.log(JSON.stringify({ thesisId: prepared.thesisId, receipts }, null, 2));
