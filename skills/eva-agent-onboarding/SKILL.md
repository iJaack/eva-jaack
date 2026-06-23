---
name: eva-agent-onboarding
description: Onboard agents to Eva Protocol through MCP and wallet-aware thesis workflows.
---

# Eva Agent Onboarding Skill

Use this when an agent needs to work with Eva Protocol safely.

Canonical guide: `docs/MCP_AGENT_GUIDE.md`.
Copy-paste payloads: `docs/MCP_AGENT_EXAMPLES.md`.
Safe output wording: `docs/AGENT_SAFE_OUTPUTS.md`.

## Requirements

- Use the local MCP server first: `pnpm --filter backend mcp`.
- When a client needs a server config, use a local `eva-thesis` stdio entry with `command: "pnpm"`, `args: ["--filter", "backend", "mcp"]`, and `cwd` set to the repo root.
- Keep `docs/MCP_AGENT_GUIDE.md` open when creating or revising theses.
- Use `docs/MCP_AGENT_EXAMPLES.md` for known-good payload shapes before improvising schema fields.
- Use `docs/AGENT_SAFE_OUTPUTS.md` before summarizing MCP write results to a user.
- Use the schema repair cards in `docs/MCP_AGENT_ERROR_HANDLING.md` when an input is almost valid but has malformed odds, URLs, weights, verifier fields, revision-body shape, identity authority, or direct REST-write requests.
- Treat MCP tool annotations as routing hints, not permission evidence. Read tools have `readOnlyHint: true`; draft-prep tools have `readOnlyHint: false` plus non-destructive/idempotent hints, which still caps them at `draft prepared` / `anchor prepared` without approval and receipt/readback evidence.
- Use the quickstart preflight before write-adjacent calls: intent, approved identity, signer/source, evidence, scope, and storage claim must be clear before preparing calldata.
- Fill the four-line action contract before write-adjacent calls: operation, identity source, evidence source, and output ceiling. The result must never exceed that ceiling.
- For mixed prompts, fill the quickstart safe-start triage card before tools: requested verb, approved identity, smallest live MCP tool, safe rung after call, storage wording, and stop condition.
- Parse Eva MCP result envelopes before reporting: successful tools usually put JSON in `content[0].text`; if `isError: true`, the text part is missing, or the text is not parseable JSON, report `blocked:` and do not infer status markers.
- Use one MCP text parser per result: extract the first `type: "text"` part, parse its JSON, and fill the handoff only from the parsed object. A tool name or SDK envelope is not evidence for `publishState`, `anchorStatus`, tx hash, receipt/readback, storage readiness, or public/live state.
- Place every write-adjacent result on the permission ladder before reporting: `read-only`, `draft prepared`, `anchor prepared`, `submitted`, or `published/live`.
- Capture an evidence inventory before reporting: tool, intent, identity, `publishState`, `anchorStatus`, `anchorPreparationId`, transaction count, tx hash/receipt/readback state, content identifiers, signal/source gaps, and storage state. Mark missing fields as `not returned`; do not infer them.
- Keep platform status separate from protocol status. Multica issue state, PR state, deployment state, or prior agent comments are coordination evidence only; use MCP markers, approved write receipts, API readback, or onchain receipt/readback before claiming a thesis is published, anchored, revised, submitted, confirmed, or storage-verified.
- Apply the handoff freshness gate before reusing old context: prior comments, issue metadata, screenshots, saved draft JSON, and old `anchorPreparationId` values are leads only. Revalidate with `get_thesis`, API/public URL evidence, onchain receipt/readback, or a named readiness/readback check before repeating protocol-state claims.
- Treat remote MCP write tools as unavailable unless the agent has scoped credentials and the operator explicitly approved that path.
- If the local stdio server cannot start, report that setup blocker instead of scraping the UI, using unauthenticated HTTP, or switching to remote write tools.
- Do not bypass MCP by calling app HTTP routes such as `POST /api/theses`, `POST /api/thesis-anchor/prepare`, or production write endpoints. Direct REST writes require a separate approved execution path, scoped credentials, and receipt/readback evidence.
- If a separate approved execution path is supplied, fill the receipt card from `docs/AGENT_SAFE_OUTPUTS.md`: approved execution path, approval evidence, credential scope, write receipt, readback evidence, and safe claim after execution. Missing rows mean stay at `draft prepared` / `anchor prepared`.
- Confirm X identity, wallet address, and wallet source before preparing protocol transactions.
- Treat schema defaults as validation helpers, not approval or evidence. A defaulted `walletSource`, signal weight, role, status, verifier verdict, or verifier score must be called out or backed by task-time evidence before it affects claims.
- Use `0x0fe61780bd5508b3C99e420662050e5560608cA4` only when the operator explicitly approved that signer for the task.
- If no reliable market or fact signals are ready, pass empty signal arrays and say the draft is intentionally signal-light. Do not invent sources, URLs, scores, or weights.

