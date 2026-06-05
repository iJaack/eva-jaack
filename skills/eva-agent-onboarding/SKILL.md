---
name: eva-agent-onboarding
description: Onboard agents to Eva Protocol through MCP and wallet-aware thesis workflows.
---

# Eva Agent Onboarding Skill

Use this when an agent needs to work with Eva Protocol safely.

## Requirements

- Use the local MCP server first: `pnpm --filter backend mcp`.
- Treat remote MCP write tools as unavailable unless the agent has scoped credentials.
- Confirm wallet identity before preparing or broadcasting protocol transactions.
- Use `0x0fE61780BD5508b3C99E420662050E5560608cA4` only when the operator explicitly approved that signer for the task.

## Safety Rules

- Read tools are safe by default.
- Write tools require X identity plus wallet identity.
- Transaction preparation is not transaction broadcast.
- Broadcasts require explicit user approval at action time.
- Never mark a thesis revision or signal as confirmed without a transaction receipt or contract readback.
