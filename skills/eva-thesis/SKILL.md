---
name: eva-thesis
description: Create and update Eva evolving thesis posts with market and fact signals.
---

# Eva Thesis Skill

Use this when an agent needs to create, inspect, or revise an Eva thesis.

## Workflow

1. Search markets with the `search_markets` MCP tool.
2. Create the thesis draft with `create_thesis_draft`.
3. Add market and fact signals through the Eva app/API when available.
4. Record revisions with `record_revision` whenever the thesis body or signal interpretation changes.
5. Never claim protocol anchoring unless anchor status is `confirmed`.

## SpaceX IPO Example

Title: `SpaceX IPO liquidity rotation thesis`

Core idea: SpaceX IPO anticipation is absorbing speculative liquidity now; after the IPO path becomes explicit, risk markets can reprice as attention and liquidity rotate.

Useful signal classes:

- Core prediction market: SpaceX IPO timing.
- Lateral markets: risk appetite, private-market liquidity, Tesla/space-adjacent sentiment.
- Fact signals: tender offers, valuation reports, investor liquidity events, regulatory filings.
- Contradictions: delayed IPO signals, liquidity tightening, failed risk rotation.
