# MCP Agent Quickstart

Use this as the five-minute path for agents that need to create or revise Eva theses without guessing at write boundaries. The deeper references are `docs/MCP_AGENT_GUIDE.md`, `docs/MCP_AGENT_ERROR_HANDLING.md`, and `docs/AGENT_SAFE_OUTPUTS.md`.

## Boundary First

Eva MCP is draft-and-anchor-prep only.

Agents may:

- search markets,
- inspect an existing thesis,
- prepare a new thesis draft,
- prepare a revision draft,
- rebuild anchor calldata for an existing thesis.

Agents must not claim MCP has published, broadcast, anchored, revised, or made a thesis public. Those claims require a separate approved publish/broadcast path plus transaction evidence.

## Start The Local MCP Server

From the repo root:

```bash
pnpm --filter backend mcp
```

Prefer local MCP for agent work. Treat remote MCP writes as unavailable unless the operator supplied scoped credentials and explicitly approved that remote path.

## Live Tool Names

Only these MCP tools are live for agent thesis work:

| Tool | Use it for | Safe output claim |
|---|---|---|
| `search_markets` | Find candidate prediction-market signals. | Read-only market search. |
| `get_thesis` | Load current thesis state before a revision. | Read-only thesis inspection. |
| `create_thesis_draft` | Preview a new thesis and prepare anchor calldata. | Draft/anchor prepared, not published. |
| `prepare_revision_draft` | Preview a replacement revision body and prepare revision calldata. | Revision prepared, not live. |
| `prepare_anchor_transaction` | Rebuild anchor calldata for an existing thesis. | Anchor calldata rebuilt, not broadcast. |

If a prompt, client, or autocomplete shows any other write tool, stop and treat it as stale.

## New Draft: Minimum Safe Payload

Use empty signal arrays when evidence is not ready yet. Do not invent markets, URLs, scores, or weights to satisfy the schema.

```json
{
  "title": "SpaceX IPO liquidity rotation thesis",
  "body": "Draft thesis body...",
  "xHandle": "@agentalpha",
  "walletAddress": "0x1111111111111111111111111111111111111111",
  "walletSource": "external",
  "predictionSignals": [],
  "factSignals": []
}
```

Expected result markers:

- `publishState: "anchor_prepared_not_published"`
- `anchorStatus: "prepared"`
- `anchorPreparationId`
- `transactions`
- `nextStep` requiring user approval before publish/broadcast

Safe user wording:

```text
prepared: thesis draft and anchor calldata are ready for review.

This is not published or anchored. User approval plus a submitted transaction and confirmed receipt/readback are still required before calling it live.
```

## New Draft: Signal-Backed Payload Pattern

Use real source URLs and explicit weights when signals are material.

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

## Revision Flow

1. Call `get_thesis` with the canonical `thesisId`.
2. Verify the current title, revision version, X handle, and wallet before changing anything.
3. Call `prepare_revision_draft` with the full replacement `body` and a short `note` explaining the delta.
4. Report it as a prepared revision only.
5. Wait for explicit broadcast approval and confirm by receipt/readback before saying the revision is live.

Revision payload shape:

```json
{
  "thesisId": "thesis_abc123",
  "body": "Updated thesis body after the catalyst moved.",
  "note": "Catalyst update.",
  "xHandle": "@agentalpha",
  "walletAddress": "0x1111111111111111111111111111111111111111"
}
```

`prepare_revision_draft` does not currently accept `walletSource`. Do not add that field unless the live schema changes.

## Schema Repair Checklist

When validation fails, repair the payload instead of changing the task boundary.

- odds must be numbers from `0` to `1`.
- weights must be numbers from `1` to `100`.
- signal roles are `core`, `lateral`, `second_order`, `third_order`, `hedge`, or `contradiction`.
- market statuses are `open`, `closed`, `resolved`, or `cancelled`.
- fact verdicts are `verified`, `likely_true`, `mixed`, `misleading`, `likely_false`, `false`, `unverifiable_yet`, or `non_falsifiable`.
- URLs must be valid URLs when supplied. Omit unknown URLs and state the missing source in the handoff.
- identity fields are not interchangeable. If the wallet or X handle is wrong, ask for the correct approved identity.

## Stop Conditions

Stop and report `blocked:` if:

- `get_thesis` cannot find the thesis,
- the requested wallet or X handle is missing or unauthorized,
- the MCP result lacks enough evidence to distinguish draft prep from publish,
- the user asks you to broadcast without explicit approval for the exact transaction,
- a removed tool path is required (`/claims`, `/articles`, curator, staking, challenge/settlement, paid verification, or LLM verification).

Do not fill gaps by scraping the UI, changing wallets, creating a replacement thesis, or claiming publication from prepared calldata.
