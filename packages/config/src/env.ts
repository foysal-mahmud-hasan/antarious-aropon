import { z } from 'zod';

/**
 * Environment schemas. Client vars MUST be prefixed `EXPO_PUBLIC_` (Expo) and never contain
 * secrets — they are bundled into the app. Server vars (services/api) hold all secrets.
 * Validated at boot so a missing/invalid var fails fast rather than at first use.
 */

export const clientEnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  EXPO_PUBLIC_POWERSYNC_URL: z.string().url(),
  EXPO_PUBLIC_POSTHOG_KEY: z.string().optional(),
  EXPO_PUBLIC_SENTRY_DSN: z.string().optional(),
});
export type ClientEnv = z.infer<typeof clientEnvSchema>;

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  POWERSYNC_URL: z.string().url().optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SSLCOMMERZ_STORE_ID: z.string().optional(),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional(),
});
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function format(error: z.ZodError): string {
  return error.issues.map((i) => ` - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
}

export function parseServerEnv(raw: Record<string, string | undefined>): ServerEnv {
  const parsed = serverEnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid server environment:\n${format(parsed.error)}`);
  }
  return parsed.data;
}

export function parseClientEnv(raw: Record<string, string | undefined>): ClientEnv {
  const parsed = clientEnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid client environment:\n${format(parsed.error)}`);
  }
  return parsed.data;
}
