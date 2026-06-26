# MCP Agent Error Handling

Use this when an agent is already following `docs/MCP_AGENT_GUIDE.md` but the MCP client, schema, or output shape is unclear. The goal is to recover safely without expanding Eva Protocol write powers.

## Live tool allowlist

The live MCP server exposes only these agent-facing tools:

- `search_markets`
- `get_thesis`
- `create_thesis_draft`
- `prepare_revision_draft`
- `prepare_anchor_transaction`

If a client, prompt, old note, or autocomplete suggests any other write tool, treat it as stale. Do not call or recreate removed tools such as `record_revision`, `/claims`, `/articles`, curator, staking, challenge, settlement, paid-verification, or LLM-verification flows.

## No silent fallback ladder

When MCP work fails, classify the failure before choosing a fallback. A fallback is only safe when it stays on the same or lower permission rung and does not add write powers.

| Failure class | Smallest safe fallback | Fallback ceiling |
|---|---|---|
| Client setup failure | Restart or reconfigure the local `eva-thesis` stdio server from the repo root. | `blocked` until the local server starts. |
| Live allowlist drift | Re-read the allowlist above and choose only one of the five live tools. | `read-only` unless a matching draft-prep tool exists. |
| Input schema mismatch | Repair only directly evidenced fields with the schema repair cards below. | Same requested rung, or `blocked` if repair would guess. |
| Missing thesis or identity readback | Ask for the canonical `thesisId`, task-time `xHandle`, wallet address, and signer/source approval. | `blocked`; do not create a replacement thesis. |
| Protocol readback gap | Use `get_thesis`, approved API/public URL evidence, or onchain receipt/readback. | Historical handoff only; no live/confirmed wording. |
| Approved non-MCP execution gap | Fill the separate execution receipt card before using REST, broadcaster, or transaction claims. | `draft prepared` / `anchor prepared` until approval, receipt, and readback exist. |

Unsafe fallbacks are still unsafe even if they are technically possible: UI scraping, direct REST writes, unauthenticated production calls, guessed wallets, stale issue metadata, or reusing an old `anchorPreparationId` do not repair a failed MCP path.

## Safe recovery rules

| Symptom | Safe response | Do not do |
|---|---|---|
| Tool name is missing or rejected | Re-read the allowlist above and use the nearest live draft-prep tool only when it matches the task. | Invent aliases or fallback to removed routes. |
| Schema validation fails | Repair the input to match the documented enums, ranges, required identity fields, and URL constraints. | Drop material signals just to make the call pass. |
| `get_thesis` or revision prep says the thesis is not found | Ask for the canonical thesis id/slug or search/read the live thesis list through approved APIs. | Create a replacement thesis unless the operator explicitly requested a new thesis. |
| Draft or revision prep returns transactions | Treat the result as anchor preparation only. Summarize it for approval. | Claim public publish, broadcast, or confirmed anchoring from prepared calldata. |
| Anchor prep output lacks `publishState` on an older build | Still apply the same boundary: prepared transaction data is not publication or confirmation. | Treat legacy output shape as extra authority. |
| Remote MCP credentials are absent | Use the local MCP server or report the credential blocker. | Scrape the UI or try unauthenticated write paths. |
| Production storage/readiness is not observable | Report `storage readiness blocked` and ask for an approved readiness/readback check or durable-store evidence. | Treat a generic `/health`, `anchorPreparationId`, or calldata as proof that thesis writes persist across production restarts/deploys. |
| A market is supplied from outside MCP or looks off-policy | Screen it against `docs/MARKET_POLICY.md`; omit prohibited markets and downgrade to signal-light or block for acceptable evidence. | Use sports, elections/political offices, active geopolitics/armed conflict, personal tragedy/private life, criminal trials, social/action prompts, or entertainment novelty markets as Eva thesis signals. |

## Schema repair cards

Use these cards when a prompt is close to valid but unsafe to submit as-is. Repair only what is directly supported by the prompt or previous approved context; otherwise stop at `blocked:` and name the missing field.

