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

## 0.0 Read-only MCP client smoke

Use this before running the onboarding drill in a new client. The smoke test proves tool discovery and read-only calls only; it does not prepare calldata.

```text
read-only MCP smoke:
- local stdio server: `eva-thesis` from repo root via `pnpm --filter backend mcp`
- tool list smoke: exactly five live tools found
- optional HTTP discovery smoke: `GET /api/mcp` exposes `agentSafeBoundary.mcpOutputCeiling: "anchor_prepared"`, `storageClaimDefault: "storage_not_assessed"`, `safeResultVerbs`, and `notEvidenceForStrongerClaims`
- description boundary smoke: draft-prep descriptions include no publish, no broadcast, no direct REST writes, and no storage-durability proof
- read-only call smoke: `search_markets` completed; result wording stays read-only
- write-adjacent rehearsal: blocked until exact onboarding-approved `xHandle`, `walletAddress`, and `walletSource` are present
```

Safe smoke result:

```text
smoke: MCP client wiring is reachable through the local server.
tools: exact live allowlist matched.
read-only call: search_markets returned candidates.
boundary: no draft, revision, anchor calldata, transaction broadcast, public publish, direct REST write, or storage proof happened.
discovery ceiling: MCP-only output remains inspected/prepared/calldata_ready; tokens, route URLs, browser sessions, deploy/issue/PR status, old anchorPreparationIds, and prepared calldata are not stronger-claim evidence.
```

Blocked smoke result:

```text
blocked: MCP client setup failure / live allowlist drift.
missing: <local server start | exact five-tool allowlist | discovery description boundary | read-only search result>.
boundary: I did not use write-adjacent tools as a connectivity test and did not fall back to app HTTP routes, UI scraping, or production write paths.
```

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

MCP text parser pattern:

```ts
const text = result.content?.find((part) => part.type === "text")?.text;
if (!text || result.isError) {
  throw new Error("blocked: missing successful MCP text JSON envelope");
}
const parsed = JSON.parse(text);
```

Only copy values from `parsed` into a handoff. A tool name or SDK envelope alone is not evidence for `publishState`, `anchorStatus`, storage readiness, transaction submission, confirmation, or live/public state.

Per-call evidence isolation: if a workflow uses several MCP calls, keep one parsed evidence row per call. `search_markets` evidence can supply candidate signals only; `get_thesis` evidence can supply current thesis/author readback only; write-adjacent evidence can supply the specific `publishState`, `anchorStatus`, `anchorPreparationId`, and transactions from that call only. Do not merge a prior success with a later failure, reuse an old `anchorPreparationId` as the current result, or report a stronger final rung unless every required call in the chain has its own parsed evidence.

If `isError: true`, the text content is an error diagnostic, not a success payload. Do not parse it for `publishState`, merge it with a prior prepared result, or treat a mentioned `thesisId` as readback. Return a blocked result instead:

```text
blocked: MCP returned an error envelope.
failure class: <input schema mismatch | missing thesis/identity readback | client setup failure | protocol readback gap>
diagnostic: <plain text from the MCP error>
boundary: no calldata, transaction submission, public publish, confirmation, or storage proof was produced by this call.
```

Field-placement reminder before copy-pasting payloads:

