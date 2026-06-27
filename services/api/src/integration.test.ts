import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { appRouter } from './router';
import { createDb } from './db';
import { firstOrgIdFor, getUserFromAuthHeader, loadOrgContext, type Context } from './context';

/**
 * Integration tests against a real Postgres. Set TEST_DATABASE_URL to run (the suite skips
 * otherwise so CI without a DB stays green). See .claude/engineering/testing-guide.md.
 *   createdb aropon_vitest && TEST_DATABASE_URL=postgres://.../aropon_vitest pnpm --filter @aropon/api-server test
 */
const URL = process.env.TEST_DATABASE_URL;
const SECRET = 'test-secret';
const suite = URL ? describe : describe.skip;

suite('Aropon API', () => {
  let db: ReturnType<typeof createDb>;

  beforeAll(async () => {
    db = createDb(URL!);
    await migrate(db, { migrationsFolder: path.join(process.cwd(), '../../packages/db/migrations') });
  });

  async function ctxFor(token?: string): Promise<Context> {
    const user = await getUserFromAuthHeader(SECRET, token ? `Bearer ${token}` : undefined);
    let org = null;
    if (user) {
      const o = await firstOrgIdFor(db, user.id);
      if (o) org = await loadOrgContext(db, user.id, o);
    }
    return { db, authSecret: SECRET, user, org };
  }
  const pub = async () => appRouter.createCaller(await ctxFor());
  const as = async (token: string) => appRouter.createCaller(await ctxFor(token));

  it('demo logins are isolated (no collisions)', async () => {
    const a = await (await pub()).auth.demoLogin({ tier: 't1' });
    const b = await (await pub()).auth.demoLogin({ tier: 't1' });
    expect(a.orgs[0]!.orgId).not.toBe(b.orgs[0]!.orgId);

    const ca = await as(a.token);
    await ca.finance.addTransaction({
      id: randomUUID(), orgId: a.orgs[0]!.orgId, type: 'income', amountPoisha: 12345,
      category: 'টেস্ট', occurredAt: new Date().toISOString(),
    });
    const aCount = (await ca.finance.list({ orgId: a.orgs[0]!.orgId, limit: 99 })).length;
    const bCount = (await (await as(b.token)).finance.list({ orgId: b.orgs[0]!.orgId, limit: 99 })).length;
    expect(aCount).toBe(bCount + 1); // A got the new txn, B is untouched
  });

  it('reset gives a clean slate', async () => {
    const d = await (await pub()).auth.demoLogin({ tier: 't1' });
    const c = await as(d.token);
    expect((await c.finance.list({ orgId: d.orgs[0]!.orgId, limit: 99 })).length).toBeGreaterThan(0);
    await c.auth.resetMyData();
    expect((await c.finance.list({ orgId: d.orgs[0]!.orgId, limit: 99 })).length).toBe(0);
  });

  it('T0 cannot access T1 features (server-enforced gating)', async () => {
    const t0 = await (await pub()).auth.demoLogin({ tier: 't0' });
    const c = await as(t0.token);
    await expect(c.orders.list({ orgId: t0.orgs[0]!.orgId })).rejects.toThrow();
  });

  it('finance: add reflects in balance + summary', async () => {
    const d = await (await pub()).auth.demoLogin({ tier: 't0' });
    const c = await as(d.token);
    const before = (await c.finance.balance({ orgId: d.orgs[0]!.orgId })).balancePoisha;
    await c.finance.addTransaction({
      id: randomUUID(), orgId: d.orgs[0]!.orgId, type: 'income', amountPoisha: 50000,
      category: 'বিক্রয়', occurredAt: new Date().toISOString(),
    });
    expect((await c.finance.balance({ orgId: d.orgs[0]!.orgId })).balancePoisha).toBe(before + 50000);
  });

  it('orders: create → confirm reflects in list', async () => {
    const d = await (await pub()).auth.demoLogin({ tier: 't1' });
    const c = await as(d.token);
    const o = await c.orders.create({
      orgId: d.orgs[0]!.orgId, customerName: 'করিম', channel: 'facebook',
      items: [{ productName: 'শার্ট', quantity: 3, unitPricePoisha: 80000 }],
    });
    expect(o.totalPoisha).toBe(240000);
    await c.orders.setStatus({ orgId: d.orgs[0]!.orgId, orderId: o.id, status: 'confirmed' });
    const list = await c.orders.list({ orgId: d.orgs[0]!.orgId });
    expect(list.find((x) => x.id === o.id)?.status).toBe('confirmed');
  });

  it('inbox: seeded conversations, auto-reply + escalate', async () => {
    const d = await (await pub()).auth.demoLogin({ tier: 't1' });
    const c = await as(d.token);
    const convos = await c.inbox.list({ orgId: d.orgs[0]!.orgId, status: 'all' });
    expect(convos.length).toBeGreaterThan(0);
    const conv = convos[0]!;
    const ar = await c.inbox.autoReply({ orgId: d.orgs[0]!.orgId, conversationId: conv.id });
    expect(ar.body.length).toBeGreaterThan(0);
    await c.inbox.escalate({ orgId: d.orgs[0]!.orgId, conversationId: conv.id });
    const thread = await c.inbox.thread({ orgId: d.orgs[0]!.orgId, conversationId: conv.id });
    expect(thread.status).toBe('escalated');
  });
});
