import { z } from 'zod';
import { uuidSchema } from './common';

export const conversationStatusFilter = z.enum(['all', 'open', 'escalated', 'closed']);
export type ConversationStatusFilter = z.infer<typeof conversationStatusFilter>;

export const listConversationsInput = z.object({
  orgId: uuidSchema,
  status: conversationStatusFilter.default('all'),
});

export const conversationActionInput = z.object({
  orgId: uuidSchema,
  conversationId: uuidSchema,
});

export const sendReplyInput = conversationActionInput.extend({
  body: z.string().min(1).max(1000),
});
export type SendReplyInput = z.infer<typeof sendReplyInput>;
