import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Context } from 'hono';

export const runtime = 'nodejs';

const app = new Hono();
app.use('*', logger());
app.use('*', cors({ origin: '*' }));

app.get('/health', (c: Context) =>
  c.json({ status: 'ok', service: 'eva-protocol', agentId: '1599', version: '0.1.0' })
);

app.get('/.well-known/agent.json', (c: Context) =>
  c.json({
    agentId: '1599',
    agentRegistry: 'eip155:43114:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    agentURI: 'https://eva.jaack.me/.well-known/agent.json',
    x402Support: true,
    supportedTrust: ['erc-8004-reputation-v1'],
    services: [{ type: 'agentWallet', id: 'eip155:43114:0x0fE61780BD5508b3C99E420662050E5560608cA4' }],
    signers: [{ agentWallet: 'eip155:43114:0x0fE61780BD5508b3C99E420662050E5560608cA4' }],
    feedbackAggregator: 'https://eva.jaack.me/api/reputation/feedback',
  })
);

app.all('/api/*', async (c: Context) => {
  const path = new URL(c.req.url).pathname;
  if (path.startsWith('/api/verify')) {
    const { verifyRoutes } = await import('../backend/src/routes/verify.js');
    return verifyRoutes.fetch(c.req.raw);
  }
  if (path.startsWith('/api/reputation')) {
    const { reputationRoutes } = await import('../backend/src/routes/reputation.js');
    return reputationRoutes.fetch(c.req.raw);
  }
  if (path.startsWith('/api/submit')) {
    const { submitRoutes } = await import('../backend/src/routes/submit.js');
    return submitRoutes.fetch(c.req.raw);
  }
  if (path.startsWith('/api/curator')) {
    const { curatorRoutes } = await import('../backend/src/routes/curators.js');
    return curatorRoutes.fetch(c.req.raw);
  }
  return c.json({ error: 'Not found' }, 404);
});

export default app.fetch;
