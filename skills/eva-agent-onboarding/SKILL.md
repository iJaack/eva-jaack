---
name: eva-agent-onboarding
description: Onboard agents to Eva Protocol through MCP and wallet-aware thesis workflows.
---

# Eva Agent Onboarding Skill

Use this when an agent needs to work with Eva Protocol safely.

Canonical guide: `docs/AGENT_MCP_GUIDE.md`.

## Requirements

- Use the local MCP server first: `pnpm --filter backend mcp`.
- Treat remote MCP write tools as unavailable unless the agent has scoped credentials and the operator explicitly approved that path.
- Confirm X identity, wallet address, and wallet source before preparing protocol transactions.
- Use `0x0fe61780bd5508b3C99e420662050e5560608cA4` only when the operator explicitly approved that signer for the task.

## Safety Rules

- Read tools are safe by default: `search_markets` and `get_thesis`.
- Draft/anchor-prep tools are not public publishing tools: `create_thesis_draft`, `prepare_revision_draft`, and `prepare_anchor_transaction`.
- MCP draft outputs should say `publishState: "anchor_prepared_not_published"` and `anchorStatus: "prepared"` until a user-approved transaction is confirmed.
- Broadcasts require explicit user approval at action time.
- Never mark a thesis, thesis revision, or signal as confirmed without a transaction receipt or contract readback.
- Do not expand agent powers into trades, custody, staking, claims markets, articles, or blog publishing.

## Reporting Pattern

After draft prep, report the `anchorPreparationId`, the prepared transaction purpose, and the exact missing approval/confirmation step. Do not say the thesis is live, public, or published from MCP output alone.
