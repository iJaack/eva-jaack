# MCP Agent Decision Cards

Use these cards when an agent prompt mixes thesis drafting, revision, anchoring, publishing, storage, or platform coordination. They are intentionally short: pick the first matching card, then use `docs/MCP_AGENT_QUICKSTART.md`, `docs/MCP_AGENT_GUIDE.md`, and `docs/MCP_AGENT_EXAMPLES.md` for the exact payload.

This file does not add new powers. The default MCP ceiling is still draft/anchor preparation only.

## How to use a card

For each prompt, fill only the fields the selected live MCP tool accepts. Keep issue links, PR links, deploy links, old metadata, and old prepared JSON out of the MCP payload unless the live schema explicitly accepts that field.

```text
card: <matching card name>
smallest safe tool: <tool or none>
required before call: <exact identity / thesisId / evidence / approval>
result ceiling: <read-only | draft prepared | anchor prepared | blocked>
safe final verb: <inspected | prepared | calldata ready | blocked>
boundary line: <what did not happen>
```

If any required field is missing, stop at `blocked:`. Do not swap wallets, guess thesis ids, reuse stale `anchorPreparationId` values, call direct REST write routes, or upgrade the final verb because the user sounded urgent.

## Card 1: "find relevant markets"

- Smallest safe tool: `search_markets`.
- Required before call: optional query only.
- Result ceiling: `read-only`.
- Safe final verb: `inspected` or `found candidates`.
- Boundary line: no draft, anchor calldata, transaction, storage check, or public publish happened.

## Card 2: "draft a new thesis"

- Smallest safe tool: `create_thesis_draft`.
- Required before call: task-time `xHandle`, full `0x` wallet address, approved `walletSource`, and real source/market evidence or an explicit signal-light instruction.
- Result ceiling: `draft prepared` / `anchor prepared`.
- Safe final verb: `prepared` or `calldata ready`.
- Boundary line: not published, not broadcast, not storage-verified.

## Card 3: "draft and publish this"

- Smallest safe MCP tool: `create_thesis_draft` only for the draft-prep part.
- Required before call: same as Card 2.
- Result ceiling from MCP: `draft prepared` / `anchor prepared`.
- Safe final verb: `prepared`.
- Boundary line: publish is blocked until there is a separate approved execution path, exact approval scope, write receipt, and readback evidence.

## Card 4: "revise this thesis"

- Smallest safe tools: `get_thesis`, then `prepare_revision_draft`.
- Required before revision call: exact `thesisId`, task-time `xHandle` and full wallet address, fresh `get_thesis` author readback matching that identity, and a full replacement body.
- Result ceiling: `draft prepared` / `anchor prepared`.
- Safe final verb: `revision draft prepared`.
- Boundary line: current public revision unchanged until approved transaction/public write receipt plus readback.

## Card 5: "anchor it" or "rebuild calldata"

- Smallest safe tool: `prepare_anchor_transaction`.
- Required before call: exact `thesisId`.
- Result ceiling: `anchor prepared`.
- Safe final verb: `calldata ready for approval`.
- Boundary line: no transaction was signed, broadcast, submitted, confirmed, or published.

## Card 6: "prove storage / launch readiness"

- Smallest safe MCP tool: none. Draft-prep tools cannot prove durability.
- Required evidence: approved readiness endpoint, API readback, storage-mode check, public URL readback, or onchain receipt/readback, depending on the claim.
- Result ceiling without that evidence: `blocked`.
- Safe final verb: `storage readiness blocked` or `storage verified by <named check>` only when the check exists.
- Boundary line: `anchorPreparationId`, transaction calldata, generic `/health`, PR status, and issue status are not durable storage proof.

## Card 7: "same as last time"

- Smallest safe MCP tool: none until identity and thesis authority are explicit.
- Required evidence: task-time `xHandle`, wallet address, signer/source approval, and exact `thesisId` when revising or anchoring.
- Result ceiling: `blocked`.
- Safe final verb: `blocked`.
- Boundary line: old comments, old metadata, saved JSON, screenshots, and old `anchorPreparationId` values are not permission to revise, publish, anchor, or claim storage.

## Card 8: "use this API key / route / token"

- Smallest safe MCP tool: usually none for the stronger action; MCP may still prepare draft/anchor payload if identity and evidence are complete.
- Required evidence for non-MCP execution: approved execution path, approval evidence, credential scope, write receipt, and readback evidence.
- Result ceiling without receipts: `draft prepared` / `anchor prepared` at most, or `blocked` if the prompt is only a direct write request.
- Safe final verb: `prepared` or `blocked`.
- Boundary line: possession of credentials or a route URL is not approval, write receipt, publication, or confirmation.

## Card 9: "turn this PR / issue / deploy into a thesis update"

- Smallest safe tools: `get_thesis` for existing thesis state, then the matching draft-prep tool only if exact identity and full body/evidence are present.
- Required before call: split coordination context from protocol input; keep PR URL, issue status, deploy URL, `waiting_on`, and `blocked_reason` out of the MCP payload.
- Result ceiling: `read-only`, `draft prepared`, `anchor prepared`, or `blocked` depending on exact inputs.
- Safe final verb: whichever rung direct protocol evidence supports.
- Boundary line: platform coordination status is not protocol state.

## Card 10: "market-backed thesis from pasted market"

- Smallest safe tools: `search_markets` when possible, or `create_thesis_draft` only after market-policy screening.
- Required before call: the market passes `docs/MARKET_POLICY.md`, has a valid URL when included, and the thesis still has exact identity approval.
- Result ceiling: `draft prepared` / `anchor prepared`; downgrade to signal-light or block if the market is off-policy or unauditable.
- Safe final verb: `prepared signal-backed draft` only when source/market evidence is real and policy-screened.
- Boundary line: off-policy, stale, malformed, or screenshot-only markets do not make a draft signal-backed.

## Card 11: "patch / append / small edit this thesis"

- Smallest safe tools: `get_thesis`, then `prepare_revision_draft` only after the full replacement body is known.
- Required before revision call: exact `thesisId`, task-time `xHandle` and full wallet address, fresh `get_thesis` author readback matching that identity, the current body from readback, and an approved delta that can be merged without inventing missing text.
- Result ceiling: `draft prepared` / `anchor prepared`, or `blocked` if the prompt only provides a patch and the current body cannot be read.
- Safe final verb: `revision draft prepared` when a full replacement body was prepared; otherwise `blocked`.
- Boundary line: `prepare_revision_draft` does not accept patch-only, diff-only, append-only, or paragraph-only bodies. The live public revision is unchanged until an approved transaction/public write receipt plus readback exists.

## Card 12: "verify / score / certify this thesis or fact"

- Smallest safe MCP tool: none for verification. `get_thesis` may inspect an existing thesis first, and draft-prep tools may carry already-existing fact-signal verdict fields only when they come from task-time evidence.
- Required evidence for any verification claim: a separate approved verifier path, report URI or hash when cited, verdict/score provenance, and readback evidence that the verified result matches the thesis or fact.
- Result ceiling without that evidence: `read-only` if only inspected, or `blocked` if the user asked for verification as the deliverable.
- Safe final verb: `inspected` or `blocked`; only say `verified by <named verifier/check>` when the separate verifier evidence exists.
- Boundary line: `verifierVerdict`, `verifierScore`, schema defaults, LLM opinions, and MCP draft prep do not verify a thesis, certify a fact, publish a report, or create a paid-verification record.
