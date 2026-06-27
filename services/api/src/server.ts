import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { parseServerEnv } from '@aropon/config';
import { appRouter } from './router';
import { createDb } from './db';
import { runSeed } from './seed';
import {
  firstOrgIdFor,
  getUserFromAuthHeader,
  loadOrgContext,
  type Context,
} from './context';

const env = parseServerEnv(process.env);
const db = createDb(env.DATABASE_URL);

function buildApp() {
  const app = new Hono();
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
  return app;
}

async function bootstrap() {
  // Auto-migrate when a bundled migrations folder is present (prod single-file deploy). In dev
  // (tsx) migrations are run via `pnpm db:migrate`, so this is skipped.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = process.env.MIGRATIONS_DIR ?? path.join(here, 'migrations');
  if (existsSync(migrationsFolder)) {
    console.log('→ applying migrations from', migrationsFolder);
    await migrate(db, { migrationsFolder });
  }

  if ((process.env.SEED_DEMO ?? 'true') !== 'false') {
    try {
      const r = await runSeed(db);
      console.log('→ demo seed:', r);
    } catch (e) {
      console.error('seed failed (continuing):', e);
    }
  }

  serve({ fetch: buildApp().fetch, port: env.PORT }, (info) => {
    // eslint-disable-next-line no-console
    console.log(`aropon-api listening on :${info.port}`);
  });
}

void bootstrap();
