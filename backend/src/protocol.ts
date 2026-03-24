import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../..");

export type ProtocolConfig = {
  app: {
    name: string;
    domain: string;
    siteUrl: string;
    apiBasePath: string;
    healthPath: string;
    agentManifestPath: string;
  };
  chain: {
    name: string;
    id: number;
    rpcUrl: string;
    publicRpcUrl: string;
    explorerUrl: string;
  };
  contracts: {
    deployBlock: number;
    evaToken: `0x${string}`;
    erc8004Identity: `0x${string}`;
    erc8004Reputation: `0x${string}`;
    erc8004Validation: `0x${string}`;
    evaTrustGraph: `0x${string}`;
  };
  agents: {
    eva: {
      id: string;
      wallet: `0x${string}`;
    };
  };
  verifyApi: {
    paymentRequired: boolean;
    paymentScheme: string | null;
    network: string;
    reason: string;
  };
};

export const protocol = JSON.parse(
  readFileSync(resolve(repoRoot, "protocol.config.json"), "utf8"),
) as ProtocolConfig;
