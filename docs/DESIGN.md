# Eva Protocol — Design Document

> Implementation guide for Codex / coding agents.

## Repository Structure

```
eva-protocol/
├── contracts/
│   ├── src/
│   │   ├── EvaClaimMarket.sol          // THE core contract
│   │   ├── interfaces/
│   │   │   ├── IEvaClaimMarket.sol
│   │   │   ├── IERC8004Identity.sol    // minimal interface for existing registry
│   │   │   ├── IERC8004Reputation.sol  // minimal interface for existing registry
│   │   │   └── IERC8004Validation.sol  // minimal interface for existing registry
│   │   └── libraries/
│   │       └── MarketMath.sol          // payout calculations
│   ├── test/
│   │   ├── EvaClaimMarket.t.sol
│   │   ├── MarketMath.t.sol
│   │   └── mocks/
│   │       └── MockERC20.sol           // mock $EVA for testing
│   ├── script/
│   │   ├── DeployFuji.s.sol
│   │   └── DeployMainnet.s.sol
│   ├── foundry.toml
│   └── remappings.txt
├── backend/
│   ├── src/
│   │   ├── index.ts                    // API server entry
│   │   ├── routes/
│   │   │   ├── validate.ts             // POST /api/validate
│   │   │   ├── market.ts               // GET /api/market/:id
│   │   │   └── article.ts              // GET /api/article/:hash
│   │   ├── services/
│   │   │   ├── claim-extractor.ts      // Claude API — extract claims from article
│   │   │   ├── claim-verifier.ts       // Claude API + web search — verify claims
│   │   │   ├── ipfs.ts                 // Pinata — upload validation reports
│   │   │   └── blockchain.ts           // viem — interact with contracts
│   │   ├── lib/
│   │   │   ├── erc8004.ts              // agent0-ts SDK wrapper
│   │   │   └── types.ts
│   │   └── config.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx                    // Landing page (hero, how it works, CTA)
│   │   ├── whitepaper/page.tsx         // Full whitepaper (long-form, ToC sidebar)
│   │   ├── app/page.tsx               // MVP app — submit URL (Phase 3)
│   │   ├── app/article/[hash]/page.tsx // Claim breakdown + markets (Phase 3)
│   │   ├── app/market/[id]/page.tsx   // Single market — bet UI (Phase 3)
│   │   ├── app/profile/[address]/page.tsx // User history (Phase 3)
│   │   └── app/leaderboard/page.tsx   // Leaderboard (Phase 3)
│   ├── components/
│   │   ├── ClaimCard.tsx               // Single claim + verdict + market
│   │   ├── MarketCard.tsx              // Betting interface
│   │   ├── StakeInput.tsx              // $EVA stake amount input
│   │   └── VerificationBadge.tsx       // ✅ ⚠️ ❌ 🔍
│   ├── lib/
│   │   ├── contracts.ts                // ABI + addresses
│   │   ├── wagmi.ts                    // wagmi config
│   │   └── hooks/
│   │       ├── useMarket.ts
│   │       └── useArticle.ts
│   ├── next.config.js
│   ├── package.json
│   └── tailwind.config.js
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   └── TASKS.md
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── deploy.yml
├── .gitignore
├── README.md
└── package.json                        // workspace root (pnpm workspaces)
```

---

## Technology Stack

| Component | Tool | Notes |
|-----------|------|-------|
| Smart contracts | Solidity ^0.8.24 | Single contract + library |
| Framework | Foundry (forge) | Build, test, deploy, verify |
| Dependencies | OpenZeppelin v5 | UUPS, ReentrancyGuard, AccessControl |
| Token | $EVA ERC-20 | Existing: `0x6Ae3b236...7672` |
| ERC-8004 SDK | agent0-ts | Identity, reputation, validation |
| Backend | Node.js + Hono | Lightweight API server |
| AI | Anthropic Claude API | Claim extraction + verification |
| Web Search | Brave Search API | Source verification |
| IPFS | Pinata SDK | Validation report storage |
| Chain interaction | viem | Type-safe, lightweight |
| Frontend | Next.js 15 | App router, RSC |
| Wallet | wagmi v2 + RainbowKit | Avalanche support |
| Styling | Tailwind CSS | Utility-first |
| Database | PostgreSQL | Article cache, analytics |
| Package manager | pnpm | Workspaces for monorepo |

