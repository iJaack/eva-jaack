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
    evaThesisProtocol: `0x${string}`;
  };
  tokens: {
    eva: {
      address: `0x${string}`;
      name: string;
      symbol: string;
      decimals: number;
    };
  };
  agents: {
    eva: {
      id: string;
      wallet: `0x${string}`;
    };
  };
  channels: {
    x: {
      enabled: boolean;
      handles: string[];
      acknowledgementSlaSeconds: number;
      sourcePlatforms: string[];
    };
  };
};

export const protocol = JSON.parse(
  readFileSync(resolve(repoRoot, "protocol.config.json"), "utf8"),
) as ProtocolConfig;
