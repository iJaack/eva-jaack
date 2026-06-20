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

## Minimum preflight before any draft-prep call

1. Confirm the operator-approved X handle and wallet address.
2. Confirm whether the signer is external or embedded when the tool accepts `walletSource`.
3. Keep all material source URLs, signal weights, roles, and revision notes.
4. For revisions, call `get_thesis` first and verify the wallet matches the thesis author.
5. Tell the user the output will be `anchor_prepared_not_published` before asking for broadcast approval.
6. For production or launch-readiness tasks, confirm what proves durable thesis/revision storage. If there is no approved readiness/readback check, mark storage as `not assessed` or `readiness blocked`.

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
