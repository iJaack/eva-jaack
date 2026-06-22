# Eva MCP Agent Examples

Copy-paste these payloads when an agent needs to create or revise Eva theses through MCP without guessing at schema shape.

Boundary: every write-adjacent example below prepares draft/anchor calldata only. It does not publish, broadcast, stake, create a public article, or confirm onchain state.

Use alongside:

- `docs/MCP_AGENT_QUICKSTART.md` for the five-minute flow
- `docs/MCP_AGENT_GUIDE.md` for full schemas and enums
- `docs/AGENT_SAFE_OUTPUTS.md` for user-facing wording
- `docs/MCP_AGENT_HANDOFF_TEMPLATE.md` for handoffs after preparation

## 0. Pick the smallest safe tool first

| Intent | First tool | Continue only if |
|---|---|---|
| Find evidence candidates | `search_markets` | The user asked for research or signal discovery. |
| Revise a thesis | `get_thesis` | The thesis id, author wallet, and X handle match the approved identity. |
| Prepare a new thesis | `create_thesis_draft` | The operator-approved identity is present and signals are real or intentionally empty. |
| Rebuild calldata | `prepare_anchor_transaction` | The thesis already exists and no text change is requested. |
| Publish/broadcast/article/claim/stake/settle/verify | none via MCP | A separate approved path and evidence exist. |

If the task asks for more than the selected tool can safely prove, report the missing evidence instead of upgrading the claim.

Annotation reminder: `search_markets` and `get_thesis` are read-only. Draft-prep tools are explicitly not read-only even though they are non-destructive and idempotent. Treat tool annotations as routing hints, not approval, tx submission, publication, or storage-readiness evidence.

## 0.1 Parse the MCP result envelope

Eva MCP responses are usually wrapped as SDK text content. The safe markers are inside the JSON string at `content[0].text`:

```json
{
  "content": [
    { "type": "text", "text": "{\"publishState\":\"anchor_prepared_not_published\",\"anchorStatus\":\"prepared\"}" }
  ]
}
```

Parse the text before reading `publishState`, `anchorStatus`, `anchorPreparationId`, `transactions`, or `nextStep`. If `isError: true`, the text part is absent, or the text is not valid JSON for the expected tool, use the blocked template instead of claiming draft, anchor, publish, submission, confirmation, or storage state.

Result-card pattern for every write-adjacent example below:

```text
prepared: <new thesis draft | revision draft | anchor rebuild>
tool: <tool name>
rung: draft prepared / anchor prepared only
publishState: anchor_prepared_not_published
anchorStatus: prepared
storage: not assessed unless a named readiness/readback check was run
next evidence needed: explicit approval, transaction hash, and receipt/readback before live/published wording
```

Default-handling rule: schema defaults are not approval. If `walletSource`, signal weights, roles, status, verifier verdicts, or verifier scores are filled by defaults instead of task evidence, label them as defaulted or signal-light in the handoff. Do not use defaulted signal fields to claim the draft is signal-backed, verified, published, broadcast, or storage-ready.

Quick action contract to copy before any write-adjacent example:

```text
operation: <new draft | revision | anchor rebuild>
identity source: <task-time approval for xHandle + walletAddress + walletSource, or blocked>
evidence source: <real URLs | explicitly signal-light | named readiness/readback check | blocked>
output ceiling: <draft prepared | anchor prepared>
```

Do not let the payload outrun that contract. If the contract says signal-light, use empty arrays or label defaulted signal metadata. If the contract says `anchor prepared`, the result card must not say submitted, confirmed, published/live, or storage verified.

## 1. Read-only market search

Tool: `search_markets`

Use this before drafting when the thesis needs prediction-market evidence.

```json
{
  "query": "spacex ipo"
}
```

Safe result language:

```text
found candidate markets for review. no draft, transaction, or public publish happened.
```

## 2. Signal-light new thesis draft

Tool: `create_thesis_draft`

Use this only when the operator wants a draft scaffold and no reliable evidence sources are ready yet. Empty signal arrays are safer than invented evidence.

```json
{
  "title": "SpaceX IPO liquidity rotation thesis",
  "body": "SpaceX IPO anticipation is pulling speculative attention forward. If the IPO path becomes explicit, attention and liquidity may rotate from private-market speculation into adjacent public risk assets.",
  "xHandle": "@agentalpha",
  "walletAddress": "0x1111111111111111111111111111111111111111",
  "walletSource": "external",
  "predictionSignals": [],
  "factSignals": []
}
```

Expected safe markers:

- `publishState: "anchor_prepared_not_published"`
- `anchorStatus: "prepared"`
- `anchorPreparationId`
- transaction payloads for later approval
- storage state: `storage not assessed` unless a separate persistence/readback check was run

Safe result language:

