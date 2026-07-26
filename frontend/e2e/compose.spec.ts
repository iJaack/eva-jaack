import { expect, test, type Page } from "@playwright/test";

const embeddedWalletAddress = "0x0fe61780bd5508b3C99e420662050e5560608cA4";
const externalWalletAddress = "0x1111111111111111111111111111111111111111";

type DynamicTestContext = { primaryWallet: unknown; user: unknown };

const embeddedDynamicContext: DynamicTestContext = {
  primaryWallet: { address: embeddedWalletAddress, connector: { key: "dynamic-embedded-wallet" } },
  user: {
    userId: "dyn-spacethesis",
    verifiedCredentials: [
      { oauthProvider: "twitter", username: "spacethesis" },
      { address: embeddedWalletAddress, walletProvider: "dynamic embedded wallet" },
    ],
  },
};

async function seedDynamicContext(page: Page, context: DynamicTestContext = embeddedDynamicContext) {
  await page.addInitScript((dynamicContext) => {
    (window as Window & { __evaDynamicContext?: unknown }).__evaDynamicContext = dynamicContext;
  }, context);
}

const marketsPayload = {
  count: 1,
  markets: [
    {
      marketId: "fed-hold",
      provider: "external",
      externalId: "fed-hold",
      url: "https://example.com/market/fed-hold",
      title: "Will the Fed hold rates at the next meeting?",
      category: "Macro",
      status: "open",
      volumeUsd: 1_000_000,
      liquidityUsd: 250_000,
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
};

test("compose hides the preview identity and editor until Dynamic identity is ready", async ({ page }) => {
  await page.route("**/api/markets", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(marketsPayload) });
  });

  await page.goto("/compose");

  await expect(page.getByTestId("compose-auth-gate")).toBeVisible();
  await expect(page.getByTestId("compose-auth-gate")).toContainText(/Connect with Dynamic before/);
  await expect(page.getByText("@spacethesis")).toHaveCount(0);
  await expect(page.getByText("embedded wallet")).toHaveCount(0);
  await expect(page.getByLabel("Thesis title")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish anchored thesis" })).toHaveCount(0);
});

