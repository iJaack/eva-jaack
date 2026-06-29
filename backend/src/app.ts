import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Context } from 'hono';
import { config } from './config.js';
import { createEvaMcpServer, evaMcpToolDescriptions, evaMcpToolNames } from './mcp-server.js';
import { protocol } from './protocol.js';
import { predictionRoutes } from './routes/predictions.js';
import { getPredictionLayerService } from './services/prediction-layer.js';

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

async function handleMcpRequest(request: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
  const server = createEvaMcpServer();
  await server.connect(transport);
  return transport.handleRequest(request);
}

function mcpDiscovery(c: Context) {
  return c.json({
    status: 'ok',
    service: protocol.app.name,
    transport: 'streamable-http',
    endpoint: `${protocol.app.apiBasePath}/mcp`,
    tools: evaMcpToolNames,
    toolDescriptions: evaMcpToolDescriptions,
    agentSafeBoundary: {
      defaultWriteScope: 'draft_and_anchor_prep_only',
      publishState: 'anchor_prepared_not_published',
      strongerClaimsRequire: ['explicit_approval', 'write_receipt', 'readback_evidence'],
      forbiddenFallbacks: ['direct_rest_writes', 'ui_scraping', 'production_write_routes_without_approval'],
    },
  });
}

function runtimeReadiness(c: Context) {
  const dynamicConfigured = Boolean(process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID?.trim());
  const composeGate = dynamicConfigured ? 'user_connect' : 'configuration';
  const reason = dynamicConfigured ? 'NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is configured' : 'missing NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID';
  return c.json({
    status: 'ok',
    service: protocol.app.name,
    dynamicAuth: {
      configured: dynamicConfigured,
      composeGate,
      reason,
    },
    authoring: {
      ready: dynamicConfigured,
      composeGate,
      requiredEnv: ['NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID'],
      nextAction: dynamicConfigured ? 'Connect with Dynamic before drafting a public thesis.' : 'Configure Dynamic auth before enabling the editor.',
    },
  });
}

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'mcp-session-id', 'Last-Event-ID', 'mcp-protocol-version'],
      exposeHeaders: ['mcp-session-id', 'mcp-protocol-version'],
    }),
  );

  app.get('/health', (c) => {
    const storage = getPredictionLayerService().getStorageReadiness();
    return c.json({ status: 'ok', service: protocol.app.name, agentId: config.evaAgentId, version: '0.2.0', storage });
  });

  app.get('/api/storage-readiness', async (c) => {
    const service = getPredictionLayerService();
    const probe = c.req.query('probe');
    if (probe === '1' || probe === 'true') return c.json(await service.getStorageReadinessWithProbe());
    return c.json(service.getStorageReadiness());
  });

  app.get('/api/runtime-readiness', runtimeReadiness);

  app.get('/.well-known/agent.json', (c) => c.json(agentManifest()));

  app.get('/api/mcp', async (c) => {
    const accept = c.req.header('accept') ?? '';
    if (!accept.includes('text/event-stream')) return mcpDiscovery(c);
    return handleMcpRequest(c.req.raw);
  });
  app.post('/api/mcp', (c) => handleMcpRequest(c.req.raw));
  app.delete('/api/mcp', (c) => handleMcpRequest(c.req.raw));

  app.route('/api', predictionRoutes);

  return app;
}

export const app = createApp();
