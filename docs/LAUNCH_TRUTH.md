# Launch Truth

## Live

| Area | Status |
|---|---|
| Site URL | `https://eva.jaack.me` |
| Chain | Avalanche C-Chain (`43114`) |
| Eva wallet | `0x0fe61780bd5508b3C99e420662050e5560608cA4` |
| Eva agent ID | `1599` |
| Thesis protocol | `0x5eDBd1eea3228662326e60634E53AB8975D6641c` |
| Thesis implementation | v2 — `0x51cBB77D3b5Df8031F1A916548df07D3B05ae9BB` |
| Thesis upgrade tx | `0x99da914de41aaa0e7e6cc32590429b52a1f447ba0ced833d9c9ecdd78bd8b5f7` |
| `$EVA` token | `0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672` |
| `$EVA` usage burner | `0xFfEA6272e6C7e035FE529a226A9aA5D9cD98B296` |
| Usage-burn deployment tx | `0x88899e9cc943d59a792e71f927372af0cc1e24606baeb267f05300f8040e3340` |
| First thesis | SpaceX IPO liquidity rotation thesis |
| Market policy | V1 provider markets filtered against `docs/MARKET_POLICY.md` |

## Current Product Claims

Eva can claim:

- it creates and displays evolving thesis posts
- theses combine prediction-market and fact signals
- thesis revisions preserve history
- the app prepares thesis anchor transactions
- the deployed thesis protocol exists on Avalanche
- the canonical thesis proxy runs protocol version 2 and preserves its thesis state
- the app has MCP/agent-facing thesis tools
- the app reads `$EVA` contract metadata and holder balances from Avalanche
- `$EVA` balance is author context, never a credibility score or balance-threshold access rule
- public theses and revisions require exact action-bound `$EVA` retirement receipts
- agents can unlock a formatted proof bundle after an exact agent-verification receipt
- usage uses canonical ERC-20 allowance directly to `EvaUsageBurner`, not Permit2
- usage burns can create demand and circulating-supply pressure

Eva should not claim:

- native trade execution
- guaranteed prediction accuracy
- live sports coverage
- curator onboarding
- article verification
- claim staking or settlement
- `$EVA` staking, balance-based access, yield, governance, or trade execution
- a reduced `$EVA totalSupply()` value from usage burns; the legacy total remains unchanged
- guaranteed `$EVA` demand, liquidity, valuation, or price appreciation
- x402 payment enforcement
- traction, revenue, testimonials, or active user counts without measurement

## Launch Checks

- Home, markets, compose, thesis detail, predictors, and health routes load.
- `/compose` requires an externally connected self-custodial EVM wallet and a valid public X handle before the mutable editor renders. It must never expose an embedded-wallet or server-signer fallback.
- `/api/runtime-readiness` must report `walletConnection.mode="self_custody"`, `embeddedWallets=false`, `serverCanSign=false`, and `authoring.composeGate="self_custody_wallet"`.
- Final launch-authoring smoke must run with `SMOKE_REQUIRE_SELF_CUSTODY_WALLET=true`; that mode fails if runtime readiness exposes an embedded/server wallet path or a non-self-custodial compose gate.
- `/verify`, `/claims`, `/curators`, `/blog`, and `/whitepaper` are absent.
- SpaceX thesis page shows market signals, fact signals, revision history, and anchor status.
- Agent manifest and MCP endpoint respond.
- Contract deployment config matches `protocol.config.json`.
- The proxy implementation slot resolves to `0x51cBB77D3b5Df8031F1A916548df07D3B05ae9BB` and `PROTOCOL_VERSION()` returns `2`.
- The canonical SpaceX thesis and its four signal IDs remain readable after the upgrade.
- `/eva` shows the canonical `$EVA` contract and current Avalanche readback.
- `/eva` shows the usage-burn contract, exact-amount approval flow, dead-sink accounting, supply
  disclosure, and non-guaranteed price boundary.
- `EvaUsageBurner.EVA()` resolves to canonical `$EVA`, `BURN_SINK()` resolves to `0xdead`, and the
  runtime code hash is `0xcdbfdb12af6f360b6b1d60a3afc5dd5f384a0e570e50ddec80f96b2cb2c50be5`.
- Compose keeps `$EVA` holder state separate from identity and publishing requirements.

## Source Verification

The v2 implementation and usage burner are publicly verified through Sourcify without an explorer
API key. Both have exact creation-bytecode and runtime-bytecode matches:

- [EvaThesisProtocol v2](https://repo.sourcify.dev/43114/0x51cBB77D3b5Df8031F1A916548df07D3B05ae9BB)
- [EvaUsageBurner](https://repo.sourcify.dev/43114/0xFfEA6272e6C7e035FE529a226A9aA5D9cD98B296)

The verification inputs use Solidity `0.8.24`, optimizer runs `200`, `viaIR=true`, EVM version
`cancun`, and the deployment transaction hashes recorded above. The v2 proxy upgrade remains
separately confirmed by its Avalanche receipt, implementation-slot readback, protocol-version
readback, and preserved thesis state.
