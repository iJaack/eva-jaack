# ADR-001: Use local Evalanche boot flow for backend signing

**Date:** 2026-03-17  
**Status:** Implemented  
**Decided by:** Jaack

## Decision

Eva Protocol backend signs on-chain writes through the local **Evalanche SDK boot flow**, not a remote signing bridge.

Active path:
- `Evalanche.boot({ network: 'avalanche', identity: { agentId: '1599' } })`
- credential resolution is handled by Evalanche itself:
  1. OpenClaw secrets
  2. env vars (`AGENT_PRIVATE_KEY` / `AGENT_MNEMONIC`)
  3. encrypted local keystore (`~/.evalanche/keys/agent.json`)

## Why

We want agent-native key custody without forcing Eva Protocol to persist raw signer material in app config.

Evalanche gives us:
- encrypted-at-rest keystore management
- deterministic wallet reuse across boots
- compatibility with agent-native Avalanche operations
- a clean migration path away from direct backend secret management

## Architecture

```text
routes/predictions.ts or services/thesis-protocol.ts
  -> services/signing.ts
      -> Evalanche.boot({ network: 'avalanche', identity: { agentId: '1599' } })
          -> OpenClaw secrets | env | ~/.evalanche/keys/agent.json
              -> decrypted in-process wallet
                  -> viem wallet client writes contract
```

## What changed

- Added local `evalanche` dependency to backend
- `src/services/signing.ts` now boots Evalanche, caches the boot result, and exposes the signer key from the decrypted in-process wallet
- `src/services/thesis-protocol.ts` prepares and submits thesis-protocol writes through the active signer path
- Remote signer bridge URLs are no longer part of the active signing path

## Operational behavior

- boot Evalanche on Avalanche
- reuse the same keystore-backed wallet across runs
- sign and broadcast via viem using the decrypted wallet key in-process
- confirm the deployer wallet before broadcast transactions

## Trust model

The preferred production trust model is:
- backend remains stateless with respect to long-lived plaintext keys
- Evalanche handles credential sourcing and encrypted persistence
- the Eva agent identity (#1599) remains the anchor for signing behavior

## Consequences

### Positive
- cleaner agent-native architecture
- no need for a separate signing microservice
- simpler deployment topology
- local encrypted keystore works for unattended operation

### Tradeoffs
- backend now depends on the local Evalanche package/runtime
- the signer service is async at execution time because wallet bootstrapping may be needed on first use
- operators still need the wallet funded with AVAX for gas

## Gas note

The agent wallet used by Evalanche must hold AVAX on Avalanche C-Chain.
Fund the address returned by Evalanche boot before attempting write operations.