test("Dynamic auth consumers hydrate inside their provider boundary", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.route("**/api/markets", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(marketsPayload) });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "public predictions need proof objects." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect Dynamic test" })).toBeVisible();

  await page.goto("/compose");
  await expect(page.getByTestId("compose-auth-gate")).toBeVisible();
  await expect(page.getByTestId("compose-auth-gate").getByRole("button", { name: "Connect Dynamic test" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("compose page guides required thesis inputs before enabling publish", async ({ page }) => {
  let publishedBody = "";
  let publishedAnchorPreparationId = "";
  const preparedPayloads: Array<Record<string, unknown>> = [];

  await seedDynamicContext(page);

  await page.route("**/api/markets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketsPayload),
    });
  });

  await page.route("**/api/theses", async (route) => {
    const request = route.request();
    const payload = request.postDataJSON();
    publishedBody = payload.body;
    publishedAnchorPreparationId = payload.anchorPreparationId;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        created: true,
        thesis: {
          thesisId: "thesis-fed-hold",
          slug: "fed-hold-liquidity-thesis",
          title: "Fed hold liquidity thesis",
          body: payload.body,
          author: {
            dynamicUserId: "local-dynamic-preview",
            xHandle: "@spacethesis",
            xProfileId: "local-x-preview",
            walletAddress: "0x0fe61780bd5508b3C99e420662050e5560608cA4",
            walletSource: "embedded",
          },
          currentRevision: {
            revisionId: "rev-fed-hold-1",
            version: 1,
            body: "The next CPI print is still too sticky for a cut.",
            note: "Thesis published with initial signal basket.",
            signalSnapshot: [],
            scoreBefore: null,
            scoreAfter: 50,
            createdAt: "2026-04-22T00:00:00.000Z",
            anchor: { status: "unanchored", txHash: null, contractAddress: null, preparedAt: null, confirmedAt: null },
          },
          revisions: [],
          signals: [
            {
              signalId: "sig-fed-hold",
              kind: "prediction_market",
              role: "core",
              title: "Will the Fed hold rates at the next meeting?",
              rationale: "Primary market signal for this evolving thesis.",
              weight: 60,
              signalScore: 50,
              addedAt: "2026-04-22T00:00:00.000Z",
              updatedAt: "2026-04-22T00:00:00.000Z",
              anchor: { status: "unanchored", txHash: null, contractAddress: null, preparedAt: null, confirmedAt: null },
              marketId: "fed-hold",
              provider: "external",
              externalId: "fed-hold",
              marketUrl: "https://example.com/market/fed-hold",
              selectedOutcomeId: "hold",
              selectedOutcomeLabel: "Hold",
              resolvedOutcomeLabel: null,
              oddsAtAdd: 0.58,
              currentOdds: 0.58,
              status: "open",
            },
          ],
          currentScore: 50,
          timeline: [],
          evidenceLinks: ["https://example.com/source"],
          sourceUrl: null,
          sourcePostUrl: null,
          counterToThesisId: null,
          copiedCount: 0,
          challengedCount: 0,
          status: "active",
          anchor: { status: "unanchored", txHash: null, contractAddress: null, preparedAt: null, confirmedAt: null },
          createdAt: "2026-04-22T00:00:00.000Z",
          updatedAt: "2026-04-22T00:00:00.000Z",
        },
        markets: marketsPayload.markets,
      }),
    });
  });

  await page.route("**/api/thesis-drafts/protocol/prepare-anchor", async (route) => {
    const payload = route.request().postDataJSON();
    preparedPayloads.push(payload);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        anchorPreparationId: "draft-anchor-compose-1",
        thesisId: "thesis-fed-hold",
        anchorStatus: "prepared",
        transactions: [],
      }),
    });
  });

  await page.goto("/compose");

  const publishButton = page.getByRole("button", { name: "Publish anchored thesis" });
  await expect(page.getByRole("heading", { name: "Thesis body" })).toBeVisible();
  await expect(page.getByTestId("compose-identity-panel")).toContainText("Ready to publish");
  await expect(page.getByTestId("compose-identity-panel")).toContainText("embedded");
  await expect(publishButton).toBeDisabled();
  await page.getByLabel("Thesis title").fill("");
  await expect(publishButton).toBeDisabled();

  await page.getByLabel("Thesis title").fill("Fed hold liquidity thesis");
  await page.getByLabel("Thesis block 1").fill("The next CPI print is still too sticky for a cut.");
  await page.getByLabel("Primary market signal").selectOption("fed-hold");
  await page.getByLabel("Outcome").selectOption("Hold");
  await page.getByLabel("Lateral fact signal").fill("CPI is still running above target.");
  await page.getByLabel("Fact source URL").fill("https://example.com/source");

  await expect(page.getByText("Prediction signal: Will the Fed hold rates at the next meeting?")).toBeVisible();
  await page.getByRole("button", { name: "Attach market signal" }).click();
  await page.getByRole("button", { name: "Attach fact signal" }).click();
  await page.getByRole("button", { name: "Cite S1 in draft" }).click();
  await page.getByRole("button", { name: "Cite S2 in draft" }).click();

  const draftBody = page.getByLabel("Thesis block 1");
  await expect(draftBody).toHaveValue(/\[S1\]/);
  await expect(draftBody).toHaveValue(/\[S2\]/);
  await expect(page.getByRole("heading", { name: "Reader view" })).toBeVisible();
  await expect(page.getByTestId("compose-preview-body")).toContainText("[S1]");

  await page.getByRole("button", { name: "Prepare anchor" }).click();
  expect(preparedPayloads).toHaveLength(1);
  expect(String(preparedPayloads[0].body)).toContain("[S1]");
  await expect(publishButton).toBeDisabled();
  await page.getByLabel("Anchor transaction hash").fill("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  await expect(publishButton).toBeEnabled();

  await publishButton.click();

  expect(publishedBody).toContain("[S1]");
  expect(publishedBody).toContain("[S2]");
  expect(publishedAnchorPreparationId).toBe("draft-anchor-compose-1");
  await expect(page.getByRole("heading", { name: "Fed hold liquidity thesis" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open thesis" })).toBeVisible();
});

test("compose supports private structured block drafts with anchored signal citations before publishing", async ({ page }) => {
  const publishedPayloads: Array<Record<string, unknown>> = [];
  const preparedPayloads: Array<Record<string, unknown>> = [];

  await seedDynamicContext(page);

  await page.route("**/api/markets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketsPayload),
    });
  });

  await page.route("**/api/theses", async (route) => {
    const payload = route.request().postDataJSON();
    publishedPayloads.push(payload);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        created: true,
        thesis: {
          thesisId: "thesis-fed-hold",
          slug: "fed-hold-liquidity-thesis",
          title: payload.title,
          body: payload.body,
          author: {
            dynamicUserId: "local-dynamic-preview",
            xHandle: "@spacethesis",
            xProfileId: "local-x-preview",
            walletAddress: "0x0fe61780bd5508b3C99e420662050e5560608cA4",
            walletSource: "embedded",
          },
          currentRevision: {
            revisionId: "rev-fed-hold-1",
            version: 1,
            body: payload.body,
            note: "Anchored thesis published from private draft.",
            signalSnapshot: [],
            scoreBefore: null,
            scoreAfter: 50,
            createdAt: "2026-04-22T00:00:00.000Z",
            anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-22T00:00:00.000Z", confirmedAt: null },
          },
          revisions: [],
          signals: [
            {
              signalId: "sig-fed-hold",
              kind: "prediction_market",
              role: "core",
              title: "Will the Fed hold rates at the next meeting?",
              rationale: "Primary market signal for this evolving thesis.",
              weight: 60,
              signalScore: 50,
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
              oddsAtAdd: 0.58,
              currentOdds: 0.58,
              status: "open",
            },
          ],
          currentScore: 50,
          timeline: [],
          evidenceLinks: ["https://example.com/source"],
          sourceUrl: null,
          sourcePostUrl: null,
          counterToThesisId: null,
          copiedCount: 0,
          challengedCount: 0,
          status: "active",
          anchor: { status: "prepared", txHash: null, contractAddress: null, preparedAt: "2026-04-22T00:00:00.000Z", confirmedAt: null },
          createdAt: "2026-04-22T00:00:00.000Z",
          updatedAt: "2026-04-22T00:00:00.000Z",
        },
        markets: marketsPayload.markets,
      }),
    });
  });

  await page.route("**/api/thesis-drafts/protocol/prepare-anchor", async (route) => {
    const payload = route.request().postDataJSON();
    preparedPayloads.push(payload);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        anchorPreparationId: "draft-anchor-compose-2",
        thesisId: "thesis-fed-hold",
        anchorStatus: "prepared",
        transactions: [],
      }),
    });
  });

  await page.goto("/compose");

  await expect(page.getByRole("heading", { name: "Thesis body" })).toBeVisible();
  await expect(page.getByTestId("compose-identity-panel")).toContainText("@spacethesis");
  await expect(page.getByLabel("Thesis block 1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add block" })).toBeVisible();

  const publishButton = page.getByRole("button", { name: "Publish anchored thesis" });
  await expect(publishButton).toBeDisabled();
  await expect(page.getByText("Prepare anchor before publishing")).toBeVisible();

  await page.getByLabel("Thesis title").fill("Fed hold liquidity thesis");
  await page.getByLabel("Thesis block 1").fill("The next CPI print is still too sticky for a cut.");
  await page.getByRole("button", { name: "Add block" }).click();
  await page.getByLabel("Thesis block 2").fill("Liquidity should stay trapped until the rate path gets clearer.");

  await page.getByLabel("Primary market signal").selectOption("fed-hold");
  await page.getByLabel("Outcome").selectOption("Hold");
  await page.getByLabel("Lateral fact signal").fill("CPI is still running above target.");
  await page.getByLabel("Fact source URL").fill("https://example.com/source");

  await page.getByRole("button", { name: "Attach market signal" }).click();
  await page.getByRole("button", { name: "Attach fact signal" }).click();
  await expect(page.getByTestId("attached-signals")).toContainText("S1");
  await expect(page.getByTestId("attached-signals")).toContainText("S2");

  await page.getByRole("button", { name: "Cite S1 in draft" }).click();
  await expect(page.getByLabel("Thesis block 1")).toHaveValue(/\[S1\]/);
  await expect(page.getByTestId("compose-preview-body")).toContainText("[S1]");

  await page.getByRole("button", { name: "Move S2 up" }).click();
  const signalCards = page.getByTestId("attached-signal-card");
  await expect(signalCards.first()).toContainText("S2");

  await page.getByRole("button", { name: "Save private draft" }).click();
  await expect(page.getByText("Private draft saved")).toBeVisible();
  await expect(publishedPayloads).toHaveLength(0);

  await page.getByRole("button", { name: "Prepare anchor" }).click();
  expect(preparedPayloads).toHaveLength(1);
  expect(String(preparedPayloads[0].body)).toContain("[S1]");
  await expect(page.getByTestId("compose-draft-state")).toHaveText("Anchor prepared");
  await expect(publishButton).toBeDisabled();
  await expect(page.getByText("Confirm anchor transaction before publishing")).toBeVisible();
  await page.getByLabel("Anchor transaction hash").fill("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  await expect(publishButton).toBeEnabled();

  await publishButton.click();
  expect(publishedPayloads).toHaveLength(1);
  expect(String(publishedPayloads[0].body)).toContain("[S1]");
  expect(publishedPayloads[0].anchorPreparationId).toBe("draft-anchor-compose-2");
  expect(publishedPayloads[0].anchorTxHash).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  await expect(page.getByRole("heading", { name: "Fed hold liquidity thesis" })).toBeVisible();
});

