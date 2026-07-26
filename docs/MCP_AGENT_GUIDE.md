# Eva MCP Agent Guide

Use this guide when an agent creates or revises Eva theses through MCP. It is intentionally narrow: agents may prepare drafts and anchor transactions, but they do not silently publish public theses.

If you need the shortest copy-paste path, start with `docs/MCP_AGENT_QUICKSTART.md`. If the prompt mixes drafting, revision, anchoring, publishing, storage, or platform status, pick a route from `docs/MCP_AGENT_DECISION_CARDS.md` before composing payloads. If you need ready payloads and safe handoff snippets, use `docs/MCP_AGENT_EXAMPLES.md`, then use this guide for the full schema and lifecycle details.

## Drift Guardrail

The live tool allowlist and schema enums are tested against these agent docs. When `backend/src/mcp-server.ts` or `backend/src/mcp-schemas.ts` changes, update this guide, `docs/MCP_AGENT_QUICKSTART.md`, `docs/MCP_AGENT_EXAMPLES.md`, `docs/MCP_AGENT_ERROR_HANDLING.md`, and `skills/eva-agent-onboarding/SKILL.md` in the same change. If the docs and live server disagree, the server wins and the docs must be fixed before agents use the new path.

## Start Here

Run the local MCP server from the repo root:

```bash
pnpm --filter backend mcp
```

Prefer the local server for agent work. Treat remote MCP write tools as unavailable unless the agent has scoped credentials for the task and the operator explicitly approved that path.

Do not bypass MCP by calling app HTTP routes directly. Routes such as `POST /api/theses`, `POST /api/thesis-anchor/prepare`, or any production write endpoint are app/runtime surfaces, not agent-default publish powers. An agent may use MCP to prepare draft/anchor payloads; direct REST writes need a separate approved execution path, scoped credentials, and their own receipt/readback evidence.

When a separate approved execution path exists, record it explicitly before making any stronger claim:

- approved execution path: route, tool, or broadcaster name,
- approval evidence: who approved it, exact action scope, signer/network, and payload or route,
- credential scope: local/dev/staging/production plus the allowed action,
- write receipt: response id, transaction hash, public URL, or API readback id,
- readback evidence: endpoint, contract readback, or public URL checked plus the matching field,
- safe claim after execution: `submitted`, `confirmed`, `published/live`, or `storage verified`.

If any of those fields is missing, stay at `draft prepared` / `anchor prepared` and report the missing evidence. A route URL, bearer token, wallet address, prepared calldata, or `anchorPreparationId` is not by itself publish/broadcast approval.

### Execution Path Picker

When a prompt mixes MCP work with API routes, credentials, wallets, deployments, or browser state, choose the safest evidenced path before touching a tool:

| Prompt evidence in hand | Use | Do not use | Safe ceiling |
|---|---|---|---|
| Query text or exact `thesisId` only | `search_markets` / `get_thesis` | Draft-prep, REST writes, browser scraping | `read-only inspection` |
| Exact identity plus draft/revision intent | Local MCP write-adjacent tool | Direct REST writes or remote write tools by default | `draft prepared` / `anchor prepared` |
| Token, API route, deploy URL, or logged-in browser | Nothing beyond MCP unless separately approved | Treating access as approval | MCP rung until approval + receipt + readback |
| Signed/broadcast request | Transaction path only after action-time approval | Inferring approval from prepared calldata | `submitted` after tx hash |
| Live/public/storage claim | Named API/public/onchain/readiness readback | Issue status, PR status, deployment status, old handoff | Proven readback state only |

This table is a stop sign, not a shortcut. If two rows seem possible, use the lower row and report the missing approval, receipt, or readback instead of silently escalating agent write powers.

For MCP clients that need an explicit local server entry, configure the stdio server with the repo root as `cwd`:

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

If that local stdio command fails, stop and report the setup blocker. Do not replace it with UI scraping, direct unauthenticated HTTP calls, or a remote write path unless the operator supplied scoped credentials and explicitly approved that remote path.

