// ── GET /api/trust/:address — curator trust + on-chain registration ───

import { Hono } from 'hono';
import { createPublicClient, http } from 'viem';
import { avalanche } from 'viem/chains';
import { getSummary, getClients } from '../lib/erc8004.js';
import { config } from '../config.js';

export const trustRoutes = new Hono();

const evaTrustGraphAbi = [
  {
    name: 'getCurator',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'curatorAddr', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'registered', type: 'bool' },
          { name: 'curatorAgentId', type: 'uint256' },
          { name: 'selfStake', type: 'uint256' },
          { name: 'delegatedStake', type: 'uint256' },
          { name: 'accYieldPerStakeX18', type: 'uint256' },
          { name: 'pendingSelfYield', type: 'uint256' },
          { name: 'selfRewardDebt', type: 'uint256' },
          { name: 'trustScore', type: 'uint8' },
          { name: 'registeredAt', type: 'uint64' },
          { name: 'lastTrustUpdate', type: 'uint64' },
          { name: 'lastArticleAt', type: 'uint64' },
          { name: 'articleCount', type: 'uint64' },
        ],
      },
    ],
  },
] as const;

const publicClient = createPublicClient({
  chain: avalanche,
  transport: http(config.avalancheRpc),
});

// ── GET /api/trust/:address ───────────────────────────────────────────
//
// Returns the direct EvaTrustGraph curator state plus ERC-8004 reputation
// summaries derived from on-chain feedback directed at Eva's agent.

trustRoutes.get('/:address', async (c) => {
  const address = c.req.param('address');

  if (!address.match(/^0x[0-9a-fA-F]{40}$/)) {
    return c.json({ error: 'Invalid Ethereum address' }, 400);
  }

  const addr = address as `0x${string}`;
  const agentId = BigInt(config.evaAgentId);

  try {
    const [curator, verificationSummary, oracleSummary] = await Promise.all([
      publicClient.readContract({
        address: config.evaTrustGraph,
        abi: evaTrustGraphAbi,
        functionName: 'getCurator',
        args: [addr],
      }),
      getSummary(agentId, [addr], 'eva:verification', 'article').catch(() => null),
      getSummary(agentId, [addr], 'eva:oracle:verification', '').catch(() => null),
    ]);

    const verificationCount = Number(verificationSummary?.count ?? 0);
    const verificationTotal = Number(verificationSummary?.total ?? 0);
    const oracleCount = Number(oracleSummary?.count ?? 0);

    const derivedTrustScore = verificationCount > 0
      ? Math.max(0, Math.min(100, Math.round(verificationTotal / verificationCount)))
      : 50;

    return c.json({
      address: addr,
      agentId: config.evaAgentId,
      chain: 'avalanche',
      chainId: 43114,
      contracts: {
        evaTrustGraph: config.evaTrustGraph,
        reputationRegistry: config.erc8004Reputation,
      },
      curator: {
        registered: curator.registered,
        curatorAgentId: curator.curatorAgentId.toString(),
        selfStake: curator.selfStake.toString(),
        delegatedStake: curator.delegatedStake.toString(),
        pendingSelfYield: curator.pendingSelfYield.toString(),
        trustScore: Number(curator.trustScore),
        registeredAt: Number(curator.registeredAt),
        lastTrustUpdate: Number(curator.lastTrustUpdate),
        lastArticleAt: Number(curator.lastArticleAt),
        articleCount: Number(curator.articleCount),
      },
      reputation: {
        verificationCount,
        verificationTotal,
        oracleCount,
        derivedTrustScore,
      },
    });
  } catch (e) {
    console.error(`[trust] failed for ${address}: ${e}`);
    return c.json({ error: 'Failed to fetch trust score', details: String(e) }, 500);
  }
});

// ── GET /api/trust — list all known curator addresses ─────────────────

trustRoutes.get('/', async (c) => {
  const agentId = BigInt(config.evaAgentId);

  try {
    const clients = await getClients(agentId);
    return c.json({
      agentId: config.evaAgentId,
      curatorCount: clients.length,
      curators: clients,
      chain: 'avalanche',
      chainId: 43114,
      reputationRegistry: config.erc8004Reputation,
    });
  } catch (e) {
    console.error(`[trust] getClients failed: ${e}`);
    return c.json({ error: 'Failed to fetch curators', details: String(e) }, 500);
  }
});
