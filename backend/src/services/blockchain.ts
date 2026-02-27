// ── Blockchain service — pipeline on-chain writes via erc8004 ────────

import { type Hex, keccak256, toHex } from 'viem';
import { giveFeedbackToAgent, validationResponse } from '../lib/erc8004.js';
import { config } from '../config.js';

export async function submitVerificationOnchain(
  articleId: number,
  overallScore: number,
  ipfsURI: string,
): Promise<{ feedbackTxHash: Hex; validationTxHash: Hex }> {
  const agentId = BigInt(config.evaAgentId);
  const scoreU8 = Math.max(0, Math.min(255, Math.round(overallScore)));

  // giveFeedback — reputation update for the verified article
  console.log(`[blockchain] Submitting on-chain feedback for article ${articleId}`);
  const feedbackTxHash = await giveFeedbackToAgent(
    agentId,
    scoreU8,
    'eva:verification',
    `article:${articleId}`,
    ipfsURI,
  );
  console.log(`[blockchain] giveFeedback tx: ${feedbackTxHash}`);

  // validationResponse — oracle validation record
  const requestHash = keccak256(toHex(`eva:article:${articleId}`));
  const responseHash = keccak256(toHex(ipfsURI));
  const validationTxHash = await validationResponse(
    requestHash,
    scoreU8,
    ipfsURI,
    responseHash,
    'eva:oracle:verification',
  );
  console.log(`[blockchain] validationResponse tx: ${validationTxHash}`);

  return { feedbackTxHash, validationTxHash };
}
