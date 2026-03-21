import { Hono } from 'hono';

export const analyticsRoutes = new Hono();

type OnboardingAnalyticsPayload = {
  event?: string;
  page?: string;
  walletMode?: 'evalanche' | 'browser-wallet' | 'manual';
  walletAvailable?: boolean;
  walletConnected?: boolean;
  chainId?: number | null;
  ready?: boolean;
  needsApproval?: boolean;
  transactionCount?: number;
  error?: string;
  ts?: string;
};

analyticsRoutes.post('/onboarding', async (c) => {
  let body: OnboardingAnalyticsPayload;

  try {
    body = await c.req.json<OnboardingAnalyticsPayload>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.event || typeof body.event !== 'string') {
    return c.json({ error: 'Missing required field: event' }, 400);
  }

  console.log('[analytics:onboarding]', JSON.stringify({
    event: body.event,
    page: body.page ?? '/curators/register',
    walletMode: body.walletMode ?? 'manual',
    walletAvailable: body.walletAvailable ?? false,
    walletConnected: body.walletConnected ?? false,
    chainId: body.chainId ?? null,
    ready: body.ready ?? null,
    needsApproval: body.needsApproval ?? null,
    transactionCount: body.transactionCount ?? null,
    error: body.error ?? null,
    ts: body.ts ?? new Date().toISOString(),
  }));

  return c.json({ ok: true });
});
