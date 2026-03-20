// ── GET /api/trust/:address — on-chain trust score for a curator address ──

import { Hono } from 'hono';
import { getSummary, getClients } from '../lib/erc8004.js';
import { config } from '../config.js';

export const trustRoutes = new Hono();

// ── GET /api/trust/:address ────────────────────────────────────────────
//
// Returns the on-chain reputation summary for a curator address.
// Reads from ReputationRegistry — no signing needed, pure read.

trustRoutes.get('/:address', async (c) => {
  const address = c.req.param('address');

  if (!address.match(/^0x[0-9a-fA-F]{40}$/)) {
    return c.json({ error: 'Invalid Ethereum address' }, 400);
  }

  const addr = address as `0x${string}`;
  const agentId = BigInt(config.evaAgentId);

  try {
    // Get all feedback given to our agent by this address (as reviewer)
    const [verificationSummary, oracleSummary] = await Promise.all([
      getSummary(agentId, [addr], 'eva:verification', 'article').catch(() => null),
      getSummary(agentId, [addr], 'eva:oracle:verification', '').catch(() => null),
    ]);

    const verificationCount = Number(verificationSummary?.count ?? 0);
    const verificationTotal = Number(verificationSummary?.total ?? 0);
    const oracleCount = Number(oracleSummary?.count ?? 0);

    // Simple trust score: average verification value, normalized to 0-100
    // If no data: return neutral 50
    const trustScore = verificationCount > 0
      ? Math.max(0, Math.min(100, Math.round(verificationTotal / verificationCount)))
      : 50;

    return c.json({
      address: addr,
      agentId: config.evaAgentId,
      trustScore,
      verificationCount,
      oracleCount,
      chain: 'avalanche',
      chainId: 43114,
      registry: config.erc8004Reputation,
    });
  } catch (e) {
    console.error(`[trust] getSummary failed for ${address}: ${e}`);
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
    });
  } catch (e) {
    console.error(`[trust] getClients failed: ${e}`);
    return c.json({ error: 'Failed to fetch curators', details: String(e) }, 500);
  }
});
