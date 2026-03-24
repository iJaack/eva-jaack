import { Hono } from 'hono';
import type { ArticleDetailResponse, ArticleListResponse } from '../lib/api-types.js';
import { runVerificationPipeline } from '../services/pipeline.js';
import type { PipelineResult } from '../services/pipeline.js';
import { getStorageService } from '../services/storage.js';
import { getArticle, listArticles } from '../services/trust-graph.js';

const CACHE_MAX = 100;
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  result: PipelineResult;
  url: string;
  cachedAt: number;
}

const cache = new Map<number, CacheEntry>();
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

type ArticleRouteDeps = {
  listArticles: typeof listArticles;
  getArticle: typeof getArticle;
  loadJSON: <T>(uri: string) => Promise<T | null>;
};

export function createArticleRoutes(
  deps: ArticleRouteDeps = {
    listArticles,
    getArticle,
    loadJSON: <T>(uri: string) => getStorageService().loadJSON<T>(uri),
  },
) {
  const articleRoutes = new Hono();

  articleRoutes.get('/', async (c) => {
    const curator = c.req.query('curator')?.toLowerCase();
    const limit = Number.parseInt(c.req.query('limit') ?? '0', 10);
    const articles = await deps.listArticles();

    const filtered = articles.filter((article) => !curator || article.curator.toLowerCase() === curator);
    const sliced = Number.isFinite(limit) && limit > 0 ? filtered.slice(0, limit) : filtered;

    return c.json<ArticleListResponse>({
      count: filtered.length,
      chain: 'avalanche',
      chainId: 43114,
      articles: sliced,
    });
  });

  articleRoutes.get('/:id', async (c) => {
    const articleId = Number.parseInt(c.req.param('id'), 10);
    if (!Number.isFinite(articleId) || articleId <= 0) {
      return c.json({ error: 'Invalid article ID' }, 400);
    }

    const article = await deps.getArticle(articleId);
    if (!article) {
      return c.json({ error: 'Article not found' }, 404);
    }

    const cached = cacheGet(articleId);
    if (cached) {
      return c.json<ArticleDetailResponse>({
        chain: 'avalanche',
        chainId: 43114,
        article,
        report: cached.result.report,
        reportUri: cached.result.ipfsURI,
        reportSource: 'cache',
      });
    }

    let report: ArticleDetailResponse['report'] = null;
    if (article.evidenceURI) {
      try {
        report = await deps.loadJSON<ArticleDetailResponse['report']>(article.evidenceURI);
      } catch (error) {
        console.warn(`[articles] Failed to load report for article=${articleId}: ${error}`);
      }
    }

    return c.json<ArticleDetailResponse>({
      chain: 'avalanche',
      chainId: 43114,
      article,
      report,
      reportUri: article.evidenceURI || null,
      reportSource: report ? 'evidence-uri' : 'none',
    });
  });

  return articleRoutes;
}

export const articleRoutes = createArticleRoutes();

export function warmArticleCache(articleId: number, url: string, result: PipelineResult): void {
  cacheSet(articleId, url, result);
}
