// ── Signing bootstrap — Evalanche-backed agent wallet management ───────

import { Evalanche } from 'evalanche';
import { config } from '../config.js';

type Hex = `0x${string}`;

type BootedEvalanche = Awaited<ReturnType<typeof Evalanche.boot>>;

type EvalancheLike = {
  address: `0x${string}`;
  wallet: { privateKey: Hex };
};

export interface EvalancheSignerHandle {
  agent: EvalancheLike;
  address: `0x${string}`;
  keystore: {
    address: string;
    keystorePath: string;
    isNew: boolean;
  };
  secretsSource: 'openclaw-secrets' | 'env' | 'keystore';
}

let _bootPromise: Promise<BootedEvalanche> | null = null;
let _cachedPrivateKey: Hex | null = null;

async function bootEvalanche(): Promise<BootedEvalanche> {
  if (!_bootPromise) {
    _bootPromise = Evalanche.boot({
      network: 'avalanche',
      identity: { agentId: config.evaAgentId },
    });
  }

  return _bootPromise;
}

/**
 * Boot the local Evalanche agent wallet for Eva Protocol.
 * Resolution order is handled by Evalanche itself:
 * OpenClaw secrets → env vars → encrypted local keystore.
 */
export async function getEvalancheSigner(): Promise<EvalancheSignerHandle> {
  const { agent, keystore, secretsSource } = await bootEvalanche();
  const evalancheAgent = agent as unknown as EvalancheLike;

  return {
    agent: evalancheAgent,
    address: evalancheAgent.address,
    keystore,
    secretsSource,
  };
}

/**
 * Get the agent signer private key by booting Evalanche and reading the
 * decrypted in-process wallet. Cached after first resolution.
 */
export async function getSignerKey(): Promise<Hex> {
  if (_cachedPrivateKey) return _cachedPrivateKey;

  const { agent } = await getEvalancheSigner();
  const privateKey = agent.wallet?.privateKey;

  if (!privateKey || !privateKey.startsWith('0x')) {
    throw new Error('[signing] Evalanche did not expose a usable private key');
  }

  _cachedPrivateKey = privateKey;
  return privateKey;
}

/**
 * Clear cached signer material (useful for tests or explicit rotation).
 */
export function clearSignerCache(): void {
  _cachedPrivateKey = null;
  _bootPromise = null;
}
