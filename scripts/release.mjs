// One-command release. Usage:
//   npm run release                 # auto-bump patch (0.1.1 -> 0.1.2), build, stage, push
//   npm run release -- minor        # bump minor (0.1.2 -> 0.2.0)
//   npm run release -- major        # bump major
//   npm run release -- -m "message" # commit pending changes with this message
//   npm run release -- --no-push    # skip git push
//   npm run release -- --stage-only # don't bump/build; just (re)stage the current version
//
// Stages into <syncFolder>/releases/<version>/ where syncFolder is read from the
// app's own settings.json — the same shared folder both machines auto-update from.
// No network calls in the app; this script just writes files into that folder.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const bumpType = args.find((a) => ['patch', 'minor', 'major'].includes(a)) ?? 'patch';
const noPush = args.includes('--no-push');
const stageOnly = args.includes('--stage-only');
const mIdx = args.findIndex((a) => a === '-m' || a === '--message');
const commitMessage = mIdx >= 0 ? args[mIdx + 1] : null;

// Make the corporate-TLS fix automatic for the build step.
if (!(process.env.NODE_OPTIONS ?? '').includes('--use-system-ca')) {
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ?? ''} --use-system-ca`.trim();
}

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  return execSync(cmd, { cwd: repoRoot, stdio: 'inherit', ...opts });
}
function capture(cmd) {
  return execSync(cmd, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}
function step(msg) { console.log(`\n=== ${msg} ===`); }
function die(msg) { console.error(`\nRelease aborted: ${msg}`); process.exit(1); }

function readSyncFolder() {
  const settingsPath = path.join(process.env.APPDATA ?? '', 'Tether', 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    die(`No settings found at ${settingsPath}. Open Tether once and configure the shared folder first.`);
  }
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  if (!settings.syncFolder) {
    die('Tether has no shared folder configured (Settings → Choose shared folder). Set one, then re-run.');
  }
  if (!fs.existsSync(settings.syncFolder)) {
    die(`Configured shared folder does not exist on disk: ${settings.syncFolder}`);
  }
  return settings.syncFolder;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// Which commits does this version contain? Once v<version> exists (a --stage-only re-run,
// or a release resumed after a failed build), `v<version>..HEAD` is EMPTY and the notes
// silently fall back to "Maintenance and improvements" — so anchor to the tag BEFORE it
// and end at the tag itself.
function notesRange(version) {
  const cur = `v${version}`;
  const tagged = (() => { try { return capture(`git tag -l ${cur}`) === cur; } catch { return false; } })();
  let base = '';
  // `~1` not `^`: these run through cmd.exe on Windows, where ^ is the escape character
  // and gets eaten before git sees it — `v0.2.0^` silently resolves to v0.2.0 itself,
  // collapsing the range to nothing.
  try { base = capture(`git describe --tags --abbrev=0 ${tagged ? `${cur}~1` : 'HEAD'}`); } catch { /* no tags yet */ }
  const end = tagged ? cur : 'HEAD';
  return base ? `${base}..${end}` : end;
}

function releaseNotes(version) {
  let changes = '';
  try {
    changes = capture(`git log ${notesRange(version)} --no-merges --pretty=format:%s`)
      .split('\n')
      // drop the version-bump commits: bare "0.2.0" and npm version's "Release 0.2.0"
      .filter((s) => s && !/^(Release )?\d+\.\d+\.\d+$/.test(s))
      .map((s) => `- ${s}`)
      .join('\n');
  } catch { /* first release or no tags */ }
  return `# Tether ${version} — Release Notes\n\n${changes || '- Maintenance and improvements.'}\n\n` +
    `## Install\n\nVerify against \`SHA256.txt\`, then run \`Tether Setup ${version}.exe\`. ` +
    `Installing over your existing copy preserves data and settings; a backup is taken automatically ` +
    `before any database changes.\n\nIf you are already on a version with auto-update, Tether will ` +
    `offer this update on next launch — no manual step needed.\n`;
}

