# ADR-003: Storage Provider Abstraction (IPFS / Local)

**Status:** Accepted  
**Date:** 2026-03-23  
**Author:** Eva Protocol CEO

---

## Context

Verification reports need to be stored in a content-addressed, publicly retrievable way so that curator trust scores and claim verdicts are independently verifiable. IPFS via Pinata is the production target. However, requiring a live Pinata JWT for every dev/test run creates friction and risks silent pipeline failures when credentials are missing.

## Decision

Introduce a `StorageService` abstraction with three implementations, selected at boot via `EVA_STORAGE_PROVIDER`:

| Provider | When used | URI scheme |
|---|---|---|
| `pinata` | `EVA_STORAGE_PROVIDER=pinata` + `PINATA_JWT` set | `ipfs://<CIDv1>` |
| `local` | `EVA_STORAGE_PROVIDER=local` (dev/test) | `ipfs://bafylocaldev<hash>` |
| `unavailable` | `pinata` selected but no JWT provided | throws on upload |

**Auto mode** (`EVA_STORAGE_PROVIDER=auto`, the default):
- Uses Pinata if `PINATA_JWT` is present
- Falls back to `local` with a console warning if not
- Never silently swallows data — either writes to IPFS or writes to local store

The legacy `ipfs.ts` file is kept as a one-line shim (`uploadJSON` → `getStorageService().uploadJSON`) so existing imports remain valid without refactoring. New code imports from `storage.ts` directly.

## Consequences

**Good:**
- Zero-config local development — pipeline runs fully without Pinata credentials
- Local store produces deterministic content-addressed URIs (SHA-256 of content → fake CID) — good for E2E test assertions
- Clear upgrade path: set `PINATA_JWT` in Vercel → production IPFS pinning activates automatically

**Bad:**
- Local URIs are not publicly resolvable — links shared from a dev environment will 404 on public gateways
- In-memory local store is lost on restart — test data doesn't persist

## Env vars

| Var | Default | Required for |
|---|---|---|
| `EVA_STORAGE_PROVIDER` | `auto` | Explicit provider selection |
| `PINATA_JWT` | — | Pinata uploads |
| `PINATA_ENDPOINT` | `https://api.pinata.cloud/pinning/pinJSONToIPFS` | Override Pinata endpoint |

## Related

- `backend/src/services/storage.ts` — implementation
- `backend/src/services/ipfs.ts` — legacy shim (keep, do not delete)
- ADR-001 — signing architecture
- Vercel blocker: `PINATA_JWT` not yet set in production env
