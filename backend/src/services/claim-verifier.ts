// ── Claim verifier — Routescan-first onchain, Brave Search fallback ─

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { lookupOnchainData } from './routescan-client.js';
import type { Claim } from './claim-extractor.js';

export interface ClaimVerdict {
  claim: Claim;
  score: number; // 0–100
  explanation: string;
  sources: string[];
  dataSource: 'routescan' | 'brave' | 'routescan+brave';
}

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';

// ── Brave Search ───────────────────────────────────────────────────────

async function braveSearch(query: string): Promise<string> {
  if (!config.braveApiKey) {
    console.log('[verifier] BRAVE_API_KEY not set, skipping web search');
    return 'No web search results available (API key not configured)';
  }

  console.log(`[verifier] Brave search: "${query.slice(0, 80)}..."`);
  const url = new URL(BRAVE_SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('count', '5');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': config.braveApiKey,
    },
  });

  if (!res.ok) {
    console.log(`[verifier] Brave search failed: ${res.status}`);
    return 'Web search failed';
  }

  const data = await res.json() as {
    web?: { results?: Array<{ title: string; url: string; description: string }> };
  };
  const results = data.web?.results ?? [];

  return results
    .map((r) => `[${r.title}](${r.url}): ${r.description}`)
    .join('\n\n');
}

// ── Verdict via Claude ─────────────────────────────────────────────────

async function getClaudeVerdict(
  claim: Claim,
  evidence: string,
  dataSource: string,
): Promise<{ score: number; explanation: string }> {
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-5';

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: `You are a fact-checker. Given a claim and evidence, produce a verification verdict.

Score scale:
- 90-100: Verified true — evidence strongly supports the claim
- 75-89: Mostly true — evidence largely supports with minor caveats
- 60-74: Minor issues — partially supported but with notable gaps or inaccuracies
- 40-59: Mixed — evidence is contradictory or insufficient
- 20-39: Mostly false — evidence largely contradicts the claim
- 0-19: Fabricated — no supporting evidence or clearly false

Respond with ONLY a JSON object: {"score": <number>, "explanation": "<string>"}`,
    messages: [
      {
        role: 'user',
        content: `Claim: "${claim.text}"
Type: ${claim.type}
Data source used: ${dataSource}

Evidence found:
${evidence}

Produce your verdict.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');

  let jsonStr = content.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  return JSON.parse(jsonStr) as { score: number; explanation: string };
}

// ── Main verifier ──────────────────────────────────────────────────────

export async function verifyClaim(claim: Claim): Promise<ClaimVerdict> {
  console.log(`[verifier] Verifying: "${claim.text.slice(0, 80)}..." (${claim.type})`);

  let evidence = '';
  let sources: string[] = [];
  let dataSource: ClaimVerdict['dataSource'] = 'brave';

  if (claim.type === 'onchain') {
    // Routescan first for onchain claims
    try {
      const onchainResult = await lookupOnchainData(claim.text);
      if (onchainResult.found) {
        evidence = onchainResult.data;
        sources.push('Routescan API (api.routescan.io)');
        dataSource = 'routescan';
        console.log(`[verifier] Routescan data found for onchain claim`);
      } else {
        console.log(`[verifier] No Routescan data, falling back to Brave Search`);
      }
    } catch (e) {
      console.log(`[verifier] Routescan lookup failed, falling back to Brave Search: ${e}`);
    }

    // Fallback to Brave if no Routescan data
    if (!evidence) {
      const braveResult = await braveSearch(claim.text);
      evidence = braveResult;
      sources.push('Brave Search');
      dataSource = 'brave';
    } else {
      // Supplement with web search for additional context
      const braveResult = await braveSearch(claim.text);
      if (braveResult && !braveResult.includes('failed') && !braveResult.includes('not configured')) {
        evidence += '\n\nAdditional web search results:\n' + braveResult;
        sources.push('Brave Search');
        dataSource = 'routescan+brave';
      }
    }
  } else {
    // Offchain claims: Brave Search
    const braveResult = await braveSearch(claim.text);
    evidence = braveResult;
    sources.push('Brave Search');
    dataSource = 'brave';
  }

  // Get Claude verdict
  try {
    const verdict = await getClaudeVerdict(claim, evidence, dataSource);
    const score = Math.max(0, Math.min(100, Math.round(verdict.score)));
    console.log(`[verifier] Verdict: score=${score} source=${dataSource}`);
    return { claim, score, explanation: verdict.explanation, sources, dataSource };
  } catch (e) {
    console.error(`[verifier] Claude verdict failed for claim: ${e}`);
    return {
      claim,
      score: 50,
      explanation: 'Verification inconclusive — could not produce verdict',
      sources,
      dataSource,
    };
  }
}
