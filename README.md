# Eva Protocol

Eva Protocol is an X-native prediction reputation layer on Avalanche. Predictors publish market
theses, attach evidence, and build public track records while `EvaTrustGraph` remains the canonical
identity and trust primitive underneath.

The `@evapredicts` account is the distribution and command surface. The mobile web app is the
canonical product surface for markets, theses, predictor profiles, copy previews, and evidence.
Prediction theses are tracked offchain in v1; only durable resolved outcomes should later affect
graph-backed reputation.

Native Eva trade execution remains out of scope for v1. Eva links to external markets first and
records copy intent without custodying funds or placing trades.

## Monorepo

- `frontend/` — Next.js application for the mobile-first prediction feed, thesis composer, market pages, predictor profiles, verification flow, and curator onboarding
- `backend/` — Hono API for markets, theses, predictors, X command ingestion, verification, article detail, curator detail, and trust summaries
- `contracts/` — Foundry workspace containing `EvaTrustGraph.sol`
- `contracts/` — Foundry workspace containing `EvaTrustGraph.sol` and additive verification-market modules
- `docs/` — aligned product, architecture, design, and task documents
- `protocol.config.json` — shared source of truth for site URL, chain metadata, contract addresses, and Eva oracle identity

## Shared source of truth

Frontend, backend, and generated ABI output all consume the same canonical values:

- Avalanche C-Chain (`43114`)
- `EvaTrustGraph`: `0xE84DdD5A03Fa4210c4217436afD2556B348A40a0`
- `EvaVerificationMarket`: configured as an additive module and not yet deployed in production
- Eva oracle agent ID: `1599`
- Site URL: `https://eva.jaack.me`

## Quick start

```bash
pnpm install
pnpm sync:abi
pnpm --filter backend dev
pnpm --filter frontend dev
```

## Checks

```bash
pnpm --filter backend typecheck
pnpm --filter backend build
pnpm --filter frontend typecheck
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm --filter contracts test
```

If `forge` is installed directly rather than through `pnpm`, use `cd contracts && forge test`.

## Deployment

Vercel is the canonical deployment target.

- Frontend: dynamic Next.js app, no static export
- API: routed through `/api/*` and `/.well-known/*`
- GitHub Pages is retired and should not be used for production builds

## X verification channel

Eva treats X as the distribution channel for the trust graph:

- users mention `@evapredicts` to track, verify, counter, or copy prediction theses
- Eva opens public thesis and claim pages on `eva.jaack.me`
- predictors can start with an unclaimed X profile, then opt in to wallet/agent identity linking
- resolved thesis outcomes can later feed reputation through an adapter boundary

## Prediction layer API

The mobile app is backed by additive API routes:

- `GET /api/prediction-summary`
- `GET /api/markets` and `GET /api/markets/:marketId`
- `POST /api/theses`, `GET /api/theses`, and `GET /api/theses/:thesisId`
- `GET /api/predictors` and `GET /api/predictors/:id`
- `POST /api/x/ingest`
- `POST /api/copy-preview`

## Verify API

`POST /api/verify` is live and returns real verification output. x402 payment enforcement is
intentionally disabled until request verification exists end-to-end, and the response body reports
that state explicitly.
