# Market Policy

Eva V1 is a thesis surface, not an everything-market directory. The provider feed and compose selector must expose only markets that are safe to use as public thesis signals.

## V1 prohibited markets

Exclude markets whose title, category, or provider URL indicates:

- sports or sports-betting outcomes
- elections, nominations, political offices, balance-of-power control markets, political endorsements, named political-candidate flows, named political-leader tenure flows, or court/political-office prompts
- war, invasion, blockade, ceasefire, terrorism, or active geopolitics/armed-conflict prompts
- assassination, death, illness, injury, pregnancy, marriage, divorce, or other personal-tragedy / private-life prompts
- religious prophecy / novelty prompts that are not usable macro, crypto, company, liquidity, or technology thesis signals
- criminal investigations, arrests, indictments, convictions, prison, or trial outcomes
- easily manipulable social/action prompts such as whether someone tweets, posts, says, or mentions a word on a social platform
- easily manipulable entertainment / pop-culture prompts, including celebrity album releases, video-game release comparisons, or performer / actor casting questions such as the next James Bond

## V1 allowlist

The blocklist is not sufficient. A market is kept only when every allowlist rule passes and none of the prohibited patterns match. Anything unclassified is rejected.

- The market URL host is exactly `polymarket.com` or `kalshi.com`.
- The category is exactly one of: Macro, Crypto, Company/Liquidity, Technology, Private Markets.
- A title that does not classify into that set is unclassified and rejected. The provider name is not a category and cannot keep a market.
- Manual and external seeds pass only when their market id is on the explicit seed allowlist: `spacex-ipo-before-2027`, `fed-hold-next-meeting`, `btc-110k-window`.

Kalshi still loads the CPI, Fed, Bitcoin, and Ethereum series. The general `status=open` feed stays as well and must pass this same allowlist, so sports and other open contracts are counted as rejections instead of being merged.

## Enforcement

The backend applies this policy before provider markets are merged into the local prediction store. That means the public `/api/markets` response, MCP `search_markets`, and the `/compose` market selector receive the same filtered market universe.

`/api/runtime-readiness` reports `revision` from `VERCEL_GIT_COMMIT_SHA` (or `unknown`) and a `marketPolicy` block with `version`, per-provider `ok` / `error` / `fetched` / `kept` / `rejected` / `rejectedByReason`, and the aggregate `rejectedByReason`. `/api/markets` includes the same `marketPolicy` object alongside `count` and `markets`.

## Audit

The check is GET-only and does not use secrets:

```bash
node scripts/audit-market-feed.mjs --base http://127.0.0.1:3001
```

It prints JSON (`timestamp`, `base`, `revision`, totals by provider and category, provider status, `rejectedByReason`, `violations`) and exits non-zero when any served market fails the repo policy or an independent sports/stat/player-prop keyword check.
