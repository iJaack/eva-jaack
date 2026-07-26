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
      writePolicy: 'Public X handle plus a self-custodial external wallet required; transaction broadcasts require explicit approval.',
      walletBoundary: {
        mode: protocol.evaUsage.walletMode,
        embeddedWallets: protocol.evaUsage.embeddedWallets,
        serverCanSign: protocol.evaUsage.serverCanSign,
      },
    },
    platformToken: {
      contract: `eip155:${protocol.chain.id}:${config.evaToken}`,
      usageBurner: `eip155:${protocol.chain.id}:${config.evaUsageBurner}`,
      symbol: protocol.tokens.eva.symbol,
      liveCapabilities: [
        'contract_metadata',
        'holder_balance_readback',
        'author_context',
        'usage_retirement',
        'usage_receipts',
        'paid_thesis_publication',
        'paid_thesis_revisions',
        'paid_agent_proof_bundles',
      ],
      paymentProtocol: {
        type: 'direct_erc20_allowance',
        quoteEndpoint: `${protocol.app.siteUrl}${protocol.app.apiBasePath}/eva/usage/quote`,
        spender: `eip155:${protocol.chain.id}:${config.evaUsageBurner}`,
        flow: ['approve_exact_amount', 'retireForUsage', 'verify_EvaUsedAndRetired'],
        permit2: false,
        serverCanSpendWalletFunds: false,
      },
      supplyAccounting: 'Tokens used through Eva are transferred to 0xdead; legacy totalSupply remains unchanged.',
      priceBoundary: 'Usage can create token demand and circulating-supply pressure; price appreciation is not guaranteed.',
      notActive: ['staking', 'balance_based_access', 'yield', 'governance', 'trade_execution'],
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
      mcpOutputCeiling: 'anchor_prepared',
      safeResultVerbs: ['inspected', 'prepared', 'calldata_ready'],
      storageClaimDefault: 'storage_not_assessed',
      strongerClaimsRequire: ['explicit_approval', 'write_receipt', 'readback_evidence'],
      requiredForSubmitted: ['explicit_approval', 'tx_hash'],
      requiredForPublishedLive: ['approved_public_path', 'write_receipt', 'readback_evidence'],
      notEvidenceForStrongerClaims: [
        'route_url',
        'bearer_token',
        'browser_session',
        'green_deploy',
        'issue_status',
        'pr_status',
        'anchor_preparation_id',
        'prepared_calldata',
      ],
      forbiddenFallbacks: ['direct_rest_writes', 'ui_scraping', 'production_write_routes_without_approval'],
      evaConsumption: {
        protocol: 'direct_erc20_allowance',
        walletMode: protocol.evaUsage.walletMode,
        embeddedWallets: protocol.evaUsage.embeddedWallets,
        permit2: false,
        serverCanSpendWalletFunds: false,
        paidOutputs: ['public_thesis', 'public_revision', 'agent_proof_bundle'],
      },
    },
  });
}

function runtimeReadiness(c: Context) {
  return c.json({
    status: 'ok',
    service: protocol.app.name,
    walletConnection: {
      ready: true,
      mode: protocol.evaUsage.walletMode,
      composeGate: 'self_custody_wallet',
      embeddedWallets: protocol.evaUsage.embeddedWallets,
      serverCanSign: protocol.evaUsage.serverCanSign,
      reason: 'EIP-1193 self-custodial wallet connection is built into the client',
    },
    authoring: {
      ready: true,
      composeGate: 'self_custody_wallet',
      requiredEnv: [],
      nextAction: 'Connect your own EVM wallet and add the public X handle for the thesis.',
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
