import { createPublicClient, http, type Hex } from "viem";
import { avalanche } from "viem/chains";
import { config } from "../config.js";
import type { PreparedThesisTransaction } from "./thesis-protocol.js";

export type AnchorVerificationResult =
  | { ok: true; confirmedAt: string }
  | { ok: false; error: string };

export type AnchorVerifier = {
  verifyPreparedAnchor(input: {
    txHash: `0x${string}`;
    expectedTransactions: PreparedThesisTransaction[];
  }): Promise<AnchorVerificationResult>;
};

function sameHex(left: string | null | undefined, right: string): boolean {
  return Boolean(left) && left!.toLowerCase() === right.toLowerCase();
}

function confirmedAtFromTimestamp(timestamp: bigint | number | Date): string {
  if (timestamp instanceof Date) return timestamp.toISOString();
  return new Date(Number(timestamp) * 1000).toISOString();
}

export function createAvalancheAnchorVerifier(): AnchorVerifier {
  const publicClient = createPublicClient({
    chain: avalanche,
    transport: http(config.avalancheRpc),
  });

  return {
    async verifyPreparedAnchor({ txHash, expectedTransactions }) {
      if (expectedTransactions.length === 0) {
        return { ok: false, error: "No prepared anchor transactions to verify" };
      }

      try {
        const [receipt, transaction] = await Promise.all([
          publicClient.getTransactionReceipt({ hash: txHash }),
          publicClient.getTransaction({ hash: txHash }),
        ]);

        if (receipt.status !== "success") {
          return { ok: false, error: "Anchor transaction is not confirmed" };
        }

        const matchesPreparedTransaction = expectedTransactions.some(
          (expected) => sameHex(transaction.to, expected.to) && sameHex(transaction.input as Hex, expected.data),
        );
        if (!matchesPreparedTransaction) {
          return { ok: false, error: "Anchor transaction does not match prepared calldata" };
        }

        const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
        return { ok: true, confirmedAt: confirmedAtFromTimestamp(block.timestamp) };
      } catch {
        return { ok: false, error: "Anchor transaction is not confirmed" };
      }
    },
  };
}
