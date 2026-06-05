# Eva Protocol Launch Truth Matrix

> Source-of-truth companion for `protocol.config.json`. Use this matrix before public copy,
> launch notes, deployment smoke, or autonomous status reports describe a feature as live.

## Runtime Vocabulary

| State | Meaning | Allowed copy |
|---|---|---|
| `disabled` | Config or deployed address is missing. | Staged, disabled, not available yet. |
| `offchain-preview` | The product can preview behavior from local/offchain state, but cannot prepare or read the onchain action yet. | Preview-only, evidence record, offchain preflight. |
| `prepared-transaction` | Backend can prepare unsigned calldata for a wallet or Evalanche signer. | Prepared transaction, user-signed action. |
| `onchain-readback` | Backend can read deployed contract state for the feature. | Onchain readback, contract-backed status. |
| `fully-executable` | The full user path is prepared, signed, broadcast, confirmed, and read back. | Executable live action. |

Do not use "live" for a user action unless it is `fully-executable`, or unless the sentence names
the narrower live surface explicitly, such as "contract addresses are deployed" or "readback is
live."

## Current Matrix

| Surface | Current truth | User-action state | Evidence |
|---|---|---|---|
| Eva app | Production URL configured at `https://eva.jaack.me`. | Live site surface, still gated by deploy smoke. | `protocol.config.json`, `README.md` |
| `EvaTrustGraph` | Deployed on Avalanche C-Chain and canonical for graph-backed identity/trust. | Onchain readback through backend trust/curator routes. | `protocol.config.json`, `contracts/deployments/mainnet.json` |
| Prediction theses | Stored offchain as v1 product objects. | Offchain product flow. | `docs/ARCHITECTURE.md`, backend prediction routes |
| External market links | Eva references external markets and odds context. | External-link-only, no custody or trade execution. | `docs/GO_TO_MARKET.md`, `README.md` |
| Claim bundles | Stored offchain with evidence, packets, status, previews, and detail pages. | `offchain-preview` for market actions. | backend claim market service |
| Verification market contracts | `EvaVerificationMarket` and adapter addresses are configured and recorded. | Contract deployment exists, but claim/stake/challenge actions are not executable from Eva yet. | `protocol.config.json`, `contracts/deployments/mainnet.json` |
| Claim stake/challenge/settlement | Backend exposes preview endpoints. | `offchain-preview` until calldata preparation and onchain readback exist. | `/api/claims/*/stake-preview`, `/challenge-preview`, `/settlement-preview` |
| Curator onboarding | Registration UI and preflight exist. | Production readiness depends on wallet gas, signer path, and route smoke. | `docs/ROADMAP.md`, `docs/CURATOR_ONBOARDING_FAQ.md` |
| x402 | Disabled in config. | Not active. | `protocol.config.json` |

## Launch Gates

- Deployment owner and serving-deployment truth are confirmed.
- Production env vars for signer, LLM/gateway, and storage are present.
- Agent wallet has enough AVAX for gas.
- Durable storage, analytics, and monitoring are confirmed.
- Dynamic smoke IDs exist for article, curator, trust, claim, thesis, market, and predictor routes.
- Public posts and external outreach have approval.

The launch gate is not closed until the smoke checks and docs agree with this matrix.
