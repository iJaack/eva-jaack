---
name: eva-thesis
description: Create and update Eva evolving thesis posts with market and fact signals.
---

# Eva Thesis Skill

Use this when an agent needs to create, inspect, or revise an Eva thesis.

Canonical MCP and safety guide: `docs/MCP_AGENT_GUIDE.md`.

## Workflow

1. Search markets with the `search_markets` MCP tool.
2. Inspect existing theses with `get_thesis` before revising.
3. Create a new thesis preview with `create_thesis_draft`, including market and fact signals in the tool input.
4. Prepare updates with `prepare_revision_draft`; there is no live `record_revision` MCP tool.
5. Preserve market URLs, source URLs, signal weights, signal roles, and revision notes.
6. Treat MCP write outputs as `anchor_prepared_not_published` until the user approves the public publish path and a matching transaction is confirmed.
7. Never claim public publishing, protocol anchoring, or revision confirmation unless anchor status is `confirmed` via receipt or contract readback.
8. For final handoff text after draft prep, use `docs/AGENT_SAFE_OUTPUTS.md` for short updates or `docs/MCP_AGENT_HANDOFF_TEMPLATE.md` for full handoffs so the user sees the exact approval still needed before broadcast/public publish.

See `docs/MCP_AGENT_GUIDE.md` for schemas, allowed enums, and safe write boundaries.
See `docs/MCP_AGENT_ERROR_HANDLING.md` when a tool name, schema, credential, or output shape is unclear.

## Tool Recovery Rules

- Use only the live MCP allowlist: `search_markets`, `get_thesis`, `create_thesis_draft`, `prepare_revision_draft`, and `prepare_anchor_transaction`.
- If a prompt or client suggests `record_revision`, article/claim tools, curator tools, staking, challenge, settlement, paid-verification, or LLM-verification flows, treat that as stale scope.
- If an older anchor-prep output only returns transactions, still treat it as preparation only; it is not public publish support or confirmed anchoring.
- Never repair a schema error by dropping material source URLs, weights, roles, or revision notes.

## Safe Write Boundary

Agents may prepare drafts and anchor transactions. Agents may not silently publish, broadcast, trade, custody funds, run claims markets, or create article/blog posts under the narrowed Eva product scope.

## SpaceX IPO Example

Title: `SpaceX IPO liquidity rotation thesis`

Core idea: SpaceX IPO anticipation is absorbing speculative liquidity now; after the IPO path becomes explicit, risk markets can reprice as attention and liquidity rotate.

Useful signal classes:

- Core prediction market: SpaceX IPO timing.
- Lateral markets: risk appetite, private-market liquidity, Tesla/space-adjacent sentiment.
- Fact signals: tender offers, valuation reports, investor liquidity events, regulatory filings.
- Contradictions: delayed IPO signals, liquidity tightening, failed risk rotation.
