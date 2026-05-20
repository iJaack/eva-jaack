import { Hono } from 'hono';
import type { VerifyResponse } from '../lib/api-types.js';
import { protocol } from '../protocol.js';
import { findArticleBySourceUri } from '../services/trust-graph.js';
import { runVerificationPipeline } from '../services/pipeline.js';

type VerifyRouteDeps = {
  runVerificationPipeline: typeof runVerificationPipeline;
  findArticleBySourceUri: typeof findArticleBySourceUri;
};

export function createVerifyRoutes(
  deps: VerifyRouteDeps = {
    runVerificationPipeline,
    findArticleBySourceUri,
  },
) {
  const verifyRoutes = new Hono();

  verifyRoutes.post('/', async (c) => {
    let body: { url?: string; content?: string };
    try {
      body = await c.req.json<{ url?: string; content?: string }>();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    if (!body.url) {
      return c.json({ error: 'Missing required field: url' }, 400);
    }

    try {
      const [result, articleMatch] = await Promise.all([
        deps.runVerificationPipeline(body.url),
        deps.findArticleBySourceUri(body.url),
      ]);

      return c.json<VerifyResponse>({
        success: true,
        payment: {
          required: protocol.verifyApi.paymentRequired,
          network: protocol.verifyApi.network,
          scheme: protocol.verifyApi.paymentScheme,
          reason: protocol.verifyApi.reason,
        },
        articleMatch: {
          articleId: articleMatch?.id ?? null,
          matchesExistingSubmission: Boolean(articleMatch),
        },
        verification: {
          overallScore: result.overallScore,
          claimCount: result.claimCount,
          routescanClaimCount: result.routescanClaimCount,
          ipfsURI: result.ipfsURI,
          report: result.report,
        },
      });
    } catch (e) {
      console.error(`[verify] Pipeline failed: ${e}`);
      return c.json(
        { error: 'Verification pipeline failed', details: String(e) },
        500,
      );
    }
  });

  return verifyRoutes;
}

export const verifyRoutes = createVerifyRoutes();
