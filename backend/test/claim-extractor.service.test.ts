import { afterEach, describe, expect, it, vi } from 'vitest';

describe('claim extractor', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('falls back to deterministic claim extraction when the LLM is unavailable', async () => {
    vi.doMock('../src/services/llm.js', () => ({
      getLlmService: () => ({ provider: 'unavailable' }),
      generateJson: vi.fn().mockRejectedValue(new Error('No LLM provider configured')),
    }));

    const { extractClaims } = await import('../src/services/claim-extractor.js');
    const claims = await extractClaims(
      'Avalanche announced the upgrade in 2026. The network processed 12,500 transactions after the deployment. This sentence is only opinion.',
    );

    expect(claims).toEqual([
      {
        text: 'Avalanche announced the upgrade in 2026.',
        type: 'onchain',
        difficulty: 4,
      },
      {
        text: 'The network processed 12,500 transactions after the deployment.',
        type: 'onchain',
        difficulty: 4,
      },
    ]);
  });
});
