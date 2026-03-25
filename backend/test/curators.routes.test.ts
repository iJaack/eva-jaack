import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { createCuratorRoutes } from '../src/routes/curators.js';
import { fetchJson } from './helpers.js';
import { sampleArticle, sampleCurator } from './fixtures.js';

describe('curator routes', () => {
  it('lists and resolves curator detail by address', async () => {
    const app = new Hono();
    app.route('/api/curators', createCuratorRoutes({
      listCurators: vi.fn().mockResolvedValue([sampleCurator]),
      listArticlesForCurator: vi.fn().mockResolvedValue([sampleArticle]),
      publicClient: { readContract: vi.fn() },
    }));

    const listResponse = await fetchJson(app, '/api/curators');
    const detailResponse = await fetchJson(app, `/api/curators/${sampleCurator.address}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toMatchObject({
      count: 1,
      curators: [{ address: sampleCurator.address }],
    });

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body).toMatchObject({
      curator: { curatorAgentId: sampleCurator.curatorAgentId },
      articles: [{ id: sampleArticle.id }],
    });
  });

  it('preflights curator registration and returns prepared transactions', async () => {
    const readContract = vi.fn(async ({ functionName }: { functionName: string }) => {
      switch (functionName) {
        case 'minSelfStake':
          return 1000n;
        case 'getCurator':
          return {
            registered: false,
            curatorAgentId: 0n,
            trustScore: 0,
          };
        case 'ownerOf':
          return sampleCurator.address;
        case 'balanceOf':
          return 5000n;
        case 'allowance':
          return 0n;
        default:
          throw new Error(`Unexpected function ${functionName}`);
      }
    });

    const app = new Hono();
    app.route('/api/curator', createCuratorRoutes({
      listCurators: vi.fn(),
      listArticlesForCurator: vi.fn(),
      publicClient: { readContract },
    }));

    const response = await fetchJson(app, '/api/curator/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        walletAddress: sampleCurator.address,
        agentId: sampleCurator.curatorAgentId,
      }),
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ready: true,
      walletAddress: sampleCurator.address,
      agentId: sampleCurator.curatorAgentId,
      needsApproval: true,
    });
    expect((response.body as { transactions: unknown[] }).transactions).toHaveLength(2);
  });

  it('returns a structured 500 when curator listing fails', async () => {
    const app = new Hono();
    app.route('/api/curators', createCuratorRoutes({
      listCurators: vi.fn().mockRejectedValue(new Error('rpc exploded')),
      listArticlesForCurator: vi.fn(),
      publicClient: { readContract: vi.fn() },
    }));

    const response = await fetchJson(app, '/api/curators');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      error: 'Failed to fetch curators',
    });
  });
});
