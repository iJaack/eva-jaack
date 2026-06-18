import { expect, test } from "@playwright/test";

const author = {
  dynamicUserId: "dyn-macrodesk",
  xHandle: "@macrodesk",
  xProfileId: "x-macrodesk",
  walletAddress: "0x1111111111111111111111111111111111111111",
  walletSource: "external",
} as const;

const predictionSignal = {
  signalId: "sig-fed-hold",
  kind: "prediction_market",
  role: "core",
  title: "Will the Fed hold rates at the next meeting?",
  rationale: "Primary macro signal for the liquidity thesis.",
  weight: 70,
  signalScore: 64,
  addedAt: "2026-04-22T00:00:00.000Z",
  updatedAt: "2026-04-22T00:00:00.000Z",
  anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-22T00:00:00.000Z", confirmedAt: null },
  marketId: "fed-hold",
  provider: "external",
  externalId: "fed-hold",
  marketUrl: "https://example.com/market/fed-hold",
  selectedOutcomeId: "hold",
  selectedOutcomeLabel: "Hold",
  resolvedOutcomeLabel: null,
  oddsAtAdd: 0.44,
  currentOdds: 0.58,
  status: "open",
};

const factSignal = {
  signalId: "sig-cpi",
  kind: "fact",
  role: "second_order",
  title: "CPI is still running above target",
  rationale: "A lateral fact that explains why the market signal matters.",
  weight: 30,
  signalScore: 78,
  addedAt: "2026-04-22T00:00:00.000Z",
  updatedAt: "2026-04-22T00:00:00.000Z",
  anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-22T00:00:00.000Z", confirmedAt: null },
  claimText: "CPI is still running above target.",
  sourceUrl: "https://example.com/cpi",
  verifierVerdict: "likely_true",
  verifierScore: 78,
  reportUri: "ipfs://cpi-report",
  reportHash: null,
};

