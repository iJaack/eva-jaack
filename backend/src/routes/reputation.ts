import { Hono } from 'hono';
import { keccak256, toHex, type Hex } from 'viem';
import {
  computeFeedbackHash,
  verifyReviewerSignature,
  type AggregatorRequest,
  type AggregatorResponse,
} from '../lib/x402-reputation.js';
import { giveFeedback } from '../lib/erc8004.js';
import { config } from '../config.js';

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

  // 4. Submit on-chain via ReputationRegistry.giveFeedback
  try {
    const agentId = BigInt(config.evaAgentId);
    const feedbackURI = `x402:feedback:${req.taskRef}`;
    const onchainHash = keccak256(toHex(feedbackURI));
    const endpoint = req.endpoint ?? '';

    const txHash = await giveFeedback(
      agentId,
      BigInt(req.score),
      0,
      'x402',
      'feedback',
      endpoint,
      feedbackURI,
      onchainHash,
    );

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
