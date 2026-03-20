import { config } from '../config.js';

export interface StorageService {
  provider: string;
  uploadJSON(data: object, options?: { name?: string }): Promise<string>;
}

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

class UnavailableStorageService implements StorageService {
  readonly provider = 'unavailable';

  async uploadJSON(): Promise<string> {
    throw new Error(
      'No storage provider configured. Set EVA_STORAGE_PROVIDER=pinata and provide PINATA_JWT.',
    );
  }
}

let cachedService: StorageService | null = null;

export function getStorageService(): StorageService {
  if (cachedService) return cachedService;

  if ((config.storageProvider === 'pinata' || config.storageProvider === 'auto') && config.pinataJwt) {
    cachedService = new PinataStorageService(config.pinataJwt, config.pinataEndpoint);
    return cachedService;
  }

  cachedService = new UnavailableStorageService();
  return cachedService;
}