---

## Contract Design: EvaClaimMarket.sol

### Inheritance

```solidity
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract EvaClaimMarket is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;
    // ...
}
```

### Roles

```solidity
bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
// DEFAULT_ADMIN_ROLE for emergencyVoid + upgrades
```

### State Variables

```solidity
IERC20 public evaToken;

// ERC-8004 registries (for writing validation records after settlement)
address public validationRegistry;

uint256 public nextMarketId;              // auto-increment, starts at 1
uint256 public protocolFeeBps;            // default: 500 (5%)
uint256 public minStake;                  // default: 1e18 (1 $EVA)
uint256 public challengeStake;            // default: 50e18 (50 $EVA)
uint256 public bettingDuration;           // default: 24 hours
uint256 public resolutionDuration;        // default: 48 hours
uint256 public challengeDuration;         // default: 24 hours
uint256 public maxStakePercentBps;        // default: 1000 (10% of pool)
address public treasury;

mapping(uint256 => ClaimMarket) public markets;
mapping(uint256 => mapping(address => UserPosition)) public positions;
mapping(uint256 => ChallengeInfo) public challenges;
```

### Structs

```solidity
struct ClaimMarket {
    bytes32 claimHash;
    bytes32 articleHash;
    uint8 aiVerdict;             // 0-100
    uint256 truePool;
    uint256 falsePool;
    uint64 createdAt;
    uint64 bettingDeadline;
    uint64 resolutionDeadline;
    MarketStatus status;
    Outcome finalOutcome;
    string sourceURI;            // IPFS validation report
}

struct UserPosition {
    bool betTrue;                // which side
    uint256 amount;              // $EVA staked
    bool claimed;                // payout claimed?
}

struct ChallengeInfo {
    address challenger;
    uint256 stakeAmount;
    uint64 deadline;
    bool resolved;
}

enum MarketStatus { Open, Resolving, Settled, Challenged, Void }
enum Outcome { Unresolved, True, False, Unverifiable, Void }
```

### Events

```solidity
event MarketCreated(uint256 indexed marketId, bytes32 claimHash, bytes32 articleHash, uint8 aiVerdict);
event Staked(uint256 indexed marketId, address indexed user, bool betTrue, uint256 amount);
event MarketResolving(uint256 indexed marketId, Outcome proposedOutcome);
event MarketChallenged(uint256 indexed marketId, address indexed challenger);
event MarketSettled(uint256 indexed marketId, Outcome finalOutcome);
event Claimed(uint256 indexed marketId, address indexed user, uint256 payout);
event MarketVoided(uint256 indexed marketId);
event ProtocolFeeCollected(uint256 indexed marketId, uint256 amount);
```

### Custom Errors

```solidity
error MarketNotOpen();
error MarketNotResolving();
error BettingClosed();
error BettingStillOpen();
error AlreadyBet();
error StakeTooLow();
error StakeTooHigh();
error NothingToClaim();
error AlreadyClaimed();
error ChallengeWindowActive();
error ChallengeWindowExpired();
error NotAuthorized();
error InvalidOutcome();
error MarketAlreadySettled();
```

### Function Signatures

```solidity
function initialize(
    address _evaToken,
    address _validationRegistry,
    address _treasury,
    address _admin
) external initializer;

function createMarket(
    bytes32 claimHash,
    bytes32 articleHash,
    uint8 aiVerdict,
    string calldata sourceURI
) external onlyRole(VALIDATOR_ROLE) returns (uint256 marketId);

function stake(
    uint256 marketId,
    bool betTrue,
    uint256 amount
) external nonReentrant;

function resolve(
    uint256 marketId,
    Outcome outcome,
    string calldata updatedSourceURI
) external onlyRole(RESOLVER_ROLE);

function challenge(uint256 marketId) external nonReentrant;

function settle(uint256 marketId) external;

function claim(uint256 marketId) external nonReentrant;

function emergencyVoid(uint256 marketId) external onlyRole(DEFAULT_ADMIN_ROLE);

// View functions
function getMarket(uint256 marketId) external view returns (ClaimMarket memory);
function getPosition(uint256 marketId, address user) external view returns (UserPosition memory);
function getOdds(uint256 marketId) external view returns (uint256 trueOdds, uint256 falseOdds);
function calculatePayout(uint256 marketId, address user) external view returns (uint256);

// Admin config
function setProtocolFeeBps(uint256 _feeBps) external onlyRole(DEFAULT_ADMIN_ROLE);
function setMinStake(uint256 _minStake) external onlyRole(DEFAULT_ADMIN_ROLE);
function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE);

function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE);
```

