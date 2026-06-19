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
- Keep `docs/MCP_AGENT_GUIDE.md` open when creating or revising theses.
- Use `docs/MCP_AGENT_EXAMPLES.md` for known-good payload shapes before improvising schema fields.
- Use `docs/AGENT_SAFE_OUTPUTS.md` before summarizing MCP write results to a user.
- Treat remote MCP write tools as unavailable unless the agent has scoped credentials and the operator explicitly approved that path.
- Confirm X identity, wallet address, and wallet source before preparing protocol transactions.
- Use `0x0fe61780bd5508b3C99e420662050e5560608cA4` only when the operator explicitly approved that signer for the task.
- If no reliable market or fact signals are ready, pass empty signal arrays and say the draft is intentionally signal-light. Do not invent sources, URLs, scores, or weights.

## Tool Selection Shortcut

- Research only: use `search_markets`.
- Existing thesis update: call `get_thesis` first, then `prepare_revision_draft` with a concise delta note.
- New thesis preview: use `create_thesis_draft`.
- Existing thesis calldata rebuild with no text change: use `prepare_anchor_transaction`.
- Publish, broadcast, article/blog output, claims, staking, challenge/settlement, paid verification, or LLM verification: stop unless a separate approved path and evidence exist.

Do not create a replacement thesis because `get_thesis` failed. Missing thesis id, mismatched identity, or unauthorized wallet authority is a blocker.

## Safety Rules

- Read tools (`search_markets`, `get_thesis`) are safe by default.
- Draft-prep tools (`create_thesis_draft`, `prepare_revision_draft`, `prepare_anchor_transaction`) prepare calldata and previews only.
- MCP draft/anchor-prep output means `publishState: "anchor_prepared_not_published"` and `anchorStatus: "prepared"`; it is not public publish support.
- `prepare_anchor_transaction` rebuilds calldata for an existing thesis; it still does not broadcast, confirm, or publish anything.
- Transaction preparation is not transaction broadcast.
- Broadcasts require explicit user approval at action time.
- Never mark a thesis, thesis revision, or signal as confirmed without a transaction receipt or contract readback.
- If MCP output is ambiguous, report the exact missing evidence and do not infer publication.
- Do not swap in a different `xHandle`, `walletAddress`, or wallet source to make a draft work. If identity is missing, invalid, or unauthorized, stop and ask for the correct operator-approved identity.
- Do not expand agent powers into trades, custody, staking, claims markets, articles, or blog publishing.

## Revision Handoff

When an agent revises an existing thesis:

1. Start with `get_thesis`; do not trust stale comments or old draft JSON.
2. Use `prepare_revision_draft` with a concise `note` that explains the delta.
3. Report the state as "draft prepared" until the approved transaction is submitted and confirmed.
4. Only say "revision live" after a receipt or contract readback matches the prepared revision.

Current live schema note: `prepare_revision_draft` accepts `thesisId`, `body`, `note`, `xHandle`, and `walletAddress`. It does not accept `walletSource` yet.

Current market status enum: `open`, `closed`, `resolved`, `cancelled`. Treat `cancelled` as a source-market state only; it is not a thesis publish state and does not imply an Eva draft or anchor was cancelled.

Schema defaults exist for low-risk draft prep, but evidence-bearing fields should be explicit when known. Use valid URLs only; omit unknown source URLs and report the gap in the handoff.

Fact signals may include optional `reportUri` and `reportHash` evidence pointers. Include them only when they already exist; do not fabricate verifier reports, hashes, or storage URIs.

## User-Facing Result Language

- Prepared MCP draft output: "prepared for review", not "published".
- Prepared anchor transaction: "calldata ready for approval", not "anchored".
- Submitted transaction without receipt: "pending confirmation", not "confirmed".
- Receipt or contract readback matching the thesis/revision: "confirmed".

If a tool returns an error or a missing thesis, report the blocker directly. Do not retry with a guessed thesis ID or alternate wallet.

## Reporting Pattern

After draft prep, report the `anchorPreparationId`, the prepared transaction purpose, and the exact missing approval/confirmation step. Do not say the thesis is live, public, or published from MCP output alone.

Use `docs/AGENT_SAFE_OUTPUTS.md` for short user-facing wording and `docs/MCP_AGENT_HANDOFF_TEMPLATE.md` for full handoffs between agents, reviewers, or issue comments.
