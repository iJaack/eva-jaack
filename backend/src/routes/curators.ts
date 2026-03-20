import { Hono } from 'hono';
import { createPublicClient, http, encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { avalanche } from 'viem/chains';
import { config } from '../config.js';

export const curatorRoutes = new Hono();

// ── ABI fragments ──────────────────────────────────────────────────────

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

// ── GET /api/curators ──────────────────────────────────────────────────

curatorRoutes.get('/', async (c) => {
  return c.json([]);
});

// ── GET /api/curator/:id ───────────────────────────────────────────────

curatorRoutes.get('/:id', async (c) => {
  return c.json([]);
});

// ── POST /api/curator/register ─────────────────────────────────────────
//
// Validates on-chain state and returns prepared transaction calldata
// for the client to sign and broadcast.
//
// Registration requires:
//   - Caller owns the ERC-8004 agentId (identity check)
//   - Caller is not already registered
//   - Caller has sufficient $EVA balance
//   - Caller pre-approves $EVA to EvaTrustGraph before broadcasting registerCurator
//
// This endpoint does NOT sign on behalf of the curator — the wallet that
// owns the ERC-8004 identity must execute the returned transactions.

interface RegisterBody {
  walletAddress: string;   // EVM address of the curator's wallet
  agentId: number | string; // ERC-8004 agent id they own
  stakeAmount?: string;    // Optional: $EVA amount in human units (e.g. "250000")
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
    // ── 1. Fetch on-chain state in parallel ───────────────────────────
    const [minStakeRaw, curatorData, identityOwner, evaBalance, currentAllowance] = await Promise.all([
      publicClient.readContract({
        address: config.evaTrustGraph,
        abi: evaTrustGraphAbi,
        functionName: 'minSelfStake',
      }),
      publicClient.readContract({
        address: config.evaTrustGraph,
        abi: evaTrustGraphAbi,
        functionName: 'getCurator',
        args: [walletAddress],
      }),
      publicClient.readContract({
        address: config.erc8004Identity,
        abi: erc8004IdentityAbi,
        functionName: 'ownerOf',
        args: [agentId],
      }).catch(() => null as string | null),
      publicClient.readContract({
        address: config.evaToken,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [walletAddress],
      }),
      publicClient.readContract({
        address: config.evaToken,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [walletAddress, config.evaTrustGraph],
      }),
    ]);

    // ── 2. Validation checks ───────────────────────────────────────────
    if (curatorData.registered) {
      return c.json({
        error: 'Address is already registered as a curator',
        alreadyRegistered: true,
        curatorAgentId: curatorData.curatorAgentId.toString(),
        trustScore: curatorData.trustScore,
      }, 409);
    }

    if (identityOwner === null) {
      return c.json({ error: `ERC-8004 agentId ${agentId} does not exist in the identity registry` }, 404);
    }

    if (identityOwner.toLowerCase() !== walletAddress.toLowerCase()) {
      return c.json({
        error: 'Identity ownership mismatch: walletAddress does not own the specified ERC-8004 agentId',
        identityOwner,
        agentId: agentId.toString(),
      }, 400);
    }

    // Determine stake amount: use provided value or default to minSelfStake
    const stakeAmount = body.stakeAmount
      ? parseUnits(body.stakeAmount, 18)
      : minStakeRaw;

    if (stakeAmount < minStakeRaw) {
      return c.json({
        error: `Stake amount too low. Minimum required: ${formatUnits(minStakeRaw, 18)} EVA`,
        minStakeEva: formatUnits(minStakeRaw, 18),
        requestedEva: formatUnits(stakeAmount, 18),
      }, 400);
    }

    if (evaBalance < stakeAmount) {
      return c.json({
        error: 'Insufficient $EVA balance for registration stake',
        requiredEva: formatUnits(stakeAmount, 18),
        balanceEva: formatUnits(evaBalance, 18),
      }, 400);
    }

    // ── 3. Build prepared transactions ────────────────────────────────
    const needsApproval = currentAllowance < stakeAmount;

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

    // ── 4. Return registration package ────────────────────────────────
    return c.json({
      ready: true,
      walletAddress,
      agentId: agentId.toString(),
      stakeAmount: stakeAmount.toString(),
      stakeAmountEva: formatUnits(stakeAmount, 18),
      minStakeEva: formatUnits(minStakeRaw, 18),
      chain: 'avalanche',
      chainId: 43114,
      contracts: {
        evaToken: config.evaToken,
        evaTrustGraph: config.evaTrustGraph,
        erc8004Identity: config.erc8004Identity,
      },
      needsApproval,
      currentAllowanceEva: formatUnits(currentAllowance, 18),
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