### MarketMath.sol Library

```solidity
library MarketMath {
    /// @notice Calculate payout for a winning position
    /// @param userStake User's stake amount
    /// @param winningPool Total stake on winning side
    /// @param losingPool Total stake on losing side
    /// @param feeBps Protocol fee in basis points (500 = 5%)
    /// @return payout Amount user receives (stake + winnings - fee)
    function calculatePayout(
        uint256 userStake,
        uint256 winningPool,
        uint256 losingPool,
        uint256 feeBps
    ) internal pure returns (uint256 payout) {
        if (winningPool == 0) return 0;
        uint256 winnings = (userStake * losingPool) / winningPool;
        uint256 fee = (winnings * feeBps) / 10000;
        payout = userStake + winnings - fee;
    }

    /// @notice Calculate protocol fee for a settled market
    function calculateFee(
        uint256 losingPool,
        uint256 feeBps
    ) internal pure returns (uint256) {
        return (losingPool * feeBps) / 10000;
    }

    /// @notice Calculate implied odds (as basis points)
    /// @return trueOdds Implied probability of TRUE in bps (5000 = 50%)
    /// @return falseOdds Implied probability of FALSE in bps
    function impliedOdds(
        uint256 truePool,
        uint256 falsePool
    ) internal pure returns (uint256 trueOdds, uint256 falseOdds) {
        uint256 total = truePool + falsePool;
        if (total == 0) return (5000, 5000);
        trueOdds = (truePool * 10000) / total;
        falseOdds = 10000 - trueOdds;
    }
}
```

---

## ERC-8004 Integration Points

### After Market Settlement (in `settle()`)

```solidity
// Write validation result to ERC-8004 ValidationRegistry
IERC8004Validation(validationRegistry).validationResponse(
    market.claimHash,                    // requestHash
    _outcomeToScore(market.finalOutcome), // response: 0-100
    market.sourceURI,                    // responseURI (IPFS)
    keccak256(abi.encode(market)),       // responseHash
    "eva-claim-market"                   // tag
);
```

Score mapping:
- True → 100
- False → 0
- Unverifiable → 50
- Void → no validation written

### Reputation Feedback (off-chain, backend)

After settlement, the backend calls ReputationRegistry.giveFeedback() for:
- Eva's agent (accuracy of AI verdict vs market outcome)
- Optionally: users who consistently bet correctly (good signal)

---

## Backend: Claim Extraction Pipeline

### Step 1: Fetch Article
```typescript
// Use web_fetch or readability to get clean article text
const article = await fetchAndParse(url);
```

### Step 2: Extract Claims (Claude API)
```typescript
const prompt = `
Extract all factual claims from this article.
For each claim:
- text: the exact claim
- type: "factual" | "opinion" | "prediction"
- confidence: how specific/verifiable is this claim (1-10)

Only include claims that can be verified against external sources.
Exclude opinions, predictions, and vague statements.

Article:
${article.text}
`;

// Returns: { claims: [{ text, type, confidence }] }
```

### Step 3: Verify Each Claim (Claude + Web Search)
```typescript
for (const claim of factualClaims) {
    // Search for corroborating/contradicting sources
    const searchResults = await braveSearch(claim.text);

    const verifyPrompt = `
    Claim: "${claim.text}"

    Sources found:
    ${searchResults.map(r => `- ${r.title}: ${r.snippet} (${r.url})`).join('\n')}

    Rate this claim's veracity from 0-100:
    - 0: definitively false
    - 25: likely false
    - 50: uncertain / insufficient evidence
    - 75: likely true
    - 100: definitively true

    Provide your rating and explain why. List which sources support or contradict.
    `;

    // Returns: { verdict: 0-100, explanation, supportingSources, contradictingSources }
}
```

### Step 4: Upload to IPFS
```typescript
const report = {
    articleUrl: url,
    articleHash: keccak256(url),
    validatedAt: new Date().toISOString(),
    validatorAgentId: 1599,
    claims: verifiedClaims,
};
const ipfsURI = await pinata.upload(report);
```

