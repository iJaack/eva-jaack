const defaultApiBase = process.env.EVA_API_BASE ?? "https://api.eva.jaack.me/api";
const defaultWallet = "0x0fe61780bd5508b3C99e420662050e5560608cA4";
const title = "SpaceX IPO liquidity rotation thesis";
const body =
  "SpaceX IPO anticipation is absorbing speculative liquidity now; after the IPO path becomes explicit, risk markets can reprice as attention and liquidity rotate.";

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function normalizeApiBase(value) {
  return value.replace(/\/$/, "");
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${data?.error ?? text}`);
  }
  return data;
}

const apiBase = normalizeApiBase(argValue("--api-base") ?? defaultApiBase);
const walletAddress = argValue("--wallet") ?? defaultWallet;
const dryRun = hasFlag("--dry-run") || !hasFlag("--publish");

const payload = {
  dynamicUserId: "evalanche:spacex-ipo-liquidity",
  xHandle: "@spacethesis",
  xProfileId: "spaceX-ipo-liquidity",
  walletAddress,
  walletSource: "embedded",
  title,
  body,
  predictionSignals: [
    {
      marketId: "spacex-ipo-before-2027",
      marketTitle: "Will SpaceX IPO before the end of 2027?",
      marketUrl: "https://polymarket.com/",
      provider: "manual",
      selectedOutcomeId: "yes",
      selectedOutcomeLabel: "Yes",
      oddsAtAdd: 0.24,
      currentOdds: 0.24,
      weight: 60,
      role: "core",
      rationale: "Primary market signal for IPO timing; if timing probability rises, liquidity rotation becomes more actionable.",
      status: "open",
    },
    {
      marketTitle: "Private-market liquidity tightness before a major SpaceX listing",
      marketUrl: "https://eva.jaack.me/",
      provider: "manual",
      selectedOutcomeLabel: "Liquidity remains constrained before IPO clarity",
      oddsAtAdd: 0.55,
      currentOdds: 0.55,
      weight: 20,
      role: "second_order",
      rationale: "Second-order signal: capital waits for liquidity and allocation clarity before rotating into adjacent risk markets.",
      status: "open",
    },
  ],
  factSignals: [
    {
      claimText: "SpaceX has used private tender offers and secondary liquidity before pursuing a public listing.",
      sourceUrl: "https://www.spacex.com/",
      verifierVerdict: "unverifiable_yet",
      verifierScore: 50,
      weight: 10,
      role: "lateral",
      rationale: "Tender and secondary-market facts inform whether IPO anticipation can absorb liquidity before a listing path is explicit.",
    },
    {
      claimText: "The thesis should be revised when IPO timing markets, private-market liquidity facts, or adjacent risk-market signals materially change.",
      sourceUrl: "https://eva.jaack.me/",
      verifierVerdict: "non_falsifiable",
      verifierScore: 50,
      weight: 10,
      role: "third_order",
      rationale: "This is the operating rule for the living post: market changes should produce visible thesis history.",
    },
  ],
  evidenceLinks: ["https://eva.jaack.me/markets"],
  sourceUrl: "https://polymarket.com/",
};

if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
  throw new Error("--wallet must be a 20-byte hex address");
}

if (dryRun) {
  console.log(JSON.stringify({ apiBase, dryRun: true, payload }, null, 2));
  process.exit(0);
}

const existing = await fetchJson(`${apiBase}/theses?author=${encodeURIComponent(payload.xHandle)}`);
const duplicate = existing.theses?.find((thesis) => thesis.title === title && thesis.author?.walletAddress?.toLowerCase() === walletAddress.toLowerCase());
if (duplicate) {
  console.log(JSON.stringify({ created: false, thesisId: duplicate.thesisId, url: `https://eva.jaack.me/thesis/${duplicate.thesisId}` }, null, 2));
  process.exit(0);
}

const created = await fetchJson(`${apiBase}/theses`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
});

console.log(
  JSON.stringify(
    {
      created: created.created,
      thesisId: created.thesis.thesisId,
      url: `https://eva.jaack.me/thesis/${created.thesis.thesisId}`,
      signalCount: created.thesis.signals.length,
      score: created.thesis.currentScore,
    },
    null,
    2,
  ),
);
