import type { Page, Route } from "@playwright/test";
import { encodeAbiParameters, toHex } from "viem";

const rpcUrl = "https://avalanche-c-chain-rpc.publicnode.com/**";
const tokenSupply = 10_000_000_000n * 10n ** 18n;
const protocolBalance = 1_000_000n * 10n ** 18n;
const deadSinkBalance = 50_000_000n * 10n ** 18n;
const burnSink = "0x000000000000000000000000000000000000dEaD" as const;

type EvaRpcOptions = {
  allowance?: bigint;
  totalRetired?: bigint;
  receiptCount?: bigint;
  walletBalance?: bigint;
};

type JsonRpcRequest = {
  id: number;
  method: string;
  params?: unknown[];
};

function ethCallResult(request: JsonRpcRequest, options: EvaRpcOptions): `0x${string}` {
  const call = request.params?.[0] as { data?: string; to?: string } | undefined;
  const selector = call?.data?.slice(0, 10);

  if (selector === "0x06fdde03") return encodeAbiParameters([{ type: "string" }], ["evajaack"]);
  if (selector === "0x95d89b41") return encodeAbiParameters([{ type: "string" }], ["EVA"]);
  if (selector === "0x313ce567") return encodeAbiParameters([{ type: "uint8" }], [18]);
  if (selector === "0x18160ddd") return encodeAbiParameters([{ type: "uint256" }], [tokenSupply]);
  if (selector === "0x70a08231") {
    const account = `0x${call?.data?.slice(-40) ?? ""}`.toLowerCase();
    const balance =
      account === burnSink.toLowerCase()
        ? deadSinkBalance
        : account === "0x0fe61780bd5508b3c99e420662050e5560608ca4"
          ? protocolBalance
          : (options.walletBalance ?? 1_000n * 10n ** 18n);
    return encodeAbiParameters([{ type: "uint256" }], [balance]);
  }
  if (selector === "0xdd62ed3e") {
    return encodeAbiParameters([{ type: "uint256" }], [options.allowance ?? 0n]);
  }
  if (selector === "0x5e4807f2") {
    return encodeAbiParameters([{ type: "address" }], [burnSink]);
  }
  if (selector === "0x207fcf9e") {
    return encodeAbiParameters([{ type: "uint256" }], [10n ** 18n]);
  }
  if (selector === "0x4d8f59f0") {
    return encodeAbiParameters([{ type: "uint256" }], [options.totalRetired ?? 0n]);
  }
  if (selector === "0x7f038f3c") {
    return encodeAbiParameters([{ type: "uint256" }], [options.receiptCount ?? 0n]);
  }

  throw new Error(`Unhandled $EVA eth_call selector: ${selector ?? "missing"}`);
}

function rpcResult(request: JsonRpcRequest, options: EvaRpcOptions): unknown {
  if (request.method === "eth_call") return ethCallResult(request, options);
  if (request.method === "eth_blockNumber") return toHex(91_285_587);
  if (request.method === "eth_chainId") return toHex(43_114);
  if (request.method === "eth_getTransactionReceipt") {
    const transactionHash = request.params?.[0];
    return {
      blockHash: `0x${"a".repeat(64)}`,
      blockNumber: toHex(91_285_587),
      contractAddress: null,
      cumulativeGasUsed: "0x5208",
      effectiveGasPrice: "0x1",
      from: "0x1111111111111111111111111111111111111111",
      gasUsed: "0x5208",
      logs: [],
      logsBloom: `0x${"0".repeat(512)}`,
      status: "0x1",
      to: "0xFfEA6272e6C7e035FE529a226A9aA5D9cD98B296",
      transactionHash,
      transactionIndex: "0x0",
      type: "0x2",
    };
  }
  throw new Error(`Unhandled $EVA RPC method: ${request.method}`);
}

async function fulfillRpc(route: Route, options: EvaRpcOptions) {
  const payload = route.request().postDataJSON() as JsonRpcRequest | JsonRpcRequest[];
  const requests = Array.isArray(payload) ? payload : [payload];
  const responses = requests.map((request) => ({
    jsonrpc: "2.0",
    id: request.id,
    result: rpcResult(request, options),
  }));

  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(Array.isArray(payload) ? responses : responses[0]),
  });
}

export async function stubEvaRpc(page: Page, options: EvaRpcOptions = {}) {
  await page.route(rpcUrl, (route) => fulfillRpc(route, options));
}
