import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { createVerifyRoutes } from '../src/routes/verify.js';
import { fetchJson } from './helpers.js';
import { sampleArticle, sampleReport } from './fixtures.js';

describe('verify routes', () => {
  it('rejects missing url', async () => {
    const app = new Hono();
    app.route('/api/verify', createVerifyRoutes());

    const response = await fetchJson(app, '/api/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Missing required field: url' });
  });

  it('returns verification payload and article match', async () => {
    const app = new Hono();
    app.route('/api/verify', createVerifyRoutes({
      runVerificationPipeline: vi.fn().mockResolvedValue({
        overallScore: 88,
        ipfsURI: 'ipfs://report',
        report: sampleReport,
        claimCount: 1,
        routescanClaimCount: 1,
      }),
      findArticleBySourceUri: vi.fn().mockResolvedValue(sampleArticle),
    }));

    const response = await fetchJson(app, '/api/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: sampleArticle.sourceURI }),
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      articleMatch: {
        articleId: sampleArticle.id,
        matchesExistingSubmission: true,
      },
      verification: {
        overallScore: 88,
        claimCount: 1,
        routescanClaimCount: 1,
        ipfsURI: 'ipfs://report',
      },
    });
  });
});
