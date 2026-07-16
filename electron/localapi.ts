// Local read API — a loopback HTTP surface so a trusted local agent (Claude, via
// the tether-mcp bridge) can READ Tether data. It reuses the Store, exactly like
// the IPC layer does, so it never touches SQLite directly and the op-log / sync
// invariants hold. Posture: OFF by default, 127.0.0.1 only, bearer-token gated,
// READ-ONLY (no mutation routes exist yet — writes are a later, opt-in phase).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { app } from 'electron';
import type { Store } from './db/store';
import type { DbContext } from './db/db';
import type { Settings } from './settings';
import type { ItemFilter, ItemSort } from '../shared/types';

export interface LocalApiDeps {
  store: Store;
  ctx: DbContext;
  settings: Settings;
  userDataDir: string;
}

export interface LocalApiHandle {
  close: () => void;
  port: number;
  tokenPath: string;
}

/** Token lives in its own file (settings.json stays secret-free), 0600 perms. */
function loadOrCreateToken(userDataDir: string): { token: string; file: string } {
  const file = path.join(userDataDir, 'local-api-token.txt');
  try {
    const existing = fs.readFileSync(file, 'utf8').trim();
    if (existing) return { token: existing, file };
  } catch {
    /* fall through and create */
  }
  const token = crypto.randomBytes(24).toString('hex');
  fs.writeFileSync(file, token, { encoding: 'utf8', mode: 0o600 });
  return { token, file };
}

export function startLocalApi(deps: LocalApiDeps): LocalApiHandle | null {
  const s = deps.settings.get();
  const enabled = s.localApiEnabled || process.env.TETHER_LOCAL_API === '1';
  if (!enabled) {
    console.log('[tether] local API disabled (settings.localApiEnabled=false, TETHER_LOCAL_API unset)');
    return null;
  }

  const port = s.localApiPort || 8787;
  const { token, file: tokenPath } = loadOrCreateToken(deps.userDataDir);
  const { store, ctx, settings } = deps;

  const json = (res: http.ServerResponse, code: number, body: unknown) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  const readBody = (req: http.IncomingMessage): Promise<Record<string, unknown>> =>
    new Promise((resolve) => {
      let raw = '';
      req.on('data', (c) => {
        raw += c;
        if (raw.length > 1_000_000) req.destroy(); // 1MB cap
      });
      req.on('end', () => {
        try {
          resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
        } catch {
          resolve({});
        }
      });
    });

  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url || '/', 'http://127.0.0.1');
      const p = u.pathname;
      const method = req.method || 'GET';

      // Unauthenticated liveness probe.
      if (p === '/health') {
        return json(res, 200, { ok: true, service: 'tether-local-api', mode: 'read-only', version: app.getVersion() });
      }

      // Everything else needs the bearer token.
      if (req.headers.authorization !== `Bearer ${token}`) {
        return json(res, 401, { error: 'unauthorized' });
      }

      // ---- read-only routes ----
      if (method === 'GET' && p === '/meta') {
        return json(res, 200, {
          project: settings.get().projectName,
          dataDir: ctx.dataDir,
          dbPath: ctx.dbPath,
          deviceId: ctx.deviceId,
        });
      }
      if (method === 'POST' && p === '/items/search') {
        const b = await readBody(req);
        return json(res, 200, store.search(String(b.text ?? ''), Number(b.limit ?? 30)));
      }
      if (method === 'POST' && p === '/items/list') {
        const b = await readBody(req);
        const sort = (b.sort as ItemSort) ?? ({ field: 'updatedAt', dir: 'desc' } as ItemSort);
        return json(
          res,
          200,
          store.listItems((b.filter as ItemFilter) ?? {}, sort, Number(b.limit ?? 200), Number(b.offset ?? 0)),
        );
      }
      if (method === 'GET' && p === '/milestones') return json(res, 200, store.listMilestones());
      if (method === 'GET' && p === '/releases') return json(res, 200, store.listReleases());
      if (method === 'GET' && p === '/users') return json(res, 200, store.listUsers());

      let m: RegExpMatchArray | null;
      if (method === 'GET' && (m = p.match(/^\/items\/([^/]+)\/links$/))) {
        return json(res, 200, store.linksFor(decodeURIComponent(m[1])));
      }
      if (method === 'GET' && (m = p.match(/^\/items\/([^/]+)\/comments$/))) {
        return json(res, 200, store.commentsFor(decodeURIComponent(m[1])));
      }
      if (method === 'GET' && (m = p.match(/^\/items\/([^/]+)\/activity$/))) {
        return json(res, 200, store.activityFor(decodeURIComponent(m[1]), 100));
      }
      if (method === 'GET' && (m = p.match(/^\/items\/([^/]+)$/))) {
        const key = decodeURIComponent(m[1]);
        const item = store.getItem(key) ?? store.getItemByIdent(key);
        return item ? json(res, 200, item) : json(res, 404, { error: 'not found' });
      }

      return json(res, 404, { error: 'unknown route', method, path: p });
    } catch (err) {
      return json(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
  });

  server.on('error', (err) => console.error('[tether] local API error:', err));
  server.listen(port, '127.0.0.1', () => {
    console.log(`[tether] local READ API listening on http://127.0.0.1:${port}  (token: ${tokenPath})`);
  });

  return { close: () => server.close(), port, tokenPath };
}
