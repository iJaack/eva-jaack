import { privateKeyToAccount } from 'viem/accounts';
import { config } from '../config.js';

type Hex = `0x${string}`;

export interface EvaAgentHandle {
  identity: { agentId: string };
  agent: { address: `0x${string}` };
  secretsSource: 'env';
}

let _agent: EvaAgentHandle | null = null;

/**
 * Minimal Eva agent handle backed by EVA_PRIVATE_KEY.
 *
 * The backend no longer pulls in Evalanche because its transitive dependency
 * graph currently carries unresolved critical/high advisories. If richer agent
 * bootstrapping is needed again later, reintroduce it behind a safer package set.
 */
export async function getEvaAgent(): Promise<EvaAgentHandle> {
  if (!_agent) {
    const privateKey = config.evaPrivateKey as Hex;
    if (!privateKey) throw new Error('EVA_PRIVATE_KEY not set');

    const account = privateKeyToAccount(privateKey);
    _agent = {
      identity: { agentId: config.evaAgentId },
      agent: { address: account.address },
      secretsSource: 'env',
    };

    console.log(`[eva-agent] booted — credentials source: env — address: ${account.address}`);
  }

  return _agent;
}
