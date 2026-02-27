import { keccak256, encodePacked, verifyMessage, type Hex } from 'viem';

// ── Types ──────────────────────────────────────────────────────────────

export interface InteractionData {
  taskRef: string;
  dataHash: Hex;
  timestamp: number;
}

export interface Review {
  feedbackHash: Hex;
  reviewerAddress: `0x${string}`;
  score: number;       // 0-100
  comment: string;
  signature: Hex;
}

export interface ProofOfParticipation {
  interactionHash: Hex;
  taskRef: string;
  agentAddress: `0x${string}`;
  timestamp: number;
}

export interface AggregatorRequest {
  feedbackHash: Hex;
  reviewerAddress: `0x${string}`;
  score: number;
  comment: string;
  signature: Hex;
  taskRef: string;
  dataHash: Hex;
}

export interface AggregatorResponse {
  success: boolean;
  txHash?: Hex;
  feedbackHash: Hex;
  error?: string;
}

// ── Hash helpers ───────────────────────────────────────────────────────

const DOMAIN_TAG = 'x402:8004-reputation:v1';

export function computeInteractionHash(taskRef: string, dataHash: Hex): Hex {
  return keccak256(
    encodePacked(
      ['string', 'string', 'bytes32'],
      [DOMAIN_TAG, taskRef, dataHash],
    ),
  );
}

export function computeFeedbackHash(taskRef: string, dataHash: Hex): Hex {
  return keccak256(
    encodePacked(
      ['string', 'string', 'bytes32'],
      [DOMAIN_TAG, taskRef, dataHash],
    ),
  );
}

// ── Task reference builder ─────────────────────────────────────────────

export function buildTaskRef(
  txHash: Hex,
  endpoint: string,
  chainId: number,
): string {
  const pathname = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${txHash}:${pathname}:${chainId}`;
}

// ── Signature verification ─────────────────────────────────────────────

export async function verifyReviewerSignature(
  feedbackHash: Hex,
  reviewerAddress: `0x${string}`,
  signature: Hex,
): Promise<boolean> {
  return verifyMessage({
    address: reviewerAddress,
    message: feedbackHash,
    signature,
  });
}
