# Tasks

## Cutover

- [x] Remove old frontend routes outside the thesis product.
- [x] Remove old backend routes and services outside the thesis product.
- [x] Remove old contracts and generated ABIs outside `EvaThesisProtocol`.
- [x] Update smoke checks to the thesis surface.
- [x] Rewrite canonical docs around the thesis product.

## Identity And Wallets

- [x] Choose X plus embedded-wallet provider: Dynamic.
- [x] Add provider-backed auth to compose.
- [x] Add E2E coverage for external wallet and embedded wallet paths.
- [x] Add spoofing checks for author identity payloads.

## Thesis Evolution

- [x] Add revision creation UI.
- [x] Add closed-prediction/fact resolution UI.
- [x] Add timeline filters.
- [x] Add tests for immutable revisions and score snapshots.

## Agent Readiness

- [x] Expand MCP tests for prepare-first thesis and revision drafts.
- [x] Add agent onboarding skill examples.
- [x] Add bounded write policy for agent-created thesis drafts.
- [x] Add SpaceX thesis dry-run script documentation.

## Deployment

- [x] Run full local checks.
- [x] Run browser screenshot QA on desktop and mobile.
- [x] Add read-only deployer confirmation preflight.
- [x] Run production smoke after deploy.
- [x] Confirm deployer before any new deployment or anchor transaction. Current evidence: `pnpm confirm:deployer -- --deployer 0x0fe61780bd5508b3C99e420662050e5560608cA4` returned `status: "ok"` with the read-only boundary on 2026-06-26.
