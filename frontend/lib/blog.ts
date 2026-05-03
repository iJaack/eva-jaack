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
      "Eva’s front door is moving from article verification to X-native market theses because the first users already post calls, screenshots, and trade arguments in public.",
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
          "The first users are already on X. They post screenshots from prediction markets, explain why odds are mispriced, argue in replies, and build informal reputations through threads that disappear into the feed.",
          "That is the GTM opening. Eva should not ask those users to adopt a new behavior before they get value. It should turn the behavior they already have into a public track record they can share, defend, and compound.",
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
      "Eva is a trust-weighted news and verification network. Curators stake behind sources, Eva checks the evidence, and $EVA ties participation to real conviction.",
    dek:
      "In simple terms: Eva is a way to make online curation more accountable. Instead of just posting links, curators put stake behind what they share and build a visible track record over time.",
    publishedAt: "2026-03-25",
    readingTime: "3 min read",
    featured: false,
    bodySections: [
      {
        title: "Eva in simple terms",
        paragraphs: [
          "Eva is a trust-weighted news and verification network. The basic idea is simple: people and agents should be able to share information, but they should also have a visible track record that shows whether they have been reliable over time.",
          "On most social platforms, attention is driven by engagement. Eva is trying to shift that toward credibility. Instead of rewarding whoever is loudest or fastest, the network is designed to surface the people who consistently point others toward accurate information.",
        ],
      },
      {
        title: "How trust works",
        paragraphs: [
          "Curators register on the trust graph and submit source URLs they are willing to stand behind. Eva then reviews those submissions, extracts factual claims, checks them against available evidence, and records a verification result.",
          "Those results feed back into a curator's trust score. Over time, strong curation becomes visible. If someone repeatedly shares high-signal material, that should show up. If they repeatedly back weak or misleading material, that should show up too.",
        ],
      },
      {
        title: "What $EVA does",
        paragraphs: [
          "$EVA is the network asset tied to participation. It is used for curator stake, which means curation is not just expressive, it carries weight. A curator is not only saying 'I think this matters' but also committing capital behind that judgment.",
          "That does not make $EVA a speculative story on its own. Its role here is practical: it helps align incentives inside the network. If Eva is going to rank people by trust, the system needs a way for participation to feel consequential rather than free and disposable.",
        ],
      },
      {
        title: "Why that matters",
        paragraphs: [
          "The point of Eva is not to replace reading or critical thinking. It is to make good curation easier to identify and poor curation harder to hide. The trust graph becomes a record of who has actually earned confidence.",
          "In that sense, Eva and $EVA are tied together by one idea: if information has value, then reputation around information should be measurable, durable, and tied to real participation.",
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
