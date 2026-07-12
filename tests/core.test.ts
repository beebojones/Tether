// Core data-layer + sync tests. Run with: npm test
// (bundled by scripts/run-tests.mjs and executed under Electron's Node via ELECTRON_RUN_AS_NODE
//  so better-sqlite3's Electron-ABI build loads.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDatabase, type DbContext } from '../electron/db/db';
import { Store } from '../electron/db/store';
import { FolderTransport } from '../electron/sync/transport';
import { SyncEngine } from '../electron/sync/engine';
import { loadSeedData } from '../electron/db/seed';

function tmp(name: string): string {
  const p = fs.mkdtempSync(path.join(os.tmpdir(), `keystone-${name}-`));
  return p;
}

function mkStore(name: string, actor: string): { ctx: DbContext; store: Store } {
  const ctx = openDatabase(tmp(name));
  const store = new Store(ctx, actor);
  return { ctx, store };
}

async function syncBoth(a: { store: Store }, b: { store: Store }, folder: string, userA = 'John', userB = 'Mark') {
  const ea = new SyncEngine(a.store, userA, () => {});
  const eb = new SyncEngine(b.store, userB, () => {});
  ea.setTransport(new FolderTransport(folder));
  eb.setTransport(new FolderTransport(folder));
  // Two cycles each so renumber-rebroadcasts and cross-imports settle.
  for (let i = 0; i < 3; i++) {
    await ea.cycle();
    await eb.cycle();
  }
  await ea.stop();
  await eb.stop();
}

test('migrations create schema and device identity', () => {
  const { ctx, store } = mkStore('mig', 'john');
  assert.ok(ctx.deviceId.length > 10);
  assert.equal(store.listItems().length, 0);
  ctx.db.close();
});

test('item CRUD, ident allocation, activity, search', () => {
  const { ctx, store } = mkStore('crud', 'john');
  const item = store.createItem({ type: 'requirement', title: 'Answers must cite sources' });
  assert.equal(item.ident, 'REQ-1');
  assert.equal(item.status, 'backlog');

  const second = store.createItem({ type: 'requirement', title: 'Another requirement' });
  assert.equal(second.ident, 'REQ-2');

  store.updateItem(item.id, { status: 'in_progress', priority: 'high' });
  const got = store.getItem(item.id)!;
  assert.equal(got.status, 'in_progress');
  assert.equal(got.priority, 'high');

  // done → completedAt set
  store.updateItem(item.id, { status: 'done' });
  assert.ok(store.getItem(item.id)!.completedAt);

  // search hits title
  const results = store.search('cite sources');
  assert.ok(results.some((r) => r.item.id === item.id));

  // by ident
  assert.equal(store.getItemByIdent('req-1')!.id, item.id);

  const activity = store.activityFor(item.id) as { kind: string }[];
  assert.ok(activity.some((a) => a.kind === 'created'));
  assert.ok(activity.some((a) => a.kind === 'updated'));

  // delete hides from queries
  store.deleteItem(second.id);
  assert.equal(store.getItem(second.id), null);
  ctx.db.close();
});

test('links, comments, versions', () => {
  const { ctx, store } = mkStore('rel', 'john');
  const a = store.createItem({ type: 'task', title: 'Build export' });
  const b = store.createItem({ type: 'feature', title: 'Ingestion pipeline' });
  store.addLink(a.id, b.id, 'implements');
  const links = store.linksFor(a.id);
  assert.equal(links.length, 1);
  assert.equal(links[0].other.id, b.id);
  assert.equal(links[0].direction, 'out');

  store.addComment(a.id, '{"type":"doc"}', 'looks good');
  assert.equal(store.commentsFor(a.id).length, 1);

  store.saveVersion(a.id);
  store.updateItem(a.id, { title: 'Build export v2' });
  const versions = store.versionsFor(a.id) as { title: string }[];
  assert.equal(versions.length, 1);
  assert.equal(versions[0].title, 'Build export');
  ctx.db.close();
});

test('sync: two devices converge through a shared folder', async () => {
  const a = mkStore('syncA', 'john');
  const b = mkStore('syncB', 'mark');
  const folder = tmp('shared');

  const itemA = a.store.createItem({ type: 'task', title: 'From John' });
  const itemB = b.store.createItem({ type: 'decision', title: 'From Mark' });

  await syncBoth(a, b, folder);

  assert.ok(b.store.getItem(itemA.id), 'B received A item');
  assert.ok(a.store.getItem(itemB.id), 'A received B item');
  assert.equal(b.store.getItem(itemA.id)!.title, 'From John');

  // Edit on B propagates to A
  b.store.updateItem(itemA.id, { status: 'in_progress' });
  await syncBoth(a, b, folder);
  assert.equal(a.store.getItem(itemA.id)!.status, 'in_progress');

  a.ctx.db.close();
  b.ctx.db.close();
});

