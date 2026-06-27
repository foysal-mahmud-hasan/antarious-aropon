import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { schema } from '@aropon/db';
import type { Db } from './db';

/**
 * Idempotent demo seed. Two ready accounts so testers log in (dev OTP) and immediately see a
 * populated app: +8801000000000 (T0, bookkeeping only) and +8801000000001 (T1, social commerce).
 */
type Tier = 't0' | 't1' | 't2' | 't3' | 't4';

async function ensureAccount(db: Db, phone: string, orgName: string, tier: Tier) {
  const existing = await db.query.users.findFirst({ where: eq(schema.users.phone, phone) });
  if (existing) {
    const m = await db.query.memberships.findFirst({
      where: eq(schema.memberships.userId, existing.id),
    });
    return { userId: existing.id, orgId: m!.orgId, created: false };
  }
  const userId = randomUUID();
  const orgId = randomUUID();
  await db.insert(schema.users).values({ id: userId, phone, displayName: 'ডেমো' });
  await db.insert(schema.organizations).values({ id: orgId, name: orgName, ownerId: userId });
  await db.insert(schema.memberships).values({ id: randomUUID(), orgId, userId, role: 'owner' });
  await db.insert(schema.subscriptions).values({ id: randomUUID(), orgId, tier, status: 'active' });
  return { userId, orgId, created: true };
}

async function seedFinance(db: Db, orgId: string, userId: string) {
  const rows: Array<['income' | 'expense', string, number]> = [
    ['income', 'বিক্রয়', 500000],
    ['expense', 'কেনাকাটা', 150000],
    ['income', 'বিক্রয়', 300000],
    ['expense', 'ভাড়া', 100000],
  ];
  for (const [type, category, amountPoisha] of rows) {
    await db.insert(schema.transactions).values({
      id: randomUUID(),
      orgId,
      type,
      amountPoisha,
      category,
      occurredAt: new Date(),
      createdBy: userId,
    });
  }
}

async function seedOrders(db: Db, orgId: string) {
  const id = randomUUID();
  await db.insert(schema.orders).values({
    id,
    orgId,
    customerName: 'রহিম উদ্দিন',
    customerPhone: '+8801712345678',
    channel: 'facebook',
    status: 'pending',
    paymentStatus: 'due',
    totalPoisha: 240000,
  });
  await db.insert(schema.orderItems).values({
    id: randomUUID(),
    orderId: id,
    productName: 'শাড়ি',
    quantity: 2,
    unitPricePoisha: 120000,
  });
}

async function seedInbox(db: Db, orgId: string) {
  const convs: Array<['facebook' | 'instagram', string, string[]]> = [
    ['facebook', 'রহিমা আক্তার', ['আসসালামু আলাইকুম', 'এই শাড়িটার দাম কত?']],
    ['instagram', 'করিম শেখ', ['ডেলিভারি কি ঢাকার বাইরে হয়?']],
  ];
  for (const [channel, customerName, msgs] of convs) {
    const cid = randomUUID();
    const now = new Date();
    await db.insert(schema.conversations).values({
      id: cid,
      orgId,
      channel,
      customerName,
      status: 'open',
      lastMessageAt: now,
    });
    for (const body of msgs) {
      await db.insert(schema.messages).values({
        id: randomUUID(),
        orgId,
        conversationId: cid,
        sender: 'customer',
        body,
        sentAt: now,
      });
    }
  }
}

export async function runSeed(db: Db) {
  const t0 = await ensureAccount(db, '+8801000000000', 'ডেমো দোকান (T0)', 't0');
  if (t0.created) await seedFinance(db, t0.orgId, t0.userId);

  const t1 = await ensureAccount(db, '+8801000000001', 'ডেমো শপ (T1)', 't1');
  if (t1.created) {
    await seedFinance(db, t1.orgId, t1.userId);
    await seedOrders(db, t1.orgId);
    await seedInbox(db, t1.orgId);
  }
  return { t0: t0.created ? 'created' : 'exists', t1: t1.created ? 'created' : 'exists' };
}
