import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { MIGRATIONS } from './migrations';

export type DB = Database.Database;

export interface DbContext {
  db: DB;
  deviceId: string;
  dataDir: string;
  dbPath: string;
}

/**
 * Opens (or creates) the Keystone database, applies pending migrations,
 * and guarantees device identity metadata.
 *
 * Safety posture: WAL mode + integrity check on open + timestamped backup
 * before any migration beyond version 0.
 */
export function openDatabase(dataDir: string): DbContext {
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'keystone.db');
  const existed = fs.existsSync(dbPath);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  if (existed) {
    const check = db.pragma('quick_check', { simple: true });
    if (check !== 'ok') {
      // Preserve the damaged file for recovery and fail loudly — never run on a corrupt db.
      const quarantine = dbPath + '.corrupt-' + Date.now();
      db.close();
      fs.copyFileSync(dbPath, quarantine);
      throw new Error(
        `Database failed integrity check (${check}). Damaged copy preserved at ${quarantine}. ` +
          'Restore from a backup in the backups/ folder.',
      );
    }
  }

  applyMigrations(db, dataDir, dbPath, existed);

  const deviceId = ensureMeta(db, 'device_id', () => crypto.randomUUID());
  ensureMeta(db, 'project_id', () => crypto.randomUUID());

  return { db, deviceId, dataDir, dbPath };
}

function applyMigrations(db: DB, dataDir: string, dbPath: string, existed: boolean): void {
  const hasMeta = db
    .prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name='meta'")
    .get() as { c: number };
  let version = 0;
  if (hasMeta.c > 0) {
    const row = db.prepare("SELECT value FROM meta WHERE key='schema_version'").get() as
      | { value: string }
      | undefined;
    version = row ? Number(row.value) : 0;
  }

  const pending = MIGRATIONS.filter((m) => m.version > version);
  if (pending.length === 0) return;

  if (existed && version > 0) {
    const backupDir = path.join(dataDir, 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(dbPath, path.join(backupDir, `pre-migration-v${version}-${stamp}.db`));
  }

  const run = db.transaction(() => {
    for (const m of pending) {
      db.exec(m.sql);
      db.prepare(
        "INSERT INTO meta(key,value) VALUES('schema_version',?) " +
          "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      ).run(String(m.version));
    }
  });
  run();
}

function ensureMeta(db: DB, key: string, make: () => string): string {
  const row = db.prepare('SELECT value FROM meta WHERE key=?').get(key) as
    | { value: string }
    | undefined;
  if (row) return row.value;
  const value = make();
  db.prepare('INSERT INTO meta(key,value) VALUES(?,?)').run(key, value);
  return value;
}

export function getMeta(db: DB, key: string): string | null {
  const row = db.prepare('SELECT value FROM meta WHERE key=?').get(key) as
    | { value: string }
    | undefined;
  return row ? row.value : null;
}

export function setMeta(db: DB, key: string, value: string): void {
  db.prepare(
    'INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
  ).run(key, value);
}

/** Manual backup: consistent snapshot via SQLite backup API. Returns backup path. */
export async function backupDatabase(ctx: DbContext): Promise<string> {
  const backupDir = path.join(ctx.dataDir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(backupDir, `keystone-${stamp}.db`);
  await ctx.db.backup(dest);
  return dest;
}