## Tool Selection Shortcut

- Research only: use `search_markets`.
- Existing thesis update: call `get_thesis` first, then `prepare_revision_draft` with a concise delta note.
- New thesis preview: use `create_thesis_draft`.
- Existing thesis calldata rebuild with no text change: use `prepare_anchor_transaction`.
- Publish, broadcast, direct REST writes, article/blog output, claims, staking, challenge/settlement, paid verification, or LLM verification: stop unless a separate approved path and evidence exist.

Mixed prompt shortcut:

- `draft and publish` means `create_thesis_draft` only through MCP, followed by a publish blocker until approval, tx hash, and receipt/readback exist.
- `revise this thesis` means `get_thesis` first; missing thesis id or mismatched identity is a blocker, not permission to create a replacement.
- `anchor it` means `prepare_anchor_transaction` for calldata only; no broadcast or confirmation is implied.
- `prove launch readiness` means no MCP draft-prep tool can prove storage durability; use `storage readiness blocked` unless a named readiness/readback check exists.

Do not create a replacement thesis because `get_thesis` failed. Missing thesis id, mismatched identity, or unauthorized wallet authority is a blocker.

## Onboarding Drill

Use this drill for a new agent before it touches a real user-requested thesis. It proves the agent can route reads, draft prep, revision prep, and handoff wording without implying publication.

1. Start the local MCP server with the repo root as `cwd`:

```json
{
  "eva-thesis": {
    "command": "pnpm",
    "args": ["--filter", "backend", "mcp"],
    "cwd": "/absolute/path/to/eva-jaack"
  }
}
```

2. Read/search first. Use the SpaceX proof object unless the operator gave a different scope:

```text
operation: read-only
identity source: not required for search_markets
evidence source: market search query only
output ceiling: read-only
```

```json
{
  "tool": "search_markets",
  "input": { "query": "SpaceX IPO" },
  "expectedRung": "read-only"
}
```

3. Prepare a signal-light draft only when the operator-approved identity is known. This example uses Eva's wallet as a rehearsal identity; do not swap it into live work without task-time approval:

```text
operation: new draft
identity source: onboarding rehearsal approval for @evajaack + Eva wallet + external walletSource
evidence source: explicitly signal-light; no market or fact URLs claimed
output ceiling: draft prepared / anchor prepared
```

```json
{
  "tool": "create_thesis_draft",
  "input": {
    "title": "SpaceX IPO liquidity rotation rehearsal",
    "body": "If SpaceX IPO probability rises, attention and liquidity should rotate toward adjacent launch, satellite, and private-market infrastructure narratives. This is a rehearsal draft for agent onboarding, not a live market call.",
    "xHandle": "@evajaack",
    "walletAddress": "0x0fe61780bd5508b3C99e420662050e5560608cA4",
    "walletSource": "external",
    "predictionSignals": [],
    "factSignals": []
  },
  "expectedRung": "draft prepared",
  "expectedPublishState": "anchor_prepared_not_published"
}
```

4. Prepare a revision only after `get_thesis` confirms the exact thesis and identity. Use a short delta note:

```text
operation: revision
identity source: `get_thesis` readback plus task-time approval for xHandle and walletAddress
evidence source: full replacement body from approved source text; note summarizes the delta
output ceiling: draft prepared / anchor prepared
```

```json
{
  "tool": "prepare_revision_draft",
  "input": {
    "thesisId": "<confirmed-thesis-id>",
    "body": "<full replacement thesis body>",
    "note": "Adds the latest odds move and separates catalyst from second-order liquidity impact.",
    "xHandle": "@evajaack",
    "walletAddress": "0x0fe61780bd5508b3C99e420662050e5560608cA4"
  },
  "expectedRung": "draft prepared",
  "expectedPublishState": "anchor_prepared_not_published"
}
```

5. Practice the final handoff. A correct onboarding result says prepared, not published:

```text
prepared: new thesis draft
tool: create_thesis_draft
rung: draft prepared / anchor prepared only
publishState: anchor_prepared_not_published
anchorStatus: prepared
storage: not assessed
next evidence needed: explicit approval, transaction hash, receipt/readback, and durable storage check before any live claim
boundary: no transaction broadcast and no public publish happened
```

## Safety Rules

