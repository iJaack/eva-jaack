# Launch Truth

## Live

| Area | Status |
|---|---|
| Site URL | `https://eva.jaack.me` |
| Chain | Avalanche C-Chain (`43114`) |
| Eva wallet | `0x0fe61780bd5508b3C99e420662050e5560608cA4` |
| Eva agent ID | `1599` |
| Thesis protocol | `0x5eDBd1eea3228662326e60634E53AB8975D6641c` |
| First thesis | SpaceX IPO liquidity rotation thesis |
| Market policy | V1 provider markets filtered against `docs/MARKET_POLICY.md` |

## Current Product Claims

Eva can claim:

- it creates and displays evolving thesis posts
- theses combine prediction-market and fact signals
- thesis revisions preserve history
- the app prepares thesis anchor transactions
- the deployed thesis protocol exists on Avalanche
- the app has MCP/agent-facing thesis tools

Eva should not claim:

- native trade execution
- guaranteed prediction accuracy
- live sports coverage
- curator onboarding
- article verification
- claim staking or settlement
- x402 payment enforcement
- traction, revenue, testimonials, or active user counts without measurement

## Launch Checks

- Home, markets, compose, thesis detail, predictors, and health routes load.
- `/compose` requires Dynamic identity before the mutable editor renders. If Dynamic is not configured, the route must show a read-only auth/configuration gate, not the seeded preview author, wallet, ready-to-publish state, source selector, or draft editor.
- `/api/runtime-readiness` must report `authoring.ready=true` and `authoring.composeGate="user_connect"` before launch authoring is considered ready; it must not leak the Dynamic environment ID.
- Final launch-authoring smoke must run with `SMOKE_REQUIRE_DYNAMIC_AUTH=true`; that mode fails while `/api/runtime-readiness` reports missing Dynamic configuration or a non-`user_connect` authoring gate, and passes only once production serves the Dynamic user-connect gate.
- `/verify`, `/claims`, `/curators`, `/blog`, and `/whitepaper` are absent.
- SpaceX thesis page shows market signals, fact signals, revision history, and anchor status.
- Agent manifest and MCP endpoint respond.
- Contract deployment config matches `protocol.config.json`.