- `walletSource` appears only in `create_thesis_draft` inputs.
- `note` appears only in `prepare_revision_draft` inputs and never replaces the full revision `body`.
- `publishState`, `anchorStatus`, `anchorPreparationId`, `transactions`, tx hash, receipt/readback, and storage wording are result or handoff fields, not inputs.
- `marketUrl` and `sourceUrl` are optional but must be valid URLs when present. Omit unknown URLs and report the source URL gap instead of inventing one.

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
market policy: <MCP-filtered | screened against docs/MARKET_POLICY.md | signal-light because off-policy markets were excluded>
output ceiling: <draft prepared | anchor prepared>
```

Do not let the payload outrun that contract. If the contract says signal-light, use empty arrays or label defaulted signal metadata. If the contract says `anchor prepared`, the result card must not say submitted, confirmed, published/live, or storage verified.

Market policy reminder: only use prediction markets that survive `docs/MARKET_POLICY.md`. MCP `search_markets` is the preferred source because it uses the app-filtered market universe. External/stale/manual markets must be screened before they enter `predictionSignals`; sports, elections/political offices, active geopolitics/armed conflict, personal tragedy/private life, criminal trials, easily manipulated social/action prompts, and entertainment/pop-culture novelty markets should be excluded rather than dressed up as thesis evidence.

## 0.2 Pre-send audit checklist

Use this just before a final answer, comment, or handoff. It is intentionally repetitive because most unsafe outputs happen after the tool call, not during schema validation.

```text
pre-send audit:
- parsed MCP text JSON envelope: <yes | blocked>
- coordination/protocol split: <issue/PR/deploy is not protocol evidence | named protocol evidence>
- final verb: <inspected | prepared | calldata ready | submitted | published/live>
- storage wording: <not assessed | readiness blocked | verified by named check>
- boundary named: <no broadcast | no public publish | previous revision unchanged | none because fully evidenced>
- missing before stronger claim: <approval | tx hash | receipt/readback | storage check | source URLs | none>
```

Safe completed example:

```text
pre-send audit:
- parsed MCP text JSON envelope: yes
- coordination/protocol split: issue status only proves handoff delivery, not publication
- final verb: prepared
- storage wording: not assessed
- boundary named: no transaction broadcast and no public publish happened
- missing before stronger claim: explicit approval, tx hash, receipt/readback, and durable storage check
```

## 0.3 Sanitize noisy handoffs before building payloads

Most bad MCP calls start from a mixed coordination handoff: issue status, PR URL, deploy URL, old metadata, and a real thesis request in the same paragraph. Strip everything that is not a live input field before calling a tool.

Noisy handoff:

```text
EVA-123 is in_review, PR is merged, deploy is green. Revise the thesis from yesterday with the same wallet and reuse the old anchorPreparationId. The author is @agentalpha.
```

Sanitized decision:

```text
operation: revision
identity source: blocked; walletAddress is missing and "same wallet" is not task-time approval
evidence source: blocked; exact thesisId and fresh get_thesis readback are missing
output ceiling: blocked
coordination context kept out of MCP payload: issue status, PR URL/merge state, deploy status, old anchorPreparationId
```

Safe response:

```text
blocked: exact thesisId and walletAddress are missing. I did not prepare revision calldata, reuse the old anchorPreparationId, treat the merged PR/deploy as protocol evidence, or publish anything.
```

If the same request includes exact current inputs, build only the schema fields the tool accepts:

```json
{
  "thesisId": "thesis_abc123",
  "body": "<full replacement thesis body>",
  "note": "Updates the catalyst window after the latest source readback.",
  "xHandle": "@agentalpha",
  "walletAddress": "0x1111111111111111111111111111111111111111"
}
```

Do not add `prUrl`, `issueId`, `deployUrl`, `walletSource`, `publishState`, `anchorPreparationId`, tx hash, receipt, or storage fields to `prepare_revision_draft`; those are coordination or result/handoff fields, not inputs.

## 0.4 Pick the execution path before using credentials

Use this when a handoff says something like "use this API key", "the deploy is green", "I am logged in", or "broadcast it". Access is not approval, and coordination state is not protocol state.

```text
execution path picker:
- requested path: <MCP local | API route | browser session | transaction broadcaster | public/live claim>
- evidence in hand: <query/thesisId | exact identity | approval scope | credential scope | tx hash | receipt/readback>
- safest allowed path: <search_markets/get_thesis | create_thesis_draft | prepare_revision_draft | prepare_anchor_transaction | blocked>
- output ceiling: <read-only inspection | draft prepared | anchor prepared | submitted | published/live | blocked>
- missing before escalation: <approval | credential scope | tx hash | receipt/readback | storage check | none>
```

Example downgrade:

```text
blocked: the handoff supplied a route URL and deployment note, but not approval scope, credential scope, write receipt, or readback evidence.

safe boundary: I did not call direct REST write routes, broadcast a transaction, publish a thesis, or treat the deployment as protocol state. Use local MCP draft/anchor-prep instead, or provide the separate approved execution path receipt card.
```

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
found MCP-filtered candidate markets for review. no draft, transaction, or public publish happened.
```

If you add market evidence from outside `search_markets`, screen it against `docs/MARKET_POLICY.md` before using it in a draft. If the only available markets are off-policy, use a signal-light draft or block for acceptable evidence instead.

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

Before preparing the revision, parse the `get_thesis` text JSON and fill this identity readback:

```text
revision identity readback:
- thesisId: <parsed.thesis.thesisId>
- current title: <parsed.thesis.title>
- current revision: <parsed.thesis.currentRevision.version>
- author xHandle: <parsed.thesis.author.xHandle>
- author walletAddress: <parsed.thesis.author.walletAddress>
- author walletSource: <parsed.thesis.author.walletSource>
```

Only continue if the author handle and wallet match the task-time approved revision identity. Build the new `body` as the full replacement text, using `thesis.currentRevision.body` as the preservation base when appropriate. If identity or current body readback is missing, use the blocked template instead of guessing.

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

## 7.2 Boundary tripwire examples

Use these when a prompt sounds operationally urgent but still lacks protocol evidence. Urgency does not change the MCP permission rung.

### `publish now` after draft prep

```text
blocked: the draft/anchor payload is prepared, but publish/live wording is not supported yet.

missing before publish/live:
- explicit approval for signer, network, and exact calldata
- broadcaster or approved execution path
- tx hash
- receipt/readback matching the thesis

safe current claim: draft prepared / anchor prepared only. no transaction broadcast and no public publish happened.
```

### `use this API key` for a direct REST write

```text
blocked: a credential or route URL is not approval to bypass MCP.

missing before non-MCP execution:
- approved execution path name
- approval evidence and exact action scope
- credential scope
- write receipt plan
- readback evidence plan

safe current claim: MCP can prepare draft/anchor calldata only until the receipt card is complete.
```

### `reuse the old anchorPreparationId`

```text
blocked: old anchorPreparationId values are historical handoff context, not fresh protocol evidence.

safe recovery:
- call get_thesis for existing state when a thesisId exists, or
- regenerate draft/revision/anchor preparation through the live MCP tool

safe current claim: historical handoff only; current publish, anchor, and storage state not revalidated.
```

### `just use Eva's wallet`

```text
blocked: signer authority is missing for this task.

missing before write-adjacent prep:
- task-time approval for xHandle
- task-time approval for walletAddress
- walletSource when the live tool accepts it

safe current claim: no calldata prepared, no transaction broadcast, and no identity substituted.
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
