# Eva Protocol Tasks

> Alignment backlog for the live trust-graph product.

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

## Now

- [ ] Add backend route tests for:
  - [ ] `POST /api/verify`
  - [ ] `GET /api/article`
  - [ ] `GET /api/article/:id`
  - [ ] `GET /api/curators`
  - [ ] `GET /api/curator/:id`
  - [ ] `GET /api/trust/:address`
- [ ] Add frontend E2E coverage for:
  - [ ] verify flow
  - [ ] article detail pages
  - [ ] curator profile pages
  - [ ] curator registration preflight
  - [ ] browser-wallet onboarding states
- [ ] Add deployment smoke checks for:
  - [ ] `/`
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
- [ ] Add a contract regression test covering article ID sequencing and onboarding assumptions

## Rules

- `EvaTrustGraph` is the canonical source of curator and article state
- Vercel is the sole production deployment target
- Prediction-market material remains archived roadmap context unless reintroduced with code
- Docs, public copy, and runtime config must all agree before a feature is described as live
