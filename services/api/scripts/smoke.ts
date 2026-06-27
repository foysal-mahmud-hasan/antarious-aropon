/**
 * End-to-end smoke test against the real Postgres: OTP → JWT → org bootstrap → entitlements →
 * insert a transaction → read the finance summary. Run: `tsx scripts/smoke.ts` with DATABASE_URL set.
 */
import { randomUUID } from 'node:crypto';
import { parseServerEnv } from '@aropon/config';
import { appRouter } from '../src/router';
import { createDb } from '../src/db';
import {
  firstOrgIdFor,
  getUserFromAuthHeader,
  loadOrgContext,
  type Context,
} from '../src/context';

const env = parseServerEnv(process.env);
const db = createDb(env.DATABASE_URL);

async function ctxFor(authorization?: string): Promise<Context> {
  const user = await getUserFromAuthHeader(env.AUTH_JWT_SECRET, authorization);
  let org = null;
  if (user) {
    const orgId = await firstOrgIdFor(db, user.id);
    if (orgId) org = await loadOrgContext(db, user.id, orgId);
  }
  return { db, authSecret: env.AUTH_JWT_SECRET, user, org };
}

async function main() {
  const phone = '+8801711111111';

  const pub = appRouter.createCaller(await ctxFor());
  const otp = await pub.auth.requestOtp({ phone });
  console.log('1. requestOtp →', otp);
  if (!('devCode' in otp) || !otp.devCode) throw new Error('no devCode in dev');

  const session = await pub.auth.verifyOtp({ phone, token: otp.devCode });
  console.log('2. verifyOtp → token len', session.token.length, 'orgs', session.orgs);

  const authed = appRouter.createCaller(await ctxFor(`Bearer ${session.token}`));
  const cur = await authed.org.current();
  console.log('3. org.current →', cur.tier, cur.role, 'bookkeeping?', cur.entitlements['finance.bookkeeping']);

  const tx = await authed.finance.addTransaction({
    id: randomUUID(),
    orgId: cur.orgId,
    type: 'income',
    amountPoisha: 50000,
    category: 'বিক্রয়',
    occurredAt: new Date().toISOString(),
  });
  console.log('4. addTransaction →', tx);

  const summary = await authed.finance.summary({
    orgId: cur.orgId,
    from: new Date(Date.now() - 86_400_000).toISOString(),
    to: new Date(Date.now() + 86_400_000).toISOString(),
  });
  console.log('5. finance.summary →', summary);

  console.log('\n✅ smoke passed');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ smoke failed:', e);
  process.exit(1);
});
