"use client";

import Link from "next/link";
import { useEffect, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";

type CampaignTelemetryPayload = {
  campaign: string;
  action: string;
  cta: string;
  channel?: string;
  destination?: string;
  pagePath?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

declare global {
  interface Window {
    va?: (command: "event", name: string, payload?: CampaignTelemetryPayload) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function trackCampaignEvent(name: string, payload: CampaignTelemetryPayload) {
  if (typeof window === "undefined") return;

  const searchParams = new URLSearchParams(window.location.search);
  const enrichedPayload: CampaignTelemetryPayload = {
    ...payload,
    pagePath: window.location.pathname,
    referrer: document.referrer || undefined,
    utmSource: searchParams.get("utm_source") ?? undefined,
    utmMedium: searchParams.get("utm_medium") ?? undefined,
    utmCampaign: searchParams.get("utm_campaign") ?? undefined,
    utmContent: searchParams.get("utm_content") ?? undefined,
    utmTerm: searchParams.get("utm_term") ?? undefined,
  };

  window.va?.("event", name, enrichedPayload);
  window.dataLayer?.push({ event: name, ...enrichedPayload });
  window.dispatchEvent(new CustomEvent("eva:campaign", { detail: { name, ...enrichedPayload } }));
}

export function CampaignViewTracker({ campaign, channel = "campaign_page" }: { campaign: string; channel?: string }) {
  useEffect(() => {
    trackCampaignEvent("campaign_view", {
      campaign,
      action: "view",
      cta: "page_view",
      channel,
      destination: window.location.pathname,
    });
  }, [campaign, channel]);

  return null;
}

type CampaignLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  campaign: string;
  cta: string;
  channel?: string;
  eventName?: string;
  external?: boolean;
  children: ReactNode;
};

export function CampaignLink({
  href,
  campaign,
  cta,
  channel = "campaign_page",
  eventName = "campaign_cta_click",
  external = false,
  children,
  onClick,
  ...props
}: CampaignLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    trackCampaignEvent(eventName, {
      campaign,
      action: "click",
      cta,
      channel,
      destination: href,
    });
  };

  const trackedProps = {
    ...props,
    "data-campaign": campaign,
    "data-campaign-cta": cta,
    "data-campaign-channel": channel,
    onClick: handleClick,
  };

  if (external) {
    return (
      <a href={href} {...trackedProps}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...trackedProps}>
      {children}
    </Link>
  );
}
