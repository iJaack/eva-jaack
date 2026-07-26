# Eva Protocol Roadmap

## Milestone 1: Thesis Product Cutover

Goal: remove every public and runtime surface that is not part of evolving market theses.

Atomic tasks:

- Keep only home, markets, market detail, compose, thesis detail, predictors, and predictor detail.
- Keep only market, thesis, predictor, X ingest, copy preview, thesis anchor, MCP, health, and agent manifest APIs.
- Keep only `EvaThesisProtocol` in contracts and generated ABIs.
- Rewrite README, architecture, launch truth, roadmap, and smoke checks around the thesis product.
- Preserve the SpaceX IPO liquidity rotation thesis as the proof object.

Checks and regressions:

- Backend typecheck and unit tests.
- Frontend typecheck and E2E tests for navigation, market loading, compose, thesis detail, and predictors.
- Contract tests for thesis creation, signal anchoring, revisions, and deployment config.
- Browser screenshots for desktop and mobile layouts.
- Text scan for removed routes and product claims.

Milestone 1 is not complete until discovered regressions are fixed.

## Milestone 2: Identity And Wallet Readiness

Goal: make X plus wallet connection production-ready without changing the thesis data model.

Atomic tasks:

- Select auth/wallet provider for X login plus embedded wallet creation.
- Prefer free or generous-start providers first; evaluate Privy, Dynamic, Web3Auth, and Coinbase Developer Platform.
- Map provider user IDs into `ThesisAuthorDto.dynamicUserId`.
- Support both injected wallets and embedded wallets.
- Add explicit wallet-source display and failure states.

Checks and regressions:

- Unit tests for identity validation and author normalization.
- Frontend E2E for external wallet, embedded wallet, missing X, missing wallet, and wrong-chain states.
- Browser screenshots for connected and disconnected compose states.
- Security review for identity spoofing and wallet-source trust boundaries.

Milestone 2 is not complete until invalid identity states cannot publish.

## Milestone 2B: $EVA Core Chain Context

Goal: make the canonical `$EVA` token an inspectable platform primitive without inventing inactive
economic utility.

Atomic tasks:

- Add the `$EVA` contract to shared runtime configuration and the agent manifest.
- Add a first-class `/eva` route with live ERC-20 metadata and holder balance readback.
- Attach read-only `$EVA` holder state to wallet/author context in compose.
- Keep holder balance separate from publishing rights, credibility, and thesis scoring.

Checks and regressions:

- Unit tests for the canonical Avalanche address and bounded manifest capabilities.
- Live Avalanche readback for name, symbol, decimals, total supply, and wallet balance.
- Desktop and mobile browser checks for the token receipt and signed-out wallet state.
- Text scan preventing unsupported staking, gating, yield, governance, or trading claims.

Milestone 2B is not complete until live chain state and visible product copy agree.

## Milestone 2C: `$EVA` Platform Use And Burn Receipts

Goal: let holders consume canonical `$EVA` for inspectable platform uses without promising a market
outcome or misreporting legacy token supply.

Atomic tasks:

- Deploy immutable `EvaUsageBurner` against canonical `$EVA`.
- Support thesis-proof, forecast-receipt, and agent-verification usage references.
- Transfer approved `$EVA` atomically to the irrecoverable `0xdead` sink and emit a receipt.
- Add exact-amount approval and use/burn controls to `/eva`.
- Require exact wallet/action/resource-bound receipts for public thesis and revision release.
- Add direct-allowance quote and paid proof-bundle tools for agents without Permit2.
- Disclose that circulating supply falls while legacy `totalSupply()` remains unchanged.
- State that demand and supply pressure do not guarantee price appreciation.

Checks and regressions:

- Contract tests for allowance enforcement, minimum amount, duplicate references, receipt totals,
  dead-sink balances, and unchanged legacy total supply.
- Live Avalanche deployment receipt, immutable token/sink getters, and runtime code hash.
- Backend/frontend manifest parity and deployment-smoke validation.
- Desktop/mobile E2E for disconnected and connected burn states.
- Security tests for wrong wallet, action, amount, reference, burner, sink, and replayed resource.

Milestone 2C is not complete until the onchain receipt, chain readback, UI copy, and manifests agree.

## Milestone 3: Agent-Ready Thesis Creation

Goal: let agents create, revise, inspect, and anchor theses safely.

Atomic tasks:

- Stabilize MCP tool schemas for thesis creation, revision, market lookup, predictor lookup, and anchor preparation.
- Add an Eva onboarding skill for agent developers.
- Document required fields, source discipline, signal roles, and revision notes.
- Add deterministic examples using the SpaceX IPO thesis.
- Add bounded write permissions for agents.

Checks and regressions:

- MCP schema validation tests.
- Backend route tests for all agent-facing endpoints.
- Dry-run agent workflow that creates a thesis draft and prepares anchor calldata.
- Text scan to ensure agents do not receive stale curator/verification instructions.

Milestone 3 is not complete until a new agent can onboard from docs and create a valid thesis object.

## Milestone 4: Thesis Evolution And History

Goal: make changing markets and facts visibly evolve the interactive post.

Atomic tasks:

- Add revision creation UI.
- Add closed-market and resolved-fact signal states.
- Add score deltas by revision.
- Add timeline filters for created, revised, signal updated, anchored, and resolved.
- Add share text that points to the current thesis while preserving history.

Checks and regressions:

- Unit tests for revision immutability and score snapshots.
- Frontend E2E for creating and viewing revisions.
- Browser screenshots of initial and revised thesis states.
- Regression checks that prior revision bodies and signal snapshots cannot be overwritten.

Milestone 4 is not complete until history is inspectable and immutable.

## Milestone 5: Production Deployment And First Thesis Ops

Goal: publish the narrowed product and operate the SpaceX IPO thesis as the first canonical post.

Atomic tasks:

- Run full local checks.
- Run deployment smoke against the target URL.
- Confirm deployer wallet before any transaction requiring approval.
- Publish or update the SpaceX IPO thesis from the same deployer wallet.
- Verify the live thesis page, anchor status, and explorer links.

Checks and regressions:

- Production smoke for home, markets, SpaceX market, SpaceX thesis, predictors, health, and agent manifest.
- Browser screenshots against production desktop and mobile.
- Contract readback for `EvaThesisProtocol`.
- UUPS implementation-slot and protocol-version readback after any upgrade.
- Final text scan for removed old-product claims.

Milestone 5 is not complete until the deployed app and onchain/source-of-truth data agree.
