import { requestOtpInput, verifyOtpInput } from '@aropon/validators';
import { publicProcedure, router } from '../trpc';

/**
 * Phone-OTP via Supabase Auth. The actual OTP send/verify is delegated to Supabase
 * (supabase.auth.signInWithOtp / verifyOtp) in the implementation step; these procedures
 * fix the typed contract the client codes against.
 */
export const authRouter = router({
  requestOtp: publicProcedure.input(requestOtpInput).mutation(async ({ input }) => {
    // TODO(M0): supabase.auth.signInWithOtp({ phone: input.phone })
    return { sent: true as const, phone: input.phone };
  }),
  verifyOtp: publicProcedure.input(verifyOtpInput).mutation(async ({ input }) => {
    // TODO(M0): supabase.auth.verifyOtp({ phone, token, type: 'sms' }) → session
    return { verified: true as const, phone: input.phone };
  }),
});
