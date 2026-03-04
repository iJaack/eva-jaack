import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { avalanche } from 'viem/chains';
import { config } from '../config.js';

// ── ABI fragments ──────────────────────────────────────────────────────

const reputationRegistryAbi = [
  {
    name: 'giveFeedback',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'value', type: 'int128' },
      { name: 'valueDecimals', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'getSummary',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
    ],
    outputs: [
      { name: 'count', type: 'uint64' },
      { name: 'total', type: 'int128' },
      { name: 'decimals', type: 'uint8' },
    ],
  },
  {
    name: 'readFeedback',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddress', type: 'address' },
      { name: 'feedbackIndex', type: 'uint64' },
    ],
    outputs: [
      { name: 'value', type: 'int128' },
      { name: 'valueDecimals', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'revoked', type: 'bool' },
    ],
  },
  {
    name: 'readAllFeedback',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'includeRevoked', type: 'bool' },
    ],
    outputs: [
      { name: 'clients', type: 'address[]' },
      { name: 'indices', type: 'uint64[]' },
      { name: 'values', type: 'int128[]' },
      { name: 'decimals', type: 'uint8[]' },
      { name: 'tag1s', type: 'string[]' },
      { name: 'tag2s', type: 'string[]' },
      { name: 'revokedFlags', type: 'bool[]' },
    ],
  },
  {
    name: 'getClients',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
    ],
    outputs: [
      { name: 'clients', type: 'address[]' },
    ],
  },
  {
    name: 'getLastIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddress', type: 'address' },
    ],
    outputs: [
      { name: 'lastIndex', type: 'uint64' },
    ],
  },
] as const;

const validationRegistryAbi = [
  {
    name: 'validationResponse',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'requestHash', type: 'bytes32' },
      { name: 'response', type: 'uint8' },
      { name: 'responseURI', type: 'string' },
      { name: 'responseHash', type: 'bytes32' },
      { name: 'tag', type: 'string' },
    ],
    outputs: [],
  },
] as const;

// ── Clients ────────────────────────────────────────────────────────────

export const publicClient = createPublicClient({
  chain: avalanche,
  transport: http(config.avalancheRpc),
});

function getWalletClient() {
  if (!config.evaPrivateKey) throw new Error('EVA_PRIVATE_KEY not set');
  const account = privateKeyToAccount(config.evaPrivateKey);
  return createWalletClient({
    account,
    chain: avalanche,
    transport: http(config.avalancheRpc),
  });
}

// ── On-chain write calls ──────────────────────────────────────────────

export async function giveFeedback(
  agentId: bigint,
  value: bigint,
  valueDecimals: number,
  tag1: string,
  tag2: string,
  endpoint: string,
  feedbackURI: string,
  feedbackHash: Hex,
): Promise<Hex> {
  const wallet = getWalletClient();
  console.log(`[erc8004] giveFeedback(agentId=${agentId}, value=${value}, tag1=${tag1}, tag2=${tag2})`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (wallet as any).writeContract({
    address: config.erc8004Reputation,
    abi: reputationRegistryAbi,
    functionName: 'giveFeedback',
    args: [agentId, value, valueDecimals, tag1, tag2, endpoint, feedbackURI, feedbackHash],
    chain: avalanche,
  });
}

export async function validationResponse(
  requestHash: Hex,
  response: number,
  responseURI: string,
  responseHash: Hex,
  tag: string,
): Promise<Hex> {
  const wallet = getWalletClient();
  console.log(`[erc8004] validationResponse(requestHash=${requestHash})`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (wallet as any).writeContract({
    address: config.erc8004Validation,
    abi: validationRegistryAbi,
    functionName: 'validationResponse',
    args: [requestHash, response, responseURI, responseHash, tag],
    chain: avalanche,
  });
}

// ── On-chain read calls ───────────────────────────────────────────────

export async function getSummary(
  agentId: bigint,
  clientAddresses: `0x${string}`[],
  tag1: string,
  tag2: string,
): Promise<{ count: bigint; total: bigint; decimals: number }> {
  const result = await publicClient.readContract({
    address: config.erc8004Reputation,
    abi: reputationRegistryAbi,
    functionName: 'getSummary',
    args: [agentId, clientAddresses, tag1, tag2],
  });
  return { count: result[0], total: result[1], decimals: result[2] };
}

export async function readFeedback(
  agentId: bigint,
  clientAddress: `0x${string}`,
  feedbackIndex: bigint,
): Promise<{ value: bigint; valueDecimals: number; tag1: string; tag2: string; revoked: boolean }> {
  const result = await publicClient.readContract({
    address: config.erc8004Reputation,
    abi: reputationRegistryAbi,
    functionName: 'readFeedback',
    args: [agentId, clientAddress, feedbackIndex],
  });
  return { value: result[0], valueDecimals: result[1], tag1: result[2], tag2: result[3], revoked: result[4] };
}

export async function getClients(
  agentId: bigint,
): Promise<`0x${string}`[]> {
  return publicClient.readContract({
    address: config.erc8004Reputation,
    abi: reputationRegistryAbi,
    functionName: 'getClients',
    args: [agentId],
  }) as Promise<`0x${string}`[]>;
}

export async function readAllFeedback(
  agentId: bigint,
  clientAddresses: `0x${string}`[],
  tag1: string,
  tag2: string,
  includeRevoked: boolean,
) {
  const result = await publicClient.readContract({
    address: config.erc8004Reputation,
    abi: reputationRegistryAbi,
    functionName: 'readAllFeedback',
    args: [agentId, clientAddresses, tag1, tag2, includeRevoked],
  });
  return {
    clients: result[0],
    indices: result[1],
    values: result[2],
    decimals: result[3],
    tag1s: result[4],
    tag2s: result[5],
    revokedFlags: result[6],
  };
}
