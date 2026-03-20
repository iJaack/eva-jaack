import { config } from '../config.js';
import { lookupOnchainData } from './routescan-client.js';
import type { Claim } from './claim-extractor.js';
import { generateJson, getLlmService } from './llm.js';

export interface ClaimVerdict {
  claim: Claim;
  score: number;
  explanation: string;
  sources: string[];
  dataSource: 'routescan' | 'brave' | 'routescan+brave';
}

const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';

async function braveSearch(query: string): Promise<string> {
  if (!config.braveApiKey) {
    console.log('[verifier] BRAVE_API_KEY not set, skipping web search');
    return 'No web search results available (API key not configured)';
  }

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
    return `Web search failed (${res.status})`;
  }

  const data = await res.json() as {
    web?: { results?: Array<{ title: string; url: string; description: string }> };
  };

  return (data.web?.results ?? [])
    .map((result) => `[${result.title}](${result.url}): ${result.description}`)
    .join('\n\n');
}

async function getVerdict(claim: Claim, evidence: string, dataSource: string) {
  const llm = getLlmService();
  console.log(`[verifier] Generating verdict using provider=${llm.provider}`);

  return generateJson<{ score: number; explanation: string }>({
    system: `You are a fact-checker. Given a claim and evidence, produce a verification verdict.

Score scale:
- 90-100: Verified true — evidence strongly supports the claim
- 75-89: Mostly true — evidence largely supports with minor caveats
- 60-74: Partially supported with notable gaps
- 40-59: Mixed or insufficient
- 20-39: Mostly false
- 0-19: Fabricated or strongly contradicted

Respond with ONLY a JSON object: {"score": <number>, "explanation": "<string>"}`,
    prompt: `Claim: "${claim.text}"\nType: ${claim.type}\nData source used: ${dataSource}\n\nEvidence found:\n${evidence}\n\nProduce your verdict.`,
    maxTokens: 1024,
  });
}

export async function verifyClaim(claim: Claim): Promise<ClaimVerdict> {
  console.log(`[verifier] Verifying: "${claim.text.slice(0, 80)}..." (${claim.type})`);

  let evidence = '';
  const sources: string[] = [];
  let dataSource: ClaimVerdict['dataSource'] = 'brave';

  if (claim.type === 'onchain') {
    try {
      const onchainResult = await lookupOnchainData(claim.text);
      if (onchainResult.found) {
        evidence = onchainResult.data;
        sources.push('Routescan API (api.routescan.io)');
        dataSource = 'routescan';
      }
    } catch (error) {
      console.log(`[verifier] Routescan lookup failed, falling back: ${error}`);
    }

    const braveResult = await braveSearch(claim.text);
    if (!evidence) {
      evidence = braveResult;
      sources.push('Brave Search');
      dataSource = 'brave';
    } else if (braveResult && !braveResult.startsWith('Web search failed') && !braveResult.includes('not configured')) {
      evidence += `\n\nAdditional web search results:\n${braveResult}`;
      sources.push('Brave Search');
      dataSource = 'routescan+brave';
    }
  } else {
    evidence = await braveSearch(claim.text);
    sources.push('Brave Search');
  }

  try {
    const verdict = await getVerdict(claim, evidence, dataSource);
    return {
      claim,
      score: Math.max(0, Math.min(100, Math.round(verdict.score))),
      explanation: verdict.explanation,
      sources,
      dataSource,
    };
  } catch (error) {
    console.error(`[verifier] Verdict generation failed: ${error}`);
    return {
      claim,
      score: 50,
      explanation: 'Verification inconclusive — could not produce verdict',
      sources,
      dataSource,
    };
  }
}