### Step 5: Create On-Chain Markets
```typescript
for (const claim of factualClaims) {
    const tx = await evaClaimMarket.createMarket(
        keccak256(claim.text),
        keccak256(url),
        claim.verdict,
        ipfsURI
    );
}
```

---

## Frontend: Key Components

### ClaimCard.tsx
```
┌─────────────────────────────────────────────────┐
│ "Bitcoin hit $150,000 on February 6, 2026"      │
│                                                   │
│ AI Verdict: ✅ 92/100 (High Confidence)          │
│                                                   │
│ Market:  TRUE 78% ████████░░ FALSE 22%           │
│          $2,340 EVA        $660 EVA               │
│                                                   │
│ ⏰ Betting closes in 18h 42m                      │
│                                                   │
│ [Stake TRUE]  [Stake FALSE]                       │
│                                                   │
│ Sources: CoinMarketCap, Reuters, Chainlink        │
│ On-chain: 0x1234...abcd (Snowtrace ↗)            │
└─────────────────────────────────────────────────┘
```

### MarketCard.tsx (expanded betting view)
```
┌─────────────────────────────────────────────────┐
│ Claim: "Bitcoin hit $150,000 on Feb 6, 2026"    │
│                                                   │
│ ┌─────────────────┐  ┌─────────────────┐        │
│ │  TRUE  (78%)    │  │  FALSE  (22%)   │        │
│ │  $2,340 EVA     │  │  $660 EVA       │        │
│ │  1.28× payout   │  │  4.55× payout   │        │
│ └─────────────────┘  └─────────────────┘        │
│                                                   │
│ Your stake: [____] $EVA   [TRUE] [FALSE]         │
│                                                   │
│ Max stake: 300 $EVA (10% of pool)                │
│ Min stake: 1 $EVA                                │
│                                                   │
│ [Connect Wallet]  or  [Place Bet]                │
└─────────────────────────────────────────────────┘
```

---

## Deployment

### Contract Deployment Order
1. Deploy `EvaClaimMarket` implementation
2. Deploy `ERC1967Proxy` pointing to implementation
3. Call `initialize(evaToken, validationRegistry, treasury, admin)`
4. Grant `VALIDATOR_ROLE` to Eva backend address
5. Grant `RESOLVER_ROLE` to Eva backend address

### Environment Config
```env
# Avalanche
AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc

# Contracts
EVA_TOKEN=0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672
ERC8004_IDENTITY=0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
ERC8004_REPUTATION=0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
ERC8004_VALIDATION=<check Avalanche deployment>

# Backend
ANTHROPIC_API_KEY=<key>
BRAVE_API_KEY=<key>
PINATA_JWT=<key>
EVA_PRIVATE_KEY=<from keychain — never hardcode>

# Frontend
NEXT_PUBLIC_CHAIN_ID=43114
NEXT_PUBLIC_CLAIM_MARKET=<deployed address>
NEXT_PUBLIC_WALLETCONNECT_ID=<id>
```

---

## Testing Strategy

### Contract Tests (forge)
- **Unit:** Each function in EvaClaimMarket (happy path + reverts)
- **Fuzz:** MarketMath (payout calculations, odds, edge cases with 0 pools)
- **Integration:** Full lifecycle: create → stake → resolve → settle → claim
- **Fork:** Fork Avalanche mainnet, test with real $EVA token
- **Edge cases:** Void markets, challenges, max stake cap, single-sided markets

### Backend Tests
- **Unit:** Claim extraction prompt quality (test against known articles)
- **Integration:** Full pipeline: URL → claims → verdicts → IPFS → on-chain
- **Mock:** Mock Claude API responses for deterministic tests

### Frontend Tests
- **Component:** ClaimCard, MarketCard, StakeInput rendering
- **E2E:** Playwright — submit URL, see claims, connect wallet, place bet

---

## Conventions

- **Solidity:** Custom errors (not require strings). NatSpec on all public functions. Foundry naming: `.t.sol` for tests, `.s.sol` for scripts.
- **TypeScript:** Strict mode. Types in `types.ts`. No `any`.
- **Git:** Conventional commits. PR-based workflow.
- **Gas:** Run `forge test --gas-report`. Optimize hot paths (stake, claim).

---

*Version: 2.0 — 2026-02-11*
