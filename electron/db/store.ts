// Store: the single write path. Every mutation (local or remote) flows through here so
// SQLite state, the oplog, field clocks, activity history, and FTS stay consistent.
//
// Sync model (see docs/SYNC_ARCHITECTURE.md):
// - Local mutations append field-granular ops to oplog (lamport clock + device id).
// - 'set' ops carry basedOn = the (lamport,device) each field had when written,
//   letting the importer distinguish clean causal updates from true concurrent edits.
// - Concurrent edits resolve by LWW (lamport, deviceId tiebreak). For content fields
//   (title, body) the losing value is preserved in sync_conflicts for manual review.

import crypto from 'node:crypto';
import type { DB, DbContext } from './db';
import { getMeta, setMeta } from './db';
import type {
  ItemFilter,
  ItemSort,
  ItemType,
  Op,
  WorkItem,
  ItemLink,
  Comment,
  Milestone,
  Release,
  SavedView,
  User,
  LinkKind,
  SearchResult,
  SyncConflict,
} from '../../shared/types';
import { IDENT_PREFIX, statusesForType, TERMINAL_STATUSES } from '../../shared/types';
import { docToText } from '../../shared/doc';

const CONFLICT_SURFACED_FIELDS = new Set(['title', 'body']);

// camelCase field -> items column
const ITEM_COLS: Record<string, string> = {
  ident: 'ident',
  type: 'type',
  title: 'title',
  body: 'body',
  bodyText: 'body_text',
  status: 'status',
  priority: 'priority',
  ownerId: 'owner_id',
  reporterId: 'reporter_id',
  milestoneId: 'milestone_id',
  releaseId: 'release_id',
  parentId: 'parent_id',
  startDate: 'start_date',
  dueDate: 'due_date',
  completedAt: 'completed_at',
  effort: 'effort',
  confidence: 'confidence',
  riskLevel: 'risk_level',
  businessValue: 'business_value',
  leadershipVisible: 'leadership_visible',
  progress: 'progress',
  tags: 'tags',
  extra: 'extra',
  archived: 'archived',
  sample: 'sample',
  deleted: 'deleted',
  updatedAt: 'updated_at',
  updatedBy: 'updated_by',
};

const JSON_ITEM_FIELDS = new Set(['tags', 'extra']);

export interface StoreEvents {
  onChange: (what: { entity: string; entityId: string }) => void;
  onConflict: (conflict: SyncConflict) => void;
}

export class Store {
  readonly db: DB;
  readonly deviceId: string;
  actorId: string;
  private events: StoreEvents;

  constructor(ctx: DbContext, actorId: string, events?: Partial<StoreEvents>) {
    this.db = ctx.db;
    this.deviceId = ctx.deviceId;
    this.actorId = actorId;
    this.events = {
      onChange: events?.onChange ?? (() => {}),
      onConflict: events?.onConflict ?? (() => {}),
    };
  }

  // ---------- clocks ----------
  private tickLamport(): number {
    const cur = Number(getMeta(this.db, 'lamport') ?? '0') + 1;
    setMeta(this.db, 'lamport', String(cur));
    return cur;
  }

  private witnessLamport(remote: number): void {
    const cur = Number(getMeta(this.db, 'lamport') ?? '0');
    if (remote > cur) setMeta(this.db, 'lamport', String(remote));
  }

  private now(): string {
    return new Date().toISOString();
  }

  private fieldClock(entity: string, entityId: string, field: string): { lamport: number; deviceId: string } | null {
    const row = this.db
      .prepare('SELECT lamport, device_id FROM field_clock WHERE entity=? AND entity_id=? AND field=?')
      .get(entity, entityId, field) as { lamport: number; device_id: string } | undefined;
    return row ? { lamport: row.lamport, deviceId: row.device_id } : null;
  }

  private setFieldClock(entity: string, entityId: string, field: string, lamport: number, deviceId: string): void {
    this.db
      .prepare(
        `INSERT INTO field_clock(entity, entity_id, field, lamport, device_id) VALUES(?,?,?,?,?)
         ON CONFLICT(entity, entity_id, field) DO UPDATE SET lamport=excluded.lamport, device_id=excluded.device_id`,
      )
      .run(entity, entityId, field, lamport, deviceId);
  }

  // ---------- oplog ----------
  private appendOp(op: Op): void {
    this.db
      .prepare(
        `INSERT INTO oplog(op_id, device_id, actor_id, lamport, at, entity, entity_id, action, payload)
         VALUES(?,?,?,?,?,?,?,?,?)`,
      )
      .run(op.opId, op.deviceId, op.actorId, op.lamport, op.at, op.entity, op.entityId, op.action, JSON.stringify(op.payload));
  }

  private localOp(
    entity: Op['entity'],
    entityId: string,
    action: Op['action'],
    payload: Record<string, unknown>,
  ): Op {
    const lamport = this.tickLamport();
    const op: Op = {
      opId: crypto.randomUUID(),
      deviceId: this.deviceId,
      actorId: this.actorId,
      lamport,
      at: this.now(),
      entity,
      entityId,
      action,
      payload,
    };
    this.appendOp(op);
    return op;
  }

  /** Local 'set': records basedOn clocks then advances them. */
  private localSet(entity: Op['entity'], entityId: string, fields: Record<string, unknown>): void {
    const basedOn: Record<string, { lamport: number; deviceId: string } | null> = {};
    for (const f of Object.keys(fields)) basedOn[f] = this.fieldClock(entity, entityId, f);
    const op = this.localOp(entity, entityId, 'set', { fields, basedOn });
    for (const f of Object.keys(fields)) this.setFieldClock(entity, entityId, f, op.lamport, this.deviceId);
  }

  private localCreate(entity: Op['entity'], entityId: string, record: Record<string, unknown>): void {
    const op = this.localOp(entity, entityId, 'create', { record });
    for (const f of Object.keys(record)) this.setFieldClock(entity, entityId, f, op.lamport, this.deviceId);
  }

  // ---------- ident allocation ----------
  allocIdent(type: ItemType): string {
    const prefix = IDENT_PREFIX[type];
    const row = this.db.prepare('SELECT next FROM ident_counters WHERE type=?').get(type) as
      | { next: number }
      | undefined;
    let n = row ? row.next : 1;
    // Skip numbers already taken (imports may have advanced usage past our counter).
    while (this.db.prepare('SELECT 1 FROM items WHERE ident=?').get(`${prefix}-${n}`)) n++;
    this.db
      .prepare('INSERT INTO ident_counters(type,next) VALUES(?,?) ON CONFLICT(type) DO UPDATE SET next=?')
      .run(type, n + 1, n + 1);
    return `${prefix}-${n}`;
  }

  /** Advance the local counter past an ident observed from a peer. */
  private witnessIdent(type: ItemType, ident: string): void {
    const m = /-(\d+)$/.exec(ident);
    if (!m) return;
    const n = Number(m[1]);
    const row = this.db.prepare('SELECT next FROM ident_counters WHERE type=?').get(type) as
      | { next: number }
      | undefined;
    if (!row || row.next <= n) {
      this.db
        .prepare('INSERT INTO ident_counters(type,next) VALUES(?,?) ON CONFLICT(type) DO UPDATE SET next=?')
        .run(type, n + 1, n + 1);
    }
  }

  // ---------- activity ----------
  /** Public activity hook for collaborators outside Store (e.g. AttachmentManager). */
  recordActivity(itemId: string | null, kind: string, oldV?: unknown, newV?: unknown): void {
    this.logActivity(itemId, kind, null, oldV, newV);
    this.events.onChange({ entity: 'activity', entityId: itemId ?? '*' });
  }

