import { Hono } from 'hono';

export const submitRoutes = new Hono();

// ── POST /api/submit — stub ────────────────────────────────────────────

submitRoutes.post('/', async (c) => {
  return c.json({ error: 'Article submission not yet implemented' }, 501);
});
