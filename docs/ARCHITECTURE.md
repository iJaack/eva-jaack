# Eva Protocol Architecture

> Canonical product: evolving market theses that combine prediction markets, fact signals, X
> identity, wallet anchoring, and visible revision history.

## Product Boundary

Eva has five live product surfaces:

1. Market discovery across prediction providers, excluding sports for now.
2. Thesis compose and detail pages for interactive, evolving market posts.
3. Predictor records derived from X handles, linked wallets, and thesis history.
4. Agent/MCP surfaces for creating, inspecting, and anchoring theses.
5. `$EVA` metadata, holder balances, and required usage burns for valuable public outputs.

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
│ /api/thesis-anchor/prepare · /api/eva/usage/quote · /api/mcp│
│ /.well-known/agent.json · /health                          │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼─────────────┐  ┌─────────────▼───────────────┐
│ Prediction/thesis storage   │  │ Avalanche C-Chain           │
│ markets, theses, commands   │  │ EvaThesisProtocol v2 + $EVA │
│ predictor records, history  │  │ anchors + usage-burn receipts│
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
| `$EVA` holder state | ERC-20 metadata and wallet balance used as author context, never as a credibility score or balance-threshold access rule. |
| `$EVA` usage receipt | A dead-address retirement required to publish a thesis/revision or unlock an agent proof bundle. |

Fact signals still use `claimText`/`claimHash` field names in DTOs and Solidity because the field is
an atomic factual assertion inside a thesis. That is not the removed claims-market product.

## Identity And Wallets

Writes require:

- public X handle
- externally connected self-custodial EVM wallet
- wallet source fixed to `external`

Eva does not create wallets, hold private keys, or expose an embedded-wallet fallback. The current
implementation accepts the public X handle as an author label; it is not proof of X account
ownership. Wallet control is proven by the action-bound Avalanche transactions required for a
paid write.

When a wallet is connected, Eva reads its `$EVA` balance from Avalanche C-Chain. Publishing and
paid agent outputs require an exact action-bound usage receipt rather than a minimum holder
balance. The balance does not change thesis scores or imply staking, governance, yield, or trading.

## Request Flows

### Create A Thesis

1. User connects a self-custodial wallet and supplies the public X author label.
2. User writes a thesis body and attaches market/fact signals.
3. Backend validates identity and previews the thesis without storing it.
4. Eva prepares Avalanche anchor transactions for the thesis and signals.
5. Publishing stays disabled until the prepared anchor matches the current draft and a submitted transaction hash is recorded.
6. Eva recomputes and verifies the exact `$EVA` usage receipt for this wallet and draft.
7. Eva stores the submitted-anchor thesis as revision 1 and renders the thesis page with markets, facts, score, and history.

### Evolve A Thesis

1. Market odds, closed predictions, or facts change.
2. User or agent prepares a revision draft with signal updates.
3. Eva prepares the revision anchor transaction and keeps the current thesis unchanged.
4. Publishing the update requires the matching prepared revision anchor and submitted transaction hash.
5. Eva verifies the exact `$EVA` usage receipt for this revision.
6. Eva appends immutable revision/timeline entries.
7. Readers can inspect how the thesis changed over time.

### X And Agent Use

1. X commands can track, counter, copy, or draft a thesis.
2. MCP exposes market search, thesis inspection, draft-anchor preparation, and revision-anchor preparation primitives for agents.
3. Agent draft tools return `publishState: "anchor_prepared_not_published"` rather than silently storing public theses.
4. Agent outputs must preserve source URLs, signal weights, and revision notes.
5. Agents quote a proof bundle, sign direct ERC-20 allowance and usage transactions, then present
   the receipt to unlock the formatted bundle.

### Use And Burn `$EVA`

1. Eva derives an action price and reference from quote version, chain, burner, wallet, action, and resource.
2. User or agent connects the quoted EVM wallet on Avalanche.
3. The wallet approves exactly that amount to `EvaUsageBurner` using canonical ERC-20 `approve`.
4. `retireForUsage` transfers `$EVA` to `0x000000000000000000000000000000000000dEaD`.
5. The contract emits `EvaUsedAndRetired` and increments its receipt and platform-retirement totals.
6. Eva verifies the successful event matches the wallet, use kind, reference, amount, and sink
   before releasing the action or proof bundle.

This path does not use Permit2. Eva never receives token allowance and the backend has no key or
authority that can spend a user or agent wallet.

The canonical token has an owner-only `burn(address,uint256)` function, but ownership is renounced,
so that supply-reducing function is inaccessible. The live usage contract instead reduces
circulating supply through an irrecoverable sink; the legacy token's `totalSupply()` remains
unchanged. Usage may create token demand and circulating-supply pressure, but cannot guarantee
market-price appreciation.

## Shared Configuration

`protocol.config.json` is the source of truth for:

- site URL and API base
- Avalanche chain and explorer metadata
- deployed `EvaThesisProtocol`
- deployed `EvaUsageBurner`
- canonical `$EVA` token address and metadata
- Eva agent ID and wallet
- X channel handle

Docs, frontend, backend, scripts, and deployment checks should reference that file rather than
duplicating stale contract sets.

`EvaThesisProtocol` is a UUPS proxy. The canonical proxy remains
`0x5eDBd1eea3228662326e60634E53AB8975D6641c`; protocol version 2 points to implementation
`0x51cBB77D3b5Df8031F1A916548df07D3B05ae9BB`. Upgrade receipts and blocks live in
`contracts/deployments/mainnet.json`.

`EvaUsageBurner` is immutable and has no administrator. It remains bound to canonical `$EVA` at
`0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672`; its deployment and bytecode receipts also live in
`contracts/deployments/mainnet.json`.

## Removed Scope

The following are intentionally removed from the live product:

- `/verify`, `/claims`, `/article`, `/articles`
- `/curators`, `/curator`, and legacy identity-registration UI
- platform blog and whitepaper routes
- legacy staking, challenge, settlement, paid-verification, LLM-verification, IPFS report storage,
  and article cache services

Reintroducing any of these requires a new milestone with tests, deployment checks, and updated
product copy.