  /**
   * `actorId`/`at` default to us and now, which is right for local edits. Ops applied from
   * a teammate pass their own — activity is not a synced entity (the op-log already carries
   * who did what and when), so remote activity is derived here from the op, not shipped.
   */
  private logActivity(
    itemId: string | null,
    kind: string,
    field?: string | null,
    oldV?: unknown,
    newV?: unknown,
    actorId?: string,
    at?: string,
    id?: string,
  ): number {
    const info = this.db
      .prepare('INSERT OR IGNORE INTO activity(id, item_id, actor_id, kind, field, old_value, new_value, at) VALUES(?,?,?,?,?,?,?,?)')
      .run(
        id ?? crypto.randomUUID(),
        itemId,
        actorId ?? this.actorId,
        kind,
        field ?? null,
        oldV == null ? null : String(oldV).slice(0, 8000),
        newV == null ? null : String(newV).slice(0, 8000),
        at ?? this.now(),
      );
    return info.changes;
  }

  /** Stable per-op activity id, so deriving the same op twice is a no-op. */
  private opActivityId(opId: string, field?: string): string {
    return field ? `${opId}:${field}` : opId;
  }

  /**
   * Rebuild activity for ops that arrived from other devices before we derived activity on
   * apply (i.e. a teammate's whole history to date). Ids come from the op id and inserts are
   * OR IGNORE, so this is idempotent and cannot double up with the live apply path — safe to
   * run on every boot.
   *
   * Old values are not recoverable for 'set' ops (the op carries the new value and a causal
   * base, not the prior value), so those entries render as "changed X to Y" without a from.
   */
  backfillRemoteActivity(): number {
    const rows = this.db
      .prepare(
        `SELECT op_id, actor_id, at, entity, entity_id, action, payload FROM oplog
          WHERE device_id != ? AND entity IN ('item','comment')`,
      )
      .all(this.deviceId) as Array<{
      op_id: string; actor_id: string; at: string; entity: string; entity_id: string;
      action: string; payload: string;
    }>;

    let added = 0;
    const tx = this.db.transaction(() => {
      for (const r of rows) {
        let payload: Record<string, unknown>;
        try { payload = JSON.parse(r.payload || '{}'); } catch { continue; }
        const record = (payload.record ?? {}) as Record<string, unknown>;

        if (r.entity === 'comment') {
          if (r.action !== 'create') continue;
          added += this.logActivity(
            (record.itemId as string) ?? null, 'comment', null, null,
            String(record.bodyText ?? '').slice(0, 200),
            r.actor_id, r.at, this.opActivityId(r.op_id),
          );
          continue;
        }

        if (r.action === 'create') {
          added += this.logActivity(
            r.entity_id, 'created', null, null, record.title,
            r.actor_id, r.at, this.opActivityId(r.op_id),
          );
        } else if (r.action === 'set') {
          const fields = (payload.fields ?? {}) as Record<string, unknown>;
          for (const [k, v] of Object.entries(fields)) {
            if (k === 'updatedAt' || k === 'updatedBy' || k === 'body' || k === 'bodyText') continue;
            added += this.logActivity(
              r.entity_id, 'updated', k, null, JSON_ITEM_FIELDS.has(k) ? JSON.stringify(v) : v,
              r.actor_id, r.at, this.opActivityId(r.op_id, k),
            );
          }
          if ('body' in fields || 'bodyText' in fields) {
            added += this.logActivity(
              r.entity_id, 'edited', 'body', null, String(fields.bodyText ?? ''),
              r.actor_id, r.at, this.opActivityId(r.op_id, 'body'),
            );
          }
        } else if (r.action === 'delete') {
          added += this.logActivity(
            r.entity_id, 'deleted', null, null, null,
            r.actor_id, r.at, this.opActivityId(r.op_id),
          );
        }
      }
    });
    tx();
    return added;
  }

  // ---------- items ----------
  createItem(input: Partial<WorkItem> & { type: ItemType; title: string }): WorkItem {
    const tx = this.db.transaction(() => {
      const id = crypto.randomUUID();
      const ident = this.allocIdent(input.type);
      const now = this.now();
      const statuses = statusesForType(input.type);
      const item: WorkItem = {
        id,
        ident,
        type: input.type,
        title: input.title,
        body: input.body ?? '',
        bodyText: input.bodyText ?? '',
        status: input.status && statuses.includes(input.status) ? input.status : statuses[0],
        priority: input.priority ?? 'none',
        ownerId: input.ownerId ?? null,
        reporterId: input.reporterId ?? this.actorId,
        milestoneId: input.milestoneId ?? null,
        releaseId: input.releaseId ?? null,
        parentId: input.parentId ?? null,
        startDate: input.startDate ?? null,
        dueDate: input.dueDate ?? null,
        completedAt: null,
        effort: input.effort ?? null,
        confidence: input.confidence ?? null,
        riskLevel: input.riskLevel ?? null,
        businessValue: input.businessValue ?? null,
        leadershipVisible: input.leadershipVisible ?? 0,
        progress: input.progress ?? null,
        tags: input.tags ?? [],
        extra: input.extra ?? {},
        archived: 0,
        sample: input.sample ?? 0,
        createdAt: now,
        updatedAt: now,
        createdBy: this.actorId,
        updatedBy: this.actorId,
      };
      this.insertItemRow(item);
      this.localCreate('item', id, this.itemToRecord(item));
      this.logActivity(id, 'created', null, null, item.title);
      return item;
    });
    const item = tx();
    this.events.onChange({ entity: 'item', entityId: item.id });
    return item;
  }

  private itemToRecord(item: WorkItem): Record<string, unknown> {
    return { ...item, tags: item.tags, extra: item.extra };
  }

  private insertItemRow(i: WorkItem): void {
    this.db
      .prepare(
        `INSERT INTO items(id, ident, type, title, body, body_text, status, priority, owner_id, reporter_id,
          milestone_id, release_id, parent_id, start_date, due_date, completed_at, effort, confidence,
          risk_level, business_value, leadership_visible, progress, tags, extra, archived, sample, deleted,
          created_at, updated_at, created_by, updated_by)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?)`,
      )
      .run(
        i.id, i.ident, i.type, i.title, i.body, i.bodyText, i.status, i.priority, i.ownerId, i.reporterId,
        i.milestoneId, i.releaseId, i.parentId, i.startDate, i.dueDate, i.completedAt, i.effort, i.confidence,
        i.riskLevel, i.businessValue, i.leadershipVisible, i.progress, JSON.stringify(i.tags), JSON.stringify(i.extra),
        i.archived, i.sample, i.createdAt, i.updatedAt, i.createdBy, i.updatedBy,
      );
  }

  updateItem(id: string, fields: Partial<WorkItem>): WorkItem | null {
    const before = this.getItem(id);
    if (!before) return null;
    const changed: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (!(k in ITEM_COLS) || k === 'deleted') continue;
      const prev = (before as unknown as Record<string, unknown>)[k];
      const same = JSON_ITEM_FIELDS.has(k) ? JSON.stringify(prev) === JSON.stringify(v) : prev === v;
      if (!same) changed[k] = v;
    }
    if (Object.keys(changed).length === 0) return before;

    // Status transitions maintain completedAt automatically.
    if ('status' in changed) {
      const terminalNow = TERMINAL_STATUSES.has(String(changed.status));
      const terminalBefore = TERMINAL_STATUSES.has(before.status);
      if (terminalNow && !terminalBefore) changed.completedAt = this.now();
      if (!terminalNow && terminalBefore) changed.completedAt = null;
    }
    changed.updatedAt = this.now();
    changed.updatedBy = this.actorId;

