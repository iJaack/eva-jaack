import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from '../backend/src/app.js';

function readBody(req: IncomingMessage): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const chunks: Uint8Array[] = [];
    req.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    req.on('end', () => {
      const total = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      resolve(merged);
    });
  });
}

export function resolveOriginalPathFromUrl(rawUrl = '/', host = 'localhost'): string {
  const incoming = new URL(rawUrl, `https://${host}`);
  const route = incoming.searchParams.get('route');
  const path = incoming.searchParams.get('path');
  const passthroughSearchParams = new URLSearchParams(incoming.searchParams);
  passthroughSearchParams.delete('route');
  passthroughSearchParams.delete('path');
  const passthroughSearch = passthroughSearchParams.toString();
  const suffix = passthroughSearch ? `?${passthroughSearch}` : '';

  if (route === 'api') {
    return `${path ? `/api/${path}` : '/api'}${suffix}`;
  }

  if (route === 'well-known') {
    return `${path ? `/.well-known/${path}` : '/.well-known'}${suffix}`;
  }

  if (route === 'health') {
    return `/health${suffix}`;
  }

  return `${incoming.pathname}${incoming.search}`;
}

function resolveOriginalPath(req: IncomingMessage): string {
  return resolveOriginalPathFromUrl(req.url ?? '/', req.headers.host ?? 'localhost');
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const host = req.headers.host ?? 'localhost';
  const originalPath = resolveOriginalPath(req);
  const url = `https://${host}${originalPath}`;
  const headers = new Headers(req.headers as Record<string, string>);
  const body = req.method === 'GET' || req.method === 'HEAD'
    ? undefined
    : (await readBody(req)) as unknown as BodyInit;

  const response = await app.fetch(new Request(url, { method: req.method, headers, body }));

  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(new Uint8Array(await response.arrayBuffer()));
}
