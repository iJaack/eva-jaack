// ── Claim extractor — Claude-powered factual claim extraction ────────

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

export interface Claim {
  text: string;
  type: 'onchain' | 'offchain';
  difficulty: number; // 1–10
}

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const SYSTEM_PROMPT = `You are a factual claim extractor for news articles. Your job is to identify VERIFIABLE factual claims — statements that can be checked against data sources.

Rules:
- ONLY extract verifiable factual claims (numbers, dates, events, measurable data)
- SKIP opinions, predictions, speculation, subjective statements, and editorial commentary
- For each claim, classify it:
  - "onchain": claims about blockchain data — TVL, token prices, transaction counts, wallet balances, contract events, protocol metrics, DeFi stats, on-chain governance, token supply, staking amounts
  - "offchain": all other verifiable claims — company announcements, financial data, regulatory actions, personnel changes, partnerships, market data from off-chain sources
- Difficulty 1-3: easily verifiable (exact numbers, public records)
- Difficulty 4-6: moderate (requires cross-referencing, may need context)
- Difficulty 7-10: hard (complex calculations, obscure sources, historical data)

Respond with ONLY a JSON array. No other text.`;

export async function extractClaims(articleText: string): Promise<Claim[]> {
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-5';
  console.log(`[claim-extractor] Extracting claims using ${model}`);

  // Truncate very long articles to stay within reasonable token limits
  const truncated = articleText.slice(0, 15_000);

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extract all verifiable factual claims from this article:\n\n${truncated}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');

  // Parse JSON — handle potential markdown code fences
  let jsonStr = content.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  const claims: Claim[] = JSON.parse(jsonStr);

  // Validate and clamp values
  for (const claim of claims) {
    claim.difficulty = Math.max(1, Math.min(10, Math.round(claim.difficulty)));
    if (claim.type !== 'onchain' && claim.type !== 'offchain') {
      claim.type = 'offchain';
    }
  }

  console.log(`[claim-extractor] Extracted ${claims.length} claims (${claims.filter(c => c.type === 'onchain').length} onchain, ${claims.filter(c => c.type === 'offchain').length} offchain)`);
  return claims;
}
