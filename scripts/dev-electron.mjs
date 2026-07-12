// Dev runner: waits for Vite, builds main+preload, launches Electron with live reload of main build.
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import http from 'node:http';

const VITE_URL = 'http://localhost:5188';

function waitForVite() {
  return new Promise((resolve) => {
    const probe = () => {
      http.get(VITE_URL, () => resolve()).on('error', () => setTimeout(probe, 300));
    };
    probe();
  });
}

const common = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['electron', 'better-sqlite3'],
  sourcemap: true,
  outdir: 'dist-electron',
};

await build({ ...common, entryPoints: ['electron/main.ts'] });
await build({ ...common, entryPoints: ['electron/preload.ts'] });
await waitForVite();

const electronBin = process.platform === 'win32'
  ? 'node_modules\\.bin\\electron.cmd'
  : 'node_modules/.bin/electron';

const child = spawn(electronBin, ['.'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, VITE_DEV_SERVER_URL: VITE_URL },
});
child.on('exit', (code) => process.exit(code ?? 0));
