import { protocol } from "./protocol.js";

function env(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),

  avalancheRpc: env('AVALANCHE_RPC', protocol.chain.rpcUrl),

  evaThesisProtocol: env('EVA_THESIS_PROTOCOL', protocol.contracts.evaThesisProtocol) as `0x${string}`,

  evaAgentId: env('EVA_AGENT_ID', protocol.agents.eva.id),
  evaSovereignWallet: env('EVA_SOVEREIGN_WALLET', protocol.agents.eva.wallet) as `0x${string}`,

  storageDir: env('EVA_STORAGE_DIR'),
  predictionBlobPath: env('EVA_PREDICTION_BLOB_PATH', 'eva-predictions/index.json'),
  blobReadWriteToken: env('BLOB_READ_WRITE_TOKEN'),
} as const;
