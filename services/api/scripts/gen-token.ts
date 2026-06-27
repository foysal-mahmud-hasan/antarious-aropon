import { eq } from 'drizzle-orm';
import { schema } from '@aropon/db';
import { parseServerEnv } from '@aropon/config';
import { createDb } from '../src/db';
import { signSession } from '../src/auth';

const env = parseServerEnv(process.env);
const db = createDb(env.DATABASE_URL);
const phone = process.argv[2] ?? '+8801711111111';
const user = await db.query.users.findFirst({ where: eq(schema.users.phone, phone) });
if (!user) { console.error('no user for', phone); process.exit(1); }
const m = await db.query.memberships.findFirst({ where: eq(schema.memberships.userId, user.id) });
const token = await signSession(env.AUTH_JWT_SECRET, { sub: user.id, phone: user.phone });
console.log(JSON.stringify({ userId: user.id, orgId: m?.orgId, token }));
process.exit(0);
