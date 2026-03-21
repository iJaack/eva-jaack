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
  const configured = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (configured) return `${configured.replace(/\/$/, '')}/analytics/onboarding`;

  if (typeof window !== 'undefined') {
    const { protocol, host } = window.location;
    return `${protocol}//${host}/api/analytics/onboarding`;
  }

  return 'https://eva.jaack.me/api/analytics/onboarding';
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
