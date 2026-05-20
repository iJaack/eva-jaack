import {
  createWalletClient,
  http,
  type Abi,
  type Account,
  type Chain,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { avalanche } from 'viem/chains';
import { config } from '../config.js';

export interface WriteContractRequest {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  chain?: Chain;
}

export interface SignerService {
  provider: string;
  writeContract(request: WriteContractRequest): Promise<Hex>;
}

function createWriter(account: Account, chain: Chain) {
  return createWalletClient({
    account,
    chain,
    transport: http(config.avalancheRpc),
  });
}

// ── Private-key signer (explicit env path) ────────────────────────────

class PrivateKeySignerService implements SignerService {
  readonly provider = 'private-key';
  private readonly account: Account;

  constructor(privateKey: `0x${string}`) {
    this.account = privateKeyToAccount(privateKey);
  }

  async writeContract({ chain = avalanche, ...request }: WriteContractRequest): Promise<Hex> {
    const wallet = createWriter(this.account, chain);

    return wallet.writeContract({
      ...request,
      chain,
      // viem type inference is strict around functionName/abi coupling here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }
}

// ── Evalanche signer (local SDK + encrypted keystore) ────────────────

class EvalancheSignerService implements SignerService {
  readonly provider = 'evalanche';

  async writeContract({ chain = avalanche, ...request }: WriteContractRequest): Promise<Hex> {
    const { getEvalancheSigner, getSignerKey } = await import('./signing.js');
    const [{ address, secretsSource }, privateKey] = await Promise.all([
      getEvalancheSigner(),
      getSignerKey(),
    ]);

    const account = privateKeyToAccount(privateKey);
    const wallet = createWriter(account, chain);

    console.log(`[signer] Evalanche signer ready — address=${address} source=${secretsSource}`);

    return wallet.writeContract({
      ...request,
      chain,
      // viem type inference is strict around functionName/abi coupling here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }
}

// ── Unavailable fallback ─────────────────────────────────────────────

class UnavailableSignerService implements SignerService {
  readonly provider = 'unavailable';

  async writeContract(): Promise<Hex> {
    throw new Error(
      'No signer configured. Set EVA_SIGNER_PROVIDER=private-key with EVA_PRIVATE_KEY, or use EVA_SIGNER_PROVIDER=evalanche and let Evalanche resolve credentials from OpenClaw secrets, env, or its encrypted keystore.',
    );
  }
}

// ── Singleton resolution ─────────────────────────────────────────────

let cachedService: SignerService | null = null;

export function getSignerService(): SignerService {
  if (cachedService) return cachedService;

  if (config.signerProvider === 'private-key' && config.evaPrivateKey) {
    cachedService = new PrivateKeySignerService(config.evaPrivateKey);
    return cachedService;
  }

  if (config.signerProvider === 'evalanche') {
    cachedService = new EvalancheSignerService();
    return cachedService;
  }

  if (config.signerProvider === 'auto') {
    cachedService = config.evaPrivateKey
      ? new PrivateKeySignerService(config.evaPrivateKey)
      : new EvalancheSignerService();
    return cachedService;
  }

  cachedService = new UnavailableSignerService();
  return cachedService;
}
