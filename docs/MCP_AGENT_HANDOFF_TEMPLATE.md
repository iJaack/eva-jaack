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
- market policy state (`MCP-filtered`, `screened against docs/MARKET_POLICY.md`, or `off-policy market omitted`),
- storage readiness state (`storage not assessed`, `storage readiness blocked`, or `storage verified` with the check name),
- the exact next approval needed,
- the negative boundary: no transaction has been broadcast and no public publish is implied.

## Signer / Wallet Source Handling

Do not force every handoff into the `create_thesis_draft` shape. The live tools expose signer fields differently:

| Operation | Handoff signer wording | Do not invent |
|---|---|---|
| New thesis draft | `Wallet: <walletAddress> (<walletSource>)` when `walletSource` was supplied or defaulted. | Do not call a defaulted `external` value approval unless the task named it. |
| Revision draft | `Wallet: <walletAddress>; walletSource: not accepted by prepare_revision_draft` plus the task-time signer/source approval in notes. | Do not add `walletSource` to the revision payload or imply it was returned. |
| Anchor rebuild | `Thesis: <thesisId>; signer/source approval: <named approval or not required for calldata rebuild>` when no wallet fields were accepted by the tool. | Do not attach a different wallet identity just to make the handoff look complete. |

If signer/source approval was not explicit, say `signer/source approval: missing before broadcast`. A prepared payload can still be summarized, but it cannot become transaction approval, broadcast authority, or publish/live evidence.

## Copy-Paste Template

```md
Prepared: <new thesis | revision | anchor rebuild>
Status: anchor prepared only, not published
Thesis: <title or thesisId>
Wallet / signer source: <walletAddress + walletSource | walletAddress; walletSource not accepted by this tool | signer/source approval missing before broadcast>
Signals: <N prediction signals>, <N fact signals>
Market policy: <MCP-filtered | screened against docs/MARKET_POLICY.md | off-policy market omitted / signal-light>
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
