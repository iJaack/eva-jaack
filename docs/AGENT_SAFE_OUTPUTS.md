# Agent-Safe Output Contracts

Use this when turning Eva MCP results into user-facing agent updates. The goal is simple: say exactly what happened, what is safe to do next, and what is still outside agent scope.

## Golden Rule

A prepared draft, revision, or anchor transaction is not a public publish event.

Agents may describe prepared content and transaction calldata. Agents must not claim a thesis is live, anchored, revised, or publicly published until there is explicit user approval plus a submitted transaction hash and confirmed receipt or contract readback.

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

### Revision prepared

```text
prepared: revision draft is ready for review and anchor approval.

What changed:
- thesis: <thesisId>
- revision note: <note>
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
- "transaction submitted" needs a tx hash from the broadcaster.
- "anchored" or "confirmed" needs a receipt or contract readback matching the thesis/revision.
- "public article/blog published" is out of current MCP scope unless a separate approved public publish path returns its own URL/evidence.

## Removed-Scope Guardrail

Do not reintroduce `/claims`, `/articles`, curator flows, staking, challenge/settlement, paid verification, or LLM-verification as if they are live Eva Protocol write paths. If a task needs one of those, label it as future scope or create a separate product proposal instead of implying agent support today.
