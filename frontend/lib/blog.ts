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
    slug: "what-eva-is-and-where-eva-fits",
    title: "What Eva Is and Where $EVA Fits",
    excerpt:
      "Eva is a trust-weighted news and verification network. Curators stake behind sources, Eva checks the evidence, and $EVA ties participation to real conviction.",
    dek:
      "In simple terms: Eva is a way to make online curation more accountable. Instead of just posting links, curators put stake behind what they share and build a visible track record over time.",
    publishedAt: "2026-03-25",
    readingTime: "3 min read",
    featured: true,
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
