import { Hono } from 'hono';

export async function fetchJson(
  app: Hono,
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: unknown }> {
  const response = await app.fetch(new Request(`http://localhost${path}`, init));
  return {
    status: response.status,
    body: await response.json(),
  };
}
