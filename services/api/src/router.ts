import { router } from './trpc';
import { healthRouter } from './routers/health';
import { authRouter } from './routers/auth';
import { orgRouter } from './routers/org';
import { financeRouter } from './routers/finance';
import { ordersRouter } from './routers/orders';
import { billingRouter } from './routers/billing';

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  org: orgRouter,
  finance: financeRouter,
  orders: ordersRouter,
  billing: billingRouter,
});

/** The end-to-end type the client imports (type-only) for full tRPC inference. */
export type AppRouter = typeof appRouter;
