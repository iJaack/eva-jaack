function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) throw new Error(`Missing env var: ${key}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),

  // Avalanche
  avalancheRpc: env('AVALANCHE_RPC', 'https://api.avax.network/ext/bc/C/rpc'),

  // ERC-8004 registries (Avalanche C-Chain)
  erc8004Identity: env('ERC8004_IDENTITY', '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432') as `0x${string}`,
  erc8004Reputation: env('ERC8004_REPUTATION', '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63') as `0x${string}`,
  erc8004Validation: env('ERC8004_VALIDATION', '0x5c2B454E34C8E173909EB36FC07DE6143A24ab47') as `0x${string}`,

  // Eva token + EvaTrustGraph
  evaToken: env('EVA_TOKEN', '0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672') as `0x${string}`,
  evaTrustGraph: env('EVA_TRUST_GRAPH', '0xE84DdD5A03Fa4210c4217436afD2556B348A40a0') as `0x${string}`,

  // Eva agent identity
  evaAgentId: env('EVA_AGENT_ID', '1599'),
  evaSovereignWallet: env('EVA_SOVEREIGN_WALLET', '0x0fE61780BD5508b3C99E420662050E5560608cA4') as `0x${string}`,

  // Signing key for on-chain txs
  evaPrivateKey: env('EVA_PRIVATE_KEY', '') as `0x${string}`,

  // External APIs
  anthropicApiKey: env('ANTHROPIC_API_KEY', ''),
  braveApiKey: env('BRAVE_API_KEY', ''),
  pinataJwt: env('PINATA_JWT', ''),

  // x402
  x402FacilitatorUrl: env('X402_FACILITATOR_URL', 'https://facilitator.x402.org'),
  x402RecipientAddress: env('X402_RECIPIENT_ADDRESS', '') as `0x${string}`,
} as const;
