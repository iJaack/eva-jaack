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
  return wallet.writeContract({
    address: config.erc8004Reputation,
    abi: reputationRegistryAbi,
    functionName: 'addReputation',
    args: [subject, score, tag],
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
  return wallet.writeContract({
    address: config.erc8004Validation,
    abi: validationRegistryAbi,
    functionName: 'validationResponse',
    args: [requestHash, response, responseURI, responseHash, tag],
  });
}