test("compose maps external Dynamic X and wallet identity into prepared anchor payloads", async ({ page }) => {
  const preparedPayloads: Array<Record<string, unknown>> = [];

  await seedDynamicContext(page, {
    primaryWallet: { address: externalWalletAddress, connector: { key: "metamask" } },
    user: {
      userId: "dyn-macrodesk",
      verifiedCredentials: [
        { oauthProvider: "twitter", username: "macrodesk" },
        { address: externalWalletAddress, walletProvider: "metamask" },
      ],
    },
  });

  await page.route("**/api/markets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketsPayload),
    });
  });

  await page.route("**/api/thesis-drafts/protocol/prepare-anchor", async (route) => {
    preparedPayloads.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        anchorPreparationId: "draft-anchor-external-wallet",
        thesisId: "thesis-fed-hold",
        anchorStatus: "prepared",
        transactions: [],
      }),
    });
  });

  await page.goto("/compose");

  await expect(page.getByTestId("compose-identity-panel")).toContainText("Ready to publish");
  await expect(page.getByTestId("compose-identity-panel")).toContainText("@macrodesk");
  await expect(page.getByTestId("compose-identity-panel")).toContainText("external");

  await page.getByLabel("Thesis title").fill("External wallet thesis");
  await page.getByLabel("Thesis block 1").fill("External wallet authorship should flow into anchor preparation.");
  await page.getByLabel("Primary market signal").selectOption("fed-hold");
  await page.getByLabel("Outcome").selectOption("Hold");
  await page.getByRole("button", { name: "Attach market signal" }).click();
  await page.getByRole("button", { name: "Prepare anchor" }).click();

  expect(preparedPayloads).toHaveLength(1);
  expect(preparedPayloads[0]).toMatchObject({
    dynamicUserId: "dyn-macrodesk",
    xHandle: "@macrodesk",
    xProfileId: "dyn-macrodesk",
    walletAddress: externalWalletAddress,
    walletSource: "external",
  });
});

