---
name: eva-agent-onboarding
description: Onboard agents to Eva Protocol through MCP and wallet-aware thesis workflows.
---

# Eva Agent Onboarding Skill

Use this when an agent needs to work with Eva Protocol safely.

Canonical guide: `docs/MCP_AGENT_GUIDE.md`.
Safe output wording: `docs/AGENT_SAFE_OUTPUTS.md`.

## Requirements

- Use the local MCP server first: `pnpm --filter backend mcp`.
- Keep `docs/MCP_AGENT_GUIDE.md` open when creating or revising theses.
- Use `docs/AGENT_SAFE_OUTPUTS.md` before summarizing MCP write results to a user.
- Treat remote MCP write tools as unavailable unless the agent has scoped credentials and the operator explicitly approved that path.
- Confirm X identity, wallet address, and wallet source before preparing protocol transactions.
- Use `0x0fe61780bd5508b3C99e420662050e5560608cA4` only when the operator explicitly approved that signer for the task.

## Safety Rules

- Read tools (`search_markets`, `get_thesis`) are safe by default.
- Draft-prep tools (`create_thesis_draft`, `prepare_revision_draft`, `prepare_anchor_transaction`) prepare calldata and previews only.
- MCP draft/anchor-prep output means `publishState: "anchor_prepared_not_published"` and `anchorStatus: "prepared"`; it is not public publish support.
- `prepare_anchor_transaction` rebuilds calldata for an existing thesis; it still does not broadcast, confirm, or publish anything.
- Transaction preparation is not transaction broadcast.
- Broadcasts require explicit user approval at action time.
- Never mark a thesis, thesis revision, or signal as confirmed without a transaction receipt or contract readback.
- If MCP output is ambiguous, report the exact missing evidence and do not infer publication.
- Do not expand agent powers into trades, custody, staking, claims markets, articles, or blog publishing.

## Reporting Pattern

After draft prep, report the `anchorPreparationId`, the prepared transaction purpose, and the exact missing approval/confirmation step. Do not say the thesis is live, public, or published from MCP output alone.

Use `docs/AGENT_SAFE_OUTPUTS.md` for short user-facing wording and `docs/MCP_AGENT_HANDOFF_TEMPLATE.md` for full handoffs between agents, reviewers, or issue comments.
