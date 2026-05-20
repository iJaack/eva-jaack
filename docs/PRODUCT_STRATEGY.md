# Eva Protocol Product Strategy

> Strategy inputs from the completed research pass, converted into product rules for docs, blog,
> GTM, and autonomy work.

## Strategic decision

Eva should not launch as a real-money exchange. V1 should be an X-native prediction reputation and
evidence layer.

The product should help users:

- Turn market arguments into structured theses.
- Attach reusable claim bundles and evidence.
- Separate market odds from truth status.
- Build predictor and curator reputation through ERC-8004-linked identity.
- Resolve outcomes with explicit sources and dispute windows.

## Claim bundle schema

Every structured claim bundle should be able to express:

- claim
- deadline
- resolution source
- evidence
- identity
- conflicts
- resolver
- dispute window
- outcome

The bundle can start offchain. Promotion into reputation should happen only after resolution and an
explicit adapter boundary.

## Status taxonomy

Use these statuses in product copy and docs:

- `forecast`
- `unresolved`
- `verified`
- `disputed`
- `resolved`
- `void`

Market odds are a price signal. They are not a truth status.

## V1 risk policy

Avoid these categories in v1:

- elections
- sports betting
- war
- assassination
- criminal investigations
- personal tragedies
- easily manipulable events

The first examples should use clear resolution sources, limited harm surfaces, and events where
evidence quality matters more than spectacle.

## x402 boundary

x402 should be reserved for paid verification or API access after strict resource-bound request
verification exists.

Do not enforce or market x402 until the system can prove:

- request authenticity
- replay protection
- resource limits
- abuse controls
- predictable failure states
- honest user-facing payment metadata

## Identity spine

ERC-8004 is the identity and reputation spine. Eva app records may start with X identity or app
identity, but durable trust should connect back to ERC-8004 where possible.

## Copy rules

- Say "market odds" when discussing price or implied probability.
- Say "truth status" only when discussing evidence or resolution state.
- Do not call an unresolved forecast true or false.
- Do not imply Eva places trades, takes bets, or custodies funds.
- Do not imply a resolved market is identical to verified truth if the resolution source is weak.
