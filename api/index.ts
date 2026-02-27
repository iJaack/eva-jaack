import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { IncomingMessage, ServerResponse } from 'node:http';

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

app.post('/api/verify', (c) => c.json({ error: 'Payment required', amount: '0.05', currency: 'USDC', network: 'base' }, 402));
app.post('/api/reputation/feedback', (c) => c.json({ error: 'Not yet implemented' }, 501));
app.post('/api/submit', (c) => c.json({ error: 'Not yet implemented' }, 501));
app.get('/api/curators', (c) => c.json([]));

function readBody(req: IncomingMessage): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const chunks: Uint8Array[] = [];
    req.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    req.on('end', () => {
      const total = chunks.reduce((acc, c) => acc + c.length, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) { merged.set(c, offset); offset += c.length; }
      resolve(merged);
    });
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = `https://${req.headers.host}${req.url}`;
  const headers = new Headers(req.headers as Record<string, string>);
  let body: BodyInit | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await readBody(req) as unknown as BodyInit;
  }
  const response = await app.fetch(new Request(url, { method: req.method, headers, body }));
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  const arr = await response.arrayBuffer();
  res.end(new Uint8Array(arr));
}
