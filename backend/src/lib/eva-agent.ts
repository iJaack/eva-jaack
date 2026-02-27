import { Evalanche } from 'evalanche';

let _agent: Awaited<ReturnType<typeof Evalanche.boot>> | null = null;

/**
 * Get Eva's singleton Evalanche agent (lazy init).
 *
 * Credential resolution priority:
 * 1. OpenClaw external secrets (if `openclaw` CLI available + AGENT_PRIVATE_KEY=@secret:...)
 * 2. Raw AGENT_PRIVATE_KEY / AGENT_MNEMONIC env vars
 * 3. Encrypted keystore at ~/.evalanche/keys/agent.json
 *
 * No private keys should ever be stored in plaintext — use OpenClaw secrets
 * or the auto-managed keystore.
 */
export async function getEvaAgent() {
  if (!_agent) {
    _agent = await Evalanche.boot({
      network: 'avalanche',
      identity: { agentId: '1599' },
    });
    console.log(
      `[eva-agent] booted — credentials source: ${_agent.secretsSource} — address: ${_agent.agent.address}`
    );
  }
  return _agent;
}