function installGuide(version) {
  return `# Installing Tether ${version}\n\n` +
    `Close Tether if it is open, then double-click \`Tether Setup ${version}.exe\`.\n\n` +
    `Windows shows "Windows protected your PC" (the app is not code-signed) — click ` +
    `**More info** → **Run anyway**. Per-user install, no admin needed. Your data and ` +
    `settings are preserved.\n\n` +
    `## Opening it afterwards\n\nThe installer puts a **Tether** icon on your desktop and in ` +
    `the Start menu. To pin it to the top of Start: press the Windows key, type **Tether**, ` +
    `right-click the result, then choose **Pin to Start**. Windows only accepts that from your ` +
    `own click, so no installer can do it for you.\n\n` +
    `Optional integrity check (PowerShell in this folder):\n\n` +
    "```powershell\nGet-FileHash \"Tether Setup " + version + ".exe\" -Algorithm SHA256\n```\n\n" +
    `It should match \`SHA256.txt\`.\n`;
}

// Teammates keep opening the shared folder when they want to *run* Tether — the
// installers live there, so they run one and it reinstalls instead of launching.
// Put the answer where they are already looking, refreshed on every release.
function writeLaunchNote(folder, version) {
  const file = path.join(folder, 'HOW TO OPEN TETHER.txt');
  fs.writeFileSync(file, [
    'HOW TO OPEN TETHER',
    '==================',
    '',
    'Open Tether from the Tether icon on your desktop, or press the Windows key',
    'and start typing "Tether". That is the installed app.',
    '',
    'Do not open Tether from this folder. Nothing in here is the app.',
    '',
    'Pinning it to Start',
    '-------------------',
    'Press the Windows key, type "Tether", right-click the result, then choose',
    '"Pin to Start". Windows only accepts that from your own click, so the',
    'installer is not allowed to do it for you. Same for "Pin to taskbar".',
    '',
    'What this folder is',
    '-------------------',
    '  ops        The shared project history. Tether reads and writes it while',
    '             the app is running. Do not edit, move, or delete anything here.',
    '  releases   Installers only. Needed for the first install on a new computer,',
    '             and read automatically when Tether checks for updates.',
    '  backups    Automatic database backups.',
    '',
    'Updating',
    '--------',
    'Tether checks the releases folder each time it launches and offers the new',
    'version itself. Running an installer by hand is only for a first install.',
    '',
    'Latest version staged here: ' + version,
    ''
  ].join('\r\n'));
  return file;
}

// ---- preconditions ----
const branch = capture('git rev-parse --abbrev-ref HEAD');

if (!stageOnly) {
  // Commit any pending work so the version bump is clean and captured.
  const dirty = capture('git status --porcelain');
  if (dirty) {
    step('Committing pending changes');
    run('git add -A');
    const msg = commitMessage ?? 'Update Tether';
    run(`git commit -m ${JSON.stringify(msg)}`);
  }

  step(`Bumping version (${bumpType})`);
  run(`npm version ${bumpType} -m "Release %s"`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const version = pkg.version;

if (!stageOnly) {
  step(`Building installer for ${version}`);
  run('npm run dist');
}

const installer = path.join(repoRoot, 'release', `Tether Setup ${version}.exe`);
if (!fs.existsSync(installer)) {
  die(`Installer not found: ${installer}. ${stageOnly ? 'Run a full release (without --stage-only) first.' : 'Build may have failed.'}`);
}

// ---- stage into the shared folder ----
const syncFolder = readSyncFolder();
const destDir = path.join(syncFolder, 'releases', version);
step(`Staging ${version} into shared folder`);
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(installer, path.join(destDir, `Tether Setup ${version}.exe`));
const hash = sha256(installer);
fs.writeFileSync(path.join(destDir, 'SHA256.txt'), `${hash} *Tether Setup ${version}.exe`);
fs.writeFileSync(path.join(destDir, 'RELEASE_NOTES.md'), releaseNotes(version));
fs.writeFileSync(path.join(destDir, 'INSTALL.md'), installGuide(version));
console.log(`Staged: ${destDir}`);
console.log(`Launch note: ${writeLaunchNote(syncFolder, version)}`);
console.log(`SHA256: ${hash}`);

// ---- push ----
if (!noPush && !stageOnly) {
  step('Pushing to origin');
  try {
    run(`git push origin ${branch} --follow-tags`);
  } catch {
    console.warn('Push failed (network/auth?). Code is committed locally — push manually when able.');
  }
}

console.log(`\n✔ Release ${version} complete.`);
console.log(`  Installed users on an auto-update build will be offered ${version} on next launch.`);
console.log(`  Shared copy: ${destDir}`);
