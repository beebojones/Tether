// Builds the app and packages the Windows installer.
//
// Root cause of intermittent `EPERM ... rename ... unpacked` failures: this
// machine's EDR (SentinelOne, alongside Windows Defender) locks newly-written
// executables specifically inside C:\Workspace long enough to break
// electron-builder's rename-into-place step. Confirmed by building to a temp
// folder outside C:\Workspace, which succeeded immediately with no lock at all.
// Fix: package into a temp folder outside the monitored path, then copy just the
// finished installer (not the ~500MB unpacked app folders) into release/, where
// scripts/release.mjs and docs/RELEASING.md expect to find it. A short retry
// loop stays as a safety net in case the temp location is ever also monitored.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const releaseDir = path.resolve('release');
const buildDir = path.join(os.tmpdir(), `tether-dist-${pkg.version}`);

function sleep(ms) {
  const buf = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(buf), 0, 0, ms);
}

console.log('> building renderer + main');
execSync('npm run build', { stdio: 'inherit' });

fs.rmSync(buildDir, { recursive: true, force: true });

console.log(`> packaging outside C:\\Workspace (${buildDir}) to avoid the EDR file-lock on this path`);
let lastError;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    if (attempt > 1) {
      console.log(`\n[dist] retrying (attempt ${attempt}/${MAX_ATTEMPTS})…`);
      fs.rmSync(buildDir, { recursive: true, force: true });
      sleep(RETRY_DELAY_MS * attempt);
    }
    execSync(`electron-builder --win --config.directories.output="${buildDir}"`, { stdio: 'inherit' });
    lastError = null;
    break;
  } catch (err) {
    lastError = err;
    console.warn(`[dist] attempt ${attempt}/${MAX_ATTEMPTS} failed (see error above).`);
  }
}

if (lastError) {
  console.error(`\n[dist] gave up after ${MAX_ATTEMPTS} attempts.`);
  console.error(`[dist] partial output (if any) is in ${buildDir} for inspection.`);
  process.exit(1);
}

// Copy just the installer artifacts (not the large win-unpacked/win-arm64-unpacked
// app folders) into the project's release/ folder, where release.mjs and
// RELEASING.md expect "Tether Setup <version>.exe".
fs.mkdirSync(releaseDir, { recursive: true });
const copied = [];
for (const name of fs.readdirSync(buildDir, { withFileTypes: true })) {
  if (name.isFile() && /\.(exe|blockmap|yml)$/i.test(name.name)) {
    fs.copyFileSync(path.join(buildDir, name.name), path.join(releaseDir, name.name));
    copied.push(name.name);
  }
}
console.log(`> copied to release/: ${copied.join(', ')}`);
fs.rmSync(buildDir, { recursive: true, force: true });

console.log('> rebuilding native module for local dev (arch may differ from the installer target)');
execSync('electron-rebuild -f -w better-sqlite3', { stdio: 'inherit' });
