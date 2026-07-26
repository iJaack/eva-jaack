import type { Metadata } from "next";
import { Suspense } from "react";
import PageShell from "@/components/ui/PageShell";
import SectionHeader from "@/components/ui/SectionHeader";
import DetailResolver from "./DetailResolver";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function ResolverFallback() {
  return (
    <PageShell>
      <SectionHeader
        eyebrow="Eva public record"
        title="Loading the proof."
        description="Resolving the requested market, predictor, or thesis."
      />
    </PageShell>
  );
}

export default function ResolveDetailPage() {
  return (
    <Suspense fallback={<ResolverFallback />}>
      <DetailResolver />
    </Suspense>
  );
}