```text
prepared: signal-light thesis draft and anchor calldata are ready for review.

signals: 0 market signals, 0 fact signals. no sources were invented.
storage: not assessed by this MCP call.

this is not published or anchored. explicit approval, broadcast, and receipt/readback are still required before calling it live.
```

## 3. Signal-backed new thesis draft

Tool: `create_thesis_draft`

Use this when the agent has real market and fact evidence. Keep URLs, weights, roles, and rationales explicit.

```json
{
  "title": "SpaceX IPO liquidity rotation thesis",
  "body": "SpaceX IPO anticipation is absorbing speculative liquidity before the listing path is official. If private-market liquidity keeps tightening while IPO odds rise, adjacent risk markets can reprice around attention rotation.",
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
      "rationale": "Direct timing signal for the thesis catalyst.",
      "status": "open"
    }
  ],
  "factSignals": [
    {
      "claimText": "SpaceX has used private tender offers as a liquidity path before a public listing.",
      "sourceUrl": "https://example.com/source",
      "verifierVerdict": "likely_true",
      "verifierScore": 82,
      "weight": 40,
      "role": "second_order",
      "rationale": "Supports the liquidity-pressure part of the thesis."
    }
  ]
}
```

Do not replace missing URLs with placeholders in real runs. If a source URL is unknown, omit it and call out the gap in the handoff.

## 4. Existing thesis revision prep

Tools: `get_thesis`, then `prepare_revision_draft`

Use this when an existing thesis changes. Always inspect the thesis first.

`prepare_revision_draft.body` is a full replacement body. Do not send a patch, diff, append-only note, or partial paragraph as `body`; put the delta summary in `note`.

First call `get_thesis`:

```json
{
  "thesisId": "thesis_abc123"
}
```

Then verify title, current revision, X handle, and wallet before preparing a replacement body:

```json
{
  "thesisId": "thesis_abc123",
  "body": "Updated thesis body after the IPO odds moved and the latest liquidity evidence weakened the original timing assumption.",
  "note": "Updated catalyst timing and added weaker-liquidity caveat.",
  "xHandle": "@agentalpha",
  "walletAddress": "0x1111111111111111111111111111111111111111"
}
```

Safe result language:

```text
prepared: revision draft and revision-anchor calldata are ready for review.

this does not update the live thesis. the previous public state remains the source of truth until the approved transaction is broadcast and confirmed by receipt/readback.
storage: not assessed unless a separate production persistence/readback check was run.
```

## 5. Existing thesis anchor rebuild

Tool: `prepare_anchor_transaction`

Use this only to rebuild calldata for an already-prepared or stored thesis without changing text.

```json
{
  "thesisId": "thesis_abc123"
}
```

Safe result language:

```text
prepared: anchor transaction payload rebuilt for thesis_abc123.

this is calldata only. it does not publish, revise, broadcast, or confirm anything by itself.
storage: not assessed by this calldata rebuild.
```

## 6. Blocked identity handoff

Use this shape when the requested identity is missing or mismatched. Do not substitute Eva's wallet, an embedded wallet, or a remembered address.

```text
blocked: the requested thesis preparation is missing an approved signer identity.

missing evidence:
- approved xHandle: <missing or mismatched>
- approved walletAddress: <missing or mismatched>
- walletSource: <external or embedded, when required>

I did not prepare calldata, broadcast a transaction, publish a thesis, or change identity fields.
```

## 7. Blocked publish or launch-readiness request

Use this when the request asks the agent to publish, anchor, make a thesis live, or prove production launch readiness but the available evidence is only MCP draft prep.

```text
blocked: MCP can prepare drafts and anchor calldata, but it cannot by itself publish, broadcast, or prove production storage readiness.

safe current state:
- prepared state available: <none | draft prepared | anchor calldata prepared>
- storage: <not assessed | readiness blocked: missing durable write-path proof>

missing before stronger claim:
- explicit approval for the signer/network and transaction payload
- broadcaster or approved publish path
- transaction hash
- receipt or contract readback matching the thesis/revision
- durable-storage readiness/readback check if launch readiness is part of the request

I did not broadcast a transaction, publish a thesis, mark a revision live, or claim production storage is durable.
```

If a separate approved path exists outside MCP, report that path by name and include its receipt/readback evidence. Otherwise keep the handoff at `draft prepared` / `anchor prepared` or `blocked`.

## 7.1 Separate approved execution path receipt

Use this only when the operator explicitly approved a non-MCP route, broadcaster, or production write path. This is not a default MCP capability.

```text
approved execution path: <route/tool/broadcaster name>
approval evidence: <who approved, exact scope, signer/network, payload or route>
credential scope: <local/dev/staging/production and allowed action>
write receipt: <response id | tx hash | public URL | API readback id>
readback evidence: <endpoint/contract/public URL checked and matching field>
safe claim after execution: <submitted | confirmed | published/live | storage verified>
```

