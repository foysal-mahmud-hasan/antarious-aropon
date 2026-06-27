import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './tenants';
import { channelEnum } from './commerce';

export const convStatusEnum = pgEnum('conversation_status', ['open', 'escalated', 'closed']);
export const senderEnum = pgEnum('message_sender', ['customer', 'shop', 'auto']);

// T1 unified inbox: FB/IG conversations + their messages.
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    channel: channelEnum('channel').notNull(),
    externalId: text('external_id'), // platform thread id
    customerName: text('customer_name'),
    status: convStatusEnum('status').notNull().default('open'),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ byOrgTime: index('conversations_org_time_idx').on(t.orgId, t.lastMessageAt) }),
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    sender: senderEnum('sender').notNull(),
    body: text('body').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ byConversation: index('messages_conversation_idx').on(t.conversationId) }),
);
