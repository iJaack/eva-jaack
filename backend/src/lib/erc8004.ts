import { createPublicClient, http } from 'viem';
import { avalanche } from 'viem/chains';
import { config } from '../config.js';

export const giveFeedbackAbi = [
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
] as const;

export const validationResponseAbi = [
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

const reputationReadAbi = [
  ...giveFeedbackAbi,
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
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: 'clients', type: 'address[]' }],
  },
] as const;

export const publicClient = createPublicClient({
  chain: avalanche,
  transport: http(config.avalancheRpc),
});
const readContractLoose = publicClient.readContract as unknown as (args: unknown) => Promise<unknown>;

export async function getSummary(
  agentId: bigint,
  clientAddresses: `0x${string}`[],
  tag1: string,
  tag2: string,
): Promise<{ count: bigint; total: bigint; decimals: number }> {
  const result = await readContractLoose({
    address: config.erc8004Reputation,
    abi: reputationReadAbi,
    functionName: 'getSummary',
    args: [agentId, clientAddresses, tag1, tag2],
  }) as [bigint, bigint, number];

  return { count: result[0], total: result[1], decimals: result[2] };
}

export async function readFeedback(
  agentId: bigint,
  clientAddress: `0x${string}`,
  feedbackIndex: bigint,
): Promise<{ value: bigint; valueDecimals: number; tag1: string; tag2: string; revoked: boolean }> {
  const result = await readContractLoose({
    address: config.erc8004Reputation,
    abi: reputationReadAbi,
    functionName: 'readFeedback',
    args: [agentId, clientAddress, feedbackIndex],
  }) as [bigint, number, string, string, boolean];

  return { value: result[0], valueDecimals: result[1], tag1: result[2], tag2: result[3], revoked: result[4] };
}

export async function getClients(agentId: bigint): Promise<`0x${string}`[]> {
  return readContractLoose({
    address: config.erc8004Reputation,
    abi: reputationReadAbi,
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
  const result = await readContractLoose({
    address: config.erc8004Reputation,
    abi: reputationReadAbi,
    functionName: 'readAllFeedback',
    args: [agentId, clientAddresses, tag1, tag2, includeRevoked],
  }) as [`0x${string}`[], bigint[], bigint[], number[], string[], string[], boolean[]];

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