test("compose blocks Dynamic sessions without X or wallet identity", async ({ page }) => {
  await seedDynamicContext(page, {
    primaryWallet: { address: externalWalletAddress, connector: { key: "metamask" } },
    user: { userId: "dyn-no-x", verifiedCredentials: [{ address: externalWalletAddress, walletProvider: "metamask" }] },
  });

  await page.route("**/api/markets", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(marketsPayload) });
  });

  await page.goto("/compose");
  await expect(page.getByTestId("compose-auth-gate")).toContainText("Connect an X account in Dynamic before publishing a thesis.");
  await expect(page.getByText("@spacethesis")).toHaveCount(0);
  await expect(page.getByLabel("Thesis title")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Prepare anchor" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish anchored thesis" })).toHaveCount(0);

  await page.addInitScript(() => {
    (window as Window & { __evaDynamicContext?: unknown }).__evaDynamicContext = {
      primaryWallet: null,
      user: { userId: "dyn-no-wallet", verifiedCredentials: [{ oauthProvider: "twitter", username: "spacethesis" }] },
    };
  });
  await page.goto("/compose?case=missing-wallet");
  await expect(page.getByTestId("compose-auth-gate")).toContainText("Connect or create an Ethereum wallet before publishing a thesis.");
  await expect(page.getByLabel("Thesis title")).toHaveCount(0);
});
