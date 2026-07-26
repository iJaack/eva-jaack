import { z } from "zod";

export const thesisSignalRoleValues = ["core", "lateral", "second_order", "third_order", "hedge", "contradiction"] as const;
export const predictionMarketStatusValues = ["open", "closed", "resolved", "cancelled"] as const;
export const claimVerdictValues = [
  "verified",
  "likely_true",
  "mixed",
  "misleading",
  "likely_false",
  "false",
  "unverifiable_yet",
  "non_falsifiable",
] as const;

export const thesisSignalRoleSchema = z.enum(thesisSignalRoleValues);
export const predictionMarketStatusSchema = z.enum(predictionMarketStatusValues);
export const claimVerdictSchema = z.enum(claimVerdictValues);
export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "walletAddress must be a full 0x-prefixed EVM address");

export const searchMarketsToolSchema = {
  query: z.string().optional(),
} satisfies z.ZodRawShape;

export const predictionSignalInputSchema = z.object({
  marketId: z.string().optional(),
  marketTitle: z.string().optional(),
  marketUrl: z.string().url().optional(),
  selectedOutcomeLabel: z.string().default("Yes"),
  oddsAtAdd: z.number().min(0).max(1).optional(),
  currentOdds: z.number().min(0).max(1).optional(),
  weight: z.number().min(1).max(100).default(50),
  role: thesisSignalRoleSchema.default("core"),
  rationale: z.string().optional(),
  status: predictionMarketStatusSchema.default("open"),
});

export const factSignalInputSchema = z.object({
  claimText: z.string(),
  sourceUrl: z.string().url().optional(),
  verifierVerdict: claimVerdictSchema.default("unverifiable_yet"),
  verifierScore: z.number().min(0).max(100).default(50),
  reportUri: z.string().optional(),
  reportHash: z.string().optional(),
  weight: z.number().min(1).max(100).default(50),
  role: thesisSignalRoleSchema.default("second_order"),
  rationale: z.string().optional(),
});

export const createThesisDraftToolSchema = {
  title: z.string(),
  body: z.string(),
  xHandle: z.string(),
  walletAddress: walletAddressSchema,
  walletSource: z.enum(["external", "embedded"]).default("external"),
  predictionSignals: z.array(predictionSignalInputSchema).default([]),
  factSignals: z.array(factSignalInputSchema).default([]),
} satisfies z.ZodRawShape;

export const getThesisToolSchema = {
  thesisId: z.string(),
} satisfies z.ZodRawShape;

export const prepareRevisionDraftToolSchema = {
  thesisId: z.string(),
  body: z.string(),
  note: z.string().optional(),
  xHandle: z.string(),
  walletAddress: walletAddressSchema,
} satisfies z.ZodRawShape;

export const prepareAnchorTransactionToolSchema = {
  thesisId: z.string(),
} satisfies z.ZodRawShape;

export const prepareEvaProofQuoteToolSchema = {
  thesisId: z.string(),
  walletAddress: walletAddressSchema,
} satisfies z.ZodRawShape;

export const getPaidThesisProofBundleToolSchema = {
  thesisId: z.string(),
  walletAddress: walletAddressSchema,
  evaUsageTxHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "evaUsageTxHash must be a full Avalanche transaction hash"),
} satisfies z.ZodRawShape;
