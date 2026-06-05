import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  getContractAddress,
  http,
  type Abi,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalanche } from "viem/chains";
import { getEvalancheSigner, getSignerKey } from "../src/services/signing.js";

const expectedDeployer = "0x0fe61780bd5508b3C99e420662050e5560608cA4";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rpcUrl = process.env.AVALANCHE_RPC_URL ?? "https://api.avax.network/ext/bc/C/rpc";
const shouldBroadcast = process.argv.includes("--broadcast");

type Artifact = {
  abi: Abi;
  bytecode: {
    object: Hex;
  };
};

async function readArtifact(relativePath: string): Promise<Artifact> {
  const raw = await readFile(path.join(repoRoot, relativePath), "utf8");
  return JSON.parse(raw) as Artifact;
}

function assertExpectedAddress(address: string) {
  if (address.toLowerCase() !== expectedDeployer.toLowerCase()) {
    throw new Error(`Evalanche resolved ${address}, expected ${expectedDeployer}`);
  }
}

const [signer, privateKey, thesisArtifact, proxyArtifact] = await Promise.all([
  getEvalancheSigner(),
  getSignerKey(),
  readArtifact("contracts/out/EvaThesisProtocol.sol/EvaThesisProtocol.json"),
  readArtifact("contracts/out/ERC1967Proxy.sol/ERC1967Proxy.json"),
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

const nonce = await publicClient.getTransactionCount({ address: account.address });
const balance = await publicClient.getBalance({ address: account.address });
const implementationAddress = getContractAddress({ from: account.address, nonce });
const proxyAddress = getContractAddress({ from: account.address, nonce: nonce + 1 });

console.log(
  JSON.stringify(
    {
      signer: account.address,
      secretsSource: signer.secretsSource,
      nonce,
      balanceWei: balance.toString(),
      predictedImplementation: implementationAddress,
      predictedProxy: proxyAddress,
      dryRun: !shouldBroadcast,
    },
    null,
    2,
  ),
);

const existingProxyCode = await publicClient.getCode({ address: proxyAddress });
if (existingProxyCode) {
  throw new Error(`Predicted proxy ${proxyAddress} already has code`);
}

if (!shouldBroadcast) {
  console.log("Dry run complete. Pass --broadcast to deploy.");
  process.exit(0);
}

const implementationHash = await walletClient.deployContract({
  abi: thesisArtifact.abi,
  bytecode: thesisArtifact.bytecode.object,
  account,
  chain: avalanche,
});
console.log(`implementation tx: ${implementationHash}`);
const implementationReceipt = await publicClient.waitForTransactionReceipt({ hash: implementationHash });
if (implementationReceipt.status !== "success") {
  throw new Error(`Implementation deployment failed: ${implementationHash}`);
}
if (implementationReceipt.contractAddress?.toLowerCase() !== implementationAddress.toLowerCase()) {
  throw new Error(`Implementation deployed to ${implementationReceipt.contractAddress}, expected ${implementationAddress}`);
}

const initData = encodeFunctionData({
  abi: thesisArtifact.abi,
  functionName: "initialize",
  args: [expectedDeployer, expectedDeployer],
});
const proxyHash = await walletClient.deployContract({
  abi: proxyArtifact.abi,
  bytecode: proxyArtifact.bytecode.object,
  args: [implementationAddress, initData],
  account,
  chain: avalanche,
});
console.log(`proxy tx: ${proxyHash}`);
const proxyReceipt = await publicClient.waitForTransactionReceipt({ hash: proxyHash });
if (proxyReceipt.status !== "success") {
  throw new Error(`Proxy deployment failed: ${proxyHash}`);
}
if (proxyReceipt.contractAddress?.toLowerCase() !== proxyAddress.toLowerCase()) {
  throw new Error(`Proxy deployed to ${proxyReceipt.contractAddress}, expected ${proxyAddress}`);
}

console.log(
  JSON.stringify(
    {
      implementation: implementationAddress,
      implementationTx: implementationHash,
      proxy: proxyAddress,
      proxyTx: proxyHash,
    },
    null,
    2,
  ),
);