    const tx = this.db.transaction(() => {
      this.applyItemFields(id, changed);
      this.localSet('item', id, changed);
      for (const [k, v] of Object.entries(changed)) {
        if (k === 'updatedAt' || k === 'updatedBy') continue;
        if (k === 'body' || k === 'bodyText') continue; // body edits logged as one 'edited' entry
        this.logActivity(id, 'updated', k, (before as unknown as Record<string, unknown>)[k], JSON_ITEM_FIELDS.has(k) ? JSON.stringify(v) : v);
      }
      // Body edit: record old/new plain text so the activity diff can show before/after.
      if ('body' in changed || 'bodyText' in changed) {
        const newText = 'bodyText' in changed ? String(changed.bodyText ?? '') : before.bodyText;
        this.logActivity(id, 'edited', 'body', before.bodyText, newText);
      }
    });
    tx();
    this.events.onChange({ entity: 'item', entityId: id });
    return this.getItem(id);
  }

  private applyItemFields(id: string, fields: Record<string, unknown>): void {
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [k, v] of Object.entries(fields)) {
      const col = ITEM_COLS[k];
      if (!col) continue;
      sets.push(`${col}=?`);
      vals.push(JSON_ITEM_FIELDS.has(k) ? JSON.stringify(v) : v);
    }
    if (sets.length === 0) return;
    vals.push(id);
    this.db.prepare(`UPDATE items SET ${sets.join(', ')} WHERE id=?`).run(...vals);
  }

  archiveItem(id: string, archived: boolean): void {
    // updateItem already writes the activity entry for the archived-field change.
    this.updateItem(id, { archived: archived ? 1 : 0 } as Partial<WorkItem>);
  }

  deleteItem(id: string): void {
    const stamp = this.now();
    const tx = this.db.transaction(() => {
      this.db.prepare('UPDATE items SET deleted=1, deleted_at=?, deleted_by=?, updated_at=?, updated_by=? WHERE id=?')
        .run(stamp, this.actorId, stamp, this.actorId, id);
      this.localOp('item', id, 'delete', {});
      this.logActivity(id, 'deleted');
    });
    tx();
    this.events.onChange({ entity: 'item', entityId: id });
  }

  getItem(id: string): WorkItem | null {
    const row = this.db.prepare('SELECT * FROM items WHERE id=? AND deleted=0').get(id) as Record<string, unknown> | undefined;
    return row ? rowToItem(row) : null;
  }

  getItemByIdent(ident: string): WorkItem | null {
    const row = this.db.prepare('SELECT * FROM items WHERE ident=? COLLATE NOCASE AND deleted=0').get(ident) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToItem(row) : null;
  }

  listItems(filter: ItemFilter = {}, sort: ItemSort = { field: 'updatedAt', dir: 'desc' }, limit = 500, offset = 0): WorkItem[] {
    const where: string[] = ['deleted=0'];
    const vals: unknown[] = [];
    if (filter.archived !== undefined) {
      where.push('archived=?');
      vals.push(filter.archived ? 1 : 0);
    } else where.push('archived=0');
    if (filter.types?.length) {
      where.push(`type IN (${filter.types.map(() => '?').join(',')})`);
      vals.push(...filter.types);
    }
    if (filter.statuses?.length) {
      where.push(`status IN (${filter.statuses.map(() => '?').join(',')})`);
      vals.push(...filter.statuses);
    }
    if (filter.priorities?.length) {
      where.push(`priority IN (${filter.priorities.map(() => '?').join(',')})`);
      vals.push(...filter.priorities);
    }
    if (filter.ownerIds?.length) {
      const nonNull = filter.ownerIds.filter((o) => o !== null);
      const parts: string[] = [];
      if (nonNull.length) {
        parts.push(`owner_id IN (${nonNull.map(() => '?').join(',')})`);
        vals.push(...nonNull);
      }
      if (filter.ownerIds.includes(null)) parts.push('owner_id IS NULL');
      where.push(`(${parts.join(' OR ')})`);
    }
    if (filter.milestoneId) { where.push('milestone_id=?'); vals.push(filter.milestoneId); }
    if (filter.releaseId) { where.push('release_id=?'); vals.push(filter.releaseId); }
    if (filter.parentId) { where.push('parent_id=?'); vals.push(filter.parentId); }
    if (filter.tag) { where.push("tags LIKE ?"); vals.push(`%${JSON.stringify(filter.tag)}%`); }
    if (filter.overdue) { where.push("due_date IS NOT NULL AND due_date < date('now') AND completed_at IS NULL"); }
    if (filter.dueWithinDays != null) {
      where.push("due_date IS NOT NULL AND due_date <= date('now', ?) AND completed_at IS NULL");
      vals.push(`+${filter.dueWithinDays} days`);
    }
    if (filter.leadershipVisible) where.push('leadership_visible=1');
    if (filter.updatedSince) { where.push('updated_at >= ?'); vals.push(filter.updatedSince); }
    if (filter.sample !== undefined) { where.push('sample=?'); vals.push(filter.sample ? 1 : 0); }
    if (filter.text) {
      where.push('rowid IN (SELECT rowid FROM items_fts WHERE items_fts MATCH ?)');
      vals.push(ftsQuery(filter.text));
    }

    const sortCol: Record<string, string> = {
      ident: 'ident',
      title: 'title COLLATE NOCASE',
      status: 'status',
      priority: "CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END",
      dueDate: 'due_date IS NULL, due_date',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      manual: 'updated_at',
    };
    const order = `${sortCol[sort.field] ?? 'updated_at'} ${sort.dir === 'asc' ? 'ASC' : 'DESC'}`;
    const rows = this.db
      .prepare(`SELECT * FROM items WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`)
      .all(...vals, limit, offset) as Record<string, unknown>[];
    return rows.map(rowToItem);
  }

  search(text: string, limit = 30): SearchResult[] {
    if (!text.trim()) return [];
    const rows = this.db
      .prepare(
        `SELECT items.*, snippet(items_fts, 2, '<<', '>>', '…', 12) AS snip, rank AS score
         FROM items_fts JOIN items ON items.rowid = items_fts.rowid
         WHERE items_fts MATCH ? AND items.deleted=0 AND items.archived=0
         ORDER BY rank LIMIT ?`,
      )
      .all(ftsQuery(text), limit) as (Record<string, unknown> & { snip: string; score: number })[];
    return rows.map((r) => ({ item: rowToItem(r), snippet: r.snip, score: r.score }));
  }

  // ---------- links ----------
  addLink(fromId: string, toId: string, kind: LinkKind): ItemLink | null {
    if (fromId === toId) return null;
    const existing = this.db
      .prepare('SELECT * FROM links WHERE from_id=? AND to_id=? AND kind=?')
      .get(fromId, toId, kind) as Record<string, unknown> | undefined;
    if (existing && !existing.deleted) return rowToLink(existing);
    const link: ItemLink = {
      id: existing ? String(existing.id) : crypto.randomUUID(),
      fromId,
      toId,
      kind,
      createdAt: this.now(),
      createdBy: this.actorId,
    };
    const tx = this.db.transaction(() => {
      if (existing) {
        this.db.prepare('UPDATE links SET deleted=0 WHERE id=?').run(link.id);
        this.localSet('link', link.id, { deleted: 0 });
      } else {
        this.db
          .prepare('INSERT INTO links(id, from_id, to_id, kind, deleted, created_at, created_by) VALUES(?,?,?,?,0,?,?)')
          .run(link.id, fromId, toId, kind, link.createdAt, link.createdBy);
        this.localCreate('link', link.id, { ...link });
      }
      this.logActivity(fromId, 'link', kind, null, toId);
    });
    tx();
    this.events.onChange({ entity: 'link', entityId: link.id });
    return link;
  }

  removeLink(id: string): void {
    const row = this.db.prepare('SELECT from_id, kind, to_id FROM links WHERE id=?').get(id) as
      | { from_id: string; kind: string; to_id: string }
      | undefined;
    const tx = this.db.transaction(() => {
      this.db.prepare('UPDATE links SET deleted=1 WHERE id=?').run(id);
      this.localSet('link', id, { deleted: 1 });
      if (row) this.logActivity(row.from_id, 'unlink', row.kind, row.to_id, null);
    });
    tx();
    this.events.onChange({ entity: 'link', entityId: id });
  }

  linksFor(itemId: string): { link: ItemLink; direction: 'out' | 'in'; other: WorkItem }[] {
    const rows = this.db
      .prepare('SELECT * FROM links WHERE (from_id=? OR to_id=?) AND deleted=0')
      .all(itemId, itemId) as Record<string, unknown>[];
    const out: { link: ItemLink; direction: 'out' | 'in'; other: WorkItem }[] = [];
    for (const r of rows) {
      const link = rowToLink(r);
      const direction = link.fromId === itemId ? 'out' : 'in';
      const other = this.getItem(direction === 'out' ? link.toId : link.fromId);
      if (other) out.push({ link, direction, other });
    }
    return out;
  }

  // ---------- comments ----------
  addComment(itemId: string, body: string, bodyText: string): Comment {
    const c: Comment = {
      id: crypto.randomUUID(),
      itemId,
      authorId: this.actorId,
      body,
      bodyText,
      createdAt: this.now(),
      updatedAt: null,
      deleted: 0,
    };
    const tx = this.db.transaction(() => {
      this.db
        .prepare('INSERT INTO comments(id, item_id, author_id, body, body_text, created_at, updated_at, deleted) VALUES(?,?,?,?,?,?,?,0)')
        .run(c.id, c.itemId, c.authorId, c.body, c.bodyText, c.createdAt, c.updatedAt);
      this.localCreate('comment', c.id, { ...c });
      this.logActivity(itemId, 'comment', null, null, bodyText.slice(0, 200));
    });
    tx();
    this.events.onChange({ entity: 'comment', entityId: c.id });
    return c;
  }

  updateComment(id: string, body: string, bodyText: string): void {
    const row = this.db.prepare('SELECT item_id FROM comments WHERE id=?').get(id) as { item_id: string } | undefined;
    const fields = { body, bodyText, updatedAt: this.now(), updatedBy: this.actorId };
    const tx = this.db.transaction(() => {
      this.db.prepare('UPDATE comments SET body=?, body_text=?, updated_at=?, updated_by=? WHERE id=?')
        .run(body, bodyText, fields.updatedAt, fields.updatedBy, id);
      this.localSet('comment', id, fields);
      if (row) this.logActivity(row.item_id, 'comment_edited', null, null, bodyText.slice(0, 200));
    });
    tx();
    this.events.onChange({ entity: 'comment', entityId: id });
  }

  deleteComment(id: string): void {
    const row = this.db.prepare('SELECT item_id, body_text FROM comments WHERE id=?').get(id) as
      | { item_id: string; body_text: string }
      | undefined;
    const stamp = this.now();
    const tx = this.db.transaction(() => {
      this.db.prepare('UPDATE comments SET deleted=1, deleted_at=?, deleted_by=? WHERE id=?').run(stamp, this.actorId, id);
      this.localSet('comment', id, { deleted: 1, deletedAt: stamp, deletedBy: this.actorId });
      if (row) this.logActivity(row.item_id, 'comment_deleted', null, row.body_text.slice(0, 200), null);
    });
    tx();
    this.events.onChange({ entity: 'comment', entityId: id });
  }

  commentsFor(itemId: string): Comment[] {
    const rows = this.db
      .prepare('SELECT * FROM comments WHERE item_id=? AND deleted=0 ORDER BY created_at ASC')
      .all(itemId) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id),
      itemId: String(r.item_id),
      authorId: String(r.author_id),
      body: String(r.body),
      bodyText: String(r.body_text),
      createdAt: String(r.created_at),
      updatedAt: r.updated_at ? String(r.updated_at) : null,
      deleted: 0,
    }));
  }

  // ---------- versions ----------
  saveVersion(itemId: string): void {
    const item = this.getItem(itemId);
    if (!item) return;
    const last = this.db.prepare('SELECT MAX(version) AS v FROM item_versions WHERE item_id=?').get(itemId) as { v: number | null };
    this.db
      .prepare('INSERT INTO item_versions(id, item_id, version, title, body, saved_by, saved_at) VALUES(?,?,?,?,?,?,?)')
      .run(crypto.randomUUID(), itemId, (last.v ?? 0) + 1, item.title, item.body, this.actorId, this.now());
  }

  versionsFor(itemId: string) {
    return this.db
      .prepare('SELECT id, item_id AS itemId, version, title, body, saved_by AS savedBy, saved_at AS savedAt FROM item_versions WHERE item_id=? ORDER BY version DESC')
      .all(itemId);
  }

  // ---------- users ----------
  upsertUser(u: { id: string; name: string; initials: string; color: string }): User {
    const existing = this.db.prepare('SELECT * FROM users WHERE id=?').get(u.id) as Record<string, unknown> | undefined;
    const user: User = {
      ...u,
      createdAt: existing ? String(existing.created_at) : this.now(),
    };
    const tx = this.db.transaction(() => {
      // Re-adding a removed member (same id) revives the row rather than failing on the
      // primary key — the tombstone is lifted and that lift syncs like any other set.
      this.db
        .prepare(
          `INSERT INTO users(id, name, initials, color, created_at, deleted) VALUES(?,?,?,?,?,0)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, initials=excluded.initials, color=excluded.color, deleted=0`,
        )
        .run(user.id, user.name, user.initials, user.color, user.createdAt);
      if (!existing) this.localCreate('user', user.id, { ...user });
      else {
        const fields: Record<string, unknown> = { name: user.name, initials: user.initials, color: user.color };
        if (Number(existing.deleted) === 1) fields.deleted = 0;
        this.localSet('user', user.id, fields);
      }
    });
    tx();
    this.events.onChange({ entity: 'user', entityId: user.id });
    return user;
  }

  listUsers(): User[] {
    return (this.db.prepare('SELECT id, name, initials, color, avatar, created_at AS createdAt FROM users WHERE deleted=0').all() as User[]);
  }

  /** Remove a member for everyone. Soft delete (tombstone) so records they own or
      authored keep resolving; emits a synced 'delete' op. Returns false if unknown. */
  deleteUser(id: string): boolean {
    const exists = this.db.prepare('SELECT 1 FROM users WHERE id=? AND deleted=0').get(id);
    if (!exists) return false;
    const tx = this.db.transaction(() => {
      this.db.prepare('UPDATE users SET deleted=1 WHERE id=?').run(id);
      this.localOp('user', id, 'delete', {});
    });
    tx();
    this.events.onChange({ entity: 'user', entityId: id });
    return true;
  }

  /** Set (or clear, with null) a user's avatar image. Emits a synced 'set' op. */
  setUserAvatar(id: string, avatar: string | null): User | null {
    const exists = this.db.prepare('SELECT 1 FROM users WHERE id=?').get(id);
    if (!exists) return null;
    const tx = this.db.transaction(() => {
      this.db.prepare('UPDATE users SET avatar=? WHERE id=?').run(avatar, id);
      this.localSet('user', id, { avatar });
    });
    tx();
    this.events.onChange({ entity: 'user', entityId: id });
    return this.db
      .prepare('SELECT id, name, initials, color, avatar, created_at AS createdAt FROM users WHERE id=?')
      .get(id) as User;
  }

  // ---------- milestones / releases ----------
  upsertMilestone(m: Partial<Milestone> & { name: string }): Milestone {
    const id = m.id ?? crypto.randomUUID();
    const existing = this.db.prepare('SELECT * FROM milestones WHERE id=?').get(id) as Record<string, unknown> | undefined;
    const now = this.now();
    const createdAt = existing ? String(existing.created_at || now) : now;
    const createdBy = existing ? String(existing.created_by || this.actorId) : this.actorId;
    const rec: Milestone = {
      id,
      name: m.name,
      description: m.description ?? (existing ? String(existing.description) : ''),
      targetDate: m.targetDate ?? (existing ? (existing.target_date as string | null) : null),
      status: (m.status ?? (existing ? existing.status : 'planned')) as Milestone['status'],
      sort: m.sort ?? (existing ? Number(existing.sort) : 0),
      sample: m.sample ?? (existing ? (Number(existing.sample) as 0 | 1) : 0),
      createdAt, createdBy, updatedAt: now, updatedBy: this.actorId,
    };
    const tx = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO milestones(id, name, description, target_date, status, sort, sample, deleted, created_at, created_by, updated_at, updated_by)
             VALUES(?,?,?,?,?,?,?,0,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET name=?, description=?, target_date=?, status=?, sort=?, deleted=0, updated_at=?, updated_by=?`,
        )
        .run(rec.id, rec.name, rec.description, rec.targetDate, rec.status, rec.sort, rec.sample, createdAt, createdBy, now, this.actorId,
             rec.name, rec.description, rec.targetDate, rec.status, rec.sort, now, this.actorId);
      if (!existing) {
        this.localCreate('milestone', id, { ...rec });
        this.logActivity(null, 'milestone_created', 'milestone', null, rec.name);
      } else {
        this.localSet('milestone', id, { name: rec.name, description: rec.description, targetDate: rec.targetDate, status: rec.status, sort: rec.sort, updatedAt: now, updatedBy: this.actorId });
        this.logActivity(null, 'milestone_updated', 'milestone', String(existing.name), rec.name);
      }
    });
    tx();
    this.events.onChange({ entity: 'milestone', entityId: id });
    return rec;
  }

  listMilestones(): Milestone[] {
    const rows = this.db.prepare('SELECT * FROM milestones WHERE deleted=0 ORDER BY sort, target_date').all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id), name: String(r.name), description: String(r.description),
      targetDate: r.target_date ? String(r.target_date) : null,
      status: r.status as Milestone['status'], sort: Number(r.sort), sample: Number(r.sample) as 0 | 1,
      createdAt: r.created_at ? String(r.created_at) : '', createdBy: r.created_by ? String(r.created_by) : '',
      updatedAt: r.updated_at ? String(r.updated_at) : '', updatedBy: r.updated_by ? String(r.updated_by) : '',
    }));
  }

  upsertRelease(m: Partial<Release> & { name: string }): Release {
    const id = m.id ?? crypto.randomUUID();
    const existing = this.db.prepare('SELECT * FROM releases WHERE id=?').get(id) as Record<string, unknown> | undefined;
    const now = this.now();
    const createdAt = existing ? String(existing.created_at || now) : now;
    const createdBy = existing ? String(existing.created_by || this.actorId) : this.actorId;
    const rec: Release = {
      id,
      name: m.name,
      version: m.version ?? (existing ? String(existing.version) : ''),
      targetDate: m.targetDate ?? (existing ? (existing.target_date as string | null) : null),
      status: (m.status ?? (existing ? existing.status : 'planned')) as Release['status'],
      goals: m.goals ?? (existing ? String(existing.goals) : ''),
      notes: m.notes ?? (existing ? String(existing.notes) : ''),
      sample: m.sample ?? (existing ? (Number(existing.sample) as 0 | 1) : 0),
      createdAt, createdBy, updatedAt: now, updatedBy: this.actorId,
    };
    const tx = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO releases(id, name, version, target_date, status, goals, notes, sample, deleted, created_at, created_by, updated_at, updated_by)
             VALUES(?,?,?,?,?,?,?,?,0,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET name=?, version=?, target_date=?, status=?, goals=?, notes=?, deleted=0, updated_at=?, updated_by=?`,
        )
        .run(rec.id, rec.name, rec.version, rec.targetDate, rec.status, rec.goals, rec.notes, rec.sample, createdAt, createdBy, now, this.actorId,
             rec.name, rec.version, rec.targetDate, rec.status, rec.goals, rec.notes, now, this.actorId);
      if (!existing) {
        this.localCreate('release', id, { ...rec });
        this.logActivity(null, 'release_created', 'release', null, rec.name);
      } else {
        this.localSet('release', id, { name: rec.name, version: rec.version, targetDate: rec.targetDate, status: rec.status, goals: rec.goals, notes: rec.notes, updatedAt: now, updatedBy: this.actorId });
        this.logActivity(null, 'release_updated', 'release', String(existing.name), rec.name);
      }
    });
    tx();
    this.events.onChange({ entity: 'release', entityId: id });
    return rec;
  }

  listReleases(): Release[] {
    const rows = this.db.prepare('SELECT * FROM releases WHERE deleted=0 ORDER BY target_date').all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id), name: String(r.name), version: String(r.version),
      targetDate: r.target_date ? String(r.target_date) : null,
      status: r.status as Release['status'], goals: String(r.goals), notes: String(r.notes),
      sample: Number(r.sample) as 0 | 1,
      createdAt: r.created_at ? String(r.created_at) : '', createdBy: r.created_by ? String(r.created_by) : '',
      updatedAt: r.updated_at ? String(r.updated_at) : '', updatedBy: r.updated_by ? String(r.updated_by) : '',
    }));
  }

  // ---------- saved views ----------
  saveView(v: Partial<SavedView> & { name: string; config: Record<string, unknown> }): SavedView {
    const id = v.id ?? crypto.randomUUID();
    const rec: SavedView = {
      id, name: v.name, config: v.config, pinned: v.pinned ?? 0,
      createdBy: this.actorId, createdAt: this.now(),
    };
    const existing = this.db.prepare('SELECT 1 FROM saved_views WHERE id=?').get(id);
    const tx = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO saved_views(id, name, config, pinned, created_by, created_at, deleted) VALUES(?,?,?,?,?,?,0)
           ON CONFLICT(id) DO UPDATE SET name=?, config=?, pinned=?, deleted=0`,
        )
        .run(id, rec.name, JSON.stringify(rec.config), rec.pinned, rec.createdBy, rec.createdAt,
             rec.name, JSON.stringify(rec.config), rec.pinned);
      if (!existing) this.localCreate('saved_view', id, { ...rec });
      else this.localSet('saved_view', id, { name: rec.name, config: rec.config, pinned: rec.pinned });
    });
    tx();
    return rec;
  }

  listViews(): SavedView[] {
    const rows = this.db.prepare('SELECT * FROM saved_views WHERE deleted=0 ORDER BY pinned DESC, name').all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id), name: String(r.name),
      config: JSON.parse(String(r.config)) as Record<string, unknown>,
      pinned: Number(r.pinned) as 0 | 1, createdBy: String(r.created_by), createdAt: String(r.created_at),
    }));
  }

  deleteView(id: string): void {
    const row = this.db.prepare('SELECT name FROM saved_views WHERE id=?').get(id) as { name: string } | undefined;
    const stamp = this.now();
    const tx = this.db.transaction(() => {
      this.db.prepare('UPDATE saved_views SET deleted=1, deleted_at=?, deleted_by=? WHERE id=?').run(stamp, this.actorId, id);
      this.localSet('saved_view', id, { deleted: 1, deletedAt: stamp, deletedBy: this.actorId });
      this.logActivity(null, 'view_deleted', 'saved_view', row ? row.name : null, null);
    });
    tx();
  }

  // ---------- activity ----------
  activityFor(itemId: string | null, limit = 100) {
    if (itemId) {
      return this.db
        .prepare('SELECT id, item_id AS itemId, actor_id AS actorId, kind, field, old_value AS oldValue, new_value AS newValue, at FROM activity WHERE item_id=? ORDER BY at DESC LIMIT ?')
        .all(itemId, limit);
    }
    return this.db
      .prepare('SELECT id, item_id AS itemId, actor_id AS actorId, kind, field, old_value AS oldValue, new_value AS newValue, at FROM activity ORDER BY at DESC LIMIT ?')
      .all(limit);
  }

  // ---------- remote op application ----------
  /** Apply a batch of remote ops inside one transaction. Returns count applied (non-duplicate). */
  applyRemoteOps(ops: Op[]): number {
    let applied = 0;
    const tx = this.db.transaction(() => {
      for (const op of ops) {
        if (op.deviceId === this.deviceId) continue; // our own ops echoed back
        const dup = this.db.prepare('SELECT 1 FROM oplog WHERE op_id=?').get(op.opId);
        if (dup) continue;
        this.witnessLamport(op.lamport);
        this.appendOp(op);
        try {
          this.applyRemoteOp(op);
        } catch (err) {
          // Quarantine a poison op instead of wedging the whole import: it is already
          // recorded in the oplog (so it won't retry forever) and logged for diagnosis.
          console.error(`[sync] failed to apply op ${op.opId} (${op.entity}/${op.action}):`, err);
        }
        applied++;
      }
    });
    tx();
    if (applied > 0) this.events.onChange({ entity: '*', entityId: '*' });
    return applied;
  }

  private applyRemoteOp(op: Op): void {
    switch (op.action) {
      case 'create':
        this.applyRemoteCreate(op);
        break;
      case 'set':
        this.applyRemoteSet(op);
        break;
      case 'delete':
        this.applyRemoteDelete(op);
        break;
    }
  }

  private tableFor(entity: Op['entity']): string {
    switch (entity) {
      case 'item': return 'items';
      case 'link': return 'links';
      case 'comment': return 'comments';
      case 'milestone': return 'milestones';
      case 'release': return 'releases';
      case 'user': return 'users';
      case 'saved_view': return 'saved_views';
      case 'attachment': return 'attachments';
      default: throw new Error(`unknown entity ${entity}`);
    }
  }

  private applyRemoteCreate(op: Op): void {
    const record = op.payload.record as Record<string, unknown>;
    if (!record) return;
    const table = this.tableFor(op.entity);
    const exists = this.db.prepare(`SELECT 1 FROM ${table} WHERE id=?`).get(op.entityId);
    if (exists) return; // create is idempotent per uuid

    if (op.entity === 'item') {
      let item = { ...(record as unknown as WorkItem) };
      // Ident collision: another item (different uuid) already holds this ident.
      // Deterministic rule — the smaller uuid keeps the contested ident — so both
      // devices resolve the same collision identically and converge without ping-pong.
      const holder = this.db.prepare('SELECT id, type FROM items WHERE ident=?').get(item.ident) as
        | { id: string; type: ItemType }
        | undefined;
      if (holder && holder.id !== item.id) {
        if (item.id < holder.id) {
          // Incoming item keeps the ident; renumber the local holder and broadcast.
          const bumped = this.allocIdent(holder.type);
          this.logActivity(holder.id, 'renumbered', 'ident', item.ident, bumped);
          this.applyItemFields(holder.id, { ident: bumped });
          this.localSet('item', holder.id, { ident: bumped });
          this.insertItemRow(item);
        } else {
          const newIdent = this.allocIdent(item.type);
          this.logActivity(item.id, 'renumbered', 'ident', item.ident, newIdent);
          item = { ...item, ident: newIdent };
          this.insertItemRow(item);
          this.localSet('item', item.id, { ident: newIdent });
        }
      } else {
        this.insertItemRow(item);
      }
      this.witnessIdent(item.type, item.ident);
      // Derive the teammate's activity from their op, so their work shows in Activity
      // rather than only their rows appearing with no trace of who made them. The id comes
      // from the op so backfillRemoteActivity() can't re-add what we already derived.
      this.logActivity(item.id, 'created', null, null, item.title, op.actorId, op.at, this.opActivityId(op.opId));
      for (const f of Object.keys(record)) this.setFieldClockIfNewer('item', item.id, f, op.lamport, op.deviceId);
      this.replayPendingOps(op.entity, op.entityId);
      return;
    }

    // Generic insert for other entities.
    const inserters: Record<string, () => void> = {
      link: () => {
        const r = record as unknown as ItemLink & { deleted?: number };
        this.db
          .prepare('INSERT OR IGNORE INTO links(id, from_id, to_id, kind, deleted, created_at, created_by) VALUES(?,?,?,?,?,?,?)')
          .run(r.id, r.fromId, r.toId, r.kind, r.deleted ?? 0, r.createdAt, r.createdBy);
      },
      comment: () => {
        const r = record as unknown as Comment;
        this.db
          .prepare('INSERT OR IGNORE INTO comments(id, item_id, author_id, body, body_text, created_at, updated_at, deleted) VALUES(?,?,?,?,?,?,?,?)')
          .run(r.id, r.itemId, r.authorId, r.body, r.bodyText, r.createdAt, r.updatedAt, r.deleted ?? 0);
        this.logActivity(r.itemId, 'comment', null, null, (r.bodyText ?? '').slice(0, 200), op.actorId, op.at, this.opActivityId(op.opId));
      },
      milestone: () => {
        const r = record as unknown as Milestone;
        this.db
          .prepare('INSERT OR IGNORE INTO milestones(id, name, description, target_date, status, sort, sample, deleted) VALUES(?,?,?,?,?,?,?,0)')
          .run(r.id, r.name, r.description, r.targetDate, r.status, r.sort, r.sample ?? 0);
      },
      release: () => {
        const r = record as unknown as Release;
        this.db
          .prepare('INSERT OR IGNORE INTO releases(id, name, version, target_date, status, goals, notes, sample, deleted) VALUES(?,?,?,?,?,?,?,?,0)')
          .run(r.id, r.name, r.version, r.targetDate, r.status, r.goals, r.notes, r.sample ?? 0);
      },
      user: () => {
        const r = record as unknown as User;
        this.db
          .prepare('INSERT OR IGNORE INTO users(id, name, initials, color, avatar, created_at, deleted) VALUES(?,?,?,?,?,?,?)')
          .run(r.id, r.name, r.initials, r.color, r.avatar ?? null, r.createdAt, (r as User & { deleted?: number }).deleted ?? 0);
      },
      saved_view: () => {
        const r = record as unknown as SavedView;
        this.db
          .prepare('INSERT OR IGNORE INTO saved_views(id, name, config, pinned, created_by, created_at, deleted) VALUES(?,?,?,?,?,?,0)')
          .run(r.id, r.name, JSON.stringify(r.config), r.pinned, r.createdBy, r.createdAt);
      },
      attachment: () => {
        const r = record as unknown as import('../../shared/types').Attachment;
        this.db
          .prepare('INSERT OR IGNORE INTO attachments(id, item_id, filename, mime, size, sha256, description, uploaded_by, created_at, deleted) VALUES(?,?,?,?,?,?,?,?,?,?)')
          .run(r.id, r.itemId, r.filename, r.mime, r.size, r.sha256, r.description, r.uploadedBy, r.createdAt, r.deleted ?? 0);
      },
    };
    inserters[op.entity]?.();
    for (const f of Object.keys(record)) this.setFieldClockIfNewer(op.entity, op.entityId, f, op.lamport, op.deviceId);
    this.replayPendingOps(op.entity, op.entityId);
  }

  /** Set a field clock only if the incoming write is newer — creates must never
      regress clocks stamped by buffered/earlier-arriving sets. */
  private setFieldClockIfNewer(entity: string, entityId: string, field: string, lamport: number, deviceId: string): void {
    const cur = this.fieldClock(entity, entityId, field);
    if (cur && (cur.lamport > lamport || (cur.lamport === lamport && cur.deviceId > deviceId))) return;
    this.setFieldClock(entity, entityId, field, lamport, deviceId);
  }

  /** Buffer an op that arrived before its target's create (3+ device reordering). */
  private bufferPendingOp(op: Op): void {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO pending_ops(op_id, device_id, actor_id, lamport, at, entity, entity_id, action, payload)
         VALUES(?,?,?,?,?,?,?,?,?)`,
      )
      .run(op.opId, op.deviceId, op.actorId, op.lamport, op.at, op.entity, op.entityId, op.action, JSON.stringify(op.payload));
  }

  /** Replay buffered sets/deletes for an entity once its create has landed. */
  private replayPendingOps(entity: Op['entity'], entityId: string): void {
    const rows = this.db
      .prepare('SELECT * FROM pending_ops WHERE entity=? AND entity_id=? ORDER BY lamport, device_id')
      .all(entity, entityId) as Record<string, unknown>[];
    if (rows.length === 0) return;
    this.db.prepare('DELETE FROM pending_ops WHERE entity=? AND entity_id=?').run(entity, entityId);
    for (const r of rows) {
      this.applyRemoteOp({
        opId: String(r.op_id), deviceId: String(r.device_id), actorId: String(r.actor_id),
        lamport: Number(r.lamport), at: String(r.at), entity: r.entity as Op['entity'],
        entityId: String(r.entity_id), action: r.action as Op['action'],
        payload: JSON.parse(String(r.payload)) as Record<string, unknown>,
      });
    }
  }

  private applyRemoteSet(op: Op): void {
    // Target row may not exist yet (ops from a third device can arrive before the
    // originating device's create) — buffer and replay after the create.
    const rowExists = this.db.prepare(`SELECT 1 FROM ${this.tableFor(op.entity)} WHERE id=?`).get(op.entityId);
    if (!rowExists) {
      this.bufferPendingOp(op);
      return;
    }
    const fields = (op.payload.fields ?? {}) as Record<string, unknown>;
    const basedOn = (op.payload.basedOn ?? {}) as Record<string, { lamport: number; deviceId: string } | null>;
    const winning: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(fields)) {
      const local = this.fieldClock(op.entity, op.entityId, field);
      const base = basedOn[field] ?? null;

      let remoteWins: boolean;
      let concurrent = false;
      if (!local) {
        remoteWins = true;
      } else if (base && base.lamport === local.lamport && base.deviceId === local.deviceId) {
        remoteWins = true; // clean causal update: remote saw exactly our current value
      } else {
        concurrent = true;
        remoteWins = op.lamport > local.lamport || (op.lamport === local.lamport && op.deviceId > local.deviceId);
      }

      if (concurrent && CONFLICT_SURFACED_FIELDS.has(field) && op.entity === 'item') {
        const cur = this.db
          .prepare(`SELECT ${ITEM_COLS[field]} AS v FROM items WHERE id=?`)
          .get(op.entityId) as { v: unknown } | undefined;
        const localVal = cur ? String(cur.v ?? '') : '';
        const remoteVal = String(value ?? '');
        if (localVal !== remoteVal) {
          const conflict: SyncConflict = {
            id: crypto.randomUUID(),
            entity: op.entity,
            entityId: op.entityId,
            field,
            localValue: localVal,
            remoteValue: remoteVal,
            remoteDevice: op.deviceId,
            remoteActor: op.actorId,
            detectedAt: this.now(),
            resolvedAt: null,
            resolution: null,
          };
          this.db
            .prepare('INSERT INTO sync_conflicts(id, entity, entity_id, field, local_value, remote_value, remote_device, remote_actor, detected_at) VALUES(?,?,?,?,?,?,?,?,?)')
            .run(conflict.id, conflict.entity, conflict.entityId, conflict.field, conflict.localValue, conflict.remoteValue, conflict.remoteDevice, conflict.remoteActor, conflict.detectedAt);
          this.events.onConflict(conflict);
        }
      }

      if (remoteWins) {
        winning[field] = value;
        this.setFieldClock(op.entity, op.entityId, field, op.lamport, op.deviceId);
      }
    }

    if (Object.keys(winning).length === 0) return;

    if (op.entity === 'item') {
      const before = this.getItem(op.entityId);
      // Ident set may collide locally — resolve with the same smaller-uuid-keeps rule.
      if ('ident' in winning) {
        const holder = this.db.prepare('SELECT id, type FROM items WHERE ident=?').get(String(winning.ident)) as
          | { id: string; type: ItemType }
          | undefined;
        const cur = this.db.prepare('SELECT type FROM items WHERE id=?').get(op.entityId) as { type: ItemType } | undefined;
        if (holder && holder.id !== op.entityId && cur) {
          if (op.entityId < holder.id) {
            const bumped = this.allocIdent(holder.type);
            this.logActivity(holder.id, 'renumbered', 'ident', String(winning.ident), bumped);
            this.applyItemFields(holder.id, { ident: bumped });
            this.localSet('item', holder.id, { ident: bumped });
          } else {
            const bumped = this.allocIdent(cur.type);
            winning.ident = bumped;
            this.localSet('item', op.entityId, { ident: bumped });
          }
        } else if (cur) {
          this.witnessIdent(cur.type, String(winning.ident));
        }
      }
      this.applyItemFields(op.entityId, winning);
      // Mirror updateItem's local logging so a teammate's change reads the same as ours:
      // one entry per field, with body edits collapsed into a single 'edited' entry.
      if (before) {
        const prev = before as unknown as Record<string, unknown>;
        for (const [k, v] of Object.entries(winning)) {
          if (k === 'updatedAt' || k === 'updatedBy' || k === 'body' || k === 'bodyText') continue;
          this.logActivity(
            op.entityId, 'updated', k, prev[k],
            JSON_ITEM_FIELDS.has(k) ? JSON.stringify(v) : v,
            op.actorId, op.at, this.opActivityId(op.opId, k),
          );
        }
        if ('body' in winning || 'bodyText' in winning) {
          const newText = 'bodyText' in winning ? String(winning.bodyText ?? '') : before.bodyText;
          this.logActivity(
            op.entityId, 'edited', 'body', before.bodyText, newText,
            op.actorId, op.at, this.opActivityId(op.opId, 'body'),
          );
        }
      }
      return;
    }

    // Generic column update for other entities.
    const colMap: Record<string, Record<string, string>> = {
      link: { deleted: 'deleted' },
      comment: { body: 'body', bodyText: 'body_text', updatedAt: 'updated_at', deleted: 'deleted' },
      milestone: { name: 'name', description: 'description', targetDate: 'target_date', status: 'status', sort: 'sort', deleted: 'deleted' },
      release: { name: 'name', version: 'version', targetDate: 'target_date', status: 'status', goals: 'goals', notes: 'notes', deleted: 'deleted' },
      user: { name: 'name', initials: 'initials', color: 'color', avatar: 'avatar', deleted: 'deleted' },
      saved_view: { name: 'name', config: 'config', pinned: 'pinned', deleted: 'deleted' },
      attachment: { description: 'description', deleted: 'deleted' },
    };
    const map = colMap[op.entity];
    if (!map) return;
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [k, v] of Object.entries(winning)) {
      const col = map[k];
      if (!col) continue;
      sets.push(`${col}=?`);
      vals.push(k === 'config' ? JSON.stringify(v) : v);
    }
    if (!sets.length) return;
    vals.push(op.entityId);
    this.db.prepare(`UPDATE ${this.tableFor(op.entity)} SET ${sets.join(', ')} WHERE id=?`).run(...vals);
  }

  private applyRemoteDelete(op: Op): void {
    const table = this.tableFor(op.entity);
    const rowExists = this.db.prepare(`SELECT 1 FROM ${table} WHERE id=?`).get(op.entityId);
    if (!rowExists) {
      // Delete arrived before the create (3+ device reordering) — buffer it so the
      // create's replay applies it instead of resurrecting the item.
      this.bufferPendingOp(op);
      return;
    }
    this.db.prepare(`UPDATE ${table} SET deleted=1 WHERE id=?`).run(op.entityId);
    this.setFieldClock(op.entity, op.entityId, 'deleted', op.lamport, op.deviceId);
    if (op.entity === 'item') {
      this.logActivity(op.entityId, 'deleted', null, null, null, op.actorId, op.at, this.opActivityId(op.opId));
    }
  }

  // ---------- conflicts ----------
  listConflicts(openOnly = true): SyncConflict[] {
    const rows = this.db
      .prepare(`SELECT * FROM sync_conflicts ${openOnly ? 'WHERE resolved_at IS NULL' : ''} ORDER BY detected_at DESC`)
      .all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id), entity: String(r.entity), entityId: String(r.entity_id), field: String(r.field),
      localValue: String(r.local_value), remoteValue: String(r.remote_value),
      remoteDevice: String(r.remote_device), remoteActor: String(r.remote_actor),
      detectedAt: String(r.detected_at),
      resolvedAt: r.resolved_at ? String(r.resolved_at) : null,
      resolution: (r.resolution as SyncConflict['resolution']) ?? null,
    }));
  }

  resolveConflict(id: string, resolution: 'local' | 'remote' | 'merged', mergedValue?: string): void {
    const row = this.db.prepare('SELECT * FROM sync_conflicts WHERE id=?').get(id) as Record<string, unknown> | undefined;
    if (!row) return;
    const tx = this.db.transaction(() => {
      const value =
        resolution === 'merged' ? (mergedValue ?? '') : resolution === 'local' ? String(row.local_value) : String(row.remote_value);
      if (String(row.entity) === 'item') {
        const field = String(row.field);
        const stamp = this.now();
        const fields: Record<string, unknown> = { [field]: value, updatedAt: stamp, updatedBy: this.actorId };
        // Resolving a body conflict must also refresh the search-text projection.
        if (field === 'body') fields.bodyText = docToText(value);
        this.applyItemFields(String(row.entity_id), fields);
        this.localSet('item', String(row.entity_id), fields);
      }
      this.db.prepare('UPDATE sync_conflicts SET resolved_at=?, resolution=?, resolved_by=? WHERE id=?').run(this.now(), resolution, this.actorId, id);
    });
    tx();
    this.events.onChange({ entity: String(row.entity), entityId: String(row.entity_id) });
  }

  // ---------- sync export helpers ----------
  opsSince(seq: number, ownOnly = true): { seq: number; op: Op }[] {
    const rows = this.db
      .prepare(
        `SELECT seq, op_id, device_id, actor_id, lamport, at, entity, entity_id, action, payload
         FROM oplog WHERE seq > ? ${ownOnly ? 'AND device_id = ?' : ''} ORDER BY seq ASC`,
      )
      .all(...(ownOnly ? [seq, this.deviceId] : [seq])) as Record<string, unknown>[];
    return rows.map((r) => ({
      seq: Number(r.seq),
      op: {
        opId: String(r.op_id), deviceId: String(r.device_id), actorId: String(r.actor_id),
        lamport: Number(r.lamport), at: String(r.at), entity: r.entity as Op['entity'],
        entityId: String(r.entity_id), action: r.action as Op['action'],
        payload: JSON.parse(String(r.payload)) as Record<string, unknown>,
      },
    }));
  }

  // ---------- sample data ----------
  removeSampleData(): number {
    const tx = this.db.transaction(() => {
      const ids = (this.db.prepare('SELECT id FROM items WHERE sample=1 AND deleted=0').all() as { id: string }[]).map((r) => r.id);
      for (const id of ids) this.deleteItem(id);
      for (const m of this.db.prepare('SELECT id FROM milestones WHERE sample=1 AND deleted=0').all() as { id: string }[]) {
        this.db.prepare('UPDATE milestones SET deleted=1 WHERE id=?').run(m.id);
        this.localSet('milestone', m.id, { deleted: 1 });
      }
      for (const rel of this.db.prepare('SELECT id FROM releases WHERE sample=1 AND deleted=0').all() as { id: string }[]) {
        this.db.prepare('UPDATE releases SET deleted=1 WHERE id=?').run(rel.id);
        this.localSet('release', rel.id, { deleted: 1 });
      }
      return ids.length;
    });
    const n = tx();
    this.events.onChange({ entity: '*', entityId: '*' });
    return n;
  }
}

