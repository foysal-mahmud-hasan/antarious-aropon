import { createApiClient } from '@aropon/api';
import { useAuth } from './auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

/** Typed tRPC client. Reads token/org from the auth store for each request's headers. */
export const api = createApiClient({
  url: API_URL,
  getAuth: () => {
    const { token, orgId } = useAuth.getState();
    return { token, orgId };
  },
});
