# Eva MCP Agent Examples

Copy-paste these payloads when an agent needs to create or revise Eva theses through MCP without guessing at schema shape.

Boundary: every write-adjacent example below prepares draft/anchor calldata only. It does not publish, broadcast, stake, create a public article, or confirm onchain state.

Use alongside:

- `docs/MCP_AGENT_QUICKSTART.md` for the five-minute flow
- `docs/MCP_AGENT_GUIDE.md` for full schemas and enums
- `docs/AGENT_SAFE_OUTPUTS.md` for user-facing wording
- `docs/MCP_AGENT_HANDOFF_TEMPLATE.md` for handoffs after preparation

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
