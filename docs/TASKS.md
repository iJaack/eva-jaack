# Eva Protocol — Tasks

> Build order. Work top-to-bottom. Each section depends on the previous.

## References
- **Architecture:** `ARCHITECTURE.md` — system overview, flow, contract design
- **Design:** `DESIGN.md` — repo structure, Solidity specs, backend pipeline, frontend components
- **Chain:** Avalanche C-Chain. Fuji testnet first.
- **$EVA Token:** `0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672` (Avalanche, ERC-20)
- **ERC-8004 on Avalanche:**
  - IdentityRegistry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
  - ReputationRegistry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
  - ValidationRegistry: verify Avalanche deployment address
- **Eva Agent:** ID #1599 on ERC-8004 IdentityRegistry
- **Domain:** `eva.jaack.me` — landing page + whitepaper + app
- **Deploy target:** Vercel

---

## Phase 0: Landing Page + Whitepaper (Priority: FIRST)

> Ship a public-facing site before building the MVP. This is the marketing surface.

### 0.1 Project Setup
- [ ] Create the `eva-protocol` repo (GitHub, under iJaack)
- [ ] Initialize as Next.js 15 monorepo with pnpm workspaces:
  ```
  eva-protocol/
  ├── frontend/          ← Next.js app (landing + whitepaper now, MVP app later)
  ├── contracts/         ← Foundry (Phase 1)
  ├── backend/           ← API server (Phase 2)
  └── package.json       ← pnpm workspace root
  ```
- [ ] Set up `frontend/` with Next.js 15 (App Router), Tailwind CSS, TypeScript
- [ ] Configure for deployment to Vercel on `eva.jaack.me`
- [ ] Set up custom domain in Vercel: `eva.jaack.me`

### 0.2 Landing Page (`/`)
- [ ] Hero section:
  - Headline: "AI-Powered Truth Verification" (or similar — punchy, clear)
  - Subheadline: "Submit any article. AI extracts claims. The crowd bets on truth. Every verdict lives on-chain."
  - CTA button: "Read the Whitepaper" → links to `/whitepaper`
  - Secondary CTA: "Coming Soon — Join Waitlist" (email capture or link to Telegram/community)
- [ ] How It Works section (3-4 steps with icons):
  1. Submit an article URL
  2. AI extracts and verifies factual claims
  3. Prediction markets open — stake $EVA on TRUE or FALSE
  4. Markets resolve, payouts settle, validation recorded on-chain (ERC-8004)
- [ ] Built On section:
  - Avalanche logo + "Avalanche C-Chain"
  - ERC-8004 logo/badge + "ERC-8004 Trustless Agents Standard"
  - $EVA token mention
- [ ] Footer:
  - Links: Whitepaper, GitHub, Avalanche, ERC-8004
  - "Built by Eva (Agent #1599) & Jaack"
