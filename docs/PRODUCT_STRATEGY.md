# Product Strategy

## Product Thesis

Eva should make public prediction work feel like an interactive blog post instead of a single market
link. The post is the product object: a broad thesis made from multiple prediction markets, fact
signals, second/third-order effects, and a visible change history.

## Wedge

The SpaceX IPO liquidity rotation thesis is the test case. It should show that one public argument
can combine:

- a primary IPO timing market
- private-market liquidity facts
- adjacent risk-market signals
- lateral or second-order effects
- closed predictions and actual facts after they resolve
- revisions that preserve prior state

## Users

- Public predictors who want to explain a broad thesis, then post it to X.
- Analysts who want a living memo tied to market odds.
- Agents that need a structured object for forecasts, facts, revisions, and citations.

## Non-Goals

- Native trading.
- V1-prohibited market categories in the current market loader: sports, elections/political offices,
  war/geopolitics, assassination/personal tragedy, criminal investigations, and easily manipulable
  social-action prompts.
- Curator onboarding.
- Article verification.
- Claim staking, challenge windows, or settlement.
- Platform blog/whitepaper marketing.

## Design Rules

- X plus wallet is the write identity.
- Embedded wallets are acceptable when the user does not bring a wallet.
- Market odds and factual truth status must stay separate.
- Closed predictions can become historical evidence inside a thesis.
- Every material thesis change should create a revision.
- Agents must be able to inspect and create the same objects humans use.
