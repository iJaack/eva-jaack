import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(repoRoot, "protocol.config.json");

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function printUsage() {
  console.log(`Usage: pnpm confirm:deployer -- --deployer <0x...> [--expected <0x...>]

Checks that the wallet selected for a deployment or anchor operation matches the expected Eva operator wallet.

Inputs:
- --deployer: the wallet address the operator intends to use for the next deployment or anchor transaction.
- --expected: optional override for the expected wallet. Defaults to protocol.config.json agents.eva.wallet.

This command is read-only. It does not load private keys, sign messages, deploy contracts, call Eva APIs, or broadcast transactions.`);
}

function normalizeAddress(value, label) {
  if (typeof value !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`${label} must be a 20-byte hex address`);
  }
  if (/^0x0{40}$/i.test(value)) {
    throw new Error(`${label} must not be the zero address`);
  }
  return value;
}

function sameAddress(left, right) {
  return left.toLowerCase() === right.toLowerCase();
}

function printResult(result) {
  console.log(JSON.stringify(result, null, 2));
}

if (hasFlag("--help") || hasFlag("-h")) {
  printUsage();
  process.exit(0);
}

const config = JSON.parse(await readFile(configPath, "utf8"));
const configuredExpected = config?.agents?.eva?.wallet;
const expected = normalizeAddress(
  argValue("--expected") ?? process.env.EVA_EXPECTED_DEPLOYER ?? configuredExpected,
  "expected deployer",
);
const deployerInput = argValue("--deployer") ?? process.env.EVA_DEPLOYER_WALLET ?? process.env.DEPLOYER_ADDRESS;

if (!deployerInput) {
  printResult({
    confirmed: false,
    status: "blocked",
    reason: "missing deployer wallet; pass --deployer or EVA_DEPLOYER_WALLET before any deployment or anchor transaction",
    expectedDeployer: expected,
    chain: config.chain,
    thesisProtocol: config.contracts?.evaThesisProtocol,
    boundary: "read-only identity preflight; no transaction was signed or broadcast",
  });
  process.exit(2);
}

const deployer = normalizeAddress(deployerInput, "deployer");
const confirmed = sameAddress(deployer, expected);

printResult({
  confirmed,
  status: confirmed ? "ok" : "blocked",
  reason: confirmed ? "deployer matches expected Eva operator wallet" : "deployer does not match expected Eva operator wallet",
  deployer,
  expectedDeployer: expected,
  chain: config.chain,
  thesisProtocol: config.contracts?.evaThesisProtocol,
  boundary: "read-only identity preflight; no transaction was signed or broadcast",
});

process.exit(confirmed ? 0 : 1);
