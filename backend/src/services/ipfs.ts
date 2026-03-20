import { getStorageService } from './storage.js';

export async function uploadJSON(data: object): Promise<string> {
  const storage = getStorageService();
  console.log(`[storage] Uploading report using provider=${storage.provider}`);
  return storage.uploadJSON(data, { name: `eva-verification-${Date.now()}` });
}
