# Eva Protocol

Eva is an X-native thesis platform for public predictions. A user connects X plus a wallet, writes
an interactive thesis, attaches prediction-market and fact signals, and keeps a visible revision
history as those signals change.

The first proof object is the SpaceX IPO liquidity rotation thesis: one evolving post that combines
IPO timing markets, private-liquidity facts, and second/third-order market effects.

Eva does not custody funds, execute trades, or run a native prediction exchange in this product
version. It loads broad prediction markets while excluding sports for now, records thesis/copy
intent, and anchors thesis state to Avalanche through `EvaThesisProtocol`.

## Monorepo

- `frontend/` - Next.js app for markets, compose, thesis pages, and predictor records
- `backend/` - Hono API for markets, theses, predictors, X ingest, MCP, and thesis anchor prep
- `contracts/` - Foundry workspace containing `EvaThesisProtocol`
- `docs/` - product boundary, roadmap, launch truth, and agent onboarding notes
- `protocol.config.json` - shared site, chain, agent, and thesis-protocol source of truth

## Live Constants

- Site: `https://eva.jaack.me`
- Chain: Avalanche C-Chain (`43114`)
- Eva agent ID: `1599`
- Eva wallet: `0x0fe61780bd5508b3C99e420662050e5560608cA4`
- Thesis protocol: `0x5eDBd1eea3228662326e60634E53AB8975D6641c`

## API Surface

- `GET /api/prediction-summary`
- `GET /api/markets` and `GET /api/markets/:marketId`
- `GET /api/theses` and `GET /api/theses/:thesisId`
- `POST /api/theses`
- `GET /api/predictors` and `GET /api/predictors/:id`
- `POST /api/x/ingest`
- `POST /api/copy-preview`
- `POST /api/thesis-anchor/prepare`
- `GET /api/mcp`
- `GET /.well-known/agent.json`
- `GET /health`

## Agent MCP Boundary

README API surface is not an agent permission map. Agents that need to create or revise theses
should start with `docs/MCP_AGENT_QUICKSTART.md`, then use only the five live MCP tools documented
there: `search_markets`, `get_thesis`, `create_thesis_draft`, `prepare_revision_draft`, and
`prepare_anchor_transaction`.

`POST /api/theses`, `POST /api/thesis-anchor/prepare`, and other production write routes are
app/runtime surfaces, not default agent publish powers. Agent-safe MCP work stops at draft/revision
preview and anchor calldata preparation unless a separate approved execution path returns approval,
write receipt, and readback evidence.

## Quick Start

```bash
pnpm install
pnpm sync:abi
pnpm --filter backend dev
pnpm --filter frontend dev
```

## Checks

```bash
pnpm --filter backend typecheck
pnpm --filter backend test
pnpm --filter frontend typecheck
pnpm --filter frontend test
pnpm --filter contracts test
```

Before any deployment or anchor transaction, run the read-only deployer preflight with the wallet the operator intends to use:

```bash
pnpm confirm:deployer -- --deployer 0x0fe61780bd5508b3C99e420662050e5560608cA4
```

It only compares wallet identity against `protocol.config.json`; it does not load keys, sign, deploy, call Eva APIs, or broadcast transactions.

For final launch-authoring smoke, require Dynamic auth to be configured on `/compose`:

```bash
SMOKE_BASE_URL=https://eva.jaack.me SMOKE_REQUIRE_DYNAMIC_AUTH=true pnpm smoke:deploy
```

That strict mode fails if production is still serving the Dynamic configuration gate instead of the user-connect gate.

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [MCP agent quickstart](docs/MCP_AGENT_QUICKSTART.md)
- [MCP agent guide](docs/MCP_AGENT_GUIDE.md)
- [MCP agent error handling](docs/MCP_AGENT_ERROR_HANDLING.md)
- [Agent-safe output contracts](docs/AGENT_SAFE_OUTPUTS.md)
- [Roadmap](docs/ROADMAP.md)
- [Launch truth](docs/LAUNCH_TRUTH.md)
- [Product strategy](docs/PRODUCT_STRATEGY.md)
- [Go-to-market](docs/GO_TO_MARKET.md)
- [@evapredicts prediction memory campaign](docs/EVAPREDICTS_PREDICTION_MEMORY_CAMPAIGN.md)
- [@evapredicts AI forecast receipts campaign](docs/EVAPREDICTS_AI_FORECAST_RECEIPTS_CAMPAIGN.md)
- [Business plan](docs/BUSINESS_PLAN.md)
- [Tasks](docs/TASKS.md)
