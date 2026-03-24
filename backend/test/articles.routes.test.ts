import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { createArticleRoutes, warmArticleCache } from '../src/routes/articles.js';
import { fetchJson } from './helpers.js';
import { sampleArticle, sampleReport } from './fixtures.js';

describe('article routes', () => {
  it('lists articles with curator filtering and limit', async () => {
    const app = new Hono();
    const secondArticle = { ...sampleArticle, id: 8, curator: '0x2222222222222222222222222222222222222222' as const };
    app.route('/api/article', createArticleRoutes({
      listArticles: vi.fn().mockResolvedValue([sampleArticle, secondArticle]),
      getArticle: vi.fn(),
      loadJSON: vi.fn(),
    }));

    const response = await fetchJson(app, `/api/article?curator=${sampleArticle.curator}&limit=1`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      count: 1,
      articles: [{ id: sampleArticle.id }],
    });
  });

  it('returns article detail from storage', async () => {
    const app = new Hono();
    app.route('/api/article', createArticleRoutes({
      listArticles: vi.fn(),
      getArticle: vi.fn().mockResolvedValue(sampleArticle),
      loadJSON: vi.fn().mockResolvedValue(sampleReport),
    }));

    const response = await fetchJson(app, `/api/article/${sampleArticle.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      article: { id: sampleArticle.id },
      reportUri: sampleArticle.evidenceURI,
      reportSource: 'evidence-uri',
      report: { title: sampleReport.title },
    });
  });

  it('returns cached article detail when available', async () => {
    const app = new Hono();
    const articleId = 99;
    const article = { ...sampleArticle, id: articleId };
    warmArticleCache(articleId, article.sourceURI, {
      overallScore: sampleReport.overallScore,
      ipfsURI: 'ipfs://cached-report',
      report: sampleReport,
      claimCount: sampleReport.claims.length,
      routescanClaimCount: 1,
    });

    app.route('/api/article', createArticleRoutes({
      listArticles: vi.fn(),
      getArticle: vi.fn().mockResolvedValue(article),
      loadJSON: vi.fn(),
    }));

    const response = await fetchJson(app, `/api/article/${articleId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      reportSource: 'cache',
      reportUri: 'ipfs://cached-report',
    });
  });
});
