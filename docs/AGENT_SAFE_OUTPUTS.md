# Agent-Safe Output Contracts

Use this when turning Eva MCP results into user-facing agent updates. The goal is simple: say exactly what happened, what is safe to do next, and what is still outside agent scope.

## Golden Rule

A prepared draft, revision, or anchor transaction is not a public publish event.

Agents may describe prepared content and transaction calldata. Agents must not claim a thesis is live, anchored, revised, or publicly published until there is explicit user approval plus a submitted transaction hash and confirmed receipt or contract readback.

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

## Evidence Inventory For Handoffs

Before sending a result card, copy only evidence the MCP response or named follow-up check actually returned. Do not infer hidden state from a familiar tool name.

Minimum inventory for write-adjacent results:

- operation evidence: tool name, requested intent, and approved `xHandle` / `walletAddress`,
- output markers: `publishState`, `anchorStatus`, and `anchorPreparationId` when present,
- transaction evidence: transaction count, network/chain if returned, target contract/function if returned, and whether a tx hash exists,
- content evidence: thesis title or `thesisId`, revision version if returned, signal counts, and any source URL gaps,
- storage evidence: `not assessed`, `readiness blocked`, or `verified by <named check>`.

If a field is absent, write `not returned` or omit it. Never upgrade an absent tx hash into submission, an absent receipt into confirmation, or an absent storage check into launch readiness.

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
