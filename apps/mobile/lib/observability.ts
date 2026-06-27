/**
 * Observability init (Sentry + PostHog). M0 wires the integration points and env-gating; the
 * real SDKs (`@sentry/react-native`, `posthog-react-native`) are added in the implementation
 * step. Until a DSN/key is provided these are safe no-ops, so the app runs without them.
 */
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;

export function initObservability(): void {
  if (SENTRY_DSN) {
    // TODO(impl): Sentry.init({ dsn: SENTRY_DSN, tracesSampleRate: 0.2 })
  }
  if (POSTHOG_KEY) {
    // TODO(impl): posthog.setup(POSTHOG_KEY, { host: 'https://eu.i.posthog.com' })
  }
}

export function captureError(error: unknown): void {
  if (SENTRY_DSN) {
    // TODO(impl): Sentry.captureException(error)
  } else {
    // eslint-disable-next-line no-console
    console.error('[aropon]', error);
  }
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (POSTHOG_KEY) {
    // TODO(impl): posthog.capture(event, props)
  }
}
