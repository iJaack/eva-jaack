import { Hono } from 'hono';
import { runVerificationPipeline } from '../services/pipeline.js';
import { warmArticleCache } from './articles.js';

export const submitRoutes = new Hono();

// ── POST /api/submit — run full verification pipeline ─────────────────

interface SubmitBody {
  curatorAgentId: number;
  articleHash: string;
  url: string;
  articleId: number;
}

submitRoutes.post('/', async (c) => {
  const body = await c.req.json<SubmitBody>();

  if (!body.url) {
    return c.json({ error: 'Missing required field: url' }, 400);
  }
  if (body.articleId === undefined) {
    return c.json({ error: 'Missing required field: articleId' }, 400);
  }

  console.log(`[submit] Verification request: url=${body.url} articleId=${body.articleId} curator=${body.curatorAgentId}`);

  try {
    const result = await runVerificationPipeline(body.url, body.articleId);
    warmArticleCache(body.articleId, body.url, result);

    return c.json({
      success: true,
      overallScore: result.overallScore,
      ipfsURI: result.ipfsURI,
      claimCount: result.claimCount,
      routescanClaimCount: result.routescanClaimCount,
      report: result.report,
    });
  } catch (e) {
    console.error(`[submit] Pipeline failed: ${e}`);
    return c.json(
      { error: 'Verification pipeline failed', details: String(e) },
      500,
    );
  }
});
