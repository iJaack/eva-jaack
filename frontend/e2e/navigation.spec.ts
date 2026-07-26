import { expect, test } from "@playwright/test";

test("primary navigation stays focused on the thesis product", async ({ page }) => {
  await page.goto("/");

  const header = page.locator("header.topbar");
  const isMobile = (page.viewportSize()?.width ?? 0) < 640;

  await expect(header.getByText("Eva Protocol")).toBeVisible();
  if (isMobile) {
    await header.getByRole("button", { name: "Open menu" }).click();
  }

  await expect(header.getByRole("link", { name: "Markets" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Compose" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Predictors" })).toBeVisible();
  await expect(header.getByRole("link", { name: "$EVA" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Campaigns" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Evidence" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Claims" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Register" })).toHaveCount(0);

  await expect(page.locator(".participation-dock")).toHaveCount(0);

  const footer = page.locator("footer.site-footer");
  await expect(footer.getByText("Public theses with inspectable sources, revisions, authorship, and anchors.")).toBeVisible();
  await expect(footer.getByRole("link", { name: "Markets" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Compose" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Predictors" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "$EVA", exact: true })).toBeVisible();
  await expect(footer.getByRole("link", { name: /\$EVA contract/ })).toHaveAttribute(
    "href",
    /0x6Ae3b236d5546369db49AFE3AecF7e32c5F27672/,
  );
  await expect(footer.getByRole("link", { name: "Verify" })).toHaveCount(0);
  await expect(footer.getByRole("link", { name: "Claims" })).toHaveCount(0);
  await expect(footer.getByRole("link", { name: "GitHub" })).toBeVisible();
});

test("skip link appears on keyboard focus and targets the main content", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeVisible();
});

test("trust receipts campaign page carries measurable launch CTAs", async ({ page }) => {
  await page.goto("/campaigns/trust-receipts");

  await expect(page.getByRole("heading", { name: "prediction markets need trust receipts." })).toBeVisible();
  await expect(page.getByText("trust receipts convert better than generic prediction-market copy.")).toBeVisible();

  await expect(page.getByRole("link", { name: "Draft a thesis" })).toHaveAttribute(
    "href",
    /utm_campaign=trust_receipts_launch.*utm_content=draft_thesis/,
  );
  await expect(page.getByRole("link", { name: "Read the example" })).toHaveAttribute(
    "href",
    /utm_campaign=trust_receipts_launch.*utm_content=read_example/,
  );
  await expect(page.getByRole("link", { name: "Follow @evapredicts" })).toHaveAttribute(
    "href",
    "https://x.com/evapredicts",
  );
  await expect(page.getByRole("link", { name: "Find live signals" })).toHaveAttribute(
    "href",
    /utm_campaign=trust_receipts_launch.*utm_content=find_signals/,
  );
  await expect(page.getByRole("heading", { name: "one post, one example, one measurable CTA." })).toBeVisible();
  await expect(page.getByText("prediction markets need trust receipts, not just screenshots.")).toBeVisible();
  await expect(page.locator("blockquote").getByText(/utm_content=launch_post/)).toBeVisible();
});

test("launch truth status page carries transparent campaign CTAs", async ({ page }) => {
  await page.goto("/campaigns/launch-truth-status");

  await expect(page.getByRole("heading", { name: "launch status should be a receipt, not a vibe." })).toBeVisible();
  await expect(page.getByText("transparent launch gates will convert better than premature certainty.")).toBeVisible();

  await expect(page.getByRole("link", { name: "Read proof thesis" })).toHaveAttribute(
    "href",
    /utm_campaign=launch_truth_status.*utm_content=spacex_proof/,
  );
  await expect(page.getByRole("link", { name: "Review policy gate" })).toHaveAttribute(
    "href",
    /utm_campaign=launch_truth_status.*utm_content=policy_safe_page/,
  );
  await expect(page.getByRole("link", { name: "Follow @evapredicts" })).toHaveAttribute(
    "href",
    /https:\/\/x\.com\/evapredicts.*utm_campaign=launch_truth_status/,
  );
  await expect(page.getByText("what @evapredicts will not hand-wave.")).toBeVisible();
  await expect(page.locator("blockquote").getByText(/utm_content=status_post/)).toBeVisible();
});

test("source quality sprint page carries measurable campaign CTAs", async ({ page }) => {
  await page.goto("/campaigns/source-quality-sprint");

  await expect(page.getByRole("heading", { name: "prediction feeds need source quality, not louder calls." })).toBeVisible();
  await expect(page.getByText("source-quality framing will create higher-intent clicks than generic launch copy.")).toBeVisible();

  await expect(page.getByRole("link", { name: "Inspect proof thesis" })).toHaveAttribute(
    "href",
    /utm_campaign=source_quality_sprint.*utm_content=read_spacex_source_record/,
  );
  await expect(page.getByRole("link", { name: "Inspect sources" })).toHaveAttribute(
    "href",
    /utm_campaign=source_quality_sprint.*utm_content=inspect_source_library/,
  );
  await expect(page.getByRole("link", { name: "Follow @evapredicts" })).toHaveAttribute(
    "href",
    /https:\/\/x\.com\/evapredicts.*utm_campaign=source_quality_sprint/,
  );
  await expect(page.getByRole("link", { name: "Draft sourced thesis" })).toHaveAttribute(
    "href",
    /utm_campaign=source_quality_sprint.*utm_content=draft_source_quality_thesis/,
  );
  await expect(page.getByText("make source quality the public ask.")).toBeVisible();
  await expect(page.locator("blockquote").getByText(/utm_content=source_quality_post/)).toBeVisible();
});

