import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config.js';
import { protocol } from './protocol.js';
import { predictionRoutes } from './routes/predictions.js';

function agentManifest() {
  return {
    agentId: config.evaAgentId,
    agentURI: `${protocol.app.siteUrl}${protocol.app.agentManifestPath}`,
    services: [{ type: 'agentWallet', id: `eip155:43114:${config.evaSovereignWallet}` }],
    signers: [{ agentWallet: `eip155:43114:${config.evaSovereignWallet}` }],
    thesisProtocol: {
      contract: `eip155:43114:${config.evaThesisProtocol}`,
      mcp: `${protocol.app.siteUrl}${protocol.app.apiBasePath}/mcp`,
      localMcp: 'eva-mcp stdio',
      writePolicy: 'X identity plus wallet required; transaction broadcasts require explicit approval.',
    },
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

  app.route('/api', predictionRoutes);

  return app;
}

export const app = createApp();
