import { Hono } from 'hono';
import { computeInteractionHash } from '../lib/x402-reputation.js';
import { config } from '../config.js';
import { runVerificationPipeline } from '../services/pipeline.js';
import { keccak256, toHex, type Hex } from 'viem';

export const verifyRoutes = new Hono();

// ── POST /api/verify ───────────────────────────────────────────────────

verifyRoutes.post('/', async (c) => {
  const paymentResponse = c.req.header('PAYMENT-RESPONSE');

  // No payment → 402 with requirements
  if (!paymentResponse) {
    return c.json(
      {
        error: 'Payment required',
        x402: {
          version: '1',
          accepts: [
            {
              scheme: 'exact',
              network: 'base',
              maxAmountRequired: '50000',          // 0.05 USDC (6 decimals)
              resource: `${config.x402FacilitatorUrl}/verify`,
              description: 'Eva Protocol — article verification',
              mimeType: 'application/json',
              payTo: config.x402RecipientAddress,
              extra: {
                name: 'USDC',
                decimals: 6,
              },
            },
          ],
        },
      },
      402,
    );
  }

  // With payment → run real verification pipeline
  const body = await c.req.json<{ url?: string; content?: string }>();

  if (!body.url) {
    return c.json({ error: 'Missing required field: url' }, 400);
  }

  try {
    const result = await runVerificationPipeline(body.url);

    const dataHash = keccak256(toHex(JSON.stringify(result.report)));
    const taskRef = `${dataHash.slice(0, 18)}:/api/verify:43114`;
    const interactionHash = computeInteractionHash(taskRef, dataHash);

    return c.json({
      verified: true,
      result: {
        overallScore: result.overallScore,
        claimCount: result.claimCount,
        routescanClaimCount: result.routescanClaimCount,
        ipfsURI: result.ipfsURI,
        report: result.report,
      },
      interactionHash,
      agentRegistry: `eip155:43114:${config.erc8004Identity}`,
      agentId: config.evaAgentId,
      taskRef,
    });
  } catch (e) {
    console.error(`[verify] Pipeline failed: ${e}`);
    return c.json(
      { error: 'Verification pipeline failed', details: String(e) },
      500,
    );
  }
});
