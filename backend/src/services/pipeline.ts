// ── Verification pipeline — full orchestration ──────────────────────

import pLimit from 'p-limit';
import { fetchArticle } from './fetcher.js';
import { extractClaims, type Claim } from './claim-extractor.js';
import { verifyClaim, type ClaimVerdict } from './claim-verifier.js';
import { uploadJSON } from './ipfs.js';
import { submitVerificationOnchain } from './blockchain.js';

export interface PipelineResult {
  overallScore: number;
  ipfsURI: string;
  report: VerificationReport;
  claimCount: number;
  routescanClaimCount: number;
}

export interface VerificationReport {
  url: string;
  title: string;
  claims: ClaimVerdict[];
  overallScore: number;
  verifiedAt: string;
  oracleAgentId: number;
  routescanUsed: boolean;
}

export async function runVerificationPipeline(
  url: string,
  articleId?: number,
): Promise<PipelineResult> {
  console.log(`[pipeline] Starting verification for: ${url}`);

  // 1. Fetch article
  const article = await fetchArticle(url);
  console.log(`[pipeline] Article fetched: "${article.title}"`);

  // 2. Extract claims
  const claims = await extractClaims(article.text);
  console.log(`[pipeline] ${claims.length} claims extracted`);

  if (claims.length === 0) {
    console.log('[pipeline] No verifiable claims found — returning neutral score');
    const report: VerificationReport = {
      url: article.url,
      title: article.title,
      claims: [],
      overallScore: 50,
      verifiedAt: new Date().toISOString(),
      oracleAgentId: 1599,
      routescanUsed: false,
    };

    let ipfsURI = '';
    try {
      ipfsURI = await uploadJSON(report);
    } catch (e) {
      console.error(`[pipeline] IPFS upload failed: ${e}`);
      ipfsURI = 'ipfs://upload-failed';
    }

    return {
      overallScore: 50,
      ipfsURI,
      report,
      claimCount: 0,
      routescanClaimCount: 0,
    };
  }

  // 3. Verify claims — parallel, max 5 concurrent
  const limit = pLimit(5);
  const verdicts: ClaimVerdict[] = [];
  const verificationPromises = claims.map((claim: Claim) =>
    limit(async () => {
      try {
        const verdict = await verifyClaim(claim);
        verdicts.push(verdict);
      } catch (e) {
        console.error(`[pipeline] Claim verification failed: "${claim.text.slice(0, 60)}..." — ${e}`);
        // Partial failure: log and continue
        verdicts.push({
          claim,
          score: 50,
          explanation: `Verification failed: ${e}`,
          sources: [],
          dataSource: 'brave',
        });
      }
    }),
  );
  await Promise.all(verificationPromises);

  // 4. Weighted average score (weighted by difficulty)
  const totalWeight = verdicts.reduce((sum, v) => sum + v.claim.difficulty, 0);
  const weightedSum = verdicts.reduce(
    (sum, v) => sum + v.score * v.claim.difficulty,
    0,
  );
  const overallScore = totalWeight > 0
    ? Math.round(weightedSum / totalWeight)
    : 50;

  // Count Routescan-sourced claims
  const routescanClaimCount = verdicts.filter(
    (v) => v.dataSource === 'routescan' || v.dataSource === 'routescan+brave',
  ).length;

  // 5. Build report
  const report: VerificationReport = {
    url: article.url,
    title: article.title,
    claims: verdicts,
    overallScore,
    verifiedAt: new Date().toISOString(),
    oracleAgentId: 1599,
    routescanUsed: routescanClaimCount > 0,
  };

  console.log(
    `[pipeline] Verification complete: score=${overallScore}, ` +
    `claims=${verdicts.length}, routescan=${routescanClaimCount}`,
  );

  // 6. Upload to IPFS
  let ipfsURI = '';
  try {
    ipfsURI = await uploadJSON(report);
  } catch (e) {
    console.error(`[pipeline] IPFS upload failed: ${e}`);
    ipfsURI = 'ipfs://upload-failed';
  }

  // 7. On-chain submission (if articleId provided)
  if (articleId !== undefined) {
    try {
      const txs = await submitVerificationOnchain(articleId, overallScore, ipfsURI);
      console.log(`[pipeline] On-chain txs: feedback=${txs.feedbackTxHash}, validation=${txs.validationTxHash}`);
    } catch (e) {
      console.error(`[pipeline] On-chain submission failed: ${e}`);
    }
  }

  // 8. Return result
  return {
    overallScore,
    ipfsURI,
    report,
    claimCount: verdicts.length,
    routescanClaimCount,
  };
}
