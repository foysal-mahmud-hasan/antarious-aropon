import { z } from 'zod';
import { tierSchema, uuidSchema } from './common';

export const setTierInput = z.object({ orgId: uuidSchema, tier: tierSchema });
export type SetTierInput = z.infer<typeof setTierInput>;
