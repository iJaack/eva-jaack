// ── Blockchain service — pipeline on-chain writes via erc8004 ────────

import { type Hex, keccak256, toHex } from 'viem';
import { giveFeedback, validationResponse } from '../lib/erc8004.js';
import { config } from '../config.js';

export async function submitVerificationOnchain(
  articleId: number,
  overallScore: number,
  ipfsURI: string,
): Promise<{ feedbackTxHash: Hex; validationTxHash: Hex }> {
  const agentId = BigInt(config.evaAgentId);
  const value = BigInt(Math.max(0, Math.min(255, Math.round(overallScore))));
  const feedbackHash = keccak256(toHex(ipfsURI));

  // giveFeedback — reputation update for the verified article
  console.log(`[blockchain] Submitting on-chain feedback for article ${articleId}`);
  const feedbackTxHash = await giveFeedback(
    agentId,
    value,
    0,
    'eva:verification',
    `article:${articleId}`,
    'https://eva.jaack.me/api/verify',
    ipfsURI,
    feedbackHash,
  );
  console.log(`[blockchain] giveFeedback tx: ${feedbackTxHash}`);

  // validationResponse — oracle validation record
  const requestHash = keccak256(toHex(`eva:article:${articleId}`));
  const responseHash = keccak256(toHex(ipfsURI));
  const validationTxHash = await validationResponse(
    requestHash,
    Math.max(0, Math.min(255, Math.round(overallScore))),
    ipfsURI,
    responseHash,
    'eva:oracle:verification',
  );
  console.log(`[blockchain] validationResponse tx: ${validationTxHash}`);

  return { feedbackTxHash, validationTxHash };
}
