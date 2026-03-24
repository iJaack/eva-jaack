import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { createTrustRoutes } from '../src/routes/trust.js';
import { fetchJson } from './helpers.js';
import { sampleCurator } from './fixtures.js';

describe('trust routes', () => {
  it('returns curator trust detail', async () => {
    const app = new Hono();
    app.route('/api/trust', createTrustRoutes({
      getCurator: vi.fn().mockResolvedValue(sampleCurator),
      listCuratorAddresses: vi.fn().mockResolvedValue([sampleCurator.address]),
      getSummary: vi.fn().mockResolvedValue({ count: 4n, total: 301n }),
    }));

    const response = await fetchJson(app, `/api/trust/${sampleCurator.address}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      address: sampleCurator.address,
      curator: { trustScore: sampleCurator.trustScore },
      reputation: {
        verificationCount: 4,
        verificationTotal: 301,
        trustScoreSource: 'eva-trust-graph',
      },
    });
  });

  it('rejects invalid addresses', async () => {
    const app = new Hono();
    app.route('/api/trust', createTrustRoutes());

    const response = await fetchJson(app, '/api/trust/not-an-address');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid Ethereum address' });
  });
});
