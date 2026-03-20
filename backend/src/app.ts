import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config.js';
import { verifyRoutes } from './routes/verify.js';
import { reputationRoutes } from './routes/reputation.js';
import { submitRoutes } from './routes/submit.js';
import { curatorRoutes } from './routes/curators.js';
import { trustRoutes } from './routes/trust.js';

function agentManifest() {
  return {
    agentId: config.evaAgentId,
    agentRegistry: `eip155:43114:${config.erc8004Identity}`,
    agentURI: 'https://eva.jaack.me/.well-known/agent.json',
    x402Support: true,
    supportedTrust: ['erc-8004-reputation-v1'],
    services: [{ type: 'agentWallet', id: `eip155:43114:${config.evaSovereignWallet}` }],
    signers: [{ agentWallet: `eip155:43114:${config.evaSovereignWallet}` }],
    feedbackAggregator: 'https://eva.jaack.me/api/reputation/feedback',
  };
}

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use('*', cors({ origin: '*' }));

  app.get('/health', (c) =>
    c.json({ status: 'ok', service: 'eva-protocol', agentId: config.evaAgentId, version: '0.1.0' }),
  );

  app.get('/.well-known/agent.json', (c) => c.json(agentManifest()));

  app.route('/api/verify', verifyRoutes);
  app.route('/api/reputation', reputationRoutes);
  app.route('/api/submit', submitRoutes);
  app.route('/api/curators', curatorRoutes);
  app.route('/api/curator', curatorRoutes);
  app.route('/api/trust', trustRoutes);

  return app;
}

export const app = createApp();
