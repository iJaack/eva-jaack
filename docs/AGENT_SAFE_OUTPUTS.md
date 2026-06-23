# Agent-Safe Output Contracts

Use this when turning Eva MCP results into user-facing agent updates. The goal is simple: say exactly what happened, what is safe to do next, and what is still outside agent scope.

## Golden Rule

A prepared draft, revision, or anchor transaction is not a public publish event.

Agents may describe prepared content and transaction calldata. Agents must not claim a thesis is live, anchored, revised, or publicly published until there is explicit user approval plus a submitted transaction hash and confirmed receipt or contract readback.

## Pre-send Audit Checklist

Run this immediately before sending any user-facing MCP result. The goal is to catch over-strong verbs before they leave the agent.

- MCP envelope parsed: status markers came from parsed `content[0].text` JSON, not from the tool name or SDK wrapper.
- Coordination/protocol split preserved: Multica issue state, PR state, deployment state, or comments are not protocol evidence.
- Final verb fits evidence: use `inspected`, `prepared`, `calldata ready`, `submitted`, or `published/live` only at the matching permission ladder rung.
- Storage wording is explicit: `storage not assessed`, `storage readiness blocked`, or `storage verified by <named check>`.
- Boundary named: say what did not happen (`no transaction broadcast`, `no public publish`, `current public revision unchanged`) when the user might otherwise infer it.
- Stronger-claim gap named: approval, tx hash, receipt/readback, durable storage check, or real source URLs.

If any line fails, downgrade the claim or use `blocked:`. Do not rely on optimistic phrasing, old handoffs, or platform status to fill missing protocol evidence.

## Minimal Result Card

Use this compact card whenever another agent, reviewer, or user might otherwise confuse preparation with publication:

```text
prepared: <new thesis draft | revision draft | anchor rebuild | read-only inspection>
tool: <tool name>
rung: <read-only | draft prepared | anchor prepared | submitted | published/live>
publishState: <anchor_prepared_not_published | not applicable>
anchorStatus: <prepared | not applicable>
storage: <not assessed | readiness blocked | verified by named check>
next evidence needed: <approval / tx hash / receipt-readback / storage check / none>
boundary: no transaction broadcast and no public publish unless explicitly evidenced above
```

Keep `published/live` out of this card unless the public publish path completed and a receipt or contract readback matches the thesis/revision. If storage is not directly proven by a named readiness or readback check, use `storage: not assessed` or `storage: readiness blocked`.

## Output Ceiling Gate

Before writing the final user-facing sentence, compare it to the action contract from the quickstart:

```text
operation: <read-only | new draft | revision | anchor rebuild>
identity source: <task-time approval or blocked>
evidence source: <real URLs | signal-light | named readiness/readback check | blocked>
output ceiling: <read-only | draft prepared | anchor prepared | submitted | published/live>
```

The final sentence must stay at or below `output ceiling`:

- `read-only` ceiling -> no draft, revision, calldata, anchor, publish, or storage claim.
- `draft prepared` ceiling -> preview/revision prepared only; no broadcast or live wording.
- `anchor prepared` ceiling -> calldata ready for approval only; no submitted/confirmed wording.
- `submitted` ceiling -> tx hash exists, but no confirmed/live wording without receipt/readback.
- `published/live` ceiling -> only with the separate approved execution path plus receipt/readback evidence.

If the user's requested wording is above the ceiling, use the claim downgrade pattern below and name the missing evidence.

## Evidence Inventory For Handoffs

Before sending a result card, copy only evidence the MCP response or named follow-up check actually returned. Do not infer hidden state from a familiar tool name.

MCP clients usually wrap Eva results in a text envelope. Parse `content[0].text` as JSON before filling the inventory. If `isError: true`, the text part is missing, or the text is not parseable JSON when JSON was expected, report `blocked:` instead of inventing marker values.

MCP text parser rule: extract the first text part once, parse that JSON, and fill the inventory only from the parsed object. If the parser cannot produce JSON, the safe result is `blocked`, not a guessed partial success. Do not use the tool name, request intent, or SDK envelope as a substitute for returned `publishState`, `anchorStatus`, tx hash, receipt/readback, storage readiness, or public/live evidence.

Minimum inventory for write-adjacent results:

- operation evidence: tool name, requested intent, and approved `xHandle` / `walletAddress`,
- output markers: `publishState`, `anchorStatus`, and `anchorPreparationId` when present,
- transaction evidence: transaction count, network/chain if returned, target contract/function if returned, and whether a tx hash exists,
- content evidence: thesis title or `thesisId`, revision version if returned, signal counts, and any source URL gaps,
- storage evidence: `not assessed`, `readiness blocked`, or `verified by <named check>`.

If a field is absent, write `not returned` or omit it. Never upgrade an absent tx hash into submission, an absent receipt into confirmation, or an absent storage check into launch readiness.

## Schema Defaults Are Not Approval

Schema defaults can make a draft-prep payload valid, but they do not prove the operator approved the signer, that a signal is evidenced, or that a public action happened.

