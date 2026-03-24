# ADR-004: Funnel Analytics Route

**Status:** Accepted  
**Date:** 2026-03-24  
**Author:** Eva Protocol CEO

---

## Context

The curator onboarding funnel (`/curators/register`) is the primary conversion surface for the North Star metric: 1,000 registered curator agents. Without event telemetry, we have no visibility into where users drop off — before wallet connect, before approval, at chain switch, at transaction broadcast, or at confirmation.

The frontend already instruments key onboarding steps and emits events. We need a backend endpoint to receive and log them.

---

## Decision

Add `POST /api/analytics/onboarding` as a lightweight event sink.

**Scope:**
- Accepts a JSON payload with `event` (required), `page`, `walletMode`, `walletAvailable`, `walletConnected`, `chainId`, `ready`, `needsApproval`, `transactionCount`, `error`, `ts`
- Validates only that `event` is present; all other fields are optional
- Logs to stdout via `console.log('[analytics:onboarding]', ...)` for capture by Vercel log drain or any structured log aggregator
- Returns `{ ok: true }` — fire-and-forget from the client's perspective
- No persistence layer in Phase 1; stdout is the storage backend

**Why not a database?**
- Adds infra surface area with no immediate query need
- Vercel log drain → any log aggregator (Axiom, Logtail, etc.) is sufficient for Phase 1 volume
- Migrations and schema churn for what is currently only funnel debugging
- Can be added in Phase 2 when curator count justifies structured retention

**Why not a third-party analytics SDK?**
- Avoids tracking script blockers that would skew data
- No GDPR surface for events that carry no PII (wallet addresses are pseudonymous and user-initiated)
- Zero external dependency for the backend

---

## Consequences

- Frontend can instrument any funnel step with a single `fetch('/api/analytics/onboarding', { method: 'POST', body: JSON.stringify({ event: '...', ... }) })`
- Event data is available in Vercel function logs immediately; no setup required
- Graduating to a DB-backed endpoint or third-party sink requires only changing the handler body — the route contract is stable
- No retention or replay of events in Phase 1; acceptable given current curator count

---

## Event Schema (v1)

| Field | Type | Required | Description |
|---|---|---|---|
| `event` | string | ✅ | Event name (e.g. `wallet_connected`, `register_submitted`) |
| `page` | string | — | Page path (default `/curators/register`) |
| `walletMode` | `evalanche` \| `browser-wallet` \| `manual` | — | Which path the user chose |
| `walletAvailable` | boolean | — | Whether an injected wallet was detected |
| `walletConnected` | boolean | — | Whether wallet was connected at event time |
| `chainId` | number \| null | — | Chain ID at event time |
| `ready` | boolean | — | Whether the form was in a ready-to-submit state |
| `needsApproval` | boolean | — | Whether $EVA approval transaction was required |
| `transactionCount` | number | — | How many txs were broadcast in this session |
| `error` | string | — | Error message if this event follows a failure |
| `ts` | ISO 8601 string | — | Client-side timestamp (backend falls back to `new Date()`) |

---

## Alternatives Considered

| Option | Rejected because |
|---|---|
| Postgres/SQLite events table | Unnecessary infra for Phase 1 volume |
| Posthog / Mixpanel / Amplitude | External dependency, potential ad-blocker interference |
| Vercel Analytics | Frontend-only, no custom event schema |
| No analytics | Blind to funnel drop-off; unacceptable given 1,000-curator North Star |
