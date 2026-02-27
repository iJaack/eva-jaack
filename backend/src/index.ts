import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from '@hono/node-server/serve-static';

import { config } from './config.js';
import { verifyRoutes } from './routes/verify.js';
import { reputationRoutes } from './routes/reputation.js';
import { submitRoutes } from './routes/submit.js';
import { curatorRoutes } from './routes/curators.js';

const app = new Hono();

// ── Middleware ──────────────────────────────────────────────────────────
app.use('*', logger());
app.use('*', cors());

// ── Static (.well-known/agent.json etc.) ───────────────────────────────
app.use('/.well-known/*', serveStatic({ root: './public' }));

// ── Routes ─────────────────────────────────────────────────────────────
app.route('/api/verify', verifyRoutes);
app.route('/api/reputation', reputationRoutes);
app.route('/api/submit', submitRoutes);
app.route('/api/curators', curatorRoutes);
app.get('/api/curator/:id', (c) => curatorRoutes.fetch(c.req.raw));

// ── Health ─────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', agentId: config.evaAgentId }));

// ── Start ──────────────────────────────────────────────────────────────
console.log(`Eva backend listening on :${config.port}`);
serve({ fetch: app.fetch, port: config.port });
