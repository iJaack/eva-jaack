import { Hono } from 'hono';
import { getSummary } from '../lib/erc8004.js';
import { getCurator, listCuratorAddresses } from '../services/trust-graph.js';
import { config } from '../config.js';

type TrustRouteDeps = {
  getCurator: typeof getCurator;
  listCuratorAddresses: typeof listCuratorAddresses;
  getSummary: typeof getSummary;
};

export function createTrustRoutes(
  deps: TrustRouteDeps = {
    getCurator,
    listCuratorAddresses,
    getSummary,
  },
) {
  const trustRoutes = new Hono();

  trustRoutes.get('/:address', async (c) => {
    const address = c.req.param('address');

    if (!address.match(/^0x[0-9a-fA-F]{40}$/)) {
      return c.json({ error: 'Invalid Ethereum address' }, 400);
    }

    const addr = address as `0x${string}`;
    const agentId = BigInt(config.evaAgentId);

    try {
      const [curator, verificationSummary] = await Promise.all([
        deps.getCurator(addr),
        deps.getSummary(agentId, [addr], 'eva:verification', 'article').catch(() => null),
      ]);

      if (!curator.registered) {
        return c.json({ error: 'Curator not found' }, 404);
      }

      return c.json({
        address: addr,
        agentId: config.evaAgentId,
        chain: 'avalanche',
        chainId: 43114,
        contracts: {
          evaTrustGraph: config.evaTrustGraph,
          reputationRegistry: config.erc8004Reputation,
        },
        curator,
        reputation: {
          verificationCount: Number(verificationSummary?.count ?? 0),
          verificationTotal: Number(verificationSummary?.total ?? 0),
          trustScoreSource: 'eva-trust-graph',
          trustScore: curator.trustScore,
        },
      });
    } catch (e) {
      console.error(`[trust] failed for ${address}: ${e}`);
      return c.json({ error: 'Failed to fetch trust score', details: String(e) }, 500);
    }
  });

  trustRoutes.get('/', async (c) => {
    try {
      const curators = await deps.listCuratorAddresses();
      return c.json({
        agentId: config.evaAgentId,
        curatorCount: curators.length,
        curators,
        chain: 'avalanche',
        chainId: 43114,
        reputationRegistry: config.erc8004Reputation,
      });
    } catch (e) {
      console.error(`[trust] getCurators failed: ${e}`);
      return c.json({ error: 'Failed to fetch curators', details: String(e) }, 500);
    }
  });

  return trustRoutes;
}

export const trustRoutes = createTrustRoutes();
