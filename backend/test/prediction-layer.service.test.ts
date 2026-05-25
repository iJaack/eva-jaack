import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalPredictionLayerService } from "../src/services/prediction-layer.js";
import { sampleCurator } from "./fixtures.js";

const cleanupDirs: string[] = [];

describe("prediction layer service", () => {
  afterEach(async () => {
    await Promise.all(cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
    vi.unstubAllGlobals();
  });

  it("creates offchain theses and aggregates unclaimed predictor profiles", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => [], async () => []);

    const created = await service.createThesis({
      authorHandle: "evapredictor",
      marketTitle: "Will the first Eva thesis card get shared on X?",
      selectedOutcomeLabel: "Yes",
      rationale: "The X-native card is the core acquisition object.",
      evidenceLinks: ["https://eva.jaack.me"],
      sourcePostUrl: "https://x.com/evapredicts/status/1",
    });

    const predictors = await service.listPredictors();
    const detail = await service.getThesis(created.thesis.thesisId);

    expect(created.created).toBe(true);
    expect(created.thesis.authorHandle).toBe("@evapredictor");
    expect(created.market.provider).toBe("manual");
    expect(predictors.predictors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          handle: "@evapredictor",
          profileState: "unclaimed",
          trustScore: 50,
        }),
      ]),
    );
    expect(detail?.market.title).toBe("Will the first Eva thesis card get shared on X?");
  });

  it("uses registered trust graph identity when a thesis wallet is claimed", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => [sampleCurator], async () => []);

    await service.createThesis({
      authorHandle: "@registeredalpha",
      authorWallet: sampleCurator.address,
      authorAgentId: sampleCurator.curatorAgentId,
      marketId: "crude-oil-95-window",
      selectedOutcomeId: "yes",
      rationale: "A claimed predictor should inherit graph-backed trust.",
    });

    const predictor = await service.getPredictor("@registeredalpha");

    expect(predictor?.predictor).toMatchObject({
      registered: true,
      wallet: sampleCurator.address,
      trustScore: sampleCurator.trustScore,
    });
  });

  it("ingests only explicit @evapredicts commands and dedupes repeated mentions", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => [], async () => []);

    const first = await service.ingestXCommand({
      mentionId: "mention-1",
      authorHandle: "@nairlof",
      text: "@evapredicts track this crude oil thesis",
      tweetUrl: "https://x.com/nairlof/status/1",
    });
    const second = await service.ingestXCommand({
      mentionId: "mention-1",
      authorHandle: "@nairlof",
      text: "@evapredicts track this crude oil thesis",
      tweetUrl: "https://x.com/nairlof/status/1",
    });
    const ignored = await service.ingestXCommand({
      mentionId: "mention-2",
      authorHandle: "@nairlof",
      text: "@evapredicts stop",
    });

    expect(first.accepted).toBe(true);
    expect(first.thesis?.authorHandle).toBe("@nairlof");
    expect(second.command.commandId).toBe(first.command.commandId);
    expect(ignored.accepted).toBe(false);
    expect(ignored.command.status).toBe("ignored");
  });

  it("filters provider markets that violate the conservative v1 risk policy", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);
    const service = new LocalPredictionLayerService(
      join(dir, "index.json"),
      async () => [],
      async () => [
        {
          marketId: "polymarket-presidential-nomination",
          provider: "polymarket",
          externalId: "politics-1",
          url: "https://polymarket.com/event/will-example-win-the-presidential-nomination",
          title: "Will Example win the 2028 presidential nomination?",
          category: "Politics",
          status: "open",
          volumeUsd: 10_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.12 },
            { outcomeId: "no", label: "No", price: 0.88 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-super-bowl",
          provider: "polymarket",
          externalId: "sports-1",
          url: "https://polymarket.com/event/will-example-win-the-game",
          title: "Will Example win the game?",
          category: "Sports",
          status: "open",
          volumeUsd: 9_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.45 },
            { outcomeId: "no", label: "No", price: 0.55 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "kalshi-fed-hold",
          provider: "kalshi",
          externalId: "macro-1",
          url: "https://kalshi.com/markets/fed-hold",
          title: "Will the Fed hold rates at the next meeting?",
          category: "Macro",
          status: "open",
          volumeUsd: 8_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.58 },
            { outcomeId: "no", label: "No", price: 0.42 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          marketId: "polymarket-foreign-leader",
          provider: "polymarket",
          externalId: "unclassified-1",
          url: "https://polymarket.com/event/will-example-be-the-leader-of-exampleland",
          title: "Will Example be the leader of Exampleland by end of 2026?",
          category: "Polymarket",
          status: "open",
          volumeUsd: 7_000_000,
          liquidityUsd: 1_000_000,
          closeTime: null,
          outcomes: [
            { outcomeId: "yes", label: "Yes", price: 0.2 },
            { outcomeId: "no", label: "No", price: 0.8 },
          ],
          linkedClaimIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    );

    const markets = await service.listMarkets();
    const summary = await service.getSummary();

    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-presidential-nomination");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-super-bowl");
    expect(markets.markets.map((market) => market.marketId)).not.toContain("polymarket-foreign-leader");
    expect(markets.markets.map((market) => market.marketId)).toContain("kalshi-fed-hold");
    expect(summary.markets.map((market) => market.marketId)).not.toContain("polymarket-presidential-nomination");
  });

  it("discovers real provider markets from targeted Polymarket search and Kalshi series feeds", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-predictions-"));
    cleanupDirs.push(dir);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes("gamma-api.polymarket.com/markets")) {
          return new Response(
            JSON.stringify([
              {
                id: "politics-1",
                question: "Will Example win the 2028 presidential nomination?",
                slug: "will-example-win-the-presidential-nomination",
                category: "Politics",
                outcomes: JSON.stringify(["Yes", "No"]),
                outcomePrices: JSON.stringify(["0.12", "0.88"]),
                volumeNum: "10000000",
                liquidityNum: "1000000",
                active: true,
                closed: false,
                createdAt: "2026-05-01T00:00:00.000Z",
                updatedAt: "2026-05-24T00:00:00.000Z",
              },
            ]),
            { status: 200 },
          );
        }
        if (url.includes("gamma-api.polymarket.com/public-search") && url.includes("bitcoin")) {
          return new Response(
            JSON.stringify({
              events: [
                {
                  title: "When will Bitcoin hit $150k?",
                  markets: [
                    {
                      id: "573652",
                      question: "Will Bitcoin hit $150k by September 30?",
                      slug: "will-bitcoin-hit-150k-by-september-30",
                      outcomes: JSON.stringify(["Yes", "No"]),
                      outcomePrices: JSON.stringify(["0.27", "0.73"]),
                      volumeNum: "778900.33",
                      liquidityNum: "49842.41",
                      active: true,
                      closed: false,
                      endDate: "2026-09-30T23:59:59.000Z",
                      createdAt: "2026-05-01T00:00:00.000Z",
                      updatedAt: "2026-05-24T00:00:00.000Z",
                    },
                  ],
                },
              ],
            }),
            { status: 200 },
          );
        }
        if (url.includes("external-api.kalshi.com/trade-api/v2/markets") && url.includes("series_ticker=KXCPI")) {
          return new Response(
            JSON.stringify({
              markets: [
                {
                  ticker: "KXCPI-26MAY-T0.8",
                  title: "CPI inflation in May?",
                  yes_bid_dollars: "0.1200",
                  yes_ask_dollars: "0.1600",
                  volume_dollars: "1000.00",
                  liquidity_dollars: "250.00",
                  close_time: "2026-06-10T12:25:00Z",
                  created_time: "2026-04-10T19:00:45.996047Z",
                  updated_time: "2026-05-24T00:00:00.000Z",
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ markets: [] }), { status: 200 });
      }),
    );

    const service = new LocalPredictionLayerService(join(dir, "index.json"), async () => []);

    const markets = await service.listMarkets();

    expect(markets.markets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          marketId: "polymarket-will-bitcoin-hit-150k-by-september-30",
          provider: "polymarket",
          title: "Will Bitcoin hit $150k by September 30?",
        }),
        expect.objectContaining({
          marketId: "kalshi-kxcpi-26may-t0-8",
          provider: "kalshi",
          title: "CPI inflation in May?",
        }),
      ]),
    );
  });
});
