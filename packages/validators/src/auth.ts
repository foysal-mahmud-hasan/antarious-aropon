import { z } from 'zod';
import { bdPhoneSchema } from './common';

export const requestOtpInput = z.object({
  phone: bdPhoneSchema,
});
export type RequestOtpInput = z.infer<typeof requestOtpInput>;

export const verifyOtpInput = z.object({
  phone: bdPhoneSchema,
  token: z.string().length(6, 'OTP is 6 digits'),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpInput>;