- Read tools (`search_markets`, `get_thesis`) are safe by default.
- Draft-prep tools (`create_thesis_draft`, `prepare_revision_draft`, `prepare_anchor_transaction`) prepare calldata and previews only.
- MCP draft/anchor-prep output means `publishState: "anchor_prepared_not_published"` and `anchorStatus: "prepared"`; it is not public publish support.
- `prepare_anchor_transaction` rebuilds calldata for an existing thesis; it still does not broadcast, confirm, or publish anything.
- Transaction preparation is not transaction broadcast.
- Transaction preparation is not storage durability proof.
- Broadcasts require explicit user approval at action time.
- MCP alone never reaches the `submitted` or `published/live` rungs; those require explicit approval plus tx/public-state evidence.
- Issue `done` / `in_review`, PR merged, deployment green, or old issue comments do not upgrade a protocol claim. They are not proof that a thesis is live, anchored, revised, submitted, confirmed, or storage-verified.
- Fresh readback beats comment archaeology: do not use an old handoff as permission to revise, publish, anchor, or mark storage verified.
- Never mark a thesis, thesis revision, or signal as confirmed without a transaction receipt or contract readback.
- Never mark production thesis writes as durable from MCP output alone. Use `storage not assessed` for local/dry-run prep, `storage readiness blocked` when production readiness does not expose durable write-path evidence, and `storage verified` only after an approved readiness/readback check proves persisted thesis state.
- If MCP output is ambiguous, report the exact missing evidence and do not infer publication.
- Do not swap in a different `xHandle`, `walletAddress`, or wallet source to make a draft work. If identity is missing, invalid, or unauthorized, stop and ask for the correct operator-approved identity.
- Do not expand agent powers into trades, custody, staking, claims markets, articles, or blog publishing.

## Revision Handoff

When an agent revises an existing thesis:

1. Start with `get_thesis`; do not trust stale comments or old draft JSON.
2. Use `prepare_revision_draft` with a full replacement `body`, not a patch, diff, append-only note, or partial paragraph. Use a concise `note` to explain the delta.
3. Report the state as "draft prepared" until the approved transaction is submitted and confirmed.
4. Only say "revision live" after a receipt or contract readback matches the prepared revision.

Current live schema note: `prepare_revision_draft` accepts `thesisId`, `body`, `note`, `xHandle`, and `walletAddress`. It does not accept `walletSource` yet.

Current market status enum: `open`, `closed`, `resolved`, `cancelled`. Treat `cancelled` as a source-market state only; it is not a thesis publish state and does not imply an Eva draft or anchor was cancelled.

Schema defaults exist for low-risk draft prep, but evidence-bearing fields should be explicit when known. Use valid URLs only; omit unknown source URLs and report the gap in the handoff.

Schema defaults are not approval: `create_thesis_draft.walletSource` may default to `external`, but signer/source authority still needs task-time approval. Defaulted signal fields such as `selectedOutcomeLabel`, `weight`, `role`, `status`, `verifierVerdict`, and `verifierScore` are fallbacks, not proof that evidence exists or that the signal is weighted/verified from sources.

Repair malformed schema fields only when the prompt or approved context directly supports the repair. Examples: convert `36%` to `0.36` only when percent meaning is explicit; omit an optional malformed URL and report the source URL gap only when the signal remains auditable; use exploratory verifier defaults only for exploratory drafts. If the value would change meaning, affect identity authority, or require inventing a full revision body, report `blocked:` instead of guessing.

Fact signals may include optional `reportUri` and `reportHash` evidence pointers. Include them only when they already exist; do not fabricate verifier reports, hashes, or storage URIs.

## User-Facing Result Language

- Prepared MCP draft output: "prepared for review", not "published".
- Prepared anchor transaction: "calldata ready for approval", not "anchored".
- Submitted transaction without receipt: "pending confirmation", not "confirmed".
- Receipt or contract readback matching the thesis/revision: "confirmed".

If a tool returns an error or a missing thesis, report the blocker directly. Do not retry with a guessed thesis ID or alternate wallet.

## Reporting Pattern

After draft prep, report the `anchorPreparationId`, the prepared transaction purpose, storage readiness state, and the exact missing approval/confirmation step. Do not say the thesis is live, public, published, or production-durable from MCP output alone.

If a needed marker is absent, write `not returned` or `blocked:` rather than upgrading the claim. Missing tx hash means not submitted. Missing receipt/readback means not confirmed. Missing readiness/readback evidence means storage not assessed.

Use a minimal result card when handing work to users or agents:

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

Use `docs/AGENT_SAFE_OUTPUTS.md` for short user-facing wording and `docs/MCP_AGENT_HANDOFF_TEMPLATE.md` for full handoffs between agents, reviewers, or issue comments.
