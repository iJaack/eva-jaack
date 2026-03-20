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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = `https://${req.headers.host}${req.url}`;
  const headers = new Headers(req.headers as Record<string, string>);
  const body = req.method === 'GET' || req.method === 'HEAD'
    ? undefined
    : (await readBody(req)) as unknown as BodyInit;

  const response = await app.fetch(new Request(url, { method: req.method, headers, body }));

  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(new Uint8Array(await response.arrayBuffer()));
}
