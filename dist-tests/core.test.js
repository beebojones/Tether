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
        `INSERT INTO users(id, name, initials, color, created_at) VALUES(?,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, initials=excluded.initials, color=excluded.color`
      ).run(user.id, user.name, user.initials, user.color, user.createdAt);
      if (!existing) this.localCreate("user", user.id, { ...user });
      else this.localSet("user", user.id, { name: user.name, initials: user.initials, color: user.color });
    });
    tx();
    return user;
  }
  listUsers() {
    return this.db.prepare("SELECT id, name, initials, color, avatar, created_at AS createdAt FROM users").all();
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
        this.db.prepare("INSERT OR IGNORE INTO users(id, name, initials, color, avatar, created_at) VALUES(?,?,?,?,?,?)").run(r.id, r.name, r.initials, r.color, r.avatar ?? null, r.createdAt);
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
      user: { name: "name", initials: "initials", color: "color", avatar: "avatar" },
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vdGVzdHMvY29yZS50ZXN0LnRzIiwgIi4uL2VsZWN0cm9uL2RiL2RiLnRzIiwgIi4uL2VsZWN0cm9uL2RiL21pZ3JhdGlvbnMudHMiLCAiLi4vZWxlY3Ryb24vZGIvc3RvcmUudHMiLCAiLi4vc2hhcmVkL3R5cGVzLnRzIiwgIi4uL3NoYXJlZC9kb2MudHMiLCAiLi4vZWxlY3Ryb24vc3luYy90cmFuc3BvcnQudHMiLCAiLi4vZWxlY3Ryb24vc3luYy9lbmdpbmUudHMiLCAiLi4vZWxlY3Ryb24vZGIvc2VlZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gQ29yZSBkYXRhLWxheWVyICsgc3luYyB0ZXN0cy4gUnVuIHdpdGg6IG5wbSB0ZXN0XHJcbi8vIChidW5kbGVkIGJ5IHNjcmlwdHMvcnVuLXRlc3RzLm1qcyBhbmQgZXhlY3V0ZWQgdW5kZXIgRWxlY3Ryb24ncyBOb2RlIHZpYSBFTEVDVFJPTl9SVU5fQVNfTk9ERVxyXG4vLyAgc28gYmV0dGVyLXNxbGl0ZTMncyBFbGVjdHJvbi1BQkkgYnVpbGQgbG9hZHMuKVxyXG5cclxuaW1wb3J0IHsgdGVzdCB9IGZyb20gJ25vZGU6dGVzdCc7XHJcbmltcG9ydCBhc3NlcnQgZnJvbSAnbm9kZTphc3NlcnQvc3RyaWN0JztcclxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xyXG5pbXBvcnQgb3MgZnJvbSAnbm9kZTpvcyc7XHJcbmltcG9ydCB7IG9wZW5EYXRhYmFzZSwgdHlwZSBEYkNvbnRleHQgfSBmcm9tICcuLi9lbGVjdHJvbi9kYi9kYic7XHJcbmltcG9ydCB7IFN0b3JlIH0gZnJvbSAnLi4vZWxlY3Ryb24vZGIvc3RvcmUnO1xyXG5pbXBvcnQgeyBGb2xkZXJUcmFuc3BvcnQgfSBmcm9tICcuLi9lbGVjdHJvbi9zeW5jL3RyYW5zcG9ydCc7XHJcbmltcG9ydCB7IFN5bmNFbmdpbmUgfSBmcm9tICcuLi9lbGVjdHJvbi9zeW5jL2VuZ2luZSc7XHJcbmltcG9ydCB7IGxvYWRTZWVkRGF0YSB9IGZyb20gJy4uL2VsZWN0cm9uL2RiL3NlZWQnO1xyXG5cclxuZnVuY3Rpb24gdG1wKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgY29uc3QgcCA9IGZzLm1rZHRlbXBTeW5jKHBhdGguam9pbihvcy50bXBkaXIoKSwgYHRldGhlci0ke25hbWV9LWApKTtcclxuICByZXR1cm4gcDtcclxufVxyXG5cclxuZnVuY3Rpb24gbWtTdG9yZShuYW1lOiBzdHJpbmcsIGFjdG9yOiBzdHJpbmcpOiB7IGN0eDogRGJDb250ZXh0OyBzdG9yZTogU3RvcmUgfSB7XHJcbiAgY29uc3QgY3R4ID0gb3BlbkRhdGFiYXNlKHRtcChuYW1lKSk7XHJcbiAgY29uc3Qgc3RvcmUgPSBuZXcgU3RvcmUoY3R4LCBhY3Rvcik7XHJcbiAgcmV0dXJuIHsgY3R4LCBzdG9yZSB9O1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzeW5jQm90aChhOiB7IHN0b3JlOiBTdG9yZSB9LCBiOiB7IHN0b3JlOiBTdG9yZSB9LCBmb2xkZXI6IHN0cmluZywgdXNlckEgPSAnSm9obicsIHVzZXJCID0gJ01hcmsnKSB7XHJcbiAgY29uc3QgZWEgPSBuZXcgU3luY0VuZ2luZShhLnN0b3JlLCB1c2VyQSwgKCkgPT4ge30pO1xyXG4gIGNvbnN0IGViID0gbmV3IFN5bmNFbmdpbmUoYi5zdG9yZSwgdXNlckIsICgpID0+IHt9KTtcclxuICBlYS5zZXRUcmFuc3BvcnQobmV3IEZvbGRlclRyYW5zcG9ydChmb2xkZXIpKTtcclxuICBlYi5zZXRUcmFuc3BvcnQobmV3IEZvbGRlclRyYW5zcG9ydChmb2xkZXIpKTtcclxuICAvLyBUd28gY3ljbGVzIGVhY2ggc28gcmVudW1iZXItcmVicm9hZGNhc3RzIGFuZCBjcm9zcy1pbXBvcnRzIHNldHRsZS5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xyXG4gICAgYXdhaXQgZWEuY3ljbGUoKTtcclxuICAgIGF3YWl0IGViLmN5Y2xlKCk7XHJcbiAgfVxyXG4gIGF3YWl0IGVhLnN0b3AoKTtcclxuICBhd2FpdCBlYi5zdG9wKCk7XHJcbn1cclxuXHJcbnRlc3QoJ21pZ3JhdGlvbnMgY3JlYXRlIHNjaGVtYSBhbmQgZGV2aWNlIGlkZW50aXR5JywgKCkgPT4ge1xyXG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgnbWlnJywgJ2pvaG4nKTtcclxuICBhc3NlcnQub2soY3R4LmRldmljZUlkLmxlbmd0aCA+IDEwKTtcclxuICBhc3NlcnQuZXF1YWwoc3RvcmUubGlzdEl0ZW1zKCkubGVuZ3RoLCAwKTtcclxuICBjdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdpdGVtIENSVUQsIGlkZW50IGFsbG9jYXRpb24sIGFjdGl2aXR5LCBzZWFyY2gnLCAoKSA9PiB7XHJcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdjcnVkJywgJ2pvaG4nKTtcclxuICBjb25zdCBpdGVtID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnQW5zd2VycyBtdXN0IGNpdGUgc291cmNlcycgfSk7XHJcbiAgYXNzZXJ0LmVxdWFsKGl0ZW0uaWRlbnQsICdSRVEtMScpO1xyXG4gIGFzc2VydC5lcXVhbChpdGVtLnN0YXR1cywgJ2JhY2tsb2cnKTtcclxuXHJcbiAgY29uc3Qgc2Vjb25kID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnQW5vdGhlciByZXF1aXJlbWVudCcgfSk7XHJcbiAgYXNzZXJ0LmVxdWFsKHNlY29uZC5pZGVudCwgJ1JFUS0yJyk7XHJcblxyXG4gIHN0b3JlLnVwZGF0ZUl0ZW0oaXRlbS5pZCwgeyBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAnaGlnaCcgfSk7XHJcbiAgY29uc3QgZ290ID0gc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSE7XHJcbiAgYXNzZXJ0LmVxdWFsKGdvdC5zdGF0dXMsICdpbl9wcm9ncmVzcycpO1xyXG4gIGFzc2VydC5lcXVhbChnb3QucHJpb3JpdHksICdoaWdoJyk7XHJcblxyXG4gIC8vIGRvbmUgXHUyMTkyIGNvbXBsZXRlZEF0IHNldFxyXG4gIHN0b3JlLnVwZGF0ZUl0ZW0oaXRlbS5pZCwgeyBzdGF0dXM6ICdkb25lJyB9KTtcclxuICBhc3NlcnQub2soc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEuY29tcGxldGVkQXQpO1xyXG5cclxuICAvLyBzZWFyY2ggaGl0cyB0aXRsZVxyXG4gIGNvbnN0IHJlc3VsdHMgPSBzdG9yZS5zZWFyY2goJ2NpdGUgc291cmNlcycpO1xyXG4gIGFzc2VydC5vayhyZXN1bHRzLnNvbWUoKHIpID0+IHIuaXRlbS5pZCA9PT0gaXRlbS5pZCkpO1xyXG5cclxuICAvLyBieSBpZGVudFxyXG4gIGFzc2VydC5lcXVhbChzdG9yZS5nZXRJdGVtQnlJZGVudCgncmVxLTEnKSEuaWQsIGl0ZW0uaWQpO1xyXG5cclxuICBjb25zdCBhY3Rpdml0eSA9IHN0b3JlLmFjdGl2aXR5Rm9yKGl0ZW0uaWQpIGFzIHsga2luZDogc3RyaW5nIH1bXTtcclxuICBhc3NlcnQub2soYWN0aXZpdHkuc29tZSgoYSkgPT4gYS5raW5kID09PSAnY3JlYXRlZCcpKTtcclxuICBhc3NlcnQub2soYWN0aXZpdHkuc29tZSgoYSkgPT4gYS5raW5kID09PSAndXBkYXRlZCcpKTtcclxuXHJcbiAgLy8gZGVsZXRlIGhpZGVzIGZyb20gcXVlcmllc1xyXG4gIHN0b3JlLmRlbGV0ZUl0ZW0oc2Vjb25kLmlkKTtcclxuICBhc3NlcnQuZXF1YWwoc3RvcmUuZ2V0SXRlbShzZWNvbmQuaWQpLCBudWxsKTtcclxuICBjdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdsaW5rcywgY29tbWVudHMsIHZlcnNpb25zJywgKCkgPT4ge1xyXG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgncmVsJywgJ2pvaG4nKTtcclxuICBjb25zdCBhID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdCdWlsZCBleHBvcnQnIH0pO1xyXG4gIGNvbnN0IGIgPSBzdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0luZ2VzdGlvbiBwaXBlbGluZScgfSk7XHJcbiAgc3RvcmUuYWRkTGluayhhLmlkLCBiLmlkLCAnaW1wbGVtZW50cycpO1xyXG4gIGNvbnN0IGxpbmtzID0gc3RvcmUubGlua3NGb3IoYS5pZCk7XHJcbiAgYXNzZXJ0LmVxdWFsKGxpbmtzLmxlbmd0aCwgMSk7XHJcbiAgYXNzZXJ0LmVxdWFsKGxpbmtzWzBdLm90aGVyLmlkLCBiLmlkKTtcclxuICBhc3NlcnQuZXF1YWwobGlua3NbMF0uZGlyZWN0aW9uLCAnb3V0Jyk7XHJcblxyXG4gIHN0b3JlLmFkZENvbW1lbnQoYS5pZCwgJ3tcInR5cGVcIjpcImRvY1wifScsICdsb29rcyBnb29kJyk7XHJcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmNvbW1lbnRzRm9yKGEuaWQpLmxlbmd0aCwgMSk7XHJcblxyXG4gIHN0b3JlLnNhdmVWZXJzaW9uKGEuaWQpO1xyXG4gIHN0b3JlLnVwZGF0ZUl0ZW0oYS5pZCwgeyB0aXRsZTogJ0J1aWxkIGV4cG9ydCB2MicgfSk7XHJcbiAgY29uc3QgdmVyc2lvbnMgPSBzdG9yZS52ZXJzaW9uc0ZvcihhLmlkKSBhcyB7IHRpdGxlOiBzdHJpbmcgfVtdO1xyXG4gIGFzc2VydC5lcXVhbCh2ZXJzaW9ucy5sZW5ndGgsIDEpO1xyXG4gIGFzc2VydC5lcXVhbCh2ZXJzaW9uc1swXS50aXRsZSwgJ0J1aWxkIGV4cG9ydCcpO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuXHJcbnRlc3QoJ3N5bmM6IHR3byBkZXZpY2VzIGNvbnZlcmdlIHRocm91Z2ggYSBzaGFyZWQgZm9sZGVyJywgYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnN0IGEgPSBta1N0b3JlKCdzeW5jQScsICdqb2huJyk7XHJcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ3N5bmNCJywgJ21hcmsnKTtcclxuICBjb25zdCBmb2xkZXIgPSB0bXAoJ3NoYXJlZCcpO1xyXG5cclxuICBjb25zdCBpdGVtQSA9IGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdGcm9tIEpvaG4nIH0pO1xyXG4gIGNvbnN0IGl0ZW1CID0gYi5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ2RlY2lzaW9uJywgdGl0bGU6ICdGcm9tIE1hcmsnIH0pO1xyXG5cclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xyXG5cclxuICBhc3NlcnQub2soYi5zdG9yZS5nZXRJdGVtKGl0ZW1BLmlkKSwgJ0IgcmVjZWl2ZWQgQSBpdGVtJyk7XHJcbiAgYXNzZXJ0Lm9rKGEuc3RvcmUuZ2V0SXRlbShpdGVtQi5pZCksICdBIHJlY2VpdmVkIEIgaXRlbScpO1xyXG4gIGFzc2VydC5lcXVhbChiLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpIS50aXRsZSwgJ0Zyb20gSm9obicpO1xyXG5cclxuICAvLyBFZGl0IG9uIEIgcHJvcGFnYXRlcyB0byBBXHJcbiAgYi5zdG9yZS51cGRhdGVJdGVtKGl0ZW1BLmlkLCB7IHN0YXR1czogJ2luX3Byb2dyZXNzJyB9KTtcclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xyXG4gIGFzc2VydC5lcXVhbChhLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpIS5zdGF0dXMsICdpbl9wcm9ncmVzcycpO1xyXG5cclxuICBhLmN0eC5kYi5jbG9zZSgpO1xyXG4gIGIuY3R4LmRiLmNsb3NlKCk7XHJcbn0pO1xyXG5cclxudGVzdCgnc3luYzogY29uY3VycmVudCB0aXRsZSBlZGl0cyBzdXJmYWNlIGEgY29uZmxpY3QsIExXVyBhcHBsaWVzLCByZXNvbHV0aW9uIGNvbnZlcmdlcycsIGFzeW5jICgpID0+IHtcclxuICBjb25zdCBhID0gbWtTdG9yZSgnY29uZkEnLCAnam9obicpO1xyXG4gIGNvbnN0IGIgPSBta1N0b3JlKCdjb25mQicsICdtYXJrJyk7XHJcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRjJyk7XHJcblxyXG4gIGNvbnN0IGl0ZW0gPSBhLnN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnT3JpZ2luYWwnIH0pO1xyXG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XHJcbiAgYXNzZXJ0Lm9rKGIuc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSk7XHJcblxyXG4gIC8vIEJvdGggZWRpdCB0aGUgdGl0bGUgd2hpbGUgXCJvZmZsaW5lXCIgKG5vIHN5bmMgYmV0d2VlbiBlZGl0cykuXHJcbiAgYS5zdG9yZS51cGRhdGVJdGVtKGl0ZW0uaWQsIHsgdGl0bGU6ICdKb2huIHZlcnNpb24nIH0pO1xyXG4gIGIuc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHRpdGxlOiAnTWFyayB2ZXJzaW9uJyB9KTtcclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xyXG5cclxuICAvLyBCb3RoIHNpZGVzIHNob3cgdGhlIHNhbWUgTFdXIHdpbm5lci5cclxuICBjb25zdCB0YSA9IGEuc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEudGl0bGU7XHJcbiAgY29uc3QgdGIgPSBiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlO1xyXG4gIGFzc2VydC5lcXVhbCh0YSwgdGIsICdMV1cgY29udmVyZ2VkJyk7XHJcblxyXG4gIC8vIEF0IGxlYXN0IG9uZSBzaWRlIHJlY29yZGVkIGEgY29uZmxpY3QgZm9yIHJldmlldy5cclxuICBjb25zdCBjb25mbGljdHMgPSBbLi4uYS5zdG9yZS5saXN0Q29uZmxpY3RzKHRydWUpLCAuLi5iLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSldO1xyXG4gIGFzc2VydC5vayhjb25mbGljdHMubGVuZ3RoID49IDEsICdjb25mbGljdCBzdXJmYWNlZCcpO1xyXG4gIGFzc2VydC5vayhjb25mbGljdHMuc29tZSgoYykgPT4gYy5maWVsZCA9PT0gJ3RpdGxlJykpO1xyXG5cclxuICAvLyBSZXNvbHZpbmcgd2l0aCBhIG1lcmdlZCB2YWx1ZSBwcm9wYWdhdGVzLlxyXG4gIGNvbnN0IHNpZGUgPSBhLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSkubGVuZ3RoID8gYSA6IGI7XHJcbiAgY29uc3QgY29uZmxpY3QgPSBzaWRlLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSlbMF07XHJcbiAgc2lkZS5zdG9yZS5yZXNvbHZlQ29uZmxpY3QoY29uZmxpY3QuaWQsICdtZXJnZWQnLCAnTWVyZ2VkIHRpdGxlJyk7XHJcbiAgYXdhaXQgc3luY0JvdGgoYSwgYiwgZm9sZGVyKTtcclxuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW0uaWQpIS50aXRsZSwgJ01lcmdlZCB0aXRsZScpO1xyXG4gIGFzc2VydC5lcXVhbChiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlLCAnTWVyZ2VkIHRpdGxlJyk7XHJcblxyXG4gIGEuY3R4LmRiLmNsb3NlKCk7XHJcbiAgYi5jdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdzeW5jOiBpZGVudCBjb2xsaXNpb24gcmVudW1iZXJzIGFuZCBjb252ZXJnZXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ2lkQScsICdqb2huJyk7XHJcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ2lkQicsICdtYXJrJyk7XHJcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRpJyk7XHJcblxyXG4gIC8vIEJvdGggY3JlYXRlIFRBU0stMSBvZmZsaW5lLlxyXG4gIGNvbnN0IGlhID0gYS5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0EgdGFzaycgfSk7XHJcbiAgY29uc3QgaWIgPSBiLnN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnQiB0YXNrJyB9KTtcclxuICBhc3NlcnQuZXF1YWwoaWEuaWRlbnQsICdUQVNLLTEnKTtcclxuICBhc3NlcnQuZXF1YWwoaWIuaWRlbnQsICdUQVNLLTEnKTtcclxuXHJcbiAgYXdhaXQgc3luY0JvdGgoYSwgYiwgZm9sZGVyKTtcclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpOyAvLyBleHRyYSByb3VuZHMgdG8gc2V0dGxlIHJlbnVtYmVyIGJyb2FkY2FzdHNcclxuXHJcbiAgY29uc3QgYUlkZW50cyA9IFthLnN0b3JlLmdldEl0ZW0oaWEuaWQpIS5pZGVudCwgYS5zdG9yZS5nZXRJdGVtKGliLmlkKSEuaWRlbnRdLnNvcnQoKTtcclxuICBjb25zdCBiSWRlbnRzID0gW2Iuc3RvcmUuZ2V0SXRlbShpYS5pZCkhLmlkZW50LCBiLnN0b3JlLmdldEl0ZW0oaWIuaWQpIS5pZGVudF0uc29ydCgpO1xyXG4gIGFzc2VydC5ub3RFcXVhbChhSWRlbnRzWzBdLCBhSWRlbnRzWzFdLCAnaWRlbnRzIHVuaXF1ZSBvbiBBJyk7XHJcbiAgYXNzZXJ0Lm5vdEVxdWFsKGJJZGVudHNbMF0sIGJJZGVudHNbMV0sICdpZGVudHMgdW5pcXVlIG9uIEInKTtcclxuICBhc3NlcnQuZGVlcEVxdWFsKGFJZGVudHMsIGJJZGVudHMsICdib3RoIHNpZGVzIGFncmVlIG9uIGlkZW50cycpO1xyXG5cclxuICBhLmN0eC5kYi5jbG9zZSgpO1xyXG4gIGIuY3R4LmRiLmNsb3NlKCk7XHJcbn0pO1xyXG5cclxudGVzdCgnc3luYzogb2ZmbGluZSBlZGl0cyBxdWV1ZSBhbmQgZmx1c2ggd2hlbiBmb2xkZXIgcmV0dXJucycsIGFzeW5jICgpID0+IHtcclxuICBjb25zdCBhID0gbWtTdG9yZSgnb2ZmQScsICdqb2huJyk7XHJcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRvJyk7XHJcbiAgY29uc3QgZW5naW5lID0gbmV3IFN5bmNFbmdpbmUoYS5zdG9yZSwgJ0pvaG4nLCAoKSA9PiB7fSk7XHJcblxyXG4gIGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdNYWRlIG9mZmxpbmUnIH0pO1xyXG4gIGFzc2VydC5vayhlbmdpbmUuc3RhdHVzKCkucGVuZGluZ09wcyA+IDAgfHwgZW5naW5lLnN0YXR1cygpLnN0YXRlID09PSAnZGlzYWJsZWQnKTtcclxuXHJcbiAgZW5naW5lLnNldFRyYW5zcG9ydChuZXcgRm9sZGVyVHJhbnNwb3J0KGZvbGRlcikpO1xyXG4gIGF3YWl0IGVuZ2luZS5jeWNsZSgpO1xyXG4gIGFzc2VydC5lcXVhbChlbmdpbmUuc3RhdHVzKCkucGVuZGluZ09wcywgMCwgJ29wcyBleHBvcnRlZCBhZnRlciB0cmFuc3BvcnQgYXR0YWNoZWQnKTtcclxuICBhd2FpdCBlbmdpbmUuc3RvcCgpO1xyXG4gIGEuY3R4LmRiLmNsb3NlKCk7XHJcbn0pO1xyXG5cclxudGVzdCgnc2VlZCBkYXRhIGxvYWRzLCBpcyBmbGFnZ2VkLCBhbmQgcmVtb3ZlcyBjbGVhbmx5JywgKCkgPT4ge1xyXG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgnc2VlZCcsICdqb2huJyk7XHJcbiAgY29uc3QgbiA9IGxvYWRTZWVkRGF0YShzdG9yZSk7XHJcbiAgYXNzZXJ0Lm9rKG4gPiAxNSk7XHJcbiAgY29uc3Qgc2FtcGxlcyA9IHN0b3JlLmxpc3RJdGVtcyh7IHNhbXBsZTogdHJ1ZSB9LCB7IGZpZWxkOiAnY3JlYXRlZEF0JywgZGlyOiAnYXNjJyB9LCAxMDApO1xyXG4gIGFzc2VydC5lcXVhbChzYW1wbGVzLmxlbmd0aCwgbik7XHJcbiAgLy8gbGlua3MgZXhpc3RcclxuICBjb25zdCB3aXRoTGlua3MgPSBzYW1wbGVzLmZpbHRlcigocykgPT4gc3RvcmUubGlua3NGb3Iocy5pZCkubGVuZ3RoID4gMCk7XHJcbiAgYXNzZXJ0Lm9rKHdpdGhMaW5rcy5sZW5ndGggPiA1KTtcclxuXHJcbiAgY29uc3QgcmVtb3ZlZCA9IHN0b3JlLnJlbW92ZVNhbXBsZURhdGEoKTtcclxuICBhc3NlcnQuZXF1YWwocmVtb3ZlZCwgbik7XHJcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmxpc3RJdGVtcyh7fSwgeyBmaWVsZDogJ2NyZWF0ZWRBdCcsIGRpcjogJ2FzYycgfSwgMTAwKS5sZW5ndGgsIDApO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuXHJcbnRlc3QoJ2RhdGFiYXNlIGludGVncml0eSBndWFyZCBxdWFyYW50aW5lcyBjb3JydXB0aW9uJywgKCkgPT4ge1xyXG4gIGNvbnN0IGRpciA9IHRtcCgnY29ycnVwdCcpO1xyXG4gIGNvbnN0IGN0eCA9IG9wZW5EYXRhYmFzZShkaXIpO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG4gIC8vIFN0b21wIHRoZSBmaWxlIGhlYWRlci5cclxuICBjb25zdCBkYlBhdGggPSBwYXRoLmpvaW4oZGlyLCAndGV0aGVyLmRiJyk7XHJcbiAgY29uc3QgZmQgPSBmcy5vcGVuU3luYyhkYlBhdGgsICdyKycpO1xyXG4gIGZzLndyaXRlU3luYyhmZCwgQnVmZmVyLmZyb20oJ0dBUkJBR0VHQVJCQUdFR0FSQkFHRScpLCAwLCAyMSwgMCk7XHJcbiAgZnMuY2xvc2VTeW5jKGZkKTtcclxuICBhc3NlcnQudGhyb3dzKCgpID0+IG9wZW5EYXRhYmFzZShkaXIpLCAvaW50ZWdyaXR5fG1hbGZvcm1lZHxub3QgYSBkYXRhYmFzZS9pKTtcclxufSk7XHJcblxyXG50ZXN0KCdvdXQtb2Ytb3JkZXIgcmVtb3RlIG9wczogc2V0L2RlbGV0ZSBhcnJpdmluZyBiZWZvcmUgY3JlYXRlIGFyZSBidWZmZXJlZCwgbm90IGxvc3QnLCAoKSA9PiB7XHJcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ3Jlb3JkZXInLCAnam9obicpO1xyXG4gIC8vIFNpbXVsYXRlIGRldmljZSBDIHJlY2VpdmluZyBCJ3Mgb3BzIGFib3V0IGFuIGl0ZW0gQkVGT1JFIEEncyBjcmVhdGUgb2YgaXQuXHJcbiAgY29uc3QgaXRlbUlkID0gJzAwMDAwMDAwLWFhYWEtNDAwMC04MDAwLTAwMDAwMDAwMDAwMSc7XHJcbiAgY29uc3Qgc2V0T3AgPSB7XHJcbiAgICBvcElkOiAnb3Atc2V0LTEnLCBkZXZpY2VJZDogJ2RldmljZS1CJywgYWN0b3JJZDogJ21hcmsnLCBsYW1wb3J0OiAxMCwgYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgIGVudGl0eTogJ2l0ZW0nIGFzIGNvbnN0LCBlbnRpdHlJZDogaXRlbUlkLCBhY3Rpb246ICdzZXQnIGFzIGNvbnN0LFxyXG4gICAgcGF5bG9hZDogeyBmaWVsZHM6IHsgc3RhdHVzOiAnaW5fcHJvZ3Jlc3MnIH0sIGJhc2VkT246IHsgc3RhdHVzOiBudWxsIH0gfSxcclxuICB9O1xyXG4gIGNvbnN0IGNyZWF0ZU9wID0ge1xyXG4gICAgb3BJZDogJ29wLWNyZWF0ZS0xJywgZGV2aWNlSWQ6ICdkZXZpY2UtQScsIGFjdG9ySWQ6ICdqb2huJywgbGFtcG9ydDogNSwgYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgIGVudGl0eTogJ2l0ZW0nIGFzIGNvbnN0LCBlbnRpdHlJZDogaXRlbUlkLCBhY3Rpb246ICdjcmVhdGUnIGFzIGNvbnN0LFxyXG4gICAgcGF5bG9hZDoge1xyXG4gICAgICByZWNvcmQ6IHtcclxuICAgICAgICBpZDogaXRlbUlkLCBpZGVudDogJ1RBU0stOTAwJywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ1Jlb3JkZXJlZCBpdGVtJywgYm9keTogJycsIGJvZHlUZXh0OiAnJyxcclxuICAgICAgICBzdGF0dXM6ICd0b2RvJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcklkOiBudWxsLCByZXBvcnRlcklkOiAnam9obicsIG1pbGVzdG9uZUlkOiBudWxsLFxyXG4gICAgICAgIHJlbGVhc2VJZDogbnVsbCwgcGFyZW50SWQ6IG51bGwsIHN0YXJ0RGF0ZTogbnVsbCwgZHVlRGF0ZTogbnVsbCwgY29tcGxldGVkQXQ6IG51bGwsXHJcbiAgICAgICAgZWZmb3J0OiBudWxsLCBjb25maWRlbmNlOiBudWxsLCByaXNrTGV2ZWw6IG51bGwsIGJ1c2luZXNzVmFsdWU6IG51bGwsIGxlYWRlcnNoaXBWaXNpYmxlOiAwLFxyXG4gICAgICAgIHByb2dyZXNzOiBudWxsLCB0YWdzOiBbXSwgZXh0cmE6IHt9LCBhcmNoaXZlZDogMCwgc2FtcGxlOiAwLFxyXG4gICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLCB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICBjcmVhdGVkQnk6ICdqb2huJywgdXBkYXRlZEJ5OiAnam9obicsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH07XHJcblxyXG4gIC8vIFNldCBhcnJpdmVzIGZpcnN0IFx1MjAxNCBtdXN0IGJ1ZmZlciwgaXRlbSBtdXN0IG5vdCBleGlzdCB5ZXQuXHJcbiAgYS5zdG9yZS5hcHBseVJlbW90ZU9wcyhbc2V0T3BdKTtcclxuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW1JZCksIG51bGwpO1xyXG5cclxuICAvLyBDcmVhdGUgYXJyaXZlcyBcdTIwMTQgaXRlbSBhcHBlYXJzIEFORCB0aGUgYnVmZmVyZWQgc2V0IHJlcGxheXMgb24gdG9wLlxyXG4gIGEuc3RvcmUuYXBwbHlSZW1vdGVPcHMoW2NyZWF0ZU9wXSk7XHJcbiAgY29uc3QgaXRlbSA9IGEuc3RvcmUuZ2V0SXRlbShpdGVtSWQpO1xyXG4gIGFzc2VydC5vayhpdGVtLCAnaXRlbSBjcmVhdGVkJyk7XHJcbiAgYXNzZXJ0LmVxdWFsKGl0ZW0hLnN0YXR1cywgJ2luX3Byb2dyZXNzJywgJ2J1ZmZlcmVkIHNldCBhcHBsaWVkIGFmdGVyIGNyZWF0ZScpO1xyXG5cclxuICAvLyBEZWxldGUtYmVmb3JlLWNyZWF0ZSBtdXN0IG5vdCByZXN1cnJlY3Q6IGZyZXNoIGVudGl0eSwgZGVsZXRlIGZpcnN0LCB0aGVuIGNyZWF0ZS5cclxuICBjb25zdCBpdGVtMiA9ICcwMDAwMDAwMC1iYmJiLTQwMDAtODAwMC0wMDAwMDAwMDAwMDInO1xyXG4gIGEuc3RvcmUuYXBwbHlSZW1vdGVPcHMoW1xyXG4gICAgeyAuLi5zZXRPcCwgb3BJZDogJ29wLWRlbC0yJywgZW50aXR5SWQ6IGl0ZW0yLCBhY3Rpb246ICdkZWxldGUnIGFzIGNvbnN0LCBsYW1wb3J0OiAyMCwgcGF5bG9hZDoge30gfSxcclxuICBdKTtcclxuICBhLnN0b3JlLmFwcGx5UmVtb3RlT3BzKFtcclxuICAgIHsgLi4uY3JlYXRlT3AsIG9wSWQ6ICdvcC1jcmVhdGUtMicsIGVudGl0eUlkOiBpdGVtMiwgbGFtcG9ydDogNixcclxuICAgICAgcGF5bG9hZDogeyByZWNvcmQ6IHsgLi4uKGNyZWF0ZU9wLnBheWxvYWQucmVjb3JkIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KSwgaWQ6IGl0ZW0yLCBpZGVudDogJ1RBU0stOTAxJyB9IH0gfSxcclxuICBdKTtcclxuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW0yKSwgbnVsbCwgJ2RlbGV0ZS1iZWZvcmUtY3JlYXRlIGRvZXMgbm90IHJlc3VycmVjdCB0aGUgaXRlbScpO1xyXG5cclxuICBhLmN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuXHJcbnRlc3QoJ2F1ZGl0YWJpbGl0eTogbWlsZXN0b25lcy9yZWxlYXNlcyBjYXJyeSBjcmVhdGVkK3VwZGF0ZWQgYXR0cmlidXRpb24gYW5kIGxvZyBhY3Rpdml0eScsICgpID0+IHtcclxuICBjb25zdCB7IGN0eCwgc3RvcmUgfSA9IG1rU3RvcmUoJ2F1ZGl0LW1zJywgJ2pvaG4nKTtcclxuICBjb25zdCBtID0gc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgbmFtZTogJ0Rpc2NvdmVyeScgfSk7XHJcbiAgY29uc3Qgcm93ID0gY3R4LmRiLnByZXBhcmUoJ1NFTEVDVCBjcmVhdGVkX2F0LCBjcmVhdGVkX2J5LCB1cGRhdGVkX2F0LCB1cGRhdGVkX2J5IEZST00gbWlsZXN0b25lcyBXSEVSRSBpZD0/JykuZ2V0KG0uaWQpIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz47XHJcbiAgYXNzZXJ0Lm9rKHJvdy5jcmVhdGVkX2F0ICYmIHJvdy5jcmVhdGVkX2J5ID09PSAnam9obicgJiYgcm93LnVwZGF0ZWRfYXQgJiYgcm93LnVwZGF0ZWRfYnkgPT09ICdqb2huJyk7XHJcbiAgY29uc3QgYWN0ID0gc3RvcmUuYWN0aXZpdHlGb3IobnVsbCwgNTApIGFzIHsga2luZDogc3RyaW5nOyBuZXdWYWx1ZTogc3RyaW5nIHwgbnVsbCB9W107XHJcbiAgYXNzZXJ0Lm9rKGFjdC5zb21lKChhKSA9PiBhLmtpbmQgPT09ICdtaWxlc3RvbmVfY3JlYXRlZCcgJiYgYS5uZXdWYWx1ZSA9PT0gJ0Rpc2NvdmVyeScpKTtcclxuXHJcbiAgLy8gVXBkYXRlIGJ5IGEgZGlmZmVyZW50IGFjdG9yIC0+IHVwZGF0ZWRfYnkgY2hhbmdlcywgYWN0aXZpdHkgbG9nZ2VkLlxyXG4gIHN0b3JlLmFjdG9ySWQgPSAnbWFyayc7XHJcbiAgc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgaWQ6IG0uaWQsIG5hbWU6ICdEaXNjb3ZlcnkgJiBBY2Nlc3MnIH0pO1xyXG4gIGNvbnN0IHJvdzIgPSBjdHguZGIucHJlcGFyZSgnU0VMRUNUIGNyZWF0ZWRfYnksIHVwZGF0ZWRfYnkgRlJPTSBtaWxlc3RvbmVzIFdIRVJFIGlkPT8nKS5nZXQobS5pZCkgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcclxuICBhc3NlcnQuZXF1YWwocm93Mi5jcmVhdGVkX2J5LCAnam9obicsICdjcmVhdG9yIHByZXNlcnZlZCcpO1xyXG4gIGFzc2VydC5lcXVhbChyb3cyLnVwZGF0ZWRfYnksICdtYXJrJywgJ2xhc3QgZWRpdG9yIHJlY29yZGVkJyk7XHJcbiAgYXNzZXJ0Lm9rKChzdG9yZS5hY3Rpdml0eUZvcihudWxsLCA1MCkgYXMgeyBraW5kOiBzdHJpbmcgfVtdKS5zb21lKChhKSA9PiBhLmtpbmQgPT09ICdtaWxlc3RvbmVfdXBkYXRlZCcpKTtcclxuICBjdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdhdWRpdGFiaWxpdHk6IHNvZnQtZGVsZXRlIG9ubHksIGRlbGV0ZXMgYXR0cmlidXRlZCBhbmQgbG9nZ2VkLCBub3RoaW5nIHBoeXNpY2FsbHkgcmVtb3ZlZCcsICgpID0+IHtcclxuICBjb25zdCB7IGN0eCwgc3RvcmUgfSA9IG1rU3RvcmUoJ2F1ZGl0LWRlbCcsICdqb2huJyk7XHJcbiAgY29uc3QgaXRlbSA9IHN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnVGVtcCcgfSk7XHJcbiAgY29uc3QgYyA9IHN0b3JlLmFkZENvbW1lbnQoaXRlbS5pZCwgJ3t9JywgJ2EgY29tbWVudCcpO1xyXG4gIHN0b3JlLmRlbGV0ZUNvbW1lbnQoYy5pZCk7XHJcbiAgc3RvcmUuZGVsZXRlSXRlbShpdGVtLmlkKTtcclxuXHJcbiAgLy8gUm93cyBzdGlsbCBwaHlzaWNhbGx5IHByZXNlbnQgKHNvZnQgZGVsZXRlKSwgd2l0aCBhdHRyaWJ1dGlvbi5cclxuICBjb25zdCBjcm93ID0gY3R4LmRiLnByZXBhcmUoJ1NFTEVDVCBkZWxldGVkLCBkZWxldGVkX2J5IEZST00gY29tbWVudHMgV0hFUkUgaWQ9PycpLmdldChjLmlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICBhc3NlcnQuZXF1YWwoY3Jvdy5kZWxldGVkLCAxKTtcclxuICBhc3NlcnQuZXF1YWwoY3Jvdy5kZWxldGVkX2J5LCAnam9obicpO1xyXG4gIGNvbnN0IGlyb3cgPSBjdHguZGIucHJlcGFyZSgnU0VMRUNUIGRlbGV0ZWQsIGRlbGV0ZWRfYnksIGRlbGV0ZWRfYXQgRlJPTSBpdGVtcyBXSEVSRSBpZD0/JykuZ2V0KGl0ZW0uaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gIGFzc2VydC5lcXVhbChpcm93LmRlbGV0ZWQsIDEpO1xyXG4gIGFzc2VydC5lcXVhbChpcm93LmRlbGV0ZWRfYnksICdqb2huJyk7XHJcbiAgYXNzZXJ0Lm9rKGlyb3cuZGVsZXRlZF9hdCk7XHJcblxyXG4gIC8vIEJvdGggcGh5c2ljYWwgcm93cyByZW1haW4gaW4gdGhlIGZpbGUuXHJcbiAgYXNzZXJ0Lm9rKGN0eC5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIGNvbW1lbnRzIFdIRVJFIGlkPT8nKS5nZXQoYy5pZCkpO1xyXG4gIGFzc2VydC5vayhjdHguZGIucHJlcGFyZSgnU0VMRUNUIDEgRlJPTSBpdGVtcyBXSEVSRSBpZD0/JykuZ2V0KGl0ZW0uaWQpKTtcclxuXHJcbiAgLy8gRGVsZXRpb25zIGFyZSBpbiB0aGUgYWN0aXZpdHkgbG9nLlxyXG4gIGNvbnN0IGFjdCA9IHN0b3JlLmFjdGl2aXR5Rm9yKGl0ZW0uaWQsIDUwKSBhcyB7IGtpbmQ6IHN0cmluZyB9W107XHJcbiAgYXNzZXJ0Lm9rKGFjdC5zb21lKChhKSA9PiBhLmtpbmQgPT09ICdkZWxldGVkJykpO1xyXG4gIGFzc2VydC5vayhhY3Quc29tZSgoYSkgPT4gYS5raW5kID09PSAnY29tbWVudF9kZWxldGVkJykpO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuIiwgImltcG9ydCBEYXRhYmFzZSBmcm9tICdiZXR0ZXItc3FsaXRlMyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XHJcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcclxuaW1wb3J0IGNyeXB0byBmcm9tICdub2RlOmNyeXB0byc7XHJcbmltcG9ydCB7IE1JR1JBVElPTlMgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuZXhwb3J0IHR5cGUgREIgPSBEYXRhYmFzZS5EYXRhYmFzZTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGJDb250ZXh0IHtcclxuICBkYjogREI7XHJcbiAgZGV2aWNlSWQ6IHN0cmluZztcclxuICBkYXRhRGlyOiBzdHJpbmc7XHJcbiAgZGJQYXRoOiBzdHJpbmc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBPcGVucyAob3IgY3JlYXRlcykgdGhlIFRldGhlciBkYXRhYmFzZSwgYXBwbGllcyBwZW5kaW5nIG1pZ3JhdGlvbnMsXHJcbiAqIGFuZCBndWFyYW50ZWVzIGRldmljZSBpZGVudGl0eSBtZXRhZGF0YS5cclxuICpcclxuICogU2FmZXR5IHBvc3R1cmU6IFdBTCBtb2RlICsgaW50ZWdyaXR5IGNoZWNrIG9uIG9wZW4gKyB0aW1lc3RhbXBlZCBiYWNrdXBcclxuICogYmVmb3JlIGFueSBtaWdyYXRpb24gYmV5b25kIHZlcnNpb24gMC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBvcGVuRGF0YWJhc2UoZGF0YURpcjogc3RyaW5nKTogRGJDb250ZXh0IHtcclxuICBmcy5ta2RpclN5bmMoZGF0YURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgY29uc3QgZGJQYXRoID0gcGF0aC5qb2luKGRhdGFEaXIsICd0ZXRoZXIuZGInKTtcclxuICBhcHBseVBlbmRpbmdSZXN0b3JlKGRhdGFEaXIsIGRiUGF0aCk7IC8vIHN3YXAgaW4gYSBzdGFnZWQgcmVzdG9yZSBiZWZvcmUgb3BlbmluZyBhbnl0aGluZ1xyXG4gIGNvbnN0IGV4aXN0ZWQgPSBmcy5leGlzdHNTeW5jKGRiUGF0aCk7XHJcblxyXG4gIGNvbnN0IGRiID0gbmV3IERhdGFiYXNlKGRiUGF0aCk7XHJcbiAgZGIucHJhZ21hKCdqb3VybmFsX21vZGUgPSBXQUwnKTtcclxuICBkYi5wcmFnbWEoJ2ZvcmVpZ25fa2V5cyA9IE9OJyk7XHJcbiAgZGIucHJhZ21hKCdzeW5jaHJvbm91cyA9IE5PUk1BTCcpO1xyXG5cclxuICBpZiAoZXhpc3RlZCkge1xyXG4gICAgY29uc3QgY2hlY2sgPSBkYi5wcmFnbWEoJ3F1aWNrX2NoZWNrJywgeyBzaW1wbGU6IHRydWUgfSk7XHJcbiAgICBpZiAoY2hlY2sgIT09ICdvaycpIHtcclxuICAgICAgLy8gUHJlc2VydmUgdGhlIGRhbWFnZWQgZmlsZSBmb3IgcmVjb3ZlcnkgYW5kIGZhaWwgbG91ZGx5IFx1MjAxNCBuZXZlciBydW4gb24gYSBjb3JydXB0IGRiLlxyXG4gICAgICBjb25zdCBxdWFyYW50aW5lID0gZGJQYXRoICsgJy5jb3JydXB0LScgKyBEYXRlLm5vdygpO1xyXG4gICAgICBkYi5jbG9zZSgpO1xyXG4gICAgICBmcy5jb3B5RmlsZVN5bmMoZGJQYXRoLCBxdWFyYW50aW5lKTtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgIGBEYXRhYmFzZSBmYWlsZWQgaW50ZWdyaXR5IGNoZWNrICgke2NoZWNrfSkuIERhbWFnZWQgY29weSBwcmVzZXJ2ZWQgYXQgJHtxdWFyYW50aW5lfS4gYCArXHJcbiAgICAgICAgICAnUmVzdG9yZSBmcm9tIGEgYmFja3VwIGluIHRoZSBiYWNrdXBzLyBmb2xkZXIuJyxcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFwcGx5TWlncmF0aW9ucyhkYiwgZGF0YURpciwgZGJQYXRoLCBleGlzdGVkKTtcclxuXHJcbiAgY29uc3QgZGV2aWNlSWQgPSBlbnN1cmVNZXRhKGRiLCAnZGV2aWNlX2lkJywgKCkgPT4gY3J5cHRvLnJhbmRvbVVVSUQoKSk7XHJcbiAgZW5zdXJlTWV0YShkYiwgJ3Byb2plY3RfaWQnLCAoKSA9PiBjcnlwdG8ucmFuZG9tVVVJRCgpKTtcclxuXHJcbiAgcmV0dXJuIHsgZGIsIGRldmljZUlkLCBkYXRhRGlyLCBkYlBhdGggfTtcclxufVxyXG5cclxuZnVuY3Rpb24gYXBwbHlNaWdyYXRpb25zKGRiOiBEQiwgZGF0YURpcjogc3RyaW5nLCBkYlBhdGg6IHN0cmluZywgZXhpc3RlZDogYm9vbGVhbik6IHZvaWQge1xyXG4gIGNvbnN0IGhhc01ldGEgPSBkYlxyXG4gICAgLnByZXBhcmUoXCJTRUxFQ1QgQ09VTlQoKikgQVMgYyBGUk9NIHNxbGl0ZV9tYXN0ZXIgV0hFUkUgdHlwZT0ndGFibGUnIEFORCBuYW1lPSdtZXRhJ1wiKVxyXG4gICAgLmdldCgpIGFzIHsgYzogbnVtYmVyIH07XHJcbiAgbGV0IHZlcnNpb24gPSAwO1xyXG4gIGlmIChoYXNNZXRhLmMgPiAwKSB7XHJcbiAgICBjb25zdCByb3cgPSBkYi5wcmVwYXJlKFwiU0VMRUNUIHZhbHVlIEZST00gbWV0YSBXSEVSRSBrZXk9J3NjaGVtYV92ZXJzaW9uJ1wiKS5nZXQoKSBhc1xyXG4gICAgICB8IHsgdmFsdWU6IHN0cmluZyB9XHJcbiAgICAgIHwgdW5kZWZpbmVkO1xyXG4gICAgdmVyc2lvbiA9IHJvdyA/IE51bWJlcihyb3cudmFsdWUpIDogMDtcclxuICB9XHJcblxyXG4gIGNvbnN0IHBlbmRpbmcgPSBNSUdSQVRJT05TLmZpbHRlcigobSkgPT4gbS52ZXJzaW9uID4gdmVyc2lvbik7XHJcbiAgaWYgKHBlbmRpbmcubGVuZ3RoID09PSAwKSByZXR1cm47XHJcblxyXG4gIGlmIChleGlzdGVkICYmIHZlcnNpb24gPiAwKSB7XHJcbiAgICBjb25zdCBiYWNrdXBEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ2JhY2t1cHMnKTtcclxuICAgIGZzLm1rZGlyU3luYyhiYWNrdXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgY29uc3Qgc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCAnLScpO1xyXG4gICAgZnMuY29weUZpbGVTeW5jKGRiUGF0aCwgcGF0aC5qb2luKGJhY2t1cERpciwgYHByZS1taWdyYXRpb24tdiR7dmVyc2lvbn0tJHtzdGFtcH0uZGJgKSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBydW4gPSBkYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICBmb3IgKGNvbnN0IG0gb2YgcGVuZGluZykge1xyXG4gICAgICBkYi5leGVjKG0uc3FsKTtcclxuICAgICAgZGIucHJlcGFyZShcclxuICAgICAgICBcIklOU0VSVCBJTlRPIG1ldGEoa2V5LHZhbHVlKSBWQUxVRVMoJ3NjaGVtYV92ZXJzaW9uJyw/KSBcIiArXHJcbiAgICAgICAgICBcIk9OIENPTkZMSUNUKGtleSkgRE8gVVBEQVRFIFNFVCB2YWx1ZT1leGNsdWRlZC52YWx1ZVwiLFxyXG4gICAgICApLnJ1bihTdHJpbmcobS52ZXJzaW9uKSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcnVuKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVuc3VyZU1ldGEoZGI6IERCLCBrZXk6IHN0cmluZywgbWFrZTogKCkgPT4gc3RyaW5nKTogc3RyaW5nIHtcclxuICBjb25zdCByb3cgPSBkYi5wcmVwYXJlKCdTRUxFQ1QgdmFsdWUgRlJPTSBtZXRhIFdIRVJFIGtleT0/JykuZ2V0KGtleSkgYXNcclxuICAgIHwgeyB2YWx1ZTogc3RyaW5nIH1cclxuICAgIHwgdW5kZWZpbmVkO1xyXG4gIGlmIChyb3cpIHJldHVybiByb3cudmFsdWU7XHJcbiAgY29uc3QgdmFsdWUgPSBtYWtlKCk7XHJcbiAgZGIucHJlcGFyZSgnSU5TRVJUIElOVE8gbWV0YShrZXksdmFsdWUpIFZBTFVFUyg/LD8pJykucnVuKGtleSwgdmFsdWUpO1xyXG4gIHJldHVybiB2YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1ldGEoZGI6IERCLCBrZXk6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xyXG4gIGNvbnN0IHJvdyA9IGRiLnByZXBhcmUoJ1NFTEVDVCB2YWx1ZSBGUk9NIG1ldGEgV0hFUkUga2V5PT8nKS5nZXQoa2V5KSBhc1xyXG4gICAgfCB7IHZhbHVlOiBzdHJpbmcgfVxyXG4gICAgfCB1bmRlZmluZWQ7XHJcbiAgcmV0dXJuIHJvdyA/IHJvdy52YWx1ZSA6IG51bGw7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRNZXRhKGRiOiBEQiwga2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcclxuICBkYi5wcmVwYXJlKFxyXG4gICAgJ0lOU0VSVCBJTlRPIG1ldGEoa2V5LHZhbHVlKSBWQUxVRVMoPyw/KSBPTiBDT05GTElDVChrZXkpIERPIFVQREFURSBTRVQgdmFsdWU9ZXhjbHVkZWQudmFsdWUnLFxyXG4gICkucnVuKGtleSwgdmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEJhY2t1cE9wdGlvbnMge1xyXG4gIHJldGVudGlvbj86IG51bWJlcjsgLy8ga2VlcCBuZXdlc3QgTiB0ZXRoZXItKi5kYiBwZXIgbG9jYXRpb24gKGRlZmF1bHQgMjApXHJcbiAgb2ZmTWFjaGluZURpcj86IHN0cmluZyB8IG51bGw7IC8vIGUuZy4gPHN5bmNGb2xkZXI+L2JhY2t1cHMgXHUyMDE0IGRpc2FzdGVyIGNvcHlcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbnNpc3RlbnQgc25hcHNob3QgdmlhIHRoZSBTUUxpdGUgYmFja3VwIEFQSSAoc2FmZSB3aGlsZSB0aGUgYXBwIHJ1bnMpLlxyXG4gKiBJbnRlZ3JpdHktZ2F0ZWQ6IHJlZnVzZXMgdG8gc25hcHNob3QgYSBkYiB0aGF0IGZhaWxzIHF1aWNrX2NoZWNrLCBzbyBhIGdvb2RcclxuICogYmFja3VwIGlzIG5ldmVyIG92ZXJ3cml0dGVuIGJ5IGEgY29ycnVwdCBvbmUuIFBydW5lcyB0byBgcmV0ZW50aW9uYCBwZXJcclxuICogbG9jYXRpb24gYW5kLCBpZiBnaXZlbiwgY29waWVzIG9mZi1tYWNoaW5lIGludG8gdGhlIHN5bmNlZCBmb2xkZXIuXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYmFja3VwRGF0YWJhc2UoY3R4OiBEYkNvbnRleHQsIG9wdHM6IEJhY2t1cE9wdGlvbnMgPSB7fSk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgY29uc3QgY2hlY2sgPSBjdHguZGIucHJhZ21hKCdxdWlja19jaGVjaycsIHsgc2ltcGxlOiB0cnVlIH0pO1xyXG4gIGlmIChjaGVjayAhPT0gJ29rJykgdGhyb3cgbmV3IEVycm9yKGBSZWZ1c2luZyB0byBiYWNrIHVwOiBpbnRlZ3JpdHkgY2hlY2sgZmFpbGVkICgke2NoZWNrfSkuYCk7XHJcblxyXG4gIGNvbnN0IGtlZXAgPSBvcHRzLnJldGVudGlvbiA/PyAyMDtcclxuICBjb25zdCBiYWNrdXBEaXIgPSBwYXRoLmpvaW4oY3R4LmRhdGFEaXIsICdiYWNrdXBzJyk7XHJcbiAgZnMubWtkaXJTeW5jKGJhY2t1cERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgY29uc3Qgc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCAnLScpO1xyXG4gIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4oYmFja3VwRGlyLCBgdGV0aGVyLSR7c3RhbXB9LmRiYCk7XHJcbiAgYXdhaXQgY3R4LmRiLmJhY2t1cChkZXN0KTtcclxuICBwcnVuZUJhY2t1cHMoYmFja3VwRGlyLCBrZWVwKTtcclxuXHJcbiAgaWYgKG9wdHMub2ZmTWFjaGluZURpcikge1xyXG4gICAgdHJ5IHtcclxuICAgICAgZnMubWtkaXJTeW5jKG9wdHMub2ZmTWFjaGluZURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICAgIGZzLmNvcHlGaWxlU3luYyhkZXN0LCBwYXRoLmpvaW4ob3B0cy5vZmZNYWNoaW5lRGlyLCBgdGV0aGVyLSR7c3RhbXB9LmRiYCkpO1xyXG4gICAgICBwcnVuZUJhY2t1cHMob3B0cy5vZmZNYWNoaW5lRGlyLCBrZWVwKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdbdGV0aGVyXSBvZmYtbWFjaGluZSBiYWNrdXAgY29weSBmYWlsZWQ6JywgZXJyKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGRlc3Q7XHJcbn1cclxuXHJcbi8qKiBLZWVwIG9ubHkgdGhlIG5ld2VzdCBga2VlcGAgdGV0aGVyLSouZGIgZmlsZXMgaW4gYSBkaXJlY3RvcnkuICovXHJcbmZ1bmN0aW9uIHBydW5lQmFja3VwcyhkaXI6IHN0cmluZywga2VlcDogbnVtYmVyKTogdm9pZCB7XHJcbiAgbGV0IGZpbGVzOiBzdHJpbmdbXTtcclxuICB0cnkge1xyXG4gICAgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyhkaXIpLmZpbHRlcigoZikgPT4gL150ZXRoZXItLipcXC5kYiQvLnRlc3QoZikpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBpZiAoZmlsZXMubGVuZ3RoIDw9IGtlZXApIHJldHVybjtcclxuICBjb25zdCBieU5ld2VzdCA9IGZpbGVzXHJcbiAgICAubWFwKChmKSA9PiAoeyBmLCB0OiBmcy5zdGF0U3luYyhwYXRoLmpvaW4oZGlyLCBmKSkubXRpbWVNcyB9KSlcclxuICAgIC5zb3J0KChhLCBiKSA9PiBiLnQgLSBhLnQpO1xyXG4gIGZvciAoY29uc3QgeyBmIH0gb2YgYnlOZXdlc3Quc2xpY2Uoa2VlcCkpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGZzLnJtU3luYyhwYXRoLmpvaW4oZGlyLCBmKSwgeyBmb3JjZTogdHJ1ZSB9KTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICAvKiBiZXN0LWVmZm9ydCAqL1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBCYWNrdXBJbmZvIHtcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgc2l6ZTogbnVtYmVyO1xyXG4gIG10aW1lOiBzdHJpbmc7XHJcbn1cclxuXHJcbi8qKiBMaXN0IGxvY2FsIHNuYXBzaG90cywgbmV3ZXN0IGZpcnN0LiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbGlzdEJhY2t1cHMoY3R4OiBEYkNvbnRleHQpOiBCYWNrdXBJbmZvW10ge1xyXG4gIGNvbnN0IGRpciA9IHBhdGguam9pbihjdHguZGF0YURpciwgJ2JhY2t1cHMnKTtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIGZzXHJcbiAgICAgIC5yZWFkZGlyU3luYyhkaXIpXHJcbiAgICAgIC5maWx0ZXIoKGYpID0+IGYuZW5kc1dpdGgoJy5kYicpKVxyXG4gICAgICAubWFwKChmKSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc3QgPSBmcy5zdGF0U3luYyhwYXRoLmpvaW4oZGlyLCBmKSk7XHJcbiAgICAgICAgcmV0dXJuIHsgbmFtZTogZiwgc2l6ZTogc3Quc2l6ZSwgbXRpbWU6IG5ldyBEYXRlKHN0Lm10aW1lTXMpLnRvSVNPU3RyaW5nKCkgfTtcclxuICAgICAgfSlcclxuICAgICAgLnNvcnQoKGEsIGIpID0+IChhLm10aW1lIDwgYi5tdGltZSA/IDEgOiAtMSkpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlIGEgYmFja3VwIGFuZCBzdGFnZSBpdCBmb3IgcmVzdG9yZSBvbiBuZXh0IGxhdW5jaC4gV2UgbmV2ZXIgc3dhcCB0aGVcclxuICogbGl2ZSBkYiBtaWQtc2Vzc2lvbjsgdGhlIHN3YXAgaGFwcGVucyBpbiBhcHBseVBlbmRpbmdSZXN0b3JlKCkgYmVmb3JlIG9wZW4uXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc3RhZ2VSZXN0b3JlKGN0eDogRGJDb250ZXh0LCBiYWNrdXBOYW1lOiBzdHJpbmcpOiB7IHJlc3RhcnRSZXF1aXJlZDogdHJ1ZSB9IHtcclxuICBpZiAoIS9eW1xcdy5cXC1dK1xcLmRiJC8udGVzdChiYWNrdXBOYW1lKSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJhY2t1cCBuYW1lJyk7XHJcbiAgY29uc3Qgc3JjID0gcGF0aC5qb2luKGN0eC5kYXRhRGlyLCAnYmFja3VwcycsIGJhY2t1cE5hbWUpO1xyXG4gIGlmICghZnMuZXhpc3RzU3luYyhzcmMpKSB0aHJvdyBuZXcgRXJyb3IoJ0JhY2t1cCBub3QgZm91bmQnKTtcclxuICBjb25zdCBwcm9iZSA9IG5ldyBEYXRhYmFzZShzcmMsIHsgcmVhZG9ubHk6IHRydWUgfSk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG9rID0gcHJvYmUucHJhZ21hKCdxdWlja19jaGVjaycsIHsgc2ltcGxlOiB0cnVlIH0pO1xyXG4gICAgaWYgKG9rICE9PSAnb2snKSB0aHJvdyBuZXcgRXJyb3IoYEJhY2t1cCBmYWlsZWQgaW50ZWdyaXR5IGNoZWNrICgke29rfSlgKTtcclxuICB9IGZpbmFsbHkge1xyXG4gICAgcHJvYmUuY2xvc2UoKTtcclxuICB9XHJcbiAgZnMuY29weUZpbGVTeW5jKHNyYywgcGF0aC5qb2luKGN0eC5kYXRhRGlyLCAncmVzdG9yZS1wZW5kaW5nLmRiJykpO1xyXG4gIHJldHVybiB7IHJlc3RhcnRSZXF1aXJlZDogdHJ1ZSB9O1xyXG59XHJcblxyXG4vKiogSWYgYSByZXN0b3JlIHdhcyBzdGFnZWQsIHF1YXJhbnRpbmUgdGhlIGN1cnJlbnQgZGIgYW5kIHN3YXAgdGhlIGJhY2t1cCBpbi4gKi9cclxuZnVuY3Rpb24gYXBwbHlQZW5kaW5nUmVzdG9yZShkYXRhRGlyOiBzdHJpbmcsIGRiUGF0aDogc3RyaW5nKTogdm9pZCB7XHJcbiAgY29uc3QgcGVuZGluZyA9IHBhdGguam9pbihkYXRhRGlyLCAncmVzdG9yZS1wZW5kaW5nLmRiJyk7XHJcbiAgaWYgKCFmcy5leGlzdHNTeW5jKHBlbmRpbmcpKSByZXR1cm47XHJcbiAgY29uc3Qgc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCAnLScpO1xyXG4gIGlmIChmcy5leGlzdHNTeW5jKGRiUGF0aCkpIHtcclxuICAgIGZzLmNvcHlGaWxlU3luYyhkYlBhdGgsIGAke2RiUGF0aH0ucHJlLXJlc3RvcmUtJHtzdGFtcH1gKTtcclxuICAgIGZvciAoY29uc3Qgc3VmZml4IG9mIFsnLXdhbCcsICctc2htJ10pIHtcclxuICAgICAgY29uc3QgZiA9IGRiUGF0aCArIHN1ZmZpeDtcclxuICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZikpIGZzLnJtU3luYyhmLCB7IGZvcmNlOiB0cnVlIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuICBmcy5yZW5hbWVTeW5jKHBlbmRpbmcsIGRiUGF0aCk7XHJcbiAgY29uc29sZS5sb2coJ1t0ZXRoZXJdIGFwcGxpZWQgc3RhZ2VkIHJlc3RvcmUgZnJvbSBiYWNrdXAnKTtcclxufVxyXG4iLCAiLy8gVmVyc2lvbmVkIHNjaGVtYSBtaWdyYXRpb25zLiBOZXZlciBlZGl0IGEgc2hpcHBlZCBtaWdyYXRpb24gXHUyMDE0IGFwcGVuZCBhIG5ldyBvbmUuXHJcbi8vIFJ1bm5lcjogZGIudHMgYXBwbHlNaWdyYXRpb25zKCkuIEVhY2ggbWlncmF0aW9uIHJ1bnMgaW4gYSB0cmFuc2FjdGlvbi5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTWlncmF0aW9uIHtcclxuICB2ZXJzaW9uOiBudW1iZXI7XHJcbiAgbmFtZTogc3RyaW5nO1xyXG4gIHNxbDogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgTUlHUkFUSU9OUzogTWlncmF0aW9uW10gPSBbXHJcbiAge1xyXG4gICAgdmVyc2lvbjogMSxcclxuICAgIG5hbWU6ICdjb3JlLXNjaGVtYScsXHJcbiAgICBzcWw6IGBcclxuQ1JFQVRFIFRBQkxFIG1ldGEgKFxyXG4gIGtleSBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIHZhbHVlIFRFWFQgTk9UIE5VTExcclxuKTtcclxuXHJcbkNSRUFURSBUQUJMRSB1c2VycyAoXHJcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXHJcbiAgaW5pdGlhbHMgVEVYVCBOT1QgTlVMTCxcclxuICBjb2xvciBURVhUIE5PVCBOVUxMLFxyXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTFxyXG4pO1xyXG5cclxuQ1JFQVRFIFRBQkxFIGl0ZW1zIChcclxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIGlkZW50IFRFWFQgTk9UIE5VTEwgVU5JUVVFLFxyXG4gIHR5cGUgVEVYVCBOT1QgTlVMTCxcclxuICB0aXRsZSBURVhUIE5PVCBOVUxMLFxyXG4gIGJvZHkgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxyXG4gIGJvZHlfdGV4dCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXHJcbiAgc3RhdHVzIFRFWFQgTk9UIE5VTEwsXHJcbiAgcHJpb3JpdHkgVEVYVCBOT1QgTlVMTCBERUZBVUxUICdub25lJyxcclxuICBvd25lcl9pZCBURVhULFxyXG4gIHJlcG9ydGVyX2lkIFRFWFQsXHJcbiAgbWlsZXN0b25lX2lkIFRFWFQsXHJcbiAgcmVsZWFzZV9pZCBURVhULFxyXG4gIHBhcmVudF9pZCBURVhULFxyXG4gIHN0YXJ0X2RhdGUgVEVYVCxcclxuICBkdWVfZGF0ZSBURVhULFxyXG4gIGNvbXBsZXRlZF9hdCBURVhULFxyXG4gIGVmZm9ydCBSRUFMLFxyXG4gIGNvbmZpZGVuY2UgVEVYVCxcclxuICByaXNrX2xldmVsIFRFWFQsXHJcbiAgYnVzaW5lc3NfdmFsdWUgVEVYVCxcclxuICBsZWFkZXJzaGlwX3Zpc2libGUgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXHJcbiAgcHJvZ3Jlc3MgSU5URUdFUixcclxuICB0YWdzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnW10nLFxyXG4gIGV4dHJhIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAne30nLFxyXG4gIGFyY2hpdmVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxyXG4gIHNhbXBsZSBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcclxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxyXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcclxuICB1cGRhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXHJcbiAgY3JlYXRlZF9ieSBURVhUIE5PVCBOVUxMLFxyXG4gIHVwZGF0ZWRfYnkgVEVYVCBOT1QgTlVMTFxyXG4pO1xyXG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX3R5cGUgT04gaXRlbXModHlwZSkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfc3RhdHVzIE9OIGl0ZW1zKHN0YXR1cykgV0hFUkUgZGVsZXRlZCA9IDA7XHJcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfb3duZXIgT04gaXRlbXMob3duZXJfaWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xyXG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX21pbGVzdG9uZSBPTiBpdGVtcyhtaWxlc3RvbmVfaWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xyXG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX3JlbGVhc2UgT04gaXRlbXMocmVsZWFzZV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfcGFyZW50IE9OIGl0ZW1zKHBhcmVudF9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfdXBkYXRlZCBPTiBpdGVtcyh1cGRhdGVkX2F0KTtcclxuXHJcbkNSRUFURSBUQUJMRSBpZGVudF9jb3VudGVycyAoXHJcbiAgdHlwZSBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIG5leHQgSU5URUdFUiBOT1QgTlVMTFxyXG4pO1xyXG5cclxuQ1JFQVRFIFRBQkxFIGxpbmtzIChcclxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIGZyb21faWQgVEVYVCBOT1QgTlVMTCxcclxuICB0b19pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGtpbmQgVEVYVCBOT1QgTlVMTCxcclxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxyXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcclxuICBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTExcclxuKTtcclxuQ1JFQVRFIElOREVYIGlkeF9saW5rc19mcm9tIE9OIGxpbmtzKGZyb21faWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xyXG5DUkVBVEUgSU5ERVggaWR4X2xpbmtzX3RvIE9OIGxpbmtzKHRvX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcclxuQ1JFQVRFIFVOSVFVRSBJTkRFWCBpZHhfbGlua3NfdW5pcSBPTiBsaW5rcyhmcm9tX2lkLCB0b19pZCwga2luZCk7XHJcblxyXG5DUkVBVEUgVEFCTEUgY29tbWVudHMgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgaXRlbV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGF1dGhvcl9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGJvZHkgVEVYVCBOT1QgTlVMTCxcclxuICBib2R5X3RleHQgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxyXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcclxuICB1cGRhdGVkX2F0IFRFWFQsXHJcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMFxyXG4pO1xyXG5DUkVBVEUgSU5ERVggaWR4X2NvbW1lbnRzX2l0ZW0gT04gY29tbWVudHMoaXRlbV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcblxyXG5DUkVBVEUgVEFCTEUgYXR0YWNobWVudHMgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgaXRlbV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGZpbGVuYW1lIFRFWFQgTk9UIE5VTEwsXHJcbiAgbWltZSBURVhUIE5PVCBOVUxMLFxyXG4gIHNpemUgSU5URUdFUiBOT1QgTlVMTCxcclxuICBzaGEyNTYgVEVYVCBOT1QgTlVMTCxcclxuICBkZXNjcmlwdGlvbiBURVhULFxyXG4gIHVwbG9hZGVkX2J5IFRFWFQgTk9UIE5VTEwsXHJcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxyXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcclxuKTtcclxuQ1JFQVRFIElOREVYIGlkeF9hdHRhY2htZW50c19pdGVtIE9OIGF0dGFjaG1lbnRzKGl0ZW1faWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xyXG5cclxuQ1JFQVRFIFRBQkxFIGFjdGl2aXR5IChcclxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIGl0ZW1faWQgVEVYVCxcclxuICBhY3Rvcl9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGtpbmQgVEVYVCBOT1QgTlVMTCxcclxuICBmaWVsZCBURVhULFxyXG4gIG9sZF92YWx1ZSBURVhULFxyXG4gIG5ld192YWx1ZSBURVhULFxyXG4gIGF0IFRFWFQgTk9UIE5VTExcclxuKTtcclxuQ1JFQVRFIElOREVYIGlkeF9hY3Rpdml0eV9pdGVtIE9OIGFjdGl2aXR5KGl0ZW1faWQpO1xyXG5DUkVBVEUgSU5ERVggaWR4X2FjdGl2aXR5X2F0IE9OIGFjdGl2aXR5KGF0KTtcclxuXHJcbkNSRUFURSBUQUJMRSBpdGVtX3ZlcnNpb25zIChcclxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIGl0ZW1faWQgVEVYVCBOT1QgTlVMTCxcclxuICB2ZXJzaW9uIElOVEVHRVIgTk9UIE5VTEwsXHJcbiAgdGl0bGUgVEVYVCBOT1QgTlVMTCxcclxuICBib2R5IFRFWFQgTk9UIE5VTEwsXHJcbiAgc2F2ZWRfYnkgVEVYVCBOT1QgTlVMTCxcclxuICBzYXZlZF9hdCBURVhUIE5PVCBOVUxMXHJcbik7XHJcbkNSRUFURSBJTkRFWCBpZHhfdmVyc2lvbnNfaXRlbSBPTiBpdGVtX3ZlcnNpb25zKGl0ZW1faWQsIHZlcnNpb24pO1xyXG5cclxuQ1JFQVRFIFRBQkxFIG1pbGVzdG9uZXMgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgbmFtZSBURVhUIE5PVCBOVUxMLFxyXG4gIGRlc2NyaXB0aW9uIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcclxuICB0YXJnZXRfZGF0ZSBURVhULFxyXG4gIHN0YXR1cyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ3BsYW5uZWQnLFxyXG4gIHNvcnQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXHJcbiAgc2FtcGxlIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxyXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcclxuKTtcclxuXHJcbkNSRUFURSBUQUJMRSByZWxlYXNlcyAoXHJcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXHJcbiAgdmVyc2lvbiBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXHJcbiAgdGFyZ2V0X2RhdGUgVEVYVCxcclxuICBzdGF0dXMgVEVYVCBOT1QgTlVMTCBERUZBVUxUICdwbGFubmVkJyxcclxuICBnb2FscyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXHJcbiAgbm90ZXMgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxyXG4gIHNhbXBsZSBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcclxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwXHJcbik7XHJcblxyXG5DUkVBVEUgVEFCTEUgc2F2ZWRfdmlld3MgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgbmFtZSBURVhUIE5PVCBOVUxMLFxyXG4gIGNvbmZpZyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ3t9JyxcclxuICBwaW5uZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXHJcbiAgY3JlYXRlZF9ieSBURVhUIE5PVCBOVUxMLFxyXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcclxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwXHJcbik7XHJcblxyXG4tLSBBcHBlbmQtb25seSBvcGVyYXRpb24gbG9nLiBTb3VyY2UgZm9yIHN5bmMgZXhwb3J0OyBwZWVycycgb3BzIHJlY29yZGVkIHdpdGggb3JpZ2luIGRldmljZS5cclxuQ1JFQVRFIFRBQkxFIG9wbG9nIChcclxuICBzZXEgSU5URUdFUiBQUklNQVJZIEtFWSBBVVRPSU5DUkVNRU5ULFxyXG4gIG9wX2lkIFRFWFQgTk9UIE5VTEwgVU5JUVVFLFxyXG4gIGRldmljZV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGFjdG9yX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgbGFtcG9ydCBJTlRFR0VSIE5PVCBOVUxMLFxyXG4gIGF0IFRFWFQgTk9UIE5VTEwsXHJcbiAgZW50aXR5IFRFWFQgTk9UIE5VTEwsXHJcbiAgZW50aXR5X2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgYWN0aW9uIFRFWFQgTk9UIE5VTEwsXHJcbiAgcGF5bG9hZCBURVhUIE5PVCBOVUxMXHJcbik7XHJcbkNSRUFURSBJTkRFWCBpZHhfb3Bsb2dfZW50aXR5IE9OIG9wbG9nKGVudGl0eSwgZW50aXR5X2lkKTtcclxuQ1JFQVRFIElOREVYIGlkeF9vcGxvZ19kZXZpY2UgT04gb3Bsb2coZGV2aWNlX2lkLCBzZXEpO1xyXG5cclxuLS0gRmllbGQtbGV2ZWwgd3JpdGUgcmVnaXN0cnkgZm9yIExXVyBtZXJnZTogbGFzdCAobGFtcG9ydCwgZGV2aWNlKSB0aGF0IHdyb3RlIGVhY2ggZmllbGQuXHJcbkNSRUFURSBUQUJMRSBmaWVsZF9jbG9jayAoXHJcbiAgZW50aXR5IFRFWFQgTk9UIE5VTEwsXHJcbiAgZW50aXR5X2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgZmllbGQgVEVYVCBOT1QgTlVMTCxcclxuICBsYW1wb3J0IElOVEVHRVIgTk9UIE5VTEwsXHJcbiAgZGV2aWNlX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgUFJJTUFSWSBLRVkgKGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZClcclxuKTtcclxuXHJcbkNSRUFURSBUQUJMRSBzeW5jX2NvbmZsaWN0cyAoXHJcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBlbnRpdHkgVEVYVCBOT1QgTlVMTCxcclxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcclxuICBmaWVsZCBURVhUIE5PVCBOVUxMLFxyXG4gIGxvY2FsX3ZhbHVlIFRFWFQgTk9UIE5VTEwsXHJcbiAgcmVtb3RlX3ZhbHVlIFRFWFQgTk9UIE5VTEwsXHJcbiAgcmVtb3RlX2RldmljZSBURVhUIE5PVCBOVUxMLFxyXG4gIHJlbW90ZV9hY3RvciBURVhUIE5PVCBOVUxMLFxyXG4gIGRldGVjdGVkX2F0IFRFWFQgTk9UIE5VTEwsXHJcbiAgcmVzb2x2ZWRfYXQgVEVYVCxcclxuICByZXNvbHV0aW9uIFRFWFRcclxuKTtcclxuXHJcbi0tIFBlci1wZWVyIGltcG9ydCBwcm9ncmVzczogaGlnaGVzdCBmaWxlIHNlcXVlbmNlIGNvbnN1bWVkIHBlciBkZXZpY2UuXHJcbkNSRUFURSBUQUJMRSBzeW5jX3BlZXJzIChcclxuICBkZXZpY2VfaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICB1c2VyX25hbWUgVEVYVCxcclxuICBsYXN0X2ZpbGUgVEVYVCxcclxuICBsYXN0X3NlZW5fYXQgVEVYVFxyXG4pO1xyXG5cclxuQ1JFQVRFIFZJUlRVQUwgVEFCTEUgaXRlbXNfZnRzIFVTSU5HIGZ0czUoXHJcbiAgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MsXHJcbiAgY29udGVudD0naXRlbXMnLCBjb250ZW50X3Jvd2lkPSdyb3dpZCcsXHJcbiAgdG9rZW5pemU9J3VuaWNvZGU2MSdcclxuKTtcclxuXHJcbkNSRUFURSBUUklHR0VSIGl0ZW1zX2Z0c19haSBBRlRFUiBJTlNFUlQgT04gaXRlbXMgQkVHSU5cclxuICBJTlNFUlQgSU5UTyBpdGVtc19mdHMocm93aWQsIGlkZW50LCB0aXRsZSwgYm9keV90ZXh0LCB0YWdzKVxyXG4gIFZBTFVFUyAobmV3LnJvd2lkLCBuZXcuaWRlbnQsIG5ldy50aXRsZSwgbmV3LmJvZHlfdGV4dCwgbmV3LnRhZ3MpO1xyXG5FTkQ7XHJcbkNSRUFURSBUUklHR0VSIGl0ZW1zX2Z0c19hZCBBRlRFUiBERUxFVEUgT04gaXRlbXMgQkVHSU5cclxuICBJTlNFUlQgSU5UTyBpdGVtc19mdHMoaXRlbXNfZnRzLCByb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXHJcbiAgVkFMVUVTICgnZGVsZXRlJywgb2xkLnJvd2lkLCBvbGQuaWRlbnQsIG9sZC50aXRsZSwgb2xkLmJvZHlfdGV4dCwgb2xkLnRhZ3MpO1xyXG5FTkQ7XHJcbkNSRUFURSBUUklHR0VSIGl0ZW1zX2Z0c19hdSBBRlRFUiBVUERBVEUgT04gaXRlbXMgQkVHSU5cclxuICBJTlNFUlQgSU5UTyBpdGVtc19mdHMoaXRlbXNfZnRzLCByb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXHJcbiAgVkFMVUVTICgnZGVsZXRlJywgb2xkLnJvd2lkLCBvbGQuaWRlbnQsIG9sZC50aXRsZSwgb2xkLmJvZHlfdGV4dCwgb2xkLnRhZ3MpO1xyXG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhyb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXHJcbiAgVkFMVUVTIChuZXcucm93aWQsIG5ldy5pZGVudCwgbmV3LnRpdGxlLCBuZXcuYm9keV90ZXh0LCBuZXcudGFncyk7XHJcbkVORDtcclxuYCxcclxuICB9LFxyXG4gIHtcclxuICAgIHZlcnNpb246IDIsXHJcbiAgICBuYW1lOiAncGVuZGluZy1vcHMtYnVmZmVyJyxcclxuICAgIHNxbDogYFxyXG4tLSBPcHMgdGhhdCBhcnJpdmVkIGJlZm9yZSB0aGUgY3JlYXRlIG9mIHRoZWlyIHRhcmdldCBlbnRpdHkgKHBvc3NpYmxlIHdpdGggMytcclxuLS0gZGV2aWNlcywgc2luY2Ugb3JkZXJpbmcgaXMgb25seSBndWFyYW50ZWVkIHBlciBkZXZpY2UpLiBCdWZmZXJlZCBoZXJlIGFuZFxyXG4tLSByZXBsYXllZCBvbmNlIHRoZSBjcmVhdGUgbGFuZHMuXHJcbkNSRUFURSBUQUJMRSBwZW5kaW5nX29wcyAoXHJcbiAgb3BfaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBkZXZpY2VfaWQgVEVYVCBOT1QgTlVMTCxcclxuICBhY3Rvcl9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGxhbXBvcnQgSU5URUdFUiBOT1QgTlVMTCxcclxuICBhdCBURVhUIE5PVCBOVUxMLFxyXG4gIGVudGl0eSBURVhUIE5PVCBOVUxMLFxyXG4gIGVudGl0eV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGFjdGlvbiBURVhUIE5PVCBOVUxMLFxyXG4gIHBheWxvYWQgVEVYVCBOT1QgTlVMTFxyXG4pO1xyXG5DUkVBVEUgSU5ERVggaWR4X3BlbmRpbmdfZW50aXR5IE9OIHBlbmRpbmdfb3BzKGVudGl0eSwgZW50aXR5X2lkKTtcclxuYCxcclxuICB9LFxyXG4gIHtcclxuICAgIHZlcnNpb246IDMsXHJcbiAgICBuYW1lOiAnZnVsbC1hdWRpdGFiaWxpdHknLFxyXG4gICAgc3FsOiBgXHJcbi0tIEV2ZXJ5IHVzZXItZGF0YSB0YWJsZSBnZXRzIGNyZWF0ZWQvdXBkYXRlZCBhdHRyaWJ1dGlvbiBhbmQgc29mdC1kZWxldGVcclxuLS0gYXR0cmlidXRpb24gc28gXCJ3aG8gY3JlYXRlZC9jaGFuZ2VkL2RlbGV0ZWQgdGhpcywgYW5kIHdoZW5cIiBpcyBhbHdheXMgYW5zd2VyYWJsZVxyXG4tLSBmcm9tIHRoZSBzY2hlbWEsIG5vdCBqdXN0IHRoZSBvcCBsb2cuXHJcblxyXG4tLSBNaWxlc3RvbmVzICsgcmVsZWFzZXMgaGFkIG5vIGF1ZGl0IGNvbHVtbnMgYXQgYWxsLlxyXG5BTFRFUiBUQUJMRSBtaWxlc3RvbmVzIEFERCBDT0xVTU4gY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJyc7XHJcbkFMVEVSIFRBQkxFIG1pbGVzdG9uZXMgQUREIENPTFVNTiBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuQUxURVIgVEFCTEUgbWlsZXN0b25lcyBBREQgQ09MVU1OIHVwZGF0ZWRfYXQgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnO1xyXG5BTFRFUiBUQUJMRSBtaWxlc3RvbmVzIEFERCBDT0xVTU4gdXBkYXRlZF9ieSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJyc7XHJcbkFMVEVSIFRBQkxFIHJlbGVhc2VzIEFERCBDT0xVTU4gY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJyc7XHJcbkFMVEVSIFRBQkxFIHJlbGVhc2VzIEFERCBDT0xVTU4gY3JlYXRlZF9ieSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJyc7XHJcbkFMVEVSIFRBQkxFIHJlbGVhc2VzIEFERCBDT0xVTU4gdXBkYXRlZF9hdCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJyc7XHJcbkFMVEVSIFRBQkxFIHJlbGVhc2VzIEFERCBDT0xVTU4gdXBkYXRlZF9ieSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJyc7XHJcblxyXG4tLSBDb21tZW50IGVkaXRzL2RlbGV0ZXMgd2VyZSB1bmF0dHJpYnV0ZWQuXHJcbkFMVEVSIFRBQkxFIGNvbW1lbnRzIEFERCBDT0xVTU4gdXBkYXRlZF9ieSBURVhUO1xyXG5BTFRFUiBUQUJMRSBjb21tZW50cyBBREQgQ09MVU1OIGRlbGV0ZWRfYXQgVEVYVDtcclxuQUxURVIgVEFCTEUgY29tbWVudHMgQUREIENPTFVNTiBkZWxldGVkX2J5IFRFWFQ7XHJcblxyXG4tLSBBdHRhY2htZW50IHJlbW92YWwgd2FzIHVuYXR0cmlidXRlZC5cclxuQUxURVIgVEFCTEUgYXR0YWNobWVudHMgQUREIENPTFVNTiBkZWxldGVkX2F0IFRFWFQ7XHJcbkFMVEVSIFRBQkxFIGF0dGFjaG1lbnRzIEFERCBDT0xVTU4gZGVsZXRlZF9ieSBURVhUO1xyXG5cclxuLS0gTGluayByZW1vdmFsIGF0dHJpYnV0aW9uIG9uIHRoZSByb3cgKG5vdCBvbmx5IGluIHRoZSBhY3Rpdml0eSBmZWVkKS5cclxuQUxURVIgVEFCTEUgbGlua3MgQUREIENPTFVNTiBkZWxldGVkX2F0IFRFWFQ7XHJcbkFMVEVSIFRBQkxFIGxpbmtzIEFERCBDT0xVTU4gZGVsZXRlZF9ieSBURVhUO1xyXG5cclxuLS0gU2F2ZWQgdmlldyAvIGl0ZW0gZGVsZXRlIGF0dHJpYnV0aW9uIG9uIHRoZSByb3cuXHJcbkFMVEVSIFRBQkxFIHNhdmVkX3ZpZXdzIEFERCBDT0xVTU4gdXBkYXRlZF9hdCBURVhUO1xyXG5BTFRFUiBUQUJMRSBzYXZlZF92aWV3cyBBREQgQ09MVU1OIHVwZGF0ZWRfYnkgVEVYVDtcclxuQUxURVIgVEFCTEUgc2F2ZWRfdmlld3MgQUREIENPTFVNTiBkZWxldGVkX2F0IFRFWFQ7XHJcbkFMVEVSIFRBQkxFIHNhdmVkX3ZpZXdzIEFERCBDT0xVTU4gZGVsZXRlZF9ieSBURVhUO1xyXG5BTFRFUiBUQUJMRSBpdGVtcyBBREQgQ09MVU1OIGRlbGV0ZWRfYXQgVEVYVDtcclxuQUxURVIgVEFCTEUgaXRlbXMgQUREIENPTFVNTiBkZWxldGVkX2J5IFRFWFQ7XHJcblxyXG4tLSBXaG8gcmVzb2x2ZWQgYSBzeW5jIGNvbmZsaWN0LlxyXG5BTFRFUiBUQUJMRSBzeW5jX2NvbmZsaWN0cyBBREQgQ09MVU1OIHJlc29sdmVkX2J5IFRFWFQ7XHJcblxyXG4tLSBCYWNrZmlsbCBleGlzdGluZyBtaWxlc3RvbmUvcmVsZWFzZSByb3dzIHNvIGF1ZGl0IHRpbWVzdGFtcHMgYXJlIG5ldmVyIGJsYW5rLlxyXG5VUERBVEUgbWlsZXN0b25lcyBTRVQgY3JlYXRlZF9hdCA9IGRhdGV0aW1lKCdub3cnKSwgdXBkYXRlZF9hdCA9IGRhdGV0aW1lKCdub3cnKSBXSEVSRSBjcmVhdGVkX2F0ID0gJyc7XHJcblVQREFURSByZWxlYXNlcyBTRVQgY3JlYXRlZF9hdCA9IGRhdGV0aW1lKCdub3cnKSwgdXBkYXRlZF9hdCA9IGRhdGV0aW1lKCdub3cnKSBXSEVSRSBjcmVhdGVkX2F0ID0gJyc7XHJcbmAsXHJcbiAgfSxcclxuICB7XHJcbiAgICB2ZXJzaW9uOiA0LFxyXG4gICAgbmFtZTogJ3VzZXItYXZhdGFyJyxcclxuICAgIHNxbDogYEFMVEVSIFRBQkxFIHVzZXJzIEFERCBDT0xVTU4gYXZhdGFyIFRFWFQ7YCxcclxuICB9LFxyXG5dO1xyXG4iLCAiLy8gU3RvcmU6IHRoZSBzaW5nbGUgd3JpdGUgcGF0aC4gRXZlcnkgbXV0YXRpb24gKGxvY2FsIG9yIHJlbW90ZSkgZmxvd3MgdGhyb3VnaCBoZXJlIHNvXHJcbi8vIFNRTGl0ZSBzdGF0ZSwgdGhlIG9wbG9nLCBmaWVsZCBjbG9ja3MsIGFjdGl2aXR5IGhpc3RvcnksIGFuZCBGVFMgc3RheSBjb25zaXN0ZW50LlxyXG4vL1xyXG4vLyBTeW5jIG1vZGVsIChzZWUgZG9jcy9TWU5DX0FSQ0hJVEVDVFVSRS5tZCk6XHJcbi8vIC0gTG9jYWwgbXV0YXRpb25zIGFwcGVuZCBmaWVsZC1ncmFudWxhciBvcHMgdG8gb3Bsb2cgKGxhbXBvcnQgY2xvY2sgKyBkZXZpY2UgaWQpLlxyXG4vLyAtICdzZXQnIG9wcyBjYXJyeSBiYXNlZE9uID0gdGhlIChsYW1wb3J0LGRldmljZSkgZWFjaCBmaWVsZCBoYWQgd2hlbiB3cml0dGVuLFxyXG4vLyAgIGxldHRpbmcgdGhlIGltcG9ydGVyIGRpc3Rpbmd1aXNoIGNsZWFuIGNhdXNhbCB1cGRhdGVzIGZyb20gdHJ1ZSBjb25jdXJyZW50IGVkaXRzLlxyXG4vLyAtIENvbmN1cnJlbnQgZWRpdHMgcmVzb2x2ZSBieSBMV1cgKGxhbXBvcnQsIGRldmljZUlkIHRpZWJyZWFrKS4gRm9yIGNvbnRlbnQgZmllbGRzXHJcbi8vICAgKHRpdGxlLCBib2R5KSB0aGUgbG9zaW5nIHZhbHVlIGlzIHByZXNlcnZlZCBpbiBzeW5jX2NvbmZsaWN0cyBmb3IgbWFudWFsIHJldmlldy5cclxuXHJcbmltcG9ydCBjcnlwdG8gZnJvbSAnbm9kZTpjcnlwdG8nO1xyXG5pbXBvcnQgdHlwZSB7IERCLCBEYkNvbnRleHQgfSBmcm9tICcuL2RiJztcclxuaW1wb3J0IHsgZ2V0TWV0YSwgc2V0TWV0YSB9IGZyb20gJy4vZGInO1xyXG5pbXBvcnQgdHlwZSB7XHJcbiAgSXRlbUZpbHRlcixcclxuICBJdGVtU29ydCxcclxuICBJdGVtVHlwZSxcclxuICBPcCxcclxuICBXb3JrSXRlbSxcclxuICBJdGVtTGluayxcclxuICBDb21tZW50LFxyXG4gIE1pbGVzdG9uZSxcclxuICBSZWxlYXNlLFxyXG4gIFNhdmVkVmlldyxcclxuICBVc2VyLFxyXG4gIExpbmtLaW5kLFxyXG4gIFNlYXJjaFJlc3VsdCxcclxuICBTeW5jQ29uZmxpY3QsXHJcbn0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcclxuaW1wb3J0IHsgSURFTlRfUFJFRklYLCBzdGF0dXNlc0ZvclR5cGUsIFRFUk1JTkFMX1NUQVRVU0VTIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcclxuaW1wb3J0IHsgZG9jVG9UZXh0IH0gZnJvbSAnLi4vLi4vc2hhcmVkL2RvYyc7XHJcblxyXG5jb25zdCBDT05GTElDVF9TVVJGQUNFRF9GSUVMRFMgPSBuZXcgU2V0KFsndGl0bGUnLCAnYm9keSddKTtcclxuXHJcbi8vIGNhbWVsQ2FzZSBmaWVsZCAtPiBpdGVtcyBjb2x1bW5cclxuY29uc3QgSVRFTV9DT0xTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xyXG4gIGlkZW50OiAnaWRlbnQnLFxyXG4gIHR5cGU6ICd0eXBlJyxcclxuICB0aXRsZTogJ3RpdGxlJyxcclxuICBib2R5OiAnYm9keScsXHJcbiAgYm9keVRleHQ6ICdib2R5X3RleHQnLFxyXG4gIHN0YXR1czogJ3N0YXR1cycsXHJcbiAgcHJpb3JpdHk6ICdwcmlvcml0eScsXHJcbiAgb3duZXJJZDogJ293bmVyX2lkJyxcclxuICByZXBvcnRlcklkOiAncmVwb3J0ZXJfaWQnLFxyXG4gIG1pbGVzdG9uZUlkOiAnbWlsZXN0b25lX2lkJyxcclxuICByZWxlYXNlSWQ6ICdyZWxlYXNlX2lkJyxcclxuICBwYXJlbnRJZDogJ3BhcmVudF9pZCcsXHJcbiAgc3RhcnREYXRlOiAnc3RhcnRfZGF0ZScsXHJcbiAgZHVlRGF0ZTogJ2R1ZV9kYXRlJyxcclxuICBjb21wbGV0ZWRBdDogJ2NvbXBsZXRlZF9hdCcsXHJcbiAgZWZmb3J0OiAnZWZmb3J0JyxcclxuICBjb25maWRlbmNlOiAnY29uZmlkZW5jZScsXHJcbiAgcmlza0xldmVsOiAncmlza19sZXZlbCcsXHJcbiAgYnVzaW5lc3NWYWx1ZTogJ2J1c2luZXNzX3ZhbHVlJyxcclxuICBsZWFkZXJzaGlwVmlzaWJsZTogJ2xlYWRlcnNoaXBfdmlzaWJsZScsXHJcbiAgcHJvZ3Jlc3M6ICdwcm9ncmVzcycsXHJcbiAgdGFnczogJ3RhZ3MnLFxyXG4gIGV4dHJhOiAnZXh0cmEnLFxyXG4gIGFyY2hpdmVkOiAnYXJjaGl2ZWQnLFxyXG4gIHNhbXBsZTogJ3NhbXBsZScsXHJcbiAgZGVsZXRlZDogJ2RlbGV0ZWQnLFxyXG4gIHVwZGF0ZWRBdDogJ3VwZGF0ZWRfYXQnLFxyXG4gIHVwZGF0ZWRCeTogJ3VwZGF0ZWRfYnknLFxyXG59O1xyXG5cclxuY29uc3QgSlNPTl9JVEVNX0ZJRUxEUyA9IG5ldyBTZXQoWyd0YWdzJywgJ2V4dHJhJ10pO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTdG9yZUV2ZW50cyB7XHJcbiAgb25DaGFuZ2U6ICh3aGF0OiB7IGVudGl0eTogc3RyaW5nOyBlbnRpdHlJZDogc3RyaW5nIH0pID0+IHZvaWQ7XHJcbiAgb25Db25mbGljdDogKGNvbmZsaWN0OiBTeW5jQ29uZmxpY3QpID0+IHZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdG9yZSB7XHJcbiAgcmVhZG9ubHkgZGI6IERCO1xyXG4gIHJlYWRvbmx5IGRldmljZUlkOiBzdHJpbmc7XHJcbiAgYWN0b3JJZDogc3RyaW5nO1xyXG4gIHByaXZhdGUgZXZlbnRzOiBTdG9yZUV2ZW50cztcclxuXHJcbiAgY29uc3RydWN0b3IoY3R4OiBEYkNvbnRleHQsIGFjdG9ySWQ6IHN0cmluZywgZXZlbnRzPzogUGFydGlhbDxTdG9yZUV2ZW50cz4pIHtcclxuICAgIHRoaXMuZGIgPSBjdHguZGI7XHJcbiAgICB0aGlzLmRldmljZUlkID0gY3R4LmRldmljZUlkO1xyXG4gICAgdGhpcy5hY3RvcklkID0gYWN0b3JJZDtcclxuICAgIHRoaXMuZXZlbnRzID0ge1xyXG4gICAgICBvbkNoYW5nZTogZXZlbnRzPy5vbkNoYW5nZSA/PyAoKCkgPT4ge30pLFxyXG4gICAgICBvbkNvbmZsaWN0OiBldmVudHM/Lm9uQ29uZmxpY3QgPz8gKCgpID0+IHt9KSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIGNsb2NrcyAtLS0tLS0tLS0tXHJcbiAgcHJpdmF0ZSB0aWNrTGFtcG9ydCgpOiBudW1iZXIge1xyXG4gICAgY29uc3QgY3VyID0gTnVtYmVyKGdldE1ldGEodGhpcy5kYiwgJ2xhbXBvcnQnKSA/PyAnMCcpICsgMTtcclxuICAgIHNldE1ldGEodGhpcy5kYiwgJ2xhbXBvcnQnLCBTdHJpbmcoY3VyKSk7XHJcbiAgICByZXR1cm4gY3VyO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB3aXRuZXNzTGFtcG9ydChyZW1vdGU6IG51bWJlcik6IHZvaWQge1xyXG4gICAgY29uc3QgY3VyID0gTnVtYmVyKGdldE1ldGEodGhpcy5kYiwgJ2xhbXBvcnQnKSA/PyAnMCcpO1xyXG4gICAgaWYgKHJlbW90ZSA+IGN1cikgc2V0TWV0YSh0aGlzLmRiLCAnbGFtcG9ydCcsIFN0cmluZyhyZW1vdGUpKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgbm93KCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBmaWVsZENsb2NrKGVudGl0eTogc3RyaW5nLCBlbnRpdHlJZDogc3RyaW5nLCBmaWVsZDogc3RyaW5nKTogeyBsYW1wb3J0OiBudW1iZXI7IGRldmljZUlkOiBzdHJpbmcgfSB8IG51bGwge1xyXG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIGxhbXBvcnQsIGRldmljZV9pZCBGUk9NIGZpZWxkX2Nsb2NrIFdIRVJFIGVudGl0eT0/IEFORCBlbnRpdHlfaWQ9PyBBTkQgZmllbGQ9PycpXHJcbiAgICAgIC5nZXQoZW50aXR5LCBlbnRpdHlJZCwgZmllbGQpIGFzIHsgbGFtcG9ydDogbnVtYmVyOyBkZXZpY2VfaWQ6IHN0cmluZyB9IHwgdW5kZWZpbmVkO1xyXG4gICAgcmV0dXJuIHJvdyA/IHsgbGFtcG9ydDogcm93LmxhbXBvcnQsIGRldmljZUlkOiByb3cuZGV2aWNlX2lkIH0gOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZXRGaWVsZENsb2NrKGVudGl0eTogc3RyaW5nLCBlbnRpdHlJZDogc3RyaW5nLCBmaWVsZDogc3RyaW5nLCBsYW1wb3J0OiBudW1iZXIsIGRldmljZUlkOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgYElOU0VSVCBJTlRPIGZpZWxkX2Nsb2NrKGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZCwgbGFtcG9ydCwgZGV2aWNlX2lkKSBWQUxVRVMoPyw/LD8sPyw/KVxyXG4gICAgICAgICBPTiBDT05GTElDVChlbnRpdHksIGVudGl0eV9pZCwgZmllbGQpIERPIFVQREFURSBTRVQgbGFtcG9ydD1leGNsdWRlZC5sYW1wb3J0LCBkZXZpY2VfaWQ9ZXhjbHVkZWQuZGV2aWNlX2lkYCxcclxuICAgICAgKVxyXG4gICAgICAucnVuKGVudGl0eSwgZW50aXR5SWQsIGZpZWxkLCBsYW1wb3J0LCBkZXZpY2VJZCk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIG9wbG9nIC0tLS0tLS0tLS1cclxuICBwcml2YXRlIGFwcGVuZE9wKG9wOiBPcCk6IHZvaWQge1xyXG4gICAgdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZShcclxuICAgICAgICBgSU5TRVJUIElOVE8gb3Bsb2cob3BfaWQsIGRldmljZV9pZCwgYWN0b3JfaWQsIGxhbXBvcnQsIGF0LCBlbnRpdHksIGVudGl0eV9pZCwgYWN0aW9uLCBwYXlsb2FkKVxyXG4gICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LD8pYCxcclxuICAgICAgKVxyXG4gICAgICAucnVuKG9wLm9wSWQsIG9wLmRldmljZUlkLCBvcC5hY3RvcklkLCBvcC5sYW1wb3J0LCBvcC5hdCwgb3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgb3AuYWN0aW9uLCBKU09OLnN0cmluZ2lmeShvcC5wYXlsb2FkKSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGxvY2FsT3AoXHJcbiAgICBlbnRpdHk6IE9wWydlbnRpdHknXSxcclxuICAgIGVudGl0eUlkOiBzdHJpbmcsXHJcbiAgICBhY3Rpb246IE9wWydhY3Rpb24nXSxcclxuICAgIHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxyXG4gICk6IE9wIHtcclxuICAgIGNvbnN0IGxhbXBvcnQgPSB0aGlzLnRpY2tMYW1wb3J0KCk7XHJcbiAgICBjb25zdCBvcDogT3AgPSB7XHJcbiAgICAgIG9wSWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXHJcbiAgICAgIGRldmljZUlkOiB0aGlzLmRldmljZUlkLFxyXG4gICAgICBhY3RvcklkOiB0aGlzLmFjdG9ySWQsXHJcbiAgICAgIGxhbXBvcnQsXHJcbiAgICAgIGF0OiB0aGlzLm5vdygpLFxyXG4gICAgICBlbnRpdHksXHJcbiAgICAgIGVudGl0eUlkLFxyXG4gICAgICBhY3Rpb24sXHJcbiAgICAgIHBheWxvYWQsXHJcbiAgICB9O1xyXG4gICAgdGhpcy5hcHBlbmRPcChvcCk7XHJcbiAgICByZXR1cm4gb3A7XHJcbiAgfVxyXG5cclxuICAvKiogTG9jYWwgJ3NldCc6IHJlY29yZHMgYmFzZWRPbiBjbG9ja3MgdGhlbiBhZHZhbmNlcyB0aGVtLiAqL1xyXG4gIHByaXZhdGUgbG9jYWxTZXQoZW50aXR5OiBPcFsnZW50aXR5J10sIGVudGl0eUlkOiBzdHJpbmcsIGZpZWxkczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkIHtcclxuICAgIGNvbnN0IGJhc2VkT246IFJlY29yZDxzdHJpbmcsIHsgbGFtcG9ydDogbnVtYmVyOyBkZXZpY2VJZDogc3RyaW5nIH0gfCBudWxsPiA9IHt9O1xyXG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKGZpZWxkcykpIGJhc2VkT25bZl0gPSB0aGlzLmZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZik7XHJcbiAgICBjb25zdCBvcCA9IHRoaXMubG9jYWxPcChlbnRpdHksIGVudGl0eUlkLCAnc2V0JywgeyBmaWVsZHMsIGJhc2VkT24gfSk7XHJcbiAgICBmb3IgKGNvbnN0IGYgb2YgT2JqZWN0LmtleXMoZmllbGRzKSkgdGhpcy5zZXRGaWVsZENsb2NrKGVudGl0eSwgZW50aXR5SWQsIGYsIG9wLmxhbXBvcnQsIHRoaXMuZGV2aWNlSWQpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBsb2NhbENyZWF0ZShlbnRpdHk6IE9wWydlbnRpdHknXSwgZW50aXR5SWQ6IHN0cmluZywgcmVjb3JkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQge1xyXG4gICAgY29uc3Qgb3AgPSB0aGlzLmxvY2FsT3AoZW50aXR5LCBlbnRpdHlJZCwgJ2NyZWF0ZScsIHsgcmVjb3JkIH0pO1xyXG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKHJlY29yZCkpIHRoaXMuc2V0RmllbGRDbG9jayhlbnRpdHksIGVudGl0eUlkLCBmLCBvcC5sYW1wb3J0LCB0aGlzLmRldmljZUlkKTtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gaWRlbnQgYWxsb2NhdGlvbiAtLS0tLS0tLS0tXHJcbiAgYWxsb2NJZGVudCh0eXBlOiBJdGVtVHlwZSk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBwcmVmaXggPSBJREVOVF9QUkVGSVhbdHlwZV07XHJcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBuZXh0IEZST00gaWRlbnRfY291bnRlcnMgV0hFUkUgdHlwZT0/JykuZ2V0KHR5cGUpIGFzXHJcbiAgICAgIHwgeyBuZXh0OiBudW1iZXIgfVxyXG4gICAgICB8IHVuZGVmaW5lZDtcclxuICAgIGxldCBuID0gcm93ID8gcm93Lm5leHQgOiAxO1xyXG4gICAgLy8gU2tpcCBudW1iZXJzIGFscmVhZHkgdGFrZW4gKGltcG9ydHMgbWF5IGhhdmUgYWR2YW5jZWQgdXNhZ2UgcGFzdCBvdXIgY291bnRlcikuXHJcbiAgICB3aGlsZSAodGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIGl0ZW1zIFdIRVJFIGlkZW50PT8nKS5nZXQoYCR7cHJlZml4fS0ke259YCkpIG4rKztcclxuICAgIHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIGlkZW50X2NvdW50ZXJzKHR5cGUsbmV4dCkgVkFMVUVTKD8sPykgT04gQ09ORkxJQ1QodHlwZSkgRE8gVVBEQVRFIFNFVCBuZXh0PT8nKVxyXG4gICAgICAucnVuKHR5cGUsIG4gKyAxLCBuICsgMSk7XHJcbiAgICByZXR1cm4gYCR7cHJlZml4fS0ke259YDtcclxuICB9XHJcblxyXG4gIC8qKiBBZHZhbmNlIHRoZSBsb2NhbCBjb3VudGVyIHBhc3QgYW4gaWRlbnQgb2JzZXJ2ZWQgZnJvbSBhIHBlZXIuICovXHJcbiAgcHJpdmF0ZSB3aXRuZXNzSWRlbnQodHlwZTogSXRlbVR5cGUsIGlkZW50OiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGNvbnN0IG0gPSAvLShcXGQrKSQvLmV4ZWMoaWRlbnQpO1xyXG4gICAgaWYgKCFtKSByZXR1cm47XHJcbiAgICBjb25zdCBuID0gTnVtYmVyKG1bMV0pO1xyXG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgbmV4dCBGUk9NIGlkZW50X2NvdW50ZXJzIFdIRVJFIHR5cGU9PycpLmdldCh0eXBlKSBhc1xyXG4gICAgICB8IHsgbmV4dDogbnVtYmVyIH1cclxuICAgICAgfCB1bmRlZmluZWQ7XHJcbiAgICBpZiAoIXJvdyB8fCByb3cubmV4dCA8PSBuKSB7XHJcbiAgICAgIHRoaXMuZGJcclxuICAgICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gaWRlbnRfY291bnRlcnModHlwZSxuZXh0KSBWQUxVRVMoPyw/KSBPTiBDT05GTElDVCh0eXBlKSBETyBVUERBVEUgU0VUIG5leHQ9PycpXHJcbiAgICAgICAgLnJ1bih0eXBlLCBuICsgMSwgbiArIDEpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBhY3Rpdml0eSAtLS0tLS0tLS0tXHJcbiAgLyoqIFB1YmxpYyBhY3Rpdml0eSBob29rIGZvciBjb2xsYWJvcmF0b3JzIG91dHNpZGUgU3RvcmUgKGUuZy4gQXR0YWNobWVudE1hbmFnZXIpLiAqL1xyXG4gIHJlY29yZEFjdGl2aXR5KGl0ZW1JZDogc3RyaW5nIHwgbnVsbCwga2luZDogc3RyaW5nLCBvbGRWPzogdW5rbm93biwgbmV3Vj86IHVua25vd24pOiB2b2lkIHtcclxuICAgIHRoaXMubG9nQWN0aXZpdHkoaXRlbUlkLCBraW5kLCBudWxsLCBvbGRWLCBuZXdWKTtcclxuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnYWN0aXZpdHknLCBlbnRpdHlJZDogaXRlbUlkID8/ICcqJyB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGBhY3RvcklkYC9gYXRgIGRlZmF1bHQgdG8gdXMgYW5kIG5vdywgd2hpY2ggaXMgcmlnaHQgZm9yIGxvY2FsIGVkaXRzLiBPcHMgYXBwbGllZCBmcm9tXHJcbiAgICogYSB0ZWFtbWF0ZSBwYXNzIHRoZWlyIG93biBcdTIwMTQgYWN0aXZpdHkgaXMgbm90IGEgc3luY2VkIGVudGl0eSAodGhlIG9wLWxvZyBhbHJlYWR5IGNhcnJpZXNcclxuICAgKiB3aG8gZGlkIHdoYXQgYW5kIHdoZW4pLCBzbyByZW1vdGUgYWN0aXZpdHkgaXMgZGVyaXZlZCBoZXJlIGZyb20gdGhlIG9wLCBub3Qgc2hpcHBlZC5cclxuICAgKi9cclxuICBwcml2YXRlIGxvZ0FjdGl2aXR5KFxyXG4gICAgaXRlbUlkOiBzdHJpbmcgfCBudWxsLFxyXG4gICAga2luZDogc3RyaW5nLFxyXG4gICAgZmllbGQ/OiBzdHJpbmcgfCBudWxsLFxyXG4gICAgb2xkVj86IHVua25vd24sXHJcbiAgICBuZXdWPzogdW5rbm93bixcclxuICAgIGFjdG9ySWQ/OiBzdHJpbmcsXHJcbiAgICBhdD86IHN0cmluZyxcclxuICAgIGlkPzogc3RyaW5nLFxyXG4gICk6IG51bWJlciB7XHJcbiAgICBjb25zdCBpbmZvID0gdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIGFjdGl2aXR5KGlkLCBpdGVtX2lkLCBhY3Rvcl9pZCwga2luZCwgZmllbGQsIG9sZF92YWx1ZSwgbmV3X3ZhbHVlLCBhdCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyknKVxyXG4gICAgICAucnVuKFxyXG4gICAgICAgIGlkID8/IGNyeXB0by5yYW5kb21VVUlEKCksXHJcbiAgICAgICAgaXRlbUlkLFxyXG4gICAgICAgIGFjdG9ySWQgPz8gdGhpcy5hY3RvcklkLFxyXG4gICAgICAgIGtpbmQsXHJcbiAgICAgICAgZmllbGQgPz8gbnVsbCxcclxuICAgICAgICBvbGRWID09IG51bGwgPyBudWxsIDogU3RyaW5nKG9sZFYpLnNsaWNlKDAsIDgwMDApLFxyXG4gICAgICAgIG5ld1YgPT0gbnVsbCA/IG51bGwgOiBTdHJpbmcobmV3Vikuc2xpY2UoMCwgODAwMCksXHJcbiAgICAgICAgYXQgPz8gdGhpcy5ub3coKSxcclxuICAgICAgKTtcclxuICAgIHJldHVybiBpbmZvLmNoYW5nZXM7XHJcbiAgfVxyXG5cclxuICAvKiogU3RhYmxlIHBlci1vcCBhY3Rpdml0eSBpZCwgc28gZGVyaXZpbmcgdGhlIHNhbWUgb3AgdHdpY2UgaXMgYSBuby1vcC4gKi9cclxuICBwcml2YXRlIG9wQWN0aXZpdHlJZChvcElkOiBzdHJpbmcsIGZpZWxkPzogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBmaWVsZCA/IGAke29wSWR9OiR7ZmllbGR9YCA6IG9wSWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWJ1aWxkIGFjdGl2aXR5IGZvciBvcHMgdGhhdCBhcnJpdmVkIGZyb20gb3RoZXIgZGV2aWNlcyBiZWZvcmUgd2UgZGVyaXZlZCBhY3Rpdml0eSBvblxyXG4gICAqIGFwcGx5IChpLmUuIGEgdGVhbW1hdGUncyB3aG9sZSBoaXN0b3J5IHRvIGRhdGUpLiBJZHMgY29tZSBmcm9tIHRoZSBvcCBpZCBhbmQgaW5zZXJ0cyBhcmVcclxuICAgKiBPUiBJR05PUkUsIHNvIHRoaXMgaXMgaWRlbXBvdGVudCBhbmQgY2Fubm90IGRvdWJsZSB1cCB3aXRoIHRoZSBsaXZlIGFwcGx5IHBhdGggXHUyMDE0IHNhZmUgdG9cclxuICAgKiBydW4gb24gZXZlcnkgYm9vdC5cclxuICAgKlxyXG4gICAqIE9sZCB2YWx1ZXMgYXJlIG5vdCByZWNvdmVyYWJsZSBmb3IgJ3NldCcgb3BzICh0aGUgb3AgY2FycmllcyB0aGUgbmV3IHZhbHVlIGFuZCBhIGNhdXNhbFxyXG4gICAqIGJhc2UsIG5vdCB0aGUgcHJpb3IgdmFsdWUpLCBzbyB0aG9zZSBlbnRyaWVzIHJlbmRlciBhcyBcImNoYW5nZWQgWCB0byBZXCIgd2l0aG91dCBhIGZyb20uXHJcbiAgICovXHJcbiAgYmFja2ZpbGxSZW1vdGVBY3Rpdml0eSgpOiBudW1iZXIge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgYFNFTEVDVCBvcF9pZCwgYWN0b3JfaWQsIGF0LCBlbnRpdHksIGVudGl0eV9pZCwgYWN0aW9uLCBwYXlsb2FkIEZST00gb3Bsb2dcclxuICAgICAgICAgIFdIRVJFIGRldmljZV9pZCAhPSA/IEFORCBlbnRpdHkgSU4gKCdpdGVtJywnY29tbWVudCcpYCxcclxuICAgICAgKVxyXG4gICAgICAuYWxsKHRoaXMuZGV2aWNlSWQpIGFzIEFycmF5PHtcclxuICAgICAgb3BfaWQ6IHN0cmluZzsgYWN0b3JfaWQ6IHN0cmluZzsgYXQ6IHN0cmluZzsgZW50aXR5OiBzdHJpbmc7IGVudGl0eV9pZDogc3RyaW5nO1xyXG4gICAgICBhY3Rpb246IHN0cmluZzsgcGF5bG9hZDogc3RyaW5nO1xyXG4gICAgfT47XHJcblxyXG4gICAgbGV0IGFkZGVkID0gMDtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIGZvciAoY29uc3QgciBvZiByb3dzKSB7XHJcbiAgICAgICAgbGV0IHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gICAgICAgIHRyeSB7IHBheWxvYWQgPSBKU09OLnBhcnNlKHIucGF5bG9hZCB8fCAne30nKTsgfSBjYXRjaCB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgY29uc3QgcmVjb3JkID0gKHBheWxvYWQucmVjb3JkID8/IHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuXHJcbiAgICAgICAgaWYgKHIuZW50aXR5ID09PSAnY29tbWVudCcpIHtcclxuICAgICAgICAgIGlmIChyLmFjdGlvbiAhPT0gJ2NyZWF0ZScpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgYWRkZWQgKz0gdGhpcy5sb2dBY3Rpdml0eShcclxuICAgICAgICAgICAgKHJlY29yZC5pdGVtSWQgYXMgc3RyaW5nKSA/PyBudWxsLCAnY29tbWVudCcsIG51bGwsIG51bGwsXHJcbiAgICAgICAgICAgIFN0cmluZyhyZWNvcmQuYm9keVRleHQgPz8gJycpLnNsaWNlKDAsIDIwMCksXHJcbiAgICAgICAgICAgIHIuYWN0b3JfaWQsIHIuYXQsIHRoaXMub3BBY3Rpdml0eUlkKHIub3BfaWQpLFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHIuYWN0aW9uID09PSAnY3JlYXRlJykge1xyXG4gICAgICAgICAgYWRkZWQgKz0gdGhpcy5sb2dBY3Rpdml0eShcclxuICAgICAgICAgICAgci5lbnRpdHlfaWQsICdjcmVhdGVkJywgbnVsbCwgbnVsbCwgcmVjb3JkLnRpdGxlLFxyXG4gICAgICAgICAgICByLmFjdG9yX2lkLCByLmF0LCB0aGlzLm9wQWN0aXZpdHlJZChyLm9wX2lkKSxcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChyLmFjdGlvbiA9PT0gJ3NldCcpIHtcclxuICAgICAgICAgIGNvbnN0IGZpZWxkcyA9IChwYXlsb2FkLmZpZWxkcyA/PyB7fSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcbiAgICAgICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XHJcbiAgICAgICAgICAgIGlmIChrID09PSAndXBkYXRlZEF0JyB8fCBrID09PSAndXBkYXRlZEJ5JyB8fCBrID09PSAnYm9keScgfHwgayA9PT0gJ2JvZHlUZXh0JykgY29udGludWU7XHJcbiAgICAgICAgICAgIGFkZGVkICs9IHRoaXMubG9nQWN0aXZpdHkoXHJcbiAgICAgICAgICAgICAgci5lbnRpdHlfaWQsICd1cGRhdGVkJywgaywgbnVsbCwgSlNPTl9JVEVNX0ZJRUxEUy5oYXMoaykgPyBKU09OLnN0cmluZ2lmeSh2KSA6IHYsXHJcbiAgICAgICAgICAgICAgci5hY3Rvcl9pZCwgci5hdCwgdGhpcy5vcEFjdGl2aXR5SWQoci5vcF9pZCwgayksXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoJ2JvZHknIGluIGZpZWxkcyB8fCAnYm9keVRleHQnIGluIGZpZWxkcykge1xyXG4gICAgICAgICAgICBhZGRlZCArPSB0aGlzLmxvZ0FjdGl2aXR5KFxyXG4gICAgICAgICAgICAgIHIuZW50aXR5X2lkLCAnZWRpdGVkJywgJ2JvZHknLCBudWxsLCBTdHJpbmcoZmllbGRzLmJvZHlUZXh0ID8/ICcnKSxcclxuICAgICAgICAgICAgICByLmFjdG9yX2lkLCByLmF0LCB0aGlzLm9wQWN0aXZpdHlJZChyLm9wX2lkLCAnYm9keScpLFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoci5hY3Rpb24gPT09ICdkZWxldGUnKSB7XHJcbiAgICAgICAgICBhZGRlZCArPSB0aGlzLmxvZ0FjdGl2aXR5KFxyXG4gICAgICAgICAgICByLmVudGl0eV9pZCwgJ2RlbGV0ZWQnLCBudWxsLCBudWxsLCBudWxsLFxyXG4gICAgICAgICAgICByLmFjdG9yX2lkLCByLmF0LCB0aGlzLm9wQWN0aXZpdHlJZChyLm9wX2lkKSxcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICByZXR1cm4gYWRkZWQ7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIGl0ZW1zIC0tLS0tLS0tLS1cclxuICBjcmVhdGVJdGVtKGlucHV0OiBQYXJ0aWFsPFdvcmtJdGVtPiAmIHsgdHlwZTogSXRlbVR5cGU7IHRpdGxlOiBzdHJpbmcgfSk6IFdvcmtJdGVtIHtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGlkID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcclxuICAgICAgY29uc3QgaWRlbnQgPSB0aGlzLmFsbG9jSWRlbnQoaW5wdXQudHlwZSk7XHJcbiAgICAgIGNvbnN0IG5vdyA9IHRoaXMubm93KCk7XHJcbiAgICAgIGNvbnN0IHN0YXR1c2VzID0gc3RhdHVzZXNGb3JUeXBlKGlucHV0LnR5cGUpO1xyXG4gICAgICBjb25zdCBpdGVtOiBXb3JrSXRlbSA9IHtcclxuICAgICAgICBpZCxcclxuICAgICAgICBpZGVudCxcclxuICAgICAgICB0eXBlOiBpbnB1dC50eXBlLFxyXG4gICAgICAgIHRpdGxlOiBpbnB1dC50aXRsZSxcclxuICAgICAgICBib2R5OiBpbnB1dC5ib2R5ID8/ICcnLFxyXG4gICAgICAgIGJvZHlUZXh0OiBpbnB1dC5ib2R5VGV4dCA/PyAnJyxcclxuICAgICAgICBzdGF0dXM6IGlucHV0LnN0YXR1cyAmJiBzdGF0dXNlcy5pbmNsdWRlcyhpbnB1dC5zdGF0dXMpID8gaW5wdXQuc3RhdHVzIDogc3RhdHVzZXNbMF0sXHJcbiAgICAgICAgcHJpb3JpdHk6IGlucHV0LnByaW9yaXR5ID8/ICdub25lJyxcclxuICAgICAgICBvd25lcklkOiBpbnB1dC5vd25lcklkID8/IG51bGwsXHJcbiAgICAgICAgcmVwb3J0ZXJJZDogaW5wdXQucmVwb3J0ZXJJZCA/PyB0aGlzLmFjdG9ySWQsXHJcbiAgICAgICAgbWlsZXN0b25lSWQ6IGlucHV0Lm1pbGVzdG9uZUlkID8/IG51bGwsXHJcbiAgICAgICAgcmVsZWFzZUlkOiBpbnB1dC5yZWxlYXNlSWQgPz8gbnVsbCxcclxuICAgICAgICBwYXJlbnRJZDogaW5wdXQucGFyZW50SWQgPz8gbnVsbCxcclxuICAgICAgICBzdGFydERhdGU6IGlucHV0LnN0YXJ0RGF0ZSA/PyBudWxsLFxyXG4gICAgICAgIGR1ZURhdGU6IGlucHV0LmR1ZURhdGUgPz8gbnVsbCxcclxuICAgICAgICBjb21wbGV0ZWRBdDogbnVsbCxcclxuICAgICAgICBlZmZvcnQ6IGlucHV0LmVmZm9ydCA/PyBudWxsLFxyXG4gICAgICAgIGNvbmZpZGVuY2U6IGlucHV0LmNvbmZpZGVuY2UgPz8gbnVsbCxcclxuICAgICAgICByaXNrTGV2ZWw6IGlucHV0LnJpc2tMZXZlbCA/PyBudWxsLFxyXG4gICAgICAgIGJ1c2luZXNzVmFsdWU6IGlucHV0LmJ1c2luZXNzVmFsdWUgPz8gbnVsbCxcclxuICAgICAgICBsZWFkZXJzaGlwVmlzaWJsZTogaW5wdXQubGVhZGVyc2hpcFZpc2libGUgPz8gMCxcclxuICAgICAgICBwcm9ncmVzczogaW5wdXQucHJvZ3Jlc3MgPz8gbnVsbCxcclxuICAgICAgICB0YWdzOiBpbnB1dC50YWdzID8/IFtdLFxyXG4gICAgICAgIGV4dHJhOiBpbnB1dC5leHRyYSA/PyB7fSxcclxuICAgICAgICBhcmNoaXZlZDogMCxcclxuICAgICAgICBzYW1wbGU6IGlucHV0LnNhbXBsZSA/PyAwLFxyXG4gICAgICAgIGNyZWF0ZWRBdDogbm93LFxyXG4gICAgICAgIHVwZGF0ZWRBdDogbm93LFxyXG4gICAgICAgIGNyZWF0ZWRCeTogdGhpcy5hY3RvcklkLFxyXG4gICAgICAgIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkLFxyXG4gICAgICB9O1xyXG4gICAgICB0aGlzLmluc2VydEl0ZW1Sb3coaXRlbSk7XHJcbiAgICAgIHRoaXMubG9jYWxDcmVhdGUoJ2l0ZW0nLCBpZCwgdGhpcy5pdGVtVG9SZWNvcmQoaXRlbSkpO1xyXG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KGlkLCAnY3JlYXRlZCcsIG51bGwsIG51bGwsIGl0ZW0udGl0bGUpO1xyXG4gICAgICByZXR1cm4gaXRlbTtcclxuICAgIH0pO1xyXG4gICAgY29uc3QgaXRlbSA9IHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaXRlbS5pZCB9KTtcclxuICAgIHJldHVybiBpdGVtO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpdGVtVG9SZWNvcmQoaXRlbTogV29ya0l0ZW0pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XHJcbiAgICByZXR1cm4geyAuLi5pdGVtLCB0YWdzOiBpdGVtLnRhZ3MsIGV4dHJhOiBpdGVtLmV4dHJhIH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGluc2VydEl0ZW1Sb3coaTogV29ya0l0ZW0pOiB2b2lkIHtcclxuICAgIHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgYElOU0VSVCBJTlRPIGl0ZW1zKGlkLCBpZGVudCwgdHlwZSwgdGl0bGUsIGJvZHksIGJvZHlfdGV4dCwgc3RhdHVzLCBwcmlvcml0eSwgb3duZXJfaWQsIHJlcG9ydGVyX2lkLFxyXG4gICAgICAgICAgbWlsZXN0b25lX2lkLCByZWxlYXNlX2lkLCBwYXJlbnRfaWQsIHN0YXJ0X2RhdGUsIGR1ZV9kYXRlLCBjb21wbGV0ZWRfYXQsIGVmZm9ydCwgY29uZmlkZW5jZSxcclxuICAgICAgICAgIHJpc2tfbGV2ZWwsIGJ1c2luZXNzX3ZhbHVlLCBsZWFkZXJzaGlwX3Zpc2libGUsIHByb2dyZXNzLCB0YWdzLCBleHRyYSwgYXJjaGl2ZWQsIHNhbXBsZSwgZGVsZXRlZCxcclxuICAgICAgICAgIGNyZWF0ZWRfYXQsIHVwZGF0ZWRfYXQsIGNyZWF0ZWRfYnksIHVwZGF0ZWRfYnkpXHJcbiAgICAgICAgIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sMCw/LD8sPyw/KWAsXHJcbiAgICAgIClcclxuICAgICAgLnJ1bihcclxuICAgICAgICBpLmlkLCBpLmlkZW50LCBpLnR5cGUsIGkudGl0bGUsIGkuYm9keSwgaS5ib2R5VGV4dCwgaS5zdGF0dXMsIGkucHJpb3JpdHksIGkub3duZXJJZCwgaS5yZXBvcnRlcklkLFxyXG4gICAgICAgIGkubWlsZXN0b25lSWQsIGkucmVsZWFzZUlkLCBpLnBhcmVudElkLCBpLnN0YXJ0RGF0ZSwgaS5kdWVEYXRlLCBpLmNvbXBsZXRlZEF0LCBpLmVmZm9ydCwgaS5jb25maWRlbmNlLFxyXG4gICAgICAgIGkucmlza0xldmVsLCBpLmJ1c2luZXNzVmFsdWUsIGkubGVhZGVyc2hpcFZpc2libGUsIGkucHJvZ3Jlc3MsIEpTT04uc3RyaW5naWZ5KGkudGFncyksIEpTT04uc3RyaW5naWZ5KGkuZXh0cmEpLFxyXG4gICAgICAgIGkuYXJjaGl2ZWQsIGkuc2FtcGxlLCBpLmNyZWF0ZWRBdCwgaS51cGRhdGVkQXQsIGkuY3JlYXRlZEJ5LCBpLnVwZGF0ZWRCeSxcclxuICAgICAgKTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZUl0ZW0oaWQ6IHN0cmluZywgZmllbGRzOiBQYXJ0aWFsPFdvcmtJdGVtPik6IFdvcmtJdGVtIHwgbnVsbCB7XHJcbiAgICBjb25zdCBiZWZvcmUgPSB0aGlzLmdldEl0ZW0oaWQpO1xyXG4gICAgaWYgKCFiZWZvcmUpIHJldHVybiBudWxsO1xyXG4gICAgY29uc3QgY2hhbmdlZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcclxuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKGZpZWxkcykpIHtcclxuICAgICAgaWYgKCEoayBpbiBJVEVNX0NPTFMpIHx8IGsgPT09ICdkZWxldGVkJykgY29udGludWU7XHJcbiAgICAgIGNvbnN0IHByZXYgPSAoYmVmb3JlIGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tdO1xyXG4gICAgICBjb25zdCBzYW1lID0gSlNPTl9JVEVNX0ZJRUxEUy5oYXMoaykgPyBKU09OLnN0cmluZ2lmeShwcmV2KSA9PT0gSlNPTi5zdHJpbmdpZnkodikgOiBwcmV2ID09PSB2O1xyXG4gICAgICBpZiAoIXNhbWUpIGNoYW5nZWRba10gPSB2O1xyXG4gICAgfVxyXG4gICAgaWYgKE9iamVjdC5rZXlzKGNoYW5nZWQpLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGJlZm9yZTtcclxuXHJcbiAgICAvLyBTdGF0dXMgdHJhbnNpdGlvbnMgbWFpbnRhaW4gY29tcGxldGVkQXQgYXV0b21hdGljYWxseS5cclxuICAgIGlmICgnc3RhdHVzJyBpbiBjaGFuZ2VkKSB7XHJcbiAgICAgIGNvbnN0IHRlcm1pbmFsTm93ID0gVEVSTUlOQUxfU1RBVFVTRVMuaGFzKFN0cmluZyhjaGFuZ2VkLnN0YXR1cykpO1xyXG4gICAgICBjb25zdCB0ZXJtaW5hbEJlZm9yZSA9IFRFUk1JTkFMX1NUQVRVU0VTLmhhcyhiZWZvcmUuc3RhdHVzKTtcclxuICAgICAgaWYgKHRlcm1pbmFsTm93ICYmICF0ZXJtaW5hbEJlZm9yZSkgY2hhbmdlZC5jb21wbGV0ZWRBdCA9IHRoaXMubm93KCk7XHJcbiAgICAgIGlmICghdGVybWluYWxOb3cgJiYgdGVybWluYWxCZWZvcmUpIGNoYW5nZWQuY29tcGxldGVkQXQgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgY2hhbmdlZC51cGRhdGVkQXQgPSB0aGlzLm5vdygpO1xyXG4gICAgY2hhbmdlZC51cGRhdGVkQnkgPSB0aGlzLmFjdG9ySWQ7XHJcblxyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoaWQsIGNoYW5nZWQpO1xyXG4gICAgICB0aGlzLmxvY2FsU2V0KCdpdGVtJywgaWQsIGNoYW5nZWQpO1xyXG4gICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhjaGFuZ2VkKSkge1xyXG4gICAgICAgIGlmIChrID09PSAndXBkYXRlZEF0JyB8fCBrID09PSAndXBkYXRlZEJ5JykgY29udGludWU7XHJcbiAgICAgICAgaWYgKGsgPT09ICdib2R5JyB8fCBrID09PSAnYm9keVRleHQnKSBjb250aW51ZTsgLy8gYm9keSBlZGl0cyBsb2dnZWQgYXMgb25lICdlZGl0ZWQnIGVudHJ5XHJcbiAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShpZCwgJ3VwZGF0ZWQnLCBrLCAoYmVmb3JlIGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tdLCBKU09OX0lURU1fRklFTERTLmhhcyhrKSA/IEpTT04uc3RyaW5naWZ5KHYpIDogdik7XHJcbiAgICAgIH1cclxuICAgICAgLy8gQm9keSBlZGl0OiByZWNvcmQgb2xkL25ldyBwbGFpbiB0ZXh0IHNvIHRoZSBhY3Rpdml0eSBkaWZmIGNhbiBzaG93IGJlZm9yZS9hZnRlci5cclxuICAgICAgaWYgKCdib2R5JyBpbiBjaGFuZ2VkIHx8ICdib2R5VGV4dCcgaW4gY2hhbmdlZCkge1xyXG4gICAgICAgIGNvbnN0IG5ld1RleHQgPSAnYm9keVRleHQnIGluIGNoYW5nZWQgPyBTdHJpbmcoY2hhbmdlZC5ib2R5VGV4dCA/PyAnJykgOiBiZWZvcmUuYm9keVRleHQ7XHJcbiAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShpZCwgJ2VkaXRlZCcsICdib2R5JywgYmVmb3JlLmJvZHlUZXh0LCBuZXdUZXh0KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdpdGVtJywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0SXRlbShpZCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFwcGx5SXRlbUZpZWxkcyhpZDogc3RyaW5nLCBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XHJcbiAgICBjb25zdCBzZXRzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgY29uc3QgdmFsczogdW5rbm93bltdID0gW107XHJcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XHJcbiAgICAgIGNvbnN0IGNvbCA9IElURU1fQ09MU1trXTtcclxuICAgICAgaWYgKCFjb2wpIGNvbnRpbnVlO1xyXG4gICAgICBzZXRzLnB1c2goYCR7Y29sfT0/YCk7XHJcbiAgICAgIHZhbHMucHVzaChKU09OX0lURU1fRklFTERTLmhhcyhrKSA/IEpTT04uc3RyaW5naWZ5KHYpIDogdik7XHJcbiAgICB9XHJcbiAgICBpZiAoc2V0cy5sZW5ndGggPT09IDApIHJldHVybjtcclxuICAgIHZhbHMucHVzaChpZCk7XHJcbiAgICB0aGlzLmRiLnByZXBhcmUoYFVQREFURSBpdGVtcyBTRVQgJHtzZXRzLmpvaW4oJywgJyl9IFdIRVJFIGlkPT9gKS5ydW4oLi4udmFscyk7XHJcbiAgfVxyXG5cclxuICBhcmNoaXZlSXRlbShpZDogc3RyaW5nLCBhcmNoaXZlZDogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgLy8gdXBkYXRlSXRlbSBhbHJlYWR5IHdyaXRlcyB0aGUgYWN0aXZpdHkgZW50cnkgZm9yIHRoZSBhcmNoaXZlZC1maWVsZCBjaGFuZ2UuXHJcbiAgICB0aGlzLnVwZGF0ZUl0ZW0oaWQsIHsgYXJjaGl2ZWQ6IGFyY2hpdmVkID8gMSA6IDAgfSBhcyBQYXJ0aWFsPFdvcmtJdGVtPik7XHJcbiAgfVxyXG5cclxuICBkZWxldGVJdGVtKGlkOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGNvbnN0IHN0YW1wID0gdGhpcy5ub3coKTtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGl0ZW1zIFNFVCBkZWxldGVkPTEsIGRlbGV0ZWRfYXQ9PywgZGVsZXRlZF9ieT0/LCB1cGRhdGVkX2F0PT8sIHVwZGF0ZWRfYnk9PyBXSEVSRSBpZD0/JylcclxuICAgICAgICAucnVuKHN0YW1wLCB0aGlzLmFjdG9ySWQsIHN0YW1wLCB0aGlzLmFjdG9ySWQsIGlkKTtcclxuICAgICAgdGhpcy5sb2NhbE9wKCdpdGVtJywgaWQsICdkZWxldGUnLCB7fSk7XHJcbiAgICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsICdkZWxldGVkJyk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaWQgfSk7XHJcbiAgfVxyXG5cclxuICBnZXRJdGVtKGlkOiBzdHJpbmcpOiBXb3JrSXRlbSB8IG51bGwge1xyXG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIGl0ZW1zIFdIRVJFIGlkPT8gQU5EIGRlbGV0ZWQ9MCcpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XHJcbiAgICByZXR1cm4gcm93ID8gcm93VG9JdGVtKHJvdykgOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgZ2V0SXRlbUJ5SWRlbnQoaWRlbnQ6IHN0cmluZyk6IFdvcmtJdGVtIHwgbnVsbCB7XHJcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PyBDT0xMQVRFIE5PQ0FTRSBBTkQgZGVsZXRlZD0wJykuZ2V0KGlkZW50KSBhc1xyXG4gICAgICB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+XHJcbiAgICAgIHwgdW5kZWZpbmVkO1xyXG4gICAgcmV0dXJuIHJvdyA/IHJvd1RvSXRlbShyb3cpIDogbnVsbDtcclxuICB9XHJcblxyXG4gIGxpc3RJdGVtcyhmaWx0ZXI6IEl0ZW1GaWx0ZXIgPSB7fSwgc29ydDogSXRlbVNvcnQgPSB7IGZpZWxkOiAndXBkYXRlZEF0JywgZGlyOiAnZGVzYycgfSwgbGltaXQgPSA1MDAsIG9mZnNldCA9IDApOiBXb3JrSXRlbVtdIHtcclxuICAgIGNvbnN0IHdoZXJlOiBzdHJpbmdbXSA9IFsnZGVsZXRlZD0wJ107XHJcbiAgICBjb25zdCB2YWxzOiB1bmtub3duW10gPSBbXTtcclxuICAgIGlmIChmaWx0ZXIuYXJjaGl2ZWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB3aGVyZS5wdXNoKCdhcmNoaXZlZD0/Jyk7XHJcbiAgICAgIHZhbHMucHVzaChmaWx0ZXIuYXJjaGl2ZWQgPyAxIDogMCk7XHJcbiAgICB9IGVsc2Ugd2hlcmUucHVzaCgnYXJjaGl2ZWQ9MCcpO1xyXG4gICAgaWYgKGZpbHRlci50eXBlcz8ubGVuZ3RoKSB7XHJcbiAgICAgIHdoZXJlLnB1c2goYHR5cGUgSU4gKCR7ZmlsdGVyLnR5cGVzLm1hcCgoKSA9PiAnPycpLmpvaW4oJywnKX0pYCk7XHJcbiAgICAgIHZhbHMucHVzaCguLi5maWx0ZXIudHlwZXMpO1xyXG4gICAgfVxyXG4gICAgaWYgKGZpbHRlci5zdGF0dXNlcz8ubGVuZ3RoKSB7XHJcbiAgICAgIHdoZXJlLnB1c2goYHN0YXR1cyBJTiAoJHtmaWx0ZXIuc3RhdHVzZXMubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcclxuICAgICAgdmFscy5wdXNoKC4uLmZpbHRlci5zdGF0dXNlcyk7XHJcbiAgICB9XHJcbiAgICBpZiAoZmlsdGVyLnByaW9yaXRpZXM/Lmxlbmd0aCkge1xyXG4gICAgICB3aGVyZS5wdXNoKGBwcmlvcml0eSBJTiAoJHtmaWx0ZXIucHJpb3JpdGllcy5tYXAoKCkgPT4gJz8nKS5qb2luKCcsJyl9KWApO1xyXG4gICAgICB2YWxzLnB1c2goLi4uZmlsdGVyLnByaW9yaXRpZXMpO1xyXG4gICAgfVxyXG4gICAgaWYgKGZpbHRlci5vd25lcklkcz8ubGVuZ3RoKSB7XHJcbiAgICAgIGNvbnN0IG5vbk51bGwgPSBmaWx0ZXIub3duZXJJZHMuZmlsdGVyKChvKSA9PiBvICE9PSBudWxsKTtcclxuICAgICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgIGlmIChub25OdWxsLmxlbmd0aCkge1xyXG4gICAgICAgIHBhcnRzLnB1c2goYG93bmVyX2lkIElOICgke25vbk51bGwubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcclxuICAgICAgICB2YWxzLnB1c2goLi4ubm9uTnVsbCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGZpbHRlci5vd25lcklkcy5pbmNsdWRlcyhudWxsKSkgcGFydHMucHVzaCgnb3duZXJfaWQgSVMgTlVMTCcpO1xyXG4gICAgICB3aGVyZS5wdXNoKGAoJHtwYXJ0cy5qb2luKCcgT1IgJyl9KWApO1xyXG4gICAgfVxyXG4gICAgaWYgKGZpbHRlci5taWxlc3RvbmVJZCkgeyB3aGVyZS5wdXNoKCdtaWxlc3RvbmVfaWQ9PycpOyB2YWxzLnB1c2goZmlsdGVyLm1pbGVzdG9uZUlkKTsgfVxyXG4gICAgaWYgKGZpbHRlci5yZWxlYXNlSWQpIHsgd2hlcmUucHVzaCgncmVsZWFzZV9pZD0/Jyk7IHZhbHMucHVzaChmaWx0ZXIucmVsZWFzZUlkKTsgfVxyXG4gICAgaWYgKGZpbHRlci5wYXJlbnRJZCkgeyB3aGVyZS5wdXNoKCdwYXJlbnRfaWQ9PycpOyB2YWxzLnB1c2goZmlsdGVyLnBhcmVudElkKTsgfVxyXG4gICAgaWYgKGZpbHRlci50YWcpIHsgd2hlcmUucHVzaChcInRhZ3MgTElLRSA/XCIpOyB2YWxzLnB1c2goYCUke0pTT04uc3RyaW5naWZ5KGZpbHRlci50YWcpfSVgKTsgfVxyXG4gICAgaWYgKGZpbHRlci5vdmVyZHVlKSB7IHdoZXJlLnB1c2goXCJkdWVfZGF0ZSBJUyBOT1QgTlVMTCBBTkQgZHVlX2RhdGUgPCBkYXRlKCdub3cnKSBBTkQgY29tcGxldGVkX2F0IElTIE5VTExcIik7IH1cclxuICAgIGlmIChmaWx0ZXIuZHVlV2l0aGluRGF5cyAhPSBudWxsKSB7XHJcbiAgICAgIHdoZXJlLnB1c2goXCJkdWVfZGF0ZSBJUyBOT1QgTlVMTCBBTkQgZHVlX2RhdGUgPD0gZGF0ZSgnbm93JywgPykgQU5EIGNvbXBsZXRlZF9hdCBJUyBOVUxMXCIpO1xyXG4gICAgICB2YWxzLnB1c2goYCske2ZpbHRlci5kdWVXaXRoaW5EYXlzfSBkYXlzYCk7XHJcbiAgICB9XHJcbiAgICBpZiAoZmlsdGVyLmxlYWRlcnNoaXBWaXNpYmxlKSB3aGVyZS5wdXNoKCdsZWFkZXJzaGlwX3Zpc2libGU9MScpO1xyXG4gICAgaWYgKGZpbHRlci51cGRhdGVkU2luY2UpIHsgd2hlcmUucHVzaCgndXBkYXRlZF9hdCA+PSA/Jyk7IHZhbHMucHVzaChmaWx0ZXIudXBkYXRlZFNpbmNlKTsgfVxyXG4gICAgaWYgKGZpbHRlci5zYW1wbGUgIT09IHVuZGVmaW5lZCkgeyB3aGVyZS5wdXNoKCdzYW1wbGU9PycpOyB2YWxzLnB1c2goZmlsdGVyLnNhbXBsZSA/IDEgOiAwKTsgfVxyXG4gICAgaWYgKGZpbHRlci50ZXh0KSB7XHJcbiAgICAgIHdoZXJlLnB1c2goJ3Jvd2lkIElOIChTRUxFQ1Qgcm93aWQgRlJPTSBpdGVtc19mdHMgV0hFUkUgaXRlbXNfZnRzIE1BVENIID8pJyk7XHJcbiAgICAgIHZhbHMucHVzaChmdHNRdWVyeShmaWx0ZXIudGV4dCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNvcnRDb2w6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgICAgIGlkZW50OiAnaWRlbnQnLFxyXG4gICAgICB0aXRsZTogJ3RpdGxlIENPTExBVEUgTk9DQVNFJyxcclxuICAgICAgc3RhdHVzOiAnc3RhdHVzJyxcclxuICAgICAgcHJpb3JpdHk6IFwiQ0FTRSBwcmlvcml0eSBXSEVOICd1cmdlbnQnIFRIRU4gMCBXSEVOICdoaWdoJyBUSEVOIDEgV0hFTiAnbWVkaXVtJyBUSEVOIDIgV0hFTiAnbG93JyBUSEVOIDMgRUxTRSA0IEVORFwiLFxyXG4gICAgICBkdWVEYXRlOiAnZHVlX2RhdGUgSVMgTlVMTCwgZHVlX2RhdGUnLFxyXG4gICAgICBjcmVhdGVkQXQ6ICdjcmVhdGVkX2F0JyxcclxuICAgICAgdXBkYXRlZEF0OiAndXBkYXRlZF9hdCcsXHJcbiAgICAgIG1hbnVhbDogJ3VwZGF0ZWRfYXQnLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IG9yZGVyID0gYCR7c29ydENvbFtzb3J0LmZpZWxkXSA/PyAndXBkYXRlZF9hdCd9ICR7c29ydC5kaXIgPT09ICdhc2MnID8gJ0FTQycgOiAnREVTQyd9YDtcclxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKGBTRUxFQ1QgKiBGUk9NIGl0ZW1zIFdIRVJFICR7d2hlcmUuam9pbignIEFORCAnKX0gT1JERVIgQlkgJHtvcmRlcn0gTElNSVQgPyBPRkZTRVQgP2ApXHJcbiAgICAgIC5hbGwoLi4udmFscywgbGltaXQsIG9mZnNldCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIHJldHVybiByb3dzLm1hcChyb3dUb0l0ZW0pO1xyXG4gIH1cclxuXHJcbiAgc2VhcmNoKHRleHQ6IHN0cmluZywgbGltaXQgPSAzMCk6IFNlYXJjaFJlc3VsdFtdIHtcclxuICAgIGlmICghdGV4dC50cmltKCkpIHJldHVybiBbXTtcclxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgIGBTRUxFQ1QgaXRlbXMuKiwgc25pcHBldChpdGVtc19mdHMsIDIsICc8PCcsICc+PicsICdcdTIwMjYnLCAxMikgQVMgc25pcCwgcmFuayBBUyBzY29yZVxyXG4gICAgICAgICBGUk9NIGl0ZW1zX2Z0cyBKT0lOIGl0ZW1zIE9OIGl0ZW1zLnJvd2lkID0gaXRlbXNfZnRzLnJvd2lkXHJcbiAgICAgICAgIFdIRVJFIGl0ZW1zX2Z0cyBNQVRDSCA/IEFORCBpdGVtcy5kZWxldGVkPTAgQU5EIGl0ZW1zLmFyY2hpdmVkPTBcclxuICAgICAgICAgT1JERVIgQlkgcmFuayBMSU1JVCA/YCxcclxuICAgICAgKVxyXG4gICAgICAuYWxsKGZ0c1F1ZXJ5KHRleHQpLCBsaW1pdCkgYXMgKFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYgeyBzbmlwOiBzdHJpbmc7IHNjb3JlOiBudW1iZXIgfSlbXTtcclxuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHsgaXRlbTogcm93VG9JdGVtKHIpLCBzbmlwcGV0OiByLnNuaXAsIHNjb3JlOiByLnNjb3JlIH0pKTtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gbGlua3MgLS0tLS0tLS0tLVxyXG4gIGFkZExpbmsoZnJvbUlkOiBzdHJpbmcsIHRvSWQ6IHN0cmluZywga2luZDogTGlua0tpbmQpOiBJdGVtTGluayB8IG51bGwge1xyXG4gICAgaWYgKGZyb21JZCA9PT0gdG9JZCkgcmV0dXJuIG51bGw7XHJcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gbGlua3MgV0hFUkUgZnJvbV9pZD0/IEFORCB0b19pZD0/IEFORCBraW5kPT8nKVxyXG4gICAgICAuZ2V0KGZyb21JZCwgdG9JZCwga2luZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XHJcbiAgICBpZiAoZXhpc3RpbmcgJiYgIWV4aXN0aW5nLmRlbGV0ZWQpIHJldHVybiByb3dUb0xpbmsoZXhpc3RpbmcpO1xyXG4gICAgY29uc3QgbGluazogSXRlbUxpbmsgPSB7XHJcbiAgICAgIGlkOiBleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5pZCkgOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxyXG4gICAgICBmcm9tSWQsXHJcbiAgICAgIHRvSWQsXHJcbiAgICAgIGtpbmQsXHJcbiAgICAgIGNyZWF0ZWRBdDogdGhpcy5ub3coKSxcclxuICAgICAgY3JlYXRlZEJ5OiB0aGlzLmFjdG9ySWQsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgaWYgKGV4aXN0aW5nKSB7XHJcbiAgICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgbGlua3MgU0VUIGRlbGV0ZWQ9MCBXSEVSRSBpZD0/JykucnVuKGxpbmsuaWQpO1xyXG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ2xpbmsnLCBsaW5rLmlkLCB7IGRlbGV0ZWQ6IDAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIGxpbmtzKGlkLCBmcm9tX2lkLCB0b19pZCwga2luZCwgZGVsZXRlZCwgY3JlYXRlZF9hdCwgY3JlYXRlZF9ieSkgVkFMVUVTKD8sPyw/LD8sMCw/LD8pJylcclxuICAgICAgICAgIC5ydW4obGluay5pZCwgZnJvbUlkLCB0b0lkLCBraW5kLCBsaW5rLmNyZWF0ZWRBdCwgbGluay5jcmVhdGVkQnkpO1xyXG4gICAgICAgIHRoaXMubG9jYWxDcmVhdGUoJ2xpbmsnLCBsaW5rLmlkLCB7IC4uLmxpbmsgfSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5sb2dBY3Rpdml0eShmcm9tSWQsICdsaW5rJywga2luZCwgbnVsbCwgdG9JZCk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2xpbmsnLCBlbnRpdHlJZDogbGluay5pZCB9KTtcclxuICAgIHJldHVybiBsaW5rO1xyXG4gIH1cclxuXHJcbiAgcmVtb3ZlTGluayhpZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBmcm9tX2lkLCBraW5kLCB0b19pZCBGUk9NIGxpbmtzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzXHJcbiAgICAgIHwgeyBmcm9tX2lkOiBzdHJpbmc7IGtpbmQ6IHN0cmluZzsgdG9faWQ6IHN0cmluZyB9XHJcbiAgICAgIHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgbGlua3MgU0VUIGRlbGV0ZWQ9MSBXSEVSRSBpZD0/JykucnVuKGlkKTtcclxuICAgICAgdGhpcy5sb2NhbFNldCgnbGluaycsIGlkLCB7IGRlbGV0ZWQ6IDEgfSk7XHJcbiAgICAgIGlmIChyb3cpIHRoaXMubG9nQWN0aXZpdHkocm93LmZyb21faWQsICd1bmxpbmsnLCByb3cua2luZCwgcm93LnRvX2lkLCBudWxsKTtcclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnbGluaycsIGVudGl0eUlkOiBpZCB9KTtcclxuICB9XHJcblxyXG4gIGxpbmtzRm9yKGl0ZW1JZDogc3RyaW5nKTogeyBsaW5rOiBJdGVtTGluazsgZGlyZWN0aW9uOiAnb3V0JyB8ICdpbic7IG90aGVyOiBXb3JrSXRlbSB9W10ge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gbGlua3MgV0hFUkUgKGZyb21faWQ9PyBPUiB0b19pZD0/KSBBTkQgZGVsZXRlZD0wJylcclxuICAgICAgLmFsbChpdGVtSWQsIGl0ZW1JZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIGNvbnN0IG91dDogeyBsaW5rOiBJdGVtTGluazsgZGlyZWN0aW9uOiAnb3V0JyB8ICdpbic7IG90aGVyOiBXb3JrSXRlbSB9W10gPSBbXTtcclxuICAgIGZvciAoY29uc3QgciBvZiByb3dzKSB7XHJcbiAgICAgIGNvbnN0IGxpbmsgPSByb3dUb0xpbmsocik7XHJcbiAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGxpbmsuZnJvbUlkID09PSBpdGVtSWQgPyAnb3V0JyA6ICdpbic7XHJcbiAgICAgIGNvbnN0IG90aGVyID0gdGhpcy5nZXRJdGVtKGRpcmVjdGlvbiA9PT0gJ291dCcgPyBsaW5rLnRvSWQgOiBsaW5rLmZyb21JZCk7XHJcbiAgICAgIGlmIChvdGhlcikgb3V0LnB1c2goeyBsaW5rLCBkaXJlY3Rpb24sIG90aGVyIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG91dDtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gY29tbWVudHMgLS0tLS0tLS0tLVxyXG4gIGFkZENvbW1lbnQoaXRlbUlkOiBzdHJpbmcsIGJvZHk6IHN0cmluZywgYm9keVRleHQ6IHN0cmluZyk6IENvbW1lbnQge1xyXG4gICAgY29uc3QgYzogQ29tbWVudCA9IHtcclxuICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXHJcbiAgICAgIGl0ZW1JZCxcclxuICAgICAgYXV0aG9ySWQ6IHRoaXMuYWN0b3JJZCxcclxuICAgICAgYm9keSxcclxuICAgICAgYm9keVRleHQsXHJcbiAgICAgIGNyZWF0ZWRBdDogdGhpcy5ub3coKSxcclxuICAgICAgdXBkYXRlZEF0OiBudWxsLFxyXG4gICAgICBkZWxldGVkOiAwLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIHRoaXMuZGJcclxuICAgICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gY29tbWVudHMoaWQsIGl0ZW1faWQsIGF1dGhvcl9pZCwgYm9keSwgYm9keV90ZXh0LCBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPywwKScpXHJcbiAgICAgICAgLnJ1bihjLmlkLCBjLml0ZW1JZCwgYy5hdXRob3JJZCwgYy5ib2R5LCBjLmJvZHlUZXh0LCBjLmNyZWF0ZWRBdCwgYy51cGRhdGVkQXQpO1xyXG4gICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdjb21tZW50JywgYy5pZCwgeyAuLi5jIH0pO1xyXG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KGl0ZW1JZCwgJ2NvbW1lbnQnLCBudWxsLCBudWxsLCBib2R5VGV4dC5zbGljZSgwLCAyMDApKTtcclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnY29tbWVudCcsIGVudGl0eUlkOiBjLmlkIH0pO1xyXG4gICAgcmV0dXJuIGM7XHJcbiAgfVxyXG5cclxuICB1cGRhdGVDb21tZW50KGlkOiBzdHJpbmcsIGJvZHk6IHN0cmluZywgYm9keVRleHQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaXRlbV9pZCBGUk9NIGNvbW1lbnRzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIHsgaXRlbV9pZDogc3RyaW5nIH0gfCB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCBmaWVsZHMgPSB7IGJvZHksIGJvZHlUZXh0LCB1cGRhdGVkQXQ6IHRoaXMubm93KCksIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH07XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBjb21tZW50cyBTRVQgYm9keT0/LCBib2R5X3RleHQ9PywgdXBkYXRlZF9hdD0/LCB1cGRhdGVkX2J5PT8gV0hFUkUgaWQ9PycpXHJcbiAgICAgICAgLnJ1bihib2R5LCBib2R5VGV4dCwgZmllbGRzLnVwZGF0ZWRBdCwgZmllbGRzLnVwZGF0ZWRCeSwgaWQpO1xyXG4gICAgICB0aGlzLmxvY2FsU2V0KCdjb21tZW50JywgaWQsIGZpZWxkcyk7XHJcbiAgICAgIGlmIChyb3cpIHRoaXMubG9nQWN0aXZpdHkocm93Lml0ZW1faWQsICdjb21tZW50X2VkaXRlZCcsIG51bGwsIG51bGwsIGJvZHlUZXh0LnNsaWNlKDAsIDIwMCkpO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdjb21tZW50JywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gIH1cclxuXHJcbiAgZGVsZXRlQ29tbWVudChpZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpdGVtX2lkLCBib2R5X3RleHQgRlJPTSBjb21tZW50cyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhc1xyXG4gICAgICB8IHsgaXRlbV9pZDogc3RyaW5nOyBib2R5X3RleHQ6IHN0cmluZyB9XHJcbiAgICAgIHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3Qgc3RhbXAgPSB0aGlzLm5vdygpO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgY29tbWVudHMgU0VUIGRlbGV0ZWQ9MSwgZGVsZXRlZF9hdD0/LCBkZWxldGVkX2J5PT8gV0hFUkUgaWQ9PycpLnJ1bihzdGFtcCwgdGhpcy5hY3RvcklkLCBpZCk7XHJcbiAgICAgIHRoaXMubG9jYWxTZXQoJ2NvbW1lbnQnLCBpZCwgeyBkZWxldGVkOiAxLCBkZWxldGVkQXQ6IHN0YW1wLCBkZWxldGVkQnk6IHRoaXMuYWN0b3JJZCB9KTtcclxuICAgICAgaWYgKHJvdykgdGhpcy5sb2dBY3Rpdml0eShyb3cuaXRlbV9pZCwgJ2NvbW1lbnRfZGVsZXRlZCcsIG51bGwsIHJvdy5ib2R5X3RleHQuc2xpY2UoMCwgMjAwKSwgbnVsbCk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2NvbW1lbnQnLCBlbnRpdHlJZDogaWQgfSk7XHJcbiAgfVxyXG5cclxuICBjb21tZW50c0ZvcihpdGVtSWQ6IHN0cmluZyk6IENvbW1lbnRbXSB7XHJcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZSgnU0VMRUNUICogRlJPTSBjb21tZW50cyBXSEVSRSBpdGVtX2lkPT8gQU5EIGRlbGV0ZWQ9MCBPUkRFUiBCWSBjcmVhdGVkX2F0IEFTQycpXHJcbiAgICAgIC5hbGwoaXRlbUlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xyXG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xyXG4gICAgICBpZDogU3RyaW5nKHIuaWQpLFxyXG4gICAgICBpdGVtSWQ6IFN0cmluZyhyLml0ZW1faWQpLFxyXG4gICAgICBhdXRob3JJZDogU3RyaW5nKHIuYXV0aG9yX2lkKSxcclxuICAgICAgYm9keTogU3RyaW5nKHIuYm9keSksXHJcbiAgICAgIGJvZHlUZXh0OiBTdHJpbmcoci5ib2R5X3RleHQpLFxyXG4gICAgICBjcmVhdGVkQXQ6IFN0cmluZyhyLmNyZWF0ZWRfYXQpLFxyXG4gICAgICB1cGRhdGVkQXQ6IHIudXBkYXRlZF9hdCA/IFN0cmluZyhyLnVwZGF0ZWRfYXQpIDogbnVsbCxcclxuICAgICAgZGVsZXRlZDogMCxcclxuICAgIH0pKTtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gdmVyc2lvbnMgLS0tLS0tLS0tLVxyXG4gIHNhdmVWZXJzaW9uKGl0ZW1JZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRJdGVtKGl0ZW1JZCk7XHJcbiAgICBpZiAoIWl0ZW0pIHJldHVybjtcclxuICAgIGNvbnN0IGxhc3QgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBNQVgodmVyc2lvbikgQVMgdiBGUk9NIGl0ZW1fdmVyc2lvbnMgV0hFUkUgaXRlbV9pZD0/JykuZ2V0KGl0ZW1JZCkgYXMgeyB2OiBudW1iZXIgfCBudWxsIH07XHJcbiAgICB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBpdGVtX3ZlcnNpb25zKGlkLCBpdGVtX2lkLCB2ZXJzaW9uLCB0aXRsZSwgYm9keSwgc2F2ZWRfYnksIHNhdmVkX2F0KSBWQUxVRVMoPyw/LD8sPyw/LD8sPyknKVxyXG4gICAgICAucnVuKGNyeXB0by5yYW5kb21VVUlEKCksIGl0ZW1JZCwgKGxhc3QudiA/PyAwKSArIDEsIGl0ZW0udGl0bGUsIGl0ZW0uYm9keSwgdGhpcy5hY3RvcklkLCB0aGlzLm5vdygpKTtcclxuICB9XHJcblxyXG4gIHZlcnNpb25zRm9yKGl0ZW1JZDogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIGlkLCBpdGVtX2lkIEFTIGl0ZW1JZCwgdmVyc2lvbiwgdGl0bGUsIGJvZHksIHNhdmVkX2J5IEFTIHNhdmVkQnksIHNhdmVkX2F0IEFTIHNhdmVkQXQgRlJPTSBpdGVtX3ZlcnNpb25zIFdIRVJFIGl0ZW1faWQ9PyBPUkRFUiBCWSB2ZXJzaW9uIERFU0MnKVxyXG4gICAgICAuYWxsKGl0ZW1JZCk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIHVzZXJzIC0tLS0tLS0tLS1cclxuICB1cHNlcnRVc2VyKHU6IHsgaWQ6IHN0cmluZzsgbmFtZTogc3RyaW5nOyBpbml0aWFsczogc3RyaW5nOyBjb2xvcjogc3RyaW5nIH0pOiBVc2VyIHtcclxuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHVzZXJzIFdIRVJFIGlkPT8nKS5nZXQodS5pZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCB1c2VyOiBVc2VyID0ge1xyXG4gICAgICAuLi51LFxyXG4gICAgICBjcmVhdGVkQXQ6IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmNyZWF0ZWRfYXQpIDogdGhpcy5ub3coKSxcclxuICAgIH07XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICB0aGlzLmRiXHJcbiAgICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgICBgSU5TRVJUIElOVE8gdXNlcnMoaWQsIG5hbWUsIGluaXRpYWxzLCBjb2xvciwgY3JlYXRlZF9hdCkgVkFMVUVTKD8sPyw/LD8sPylcclxuICAgICAgICAgICBPTiBDT05GTElDVChpZCkgRE8gVVBEQVRFIFNFVCBuYW1lPWV4Y2x1ZGVkLm5hbWUsIGluaXRpYWxzPWV4Y2x1ZGVkLmluaXRpYWxzLCBjb2xvcj1leGNsdWRlZC5jb2xvcmAsXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC5ydW4odXNlci5pZCwgdXNlci5uYW1lLCB1c2VyLmluaXRpYWxzLCB1c2VyLmNvbG9yLCB1c2VyLmNyZWF0ZWRBdCk7XHJcbiAgICAgIGlmICghZXhpc3RpbmcpIHRoaXMubG9jYWxDcmVhdGUoJ3VzZXInLCB1c2VyLmlkLCB7IC4uLnVzZXIgfSk7XHJcbiAgICAgIGVsc2UgdGhpcy5sb2NhbFNldCgndXNlcicsIHVzZXIuaWQsIHsgbmFtZTogdXNlci5uYW1lLCBpbml0aWFsczogdXNlci5pbml0aWFscywgY29sb3I6IHVzZXIuY29sb3IgfSk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICByZXR1cm4gdXNlcjtcclxuICB9XHJcblxyXG4gIGxpc3RVc2VycygpOiBVc2VyW10ge1xyXG4gICAgcmV0dXJuICh0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBhdmF0YXIsIGNyZWF0ZWRfYXQgQVMgY3JlYXRlZEF0IEZST00gdXNlcnMnKS5hbGwoKSBhcyBVc2VyW10pO1xyXG4gIH1cclxuXHJcbiAgLyoqIFNldCAob3IgY2xlYXIsIHdpdGggbnVsbCkgYSB1c2VyJ3MgYXZhdGFyIGltYWdlLiBFbWl0cyBhIHN5bmNlZCAnc2V0JyBvcC4gKi9cclxuICBzZXRVc2VyQXZhdGFyKGlkOiBzdHJpbmcsIGF2YXRhcjogc3RyaW5nIHwgbnVsbCk6IFVzZXIgfCBudWxsIHtcclxuICAgIGNvbnN0IGV4aXN0cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIDEgRlJPTSB1c2VycyBXSEVSRSBpZD0/JykuZ2V0KGlkKTtcclxuICAgIGlmICghZXhpc3RzKSByZXR1cm4gbnVsbDtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIHVzZXJzIFNFVCBhdmF0YXI9PyBXSEVSRSBpZD0/JykucnVuKGF2YXRhciwgaWQpO1xyXG4gICAgICB0aGlzLmxvY2FsU2V0KCd1c2VyJywgaWQsIHsgYXZhdGFyIH0pO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICd1c2VyJywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gICAgcmV0dXJuIHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBhdmF0YXIsIGNyZWF0ZWRfYXQgQVMgY3JlYXRlZEF0IEZST00gdXNlcnMgV0hFUkUgaWQ9PycpXHJcbiAgICAgIC5nZXQoaWQpIGFzIFVzZXI7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIG1pbGVzdG9uZXMgLyByZWxlYXNlcyAtLS0tLS0tLS0tXHJcbiAgdXBzZXJ0TWlsZXN0b25lKG06IFBhcnRpYWw8TWlsZXN0b25lPiAmIHsgbmFtZTogc3RyaW5nIH0pOiBNaWxlc3RvbmUge1xyXG4gICAgY29uc3QgaWQgPSBtLmlkID8/IGNyeXB0by5yYW5kb21VVUlEKCk7XHJcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBtaWxlc3RvbmVzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3Qgbm93ID0gdGhpcy5ub3coKTtcclxuICAgIGNvbnN0IGNyZWF0ZWRBdCA9IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmNyZWF0ZWRfYXQgfHwgbm93KSA6IG5vdztcclxuICAgIGNvbnN0IGNyZWF0ZWRCeSA9IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmNyZWF0ZWRfYnkgfHwgdGhpcy5hY3RvcklkKSA6IHRoaXMuYWN0b3JJZDtcclxuICAgIGNvbnN0IHJlYzogTWlsZXN0b25lID0ge1xyXG4gICAgICBpZCxcclxuICAgICAgbmFtZTogbS5uYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogbS5kZXNjcmlwdGlvbiA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuZGVzY3JpcHRpb24pIDogJycpLFxyXG4gICAgICB0YXJnZXREYXRlOiBtLnRhcmdldERhdGUgPz8gKGV4aXN0aW5nID8gKGV4aXN0aW5nLnRhcmdldF9kYXRlIGFzIHN0cmluZyB8IG51bGwpIDogbnVsbCksXHJcbiAgICAgIHN0YXR1czogKG0uc3RhdHVzID8/IChleGlzdGluZyA/IGV4aXN0aW5nLnN0YXR1cyA6ICdwbGFubmVkJykpIGFzIE1pbGVzdG9uZVsnc3RhdHVzJ10sXHJcbiAgICAgIHNvcnQ6IG0uc29ydCA/PyAoZXhpc3RpbmcgPyBOdW1iZXIoZXhpc3Rpbmcuc29ydCkgOiAwKSxcclxuICAgICAgc2FtcGxlOiBtLnNhbXBsZSA/PyAoZXhpc3RpbmcgPyAoTnVtYmVyKGV4aXN0aW5nLnNhbXBsZSkgYXMgMCB8IDEpIDogMCksXHJcbiAgICAgIGNyZWF0ZWRBdCwgY3JlYXRlZEJ5LCB1cGRhdGVkQXQ6IG5vdywgdXBkYXRlZEJ5OiB0aGlzLmFjdG9ySWQsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYlxyXG4gICAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgICAgYElOU0VSVCBJTlRPIG1pbGVzdG9uZXMoaWQsIG5hbWUsIGRlc2NyaXB0aW9uLCB0YXJnZXRfZGF0ZSwgc3RhdHVzLCBzb3J0LCBzYW1wbGUsIGRlbGV0ZWQsIGNyZWF0ZWRfYXQsIGNyZWF0ZWRfYnksIHVwZGF0ZWRfYXQsIHVwZGF0ZWRfYnkpXHJcbiAgICAgICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPywwLD8sPyw/LD8pXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCBkZXNjcmlwdGlvbj0/LCB0YXJnZXRfZGF0ZT0/LCBzdGF0dXM9Pywgc29ydD0/LCBkZWxldGVkPTAsIHVwZGF0ZWRfYXQ9PywgdXBkYXRlZF9ieT0/YCxcclxuICAgICAgICApXHJcbiAgICAgICAgLnJ1bihyZWMuaWQsIHJlYy5uYW1lLCByZWMuZGVzY3JpcHRpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuc29ydCwgcmVjLnNhbXBsZSwgY3JlYXRlZEF0LCBjcmVhdGVkQnksIG5vdywgdGhpcy5hY3RvcklkLFxyXG4gICAgICAgICAgICAgcmVjLm5hbWUsIHJlYy5kZXNjcmlwdGlvbiwgcmVjLnRhcmdldERhdGUsIHJlYy5zdGF0dXMsIHJlYy5zb3J0LCBub3csIHRoaXMuYWN0b3JJZCk7XHJcbiAgICAgIGlmICghZXhpc3RpbmcpIHtcclxuICAgICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdtaWxlc3RvbmUnLCBpZCwgeyAuLi5yZWMgfSk7XHJcbiAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShudWxsLCAnbWlsZXN0b25lX2NyZWF0ZWQnLCAnbWlsZXN0b25lJywgbnVsbCwgcmVjLm5hbWUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ21pbGVzdG9uZScsIGlkLCB7IG5hbWU6IHJlYy5uYW1lLCBkZXNjcmlwdGlvbjogcmVjLmRlc2NyaXB0aW9uLCB0YXJnZXREYXRlOiByZWMudGFyZ2V0RGF0ZSwgc3RhdHVzOiByZWMuc3RhdHVzLCBzb3J0OiByZWMuc29ydCwgdXBkYXRlZEF0OiBub3csIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH0pO1xyXG4gICAgICAgIHRoaXMubG9nQWN0aXZpdHkobnVsbCwgJ21pbGVzdG9uZV91cGRhdGVkJywgJ21pbGVzdG9uZScsIFN0cmluZyhleGlzdGluZy5uYW1lKSwgcmVjLm5hbWUpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ21pbGVzdG9uZScsIGVudGl0eUlkOiBpZCB9KTtcclxuICAgIHJldHVybiByZWM7XHJcbiAgfVxyXG5cclxuICBsaXN0TWlsZXN0b25lcygpOiBNaWxlc3RvbmVbXSB7XHJcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgZGVsZXRlZD0wIE9SREVSIEJZIHNvcnQsIHRhcmdldF9kYXRlJykuYWxsKCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcclxuICAgICAgaWQ6IFN0cmluZyhyLmlkKSwgbmFtZTogU3RyaW5nKHIubmFtZSksIGRlc2NyaXB0aW9uOiBTdHJpbmcoci5kZXNjcmlwdGlvbiksXHJcbiAgICAgIHRhcmdldERhdGU6IHIudGFyZ2V0X2RhdGUgPyBTdHJpbmcoci50YXJnZXRfZGF0ZSkgOiBudWxsLFxyXG4gICAgICBzdGF0dXM6IHIuc3RhdHVzIGFzIE1pbGVzdG9uZVsnc3RhdHVzJ10sIHNvcnQ6IE51bWJlcihyLnNvcnQpLCBzYW1wbGU6IE51bWJlcihyLnNhbXBsZSkgYXMgMCB8IDEsXHJcbiAgICAgIGNyZWF0ZWRBdDogci5jcmVhdGVkX2F0ID8gU3RyaW5nKHIuY3JlYXRlZF9hdCkgOiAnJywgY3JlYXRlZEJ5OiByLmNyZWF0ZWRfYnkgPyBTdHJpbmcoci5jcmVhdGVkX2J5KSA6ICcnLFxyXG4gICAgICB1cGRhdGVkQXQ6IHIudXBkYXRlZF9hdCA/IFN0cmluZyhyLnVwZGF0ZWRfYXQpIDogJycsIHVwZGF0ZWRCeTogci51cGRhdGVkX2J5ID8gU3RyaW5nKHIudXBkYXRlZF9ieSkgOiAnJyxcclxuICAgIH0pKTtcclxuICB9XHJcblxyXG4gIHVwc2VydFJlbGVhc2UobTogUGFydGlhbDxSZWxlYXNlPiAmIHsgbmFtZTogc3RyaW5nIH0pOiBSZWxlYXNlIHtcclxuICAgIGNvbnN0IGlkID0gbS5pZCA/PyBjcnlwdG8ucmFuZG9tVVVJRCgpO1xyXG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gcmVsZWFzZXMgV0hFUkUgaWQ9PycpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCBub3cgPSB0aGlzLm5vdygpO1xyXG4gICAgY29uc3QgY3JlYXRlZEF0ID0gZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuY3JlYXRlZF9hdCB8fCBub3cpIDogbm93O1xyXG4gICAgY29uc3QgY3JlYXRlZEJ5ID0gZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuY3JlYXRlZF9ieSB8fCB0aGlzLmFjdG9ySWQpIDogdGhpcy5hY3RvcklkO1xyXG4gICAgY29uc3QgcmVjOiBSZWxlYXNlID0ge1xyXG4gICAgICBpZCxcclxuICAgICAgbmFtZTogbS5uYW1lLFxyXG4gICAgICB2ZXJzaW9uOiBtLnZlcnNpb24gPz8gKGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLnZlcnNpb24pIDogJycpLFxyXG4gICAgICB0YXJnZXREYXRlOiBtLnRhcmdldERhdGUgPz8gKGV4aXN0aW5nID8gKGV4aXN0aW5nLnRhcmdldF9kYXRlIGFzIHN0cmluZyB8IG51bGwpIDogbnVsbCksXHJcbiAgICAgIHN0YXR1czogKG0uc3RhdHVzID8/IChleGlzdGluZyA/IGV4aXN0aW5nLnN0YXR1cyA6ICdwbGFubmVkJykpIGFzIFJlbGVhc2VbJ3N0YXR1cyddLFxyXG4gICAgICBnb2FsczogbS5nb2FscyA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuZ29hbHMpIDogJycpLFxyXG4gICAgICBub3RlczogbS5ub3RlcyA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3Rpbmcubm90ZXMpIDogJycpLFxyXG4gICAgICBzYW1wbGU6IG0uc2FtcGxlID8/IChleGlzdGluZyA/IChOdW1iZXIoZXhpc3Rpbmcuc2FtcGxlKSBhcyAwIHwgMSkgOiAwKSxcclxuICAgICAgY3JlYXRlZEF0LCBjcmVhdGVkQnksIHVwZGF0ZWRBdDogbm93LCB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCxcclxuICAgIH07XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICB0aGlzLmRiXHJcbiAgICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgICBgSU5TRVJUIElOVE8gcmVsZWFzZXMoaWQsIG5hbWUsIHZlcnNpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIGdvYWxzLCBub3Rlcywgc2FtcGxlLCBkZWxldGVkLCBjcmVhdGVkX2F0LCBjcmVhdGVkX2J5LCB1cGRhdGVkX2F0LCB1cGRhdGVkX2J5KVxyXG4gICAgICAgICAgICAgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPywwLD8sPyw/LD8pXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCB2ZXJzaW9uPT8sIHRhcmdldF9kYXRlPT8sIHN0YXR1cz0/LCBnb2Fscz0/LCBub3Rlcz0/LCBkZWxldGVkPTAsIHVwZGF0ZWRfYXQ9PywgdXBkYXRlZF9ieT0/YCxcclxuICAgICAgICApXHJcbiAgICAgICAgLnJ1bihyZWMuaWQsIHJlYy5uYW1lLCByZWMudmVyc2lvbiwgcmVjLnRhcmdldERhdGUsIHJlYy5zdGF0dXMsIHJlYy5nb2FscywgcmVjLm5vdGVzLCByZWMuc2FtcGxlLCBjcmVhdGVkQXQsIGNyZWF0ZWRCeSwgbm93LCB0aGlzLmFjdG9ySWQsXHJcbiAgICAgICAgICAgICByZWMubmFtZSwgcmVjLnZlcnNpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuZ29hbHMsIHJlYy5ub3Rlcywgbm93LCB0aGlzLmFjdG9ySWQpO1xyXG4gICAgICBpZiAoIWV4aXN0aW5nKSB7XHJcbiAgICAgICAgdGhpcy5sb2NhbENyZWF0ZSgncmVsZWFzZScsIGlkLCB7IC4uLnJlYyB9KTtcclxuICAgICAgICB0aGlzLmxvZ0FjdGl2aXR5KG51bGwsICdyZWxlYXNlX2NyZWF0ZWQnLCAncmVsZWFzZScsIG51bGwsIHJlYy5uYW1lKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmxvY2FsU2V0KCdyZWxlYXNlJywgaWQsIHsgbmFtZTogcmVjLm5hbWUsIHZlcnNpb246IHJlYy52ZXJzaW9uLCB0YXJnZXREYXRlOiByZWMudGFyZ2V0RGF0ZSwgc3RhdHVzOiByZWMuc3RhdHVzLCBnb2FsczogcmVjLmdvYWxzLCBub3RlczogcmVjLm5vdGVzLCB1cGRhdGVkQXQ6IG5vdywgdXBkYXRlZEJ5OiB0aGlzLmFjdG9ySWQgfSk7XHJcbiAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShudWxsLCAncmVsZWFzZV91cGRhdGVkJywgJ3JlbGVhc2UnLCBTdHJpbmcoZXhpc3RpbmcubmFtZSksIHJlYy5uYW1lKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdyZWxlYXNlJywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gICAgcmV0dXJuIHJlYztcclxuICB9XHJcblxyXG4gIGxpc3RSZWxlYXNlcygpOiBSZWxlYXNlW10ge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSByZWxlYXNlcyBXSEVSRSBkZWxldGVkPTAgT1JERVIgQlkgdGFyZ2V0X2RhdGUnKS5hbGwoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xyXG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xyXG4gICAgICBpZDogU3RyaW5nKHIuaWQpLCBuYW1lOiBTdHJpbmcoci5uYW1lKSwgdmVyc2lvbjogU3RyaW5nKHIudmVyc2lvbiksXHJcbiAgICAgIHRhcmdldERhdGU6IHIudGFyZ2V0X2RhdGUgPyBTdHJpbmcoci50YXJnZXRfZGF0ZSkgOiBudWxsLFxyXG4gICAgICBzdGF0dXM6IHIuc3RhdHVzIGFzIFJlbGVhc2VbJ3N0YXR1cyddLCBnb2FsczogU3RyaW5nKHIuZ29hbHMpLCBub3RlczogU3RyaW5nKHIubm90ZXMpLFxyXG4gICAgICBzYW1wbGU6IE51bWJlcihyLnNhbXBsZSkgYXMgMCB8IDEsXHJcbiAgICAgIGNyZWF0ZWRBdDogci5jcmVhdGVkX2F0ID8gU3RyaW5nKHIuY3JlYXRlZF9hdCkgOiAnJywgY3JlYXRlZEJ5OiByLmNyZWF0ZWRfYnkgPyBTdHJpbmcoci5jcmVhdGVkX2J5KSA6ICcnLFxyXG4gICAgICB1cGRhdGVkQXQ6IHIudXBkYXRlZF9hdCA/IFN0cmluZyhyLnVwZGF0ZWRfYXQpIDogJycsIHVwZGF0ZWRCeTogci51cGRhdGVkX2J5ID8gU3RyaW5nKHIudXBkYXRlZF9ieSkgOiAnJyxcclxuICAgIH0pKTtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gc2F2ZWQgdmlld3MgLS0tLS0tLS0tLVxyXG4gIHNhdmVWaWV3KHY6IFBhcnRpYWw8U2F2ZWRWaWV3PiAmIHsgbmFtZTogc3RyaW5nOyBjb25maWc6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0pOiBTYXZlZFZpZXcge1xyXG4gICAgY29uc3QgaWQgPSB2LmlkID8/IGNyeXB0by5yYW5kb21VVUlEKCk7XHJcbiAgICBjb25zdCByZWM6IFNhdmVkVmlldyA9IHtcclxuICAgICAgaWQsIG5hbWU6IHYubmFtZSwgY29uZmlnOiB2LmNvbmZpZywgcGlubmVkOiB2LnBpbm5lZCA/PyAwLFxyXG4gICAgICBjcmVhdGVkQnk6IHRoaXMuYWN0b3JJZCwgY3JlYXRlZEF0OiB0aGlzLm5vdygpLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIHNhdmVkX3ZpZXdzIFdIRVJFIGlkPT8nKS5nZXQoaWQpO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYlxyXG4gICAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgICAgYElOU0VSVCBJTlRPIHNhdmVkX3ZpZXdzKGlkLCBuYW1lLCBjb25maWcsIHBpbm5lZCwgY3JlYXRlZF9ieSwgY3JlYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LDApXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCBjb25maWc9PywgcGlubmVkPT8sIGRlbGV0ZWQ9MGAsXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC5ydW4oaWQsIHJlYy5uYW1lLCBKU09OLnN0cmluZ2lmeShyZWMuY29uZmlnKSwgcmVjLnBpbm5lZCwgcmVjLmNyZWF0ZWRCeSwgcmVjLmNyZWF0ZWRBdCxcclxuICAgICAgICAgICAgIHJlYy5uYW1lLCBKU09OLnN0cmluZ2lmeShyZWMuY29uZmlnKSwgcmVjLnBpbm5lZCk7XHJcbiAgICAgIGlmICghZXhpc3RpbmcpIHRoaXMubG9jYWxDcmVhdGUoJ3NhdmVkX3ZpZXcnLCBpZCwgeyAuLi5yZWMgfSk7XHJcbiAgICAgIGVsc2UgdGhpcy5sb2NhbFNldCgnc2F2ZWRfdmlldycsIGlkLCB7IG5hbWU6IHJlYy5uYW1lLCBjb25maWc6IHJlYy5jb25maWcsIHBpbm5lZDogcmVjLnBpbm5lZCB9KTtcclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIHJldHVybiByZWM7XHJcbiAgfVxyXG5cclxuICBsaXN0Vmlld3MoKTogU2F2ZWRWaWV3W10ge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBzYXZlZF92aWV3cyBXSEVSRSBkZWxldGVkPTAgT1JERVIgQlkgcGlubmVkIERFU0MsIG5hbWUnKS5hbGwoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xyXG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xyXG4gICAgICBpZDogU3RyaW5nKHIuaWQpLCBuYW1lOiBTdHJpbmcoci5uYW1lKSxcclxuICAgICAgY29uZmlnOiBKU09OLnBhcnNlKFN0cmluZyhyLmNvbmZpZykpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxyXG4gICAgICBwaW5uZWQ6IE51bWJlcihyLnBpbm5lZCkgYXMgMCB8IDEsIGNyZWF0ZWRCeTogU3RyaW5nKHIuY3JlYXRlZF9ieSksIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXHJcbiAgICB9KSk7XHJcbiAgfVxyXG5cclxuICBkZWxldGVWaWV3KGlkOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIG5hbWUgRlJPTSBzYXZlZF92aWV3cyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhcyB7IG5hbWU6IHN0cmluZyB9IHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3Qgc3RhbXAgPSB0aGlzLm5vdygpO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgc2F2ZWRfdmlld3MgU0VUIGRlbGV0ZWQ9MSwgZGVsZXRlZF9hdD0/LCBkZWxldGVkX2J5PT8gV0hFUkUgaWQ9PycpLnJ1bihzdGFtcCwgdGhpcy5hY3RvcklkLCBpZCk7XHJcbiAgICAgIHRoaXMubG9jYWxTZXQoJ3NhdmVkX3ZpZXcnLCBpZCwgeyBkZWxldGVkOiAxLCBkZWxldGVkQXQ6IHN0YW1wLCBkZWxldGVkQnk6IHRoaXMuYWN0b3JJZCB9KTtcclxuICAgICAgdGhpcy5sb2dBY3Rpdml0eShudWxsLCAndmlld19kZWxldGVkJywgJ3NhdmVkX3ZpZXcnLCByb3cgPyByb3cubmFtZSA6IG51bGwsIG51bGwpO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBhY3Rpdml0eSAtLS0tLS0tLS0tXHJcbiAgYWN0aXZpdHlGb3IoaXRlbUlkOiBzdHJpbmcgfCBudWxsLCBsaW1pdCA9IDEwMCkge1xyXG4gICAgaWYgKGl0ZW1JZCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5kYlxyXG4gICAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgaWQsIGl0ZW1faWQgQVMgaXRlbUlkLCBhY3Rvcl9pZCBBUyBhY3RvcklkLCBraW5kLCBmaWVsZCwgb2xkX3ZhbHVlIEFTIG9sZFZhbHVlLCBuZXdfdmFsdWUgQVMgbmV3VmFsdWUsIGF0IEZST00gYWN0aXZpdHkgV0hFUkUgaXRlbV9pZD0/IE9SREVSIEJZIGF0IERFU0MgTElNSVQgPycpXHJcbiAgICAgICAgLmFsbChpdGVtSWQsIGxpbWl0KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgaWQsIGl0ZW1faWQgQVMgaXRlbUlkLCBhY3Rvcl9pZCBBUyBhY3RvcklkLCBraW5kLCBmaWVsZCwgb2xkX3ZhbHVlIEFTIG9sZFZhbHVlLCBuZXdfdmFsdWUgQVMgbmV3VmFsdWUsIGF0IEZST00gYWN0aXZpdHkgT1JERVIgQlkgYXQgREVTQyBMSU1JVCA/JylcclxuICAgICAgLmFsbChsaW1pdCk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIHJlbW90ZSBvcCBhcHBsaWNhdGlvbiAtLS0tLS0tLS0tXHJcbiAgLyoqIEFwcGx5IGEgYmF0Y2ggb2YgcmVtb3RlIG9wcyBpbnNpZGUgb25lIHRyYW5zYWN0aW9uLiBSZXR1cm5zIGNvdW50IGFwcGxpZWQgKG5vbi1kdXBsaWNhdGUpLiAqL1xyXG4gIGFwcGx5UmVtb3RlT3BzKG9wczogT3BbXSk6IG51bWJlciB7XHJcbiAgICBsZXQgYXBwbGllZCA9IDA7XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICBmb3IgKGNvbnN0IG9wIG9mIG9wcykge1xyXG4gICAgICAgIGlmIChvcC5kZXZpY2VJZCA9PT0gdGhpcy5kZXZpY2VJZCkgY29udGludWU7IC8vIG91ciBvd24gb3BzIGVjaG9lZCBiYWNrXHJcbiAgICAgICAgY29uc3QgZHVwID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIG9wbG9nIFdIRVJFIG9wX2lkPT8nKS5nZXQob3Aub3BJZCk7XHJcbiAgICAgICAgaWYgKGR1cCkgY29udGludWU7XHJcbiAgICAgICAgdGhpcy53aXRuZXNzTGFtcG9ydChvcC5sYW1wb3J0KTtcclxuICAgICAgICB0aGlzLmFwcGVuZE9wKG9wKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgdGhpcy5hcHBseVJlbW90ZU9wKG9wKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIC8vIFF1YXJhbnRpbmUgYSBwb2lzb24gb3AgaW5zdGVhZCBvZiB3ZWRnaW5nIHRoZSB3aG9sZSBpbXBvcnQ6IGl0IGlzIGFscmVhZHlcclxuICAgICAgICAgIC8vIHJlY29yZGVkIGluIHRoZSBvcGxvZyAoc28gaXQgd29uJ3QgcmV0cnkgZm9yZXZlcikgYW5kIGxvZ2dlZCBmb3IgZGlhZ25vc2lzLlxyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihgW3N5bmNdIGZhaWxlZCB0byBhcHBseSBvcCAke29wLm9wSWR9ICgke29wLmVudGl0eX0vJHtvcC5hY3Rpb259KTpgLCBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhcHBsaWVkKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIGlmIChhcHBsaWVkID4gMCkgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICcqJywgZW50aXR5SWQ6ICcqJyB9KTtcclxuICAgIHJldHVybiBhcHBsaWVkO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhcHBseVJlbW90ZU9wKG9wOiBPcCk6IHZvaWQge1xyXG4gICAgc3dpdGNoIChvcC5hY3Rpb24pIHtcclxuICAgICAgY2FzZSAnY3JlYXRlJzpcclxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlQ3JlYXRlKG9wKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnc2V0JzpcclxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlU2V0KG9wKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnZGVsZXRlJzpcclxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlRGVsZXRlKG9wKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgdGFibGVGb3IoZW50aXR5OiBPcFsnZW50aXR5J10pOiBzdHJpbmcge1xyXG4gICAgc3dpdGNoIChlbnRpdHkpIHtcclxuICAgICAgY2FzZSAnaXRlbSc6IHJldHVybiAnaXRlbXMnO1xyXG4gICAgICBjYXNlICdsaW5rJzogcmV0dXJuICdsaW5rcyc7XHJcbiAgICAgIGNhc2UgJ2NvbW1lbnQnOiByZXR1cm4gJ2NvbW1lbnRzJztcclxuICAgICAgY2FzZSAnbWlsZXN0b25lJzogcmV0dXJuICdtaWxlc3RvbmVzJztcclxuICAgICAgY2FzZSAncmVsZWFzZSc6IHJldHVybiAncmVsZWFzZXMnO1xyXG4gICAgICBjYXNlICd1c2VyJzogcmV0dXJuICd1c2Vycyc7XHJcbiAgICAgIGNhc2UgJ3NhdmVkX3ZpZXcnOiByZXR1cm4gJ3NhdmVkX3ZpZXdzJztcclxuICAgICAgY2FzZSAnYXR0YWNobWVudCc6IHJldHVybiAnYXR0YWNobWVudHMnO1xyXG4gICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gZW50aXR5ICR7ZW50aXR5fWApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhcHBseVJlbW90ZUNyZWF0ZShvcDogT3ApOiB2b2lkIHtcclxuICAgIGNvbnN0IHJlY29yZCA9IG9wLnBheWxvYWQucmVjb3JkIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gICAgaWYgKCFyZWNvcmQpIHJldHVybjtcclxuICAgIGNvbnN0IHRhYmxlID0gdGhpcy50YWJsZUZvcihvcC5lbnRpdHkpO1xyXG4gICAgY29uc3QgZXhpc3RzID0gdGhpcy5kYi5wcmVwYXJlKGBTRUxFQ1QgMSBGUk9NICR7dGFibGV9IFdIRVJFIGlkPT9gKS5nZXQob3AuZW50aXR5SWQpO1xyXG4gICAgaWYgKGV4aXN0cykgcmV0dXJuOyAvLyBjcmVhdGUgaXMgaWRlbXBvdGVudCBwZXIgdXVpZFxyXG5cclxuICAgIGlmIChvcC5lbnRpdHkgPT09ICdpdGVtJykge1xyXG4gICAgICBsZXQgaXRlbSA9IHsgLi4uKHJlY29yZCBhcyB1bmtub3duIGFzIFdvcmtJdGVtKSB9O1xyXG4gICAgICAvLyBJZGVudCBjb2xsaXNpb246IGFub3RoZXIgaXRlbSAoZGlmZmVyZW50IHV1aWQpIGFscmVhZHkgaG9sZHMgdGhpcyBpZGVudC5cclxuICAgICAgLy8gRGV0ZXJtaW5pc3RpYyBydWxlIFx1MjAxNCB0aGUgc21hbGxlciB1dWlkIGtlZXBzIHRoZSBjb250ZXN0ZWQgaWRlbnQgXHUyMDE0IHNvIGJvdGhcclxuICAgICAgLy8gZGV2aWNlcyByZXNvbHZlIHRoZSBzYW1lIGNvbGxpc2lvbiBpZGVudGljYWxseSBhbmQgY29udmVyZ2Ugd2l0aG91dCBwaW5nLXBvbmcuXHJcbiAgICAgIGNvbnN0IGhvbGRlciA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkLCB0eXBlIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PycpLmdldChpdGVtLmlkZW50KSBhc1xyXG4gICAgICAgIHwgeyBpZDogc3RyaW5nOyB0eXBlOiBJdGVtVHlwZSB9XHJcbiAgICAgICAgfCB1bmRlZmluZWQ7XHJcbiAgICAgIGlmIChob2xkZXIgJiYgaG9sZGVyLmlkICE9PSBpdGVtLmlkKSB7XHJcbiAgICAgICAgaWYgKGl0ZW0uaWQgPCBob2xkZXIuaWQpIHtcclxuICAgICAgICAgIC8vIEluY29taW5nIGl0ZW0ga2VlcHMgdGhlIGlkZW50OyByZW51bWJlciB0aGUgbG9jYWwgaG9sZGVyIGFuZCBicm9hZGNhc3QuXHJcbiAgICAgICAgICBjb25zdCBidW1wZWQgPSB0aGlzLmFsbG9jSWRlbnQoaG9sZGVyLnR5cGUpO1xyXG4gICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShob2xkZXIuaWQsICdyZW51bWJlcmVkJywgJ2lkZW50JywgaXRlbS5pZGVudCwgYnVtcGVkKTtcclxuICAgICAgICAgIHRoaXMuYXBwbHlJdGVtRmllbGRzKGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xyXG4gICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xyXG4gICAgICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBuZXdJZGVudCA9IHRoaXMuYWxsb2NJZGVudChpdGVtLnR5cGUpO1xyXG4gICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShpdGVtLmlkLCAncmVudW1iZXJlZCcsICdpZGVudCcsIGl0ZW0uaWRlbnQsIG5ld0lkZW50KTtcclxuICAgICAgICAgIGl0ZW0gPSB7IC4uLml0ZW0sIGlkZW50OiBuZXdJZGVudCB9O1xyXG4gICAgICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xyXG4gICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGl0ZW0uaWQsIHsgaWRlbnQ6IG5ld0lkZW50IH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmluc2VydEl0ZW1Sb3coaXRlbSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy53aXRuZXNzSWRlbnQoaXRlbS50eXBlLCBpdGVtLmlkZW50KTtcclxuICAgICAgLy8gRGVyaXZlIHRoZSB0ZWFtbWF0ZSdzIGFjdGl2aXR5IGZyb20gdGhlaXIgb3AsIHNvIHRoZWlyIHdvcmsgc2hvd3MgaW4gQWN0aXZpdHlcclxuICAgICAgLy8gcmF0aGVyIHRoYW4gb25seSB0aGVpciByb3dzIGFwcGVhcmluZyB3aXRoIG5vIHRyYWNlIG9mIHdobyBtYWRlIHRoZW0uIFRoZSBpZCBjb21lc1xyXG4gICAgICAvLyBmcm9tIHRoZSBvcCBzbyBiYWNrZmlsbFJlbW90ZUFjdGl2aXR5KCkgY2FuJ3QgcmUtYWRkIHdoYXQgd2UgYWxyZWFkeSBkZXJpdmVkLlxyXG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KGl0ZW0uaWQsICdjcmVhdGVkJywgbnVsbCwgbnVsbCwgaXRlbS50aXRsZSwgb3AuYWN0b3JJZCwgb3AuYXQsIHRoaXMub3BBY3Rpdml0eUlkKG9wLm9wSWQpKTtcclxuICAgICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKHJlY29yZCkpIHRoaXMuc2V0RmllbGRDbG9ja0lmTmV3ZXIoJ2l0ZW0nLCBpdGVtLmlkLCBmLCBvcC5sYW1wb3J0LCBvcC5kZXZpY2VJZCk7XHJcbiAgICAgIHRoaXMucmVwbGF5UGVuZGluZ09wcyhvcC5lbnRpdHksIG9wLmVudGl0eUlkKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdlbmVyaWMgaW5zZXJ0IGZvciBvdGhlciBlbnRpdGllcy5cclxuICAgIGNvbnN0IGluc2VydGVyczogUmVjb3JkPHN0cmluZywgKCkgPT4gdm9pZD4gPSB7XHJcbiAgICAgIGxpbms6ICgpID0+IHtcclxuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgSXRlbUxpbmsgJiB7IGRlbGV0ZWQ/OiBudW1iZXIgfTtcclxuICAgICAgICB0aGlzLmRiXHJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIGxpbmtzKGlkLCBmcm9tX2lkLCB0b19pZCwga2luZCwgZGVsZXRlZCwgY3JlYXRlZF9hdCwgY3JlYXRlZF9ieSkgVkFMVUVTKD8sPyw/LD8sPyw/LD8pJylcclxuICAgICAgICAgIC5ydW4oci5pZCwgci5mcm9tSWQsIHIudG9JZCwgci5raW5kLCByLmRlbGV0ZWQgPz8gMCwgci5jcmVhdGVkQXQsIHIuY3JlYXRlZEJ5KTtcclxuICAgICAgfSxcclxuICAgICAgY29tbWVudDogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBDb21tZW50O1xyXG4gICAgICAgIHRoaXMuZGJcclxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gY29tbWVudHMoaWQsIGl0ZW1faWQsIGF1dGhvcl9pZCwgYm9keSwgYm9keV90ZXh0LCBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/KScpXHJcbiAgICAgICAgICAucnVuKHIuaWQsIHIuaXRlbUlkLCByLmF1dGhvcklkLCByLmJvZHksIHIuYm9keVRleHQsIHIuY3JlYXRlZEF0LCByLnVwZGF0ZWRBdCwgci5kZWxldGVkID8/IDApO1xyXG4gICAgICAgIHRoaXMubG9nQWN0aXZpdHkoci5pdGVtSWQsICdjb21tZW50JywgbnVsbCwgbnVsbCwgKHIuYm9keVRleHQgPz8gJycpLnNsaWNlKDAsIDIwMCksIG9wLmFjdG9ySWQsIG9wLmF0LCB0aGlzLm9wQWN0aXZpdHlJZChvcC5vcElkKSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIG1pbGVzdG9uZTogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBNaWxlc3RvbmU7XHJcbiAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBtaWxlc3RvbmVzKGlkLCBuYW1lLCBkZXNjcmlwdGlvbiwgdGFyZ2V0X2RhdGUsIHN0YXR1cywgc29ydCwgc2FtcGxlLCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPywwKScpXHJcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgci5kZXNjcmlwdGlvbiwgci50YXJnZXREYXRlLCByLnN0YXR1cywgci5zb3J0LCByLnNhbXBsZSA/PyAwKTtcclxuICAgICAgfSxcclxuICAgICAgcmVsZWFzZTogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBSZWxlYXNlO1xyXG4gICAgICAgIHRoaXMuZGJcclxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gcmVsZWFzZXMoaWQsIG5hbWUsIHZlcnNpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIGdvYWxzLCBub3Rlcywgc2FtcGxlLCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LDApJylcclxuICAgICAgICAgIC5ydW4oci5pZCwgci5uYW1lLCByLnZlcnNpb24sIHIudGFyZ2V0RGF0ZSwgci5zdGF0dXMsIHIuZ29hbHMsIHIubm90ZXMsIHIuc2FtcGxlID8/IDApO1xyXG4gICAgICB9LFxyXG4gICAgICB1c2VyOiAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgciA9IHJlY29yZCBhcyB1bmtub3duIGFzIFVzZXI7XHJcbiAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyB1c2VycyhpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBhdmF0YXIsIGNyZWF0ZWRfYXQpIFZBTFVFUyg/LD8sPyw/LD8sPyknKVxyXG4gICAgICAgICAgLnJ1bihyLmlkLCByLm5hbWUsIHIuaW5pdGlhbHMsIHIuY29sb3IsIHIuYXZhdGFyID8/IG51bGwsIHIuY3JlYXRlZEF0KTtcclxuICAgICAgfSxcclxuICAgICAgc2F2ZWRfdmlldzogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBTYXZlZFZpZXc7XHJcbiAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBzYXZlZF92aWV3cyhpZCwgbmFtZSwgY29uZmlnLCBwaW5uZWQsIGNyZWF0ZWRfYnksIGNyZWF0ZWRfYXQsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPywwKScpXHJcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgSlNPTi5zdHJpbmdpZnkoci5jb25maWcpLCByLnBpbm5lZCwgci5jcmVhdGVkQnksIHIuY3JlYXRlZEF0KTtcclxuICAgICAgfSxcclxuICAgICAgYXR0YWNobWVudDogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBpbXBvcnQoJy4uLy4uL3NoYXJlZC90eXBlcycpLkF0dGFjaG1lbnQ7XHJcbiAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBhdHRhY2htZW50cyhpZCwgaXRlbV9pZCwgZmlsZW5hbWUsIG1pbWUsIHNpemUsIHNoYTI1NiwgZGVzY3JpcHRpb24sIHVwbG9hZGVkX2J5LCBjcmVhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LD8sPyknKVxyXG4gICAgICAgICAgLnJ1bihyLmlkLCByLml0ZW1JZCwgci5maWxlbmFtZSwgci5taW1lLCByLnNpemUsIHIuc2hhMjU2LCByLmRlc2NyaXB0aW9uLCByLnVwbG9hZGVkQnksIHIuY3JlYXRlZEF0LCByLmRlbGV0ZWQgPz8gMCk7XHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG4gICAgaW5zZXJ0ZXJzW29wLmVudGl0eV0/LigpO1xyXG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKHJlY29yZCkpIHRoaXMuc2V0RmllbGRDbG9ja0lmTmV3ZXIob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgb3AuZGV2aWNlSWQpO1xyXG4gICAgdGhpcy5yZXBsYXlQZW5kaW5nT3BzKG9wLmVudGl0eSwgb3AuZW50aXR5SWQpO1xyXG4gIH1cclxuXHJcbiAgLyoqIFNldCBhIGZpZWxkIGNsb2NrIG9ubHkgaWYgdGhlIGluY29taW5nIHdyaXRlIGlzIG5ld2VyIFx1MjAxNCBjcmVhdGVzIG11c3QgbmV2ZXJcclxuICAgICAgcmVncmVzcyBjbG9ja3Mgc3RhbXBlZCBieSBidWZmZXJlZC9lYXJsaWVyLWFycml2aW5nIHNldHMuICovXHJcbiAgcHJpdmF0ZSBzZXRGaWVsZENsb2NrSWZOZXdlcihlbnRpdHk6IHN0cmluZywgZW50aXR5SWQ6IHN0cmluZywgZmllbGQ6IHN0cmluZywgbGFtcG9ydDogbnVtYmVyLCBkZXZpY2VJZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCBjdXIgPSB0aGlzLmZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZmllbGQpO1xyXG4gICAgaWYgKGN1ciAmJiAoY3VyLmxhbXBvcnQgPiBsYW1wb3J0IHx8IChjdXIubGFtcG9ydCA9PT0gbGFtcG9ydCAmJiBjdXIuZGV2aWNlSWQgPiBkZXZpY2VJZCkpKSByZXR1cm47XHJcbiAgICB0aGlzLnNldEZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZmllbGQsIGxhbXBvcnQsIGRldmljZUlkKTtcclxuICB9XHJcblxyXG4gIC8qKiBCdWZmZXIgYW4gb3AgdGhhdCBhcnJpdmVkIGJlZm9yZSBpdHMgdGFyZ2V0J3MgY3JlYXRlICgzKyBkZXZpY2UgcmVvcmRlcmluZykuICovXHJcbiAgcHJpdmF0ZSBidWZmZXJQZW5kaW5nT3Aob3A6IE9wKTogdm9pZCB7XHJcbiAgICB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgIGBJTlNFUlQgT1IgSUdOT1JFIElOVE8gcGVuZGluZ19vcHMob3BfaWQsIGRldmljZV9pZCwgYWN0b3JfaWQsIGxhbXBvcnQsIGF0LCBlbnRpdHksIGVudGl0eV9pZCwgYWN0aW9uLCBwYXlsb2FkKVxyXG4gICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LD8pYCxcclxuICAgICAgKVxyXG4gICAgICAucnVuKG9wLm9wSWQsIG9wLmRldmljZUlkLCBvcC5hY3RvcklkLCBvcC5sYW1wb3J0LCBvcC5hdCwgb3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgb3AuYWN0aW9uLCBKU09OLnN0cmluZ2lmeShvcC5wYXlsb2FkKSk7XHJcbiAgfVxyXG5cclxuICAvKiogUmVwbGF5IGJ1ZmZlcmVkIHNldHMvZGVsZXRlcyBmb3IgYW4gZW50aXR5IG9uY2UgaXRzIGNyZWF0ZSBoYXMgbGFuZGVkLiAqL1xyXG4gIHByaXZhdGUgcmVwbGF5UGVuZGluZ09wcyhlbnRpdHk6IE9wWydlbnRpdHknXSwgZW50aXR5SWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gcGVuZGluZ19vcHMgV0hFUkUgZW50aXR5PT8gQU5EIGVudGl0eV9pZD0/IE9SREVSIEJZIGxhbXBvcnQsIGRldmljZV9pZCcpXHJcbiAgICAgIC5hbGwoZW50aXR5LCBlbnRpdHlJZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIGlmIChyb3dzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xyXG4gICAgdGhpcy5kYi5wcmVwYXJlKCdERUxFVEUgRlJPTSBwZW5kaW5nX29wcyBXSEVSRSBlbnRpdHk9PyBBTkQgZW50aXR5X2lkPT8nKS5ydW4oZW50aXR5LCBlbnRpdHlJZCk7XHJcbiAgICBmb3IgKGNvbnN0IHIgb2Ygcm93cykge1xyXG4gICAgICB0aGlzLmFwcGx5UmVtb3RlT3Aoe1xyXG4gICAgICAgIG9wSWQ6IFN0cmluZyhyLm9wX2lkKSwgZGV2aWNlSWQ6IFN0cmluZyhyLmRldmljZV9pZCksIGFjdG9ySWQ6IFN0cmluZyhyLmFjdG9yX2lkKSxcclxuICAgICAgICBsYW1wb3J0OiBOdW1iZXIoci5sYW1wb3J0KSwgYXQ6IFN0cmluZyhyLmF0KSwgZW50aXR5OiByLmVudGl0eSBhcyBPcFsnZW50aXR5J10sXHJcbiAgICAgICAgZW50aXR5SWQ6IFN0cmluZyhyLmVudGl0eV9pZCksIGFjdGlvbjogci5hY3Rpb24gYXMgT3BbJ2FjdGlvbiddLFxyXG4gICAgICAgIHBheWxvYWQ6IEpTT04ucGFyc2UoU3RyaW5nKHIucGF5bG9hZCkpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXBwbHlSZW1vdGVTZXQob3A6IE9wKTogdm9pZCB7XHJcbiAgICAvLyBUYXJnZXQgcm93IG1heSBub3QgZXhpc3QgeWV0IChvcHMgZnJvbSBhIHRoaXJkIGRldmljZSBjYW4gYXJyaXZlIGJlZm9yZSB0aGVcclxuICAgIC8vIG9yaWdpbmF0aW5nIGRldmljZSdzIGNyZWF0ZSkgXHUyMDE0IGJ1ZmZlciBhbmQgcmVwbGF5IGFmdGVyIHRoZSBjcmVhdGUuXHJcbiAgICBjb25zdCByb3dFeGlzdHMgPSB0aGlzLmRiLnByZXBhcmUoYFNFTEVDVCAxIEZST00gJHt0aGlzLnRhYmxlRm9yKG9wLmVudGl0eSl9IFdIRVJFIGlkPT9gKS5nZXQob3AuZW50aXR5SWQpO1xyXG4gICAgaWYgKCFyb3dFeGlzdHMpIHtcclxuICAgICAgdGhpcy5idWZmZXJQZW5kaW5nT3Aob3ApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBmaWVsZHMgPSAob3AucGF5bG9hZC5maWVsZHMgPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gICAgY29uc3QgYmFzZWRPbiA9IChvcC5wYXlsb2FkLmJhc2VkT24gPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHsgbGFtcG9ydDogbnVtYmVyOyBkZXZpY2VJZDogc3RyaW5nIH0gfCBudWxsPjtcclxuICAgIGNvbnN0IHdpbm5pbmc6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XHJcblxyXG4gICAgZm9yIChjb25zdCBbZmllbGQsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XHJcbiAgICAgIGNvbnN0IGxvY2FsID0gdGhpcy5maWVsZENsb2NrKG9wLmVudGl0eSwgb3AuZW50aXR5SWQsIGZpZWxkKTtcclxuICAgICAgY29uc3QgYmFzZSA9IGJhc2VkT25bZmllbGRdID8/IG51bGw7XHJcblxyXG4gICAgICBsZXQgcmVtb3RlV2luczogYm9vbGVhbjtcclxuICAgICAgbGV0IGNvbmN1cnJlbnQgPSBmYWxzZTtcclxuICAgICAgaWYgKCFsb2NhbCkge1xyXG4gICAgICAgIHJlbW90ZVdpbnMgPSB0cnVlO1xyXG4gICAgICB9IGVsc2UgaWYgKGJhc2UgJiYgYmFzZS5sYW1wb3J0ID09PSBsb2NhbC5sYW1wb3J0ICYmIGJhc2UuZGV2aWNlSWQgPT09IGxvY2FsLmRldmljZUlkKSB7XHJcbiAgICAgICAgcmVtb3RlV2lucyA9IHRydWU7IC8vIGNsZWFuIGNhdXNhbCB1cGRhdGU6IHJlbW90ZSBzYXcgZXhhY3RseSBvdXIgY3VycmVudCB2YWx1ZVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbmN1cnJlbnQgPSB0cnVlO1xyXG4gICAgICAgIHJlbW90ZVdpbnMgPSBvcC5sYW1wb3J0ID4gbG9jYWwubGFtcG9ydCB8fCAob3AubGFtcG9ydCA9PT0gbG9jYWwubGFtcG9ydCAmJiBvcC5kZXZpY2VJZCA+IGxvY2FsLmRldmljZUlkKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGNvbmN1cnJlbnQgJiYgQ09ORkxJQ1RfU1VSRkFDRURfRklFTERTLmhhcyhmaWVsZCkgJiYgb3AuZW50aXR5ID09PSAnaXRlbScpIHtcclxuICAgICAgICBjb25zdCBjdXIgPSB0aGlzLmRiXHJcbiAgICAgICAgICAucHJlcGFyZShgU0VMRUNUICR7SVRFTV9DT0xTW2ZpZWxkXX0gQVMgdiBGUk9NIGl0ZW1zIFdIRVJFIGlkPT9gKVxyXG4gICAgICAgICAgLmdldChvcC5lbnRpdHlJZCkgYXMgeyB2OiB1bmtub3duIH0gfCB1bmRlZmluZWQ7XHJcbiAgICAgICAgY29uc3QgbG9jYWxWYWwgPSBjdXIgPyBTdHJpbmcoY3VyLnYgPz8gJycpIDogJyc7XHJcbiAgICAgICAgY29uc3QgcmVtb3RlVmFsID0gU3RyaW5nKHZhbHVlID8/ICcnKTtcclxuICAgICAgICBpZiAobG9jYWxWYWwgIT09IHJlbW90ZVZhbCkge1xyXG4gICAgICAgICAgY29uc3QgY29uZmxpY3Q6IFN5bmNDb25mbGljdCA9IHtcclxuICAgICAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXHJcbiAgICAgICAgICAgIGVudGl0eTogb3AuZW50aXR5LFxyXG4gICAgICAgICAgICBlbnRpdHlJZDogb3AuZW50aXR5SWQsXHJcbiAgICAgICAgICAgIGZpZWxkLFxyXG4gICAgICAgICAgICBsb2NhbFZhbHVlOiBsb2NhbFZhbCxcclxuICAgICAgICAgICAgcmVtb3RlVmFsdWU6IHJlbW90ZVZhbCxcclxuICAgICAgICAgICAgcmVtb3RlRGV2aWNlOiBvcC5kZXZpY2VJZCxcclxuICAgICAgICAgICAgcmVtb3RlQWN0b3I6IG9wLmFjdG9ySWQsXHJcbiAgICAgICAgICAgIGRldGVjdGVkQXQ6IHRoaXMubm93KCksXHJcbiAgICAgICAgICAgIHJlc29sdmVkQXQ6IG51bGwsXHJcbiAgICAgICAgICAgIHJlc29sdXRpb246IG51bGwsXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gc3luY19jb25mbGljdHMoaWQsIGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZCwgbG9jYWxfdmFsdWUsIHJlbW90ZV92YWx1ZSwgcmVtb3RlX2RldmljZSwgcmVtb3RlX2FjdG9yLCBkZXRlY3RlZF9hdCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyw/KScpXHJcbiAgICAgICAgICAgIC5ydW4oY29uZmxpY3QuaWQsIGNvbmZsaWN0LmVudGl0eSwgY29uZmxpY3QuZW50aXR5SWQsIGNvbmZsaWN0LmZpZWxkLCBjb25mbGljdC5sb2NhbFZhbHVlLCBjb25mbGljdC5yZW1vdGVWYWx1ZSwgY29uZmxpY3QucmVtb3RlRGV2aWNlLCBjb25mbGljdC5yZW1vdGVBY3RvciwgY29uZmxpY3QuZGV0ZWN0ZWRBdCk7XHJcbiAgICAgICAgICB0aGlzLmV2ZW50cy5vbkNvbmZsaWN0KGNvbmZsaWN0KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChyZW1vdGVXaW5zKSB7XHJcbiAgICAgICAgd2lubmluZ1tmaWVsZF0gPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLnNldEZpZWxkQ2xvY2sob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgZmllbGQsIG9wLmxhbXBvcnQsIG9wLmRldmljZUlkKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChPYmplY3Qua2V5cyh3aW5uaW5nKS5sZW5ndGggPT09IDApIHJldHVybjtcclxuXHJcbiAgICBpZiAob3AuZW50aXR5ID09PSAnaXRlbScpIHtcclxuICAgICAgY29uc3QgYmVmb3JlID0gdGhpcy5nZXRJdGVtKG9wLmVudGl0eUlkKTtcclxuICAgICAgLy8gSWRlbnQgc2V0IG1heSBjb2xsaWRlIGxvY2FsbHkgXHUyMDE0IHJlc29sdmUgd2l0aCB0aGUgc2FtZSBzbWFsbGVyLXV1aWQta2VlcHMgcnVsZS5cclxuICAgICAgaWYgKCdpZGVudCcgaW4gd2lubmluZykge1xyXG4gICAgICAgIGNvbnN0IGhvbGRlciA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkLCB0eXBlIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PycpLmdldChTdHJpbmcod2lubmluZy5pZGVudCkpIGFzXHJcbiAgICAgICAgICB8IHsgaWQ6IHN0cmluZzsgdHlwZTogSXRlbVR5cGUgfVxyXG4gICAgICAgICAgfCB1bmRlZmluZWQ7XHJcbiAgICAgICAgY29uc3QgY3VyID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgdHlwZSBGUk9NIGl0ZW1zIFdIRVJFIGlkPT8nKS5nZXQob3AuZW50aXR5SWQpIGFzIHsgdHlwZTogSXRlbVR5cGUgfSB8IHVuZGVmaW5lZDtcclxuICAgICAgICBpZiAoaG9sZGVyICYmIGhvbGRlci5pZCAhPT0gb3AuZW50aXR5SWQgJiYgY3VyKSB7XHJcbiAgICAgICAgICBpZiAob3AuZW50aXR5SWQgPCBob2xkZXIuaWQpIHtcclxuICAgICAgICAgICAgY29uc3QgYnVtcGVkID0gdGhpcy5hbGxvY0lkZW50KGhvbGRlci50eXBlKTtcclxuICAgICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShob2xkZXIuaWQsICdyZW51bWJlcmVkJywgJ2lkZW50JywgU3RyaW5nKHdpbm5pbmcuaWRlbnQpLCBidW1wZWQpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcGx5SXRlbUZpZWxkcyhob2xkZXIuaWQsIHsgaWRlbnQ6IGJ1bXBlZCB9KTtcclxuICAgICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgYnVtcGVkID0gdGhpcy5hbGxvY0lkZW50KGN1ci50eXBlKTtcclxuICAgICAgICAgICAgd2lubmluZy5pZGVudCA9IGJ1bXBlZDtcclxuICAgICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIG9wLmVudGl0eUlkLCB7IGlkZW50OiBidW1wZWQgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChjdXIpIHtcclxuICAgICAgICAgIHRoaXMud2l0bmVzc0lkZW50KGN1ci50eXBlLCBTdHJpbmcod2lubmluZy5pZGVudCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0aGlzLmFwcGx5SXRlbUZpZWxkcyhvcC5lbnRpdHlJZCwgd2lubmluZyk7XHJcbiAgICAgIC8vIE1pcnJvciB1cGRhdGVJdGVtJ3MgbG9jYWwgbG9nZ2luZyBzbyBhIHRlYW1tYXRlJ3MgY2hhbmdlIHJlYWRzIHRoZSBzYW1lIGFzIG91cnM6XHJcbiAgICAgIC8vIG9uZSBlbnRyeSBwZXIgZmllbGQsIHdpdGggYm9keSBlZGl0cyBjb2xsYXBzZWQgaW50byBhIHNpbmdsZSAnZWRpdGVkJyBlbnRyeS5cclxuICAgICAgaWYgKGJlZm9yZSkge1xyXG4gICAgICAgIGNvbnN0IHByZXYgPSBiZWZvcmUgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICAgICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyh3aW5uaW5nKSkge1xyXG4gICAgICAgICAgaWYgKGsgPT09ICd1cGRhdGVkQXQnIHx8IGsgPT09ICd1cGRhdGVkQnknIHx8IGsgPT09ICdib2R5JyB8fCBrID09PSAnYm9keVRleHQnKSBjb250aW51ZTtcclxuICAgICAgICAgIHRoaXMubG9nQWN0aXZpdHkoXHJcbiAgICAgICAgICAgIG9wLmVudGl0eUlkLCAndXBkYXRlZCcsIGssIHByZXZba10sXHJcbiAgICAgICAgICAgIEpTT05fSVRFTV9GSUVMRFMuaGFzKGspID8gSlNPTi5zdHJpbmdpZnkodikgOiB2LFxyXG4gICAgICAgICAgICBvcC5hY3RvcklkLCBvcC5hdCwgdGhpcy5vcEFjdGl2aXR5SWQob3Aub3BJZCwgayksXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoJ2JvZHknIGluIHdpbm5pbmcgfHwgJ2JvZHlUZXh0JyBpbiB3aW5uaW5nKSB7XHJcbiAgICAgICAgICBjb25zdCBuZXdUZXh0ID0gJ2JvZHlUZXh0JyBpbiB3aW5uaW5nID8gU3RyaW5nKHdpbm5pbmcuYm9keVRleHQgPz8gJycpIDogYmVmb3JlLmJvZHlUZXh0O1xyXG4gICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShcclxuICAgICAgICAgICAgb3AuZW50aXR5SWQsICdlZGl0ZWQnLCAnYm9keScsIGJlZm9yZS5ib2R5VGV4dCwgbmV3VGV4dCxcclxuICAgICAgICAgICAgb3AuYWN0b3JJZCwgb3AuYXQsIHRoaXMub3BBY3Rpdml0eUlkKG9wLm9wSWQsICdib2R5JyksXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2VuZXJpYyBjb2x1bW4gdXBkYXRlIGZvciBvdGhlciBlbnRpdGllcy5cclxuICAgIGNvbnN0IGNvbE1hcDogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nPj4gPSB7XHJcbiAgICAgIGxpbms6IHsgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXHJcbiAgICAgIGNvbW1lbnQ6IHsgYm9keTogJ2JvZHknLCBib2R5VGV4dDogJ2JvZHlfdGV4dCcsIHVwZGF0ZWRBdDogJ3VwZGF0ZWRfYXQnLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcclxuICAgICAgbWlsZXN0b25lOiB7IG5hbWU6ICduYW1lJywgZGVzY3JpcHRpb246ICdkZXNjcmlwdGlvbicsIHRhcmdldERhdGU6ICd0YXJnZXRfZGF0ZScsIHN0YXR1czogJ3N0YXR1cycsIHNvcnQ6ICdzb3J0JywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXHJcbiAgICAgIHJlbGVhc2U6IHsgbmFtZTogJ25hbWUnLCB2ZXJzaW9uOiAndmVyc2lvbicsIHRhcmdldERhdGU6ICd0YXJnZXRfZGF0ZScsIHN0YXR1czogJ3N0YXR1cycsIGdvYWxzOiAnZ29hbHMnLCBub3RlczogJ25vdGVzJywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXHJcbiAgICAgIHVzZXI6IHsgbmFtZTogJ25hbWUnLCBpbml0aWFsczogJ2luaXRpYWxzJywgY29sb3I6ICdjb2xvcicsIGF2YXRhcjogJ2F2YXRhcicgfSxcclxuICAgICAgc2F2ZWRfdmlldzogeyBuYW1lOiAnbmFtZScsIGNvbmZpZzogJ2NvbmZpZycsIHBpbm5lZDogJ3Bpbm5lZCcsIGRlbGV0ZWQ6ICdkZWxldGVkJyB9LFxyXG4gICAgICBhdHRhY2htZW50OiB7IGRlc2NyaXB0aW9uOiAnZGVzY3JpcHRpb24nLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcclxuICAgIH07XHJcbiAgICBjb25zdCBtYXAgPSBjb2xNYXBbb3AuZW50aXR5XTtcclxuICAgIGlmICghbWFwKSByZXR1cm47XHJcbiAgICBjb25zdCBzZXRzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgY29uc3QgdmFsczogdW5rbm93bltdID0gW107XHJcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyh3aW5uaW5nKSkge1xyXG4gICAgICBjb25zdCBjb2wgPSBtYXBba107XHJcbiAgICAgIGlmICghY29sKSBjb250aW51ZTtcclxuICAgICAgc2V0cy5wdXNoKGAke2NvbH09P2ApO1xyXG4gICAgICB2YWxzLnB1c2goayA9PT0gJ2NvbmZpZycgPyBKU09OLnN0cmluZ2lmeSh2KSA6IHYpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFzZXRzLmxlbmd0aCkgcmV0dXJuO1xyXG4gICAgdmFscy5wdXNoKG9wLmVudGl0eUlkKTtcclxuICAgIHRoaXMuZGIucHJlcGFyZShgVVBEQVRFICR7dGhpcy50YWJsZUZvcihvcC5lbnRpdHkpfSBTRVQgJHtzZXRzLmpvaW4oJywgJyl9IFdIRVJFIGlkPT9gKS5ydW4oLi4udmFscyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFwcGx5UmVtb3RlRGVsZXRlKG9wOiBPcCk6IHZvaWQge1xyXG4gICAgY29uc3QgdGFibGUgPSB0aGlzLnRhYmxlRm9yKG9wLmVudGl0eSk7XHJcbiAgICBjb25zdCByb3dFeGlzdHMgPSB0aGlzLmRiLnByZXBhcmUoYFNFTEVDVCAxIEZST00gJHt0YWJsZX0gV0hFUkUgaWQ9P2ApLmdldChvcC5lbnRpdHlJZCk7XHJcbiAgICBpZiAoIXJvd0V4aXN0cykge1xyXG4gICAgICAvLyBEZWxldGUgYXJyaXZlZCBiZWZvcmUgdGhlIGNyZWF0ZSAoMysgZGV2aWNlIHJlb3JkZXJpbmcpIFx1MjAxNCBidWZmZXIgaXQgc28gdGhlXHJcbiAgICAgIC8vIGNyZWF0ZSdzIHJlcGxheSBhcHBsaWVzIGl0IGluc3RlYWQgb2YgcmVzdXJyZWN0aW5nIHRoZSBpdGVtLlxyXG4gICAgICB0aGlzLmJ1ZmZlclBlbmRpbmdPcChvcCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuZGIucHJlcGFyZShgVVBEQVRFICR7dGFibGV9IFNFVCBkZWxldGVkPTEgV0hFUkUgaWQ9P2ApLnJ1bihvcC5lbnRpdHlJZCk7XHJcbiAgICB0aGlzLnNldEZpZWxkQ2xvY2sob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgJ2RlbGV0ZWQnLCBvcC5sYW1wb3J0LCBvcC5kZXZpY2VJZCk7XHJcbiAgICBpZiAob3AuZW50aXR5ID09PSAnaXRlbScpIHtcclxuICAgICAgdGhpcy5sb2dBY3Rpdml0eShvcC5lbnRpdHlJZCwgJ2RlbGV0ZWQnLCBudWxsLCBudWxsLCBudWxsLCBvcC5hY3RvcklkLCBvcC5hdCwgdGhpcy5vcEFjdGl2aXR5SWQob3Aub3BJZCkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBjb25mbGljdHMgLS0tLS0tLS0tLVxyXG4gIGxpc3RDb25mbGljdHMob3Blbk9ubHkgPSB0cnVlKTogU3luY0NvbmZsaWN0W10ge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoYFNFTEVDVCAqIEZST00gc3luY19jb25mbGljdHMgJHtvcGVuT25seSA/ICdXSEVSRSByZXNvbHZlZF9hdCBJUyBOVUxMJyA6ICcnfSBPUkRFUiBCWSBkZXRlY3RlZF9hdCBERVNDYClcclxuICAgICAgLmFsbCgpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XHJcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7XHJcbiAgICAgIGlkOiBTdHJpbmcoci5pZCksIGVudGl0eTogU3RyaW5nKHIuZW50aXR5KSwgZW50aXR5SWQ6IFN0cmluZyhyLmVudGl0eV9pZCksIGZpZWxkOiBTdHJpbmcoci5maWVsZCksXHJcbiAgICAgIGxvY2FsVmFsdWU6IFN0cmluZyhyLmxvY2FsX3ZhbHVlKSwgcmVtb3RlVmFsdWU6IFN0cmluZyhyLnJlbW90ZV92YWx1ZSksXHJcbiAgICAgIHJlbW90ZURldmljZTogU3RyaW5nKHIucmVtb3RlX2RldmljZSksIHJlbW90ZUFjdG9yOiBTdHJpbmcoci5yZW1vdGVfYWN0b3IpLFxyXG4gICAgICBkZXRlY3RlZEF0OiBTdHJpbmcoci5kZXRlY3RlZF9hdCksXHJcbiAgICAgIHJlc29sdmVkQXQ6IHIucmVzb2x2ZWRfYXQgPyBTdHJpbmcoci5yZXNvbHZlZF9hdCkgOiBudWxsLFxyXG4gICAgICByZXNvbHV0aW9uOiAoci5yZXNvbHV0aW9uIGFzIFN5bmNDb25mbGljdFsncmVzb2x1dGlvbiddKSA/PyBudWxsLFxyXG4gICAgfSkpO1xyXG4gIH1cclxuXHJcbiAgcmVzb2x2ZUNvbmZsaWN0KGlkOiBzdHJpbmcsIHJlc29sdXRpb246ICdsb2NhbCcgfCAncmVtb3RlJyB8ICdtZXJnZWQnLCBtZXJnZWRWYWx1ZT86IHN0cmluZyk6IHZvaWQge1xyXG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHN5bmNfY29uZmxpY3RzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xyXG4gICAgaWYgKCFyb3cpIHJldHVybjtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHZhbHVlID1cclxuICAgICAgICByZXNvbHV0aW9uID09PSAnbWVyZ2VkJyA/IChtZXJnZWRWYWx1ZSA/PyAnJykgOiByZXNvbHV0aW9uID09PSAnbG9jYWwnID8gU3RyaW5nKHJvdy5sb2NhbF92YWx1ZSkgOiBTdHJpbmcocm93LnJlbW90ZV92YWx1ZSk7XHJcbiAgICAgIGlmIChTdHJpbmcocm93LmVudGl0eSkgPT09ICdpdGVtJykge1xyXG4gICAgICAgIGNvbnN0IGZpZWxkID0gU3RyaW5nKHJvdy5maWVsZCk7XHJcbiAgICAgICAgY29uc3Qgc3RhbXAgPSB0aGlzLm5vdygpO1xyXG4gICAgICAgIGNvbnN0IGZpZWxkczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7IFtmaWVsZF06IHZhbHVlLCB1cGRhdGVkQXQ6IHN0YW1wLCB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCB9O1xyXG4gICAgICAgIC8vIFJlc29sdmluZyBhIGJvZHkgY29uZmxpY3QgbXVzdCBhbHNvIHJlZnJlc2ggdGhlIHNlYXJjaC10ZXh0IHByb2plY3Rpb24uXHJcbiAgICAgICAgaWYgKGZpZWxkID09PSAnYm9keScpIGZpZWxkcy5ib2R5VGV4dCA9IGRvY1RvVGV4dCh2YWx1ZSk7XHJcbiAgICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoU3RyaW5nKHJvdy5lbnRpdHlfaWQpLCBmaWVsZHMpO1xyXG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ2l0ZW0nLCBTdHJpbmcocm93LmVudGl0eV9pZCksIGZpZWxkcyk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgc3luY19jb25mbGljdHMgU0VUIHJlc29sdmVkX2F0PT8sIHJlc29sdXRpb249PywgcmVzb2x2ZWRfYnk9PyBXSEVSRSBpZD0/JykucnVuKHRoaXMubm93KCksIHJlc29sdXRpb24sIHRoaXMuYWN0b3JJZCwgaWQpO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6IFN0cmluZyhyb3cuZW50aXR5KSwgZW50aXR5SWQ6IFN0cmluZyhyb3cuZW50aXR5X2lkKSB9KTtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gc3luYyBleHBvcnQgaGVscGVycyAtLS0tLS0tLS0tXHJcbiAgb3BzU2luY2Uoc2VxOiBudW1iZXIsIG93bk9ubHkgPSB0cnVlKTogeyBzZXE6IG51bWJlcjsgb3A6IE9wIH1bXSB7XHJcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZShcclxuICAgICAgICBgU0VMRUNUIHNlcSwgb3BfaWQsIGRldmljZV9pZCwgYWN0b3JfaWQsIGxhbXBvcnQsIGF0LCBlbnRpdHksIGVudGl0eV9pZCwgYWN0aW9uLCBwYXlsb2FkXHJcbiAgICAgICAgIEZST00gb3Bsb2cgV0hFUkUgc2VxID4gPyAke293bk9ubHkgPyAnQU5EIGRldmljZV9pZCA9ID8nIDogJyd9IE9SREVSIEJZIHNlcSBBU0NgLFxyXG4gICAgICApXHJcbiAgICAgIC5hbGwoLi4uKG93bk9ubHkgPyBbc2VxLCB0aGlzLmRldmljZUlkXSA6IFtzZXFdKSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcclxuICAgICAgc2VxOiBOdW1iZXIoci5zZXEpLFxyXG4gICAgICBvcDoge1xyXG4gICAgICAgIG9wSWQ6IFN0cmluZyhyLm9wX2lkKSwgZGV2aWNlSWQ6IFN0cmluZyhyLmRldmljZV9pZCksIGFjdG9ySWQ6IFN0cmluZyhyLmFjdG9yX2lkKSxcclxuICAgICAgICBsYW1wb3J0OiBOdW1iZXIoci5sYW1wb3J0KSwgYXQ6IFN0cmluZyhyLmF0KSwgZW50aXR5OiByLmVudGl0eSBhcyBPcFsnZW50aXR5J10sXHJcbiAgICAgICAgZW50aXR5SWQ6IFN0cmluZyhyLmVudGl0eV9pZCksIGFjdGlvbjogci5hY3Rpb24gYXMgT3BbJ2FjdGlvbiddLFxyXG4gICAgICAgIHBheWxvYWQ6IEpTT04ucGFyc2UoU3RyaW5nKHIucGF5bG9hZCkpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxyXG4gICAgICB9LFxyXG4gICAgfSkpO1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBzYW1wbGUgZGF0YSAtLS0tLS0tLS0tXHJcbiAgcmVtb3ZlU2FtcGxlRGF0YSgpOiBudW1iZXIge1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgY29uc3QgaWRzID0gKHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkIEZST00gaXRlbXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pLm1hcCgocikgPT4gci5pZCk7XHJcbiAgICAgIGZvciAoY29uc3QgaWQgb2YgaWRzKSB0aGlzLmRlbGV0ZUl0ZW0oaWQpO1xyXG4gICAgICBmb3IgKGNvbnN0IG0gb2YgdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaWQgRlJPTSBtaWxlc3RvbmVzIFdIRVJFIHNhbXBsZT0xIEFORCBkZWxldGVkPTAnKS5hbGwoKSBhcyB7IGlkOiBzdHJpbmcgfVtdKSB7XHJcbiAgICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgbWlsZXN0b25lcyBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT8nKS5ydW4obS5pZCk7XHJcbiAgICAgICAgdGhpcy5sb2NhbFNldCgnbWlsZXN0b25lJywgbS5pZCwgeyBkZWxldGVkOiAxIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAoY29uc3QgcmVsIG9mIHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkIEZST00gcmVsZWFzZXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pIHtcclxuICAgICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSByZWxlYXNlcyBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT8nKS5ydW4ocmVsLmlkKTtcclxuICAgICAgICB0aGlzLmxvY2FsU2V0KCdyZWxlYXNlJywgcmVsLmlkLCB7IGRlbGV0ZWQ6IDEgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGlkcy5sZW5ndGg7XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IG4gPSB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICcqJywgZW50aXR5SWQ6ICcqJyB9KTtcclxuICAgIHJldHVybiBuO1xyXG4gIH1cclxufVxyXG5cclxuLy8gLS0tLS0tLS0tLSByb3cgbWFwcGVycyAtLS0tLS0tLS0tXHJcbmV4cG9ydCBmdW5jdGlvbiByb3dUb0l0ZW0ocjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBXb3JrSXRlbSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkOiBTdHJpbmcoci5pZCksXHJcbiAgICBpZGVudDogU3RyaW5nKHIuaWRlbnQpLFxyXG4gICAgdHlwZTogci50eXBlIGFzIEl0ZW1UeXBlLFxyXG4gICAgdGl0bGU6IFN0cmluZyhyLnRpdGxlKSxcclxuICAgIGJvZHk6IFN0cmluZyhyLmJvZHkpLFxyXG4gICAgYm9keVRleHQ6IFN0cmluZyhyLmJvZHlfdGV4dCksXHJcbiAgICBzdGF0dXM6IFN0cmluZyhyLnN0YXR1cyksXHJcbiAgICBwcmlvcml0eTogci5wcmlvcml0eSBhcyBXb3JrSXRlbVsncHJpb3JpdHknXSxcclxuICAgIG93bmVySWQ6IChyLm93bmVyX2lkIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXHJcbiAgICByZXBvcnRlcklkOiAoci5yZXBvcnRlcl9pZCBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxyXG4gICAgbWlsZXN0b25lSWQ6IChyLm1pbGVzdG9uZV9pZCBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxyXG4gICAgcmVsZWFzZUlkOiAoci5yZWxlYXNlX2lkIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXHJcbiAgICBwYXJlbnRJZDogKHIucGFyZW50X2lkIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXHJcbiAgICBzdGFydERhdGU6IChyLnN0YXJ0X2RhdGUgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcclxuICAgIGR1ZURhdGU6IChyLmR1ZV9kYXRlIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXHJcbiAgICBjb21wbGV0ZWRBdDogKHIuY29tcGxldGVkX2F0IGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXHJcbiAgICBlZmZvcnQ6IHIuZWZmb3J0ID09IG51bGwgPyBudWxsIDogTnVtYmVyKHIuZWZmb3J0KSxcclxuICAgIGNvbmZpZGVuY2U6IChyLmNvbmZpZGVuY2UgYXMgV29ya0l0ZW1bJ2NvbmZpZGVuY2UnXSkgPz8gbnVsbCxcclxuICAgIHJpc2tMZXZlbDogKHIucmlza19sZXZlbCBhcyBXb3JrSXRlbVsncmlza0xldmVsJ10pID8/IG51bGwsXHJcbiAgICBidXNpbmVzc1ZhbHVlOiAoci5idXNpbmVzc192YWx1ZSBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxyXG4gICAgbGVhZGVyc2hpcFZpc2libGU6IE51bWJlcihyLmxlYWRlcnNoaXBfdmlzaWJsZSkgYXMgMCB8IDEsXHJcbiAgICBwcm9ncmVzczogci5wcm9ncmVzcyA9PSBudWxsID8gbnVsbCA6IE51bWJlcihyLnByb2dyZXNzKSxcclxuICAgIHRhZ3M6IHNhZmVQYXJzZShTdHJpbmcoci50YWdzKSwgW10pIGFzIHN0cmluZ1tdLFxyXG4gICAgZXh0cmE6IHNhZmVQYXJzZShTdHJpbmcoci5leHRyYSksIHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcclxuICAgIGFyY2hpdmVkOiBOdW1iZXIoci5hcmNoaXZlZCkgYXMgMCB8IDEsXHJcbiAgICBzYW1wbGU6IE51bWJlcihyLnNhbXBsZSkgYXMgMCB8IDEsXHJcbiAgICBjcmVhdGVkQXQ6IFN0cmluZyhyLmNyZWF0ZWRfYXQpLFxyXG4gICAgdXBkYXRlZEF0OiBTdHJpbmcoci51cGRhdGVkX2F0KSxcclxuICAgIGNyZWF0ZWRCeTogU3RyaW5nKHIuY3JlYXRlZF9ieSksXHJcbiAgICB1cGRhdGVkQnk6IFN0cmluZyhyLnVwZGF0ZWRfYnkpLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJvd1RvTGluayhyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IEl0ZW1MaW5rIHtcclxuICByZXR1cm4ge1xyXG4gICAgaWQ6IFN0cmluZyhyLmlkKSxcclxuICAgIGZyb21JZDogU3RyaW5nKHIuZnJvbV9pZCksXHJcbiAgICB0b0lkOiBTdHJpbmcoci50b19pZCksXHJcbiAgICBraW5kOiByLmtpbmQgYXMgTGlua0tpbmQsXHJcbiAgICBjcmVhdGVkQXQ6IFN0cmluZyhyLmNyZWF0ZWRfYXQpLFxyXG4gICAgY3JlYXRlZEJ5OiBTdHJpbmcoci5jcmVhdGVkX2J5KSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBzYWZlUGFyc2Uoczogc3RyaW5nLCBmYWxsYmFjazogdW5rbm93bik6IHVua25vd24ge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gSlNPTi5wYXJzZShzKTtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiBmYWxsYmFjaztcclxuICB9XHJcbn1cclxuXHJcbi8qKiBDb252ZXJ0IGZyZWUgdGV4dCB0byBhIHNhZmUgRlRTNSBwcmVmaXggcXVlcnkuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmdHNRdWVyeSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIGNvbnN0IHRlcm1zID0gdGV4dFxyXG4gICAgLnJlcGxhY2UoL1snXCIqKCldL2csICcgJylcclxuICAgIC5zcGxpdCgvXFxzKy8pXHJcbiAgICAuZmlsdGVyKEJvb2xlYW4pXHJcbiAgICAubWFwKCh0KSA9PiBgXCIke3R9XCIqYCk7XHJcbiAgcmV0dXJuIHRlcm1zLmpvaW4oJyAnKSB8fCAnXCJcIic7XHJcbn1cclxuIiwgIi8vIFNoYXJlZCBkb21haW4gdHlwZXMgXHUyMDE0IHNpbmdsZSBzb3VyY2Ugb2YgdHJ1dGggZm9yIG1haW4gcHJvY2VzcyBhbmQgcmVuZGVyZXIuXHJcblxyXG4vLyAtLS0tLS0tLS0tIFRlcm1pbm9sb2d5IC0tLS0tLS0tLS1cclxuLy8gVW1icmVsbGEgbm91bjogXCJXb3JrIEl0ZW1cIi4gRXZlcnkgdHJhY2tlZCByZWNvcmQgaXMgYSB3b3JrIGl0ZW0gd2l0aCBhIHR5cGUuXHJcbi8vIElkZW50cyBhcmUgcGVyLXR5cGUgc2VxdWVuY2VzOiBUQVNLLTEyLCBGRUFULTMsIFJFUS00MSwgREVDLTEyLCBSSVNLLTgsIEJMSy0yLFxyXG4vLyBBQ0MtNSwgTVRHLTE0LCBJREVBLTcsIFEtMywgREVGLTEsIFJFUy00LlxyXG5cclxuZXhwb3J0IGNvbnN0IElURU1fVFlQRVMgPSBbXHJcbiAgJ3Rhc2snLFxyXG4gICdmZWF0dXJlJyxcclxuICAncmVxdWlyZW1lbnQnLFxyXG4gICdzdG9yeScsXHJcbiAgJ2RlY2lzaW9uJyxcclxuICAncmlzaycsXHJcbiAgJ2Jsb2NrZXInLFxyXG4gICdhY2Nlc3MnLFxyXG4gICdtZWV0aW5nJyxcclxuICAnaWRlYScsXHJcbiAgJ3F1ZXN0aW9uJyxcclxuICAnZGVmZWN0JyxcclxuICAncmVzZWFyY2gnLFxyXG5dIGFzIGNvbnN0O1xyXG5leHBvcnQgdHlwZSBJdGVtVHlwZSA9ICh0eXBlb2YgSVRFTV9UWVBFUylbbnVtYmVyXTtcclxuXHJcbmV4cG9ydCBjb25zdCBJREVOVF9QUkVGSVg6IFJlY29yZDxJdGVtVHlwZSwgc3RyaW5nPiA9IHtcclxuICB0YXNrOiAnVEFTSycsXHJcbiAgZmVhdHVyZTogJ0ZFQVQnLFxyXG4gIHJlcXVpcmVtZW50OiAnUkVRJyxcclxuICBzdG9yeTogJ1NUT1JZJyxcclxuICBkZWNpc2lvbjogJ0RFQycsXHJcbiAgcmlzazogJ1JJU0snLFxyXG4gIGJsb2NrZXI6ICdCTEsnLFxyXG4gIGFjY2VzczogJ0FDQycsXHJcbiAgbWVldGluZzogJ01URycsXHJcbiAgaWRlYTogJ0lERUEnLFxyXG4gIHF1ZXN0aW9uOiAnUScsXHJcbiAgZGVmZWN0OiAnREVGJyxcclxuICByZXNlYXJjaDogJ1JFUycsXHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgVFlQRV9MQUJFTDogUmVjb3JkPEl0ZW1UeXBlLCBzdHJpbmc+ID0ge1xyXG4gIHRhc2s6ICdUYXNrJyxcclxuICBmZWF0dXJlOiAnRmVhdHVyZScsXHJcbiAgcmVxdWlyZW1lbnQ6ICdSZXF1aXJlbWVudCcsXHJcbiAgc3Rvcnk6ICdVc2VyIFN0b3J5JyxcclxuICBkZWNpc2lvbjogJ0RlY2lzaW9uJyxcclxuICByaXNrOiAnUmlzaycsXHJcbiAgYmxvY2tlcjogJ0Jsb2NrZXInLFxyXG4gIGFjY2VzczogJ0FjY2VzcyBSZXF1ZXN0JyxcclxuICBtZWV0aW5nOiAnTWVldGluZyBOb3RlJyxcclxuICBpZGVhOiAnSWRlYScsXHJcbiAgcXVlc3Rpb246ICdPcGVuIFF1ZXN0aW9uJyxcclxuICBkZWZlY3Q6ICdEZWZlY3QnLFxyXG4gIHJlc2VhcmNoOiAnUmVzZWFyY2gnLFxyXG59O1xyXG5cclxuLy8gLS0tLS0tLS0tLSBTdGF0dXNlcyAtLS0tLS0tLS0tXHJcbi8vIFdvcmsgc3RhdHVzZXMgYXBwbHkgdG8gZXhlY3V0YWJsZSBpdGVtcyAodGFzay9mZWF0dXJlL3JlcXVpcmVtZW50L3N0b3J5L2RlZmVjdC9yZXNlYXJjaC9pZGVhKS5cclxuZXhwb3J0IGNvbnN0IFdPUktfU1RBVFVTRVMgPSBbXHJcbiAgJ2JhY2tsb2cnLFxyXG4gICd0b2RvJyxcclxuICAnaW5fcHJvZ3Jlc3MnLFxyXG4gICdpbl9yZXZpZXcnLFxyXG4gICdibG9ja2VkJyxcclxuICAnZG9uZScsXHJcbiAgJ2NhbmNlbGxlZCcsXHJcbl0gYXMgY29uc3Q7XHJcbmV4cG9ydCB0eXBlIFdvcmtTdGF0dXMgPSAodHlwZW9mIFdPUktfU1RBVFVTRVMpW251bWJlcl07XHJcblxyXG5leHBvcnQgY29uc3QgREVDSVNJT05fU1RBVFVTRVMgPSBbXHJcbiAgJ3Byb3Bvc2VkJyxcclxuICAnZGlzY3Vzc2luZycsXHJcbiAgJ2FwcHJvdmVkJyxcclxuICAncmVqZWN0ZWQnLFxyXG4gICdyZXZpc2l0JyxcclxuICAnc3VwZXJzZWRlZCcsXHJcbl0gYXMgY29uc3Q7XHJcbmV4cG9ydCB0eXBlIERlY2lzaW9uU3RhdHVzID0gKHR5cGVvZiBERUNJU0lPTl9TVEFUVVNFUylbbnVtYmVyXTtcclxuXHJcbmV4cG9ydCBjb25zdCBBQ0NFU1NfU1RBVFVTRVMgPSBbXHJcbiAgJ2lkZW50aWZpZWQnLFxyXG4gICdub3RfcmVxdWVzdGVkJyxcclxuICAncHJlcGFyaW5nJyxcclxuICAncmVxdWVzdGVkJyxcclxuICAndW5kZXJfcmV2aWV3JyxcclxuICAnaW5mb19uZWVkZWQnLFxyXG4gICdhcHByb3ZlZCcsXHJcbiAgJ3BhcnRpYWxseV9hcHByb3ZlZCcsXHJcbiAgJ2dyYW50ZWQnLFxyXG4gICdkZW5pZWQnLFxyXG4gICdleHBpcmVkJyxcclxuICAnbm90X25lZWRlZCcsXHJcbl0gYXMgY29uc3Q7XHJcbmV4cG9ydCB0eXBlIEFjY2Vzc1N0YXR1cyA9ICh0eXBlb2YgQUNDRVNTX1NUQVRVU0VTKVtudW1iZXJdO1xyXG5cclxuZXhwb3J0IGNvbnN0IFJJU0tfU1RBVFVTRVMgPSBbJ29wZW4nLCAnbWl0aWdhdGluZycsICdhY2NlcHRlZCcsICdjbG9zZWQnXSBhcyBjb25zdDtcclxuZXhwb3J0IGNvbnN0IEJMT0NLRVJfU1RBVFVTRVMgPSBbJ2FjdGl2ZScsICd3b3JrYXJvdW5kJywgJ3Jlc29sdmVkJ10gYXMgY29uc3Q7XHJcbmV4cG9ydCBjb25zdCBRVUVTVElPTl9TVEFUVVNFUyA9IFsnb3BlbicsICdhbnN3ZXJlZCcsICdwYXJrZWQnXSBhcyBjb25zdDtcclxuZXhwb3J0IGNvbnN0IE1FRVRJTkdfU1RBVFVTRVMgPSBbJ3NjaGVkdWxlZCcsICdoZWxkJywgJ3N1bW1hcml6ZWQnXSBhcyBjb25zdDtcclxuXHJcbmV4cG9ydCB0eXBlIEl0ZW1TdGF0dXMgPSBzdHJpbmc7IC8vIHZhbGlkYXRlZCBwZXItdHlwZSBieSBzdGF0dXNlc0ZvclR5cGUoKVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN0YXR1c2VzRm9yVHlwZSh0eXBlOiBJdGVtVHlwZSk6IHJlYWRvbmx5IHN0cmluZ1tdIHtcclxuICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgIGNhc2UgJ2RlY2lzaW9uJzpcclxuICAgICAgcmV0dXJuIERFQ0lTSU9OX1NUQVRVU0VTO1xyXG4gICAgY2FzZSAnYWNjZXNzJzpcclxuICAgICAgcmV0dXJuIEFDQ0VTU19TVEFUVVNFUztcclxuICAgIGNhc2UgJ3Jpc2snOlxyXG4gICAgICByZXR1cm4gUklTS19TVEFUVVNFUztcclxuICAgIGNhc2UgJ2Jsb2NrZXInOlxyXG4gICAgICByZXR1cm4gQkxPQ0tFUl9TVEFUVVNFUztcclxuICAgIGNhc2UgJ3F1ZXN0aW9uJzpcclxuICAgICAgcmV0dXJuIFFVRVNUSU9OX1NUQVRVU0VTO1xyXG4gICAgY2FzZSAnbWVldGluZyc6XHJcbiAgICAgIHJldHVybiBNRUVUSU5HX1NUQVRVU0VTO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuIFdPUktfU1RBVFVTRVM7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgU1RBVFVTX0xBQkVMOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xyXG4gIGJhY2tsb2c6ICdCYWNrbG9nJyxcclxuICB0b2RvOiAnVG8gRG8nLFxyXG4gIGluX3Byb2dyZXNzOiAnSW4gUHJvZ3Jlc3MnLFxyXG4gIGluX3JldmlldzogJ0luIFJldmlldycsXHJcbiAgYmxvY2tlZDogJ0Jsb2NrZWQnLFxyXG4gIGRvbmU6ICdEb25lJyxcclxuICBjYW5jZWxsZWQ6ICdDYW5jZWxsZWQnLFxyXG4gIHByb3Bvc2VkOiAnUHJvcG9zZWQnLFxyXG4gIGRpc2N1c3Npbmc6ICdEaXNjdXNzaW5nJyxcclxuICBhcHByb3ZlZDogJ0FwcHJvdmVkJyxcclxuICByZWplY3RlZDogJ1JlamVjdGVkJyxcclxuICByZXZpc2l0OiAnUmV2aXNpdCBMYXRlcicsXHJcbiAgc3VwZXJzZWRlZDogJ1N1cGVyc2VkZWQnLFxyXG4gIGlkZW50aWZpZWQ6ICdJZGVudGlmaWVkJyxcclxuICBub3RfcmVxdWVzdGVkOiAnTm90IFJlcXVlc3RlZCcsXHJcbiAgcHJlcGFyaW5nOiAnUHJlcGFyaW5nIFJlcXVlc3QnLFxyXG4gIHJlcXVlc3RlZDogJ1JlcXVlc3RlZCcsXHJcbiAgdW5kZXJfcmV2aWV3OiAnVW5kZXIgUmV2aWV3JyxcclxuICBpbmZvX25lZWRlZDogJ01vcmUgSW5mbyBOZWVkZWQnLFxyXG4gIHBhcnRpYWxseV9hcHByb3ZlZDogJ1BhcnRpYWxseSBBcHByb3ZlZCcsXHJcbiAgZ3JhbnRlZDogJ0dyYW50ZWQnLFxyXG4gIGRlbmllZDogJ0RlbmllZCcsXHJcbiAgZXhwaXJlZDogJ0V4cGlyZWQnLFxyXG4gIG5vdF9uZWVkZWQ6ICdObyBMb25nZXIgTmVlZGVkJyxcclxuICBvcGVuOiAnT3BlbicsXHJcbiAgbWl0aWdhdGluZzogJ01pdGlnYXRpbmcnLFxyXG4gIGFjY2VwdGVkOiAnQWNjZXB0ZWQnLFxyXG4gIGNsb3NlZDogJ0Nsb3NlZCcsXHJcbiAgYWN0aXZlOiAnQWN0aXZlJyxcclxuICB3b3JrYXJvdW5kOiAnV29ya2Fyb3VuZCBJbiBQbGFjZScsXHJcbiAgcmVzb2x2ZWQ6ICdSZXNvbHZlZCcsXHJcbiAgYW5zd2VyZWQ6ICdBbnN3ZXJlZCcsXHJcbiAgcGFya2VkOiAnUGFya2VkJyxcclxuICBzY2hlZHVsZWQ6ICdTY2hlZHVsZWQnLFxyXG4gIGhlbGQ6ICdIZWxkJyxcclxuICBzdW1tYXJpemVkOiAnU3VtbWFyaXplZCcsXHJcbn07XHJcblxyXG4vKiogU3RhdHVzZXMgdGhhdCBjb3VudCBhcyBcImNsb3NlZC90ZXJtaW5hbFwiIGZvciBwcm9ncmVzcyArIGRhc2hib2FyZHMuICovXHJcbmV4cG9ydCBjb25zdCBURVJNSU5BTF9TVEFUVVNFUyA9IG5ldyBTZXQoW1xyXG4gICdkb25lJyxcclxuICAnY2FuY2VsbGVkJyxcclxuICAncmVqZWN0ZWQnLFxyXG4gICdzdXBlcnNlZGVkJyxcclxuICAnZ3JhbnRlZCcsXHJcbiAgJ2RlbmllZCcsXHJcbiAgJ2V4cGlyZWQnLFxyXG4gICdub3RfbmVlZGVkJyxcclxuICAnY2xvc2VkJyxcclxuICAncmVzb2x2ZWQnLFxyXG4gICdhbnN3ZXJlZCcsXHJcbiAgJ3N1bW1hcml6ZWQnLFxyXG4gICdhY2NlcHRlZCcsXHJcbl0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IFBSSU9SSVRJRVMgPSBbJ3VyZ2VudCcsICdoaWdoJywgJ21lZGl1bScsICdsb3cnLCAnbm9uZSddIGFzIGNvbnN0O1xyXG5leHBvcnQgdHlwZSBQcmlvcml0eSA9ICh0eXBlb2YgUFJJT1JJVElFUylbbnVtYmVyXTtcclxuXHJcbi8vIC0tLS0tLS0tLS0gTGlua3MgLS0tLS0tLS0tLVxyXG5leHBvcnQgY29uc3QgTElOS19LSU5EUyA9IFtcclxuICAncmVsYXRlcycsIC8vIGdlbmVyaWMgYmlkaXJlY3Rpb25hbFxyXG4gICdibG9ja3MnLCAvLyBmcm9tIGJsb2NrcyB0b1xyXG4gICdpbXBsZW1lbnRzJywgLy8gdGFzayBpbXBsZW1lbnRzIHJlcXVpcmVtZW50L2ZlYXR1cmVcclxuICAnc3VwcG9ydHMnLCAvLyByZXF1aXJlbWVudCBzdXBwb3J0cyBmZWF0dXJlXHJcbiAgJ3NoYXBlZF9ieScsIC8vIGl0ZW0gc2hhcGVkIGJ5IGRlY2lzaW9uXHJcbiAgJ3JlcXVpcmVzX2FjY2VzcycsIC8vIGl0ZW0gcmVxdWlyZXMgYWNjZXNzIHJlY29yZFxyXG4gICdkaXNjdXNzZWRfaW4nLCAvLyBpdGVtIGRpc2N1c3NlZCBpbiBtZWV0aW5nXHJcbiAgJ3ZhbGlkYXRlcycsIC8vIHRlc3QvZGVmZWN0IHZhbGlkYXRlcyByZXF1aXJlbWVudFxyXG4gICdzdXBlcnNlZGVzJywgLy8gZGVjaXNpb24gc3VwZXJzZWRlcyBkZWNpc2lvblxyXG4gICdwYXJlbnQnLCAvLyBmcm9tIGlzIHBhcmVudCBvZiB0byAoYWxzbyBtaXJyb3JlZCB2aWEgaXRlbXMucGFyZW50X2lkKVxyXG5dIGFzIGNvbnN0O1xyXG5leHBvcnQgdHlwZSBMaW5rS2luZCA9ICh0eXBlb2YgTElOS19LSU5EUylbbnVtYmVyXTtcclxuXHJcbmV4cG9ydCBjb25zdCBMSU5LX0xBQkVMOiBSZWNvcmQ8TGlua0tpbmQsIFtzdHJpbmcsIHN0cmluZ10+ID0ge1xyXG4gIC8vIFtsYWJlbCBmcm9tLT50bywgbGFiZWwgdG8tPmZyb21dXHJcbiAgcmVsYXRlczogWydyZWxhdGVzIHRvJywgJ3JlbGF0ZXMgdG8nXSxcclxuICBibG9ja3M6IFsnYmxvY2tzJywgJ2Jsb2NrZWQgYnknXSxcclxuICBpbXBsZW1lbnRzOiBbJ2ltcGxlbWVudHMnLCAnaW1wbGVtZW50ZWQgYnknXSxcclxuICBzdXBwb3J0czogWydzdXBwb3J0cycsICdzdXBwb3J0ZWQgYnknXSxcclxuICBzaGFwZWRfYnk6IFsnc2hhcGVkIGJ5JywgJ3NoYXBlZCddLFxyXG4gIHJlcXVpcmVzX2FjY2VzczogWydyZXF1aXJlcyBhY2Nlc3MnLCAncmVxdWlyZWQgZm9yJ10sXHJcbiAgZGlzY3Vzc2VkX2luOiBbJ2Rpc2N1c3NlZCBpbicsICdkaXNjdXNzZWQnXSxcclxuICB2YWxpZGF0ZXM6IFsndmFsaWRhdGVzJywgJ3ZhbGlkYXRlZCBieSddLFxyXG4gIHN1cGVyc2VkZXM6IFsnc3VwZXJzZWRlcycsICdzdXBlcnNlZGVkIGJ5J10sXHJcbiAgcGFyZW50OiBbJ3BhcmVudCBvZicsICdjaGlsZCBvZiddLFxyXG59O1xyXG5cclxuLy8gLS0tLS0tLS0tLSBDb3JlIHJlY29yZHMgLS0tLS0tLS0tLVxyXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtJdGVtIHtcclxuICBpZDogc3RyaW5nOyAvLyB1dWlkIFx1MjAxNCBjYW5vbmljYWwgaWRlbnRpdHksIHVzZWQgYnkgYWxsIHJlZmVyZW5jZXNcclxuICBpZGVudDogc3RyaW5nOyAvLyBkaXNwbGF5IGlkIGUuZy4gUkVRLTQxIChtYXkgYmUgcmVudW1iZXJlZCBvbiBzeW5jIGNvbGxpc2lvbilcclxuICB0eXBlOiBJdGVtVHlwZTtcclxuICB0aXRsZTogc3RyaW5nO1xyXG4gIGJvZHk6IHN0cmluZzsgLy8gcmljaCBkb2MgSlNPTiAoZWRpdG9yIGRvY3VtZW50KSwgJycgd2hlbiBlbXB0eVxyXG4gIGJvZHlUZXh0OiBzdHJpbmc7IC8vIHBsYWluIHRleHQgcHJvamVjdGlvbiBmb3Igc2VhcmNoXHJcbiAgc3RhdHVzOiBzdHJpbmc7XHJcbiAgcHJpb3JpdHk6IFByaW9yaXR5O1xyXG4gIG93bmVySWQ6IHN0cmluZyB8IG51bGw7XHJcbiAgcmVwb3J0ZXJJZDogc3RyaW5nIHwgbnVsbDtcclxuICBtaWxlc3RvbmVJZDogc3RyaW5nIHwgbnVsbDtcclxuICByZWxlYXNlSWQ6IHN0cmluZyB8IG51bGw7XHJcbiAgcGFyZW50SWQ6IHN0cmluZyB8IG51bGw7XHJcbiAgc3RhcnREYXRlOiBzdHJpbmcgfCBudWxsOyAvLyBJU08gZGF0ZVxyXG4gIGR1ZURhdGU6IHN0cmluZyB8IG51bGw7XHJcbiAgY29tcGxldGVkQXQ6IHN0cmluZyB8IG51bGw7IC8vIElTTyBkYXRldGltZVxyXG4gIGVmZm9ydDogbnVtYmVyIHwgbnVsbDsgLy8gcG9pbnRzL2RheXMsIHVuaXQgaXMgdGVhbSBjb252ZW50aW9uXHJcbiAgY29uZmlkZW5jZTogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJyB8IG51bGw7XHJcbiAgcmlza0xldmVsOiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgJ2NyaXRpY2FsJyB8IG51bGw7XHJcbiAgYnVzaW5lc3NWYWx1ZTogc3RyaW5nIHwgbnVsbDtcclxuICBsZWFkZXJzaGlwVmlzaWJsZTogMCB8IDE7XHJcbiAgcHJvZ3Jlc3M6IG51bWJlciB8IG51bGw7IC8vIDAtMTAwIG1hbnVhbCBvdmVycmlkZTsgbnVsbCA9IGRlcml2ZWRcclxuICB0YWdzOiBzdHJpbmdbXTtcclxuICBleHRyYTogUmVjb3JkPHN0cmluZywgdW5rbm93bj47IC8vIHR5cGUtc3BlY2lmaWMgZmllbGRzIChzZWUgZG9jcy9URVJNSU5PTE9HWS5tZClcclxuICBhcmNoaXZlZDogMCB8IDE7XHJcbiAgc2FtcGxlOiAwIHwgMTsgLy8gc2VlZGVkIHNhbXBsZSBkYXRhIGZsYWdcclxuICBjcmVhdGVkQXQ6IHN0cmluZztcclxuICB1cGRhdGVkQXQ6IHN0cmluZztcclxuICBjcmVhdGVkQnk6IHN0cmluZztcclxuICB1cGRhdGVkQnk6IHN0cmluZztcclxufVxyXG5cclxuLy8gVHlwZS1zcGVjaWZpYyBgZXh0cmFgIHNoYXBlcyAoZG9jdW1lbnRlZCwgbm90IGVuZm9yY2VkIGJ5IERCKTpcclxuLy8gYWNjZXNzOiAgIHsgc3lzdGVtLCBhY2Nlc3NUeXBlLCBidXNpbmVzc1JlYXNvbiwgcmVxdWVzdGVkRnJvbSwgcmVxdWVzdERhdGUsXHJcbi8vICAgICAgICAgICAgIGFwcHJvdmVkQnksIGRhdGVHcmFudGVkLCBleHBpcmF0aW9uRGF0ZSwgcmVuZXdhbERhdGUsIHNlY3VyaXR5Tm90ZXMsIG5leHRBY3Rpb24sIGZvbGxvd1VwRGF0ZSB9XHJcbi8vIGRlY2lzaW9uOiB7IGNvbnRleHQsIHByb2JsZW0sIG9wdGlvbnM6IFt7dGl0bGUsIG5vdGVzLCBzZWxlY3RlZH1dLCByZWFzb25pbmcsXHJcbi8vICAgICAgICAgICAgIHRyYWRlb2ZmcywgY29uc2VxdWVuY2VzLCByZXZpZXdEYXRlLCBjb250cmlidXRvcnM6IHN0cmluZ1tdIH1cclxuLy8gbWVldGluZzogIHsgZGF0ZSwgdGltZSwgYXR0ZW5kZWVzOiBzdHJpbmdbXSwgcHVycG9zZSwgYWdlbmRhLCBmb2xsb3dVcERhdGUgfVxyXG4vLyByaXNrOiAgICAgeyBsaWtlbGlob29kLCBpbXBhY3QsIG1pdGlnYXRpb24sIHRyaWdnZXIgfVxyXG4vLyBibG9ja2VyOiAgeyB3YWl0aW5nT24sIHNpbmNlLCBlc2NhbGF0ZWRUbyB9XHJcbi8vIHJlcXVpcmVtZW50OiB7IGFjY2VwdGFuY2VDcml0ZXJpYSwgdGVzdGluZ05vdGVzLCBzZWN1cml0eUNvbnNpZGVyYXRpb25zIH1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSXRlbUxpbmsge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgZnJvbUlkOiBzdHJpbmc7XHJcbiAgdG9JZDogc3RyaW5nO1xyXG4gIGtpbmQ6IExpbmtLaW5kO1xyXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG4gIGNyZWF0ZWRCeTogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvbW1lbnQge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgaXRlbUlkOiBzdHJpbmc7XHJcbiAgYXV0aG9ySWQ6IHN0cmluZztcclxuICBib2R5OiBzdHJpbmc7IC8vIHJpY2ggZG9jIEpTT05cclxuICBib2R5VGV4dDogc3RyaW5nO1xyXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG4gIHVwZGF0ZWRBdDogc3RyaW5nIHwgbnVsbDtcclxuICB1cGRhdGVkQnk/OiBzdHJpbmcgfCBudWxsO1xyXG4gIGRlbGV0ZWQ6IDAgfCAxO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEF0dGFjaG1lbnQge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgaXRlbUlkOiBzdHJpbmc7XHJcbiAgZmlsZW5hbWU6IHN0cmluZztcclxuICBtaW1lOiBzdHJpbmc7XHJcbiAgc2l6ZTogbnVtYmVyO1xyXG4gIHNoYTI1Njogc3RyaW5nO1xyXG4gIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCBudWxsO1xyXG4gIHVwbG9hZGVkQnk6IHN0cmluZztcclxuICBjcmVhdGVkQXQ6IHN0cmluZztcclxuICBkZWxldGVkOiAwIHwgMTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBY3Rpdml0eUVudHJ5IHtcclxuICBpZDogc3RyaW5nO1xyXG4gIGl0ZW1JZDogc3RyaW5nIHwgbnVsbDtcclxuICBhY3RvcklkOiBzdHJpbmc7XHJcbiAga2luZDogc3RyaW5nOyAvLyBjcmVhdGVkIHwgdXBkYXRlZCB8IHN0YXR1cyB8IGNvbW1lbnQgfCBsaW5rIHwgYXR0YWNobWVudCB8IGFyY2hpdmVkIHwgcmVzdG9yZWQgfCAuLi5cclxuICBmaWVsZDogc3RyaW5nIHwgbnVsbDtcclxuICBvbGRWYWx1ZTogc3RyaW5nIHwgbnVsbDtcclxuICBuZXdWYWx1ZTogc3RyaW5nIHwgbnVsbDtcclxuICBhdDogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEl0ZW1WZXJzaW9uIHtcclxuICBpZDogc3RyaW5nO1xyXG4gIGl0ZW1JZDogc3RyaW5nO1xyXG4gIHZlcnNpb246IG51bWJlcjtcclxuICB0aXRsZTogc3RyaW5nO1xyXG4gIGJvZHk6IHN0cmluZztcclxuICBzYXZlZEJ5OiBzdHJpbmc7XHJcbiAgc2F2ZWRBdDogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE1pbGVzdG9uZSB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgZGVzY3JpcHRpb246IHN0cmluZztcclxuICB0YXJnZXREYXRlOiBzdHJpbmcgfCBudWxsO1xyXG4gIHN0YXR1czogJ3BsYW5uZWQnIHwgJ2FjdGl2ZScgfCAnZG9uZSc7XHJcbiAgc29ydDogbnVtYmVyO1xyXG4gIHNhbXBsZTogMCB8IDE7XHJcbiAgY3JlYXRlZEF0Pzogc3RyaW5nO1xyXG4gIGNyZWF0ZWRCeT86IHN0cmluZztcclxuICB1cGRhdGVkQXQ/OiBzdHJpbmc7XHJcbiAgdXBkYXRlZEJ5Pzogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFJlbGVhc2Uge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgbmFtZTogc3RyaW5nO1xyXG4gIHZlcnNpb246IHN0cmluZztcclxuICB0YXJnZXREYXRlOiBzdHJpbmcgfCBudWxsO1xyXG4gIHN0YXR1czogJ3BsYW5uZWQnIHwgJ2luX3Byb2dyZXNzJyB8ICdyZWxlYXNlZCcgfCAnY2FuY2VsbGVkJztcclxuICBnb2Fsczogc3RyaW5nO1xyXG4gIG5vdGVzOiBzdHJpbmc7IC8vIHJlbGVhc2Ugbm90ZXMgcmljaCBkb2NcclxuICBzYW1wbGU6IDAgfCAxO1xyXG4gIGNyZWF0ZWRBdD86IHN0cmluZztcclxuICBjcmVhdGVkQnk/OiBzdHJpbmc7XHJcbiAgdXBkYXRlZEF0Pzogc3RyaW5nO1xyXG4gIHVwZGF0ZWRCeT86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBVc2VyIHtcclxuICBpZDogc3RyaW5nOyAvLyBzdGFibGUgc2x1ZywgZS5nLiAnam9obicsICdtYXJrJ1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBpbml0aWFsczogc3RyaW5nO1xyXG4gIGNvbG9yOiBzdHJpbmc7XHJcbiAgYXZhdGFyPzogc3RyaW5nIHwgbnVsbDsgLy8gaW1hZ2UgZGF0YSBVUkw7IG51bGwvYWJzZW50ID0gcmVuZGVyIGluaXRpYWxzIG9uIGNvbG9yXHJcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2F2ZWRWaWV3IHtcclxuICBpZDogc3RyaW5nO1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBjb25maWc6IFJlY29yZDxzdHJpbmcsIHVua25vd24+OyAvLyB7dmlldywgZmlsdGVycywgc29ydCwgZ3JvdXB9XHJcbiAgcGlubmVkOiAwIHwgMTtcclxuICBjcmVhdGVkQnk6IHN0cmluZztcclxuICBjcmVhdGVkQXQ6IHN0cmluZztcclxufVxyXG5cclxuLy8gLS0tLS0tLS0tLSBQZXItdXNlciB2aWV3IGxheW91dCBwcmVmZXJlbmNlcyAobG9jYWwsIG5vdCBzeW5jZWQpIC0tLS0tLS0tLS1cclxuZXhwb3J0IHR5cGUgVmlld1NpemUgPSAnc21hbGwnIHwgJ3N0YW5kYXJkJyB8ICdsYXJnZSc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFZpZXdJdGVtUHJlZiB7XHJcbiAga2V5OiBzdHJpbmc7IC8vIHN0YWJsZSBjYXJkL2NvbHVtbiBrZXlcclxuICB2aXNpYmxlOiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNpbmdsZVZpZXdQcmVmcyB7XHJcbiAgc2l6ZTogVmlld1NpemU7XHJcbiAgaXRlbXM6IFZpZXdJdGVtUHJlZltdOyAvLyBvcmRlcmVkOyBkcml2ZXMgYXJyYW5nZW1lbnQgKyB2aXNpYmlsaXR5XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVmlld1ByZWZzIHtcclxuICBib2FyZD86IFNpbmdsZVZpZXdQcmVmcztcclxuICBkYXNoYm9hcmQ/OiBTaW5nbGVWaWV3UHJlZnM7XHJcbn1cclxuXHJcbi8vIC0tLS0tLS0tLS0gU3luYyAtLS0tLS0tLS0tXHJcbmV4cG9ydCBpbnRlcmZhY2UgT3Age1xyXG4gIG9wSWQ6IHN0cmluZzsgLy8gdXVpZFxyXG4gIGRldmljZUlkOiBzdHJpbmc7XHJcbiAgYWN0b3JJZDogc3RyaW5nO1xyXG4gIGxhbXBvcnQ6IG51bWJlcjtcclxuICBhdDogc3RyaW5nOyAvLyB3YWxsIGNsb2NrLCBpbmZvcm1hdGlvbmFsIG9ubHkgXHUyMDE0IG9yZGVyaW5nIHVzZXMgbGFtcG9ydFxyXG4gIGVudGl0eTogJ2l0ZW0nIHwgJ2xpbmsnIHwgJ2NvbW1lbnQnIHwgJ2F0dGFjaG1lbnQnIHwgJ21pbGVzdG9uZScgfCAncmVsZWFzZScgfCAndXNlcicgfCAnc2F2ZWRfdmlldycgfCAndGFnc2V0JztcclxuICBlbnRpdHlJZDogc3RyaW5nO1xyXG4gIGFjdGlvbjogJ2NyZWF0ZScgfCAnc2V0JyB8ICdkZWxldGUnO1xyXG4gIC8vIGNyZWF0ZTogcGF5bG9hZCA9IGZ1bGwgcmVjb3JkLiBzZXQ6IHBheWxvYWQgPSB7ZmllbGQ6IHZhbHVlLC4uLn0uIGRlbGV0ZTogcGF5bG9hZCA9IHt9LlxyXG4gIHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN5bmNDb25mbGljdCB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBlbnRpdHk6IHN0cmluZztcclxuICBlbnRpdHlJZDogc3RyaW5nO1xyXG4gIGZpZWxkOiBzdHJpbmc7XHJcbiAgbG9jYWxWYWx1ZTogc3RyaW5nO1xyXG4gIHJlbW90ZVZhbHVlOiBzdHJpbmc7XHJcbiAgcmVtb3RlRGV2aWNlOiBzdHJpbmc7XHJcbiAgcmVtb3RlQWN0b3I6IHN0cmluZztcclxuICBkZXRlY3RlZEF0OiBzdHJpbmc7XHJcbiAgcmVzb2x2ZWRBdDogc3RyaW5nIHwgbnVsbDtcclxuICByZXNvbHV0aW9uOiAnbG9jYWwnIHwgJ3JlbW90ZScgfCAnbWVyZ2VkJyB8IG51bGw7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFN5bmNTdGF0dXNTdGF0ZSA9ICdkaXNhYmxlZCcgfCAnaWRsZScgfCAnc3luY2luZycgfCAnb2ZmbGluZScgfCAnZXJyb3InO1xyXG5leHBvcnQgaW50ZXJmYWNlIFN5bmNTdGF0dXMge1xyXG4gIHN0YXRlOiBTeW5jU3RhdHVzU3RhdGU7XHJcbiAgZm9sZGVyOiBzdHJpbmcgfCBudWxsO1xyXG4gIGxhc3RTeW5jQXQ6IHN0cmluZyB8IG51bGw7XHJcbiAgbGFzdEVycm9yOiBzdHJpbmcgfCBudWxsO1xyXG4gIHBlbmRpbmdPcHM6IG51bWJlcjtcclxuICBvcGVuQ29uZmxpY3RzOiBudW1iZXI7XHJcbiAgcGVlcnM6IHsgZGV2aWNlSWQ6IHN0cmluZzsgdXNlck5hbWU6IHN0cmluZyB8IG51bGw7IGxhc3RTZWVuQXQ6IHN0cmluZyB8IG51bGwgfVtdO1xyXG59XHJcblxyXG4vLyAtLS0tLS0tLS0tIFF1ZXJpZXMgLS0tLS0tLS0tLVxyXG5leHBvcnQgaW50ZXJmYWNlIEl0ZW1GaWx0ZXIge1xyXG4gIHR5cGVzPzogSXRlbVR5cGVbXTtcclxuICBzdGF0dXNlcz86IHN0cmluZ1tdO1xyXG4gIHByaW9yaXRpZXM/OiBQcmlvcml0eVtdO1xyXG4gIG93bmVySWRzPzogKHN0cmluZyB8IG51bGwpW107XHJcbiAgbWlsZXN0b25lSWQ/OiBzdHJpbmc7XHJcbiAgcmVsZWFzZUlkPzogc3RyaW5nO1xyXG4gIHRhZz86IHN0cmluZztcclxuICB0ZXh0Pzogc3RyaW5nOyAvLyBGVFMgcXVlcnlcclxuICBhcmNoaXZlZD86IGJvb2xlYW47IC8vIGRlZmF1bHQgZmFsc2VcclxuICBvdmVyZHVlPzogYm9vbGVhbjtcclxuICBkdWVXaXRoaW5EYXlzPzogbnVtYmVyO1xyXG4gIGxlYWRlcnNoaXBWaXNpYmxlPzogYm9vbGVhbjtcclxuICB1cGRhdGVkU2luY2U/OiBzdHJpbmc7XHJcbiAgcGFyZW50SWQ/OiBzdHJpbmc7XHJcbiAgc2FtcGxlPzogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJdGVtU29ydCB7XHJcbiAgZmllbGQ6ICdpZGVudCcgfCAndGl0bGUnIHwgJ3N0YXR1cycgfCAncHJpb3JpdHknIHwgJ2R1ZURhdGUnIHwgJ2NyZWF0ZWRBdCcgfCAndXBkYXRlZEF0JyB8ICdtYW51YWwnO1xyXG4gIGRpcjogJ2FzYycgfCAnZGVzYyc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoUmVzdWx0IHtcclxuICBpdGVtOiBXb3JrSXRlbTtcclxuICBzbmlwcGV0OiBzdHJpbmcgfCBudWxsO1xyXG4gIHNjb3JlOiBudW1iZXI7XHJcbn1cclxuIiwgIi8vIFJpY2gtZG9jIGhlbHBlcnMgc2hhcmVkIGJ5IG1haW4gcHJvY2VzcyBhbmQgcmVuZGVyZXIuXHJcblxyXG4vKiogRXh0cmFjdCBwbGFpbiB0ZXh0IGZyb20gYSBzdG9yZWQgZWRpdG9yIGRvY3VtZW50IChUaXBUYXAgSlNPTiBzdHJpbmcpLiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZG9jVG9UZXh0KGJvZHk6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgaWYgKCFib2R5KSByZXR1cm4gJyc7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRvYyA9IEpTT04ucGFyc2UoYm9keSkgYXMgeyBjb250ZW50PzogdW5rbm93bltdIH07XHJcbiAgICBjb25zdCB3YWxrID0gKG5vZGVzOiB1bmtub3duW10pOiBzdHJpbmcgPT5cclxuICAgICAgbm9kZXNcclxuICAgICAgICAubWFwKChuKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBub2RlID0gbiBhcyB7IHR5cGU/OiBzdHJpbmc7IHRleHQ/OiBzdHJpbmc7IGNvbnRlbnQ/OiB1bmtub3duW10gfTtcclxuICAgICAgICAgIGlmIChub2RlLnRleHQpIHJldHVybiBub2RlLnRleHQ7XHJcbiAgICAgICAgICBjb25zdCBpbm5lciA9IG5vZGUuY29udGVudCA/IHdhbGsobm9kZS5jb250ZW50KSA6ICcnO1xyXG4gICAgICAgICAgcmV0dXJuIG5vZGUudHlwZSA9PT0gJ3BhcmFncmFwaCcgfHwgbm9kZS50eXBlPy5zdGFydHNXaXRoKCdoZWFkaW5nJykgPyBpbm5lciArICdcXG4nIDogaW5uZXI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuam9pbignJyk7XHJcbiAgICByZXR1cm4gd2Fsayhkb2MuY29udGVudCA/PyBbXSkudHJpbSgpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIGJvZHk7XHJcbiAgfVxyXG59XHJcblxyXG4vKiogV3JhcCBwbGFpbiB0ZXh0IGludG8gYSBtaW5pbWFsIGVkaXRvciBkb2N1bWVudC4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHRleHRUb0RvYyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICB0eXBlOiAnZG9jJyxcclxuICAgIGNvbnRlbnQ6IHRleHQuc3BsaXQoL1xcbnsyLH0vKS5tYXAoKHApID0+ICh7XHJcbiAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnLFxyXG4gICAgICBjb250ZW50OiBwID8gW3sgdHlwZTogJ3RleHQnLCB0ZXh0OiBwIH1dIDogW10sXHJcbiAgICB9KSksXHJcbiAgfSk7XHJcbn1cclxuIiwgIi8vIFN5bmNUcmFuc3BvcnQ6IHRoZSBzZWFtIGJldHdlZW4gVGV0aGVyIGFuZCB3aGF0ZXZlciBtb3ZlcyBieXRlcyBiZXR3ZWVuIG1hY2hpbmVzLlxyXG4vLyB2MSBzaGlwcyBGb2xkZXJUcmFuc3BvcnQgKGEgT25lRHJpdmUvU2hhcmVQb2ludC1zeW5jZWQgZm9sZGVyKS4gVGhlIGludGVyZmFjZSBpc1xyXG4vLyBkZWxpYmVyYXRlbHkgZHVtYiBcdTIwMTQgYXBwZW5kLW9ubHkgYmF0Y2hlcyBvdXQsIGJhdGNoZXMgaW4gXHUyMDE0IHNvIGEgZnV0dXJlIEF6dXJlIFNRTCAvXHJcbi8vIERhdGF2ZXJzZSAvIGludGVybmFsIEFQSSB0cmFuc3BvcnQgc2xvdHMgaW4gd2l0aG91dCB0b3VjaGluZyBtZXJnZSBsb2dpYy5cclxuXHJcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcclxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcclxuaW1wb3J0IHR5cGUgeyBPcCB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBlZXJJbmZvIHtcclxuICBkZXZpY2VJZDogc3RyaW5nO1xyXG4gIHVzZXJOYW1lOiBzdHJpbmcgfCBudWxsO1xyXG4gIGxhc3RTZWVuQXQ6IHN0cmluZyB8IG51bGw7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgT3BCYXRjaEZpbGUge1xyXG4gIGRldmljZUlkOiBzdHJpbmc7XHJcbiAgZmlsZU5hbWU6IHN0cmluZzsgLy8gc29ydGFibGUsIHVuaXF1ZSBwZXIgZGV2aWNlXHJcbiAgb3BzOiBPcFtdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN5bmNUcmFuc3BvcnQge1xyXG4gIC8qKiBIdW1hbi1yZWFkYWJsZSBsb2NhdGlvbiBmb3IgdGhlIFVJIChcIndoZXJlIGlzIG15IGRhdGFcIikuICovXHJcbiAgbG9jYXRpb24oKTogc3RyaW5nO1xyXG4gIC8qKiBUcnVlIHdoZW4gdGhlIGJhY2tpbmcgbWVkaXVtIGlzIHJlYWNoYWJsZSByaWdodCBub3cuICovXHJcbiAgYXZhaWxhYmxlKCk6IGJvb2xlYW47XHJcbiAgLyoqIFB1Ymxpc2ggYSBiYXRjaCBvZiB0aGlzIGRldmljZSdzIG9wcy4gTXVzdCBiZSBhdG9taWMgKGFsbC1vci1ub3RoaW5nIHZpc2libGUpLiAqL1xyXG4gIHB1Ymxpc2hPcHMoZGV2aWNlSWQ6IHN0cmluZywgYmF0Y2hOYW1lOiBzdHJpbmcsIG9wczogT3BbXSk6IFByb21pc2U8dm9pZD47XHJcbiAgLyoqIExpc3QgcGVlciBiYXRjaCBmaWxlIG5hbWVzIChzb3J0ZWQgYXNjZW5kaW5nKSBuZXdlciB0aGFuIGBhZnRlckZpbGVgIGZvciBlYWNoIHBlZXIuICovXHJcbiAgbGlzdFBlZXJCYXRjaGVzKG93bkRldmljZUlkOiBzdHJpbmcsIGFmdGVyRmlsZUJ5RGV2aWNlOiBNYXA8c3RyaW5nLCBzdHJpbmcgfCBudWxsPik6IFByb21pc2U8eyBkZXZpY2VJZDogc3RyaW5nOyBmaWxlTmFtZTogc3RyaW5nIH1bXT47XHJcbiAgLyoqIEZldGNoIG9uZSBiYXRjaC4gKi9cclxuICBmZXRjaEJhdGNoKGRldmljZUlkOiBzdHJpbmcsIGZpbGVOYW1lOiBzdHJpbmcpOiBQcm9taXNlPE9wW10+O1xyXG4gIC8qKiBBbm5vdW5jZSBwcmVzZW5jZSAob3duIGZpbGUgb25seSBcdTIwMTQgbm8gd3JpdGUgY29udGVudGlvbikuICovXHJcbiAgYW5ub3VuY2UoZGV2aWNlSWQ6IHN0cmluZywgdXNlck5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XHJcbiAgLyoqIEFsbCBhbm5vdW5jZWQgZGV2aWNlcy4gKi9cclxuICBsaXN0UGVlcnMoKTogUHJvbWlzZTxQZWVySW5mb1tdPjtcclxuICAvKiogU3RvcmUgYW4gYXR0YWNobWVudCBibG9iIGNvbnRlbnQtYWRkcmVzc2VkIGJ5IHNoYTI1Ni4gUmV0dXJucyB0cnVlIGlmIG5ld2x5IHN0b3JlZC4gKi9cclxuICBwdXRCbG9iKHNoYTI1Njogc3RyaW5nLCBkYXRhOiBCdWZmZXIpOiBQcm9taXNlPGJvb2xlYW4+O1xyXG4gIC8qKiBGZXRjaCBhbiBhdHRhY2htZW50IGJsb2IsIG51bGwgaWYgbm90ICh5ZXQpIHByZXNlbnQuICovXHJcbiAgZ2V0QmxvYihzaGEyNTY6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyIHwgbnVsbD47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGb2xkZXJUcmFuc3BvcnQgXHUyMDE0IHNoYXJlZC1mb2xkZXIgbGF5b3V0OlxyXG4gKiAgIDxyb290Pi9vcHMvPGRldmljZUlkPi8wMDAwMDAwMDAwMS5qc29ubCAgIG9wIGJhdGNoZXMsIG9uZSBKU09OIG9wIHBlciBsaW5lXHJcbiAqICAgPHJvb3Q+L29wcy88ZGV2aWNlSWQ+L2RldmljZS5qc29uICAgICAgICAgIHByZXNlbmNlICsgaWRlbnRpdHlcclxuICogICA8cm9vdD4vYmxvYnMvPGFhPi88c2hhMjU2PiAgICAgICAgICAgICAgICAgY29udGVudC1hZGRyZXNzZWQgYXR0YWNobWVudHNcclxuICpcclxuICogQ29ycmVjdG5lc3MgcnVsZXM6XHJcbiAqIC0gQSBkZXZpY2Ugd3JpdGVzIE9OTFkgdW5kZXIgaXRzIG93biBvcHMvPGRldmljZUlkPi8gZGlyZWN0b3J5IFx1MjE5MiBubyB3cml0ZSBjb250ZW50aW9uLFxyXG4gKiAgIG5vIHNoYXJlZC1maWxlIGxvY2tpbmcsIG5vIFNRTGl0ZS1vdmVyLU9uZURyaXZlIGNvcnJ1cHRpb24gY2xhc3MuXHJcbiAqIC0gRmlsZXMgYXJlIHdyaXR0ZW4gdG8gYSB0ZW1wIG5hbWUgdGhlbiByZW5hbWVkIFx1MjE5MiByZWFkZXJzIG5ldmVyIHNlZSBwYXJ0aWFsIGJhdGNoZXMuXHJcbiAqIC0gQmF0Y2hlcyBhcmUgaW1tdXRhYmxlIG9uY2UgcHVibGlzaGVkLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEZvbGRlclRyYW5zcG9ydCBpbXBsZW1lbnRzIFN5bmNUcmFuc3BvcnQge1xyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcm9vdDogc3RyaW5nKSB7fVxyXG5cclxuICBsb2NhdGlvbigpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMucm9vdDtcclxuICB9XHJcblxyXG4gIGF2YWlsYWJsZSgpOiBib29sZWFuIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4odGhpcy5yb290LCAnb3BzJyksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG9wc0RpcihkZXZpY2VJZDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBwYXRoLmpvaW4odGhpcy5yb290LCAnb3BzJywgZGV2aWNlSWQpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgcHVibGlzaE9wcyhkZXZpY2VJZDogc3RyaW5nLCBiYXRjaE5hbWU6IHN0cmluZywgb3BzOiBPcFtdKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCBkaXIgPSB0aGlzLm9wc0RpcihkZXZpY2VJZCk7XHJcbiAgICBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICAgIGNvbnN0IGZpbmFsUGF0aCA9IHBhdGguam9pbihkaXIsIGJhdGNoTmFtZSk7XHJcbiAgICBjb25zdCB0bXBQYXRoID0gZmluYWxQYXRoICsgJy50bXAnO1xyXG4gICAgY29uc3QgbGluZXMgPSBvcHMubWFwKChvKSA9PiBKU09OLnN0cmluZ2lmeShvKSkuam9pbignXFxuJykgKyAnXFxuJztcclxuICAgIGZzLndyaXRlRmlsZVN5bmModG1wUGF0aCwgbGluZXMsICd1dGY4Jyk7XHJcbiAgICBmcy5yZW5hbWVTeW5jKHRtcFBhdGgsIGZpbmFsUGF0aCk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBsaXN0UGVlckJhdGNoZXMoXHJcbiAgICBvd25EZXZpY2VJZDogc3RyaW5nLFxyXG4gICAgYWZ0ZXJGaWxlQnlEZXZpY2U6IE1hcDxzdHJpbmcsIHN0cmluZyB8IG51bGw+LFxyXG4gICk6IFByb21pc2U8eyBkZXZpY2VJZDogc3RyaW5nOyBmaWxlTmFtZTogc3RyaW5nIH1bXT4ge1xyXG4gICAgY29uc3Qgb3BzUm9vdCA9IHBhdGguam9pbih0aGlzLnJvb3QsICdvcHMnKTtcclxuICAgIGlmICghZnMuZXhpc3RzU3luYyhvcHNSb290KSkgcmV0dXJuIFtdO1xyXG4gICAgY29uc3Qgb3V0OiB7IGRldmljZUlkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfVtdID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGRldiBvZiBmcy5yZWFkZGlyU3luYyhvcHNSb290LCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSkpIHtcclxuICAgICAgaWYgKCFkZXYuaXNEaXJlY3RvcnkoKSB8fCBkZXYubmFtZSA9PT0gb3duRGV2aWNlSWQpIGNvbnRpbnVlO1xyXG4gICAgICBjb25zdCBhZnRlciA9IGFmdGVyRmlsZUJ5RGV2aWNlLmdldChkZXYubmFtZSkgPz8gbnVsbDtcclxuICAgICAgY29uc3QgZmlsZXMgPSBmc1xyXG4gICAgICAgIC5yZWFkZGlyU3luYyhwYXRoLmpvaW4ob3BzUm9vdCwgZGV2Lm5hbWUpKVxyXG4gICAgICAgIC5maWx0ZXIoKGYpID0+IGYuZW5kc1dpdGgoJy5qc29ubCcpKVxyXG4gICAgICAgIC5zb3J0KCk7XHJcbiAgICAgIGZvciAoY29uc3QgZiBvZiBmaWxlcykge1xyXG4gICAgICAgIGlmIChhZnRlciAmJiBmIDw9IGFmdGVyKSBjb250aW51ZTtcclxuICAgICAgICBvdXQucHVzaCh7IGRldmljZUlkOiBkZXYubmFtZSwgZmlsZU5hbWU6IGYgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvdXQ7XHJcbiAgfVxyXG5cclxuICBhc3luYyBmZXRjaEJhdGNoKGRldmljZUlkOiBzdHJpbmcsIGZpbGVOYW1lOiBzdHJpbmcpOiBQcm9taXNlPE9wW10+IHtcclxuICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4odGhpcy5vcHNEaXIoZGV2aWNlSWQpLCBmaWxlTmFtZSk7XHJcbiAgICBjb25zdCB0ZXh0ID0gZnMucmVhZEZpbGVTeW5jKHAsICd1dGY4Jyk7XHJcbiAgICBjb25zdCBvcHM6IE9wW10gPSBbXTtcclxuICAgIGZvciAoY29uc3QgbGluZSBvZiB0ZXh0LnNwbGl0KCdcXG4nKSkge1xyXG4gICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XHJcbiAgICAgIGlmICghdHJpbW1lZCkgY29udGludWU7XHJcbiAgICAgIG9wcy5wdXNoKEpTT04ucGFyc2UodHJpbW1lZCkgYXMgT3ApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9wcztcclxuICB9XHJcblxyXG4gIGFzeW5jIGFubm91bmNlKGRldmljZUlkOiBzdHJpbmcsIHVzZXJOYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IGRpciA9IHRoaXMub3BzRGlyKGRldmljZUlkKTtcclxuICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgY29uc3QgcCA9IHBhdGguam9pbihkaXIsICdkZXZpY2UuanNvbicpO1xyXG4gICAgY29uc3QgdG1wID0gcCArICcudG1wJztcclxuICAgIGZzLndyaXRlRmlsZVN5bmModG1wLCBKU09OLnN0cmluZ2lmeSh7IGRldmljZUlkLCB1c2VyTmFtZSwgbGFzdFNlZW5BdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pLCAndXRmOCcpO1xyXG4gICAgZnMucmVuYW1lU3luYyh0bXAsIHApO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgbGlzdFBlZXJzKCk6IFByb21pc2U8UGVlckluZm9bXT4ge1xyXG4gICAgY29uc3Qgb3BzUm9vdCA9IHBhdGguam9pbih0aGlzLnJvb3QsICdvcHMnKTtcclxuICAgIGlmICghZnMuZXhpc3RzU3luYyhvcHNSb290KSkgcmV0dXJuIFtdO1xyXG4gICAgY29uc3QgcGVlcnM6IFBlZXJJbmZvW10gPSBbXTtcclxuICAgIGZvciAoY29uc3QgZGV2IG9mIGZzLnJlYWRkaXJTeW5jKG9wc1Jvb3QsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KSkge1xyXG4gICAgICBpZiAoIWRldi5pc0RpcmVjdG9yeSgpKSBjb250aW51ZTtcclxuICAgICAgY29uc3QgcCA9IHBhdGguam9pbihvcHNSb290LCBkZXYubmFtZSwgJ2RldmljZS5qc29uJyk7XHJcbiAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwKSkge1xyXG4gICAgICAgIHBlZXJzLnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIHVzZXJOYW1lOiBudWxsLCBsYXN0U2VlbkF0OiBudWxsIH0pO1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgaW5mbyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHAsICd1dGY4JykpIGFzIFBlZXJJbmZvO1xyXG4gICAgICAgIHBlZXJzLnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIHVzZXJOYW1lOiBpbmZvLnVzZXJOYW1lID8/IG51bGwsIGxhc3RTZWVuQXQ6IGluZm8ubGFzdFNlZW5BdCA/PyBudWxsIH0pO1xyXG4gICAgICB9IGNhdGNoIHtcclxuICAgICAgICBwZWVycy5wdXNoKHsgZGV2aWNlSWQ6IGRldi5uYW1lLCB1c2VyTmFtZTogbnVsbCwgbGFzdFNlZW5BdDogbnVsbCB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBlZXJzO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgcHV0QmxvYihzaGEyNTY6IHN0cmluZywgZGF0YTogQnVmZmVyKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICBjb25zdCBkaXIgPSBwYXRoLmpvaW4odGhpcy5yb290LCAnYmxvYnMnLCBzaGEyNTYuc2xpY2UoMCwgMikpO1xyXG4gICAgY29uc3QgcCA9IHBhdGguam9pbihkaXIsIHNoYTI1Nik7XHJcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhwKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICBjb25zdCB0bXAgPSBwICsgJy50bXAtJyArIHByb2Nlc3MucGlkO1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyh0bXAsIGRhdGEpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgZnMucmVuYW1lU3luYyh0bXAsIHApO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIGZzLnJtU3luYyh0bXAsIHsgZm9yY2U6IHRydWUgfSk7IC8vIHBlZXIgd29uIHRoZSByYWNlOyBjb250ZW50LWFkZHJlc3NlZCBzbyBpZGVudGljYWxcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0QmxvYihzaGEyNTY6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyIHwgbnVsbD4ge1xyXG4gICAgY29uc3QgcCA9IHBhdGguam9pbih0aGlzLnJvb3QsICdibG9icycsIHNoYTI1Ni5zbGljZSgwLCAyKSwgc2hhMjU2KTtcclxuICAgIGlmICghZnMuZXhpc3RzU3luYyhwKSkgcmV0dXJuIG51bGw7XHJcbiAgICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKHApO1xyXG4gIH1cclxufVxyXG4iLCAiLy8gU3luY0VuZ2luZTogcGVyaW9kaWMgKyBldmVudC1kcml2ZW4gZXhwb3J0L2ltcG9ydCBsb29wIG92ZXIgYSBTeW5jVHJhbnNwb3J0LlxyXG4vLyBMb2NhbC1maXJzdDogdGhlIGFwcCBpcyBmdWxseSB1c2FibGUgd2l0aCBzeW5jIGRpc2FibGVkIG9yIHRoZSBmb2xkZXIgb2ZmbGluZTtcclxuLy8gb3BzIHF1ZXVlIGluIHRoZSBvcGxvZyBhbmQgZmx1c2ggd2hlbiB0aGUgdHJhbnNwb3J0IHJldHVybnMuXHJcblxyXG5pbXBvcnQgdHlwZSB7IFN0b3JlIH0gZnJvbSAnLi4vZGIvc3RvcmUnO1xyXG5pbXBvcnQgeyBnZXRNZXRhLCBzZXRNZXRhIH0gZnJvbSAnLi4vZGIvZGInO1xyXG5pbXBvcnQgdHlwZSB7IFN5bmNUcmFuc3BvcnQgfSBmcm9tICcuL3RyYW5zcG9ydCc7XHJcbmltcG9ydCB0eXBlIHsgU3luY1N0YXR1cywgU3luY1N0YXR1c1N0YXRlIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcclxuXHJcbmNvbnN0IEVYUE9SVF9ERUJPVU5DRV9NUyA9IDFfNTAwO1xyXG5jb25zdCBQT0xMX0lOVEVSVkFMX01TID0gNV8wMDA7XHJcblxyXG5leHBvcnQgY2xhc3MgU3luY0VuZ2luZSB7XHJcbiAgcHJpdmF0ZSB0cmFuc3BvcnQ6IFN5bmNUcmFuc3BvcnQgfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIHRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgZXhwb3J0VGltZXI6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSBydW5uaW5nID0gZmFsc2U7XHJcbiAgcHJpdmF0ZSBjdXJyZW50OiBQcm9taXNlPHZvaWQ+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgcHJpdmF0ZSBzdGF0ZTogU3luY1N0YXR1c1N0YXRlID0gJ2Rpc2FibGVkJztcclxuICBwcml2YXRlIGxhc3RFcnJvcjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSBsYXN0U3luY0F0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIHVzZXJOYW1lOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSBvblN0YXR1czogKHM6IFN5bmNTdGF0dXMpID0+IHZvaWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBzdG9yZTogU3RvcmUsXHJcbiAgICB1c2VyTmFtZTogc3RyaW5nLFxyXG4gICAgb25TdGF0dXM6IChzOiBTeW5jU3RhdHVzKSA9PiB2b2lkLFxyXG4gICkge1xyXG4gICAgdGhpcy51c2VyTmFtZSA9IHVzZXJOYW1lO1xyXG4gICAgdGhpcy5vblN0YXR1cyA9IG9uU3RhdHVzO1xyXG4gIH1cclxuXHJcbiAgc2V0VHJhbnNwb3J0KHRyYW5zcG9ydDogU3luY1RyYW5zcG9ydCB8IG51bGwpOiB2b2lkIHtcclxuICAgIHRoaXMudHJhbnNwb3J0ID0gdHJhbnNwb3J0O1xyXG4gICAgaWYgKHRoaXMudGltZXIpIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcik7XHJcbiAgICB0aGlzLnRpbWVyID0gbnVsbDtcclxuICAgIGlmICh0cmFuc3BvcnQpIHtcclxuICAgICAgLy8gU3luYyBjdXJzb3JzIGJlbG9uZyB0byBhIHNwZWNpZmljIGZvbGRlci4gUG9pbnRpbmcgYXQgYSBkaWZmZXJlbnQgZm9sZGVyXHJcbiAgICAgIC8vIG11c3QgcmUtcHVibGlzaCBldmVyeXRoaW5nIChvcC1pZCBkZWR1cCBtYWtlcyB0aGF0IHNhZmUpIGFuZCByZS1pbXBvcnRcclxuICAgICAgLy8gcGVlcnMgZnJvbSBzY3JhdGNoIFx1MjAxNCBvdGhlcndpc2UgdGhlIG5ldyBmb2xkZXIgZ2V0cyBhIHBlcm1hbmVudGx5XHJcbiAgICAgIC8vIGluY29tcGxldGUgZGF0YXNldC5cclxuICAgICAgY29uc3QgZm9sZGVyS2V5ID0gdHJhbnNwb3J0LmxvY2F0aW9uKCk7XHJcbiAgICAgIGNvbnN0IGtub3duRm9sZGVyID0gZ2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnc3luY19mb2xkZXJfa2V5Jyk7XHJcbiAgICAgIGlmIChrbm93bkZvbGRlciAhPT0gZm9sZGVyS2V5KSB7XHJcbiAgICAgICAgc2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnbGFzdF9leHBvcnRlZF9zZXEnLCAnMCcpO1xyXG4gICAgICAgIHRoaXMuc3RvcmUuZGIucHJlcGFyZSgnREVMRVRFIEZST00gc3luY19wZWVycycpLnJ1bigpO1xyXG4gICAgICAgIHNldE1ldGEodGhpcy5zdG9yZS5kYiwgJ3N5bmNfZm9sZGVyX2tleScsIGZvbGRlcktleSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5zdGF0ZSA9ICdpZGxlJztcclxuICAgICAgdGhpcy50aW1lciA9IHNldEludGVydmFsKCgpID0+IHZvaWQgdGhpcy5jeWNsZSgpLCBQT0xMX0lOVEVSVkFMX01TKTtcclxuICAgICAgdm9pZCB0aGlzLmN5Y2xlKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnN0YXRlID0gJ2Rpc2FibGVkJztcclxuICAgICAgdGhpcy5lbWl0U3RhdHVzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKiogVXBkYXRlIHRoZSBhbm5vdW5jZWQgZGlzcGxheSBuYW1lIChpZGVudGl0eSBjYW4gYmUgc2V0IGFmdGVyIGJvb3QpLiAqL1xyXG4gIHNldFVzZXJOYW1lKG5hbWU6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgdGhpcy51c2VyTmFtZSA9IG5hbWU7XHJcbiAgfVxyXG5cclxuICAvKiogQ2FsbCBhZnRlciBhbnkgbG9jYWwgbXV0YXRpb24gXHUyMDE0IGRlYm91bmNlZCBleHBvcnQgc28gcmFwaWQgZWRpdHMgYmF0Y2guICovXHJcbiAgbm90ZUxvY2FsQ2hhbmdlKCk6IHZvaWQge1xyXG4gICAgaWYgKCF0aGlzLnRyYW5zcG9ydCkgcmV0dXJuO1xyXG4gICAgaWYgKHRoaXMuZXhwb3J0VGltZXIpIGNsZWFyVGltZW91dCh0aGlzLmV4cG9ydFRpbWVyKTtcclxuICAgIHRoaXMuZXhwb3J0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHZvaWQgdGhpcy5jeWNsZSgpLCBFWFBPUlRfREVCT1VOQ0VfTVMpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgY3ljbGUoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBpZiAoIXRoaXMudHJhbnNwb3J0IHx8IHRoaXMucnVubmluZykgcmV0dXJuIHRoaXMuY3VycmVudDtcclxuICAgIHRoaXMucnVubmluZyA9IHRydWU7XHJcbiAgICBsZXQgcmVsZWFzZSE6ICgpID0+IHZvaWQ7XHJcbiAgICB0aGlzLmN1cnJlbnQgPSBuZXcgUHJvbWlzZSgocikgPT4gKHJlbGVhc2UgPSByKSk7XHJcbiAgICB0cnkge1xyXG4gICAgICBpZiAoIXRoaXMudHJhbnNwb3J0LmF2YWlsYWJsZSgpKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSgnb2ZmbGluZScsICdTeW5jIGZvbGRlciBpcyBub3QgcmVhY2hhYmxlJyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoJ3N5bmNpbmcnLCBudWxsKTtcclxuICAgICAgYXdhaXQgdGhpcy5leHBvcnRPcHMoKTtcclxuICAgICAgYXdhaXQgdGhpcy5pbXBvcnRPcHMoKTtcclxuICAgICAgYXdhaXQgdGhpcy50cmFuc3BvcnQuYW5ub3VuY2UodGhpcy5zdG9yZS5kZXZpY2VJZCwgdGhpcy51c2VyTmFtZSk7XHJcbiAgICAgIHRoaXMubGFzdFN5bmNBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSgnaWRsZScsIG51bGwpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoJ2Vycm9yJywgZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xyXG4gICAgICByZWxlYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGV4cG9ydE9wcygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICghdGhpcy50cmFuc3BvcnQpIHJldHVybjtcclxuICAgIGNvbnN0IGxhc3RFeHBvcnRlZCA9IE51bWJlcihnZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdsYXN0X2V4cG9ydGVkX3NlcScpID8/ICcwJyk7XHJcbiAgICBjb25zdCBwZW5kaW5nID0gdGhpcy5zdG9yZS5vcHNTaW5jZShsYXN0RXhwb3J0ZWQsIHRydWUpO1xyXG4gICAgaWYgKHBlbmRpbmcubGVuZ3RoID09PSAwKSByZXR1cm47XHJcbiAgICBjb25zdCBtYXhTZXEgPSBwZW5kaW5nW3BlbmRpbmcubGVuZ3RoIC0gMV0uc2VxO1xyXG4gICAgY29uc3QgYmF0Y2hOYW1lID0gU3RyaW5nKG1heFNlcSkucGFkU3RhcnQoMTIsICcwJykgKyAnLmpzb25sJztcclxuICAgIGF3YWl0IHRoaXMudHJhbnNwb3J0LnB1Ymxpc2hPcHMoXHJcbiAgICAgIHRoaXMuc3RvcmUuZGV2aWNlSWQsXHJcbiAgICAgIGJhdGNoTmFtZSxcclxuICAgICAgcGVuZGluZy5tYXAoKHApID0+IHAub3ApLFxyXG4gICAgKTtcclxuICAgIHNldE1ldGEodGhpcy5zdG9yZS5kYiwgJ2xhc3RfZXhwb3J0ZWRfc2VxJywgU3RyaW5nKG1heFNlcSkpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBpbXBvcnRPcHMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBpZiAoIXRoaXMudHJhbnNwb3J0KSByZXR1cm47XHJcbiAgICBjb25zdCBwZWVycyA9IHRoaXMuc3RvcmUuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBkZXZpY2VfaWQsIGxhc3RfZmlsZSBGUk9NIHN5bmNfcGVlcnMnKVxyXG4gICAgICAuYWxsKCkgYXMgeyBkZXZpY2VfaWQ6IHN0cmluZzsgbGFzdF9maWxlOiBzdHJpbmcgfCBudWxsIH1bXTtcclxuICAgIGNvbnN0IGFmdGVyQnlEZXZpY2UgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nIHwgbnVsbD4ocGVlcnMubWFwKChwKSA9PiBbcC5kZXZpY2VfaWQsIHAubGFzdF9maWxlXSkpO1xyXG5cclxuICAgIGNvbnN0IGJhdGNoZXMgPSBhd2FpdCB0aGlzLnRyYW5zcG9ydC5saXN0UGVlckJhdGNoZXModGhpcy5zdG9yZS5kZXZpY2VJZCwgYWZ0ZXJCeURldmljZSk7XHJcbiAgICAvLyBCYXRjaGVzIG11c3QgYXBwbHkgc3RyaWN0bHkgaW4gZmlsZW5hbWUgb3JkZXIgcGVyIGRldmljZS4gSWYgb25lIGZpbGUgaXNcclxuICAgIC8vIHVucmVhZGFibGUgKGUuZy4gc3RpbGwgc3luY2luZyBkb3duKSwgU1RPUCB0aGF0IGRldmljZSBmb3IgdGhpcyBjeWNsZSBcdTIwMTRcclxuICAgIC8vIGFkdmFuY2luZyBwYXN0IGl0IHdvdWxkIHBlcm1hbmVudGx5IHNraXAgaXRzIG9wcy5cclxuICAgIGNvbnN0IHN0YWxsZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuICAgIGZvciAoY29uc3QgYiBvZiBiYXRjaGVzKSB7XHJcbiAgICAgIGlmIChzdGFsbGVkLmhhcyhiLmRldmljZUlkKSkgY29udGludWU7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3Qgb3BzID0gYXdhaXQgdGhpcy50cmFuc3BvcnQuZmV0Y2hCYXRjaChiLmRldmljZUlkLCBiLmZpbGVOYW1lKTtcclxuICAgICAgICB0aGlzLnN0b3JlLmFwcGx5UmVtb3RlT3BzKG9wcyk7XHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIHN0YWxsZWQuYWRkKGIuZGV2aWNlSWQpOyAvLyByZXRyeSBmcm9tIHRoaXMgZmlsZSBuZXh0IGN5Y2xlOyBjdXJzb3IgdW50b3VjaGVkXHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5zdG9yZS5kYlxyXG4gICAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgICAgYElOU0VSVCBJTlRPIHN5bmNfcGVlcnMoZGV2aWNlX2lkLCBsYXN0X2ZpbGUsIGxhc3Rfc2Vlbl9hdCkgVkFMVUVTKD8sPyw/KVxyXG4gICAgICAgICAgIE9OIENPTkZMSUNUKGRldmljZV9pZCkgRE8gVVBEQVRFIFNFVCBsYXN0X2ZpbGU9ZXhjbHVkZWQubGFzdF9maWxlLCBsYXN0X3NlZW5fYXQ9ZXhjbHVkZWQubGFzdF9zZWVuX2F0YCxcclxuICAgICAgICApXHJcbiAgICAgICAgLnJ1bihiLmRldmljZUlkLCBiLmZpbGVOYW1lLCBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlZnJlc2ggcGVlciBkaXNwbGF5IG5hbWVzIGZyb20gYW5ub3VuY2VtZW50cy5cclxuICAgIGZvciAoY29uc3QgcCBvZiBhd2FpdCB0aGlzLnRyYW5zcG9ydC5saXN0UGVlcnMoKSkge1xyXG4gICAgICBpZiAocC5kZXZpY2VJZCA9PT0gdGhpcy5zdG9yZS5kZXZpY2VJZCkgY29udGludWU7XHJcbiAgICAgIHRoaXMuc3RvcmUuZGJcclxuICAgICAgICAucHJlcGFyZShcclxuICAgICAgICAgIGBJTlNFUlQgSU5UTyBzeW5jX3BlZXJzKGRldmljZV9pZCwgdXNlcl9uYW1lLCBsYXN0X3NlZW5fYXQpIFZBTFVFUyg/LD8sPylcclxuICAgICAgICAgICBPTiBDT05GTElDVChkZXZpY2VfaWQpIERPIFVQREFURSBTRVQgdXNlcl9uYW1lPUNPQUxFU0NFKGV4Y2x1ZGVkLnVzZXJfbmFtZSwgc3luY19wZWVycy51c2VyX25hbWUpLFxyXG4gICAgICAgICAgICAgbGFzdF9zZWVuX2F0PUNPQUxFU0NFKGV4Y2x1ZGVkLmxhc3Rfc2Vlbl9hdCwgc3luY19wZWVycy5sYXN0X3NlZW5fYXQpYCxcclxuICAgICAgICApXHJcbiAgICAgICAgLnJ1bihwLmRldmljZUlkLCBwLnVzZXJOYW1lLCBwLmxhc3RTZWVuQXQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZXRTdGF0ZShzdGF0ZTogU3luY1N0YXR1c1N0YXRlLCBlcnJvcjogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xyXG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xyXG4gICAgdGhpcy5sYXN0RXJyb3IgPSBlcnJvcjtcclxuICAgIHRoaXMuZW1pdFN0YXR1cygpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBlbWl0U3RhdHVzKCk6IHZvaWQge1xyXG4gICAgdGhpcy5vblN0YXR1cyh0aGlzLnN0YXR1cygpKTtcclxuICB9XHJcblxyXG4gIHN0YXR1cygpOiBTeW5jU3RhdHVzIHtcclxuICAgIGNvbnN0IGxhc3RFeHBvcnRlZCA9IE51bWJlcihnZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdsYXN0X2V4cG9ydGVkX3NlcScpID8/ICcwJyk7XHJcbiAgICBjb25zdCBwZW5kaW5nUm93ID0gdGhpcy5zdG9yZS5kYlxyXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIENPVU5UKCopIEFTIGMgRlJPTSBvcGxvZyBXSEVSRSBzZXEgPiA/IEFORCBkZXZpY2VfaWQgPSA/JylcclxuICAgICAgLmdldChsYXN0RXhwb3J0ZWQsIHRoaXMuc3RvcmUuZGV2aWNlSWQpIGFzIHsgYzogbnVtYmVyIH07XHJcbiAgICBjb25zdCBjb25mbGljdFJvdyA9IHRoaXMuc3RvcmUuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBDT1VOVCgqKSBBUyBjIEZST00gc3luY19jb25mbGljdHMgV0hFUkUgcmVzb2x2ZWRfYXQgSVMgTlVMTCcpXHJcbiAgICAgIC5nZXQoKSBhcyB7IGM6IG51bWJlciB9O1xyXG4gICAgY29uc3QgcGVlcnMgPSB0aGlzLnN0b3JlLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgZGV2aWNlX2lkIEFTIGRldmljZUlkLCB1c2VyX25hbWUgQVMgdXNlck5hbWUsIGxhc3Rfc2Vlbl9hdCBBUyBsYXN0U2VlbkF0IEZST00gc3luY19wZWVycycpXHJcbiAgICAgIC5hbGwoKSBhcyBTeW5jU3RhdHVzWydwZWVycyddO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3RhdGU6IHRoaXMuc3RhdGUsXHJcbiAgICAgIGZvbGRlcjogdGhpcy50cmFuc3BvcnQgPyB0aGlzLnRyYW5zcG9ydC5sb2NhdGlvbigpIDogbnVsbCxcclxuICAgICAgbGFzdFN5bmNBdDogdGhpcy5sYXN0U3luY0F0LFxyXG4gICAgICBsYXN0RXJyb3I6IHRoaXMubGFzdEVycm9yLFxyXG4gICAgICBwZW5kaW5nT3BzOiBwZW5kaW5nUm93LmMsXHJcbiAgICAgIG9wZW5Db25mbGljdHM6IGNvbmZsaWN0Um93LmMsXHJcbiAgICAgIHBlZXJzLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKiBTdG9wcyB0aW1lcnMgYW5kIHdhaXRzIGZvciBhbnkgaW4tZmxpZ2h0IGN5Y2xlIFx1MjAxNCBzYWZlIHRvIGNsb3NlIHRoZSBEQiBhZnRlcndhcmRzLiAqL1xyXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBpZiAodGhpcy50aW1lcikgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVyKTtcclxuICAgIGlmICh0aGlzLmV4cG9ydFRpbWVyKSBjbGVhclRpbWVvdXQodGhpcy5leHBvcnRUaW1lcik7XHJcbiAgICB0aGlzLnRpbWVyID0gbnVsbDtcclxuICAgIHRoaXMuZXhwb3J0VGltZXIgPSBudWxsO1xyXG4gICAgYXdhaXQgdGhpcy5jdXJyZW50O1xyXG4gIH1cclxufVxyXG4iLCAiLy8gU2FtcGxlIFN1cHBvcnQgQUkgcHJvamVjdCBkYXRhLiBFdmVyeSByZWNvcmQgY2FycmllcyBzYW1wbGU9MSBhbmQgYSBbU0FNUExFXSB0aXRsZVxyXG4vLyBtYXJrZXIgY29udmVudGlvbiBpcyBOT1QgdXNlZCBcdTIwMTQgdGhlIHNhbXBsZSBmbGFnIGRyaXZlcyBiYWRnZXMgKyBvbmUtY2xpY2sgcmVtb3ZhbC5cclxuLy8gTm8gcmVhbCBjb25maWRlbnRpYWwgZGF0YTogbmFtZXMgb2Ygc3lzdGVtcyBhcmUgZ2VuZXJpYywgY29udGVudHMgYXJlIGlsbHVzdHJhdGl2ZS5cclxuXHJcbmltcG9ydCB0eXBlIHsgU3RvcmUgfSBmcm9tICcuL3N0b3JlJztcclxuaW1wb3J0IHR5cGUgeyBJdGVtVHlwZSwgUHJpb3JpdHkgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xyXG5cclxuaW50ZXJmYWNlIFNlZWRJdGVtIHtcclxuICB0eXBlOiBJdGVtVHlwZTtcclxuICB0aXRsZTogc3RyaW5nO1xyXG4gIGJvZHlUZXh0Pzogc3RyaW5nO1xyXG4gIHN0YXR1cz86IHN0cmluZztcclxuICBwcmlvcml0eT86IFByaW9yaXR5O1xyXG4gIG93bmVyPzogJ2pvaG4nIHwgJ21hcmsnIHwgbnVsbDtcclxuICBkdWVEYXRlPzogc3RyaW5nO1xyXG4gIHRhZ3M/OiBzdHJpbmdbXTtcclxuICBleHRyYT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gIG1pbGVzdG9uZT86IHN0cmluZztcclxuICBsZWFkZXJzaGlwVmlzaWJsZT86IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2FkU2VlZERhdGEoc3RvcmU6IFN0b3JlKTogbnVtYmVyIHtcclxuICAvLyBQcm9iZSBkaXJlY3RseSAobGlzdEl0ZW1zIGhpZGVzIGFyY2hpdmVkIHJvd3MgXHUyMDE0IGFyY2hpdmVkIHNhbXBsZXMgbXVzdCBzdGlsbCBibG9jayBhIHJlbG9hZCkuXHJcbiAgY29uc3QgZXhpc3RpbmcgPSBzdG9yZS5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIGl0ZW1zIFdIRVJFIHNhbXBsZT0xIEFORCBkZWxldGVkPTAgTElNSVQgMScpLmdldCgpO1xyXG4gIGlmIChleGlzdGluZykgcmV0dXJuIDA7IC8vIGFscmVhZHkgbG9hZGVkXHJcblxyXG4gIGNvbnN0IG0xID0gc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgbmFtZTogJ0Rpc2NvdmVyeSAmIEFjY2VzcycsIHRhcmdldERhdGU6ICcyMDI2LTA4LTE1Jywgc3RhdHVzOiAnYWN0aXZlJywgc29ydDogMSwgc2FtcGxlOiAxLCBkZXNjcmlwdGlvbjogJ1NlY3VyZSBzeXN0ZW0gYWNjZXNzLCBpbnZlbnRvcnkga25vd2xlZGdlIHNvdXJjZXMsIGNvbmZpcm0gc2NvcGUgd2l0aCBsZWFkZXJzaGlwLicgfSk7XHJcbiAgY29uc3QgbTIgPSBzdG9yZS51cHNlcnRNaWxlc3RvbmUoeyBuYW1lOiAnS25vd2xlZGdlIFBpcGVsaW5lIE1WUCcsIHRhcmdldERhdGU6ICcyMDI2LTEwLTAxJywgc3RhdHVzOiAncGxhbm5lZCcsIHNvcnQ6IDIsIHNhbXBsZTogMSwgZGVzY3JpcHRpb246ICdJbmdlc3QsIGNsZWFuLCBhbmQgaW5kZXggdGhlIGZpcnN0IGtub3dsZWRnZSBkb21haW4gZW5kIHRvIGVuZC4nIH0pO1xyXG4gIGNvbnN0IG0zID0gc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgbmFtZTogJ1BpbG90IHdpdGggU3VwcG9ydCBUZWFtJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTItMDEnLCBzdGF0dXM6ICdwbGFubmVkJywgc29ydDogMywgc2FtcGxlOiAxLCBkZXNjcmlwdGlvbjogJ0xpbWl0ZWQgcGlsb3Q6IG1lYXN1cmUgZGVmbGVjdGlvbiwgYWNjdXJhY3ksIGFuZCBhZ2VudCBzYXRpc2ZhY3Rpb24uJyB9KTtcclxuICBzdG9yZS51cHNlcnRSZWxlYXNlKHsgbmFtZTogJ1N1cHBvcnQgQUkgUGlsb3QgMC4xJywgdmVyc2lvbjogJzAuMScsIHRhcmdldERhdGU6ICcyMDI2LTExLTE1Jywgc3RhdHVzOiAncGxhbm5lZCcsIGdvYWxzOiAnRmlyc3QgaW50ZXJuYWwgcGlsb3QgYnVpbGQ6IHNpbmdsZSBrbm93bGVkZ2UgZG9tYWluLCAxMCBzdXBwb3J0IGFnZW50cywgZmVlZGJhY2sgbG9vcCBpbiBwbGFjZS4nLCBzYW1wbGU6IDEgfSk7XHJcblxyXG4gIGNvbnN0IG1pbGVzdG9uZUlkOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0geyBtMTogbTEuaWQsIG0yOiBtMi5pZCwgbTM6IG0zLmlkIH07XHJcblxyXG4gIGNvbnN0IGl0ZW1zOiAoU2VlZEl0ZW0gJiB7IGtleTogc3RyaW5nIH0pW10gPSBbXHJcbiAgICAvLyBGZWF0dXJlc1xyXG4gICAgeyBrZXk6ICdmZWF0QW5zd2VyJywgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0FJIGFuc3dlciBnZW5lcmF0aW9uIG92ZXIga25vd2xlZGdlIGJhc2UnLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGJvZHlUZXh0OiAnQ29yZSBjYXBhYmlsaXR5OiBnaXZlbiBhIHN1cHBvcnQgcXVlc3Rpb24sIHJldHJpZXZlIHJlbGV2YW50IGtub3dsZWRnZSBhcnRpY2xlcyBhbmQgZ2VuZXJhdGUgYSBncm91bmRlZCwgY2l0ZWQgYW5zd2VyLicgfSxcclxuICAgIHsga2V5OiAnZmVhdEluZ2VzdCcsIHR5cGU6ICdmZWF0dXJlJywgdGl0bGU6ICdLbm93bGVkZ2UgaW5nZXN0aW9uIHBpcGVsaW5lIChTYWxlc2ZvcmNlIEtBIGV4cG9ydCknLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTInLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgYm9keVRleHQ6ICdFeHBvcnQga25vd2xlZGdlIGFydGljbGVzLCBub3JtYWxpemUgdG8gY2xlYW4gdGV4dCwgY2h1bmssIGFuZCBpbmRleCBmb3IgcmV0cmlldmFsLicgfSxcclxuICAgIHsga2V5OiAnZmVhdEZlZWRiYWNrJywgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0FnZW50IGZlZWRiYWNrIGNhcHR1cmUgKHRodW1icyArIHJlYXNvbiBjb2RlcyknLCBzdGF0dXM6ICdiYWNrbG9nJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcjogJ21hcmsnLCBtaWxlc3RvbmU6ICdtMycsIGJvZHlUZXh0OiAnUGlsb3QgYWdlbnRzIHJhdGUgZWFjaCBBSSBhbnN3ZXI7IHJlYXNvbnMgZmVlZCB0aGUgcXVhbGl0eSBkYXNoYm9hcmQuJyB9LFxyXG5cclxuICAgIC8vIFJlcXVpcmVtZW50c1xyXG4gICAgeyBrZXk6ICdyZXFDaXRhdGlvbnMnLCB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ0V2ZXJ5IEFJIGFuc3dlciBtdXN0IGNpdGUgaXRzIHNvdXJjZSBhcnRpY2xlcycsIHN0YXR1czogJ3RvZG8nLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGV4dHJhOiB7IGFjY2VwdGFuY2VDcml0ZXJpYTogJ0Fuc3dlciBVSSBzaG93cyBhdCBsZWFzdCBvbmUgc291cmNlIGxpbmsgcGVyIGFuc3dlcjsgdW5jaXRlZCBhbnN3ZXJzIGFyZSBzdXBwcmVzc2VkLicsIHNlY3VyaXR5Q29uc2lkZXJhdGlvbnM6ICdDaXRhdGlvbnMgbXVzdCBub3QgZXhwb3NlIHJlc3RyaWN0ZWQgYXJ0aWNsZXMgdG8gdW5hdXRob3JpemVkIGFnZW50cy4nIH0gfSxcclxuICAgIHsga2V5OiAncmVxUEhJJywgdHlwZTogJ3JlcXVpcmVtZW50JywgdGl0bGU6ICdObyBQSEkgb3IgY3VzdG9tZXIgZGF0YSBtYXkgbGVhdmUgYXBwcm92ZWQgc3lzdGVtcycsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgYWNjZXB0YW5jZUNyaXRlcmlhOiAnRGF0YSBmbG93IGRpYWdyYW0gYXBwcm92ZWQgYnkgc2VjdXJpdHk7IERMUCBzY2FuIG9mIHBpcGVsaW5lIG91dHB1dCBzaG93cyB6ZXJvIFBISS4nLCBzZWN1cml0eUNvbnNpZGVyYXRpb25zOiAnQmxvY2tpbmcgcmVxdWlyZW1lbnQgZm9yIGFueSBleHRlcm5hbCBBSSBzZXJ2aWNlLicgfSB9LFxyXG4gICAgeyBrZXk6ICdyZXFGcmVzaG5lc3MnLCB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ0tub3dsZWRnZSBpbmRleCByZWZyZXNoZXMgd2l0aGluIDI0aCBvZiBhcnRpY2xlIHVwZGF0ZXMnLCBzdGF0dXM6ICdiYWNrbG9nJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGV4dHJhOiB7IGFjY2VwdGFuY2VDcml0ZXJpYTogJ0FydGljbGUgZWRpdGVkIGluIHNvdXJjZSBzeXN0ZW0gYXBwZWFycyBpbiByZXRyaWV2YWwgcmVzdWx0cyB3aXRoaW4gMjQgaG91cnMuJyB9IH0sXHJcblxyXG4gICAgLy8gVGFza3NcclxuICAgIHsga2V5OiAndGFza0V4cG9ydCcsIHR5cGU6ICd0YXNrJywgdGl0bGU6ICdCdWlsZCBTYWxlc2ZvcmNlIGtub3dsZWRnZSBhcnRpY2xlIGV4cG9ydCBzY3JpcHQnLCBzdGF0dXM6ICdkb25lJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTEnLCBib2R5VGV4dDogJ0V4cG9ydCBhbGwgcHVibGlzaGVkIEtBcyB3aXRoIG1ldGFkYXRhIHRvIHN0cnVjdHVyZWQgZmlsZXMuJyB9LFxyXG4gICAgeyBrZXk6ICd0YXNrQ2xlYW4nLCB0eXBlOiAndGFzaycsIHRpdGxlOiAnSFRNTFx1MjE5MmNsZWFuIHRleHQgbm9ybWFsaXphdGlvbiBmb3IgZXhwb3J0ZWQgYXJ0aWNsZXMnLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgZHVlRGF0ZTogJzIwMjYtMDctMjQnIH0sXHJcbiAgICB7IGtleTogJ3Rhc2tFdmFsJywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0RyYWZ0IGFuc3dlci1xdWFsaXR5IGV2YWx1YXRpb24gcnVicmljJywgc3RhdHVzOiAndG9kbycsIHByaW9yaXR5OiAnbWVkaXVtJywgb3duZXI6ICdtYXJrJywgbWlsZXN0b25lOiAnbTInLCBkdWVEYXRlOiAnMjAyNi0wNy0zMScgfSxcclxuICAgIHsga2V5OiAndGFza0ludmVudG9yeScsIHR5cGU6ICd0YXNrJywgdGl0bGU6ICdJbnZlbnRvcnkgY2FuZGlkYXRlIGtub3dsZWRnZSBkb21haW5zIGFuZCBhcnRpY2xlIGNvdW50cycsIHN0YXR1czogJ2RvbmUnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20xJyB9LFxyXG5cclxuICAgIC8vIEFjY2VzcyByZXF1ZXN0c1xyXG4gICAgeyBrZXk6ICdhY2NTZkFwaScsIHR5cGU6ICdhY2Nlc3MnLCB0aXRsZTogJ1NhbGVzZm9yY2UgQVBJIGFjY2VzcyAoS25vd2xlZGdlIG9iamVjdCwgcmVhZCknLCBzdGF0dXM6ICdyZXF1ZXN0ZWQnLCBwcmlvcml0eTogJ3VyZ2VudCcsIG93bmVyOiAnam9obicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBzeXN0ZW06ICdTYWxlc2ZvcmNlIFNlcnZpY2UgQ2xvdWQnLCBhY2Nlc3NUeXBlOiAnQVBJIHJlYWQgKEtub3dsZWRnZSBvYmplY3QpJywgYnVzaW5lc3NSZWFzb246ICdBdXRvbWF0ZWQgZXhwb3J0IG9mIGtub3dsZWRnZSBhcnRpY2xlcyBmb3IgdGhlIGluZ2VzdGlvbiBwaXBlbGluZS4nLCByZXF1ZXN0ZWRGcm9tOiAnU2FsZXNmb3JjZSBwbGF0Zm9ybSB0ZWFtJywgcmVxdWVzdERhdGU6ICcyMDI2LTA2LTMwJywgbmV4dEFjdGlvbjogJ0ZvbGxvdyB1cCB3aXRoIHBsYXRmb3JtIHRlYW0gbGVhZCcsIGZvbGxvd1VwRGF0ZTogJzIwMjYtMDctMTUnIH0gfSxcclxuICAgIHsga2V5OiAnYWNjQXp1cmUnLCB0eXBlOiAnYWNjZXNzJywgdGl0bGU6ICdBenVyZSBPcGVuQUkgc2VydmljZSBwcm92aXNpb25pbmcgaW4gTWNLZXNzb24gdGVuYW50Jywgc3RhdHVzOiAndW5kZXJfcmV2aWV3JywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgc3lzdGVtOiAnQXp1cmUgT3BlbkFJIChNY0tlc3NvbiB0ZW5hbnQpJywgYWNjZXNzVHlwZTogJ1Jlc291cmNlIHByb3Zpc2lvbmluZyArIEFQSSBrZXlzJywgYnVzaW5lc3NSZWFzb246ICdBcHByb3ZlZC10ZW5hbnQgTExNIHJlcXVpcmVkIGZvciBhbnN3ZXIgZ2VuZXJhdGlvbiB3aXRob3V0IGRhdGEgZWdyZXNzLicsIHJlcXVlc3RlZEZyb206ICdDbG91ZCBwbGF0Zm9ybSAvIHNlY3VyaXR5JywgcmVxdWVzdERhdGU6ICcyMDI2LTA2LTIyJywgbmV4dEFjdGlvbjogJ1NlY3VyaXR5IHJldmlldyBtZWV0aW5nJywgZm9sbG93VXBEYXRlOiAnMjAyNi0wNy0xOCcgfSB9LFxyXG4gICAgeyBrZXk6ICdhY2NTcCcsIHR5cGU6ICdhY2Nlc3MnLCB0aXRsZTogJ1NoYXJlUG9pbnQgc2l0ZSBmb3IgcGlsb3QgZG9jdW1lbnRhdGlvbicsIHN0YXR1czogJ2dyYW50ZWQnLCBwcmlvcml0eTogJ2xvdycsIG93bmVyOiAnbWFyaycsIGV4dHJhOiB7IHN5c3RlbTogJ1NoYXJlUG9pbnQgT25saW5lJywgYWNjZXNzVHlwZTogJ1NpdGUgb3duZXInLCBidXNpbmVzc1JlYXNvbjogJ1NoYXJlZCBkb2N1bWVudGF0aW9uIGFuZCBwaWxvdCBhcnRpZmFjdHMuJywgcmVxdWVzdGVkRnJvbTogJ0lUIHNlcnZpY2UgZGVzaycsIHJlcXVlc3REYXRlOiAnMjAyNi0wNi0xMCcsIGFwcHJvdmVkQnk6ICdJVCBzZXJ2aWNlIGRlc2snLCBkYXRlR3JhbnRlZDogJzIwMjYtMDYtMTInIH0gfSxcclxuXHJcbiAgICAvLyBEZWNpc2lvbnNcclxuICAgIHsga2V5OiAnZGVjVGVuYW50JywgdHlwZTogJ2RlY2lzaW9uJywgdGl0bGU6ICdVc2UgdGVuYW50LWhvc3RlZCBBenVyZSBPcGVuQUksIG5vdCBwdWJsaWMgQVBJcycsIHN0YXR1czogJ2FwcHJvdmVkJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdtYXJrJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IGNvbnRleHQ6ICdBbnN3ZXIgZ2VuZXJhdGlvbiBuZWVkcyBhbiBMTE0uIFB1YmxpYyBBSSBBUElzIGFyZSB1bmFwcHJvdmVkIGZvciBpbnRlcm5hbCBkYXRhLicsIHByb2JsZW06ICdXaGljaCBMTE0gaG9zdGluZyBwYXRoIHNhdGlzZmllcyBzZWN1cml0eSB3aGlsZSB1bmJsb2NraW5nIHRoZSBwaWxvdD8nLCBvcHRpb25zOiBbeyB0aXRsZTogJ1B1YmxpYyBBUEkgKE9wZW5BSS9BbnRocm9waWMgZGlyZWN0KScsIG5vdGVzOiAnRmFzdCBidXQgdW5hcHByb3ZlZCBmb3IgaW50ZXJuYWwgZGF0YScsIHNlbGVjdGVkOiBmYWxzZSB9LCB7IHRpdGxlOiAnQXp1cmUgT3BlbkFJIGluIE1jS2Vzc29uIHRlbmFudCcsIG5vdGVzOiAnRGF0YSBzdGF5cyBpbiB0ZW5hbnQ7IHByb2N1cmVtZW50ICsgcHJvdmlzaW9uaW5nIHJlcXVpcmVkJywgc2VsZWN0ZWQ6IHRydWUgfSwgeyB0aXRsZTogJ0xvY2FsIG9wZW4td2VpZ2h0cyBtb2RlbCcsIG5vdGVzOiAnTm8gZWdyZXNzIGJ1dCB3ZWFrZXIgcXVhbGl0eSBhbmQgaGVhdnkgaW5mcmEnLCBzZWxlY3RlZDogZmFsc2UgfV0sIHJlYXNvbmluZzogJ1RlbmFudCBob3N0aW5nIGtlZXBzIGRhdGEgaW5zaWRlIGFwcHJvdmVkIGJvdW5kYXJ5IGFuZCBoYXMgYW4gZXhpc3RpbmcgZW50ZXJwcmlzZSBhZ3JlZW1lbnQgcGF0aC4nLCB0cmFkZW9mZnM6ICdTbG93ZXIgc3RhcnQ7IGNhcGFjaXR5IHF1b3RhczsgbW9kZWwgYXZhaWxhYmlsaXR5IGxhZ3MgcHVibGljIEFQSXMuJyB9IH0sXHJcbiAgICB7IGtleTogJ2RlY0RvbWFpbicsIHR5cGU6ICdkZWNpc2lvbicsIHRpdGxlOiAnUGlsb3Qgc2NvcGU6IHN0YXJ0IHdpdGggb25lIGhpZ2gtdm9sdW1lIGtub3dsZWRnZSBkb21haW4nLCBzdGF0dXM6ICdkaXNjdXNzaW5nJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcjogJ2pvaG4nLCBleHRyYTogeyBjb250ZXh0OiAnS25vd2xlZGdlIGJhc2Ugc3BhbnMgbWFueSBwcm9kdWN0IGFyZWFzIHdpdGggdW5ldmVuIHF1YWxpdHkuJywgcHJvYmxlbTogJ1BpbG90IGV2ZXJ5dGhpbmcgb3Igb25lIGRvbWFpbiBmaXJzdD8nLCBvcHRpb25zOiBbeyB0aXRsZTogJ1NpbmdsZSBkb21haW4gcGlsb3QnLCBub3RlczogJ0NsZWFuZXIgbWVhc3VyZW1lbnQsIGZhc3RlciBpdGVyYXRpb24nLCBzZWxlY3RlZDogdHJ1ZSB9LCB7IHRpdGxlOiAnQWxsIGRvbWFpbnMgYXQgb25jZScsIG5vdGVzOiAnQnJvYWRlciBpbXBhY3QsIGRpbHV0ZWQgcXVhbGl0eSBzaWduYWwnLCBzZWxlY3RlZDogZmFsc2UgfV0sIHJlYXNvbmluZzogJ1NpbmdsZS1kb21haW4gZ2l2ZXMgYSBjbGVhbiBhY2N1cmFjeSBiYXNlbGluZSBhbmQgY29udGFpbmFibGUgcmV2aWV3IGxvYWQuJyB9IH0sXHJcblxyXG4gICAgLy8gUmlza3NcclxuICAgIHsga2V5OiAncmlza1F1YWxpdHknLCB0eXBlOiAncmlzaycsIHRpdGxlOiAnS25vd2xlZGdlIGFydGljbGUgcXVhbGl0eSB0b28gbG93IGZvciBncm91bmRlZCBhbnN3ZXJzJywgc3RhdHVzOiAnb3BlbicsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnam9obicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBsaWtlbGlob29kOiAnbWVkaXVtJywgaW1wYWN0OiAnaGlnaCcsIG1pdGlnYXRpb246ICdRdWFsaXR5IGF1ZGl0IG9mIHRoZSBwaWxvdCBkb21haW4gYmVmb3JlIGluZGV4aW5nOyBhcnRpY2xlIGNsZWFudXAgYmFja2xvZyB3aXRoIHRoZSBrbm93bGVkZ2UgdGVhbS4nIH0gfSxcclxuICAgIHsga2V5OiAncmlza0FjY2VzcycsIHR5cGU6ICdyaXNrJywgdGl0bGU6ICdBY2Nlc3MgYXBwcm92YWxzIHNsaXAgYW5kIHN0YWxsIHRoZSBwaXBlbGluZSBidWlsZCcsIHN0YXR1czogJ21pdGlnYXRpbmcnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgbGlrZWxpaG9vZDogJ2hpZ2gnLCBpbXBhY3Q6ICdoaWdoJywgbWl0aWdhdGlvbjogJ1dlZWtseSBmb2xsb3ctdXBzOyBsZWFkZXJzaGlwIGVzY2FsYXRpb24gcGF0aCBhZ3JlZWQ7IGJ1aWxkIHBpcGVsaW5lIGFnYWluc3QgZXhwb3J0ZWQgc2FtcGxlIGRhdGEgbWVhbndoaWxlLicgfSB9LFxyXG5cclxuICAgIC8vIEJsb2NrZXJzXHJcbiAgICB7IGtleTogJ2Jsa0F6dXJlJywgdHlwZTogJ2Jsb2NrZXInLCB0aXRsZTogJ0Nhbm5vdCBnZW5lcmF0ZSBhbnN3ZXJzIHVudGlsIEF6dXJlIE9wZW5BSSBpcyBwcm92aXNpb25lZCcsIHN0YXR1czogJ2FjdGl2ZScsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdtYXJrJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IHdhaXRpbmdPbjogJ0Nsb3VkIHBsYXRmb3JtIHRlYW0gLyBzZWN1cml0eSByZXZpZXcnLCBzaW5jZTogJzIwMjYtMDYtMjInIH0gfSxcclxuXHJcbiAgICAvLyBNZWV0aW5nXHJcbiAgICB7IGtleTogJ210Z0tpY2tvZmYnLCB0eXBlOiAnbWVldGluZycsIHRpdGxlOiAnU3VwcG9ydCBBSSBraWNrb2ZmIHdpdGgga25vd2xlZGdlIGxlYWRlcnNoaXAnLCBzdGF0dXM6ICdzdW1tYXJpemVkJywgb3duZXI6ICdqb2huJywgZXh0cmE6IHsgZGF0ZTogJzIwMjYtMDYtMTgnLCB0aW1lOiAnMTA6MDAgQU0nLCBhdHRlbmRlZXM6IFsnSm9obicsICdNYXJrJywgJ0FsbGVuJywgJ0dlb3JnZSddLCBwdXJwb3NlOiAnQWxpZ24gb24gcGlsb3Qgc2NvcGUsIGFjY2VzcyBuZWVkcywgYW5kIHN1Y2Nlc3MgbWVhc3VyZXMuJywgYWdlbmRhOiAnMS4gVmlzaW9uICAyLiBQaWxvdCBzY29wZSAgMy4gQWNjZXNzIHJlcXVlc3RzICA0LiBUaW1lbGluZScgfSwgYm9keVRleHQ6ICdBZ3JlZWQgdG8gc2luZ2xlLWRvbWFpbiBwaWxvdC4gQWxsZW4gdG8gc3BvbnNvciBhY2Nlc3MgcmVxdWVzdHMuIFN1Y2Nlc3MgPSBkZWZsZWN0aW9uIHJhdGUgKyBhZ2VudCBzYXRpc2ZhY3Rpb24uIE5leHQgY2hlY2staW4gaW4gNCB3ZWVrcy4nIH0sXHJcblxyXG4gICAgLy8gUXVlc3Rpb25zIC8gaWRlYXMgLyByZXNlYXJjaFxyXG4gICAgeyBrZXk6ICdxTWV0cmljcycsIHR5cGU6ICdxdWVzdGlvbicsIHRpdGxlOiAnV2hpY2ggZGVmbGVjdGlvbiBtZXRyaWMgZG9lcyBzdXBwb3J0IGxlYWRlcnNoaXAgYWxyZWFkeSB0cnVzdD8nLCBzdGF0dXM6ICdvcGVuJywgb3duZXI6ICdtYXJrJywgZXh0cmE6IHt9IH0sXHJcbiAgICB7IGtleTogJ2lkZWFUcmlhZ2UnLCB0eXBlOiAnaWRlYScsIHRpdGxlOiAnQXV0by10cmlhZ2UgaW5ib3VuZCBjYXNlcyBieSBrbm93bGVkZ2UgY292ZXJhZ2UnLCBzdGF0dXM6ICdiYWNrbG9nJywgb3duZXI6ICdqb2huJywgYm9keVRleHQ6ICdJZiByZXRyaWV2YWwgY29uZmlkZW5jZSBpcyBoaWdoLCBzdWdnZXN0IEtCLWZpcnN0IHJlc3BvbnNlIGJlZm9yZSBodW1hbiB0cmlhZ2UuJyB9LFxyXG4gICAgeyBrZXk6ICdyZXNSYWcnLCB0eXBlOiAncmVzZWFyY2gnLCB0aXRsZTogJ1JldHJpZXZhbCBzdHJhdGVneSBjb21wYXJpc29uOiBoeWJyaWQgdnMgcHVyZSB2ZWN0b3InLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIG93bmVyOiAnam9obicsIGJvZHlUZXh0OiAnRWFybHkgcmVzdWx0OiBoeWJyaWQgKEJNMjUgKyB2ZWN0b3IpIG5vdGljZWFibHkgYmV0dGVyIG9uIHByb2R1Y3QtY29kZSBxdWVyaWVzLicgfSxcclxuICBdO1xyXG5cclxuICBjb25zdCBjcmVhdGVkID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcclxuICBmb3IgKGNvbnN0IHMgb2YgaXRlbXMpIHtcclxuICAgIGNvbnN0IGl0ZW0gPSBzdG9yZS5jcmVhdGVJdGVtKHtcclxuICAgICAgdHlwZTogcy50eXBlLFxyXG4gICAgICB0aXRsZTogcy50aXRsZSxcclxuICAgICAgc3RhdHVzOiBzLnN0YXR1cyxcclxuICAgICAgcHJpb3JpdHk6IHMucHJpb3JpdHkgPz8gJ25vbmUnLFxyXG4gICAgICBvd25lcklkOiBzLm93bmVyID8/IG51bGwsXHJcbiAgICAgIG1pbGVzdG9uZUlkOiBzLm1pbGVzdG9uZSA/IG1pbGVzdG9uZUlkW3MubWlsZXN0b25lXSA6IG51bGwsXHJcbiAgICAgIGR1ZURhdGU6IHMuZHVlRGF0ZSA/PyBudWxsLFxyXG4gICAgICB0YWdzOiBzLnRhZ3MgPz8gW10sXHJcbiAgICAgIGV4dHJhOiBzLmV4dHJhID8/IHt9LFxyXG4gICAgICBsZWFkZXJzaGlwVmlzaWJsZTogcy5sZWFkZXJzaGlwVmlzaWJsZSA/IDEgOiAwLFxyXG4gICAgICBib2R5VGV4dDogcy5ib2R5VGV4dCA/PyAnJyxcclxuICAgICAgYm9keTogcy5ib2R5VGV4dCA/IHRleHREb2Mocy5ib2R5VGV4dCkgOiAnJyxcclxuICAgICAgc2FtcGxlOiAxLFxyXG4gICAgfSk7XHJcbiAgICBjcmVhdGVkLnNldChzLmtleSwgaXRlbS5pZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsaW5rID0gKGE6IHN0cmluZywgYjogc3RyaW5nLCBraW5kOiBQYXJhbWV0ZXJzPFN0b3JlWydhZGRMaW5rJ10+WzJdKSA9PiB7XHJcbiAgICBjb25zdCBmcm9tSWQgPSBjcmVhdGVkLmdldChhKTtcclxuICAgIGNvbnN0IHRvSWQgPSBjcmVhdGVkLmdldChiKTtcclxuICAgIGlmIChmcm9tSWQgJiYgdG9JZCkgc3RvcmUuYWRkTGluayhmcm9tSWQsIHRvSWQsIGtpbmQpO1xyXG4gIH07XHJcblxyXG4gIGxpbmsoJ3Rhc2tDbGVhbicsICdmZWF0SW5nZXN0JywgJ2ltcGxlbWVudHMnKTtcclxuICBsaW5rKCd0YXNrRXhwb3J0JywgJ2ZlYXRJbmdlc3QnLCAnaW1wbGVtZW50cycpO1xyXG4gIGxpbmsoJ3JlcUNpdGF0aW9ucycsICdmZWF0QW5zd2VyJywgJ3N1cHBvcnRzJyk7XHJcbiAgbGluaygncmVxUEhJJywgJ2ZlYXRBbnN3ZXInLCAnc3VwcG9ydHMnKTtcclxuICBsaW5rKCdyZXFGcmVzaG5lc3MnLCAnZmVhdEluZ2VzdCcsICdzdXBwb3J0cycpO1xyXG4gIGxpbmsoJ2ZlYXRBbnN3ZXInLCAnZGVjVGVuYW50JywgJ3NoYXBlZF9ieScpO1xyXG4gIGxpbmsoJ2ZlYXRBbnN3ZXInLCAnYWNjQXp1cmUnLCAncmVxdWlyZXNfYWNjZXNzJyk7XHJcbiAgbGluaygnZmVhdEluZ2VzdCcsICdhY2NTZkFwaScsICdyZXF1aXJlc19hY2Nlc3MnKTtcclxuICBsaW5rKCdibGtBenVyZScsICdmZWF0QW5zd2VyJywgJ2Jsb2NrcycpO1xyXG4gIGxpbmsoJ2RlY0RvbWFpbicsICdtdGdLaWNrb2ZmJywgJ2Rpc2N1c3NlZF9pbicpO1xyXG4gIGxpbmsoJ3Jpc2tBY2Nlc3MnLCAnYWNjQXp1cmUnLCAncmVsYXRlcycpO1xyXG5cclxuICByZXR1cm4gaXRlbXMubGVuZ3RoO1xyXG59XHJcblxyXG4vKiogTWluaW1hbCByaWNoLWRvYyB3cmFwcGVyIGZvciBzZWVkIGJvZHkgdGV4dCAob25lIHBhcmFncmFwaCkuICovXHJcbmZ1bmN0aW9uIHRleHREb2ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiAnZG9jJywgY29udGVudDogW3sgdHlwZTogJ3BhcmFncmFwaCcsIGNvbnRlbnQ6IFt7IHR5cGU6ICd0ZXh0JywgdGV4dCB9XSB9XSB9KTtcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsdUJBQXFCO0FBQ3JCLG9CQUFtQjtBQUNuQixJQUFBQSxrQkFBZTtBQUNmLElBQUFDLG9CQUFpQjtBQUNqQixxQkFBZTs7O0FDUmYsNEJBQXFCO0FBQ3JCLHVCQUFpQjtBQUNqQixxQkFBZTtBQUNmLHlCQUFtQjs7O0FDTVosSUFBTSxhQUEwQjtBQUFBLEVBQ3JDO0FBQUEsSUFDRSxTQUFTO0FBQUEsSUFDVCxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBaU9QO0FBQUEsRUFDQTtBQUFBLElBQ0UsU0FBUztBQUFBLElBQ1QsTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFpQlA7QUFBQSxFQUNBO0FBQUEsSUFDRSxTQUFTO0FBQUEsSUFDVCxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FB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QUFJLE1BQU0sWUFBWSxNQUFNLEVBQUUsRUFBeUIsS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLG1CQUFtQixDQUFDO0FBQ3pHLE1BQUksR0FBRyxNQUFNO0FBQ2YsQ0FBQztBQUFBLElBRUQsdUJBQUssNkZBQTZGLE1BQU07QUFDdEcsUUFBTSxFQUFFLEtBQUssTUFBTSxJQUFJLFFBQVEsYUFBYSxNQUFNO0FBQ2xELFFBQU0sT0FBTyxNQUFNLFdBQVcsRUFBRSxNQUFNLFFBQVEsT0FBTyxPQUFPLENBQUM7QUFDN0QsUUFBTSxJQUFJLE1BQU0sV0FBVyxLQUFLLElBQUksTUFBTSxXQUFXO0FBQ3JELFFBQU0sY0FBYyxFQUFFLEVBQUU7QUFDeEIsUUFBTSxXQUFXLEtBQUssRUFBRTtBQUd4QixRQUFNLE9BQU8sSUFBSSxHQUFHLFFBQVEscURBQXFELEVBQUUsSUFBSSxFQUFFLEVBQUU7QUFDM0YsZ0JBQUFBLFFBQU8sTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUM1QixnQkFBQUEsUUFBTyxNQUFNLEtBQUssWUFBWSxNQUFNO0FBQ3BDLFFBQU0sT0FBTyxJQUFJLEdBQUcsUUFBUSw4REFBOEQsRUFBRSxJQUFJLEtBQUssRUFBRTtBQUN2RyxnQkFBQUEsUUFBTyxNQUFNLEtBQUssU0FBUyxDQUFDO0FBQzVCLGdCQUFBQSxRQUFPLE1BQU0sS0FBSyxZQUFZLE1BQU07QUFDcEMsZ0JBQUFBLFFBQU8sR0FBRyxLQUFLLFVBQVU7QUFHekIsZ0JBQUFBLFFBQU8sR0FBRyxJQUFJLEdBQUcsUUFBUSxtQ0FBbUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO0FBQ3ZFLGdCQUFBQSxRQUFPLEdBQUcsSUFBSSxHQUFHLFFBQVEsZ0NBQWdDLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUd2RSxRQUFNLE1BQU0sTUFBTSxZQUFZLEtBQUssSUFBSSxFQUFFO0FBQ3pDLGdCQUFBQSxRQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsU0FBUyxDQUFDO0FBQy9DLGdCQUFBQSxRQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsaUJBQWlCLENBQUM7QUFDdkQsTUFBSSxHQUFHLE1BQU07QUFDZixDQUFDOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImZzIiwgInBhdGgiLCAiRGF0YWJhc2UiLCAiY3J5cHRvIiwgInBhdGgiLCAiZnMiLCAiaW1wb3J0X25vZGVfY3J5cHRvIiwgImNyeXB0byIsICJpdGVtIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX3BhdGgiLCAiZnMiLCAicGF0aCIsICJ0bXAiLCAiZnMiLCAicGF0aCIsICJvcyIsICJhc3NlcnQiXQp9Cg==
