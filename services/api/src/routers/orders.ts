import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { schema } from '@aropon/db';
import {
  createOrderInput,
  orderActionInput,
  orgScopedInput,
  setOrderStatusInput,
  setPaymentStatusInput,
} from '@aropon/validators';
import { requireEntitlement, router } from '../trpc';

/** Orders + the order-confirmation system are gated on `orders.confirmation` (T1). */
const orderProc = requireEntitlement('orders.confirmation');

export const ordersRouter = router({
  create: orderProc.input(createOrderInput).mutation(async ({ ctx, input }) => {
    const totalPoisha = input.items.reduce((acc, i) => acc + i.quantity * i.unitPricePoisha, 0);
    const id = randomUUID();
    await ctx.db.insert(schema.orders).values({
      id,
      orgId: ctx.org.orgId,
      customerName: input.customerName,
      customerPhone: input.customerPhone ?? null,
      channel: input.channel,
      status: 'pending',
      paymentStatus: 'due',
      totalPoisha,
    });
    await ctx.db.insert(schema.orderItems).values(
      input.items.map((i) => ({
        id: randomUUID(),
        orderId: id,
        productName: i.productName,
        quantity: i.quantity,
        unitPricePoisha: i.unitPricePoisha,
      })),
    );
    return { ok: true as const, id, totalPoisha };
  }),

  list: orderProc.input(orgScopedInput).query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.orgId, ctx.org.orgId))
      .orderBy(desc(schema.orders.createdAt))
      .limit(100);
    return rows.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      channel: o.channel,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalPoisha: o.totalPoisha,
      createdAt: o.createdAt.toISOString(),
    }));
  }),

  get: orderProc.input(orderActionInput).query(async ({ ctx, input }) => {
    const order = await ctx.db.query.orders.findFirst({
      where: and(eq(schema.orders.id, input.orderId), eq(schema.orders.orgId, ctx.org.orgId)),
    });
    if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
    const items = await ctx.db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, input.orderId));
    return { ...order, createdAt: order.createdAt.toISOString(), items };
  }),

  /** Confirmation system: move an order through pending → confirmed → delivered / cancelled. */
  setStatus: orderProc.input(setOrderStatusInput).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(schema.orders)
      .set({ status: input.status })
      .where(and(eq(schema.orders.id, input.orderId), eq(schema.orders.orgId, ctx.org.orgId)));
    return { ok: true as const };
  }),

  setPayment: orderProc.input(setPaymentStatusInput).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(schema.orders)
      .set({ paymentStatus: input.paymentStatus })
      .where(and(eq(schema.orders.id, input.orderId), eq(schema.orders.orgId, ctx.org.orgId)));
    return { ok: true as const };
  }),
});
