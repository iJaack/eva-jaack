import type { XMentionIngestResponse } from "../lib/api-types.js";
import type { ClaimMarketService } from "./claim-market.js";
import { getClaimMarketService, type ClaimCreateInput } from "./claim-market.js";

export interface XMentionEvent {
  mentionId: string;
  authorHandle: string;
  text: string;
  tweetUrl?: string | null;
  quotedTweetUrl?: string | null;
  replyToTweetId?: string | null;
  conversationId?: string | null;
  createdBy?: string | null;
}

type NormalizedXMention =
  | {
      accepted: true;
      input: ClaimCreateInput;
    }
  | {
      accepted: false;
      reason: string;
    };

const tweetUrlPattern = /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[^\s/]+\/status\/\d+/gi;
const spamPattern = /\b(airdrop|giveaway|follow\s+and\s+retweet|guaranteed\s+100x|dm\s+for\s+alpha)\b/i;

function cleanClaimText(text: string): string {
  return text
    .replace(tweetUrlPattern, " ")
    .replace(/@\w+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTweetUrls(text: string): string[] {
  return text.match(tweetUrlPattern) ?? [];
}

function selectSourceUrl(event: XMentionEvent): string | null {
  if (event.quotedTweetUrl?.trim()) return event.quotedTweetUrl.trim();

  const urls = extractTweetUrls(event.text);
  if (urls.length > 0) return urls[0]!;

  if (event.tweetUrl?.trim()) return event.tweetUrl.trim();
  if (event.replyToTweetId?.trim()) {
    return `https://x.com/i/web/status/${event.replyToTweetId.trim()}`;
  }

  return null;
}

function buildClaimTitle(claimText: string): string {
  return claimText.length > 72 ? `${claimText.slice(0, 69)}...` : claimText;
}

export function normalizeXMention(event: XMentionEvent): NormalizedXMention {
  const cleanedText = cleanClaimText(event.text);
  const urls = extractTweetUrls(event.text);
  const sourceUrl = selectSourceUrl(event);

  if (!event.mentionId.trim() || !event.authorHandle.trim()) {
    return {
      accepted: false,
      reason: "missing_required_fields",
    };
  }

  if (spamPattern.test(event.text) || urls.length > 3) {
    return {
      accepted: false,
      reason: "spam_or_rate_limited",
    };
  }

  if ((!sourceUrl && cleanedText.length < 12) || (sourceUrl && cleanedText.length < 3)) {
    return {
      accepted: false,
      reason: "not_enough_claim_context",
    };
  }
  const claimText = cleanedText || `Verify the referenced X claim at ${sourceUrl}`;

  return {
    accepted: true,
    input: {
      sourcePlatform: "x",
      sourceRef: sourceUrl ?? `mention:${event.mentionId}`,
      sourceUrl,
      authorHandle: event.authorHandle,
      conversationId: event.conversationId ?? null,
      claimText,
      title: buildClaimTitle(claimText),
      claimType: "factual",
      createdBy: event.createdBy ?? null,
      context: `Originated from X mention ${event.mentionId}`,
      evidenceLinks: sourceUrl ? [sourceUrl] : [],
    },
  };
}

export function buildAcknowledgementReply(claimId: string): string {
  const shortId = claimId.slice(0, 10);
  return `Logged for review on Eva. Claim ${shortId} now has a public page, and curator review can feed back into the trust graph.`;
}

export function buildResolutionReply(
  verdict: string,
  confidence: number | null,
  claimUrl: string,
): string {
  const confidenceText = confidence === null ? "without a confidence band" : `at ${confidence}% confidence`;
  return `Eva review recorded a provisional verdict of ${verdict} ${confidenceText}. Full context: ${claimUrl}`;
}

export class XChannelService {
  constructor(private readonly claims: ClaimMarketService = getClaimMarketService()) {}

  async ingestMention(event: XMentionEvent): Promise<XMentionIngestResponse> {
    const normalized = normalizeXMention(event);
    if (normalized.accepted === false) {
      return {
        accepted: false,
        created: false,
        reason: normalized.reason,
        acknowledgement: null,
        claimId: null,
        claimUrl: null,
      };
    }

    const result = await this.claims.createClaim(normalized.input);
    const claimUrl = `/claims/${result.claim.claimId}`;

    return {
      accepted: true,
      created: result.created,
      reason: null,
      acknowledgement: buildAcknowledgementReply(result.claim.claimId),
      claimId: result.claim.claimId,
      claimUrl,
    };
  }
}

let cachedXChannelService: XChannelService | null = null;

export function getXChannelService(): XChannelService {
  if (!cachedXChannelService) {
    cachedXChannelService = new XChannelService();
  }

  return cachedXChannelService;
}
