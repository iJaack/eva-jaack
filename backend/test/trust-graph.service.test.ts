import { afterEach, describe, expect, it, vi } from 'vitest';

describe('trust-graph curator cache', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('reuses cached curator addresses across repeated listCurators calls', async () => {
    vi.doMock('viem', async () => {
      const actual = await vi.importActual<typeof import('viem')>('viem');
      const readContract = vi.fn().mockResolvedValue({
        registered: true,
        curatorAgentId: 1599n,
        selfStake: 1n,
        delegatedStake: 0n,
        pendingSelfYield: 0n,
        trustScore: 10,
        registeredAt: 1n,
        lastTrustUpdate: 1n,
        lastArticleAt: 1n,
        articleCount: 1n,
      });
      const getLogs = vi.fn().mockResolvedValue([
        { args: { curator: '0x0000000000000000000000000000000000001599' } },
      ]);

      return {
        ...actual,
        createPublicClient: vi
          .fn()
          .mockReturnValueOnce({
            readContract,
            multicall: vi.fn(),
          })
          .mockReturnValueOnce({
            getBlockNumber: vi.fn().mockResolvedValue(79_554_001n),
            getLogs,
          }),
      };
    });

    const trustGraph = await import('../src/services/trust-graph.js');
    trustGraph.resetTrustGraphCachesForTests();

    const first = await trustGraph.listCurators();
    const second = await trustGraph.listCurators();

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(first[0]?.address).toBe('0x0000000000000000000000000000000000001599');
    expect(second[0]?.address).toBe('0x0000000000000000000000000000000000001599');

    const viem = await import('viem');
    const createPublicClient = vi.mocked(viem.createPublicClient);
    const publicLogClient = createPublicClient.mock.results[1]?.value as {
      getLogs: ReturnType<typeof vi.fn>;
    };

    expect(publicLogClient.getLogs).toHaveBeenCalledTimes(1);
    const firstCall = publicLogClient.getLogs.mock.calls[0]?.[0] as { fromBlock: bigint; toBlock: bigint };
    expect(firstCall.toBlock - firstCall.fromBlock).toBeLessThanOrEqual(49_999n);
  });
});
