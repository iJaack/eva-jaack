import type { PredictionMarket, Thesis } from "./api";

export type EvaUiStatus = "forecast" | "unresolved" | "verified" | "disputed" | "resolved" | "void";

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

export function scoreUiStatus(score: number): EvaUiStatus {
  if (score >= 75) return "verified";
  if (score >= 50) return "unresolved";
  if (score >= 25) return "disputed";
  return "void";
}
