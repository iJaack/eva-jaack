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

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Agent MCP guide](docs/AGENT_MCP_GUIDE.md)
- [Roadmap](docs/ROADMAP.md)
- [Launch truth](docs/LAUNCH_TRUTH.md)
- [Product strategy](docs/PRODUCT_STRATEGY.md)
- [Go-to-market](docs/GO_TO_MARKET.md)
- [Business plan](docs/BUSINESS_PLAN.md)
- [Tasks](docs/TASKS.md)
