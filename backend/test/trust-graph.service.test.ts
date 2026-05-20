import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('trust-graph curator cache', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('reuses cached curator addresses across repeated listCurators calls', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'eva-curators-'));
    vi.stubEnv('EVA_STORAGE_DIR', storageDir);
    await writeFile(
      join(storageDir, 'curators.json'),
      JSON.stringify({
        version: 1,
        hydrated: false,
        updatedAt: null,
        lastScannedBlock: null,
        addresses: [],
      }),
      'utf8',
    );

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

  it('serves persisted curator snapshot without awaiting historical log discovery', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'eva-curators-'));
    vi.stubEnv('EVA_STORAGE_DIR', storageDir);
    await writeFile(
      join(storageDir, 'curators.json'),
      JSON.stringify({
        version: 1,
        hydrated: true,
        updatedAt: new Date().toISOString(),
        lastScannedBlock: '79554001',
        addresses: ['0x0000000000000000000000000000000000001599'],
      }),
      'utf8',
    );

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
      const never = new Promise<never>(() => undefined);

      return {
        ...actual,
        createPublicClient: vi
          .fn()
          .mockReturnValueOnce({
            readContract,
            multicall: vi.fn(),
          })
          .mockReturnValueOnce({
            getBlockNumber: vi.fn().mockReturnValue(never),
            getLogs: vi.fn().mockReturnValue(never),
          }),
      };
    });

    const trustGraph = await import('../src/services/trust-graph.js');
    trustGraph.resetTrustGraphCachesForTests();

    await expect(trustGraph.listCurators()).resolves.toMatchObject([
      { address: '0x0000000000000000000000000000000000001599', curatorAgentId: '1599' },
    ]);
  });

  it('serves the seed curator without awaiting first historical log discovery', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'eva-curators-'));
    vi.stubEnv('EVA_STORAGE_DIR', storageDir);

    vi.doMock('viem', async () => {
      const actual = await vi.importActual<typeof import('viem')>('viem');
      const readContract = vi.fn().mockResolvedValue({
        registered: true,
        curatorAgentId: 1599n,
        selfStake: 1n,
        delegatedStake: 0n,
        pendingSelfYield: 0n,
        trustScore: 75,
        registeredAt: 1n,
        lastTrustUpdate: 1n,
        lastArticleAt: 1n,
        articleCount: 6n,
      });
      const never = new Promise<never>(() => undefined);

      return {
        ...actual,
        createPublicClient: vi
          .fn()
          .mockReturnValueOnce({
            readContract,
            multicall: vi.fn(),
          })
          .mockReturnValueOnce({
            getBlockNumber: vi.fn().mockReturnValue(never),
            getLogs: vi.fn().mockReturnValue(never),
          }),
      };
    });

    const trustGraph = await import('../src/services/trust-graph.js');
    trustGraph.resetTrustGraphCachesForTests();

    await expect(trustGraph.listCurators()).resolves.toMatchObject([
      { address: '0x0fe61780bd5508b3C99e420662050e5560608cA4', curatorAgentId: '1599' },
    ]);
  });
});
