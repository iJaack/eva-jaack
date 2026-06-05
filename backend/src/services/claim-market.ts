import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { protocol } from "../protocol.js";
import type {
  ClaimChallengePreviewResponse,
  ClaimBundleDto,
  ClaimCreateResponse,
  ClaimFundingDto,
  ClaimListResponse,
  ClaimMarketActionabilityDto,
  ClaimMachineAssessmentDto,
  ClaimMarketDetailResponse,
  ClaimPacketRefDto,
  ClaimSettlementPreviewResponse,
  ClaimSourcePlatform,
  ClaimStakePreviewResponse,
  ClaimVerdict,
  CuratorMarketActivityDto,
  MarketClaimStatus,
} from "../lib/api-types.js";
import { getStorageService, type StorageService } from "./storage.js";

export interface ClaimCreateInput {
  sourcePlatform: ClaimSourcePlatform;
  sourceRef: string;
  sourceUrl?: string | null;
  authorHandle?: string | null;
  conversationId?: string | null;
  claimText: string;
  title?: string | null;
  claimType?: string | null;
  createdBy?: string | null;
  context?: string | null;
  evidenceLinks?: string[];
  machineAssessment?: {
    verdict: ClaimVerdict;
    confidence: number;
    summary: string;
    evidenceCount: number;
  } | null;
}

export interface ClaimStakePreviewInput {
  amount: string | number;
  verdict: ClaimVerdict;
  confidenceBand?: number;
}

export interface ClaimChallengePreviewInput {
  bondAmount: string | number;
}

export interface ClaimMarketService {
  listClaims(): Promise<ClaimListResponse>;
  createClaim(input: ClaimCreateInput): Promise<ClaimCreateResponse>;
  getClaim(claimId: string): Promise<ClaimMarketDetailResponse | null>;
  getStakePreview(claimId: string, input: ClaimStakePreviewInput): Promise<ClaimStakePreviewResponse | null>;
  getChallengePreview(
    claimId: string,
    input: ClaimChallengePreviewInput,
  ): Promise<ClaimChallengePreviewResponse | null>;
  getSettlementPreview(claimId: string): Promise<ClaimSettlementPreviewResponse | null>;
  getCuratorMarketActivity(curatorAddress: string): Promise<CuratorMarketActivityDto>;
}

type ClaimStore = {
  claims: StoredClaim[];
};

type StoredClaim = Omit<ClaimMarketDetailResponse, "bundle" | "marketActionability"> & {
  bundle?: ClaimBundleDto;
};

const defaultClaimIndexPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../.data/eva-claims/index.json",
);
const zeroFunding: ClaimFundingDto = {
  feePool: "0",
  sponsorPool: "0",
  protocolTopUpPool: "0",
  challengeBondPool: "0",
  slashedPool: "0",
  protocolFeeAccrued: "0",
  totalStaked: "0",
};
const emptyPacket: ClaimPacketRefDto = {
  uri: null,
  hash: null,
  generatedAt: null,
};
const minimumStake = "100000000000000000000";
const minimumChallengeBond = "50000000000000000000";

function isMarketEnabled(): boolean {
  return protocol.market.enabled && config.evaVerificationMarket !== "0x0000000000000000000000000000000000000000";
}

function marketActionability(): ClaimMarketActionabilityDto {
  if (!isMarketEnabled()) {
    return {
      status: "disabled",
      label: "Market staged",
      description: "The verification market is disabled or missing a configured contract address.",
      marketAddress: null,
      adapterAddress: null,
      transactionPreparation: false,
      onchainReadback: false,
    };
  }

  return {
    status: "offchain-preview",
    label: "Preview only",
    description:
      "Verification market contracts are configured, but claim actions remain preview-only until backend transaction preparation and onchain readback are enabled.",
    marketAddress: config.evaVerificationMarket,
    adapterAddress: config.evaVerificationReputationAdapter,
    transactionPreparation: false,
    onchainReadback: false,
  };
}