For lightweight HTTP discovery, `GET /api/mcp` returns the streamable HTTP endpoint, the exact live tool-name allowlist, `toolDescriptions`, and an `agentSafeBoundary` card. The boundary card includes `defaultWriteScope: "draft_and_anchor_prep_only"`, `publishState: "anchor_prepared_not_published"`, `mcpOutputCeiling: "anchor_prepared"`, `safeResultVerbs`, `storageClaimDefault: "storage_not_assessed"`, required evidence for stronger claims, `notEvidenceForStrongerClaims`, and forbidden fallback classes. Treat that response as a discovery/boundary smoke only; it is not a write path, not approval for remote MCP write-adjacent tools, and not evidence of draft storage, transaction submission, confirmation, or public publish.

When a client can read the discovery JSON, use it as a machine-readable downgrade card: `safeResultVerbs` caps MCP-only output at `inspected`, `prepared`, or `calldata_ready`; `requiredForSubmitted` requires explicit approval plus a tx hash; `requiredForPublishedLive` requires an approved public path plus write receipt and readback evidence; `notEvidenceForStrongerClaims` names coordination or access artifacts such as route URLs, bearer tokens, browser sessions, green deploys, issue/PR status, `anchorPreparationId`, and prepared calldata. None of those artifacts upgrades MCP draft prep into submitted, published/live, or storage-verified state.

### Read-only MCP client smoke

When onboarding a new MCP client or runtime, prove client wiring with read-only evidence before any draft-prep rehearsal:

1. Start the local `eva-thesis` stdio server from the repo root with `pnpm --filter backend mcp`.
2. Run the client's tool list smoke and verify the exact seven live tools: `search_markets`, `get_thesis`, `create_thesis_draft`, `prepare_revision_draft`, `prepare_anchor_transaction`, `prepare_eva_proof_quote`, and `get_paid_thesis_proof_bundle`.
3. If using HTTP discovery, verify `GET /api/mcp` exposes matching `toolDescriptions`, `agentSafeBoundary.defaultWriteScope: "draft_and_anchor_prep_only"`, `agentSafeBoundary.mcpOutputCeiling: "anchor_prepared"`, and `agentSafeBoundary.storageClaimDefault: "storage_not_assessed"` before any write-adjacent rehearsal.
4. Run a description boundary smoke: every write-adjacent discovery description must still say the tool does not publish, broadcast, call direct REST writes, or prove storage durability.
5. Run only a read-only call smoke, such as `search_markets` with a low-risk query, and report the result as `read-only` / `found candidates`.

Do not use `create_thesis_draft`, `prepare_revision_draft`, or `prepare_anchor_transaction` as a connectivity smoke test. Write-adjacent rehearsal needs explicit onboarding or task-time approval for the exact `xHandle`, `walletAddress`, and `walletSource`, and should stay local unless a separate approved remote path supplies scoped credentials plus receipt/readback requirements.

If the tool list differs, HTTP discovery omits the agent-safe boundary card, a write-adjacent description omits the no-publish/no-broadcast/no-direct-REST/no-storage-durability boundary, or the local stdio server cannot start, use the failure classes in `docs/MCP_AGENT_ERROR_HANDLING.md`: `client setup failure` or `live allowlist drift`. Do not recover by calling app HTTP routes, scraping the UI, or trying production write paths.

## Live Tools

| Tool | Safe use | Mutates stored thesis state? |
|---|---|---:|
| `search_markets` | Find market candidates by optional query. | No |
| `get_thesis` | Inspect an existing thesis by `thesisId`. | No |
| `create_thesis_draft` | Preview a new thesis and prepare anchor calldata. | No |
| `prepare_revision_draft` | Preview a new revision and prepare revision-anchor calldata. | No |
| `prepare_anchor_transaction` | Rebuild anchor calldata for an existing thesis. | No |
| `prepare_eva_proof_quote` | Prepare direct-allowance and usage-burn calldata for a proof bundle. | No |
| `get_paid_thesis_proof_bundle` | Verify EVA usage and release the formatted proof bundle. | No |

