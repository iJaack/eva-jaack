# Eva Protocol Business Plan

> This plan is intentionally evidence-conservative. It names the wedge, customer, risks, and
> scoreboards without inventing user counts, revenue, testimonials, or market traction.

## Thesis

Eva turns public market reasoning and source verification into durable reputation. The first
commercial wedge is not a generic news product. It is a reputation layer for people and agents who
already publish prediction-market takes, claim bundles, and evidence trails in public.

## Product

Eva combines six primitives:

- Markets: external venues and questions that anchor a prediction.
- Theses: a user's outcome call, odds snapshot, rationale, and evidence.
- Evidence: source URLs, extracted claims, verification reports, and provenance.
- Profiles: predictor and curator records that separate graph-backed trust from app-derived
  market history.
- Trust graph: `EvaTrustGraph` on Avalanche, the long-lived identity and reputation primitive.
- ERC-8004: the identity and reputation spine that lets agents and wallets carry durable records.

The v1 product does not execute trades, custody assets, take bets, or run a native prediction
market. Eva should not launch as a real-money exchange. It creates a public record around claims and
predictions first.

## Customer segments

| Segment | Problem | Eva wedge |
|---|---|---|
| Prediction-market traders | Good calls disappear into social feeds. | Public thesis pages and predictor records. |
| Agent builders | Agents need inspectable memory and reputation. | Curator and predictor identity linked to trust graph state. |
| Researchers and analysts | Claim provenance is scattered across posts, articles, and markets. | Reusable claim bundles with evidence and resolution history. |
| Avalanche ecosystem teams | Onchain agent activity needs practical use cases. | Trust graph, curator stake, and prediction reputation on Avalanche. |

## Value proposition

- For predictors: publish calls that can be tracked, copied, countered, and reviewed.
- For curators: stake behind sources and build a visible reliability record.
- For readers: inspect why a market is mispriced without hunting through feeds.
- For agents: attach work to durable identity and reputation rather than disposable sessions.

## Business model candidates

These are candidates, not active revenue claims:

- Curator staking utility through `$EVA`, once onboarding is production-ready.
- Paid verification or premium evidence reports, only after request verification and payment
  enforcement are implemented honestly.
- Partner workflows for teams that need claim bundles, market explainers, or reputation dashboards.
- Future protocol fees from additive verification-market modules if those modules are deployed and
  adopted.

x402 is not a near-term growth claim. It is only appropriate for paid verification or API access
after strict resource-bound request verification exists.

## Go-to-market wedge

The first GTM loop should start with people who already argue about probabilities in public:

1. Turn a market argument into a clean Eva thesis page.
2. Attach evidence and a reusable claim bundle.
3. Share it through founder-approved X distribution.
4. Let other users copy, counter, or inspect the call.
5. Resolve outcomes and update predictor/curator reputation when the promotion boundary is ready.

This creates a useful artifact even before native settlement exists.

## Scoreboard

Current unknowns should stay unknown until analytics and production truth are confirmed.

Primary scoreboard:

- Weekly active predictors
- Published theses per week
- Thesis pages with at least one evidence source
- Copy or counter actions
- Curator registration starts
- Curator registration completions

Readiness scoreboard:

- Production deploy owner confirmed
- Required env vars confirmed
- Agent wallet funded for gas
- Durable report storage confirmed
- Analytics events visible in logs or dashboard
- Monitoring/error reporting visible to the operator

## Risks

- Messaging risk: overclaiming native market or x402 behavior before it is live.
- Infrastructure risk: local or serverless storage is not durable enough for public report links.
- Category risk: loading provider markets broadly can expose sensitive topics. Sports markets stay
  excluded for now, and public examples should still use clear resolution sources and limited harm
  surfaces.
- Activation risk: curator onboarding may fail if wallet, agent ID, stake, allowance, or gas states
  are unclear.
- Distribution risk: content can be drafted autonomously, but public posting still requires
  approval.
- Scope risk: rebuilding a trading venue too early would distract from the reputation wedge.

## Near-term operating plan

- Keep docs and public copy synchronized with `protocol.config.json` and production behavior.
- Use platform blog posts to explain Eva's boundaries and invite the right early users.
- Make curator onboarding measurable before scaling outreach.
- Use prediction theses and claim bundles as the first repeatable public artifact.
- Require claim bundles to capture claim, deadline, resolution source, evidence, identity,
  conflicts, resolver, dispute window, and outcome.
- Add native market and payment mechanics only after the reputation loop proves useful.
