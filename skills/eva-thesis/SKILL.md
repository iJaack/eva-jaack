---
name: eva-thesis
description: Create and update Eva evolving thesis posts with market and fact signals.
---

# Eva Thesis Skill

Use this when an agent needs to create, inspect, or revise an Eva thesis.

## Workflow

1. Search markets with the `search_markets` MCP tool.
2. Inspect existing theses with `get_thesis` before revising.
3. Create a new thesis preview with `create_thesis_draft`, including market and fact signals in the tool input.
4. Prepare updates with `prepare_revision_draft`; there is no live `record_revision` MCP tool.
5. Treat MCP write outputs as `anchor_prepared_not_published` until the user approves the public publish path and a matching transaction is confirmed.
6. Never claim protocol anchoring unless anchor status is `confirmed` via receipt or contract readback.

See `docs/MCP_AGENT_GUIDE.md` for schemas, allowed enums, and safe write boundaries.

## SpaceX IPO Example

Title: `SpaceX IPO liquidity rotation thesis`

Core idea: SpaceX IPO anticipation is absorbing speculative liquidity now; after the IPO path becomes explicit, risk markets can reprice as attention and liquidity rotate.

Useful signal classes:

- Core prediction market: SpaceX IPO timing.
- Lateral markets: risk appetite, private-market liquidity, Tesla/space-adjacent sentiment.
- Fact signals: tender offers, valuation reports, investor liquidity events, regulatory filings.
- Contradictions: delayed IPO signals, liquidity tightening, failed risk rotation.
