// Folder-based updater. Tether makes NO network calls: it only reads the shared
// release folder that OneDrive/SharePoint already syncs to disk. On finding a
// newer version it verifies the installer's SHA256 against the SHA256.txt shipped
// beside it (fail-closed), then notifies the renderer, which shows the in-app
// update banner. Installing is a separate step so the UI (not a native dialog)
// drives the prompt.
//
// This is the "internal release share" path anticipated in docs/RELEASING.md — it
// preserves the "zero network calls of its own" guarantee in docs/SECURITY.md.

import { app, shell, type BrowserWindow } from 'electron';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const VERSION_RE = /^\d+\.\d+\.\d+$/;

export interface UpdateCandidate {
  version: string;
  exePath: string;
  shaPath: string;
}

function parseVersion(v: string): number[] {
  return v.split('.').map((n) => parseInt(n, 10));
}

/** Returns >0 if a is newer than b, <0 if older, 0 if equal. */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * Scan <syncFolder>/releases for the highest x.y.z version newer than
 * currentVersion whose installer file is actually present. Pure filesystem.
 */
export function findUpdate(syncFolder: string, currentVersion: string): UpdateCandidate | null {
  const releasesDir = path.join(syncFolder, 'releases');
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(releasesDir, { withFileTypes: true });
  } catch {
    return null; // no releases folder yet
  }

  const newer = entries
    .filter((e) => e.isDirectory() && VERSION_RE.test(e.name))
    .map((e) => e.name)
    .filter((v) => compareVersions(v, currentVersion) > 0)
    .sort((a, b) => compareVersions(b, a)); // highest first

  for (const version of newer) {
    const exePath = path.join(releasesDir, version, `Tether Setup ${version}.exe`);
    const shaPath = path.join(releasesDir, version, 'SHA256.txt');
    if (fs.existsSync(exePath)) {
      return { version, exePath, shaPath };
    }
  }
  return null;
}

function sha256OfFile(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(file);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex').toLowerCase()));
  });
}

/** Read the expected hash (first hex token) from a SHA256.txt file. */
function readExpectedHash(shaPath: string): string | null {
  try {
    const text = fs.readFileSync(shaPath, 'utf8').trim();
    const token = text.split(/\s+/)[0];
    return /^[0-9a-fA-F]{64}$/.test(token) ? token.toLowerCase() : null;
  } catch {
    return null;
  }
}

export interface VerifyResult {
  ok: boolean;
  reason?: string;
}

/** Fail-closed checksum verification: no SHA file or mismatch => not ok. */
export async function verifyInstaller(candidate: UpdateCandidate): Promise<VerifyResult> {
  const expected = readExpectedHash(candidate.shaPath);
  if (!expected) return { ok: false, reason: 'No SHA256.txt checksum found next to the installer.' };
  let actual: string;
  try {
    actual = await sha256OfFile(candidate.exePath);
  } catch (err) {
    return { ok: false, reason: 'Could not read the installer file: ' + (err instanceof Error ? err.message : String(err)) };
  }
  if (actual !== expected) {
    return { ok: false, reason: `Checksum did not match (expected ${expected.slice(0, 12)}…, got ${actual.slice(0, 12)}…).` };
  }
  return { ok: true };
}

export type CheckResult =
  | { status: 'no-folder' }
  | { status: 'up-to-date'; current: string }
  | { status: 'update-available'; version: string }
  | { status: 'error'; message: string };

// The verified installer waiting to be applied. Kept in main so the renderer
// never handles file paths — it only asks to install what main already verified.
let pending: UpdateCandidate | null = null;

/**
 * Check the shared release folder. If a verified newer version exists, stash it and
 * emit `update:available` to the renderer (which shows the in-app banner). Returns a
 * plain result for callers such as the manual "Check for updates" button. Never throws.
 */
export async function checkForUpdates(
  win: BrowserWindow | null,
  syncFolder: string | null,
  currentVersion: string,
): Promise<CheckResult> {
  try {
    if (!syncFolder) return { status: 'no-folder' };

    const candidate = findUpdate(syncFolder, currentVersion);
    if (!candidate) return { status: 'up-to-date', current: currentVersion };

    const verified = await verifyInstaller(candidate);
    if (!verified.ok) return { status: 'error', message: verified.reason ?? 'verification failed' };

    pending = candidate;
    win?.webContents.send('update:available', { version: candidate.version, current: currentVersion });
    return { status: 'update-available', version: candidate.version };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[updater]', message);
    return { status: 'error', message };
  }
}

/** Apply the pending update: re-verify (fail-closed), launch the installer, quit. */
export async function installPendingUpdate(): Promise<{ ok: boolean; message?: string }> {
  if (!pending) return { ok: false, message: 'No update is ready to install.' };
  const verified = await verifyInstaller(pending);
  if (!verified.ok) return { ok: false, message: verified.reason ?? 'verification failed' };
  const err = await shell.openPath(pending.exePath);
  if (err) return { ok: false, message: err };
  // Quit so the installer can replace files; openPath launched it detached.
  setImmediate(() => app.quit());
  return { ok: true };
}
