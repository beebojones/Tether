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
const mod = await import('../dist-tests/snapshot-entry.cjs');
writeFileSync('shots/leadership-snapshot-sample.html', mod.html);
writeFileSync('shots/leadership-deck-sample.html', mod.deckHtml);
console.log('written');
