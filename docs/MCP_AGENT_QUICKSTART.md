# MCP Agent Quickstart

Use this as the five-minute path for agents that need to create or revise Eva theses without guessing at write boundaries. The deeper references are `docs/MCP_AGENT_GUIDE.md`, `docs/MCP_AGENT_EXAMPLES.md`, `docs/MCP_AGENT_ERROR_HANDLING.md`, and `docs/AGENT_SAFE_OUTPUTS.md`.

This quickstart is expected to match the live MCP server allowlist and Zod schemas. If code changes a tool name, enum, or publish-state marker, update the agent docs and onboarding skill in the same PR before agents rely on it.

## Boundary First

Eva MCP is draft-and-anchor-prep only.

The broader app has HTTP routes for thesis creation and anchor preparation, but those are not agent-default publish powers. Do not call `POST /api/theses`, `POST /api/thesis-anchor/prepare`, or production write endpoints as a workaround for MCP limits. Direct REST writes require a separate approved path, scoped credentials, and receipt/readback evidence before any stronger claim.

If a task really does arrive with a separate approved execution path, capture the approval and receipt evidence before using stronger language:

```text
approved execution path: <route/tool/broadcaster name>
approval evidence: <who approved, exact scope, signer/network, payload or route>
credential scope: <local/dev/staging/production and allowed action>
write receipt: <response id | tx hash | public URL | API readback id>
readback evidence: <endpoint/contract/public URL checked and matching field>
safe claim after execution: <submitted | confirmed | published/live | storage verified>
```

If any row is missing, stay on the MCP rung (`draft prepared` / `anchor prepared`) and say what is missing. Do not treat possession of a route URL, bearer token, wallet address, or returned calldata as approval to publish or broadcast.

## No-Guesswork Preflight

Before any write-adjacent MCP call, fill this out mentally or in the handoff. If any row is unclear, stop before preparing calldata.

| Check | Required answer before continuing | If missing |
|---|---|---|
| Intent | `read-only`, `new draft`, `revision`, or `anchor rebuild` | Ask for the exact operation. |
| Identity | operator-approved `xHandle` and `walletAddress` | Block; do not substitute Eva's wallet or a remembered address. |
| Signer/source | `walletSource` when the live tool accepts it | Use `external` only when that is the approved signer source; the schema default is not approval. |
| Evidence | real market/source URLs, or an explicit signal-light choice | Use empty arrays and say signal-light; do not turn default weights/verdicts into evidence. |
| Scope | no request for publish, broadcast, direct REST writes, claims, articles/blog, staking, custody, settlement, or LLM verification | Stop unless a separate approved path and evidence exist. |
| Storage claim | `storage not assessed`, `storage readiness blocked`, or `storage verified by <check>` | Default to `storage not assessed` for local MCP prep. |

This preflight is part of the safety boundary. It is better to return `blocked:` with one missing field than to prepare the wrong identity, imply publication, or turn a storage unknown into launch readiness.

### Four-line action contract

Before a write-adjacent call, write this tiny contract in your notes or handoff. It keeps identity, evidence, and final wording tied to the same permission rung:

```text
operation: <read-only | new draft | revision | anchor rebuild>
identity source: <task-time approval for xHandle + walletAddress + walletSource, or blocked>
evidence source: <real market/source URLs | explicitly signal-light | storage/readback check name | blocked>
output ceiling: <read-only | draft prepared | anchor prepared | submitted | published/live>
```

Rules:

- If `identity source` is blocked, do not call `create_thesis_draft`, `prepare_revision_draft`, or `prepare_anchor_transaction`.
- If `evidence source` is signal-light, do not call the result signal-backed or verified.
- If no approved broadcast/readback evidence exists, `output ceiling` cannot exceed `anchor prepared`.
- If no approved durable-storage readiness/readback check exists, storage wording stays `storage not assessed` or `storage readiness blocked`.

### Defaults are validation helpers, not evidence

The live schemas may fill defaults such as `walletSource: "external"`, `selectedOutcomeLabel: "Yes"`, `weight: 50`, `role`, `status: "open"`, `verifierVerdict: "unverifiable_yet"`, or `verifierScore: 50`. Treat those as schema defaults, not task approval or sourced facts.

Safe handling:

- make identity and signer/source explicit from the task before write-adjacent calls,
- call out intentionally empty signal arrays as signal-light,
- report `defaulted` or `not returned` for non-material fallback fields instead of upgrading confidence,
- block if the missing/defaulted value would change signer authority, evidence quality, weighting, or publish/live wording.

If the prompt is almost valid but one schema field is malformed or ambiguous, use the schema repair cards in `docs/MCP_AGENT_ERROR_HANDLING.md` before calling a tool. Repair only directly evidenced values, such as an explicit `36%` becoming `0.36`. Otherwise block instead of guessing URLs, signer authority, verifier scores, weights, or full revision bodies.

