# Eva Protocol Architecture

> Canonical product: X-native prediction reputation and claim verification, with
> `EvaTrustGraph` as the long-lived trust primitive.

## Product boundary

Eva Protocol has four product surfaces and supporting evidence infrastructure:

1. Mobile-first prediction feed, market pages, thesis pages, and predictor profiles
2. `@evapredicts` X command ingestion for explicit track, verify, counter, or copy requests
3. Curator onboarding and trust reads against the deployed `EvaTrustGraph` contract
4. Article, claim, and source verification as supporting evidence infrastructure

External prediction markets are v1 reference venues. Eva should not launch as a real-money
exchange. It does not execute trades, custody funds, take bets, or settle a native market today. It
tracks public theses, copy intent, evidence, and predictor reputation. Native settlement remains
future scope.

## System overview

```text
┌──────────────────────────────────────────────────────────────┐
│ Frontend (Next.js on Vercel)                                │
│ / · /markets · /markets/:id · /thesis/:id · /compose        │
│ /predictors · /predictors/:id · /verify · /claims           │
│ /blog · /curators · /curators/register                      │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Backend (Hono)                                               │
│ /api/verify                                                  │
│ /api/article, /api/article/:id                               │
│ /api/markets, /api/theses, /api/predictors                  │
│ /api/x/ingest, /api/copy-preview, /api/claims               │
│ /api/trust, /.well-known/agent.json, /health                │
└───────────────┬───────────────────────────────┬──────────────┘
                │                               │
┌───────────────▼──────────────┐   ┌────────────▼──────────────┐
│ Prediction + evidence layer   │   │ Avalanche C-Chain         │
│ markets → theses → profiles   │   │ EvaTrustGraph             │
│ verify → reports → claims     │   │ ERC-8004 registries       │
│ X mention ingest → claims     │   │ future market modules     │
└───────────────────────────────┘   └───────────────────────────┘
```

## Live versus future

| Area | Current state | Notes |
|---|---|---|
| Trust graph | Live on Avalanche C-Chain | `EvaTrustGraph` is the canonical identity and trust primitive. |
| Curator onboarding | Product surface and preflight path exist | Production writes still depend on signer, gas, and deploy-env readiness. |
| Article and source verification | API and UI exist | x402 enforcement is intentionally disabled until request verification exists end-to-end. |
| Prediction theses | Offchain v1 product objects | They can be tracked, shared, countered, and resolved before graph promotion. |
| Claim bundles | Offchain v1 evidence objects | They structure claims, deadlines, sources, conflicts, resolver context, dispute windows, and outcomes. |
| X command surface | Configured as `@evapredicts` | Automation and posting require approval and operational access. |
| Verification market | Placeholder only | `protocol.config.json` has zero addresses and `market.enabled=false`. |
| Native trading/execution | Out of scope | Eva links out; it does not trade or custody user funds. |

## Canonical state

The deployed `EvaTrustGraph` contract is the primary source of truth for:

- registered predictor/curator identity
- wallet and ERC-8004 agent ownership assumptions
- self-stake and graph-backed trust score
- long-lived reputation state

Offchain prediction storage is the primary source of truth for:

- external market references and odds snapshots
- theses and counter-theses
- X command records
- copy-preview events
- unclaimed X predictor profiles

Future additive verification-market modules may become source of truth for:

- X-originated claim IDs
- claim funding pools
- verdict staking positions
- challenge state
- claim settlement outcomes

Those modules are not production-live while their configured addresses are zero and
`market.enabled=false`.

ERC-8004 registries remain part of the trust boundary for:

- identity ownership checks
- reputation feedback receipts
- validation receipts

ERC-8004 is the identity and reputation spine. App-layer predictor and curator records should link
back to ERC-8004 identity where possible instead of inventing a parallel durable identity system.

## Shared configuration

`protocol.config.json` is the single repo-level source of truth for:

- site URL and API base
- chain ID and RPC endpoints
- explorer URL
- deployed contract addresses
- Eva oracle identity
- X channel handles and market timing defaults
- additive market deployment placeholders
- verify API payment metadata

Frontend and backend both import from this file. Docs should reference it rather than duplicating
values manually.

## Request flow

### X-native thesis tracking

1. User tags `@evapredicts` or opens `/compose` from a shared thesis page
2. Backend records an explicit X command or direct composer submission
3. Eva links the thesis to an external market, odds snapshot, source post, and evidence
4. Frontend renders a mobile thesis page with copy, counter, and share actions
5. Resolved outcomes remain offchain until a reputation adapter promotes durable results into trust feedback

### Structured claim bundles

Claim bundles are the evidence unit behind a thesis. A bundle should include:

- claim
- deadline
- resolution source
- evidence
- identity
- conflicts
- resolver
- dispute window
- outcome

The claim bundle separates what the market currently prices from what Eva knows about the truth
status. Market odds are not a truth score.

### Market and predictor discovery

1. Frontend requests `GET /api/prediction-summary`, `/api/markets`, or `/api/predictors`
2. Backend reads offchain markets/theses and registered `EvaTrustGraph` identities
3. Predictor profiles display two layers: graph-backed trust score and app-derived market record
4. Unclaimed X profiles stay offchain until the user explicitly links a wallet/agent identity

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

### X claim verification

1. User mentions `@evapredicts` on X against a tweet or quoted tweet
2. Backend ingests the mention and normalizes a canonical claim
3. Backend creates or stores offchain claim metadata
4. When future market modules are deployed and enabled, the backend may create the onchain market claim
5. Frontend renders the public claim page with machine assessment and curator consensus
6. Market settlement can later feed resolved outcomes into reputation/trust via an adapter boundary

### Article and curator detail

1. Frontend requests `GET /api/article/:id` or `GET /api/curator/:id`
2. Backend reads canonical on-chain state
3. Backend enriches the response with report storage or related article data
4. Frontend renders a single stable response shape

## Alignment rules

- Mobile web is the primary product interface after X.
- Prediction theses are offchain in v1; only resolved outcomes may later affect canonical trust.
- X identity to wallet/agent linking requires explicit user opt-in.
- Eva does not launch as a real-money exchange and does not execute trades in v1; copy preview is
  external-link-only.
- Copy must separate market odds from truth status.
- Supported truth/status labels are `forecast`, `unresolved`, `verified`, `disputed`, `resolved`,
  and `void`.
- Dynamic article and curator pages must be server-rendered or runtime-rendered. Static export is not allowed.
- Frontend article indexing must map to on-chain IDs `1..nextArticleId`.
- Placeholder curator endpoints are not allowed in the public API.
- `/api/verify` must describe payment honestly. If x402 is not enforced, the response must say so.
- Trust reads must query the same tags the backend writes.
- The verification market is additive. No new market module may replace curator identity or long-lived trust state in `EvaTrustGraph`.
- V1 risk policy excludes elections, sports betting, war, assassination, criminal investigations,
  personal tragedies, and easily manipulable events.
- x402 may be used only for paid verification/API access after strict resource-bound request
  verification exists.

## Deployment model

Vercel is the sole production target.

- GitHub Pages is retired.
- Frontend is built as a dynamic Next.js app.
- API functions are exposed on the same domain for `/api/*`, `/.well-known/*`, and `/health`.
- Durable storage, analytics, monitoring, and signing are production-readiness gates, not marketing
  copy.

## Future scope

The following remain future scope, not live product claims:

- native Eva prediction-market settlement
- Base-native production deployment
- live x402 payment enforcement without request verification
- public tokenomics claims that are not reflected in the current contract and app surface
- automated public posting or outreach without founder approval
