# Eva Agent MCP Guide

Use this guide when an agent is creating or revising Eva theses through MCP.

## Product Boundary

Agents can draft and prepare anchors. Agents do not publicly publish theses by themselves.

Allowed agent actions:

- search prediction markets
- inspect thesis detail
- prepare a new thesis draft for anchoring
- prepare a revision draft for anchoring
- prepare anchor transaction calldata for an existing thesis

Disallowed agent claims/actions:

- do not claim a thesis is public or published from MCP output alone
- do not broadcast an anchor transaction without explicit user approval at action time
- do not mark an anchor or revision as confirmed without a transaction receipt or contract readback
- do not expand scope into trades, custody, staking, claims markets, articles, or blog publishing

## Local MCP Server

Run the local MCP server from the monorepo root:

```bash
pnpm --filter backend mcp
```

The current MCP surface is stdio-based and backed by the local prediction/thesis service.
Remote MCP writes should be treated as unavailable unless the agent has scoped credentials and the
operator explicitly approves that path.

## Tool Surface

### `search_markets`

Input:

```json
{ "query": "SpaceX IPO" }
```

Returns up to 20 matching market snapshots. Read-only.

### `get_thesis`

Input:

```json
{ "thesisId": "thesis_..." }
```

Returns thesis detail. Read-only.

### `create_thesis_draft`

Input shape:

```json
{
  "title": "SpaceX IPO liquidity rotation thesis",
  "body": "Thesis body...",
  "xHandle": "@agent_or_user",
  "walletAddress": "0x...",
  "walletSource": "external",
  "predictionSignals": [
    {
      "marketId": "spacex-ipo-before-2027",
      "marketUrl": "https://...",
      "selectedOutcomeLabel": "Yes",
      "oddsAtAdd": 0.24,
      "currentOdds": 0.36,
      "weight": 60,
      "role": "core",
      "rationale": "Direct IPO timing signal.",
      "status": "open"
    }
  ],
  "factSignals": [
    {
      "claimText": "SpaceX has explored tender offers before a public listing.",
      "sourceUrl": "https://...",
      "verifierVerdict": "likely_true",
      "verifierScore": 82,
      "weight": 40,
      "role": "second_order",
      "rationale": "Tender offers indicate private-market liquidity pressure."
    }
  ]
}
```

Expected safety-critical output fields:

- `publishState: "anchor_prepared_not_published"`
- `anchorStatus: "prepared"`
- `anchorPreparationId`
- `transactions`
- `nextStep`

This output is not a public publish event. Treat it as an anchor-prep package awaiting user approval
and transaction confirmation.

### `prepare_revision_draft`

Input shape:

```json
{
  "thesisId": "thesis_...",
  "body": "Updated thesis body...",
  "note": "Why the thesis changed.",
  "xHandle": "@agent_or_user",
  "walletAddress": "0x..."
}
```

Expected safety-critical output fields are the same as `create_thesis_draft`. The existing thesis
must remain unchanged until the matching revision anchor is approved, submitted, and confirmed.

### `prepare_anchor_transaction`

Input:

```json
{ "thesisId": "thesis_..." }
```

Returns transaction data for an existing thesis. Transaction preparation is not broadcast.

## Shared Enum Values

Signal `role` values:

- `core`
- `lateral`
- `second_order`
- `third_order`
- `hedge`
- `contradiction`

Prediction signal `status` values:

- `open`
- `closed`
- `resolved`

Fact signal `verifierVerdict` values:

- `verified`
- `likely_true`
- `mixed`
- `misleading`
- `likely_false`
- `false`
- `unverifiable_yet`
- `non_falsifiable`

Wallet `walletSource` values:

- `external`
- `embedded`

## Agent Checklist

Before draft prep:

1. Confirm the X handle that should own the draft.
2. Confirm the wallet address and `walletSource`.
3. Preserve source URLs for fact and market signals.
4. Assign weights deliberately. Use contradictions for signals that weaken the thesis, not as generic caveats.

After draft prep:

1. Report `publishState`, `anchorStatus`, and `anchorPreparationId` to the operator.
2. Summarize what transactions were prepared, without calling them published.
3. Ask for explicit approval before any broadcast path.
4. After broadcast, require a transaction receipt or contract readback before saying `confirmed`.

## Eva Wallet Boundary

Eva's protocol wallet is `0x0fe61780bd5508b3C99e420662050e5560608cA4`.

Use that wallet only when the operator explicitly approved that signer for the task. Otherwise, use
the wallet identity supplied by the task or stop and ask for it.
