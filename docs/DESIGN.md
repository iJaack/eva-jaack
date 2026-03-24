# Eva Protocol Design

> Implementation guide for the aligned trust-graph product.

## Repository shape

```text
eva-jaack/
├── api/                         # Vercel function entrypoint for backend routes
├── backend/
│   └── src/
│       ├── app.ts
│       ├── config.ts
│       ├── generated/
│       ├── lib/
│       │   └── api-types.ts
│       ├── protocol.ts
│       ├── routes/
│       └── services/
├── contracts/
│   ├── src/
│   │   └── EvaTrustGraph.sol
│   └── out/
├── docs/
├── frontend/
│   ├── app/
│   ├── components/
│   └── lib/
├── protocol.config.json
└── scripts/
    └── generate-eva-abi.mjs
```

## Core design decisions

### 1. Shared configuration

Do not duplicate deployment constants in frontend, backend, and docs.

- put canonical values in `protocol.config.json`
- import that file from both runtimes
- reference those values in documentation

### 2. Generated contract interfaces

Do not hand-maintain partial ABIs when the contract artifact already exists.

- run `pnpm sync:abi`
- generate ABI output for:
  - `frontend/lib/generated/evaTrustGraphAbi.ts`
  - `backend/src/generated/evaTrustGraphAbi.ts`

### 3. Stable API types

Backend owns the response schemas used by the product surface:

- `VerifyResponse`
- `ArticleListResponse`
- `ArticleDetailResponse`
- `CuratorListResponse`
- `CuratorDetailResponse`

Frontend imports these as types so article, curator, and verify pages render against stable shapes.

### 4. Dynamic routing

Article and curator routes are runtime-rendered. Static export is not permitted because new
articles and curators must resolve immediately after on-chain creation.

### 5. Honest payment behavior

`POST /api/verify` must not imply enforced x402 if the server only checks for a header or does
nothing at all. The response must include honest payment metadata until real request verification is
implemented.

## Backend responsibilities

### Trust graph reads

`backend/src/services/trust-graph.ts` is the canonical read layer for:

- listing curators from `CuratorRegistered` logs
- reading individual curators
- listing articles from `nextArticleId`
- reading individual articles
- matching articles by source URI

Important constraint:

- article IDs begin at `1`
- `nextArticleId` is the upper bound, not the last zero-based index

### Verification routes

`backend/src/routes/verify.ts` should:

- require `url`
- run the pipeline
- attempt source-URL matching against existing on-chain articles
- return a `VerifyResponse`
- report payment state from `protocol.config.json`

### Trust routes

`backend/src/routes/trust.ts` should:

- read the curator from `EvaTrustGraph`
- aggregate reputation using the same tags written by `services/blockchain.ts`
- treat the trust-graph contract as the displayed trust source

### Curator routes

`backend/src/routes/curators.ts` should:

- expose real list and detail endpoints
- support lookup by wallet address or agent ID
- keep `/register` as a preflight endpoint, not a fake success stub

### Storage

Verification reports should be durable when persistence matters.

- local mode stores JSON under `.data/eva-reports`
- evidence URIs can still be read back through a gateway
- in-memory cache is development convenience only

## Frontend responsibilities

### API-first rendering

Frontend should use backend APIs for:

- verification reports
- article detail
- curator detail
- article and curator index pages

Frontend should read contracts directly only for truly canonical wallet interaction paths such as
browser-wallet onboarding or chain switching.

### Onboarding UX

The curator registration page must:

- never suggest Eva agent `1599` as the user default
- distinguish Eva’s oracle identity from curator-owned identities
- expose prepared transactions from the preflight API
- support both Evalanche and injected-wallet broadcast paths

### Lint and build

Next 16 does not support `next lint`.

- use `eslint .`
- use a flat ESLint config
- set the Next workspace root explicitly in ESLint and Next config

## Vercel expectations

The production target is Vercel, not GitHub Pages.

- no `frontend/out`
- no static export requirement
- rewrites continue to expose backend API and well-known endpoints

## Archived concepts

Leave research notes about prediction markets or future x402 settlement in docs or archived copy.
Do not describe them as live app behavior unless the contract, API, and frontend all support them.