// ---------- row mappers ----------
export function rowToItem(r: Record<string, unknown>): WorkItem {
  return {
    id: String(r.id),
    ident: String(r.ident),
    type: r.type as ItemType,
    title: String(r.title),
    body: String(r.body),
    bodyText: String(r.body_text),
    status: String(r.status),
    priority: r.priority as WorkItem['priority'],
    ownerId: (r.owner_id as string | null) ?? null,
    reporterId: (r.reporter_id as string | null) ?? null,
    milestoneId: (r.milestone_id as string | null) ?? null,
    releaseId: (r.release_id as string | null) ?? null,
    parentId: (r.parent_id as string | null) ?? null,
    startDate: (r.start_date as string | null) ?? null,
    dueDate: (r.due_date as string | null) ?? null,
    completedAt: (r.completed_at as string | null) ?? null,
    effort: r.effort == null ? null : Number(r.effort),
    confidence: (r.confidence as WorkItem['confidence']) ?? null,
    riskLevel: (r.risk_level as WorkItem['riskLevel']) ?? null,
    businessValue: (r.business_value as string | null) ?? null,
    leadershipVisible: Number(r.leadership_visible) as 0 | 1,
    progress: r.progress == null ? null : Number(r.progress),
    tags: safeParse(String(r.tags), []) as string[],
    extra: safeParse(String(r.extra), {}) as Record<string, unknown>,
    archived: Number(r.archived) as 0 | 1,
    sample: Number(r.sample) as 0 | 1,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    createdBy: String(r.created_by),
    updatedBy: String(r.updated_by),
  };
}

function rowToLink(r: Record<string, unknown>): ItemLink {
  return {
    id: String(r.id),
    fromId: String(r.from_id),
    toId: String(r.to_id),
    kind: r.kind as LinkKind,
    createdAt: String(r.created_at),
    createdBy: String(r.created_by),
  };
}

function safeParse(s: string, fallback: unknown): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

/** Convert free text to a safe FTS5 prefix query. */
export function ftsQuery(text: string): string {
  const terms = text
    .replace(/['"*()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t}"*`);
  return terms.join(' ') || '""';
}