### Safe-start triage card

Use this compact card when a prompt mixes safe MCP work with stronger verbs like publish, anchor, revise, launch, or prove readiness. Fill it before calling tools, then keep the final wording on the same rung.

```text
requested verb: <draft | revise | anchor | publish | prove readiness | mixed>
approved identity: <xHandle + walletAddress + walletSource, or missing>
smallest live MCP tool: <search_markets | get_thesis | create_thesis_draft | prepare_revision_draft | prepare_anchor_transaction | none>
safe rung after call: <read-only | draft prepared | anchor prepared | blocked>
storage wording: <not assessed | readiness blocked | verified by named check>
stop condition: <missing identity | missing thesisId | stronger publish/broadcast/storage evidence requested | none>
```

Quick routing examples:

- `draft and publish this` -> use `create_thesis_draft` only after identity preflight, then report `draft prepared` / `anchor prepared`; block the publish wording until approval, broadcast, tx hash, and receipt/readback exist.
- `revise this thesis` -> use `get_thesis` first; if the thesis id or author identity is missing/mismatched, block instead of creating a replacement. Then use `prepare_revision_draft` with a full replacement body.
- `anchor it` -> use `prepare_anchor_transaction` only when the existing thesis id is known; report calldata rebuilt, not broadcast or confirmed.
- `prove launch readiness` -> do not use draft prep as proof. Report `storage readiness blocked` unless an approved readiness/readback check proves durable thesis storage.

Use this permission ladder before and after every write-adjacent call:

| Rung | Evidence required | Safe language |
|---|---|---|
| `read-only` | `search_markets` or `get_thesis` result only | "inspected" / "found candidates" |
| `draft prepared` | `create_thesis_draft` or `prepare_revision_draft` returned `publishState: "anchor_prepared_not_published"` | "prepared for review" |
| `anchor prepared` | `anchorStatus: "prepared"` plus transaction calldata | "calldata ready for approval" |
| `submitted` | explicit user approval plus a transaction hash | "submitted, pending confirmation" |
| `published/live` | public publish path completed and receipt/readback matches the thesis or revision | "live" / "confirmed" |

MCP alone never reaches the `submitted` or `published/live` rungs. Do not skip rungs when reporting status.

### Platform status is not protocol status

Issue comments, task status, PR status, and deployment status are coordination signals. They are not evidence that a thesis is published, anchored, revised, submitted, confirmed, or storage-verified.

Before closing or handing off an agent task, keep these two states separate:

| Coordination state | What it can prove | What it cannot prove |
|---|---|---|
| Multica issue `done` / `in_review` | agent work was delivered or is awaiting review | thesis is live, anchored, or durable |
| PR merged / checks green | repo change passed review/tests | production thesis write occurred |
| deployment green | app version is reachable | prepared thesis state survived storage/readback |
| issue comment says "prepared" | an agent reported a result | current protocol state without MCP/API/onchain readback |

Use platform status only for project coordination. Use MCP output, approved write receipts, API readback, or onchain receipt/readback for protocol claims.

### Handoff freshness gate

Before reusing a prior agent comment, issue metadata key, screenshot, saved draft JSON, or stale `anchorPreparationId`, revalidate the current protocol state with the smallest live read path:

- existing thesis state -> call `get_thesis` for the exact `thesisId`,
- public/live claim -> require API readback, public URL evidence, or onchain receipt/readback,
- storage readiness claim -> require the named readiness/readback check,
- missing or conflicting readback -> report `blocked:` and keep the result on the lower rung.

Do not use an old handoff as permission to revise, publish, anchor, or mark storage verified. Fresh readback beats comment archaeology.

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

## Connect A Local MCP Client

If your agent runtime asks for an MCP server definition, use the repo root as `cwd` and keep the command narrow:

```json
{
  "mcpServers": {
    "eva-thesis": {
      "command": "pnpm",
      "args": ["--filter", "backend", "mcp"],
      "cwd": "/absolute/path/to/eva-jaack"
    }
  }
}
```

Do not point agents at a remote MCP endpoint for write-adjacent tools just because local setup is inconvenient. Remote draft prep needs scoped credentials plus explicit operator approval. If the client cannot start the local stdio server, report the local setup blocker instead of scraping the UI or using an unauthenticated HTTP path.

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

### Tool annotation boundary

Tool discovery annotations are client-routing hints, not approval evidence:

- `search_markets` and `get_thesis` are read-only tools (`readOnlyHint: true`).
- `create_thesis_draft`, `prepare_revision_draft`, and `prepare_anchor_transaction` are preparation tools (`readOnlyHint: false`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`).

Do not let `destructiveHint: false` upgrade the output claim. A non-destructive preparation tool can still be write-adjacent and still stops at `draft prepared` / `anchor prepared` unless approval, tx hash, receipt/readback, and storage evidence support a higher rung.

For copy-paste payloads that match these tools, use `docs/MCP_AGENT_EXAMPLES.md`.

## Parse The MCP Result Envelope

Most MCP clients return Eva tool results as a text envelope, not as top-level JSON fields. Read the first text part, then parse it before interpreting status markers:

```json
{
  "content": [
    { "type": "text", "text": "{ ...json result... }" }
  ]
}
```

For successful write-adjacent tools, parse `content[0].text` as JSON and then read `publishState`, `anchorStatus`, `anchorPreparationId`, `transactions`, and `nextStep` from the parsed object. For `search_markets`, the parsed value is an array. For `get_thesis`, the parsed value is the thesis detail object.

If the tool result has `isError: true`, has no text part, or `content[0].text` is not valid JSON when JSON was expected, stop at `blocked:` and quote the missing or invalid field. Do not infer publish, anchor, submission, confirmation, or storage durability from the envelope alone.

Use one MCP text parser per result and make malformed envelopes a blocker instead of guessing:

```ts
function parseEvaMcpTextResult(result: unknown) {
  const text = (result as { content?: Array<{ type?: string; text?: string }> }).content?.find(
    (part) => part.type === "text",
  )?.text;

  if (!text || (result as { isError?: boolean }).isError) {
    throw new Error("blocked: Eva MCP result did not return a successful text JSON envelope");
  }

  return JSON.parse(text) as Record<string, unknown>;
}
```

After parsing, fill the result card only from returned fields. If parsing fails, the tool result is `blocked`; do not infer `publishState`, `anchorStatus`, storage readiness, tx hash, receipt, or public/live state from the tool name.

## Common Prompt Routing Cards

Use these cards when an agent prompt mixes a safe MCP action with an unsafe stronger claim. Pick the lowest tool that matches the direct evidence you can produce.

| User asks | MCP action | Safe response state | Stop / escalate when |
|---|---|---|---|
| "Find markets for this thesis." | `search_markets` | `read-only` | The user asks you to create or publish from weak evidence without approving identity. |
| "Draft a new Eva thesis." | `create_thesis_draft` after preflight | `draft prepared` / `anchor prepared` only | `xHandle`, `walletAddress`, signer source, or evidence policy is missing. |
| "Revise this thesis." | `get_thesis`, then `prepare_revision_draft` | revision draft prepared, previous public state unchanged | `thesisId` is missing/not found or the wallet/X handle does not match the approved author identity. |
| "Rebuild the anchor transaction." | `prepare_anchor_transaction` | calldata rebuilt only | The user expects a text change, broadcast, or confirmed onchain state. |
| "Publish / anchor / make it live." | none through MCP alone | blocked until a separate approved path exists | Approval, broadcaster, tx hash, receipt/readback, or public publish evidence is missing. |
| "Prove launch readiness." | none through draft prep alone | `storage not assessed` or `storage readiness blocked` | No approved durable-storage readiness/readback check is available. |

If the requested verb is stronger than the evidence, downgrade the wording, not the safety boundary. Example: "I can prepare the draft and calldata for approval; I cannot call it live without approval, broadcast, and receipt/readback evidence."

## Pick The Right Operation

Use this decision path before touching a write-adjacent tool:

1. Need evidence candidates only? Use `search_markets` and stop at read-only notes.
2. Need to change an existing thesis? Use `get_thesis` first, then `prepare_revision_draft`. Do not create a replacement thesis because the old id is missing or inconvenient.
3. Need a brand-new thesis preview? Use `create_thesis_draft`.
4. Need to rebuild calldata for an already-prepared thesis without changing text? Use `prepare_anchor_transaction`.
5. Need publication, transaction broadcast, direct REST writes, article/blog output, claims, staking, challenge/settlement, paid verification, or LLM verification? Stop. That is outside current MCP scope unless a separate approved path and evidence are provided.

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

Evidence inventory to capture before reporting:

- `publishState`, `anchorStatus`, and `anchorPreparationId` exactly as returned,
- transaction count and purpose, but no tx hash unless a separate broadcaster returned one,
- thesis title or `thesisId`, plus market/fact signal counts,
- any missing source URLs or intentionally empty signal arrays,
- storage state, using `storage not assessed` unless a named readiness/readback check was run.

If any expected marker is absent, say `not returned` or report `blocked:`. Do not fill the gap by assuming draft prep implies storage durability, broadcast, or public publication.

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
3. Call `prepare_revision_draft` with the full replacement `body` and a short `note` explaining the delta. The `body` is not a patch, diff, append-only note, or partial paragraph; preserve any current text that should remain.
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