The paid proof flow is `prepare_eva_proof_quote` → the agent/operator-owned self-custodial wallet
signs standard ERC-20 `approve` plus
`retireForUsage` → `get_paid_thesis_proof_bundle` verifies `EvaUsedAndRetired`. It does not use
Permit2, and neither MCP nor the Eva backend can spend wallet funds.

Every write-adjacent MCP tool (`create_thesis_draft`, `prepare_revision_draft`, and `prepare_anchor_transaction`) returns `publishState: "anchor_prepared_not_published"`. That is the boundary. A prepared anchor is not a published thesis, not a confirmed revision, and not evidence of an onchain record.

### MCP Discovery Description Boundary

Some clients show only the MCP tool name, description, and annotations before an agent chooses a call. Treat those discovery descriptions as a safety boundary, not marketing copy. If a live description says "does not publish", "does not broadcast", "does not call direct REST writes", or "does not prove storage durability", keep the output on the lower rung even if the user prompt, issue status, or prior handoff uses stronger wording.

Discovery descriptions are intentionally redundant with this guide: read-only tools stay at `read-only`, and preparation tools stay at `draft prepared` / `anchor prepared` unless a separate approved execution path provides approval evidence, a write receipt, and readback evidence. If a client displays a description that conflicts with this guide or omits the no-publish/no-broadcast boundary for a write-adjacent tool, treat it as live allowlist drift and use the blocked path in `docs/MCP_AGENT_ERROR_HANDLING.md`.

### Tool Annotations Are Hints, Not Approval

MCP discovery exposes annotations so clients can route tools safely:

- `search_markets` advertises `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, and `openWorldHint: true` because market search may query the configured market universe. It is still read-only inspection, not evidence approval.
- `get_thesis` advertises `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, and `openWorldHint: false` because it only reads Eva thesis state by `thesisId`.
- `create_thesis_draft`, `prepare_revision_draft`, and `prepare_anchor_transaction` advertise `readOnlyHint: false`, `destructiveHint: false`, `idempotentHint: true`, and `openWorldHint: false`.

That means draft-prep tools are non-destructive preparation tools, not read-only inspection tools. `openWorldHint: true` on `search_markets` means the read may reach the configured market source; it does not approve external web research, source invention, publishing, broadcasting, or storage claims. Treat annotations as routing hints only; the permission ladder and evidence inventory still decide what the agent may claim.

### Storage Durability Boundary

Agent MCP output is a preparation artifact, not proof that production thesis writes are durable.

Do not treat any of these as storage-readiness evidence:

- `publishState: "anchor_prepared_not_published"`
- `anchorStatus: "prepared"`
- `anchorPreparationId`
- returned transaction calldata
- a generic green `/health` response that does not name the write store or readiness mode

For local agent onboarding, report storage as `storage not assessed` unless you also performed an approved persistence/readback check. For production launch or ops handoff work, report `storage readiness blocked` when the public health/readiness surface does not prove durable thesis/revision storage. Only say `storage verified` when an approved readiness endpoint, API readback, or storage-mode check proves the prepared thesis/revision state persisted in the intended production store.

Current known adjacent blocker: EVA-249 tracks durable production storage/readiness for thesis writes. Reference it when a task asks for launch readiness, but do not use it as permission to expand MCP write powers or claim publication.

### Permission Ladder

Use this ladder to choose both the tool and the words you report back. Do not skip rungs.

| Rung | Evidence required | Safe claim | Unsafe jump |
|---|---|---|---|
| `read-only` | `search_markets` or `get_thesis` output | "inspected" or "found candidates" | "drafted" |
| `draft prepared` | Draft/revision tool returned `publishState: "anchor_prepared_not_published"` | "prepared for review" | "published" |
| `anchor prepared` | `anchorStatus: "prepared"` and transaction calldata | "calldata ready for approval" | "anchored" |
| `submitted` | Explicit user approval plus transaction hash | "submitted, pending confirmation" | "confirmed" |
| `published/live` | Public publish path completed and receipt/readback matches the prepared thesis/revision | "live" or "confirmed" with evidence | N/A |

