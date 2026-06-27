import { randomUUID } from 'node:crypto';
import { parseServerEnv } from '@aropon/config';
import { appRouter } from '../src/router';
import { createDb } from '../src/db';
import { firstOrgIdFor, getUserFromAuthHeader, loadOrgContext, type Context } from '../src/context';

const env = parseServerEnv(process.env);
const db = createDb(env.DATABASE_URL);

async function ctxFor(auth?: string): Promise<Context> {
  const user = await getUserFromAuthHeader(env.AUTH_JWT_SECRET, auth);
  let org = null;
  if (user) {
    const o = await firstOrgIdFor(db, user.id);
    if (o) org = await loadOrgContext(db, user.id, o);
  }
  return { db, authSecret: env.AUTH_JWT_SECRET, user, org };
}

async function main() {
  const pub = appRouter.createCaller(await ctxFor());
  const a = await pub.auth.demoLogin({ tier: 't1' });
  const b = await pub.auth.demoLogin({ tier: 't1' });
  console.log('1. two demo logins → different orgs:', a.orgs[0]!.orgId !== b.orgs[0]!.orgId);

  const ca = appRouter.createCaller(await ctxFor(`Bearer ${a.token}`));
  const cb = appRouter.createCaller(await ctxFor(`Bearer ${b.token}`));
  console.log('2. seeded data each: A', (await ca.finance.list({ orgId: a.orgs[0]!.orgId, limit: 99 })).length,
    'B', (await cb.finance.list({ orgId: b.orgs[0]!.orgId, limit: 99 })).length);

  await ca.finance.addTransaction({
    id: randomUUID(), orgId: a.orgs[0]!.orgId, type: 'income', amountPoisha: 99999,
    category: 'টেস্ট', occurredAt: new Date().toISOString(),
  });
  const aN = (await ca.finance.list({ orgId: a.orgs[0]!.orgId, limit: 99 })).length;
  const bN = (await cb.finance.list({ orgId: b.orgs[0]!.orgId, limit: 99 })).length;
  console.log('3. add to A only → A', aN, 'B', bN, '(B unchanged = isolated)');

  await ca.auth.resetMyData();
  console.log('4. reset A →', (await ca.finance.list({ orgId: a.orgs[0]!.orgId, limit: 99 })).length, '(0 = clean slate)');

  const t0 = await pub.auth.demoLogin({ tier: 't0' });
  const ct0 = appRouter.createCaller(await ctxFor(`Bearer ${t0.token}`));
  try {
    await ct0.orders.list({ orgId: t0.orgs[0]!.orgId });
    console.log('5. T0 orders gating: NOT blocked ❌');
  } catch (e) {
    console.log('5. T0 orders gating: blocked ✓', (e as { code?: string }).code ?? '');
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
