import { protocol } from "./protocol.js";

function env(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),

  avalancheRpc: env('AVALANCHE_RPC', protocol.chain.rpcUrl),

  erc8004Identity: env('ERC8004_IDENTITY', protocol.contracts.erc8004Identity) as `0x${string}`,
  erc8004Reputation: env('ERC8004_REPUTATION', protocol.contracts.erc8004Reputation) as `0x${string}`,
  erc8004Validation: env('ERC8004_VALIDATION', protocol.contracts.erc8004Validation) as `0x${string}`,

  evaToken: env('EVA_TOKEN', protocol.contracts.evaToken) as `0x${string}`,
  evaTrustGraph: env('EVA_TRUST_GRAPH', protocol.contracts.evaTrustGraph) as `0x${string}`,
  evaVerificationMarket: env('EVA_VERIFICATION_MARKET', protocol.contracts.evaVerificationMarket) as `0x${string}`,
  evaVerificationReputationAdapter: env(
    'EVA_VERIFICATION_REPUTATION_ADAPTER',
    protocol.contracts.evaVerificationReputationAdapter,
  ) as `0x${string}`,

  evaAgentId: env('EVA_AGENT_ID', protocol.agents.eva.id),
  evaSovereignWallet: env('EVA_SOVEREIGN_WALLET', protocol.agents.eva.wallet) as `0x${string}`,
  evaPrivateKey: env('EVA_PRIVATE_KEY') as `0x${string}`,

  llmProvider: env('EVA_LLM_PROVIDER', 'auto') as 'auto' | 'gateway' | 'anthropic',
  llmModel: env('EVA_LLM_MODEL', env('ANTHROPIC_MODEL', 'claude-opus-4-5')),
  llmGatewayUrl: env('EVA_LLM_GATEWAY_URL'),
  llmGatewayApiKey: env('EVA_LLM_GATEWAY_API_KEY'),
  anthropicApiKey: env('ANTHROPIC_API_KEY'),
  braveApiKey: env('BRAVE_API_KEY'),

  storageProvider: env('EVA_STORAGE_PROVIDER', 'auto') as 'auto' | 'pinata' | 'vercel-blob' | 'local',
  pinataJwt: env('PINATA_JWT'),
  pinataEndpoint: env('PINATA_ENDPOINT', 'https://api.pinata.cloud/pinning/pinJSONToIPFS'),
  ipfsGatewayBase: env('IPFS_GATEWAY_BASE', 'https://gateway.pinata.cloud/ipfs'),
  blobReadWriteToken: env('BLOB_READ_WRITE_TOKEN'),
  storageDir: env('EVA_STORAGE_DIR'),

  signerProvider: env('EVA_SIGNER_PROVIDER', 'auto') as 'auto' | 'private-key' | 'evalanche',
  evalancheSignerUrl: env('EVALANCHE_SIGNER_URL'),

  x402FacilitatorUrl: env('X402_FACILITATOR_URL', 'https://facilitator.x402.org'),
  x402RecipientAddress: env('X402_RECIPIENT_ADDRESS') as `0x${string}`,
} as const;
