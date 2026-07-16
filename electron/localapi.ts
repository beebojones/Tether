// Local API — a loopback HTTP surface so a trusted local agent (Claude, via the
// tether-mcp bridge) can read, and optionally write, Tether data. It reuses the Store,
// exactly like the IPC layer does, so it never touches SQLite directly and the op-log /
// sync invariants hold. Posture: OFF by default, 127.0.0.1 only, bearer-token gated,
// reads and writes behind separate gates (writes off unless explicitly enabled).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { app } from 'electron';
import type { Store } from './db/store';
import type { SyncEngine } from './sync/engine';
import type { DbContext } from './db/db';
import type { Settings } from './settings';
import { ITEM_TYPES } from '../shared/types';
import type { ItemFilter, ItemSort, ItemType, WorkItem } from '../shared/types';

export interface LocalApiDeps {
  store: Store;
  sync: SyncEngine;
  ctx: DbContext;
  settings: Settings;
  userDataDir: string;
}

export interface LocalApiHandle {
  close: () => void;
  port: number;
  tokenPath: string;
  /** Mint a new token and honour it at once — a revoke that waits for a restart is not one. */
  rotateToken: () => { token: string; path: string };
}

/** Mint + persist a fresh token, replacing any existing one. */
export function writeNewToken(userDataDir: string): { token: string; path: string } {
  const file = path.join(userDataDir, 'local-api-token.txt');
  const token = crypto.randomBytes(24).toString('hex');
  fs.writeFileSync(file, token, { encoding: 'utf8', mode: 0o600 });
  return { token, path: file };
}

const ZERO_ONE_FIELDS = ['leadershipVisible', 'archived', 'sample'] as const;

/**
 * Guard the write routes. Unlike the renderer, callers here (agents via MCP, scripts, curl)
 * do not share our TypeScript types, so their JSON reaches the Store unchecked. Reject what
 * would corrupt data; coerce what is merely idiomatic JSON.
 *
 * Without this, `{type:'blockers'}` — an agent pluralising — returned 201 and wrote an item
 * with ident "undefined-1" (IDENT_PREFIX has no such key), which then synced to teammates;
 * and `leadershipVisible: true` returned a 500 leaking better-sqlite3's bind error, because
 * the column is 0|1.
 */
function sanitizeItemInput(
  b: Record<string, unknown>,
): { error: string } | { value: Record<string, unknown> } {
  const v: Record<string, unknown> = { ...b };

  if (v.type !== undefined && !(ITEM_TYPES as readonly string[]).includes(v.type as string)) {
    return { error: `type must be one of: ${ITEM_TYPES.join(', ')}` };
  }
  for (const f of ZERO_ONE_FIELDS) {
    const raw = v[f];
    if (raw === undefined) continue;
    if (typeof raw === 'boolean') v[f] = raw ? 1 : 0; // booleans are the natural JSON here
    else if (raw !== 0 && raw !== 1) return { error: `${f} must be 0, 1, true or false` };
  }
  if (v.extra !== undefined && (typeof v.extra !== 'object' || v.extra === null || Array.isArray(v.extra))) {
    return { error: 'extra must be an object' };
  }
  if (v.tags !== undefined && (!Array.isArray(v.tags) || v.tags.some((t) => typeof t !== 'string'))) {
    return { error: 'tags must be an array of strings' };
  }
  return { value: v };
}

/** Token lives in its own file (settings.json stays secret-free), 0600 perms. */
function loadOrCreateToken(userDataDir: string): { token: string; file: string } {
  const file = path.join(userDataDir, 'local-api-token.txt');
  try {
    const existing = fs.readFileSync(file, 'utf8').trim();
    if (existing) return { token: existing, file }; // persists across restarts by design
  } catch {
    /* fall through and create */
  }
  const created = writeNewToken(userDataDir);
  return { token: created.token, file: created.path };
}

