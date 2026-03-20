import { createHash } from 'node:crypto';
import { config } from '../config.js';

export interface StorageService {
  provider: string;
  uploadJSON(data: object, options?: { name?: string }): Promise<string>;
}

// ── Pinata (IPFS pinning service) ────────────────────────────────────

class PinataStorageService implements StorageService {
  readonly provider = 'pinata';

  constructor(
    private readonly jwt: string,
    private readonly endpoint: string,
  ) {}

  async uploadJSON(data: object, options?: { name?: string }): Promise<string> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.jwt}`,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: options?.name ?? `eva-verification-${Date.now()}`,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Pinata upload failed: ${res.status} ${await res.text()}`);
    }

    const result = await res.json() as { IpfsHash: string };
    return `ipfs://${result.IpfsHash}`;
  }
}

// ── Local in-memory storage (development fallback) ───────────────────
//
// Produces deterministic content-addressed URIs without network calls.
// Reports are kept in memory for the lifetime of the process so they
// can be retrieved during development/testing.

class LocalStorageService implements StorageService {
  readonly provider = 'local';
  private store = new Map<string, object>();

  async uploadJSON(data: object): Promise<string> {
    const content = JSON.stringify(data);
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 46);
    const cid = `bafylocaldev${hash}`;
    this.store.set(cid, data);
    console.log(`[storage:local] Stored report as ${cid} (${content.length} bytes)`);
    return `ipfs://${cid}`;
  }
}

// ── Unavailable fallback ─────────────────────────────────────────────

class UnavailableStorageService implements StorageService {
  readonly provider = 'unavailable';

  async uploadJSON(): Promise<string> {
    throw new Error(
      'No storage provider configured. Set EVA_STORAGE_PROVIDER=pinata and provide PINATA_JWT, or use EVA_STORAGE_PROVIDER=local for development.',
    );
  }
}

// ── Singleton resolution ─────────────────────────────────────────────

let cachedService: StorageService | null = null;

export function getStorageService(): StorageService {
  if (cachedService) return cachedService;

  const provider = config.storageProvider;

  if ((provider === 'pinata' || provider === 'auto') && config.pinataJwt) {
    cachedService = new PinataStorageService(config.pinataJwt, config.pinataEndpoint);
    return cachedService;
  }

  if (provider === 'local') {
    cachedService = new LocalStorageService();
    return cachedService;
  }

  // In auto mode without Pinata credentials, fall back to local storage
  if (provider === 'auto') {
    console.warn('[storage] No Pinata credentials found, falling back to local storage');
    cachedService = new LocalStorageService();
    return cachedService;
  }

  cachedService = new UnavailableStorageService();
  return cachedService;
}
