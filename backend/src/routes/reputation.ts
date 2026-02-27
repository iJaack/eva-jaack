import { Hono } from 'hono';
import {
  computeFeedbackHash,
  verifyReviewerSignature,
  type AggregatorRequest,
  type AggregatorResponse,
} from '../lib/x402-reputation.js';
import { giveFeedback } from '../lib/erc8004.js';
import type { Hex } from 'viem';

export const reputationRoutes = new Hono();

// ── POST /api/reputation/feedback ──────────────────────────────────────

reputationRoutes.post('/feedback', async (c) => {
  const req = await c.req.json<AggregatorRequest>();

  // 1. Recompute and verify feedbackHash
  const expectedHash = computeFeedbackHash(req.taskRef, req.dataHash);
  if (expectedHash !== req.feedbackHash) {
    return c.json<AggregatorResponse>(
      { success: false, feedbackHash: req.feedbackHash, error: 'feedbackHash mismatch' },
      400,
    );
  }

  // 2. Verify reviewer signature
  const sigValid = await verifyReviewerSignature(
    req.feedbackHash,
    req.reviewerAddress,
    req.signature,
  );
  if (!sigValid) {
    return c.json<AggregatorResponse>(
      { success: false, feedbackHash: req.feedbackHash, error: 'Invalid reviewer signature' },
      401,
    );
  }

  // 3. Score bounds check
  if (req.score < 0 || req.score > 100) {
    return c.json<AggregatorResponse>(
      { success: false, feedbackHash: req.feedbackHash, error: 'Score must be 0-100' },
      400,
    );
  }

  // 4. Submit on-chain via ReputationRegistry.addReputation
  try {
    const tag = `x402:feedback:${req.taskRef}`;
    const txHash = await giveFeedback(req.reviewerAddress, req.score, tag);

    return c.json<AggregatorResponse>({
      success: true,
      txHash,
      feedbackHash: req.feedbackHash,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json<AggregatorResponse>(
      { success: false, feedbackHash: req.feedbackHash, error: message },
      500,
    );
  }
});
