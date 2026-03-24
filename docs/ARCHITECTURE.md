# Eva Protocol Architecture

> Canonical product: trust graph, curator onboarding, and article verification on Avalanche.

## Product boundary

Eva Protocol currently has three live surfaces:

1. Curator onboarding against the deployed `EvaTrustGraph` contract
2. Article verification through `POST /api/verify`
3. Read surfaces for curators, articles, and trust summaries

Prediction-market concepts from older drafts are archived and are not part of the live system.

## System overview

```text
┌──────────────────────────────────────────────────────────────┐
│ Frontend (Next.js on Vercel)                                │
│ / · /verify · /articles · /article/:id · /curators          │
│ /curator/:address · /curators/register · /whitepaper        │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Backend (Hono)                                               │
│ /api/verify                                                  │
│ /api/article, /api/article/:id                               │
│ /api/curators, /api/curator/:id                              │
│ /api/trust, /.well-known/agent.json, /health                │
└───────────────┬───────────────────────────────┬──────────────┘
                │                               │
┌───────────────▼──────────────┐   ┌────────────▼──────────────┐
│ Verification pipeline         │   │ Avalanche C-Chain         │
│ fetch → extract → verify      │   │ EvaTrustGraph             │
│ score → store report          │   │ ERC-8004 registries       │
└───────────────────────────────┘   └───────────────────────────┘
```

## Canonical state

The deployed `EvaTrustGraph` contract is the primary source of truth for:

- article IDs and article metadata
- curator registration status
- curator trust score
- curator article counts

ERC-8004 registries remain part of the trust boundary for:

- identity ownership checks
- reputation feedback receipts
- validation receipts

## Shared configuration

`protocol.config.json` is the single repo-level source of truth for:

- site URL and API base
- chain ID and RPC endpoints
- explorer URL
- deployed contract addresses
- Eva oracle identity
- verify API payment metadata

Frontend and backend both import from this file. Docs should reference it rather than duplicating
values manually.

## Request flow

### Curator onboarding

1. User opens `/curators/register`
2. Frontend calls `POST /api/curator/register`
3. Backend verifies:
   - wallet format
   - owned ERC-8004 agent ID
   - `minSelfStake()`
   - $EVA balance and allowance
4. Backend returns prepared transactions
5. User broadcasts via Evalanche or injected wallet

### Article verification

1. Client submits a source URL to `POST /api/verify`
2. Backend runs the verification pipeline
3. Backend returns:
   - overall score
   - claim breakdown
   - report URI
   - payment metadata
   - optional matching on-chain article ID

### Article and curator detail

1. Frontend requests `GET /api/article/:id` or `GET /api/curator/:id`
2. Backend reads canonical on-chain state
3. Backend enriches the response with report storage or related article data
4. Frontend renders a single stable response shape

## Alignment rules

- Dynamic article and curator pages must be server-rendered or runtime-rendered. Static export is not allowed.
- Frontend article indexing must map to on-chain IDs `1..nextArticleId`.
- Placeholder curator endpoints are not allowed in the public API.
- `/api/verify` must describe payment honestly. If x402 is not enforced, the response must say so.
- Trust reads must query the same tags the backend writes.

## Deployment model

Vercel is the sole production target.

- GitHub Pages is retired.
- Frontend is built as a dynamic Next.js app.
- API functions are exposed on the same domain for `/api/*`, `/.well-known/*`, and `/health`.

## Archived concepts

The following are archived roadmap concepts, not live product claims:

- prediction-market settlement on article claims
- Base-native production deployment
- live x402 payment enforcement without request verification
- public tokenomics claims that are not reflected in the current contract and app surface
