import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalClaimMarketService } from "../src/services/claim-market.js";
import type { StorageService } from "../src/services/storage.js";
import { XChannelService, buildResolutionReply, normalizeXMention } from "../src/services/x-channel.js";

class MemoryStorageService implements StorageService {
  provider = "memory";
  private counter = 0;

  async uploadJSON(): Promise<string> {
    return `memory://x-channel-${this.counter++}`;
  }

  async loadJSON<T>(): Promise<T | null> {
    return null;
  }
}

const cleanupDirs: string[] = [];

describe("x channel service", () => {
  afterEach(async () => {
    await Promise.all(cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("normalizes reply, quote, and pasted tweet references into claims", () => {
    const reply = normalizeXMention({
      mentionId: "100",
      authorHandle: "@alice",
      text: "@eva can you verify this reply",
      replyToTweetId: "123456789",
    });
    const quote = normalizeXMention({
      mentionId: "101",
      authorHandle: "@alice",
      text: "@eva quote check",
      quotedTweetUrl: "https://x.com/eva/status/555",
    });
    const pasted = normalizeXMention({
      mentionId: "102",
      authorHandle: "@alice",
      text: "@eva verify this https://x.com/eva/status/999",
    });

    expect(reply.accepted && reply.input.sourceUrl).toContain("/123456789");
    expect(quote.accepted && quote.input.sourceUrl).toBe("https://x.com/eva/status/555");
    expect(pasted.accepted && pasted.input.sourceUrl).toBe("https://x.com/eva/status/999");
  });

  it("dedupes duplicate mentions against the same deterministic claim id", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-x-channel-"));
    cleanupDirs.push(dir);

    const claims = new LocalClaimMarketService(join(dir, "index.json"), new MemoryStorageService());
    const service = new XChannelService(claims);

    const first = await service.ingestMention({
      mentionId: "200",
      authorHandle: "@alice",
      text: "@eva verify this https://x.com/eva/status/42",
    });
    const second = await service.ingestMention({
      mentionId: "201",
      authorHandle: "@alice",
      text: "@eva verify this https://x.com/eva/status/42",
    });

    expect(first.accepted).toBe(true);
    expect(first.created).toBe(true);
    expect(second.accepted).toBe(true);
    expect(second.created).toBe(false);
    expect(second.claimId).toBe(first.claimId);
  });

  it("rejects malformed and spammy mentions", () => {
    const malformed = normalizeXMention({
      mentionId: "300",
      authorHandle: "@alice",
      text: "@eva hi",
    });
    const spam = normalizeXMention({
      mentionId: "301",
      authorHandle: "@alice",
      text: "@eva guaranteed 100x airdrop follow and retweet now",
    });

    expect(malformed).toMatchObject({ accepted: false, reason: "not_enough_claim_context" });
    expect(spam).toMatchObject({ accepted: false, reason: "spam_or_rate_limited" });
  });

  it("builds a resolution reply string for follow-up publishing", () => {
    const reply = buildResolutionReply("verified", 86, "https://eva.jaack.me/claims/0x123");
    expect(reply).toContain("verified");
    expect(reply).toContain("86%");
    expect(reply).toContain("https://eva.jaack.me/claims/0x123");
  });
});