function thesisDetail(body = "Inflation prints are not soft enough for a cut, so liquidity remains tight. [S1]\n\nThat makes the second-order liquidity drain the real thesis. [S2]", version = 1) {
  return {
    thesis: {
      thesisId: "thesis-fed-hold",
      slug: "fed-hold-liquidity-thesis",
      title: "Fed hold liquidity thesis",
      body,
      author,
      currentRevision: {
        revisionId: `rev-fed-hold-${version}`,
        version,
        body,
        note: version === 1 ? "Initial thesis published." : "CPI update moved signal.",
        signalSnapshot: [predictionSignal, factSignal],
        scoreBefore: version === 1 ? null : 64,
        scoreAfter: version === 1 ? 64 : 70,
        createdAt: version === 1 ? "2026-04-22T00:00:00.000Z" : "2026-04-23T00:00:00.000Z",
        anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-22T00:00:00.000Z", confirmedAt: null },
      },
      revisions:
        version === 1
          ? [
              {
                revisionId: "rev-fed-hold-1",
                version: 1,
                body,
                note: "Initial thesis published.",
                signalSnapshot: [predictionSignal, factSignal],
                scoreBefore: null,
                scoreAfter: 64,
                createdAt: "2026-04-22T00:00:00.000Z",
                anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-22T00:00:00.000Z", confirmedAt: null },
              },
            ]
          : [
              {
                revisionId: "rev-fed-hold-1",
                version: 1,
                body: "Inflation prints are not soft enough for a cut, so liquidity remains tight. [S1]\n\nThat makes the second-order liquidity drain the real thesis. [S2]",
                note: "Initial thesis published.",
                signalSnapshot: [predictionSignal, factSignal],
                scoreBefore: null,
                scoreAfter: 64,
                createdAt: "2026-04-22T00:00:00.000Z",
                anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-22T00:00:00.000Z", confirmedAt: null },
              },
              {
                revisionId: "rev-fed-hold-2",
                version: 2,
                body,
                note: "CPI update moved signal.",
                signalSnapshot: [predictionSignal, factSignal],
                scoreBefore: 64,
                scoreAfter: 70,
                createdAt: "2026-04-23T00:00:00.000Z",
                anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-23T00:00:00.000Z", confirmedAt: null },
              },
            ],
      signals: [predictionSignal, factSignal],
      currentScore: version === 1 ? 64 : 70,
      timeline:
        version === 1
          ? [
              {
                timelineId: "tl-created",
                action: "created",
                at: "2026-04-22T00:00:00.000Z",
                note: "Thesis published with initial signal basket.",
                scoreBefore: null,
                scoreAfter: 64,
              },
            ]
          : [
              {
                timelineId: "tl-created",
                action: "created",
                at: "2026-04-22T00:00:00.000Z",
                note: "Thesis published with initial signal basket.",
                scoreBefore: null,
                scoreAfter: 64,
              },
              {
                timelineId: "tl-revised",
                action: "revised",
                at: "2026-04-23T00:00:00.000Z",
                note: "CPI update moved signal.",
                scoreBefore: 64,
                scoreAfter: 70,
              },
            ],
      evidenceLinks: ["https://example.com/cpi"],
      sourceUrl: "https://example.com/market/fed-hold",
      sourcePostUrl: null,
      counterToThesisId: null,
      copiedCount: 7,
      challengedCount: 1,
      status: "active",
      resolution: { correct: null, resolvedOutcomeId: null, resolvedAt: null, oddsEdge: null, reputationImpact: "pending", summary: null },
      anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-22T00:00:00.000Z", confirmedAt: null },
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: version === 1 ? "2026-04-22T00:00:00.000Z" : "2026-04-23T00:00:00.000Z",
    },
    markets: [
      {
        marketId: "fed-hold",
        provider: "external",
        externalId: "fed-hold",
        url: "https://example.com/market/fed-hold",
        title: "Will the Fed hold rates at the next meeting?",
        category: "Macro",
        status: "open",
        volumeUsd: 1000000,
        liquidityUsd: 250000,
        closeTime: "2026-06-17T18:00:00.000Z",
        outcomes: [
          { outcomeId: "hold", label: "Hold", price: 0.58 },
          { outcomeId: "cut", label: "Cut", price: 0.29 },
        ],
        linkedClaimIds: [],
        createdAt: "2026-04-22T00:00:00.000Z",
        updatedAt: "2026-04-22T00:00:00.000Z",
      },
    ],
    predictor: {
      predictorId: "macrodesk",
      handle: "@macrodesk",
      wallet: author.walletAddress,
      agentId: null,
      registered: false,
      profileState: "unclaimed",
      trustScore: 50,
      openTheses: 1,
      resolvedTheses: 0,
      accuracy: null,
      avgOddsEdge: null,
      copiedTheses: 7,
      bestCategory: "Macro",
      badges: ["Record-only", "Evidence-backed"],
    },
    counters: [],
  };
}

test("thesis detail reads as a public thesis with attached citation cards and revision history", async ({ page }) => {
  await page.route("**/api/theses/thesis-fed-hold", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(thesisDetail()) });
  });

  await page.goto("/thesis/thesis-fed-hold");

  await expect(page.getByRole("heading", { name: "Fed hold liquidity thesis" })).toBeVisible();
  await expect(page.getByTestId("thesis-body")).toContainText("[S1]");
  await expect(page.getByRole("heading", { name: "Signals supporting the thesis" })).toBeVisible();
  await expect(page.getByTestId("thesis-signal-card").first()).toContainText("S1");
  await expect(page.getByTestId("thesis-signal-card").first()).toContainText("Hold priced at 58%");
  await expect(page.getByTestId("thesis-signal-card").first()).toContainText("open");
  await expect(page.getByTestId("thesis-signal-card").nth(1)).toContainText("S2");
  await expect(page.getByRole("heading", { name: "Revision history" })).toBeVisible();
  await expect(page.getByTestId("revision-card").first()).toContainText("v1");
  await expect(page.getByTestId("revision-card").first()).toContainText("2 signals snapshotted");
  await expect(page.getByRole("heading", { name: "Append an update" })).toBeVisible();
});

