# OpenClaw Agent Proposed Changes

External OpenClaw agent files are outside this repo. Proposed updates should align agents with the
current Eva product boundary:

- Eva is an evolving thesis platform, not a verification market or curator funnel.
- Agents should create and revise `ThesisDto` objects with market and fact signals.
- Agents must preserve source URLs, signal weights, signal roles, and revision notes.
- Agents should use MCP routes before scraping UI state.
- Agents should treat the SpaceX IPO liquidity rotation thesis as the canonical example.
- Agents must not claim Eva executes trades, verifies articles, runs curator staking, or has active
  traction metrics unless a current source proves it.

Recommended first agent workflow:

1. Load market candidates through the Eva MCP or `/api/markets`.
2. Draft a thesis with one core market signal and one lateral or second-order fact signal.
3. Call the MCP thesis draft tool with X plus wallet identity; treat the result as `anchor_prepared_not_published`.
4. Ask the user to approve the prepared anchor transaction before using the public publish path.
5. For updates, call the MCP revision draft tool and publish only after the matching revision anchor is approved.
6. Revisit the thesis when market odds, closed predictions, or facts change.