Example downgrade:

```text
blocked: I have prepared calldata, but the approved execution path receipt is incomplete.

missing:
- approval evidence for broadcast scope
- tx hash or write receipt
- receipt/readback matching the thesis

safe current claim: anchor prepared only, not submitted or published.
```

## 8. Safe-start triage cards for mixed prompts

Use these cards before tools when a prompt asks for more than MCP can prove. The point is to select the smallest live MCP tool and downgrade the final claim before the agent accidentally overstates the result.

### Draft plus publish request

```text
requested verb: draft and publish
approved identity: @agentalpha / 0x1111111111111111111111111111111111111111 / external
smallest live MCP tool: create_thesis_draft
safe rung after call: draft prepared / anchor prepared only
storage wording: storage not assessed
stop condition: publish/broadcast wording needs explicit approval, tx hash, and receipt/readback
```

Safe result language:

```text
prepared: draft and anchor calldata are ready for review.

boundary: this is not published, broadcast, anchored, or storage-verified. missing before publish/live wording: explicit approval, transaction hash, receipt/readback, and any required durable-storage check.
```

### Revise this thesis request

```text
requested verb: revise this thesis
approved identity: @agentalpha / 0x1111111111111111111111111111111111111111 / external
smallest live MCP tool: get_thesis, then prepare_revision_draft
safe rung after call: draft prepared / anchor prepared only
storage wording: storage not assessed
stop condition: missing thesisId, mismatched author identity, or partial body instead of full replacement body
```

Safe result language:

```text
prepared: revision draft and revision-anchor calldata are ready for review.

boundary: the current public thesis is unchanged until the approved transaction is broadcast and confirmed by receipt/readback.
```

### Anchor or launch-readiness request

```text
requested verb: anchor it / prove launch readiness
approved identity: existing thesis author identity confirmed, or missing
smallest live MCP tool: prepare_anchor_transaction for calldata rebuild; none for storage readiness proof
safe rung after call: anchor prepared or blocked
storage wording: storage readiness blocked unless a named readiness/readback check proves durable storage
stop condition: user expects broadcast, confirmation, public publish, or production durability from MCP output alone
```

Safe result language:

```text
prepared: anchor transaction payload rebuilt for review.

boundary: no transaction was broadcast or confirmed. storage readiness is blocked unless a separate approved readiness/readback check proves the prepared thesis state persisted.
```

## Quick validation checklist

Before running a draft-prep tool:

- X handle and wallet are operator-approved.
- `walletSource` is present where the live schema accepts it.
- Odds are numbers from `0` to `1`.
- Weights are numbers from `1` to `100`.
- Signal roles are one of `core`, `lateral`, `second_order`, `third_order`, `hedge`, or `contradiction`.
- Market statuses are one of `open`, `closed`, `resolved`, or `cancelled`.
- Fact verdicts are one of `verified`, `likely_true`, `mixed`, `misleading`, `likely_false`, `false`, `unverifiable_yet`, or `non_falsifiable`.
- No removed-scope path is implied: claims, articles, curator, staking, challenge/settlement, paid verification, LLM verification, public publish, or transaction broadcast.

Before reporting the result, place it on the permission ladder:

- `read-only`: searched or inspected only.
- `draft prepared`: preview exists and `publishState: "anchor_prepared_not_published"` is present.
- `anchor prepared`: calldata is ready for approval.
- `submitted`: exact transaction was user-approved and a tx hash exists.
- `published/live`: public publish path completed and receipt/readback matches the prepared thesis or revision.

MCP alone never reaches the `submitted` or `published/live` rungs.

Storage note: MCP alone also never proves production write durability. Use `storage not assessed` for local/dry-run preparation, `storage readiness blocked` when production readiness does not expose durable write-path evidence, and `storage verified` only after an approved readiness/readback check proves persisted thesis state.

## Result evidence inventory

Use this compact inventory after any `create_thesis_draft`, `prepare_revision_draft`, or `prepare_anchor_transaction` response. Fill it from returned fields only:

```text
tool: <tool name>
intent: <new draft | revision draft | anchor rebuild>
identity: <xHandle> / <walletAddress> / <walletSource or not accepted by tool>
publishState: <returned value or not returned>
anchorStatus: <returned value or not returned>
anchorPreparationId: <returned value or not returned>
transactions: <count and purpose, or not returned>
tx hash / receipt / readback: not returned unless separately verified
content: <title or thesisId>, <signal counts>, <source URL gaps>
storage: <not assessed | readiness blocked | verified by named check>
safe rung: <draft prepared | anchor prepared | blocked>
```

If the inventory says `not returned` for the marker needed by the requested claim, downgrade the claim or block. Do not replace missing evidence with guesses from previous comments, UI state, or a generic health check.
