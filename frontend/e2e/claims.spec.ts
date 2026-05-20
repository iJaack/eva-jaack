import { expect, test } from "@playwright/test";

const claimId = "0xclaim123";

const claimPayload = {
  claimId,
  title: "Eva opens public claim pages for tagged X posts",
  excerpt: "Eva turns a tagged X post into a public claim page that can later feed trust and market actions.",
  claimText: "Eva turns a tagged X post into a public claim page that can later feed trust and market actions.",
  claimType: "factual",
  status: "open",
  createdAt: "2026-03-27T12:00:00.000Z",
  updatedAt: "2026-03-27T12:00:00.000Z",
  source: {
    platform: "x",
    ref: "https://x.com/eva/status/123",
    url: "https://x.com/eva/status/123",
    authorHandle: "@eva",
    conversationId: null,
  },
  machineAssessment: {
    verdict: "verified",
    confidence: 82,
    summary: "The implementation already stores canonical claim packets and exposes public pages.",
    evidenceCount: 1,
    generatedAt: "2026-03-27T12:05:00.000Z",
  },
  funding: {
    feePool: "0",
    sponsorPool: "0",
    protocolTopUpPool: "0",
    challengeBondPool: "0",
    slashedPool: "0",
    protocolFeeAccrued: "0",
    totalStaked: "0",
  },
  participantCount: 0,
  leadingVerdict: "verified",
  marketEnabled: false,
  createdBy: "0x1111111111111111111111111111111111111111",
  context: "Originated from X mention 123",
  evidenceLinks: ["https://x.com/eva/status/123"],
  packets: {
    metadata: { uri: "memory://metadata", hash: "0xmeta", generatedAt: "2026-03-27T12:00:00.000Z" },
    evidence: { uri: "memory://evidence", hash: "0xevidence", generatedAt: "2026-03-27T12:00:00.000Z" },
    machineAssessment: { uri: "memory://machine", hash: "0xmachine", generatedAt: "2026-03-27T12:05:00.000Z" },
    resolution: { uri: null, hash: null, generatedAt: null },
  },
  challenges: [],
  resolution: {
    verdict: null,
    confidenceBand: null,
    resolutionRoot: null,
    overturnedByChallenge: false,
    resolvedAt: null,
    summary: null,
  },
  timeline: [
    {
      label: "Claim opened",
      at: "2026-03-27T12:00:00.000Z",
      note: "A canonical claim page was created for the trust graph and market layer.",
    },
  ],
};

test("claims index and claim detail render the X-channel surfaces", async ({ page }) => {
  await page.route("**/api/claims", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        count: 1,
        chain: "avalanche",
        chainId: 43114,
        marketEnabled: false,
        claims: [claimPayload],
      }),
    });
  });

  await page.route(`**/api/claims/${claimId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(claimPayload),
    });
  });

  await page.route(`**/api/claims/${claimId}/settlement-preview`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        claimId,
        marketEnabled: false,
        settlementReady: false,
        finalVerdict: null,
        totalStake: "0",
        totalEligibleRewardPool: "0",
        totalProtocolFee: "0",
        challengeBonusPool: "0",
        participantCount: 0,
        leadingVerdict: "verified",
        funding: claimPayload.funding,
      }),
    });
  });

  await page.route(`**/api/claims/${claimId}/stake-preview`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        claimId,
        marketEnabled: false,
        source: "offchain-preview",
        requiresRegisteredCurator: true,
        amount: "100000000000000000000",
        verdict: "verified",
        confidenceBand: 78,
        minimumStake: "100000000000000000000",
        reviewDeadline: "2026-03-27T13:00:00.000Z",
        challengeWindowEnd: "2026-03-27T17:00:00.000Z",
        warnings: ["The onchain market is not deployed yet, so this is a preflight preview only."],
      }),
    });
  });

  await page.route(`**/api/claims/${claimId}/challenge-preview`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        claimId,
        marketEnabled: false,
        source: "offchain-preview",
        requiresRegisteredCurator: true,
        bondAmount: "50000000000000000000",
        minimumChallengeBond: "50000000000000000000",
        challengeWindowEnd: "2026-03-27T17:00:00.000Z",
        warnings: ["Challenge actions are staged until the market contract is deployed."],
      }),
    });
  });

  await page.goto("/claims");

  await expect(page.getByRole("heading", { name: "Claim bundles that can support prediction theses." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse markets" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Make a thesis" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Eva opens public claim pages/i })).toBeVisible();

  await page.goto(`/claims/${claimId}`);

  await expect(page.getByRole("heading", { name: /Eva opens public claim pages/i })).toBeVisible();
  await expect(page.getByText("Machine assessment")).toBeVisible();
  await expect(page.getByText("Stake preview")).toBeVisible();

  await page.getByRole("button", { name: "Preview verified stake" }).click();
  await expect(page.getByText("The onchain market is not deployed yet")).toBeVisible();

  await page.getByRole("button", { name: "Preview challenge" }).click();
  await expect(page.getByText("Challenge actions are staged until the market contract is deployed.")).toBeVisible();
});
