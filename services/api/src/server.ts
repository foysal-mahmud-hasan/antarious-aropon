import { serve } from '@hono/node-server';
import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseServerEnv } from '@aropon/config';
import { appRouter } from './router';
import { createDb } from './db';
import {
  firstOrgIdFor,
  getUserFromAuthHeader,
  loadOrgContext,
  type Context,
} from './context';

const env = parseServerEnv(process.env);
const db = createDb(env.DATABASE_URL);

const app = new Hono();

// Allow the web app (any origin in dev) to call the API.
app.use('*', cors());
app.get('/health', (c) => c.json({ ok: true }));

// TODO: payment webhooks — app.post('/webhooks/payments/:provider', ...)

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: async (_opts, c) => {
      const user = await getUserFromAuthHeader(env.AUTH_JWT_SECRET, c.req.header('authorization'));
      let org = null;
      if (user) {
        const orgId = c.req.header('x-org-id') ?? (await firstOrgIdFor(db, user.id));
        if (orgId) org = await loadOrgContext(db, user.id, orgId);
      }
      const ctx: Context = { db, authSecret: env.AUTH_JWT_SECRET, user, org };
      return ctx as unknown as Record<string, unknown>;
    },
  }),
);

const port = env.PORT;
serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`aropon-api listening on :${info.port}`);
});
