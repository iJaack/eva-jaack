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
3. Call thesis creation with X plus wallet identity.
4. Prepare anchor transactions only after the user confirms the deployer/wallet.
5. Revisit the thesis when market odds, closed predictions, or facts change.
