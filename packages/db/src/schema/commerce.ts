import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { organizations } from './tenants';

export const channelEnum = pgEnum('channel', ['facebook', 'instagram', 'website', 'manual']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'delivered',
  'cancelled',
]);
export const paymentStatusEnum = pgEnum('payment_status', ['due', 'paid']);

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone'),
    address: text('address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ byOrg: index('customers_org_idx').on(t.orgId) }),
);

// Catalog (limits.products). Full inventory is T2; this is the minimal product row.
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    pricePoisha: bigint('price_poisha', { mode: 'number' }).notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ byOrg: index('products_org_idx').on(t.orgId) }),
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    customerName: text('customer_name').notNull().default(''),
    customerPhone: text('customer_phone'),
    channel: channelEnum('channel').notNull().default('manual'),
    status: orderStatusEnum('status').notNull().default('pending'),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('due'),
    totalPoisha: bigint('total_poisha', { mode: 'number' }).notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ byOrgStatus: index('orders_org_status_idx').on(t.orgId, t.status) }),
);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPricePoisha: bigint('unit_price_poisha', { mode: 'number' }).notNull(),
});
