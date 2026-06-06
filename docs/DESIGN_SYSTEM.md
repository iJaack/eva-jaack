# Eva Design System

Eva's design should feel like an editorial research desk for live probability, not a crypto dashboard, a Bloomberg clone, or a generic AI writing app.

## Product Object

The primary object is the evolving thesis post:

- a readable argument,
- composed from prediction-market signals and factual evidence,
- carrying revision history,
- attributable to an X identity and wallet,
- shareable outside Eva.

Every visual decision must make that object clearer.

## Design Principles

1. Article first.
   The thesis body is the center of gravity. Markets, facts, scores, and anchors support the article; they do not visually outrank it.

2. Evidence is structured, not decorative.
   A prediction or fact signal is a source block with status, weight, provenance, and insertion behavior. It is not a badge, not a marketing stat, and not loose copy.

3. Probability must read instantly.
   Use one dominant probability value per signal, with plain-language framing: "Yes priced at 24%" is better than raw decimal odds.

4. The interface must show time.
   Revisions, market movement, closed predictions, and anchor state should feel like a visible editorial history.

5. Agent-ready means predictable.
   Agents need stable labels, visible state, semantic regions, deterministic source ordering, and source URLs. Do not hide workflow truth behind decorative UI.

## Visual Direction

Name: probability editorial.

Tone:

- serious but not institutional,
- writerly but not magazine-cosplay,
- market-aware but not trading-terminal-first,
- precise, sparse, and source-driven.

Avoid:

- full-page grid wallpaper as the dominant motif,
- dark-only terminal aesthetics,
- hero cards beside tools,
- nested cards,
- purple-blue AI gradients,
- generic three-column SaaS card layouts,
- fake "command center" complexity.

## Layout System

### Desktop Compose

Use a three-zone editorial shell:

- Center: thesis canvas, 680-840px readable width.
- Right: source rail, 320-400px, sticky within the viewport.
- Bottom or side: post preview and publish validation, never hidden behind the primary editor.

The title and article body must visually merge into one artifact. Metadata fields must not break the writing flow.

### Mobile Compose

Use stacked modes:

- Write
- Sources
- Preview
- History

The mobile first viewport should show the draft title/body, not a hero block. Source controls move into a drawer, segmented view, or collapsible panel.

### Thesis Detail

Use article layout:

- Title and author record at top.
- Thesis body in a wide reading column.
- Signal margin notes or inline source blocks.
- Revision timeline after the main argument, with jump links from changed paragraphs/signals.

## Typography

Display:

- Use a high-character grotesk or editorial serif/grotesk pairing.
- Thesis titles can be large, but editor controls cannot use hero-scale type inside constrained panels.
- Use sentence case by default.
- Preserve line length: body copy target 60-72 characters.

Body:

- Body text must be calm and readable for long-form thesis posts.
- Use tabular numerals for probabilities, scores, price deltas, revision numbers, and timestamps.

Labels:

- Labels are functional metadata, not decoration.
- Avoid all-caps unless the label is extremely short and monotone.

## Color

Use color semantically:

- Probability / market: blue or cyan family.
- Evidence / fact: green or teal family.
- Revision / history: amber family.
- Anchor / chain: red only when referencing Avalanche or transaction state.
- Error: red.
- Warning: amber.
- Success/resolved: green.

The default surface should not be pure black. Use off-black or paper-light modes with restrained contrast.

## Components

### Thesis Canvas

Required states:

- empty draft,
- dirty draft,
- private draft saved,
- source inserted,
- validation failed,
- anchor missing,
- anchor prepared,
- publish pending,
- published.

Rules:

- The canvas must feel like writing, not filling a database form.
- Inline source inserts should be visible but not loud.
- Long titles must wrap.

### Signal Block

Required fields:

- kind: prediction or fact,
- title/claim,
- selected outcome or assertion,
- current value/verdict,
- weight,
- source/provider,
- status: open, closed, resolved, unverifiable, anchored.

Required actions:

- insert into draft,
- inspect source,
- adjust weight,
- remove from thesis draft.

### Post Preview

Preview is a publishing surface, not a decorative mirror.

Required:

- rendered title,
- rendered thesis body,
- inserted sources,
- author identity,
- publish-readiness checklist.
- anchor-readiness state.

### Revision Timeline

Required:

- version number,
- timestamp,
- score before/after,
- signal snapshot,
- body diff summary,
- anchor state.

## Motion

Motion should clarify state changes:

- inserting a signal should briefly highlight the inserted paragraph,
- probability changes should animate numerically only when data updates,
- publish should move through validating, storing, and published states,
- revision history should expand without layout jump.

Avoid motion that makes reading harder.

## Accessibility

- Every source block must be keyboard reachable.
- Insert actions require real buttons with unique names.
- Source drawers and preview modes require focus management.
- Color cannot be the only signal-status indicator.
- The article body must remain readable at browser zoom.

## Implementation Guidance

- Keep styling in `frontend/tokens.css` and `frontend/app/globals.css` until a component library exists.
- Keep components semantic: `main`, `article`, `aside`, `section`, `nav`.
- Prefer CSS grid for editor/source/preview layouts.
- Use stable `data-testid` only for important test targets, not as a styling hook.
- Every design-system component must have desktop and mobile states before it is considered done.
