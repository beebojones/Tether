import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = path.resolve('docs', 'walkthrough');
const startPort = Number(process.env.PORT || 5200);

const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
]);

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'content-type': type,
    'cache-control': 'no-store',
  });
  res.end(body);
}

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const requested = path.resolve(root, clean || 'index.html');
  if (!requested.startsWith(root)) return null;
  return requested;
}

function createServer() {
  return http.createServer((req, res) => {
    const requested = safePath(req.url || '/');
    if (!requested) return send(res, 403, 'Forbidden');

    let file = requested;
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) return send(res, 404, 'Not found');

    const type = types.get(path.extname(file).toLowerCase()) || 'application/octet-stream';
    res.writeHead(200, {
      'content-type': type,
      'cache-control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  });
}

function openBrowser(url) {
  if (process.env.NO_OPEN) return;
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore' }).unref();
  } else if (process.platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  }
}

async function listen(port) {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

let server;
let port = startPort;
for (; port < startPort + 20; port += 1) {
  try {
    server = await listen(port);
    break;
  } catch (err) {
    if (err?.code !== 'EADDRINUSE') throw err;
  }
}

if (!server) throw new Error(`No available port found from ${startPort} to ${startPort + 19}`);

const url = `http://127.0.0.1:${port}/`;
console.log(`Tether walkthrough: ${url}`);
console.log('Press Ctrl+C to stop the server.');
openBrowser(url);
