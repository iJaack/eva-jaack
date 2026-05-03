import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config.js';
import { protocol } from './protocol.js';
import { verifyRoutes } from './routes/verify.js';
import { reputationRoutes } from './routes/reputation.js';
import { submitRoutes } from './routes/submit.js';
import { curatorRoutes } from './routes/curators.js';
import { trustRoutes } from './routes/trust.js';
import { articleRoutes } from './routes/articles.js';
import { analyticsRoutes } from './routes/analytics.js';
import { claimRoutes } from './routes/claims.js';
import { predictionRoutes } from './routes/predictions.js';

function agentManifest() {
  return {
    agentId: config.evaAgentId,
    agentRegistry: `eip155:43114:${config.erc8004Identity}`,
    agentURI: `${protocol.app.siteUrl}${protocol.app.agentManifestPath}`,
    x402Support: false,
    supportedTrust: ['erc-8004-reputation-v1'],
    services: [{ type: 'agentWallet', id: `eip155:43114:${config.evaSovereignWallet}` }],
    signers: [{ agentWallet: `eip155:43114:${config.evaSovereignWallet}` }],
    feedbackAggregator: `${protocol.app.siteUrl}${protocol.app.apiBasePath}/reputation/feedback`,
  };
}

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use('*', cors({ origin: '*' }));

  app.get('/health', (c) =>
    c.json({ status: 'ok', service: protocol.app.name, agentId: config.evaAgentId, version: '0.2.0' }),
  );

  app.get('/.well-known/agent.json', (c) => c.json(agentManifest()));

  app.route('/api/verify', verifyRoutes);
  app.route('/api/reputation', reputationRoutes);
  app.route('/api/submit', submitRoutes);
  app.route('/api/curators', curatorRoutes);
  app.route('/api/curator', curatorRoutes);
  app.route('/api/trust', trustRoutes);
  app.route('/api/article', articleRoutes);
  app.route('/api/articles', articleRoutes);
  app.route('/api/claims', claimRoutes);
  app.route('/api/analytics', analyticsRoutes);
  app.route('/api', predictionRoutes);

  return app;
}

export const app = createApp();
