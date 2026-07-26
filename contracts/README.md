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
