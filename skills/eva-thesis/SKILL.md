---
name: eva-thesis
description: Create and update Eva evolving thesis posts with market and fact signals.
---

# Eva Thesis Skill

Use this when an agent needs to create, inspect, or revise an Eva thesis.

Canonical MCP and safety guide: `docs/AGENT_MCP_GUIDE.md`.

## Workflow

1. Search markets with the `search_markets` MCP tool.
2. Inspect existing context with `get_thesis` when revising.
3. Prepare the thesis draft with `create_thesis_draft`, or prepare an update with `prepare_revision_draft`.
4. Preserve market URLs, source URLs, signal weights, signal roles, and revision notes.
5. Treat `publishState: "anchor_prepared_not_published"` as draft/anchor-prep only.
6. Never claim public publishing or protocol confirmation unless a user-approved transaction has a receipt or contract readback.

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