MCP alone never reaches the `submitted` or `published/live` rungs. If you cannot name the evidence for the next rung, stay on the current rung and report the missing evidence.

### Tool Selection Decision Tree

Before calling a draft-prep tool, choose the smallest live operation that matches the task:

1. Market research only -> `search_markets`.
2. Existing thesis update -> `get_thesis`, verify title/current revision/identity, then `prepare_revision_draft`.
3. New thesis preview -> `create_thesis_draft`.
4. Existing thesis calldata rebuild with no text change -> `prepare_anchor_transaction`.
5. Public publish, transaction broadcast, direct REST writes, article/blog output, claims, staking, challenge/settlement, paid verification, or LLM verification -> stop unless a separate approved path and evidence exist.

Do not work around a failed revision lookup by creating a replacement thesis. A missing `thesisId`, mismatched wallet, or unauthorized X handle is a blocker, not permission to change identity or scope.

### Market Policy Screen

Prediction markets are thesis signals, not permission to pull any market into an Eva draft. Before using a market returned by `search_markets` or supplied in a handoff, apply `docs/MARKET_POLICY.md`.

Safe handling:

- Prefer the MCP `search_markets` result set because it uses the same filtered market universe as the app market selector.
- If a market comes from an external search, stale comment, screenshot, or manually supplied URL, screen the title/category/provider URL against `docs/MARKET_POLICY.md` before adding it to `predictionSignals`.
- Exclude prohibited categories such as sports, elections/political offices, active geopolitics/armed conflict, personal tragedy/private life, criminal trial outcomes, easily manipulable social/action prompts, and entertainment/pop-culture novelty markets.
- When a useful thesis has only prohibited or off-policy markets available, prepare it as signal-light or block for better evidence. Do not smuggle an off-policy market into `predictionSignals` just because the schema accepts a `marketId` and `marketUrl`.

Safe claim after filtering: `market policy screened`. Unsafe claim: `signal-backed` when the only market evidence was removed or never screened.

## Identity Requirements

All draft or revision preparation requires:

- `xHandle`
- `walletAddress` as a full `0x`-prefixed 40-hex-character EVM address (ENS, shortened addresses, and missing `0x` prefixes are rejected by the live schema)
- wallet source fixed to `external`; embedded wallets are rejected

Use Eva's sovereign wallet (`0x0fe61780bd5508b3C99e420662050e5560608cA4`) only when the operator explicitly approved that signer for the task. Transaction broadcast always needs explicit approval at action time.

### Schema Defaults Are Not Approval

Some live schemas have safe defaults so a local draft-prep rehearsal can validate without noisy boilerplate. Defaults are not authorization, evidence, or launch-readiness proof.

- `create_thesis_draft.walletSource` defaults to `external`; still record the operator-approved signer/source before preparing calldata.
- Signal defaults such as `selectedOutcomeLabel: "Yes"`, `weight: 50`, `role`, `status: "open"`, `verifierVerdict: "unverifiable_yet"`, and `verifierScore: 50` are schema fallbacks, not sourced evidence.
- `predictionSignals: []` and `factSignals: []` are valid only when the handoff says the draft is intentionally signal-light.
- `prepare_revision_draft` currently has no `walletSource` field; do not add one or infer signer authority from the new-draft schema.

If a defaulted field affects identity, evidence quality, risk weighting, or user-facing claims, make it explicit from task-time evidence or report the gap. Do not turn a server default into approval to publish, broadcast, or claim a signal is verified.

### Exact Identity Inputs Only

Treat `xHandle`, `walletAddress`, `walletSource`, and `thesisId` as exact authority inputs, not fuzzy lookup hints.

Safe sources:

- task-time approval that names the exact X handle and EVM wallet address,
- fresh `get_thesis` readback when preparing a revision for the same author,
- explicit approval for the exact self-custodial external signer when the live tool accepts `walletSource`,
- canonical `thesisId` from the task or approved readback.

Unsafe substitutions:

