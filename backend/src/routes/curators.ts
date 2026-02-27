import { Hono } from 'hono';

export const curatorRoutes = new Hono();

// ── GET /api/curators ──────────────────────────────────────────────────

curatorRoutes.get('/', async (c) => {
  return c.json([]);
});

// ── GET /api/curator/:id ───────────────────────────────────────────────

curatorRoutes.get('/:id', async (c) => {
  return c.json([]);
});
