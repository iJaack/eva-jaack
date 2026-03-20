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

// ── Private-key signer (current production path) ─────────────────────

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

// ── Evalanche HTTP bridge signer ─────────────────────────────────────
//
// Delegates transaction signing to an Evalanche agent-wallet service
// over HTTP. The bridge accepts a JSON write-contract request and returns
// a signed transaction hash once the wallet has broadcast it.
//
// Expected Evalanche bridge API:
//   POST /sign
//   Body: { address, abi, functionName, args, chainId }
//   Response: { txHash: "0x..." }

interface EvalancheBridgeResponse {
  txHash?: string;
  hash?: string;
  error?: string;
}

class EvalancheSignerService implements SignerService {
  readonly provider = 'evalanche';

  constructor(private readonly bridgeUrl: string) {}

  async writeContract({ chain = avalanche, ...request }: WriteContractRequest): Promise<Hex> {
    const res = await fetch(`${this.bridgeUrl}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: request.address,
        abi: request.abi,
        functionName: request.functionName,
        args: request.args,
        chainId: chain.id,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Evalanche bridge request failed: ${res.status} ${body}`);
    }

    const data = await res.json() as EvalancheBridgeResponse;

    if (data.error) {
      throw new Error(`Evalanche bridge returned error: ${data.error}`);
    }

    const txHash = (data.txHash ?? data.hash) as Hex | undefined;
    if (!txHash) {
      throw new Error('Evalanche bridge response missing txHash');
    }

    return txHash;
  }
}

// ── Unavailable fallback ─────────────────────────────────────────────

class UnavailableSignerService implements SignerService {
  readonly provider = 'unavailable';

  async writeContract(): Promise<Hex> {
    throw new Error(
      'No signer configured. Set EVA_SIGNER_PROVIDER=private-key with EVA_PRIVATE_KEY, or EVA_SIGNER_PROVIDER=evalanche with EVALANCHE_SIGNER_URL.',
    );
  }
}

// ── Singleton resolution ─────────────────────────────────────────────

let cachedService: SignerService | null = null;

export function getSignerService(): SignerService {
  if (cachedService) return cachedService;

  if ((config.signerProvider === 'private-key' || config.signerProvider === 'auto') && config.evaPrivateKey) {
    cachedService = new PrivateKeySignerService(config.evaPrivateKey);
    return cachedService;
  }

  if (config.signerProvider === 'evalanche' && config.evalancheSignerUrl) {
    cachedService = new EvalancheSignerService(config.evalancheSignerUrl);
    return cachedService;
  }

  cachedService = new UnavailableSignerService();
  return cachedService;
}
