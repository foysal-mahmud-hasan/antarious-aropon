import type { ReactNode } from 'react';

export interface TierGateProps {
  /**
   * Whether the active org is entitled to this feature. The APP computes this from
   * `org.current` entitlements (server-authoritative) and passes it in — `@aropon/ui`
   * stays presentation-only and never imports the entitlements engine (import boundary).
   */
  allowed: boolean;
  children: ReactNode;
  /** Rendered when not entitled (e.g. an upgrade prompt). Nothing by default. */
  fallback?: ReactNode;
}

/** Client mirror of the server tier guard. Server enforcement is still authoritative. */
export function TierGate({ allowed, children, fallback = null }: TierGateProps) {
  return <>{allowed ? children : fallback}</>;
}
