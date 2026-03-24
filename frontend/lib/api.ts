import { protocol, getApiBase } from "./protocol";
import type {
  ArticleDetailResponse,
  ArticleListResponse,
  CuratorDetailResponse,
  CuratorListResponse,
  VerifyResponse,
  OnchainArticleDto,
  CuratorDto,
} from "../../backend/src/lib/api-types";

export type Article = OnchainArticleDto;
export type Curator = CuratorDto;
export type ArticleDetail = ArticleDetailResponse;
export type CuratorDetail = CuratorDetailResponse;
export type VerificationResult = VerifyResponse;

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : `Request failed: ${response.status}`);
  }

  return data as T;
}

export async function getArticles(options?: { curator?: string; limit?: number }): Promise<ArticleListResponse> {
  const url = new URL(`${getApiBase()}/article`);
  if (options?.curator) url.searchParams.set("curator", options.curator);
  if (options?.limit) url.searchParams.set("limit", String(options.limit));
  return fetchJson<ArticleListResponse>(url.toString());
}

export async function getArticleDetail(articleId: number): Promise<ArticleDetailResponse> {
  return fetchJson<ArticleDetailResponse>(`${getApiBase()}/article/${articleId}`);
}

export async function getCurators(): Promise<CuratorListResponse> {
  return fetchJson<CuratorListResponse>(`${getApiBase()}/curators`);
}

export async function getCuratorDetail(id: string): Promise<CuratorDetailResponse> {
  return fetchJson<CuratorDetailResponse>(`${getApiBase()}/curator/${id}`);
}

export async function verifyArticleUrl(url: string): Promise<VerifyResponse> {
  return fetchJson<VerifyResponse>(`${getApiBase()}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
}

export function explorerTxUrl(hash: string): string {
  return `${protocol.chain.explorerUrl}/tx/${hash}`;
}
