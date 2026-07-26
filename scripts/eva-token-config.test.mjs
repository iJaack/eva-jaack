import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const protocol = JSON.parse(
  await readFile(new URL("../protocol.config.json", import.meta.url), "utf8"),
);
const deployment = JSON.parse(
  await readFile(new URL("../contracts/deployments/mainnet.json", import.meta.url), "utf8"),
);

test("$EVA uses the canonical Avalanche C-Chain contract and metadata", () => {
  assert.equal(protocol.chain.id, 43114);
  assert.deepEqual(protocol.tokens.eva, {
    address: "0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672",
    name: "evajaack",
    symbol: "EVA",
    decimals: 18,
  });
});

test("$EVA config does not invent inactive token utility", () => {
  const serialized = JSON.stringify(protocol.tokens.eva).toLowerCase();
  for (const unsupportedClaim of ["staking", "gating", "yield", "governance", "trade"]) {
    assert.equal(serialized.includes(unsupportedClaim), false);
  }
});

test("$EVA usage only accepts self-custodial external wallets", () => {
  assert.equal(protocol.evaUsage.walletMode, "self_custody");
  assert.equal(protocol.evaUsage.embeddedWallets, false);
  assert.equal(protocol.evaUsage.serverCanSign, false);
});

test("$EVA usage burns point to the confirmed immutable Avalanche deployment", () => {
  assert.equal(
    protocol.contracts.evaUsageBurner,
    "0xFfEA6272e6C7e035FE529a226A9aA5D9cD98B296",
  );
  assert.deepEqual(deployment.contracts.EvaUsageBurner, {
    address: "0xFfEA6272e6C7e035FE529a226A9aA5D9cD98B296",
    token: protocol.tokens.eva.address,
    burnSink: "0x000000000000000000000000000000000000dEaD",
    deploymentTxHash: "0x88899e9cc943d59a792e71f927372af0cc1e24606baeb267f05300f8040e3340",
    deployedBlock: 91287297,
    codeHash: "0xcdbfdb12af6f360b6b1d60a3afc5dd5f384a0e570e50ddec80f96b2cb2c50be5",
    minimumRetirement: "1000000000000000000",
    supplyAccounting: "circulating_supply_sink; legacy token totalSupply remains unchanged",
    verified: true,
    verificationProvider: "sourcify",
    verificationMatch: "exact_match",
    verificationUrl:
      "https://repo.sourcify.dev/43114/0xFfEA6272e6C7e035FE529a226A9aA5D9cD98B296",
    verifiedAt: "2026-07-26T16:40:21Z",
  });
});
