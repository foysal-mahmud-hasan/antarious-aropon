import { serve } from '@hono/node-server';
import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { parseServerEnv } from '@aropon/config';
import { appRouter } from './router';
import { createDb } from './db';
import { getUserFromAuthHeader, loadOrgContext, type Context } from './context';

const env = parseServerEnv(process.env);
const db = createDb(env.DATABASE_URL);

const app = new Hono();

app.get('/health', (c) => c.json({ ok: true }));

// TODO(M0): payment webhooks — app.post('/webhooks/payments/:provider', ...)

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: async (_opts, c) => {
      const user = await getUserFromAuthHeader(c.req.header('authorization'));
      const orgId = c.req.header('x-org-id');
      const org = user && orgId ? await loadOrgContext(db, user.id, orgId) : null;
      const ctx = { db, user, org } satisfies Context;
      // Adapter types context as Record<string, unknown>; tRPC re-types it as Context via initTRPC.
      return ctx as unknown as Record<string, unknown>;
    },
  }),
);

const port = env.PORT;
serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`aropon-api listening on :${info.port}`);
});