export function startLocalApi(deps: LocalApiDeps): LocalApiHandle | null {
  const s = deps.settings.get();
  const enabled = s.localApiEnabled || process.env.TETHER_LOCAL_API === '1';
  if (!enabled) {
    console.log('[tether] local API disabled (settings.localApiEnabled=false, TETHER_LOCAL_API unset)');
    return null;
  }

  const port = s.localApiPort || 8787;
  const loaded = loadOrCreateToken(deps.userDataDir);
  const tokenPath = loaded.file;
  // `let`: rotateToken swaps this and every later request compares against the new value,
  // so a leaked token dies on click rather than at next launch.
  let token = loaded.token;
  const { store, ctx, settings, sync } = deps;
  const writesEnabled = s.localApiAllowWrites || process.env.TETHER_LOCAL_API_WRITES === '1';

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
        return json(res, 200, { ok: true, service: 'tether-local-api', mode: writesEnabled ? 'read-write' : 'read-only', version: app.getVersion() });
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

      // ---- write routes (opt-in: settings.localApiAllowWrites / TETHER_LOCAL_API_WRITES=1) ----
      // Any POST/PATCH/DELETE reaching here is a mutation (read POSTs returned above).
      const isWrite = method === 'POST' || method === 'PATCH' || method === 'DELETE';
      if (isWrite && !writesEnabled) {
        return json(res, 403, { error: 'writes disabled', hint: 'set localApiAllowWrites or TETHER_LOCAL_API_WRITES=1' });
      }

      if (method === 'POST' && p === '/items') {
        const b = await readBody(req);
        if (!b.type || !String(b.title ?? '').trim()) return json(res, 400, { error: 'type and title are required' });
        const clean = sanitizeItemInput(b);
        if ('error' in clean) return json(res, 400, clean);
        const item = store.createItem(clean.value as unknown as Partial<WorkItem> & { type: ItemType; title: string });
        sync.noteLocalChange();
        return json(res, 201, item);
      }
      if (method === 'PATCH' && (m = p.match(/^\/items\/([^/]+)$/))) {
        const b = await readBody(req);
        const clean = sanitizeItemInput(b);
        if ('error' in clean) return json(res, 400, clean);
        const item = store.updateItem(decodeURIComponent(m[1]), clean.value as Partial<WorkItem>);
        sync.noteLocalChange();
        return json(res, 200, item);
      }
      if (method === 'POST' && (m = p.match(/^\/items\/([^/]+)\/archive$/))) {
        const b = await readBody(req);
        store.archiveItem(decodeURIComponent(m[1]), b.archived !== false);
        sync.noteLocalChange();
        return json(res, 200, { ok: true });
      }
      if (method === 'DELETE' && (m = p.match(/^\/items\/([^/]+)$/))) {
        store.deleteItem(decodeURIComponent(m[1]));
        sync.noteLocalChange();
        return json(res, 200, { ok: true });
      }
      if (method === 'POST' && (m = p.match(/^\/items\/([^/]+)\/comments$/))) {
        const b = await readBody(req);
        const c = store.addComment(decodeURIComponent(m[1]), String(b.body ?? ''), String(b.bodyText ?? b.body ?? ''));
        sync.noteLocalChange();
        return json(res, 201, c);
      }

      return json(res, 404, { error: 'unknown route', method, path: p });
    } catch (err) {
      return json(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
  });

  server.on('error', (err) => console.error('[tether] local API error:', err));
  server.listen(port, '127.0.0.1', () => {
    console.log(
      `[tether] local API listening on http://127.0.0.1:${port}  mode=${writesEnabled ? 'READ-WRITE' : 'read-only'}  (token: ${tokenPath})`,
    );
  });

  return {
    close: () => server.close(),
    port,
    tokenPath,
    rotateToken: () => {
      const next = writeNewToken(deps.userDataDir);
      token = next.token; // live: the old token is refused from the very next request
      console.log('[tether] local API token rotated — re-register any agent using the old one');
      return next;
    },
  };
}
