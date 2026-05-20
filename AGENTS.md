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
- blog content source, currently `frontend/lib/blog.ts`

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
