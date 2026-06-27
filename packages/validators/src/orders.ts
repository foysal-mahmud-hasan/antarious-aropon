import { z } from 'zod';
import { poishaSchema, uuidSchema } from './common';

export const orderChannelSchema = z.enum(['facebook', 'instagram', 'website', 'manual']);
export const orderStatusSchema = z.enum(['pending', 'confirmed', 'delivered', 'cancelled']);
export const paymentStatusSchema = z.enum(['due', 'paid']);

export const orderItemInput = z.object({
  productName: z.string().min(1).max(80),
  quantity: z.number().int().min(1),
  unitPricePoisha: poishaSchema.refine((n) => n > 0, 'দাম দিন'),
});
export type OrderItemInput = z.infer<typeof orderItemInput>;

export const createOrderInput = z.object({
  orgId: uuidSchema,
  customerName: z.string().min(1).max(80),
  customerPhone: z.string().max(20).optional(),
  channel: orderChannelSchema.default('manual'),
  items: z.array(orderItemInput).min(1),
});
export type CreateOrderInput = z.infer<typeof createOrderInput>;

export const orderActionInput = z.object({ orgId: uuidSchema, orderId: uuidSchema });
export const setOrderStatusInput = orderActionInput.extend({ status: orderStatusSchema });
export const setPaymentStatusInput = orderActionInput.extend({ paymentStatus: paymentStatusSchema });
