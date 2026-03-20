function env(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),

  avalancheRpc: env('AVALANCHE_RPC', 'https://api.avax.network/ext/bc/C/rpc'),

  erc8004Identity: env('ERC8004_IDENTITY', '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432') as `0x${string}`,
  erc8004Reputation: env('ERC8004_REPUTATION', '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63') as `0x${string}`,
  erc8004Validation: env('ERC8004_VALIDATION', '0x5c2B454E34C8E173909EB36FC07DE6143A24ab47') as `0x${string}`,

  evaToken: env('EVA_TOKEN', '0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672') as `0x${string}`,
  evaTrustGraph: env('EVA_TRUST_GRAPH', '0xE84DdD5A03Fa4210c4217436afD2556B348A40a0') as `0x${string}`,

  evaAgentId: env('EVA_AGENT_ID', '1599'),
  evaSovereignWallet: env('EVA_SOVEREIGN_WALLET', '0x0fE61780BD5508b3C99E420662050E5560608cA4') as `0x${string}`,
  evaPrivateKey: env('EVA_PRIVATE_KEY') as `0x${string}`,

  llmProvider: env('EVA_LLM_PROVIDER', 'auto') as 'auto' | 'gateway' | 'anthropic',
  llmModel: env('EVA_LLM_MODEL', env('ANTHROPIC_MODEL', 'claude-opus-4-5')),
  llmGatewayUrl: env('EVA_LLM_GATEWAY_URL'),
  llmGatewayApiKey: env('EVA_LLM_GATEWAY_API_KEY'),
  anthropicApiKey: env('ANTHROPIC_API_KEY'),
  braveApiKey: env('BRAVE_API_KEY'),

  storageProvider: env('EVA_STORAGE_PROVIDER', 'auto') as 'auto' | 'pinata' | 'local',
  pinataJwt: env('PINATA_JWT'),
  pinataEndpoint: env('PINATA_ENDPOINT', 'https://api.pinata.cloud/pinning/pinJSONToIPFS'),

  signerProvider: env('EVA_SIGNER_PROVIDER', 'auto') as 'auto' | 'private-key' | 'evalanche',
  evalancheSignerUrl: env('EVALANCHE_SIGNER_URL'),

  x402FacilitatorUrl: env('X402_FACILITATOR_URL', 'https://facilitator.x402.org'),
  x402RecipientAddress: env('X402_RECIPIENT_ADDRESS') as `0x${string}`,
} as const;
