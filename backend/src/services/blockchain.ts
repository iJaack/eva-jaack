import { type Hex, keccak256, toHex } from 'viem';
import { avalanche } from 'viem/chains';
import { config } from '../config.js';
import { giveFeedbackAbi, validationResponseAbi } from '../lib/erc8004.js';
import { protocol } from '../protocol.js';
import { getSignerService } from './signer.js';

export async function submitVerificationOnchain(
  articleId: number,
  overallScore: number,
  ipfsURI: string,
): Promise<{ feedbackTxHash: Hex; validationTxHash: Hex }> {
  const signer = getSignerService();
  const agentId = BigInt(config.evaAgentId);
  const value = BigInt(Math.max(0, Math.min(255, Math.round(overallScore))));
  const feedbackHash = keccak256(toHex(ipfsURI));

  console.log(`[blockchain] Submitting on-chain feedback with signer=${signer.provider}`);
  const feedbackTxHash = await signer.writeContract({
    address: config.erc8004Reputation,
    abi: giveFeedbackAbi,
    functionName: 'giveFeedback',
    args: [
      agentId,
      value,
      0,
      'eva:verification',
      'article',
      `${protocol.app.siteUrl}${protocol.app.apiBasePath}/verify`,
      ipfsURI,
      feedbackHash,
    ],
    chain: avalanche,
  });

  const requestHash = keccak256(toHex(`eva:article:${articleId}`));
  const responseHash = keccak256(toHex(ipfsURI));
  const validationTxHash = await signer.writeContract({
    address: config.erc8004Validation,
    abi: validationResponseAbi,
    functionName: 'validationResponse',
    args: [requestHash, Math.max(0, Math.min(255, Math.round(overallScore))), ipfsURI, responseHash, 'eva:oracle:verification'],
    chain: avalanche,
  });

  return { feedbackTxHash, validationTxHash };
}
