import { Hono } from 'hono';
import { keccak256, toHex, type Hex } from 'viem';
import { avalanche } from 'viem/chains';
import {
  computeFeedbackHash,
  verifyReviewerSignature,
  type AggregatorRequest,
  type AggregatorResponse,
} from '../lib/x402-reputation.js';
import { giveFeedbackAbi } from '../lib/erc8004.js';
import { config } from '../config.js';
import { getSignerService } from '../services/signer.js';

export const reputationRoutes = new Hono();

reputationRoutes.post('/feedback', async (c) => {
  const req = await c.req.json<Partial<AggregatorRequest>>();

  if (
    typeof req.taskRef !== 'string' ||
    typeof req.dataHash !== 'string' ||
    typeof req.feedbackHash !== 'string' ||
    typeof req.reviewerAddress !== 'string' ||
    typeof req.signature !== 'string' ||
    typeof req.score !== 'number'
  ) {
    return c.json<AggregatorResponse>(
      {
        success: false,
        feedbackHash: (req.feedbackHash as Hex | undefined) ?? ('0x' as Hex),
        error: 'Missing required feedback fields',
      },
      400,
    );
  }

  const expectedHash = computeFeedbackHash(req.taskRef, req.dataHash as Hex);
  if (expectedHash !== req.feedbackHash) {
    return c.json<AggregatorResponse>(
      { success: false, feedbackHash: req.feedbackHash, error: 'feedbackHash mismatch' },
      400,
    );
  }

  const sigValid = await verifyReviewerSignature(req.feedbackHash, req.reviewerAddress, req.signature);
  if (!sigValid) {
    return c.json<AggregatorResponse>(
      { success: false, feedbackHash: req.feedbackHash, error: 'Invalid reviewer signature' },
      401,
    );
  }

  if (req.score < 0 || req.score > 100) {
    return c.json<AggregatorResponse>(
      { success: false, feedbackHash: req.feedbackHash, error: 'Score must be 0-100' },
      400,
    );
  }

  try {
    const signer = getSignerService();
    const agentId = BigInt(config.evaAgentId);
    const feedbackURI = `x402:feedback:${req.taskRef}`;
    const onchainHash = keccak256(toHex(feedbackURI));
    const endpoint = req.endpoint ?? '';

    const txHash = await signer.writeContract({
      address: config.erc8004Reputation,
      abi: giveFeedbackAbi,
      functionName: 'giveFeedback',
      args: [agentId, BigInt(req.score), 0, 'x402', 'feedback', endpoint, feedbackURI, onchainHash],
      chain: avalanche,
    });

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
