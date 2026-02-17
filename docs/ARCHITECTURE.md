# Eva Protocol — Architecture

> AI-powered claim validation with prediction markets on truth. Built on ERC-8004.

## What It Does

1. User submits an article URL
2. AI (Eva, Agent #1599) extracts factual claims
3. Eva gives an initial AI verdict per claim (0-100 confidence)
4. A micro prediction market opens for each claim — users stake $EVA on TRUE / FALSE / UNVERIFIABLE
5. After 24-48h, the market resolves and payouts settle
6. Every validation is recorded on-chain via ERC-8004 ValidationRegistry on Avalanche

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│   Submit URL · View Claims · Bet on Outcomes · See Results       │
│                     Next.js 15 + wagmi v2                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      BACKEND API                                 │
│   /api/validate — fetch article, extract claims, AI verdict      │
│   /api/market — create/query/resolve markets                     │
│                     Node.js + Claude API                          │
└──────────┬───────────────────────────────────┬──────────────────┘
           │                                   │
┌──────────▼──────────┐           ┌────────────▼─────────────────┐
│   AI VERIFICATION   │           │      ON-CHAIN LAYER          │
│                     │           │                               │
│  Claim Extraction   │           │  EvaClaimMarket.sol (NEW)    │
│  (Claude API)       │           │    - Market creation          │
│                     │           │    - Stake TRUE/FALSE         │
│  Source Verification│           │    - Resolution + payouts     │
│  (Web Search API)   │           │    - Challenge period         │
│                     │           │                               │
│  Confidence Scoring │           │  ERC-8004 (EXISTING)         │
│  (0-100 per claim)  │           │    - IdentityRegistry        │
│                     │           │    - ReputationRegistry       │
└─────────────────────┘           │    - ValidationRegistry       │
                                  │                               │
                                  │  $EVA Token (EXISTING)        │
                                  │    0x6Ae3b236...7672          │
                                  │                               │
                                  │  AVALANCHE C-CHAIN            │
                                  └───────────────────────────────┘
```

---

## Chain & Token

- **Chain:** Avalanche C-Chain (43114). Fuji (43113) for testnet.
- **$EVA Token:** `0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672` (ERC-20, already deployed)
- **ERC-8004 on Avalanche:**
  - IdentityRegistry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
  - ReputationRegistry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
  - ValidationRegistry: check Avalanche deployment (same CREATE2 addresses expected)
- **Eva Agent:** ID #1599 on IdentityRegistry

---

## ERC-8004 Usage (No Custom Identity/Reputation Contracts)

### Identity
- Publishers and validators register via the **existing** IdentityRegistry
- Eva is already registered as Agent #1599
- Users who want to validate/challenge register their own agent IDs
- We do NOT deploy a custom identity contract

### Reputation
- After market resolution, winning/losing bettors get reputation feedback via the **existing** ReputationRegistry
- Eva's validator reputation updates based on how often her AI verdict aligns with market consensus
- Tags used: `accuracy` (AI verdict vs final outcome), `validation` (claim verified/disputed)

### Validation
- Each resolved claim = a validation record on the **existing** ValidationRegistry
- `validationRequest`: claim hash + article reference
- `validationResponse`: verdict (0-100), sources URI (IPFS), response hash
- Permanent on-chain audit trail

---

## Custom Contract: EvaClaimMarket.sol

**The only new contract.** Handles prediction markets on article claims.

### Core Data

```solidity
struct ClaimMarket {
    bytes32 claimHash;           // keccak256 of claim text
    bytes32 articleHash;         // keccak256 of article URL
    uint8 aiVerdict;             // Eva's initial confidence (0-100, 50 = uncertain)
    uint256 truePool;            // total $EVA staked on TRUE
    uint256 falsePool;           // total $EVA staked on FALSE
    uint64 createdAt;
    uint64 bettingDeadline;      // when betting closes (default: +24h)
    uint64 resolutionDeadline;   // when market must resolve (default: +48h)
    MarketStatus status;         // Open → Resolving → Settled | Challenged → Settled
    Outcome finalOutcome;        // True | False | Unverifiable | Void
    string sourceURI;            // IPFS link to full validation report
}

enum MarketStatus { Open, Resolving, Settled, Challenged, Void }
enum Outcome { Unresolved, True, False, Unverifiable, Void }
```

### Functions

```
createMarket(bytes32 claimHash, bytes32 articleHash, uint8 aiVerdict, string sourceURI) → uint256 marketId
  - Only callable by authorized validator (Eva's backend)
  - Sets bettingDeadline = now + 24h
  - Sets resolutionDeadline = now + 48h
  - Emits MarketCreated

stake(uint256 marketId, bool betTrue, uint256 amount)
  - Transfer $EVA from user to contract
  - Add to truePool or falsePool
  - Must be before bettingDeadline
  - Min stake: 1 $EVA
  - Emits Staked

resolve(uint256 marketId, Outcome outcome, string updatedSourceURI)
  - Only callable by authorized resolver (Eva's backend initially, governance later)
  - Can only call after bettingDeadline
  - Sets finalOutcome, status = Resolving
  - Starts 24h challenge window
  - Emits MarketResolving

challenge(uint256 marketId)
  - Stake min 50 $EVA to challenge a resolution
  - Extends resolution by 48h
  - Triggers secondary review (manual or expanded validator set)
  - Emits MarketChallenged

settle(uint256 marketId)
  - Only after challenge window expires with no challenge (or challenge resolved)
  - Status = Settled
  - Payouts become claimable
  - Writes validation to ERC-8004 ValidationRegistry
  - Emits MarketSettled

claim(uint256 marketId)
  - Winner claims their share of the losing pool
  - Payout = (userStake / winningPool) × losingPool × 0.95
  - 5% protocol fee to treasury
  - Emits Claimed

emergencyVoid(uint256 marketId)
  - Admin/governance only
  - Voids market, returns all stakes
  - For edge cases (article retracted, duplicate market, etc.)
```

### Payout Math

```
winningPool = (outcome == True) ? truePool : falsePool
losingPool  = (outcome == True) ? falsePool : truePool

userPayout = (userStake / winningPool) × losingPool × 0.95
protocolFee = totalPool × 0.05

If outcome == Unverifiable or Void:
  → All stakes returned (no payout, no fee)
```

### Access Control

| Function | Who Can Call |
|----------|------------|
| createMarket | VALIDATOR_ROLE (Eva backend) |
| stake | Anyone with $EVA |
| resolve | RESOLVER_ROLE (Eva backend; later: governance) |
| challenge | Anyone with min 50 $EVA |
| settle | Anyone (permissionless after challenge window) |
| claim | Users with winning stakes |
| emergencyVoid | ADMIN_ROLE (multisig; later: governance) |

### Rate Limits (Built-in)

```
- Min stake per bet: 1 $EVA
- Max stake per bet per user: 10% of current pool (prevents whale domination)
- Challenge min stake: 50 $EVA
- One bet per user per market (can increase but not switch sides)
- Markets can only be created by authorized validators
```

---

## Backend API

### POST /api/validate
```
Input:  { url: "https://example.com/article" }

Process:
  1. Fetch article content (web_fetch / readability)
  2. Claude API: extract factual claims from article
  3. For each claim:
     a. Claude API + web search: verify claim against sources
     b. Score confidence (0-100)
     c. Collect source URLs
  4. Upload validation report to IPFS (Pinata)
  5. For each factual claim: call EvaClaimMarket.createMarket()
  6. Call ERC-8004 ValidationRegistry.validationRequest()

Output: {
  articleUrl: string,
  articleHash: bytes32,
  claims: [{
    text: string,
    claimHash: bytes32,
    type: "factual" | "opinion" | "prediction",
    aiVerdict: 0-100,
    sources: [{ url, title, relevance }],
    marketId: uint256 | null  // only for factual claims
  }],
  validationTxHash: string,
  ipfsURI: string
}
```

### GET /api/market/:marketId
```
Output: {
  marketId, claimHash, articleHash,
  aiVerdict, truePool, falsePool,
  bettingDeadline, resolutionDeadline,
  status, finalOutcome,
  userPosition: { side, amount, claimable }
}
```

### GET /api/article/:articleHash
```
Output: {
  url, claims[], markets[], overallScore,
  validationReceipt: { txHash, snowtraceUrl }
}
```

---

## Storage

| Data | Where | Why |
|------|-------|-----|
| Market state, stakes | Avalanche C-Chain (EvaClaimMarket.sol) | Trustless, verifiable |
| Identity, reputation, validation | Avalanche C-Chain (ERC-8004 registries) | Standard, interoperable |
| Validation reports | IPFS (Pinata) | Permanent, content-addressed |
| Article cache, user sessions | PostgreSQL | Fast queries |
| Market analytics | PostgreSQL | Aggregations, history |

---

## Frontend Pages

| Page | Purpose |
|------|---------|
| **/** | Landing + paste article URL |
| **/article/:hash** | Claim breakdown, verdicts, market cards |
| **/market/:id** | Single claim market — bet TRUE/FALSE, see odds, countdown |
| **/profile/:address** | User's betting history, P&L, reputation |
| **/leaderboard** | Top validators, best bettors, most accurate |
| **/about** | How it works, ERC-8004 explainer |

---

## Security Considerations

1. **Reentrancy:** ReentrancyGuard on all $EVA transfer functions (stake, claim, challenge)
2. **Oracle risk:** Eva's AI verdict is a signal, not the final truth — market consensus + challenges provide checks
3. **Front-running:** Consider commit-reveal for large stakes if MEV becomes an issue
4. **Market manipulation:** Max stake cap (10% of pool) limits whale influence
5. **Resolver trust:** Initially centralized (Eva backend); roadmap to decentralized resolver set
6. **Upgradeability:** UUPS proxy for EvaClaimMarket (allows bug fixes)
7. **Emergency:** Admin can void markets for edge cases (article retracted, etc.)

---

## Decentralization Roadmap

| Phase | Resolver | Challenge |
|-------|----------|-----------|
| MVP | Eva backend (centralized) | Anyone can challenge (50 $EVA) |
| v2 | Multi-validator set (3/5 consensus) | Community jury (staked $EVA holders) |
| v3 | Fully decentralized (any registered validator) | On-chain governance |

---

*Version: 2.0 — 2026-02-11*
*Rewritten to leverage ERC-8004 infrastructure + prediction markets*
