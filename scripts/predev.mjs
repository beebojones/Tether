// npm `predev` hook — runs automatically before `npm run dev`. Frees port 5188 and
// clears this project's stray Vite/Electron processes so dev always starts clean.
// Best-effort: never throws, never blocks the dev start.
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

try {
  if (process.platform === 'win32') {
    execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(here, 'predev.ps1')],
      { stdio: 'inherit' },
    );
  } else {
    // POSIX fallback: just free the Vite port.
    try {
      const pids = execSync('lsof -ti tcp:5188', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString().trim().split('\n').filter(Boolean);
      if (pids.length) execSync(`kill -9 ${pids.join(' ')}`);
    } catch { /* nothing listening on the port */ }
  }
} catch { /* never block dev start */ }
