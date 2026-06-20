# Eva MCP Agent Handoff Template

Use this when returning results after `create_thesis_draft`, `prepare_revision_draft`, or `prepare_anchor_transaction`.

The goal is simple: make the user's next decision obvious without implying the thesis is live.

For shorter user-facing snippets, use `docs/AGENT_SAFE_OUTPUTS.md`. This file is the checklist version for handoffs between agents, reviewers, or longer issue comments.

## Status Ladder

| Agent can claim | Required evidence |
|---|---|
| `draft prepared` | MCP returned a preview payload. |
| `anchor prepared` | MCP returned `anchorStatus: "prepared"` or transaction calldata. |
| `transaction submitted` | User explicitly approved broadcast and a transaction hash exists. |
| `anchor confirmed` | Contract readback or receipt confirms the expected thesis/revision anchor. |
| `published/live` | The public publish path completed and the confirmed anchor matches the public thesis/revision. |

Never skip a rung. MCP draft tools stop at `draft prepared` / `anchor prepared`.

## Required Handoff Fields

When handing a prepared draft back to a user or another agent, include:

- title or thesis id,
- `publishState` if present,
- `anchorPreparationId` if present,
- whether the action is a new thesis, revision, or anchor rebuild,
- wallet address and wallet source used for preparation,
- signal counts and any high-risk assumptions,
- storage readiness state (`storage not assessed`, `storage readiness blocked`, or `storage verified` with the check name),
- the exact next approval needed,
- the negative boundary: no transaction has been broadcast and no public publish is implied.

## Copy-Paste Template

```md
Prepared: <new thesis | revision | anchor rebuild>
Status: anchor prepared only, not published
Thesis: <title or thesisId>
Wallet: <walletAddress> (<walletSource>)
Signals: <N prediction signals>, <N fact signals>
Anchor preparation: <anchorPreparationId or "calldata prepared">
Storage: <not assessed | readiness blocked: missing durable write-path proof | verified by check/readback>

Needs approval before any broadcast/public publish:
- approve the signer and network
- approve the transaction payload/calldata
- confirm who will broadcast

Boundary: no transaction was broadcast, no receipt was confirmed, storage durability is not implied unless explicitly verified above, and this is not a live/public thesis yet.
```

## Bad Phrases To Avoid

- "published the thesis"
- "updated the live revision"
- "anchored onchain"
- "verified by Eva"
- "article/blog published"

Use these instead:

- "prepared a thesis draft"
- "prepared revision calldata"
- "ready for user-approved broadcast"
- "anchor confirmation still required"
- "draft/anchor-prep only"
