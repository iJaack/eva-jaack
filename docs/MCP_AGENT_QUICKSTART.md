# MCP Agent Quickstart

Use this as the five-minute path for agents that need to create or revise Eva theses without guessing at write boundaries. The deeper references are `docs/MCP_AGENT_GUIDE.md`, `docs/MCP_AGENT_EXAMPLES.md`, `docs/MCP_AGENT_ERROR_HANDLING.md`, and `docs/AGENT_SAFE_OUTPUTS.md`.

This quickstart is expected to match the live MCP server allowlist and Zod schemas. If code changes a tool name, enum, or publish-state marker, update the agent docs and onboarding skill in the same PR before agents rely on it.

## Boundary First

Eva MCP is draft-and-anchor-prep only.

## No-Guesswork Preflight

Before any write-adjacent MCP call, fill this out mentally or in the handoff. If any row is unclear, stop before preparing calldata.

| Check | Required answer before continuing | If missing |
|---|---|---|
| Intent | `read-only`, `new draft`, `revision`, or `anchor rebuild` | Ask for the exact operation. |
| Identity | operator-approved `xHandle` and `walletAddress` | Block; do not substitute Eva's wallet or a remembered address. |
| Signer/source | `walletSource` when the live tool accepts it | Use `external` only when that is the approved signer source. |
| Evidence | real market/source URLs, or an explicit signal-light choice | Use empty arrays and say signal-light; do not invent evidence. |
| Scope | no request for publish, broadcast, claims, articles/blog, staking, custody, settlement, or LLM verification | Stop unless a separate approved path and evidence exist. |
| Storage claim | `storage not assessed`, `storage readiness blocked`, or `storage verified by <check>` | Default to `storage not assessed` for local MCP prep. |

This preflight is part of the safety boundary. It is better to return `blocked:` with one missing field than to prepare the wrong identity, imply publication, or turn a storage unknown into launch readiness.

Use this permission ladder before and after every write-adjacent call:

| Rung | Evidence required | Safe language |
|---|---|---|
| `read-only` | `search_markets` or `get_thesis` result only | "inspected" / "found candidates" |
| `draft prepared` | `create_thesis_draft` or `prepare_revision_draft` returned `publishState: "anchor_prepared_not_published"` | "prepared for review" |
| `anchor prepared` | `anchorStatus: "prepared"` plus transaction calldata | "calldata ready for approval" |
| `submitted` | explicit user approval plus a transaction hash | "submitted, pending confirmation" |
| `published/live` | public publish path completed and receipt/readback matches the thesis or revision | "live" / "confirmed" |

MCP alone never reaches the `submitted` or `published/live` rungs. Do not skip rungs when reporting status.

Agents may:

- search markets,
- inspect an existing thesis,
- prepare a new thesis draft,
- prepare a revision draft,
- rebuild anchor calldata for an existing thesis.

Agents must not claim MCP has published, broadcast, anchored, revised, or made a thesis public. Those claims require a separate approved publish/broadcast path plus transaction evidence.

## Storage Durability Boundary

MCP draft prep is not durable-production proof. A successful `create_thesis_draft`, `prepare_revision_draft`, or `prepare_anchor_transaction` response only proves the current tool call produced a preview and calldata. It does not prove the prepared state survived a deployment, serverless cold start, process restart, or production storage failover.

For local onboarding, this is fine: treat the result as a rehearsal artifact. For production handoffs, include one of these states explicitly:

- `storage not assessed` — local/dry-run preparation only.
- `storage readiness blocked` — production health/readiness does not expose durable write-path evidence.
- `storage verified` — an approved readback or readiness check proves the thesis/revision state is persisted in the intended production store.

Do not use prepared anchor calldata, an `anchorPreparationId`, or a green generic `/health` response as proof that production thesis writes are durable. If durability matters, block on an ops-safe readiness/readback check instead of implying launch readiness.

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

For copy-paste payloads that match these tools, use `docs/MCP_AGENT_EXAMPLES.md`.

## Pick The Right Operation

Use this decision path before touching a write-adjacent tool:

1. Need evidence candidates only? Use `search_markets` and stop at read-only notes.
2. Need to change an existing thesis? Use `get_thesis` first, then `prepare_revision_draft`. Do not create a replacement thesis because the old id is missing or inconvenient.
3. Need a brand-new thesis preview? Use `create_thesis_draft`.
4. Need to rebuild calldata for an already-prepared thesis without changing text? Use `prepare_anchor_transaction`.
5. Need publication, transaction broadcast, article/blog output, claims, staking, challenge/settlement, paid verification, or LLM verification? Stop. That is outside current MCP scope unless a separate approved path and evidence are provided.

Identity rule: if the requested `xHandle`, `walletAddress`, or signer authority is missing or mismatched, block and ask for the correct approved identity. Do not swap wallets, invent handles, or use Eva's wallet as a convenience fallback.

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

Copy this result card into user or agent handoffs so the next step is obvious:

```text
prepared: <new thesis draft | revision draft | anchor rebuild>
tool: <create_thesis_draft | prepare_revision_draft | prepare_anchor_transaction>
rung: draft prepared / anchor prepared only
publishState: anchor_prepared_not_published
anchorStatus: prepared
storage: <not assessed | readiness blocked | verified by named check>
next evidence needed: explicit approval, transaction hash, and receipt/readback before any live/published claim
```

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
      "reportUri": "ipfs://example-report",
      "reportHash": "0xabc123",
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
- `reportUri` and `reportHash` are optional fact-signal evidence pointers. Include them only when they already exist; do not fabricate hashes or storage URIs.
- identity fields are not interchangeable. If the wallet or X handle is wrong, ask for the correct approved identity.

## Stop Conditions

Stop and report `blocked:` if:

- `get_thesis` cannot find the thesis,
- the requested wallet or X handle is missing or unauthorized,
- the MCP result lacks enough evidence to distinguish draft prep from publish,
- the user asks you to broadcast without explicit approval for the exact transaction,
- a removed tool path is required (`/claims`, `/articles`, curator, staking, challenge/settlement, paid verification, or LLM verification).

Do not fill gaps by scraping the UI, changing wallets, creating a replacement thesis, or claiming publication from prepared calldata.
