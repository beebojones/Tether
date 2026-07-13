// Builds build/icon.ico from build/icon.svg via headless Edge PNG renders.
// ICO uses PNG-compressed entries (valid since Windows Vista). No dependencies.
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];
const edge = EDGE_CANDIDATES.find((p) => existsSync(p));
if (!edge) throw new Error('Edge not found for icon rendering');

const sizes = [16, 24, 32, 48, 64, 128, 256];
const tmp = path.resolve('build/icon-tmp');
mkdirSync(tmp, { recursive: true });

const svgPath = path.resolve('build/icon.svg');
const pngs = [];
for (const size of sizes) {
  const html = path.join(tmp, `icon-${size}.html`);
  writeFileSync(
    html,
    `<!doctype html><html><head><style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;overflow:hidden;background:transparent}img{width:${size}px;height:${size}px;display:block}</style></head><body><img src="file:///${svgPath.replace(/\\/g, '/')}"></body></html>`,
  );
  const out = path.join(tmp, `icon-${size}.png`);
  execFileSync(edge, [
    '--headless=new', '--disable-gpu', '--default-background-color=00000000',
    `--window-size=${size},${size}`, '--hide-scrollbars', '--virtual-time-budget=2000',
    `--screenshot=${out}`, `file:///${html.replace(/\\/g, '/')}`,
  ], { stdio: 'ignore' });
  // Edge can detach before the file lands — poll up to 10s.
  const deadline = Date.now() + 10_000;
  while (!existsSync(out) && Date.now() < deadline) {
    execFileSync(process.execPath, ['-e', 'setTimeout(()=>{},250)']); // portable sleep
  }
  if (!existsSync(out)) throw new Error(`Render timed out for ${size}px`);
  pngs.push({ size, data: readFileSync(out) });
}

// ICO container: ICONDIR (6 bytes) + N * ICONDIRENTRY (16 bytes) + payloads.
const count = pngs.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(count, 4);

const entries = [];
let offset = 6 + 16 * count;
for (const { size, data } of pngs) {
  const e = Buffer.alloc(16);
  e.writeUInt8(size === 256 ? 0 : size, 0); // width (0 = 256)
  e.writeUInt8(size === 256 ? 0 : size, 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // bpp
  e.writeUInt32LE(data.length, 8);
  e.writeUInt32LE(offset, 12);
  entries.push(e);
  offset += data.length;
}

writeFileSync('build/icon.ico', Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]));
rmSync(tmp, { recursive: true, force: true });
console.log(`build/icon.ico written (${count} sizes, ${offset} bytes)`);
