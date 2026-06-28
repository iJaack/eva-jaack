import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const market = {
  marketId: "spacex-ipo-before-2027",
  provider: "external",
  externalId: "spacex-ipo-before-2027",
  url: "https://example.com/markets/spacex-ipo-before-2027",
  title: "Will SpaceX IPO before 2027?",
  category: "Space",
  status: "open",
  volumeUsd: 4_200_000,
  liquidityUsd: 650_000,
  closeTime: "2026-12-31T23:59:59.000Z",
  outcomes: [
    { outcomeId: "yes", label: "Yes", price: 0.38 },
    { outcomeId: "no", label: "No", price: 0.62 },
  ],
  linkedClaimIds: [],
  createdAt: "2026-04-22T00:00:00.000Z",
  updatedAt: "2026-04-22T00:00:00.000Z",
} as const;

const author = {
  dynamicUserId: "dyn-spacethesis",
  xHandle: "@spacethesis",
  xProfileId: "x-spacethesis",
  walletAddress: "0x0fe61780bd5508b3C99e420662050e5560608cA4",
  walletSource: "embedded",
} as const;

const thesis = {
  thesisId: "thesis-0fdef25794b38b6e8eed7524",
  slug: "spacex-ipo-liquidity-rotation",
  title: "SpaceX IPO liquidity rotation",
  body: "A SpaceX IPO would pull retail and venture attention into late-cycle aerospace risk while prediction markets keep repricing the launch window. [S1]",
  author,
  currentRevision: {
    revisionId: "rev-spacex-1",
    version: 1,
    body: "A SpaceX IPO would pull retail and venture attention into late-cycle aerospace risk while prediction markets keep repricing the launch window. [S1]",
    note: "Initial public thesis.",
    signalSnapshot: [],
    scoreBefore: null,
    scoreAfter: 72,
    createdAt: "2026-04-22T00:00:00.000Z",
    anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-22T00:00:00.000Z", confirmedAt: null },
  },
  revisions: [],
  signals: [
    {
      signalId: "sig-spacex-ipo",
      kind: "prediction_market",
      role: "core",
      title: market.title,
      rationale: "Primary forecast signal for the liquidity thesis.",
      weight: 100,
      signalScore: 72,
      addedAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
      anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-22T00:00:00.000Z", confirmedAt: null },
      marketId: market.marketId,
      provider: market.provider,
      externalId: market.externalId,
      marketUrl: market.url,
      selectedOutcomeId: "yes",
      selectedOutcomeLabel: "Yes",
      resolvedOutcomeLabel: null,
      oddsAtAdd: 0.34,
      currentOdds: 0.38,
      status: "open",
    },
  ],
  currentScore: 72,
  timeline: [
    {
      timelineId: "tl-spacex-created",
      action: "created",
      at: "2026-04-22T00:00:00.000Z",
      note: "Thesis published with initial signal basket.",
      scoreBefore: null,
      scoreAfter: 72,
    },
  ],
  evidenceLinks: ["https://example.com/source/spacex-ipo"],
  sourceUrl: "https://example.com/source/spacex-ipo",
  sourcePostUrl: null,
  counterToThesisId: null,
  copiedCount: 12,
  challengedCount: 2,
  status: "active",
  resolution: { correct: null, resolvedOutcomeId: null, resolvedAt: null, oddsEdge: null, reputationImpact: "pending", summary: null },
  anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-22T00:00:00.000Z", confirmedAt: null },
  createdAt: "2026-04-22T00:00:00.000Z",
  updatedAt: "2026-04-22T00:00:00.000Z",
} as const;

const predictor = {
  predictorId: "spacethesis",
  handle: "@spacethesis",
  wallet: author.walletAddress,
  agentId: "eva-protocol",
  registered: true,
  profileState: "registered",
  trustScore: 74,
  openTheses: 1,
  resolvedTheses: 0,
  accuracy: null,
  avgOddsEdge: null,
  copiedTheses: 12,
  bestCategory: "Space",
  badges: ["Wallet-linked", "Evidence-backed"],
} as const;

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
}

async function stubProductApis(page: Page) {
  await page.route(/\/api\/markets\/spacex-ipo-before-2027(?:\?.*)?$/, (route) => fulfillJson(route, { market, theses: [thesis] }));
  await page.route(/\/api\/theses\/thesis-0fdef25794b38b6e8eed7524(?:\?.*)?$/, (route) => fulfillJson(route, { thesis, markets: [market], predictor, counters: [] }));
  await page.route(/\/api\/predictors\/spacethesis(?:\?.*)?$/, (route) => fulfillJson(route, { predictor, theses: [thesis] }));
  await page.route(/\/api\/prediction-summary(?:\?.*)?$/, (route) => fulfillJson(route, {
    stats: { marketCount: 1, openThesisCount: 1, weeklyActivePredictors: 1, copiedThesisEvents: 12 },
    markets: [market],
    theses: [thesis],
    predictors: [predictor],
  }));
  await page.route(/\/api\/markets(?:\?.*)?$/, (route) => fulfillJson(route, { count: 1, markets: [market] }));
  await page.route(/\/api\/predictors(?:\?.*)?$/, (route) => fulfillJson(route, { count: 1, predictors: [predictor] }));
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(async () => {
    return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  }).toBe(true);
}

const qaTargets = [
  { slug: "home", path: "/", heading: "Trust starts with visible launch gates." },
  { slug: "markets", path: "/markets", heading: "Markets are source material." },
  { slug: "market-detail", path: "/markets/spacex-ipo-before-2027", heading: "Will SpaceX IPO before 2027?" },
  { slug: "thesis-detail", path: "/thesis/thesis-0fdef25794b38b6e8eed7524", heading: "SpaceX IPO liquidity rotation" },
  { slug: "predictors", path: "/predictors", heading: "Judge predictors by their thesis trail." },
  { slug: "predictor-detail", path: "/predictors/spacethesis", heading: "@spacethesis" },
  { slug: "compose-auth-gate", path: "/compose", heading: "Connect before drafting a public thesis." },
] as const;

test("captures desktop and mobile browser QA screenshots for thesis surfaces @screenshot-qa", async ({ page }, testInfo) => {
  await stubProductApis(page);
  const projectName = testInfo.project.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const outputDir = testInfo.outputPath("screenshot-qa");
  await mkdir(outputDir, { recursive: true });

  for (const target of qaTargets) {
    await page.goto(target.path);
    await expect(page.getByRole("heading", { name: target.heading })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `${outputDir}/${projectName}-${target.slug}.png`, fullPage: true });
  }
});
