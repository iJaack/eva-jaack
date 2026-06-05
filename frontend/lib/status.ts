import type { MarketClaim, MarketClaimDetail, PredictionMarket, Thesis } from "./api";

export type EvaUiStatus = "forecast" | "unresolved" | "verified" | "disputed" | "resolved" | "void";

type ClaimStatusInput = {
  status: MarketClaim["status"];
  machineAssessment: MarketClaim["machineAssessment"];
  resolution?: MarketClaimDetail["resolution"];
};

export function statusLabel(status: EvaUiStatus): string {
  switch (status) {
    case "forecast":
      return "Forecast";
    case "unresolved":
      return "Unresolved";
    case "verified":
      return "Verified";
    case "disputed":
      return "Disputed";
    case "resolved":
      return "Resolved";
    case "void":
      return "Void";
  }
}

export function statusClassName(status: EvaUiStatus): string {
  return `status-chip status-chip-${status}`;
}

export function marketUiStatus(market: Pick<PredictionMarket, "status">): EvaUiStatus {
  if (market.status === "resolved") return "resolved";
  if (market.status === "cancelled") return "void";
  return "forecast";
}

type ThesisStatusInput = Pick<Thesis, "status"> & {
  resolution?: {
    reputationImpact?: string | null;
  } | null;
};

export function thesisUiStatus(thesis: ThesisStatusInput): EvaUiStatus {
  if (thesis.status === "resolved") return "resolved";
  if (thesis.status === "withdrawn" || thesis.status === "invalid") return "void";
  if (thesis.resolution?.reputationImpact === "negative") return "disputed";
  return "unresolved";
}

export function claimUiStatus(claim: ClaimStatusInput): EvaUiStatus {
  if (claim.status === "cancelled" || claim.status === "archived") return "void";
  if (claim.status === "contested") return "disputed";
  if (claim.status === "soft_resolved" || claim.status === "final_resolved") return "resolved";

  const resolution = claim.resolution ?? null;
  if (resolution?.verdict === "verified" || resolution?.verdict === "likely_true") return "verified";
  if (resolution?.verdict === "mixed" || resolution?.verdict === "misleading" || resolution?.verdict === "likely_false" || resolution?.verdict === "false") {
    return "disputed";
  }

  if (claim.machineAssessment?.verdict === "verified" || claim.machineAssessment?.verdict === "likely_true") return "verified";
  if (
    claim.machineAssessment?.verdict === "mixed" ||
    claim.machineAssessment?.verdict === "misleading" ||
    claim.machineAssessment?.verdict === "likely_false" ||
    claim.machineAssessment?.verdict === "false"
  ) {
    return "disputed";
  }

  return "unresolved";
}

export function scoreUiStatus(score: number): EvaUiStatus {
  if (score >= 75) return "verified";
  if (score >= 50) return "unresolved";
  if (score >= 25) return "disputed";
  return "void";
}