test("prediction memory page tracks the campaign view and CTA clicks", async ({ page }) => {
  await page.addInitScript(() => {
    window.addEventListener("eva:campaign", (event) => {
      const campaignEvent = event as CustomEvent;
      ((window as Window & { __evaCampaignEvents?: unknown[] }).__evaCampaignEvents ??= []).push(
        campaignEvent.detail,
      );
    });
  });

  await page.goto("/campaigns/prediction-memory");

  await expect(
    page.getByRole("heading", { name: "prediction markets price the moment. Eva remembers the thesis." }),
  ).toBeVisible();

  await page.waitForFunction(() =>
    (window as Window & { __evaCampaignEvents?: Array<{ name?: string; campaign?: string; channel?: string }> })
      .__evaCampaignEvents?.some(
        (event) =>
          event.name === "campaign_view" &&
          event.campaign === "prediction_memory" &&
          event.channel === "prediction_memory_page",
      ),
  );

  await expect(page.getByRole("link", { name: "Read proof thesis" })).toHaveAttribute(
    "data-campaign-cta",
    "read_proof_thesis",
  );
  await expect(page.getByRole("link", { name: "Read proof thesis" })).toHaveAttribute(
    "href",
    /utm_campaign=prediction_memory.*utm_content=spacex_proof/,
  );
  await expect(page.getByRole("link", { name: "Follow @evapredicts" })).toHaveAttribute(
    "data-campaign-channel",
    "prediction_memory_hero",
  );
  await expect(page.getByRole("link", { name: "Follow @evapredicts" })).toHaveAttribute(
    "href",
    /https:\/\/x\.com\/evapredicts.*utm_campaign=prediction_memory/,
  );
  await expect(page.getByRole("link", { name: "Start a thesis record" })).toHaveAttribute(
    "data-campaign-cta",
    "start_thesis_record",
  );
});

test("verifier adoption campaign page carries proof-first CTAs", async ({ page }) => {
  await page.goto("/campaigns/verifier-adoption");

  await expect(page.getByRole("heading", { name: "forecasts need verifiers before they need virality." })).toBeVisible();
  await expect(page.getByText("verifier-minded builders will click proof before they click hype.")).toBeVisible();

  await expect(page.getByRole("link", { name: "Read proof record" })).toHaveAttribute(
    "href",
    /utm_campaign=verifier_adoption.*utm_content=spacex_proof_record/,
  );
  await expect(page.getByRole("link", { name: "Inspect signals" })).toHaveAttribute(
    "href",
    /utm_campaign=verifier_adoption.*utm_content=inspect_market_signals/,
  );
  await expect(page.getByRole("link", { name: "Open agent manifest" })).toHaveAttribute(
    "href",
    /utm_campaign=verifier_adoption.*utm_content=agent_manifest/,
  );
  await expect(page.getByRole("link", { name: "Start verifiable thesis" }).first()).toHaveAttribute(
    "href",
    /utm_campaign=verifier_adoption.*utm_content=start_verifiable_thesis/,
  );
  await expect(page.locator("blockquote").getByText(/utm_content=verifier_post/)).toBeVisible();
});

test("forecast provenance campaign page carries provenance-first CTAs", async ({ page }) => {
  await page.goto("/campaigns/forecast-provenance");

  await expect(page.getByRole("heading", { name: "the missing field in AI forecasts is provenance." })).toBeVisible();
  await expect(page.getByText("provenance converts better than generic AI prediction claims.")).toBeVisible();

  await expect(page.getByRole("link", { name: "Inspect author records" })).toHaveAttribute(
    "href",
    /utm_campaign=forecast_provenance.*utm_content=inspect_author_records/,
  );
  await expect(page.getByRole("link", { name: "Read proof record" })).toHaveAttribute(
    "href",
    /utm_campaign=forecast_provenance.*utm_content=spacex_proof_record/,
  );
  await expect(page.getByRole("link", { name: "Open agent manifest" })).toHaveAttribute(
    "href",
    /utm_campaign=forecast_provenance.*utm_content=agent_manifest/,
  );
  await expect(page.getByRole("link", { name: "Start provenance thesis" }).first()).toHaveAttribute(
    "href",
    /utm_campaign=forecast_provenance.*utm_content=start_provenance_thesis/,
  );
  await expect(page.locator("blockquote").getByText(/utm_content=provenance_post/)).toBeVisible();
});

test("campaign hub routes active campaign traffic with measurable CTAs", async ({ page }) => {
  await page.goto("/campaigns");

  await expect(page.getByRole("heading", { name: "one protocol-proof angle, one proof path, one metric." })).toBeVisible();
  await expect(page.getByText("campaign choice should be judged by proof-path intent, not impressions.")).toBeVisible();

  await expect(page.getByRole("link", { name: "Open protocol proof" })).toHaveAttribute(
    "data-campaign-cta",
    "open_current_wedge",
  );
  await expect(page.getByRole("link", { name: "Open protocol proof" })).toHaveAttribute(
    "href",
    /utm_campaign=campaign_hub.*utm_content=protocol_proof_card/,
  );
  await expect(page.getByRole("link", { name: "Read proof record" })).toHaveAttribute(
    "href",
    /utm_campaign=campaign_hub.*utm_content=spacex_proof_record/,
  );
  await expect(page.getByRole("link", { name: "Follow @evapredicts" })).toHaveAttribute(
    "data-campaign-channel",
    "campaign_hub_hero",
  );
  await expect(page.getByText("posting approval blocked")).toBeVisible();
  await expect(page.getByText("no fake launch certainty.")).toBeVisible();
});
