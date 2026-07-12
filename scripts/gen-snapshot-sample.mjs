// Renders a sample Leadership Snapshot HTML from mock-like data for visual review.
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';

await build({
  entryPoints: ['scripts/snapshot-entry.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist-tests/snapshot-entry.cjs',
  alias: { '@shared': './shared' },
  logLevel: 'error',
});
const { html } = await import('../dist-tests/snapshot-entry.cjs');
writeFileSync('shots/leadership-snapshot-sample.html', html);
console.log('written');
