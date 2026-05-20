import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalClaimMarketService } from "../src/services/claim-market.js";
import type { StorageService } from "../src/services/storage.js";

class MemoryStorageService implements StorageService {
  provider = "memory";
  private counter = 0;
  private readonly store = new Map<string, object>();

  async uploadJSON(data: object): Promise<string> {
    const uri = `memory://claim-packet-${this.counter++}`;
    this.store.set(uri, data);
    return uri;
  }

  async loadJSON<T>(uri: string): Promise<T | null> {
    return (this.store.get(uri) as T | undefined) ?? null;
  }
}

const cleanupDirs: string[] = [];

describe("claim market service", () => {
  afterEach(async () => {
    await Promise.all(
      cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("creates a durable claim record and dedupes repeated submissions", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-claims-"));
    cleanupDirs.push(dir);

    const service = new LocalClaimMarketService(join(dir, "index.json"), new MemoryStorageService());

    const first = await service.createClaim({
      sourcePlatform: "x",
      sourceRef: "https://x.com/evaprotocol/status/123",
      sourceUrl: "https://x.com/evaprotocol/status/123",
      authorHandle: "@evaprotocol",
      claimText: "Eva will open a public claim page for tagged X posts.",
      title: "Tagged X claims open public pages",
      createdBy: "0x1234000000000000000000000000000000000000",
      evidenceLinks: ["https://eva.jaack.me/claims"],
      context: "Seeded from an X mention ingestion test.",
      machineAssessment: {
        verdict: "verified",
        confidence: 82,
        summary: "The current roadmap already describes public claim pages.",
        evidenceCount: 1,
      },
    });

    const second = await service.createClaim({
      sourcePlatform: "x",
      sourceRef: "https://x.com/evaprotocol/status/123",
      claimText: "Eva will open a public claim page for tagged X posts.",
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.claim.claimId).toBe(first.claim.claimId);
    expect(first.claim.bundle).toMatchObject({
      claim: "Eva will open a public claim page for tagged X posts.",
      resolutionSource: "machine-assessment",
      evidence: ["https://eva.jaack.me/claims"],
      authorIdentity: {
        platform: "x",
        handle: "@evaprotocol",
        agentAddress: "0x1234000000000000000000000000000000000000",
      },
      confidence: 82,
      resolver: expect.any(String),
      finalOutcome: null,
      status: "open",
    });
    expect(first.claim.bundle.deadline).toEqual(expect.any(String));
    expect(first.claim.bundle.disputeWindow.endsAt).toEqual(expect.any(String));
    expect(first.claim.packets.metadata.uri).toMatch(/^memory:\/\//);
    expect(first.claim.machineAssessment?.verdict).toBe("verified");

    const listed = await service.listClaims();
    expect(listed.count).toBe(1);
    expect(listed.claims[0]?.claimId).toBe(first.claim.claimId);

    const persisted = JSON.parse(await readFile(join(dir, "index.json"), "utf8")) as {
      claims: Array<{ claimId: string }>;
    };
    expect(persisted.claims[0]?.claimId).toBe(first.claim.claimId);
    expect(persisted.claims[0]?.bundle).toMatchObject({
      claim: "Eva will open a public claim page for tagged X posts.",
      confidence: 82,
      status: "open",
    });
  });

  it("serializes concurrent claim creation so durable records are not clobbered", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-claims-"));
    cleanupDirs.push(dir);

    const service = new LocalClaimMarketService(join(dir, "index.json"), new MemoryStorageService());

    await Promise.all([
      service.createClaim({
        sourcePlatform: "manual",
        sourceRef: "manual-concurrent-1",
        claimText: "Concurrent claim one is retained.",
      }),
      service.createClaim({
        sourcePlatform: "manual",
        sourceRef: "manual-concurrent-2",
        claimText: "Concurrent claim two is retained.",
      }),
    ]);

    const listed = await service.listClaims();
    expect(listed.count).toBe(2);
    expect(listed.claims.map((claim) => claim.claimText).sort()).toEqual([
      "Concurrent claim one is retained.",
      "Concurrent claim two is retained.",
    ]);
  });

  it("builds stake, challenge, and settlement previews from stored claims", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-claims-"));
    cleanupDirs.push(dir);

    const service = new LocalClaimMarketService(join(dir, "index.json"), new MemoryStorageService());
    const created = await service.createClaim({
      sourcePlatform: "manual",
      sourceRef: "manual-claim-1",
      claimText: "Manual claims can be opened before the market contract is deployed.",
    });

    const stakePreview = await service.getStakePreview(created.claim.claimId, {
      amount: "50000000000000000000",
      verdict: "verified",
      confidenceBand: 77,
    });
    const challengePreview = await service.getChallengePreview(created.claim.claimId, {
      bondAmount: "10000000000000000000",
    });
    const settlementPreview = await service.getSettlementPreview(created.claim.claimId);

    expect(stakePreview?.warnings[0]).toContain("below the v0 market minimum");
    expect(challengePreview?.warnings[0]).toContain("below the v0 market minimum");
    expect(settlementPreview).toMatchObject({
      claimId: created.claim.claimId,
      settlementReady: false,
      participantCount: 0,
    });
  });
});
