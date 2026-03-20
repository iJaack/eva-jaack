import { serve } from '@hono/node-server';
import { app } from './app.js';
import { config } from './config.js';

console.log(`Eva backend listening on :${config.port}`);
serve({ fetch: app.fetch, port: config.port });
