import * as SQLite from 'expo-sqlite';

/**
 * Local-first SQLite handle (the offline source of truth). M0 establishes the handle so the
 * offline path exists; M1 attaches Drizzle (drizzle-orm/expo-sqlite, schema from
 * `@aropon/db/local`) and the PowerSync connector for bidirectional sync to Supabase Postgres.
 */
let db: SQLite.SQLiteDatabase | null = null;

export function openLocalDb(): SQLite.SQLiteDatabase {
  if (!db) db = SQLite.openDatabaseSync('aropon.db');
  return db;
}

// TODO(M1): drizzle(openLocalDb(), { schema: localSchema }) + PowerSync.connect(...)
