import { encodeFunctionData, keccak256, toBytes, type Hex } from "viem";
import { config } from "../config.js";
import { evaThesisProtocolAbi } from "../generated/evaThesisProtocolAbi.js";
import type { ThesisDto, ThesisFactSignalDto, ThesisPredictionSignalDto } from "../lib/api-types.js";
import { thesisRevisionHash } from "./prediction-layer.js";

export type PreparedThesisTransaction = {
  to: `0x${string}`;
  data: Hex;
  description: string;
};

function hashRef(value: string): Hex {
  return keccak256(toBytes(value));
}

function scoreToUint16(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function probabilityToBps(value: number): number {
  return Math.max(0, Math.min(10_000, Math.round(value * 10_000)));
}

function weightToBps(value: number): number {
  return Math.max(0, Math.min(10_000, Math.round(value * 100)));
}

function statusIndex(status: ThesisPredictionSignalDto["status"]): number {
  if (status === "closed") return 1;
  if (status === "resolved") return 2;
  if (status === "cancelled") return 3;
  return 0;
}

export function prepareThesisAnchorTransactions(thesis: ThesisDto): PreparedThesisTransaction[] {
  if (/^0x0{40}$/i.test(config.evaThesisProtocol)) {
    throw new Error("EVA_THESIS_PROTOCOL is not configured");
  }

  const thesisRef = hashRef(thesis.thesisId);
  const revisionHash = thesisRevisionHash(thesis);
  const txs: PreparedThesisTransaction[] = [
    {
      to: config.evaThesisProtocol,
      description: `Create thesis protocol record for ${thesis.title}`,
      data: encodeFunctionData({
        abi: evaThesisProtocolAbi,
        functionName: "createThesis",
        args: [thesisRef, thesis.author.walletAddress, revisionHash, scoreToUint16(thesis.currentScore)],
      }),
    },
  ];

  for (const signal of thesis.signals) {
    const signalRef = hashRef(signal.signalId);
    if (signal.kind === "prediction_market") {
      txs.push({
        to: config.evaThesisProtocol,
        description: `Add prediction signal ${signal.title}`,
        data: encodeFunctionData({
          abi: evaThesisProtocolAbi,
          functionName: "addPredictionSignal",
          args: [
            thesisRef,
            signalRef,
            hashRef(signal.marketId ?? signal.externalId ?? signal.title),
            hashRef(signal.selectedOutcomeId ?? signal.selectedOutcomeLabel),
            probabilityToBps(signal.oddsAtAdd),
            probabilityToBps(signal.currentOdds),
            weightToBps(signal.weight),
            statusIndex(signal.status),
            hashRef(signal.marketUrl ?? signal.title),
          ],
        }),
      });
    } else {
      const fact = signal as ThesisFactSignalDto;
      txs.push({
        to: config.evaThesisProtocol,
        description: `Add fact signal ${fact.title}`,
        data: encodeFunctionData({
          abi: evaThesisProtocolAbi,
          functionName: "addFactSignal",
          args: [
            thesisRef,
            signalRef,
            hashRef(fact.claimText),
            scoreToUint16(fact.verifierScore),
            weightToBps(fact.weight),
            hashRef(fact.reportHash ?? fact.reportUri ?? fact.claimText),
          ],
        }),
      });
    }
  }

  return txs;
}
