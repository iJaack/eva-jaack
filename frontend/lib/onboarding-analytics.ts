import { getApiBase } from "./protocol";

export type OnboardingAnalyticsEvent = {
  event: string;
  page?: string;
  walletMode?: 'evalanche' | 'browser-wallet' | 'manual';
  walletAvailable?: boolean;
  walletConnected?: boolean;
  chainId?: number | null;
  ready?: boolean;
  needsApproval?: boolean;
  transactionCount?: number;
  error?: string;
};

function getAnalyticsEndpoint(): string {
  return `${getApiBase()}/analytics/onboarding`;
}

export async function trackOnboardingEvent(payload: OnboardingAnalyticsEvent): Promise<void> {
  const body = JSON.stringify({
    ...payload,
    ts: new Date().toISOString(),
  });

  const url = getAnalyticsEndpoint();

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }

    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch {
    // analytics must never break onboarding UX
  }
}
