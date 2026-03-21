// ── GET /api/article/:id — on-demand article verification + in-memory cache ──
//
// Cache strategy: simple in-memory LRU (max 100 entries, 1h TTL).
// Backend is stateless — cache is per-process. Good enough for Phase 1.
// Replace with Redis or DB when curator volume warrants it.

import { Hono } from 'hono';
import { runVerificationPipeline } from '../services/pipeline.js';
import type { PipelineResult } from '../services/pipeline.js';

export const articleRoutes = new Hono();

const CACHE_MAX = 100;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  result: PipelineResult;
  url: string;
  cachedAt: number;
}

// articleId → CacheEntry
const cache = new Map<number, CacheEntry>();
// insertion-order tracking for LRU eviction
const insertionOrder: number[] = [];

function evictIfNeeded(): void {
  while (insertionOrder.length >= CACHE_MAX) {
    const oldest = insertionOrder.shift();
    if (oldest !== undefined) cache.delete(oldest);
  }
}

function cacheSet(articleId: number, url: string, result: PipelineResult): void {
  evictIfNeeded();
  cache.set(articleId, { result, url, cachedAt: Date.now() });
  insertionOrder.push(articleId);
}

function cacheGet(articleId: number): CacheEntry | null {
  const entry = cache.get(articleId);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(articleId);
    return null;
  }
  return entry;
}

// ── GET /api/article/:id?url=<url> ────────────────────────────────────
//
// If the article is cached: return cached result immediately.
// If not cached: require `url` query param, run pipeline, cache + return.

articleRoutes.get('/:id', async (c) => {
  const rawId = c.req.param('id');
  const articleId = parseInt(rawId, 10);

  if (isNaN(articleId) || articleId < 0) {
    return c.json({ error: 'Invalid article ID' }, 400);
  }

  const cached = cacheGet(articleId);
  if (cached) {
    return c.json({
      articleId,
      url: cached.url,
      cached: true,
      cachedAt: new Date(cached.cachedAt).toISOString(),
      overallScore: cached.result.overallScore,
      claimCount: cached.result.claimCount,
      routescanClaimCount: cached.result.routescanClaimCount,
      ipfsURI: cached.result.ipfsURI,
      report: cached.result.report,
    });
  }

  const url = c.req.query('url');
  if (!url) {
    return c.json(
      { error: 'Article not in cache. Provide ?url=<article_url> to verify on demand.' },
      404,
    );
  }

  try {
    console.log(`[articles] On-demand verification: articleId=${articleId} url=${url}`);
    const result = await runVerificationPipeline(url, articleId);
    cacheSet(articleId, url, result);

    return c.json({
      articleId,
      url,
      cached: false,
      cachedAt: new Date().toISOString(),
      overallScore: result.overallScore,
      claimCount: result.claimCount,
      routescanClaimCount: result.routescanClaimCount,
      ipfsURI: result.ipfsURI,
      report: result.report,
    });
  } catch (e) {
    console.error(`[articles] Pipeline failed: ${e}`);
    return c.json({ error: 'Verification pipeline failed', details: String(e) }, 500);
  }
});

// ── POST /api/article/:id/cache — pre-warm cache from submit route ────
// Called internally by submit route after a successful pipeline run.

export function warmArticleCache(articleId: number, url: string, result: PipelineResult): void {
  cacheSet(articleId, url, result);
}

// ── GET /api/article — list cached articles ───────────────────────────

articleRoutes.get('/', (c) => {
  const entries = Array.from(cache.entries()).map(([id, entry]) => ({
    articleId: id,
    url: entry.url,
    overallScore: entry.result.overallScore,
    claimCount: entry.result.claimCount,
    cachedAt: new Date(entry.cachedAt).toISOString(),
    expiresAt: new Date(entry.cachedAt + CACHE_TTL_MS).toISOString(),
  }));

  return c.json({ count: entries.length, articles: entries });
});