function stableHash(data: unknown): string {
  return `0x${createHash("sha256").update(JSON.stringify(data)).digest("hex")}`;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function claimIdFor(input: ClaimCreateInput): string {
  return stableHash({
    sourcePlatform: input.sourcePlatform,
    sourceRef: normalizeText(input.sourceRef).toLowerCase(),
    claimText: normalizeText(input.claimText).toLowerCase(),
  });
}

function excerptFor(text: string): string {
  return text.length > 156 ? `${text.slice(0, 153)}...` : text;
}

function titleFor(input: ClaimCreateInput): string {
  const title = input.title?.trim();
  if (title) return title;
  return input.claimText.length > 88 ? `${input.claimText.slice(0, 85)}...` : input.claimText;
}

function addSeconds(isoDate: string, seconds: number): string {
  return new Date(new Date(isoDate).getTime() + seconds * 1000).toISOString();
}

function normalizeTokenAmount(value: string | number, fieldName: string): string {
  const raw = String(value).trim();
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${fieldName} must be an integer wei amount`);
  }
  return raw;
}

function normalizeConfidence(value: number | undefined): number | null {
  if (value === undefined || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.trunc(value)));
}

function openStatus(status: MarketClaimStatus): boolean {
  return status === "open" || status === "under_review" || status === "contested";
}

function zeroAddressToNull(value: string): string | null {
  return /^0x0{40}$/i.test(value) ? null : value;
}

function conflictFlagsFor(claim: StoredClaim): string[] {
  const flags: string[] = [];

  if (claim.evidenceLinks.length === 0) {
    flags.push("missing-evidence");
  }

  if (!claim.machineAssessment) {
    flags.push("missing-machine-assessment");
  } else {
    if (claim.machineAssessment.confidence < 60) {
      flags.push("low-confidence");
    }
    if (claim.machineAssessment.verdict === "mixed" || claim.machineAssessment.verdict === "misleading") {
      flags.push("conflicting-signals");
    }
    if (
      claim.machineAssessment.verdict === "unverifiable_yet" ||
      claim.machineAssessment.verdict === "non_falsifiable"
    ) {
      flags.push("requires-human-resolution");
    }
  }

  if (claim.challenges.some((challenge) => challenge.status === "open")) {
    flags.push("open-dispute");
  }

  return flags;
}

function bundleFor(claim: StoredClaim): ClaimBundleDto {
  const reviewDeadline = addSeconds(claim.createdAt, protocol.market.reviewWindowSeconds);
  const disputeWindowEnd = addSeconds(
    claim.createdAt,
    protocol.market.reviewWindowSeconds + protocol.market.challengeWindowSeconds,
  );

  return {
    claim: claim.claimText,
    deadline: reviewDeadline,
    resolutionSource: claim.resolution.resolutionRoot
      ? "resolution-root"
      : claim.machineAssessment
        ? "machine-assessment"
        : null,
    evidence: claim.evidenceLinks,
    authorIdentity: {
      platform: claim.source.platform,
      sourceRef: claim.source.ref,
      handle: claim.source.authorHandle,
      agentAddress: claim.createdBy,
    },
    confidence: claim.resolution.confidenceBand ?? claim.machineAssessment?.confidence ?? null,
    conflictFlags: conflictFlagsFor(claim),
    resolver: zeroAddressToNull(protocol.market.resolverAddress),
    disputeWindow: {
      opensAt: reviewDeadline,
      endsAt: disputeWindowEnd,
    },
    finalOutcome: claim.resolution.verdict,
    status: claim.status,
  };
}

async function packetFor(storage: StorageService, data: object | null, name: string): Promise<ClaimPacketRefDto> {
  if (!data) return { ...emptyPacket };

  const generatedAt = new Date().toISOString();
  const packet = { ...data, generatedAt };
  const uri = await storage.uploadJSON(packet, { name });
  return {
    uri,
    hash: stableHash(packet),
    generatedAt,
  };
}

export class LocalClaimMarketService implements ClaimMarketService {
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly indexPath = defaultClaimIndexPath,
    private readonly storage: StorageService = getStorageService(),
  ) {}

  async listClaims(): Promise<ClaimListResponse> {
    const store = await this.readStore();
    const claims = store.claims
      .map((claim) => this.withRuntimeFlags(claim))
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

    return {
      count: claims.length,
      chain: protocol.chain.name.toLowerCase().includes("avalanche") ? "avalanche" : protocol.chain.name,
      chainId: protocol.chain.id,
      marketEnabled: isMarketEnabled(),
      marketActionability: marketActionability(),
      claims,
    };
  }

  async createClaim(input: ClaimCreateInput): Promise<ClaimCreateResponse> {
    this.validateCreateInput(input);

    return this.enqueueMutation(async () => {
      const store = await this.readStore();
      const claimId = claimIdFor(input);
      const existing = store.claims.find((claim) => claim.claimId === claimId);
      if (existing) {
        return {
          created: false,
          claim: this.withRuntimeFlags(existing),
        };
      }

      const createdAt = new Date().toISOString();
      const machineAssessment: ClaimMachineAssessmentDto | null = input.machineAssessment
        ? {
            ...input.machineAssessment,
            generatedAt: createdAt,
          }
        : null;
      const metadataPacket = await packetFor(
        this.storage,
        {
          claimId,
          sourcePlatform: input.sourcePlatform,
          sourceRef: input.sourceRef,
          claimText: input.claimText,
          claimType: input.claimType ?? "factual",
        },
        `eva-claim-${claimId.slice(2, 12)}-metadata`,
      );
      const evidencePacket = await packetFor(
        this.storage,
        input.evidenceLinks?.length ? { evidenceLinks: input.evidenceLinks } : null,
        `eva-claim-${claimId.slice(2, 12)}-evidence`,
      );
      const machinePacket = await packetFor(
        this.storage,
        machineAssessment,
        `eva-claim-${claimId.slice(2, 12)}-machine`,
      );

      const claim = this.withRuntimeFlags({
        claimId,
        title: titleFor(input),
        excerpt: excerptFor(input.claimText),
        claimText: input.claimText,
        claimType: input.claimType ?? "factual",
        status: "open",
        createdAt,
        updatedAt: createdAt,
        source: {
          platform: input.sourcePlatform,
          ref: input.sourceRef,
          url: input.sourceUrl ?? null,
          authorHandle: input.authorHandle ?? null,
          conversationId: input.conversationId ?? null,
        },
        machineAssessment,
        funding: { ...zeroFunding },
        participantCount: 0,
        leadingVerdict: machineAssessment?.verdict ?? null,
        marketEnabled: isMarketEnabled(),
        createdBy: input.createdBy ?? null,
        context: input.context ?? null,
        evidenceLinks: input.evidenceLinks ?? [],
        packets: {
          metadata: metadataPacket,
          evidence: evidencePacket,
          machineAssessment: machinePacket,
          resolution: { ...emptyPacket },
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
            at: createdAt,
            note: "A canonical claim page was created for the trust graph and market layer.",
          },
        ],
      });

      store.claims.push(claim);
      await this.writeStore(store);

      return {
        created: true,
        claim,
      };
    });
  }

  async getClaim(claimId: string): Promise<ClaimMarketDetailResponse | null> {
    const store = await this.readStore();
    const claim = store.claims.find((entry) => entry.claimId === claimId);
    return claim ? this.withRuntimeFlags(claim) : null;
  }

  async getStakePreview(claimId: string, input: ClaimStakePreviewInput): Promise<ClaimStakePreviewResponse | null> {
    const claim = await this.getClaim(claimId);
    if (!claim) return null;

    const amount = normalizeTokenAmount(input.amount, "amount");
    const warnings = [];
    if (BigInt(amount) < BigInt(minimumStake)) {
      warnings.push("Stake amount is below the v0 market minimum.");
    }
    if (!isMarketEnabled()) {
      warnings.push("The onchain market is not deployed yet, so this is a preflight preview only.");
    }

    return {
      claimId,
      marketEnabled: isMarketEnabled(),
      source: "offchain-preview",
      marketActionability: marketActionability(),
      requiresRegisteredCurator: true,
      amount,
      verdict: input.verdict,
      confidenceBand: normalizeConfidence(input.confidenceBand),
      minimumStake,
      reviewDeadline: addSeconds(claim.createdAt, protocol.market.reviewWindowSeconds),
      challengeWindowEnd: addSeconds(claim.createdAt, protocol.market.reviewWindowSeconds + protocol.market.challengeWindowSeconds),
      warnings,
    };
  }

  async getChallengePreview(
    claimId: string,
    input: ClaimChallengePreviewInput,
  ): Promise<ClaimChallengePreviewResponse | null> {
    const claim = await this.getClaim(claimId);
    if (!claim) return null;

    const bondAmount = normalizeTokenAmount(input.bondAmount, "bondAmount");
    const warnings = [];
    if (BigInt(bondAmount) < BigInt(minimumChallengeBond)) {
      warnings.push("Challenge bond is below the v0 market minimum.");
    }
    if (!isMarketEnabled()) {
      warnings.push("Challenge actions are staged until the market contract is deployed.");
    }

    return {
      claimId,
      marketEnabled: isMarketEnabled(),
      source: "offchain-preview",
      marketActionability: marketActionability(),
      requiresRegisteredCurator: true,
      bondAmount,
      minimumChallengeBond,
      challengeWindowEnd: addSeconds(claim.createdAt, protocol.market.reviewWindowSeconds + protocol.market.challengeWindowSeconds),
      warnings,
    };
  }

  async getSettlementPreview(claimId: string): Promise<ClaimSettlementPreviewResponse | null> {
    const claim = await this.getClaim(claimId);
    if (!claim) return null;

    return {
      claimId,
      marketEnabled: isMarketEnabled(),
      marketActionability: marketActionability(),
      settlementReady: claim.status === "soft_resolved" || claim.status === "final_resolved",
      finalVerdict: claim.resolution.verdict,
      totalStake: claim.funding.totalStaked,
      totalEligibleRewardPool: "0",
      totalProtocolFee: claim.funding.protocolFeeAccrued,
      challengeBonusPool: "0",
      participantCount: claim.participantCount,
      leadingVerdict: claim.leadingVerdict,
      funding: claim.funding,
    };
  }

  async getCuratorMarketActivity(curatorAddress: string): Promise<CuratorMarketActivityDto> {
    const normalized = curatorAddress.toLowerCase();
    const store = await this.readStore();
    const createdClaims = store.claims.filter((claim) => claim.createdBy?.toLowerCase() === normalized);

    return {
      claimsCreated: createdClaims.length,
      openClaims: createdClaims.filter((claim) => openStatus(claim.status)).length,
      resolvedClaims: createdClaims.filter((claim) => claim.status === "soft_resolved" || claim.status === "final_resolved").length,
    };
  }

  private validateCreateInput(input: ClaimCreateInput): void {
    if (!input.sourcePlatform || !["x", "farcaster", "web", "manual"].includes(input.sourcePlatform)) {
      throw new Error("Missing or invalid sourcePlatform");
    }
    if (!input.sourceRef.trim()) {
      throw new Error("Missing required sourceRef");
    }
    if (!input.claimText.trim()) {
      throw new Error("Missing required claimText");
    }
  }

  private withRuntimeFlags(claim: StoredClaim): ClaimMarketDetailResponse {
    return {
      ...claim,
      marketEnabled: isMarketEnabled(),
      marketActionability: marketActionability(),
      bundle: bundleFor(claim),
    };
  }

  private async readStore(): Promise<ClaimStore> {
    try {
      const raw = await readFile(this.indexPath, "utf8");
      const parsed = JSON.parse(raw) as ClaimStore;
      return {
        claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      };
    } catch {
      return { claims: [] };
    }
  }

  private async writeStore(store: ClaimStore): Promise<void> {
    await mkdir(dirname(this.indexPath), { recursive: true });
    await writeFile(this.indexPath, JSON.stringify(store, null, 2), "utf8");
  }

  private enqueueMutation<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.mutationQueue.then(operation, operation);
    this.mutationQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
}

let cachedClaimMarketService: ClaimMarketService | null = null;

export function getClaimMarketService(): ClaimMarketService {
  if (!cachedClaimMarketService) {
    cachedClaimMarketService = new LocalClaimMarketService(config.storageDir ? resolve(config.storageDir, "claims.json") : defaultClaimIndexPath);
  }

  return cachedClaimMarketService;
}
