import { Hono } from 'hono';
import { cors } from 'hono/cors';

export const runtime = 'nodejs';

const app = new Hono();
app.use('*', cors({ origin: '*' }));

app.get('/health', (c) =>
  c.json({ status: 'ok', service: 'eva-protocol', agentId: '1599', version: '0.1.0' })
);

app.get('/.well-known/agent.json', (c) =>
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

// Stub routes — full pipeline routes added once backend module resolution is confirmed
app.post('/api/verify', (c) => c.json({ error: 'Payment required', amount: '0.05', currency: 'USDC', network: 'base' }, 402));
app.post('/api/reputation/feedback', (c) => c.json({ error: 'Not yet implemented' }, 501));
app.post('/api/submit', (c) => c.json({ error: 'Not yet implemented' }, 501));
app.get('/api/curators', (c) => c.json([]));

export default app.fetch;
