import { generateJson, getLlmService } from './llm.js';

export interface Claim {
  text: string;
  type: 'onchain' | 'offchain';
  difficulty: number;
}

const SYSTEM_PROMPT = `You are a factual claim extractor for news articles. Your job is to identify VERIFIABLE factual claims — statements that can be checked against data sources.

Rules:
- ONLY extract verifiable factual claims (numbers, dates, events, measurable data)
- SKIP opinions, predictions, speculation, subjective statements, and editorial commentary
- For each claim, classify it:
  - "onchain": claims about blockchain data — TVL, token prices, transaction counts, wallet balances, contract events, protocol metrics, DeFi stats, on-chain governance, token supply, staking amounts
  - "offchain": all other verifiable claims — company announcements, financial data, regulatory actions, personnel changes, partnerships, market data from off-chain sources
- Difficulty 1-3: easily verifiable
- Difficulty 4-6: moderate
- Difficulty 7-10: hard

Respond with ONLY a JSON array.`;

export async function extractClaims(articleText: string): Promise<Claim[]> {
  const llm = getLlmService();
  console.log(`[claim-extractor] Extracting claims using provider=${llm.provider}`);

  const truncated = articleText.slice(0, 15_000);
  const claims = await generateJson<Claim[]>({
    system: SYSTEM_PROMPT,
    prompt: `Extract all verifiable factual claims from this article:\n\n${truncated}`,
    maxTokens: 4096,
  });

  for (const claim of claims) {
    claim.difficulty = Math.max(1, Math.min(10, Math.round(claim.difficulty)));
    if (claim.type !== 'onchain' && claim.type !== 'offchain') {
      claim.type = 'offchain';
    }
  }

  console.log(
    `[claim-extractor] Extracted ${claims.length} claims (${claims.filter((c) => c.type === 'onchain').length} onchain, ${claims.filter((c) => c.type === 'offchain').length} offchain)`,
  );

  return claims;
}
