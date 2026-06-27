import { z } from 'zod';
import { roleSchema, uuidSchema } from './common';

export const createOrgInput = z.object({
  name: z.string().min(2).max(80),
});
export type CreateOrgInput = z.infer<typeof createOrgInput>;

export const inviteMemberInput = z.object({
  orgId: uuidSchema,
  phone: z.string().min(1),
  role: roleSchema.exclude(['owner']),
});
export type InviteMemberInput = z.infer<typeof inviteMemberInput>;

export const switchOrgInput = z.object({
  orgId: uuidSchema,
});
export type SwitchOrgInput = z.infer<typeof switchOrgInput>;
