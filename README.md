# Eva Protocol

Eva Protocol is a trust-graph product on Avalanche. Curators register with stake and an owned
ERC-8004 identity, submit source URLs, and build a measurable track record as Eva verifies claims
and writes evidence-linked results back to Avalanche.

Prediction-market material from earlier drafts is archived roadmap context, not the live product.

## Monorepo

- `frontend/` — Next.js application for the public site, verification flow, article pages, and curator onboarding
- `backend/` — Hono API for verification, article detail, curator detail, and trust summaries
- `contracts/` — Foundry workspace containing `EvaTrustGraph.sol`
- `docs/` — aligned product, architecture, design, and task documents
- `protocol.config.json` — shared source of truth for site URL, chain metadata, contract addresses, and Eva oracle identity

## Shared source of truth

Frontend, backend, and generated ABI output all consume the same canonical values:

- Avalanche C-Chain (`43114`)
- `EvaTrustGraph`: `0xE84DdD5A03Fa4210c4217436afD2556B348A40a0`
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

## Verify API

`POST /api/verify` is live and returns real verification output. x402 payment enforcement is
intentionally disabled until request verification exists end-to-end, and the response body reports
that state explicitly.
