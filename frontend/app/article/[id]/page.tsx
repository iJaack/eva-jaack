import ArticleDetail from "./ArticleDetail";

export function generateStaticParams() {
  return Array.from({ length: 20 }, (_, i) => ({ id: String(i) }));
}

export default function ArticlePage() {
  return <ArticleDetail />;
}
