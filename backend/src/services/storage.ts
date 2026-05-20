import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { put } from '@vercel/blob';
import { config } from '../config.js';

export interface StorageService {
  provider: string;
  uploadJSON(data: object, options?: { name?: string }): Promise<string>;
  loadJSON<T>(uri: string): Promise<T | null>;
}

const defaultStorageDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../.data/eva-reports',
);

function gatewayUrlFromUri(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return `${config.ipfsGatewayBase.replace(/\/$/, '')}/${uri.slice('ipfs://'.length)}`;
  }

  return uri;
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

  async loadJSON<T>(uri: string): Promise<T | null> {
    if (!uri) return null;

    const res = await fetch(gatewayUrlFromUri(uri));
    if (!res.ok) {
      throw new Error(`Failed to load JSON from ${uri}: ${res.status}`);
    }

    return res.json() as Promise<T>;
  }
}

// ── Local filesystem storage (development fallback) ──────────────────
//
// Produces deterministic content-addressed URIs without network calls and
// persists them to disk so reports survive local restarts.

class LocalStorageService implements StorageService {
  readonly provider = 'local';

  constructor(private readonly storageDir: string) {}

  async uploadJSON(data: object): Promise<string> {
    const content = JSON.stringify(data);
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 46);
    const cid = `bafylocaldev${hash}`;

    await mkdir(this.storageDir, { recursive: true });
    await writeFile(resolve(this.storageDir, `${cid}.json`), content, 'utf8');

    console.log(`[storage:local] Stored report as ${cid} (${content.length} bytes)`);
    return `ipfs://${cid}`;
  }

  async loadJSON<T>(uri: string): Promise<T | null> {
    if (!uri.startsWith('ipfs://')) {
      const res = await fetch(uri);
      if (!res.ok) {
        throw new Error(`Failed to load JSON from ${uri}: ${res.status}`);
      }

      return res.json() as Promise<T>;
    }

    const cid = uri.slice('ipfs://'.length);
    try {
      const raw = await readFile(resolve(this.storageDir, `${cid}.json`), 'utf8');
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}

// ── Vercel Blob (durable object storage) ──────────────────────────────

class VercelBlobStorageService implements StorageService {
  readonly provider = 'vercel-blob';

  constructor(private readonly token: string) {}

  async uploadJSON(data: object, options?: { name?: string }): Promise<string> {
    const name = options?.name ?? `eva-verification-${Date.now()}.json`;
    const blob = await put(name, JSON.stringify(data, null, 2), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/json',
      token: this.token,
    });

    return blob.url;
  }

  async loadJSON<T>(uri: string): Promise<T | null> {
    if (!uri) return null;

    const res = await fetch(uri);
    if (!res.ok) {
      throw new Error(`Failed to load JSON from ${uri}: ${res.status}`);
    }

    return res.json() as Promise<T>;
  }
}

// ── Unavailable fallback ─────────────────────────────────────────────

class UnavailableStorageService implements StorageService {
  readonly provider = 'unavailable';

  async uploadJSON(): Promise<string> {
    throw new Error(
      'No storage provider configured. Set EVA_STORAGE_PROVIDER=pinata with PINATA_JWT, EVA_STORAGE_PROVIDER=vercel-blob with BLOB_READ_WRITE_TOKEN, or use EVA_STORAGE_PROVIDER=local for development.',
    );
  }

  async loadJSON(): Promise<null> {
    return null;
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

  if ((provider === 'vercel-blob' || provider === 'auto') && config.blobReadWriteToken) {
    cachedService = new VercelBlobStorageService(config.blobReadWriteToken);
    return cachedService;
  }

  if (provider === 'local') {
    cachedService = new LocalStorageService(config.storageDir || defaultStorageDir);
    return cachedService;
  }

  // In auto mode without remote credentials, fall back to local filesystem storage
  if (provider === 'auto') {
    console.warn('[storage] No remote storage credentials found, falling back to local filesystem storage');
    cachedService = new LocalStorageService(config.storageDir || defaultStorageDir);
    return cachedService;
  }

  cachedService = new UnavailableStorageService();
  return cachedService;
}
