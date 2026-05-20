# Eva Protocol Roadmap

> Roadmap for turning Eva into a prediction and verification reputation layer without overstating
> what is live today.

## Operating principles

- Ship one narrow trust or growth loop at a time.
- Keep `EvaTrustGraph` as the durable reputation primitive.
- Treat ERC-8004 as the identity and reputation spine.
- Treat prediction theses as offchain v1 objects until resolved outcomes are robust enough to
  promote into graph feedback.
- Do not launch v1 as a real-money exchange.
- Do not describe a feature as live unless the contract, API, frontend, deployment, and docs agree.
- Public posts, external outreach, deploy changes, token operations, and legal or financial claims
  need approval.

## Milestone 1: Launch truth and docs foundation

Goal: make the current product understandable and externally defensible before adding new scope.

Atomic tasks:

- Refresh architecture, README, and public docs around the current prediction-reputation boundary.
- Add business-plan and GTM docs that separate assumptions from measured data.
- Add platform blog posts explaining Eva without claiming traction or testimonials.
- Document the evaprotocol-ceo autonomy loop and cron/update guidance.
- Capture exact proposed OpenClaw agent-file changes without writing outside the repo.

Regression and unit checks:

- Check docs for live/future wording conflicts.
- Check `protocol.config.json` against docs for chain, addresses, market flags, and x402 status.
- Run TypeScript or lint checks for edited content sources when blog code changes.

Milestone 1 is not complete until wording regressions and content-source syntax bugs are fixed.

## Milestone 2: Conversion-ready curator onboarding

Goal: make curator activation measurable and usable before broad promotion.

Atomic tasks:

- Confirm the production deploy flow and serving deployment.
- Confirm required Vercel env vars for signing, verification, and durable storage.
- Confirm the agent wallet has enough AVAX for gas before live onchain writes.
- Add or verify onboarding analytics events for wallet connect, preflight, approval need,
  transaction broadcast, confirmation, and failure.
- Keep `/curators`, `/curators/register`, and `/curators/faq` copy aligned with actual backend
  behavior.

Regression and unit checks:

- Backend route tests for curator list, curator detail, registration preflight, trust reads, and
  verify.
- Frontend E2E for the curator registration happy path and visible failure states.
- Deployment smoke for `/`, `/curators`, `/curators/register`, `/api/curators`, `/api/verify`,
  `/api/trust/<address>`, and `/.well-known/agent.json`.

Milestone 2 is not complete until the app can distinguish "not ready to register" from "backend or
deployment broken."

## Milestone 3: Prediction thesis loop

Goal: make public market calls reusable, counterable, and measurable.

Atomic tasks:

- Stabilize market, thesis, predictor, and claim bundle data contracts.
- Add claim-bundle fields for claim, deadline, resolution source, evidence, identity, conflicts,
  resolver, dispute window, and outcome.
- Add status taxonomy across product and copy: `forecast`, `unresolved`, `verified`, `disputed`,
  `resolved`, and `void`.
- Separate market odds from truth status everywhere users inspect or copy a thesis.
- Support X-originated and web-originated thesis creation without requiring trade execution.
- Make copy and counter actions explicit about external-link-only behavior.
- Define resolution states and the boundary for promoting resolved outcomes into reputation.
- Prepare founder-approved X content templates that point to concrete thesis pages.

Regression and unit checks:

- Backend tests for market, thesis, predictor, X ingest, and copy-preview APIs.
- Frontend E2E for mobile market feed, thesis compose, market detail, predictor profiles, and copy
  or counter flows.
- Content review confirming no copy implies Eva executes trades or guarantees outcomes.
- Risk-policy review confirming v1 excludes elections, sports betting, war, assassination, criminal
  investigations, personal tragedies, and easily manipulable events.

Milestone 3 is not complete until a user can understand a thesis page, its evidence, and what Eva
does not do.

## Milestone 4: Evidence and verification depth

Goal: make verification outputs useful enough to support prediction arguments and curator trust.

Atomic tasks:

- Harden `POST /api/verify` response consistency and error states.
- Ensure report persistence is durable in production before relying on report links publicly.
- Link evidence, claims, articles, theses, and curator actions into one inspectable record.
- Decide whether x402 remains in scope; if yes, implement request verification before enforcing
  paid verification/API access.
- Bound x402 by resource limits, replay protection, request signing, and abuse controls before any
  paid-access launch.
- Document claim bundle semantics: evidence, dependency, contradiction, resolution, and provenance.

Regression and unit checks:

- Backend tests for verify, article list, article detail, storage provider behavior, and trust tags.
- E2E for verify and article detail pages.
- Smoke checks against production-like storage configuration.

Milestone 4 is not complete until a verification report can be retrieved after deploy/restart in
the intended production environment.

## Milestone 5: Additive market and reputation adapter

Goal: add native verification-market mechanics only after the thesis and verification loops prove
useful.

Atomic tasks:

- Deploy market and reputation-adapter modules as additive contracts, not replacements for
  `EvaTrustGraph`.
- Wire funding, staking, challenge, settlement, and reward claim flows behind rollout flags.
- Promote only durable resolved outcomes into reputation feedback.
- Publish operational playbooks for resolver, treasury, and dispute handling.

Regression and unit checks:

- Contract tests for funding, staking, settlement, challenge windows, reward claims, and adapter
  writes.
- Backend and frontend tests for rollout flags and disabled states.
- Security review before production activation.

Milestone 5 is not complete until disabled-state behavior is as well tested as enabled-state
behavior.

## Open gates

- Deploy ownership and serving-deployment truth
- Production env vars for signing, LLM/gateway, and storage
- Agent wallet gas funding
- Analytics and monitoring access
- Durable storage choice for verification reports
- Approval path for public posts and external outreach
