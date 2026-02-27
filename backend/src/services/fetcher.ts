// ── Article fetcher — fetch URL, strip HTML, extract metadata ────────

export interface Article {
  url: string;
  title: string;
  text: string;
  publishedAt: string | null;
}

function stripHtml(html: string): string {
  let text = html;
  // Remove script and style blocks entirely
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  // Add newlines for block elements
  text = text.replace(/<\/?(?:p|div|br|hr|h[1-6]|li|tr|td|th|blockquote|pre|section|article|header|footer|nav|aside)\b[^>]*>/gi, '\n');
  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#0?39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  // Normalize whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n[ \t]+/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function extractTitle(html: string): string {
  // Try og:title first, then <title>
  const ogMatch = html.match(/property="og:title"\s+content="([^"]+)"/i)
    ?? html.match(/content="([^"]+)"\s+property="og:title"/i);
  if (ogMatch) return ogMatch[1].trim();

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch ? stripHtml(titleMatch[1]).trim() : '';
}

function extractPublishedAt(html: string): string | null {
  const patterns = [
    /content="([^"]+)"[^>]*property="article:published_time"/i,
    /property="article:published_time"[^>]*content="([^"]+)"/i,
    /content="([^"]+)"[^>]*name="pubdate"/i,
    /name="pubdate"[^>]*content="([^"]+)"/i,
    /content="([^"]+)"[^>]*itemprop="datePublished"/i,
    /itemprop="datePublished"[^>]*content="([^"]+)"/i,
    /"datePublished"\s*:\s*"([^"]+)"/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function fetchArticle(url: string): Promise<Article> {
  console.log(`[fetcher] Fetching article: ${url}`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'EvaProtocol/1.0 (+https://eva.jaack.me)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const article: Article = {
    url,
    title: extractTitle(html),
    text: stripHtml(html),
    publishedAt: extractPublishedAt(html),
  };
  console.log(`[fetcher] Got article: "${article.title}" (${article.text.length} chars)`);
  return article;
}
