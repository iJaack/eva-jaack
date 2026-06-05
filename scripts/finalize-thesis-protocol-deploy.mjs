import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(repoRoot, "protocol.config.json");
const rpcUrl = process.env.AVALANCHE_RPC_URL ?? "https://api.avax.network/ext/bc/C/rpc";
const expectedOperator = "0x0fe61780bd5508b3C99e420662050e5560608cA4";
const defaultAdminRole = "0x" + "0".repeat(64);
const operatorRole = "0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929";
const hasRoleSelector = "0x91d14854";

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
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

function encodeHasRole(role, account) {
  const paddedAccount = account.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  return `${hasRoleSelector}${role.replace(/^0x/, "")}${paddedAccount}`;
}

async function rpc(method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const payload = await response.json();
  if (payload.error) {
    throw new Error(`${method} failed: ${payload.error.message ?? JSON.stringify(payload.error)}`);
  }
  return payload.result;
}

async function assertHasRole(contractAddress, role, account, label) {
  const result = await rpc("eth_call", [
    {
      to: contractAddress,
      data: encodeHasRole(role, account),
    },
    "latest",
  ]);
  if (result !== "0x" + "0".repeat(63) + "1") {
    throw new Error(`${label} role missing for ${account}`);
  }
}

const thesisProtocol = normalizeAddress(
  argValue("--address") ?? process.env.EVA_THESIS_PROTOCOL,
  "EvaThesisProtocol proxy",
);
const operator = normalizeAddress(argValue("--operator") ?? process.env.EVA_OPERATOR ?? expectedOperator, "operator");

const code = await rpc("eth_getCode", [thesisProtocol, "latest"]);
if (!code || code === "0x") {
  throw new Error(`No code found at ${thesisProtocol}`);
}

await assertHasRole(thesisProtocol, defaultAdminRole, operator, "default admin");
await assertHasRole(thesisProtocol, operatorRole, operator, "operator");

const config = JSON.parse(await readFile(configPath, "utf8"));
config.contracts.evaThesisProtocol = thesisProtocol;
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Updated protocol.config.json with EvaThesisProtocol ${thesisProtocol}`);
