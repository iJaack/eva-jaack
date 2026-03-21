// ── Legacy IPFS compatibility wrapper ────────────────────────────────
//
// New code should use `getStorageService()` from `storage.ts`.
// This file stays as a thin wrapper so older imports don't drift from the
// real storage-provider selection logic.

import { getStorageService } from './storage.js';

export async function uploadJSON(data: object): Promise<string> {
  const storage = getStorageService();
  console.log(`[ipfs] Uploading via storage provider=${storage.provider}`);
  return storage.uploadJSON(data, { name: `eva-verification-${Date.now()}` });
}
