import type { Page, Route } from "@playwright/test";
import { encodeAbiParameters, toHex } from "viem";

const rpcUrl = "https://avalanche-c-chain-rpc.publicnode.com/**";
const tokenSupply = 10_000_000_000n * 10n ** 18n;
const protocolBalance = 1_000_000n * 10n ** 18n;

type JsonRpcRequest = {
  id: number;
  method: string;
  params?: unknown[];
};

function ethCallResult(request: JsonRpcRequest): `0x${string}` {
  const call = request.params?.[0] as { data?: string } | undefined;
  const selector = call?.data?.slice(0, 10);

  if (selector === "0x06fdde03") return encodeAbiParameters([{ type: "string" }], ["evajaack"]);
  if (selector === "0x95d89b41") return encodeAbiParameters([{ type: "string" }], ["EVA"]);
  if (selector === "0x313ce567") return encodeAbiParameters([{ type: "uint8" }], [18]);
  if (selector === "0x18160ddd") return encodeAbiParameters([{ type: "uint256" }], [tokenSupply]);
  if (selector === "0x70a08231") return encodeAbiParameters([{ type: "uint256" }], [protocolBalance]);

  throw new Error(`Unhandled $EVA eth_call selector: ${selector ?? "missing"}`);
}

function rpcResult(request: JsonRpcRequest): string {
  if (request.method === "eth_call") return ethCallResult(request);
  if (request.method === "eth_blockNumber") return toHex(91_285_587);
  if (request.method === "eth_chainId") return toHex(43_114);
  throw new Error(`Unhandled $EVA RPC method: ${request.method}`);
}

async function fulfillRpc(route: Route) {
  const payload = route.request().postDataJSON() as JsonRpcRequest | JsonRpcRequest[];
  const requests = Array.isArray(payload) ? payload : [payload];
  const responses = requests.map((request) => ({
    jsonrpc: "2.0",
    id: request.id,
    result: rpcResult(request),
  }));

  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(Array.isArray(payload) ? responses : responses[0]),
  });
}

export async function stubEvaRpc(page: Page) {
  await page.route(rpcUrl, fulfillRpc);
}
