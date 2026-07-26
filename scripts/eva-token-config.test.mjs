import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const protocol = JSON.parse(
  await readFile(new URL("../protocol.config.json", import.meta.url), "utf8"),
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
