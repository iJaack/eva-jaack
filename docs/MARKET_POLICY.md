# Market Policy

Eva V1 is a thesis surface, not an everything-market directory. The provider feed and compose selector must expose only markets that are safe to use as public thesis signals.

## V1 prohibited markets

Exclude markets whose title, category, or provider URL indicates:

- sports or sports-betting outcomes
- elections, nominations, political offices, or named political-candidate flows
- war, invasion, blockade, ceasefire, terrorism, or active geopolitics/armed-conflict prompts
- assassination, death, illness, injury, or other personal-tragedy prompts
- criminal investigations, arrests, indictments, convictions, prison, or trial outcomes
- easily manipulable social/action prompts such as whether someone tweets, posts, says, or mentions a word on a social platform

## Enforcement

The backend applies this policy before provider markets are merged into the local prediction store. That means the public `/api/markets` response and the `/compose` market selector receive the same filtered market universe.

Allowed seed markets and provider markets should remain available when they are macro, crypto, company/liquidity, technology, or other non-prohibited thesis signals.
