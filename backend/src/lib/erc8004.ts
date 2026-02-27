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
    name: 'addReputation',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'subject', type: 'address' },
      { name: 'score', type: 'uint8' },
      { name: 'tag', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'giveFeedback',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'score', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
    ],
    outputs: [],
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

// ── On-chain calls ─────────────────────────────────────────────────────

export async function giveFeedback(
  subject: `0x${string}`,
  score: number,
  tag: string,
): Promise<Hex> {
  const wallet = getWalletClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (wallet as any).writeContract({
    address: config.erc8004Reputation,
    abi: reputationRegistryAbi,
    functionName: 'addReputation',
    args: [subject, score, tag],
    chain: avalanche,
  });
}

export async function giveFeedbackToAgent(
  agentId: bigint,
  score: number,
  tag1: string,
  tag2: string,
  feedbackURI: string,
): Promise<Hex> {
  const wallet = getWalletClient();
  console.log(`[erc8004] giveFeedback(agentId=${agentId}, score=${score}, tag1=${tag1})`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (wallet as any).writeContract({
    address: config.erc8004Reputation,
    abi: reputationRegistryAbi,
    functionName: 'giveFeedback',
    args: [agentId, score, tag1, tag2, feedbackURI],
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
