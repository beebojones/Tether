import { build } from 'esbuild';

const common = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['electron', 'better-sqlite3'],
  sourcemap: true,
  outdir: 'dist-electron',
  logLevel: 'info',
};

await build({ ...common, entryPoints: ['electron/main.ts'] });
await build({ ...common, entryPoints: ['electron/preload.ts'] });
