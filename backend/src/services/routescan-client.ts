// ── Routescan API client — preferred source for Avalanche onchain data ──

const ROUTESCAN_BASE = 'https://api.routescan.io/v2';

const CHAIN_IDS: Record<string, number> = {
  avalanche: 43114,
  fuji: 43113,
  base: 8453,
  ethereum: 1,
};

const NETWORK_TYPES: Record<string, string> = {
  avalanche: 'mainnet',
  fuji: 'testnet',
  base: 'mainnet',
  ethereum: 'mainnet',
};

export type Network = 'avalanche' | 'fuji' | 'base' | 'ethereum';

interface RoutescanResponse {
  status: string;
  message: string;
  result: unknown;
}

function etherscanUrl(network: Network): string {
  const chainId = CHAIN_IDS[network];
  const networkType = NETWORK_TYPES[network];
  return `${ROUTESCAN_BASE}/network/${networkType}/evm/${chainId}/etherscan/api`;
}

async function routescanFetch(
  params: Record<string, string>,
  network: Network = 'avalanche',
): Promise<RoutescanResponse> {
  const url = new URL(etherscanUrl(network));
  const apiKey = process.env.ROUTESCAN_API_KEY;
  if (apiKey) params.apikey = apiKey;

  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  console.log(`[routescan] ${params.module}.${params.action} on ${network}`);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Routescan API error: ${res.status}`);
  const data: RoutescanResponse = await res.json();

  if (data.status === '0' && data.message === 'NOTOK') {
    throw new Error(`Routescan error: ${data.result}`);
  }

  return data;
}

// ── Public API ─────────────────────────────────────────────────────────

export async function getBalance(
  address: string,
  network: Network = 'avalanche',
): Promise<{ balanceWei: string; balanceFormatted: string }> {
  const data = await routescanFetch(
    { module: 'account', action: 'balance', address, tag: 'latest' },
    network,
  );
  const balanceWei = data.result as string;
  const balanceFormatted = (Number(balanceWei) / 1e18).toFixed(6);
  return { balanceWei, balanceFormatted };
}

export async function getTokenBalance(
  address: string,
  tokenAddress: string,
  network: Network = 'avalanche',
): Promise<{ balanceRaw: string }> {
  const data = await routescanFetch(
    {
      module: 'account',
      action: 'tokenbalance',
      address,
      contractaddress: tokenAddress,
      tag: 'latest',
    },
    network,
  );
  return { balanceRaw: data.result as string };
}

export async function getTransactionCount(
  address: string,
  network: Network = 'avalanche',
): Promise<{ txCount: number; transactions: unknown[] }> {
  const data = await routescanFetch(
    {
      module: 'account',
      action: 'txlist',
      address,
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: '1',
      sort: 'desc',
    },
    network,
  );
  const txList = Array.isArray(data.result) ? data.result : [];
  // The list endpoint with offset=1 gives us a single tx, but the total count
  // isn't directly returned. We use a separate proxy call for exact count.
  const countData = await routescanFetch(
    { module: 'proxy', action: 'eth_getTransactionCount', address, tag: 'latest' },
    network,
  );
  const txCount = parseInt(countData.result as string, 16);
  return { txCount, transactions: txList };
}

export async function getTransaction(
  txHash: string,
  network: Network = 'avalanche',
): Promise<{ transaction: unknown }> {
  const data = await routescanFetch(
    { module: 'proxy', action: 'eth_getTransactionByHash', txhash: txHash },
    network,
  );
  return { transaction: data.result };
}

export async function getContractEvents(
  address: string,
  eventSig: string,
  network: Network = 'avalanche',
  fromBlock = '0',
  toBlock = 'latest',
): Promise<{ events: unknown[] }> {
  const data = await routescanFetch(
    {
      module: 'logs',
      action: 'getLogs',
      address,
      topic0: eventSig,
      fromBlock,
      toBlock,
    },
    network,
  );
  const events = Array.isArray(data.result) ? data.result : [];
  return { events };
}

export async function searchAddress(
  query: string,
  network: Network = 'avalanche',
): Promise<{ address: string; balance: string } | null> {
  try {
    const balance = await getBalance(query, network);
    return { address: query, balance: balance.balanceFormatted };
  } catch {
    return null;
  }
}

// ── Utility for claim verification ─────────────────────────────────────

export async function lookupOnchainData(
  claimText: string,
  network: Network = 'avalanche',
): Promise<{ found: boolean; data: string; source: string }> {
  // Extract addresses (0x...) from claim text
  const addressMatches = claimText.match(/0x[a-fA-F0-9]{40}/g);
  // Extract tx hashes (0x... 64 hex chars)
  const txHashMatches = claimText.match(/0x[a-fA-F0-9]{64}/g);

  const results: string[] = [];

  // Look up any tx hashes
  if (txHashMatches) {
    for (const txHash of txHashMatches.slice(0, 3)) {
      try {
        const tx = await getTransaction(txHash, network);
        results.push(`Transaction ${txHash}: ${JSON.stringify(tx.transaction)}`);
      } catch (e) {
        results.push(`Transaction ${txHash}: not found`);
      }
    }
  }

  // Look up any addresses
  if (addressMatches) {
    for (const addr of addressMatches.slice(0, 3)) {
      try {
        const balance = await getBalance(addr, network);
        results.push(`Address ${addr}: balance ${balance.balanceFormatted} AVAX`);
        const txCount = await getTransactionCount(addr, network);
        results.push(`Address ${addr}: ${txCount.txCount} transactions`);
      } catch (e) {
        results.push(`Address ${addr}: lookup failed`);
      }
    }
  }

  if (results.length > 0) {
    return {
      found: true,
      data: results.join('\n'),
      source: 'routescan',
    };
  }

  return { found: false, data: '', source: 'routescan' };
}
