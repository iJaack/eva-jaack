# Eva UX Rulebook

This rulebook governs Eva's product experience. It is written for designers, frontend engineers, and agents that modify the app.

## Prime Directive

Eva is for publishing evolving theses from prediction markets and facts. The user should always know:

- what thesis they are writing or reading,
- which signals support it,
- what changed over time,
- what is sourced,
- what is anchored,
- what can be shared.

## Compose Flow

Milestone UX:

1. Draft
   User writes the thesis title and body.

2. Add sources
   User selects prediction markets, facts, closed predictions, and second-order effects.

3. Insert and cite
   User inserts source blocks into the post or keeps them as supporting signals.

4. Preview
   User sees the public post exactly as readers will see it.

5. Validate
   Eva checks missing identity, missing wallet, invalid source URLs, empty body, unsourced facts, unsupported outcomes, and missing anchor preparation.

6. Anchor
   Eva prepares the protocol anchor and requires the wallet approval path before the draft can become public.

7. Publish
   Eva stores the anchored thesis and creates revision 1.

8. Share
   Eva produces X-native copy and a durable thesis URL.

## Required Compose States

- Empty draft.
- Draft with title only.
- Draft with body only.
- Draft with one prediction signal.
- Draft with multiple prediction signals.
- Draft with prediction plus fact signal.
- Draft with unsupported/manual signal.
- Private draft saved.
- Identity missing.
- Wallet missing.
- Anchor missing.
- Anchor prepared.
- Publish pending.
- Publish failed.
- Published successfully.

No state may collapse into a generic spinner or generic error.

## Signal Rules

Signals are source material. They can be:

- inserted into the article body,
- attached as supporting evidence,
- weighted,
- resolved or closed later,
- referenced by revisions.

Prediction-market signal UX must show:

- market title,
- provider,
- selected outcome,
- current probability,
- status,
- source URL,
- role and weight.

Fact signal UX must show:

- claim text,
- source URL if present,
- verification status,
- role and weight.

Do not present facts as verified unless verification actually happened.

## Thesis Detail Rules

The thesis detail page must answer:

- What is the thesis?
- Who wrote it?
- What signals support it?
- What has changed since it was published?
- Which parts are source-backed?
- Is anything anchored onchain?
- Can I counter, copy, or follow this thesis?

The page should read like an article with evidence, not like a record-detail admin page.

## Market Discovery Rules

Market discovery is for finding source material, not placing trades.

Rules:

- Exclude sports until the product explicitly supports them.
- Make search and category filtering fast.
- Show probability, volume/liquidity, provider, and close/resolution status.
- Provide a direct path from market to compose.
- Make "use in thesis" more important than "trade".

## Predictor Record Rules

Predictor pages are credibility records.

Rules:

- Show X handle, linked wallet state, authored theses, copied theses, and challenges.
- Avoid fake ranking unless ranking methodology is explicit.
- Separate activity from performance.
- Make unresolved thesis count clear.

## Revision History Rules

Revision history is the product's trust layer.

Every revision needs:

- timestamp,
- author,
- body summary,
- signal snapshot,
- score before/after,
- anchor state,
- source changes.

Readers must be able to compare revisions without losing the current thesis.

## Agent UX Rules

Agent-facing UX must be explicit and machine-readable.

Rules:

- Use stable labels for source blocks and publish states.
- Keep source URLs visible in DOM text or structured API fields.
- Do not require agents to infer semantic state from color.
- Publish actions must distinguish draft creation from onchain anchoring.
- Agent-generated drafts must expose source discipline before publish.

## Copy Rules

Use plain product language:

- "thesis", "source", "signal", "revision", "anchor", "publish".
- "market priced at 24%" instead of "0.24 implied odds" unless in advanced mode.
- "Fact not verified yet" instead of "unverifiable_yet" in user-facing copy.

Avoid:

- "revolutionize",
- "seamless",
- "next-gen",
- "truth layer",
- "trustless claims",
- "AI-powered" unless the exact agent behavior is visible.

## Interaction Rules

- Inserting a signal must update the draft immediately.
- Removing a signal must ask only if it would delete body text, not if it only detaches metadata.
- Publish must be disabled with a visible reason, not silently inactive.
- Publishing must stay disabled until anchor preparation succeeds.
- Source selection should use real outcomes from the selected market, not free text.
- Long market names must truncate in controls but expand in source cards.
- Mobile users must be able to switch between Write, Sources, Preview, and History without losing scroll position.

## Visual QA Checklist

Each milestone that changes UI must check:

- desktop viewport,
- mobile viewport,
- no horizontal overflow,
- long title,
- long market title,
- missing market data,
- no fact source URL,
- connected identity,
- missing identity,
- publish success,
- publish failure,
- inserted signal visible in draft and preview.

The milestone is not finished until bugs found by this checklist are fixed.
