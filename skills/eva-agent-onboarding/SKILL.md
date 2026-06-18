---
name: eva-agent-onboarding
description: Onboard agents to Eva Protocol through MCP and wallet-aware thesis workflows.
---

# Eva Agent Onboarding Skill

Use this when an agent needs to work with Eva Protocol safely.

## Requirements

- Use the local MCP server first: `pnpm --filter backend mcp`.
- Keep `docs/MCP_AGENT_GUIDE.md` open when creating or revising theses.
- Use `docs/AGENT_SAFE_OUTPUTS.md` before summarizing MCP write results to a user.
- Treat remote MCP write tools as unavailable unless the agent has scoped credentials.
- Confirm wallet identity before preparing or broadcasting protocol transactions.
- Use `0x0fe61780bd5508b3C99e420662050e5560608cA4` only when the operator explicitly approved that signer for the task.

## Safety Rules

- Read tools (`search_markets`, `get_thesis`) are safe by default.
- Draft-prep tools (`create_thesis_draft`, `prepare_revision_draft`, `prepare_anchor_transaction`) prepare calldata and previews only.
- MCP draft/anchor-prep output means `anchor_prepared_not_published`; it is not public publish support.
- `prepare_anchor_transaction` rebuilds calldata for an existing thesis; it still does not broadcast, confirm, or publish anything.
- Transaction preparation is not transaction broadcast.
- Broadcasts require explicit user approval at action time.
- Never mark a thesis revision or signal as confirmed without a transaction receipt or contract readback.
- If MCP output is ambiguous, report the exact missing evidence and do not infer publication.
