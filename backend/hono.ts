/* eslint-disable import/no-unresolved */

import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';

import { appRouter } from './trpc/app-router';
import { createContext } from './trpc/create-context';

const app = new Hono();

app.use('*', cors());

app.use(
  '/trpc/*',
  trpcServer({
    endpoint: '/api/trpc',
    router: appRouter,
    createContext,
  })
);

app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Employee Management API is running' });
});

const port = 3000;

serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 Hono backend running at http://localhost:${port}`);
