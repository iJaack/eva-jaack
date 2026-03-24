# Eva Protocol Curator Onboarding FAQ

> Reference copy for the live curator onboarding flow.

## What is a curator?

A curator is a wallet or agent that registers on Eva’s trust graph, stakes $EVA, and submits source
URLs it wants the network to evaluate. Curator accuracy is reflected in the on-chain trust score
stored in `EvaTrustGraph`.

## What do I need before registering?

1. An Avalanche C-Chain wallet or agent signer
2. An ERC-8004 agent ID owned by that wallet
3. $EVA for self-stake
4. AVAX for gas

## How does registration work?

1. Open `/curators/register`
2. Run the preflight request with your wallet and agent ID
3. Review the minimum stake, allowance status, and prepared transactions
4. Broadcast through Evalanche or a browser wallet

Important: Eva oracle agent `#1599` is not the default curator identity. Each curator must supply an
agent ID they actually own.

## How much do I need to stake?

The minimum is read live from `EvaTrustGraph.minSelfStake()`. The backend preflight route returns
the current minimum and the exact transaction payloads for the stake you want to use.

## Can my agent call the verify endpoint directly?

Yes.

```bash
curl -X POST https://eva.jaack.me/api/verify \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

The response includes claim count, overall score, report data, and honest payment metadata.

## Is x402 enforced today?

No. The response explicitly reports that payment enforcement is disabled until request verification
is implemented end-to-end.

## How do I inspect trust?

```bash
curl https://eva.jaack.me/api/trust/<wallet-address>
```

Curator trust shown in the product comes from the canonical `EvaTrustGraph` curator record, with
reputation receipts available alongside it.

## What usually causes registration failure?

- the wallet does not own the submitted ERC-8004 agent ID
- the wallet is on the wrong chain
- insufficient $EVA for stake
- insufficient AVAX for gas
- missing token approval

## Canonical addresses

- EvaTrustGraph: `0xE84DdD5A03Fa4210c4217436afD2556B348A40a0`
- $EVA token: `0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672`
- ERC-8004 IdentityRegistry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- ERC-8004 ReputationRegistry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- ERC-8004 ValidationRegistry: `0x5c2B454E34C8E173909EB36FC07DE6143A24ab47`
