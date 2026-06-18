# Eva MCP Agent Guide

Use this guide when an agent creates or revises Eva theses through MCP. It is intentionally narrow: agents may prepare drafts and anchor transactions, but they do not silently publish public theses.

## Start Here

Run the local MCP server from the repo root:

```bash
pnpm --filter backend mcp
```

Prefer the local server for agent work. Treat remote MCP write tools as unavailable unless the agent has scoped credentials for the task.

## Live Tools

| Tool | Safe use | Mutates stored thesis state? |
|---|---|---:|
| `search_markets` | Find market candidates by optional query. | No |
| `get_thesis` | Inspect an existing thesis by `thesisId`. | No |
| `create_thesis_draft` | Preview a new thesis and prepare anchor calldata. | No |
| `prepare_revision_draft` | Preview a new revision and prepare revision-anchor calldata. | No |
| `prepare_anchor_transaction` | Rebuild anchor calldata for an existing thesis. | No |

Every write-adjacent MCP tool (`create_thesis_draft`, `prepare_revision_draft`, and `prepare_anchor_transaction`) returns `publishState: "anchor_prepared_not_published"`. That is the boundary. A prepared anchor is not a published thesis, not a confirmed revision, and not evidence of an onchain record.

## Identity Requirements

All draft or revision preparation requires:

- `xHandle`
- `walletAddress`
- wallet source where supported (`external` or `embedded`)

Use Eva's sovereign wallet (`0x0fe61780bd5508b3C99e420662050e5560608cA4`) only when the operator explicitly approved that signer for the task. Transaction broadcast always needs explicit approval at action time.

## Tool Schemas

### `search_markets`

```json
{
  "query": "spacex ipo"
}
```

`query` is optional. Results are capped to the first 20 matches.

### `create_thesis_draft`

```json
{
  "title": "SpaceX IPO liquidity rotation thesis",
  "body": "Draft thesis body...",
  "xHandle": "@agentalpha",
  "walletAddress": "0x1111111111111111111111111111111111111111",
  "walletSource": "external",
  "predictionSignals": [
    {
      "marketId": "spacex-ipo-before-2027",
      "marketTitle": "SpaceX IPO before 2027?",
      "marketUrl": "https://example.com/markets/spacex-ipo-before-2027",
      "selectedOutcomeLabel": "Yes",
      "oddsAtAdd": 0.24,
      "currentOdds": 0.36,
      "weight": 60,
      "role": "core",
      "rationale": "Direct timing signal for the thesis.",
      "status": "open"
    }
  ],
  "factSignals": [
    {
      "claimText": "SpaceX has explored tender offers before a public listing.",
      "sourceUrl": "https://example.com/source",
      "verifierVerdict": "likely_true",
      "verifierScore": 82,
      "weight": 40,
      "role": "second_order",
      "rationale": "Supports private-market liquidity pressure."
    }
  ]
}
```

Important ranges and enums:

- odds: `0` to `1`
- weights: `1` to `100`
- signal roles: `core`, `lateral`, `second_order`, `third_order`, `hedge`, `contradiction`
- market status: `open`, `closed`, `resolved`
- fact verdicts: `verified`, `likely_true`, `mixed`, `misleading`, `likely_false`, `false`, `unverifiable_yet`, `non_falsifiable`

Expected draft-prep output includes:

- `publishState: "anchor_prepared_not_published"`
- `anchorPreparationId`
- `anchorStatus: "prepared"`
- previewed `thesis`, `markets`, `predictor`, and `counters`
- `transactions` for user-approved anchoring
- `nextStep` telling the agent to get user approval before publishing

### `get_thesis`

```json
{
  "thesisId": "thesis_abc123"
}
```

Use this before revising. Do not infer current revision state from old comments, screenshots, or prior drafts.

### `prepare_revision_draft`

```json
{
  "thesisId": "thesis_abc123",
  "body": "Updated thesis body after the catalyst moved.",
  "note": "Catalyst update.",
  "xHandle": "@agentalpha",
  "walletAddress": "0x1111111111111111111111111111111111111111"
}
```

This previews the next revision and prepares calldata. It does not append to thesis history. Only claim a revision is live after the public publish path has a matching prepared anchor, submitted transaction hash, and confirmed contract readback or receipt.

### `prepare_anchor_transaction`

```json
{
  "thesisId": "thesis_abc123"
}
```

Use this to rebuild anchor calldata for an existing thesis. It is still preparation only.

Expected output uses the same safe boundary wrapper as draft/revision preparation:

- `publishState: "anchor_prepared_not_published"`
- `anchorPreparationId`
- `anchorStatus: "prepared"`
- existing `thesis`, linked `markets`, `predictor`, and `counters`
- `transactions` for user-approved anchoring
- `nextStep` telling the agent to get user approval before broadcasting

## Safe Write Boundary

Agents may:

- search markets,
- inspect theses,
- draft new theses,
- draft revisions,
- prepare anchor calldata,
- summarize the prepared transaction for the user.

Agents must not:

- broadcast transactions without explicit approval,
- claim a thesis or revision is published from MCP output alone,
- claim public blog/article support,
- reintroduce removed `/claims`, `/articles`, curator, staking, challenge, settlement, paid-verification, or LLM-verification scope,
- omit source URLs, signal weights, or revision notes when they materially affect the thesis.

## Minimal Agent Workflow

1. `search_markets` for candidate market signals.
2. Draft the thesis body and collect fact sources.
3. Call `create_thesis_draft` with X plus wallet identity.
4. Show the prepared summary and transactions to the user.
5. Wait for explicit approval before any broadcast or public publish path.
6. For updates, call `get_thesis`, then `prepare_revision_draft`, then repeat the approval boundary.
