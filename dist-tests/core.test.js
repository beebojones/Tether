"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/core.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));
var import_node_fs3 = __toESM(require("node:fs"));
var import_node_path3 = __toESM(require("node:path"));
var import_node_os = __toESM(require("node:os"));

// electron/db/db.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var import_node_path = __toESM(require("node:path"));
var import_node_fs = __toESM(require("node:fs"));
var import_node_crypto = __toESM(require("node:crypto"));

// electron/db/migrations.ts
var MIGRATIONS = [
  {
    version: 1,
    name: "core-schema",
    sql: `
CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE items (
  id TEXT PRIMARY KEY,
  ident TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'none',
  owner_id TEXT,
  reporter_id TEXT,
  milestone_id TEXT,
  release_id TEXT,
  parent_id TEXT,
  start_date TEXT,
  due_date TEXT,
  completed_at TEXT,
  effort REAL,
  confidence TEXT,
  risk_level TEXT,
  business_value TEXT,
  leadership_visible INTEGER NOT NULL DEFAULT 0,
  progress INTEGER,
  tags TEXT NOT NULL DEFAULT '[]',
  extra TEXT NOT NULL DEFAULT '{}',
  archived INTEGER NOT NULL DEFAULT 0,
  sample INTEGER NOT NULL DEFAULT 0,
  deleted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL
);
CREATE INDEX idx_items_type ON items(type) WHERE deleted = 0;
CREATE INDEX idx_items_status ON items(status) WHERE deleted = 0;
CREATE INDEX idx_items_owner ON items(owner_id) WHERE deleted = 0;
CREATE INDEX idx_items_milestone ON items(milestone_id) WHERE deleted = 0;
CREATE INDEX idx_items_release ON items(release_id) WHERE deleted = 0;
CREATE INDEX idx_items_parent ON items(parent_id) WHERE deleted = 0;
CREATE INDEX idx_items_updated ON items(updated_at);

CREATE TABLE ident_counters (
  type TEXT PRIMARY KEY,
  next INTEGER NOT NULL
);

CREATE TABLE links (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);
CREATE INDEX idx_links_from ON links(from_id) WHERE deleted = 0;
CREATE INDEX idx_links_to ON links(to_id) WHERE deleted = 0;
CREATE UNIQUE INDEX idx_links_uniq ON links(from_id, to_id, kind);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  body_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_comments_item ON comments(item_id) WHERE deleted = 0;

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  description TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_attachments_item ON attachments(item_id) WHERE deleted = 0;

CREATE TABLE activity (
  id TEXT PRIMARY KEY,
  item_id TEXT,
  actor_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  at TEXT NOT NULL
);
CREATE INDEX idx_activity_item ON activity(item_id);
CREATE INDEX idx_activity_at ON activity(at);

CREATE TABLE item_versions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  saved_by TEXT NOT NULL,
  saved_at TEXT NOT NULL
);
CREATE INDEX idx_versions_item ON item_versions(item_id, version);

CREATE TABLE milestones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  target_date TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  sort INTEGER NOT NULL DEFAULT 0,
  sample INTEGER NOT NULL DEFAULT 0,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE releases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '',
  target_date TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  goals TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  sample INTEGER NOT NULL DEFAULT 0,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE saved_views (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}',
  pinned INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);

-- Append-only operation log. Source for sync export; peers' ops recorded with origin device.
CREATE TABLE oplog (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  op_id TEXT NOT NULL UNIQUE,
  device_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  lamport INTEGER NOT NULL,
  at TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE INDEX idx_oplog_entity ON oplog(entity, entity_id);
CREATE INDEX idx_oplog_device ON oplog(device_id, seq);

-- Field-level write registry for LWW merge: last (lamport, device) that wrote each field.
CREATE TABLE field_clock (
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field TEXT NOT NULL,
  lamport INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  PRIMARY KEY (entity, entity_id, field)
);

CREATE TABLE sync_conflicts (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field TEXT NOT NULL,
  local_value TEXT NOT NULL,
  remote_value TEXT NOT NULL,
  remote_device TEXT NOT NULL,
  remote_actor TEXT NOT NULL,
  detected_at TEXT NOT NULL,
  resolved_at TEXT,
  resolution TEXT
);

-- Per-peer import progress: highest file sequence consumed per device.
CREATE TABLE sync_peers (
  device_id TEXT PRIMARY KEY,
  user_name TEXT,
  last_file TEXT,
  last_seen_at TEXT
);

CREATE VIRTUAL TABLE items_fts USING fts5(
  ident, title, body_text, tags,
  content='items', content_rowid='rowid',
  tokenize='unicode61'
);

CREATE TRIGGER items_fts_ai AFTER INSERT ON items BEGIN
  INSERT INTO items_fts(rowid, ident, title, body_text, tags)
  VALUES (new.rowid, new.ident, new.title, new.body_text, new.tags);
END;
CREATE TRIGGER items_fts_ad AFTER DELETE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, ident, title, body_text, tags)
  VALUES ('delete', old.rowid, old.ident, old.title, old.body_text, old.tags);
END;
CREATE TRIGGER items_fts_au AFTER UPDATE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, ident, title, body_text, tags)
  VALUES ('delete', old.rowid, old.ident, old.title, old.body_text, old.tags);
  INSERT INTO items_fts(rowid, ident, title, body_text, tags)
  VALUES (new.rowid, new.ident, new.title, new.body_text, new.tags);
END;
`
  },
  {
    version: 2,
    name: "pending-ops-buffer",
    sql: `
-- Ops that arrived before the create of their target entity (possible with 3+
-- devices, since ordering is only guaranteed per device). Buffered here and
-- replayed once the create lands.
CREATE TABLE pending_ops (
  op_id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  lamport INTEGER NOT NULL,
  at TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE INDEX idx_pending_entity ON pending_ops(entity, entity_id);
`
  },
  {
    version: 3,
    name: "full-auditability",
    sql: `
-- Every user-data table gets created/updated attribution and soft-delete
-- attribution so "who created/changed/deleted this, and when" is always answerable
-- from the schema, not just the op log.

-- Milestones + releases had no audit columns at all.
ALTER TABLE milestones ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
ALTER TABLE milestones ADD COLUMN created_by TEXT NOT NULL DEFAULT '';
ALTER TABLE milestones ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
ALTER TABLE milestones ADD COLUMN updated_by TEXT NOT NULL DEFAULT '';
ALTER TABLE releases ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
ALTER TABLE releases ADD COLUMN created_by TEXT NOT NULL DEFAULT '';
ALTER TABLE releases ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
ALTER TABLE releases ADD COLUMN updated_by TEXT NOT NULL DEFAULT '';

-- Comment edits/deletes were unattributed.
ALTER TABLE comments ADD COLUMN updated_by TEXT;
ALTER TABLE comments ADD COLUMN deleted_at TEXT;
ALTER TABLE comments ADD COLUMN deleted_by TEXT;

-- Attachment removal was unattributed.
ALTER TABLE attachments ADD COLUMN deleted_at TEXT;
ALTER TABLE attachments ADD COLUMN deleted_by TEXT;

-- Link removal attribution on the row (not only in the activity feed).
ALTER TABLE links ADD COLUMN deleted_at TEXT;
ALTER TABLE links ADD COLUMN deleted_by TEXT;

-- Saved view / item delete attribution on the row.
ALTER TABLE saved_views ADD COLUMN updated_at TEXT;
ALTER TABLE saved_views ADD COLUMN updated_by TEXT;
ALTER TABLE saved_views ADD COLUMN deleted_at TEXT;
ALTER TABLE saved_views ADD COLUMN deleted_by TEXT;
ALTER TABLE items ADD COLUMN deleted_at TEXT;
ALTER TABLE items ADD COLUMN deleted_by TEXT;

-- Who resolved a sync conflict.
ALTER TABLE sync_conflicts ADD COLUMN resolved_by TEXT;

-- Backfill existing milestone/release rows so audit timestamps are never blank.
UPDATE milestones SET created_at = datetime('now'), updated_at = datetime('now') WHERE created_at = '';
UPDATE releases SET created_at = datetime('now'), updated_at = datetime('now') WHERE created_at = '';
`
  },
  {
    version: 4,
    name: "user-avatar",
    sql: `ALTER TABLE users ADD COLUMN avatar TEXT;`
  },
  {
    version: 5,
    name: "user-soft-delete",
    // Members are removed the same way everything else is: a tombstone that syncs.
    // Items and comments keep referencing the id, so history still renders.
    sql: `ALTER TABLE users ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0;`
  }
];

// electron/db/db.ts
function openDatabase(dataDir) {
  import_node_fs.default.mkdirSync(dataDir, { recursive: true });
  const dbPath = import_node_path.default.join(dataDir, "tether.db");
  applyPendingRestore(dataDir, dbPath);
  const existed = import_node_fs.default.existsSync(dbPath);
  const db = new import_better_sqlite3.default(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("synchronous = NORMAL");
  if (existed) {
    const check = db.pragma("quick_check", { simple: true });
    if (check !== "ok") {
      const quarantine = dbPath + ".corrupt-" + Date.now();
      db.close();
      import_node_fs.default.copyFileSync(dbPath, quarantine);
      throw new Error(
        `Database failed integrity check (${check}). Damaged copy preserved at ${quarantine}. Restore from a backup in the backups/ folder.`
      );
    }
  }
  applyMigrations(db, dataDir, dbPath, existed);
  const deviceId = ensureMeta(db, "device_id", () => import_node_crypto.default.randomUUID());
  ensureMeta(db, "project_id", () => import_node_crypto.default.randomUUID());
  return { db, deviceId, dataDir, dbPath };
}
function applyMigrations(db, dataDir, dbPath, existed) {
  const hasMeta = db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name='meta'").get();
  let version = 0;
  if (hasMeta.c > 0) {
    const row = db.prepare("SELECT value FROM meta WHERE key='schema_version'").get();
    version = row ? Number(row.value) : 0;
  }
  const pending = MIGRATIONS.filter((m) => m.version > version);
  if (pending.length === 0) return;
  if (existed && version > 0) {
    const backupDir = import_node_path.default.join(dataDir, "backups");
    import_node_fs.default.mkdirSync(backupDir, { recursive: true });
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    import_node_fs.default.copyFileSync(dbPath, import_node_path.default.join(backupDir, `pre-migration-v${version}-${stamp}.db`));
  }
  const run = db.transaction(() => {
    for (const m of pending) {
      db.exec(m.sql);
      db.prepare(
        "INSERT INTO meta(key,value) VALUES('schema_version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
      ).run(String(m.version));
    }
  });
  run();
}
function ensureMeta(db, key, make) {
  const row = db.prepare("SELECT value FROM meta WHERE key=?").get(key);
  if (row) return row.value;
  const value = make();
  db.prepare("INSERT INTO meta(key,value) VALUES(?,?)").run(key, value);
  return value;
}
function getMeta(db, key) {
  const row = db.prepare("SELECT value FROM meta WHERE key=?").get(key);
  return row ? row.value : null;
}
function setMeta(db, key, value) {
  db.prepare(
    "INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  ).run(key, value);
}
function applyPendingRestore(dataDir, dbPath) {
  const pending = import_node_path.default.join(dataDir, "restore-pending.db");
  if (!import_node_fs.default.existsSync(pending)) return;
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  if (import_node_fs.default.existsSync(dbPath)) {
    import_node_fs.default.copyFileSync(dbPath, `${dbPath}.pre-restore-${stamp}`);
    for (const suffix of ["-wal", "-shm"]) {
      const f = dbPath + suffix;
      if (import_node_fs.default.existsSync(f)) import_node_fs.default.rmSync(f, { force: true });
    }
  }
  import_node_fs.default.renameSync(pending, dbPath);
  console.log("[tether] applied staged restore from backup");
}

// electron/db/store.ts
var import_node_crypto2 = __toESM(require("node:crypto"));

// shared/types.ts
var IDENT_PREFIX = {
  task: "TASK",
  feature: "FEAT",
  requirement: "REQ",
  story: "STORY",
  decision: "DEC",
  risk: "RISK",
  blocker: "BLK",
  access: "ACC",
  meeting: "MTG",
  idea: "IDEA",
  question: "Q",
  defect: "DEF",
  research: "RES"
};
var WORK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "done",
  "cancelled"
];
var DECISION_STATUSES = [
  "proposed",
  "discussing",
  "approved",
  "rejected",
  "revisit",
  "superseded"
];
var ACCESS_STATUSES = [
  "identified",
  "not_requested",
  "preparing",
  "requested",
  "under_review",
  "info_needed",
  "approved",
  "partially_approved",
  "granted",
  "denied",
  "expired",
  "not_needed"
];
var RISK_STATUSES = ["open", "mitigating", "accepted", "closed"];
var BLOCKER_STATUSES = ["active", "workaround", "resolved"];
var QUESTION_STATUSES = ["open", "answered", "parked"];
var MEETING_STATUSES = ["scheduled", "held", "summarized"];
function statusesForType(type) {
  switch (type) {
    case "decision":
      return DECISION_STATUSES;
    case "access":
      return ACCESS_STATUSES;
    case "risk":
      return RISK_STATUSES;
    case "blocker":
      return BLOCKER_STATUSES;
    case "question":
      return QUESTION_STATUSES;
    case "meeting":
      return MEETING_STATUSES;
    default:
      return WORK_STATUSES;
  }
}
var TERMINAL_STATUSES = /* @__PURE__ */ new Set([
  "done",
  "cancelled",
  "rejected",
  "superseded",
  "granted",
  "denied",
  "expired",
  "not_needed",
  "closed",
  "resolved",
  "answered",
  "summarized",
  "accepted"
]);

// shared/doc.ts
function docToText(body) {
  if (!body) return "";
  try {
    const doc = JSON.parse(body);
    const walk = (nodes) => nodes.map((n) => {
      const node = n;
      if (node.text) return node.text;
      const inner = node.content ? walk(node.content) : "";
      return node.type === "paragraph" || node.type?.startsWith("heading") ? inner + "\n" : inner;
    }).join("");
    return walk(doc.content ?? []).trim();
  } catch {
    return body;
  }
}

// electron/db/store.ts
var CONFLICT_SURFACED_FIELDS = /* @__PURE__ */ new Set(["title", "body"]);
var ITEM_COLS = {
  ident: "ident",
  type: "type",
  title: "title",
  body: "body",
  bodyText: "body_text",
  status: "status",
  priority: "priority",
  ownerId: "owner_id",
  reporterId: "reporter_id",
  milestoneId: "milestone_id",
  releaseId: "release_id",
  parentId: "parent_id",
  startDate: "start_date",
  dueDate: "due_date",
  completedAt: "completed_at",
  effort: "effort",
  confidence: "confidence",
  riskLevel: "risk_level",
  businessValue: "business_value",
  leadershipVisible: "leadership_visible",
  progress: "progress",
  tags: "tags",
  extra: "extra",
  archived: "archived",
  sample: "sample",
  deleted: "deleted",
  updatedAt: "updated_at",
  updatedBy: "updated_by"
};
var JSON_ITEM_FIELDS = /* @__PURE__ */ new Set(["tags", "extra"]);
var Store = class {
  db;
  deviceId;
  actorId;
  events;
  constructor(ctx, actorId, events) {
    this.db = ctx.db;
    this.deviceId = ctx.deviceId;
    this.actorId = actorId;
    this.events = {
      onChange: events?.onChange ?? (() => {
      }),
      onConflict: events?.onConflict ?? (() => {
      })
    };
  }
  // ---------- clocks ----------
  tickLamport() {
    const cur = Number(getMeta(this.db, "lamport") ?? "0") + 1;
    setMeta(this.db, "lamport", String(cur));
    return cur;
  }
  witnessLamport(remote) {
    const cur = Number(getMeta(this.db, "lamport") ?? "0");
    if (remote > cur) setMeta(this.db, "lamport", String(remote));
  }
  now() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  fieldClock(entity, entityId, field) {
    const row = this.db.prepare("SELECT lamport, device_id FROM field_clock WHERE entity=? AND entity_id=? AND field=?").get(entity, entityId, field);
    return row ? { lamport: row.lamport, deviceId: row.device_id } : null;
  }
  setFieldClock(entity, entityId, field, lamport, deviceId) {
    this.db.prepare(
      `INSERT INTO field_clock(entity, entity_id, field, lamport, device_id) VALUES(?,?,?,?,?)
         ON CONFLICT(entity, entity_id, field) DO UPDATE SET lamport=excluded.lamport, device_id=excluded.device_id`
    ).run(entity, entityId, field, lamport, deviceId);
  }
  // ---------- oplog ----------
  appendOp(op) {
    this.db.prepare(
      `INSERT INTO oplog(op_id, device_id, actor_id, lamport, at, entity, entity_id, action, payload)
         VALUES(?,?,?,?,?,?,?,?,?)`
    ).run(op.opId, op.deviceId, op.actorId, op.lamport, op.at, op.entity, op.entityId, op.action, JSON.stringify(op.payload));
  }
  localOp(entity, entityId, action, payload) {
    const lamport = this.tickLamport();
    const op = {
      opId: import_node_crypto2.default.randomUUID(),
      deviceId: this.deviceId,
      actorId: this.actorId,
      lamport,
      at: this.now(),
      entity,
      entityId,
      action,
      payload
    };
    this.appendOp(op);
    return op;
  }
  /** Local 'set': records basedOn clocks then advances them. */
  localSet(entity, entityId, fields) {
    const basedOn = {};
    for (const f of Object.keys(fields)) basedOn[f] = this.fieldClock(entity, entityId, f);
    const op = this.localOp(entity, entityId, "set", { fields, basedOn });
    for (const f of Object.keys(fields)) this.setFieldClock(entity, entityId, f, op.lamport, this.deviceId);
  }
  localCreate(entity, entityId, record) {
    const op = this.localOp(entity, entityId, "create", { record });
    for (const f of Object.keys(record)) this.setFieldClock(entity, entityId, f, op.lamport, this.deviceId);
  }
  // ---------- ident allocation ----------
  allocIdent(type) {
    const prefix = IDENT_PREFIX[type];
    const row = this.db.prepare("SELECT next FROM ident_counters WHERE type=?").get(type);
    let n = row ? row.next : 1;
    while (this.db.prepare("SELECT 1 FROM items WHERE ident=?").get(`${prefix}-${n}`)) n++;
    this.db.prepare("INSERT INTO ident_counters(type,next) VALUES(?,?) ON CONFLICT(type) DO UPDATE SET next=?").run(type, n + 1, n + 1);
    return `${prefix}-${n}`;
  }
  /** Advance the local counter past an ident observed from a peer. */
  witnessIdent(type, ident) {
    const m = /-(\d+)$/.exec(ident);
    if (!m) return;
    const n = Number(m[1]);
    const row = this.db.prepare("SELECT next FROM ident_counters WHERE type=?").get(type);
    if (!row || row.next <= n) {
      this.db.prepare("INSERT INTO ident_counters(type,next) VALUES(?,?) ON CONFLICT(type) DO UPDATE SET next=?").run(type, n + 1, n + 1);
    }
  }
  // ---------- activity ----------
  /** Public activity hook for collaborators outside Store (e.g. AttachmentManager). */
  recordActivity(itemId, kind, oldV, newV) {
    this.logActivity(itemId, kind, null, oldV, newV);
    this.events.onChange({ entity: "activity", entityId: itemId ?? "*" });
  }
  /**
   * `actorId`/`at` default to us and now, which is right for local edits. Ops applied from
   * a teammate pass their own — activity is not a synced entity (the op-log already carries
   * who did what and when), so remote activity is derived here from the op, not shipped.
   */
  logActivity(itemId, kind, field, oldV, newV, actorId, at, id) {
    const info = this.db.prepare("INSERT OR IGNORE INTO activity(id, item_id, actor_id, kind, field, old_value, new_value, at) VALUES(?,?,?,?,?,?,?,?)").run(
      id ?? import_node_crypto2.default.randomUUID(),
      itemId,
      actorId ?? this.actorId,
      kind,
      field ?? null,
      oldV == null ? null : String(oldV).slice(0, 8e3),
      newV == null ? null : String(newV).slice(0, 8e3),
      at ?? this.now()
    );
    return info.changes;
  }
  /** Stable per-op activity id, so deriving the same op twice is a no-op. */
  opActivityId(opId, field) {
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
  backfillRemoteActivity() {
    const rows = this.db.prepare(
      `SELECT op_id, actor_id, at, entity, entity_id, action, payload FROM oplog
          WHERE device_id != ? AND entity IN ('item','comment')`
    ).all(this.deviceId);
    let added = 0;
    const tx = this.db.transaction(() => {
      for (const r of rows) {
        let payload;
        try {
          payload = JSON.parse(r.payload || "{}");
        } catch {
          continue;
        }
        const record = payload.record ?? {};
        if (r.entity === "comment") {
          if (r.action !== "create") continue;
          added += this.logActivity(
            record.itemId ?? null,
            "comment",
            null,
            null,
            String(record.bodyText ?? "").slice(0, 200),
            r.actor_id,
            r.at,
            this.opActivityId(r.op_id)
          );
          continue;
        }
        if (r.action === "create") {
          added += this.logActivity(
            r.entity_id,
            "created",
            null,
            null,
            record.title,
            r.actor_id,
            r.at,
            this.opActivityId(r.op_id)
          );
        } else if (r.action === "set") {
          const fields = payload.fields ?? {};
          for (const [k, v] of Object.entries(fields)) {
            if (k === "updatedAt" || k === "updatedBy" || k === "body" || k === "bodyText") continue;
            added += this.logActivity(
              r.entity_id,
              "updated",
              k,
              null,
              JSON_ITEM_FIELDS.has(k) ? JSON.stringify(v) : v,
              r.actor_id,
              r.at,
              this.opActivityId(r.op_id, k)
            );
          }
          if ("body" in fields || "bodyText" in fields) {
            added += this.logActivity(
              r.entity_id,
              "edited",
              "body",
              null,
              String(fields.bodyText ?? ""),
              r.actor_id,
              r.at,
              this.opActivityId(r.op_id, "body")
            );
          }
        } else if (r.action === "delete") {
          added += this.logActivity(
            r.entity_id,
            "deleted",
            null,
            null,
            null,
            r.actor_id,
            r.at,
            this.opActivityId(r.op_id)
          );
        }
      }
    });
    tx();
    return added;
  }
  // ---------- items ----------
  createItem(input) {
    const tx = this.db.transaction(() => {
      const id = import_node_crypto2.default.randomUUID();
      const ident = this.allocIdent(input.type);
      const now = this.now();
      const statuses = statusesForType(input.type);
      const item2 = {
        id,
        ident,
        type: input.type,
        title: input.title,
        body: input.body ?? "",
        bodyText: input.bodyText ?? "",
        status: input.status && statuses.includes(input.status) ? input.status : statuses[0],
        priority: input.priority ?? "none",
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
        updatedBy: this.actorId
      };
      this.insertItemRow(item2);
      this.localCreate("item", id, this.itemToRecord(item2));
      this.logActivity(id, "created", null, null, item2.title);
      return item2;
    });
    const item = tx();
    this.events.onChange({ entity: "item", entityId: item.id });
    return item;
  }
  itemToRecord(item) {
    return { ...item, tags: item.tags, extra: item.extra };
  }
  insertItemRow(i) {
    this.db.prepare(
      `INSERT INTO items(id, ident, type, title, body, body_text, status, priority, owner_id, reporter_id,
          milestone_id, release_id, parent_id, start_date, due_date, completed_at, effort, confidence,
          risk_level, business_value, leadership_visible, progress, tags, extra, archived, sample, deleted,
          created_at, updated_at, created_by, updated_by)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?)`
    ).run(
      i.id,
      i.ident,
      i.type,
      i.title,
      i.body,
      i.bodyText,
      i.status,
      i.priority,
      i.ownerId,
      i.reporterId,
      i.milestoneId,
      i.releaseId,
      i.parentId,
      i.startDate,
      i.dueDate,
      i.completedAt,
      i.effort,
      i.confidence,
      i.riskLevel,
      i.businessValue,
      i.leadershipVisible,
      i.progress,
      JSON.stringify(i.tags),
      JSON.stringify(i.extra),
      i.archived,
      i.sample,
      i.createdAt,
      i.updatedAt,
      i.createdBy,
      i.updatedBy
    );
  }
  updateItem(id, fields) {
    const before = this.getItem(id);
    if (!before) return null;
    const changed = {};
    for (const [k, v] of Object.entries(fields)) {
      if (!(k in ITEM_COLS) || k === "deleted") continue;
      const prev = before[k];
      const same = JSON_ITEM_FIELDS.has(k) ? JSON.stringify(prev) === JSON.stringify(v) : prev === v;
      if (!same) changed[k] = v;
    }
    if (Object.keys(changed).length === 0) return before;
    if ("status" in changed) {
      const terminalNow = TERMINAL_STATUSES.has(String(changed.status));
      const terminalBefore = TERMINAL_STATUSES.has(before.status);
      if (terminalNow && !terminalBefore) changed.completedAt = this.now();
      if (!terminalNow && terminalBefore) changed.completedAt = null;
    }
    changed.updatedAt = this.now();
    changed.updatedBy = this.actorId;
    const tx = this.db.transaction(() => {
      this.applyItemFields(id, changed);
      this.localSet("item", id, changed);
      for (const [k, v] of Object.entries(changed)) {
        if (k === "updatedAt" || k === "updatedBy") continue;
        if (k === "body" || k === "bodyText") continue;
        this.logActivity(id, "updated", k, before[k], JSON_ITEM_FIELDS.has(k) ? JSON.stringify(v) : v);
      }
      if ("body" in changed || "bodyText" in changed) {
        const newText = "bodyText" in changed ? String(changed.bodyText ?? "") : before.bodyText;
        this.logActivity(id, "edited", "body", before.bodyText, newText);
      }
    });
    tx();
    this.events.onChange({ entity: "item", entityId: id });
    return this.getItem(id);
  }
  applyItemFields(id, fields) {
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(fields)) {
      const col = ITEM_COLS[k];
      if (!col) continue;
      sets.push(`${col}=?`);
      vals.push(JSON_ITEM_FIELDS.has(k) ? JSON.stringify(v) : v);
    }
    if (sets.length === 0) return;
    vals.push(id);
    this.db.prepare(`UPDATE items SET ${sets.join(", ")} WHERE id=?`).run(...vals);
  }
  archiveItem(id, archived) {
    this.updateItem(id, { archived: archived ? 1 : 0 });
  }
  deleteItem(id) {
    const stamp = this.now();
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE items SET deleted=1, deleted_at=?, deleted_by=?, updated_at=?, updated_by=? WHERE id=?").run(stamp, this.actorId, stamp, this.actorId, id);
      this.localOp("item", id, "delete", {});
      this.logActivity(id, "deleted");
    });
    tx();
    this.events.onChange({ entity: "item", entityId: id });
  }
  getItem(id) {
    const row = this.db.prepare("SELECT * FROM items WHERE id=? AND deleted=0").get(id);
    return row ? rowToItem(row) : null;
  }
  getItemByIdent(ident) {
    const row = this.db.prepare("SELECT * FROM items WHERE ident=? COLLATE NOCASE AND deleted=0").get(ident);
    return row ? rowToItem(row) : null;
  }
  listItems(filter = {}, sort = { field: "updatedAt", dir: "desc" }, limit = 500, offset = 0) {
    const where = ["deleted=0"];
    const vals = [];
    if (filter.archived !== void 0) {
      where.push("archived=?");
      vals.push(filter.archived ? 1 : 0);
    } else where.push("archived=0");
    if (filter.types?.length) {
      where.push(`type IN (${filter.types.map(() => "?").join(",")})`);
      vals.push(...filter.types);
    }
    if (filter.statuses?.length) {
      where.push(`status IN (${filter.statuses.map(() => "?").join(",")})`);
      vals.push(...filter.statuses);
    }
    if (filter.priorities?.length) {
      where.push(`priority IN (${filter.priorities.map(() => "?").join(",")})`);
      vals.push(...filter.priorities);
    }
    if (filter.ownerIds?.length) {
      const nonNull = filter.ownerIds.filter((o) => o !== null);
      const parts = [];
      if (nonNull.length) {
        parts.push(`owner_id IN (${nonNull.map(() => "?").join(",")})`);
        vals.push(...nonNull);
      }
      if (filter.ownerIds.includes(null)) parts.push("owner_id IS NULL");
      where.push(`(${parts.join(" OR ")})`);
    }
    if (filter.milestoneId) {
      where.push("milestone_id=?");
      vals.push(filter.milestoneId);
    }
    if (filter.releaseId) {
      where.push("release_id=?");
      vals.push(filter.releaseId);
    }
    if (filter.parentId) {
      where.push("parent_id=?");
      vals.push(filter.parentId);
    }
    if (filter.tag) {
      where.push("tags LIKE ?");
      vals.push(`%${JSON.stringify(filter.tag)}%`);
    }
    if (filter.overdue) {
      where.push("due_date IS NOT NULL AND due_date < date('now') AND completed_at IS NULL");
    }
    if (filter.dueWithinDays != null) {
      where.push("due_date IS NOT NULL AND due_date <= date('now', ?) AND completed_at IS NULL");
      vals.push(`+${filter.dueWithinDays} days`);
    }
    if (filter.leadershipVisible) where.push("leadership_visible=1");
    if (filter.updatedSince) {
      where.push("updated_at >= ?");
      vals.push(filter.updatedSince);
    }
    if (filter.sample !== void 0) {
      where.push("sample=?");
      vals.push(filter.sample ? 1 : 0);
    }
    if (filter.text) {
      where.push("rowid IN (SELECT rowid FROM items_fts WHERE items_fts MATCH ?)");
      vals.push(ftsQuery(filter.text));
    }
    const sortCol = {
      ident: "ident",
      title: "title COLLATE NOCASE",
      status: "status",
      priority: "CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END",
      dueDate: "due_date IS NULL, due_date",
      createdAt: "created_at",
      updatedAt: "updated_at",
      manual: "updated_at"
    };
    const order = `${sortCol[sort.field] ?? "updated_at"} ${sort.dir === "asc" ? "ASC" : "DESC"}`;
    const rows = this.db.prepare(`SELECT * FROM items WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...vals, limit, offset);
    return rows.map(rowToItem);
  }
  search(text, limit = 30) {
    if (!text.trim()) return [];
    const rows = this.db.prepare(
      `SELECT items.*, snippet(items_fts, 2, '<<', '>>', '\u2026', 12) AS snip, rank AS score
         FROM items_fts JOIN items ON items.rowid = items_fts.rowid
         WHERE items_fts MATCH ? AND items.deleted=0 AND items.archived=0
         ORDER BY rank LIMIT ?`
    ).all(ftsQuery(text), limit);
    return rows.map((r) => ({ item: rowToItem(r), snippet: r.snip, score: r.score }));
  }
  // ---------- links ----------
  addLink(fromId, toId, kind) {
    if (fromId === toId) return null;
    const existing = this.db.prepare("SELECT * FROM links WHERE from_id=? AND to_id=? AND kind=?").get(fromId, toId, kind);
    if (existing && !existing.deleted) return rowToLink(existing);
    const link = {
      id: existing ? String(existing.id) : import_node_crypto2.default.randomUUID(),
      fromId,
      toId,
      kind,
      createdAt: this.now(),
      createdBy: this.actorId
    };
    const tx = this.db.transaction(() => {
      if (existing) {
        this.db.prepare("UPDATE links SET deleted=0 WHERE id=?").run(link.id);
        this.localSet("link", link.id, { deleted: 0 });
      } else {
        this.db.prepare("INSERT INTO links(id, from_id, to_id, kind, deleted, created_at, created_by) VALUES(?,?,?,?,0,?,?)").run(link.id, fromId, toId, kind, link.createdAt, link.createdBy);
        this.localCreate("link", link.id, { ...link });
      }
      this.logActivity(fromId, "link", kind, null, toId);
    });
    tx();
    this.events.onChange({ entity: "link", entityId: link.id });
    return link;
  }
  removeLink(id) {
    const row = this.db.prepare("SELECT from_id, kind, to_id FROM links WHERE id=?").get(id);
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE links SET deleted=1 WHERE id=?").run(id);
      this.localSet("link", id, { deleted: 1 });
      if (row) this.logActivity(row.from_id, "unlink", row.kind, row.to_id, null);
    });
    tx();
    this.events.onChange({ entity: "link", entityId: id });
  }
  linksFor(itemId) {
    const rows = this.db.prepare("SELECT * FROM links WHERE (from_id=? OR to_id=?) AND deleted=0").all(itemId, itemId);
    const out = [];
    for (const r of rows) {
      const link = rowToLink(r);
      const direction = link.fromId === itemId ? "out" : "in";
      const other = this.getItem(direction === "out" ? link.toId : link.fromId);
      if (other) out.push({ link, direction, other });
    }
    return out;
  }
  // ---------- comments ----------
  addComment(itemId, body, bodyText) {
    const c = {
      id: import_node_crypto2.default.randomUUID(),
      itemId,
      authorId: this.actorId,
      body,
      bodyText,
      createdAt: this.now(),
      updatedAt: null,
      deleted: 0
    };
    const tx = this.db.transaction(() => {
      this.db.prepare("INSERT INTO comments(id, item_id, author_id, body, body_text, created_at, updated_at, deleted) VALUES(?,?,?,?,?,?,?,0)").run(c.id, c.itemId, c.authorId, c.body, c.bodyText, c.createdAt, c.updatedAt);
      this.localCreate("comment", c.id, { ...c });
      this.logActivity(itemId, "comment", null, null, bodyText.slice(0, 200));
    });
    tx();
    this.events.onChange({ entity: "comment", entityId: c.id });
    return c;
  }
  updateComment(id, body, bodyText) {
    const row = this.db.prepare("SELECT item_id FROM comments WHERE id=?").get(id);
    const fields = { body, bodyText, updatedAt: this.now(), updatedBy: this.actorId };
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE comments SET body=?, body_text=?, updated_at=?, updated_by=? WHERE id=?").run(body, bodyText, fields.updatedAt, fields.updatedBy, id);
      this.localSet("comment", id, fields);
      if (row) this.logActivity(row.item_id, "comment_edited", null, null, bodyText.slice(0, 200));
    });
    tx();
    this.events.onChange({ entity: "comment", entityId: id });
  }
  deleteComment(id) {
    const row = this.db.prepare("SELECT item_id, body_text FROM comments WHERE id=?").get(id);
    const stamp = this.now();
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE comments SET deleted=1, deleted_at=?, deleted_by=? WHERE id=?").run(stamp, this.actorId, id);
      this.localSet("comment", id, { deleted: 1, deletedAt: stamp, deletedBy: this.actorId });
      if (row) this.logActivity(row.item_id, "comment_deleted", null, row.body_text.slice(0, 200), null);
    });
    tx();
    this.events.onChange({ entity: "comment", entityId: id });
  }
  commentsFor(itemId) {
    const rows = this.db.prepare("SELECT * FROM comments WHERE item_id=? AND deleted=0 ORDER BY created_at ASC").all(itemId);
    return rows.map((r) => ({
      id: String(r.id),
      itemId: String(r.item_id),
      authorId: String(r.author_id),
      body: String(r.body),
      bodyText: String(r.body_text),
      createdAt: String(r.created_at),
      updatedAt: r.updated_at ? String(r.updated_at) : null,
      deleted: 0
    }));
  }
  // ---------- versions ----------
  saveVersion(itemId) {
    const item = this.getItem(itemId);
    if (!item) return;
    const last = this.db.prepare("SELECT MAX(version) AS v FROM item_versions WHERE item_id=?").get(itemId);
    this.db.prepare("INSERT INTO item_versions(id, item_id, version, title, body, saved_by, saved_at) VALUES(?,?,?,?,?,?,?)").run(import_node_crypto2.default.randomUUID(), itemId, (last.v ?? 0) + 1, item.title, item.body, this.actorId, this.now());
  }
  versionsFor(itemId) {
    return this.db.prepare("SELECT id, item_id AS itemId, version, title, body, saved_by AS savedBy, saved_at AS savedAt FROM item_versions WHERE item_id=? ORDER BY version DESC").all(itemId);
  }
  // ---------- users ----------
  upsertUser(u) {
    const existing = this.db.prepare("SELECT * FROM users WHERE id=?").get(u.id);
    const user = {
      ...u,
      createdAt: existing ? String(existing.created_at) : this.now()
    };
    const tx = this.db.transaction(() => {
      this.db.prepare(
        `INSERT INTO users(id, name, initials, color, created_at, deleted) VALUES(?,?,?,?,?,0)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, initials=excluded.initials, color=excluded.color, deleted=0`
      ).run(user.id, user.name, user.initials, user.color, user.createdAt);
      if (!existing) this.localCreate("user", user.id, { ...user });
      else {
        const fields = { name: user.name, initials: user.initials, color: user.color };
        if (Number(existing.deleted) === 1) fields.deleted = 0;
        this.localSet("user", user.id, fields);
      }
    });
    tx();
    this.events.onChange({ entity: "user", entityId: user.id });
    return user;
  }
  listUsers() {
    return this.db.prepare("SELECT id, name, initials, color, avatar, created_at AS createdAt FROM users WHERE deleted=0").all();
  }
  /** Remove a member for everyone. Soft delete (tombstone) so records they own or
      authored keep resolving; emits a synced 'delete' op. Returns false if unknown. */
  deleteUser(id) {
    const exists = this.db.prepare("SELECT 1 FROM users WHERE id=? AND deleted=0").get(id);
    if (!exists) return false;
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE users SET deleted=1 WHERE id=?").run(id);
      this.localOp("user", id, "delete", {});
    });
    tx();
    this.events.onChange({ entity: "user", entityId: id });
    return true;
  }
  /** Set (or clear, with null) a user's avatar image. Emits a synced 'set' op. */
  setUserAvatar(id, avatar) {
    const exists = this.db.prepare("SELECT 1 FROM users WHERE id=?").get(id);
    if (!exists) return null;
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE users SET avatar=? WHERE id=?").run(avatar, id);
      this.localSet("user", id, { avatar });
    });
    tx();
    this.events.onChange({ entity: "user", entityId: id });
    return this.db.prepare("SELECT id, name, initials, color, avatar, created_at AS createdAt FROM users WHERE id=?").get(id);
  }
  // ---------- milestones / releases ----------
  upsertMilestone(m) {
    const id = m.id ?? import_node_crypto2.default.randomUUID();
    const existing = this.db.prepare("SELECT * FROM milestones WHERE id=?").get(id);
    const now = this.now();
    const createdAt = existing ? String(existing.created_at || now) : now;
    const createdBy = existing ? String(existing.created_by || this.actorId) : this.actorId;
    const rec = {
      id,
      name: m.name,
      description: m.description ?? (existing ? String(existing.description) : ""),
      targetDate: m.targetDate ?? (existing ? existing.target_date : null),
      status: m.status ?? (existing ? existing.status : "planned"),
      sort: m.sort ?? (existing ? Number(existing.sort) : 0),
      sample: m.sample ?? (existing ? Number(existing.sample) : 0),
      createdAt,
      createdBy,
      updatedAt: now,
      updatedBy: this.actorId
    };
    const tx = this.db.transaction(() => {
      this.db.prepare(
        `INSERT INTO milestones(id, name, description, target_date, status, sort, sample, deleted, created_at, created_by, updated_at, updated_by)
             VALUES(?,?,?,?,?,?,?,0,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET name=?, description=?, target_date=?, status=?, sort=?, deleted=0, updated_at=?, updated_by=?`
      ).run(
        rec.id,
        rec.name,
        rec.description,
        rec.targetDate,
        rec.status,
        rec.sort,
        rec.sample,
        createdAt,
        createdBy,
        now,
        this.actorId,
        rec.name,
        rec.description,
        rec.targetDate,
        rec.status,
        rec.sort,
        now,
        this.actorId
      );
      if (!existing) {
        this.localCreate("milestone", id, { ...rec });
        this.logActivity(null, "milestone_created", "milestone", null, rec.name);
      } else {
        this.localSet("milestone", id, { name: rec.name, description: rec.description, targetDate: rec.targetDate, status: rec.status, sort: rec.sort, updatedAt: now, updatedBy: this.actorId });
        this.logActivity(null, "milestone_updated", "milestone", String(existing.name), rec.name);
      }
    });
    tx();
    this.events.onChange({ entity: "milestone", entityId: id });
    return rec;
  }
  listMilestones() {
    const rows = this.db.prepare("SELECT * FROM milestones WHERE deleted=0 ORDER BY sort, target_date").all();
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      description: String(r.description),
      targetDate: r.target_date ? String(r.target_date) : null,
      status: r.status,
      sort: Number(r.sort),
      sample: Number(r.sample),
      createdAt: r.created_at ? String(r.created_at) : "",
      createdBy: r.created_by ? String(r.created_by) : "",
      updatedAt: r.updated_at ? String(r.updated_at) : "",
      updatedBy: r.updated_by ? String(r.updated_by) : ""
    }));
  }
  upsertRelease(m) {
    const id = m.id ?? import_node_crypto2.default.randomUUID();
    const existing = this.db.prepare("SELECT * FROM releases WHERE id=?").get(id);
    const now = this.now();
    const createdAt = existing ? String(existing.created_at || now) : now;
    const createdBy = existing ? String(existing.created_by || this.actorId) : this.actorId;
    const rec = {
      id,
      name: m.name,
      version: m.version ?? (existing ? String(existing.version) : ""),
      targetDate: m.targetDate ?? (existing ? existing.target_date : null),
      status: m.status ?? (existing ? existing.status : "planned"),
      goals: m.goals ?? (existing ? String(existing.goals) : ""),
      notes: m.notes ?? (existing ? String(existing.notes) : ""),
      sample: m.sample ?? (existing ? Number(existing.sample) : 0),
      createdAt,
      createdBy,
      updatedAt: now,
      updatedBy: this.actorId
    };
    const tx = this.db.transaction(() => {
      this.db.prepare(
        `INSERT INTO releases(id, name, version, target_date, status, goals, notes, sample, deleted, created_at, created_by, updated_at, updated_by)
             VALUES(?,?,?,?,?,?,?,?,0,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET name=?, version=?, target_date=?, status=?, goals=?, notes=?, deleted=0, updated_at=?, updated_by=?`
      ).run(
        rec.id,
        rec.name,
        rec.version,
        rec.targetDate,
        rec.status,
        rec.goals,
        rec.notes,
        rec.sample,
        createdAt,
        createdBy,
        now,
        this.actorId,
        rec.name,
        rec.version,
        rec.targetDate,
        rec.status,
        rec.goals,
        rec.notes,
        now,
        this.actorId
      );
      if (!existing) {
        this.localCreate("release", id, { ...rec });
        this.logActivity(null, "release_created", "release", null, rec.name);
      } else {
        this.localSet("release", id, { name: rec.name, version: rec.version, targetDate: rec.targetDate, status: rec.status, goals: rec.goals, notes: rec.notes, updatedAt: now, updatedBy: this.actorId });
        this.logActivity(null, "release_updated", "release", String(existing.name), rec.name);
      }
    });
    tx();
    this.events.onChange({ entity: "release", entityId: id });
    return rec;
  }
  listReleases() {
    const rows = this.db.prepare("SELECT * FROM releases WHERE deleted=0 ORDER BY target_date").all();
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      version: String(r.version),
      targetDate: r.target_date ? String(r.target_date) : null,
      status: r.status,
      goals: String(r.goals),
      notes: String(r.notes),
      sample: Number(r.sample),
      createdAt: r.created_at ? String(r.created_at) : "",
      createdBy: r.created_by ? String(r.created_by) : "",
      updatedAt: r.updated_at ? String(r.updated_at) : "",
      updatedBy: r.updated_by ? String(r.updated_by) : ""
    }));
  }
  // ---------- saved views ----------
  saveView(v) {
    const id = v.id ?? import_node_crypto2.default.randomUUID();
    const rec = {
      id,
      name: v.name,
      config: v.config,
      pinned: v.pinned ?? 0,
      createdBy: this.actorId,
      createdAt: this.now()
    };
    const existing = this.db.prepare("SELECT 1 FROM saved_views WHERE id=?").get(id);
    const tx = this.db.transaction(() => {
      this.db.prepare(
        `INSERT INTO saved_views(id, name, config, pinned, created_by, created_at, deleted) VALUES(?,?,?,?,?,?,0)
           ON CONFLICT(id) DO UPDATE SET name=?, config=?, pinned=?, deleted=0`
      ).run(
        id,
        rec.name,
        JSON.stringify(rec.config),
        rec.pinned,
        rec.createdBy,
        rec.createdAt,
        rec.name,
        JSON.stringify(rec.config),
        rec.pinned
      );
      if (!existing) this.localCreate("saved_view", id, { ...rec });
      else this.localSet("saved_view", id, { name: rec.name, config: rec.config, pinned: rec.pinned });
    });
    tx();
    return rec;
  }
  listViews() {
    const rows = this.db.prepare("SELECT * FROM saved_views WHERE deleted=0 ORDER BY pinned DESC, name").all();
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      config: JSON.parse(String(r.config)),
      pinned: Number(r.pinned),
      createdBy: String(r.created_by),
      createdAt: String(r.created_at)
    }));
  }
  deleteView(id) {
    const row = this.db.prepare("SELECT name FROM saved_views WHERE id=?").get(id);
    const stamp = this.now();
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE saved_views SET deleted=1, deleted_at=?, deleted_by=? WHERE id=?").run(stamp, this.actorId, id);
      this.localSet("saved_view", id, { deleted: 1, deletedAt: stamp, deletedBy: this.actorId });
      this.logActivity(null, "view_deleted", "saved_view", row ? row.name : null, null);
    });
    tx();
  }
  // ---------- activity ----------
  activityFor(itemId, limit = 100) {
    if (itemId) {
      return this.db.prepare("SELECT id, item_id AS itemId, actor_id AS actorId, kind, field, old_value AS oldValue, new_value AS newValue, at FROM activity WHERE item_id=? ORDER BY at DESC LIMIT ?").all(itemId, limit);
    }
    return this.db.prepare("SELECT id, item_id AS itemId, actor_id AS actorId, kind, field, old_value AS oldValue, new_value AS newValue, at FROM activity ORDER BY at DESC LIMIT ?").all(limit);
  }
  // ---------- remote op application ----------
  /** Apply a batch of remote ops inside one transaction. Returns count applied (non-duplicate). */
  applyRemoteOps(ops) {
    let applied = 0;
    const tx = this.db.transaction(() => {
      for (const op of ops) {
        if (op.deviceId === this.deviceId) continue;
        const dup = this.db.prepare("SELECT 1 FROM oplog WHERE op_id=?").get(op.opId);
        if (dup) continue;
        this.witnessLamport(op.lamport);
        this.appendOp(op);
        try {
          this.applyRemoteOp(op);
        } catch (err) {
          console.error(`[sync] failed to apply op ${op.opId} (${op.entity}/${op.action}):`, err);
        }
        applied++;
      }
    });
    tx();
    if (applied > 0) this.events.onChange({ entity: "*", entityId: "*" });
    return applied;
  }
  applyRemoteOp(op) {
    switch (op.action) {
      case "create":
        this.applyRemoteCreate(op);
        break;
      case "set":
        this.applyRemoteSet(op);
        break;
      case "delete":
        this.applyRemoteDelete(op);
        break;
    }
  }
  tableFor(entity) {
    switch (entity) {
      case "item":
        return "items";
      case "link":
        return "links";
      case "comment":
        return "comments";
      case "milestone":
        return "milestones";
      case "release":
        return "releases";
      case "user":
        return "users";
      case "saved_view":
        return "saved_views";
      case "attachment":
        return "attachments";
      default:
        throw new Error(`unknown entity ${entity}`);
    }
  }
  applyRemoteCreate(op) {
    const record = op.payload.record;
    if (!record) return;
    const table = this.tableFor(op.entity);
    const exists = this.db.prepare(`SELECT 1 FROM ${table} WHERE id=?`).get(op.entityId);
    if (exists) return;
    if (op.entity === "item") {
      let item = { ...record };
      const holder = this.db.prepare("SELECT id, type FROM items WHERE ident=?").get(item.ident);
      if (holder && holder.id !== item.id) {
        if (item.id < holder.id) {
          const bumped = this.allocIdent(holder.type);
          this.logActivity(holder.id, "renumbered", "ident", item.ident, bumped);
          this.applyItemFields(holder.id, { ident: bumped });
          this.localSet("item", holder.id, { ident: bumped });
          this.insertItemRow(item);
        } else {
          const newIdent = this.allocIdent(item.type);
          this.logActivity(item.id, "renumbered", "ident", item.ident, newIdent);
          item = { ...item, ident: newIdent };
          this.insertItemRow(item);
          this.localSet("item", item.id, { ident: newIdent });
        }
      } else {
        this.insertItemRow(item);
      }
      this.witnessIdent(item.type, item.ident);
      this.logActivity(item.id, "created", null, null, item.title, op.actorId, op.at, this.opActivityId(op.opId));
      for (const f of Object.keys(record)) this.setFieldClockIfNewer("item", item.id, f, op.lamport, op.deviceId);
      this.replayPendingOps(op.entity, op.entityId);
      return;
    }
    const inserters = {
      link: () => {
        const r = record;
        this.db.prepare("INSERT OR IGNORE INTO links(id, from_id, to_id, kind, deleted, created_at, created_by) VALUES(?,?,?,?,?,?,?)").run(r.id, r.fromId, r.toId, r.kind, r.deleted ?? 0, r.createdAt, r.createdBy);
      },
      comment: () => {
        const r = record;
        this.db.prepare("INSERT OR IGNORE INTO comments(id, item_id, author_id, body, body_text, created_at, updated_at, deleted) VALUES(?,?,?,?,?,?,?,?)").run(r.id, r.itemId, r.authorId, r.body, r.bodyText, r.createdAt, r.updatedAt, r.deleted ?? 0);
        this.logActivity(r.itemId, "comment", null, null, (r.bodyText ?? "").slice(0, 200), op.actorId, op.at, this.opActivityId(op.opId));
      },
      milestone: () => {
        const r = record;
        this.db.prepare("INSERT OR IGNORE INTO milestones(id, name, description, target_date, status, sort, sample, deleted) VALUES(?,?,?,?,?,?,?,0)").run(r.id, r.name, r.description, r.targetDate, r.status, r.sort, r.sample ?? 0);
      },
      release: () => {
        const r = record;
        this.db.prepare("INSERT OR IGNORE INTO releases(id, name, version, target_date, status, goals, notes, sample, deleted) VALUES(?,?,?,?,?,?,?,?,0)").run(r.id, r.name, r.version, r.targetDate, r.status, r.goals, r.notes, r.sample ?? 0);
      },
      user: () => {
        const r = record;
        this.db.prepare("INSERT OR IGNORE INTO users(id, name, initials, color, avatar, created_at, deleted) VALUES(?,?,?,?,?,?,?)").run(r.id, r.name, r.initials, r.color, r.avatar ?? null, r.createdAt, r.deleted ?? 0);
      },
      saved_view: () => {
        const r = record;
        this.db.prepare("INSERT OR IGNORE INTO saved_views(id, name, config, pinned, created_by, created_at, deleted) VALUES(?,?,?,?,?,?,0)").run(r.id, r.name, JSON.stringify(r.config), r.pinned, r.createdBy, r.createdAt);
      },
      attachment: () => {
        const r = record;
        this.db.prepare("INSERT OR IGNORE INTO attachments(id, item_id, filename, mime, size, sha256, description, uploaded_by, created_at, deleted) VALUES(?,?,?,?,?,?,?,?,?,?)").run(r.id, r.itemId, r.filename, r.mime, r.size, r.sha256, r.description, r.uploadedBy, r.createdAt, r.deleted ?? 0);
      }
    };
    inserters[op.entity]?.();
    for (const f of Object.keys(record)) this.setFieldClockIfNewer(op.entity, op.entityId, f, op.lamport, op.deviceId);
    this.replayPendingOps(op.entity, op.entityId);
  }
  /** Set a field clock only if the incoming write is newer — creates must never
      regress clocks stamped by buffered/earlier-arriving sets. */
  setFieldClockIfNewer(entity, entityId, field, lamport, deviceId) {
    const cur = this.fieldClock(entity, entityId, field);
    if (cur && (cur.lamport > lamport || cur.lamport === lamport && cur.deviceId > deviceId)) return;
    this.setFieldClock(entity, entityId, field, lamport, deviceId);
  }
  /** Buffer an op that arrived before its target's create (3+ device reordering). */
  bufferPendingOp(op) {
    this.db.prepare(
      `INSERT OR IGNORE INTO pending_ops(op_id, device_id, actor_id, lamport, at, entity, entity_id, action, payload)
         VALUES(?,?,?,?,?,?,?,?,?)`
    ).run(op.opId, op.deviceId, op.actorId, op.lamport, op.at, op.entity, op.entityId, op.action, JSON.stringify(op.payload));
  }
  /** Replay buffered sets/deletes for an entity once its create has landed. */
  replayPendingOps(entity, entityId) {
    const rows = this.db.prepare("SELECT * FROM pending_ops WHERE entity=? AND entity_id=? ORDER BY lamport, device_id").all(entity, entityId);
    if (rows.length === 0) return;
    this.db.prepare("DELETE FROM pending_ops WHERE entity=? AND entity_id=?").run(entity, entityId);
    for (const r of rows) {
      this.applyRemoteOp({
        opId: String(r.op_id),
        deviceId: String(r.device_id),
        actorId: String(r.actor_id),
        lamport: Number(r.lamport),
        at: String(r.at),
        entity: r.entity,
        entityId: String(r.entity_id),
        action: r.action,
        payload: JSON.parse(String(r.payload))
      });
    }
  }
  applyRemoteSet(op) {
    const rowExists = this.db.prepare(`SELECT 1 FROM ${this.tableFor(op.entity)} WHERE id=?`).get(op.entityId);
    if (!rowExists) {
      this.bufferPendingOp(op);
      return;
    }
    const fields = op.payload.fields ?? {};
    const basedOn = op.payload.basedOn ?? {};
    const winning = {};
    for (const [field, value] of Object.entries(fields)) {
      const local = this.fieldClock(op.entity, op.entityId, field);
      const base = basedOn[field] ?? null;
      let remoteWins;
      let concurrent = false;
      if (!local) {
        remoteWins = true;
      } else if (base && base.lamport === local.lamport && base.deviceId === local.deviceId) {
        remoteWins = true;
      } else {
        concurrent = true;
        remoteWins = op.lamport > local.lamport || op.lamport === local.lamport && op.deviceId > local.deviceId;
      }
      if (concurrent && CONFLICT_SURFACED_FIELDS.has(field) && op.entity === "item") {
        const cur = this.db.prepare(`SELECT ${ITEM_COLS[field]} AS v FROM items WHERE id=?`).get(op.entityId);
        const localVal = cur ? String(cur.v ?? "") : "";
        const remoteVal = String(value ?? "");
        if (localVal !== remoteVal) {
          const conflict = {
            id: import_node_crypto2.default.randomUUID(),
            entity: op.entity,
            entityId: op.entityId,
            field,
            localValue: localVal,
            remoteValue: remoteVal,
            remoteDevice: op.deviceId,
            remoteActor: op.actorId,
            detectedAt: this.now(),
            resolvedAt: null,
            resolution: null
          };
          this.db.prepare("INSERT INTO sync_conflicts(id, entity, entity_id, field, local_value, remote_value, remote_device, remote_actor, detected_at) VALUES(?,?,?,?,?,?,?,?,?)").run(conflict.id, conflict.entity, conflict.entityId, conflict.field, conflict.localValue, conflict.remoteValue, conflict.remoteDevice, conflict.remoteActor, conflict.detectedAt);
          this.events.onConflict(conflict);
        }
      }
      if (remoteWins) {
        winning[field] = value;
        this.setFieldClock(op.entity, op.entityId, field, op.lamport, op.deviceId);
      }
    }
    if (Object.keys(winning).length === 0) return;
    if (op.entity === "item") {
      const before = this.getItem(op.entityId);
      if ("ident" in winning) {
        const holder = this.db.prepare("SELECT id, type FROM items WHERE ident=?").get(String(winning.ident));
        const cur = this.db.prepare("SELECT type FROM items WHERE id=?").get(op.entityId);
        if (holder && holder.id !== op.entityId && cur) {
          if (op.entityId < holder.id) {
            const bumped = this.allocIdent(holder.type);
            this.logActivity(holder.id, "renumbered", "ident", String(winning.ident), bumped);
            this.applyItemFields(holder.id, { ident: bumped });
            this.localSet("item", holder.id, { ident: bumped });
          } else {
            const bumped = this.allocIdent(cur.type);
            winning.ident = bumped;
            this.localSet("item", op.entityId, { ident: bumped });
          }
        } else if (cur) {
          this.witnessIdent(cur.type, String(winning.ident));
        }
      }
      this.applyItemFields(op.entityId, winning);
      if (before) {
        const prev = before;
        for (const [k, v] of Object.entries(winning)) {
          if (k === "updatedAt" || k === "updatedBy" || k === "body" || k === "bodyText") continue;
          this.logActivity(
            op.entityId,
            "updated",
            k,
            prev[k],
            JSON_ITEM_FIELDS.has(k) ? JSON.stringify(v) : v,
            op.actorId,
            op.at,
            this.opActivityId(op.opId, k)
          );
        }
        if ("body" in winning || "bodyText" in winning) {
          const newText = "bodyText" in winning ? String(winning.bodyText ?? "") : before.bodyText;
          this.logActivity(
            op.entityId,
            "edited",
            "body",
            before.bodyText,
            newText,
            op.actorId,
            op.at,
            this.opActivityId(op.opId, "body")
          );
        }
      }
      return;
    }
    const colMap = {
      link: { deleted: "deleted" },
      comment: { body: "body", bodyText: "body_text", updatedAt: "updated_at", deleted: "deleted" },
      milestone: { name: "name", description: "description", targetDate: "target_date", status: "status", sort: "sort", deleted: "deleted" },
      release: { name: "name", version: "version", targetDate: "target_date", status: "status", goals: "goals", notes: "notes", deleted: "deleted" },
      user: { name: "name", initials: "initials", color: "color", avatar: "avatar", deleted: "deleted" },
      saved_view: { name: "name", config: "config", pinned: "pinned", deleted: "deleted" },
      attachment: { description: "description", deleted: "deleted" }
    };
    const map = colMap[op.entity];
    if (!map) return;
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(winning)) {
      const col = map[k];
      if (!col) continue;
      sets.push(`${col}=?`);
      vals.push(k === "config" ? JSON.stringify(v) : v);
    }
    if (!sets.length) return;
    vals.push(op.entityId);
    this.db.prepare(`UPDATE ${this.tableFor(op.entity)} SET ${sets.join(", ")} WHERE id=?`).run(...vals);
  }
  applyRemoteDelete(op) {
    const table = this.tableFor(op.entity);
    const rowExists = this.db.prepare(`SELECT 1 FROM ${table} WHERE id=?`).get(op.entityId);
    if (!rowExists) {
      this.bufferPendingOp(op);
      return;
    }
    this.db.prepare(`UPDATE ${table} SET deleted=1 WHERE id=?`).run(op.entityId);
    this.setFieldClock(op.entity, op.entityId, "deleted", op.lamport, op.deviceId);
    if (op.entity === "item") {
      this.logActivity(op.entityId, "deleted", null, null, null, op.actorId, op.at, this.opActivityId(op.opId));
    }
  }
  // ---------- conflicts ----------
  listConflicts(openOnly = true) {
    const rows = this.db.prepare(`SELECT * FROM sync_conflicts ${openOnly ? "WHERE resolved_at IS NULL" : ""} ORDER BY detected_at DESC`).all();
    return rows.map((r) => ({
      id: String(r.id),
      entity: String(r.entity),
      entityId: String(r.entity_id),
      field: String(r.field),
      localValue: String(r.local_value),
      remoteValue: String(r.remote_value),
      remoteDevice: String(r.remote_device),
      remoteActor: String(r.remote_actor),
      detectedAt: String(r.detected_at),
      resolvedAt: r.resolved_at ? String(r.resolved_at) : null,
      resolution: r.resolution ?? null
    }));
  }
  resolveConflict(id, resolution, mergedValue) {
    const row = this.db.prepare("SELECT * FROM sync_conflicts WHERE id=?").get(id);
    if (!row) return;
    const tx = this.db.transaction(() => {
      const value = resolution === "merged" ? mergedValue ?? "" : resolution === "local" ? String(row.local_value) : String(row.remote_value);
      if (String(row.entity) === "item") {
        const field = String(row.field);
        const stamp = this.now();
        const fields = { [field]: value, updatedAt: stamp, updatedBy: this.actorId };
        if (field === "body") fields.bodyText = docToText(value);
        this.applyItemFields(String(row.entity_id), fields);
        this.localSet("item", String(row.entity_id), fields);
      }
      this.db.prepare("UPDATE sync_conflicts SET resolved_at=?, resolution=?, resolved_by=? WHERE id=?").run(this.now(), resolution, this.actorId, id);
    });
    tx();
    this.events.onChange({ entity: String(row.entity), entityId: String(row.entity_id) });
  }
  // ---------- sync export helpers ----------
  opsSince(seq, ownOnly = true) {
    const rows = this.db.prepare(
      `SELECT seq, op_id, device_id, actor_id, lamport, at, entity, entity_id, action, payload
         FROM oplog WHERE seq > ? ${ownOnly ? "AND device_id = ?" : ""} ORDER BY seq ASC`
    ).all(...ownOnly ? [seq, this.deviceId] : [seq]);
    return rows.map((r) => ({
      seq: Number(r.seq),
      op: {
        opId: String(r.op_id),
        deviceId: String(r.device_id),
        actorId: String(r.actor_id),
        lamport: Number(r.lamport),
        at: String(r.at),
        entity: r.entity,
        entityId: String(r.entity_id),
        action: r.action,
        payload: JSON.parse(String(r.payload))
      }
    }));
  }
  // ---------- sample data ----------
  removeSampleData() {
    const tx = this.db.transaction(() => {
      const ids = this.db.prepare("SELECT id FROM items WHERE sample=1 AND deleted=0").all().map((r) => r.id);
      for (const id of ids) this.deleteItem(id);
      for (const m of this.db.prepare("SELECT id FROM milestones WHERE sample=1 AND deleted=0").all()) {
        this.db.prepare("UPDATE milestones SET deleted=1 WHERE id=?").run(m.id);
        this.localSet("milestone", m.id, { deleted: 1 });
      }
      for (const rel of this.db.prepare("SELECT id FROM releases WHERE sample=1 AND deleted=0").all()) {
        this.db.prepare("UPDATE releases SET deleted=1 WHERE id=?").run(rel.id);
        this.localSet("release", rel.id, { deleted: 1 });
      }
      return ids.length;
    });
    const n = tx();
    this.events.onChange({ entity: "*", entityId: "*" });
    return n;
  }
};
function rowToItem(r) {
  return {
    id: String(r.id),
    ident: String(r.ident),
    type: r.type,
    title: String(r.title),
    body: String(r.body),
    bodyText: String(r.body_text),
    status: String(r.status),
    priority: r.priority,
    ownerId: r.owner_id ?? null,
    reporterId: r.reporter_id ?? null,
    milestoneId: r.milestone_id ?? null,
    releaseId: r.release_id ?? null,
    parentId: r.parent_id ?? null,
    startDate: r.start_date ?? null,
    dueDate: r.due_date ?? null,
    completedAt: r.completed_at ?? null,
    effort: r.effort == null ? null : Number(r.effort),
    confidence: r.confidence ?? null,
    riskLevel: r.risk_level ?? null,
    businessValue: r.business_value ?? null,
    leadershipVisible: Number(r.leadership_visible),
    progress: r.progress == null ? null : Number(r.progress),
    tags: safeParse(String(r.tags), []),
    extra: safeParse(String(r.extra), {}),
    archived: Number(r.archived),
    sample: Number(r.sample),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    createdBy: String(r.created_by),
    updatedBy: String(r.updated_by)
  };
}
function rowToLink(r) {
  return {
    id: String(r.id),
    fromId: String(r.from_id),
    toId: String(r.to_id),
    kind: r.kind,
    createdAt: String(r.created_at),
    createdBy: String(r.created_by)
  };
}
function safeParse(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}
function ftsQuery(text) {
  const terms = text.replace(/['"*()]/g, " ").split(/\s+/).filter(Boolean).map((t) => `"${t}"*`);
  return terms.join(" ") || '""';
}

// electron/sync/transport.ts
var import_node_fs2 = __toESM(require("node:fs"));
var import_node_path2 = __toESM(require("node:path"));
var FolderTransport = class {
  constructor(root) {
    this.root = root;
  }
  location() {
    return this.root;
  }
  available() {
    try {
      import_node_fs2.default.mkdirSync(import_node_path2.default.join(this.root, "ops"), { recursive: true });
      return true;
    } catch {
      return false;
    }
  }
  opsDir(deviceId) {
    return import_node_path2.default.join(this.root, "ops", deviceId);
  }
  async publishOps(deviceId, batchName, ops) {
    const dir = this.opsDir(deviceId);
    import_node_fs2.default.mkdirSync(dir, { recursive: true });
    const finalPath = import_node_path2.default.join(dir, batchName);
    const tmpPath = finalPath + ".tmp";
    const lines = ops.map((o) => JSON.stringify(o)).join("\n") + "\n";
    import_node_fs2.default.writeFileSync(tmpPath, lines, "utf8");
    import_node_fs2.default.renameSync(tmpPath, finalPath);
  }
  async listPeerBatches(ownDeviceId, afterFileByDevice) {
    const opsRoot = import_node_path2.default.join(this.root, "ops");
    if (!import_node_fs2.default.existsSync(opsRoot)) return [];
    const out = [];
    for (const dev of import_node_fs2.default.readdirSync(opsRoot, { withFileTypes: true })) {
      if (!dev.isDirectory() || dev.name === ownDeviceId) continue;
      const after = afterFileByDevice.get(dev.name) ?? null;
      const files = import_node_fs2.default.readdirSync(import_node_path2.default.join(opsRoot, dev.name)).filter((f) => f.endsWith(".jsonl")).sort();
      for (const f of files) {
        if (after && f <= after) continue;
        out.push({ deviceId: dev.name, fileName: f });
      }
    }
    return out;
  }
  async fetchBatch(deviceId, fileName) {
    const p = import_node_path2.default.join(this.opsDir(deviceId), fileName);
    const text = import_node_fs2.default.readFileSync(p, "utf8");
    const ops = [];
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      ops.push(JSON.parse(trimmed));
    }
    return ops;
  }
  async announce(deviceId, userName) {
    const dir = this.opsDir(deviceId);
    import_node_fs2.default.mkdirSync(dir, { recursive: true });
    const p = import_node_path2.default.join(dir, "device.json");
    const tmp2 = p + ".tmp";
    import_node_fs2.default.writeFileSync(tmp2, JSON.stringify({ deviceId, userName, lastSeenAt: (/* @__PURE__ */ new Date()).toISOString() }), "utf8");
    import_node_fs2.default.renameSync(tmp2, p);
  }
  async listPeers() {
    const opsRoot = import_node_path2.default.join(this.root, "ops");
    if (!import_node_fs2.default.existsSync(opsRoot)) return [];
    const peers = [];
    for (const dev of import_node_fs2.default.readdirSync(opsRoot, { withFileTypes: true })) {
      if (!dev.isDirectory()) continue;
      const p = import_node_path2.default.join(opsRoot, dev.name, "device.json");
      if (!import_node_fs2.default.existsSync(p)) {
        peers.push({ deviceId: dev.name, userName: null, lastSeenAt: null });
        continue;
      }
      try {
        const info = JSON.parse(import_node_fs2.default.readFileSync(p, "utf8"));
        peers.push({ deviceId: dev.name, userName: info.userName ?? null, lastSeenAt: info.lastSeenAt ?? null });
      } catch {
        peers.push({ deviceId: dev.name, userName: null, lastSeenAt: null });
      }
    }
    return peers;
  }
  async putBlob(sha256, data) {
    const dir = import_node_path2.default.join(this.root, "blobs", sha256.slice(0, 2));
    const p = import_node_path2.default.join(dir, sha256);
    if (import_node_fs2.default.existsSync(p)) return false;
    import_node_fs2.default.mkdirSync(dir, { recursive: true });
    const tmp2 = p + ".tmp-" + process.pid;
    import_node_fs2.default.writeFileSync(tmp2, data);
    try {
      import_node_fs2.default.renameSync(tmp2, p);
    } catch {
      import_node_fs2.default.rmSync(tmp2, { force: true });
    }
    return true;
  }
  async getBlob(sha256) {
    const p = import_node_path2.default.join(this.root, "blobs", sha256.slice(0, 2), sha256);
    if (!import_node_fs2.default.existsSync(p)) return null;
    return import_node_fs2.default.readFileSync(p);
  }
};

// electron/sync/engine.ts
var EXPORT_DEBOUNCE_MS = 1500;
var POLL_INTERVAL_MS = 5e3;
var SyncEngine = class {
  constructor(store, userName, onStatus) {
    this.store = store;
    this.userName = userName;
    this.onStatus = onStatus;
  }
  transport = null;
  timer = null;
  exportTimer = null;
  running = false;
  current = Promise.resolve();
  state = "disabled";
  lastError = null;
  lastSyncAt = null;
  userName;
  onStatus;
  setTransport(transport) {
    this.transport = transport;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (transport) {
      const folderKey = transport.location();
      const knownFolder = getMeta(this.store.db, "sync_folder_key");
      if (knownFolder !== folderKey) {
        setMeta(this.store.db, "last_exported_seq", "0");
        this.store.db.prepare("DELETE FROM sync_peers").run();
        setMeta(this.store.db, "sync_folder_key", folderKey);
      }
      this.state = "idle";
      this.timer = setInterval(() => void this.cycle(), POLL_INTERVAL_MS);
      void this.cycle();
    } else {
      this.state = "disabled";
      this.emitStatus();
    }
  }
  /** Update the announced display name (identity can be set after boot). */
  setUserName(name) {
    this.userName = name;
  }
  /** Call after any local mutation — debounced export so rapid edits batch. */
  noteLocalChange() {
    if (!this.transport) return;
    if (this.exportTimer) clearTimeout(this.exportTimer);
    this.exportTimer = setTimeout(() => void this.cycle(), EXPORT_DEBOUNCE_MS);
  }
  async cycle() {
    if (!this.transport || this.running) return this.current;
    this.running = true;
    let release;
    this.current = new Promise((r) => release = r);
    try {
      if (!this.transport.available()) {
        this.setState("offline", "Sync folder is not reachable");
        return;
      }
      this.setState("syncing", null);
      await this.exportOps();
      await this.importOps();
      await this.transport.announce(this.store.deviceId, this.userName);
      this.lastSyncAt = (/* @__PURE__ */ new Date()).toISOString();
      this.setState("idle", null);
    } catch (err) {
      this.setState("error", err instanceof Error ? err.message : String(err));
    } finally {
      this.running = false;
      release();
    }
  }
  async exportOps() {
    if (!this.transport) return;
    const lastExported = Number(getMeta(this.store.db, "last_exported_seq") ?? "0");
    const pending = this.store.opsSince(lastExported, true);
    if (pending.length === 0) return;
    const maxSeq = pending[pending.length - 1].seq;
    const batchName = String(maxSeq).padStart(12, "0") + ".jsonl";
    await this.transport.publishOps(
      this.store.deviceId,
      batchName,
      pending.map((p) => p.op)
    );
    setMeta(this.store.db, "last_exported_seq", String(maxSeq));
  }
  async importOps() {
    if (!this.transport) return;
    const peers = this.store.db.prepare("SELECT device_id, last_file FROM sync_peers").all();
    const afterByDevice = new Map(peers.map((p) => [p.device_id, p.last_file]));
    const batches = await this.transport.listPeerBatches(this.store.deviceId, afterByDevice);
    const stalled = /* @__PURE__ */ new Set();
    for (const b of batches) {
      if (stalled.has(b.deviceId)) continue;
      try {
        const ops = await this.transport.fetchBatch(b.deviceId, b.fileName);
        this.store.applyRemoteOps(ops);
      } catch {
        stalled.add(b.deviceId);
        continue;
      }
      this.store.db.prepare(
        `INSERT INTO sync_peers(device_id, last_file, last_seen_at) VALUES(?,?,?)
           ON CONFLICT(device_id) DO UPDATE SET last_file=excluded.last_file, last_seen_at=excluded.last_seen_at`
      ).run(b.deviceId, b.fileName, (/* @__PURE__ */ new Date()).toISOString());
    }
    for (const p of await this.transport.listPeers()) {
      if (p.deviceId === this.store.deviceId) continue;
      this.store.db.prepare(
        `INSERT INTO sync_peers(device_id, user_name, last_seen_at) VALUES(?,?,?)
           ON CONFLICT(device_id) DO UPDATE SET user_name=COALESCE(excluded.user_name, sync_peers.user_name),
             last_seen_at=COALESCE(excluded.last_seen_at, sync_peers.last_seen_at)`
      ).run(p.deviceId, p.userName, p.lastSeenAt);
    }
  }
  setState(state, error) {
    this.state = state;
    this.lastError = error;
    this.emitStatus();
  }
  emitStatus() {
    this.onStatus(this.status());
  }
  status() {
    const lastExported = Number(getMeta(this.store.db, "last_exported_seq") ?? "0");
    const pendingRow = this.store.db.prepare("SELECT COUNT(*) AS c FROM oplog WHERE seq > ? AND device_id = ?").get(lastExported, this.store.deviceId);
    const conflictRow = this.store.db.prepare("SELECT COUNT(*) AS c FROM sync_conflicts WHERE resolved_at IS NULL").get();
    const peers = this.store.db.prepare("SELECT device_id AS deviceId, user_name AS userName, last_seen_at AS lastSeenAt FROM sync_peers").all();
    return {
      state: this.state,
      folder: this.transport ? this.transport.location() : null,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
      pendingOps: pendingRow.c,
      openConflicts: conflictRow.c,
      peers
    };
  }
  /** Stops timers and waits for any in-flight cycle — safe to close the DB afterwards. */
  async stop() {
    if (this.timer) clearInterval(this.timer);
    if (this.exportTimer) clearTimeout(this.exportTimer);
    this.timer = null;
    this.exportTimer = null;
    await this.current;
  }
};

// electron/db/seed.ts
function loadSeedData(store) {
  const existing = store.db.prepare("SELECT 1 FROM items WHERE sample=1 AND deleted=0 LIMIT 1").get();
  if (existing) return 0;
  const m1 = store.upsertMilestone({ name: "Discovery & Access", targetDate: "2026-08-15", status: "active", sort: 1, sample: 1, description: "Secure system access, inventory knowledge sources, confirm scope with leadership." });
  const m2 = store.upsertMilestone({ name: "Knowledge Pipeline MVP", targetDate: "2026-10-01", status: "planned", sort: 2, sample: 1, description: "Ingest, clean, and index the first knowledge domain end to end." });
  const m3 = store.upsertMilestone({ name: "Pilot with Support Team", targetDate: "2026-12-01", status: "planned", sort: 3, sample: 1, description: "Limited pilot: measure deflection, accuracy, and agent satisfaction." });
  store.upsertRelease({ name: "Support AI Pilot 0.1", version: "0.1", targetDate: "2026-11-15", status: "planned", goals: "First internal pilot build: single knowledge domain, 10 support agents, feedback loop in place.", sample: 1 });
  const milestoneId = { m1: m1.id, m2: m2.id, m3: m3.id };
  const items = [
    // Features
    { key: "featAnswer", type: "feature", title: "AI answer generation over knowledge base", status: "in_progress", priority: "high", owner: "john", milestone: "m2", leadershipVisible: true, bodyText: "Core capability: given a support question, retrieve relevant knowledge articles and generate a grounded, cited answer." },
    { key: "featIngest", type: "feature", title: "Knowledge ingestion pipeline (Salesforce KA export)", status: "in_progress", priority: "urgent", owner: "john", milestone: "m2", leadershipVisible: true, bodyText: "Export knowledge articles, normalize to clean text, chunk, and index for retrieval." },
    { key: "featFeedback", type: "feature", title: "Agent feedback capture (thumbs + reason codes)", status: "backlog", priority: "medium", owner: "mark", milestone: "m3", bodyText: "Pilot agents rate each AI answer; reasons feed the quality dashboard." },
    // Requirements
    { key: "reqCitations", type: "requirement", title: "Every AI answer must cite its source articles", status: "todo", priority: "high", owner: "john", milestone: "m2", extra: { acceptanceCriteria: "Answer UI shows at least one source link per answer; uncited answers are suppressed.", securityConsiderations: "Citations must not expose restricted articles to unauthorized agents." } },
    { key: "reqPHI", type: "requirement", title: "No PHI or customer data may leave approved systems", status: "in_progress", priority: "urgent", owner: "mark", leadershipVisible: true, extra: { acceptanceCriteria: "Data flow diagram approved by security; DLP scan of pipeline output shows zero PHI.", securityConsiderations: "Blocking requirement for any external AI service." } },
    { key: "reqFreshness", type: "requirement", title: "Knowledge index refreshes within 24h of article updates", status: "backlog", priority: "medium", owner: "john", milestone: "m2", extra: { acceptanceCriteria: "Article edited in source system appears in retrieval results within 24 hours." } },
    // Tasks
    { key: "taskExport", type: "task", title: "Build Salesforce knowledge article export script", status: "done", priority: "high", owner: "john", milestone: "m1", bodyText: "Export all published KAs with metadata to structured files." },
    { key: "taskClean", type: "task", title: "HTML\u2192clean text normalization for exported articles", status: "in_progress", priority: "high", owner: "john", milestone: "m2", dueDate: "2026-07-24" },
    { key: "taskEval", type: "task", title: "Draft answer-quality evaluation rubric", status: "todo", priority: "medium", owner: "mark", milestone: "m2", dueDate: "2026-07-31" },
    { key: "taskInventory", type: "task", title: "Inventory candidate knowledge domains and article counts", status: "done", priority: "medium", owner: "john", milestone: "m1" },
    // Access requests
    { key: "accSfApi", type: "access", title: "Salesforce API access (Knowledge object, read)", status: "requested", priority: "urgent", owner: "john", leadershipVisible: true, extra: { system: "Salesforce Service Cloud", accessType: "API read (Knowledge object)", businessReason: "Automated export of knowledge articles for the ingestion pipeline.", requestedFrom: "Salesforce platform team", requestDate: "2026-06-30", nextAction: "Follow up with platform team lead", followUpDate: "2026-07-15" } },
    { key: "accAzure", type: "access", title: "Azure OpenAI service provisioning in McKesson tenant", status: "under_review", priority: "urgent", owner: "mark", leadershipVisible: true, extra: { system: "Azure OpenAI (McKesson tenant)", accessType: "Resource provisioning + API keys", businessReason: "Approved-tenant LLM required for answer generation without data egress.", requestedFrom: "Cloud platform / security", requestDate: "2026-06-22", nextAction: "Security review meeting", followUpDate: "2026-07-18" } },
    { key: "accSp", type: "access", title: "SharePoint site for pilot documentation", status: "granted", priority: "low", owner: "mark", extra: { system: "SharePoint Online", accessType: "Site owner", businessReason: "Shared documentation and pilot artifacts.", requestedFrom: "IT service desk", requestDate: "2026-06-10", approvedBy: "IT service desk", dateGranted: "2026-06-12" } },
    // Decisions
    { key: "decTenant", type: "decision", title: "Use tenant-hosted Azure OpenAI, not public APIs", status: "approved", priority: "high", owner: "mark", leadershipVisible: true, extra: { context: "Answer generation needs an LLM. Public AI APIs are unapproved for internal data.", problem: "Which LLM hosting path satisfies security while unblocking the pilot?", options: [{ title: "Public API (OpenAI/Anthropic direct)", notes: "Fast but unapproved for internal data", selected: false }, { title: "Azure OpenAI in McKesson tenant", notes: "Data stays in tenant; procurement + provisioning required", selected: true }, { title: "Local open-weights model", notes: "No egress but weaker quality and heavy infra", selected: false }], reasoning: "Tenant hosting keeps data inside approved boundary and has an existing enterprise agreement path.", tradeoffs: "Slower start; capacity quotas; model availability lags public APIs." } },
    { key: "decDomain", type: "decision", title: "Pilot scope: start with one high-volume knowledge domain", status: "discussing", priority: "medium", owner: "john", extra: { context: "Knowledge base spans many product areas with uneven quality.", problem: "Pilot everything or one domain first?", options: [{ title: "Single domain pilot", notes: "Cleaner measurement, faster iteration", selected: true }, { title: "All domains at once", notes: "Broader impact, diluted quality signal", selected: false }], reasoning: "Single-domain gives a clean accuracy baseline and containable review load." } },
    // Risks
    { key: "riskQuality", type: "risk", title: "Knowledge article quality too low for grounded answers", status: "open", priority: "high", owner: "john", leadershipVisible: true, extra: { likelihood: "medium", impact: "high", mitigation: "Quality audit of the pilot domain before indexing; article cleanup backlog with the knowledge team." } },
    { key: "riskAccess", type: "risk", title: "Access approvals slip and stall the pipeline build", status: "mitigating", priority: "high", owner: "mark", leadershipVisible: true, extra: { likelihood: "high", impact: "high", mitigation: "Weekly follow-ups; leadership escalation path agreed; build pipeline against exported sample data meanwhile." } },
    // Blockers
    { key: "blkAzure", type: "blocker", title: "Cannot generate answers until Azure OpenAI is provisioned", status: "active", priority: "urgent", owner: "mark", leadershipVisible: true, extra: { waitingOn: "Cloud platform team / security review", since: "2026-06-22" } },
    // Meeting
    { key: "mtgKickoff", type: "meeting", title: "Support AI kickoff with knowledge leadership", status: "summarized", owner: "john", extra: { date: "2026-06-18", time: "10:00 AM", attendees: ["John", "Mark", "Allen", "George"], purpose: "Align on pilot scope, access needs, and success measures.", agenda: "1. Vision  2. Pilot scope  3. Access requests  4. Timeline" }, bodyText: "Agreed to single-domain pilot. Allen to sponsor access requests. Success = deflection rate + agent satisfaction. Next check-in in 4 weeks." },
    // Questions / ideas / research
    { key: "qMetrics", type: "question", title: "Which deflection metric does support leadership already trust?", status: "open", owner: "mark", extra: {} },
    { key: "ideaTriage", type: "idea", title: "Auto-triage inbound cases by knowledge coverage", status: "backlog", owner: "john", bodyText: "If retrieval confidence is high, suggest KB-first response before human triage." },
    { key: "resRag", type: "research", title: "Retrieval strategy comparison: hybrid vs pure vector", status: "in_progress", owner: "john", bodyText: "Early result: hybrid (BM25 + vector) noticeably better on product-code queries." }
  ];
  const created = /* @__PURE__ */ new Map();
  for (const s of items) {
    const item = store.createItem({
      type: s.type,
      title: s.title,
      status: s.status,
      priority: s.priority ?? "none",
      ownerId: s.owner ?? null,
      milestoneId: s.milestone ? milestoneId[s.milestone] : null,
      dueDate: s.dueDate ?? null,
      tags: s.tags ?? [],
      extra: s.extra ?? {},
      leadershipVisible: s.leadershipVisible ? 1 : 0,
      bodyText: s.bodyText ?? "",
      body: s.bodyText ? textDoc(s.bodyText) : "",
      sample: 1
    });
    created.set(s.key, item.id);
  }
  const link = (a, b, kind) => {
    const fromId = created.get(a);
    const toId = created.get(b);
    if (fromId && toId) store.addLink(fromId, toId, kind);
  };
  link("taskClean", "featIngest", "implements");
  link("taskExport", "featIngest", "implements");
  link("reqCitations", "featAnswer", "supports");
  link("reqPHI", "featAnswer", "supports");
  link("reqFreshness", "featIngest", "supports");
  link("featAnswer", "decTenant", "shaped_by");
  link("featAnswer", "accAzure", "requires_access");
  link("featIngest", "accSfApi", "requires_access");
  link("blkAzure", "featAnswer", "blocks");
  link("decDomain", "mtgKickoff", "discussed_in");
  link("riskAccess", "accAzure", "relates");
  return items.length;
}
function textDoc(text) {
  return JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
}

// tests/core.test.ts
function tmp(name) {
  const p = import_node_fs3.default.mkdtempSync(import_node_path3.default.join(import_node_os.default.tmpdir(), `tether-${name}-`));
  return p;
}
function mkStore(name, actor) {
  const ctx = openDatabase(tmp(name));
  const store = new Store(ctx, actor);
  return { ctx, store };
}
async function syncBoth(a, b, folder, userA = "John", userB = "Mark") {
  const ea = new SyncEngine(a.store, userA, () => {
  });
  const eb = new SyncEngine(b.store, userB, () => {
  });
  ea.setTransport(new FolderTransport(folder));
  eb.setTransport(new FolderTransport(folder));
  for (let i = 0; i < 3; i++) {
    await ea.cycle();
    await eb.cycle();
  }
  await ea.stop();
  await eb.stop();
}
(0, import_node_test.test)("migrations create schema and device identity", () => {
  const { ctx, store } = mkStore("mig", "john");
  import_strict.default.ok(ctx.deviceId.length > 10);
  import_strict.default.equal(store.listItems().length, 0);
  ctx.db.close();
});
(0, import_node_test.test)("item CRUD, ident allocation, activity, search", () => {
  const { ctx, store } = mkStore("crud", "john");
  const item = store.createItem({ type: "requirement", title: "Answers must cite sources" });
  import_strict.default.equal(item.ident, "REQ-1");
  import_strict.default.equal(item.status, "backlog");
  const second = store.createItem({ type: "requirement", title: "Another requirement" });
  import_strict.default.equal(second.ident, "REQ-2");
  store.updateItem(item.id, { status: "in_progress", priority: "high" });
  const got = store.getItem(item.id);
  import_strict.default.equal(got.status, "in_progress");
  import_strict.default.equal(got.priority, "high");
  store.updateItem(item.id, { status: "done" });
  import_strict.default.ok(store.getItem(item.id).completedAt);
  const results = store.search("cite sources");
  import_strict.default.ok(results.some((r) => r.item.id === item.id));
  import_strict.default.equal(store.getItemByIdent("req-1").id, item.id);
  const activity = store.activityFor(item.id);
  import_strict.default.ok(activity.some((a) => a.kind === "created"));
  import_strict.default.ok(activity.some((a) => a.kind === "updated"));
  store.deleteItem(second.id);
  import_strict.default.equal(store.getItem(second.id), null);
  ctx.db.close();
});
(0, import_node_test.test)("links, comments, versions", () => {
  const { ctx, store } = mkStore("rel", "john");
  const a = store.createItem({ type: "task", title: "Build export" });
  const b = store.createItem({ type: "feature", title: "Ingestion pipeline" });
  store.addLink(a.id, b.id, "implements");
  const links = store.linksFor(a.id);
  import_strict.default.equal(links.length, 1);
  import_strict.default.equal(links[0].other.id, b.id);
  import_strict.default.equal(links[0].direction, "out");
  store.addComment(a.id, '{"type":"doc"}', "looks good");
  import_strict.default.equal(store.commentsFor(a.id).length, 1);
  store.saveVersion(a.id);
  store.updateItem(a.id, { title: "Build export v2" });
  const versions = store.versionsFor(a.id);
  import_strict.default.equal(versions.length, 1);
  import_strict.default.equal(versions[0].title, "Build export");
  ctx.db.close();
});
(0, import_node_test.test)("sync: two devices converge through a shared folder", async () => {
  const a = mkStore("syncA", "john");
  const b = mkStore("syncB", "mark");
  const folder = tmp("shared");
  const itemA = a.store.createItem({ type: "task", title: "From John" });
  const itemB = b.store.createItem({ type: "decision", title: "From Mark" });
  await syncBoth(a, b, folder);
  import_strict.default.ok(b.store.getItem(itemA.id), "B received A item");
  import_strict.default.ok(a.store.getItem(itemB.id), "A received B item");
  import_strict.default.equal(b.store.getItem(itemA.id).title, "From John");
  b.store.updateItem(itemA.id, { status: "in_progress" });
  await syncBoth(a, b, folder);
  import_strict.default.equal(a.store.getItem(itemA.id).status, "in_progress");
  a.ctx.db.close();
  b.ctx.db.close();
});
(0, import_node_test.test)("sync: concurrent title edits surface a conflict, LWW applies, resolution converges", async () => {
  const a = mkStore("confA", "john");
  const b = mkStore("confB", "mark");
  const folder = tmp("sharedc");
  const item = a.store.createItem({ type: "task", title: "Original" });
  await syncBoth(a, b, folder);
  import_strict.default.ok(b.store.getItem(item.id));
  a.store.updateItem(item.id, { title: "John version" });
  b.store.updateItem(item.id, { title: "Mark version" });
  await syncBoth(a, b, folder);
  const ta = a.store.getItem(item.id).title;
  const tb = b.store.getItem(item.id).title;
  import_strict.default.equal(ta, tb, "LWW converged");
  const conflicts = [...a.store.listConflicts(true), ...b.store.listConflicts(true)];
  import_strict.default.ok(conflicts.length >= 1, "conflict surfaced");
  import_strict.default.ok(conflicts.some((c) => c.field === "title"));
  const side = a.store.listConflicts(true).length ? a : b;
  const conflict = side.store.listConflicts(true)[0];
  side.store.resolveConflict(conflict.id, "merged", "Merged title");
  await syncBoth(a, b, folder);
  import_strict.default.equal(a.store.getItem(item.id).title, "Merged title");
  import_strict.default.equal(b.store.getItem(item.id).title, "Merged title");
  a.ctx.db.close();
  b.ctx.db.close();
});
(0, import_node_test.test)("sync: ident collision renumbers and converges", async () => {
  const a = mkStore("idA", "john");
  const b = mkStore("idB", "mark");
  const folder = tmp("sharedi");
  const ia = a.store.createItem({ type: "task", title: "A task" });
  const ib = b.store.createItem({ type: "task", title: "B task" });
  import_strict.default.equal(ia.ident, "TASK-1");
  import_strict.default.equal(ib.ident, "TASK-1");
  await syncBoth(a, b, folder);
  await syncBoth(a, b, folder);
  const aIdents = [a.store.getItem(ia.id).ident, a.store.getItem(ib.id).ident].sort();
  const bIdents = [b.store.getItem(ia.id).ident, b.store.getItem(ib.id).ident].sort();
  import_strict.default.notEqual(aIdents[0], aIdents[1], "idents unique on A");
  import_strict.default.notEqual(bIdents[0], bIdents[1], "idents unique on B");
  import_strict.default.deepEqual(aIdents, bIdents, "both sides agree on idents");
  a.ctx.db.close();
  b.ctx.db.close();
});
(0, import_node_test.test)("sync: offline edits queue and flush when folder returns", async () => {
  const a = mkStore("offA", "john");
  const folder = tmp("sharedo");
  const engine = new SyncEngine(a.store, "John", () => {
  });
  a.store.createItem({ type: "task", title: "Made offline" });
  import_strict.default.ok(engine.status().pendingOps > 0 || engine.status().state === "disabled");
  engine.setTransport(new FolderTransport(folder));
  await engine.cycle();
  import_strict.default.equal(engine.status().pendingOps, 0, "ops exported after transport attached");
  await engine.stop();
  a.ctx.db.close();
});
(0, import_node_test.test)("seed data loads, is flagged, and removes cleanly", () => {
  const { ctx, store } = mkStore("seed", "john");
  const n = loadSeedData(store);
  import_strict.default.ok(n > 15);
  const samples = store.listItems({ sample: true }, { field: "createdAt", dir: "asc" }, 100);
  import_strict.default.equal(samples.length, n);
  const withLinks = samples.filter((s) => store.linksFor(s.id).length > 0);
  import_strict.default.ok(withLinks.length > 5);
  const removed = store.removeSampleData();
  import_strict.default.equal(removed, n);
  import_strict.default.equal(store.listItems({}, { field: "createdAt", dir: "asc" }, 100).length, 0);
  ctx.db.close();
});
(0, import_node_test.test)("database integrity guard quarantines corruption", () => {
  const dir = tmp("corrupt");
  const ctx = openDatabase(dir);
  ctx.db.close();
  const dbPath = import_node_path3.default.join(dir, "tether.db");
  const fd = import_node_fs3.default.openSync(dbPath, "r+");
  import_node_fs3.default.writeSync(fd, Buffer.from("GARBAGEGARBAGEGARBAGE"), 0, 21, 0);
  import_node_fs3.default.closeSync(fd);
  import_strict.default.throws(() => openDatabase(dir), /integrity|malformed|not a database/i);
});
(0, import_node_test.test)("out-of-order remote ops: set/delete arriving before create are buffered, not lost", () => {
  const a = mkStore("reorder", "john");
  const itemId = "00000000-aaaa-4000-8000-000000000001";
  const setOp = {
    opId: "op-set-1",
    deviceId: "device-B",
    actorId: "mark",
    lamport: 10,
    at: (/* @__PURE__ */ new Date()).toISOString(),
    entity: "item",
    entityId: itemId,
    action: "set",
    payload: { fields: { status: "in_progress" }, basedOn: { status: null } }
  };
  const createOp = {
    opId: "op-create-1",
    deviceId: "device-A",
    actorId: "john",
    lamport: 5,
    at: (/* @__PURE__ */ new Date()).toISOString(),
    entity: "item",
    entityId: itemId,
    action: "create",
    payload: {
      record: {
        id: itemId,
        ident: "TASK-900",
        type: "task",
        title: "Reordered item",
        body: "",
        bodyText: "",
        status: "todo",
        priority: "medium",
        ownerId: null,
        reporterId: "john",
        milestoneId: null,
        releaseId: null,
        parentId: null,
        startDate: null,
        dueDate: null,
        completedAt: null,
        effort: null,
        confidence: null,
        riskLevel: null,
        businessValue: null,
        leadershipVisible: 0,
        progress: null,
        tags: [],
        extra: {},
        archived: 0,
        sample: 0,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        createdBy: "john",
        updatedBy: "john"
      }
    }
  };
  a.store.applyRemoteOps([setOp]);
  import_strict.default.equal(a.store.getItem(itemId), null);
  a.store.applyRemoteOps([createOp]);
  const item = a.store.getItem(itemId);
  import_strict.default.ok(item, "item created");
  import_strict.default.equal(item.status, "in_progress", "buffered set applied after create");
  const item2 = "00000000-bbbb-4000-8000-000000000002";
  a.store.applyRemoteOps([
    { ...setOp, opId: "op-del-2", entityId: item2, action: "delete", lamport: 20, payload: {} }
  ]);
  a.store.applyRemoteOps([
    {
      ...createOp,
      opId: "op-create-2",
      entityId: item2,
      lamport: 6,
      payload: { record: { ...createOp.payload.record, id: item2, ident: "TASK-901" } }
    }
  ]);
  import_strict.default.equal(a.store.getItem(item2), null, "delete-before-create does not resurrect the item");
  a.ctx.db.close();
});
(0, import_node_test.test)("auditability: milestones/releases carry created+updated attribution and log activity", () => {
  const { ctx, store } = mkStore("audit-ms", "john");
  const m = store.upsertMilestone({ name: "Discovery" });
  const row = ctx.db.prepare("SELECT created_at, created_by, updated_at, updated_by FROM milestones WHERE id=?").get(m.id);
  import_strict.default.ok(row.created_at && row.created_by === "john" && row.updated_at && row.updated_by === "john");
  const act = store.activityFor(null, 50);
  import_strict.default.ok(act.some((a) => a.kind === "milestone_created" && a.newValue === "Discovery"));
  store.actorId = "mark";
  store.upsertMilestone({ id: m.id, name: "Discovery & Access" });
  const row2 = ctx.db.prepare("SELECT created_by, updated_by FROM milestones WHERE id=?").get(m.id);
  import_strict.default.equal(row2.created_by, "john", "creator preserved");
  import_strict.default.equal(row2.updated_by, "mark", "last editor recorded");
  import_strict.default.ok(store.activityFor(null, 50).some((a) => a.kind === "milestone_updated"));
  ctx.db.close();
});
(0, import_node_test.test)("auditability: soft-delete only, deletes attributed and logged, nothing physically removed", () => {
  const { ctx, store } = mkStore("audit-del", "john");
  const item = store.createItem({ type: "task", title: "Temp" });
  const c = store.addComment(item.id, "{}", "a comment");
  store.deleteComment(c.id);
  store.deleteItem(item.id);
  const crow = ctx.db.prepare("SELECT deleted, deleted_by FROM comments WHERE id=?").get(c.id);
  import_strict.default.equal(crow.deleted, 1);
  import_strict.default.equal(crow.deleted_by, "john");
  const irow = ctx.db.prepare("SELECT deleted, deleted_by, deleted_at FROM items WHERE id=?").get(item.id);
  import_strict.default.equal(irow.deleted, 1);
  import_strict.default.equal(irow.deleted_by, "john");
  import_strict.default.ok(irow.deleted_at);
  import_strict.default.ok(ctx.db.prepare("SELECT 1 FROM comments WHERE id=?").get(c.id));
  import_strict.default.ok(ctx.db.prepare("SELECT 1 FROM items WHERE id=?").get(item.id));
  const act = store.activityFor(item.id, 50);
  import_strict.default.ok(act.some((a) => a.kind === "deleted"));
  import_strict.default.ok(act.some((a) => a.kind === "comment_deleted"));
  ctx.db.close();
});
(0, import_node_test.test)("team: removing a member is a synced soft delete; re-adding revives the row", async () => {
  const a = mkStore("teamA", "john");
  const b = mkStore("teamB", "mark");
  const folder = tmp("team");
  a.store.upsertUser({ id: "john", name: "John Crouch", initials: "JC", color: "#6E8BFF" });
  b.store.upsertUser({ id: "mark", name: "Mark Bidinger", initials: "MB", color: "#4CC38A" });
  a.store.upsertUser({ id: "jessica", name: "Jessica Bradford", initials: "JB", color: "#C77DFF" });
  await syncBoth(a, b, folder);
  import_strict.default.deepEqual(b.store.listUsers().map((u) => u.id).sort(), ["jessica", "john", "mark"]);
  import_strict.default.equal(a.store.deleteUser("mark"), true);
  import_strict.default.equal(a.store.deleteUser("mark"), false, "second delete is a no-op");
  await syncBoth(a, b, folder);
  import_strict.default.deepEqual(a.store.listUsers().map((u) => u.id).sort(), ["jessica", "john"]);
  import_strict.default.deepEqual(b.store.listUsers().map((u) => u.id).sort(), ["jessica", "john"]);
  const row = b.ctx.db.prepare("SELECT deleted, name FROM users WHERE id=?").get("mark");
  import_strict.default.equal(row.deleted, 1);
  import_strict.default.equal(row.name, "Mark Bidinger");
  b.store.upsertUser({ id: "mark", name: "Mark Bidinger", initials: "MB", color: "#4CC38A" });
  import_strict.default.ok(b.store.listUsers().some((u) => u.id === "mark"));
  await syncBoth(a, b, folder);
  import_strict.default.ok(a.store.listUsers().some((u) => u.id === "mark"), "revival synced to A");
  a.ctx.db.close();
  b.ctx.db.close();
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vdGVzdHMvY29yZS50ZXN0LnRzIiwgIi4uL2VsZWN0cm9uL2RiL2RiLnRzIiwgIi4uL2VsZWN0cm9uL2RiL21pZ3JhdGlvbnMudHMiLCAiLi4vZWxlY3Ryb24vZGIvc3RvcmUudHMiLCAiLi4vc2hhcmVkL3R5cGVzLnRzIiwgIi4uL3NoYXJlZC9kb2MudHMiLCAiLi4vZWxlY3Ryb24vc3luYy90cmFuc3BvcnQudHMiLCAiLi4vZWxlY3Ryb24vc3luYy9lbmdpbmUudHMiLCAiLi4vZWxlY3Ryb24vZGIvc2VlZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gQ29yZSBkYXRhLWxheWVyICsgc3luYyB0ZXN0cy4gUnVuIHdpdGg6IG5wbSB0ZXN0XHJcbi8vIChidW5kbGVkIGJ5IHNjcmlwdHMvcnVuLXRlc3RzLm1qcyBhbmQgZXhlY3V0ZWQgdW5kZXIgRWxlY3Ryb24ncyBOb2RlIHZpYSBFTEVDVFJPTl9SVU5fQVNfTk9ERVxyXG4vLyAgc28gYmV0dGVyLXNxbGl0ZTMncyBFbGVjdHJvbi1BQkkgYnVpbGQgbG9hZHMuKVxyXG5cclxuaW1wb3J0IHsgdGVzdCB9IGZyb20gJ25vZGU6dGVzdCc7XHJcbmltcG9ydCBhc3NlcnQgZnJvbSAnbm9kZTphc3NlcnQvc3RyaWN0JztcclxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xyXG5pbXBvcnQgb3MgZnJvbSAnbm9kZTpvcyc7XHJcbmltcG9ydCB7IG9wZW5EYXRhYmFzZSwgdHlwZSBEYkNvbnRleHQgfSBmcm9tICcuLi9lbGVjdHJvbi9kYi9kYic7XHJcbmltcG9ydCB7IFN0b3JlIH0gZnJvbSAnLi4vZWxlY3Ryb24vZGIvc3RvcmUnO1xyXG5pbXBvcnQgeyBGb2xkZXJUcmFuc3BvcnQgfSBmcm9tICcuLi9lbGVjdHJvbi9zeW5jL3RyYW5zcG9ydCc7XHJcbmltcG9ydCB7IFN5bmNFbmdpbmUgfSBmcm9tICcuLi9lbGVjdHJvbi9zeW5jL2VuZ2luZSc7XHJcbmltcG9ydCB7IGxvYWRTZWVkRGF0YSB9IGZyb20gJy4uL2VsZWN0cm9uL2RiL3NlZWQnO1xyXG5cclxuZnVuY3Rpb24gdG1wKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgY29uc3QgcCA9IGZzLm1rZHRlbXBTeW5jKHBhdGguam9pbihvcy50bXBkaXIoKSwgYHRldGhlci0ke25hbWV9LWApKTtcclxuICByZXR1cm4gcDtcclxufVxyXG5cclxuZnVuY3Rpb24gbWtTdG9yZShuYW1lOiBzdHJpbmcsIGFjdG9yOiBzdHJpbmcpOiB7IGN0eDogRGJDb250ZXh0OyBzdG9yZTogU3RvcmUgfSB7XHJcbiAgY29uc3QgY3R4ID0gb3BlbkRhdGFiYXNlKHRtcChuYW1lKSk7XHJcbiAgY29uc3Qgc3RvcmUgPSBuZXcgU3RvcmUoY3R4LCBhY3Rvcik7XHJcbiAgcmV0dXJuIHsgY3R4LCBzdG9yZSB9O1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzeW5jQm90aChhOiB7IHN0b3JlOiBTdG9yZSB9LCBiOiB7IHN0b3JlOiBTdG9yZSB9LCBmb2xkZXI6IHN0cmluZywgdXNlckEgPSAnSm9obicsIHVzZXJCID0gJ01hcmsnKSB7XHJcbiAgY29uc3QgZWEgPSBuZXcgU3luY0VuZ2luZShhLnN0b3JlLCB1c2VyQSwgKCkgPT4ge30pO1xyXG4gIGNvbnN0IGViID0gbmV3IFN5bmNFbmdpbmUoYi5zdG9yZSwgdXNlckIsICgpID0+IHt9KTtcclxuICBlYS5zZXRUcmFuc3BvcnQobmV3IEZvbGRlclRyYW5zcG9ydChmb2xkZXIpKTtcclxuICBlYi5zZXRUcmFuc3BvcnQobmV3IEZvbGRlclRyYW5zcG9ydChmb2xkZXIpKTtcclxuICAvLyBUd28gY3ljbGVzIGVhY2ggc28gcmVudW1iZXItcmVicm9hZGNhc3RzIGFuZCBjcm9zcy1pbXBvcnRzIHNldHRsZS5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xyXG4gICAgYXdhaXQgZWEuY3ljbGUoKTtcclxuICAgIGF3YWl0IGViLmN5Y2xlKCk7XHJcbiAgfVxyXG4gIGF3YWl0IGVhLnN0b3AoKTtcclxuICBhd2FpdCBlYi5zdG9wKCk7XHJcbn1cclxuXHJcbnRlc3QoJ21pZ3JhdGlvbnMgY3JlYXRlIHNjaGVtYSBhbmQgZGV2aWNlIGlkZW50aXR5JywgKCkgPT4ge1xyXG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgnbWlnJywgJ2pvaG4nKTtcclxuICBhc3NlcnQub2soY3R4LmRldmljZUlkLmxlbmd0aCA+IDEwKTtcclxuICBhc3NlcnQuZXF1YWwoc3RvcmUubGlzdEl0ZW1zKCkubGVuZ3RoLCAwKTtcclxuICBjdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdpdGVtIENSVUQsIGlkZW50IGFsbG9jYXRpb24sIGFjdGl2aXR5LCBzZWFyY2gnLCAoKSA9PiB7XHJcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdjcnVkJywgJ2pvaG4nKTtcclxuICBjb25zdCBpdGVtID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnQW5zd2VycyBtdXN0IGNpdGUgc291cmNlcycgfSk7XHJcbiAgYXNzZXJ0LmVxdWFsKGl0ZW0uaWRlbnQsICdSRVEtMScpO1xyXG4gIGFzc2VydC5lcXVhbChpdGVtLnN0YXR1cywgJ2JhY2tsb2cnKTtcclxuXHJcbiAgY29uc3Qgc2Vjb25kID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnQW5vdGhlciByZXF1aXJlbWVudCcgfSk7XHJcbiAgYXNzZXJ0LmVxdWFsKHNlY29uZC5pZGVudCwgJ1JFUS0yJyk7XHJcblxyXG4gIHN0b3JlLnVwZGF0ZUl0ZW0oaXRlbS5pZCwgeyBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAnaGlnaCcgfSk7XHJcbiAgY29uc3QgZ290ID0gc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSE7XHJcbiAgYXNzZXJ0LmVxdWFsKGdvdC5zdGF0dXMsICdpbl9wcm9ncmVzcycpO1xyXG4gIGFzc2VydC5lcXVhbChnb3QucHJpb3JpdHksICdoaWdoJyk7XHJcblxyXG4gIC8vIGRvbmUgXHUyMTkyIGNvbXBsZXRlZEF0IHNldFxyXG4gIHN0b3JlLnVwZGF0ZUl0ZW0oaXRlbS5pZCwgeyBzdGF0dXM6ICdkb25lJyB9KTtcclxuICBhc3NlcnQub2soc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEuY29tcGxldGVkQXQpO1xyXG5cclxuICAvLyBzZWFyY2ggaGl0cyB0aXRsZVxyXG4gIGNvbnN0IHJlc3VsdHMgPSBzdG9yZS5zZWFyY2goJ2NpdGUgc291cmNlcycpO1xyXG4gIGFzc2VydC5vayhyZXN1bHRzLnNvbWUoKHIpID0+IHIuaXRlbS5pZCA9PT0gaXRlbS5pZCkpO1xyXG5cclxuICAvLyBieSBpZGVudFxyXG4gIGFzc2VydC5lcXVhbChzdG9yZS5nZXRJdGVtQnlJZGVudCgncmVxLTEnKSEuaWQsIGl0ZW0uaWQpO1xyXG5cclxuICBjb25zdCBhY3Rpdml0eSA9IHN0b3JlLmFjdGl2aXR5Rm9yKGl0ZW0uaWQpIGFzIHsga2luZDogc3RyaW5nIH1bXTtcclxuICBhc3NlcnQub2soYWN0aXZpdHkuc29tZSgoYSkgPT4gYS5raW5kID09PSAnY3JlYXRlZCcpKTtcclxuICBhc3NlcnQub2soYWN0aXZpdHkuc29tZSgoYSkgPT4gYS5raW5kID09PSAndXBkYXRlZCcpKTtcclxuXHJcbiAgLy8gZGVsZXRlIGhpZGVzIGZyb20gcXVlcmllc1xyXG4gIHN0b3JlLmRlbGV0ZUl0ZW0oc2Vjb25kLmlkKTtcclxuICBhc3NlcnQuZXF1YWwoc3RvcmUuZ2V0SXRlbShzZWNvbmQuaWQpLCBudWxsKTtcclxuICBjdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdsaW5rcywgY29tbWVudHMsIHZlcnNpb25zJywgKCkgPT4ge1xyXG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgncmVsJywgJ2pvaG4nKTtcclxuICBjb25zdCBhID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdCdWlsZCBleHBvcnQnIH0pO1xyXG4gIGNvbnN0IGIgPSBzdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0luZ2VzdGlvbiBwaXBlbGluZScgfSk7XHJcbiAgc3RvcmUuYWRkTGluayhhLmlkLCBiLmlkLCAnaW1wbGVtZW50cycpO1xyXG4gIGNvbnN0IGxpbmtzID0gc3RvcmUubGlua3NGb3IoYS5pZCk7XHJcbiAgYXNzZXJ0LmVxdWFsKGxpbmtzLmxlbmd0aCwgMSk7XHJcbiAgYXNzZXJ0LmVxdWFsKGxpbmtzWzBdLm90aGVyLmlkLCBiLmlkKTtcclxuICBhc3NlcnQuZXF1YWwobGlua3NbMF0uZGlyZWN0aW9uLCAnb3V0Jyk7XHJcblxyXG4gIHN0b3JlLmFkZENvbW1lbnQoYS5pZCwgJ3tcInR5cGVcIjpcImRvY1wifScsICdsb29rcyBnb29kJyk7XHJcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmNvbW1lbnRzRm9yKGEuaWQpLmxlbmd0aCwgMSk7XHJcblxyXG4gIHN0b3JlLnNhdmVWZXJzaW9uKGEuaWQpO1xyXG4gIHN0b3JlLnVwZGF0ZUl0ZW0oYS5pZCwgeyB0aXRsZTogJ0J1aWxkIGV4cG9ydCB2MicgfSk7XHJcbiAgY29uc3QgdmVyc2lvbnMgPSBzdG9yZS52ZXJzaW9uc0ZvcihhLmlkKSBhcyB7IHRpdGxlOiBzdHJpbmcgfVtdO1xyXG4gIGFzc2VydC5lcXVhbCh2ZXJzaW9ucy5sZW5ndGgsIDEpO1xyXG4gIGFzc2VydC5lcXVhbCh2ZXJzaW9uc1swXS50aXRsZSwgJ0J1aWxkIGV4cG9ydCcpO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuXHJcbnRlc3QoJ3N5bmM6IHR3byBkZXZpY2VzIGNvbnZlcmdlIHRocm91Z2ggYSBzaGFyZWQgZm9sZGVyJywgYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnN0IGEgPSBta1N0b3JlKCdzeW5jQScsICdqb2huJyk7XHJcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ3N5bmNCJywgJ21hcmsnKTtcclxuICBjb25zdCBmb2xkZXIgPSB0bXAoJ3NoYXJlZCcpO1xyXG5cclxuICBjb25zdCBpdGVtQSA9IGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdGcm9tIEpvaG4nIH0pO1xyXG4gIGNvbnN0IGl0ZW1CID0gYi5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ2RlY2lzaW9uJywgdGl0bGU6ICdGcm9tIE1hcmsnIH0pO1xyXG5cclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xyXG5cclxuICBhc3NlcnQub2soYi5zdG9yZS5nZXRJdGVtKGl0ZW1BLmlkKSwgJ0IgcmVjZWl2ZWQgQSBpdGVtJyk7XHJcbiAgYXNzZXJ0Lm9rKGEuc3RvcmUuZ2V0SXRlbShpdGVtQi5pZCksICdBIHJlY2VpdmVkIEIgaXRlbScpO1xyXG4gIGFzc2VydC5lcXVhbChiLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpIS50aXRsZSwgJ0Zyb20gSm9obicpO1xyXG5cclxuICAvLyBFZGl0IG9uIEIgcHJvcGFnYXRlcyB0byBBXHJcbiAgYi5zdG9yZS51cGRhdGVJdGVtKGl0ZW1BLmlkLCB7IHN0YXR1czogJ2luX3Byb2dyZXNzJyB9KTtcclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xyXG4gIGFzc2VydC5lcXVhbChhLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpIS5zdGF0dXMsICdpbl9wcm9ncmVzcycpO1xyXG5cclxuICBhLmN0eC5kYi5jbG9zZSgpO1xyXG4gIGIuY3R4LmRiLmNsb3NlKCk7XHJcbn0pO1xyXG5cclxudGVzdCgnc3luYzogY29uY3VycmVudCB0aXRsZSBlZGl0cyBzdXJmYWNlIGEgY29uZmxpY3QsIExXVyBhcHBsaWVzLCByZXNvbHV0aW9uIGNvbnZlcmdlcycsIGFzeW5jICgpID0+IHtcclxuICBjb25zdCBhID0gbWtTdG9yZSgnY29uZkEnLCAnam9obicpO1xyXG4gIGNvbnN0IGIgPSBta1N0b3JlKCdjb25mQicsICdtYXJrJyk7XHJcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRjJyk7XHJcblxyXG4gIGNvbnN0IGl0ZW0gPSBhLnN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnT3JpZ2luYWwnIH0pO1xyXG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XHJcbiAgYXNzZXJ0Lm9rKGIuc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSk7XHJcblxyXG4gIC8vIEJvdGggZWRpdCB0aGUgdGl0bGUgd2hpbGUgXCJvZmZsaW5lXCIgKG5vIHN5bmMgYmV0d2VlbiBlZGl0cykuXHJcbiAgYS5zdG9yZS51cGRhdGVJdGVtKGl0ZW0uaWQsIHsgdGl0bGU6ICdKb2huIHZlcnNpb24nIH0pO1xyXG4gIGIuc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHRpdGxlOiAnTWFyayB2ZXJzaW9uJyB9KTtcclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xyXG5cclxuICAvLyBCb3RoIHNpZGVzIHNob3cgdGhlIHNhbWUgTFdXIHdpbm5lci5cclxuICBjb25zdCB0YSA9IGEuc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEudGl0bGU7XHJcbiAgY29uc3QgdGIgPSBiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlO1xyXG4gIGFzc2VydC5lcXVhbCh0YSwgdGIsICdMV1cgY29udmVyZ2VkJyk7XHJcblxyXG4gIC8vIEF0IGxlYXN0IG9uZSBzaWRlIHJlY29yZGVkIGEgY29uZmxpY3QgZm9yIHJldmlldy5cclxuICBjb25zdCBjb25mbGljdHMgPSBbLi4uYS5zdG9yZS5saXN0Q29uZmxpY3RzKHRydWUpLCAuLi5iLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSldO1xyXG4gIGFzc2VydC5vayhjb25mbGljdHMubGVuZ3RoID49IDEsICdjb25mbGljdCBzdXJmYWNlZCcpO1xyXG4gIGFzc2VydC5vayhjb25mbGljdHMuc29tZSgoYykgPT4gYy5maWVsZCA9PT0gJ3RpdGxlJykpO1xyXG5cclxuICAvLyBSZXNvbHZpbmcgd2l0aCBhIG1lcmdlZCB2YWx1ZSBwcm9wYWdhdGVzLlxyXG4gIGNvbnN0IHNpZGUgPSBhLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSkubGVuZ3RoID8gYSA6IGI7XHJcbiAgY29uc3QgY29uZmxpY3QgPSBzaWRlLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSlbMF07XHJcbiAgc2lkZS5zdG9yZS5yZXNvbHZlQ29uZmxpY3QoY29uZmxpY3QuaWQsICdtZXJnZWQnLCAnTWVyZ2VkIHRpdGxlJyk7XHJcbiAgYXdhaXQgc3luY0JvdGgoYSwgYiwgZm9sZGVyKTtcclxuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW0uaWQpIS50aXRsZSwgJ01lcmdlZCB0aXRsZScpO1xyXG4gIGFzc2VydC5lcXVhbChiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlLCAnTWVyZ2VkIHRpdGxlJyk7XHJcblxyXG4gIGEuY3R4LmRiLmNsb3NlKCk7XHJcbiAgYi5jdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdzeW5jOiBpZGVudCBjb2xsaXNpb24gcmVudW1iZXJzIGFuZCBjb252ZXJnZXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ2lkQScsICdqb2huJyk7XHJcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ2lkQicsICdtYXJrJyk7XHJcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRpJyk7XHJcblxyXG4gIC8vIEJvdGggY3JlYXRlIFRBU0stMSBvZmZsaW5lLlxyXG4gIGNvbnN0IGlhID0gYS5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0EgdGFzaycgfSk7XHJcbiAgY29uc3QgaWIgPSBiLnN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnQiB0YXNrJyB9KTtcclxuICBhc3NlcnQuZXF1YWwoaWEuaWRlbnQsICdUQVNLLTEnKTtcclxuICBhc3NlcnQuZXF1YWwoaWIuaWRlbnQsICdUQVNLLTEnKTtcclxuXHJcbiAgYXdhaXQgc3luY0JvdGgoYSwgYiwgZm9sZGVyKTtcclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpOyAvLyBleHRyYSByb3VuZHMgdG8gc2V0dGxlIHJlbnVtYmVyIGJyb2FkY2FzdHNcclxuXHJcbiAgY29uc3QgYUlkZW50cyA9IFthLnN0b3JlLmdldEl0ZW0oaWEuaWQpIS5pZGVudCwgYS5zdG9yZS5nZXRJdGVtKGliLmlkKSEuaWRlbnRdLnNvcnQoKTtcclxuICBjb25zdCBiSWRlbnRzID0gW2Iuc3RvcmUuZ2V0SXRlbShpYS5pZCkhLmlkZW50LCBiLnN0b3JlLmdldEl0ZW0oaWIuaWQpIS5pZGVudF0uc29ydCgpO1xyXG4gIGFzc2VydC5ub3RFcXVhbChhSWRlbnRzWzBdLCBhSWRlbnRzWzFdLCAnaWRlbnRzIHVuaXF1ZSBvbiBBJyk7XHJcbiAgYXNzZXJ0Lm5vdEVxdWFsKGJJZGVudHNbMF0sIGJJZGVudHNbMV0sICdpZGVudHMgdW5pcXVlIG9uIEInKTtcclxuICBhc3NlcnQuZGVlcEVxdWFsKGFJZGVudHMsIGJJZGVudHMsICdib3RoIHNpZGVzIGFncmVlIG9uIGlkZW50cycpO1xyXG5cclxuICBhLmN0eC5kYi5jbG9zZSgpO1xyXG4gIGIuY3R4LmRiLmNsb3NlKCk7XHJcbn0pO1xyXG5cclxudGVzdCgnc3luYzogb2ZmbGluZSBlZGl0cyBxdWV1ZSBhbmQgZmx1c2ggd2hlbiBmb2xkZXIgcmV0dXJucycsIGFzeW5jICgpID0+IHtcclxuICBjb25zdCBhID0gbWtTdG9yZSgnb2ZmQScsICdqb2huJyk7XHJcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRvJyk7XHJcbiAgY29uc3QgZW5naW5lID0gbmV3IFN5bmNFbmdpbmUoYS5zdG9yZSwgJ0pvaG4nLCAoKSA9PiB7fSk7XHJcblxyXG4gIGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdNYWRlIG9mZmxpbmUnIH0pO1xyXG4gIGFzc2VydC5vayhlbmdpbmUuc3RhdHVzKCkucGVuZGluZ09wcyA+IDAgfHwgZW5naW5lLnN0YXR1cygpLnN0YXRlID09PSAnZGlzYWJsZWQnKTtcclxuXHJcbiAgZW5naW5lLnNldFRyYW5zcG9ydChuZXcgRm9sZGVyVHJhbnNwb3J0KGZvbGRlcikpO1xyXG4gIGF3YWl0IGVuZ2luZS5jeWNsZSgpO1xyXG4gIGFzc2VydC5lcXVhbChlbmdpbmUuc3RhdHVzKCkucGVuZGluZ09wcywgMCwgJ29wcyBleHBvcnRlZCBhZnRlciB0cmFuc3BvcnQgYXR0YWNoZWQnKTtcclxuICBhd2FpdCBlbmdpbmUuc3RvcCgpO1xyXG4gIGEuY3R4LmRiLmNsb3NlKCk7XHJcbn0pO1xyXG5cclxudGVzdCgnc2VlZCBkYXRhIGxvYWRzLCBpcyBmbGFnZ2VkLCBhbmQgcmVtb3ZlcyBjbGVhbmx5JywgKCkgPT4ge1xyXG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgnc2VlZCcsICdqb2huJyk7XHJcbiAgY29uc3QgbiA9IGxvYWRTZWVkRGF0YShzdG9yZSk7XHJcbiAgYXNzZXJ0Lm9rKG4gPiAxNSk7XHJcbiAgY29uc3Qgc2FtcGxlcyA9IHN0b3JlLmxpc3RJdGVtcyh7IHNhbXBsZTogdHJ1ZSB9LCB7IGZpZWxkOiAnY3JlYXRlZEF0JywgZGlyOiAnYXNjJyB9LCAxMDApO1xyXG4gIGFzc2VydC5lcXVhbChzYW1wbGVzLmxlbmd0aCwgbik7XHJcbiAgLy8gbGlua3MgZXhpc3RcclxuICBjb25zdCB3aXRoTGlua3MgPSBzYW1wbGVzLmZpbHRlcigocykgPT4gc3RvcmUubGlua3NGb3Iocy5pZCkubGVuZ3RoID4gMCk7XHJcbiAgYXNzZXJ0Lm9rKHdpdGhMaW5rcy5sZW5ndGggPiA1KTtcclxuXHJcbiAgY29uc3QgcmVtb3ZlZCA9IHN0b3JlLnJlbW92ZVNhbXBsZURhdGEoKTtcclxuICBhc3NlcnQuZXF1YWwocmVtb3ZlZCwgbik7XHJcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmxpc3RJdGVtcyh7fSwgeyBmaWVsZDogJ2NyZWF0ZWRBdCcsIGRpcjogJ2FzYycgfSwgMTAwKS5sZW5ndGgsIDApO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuXHJcbnRlc3QoJ2RhdGFiYXNlIGludGVncml0eSBndWFyZCBxdWFyYW50aW5lcyBjb3JydXB0aW9uJywgKCkgPT4ge1xyXG4gIGNvbnN0IGRpciA9IHRtcCgnY29ycnVwdCcpO1xyXG4gIGNvbnN0IGN0eCA9IG9wZW5EYXRhYmFzZShkaXIpO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG4gIC8vIFN0b21wIHRoZSBmaWxlIGhlYWRlci5cclxuICBjb25zdCBkYlBhdGggPSBwYXRoLmpvaW4oZGlyLCAndGV0aGVyLmRiJyk7XHJcbiAgY29uc3QgZmQgPSBmcy5vcGVuU3luYyhkYlBhdGgsICdyKycpO1xyXG4gIGZzLndyaXRlU3luYyhmZCwgQnVmZmVyLmZyb20oJ0dBUkJBR0VHQVJCQUdFR0FSQkFHRScpLCAwLCAyMSwgMCk7XHJcbiAgZnMuY2xvc2VTeW5jKGZkKTtcclxuICBhc3NlcnQudGhyb3dzKCgpID0+IG9wZW5EYXRhYmFzZShkaXIpLCAvaW50ZWdyaXR5fG1hbGZvcm1lZHxub3QgYSBkYXRhYmFzZS9pKTtcclxufSk7XHJcblxyXG50ZXN0KCdvdXQtb2Ytb3JkZXIgcmVtb3RlIG9wczogc2V0L2RlbGV0ZSBhcnJpdmluZyBiZWZvcmUgY3JlYXRlIGFyZSBidWZmZXJlZCwgbm90IGxvc3QnLCAoKSA9PiB7XHJcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ3Jlb3JkZXInLCAnam9obicpO1xyXG4gIC8vIFNpbXVsYXRlIGRldmljZSBDIHJlY2VpdmluZyBCJ3Mgb3BzIGFib3V0IGFuIGl0ZW0gQkVGT1JFIEEncyBjcmVhdGUgb2YgaXQuXHJcbiAgY29uc3QgaXRlbUlkID0gJzAwMDAwMDAwLWFhYWEtNDAwMC04MDAwLTAwMDAwMDAwMDAwMSc7XHJcbiAgY29uc3Qgc2V0T3AgPSB7XHJcbiAgICBvcElkOiAnb3Atc2V0LTEnLCBkZXZpY2VJZDogJ2RldmljZS1CJywgYWN0b3JJZDogJ21hcmsnLCBsYW1wb3J0OiAxMCwgYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgIGVudGl0eTogJ2l0ZW0nIGFzIGNvbnN0LCBlbnRpdHlJZDogaXRlbUlkLCBhY3Rpb246ICdzZXQnIGFzIGNvbnN0LFxyXG4gICAgcGF5bG9hZDogeyBmaWVsZHM6IHsgc3RhdHVzOiAnaW5fcHJvZ3Jlc3MnIH0sIGJhc2VkT246IHsgc3RhdHVzOiBudWxsIH0gfSxcclxuICB9O1xyXG4gIGNvbnN0IGNyZWF0ZU9wID0ge1xyXG4gICAgb3BJZDogJ29wLWNyZWF0ZS0xJywgZGV2aWNlSWQ6ICdkZXZpY2UtQScsIGFjdG9ySWQ6ICdqb2huJywgbGFtcG9ydDogNSwgYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgIGVudGl0eTogJ2l0ZW0nIGFzIGNvbnN0LCBlbnRpdHlJZDogaXRlbUlkLCBhY3Rpb246ICdjcmVhdGUnIGFzIGNvbnN0LFxyXG4gICAgcGF5bG9hZDoge1xyXG4gICAgICByZWNvcmQ6IHtcclxuICAgICAgICBpZDogaXRlbUlkLCBpZGVudDogJ1RBU0stOTAwJywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ1Jlb3JkZXJlZCBpdGVtJywgYm9keTogJycsIGJvZHlUZXh0OiAnJyxcclxuICAgICAgICBzdGF0dXM6ICd0b2RvJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcklkOiBudWxsLCByZXBvcnRlcklkOiAnam9obicsIG1pbGVzdG9uZUlkOiBudWxsLFxyXG4gICAgICAgIHJlbGVhc2VJZDogbnVsbCwgcGFyZW50SWQ6IG51bGwsIHN0YXJ0RGF0ZTogbnVsbCwgZHVlRGF0ZTogbnVsbCwgY29tcGxldGVkQXQ6IG51bGwsXHJcbiAgICAgICAgZWZmb3J0OiBudWxsLCBjb25maWRlbmNlOiBudWxsLCByaXNrTGV2ZWw6IG51bGwsIGJ1c2luZXNzVmFsdWU6IG51bGwsIGxlYWRlcnNoaXBWaXNpYmxlOiAwLFxyXG4gICAgICAgIHByb2dyZXNzOiBudWxsLCB0YWdzOiBbXSwgZXh0cmE6IHt9LCBhcmNoaXZlZDogMCwgc2FtcGxlOiAwLFxyXG4gICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLCB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICBjcmVhdGVkQnk6ICdqb2huJywgdXBkYXRlZEJ5OiAnam9obicsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH07XHJcblxyXG4gIC8vIFNldCBhcnJpdmVzIGZpcnN0IFx1MjAxNCBtdXN0IGJ1ZmZlciwgaXRlbSBtdXN0IG5vdCBleGlzdCB5ZXQuXHJcbiAgYS5zdG9yZS5hcHBseVJlbW90ZU9wcyhbc2V0T3BdKTtcclxuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW1JZCksIG51bGwpO1xyXG5cclxuICAvLyBDcmVhdGUgYXJyaXZlcyBcdTIwMTQgaXRlbSBhcHBlYXJzIEFORCB0aGUgYnVmZmVyZWQgc2V0IHJlcGxheXMgb24gdG9wLlxyXG4gIGEuc3RvcmUuYXBwbHlSZW1vdGVPcHMoW2NyZWF0ZU9wXSk7XHJcbiAgY29uc3QgaXRlbSA9IGEuc3RvcmUuZ2V0SXRlbShpdGVtSWQpO1xyXG4gIGFzc2VydC5vayhpdGVtLCAnaXRlbSBjcmVhdGVkJyk7XHJcbiAgYXNzZXJ0LmVxdWFsKGl0ZW0hLnN0YXR1cywgJ2luX3Byb2dyZXNzJywgJ2J1ZmZlcmVkIHNldCBhcHBsaWVkIGFmdGVyIGNyZWF0ZScpO1xyXG5cclxuICAvLyBEZWxldGUtYmVmb3JlLWNyZWF0ZSBtdXN0IG5vdCByZXN1cnJlY3Q6IGZyZXNoIGVudGl0eSwgZGVsZXRlIGZpcnN0LCB0aGVuIGNyZWF0ZS5cclxuICBjb25zdCBpdGVtMiA9ICcwMDAwMDAwMC1iYmJiLTQwMDAtODAwMC0wMDAwMDAwMDAwMDInO1xyXG4gIGEuc3RvcmUuYXBwbHlSZW1vdGVPcHMoW1xyXG4gICAgeyAuLi5zZXRPcCwgb3BJZDogJ29wLWRlbC0yJywgZW50aXR5SWQ6IGl0ZW0yLCBhY3Rpb246ICdkZWxldGUnIGFzIGNvbnN0LCBsYW1wb3J0OiAyMCwgcGF5bG9hZDoge30gfSxcclxuICBdKTtcclxuICBhLnN0b3JlLmFwcGx5UmVtb3RlT3BzKFtcclxuICAgIHsgLi4uY3JlYXRlT3AsIG9wSWQ6ICdvcC1jcmVhdGUtMicsIGVudGl0eUlkOiBpdGVtMiwgbGFtcG9ydDogNixcclxuICAgICAgcGF5bG9hZDogeyByZWNvcmQ6IHsgLi4uKGNyZWF0ZU9wLnBheWxvYWQucmVjb3JkIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KSwgaWQ6IGl0ZW0yLCBpZGVudDogJ1RBU0stOTAxJyB9IH0gfSxcclxuICBdKTtcclxuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW0yKSwgbnVsbCwgJ2RlbGV0ZS1iZWZvcmUtY3JlYXRlIGRvZXMgbm90IHJlc3VycmVjdCB0aGUgaXRlbScpO1xyXG5cclxuICBhLmN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuXHJcbnRlc3QoJ2F1ZGl0YWJpbGl0eTogbWlsZXN0b25lcy9yZWxlYXNlcyBjYXJyeSBjcmVhdGVkK3VwZGF0ZWQgYXR0cmlidXRpb24gYW5kIGxvZyBhY3Rpdml0eScsICgpID0+IHtcclxuICBjb25zdCB7IGN0eCwgc3RvcmUgfSA9IG1rU3RvcmUoJ2F1ZGl0LW1zJywgJ2pvaG4nKTtcclxuICBjb25zdCBtID0gc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgbmFtZTogJ0Rpc2NvdmVyeScgfSk7XHJcbiAgY29uc3Qgcm93ID0gY3R4LmRiLnByZXBhcmUoJ1NFTEVDVCBjcmVhdGVkX2F0LCBjcmVhdGVkX2J5LCB1cGRhdGVkX2F0LCB1cGRhdGVkX2J5IEZST00gbWlsZXN0b25lcyBXSEVSRSBpZD0/JykuZ2V0KG0uaWQpIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz47XHJcbiAgYXNzZXJ0Lm9rKHJvdy5jcmVhdGVkX2F0ICYmIHJvdy5jcmVhdGVkX2J5ID09PSAnam9obicgJiYgcm93LnVwZGF0ZWRfYXQgJiYgcm93LnVwZGF0ZWRfYnkgPT09ICdqb2huJyk7XHJcbiAgY29uc3QgYWN0ID0gc3RvcmUuYWN0aXZpdHlGb3IobnVsbCwgNTApIGFzIHsga2luZDogc3RyaW5nOyBuZXdWYWx1ZTogc3RyaW5nIHwgbnVsbCB9W107XHJcbiAgYXNzZXJ0Lm9rKGFjdC5zb21lKChhKSA9PiBhLmtpbmQgPT09ICdtaWxlc3RvbmVfY3JlYXRlZCcgJiYgYS5uZXdWYWx1ZSA9PT0gJ0Rpc2NvdmVyeScpKTtcclxuXHJcbiAgLy8gVXBkYXRlIGJ5IGEgZGlmZmVyZW50IGFjdG9yIC0+IHVwZGF0ZWRfYnkgY2hhbmdlcywgYWN0aXZpdHkgbG9nZ2VkLlxyXG4gIHN0b3JlLmFjdG9ySWQgPSAnbWFyayc7XHJcbiAgc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgaWQ6IG0uaWQsIG5hbWU6ICdEaXNjb3ZlcnkgJiBBY2Nlc3MnIH0pO1xyXG4gIGNvbnN0IHJvdzIgPSBjdHguZGIucHJlcGFyZSgnU0VMRUNUIGNyZWF0ZWRfYnksIHVwZGF0ZWRfYnkgRlJPTSBtaWxlc3RvbmVzIFdIRVJFIGlkPT8nKS5nZXQobS5pZCkgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcclxuICBhc3NlcnQuZXF1YWwocm93Mi5jcmVhdGVkX2J5LCAnam9obicsICdjcmVhdG9yIHByZXNlcnZlZCcpO1xyXG4gIGFzc2VydC5lcXVhbChyb3cyLnVwZGF0ZWRfYnksICdtYXJrJywgJ2xhc3QgZWRpdG9yIHJlY29yZGVkJyk7XHJcbiAgYXNzZXJ0Lm9rKChzdG9yZS5hY3Rpdml0eUZvcihudWxsLCA1MCkgYXMgeyBraW5kOiBzdHJpbmcgfVtdKS5zb21lKChhKSA9PiBhLmtpbmQgPT09ICdtaWxlc3RvbmVfdXBkYXRlZCcpKTtcclxuICBjdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdhdWRpdGFiaWxpdHk6IHNvZnQtZGVsZXRlIG9ubHksIGRlbGV0ZXMgYXR0cmlidXRlZCBhbmQgbG9nZ2VkLCBub3RoaW5nIHBoeXNpY2FsbHkgcmVtb3ZlZCcsICgpID0+IHtcclxuICBjb25zdCB7IGN0eCwgc3RvcmUgfSA9IG1rU3RvcmUoJ2F1ZGl0LWRlbCcsICdqb2huJyk7XHJcbiAgY29uc3QgaXRlbSA9IHN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnVGVtcCcgfSk7XHJcbiAgY29uc3QgYyA9IHN0b3JlLmFkZENvbW1lbnQoaXRlbS5pZCwgJ3t9JywgJ2EgY29tbWVudCcpO1xyXG4gIHN0b3JlLmRlbGV0ZUNvbW1lbnQoYy5pZCk7XHJcbiAgc3RvcmUuZGVsZXRlSXRlbShpdGVtLmlkKTtcclxuXHJcbiAgLy8gUm93cyBzdGlsbCBwaHlzaWNhbGx5IHByZXNlbnQgKHNvZnQgZGVsZXRlKSwgd2l0aCBhdHRyaWJ1dGlvbi5cclxuICBjb25zdCBjcm93ID0gY3R4LmRiLnByZXBhcmUoJ1NFTEVDVCBkZWxldGVkLCBkZWxldGVkX2J5IEZST00gY29tbWVudHMgV0hFUkUgaWQ9PycpLmdldChjLmlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICBhc3NlcnQuZXF1YWwoY3Jvdy5kZWxldGVkLCAxKTtcclxuICBhc3NlcnQuZXF1YWwoY3Jvdy5kZWxldGVkX2J5LCAnam9obicpO1xyXG4gIGNvbnN0IGlyb3cgPSBjdHguZGIucHJlcGFyZSgnU0VMRUNUIGRlbGV0ZWQsIGRlbGV0ZWRfYnksIGRlbGV0ZWRfYXQgRlJPTSBpdGVtcyBXSEVSRSBpZD0/JykuZ2V0KGl0ZW0uaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gIGFzc2VydC5lcXVhbChpcm93LmRlbGV0ZWQsIDEpO1xyXG4gIGFzc2VydC5lcXVhbChpcm93LmRlbGV0ZWRfYnksICdqb2huJyk7XHJcbiAgYXNzZXJ0Lm9rKGlyb3cuZGVsZXRlZF9hdCk7XHJcblxyXG4gIC8vIEJvdGggcGh5c2ljYWwgcm93cyByZW1haW4gaW4gdGhlIGZpbGUuXHJcbiAgYXNzZXJ0Lm9rKGN0eC5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIGNvbW1lbnRzIFdIRVJFIGlkPT8nKS5nZXQoYy5pZCkpO1xyXG4gIGFzc2VydC5vayhjdHguZGIucHJlcGFyZSgnU0VMRUNUIDEgRlJPTSBpdGVtcyBXSEVSRSBpZD0/JykuZ2V0KGl0ZW0uaWQpKTtcclxuXHJcbiAgLy8gRGVsZXRpb25zIGFyZSBpbiB0aGUgYWN0aXZpdHkgbG9nLlxyXG4gIGNvbnN0IGFjdCA9IHN0b3JlLmFjdGl2aXR5Rm9yKGl0ZW0uaWQsIDUwKSBhcyB7IGtpbmQ6IHN0cmluZyB9W107XHJcbiAgYXNzZXJ0Lm9rKGFjdC5zb21lKChhKSA9PiBhLmtpbmQgPT09ICdkZWxldGVkJykpO1xyXG4gIGFzc2VydC5vayhhY3Quc29tZSgoYSkgPT4gYS5raW5kID09PSAnY29tbWVudF9kZWxldGVkJykpO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuXHJcbnRlc3QoJ3RlYW06IHJlbW92aW5nIGEgbWVtYmVyIGlzIGEgc3luY2VkIHNvZnQgZGVsZXRlOyByZS1hZGRpbmcgcmV2aXZlcyB0aGUgcm93JywgYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnN0IGEgPSBta1N0b3JlKCd0ZWFtQScsICdqb2huJyk7XHJcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ3RlYW1CJywgJ21hcmsnKTtcclxuICBjb25zdCBmb2xkZXIgPSB0bXAoJ3RlYW0nKTtcclxuXHJcbiAgYS5zdG9yZS51cHNlcnRVc2VyKHsgaWQ6ICdqb2huJywgbmFtZTogJ0pvaG4gQ3JvdWNoJywgaW5pdGlhbHM6ICdKQycsIGNvbG9yOiAnIzZFOEJGRicgfSk7XHJcbiAgYi5zdG9yZS51cHNlcnRVc2VyKHsgaWQ6ICdtYXJrJywgbmFtZTogJ01hcmsgQmlkaW5nZXInLCBpbml0aWFsczogJ01CJywgY29sb3I6ICcjNENDMzhBJyB9KTtcclxuICBhLnN0b3JlLnVwc2VydFVzZXIoeyBpZDogJ2plc3NpY2EnLCBuYW1lOiAnSmVzc2ljYSBCcmFkZm9yZCcsIGluaXRpYWxzOiAnSkInLCBjb2xvcjogJyNDNzdERkYnIH0pO1xyXG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XHJcbiAgYXNzZXJ0LmRlZXBFcXVhbChiLnN0b3JlLmxpc3RVc2VycygpLm1hcCgodSkgPT4gdS5pZCkuc29ydCgpLCBbJ2plc3NpY2EnLCAnam9obicsICdtYXJrJ10pO1xyXG5cclxuICAvLyBKb2huIHJlbW92ZXMgTWFyay4gTWFyaydzIG93biBtYWNoaW5lIHNlZXMgdGhlIHJlbW92YWwgdG9vLlxyXG4gIGFzc2VydC5lcXVhbChhLnN0b3JlLmRlbGV0ZVVzZXIoJ21hcmsnKSwgdHJ1ZSk7XHJcbiAgYXNzZXJ0LmVxdWFsKGEuc3RvcmUuZGVsZXRlVXNlcignbWFyaycpLCBmYWxzZSwgJ3NlY29uZCBkZWxldGUgaXMgYSBuby1vcCcpO1xyXG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XHJcbiAgYXNzZXJ0LmRlZXBFcXVhbChhLnN0b3JlLmxpc3RVc2VycygpLm1hcCgodSkgPT4gdS5pZCkuc29ydCgpLCBbJ2plc3NpY2EnLCAnam9obiddKTtcclxuICBhc3NlcnQuZGVlcEVxdWFsKGIuc3RvcmUubGlzdFVzZXJzKCkubWFwKCh1KSA9PiB1LmlkKS5zb3J0KCksIFsnamVzc2ljYScsICdqb2huJ10pO1xyXG5cclxuICAvLyBTb2Z0IGRlbGV0ZTogdGhlIHJvdyBhbmQgaXRzIGhpc3Rvcnkgc3RheSBpbiB0aGUgZmlsZSBvbiBib3RoIHNpZGVzLlxyXG4gIGNvbnN0IHJvdyA9IGIuY3R4LmRiLnByZXBhcmUoJ1NFTEVDVCBkZWxldGVkLCBuYW1lIEZST00gdXNlcnMgV0hFUkUgaWQ9PycpLmdldCgnbWFyaycpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gIGFzc2VydC5lcXVhbChyb3cuZGVsZXRlZCwgMSk7XHJcbiAgYXNzZXJ0LmVxdWFsKHJvdy5uYW1lLCAnTWFyayBCaWRpbmdlcicpO1xyXG5cclxuICAvLyBSZS1hZGRpbmcgdGhlIHNhbWUgaWQgKGFkbWluIHBhbmVsIG9yIHNlbGYtb25ib2FyZGluZykgbGlmdHMgdGhlIHRvbWJzdG9uZSBldmVyeXdoZXJlLlxyXG4gIGIuc3RvcmUudXBzZXJ0VXNlcih7IGlkOiAnbWFyaycsIG5hbWU6ICdNYXJrIEJpZGluZ2VyJywgaW5pdGlhbHM6ICdNQicsIGNvbG9yOiAnIzRDQzM4QScgfSk7XHJcbiAgYXNzZXJ0Lm9rKGIuc3RvcmUubGlzdFVzZXJzKCkuc29tZSgodSkgPT4gdS5pZCA9PT0gJ21hcmsnKSk7XHJcbiAgYXdhaXQgc3luY0JvdGgoYSwgYiwgZm9sZGVyKTtcclxuICBhc3NlcnQub2soYS5zdG9yZS5saXN0VXNlcnMoKS5zb21lKCh1KSA9PiB1LmlkID09PSAnbWFyaycpLCAncmV2aXZhbCBzeW5jZWQgdG8gQScpO1xyXG5cclxuICBhLmN0eC5kYi5jbG9zZSgpO1xyXG4gIGIuY3R4LmRiLmNsb3NlKCk7XHJcbn0pO1xyXG4iLCAiaW1wb3J0IERhdGFiYXNlIGZyb20gJ2JldHRlci1zcWxpdGUzJztcclxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcclxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xyXG5pbXBvcnQgY3J5cHRvIGZyb20gJ25vZGU6Y3J5cHRvJztcclxuaW1wb3J0IHsgTUlHUkFUSU9OUyB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcblxyXG5leHBvcnQgdHlwZSBEQiA9IERhdGFiYXNlLkRhdGFiYXNlO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBEYkNvbnRleHQge1xyXG4gIGRiOiBEQjtcclxuICBkZXZpY2VJZDogc3RyaW5nO1xyXG4gIGRhdGFEaXI6IHN0cmluZztcclxuICBkYlBhdGg6IHN0cmluZztcclxufVxyXG5cclxuLyoqXHJcbiAqIE9wZW5zIChvciBjcmVhdGVzKSB0aGUgVGV0aGVyIGRhdGFiYXNlLCBhcHBsaWVzIHBlbmRpbmcgbWlncmF0aW9ucyxcclxuICogYW5kIGd1YXJhbnRlZXMgZGV2aWNlIGlkZW50aXR5IG1ldGFkYXRhLlxyXG4gKlxyXG4gKiBTYWZldHkgcG9zdHVyZTogV0FMIG1vZGUgKyBpbnRlZ3JpdHkgY2hlY2sgb24gb3BlbiArIHRpbWVzdGFtcGVkIGJhY2t1cFxyXG4gKiBiZWZvcmUgYW55IG1pZ3JhdGlvbiBiZXlvbmQgdmVyc2lvbiAwLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG9wZW5EYXRhYmFzZShkYXRhRGlyOiBzdHJpbmcpOiBEYkNvbnRleHQge1xyXG4gIGZzLm1rZGlyU3luYyhkYXRhRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICBjb25zdCBkYlBhdGggPSBwYXRoLmpvaW4oZGF0YURpciwgJ3RldGhlci5kYicpO1xyXG4gIGFwcGx5UGVuZGluZ1Jlc3RvcmUoZGF0YURpciwgZGJQYXRoKTsgLy8gc3dhcCBpbiBhIHN0YWdlZCByZXN0b3JlIGJlZm9yZSBvcGVuaW5nIGFueXRoaW5nXHJcbiAgY29uc3QgZXhpc3RlZCA9IGZzLmV4aXN0c1N5bmMoZGJQYXRoKTtcclxuXHJcbiAgY29uc3QgZGIgPSBuZXcgRGF0YWJhc2UoZGJQYXRoKTtcclxuICBkYi5wcmFnbWEoJ2pvdXJuYWxfbW9kZSA9IFdBTCcpO1xyXG4gIGRiLnByYWdtYSgnZm9yZWlnbl9rZXlzID0gT04nKTtcclxuICBkYi5wcmFnbWEoJ3N5bmNocm9ub3VzID0gTk9STUFMJyk7XHJcblxyXG4gIGlmIChleGlzdGVkKSB7XHJcbiAgICBjb25zdCBjaGVjayA9IGRiLnByYWdtYSgncXVpY2tfY2hlY2snLCB7IHNpbXBsZTogdHJ1ZSB9KTtcclxuICAgIGlmIChjaGVjayAhPT0gJ29rJykge1xyXG4gICAgICAvLyBQcmVzZXJ2ZSB0aGUgZGFtYWdlZCBmaWxlIGZvciByZWNvdmVyeSBhbmQgZmFpbCBsb3VkbHkgXHUyMDE0IG5ldmVyIHJ1biBvbiBhIGNvcnJ1cHQgZGIuXHJcbiAgICAgIGNvbnN0IHF1YXJhbnRpbmUgPSBkYlBhdGggKyAnLmNvcnJ1cHQtJyArIERhdGUubm93KCk7XHJcbiAgICAgIGRiLmNsb3NlKCk7XHJcbiAgICAgIGZzLmNvcHlGaWxlU3luYyhkYlBhdGgsIHF1YXJhbnRpbmUpO1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgYERhdGFiYXNlIGZhaWxlZCBpbnRlZ3JpdHkgY2hlY2sgKCR7Y2hlY2t9KS4gRGFtYWdlZCBjb3B5IHByZXNlcnZlZCBhdCAke3F1YXJhbnRpbmV9LiBgICtcclxuICAgICAgICAgICdSZXN0b3JlIGZyb20gYSBiYWNrdXAgaW4gdGhlIGJhY2t1cHMvIGZvbGRlci4nLFxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXBwbHlNaWdyYXRpb25zKGRiLCBkYXRhRGlyLCBkYlBhdGgsIGV4aXN0ZWQpO1xyXG5cclxuICBjb25zdCBkZXZpY2VJZCA9IGVuc3VyZU1ldGEoZGIsICdkZXZpY2VfaWQnLCAoKSA9PiBjcnlwdG8ucmFuZG9tVVVJRCgpKTtcclxuICBlbnN1cmVNZXRhKGRiLCAncHJvamVjdF9pZCcsICgpID0+IGNyeXB0by5yYW5kb21VVUlEKCkpO1xyXG5cclxuICByZXR1cm4geyBkYiwgZGV2aWNlSWQsIGRhdGFEaXIsIGRiUGF0aCB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBhcHBseU1pZ3JhdGlvbnMoZGI6IERCLCBkYXRhRGlyOiBzdHJpbmcsIGRiUGF0aDogc3RyaW5nLCBleGlzdGVkOiBib29sZWFuKTogdm9pZCB7XHJcbiAgY29uc3QgaGFzTWV0YSA9IGRiXHJcbiAgICAucHJlcGFyZShcIlNFTEVDVCBDT1VOVCgqKSBBUyBjIEZST00gc3FsaXRlX21hc3RlciBXSEVSRSB0eXBlPSd0YWJsZScgQU5EIG5hbWU9J21ldGEnXCIpXHJcbiAgICAuZ2V0KCkgYXMgeyBjOiBudW1iZXIgfTtcclxuICBsZXQgdmVyc2lvbiA9IDA7XHJcbiAgaWYgKGhhc01ldGEuYyA+IDApIHtcclxuICAgIGNvbnN0IHJvdyA9IGRiLnByZXBhcmUoXCJTRUxFQ1QgdmFsdWUgRlJPTSBtZXRhIFdIRVJFIGtleT0nc2NoZW1hX3ZlcnNpb24nXCIpLmdldCgpIGFzXHJcbiAgICAgIHwgeyB2YWx1ZTogc3RyaW5nIH1cclxuICAgICAgfCB1bmRlZmluZWQ7XHJcbiAgICB2ZXJzaW9uID0gcm93ID8gTnVtYmVyKHJvdy52YWx1ZSkgOiAwO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcGVuZGluZyA9IE1JR1JBVElPTlMuZmlsdGVyKChtKSA9PiBtLnZlcnNpb24gPiB2ZXJzaW9uKTtcclxuICBpZiAocGVuZGluZy5sZW5ndGggPT09IDApIHJldHVybjtcclxuXHJcbiAgaWYgKGV4aXN0ZWQgJiYgdmVyc2lvbiA+IDApIHtcclxuICAgIGNvbnN0IGJhY2t1cERpciA9IHBhdGguam9pbihkYXRhRGlyLCAnYmFja3VwcycpO1xyXG4gICAgZnMubWtkaXJTeW5jKGJhY2t1cERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICBjb25zdCBzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyk7XHJcbiAgICBmcy5jb3B5RmlsZVN5bmMoZGJQYXRoLCBwYXRoLmpvaW4oYmFja3VwRGlyLCBgcHJlLW1pZ3JhdGlvbi12JHt2ZXJzaW9ufS0ke3N0YW1wfS5kYmApKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHJ1biA9IGRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgIGZvciAoY29uc3QgbSBvZiBwZW5kaW5nKSB7XHJcbiAgICAgIGRiLmV4ZWMobS5zcWwpO1xyXG4gICAgICBkYi5wcmVwYXJlKFxyXG4gICAgICAgIFwiSU5TRVJUIElOVE8gbWV0YShrZXksdmFsdWUpIFZBTFVFUygnc2NoZW1hX3ZlcnNpb24nLD8pIFwiICtcclxuICAgICAgICAgIFwiT04gQ09ORkxJQ1Qoa2V5KSBETyBVUERBVEUgU0VUIHZhbHVlPWV4Y2x1ZGVkLnZhbHVlXCIsXHJcbiAgICAgICkucnVuKFN0cmluZyhtLnZlcnNpb24pKTtcclxuICAgIH1cclxuICB9KTtcclxuICBydW4oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZW5zdXJlTWV0YShkYjogREIsIGtleTogc3RyaW5nLCBtYWtlOiAoKSA9PiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIGNvbnN0IHJvdyA9IGRiLnByZXBhcmUoJ1NFTEVDVCB2YWx1ZSBGUk9NIG1ldGEgV0hFUkUga2V5PT8nKS5nZXQoa2V5KSBhc1xyXG4gICAgfCB7IHZhbHVlOiBzdHJpbmcgfVxyXG4gICAgfCB1bmRlZmluZWQ7XHJcbiAgaWYgKHJvdykgcmV0dXJuIHJvdy52YWx1ZTtcclxuICBjb25zdCB2YWx1ZSA9IG1ha2UoKTtcclxuICBkYi5wcmVwYXJlKCdJTlNFUlQgSU5UTyBtZXRhKGtleSx2YWx1ZSkgVkFMVUVTKD8sPyknKS5ydW4oa2V5LCB2YWx1ZSk7XHJcbiAgcmV0dXJuIHZhbHVlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWV0YShkYjogREIsIGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgY29uc3Qgcm93ID0gZGIucHJlcGFyZSgnU0VMRUNUIHZhbHVlIEZST00gbWV0YSBXSEVSRSBrZXk9PycpLmdldChrZXkpIGFzXHJcbiAgICB8IHsgdmFsdWU6IHN0cmluZyB9XHJcbiAgICB8IHVuZGVmaW5lZDtcclxuICByZXR1cm4gcm93ID8gcm93LnZhbHVlIDogbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldE1ldGEoZGI6IERCLCBrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xyXG4gIGRiLnByZXBhcmUoXHJcbiAgICAnSU5TRVJUIElOVE8gbWV0YShrZXksdmFsdWUpIFZBTFVFUyg/LD8pIE9OIENPTkZMSUNUKGtleSkgRE8gVVBEQVRFIFNFVCB2YWx1ZT1leGNsdWRlZC52YWx1ZScsXHJcbiAgKS5ydW4oa2V5LCB2YWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQmFja3VwT3B0aW9ucyB7XHJcbiAgcmV0ZW50aW9uPzogbnVtYmVyOyAvLyBrZWVwIG5ld2VzdCBOIHRldGhlci0qLmRiIHBlciBsb2NhdGlvbiAoZGVmYXVsdCAyMClcclxuICBvZmZNYWNoaW5lRGlyPzogc3RyaW5nIHwgbnVsbDsgLy8gZS5nLiA8c3luY0ZvbGRlcj4vYmFja3VwcyBcdTIwMTQgZGlzYXN0ZXIgY29weVxyXG59XHJcblxyXG4vKipcclxuICogQ29uc2lzdGVudCBzbmFwc2hvdCB2aWEgdGhlIFNRTGl0ZSBiYWNrdXAgQVBJIChzYWZlIHdoaWxlIHRoZSBhcHAgcnVucykuXHJcbiAqIEludGVncml0eS1nYXRlZDogcmVmdXNlcyB0byBzbmFwc2hvdCBhIGRiIHRoYXQgZmFpbHMgcXVpY2tfY2hlY2ssIHNvIGEgZ29vZFxyXG4gKiBiYWNrdXAgaXMgbmV2ZXIgb3ZlcndyaXR0ZW4gYnkgYSBjb3JydXB0IG9uZS4gUHJ1bmVzIHRvIGByZXRlbnRpb25gIHBlclxyXG4gKiBsb2NhdGlvbiBhbmQsIGlmIGdpdmVuLCBjb3BpZXMgb2ZmLW1hY2hpbmUgaW50byB0aGUgc3luY2VkIGZvbGRlci5cclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBiYWNrdXBEYXRhYmFzZShjdHg6IERiQ29udGV4dCwgb3B0czogQmFja3VwT3B0aW9ucyA9IHt9KTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICBjb25zdCBjaGVjayA9IGN0eC5kYi5wcmFnbWEoJ3F1aWNrX2NoZWNrJywgeyBzaW1wbGU6IHRydWUgfSk7XHJcbiAgaWYgKGNoZWNrICE9PSAnb2snKSB0aHJvdyBuZXcgRXJyb3IoYFJlZnVzaW5nIHRvIGJhY2sgdXA6IGludGVncml0eSBjaGVjayBmYWlsZWQgKCR7Y2hlY2t9KS5gKTtcclxuXHJcbiAgY29uc3Qga2VlcCA9IG9wdHMucmV0ZW50aW9uID8/IDIwO1xyXG4gIGNvbnN0IGJhY2t1cERpciA9IHBhdGguam9pbihjdHguZGF0YURpciwgJ2JhY2t1cHMnKTtcclxuICBmcy5ta2RpclN5bmMoYmFja3VwRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICBjb25zdCBzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyk7XHJcbiAgY29uc3QgZGVzdCA9IHBhdGguam9pbihiYWNrdXBEaXIsIGB0ZXRoZXItJHtzdGFtcH0uZGJgKTtcclxuICBhd2FpdCBjdHguZGIuYmFja3VwKGRlc3QpO1xyXG4gIHBydW5lQmFja3VwcyhiYWNrdXBEaXIsIGtlZXApO1xyXG5cclxuICBpZiAob3B0cy5vZmZNYWNoaW5lRGlyKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBmcy5ta2RpclN5bmMob3B0cy5vZmZNYWNoaW5lRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICAgICAgZnMuY29weUZpbGVTeW5jKGRlc3QsIHBhdGguam9pbihvcHRzLm9mZk1hY2hpbmVEaXIsIGB0ZXRoZXItJHtzdGFtcH0uZGJgKSk7XHJcbiAgICAgIHBydW5lQmFja3VwcyhvcHRzLm9mZk1hY2hpbmVEaXIsIGtlZXApO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t0ZXRoZXJdIG9mZi1tYWNoaW5lIGJhY2t1cCBjb3B5IGZhaWxlZDonLCBlcnIpO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZGVzdDtcclxufVxyXG5cclxuLyoqIEtlZXAgb25seSB0aGUgbmV3ZXN0IGBrZWVwYCB0ZXRoZXItKi5kYiBmaWxlcyBpbiBhIGRpcmVjdG9yeS4gKi9cclxuZnVuY3Rpb24gcHJ1bmVCYWNrdXBzKGRpcjogc3RyaW5nLCBrZWVwOiBudW1iZXIpOiB2b2lkIHtcclxuICBsZXQgZmlsZXM6IHN0cmluZ1tdO1xyXG4gIHRyeSB7XHJcbiAgICBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKGRpcikuZmlsdGVyKChmKSA9PiAvXnRldGhlci0uKlxcLmRiJC8udGVzdChmKSk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGlmIChmaWxlcy5sZW5ndGggPD0ga2VlcCkgcmV0dXJuO1xyXG4gIGNvbnN0IGJ5TmV3ZXN0ID0gZmlsZXNcclxuICAgIC5tYXAoKGYpID0+ICh7IGYsIHQ6IGZzLnN0YXRTeW5jKHBhdGguam9pbihkaXIsIGYpKS5tdGltZU1zIH0pKVxyXG4gICAgLnNvcnQoKGEsIGIpID0+IGIudCAtIGEudCk7XHJcbiAgZm9yIChjb25zdCB7IGYgfSBvZiBieU5ld2VzdC5zbGljZShrZWVwKSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgZnMucm1TeW5jKHBhdGguam9pbihkaXIsIGYpLCB7IGZvcmNlOiB0cnVlIH0pO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIC8qIGJlc3QtZWZmb3J0ICovXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEJhY2t1cEluZm8ge1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBzaXplOiBudW1iZXI7XHJcbiAgbXRpbWU6IHN0cmluZztcclxufVxyXG5cclxuLyoqIExpc3QgbG9jYWwgc25hcHNob3RzLCBuZXdlc3QgZmlyc3QuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBsaXN0QmFja3VwcyhjdHg6IERiQ29udGV4dCk6IEJhY2t1cEluZm9bXSB7XHJcbiAgY29uc3QgZGlyID0gcGF0aC5qb2luKGN0eC5kYXRhRGlyLCAnYmFja3VwcycpO1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gZnNcclxuICAgICAgLnJlYWRkaXJTeW5jKGRpcilcclxuICAgICAgLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aCgnLmRiJykpXHJcbiAgICAgIC5tYXAoKGYpID0+IHtcclxuICAgICAgICBjb25zdCBzdCA9IGZzLnN0YXRTeW5jKHBhdGguam9pbihkaXIsIGYpKTtcclxuICAgICAgICByZXR1cm4geyBuYW1lOiBmLCBzaXplOiBzdC5zaXplLCBtdGltZTogbmV3IERhdGUoc3QubXRpbWVNcykudG9JU09TdHJpbmcoKSB9O1xyXG4gICAgICB9KVxyXG4gICAgICAuc29ydCgoYSwgYikgPT4gKGEubXRpbWUgPCBiLm10aW1lID8gMSA6IC0xKSk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogVmFsaWRhdGUgYSBiYWNrdXAgYW5kIHN0YWdlIGl0IGZvciByZXN0b3JlIG9uIG5leHQgbGF1bmNoLiBXZSBuZXZlciBzd2FwIHRoZVxyXG4gKiBsaXZlIGRiIG1pZC1zZXNzaW9uOyB0aGUgc3dhcCBoYXBwZW5zIGluIGFwcGx5UGVuZGluZ1Jlc3RvcmUoKSBiZWZvcmUgb3Blbi5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzdGFnZVJlc3RvcmUoY3R4OiBEYkNvbnRleHQsIGJhY2t1cE5hbWU6IHN0cmluZyk6IHsgcmVzdGFydFJlcXVpcmVkOiB0cnVlIH0ge1xyXG4gIGlmICghL15bXFx3LlxcLV0rXFwuZGIkLy50ZXN0KGJhY2t1cE5hbWUpKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYmFja3VwIG5hbWUnKTtcclxuICBjb25zdCBzcmMgPSBwYXRoLmpvaW4oY3R4LmRhdGFEaXIsICdiYWNrdXBzJywgYmFja3VwTmFtZSk7XHJcbiAgaWYgKCFmcy5leGlzdHNTeW5jKHNyYykpIHRocm93IG5ldyBFcnJvcignQmFja3VwIG5vdCBmb3VuZCcpO1xyXG4gIGNvbnN0IHByb2JlID0gbmV3IERhdGFiYXNlKHNyYywgeyByZWFkb25seTogdHJ1ZSB9KTtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgb2sgPSBwcm9iZS5wcmFnbWEoJ3F1aWNrX2NoZWNrJywgeyBzaW1wbGU6IHRydWUgfSk7XHJcbiAgICBpZiAob2sgIT09ICdvaycpIHRocm93IG5ldyBFcnJvcihgQmFja3VwIGZhaWxlZCBpbnRlZ3JpdHkgY2hlY2sgKCR7b2t9KWApO1xyXG4gIH0gZmluYWxseSB7XHJcbiAgICBwcm9iZS5jbG9zZSgpO1xyXG4gIH1cclxuICBmcy5jb3B5RmlsZVN5bmMoc3JjLCBwYXRoLmpvaW4oY3R4LmRhdGFEaXIsICdyZXN0b3JlLXBlbmRpbmcuZGInKSk7XHJcbiAgcmV0dXJuIHsgcmVzdGFydFJlcXVpcmVkOiB0cnVlIH07XHJcbn1cclxuXHJcbi8qKiBJZiBhIHJlc3RvcmUgd2FzIHN0YWdlZCwgcXVhcmFudGluZSB0aGUgY3VycmVudCBkYiBhbmQgc3dhcCB0aGUgYmFja3VwIGluLiAqL1xyXG5mdW5jdGlvbiBhcHBseVBlbmRpbmdSZXN0b3JlKGRhdGFEaXI6IHN0cmluZywgZGJQYXRoOiBzdHJpbmcpOiB2b2lkIHtcclxuICBjb25zdCBwZW5kaW5nID0gcGF0aC5qb2luKGRhdGFEaXIsICdyZXN0b3JlLXBlbmRpbmcuZGInKTtcclxuICBpZiAoIWZzLmV4aXN0c1N5bmMocGVuZGluZykpIHJldHVybjtcclxuICBjb25zdCBzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyk7XHJcbiAgaWYgKGZzLmV4aXN0c1N5bmMoZGJQYXRoKSkge1xyXG4gICAgZnMuY29weUZpbGVTeW5jKGRiUGF0aCwgYCR7ZGJQYXRofS5wcmUtcmVzdG9yZS0ke3N0YW1wfWApO1xyXG4gICAgZm9yIChjb25zdCBzdWZmaXggb2YgWyctd2FsJywgJy1zaG0nXSkge1xyXG4gICAgICBjb25zdCBmID0gZGJQYXRoICsgc3VmZml4O1xyXG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhmKSkgZnMucm1TeW5jKGYsIHsgZm9yY2U6IHRydWUgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGZzLnJlbmFtZVN5bmMocGVuZGluZywgZGJQYXRoKTtcclxuICBjb25zb2xlLmxvZygnW3RldGhlcl0gYXBwbGllZCBzdGFnZWQgcmVzdG9yZSBmcm9tIGJhY2t1cCcpO1xyXG59XHJcbiIsICIvLyBWZXJzaW9uZWQgc2NoZW1hIG1pZ3JhdGlvbnMuIE5ldmVyIGVkaXQgYSBzaGlwcGVkIG1pZ3JhdGlvbiBcdTIwMTQgYXBwZW5kIGEgbmV3IG9uZS5cclxuLy8gUnVubmVyOiBkYi50cyBhcHBseU1pZ3JhdGlvbnMoKS4gRWFjaCBtaWdyYXRpb24gcnVucyBpbiBhIHRyYW5zYWN0aW9uLlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNaWdyYXRpb24ge1xyXG4gIHZlcnNpb246IG51bWJlcjtcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgc3FsOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBNSUdSQVRJT05TOiBNaWdyYXRpb25bXSA9IFtcclxuICB7XHJcbiAgICB2ZXJzaW9uOiAxLFxyXG4gICAgbmFtZTogJ2NvcmUtc2NoZW1hJyxcclxuICAgIHNxbDogYFxyXG5DUkVBVEUgVEFCTEUgbWV0YSAoXHJcbiAga2V5IFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgdmFsdWUgVEVYVCBOT1QgTlVMTFxyXG4pO1xyXG5cclxuQ1JFQVRFIFRBQkxFIHVzZXJzIChcclxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIG5hbWUgVEVYVCBOT1QgTlVMTCxcclxuICBpbml0aWFscyBURVhUIE5PVCBOVUxMLFxyXG4gIGNvbG9yIFRFWFQgTk9UIE5VTEwsXHJcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMXHJcbik7XHJcblxyXG5DUkVBVEUgVEFCTEUgaXRlbXMgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgaWRlbnQgVEVYVCBOT1QgTlVMTCBVTklRVUUsXHJcbiAgdHlwZSBURVhUIE5PVCBOVUxMLFxyXG4gIHRpdGxlIFRFWFQgTk9UIE5VTEwsXHJcbiAgYm9keSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXHJcbiAgYm9keV90ZXh0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcclxuICBzdGF0dXMgVEVYVCBOT1QgTlVMTCxcclxuICBwcmlvcml0eSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ25vbmUnLFxyXG4gIG93bmVyX2lkIFRFWFQsXHJcbiAgcmVwb3J0ZXJfaWQgVEVYVCxcclxuICBtaWxlc3RvbmVfaWQgVEVYVCxcclxuICByZWxlYXNlX2lkIFRFWFQsXHJcbiAgcGFyZW50X2lkIFRFWFQsXHJcbiAgc3RhcnRfZGF0ZSBURVhULFxyXG4gIGR1ZV9kYXRlIFRFWFQsXHJcbiAgY29tcGxldGVkX2F0IFRFWFQsXHJcbiAgZWZmb3J0IFJFQUwsXHJcbiAgY29uZmlkZW5jZSBURVhULFxyXG4gIHJpc2tfbGV2ZWwgVEVYVCxcclxuICBidXNpbmVzc192YWx1ZSBURVhULFxyXG4gIGxlYWRlcnNoaXBfdmlzaWJsZSBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcclxuICBwcm9ncmVzcyBJTlRFR0VSLFxyXG4gIHRhZ3MgVEVYVCBOT1QgTlVMTCBERUZBVUxUICdbXScsXHJcbiAgZXh0cmEgVEVYVCBOT1QgTlVMTCBERUZBVUxUICd7fScsXHJcbiAgYXJjaGl2ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXHJcbiAgc2FtcGxlIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxyXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXHJcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxyXG4gIHVwZGF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcclxuICBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTEwsXHJcbiAgdXBkYXRlZF9ieSBURVhUIE5PVCBOVUxMXHJcbik7XHJcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfdHlwZSBPTiBpdGVtcyh0eXBlKSBXSEVSRSBkZWxldGVkID0gMDtcclxuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19zdGF0dXMgT04gaXRlbXMoc3RhdHVzKSBXSEVSRSBkZWxldGVkID0gMDtcclxuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19vd25lciBPTiBpdGVtcyhvd25lcl9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfbWlsZXN0b25lIE9OIGl0ZW1zKG1pbGVzdG9uZV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfcmVsZWFzZSBPTiBpdGVtcyhyZWxlYXNlX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcclxuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19wYXJlbnQgT04gaXRlbXMocGFyZW50X2lkKSBXSEVSRSBkZWxldGVkID0gMDtcclxuQ1JFQVRFIElOREVYIGlkeF9pdGVtc191cGRhdGVkIE9OIGl0ZW1zKHVwZGF0ZWRfYXQpO1xyXG5cclxuQ1JFQVRFIFRBQkxFIGlkZW50X2NvdW50ZXJzIChcclxuICB0eXBlIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgbmV4dCBJTlRFR0VSIE5PVCBOVUxMXHJcbik7XHJcblxyXG5DUkVBVEUgVEFCTEUgbGlua3MgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgZnJvbV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIHRvX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAga2luZCBURVhUIE5PVCBOVUxMLFxyXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXHJcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxyXG4gIGNyZWF0ZWRfYnkgVEVYVCBOT1QgTlVMTFxyXG4pO1xyXG5DUkVBVEUgSU5ERVggaWR4X2xpbmtzX2Zyb20gT04gbGlua3MoZnJvbV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcbkNSRUFURSBJTkRFWCBpZHhfbGlua3NfdG8gT04gbGlua3ModG9faWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xyXG5DUkVBVEUgVU5JUVVFIElOREVYIGlkeF9saW5rc191bmlxIE9OIGxpbmtzKGZyb21faWQsIHRvX2lkLCBraW5kKTtcclxuXHJcbkNSRUFURSBUQUJMRSBjb21tZW50cyAoXHJcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBpdGVtX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgYXV0aG9yX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgYm9keSBURVhUIE5PVCBOVUxMLFxyXG4gIGJvZHlfdGV4dCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXHJcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxyXG4gIHVwZGF0ZWRfYXQgVEVYVCxcclxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwXHJcbik7XHJcbkNSRUFURSBJTkRFWCBpZHhfY29tbWVudHNfaXRlbSBPTiBjb21tZW50cyhpdGVtX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcclxuXHJcbkNSRUFURSBUQUJMRSBhdHRhY2htZW50cyAoXHJcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBpdGVtX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgZmlsZW5hbWUgVEVYVCBOT1QgTlVMTCxcclxuICBtaW1lIFRFWFQgTk9UIE5VTEwsXHJcbiAgc2l6ZSBJTlRFR0VSIE5PVCBOVUxMLFxyXG4gIHNoYTI1NiBURVhUIE5PVCBOVUxMLFxyXG4gIGRlc2NyaXB0aW9uIFRFWFQsXHJcbiAgdXBsb2FkZWRfYnkgVEVYVCBOT1QgTlVMTCxcclxuICBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXHJcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMFxyXG4pO1xyXG5DUkVBVEUgSU5ERVggaWR4X2F0dGFjaG1lbnRzX2l0ZW0gT04gYXR0YWNobWVudHMoaXRlbV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcblxyXG5DUkVBVEUgVEFCTEUgYWN0aXZpdHkgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgaXRlbV9pZCBURVhULFxyXG4gIGFjdG9yX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAga2luZCBURVhUIE5PVCBOVUxMLFxyXG4gIGZpZWxkIFRFWFQsXHJcbiAgb2xkX3ZhbHVlIFRFWFQsXHJcbiAgbmV3X3ZhbHVlIFRFWFQsXHJcbiAgYXQgVEVYVCBOT1QgTlVMTFxyXG4pO1xyXG5DUkVBVEUgSU5ERVggaWR4X2FjdGl2aXR5X2l0ZW0gT04gYWN0aXZpdHkoaXRlbV9pZCk7XHJcbkNSRUFURSBJTkRFWCBpZHhfYWN0aXZpdHlfYXQgT04gYWN0aXZpdHkoYXQpO1xyXG5cclxuQ1JFQVRFIFRBQkxFIGl0ZW1fdmVyc2lvbnMgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgaXRlbV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIHZlcnNpb24gSU5URUdFUiBOT1QgTlVMTCxcclxuICB0aXRsZSBURVhUIE5PVCBOVUxMLFxyXG4gIGJvZHkgVEVYVCBOT1QgTlVMTCxcclxuICBzYXZlZF9ieSBURVhUIE5PVCBOVUxMLFxyXG4gIHNhdmVkX2F0IFRFWFQgTk9UIE5VTExcclxuKTtcclxuQ1JFQVRFIElOREVYIGlkeF92ZXJzaW9uc19pdGVtIE9OIGl0ZW1fdmVyc2lvbnMoaXRlbV9pZCwgdmVyc2lvbik7XHJcblxyXG5DUkVBVEUgVEFCTEUgbWlsZXN0b25lcyAoXHJcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXHJcbiAgZGVzY3JpcHRpb24gVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxyXG4gIHRhcmdldF9kYXRlIFRFWFQsXHJcbiAgc3RhdHVzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAncGxhbm5lZCcsXHJcbiAgc29ydCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcclxuICBzYW1wbGUgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXHJcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMFxyXG4pO1xyXG5cclxuQ1JFQVRFIFRBQkxFIHJlbGVhc2VzIChcclxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIG5hbWUgVEVYVCBOT1QgTlVMTCxcclxuICB2ZXJzaW9uIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcclxuICB0YXJnZXRfZGF0ZSBURVhULFxyXG4gIHN0YXR1cyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ3BsYW5uZWQnLFxyXG4gIGdvYWxzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcclxuICBub3RlcyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXHJcbiAgc2FtcGxlIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxyXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcclxuKTtcclxuXHJcbkNSRUFURSBUQUJMRSBzYXZlZF92aWV3cyAoXHJcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXHJcbiAgY29uZmlnIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAne30nLFxyXG4gIHBpbm5lZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcclxuICBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTEwsXHJcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxyXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcclxuKTtcclxuXHJcbi0tIEFwcGVuZC1vbmx5IG9wZXJhdGlvbiBsb2cuIFNvdXJjZSBmb3Igc3luYyBleHBvcnQ7IHBlZXJzJyBvcHMgcmVjb3JkZWQgd2l0aCBvcmlnaW4gZGV2aWNlLlxyXG5DUkVBVEUgVEFCTEUgb3Bsb2cgKFxyXG4gIHNlcSBJTlRFR0VSIFBSSU1BUlkgS0VZIEFVVE9JTkNSRU1FTlQsXHJcbiAgb3BfaWQgVEVYVCBOT1QgTlVMTCBVTklRVUUsXHJcbiAgZGV2aWNlX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgYWN0b3JfaWQgVEVYVCBOT1QgTlVMTCxcclxuICBsYW1wb3J0IElOVEVHRVIgTk9UIE5VTEwsXHJcbiAgYXQgVEVYVCBOT1QgTlVMTCxcclxuICBlbnRpdHkgVEVYVCBOT1QgTlVMTCxcclxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcclxuICBhY3Rpb24gVEVYVCBOT1QgTlVMTCxcclxuICBwYXlsb2FkIFRFWFQgTk9UIE5VTExcclxuKTtcclxuQ1JFQVRFIElOREVYIGlkeF9vcGxvZ19lbnRpdHkgT04gb3Bsb2coZW50aXR5LCBlbnRpdHlfaWQpO1xyXG5DUkVBVEUgSU5ERVggaWR4X29wbG9nX2RldmljZSBPTiBvcGxvZyhkZXZpY2VfaWQsIHNlcSk7XHJcblxyXG4tLSBGaWVsZC1sZXZlbCB3cml0ZSByZWdpc3RyeSBmb3IgTFdXIG1lcmdlOiBsYXN0IChsYW1wb3J0LCBkZXZpY2UpIHRoYXQgd3JvdGUgZWFjaCBmaWVsZC5cclxuQ1JFQVRFIFRBQkxFIGZpZWxkX2Nsb2NrIChcclxuICBlbnRpdHkgVEVYVCBOT1QgTlVMTCxcclxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcclxuICBmaWVsZCBURVhUIE5PVCBOVUxMLFxyXG4gIGxhbXBvcnQgSU5URUdFUiBOT1QgTlVMTCxcclxuICBkZXZpY2VfaWQgVEVYVCBOT1QgTlVMTCxcclxuICBQUklNQVJZIEtFWSAoZW50aXR5LCBlbnRpdHlfaWQsIGZpZWxkKVxyXG4pO1xyXG5cclxuQ1JFQVRFIFRBQkxFIHN5bmNfY29uZmxpY3RzIChcclxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIGVudGl0eSBURVhUIE5PVCBOVUxMLFxyXG4gIGVudGl0eV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGZpZWxkIFRFWFQgTk9UIE5VTEwsXHJcbiAgbG9jYWxfdmFsdWUgVEVYVCBOT1QgTlVMTCxcclxuICByZW1vdGVfdmFsdWUgVEVYVCBOT1QgTlVMTCxcclxuICByZW1vdGVfZGV2aWNlIFRFWFQgTk9UIE5VTEwsXHJcbiAgcmVtb3RlX2FjdG9yIFRFWFQgTk9UIE5VTEwsXHJcbiAgZGV0ZWN0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcclxuICByZXNvbHZlZF9hdCBURVhULFxyXG4gIHJlc29sdXRpb24gVEVYVFxyXG4pO1xyXG5cclxuLS0gUGVyLXBlZXIgaW1wb3J0IHByb2dyZXNzOiBoaWdoZXN0IGZpbGUgc2VxdWVuY2UgY29uc3VtZWQgcGVyIGRldmljZS5cclxuQ1JFQVRFIFRBQkxFIHN5bmNfcGVlcnMgKFxyXG4gIGRldmljZV9pZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIHVzZXJfbmFtZSBURVhULFxyXG4gIGxhc3RfZmlsZSBURVhULFxyXG4gIGxhc3Rfc2Vlbl9hdCBURVhUXHJcbik7XHJcblxyXG5DUkVBVEUgVklSVFVBTCBUQUJMRSBpdGVtc19mdHMgVVNJTkcgZnRzNShcclxuICBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncyxcclxuICBjb250ZW50PSdpdGVtcycsIGNvbnRlbnRfcm93aWQ9J3Jvd2lkJyxcclxuICB0b2tlbml6ZT0ndW5pY29kZTYxJ1xyXG4pO1xyXG5cclxuQ1JFQVRFIFRSSUdHRVIgaXRlbXNfZnRzX2FpIEFGVEVSIElOU0VSVCBPTiBpdGVtcyBCRUdJTlxyXG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhyb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXHJcbiAgVkFMVUVTIChuZXcucm93aWQsIG5ldy5pZGVudCwgbmV3LnRpdGxlLCBuZXcuYm9keV90ZXh0LCBuZXcudGFncyk7XHJcbkVORDtcclxuQ1JFQVRFIFRSSUdHRVIgaXRlbXNfZnRzX2FkIEFGVEVSIERFTEVURSBPTiBpdGVtcyBCRUdJTlxyXG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhpdGVtc19mdHMsIHJvd2lkLCBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncylcclxuICBWQUxVRVMgKCdkZWxldGUnLCBvbGQucm93aWQsIG9sZC5pZGVudCwgb2xkLnRpdGxlLCBvbGQuYm9keV90ZXh0LCBvbGQudGFncyk7XHJcbkVORDtcclxuQ1JFQVRFIFRSSUdHRVIgaXRlbXNfZnRzX2F1IEFGVEVSIFVQREFURSBPTiBpdGVtcyBCRUdJTlxyXG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhpdGVtc19mdHMsIHJvd2lkLCBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncylcclxuICBWQUxVRVMgKCdkZWxldGUnLCBvbGQucm93aWQsIG9sZC5pZGVudCwgb2xkLnRpdGxlLCBvbGQuYm9keV90ZXh0LCBvbGQudGFncyk7XHJcbiAgSU5TRVJUIElOVE8gaXRlbXNfZnRzKHJvd2lkLCBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncylcclxuICBWQUxVRVMgKG5ldy5yb3dpZCwgbmV3LmlkZW50LCBuZXcudGl0bGUsIG5ldy5ib2R5X3RleHQsIG5ldy50YWdzKTtcclxuRU5EO1xyXG5gLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgdmVyc2lvbjogMixcclxuICAgIG5hbWU6ICdwZW5kaW5nLW9wcy1idWZmZXInLFxyXG4gICAgc3FsOiBgXHJcbi0tIE9wcyB0aGF0IGFycml2ZWQgYmVmb3JlIHRoZSBjcmVhdGUgb2YgdGhlaXIgdGFyZ2V0IGVudGl0eSAocG9zc2libGUgd2l0aCAzK1xyXG4tLSBkZXZpY2VzLCBzaW5jZSBvcmRlcmluZyBpcyBvbmx5IGd1YXJhbnRlZWQgcGVyIGRldmljZSkuIEJ1ZmZlcmVkIGhlcmUgYW5kXHJcbi0tIHJlcGxheWVkIG9uY2UgdGhlIGNyZWF0ZSBsYW5kcy5cclxuQ1JFQVRFIFRBQkxFIHBlbmRpbmdfb3BzIChcclxuICBvcF9pZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIGRldmljZV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGFjdG9yX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgbGFtcG9ydCBJTlRFR0VSIE5PVCBOVUxMLFxyXG4gIGF0IFRFWFQgTk9UIE5VTEwsXHJcbiAgZW50aXR5IFRFWFQgTk9UIE5VTEwsXHJcbiAgZW50aXR5X2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgYWN0aW9uIFRFWFQgTk9UIE5VTEwsXHJcbiAgcGF5bG9hZCBURVhUIE5PVCBOVUxMXHJcbik7XHJcbkNSRUFURSBJTkRFWCBpZHhfcGVuZGluZ19lbnRpdHkgT04gcGVuZGluZ19vcHMoZW50aXR5LCBlbnRpdHlfaWQpO1xyXG5gLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgdmVyc2lvbjogMyxcclxuICAgIG5hbWU6ICdmdWxsLWF1ZGl0YWJpbGl0eScsXHJcbiAgICBzcWw6IGBcclxuLS0gRXZlcnkgdXNlci1kYXRhIHRhYmxlIGdldHMgY3JlYXRlZC91cGRhdGVkIGF0dHJpYnV0aW9uIGFuZCBzb2Z0LWRlbGV0ZVxyXG4tLSBhdHRyaWJ1dGlvbiBzbyBcIndobyBjcmVhdGVkL2NoYW5nZWQvZGVsZXRlZCB0aGlzLCBhbmQgd2hlblwiIGlzIGFsd2F5cyBhbnN3ZXJhYmxlXHJcbi0tIGZyb20gdGhlIHNjaGVtYSwgbm90IGp1c3QgdGhlIG9wIGxvZy5cclxuXHJcbi0tIE1pbGVzdG9uZXMgKyByZWxlYXNlcyBoYWQgbm8gYXVkaXQgY29sdW1ucyBhdCBhbGwuXHJcbkFMVEVSIFRBQkxFIG1pbGVzdG9uZXMgQUREIENPTFVNTiBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuQUxURVIgVEFCTEUgbWlsZXN0b25lcyBBREQgQ09MVU1OIGNyZWF0ZWRfYnkgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnO1xyXG5BTFRFUiBUQUJMRSBtaWxlc3RvbmVzIEFERCBDT0xVTU4gdXBkYXRlZF9hdCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJyc7XHJcbkFMVEVSIFRBQkxFIG1pbGVzdG9uZXMgQUREIENPTFVNTiB1cGRhdGVkX2J5IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuQUxURVIgVEFCTEUgcmVsZWFzZXMgQUREIENPTFVNTiBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuQUxURVIgVEFCTEUgcmVsZWFzZXMgQUREIENPTFVNTiBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuQUxURVIgVEFCTEUgcmVsZWFzZXMgQUREIENPTFVNTiB1cGRhdGVkX2F0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuQUxURVIgVEFCTEUgcmVsZWFzZXMgQUREIENPTFVNTiB1cGRhdGVkX2J5IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuXHJcbi0tIENvbW1lbnQgZWRpdHMvZGVsZXRlcyB3ZXJlIHVuYXR0cmlidXRlZC5cclxuQUxURVIgVEFCTEUgY29tbWVudHMgQUREIENPTFVNTiB1cGRhdGVkX2J5IFRFWFQ7XHJcbkFMVEVSIFRBQkxFIGNvbW1lbnRzIEFERCBDT0xVTU4gZGVsZXRlZF9hdCBURVhUO1xyXG5BTFRFUiBUQUJMRSBjb21tZW50cyBBREQgQ09MVU1OIGRlbGV0ZWRfYnkgVEVYVDtcclxuXHJcbi0tIEF0dGFjaG1lbnQgcmVtb3ZhbCB3YXMgdW5hdHRyaWJ1dGVkLlxyXG5BTFRFUiBUQUJMRSBhdHRhY2htZW50cyBBREQgQ09MVU1OIGRlbGV0ZWRfYXQgVEVYVDtcclxuQUxURVIgVEFCTEUgYXR0YWNobWVudHMgQUREIENPTFVNTiBkZWxldGVkX2J5IFRFWFQ7XHJcblxyXG4tLSBMaW5rIHJlbW92YWwgYXR0cmlidXRpb24gb24gdGhlIHJvdyAobm90IG9ubHkgaW4gdGhlIGFjdGl2aXR5IGZlZWQpLlxyXG5BTFRFUiBUQUJMRSBsaW5rcyBBREQgQ09MVU1OIGRlbGV0ZWRfYXQgVEVYVDtcclxuQUxURVIgVEFCTEUgbGlua3MgQUREIENPTFVNTiBkZWxldGVkX2J5IFRFWFQ7XHJcblxyXG4tLSBTYXZlZCB2aWV3IC8gaXRlbSBkZWxldGUgYXR0cmlidXRpb24gb24gdGhlIHJvdy5cclxuQUxURVIgVEFCTEUgc2F2ZWRfdmlld3MgQUREIENPTFVNTiB1cGRhdGVkX2F0IFRFWFQ7XHJcbkFMVEVSIFRBQkxFIHNhdmVkX3ZpZXdzIEFERCBDT0xVTU4gdXBkYXRlZF9ieSBURVhUO1xyXG5BTFRFUiBUQUJMRSBzYXZlZF92aWV3cyBBREQgQ09MVU1OIGRlbGV0ZWRfYXQgVEVYVDtcclxuQUxURVIgVEFCTEUgc2F2ZWRfdmlld3MgQUREIENPTFVNTiBkZWxldGVkX2J5IFRFWFQ7XHJcbkFMVEVSIFRBQkxFIGl0ZW1zIEFERCBDT0xVTU4gZGVsZXRlZF9hdCBURVhUO1xyXG5BTFRFUiBUQUJMRSBpdGVtcyBBREQgQ09MVU1OIGRlbGV0ZWRfYnkgVEVYVDtcclxuXHJcbi0tIFdobyByZXNvbHZlZCBhIHN5bmMgY29uZmxpY3QuXHJcbkFMVEVSIFRBQkxFIHN5bmNfY29uZmxpY3RzIEFERCBDT0xVTU4gcmVzb2x2ZWRfYnkgVEVYVDtcclxuXHJcbi0tIEJhY2tmaWxsIGV4aXN0aW5nIG1pbGVzdG9uZS9yZWxlYXNlIHJvd3Mgc28gYXVkaXQgdGltZXN0YW1wcyBhcmUgbmV2ZXIgYmxhbmsuXHJcblVQREFURSBtaWxlc3RvbmVzIFNFVCBjcmVhdGVkX2F0ID0gZGF0ZXRpbWUoJ25vdycpLCB1cGRhdGVkX2F0ID0gZGF0ZXRpbWUoJ25vdycpIFdIRVJFIGNyZWF0ZWRfYXQgPSAnJztcclxuVVBEQVRFIHJlbGVhc2VzIFNFVCBjcmVhdGVkX2F0ID0gZGF0ZXRpbWUoJ25vdycpLCB1cGRhdGVkX2F0ID0gZGF0ZXRpbWUoJ25vdycpIFdIRVJFIGNyZWF0ZWRfYXQgPSAnJztcclxuYCxcclxuICB9LFxyXG4gIHtcclxuICAgIHZlcnNpb246IDQsXHJcbiAgICBuYW1lOiAndXNlci1hdmF0YXInLFxyXG4gICAgc3FsOiBgQUxURVIgVEFCTEUgdXNlcnMgQUREIENPTFVNTiBhdmF0YXIgVEVYVDtgLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgdmVyc2lvbjogNSxcclxuICAgIG5hbWU6ICd1c2VyLXNvZnQtZGVsZXRlJyxcclxuICAgIC8vIE1lbWJlcnMgYXJlIHJlbW92ZWQgdGhlIHNhbWUgd2F5IGV2ZXJ5dGhpbmcgZWxzZSBpczogYSB0b21ic3RvbmUgdGhhdCBzeW5jcy5cclxuICAgIC8vIEl0ZW1zIGFuZCBjb21tZW50cyBrZWVwIHJlZmVyZW5jaW5nIHRoZSBpZCwgc28gaGlzdG9yeSBzdGlsbCByZW5kZXJzLlxyXG4gICAgc3FsOiBgQUxURVIgVEFCTEUgdXNlcnMgQUREIENPTFVNTiBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwO2AsXHJcbiAgfSxcclxuXTtcclxuIiwgIi8vIFN0b3JlOiB0aGUgc2luZ2xlIHdyaXRlIHBhdGguIEV2ZXJ5IG11dGF0aW9uIChsb2NhbCBvciByZW1vdGUpIGZsb3dzIHRocm91Z2ggaGVyZSBzb1xyXG4vLyBTUUxpdGUgc3RhdGUsIHRoZSBvcGxvZywgZmllbGQgY2xvY2tzLCBhY3Rpdml0eSBoaXN0b3J5LCBhbmQgRlRTIHN0YXkgY29uc2lzdGVudC5cclxuLy9cclxuLy8gU3luYyBtb2RlbCAoc2VlIGRvY3MvU1lOQ19BUkNISVRFQ1RVUkUubWQpOlxyXG4vLyAtIExvY2FsIG11dGF0aW9ucyBhcHBlbmQgZmllbGQtZ3JhbnVsYXIgb3BzIHRvIG9wbG9nIChsYW1wb3J0IGNsb2NrICsgZGV2aWNlIGlkKS5cclxuLy8gLSAnc2V0JyBvcHMgY2FycnkgYmFzZWRPbiA9IHRoZSAobGFtcG9ydCxkZXZpY2UpIGVhY2ggZmllbGQgaGFkIHdoZW4gd3JpdHRlbixcclxuLy8gICBsZXR0aW5nIHRoZSBpbXBvcnRlciBkaXN0aW5ndWlzaCBjbGVhbiBjYXVzYWwgdXBkYXRlcyBmcm9tIHRydWUgY29uY3VycmVudCBlZGl0cy5cclxuLy8gLSBDb25jdXJyZW50IGVkaXRzIHJlc29sdmUgYnkgTFdXIChsYW1wb3J0LCBkZXZpY2VJZCB0aWVicmVhaykuIEZvciBjb250ZW50IGZpZWxkc1xyXG4vLyAgICh0aXRsZSwgYm9keSkgdGhlIGxvc2luZyB2YWx1ZSBpcyBwcmVzZXJ2ZWQgaW4gc3luY19jb25mbGljdHMgZm9yIG1hbnVhbCByZXZpZXcuXHJcblxyXG5pbXBvcnQgY3J5cHRvIGZyb20gJ25vZGU6Y3J5cHRvJztcclxuaW1wb3J0IHR5cGUgeyBEQiwgRGJDb250ZXh0IH0gZnJvbSAnLi9kYic7XHJcbmltcG9ydCB7IGdldE1ldGEsIHNldE1ldGEgfSBmcm9tICcuL2RiJztcclxuaW1wb3J0IHR5cGUge1xyXG4gIEl0ZW1GaWx0ZXIsXHJcbiAgSXRlbVNvcnQsXHJcbiAgSXRlbVR5cGUsXHJcbiAgT3AsXHJcbiAgV29ya0l0ZW0sXHJcbiAgSXRlbUxpbmssXHJcbiAgQ29tbWVudCxcclxuICBNaWxlc3RvbmUsXHJcbiAgUmVsZWFzZSxcclxuICBTYXZlZFZpZXcsXHJcbiAgVXNlcixcclxuICBMaW5rS2luZCxcclxuICBTZWFyY2hSZXN1bHQsXHJcbiAgU3luY0NvbmZsaWN0LFxyXG59IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XHJcbmltcG9ydCB7IElERU5UX1BSRUZJWCwgc3RhdHVzZXNGb3JUeXBlLCBURVJNSU5BTF9TVEFUVVNFUyB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XHJcbmltcG9ydCB7IGRvY1RvVGV4dCB9IGZyb20gJy4uLy4uL3NoYXJlZC9kb2MnO1xyXG5cclxuY29uc3QgQ09ORkxJQ1RfU1VSRkFDRURfRklFTERTID0gbmV3IFNldChbJ3RpdGxlJywgJ2JvZHknXSk7XHJcblxyXG4vLyBjYW1lbENhc2UgZmllbGQgLT4gaXRlbXMgY29sdW1uXHJcbmNvbnN0IElURU1fQ09MUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcclxuICBpZGVudDogJ2lkZW50JyxcclxuICB0eXBlOiAndHlwZScsXHJcbiAgdGl0bGU6ICd0aXRsZScsXHJcbiAgYm9keTogJ2JvZHknLFxyXG4gIGJvZHlUZXh0OiAnYm9keV90ZXh0JyxcclxuICBzdGF0dXM6ICdzdGF0dXMnLFxyXG4gIHByaW9yaXR5OiAncHJpb3JpdHknLFxyXG4gIG93bmVySWQ6ICdvd25lcl9pZCcsXHJcbiAgcmVwb3J0ZXJJZDogJ3JlcG9ydGVyX2lkJyxcclxuICBtaWxlc3RvbmVJZDogJ21pbGVzdG9uZV9pZCcsXHJcbiAgcmVsZWFzZUlkOiAncmVsZWFzZV9pZCcsXHJcbiAgcGFyZW50SWQ6ICdwYXJlbnRfaWQnLFxyXG4gIHN0YXJ0RGF0ZTogJ3N0YXJ0X2RhdGUnLFxyXG4gIGR1ZURhdGU6ICdkdWVfZGF0ZScsXHJcbiAgY29tcGxldGVkQXQ6ICdjb21wbGV0ZWRfYXQnLFxyXG4gIGVmZm9ydDogJ2VmZm9ydCcsXHJcbiAgY29uZmlkZW5jZTogJ2NvbmZpZGVuY2UnLFxyXG4gIHJpc2tMZXZlbDogJ3Jpc2tfbGV2ZWwnLFxyXG4gIGJ1c2luZXNzVmFsdWU6ICdidXNpbmVzc192YWx1ZScsXHJcbiAgbGVhZGVyc2hpcFZpc2libGU6ICdsZWFkZXJzaGlwX3Zpc2libGUnLFxyXG4gIHByb2dyZXNzOiAncHJvZ3Jlc3MnLFxyXG4gIHRhZ3M6ICd0YWdzJyxcclxuICBleHRyYTogJ2V4dHJhJyxcclxuICBhcmNoaXZlZDogJ2FyY2hpdmVkJyxcclxuICBzYW1wbGU6ICdzYW1wbGUnLFxyXG4gIGRlbGV0ZWQ6ICdkZWxldGVkJyxcclxuICB1cGRhdGVkQXQ6ICd1cGRhdGVkX2F0JyxcclxuICB1cGRhdGVkQnk6ICd1cGRhdGVkX2J5JyxcclxufTtcclxuXHJcbmNvbnN0IEpTT05fSVRFTV9GSUVMRFMgPSBuZXcgU2V0KFsndGFncycsICdleHRyYSddKTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmVFdmVudHMge1xyXG4gIG9uQ2hhbmdlOiAod2hhdDogeyBlbnRpdHk6IHN0cmluZzsgZW50aXR5SWQ6IHN0cmluZyB9KSA9PiB2b2lkO1xyXG4gIG9uQ29uZmxpY3Q6IChjb25mbGljdDogU3luY0NvbmZsaWN0KSA9PiB2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3RvcmUge1xyXG4gIHJlYWRvbmx5IGRiOiBEQjtcclxuICByZWFkb25seSBkZXZpY2VJZDogc3RyaW5nO1xyXG4gIGFjdG9ySWQ6IHN0cmluZztcclxuICBwcml2YXRlIGV2ZW50czogU3RvcmVFdmVudHM7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGN0eDogRGJDb250ZXh0LCBhY3RvcklkOiBzdHJpbmcsIGV2ZW50cz86IFBhcnRpYWw8U3RvcmVFdmVudHM+KSB7XHJcbiAgICB0aGlzLmRiID0gY3R4LmRiO1xyXG4gICAgdGhpcy5kZXZpY2VJZCA9IGN0eC5kZXZpY2VJZDtcclxuICAgIHRoaXMuYWN0b3JJZCA9IGFjdG9ySWQ7XHJcbiAgICB0aGlzLmV2ZW50cyA9IHtcclxuICAgICAgb25DaGFuZ2U6IGV2ZW50cz8ub25DaGFuZ2UgPz8gKCgpID0+IHt9KSxcclxuICAgICAgb25Db25mbGljdDogZXZlbnRzPy5vbkNvbmZsaWN0ID8/ICgoKSA9PiB7fSksXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBjbG9ja3MgLS0tLS0tLS0tLVxyXG4gIHByaXZhdGUgdGlja0xhbXBvcnQoKTogbnVtYmVyIHtcclxuICAgIGNvbnN0IGN1ciA9IE51bWJlcihnZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JykgPz8gJzAnKSArIDE7XHJcbiAgICBzZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JywgU3RyaW5nKGN1cikpO1xyXG4gICAgcmV0dXJuIGN1cjtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgd2l0bmVzc0xhbXBvcnQocmVtb3RlOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGNvbnN0IGN1ciA9IE51bWJlcihnZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JykgPz8gJzAnKTtcclxuICAgIGlmIChyZW1vdGUgPiBjdXIpIHNldE1ldGEodGhpcy5kYiwgJ2xhbXBvcnQnLCBTdHJpbmcocmVtb3RlKSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG5vdygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZmllbGRDbG9jayhlbnRpdHk6IHN0cmluZywgZW50aXR5SWQ6IHN0cmluZywgZmllbGQ6IHN0cmluZyk6IHsgbGFtcG9ydDogbnVtYmVyOyBkZXZpY2VJZDogc3RyaW5nIH0gfCBudWxsIHtcclxuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBsYW1wb3J0LCBkZXZpY2VfaWQgRlJPTSBmaWVsZF9jbG9jayBXSEVSRSBlbnRpdHk9PyBBTkQgZW50aXR5X2lkPT8gQU5EIGZpZWxkPT8nKVxyXG4gICAgICAuZ2V0KGVudGl0eSwgZW50aXR5SWQsIGZpZWxkKSBhcyB7IGxhbXBvcnQ6IG51bWJlcjsgZGV2aWNlX2lkOiBzdHJpbmcgfSB8IHVuZGVmaW5lZDtcclxuICAgIHJldHVybiByb3cgPyB7IGxhbXBvcnQ6IHJvdy5sYW1wb3J0LCBkZXZpY2VJZDogcm93LmRldmljZV9pZCB9IDogbnVsbDtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc2V0RmllbGRDbG9jayhlbnRpdHk6IHN0cmluZywgZW50aXR5SWQ6IHN0cmluZywgZmllbGQ6IHN0cmluZywgbGFtcG9ydDogbnVtYmVyLCBkZXZpY2VJZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgIGBJTlNFUlQgSU5UTyBmaWVsZF9jbG9jayhlbnRpdHksIGVudGl0eV9pZCwgZmllbGQsIGxhbXBvcnQsIGRldmljZV9pZCkgVkFMVUVTKD8sPyw/LD8sPylcclxuICAgICAgICAgT04gQ09ORkxJQ1QoZW50aXR5LCBlbnRpdHlfaWQsIGZpZWxkKSBETyBVUERBVEUgU0VUIGxhbXBvcnQ9ZXhjbHVkZWQubGFtcG9ydCwgZGV2aWNlX2lkPWV4Y2x1ZGVkLmRldmljZV9pZGAsXHJcbiAgICAgIClcclxuICAgICAgLnJ1bihlbnRpdHksIGVudGl0eUlkLCBmaWVsZCwgbGFtcG9ydCwgZGV2aWNlSWQpO1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBvcGxvZyAtLS0tLS0tLS0tXHJcbiAgcHJpdmF0ZSBhcHBlbmRPcChvcDogT3ApOiB2b2lkIHtcclxuICAgIHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgYElOU0VSVCBJTlRPIG9wbG9nKG9wX2lkLCBkZXZpY2VfaWQsIGFjdG9yX2lkLCBsYW1wb3J0LCBhdCwgZW50aXR5LCBlbnRpdHlfaWQsIGFjdGlvbiwgcGF5bG9hZClcclxuICAgICAgICAgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyw/KWAsXHJcbiAgICAgIClcclxuICAgICAgLnJ1bihvcC5vcElkLCBvcC5kZXZpY2VJZCwgb3AuYWN0b3JJZCwgb3AubGFtcG9ydCwgb3AuYXQsIG9wLmVudGl0eSwgb3AuZW50aXR5SWQsIG9wLmFjdGlvbiwgSlNPTi5zdHJpbmdpZnkob3AucGF5bG9hZCkpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBsb2NhbE9wKFxyXG4gICAgZW50aXR5OiBPcFsnZW50aXR5J10sXHJcbiAgICBlbnRpdHlJZDogc3RyaW5nLFxyXG4gICAgYWN0aW9uOiBPcFsnYWN0aW9uJ10sXHJcbiAgICBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcclxuICApOiBPcCB7XHJcbiAgICBjb25zdCBsYW1wb3J0ID0gdGhpcy50aWNrTGFtcG9ydCgpO1xyXG4gICAgY29uc3Qgb3A6IE9wID0ge1xyXG4gICAgICBvcElkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxyXG4gICAgICBkZXZpY2VJZDogdGhpcy5kZXZpY2VJZCxcclxuICAgICAgYWN0b3JJZDogdGhpcy5hY3RvcklkLFxyXG4gICAgICBsYW1wb3J0LFxyXG4gICAgICBhdDogdGhpcy5ub3coKSxcclxuICAgICAgZW50aXR5LFxyXG4gICAgICBlbnRpdHlJZCxcclxuICAgICAgYWN0aW9uLFxyXG4gICAgICBwYXlsb2FkLFxyXG4gICAgfTtcclxuICAgIHRoaXMuYXBwZW5kT3Aob3ApO1xyXG4gICAgcmV0dXJuIG9wO1xyXG4gIH1cclxuXHJcbiAgLyoqIExvY2FsICdzZXQnOiByZWNvcmRzIGJhc2VkT24gY2xvY2tzIHRoZW4gYWR2YW5jZXMgdGhlbS4gKi9cclxuICBwcml2YXRlIGxvY2FsU2V0KGVudGl0eTogT3BbJ2VudGl0eSddLCBlbnRpdHlJZDogc3RyaW5nLCBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XHJcbiAgICBjb25zdCBiYXNlZE9uOiBSZWNvcmQ8c3RyaW5nLCB7IGxhbXBvcnQ6IG51bWJlcjsgZGV2aWNlSWQ6IHN0cmluZyB9IHwgbnVsbD4gPSB7fTtcclxuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhmaWVsZHMpKSBiYXNlZE9uW2ZdID0gdGhpcy5maWVsZENsb2NrKGVudGl0eSwgZW50aXR5SWQsIGYpO1xyXG4gICAgY29uc3Qgb3AgPSB0aGlzLmxvY2FsT3AoZW50aXR5LCBlbnRpdHlJZCwgJ3NldCcsIHsgZmllbGRzLCBiYXNlZE9uIH0pO1xyXG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKGZpZWxkcykpIHRoaXMuc2V0RmllbGRDbG9jayhlbnRpdHksIGVudGl0eUlkLCBmLCBvcC5sYW1wb3J0LCB0aGlzLmRldmljZUlkKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgbG9jYWxDcmVhdGUoZW50aXR5OiBPcFsnZW50aXR5J10sIGVudGl0eUlkOiBzdHJpbmcsIHJlY29yZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkIHtcclxuICAgIGNvbnN0IG9wID0gdGhpcy5sb2NhbE9wKGVudGl0eSwgZW50aXR5SWQsICdjcmVhdGUnLCB7IHJlY29yZCB9KTtcclxuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhyZWNvcmQpKSB0aGlzLnNldEZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgdGhpcy5kZXZpY2VJZCk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIGlkZW50IGFsbG9jYXRpb24gLS0tLS0tLS0tLVxyXG4gIGFsbG9jSWRlbnQodHlwZTogSXRlbVR5cGUpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgcHJlZml4ID0gSURFTlRfUFJFRklYW3R5cGVdO1xyXG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgbmV4dCBGUk9NIGlkZW50X2NvdW50ZXJzIFdIRVJFIHR5cGU9PycpLmdldCh0eXBlKSBhc1xyXG4gICAgICB8IHsgbmV4dDogbnVtYmVyIH1cclxuICAgICAgfCB1bmRlZmluZWQ7XHJcbiAgICBsZXQgbiA9IHJvdyA/IHJvdy5uZXh0IDogMTtcclxuICAgIC8vIFNraXAgbnVtYmVycyBhbHJlYWR5IHRha2VuIChpbXBvcnRzIG1heSBoYXZlIGFkdmFuY2VkIHVzYWdlIHBhc3Qgb3VyIGNvdW50ZXIpLlxyXG4gICAgd2hpbGUgKHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIDEgRlJPTSBpdGVtcyBXSEVSRSBpZGVudD0/JykuZ2V0KGAke3ByZWZpeH0tJHtufWApKSBuKys7XHJcbiAgICB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBpZGVudF9jb3VudGVycyh0eXBlLG5leHQpIFZBTFVFUyg/LD8pIE9OIENPTkZMSUNUKHR5cGUpIERPIFVQREFURSBTRVQgbmV4dD0/JylcclxuICAgICAgLnJ1bih0eXBlLCBuICsgMSwgbiArIDEpO1xyXG4gICAgcmV0dXJuIGAke3ByZWZpeH0tJHtufWA7XHJcbiAgfVxyXG5cclxuICAvKiogQWR2YW5jZSB0aGUgbG9jYWwgY291bnRlciBwYXN0IGFuIGlkZW50IG9ic2VydmVkIGZyb20gYSBwZWVyLiAqL1xyXG4gIHByaXZhdGUgd2l0bmVzc0lkZW50KHR5cGU6IEl0ZW1UeXBlLCBpZGVudDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCBtID0gLy0oXFxkKykkLy5leGVjKGlkZW50KTtcclxuICAgIGlmICghbSkgcmV0dXJuO1xyXG4gICAgY29uc3QgbiA9IE51bWJlcihtWzFdKTtcclxuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIG5leHQgRlJPTSBpZGVudF9jb3VudGVycyBXSEVSRSB0eXBlPT8nKS5nZXQodHlwZSkgYXNcclxuICAgICAgfCB7IG5leHQ6IG51bWJlciB9XHJcbiAgICAgIHwgdW5kZWZpbmVkO1xyXG4gICAgaWYgKCFyb3cgfHwgcm93Lm5leHQgPD0gbikge1xyXG4gICAgICB0aGlzLmRiXHJcbiAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIGlkZW50X2NvdW50ZXJzKHR5cGUsbmV4dCkgVkFMVUVTKD8sPykgT04gQ09ORkxJQ1QodHlwZSkgRE8gVVBEQVRFIFNFVCBuZXh0PT8nKVxyXG4gICAgICAgIC5ydW4odHlwZSwgbiArIDEsIG4gKyAxKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gYWN0aXZpdHkgLS0tLS0tLS0tLVxyXG4gIC8qKiBQdWJsaWMgYWN0aXZpdHkgaG9vayBmb3IgY29sbGFib3JhdG9ycyBvdXRzaWRlIFN0b3JlIChlLmcuIEF0dGFjaG1lbnRNYW5hZ2VyKS4gKi9cclxuICByZWNvcmRBY3Rpdml0eShpdGVtSWQ6IHN0cmluZyB8IG51bGwsIGtpbmQ6IHN0cmluZywgb2xkVj86IHVua25vd24sIG5ld1Y/OiB1bmtub3duKTogdm9pZCB7XHJcbiAgICB0aGlzLmxvZ0FjdGl2aXR5KGl0ZW1JZCwga2luZCwgbnVsbCwgb2xkViwgbmV3Vik7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2FjdGl2aXR5JywgZW50aXR5SWQ6IGl0ZW1JZCA/PyAnKicgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBgYWN0b3JJZGAvYGF0YCBkZWZhdWx0IHRvIHVzIGFuZCBub3csIHdoaWNoIGlzIHJpZ2h0IGZvciBsb2NhbCBlZGl0cy4gT3BzIGFwcGxpZWQgZnJvbVxyXG4gICAqIGEgdGVhbW1hdGUgcGFzcyB0aGVpciBvd24gXHUyMDE0IGFjdGl2aXR5IGlzIG5vdCBhIHN5bmNlZCBlbnRpdHkgKHRoZSBvcC1sb2cgYWxyZWFkeSBjYXJyaWVzXHJcbiAgICogd2hvIGRpZCB3aGF0IGFuZCB3aGVuKSwgc28gcmVtb3RlIGFjdGl2aXR5IGlzIGRlcml2ZWQgaGVyZSBmcm9tIHRoZSBvcCwgbm90IHNoaXBwZWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBsb2dBY3Rpdml0eShcclxuICAgIGl0ZW1JZDogc3RyaW5nIHwgbnVsbCxcclxuICAgIGtpbmQ6IHN0cmluZyxcclxuICAgIGZpZWxkPzogc3RyaW5nIHwgbnVsbCxcclxuICAgIG9sZFY/OiB1bmtub3duLFxyXG4gICAgbmV3Vj86IHVua25vd24sXHJcbiAgICBhY3RvcklkPzogc3RyaW5nLFxyXG4gICAgYXQ/OiBzdHJpbmcsXHJcbiAgICBpZD86IHN0cmluZyxcclxuICApOiBudW1iZXIge1xyXG4gICAgY29uc3QgaW5mbyA9IHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBhY3Rpdml0eShpZCwgaXRlbV9pZCwgYWN0b3JfaWQsIGtpbmQsIGZpZWxkLCBvbGRfdmFsdWUsIG5ld192YWx1ZSwgYXQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8pJylcclxuICAgICAgLnJ1bihcclxuICAgICAgICBpZCA/PyBjcnlwdG8ucmFuZG9tVVVJRCgpLFxyXG4gICAgICAgIGl0ZW1JZCxcclxuICAgICAgICBhY3RvcklkID8/IHRoaXMuYWN0b3JJZCxcclxuICAgICAgICBraW5kLFxyXG4gICAgICAgIGZpZWxkID8/IG51bGwsXHJcbiAgICAgICAgb2xkViA9PSBudWxsID8gbnVsbCA6IFN0cmluZyhvbGRWKS5zbGljZSgwLCA4MDAwKSxcclxuICAgICAgICBuZXdWID09IG51bGwgPyBudWxsIDogU3RyaW5nKG5ld1YpLnNsaWNlKDAsIDgwMDApLFxyXG4gICAgICAgIGF0ID8/IHRoaXMubm93KCksXHJcbiAgICAgICk7XHJcbiAgICByZXR1cm4gaW5mby5jaGFuZ2VzO1xyXG4gIH1cclxuXHJcbiAgLyoqIFN0YWJsZSBwZXItb3AgYWN0aXZpdHkgaWQsIHNvIGRlcml2aW5nIHRoZSBzYW1lIG9wIHR3aWNlIGlzIGEgbm8tb3AuICovXHJcbiAgcHJpdmF0ZSBvcEFjdGl2aXR5SWQob3BJZDogc3RyaW5nLCBmaWVsZD86IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gZmllbGQgPyBgJHtvcElkfToke2ZpZWxkfWAgOiBvcElkO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVidWlsZCBhY3Rpdml0eSBmb3Igb3BzIHRoYXQgYXJyaXZlZCBmcm9tIG90aGVyIGRldmljZXMgYmVmb3JlIHdlIGRlcml2ZWQgYWN0aXZpdHkgb25cclxuICAgKiBhcHBseSAoaS5lLiBhIHRlYW1tYXRlJ3Mgd2hvbGUgaGlzdG9yeSB0byBkYXRlKS4gSWRzIGNvbWUgZnJvbSB0aGUgb3AgaWQgYW5kIGluc2VydHMgYXJlXHJcbiAgICogT1IgSUdOT1JFLCBzbyB0aGlzIGlzIGlkZW1wb3RlbnQgYW5kIGNhbm5vdCBkb3VibGUgdXAgd2l0aCB0aGUgbGl2ZSBhcHBseSBwYXRoIFx1MjAxNCBzYWZlIHRvXHJcbiAgICogcnVuIG9uIGV2ZXJ5IGJvb3QuXHJcbiAgICpcclxuICAgKiBPbGQgdmFsdWVzIGFyZSBub3QgcmVjb3ZlcmFibGUgZm9yICdzZXQnIG9wcyAodGhlIG9wIGNhcnJpZXMgdGhlIG5ldyB2YWx1ZSBhbmQgYSBjYXVzYWxcclxuICAgKiBiYXNlLCBub3QgdGhlIHByaW9yIHZhbHVlKSwgc28gdGhvc2UgZW50cmllcyByZW5kZXIgYXMgXCJjaGFuZ2VkIFggdG8gWVwiIHdpdGhvdXQgYSBmcm9tLlxyXG4gICAqL1xyXG4gIGJhY2tmaWxsUmVtb3RlQWN0aXZpdHkoKTogbnVtYmVyIHtcclxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgIGBTRUxFQ1Qgb3BfaWQsIGFjdG9yX2lkLCBhdCwgZW50aXR5LCBlbnRpdHlfaWQsIGFjdGlvbiwgcGF5bG9hZCBGUk9NIG9wbG9nXHJcbiAgICAgICAgICBXSEVSRSBkZXZpY2VfaWQgIT0gPyBBTkQgZW50aXR5IElOICgnaXRlbScsJ2NvbW1lbnQnKWAsXHJcbiAgICAgIClcclxuICAgICAgLmFsbCh0aGlzLmRldmljZUlkKSBhcyBBcnJheTx7XHJcbiAgICAgIG9wX2lkOiBzdHJpbmc7IGFjdG9yX2lkOiBzdHJpbmc7IGF0OiBzdHJpbmc7IGVudGl0eTogc3RyaW5nOyBlbnRpdHlfaWQ6IHN0cmluZztcclxuICAgICAgYWN0aW9uOiBzdHJpbmc7IHBheWxvYWQ6IHN0cmluZztcclxuICAgIH0+O1xyXG5cclxuICAgIGxldCBhZGRlZCA9IDA7XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICBmb3IgKGNvbnN0IHIgb2Ygcm93cykge1xyXG4gICAgICAgIGxldCBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICAgICAgICB0cnkgeyBwYXlsb2FkID0gSlNPTi5wYXJzZShyLnBheWxvYWQgfHwgJ3t9Jyk7IH0gY2F0Y2ggeyBjb250aW51ZTsgfVxyXG4gICAgICAgIGNvbnN0IHJlY29yZCA9IChwYXlsb2FkLnJlY29yZCA/PyB7fSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcblxyXG4gICAgICAgIGlmIChyLmVudGl0eSA9PT0gJ2NvbW1lbnQnKSB7XHJcbiAgICAgICAgICBpZiAoci5hY3Rpb24gIT09ICdjcmVhdGUnKSBjb250aW51ZTtcclxuICAgICAgICAgIGFkZGVkICs9IHRoaXMubG9nQWN0aXZpdHkoXHJcbiAgICAgICAgICAgIChyZWNvcmQuaXRlbUlkIGFzIHN0cmluZykgPz8gbnVsbCwgJ2NvbW1lbnQnLCBudWxsLCBudWxsLFxyXG4gICAgICAgICAgICBTdHJpbmcocmVjb3JkLmJvZHlUZXh0ID8/ICcnKS5zbGljZSgwLCAyMDApLFxyXG4gICAgICAgICAgICByLmFjdG9yX2lkLCByLmF0LCB0aGlzLm9wQWN0aXZpdHlJZChyLm9wX2lkKSxcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyLmFjdGlvbiA9PT0gJ2NyZWF0ZScpIHtcclxuICAgICAgICAgIGFkZGVkICs9IHRoaXMubG9nQWN0aXZpdHkoXHJcbiAgICAgICAgICAgIHIuZW50aXR5X2lkLCAnY3JlYXRlZCcsIG51bGwsIG51bGwsIHJlY29yZC50aXRsZSxcclxuICAgICAgICAgICAgci5hY3Rvcl9pZCwgci5hdCwgdGhpcy5vcEFjdGl2aXR5SWQoci5vcF9pZCksXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoci5hY3Rpb24gPT09ICdzZXQnKSB7XHJcbiAgICAgICAgICBjb25zdCBmaWVsZHMgPSAocGF5bG9hZC5maWVsZHMgPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gICAgICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoZmllbGRzKSkge1xyXG4gICAgICAgICAgICBpZiAoayA9PT0gJ3VwZGF0ZWRBdCcgfHwgayA9PT0gJ3VwZGF0ZWRCeScgfHwgayA9PT0gJ2JvZHknIHx8IGsgPT09ICdib2R5VGV4dCcpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBhZGRlZCArPSB0aGlzLmxvZ0FjdGl2aXR5KFxyXG4gICAgICAgICAgICAgIHIuZW50aXR5X2lkLCAndXBkYXRlZCcsIGssIG51bGwsIEpTT05fSVRFTV9GSUVMRFMuaGFzKGspID8gSlNPTi5zdHJpbmdpZnkodikgOiB2LFxyXG4gICAgICAgICAgICAgIHIuYWN0b3JfaWQsIHIuYXQsIHRoaXMub3BBY3Rpdml0eUlkKHIub3BfaWQsIGspLFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKCdib2R5JyBpbiBmaWVsZHMgfHwgJ2JvZHlUZXh0JyBpbiBmaWVsZHMpIHtcclxuICAgICAgICAgICAgYWRkZWQgKz0gdGhpcy5sb2dBY3Rpdml0eShcclxuICAgICAgICAgICAgICByLmVudGl0eV9pZCwgJ2VkaXRlZCcsICdib2R5JywgbnVsbCwgU3RyaW5nKGZpZWxkcy5ib2R5VGV4dCA/PyAnJyksXHJcbiAgICAgICAgICAgICAgci5hY3Rvcl9pZCwgci5hdCwgdGhpcy5vcEFjdGl2aXR5SWQoci5vcF9pZCwgJ2JvZHknKSxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHIuYWN0aW9uID09PSAnZGVsZXRlJykge1xyXG4gICAgICAgICAgYWRkZWQgKz0gdGhpcy5sb2dBY3Rpdml0eShcclxuICAgICAgICAgICAgci5lbnRpdHlfaWQsICdkZWxldGVkJywgbnVsbCwgbnVsbCwgbnVsbCxcclxuICAgICAgICAgICAgci5hY3Rvcl9pZCwgci5hdCwgdGhpcy5vcEFjdGl2aXR5SWQoci5vcF9pZCksXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgcmV0dXJuIGFkZGVkO1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBpdGVtcyAtLS0tLS0tLS0tXHJcbiAgY3JlYXRlSXRlbShpbnB1dDogUGFydGlhbDxXb3JrSXRlbT4gJiB7IHR5cGU6IEl0ZW1UeXBlOyB0aXRsZTogc3RyaW5nIH0pOiBXb3JrSXRlbSB7XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICBjb25zdCBpZCA9IGNyeXB0by5yYW5kb21VVUlEKCk7XHJcbiAgICAgIGNvbnN0IGlkZW50ID0gdGhpcy5hbGxvY0lkZW50KGlucHV0LnR5cGUpO1xyXG4gICAgICBjb25zdCBub3cgPSB0aGlzLm5vdygpO1xyXG4gICAgICBjb25zdCBzdGF0dXNlcyA9IHN0YXR1c2VzRm9yVHlwZShpbnB1dC50eXBlKTtcclxuICAgICAgY29uc3QgaXRlbTogV29ya0l0ZW0gPSB7XHJcbiAgICAgICAgaWQsXHJcbiAgICAgICAgaWRlbnQsXHJcbiAgICAgICAgdHlwZTogaW5wdXQudHlwZSxcclxuICAgICAgICB0aXRsZTogaW5wdXQudGl0bGUsXHJcbiAgICAgICAgYm9keTogaW5wdXQuYm9keSA/PyAnJyxcclxuICAgICAgICBib2R5VGV4dDogaW5wdXQuYm9keVRleHQgPz8gJycsXHJcbiAgICAgICAgc3RhdHVzOiBpbnB1dC5zdGF0dXMgJiYgc3RhdHVzZXMuaW5jbHVkZXMoaW5wdXQuc3RhdHVzKSA/IGlucHV0LnN0YXR1cyA6IHN0YXR1c2VzWzBdLFxyXG4gICAgICAgIHByaW9yaXR5OiBpbnB1dC5wcmlvcml0eSA/PyAnbm9uZScsXHJcbiAgICAgICAgb3duZXJJZDogaW5wdXQub3duZXJJZCA/PyBudWxsLFxyXG4gICAgICAgIHJlcG9ydGVySWQ6IGlucHV0LnJlcG9ydGVySWQgPz8gdGhpcy5hY3RvcklkLFxyXG4gICAgICAgIG1pbGVzdG9uZUlkOiBpbnB1dC5taWxlc3RvbmVJZCA/PyBudWxsLFxyXG4gICAgICAgIHJlbGVhc2VJZDogaW5wdXQucmVsZWFzZUlkID8/IG51bGwsXHJcbiAgICAgICAgcGFyZW50SWQ6IGlucHV0LnBhcmVudElkID8/IG51bGwsXHJcbiAgICAgICAgc3RhcnREYXRlOiBpbnB1dC5zdGFydERhdGUgPz8gbnVsbCxcclxuICAgICAgICBkdWVEYXRlOiBpbnB1dC5kdWVEYXRlID8/IG51bGwsXHJcbiAgICAgICAgY29tcGxldGVkQXQ6IG51bGwsXHJcbiAgICAgICAgZWZmb3J0OiBpbnB1dC5lZmZvcnQgPz8gbnVsbCxcclxuICAgICAgICBjb25maWRlbmNlOiBpbnB1dC5jb25maWRlbmNlID8/IG51bGwsXHJcbiAgICAgICAgcmlza0xldmVsOiBpbnB1dC5yaXNrTGV2ZWwgPz8gbnVsbCxcclxuICAgICAgICBidXNpbmVzc1ZhbHVlOiBpbnB1dC5idXNpbmVzc1ZhbHVlID8/IG51bGwsXHJcbiAgICAgICAgbGVhZGVyc2hpcFZpc2libGU6IGlucHV0LmxlYWRlcnNoaXBWaXNpYmxlID8/IDAsXHJcbiAgICAgICAgcHJvZ3Jlc3M6IGlucHV0LnByb2dyZXNzID8/IG51bGwsXHJcbiAgICAgICAgdGFnczogaW5wdXQudGFncyA/PyBbXSxcclxuICAgICAgICBleHRyYTogaW5wdXQuZXh0cmEgPz8ge30sXHJcbiAgICAgICAgYXJjaGl2ZWQ6IDAsXHJcbiAgICAgICAgc2FtcGxlOiBpbnB1dC5zYW1wbGUgPz8gMCxcclxuICAgICAgICBjcmVhdGVkQXQ6IG5vdyxcclxuICAgICAgICB1cGRhdGVkQXQ6IG5vdyxcclxuICAgICAgICBjcmVhdGVkQnk6IHRoaXMuYWN0b3JJZCxcclxuICAgICAgICB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCxcclxuICAgICAgfTtcclxuICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xyXG4gICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdpdGVtJywgaWQsIHRoaXMuaXRlbVRvUmVjb3JkKGl0ZW0pKTtcclxuICAgICAgdGhpcy5sb2dBY3Rpdml0eShpZCwgJ2NyZWF0ZWQnLCBudWxsLCBudWxsLCBpdGVtLnRpdGxlKTtcclxuICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IGl0ZW0gPSB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdpdGVtJywgZW50aXR5SWQ6IGl0ZW0uaWQgfSk7XHJcbiAgICByZXR1cm4gaXRlbTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaXRlbVRvUmVjb3JkKGl0ZW06IFdvcmtJdGVtKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xyXG4gICAgcmV0dXJuIHsgLi4uaXRlbSwgdGFnczogaXRlbS50YWdzLCBleHRyYTogaXRlbS5leHRyYSB9O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpbnNlcnRJdGVtUm93KGk6IFdvcmtJdGVtKTogdm9pZCB7XHJcbiAgICB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgIGBJTlNFUlQgSU5UTyBpdGVtcyhpZCwgaWRlbnQsIHR5cGUsIHRpdGxlLCBib2R5LCBib2R5X3RleHQsIHN0YXR1cywgcHJpb3JpdHksIG93bmVyX2lkLCByZXBvcnRlcl9pZCxcclxuICAgICAgICAgIG1pbGVzdG9uZV9pZCwgcmVsZWFzZV9pZCwgcGFyZW50X2lkLCBzdGFydF9kYXRlLCBkdWVfZGF0ZSwgY29tcGxldGVkX2F0LCBlZmZvcnQsIGNvbmZpZGVuY2UsXHJcbiAgICAgICAgICByaXNrX2xldmVsLCBidXNpbmVzc192YWx1ZSwgbGVhZGVyc2hpcF92aXNpYmxlLCBwcm9ncmVzcywgdGFncywgZXh0cmEsIGFyY2hpdmVkLCBzYW1wbGUsIGRlbGV0ZWQsXHJcbiAgICAgICAgICBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0LCBjcmVhdGVkX2J5LCB1cGRhdGVkX2J5KVxyXG4gICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LDAsPyw/LD8sPylgLFxyXG4gICAgICApXHJcbiAgICAgIC5ydW4oXHJcbiAgICAgICAgaS5pZCwgaS5pZGVudCwgaS50eXBlLCBpLnRpdGxlLCBpLmJvZHksIGkuYm9keVRleHQsIGkuc3RhdHVzLCBpLnByaW9yaXR5LCBpLm93bmVySWQsIGkucmVwb3J0ZXJJZCxcclxuICAgICAgICBpLm1pbGVzdG9uZUlkLCBpLnJlbGVhc2VJZCwgaS5wYXJlbnRJZCwgaS5zdGFydERhdGUsIGkuZHVlRGF0ZSwgaS5jb21wbGV0ZWRBdCwgaS5lZmZvcnQsIGkuY29uZmlkZW5jZSxcclxuICAgICAgICBpLnJpc2tMZXZlbCwgaS5idXNpbmVzc1ZhbHVlLCBpLmxlYWRlcnNoaXBWaXNpYmxlLCBpLnByb2dyZXNzLCBKU09OLnN0cmluZ2lmeShpLnRhZ3MpLCBKU09OLnN0cmluZ2lmeShpLmV4dHJhKSxcclxuICAgICAgICBpLmFyY2hpdmVkLCBpLnNhbXBsZSwgaS5jcmVhdGVkQXQsIGkudXBkYXRlZEF0LCBpLmNyZWF0ZWRCeSwgaS51cGRhdGVkQnksXHJcbiAgICAgICk7XHJcbiAgfVxyXG5cclxuICB1cGRhdGVJdGVtKGlkOiBzdHJpbmcsIGZpZWxkczogUGFydGlhbDxXb3JrSXRlbT4pOiBXb3JrSXRlbSB8IG51bGwge1xyXG4gICAgY29uc3QgYmVmb3JlID0gdGhpcy5nZXRJdGVtKGlkKTtcclxuICAgIGlmICghYmVmb3JlKSByZXR1cm4gbnVsbDtcclxuICAgIGNvbnN0IGNoYW5nZWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XHJcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XHJcbiAgICAgIGlmICghKGsgaW4gSVRFTV9DT0xTKSB8fCBrID09PSAnZGVsZXRlZCcpIGNvbnRpbnVlO1xyXG4gICAgICBjb25zdCBwcmV2ID0gKGJlZm9yZSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrXTtcclxuICAgICAgY29uc3Qgc2FtZSA9IEpTT05fSVRFTV9GSUVMRFMuaGFzKGspID8gSlNPTi5zdHJpbmdpZnkocHJldikgPT09IEpTT04uc3RyaW5naWZ5KHYpIDogcHJldiA9PT0gdjtcclxuICAgICAgaWYgKCFzYW1lKSBjaGFuZ2VkW2tdID0gdjtcclxuICAgIH1cclxuICAgIGlmIChPYmplY3Qua2V5cyhjaGFuZ2VkKS5sZW5ndGggPT09IDApIHJldHVybiBiZWZvcmU7XHJcblxyXG4gICAgLy8gU3RhdHVzIHRyYW5zaXRpb25zIG1haW50YWluIGNvbXBsZXRlZEF0IGF1dG9tYXRpY2FsbHkuXHJcbiAgICBpZiAoJ3N0YXR1cycgaW4gY2hhbmdlZCkge1xyXG4gICAgICBjb25zdCB0ZXJtaW5hbE5vdyA9IFRFUk1JTkFMX1NUQVRVU0VTLmhhcyhTdHJpbmcoY2hhbmdlZC5zdGF0dXMpKTtcclxuICAgICAgY29uc3QgdGVybWluYWxCZWZvcmUgPSBURVJNSU5BTF9TVEFUVVNFUy5oYXMoYmVmb3JlLnN0YXR1cyk7XHJcbiAgICAgIGlmICh0ZXJtaW5hbE5vdyAmJiAhdGVybWluYWxCZWZvcmUpIGNoYW5nZWQuY29tcGxldGVkQXQgPSB0aGlzLm5vdygpO1xyXG4gICAgICBpZiAoIXRlcm1pbmFsTm93ICYmIHRlcm1pbmFsQmVmb3JlKSBjaGFuZ2VkLmNvbXBsZXRlZEF0ID0gbnVsbDtcclxuICAgIH1cclxuICAgIGNoYW5nZWQudXBkYXRlZEF0ID0gdGhpcy5ub3coKTtcclxuICAgIGNoYW5nZWQudXBkYXRlZEJ5ID0gdGhpcy5hY3RvcklkO1xyXG5cclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIHRoaXMuYXBwbHlJdGVtRmllbGRzKGlkLCBjaGFuZ2VkKTtcclxuICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGlkLCBjaGFuZ2VkKTtcclxuICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoY2hhbmdlZCkpIHtcclxuICAgICAgICBpZiAoayA9PT0gJ3VwZGF0ZWRBdCcgfHwgayA9PT0gJ3VwZGF0ZWRCeScpIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmIChrID09PSAnYm9keScgfHwgayA9PT0gJ2JvZHlUZXh0JykgY29udGludWU7IC8vIGJvZHkgZWRpdHMgbG9nZ2VkIGFzIG9uZSAnZWRpdGVkJyBlbnRyeVxyXG4gICAgICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsICd1cGRhdGVkJywgaywgKGJlZm9yZSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrXSwgSlNPTl9JVEVNX0ZJRUxEUy5oYXMoaykgPyBKU09OLnN0cmluZ2lmeSh2KSA6IHYpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIEJvZHkgZWRpdDogcmVjb3JkIG9sZC9uZXcgcGxhaW4gdGV4dCBzbyB0aGUgYWN0aXZpdHkgZGlmZiBjYW4gc2hvdyBiZWZvcmUvYWZ0ZXIuXHJcbiAgICAgIGlmICgnYm9keScgaW4gY2hhbmdlZCB8fCAnYm9keVRleHQnIGluIGNoYW5nZWQpIHtcclxuICAgICAgICBjb25zdCBuZXdUZXh0ID0gJ2JvZHlUZXh0JyBpbiBjaGFuZ2VkID8gU3RyaW5nKGNoYW5nZWQuYm9keVRleHQgPz8gJycpIDogYmVmb3JlLmJvZHlUZXh0O1xyXG4gICAgICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsICdlZGl0ZWQnLCAnYm9keScsIGJlZm9yZS5ib2R5VGV4dCwgbmV3VGV4dCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnaXRlbScsIGVudGl0eUlkOiBpZCB9KTtcclxuICAgIHJldHVybiB0aGlzLmdldEl0ZW0oaWQpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhcHBseUl0ZW1GaWVsZHMoaWQ6IHN0cmluZywgZmllbGRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQge1xyXG4gICAgY29uc3Qgc2V0czogc3RyaW5nW10gPSBbXTtcclxuICAgIGNvbnN0IHZhbHM6IHVua25vd25bXSA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoZmllbGRzKSkge1xyXG4gICAgICBjb25zdCBjb2wgPSBJVEVNX0NPTFNba107XHJcbiAgICAgIGlmICghY29sKSBjb250aW51ZTtcclxuICAgICAgc2V0cy5wdXNoKGAke2NvbH09P2ApO1xyXG4gICAgICB2YWxzLnB1c2goSlNPTl9JVEVNX0ZJRUxEUy5oYXMoaykgPyBKU09OLnN0cmluZ2lmeSh2KSA6IHYpO1xyXG4gICAgfVxyXG4gICAgaWYgKHNldHMubGVuZ3RoID09PSAwKSByZXR1cm47XHJcbiAgICB2YWxzLnB1c2goaWQpO1xyXG4gICAgdGhpcy5kYi5wcmVwYXJlKGBVUERBVEUgaXRlbXMgU0VUICR7c2V0cy5qb2luKCcsICcpfSBXSEVSRSBpZD0/YCkucnVuKC4uLnZhbHMpO1xyXG4gIH1cclxuXHJcbiAgYXJjaGl2ZUl0ZW0oaWQ6IHN0cmluZywgYXJjaGl2ZWQ6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgIC8vIHVwZGF0ZUl0ZW0gYWxyZWFkeSB3cml0ZXMgdGhlIGFjdGl2aXR5IGVudHJ5IGZvciB0aGUgYXJjaGl2ZWQtZmllbGQgY2hhbmdlLlxyXG4gICAgdGhpcy51cGRhdGVJdGVtKGlkLCB7IGFyY2hpdmVkOiBhcmNoaXZlZCA/IDEgOiAwIH0gYXMgUGFydGlhbDxXb3JrSXRlbT4pO1xyXG4gIH1cclxuXHJcbiAgZGVsZXRlSXRlbShpZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCBzdGFtcCA9IHRoaXMubm93KCk7XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBpdGVtcyBTRVQgZGVsZXRlZD0xLCBkZWxldGVkX2F0PT8sIGRlbGV0ZWRfYnk9PywgdXBkYXRlZF9hdD0/LCB1cGRhdGVkX2J5PT8gV0hFUkUgaWQ9PycpXHJcbiAgICAgICAgLnJ1bihzdGFtcCwgdGhpcy5hY3RvcklkLCBzdGFtcCwgdGhpcy5hY3RvcklkLCBpZCk7XHJcbiAgICAgIHRoaXMubG9jYWxPcCgnaXRlbScsIGlkLCAnZGVsZXRlJywge30pO1xyXG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KGlkLCAnZGVsZXRlZCcpO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdpdGVtJywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gIH1cclxuXHJcbiAgZ2V0SXRlbShpZDogc3RyaW5nKTogV29ya0l0ZW0gfCBudWxsIHtcclxuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBpdGVtcyBXSEVSRSBpZD0/IEFORCBkZWxldGVkPTAnKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xyXG4gICAgcmV0dXJuIHJvdyA/IHJvd1RvSXRlbShyb3cpIDogbnVsbDtcclxuICB9XHJcblxyXG4gIGdldEl0ZW1CeUlkZW50KGlkZW50OiBzdHJpbmcpOiBXb3JrSXRlbSB8IG51bGwge1xyXG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIGl0ZW1zIFdIRVJFIGlkZW50PT8gQ09MTEFURSBOT0NBU0UgQU5EIGRlbGV0ZWQ9MCcpLmdldChpZGVudCkgYXNcclxuICAgICAgfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxyXG4gICAgICB8IHVuZGVmaW5lZDtcclxuICAgIHJldHVybiByb3cgPyByb3dUb0l0ZW0ocm93KSA6IG51bGw7XHJcbiAgfVxyXG5cclxuICBsaXN0SXRlbXMoZmlsdGVyOiBJdGVtRmlsdGVyID0ge30sIHNvcnQ6IEl0ZW1Tb3J0ID0geyBmaWVsZDogJ3VwZGF0ZWRBdCcsIGRpcjogJ2Rlc2MnIH0sIGxpbWl0ID0gNTAwLCBvZmZzZXQgPSAwKTogV29ya0l0ZW1bXSB7XHJcbiAgICBjb25zdCB3aGVyZTogc3RyaW5nW10gPSBbJ2RlbGV0ZWQ9MCddO1xyXG4gICAgY29uc3QgdmFsczogdW5rbm93bltdID0gW107XHJcbiAgICBpZiAoZmlsdGVyLmFyY2hpdmVkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgd2hlcmUucHVzaCgnYXJjaGl2ZWQ9PycpO1xyXG4gICAgICB2YWxzLnB1c2goZmlsdGVyLmFyY2hpdmVkID8gMSA6IDApO1xyXG4gICAgfSBlbHNlIHdoZXJlLnB1c2goJ2FyY2hpdmVkPTAnKTtcclxuICAgIGlmIChmaWx0ZXIudHlwZXM/Lmxlbmd0aCkge1xyXG4gICAgICB3aGVyZS5wdXNoKGB0eXBlIElOICgke2ZpbHRlci50eXBlcy5tYXAoKCkgPT4gJz8nKS5qb2luKCcsJyl9KWApO1xyXG4gICAgICB2YWxzLnB1c2goLi4uZmlsdGVyLnR5cGVzKTtcclxuICAgIH1cclxuICAgIGlmIChmaWx0ZXIuc3RhdHVzZXM/Lmxlbmd0aCkge1xyXG4gICAgICB3aGVyZS5wdXNoKGBzdGF0dXMgSU4gKCR7ZmlsdGVyLnN0YXR1c2VzLm1hcCgoKSA9PiAnPycpLmpvaW4oJywnKX0pYCk7XHJcbiAgICAgIHZhbHMucHVzaCguLi5maWx0ZXIuc3RhdHVzZXMpO1xyXG4gICAgfVxyXG4gICAgaWYgKGZpbHRlci5wcmlvcml0aWVzPy5sZW5ndGgpIHtcclxuICAgICAgd2hlcmUucHVzaChgcHJpb3JpdHkgSU4gKCR7ZmlsdGVyLnByaW9yaXRpZXMubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcclxuICAgICAgdmFscy5wdXNoKC4uLmZpbHRlci5wcmlvcml0aWVzKTtcclxuICAgIH1cclxuICAgIGlmIChmaWx0ZXIub3duZXJJZHM/Lmxlbmd0aCkge1xyXG4gICAgICBjb25zdCBub25OdWxsID0gZmlsdGVyLm93bmVySWRzLmZpbHRlcigobykgPT4gbyAhPT0gbnVsbCk7XHJcbiAgICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICBpZiAobm9uTnVsbC5sZW5ndGgpIHtcclxuICAgICAgICBwYXJ0cy5wdXNoKGBvd25lcl9pZCBJTiAoJHtub25OdWxsLm1hcCgoKSA9PiAnPycpLmpvaW4oJywnKX0pYCk7XHJcbiAgICAgICAgdmFscy5wdXNoKC4uLm5vbk51bGwpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChmaWx0ZXIub3duZXJJZHMuaW5jbHVkZXMobnVsbCkpIHBhcnRzLnB1c2goJ293bmVyX2lkIElTIE5VTEwnKTtcclxuICAgICAgd2hlcmUucHVzaChgKCR7cGFydHMuam9pbignIE9SICcpfSlgKTtcclxuICAgIH1cclxuICAgIGlmIChmaWx0ZXIubWlsZXN0b25lSWQpIHsgd2hlcmUucHVzaCgnbWlsZXN0b25lX2lkPT8nKTsgdmFscy5wdXNoKGZpbHRlci5taWxlc3RvbmVJZCk7IH1cclxuICAgIGlmIChmaWx0ZXIucmVsZWFzZUlkKSB7IHdoZXJlLnB1c2goJ3JlbGVhc2VfaWQ9PycpOyB2YWxzLnB1c2goZmlsdGVyLnJlbGVhc2VJZCk7IH1cclxuICAgIGlmIChmaWx0ZXIucGFyZW50SWQpIHsgd2hlcmUucHVzaCgncGFyZW50X2lkPT8nKTsgdmFscy5wdXNoKGZpbHRlci5wYXJlbnRJZCk7IH1cclxuICAgIGlmIChmaWx0ZXIudGFnKSB7IHdoZXJlLnB1c2goXCJ0YWdzIExJS0UgP1wiKTsgdmFscy5wdXNoKGAlJHtKU09OLnN0cmluZ2lmeShmaWx0ZXIudGFnKX0lYCk7IH1cclxuICAgIGlmIChmaWx0ZXIub3ZlcmR1ZSkgeyB3aGVyZS5wdXNoKFwiZHVlX2RhdGUgSVMgTk9UIE5VTEwgQU5EIGR1ZV9kYXRlIDwgZGF0ZSgnbm93JykgQU5EIGNvbXBsZXRlZF9hdCBJUyBOVUxMXCIpOyB9XHJcbiAgICBpZiAoZmlsdGVyLmR1ZVdpdGhpbkRheXMgIT0gbnVsbCkge1xyXG4gICAgICB3aGVyZS5wdXNoKFwiZHVlX2RhdGUgSVMgTk9UIE5VTEwgQU5EIGR1ZV9kYXRlIDw9IGRhdGUoJ25vdycsID8pIEFORCBjb21wbGV0ZWRfYXQgSVMgTlVMTFwiKTtcclxuICAgICAgdmFscy5wdXNoKGArJHtmaWx0ZXIuZHVlV2l0aGluRGF5c30gZGF5c2ApO1xyXG4gICAgfVxyXG4gICAgaWYgKGZpbHRlci5sZWFkZXJzaGlwVmlzaWJsZSkgd2hlcmUucHVzaCgnbGVhZGVyc2hpcF92aXNpYmxlPTEnKTtcclxuICAgIGlmIChmaWx0ZXIudXBkYXRlZFNpbmNlKSB7IHdoZXJlLnB1c2goJ3VwZGF0ZWRfYXQgPj0gPycpOyB2YWxzLnB1c2goZmlsdGVyLnVwZGF0ZWRTaW5jZSk7IH1cclxuICAgIGlmIChmaWx0ZXIuc2FtcGxlICE9PSB1bmRlZmluZWQpIHsgd2hlcmUucHVzaCgnc2FtcGxlPT8nKTsgdmFscy5wdXNoKGZpbHRlci5zYW1wbGUgPyAxIDogMCk7IH1cclxuICAgIGlmIChmaWx0ZXIudGV4dCkge1xyXG4gICAgICB3aGVyZS5wdXNoKCdyb3dpZCBJTiAoU0VMRUNUIHJvd2lkIEZST00gaXRlbXNfZnRzIFdIRVJFIGl0ZW1zX2Z0cyBNQVRDSCA/KScpO1xyXG4gICAgICB2YWxzLnB1c2goZnRzUXVlcnkoZmlsdGVyLnRleHQpKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzb3J0Q29sOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xyXG4gICAgICBpZGVudDogJ2lkZW50JyxcclxuICAgICAgdGl0bGU6ICd0aXRsZSBDT0xMQVRFIE5PQ0FTRScsXHJcbiAgICAgIHN0YXR1czogJ3N0YXR1cycsXHJcbiAgICAgIHByaW9yaXR5OiBcIkNBU0UgcHJpb3JpdHkgV0hFTiAndXJnZW50JyBUSEVOIDAgV0hFTiAnaGlnaCcgVEhFTiAxIFdIRU4gJ21lZGl1bScgVEhFTiAyIFdIRU4gJ2xvdycgVEhFTiAzIEVMU0UgNCBFTkRcIixcclxuICAgICAgZHVlRGF0ZTogJ2R1ZV9kYXRlIElTIE5VTEwsIGR1ZV9kYXRlJyxcclxuICAgICAgY3JlYXRlZEF0OiAnY3JlYXRlZF9hdCcsXHJcbiAgICAgIHVwZGF0ZWRBdDogJ3VwZGF0ZWRfYXQnLFxyXG4gICAgICBtYW51YWw6ICd1cGRhdGVkX2F0JyxcclxuICAgIH07XHJcbiAgICBjb25zdCBvcmRlciA9IGAke3NvcnRDb2xbc29ydC5maWVsZF0gPz8gJ3VwZGF0ZWRfYXQnfSAke3NvcnQuZGlyID09PSAnYXNjJyA/ICdBU0MnIDogJ0RFU0MnfWA7XHJcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZShgU0VMRUNUICogRlJPTSBpdGVtcyBXSEVSRSAke3doZXJlLmpvaW4oJyBBTkQgJyl9IE9SREVSIEJZICR7b3JkZXJ9IExJTUlUID8gT0ZGU0VUID9gKVxyXG4gICAgICAuYWxsKC4uLnZhbHMsIGxpbWl0LCBvZmZzZXQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XHJcbiAgICByZXR1cm4gcm93cy5tYXAocm93VG9JdGVtKTtcclxuICB9XHJcblxyXG4gIHNlYXJjaCh0ZXh0OiBzdHJpbmcsIGxpbWl0ID0gMzApOiBTZWFyY2hSZXN1bHRbXSB7XHJcbiAgICBpZiAoIXRleHQudHJpbSgpKSByZXR1cm4gW107XHJcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZShcclxuICAgICAgICBgU0VMRUNUIGl0ZW1zLiosIHNuaXBwZXQoaXRlbXNfZnRzLCAyLCAnPDwnLCAnPj4nLCAnXHUyMDI2JywgMTIpIEFTIHNuaXAsIHJhbmsgQVMgc2NvcmVcclxuICAgICAgICAgRlJPTSBpdGVtc19mdHMgSk9JTiBpdGVtcyBPTiBpdGVtcy5yb3dpZCA9IGl0ZW1zX2Z0cy5yb3dpZFxyXG4gICAgICAgICBXSEVSRSBpdGVtc19mdHMgTUFUQ0ggPyBBTkQgaXRlbXMuZGVsZXRlZD0wIEFORCBpdGVtcy5hcmNoaXZlZD0wXHJcbiAgICAgICAgIE9SREVSIEJZIHJhbmsgTElNSVQgP2AsXHJcbiAgICAgIClcclxuICAgICAgLmFsbChmdHNRdWVyeSh0ZXh0KSwgbGltaXQpIGFzIChSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiAmIHsgc25pcDogc3RyaW5nOyBzY29yZTogbnVtYmVyIH0pW107XHJcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7IGl0ZW06IHJvd1RvSXRlbShyKSwgc25pcHBldDogci5zbmlwLCBzY29yZTogci5zY29yZSB9KSk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIGxpbmtzIC0tLS0tLS0tLS1cclxuICBhZGRMaW5rKGZyb21JZDogc3RyaW5nLCB0b0lkOiBzdHJpbmcsIGtpbmQ6IExpbmtLaW5kKTogSXRlbUxpbmsgfCBudWxsIHtcclxuICAgIGlmIChmcm9tSWQgPT09IHRvSWQpIHJldHVybiBudWxsO1xyXG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIGxpbmtzIFdIRVJFIGZyb21faWQ9PyBBTkQgdG9faWQ9PyBBTkQga2luZD0/JylcclxuICAgICAgLmdldChmcm9tSWQsIHRvSWQsIGtpbmQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xyXG4gICAgaWYgKGV4aXN0aW5nICYmICFleGlzdGluZy5kZWxldGVkKSByZXR1cm4gcm93VG9MaW5rKGV4aXN0aW5nKTtcclxuICAgIGNvbnN0IGxpbms6IEl0ZW1MaW5rID0ge1xyXG4gICAgICBpZDogZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuaWQpIDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcclxuICAgICAgZnJvbUlkLFxyXG4gICAgICB0b0lkLFxyXG4gICAgICBraW5kLFxyXG4gICAgICBjcmVhdGVkQXQ6IHRoaXMubm93KCksXHJcbiAgICAgIGNyZWF0ZWRCeTogdGhpcy5hY3RvcklkLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIGlmIChleGlzdGluZykge1xyXG4gICAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGxpbmtzIFNFVCBkZWxldGVkPTAgV0hFUkUgaWQ9PycpLnJ1bihsaW5rLmlkKTtcclxuICAgICAgICB0aGlzLmxvY2FsU2V0KCdsaW5rJywgbGluay5pZCwgeyBkZWxldGVkOiAwIH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZGJcclxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBsaW5rcyhpZCwgZnJvbV9pZCwgdG9faWQsIGtpbmQsIGRlbGV0ZWQsIGNyZWF0ZWRfYXQsIGNyZWF0ZWRfYnkpIFZBTFVFUyg/LD8sPyw/LDAsPyw/KScpXHJcbiAgICAgICAgICAucnVuKGxpbmsuaWQsIGZyb21JZCwgdG9JZCwga2luZCwgbGluay5jcmVhdGVkQXQsIGxpbmsuY3JlYXRlZEJ5KTtcclxuICAgICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdsaW5rJywgbGluay5pZCwgeyAuLi5saW5rIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMubG9nQWN0aXZpdHkoZnJvbUlkLCAnbGluaycsIGtpbmQsIG51bGwsIHRvSWQpO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdsaW5rJywgZW50aXR5SWQ6IGxpbmsuaWQgfSk7XHJcbiAgICByZXR1cm4gbGluaztcclxuICB9XHJcblxyXG4gIHJlbW92ZUxpbmsoaWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgZnJvbV9pZCwga2luZCwgdG9faWQgRlJPTSBsaW5rcyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhc1xyXG4gICAgICB8IHsgZnJvbV9pZDogc3RyaW5nOyBraW5kOiBzdHJpbmc7IHRvX2lkOiBzdHJpbmcgfVxyXG4gICAgICB8IHVuZGVmaW5lZDtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGxpbmtzIFNFVCBkZWxldGVkPTEgV0hFUkUgaWQ9PycpLnJ1bihpZCk7XHJcbiAgICAgIHRoaXMubG9jYWxTZXQoJ2xpbmsnLCBpZCwgeyBkZWxldGVkOiAxIH0pO1xyXG4gICAgICBpZiAocm93KSB0aGlzLmxvZ0FjdGl2aXR5KHJvdy5mcm9tX2lkLCAndW5saW5rJywgcm93LmtpbmQsIHJvdy50b19pZCwgbnVsbCk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2xpbmsnLCBlbnRpdHlJZDogaWQgfSk7XHJcbiAgfVxyXG5cclxuICBsaW5rc0ZvcihpdGVtSWQ6IHN0cmluZyk6IHsgbGluazogSXRlbUxpbms7IGRpcmVjdGlvbjogJ291dCcgfCAnaW4nOyBvdGhlcjogV29ya0l0ZW0gfVtdIHtcclxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIGxpbmtzIFdIRVJFIChmcm9tX2lkPT8gT1IgdG9faWQ9PykgQU5EIGRlbGV0ZWQ9MCcpXHJcbiAgICAgIC5hbGwoaXRlbUlkLCBpdGVtSWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XHJcbiAgICBjb25zdCBvdXQ6IHsgbGluazogSXRlbUxpbms7IGRpcmVjdGlvbjogJ291dCcgfCAnaW4nOyBvdGhlcjogV29ya0l0ZW0gfVtdID0gW107XHJcbiAgICBmb3IgKGNvbnN0IHIgb2Ygcm93cykge1xyXG4gICAgICBjb25zdCBsaW5rID0gcm93VG9MaW5rKHIpO1xyXG4gICAgICBjb25zdCBkaXJlY3Rpb24gPSBsaW5rLmZyb21JZCA9PT0gaXRlbUlkID8gJ291dCcgOiAnaW4nO1xyXG4gICAgICBjb25zdCBvdGhlciA9IHRoaXMuZ2V0SXRlbShkaXJlY3Rpb24gPT09ICdvdXQnID8gbGluay50b0lkIDogbGluay5mcm9tSWQpO1xyXG4gICAgICBpZiAob3RoZXIpIG91dC5wdXNoKHsgbGluaywgZGlyZWN0aW9uLCBvdGhlciB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBvdXQ7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIGNvbW1lbnRzIC0tLS0tLS0tLS1cclxuICBhZGRDb21tZW50KGl0ZW1JZDogc3RyaW5nLCBib2R5OiBzdHJpbmcsIGJvZHlUZXh0OiBzdHJpbmcpOiBDb21tZW50IHtcclxuICAgIGNvbnN0IGM6IENvbW1lbnQgPSB7XHJcbiAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxyXG4gICAgICBpdGVtSWQsXHJcbiAgICAgIGF1dGhvcklkOiB0aGlzLmFjdG9ySWQsXHJcbiAgICAgIGJvZHksXHJcbiAgICAgIGJvZHlUZXh0LFxyXG4gICAgICBjcmVhdGVkQXQ6IHRoaXMubm93KCksXHJcbiAgICAgIHVwZGF0ZWRBdDogbnVsbCxcclxuICAgICAgZGVsZXRlZDogMCxcclxuICAgIH07XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICB0aGlzLmRiXHJcbiAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIGNvbW1lbnRzKGlkLCBpdGVtX2lkLCBhdXRob3JfaWQsIGJvZHksIGJvZHlfdGV4dCwgY3JlYXRlZF9hdCwgdXBkYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sMCknKVxyXG4gICAgICAgIC5ydW4oYy5pZCwgYy5pdGVtSWQsIGMuYXV0aG9ySWQsIGMuYm9keSwgYy5ib2R5VGV4dCwgYy5jcmVhdGVkQXQsIGMudXBkYXRlZEF0KTtcclxuICAgICAgdGhpcy5sb2NhbENyZWF0ZSgnY29tbWVudCcsIGMuaWQsIHsgLi4uYyB9KTtcclxuICAgICAgdGhpcy5sb2dBY3Rpdml0eShpdGVtSWQsICdjb21tZW50JywgbnVsbCwgbnVsbCwgYm9keVRleHQuc2xpY2UoMCwgMjAwKSk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2NvbW1lbnQnLCBlbnRpdHlJZDogYy5pZCB9KTtcclxuICAgIHJldHVybiBjO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlQ29tbWVudChpZDogc3RyaW5nLCBib2R5OiBzdHJpbmcsIGJvZHlUZXh0OiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGl0ZW1faWQgRlJPTSBjb21tZW50cyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhcyB7IGl0ZW1faWQ6IHN0cmluZyB9IHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3QgZmllbGRzID0geyBib2R5LCBib2R5VGV4dCwgdXBkYXRlZEF0OiB0aGlzLm5vdygpLCB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCB9O1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgY29tbWVudHMgU0VUIGJvZHk9PywgYm9keV90ZXh0PT8sIHVwZGF0ZWRfYXQ9PywgdXBkYXRlZF9ieT0/IFdIRVJFIGlkPT8nKVxyXG4gICAgICAgIC5ydW4oYm9keSwgYm9keVRleHQsIGZpZWxkcy51cGRhdGVkQXQsIGZpZWxkcy51cGRhdGVkQnksIGlkKTtcclxuICAgICAgdGhpcy5sb2NhbFNldCgnY29tbWVudCcsIGlkLCBmaWVsZHMpO1xyXG4gICAgICBpZiAocm93KSB0aGlzLmxvZ0FjdGl2aXR5KHJvdy5pdGVtX2lkLCAnY29tbWVudF9lZGl0ZWQnLCBudWxsLCBudWxsLCBib2R5VGV4dC5zbGljZSgwLCAyMDApKTtcclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnY29tbWVudCcsIGVudGl0eUlkOiBpZCB9KTtcclxuICB9XHJcblxyXG4gIGRlbGV0ZUNvbW1lbnQoaWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaXRlbV9pZCwgYm9keV90ZXh0IEZST00gY29tbWVudHMgV0hFUkUgaWQ9PycpLmdldChpZCkgYXNcclxuICAgICAgfCB7IGl0ZW1faWQ6IHN0cmluZzsgYm9keV90ZXh0OiBzdHJpbmcgfVxyXG4gICAgICB8IHVuZGVmaW5lZDtcclxuICAgIGNvbnN0IHN0YW1wID0gdGhpcy5ub3coKTtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGNvbW1lbnRzIFNFVCBkZWxldGVkPTEsIGRlbGV0ZWRfYXQ9PywgZGVsZXRlZF9ieT0/IFdIRVJFIGlkPT8nKS5ydW4oc3RhbXAsIHRoaXMuYWN0b3JJZCwgaWQpO1xyXG4gICAgICB0aGlzLmxvY2FsU2V0KCdjb21tZW50JywgaWQsIHsgZGVsZXRlZDogMSwgZGVsZXRlZEF0OiBzdGFtcCwgZGVsZXRlZEJ5OiB0aGlzLmFjdG9ySWQgfSk7XHJcbiAgICAgIGlmIChyb3cpIHRoaXMubG9nQWN0aXZpdHkocm93Lml0ZW1faWQsICdjb21tZW50X2RlbGV0ZWQnLCBudWxsLCByb3cuYm9keV90ZXh0LnNsaWNlKDAsIDIwMCksIG51bGwpO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdjb21tZW50JywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gIH1cclxuXHJcbiAgY29tbWVudHNGb3IoaXRlbUlkOiBzdHJpbmcpOiBDb21tZW50W10ge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gY29tbWVudHMgV0hFUkUgaXRlbV9pZD0/IEFORCBkZWxldGVkPTAgT1JERVIgQlkgY3JlYXRlZF9hdCBBU0MnKVxyXG4gICAgICAuYWxsKGl0ZW1JZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcclxuICAgICAgaWQ6IFN0cmluZyhyLmlkKSxcclxuICAgICAgaXRlbUlkOiBTdHJpbmcoci5pdGVtX2lkKSxcclxuICAgICAgYXV0aG9ySWQ6IFN0cmluZyhyLmF1dGhvcl9pZCksXHJcbiAgICAgIGJvZHk6IFN0cmluZyhyLmJvZHkpLFxyXG4gICAgICBib2R5VGV4dDogU3RyaW5nKHIuYm9keV90ZXh0KSxcclxuICAgICAgY3JlYXRlZEF0OiBTdHJpbmcoci5jcmVhdGVkX2F0KSxcclxuICAgICAgdXBkYXRlZEF0OiByLnVwZGF0ZWRfYXQgPyBTdHJpbmcoci51cGRhdGVkX2F0KSA6IG51bGwsXHJcbiAgICAgIGRlbGV0ZWQ6IDAsXHJcbiAgICB9KSk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIHZlcnNpb25zIC0tLS0tLS0tLS1cclxuICBzYXZlVmVyc2lvbihpdGVtSWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0SXRlbShpdGVtSWQpO1xyXG4gICAgaWYgKCFpdGVtKSByZXR1cm47XHJcbiAgICBjb25zdCBsYXN0ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgTUFYKHZlcnNpb24pIEFTIHYgRlJPTSBpdGVtX3ZlcnNpb25zIFdIRVJFIGl0ZW1faWQ9PycpLmdldChpdGVtSWQpIGFzIHsgdjogbnVtYmVyIHwgbnVsbCB9O1xyXG4gICAgdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gaXRlbV92ZXJzaW9ucyhpZCwgaXRlbV9pZCwgdmVyc2lvbiwgdGl0bGUsIGJvZHksIHNhdmVkX2J5LCBzYXZlZF9hdCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8pJylcclxuICAgICAgLnJ1bihjcnlwdG8ucmFuZG9tVVVJRCgpLCBpdGVtSWQsIChsYXN0LnYgPz8gMCkgKyAxLCBpdGVtLnRpdGxlLCBpdGVtLmJvZHksIHRoaXMuYWN0b3JJZCwgdGhpcy5ub3coKSk7XHJcbiAgfVxyXG5cclxuICB2ZXJzaW9uc0ZvcihpdGVtSWQ6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBpZCwgaXRlbV9pZCBBUyBpdGVtSWQsIHZlcnNpb24sIHRpdGxlLCBib2R5LCBzYXZlZF9ieSBBUyBzYXZlZEJ5LCBzYXZlZF9hdCBBUyBzYXZlZEF0IEZST00gaXRlbV92ZXJzaW9ucyBXSEVSRSBpdGVtX2lkPT8gT1JERVIgQlkgdmVyc2lvbiBERVNDJylcclxuICAgICAgLmFsbChpdGVtSWQpO1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSB1c2VycyAtLS0tLS0tLS0tXHJcbiAgdXBzZXJ0VXNlcih1OiB7IGlkOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgaW5pdGlhbHM6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9KTogVXNlciB7XHJcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSB1c2VycyBXSEVSRSBpZD0/JykuZ2V0KHUuaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3QgdXNlcjogVXNlciA9IHtcclxuICAgICAgLi4udSxcclxuICAgICAgY3JlYXRlZEF0OiBleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5jcmVhdGVkX2F0KSA6IHRoaXMubm93KCksXHJcbiAgICB9O1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgLy8gUmUtYWRkaW5nIGEgcmVtb3ZlZCBtZW1iZXIgKHNhbWUgaWQpIHJldml2ZXMgdGhlIHJvdyByYXRoZXIgdGhhbiBmYWlsaW5nIG9uIHRoZVxyXG4gICAgICAvLyBwcmltYXJ5IGtleSBcdTIwMTQgdGhlIHRvbWJzdG9uZSBpcyBsaWZ0ZWQgYW5kIHRoYXQgbGlmdCBzeW5jcyBsaWtlIGFueSBvdGhlciBzZXQuXHJcbiAgICAgIHRoaXMuZGJcclxuICAgICAgICAucHJlcGFyZShcclxuICAgICAgICAgIGBJTlNFUlQgSU5UTyB1c2VycyhpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBjcmVhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LDApXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT1leGNsdWRlZC5uYW1lLCBpbml0aWFscz1leGNsdWRlZC5pbml0aWFscywgY29sb3I9ZXhjbHVkZWQuY29sb3IsIGRlbGV0ZWQ9MGAsXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC5ydW4odXNlci5pZCwgdXNlci5uYW1lLCB1c2VyLmluaXRpYWxzLCB1c2VyLmNvbG9yLCB1c2VyLmNyZWF0ZWRBdCk7XHJcbiAgICAgIGlmICghZXhpc3RpbmcpIHRoaXMubG9jYWxDcmVhdGUoJ3VzZXInLCB1c2VyLmlkLCB7IC4uLnVzZXIgfSk7XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IGZpZWxkczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7IG5hbWU6IHVzZXIubmFtZSwgaW5pdGlhbHM6IHVzZXIuaW5pdGlhbHMsIGNvbG9yOiB1c2VyLmNvbG9yIH07XHJcbiAgICAgICAgaWYgKE51bWJlcihleGlzdGluZy5kZWxldGVkKSA9PT0gMSkgZmllbGRzLmRlbGV0ZWQgPSAwO1xyXG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ3VzZXInLCB1c2VyLmlkLCBmaWVsZHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ3VzZXInLCBlbnRpdHlJZDogdXNlci5pZCB9KTtcclxuICAgIHJldHVybiB1c2VyO1xyXG4gIH1cclxuXHJcbiAgbGlzdFVzZXJzKCk6IFVzZXJbXSB7XHJcbiAgICByZXR1cm4gKHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkLCBuYW1lLCBpbml0aWFscywgY29sb3IsIGF2YXRhciwgY3JlYXRlZF9hdCBBUyBjcmVhdGVkQXQgRlJPTSB1c2VycyBXSEVSRSBkZWxldGVkPTAnKS5hbGwoKSBhcyBVc2VyW10pO1xyXG4gIH1cclxuXHJcbiAgLyoqIFJlbW92ZSBhIG1lbWJlciBmb3IgZXZlcnlvbmUuIFNvZnQgZGVsZXRlICh0b21ic3RvbmUpIHNvIHJlY29yZHMgdGhleSBvd24gb3JcclxuICAgICAgYXV0aG9yZWQga2VlcCByZXNvbHZpbmc7IGVtaXRzIGEgc3luY2VkICdkZWxldGUnIG9wLiBSZXR1cm5zIGZhbHNlIGlmIHVua25vd24uICovXHJcbiAgZGVsZXRlVXNlcihpZDogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCBleGlzdHMgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAxIEZST00gdXNlcnMgV0hFUkUgaWQ9PyBBTkQgZGVsZXRlZD0wJykuZ2V0KGlkKTtcclxuICAgIGlmICghZXhpc3RzKSByZXR1cm4gZmFsc2U7XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSB1c2VycyBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT8nKS5ydW4oaWQpO1xyXG4gICAgICB0aGlzLmxvY2FsT3AoJ3VzZXInLCBpZCwgJ2RlbGV0ZScsIHt9KTtcclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAndXNlcicsIGVudGl0eUlkOiBpZCB9KTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqIFNldCAob3IgY2xlYXIsIHdpdGggbnVsbCkgYSB1c2VyJ3MgYXZhdGFyIGltYWdlLiBFbWl0cyBhIHN5bmNlZCAnc2V0JyBvcC4gKi9cclxuICBzZXRVc2VyQXZhdGFyKGlkOiBzdHJpbmcsIGF2YXRhcjogc3RyaW5nIHwgbnVsbCk6IFVzZXIgfCBudWxsIHtcclxuICAgIGNvbnN0IGV4aXN0cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIDEgRlJPTSB1c2VycyBXSEVSRSBpZD0/JykuZ2V0KGlkKTtcclxuICAgIGlmICghZXhpc3RzKSByZXR1cm4gbnVsbDtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIHVzZXJzIFNFVCBhdmF0YXI9PyBXSEVSRSBpZD0/JykucnVuKGF2YXRhciwgaWQpO1xyXG4gICAgICB0aGlzLmxvY2FsU2V0KCd1c2VyJywgaWQsIHsgYXZhdGFyIH0pO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICd1c2VyJywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gICAgcmV0dXJuIHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBhdmF0YXIsIGNyZWF0ZWRfYXQgQVMgY3JlYXRlZEF0IEZST00gdXNlcnMgV0hFUkUgaWQ9PycpXHJcbiAgICAgIC5nZXQoaWQpIGFzIFVzZXI7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIG1pbGVzdG9uZXMgLyByZWxlYXNlcyAtLS0tLS0tLS0tXHJcbiAgdXBzZXJ0TWlsZXN0b25lKG06IFBhcnRpYWw8TWlsZXN0b25lPiAmIHsgbmFtZTogc3RyaW5nIH0pOiBNaWxlc3RvbmUge1xyXG4gICAgY29uc3QgaWQgPSBtLmlkID8/IGNyeXB0by5yYW5kb21VVUlEKCk7XHJcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBtaWxlc3RvbmVzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3Qgbm93ID0gdGhpcy5ub3coKTtcclxuICAgIGNvbnN0IGNyZWF0ZWRBdCA9IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmNyZWF0ZWRfYXQgfHwgbm93KSA6IG5vdztcclxuICAgIGNvbnN0IGNyZWF0ZWRCeSA9IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmNyZWF0ZWRfYnkgfHwgdGhpcy5hY3RvcklkKSA6IHRoaXMuYWN0b3JJZDtcclxuICAgIGNvbnN0IHJlYzogTWlsZXN0b25lID0ge1xyXG4gICAgICBpZCxcclxuICAgICAgbmFtZTogbS5uYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogbS5kZXNjcmlwdGlvbiA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuZGVzY3JpcHRpb24pIDogJycpLFxyXG4gICAgICB0YXJnZXREYXRlOiBtLnRhcmdldERhdGUgPz8gKGV4aXN0aW5nID8gKGV4aXN0aW5nLnRhcmdldF9kYXRlIGFzIHN0cmluZyB8IG51bGwpIDogbnVsbCksXHJcbiAgICAgIHN0YXR1czogKG0uc3RhdHVzID8/IChleGlzdGluZyA/IGV4aXN0aW5nLnN0YXR1cyA6ICdwbGFubmVkJykpIGFzIE1pbGVzdG9uZVsnc3RhdHVzJ10sXHJcbiAgICAgIHNvcnQ6IG0uc29ydCA/PyAoZXhpc3RpbmcgPyBOdW1iZXIoZXhpc3Rpbmcuc29ydCkgOiAwKSxcclxuICAgICAgc2FtcGxlOiBtLnNhbXBsZSA/PyAoZXhpc3RpbmcgPyAoTnVtYmVyKGV4aXN0aW5nLnNhbXBsZSkgYXMgMCB8IDEpIDogMCksXHJcbiAgICAgIGNyZWF0ZWRBdCwgY3JlYXRlZEJ5LCB1cGRhdGVkQXQ6IG5vdywgdXBkYXRlZEJ5OiB0aGlzLmFjdG9ySWQsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYlxyXG4gICAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgICAgYElOU0VSVCBJTlRPIG1pbGVzdG9uZXMoaWQsIG5hbWUsIGRlc2NyaXB0aW9uLCB0YXJnZXRfZGF0ZSwgc3RhdHVzLCBzb3J0LCBzYW1wbGUsIGRlbGV0ZWQsIGNyZWF0ZWRfYXQsIGNyZWF0ZWRfYnksIHVwZGF0ZWRfYXQsIHVwZGF0ZWRfYnkpXHJcbiAgICAgICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPywwLD8sPyw/LD8pXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCBkZXNjcmlwdGlvbj0/LCB0YXJnZXRfZGF0ZT0/LCBzdGF0dXM9Pywgc29ydD0/LCBkZWxldGVkPTAsIHVwZGF0ZWRfYXQ9PywgdXBkYXRlZF9ieT0/YCxcclxuICAgICAgICApXHJcbiAgICAgICAgLnJ1bihyZWMuaWQsIHJlYy5uYW1lLCByZWMuZGVzY3JpcHRpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuc29ydCwgcmVjLnNhbXBsZSwgY3JlYXRlZEF0LCBjcmVhdGVkQnksIG5vdywgdGhpcy5hY3RvcklkLFxyXG4gICAgICAgICAgICAgcmVjLm5hbWUsIHJlYy5kZXNjcmlwdGlvbiwgcmVjLnRhcmdldERhdGUsIHJlYy5zdGF0dXMsIHJlYy5zb3J0LCBub3csIHRoaXMuYWN0b3JJZCk7XHJcbiAgICAgIGlmICghZXhpc3RpbmcpIHtcclxuICAgICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdtaWxlc3RvbmUnLCBpZCwgeyAuLi5yZWMgfSk7XHJcbiAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShudWxsLCAnbWlsZXN0b25lX2NyZWF0ZWQnLCAnbWlsZXN0b25lJywgbnVsbCwgcmVjLm5hbWUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ21pbGVzdG9uZScsIGlkLCB7IG5hbWU6IHJlYy5uYW1lLCBkZXNjcmlwdGlvbjogcmVjLmRlc2NyaXB0aW9uLCB0YXJnZXREYXRlOiByZWMudGFyZ2V0RGF0ZSwgc3RhdHVzOiByZWMuc3RhdHVzLCBzb3J0OiByZWMuc29ydCwgdXBkYXRlZEF0OiBub3csIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH0pO1xyXG4gICAgICAgIHRoaXMubG9nQWN0aXZpdHkobnVsbCwgJ21pbGVzdG9uZV91cGRhdGVkJywgJ21pbGVzdG9uZScsIFN0cmluZyhleGlzdGluZy5uYW1lKSwgcmVjLm5hbWUpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ21pbGVzdG9uZScsIGVudGl0eUlkOiBpZCB9KTtcclxuICAgIHJldHVybiByZWM7XHJcbiAgfVxyXG5cclxuICBsaXN0TWlsZXN0b25lcygpOiBNaWxlc3RvbmVbXSB7XHJcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgZGVsZXRlZD0wIE9SREVSIEJZIHNvcnQsIHRhcmdldF9kYXRlJykuYWxsKCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcclxuICAgICAgaWQ6IFN0cmluZyhyLmlkKSwgbmFtZTogU3RyaW5nKHIubmFtZSksIGRlc2NyaXB0aW9uOiBTdHJpbmcoci5kZXNjcmlwdGlvbiksXHJcbiAgICAgIHRhcmdldERhdGU6IHIudGFyZ2V0X2RhdGUgPyBTdHJpbmcoci50YXJnZXRfZGF0ZSkgOiBudWxsLFxyXG4gICAgICBzdGF0dXM6IHIuc3RhdHVzIGFzIE1pbGVzdG9uZVsnc3RhdHVzJ10sIHNvcnQ6IE51bWJlcihyLnNvcnQpLCBzYW1wbGU6IE51bWJlcihyLnNhbXBsZSkgYXMgMCB8IDEsXHJcbiAgICAgIGNyZWF0ZWRBdDogci5jcmVhdGVkX2F0ID8gU3RyaW5nKHIuY3JlYXRlZF9hdCkgOiAnJywgY3JlYXRlZEJ5OiByLmNyZWF0ZWRfYnkgPyBTdHJpbmcoci5jcmVhdGVkX2J5KSA6ICcnLFxyXG4gICAgICB1cGRhdGVkQXQ6IHIudXBkYXRlZF9hdCA/IFN0cmluZyhyLnVwZGF0ZWRfYXQpIDogJycsIHVwZGF0ZWRCeTogci51cGRhdGVkX2J5ID8gU3RyaW5nKHIudXBkYXRlZF9ieSkgOiAnJyxcclxuICAgIH0pKTtcclxuICB9XHJcblxyXG4gIHVwc2VydFJlbGVhc2UobTogUGFydGlhbDxSZWxlYXNlPiAmIHsgbmFtZTogc3RyaW5nIH0pOiBSZWxlYXNlIHtcclxuICAgIGNvbnN0IGlkID0gbS5pZCA/PyBjcnlwdG8ucmFuZG9tVVVJRCgpO1xyXG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gcmVsZWFzZXMgV0hFUkUgaWQ9PycpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCBub3cgPSB0aGlzLm5vdygpO1xyXG4gICAgY29uc3QgY3JlYXRlZEF0ID0gZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuY3JlYXRlZF9hdCB8fCBub3cpIDogbm93O1xyXG4gICAgY29uc3QgY3JlYXRlZEJ5ID0gZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuY3JlYXRlZF9ieSB8fCB0aGlzLmFjdG9ySWQpIDogdGhpcy5hY3RvcklkO1xyXG4gICAgY29uc3QgcmVjOiBSZWxlYXNlID0ge1xyXG4gICAgICBpZCxcclxuICAgICAgbmFtZTogbS5uYW1lLFxyXG4gICAgICB2ZXJzaW9uOiBtLnZlcnNpb24gPz8gKGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLnZlcnNpb24pIDogJycpLFxyXG4gICAgICB0YXJnZXREYXRlOiBtLnRhcmdldERhdGUgPz8gKGV4aXN0aW5nID8gKGV4aXN0aW5nLnRhcmdldF9kYXRlIGFzIHN0cmluZyB8IG51bGwpIDogbnVsbCksXHJcbiAgICAgIHN0YXR1czogKG0uc3RhdHVzID8/IChleGlzdGluZyA/IGV4aXN0aW5nLnN0YXR1cyA6ICdwbGFubmVkJykpIGFzIFJlbGVhc2VbJ3N0YXR1cyddLFxyXG4gICAgICBnb2FsczogbS5nb2FscyA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuZ29hbHMpIDogJycpLFxyXG4gICAgICBub3RlczogbS5ub3RlcyA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3Rpbmcubm90ZXMpIDogJycpLFxyXG4gICAgICBzYW1wbGU6IG0uc2FtcGxlID8/IChleGlzdGluZyA/IChOdW1iZXIoZXhpc3Rpbmcuc2FtcGxlKSBhcyAwIHwgMSkgOiAwKSxcclxuICAgICAgY3JlYXRlZEF0LCBjcmVhdGVkQnksIHVwZGF0ZWRBdDogbm93LCB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCxcclxuICAgIH07XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICB0aGlzLmRiXHJcbiAgICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgICBgSU5TRVJUIElOVE8gcmVsZWFzZXMoaWQsIG5hbWUsIHZlcnNpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIGdvYWxzLCBub3Rlcywgc2FtcGxlLCBkZWxldGVkLCBjcmVhdGVkX2F0LCBjcmVhdGVkX2J5LCB1cGRhdGVkX2F0LCB1cGRhdGVkX2J5KVxyXG4gICAgICAgICAgICAgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPywwLD8sPyw/LD8pXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCB2ZXJzaW9uPT8sIHRhcmdldF9kYXRlPT8sIHN0YXR1cz0/LCBnb2Fscz0/LCBub3Rlcz0/LCBkZWxldGVkPTAsIHVwZGF0ZWRfYXQ9PywgdXBkYXRlZF9ieT0/YCxcclxuICAgICAgICApXHJcbiAgICAgICAgLnJ1bihyZWMuaWQsIHJlYy5uYW1lLCByZWMudmVyc2lvbiwgcmVjLnRhcmdldERhdGUsIHJlYy5zdGF0dXMsIHJlYy5nb2FscywgcmVjLm5vdGVzLCByZWMuc2FtcGxlLCBjcmVhdGVkQXQsIGNyZWF0ZWRCeSwgbm93LCB0aGlzLmFjdG9ySWQsXHJcbiAgICAgICAgICAgICByZWMubmFtZSwgcmVjLnZlcnNpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuZ29hbHMsIHJlYy5ub3Rlcywgbm93LCB0aGlzLmFjdG9ySWQpO1xyXG4gICAgICBpZiAoIWV4aXN0aW5nKSB7XHJcbiAgICAgICAgdGhpcy5sb2NhbENyZWF0ZSgncmVsZWFzZScsIGlkLCB7IC4uLnJlYyB9KTtcclxuICAgICAgICB0aGlzLmxvZ0FjdGl2aXR5KG51bGwsICdyZWxlYXNlX2NyZWF0ZWQnLCAncmVsZWFzZScsIG51bGwsIHJlYy5uYW1lKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmxvY2FsU2V0KCdyZWxlYXNlJywgaWQsIHsgbmFtZTogcmVjLm5hbWUsIHZlcnNpb246IHJlYy52ZXJzaW9uLCB0YXJnZXREYXRlOiByZWMudGFyZ2V0RGF0ZSwgc3RhdHVzOiByZWMuc3RhdHVzLCBnb2FsczogcmVjLmdvYWxzLCBub3RlczogcmVjLm5vdGVzLCB1cGRhdGVkQXQ6IG5vdywgdXBkYXRlZEJ5OiB0aGlzLmFjdG9ySWQgfSk7XHJcbiAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShudWxsLCAncmVsZWFzZV91cGRhdGVkJywgJ3JlbGVhc2UnLCBTdHJpbmcoZXhpc3RpbmcubmFtZSksIHJlYy5uYW1lKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdyZWxlYXNlJywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gICAgcmV0dXJuIHJlYztcclxuICB9XHJcblxyXG4gIGxpc3RSZWxlYXNlcygpOiBSZWxlYXNlW10ge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSByZWxlYXNlcyBXSEVSRSBkZWxldGVkPTAgT1JERVIgQlkgdGFyZ2V0X2RhdGUnKS5hbGwoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xyXG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xyXG4gICAgICBpZDogU3RyaW5nKHIuaWQpLCBuYW1lOiBTdHJpbmcoci5uYW1lKSwgdmVyc2lvbjogU3RyaW5nKHIudmVyc2lvbiksXHJcbiAgICAgIHRhcmdldERhdGU6IHIudGFyZ2V0X2RhdGUgPyBTdHJpbmcoci50YXJnZXRfZGF0ZSkgOiBudWxsLFxyXG4gICAgICBzdGF0dXM6IHIuc3RhdHVzIGFzIFJlbGVhc2VbJ3N0YXR1cyddLCBnb2FsczogU3RyaW5nKHIuZ29hbHMpLCBub3RlczogU3RyaW5nKHIubm90ZXMpLFxyXG4gICAgICBzYW1wbGU6IE51bWJlcihyLnNhbXBsZSkgYXMgMCB8IDEsXHJcbiAgICAgIGNyZWF0ZWRBdDogci5jcmVhdGVkX2F0ID8gU3RyaW5nKHIuY3JlYXRlZF9hdCkgOiAnJywgY3JlYXRlZEJ5OiByLmNyZWF0ZWRfYnkgPyBTdHJpbmcoci5jcmVhdGVkX2J5KSA6ICcnLFxyXG4gICAgICB1cGRhdGVkQXQ6IHIudXBkYXRlZF9hdCA/IFN0cmluZyhyLnVwZGF0ZWRfYXQpIDogJycsIHVwZGF0ZWRCeTogci51cGRhdGVkX2J5ID8gU3RyaW5nKHIudXBkYXRlZF9ieSkgOiAnJyxcclxuICAgIH0pKTtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gc2F2ZWQgdmlld3MgLS0tLS0tLS0tLVxyXG4gIHNhdmVWaWV3KHY6IFBhcnRpYWw8U2F2ZWRWaWV3PiAmIHsgbmFtZTogc3RyaW5nOyBjb25maWc6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0pOiBTYXZlZFZpZXcge1xyXG4gICAgY29uc3QgaWQgPSB2LmlkID8/IGNyeXB0by5yYW5kb21VVUlEKCk7XHJcbiAgICBjb25zdCByZWM6IFNhdmVkVmlldyA9IHtcclxuICAgICAgaWQsIG5hbWU6IHYubmFtZSwgY29uZmlnOiB2LmNvbmZpZywgcGlubmVkOiB2LnBpbm5lZCA/PyAwLFxyXG4gICAgICBjcmVhdGVkQnk6IHRoaXMuYWN0b3JJZCwgY3JlYXRlZEF0OiB0aGlzLm5vdygpLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIHNhdmVkX3ZpZXdzIFdIRVJFIGlkPT8nKS5nZXQoaWQpO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYlxyXG4gICAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgICAgYElOU0VSVCBJTlRPIHNhdmVkX3ZpZXdzKGlkLCBuYW1lLCBjb25maWcsIHBpbm5lZCwgY3JlYXRlZF9ieSwgY3JlYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LDApXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCBjb25maWc9PywgcGlubmVkPT8sIGRlbGV0ZWQ9MGAsXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC5ydW4oaWQsIHJlYy5uYW1lLCBKU09OLnN0cmluZ2lmeShyZWMuY29uZmlnKSwgcmVjLnBpbm5lZCwgcmVjLmNyZWF0ZWRCeSwgcmVjLmNyZWF0ZWRBdCxcclxuICAgICAgICAgICAgIHJlYy5uYW1lLCBKU09OLnN0cmluZ2lmeShyZWMuY29uZmlnKSwgcmVjLnBpbm5lZCk7XHJcbiAgICAgIGlmICghZXhpc3RpbmcpIHRoaXMubG9jYWxDcmVhdGUoJ3NhdmVkX3ZpZXcnLCBpZCwgeyAuLi5yZWMgfSk7XHJcbiAgICAgIGVsc2UgdGhpcy5sb2NhbFNldCgnc2F2ZWRfdmlldycsIGlkLCB7IG5hbWU6IHJlYy5uYW1lLCBjb25maWc6IHJlYy5jb25maWcsIHBpbm5lZDogcmVjLnBpbm5lZCB9KTtcclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIHJldHVybiByZWM7XHJcbiAgfVxyXG5cclxuICBsaXN0Vmlld3MoKTogU2F2ZWRWaWV3W10ge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBzYXZlZF92aWV3cyBXSEVSRSBkZWxldGVkPTAgT1JERVIgQlkgcGlubmVkIERFU0MsIG5hbWUnKS5hbGwoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xyXG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xyXG4gICAgICBpZDogU3RyaW5nKHIuaWQpLCBuYW1lOiBTdHJpbmcoci5uYW1lKSxcclxuICAgICAgY29uZmlnOiBKU09OLnBhcnNlKFN0cmluZyhyLmNvbmZpZykpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxyXG4gICAgICBwaW5uZWQ6IE51bWJlcihyLnBpbm5lZCkgYXMgMCB8IDEsIGNyZWF0ZWRCeTogU3RyaW5nKHIuY3JlYXRlZF9ieSksIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXHJcbiAgICB9KSk7XHJcbiAgfVxyXG5cclxuICBkZWxldGVWaWV3KGlkOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIG5hbWUgRlJPTSBzYXZlZF92aWV3cyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhcyB7IG5hbWU6IHN0cmluZyB9IHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3Qgc3RhbXAgPSB0aGlzLm5vdygpO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgc2F2ZWRfdmlld3MgU0VUIGRlbGV0ZWQ9MSwgZGVsZXRlZF9hdD0/LCBkZWxldGVkX2J5PT8gV0hFUkUgaWQ9PycpLnJ1bihzdGFtcCwgdGhpcy5hY3RvcklkLCBpZCk7XHJcbiAgICAgIHRoaXMubG9jYWxTZXQoJ3NhdmVkX3ZpZXcnLCBpZCwgeyBkZWxldGVkOiAxLCBkZWxldGVkQXQ6IHN0YW1wLCBkZWxldGVkQnk6IHRoaXMuYWN0b3JJZCB9KTtcclxuICAgICAgdGhpcy5sb2dBY3Rpdml0eShudWxsLCAndmlld19kZWxldGVkJywgJ3NhdmVkX3ZpZXcnLCByb3cgPyByb3cubmFtZSA6IG51bGwsIG51bGwpO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBhY3Rpdml0eSAtLS0tLS0tLS0tXHJcbiAgYWN0aXZpdHlGb3IoaXRlbUlkOiBzdHJpbmcgfCBudWxsLCBsaW1pdCA9IDEwMCkge1xyXG4gICAgaWYgKGl0ZW1JZCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5kYlxyXG4gICAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgaWQsIGl0ZW1faWQgQVMgaXRlbUlkLCBhY3Rvcl9pZCBBUyBhY3RvcklkLCBraW5kLCBmaWVsZCwgb2xkX3ZhbHVlIEFTIG9sZFZhbHVlLCBuZXdfdmFsdWUgQVMgbmV3VmFsdWUsIGF0IEZST00gYWN0aXZpdHkgV0hFUkUgaXRlbV9pZD0/IE9SREVSIEJZIGF0IERFU0MgTElNSVQgPycpXHJcbiAgICAgICAgLmFsbChpdGVtSWQsIGxpbWl0KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgaWQsIGl0ZW1faWQgQVMgaXRlbUlkLCBhY3Rvcl9pZCBBUyBhY3RvcklkLCBraW5kLCBmaWVsZCwgb2xkX3ZhbHVlIEFTIG9sZFZhbHVlLCBuZXdfdmFsdWUgQVMgbmV3VmFsdWUsIGF0IEZST00gYWN0aXZpdHkgT1JERVIgQlkgYXQgREVTQyBMSU1JVCA/JylcclxuICAgICAgLmFsbChsaW1pdCk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIHJlbW90ZSBvcCBhcHBsaWNhdGlvbiAtLS0tLS0tLS0tXHJcbiAgLyoqIEFwcGx5IGEgYmF0Y2ggb2YgcmVtb3RlIG9wcyBpbnNpZGUgb25lIHRyYW5zYWN0aW9uLiBSZXR1cm5zIGNvdW50IGFwcGxpZWQgKG5vbi1kdXBsaWNhdGUpLiAqL1xyXG4gIGFwcGx5UmVtb3RlT3BzKG9wczogT3BbXSk6IG51bWJlciB7XHJcbiAgICBsZXQgYXBwbGllZCA9IDA7XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICBmb3IgKGNvbnN0IG9wIG9mIG9wcykge1xyXG4gICAgICAgIGlmIChvcC5kZXZpY2VJZCA9PT0gdGhpcy5kZXZpY2VJZCkgY29udGludWU7IC8vIG91ciBvd24gb3BzIGVjaG9lZCBiYWNrXHJcbiAgICAgICAgY29uc3QgZHVwID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIG9wbG9nIFdIRVJFIG9wX2lkPT8nKS5nZXQob3Aub3BJZCk7XHJcbiAgICAgICAgaWYgKGR1cCkgY29udGludWU7XHJcbiAgICAgICAgdGhpcy53aXRuZXNzTGFtcG9ydChvcC5sYW1wb3J0KTtcclxuICAgICAgICB0aGlzLmFwcGVuZE9wKG9wKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgdGhpcy5hcHBseVJlbW90ZU9wKG9wKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIC8vIFF1YXJhbnRpbmUgYSBwb2lzb24gb3AgaW5zdGVhZCBvZiB3ZWRnaW5nIHRoZSB3aG9sZSBpbXBvcnQ6IGl0IGlzIGFscmVhZHlcclxuICAgICAgICAgIC8vIHJlY29yZGVkIGluIHRoZSBvcGxvZyAoc28gaXQgd29uJ3QgcmV0cnkgZm9yZXZlcikgYW5kIGxvZ2dlZCBmb3IgZGlhZ25vc2lzLlxyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihgW3N5bmNdIGZhaWxlZCB0byBhcHBseSBvcCAke29wLm9wSWR9ICgke29wLmVudGl0eX0vJHtvcC5hY3Rpb259KTpgLCBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhcHBsaWVkKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIGlmIChhcHBsaWVkID4gMCkgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICcqJywgZW50aXR5SWQ6ICcqJyB9KTtcclxuICAgIHJldHVybiBhcHBsaWVkO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhcHBseVJlbW90ZU9wKG9wOiBPcCk6IHZvaWQge1xyXG4gICAgc3dpdGNoIChvcC5hY3Rpb24pIHtcclxuICAgICAgY2FzZSAnY3JlYXRlJzpcclxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlQ3JlYXRlKG9wKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnc2V0JzpcclxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlU2V0KG9wKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnZGVsZXRlJzpcclxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlRGVsZXRlKG9wKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgdGFibGVGb3IoZW50aXR5OiBPcFsnZW50aXR5J10pOiBzdHJpbmcge1xyXG4gICAgc3dpdGNoIChlbnRpdHkpIHtcclxuICAgICAgY2FzZSAnaXRlbSc6IHJldHVybiAnaXRlbXMnO1xyXG4gICAgICBjYXNlICdsaW5rJzogcmV0dXJuICdsaW5rcyc7XHJcbiAgICAgIGNhc2UgJ2NvbW1lbnQnOiByZXR1cm4gJ2NvbW1lbnRzJztcclxuICAgICAgY2FzZSAnbWlsZXN0b25lJzogcmV0dXJuICdtaWxlc3RvbmVzJztcclxuICAgICAgY2FzZSAncmVsZWFzZSc6IHJldHVybiAncmVsZWFzZXMnO1xyXG4gICAgICBjYXNlICd1c2VyJzogcmV0dXJuICd1c2Vycyc7XHJcbiAgICAgIGNhc2UgJ3NhdmVkX3ZpZXcnOiByZXR1cm4gJ3NhdmVkX3ZpZXdzJztcclxuICAgICAgY2FzZSAnYXR0YWNobWVudCc6IHJldHVybiAnYXR0YWNobWVudHMnO1xyXG4gICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gZW50aXR5ICR7ZW50aXR5fWApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhcHBseVJlbW90ZUNyZWF0ZShvcDogT3ApOiB2b2lkIHtcclxuICAgIGNvbnN0IHJlY29yZCA9IG9wLnBheWxvYWQucmVjb3JkIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gICAgaWYgKCFyZWNvcmQpIHJldHVybjtcclxuICAgIGNvbnN0IHRhYmxlID0gdGhpcy50YWJsZUZvcihvcC5lbnRpdHkpO1xyXG4gICAgY29uc3QgZXhpc3RzID0gdGhpcy5kYi5wcmVwYXJlKGBTRUxFQ1QgMSBGUk9NICR7dGFibGV9IFdIRVJFIGlkPT9gKS5nZXQob3AuZW50aXR5SWQpO1xyXG4gICAgaWYgKGV4aXN0cykgcmV0dXJuOyAvLyBjcmVhdGUgaXMgaWRlbXBvdGVudCBwZXIgdXVpZFxyXG5cclxuICAgIGlmIChvcC5lbnRpdHkgPT09ICdpdGVtJykge1xyXG4gICAgICBsZXQgaXRlbSA9IHsgLi4uKHJlY29yZCBhcyB1bmtub3duIGFzIFdvcmtJdGVtKSB9O1xyXG4gICAgICAvLyBJZGVudCBjb2xsaXNpb246IGFub3RoZXIgaXRlbSAoZGlmZmVyZW50IHV1aWQpIGFscmVhZHkgaG9sZHMgdGhpcyBpZGVudC5cclxuICAgICAgLy8gRGV0ZXJtaW5pc3RpYyBydWxlIFx1MjAxNCB0aGUgc21hbGxlciB1dWlkIGtlZXBzIHRoZSBjb250ZXN0ZWQgaWRlbnQgXHUyMDE0IHNvIGJvdGhcclxuICAgICAgLy8gZGV2aWNlcyByZXNvbHZlIHRoZSBzYW1lIGNvbGxpc2lvbiBpZGVudGljYWxseSBhbmQgY29udmVyZ2Ugd2l0aG91dCBwaW5nLXBvbmcuXHJcbiAgICAgIGNvbnN0IGhvbGRlciA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkLCB0eXBlIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PycpLmdldChpdGVtLmlkZW50KSBhc1xyXG4gICAgICAgIHwgeyBpZDogc3RyaW5nOyB0eXBlOiBJdGVtVHlwZSB9XHJcbiAgICAgICAgfCB1bmRlZmluZWQ7XHJcbiAgICAgIGlmIChob2xkZXIgJiYgaG9sZGVyLmlkICE9PSBpdGVtLmlkKSB7XHJcbiAgICAgICAgaWYgKGl0ZW0uaWQgPCBob2xkZXIuaWQpIHtcclxuICAgICAgICAgIC8vIEluY29taW5nIGl0ZW0ga2VlcHMgdGhlIGlkZW50OyByZW51bWJlciB0aGUgbG9jYWwgaG9sZGVyIGFuZCBicm9hZGNhc3QuXHJcbiAgICAgICAgICBjb25zdCBidW1wZWQgPSB0aGlzLmFsbG9jSWRlbnQoaG9sZGVyLnR5cGUpO1xyXG4gICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShob2xkZXIuaWQsICdyZW51bWJlcmVkJywgJ2lkZW50JywgaXRlbS5pZGVudCwgYnVtcGVkKTtcclxuICAgICAgICAgIHRoaXMuYXBwbHlJdGVtRmllbGRzKGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xyXG4gICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xyXG4gICAgICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBuZXdJZGVudCA9IHRoaXMuYWxsb2NJZGVudChpdGVtLnR5cGUpO1xyXG4gICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShpdGVtLmlkLCAncmVudW1iZXJlZCcsICdpZGVudCcsIGl0ZW0uaWRlbnQsIG5ld0lkZW50KTtcclxuICAgICAgICAgIGl0ZW0gPSB7IC4uLml0ZW0sIGlkZW50OiBuZXdJZGVudCB9O1xyXG4gICAgICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xyXG4gICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGl0ZW0uaWQsIHsgaWRlbnQ6IG5ld0lkZW50IH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmluc2VydEl0ZW1Sb3coaXRlbSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy53aXRuZXNzSWRlbnQoaXRlbS50eXBlLCBpdGVtLmlkZW50KTtcclxuICAgICAgLy8gRGVyaXZlIHRoZSB0ZWFtbWF0ZSdzIGFjdGl2aXR5IGZyb20gdGhlaXIgb3AsIHNvIHRoZWlyIHdvcmsgc2hvd3MgaW4gQWN0aXZpdHlcclxuICAgICAgLy8gcmF0aGVyIHRoYW4gb25seSB0aGVpciByb3dzIGFwcGVhcmluZyB3aXRoIG5vIHRyYWNlIG9mIHdobyBtYWRlIHRoZW0uIFRoZSBpZCBjb21lc1xyXG4gICAgICAvLyBmcm9tIHRoZSBvcCBzbyBiYWNrZmlsbFJlbW90ZUFjdGl2aXR5KCkgY2FuJ3QgcmUtYWRkIHdoYXQgd2UgYWxyZWFkeSBkZXJpdmVkLlxyXG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KGl0ZW0uaWQsICdjcmVhdGVkJywgbnVsbCwgbnVsbCwgaXRlbS50aXRsZSwgb3AuYWN0b3JJZCwgb3AuYXQsIHRoaXMub3BBY3Rpdml0eUlkKG9wLm9wSWQpKTtcclxuICAgICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKHJlY29yZCkpIHRoaXMuc2V0RmllbGRDbG9ja0lmTmV3ZXIoJ2l0ZW0nLCBpdGVtLmlkLCBmLCBvcC5sYW1wb3J0LCBvcC5kZXZpY2VJZCk7XHJcbiAgICAgIHRoaXMucmVwbGF5UGVuZGluZ09wcyhvcC5lbnRpdHksIG9wLmVudGl0eUlkKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdlbmVyaWMgaW5zZXJ0IGZvciBvdGhlciBlbnRpdGllcy5cclxuICAgIGNvbnN0IGluc2VydGVyczogUmVjb3JkPHN0cmluZywgKCkgPT4gdm9pZD4gPSB7XHJcbiAgICAgIGxpbms6ICgpID0+IHtcclxuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgSXRlbUxpbmsgJiB7IGRlbGV0ZWQ/OiBudW1iZXIgfTtcclxuICAgICAgICB0aGlzLmRiXHJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIGxpbmtzKGlkLCBmcm9tX2lkLCB0b19pZCwga2luZCwgZGVsZXRlZCwgY3JlYXRlZF9hdCwgY3JlYXRlZF9ieSkgVkFMVUVTKD8sPyw/LD8sPyw/LD8pJylcclxuICAgICAgICAgIC5ydW4oci5pZCwgci5mcm9tSWQsIHIudG9JZCwgci5raW5kLCByLmRlbGV0ZWQgPz8gMCwgci5jcmVhdGVkQXQsIHIuY3JlYXRlZEJ5KTtcclxuICAgICAgfSxcclxuICAgICAgY29tbWVudDogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBDb21tZW50O1xyXG4gICAgICAgIHRoaXMuZGJcclxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gY29tbWVudHMoaWQsIGl0ZW1faWQsIGF1dGhvcl9pZCwgYm9keSwgYm9keV90ZXh0LCBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/KScpXHJcbiAgICAgICAgICAucnVuKHIuaWQsIHIuaXRlbUlkLCByLmF1dGhvcklkLCByLmJvZHksIHIuYm9keVRleHQsIHIuY3JlYXRlZEF0LCByLnVwZGF0ZWRBdCwgci5kZWxldGVkID8/IDApO1xyXG4gICAgICAgIHRoaXMubG9nQWN0aXZpdHkoci5pdGVtSWQsICdjb21tZW50JywgbnVsbCwgbnVsbCwgKHIuYm9keVRleHQgPz8gJycpLnNsaWNlKDAsIDIwMCksIG9wLmFjdG9ySWQsIG9wLmF0LCB0aGlzLm9wQWN0aXZpdHlJZChvcC5vcElkKSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIG1pbGVzdG9uZTogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBNaWxlc3RvbmU7XHJcbiAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBtaWxlc3RvbmVzKGlkLCBuYW1lLCBkZXNjcmlwdGlvbiwgdGFyZ2V0X2RhdGUsIHN0YXR1cywgc29ydCwgc2FtcGxlLCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPywwKScpXHJcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgci5kZXNjcmlwdGlvbiwgci50YXJnZXREYXRlLCByLnN0YXR1cywgci5zb3J0LCByLnNhbXBsZSA/PyAwKTtcclxuICAgICAgfSxcclxuICAgICAgcmVsZWFzZTogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBSZWxlYXNlO1xyXG4gICAgICAgIHRoaXMuZGJcclxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gcmVsZWFzZXMoaWQsIG5hbWUsIHZlcnNpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIGdvYWxzLCBub3Rlcywgc2FtcGxlLCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LDApJylcclxuICAgICAgICAgIC5ydW4oci5pZCwgci5uYW1lLCByLnZlcnNpb24sIHIudGFyZ2V0RGF0ZSwgci5zdGF0dXMsIHIuZ29hbHMsIHIubm90ZXMsIHIuc2FtcGxlID8/IDApO1xyXG4gICAgICB9LFxyXG4gICAgICB1c2VyOiAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgciA9IHJlY29yZCBhcyB1bmtub3duIGFzIFVzZXI7XHJcbiAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyB1c2VycyhpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBhdmF0YXIsIGNyZWF0ZWRfYXQsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/KScpXHJcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgci5pbml0aWFscywgci5jb2xvciwgci5hdmF0YXIgPz8gbnVsbCwgci5jcmVhdGVkQXQsIChyIGFzIFVzZXIgJiB7IGRlbGV0ZWQ/OiBudW1iZXIgfSkuZGVsZXRlZCA/PyAwKTtcclxuICAgICAgfSxcclxuICAgICAgc2F2ZWRfdmlldzogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBTYXZlZFZpZXc7XHJcbiAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBzYXZlZF92aWV3cyhpZCwgbmFtZSwgY29uZmlnLCBwaW5uZWQsIGNyZWF0ZWRfYnksIGNyZWF0ZWRfYXQsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPywwKScpXHJcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgSlNPTi5zdHJpbmdpZnkoci5jb25maWcpLCByLnBpbm5lZCwgci5jcmVhdGVkQnksIHIuY3JlYXRlZEF0KTtcclxuICAgICAgfSxcclxuICAgICAgYXR0YWNobWVudDogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBpbXBvcnQoJy4uLy4uL3NoYXJlZC90eXBlcycpLkF0dGFjaG1lbnQ7XHJcbiAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBhdHRhY2htZW50cyhpZCwgaXRlbV9pZCwgZmlsZW5hbWUsIG1pbWUsIHNpemUsIHNoYTI1NiwgZGVzY3JpcHRpb24sIHVwbG9hZGVkX2J5LCBjcmVhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LD8sPyknKVxyXG4gICAgICAgICAgLnJ1bihyLmlkLCByLml0ZW1JZCwgci5maWxlbmFtZSwgci5taW1lLCByLnNpemUsIHIuc2hhMjU2LCByLmRlc2NyaXB0aW9uLCByLnVwbG9hZGVkQnksIHIuY3JlYXRlZEF0LCByLmRlbGV0ZWQgPz8gMCk7XHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG4gICAgaW5zZXJ0ZXJzW29wLmVudGl0eV0/LigpO1xyXG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKHJlY29yZCkpIHRoaXMuc2V0RmllbGRDbG9ja0lmTmV3ZXIob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgb3AuZGV2aWNlSWQpO1xyXG4gICAgdGhpcy5yZXBsYXlQZW5kaW5nT3BzKG9wLmVudGl0eSwgb3AuZW50aXR5SWQpO1xyXG4gIH1cclxuXHJcbiAgLyoqIFNldCBhIGZpZWxkIGNsb2NrIG9ubHkgaWYgdGhlIGluY29taW5nIHdyaXRlIGlzIG5ld2VyIFx1MjAxNCBjcmVhdGVzIG11c3QgbmV2ZXJcclxuICAgICAgcmVncmVzcyBjbG9ja3Mgc3RhbXBlZCBieSBidWZmZXJlZC9lYXJsaWVyLWFycml2aW5nIHNldHMuICovXHJcbiAgcHJpdmF0ZSBzZXRGaWVsZENsb2NrSWZOZXdlcihlbnRpdHk6IHN0cmluZywgZW50aXR5SWQ6IHN0cmluZywgZmllbGQ6IHN0cmluZywgbGFtcG9ydDogbnVtYmVyLCBkZXZpY2VJZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCBjdXIgPSB0aGlzLmZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZmllbGQpO1xyXG4gICAgaWYgKGN1ciAmJiAoY3VyLmxhbXBvcnQgPiBsYW1wb3J0IHx8IChjdXIubGFtcG9ydCA9PT0gbGFtcG9ydCAmJiBjdXIuZGV2aWNlSWQgPiBkZXZpY2VJZCkpKSByZXR1cm47XHJcbiAgICB0aGlzLnNldEZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZmllbGQsIGxhbXBvcnQsIGRldmljZUlkKTtcclxuICB9XHJcblxyXG4gIC8qKiBCdWZmZXIgYW4gb3AgdGhhdCBhcnJpdmVkIGJlZm9yZSBpdHMgdGFyZ2V0J3MgY3JlYXRlICgzKyBkZXZpY2UgcmVvcmRlcmluZykuICovXHJcbiAgcHJpdmF0ZSBidWZmZXJQZW5kaW5nT3Aob3A6IE9wKTogdm9pZCB7XHJcbiAgICB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgIGBJTlNFUlQgT1IgSUdOT1JFIElOVE8gcGVuZGluZ19vcHMob3BfaWQsIGRldmljZV9pZCwgYWN0b3JfaWQsIGxhbXBvcnQsIGF0LCBlbnRpdHksIGVudGl0eV9pZCwgYWN0aW9uLCBwYXlsb2FkKVxyXG4gICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LD8pYCxcclxuICAgICAgKVxyXG4gICAgICAucnVuKG9wLm9wSWQsIG9wLmRldmljZUlkLCBvcC5hY3RvcklkLCBvcC5sYW1wb3J0LCBvcC5hdCwgb3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgb3AuYWN0aW9uLCBKU09OLnN0cmluZ2lmeShvcC5wYXlsb2FkKSk7XHJcbiAgfVxyXG5cclxuICAvKiogUmVwbGF5IGJ1ZmZlcmVkIHNldHMvZGVsZXRlcyBmb3IgYW4gZW50aXR5IG9uY2UgaXRzIGNyZWF0ZSBoYXMgbGFuZGVkLiAqL1xyXG4gIHByaXZhdGUgcmVwbGF5UGVuZGluZ09wcyhlbnRpdHk6IE9wWydlbnRpdHknXSwgZW50aXR5SWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gcGVuZGluZ19vcHMgV0hFUkUgZW50aXR5PT8gQU5EIGVudGl0eV9pZD0/IE9SREVSIEJZIGxhbXBvcnQsIGRldmljZV9pZCcpXHJcbiAgICAgIC5hbGwoZW50aXR5LCBlbnRpdHlJZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIGlmIChyb3dzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xyXG4gICAgdGhpcy5kYi5wcmVwYXJlKCdERUxFVEUgRlJPTSBwZW5kaW5nX29wcyBXSEVSRSBlbnRpdHk9PyBBTkQgZW50aXR5X2lkPT8nKS5ydW4oZW50aXR5LCBlbnRpdHlJZCk7XHJcbiAgICBmb3IgKGNvbnN0IHIgb2Ygcm93cykge1xyXG4gICAgICB0aGlzLmFwcGx5UmVtb3RlT3Aoe1xyXG4gICAgICAgIG9wSWQ6IFN0cmluZyhyLm9wX2lkKSwgZGV2aWNlSWQ6IFN0cmluZyhyLmRldmljZV9pZCksIGFjdG9ySWQ6IFN0cmluZyhyLmFjdG9yX2lkKSxcclxuICAgICAgICBsYW1wb3J0OiBOdW1iZXIoci5sYW1wb3J0KSwgYXQ6IFN0cmluZyhyLmF0KSwgZW50aXR5OiByLmVudGl0eSBhcyBPcFsnZW50aXR5J10sXHJcbiAgICAgICAgZW50aXR5SWQ6IFN0cmluZyhyLmVudGl0eV9pZCksIGFjdGlvbjogci5hY3Rpb24gYXMgT3BbJ2FjdGlvbiddLFxyXG4gICAgICAgIHBheWxvYWQ6IEpTT04ucGFyc2UoU3RyaW5nKHIucGF5bG9hZCkpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXBwbHlSZW1vdGVTZXQob3A6IE9wKTogdm9pZCB7XHJcbiAgICAvLyBUYXJnZXQgcm93IG1heSBub3QgZXhpc3QgeWV0IChvcHMgZnJvbSBhIHRoaXJkIGRldmljZSBjYW4gYXJyaXZlIGJlZm9yZSB0aGVcclxuICAgIC8vIG9yaWdpbmF0aW5nIGRldmljZSdzIGNyZWF0ZSkgXHUyMDE0IGJ1ZmZlciBhbmQgcmVwbGF5IGFmdGVyIHRoZSBjcmVhdGUuXHJcbiAgICBjb25zdCByb3dFeGlzdHMgPSB0aGlzLmRiLnByZXBhcmUoYFNFTEVDVCAxIEZST00gJHt0aGlzLnRhYmxlRm9yKG9wLmVudGl0eSl9IFdIRVJFIGlkPT9gKS5nZXQob3AuZW50aXR5SWQpO1xyXG4gICAgaWYgKCFyb3dFeGlzdHMpIHtcclxuICAgICAgdGhpcy5idWZmZXJQZW5kaW5nT3Aob3ApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBmaWVsZHMgPSAob3AucGF5bG9hZC5maWVsZHMgPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gICAgY29uc3QgYmFzZWRPbiA9IChvcC5wYXlsb2FkLmJhc2VkT24gPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHsgbGFtcG9ydDogbnVtYmVyOyBkZXZpY2VJZDogc3RyaW5nIH0gfCBudWxsPjtcclxuICAgIGNvbnN0IHdpbm5pbmc6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XHJcblxyXG4gICAgZm9yIChjb25zdCBbZmllbGQsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XHJcbiAgICAgIGNvbnN0IGxvY2FsID0gdGhpcy5maWVsZENsb2NrKG9wLmVudGl0eSwgb3AuZW50aXR5SWQsIGZpZWxkKTtcclxuICAgICAgY29uc3QgYmFzZSA9IGJhc2VkT25bZmllbGRdID8/IG51bGw7XHJcblxyXG4gICAgICBsZXQgcmVtb3RlV2luczogYm9vbGVhbjtcclxuICAgICAgbGV0IGNvbmN1cnJlbnQgPSBmYWxzZTtcclxuICAgICAgaWYgKCFsb2NhbCkge1xyXG4gICAgICAgIHJlbW90ZVdpbnMgPSB0cnVlO1xyXG4gICAgICB9IGVsc2UgaWYgKGJhc2UgJiYgYmFzZS5sYW1wb3J0ID09PSBsb2NhbC5sYW1wb3J0ICYmIGJhc2UuZGV2aWNlSWQgPT09IGxvY2FsLmRldmljZUlkKSB7XHJcbiAgICAgICAgcmVtb3RlV2lucyA9IHRydWU7IC8vIGNsZWFuIGNhdXNhbCB1cGRhdGU6IHJlbW90ZSBzYXcgZXhhY3RseSBvdXIgY3VycmVudCB2YWx1ZVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbmN1cnJlbnQgPSB0cnVlO1xyXG4gICAgICAgIHJlbW90ZVdpbnMgPSBvcC5sYW1wb3J0ID4gbG9jYWwubGFtcG9ydCB8fCAob3AubGFtcG9ydCA9PT0gbG9jYWwubGFtcG9ydCAmJiBvcC5kZXZpY2VJZCA+IGxvY2FsLmRldmljZUlkKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGNvbmN1cnJlbnQgJiYgQ09ORkxJQ1RfU1VSRkFDRURfRklFTERTLmhhcyhmaWVsZCkgJiYgb3AuZW50aXR5ID09PSAnaXRlbScpIHtcclxuICAgICAgICBjb25zdCBjdXIgPSB0aGlzLmRiXHJcbiAgICAgICAgICAucHJlcGFyZShgU0VMRUNUICR7SVRFTV9DT0xTW2ZpZWxkXX0gQVMgdiBGUk9NIGl0ZW1zIFdIRVJFIGlkPT9gKVxyXG4gICAgICAgICAgLmdldChvcC5lbnRpdHlJZCkgYXMgeyB2OiB1bmtub3duIH0gfCB1bmRlZmluZWQ7XHJcbiAgICAgICAgY29uc3QgbG9jYWxWYWwgPSBjdXIgPyBTdHJpbmcoY3VyLnYgPz8gJycpIDogJyc7XHJcbiAgICAgICAgY29uc3QgcmVtb3RlVmFsID0gU3RyaW5nKHZhbHVlID8/ICcnKTtcclxuICAgICAgICBpZiAobG9jYWxWYWwgIT09IHJlbW90ZVZhbCkge1xyXG4gICAgICAgICAgY29uc3QgY29uZmxpY3Q6IFN5bmNDb25mbGljdCA9IHtcclxuICAgICAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXHJcbiAgICAgICAgICAgIGVudGl0eTogb3AuZW50aXR5LFxyXG4gICAgICAgICAgICBlbnRpdHlJZDogb3AuZW50aXR5SWQsXHJcbiAgICAgICAgICAgIGZpZWxkLFxyXG4gICAgICAgICAgICBsb2NhbFZhbHVlOiBsb2NhbFZhbCxcclxuICAgICAgICAgICAgcmVtb3RlVmFsdWU6IHJlbW90ZVZhbCxcclxuICAgICAgICAgICAgcmVtb3RlRGV2aWNlOiBvcC5kZXZpY2VJZCxcclxuICAgICAgICAgICAgcmVtb3RlQWN0b3I6IG9wLmFjdG9ySWQsXHJcbiAgICAgICAgICAgIGRldGVjdGVkQXQ6IHRoaXMubm93KCksXHJcbiAgICAgICAgICAgIHJlc29sdmVkQXQ6IG51bGwsXHJcbiAgICAgICAgICAgIHJlc29sdXRpb246IG51bGwsXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gc3luY19jb25mbGljdHMoaWQsIGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZCwgbG9jYWxfdmFsdWUsIHJlbW90ZV92YWx1ZSwgcmVtb3RlX2RldmljZSwgcmVtb3RlX2FjdG9yLCBkZXRlY3RlZF9hdCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyw/KScpXHJcbiAgICAgICAgICAgIC5ydW4oY29uZmxpY3QuaWQsIGNvbmZsaWN0LmVudGl0eSwgY29uZmxpY3QuZW50aXR5SWQsIGNvbmZsaWN0LmZpZWxkLCBjb25mbGljdC5sb2NhbFZhbHVlLCBjb25mbGljdC5yZW1vdGVWYWx1ZSwgY29uZmxpY3QucmVtb3RlRGV2aWNlLCBjb25mbGljdC5yZW1vdGVBY3RvciwgY29uZmxpY3QuZGV0ZWN0ZWRBdCk7XHJcbiAgICAgICAgICB0aGlzLmV2ZW50cy5vbkNvbmZsaWN0KGNvbmZsaWN0KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChyZW1vdGVXaW5zKSB7XHJcbiAgICAgICAgd2lubmluZ1tmaWVsZF0gPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLnNldEZpZWxkQ2xvY2sob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgZmllbGQsIG9wLmxhbXBvcnQsIG9wLmRldmljZUlkKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChPYmplY3Qua2V5cyh3aW5uaW5nKS5sZW5ndGggPT09IDApIHJldHVybjtcclxuXHJcbiAgICBpZiAob3AuZW50aXR5ID09PSAnaXRlbScpIHtcclxuICAgICAgY29uc3QgYmVmb3JlID0gdGhpcy5nZXRJdGVtKG9wLmVudGl0eUlkKTtcclxuICAgICAgLy8gSWRlbnQgc2V0IG1heSBjb2xsaWRlIGxvY2FsbHkgXHUyMDE0IHJlc29sdmUgd2l0aCB0aGUgc2FtZSBzbWFsbGVyLXV1aWQta2VlcHMgcnVsZS5cclxuICAgICAgaWYgKCdpZGVudCcgaW4gd2lubmluZykge1xyXG4gICAgICAgIGNvbnN0IGhvbGRlciA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkLCB0eXBlIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PycpLmdldChTdHJpbmcod2lubmluZy5pZGVudCkpIGFzXHJcbiAgICAgICAgICB8IHsgaWQ6IHN0cmluZzsgdHlwZTogSXRlbVR5cGUgfVxyXG4gICAgICAgICAgfCB1bmRlZmluZWQ7XHJcbiAgICAgICAgY29uc3QgY3VyID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgdHlwZSBGUk9NIGl0ZW1zIFdIRVJFIGlkPT8nKS5nZXQob3AuZW50aXR5SWQpIGFzIHsgdHlwZTogSXRlbVR5cGUgfSB8IHVuZGVmaW5lZDtcclxuICAgICAgICBpZiAoaG9sZGVyICYmIGhvbGRlci5pZCAhPT0gb3AuZW50aXR5SWQgJiYgY3VyKSB7XHJcbiAgICAgICAgICBpZiAob3AuZW50aXR5SWQgPCBob2xkZXIuaWQpIHtcclxuICAgICAgICAgICAgY29uc3QgYnVtcGVkID0gdGhpcy5hbGxvY0lkZW50KGhvbGRlci50eXBlKTtcclxuICAgICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShob2xkZXIuaWQsICdyZW51bWJlcmVkJywgJ2lkZW50JywgU3RyaW5nKHdpbm5pbmcuaWRlbnQpLCBidW1wZWQpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcGx5SXRlbUZpZWxkcyhob2xkZXIuaWQsIHsgaWRlbnQ6IGJ1bXBlZCB9KTtcclxuICAgICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgYnVtcGVkID0gdGhpcy5hbGxvY0lkZW50KGN1ci50eXBlKTtcclxuICAgICAgICAgICAgd2lubmluZy5pZGVudCA9IGJ1bXBlZDtcclxuICAgICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIG9wLmVudGl0eUlkLCB7IGlkZW50OiBidW1wZWQgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChjdXIpIHtcclxuICAgICAgICAgIHRoaXMud2l0bmVzc0lkZW50KGN1ci50eXBlLCBTdHJpbmcod2lubmluZy5pZGVudCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0aGlzLmFwcGx5SXRlbUZpZWxkcyhvcC5lbnRpdHlJZCwgd2lubmluZyk7XHJcbiAgICAgIC8vIE1pcnJvciB1cGRhdGVJdGVtJ3MgbG9jYWwgbG9nZ2luZyBzbyBhIHRlYW1tYXRlJ3MgY2hhbmdlIHJlYWRzIHRoZSBzYW1lIGFzIG91cnM6XHJcbiAgICAgIC8vIG9uZSBlbnRyeSBwZXIgZmllbGQsIHdpdGggYm9keSBlZGl0cyBjb2xsYXBzZWQgaW50byBhIHNpbmdsZSAnZWRpdGVkJyBlbnRyeS5cclxuICAgICAgaWYgKGJlZm9yZSkge1xyXG4gICAgICAgIGNvbnN0IHByZXYgPSBiZWZvcmUgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICAgICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyh3aW5uaW5nKSkge1xyXG4gICAgICAgICAgaWYgKGsgPT09ICd1cGRhdGVkQXQnIHx8IGsgPT09ICd1cGRhdGVkQnknIHx8IGsgPT09ICdib2R5JyB8fCBrID09PSAnYm9keVRleHQnKSBjb250aW51ZTtcclxuICAgICAgICAgIHRoaXMubG9nQWN0aXZpdHkoXHJcbiAgICAgICAgICAgIG9wLmVudGl0eUlkLCAndXBkYXRlZCcsIGssIHByZXZba10sXHJcbiAgICAgICAgICAgIEpTT05fSVRFTV9GSUVMRFMuaGFzKGspID8gSlNPTi5zdHJpbmdpZnkodikgOiB2LFxyXG4gICAgICAgICAgICBvcC5hY3RvcklkLCBvcC5hdCwgdGhpcy5vcEFjdGl2aXR5SWQob3Aub3BJZCwgayksXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoJ2JvZHknIGluIHdpbm5pbmcgfHwgJ2JvZHlUZXh0JyBpbiB3aW5uaW5nKSB7XHJcbiAgICAgICAgICBjb25zdCBuZXdUZXh0ID0gJ2JvZHlUZXh0JyBpbiB3aW5uaW5nID8gU3RyaW5nKHdpbm5pbmcuYm9keVRleHQgPz8gJycpIDogYmVmb3JlLmJvZHlUZXh0O1xyXG4gICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShcclxuICAgICAgICAgICAgb3AuZW50aXR5SWQsICdlZGl0ZWQnLCAnYm9keScsIGJlZm9yZS5ib2R5VGV4dCwgbmV3VGV4dCxcclxuICAgICAgICAgICAgb3AuYWN0b3JJZCwgb3AuYXQsIHRoaXMub3BBY3Rpdml0eUlkKG9wLm9wSWQsICdib2R5JyksXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2VuZXJpYyBjb2x1bW4gdXBkYXRlIGZvciBvdGhlciBlbnRpdGllcy5cclxuICAgIGNvbnN0IGNvbE1hcDogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nPj4gPSB7XHJcbiAgICAgIGxpbms6IHsgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXHJcbiAgICAgIGNvbW1lbnQ6IHsgYm9keTogJ2JvZHknLCBib2R5VGV4dDogJ2JvZHlfdGV4dCcsIHVwZGF0ZWRBdDogJ3VwZGF0ZWRfYXQnLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcclxuICAgICAgbWlsZXN0b25lOiB7IG5hbWU6ICduYW1lJywgZGVzY3JpcHRpb246ICdkZXNjcmlwdGlvbicsIHRhcmdldERhdGU6ICd0YXJnZXRfZGF0ZScsIHN0YXR1czogJ3N0YXR1cycsIHNvcnQ6ICdzb3J0JywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXHJcbiAgICAgIHJlbGVhc2U6IHsgbmFtZTogJ25hbWUnLCB2ZXJzaW9uOiAndmVyc2lvbicsIHRhcmdldERhdGU6ICd0YXJnZXRfZGF0ZScsIHN0YXR1czogJ3N0YXR1cycsIGdvYWxzOiAnZ29hbHMnLCBub3RlczogJ25vdGVzJywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXHJcbiAgICAgIHVzZXI6IHsgbmFtZTogJ25hbWUnLCBpbml0aWFsczogJ2luaXRpYWxzJywgY29sb3I6ICdjb2xvcicsIGF2YXRhcjogJ2F2YXRhcicsIGRlbGV0ZWQ6ICdkZWxldGVkJyB9LFxyXG4gICAgICBzYXZlZF92aWV3OiB7IG5hbWU6ICduYW1lJywgY29uZmlnOiAnY29uZmlnJywgcGlubmVkOiAncGlubmVkJywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXHJcbiAgICAgIGF0dGFjaG1lbnQ6IHsgZGVzY3JpcHRpb246ICdkZXNjcmlwdGlvbicsIGRlbGV0ZWQ6ICdkZWxldGVkJyB9LFxyXG4gICAgfTtcclxuICAgIGNvbnN0IG1hcCA9IGNvbE1hcFtvcC5lbnRpdHldO1xyXG4gICAgaWYgKCFtYXApIHJldHVybjtcclxuICAgIGNvbnN0IHNldHM6IHN0cmluZ1tdID0gW107XHJcbiAgICBjb25zdCB2YWxzOiB1bmtub3duW10gPSBbXTtcclxuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKHdpbm5pbmcpKSB7XHJcbiAgICAgIGNvbnN0IGNvbCA9IG1hcFtrXTtcclxuICAgICAgaWYgKCFjb2wpIGNvbnRpbnVlO1xyXG4gICAgICBzZXRzLnB1c2goYCR7Y29sfT0/YCk7XHJcbiAgICAgIHZhbHMucHVzaChrID09PSAnY29uZmlnJyA/IEpTT04uc3RyaW5naWZ5KHYpIDogdik7XHJcbiAgICB9XHJcbiAgICBpZiAoIXNldHMubGVuZ3RoKSByZXR1cm47XHJcbiAgICB2YWxzLnB1c2gob3AuZW50aXR5SWQpO1xyXG4gICAgdGhpcy5kYi5wcmVwYXJlKGBVUERBVEUgJHt0aGlzLnRhYmxlRm9yKG9wLmVudGl0eSl9IFNFVCAke3NldHMuam9pbignLCAnKX0gV0hFUkUgaWQ9P2ApLnJ1biguLi52YWxzKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXBwbHlSZW1vdGVEZWxldGUob3A6IE9wKTogdm9pZCB7XHJcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMudGFibGVGb3Iob3AuZW50aXR5KTtcclxuICAgIGNvbnN0IHJvd0V4aXN0cyA9IHRoaXMuZGIucHJlcGFyZShgU0VMRUNUIDEgRlJPTSAke3RhYmxlfSBXSEVSRSBpZD0/YCkuZ2V0KG9wLmVudGl0eUlkKTtcclxuICAgIGlmICghcm93RXhpc3RzKSB7XHJcbiAgICAgIC8vIERlbGV0ZSBhcnJpdmVkIGJlZm9yZSB0aGUgY3JlYXRlICgzKyBkZXZpY2UgcmVvcmRlcmluZykgXHUyMDE0IGJ1ZmZlciBpdCBzbyB0aGVcclxuICAgICAgLy8gY3JlYXRlJ3MgcmVwbGF5IGFwcGxpZXMgaXQgaW5zdGVhZCBvZiByZXN1cnJlY3RpbmcgdGhlIGl0ZW0uXHJcbiAgICAgIHRoaXMuYnVmZmVyUGVuZGluZ09wKG9wKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kYi5wcmVwYXJlKGBVUERBVEUgJHt0YWJsZX0gU0VUIGRlbGV0ZWQ9MSBXSEVSRSBpZD0/YCkucnVuKG9wLmVudGl0eUlkKTtcclxuICAgIHRoaXMuc2V0RmllbGRDbG9jayhvcC5lbnRpdHksIG9wLmVudGl0eUlkLCAnZGVsZXRlZCcsIG9wLmxhbXBvcnQsIG9wLmRldmljZUlkKTtcclxuICAgIGlmIChvcC5lbnRpdHkgPT09ICdpdGVtJykge1xyXG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KG9wLmVudGl0eUlkLCAnZGVsZXRlZCcsIG51bGwsIG51bGwsIG51bGwsIG9wLmFjdG9ySWQsIG9wLmF0LCB0aGlzLm9wQWN0aXZpdHlJZChvcC5vcElkKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIGNvbmZsaWN0cyAtLS0tLS0tLS0tXHJcbiAgbGlzdENvbmZsaWN0cyhvcGVuT25seSA9IHRydWUpOiBTeW5jQ29uZmxpY3RbXSB7XHJcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZShgU0VMRUNUICogRlJPTSBzeW5jX2NvbmZsaWN0cyAke29wZW5Pbmx5ID8gJ1dIRVJFIHJlc29sdmVkX2F0IElTIE5VTEwnIDogJyd9IE9SREVSIEJZIGRldGVjdGVkX2F0IERFU0NgKVxyXG4gICAgICAuYWxsKCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcclxuICAgICAgaWQ6IFN0cmluZyhyLmlkKSwgZW50aXR5OiBTdHJpbmcoci5lbnRpdHkpLCBlbnRpdHlJZDogU3RyaW5nKHIuZW50aXR5X2lkKSwgZmllbGQ6IFN0cmluZyhyLmZpZWxkKSxcclxuICAgICAgbG9jYWxWYWx1ZTogU3RyaW5nKHIubG9jYWxfdmFsdWUpLCByZW1vdGVWYWx1ZTogU3RyaW5nKHIucmVtb3RlX3ZhbHVlKSxcclxuICAgICAgcmVtb3RlRGV2aWNlOiBTdHJpbmcoci5yZW1vdGVfZGV2aWNlKSwgcmVtb3RlQWN0b3I6IFN0cmluZyhyLnJlbW90ZV9hY3RvciksXHJcbiAgICAgIGRldGVjdGVkQXQ6IFN0cmluZyhyLmRldGVjdGVkX2F0KSxcclxuICAgICAgcmVzb2x2ZWRBdDogci5yZXNvbHZlZF9hdCA/IFN0cmluZyhyLnJlc29sdmVkX2F0KSA6IG51bGwsXHJcbiAgICAgIHJlc29sdXRpb246IChyLnJlc29sdXRpb24gYXMgU3luY0NvbmZsaWN0WydyZXNvbHV0aW9uJ10pID8/IG51bGwsXHJcbiAgICB9KSk7XHJcbiAgfVxyXG5cclxuICByZXNvbHZlQ29uZmxpY3QoaWQ6IHN0cmluZywgcmVzb2x1dGlvbjogJ2xvY2FsJyB8ICdyZW1vdGUnIHwgJ21lcmdlZCcsIG1lcmdlZFZhbHVlPzogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gc3luY19jb25mbGljdHMgV0hFUkUgaWQ9PycpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XHJcbiAgICBpZiAoIXJvdykgcmV0dXJuO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgY29uc3QgdmFsdWUgPVxyXG4gICAgICAgIHJlc29sdXRpb24gPT09ICdtZXJnZWQnID8gKG1lcmdlZFZhbHVlID8/ICcnKSA6IHJlc29sdXRpb24gPT09ICdsb2NhbCcgPyBTdHJpbmcocm93LmxvY2FsX3ZhbHVlKSA6IFN0cmluZyhyb3cucmVtb3RlX3ZhbHVlKTtcclxuICAgICAgaWYgKFN0cmluZyhyb3cuZW50aXR5KSA9PT0gJ2l0ZW0nKSB7XHJcbiAgICAgICAgY29uc3QgZmllbGQgPSBTdHJpbmcocm93LmZpZWxkKTtcclxuICAgICAgICBjb25zdCBzdGFtcCA9IHRoaXMubm93KCk7XHJcbiAgICAgICAgY29uc3QgZmllbGRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHsgW2ZpZWxkXTogdmFsdWUsIHVwZGF0ZWRBdDogc3RhbXAsIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH07XHJcbiAgICAgICAgLy8gUmVzb2x2aW5nIGEgYm9keSBjb25mbGljdCBtdXN0IGFsc28gcmVmcmVzaCB0aGUgc2VhcmNoLXRleHQgcHJvamVjdGlvbi5cclxuICAgICAgICBpZiAoZmllbGQgPT09ICdib2R5JykgZmllbGRzLmJvZHlUZXh0ID0gZG9jVG9UZXh0KHZhbHVlKTtcclxuICAgICAgICB0aGlzLmFwcGx5SXRlbUZpZWxkcyhTdHJpbmcocm93LmVudGl0eV9pZCksIGZpZWxkcyk7XHJcbiAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIFN0cmluZyhyb3cuZW50aXR5X2lkKSwgZmllbGRzKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBzeW5jX2NvbmZsaWN0cyBTRVQgcmVzb2x2ZWRfYXQ9PywgcmVzb2x1dGlvbj0/LCByZXNvbHZlZF9ieT0/IFdIRVJFIGlkPT8nKS5ydW4odGhpcy5ub3coKSwgcmVzb2x1dGlvbiwgdGhpcy5hY3RvcklkLCBpZCk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogU3RyaW5nKHJvdy5lbnRpdHkpLCBlbnRpdHlJZDogU3RyaW5nKHJvdy5lbnRpdHlfaWQpIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBzeW5jIGV4cG9ydCBoZWxwZXJzIC0tLS0tLS0tLS1cclxuICBvcHNTaW5jZShzZXE6IG51bWJlciwgb3duT25seSA9IHRydWUpOiB7IHNlcTogbnVtYmVyOyBvcDogT3AgfVtdIHtcclxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgIGBTRUxFQ1Qgc2VxLCBvcF9pZCwgZGV2aWNlX2lkLCBhY3Rvcl9pZCwgbGFtcG9ydCwgYXQsIGVudGl0eSwgZW50aXR5X2lkLCBhY3Rpb24sIHBheWxvYWRcclxuICAgICAgICAgRlJPTSBvcGxvZyBXSEVSRSBzZXEgPiA/ICR7b3duT25seSA/ICdBTkQgZGV2aWNlX2lkID0gPycgOiAnJ30gT1JERVIgQlkgc2VxIEFTQ2AsXHJcbiAgICAgIClcclxuICAgICAgLmFsbCguLi4ob3duT25seSA/IFtzZXEsIHRoaXMuZGV2aWNlSWRdIDogW3NlcV0pKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xyXG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xyXG4gICAgICBzZXE6IE51bWJlcihyLnNlcSksXHJcbiAgICAgIG9wOiB7XHJcbiAgICAgICAgb3BJZDogU3RyaW5nKHIub3BfaWQpLCBkZXZpY2VJZDogU3RyaW5nKHIuZGV2aWNlX2lkKSwgYWN0b3JJZDogU3RyaW5nKHIuYWN0b3JfaWQpLFxyXG4gICAgICAgIGxhbXBvcnQ6IE51bWJlcihyLmxhbXBvcnQpLCBhdDogU3RyaW5nKHIuYXQpLCBlbnRpdHk6IHIuZW50aXR5IGFzIE9wWydlbnRpdHknXSxcclxuICAgICAgICBlbnRpdHlJZDogU3RyaW5nKHIuZW50aXR5X2lkKSwgYWN0aW9uOiByLmFjdGlvbiBhcyBPcFsnYWN0aW9uJ10sXHJcbiAgICAgICAgcGF5bG9hZDogSlNPTi5wYXJzZShTdHJpbmcoci5wYXlsb2FkKSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXHJcbiAgICAgIH0sXHJcbiAgICB9KSk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIHNhbXBsZSBkYXRhIC0tLS0tLS0tLS1cclxuICByZW1vdmVTYW1wbGVEYXRhKCk6IG51bWJlciB7XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICBjb25zdCBpZHMgPSAodGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaWQgRlJPTSBpdGVtcyBXSEVSRSBzYW1wbGU9MSBBTkQgZGVsZXRlZD0wJykuYWxsKCkgYXMgeyBpZDogc3RyaW5nIH1bXSkubWFwKChyKSA9PiByLmlkKTtcclxuICAgICAgZm9yIChjb25zdCBpZCBvZiBpZHMpIHRoaXMuZGVsZXRlSXRlbShpZCk7XHJcbiAgICAgIGZvciAoY29uc3QgbSBvZiB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpZCBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pIHtcclxuICAgICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBtaWxlc3RvbmVzIFNFVCBkZWxldGVkPTEgV0hFUkUgaWQ9PycpLnJ1bihtLmlkKTtcclxuICAgICAgICB0aGlzLmxvY2FsU2V0KCdtaWxlc3RvbmUnLCBtLmlkLCB7IGRlbGV0ZWQ6IDEgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZm9yIChjb25zdCByZWwgb2YgdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaWQgRlJPTSByZWxlYXNlcyBXSEVSRSBzYW1wbGU9MSBBTkQgZGVsZXRlZD0wJykuYWxsKCkgYXMgeyBpZDogc3RyaW5nIH1bXSkge1xyXG4gICAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIHJlbGVhc2VzIFNFVCBkZWxldGVkPTEgV0hFUkUgaWQ9PycpLnJ1bihyZWwuaWQpO1xyXG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ3JlbGVhc2UnLCByZWwuaWQsIHsgZGVsZXRlZDogMSB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gaWRzLmxlbmd0aDtcclxuICAgIH0pO1xyXG4gICAgY29uc3QgbiA9IHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJyonLCBlbnRpdHlJZDogJyonIH0pO1xyXG4gICAgcmV0dXJuIG47XHJcbiAgfVxyXG59XHJcblxyXG4vLyAtLS0tLS0tLS0tIHJvdyBtYXBwZXJzIC0tLS0tLS0tLS1cclxuZXhwb3J0IGZ1bmN0aW9uIHJvd1RvSXRlbShyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFdvcmtJdGVtIHtcclxuICByZXR1cm4ge1xyXG4gICAgaWQ6IFN0cmluZyhyLmlkKSxcclxuICAgIGlkZW50OiBTdHJpbmcoci5pZGVudCksXHJcbiAgICB0eXBlOiByLnR5cGUgYXMgSXRlbVR5cGUsXHJcbiAgICB0aXRsZTogU3RyaW5nKHIudGl0bGUpLFxyXG4gICAgYm9keTogU3RyaW5nKHIuYm9keSksXHJcbiAgICBib2R5VGV4dDogU3RyaW5nKHIuYm9keV90ZXh0KSxcclxuICAgIHN0YXR1czogU3RyaW5nKHIuc3RhdHVzKSxcclxuICAgIHByaW9yaXR5OiByLnByaW9yaXR5IGFzIFdvcmtJdGVtWydwcmlvcml0eSddLFxyXG4gICAgb3duZXJJZDogKHIub3duZXJfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcclxuICAgIHJlcG9ydGVySWQ6IChyLnJlcG9ydGVyX2lkIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXHJcbiAgICBtaWxlc3RvbmVJZDogKHIubWlsZXN0b25lX2lkIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXHJcbiAgICByZWxlYXNlSWQ6IChyLnJlbGVhc2VfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcclxuICAgIHBhcmVudElkOiAoci5wYXJlbnRfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcclxuICAgIHN0YXJ0RGF0ZTogKHIuc3RhcnRfZGF0ZSBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxyXG4gICAgZHVlRGF0ZTogKHIuZHVlX2RhdGUgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcclxuICAgIGNvbXBsZXRlZEF0OiAoci5jb21wbGV0ZWRfYXQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcclxuICAgIGVmZm9ydDogci5lZmZvcnQgPT0gbnVsbCA/IG51bGwgOiBOdW1iZXIoci5lZmZvcnQpLFxyXG4gICAgY29uZmlkZW5jZTogKHIuY29uZmlkZW5jZSBhcyBXb3JrSXRlbVsnY29uZmlkZW5jZSddKSA/PyBudWxsLFxyXG4gICAgcmlza0xldmVsOiAoci5yaXNrX2xldmVsIGFzIFdvcmtJdGVtWydyaXNrTGV2ZWwnXSkgPz8gbnVsbCxcclxuICAgIGJ1c2luZXNzVmFsdWU6IChyLmJ1c2luZXNzX3ZhbHVlIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXHJcbiAgICBsZWFkZXJzaGlwVmlzaWJsZTogTnVtYmVyKHIubGVhZGVyc2hpcF92aXNpYmxlKSBhcyAwIHwgMSxcclxuICAgIHByb2dyZXNzOiByLnByb2dyZXNzID09IG51bGwgPyBudWxsIDogTnVtYmVyKHIucHJvZ3Jlc3MpLFxyXG4gICAgdGFnczogc2FmZVBhcnNlKFN0cmluZyhyLnRhZ3MpLCBbXSkgYXMgc3RyaW5nW10sXHJcbiAgICBleHRyYTogc2FmZVBhcnNlKFN0cmluZyhyLmV4dHJhKSwge30pIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxyXG4gICAgYXJjaGl2ZWQ6IE51bWJlcihyLmFyY2hpdmVkKSBhcyAwIHwgMSxcclxuICAgIHNhbXBsZTogTnVtYmVyKHIuc2FtcGxlKSBhcyAwIHwgMSxcclxuICAgIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXHJcbiAgICB1cGRhdGVkQXQ6IFN0cmluZyhyLnVwZGF0ZWRfYXQpLFxyXG4gICAgY3JlYXRlZEJ5OiBTdHJpbmcoci5jcmVhdGVkX2J5KSxcclxuICAgIHVwZGF0ZWRCeTogU3RyaW5nKHIudXBkYXRlZF9ieSksXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gcm93VG9MaW5rKHI6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogSXRlbUxpbmsge1xyXG4gIHJldHVybiB7XHJcbiAgICBpZDogU3RyaW5nKHIuaWQpLFxyXG4gICAgZnJvbUlkOiBTdHJpbmcoci5mcm9tX2lkKSxcclxuICAgIHRvSWQ6IFN0cmluZyhyLnRvX2lkKSxcclxuICAgIGtpbmQ6IHIua2luZCBhcyBMaW5rS2luZCxcclxuICAgIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXHJcbiAgICBjcmVhdGVkQnk6IFN0cmluZyhyLmNyZWF0ZWRfYnkpLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhZmVQYXJzZShzOiBzdHJpbmcsIGZhbGxiYWNrOiB1bmtub3duKTogdW5rbm93biB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiBKU09OLnBhcnNlKHMpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIGZhbGxiYWNrO1xyXG4gIH1cclxufVxyXG5cclxuLyoqIENvbnZlcnQgZnJlZSB0ZXh0IHRvIGEgc2FmZSBGVFM1IHByZWZpeCBxdWVyeS4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZ0c1F1ZXJ5KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgY29uc3QgdGVybXMgPSB0ZXh0XHJcbiAgICAucmVwbGFjZSgvWydcIiooKV0vZywgJyAnKVxyXG4gICAgLnNwbGl0KC9cXHMrLylcclxuICAgIC5maWx0ZXIoQm9vbGVhbilcclxuICAgIC5tYXAoKHQpID0+IGBcIiR7dH1cIipgKTtcclxuICByZXR1cm4gdGVybXMuam9pbignICcpIHx8ICdcIlwiJztcclxufVxyXG4iLCAiLy8gU2hhcmVkIGRvbWFpbiB0eXBlcyBcdTIwMTQgc2luZ2xlIHNvdXJjZSBvZiB0cnV0aCBmb3IgbWFpbiBwcm9jZXNzIGFuZCByZW5kZXJlci5cclxuXHJcbi8vIC0tLS0tLS0tLS0gVGVybWlub2xvZ3kgLS0tLS0tLS0tLVxyXG4vLyBVbWJyZWxsYSBub3VuOiBcIldvcmsgSXRlbVwiLiBFdmVyeSB0cmFja2VkIHJlY29yZCBpcyBhIHdvcmsgaXRlbSB3aXRoIGEgdHlwZS5cclxuLy8gSWRlbnRzIGFyZSBwZXItdHlwZSBzZXF1ZW5jZXM6IFRBU0stMTIsIEZFQVQtMywgUkVRLTQxLCBERUMtMTIsIFJJU0stOCwgQkxLLTIsXHJcbi8vIEFDQy01LCBNVEctMTQsIElERUEtNywgUS0zLCBERUYtMSwgUkVTLTQuXHJcblxyXG5leHBvcnQgY29uc3QgSVRFTV9UWVBFUyA9IFtcclxuICAndGFzaycsXHJcbiAgJ2ZlYXR1cmUnLFxyXG4gICdyZXF1aXJlbWVudCcsXHJcbiAgJ3N0b3J5JyxcclxuICAnZGVjaXNpb24nLFxyXG4gICdyaXNrJyxcclxuICAnYmxvY2tlcicsXHJcbiAgJ2FjY2VzcycsXHJcbiAgJ21lZXRpbmcnLFxyXG4gICdpZGVhJyxcclxuICAncXVlc3Rpb24nLFxyXG4gICdkZWZlY3QnLFxyXG4gICdyZXNlYXJjaCcsXHJcbl0gYXMgY29uc3Q7XHJcbmV4cG9ydCB0eXBlIEl0ZW1UeXBlID0gKHR5cGVvZiBJVEVNX1RZUEVTKVtudW1iZXJdO1xyXG5cclxuZXhwb3J0IGNvbnN0IElERU5UX1BSRUZJWDogUmVjb3JkPEl0ZW1UeXBlLCBzdHJpbmc+ID0ge1xyXG4gIHRhc2s6ICdUQVNLJyxcclxuICBmZWF0dXJlOiAnRkVBVCcsXHJcbiAgcmVxdWlyZW1lbnQ6ICdSRVEnLFxyXG4gIHN0b3J5OiAnU1RPUlknLFxyXG4gIGRlY2lzaW9uOiAnREVDJyxcclxuICByaXNrOiAnUklTSycsXHJcbiAgYmxvY2tlcjogJ0JMSycsXHJcbiAgYWNjZXNzOiAnQUNDJyxcclxuICBtZWV0aW5nOiAnTVRHJyxcclxuICBpZGVhOiAnSURFQScsXHJcbiAgcXVlc3Rpb246ICdRJyxcclxuICBkZWZlY3Q6ICdERUYnLFxyXG4gIHJlc2VhcmNoOiAnUkVTJyxcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBUWVBFX0xBQkVMOiBSZWNvcmQ8SXRlbVR5cGUsIHN0cmluZz4gPSB7XHJcbiAgdGFzazogJ1Rhc2snLFxyXG4gIGZlYXR1cmU6ICdGZWF0dXJlJyxcclxuICByZXF1aXJlbWVudDogJ1JlcXVpcmVtZW50JyxcclxuICBzdG9yeTogJ1VzZXIgU3RvcnknLFxyXG4gIGRlY2lzaW9uOiAnRGVjaXNpb24nLFxyXG4gIHJpc2s6ICdSaXNrJyxcclxuICBibG9ja2VyOiAnQmxvY2tlcicsXHJcbiAgYWNjZXNzOiAnQWNjZXNzIFJlcXVlc3QnLFxyXG4gIG1lZXRpbmc6ICdNZWV0aW5nIE5vdGUnLFxyXG4gIGlkZWE6ICdJZGVhJyxcclxuICBxdWVzdGlvbjogJ09wZW4gUXVlc3Rpb24nLFxyXG4gIGRlZmVjdDogJ0RlZmVjdCcsXHJcbiAgcmVzZWFyY2g6ICdSZXNlYXJjaCcsXHJcbn07XHJcblxyXG4vLyAtLS0tLS0tLS0tIFN0YXR1c2VzIC0tLS0tLS0tLS1cclxuLy8gV29yayBzdGF0dXNlcyBhcHBseSB0byBleGVjdXRhYmxlIGl0ZW1zICh0YXNrL2ZlYXR1cmUvcmVxdWlyZW1lbnQvc3RvcnkvZGVmZWN0L3Jlc2VhcmNoL2lkZWEpLlxyXG5leHBvcnQgY29uc3QgV09SS19TVEFUVVNFUyA9IFtcclxuICAnYmFja2xvZycsXHJcbiAgJ3RvZG8nLFxyXG4gICdpbl9wcm9ncmVzcycsXHJcbiAgJ2luX3JldmlldycsXHJcbiAgJ2Jsb2NrZWQnLFxyXG4gICdkb25lJyxcclxuICAnY2FuY2VsbGVkJyxcclxuXSBhcyBjb25zdDtcclxuZXhwb3J0IHR5cGUgV29ya1N0YXR1cyA9ICh0eXBlb2YgV09SS19TVEFUVVNFUylbbnVtYmVyXTtcclxuXHJcbmV4cG9ydCBjb25zdCBERUNJU0lPTl9TVEFUVVNFUyA9IFtcclxuICAncHJvcG9zZWQnLFxyXG4gICdkaXNjdXNzaW5nJyxcclxuICAnYXBwcm92ZWQnLFxyXG4gICdyZWplY3RlZCcsXHJcbiAgJ3JldmlzaXQnLFxyXG4gICdzdXBlcnNlZGVkJyxcclxuXSBhcyBjb25zdDtcclxuZXhwb3J0IHR5cGUgRGVjaXNpb25TdGF0dXMgPSAodHlwZW9mIERFQ0lTSU9OX1NUQVRVU0VTKVtudW1iZXJdO1xyXG5cclxuZXhwb3J0IGNvbnN0IEFDQ0VTU19TVEFUVVNFUyA9IFtcclxuICAnaWRlbnRpZmllZCcsXHJcbiAgJ25vdF9yZXF1ZXN0ZWQnLFxyXG4gICdwcmVwYXJpbmcnLFxyXG4gICdyZXF1ZXN0ZWQnLFxyXG4gICd1bmRlcl9yZXZpZXcnLFxyXG4gICdpbmZvX25lZWRlZCcsXHJcbiAgJ2FwcHJvdmVkJyxcclxuICAncGFydGlhbGx5X2FwcHJvdmVkJyxcclxuICAnZ3JhbnRlZCcsXHJcbiAgJ2RlbmllZCcsXHJcbiAgJ2V4cGlyZWQnLFxyXG4gICdub3RfbmVlZGVkJyxcclxuXSBhcyBjb25zdDtcclxuZXhwb3J0IHR5cGUgQWNjZXNzU3RhdHVzID0gKHR5cGVvZiBBQ0NFU1NfU1RBVFVTRVMpW251bWJlcl07XHJcblxyXG5leHBvcnQgY29uc3QgUklTS19TVEFUVVNFUyA9IFsnb3BlbicsICdtaXRpZ2F0aW5nJywgJ2FjY2VwdGVkJywgJ2Nsb3NlZCddIGFzIGNvbnN0O1xyXG5leHBvcnQgY29uc3QgQkxPQ0tFUl9TVEFUVVNFUyA9IFsnYWN0aXZlJywgJ3dvcmthcm91bmQnLCAncmVzb2x2ZWQnXSBhcyBjb25zdDtcclxuZXhwb3J0IGNvbnN0IFFVRVNUSU9OX1NUQVRVU0VTID0gWydvcGVuJywgJ2Fuc3dlcmVkJywgJ3BhcmtlZCddIGFzIGNvbnN0O1xyXG5leHBvcnQgY29uc3QgTUVFVElOR19TVEFUVVNFUyA9IFsnc2NoZWR1bGVkJywgJ2hlbGQnLCAnc3VtbWFyaXplZCddIGFzIGNvbnN0O1xyXG5cclxuZXhwb3J0IHR5cGUgSXRlbVN0YXR1cyA9IHN0cmluZzsgLy8gdmFsaWRhdGVkIHBlci10eXBlIGJ5IHN0YXR1c2VzRm9yVHlwZSgpXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RhdHVzZXNGb3JUeXBlKHR5cGU6IEl0ZW1UeXBlKTogcmVhZG9ubHkgc3RyaW5nW10ge1xyXG4gIHN3aXRjaCAodHlwZSkge1xyXG4gICAgY2FzZSAnZGVjaXNpb24nOlxyXG4gICAgICByZXR1cm4gREVDSVNJT05fU1RBVFVTRVM7XHJcbiAgICBjYXNlICdhY2Nlc3MnOlxyXG4gICAgICByZXR1cm4gQUNDRVNTX1NUQVRVU0VTO1xyXG4gICAgY2FzZSAncmlzayc6XHJcbiAgICAgIHJldHVybiBSSVNLX1NUQVRVU0VTO1xyXG4gICAgY2FzZSAnYmxvY2tlcic6XHJcbiAgICAgIHJldHVybiBCTE9DS0VSX1NUQVRVU0VTO1xyXG4gICAgY2FzZSAncXVlc3Rpb24nOlxyXG4gICAgICByZXR1cm4gUVVFU1RJT05fU1RBVFVTRVM7XHJcbiAgICBjYXNlICdtZWV0aW5nJzpcclxuICAgICAgcmV0dXJuIE1FRVRJTkdfU1RBVFVTRVM7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICByZXR1cm4gV09SS19TVEFUVVNFUztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBTVEFUVVNfTEFCRUw6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgYmFja2xvZzogJ0JhY2tsb2cnLFxyXG4gIHRvZG86ICdUbyBEbycsXHJcbiAgaW5fcHJvZ3Jlc3M6ICdJbiBQcm9ncmVzcycsXHJcbiAgaW5fcmV2aWV3OiAnSW4gUmV2aWV3JyxcclxuICBibG9ja2VkOiAnQmxvY2tlZCcsXHJcbiAgZG9uZTogJ0RvbmUnLFxyXG4gIGNhbmNlbGxlZDogJ0NhbmNlbGxlZCcsXHJcbiAgcHJvcG9zZWQ6ICdQcm9wb3NlZCcsXHJcbiAgZGlzY3Vzc2luZzogJ0Rpc2N1c3NpbmcnLFxyXG4gIGFwcHJvdmVkOiAnQXBwcm92ZWQnLFxyXG4gIHJlamVjdGVkOiAnUmVqZWN0ZWQnLFxyXG4gIHJldmlzaXQ6ICdSZXZpc2l0IExhdGVyJyxcclxuICBzdXBlcnNlZGVkOiAnU3VwZXJzZWRlZCcsXHJcbiAgaWRlbnRpZmllZDogJ0lkZW50aWZpZWQnLFxyXG4gIG5vdF9yZXF1ZXN0ZWQ6ICdOb3QgUmVxdWVzdGVkJyxcclxuICBwcmVwYXJpbmc6ICdQcmVwYXJpbmcgUmVxdWVzdCcsXHJcbiAgcmVxdWVzdGVkOiAnUmVxdWVzdGVkJyxcclxuICB1bmRlcl9yZXZpZXc6ICdVbmRlciBSZXZpZXcnLFxyXG4gIGluZm9fbmVlZGVkOiAnTW9yZSBJbmZvIE5lZWRlZCcsXHJcbiAgcGFydGlhbGx5X2FwcHJvdmVkOiAnUGFydGlhbGx5IEFwcHJvdmVkJyxcclxuICBncmFudGVkOiAnR3JhbnRlZCcsXHJcbiAgZGVuaWVkOiAnRGVuaWVkJyxcclxuICBleHBpcmVkOiAnRXhwaXJlZCcsXHJcbiAgbm90X25lZWRlZDogJ05vIExvbmdlciBOZWVkZWQnLFxyXG4gIG9wZW46ICdPcGVuJyxcclxuICBtaXRpZ2F0aW5nOiAnTWl0aWdhdGluZycsXHJcbiAgYWNjZXB0ZWQ6ICdBY2NlcHRlZCcsXHJcbiAgY2xvc2VkOiAnQ2xvc2VkJyxcclxuICBhY3RpdmU6ICdBY3RpdmUnLFxyXG4gIHdvcmthcm91bmQ6ICdXb3JrYXJvdW5kIEluIFBsYWNlJyxcclxuICByZXNvbHZlZDogJ1Jlc29sdmVkJyxcclxuICBhbnN3ZXJlZDogJ0Fuc3dlcmVkJyxcclxuICBwYXJrZWQ6ICdQYXJrZWQnLFxyXG4gIHNjaGVkdWxlZDogJ1NjaGVkdWxlZCcsXHJcbiAgaGVsZDogJ0hlbGQnLFxyXG4gIHN1bW1hcml6ZWQ6ICdTdW1tYXJpemVkJyxcclxufTtcclxuXHJcbi8qKiBTdGF0dXNlcyB0aGF0IGNvdW50IGFzIFwiY2xvc2VkL3Rlcm1pbmFsXCIgZm9yIHByb2dyZXNzICsgZGFzaGJvYXJkcy4gKi9cclxuZXhwb3J0IGNvbnN0IFRFUk1JTkFMX1NUQVRVU0VTID0gbmV3IFNldChbXHJcbiAgJ2RvbmUnLFxyXG4gICdjYW5jZWxsZWQnLFxyXG4gICdyZWplY3RlZCcsXHJcbiAgJ3N1cGVyc2VkZWQnLFxyXG4gICdncmFudGVkJyxcclxuICAnZGVuaWVkJyxcclxuICAnZXhwaXJlZCcsXHJcbiAgJ25vdF9uZWVkZWQnLFxyXG4gICdjbG9zZWQnLFxyXG4gICdyZXNvbHZlZCcsXHJcbiAgJ2Fuc3dlcmVkJyxcclxuICAnc3VtbWFyaXplZCcsXHJcbiAgJ2FjY2VwdGVkJyxcclxuXSk7XHJcblxyXG5leHBvcnQgY29uc3QgUFJJT1JJVElFUyA9IFsndXJnZW50JywgJ2hpZ2gnLCAnbWVkaXVtJywgJ2xvdycsICdub25lJ10gYXMgY29uc3Q7XHJcbmV4cG9ydCB0eXBlIFByaW9yaXR5ID0gKHR5cGVvZiBQUklPUklUSUVTKVtudW1iZXJdO1xyXG5cclxuLy8gLS0tLS0tLS0tLSBMaW5rcyAtLS0tLS0tLS0tXHJcbmV4cG9ydCBjb25zdCBMSU5LX0tJTkRTID0gW1xyXG4gICdyZWxhdGVzJywgLy8gZ2VuZXJpYyBiaWRpcmVjdGlvbmFsXHJcbiAgJ2Jsb2NrcycsIC8vIGZyb20gYmxvY2tzIHRvXHJcbiAgJ2ltcGxlbWVudHMnLCAvLyB0YXNrIGltcGxlbWVudHMgcmVxdWlyZW1lbnQvZmVhdHVyZVxyXG4gICdzdXBwb3J0cycsIC8vIHJlcXVpcmVtZW50IHN1cHBvcnRzIGZlYXR1cmVcclxuICAnc2hhcGVkX2J5JywgLy8gaXRlbSBzaGFwZWQgYnkgZGVjaXNpb25cclxuICAncmVxdWlyZXNfYWNjZXNzJywgLy8gaXRlbSByZXF1aXJlcyBhY2Nlc3MgcmVjb3JkXHJcbiAgJ2Rpc2N1c3NlZF9pbicsIC8vIGl0ZW0gZGlzY3Vzc2VkIGluIG1lZXRpbmdcclxuICAndmFsaWRhdGVzJywgLy8gdGVzdC9kZWZlY3QgdmFsaWRhdGVzIHJlcXVpcmVtZW50XHJcbiAgJ3N1cGVyc2VkZXMnLCAvLyBkZWNpc2lvbiBzdXBlcnNlZGVzIGRlY2lzaW9uXHJcbiAgJ3BhcmVudCcsIC8vIGZyb20gaXMgcGFyZW50IG9mIHRvIChhbHNvIG1pcnJvcmVkIHZpYSBpdGVtcy5wYXJlbnRfaWQpXHJcbl0gYXMgY29uc3Q7XHJcbmV4cG9ydCB0eXBlIExpbmtLaW5kID0gKHR5cGVvZiBMSU5LX0tJTkRTKVtudW1iZXJdO1xyXG5cclxuZXhwb3J0IGNvbnN0IExJTktfTEFCRUw6IFJlY29yZDxMaW5rS2luZCwgW3N0cmluZywgc3RyaW5nXT4gPSB7XHJcbiAgLy8gW2xhYmVsIGZyb20tPnRvLCBsYWJlbCB0by0+ZnJvbV1cclxuICByZWxhdGVzOiBbJ3JlbGF0ZXMgdG8nLCAncmVsYXRlcyB0byddLFxyXG4gIGJsb2NrczogWydibG9ja3MnLCAnYmxvY2tlZCBieSddLFxyXG4gIGltcGxlbWVudHM6IFsnaW1wbGVtZW50cycsICdpbXBsZW1lbnRlZCBieSddLFxyXG4gIHN1cHBvcnRzOiBbJ3N1cHBvcnRzJywgJ3N1cHBvcnRlZCBieSddLFxyXG4gIHNoYXBlZF9ieTogWydzaGFwZWQgYnknLCAnc2hhcGVkJ10sXHJcbiAgcmVxdWlyZXNfYWNjZXNzOiBbJ3JlcXVpcmVzIGFjY2VzcycsICdyZXF1aXJlZCBmb3InXSxcclxuICBkaXNjdXNzZWRfaW46IFsnZGlzY3Vzc2VkIGluJywgJ2Rpc2N1c3NlZCddLFxyXG4gIHZhbGlkYXRlczogWyd2YWxpZGF0ZXMnLCAndmFsaWRhdGVkIGJ5J10sXHJcbiAgc3VwZXJzZWRlczogWydzdXBlcnNlZGVzJywgJ3N1cGVyc2VkZWQgYnknXSxcclxuICBwYXJlbnQ6IFsncGFyZW50IG9mJywgJ2NoaWxkIG9mJ10sXHJcbn07XHJcblxyXG4vLyAtLS0tLS0tLS0tIENvcmUgcmVjb3JkcyAtLS0tLS0tLS0tXHJcbmV4cG9ydCBpbnRlcmZhY2UgV29ya0l0ZW0ge1xyXG4gIGlkOiBzdHJpbmc7IC8vIHV1aWQgXHUyMDE0IGNhbm9uaWNhbCBpZGVudGl0eSwgdXNlZCBieSBhbGwgcmVmZXJlbmNlc1xyXG4gIGlkZW50OiBzdHJpbmc7IC8vIGRpc3BsYXkgaWQgZS5nLiBSRVEtNDEgKG1heSBiZSByZW51bWJlcmVkIG9uIHN5bmMgY29sbGlzaW9uKVxyXG4gIHR5cGU6IEl0ZW1UeXBlO1xyXG4gIHRpdGxlOiBzdHJpbmc7XHJcbiAgYm9keTogc3RyaW5nOyAvLyByaWNoIGRvYyBKU09OIChlZGl0b3IgZG9jdW1lbnQpLCAnJyB3aGVuIGVtcHR5XHJcbiAgYm9keVRleHQ6IHN0cmluZzsgLy8gcGxhaW4gdGV4dCBwcm9qZWN0aW9uIGZvciBzZWFyY2hcclxuICBzdGF0dXM6IHN0cmluZztcclxuICBwcmlvcml0eTogUHJpb3JpdHk7XHJcbiAgb3duZXJJZDogc3RyaW5nIHwgbnVsbDtcclxuICByZXBvcnRlcklkOiBzdHJpbmcgfCBudWxsO1xyXG4gIG1pbGVzdG9uZUlkOiBzdHJpbmcgfCBudWxsO1xyXG4gIHJlbGVhc2VJZDogc3RyaW5nIHwgbnVsbDtcclxuICBwYXJlbnRJZDogc3RyaW5nIHwgbnVsbDtcclxuICBzdGFydERhdGU6IHN0cmluZyB8IG51bGw7IC8vIElTTyBkYXRlXHJcbiAgZHVlRGF0ZTogc3RyaW5nIHwgbnVsbDtcclxuICBjb21wbGV0ZWRBdDogc3RyaW5nIHwgbnVsbDsgLy8gSVNPIGRhdGV0aW1lXHJcbiAgZWZmb3J0OiBudW1iZXIgfCBudWxsOyAvLyBwb2ludHMvZGF5cywgdW5pdCBpcyB0ZWFtIGNvbnZlbnRpb25cclxuICBjb25maWRlbmNlOiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgbnVsbDtcclxuICByaXNrTGV2ZWw6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAnY3JpdGljYWwnIHwgbnVsbDtcclxuICBidXNpbmVzc1ZhbHVlOiBzdHJpbmcgfCBudWxsO1xyXG4gIGxlYWRlcnNoaXBWaXNpYmxlOiAwIHwgMTtcclxuICBwcm9ncmVzczogbnVtYmVyIHwgbnVsbDsgLy8gMC0xMDAgbWFudWFsIG92ZXJyaWRlOyBudWxsID0gZGVyaXZlZFxyXG4gIHRhZ3M6IHN0cmluZ1tdO1xyXG4gIGV4dHJhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjsgLy8gdHlwZS1zcGVjaWZpYyBmaWVsZHMgKHNlZSBkb2NzL1RFUk1JTk9MT0dZLm1kKVxyXG4gIGFyY2hpdmVkOiAwIHwgMTtcclxuICBzYW1wbGU6IDAgfCAxOyAvLyBzZWVkZWQgc2FtcGxlIGRhdGEgZmxhZ1xyXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xyXG4gIGNyZWF0ZWRCeTogc3RyaW5nO1xyXG4gIHVwZGF0ZWRCeTogc3RyaW5nO1xyXG59XHJcblxyXG4vLyBUeXBlLXNwZWNpZmljIGBleHRyYWAgc2hhcGVzIChkb2N1bWVudGVkLCBub3QgZW5mb3JjZWQgYnkgREIpOlxyXG4vLyBhY2Nlc3M6ICAgeyBzeXN0ZW0sIGFjY2Vzc1R5cGUsIGJ1c2luZXNzUmVhc29uLCByZXF1ZXN0ZWRGcm9tLCByZXF1ZXN0RGF0ZSxcclxuLy8gICAgICAgICAgICAgYXBwcm92ZWRCeSwgZGF0ZUdyYW50ZWQsIGV4cGlyYXRpb25EYXRlLCByZW5ld2FsRGF0ZSwgc2VjdXJpdHlOb3RlcywgbmV4dEFjdGlvbiwgZm9sbG93VXBEYXRlIH1cclxuLy8gZGVjaXNpb246IHsgY29udGV4dCwgcHJvYmxlbSwgb3B0aW9uczogW3t0aXRsZSwgbm90ZXMsIHNlbGVjdGVkfV0sIHJlYXNvbmluZyxcclxuLy8gICAgICAgICAgICAgdHJhZGVvZmZzLCBjb25zZXF1ZW5jZXMsIHJldmlld0RhdGUsIGNvbnRyaWJ1dG9yczogc3RyaW5nW10gfVxyXG4vLyBtZWV0aW5nOiAgeyBkYXRlLCB0aW1lLCBhdHRlbmRlZXM6IHN0cmluZ1tdLCBwdXJwb3NlLCBhZ2VuZGEsIGZvbGxvd1VwRGF0ZSB9XHJcbi8vIHJpc2s6ICAgICB7IGxpa2VsaWhvb2QsIGltcGFjdCwgbWl0aWdhdGlvbiwgdHJpZ2dlciB9XHJcbi8vIGJsb2NrZXI6ICB7IHdhaXRpbmdPbiwgc2luY2UsIGVzY2FsYXRlZFRvIH1cclxuLy8gcmVxdWlyZW1lbnQ6IHsgYWNjZXB0YW5jZUNyaXRlcmlhLCB0ZXN0aW5nTm90ZXMsIHNlY3VyaXR5Q29uc2lkZXJhdGlvbnMgfVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJdGVtTGluayB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBmcm9tSWQ6IHN0cmluZztcclxuICB0b0lkOiBzdHJpbmc7XHJcbiAga2luZDogTGlua0tpbmQ7XHJcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XHJcbiAgY3JlYXRlZEJ5OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ29tbWVudCB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBpdGVtSWQ6IHN0cmluZztcclxuICBhdXRob3JJZDogc3RyaW5nO1xyXG4gIGJvZHk6IHN0cmluZzsgLy8gcmljaCBkb2MgSlNPTlxyXG4gIGJvZHlUZXh0OiBzdHJpbmc7XHJcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XHJcbiAgdXBkYXRlZEF0OiBzdHJpbmcgfCBudWxsO1xyXG4gIHVwZGF0ZWRCeT86IHN0cmluZyB8IG51bGw7XHJcbiAgZGVsZXRlZDogMCB8IDE7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQXR0YWNobWVudCB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBpdGVtSWQ6IHN0cmluZztcclxuICBmaWxlbmFtZTogc3RyaW5nO1xyXG4gIG1pbWU6IHN0cmluZztcclxuICBzaXplOiBudW1iZXI7XHJcbiAgc2hhMjU2OiBzdHJpbmc7XHJcbiAgZGVzY3JpcHRpb246IHN0cmluZyB8IG51bGw7XHJcbiAgdXBsb2FkZWRCeTogc3RyaW5nO1xyXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG4gIGRlbGV0ZWQ6IDAgfCAxO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFjdGl2aXR5RW50cnkge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgaXRlbUlkOiBzdHJpbmcgfCBudWxsO1xyXG4gIGFjdG9ySWQ6IHN0cmluZztcclxuICBraW5kOiBzdHJpbmc7IC8vIGNyZWF0ZWQgfCB1cGRhdGVkIHwgc3RhdHVzIHwgY29tbWVudCB8IGxpbmsgfCBhdHRhY2htZW50IHwgYXJjaGl2ZWQgfCByZXN0b3JlZCB8IC4uLlxyXG4gIGZpZWxkOiBzdHJpbmcgfCBudWxsO1xyXG4gIG9sZFZhbHVlOiBzdHJpbmcgfCBudWxsO1xyXG4gIG5ld1ZhbHVlOiBzdHJpbmcgfCBudWxsO1xyXG4gIGF0OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSXRlbVZlcnNpb24ge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgaXRlbUlkOiBzdHJpbmc7XHJcbiAgdmVyc2lvbjogbnVtYmVyO1xyXG4gIHRpdGxlOiBzdHJpbmc7XHJcbiAgYm9keTogc3RyaW5nO1xyXG4gIHNhdmVkQnk6IHN0cmluZztcclxuICBzYXZlZEF0OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTWlsZXN0b25lIHtcclxuICBpZDogc3RyaW5nO1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xyXG4gIHRhcmdldERhdGU6IHN0cmluZyB8IG51bGw7XHJcbiAgc3RhdHVzOiAncGxhbm5lZCcgfCAnYWN0aXZlJyB8ICdkb25lJztcclxuICBzb3J0OiBudW1iZXI7XHJcbiAgc2FtcGxlOiAwIHwgMTtcclxuICBjcmVhdGVkQXQ/OiBzdHJpbmc7XHJcbiAgY3JlYXRlZEJ5Pzogc3RyaW5nO1xyXG4gIHVwZGF0ZWRBdD86IHN0cmluZztcclxuICB1cGRhdGVkQnk/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVsZWFzZSB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgdmVyc2lvbjogc3RyaW5nO1xyXG4gIHRhcmdldERhdGU6IHN0cmluZyB8IG51bGw7XHJcbiAgc3RhdHVzOiAncGxhbm5lZCcgfCAnaW5fcHJvZ3Jlc3MnIHwgJ3JlbGVhc2VkJyB8ICdjYW5jZWxsZWQnO1xyXG4gIGdvYWxzOiBzdHJpbmc7XHJcbiAgbm90ZXM6IHN0cmluZzsgLy8gcmVsZWFzZSBub3RlcyByaWNoIGRvY1xyXG4gIHNhbXBsZTogMCB8IDE7XHJcbiAgY3JlYXRlZEF0Pzogc3RyaW5nO1xyXG4gIGNyZWF0ZWRCeT86IHN0cmluZztcclxuICB1cGRhdGVkQXQ/OiBzdHJpbmc7XHJcbiAgdXBkYXRlZEJ5Pzogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFVzZXIge1xyXG4gIGlkOiBzdHJpbmc7IC8vIHN0YWJsZSBzbHVnLCBlLmcuICdqb2huJywgJ21hcmsnXHJcbiAgbmFtZTogc3RyaW5nO1xyXG4gIGluaXRpYWxzOiBzdHJpbmc7XHJcbiAgY29sb3I6IHN0cmluZztcclxuICBhdmF0YXI/OiBzdHJpbmcgfCBudWxsOyAvLyBpbWFnZSBkYXRhIFVSTDsgbnVsbC9hYnNlbnQgPSByZW5kZXIgaW5pdGlhbHMgb24gY29sb3JcclxuICBjcmVhdGVkQXQ6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTYXZlZFZpZXcge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgbmFtZTogc3RyaW5nO1xyXG4gIGNvbmZpZzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47IC8vIHt2aWV3LCBmaWx0ZXJzLCBzb3J0LCBncm91cH1cclxuICBwaW5uZWQ6IDAgfCAxO1xyXG4gIGNyZWF0ZWRCeTogc3RyaW5nO1xyXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG59XHJcblxyXG4vLyAtLS0tLS0tLS0tIFBlci11c2VyIHZpZXcgbGF5b3V0IHByZWZlcmVuY2VzIChsb2NhbCwgbm90IHN5bmNlZCkgLS0tLS0tLS0tLVxyXG5leHBvcnQgdHlwZSBWaWV3U2l6ZSA9ICdzbWFsbCcgfCAnc3RhbmRhcmQnIHwgJ2xhcmdlJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVmlld0l0ZW1QcmVmIHtcclxuICBrZXk6IHN0cmluZzsgLy8gc3RhYmxlIGNhcmQvY29sdW1uIGtleVxyXG4gIHZpc2libGU6IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2luZ2xlVmlld1ByZWZzIHtcclxuICBzaXplOiBWaWV3U2l6ZTtcclxuICBpdGVtczogVmlld0l0ZW1QcmVmW107IC8vIG9yZGVyZWQ7IGRyaXZlcyBhcnJhbmdlbWVudCArIHZpc2liaWxpdHlcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWaWV3UHJlZnMge1xyXG4gIGJvYXJkPzogU2luZ2xlVmlld1ByZWZzO1xyXG4gIGRhc2hib2FyZD86IFNpbmdsZVZpZXdQcmVmcztcclxufVxyXG5cclxuLy8gLS0tLS0tLS0tLSBTeW5jIC0tLS0tLS0tLS1cclxuZXhwb3J0IGludGVyZmFjZSBPcCB7XHJcbiAgb3BJZDogc3RyaW5nOyAvLyB1dWlkXHJcbiAgZGV2aWNlSWQ6IHN0cmluZztcclxuICBhY3RvcklkOiBzdHJpbmc7XHJcbiAgbGFtcG9ydDogbnVtYmVyO1xyXG4gIGF0OiBzdHJpbmc7IC8vIHdhbGwgY2xvY2ssIGluZm9ybWF0aW9uYWwgb25seSBcdTIwMTQgb3JkZXJpbmcgdXNlcyBsYW1wb3J0XHJcbiAgZW50aXR5OiAnaXRlbScgfCAnbGluaycgfCAnY29tbWVudCcgfCAnYXR0YWNobWVudCcgfCAnbWlsZXN0b25lJyB8ICdyZWxlYXNlJyB8ICd1c2VyJyB8ICdzYXZlZF92aWV3JyB8ICd0YWdzZXQnO1xyXG4gIGVudGl0eUlkOiBzdHJpbmc7XHJcbiAgYWN0aW9uOiAnY3JlYXRlJyB8ICdzZXQnIHwgJ2RlbGV0ZSc7XHJcbiAgLy8gY3JlYXRlOiBwYXlsb2FkID0gZnVsbCByZWNvcmQuIHNldDogcGF5bG9hZCA9IHtmaWVsZDogdmFsdWUsLi4ufS4gZGVsZXRlOiBwYXlsb2FkID0ge30uXHJcbiAgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU3luY0NvbmZsaWN0IHtcclxuICBpZDogc3RyaW5nO1xyXG4gIGVudGl0eTogc3RyaW5nO1xyXG4gIGVudGl0eUlkOiBzdHJpbmc7XHJcbiAgZmllbGQ6IHN0cmluZztcclxuICBsb2NhbFZhbHVlOiBzdHJpbmc7XHJcbiAgcmVtb3RlVmFsdWU6IHN0cmluZztcclxuICByZW1vdGVEZXZpY2U6IHN0cmluZztcclxuICByZW1vdGVBY3Rvcjogc3RyaW5nO1xyXG4gIGRldGVjdGVkQXQ6IHN0cmluZztcclxuICByZXNvbHZlZEF0OiBzdHJpbmcgfCBudWxsO1xyXG4gIHJlc29sdXRpb246ICdsb2NhbCcgfCAncmVtb3RlJyB8ICdtZXJnZWQnIHwgbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgU3luY1N0YXR1c1N0YXRlID0gJ2Rpc2FibGVkJyB8ICdpZGxlJyB8ICdzeW5jaW5nJyB8ICdvZmZsaW5lJyB8ICdlcnJvcic7XHJcbmV4cG9ydCBpbnRlcmZhY2UgU3luY1N0YXR1cyB7XHJcbiAgc3RhdGU6IFN5bmNTdGF0dXNTdGF0ZTtcclxuICBmb2xkZXI6IHN0cmluZyB8IG51bGw7XHJcbiAgbGFzdFN5bmNBdDogc3RyaW5nIHwgbnVsbDtcclxuICBsYXN0RXJyb3I6IHN0cmluZyB8IG51bGw7XHJcbiAgcGVuZGluZ09wczogbnVtYmVyO1xyXG4gIG9wZW5Db25mbGljdHM6IG51bWJlcjtcclxuICBwZWVyczogeyBkZXZpY2VJZDogc3RyaW5nOyB1c2VyTmFtZTogc3RyaW5nIHwgbnVsbDsgbGFzdFNlZW5BdDogc3RyaW5nIHwgbnVsbCB9W107XHJcbn1cclxuXHJcbi8vIC0tLS0tLS0tLS0gUXVlcmllcyAtLS0tLS0tLS0tXHJcbmV4cG9ydCBpbnRlcmZhY2UgSXRlbUZpbHRlciB7XHJcbiAgdHlwZXM/OiBJdGVtVHlwZVtdO1xyXG4gIHN0YXR1c2VzPzogc3RyaW5nW107XHJcbiAgcHJpb3JpdGllcz86IFByaW9yaXR5W107XHJcbiAgb3duZXJJZHM/OiAoc3RyaW5nIHwgbnVsbClbXTtcclxuICBtaWxlc3RvbmVJZD86IHN0cmluZztcclxuICByZWxlYXNlSWQ/OiBzdHJpbmc7XHJcbiAgdGFnPzogc3RyaW5nO1xyXG4gIHRleHQ/OiBzdHJpbmc7IC8vIEZUUyBxdWVyeVxyXG4gIGFyY2hpdmVkPzogYm9vbGVhbjsgLy8gZGVmYXVsdCBmYWxzZVxyXG4gIG92ZXJkdWU/OiBib29sZWFuO1xyXG4gIGR1ZVdpdGhpbkRheXM/OiBudW1iZXI7XHJcbiAgbGVhZGVyc2hpcFZpc2libGU/OiBib29sZWFuO1xyXG4gIHVwZGF0ZWRTaW5jZT86IHN0cmluZztcclxuICBwYXJlbnRJZD86IHN0cmluZztcclxuICBzYW1wbGU/OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEl0ZW1Tb3J0IHtcclxuICBmaWVsZDogJ2lkZW50JyB8ICd0aXRsZScgfCAnc3RhdHVzJyB8ICdwcmlvcml0eScgfCAnZHVlRGF0ZScgfCAnY3JlYXRlZEF0JyB8ICd1cGRhdGVkQXQnIHwgJ21hbnVhbCc7XHJcbiAgZGlyOiAnYXNjJyB8ICdkZXNjJztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZWFyY2hSZXN1bHQge1xyXG4gIGl0ZW06IFdvcmtJdGVtO1xyXG4gIHNuaXBwZXQ6IHN0cmluZyB8IG51bGw7XHJcbiAgc2NvcmU6IG51bWJlcjtcclxufVxyXG4iLCAiLy8gUmljaC1kb2MgaGVscGVycyBzaGFyZWQgYnkgbWFpbiBwcm9jZXNzIGFuZCByZW5kZXJlci5cclxuXHJcbi8qKiBFeHRyYWN0IHBsYWluIHRleHQgZnJvbSBhIHN0b3JlZCBlZGl0b3IgZG9jdW1lbnQgKFRpcFRhcCBKU09OIHN0cmluZykuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBkb2NUb1RleHQoYm9keTogc3RyaW5nKTogc3RyaW5nIHtcclxuICBpZiAoIWJvZHkpIHJldHVybiAnJztcclxuICB0cnkge1xyXG4gICAgY29uc3QgZG9jID0gSlNPTi5wYXJzZShib2R5KSBhcyB7IGNvbnRlbnQ/OiB1bmtub3duW10gfTtcclxuICAgIGNvbnN0IHdhbGsgPSAobm9kZXM6IHVua25vd25bXSk6IHN0cmluZyA9PlxyXG4gICAgICBub2Rlc1xyXG4gICAgICAgIC5tYXAoKG4pID0+IHtcclxuICAgICAgICAgIGNvbnN0IG5vZGUgPSBuIGFzIHsgdHlwZT86IHN0cmluZzsgdGV4dD86IHN0cmluZzsgY29udGVudD86IHVua25vd25bXSB9O1xyXG4gICAgICAgICAgaWYgKG5vZGUudGV4dCkgcmV0dXJuIG5vZGUudGV4dDtcclxuICAgICAgICAgIGNvbnN0IGlubmVyID0gbm9kZS5jb250ZW50ID8gd2Fsayhub2RlLmNvbnRlbnQpIDogJyc7XHJcbiAgICAgICAgICByZXR1cm4gbm9kZS50eXBlID09PSAncGFyYWdyYXBoJyB8fCBub2RlLnR5cGU/LnN0YXJ0c1dpdGgoJ2hlYWRpbmcnKSA/IGlubmVyICsgJ1xcbicgOiBpbm5lcjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5qb2luKCcnKTtcclxuICAgIHJldHVybiB3YWxrKGRvYy5jb250ZW50ID8/IFtdKS50cmltKCk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gYm9keTtcclxuICB9XHJcbn1cclxuXHJcbi8qKiBXcmFwIHBsYWluIHRleHQgaW50byBhIG1pbmltYWwgZWRpdG9yIGRvY3VtZW50LiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdGV4dFRvRG9jKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcclxuICAgIHR5cGU6ICdkb2MnLFxyXG4gICAgY29udGVudDogdGV4dC5zcGxpdCgvXFxuezIsfS8pLm1hcCgocCkgPT4gKHtcclxuICAgICAgdHlwZTogJ3BhcmFncmFwaCcsXHJcbiAgICAgIGNvbnRlbnQ6IHAgPyBbeyB0eXBlOiAndGV4dCcsIHRleHQ6IHAgfV0gOiBbXSxcclxuICAgIH0pKSxcclxuICB9KTtcclxufVxyXG4iLCAiLy8gU3luY1RyYW5zcG9ydDogdGhlIHNlYW0gYmV0d2VlbiBUZXRoZXIgYW5kIHdoYXRldmVyIG1vdmVzIGJ5dGVzIGJldHdlZW4gbWFjaGluZXMuXHJcbi8vIHYxIHNoaXBzIEZvbGRlclRyYW5zcG9ydCAoYSBPbmVEcml2ZS9TaGFyZVBvaW50LXN5bmNlZCBmb2xkZXIpLiBUaGUgaW50ZXJmYWNlIGlzXHJcbi8vIGRlbGliZXJhdGVseSBkdW1iIFx1MjAxNCBhcHBlbmQtb25seSBiYXRjaGVzIG91dCwgYmF0Y2hlcyBpbiBcdTIwMTQgc28gYSBmdXR1cmUgQXp1cmUgU1FMIC9cclxuLy8gRGF0YXZlcnNlIC8gaW50ZXJuYWwgQVBJIHRyYW5zcG9ydCBzbG90cyBpbiB3aXRob3V0IHRvdWNoaW5nIG1lcmdlIGxvZ2ljLlxyXG5cclxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xyXG5pbXBvcnQgdHlwZSB7IE9wIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGVlckluZm8ge1xyXG4gIGRldmljZUlkOiBzdHJpbmc7XHJcbiAgdXNlck5hbWU6IHN0cmluZyB8IG51bGw7XHJcbiAgbGFzdFNlZW5BdDogc3RyaW5nIHwgbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBPcEJhdGNoRmlsZSB7XHJcbiAgZGV2aWNlSWQ6IHN0cmluZztcclxuICBmaWxlTmFtZTogc3RyaW5nOyAvLyBzb3J0YWJsZSwgdW5pcXVlIHBlciBkZXZpY2VcclxuICBvcHM6IE9wW107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU3luY1RyYW5zcG9ydCB7XHJcbiAgLyoqIEh1bWFuLXJlYWRhYmxlIGxvY2F0aW9uIGZvciB0aGUgVUkgKFwid2hlcmUgaXMgbXkgZGF0YVwiKS4gKi9cclxuICBsb2NhdGlvbigpOiBzdHJpbmc7XHJcbiAgLyoqIFRydWUgd2hlbiB0aGUgYmFja2luZyBtZWRpdW0gaXMgcmVhY2hhYmxlIHJpZ2h0IG5vdy4gKi9cclxuICBhdmFpbGFibGUoKTogYm9vbGVhbjtcclxuICAvKiogUHVibGlzaCBhIGJhdGNoIG9mIHRoaXMgZGV2aWNlJ3Mgb3BzLiBNdXN0IGJlIGF0b21pYyAoYWxsLW9yLW5vdGhpbmcgdmlzaWJsZSkuICovXHJcbiAgcHVibGlzaE9wcyhkZXZpY2VJZDogc3RyaW5nLCBiYXRjaE5hbWU6IHN0cmluZywgb3BzOiBPcFtdKTogUHJvbWlzZTx2b2lkPjtcclxuICAvKiogTGlzdCBwZWVyIGJhdGNoIGZpbGUgbmFtZXMgKHNvcnRlZCBhc2NlbmRpbmcpIG5ld2VyIHRoYW4gYGFmdGVyRmlsZWAgZm9yIGVhY2ggcGVlci4gKi9cclxuICBsaXN0UGVlckJhdGNoZXMob3duRGV2aWNlSWQ6IHN0cmluZywgYWZ0ZXJGaWxlQnlEZXZpY2U6IE1hcDxzdHJpbmcsIHN0cmluZyB8IG51bGw+KTogUHJvbWlzZTx7IGRldmljZUlkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfVtdPjtcclxuICAvKiogRmV0Y2ggb25lIGJhdGNoLiAqL1xyXG4gIGZldGNoQmF0Y2goZGV2aWNlSWQ6IHN0cmluZywgZmlsZU5hbWU6IHN0cmluZyk6IFByb21pc2U8T3BbXT47XHJcbiAgLyoqIEFubm91bmNlIHByZXNlbmNlIChvd24gZmlsZSBvbmx5IFx1MjAxNCBubyB3cml0ZSBjb250ZW50aW9uKS4gKi9cclxuICBhbm5vdW5jZShkZXZpY2VJZDogc3RyaW5nLCB1c2VyTmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcclxuICAvKiogQWxsIGFubm91bmNlZCBkZXZpY2VzLiAqL1xyXG4gIGxpc3RQZWVycygpOiBQcm9taXNlPFBlZXJJbmZvW10+O1xyXG4gIC8qKiBTdG9yZSBhbiBhdHRhY2htZW50IGJsb2IgY29udGVudC1hZGRyZXNzZWQgYnkgc2hhMjU2LiBSZXR1cm5zIHRydWUgaWYgbmV3bHkgc3RvcmVkLiAqL1xyXG4gIHB1dEJsb2Ioc2hhMjU2OiBzdHJpbmcsIGRhdGE6IEJ1ZmZlcik6IFByb21pc2U8Ym9vbGVhbj47XHJcbiAgLyoqIEZldGNoIGFuIGF0dGFjaG1lbnQgYmxvYiwgbnVsbCBpZiBub3QgKHlldCkgcHJlc2VudC4gKi9cclxuICBnZXRCbG9iKHNoYTI1Njogc3RyaW5nKTogUHJvbWlzZTxCdWZmZXIgfCBudWxsPjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZvbGRlclRyYW5zcG9ydCBcdTIwMTQgc2hhcmVkLWZvbGRlciBsYXlvdXQ6XHJcbiAqICAgPHJvb3Q+L29wcy88ZGV2aWNlSWQ+LzAwMDAwMDAwMDAxLmpzb25sICAgb3AgYmF0Y2hlcywgb25lIEpTT04gb3AgcGVyIGxpbmVcclxuICogICA8cm9vdD4vb3BzLzxkZXZpY2VJZD4vZGV2aWNlLmpzb24gICAgICAgICAgcHJlc2VuY2UgKyBpZGVudGl0eVxyXG4gKiAgIDxyb290Pi9ibG9icy88YWE+LzxzaGEyNTY+ICAgICAgICAgICAgICAgICBjb250ZW50LWFkZHJlc3NlZCBhdHRhY2htZW50c1xyXG4gKlxyXG4gKiBDb3JyZWN0bmVzcyBydWxlczpcclxuICogLSBBIGRldmljZSB3cml0ZXMgT05MWSB1bmRlciBpdHMgb3duIG9wcy88ZGV2aWNlSWQ+LyBkaXJlY3RvcnkgXHUyMTkyIG5vIHdyaXRlIGNvbnRlbnRpb24sXHJcbiAqICAgbm8gc2hhcmVkLWZpbGUgbG9ja2luZywgbm8gU1FMaXRlLW92ZXItT25lRHJpdmUgY29ycnVwdGlvbiBjbGFzcy5cclxuICogLSBGaWxlcyBhcmUgd3JpdHRlbiB0byBhIHRlbXAgbmFtZSB0aGVuIHJlbmFtZWQgXHUyMTkyIHJlYWRlcnMgbmV2ZXIgc2VlIHBhcnRpYWwgYmF0Y2hlcy5cclxuICogLSBCYXRjaGVzIGFyZSBpbW11dGFibGUgb25jZSBwdWJsaXNoZWQuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRm9sZGVyVHJhbnNwb3J0IGltcGxlbWVudHMgU3luY1RyYW5zcG9ydCB7XHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByb290OiBzdHJpbmcpIHt9XHJcblxyXG4gIGxvY2F0aW9uKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290O1xyXG4gIH1cclxuXHJcbiAgYXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgZnMubWtkaXJTeW5jKHBhdGguam9pbih0aGlzLnJvb3QsICdvcHMnKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgb3BzRGlyKGRldmljZUlkOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHBhdGguam9pbih0aGlzLnJvb3QsICdvcHMnLCBkZXZpY2VJZCk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBwdWJsaXNoT3BzKGRldmljZUlkOiBzdHJpbmcsIGJhdGNoTmFtZTogc3RyaW5nLCBvcHM6IE9wW10pOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IGRpciA9IHRoaXMub3BzRGlyKGRldmljZUlkKTtcclxuICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgY29uc3QgZmluYWxQYXRoID0gcGF0aC5qb2luKGRpciwgYmF0Y2hOYW1lKTtcclxuICAgIGNvbnN0IHRtcFBhdGggPSBmaW5hbFBhdGggKyAnLnRtcCc7XHJcbiAgICBjb25zdCBsaW5lcyA9IG9wcy5tYXAoKG8pID0+IEpTT04uc3RyaW5naWZ5KG8pKS5qb2luKCdcXG4nKSArICdcXG4nO1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyh0bXBQYXRoLCBsaW5lcywgJ3V0ZjgnKTtcclxuICAgIGZzLnJlbmFtZVN5bmModG1wUGF0aCwgZmluYWxQYXRoKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGxpc3RQZWVyQmF0Y2hlcyhcclxuICAgIG93bkRldmljZUlkOiBzdHJpbmcsXHJcbiAgICBhZnRlckZpbGVCeURldmljZTogTWFwPHN0cmluZywgc3RyaW5nIHwgbnVsbD4sXHJcbiAgKTogUHJvbWlzZTx7IGRldmljZUlkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfVtdPiB7XHJcbiAgICBjb25zdCBvcHNSb290ID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ29wcycpO1xyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKG9wc1Jvb3QpKSByZXR1cm4gW107XHJcbiAgICBjb25zdCBvdXQ6IHsgZGV2aWNlSWQ6IHN0cmluZzsgZmlsZU5hbWU6IHN0cmluZyB9W10gPSBbXTtcclxuICAgIGZvciAoY29uc3QgZGV2IG9mIGZzLnJlYWRkaXJTeW5jKG9wc1Jvb3QsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KSkge1xyXG4gICAgICBpZiAoIWRldi5pc0RpcmVjdG9yeSgpIHx8IGRldi5uYW1lID09PSBvd25EZXZpY2VJZCkgY29udGludWU7XHJcbiAgICAgIGNvbnN0IGFmdGVyID0gYWZ0ZXJGaWxlQnlEZXZpY2UuZ2V0KGRldi5uYW1lKSA/PyBudWxsO1xyXG4gICAgICBjb25zdCBmaWxlcyA9IGZzXHJcbiAgICAgICAgLnJlYWRkaXJTeW5jKHBhdGguam9pbihvcHNSb290LCBkZXYubmFtZSkpXHJcbiAgICAgICAgLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aCgnLmpzb25sJykpXHJcbiAgICAgICAgLnNvcnQoKTtcclxuICAgICAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB7XHJcbiAgICAgICAgaWYgKGFmdGVyICYmIGYgPD0gYWZ0ZXIpIGNvbnRpbnVlO1xyXG4gICAgICAgIG91dC5wdXNoKHsgZGV2aWNlSWQ6IGRldi5uYW1lLCBmaWxlTmFtZTogZiB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG91dDtcclxuICB9XHJcblxyXG4gIGFzeW5jIGZldGNoQmF0Y2goZGV2aWNlSWQ6IHN0cmluZywgZmlsZU5hbWU6IHN0cmluZyk6IFByb21pc2U8T3BbXT4ge1xyXG4gICAgY29uc3QgcCA9IHBhdGguam9pbih0aGlzLm9wc0RpcihkZXZpY2VJZCksIGZpbGVOYW1lKTtcclxuICAgIGNvbnN0IHRleHQgPSBmcy5yZWFkRmlsZVN5bmMocCwgJ3V0ZjgnKTtcclxuICAgIGNvbnN0IG9wczogT3BbXSA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBsaW5lIG9mIHRleHQuc3BsaXQoJ1xcbicpKSB7XHJcbiAgICAgIGNvbnN0IHRyaW1tZWQgPSBsaW5lLnRyaW0oKTtcclxuICAgICAgaWYgKCF0cmltbWVkKSBjb250aW51ZTtcclxuICAgICAgb3BzLnB1c2goSlNPTi5wYXJzZSh0cmltbWVkKSBhcyBPcCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb3BzO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgYW5ub3VuY2UoZGV2aWNlSWQ6IHN0cmluZywgdXNlck5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgZGlyID0gdGhpcy5vcHNEaXIoZGV2aWNlSWQpO1xyXG4gICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICBjb25zdCBwID0gcGF0aC5qb2luKGRpciwgJ2RldmljZS5qc29uJyk7XHJcbiAgICBjb25zdCB0bXAgPSBwICsgJy50bXAnO1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyh0bXAsIEpTT04uc3RyaW5naWZ5KHsgZGV2aWNlSWQsIHVzZXJOYW1lLCBsYXN0U2VlbkF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSksICd1dGY4Jyk7XHJcbiAgICBmcy5yZW5hbWVTeW5jKHRtcCwgcCk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBsaXN0UGVlcnMoKTogUHJvbWlzZTxQZWVySW5mb1tdPiB7XHJcbiAgICBjb25zdCBvcHNSb290ID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ29wcycpO1xyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKG9wc1Jvb3QpKSByZXR1cm4gW107XHJcbiAgICBjb25zdCBwZWVyczogUGVlckluZm9bXSA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBkZXYgb2YgZnMucmVhZGRpclN5bmMob3BzUm9vdCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pKSB7XHJcbiAgICAgIGlmICghZGV2LmlzRGlyZWN0b3J5KCkpIGNvbnRpbnVlO1xyXG4gICAgICBjb25zdCBwID0gcGF0aC5qb2luKG9wc1Jvb3QsIGRldi5uYW1lLCAnZGV2aWNlLmpzb24nKTtcclxuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHApKSB7XHJcbiAgICAgICAgcGVlcnMucHVzaCh7IGRldmljZUlkOiBkZXYubmFtZSwgdXNlck5hbWU6IG51bGwsIGxhc3RTZWVuQXQ6IG51bGwgfSk7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBpbmZvID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocCwgJ3V0ZjgnKSkgYXMgUGVlckluZm87XHJcbiAgICAgICAgcGVlcnMucHVzaCh7IGRldmljZUlkOiBkZXYubmFtZSwgdXNlck5hbWU6IGluZm8udXNlck5hbWUgPz8gbnVsbCwgbGFzdFNlZW5BdDogaW5mby5sYXN0U2VlbkF0ID8/IG51bGwgfSk7XHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIHBlZXJzLnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIHVzZXJOYW1lOiBudWxsLCBsYXN0U2VlbkF0OiBudWxsIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGVlcnM7XHJcbiAgfVxyXG5cclxuICBhc3luYyBwdXRCbG9iKHNoYTI1Njogc3RyaW5nLCBkYXRhOiBCdWZmZXIpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIGNvbnN0IGRpciA9IHBhdGguam9pbih0aGlzLnJvb3QsICdibG9icycsIHNoYTI1Ni5zbGljZSgwLCAyKSk7XHJcbiAgICBjb25zdCBwID0gcGF0aC5qb2luKGRpciwgc2hhMjU2KTtcclxuICAgIGlmIChmcy5leGlzdHNTeW5jKHApKSByZXR1cm4gZmFsc2U7XHJcbiAgICBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICAgIGNvbnN0IHRtcCA9IHAgKyAnLnRtcC0nICsgcHJvY2Vzcy5waWQ7XHJcbiAgICBmcy53cml0ZUZpbGVTeW5jKHRtcCwgZGF0YSk7XHJcbiAgICB0cnkge1xyXG4gICAgICBmcy5yZW5hbWVTeW5jKHRtcCwgcCk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgZnMucm1TeW5jKHRtcCwgeyBmb3JjZTogdHJ1ZSB9KTsgLy8gcGVlciB3b24gdGhlIHJhY2U7IGNvbnRlbnQtYWRkcmVzc2VkIHNvIGlkZW50aWNhbFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXRCbG9iKHNoYTI1Njogc3RyaW5nKTogUHJvbWlzZTxCdWZmZXIgfCBudWxsPiB7XHJcbiAgICBjb25zdCBwID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ2Jsb2JzJywgc2hhMjU2LnNsaWNlKDAsIDIpLCBzaGEyNTYpO1xyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKHApKSByZXR1cm4gbnVsbDtcclxuICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMocCk7XHJcbiAgfVxyXG59XHJcbiIsICIvLyBTeW5jRW5naW5lOiBwZXJpb2RpYyArIGV2ZW50LWRyaXZlbiBleHBvcnQvaW1wb3J0IGxvb3Agb3ZlciBhIFN5bmNUcmFuc3BvcnQuXHJcbi8vIExvY2FsLWZpcnN0OiB0aGUgYXBwIGlzIGZ1bGx5IHVzYWJsZSB3aXRoIHN5bmMgZGlzYWJsZWQgb3IgdGhlIGZvbGRlciBvZmZsaW5lO1xyXG4vLyBvcHMgcXVldWUgaW4gdGhlIG9wbG9nIGFuZCBmbHVzaCB3aGVuIHRoZSB0cmFuc3BvcnQgcmV0dXJucy5cclxuXHJcbmltcG9ydCB0eXBlIHsgU3RvcmUgfSBmcm9tICcuLi9kYi9zdG9yZSc7XHJcbmltcG9ydCB7IGdldE1ldGEsIHNldE1ldGEgfSBmcm9tICcuLi9kYi9kYic7XHJcbmltcG9ydCB0eXBlIHsgU3luY1RyYW5zcG9ydCB9IGZyb20gJy4vdHJhbnNwb3J0JztcclxuaW1wb3J0IHR5cGUgeyBTeW5jU3RhdHVzLCBTeW5jU3RhdHVzU3RhdGUgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xyXG5cclxuY29uc3QgRVhQT1JUX0RFQk9VTkNFX01TID0gMV81MDA7XHJcbmNvbnN0IFBPTExfSU5URVJWQUxfTVMgPSA1XzAwMDtcclxuXHJcbmV4cG9ydCBjbGFzcyBTeW5jRW5naW5lIHtcclxuICBwcml2YXRlIHRyYW5zcG9ydDogU3luY1RyYW5zcG9ydCB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgdGltZXI6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSBleHBvcnRUaW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIHJ1bm5pbmcgPSBmYWxzZTtcclxuICBwcml2YXRlIGN1cnJlbnQ6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKTtcclxuICBwcml2YXRlIHN0YXRlOiBTeW5jU3RhdHVzU3RhdGUgPSAnZGlzYWJsZWQnO1xyXG4gIHByaXZhdGUgbGFzdEVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIGxhc3RTeW5jQXQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgdXNlck5hbWU6IHN0cmluZztcclxuICBwcml2YXRlIG9uU3RhdHVzOiAoczogU3luY1N0YXR1cykgPT4gdm9pZDtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIHN0b3JlOiBTdG9yZSxcclxuICAgIHVzZXJOYW1lOiBzdHJpbmcsXHJcbiAgICBvblN0YXR1czogKHM6IFN5bmNTdGF0dXMpID0+IHZvaWQsXHJcbiAgKSB7XHJcbiAgICB0aGlzLnVzZXJOYW1lID0gdXNlck5hbWU7XHJcbiAgICB0aGlzLm9uU3RhdHVzID0gb25TdGF0dXM7XHJcbiAgfVxyXG5cclxuICBzZXRUcmFuc3BvcnQodHJhbnNwb3J0OiBTeW5jVHJhbnNwb3J0IHwgbnVsbCk6IHZvaWQge1xyXG4gICAgdGhpcy50cmFuc3BvcnQgPSB0cmFuc3BvcnQ7XHJcbiAgICBpZiAodGhpcy50aW1lcikgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVyKTtcclxuICAgIHRoaXMudGltZXIgPSBudWxsO1xyXG4gICAgaWYgKHRyYW5zcG9ydCkge1xyXG4gICAgICAvLyBTeW5jIGN1cnNvcnMgYmVsb25nIHRvIGEgc3BlY2lmaWMgZm9sZGVyLiBQb2ludGluZyBhdCBhIGRpZmZlcmVudCBmb2xkZXJcclxuICAgICAgLy8gbXVzdCByZS1wdWJsaXNoIGV2ZXJ5dGhpbmcgKG9wLWlkIGRlZHVwIG1ha2VzIHRoYXQgc2FmZSkgYW5kIHJlLWltcG9ydFxyXG4gICAgICAvLyBwZWVycyBmcm9tIHNjcmF0Y2ggXHUyMDE0IG90aGVyd2lzZSB0aGUgbmV3IGZvbGRlciBnZXRzIGEgcGVybWFuZW50bHlcclxuICAgICAgLy8gaW5jb21wbGV0ZSBkYXRhc2V0LlxyXG4gICAgICBjb25zdCBmb2xkZXJLZXkgPSB0cmFuc3BvcnQubG9jYXRpb24oKTtcclxuICAgICAgY29uc3Qga25vd25Gb2xkZXIgPSBnZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdzeW5jX2ZvbGRlcl9rZXknKTtcclxuICAgICAgaWYgKGtub3duRm9sZGVyICE9PSBmb2xkZXJLZXkpIHtcclxuICAgICAgICBzZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdsYXN0X2V4cG9ydGVkX3NlcScsICcwJyk7XHJcbiAgICAgICAgdGhpcy5zdG9yZS5kYi5wcmVwYXJlKCdERUxFVEUgRlJPTSBzeW5jX3BlZXJzJykucnVuKCk7XHJcbiAgICAgICAgc2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnc3luY19mb2xkZXJfa2V5JywgZm9sZGVyS2V5KTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnN0YXRlID0gJ2lkbGUnO1xyXG4gICAgICB0aGlzLnRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4gdm9pZCB0aGlzLmN5Y2xlKCksIFBPTExfSU5URVJWQUxfTVMpO1xyXG4gICAgICB2b2lkIHRoaXMuY3ljbGUoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuc3RhdGUgPSAnZGlzYWJsZWQnO1xyXG4gICAgICB0aGlzLmVtaXRTdGF0dXMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKiBVcGRhdGUgdGhlIGFubm91bmNlZCBkaXNwbGF5IG5hbWUgKGlkZW50aXR5IGNhbiBiZSBzZXQgYWZ0ZXIgYm9vdCkuICovXHJcbiAgc2V0VXNlck5hbWUobmFtZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICB0aGlzLnVzZXJOYW1lID0gbmFtZTtcclxuICB9XHJcblxyXG4gIC8qKiBDYWxsIGFmdGVyIGFueSBsb2NhbCBtdXRhdGlvbiBcdTIwMTQgZGVib3VuY2VkIGV4cG9ydCBzbyByYXBpZCBlZGl0cyBiYXRjaC4gKi9cclxuICBub3RlTG9jYWxDaGFuZ2UoKTogdm9pZCB7XHJcbiAgICBpZiAoIXRoaXMudHJhbnNwb3J0KSByZXR1cm47XHJcbiAgICBpZiAodGhpcy5leHBvcnRUaW1lcikgY2xlYXJUaW1lb3V0KHRoaXMuZXhwb3J0VGltZXIpO1xyXG4gICAgdGhpcy5leHBvcnRUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gdm9pZCB0aGlzLmN5Y2xlKCksIEVYUE9SVF9ERUJPVU5DRV9NUyk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBjeWNsZSgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICghdGhpcy50cmFuc3BvcnQgfHwgdGhpcy5ydW5uaW5nKSByZXR1cm4gdGhpcy5jdXJyZW50O1xyXG4gICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcclxuICAgIGxldCByZWxlYXNlITogKCkgPT4gdm9pZDtcclxuICAgIHRoaXMuY3VycmVudCA9IG5ldyBQcm9taXNlKChyKSA9PiAocmVsZWFzZSA9IHIpKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGlmICghdGhpcy50cmFuc3BvcnQuYXZhaWxhYmxlKCkpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKCdvZmZsaW5lJywgJ1N5bmMgZm9sZGVyIGlzIG5vdCByZWFjaGFibGUnKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5zZXRTdGF0ZSgnc3luY2luZycsIG51bGwpO1xyXG4gICAgICBhd2FpdCB0aGlzLmV4cG9ydE9wcygpO1xyXG4gICAgICBhd2FpdCB0aGlzLmltcG9ydE9wcygpO1xyXG4gICAgICBhd2FpdCB0aGlzLnRyYW5zcG9ydC5hbm5vdW5jZSh0aGlzLnN0b3JlLmRldmljZUlkLCB0aGlzLnVzZXJOYW1lKTtcclxuICAgICAgdGhpcy5sYXN0U3luY0F0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xyXG4gICAgICB0aGlzLnNldFN0YXRlKCdpZGxlJywgbnVsbCk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSgnZXJyb3InLCBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycikpO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XHJcbiAgICAgIHJlbGVhc2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgZXhwb3J0T3BzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgaWYgKCF0aGlzLnRyYW5zcG9ydCkgcmV0dXJuO1xyXG4gICAgY29uc3QgbGFzdEV4cG9ydGVkID0gTnVtYmVyKGdldE1ldGEodGhpcy5zdG9yZS5kYiwgJ2xhc3RfZXhwb3J0ZWRfc2VxJykgPz8gJzAnKTtcclxuICAgIGNvbnN0IHBlbmRpbmcgPSB0aGlzLnN0b3JlLm9wc1NpbmNlKGxhc3RFeHBvcnRlZCwgdHJ1ZSk7XHJcbiAgICBpZiAocGVuZGluZy5sZW5ndGggPT09IDApIHJldHVybjtcclxuICAgIGNvbnN0IG1heFNlcSA9IHBlbmRpbmdbcGVuZGluZy5sZW5ndGggLSAxXS5zZXE7XHJcbiAgICBjb25zdCBiYXRjaE5hbWUgPSBTdHJpbmcobWF4U2VxKS5wYWRTdGFydCgxMiwgJzAnKSArICcuanNvbmwnO1xyXG4gICAgYXdhaXQgdGhpcy50cmFuc3BvcnQucHVibGlzaE9wcyhcclxuICAgICAgdGhpcy5zdG9yZS5kZXZpY2VJZCxcclxuICAgICAgYmF0Y2hOYW1lLFxyXG4gICAgICBwZW5kaW5nLm1hcCgocCkgPT4gcC5vcCksXHJcbiAgICApO1xyXG4gICAgc2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnbGFzdF9leHBvcnRlZF9zZXEnLCBTdHJpbmcobWF4U2VxKSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGltcG9ydE9wcygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICghdGhpcy50cmFuc3BvcnQpIHJldHVybjtcclxuICAgIGNvbnN0IHBlZXJzID0gdGhpcy5zdG9yZS5kYlxyXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIGRldmljZV9pZCwgbGFzdF9maWxlIEZST00gc3luY19wZWVycycpXHJcbiAgICAgIC5hbGwoKSBhcyB7IGRldmljZV9pZDogc3RyaW5nOyBsYXN0X2ZpbGU6IHN0cmluZyB8IG51bGwgfVtdO1xyXG4gICAgY29uc3QgYWZ0ZXJCeURldmljZSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmcgfCBudWxsPihwZWVycy5tYXAoKHApID0+IFtwLmRldmljZV9pZCwgcC5sYXN0X2ZpbGVdKSk7XHJcblxyXG4gICAgY29uc3QgYmF0Y2hlcyA9IGF3YWl0IHRoaXMudHJhbnNwb3J0Lmxpc3RQZWVyQmF0Y2hlcyh0aGlzLnN0b3JlLmRldmljZUlkLCBhZnRlckJ5RGV2aWNlKTtcclxuICAgIC8vIEJhdGNoZXMgbXVzdCBhcHBseSBzdHJpY3RseSBpbiBmaWxlbmFtZSBvcmRlciBwZXIgZGV2aWNlLiBJZiBvbmUgZmlsZSBpc1xyXG4gICAgLy8gdW5yZWFkYWJsZSAoZS5nLiBzdGlsbCBzeW5jaW5nIGRvd24pLCBTVE9QIHRoYXQgZGV2aWNlIGZvciB0aGlzIGN5Y2xlIFx1MjAxNFxyXG4gICAgLy8gYWR2YW5jaW5nIHBhc3QgaXQgd291bGQgcGVybWFuZW50bHkgc2tpcCBpdHMgb3BzLlxyXG4gICAgY29uc3Qgc3RhbGxlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG4gICAgZm9yIChjb25zdCBiIG9mIGJhdGNoZXMpIHtcclxuICAgICAgaWYgKHN0YWxsZWQuaGFzKGIuZGV2aWNlSWQpKSBjb250aW51ZTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBvcHMgPSBhd2FpdCB0aGlzLnRyYW5zcG9ydC5mZXRjaEJhdGNoKGIuZGV2aWNlSWQsIGIuZmlsZU5hbWUpO1xyXG4gICAgICAgIHRoaXMuc3RvcmUuYXBwbHlSZW1vdGVPcHMob3BzKTtcclxuICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgc3RhbGxlZC5hZGQoYi5kZXZpY2VJZCk7IC8vIHJldHJ5IGZyb20gdGhpcyBmaWxlIG5leHQgY3ljbGU7IGN1cnNvciB1bnRvdWNoZWRcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnN0b3JlLmRiXHJcbiAgICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgICBgSU5TRVJUIElOVE8gc3luY19wZWVycyhkZXZpY2VfaWQsIGxhc3RfZmlsZSwgbGFzdF9zZWVuX2F0KSBWQUxVRVMoPyw/LD8pXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoZGV2aWNlX2lkKSBETyBVUERBVEUgU0VUIGxhc3RfZmlsZT1leGNsdWRlZC5sYXN0X2ZpbGUsIGxhc3Rfc2Vlbl9hdD1leGNsdWRlZC5sYXN0X3NlZW5fYXRgLFxyXG4gICAgICAgIClcclxuICAgICAgICAucnVuKGIuZGV2aWNlSWQsIGIuZmlsZU5hbWUsIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVmcmVzaCBwZWVyIGRpc3BsYXkgbmFtZXMgZnJvbSBhbm5vdW5jZW1lbnRzLlxyXG4gICAgZm9yIChjb25zdCBwIG9mIGF3YWl0IHRoaXMudHJhbnNwb3J0Lmxpc3RQZWVycygpKSB7XHJcbiAgICAgIGlmIChwLmRldmljZUlkID09PSB0aGlzLnN0b3JlLmRldmljZUlkKSBjb250aW51ZTtcclxuICAgICAgdGhpcy5zdG9yZS5kYlxyXG4gICAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgICAgYElOU0VSVCBJTlRPIHN5bmNfcGVlcnMoZGV2aWNlX2lkLCB1c2VyX25hbWUsIGxhc3Rfc2Vlbl9hdCkgVkFMVUVTKD8sPyw/KVxyXG4gICAgICAgICAgIE9OIENPTkZMSUNUKGRldmljZV9pZCkgRE8gVVBEQVRFIFNFVCB1c2VyX25hbWU9Q09BTEVTQ0UoZXhjbHVkZWQudXNlcl9uYW1lLCBzeW5jX3BlZXJzLnVzZXJfbmFtZSksXHJcbiAgICAgICAgICAgICBsYXN0X3NlZW5fYXQ9Q09BTEVTQ0UoZXhjbHVkZWQubGFzdF9zZWVuX2F0LCBzeW5jX3BlZXJzLmxhc3Rfc2Vlbl9hdClgLFxyXG4gICAgICAgIClcclxuICAgICAgICAucnVuKHAuZGV2aWNlSWQsIHAudXNlck5hbWUsIHAubGFzdFNlZW5BdCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldFN0YXRlKHN0YXRlOiBTeW5jU3RhdHVzU3RhdGUsIGVycm9yOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XHJcbiAgICB0aGlzLnN0YXRlID0gc3RhdGU7XHJcbiAgICB0aGlzLmxhc3RFcnJvciA9IGVycm9yO1xyXG4gICAgdGhpcy5lbWl0U3RhdHVzKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGVtaXRTdGF0dXMoKTogdm9pZCB7XHJcbiAgICB0aGlzLm9uU3RhdHVzKHRoaXMuc3RhdHVzKCkpO1xyXG4gIH1cclxuXHJcbiAgc3RhdHVzKCk6IFN5bmNTdGF0dXMge1xyXG4gICAgY29uc3QgbGFzdEV4cG9ydGVkID0gTnVtYmVyKGdldE1ldGEodGhpcy5zdG9yZS5kYiwgJ2xhc3RfZXhwb3J0ZWRfc2VxJykgPz8gJzAnKTtcclxuICAgIGNvbnN0IHBlbmRpbmdSb3cgPSB0aGlzLnN0b3JlLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgQ09VTlQoKikgQVMgYyBGUk9NIG9wbG9nIFdIRVJFIHNlcSA+ID8gQU5EIGRldmljZV9pZCA9ID8nKVxyXG4gICAgICAuZ2V0KGxhc3RFeHBvcnRlZCwgdGhpcy5zdG9yZS5kZXZpY2VJZCkgYXMgeyBjOiBudW1iZXIgfTtcclxuICAgIGNvbnN0IGNvbmZsaWN0Um93ID0gdGhpcy5zdG9yZS5kYlxyXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIENPVU5UKCopIEFTIGMgRlJPTSBzeW5jX2NvbmZsaWN0cyBXSEVSRSByZXNvbHZlZF9hdCBJUyBOVUxMJylcclxuICAgICAgLmdldCgpIGFzIHsgYzogbnVtYmVyIH07XHJcbiAgICBjb25zdCBwZWVycyA9IHRoaXMuc3RvcmUuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBkZXZpY2VfaWQgQVMgZGV2aWNlSWQsIHVzZXJfbmFtZSBBUyB1c2VyTmFtZSwgbGFzdF9zZWVuX2F0IEFTIGxhc3RTZWVuQXQgRlJPTSBzeW5jX3BlZXJzJylcclxuICAgICAgLmFsbCgpIGFzIFN5bmNTdGF0dXNbJ3BlZXJzJ107XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdGF0ZTogdGhpcy5zdGF0ZSxcclxuICAgICAgZm9sZGVyOiB0aGlzLnRyYW5zcG9ydCA/IHRoaXMudHJhbnNwb3J0LmxvY2F0aW9uKCkgOiBudWxsLFxyXG4gICAgICBsYXN0U3luY0F0OiB0aGlzLmxhc3RTeW5jQXQsXHJcbiAgICAgIGxhc3RFcnJvcjogdGhpcy5sYXN0RXJyb3IsXHJcbiAgICAgIHBlbmRpbmdPcHM6IHBlbmRpbmdSb3cuYyxcclxuICAgICAgb3BlbkNvbmZsaWN0czogY29uZmxpY3RSb3cuYyxcclxuICAgICAgcGVlcnMsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqIFN0b3BzIHRpbWVycyBhbmQgd2FpdHMgZm9yIGFueSBpbi1mbGlnaHQgY3ljbGUgXHUyMDE0IHNhZmUgdG8gY2xvc2UgdGhlIERCIGFmdGVyd2FyZHMuICovXHJcbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICh0aGlzLnRpbWVyKSBjbGVhckludGVydmFsKHRoaXMudGltZXIpO1xyXG4gICAgaWYgKHRoaXMuZXhwb3J0VGltZXIpIGNsZWFyVGltZW91dCh0aGlzLmV4cG9ydFRpbWVyKTtcclxuICAgIHRoaXMudGltZXIgPSBudWxsO1xyXG4gICAgdGhpcy5leHBvcnRUaW1lciA9IG51bGw7XHJcbiAgICBhd2FpdCB0aGlzLmN1cnJlbnQ7XHJcbiAgfVxyXG59XHJcbiIsICIvLyBTYW1wbGUgU3VwcG9ydCBBSSBwcm9qZWN0IGRhdGEuIEV2ZXJ5IHJlY29yZCBjYXJyaWVzIHNhbXBsZT0xIGFuZCBhIFtTQU1QTEVdIHRpdGxlXHJcbi8vIG1hcmtlciBjb252ZW50aW9uIGlzIE5PVCB1c2VkIFx1MjAxNCB0aGUgc2FtcGxlIGZsYWcgZHJpdmVzIGJhZGdlcyArIG9uZS1jbGljayByZW1vdmFsLlxyXG4vLyBObyByZWFsIGNvbmZpZGVudGlhbCBkYXRhOiBuYW1lcyBvZiBzeXN0ZW1zIGFyZSBnZW5lcmljLCBjb250ZW50cyBhcmUgaWxsdXN0cmF0aXZlLlxyXG5cclxuaW1wb3J0IHR5cGUgeyBTdG9yZSB9IGZyb20gJy4vc3RvcmUnO1xyXG5pbXBvcnQgdHlwZSB7IEl0ZW1UeXBlLCBQcmlvcml0eSB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XHJcblxyXG5pbnRlcmZhY2UgU2VlZEl0ZW0ge1xyXG4gIHR5cGU6IEl0ZW1UeXBlO1xyXG4gIHRpdGxlOiBzdHJpbmc7XHJcbiAgYm9keVRleHQ/OiBzdHJpbmc7XHJcbiAgc3RhdHVzPzogc3RyaW5nO1xyXG4gIHByaW9yaXR5PzogUHJpb3JpdHk7XHJcbiAgb3duZXI/OiAnam9obicgfCAnbWFyaycgfCBudWxsO1xyXG4gIGR1ZURhdGU/OiBzdHJpbmc7XHJcbiAgdGFncz86IHN0cmluZ1tdO1xyXG4gIGV4dHJhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcbiAgbWlsZXN0b25lPzogc3RyaW5nO1xyXG4gIGxlYWRlcnNoaXBWaXNpYmxlPzogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRTZWVkRGF0YShzdG9yZTogU3RvcmUpOiBudW1iZXIge1xyXG4gIC8vIFByb2JlIGRpcmVjdGx5IChsaXN0SXRlbXMgaGlkZXMgYXJjaGl2ZWQgcm93cyBcdTIwMTQgYXJjaGl2ZWQgc2FtcGxlcyBtdXN0IHN0aWxsIGJsb2NrIGEgcmVsb2FkKS5cclxuICBjb25zdCBleGlzdGluZyA9IHN0b3JlLmRiLnByZXBhcmUoJ1NFTEVDVCAxIEZST00gaXRlbXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCBMSU1JVCAxJykuZ2V0KCk7XHJcbiAgaWYgKGV4aXN0aW5nKSByZXR1cm4gMDsgLy8gYWxyZWFkeSBsb2FkZWRcclxuXHJcbiAgY29uc3QgbTEgPSBzdG9yZS51cHNlcnRNaWxlc3RvbmUoeyBuYW1lOiAnRGlzY292ZXJ5ICYgQWNjZXNzJywgdGFyZ2V0RGF0ZTogJzIwMjYtMDgtMTUnLCBzdGF0dXM6ICdhY3RpdmUnLCBzb3J0OiAxLCBzYW1wbGU6IDEsIGRlc2NyaXB0aW9uOiAnU2VjdXJlIHN5c3RlbSBhY2Nlc3MsIGludmVudG9yeSBrbm93bGVkZ2Ugc291cmNlcywgY29uZmlybSBzY29wZSB3aXRoIGxlYWRlcnNoaXAuJyB9KTtcclxuICBjb25zdCBtMiA9IHN0b3JlLnVwc2VydE1pbGVzdG9uZSh7IG5hbWU6ICdLbm93bGVkZ2UgUGlwZWxpbmUgTVZQJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTAtMDEnLCBzdGF0dXM6ICdwbGFubmVkJywgc29ydDogMiwgc2FtcGxlOiAxLCBkZXNjcmlwdGlvbjogJ0luZ2VzdCwgY2xlYW4sIGFuZCBpbmRleCB0aGUgZmlyc3Qga25vd2xlZGdlIGRvbWFpbiBlbmQgdG8gZW5kLicgfSk7XHJcbiAgY29uc3QgbTMgPSBzdG9yZS51cHNlcnRNaWxlc3RvbmUoeyBuYW1lOiAnUGlsb3Qgd2l0aCBTdXBwb3J0IFRlYW0nLCB0YXJnZXREYXRlOiAnMjAyNi0xMi0wMScsIHN0YXR1czogJ3BsYW5uZWQnLCBzb3J0OiAzLCBzYW1wbGU6IDEsIGRlc2NyaXB0aW9uOiAnTGltaXRlZCBwaWxvdDogbWVhc3VyZSBkZWZsZWN0aW9uLCBhY2N1cmFjeSwgYW5kIGFnZW50IHNhdGlzZmFjdGlvbi4nIH0pO1xyXG4gIHN0b3JlLnVwc2VydFJlbGVhc2UoeyBuYW1lOiAnU3VwcG9ydCBBSSBQaWxvdCAwLjEnLCB2ZXJzaW9uOiAnMC4xJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTEtMTUnLCBzdGF0dXM6ICdwbGFubmVkJywgZ29hbHM6ICdGaXJzdCBpbnRlcm5hbCBwaWxvdCBidWlsZDogc2luZ2xlIGtub3dsZWRnZSBkb21haW4sIDEwIHN1cHBvcnQgYWdlbnRzLCBmZWVkYmFjayBsb29wIGluIHBsYWNlLicsIHNhbXBsZTogMSB9KTtcclxuXHJcbiAgY29uc3QgbWlsZXN0b25lSWQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7IG0xOiBtMS5pZCwgbTI6IG0yLmlkLCBtMzogbTMuaWQgfTtcclxuXHJcbiAgY29uc3QgaXRlbXM6IChTZWVkSXRlbSAmIHsga2V5OiBzdHJpbmcgfSlbXSA9IFtcclxuICAgIC8vIEZlYXR1cmVzXHJcbiAgICB7IGtleTogJ2ZlYXRBbnN3ZXInLCB0eXBlOiAnZmVhdHVyZScsIHRpdGxlOiAnQUkgYW5zd2VyIGdlbmVyYXRpb24gb3ZlciBrbm93bGVkZ2UgYmFzZScsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTInLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgYm9keVRleHQ6ICdDb3JlIGNhcGFiaWxpdHk6IGdpdmVuIGEgc3VwcG9ydCBxdWVzdGlvbiwgcmV0cmlldmUgcmVsZXZhbnQga25vd2xlZGdlIGFydGljbGVzIGFuZCBnZW5lcmF0ZSBhIGdyb3VuZGVkLCBjaXRlZCBhbnN3ZXIuJyB9LFxyXG4gICAgeyBrZXk6ICdmZWF0SW5nZXN0JywgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0tub3dsZWRnZSBpbmdlc3Rpb24gcGlwZWxpbmUgKFNhbGVzZm9yY2UgS0EgZXhwb3J0KScsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBib2R5VGV4dDogJ0V4cG9ydCBrbm93bGVkZ2UgYXJ0aWNsZXMsIG5vcm1hbGl6ZSB0byBjbGVhbiB0ZXh0LCBjaHVuaywgYW5kIGluZGV4IGZvciByZXRyaWV2YWwuJyB9LFxyXG4gICAgeyBrZXk6ICdmZWF0RmVlZGJhY2snLCB0eXBlOiAnZmVhdHVyZScsIHRpdGxlOiAnQWdlbnQgZmVlZGJhY2sgY2FwdHVyZSAodGh1bWJzICsgcmVhc29uIGNvZGVzKScsIHN0YXR1czogJ2JhY2tsb2cnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnbWFyaycsIG1pbGVzdG9uZTogJ20zJywgYm9keVRleHQ6ICdQaWxvdCBhZ2VudHMgcmF0ZSBlYWNoIEFJIGFuc3dlcjsgcmVhc29ucyBmZWVkIHRoZSBxdWFsaXR5IGRhc2hib2FyZC4nIH0sXHJcblxyXG4gICAgLy8gUmVxdWlyZW1lbnRzXHJcbiAgICB7IGtleTogJ3JlcUNpdGF0aW9ucycsIHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnRXZlcnkgQUkgYW5zd2VyIG11c3QgY2l0ZSBpdHMgc291cmNlIGFydGljbGVzJywgc3RhdHVzOiAndG9kbycsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgZXh0cmE6IHsgYWNjZXB0YW5jZUNyaXRlcmlhOiAnQW5zd2VyIFVJIHNob3dzIGF0IGxlYXN0IG9uZSBzb3VyY2UgbGluayBwZXIgYW5zd2VyOyB1bmNpdGVkIGFuc3dlcnMgYXJlIHN1cHByZXNzZWQuJywgc2VjdXJpdHlDb25zaWRlcmF0aW9uczogJ0NpdGF0aW9ucyBtdXN0IG5vdCBleHBvc2UgcmVzdHJpY3RlZCBhcnRpY2xlcyB0byB1bmF1dGhvcml6ZWQgYWdlbnRzLicgfSB9LFxyXG4gICAgeyBrZXk6ICdyZXFQSEknLCB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ05vIFBISSBvciBjdXN0b21lciBkYXRhIG1heSBsZWF2ZSBhcHByb3ZlZCBzeXN0ZW1zJywgc3RhdHVzOiAnaW5fcHJvZ3Jlc3MnLCBwcmlvcml0eTogJ3VyZ2VudCcsIG93bmVyOiAnbWFyaycsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBhY2NlcHRhbmNlQ3JpdGVyaWE6ICdEYXRhIGZsb3cgZGlhZ3JhbSBhcHByb3ZlZCBieSBzZWN1cml0eTsgRExQIHNjYW4gb2YgcGlwZWxpbmUgb3V0cHV0IHNob3dzIHplcm8gUEhJLicsIHNlY3VyaXR5Q29uc2lkZXJhdGlvbnM6ICdCbG9ja2luZyByZXF1aXJlbWVudCBmb3IgYW55IGV4dGVybmFsIEFJIHNlcnZpY2UuJyB9IH0sXHJcbiAgICB7IGtleTogJ3JlcUZyZXNobmVzcycsIHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnS25vd2xlZGdlIGluZGV4IHJlZnJlc2hlcyB3aXRoaW4gMjRoIG9mIGFydGljbGUgdXBkYXRlcycsIHN0YXR1czogJ2JhY2tsb2cnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgZXh0cmE6IHsgYWNjZXB0YW5jZUNyaXRlcmlhOiAnQXJ0aWNsZSBlZGl0ZWQgaW4gc291cmNlIHN5c3RlbSBhcHBlYXJzIGluIHJldHJpZXZhbCByZXN1bHRzIHdpdGhpbiAyNCBob3Vycy4nIH0gfSxcclxuXHJcbiAgICAvLyBUYXNrc1xyXG4gICAgeyBrZXk6ICd0YXNrRXhwb3J0JywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0J1aWxkIFNhbGVzZm9yY2Uga25vd2xlZGdlIGFydGljbGUgZXhwb3J0IHNjcmlwdCcsIHN0YXR1czogJ2RvbmUnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMScsIGJvZHlUZXh0OiAnRXhwb3J0IGFsbCBwdWJsaXNoZWQgS0FzIHdpdGggbWV0YWRhdGEgdG8gc3RydWN0dXJlZCBmaWxlcy4nIH0sXHJcbiAgICB7IGtleTogJ3Rhc2tDbGVhbicsIHR5cGU6ICd0YXNrJywgdGl0bGU6ICdIVE1MXHUyMTkyY2xlYW4gdGV4dCBub3JtYWxpemF0aW9uIGZvciBleHBvcnRlZCBhcnRpY2xlcycsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTInLCBkdWVEYXRlOiAnMjAyNi0wNy0yNCcgfSxcclxuICAgIHsga2V5OiAndGFza0V2YWwnLCB0eXBlOiAndGFzaycsIHRpdGxlOiAnRHJhZnQgYW5zd2VyLXF1YWxpdHkgZXZhbHVhdGlvbiBydWJyaWMnLCBzdGF0dXM6ICd0b2RvJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcjogJ21hcmsnLCBtaWxlc3RvbmU6ICdtMicsIGR1ZURhdGU6ICcyMDI2LTA3LTMxJyB9LFxyXG4gICAgeyBrZXk6ICd0YXNrSW52ZW50b3J5JywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0ludmVudG9yeSBjYW5kaWRhdGUga25vd2xlZGdlIGRvbWFpbnMgYW5kIGFydGljbGUgY291bnRzJywgc3RhdHVzOiAnZG9uZScsIHByaW9yaXR5OiAnbWVkaXVtJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTEnIH0sXHJcblxyXG4gICAgLy8gQWNjZXNzIHJlcXVlc3RzXHJcbiAgICB7IGtleTogJ2FjY1NmQXBpJywgdHlwZTogJ2FjY2VzcycsIHRpdGxlOiAnU2FsZXNmb3JjZSBBUEkgYWNjZXNzIChLbm93bGVkZ2Ugb2JqZWN0LCByZWFkKScsIHN0YXR1czogJ3JlcXVlc3RlZCcsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdqb2huJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IHN5c3RlbTogJ1NhbGVzZm9yY2UgU2VydmljZSBDbG91ZCcsIGFjY2Vzc1R5cGU6ICdBUEkgcmVhZCAoS25vd2xlZGdlIG9iamVjdCknLCBidXNpbmVzc1JlYXNvbjogJ0F1dG9tYXRlZCBleHBvcnQgb2Yga25vd2xlZGdlIGFydGljbGVzIGZvciB0aGUgaW5nZXN0aW9uIHBpcGVsaW5lLicsIHJlcXVlc3RlZEZyb206ICdTYWxlc2ZvcmNlIHBsYXRmb3JtIHRlYW0nLCByZXF1ZXN0RGF0ZTogJzIwMjYtMDYtMzAnLCBuZXh0QWN0aW9uOiAnRm9sbG93IHVwIHdpdGggcGxhdGZvcm0gdGVhbSBsZWFkJywgZm9sbG93VXBEYXRlOiAnMjAyNi0wNy0xNScgfSB9LFxyXG4gICAgeyBrZXk6ICdhY2NBenVyZScsIHR5cGU6ICdhY2Nlc3MnLCB0aXRsZTogJ0F6dXJlIE9wZW5BSSBzZXJ2aWNlIHByb3Zpc2lvbmluZyBpbiBNY0tlc3NvbiB0ZW5hbnQnLCBzdGF0dXM6ICd1bmRlcl9yZXZpZXcnLCBwcmlvcml0eTogJ3VyZ2VudCcsIG93bmVyOiAnbWFyaycsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBzeXN0ZW06ICdBenVyZSBPcGVuQUkgKE1jS2Vzc29uIHRlbmFudCknLCBhY2Nlc3NUeXBlOiAnUmVzb3VyY2UgcHJvdmlzaW9uaW5nICsgQVBJIGtleXMnLCBidXNpbmVzc1JlYXNvbjogJ0FwcHJvdmVkLXRlbmFudCBMTE0gcmVxdWlyZWQgZm9yIGFuc3dlciBnZW5lcmF0aW9uIHdpdGhvdXQgZGF0YSBlZ3Jlc3MuJywgcmVxdWVzdGVkRnJvbTogJ0Nsb3VkIHBsYXRmb3JtIC8gc2VjdXJpdHknLCByZXF1ZXN0RGF0ZTogJzIwMjYtMDYtMjInLCBuZXh0QWN0aW9uOiAnU2VjdXJpdHkgcmV2aWV3IG1lZXRpbmcnLCBmb2xsb3dVcERhdGU6ICcyMDI2LTA3LTE4JyB9IH0sXHJcbiAgICB7IGtleTogJ2FjY1NwJywgdHlwZTogJ2FjY2VzcycsIHRpdGxlOiAnU2hhcmVQb2ludCBzaXRlIGZvciBwaWxvdCBkb2N1bWVudGF0aW9uJywgc3RhdHVzOiAnZ3JhbnRlZCcsIHByaW9yaXR5OiAnbG93Jywgb3duZXI6ICdtYXJrJywgZXh0cmE6IHsgc3lzdGVtOiAnU2hhcmVQb2ludCBPbmxpbmUnLCBhY2Nlc3NUeXBlOiAnU2l0ZSBvd25lcicsIGJ1c2luZXNzUmVhc29uOiAnU2hhcmVkIGRvY3VtZW50YXRpb24gYW5kIHBpbG90IGFydGlmYWN0cy4nLCByZXF1ZXN0ZWRGcm9tOiAnSVQgc2VydmljZSBkZXNrJywgcmVxdWVzdERhdGU6ICcyMDI2LTA2LTEwJywgYXBwcm92ZWRCeTogJ0lUIHNlcnZpY2UgZGVzaycsIGRhdGVHcmFudGVkOiAnMjAyNi0wNi0xMicgfSB9LFxyXG5cclxuICAgIC8vIERlY2lzaW9uc1xyXG4gICAgeyBrZXk6ICdkZWNUZW5hbnQnLCB0eXBlOiAnZGVjaXNpb24nLCB0aXRsZTogJ1VzZSB0ZW5hbnQtaG9zdGVkIEF6dXJlIE9wZW5BSSwgbm90IHB1YmxpYyBBUElzJywgc3RhdHVzOiAnYXBwcm92ZWQnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgY29udGV4dDogJ0Fuc3dlciBnZW5lcmF0aW9uIG5lZWRzIGFuIExMTS4gUHVibGljIEFJIEFQSXMgYXJlIHVuYXBwcm92ZWQgZm9yIGludGVybmFsIGRhdGEuJywgcHJvYmxlbTogJ1doaWNoIExMTSBob3N0aW5nIHBhdGggc2F0aXNmaWVzIHNlY3VyaXR5IHdoaWxlIHVuYmxvY2tpbmcgdGhlIHBpbG90PycsIG9wdGlvbnM6IFt7IHRpdGxlOiAnUHVibGljIEFQSSAoT3BlbkFJL0FudGhyb3BpYyBkaXJlY3QpJywgbm90ZXM6ICdGYXN0IGJ1dCB1bmFwcHJvdmVkIGZvciBpbnRlcm5hbCBkYXRhJywgc2VsZWN0ZWQ6IGZhbHNlIH0sIHsgdGl0bGU6ICdBenVyZSBPcGVuQUkgaW4gTWNLZXNzb24gdGVuYW50Jywgbm90ZXM6ICdEYXRhIHN0YXlzIGluIHRlbmFudDsgcHJvY3VyZW1lbnQgKyBwcm92aXNpb25pbmcgcmVxdWlyZWQnLCBzZWxlY3RlZDogdHJ1ZSB9LCB7IHRpdGxlOiAnTG9jYWwgb3Blbi13ZWlnaHRzIG1vZGVsJywgbm90ZXM6ICdObyBlZ3Jlc3MgYnV0IHdlYWtlciBxdWFsaXR5IGFuZCBoZWF2eSBpbmZyYScsIHNlbGVjdGVkOiBmYWxzZSB9XSwgcmVhc29uaW5nOiAnVGVuYW50IGhvc3Rpbmcga2VlcHMgZGF0YSBpbnNpZGUgYXBwcm92ZWQgYm91bmRhcnkgYW5kIGhhcyBhbiBleGlzdGluZyBlbnRlcnByaXNlIGFncmVlbWVudCBwYXRoLicsIHRyYWRlb2ZmczogJ1Nsb3dlciBzdGFydDsgY2FwYWNpdHkgcXVvdGFzOyBtb2RlbCBhdmFpbGFiaWxpdHkgbGFncyBwdWJsaWMgQVBJcy4nIH0gfSxcclxuICAgIHsga2V5OiAnZGVjRG9tYWluJywgdHlwZTogJ2RlY2lzaW9uJywgdGl0bGU6ICdQaWxvdCBzY29wZTogc3RhcnQgd2l0aCBvbmUgaGlnaC12b2x1bWUga25vd2xlZGdlIGRvbWFpbicsIHN0YXR1czogJ2Rpc2N1c3NpbmcnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIGV4dHJhOiB7IGNvbnRleHQ6ICdLbm93bGVkZ2UgYmFzZSBzcGFucyBtYW55IHByb2R1Y3QgYXJlYXMgd2l0aCB1bmV2ZW4gcXVhbGl0eS4nLCBwcm9ibGVtOiAnUGlsb3QgZXZlcnl0aGluZyBvciBvbmUgZG9tYWluIGZpcnN0PycsIG9wdGlvbnM6IFt7IHRpdGxlOiAnU2luZ2xlIGRvbWFpbiBwaWxvdCcsIG5vdGVzOiAnQ2xlYW5lciBtZWFzdXJlbWVudCwgZmFzdGVyIGl0ZXJhdGlvbicsIHNlbGVjdGVkOiB0cnVlIH0sIHsgdGl0bGU6ICdBbGwgZG9tYWlucyBhdCBvbmNlJywgbm90ZXM6ICdCcm9hZGVyIGltcGFjdCwgZGlsdXRlZCBxdWFsaXR5IHNpZ25hbCcsIHNlbGVjdGVkOiBmYWxzZSB9XSwgcmVhc29uaW5nOiAnU2luZ2xlLWRvbWFpbiBnaXZlcyBhIGNsZWFuIGFjY3VyYWN5IGJhc2VsaW5lIGFuZCBjb250YWluYWJsZSByZXZpZXcgbG9hZC4nIH0gfSxcclxuXHJcbiAgICAvLyBSaXNrc1xyXG4gICAgeyBrZXk6ICdyaXNrUXVhbGl0eScsIHR5cGU6ICdyaXNrJywgdGl0bGU6ICdLbm93bGVkZ2UgYXJ0aWNsZSBxdWFsaXR5IHRvbyBsb3cgZm9yIGdyb3VuZGVkIGFuc3dlcnMnLCBzdGF0dXM6ICdvcGVuJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IGxpa2VsaWhvb2Q6ICdtZWRpdW0nLCBpbXBhY3Q6ICdoaWdoJywgbWl0aWdhdGlvbjogJ1F1YWxpdHkgYXVkaXQgb2YgdGhlIHBpbG90IGRvbWFpbiBiZWZvcmUgaW5kZXhpbmc7IGFydGljbGUgY2xlYW51cCBiYWNrbG9nIHdpdGggdGhlIGtub3dsZWRnZSB0ZWFtLicgfSB9LFxyXG4gICAgeyBrZXk6ICdyaXNrQWNjZXNzJywgdHlwZTogJ3Jpc2snLCB0aXRsZTogJ0FjY2VzcyBhcHByb3ZhbHMgc2xpcCBhbmQgc3RhbGwgdGhlIHBpcGVsaW5lIGJ1aWxkJywgc3RhdHVzOiAnbWl0aWdhdGluZycsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnbWFyaycsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBsaWtlbGlob29kOiAnaGlnaCcsIGltcGFjdDogJ2hpZ2gnLCBtaXRpZ2F0aW9uOiAnV2Vla2x5IGZvbGxvdy11cHM7IGxlYWRlcnNoaXAgZXNjYWxhdGlvbiBwYXRoIGFncmVlZDsgYnVpbGQgcGlwZWxpbmUgYWdhaW5zdCBleHBvcnRlZCBzYW1wbGUgZGF0YSBtZWFud2hpbGUuJyB9IH0sXHJcblxyXG4gICAgLy8gQmxvY2tlcnNcclxuICAgIHsga2V5OiAnYmxrQXp1cmUnLCB0eXBlOiAnYmxvY2tlcicsIHRpdGxlOiAnQ2Fubm90IGdlbmVyYXRlIGFuc3dlcnMgdW50aWwgQXp1cmUgT3BlbkFJIGlzIHByb3Zpc2lvbmVkJywgc3RhdHVzOiAnYWN0aXZlJywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgd2FpdGluZ09uOiAnQ2xvdWQgcGxhdGZvcm0gdGVhbSAvIHNlY3VyaXR5IHJldmlldycsIHNpbmNlOiAnMjAyNi0wNi0yMicgfSB9LFxyXG5cclxuICAgIC8vIE1lZXRpbmdcclxuICAgIHsga2V5OiAnbXRnS2lja29mZicsIHR5cGU6ICdtZWV0aW5nJywgdGl0bGU6ICdTdXBwb3J0IEFJIGtpY2tvZmYgd2l0aCBrbm93bGVkZ2UgbGVhZGVyc2hpcCcsIHN0YXR1czogJ3N1bW1hcml6ZWQnLCBvd25lcjogJ2pvaG4nLCBleHRyYTogeyBkYXRlOiAnMjAyNi0wNi0xOCcsIHRpbWU6ICcxMDowMCBBTScsIGF0dGVuZGVlczogWydKb2huJywgJ01hcmsnLCAnQWxsZW4nLCAnR2VvcmdlJ10sIHB1cnBvc2U6ICdBbGlnbiBvbiBwaWxvdCBzY29wZSwgYWNjZXNzIG5lZWRzLCBhbmQgc3VjY2VzcyBtZWFzdXJlcy4nLCBhZ2VuZGE6ICcxLiBWaXNpb24gIDIuIFBpbG90IHNjb3BlICAzLiBBY2Nlc3MgcmVxdWVzdHMgIDQuIFRpbWVsaW5lJyB9LCBib2R5VGV4dDogJ0FncmVlZCB0byBzaW5nbGUtZG9tYWluIHBpbG90LiBBbGxlbiB0byBzcG9uc29yIGFjY2VzcyByZXF1ZXN0cy4gU3VjY2VzcyA9IGRlZmxlY3Rpb24gcmF0ZSArIGFnZW50IHNhdGlzZmFjdGlvbi4gTmV4dCBjaGVjay1pbiBpbiA0IHdlZWtzLicgfSxcclxuXHJcbiAgICAvLyBRdWVzdGlvbnMgLyBpZGVhcyAvIHJlc2VhcmNoXHJcbiAgICB7IGtleTogJ3FNZXRyaWNzJywgdHlwZTogJ3F1ZXN0aW9uJywgdGl0bGU6ICdXaGljaCBkZWZsZWN0aW9uIG1ldHJpYyBkb2VzIHN1cHBvcnQgbGVhZGVyc2hpcCBhbHJlYWR5IHRydXN0PycsIHN0YXR1czogJ29wZW4nLCBvd25lcjogJ21hcmsnLCBleHRyYToge30gfSxcclxuICAgIHsga2V5OiAnaWRlYVRyaWFnZScsIHR5cGU6ICdpZGVhJywgdGl0bGU6ICdBdXRvLXRyaWFnZSBpbmJvdW5kIGNhc2VzIGJ5IGtub3dsZWRnZSBjb3ZlcmFnZScsIHN0YXR1czogJ2JhY2tsb2cnLCBvd25lcjogJ2pvaG4nLCBib2R5VGV4dDogJ0lmIHJldHJpZXZhbCBjb25maWRlbmNlIGlzIGhpZ2gsIHN1Z2dlc3QgS0ItZmlyc3QgcmVzcG9uc2UgYmVmb3JlIGh1bWFuIHRyaWFnZS4nIH0sXHJcbiAgICB7IGtleTogJ3Jlc1JhZycsIHR5cGU6ICdyZXNlYXJjaCcsIHRpdGxlOiAnUmV0cmlldmFsIHN0cmF0ZWd5IGNvbXBhcmlzb246IGh5YnJpZCB2cyBwdXJlIHZlY3RvcicsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgb3duZXI6ICdqb2huJywgYm9keVRleHQ6ICdFYXJseSByZXN1bHQ6IGh5YnJpZCAoQk0yNSArIHZlY3Rvcikgbm90aWNlYWJseSBiZXR0ZXIgb24gcHJvZHVjdC1jb2RlIHF1ZXJpZXMuJyB9LFxyXG4gIF07XHJcblxyXG4gIGNvbnN0IGNyZWF0ZWQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xyXG4gIGZvciAoY29uc3QgcyBvZiBpdGVtcykge1xyXG4gICAgY29uc3QgaXRlbSA9IHN0b3JlLmNyZWF0ZUl0ZW0oe1xyXG4gICAgICB0eXBlOiBzLnR5cGUsXHJcbiAgICAgIHRpdGxlOiBzLnRpdGxlLFxyXG4gICAgICBzdGF0dXM6IHMuc3RhdHVzLFxyXG4gICAgICBwcmlvcml0eTogcy5wcmlvcml0eSA/PyAnbm9uZScsXHJcbiAgICAgIG93bmVySWQ6IHMub3duZXIgPz8gbnVsbCxcclxuICAgICAgbWlsZXN0b25lSWQ6IHMubWlsZXN0b25lID8gbWlsZXN0b25lSWRbcy5taWxlc3RvbmVdIDogbnVsbCxcclxuICAgICAgZHVlRGF0ZTogcy5kdWVEYXRlID8/IG51bGwsXHJcbiAgICAgIHRhZ3M6IHMudGFncyA/PyBbXSxcclxuICAgICAgZXh0cmE6IHMuZXh0cmEgPz8ge30sXHJcbiAgICAgIGxlYWRlcnNoaXBWaXNpYmxlOiBzLmxlYWRlcnNoaXBWaXNpYmxlID8gMSA6IDAsXHJcbiAgICAgIGJvZHlUZXh0OiBzLmJvZHlUZXh0ID8/ICcnLFxyXG4gICAgICBib2R5OiBzLmJvZHlUZXh0ID8gdGV4dERvYyhzLmJvZHlUZXh0KSA6ICcnLFxyXG4gICAgICBzYW1wbGU6IDEsXHJcbiAgICB9KTtcclxuICAgIGNyZWF0ZWQuc2V0KHMua2V5LCBpdGVtLmlkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxpbmsgPSAoYTogc3RyaW5nLCBiOiBzdHJpbmcsIGtpbmQ6IFBhcmFtZXRlcnM8U3RvcmVbJ2FkZExpbmsnXT5bMl0pID0+IHtcclxuICAgIGNvbnN0IGZyb21JZCA9IGNyZWF0ZWQuZ2V0KGEpO1xyXG4gICAgY29uc3QgdG9JZCA9IGNyZWF0ZWQuZ2V0KGIpO1xyXG4gICAgaWYgKGZyb21JZCAmJiB0b0lkKSBzdG9yZS5hZGRMaW5rKGZyb21JZCwgdG9JZCwga2luZCk7XHJcbiAgfTtcclxuXHJcbiAgbGluaygndGFza0NsZWFuJywgJ2ZlYXRJbmdlc3QnLCAnaW1wbGVtZW50cycpO1xyXG4gIGxpbmsoJ3Rhc2tFeHBvcnQnLCAnZmVhdEluZ2VzdCcsICdpbXBsZW1lbnRzJyk7XHJcbiAgbGluaygncmVxQ2l0YXRpb25zJywgJ2ZlYXRBbnN3ZXInLCAnc3VwcG9ydHMnKTtcclxuICBsaW5rKCdyZXFQSEknLCAnZmVhdEFuc3dlcicsICdzdXBwb3J0cycpO1xyXG4gIGxpbmsoJ3JlcUZyZXNobmVzcycsICdmZWF0SW5nZXN0JywgJ3N1cHBvcnRzJyk7XHJcbiAgbGluaygnZmVhdEFuc3dlcicsICdkZWNUZW5hbnQnLCAnc2hhcGVkX2J5Jyk7XHJcbiAgbGluaygnZmVhdEFuc3dlcicsICdhY2NBenVyZScsICdyZXF1aXJlc19hY2Nlc3MnKTtcclxuICBsaW5rKCdmZWF0SW5nZXN0JywgJ2FjY1NmQXBpJywgJ3JlcXVpcmVzX2FjY2VzcycpO1xyXG4gIGxpbmsoJ2Jsa0F6dXJlJywgJ2ZlYXRBbnN3ZXInLCAnYmxvY2tzJyk7XHJcbiAgbGluaygnZGVjRG9tYWluJywgJ210Z0tpY2tvZmYnLCAnZGlzY3Vzc2VkX2luJyk7XHJcbiAgbGluaygncmlza0FjY2VzcycsICdhY2NBenVyZScsICdyZWxhdGVzJyk7XHJcblxyXG4gIHJldHVybiBpdGVtcy5sZW5ndGg7XHJcbn1cclxuXHJcbi8qKiBNaW5pbWFsIHJpY2gtZG9jIHdyYXBwZXIgZm9yIHNlZWQgYm9keSB0ZXh0IChvbmUgcGFyYWdyYXBoKS4gKi9cclxuZnVuY3Rpb24gdGV4dERvYyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh7IHR5cGU6ICdkb2MnLCBjb250ZW50OiBbeyB0eXBlOiAncGFyYWdyYXBoJywgY29udGVudDogW3sgdHlwZTogJ3RleHQnLCB0ZXh0IH1dIH1dIH0pO1xyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSx1QkFBcUI7QUFDckIsb0JBQW1CO0FBQ25CLElBQUFBLGtCQUFlO0FBQ2YsSUFBQUMsb0JBQWlCO0FBQ2pCLHFCQUFlOzs7QUNSZiw0QkFBcUI7QUFDckIsdUJBQWlCO0FBQ2pCLHFCQUFlO0FBQ2YseUJBQW1COzs7QUNNWixJQUFNLGFBQTBCO0FBQUEsRUFDckM7QUFBQSxJQUNFLFNBQVM7QUFBQSxJQUNULE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7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QUFHLEdBQUcsTUFBTTtBQUMzQixnQkFBQUEsUUFBTyxVQUFVLEVBQUUsTUFBTSxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsS0FBSyxHQUFHLENBQUMsV0FBVyxNQUFNLENBQUM7QUFDakYsZ0JBQUFBLFFBQU8sVUFBVSxFQUFFLE1BQU0sVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEtBQUssR0FBRyxDQUFDLFdBQVcsTUFBTSxDQUFDO0FBR2pGLFFBQU0sTUFBTSxFQUFFLElBQUksR0FBRyxRQUFRLDRDQUE0QyxFQUFFLElBQUksTUFBTTtBQUNyRixnQkFBQUEsUUFBTyxNQUFNLElBQUksU0FBUyxDQUFDO0FBQzNCLGdCQUFBQSxRQUFPLE1BQU0sSUFBSSxNQUFNLGVBQWU7QUFHdEMsSUFBRSxNQUFNLFdBQVcsRUFBRSxJQUFJLFFBQVEsTUFBTSxpQkFBaUIsVUFBVSxNQUFNLE9BQU8sVUFBVSxDQUFDO0FBQzFGLGdCQUFBQSxRQUFPLEdBQUcsRUFBRSxNQUFNLFVBQVUsRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sTUFBTSxDQUFDO0FBQzFELFFBQU0sU0FBUyxHQUFHLEdBQUcsTUFBTTtBQUMzQixnQkFBQUEsUUFBTyxHQUFHLEVBQUUsTUFBTSxVQUFVLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxPQUFPLE1BQU0sR0FBRyxxQkFBcUI7QUFFakYsSUFBRSxJQUFJLEdBQUcsTUFBTTtBQUNmLElBQUUsSUFBSSxHQUFHLE1BQU07QUFDakIsQ0FBQzsiLAogICJuYW1lcyI6IFsiaW1wb3J0X25vZGVfZnMiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJmcyIsICJwYXRoIiwgIkRhdGFiYXNlIiwgImNyeXB0byIsICJwYXRoIiwgImZzIiwgImltcG9ydF9ub2RlX2NyeXB0byIsICJjcnlwdG8iLCAiaXRlbSIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImZzIiwgInBhdGgiLCAidG1wIiwgImZzIiwgInBhdGgiLCAib3MiLCAiYXNzZXJ0Il0KfQo=
