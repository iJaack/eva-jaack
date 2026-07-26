import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  createWalletClient,
  getAddress,
  getContractAddress,
  http,
  type Abi,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalanche } from "viem/chains";
import { getEvalancheSigner, getSignerKey } from "../src/services/signing.js";

const expectedSigner = "0x0fe61780bd5508b3C99e420662050e5560608cA4";
const expectedVersion = 2;
const implementationSlot =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc" as const;
const defaultAdminRole = `0x${"00".repeat(32)}` as Hex;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rpcUrl = process.env.AVALANCHE_RPC_URL ?? "https://api.avax.network/ext/bc/C/rpc";
const shouldBroadcast = process.argv.includes("--broadcast");

type Artifact = {
  abi: Abi;
  bytecode: {
    object: Hex;
  };
};

type ProtocolConfig = {
  contracts: {
    evaThesisProtocol: Address;
  };
};

function argValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function assertExpectedAddress(address: string): void {
  if (address.toLowerCase() !== expectedSigner.toLowerCase()) {
    throw new Error(`Evalanche resolved ${address}, expected ${expectedSigner}`);
  }
}

function addressFromStorage(value: Hex | undefined): Address {
  if (!value) throw new Error("Implementation slot returned no value");
  return getAddress(`0x${value.slice(-40)}`);
}

const [signer, privateKey, artifactRaw, protocolRaw] = await Promise.all([
  getEvalancheSigner(),
  getSignerKey(),
  readFile(path.join(repoRoot, "contracts/out/EvaThesisProtocol.sol/EvaThesisProtocol.json"), "utf8"),
  readFile(path.join(repoRoot, "protocol.config.json"), "utf8"),
]);

assertExpectedAddress(signer.address);
const account = privateKeyToAccount(privateKey);
assertExpectedAddress(account.address);

const artifact = JSON.parse(artifactRaw) as Artifact;
const protocol = JSON.parse(protocolRaw) as ProtocolConfig;
const proxy = getAddress(protocol.contracts.evaThesisProtocol);
const resumeImplementationInput = argValue("--implementation");
const resumeImplementation = resumeImplementationInput
  ? getAddress(resumeImplementationInput)
  : null;

const publicClient = createPublicClient({
  chain: avalanche,
  transport: http(rpcUrl),
});
const walletClient = createWalletClient({
  account,
  chain: avalanche,
  transport: http(rpcUrl),
});

const [chainId, balance, nonce, proxyCode, currentImplementationValue, isAdmin] = await Promise.all([
  publicClient.getChainId(),
  publicClient.getBalance({ address: account.address }),
  publicClient.getTransactionCount({ address: account.address }),
  publicClient.getCode({ address: proxy }),
  publicClient.getStorageAt({ address: proxy, slot: implementationSlot }),
  publicClient.readContract({
    address: proxy,
    abi: artifact.abi,
    functionName: "hasRole",
    args: [defaultAdminRole, account.address],
  }),
]);

if (chainId !== avalanche.id) throw new Error(`Expected Avalanche mainnet chain id ${avalanche.id}, got ${chainId}`);
if (!proxyCode) throw new Error(`Canonical proxy ${proxy} has no code`);
if (isAdmin !== true) throw new Error(`Signer ${account.address} does not hold DEFAULT_ADMIN_ROLE`);

const currentImplementation = addressFromStorage(currentImplementationValue);
const predictedImplementation = resumeImplementation ?? getContractAddress({ from: account.address, nonce });
const implementationCode = resumeImplementation
  ? await publicClient.getCode({ address: resumeImplementation })
  : undefined;
if (resumeImplementation && !implementationCode) {
  throw new Error(`Resume implementation ${resumeImplementation} has no code`);
}
if (currentImplementation.toLowerCase() === predictedImplementation.toLowerCase()) {
  throw new Error(`Proxy already points to ${predictedImplementation}`);
}

const implementationGas = resumeImplementation
  ? null
  : await publicClient.estimateGas({
      account: account.address,
      data: artifact.bytecode.object,
    });

console.log(
  JSON.stringify(
    {
      signer: account.address,
      secretsSource: signer.secretsSource,
      proxy,
      currentImplementation,
      proposedImplementation: predictedImplementation,
      expectedVersion,
      balanceWei: balance.toString(),
      implementationGas: implementationGas?.toString() ?? "already deployed",
      resumeImplementation: Boolean(resumeImplementation),
      dryRun: !shouldBroadcast,
    },
    null,
    2,
  ),
);

if (!shouldBroadcast) {
  console.log("Dry run complete. Pass --broadcast to deploy and upgrade.");
  process.exit(0);
}

let implementationAddress = resumeImplementation;
let implementationHash: Hex | null = null;
let implementationReceipt = null;

if (!implementationAddress) {
  implementationHash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode.object,
    account,
    chain: avalanche,
  });
  implementationReceipt = await publicClient.waitForTransactionReceipt({ hash: implementationHash });
  if (implementationReceipt.status !== "success") {
    throw new Error(`Implementation deployment failed: ${implementationHash}`);
  }
  if (!implementationReceipt.contractAddress) {
    throw new Error(`Implementation receipt ${implementationHash} has no contract address`);
  }
  implementationAddress = getAddress(implementationReceipt.contractAddress);
  if (implementationAddress.toLowerCase() !== predictedImplementation.toLowerCase()) {
    throw new Error(`Implementation deployed to ${implementationAddress}, expected ${predictedImplementation}`);
  }
}

const { request } = await publicClient.simulateContract({
  account,
  address: proxy,
  abi: artifact.abi,
  functionName: "upgradeToAndCall",
  args: [implementationAddress, "0x"],
});
const upgradeHash = await walletClient.writeContract(request);
const upgradeReceipt = await publicClient.waitForTransactionReceipt({ hash: upgradeHash });
if (upgradeReceipt.status !== "success") {
  throw new Error(`Proxy upgrade failed: ${upgradeHash}`);
}

const [upgradedImplementationValue, version] = await Promise.all([
  publicClient.getStorageAt({ address: proxy, slot: implementationSlot }),
  publicClient.readContract({
    address: proxy,
    abi: artifact.abi,
    functionName: "PROTOCOL_VERSION",
  }),
]);
const upgradedImplementation = addressFromStorage(upgradedImplementationValue);
if (upgradedImplementation.toLowerCase() !== implementationAddress.toLowerCase()) {
  throw new Error(`Proxy points to ${upgradedImplementation}, expected ${implementationAddress}`);
}
if (version !== expectedVersion) {
  throw new Error(`Proxy reports protocol version ${String(version)}, expected ${expectedVersion}`);
}

console.log(
  JSON.stringify(
    {
      proxy,
      previousImplementation: currentImplementation,
      implementation: implementationAddress,
      implementationTx: implementationHash,
      implementationBlock: implementationReceipt?.blockNumber.toString() ?? null,
      upgradeTx: upgradeHash,
      upgradeBlock: upgradeReceipt.blockNumber.toString(),
      protocolVersion: Number(version),
    },
    null,
    2,
  ),
);
