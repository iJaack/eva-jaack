import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const protocol = JSON.parse(
  await readFile(new URL("../protocol.config.json", import.meta.url), "utf8"),
);
const deployment = JSON.parse(
  await readFile(new URL("../contracts/deployments/mainnet.json", import.meta.url), "utf8"),
);

test("the canonical thesis proxy records the confirmed v2 Avalanche upgrade", () => {
  const thesis = deployment.contracts.EvaThesisProtocol;

  assert.equal(deployment.chainId, 43114);
  assert.equal(thesis.proxy, protocol.contracts.evaThesisProtocol);
  assert.equal(thesis.protocolVersion, 2);
  assert.equal(thesis.implementation, "0x51cBB77D3b5Df8031F1A916548df07D3B05ae9BB");
  assert.equal(thesis.implementationBlock, 91284740);
  assert.equal(thesis.upgradeBlock, 91284742);
  assert.equal(thesis.upgradeTxHash, "0x99da914de41aaa0e7e6cc32590429b52a1f447ba0ced833d9c9ecdd78bd8b5f7");
  assert.equal(thesis.verified, false);
});
