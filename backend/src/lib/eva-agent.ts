import { Evalanche } from 'evalanche';

let _agent: Awaited<ReturnType<typeof Evalanche.boot>> | null = null;

export async function getEvaAgent() {
  if (!_agent) {
    _agent = await Evalanche.boot({
      network: 'avalanche',
      identity: { agentId: '1599' },
    });
  }
  return _agent;
}