| Problem input | Safe repair | Block instead when |
|---|---|---|
| Odds are written as `36%` or `36` | Convert to `0.36` only when the percent meaning is explicit. | The number could be probability, price, basis points, or a score. |
| Source URL is missing, malformed, or a placeholder | Omit optional `marketUrl` / `sourceUrl`, keep the signal only if the claim is still auditable, and report a source URL gap. | The URL is the only evidence for a material claim. |
| Market is manually pasted, stale, or externally discovered | Keep it only if it passes `docs/MARKET_POLICY.md`; otherwise remove it and report `market policy screened: excluded`. | The thesis depends on the excluded market and no acceptable replacement evidence exists. |
| Signal weight is missing | Use the schema default only for low-risk drafts; otherwise ask for weight or explain the default in the handoff. | Weight changes the thesis interpretation or ranking. |
| Fact verifier data is missing | Use `verifierVerdict: "unverifiable_yet"` and `verifierScore: 50` only when the draft is explicitly exploratory. | The user asked for a verified or signal-backed thesis. |
| Revision prompt gives a patch, diff, or extra paragraph | Ask for or construct a full replacement body from approved source text, then use `note` for the delta. | You cannot reconstruct the intended full body without inventing content. |
| Identity is remembered from another task but not approved here | Block and ask for task-time `xHandle`, `walletAddress`, and signer/source approval. | Always. Do not import identity authority from stale comments. |
| Wallet is ENS, shortened, private-key-shaped, or "same as last time" | Block and ask for the exact approved `0x...` wallet address plus signer/source approval. | Always. Do not resolve, expand, reveal, or substitute wallet authority. |
| Thesis identity is a title, slug, screenshot, old metadata value, or `anchorPreparationId` | Block and ask for the canonical `thesisId` or perform an approved readback path. | Always. Do not guess thesis ids or treat anchor-prep ids as thesis ids. |
| X identity is a display name, bio, or stale handle from an old issue | Block and ask for the exact task-time `xHandle`, or compare against fresh `get_thesis` author readback for revisions. | Always. Do not infer author authority from social profile text. |
| Prompt asks for direct REST write because MCP is inconvenient | Block direct REST and use local MCP if possible. | There is no separate approved execution path with scoped credentials and readback evidence. |

Copy-paste blocked shape:

```text
blocked: the MCP input is not safe to submit yet.

missing or ambiguous:
- <field>: <why it matters>

safe boundary: I did not prepare calldata, call direct REST write routes, broadcast a transaction, or publish a thesis.
```

Copy-paste repaired-shape note:

```text
repair applied: <field> was normalized or omitted.
reason: <direct evidence from prompt/context>.
handoff gap: <source URL gap | default weight | exploratory verifier state | storage not assessed>.
```

## Minimum preflight before any draft-prep call

1. Confirm the operator-approved X handle and wallet address.
2. Confirm whether the signer is external or embedded when the tool accepts `walletSource`.
3. Keep all material source URLs, signal weights, roles, and revision notes.
4. Screen externally supplied, stale, or manual prediction markets against `docs/MARKET_POLICY.md`; omit prohibited market categories instead of forcing them into `predictionSignals`.
5. For revisions, call `get_thesis` first and verify the wallet matches the thesis author.
6. Tell the user the output will be `anchor_prepared_not_published` before asking for broadcast approval.
7. For production or launch-readiness tasks, confirm what proves durable thesis/revision storage. If there is no approved readiness/readback check, mark storage as `not assessed` or `readiness blocked`.

## Output language for agents

Use precise status words:

- `draft prepared` means a preview and/or calldata exists.
- `anchor prepared` means calldata exists for a user-approved transaction.
- `submitted` means a transaction hash exists.
- `confirmed` means a receipt or contract readback confirms the thesis or revision anchor.
- `published` requires the public publish path plus confirmed anchoring evidence.
- `storage verified` requires an approved readiness endpoint, API readback, or storage-mode check proving persisted thesis/revision state.

Anything less than a receipt or contract readback is not confirmed protocol state.
Anything less than a named persistence/readback check is not production storage-readiness evidence.