test("publishing an update appends it to the thesis and creates the next revision", async ({ page }) => {
  const revisionPayloads: Array<Record<string, unknown>> = [];
  const preparedRevisionPayloads: Array<Record<string, unknown>> = [];

  await page.route("**/api/theses/thesis-fed-hold", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(thesisDetail()) });
      return;
    }
    await route.continue();
  });
  await page.route("**/api/theses/thesis-fed-hold/revisions", async (route) => {
    const payload = route.request().postDataJSON();
    revisionPayloads.push(payload);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(thesisDetail(payload.body, 2)),
    });
  });
  await page.route("**/api/theses/thesis-fed-hold/revision-drafts/protocol/prepare-anchor", async (route) => {
    const payload = route.request().postDataJSON();
    preparedRevisionPayloads.push(payload);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        anchorPreparationId: "revision-anchor-detail-1",
        thesisId: "thesis-fed-hold",
        anchorStatus: "prepared",
        transactions: [{ to: "0x1111111111111111111111111111111111111111", data: "0x1234", description: "Record revision v2 for Fed hold liquidity thesis" }],
      }),
    });
  });

  await page.goto("/thesis/thesis-fed-hold");
  const publishButton = page.getByRole("button", { name: "Publish update" });
  await expect(publishButton).toBeDisabled();
  await page.getByLabel("Update body").fill("Rates market repriced after CPI, so this thesis now needs a stronger liquidity extension. [S1]");
  await page.getByLabel("Update note").fill("CPI update moved signal.");
  await page.getByLabel("S1 current odds (%)").fill("74");
  await page.getByLabel("S1 weight").fill("80");
  await page.getByLabel("S1 status").selectOption("resolved");
  await page.getByLabel("S1 resolved outcome").fill("Hold");
  await expect(publishButton).toBeDisabled();
  await page.getByRole("button", { name: "Prepare update anchor" }).click();
  await expect(page.getByRole("status")).toContainText("1 update anchor transaction prepared.");
  await expect(publishButton).toBeDisabled();
  await page.getByLabel("Update anchor transaction hash").fill("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  await expect(publishButton).toBeEnabled();
  await publishButton.click();

  expect(preparedRevisionPayloads).toHaveLength(1);
  expect(String(preparedRevisionPayloads[0].body)).toContain("Rates market repriced after CPI");
  expect(preparedRevisionPayloads[0]).toMatchObject({
    signalUpdates: [{ signalId: "sig-fed-hold", currentOdds: 0.74, weight: 80, status: "resolved", resolvedOutcomeLabel: "Hold" }],
  });
  await expect.poll(() => revisionPayloads.length).toBe(1);
  expect(revisionPayloads[0]).toMatchObject({
    dynamicUserId: author.dynamicUserId,
    xHandle: author.xHandle,
    walletAddress: author.walletAddress,
    walletSource: author.walletSource,
    note: "CPI update moved signal.",
    anchorPreparationId: "revision-anchor-detail-1",
    anchorTxHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    signalUpdates: [{ signalId: "sig-fed-hold", currentOdds: 0.74, weight: 80, status: "resolved", resolvedOutcomeLabel: "Hold" }],
  });
  expect(String(revisionPayloads[0].body)).toContain("Inflation prints are not soft enough");
  expect(String(revisionPayloads[0].body)).toContain("Rates market repriced after CPI");

  await expect(page.getByTestId("thesis-body")).toContainText("Rates market repriced after CPI");
  await expect(page.getByTestId("revision-card").first()).toContainText("v2");
  await expect(page.getByTestId("revision-card").first()).toContainText("CPI update moved signal.");
});
