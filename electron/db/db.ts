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
 * Opens (or creates) the Tether database, applies pending migrations,
 * and guarantees device identity metadata.
 *
 * Safety posture: WAL mode + integrity check on open + timestamped backup
 * before any migration beyond version 0.
 */
export function openDatabase(dataDir: string): DbContext {
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'tether.db');
  applyPendingRestore(dataDir, dbPath); // swap in a staged restore before opening anything
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

export interface BackupOptions {
  retention?: number; // keep newest N tether-*.db per location (default 20)
  offMachineDir?: string | null; // e.g. <syncFolder>/backups — disaster copy
}

/**
 * Consistent snapshot via the SQLite backup API (safe while the app runs).
 * Integrity-gated: refuses to snapshot a db that fails quick_check, so a good
 * backup is never overwritten by a corrupt one. Prunes to `retention` per
 * location and, if given, copies off-machine into the synced folder.
 */
export async function backupDatabase(ctx: DbContext, opts: BackupOptions = {}): Promise<string> {
  const check = ctx.db.pragma('quick_check', { simple: true });
  if (check !== 'ok') throw new Error(`Refusing to back up: integrity check failed (${check}).`);

  const keep = opts.retention ?? 20;
  const backupDir = path.join(ctx.dataDir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(backupDir, `tether-${stamp}.db`);
  await ctx.db.backup(dest);
  pruneBackups(backupDir, keep);

  if (opts.offMachineDir) {
    try {
      fs.mkdirSync(opts.offMachineDir, { recursive: true });
      fs.copyFileSync(dest, path.join(opts.offMachineDir, `tether-${stamp}.db`));
      pruneBackups(opts.offMachineDir, keep);
    } catch (err) {
      console.error('[tether] off-machine backup copy failed:', err);
    }
  }
  return dest;
}

/** Keep only the newest `keep` tether-*.db files in a directory. */
function pruneBackups(dir: string, keep: number): void {
  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((f) => /^tether-.*\.db$/.test(f));
  } catch {
    return;
  }
  if (files.length <= keep) return;
  const byNewest = files
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const { f } of byNewest.slice(keep)) {
    try {
      fs.rmSync(path.join(dir, f), { force: true });
    } catch {
      /* best-effort */
    }
  }
}

export interface BackupInfo {
  name: string;
  size: number;
  mtime: string;
}

/** List local snapshots, newest first. */
export function listBackups(ctx: DbContext): BackupInfo[] {
  const dir = path.join(ctx.dataDir, 'backups');
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.db'))
      .map((f) => {
        const st = fs.statSync(path.join(dir, f));
        return { name: f, size: st.size, mtime: new Date(st.mtimeMs).toISOString() };
      })
      .sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
  } catch {
    return [];
  }
}

/**
 * Validate a backup and stage it for restore on next launch. We never swap the
 * live db mid-session; the swap happens in applyPendingRestore() before open.
 */
export function stageRestore(ctx: DbContext, backupName: string): { restartRequired: true } {
  if (!/^[\w.\-]+\.db$/.test(backupName)) throw new Error('Invalid backup name');
  const src = path.join(ctx.dataDir, 'backups', backupName);
  if (!fs.existsSync(src)) throw new Error('Backup not found');
  const probe = new Database(src, { readonly: true });
  try {
    const ok = probe.pragma('quick_check', { simple: true });
    if (ok !== 'ok') throw new Error(`Backup failed integrity check (${ok})`);
  } finally {
    probe.close();
  }
  fs.copyFileSync(src, path.join(ctx.dataDir, 'restore-pending.db'));
  return { restartRequired: true };
}

/** If a restore was staged, quarantine the current db and swap the backup in. */
function applyPendingRestore(dataDir: string, dbPath: string): void {
  const pending = path.join(dataDir, 'restore-pending.db');
  if (!fs.existsSync(pending)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, `${dbPath}.pre-restore-${stamp}`);
    for (const suffix of ['-wal', '-shm']) {
      const f = dbPath + suffix;
      if (fs.existsSync(f)) fs.rmSync(f, { force: true });
    }
  }
  fs.renameSync(pending, dbPath);
  console.log('[tether] applied staged restore from backup');
}
