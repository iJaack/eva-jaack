// ── Signing service — env-backed key management ───────────────────────

import { config } from '../config.js';

type Hex = `0x${string}`;

let _cachedPrivateKey: Hex | null = null;

/**
 * Get the agent signer private key from EVA_PRIVATE_KEY.
 * Cached in-process after first resolution.
 */
export async function getSignerKey(): Promise<Hex> {
  if (_cachedPrivateKey) return _cachedPrivateKey;

  const rawKey = config.evaPrivateKey;
  if (!rawKey) throw new Error('[signing] EVA_PRIVATE_KEY not set');

  const key: Hex = rawKey.startsWith('0x') ? (rawKey as Hex) : `0x${rawKey}`;
  _cachedPrivateKey = key;

  return key;
}

/**
 * Clear the in-process key cache (e.g. for testing or key rotation).
 */
export function clearSignerCache(): void {
  _cachedPrivateKey = null;
}