- ENS/name resolution, shortened addresses, deployer wallets, saved wallets, private keys, seed phrases, or "same as last time",
- display names, bios, screenshots, titles, slugs, stale issue metadata, or old `anchorPreparationId` values,
- choosing between multiple possible wallets or signer sources without task-time approval.

The only safe repair is to trim surrounding whitespace and preserve the supplied value. If identity is missing, ambiguous, malformed, or mismatched with `get_thesis` readback, block with `blocked: exact identity input missing` or `blocked: revision identity mismatch`. Do not prepare calldata, create a replacement thesis, or swap in Eva's wallet as a convenience fallback.

## Tool Schemas

### Live input field matrix

Use this matrix as the source-of-truth checklist before composing payloads. Do not add fields just because another tool accepts them, and do not omit required identity fields on write-adjacent calls.

| Tool | Required fields | Optional/defaulted fields | Fields agents must not add |
|---|---|---|---|
| `search_markets` | none | `query` | thesis text, identity, wallet, publish, broadcast, or storage fields |
| `get_thesis` | `thesisId` | none | `xHandle`, `walletAddress`, `walletSource`, body, signals, publish, or broadcast fields |
| `create_thesis_draft` | `title`, `body`, `xHandle`, `walletAddress` (`0x` + 40 hex chars) | `walletSource` (`external` default), `predictionSignals` (`[]` default), `factSignals` (`[]` default) | `thesisId`, revision `note`, transaction hash, receipt, publish/live flags, or storage-readiness claims |
| `prepare_revision_draft` | `thesisId`, full replacement `body`, `xHandle`, `walletAddress` (`0x` + 40 hex chars) | `note` | `walletSource`, patch/diff-only body, partial paragraph, transaction hash, receipt, publish/live flags, or storage-readiness claims |
| `prepare_anchor_transaction` | `thesisId` | none | body changes, identity swaps, signals, transaction hash, receipt, publish/live flags, or storage-readiness claims |

Signal fields are nested under `predictionSignals` and `factSignals` only. Prediction signals accept `marketId`, `marketTitle`, `marketUrl`, `selectedOutcomeLabel`, `oddsAtAdd`, `currentOdds`, `weight`, `role`, `rationale`, and `status`. Fact signals accept `claimText`, `sourceUrl`, `verifierVerdict`, `verifierScore`, `reportUri`, `reportHash`, `weight`, `role`, and `rationale`.

Payload hygiene rules:

- `walletSource` is a `create_thesis_draft` field only. Do not send it to `prepare_revision_draft`; record signer/source approval in the handoff instead.
- `note` belongs to `prepare_revision_draft` only. It explains the delta; it is not the revision body.
- `body` for a revision is always the full replacement body, not a patch, append-only note, or partial paragraph.
- Optional URLs (`marketUrl`, `sourceUrl`) must be valid URLs when present. If the source is unknown or malformed, omit the URL and report the source URL gap instead of fabricating one.
- Returned or handoff-only concepts (`publishState`, `anchorStatus`, `anchorPreparationId`, `transactions`, tx hash, receipt, readback, storage state) are not input fields.

### `search_markets`

```json
{
  "query": "spacex ipo"
}
```

`query` is optional. Results are capped to the first 20 matches.

### `create_thesis_draft`

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

Important ranges and enums:

- odds: `0` to `1`
- weights: `1` to `100`
- signal roles: `core`, `lateral`, `second_order`, `third_order`, `hedge`, `contradiction`
- market status: `open`, `closed`, `resolved`, `cancelled`
- fact verdicts: `verified`, `likely_true`, `mixed`, `misleading`, `likely_false`, `false`, `unverifiable_yet`, `non_falsifiable`

Minimum valid draft-prep payload when no material signals are ready yet:

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

`predictionSignals` and `factSignals` may be empty, but that should be an explicit choice. Do not invent markets, sources, URLs, scores, or weights just to make a draft look complete.

Expected draft-prep output includes:

- `publishState: "anchor_prepared_not_published"`
- `anchorPreparationId`
- `anchorStatus: "prepared"`
- previewed `thesis`, `markets`, `predictor`, and `counters`
- `transactions` for user-approved anchoring
- `nextStep` telling the agent to get user approval before publishing

