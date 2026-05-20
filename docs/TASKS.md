# Eva Protocol Tasks

> Alignment backlog for the X-native prediction layer with `EvaTrustGraph` as the trust primitive.

## Done

- [x] Remove static export from the frontend
- [x] Serve article and curator pages as dynamic routes
- [x] Fix article indexing to use on-chain IDs `1..nextArticleId`
- [x] Replace placeholder curator APIs with real list and detail routes
- [x] Align trust tag reads with the tag writes emitted by the backend
- [x] Make `/api/verify` honest about payment enforcement
- [x] Move chain, contract, and agent constants into `protocol.config.json`
- [x] Generate frontend and backend ABI output from the Solidity artifact
- [x] Replace `next lint` with a Next 16 compatible ESLint command
- [x] Add prediction-layer APIs for markets, theses, predictors, X command ingestion, and copy previews
- [x] Redesign the homepage around a mobile-first prediction feed
- [x] Add mobile market, thesis, compose, and predictor profile surfaces

## Now

- [ ] Add backend route tests for:
  - [x] `GET /api/prediction-summary`
  - [x] `GET /api/markets`
  - [x] `GET /api/markets/:marketId`
  - [x] `POST /api/theses`
  - [x] `GET /api/theses/:thesisId`
  - [x] `GET /api/predictors`
  - [x] `POST /api/x/ingest`
  - [x] `POST /api/copy-preview`
  - [ ] `POST /api/verify`
  - [ ] `GET /api/article`
  - [ ] `GET /api/article/:id`
  - [ ] `GET /api/curators`
  - [ ] `GET /api/curator/:id`
  - [ ] `GET /api/trust/:address`
- [ ] Add frontend E2E coverage for:
  - [ ] mobile prediction feed
  - [ ] thesis compose flow
  - [ ] market detail pages
  - [ ] predictor profile pages
  - [ ] copy and counter actions
  - [ ] verify flow
  - [ ] article detail pages
  - [ ] curator profile pages
  - [ ] curator registration preflight
  - [ ] browser-wallet onboarding states
- [ ] Add deployment smoke checks for:
  - [ ] `/`
  - [ ] `/markets`
  - [ ] `/compose`
  - [ ] `/predictors`
  - [ ] `/verify`
  - [ ] `/article/<live-id>`
  - [ ] `/curator/<live-address>`
  - [ ] `/api/verify`
  - [ ] `/api/trust/<address>`
  - [ ] `/.well-known/agent.json`

## Next

- [ ] Decide whether x402 should remain in scope
- [ ] If yes, implement real request verification before re-enabling payment-required claims
- [ ] Expand durable storage strategy for verification reports beyond local filesystem mode
- [ ] Document the exact Vercel project configuration used in production
- [x] Add a contract regression test covering article ID sequencing and onboarding assumptions
- [ ] Additive X-channel verification market
  - [x] shared config for X handles, market timing, resolver, treasury, and deployed addresses
  - [x] `EvaVerificationMarket` contract with funding, staking, challenge, settlement, and reward claim flows
  - [x] trust-graph reputation adapter boundary
  - [x] claim-market backend APIs and persistence
  - [ ] X mention ingestion and publishing services
  - [x] claim pages and curator market participation UI
  - [x] rollout flags, smoke tests, and operational playbooks

## Rules

- `EvaTrustGraph` is the canonical source of registered predictor identity and graph-backed trust
- Prediction theses are offchain in v1; only resolved outcomes should later affect canonical trust
- `@evapredicts` is the X command and distribution surface
- Vercel is the sole production deployment target
- Eva does not execute trades in v1; copy previews are external-link-only
- Docs, public copy, and runtime config must all agree before a feature is described as live
