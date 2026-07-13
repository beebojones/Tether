// Folder-based updater. Tether makes NO network calls: it only reads the shared
// release folder that OneDrive/SharePoint already syncs to disk. On finding a
// newer version it verifies the installer's SHA256 against the SHA256.txt shipped
// beside it (fail-closed), prompts, then launches the installer and quits.
//
// This is the "internal release share" path anticipated in docs/RELEASING.md — it
// preserves the "zero network calls of its own" guarantee in docs/SECURITY.md.

import { app, dialog, shell, type BrowserWindow } from 'electron';
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
  | { status: 'installing'; version: string }
  | { status: 'error'; message: string };

/**
 * Check the shared release folder and, if a verified newer version exists, prompt
 * to install. interactive=true also reports "up to date" and errors to the user
 * (used by the manual "Check for updates" button); false stays silent unless an
 * update is found (used on startup). Never throws.
 */
export async function checkForUpdates(
  win: BrowserWindow | null,
  syncFolder: string | null,
  currentVersion: string,
  opts: { interactive: boolean },
): Promise<CheckResult> {
  try {
    if (!syncFolder) {
      if (opts.interactive) {
        void dialog.showMessageBox(win ?? undefined!, {
          type: 'info',
          message: 'No shared folder configured',
          detail: 'Set a shared project folder in Settings to receive updates.',
          buttons: ['OK'],
        });
      }
      return { status: 'no-folder' };
    }

    const candidate = findUpdate(syncFolder, currentVersion);
    if (!candidate) {
      if (opts.interactive) {
        void dialog.showMessageBox(win ?? undefined!, {
          type: 'info',
          message: "You're up to date",
          detail: `Tether ${currentVersion} is the latest version in the shared folder.`,
          buttons: ['OK'],
        });
      }
      return { status: 'up-to-date', current: currentVersion };
    }

    const verified = await verifyInstaller(candidate);
    if (!verified.ok) {
      void dialog.showMessageBox(win ?? undefined!, {
        type: 'warning',
        message: `Update ${candidate.version} found, but it could not be verified`,
        detail: `${verified.reason}\n\nFor safety, Tether will not install an unverified file. Ask John for a fresh copy.`,
        buttons: ['OK'],
      });
      return { status: 'error', message: verified.reason ?? 'verification failed' };
    }

    const { response } = await dialog.showMessageBox(win ?? undefined!, {
      type: 'question',
      message: `Tether ${candidate.version} is available`,
      detail: `You're on ${currentVersion}. Tether will close and the installer will open — your data and settings are preserved, and a backup is taken automatically before any changes.`,
      buttons: ['Install now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });
    if (response !== 0) {
      return { status: 'update-available', version: candidate.version };
    }

    const err = await shell.openPath(candidate.exePath);
    if (err) {
      void dialog.showMessageBox(win ?? undefined!, {
        type: 'error',
        message: 'Could not launch the installer',
        detail: err,
        buttons: ['OK'],
      });
      return { status: 'error', message: err };
    }
    // Quit so the installer can replace files without lock conflicts. openPath
    // launches the installer detached, so it survives our exit.
    setImmediate(() => app.quit());
    return { status: 'installing', version: candidate.version };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[updater]', message);
    if (opts.interactive) {
      void dialog.showMessageBox(win ?? undefined!, {
        type: 'error',
        message: 'Update check failed',
        detail: message,
        buttons: ['OK'],
      });
    }
    return { status: 'error', message };
  }
}