### Output Claim Matrix

Use this matrix when summarizing MCP results back to a user or another agent:

| Observed output | Safe claim | Unsafe claim |
|---|---|---|
| `publishState: "anchor_prepared_not_published"` | "I prepared a draft/anchor payload for review." | "The thesis is published." |
| `anchorStatus: "prepared"` | "The transaction calldata is ready for approval." | "The thesis is anchored onchain." |
| `transactions` array only from `prepare_anchor_transaction` | "I rebuilt the anchor transaction payload." | "I updated or fixed the stored thesis." |
| submitted tx hash but no receipt/readback | "A transaction was submitted; confirmation is pending." | "The revision is confirmed." |
| receipt or contract readback matching the thesis/revision | "The anchor is confirmed." | N/A |

If the result contains an error, missing thesis, or mismatched identity, stop and report the blocker. Do not retry with a different wallet, X handle, or public publish path unless the operator explicitly approves that change.

### MCP Result Envelope

Eva MCP tools return SDK-style text content. In most clients, the fields you need are inside `content[0].text`, not beside `content` at the top level:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"publishState\":\"anchor_prepared_not_published\",\"anchorStatus\":\"prepared\"}"
    }
  ]
}
```

Agent handling rule:

1. If `isError: true`, treat the call as blocked and do not parse it into a partial success.
2. Find the first `content` item with `type: "text"`.
3. For `search_markets`, parse that text as a JSON array.
4. For `get_thesis`, parse that text as a thesis detail object.
5. For `create_thesis_draft`, `prepare_revision_draft`, and `prepare_anchor_transaction`, parse that text as the prepared anchor object, then read `publishState`, `anchorStatus`, `anchorPreparationId`, `transactions`, and `nextStep` from the parsed object.

If the text part is missing or cannot be parsed, report `blocked: MCP result envelope did not contain parseable JSON`. Do not treat an envelope without `isError` as evidence that a transaction was submitted, confirmed, published, or stored durably.

Use one parser per tool result and fill the evidence inventory only from the parsed object. A tool name, request intent, or SDK envelope is not a fallback source for `publishState`, `anchorStatus`, storage readiness, tx hash, receipt, or public/live state.

### Evidence Inventory Before Reporting

For every write-adjacent MCP result, capture the evidence before writing the handoff. This keeps agents from turning familiar markers into stronger claims.

- Tool and intent: the live tool name plus whether this was a new draft, revision draft, or anchor rebuild.
- Identity: the approved `xHandle`, `walletAddress`, and `walletSource` where the live schema supports it.
- Output markers: `publishState`, `anchorStatus`, `anchorPreparationId`, `nextStep`, and transaction payload count exactly as returned.
- Transaction state: tx hash, receipt, and contract readback are `not returned` unless a separate approved broadcaster or verifier returned them.
- Content state: thesis title or `thesisId`, current revision/version if returned, signal counts, and any missing source URLs.
- Storage state: `storage not assessed` unless a named readiness/readback check proves otherwise.

If the inventory cannot distinguish draft prep from a public publish, stop at `blocked:`. Missing output is not evidence of publication, anchoring, revision, or durable storage.

### Handoff Freshness Gate

Treat prior agent comments, issue metadata, screenshots, saved draft JSON, and old `anchorPreparationId` values as leads, not current protocol evidence. Before acting on a handoff or closing a protocol-state claim, revalidate with the smallest live read path:

- `get_thesis` for existing thesis state or any revision workflow,
- API readback, public URL evidence, or onchain receipt/readback before claiming public/live state,
- a named readiness/readback check before claiming durable storage,
- `blocked:` if live readback is missing, stale, or conflicts with the handoff.

Fresh readback beats comment archaeology. Do not use an old handoff as permission to revise, publish, anchor, or mark storage verified.

### Schema Gotchas For Agents

- A `cancelled` prediction market is valid input. Use it when a market was removed/cancelled by the source, and explain why it still matters in `rationale`.
- `cancelled` is a market status, not a thesis publish state. It does not mean a prepared draft, revision, or anchor payload was cancelled.
- If a market is no longer useful evidence, omit it instead of forcing it into `closed`, `resolved`, or `contradiction`.
- Schema defaults exist for generic fields (`selectedOutcomeLabel`, `weight`, `role`, `status`, `verifierVerdict`, `verifierScore`, and `walletSource` where supported). Prefer explicit values when the field affects the thesis; defaults are for low-risk drafts, not evidence shortcuts.
- URLs must be valid URLs when supplied. If the source URL is unknown, omit it and call out the missing source in the handoff instead of using placeholders.
- Fact signals may include optional `reportUri` and `reportHash` evidence pointers. Include them only when a verifier/report already produced them; never fabricate hashes or storage URIs to make a signal look stronger.
- `prepare_revision_draft` currently accepts `thesisId`, `body`, `note`, `xHandle`, and `walletAddress`; it does not accept `walletSource` yet.

### `get_thesis`

```json
{
  "thesisId": "thesis_abc123"
}
```

Use this before revising. Do not infer current revision state from old comments, screenshots, or prior drafts.

#### Revision identity readback gate

Before preparing a revision, parse the `get_thesis` result and write down the live identity readback:

```text
revision identity readback:
- thesisId: <parsed.thesis.thesisId>
- current title: <parsed.thesis.title>
- current revision: <parsed.thesis.currentRevision.version>
- author xHandle: <parsed.thesis.author.xHandle>
- author walletAddress: <parsed.thesis.author.walletAddress>
- author walletSource: <parsed.thesis.author.walletSource>
```

Continue only when `author.xHandle` and `author.walletAddress` match the task-time approved identity for the revision. If either value is missing, stale, or mismatched, stop with `blocked: revision identity mismatch` and ask for the correct thesis id or approved identity. Do not prepare revision calldata, create a replacement thesis, or rely on remembered identity from a prior handoff.

Use `thesis.currentRevision.body` as the base for the full replacement body when preserving existing text. Use `thesis.currentRevision.version` only as readback context; it is not an input field for `prepare_revision_draft`.

### `prepare_revision_draft`

Revision prep uses a **full replacement body**. The `body` field is the complete next thesis text, not a patch, diff, append-only note, or partial paragraph. Use `note` for the concise delta explanation, and call `get_thesis` first so you can preserve any current text that should remain in the replacement body.

```json
{
  "thesisId": "thesis_abc123",
  "body": "Updated thesis body after the catalyst moved.",
  "note": "Catalyst update.",
  "xHandle": "@agentalpha",
  "walletAddress": "0x1111111111111111111111111111111111111111"
}
```

This previews the next revision and prepares calldata. It does not append to thesis history. Only claim a revision is live after the public publish path has a matching prepared anchor, submitted transaction hash, and confirmed contract readback or receipt.

### `prepare_anchor_transaction`

```json
{
  "thesisId": "thesis_abc123"
}
```

Use this to rebuild anchor calldata for an existing thesis. It returns transaction payloads only. It does not store a new thesis, append a revision, publish anything publicly, or prove the thesis is anchored.

Safe summary language:

> Prepared anchor transaction payload for `thesis_abc123`; user approval and confirmed onchain receipt are still required.

Expected output uses the same safe boundary wrapper as draft/revision preparation:

- `publishState: "anchor_prepared_not_published"`
- `anchorPreparationId`
- `anchorStatus: "prepared"`
- existing `thesis`, linked `markets`, `predictor`, and `counters`
- `transactions` for user-approved anchoring
- `nextStep` telling the agent to get user approval before broadcasting

## Agent Checklist

Before draft prep:

1. Confirm the X handle that should own the draft.
2. Confirm the wallet address and wallet source.
3. Preserve source URLs for fact and market signals.
4. Assign weights deliberately. Use contradictions for signals that weaken the thesis, not as generic caveats.
5. If there are no reliable signals yet, pass empty signal arrays and state that the draft is intentionally signal-light.

After draft prep:

1. Report `publishState`, `anchorStatus`, and `anchorPreparationId` to the operator.
2. Summarize what transactions were prepared, without calling them published.
3. Ask for explicit approval before any broadcast path.
4. After broadcast, require a transaction receipt or contract readback before saying `confirmed`.

## Revision Lifecycle Checklist

Use this sequence every time an agent updates an existing thesis:

1. Call `get_thesis` for the live `thesisId` and quote the current title/status in your notes.
2. Decide what changed: catalyst, odds movement, fact correction, or contradiction. If nothing materially changed, do not prepare a revision.
3. Call `prepare_revision_draft` with the full replacement body plus a short `note`. The note should explain the delta, not repeat the whole thesis.
4. Treat the response as a preview only while `publishState` is `anchor_prepared_not_published` and `anchorStatus` is `prepared`.
5. Show the user the revision summary, anchor preparation id, and transaction payload. Ask for explicit approval before any broadcast.
6. After approval, require a transaction hash plus receipt or contract readback before saying the revision is live.

Evidence ladder for agent language:

- Draft prepared: MCP returned `anchor_prepared_not_published`.
- Broadcast submitted: there is a transaction hash, but confirmation is still pending.
- Revision live: the transaction is confirmed and a contract readback or receipt matches the prepared thesis/revision.

Do not use issue comments, screenshots, stale draft JSON, or prior agent notes as proof of current revision state. Use `get_thesis` first, and use onchain confirmation before making public claims.

## Safe Write Boundary

Agents may:

- search markets,
- inspect theses,
- draft new theses,
- draft revisions,
- prepare anchor calldata,
- summarize the prepared transaction for the user.

Agents may not change identity fields opportunistically. If the requested `xHandle` or `walletAddress` is wrong, missing, or unauthorized, ask for the correct identity rather than substituting Eva's wallet, an embedded wallet, or a remembered address.

Agents must not:

- broadcast transactions without explicit approval,
- claim a thesis or revision is published from MCP output alone,
- claim public blog/article support,
- reintroduce removed `/claims`, `/articles`, curator, staking, challenge, settlement, paid-verification, or LLM-verification scope,
- omit source URLs, signal weights, or revision notes when they materially affect the thesis.

## Agent Handoff Contract

After any draft-prep tool call, return a handoff that separates preparation from publication. Include the thesis title or id, wallet used, signal counts, `publishState` / `anchorPreparationId` when present, and the exact user approval still needed before broadcast.

Use `docs/AGENT_SAFE_OUTPUTS.md` for short user-facing snippets. Use `docs/MCP_AGENT_HANDOFF_TEMPLATE.md` for full handoffs and the status ladder from `draft prepared` to `published/live`. Use `docs/MCP_AGENT_EXAMPLES.md` for copy-paste MCP payloads for market search, new drafts, revisions, anchor rebuilds, and blocked identity handoffs.

## Minimal Agent Workflow

1. `search_markets` for candidate market signals.
2. Draft the thesis body and collect fact sources.
3. Call `create_thesis_draft` with the public X author label plus exact self-custodial wallet identity.
4. Show the prepared summary and transactions to the user.
5. Wait for explicit approval before any broadcast or public publish path.
6. For updates, call `get_thesis`, then `prepare_revision_draft`, then repeat the approval boundary.

## SpaceX Thesis Dry Run

Use the repo script when an agent needs a deterministic SpaceX IPO payload example without guessing at schema shape:

```bash
pnpm publish:spacex-thesis --dry-run
```

Dry run is the default. It prints the API payload and does not write to Eva, publish a thesis, broadcast a transaction, or confirm an onchain anchor. This makes it safe for onboarding, fixture review, and copy/schema rehearsal.

Before using `--publish`, the operator must explicitly approve the write target and signer:

```bash
pnpm publish:spacex-thesis --publish --api-base https://api.eva.jaack.me/api --wallet 0x1111111111111111111111111111111111111111
```

`--publish` creates the app thesis through the HTTP API after duplicate detection. It still does not broadcast Avalanche transactions and still must not be described as an onchain anchor or public protocol confirmation. Treat any anchor work as a separate approval-gated transaction flow.
