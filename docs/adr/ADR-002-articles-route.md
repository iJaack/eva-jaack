# ADR-002: Article Verification Route + In-Memory Cache

**Status:** Accepted  
**Date:** 2026-03-23  
**Author:** Eva Protocol CEO

---

## Context

The backend needs to serve article verification results to the frontend and to external agents. Verification is expensive (LLM call + claim extraction + IPFS upload), so re-running the full pipeline on every request is unacceptable. We need a caching strategy that keeps Phase 1 simple without introducing operational overhead.

## Decision

Implement `GET /api/article/:id` backed by a per-process in-memory LRU cache.

**Cache behaviour:**
- Max 100 entries (LRU eviction on insertion)
- 1-hour TTL (stale entries evicted on read)
- Keyed by `articleId` (integer)

**Request flow:**
1. If `articleId` is in cache and not stale → return cached result immediately (no pipeline re-run)
2. If not in cache → require `?url=<url>` query param → run `runVerificationPipeline()` → cache result → return
3. Cache is warmed proactively by the submit route via `warmArticleCache()` so GET requests after a fresh submit always hit cache

**Endpoints exposed:**
- `GET /api/article/:id?url=<url>` — verify on demand or serve from cache
- `GET /api/article` — list all cached articles (debug/admin use)

## Consequences

**Good:**
- Zero infrastructure dependencies — no Redis, no DB for Phase 1
- Sub-millisecond reads for cached articles
- Pipeline runs only once per article per hour

**Bad:**
- Cache is per-process and lost on restart — acceptable for Phase 1 with low curator volume
- In-memory: not suitable beyond ~100 active articles or multi-process Vercel deployments
- Stale-on-restart means first request after deploy always re-runs the pipeline

## Migration path

When curator volume warrants it (>100 active articles or multi-instance deployment): replace in-memory cache with a Redis or KV store. The `warmArticleCache()` and `cacheGet()` interfaces are already abstraction boundaries — swap the implementation behind them.

## Related

- `backend/src/routes/articles.ts` — implementation
- `backend/src/services/pipeline.ts` — pipeline called on cache miss
- ADR-001 — signing architecture