Before reporting a write-adjacent result, separate explicit evidence from defaulted fields:

| Defaulted field | Safe wording | Do not say |
|---|---|---|
| `walletSource: "external"` from schema default | "signer/source: defaulted; approval still required unless task evidence named it" | "external signer approved" |
| signal defaults like `weight: 50`, `role`, `status: "open"`, `verifierVerdict: "unverifiable_yet"`, `verifierScore: 50` | "defaulted signal metadata" or "signal-light" | "weighted/verified from evidence" |
| empty signal arrays | "0 signals; no sources were invented" | "signal-backed" |
| missing tx hash, receipt, or readback | "not returned" / "not assessed" | "submitted", "confirmed", or "live" |

If a default would affect identity authority, evidence quality, risk weighting, storage readiness, or public/live wording, report the missing explicit evidence instead of relying on the default.

## Claim Downgrade Pattern

When a user, issue, or agent handoff asks for stronger wording than the evidence supports, keep the action on the safe rung and name the missing proof.

| Requested wording | If evidence is only MCP prep, say | Missing proof before stronger claim |
|---|---|---|
| "published" / "live" | "prepared for review; not published" | approved public publish path plus receipt/readback or URL evidence |
| "anchored" | "anchor calldata prepared for approval" | explicit approval, broadcast tx hash, and receipt/contract readback |
| "revision applied" | "revision draft prepared; current public revision unchanged" | approved revision transaction plus confirmation/readback |
| "storage verified" | "storage not assessed" or "storage readiness blocked" | named durable-storage readiness endpoint, API readback, or storage-mode check |
| "signal-backed" | "signal-light" when arrays are empty or URLs are missing | real market/source URLs, weights, roles, and source notes |

Use this shape for the final sentence when downgrading a claim:

```text
boundary: <safe current state>. missing before <stronger claim>: <approval / tx hash / receipt-readback / storage check / real source URLs>.
```

## Permission Ladder

Use the lowest rung supported by direct evidence:

1. `read-only` — market or thesis inspection only.
2. `draft prepared` — draft/revision preview exists and `publishState: "anchor_prepared_not_published"` is present.
3. `anchor prepared` — transaction calldata is ready for approval.
4. `submitted` — the user approved the exact transaction and a tx hash exists.
5. `published/live` — the public publish path completed and receipt/readback matches the prepared thesis or revision.

MCP alone never reaches the `submitted` or `published/live` rungs. If the output is ambiguous, stay on the lower rung and say what evidence is missing.

## Platform Status Is Not Protocol Status

Do not use task-management state as proof of thesis state. A Multica issue, PR, deployment, or agent comment can prove coordination progress; it cannot prove a thesis was published, anchored, revised, submitted, confirmed, or stored durably.

Safe separation:

| Platform evidence | Safe use | Unsafe upgrade |
|---|---|---|
| issue `done` / `in_review` | work delivered or awaiting review | "thesis is live" |
| PR merged / checks green | code/docs changed and tests passed | "production thesis write happened" |
| deployment green | app is reachable | "prepared state is durable" |
| prior issue comment or old draft JSON | historical handoff context | "current revision confirmed" |

For protocol claims, require protocol evidence: MCP result markers for preparation, approved write receipt for submission, API readback or public URL for publish, and transaction receipt or contract readback for onchain confirmation.

## Handoff Freshness Gate

Old handoffs are coordination context, not current protocol evidence. Before reusing a prior agent comment, issue metadata value, screenshot, saved draft JSON, or old `anchorPreparationId`, revalidate with the smallest live read path.

| Prior handoff says | Fresh evidence needed before repeating it | Safe fallback |
|---|---|---|
| thesis exists / current revision is X | `get_thesis` readback for the exact `thesisId` | "historical handoff only; current thesis state not revalidated" |
| draft or anchor was prepared | parsed MCP result or regenerated preparation output | "not returned / not revalidated" |
| thesis is live, public, revised, anchored, or confirmed | API readback, public URL evidence, or onchain receipt/readback | `blocked:` with missing readback |
| storage is durable / launch-ready | named readiness/readback check | `storage readiness blocked` |

Fresh readback beats comment archaeology. Do not use an old handoff as permission to revise, publish, anchor, or mark storage verified.

## MCP Tool Annotations Are Not Protocol Evidence

Tool annotations help clients avoid dangerous routing mistakes. They do not prove user approval or protocol state.

Safe interpretation:

- `readOnlyHint: true` on `search_markets` / `get_thesis` means inspection only.
- `readOnlyHint: false` plus `destructiveHint: false` on draft-prep tools means non-destructive preparation, not publication authority.
- `idempotentHint: true` means repeatable preparation, not durable storage verification.
- `openWorldHint: false` means the tool does not reach out to arbitrary external systems, not that production writes are safe.

Never cite annotations as evidence for `submitted`, `confirmed`, `published/live`, or `storage verified`. Use the MCP result markers and the permission ladder instead.

## Output States

