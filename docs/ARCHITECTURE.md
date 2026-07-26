# Eva Protocol Architecture

> Canonical product: evolving market theses that combine prediction markets, fact signals, X
> identity, wallet anchoring, and visible revision history.

## Product Boundary

Eva has five live product surfaces:

1. Market discovery across prediction providers, excluding sports for now.
2. Thesis compose and detail pages for interactive, evolving market posts.
3. Predictor records derived from X handles, linked wallets, and thesis history.
4. Agent/MCP surfaces for creating, inspecting, and anchoring theses.
5. `$EVA` contract metadata and read-only holder balances attached to wallet/author context.

Eva is not a native exchange. It does not place trades, custody funds, operate a claim market, run a
curator onboarding funnel, or publish a platform blog in the narrowed product.

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Next.js)                                         │
│ / · /markets · /markets/:id · /compose                    │
│ /thesis/:id · /predictors · /predictors/:id · /eva        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Backend (Hono)                                             │
│ /api/markets · /api/theses · /api/predictors               │
│ /api/x/ingest · /api/copy-preview                          │
│ /api/thesis-anchor/prepare · /api/mcp                       │
│ /.well-known/agent.json · /health                          │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼─────────────┐  ┌─────────────▼───────────────┐
│ Prediction/thesis storage   │  │ Avalanche C-Chain           │
│ markets, theses, commands   │  │ EvaThesisProtocol + $EVA    │
│ predictor records, history  │  │ thesis anchors + balances   │
└────────────────────────────┘  └─────────────────────────────┘
```

## Core Objects

| Object | Purpose |
|---|---|
| `PredictionMarketDto` | External market snapshot with provider, outcomes, volume, status, and close time. |
| `ThesisDto` | The interactive post: title, body, author, signals, revisions, timeline, score, and anchor state. |
| `ThesisPredictionSignalDto` | A live or closed prediction-market signal with selected outcome, odds, weight, and role. |
| `ThesisFactSignalDto` | A lateral fact or operating rule used inside a thesis. |
| `ThesisRevisionDto` | Immutable history entry showing body, signal snapshot, score before/after, and anchor state. |
| `PredictorDto` | X-handle record with optional wallet link and app-derived track record. |
| `$EVA` holder state | Read-only ERC-20 metadata and wallet balance used as author context, never as a publishing gate or credibility score. |

Fact signals still use `claimText`/`claimHash` field names in DTOs and Solidity because the field is
an atomic factual assertion inside a thesis. That is not the removed claims-market product.

## Identity And Wallets

Writes require:

- X identity
- wallet address
- wallet source: external injected wallet or embedded wallet

The current implementation accepts the identity payload directly. Production auth should plug in a
provider such as Privy or Dynamic for X login plus embedded wallets, while keeping the same thesis
author shape.

When a wallet is connected, Eva reads its `$EVA` balance from Avalanche C-Chain. The readback does
not grant publishing rights, change thesis scores, or imply staking, governance, yield, or trading
functionality.

## Request Flows

### Create A Thesis

1. User connects X plus wallet.
2. User writes a thesis body and attaches market/fact signals.
3. Backend validates identity and previews the thesis without storing it.
4. Eva prepares Avalanche anchor transactions for the thesis and signals.
5. Publishing stays disabled until the prepared anchor matches the current draft and a submitted transaction hash is recorded.
6. Eva stores the submitted-anchor thesis as revision 1 and renders the thesis page with markets, facts, score, and history.

### Evolve A Thesis

1. Market odds, closed predictions, or facts change.
2. User or agent prepares a revision draft with signal updates.
3. Eva prepares the revision anchor transaction and keeps the current thesis unchanged.
4. Publishing the update requires the matching prepared revision anchor and submitted transaction hash.
5. Eva appends immutable revision/timeline entries.
6. Readers can inspect how the thesis changed over time.

### X And Agent Use

1. X commands can track, counter, copy, or draft a thesis.
2. MCP exposes market search, thesis inspection, draft-anchor preparation, and revision-anchor preparation primitives for agents.
3. Agent draft tools return `publishState: "anchor_prepared_not_published"` rather than silently storing public theses.
4. Agent outputs must preserve source URLs, signal weights, and revision notes.

## Shared Configuration

`protocol.config.json` is the source of truth for:

- site URL and API base
- Avalanche chain and explorer metadata
- deployed `EvaThesisProtocol`
- canonical `$EVA` token address and metadata
- Eva agent ID and wallet
- X channel handle

Docs, frontend, backend, scripts, and deployment checks should reference that file rather than
duplicating stale contract sets.

## Removed Scope

The following are intentionally removed from the live product:

- `/verify`, `/claims`, `/article`, `/articles`
- `/curators`, `/curator`, and legacy identity-registration UI
- platform blog and whitepaper routes
- legacy staking, challenge, settlement, paid-verification, LLM-verification, IPFS report storage,
  and article cache services

Reintroducing any of these requires a new milestone with tests, deployment checks, and updated
product copy.