- [ ] Design: dark theme, clean, crypto-native aesthetic. Minimal but polished.
  - Brand colors: use Eva brand (deep blue #3b82f6, cyan #06b6d4, dark navy #0a0f1c) or refine for this project
- [ ] Responsive (mobile-first)

### 0.3 Whitepaper Page (`/whitepaper`)
- [ ] Full whitepaper content rendered as a clean, readable long-form page
- [ ] Sections (based on ARCHITECTURE.md, expanded for public consumption):
  1. **Abstract** — What Eva Protocol is and why it matters
  2. **The Problem** — News trust is broken. AI-generated content makes it worse. No skin-in-the-game mechanism exists.
  3. **The Solution** — AI claim extraction + prediction markets on truth + on-chain validation receipts
  4. **How It Works** — Detailed flow: submit → extract → verify → market → resolve → settle
  5. **Architecture** — System diagram, contract overview, ERC-8004 integration
  6. **EvaClaimMarket** — The core smart contract: markets, staking, resolution, challenges, payouts
  7. **$EVA Token** — Utility: betting, challenges, protocol fees. Existing token on Avalanche.
  8. **ERC-8004 Integration** — How we use existing Identity, Reputation, and Validation registries
  9. **Security & Trust Model** — Decentralization roadmap (centralized resolver → multi-validator → governance)
  10. **Roadmap** — Phase 0 (landing), Phase 1 (contract), Phase 2 (backend), Phase 3 (frontend), Phase 4 (mainnet)
  11. **Team** — Eva (AI Agent #1599) + Jaack (Routescan founder)
- [ ] Table of contents sidebar (sticky on desktop)
- [ ] Clean typography (serif or mono for headings, readable body font)
- [ ] Diagrams rendered inline (system architecture, market flow, payout math)
- [ ] Downloadable PDF version (optional, nice-to-have)

### 0.4 SEO + Meta
- [ ] OpenGraph meta tags (title, description, image) for social sharing
- [ ] Favicon + social card image
- [ ] `<title>`: "Eva Protocol — AI-Powered Truth Verification"
- [ ] `<meta description>`: "Submit any article. AI extracts claims. The crowd bets on truth. Built on Avalanche with ERC-8004."

### 0.5 Deploy
- [ ] Deploy to Vercel
- [ ] Connect `eva.jaack.me` domain
- [ ] Verify site works on mobile + desktop
- [ ] Share link for review

---

## Phase 1: Smart Contract

### 1.1 Scaffold
- [ ] Create monorepo with pnpm workspaces (`contracts/`, `backend/`, `frontend/`)
- [ ] Initialize Foundry in `contracts/`: `cd contracts && forge init --no-commit`
- [ ] Configure `foundry.toml`:
  ```toml
  [profile.default]
  src = "src"
  out = "out"
  libs = ["lib"]
  solc = "0.8.24"
  optimizer = true
  optimizer_runs = 200
  via_ir = true

  [rpc_endpoints]
  fuji = "https://api.avax-test.network/ext/bc/C/rpc"
  avalanche = "https://api.avax.network/ext/bc/C/rpc"

  [etherscan]
  avalanche = { key = "${SNOWTRACE_API_KEY}", url = "https://api.snowtrace.io/api" }
  fuji = { key = "${SNOWTRACE_API_KEY}", url = "https://api-testnet.snowtrace.io/api" }
  ```
- [ ] Install OpenZeppelin: `forge install OpenZeppelin/openzeppelin-contracts-upgradeable OpenZeppelin/openzeppelin-contracts`
- [ ] Create `remappings.txt`:
  ```
  @openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
  @openzeppelin/contracts-upgradeable/=lib/openzeppelin-contracts-upgradeable/contracts/
  ```
- [ ] Create directory structure: `src/`, `src/interfaces/`, `src/libraries/`, `test/`, `test/mocks/`, `script/`
- [ ] Create `.gitignore`: cache, out, broadcast, .env, node_modules

### 1.2 Interfaces
- [ ] `src/interfaces/IEvaClaimMarket.sol` — all external function signatures, events, errors, structs, enums
  - Copy structs/enums/events/errors exactly from DESIGN.md
- [ ] `src/interfaces/IERC8004Validation.sol` — minimal interface:
  ```solidity
  interface IERC8004Validation {
      function validationResponse(
          bytes32 requestHash,
          uint8 response,
          string calldata responseURI,
          bytes32 responseHash,
          string calldata tag
      ) external;
  }
  ```

### 1.3 MarketMath Library
- [ ] Implement `src/libraries/MarketMath.sol`
  - `calculatePayout(userStake, winningPool, losingPool, feeBps) → payout`
  - `calculateFee(losingPool, feeBps) → fee`
  - `impliedOdds(truePool, falsePool) → (trueOdds, falseOdds)` in bps
  - All pure functions, no state
  - See DESIGN.md → MarketMath.sol for exact formulas
- [ ] Test: `test/MarketMath.t.sol`
  - Basic payout calculation
  - Zero pool edge case (no losers → payout = stake only)
  - Single-sided market (all bet one way)
  - Fee calculation
  - Odds with equal pools (50/50)
  - Odds with lopsided pools
  - Fuzz: random stakes and pools

### 1.4 EvaClaimMarket Contract
- [ ] Implement `src/EvaClaimMarket.sol`
  - Inherits: Initializable, UUPSUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable
  - Uses: SafeERC20 for $EVA transfers
  - All state variables from DESIGN.md
  - All functions from DESIGN.md → Function Signatures
  - **initialize()**: set token, registries, treasury, admin; grant roles
  - **createMarket()**: VALIDATOR_ROLE only. Set deadlines. Emit event.
  - **stake()**: check Open status, before deadline, min/max stake, one bet per user per market. Transfer $EVA. Update pool. Emit event.
  - **resolve()**: RESOLVER_ROLE only. Check after betting deadline. Set proposed outcome. Start challenge window. Emit event.
  - **challenge()**: anyone. Min 50 $EVA stake. Extend deadline. Emit event.
  - **settle()**: permissionless. Check challenge window expired. Set final outcome. Write to ERC-8004 ValidationRegistry. Emit events.
  - **claim()**: nonReentrant. Check settled + winning side. Calculate payout via MarketMath. Transfer $EVA. Mark claimed. Emit event.
  - **emergencyVoid()**: admin only. Return all stakes. Set Void. Emit event.
  - **View functions**: getMarket, getPosition, getOdds, calculatePayout
  - **Admin config**: setProtocolFeeBps, setMinStake, setTreasury
  - Use custom errors everywhere (no require strings)
  - NatSpec on all public/external functions

### 1.5 Mock for Testing
- [ ] `test/mocks/MockERC20.sol` — simple mintable ERC20 to simulate $EVA in tests

### 1.6 Contract Tests
- [ ] `test/EvaClaimMarket.t.sol`
  - **Setup:** Deploy mock $EVA, deploy EvaClaimMarket via proxy, grant roles, mint tokens to test users
  - **createMarket:**
    - ✅ Create market with valid params
    - ❌ Revert: caller without VALIDATOR_ROLE
    - ✅ Check all fields set correctly
    - ✅ Multiple markets for same article
  - **stake:**
    - ✅ Stake TRUE, verify pool increase
    - ✅ Stake FALSE, verify pool increase
    - ❌ Revert: stake after betting deadline (warp time)
    - ❌ Revert: stake below minimum
    - ❌ Revert: stake above max percentage of pool
    - ❌ Revert: double stake same market
    - ❌ Revert: stake on non-existent market
    - ✅ Multiple users stake both sides
  - **resolve:**
    - ✅ Resolve with True outcome
    - ✅ Resolve with False outcome
    - ✅ Resolve with Unverifiable outcome
    - ❌ Revert: resolve before betting deadline
    - ❌ Revert: caller without RESOLVER_ROLE
    - ❌ Revert: resolve already resolved market
  - **challenge:**
    - ✅ Challenge during challenge window
    - ❌ Revert: challenge after window expires
    - ❌ Revert: challenge stake too low
    - ✅ Challenge extends deadline
  - **settle:**
    - ✅ Settle after challenge window (no challenge)
    - ✅ Settle after challenged + extended window
    - ❌ Revert: settle during active challenge window
    - ❌ Revert: settle already settled
  - **claim:**
    - ✅ Winner claims correct payout
    - ✅ Multiple winners claim proportionally
    - ✅ Protocol fee transferred to treasury
    - ❌ Revert: loser tries to claim
    - ❌ Revert: double claim
    - ❌ Revert: claim on unsettled market
    - ✅ Unverifiable outcome → all stakes returned
  - **emergencyVoid:**
    - ✅ Admin voids market, all stakes returned
    - ❌ Revert: non-admin tries to void
  - **Full lifecycle:**
    - ✅ create → stake (multiple users) → resolve → settle → claim (all winners)
    - ✅ create → stake → resolve → challenge → settle → claim
    - ✅ create → no stakes → resolve → settle (empty market)
  - **Fuzz:**
    - Fuzz stake amounts (within valid range)
    - Fuzz number of participants
    - Verify: sum of all payouts + fee = total pool (no dust)

### 1.7 Deploy Script
- [ ] `script/DeployFuji.s.sol`
  - Deploy EvaClaimMarket implementation
  - Deploy ERC1967Proxy
  - Call initialize (use Fuji $EVA or mock token, Fuji validation registry, treasury = deployer)
  - Grant VALIDATOR_ROLE + RESOLVER_ROLE to Eva backend address
  - Console.log all deployed addresses
- [ ] Test on local anvil: `anvil --fork-url $FUJI_RPC`
- [ ] Deploy to Fuji: `forge script script/DeployFuji.s.sol --rpc-url fuji --broadcast --verify`
- [ ] Save deployed addresses in `contracts/deployments/fuji.json`

---

## Phase 2: Backend API

### 2.1 Setup
- [ ] Initialize `backend/` with TypeScript, Hono, pnpm
- [ ] Install deps: `@anthropic-ai/sdk`, `viem`, `pinata`, `agent0-ts` (if available on npm, else interface manually)
- [ ] Configure environment (see DESIGN.md → Environment Config)
- [ ] Set up Eva wallet signer (private key from env, NEVER hardcode)

### 2.2 Claim Extraction Service
- [ ] `backend/src/services/claim-extractor.ts`
  - Input: article text (string)
  - Uses Claude API with extraction prompt (see DESIGN.md → Step 2)
  - Output: `{ claims: [{ text, type, confidence }] }`
  - Filter: return only `type === "factual"` with `confidence >= 5`
- [ ] Test with 5 known articles, verify claim quality

### 2.3 Claim Verification Service
- [ ] `backend/src/services/claim-verifier.ts`
  - Input: single claim text
  - Step 1: Web search (Brave API) for corroborating/contradicting sources
  - Step 2: Claude API rates veracity 0-100 with explanation (see DESIGN.md → Step 3)
  - Output: `{ verdict: 0-100, explanation, sources: [{ url, title, supports: bool }] }`
- [ ] Test with known true claims and known false claims

### 2.4 IPFS Service
- [ ] `backend/src/services/ipfs.ts`
  - Upload validation report JSON to Pinata
  - Return IPFS URI (`ipfs://...`)

### 2.5 Blockchain Service
- [ ] `backend/src/services/blockchain.ts`
  - Create viem client for Avalanche
  - Functions:
    - `createMarket(claimHash, articleHash, aiVerdict, sourceURI) → txHash`
    - `getMarket(marketId) → ClaimMarket`
    - `resolve(marketId, outcome, sourceURI) → txHash`
  - Uses Eva wallet for signing

### 2.6 API Routes
- [ ] `POST /api/validate` — full pipeline: fetch URL → extract → verify → IPFS → create markets
  - See DESIGN.md → POST /api/validate for full spec
- [ ] `GET /api/market/:id` — return market data + user position
- [ ] `GET /api/article/:hash` — return all claims + markets for an article
- [ ] Error handling: rate limiting, invalid URLs, API failures

### 2.7 Integration Test
- [ ] Submit a real article URL, verify end-to-end flow
- [ ] Check: claims extracted, verdicts reasonable, IPFS uploaded, markets created on Fuji

---

## Phase 3: Frontend

### 3.1 Setup
- [ ] Initialize Next.js 15 in `frontend/` with App Router
- [ ] Install: wagmi v2, viem, @rainbow-me/rainbowkit, tailwindcss
- [ ] Configure wagmi for Avalanche C-Chain (+ Fuji for dev)
- [ ] Set up contract ABIs and addresses in `frontend/lib/contracts.ts`

### 3.2 Landing Page
- [ ] `app/page.tsx` — paste article URL input, submit button
- [ ] Loading state while backend processes
- [ ] Redirect to `/article/:hash` on success

### 3.3 Article Page
- [ ] `app/article/[hash]/page.tsx`
  - Fetch article data from backend API
  - Show article title/URL
  - List of ClaimCard components
  - Overall trust score (average of claim verdicts)
  - Link to IPFS validation report

### 3.4 Claim & Market Components
- [ ] `components/ClaimCard.tsx` — claim text, AI verdict badge, mini market bar, source links
- [ ] `components/MarketCard.tsx` — expanded betting UI, pool sizes, odds, countdown timer
- [ ] `components/StakeInput.tsx` — $EVA amount input, approve + stake flow
- [ ] `components/VerificationBadge.tsx` — ✅ ⚠️ ❌ 🔍 based on verdict score

### 3.5 Market Page
- [ ] `app/market/[id]/page.tsx` — full market view with betting interface
- [ ] Show: claim text, AI verdict, current odds, pool sizes, deadline countdown
- [ ] Bet flow: connect wallet → approve $EVA → stake TRUE/FALSE
- [ ] After settlement: show outcome, payout, claim button

### 3.6 Profile & Leaderboard
- [ ] `app/profile/[address]/page.tsx` — user's betting history, P&L
- [ ] `app/leaderboard/page.tsx` — top bettors by accuracy/profit

### 3.7 Polish
- [ ] Responsive design (mobile-friendly)
- [ ] Dark mode
- [ ] Snowtrace links for all on-chain transactions
- [ ] Error states (wallet not connected, insufficient balance, etc.)

---

## Phase 4: Production Deploy

### 4.1 Contract Mainnet
- [ ] Audit EvaClaimMarket (self-review + external if budget allows)
- [ ] Deploy to Avalanche mainnet
- [ ] Verify on Snowtrace
- [ ] Grant roles to production backend address
- [ ] Set treasury to multisig

### 4.2 Backend Deploy
- [ ] Deploy backend to Vercel / Railway / VPS
- [ ] Set production env vars (API keys, private key via secret manager)
- [ ] Rate limiting on /api/validate

### 4.3 Frontend Deploy
- [ ] Deploy to Vercel
- [ ] Custom domain (eva.news or similar)
- [ ] Analytics (Plausible or similar)

### 4.4 Launch
- [ ] Register Eva as validator on mainnet ERC-8004
- [ ] Validate 10 articles as proof of concept
- [ ] Announce on Arena, X (when reinstated), Clawstr

---

## Phase 5: Future Enhancements (Post-MVP)

- [ ] Decentralized resolver set (multiple validators, consensus)
- [ ] Reputation scoring for bettors (ERC-8004 ReputationRegistry)
- [ ] Browser extension — verification badges on news sites
- [ ] API for third parties to submit articles
- [ ] Auto-resolution via external oracles (for price/data claims)
- [ ] Governance: $EVA holders vote on protocol parameters
- [ ] Mobile app
- [ ] Multi-chain deployment (Base, Ethereum)

---

## CI/CD

### GitHub Actions: `test.yml`
```yaml
name: Test
on: [push, pull_request]
jobs:
  contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { submodules: recursive }
      - uses: foundry-rs/foundry-toolchain@v1
      - run: cd contracts && forge build
      - run: cd contracts && forge test -vvv
      - run: cd contracts && forge coverage

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd backend && pnpm install
      - run: cd backend && pnpm test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd frontend && pnpm install
      - run: cd frontend && pnpm build
```

---

*Version: 2.0 — 2026-02-11*
*Scope: MVP = 1 contract + backend API + frontend. Leverages ERC-8004 for identity/reputation/validation.*
