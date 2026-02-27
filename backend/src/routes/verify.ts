import { Hono } from 'hono';
import { computeInteractionHash } from '../lib/x402-reputation.js';
import { config } from '../config.js';
import type { Hex } from 'viem';

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

  // With payment → stub verification pipeline
  // TODO: integrate real x402 facilitator verification
  const body = await c.req.json<{ url?: string; content?: string }>();

  const dataHash = '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex;
  const taskRef = `stub:${Date.now()}:/api/verify:43114`;
  const interactionHash = computeInteractionHash(taskRef, dataHash);

  return c.json({
    verified: true,
    result: {
      summary: 'Verification pipeline stub — full implementation pending',
      url: body.url ?? null,
    },
    interactionHash,
    agentRegistry: `eip155:43114:${config.erc8004Identity}`,
    agentId: config.evaAgentId,
    taskRef,
  });
});
