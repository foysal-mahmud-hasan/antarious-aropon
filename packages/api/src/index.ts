import { createTRPCClient, httpBatchLink, type CreateTRPCClientOptions } from '@trpc/client';
import superjson from 'superjson';
// Type-only import of the server router — erased at build, so NO server code reaches the bundle.
import type { AppRouter } from '@aropon/api-server';

export type { AppRouter } from '@aropon/api-server';

export interface CreateClientOptions {
  url: string;
  /** Returns the Supabase access token + active org id for auth headers. */
  getAuth: () => { token?: string; orgId?: string } | Promise<{ token?: string; orgId?: string }>;
}

/** Factory for the typed tRPC client used by the Expo app (wired to TanStack Query in the app). */
export function createApiClient(opts: CreateClientOptions) {
  const config: CreateTRPCClientOptions<AppRouter> = {
    links: [
      httpBatchLink({
        url: `${opts.url}/trpc`,
        transformer: superjson,
        async headers() {
          const { token, orgId } = await opts.getAuth();
          const headers: Record<string, string> = {};
          if (token) headers['authorization'] = `Bearer ${token}`;
          if (orgId) headers['x-org-id'] = orgId;
          return headers;
        },
      }),
    ],
  };
  return createTRPCClient<AppRouter>(config);
}

export type ApiClient = ReturnType<typeof createApiClient>;
