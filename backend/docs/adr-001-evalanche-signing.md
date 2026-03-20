# ADR-001: Evalanche as signing service for on-chain writes

**Date:** 2026-03-17  
**Status:** Implemented  
**Decided by:** Jaack

## Decision

Eva Protocol backend does **not** store `EVA_PRIVATE_KEY` in `.env`.  
Instead, on-chain signing is delegated to the Evalanche SDK via `Evalanche.boot()`.

## Architecture

```
pipeline.ts
  └── blockchain.ts
        └── erc8004.ts  (viem write contracts)
              └── signing.ts  ← NEW — Evalanche-backed key manager
                    └── Evalanche.boot({ network: 'avalanche', identity: { agentId: '1599' } })
                          └── ~/.evalanche/keys/agent.json  (AES-encrypted keystore)
```

## Key lifecycle

1. **First boot:** Evalanche generates a BIP-39 wallet, encrypts to `~/.evalanche/keys/agent.json` using machine-local entropy. No human ever sees the key.
2. **Subsequent boots:** Keystore is decrypted in-process. Private key lives only in process memory.
3. **Resolution order:** OpenClaw secrets manager → `AGENT_PRIVATE_KEY` / `AGENT_MNEMONIC` env vars → encrypted keystore (default).

## What changed

- Added `src/services/signing.ts` — `getSignerKey()` boots Evalanche, returns `0x...` private key (Hex), caches in-process
- Updated `src/lib/erc8004.ts` — `getWalletClient()` is now `async`, calls `getSignerKey()`
- Removed `evaPrivateKey` from `src/config.ts` — `EVA_PRIVATE_KEY` is no longer read or required
- `EVA_PRIVATE_KEY` removed as a blocker from state.json

## Trust model

Evalanche is the trust/signing layer. Eva Protocol backend is stateless and keyless.  
This is the correct architecture for an agent-native system — the agent (ERC-8004 #1599) owns its own keys, managed by the agent SDK.

## On-chain write flow

1. `pipeline.ts` calls `submitVerificationOnchain(articleId, score, ipfsURI)`
2. `blockchain.ts` calls `giveFeedback()` and `validationResponse()` in `erc8004.ts`
3. `erc8004.ts` calls `getSignerKey()` → `Evalanche.boot()` → decrypts keystore → returns `privateKey`
4. viem's `privateKeyToAccount(key)` creates an account, `createWalletClient` signs and broadcasts

## Gas note

Agent wallet at `~/.evalanche/keys/agent.json` needs AVAX for gas. Fund via `agent.address` on Avalanche C-Chain.
