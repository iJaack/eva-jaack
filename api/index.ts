import { handle } from 'hono/dist/adapter/vercel/index.js';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { config } from '../src/config.js';
import { verifyRoutes } from '../src/routes/verify.js';
import { reputationRoutes } from '../src/routes/reputation.js';
import { submitRoutes } from '../src/routes/submit.js';
import { curatorRoutes } from '../src/routes/curators.js';

export const runtime = 'nodejs';

const app = new Hono().basePath('/');

app.use('*', logger());
app.use('*', cors({ origin: '*' }));

app.route('/api/verify', verifyRoutes);
app.route('/api/reputation', reputationRoutes);
app.route('/api/submit', submitRoutes);
app.route('/api/curators', curatorRoutes);
app.get('/api/curator/:id', (c) => curatorRoutes.fetch(c.req.raw));

app.get('/health', (c) =>
  c.json({ status: 'ok', agentId: config.evaAgentId, version: '0.1.0' })
);

export default handle(app);
