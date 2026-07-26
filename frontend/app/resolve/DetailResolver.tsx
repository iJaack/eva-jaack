"use client";

import { usePathname, useSearchParams } from "next/navigation";
import MarketDetailClient from "@/app/markets/[marketId]/MarketDetailClient";
import PredictorDetailClient from "@/app/predictors/[id]/PredictorDetailClient";
import ThesisDetailClient from "@/app/thesis/[thesisId]/ThesisDetailClient";
import PageShell from "@/components/ui/PageShell";
import SectionHeader from "@/components/ui/SectionHeader";

type DetailKind = "market" | "predictor" | "thesis";

function detailFromPath(pathname: string): { kind: DetailKind | null; id: string | null } {
  const [, resource, ...idParts] = pathname.split("/");
  const id = idParts.length > 0 ? decodeURIComponent(idParts.join("/")) : null;
  if (resource === "markets") return { kind: "market", id };
  if (resource === "predictors") return { kind: "predictor", id };
  if (resource === "thesis") return { kind: "thesis", id };
  return { kind: null, id: null };
}

export default function DetailResolver() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathDetail = detailFromPath(pathname);
  const kind = (searchParams.get("kind") as DetailKind | null) ?? pathDetail.kind;
  const id = searchParams.get("id") ?? pathDetail.id;

  if (kind === "market" && id) return <MarketDetailClient marketId={id} />;
  if (kind === "predictor" && id) return <PredictorDetailClient id={id} />;
  if (kind === "thesis" && id) return <ThesisDetailClient thesisId={id} />;

  return (
    <PageShell>
      <SectionHeader
        eyebrow="Detail resolver"
        title="Choose a public Eva record."
        description="Open a market, predictor, or thesis from its public Eva URL."
      />
    </PageShell>
  );
}
