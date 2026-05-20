export type BlogPostSection = {
  title: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  dek: string;
  publishedAt: string;
  readingTime: string;
  featured: boolean;
  bodySections: BlogPostSection[];
};

const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-eva-protocol-is",
    title: "What Eva Protocol Is",
    excerpt:
      "Eva Protocol turns public predictions, source claims, and curator work into reputation that can be inspected over time.",
    dek:
      "Eva is not trying to replace prediction markets or social feeds. It gives market reasoning and verification work a durable record.",
    publishedAt: "2026-05-20",
    readingTime: "4 min read",
    featured: true,
    bodySections: [
      {
        title: "The short version",
        paragraphs: [
          "Eva Protocol is a prediction and verification reputation layer on Avalanche. It helps people and agents turn a public market call into a structured record: market, outcome, odds context, rationale, source claims, evidence, and eventual outcome history.",
          "The core idea is simple. A post can disappear into a feed, but a thesis page can be revisited. A claim can be reused across markets. A curator or predictor can build a track record that outlives one thread.",
        ],
      },
      {
        title: "The product object",
        paragraphs: [
          "The main object in Eva is the thesis. A thesis points at an external market, names an outcome, captures the reasoning behind the call, and links evidence that readers can inspect.",
          "Theses can be copied, countered, shared, and resolved. That gives prediction discourse a product surface without requiring Eva to become a trading venue.",
        ],
      },
      {
        title: "The trust layer",
        paragraphs: [
          "EvaTrustGraph is the long-lived trust primitive. It is where identity, curator registration, self-stake, and graph-backed reputation belong.",
          "The app can start with offchain thesis and claim records, then promote durable resolved outcomes into reputation when the adapter boundary is ready.",
        ],
      },
      {
        title: "What is live today",
        paragraphs: [
          "Eva has a live app surface for markets, theses, predictors, claims, verification, blog content, and curator onboarding. The canonical production target is Vercel, and the primary chain is Avalanche C-Chain.",
          "Eva does not execute trades in v1. It does not custody funds or run a native prediction market today. It links to external venues and keeps the reasoning record useful.",
        ],
      },
    ],
  },
  {
    slug: "why-eva-starts-with-prediction-reputation",
    title: "Why Eva Starts With Prediction Reputation",
    excerpt:
      "Prediction markets already create public arguments. Eva's first job is to preserve the reasoning and make the record useful.",
    dek:
      "The wedge is not a new trading venue. The wedge is reputation for the people and agents explaining why a market is mispriced.",
    publishedAt: "2026-05-20",
    readingTime: "4 min read",
    featured: false,
    bodySections: [
      {
        title: "The behavior already exists",
        paragraphs: [
          "People already publish market calls on X. They post screenshots, argue in replies, cite sources, and explain why they think a price is wrong.",
          "That activity has value, but the record is fragile. The post is hard to find later. The evidence is scattered. The outcome often does not attach back to the person who made the call.",
        ],
      },
      {
        title: "The Eva wedge",
        paragraphs: [
          "Eva starts by giving those calls a durable structure. A market thesis has a market, an outcome, an odds snapshot, a rationale, source links, and a page that can be shared or challenged.",
          "That is enough to make a prediction more useful before any native settlement layer exists. A reader can inspect the reasoning. Another predictor can counter it. A curator can improve the evidence trail.",
        ],
      },
      {
        title: "Why reputation matters",
        paragraphs: [
          "The valuable question is not only whether one call was right. The valuable question is who keeps making useful calls and who keeps improving the evidence record around them.",
          "That is where EvaTrustGraph matters. The trust graph gives Eva a durable place to remember identity and reputation as the product moves from offchain thesis records toward stronger graph-backed feedback.",
        ],
      },
      {
        title: "The honest boundary",
        paragraphs: [
          "Eva does not need to execute trades to make prediction markets more legible. In v1, copy actions are previews and external links only.",
          "The product should prove that people want public reputation for their reasoning before Eva takes on deeper settlement, payment, or market infrastructure.",
        ],
      },
    ],
  },
  {
    slug: "how-eva-uses-avalanche-and-the-trust-graph",
    title: "How Eva Uses Avalanche and the Trust Graph",
    excerpt:
      "Eva keeps fast product iteration offchain while anchoring durable identity and trust in EvaTrustGraph on Avalanche.",
    dek:
      "The architecture separates what must be durable from what should stay flexible while the product loop is still being learned.",
    publishedAt: "2026-05-20",
    readingTime: "4 min read",
    featured: false,
    bodySections: [
      {
        title: "Two layers",
        paragraphs: [
          "Eva has an application layer and a trust layer. The application layer handles markets, theses, source URLs, claims, evidence reports, and product workflows.",
          "The trust layer is ERC-8004 identity plus EvaTrustGraph on Avalanche. It is the canonical place for registered curator identity, self-stake, and graph-backed trust state.",
        ],
      },
      {
        title: "Why not put everything onchain",
        paragraphs: [
          "Early product objects change quickly. A thesis may need richer evidence, better source structure, or a different resolution workflow as users teach the product what matters.",
          "Keeping v1 thesis records offchain lets Eva iterate without pretending every product detail is already protocol-stable.",
        ],
      },
      {
        title: "What belongs onchain",
        paragraphs: [
          "Identity and reputation need stronger durability. If a curator stakes behind sources or an agent builds a record over time, that should not depend on a single app session.",
          "That is why Eva treats ERC-8004 as the identity and reputation spine and EvaTrustGraph as the long-lived trust primitive. Offchain activity can become reputation-relevant after it resolves and passes through an explicit adapter boundary.",
        ],
      },
      {
        title: "What remains future scope",
        paragraphs: [
          "Native verification-market contracts, x402 payment enforcement, and trade execution are not production claims today unless current config and deployment truth say otherwise.",
          "The near-term job is to make the prediction, evidence, and curator loops honest, measurable, and useful before adding heavier protocol mechanics.",
        ],
      },
    ],
  },
  {
    slug: "market-odds-are-not-truth-status",
    title: "Market Odds Are Not Truth Status",
    excerpt:
      "Eva separates what a market prices from what evidence and resolution sources can actually verify.",
    dek:
      "That distinction is the product strategy. Eva can make prediction discourse more useful without launching as a real-money exchange.",
    publishedAt: "2026-05-20",
    readingTime: "4 min read",
    featured: false,
    bodySections: [
      {
        title: "Two different signals",
        paragraphs: [
          "Market odds are a price signal. They tell you what a venue is pricing at a point in time, with all the liquidity, incentives, and participant behavior that implies.",
          "Truth status is different. It depends on evidence, identity, resolution source, resolver, dispute window, and outcome. Eva's copy and product should keep those ideas separate.",
        ],
      },
      {
        title: "The status language",
        paragraphs: [
          "Eva should use plain statuses: forecast, unresolved, verified, disputed, resolved, and void.",
          "A forecast is a prediction before resolution. Unresolved means the claim cannot yet be judged. Verified means evidence or the accepted resolution source supports it. Disputed means the evidence, identity, resolver, or outcome is contested. Resolved means the outcome is final under the stated rules. Void means the premise, market, or evidence became invalid.",
        ],
      },
      {
        title: "Claim bundles",
        paragraphs: [
          "A useful claim bundle needs more than a sentence and a link. It should include the claim, deadline, resolution source, evidence, identity, conflicts, resolver, dispute window, and outcome.",
          "That structure lets a claim be reused across theses, markets, articles, and agents without pretending every claim is ready to become onchain reputation immediately.",
        ],
      },
      {
        title: "The risk boundary",
        paragraphs: [
          "V1 should avoid categories where incentives or harm surfaces can overwhelm the product: elections, sports betting, war, assassination, criminal investigations, personal tragedies, and easily manipulable events.",
          "The right launch wedge is narrower: clear resolution sources, limited harm, and examples where better evidence and reputation make the market argument easier to inspect.",
        ],
      },
    ],
  },
  {
    slug: "how-eva-works-as-a-prediction-os",
    title: "How Eva Works as a Prediction OS",
    excerpt:
      "Eva connects markets, thesis pages, evidence checks, and predictor profiles so market reasoning has a durable product record.",
    dek:
      "The product is simple: track a market, publish a thesis, attach evidence, and let the predictor record update as the call develops.",
    publishedAt: "2026-04-22",
    readingTime: "3 min read",
    featured: true,
    bodySections: [
      {
        title: "Markets",
        paragraphs: [
          "Eva starts with external markets. The product shows the question, available outcomes, current odds, volume, liquidity, and close context without becoming a trading venue.",
          "Markets give every thesis a shared reference point. A reader can see what was predicted and what the odds looked like when the argument was made.",
        ],
      },
      {
        title: "Theses",
        paragraphs: [
          "A thesis is the core product object: predictor, market, selected outcome, odds at post, current odds, rationale, and source links.",
          "That structure turns a loose market take into a page that can be copied, countered, reviewed, and resolved later.",
        ],
      },
      {
        title: "Evidence",
        paragraphs: [
          "Evidence tools support the thesis record. Source URLs, claim packets, and verification reports make the reasoning behind a prediction easier to inspect.",
          "Eva does not need every source to be onchain at creation. Evidence can live in app storage first and become reputation-relevant when outcomes resolve.",
        ],
      },
      {
        title: "Predictors",
        paragraphs: [
          "Predictor profiles combine two layers: Eva Trust Score from the graph, and market record from theses, outcomes, copied theses, counters, and evidence.",
          "A profile can start unclaimed, then become graph-backed when a user links wallet and agent identity.",
        ],
      },
    ],
  },
  {
    slug: "eva-mvp-evolution-prediction-reputation",
    title: "Eva’s MVP Is Now Prediction Reputation",
    excerpt:
      "Eva’s front door is moving from article verification to X-native market theses because the target audience already posts calls, screenshots, and trade arguments in public.",
    dek:
      "The core primitive did not change: EvaTrustGraph is still the trust layer. What changed is the wedge. The MVP now starts with prediction-market reputation because that is where distribution, urgency, and measurable outcomes meet.",
    publishedAt: "2026-04-22",
    readingTime: "4 min read",
    featured: false,
    bodySections: [
      {
        title: "What changed",
        paragraphs: [
          "The original Eva MVP put article verification at the front of the product. That made sense as infrastructure: fetch a source, extract factual claims, score the evidence, and connect the result to a trust graph.",
          "The new MVP changes the front door. Eva now starts with prediction theses: a market, an outcome, the odds at the time of posting, the rationale, and the evidence behind the call. Verification remains useful, but it becomes support for a thesis instead of the main loop.",
        ],
      },
      {
        title: "Why X first",
        paragraphs: [
          "The target audience is already on X. They post screenshots from prediction markets, explain why odds are mispriced, argue in replies, and build informal reputations through threads that disappear into the feed.",
          "That is the GTM opening. Eva should not ask that audience to adopt a new behavior before they get value. It should turn the behavior they already have into a public track record they can share, defend, and compound.",
        ],
      },
      {
        title: "What stays",
        paragraphs: [
          "EvaTrustGraph remains the important primitive. A predictor can start as an unclaimed X profile, but the stronger version is graph-backed: wallet, ERC-8004 agent identity, stake, and reputation that can outlive a single thread.",
          "The protocol still cares about durable trust. The product just gets there through a sharper wedge: visible market calls with outcomes people can inspect.",
        ],
      },
      {
        title: "What v1 does not do",
        paragraphs: [
          "Eva does not execute trades in v1. It does not custody funds, place orders, or run a native prediction market. Copy actions are previews and external links only.",
          "That boundary matters. The MVP is testing whether predictors want public reputation for their calls before the protocol takes on settlement, execution, or deeper market infrastructure.",
        ],
      },
      {
        title: "What the MVP tests",
        paragraphs: [
          "The metric is not page views. The metric is weekly active predictors: people who publish calls, come back, and care enough about their record to keep using Eva.",
          "If that loop works, the next layer is obvious: resolved outcomes can feed reputation, counter-theses can improve signal, and the trust graph can become the durable memory behind prediction-market discourse.",
        ],
      },
    ],
  },
  {
    slug: "what-eva-is-and-where-eva-fits",
    title: "What Eva Is and Where $EVA Fits",
    excerpt:
      "Eva is a prediction and verification reputation layer. Curators and predictors build records around claims, evidence, and market reasoning.",
    dek:
      "In simple terms: Eva makes prediction and curation work more accountable without launching as a real-money exchange.",
    publishedAt: "2026-03-25",
    readingTime: "3 min read",
    featured: false,
    bodySections: [
      {
        title: "Eva in simple terms",
        paragraphs: [
          "Eva is a prediction and verification reputation layer. The basic idea is simple: people and agents should be able to publish market theses and source claims, then build a visible record as those claims resolve.",
          "On most social platforms, attention is driven by engagement. Eva shifts the focus toward credibility: who made the call, what evidence they used, what the market priced, and what the accepted resolution source eventually showed.",
        ],
      },
      {
        title: "How trust works",
        paragraphs: [
          "Curators register on the trust graph and submit source URLs or claims they are willing to stand behind. Predictors publish theses tied to markets, evidence, deadlines, and resolution sources.",
          "Eva keeps market odds separate from truth status. A claim can be forecast, unresolved, verified, disputed, resolved, or void. That distinction lets the product track reasoning without pretending market price is the same thing as truth.",
        ],
      },
      {
        title: "What $EVA does",
        paragraphs: [
          "$EVA is the network asset tied to participation. It is used for curator stake, which means curation is not just expressive, it carries weight. A curator is not only saying 'I think this matters' but also committing capital behind that judgment.",
          "That does not make Eva a trading venue. Its role here is practical: it helps align incentives inside a reputation system where useful prediction and verification work should become visible over time.",
        ],
      },
      {
        title: "Why that matters",
        paragraphs: [
          "The point of Eva is not to replace reading, trading judgment, or critical thinking. It is to make good reasoning easier to inspect and weak reasoning harder to launder through a feed.",
          "In that sense, Eva and $EVA are tied together by one idea: if prediction and verification work has value, then reputation around that work should be measurable, durable, and tied to real participation.",
        ],
      },
    ],
  },
];

export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((left, right) => (
    new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
  ));
}

export function getFeaturedPosts(): BlogPost[] {
  return getAllPosts().filter((post) => post.featured);
}

export function getPostBySlug(slug: string): BlogPost | null {
  return BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export function formatBlogDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
