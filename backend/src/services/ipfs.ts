// ── IPFS upload via Pinata ───────────────────────────────────────────

import { config } from '../config.js';

const PINATA_ENDPOINT = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

export async function uploadJSON(data: object): Promise<string> {
  if (!config.pinataJwt) throw new Error('PINATA_JWT not set');

  console.log('[ipfs] Uploading report to IPFS via Pinata');

  const res = await fetch(PINATA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.pinataJwt}`,
    },
    body: JSON.stringify({
      pinataContent: data,
      pinataMetadata: {
        name: `eva-verification-${Date.now()}`,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pinata upload failed: ${res.status} ${errText}`);
  }

  const result = await res.json() as { IpfsHash: string };
  const uri = `ipfs://${result.IpfsHash}`;
  console.log(`[ipfs] Uploaded: ${uri}`);
  return uri;
}
