import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalPredictionLayerService } from "../src/services/prediction-layer.js";
import { sampleCurator } from "./fixtures.js";

const cleanupDirs: string[] = [];

describe("prediction layer service", () => {
  afterEach(async () => {
    await Promise.all(cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
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
});
