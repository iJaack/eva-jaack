import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { config } from '../backend/src/config.js';
import { verifyRoutes } from '../backend/src/routes/verify.js';
import { reputationRoutes } from '../backend/src/routes/reputation.js';
import { submitRoutes } from '../backend/src/routes/submit.js';
import { curatorRoutes } from '../backend/src/routes/curators.js';
import { trustRoutes } from '../backend/src/routes/trust.js';

const app = new Hono();
app.use('*', cors({ origin: '*' }));

app.get('/health', (c) =>
  c.json({ status: 'ok', service: 'eva-protocol', agentId: config.evaAgentId, version: '0.1.0' })
);

app.get('/.well-known/agent.json', (c) =>
  c.json({
    agentId: config.evaAgentId,
    agentRegistry: `eip155:43114:${config.erc8004Identity}`,
    agentURI: 'https://eva.jaack.me/.well-known/agent.json',
    x402Support: true,
    supportedTrust: ['erc-8004-reputation-v1'],
    services: [{ type: 'agentWallet', id: `eip155:43114:${config.evaSovereignWallet}` }],
    signers: [{ agentWallet: `eip155:43114:${config.evaSovereignWallet}` }],
    feedbackAggregator: 'https://eva.jaack.me/api/reputation/feedback',
  })
);

app.route('/api/verify', verifyRoutes);
app.route('/api/reputation', reputationRoutes);
app.route('/api/submit', submitRoutes);
app.route('/api/curators', curatorRoutes);
app.route('/api/curator', curatorRoutes);
app.route('/api/trust', trustRoutes);

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