test('sync: concurrent title edits surface a conflict, LWW applies, resolution converges', async () => {
  const a = mkStore('confA', 'john');
  const b = mkStore('confB', 'mark');
  const folder = tmp('sharedc');

  const item = a.store.createItem({ type: 'task', title: 'Original' });
  await syncBoth(a, b, folder);
  assert.ok(b.store.getItem(item.id));

  // Both edit the title while "offline" (no sync between edits).
  a.store.updateItem(item.id, { title: 'John version' });
  b.store.updateItem(item.id, { title: 'Mark version' });
  await syncBoth(a, b, folder);

  // Both sides show the same LWW winner.
  const ta = a.store.getItem(item.id)!.title;
  const tb = b.store.getItem(item.id)!.title;
  assert.equal(ta, tb, 'LWW converged');

  // At least one side recorded a conflict for review.
  const conflicts = [...a.store.listConflicts(true), ...b.store.listConflicts(true)];
  assert.ok(conflicts.length >= 1, 'conflict surfaced');
  assert.ok(conflicts.some((c) => c.field === 'title'));

  // Resolving with a merged value propagates.
  const side = a.store.listConflicts(true).length ? a : b;
  const conflict = side.store.listConflicts(true)[0];
  side.store.resolveConflict(conflict.id, 'merged', 'Merged title');
  await syncBoth(a, b, folder);
  assert.equal(a.store.getItem(item.id)!.title, 'Merged title');
  assert.equal(b.store.getItem(item.id)!.title, 'Merged title');

  a.ctx.db.close();
  b.ctx.db.close();
});

test('sync: ident collision renumbers and converges', async () => {
  const a = mkStore('idA', 'john');
  const b = mkStore('idB', 'mark');
  const folder = tmp('sharedi');

  // Both create TASK-1 offline.
  const ia = a.store.createItem({ type: 'task', title: 'A task' });
  const ib = b.store.createItem({ type: 'task', title: 'B task' });
  assert.equal(ia.ident, 'TASK-1');
  assert.equal(ib.ident, 'TASK-1');

  await syncBoth(a, b, folder);
  await syncBoth(a, b, folder); // extra rounds to settle renumber broadcasts

  const aIdents = [a.store.getItem(ia.id)!.ident, a.store.getItem(ib.id)!.ident].sort();
  const bIdents = [b.store.getItem(ia.id)!.ident, b.store.getItem(ib.id)!.ident].sort();
  assert.notEqual(aIdents[0], aIdents[1], 'idents unique on A');
  assert.notEqual(bIdents[0], bIdents[1], 'idents unique on B');
  assert.deepEqual(aIdents, bIdents, 'both sides agree on idents');

  a.ctx.db.close();
  b.ctx.db.close();
});

test('sync: offline edits queue and flush when folder returns', async () => {
  const a = mkStore('offA', 'john');
  const folder = tmp('sharedo');
  const engine = new SyncEngine(a.store, 'John', () => {});

  a.store.createItem({ type: 'task', title: 'Made offline' });
  assert.ok(engine.status().pendingOps > 0 || engine.status().state === 'disabled');

  engine.setTransport(new FolderTransport(folder));
  await engine.cycle();
  assert.equal(engine.status().pendingOps, 0, 'ops exported after transport attached');
  await engine.stop();
  a.ctx.db.close();
});

test('seed data loads, is flagged, and removes cleanly', () => {
  const { ctx, store } = mkStore('seed', 'john');
  const n = loadSeedData(store);
  assert.ok(n > 15);
  const samples = store.listItems({ sample: true }, { field: 'createdAt', dir: 'asc' }, 100);
  assert.equal(samples.length, n);
  // links exist
  const withLinks = samples.filter((s) => store.linksFor(s.id).length > 0);
  assert.ok(withLinks.length > 5);

  const removed = store.removeSampleData();
  assert.equal(removed, n);
  assert.equal(store.listItems({}, { field: 'createdAt', dir: 'asc' }, 100).length, 0);
  ctx.db.close();
});

test('database integrity guard quarantines corruption', () => {
  const dir = tmp('corrupt');
  const ctx = openDatabase(dir);
  ctx.db.close();
  // Stomp the file header.
  const dbPath = path.join(dir, 'keystone.db');
  const fd = fs.openSync(dbPath, 'r+');
  fs.writeSync(fd, Buffer.from('GARBAGEGARBAGEGARBAGE'), 0, 21, 0);
  fs.closeSync(fd);
  assert.throws(() => openDatabase(dir), /integrity|malformed|not a database/i);
});
