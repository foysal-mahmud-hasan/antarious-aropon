import { parseServerEnv } from '@aropon/config';
import { createDb } from '../src/db';
import { runSeed } from '../src/seed';

const env = parseServerEnv(process.env);
const db = createDb(env.DATABASE_URL);

runSeed(db)
  .then((r) => {
    console.log('✅ seed done:', r);
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ seed failed:', e);
    process.exit(1);
  });
