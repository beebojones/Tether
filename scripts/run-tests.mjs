// Bundles TS tests with esbuild and runs them under Electron's Node
// (ELECTRON_RUN_AS_NODE=1) so the Electron-ABI better-sqlite3 build loads.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'dist-tests';
fs.rmSync(outDir, { recursive: true, force: true });

const entries = fs.readdirSync('tests').filter((f) => f.endsWith('.test.ts')).map((f) => path.join('tests', f));

await build({
  entryPoints: entries,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['better-sqlite3', 'electron'],
  outdir: outDir,
  sourcemap: 'inline',
  logLevel: 'error',
});

const electron = path.join('node_modules', 'electron', 'dist', 'electron.exe');
const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.test.js')).map((f) => path.join(outDir, f));

const result = spawnSync(electron, ['--test', ...files], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
});
process.exit(result.status ?? 1);
