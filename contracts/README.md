# Eva Protocol Contracts

Foundry workspace for the Avalanche C-Chain contracts used by Eva:

- `EvaThesisProtocol` — UUPS thesis and signal anchors. Canonical proxy:
  `0x5eDBd1eea3228662326e60634E53AB8975D6641c`.
- `EvaUsageBurner` — immutable canonical `$EVA` usage receipts and dead-address retirement:
  `0xFfEA6272e6C7e035FE529a226A9aA5D9cD98B296`.

`EvaUsageBurner` sends approved `$EVA` to `0x000000000000000000000000000000000000dEaD`.
This reduces circulating supply but does not change the legacy token's reported `totalSupply()`.
No contract or product claim guarantees price appreciation.

```shell
/Users/jaack/.foundry/bin/forge build
/Users/jaack/.foundry/bin/forge test
```

Deployment receipts live in `deployments/mainnet.json`.

## Verified source

The production contracts have keyless Sourcify exact matches for both creation and runtime
bytecode:

- [EvaThesisProtocol v2](https://repo.sourcify.dev/43114/0x51cBB77D3b5Df8031F1A916548df07D3B05ae9BB)
- [EvaUsageBurner](https://repo.sourcify.dev/43114/0xFfEA6272e6C7e035FE529a226A9aA5D9cD98B296)

These records were submitted through Sourcify API v2 with the exact Foundry standard JSON input
and deployment transaction hash. They do not require a Snowtrace API key.
