# Eva Protocol Go-To-Market Strategy

> GTM target: make Eva useful to a small set of public predictors, curator agents, and evidence
> builders before asking a wider audience to care.

## Positioning

Eva is a reputation layer for prediction and verification work. It turns a market take into an
inspectable record: thesis, evidence, source claims, odds context, counterarguments, and eventual
outcome history.

The short version:

- Prediction markets show the price.
- Eva shows the reasoning record and truth-status trail.
- `EvaTrustGraph` remembers who keeps being useful.

Eva should not launch as a real-money exchange. It should launch as an X-native prediction
reputation and evidence layer.

## Audience

Primary:

- Prediction-market traders who publish theses on X
- Builders working on agent identity and reputation
- Avalanche-native teams looking for practical agent workflows

Secondary:

- Researchers who want reusable claim bundles
- Curators who want a public reliability record
- Communities that debate markets, collectibles, protocol launches, public product releases, and macro events

## Messaging pillars

1. Market reasoning should be inspectable.
2. Claims should be reusable across theses, articles, and agents.
3. Reputation should follow the predictor or curator, not the post.
4. Eva does not need to execute trades to make market discourse more useful.
5. Market odds and truth status are different things.
6. ERC-8004 gives Eva the identity and reputation spine.

## Content program

Platform blog:

- What Eva Protocol is
- Why prediction reputation starts offchain
- How Eva uses Avalanche and `EvaTrustGraph`
- Why Eva does not execute trades in v1
- How curator onboarding works

Founder-approved X drafts:

- One concise explanation thread per shipped artifact
- One market-thesis example per week when there is a real example to share
- One curator/agent builder thread when onboarding has a clean path

Partner enablement:

- One-page curator brief
- Prediction-thesis example packet
- Integration notes for agent builders

## Launch loops

### Loop 1: Thesis page

1. Pick a real external market.
2. Publish a thesis with odds snapshot and evidence.
3. Share only after approval.
4. Track copy, counter, and return visits.
5. Resolve and archive the outcome state.

### Loop 2: Curator onboarding

1. Drive a qualified builder to `/curators/register`.
2. Measure wallet connect, preflight, approval need, broadcast, confirmation, and failure.
3. Fix the highest-dropoff state.
4. Repeat with a small group before broad promotion.

### Loop 3: Claim bundle

1. Convert a public argument into atomic claims.
2. Capture claim, deadline, resolution source, evidence, identity, conflicts, resolver, dispute
   window, and outcome.
3. Attach the bundle to one or more theses.
4. Reuse the bundle in future markets when the same claim matters.

## Status taxonomy

Use these labels consistently:

| Status | Meaning |
|---|---|
| `forecast` | A prediction has been made, but the resolution window has not closed. |
| `unresolved` | The claim or market cannot yet be judged from the accepted resolution source. |
| `verified` | The claim is supported by accepted evidence or resolution source. |
| `disputed` | Evidence, identity, resolver, or outcome is contested. |
| `resolved` | The outcome is final under the stated resolver and dispute window. |
| `void` | The event or claim should not resolve because the premise, market, or evidence became invalid. |

Copy must never imply that market odds are the same thing as truth status.

## V1 market-loading policy

The market desk can load open provider markets broadly so users can find the market they want to
discuss. For now, provider loading excludes sports markets.

Public examples, founder-approved X posts, and partner material should still prefer markets where
the resolution source is clear, the harm surface is limited, and the product can teach
evidence/reputation mechanics without becoming an incentive layer for bad behavior.

## Channel plan

| Channel | Use | Boundary |
|---|---|---|
| Website | Canonical product and docs surface | Must match production behavior. |
| Blog | Explain mechanics and boundaries | No fabricated metrics or testimonials. |
| X | Distribution and command surface | Public posts need approval. |
| Partner briefs | Direct outreach support | External outreach needs approval. |
| OpenClaw/Mission Control | Autonomous operating loop | State updates must stay decision-grade. |

## Scoreboard

Do not substitute vanity metrics for activation. Track:

- Weekly active predictors
- Published theses
- Evidence-backed theses
- Copy and counter actions
- Curator registration starts
- Curator registration completions
- Qualified inbound builder conversations

Until analytics access is confirmed, report these as unknown instead of estimating them.

## 30-day priorities

1. Confirm deploy ownership, env vars, storage, analytics, monitoring, and wallet gas.
2. Make curator onboarding measurable and explainable.
3. Publish a small set of platform blog posts.
4. Prepare founder-approved X drafts for each shipped artifact.
5. Use one concrete market thesis as the demonstration loop.

## Do-not-claim list

- Do not claim Eva is a live native prediction market.
- Do not present Eva as a real-money exchange.
- Do not claim Eva executes trades or custody funds.
- Do not claim x402 is enforced while `verifyApi.paymentRequired=false`.
- Do not describe x402 as in-scope before strict resource-bound verification exists.
- Do not claim verification-market modules are deployed while configured addresses are zero.
- Do not describe claim stake, challenge, or settlement actions as live until the product can prepare,
  sign, broadcast, confirm, and read back those actions.
- Do not claim user, revenue, volume, or retention numbers without live evidence.
- Do not claim public posts or outreach are autonomous without approval.
