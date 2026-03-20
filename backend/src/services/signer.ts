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

class PrivateKeySignerService implements SignerService {
  readonly provider = 'private-key';
  private readonly account: Account;

  constructor(privateKey: `0x${string}`) {
    this.account = privateKeyToAccount(privateKey);
  }

  async writeContract({ chain = avalanche, ...request }: WriteContractRequest): Promise<Hex> {
    const wallet = createWalletClient({
      account: this.account,
      chain,
      transport: http(config.avalancheRpc),
    });

    return wallet.writeContract({
      ...request,
      chain,
      // viem type inference is strict around functionName/abi coupling here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }
}

class EvalancheSignerService implements SignerService {
  readonly provider = 'evalanche';

  async writeContract(): Promise<Hex> {
    throw new Error(
      'Evalanche signer provider selected but runtime bridge is not wired yet. Use EVA_SIGNER_PROVIDER=private-key as the compatibility path for now.',
    );
  }
}

class UnavailableSignerService implements SignerService {
  readonly provider = 'unavailable';

  async writeContract(): Promise<Hex> {
    throw new Error(
      'No signer configured. Set EVA_SIGNER_PROVIDER=private-key with EVA_PRIVATE_KEY, or wire the Evalanche runtime provider.',
    );
  }
}

let cachedService: SignerService | null = null;

export function getSignerService(): SignerService {
  if (cachedService) return cachedService;

  if ((config.signerProvider === 'private-key' || config.signerProvider === 'auto') && config.evaPrivateKey) {
    cachedService = new PrivateKeySignerService(config.evaPrivateKey);
    return cachedService;
  }

  if (config.signerProvider === 'evalanche') {
    cachedService = new EvalancheSignerService();
    return cachedService;
  }

  cachedService = new UnavailableSignerService();
  return cachedService;
}