| MCP result | Agent-safe wording | Do not say |
|---|---|---|
| `publishState: "anchor_prepared_not_published"` | "prepared for user-approved anchoring" | "published", "live", "anchored" |
| `anchorStatus: "prepared"` | "calldata is ready for review" | "transaction sent" |
| `transactions` returned | "transaction payloads to approve/sign" | "broadcast complete" |
| tool error / missing thesis | "blocked: exact missing input or unavailable thesis" | "probably published elsewhere" |
| confirmed receipt/readback | "confirmed onchain" with tx hash or contract readback | "confirmed" without evidence |

If the MCP payload changes shape, preserve the boundary: preparation is reversible and private; publishing or anchoring is external and needs approval.

## Comment Templates

### New draft prepared

```text
prepared: thesis draft is ready for review and anchor approval.

What is ready:
- title: <title>
- signals: <N market signals>, <N fact signals>
- anchor status: prepared, not published

Next step: approve the transaction payload before any broadcast. I will not claim this is live until there is a tx hash plus confirmed receipt/readback.
```

If the draft has no linked signals yet, say that directly instead of padding the report:

```text
prepared: thesis draft is ready for review and anchor approval.

What is ready:
- title: <title>
- signals: 0 market signals, 0 fact signals (intentionally signal-light; no sources were invented)
- anchor status: prepared, not published

Next step: add/approve evidence sources if needed, then approve the transaction payload before any broadcast.
```

### Revision prepared

```text
prepared: revision draft is ready for review and anchor approval.

What changed:
- thesis: <thesisId>
- revision note: <note>
- body: full replacement body prepared, not a patch or append-only note
- anchor status: prepared, not published

Next step: approve the revision anchor transaction. Until confirmation, the previous public thesis state is still the source of truth.
```

### Existing thesis anchor rebuilt

```text
prepared: anchor transaction payload rebuilt for <thesisId>.

This is calldata only. It does not publish, revise, or confirm anything by itself.

Next step: approve/sign/broadcast, then verify by tx receipt or contract readback.
```

### Blocked or ambiguous MCP result

```text
blocked: <tool name> did not return enough evidence to safely continue.

Missing evidence:
- <exact missing field, credential, thesis id, or receipt>

I did not broadcast, publish, or mark anything live.
```

## Required Evidence Before Strong Claims

- "draft prepared" needs the MCP result or local preview output.
- "revision prepared" needs `get_thesis` first, then the revision-prep result.
- "signal-backed" needs actual market/fact signal fields and source URLs where available; empty signal arrays are allowed but should be described as signal-light.
- "transaction submitted" needs a tx hash from the broadcaster.
- "anchored" or "confirmed" needs a receipt or contract readback matching the thesis/revision.
- "public article/blog published" is out of current MCP scope unless a separate approved public publish path returns its own URL/evidence.
- "storage verified" needs an approved readiness endpoint, API readback, or storage-mode check proving thesis/revision state persisted in the intended production store.

## Separate Approved Execution Path Receipt Card

Use this only when the operator supplied a non-MCP execution path and approval. It prevents agents from upgrading a draft-prep result just because a route or credential exists.

```text
approved execution path: <route/tool/broadcaster name>
approval evidence: <who approved, exact scope, signer/network, payload or route>
credential scope: <local/dev/staging/production and allowed action>
write receipt: <response id | tx hash | public URL | API readback id>
readback evidence: <endpoint/contract/public URL checked and matching field>
safe claim after execution: <submitted | confirmed | published/live | storage verified>
```

If the card cannot be filled from direct evidence, do not claim `submitted`, `confirmed`, `published/live`, or `storage verified`. Report the current MCP state and the missing approval/receipt/readback instead.

## Storage Readiness Language

MCP preparation does not prove production storage durability. Add one concise storage line when the handoff could be interpreted as launch/readiness evidence:

| Evidence | Safe wording | Do not say |
|---|---|---|
| Local MCP/dry-run output only | "storage: not assessed by this MCP call" | "production write path is durable" |
| Generic `/health` without write-store/readiness detail | "storage: readiness blocked / not exposed" | "health is green, so writes are safe" |
| Approved persistence/readback or readiness check | "storage: verified by <check>" | "verified" without naming the check |

If the task is explicitly about launch readiness and storage evidence is absent, report `blocked:` with the missing readiness/readback proof. Do not upgrade a prepared draft, anchor payload, or generic health check into durable-production evidence.

## Removed-Scope Guardrail

Do not reintroduce `/claims`, `/articles`, curator flows, staking, challenge/settlement, paid verification, or LLM-verification as if they are live Eva Protocol write paths. If a task needs one of those, label it as future scope or create a separate product proposal instead of implying agent support today.

Do not use app HTTP routes as a shortcut around MCP boundaries. `POST /api/theses`, `POST /api/thesis-anchor/prepare`, and production write endpoints are not agent-default publish powers. If a separately approved execution path uses them, report the exact approval, credentials scope, and receipt/readback evidence; otherwise keep the result at draft/anchor-prep wording.
