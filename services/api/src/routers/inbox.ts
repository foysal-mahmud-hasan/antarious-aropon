import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq } from 'drizzle-orm';
import { schema } from '@aropon/db';
import {
  conversationActionInput,
  listConversationsInput,
  orgScopedInput,
  sendReplyInput,
} from '@aropon/validators';
import { requireEntitlement, router } from '../trpc';
import type { Db } from '../db';

/** Unified inbox (messages + comments) gated on `social.inbox` (T1). */
const inboxProc = requireEntitlement('social.inbox');
const autoReplyProc = requireEntitlement('social.auto_reply');
const escalateProc = requireEntitlement('social.manual_escalation');

/** Simple rule-based auto-reply (Bengali). Real AI replies are out of scope/deferred. */
function autoReplyFor(lastCustomerMessage: string): string {
  const m = lastCustomerMessage.toLowerCase();
  if (m.includes('দাম') || m.includes('price') || m.includes('কত')) {
    return 'ধন্যবাদ! পণ্যের দাম ও বিস্তারিত একটু পরেই জানাচ্ছি। 😊';
  }
  if (m.includes('ডেলিভারি') || m.includes('delivery') || m.includes('কুরিয়ার')) {
    return 'সারা দেশে ডেলিভারি করা হয়। ঠিকানা জানালে কুরিয়ার চার্জ জানিয়ে দেব।';
  }
  return 'ধন্যবাদ আপনার মেসেজের জন্য! আমরা দ্রুত উত্তর দিচ্ছি।';
}

export const inboxRouter = router({
  list: inboxProc.input(listConversationsInput).query(async ({ ctx, input }) => {
    const base = eq(schema.conversations.orgId, ctx.org.orgId);
    const rows = await ctx.db
      .select()
      .from(schema.conversations)
      .where(input.status === 'all' ? base : and(base, eq(schema.conversations.status, input.status)))
      .orderBy(desc(schema.conversations.lastMessageAt))
      .limit(100);
    return rows.map((c) => ({
      id: c.id,
      channel: c.channel,
      customerName: c.customerName,
      status: c.status,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
    }));
  }),

  thread: inboxProc.input(conversationActionInput).query(async ({ ctx, input }) => {
    const conv = await ctx.db.query.conversations.findFirst({
      where: and(
        eq(schema.conversations.id, input.conversationId),
        eq(schema.conversations.orgId, ctx.org.orgId),
      ),
    });
    if (!conv) throw new TRPCError({ code: 'NOT_FOUND' });
    const msgs = await ctx.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, input.conversationId))
      .orderBy(asc(schema.messages.sentAt));
    return {
      id: conv.id,
      customerName: conv.customerName,
      channel: conv.channel,
      status: conv.status,
      messages: msgs.map((m) => ({
        id: m.id,
        sender: m.sender,
        body: m.body,
        sentAt: m.sentAt.toISOString(),
      })),
    };
  }),

  reply: inboxProc.input(sendReplyInput).mutation(async ({ ctx, input }) => {
    await assertOwnedConversation(ctx.db, ctx.org.orgId, input.conversationId);
    const now = new Date();
    await ctx.db.insert(schema.messages).values({
      id: randomUUID(),
      orgId: ctx.org.orgId,
      conversationId: input.conversationId,
      sender: 'shop',
      body: input.body,
      sentAt: now,
    });
    await ctx.db
      .update(schema.conversations)
      .set({ lastMessageAt: now })
      .where(eq(schema.conversations.id, input.conversationId));
    return { ok: true as const };
  }),

  autoReply: autoReplyProc.input(conversationActionInput).mutation(async ({ ctx, input }) => {
    await assertOwnedConversation(ctx.db, ctx.org.orgId, input.conversationId);
    const lastCustomer = await ctx.db
      .select()
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.conversationId, input.conversationId),
          eq(schema.messages.sender, 'customer'),
        ),
      )
      .orderBy(desc(schema.messages.sentAt))
      .limit(1);
    const body = autoReplyFor(lastCustomer[0]?.body ?? '');
    const now = new Date();
    await ctx.db.insert(schema.messages).values({
      id: randomUUID(),
      orgId: ctx.org.orgId,
      conversationId: input.conversationId,
      sender: 'auto',
      body,
      sentAt: now,
    });
    await ctx.db
      .update(schema.conversations)
      .set({ lastMessageAt: now })
      .where(eq(schema.conversations.id, input.conversationId));
    return { ok: true as const, body };
  }),

  escalate: escalateProc.input(conversationActionInput).mutation(async ({ ctx, input }) => {
    await assertOwnedConversation(ctx.db, ctx.org.orgId, input.conversationId);
    await ctx.db
      .update(schema.conversations)
      .set({ status: 'escalated' })
      .where(eq(schema.conversations.id, input.conversationId));
    return { ok: true as const };
  }),

  resolve: inboxProc.input(conversationActionInput).mutation(async ({ ctx, input }) => {
    await assertOwnedConversation(ctx.db, ctx.org.orgId, input.conversationId);
    await ctx.db
      .update(schema.conversations)
      .set({ status: 'open' })
      .where(eq(schema.conversations.id, input.conversationId));
    return { ok: true as const };
  }),

  /** Seed demo FB/IG conversations so testers see a populated inbox (no real Meta needed). */
  seedDemo: inboxProc.input(orgScopedInput).mutation(async ({ ctx }) => {
    const existing = await ctx.db
      .select({ id: schema.conversations.id })
      .from(schema.conversations)
      .where(eq(schema.conversations.orgId, ctx.org.orgId))
      .limit(1);
    if (existing.length) return { ok: true as const, seeded: 0 };

    const demo: Array<{ channel: 'facebook' | 'instagram'; name: string; messages: string[] }> = [
      { channel: 'facebook', name: 'রহিমা আক্তার', messages: ['আসসালামু আলাইকুম', 'এই শাড়িটার দাম কত?'] },
      { channel: 'instagram', name: 'করিম শেখ', messages: ['ডেলিভারি কি ঢাকার বাইরে হয়?'] },
      { channel: 'facebook', name: 'সুমাইয়া ইসলাম', messages: ['অর্ডার কনফার্ম করতে চাই'] },
    ];

    let order = 0;
    for (const d of demo) {
      const convId = randomUUID();
      const last = new Date(Date.now() - order * 3_600_000);
      await ctx.db.insert(schema.conversations).values({
        id: convId,
        orgId: ctx.org.orgId,
        channel: d.channel,
        customerName: d.name,
        status: 'open',
        lastMessageAt: last,
      });
      let i = 0;
      for (const body of d.messages) {
        await ctx.db.insert(schema.messages).values({
          id: randomUUID(),
          orgId: ctx.org.orgId,
          conversationId: convId,
          sender: 'customer',
          body,
          sentAt: new Date(last.getTime() - (d.messages.length - i) * 60_000),
        });
        i++;
      }
      order++;
    }
    return { ok: true as const, seeded: demo.length };
  }),
});

async function assertOwnedConversation(
  db: Db,
  orgId: string,
  conversationId: string,
): Promise<void> {
  const conv = await db.query.conversations.findFirst({
    where: and(
      eq(schema.conversations.id, conversationId),
      eq(schema.conversations.orgId, orgId),
    ),
  });
  if (!conv) throw new TRPCError({ code: 'NOT_FOUND' });
}
