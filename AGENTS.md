# AGENTS.md - Eva Protocol Repo

## Token optimizer

`rtk` is installed globally. Prefix CLI reads with `rtk` when possible:

```bash
rtk git status
rtk git diff
rtk rg "pattern" docs frontend
rtk cat docs/ARCHITECTURE.md
rtk ls docs
```

Exceptions:

- Do not prefix package-manager or build commands such as `pnpm install`, `pnpm build`,
  `pnpm --filter frontend typecheck`, `npm install`, `npm run`, or `cargo build`.
- Do not prefix `rtk` commands themselves.
- Do not prefix interactive commands.

## Ownership boundaries

This repo can be live with parallel work in progress. Do not revert user or other-agent changes.

Default editable scope for docs/content/autonomy work:

- `docs/**`
- `README.md`
- root `AGENTS.md`
- agent onboarding docs and MCP skill docs

Avoid edits to frontend behavior, backend behavior, contracts, generated files, package manifests,
or lockfiles unless the user explicitly assigns that scope.

## Source of truth

- Runtime constants live in `protocol.config.json`.
- Current product boundary lives in `docs/ARCHITECTURE.md`.
- Roadmap and milestone gates live in `docs/ROADMAP.md`.
- GTM and business claims must not invent metrics, testimonials, users, revenue, or deployment
  truth.

## Planning rule

When devising a plan, organize it in milestones composed of atomic tasks. Add regression and unit
tests at the end of each milestone. A milestone is not finished until regressions and bugs found by
those checks are fixed.

## Code review graph

`code-review-graph` may be available through `rtk`. For large reviews, refactors, or debugging,
prefer graph orientation before broad file reads:

```bash
rtk code-review-graph build --repo /Users/jaack/Desktop/Github/eva-jaack
rtk code-review-graph update --repo /Users/jaack/Desktop/Github/eva-jaack
```

## External OpenClaw agent files

Files under `/Users/jaack/clawd/companies/eva-protocol/agent` are outside this workspace. Inspect
them read-only unless the user grants explicit write approval. Proposed updates should be captured
in `docs/autonomy/OPENCLAW_AGENT_PROPOSED_CHANGES.md`.

## Cursor Cloud specific instructions

The VM update script already runs `pnpm install` + `pnpm sync:abi`. Standard commands live in
`README.md` (Quick Start / Checks) and each package's `package.json`; prefer those. Notes below are
the non-obvious caveats.

### Services

- **Backend** (Hono API): `pnpm --filter backend dev` → `http://127.0.0.1:3001`. Serves `/api/*`,
  `/health`, `/.well-known/agent.json`, and `/api/mcp`.
- **Frontend** (Next.js): `pnpm --filter frontend dev` → `http://127.0.0.1:4281`. In dev it proxies
  `/api/*`, `/.well-known/*`, and `/health` to the backend, so start the backend first.
- Start long-running dev servers in `tmux`, not as one-shot background jobs.

### Caveats (non-obvious)

- **Markets work offline.** Live market data comes from Polymarket/Kalshi with a ~4.5s timeout and
  graceful fallback to seeded in-memory markets, so the UI is fully usable without outbound network.
- **Storage is local by default.** Theses persist to `.data/eva-predictions/index.json` (no external
  DB needed locally). `/health` reports the active storage mode.
- **Compose editor is gated by default.** Until a self-custodial browser wallet and public X handle
  are present, `/compose` shows an identity gate. For local UI work without a wallet, run the frontend with `NEXT_PUBLIC_COMPOSE_PREVIEW_IDENTITY=1`
  (dev-only; ignored in production) to load the editor with a preview identity.
- **The built-in compose preview identity cannot complete `Prepare anchor` against the real backend.**
  It uses the Eva wallet (`0x0fe6…08cA4`), which already authored the seeded SpaceX thesis, so the
  backend rejects it with `Identity payload conflicts with an existing thesis author`. To exercise
  the real draft-anchor route, use a wallet/handle that is not the seeded author (e.g. via
  `POST /api/thesis-drafts/protocol/prepare-anchor` with a distinct checksummed `walletAddress`).
- **`POST /api/theses`** (publish) requires a real on-chain anchor tx hash that the backend verifies
  on Avalanche; it is not reachable in a keyless local dev flow. The agent-safe boundary stops at
  draft/revision preview + anchor calldata preparation.
- **Contracts need Foundry.** `forge` is not part of the pnpm install; install Foundry
  (`foundryup`) before `pnpm --filter contracts test`. It is only needed for the Solidity workspace.
- **Playwright e2e starts its own dev server** on port 4281 and uses injected EIP-1193 test providers
  inside the wallet-specific specs. It uses `reuseExistingServer` when not in CI. Stop any
  manually-started frontend on 4281 first, or it may reuse stale code.
  Browsers install via `pnpm --filter frontend exec playwright install --with-deps chromium`.
