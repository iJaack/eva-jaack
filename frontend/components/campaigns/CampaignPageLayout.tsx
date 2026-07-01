import type { ReactNode } from "react";
import { CampaignViewTracker } from "@/components/CampaignTelemetry";
import FadeIn from "@/components/motion/FadeIn";
import PageShell from "@/components/ui/PageShell";

type CampaignPageLayoutProps = {
  campaign: string;
  channel: string;
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  heroActions: ReactNode;
  children: ReactNode;
};

export default function CampaignPageLayout({
  campaign,
  channel,
  eyebrow,
  title,
  description,
  heroActions,
  children,
}: CampaignPageLayoutProps) {
  return (
    <PageShell variant="page">
      <CampaignViewTracker campaign={campaign} channel={channel} />
      <FadeIn className="hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="hero-actions">{heroActions}</div>
      </FadeIn>
      {children}
    </PageShell>
  );
}
