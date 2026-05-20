import { Hono } from 'hono';
import { createPublicClient, http, encodeFunctionData, parseUnits, formatUnits, type Address } from 'viem';
import { avalanche } from 'viem/chains';
import type { CuratorDetailResponse, CuratorListResponse } from '../lib/api-types.js';
import { getClaimMarketService } from '../services/claim-market.js';
import { listArticlesForCurator, listCurators } from '../services/trust-graph.js';
import { config } from '../config.js';

const evaTrustGraphAbi = [
  {
    name: 'registerCurator',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'curatorAgentId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'getCurator',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'curatorAddr', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'registered', type: 'bool' },
          { name: 'curatorAgentId', type: 'uint256' },
          { name: 'selfStake', type: 'uint256' },
          { name: 'delegatedStake', type: 'uint256' },
          { name: 'accYieldPerStakeX18', type: 'uint256' },
          { name: 'pendingSelfYield', type: 'uint256' },
          { name: 'selfRewardDebt', type: 'uint256' },
          { name: 'trustScore', type: 'uint8' },
          { name: 'registeredAt', type: 'uint64' },
          { name: 'lastTrustUpdate', type: 'uint64' },
          { name: 'lastArticleAt', type: 'uint64' },
          { name: 'articleCount', type: 'uint64' },
        ],
      },
    ],
  },
  {
    name: 'minSelfStake',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const erc8004IdentityAbi = [
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

const erc20Abi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const publicClient = createPublicClient({
  chain: avalanche,
  transport: http(config.avalancheRpc),
});

const routePublicClient: CuratorRouteDeps['publicClient'] = {
  readContract: (args) => publicClient.readContract(args as never) as Promise<unknown>,
};

type CuratorRouteDeps = {
  listCurators: typeof listCurators;
  listArticlesForCurator: typeof listArticlesForCurator;
  getCuratorMarketActivity: (curatorAddress: string) => Promise<NonNullable<CuratorDetailResponse['marketActivity']>>;
  curatorListTimeoutMs?: number;
  publicClient: {
    readContract: (args: {
      address: Address;
      abi: readonly unknown[];
      functionName: string;
      args?: readonly unknown[];
    }) => Promise<unknown>;
  };
};

type CuratorListResult =
  | { status: 'fulfilled'; value: Awaited<ReturnType<typeof listCurators>> }
  | { status: 'rejected'; reason: unknown }
  | { status: 'timeout' };

const DEFAULT_CURATOR_LIST_TIMEOUT_MS = 2_500;
const CURATOR_LIST_TIMEOUT_WARNING =
  'Curator graph is still warming. Returning an empty snapshot so the app stays available.';

async function loadCuratorsWithTimeout(deps: CuratorRouteDeps): Promise<CuratorListResult> {
  const timeoutMs = deps.curatorListTimeoutMs ?? DEFAULT_CURATOR_LIST_TIMEOUT_MS;
  const operation = deps
    .listCurators()
    .then<CuratorListResult>((value) => ({ status: 'fulfilled', value }))
    .catch<CuratorListResult>((reason) => ({ status: 'rejected', reason }));

  const timeout = new Promise<CuratorListResult>((resolve) => {
    setTimeout(() => resolve({ status: 'timeout' }), timeoutMs);
  });

  return Promise.race([operation, timeout]);
}

export function createCuratorRoutes(
  deps: CuratorRouteDeps = {
    listCurators,
    listArticlesForCurator,
    getCuratorMarketActivity: (curatorAddress) => getClaimMarketService().getCuratorMarketActivity(curatorAddress),
    publicClient: routePublicClient,
  },
) {
  const curatorRoutes = new Hono();

  curatorRoutes.get('/', async (c) => {
    const result = await loadCuratorsWithTimeout(deps);

    c.header('cache-control', 's-maxage=60, stale-while-revalidate=300');

    if (result.status === 'fulfilled') {
      const curators = result.value;
      return c.json<CuratorListResponse>({
        count: curators.length,
        chain: 'avalanche',
        chainId: 43114,
        curators,
        status: 'fresh',
        source: 'trust-graph',
      });
    }

    if (result.status === 'timeout') {
      console.warn(`[curators] list exceeded ${deps.curatorListTimeoutMs ?? DEFAULT_CURATOR_LIST_TIMEOUT_MS}ms`);
      return c.json<CuratorListResponse>({
        count: 0,
        chain: 'avalanche',
        chainId: 43114,
        curators: [],
        status: 'degraded',
        source: 'timeout-fallback',
        warning: CURATOR_LIST_TIMEOUT_WARNING,
      });
    }

    console.error(`[curators] list failed: ${result.reason}`);
    return c.json({ error: 'Failed to fetch curators', details: String(result.reason) }, 500);
  });

  curatorRoutes.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const result = await loadCuratorsWithTimeout(deps);

      if (result.status === 'timeout') {
        return c.json({ error: 'Curator graph is warming', details: CURATOR_LIST_TIMEOUT_WARNING }, 503);
      }
      if (result.status === 'rejected') {
        throw result.reason;
      }

      const curators = result.value;

      const curator = id.match(/^0x[0-9a-fA-F]{40}$/)
        ? curators.find((candidate) => candidate.address.toLowerCase() === id.toLowerCase())
        : curators.find((candidate) => candidate.curatorAgentId === id);

      if (!curator) {
        return c.json({ error: 'Curator not found' }, 404);
      }

      const articles = await deps.listArticlesForCurator(curator.address);
      const marketActivity = await deps.getCuratorMarketActivity(curator.address);
      return c.json<CuratorDetailResponse>({
        chain: 'avalanche',
        chainId: 43114,
        curator,
        articles,
        marketActivity,
      });
    } catch (e) {
      console.error(`[curators] detail failed: ${e}`);
      return c.json({ error: 'Failed to fetch curator', details: String(e) }, 500);
    }
  });

  interface RegisterBody {
    walletAddress: string;
    agentId: number | string;
    stakeAmount?: string;
  }

  curatorRoutes.post('/register', async (c) => {
    let body: RegisterBody;
    try {
      body = await c.req.json<RegisterBody>();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    if (!body.walletAddress || !body.walletAddress.match(/^0x[0-9a-fA-F]{40}$/)) {
      return c.json({ error: 'Missing or invalid walletAddress (checksummed EVM address required)' }, 400);
    }
    if (body.agentId === undefined || body.agentId === null || body.agentId === '') {
      return c.json({ error: 'Missing required field: agentId' }, 400);
    }

    const walletAddress = body.walletAddress as `0x${string}`;
    const agentId = BigInt(body.agentId);

    console.log(`[curator/register] Pre-registration check: wallet=${walletAddress} agentId=${agentId}`);

    try {
      const [minStakeRaw, curatorData, identityOwner, evaBalance, currentAllowance] = await Promise.all([
        deps.publicClient.readContract({
          address: config.evaTrustGraph,
          abi: evaTrustGraphAbi,
          functionName: 'minSelfStake',
        }),
        deps.publicClient.readContract({
          address: config.evaTrustGraph,
          abi: evaTrustGraphAbi,
          functionName: 'getCurator',
          args: [walletAddress],
        }),
        deps.publicClient.readContract({
          address: config.erc8004Identity,
          abi: erc8004IdentityAbi,
          functionName: 'ownerOf',
          args: [agentId],
        }).catch(() => null as string | null),
        deps.publicClient.readContract({
          address: config.evaToken,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [walletAddress],
        }),
        deps.publicClient.readContract({
          address: config.evaToken,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [walletAddress, config.evaTrustGraph],
        }),
      ]);

      const curatorState = curatorData as {
        registered: boolean;
        curatorAgentId: bigint;
        trustScore: number;
      };
      const minStake = minStakeRaw as bigint;
      const balance = evaBalance as bigint;
      const allowance = currentAllowance as bigint;

      if (curatorState.registered) {
        return c.json({
          error: 'Address is already registered as a curator',
          alreadyRegistered: true,
          curatorAgentId: curatorState.curatorAgentId.toString(),
          trustScore: curatorState.trustScore,
        }, 409);
      }

      if (identityOwner === null) {
        return c.json({ error: `ERC-8004 agentId ${agentId} does not exist in the identity registry` }, 404);
      }

      if ((identityOwner as string).toLowerCase() !== walletAddress.toLowerCase()) {
        return c.json({
          error: 'Identity ownership mismatch: walletAddress does not own the specified ERC-8004 agentId',
          identityOwner,
          agentId: agentId.toString(),
        }, 400);
      }

      const stakeAmount = body.stakeAmount
        ? parseUnits(body.stakeAmount, 18)
        : minStake;

      if (stakeAmount < minStake) {
        return c.json({
          error: `Stake amount too low. Minimum required: ${formatUnits(minStake, 18)} EVA`,
          minStakeEva: formatUnits(minStake, 18),
          requestedEva: formatUnits(stakeAmount, 18),
        }, 400);
      }

      if (balance < stakeAmount) {
        return c.json({
          error: 'Insufficient $EVA balance for registration stake',
          requiredEva: formatUnits(stakeAmount, 18),
          balanceEva: formatUnits(balance, 18),
        }, 400);
      }

      const needsApproval = allowance < stakeAmount;

      const approveTx = needsApproval
        ? {
            to: config.evaToken,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [config.evaTrustGraph, stakeAmount],
            }),
            description: `Approve EvaTrustGraph to spend ${formatUnits(stakeAmount, 18)} EVA`,
          }
        : null;

      const registerTx = {
        to: config.evaTrustGraph,
        data: encodeFunctionData({
          abi: evaTrustGraphAbi,
          functionName: 'registerCurator',
          args: [agentId, stakeAmount],
        }),
        description: `Register as curator with agentId=${agentId}, stake=${formatUnits(stakeAmount, 18)} EVA`,
      };

      return c.json({
        ready: true,
        walletAddress,
        agentId: agentId.toString(),
        stakeAmount: stakeAmount.toString(),
        stakeAmountEva: formatUnits(stakeAmount, 18),
        minStakeEva: formatUnits(minStake, 18),
        chain: 'avalanche',
        chainId: 43114,
        contracts: {
          evaToken: config.evaToken,
          evaTrustGraph: config.evaTrustGraph,
          erc8004Identity: config.erc8004Identity,
        },
        needsApproval,
        currentAllowanceEva: formatUnits(allowance, 18),
        transactions: [
          ...(approveTx ? [approveTx] : []),
          registerTx,
        ],
      });
    } catch (e) {
      console.error(`[curator/register] On-chain check failed: ${e}`);
      return c.json({ error: 'On-chain pre-registration check failed', details: String(e) }, 500);
    }
  });

  return curatorRoutes;
}

export const curatorRoutes = createCuratorRoutes();
