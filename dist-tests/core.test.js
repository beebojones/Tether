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
  logActivity(itemId, kind, field, oldV, newV) {
    this.db.prepare("INSERT INTO activity(id, item_id, actor_id, kind, field, old_value, new_value, at) VALUES(?,?,?,?,?,?,?,?)").run(
      import_node_crypto2.default.randomUUID(),
      itemId,
      this.actorId,
      kind,
      field ?? null,
      oldV == null ? null : String(oldV).slice(0, 8e3),
      newV == null ? null : String(newV).slice(0, 8e3),
      this.now()
    );
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vdGVzdHMvY29yZS50ZXN0LnRzIiwgIi4uL2VsZWN0cm9uL2RiL2RiLnRzIiwgIi4uL2VsZWN0cm9uL2RiL21pZ3JhdGlvbnMudHMiLCAiLi4vZWxlY3Ryb24vZGIvc3RvcmUudHMiLCAiLi4vc2hhcmVkL3R5cGVzLnRzIiwgIi4uL3NoYXJlZC9kb2MudHMiLCAiLi4vZWxlY3Ryb24vc3luYy90cmFuc3BvcnQudHMiLCAiLi4vZWxlY3Ryb24vc3luYy9lbmdpbmUudHMiLCAiLi4vZWxlY3Ryb24vZGIvc2VlZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gQ29yZSBkYXRhLWxheWVyICsgc3luYyB0ZXN0cy4gUnVuIHdpdGg6IG5wbSB0ZXN0XHJcbi8vIChidW5kbGVkIGJ5IHNjcmlwdHMvcnVuLXRlc3RzLm1qcyBhbmQgZXhlY3V0ZWQgdW5kZXIgRWxlY3Ryb24ncyBOb2RlIHZpYSBFTEVDVFJPTl9SVU5fQVNfTk9ERVxyXG4vLyAgc28gYmV0dGVyLXNxbGl0ZTMncyBFbGVjdHJvbi1BQkkgYnVpbGQgbG9hZHMuKVxyXG5cclxuaW1wb3J0IHsgdGVzdCB9IGZyb20gJ25vZGU6dGVzdCc7XHJcbmltcG9ydCBhc3NlcnQgZnJvbSAnbm9kZTphc3NlcnQvc3RyaWN0JztcclxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xyXG5pbXBvcnQgb3MgZnJvbSAnbm9kZTpvcyc7XHJcbmltcG9ydCB7IG9wZW5EYXRhYmFzZSwgdHlwZSBEYkNvbnRleHQgfSBmcm9tICcuLi9lbGVjdHJvbi9kYi9kYic7XHJcbmltcG9ydCB7IFN0b3JlIH0gZnJvbSAnLi4vZWxlY3Ryb24vZGIvc3RvcmUnO1xyXG5pbXBvcnQgeyBGb2xkZXJUcmFuc3BvcnQgfSBmcm9tICcuLi9lbGVjdHJvbi9zeW5jL3RyYW5zcG9ydCc7XHJcbmltcG9ydCB7IFN5bmNFbmdpbmUgfSBmcm9tICcuLi9lbGVjdHJvbi9zeW5jL2VuZ2luZSc7XHJcbmltcG9ydCB7IGxvYWRTZWVkRGF0YSB9IGZyb20gJy4uL2VsZWN0cm9uL2RiL3NlZWQnO1xyXG5cclxuZnVuY3Rpb24gdG1wKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgY29uc3QgcCA9IGZzLm1rZHRlbXBTeW5jKHBhdGguam9pbihvcy50bXBkaXIoKSwgYHRldGhlci0ke25hbWV9LWApKTtcclxuICByZXR1cm4gcDtcclxufVxyXG5cclxuZnVuY3Rpb24gbWtTdG9yZShuYW1lOiBzdHJpbmcsIGFjdG9yOiBzdHJpbmcpOiB7IGN0eDogRGJDb250ZXh0OyBzdG9yZTogU3RvcmUgfSB7XHJcbiAgY29uc3QgY3R4ID0gb3BlbkRhdGFiYXNlKHRtcChuYW1lKSk7XHJcbiAgY29uc3Qgc3RvcmUgPSBuZXcgU3RvcmUoY3R4LCBhY3Rvcik7XHJcbiAgcmV0dXJuIHsgY3R4LCBzdG9yZSB9O1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzeW5jQm90aChhOiB7IHN0b3JlOiBTdG9yZSB9LCBiOiB7IHN0b3JlOiBTdG9yZSB9LCBmb2xkZXI6IHN0cmluZywgdXNlckEgPSAnSm9obicsIHVzZXJCID0gJ01hcmsnKSB7XHJcbiAgY29uc3QgZWEgPSBuZXcgU3luY0VuZ2luZShhLnN0b3JlLCB1c2VyQSwgKCkgPT4ge30pO1xyXG4gIGNvbnN0IGViID0gbmV3IFN5bmNFbmdpbmUoYi5zdG9yZSwgdXNlckIsICgpID0+IHt9KTtcclxuICBlYS5zZXRUcmFuc3BvcnQobmV3IEZvbGRlclRyYW5zcG9ydChmb2xkZXIpKTtcclxuICBlYi5zZXRUcmFuc3BvcnQobmV3IEZvbGRlclRyYW5zcG9ydChmb2xkZXIpKTtcclxuICAvLyBUd28gY3ljbGVzIGVhY2ggc28gcmVudW1iZXItcmVicm9hZGNhc3RzIGFuZCBjcm9zcy1pbXBvcnRzIHNldHRsZS5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xyXG4gICAgYXdhaXQgZWEuY3ljbGUoKTtcclxuICAgIGF3YWl0IGViLmN5Y2xlKCk7XHJcbiAgfVxyXG4gIGF3YWl0IGVhLnN0b3AoKTtcclxuICBhd2FpdCBlYi5zdG9wKCk7XHJcbn1cclxuXHJcbnRlc3QoJ21pZ3JhdGlvbnMgY3JlYXRlIHNjaGVtYSBhbmQgZGV2aWNlIGlkZW50aXR5JywgKCkgPT4ge1xyXG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgnbWlnJywgJ2pvaG4nKTtcclxuICBhc3NlcnQub2soY3R4LmRldmljZUlkLmxlbmd0aCA+IDEwKTtcclxuICBhc3NlcnQuZXF1YWwoc3RvcmUubGlzdEl0ZW1zKCkubGVuZ3RoLCAwKTtcclxuICBjdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdpdGVtIENSVUQsIGlkZW50IGFsbG9jYXRpb24sIGFjdGl2aXR5LCBzZWFyY2gnLCAoKSA9PiB7XHJcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdjcnVkJywgJ2pvaG4nKTtcclxuICBjb25zdCBpdGVtID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnQW5zd2VycyBtdXN0IGNpdGUgc291cmNlcycgfSk7XHJcbiAgYXNzZXJ0LmVxdWFsKGl0ZW0uaWRlbnQsICdSRVEtMScpO1xyXG4gIGFzc2VydC5lcXVhbChpdGVtLnN0YXR1cywgJ2JhY2tsb2cnKTtcclxuXHJcbiAgY29uc3Qgc2Vjb25kID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnQW5vdGhlciByZXF1aXJlbWVudCcgfSk7XHJcbiAgYXNzZXJ0LmVxdWFsKHNlY29uZC5pZGVudCwgJ1JFUS0yJyk7XHJcblxyXG4gIHN0b3JlLnVwZGF0ZUl0ZW0oaXRlbS5pZCwgeyBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAnaGlnaCcgfSk7XHJcbiAgY29uc3QgZ290ID0gc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSE7XHJcbiAgYXNzZXJ0LmVxdWFsKGdvdC5zdGF0dXMsICdpbl9wcm9ncmVzcycpO1xyXG4gIGFzc2VydC5lcXVhbChnb3QucHJpb3JpdHksICdoaWdoJyk7XHJcblxyXG4gIC8vIGRvbmUgXHUyMTkyIGNvbXBsZXRlZEF0IHNldFxyXG4gIHN0b3JlLnVwZGF0ZUl0ZW0oaXRlbS5pZCwgeyBzdGF0dXM6ICdkb25lJyB9KTtcclxuICBhc3NlcnQub2soc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEuY29tcGxldGVkQXQpO1xyXG5cclxuICAvLyBzZWFyY2ggaGl0cyB0aXRsZVxyXG4gIGNvbnN0IHJlc3VsdHMgPSBzdG9yZS5zZWFyY2goJ2NpdGUgc291cmNlcycpO1xyXG4gIGFzc2VydC5vayhyZXN1bHRzLnNvbWUoKHIpID0+IHIuaXRlbS5pZCA9PT0gaXRlbS5pZCkpO1xyXG5cclxuICAvLyBieSBpZGVudFxyXG4gIGFzc2VydC5lcXVhbChzdG9yZS5nZXRJdGVtQnlJZGVudCgncmVxLTEnKSEuaWQsIGl0ZW0uaWQpO1xyXG5cclxuICBjb25zdCBhY3Rpdml0eSA9IHN0b3JlLmFjdGl2aXR5Rm9yKGl0ZW0uaWQpIGFzIHsga2luZDogc3RyaW5nIH1bXTtcclxuICBhc3NlcnQub2soYWN0aXZpdHkuc29tZSgoYSkgPT4gYS5raW5kID09PSAnY3JlYXRlZCcpKTtcclxuICBhc3NlcnQub2soYWN0aXZpdHkuc29tZSgoYSkgPT4gYS5raW5kID09PSAndXBkYXRlZCcpKTtcclxuXHJcbiAgLy8gZGVsZXRlIGhpZGVzIGZyb20gcXVlcmllc1xyXG4gIHN0b3JlLmRlbGV0ZUl0ZW0oc2Vjb25kLmlkKTtcclxuICBhc3NlcnQuZXF1YWwoc3RvcmUuZ2V0SXRlbShzZWNvbmQuaWQpLCBudWxsKTtcclxuICBjdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdsaW5rcywgY29tbWVudHMsIHZlcnNpb25zJywgKCkgPT4ge1xyXG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgncmVsJywgJ2pvaG4nKTtcclxuICBjb25zdCBhID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdCdWlsZCBleHBvcnQnIH0pO1xyXG4gIGNvbnN0IGIgPSBzdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0luZ2VzdGlvbiBwaXBlbGluZScgfSk7XHJcbiAgc3RvcmUuYWRkTGluayhhLmlkLCBiLmlkLCAnaW1wbGVtZW50cycpO1xyXG4gIGNvbnN0IGxpbmtzID0gc3RvcmUubGlua3NGb3IoYS5pZCk7XHJcbiAgYXNzZXJ0LmVxdWFsKGxpbmtzLmxlbmd0aCwgMSk7XHJcbiAgYXNzZXJ0LmVxdWFsKGxpbmtzWzBdLm90aGVyLmlkLCBiLmlkKTtcclxuICBhc3NlcnQuZXF1YWwobGlua3NbMF0uZGlyZWN0aW9uLCAnb3V0Jyk7XHJcblxyXG4gIHN0b3JlLmFkZENvbW1lbnQoYS5pZCwgJ3tcInR5cGVcIjpcImRvY1wifScsICdsb29rcyBnb29kJyk7XHJcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmNvbW1lbnRzRm9yKGEuaWQpLmxlbmd0aCwgMSk7XHJcblxyXG4gIHN0b3JlLnNhdmVWZXJzaW9uKGEuaWQpO1xyXG4gIHN0b3JlLnVwZGF0ZUl0ZW0oYS5pZCwgeyB0aXRsZTogJ0J1aWxkIGV4cG9ydCB2MicgfSk7XHJcbiAgY29uc3QgdmVyc2lvbnMgPSBzdG9yZS52ZXJzaW9uc0ZvcihhLmlkKSBhcyB7IHRpdGxlOiBzdHJpbmcgfVtdO1xyXG4gIGFzc2VydC5lcXVhbCh2ZXJzaW9ucy5sZW5ndGgsIDEpO1xyXG4gIGFzc2VydC5lcXVhbCh2ZXJzaW9uc1swXS50aXRsZSwgJ0J1aWxkIGV4cG9ydCcpO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuXHJcbnRlc3QoJ3N5bmM6IHR3byBkZXZpY2VzIGNvbnZlcmdlIHRocm91Z2ggYSBzaGFyZWQgZm9sZGVyJywgYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnN0IGEgPSBta1N0b3JlKCdzeW5jQScsICdqb2huJyk7XHJcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ3N5bmNCJywgJ21hcmsnKTtcclxuICBjb25zdCBmb2xkZXIgPSB0bXAoJ3NoYXJlZCcpO1xyXG5cclxuICBjb25zdCBpdGVtQSA9IGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdGcm9tIEpvaG4nIH0pO1xyXG4gIGNvbnN0IGl0ZW1CID0gYi5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ2RlY2lzaW9uJywgdGl0bGU6ICdGcm9tIE1hcmsnIH0pO1xyXG5cclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xyXG5cclxuICBhc3NlcnQub2soYi5zdG9yZS5nZXRJdGVtKGl0ZW1BLmlkKSwgJ0IgcmVjZWl2ZWQgQSBpdGVtJyk7XHJcbiAgYXNzZXJ0Lm9rKGEuc3RvcmUuZ2V0SXRlbShpdGVtQi5pZCksICdBIHJlY2VpdmVkIEIgaXRlbScpO1xyXG4gIGFzc2VydC5lcXVhbChiLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpIS50aXRsZSwgJ0Zyb20gSm9obicpO1xyXG5cclxuICAvLyBFZGl0IG9uIEIgcHJvcGFnYXRlcyB0byBBXHJcbiAgYi5zdG9yZS51cGRhdGVJdGVtKGl0ZW1BLmlkLCB7IHN0YXR1czogJ2luX3Byb2dyZXNzJyB9KTtcclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xyXG4gIGFzc2VydC5lcXVhbChhLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpIS5zdGF0dXMsICdpbl9wcm9ncmVzcycpO1xyXG5cclxuICBhLmN0eC5kYi5jbG9zZSgpO1xyXG4gIGIuY3R4LmRiLmNsb3NlKCk7XHJcbn0pO1xyXG5cclxudGVzdCgnc3luYzogY29uY3VycmVudCB0aXRsZSBlZGl0cyBzdXJmYWNlIGEgY29uZmxpY3QsIExXVyBhcHBsaWVzLCByZXNvbHV0aW9uIGNvbnZlcmdlcycsIGFzeW5jICgpID0+IHtcclxuICBjb25zdCBhID0gbWtTdG9yZSgnY29uZkEnLCAnam9obicpO1xyXG4gIGNvbnN0IGIgPSBta1N0b3JlKCdjb25mQicsICdtYXJrJyk7XHJcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRjJyk7XHJcblxyXG4gIGNvbnN0IGl0ZW0gPSBhLnN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnT3JpZ2luYWwnIH0pO1xyXG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XHJcbiAgYXNzZXJ0Lm9rKGIuc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSk7XHJcblxyXG4gIC8vIEJvdGggZWRpdCB0aGUgdGl0bGUgd2hpbGUgXCJvZmZsaW5lXCIgKG5vIHN5bmMgYmV0d2VlbiBlZGl0cykuXHJcbiAgYS5zdG9yZS51cGRhdGVJdGVtKGl0ZW0uaWQsIHsgdGl0bGU6ICdKb2huIHZlcnNpb24nIH0pO1xyXG4gIGIuc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHRpdGxlOiAnTWFyayB2ZXJzaW9uJyB9KTtcclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xyXG5cclxuICAvLyBCb3RoIHNpZGVzIHNob3cgdGhlIHNhbWUgTFdXIHdpbm5lci5cclxuICBjb25zdCB0YSA9IGEuc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEudGl0bGU7XHJcbiAgY29uc3QgdGIgPSBiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlO1xyXG4gIGFzc2VydC5lcXVhbCh0YSwgdGIsICdMV1cgY29udmVyZ2VkJyk7XHJcblxyXG4gIC8vIEF0IGxlYXN0IG9uZSBzaWRlIHJlY29yZGVkIGEgY29uZmxpY3QgZm9yIHJldmlldy5cclxuICBjb25zdCBjb25mbGljdHMgPSBbLi4uYS5zdG9yZS5saXN0Q29uZmxpY3RzKHRydWUpLCAuLi5iLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSldO1xyXG4gIGFzc2VydC5vayhjb25mbGljdHMubGVuZ3RoID49IDEsICdjb25mbGljdCBzdXJmYWNlZCcpO1xyXG4gIGFzc2VydC5vayhjb25mbGljdHMuc29tZSgoYykgPT4gYy5maWVsZCA9PT0gJ3RpdGxlJykpO1xyXG5cclxuICAvLyBSZXNvbHZpbmcgd2l0aCBhIG1lcmdlZCB2YWx1ZSBwcm9wYWdhdGVzLlxyXG4gIGNvbnN0IHNpZGUgPSBhLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSkubGVuZ3RoID8gYSA6IGI7XHJcbiAgY29uc3QgY29uZmxpY3QgPSBzaWRlLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSlbMF07XHJcbiAgc2lkZS5zdG9yZS5yZXNvbHZlQ29uZmxpY3QoY29uZmxpY3QuaWQsICdtZXJnZWQnLCAnTWVyZ2VkIHRpdGxlJyk7XHJcbiAgYXdhaXQgc3luY0JvdGgoYSwgYiwgZm9sZGVyKTtcclxuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW0uaWQpIS50aXRsZSwgJ01lcmdlZCB0aXRsZScpO1xyXG4gIGFzc2VydC5lcXVhbChiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlLCAnTWVyZ2VkIHRpdGxlJyk7XHJcblxyXG4gIGEuY3R4LmRiLmNsb3NlKCk7XHJcbiAgYi5jdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdzeW5jOiBpZGVudCBjb2xsaXNpb24gcmVudW1iZXJzIGFuZCBjb252ZXJnZXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ2lkQScsICdqb2huJyk7XHJcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ2lkQicsICdtYXJrJyk7XHJcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRpJyk7XHJcblxyXG4gIC8vIEJvdGggY3JlYXRlIFRBU0stMSBvZmZsaW5lLlxyXG4gIGNvbnN0IGlhID0gYS5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0EgdGFzaycgfSk7XHJcbiAgY29uc3QgaWIgPSBiLnN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnQiB0YXNrJyB9KTtcclxuICBhc3NlcnQuZXF1YWwoaWEuaWRlbnQsICdUQVNLLTEnKTtcclxuICBhc3NlcnQuZXF1YWwoaWIuaWRlbnQsICdUQVNLLTEnKTtcclxuXHJcbiAgYXdhaXQgc3luY0JvdGgoYSwgYiwgZm9sZGVyKTtcclxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpOyAvLyBleHRyYSByb3VuZHMgdG8gc2V0dGxlIHJlbnVtYmVyIGJyb2FkY2FzdHNcclxuXHJcbiAgY29uc3QgYUlkZW50cyA9IFthLnN0b3JlLmdldEl0ZW0oaWEuaWQpIS5pZGVudCwgYS5zdG9yZS5nZXRJdGVtKGliLmlkKSEuaWRlbnRdLnNvcnQoKTtcclxuICBjb25zdCBiSWRlbnRzID0gW2Iuc3RvcmUuZ2V0SXRlbShpYS5pZCkhLmlkZW50LCBiLnN0b3JlLmdldEl0ZW0oaWIuaWQpIS5pZGVudF0uc29ydCgpO1xyXG4gIGFzc2VydC5ub3RFcXVhbChhSWRlbnRzWzBdLCBhSWRlbnRzWzFdLCAnaWRlbnRzIHVuaXF1ZSBvbiBBJyk7XHJcbiAgYXNzZXJ0Lm5vdEVxdWFsKGJJZGVudHNbMF0sIGJJZGVudHNbMV0sICdpZGVudHMgdW5pcXVlIG9uIEInKTtcclxuICBhc3NlcnQuZGVlcEVxdWFsKGFJZGVudHMsIGJJZGVudHMsICdib3RoIHNpZGVzIGFncmVlIG9uIGlkZW50cycpO1xyXG5cclxuICBhLmN0eC5kYi5jbG9zZSgpO1xyXG4gIGIuY3R4LmRiLmNsb3NlKCk7XHJcbn0pO1xyXG5cclxudGVzdCgnc3luYzogb2ZmbGluZSBlZGl0cyBxdWV1ZSBhbmQgZmx1c2ggd2hlbiBmb2xkZXIgcmV0dXJucycsIGFzeW5jICgpID0+IHtcclxuICBjb25zdCBhID0gbWtTdG9yZSgnb2ZmQScsICdqb2huJyk7XHJcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRvJyk7XHJcbiAgY29uc3QgZW5naW5lID0gbmV3IFN5bmNFbmdpbmUoYS5zdG9yZSwgJ0pvaG4nLCAoKSA9PiB7fSk7XHJcblxyXG4gIGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdNYWRlIG9mZmxpbmUnIH0pO1xyXG4gIGFzc2VydC5vayhlbmdpbmUuc3RhdHVzKCkucGVuZGluZ09wcyA+IDAgfHwgZW5naW5lLnN0YXR1cygpLnN0YXRlID09PSAnZGlzYWJsZWQnKTtcclxuXHJcbiAgZW5naW5lLnNldFRyYW5zcG9ydChuZXcgRm9sZGVyVHJhbnNwb3J0KGZvbGRlcikpO1xyXG4gIGF3YWl0IGVuZ2luZS5jeWNsZSgpO1xyXG4gIGFzc2VydC5lcXVhbChlbmdpbmUuc3RhdHVzKCkucGVuZGluZ09wcywgMCwgJ29wcyBleHBvcnRlZCBhZnRlciB0cmFuc3BvcnQgYXR0YWNoZWQnKTtcclxuICBhd2FpdCBlbmdpbmUuc3RvcCgpO1xyXG4gIGEuY3R4LmRiLmNsb3NlKCk7XHJcbn0pO1xyXG5cclxudGVzdCgnc2VlZCBkYXRhIGxvYWRzLCBpcyBmbGFnZ2VkLCBhbmQgcmVtb3ZlcyBjbGVhbmx5JywgKCkgPT4ge1xyXG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgnc2VlZCcsICdqb2huJyk7XHJcbiAgY29uc3QgbiA9IGxvYWRTZWVkRGF0YShzdG9yZSk7XHJcbiAgYXNzZXJ0Lm9rKG4gPiAxNSk7XHJcbiAgY29uc3Qgc2FtcGxlcyA9IHN0b3JlLmxpc3RJdGVtcyh7IHNhbXBsZTogdHJ1ZSB9LCB7IGZpZWxkOiAnY3JlYXRlZEF0JywgZGlyOiAnYXNjJyB9LCAxMDApO1xyXG4gIGFzc2VydC5lcXVhbChzYW1wbGVzLmxlbmd0aCwgbik7XHJcbiAgLy8gbGlua3MgZXhpc3RcclxuICBjb25zdCB3aXRoTGlua3MgPSBzYW1wbGVzLmZpbHRlcigocykgPT4gc3RvcmUubGlua3NGb3Iocy5pZCkubGVuZ3RoID4gMCk7XHJcbiAgYXNzZXJ0Lm9rKHdpdGhMaW5rcy5sZW5ndGggPiA1KTtcclxuXHJcbiAgY29uc3QgcmVtb3ZlZCA9IHN0b3JlLnJlbW92ZVNhbXBsZURhdGEoKTtcclxuICBhc3NlcnQuZXF1YWwocmVtb3ZlZCwgbik7XHJcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmxpc3RJdGVtcyh7fSwgeyBmaWVsZDogJ2NyZWF0ZWRBdCcsIGRpcjogJ2FzYycgfSwgMTAwKS5sZW5ndGgsIDApO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuXHJcbnRlc3QoJ2RhdGFiYXNlIGludGVncml0eSBndWFyZCBxdWFyYW50aW5lcyBjb3JydXB0aW9uJywgKCkgPT4ge1xyXG4gIGNvbnN0IGRpciA9IHRtcCgnY29ycnVwdCcpO1xyXG4gIGNvbnN0IGN0eCA9IG9wZW5EYXRhYmFzZShkaXIpO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG4gIC8vIFN0b21wIHRoZSBmaWxlIGhlYWRlci5cclxuICBjb25zdCBkYlBhdGggPSBwYXRoLmpvaW4oZGlyLCAndGV0aGVyLmRiJyk7XHJcbiAgY29uc3QgZmQgPSBmcy5vcGVuU3luYyhkYlBhdGgsICdyKycpO1xyXG4gIGZzLndyaXRlU3luYyhmZCwgQnVmZmVyLmZyb20oJ0dBUkJBR0VHQVJCQUdFR0FSQkFHRScpLCAwLCAyMSwgMCk7XHJcbiAgZnMuY2xvc2VTeW5jKGZkKTtcclxuICBhc3NlcnQudGhyb3dzKCgpID0+IG9wZW5EYXRhYmFzZShkaXIpLCAvaW50ZWdyaXR5fG1hbGZvcm1lZHxub3QgYSBkYXRhYmFzZS9pKTtcclxufSk7XHJcblxyXG50ZXN0KCdvdXQtb2Ytb3JkZXIgcmVtb3RlIG9wczogc2V0L2RlbGV0ZSBhcnJpdmluZyBiZWZvcmUgY3JlYXRlIGFyZSBidWZmZXJlZCwgbm90IGxvc3QnLCAoKSA9PiB7XHJcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ3Jlb3JkZXInLCAnam9obicpO1xyXG4gIC8vIFNpbXVsYXRlIGRldmljZSBDIHJlY2VpdmluZyBCJ3Mgb3BzIGFib3V0IGFuIGl0ZW0gQkVGT1JFIEEncyBjcmVhdGUgb2YgaXQuXHJcbiAgY29uc3QgaXRlbUlkID0gJzAwMDAwMDAwLWFhYWEtNDAwMC04MDAwLTAwMDAwMDAwMDAwMSc7XHJcbiAgY29uc3Qgc2V0T3AgPSB7XHJcbiAgICBvcElkOiAnb3Atc2V0LTEnLCBkZXZpY2VJZDogJ2RldmljZS1CJywgYWN0b3JJZDogJ21hcmsnLCBsYW1wb3J0OiAxMCwgYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgIGVudGl0eTogJ2l0ZW0nIGFzIGNvbnN0LCBlbnRpdHlJZDogaXRlbUlkLCBhY3Rpb246ICdzZXQnIGFzIGNvbnN0LFxyXG4gICAgcGF5bG9hZDogeyBmaWVsZHM6IHsgc3RhdHVzOiAnaW5fcHJvZ3Jlc3MnIH0sIGJhc2VkT246IHsgc3RhdHVzOiBudWxsIH0gfSxcclxuICB9O1xyXG4gIGNvbnN0IGNyZWF0ZU9wID0ge1xyXG4gICAgb3BJZDogJ29wLWNyZWF0ZS0xJywgZGV2aWNlSWQ6ICdkZXZpY2UtQScsIGFjdG9ySWQ6ICdqb2huJywgbGFtcG9ydDogNSwgYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgIGVudGl0eTogJ2l0ZW0nIGFzIGNvbnN0LCBlbnRpdHlJZDogaXRlbUlkLCBhY3Rpb246ICdjcmVhdGUnIGFzIGNvbnN0LFxyXG4gICAgcGF5bG9hZDoge1xyXG4gICAgICByZWNvcmQ6IHtcclxuICAgICAgICBpZDogaXRlbUlkLCBpZGVudDogJ1RBU0stOTAwJywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ1Jlb3JkZXJlZCBpdGVtJywgYm9keTogJycsIGJvZHlUZXh0OiAnJyxcclxuICAgICAgICBzdGF0dXM6ICd0b2RvJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcklkOiBudWxsLCByZXBvcnRlcklkOiAnam9obicsIG1pbGVzdG9uZUlkOiBudWxsLFxyXG4gICAgICAgIHJlbGVhc2VJZDogbnVsbCwgcGFyZW50SWQ6IG51bGwsIHN0YXJ0RGF0ZTogbnVsbCwgZHVlRGF0ZTogbnVsbCwgY29tcGxldGVkQXQ6IG51bGwsXHJcbiAgICAgICAgZWZmb3J0OiBudWxsLCBjb25maWRlbmNlOiBudWxsLCByaXNrTGV2ZWw6IG51bGwsIGJ1c2luZXNzVmFsdWU6IG51bGwsIGxlYWRlcnNoaXBWaXNpYmxlOiAwLFxyXG4gICAgICAgIHByb2dyZXNzOiBudWxsLCB0YWdzOiBbXSwgZXh0cmE6IHt9LCBhcmNoaXZlZDogMCwgc2FtcGxlOiAwLFxyXG4gICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLCB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICBjcmVhdGVkQnk6ICdqb2huJywgdXBkYXRlZEJ5OiAnam9obicsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH07XHJcblxyXG4gIC8vIFNldCBhcnJpdmVzIGZpcnN0IFx1MjAxNCBtdXN0IGJ1ZmZlciwgaXRlbSBtdXN0IG5vdCBleGlzdCB5ZXQuXHJcbiAgYS5zdG9yZS5hcHBseVJlbW90ZU9wcyhbc2V0T3BdKTtcclxuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW1JZCksIG51bGwpO1xyXG5cclxuICAvLyBDcmVhdGUgYXJyaXZlcyBcdTIwMTQgaXRlbSBhcHBlYXJzIEFORCB0aGUgYnVmZmVyZWQgc2V0IHJlcGxheXMgb24gdG9wLlxyXG4gIGEuc3RvcmUuYXBwbHlSZW1vdGVPcHMoW2NyZWF0ZU9wXSk7XHJcbiAgY29uc3QgaXRlbSA9IGEuc3RvcmUuZ2V0SXRlbShpdGVtSWQpO1xyXG4gIGFzc2VydC5vayhpdGVtLCAnaXRlbSBjcmVhdGVkJyk7XHJcbiAgYXNzZXJ0LmVxdWFsKGl0ZW0hLnN0YXR1cywgJ2luX3Byb2dyZXNzJywgJ2J1ZmZlcmVkIHNldCBhcHBsaWVkIGFmdGVyIGNyZWF0ZScpO1xyXG5cclxuICAvLyBEZWxldGUtYmVmb3JlLWNyZWF0ZSBtdXN0IG5vdCByZXN1cnJlY3Q6IGZyZXNoIGVudGl0eSwgZGVsZXRlIGZpcnN0LCB0aGVuIGNyZWF0ZS5cclxuICBjb25zdCBpdGVtMiA9ICcwMDAwMDAwMC1iYmJiLTQwMDAtODAwMC0wMDAwMDAwMDAwMDInO1xyXG4gIGEuc3RvcmUuYXBwbHlSZW1vdGVPcHMoW1xyXG4gICAgeyAuLi5zZXRPcCwgb3BJZDogJ29wLWRlbC0yJywgZW50aXR5SWQ6IGl0ZW0yLCBhY3Rpb246ICdkZWxldGUnIGFzIGNvbnN0LCBsYW1wb3J0OiAyMCwgcGF5bG9hZDoge30gfSxcclxuICBdKTtcclxuICBhLnN0b3JlLmFwcGx5UmVtb3RlT3BzKFtcclxuICAgIHsgLi4uY3JlYXRlT3AsIG9wSWQ6ICdvcC1jcmVhdGUtMicsIGVudGl0eUlkOiBpdGVtMiwgbGFtcG9ydDogNixcclxuICAgICAgcGF5bG9hZDogeyByZWNvcmQ6IHsgLi4uKGNyZWF0ZU9wLnBheWxvYWQucmVjb3JkIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KSwgaWQ6IGl0ZW0yLCBpZGVudDogJ1RBU0stOTAxJyB9IH0gfSxcclxuICBdKTtcclxuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW0yKSwgbnVsbCwgJ2RlbGV0ZS1iZWZvcmUtY3JlYXRlIGRvZXMgbm90IHJlc3VycmVjdCB0aGUgaXRlbScpO1xyXG5cclxuICBhLmN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuXHJcbnRlc3QoJ2F1ZGl0YWJpbGl0eTogbWlsZXN0b25lcy9yZWxlYXNlcyBjYXJyeSBjcmVhdGVkK3VwZGF0ZWQgYXR0cmlidXRpb24gYW5kIGxvZyBhY3Rpdml0eScsICgpID0+IHtcclxuICBjb25zdCB7IGN0eCwgc3RvcmUgfSA9IG1rU3RvcmUoJ2F1ZGl0LW1zJywgJ2pvaG4nKTtcclxuICBjb25zdCBtID0gc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgbmFtZTogJ0Rpc2NvdmVyeScgfSk7XHJcbiAgY29uc3Qgcm93ID0gY3R4LmRiLnByZXBhcmUoJ1NFTEVDVCBjcmVhdGVkX2F0LCBjcmVhdGVkX2J5LCB1cGRhdGVkX2F0LCB1cGRhdGVkX2J5IEZST00gbWlsZXN0b25lcyBXSEVSRSBpZD0/JykuZ2V0KG0uaWQpIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz47XHJcbiAgYXNzZXJ0Lm9rKHJvdy5jcmVhdGVkX2F0ICYmIHJvdy5jcmVhdGVkX2J5ID09PSAnam9obicgJiYgcm93LnVwZGF0ZWRfYXQgJiYgcm93LnVwZGF0ZWRfYnkgPT09ICdqb2huJyk7XHJcbiAgY29uc3QgYWN0ID0gc3RvcmUuYWN0aXZpdHlGb3IobnVsbCwgNTApIGFzIHsga2luZDogc3RyaW5nOyBuZXdWYWx1ZTogc3RyaW5nIHwgbnVsbCB9W107XHJcbiAgYXNzZXJ0Lm9rKGFjdC5zb21lKChhKSA9PiBhLmtpbmQgPT09ICdtaWxlc3RvbmVfY3JlYXRlZCcgJiYgYS5uZXdWYWx1ZSA9PT0gJ0Rpc2NvdmVyeScpKTtcclxuXHJcbiAgLy8gVXBkYXRlIGJ5IGEgZGlmZmVyZW50IGFjdG9yIC0+IHVwZGF0ZWRfYnkgY2hhbmdlcywgYWN0aXZpdHkgbG9nZ2VkLlxyXG4gIHN0b3JlLmFjdG9ySWQgPSAnbWFyayc7XHJcbiAgc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgaWQ6IG0uaWQsIG5hbWU6ICdEaXNjb3ZlcnkgJiBBY2Nlc3MnIH0pO1xyXG4gIGNvbnN0IHJvdzIgPSBjdHguZGIucHJlcGFyZSgnU0VMRUNUIGNyZWF0ZWRfYnksIHVwZGF0ZWRfYnkgRlJPTSBtaWxlc3RvbmVzIFdIRVJFIGlkPT8nKS5nZXQobS5pZCkgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcclxuICBhc3NlcnQuZXF1YWwocm93Mi5jcmVhdGVkX2J5LCAnam9obicsICdjcmVhdG9yIHByZXNlcnZlZCcpO1xyXG4gIGFzc2VydC5lcXVhbChyb3cyLnVwZGF0ZWRfYnksICdtYXJrJywgJ2xhc3QgZWRpdG9yIHJlY29yZGVkJyk7XHJcbiAgYXNzZXJ0Lm9rKChzdG9yZS5hY3Rpdml0eUZvcihudWxsLCA1MCkgYXMgeyBraW5kOiBzdHJpbmcgfVtdKS5zb21lKChhKSA9PiBhLmtpbmQgPT09ICdtaWxlc3RvbmVfdXBkYXRlZCcpKTtcclxuICBjdHguZGIuY2xvc2UoKTtcclxufSk7XHJcblxyXG50ZXN0KCdhdWRpdGFiaWxpdHk6IHNvZnQtZGVsZXRlIG9ubHksIGRlbGV0ZXMgYXR0cmlidXRlZCBhbmQgbG9nZ2VkLCBub3RoaW5nIHBoeXNpY2FsbHkgcmVtb3ZlZCcsICgpID0+IHtcclxuICBjb25zdCB7IGN0eCwgc3RvcmUgfSA9IG1rU3RvcmUoJ2F1ZGl0LWRlbCcsICdqb2huJyk7XHJcbiAgY29uc3QgaXRlbSA9IHN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnVGVtcCcgfSk7XHJcbiAgY29uc3QgYyA9IHN0b3JlLmFkZENvbW1lbnQoaXRlbS5pZCwgJ3t9JywgJ2EgY29tbWVudCcpO1xyXG4gIHN0b3JlLmRlbGV0ZUNvbW1lbnQoYy5pZCk7XHJcbiAgc3RvcmUuZGVsZXRlSXRlbShpdGVtLmlkKTtcclxuXHJcbiAgLy8gUm93cyBzdGlsbCBwaHlzaWNhbGx5IHByZXNlbnQgKHNvZnQgZGVsZXRlKSwgd2l0aCBhdHRyaWJ1dGlvbi5cclxuICBjb25zdCBjcm93ID0gY3R4LmRiLnByZXBhcmUoJ1NFTEVDVCBkZWxldGVkLCBkZWxldGVkX2J5IEZST00gY29tbWVudHMgV0hFUkUgaWQ9PycpLmdldChjLmlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICBhc3NlcnQuZXF1YWwoY3Jvdy5kZWxldGVkLCAxKTtcclxuICBhc3NlcnQuZXF1YWwoY3Jvdy5kZWxldGVkX2J5LCAnam9obicpO1xyXG4gIGNvbnN0IGlyb3cgPSBjdHguZGIucHJlcGFyZSgnU0VMRUNUIGRlbGV0ZWQsIGRlbGV0ZWRfYnksIGRlbGV0ZWRfYXQgRlJPTSBpdGVtcyBXSEVSRSBpZD0/JykuZ2V0KGl0ZW0uaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gIGFzc2VydC5lcXVhbChpcm93LmRlbGV0ZWQsIDEpO1xyXG4gIGFzc2VydC5lcXVhbChpcm93LmRlbGV0ZWRfYnksICdqb2huJyk7XHJcbiAgYXNzZXJ0Lm9rKGlyb3cuZGVsZXRlZF9hdCk7XHJcblxyXG4gIC8vIEJvdGggcGh5c2ljYWwgcm93cyByZW1haW4gaW4gdGhlIGZpbGUuXHJcbiAgYXNzZXJ0Lm9rKGN0eC5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIGNvbW1lbnRzIFdIRVJFIGlkPT8nKS5nZXQoYy5pZCkpO1xyXG4gIGFzc2VydC5vayhjdHguZGIucHJlcGFyZSgnU0VMRUNUIDEgRlJPTSBpdGVtcyBXSEVSRSBpZD0/JykuZ2V0KGl0ZW0uaWQpKTtcclxuXHJcbiAgLy8gRGVsZXRpb25zIGFyZSBpbiB0aGUgYWN0aXZpdHkgbG9nLlxyXG4gIGNvbnN0IGFjdCA9IHN0b3JlLmFjdGl2aXR5Rm9yKGl0ZW0uaWQsIDUwKSBhcyB7IGtpbmQ6IHN0cmluZyB9W107XHJcbiAgYXNzZXJ0Lm9rKGFjdC5zb21lKChhKSA9PiBhLmtpbmQgPT09ICdkZWxldGVkJykpO1xyXG4gIGFzc2VydC5vayhhY3Quc29tZSgoYSkgPT4gYS5raW5kID09PSAnY29tbWVudF9kZWxldGVkJykpO1xyXG4gIGN0eC5kYi5jbG9zZSgpO1xyXG59KTtcclxuIiwgImltcG9ydCBEYXRhYmFzZSBmcm9tICdiZXR0ZXItc3FsaXRlMyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XHJcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcclxuaW1wb3J0IGNyeXB0byBmcm9tICdub2RlOmNyeXB0byc7XHJcbmltcG9ydCB7IE1JR1JBVElPTlMgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5cclxuZXhwb3J0IHR5cGUgREIgPSBEYXRhYmFzZS5EYXRhYmFzZTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGJDb250ZXh0IHtcclxuICBkYjogREI7XHJcbiAgZGV2aWNlSWQ6IHN0cmluZztcclxuICBkYXRhRGlyOiBzdHJpbmc7XHJcbiAgZGJQYXRoOiBzdHJpbmc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBPcGVucyAob3IgY3JlYXRlcykgdGhlIFRldGhlciBkYXRhYmFzZSwgYXBwbGllcyBwZW5kaW5nIG1pZ3JhdGlvbnMsXHJcbiAqIGFuZCBndWFyYW50ZWVzIGRldmljZSBpZGVudGl0eSBtZXRhZGF0YS5cclxuICpcclxuICogU2FmZXR5IHBvc3R1cmU6IFdBTCBtb2RlICsgaW50ZWdyaXR5IGNoZWNrIG9uIG9wZW4gKyB0aW1lc3RhbXBlZCBiYWNrdXBcclxuICogYmVmb3JlIGFueSBtaWdyYXRpb24gYmV5b25kIHZlcnNpb24gMC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBvcGVuRGF0YWJhc2UoZGF0YURpcjogc3RyaW5nKTogRGJDb250ZXh0IHtcclxuICBmcy5ta2RpclN5bmMoZGF0YURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgY29uc3QgZGJQYXRoID0gcGF0aC5qb2luKGRhdGFEaXIsICd0ZXRoZXIuZGInKTtcclxuICBjb25zdCBleGlzdGVkID0gZnMuZXhpc3RzU3luYyhkYlBhdGgpO1xyXG5cclxuICBjb25zdCBkYiA9IG5ldyBEYXRhYmFzZShkYlBhdGgpO1xyXG4gIGRiLnByYWdtYSgnam91cm5hbF9tb2RlID0gV0FMJyk7XHJcbiAgZGIucHJhZ21hKCdmb3JlaWduX2tleXMgPSBPTicpO1xyXG4gIGRiLnByYWdtYSgnc3luY2hyb25vdXMgPSBOT1JNQUwnKTtcclxuXHJcbiAgaWYgKGV4aXN0ZWQpIHtcclxuICAgIGNvbnN0IGNoZWNrID0gZGIucHJhZ21hKCdxdWlja19jaGVjaycsIHsgc2ltcGxlOiB0cnVlIH0pO1xyXG4gICAgaWYgKGNoZWNrICE9PSAnb2snKSB7XHJcbiAgICAgIC8vIFByZXNlcnZlIHRoZSBkYW1hZ2VkIGZpbGUgZm9yIHJlY292ZXJ5IGFuZCBmYWlsIGxvdWRseSBcdTIwMTQgbmV2ZXIgcnVuIG9uIGEgY29ycnVwdCBkYi5cclxuICAgICAgY29uc3QgcXVhcmFudGluZSA9IGRiUGF0aCArICcuY29ycnVwdC0nICsgRGF0ZS5ub3coKTtcclxuICAgICAgZGIuY2xvc2UoKTtcclxuICAgICAgZnMuY29weUZpbGVTeW5jKGRiUGF0aCwgcXVhcmFudGluZSk7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBgRGF0YWJhc2UgZmFpbGVkIGludGVncml0eSBjaGVjayAoJHtjaGVja30pLiBEYW1hZ2VkIGNvcHkgcHJlc2VydmVkIGF0ICR7cXVhcmFudGluZX0uIGAgK1xyXG4gICAgICAgICAgJ1Jlc3RvcmUgZnJvbSBhIGJhY2t1cCBpbiB0aGUgYmFja3Vwcy8gZm9sZGVyLicsXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhcHBseU1pZ3JhdGlvbnMoZGIsIGRhdGFEaXIsIGRiUGF0aCwgZXhpc3RlZCk7XHJcblxyXG4gIGNvbnN0IGRldmljZUlkID0gZW5zdXJlTWV0YShkYiwgJ2RldmljZV9pZCcsICgpID0+IGNyeXB0by5yYW5kb21VVUlEKCkpO1xyXG4gIGVuc3VyZU1ldGEoZGIsICdwcm9qZWN0X2lkJywgKCkgPT4gY3J5cHRvLnJhbmRvbVVVSUQoKSk7XHJcblxyXG4gIHJldHVybiB7IGRiLCBkZXZpY2VJZCwgZGF0YURpciwgZGJQYXRoIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFwcGx5TWlncmF0aW9ucyhkYjogREIsIGRhdGFEaXI6IHN0cmluZywgZGJQYXRoOiBzdHJpbmcsIGV4aXN0ZWQ6IGJvb2xlYW4pOiB2b2lkIHtcclxuICBjb25zdCBoYXNNZXRhID0gZGJcclxuICAgIC5wcmVwYXJlKFwiU0VMRUNUIENPVU5UKCopIEFTIGMgRlJPTSBzcWxpdGVfbWFzdGVyIFdIRVJFIHR5cGU9J3RhYmxlJyBBTkQgbmFtZT0nbWV0YSdcIilcclxuICAgIC5nZXQoKSBhcyB7IGM6IG51bWJlciB9O1xyXG4gIGxldCB2ZXJzaW9uID0gMDtcclxuICBpZiAoaGFzTWV0YS5jID4gMCkge1xyXG4gICAgY29uc3Qgcm93ID0gZGIucHJlcGFyZShcIlNFTEVDVCB2YWx1ZSBGUk9NIG1ldGEgV0hFUkUga2V5PSdzY2hlbWFfdmVyc2lvbidcIikuZ2V0KCkgYXNcclxuICAgICAgfCB7IHZhbHVlOiBzdHJpbmcgfVxyXG4gICAgICB8IHVuZGVmaW5lZDtcclxuICAgIHZlcnNpb24gPSByb3cgPyBOdW1iZXIocm93LnZhbHVlKSA6IDA7XHJcbiAgfVxyXG5cclxuICBjb25zdCBwZW5kaW5nID0gTUlHUkFUSU9OUy5maWx0ZXIoKG0pID0+IG0udmVyc2lvbiA+IHZlcnNpb24pO1xyXG4gIGlmIChwZW5kaW5nLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xyXG5cclxuICBpZiAoZXhpc3RlZCAmJiB2ZXJzaW9uID4gMCkge1xyXG4gICAgY29uc3QgYmFja3VwRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICdiYWNrdXBzJyk7XHJcbiAgICBmcy5ta2RpclN5bmMoYmFja3VwRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICAgIGNvbnN0IHN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKTtcclxuICAgIGZzLmNvcHlGaWxlU3luYyhkYlBhdGgsIHBhdGguam9pbihiYWNrdXBEaXIsIGBwcmUtbWlncmF0aW9uLXYke3ZlcnNpb259LSR7c3RhbXB9LmRiYCkpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcnVuID0gZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgZm9yIChjb25zdCBtIG9mIHBlbmRpbmcpIHtcclxuICAgICAgZGIuZXhlYyhtLnNxbCk7XHJcbiAgICAgIGRiLnByZXBhcmUoXHJcbiAgICAgICAgXCJJTlNFUlQgSU5UTyBtZXRhKGtleSx2YWx1ZSkgVkFMVUVTKCdzY2hlbWFfdmVyc2lvbicsPykgXCIgK1xyXG4gICAgICAgICAgXCJPTiBDT05GTElDVChrZXkpIERPIFVQREFURSBTRVQgdmFsdWU9ZXhjbHVkZWQudmFsdWVcIixcclxuICAgICAgKS5ydW4oU3RyaW5nKG0udmVyc2lvbikpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJ1bigpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBlbnN1cmVNZXRhKGRiOiBEQiwga2V5OiBzdHJpbmcsIG1ha2U6ICgpID0+IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgY29uc3Qgcm93ID0gZGIucHJlcGFyZSgnU0VMRUNUIHZhbHVlIEZST00gbWV0YSBXSEVSRSBrZXk9PycpLmdldChrZXkpIGFzXHJcbiAgICB8IHsgdmFsdWU6IHN0cmluZyB9XHJcbiAgICB8IHVuZGVmaW5lZDtcclxuICBpZiAocm93KSByZXR1cm4gcm93LnZhbHVlO1xyXG4gIGNvbnN0IHZhbHVlID0gbWFrZSgpO1xyXG4gIGRiLnByZXBhcmUoJ0lOU0VSVCBJTlRPIG1ldGEoa2V5LHZhbHVlKSBWQUxVRVMoPyw/KScpLnJ1bihrZXksIHZhbHVlKTtcclxuICByZXR1cm4gdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXRhKGRiOiBEQiwga2V5OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcclxuICBjb25zdCByb3cgPSBkYi5wcmVwYXJlKCdTRUxFQ1QgdmFsdWUgRlJPTSBtZXRhIFdIRVJFIGtleT0/JykuZ2V0KGtleSkgYXNcclxuICAgIHwgeyB2YWx1ZTogc3RyaW5nIH1cclxuICAgIHwgdW5kZWZpbmVkO1xyXG4gIHJldHVybiByb3cgPyByb3cudmFsdWUgOiBudWxsO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0TWV0YShkYjogREIsIGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgZGIucHJlcGFyZShcclxuICAgICdJTlNFUlQgSU5UTyBtZXRhKGtleSx2YWx1ZSkgVkFMVUVTKD8sPykgT04gQ09ORkxJQ1Qoa2V5KSBETyBVUERBVEUgU0VUIHZhbHVlPWV4Y2x1ZGVkLnZhbHVlJyxcclxuICApLnJ1bihrZXksIHZhbHVlKTtcclxufVxyXG5cclxuLyoqIE1hbnVhbCBiYWNrdXA6IGNvbnNpc3RlbnQgc25hcHNob3QgdmlhIFNRTGl0ZSBiYWNrdXAgQVBJLiBSZXR1cm5zIGJhY2t1cCBwYXRoLiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYmFja3VwRGF0YWJhc2UoY3R4OiBEYkNvbnRleHQpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGNvbnN0IGJhY2t1cERpciA9IHBhdGguam9pbihjdHguZGF0YURpciwgJ2JhY2t1cHMnKTtcclxuICBmcy5ta2RpclN5bmMoYmFja3VwRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICBjb25zdCBzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyk7XHJcbiAgY29uc3QgZGVzdCA9IHBhdGguam9pbihiYWNrdXBEaXIsIGB0ZXRoZXItJHtzdGFtcH0uZGJgKTtcclxuICBhd2FpdCBjdHguZGIuYmFja3VwKGRlc3QpO1xyXG4gIHJldHVybiBkZXN0O1xyXG59XHJcbiIsICIvLyBWZXJzaW9uZWQgc2NoZW1hIG1pZ3JhdGlvbnMuIE5ldmVyIGVkaXQgYSBzaGlwcGVkIG1pZ3JhdGlvbiBcdTIwMTQgYXBwZW5kIGEgbmV3IG9uZS5cclxuLy8gUnVubmVyOiBkYi50cyBhcHBseU1pZ3JhdGlvbnMoKS4gRWFjaCBtaWdyYXRpb24gcnVucyBpbiBhIHRyYW5zYWN0aW9uLlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNaWdyYXRpb24ge1xyXG4gIHZlcnNpb246IG51bWJlcjtcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgc3FsOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBNSUdSQVRJT05TOiBNaWdyYXRpb25bXSA9IFtcclxuICB7XHJcbiAgICB2ZXJzaW9uOiAxLFxyXG4gICAgbmFtZTogJ2NvcmUtc2NoZW1hJyxcclxuICAgIHNxbDogYFxyXG5DUkVBVEUgVEFCTEUgbWV0YSAoXHJcbiAga2V5IFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgdmFsdWUgVEVYVCBOT1QgTlVMTFxyXG4pO1xyXG5cclxuQ1JFQVRFIFRBQkxFIHVzZXJzIChcclxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIG5hbWUgVEVYVCBOT1QgTlVMTCxcclxuICBpbml0aWFscyBURVhUIE5PVCBOVUxMLFxyXG4gIGNvbG9yIFRFWFQgTk9UIE5VTEwsXHJcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMXHJcbik7XHJcblxyXG5DUkVBVEUgVEFCTEUgaXRlbXMgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgaWRlbnQgVEVYVCBOT1QgTlVMTCBVTklRVUUsXHJcbiAgdHlwZSBURVhUIE5PVCBOVUxMLFxyXG4gIHRpdGxlIFRFWFQgTk9UIE5VTEwsXHJcbiAgYm9keSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXHJcbiAgYm9keV90ZXh0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcclxuICBzdGF0dXMgVEVYVCBOT1QgTlVMTCxcclxuICBwcmlvcml0eSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ25vbmUnLFxyXG4gIG93bmVyX2lkIFRFWFQsXHJcbiAgcmVwb3J0ZXJfaWQgVEVYVCxcclxuICBtaWxlc3RvbmVfaWQgVEVYVCxcclxuICByZWxlYXNlX2lkIFRFWFQsXHJcbiAgcGFyZW50X2lkIFRFWFQsXHJcbiAgc3RhcnRfZGF0ZSBURVhULFxyXG4gIGR1ZV9kYXRlIFRFWFQsXHJcbiAgY29tcGxldGVkX2F0IFRFWFQsXHJcbiAgZWZmb3J0IFJFQUwsXHJcbiAgY29uZmlkZW5jZSBURVhULFxyXG4gIHJpc2tfbGV2ZWwgVEVYVCxcclxuICBidXNpbmVzc192YWx1ZSBURVhULFxyXG4gIGxlYWRlcnNoaXBfdmlzaWJsZSBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcclxuICBwcm9ncmVzcyBJTlRFR0VSLFxyXG4gIHRhZ3MgVEVYVCBOT1QgTlVMTCBERUZBVUxUICdbXScsXHJcbiAgZXh0cmEgVEVYVCBOT1QgTlVMTCBERUZBVUxUICd7fScsXHJcbiAgYXJjaGl2ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXHJcbiAgc2FtcGxlIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxyXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXHJcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxyXG4gIHVwZGF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcclxuICBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTEwsXHJcbiAgdXBkYXRlZF9ieSBURVhUIE5PVCBOVUxMXHJcbik7XHJcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfdHlwZSBPTiBpdGVtcyh0eXBlKSBXSEVSRSBkZWxldGVkID0gMDtcclxuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19zdGF0dXMgT04gaXRlbXMoc3RhdHVzKSBXSEVSRSBkZWxldGVkID0gMDtcclxuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19vd25lciBPTiBpdGVtcyhvd25lcl9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfbWlsZXN0b25lIE9OIGl0ZW1zKG1pbGVzdG9uZV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfcmVsZWFzZSBPTiBpdGVtcyhyZWxlYXNlX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcclxuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19wYXJlbnQgT04gaXRlbXMocGFyZW50X2lkKSBXSEVSRSBkZWxldGVkID0gMDtcclxuQ1JFQVRFIElOREVYIGlkeF9pdGVtc191cGRhdGVkIE9OIGl0ZW1zKHVwZGF0ZWRfYXQpO1xyXG5cclxuQ1JFQVRFIFRBQkxFIGlkZW50X2NvdW50ZXJzIChcclxuICB0eXBlIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgbmV4dCBJTlRFR0VSIE5PVCBOVUxMXHJcbik7XHJcblxyXG5DUkVBVEUgVEFCTEUgbGlua3MgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgZnJvbV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIHRvX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAga2luZCBURVhUIE5PVCBOVUxMLFxyXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXHJcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxyXG4gIGNyZWF0ZWRfYnkgVEVYVCBOT1QgTlVMTFxyXG4pO1xyXG5DUkVBVEUgSU5ERVggaWR4X2xpbmtzX2Zyb20gT04gbGlua3MoZnJvbV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcbkNSRUFURSBJTkRFWCBpZHhfbGlua3NfdG8gT04gbGlua3ModG9faWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xyXG5DUkVBVEUgVU5JUVVFIElOREVYIGlkeF9saW5rc191bmlxIE9OIGxpbmtzKGZyb21faWQsIHRvX2lkLCBraW5kKTtcclxuXHJcbkNSRUFURSBUQUJMRSBjb21tZW50cyAoXHJcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBpdGVtX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgYXV0aG9yX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgYm9keSBURVhUIE5PVCBOVUxMLFxyXG4gIGJvZHlfdGV4dCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXHJcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxyXG4gIHVwZGF0ZWRfYXQgVEVYVCxcclxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwXHJcbik7XHJcbkNSRUFURSBJTkRFWCBpZHhfY29tbWVudHNfaXRlbSBPTiBjb21tZW50cyhpdGVtX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcclxuXHJcbkNSRUFURSBUQUJMRSBhdHRhY2htZW50cyAoXHJcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBpdGVtX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgZmlsZW5hbWUgVEVYVCBOT1QgTlVMTCxcclxuICBtaW1lIFRFWFQgTk9UIE5VTEwsXHJcbiAgc2l6ZSBJTlRFR0VSIE5PVCBOVUxMLFxyXG4gIHNoYTI1NiBURVhUIE5PVCBOVUxMLFxyXG4gIGRlc2NyaXB0aW9uIFRFWFQsXHJcbiAgdXBsb2FkZWRfYnkgVEVYVCBOT1QgTlVMTCxcclxuICBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXHJcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMFxyXG4pO1xyXG5DUkVBVEUgSU5ERVggaWR4X2F0dGFjaG1lbnRzX2l0ZW0gT04gYXR0YWNobWVudHMoaXRlbV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XHJcblxyXG5DUkVBVEUgVEFCTEUgYWN0aXZpdHkgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgaXRlbV9pZCBURVhULFxyXG4gIGFjdG9yX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAga2luZCBURVhUIE5PVCBOVUxMLFxyXG4gIGZpZWxkIFRFWFQsXHJcbiAgb2xkX3ZhbHVlIFRFWFQsXHJcbiAgbmV3X3ZhbHVlIFRFWFQsXHJcbiAgYXQgVEVYVCBOT1QgTlVMTFxyXG4pO1xyXG5DUkVBVEUgSU5ERVggaWR4X2FjdGl2aXR5X2l0ZW0gT04gYWN0aXZpdHkoaXRlbV9pZCk7XHJcbkNSRUFURSBJTkRFWCBpZHhfYWN0aXZpdHlfYXQgT04gYWN0aXZpdHkoYXQpO1xyXG5cclxuQ1JFQVRFIFRBQkxFIGl0ZW1fdmVyc2lvbnMgKFxyXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXHJcbiAgaXRlbV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIHZlcnNpb24gSU5URUdFUiBOT1QgTlVMTCxcclxuICB0aXRsZSBURVhUIE5PVCBOVUxMLFxyXG4gIGJvZHkgVEVYVCBOT1QgTlVMTCxcclxuICBzYXZlZF9ieSBURVhUIE5PVCBOVUxMLFxyXG4gIHNhdmVkX2F0IFRFWFQgTk9UIE5VTExcclxuKTtcclxuQ1JFQVRFIElOREVYIGlkeF92ZXJzaW9uc19pdGVtIE9OIGl0ZW1fdmVyc2lvbnMoaXRlbV9pZCwgdmVyc2lvbik7XHJcblxyXG5DUkVBVEUgVEFCTEUgbWlsZXN0b25lcyAoXHJcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXHJcbiAgZGVzY3JpcHRpb24gVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxyXG4gIHRhcmdldF9kYXRlIFRFWFQsXHJcbiAgc3RhdHVzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAncGxhbm5lZCcsXHJcbiAgc29ydCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcclxuICBzYW1wbGUgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXHJcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMFxyXG4pO1xyXG5cclxuQ1JFQVRFIFRBQkxFIHJlbGVhc2VzIChcclxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIG5hbWUgVEVYVCBOT1QgTlVMTCxcclxuICB2ZXJzaW9uIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcclxuICB0YXJnZXRfZGF0ZSBURVhULFxyXG4gIHN0YXR1cyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ3BsYW5uZWQnLFxyXG4gIGdvYWxzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcclxuICBub3RlcyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXHJcbiAgc2FtcGxlIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxyXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcclxuKTtcclxuXHJcbkNSRUFURSBUQUJMRSBzYXZlZF92aWV3cyAoXHJcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcclxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXHJcbiAgY29uZmlnIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAne30nLFxyXG4gIHBpbm5lZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcclxuICBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTEwsXHJcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxyXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcclxuKTtcclxuXHJcbi0tIEFwcGVuZC1vbmx5IG9wZXJhdGlvbiBsb2cuIFNvdXJjZSBmb3Igc3luYyBleHBvcnQ7IHBlZXJzJyBvcHMgcmVjb3JkZWQgd2l0aCBvcmlnaW4gZGV2aWNlLlxyXG5DUkVBVEUgVEFCTEUgb3Bsb2cgKFxyXG4gIHNlcSBJTlRFR0VSIFBSSU1BUlkgS0VZIEFVVE9JTkNSRU1FTlQsXHJcbiAgb3BfaWQgVEVYVCBOT1QgTlVMTCBVTklRVUUsXHJcbiAgZGV2aWNlX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgYWN0b3JfaWQgVEVYVCBOT1QgTlVMTCxcclxuICBsYW1wb3J0IElOVEVHRVIgTk9UIE5VTEwsXHJcbiAgYXQgVEVYVCBOT1QgTlVMTCxcclxuICBlbnRpdHkgVEVYVCBOT1QgTlVMTCxcclxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcclxuICBhY3Rpb24gVEVYVCBOT1QgTlVMTCxcclxuICBwYXlsb2FkIFRFWFQgTk9UIE5VTExcclxuKTtcclxuQ1JFQVRFIElOREVYIGlkeF9vcGxvZ19lbnRpdHkgT04gb3Bsb2coZW50aXR5LCBlbnRpdHlfaWQpO1xyXG5DUkVBVEUgSU5ERVggaWR4X29wbG9nX2RldmljZSBPTiBvcGxvZyhkZXZpY2VfaWQsIHNlcSk7XHJcblxyXG4tLSBGaWVsZC1sZXZlbCB3cml0ZSByZWdpc3RyeSBmb3IgTFdXIG1lcmdlOiBsYXN0IChsYW1wb3J0LCBkZXZpY2UpIHRoYXQgd3JvdGUgZWFjaCBmaWVsZC5cclxuQ1JFQVRFIFRBQkxFIGZpZWxkX2Nsb2NrIChcclxuICBlbnRpdHkgVEVYVCBOT1QgTlVMTCxcclxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcclxuICBmaWVsZCBURVhUIE5PVCBOVUxMLFxyXG4gIGxhbXBvcnQgSU5URUdFUiBOT1QgTlVMTCxcclxuICBkZXZpY2VfaWQgVEVYVCBOT1QgTlVMTCxcclxuICBQUklNQVJZIEtFWSAoZW50aXR5LCBlbnRpdHlfaWQsIGZpZWxkKVxyXG4pO1xyXG5cclxuQ1JFQVRFIFRBQkxFIHN5bmNfY29uZmxpY3RzIChcclxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIGVudGl0eSBURVhUIE5PVCBOVUxMLFxyXG4gIGVudGl0eV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGZpZWxkIFRFWFQgTk9UIE5VTEwsXHJcbiAgbG9jYWxfdmFsdWUgVEVYVCBOT1QgTlVMTCxcclxuICByZW1vdGVfdmFsdWUgVEVYVCBOT1QgTlVMTCxcclxuICByZW1vdGVfZGV2aWNlIFRFWFQgTk9UIE5VTEwsXHJcbiAgcmVtb3RlX2FjdG9yIFRFWFQgTk9UIE5VTEwsXHJcbiAgZGV0ZWN0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcclxuICByZXNvbHZlZF9hdCBURVhULFxyXG4gIHJlc29sdXRpb24gVEVYVFxyXG4pO1xyXG5cclxuLS0gUGVyLXBlZXIgaW1wb3J0IHByb2dyZXNzOiBoaWdoZXN0IGZpbGUgc2VxdWVuY2UgY29uc3VtZWQgcGVyIGRldmljZS5cclxuQ1JFQVRFIFRBQkxFIHN5bmNfcGVlcnMgKFxyXG4gIGRldmljZV9pZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIHVzZXJfbmFtZSBURVhULFxyXG4gIGxhc3RfZmlsZSBURVhULFxyXG4gIGxhc3Rfc2Vlbl9hdCBURVhUXHJcbik7XHJcblxyXG5DUkVBVEUgVklSVFVBTCBUQUJMRSBpdGVtc19mdHMgVVNJTkcgZnRzNShcclxuICBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncyxcclxuICBjb250ZW50PSdpdGVtcycsIGNvbnRlbnRfcm93aWQ9J3Jvd2lkJyxcclxuICB0b2tlbml6ZT0ndW5pY29kZTYxJ1xyXG4pO1xyXG5cclxuQ1JFQVRFIFRSSUdHRVIgaXRlbXNfZnRzX2FpIEFGVEVSIElOU0VSVCBPTiBpdGVtcyBCRUdJTlxyXG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhyb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXHJcbiAgVkFMVUVTIChuZXcucm93aWQsIG5ldy5pZGVudCwgbmV3LnRpdGxlLCBuZXcuYm9keV90ZXh0LCBuZXcudGFncyk7XHJcbkVORDtcclxuQ1JFQVRFIFRSSUdHRVIgaXRlbXNfZnRzX2FkIEFGVEVSIERFTEVURSBPTiBpdGVtcyBCRUdJTlxyXG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhpdGVtc19mdHMsIHJvd2lkLCBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncylcclxuICBWQUxVRVMgKCdkZWxldGUnLCBvbGQucm93aWQsIG9sZC5pZGVudCwgb2xkLnRpdGxlLCBvbGQuYm9keV90ZXh0LCBvbGQudGFncyk7XHJcbkVORDtcclxuQ1JFQVRFIFRSSUdHRVIgaXRlbXNfZnRzX2F1IEFGVEVSIFVQREFURSBPTiBpdGVtcyBCRUdJTlxyXG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhpdGVtc19mdHMsIHJvd2lkLCBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncylcclxuICBWQUxVRVMgKCdkZWxldGUnLCBvbGQucm93aWQsIG9sZC5pZGVudCwgb2xkLnRpdGxlLCBvbGQuYm9keV90ZXh0LCBvbGQudGFncyk7XHJcbiAgSU5TRVJUIElOVE8gaXRlbXNfZnRzKHJvd2lkLCBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncylcclxuICBWQUxVRVMgKG5ldy5yb3dpZCwgbmV3LmlkZW50LCBuZXcudGl0bGUsIG5ldy5ib2R5X3RleHQsIG5ldy50YWdzKTtcclxuRU5EO1xyXG5gLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgdmVyc2lvbjogMixcclxuICAgIG5hbWU6ICdwZW5kaW5nLW9wcy1idWZmZXInLFxyXG4gICAgc3FsOiBgXHJcbi0tIE9wcyB0aGF0IGFycml2ZWQgYmVmb3JlIHRoZSBjcmVhdGUgb2YgdGhlaXIgdGFyZ2V0IGVudGl0eSAocG9zc2libGUgd2l0aCAzK1xyXG4tLSBkZXZpY2VzLCBzaW5jZSBvcmRlcmluZyBpcyBvbmx5IGd1YXJhbnRlZWQgcGVyIGRldmljZSkuIEJ1ZmZlcmVkIGhlcmUgYW5kXHJcbi0tIHJlcGxheWVkIG9uY2UgdGhlIGNyZWF0ZSBsYW5kcy5cclxuQ1JFQVRFIFRBQkxFIHBlbmRpbmdfb3BzIChcclxuICBvcF9pZCBURVhUIFBSSU1BUlkgS0VZLFxyXG4gIGRldmljZV9pZCBURVhUIE5PVCBOVUxMLFxyXG4gIGFjdG9yX2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgbGFtcG9ydCBJTlRFR0VSIE5PVCBOVUxMLFxyXG4gIGF0IFRFWFQgTk9UIE5VTEwsXHJcbiAgZW50aXR5IFRFWFQgTk9UIE5VTEwsXHJcbiAgZW50aXR5X2lkIFRFWFQgTk9UIE5VTEwsXHJcbiAgYWN0aW9uIFRFWFQgTk9UIE5VTEwsXHJcbiAgcGF5bG9hZCBURVhUIE5PVCBOVUxMXHJcbik7XHJcbkNSRUFURSBJTkRFWCBpZHhfcGVuZGluZ19lbnRpdHkgT04gcGVuZGluZ19vcHMoZW50aXR5LCBlbnRpdHlfaWQpO1xyXG5gLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgdmVyc2lvbjogMyxcclxuICAgIG5hbWU6ICdmdWxsLWF1ZGl0YWJpbGl0eScsXHJcbiAgICBzcWw6IGBcclxuLS0gRXZlcnkgdXNlci1kYXRhIHRhYmxlIGdldHMgY3JlYXRlZC91cGRhdGVkIGF0dHJpYnV0aW9uIGFuZCBzb2Z0LWRlbGV0ZVxyXG4tLSBhdHRyaWJ1dGlvbiBzbyBcIndobyBjcmVhdGVkL2NoYW5nZWQvZGVsZXRlZCB0aGlzLCBhbmQgd2hlblwiIGlzIGFsd2F5cyBhbnN3ZXJhYmxlXHJcbi0tIGZyb20gdGhlIHNjaGVtYSwgbm90IGp1c3QgdGhlIG9wIGxvZy5cclxuXHJcbi0tIE1pbGVzdG9uZXMgKyByZWxlYXNlcyBoYWQgbm8gYXVkaXQgY29sdW1ucyBhdCBhbGwuXHJcbkFMVEVSIFRBQkxFIG1pbGVzdG9uZXMgQUREIENPTFVNTiBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuQUxURVIgVEFCTEUgbWlsZXN0b25lcyBBREQgQ09MVU1OIGNyZWF0ZWRfYnkgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnO1xyXG5BTFRFUiBUQUJMRSBtaWxlc3RvbmVzIEFERCBDT0xVTU4gdXBkYXRlZF9hdCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJyc7XHJcbkFMVEVSIFRBQkxFIG1pbGVzdG9uZXMgQUREIENPTFVNTiB1cGRhdGVkX2J5IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuQUxURVIgVEFCTEUgcmVsZWFzZXMgQUREIENPTFVNTiBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuQUxURVIgVEFCTEUgcmVsZWFzZXMgQUREIENPTFVNTiBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuQUxURVIgVEFCTEUgcmVsZWFzZXMgQUREIENPTFVNTiB1cGRhdGVkX2F0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuQUxURVIgVEFCTEUgcmVsZWFzZXMgQUREIENPTFVNTiB1cGRhdGVkX2J5IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcclxuXHJcbi0tIENvbW1lbnQgZWRpdHMvZGVsZXRlcyB3ZXJlIHVuYXR0cmlidXRlZC5cclxuQUxURVIgVEFCTEUgY29tbWVudHMgQUREIENPTFVNTiB1cGRhdGVkX2J5IFRFWFQ7XHJcbkFMVEVSIFRBQkxFIGNvbW1lbnRzIEFERCBDT0xVTU4gZGVsZXRlZF9hdCBURVhUO1xyXG5BTFRFUiBUQUJMRSBjb21tZW50cyBBREQgQ09MVU1OIGRlbGV0ZWRfYnkgVEVYVDtcclxuXHJcbi0tIEF0dGFjaG1lbnQgcmVtb3ZhbCB3YXMgdW5hdHRyaWJ1dGVkLlxyXG5BTFRFUiBUQUJMRSBhdHRhY2htZW50cyBBREQgQ09MVU1OIGRlbGV0ZWRfYXQgVEVYVDtcclxuQUxURVIgVEFCTEUgYXR0YWNobWVudHMgQUREIENPTFVNTiBkZWxldGVkX2J5IFRFWFQ7XHJcblxyXG4tLSBMaW5rIHJlbW92YWwgYXR0cmlidXRpb24gb24gdGhlIHJvdyAobm90IG9ubHkgaW4gdGhlIGFjdGl2aXR5IGZlZWQpLlxyXG5BTFRFUiBUQUJMRSBsaW5rcyBBREQgQ09MVU1OIGRlbGV0ZWRfYXQgVEVYVDtcclxuQUxURVIgVEFCTEUgbGlua3MgQUREIENPTFVNTiBkZWxldGVkX2J5IFRFWFQ7XHJcblxyXG4tLSBTYXZlZCB2aWV3IC8gaXRlbSBkZWxldGUgYXR0cmlidXRpb24gb24gdGhlIHJvdy5cclxuQUxURVIgVEFCTEUgc2F2ZWRfdmlld3MgQUREIENPTFVNTiB1cGRhdGVkX2F0IFRFWFQ7XHJcbkFMVEVSIFRBQkxFIHNhdmVkX3ZpZXdzIEFERCBDT0xVTU4gdXBkYXRlZF9ieSBURVhUO1xyXG5BTFRFUiBUQUJMRSBzYXZlZF92aWV3cyBBREQgQ09MVU1OIGRlbGV0ZWRfYXQgVEVYVDtcclxuQUxURVIgVEFCTEUgc2F2ZWRfdmlld3MgQUREIENPTFVNTiBkZWxldGVkX2J5IFRFWFQ7XHJcbkFMVEVSIFRBQkxFIGl0ZW1zIEFERCBDT0xVTU4gZGVsZXRlZF9hdCBURVhUO1xyXG5BTFRFUiBUQUJMRSBpdGVtcyBBREQgQ09MVU1OIGRlbGV0ZWRfYnkgVEVYVDtcclxuXHJcbi0tIFdobyByZXNvbHZlZCBhIHN5bmMgY29uZmxpY3QuXHJcbkFMVEVSIFRBQkxFIHN5bmNfY29uZmxpY3RzIEFERCBDT0xVTU4gcmVzb2x2ZWRfYnkgVEVYVDtcclxuXHJcbi0tIEJhY2tmaWxsIGV4aXN0aW5nIG1pbGVzdG9uZS9yZWxlYXNlIHJvd3Mgc28gYXVkaXQgdGltZXN0YW1wcyBhcmUgbmV2ZXIgYmxhbmsuXHJcblVQREFURSBtaWxlc3RvbmVzIFNFVCBjcmVhdGVkX2F0ID0gZGF0ZXRpbWUoJ25vdycpLCB1cGRhdGVkX2F0ID0gZGF0ZXRpbWUoJ25vdycpIFdIRVJFIGNyZWF0ZWRfYXQgPSAnJztcclxuVVBEQVRFIHJlbGVhc2VzIFNFVCBjcmVhdGVkX2F0ID0gZGF0ZXRpbWUoJ25vdycpLCB1cGRhdGVkX2F0ID0gZGF0ZXRpbWUoJ25vdycpIFdIRVJFIGNyZWF0ZWRfYXQgPSAnJztcclxuYCxcclxuICB9LFxyXG4gIHtcclxuICAgIHZlcnNpb246IDQsXHJcbiAgICBuYW1lOiAndXNlci1hdmF0YXInLFxyXG4gICAgc3FsOiBgQUxURVIgVEFCTEUgdXNlcnMgQUREIENPTFVNTiBhdmF0YXIgVEVYVDtgLFxyXG4gIH0sXHJcbl07XHJcbiIsICIvLyBTdG9yZTogdGhlIHNpbmdsZSB3cml0ZSBwYXRoLiBFdmVyeSBtdXRhdGlvbiAobG9jYWwgb3IgcmVtb3RlKSBmbG93cyB0aHJvdWdoIGhlcmUgc29cclxuLy8gU1FMaXRlIHN0YXRlLCB0aGUgb3Bsb2csIGZpZWxkIGNsb2NrcywgYWN0aXZpdHkgaGlzdG9yeSwgYW5kIEZUUyBzdGF5IGNvbnNpc3RlbnQuXHJcbi8vXHJcbi8vIFN5bmMgbW9kZWwgKHNlZSBkb2NzL1NZTkNfQVJDSElURUNUVVJFLm1kKTpcclxuLy8gLSBMb2NhbCBtdXRhdGlvbnMgYXBwZW5kIGZpZWxkLWdyYW51bGFyIG9wcyB0byBvcGxvZyAobGFtcG9ydCBjbG9jayArIGRldmljZSBpZCkuXHJcbi8vIC0gJ3NldCcgb3BzIGNhcnJ5IGJhc2VkT24gPSB0aGUgKGxhbXBvcnQsZGV2aWNlKSBlYWNoIGZpZWxkIGhhZCB3aGVuIHdyaXR0ZW4sXHJcbi8vICAgbGV0dGluZyB0aGUgaW1wb3J0ZXIgZGlzdGluZ3Vpc2ggY2xlYW4gY2F1c2FsIHVwZGF0ZXMgZnJvbSB0cnVlIGNvbmN1cnJlbnQgZWRpdHMuXHJcbi8vIC0gQ29uY3VycmVudCBlZGl0cyByZXNvbHZlIGJ5IExXVyAobGFtcG9ydCwgZGV2aWNlSWQgdGllYnJlYWspLiBGb3IgY29udGVudCBmaWVsZHNcclxuLy8gICAodGl0bGUsIGJvZHkpIHRoZSBsb3NpbmcgdmFsdWUgaXMgcHJlc2VydmVkIGluIHN5bmNfY29uZmxpY3RzIGZvciBtYW51YWwgcmV2aWV3LlxyXG5cclxuaW1wb3J0IGNyeXB0byBmcm9tICdub2RlOmNyeXB0byc7XHJcbmltcG9ydCB0eXBlIHsgREIsIERiQ29udGV4dCB9IGZyb20gJy4vZGInO1xyXG5pbXBvcnQgeyBnZXRNZXRhLCBzZXRNZXRhIH0gZnJvbSAnLi9kYic7XHJcbmltcG9ydCB0eXBlIHtcclxuICBJdGVtRmlsdGVyLFxyXG4gIEl0ZW1Tb3J0LFxyXG4gIEl0ZW1UeXBlLFxyXG4gIE9wLFxyXG4gIFdvcmtJdGVtLFxyXG4gIEl0ZW1MaW5rLFxyXG4gIENvbW1lbnQsXHJcbiAgTWlsZXN0b25lLFxyXG4gIFJlbGVhc2UsXHJcbiAgU2F2ZWRWaWV3LFxyXG4gIFVzZXIsXHJcbiAgTGlua0tpbmQsXHJcbiAgU2VhcmNoUmVzdWx0LFxyXG4gIFN5bmNDb25mbGljdCxcclxufSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xyXG5pbXBvcnQgeyBJREVOVF9QUkVGSVgsIHN0YXR1c2VzRm9yVHlwZSwgVEVSTUlOQUxfU1RBVFVTRVMgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xyXG5pbXBvcnQgeyBkb2NUb1RleHQgfSBmcm9tICcuLi8uLi9zaGFyZWQvZG9jJztcclxuXHJcbmNvbnN0IENPTkZMSUNUX1NVUkZBQ0VEX0ZJRUxEUyA9IG5ldyBTZXQoWyd0aXRsZScsICdib2R5J10pO1xyXG5cclxuLy8gY2FtZWxDYXNlIGZpZWxkIC0+IGl0ZW1zIGNvbHVtblxyXG5jb25zdCBJVEVNX0NPTFM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgaWRlbnQ6ICdpZGVudCcsXHJcbiAgdHlwZTogJ3R5cGUnLFxyXG4gIHRpdGxlOiAndGl0bGUnLFxyXG4gIGJvZHk6ICdib2R5JyxcclxuICBib2R5VGV4dDogJ2JvZHlfdGV4dCcsXHJcbiAgc3RhdHVzOiAnc3RhdHVzJyxcclxuICBwcmlvcml0eTogJ3ByaW9yaXR5JyxcclxuICBvd25lcklkOiAnb3duZXJfaWQnLFxyXG4gIHJlcG9ydGVySWQ6ICdyZXBvcnRlcl9pZCcsXHJcbiAgbWlsZXN0b25lSWQ6ICdtaWxlc3RvbmVfaWQnLFxyXG4gIHJlbGVhc2VJZDogJ3JlbGVhc2VfaWQnLFxyXG4gIHBhcmVudElkOiAncGFyZW50X2lkJyxcclxuICBzdGFydERhdGU6ICdzdGFydF9kYXRlJyxcclxuICBkdWVEYXRlOiAnZHVlX2RhdGUnLFxyXG4gIGNvbXBsZXRlZEF0OiAnY29tcGxldGVkX2F0JyxcclxuICBlZmZvcnQ6ICdlZmZvcnQnLFxyXG4gIGNvbmZpZGVuY2U6ICdjb25maWRlbmNlJyxcclxuICByaXNrTGV2ZWw6ICdyaXNrX2xldmVsJyxcclxuICBidXNpbmVzc1ZhbHVlOiAnYnVzaW5lc3NfdmFsdWUnLFxyXG4gIGxlYWRlcnNoaXBWaXNpYmxlOiAnbGVhZGVyc2hpcF92aXNpYmxlJyxcclxuICBwcm9ncmVzczogJ3Byb2dyZXNzJyxcclxuICB0YWdzOiAndGFncycsXHJcbiAgZXh0cmE6ICdleHRyYScsXHJcbiAgYXJjaGl2ZWQ6ICdhcmNoaXZlZCcsXHJcbiAgc2FtcGxlOiAnc2FtcGxlJyxcclxuICBkZWxldGVkOiAnZGVsZXRlZCcsXHJcbiAgdXBkYXRlZEF0OiAndXBkYXRlZF9hdCcsXHJcbiAgdXBkYXRlZEJ5OiAndXBkYXRlZF9ieScsXHJcbn07XHJcblxyXG5jb25zdCBKU09OX0lURU1fRklFTERTID0gbmV3IFNldChbJ3RhZ3MnLCAnZXh0cmEnXSk7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN0b3JlRXZlbnRzIHtcclxuICBvbkNoYW5nZTogKHdoYXQ6IHsgZW50aXR5OiBzdHJpbmc7IGVudGl0eUlkOiBzdHJpbmcgfSkgPT4gdm9pZDtcclxuICBvbkNvbmZsaWN0OiAoY29uZmxpY3Q6IFN5bmNDb25mbGljdCkgPT4gdm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN0b3JlIHtcclxuICByZWFkb25seSBkYjogREI7XHJcbiAgcmVhZG9ubHkgZGV2aWNlSWQ6IHN0cmluZztcclxuICBhY3RvcklkOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSBldmVudHM6IFN0b3JlRXZlbnRzO1xyXG5cclxuICBjb25zdHJ1Y3RvcihjdHg6IERiQ29udGV4dCwgYWN0b3JJZDogc3RyaW5nLCBldmVudHM/OiBQYXJ0aWFsPFN0b3JlRXZlbnRzPikge1xyXG4gICAgdGhpcy5kYiA9IGN0eC5kYjtcclxuICAgIHRoaXMuZGV2aWNlSWQgPSBjdHguZGV2aWNlSWQ7XHJcbiAgICB0aGlzLmFjdG9ySWQgPSBhY3RvcklkO1xyXG4gICAgdGhpcy5ldmVudHMgPSB7XHJcbiAgICAgIG9uQ2hhbmdlOiBldmVudHM/Lm9uQ2hhbmdlID8/ICgoKSA9PiB7fSksXHJcbiAgICAgIG9uQ29uZmxpY3Q6IGV2ZW50cz8ub25Db25mbGljdCA/PyAoKCkgPT4ge30pLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gY2xvY2tzIC0tLS0tLS0tLS1cclxuICBwcml2YXRlIHRpY2tMYW1wb3J0KCk6IG51bWJlciB7XHJcbiAgICBjb25zdCBjdXIgPSBOdW1iZXIoZ2V0TWV0YSh0aGlzLmRiLCAnbGFtcG9ydCcpID8/ICcwJykgKyAxO1xyXG4gICAgc2V0TWV0YSh0aGlzLmRiLCAnbGFtcG9ydCcsIFN0cmluZyhjdXIpKTtcclxuICAgIHJldHVybiBjdXI7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHdpdG5lc3NMYW1wb3J0KHJlbW90ZTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBjb25zdCBjdXIgPSBOdW1iZXIoZ2V0TWV0YSh0aGlzLmRiLCAnbGFtcG9ydCcpID8/ICcwJyk7XHJcbiAgICBpZiAocmVtb3RlID4gY3VyKSBzZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JywgU3RyaW5nKHJlbW90ZSkpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBub3coKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZpZWxkQ2xvY2soZW50aXR5OiBzdHJpbmcsIGVudGl0eUlkOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcpOiB7IGxhbXBvcnQ6IG51bWJlcjsgZGV2aWNlSWQ6IHN0cmluZyB9IHwgbnVsbCB7XHJcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgbGFtcG9ydCwgZGV2aWNlX2lkIEZST00gZmllbGRfY2xvY2sgV0hFUkUgZW50aXR5PT8gQU5EIGVudGl0eV9pZD0/IEFORCBmaWVsZD0/JylcclxuICAgICAgLmdldChlbnRpdHksIGVudGl0eUlkLCBmaWVsZCkgYXMgeyBsYW1wb3J0OiBudW1iZXI7IGRldmljZV9pZDogc3RyaW5nIH0gfCB1bmRlZmluZWQ7XHJcbiAgICByZXR1cm4gcm93ID8geyBsYW1wb3J0OiByb3cubGFtcG9ydCwgZGV2aWNlSWQ6IHJvdy5kZXZpY2VfaWQgfSA6IG51bGw7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldEZpZWxkQ2xvY2soZW50aXR5OiBzdHJpbmcsIGVudGl0eUlkOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIGxhbXBvcnQ6IG51bWJlciwgZGV2aWNlSWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZShcclxuICAgICAgICBgSU5TRVJUIElOVE8gZmllbGRfY2xvY2soZW50aXR5LCBlbnRpdHlfaWQsIGZpZWxkLCBsYW1wb3J0LCBkZXZpY2VfaWQpIFZBTFVFUyg/LD8sPyw/LD8pXHJcbiAgICAgICAgIE9OIENPTkZMSUNUKGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZCkgRE8gVVBEQVRFIFNFVCBsYW1wb3J0PWV4Y2x1ZGVkLmxhbXBvcnQsIGRldmljZV9pZD1leGNsdWRlZC5kZXZpY2VfaWRgLFxyXG4gICAgICApXHJcbiAgICAgIC5ydW4oZW50aXR5LCBlbnRpdHlJZCwgZmllbGQsIGxhbXBvcnQsIGRldmljZUlkKTtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gb3Bsb2cgLS0tLS0tLS0tLVxyXG4gIHByaXZhdGUgYXBwZW5kT3Aob3A6IE9wKTogdm9pZCB7XHJcbiAgICB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgIGBJTlNFUlQgSU5UTyBvcGxvZyhvcF9pZCwgZGV2aWNlX2lkLCBhY3Rvcl9pZCwgbGFtcG9ydCwgYXQsIGVudGl0eSwgZW50aXR5X2lkLCBhY3Rpb24sIHBheWxvYWQpXHJcbiAgICAgICAgIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPylgLFxyXG4gICAgICApXHJcbiAgICAgIC5ydW4ob3Aub3BJZCwgb3AuZGV2aWNlSWQsIG9wLmFjdG9ySWQsIG9wLmxhbXBvcnQsIG9wLmF0LCBvcC5lbnRpdHksIG9wLmVudGl0eUlkLCBvcC5hY3Rpb24sIEpTT04uc3RyaW5naWZ5KG9wLnBheWxvYWQpKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgbG9jYWxPcChcclxuICAgIGVudGl0eTogT3BbJ2VudGl0eSddLFxyXG4gICAgZW50aXR5SWQ6IHN0cmluZyxcclxuICAgIGFjdGlvbjogT3BbJ2FjdGlvbiddLFxyXG4gICAgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXHJcbiAgKTogT3Age1xyXG4gICAgY29uc3QgbGFtcG9ydCA9IHRoaXMudGlja0xhbXBvcnQoKTtcclxuICAgIGNvbnN0IG9wOiBPcCA9IHtcclxuICAgICAgb3BJZDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcclxuICAgICAgZGV2aWNlSWQ6IHRoaXMuZGV2aWNlSWQsXHJcbiAgICAgIGFjdG9ySWQ6IHRoaXMuYWN0b3JJZCxcclxuICAgICAgbGFtcG9ydCxcclxuICAgICAgYXQ6IHRoaXMubm93KCksXHJcbiAgICAgIGVudGl0eSxcclxuICAgICAgZW50aXR5SWQsXHJcbiAgICAgIGFjdGlvbixcclxuICAgICAgcGF5bG9hZCxcclxuICAgIH07XHJcbiAgICB0aGlzLmFwcGVuZE9wKG9wKTtcclxuICAgIHJldHVybiBvcDtcclxuICB9XHJcblxyXG4gIC8qKiBMb2NhbCAnc2V0JzogcmVjb3JkcyBiYXNlZE9uIGNsb2NrcyB0aGVuIGFkdmFuY2VzIHRoZW0uICovXHJcbiAgcHJpdmF0ZSBsb2NhbFNldChlbnRpdHk6IE9wWydlbnRpdHknXSwgZW50aXR5SWQ6IHN0cmluZywgZmllbGRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHZvaWQge1xyXG4gICAgY29uc3QgYmFzZWRPbjogUmVjb3JkPHN0cmluZywgeyBsYW1wb3J0OiBudW1iZXI7IGRldmljZUlkOiBzdHJpbmcgfSB8IG51bGw+ID0ge307XHJcbiAgICBmb3IgKGNvbnN0IGYgb2YgT2JqZWN0LmtleXMoZmllbGRzKSkgYmFzZWRPbltmXSA9IHRoaXMuZmllbGRDbG9jayhlbnRpdHksIGVudGl0eUlkLCBmKTtcclxuICAgIGNvbnN0IG9wID0gdGhpcy5sb2NhbE9wKGVudGl0eSwgZW50aXR5SWQsICdzZXQnLCB7IGZpZWxkcywgYmFzZWRPbiB9KTtcclxuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhmaWVsZHMpKSB0aGlzLnNldEZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgdGhpcy5kZXZpY2VJZCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGxvY2FsQ3JlYXRlKGVudGl0eTogT3BbJ2VudGl0eSddLCBlbnRpdHlJZDogc3RyaW5nLCByZWNvcmQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XHJcbiAgICBjb25zdCBvcCA9IHRoaXMubG9jYWxPcChlbnRpdHksIGVudGl0eUlkLCAnY3JlYXRlJywgeyByZWNvcmQgfSk7XHJcbiAgICBmb3IgKGNvbnN0IGYgb2YgT2JqZWN0LmtleXMocmVjb3JkKSkgdGhpcy5zZXRGaWVsZENsb2NrKGVudGl0eSwgZW50aXR5SWQsIGYsIG9wLmxhbXBvcnQsIHRoaXMuZGV2aWNlSWQpO1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBpZGVudCBhbGxvY2F0aW9uIC0tLS0tLS0tLS1cclxuICBhbGxvY0lkZW50KHR5cGU6IEl0ZW1UeXBlKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IHByZWZpeCA9IElERU5UX1BSRUZJWFt0eXBlXTtcclxuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIG5leHQgRlJPTSBpZGVudF9jb3VudGVycyBXSEVSRSB0eXBlPT8nKS5nZXQodHlwZSkgYXNcclxuICAgICAgfCB7IG5leHQ6IG51bWJlciB9XHJcbiAgICAgIHwgdW5kZWZpbmVkO1xyXG4gICAgbGV0IG4gPSByb3cgPyByb3cubmV4dCA6IDE7XHJcbiAgICAvLyBTa2lwIG51bWJlcnMgYWxyZWFkeSB0YWtlbiAoaW1wb3J0cyBtYXkgaGF2ZSBhZHZhbmNlZCB1c2FnZSBwYXN0IG91ciBjb3VudGVyKS5cclxuICAgIHdoaWxlICh0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAxIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PycpLmdldChgJHtwcmVmaXh9LSR7bn1gKSkgbisrO1xyXG4gICAgdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gaWRlbnRfY291bnRlcnModHlwZSxuZXh0KSBWQUxVRVMoPyw/KSBPTiBDT05GTElDVCh0eXBlKSBETyBVUERBVEUgU0VUIG5leHQ9PycpXHJcbiAgICAgIC5ydW4odHlwZSwgbiArIDEsIG4gKyAxKTtcclxuICAgIHJldHVybiBgJHtwcmVmaXh9LSR7bn1gO1xyXG4gIH1cclxuXHJcbiAgLyoqIEFkdmFuY2UgdGhlIGxvY2FsIGNvdW50ZXIgcGFzdCBhbiBpZGVudCBvYnNlcnZlZCBmcm9tIGEgcGVlci4gKi9cclxuICBwcml2YXRlIHdpdG5lc3NJZGVudCh0eXBlOiBJdGVtVHlwZSwgaWRlbnQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgY29uc3QgbSA9IC8tKFxcZCspJC8uZXhlYyhpZGVudCk7XHJcbiAgICBpZiAoIW0pIHJldHVybjtcclxuICAgIGNvbnN0IG4gPSBOdW1iZXIobVsxXSk7XHJcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBuZXh0IEZST00gaWRlbnRfY291bnRlcnMgV0hFUkUgdHlwZT0/JykuZ2V0KHR5cGUpIGFzXHJcbiAgICAgIHwgeyBuZXh0OiBudW1iZXIgfVxyXG4gICAgICB8IHVuZGVmaW5lZDtcclxuICAgIGlmICghcm93IHx8IHJvdy5uZXh0IDw9IG4pIHtcclxuICAgICAgdGhpcy5kYlxyXG4gICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBpZGVudF9jb3VudGVycyh0eXBlLG5leHQpIFZBTFVFUyg/LD8pIE9OIENPTkZMSUNUKHR5cGUpIERPIFVQREFURSBTRVQgbmV4dD0/JylcclxuICAgICAgICAucnVuKHR5cGUsIG4gKyAxLCBuICsgMSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIGFjdGl2aXR5IC0tLS0tLS0tLS1cclxuICAvKiogUHVibGljIGFjdGl2aXR5IGhvb2sgZm9yIGNvbGxhYm9yYXRvcnMgb3V0c2lkZSBTdG9yZSAoZS5nLiBBdHRhY2htZW50TWFuYWdlcikuICovXHJcbiAgcmVjb3JkQWN0aXZpdHkoaXRlbUlkOiBzdHJpbmcgfCBudWxsLCBraW5kOiBzdHJpbmcsIG9sZFY/OiB1bmtub3duLCBuZXdWPzogdW5rbm93bik6IHZvaWQge1xyXG4gICAgdGhpcy5sb2dBY3Rpdml0eShpdGVtSWQsIGtpbmQsIG51bGwsIG9sZFYsIG5ld1YpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdhY3Rpdml0eScsIGVudGl0eUlkOiBpdGVtSWQgPz8gJyonIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBsb2dBY3Rpdml0eShpdGVtSWQ6IHN0cmluZyB8IG51bGwsIGtpbmQ6IHN0cmluZywgZmllbGQ/OiBzdHJpbmcgfCBudWxsLCBvbGRWPzogdW5rbm93biwgbmV3Vj86IHVua25vd24pOiB2b2lkIHtcclxuICAgIHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIGFjdGl2aXR5KGlkLCBpdGVtX2lkLCBhY3Rvcl9pZCwga2luZCwgZmllbGQsIG9sZF92YWx1ZSwgbmV3X3ZhbHVlLCBhdCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyknKVxyXG4gICAgICAucnVuKFxyXG4gICAgICAgIGNyeXB0by5yYW5kb21VVUlEKCksXHJcbiAgICAgICAgaXRlbUlkLFxyXG4gICAgICAgIHRoaXMuYWN0b3JJZCxcclxuICAgICAgICBraW5kLFxyXG4gICAgICAgIGZpZWxkID8/IG51bGwsXHJcbiAgICAgICAgb2xkViA9PSBudWxsID8gbnVsbCA6IFN0cmluZyhvbGRWKS5zbGljZSgwLCA4MDAwKSxcclxuICAgICAgICBuZXdWID09IG51bGwgPyBudWxsIDogU3RyaW5nKG5ld1YpLnNsaWNlKDAsIDgwMDApLFxyXG4gICAgICAgIHRoaXMubm93KCksXHJcbiAgICAgICk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIGl0ZW1zIC0tLS0tLS0tLS1cclxuICBjcmVhdGVJdGVtKGlucHV0OiBQYXJ0aWFsPFdvcmtJdGVtPiAmIHsgdHlwZTogSXRlbVR5cGU7IHRpdGxlOiBzdHJpbmcgfSk6IFdvcmtJdGVtIHtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGlkID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcclxuICAgICAgY29uc3QgaWRlbnQgPSB0aGlzLmFsbG9jSWRlbnQoaW5wdXQudHlwZSk7XHJcbiAgICAgIGNvbnN0IG5vdyA9IHRoaXMubm93KCk7XHJcbiAgICAgIGNvbnN0IHN0YXR1c2VzID0gc3RhdHVzZXNGb3JUeXBlKGlucHV0LnR5cGUpO1xyXG4gICAgICBjb25zdCBpdGVtOiBXb3JrSXRlbSA9IHtcclxuICAgICAgICBpZCxcclxuICAgICAgICBpZGVudCxcclxuICAgICAgICB0eXBlOiBpbnB1dC50eXBlLFxyXG4gICAgICAgIHRpdGxlOiBpbnB1dC50aXRsZSxcclxuICAgICAgICBib2R5OiBpbnB1dC5ib2R5ID8/ICcnLFxyXG4gICAgICAgIGJvZHlUZXh0OiBpbnB1dC5ib2R5VGV4dCA/PyAnJyxcclxuICAgICAgICBzdGF0dXM6IGlucHV0LnN0YXR1cyAmJiBzdGF0dXNlcy5pbmNsdWRlcyhpbnB1dC5zdGF0dXMpID8gaW5wdXQuc3RhdHVzIDogc3RhdHVzZXNbMF0sXHJcbiAgICAgICAgcHJpb3JpdHk6IGlucHV0LnByaW9yaXR5ID8/ICdub25lJyxcclxuICAgICAgICBvd25lcklkOiBpbnB1dC5vd25lcklkID8/IG51bGwsXHJcbiAgICAgICAgcmVwb3J0ZXJJZDogaW5wdXQucmVwb3J0ZXJJZCA/PyB0aGlzLmFjdG9ySWQsXHJcbiAgICAgICAgbWlsZXN0b25lSWQ6IGlucHV0Lm1pbGVzdG9uZUlkID8/IG51bGwsXHJcbiAgICAgICAgcmVsZWFzZUlkOiBpbnB1dC5yZWxlYXNlSWQgPz8gbnVsbCxcclxuICAgICAgICBwYXJlbnRJZDogaW5wdXQucGFyZW50SWQgPz8gbnVsbCxcclxuICAgICAgICBzdGFydERhdGU6IGlucHV0LnN0YXJ0RGF0ZSA/PyBudWxsLFxyXG4gICAgICAgIGR1ZURhdGU6IGlucHV0LmR1ZURhdGUgPz8gbnVsbCxcclxuICAgICAgICBjb21wbGV0ZWRBdDogbnVsbCxcclxuICAgICAgICBlZmZvcnQ6IGlucHV0LmVmZm9ydCA/PyBudWxsLFxyXG4gICAgICAgIGNvbmZpZGVuY2U6IGlucHV0LmNvbmZpZGVuY2UgPz8gbnVsbCxcclxuICAgICAgICByaXNrTGV2ZWw6IGlucHV0LnJpc2tMZXZlbCA/PyBudWxsLFxyXG4gICAgICAgIGJ1c2luZXNzVmFsdWU6IGlucHV0LmJ1c2luZXNzVmFsdWUgPz8gbnVsbCxcclxuICAgICAgICBsZWFkZXJzaGlwVmlzaWJsZTogaW5wdXQubGVhZGVyc2hpcFZpc2libGUgPz8gMCxcclxuICAgICAgICBwcm9ncmVzczogaW5wdXQucHJvZ3Jlc3MgPz8gbnVsbCxcclxuICAgICAgICB0YWdzOiBpbnB1dC50YWdzID8/IFtdLFxyXG4gICAgICAgIGV4dHJhOiBpbnB1dC5leHRyYSA/PyB7fSxcclxuICAgICAgICBhcmNoaXZlZDogMCxcclxuICAgICAgICBzYW1wbGU6IGlucHV0LnNhbXBsZSA/PyAwLFxyXG4gICAgICAgIGNyZWF0ZWRBdDogbm93LFxyXG4gICAgICAgIHVwZGF0ZWRBdDogbm93LFxyXG4gICAgICAgIGNyZWF0ZWRCeTogdGhpcy5hY3RvcklkLFxyXG4gICAgICAgIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkLFxyXG4gICAgICB9O1xyXG4gICAgICB0aGlzLmluc2VydEl0ZW1Sb3coaXRlbSk7XHJcbiAgICAgIHRoaXMubG9jYWxDcmVhdGUoJ2l0ZW0nLCBpZCwgdGhpcy5pdGVtVG9SZWNvcmQoaXRlbSkpO1xyXG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KGlkLCAnY3JlYXRlZCcsIG51bGwsIG51bGwsIGl0ZW0udGl0bGUpO1xyXG4gICAgICByZXR1cm4gaXRlbTtcclxuICAgIH0pO1xyXG4gICAgY29uc3QgaXRlbSA9IHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaXRlbS5pZCB9KTtcclxuICAgIHJldHVybiBpdGVtO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpdGVtVG9SZWNvcmQoaXRlbTogV29ya0l0ZW0pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XHJcbiAgICByZXR1cm4geyAuLi5pdGVtLCB0YWdzOiBpdGVtLnRhZ3MsIGV4dHJhOiBpdGVtLmV4dHJhIH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGluc2VydEl0ZW1Sb3coaTogV29ya0l0ZW0pOiB2b2lkIHtcclxuICAgIHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgYElOU0VSVCBJTlRPIGl0ZW1zKGlkLCBpZGVudCwgdHlwZSwgdGl0bGUsIGJvZHksIGJvZHlfdGV4dCwgc3RhdHVzLCBwcmlvcml0eSwgb3duZXJfaWQsIHJlcG9ydGVyX2lkLFxyXG4gICAgICAgICAgbWlsZXN0b25lX2lkLCByZWxlYXNlX2lkLCBwYXJlbnRfaWQsIHN0YXJ0X2RhdGUsIGR1ZV9kYXRlLCBjb21wbGV0ZWRfYXQsIGVmZm9ydCwgY29uZmlkZW5jZSxcclxuICAgICAgICAgIHJpc2tfbGV2ZWwsIGJ1c2luZXNzX3ZhbHVlLCBsZWFkZXJzaGlwX3Zpc2libGUsIHByb2dyZXNzLCB0YWdzLCBleHRyYSwgYXJjaGl2ZWQsIHNhbXBsZSwgZGVsZXRlZCxcclxuICAgICAgICAgIGNyZWF0ZWRfYXQsIHVwZGF0ZWRfYXQsIGNyZWF0ZWRfYnksIHVwZGF0ZWRfYnkpXHJcbiAgICAgICAgIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sMCw/LD8sPyw/KWAsXHJcbiAgICAgIClcclxuICAgICAgLnJ1bihcclxuICAgICAgICBpLmlkLCBpLmlkZW50LCBpLnR5cGUsIGkudGl0bGUsIGkuYm9keSwgaS5ib2R5VGV4dCwgaS5zdGF0dXMsIGkucHJpb3JpdHksIGkub3duZXJJZCwgaS5yZXBvcnRlcklkLFxyXG4gICAgICAgIGkubWlsZXN0b25lSWQsIGkucmVsZWFzZUlkLCBpLnBhcmVudElkLCBpLnN0YXJ0RGF0ZSwgaS5kdWVEYXRlLCBpLmNvbXBsZXRlZEF0LCBpLmVmZm9ydCwgaS5jb25maWRlbmNlLFxyXG4gICAgICAgIGkucmlza0xldmVsLCBpLmJ1c2luZXNzVmFsdWUsIGkubGVhZGVyc2hpcFZpc2libGUsIGkucHJvZ3Jlc3MsIEpTT04uc3RyaW5naWZ5KGkudGFncyksIEpTT04uc3RyaW5naWZ5KGkuZXh0cmEpLFxyXG4gICAgICAgIGkuYXJjaGl2ZWQsIGkuc2FtcGxlLCBpLmNyZWF0ZWRBdCwgaS51cGRhdGVkQXQsIGkuY3JlYXRlZEJ5LCBpLnVwZGF0ZWRCeSxcclxuICAgICAgKTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZUl0ZW0oaWQ6IHN0cmluZywgZmllbGRzOiBQYXJ0aWFsPFdvcmtJdGVtPik6IFdvcmtJdGVtIHwgbnVsbCB7XHJcbiAgICBjb25zdCBiZWZvcmUgPSB0aGlzLmdldEl0ZW0oaWQpO1xyXG4gICAgaWYgKCFiZWZvcmUpIHJldHVybiBudWxsO1xyXG4gICAgY29uc3QgY2hhbmdlZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcclxuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKGZpZWxkcykpIHtcclxuICAgICAgaWYgKCEoayBpbiBJVEVNX0NPTFMpIHx8IGsgPT09ICdkZWxldGVkJykgY29udGludWU7XHJcbiAgICAgIGNvbnN0IHByZXYgPSAoYmVmb3JlIGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tdO1xyXG4gICAgICBjb25zdCBzYW1lID0gSlNPTl9JVEVNX0ZJRUxEUy5oYXMoaykgPyBKU09OLnN0cmluZ2lmeShwcmV2KSA9PT0gSlNPTi5zdHJpbmdpZnkodikgOiBwcmV2ID09PSB2O1xyXG4gICAgICBpZiAoIXNhbWUpIGNoYW5nZWRba10gPSB2O1xyXG4gICAgfVxyXG4gICAgaWYgKE9iamVjdC5rZXlzKGNoYW5nZWQpLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGJlZm9yZTtcclxuXHJcbiAgICAvLyBTdGF0dXMgdHJhbnNpdGlvbnMgbWFpbnRhaW4gY29tcGxldGVkQXQgYXV0b21hdGljYWxseS5cclxuICAgIGlmICgnc3RhdHVzJyBpbiBjaGFuZ2VkKSB7XHJcbiAgICAgIGNvbnN0IHRlcm1pbmFsTm93ID0gVEVSTUlOQUxfU1RBVFVTRVMuaGFzKFN0cmluZyhjaGFuZ2VkLnN0YXR1cykpO1xyXG4gICAgICBjb25zdCB0ZXJtaW5hbEJlZm9yZSA9IFRFUk1JTkFMX1NUQVRVU0VTLmhhcyhiZWZvcmUuc3RhdHVzKTtcclxuICAgICAgaWYgKHRlcm1pbmFsTm93ICYmICF0ZXJtaW5hbEJlZm9yZSkgY2hhbmdlZC5jb21wbGV0ZWRBdCA9IHRoaXMubm93KCk7XHJcbiAgICAgIGlmICghdGVybWluYWxOb3cgJiYgdGVybWluYWxCZWZvcmUpIGNoYW5nZWQuY29tcGxldGVkQXQgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgY2hhbmdlZC51cGRhdGVkQXQgPSB0aGlzLm5vdygpO1xyXG4gICAgY2hhbmdlZC51cGRhdGVkQnkgPSB0aGlzLmFjdG9ySWQ7XHJcblxyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoaWQsIGNoYW5nZWQpO1xyXG4gICAgICB0aGlzLmxvY2FsU2V0KCdpdGVtJywgaWQsIGNoYW5nZWQpO1xyXG4gICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhjaGFuZ2VkKSkge1xyXG4gICAgICAgIGlmIChrID09PSAndXBkYXRlZEF0JyB8fCBrID09PSAndXBkYXRlZEJ5JykgY29udGludWU7XHJcbiAgICAgICAgaWYgKGsgPT09ICdib2R5JyB8fCBrID09PSAnYm9keVRleHQnKSBjb250aW51ZTsgLy8gYm9keSBlZGl0cyBsb2dnZWQgYXMgb25lICdlZGl0ZWQnIGVudHJ5XHJcbiAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShpZCwgJ3VwZGF0ZWQnLCBrLCAoYmVmb3JlIGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tdLCBKU09OX0lURU1fRklFTERTLmhhcyhrKSA/IEpTT04uc3RyaW5naWZ5KHYpIDogdik7XHJcbiAgICAgIH1cclxuICAgICAgLy8gQm9keSBlZGl0OiByZWNvcmQgb2xkL25ldyBwbGFpbiB0ZXh0IHNvIHRoZSBhY3Rpdml0eSBkaWZmIGNhbiBzaG93IGJlZm9yZS9hZnRlci5cclxuICAgICAgaWYgKCdib2R5JyBpbiBjaGFuZ2VkIHx8ICdib2R5VGV4dCcgaW4gY2hhbmdlZCkge1xyXG4gICAgICAgIGNvbnN0IG5ld1RleHQgPSAnYm9keVRleHQnIGluIGNoYW5nZWQgPyBTdHJpbmcoY2hhbmdlZC5ib2R5VGV4dCA/PyAnJykgOiBiZWZvcmUuYm9keVRleHQ7XHJcbiAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShpZCwgJ2VkaXRlZCcsICdib2R5JywgYmVmb3JlLmJvZHlUZXh0LCBuZXdUZXh0KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdpdGVtJywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0SXRlbShpZCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFwcGx5SXRlbUZpZWxkcyhpZDogc3RyaW5nLCBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XHJcbiAgICBjb25zdCBzZXRzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgY29uc3QgdmFsczogdW5rbm93bltdID0gW107XHJcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XHJcbiAgICAgIGNvbnN0IGNvbCA9IElURU1fQ09MU1trXTtcclxuICAgICAgaWYgKCFjb2wpIGNvbnRpbnVlO1xyXG4gICAgICBzZXRzLnB1c2goYCR7Y29sfT0/YCk7XHJcbiAgICAgIHZhbHMucHVzaChKU09OX0lURU1fRklFTERTLmhhcyhrKSA/IEpTT04uc3RyaW5naWZ5KHYpIDogdik7XHJcbiAgICB9XHJcbiAgICBpZiAoc2V0cy5sZW5ndGggPT09IDApIHJldHVybjtcclxuICAgIHZhbHMucHVzaChpZCk7XHJcbiAgICB0aGlzLmRiLnByZXBhcmUoYFVQREFURSBpdGVtcyBTRVQgJHtzZXRzLmpvaW4oJywgJyl9IFdIRVJFIGlkPT9gKS5ydW4oLi4udmFscyk7XHJcbiAgfVxyXG5cclxuICBhcmNoaXZlSXRlbShpZDogc3RyaW5nLCBhcmNoaXZlZDogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgLy8gdXBkYXRlSXRlbSBhbHJlYWR5IHdyaXRlcyB0aGUgYWN0aXZpdHkgZW50cnkgZm9yIHRoZSBhcmNoaXZlZC1maWVsZCBjaGFuZ2UuXHJcbiAgICB0aGlzLnVwZGF0ZUl0ZW0oaWQsIHsgYXJjaGl2ZWQ6IGFyY2hpdmVkID8gMSA6IDAgfSBhcyBQYXJ0aWFsPFdvcmtJdGVtPik7XHJcbiAgfVxyXG5cclxuICBkZWxldGVJdGVtKGlkOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGNvbnN0IHN0YW1wID0gdGhpcy5ub3coKTtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGl0ZW1zIFNFVCBkZWxldGVkPTEsIGRlbGV0ZWRfYXQ9PywgZGVsZXRlZF9ieT0/LCB1cGRhdGVkX2F0PT8sIHVwZGF0ZWRfYnk9PyBXSEVSRSBpZD0/JylcclxuICAgICAgICAucnVuKHN0YW1wLCB0aGlzLmFjdG9ySWQsIHN0YW1wLCB0aGlzLmFjdG9ySWQsIGlkKTtcclxuICAgICAgdGhpcy5sb2NhbE9wKCdpdGVtJywgaWQsICdkZWxldGUnLCB7fSk7XHJcbiAgICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsICdkZWxldGVkJyk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaWQgfSk7XHJcbiAgfVxyXG5cclxuICBnZXRJdGVtKGlkOiBzdHJpbmcpOiBXb3JrSXRlbSB8IG51bGwge1xyXG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIGl0ZW1zIFdIRVJFIGlkPT8gQU5EIGRlbGV0ZWQ9MCcpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XHJcbiAgICByZXR1cm4gcm93ID8gcm93VG9JdGVtKHJvdykgOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgZ2V0SXRlbUJ5SWRlbnQoaWRlbnQ6IHN0cmluZyk6IFdvcmtJdGVtIHwgbnVsbCB7XHJcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PyBDT0xMQVRFIE5PQ0FTRSBBTkQgZGVsZXRlZD0wJykuZ2V0KGlkZW50KSBhc1xyXG4gICAgICB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+XHJcbiAgICAgIHwgdW5kZWZpbmVkO1xyXG4gICAgcmV0dXJuIHJvdyA/IHJvd1RvSXRlbShyb3cpIDogbnVsbDtcclxuICB9XHJcblxyXG4gIGxpc3RJdGVtcyhmaWx0ZXI6IEl0ZW1GaWx0ZXIgPSB7fSwgc29ydDogSXRlbVNvcnQgPSB7IGZpZWxkOiAndXBkYXRlZEF0JywgZGlyOiAnZGVzYycgfSwgbGltaXQgPSA1MDAsIG9mZnNldCA9IDApOiBXb3JrSXRlbVtdIHtcclxuICAgIGNvbnN0IHdoZXJlOiBzdHJpbmdbXSA9IFsnZGVsZXRlZD0wJ107XHJcbiAgICBjb25zdCB2YWxzOiB1bmtub3duW10gPSBbXTtcclxuICAgIGlmIChmaWx0ZXIuYXJjaGl2ZWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB3aGVyZS5wdXNoKCdhcmNoaXZlZD0/Jyk7XHJcbiAgICAgIHZhbHMucHVzaChmaWx0ZXIuYXJjaGl2ZWQgPyAxIDogMCk7XHJcbiAgICB9IGVsc2Ugd2hlcmUucHVzaCgnYXJjaGl2ZWQ9MCcpO1xyXG4gICAgaWYgKGZpbHRlci50eXBlcz8ubGVuZ3RoKSB7XHJcbiAgICAgIHdoZXJlLnB1c2goYHR5cGUgSU4gKCR7ZmlsdGVyLnR5cGVzLm1hcCgoKSA9PiAnPycpLmpvaW4oJywnKX0pYCk7XHJcbiAgICAgIHZhbHMucHVzaCguLi5maWx0ZXIudHlwZXMpO1xyXG4gICAgfVxyXG4gICAgaWYgKGZpbHRlci5zdGF0dXNlcz8ubGVuZ3RoKSB7XHJcbiAgICAgIHdoZXJlLnB1c2goYHN0YXR1cyBJTiAoJHtmaWx0ZXIuc3RhdHVzZXMubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcclxuICAgICAgdmFscy5wdXNoKC4uLmZpbHRlci5zdGF0dXNlcyk7XHJcbiAgICB9XHJcbiAgICBpZiAoZmlsdGVyLnByaW9yaXRpZXM/Lmxlbmd0aCkge1xyXG4gICAgICB3aGVyZS5wdXNoKGBwcmlvcml0eSBJTiAoJHtmaWx0ZXIucHJpb3JpdGllcy5tYXAoKCkgPT4gJz8nKS5qb2luKCcsJyl9KWApO1xyXG4gICAgICB2YWxzLnB1c2goLi4uZmlsdGVyLnByaW9yaXRpZXMpO1xyXG4gICAgfVxyXG4gICAgaWYgKGZpbHRlci5vd25lcklkcz8ubGVuZ3RoKSB7XHJcbiAgICAgIGNvbnN0IG5vbk51bGwgPSBmaWx0ZXIub3duZXJJZHMuZmlsdGVyKChvKSA9PiBvICE9PSBudWxsKTtcclxuICAgICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgIGlmIChub25OdWxsLmxlbmd0aCkge1xyXG4gICAgICAgIHBhcnRzLnB1c2goYG93bmVyX2lkIElOICgke25vbk51bGwubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcclxuICAgICAgICB2YWxzLnB1c2goLi4ubm9uTnVsbCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGZpbHRlci5vd25lcklkcy5pbmNsdWRlcyhudWxsKSkgcGFydHMucHVzaCgnb3duZXJfaWQgSVMgTlVMTCcpO1xyXG4gICAgICB3aGVyZS5wdXNoKGAoJHtwYXJ0cy5qb2luKCcgT1IgJyl9KWApO1xyXG4gICAgfVxyXG4gICAgaWYgKGZpbHRlci5taWxlc3RvbmVJZCkgeyB3aGVyZS5wdXNoKCdtaWxlc3RvbmVfaWQ9PycpOyB2YWxzLnB1c2goZmlsdGVyLm1pbGVzdG9uZUlkKTsgfVxyXG4gICAgaWYgKGZpbHRlci5yZWxlYXNlSWQpIHsgd2hlcmUucHVzaCgncmVsZWFzZV9pZD0/Jyk7IHZhbHMucHVzaChmaWx0ZXIucmVsZWFzZUlkKTsgfVxyXG4gICAgaWYgKGZpbHRlci5wYXJlbnRJZCkgeyB3aGVyZS5wdXNoKCdwYXJlbnRfaWQ9PycpOyB2YWxzLnB1c2goZmlsdGVyLnBhcmVudElkKTsgfVxyXG4gICAgaWYgKGZpbHRlci50YWcpIHsgd2hlcmUucHVzaChcInRhZ3MgTElLRSA/XCIpOyB2YWxzLnB1c2goYCUke0pTT04uc3RyaW5naWZ5KGZpbHRlci50YWcpfSVgKTsgfVxyXG4gICAgaWYgKGZpbHRlci5vdmVyZHVlKSB7IHdoZXJlLnB1c2goXCJkdWVfZGF0ZSBJUyBOT1QgTlVMTCBBTkQgZHVlX2RhdGUgPCBkYXRlKCdub3cnKSBBTkQgY29tcGxldGVkX2F0IElTIE5VTExcIik7IH1cclxuICAgIGlmIChmaWx0ZXIuZHVlV2l0aGluRGF5cyAhPSBudWxsKSB7XHJcbiAgICAgIHdoZXJlLnB1c2goXCJkdWVfZGF0ZSBJUyBOT1QgTlVMTCBBTkQgZHVlX2RhdGUgPD0gZGF0ZSgnbm93JywgPykgQU5EIGNvbXBsZXRlZF9hdCBJUyBOVUxMXCIpO1xyXG4gICAgICB2YWxzLnB1c2goYCske2ZpbHRlci5kdWVXaXRoaW5EYXlzfSBkYXlzYCk7XHJcbiAgICB9XHJcbiAgICBpZiAoZmlsdGVyLmxlYWRlcnNoaXBWaXNpYmxlKSB3aGVyZS5wdXNoKCdsZWFkZXJzaGlwX3Zpc2libGU9MScpO1xyXG4gICAgaWYgKGZpbHRlci51cGRhdGVkU2luY2UpIHsgd2hlcmUucHVzaCgndXBkYXRlZF9hdCA+PSA/Jyk7IHZhbHMucHVzaChmaWx0ZXIudXBkYXRlZFNpbmNlKTsgfVxyXG4gICAgaWYgKGZpbHRlci5zYW1wbGUgIT09IHVuZGVmaW5lZCkgeyB3aGVyZS5wdXNoKCdzYW1wbGU9PycpOyB2YWxzLnB1c2goZmlsdGVyLnNhbXBsZSA/IDEgOiAwKTsgfVxyXG4gICAgaWYgKGZpbHRlci50ZXh0KSB7XHJcbiAgICAgIHdoZXJlLnB1c2goJ3Jvd2lkIElOIChTRUxFQ1Qgcm93aWQgRlJPTSBpdGVtc19mdHMgV0hFUkUgaXRlbXNfZnRzIE1BVENIID8pJyk7XHJcbiAgICAgIHZhbHMucHVzaChmdHNRdWVyeShmaWx0ZXIudGV4dCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNvcnRDb2w6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgICAgIGlkZW50OiAnaWRlbnQnLFxyXG4gICAgICB0aXRsZTogJ3RpdGxlIENPTExBVEUgTk9DQVNFJyxcclxuICAgICAgc3RhdHVzOiAnc3RhdHVzJyxcclxuICAgICAgcHJpb3JpdHk6IFwiQ0FTRSBwcmlvcml0eSBXSEVOICd1cmdlbnQnIFRIRU4gMCBXSEVOICdoaWdoJyBUSEVOIDEgV0hFTiAnbWVkaXVtJyBUSEVOIDIgV0hFTiAnbG93JyBUSEVOIDMgRUxTRSA0IEVORFwiLFxyXG4gICAgICBkdWVEYXRlOiAnZHVlX2RhdGUgSVMgTlVMTCwgZHVlX2RhdGUnLFxyXG4gICAgICBjcmVhdGVkQXQ6ICdjcmVhdGVkX2F0JyxcclxuICAgICAgdXBkYXRlZEF0OiAndXBkYXRlZF9hdCcsXHJcbiAgICAgIG1hbnVhbDogJ3VwZGF0ZWRfYXQnLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IG9yZGVyID0gYCR7c29ydENvbFtzb3J0LmZpZWxkXSA/PyAndXBkYXRlZF9hdCd9ICR7c29ydC5kaXIgPT09ICdhc2MnID8gJ0FTQycgOiAnREVTQyd9YDtcclxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKGBTRUxFQ1QgKiBGUk9NIGl0ZW1zIFdIRVJFICR7d2hlcmUuam9pbignIEFORCAnKX0gT1JERVIgQlkgJHtvcmRlcn0gTElNSVQgPyBPRkZTRVQgP2ApXHJcbiAgICAgIC5hbGwoLi4udmFscywgbGltaXQsIG9mZnNldCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIHJldHVybiByb3dzLm1hcChyb3dUb0l0ZW0pO1xyXG4gIH1cclxuXHJcbiAgc2VhcmNoKHRleHQ6IHN0cmluZywgbGltaXQgPSAzMCk6IFNlYXJjaFJlc3VsdFtdIHtcclxuICAgIGlmICghdGV4dC50cmltKCkpIHJldHVybiBbXTtcclxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgIGBTRUxFQ1QgaXRlbXMuKiwgc25pcHBldChpdGVtc19mdHMsIDIsICc8PCcsICc+PicsICdcdTIwMjYnLCAxMikgQVMgc25pcCwgcmFuayBBUyBzY29yZVxyXG4gICAgICAgICBGUk9NIGl0ZW1zX2Z0cyBKT0lOIGl0ZW1zIE9OIGl0ZW1zLnJvd2lkID0gaXRlbXNfZnRzLnJvd2lkXHJcbiAgICAgICAgIFdIRVJFIGl0ZW1zX2Z0cyBNQVRDSCA/IEFORCBpdGVtcy5kZWxldGVkPTAgQU5EIGl0ZW1zLmFyY2hpdmVkPTBcclxuICAgICAgICAgT1JERVIgQlkgcmFuayBMSU1JVCA/YCxcclxuICAgICAgKVxyXG4gICAgICAuYWxsKGZ0c1F1ZXJ5KHRleHQpLCBsaW1pdCkgYXMgKFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYgeyBzbmlwOiBzdHJpbmc7IHNjb3JlOiBudW1iZXIgfSlbXTtcclxuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHsgaXRlbTogcm93VG9JdGVtKHIpLCBzbmlwcGV0OiByLnNuaXAsIHNjb3JlOiByLnNjb3JlIH0pKTtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gbGlua3MgLS0tLS0tLS0tLVxyXG4gIGFkZExpbmsoZnJvbUlkOiBzdHJpbmcsIHRvSWQ6IHN0cmluZywga2luZDogTGlua0tpbmQpOiBJdGVtTGluayB8IG51bGwge1xyXG4gICAgaWYgKGZyb21JZCA9PT0gdG9JZCkgcmV0dXJuIG51bGw7XHJcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gbGlua3MgV0hFUkUgZnJvbV9pZD0/IEFORCB0b19pZD0/IEFORCBraW5kPT8nKVxyXG4gICAgICAuZ2V0KGZyb21JZCwgdG9JZCwga2luZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XHJcbiAgICBpZiAoZXhpc3RpbmcgJiYgIWV4aXN0aW5nLmRlbGV0ZWQpIHJldHVybiByb3dUb0xpbmsoZXhpc3RpbmcpO1xyXG4gICAgY29uc3QgbGluazogSXRlbUxpbmsgPSB7XHJcbiAgICAgIGlkOiBleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5pZCkgOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxyXG4gICAgICBmcm9tSWQsXHJcbiAgICAgIHRvSWQsXHJcbiAgICAgIGtpbmQsXHJcbiAgICAgIGNyZWF0ZWRBdDogdGhpcy5ub3coKSxcclxuICAgICAgY3JlYXRlZEJ5OiB0aGlzLmFjdG9ySWQsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgaWYgKGV4aXN0aW5nKSB7XHJcbiAgICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgbGlua3MgU0VUIGRlbGV0ZWQ9MCBXSEVSRSBpZD0/JykucnVuKGxpbmsuaWQpO1xyXG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ2xpbmsnLCBsaW5rLmlkLCB7IGRlbGV0ZWQ6IDAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5kYlxyXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIGxpbmtzKGlkLCBmcm9tX2lkLCB0b19pZCwga2luZCwgZGVsZXRlZCwgY3JlYXRlZF9hdCwgY3JlYXRlZF9ieSkgVkFMVUVTKD8sPyw/LD8sMCw/LD8pJylcclxuICAgICAgICAgIC5ydW4obGluay5pZCwgZnJvbUlkLCB0b0lkLCBraW5kLCBsaW5rLmNyZWF0ZWRBdCwgbGluay5jcmVhdGVkQnkpO1xyXG4gICAgICAgIHRoaXMubG9jYWxDcmVhdGUoJ2xpbmsnLCBsaW5rLmlkLCB7IC4uLmxpbmsgfSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5sb2dBY3Rpdml0eShmcm9tSWQsICdsaW5rJywga2luZCwgbnVsbCwgdG9JZCk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2xpbmsnLCBlbnRpdHlJZDogbGluay5pZCB9KTtcclxuICAgIHJldHVybiBsaW5rO1xyXG4gIH1cclxuXHJcbiAgcmVtb3ZlTGluayhpZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBmcm9tX2lkLCBraW5kLCB0b19pZCBGUk9NIGxpbmtzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzXHJcbiAgICAgIHwgeyBmcm9tX2lkOiBzdHJpbmc7IGtpbmQ6IHN0cmluZzsgdG9faWQ6IHN0cmluZyB9XHJcbiAgICAgIHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgbGlua3MgU0VUIGRlbGV0ZWQ9MSBXSEVSRSBpZD0/JykucnVuKGlkKTtcclxuICAgICAgdGhpcy5sb2NhbFNldCgnbGluaycsIGlkLCB7IGRlbGV0ZWQ6IDEgfSk7XHJcbiAgICAgIGlmIChyb3cpIHRoaXMubG9nQWN0aXZpdHkocm93LmZyb21faWQsICd1bmxpbmsnLCByb3cua2luZCwgcm93LnRvX2lkLCBudWxsKTtcclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnbGluaycsIGVudGl0eUlkOiBpZCB9KTtcclxuICB9XHJcblxyXG4gIGxpbmtzRm9yKGl0ZW1JZDogc3RyaW5nKTogeyBsaW5rOiBJdGVtTGluazsgZGlyZWN0aW9uOiAnb3V0JyB8ICdpbic7IG90aGVyOiBXb3JrSXRlbSB9W10ge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gbGlua3MgV0hFUkUgKGZyb21faWQ9PyBPUiB0b19pZD0/KSBBTkQgZGVsZXRlZD0wJylcclxuICAgICAgLmFsbChpdGVtSWQsIGl0ZW1JZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIGNvbnN0IG91dDogeyBsaW5rOiBJdGVtTGluazsgZGlyZWN0aW9uOiAnb3V0JyB8ICdpbic7IG90aGVyOiBXb3JrSXRlbSB9W10gPSBbXTtcclxuICAgIGZvciAoY29uc3QgciBvZiByb3dzKSB7XHJcbiAgICAgIGNvbnN0IGxpbmsgPSByb3dUb0xpbmsocik7XHJcbiAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGxpbmsuZnJvbUlkID09PSBpdGVtSWQgPyAnb3V0JyA6ICdpbic7XHJcbiAgICAgIGNvbnN0IG90aGVyID0gdGhpcy5nZXRJdGVtKGRpcmVjdGlvbiA9PT0gJ291dCcgPyBsaW5rLnRvSWQgOiBsaW5rLmZyb21JZCk7XHJcbiAgICAgIGlmIChvdGhlcikgb3V0LnB1c2goeyBsaW5rLCBkaXJlY3Rpb24sIG90aGVyIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG91dDtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gY29tbWVudHMgLS0tLS0tLS0tLVxyXG4gIGFkZENvbW1lbnQoaXRlbUlkOiBzdHJpbmcsIGJvZHk6IHN0cmluZywgYm9keVRleHQ6IHN0cmluZyk6IENvbW1lbnQge1xyXG4gICAgY29uc3QgYzogQ29tbWVudCA9IHtcclxuICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXHJcbiAgICAgIGl0ZW1JZCxcclxuICAgICAgYXV0aG9ySWQ6IHRoaXMuYWN0b3JJZCxcclxuICAgICAgYm9keSxcclxuICAgICAgYm9keVRleHQsXHJcbiAgICAgIGNyZWF0ZWRBdDogdGhpcy5ub3coKSxcclxuICAgICAgdXBkYXRlZEF0OiBudWxsLFxyXG4gICAgICBkZWxldGVkOiAwLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIHRoaXMuZGJcclxuICAgICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gY29tbWVudHMoaWQsIGl0ZW1faWQsIGF1dGhvcl9pZCwgYm9keSwgYm9keV90ZXh0LCBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPywwKScpXHJcbiAgICAgICAgLnJ1bihjLmlkLCBjLml0ZW1JZCwgYy5hdXRob3JJZCwgYy5ib2R5LCBjLmJvZHlUZXh0LCBjLmNyZWF0ZWRBdCwgYy51cGRhdGVkQXQpO1xyXG4gICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdjb21tZW50JywgYy5pZCwgeyAuLi5jIH0pO1xyXG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KGl0ZW1JZCwgJ2NvbW1lbnQnLCBudWxsLCBudWxsLCBib2R5VGV4dC5zbGljZSgwLCAyMDApKTtcclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnY29tbWVudCcsIGVudGl0eUlkOiBjLmlkIH0pO1xyXG4gICAgcmV0dXJuIGM7XHJcbiAgfVxyXG5cclxuICB1cGRhdGVDb21tZW50KGlkOiBzdHJpbmcsIGJvZHk6IHN0cmluZywgYm9keVRleHQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaXRlbV9pZCBGUk9NIGNvbW1lbnRzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIHsgaXRlbV9pZDogc3RyaW5nIH0gfCB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCBmaWVsZHMgPSB7IGJvZHksIGJvZHlUZXh0LCB1cGRhdGVkQXQ6IHRoaXMubm93KCksIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH07XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBjb21tZW50cyBTRVQgYm9keT0/LCBib2R5X3RleHQ9PywgdXBkYXRlZF9hdD0/LCB1cGRhdGVkX2J5PT8gV0hFUkUgaWQ9PycpXHJcbiAgICAgICAgLnJ1bihib2R5LCBib2R5VGV4dCwgZmllbGRzLnVwZGF0ZWRBdCwgZmllbGRzLnVwZGF0ZWRCeSwgaWQpO1xyXG4gICAgICB0aGlzLmxvY2FsU2V0KCdjb21tZW50JywgaWQsIGZpZWxkcyk7XHJcbiAgICAgIGlmIChyb3cpIHRoaXMubG9nQWN0aXZpdHkocm93Lml0ZW1faWQsICdjb21tZW50X2VkaXRlZCcsIG51bGwsIG51bGwsIGJvZHlUZXh0LnNsaWNlKDAsIDIwMCkpO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdjb21tZW50JywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gIH1cclxuXHJcbiAgZGVsZXRlQ29tbWVudChpZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpdGVtX2lkLCBib2R5X3RleHQgRlJPTSBjb21tZW50cyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhc1xyXG4gICAgICB8IHsgaXRlbV9pZDogc3RyaW5nOyBib2R5X3RleHQ6IHN0cmluZyB9XHJcbiAgICAgIHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3Qgc3RhbXAgPSB0aGlzLm5vdygpO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgY29tbWVudHMgU0VUIGRlbGV0ZWQ9MSwgZGVsZXRlZF9hdD0/LCBkZWxldGVkX2J5PT8gV0hFUkUgaWQ9PycpLnJ1bihzdGFtcCwgdGhpcy5hY3RvcklkLCBpZCk7XHJcbiAgICAgIHRoaXMubG9jYWxTZXQoJ2NvbW1lbnQnLCBpZCwgeyBkZWxldGVkOiAxLCBkZWxldGVkQXQ6IHN0YW1wLCBkZWxldGVkQnk6IHRoaXMuYWN0b3JJZCB9KTtcclxuICAgICAgaWYgKHJvdykgdGhpcy5sb2dBY3Rpdml0eShyb3cuaXRlbV9pZCwgJ2NvbW1lbnRfZGVsZXRlZCcsIG51bGwsIHJvdy5ib2R5X3RleHQuc2xpY2UoMCwgMjAwKSwgbnVsbCk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2NvbW1lbnQnLCBlbnRpdHlJZDogaWQgfSk7XHJcbiAgfVxyXG5cclxuICBjb21tZW50c0ZvcihpdGVtSWQ6IHN0cmluZyk6IENvbW1lbnRbXSB7XHJcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZSgnU0VMRUNUICogRlJPTSBjb21tZW50cyBXSEVSRSBpdGVtX2lkPT8gQU5EIGRlbGV0ZWQ9MCBPUkRFUiBCWSBjcmVhdGVkX2F0IEFTQycpXHJcbiAgICAgIC5hbGwoaXRlbUlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xyXG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xyXG4gICAgICBpZDogU3RyaW5nKHIuaWQpLFxyXG4gICAgICBpdGVtSWQ6IFN0cmluZyhyLml0ZW1faWQpLFxyXG4gICAgICBhdXRob3JJZDogU3RyaW5nKHIuYXV0aG9yX2lkKSxcclxuICAgICAgYm9keTogU3RyaW5nKHIuYm9keSksXHJcbiAgICAgIGJvZHlUZXh0OiBTdHJpbmcoci5ib2R5X3RleHQpLFxyXG4gICAgICBjcmVhdGVkQXQ6IFN0cmluZyhyLmNyZWF0ZWRfYXQpLFxyXG4gICAgICB1cGRhdGVkQXQ6IHIudXBkYXRlZF9hdCA/IFN0cmluZyhyLnVwZGF0ZWRfYXQpIDogbnVsbCxcclxuICAgICAgZGVsZXRlZDogMCxcclxuICAgIH0pKTtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gdmVyc2lvbnMgLS0tLS0tLS0tLVxyXG4gIHNhdmVWZXJzaW9uKGl0ZW1JZDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRJdGVtKGl0ZW1JZCk7XHJcbiAgICBpZiAoIWl0ZW0pIHJldHVybjtcclxuICAgIGNvbnN0IGxhc3QgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBNQVgodmVyc2lvbikgQVMgdiBGUk9NIGl0ZW1fdmVyc2lvbnMgV0hFUkUgaXRlbV9pZD0/JykuZ2V0KGl0ZW1JZCkgYXMgeyB2OiBudW1iZXIgfCBudWxsIH07XHJcbiAgICB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBpdGVtX3ZlcnNpb25zKGlkLCBpdGVtX2lkLCB2ZXJzaW9uLCB0aXRsZSwgYm9keSwgc2F2ZWRfYnksIHNhdmVkX2F0KSBWQUxVRVMoPyw/LD8sPyw/LD8sPyknKVxyXG4gICAgICAucnVuKGNyeXB0by5yYW5kb21VVUlEKCksIGl0ZW1JZCwgKGxhc3QudiA/PyAwKSArIDEsIGl0ZW0udGl0bGUsIGl0ZW0uYm9keSwgdGhpcy5hY3RvcklkLCB0aGlzLm5vdygpKTtcclxuICB9XHJcblxyXG4gIHZlcnNpb25zRm9yKGl0ZW1JZDogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIGlkLCBpdGVtX2lkIEFTIGl0ZW1JZCwgdmVyc2lvbiwgdGl0bGUsIGJvZHksIHNhdmVkX2J5IEFTIHNhdmVkQnksIHNhdmVkX2F0IEFTIHNhdmVkQXQgRlJPTSBpdGVtX3ZlcnNpb25zIFdIRVJFIGl0ZW1faWQ9PyBPUkRFUiBCWSB2ZXJzaW9uIERFU0MnKVxyXG4gICAgICAuYWxsKGl0ZW1JZCk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIHVzZXJzIC0tLS0tLS0tLS1cclxuICB1cHNlcnRVc2VyKHU6IHsgaWQ6IHN0cmluZzsgbmFtZTogc3RyaW5nOyBpbml0aWFsczogc3RyaW5nOyBjb2xvcjogc3RyaW5nIH0pOiBVc2VyIHtcclxuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHVzZXJzIFdIRVJFIGlkPT8nKS5nZXQodS5pZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCB1c2VyOiBVc2VyID0ge1xyXG4gICAgICAuLi51LFxyXG4gICAgICBjcmVhdGVkQXQ6IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmNyZWF0ZWRfYXQpIDogdGhpcy5ub3coKSxcclxuICAgIH07XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICB0aGlzLmRiXHJcbiAgICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgICBgSU5TRVJUIElOVE8gdXNlcnMoaWQsIG5hbWUsIGluaXRpYWxzLCBjb2xvciwgY3JlYXRlZF9hdCkgVkFMVUVTKD8sPyw/LD8sPylcclxuICAgICAgICAgICBPTiBDT05GTElDVChpZCkgRE8gVVBEQVRFIFNFVCBuYW1lPWV4Y2x1ZGVkLm5hbWUsIGluaXRpYWxzPWV4Y2x1ZGVkLmluaXRpYWxzLCBjb2xvcj1leGNsdWRlZC5jb2xvcmAsXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC5ydW4odXNlci5pZCwgdXNlci5uYW1lLCB1c2VyLmluaXRpYWxzLCB1c2VyLmNvbG9yLCB1c2VyLmNyZWF0ZWRBdCk7XHJcbiAgICAgIGlmICghZXhpc3RpbmcpIHRoaXMubG9jYWxDcmVhdGUoJ3VzZXInLCB1c2VyLmlkLCB7IC4uLnVzZXIgfSk7XHJcbiAgICAgIGVsc2UgdGhpcy5sb2NhbFNldCgndXNlcicsIHVzZXIuaWQsIHsgbmFtZTogdXNlci5uYW1lLCBpbml0aWFsczogdXNlci5pbml0aWFscywgY29sb3I6IHVzZXIuY29sb3IgfSk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICByZXR1cm4gdXNlcjtcclxuICB9XHJcblxyXG4gIGxpc3RVc2VycygpOiBVc2VyW10ge1xyXG4gICAgcmV0dXJuICh0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBhdmF0YXIsIGNyZWF0ZWRfYXQgQVMgY3JlYXRlZEF0IEZST00gdXNlcnMnKS5hbGwoKSBhcyBVc2VyW10pO1xyXG4gIH1cclxuXHJcbiAgLyoqIFNldCAob3IgY2xlYXIsIHdpdGggbnVsbCkgYSB1c2VyJ3MgYXZhdGFyIGltYWdlLiBFbWl0cyBhIHN5bmNlZCAnc2V0JyBvcC4gKi9cclxuICBzZXRVc2VyQXZhdGFyKGlkOiBzdHJpbmcsIGF2YXRhcjogc3RyaW5nIHwgbnVsbCk6IFVzZXIgfCBudWxsIHtcclxuICAgIGNvbnN0IGV4aXN0cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIDEgRlJPTSB1c2VycyBXSEVSRSBpZD0/JykuZ2V0KGlkKTtcclxuICAgIGlmICghZXhpc3RzKSByZXR1cm4gbnVsbDtcclxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XHJcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIHVzZXJzIFNFVCBhdmF0YXI9PyBXSEVSRSBpZD0/JykucnVuKGF2YXRhciwgaWQpO1xyXG4gICAgICB0aGlzLmxvY2FsU2V0KCd1c2VyJywgaWQsIHsgYXZhdGFyIH0pO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICd1c2VyJywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gICAgcmV0dXJuIHRoaXMuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBhdmF0YXIsIGNyZWF0ZWRfYXQgQVMgY3JlYXRlZEF0IEZST00gdXNlcnMgV0hFUkUgaWQ9PycpXHJcbiAgICAgIC5nZXQoaWQpIGFzIFVzZXI7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIG1pbGVzdG9uZXMgLyByZWxlYXNlcyAtLS0tLS0tLS0tXHJcbiAgdXBzZXJ0TWlsZXN0b25lKG06IFBhcnRpYWw8TWlsZXN0b25lPiAmIHsgbmFtZTogc3RyaW5nIH0pOiBNaWxlc3RvbmUge1xyXG4gICAgY29uc3QgaWQgPSBtLmlkID8/IGNyeXB0by5yYW5kb21VVUlEKCk7XHJcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBtaWxlc3RvbmVzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3Qgbm93ID0gdGhpcy5ub3coKTtcclxuICAgIGNvbnN0IGNyZWF0ZWRBdCA9IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmNyZWF0ZWRfYXQgfHwgbm93KSA6IG5vdztcclxuICAgIGNvbnN0IGNyZWF0ZWRCeSA9IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmNyZWF0ZWRfYnkgfHwgdGhpcy5hY3RvcklkKSA6IHRoaXMuYWN0b3JJZDtcclxuICAgIGNvbnN0IHJlYzogTWlsZXN0b25lID0ge1xyXG4gICAgICBpZCxcclxuICAgICAgbmFtZTogbS5uYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogbS5kZXNjcmlwdGlvbiA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuZGVzY3JpcHRpb24pIDogJycpLFxyXG4gICAgICB0YXJnZXREYXRlOiBtLnRhcmdldERhdGUgPz8gKGV4aXN0aW5nID8gKGV4aXN0aW5nLnRhcmdldF9kYXRlIGFzIHN0cmluZyB8IG51bGwpIDogbnVsbCksXHJcbiAgICAgIHN0YXR1czogKG0uc3RhdHVzID8/IChleGlzdGluZyA/IGV4aXN0aW5nLnN0YXR1cyA6ICdwbGFubmVkJykpIGFzIE1pbGVzdG9uZVsnc3RhdHVzJ10sXHJcbiAgICAgIHNvcnQ6IG0uc29ydCA/PyAoZXhpc3RpbmcgPyBOdW1iZXIoZXhpc3Rpbmcuc29ydCkgOiAwKSxcclxuICAgICAgc2FtcGxlOiBtLnNhbXBsZSA/PyAoZXhpc3RpbmcgPyAoTnVtYmVyKGV4aXN0aW5nLnNhbXBsZSkgYXMgMCB8IDEpIDogMCksXHJcbiAgICAgIGNyZWF0ZWRBdCwgY3JlYXRlZEJ5LCB1cGRhdGVkQXQ6IG5vdywgdXBkYXRlZEJ5OiB0aGlzLmFjdG9ySWQsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYlxyXG4gICAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgICAgYElOU0VSVCBJTlRPIG1pbGVzdG9uZXMoaWQsIG5hbWUsIGRlc2NyaXB0aW9uLCB0YXJnZXRfZGF0ZSwgc3RhdHVzLCBzb3J0LCBzYW1wbGUsIGRlbGV0ZWQsIGNyZWF0ZWRfYXQsIGNyZWF0ZWRfYnksIHVwZGF0ZWRfYXQsIHVwZGF0ZWRfYnkpXHJcbiAgICAgICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPywwLD8sPyw/LD8pXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCBkZXNjcmlwdGlvbj0/LCB0YXJnZXRfZGF0ZT0/LCBzdGF0dXM9Pywgc29ydD0/LCBkZWxldGVkPTAsIHVwZGF0ZWRfYXQ9PywgdXBkYXRlZF9ieT0/YCxcclxuICAgICAgICApXHJcbiAgICAgICAgLnJ1bihyZWMuaWQsIHJlYy5uYW1lLCByZWMuZGVzY3JpcHRpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuc29ydCwgcmVjLnNhbXBsZSwgY3JlYXRlZEF0LCBjcmVhdGVkQnksIG5vdywgdGhpcy5hY3RvcklkLFxyXG4gICAgICAgICAgICAgcmVjLm5hbWUsIHJlYy5kZXNjcmlwdGlvbiwgcmVjLnRhcmdldERhdGUsIHJlYy5zdGF0dXMsIHJlYy5zb3J0LCBub3csIHRoaXMuYWN0b3JJZCk7XHJcbiAgICAgIGlmICghZXhpc3RpbmcpIHtcclxuICAgICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdtaWxlc3RvbmUnLCBpZCwgeyAuLi5yZWMgfSk7XHJcbiAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShudWxsLCAnbWlsZXN0b25lX2NyZWF0ZWQnLCAnbWlsZXN0b25lJywgbnVsbCwgcmVjLm5hbWUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ21pbGVzdG9uZScsIGlkLCB7IG5hbWU6IHJlYy5uYW1lLCBkZXNjcmlwdGlvbjogcmVjLmRlc2NyaXB0aW9uLCB0YXJnZXREYXRlOiByZWMudGFyZ2V0RGF0ZSwgc3RhdHVzOiByZWMuc3RhdHVzLCBzb3J0OiByZWMuc29ydCwgdXBkYXRlZEF0OiBub3csIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH0pO1xyXG4gICAgICAgIHRoaXMubG9nQWN0aXZpdHkobnVsbCwgJ21pbGVzdG9uZV91cGRhdGVkJywgJ21pbGVzdG9uZScsIFN0cmluZyhleGlzdGluZy5uYW1lKSwgcmVjLm5hbWUpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ21pbGVzdG9uZScsIGVudGl0eUlkOiBpZCB9KTtcclxuICAgIHJldHVybiByZWM7XHJcbiAgfVxyXG5cclxuICBsaXN0TWlsZXN0b25lcygpOiBNaWxlc3RvbmVbXSB7XHJcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgZGVsZXRlZD0wIE9SREVSIEJZIHNvcnQsIHRhcmdldF9kYXRlJykuYWxsKCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcclxuICAgICAgaWQ6IFN0cmluZyhyLmlkKSwgbmFtZTogU3RyaW5nKHIubmFtZSksIGRlc2NyaXB0aW9uOiBTdHJpbmcoci5kZXNjcmlwdGlvbiksXHJcbiAgICAgIHRhcmdldERhdGU6IHIudGFyZ2V0X2RhdGUgPyBTdHJpbmcoci50YXJnZXRfZGF0ZSkgOiBudWxsLFxyXG4gICAgICBzdGF0dXM6IHIuc3RhdHVzIGFzIE1pbGVzdG9uZVsnc3RhdHVzJ10sIHNvcnQ6IE51bWJlcihyLnNvcnQpLCBzYW1wbGU6IE51bWJlcihyLnNhbXBsZSkgYXMgMCB8IDEsXHJcbiAgICAgIGNyZWF0ZWRBdDogci5jcmVhdGVkX2F0ID8gU3RyaW5nKHIuY3JlYXRlZF9hdCkgOiAnJywgY3JlYXRlZEJ5OiByLmNyZWF0ZWRfYnkgPyBTdHJpbmcoci5jcmVhdGVkX2J5KSA6ICcnLFxyXG4gICAgICB1cGRhdGVkQXQ6IHIudXBkYXRlZF9hdCA/IFN0cmluZyhyLnVwZGF0ZWRfYXQpIDogJycsIHVwZGF0ZWRCeTogci51cGRhdGVkX2J5ID8gU3RyaW5nKHIudXBkYXRlZF9ieSkgOiAnJyxcclxuICAgIH0pKTtcclxuICB9XHJcblxyXG4gIHVwc2VydFJlbGVhc2UobTogUGFydGlhbDxSZWxlYXNlPiAmIHsgbmFtZTogc3RyaW5nIH0pOiBSZWxlYXNlIHtcclxuICAgIGNvbnN0IGlkID0gbS5pZCA/PyBjcnlwdG8ucmFuZG9tVVVJRCgpO1xyXG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gcmVsZWFzZXMgV0hFUkUgaWQ9PycpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCBub3cgPSB0aGlzLm5vdygpO1xyXG4gICAgY29uc3QgY3JlYXRlZEF0ID0gZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuY3JlYXRlZF9hdCB8fCBub3cpIDogbm93O1xyXG4gICAgY29uc3QgY3JlYXRlZEJ5ID0gZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuY3JlYXRlZF9ieSB8fCB0aGlzLmFjdG9ySWQpIDogdGhpcy5hY3RvcklkO1xyXG4gICAgY29uc3QgcmVjOiBSZWxlYXNlID0ge1xyXG4gICAgICBpZCxcclxuICAgICAgbmFtZTogbS5uYW1lLFxyXG4gICAgICB2ZXJzaW9uOiBtLnZlcnNpb24gPz8gKGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLnZlcnNpb24pIDogJycpLFxyXG4gICAgICB0YXJnZXREYXRlOiBtLnRhcmdldERhdGUgPz8gKGV4aXN0aW5nID8gKGV4aXN0aW5nLnRhcmdldF9kYXRlIGFzIHN0cmluZyB8IG51bGwpIDogbnVsbCksXHJcbiAgICAgIHN0YXR1czogKG0uc3RhdHVzID8/IChleGlzdGluZyA/IGV4aXN0aW5nLnN0YXR1cyA6ICdwbGFubmVkJykpIGFzIFJlbGVhc2VbJ3N0YXR1cyddLFxyXG4gICAgICBnb2FsczogbS5nb2FscyA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuZ29hbHMpIDogJycpLFxyXG4gICAgICBub3RlczogbS5ub3RlcyA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3Rpbmcubm90ZXMpIDogJycpLFxyXG4gICAgICBzYW1wbGU6IG0uc2FtcGxlID8/IChleGlzdGluZyA/IChOdW1iZXIoZXhpc3Rpbmcuc2FtcGxlKSBhcyAwIHwgMSkgOiAwKSxcclxuICAgICAgY3JlYXRlZEF0LCBjcmVhdGVkQnksIHVwZGF0ZWRBdDogbm93LCB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCxcclxuICAgIH07XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICB0aGlzLmRiXHJcbiAgICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgICBgSU5TRVJUIElOVE8gcmVsZWFzZXMoaWQsIG5hbWUsIHZlcnNpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIGdvYWxzLCBub3Rlcywgc2FtcGxlLCBkZWxldGVkLCBjcmVhdGVkX2F0LCBjcmVhdGVkX2J5LCB1cGRhdGVkX2F0LCB1cGRhdGVkX2J5KVxyXG4gICAgICAgICAgICAgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPywwLD8sPyw/LD8pXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCB2ZXJzaW9uPT8sIHRhcmdldF9kYXRlPT8sIHN0YXR1cz0/LCBnb2Fscz0/LCBub3Rlcz0/LCBkZWxldGVkPTAsIHVwZGF0ZWRfYXQ9PywgdXBkYXRlZF9ieT0/YCxcclxuICAgICAgICApXHJcbiAgICAgICAgLnJ1bihyZWMuaWQsIHJlYy5uYW1lLCByZWMudmVyc2lvbiwgcmVjLnRhcmdldERhdGUsIHJlYy5zdGF0dXMsIHJlYy5nb2FscywgcmVjLm5vdGVzLCByZWMuc2FtcGxlLCBjcmVhdGVkQXQsIGNyZWF0ZWRCeSwgbm93LCB0aGlzLmFjdG9ySWQsXHJcbiAgICAgICAgICAgICByZWMubmFtZSwgcmVjLnZlcnNpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuZ29hbHMsIHJlYy5ub3Rlcywgbm93LCB0aGlzLmFjdG9ySWQpO1xyXG4gICAgICBpZiAoIWV4aXN0aW5nKSB7XHJcbiAgICAgICAgdGhpcy5sb2NhbENyZWF0ZSgncmVsZWFzZScsIGlkLCB7IC4uLnJlYyB9KTtcclxuICAgICAgICB0aGlzLmxvZ0FjdGl2aXR5KG51bGwsICdyZWxlYXNlX2NyZWF0ZWQnLCAncmVsZWFzZScsIG51bGwsIHJlYy5uYW1lKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmxvY2FsU2V0KCdyZWxlYXNlJywgaWQsIHsgbmFtZTogcmVjLm5hbWUsIHZlcnNpb246IHJlYy52ZXJzaW9uLCB0YXJnZXREYXRlOiByZWMudGFyZ2V0RGF0ZSwgc3RhdHVzOiByZWMuc3RhdHVzLCBnb2FsczogcmVjLmdvYWxzLCBub3RlczogcmVjLm5vdGVzLCB1cGRhdGVkQXQ6IG5vdywgdXBkYXRlZEJ5OiB0aGlzLmFjdG9ySWQgfSk7XHJcbiAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShudWxsLCAncmVsZWFzZV91cGRhdGVkJywgJ3JlbGVhc2UnLCBTdHJpbmcoZXhpc3RpbmcubmFtZSksIHJlYy5uYW1lKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdyZWxlYXNlJywgZW50aXR5SWQ6IGlkIH0pO1xyXG4gICAgcmV0dXJuIHJlYztcclxuICB9XHJcblxyXG4gIGxpc3RSZWxlYXNlcygpOiBSZWxlYXNlW10ge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSByZWxlYXNlcyBXSEVSRSBkZWxldGVkPTAgT1JERVIgQlkgdGFyZ2V0X2RhdGUnKS5hbGwoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xyXG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xyXG4gICAgICBpZDogU3RyaW5nKHIuaWQpLCBuYW1lOiBTdHJpbmcoci5uYW1lKSwgdmVyc2lvbjogU3RyaW5nKHIudmVyc2lvbiksXHJcbiAgICAgIHRhcmdldERhdGU6IHIudGFyZ2V0X2RhdGUgPyBTdHJpbmcoci50YXJnZXRfZGF0ZSkgOiBudWxsLFxyXG4gICAgICBzdGF0dXM6IHIuc3RhdHVzIGFzIFJlbGVhc2VbJ3N0YXR1cyddLCBnb2FsczogU3RyaW5nKHIuZ29hbHMpLCBub3RlczogU3RyaW5nKHIubm90ZXMpLFxyXG4gICAgICBzYW1wbGU6IE51bWJlcihyLnNhbXBsZSkgYXMgMCB8IDEsXHJcbiAgICAgIGNyZWF0ZWRBdDogci5jcmVhdGVkX2F0ID8gU3RyaW5nKHIuY3JlYXRlZF9hdCkgOiAnJywgY3JlYXRlZEJ5OiByLmNyZWF0ZWRfYnkgPyBTdHJpbmcoci5jcmVhdGVkX2J5KSA6ICcnLFxyXG4gICAgICB1cGRhdGVkQXQ6IHIudXBkYXRlZF9hdCA/IFN0cmluZyhyLnVwZGF0ZWRfYXQpIDogJycsIHVwZGF0ZWRCeTogci51cGRhdGVkX2J5ID8gU3RyaW5nKHIudXBkYXRlZF9ieSkgOiAnJyxcclxuICAgIH0pKTtcclxuICB9XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0gc2F2ZWQgdmlld3MgLS0tLS0tLS0tLVxyXG4gIHNhdmVWaWV3KHY6IFBhcnRpYWw8U2F2ZWRWaWV3PiAmIHsgbmFtZTogc3RyaW5nOyBjb25maWc6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0pOiBTYXZlZFZpZXcge1xyXG4gICAgY29uc3QgaWQgPSB2LmlkID8/IGNyeXB0by5yYW5kb21VVUlEKCk7XHJcbiAgICBjb25zdCByZWM6IFNhdmVkVmlldyA9IHtcclxuICAgICAgaWQsIG5hbWU6IHYubmFtZSwgY29uZmlnOiB2LmNvbmZpZywgcGlubmVkOiB2LnBpbm5lZCA/PyAwLFxyXG4gICAgICBjcmVhdGVkQnk6IHRoaXMuYWN0b3JJZCwgY3JlYXRlZEF0OiB0aGlzLm5vdygpLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIHNhdmVkX3ZpZXdzIFdIRVJFIGlkPT8nKS5nZXQoaWQpO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYlxyXG4gICAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgICAgYElOU0VSVCBJTlRPIHNhdmVkX3ZpZXdzKGlkLCBuYW1lLCBjb25maWcsIHBpbm5lZCwgY3JlYXRlZF9ieSwgY3JlYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LDApXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCBjb25maWc9PywgcGlubmVkPT8sIGRlbGV0ZWQ9MGAsXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC5ydW4oaWQsIHJlYy5uYW1lLCBKU09OLnN0cmluZ2lmeShyZWMuY29uZmlnKSwgcmVjLnBpbm5lZCwgcmVjLmNyZWF0ZWRCeSwgcmVjLmNyZWF0ZWRBdCxcclxuICAgICAgICAgICAgIHJlYy5uYW1lLCBKU09OLnN0cmluZ2lmeShyZWMuY29uZmlnKSwgcmVjLnBpbm5lZCk7XHJcbiAgICAgIGlmICghZXhpc3RpbmcpIHRoaXMubG9jYWxDcmVhdGUoJ3NhdmVkX3ZpZXcnLCBpZCwgeyAuLi5yZWMgfSk7XHJcbiAgICAgIGVsc2UgdGhpcy5sb2NhbFNldCgnc2F2ZWRfdmlldycsIGlkLCB7IG5hbWU6IHJlYy5uYW1lLCBjb25maWc6IHJlYy5jb25maWcsIHBpbm5lZDogcmVjLnBpbm5lZCB9KTtcclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIHJldHVybiByZWM7XHJcbiAgfVxyXG5cclxuICBsaXN0Vmlld3MoKTogU2F2ZWRWaWV3W10ge1xyXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBzYXZlZF92aWV3cyBXSEVSRSBkZWxldGVkPTAgT1JERVIgQlkgcGlubmVkIERFU0MsIG5hbWUnKS5hbGwoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xyXG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xyXG4gICAgICBpZDogU3RyaW5nKHIuaWQpLCBuYW1lOiBTdHJpbmcoci5uYW1lKSxcclxuICAgICAgY29uZmlnOiBKU09OLnBhcnNlKFN0cmluZyhyLmNvbmZpZykpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxyXG4gICAgICBwaW5uZWQ6IE51bWJlcihyLnBpbm5lZCkgYXMgMCB8IDEsIGNyZWF0ZWRCeTogU3RyaW5nKHIuY3JlYXRlZF9ieSksIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXHJcbiAgICB9KSk7XHJcbiAgfVxyXG5cclxuICBkZWxldGVWaWV3KGlkOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIG5hbWUgRlJPTSBzYXZlZF92aWV3cyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhcyB7IG5hbWU6IHN0cmluZyB9IHwgdW5kZWZpbmVkO1xyXG4gICAgY29uc3Qgc3RhbXAgPSB0aGlzLm5vdygpO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgc2F2ZWRfdmlld3MgU0VUIGRlbGV0ZWQ9MSwgZGVsZXRlZF9hdD0/LCBkZWxldGVkX2J5PT8gV0hFUkUgaWQ9PycpLnJ1bihzdGFtcCwgdGhpcy5hY3RvcklkLCBpZCk7XHJcbiAgICAgIHRoaXMubG9jYWxTZXQoJ3NhdmVkX3ZpZXcnLCBpZCwgeyBkZWxldGVkOiAxLCBkZWxldGVkQXQ6IHN0YW1wLCBkZWxldGVkQnk6IHRoaXMuYWN0b3JJZCB9KTtcclxuICAgICAgdGhpcy5sb2dBY3Rpdml0eShudWxsLCAndmlld19kZWxldGVkJywgJ3NhdmVkX3ZpZXcnLCByb3cgPyByb3cubmFtZSA6IG51bGwsIG51bGwpO1xyXG4gICAgfSk7XHJcbiAgICB0eCgpO1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBhY3Rpdml0eSAtLS0tLS0tLS0tXHJcbiAgYWN0aXZpdHlGb3IoaXRlbUlkOiBzdHJpbmcgfCBudWxsLCBsaW1pdCA9IDEwMCkge1xyXG4gICAgaWYgKGl0ZW1JZCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5kYlxyXG4gICAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgaWQsIGl0ZW1faWQgQVMgaXRlbUlkLCBhY3Rvcl9pZCBBUyBhY3RvcklkLCBraW5kLCBmaWVsZCwgb2xkX3ZhbHVlIEFTIG9sZFZhbHVlLCBuZXdfdmFsdWUgQVMgbmV3VmFsdWUsIGF0IEZST00gYWN0aXZpdHkgV0hFUkUgaXRlbV9pZD0/IE9SREVSIEJZIGF0IERFU0MgTElNSVQgPycpXHJcbiAgICAgICAgLmFsbChpdGVtSWQsIGxpbWl0KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgaWQsIGl0ZW1faWQgQVMgaXRlbUlkLCBhY3Rvcl9pZCBBUyBhY3RvcklkLCBraW5kLCBmaWVsZCwgb2xkX3ZhbHVlIEFTIG9sZFZhbHVlLCBuZXdfdmFsdWUgQVMgbmV3VmFsdWUsIGF0IEZST00gYWN0aXZpdHkgT1JERVIgQlkgYXQgREVTQyBMSU1JVCA/JylcclxuICAgICAgLmFsbChsaW1pdCk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIHJlbW90ZSBvcCBhcHBsaWNhdGlvbiAtLS0tLS0tLS0tXHJcbiAgLyoqIEFwcGx5IGEgYmF0Y2ggb2YgcmVtb3RlIG9wcyBpbnNpZGUgb25lIHRyYW5zYWN0aW9uLiBSZXR1cm5zIGNvdW50IGFwcGxpZWQgKG5vbi1kdXBsaWNhdGUpLiAqL1xyXG4gIGFwcGx5UmVtb3RlT3BzKG9wczogT3BbXSk6IG51bWJlciB7XHJcbiAgICBsZXQgYXBwbGllZCA9IDA7XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICBmb3IgKGNvbnN0IG9wIG9mIG9wcykge1xyXG4gICAgICAgIGlmIChvcC5kZXZpY2VJZCA9PT0gdGhpcy5kZXZpY2VJZCkgY29udGludWU7IC8vIG91ciBvd24gb3BzIGVjaG9lZCBiYWNrXHJcbiAgICAgICAgY29uc3QgZHVwID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIG9wbG9nIFdIRVJFIG9wX2lkPT8nKS5nZXQob3Aub3BJZCk7XHJcbiAgICAgICAgaWYgKGR1cCkgY29udGludWU7XHJcbiAgICAgICAgdGhpcy53aXRuZXNzTGFtcG9ydChvcC5sYW1wb3J0KTtcclxuICAgICAgICB0aGlzLmFwcGVuZE9wKG9wKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgdGhpcy5hcHBseVJlbW90ZU9wKG9wKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIC8vIFF1YXJhbnRpbmUgYSBwb2lzb24gb3AgaW5zdGVhZCBvZiB3ZWRnaW5nIHRoZSB3aG9sZSBpbXBvcnQ6IGl0IGlzIGFscmVhZHlcclxuICAgICAgICAgIC8vIHJlY29yZGVkIGluIHRoZSBvcGxvZyAoc28gaXQgd29uJ3QgcmV0cnkgZm9yZXZlcikgYW5kIGxvZ2dlZCBmb3IgZGlhZ25vc2lzLlxyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihgW3N5bmNdIGZhaWxlZCB0byBhcHBseSBvcCAke29wLm9wSWR9ICgke29wLmVudGl0eX0vJHtvcC5hY3Rpb259KTpgLCBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhcHBsaWVkKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgdHgoKTtcclxuICAgIGlmIChhcHBsaWVkID4gMCkgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICcqJywgZW50aXR5SWQ6ICcqJyB9KTtcclxuICAgIHJldHVybiBhcHBsaWVkO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhcHBseVJlbW90ZU9wKG9wOiBPcCk6IHZvaWQge1xyXG4gICAgc3dpdGNoIChvcC5hY3Rpb24pIHtcclxuICAgICAgY2FzZSAnY3JlYXRlJzpcclxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlQ3JlYXRlKG9wKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnc2V0JzpcclxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlU2V0KG9wKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnZGVsZXRlJzpcclxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlRGVsZXRlKG9wKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgdGFibGVGb3IoZW50aXR5OiBPcFsnZW50aXR5J10pOiBzdHJpbmcge1xyXG4gICAgc3dpdGNoIChlbnRpdHkpIHtcclxuICAgICAgY2FzZSAnaXRlbSc6IHJldHVybiAnaXRlbXMnO1xyXG4gICAgICBjYXNlICdsaW5rJzogcmV0dXJuICdsaW5rcyc7XHJcbiAgICAgIGNhc2UgJ2NvbW1lbnQnOiByZXR1cm4gJ2NvbW1lbnRzJztcclxuICAgICAgY2FzZSAnbWlsZXN0b25lJzogcmV0dXJuICdtaWxlc3RvbmVzJztcclxuICAgICAgY2FzZSAncmVsZWFzZSc6IHJldHVybiAncmVsZWFzZXMnO1xyXG4gICAgICBjYXNlICd1c2VyJzogcmV0dXJuICd1c2Vycyc7XHJcbiAgICAgIGNhc2UgJ3NhdmVkX3ZpZXcnOiByZXR1cm4gJ3NhdmVkX3ZpZXdzJztcclxuICAgICAgY2FzZSAnYXR0YWNobWVudCc6IHJldHVybiAnYXR0YWNobWVudHMnO1xyXG4gICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gZW50aXR5ICR7ZW50aXR5fWApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhcHBseVJlbW90ZUNyZWF0ZShvcDogT3ApOiB2b2lkIHtcclxuICAgIGNvbnN0IHJlY29yZCA9IG9wLnBheWxvYWQucmVjb3JkIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gICAgaWYgKCFyZWNvcmQpIHJldHVybjtcclxuICAgIGNvbnN0IHRhYmxlID0gdGhpcy50YWJsZUZvcihvcC5lbnRpdHkpO1xyXG4gICAgY29uc3QgZXhpc3RzID0gdGhpcy5kYi5wcmVwYXJlKGBTRUxFQ1QgMSBGUk9NICR7dGFibGV9IFdIRVJFIGlkPT9gKS5nZXQob3AuZW50aXR5SWQpO1xyXG4gICAgaWYgKGV4aXN0cykgcmV0dXJuOyAvLyBjcmVhdGUgaXMgaWRlbXBvdGVudCBwZXIgdXVpZFxyXG5cclxuICAgIGlmIChvcC5lbnRpdHkgPT09ICdpdGVtJykge1xyXG4gICAgICBsZXQgaXRlbSA9IHsgLi4uKHJlY29yZCBhcyB1bmtub3duIGFzIFdvcmtJdGVtKSB9O1xyXG4gICAgICAvLyBJZGVudCBjb2xsaXNpb246IGFub3RoZXIgaXRlbSAoZGlmZmVyZW50IHV1aWQpIGFscmVhZHkgaG9sZHMgdGhpcyBpZGVudC5cclxuICAgICAgLy8gRGV0ZXJtaW5pc3RpYyBydWxlIFx1MjAxNCB0aGUgc21hbGxlciB1dWlkIGtlZXBzIHRoZSBjb250ZXN0ZWQgaWRlbnQgXHUyMDE0IHNvIGJvdGhcclxuICAgICAgLy8gZGV2aWNlcyByZXNvbHZlIHRoZSBzYW1lIGNvbGxpc2lvbiBpZGVudGljYWxseSBhbmQgY29udmVyZ2Ugd2l0aG91dCBwaW5nLXBvbmcuXHJcbiAgICAgIGNvbnN0IGhvbGRlciA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkLCB0eXBlIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PycpLmdldChpdGVtLmlkZW50KSBhc1xyXG4gICAgICAgIHwgeyBpZDogc3RyaW5nOyB0eXBlOiBJdGVtVHlwZSB9XHJcbiAgICAgICAgfCB1bmRlZmluZWQ7XHJcbiAgICAgIGlmIChob2xkZXIgJiYgaG9sZGVyLmlkICE9PSBpdGVtLmlkKSB7XHJcbiAgICAgICAgaWYgKGl0ZW0uaWQgPCBob2xkZXIuaWQpIHtcclxuICAgICAgICAgIC8vIEluY29taW5nIGl0ZW0ga2VlcHMgdGhlIGlkZW50OyByZW51bWJlciB0aGUgbG9jYWwgaG9sZGVyIGFuZCBicm9hZGNhc3QuXHJcbiAgICAgICAgICBjb25zdCBidW1wZWQgPSB0aGlzLmFsbG9jSWRlbnQoaG9sZGVyLnR5cGUpO1xyXG4gICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShob2xkZXIuaWQsICdyZW51bWJlcmVkJywgJ2lkZW50JywgaXRlbS5pZGVudCwgYnVtcGVkKTtcclxuICAgICAgICAgIHRoaXMuYXBwbHlJdGVtRmllbGRzKGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xyXG4gICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xyXG4gICAgICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBuZXdJZGVudCA9IHRoaXMuYWxsb2NJZGVudChpdGVtLnR5cGUpO1xyXG4gICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShpdGVtLmlkLCAncmVudW1iZXJlZCcsICdpZGVudCcsIGl0ZW0uaWRlbnQsIG5ld0lkZW50KTtcclxuICAgICAgICAgIGl0ZW0gPSB7IC4uLml0ZW0sIGlkZW50OiBuZXdJZGVudCB9O1xyXG4gICAgICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xyXG4gICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGl0ZW0uaWQsIHsgaWRlbnQ6IG5ld0lkZW50IH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmluc2VydEl0ZW1Sb3coaXRlbSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy53aXRuZXNzSWRlbnQoaXRlbS50eXBlLCBpdGVtLmlkZW50KTtcclxuICAgICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKHJlY29yZCkpIHRoaXMuc2V0RmllbGRDbG9ja0lmTmV3ZXIoJ2l0ZW0nLCBpdGVtLmlkLCBmLCBvcC5sYW1wb3J0LCBvcC5kZXZpY2VJZCk7XHJcbiAgICAgIHRoaXMucmVwbGF5UGVuZGluZ09wcyhvcC5lbnRpdHksIG9wLmVudGl0eUlkKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdlbmVyaWMgaW5zZXJ0IGZvciBvdGhlciBlbnRpdGllcy5cclxuICAgIGNvbnN0IGluc2VydGVyczogUmVjb3JkPHN0cmluZywgKCkgPT4gdm9pZD4gPSB7XHJcbiAgICAgIGxpbms6ICgpID0+IHtcclxuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgSXRlbUxpbmsgJiB7IGRlbGV0ZWQ/OiBudW1iZXIgfTtcclxuICAgICAgICB0aGlzLmRiXHJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIGxpbmtzKGlkLCBmcm9tX2lkLCB0b19pZCwga2luZCwgZGVsZXRlZCwgY3JlYXRlZF9hdCwgY3JlYXRlZF9ieSkgVkFMVUVTKD8sPyw/LD8sPyw/LD8pJylcclxuICAgICAgICAgIC5ydW4oci5pZCwgci5mcm9tSWQsIHIudG9JZCwgci5raW5kLCByLmRlbGV0ZWQgPz8gMCwgci5jcmVhdGVkQXQsIHIuY3JlYXRlZEJ5KTtcclxuICAgICAgfSxcclxuICAgICAgY29tbWVudDogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBDb21tZW50O1xyXG4gICAgICAgIHRoaXMuZGJcclxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gY29tbWVudHMoaWQsIGl0ZW1faWQsIGF1dGhvcl9pZCwgYm9keSwgYm9keV90ZXh0LCBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/KScpXHJcbiAgICAgICAgICAucnVuKHIuaWQsIHIuaXRlbUlkLCByLmF1dGhvcklkLCByLmJvZHksIHIuYm9keVRleHQsIHIuY3JlYXRlZEF0LCByLnVwZGF0ZWRBdCwgci5kZWxldGVkID8/IDApO1xyXG4gICAgICB9LFxyXG4gICAgICBtaWxlc3RvbmU6ICgpID0+IHtcclxuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgTWlsZXN0b25lO1xyXG4gICAgICAgIHRoaXMuZGJcclxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gbWlsZXN0b25lcyhpZCwgbmFtZSwgZGVzY3JpcHRpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIHNvcnQsIHNhbXBsZSwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sMCknKVxyXG4gICAgICAgICAgLnJ1bihyLmlkLCByLm5hbWUsIHIuZGVzY3JpcHRpb24sIHIudGFyZ2V0RGF0ZSwgci5zdGF0dXMsIHIuc29ydCwgci5zYW1wbGUgPz8gMCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbGVhc2U6ICgpID0+IHtcclxuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgUmVsZWFzZTtcclxuICAgICAgICB0aGlzLmRiXHJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIHJlbGVhc2VzKGlkLCBuYW1lLCB2ZXJzaW9uLCB0YXJnZXRfZGF0ZSwgc3RhdHVzLCBnb2Fscywgbm90ZXMsIHNhbXBsZSwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPywwKScpXHJcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgci52ZXJzaW9uLCByLnRhcmdldERhdGUsIHIuc3RhdHVzLCByLmdvYWxzLCByLm5vdGVzLCByLnNhbXBsZSA/PyAwKTtcclxuICAgICAgfSxcclxuICAgICAgdXNlcjogKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBVc2VyO1xyXG4gICAgICAgIHRoaXMuZGJcclxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gdXNlcnMoaWQsIG5hbWUsIGluaXRpYWxzLCBjb2xvciwgYXZhdGFyLCBjcmVhdGVkX2F0KSBWQUxVRVMoPyw/LD8sPyw/LD8pJylcclxuICAgICAgICAgIC5ydW4oci5pZCwgci5uYW1lLCByLmluaXRpYWxzLCByLmNvbG9yLCByLmF2YXRhciA/PyBudWxsLCByLmNyZWF0ZWRBdCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHNhdmVkX3ZpZXc6ICgpID0+IHtcclxuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgU2F2ZWRWaWV3O1xyXG4gICAgICAgIHRoaXMuZGJcclxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gc2F2ZWRfdmlld3MoaWQsIG5hbWUsIGNvbmZpZywgcGlubmVkLCBjcmVhdGVkX2J5LCBjcmVhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sMCknKVxyXG4gICAgICAgICAgLnJ1bihyLmlkLCByLm5hbWUsIEpTT04uc3RyaW5naWZ5KHIuY29uZmlnKSwgci5waW5uZWQsIHIuY3JlYXRlZEJ5LCByLmNyZWF0ZWRBdCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGF0dGFjaG1lbnQ6ICgpID0+IHtcclxuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgaW1wb3J0KCcuLi8uLi9zaGFyZWQvdHlwZXMnKS5BdHRhY2htZW50O1xyXG4gICAgICAgIHRoaXMuZGJcclxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gYXR0YWNobWVudHMoaWQsIGl0ZW1faWQsIGZpbGVuYW1lLCBtaW1lLCBzaXplLCBzaGEyNTYsIGRlc2NyaXB0aW9uLCB1cGxvYWRlZF9ieSwgY3JlYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyw/LD8pJylcclxuICAgICAgICAgIC5ydW4oci5pZCwgci5pdGVtSWQsIHIuZmlsZW5hbWUsIHIubWltZSwgci5zaXplLCByLnNoYTI1Niwgci5kZXNjcmlwdGlvbiwgci51cGxvYWRlZEJ5LCByLmNyZWF0ZWRBdCwgci5kZWxldGVkID8/IDApO1xyXG4gICAgICB9LFxyXG4gICAgfTtcclxuICAgIGluc2VydGVyc1tvcC5lbnRpdHldPy4oKTtcclxuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhyZWNvcmQpKSB0aGlzLnNldEZpZWxkQ2xvY2tJZk5ld2VyKG9wLmVudGl0eSwgb3AuZW50aXR5SWQsIGYsIG9wLmxhbXBvcnQsIG9wLmRldmljZUlkKTtcclxuICAgIHRoaXMucmVwbGF5UGVuZGluZ09wcyhvcC5lbnRpdHksIG9wLmVudGl0eUlkKTtcclxuICB9XHJcblxyXG4gIC8qKiBTZXQgYSBmaWVsZCBjbG9jayBvbmx5IGlmIHRoZSBpbmNvbWluZyB3cml0ZSBpcyBuZXdlciBcdTIwMTQgY3JlYXRlcyBtdXN0IG5ldmVyXHJcbiAgICAgIHJlZ3Jlc3MgY2xvY2tzIHN0YW1wZWQgYnkgYnVmZmVyZWQvZWFybGllci1hcnJpdmluZyBzZXRzLiAqL1xyXG4gIHByaXZhdGUgc2V0RmllbGRDbG9ja0lmTmV3ZXIoZW50aXR5OiBzdHJpbmcsIGVudGl0eUlkOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIGxhbXBvcnQ6IG51bWJlciwgZGV2aWNlSWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgY29uc3QgY3VyID0gdGhpcy5maWVsZENsb2NrKGVudGl0eSwgZW50aXR5SWQsIGZpZWxkKTtcclxuICAgIGlmIChjdXIgJiYgKGN1ci5sYW1wb3J0ID4gbGFtcG9ydCB8fCAoY3VyLmxhbXBvcnQgPT09IGxhbXBvcnQgJiYgY3VyLmRldmljZUlkID4gZGV2aWNlSWQpKSkgcmV0dXJuO1xyXG4gICAgdGhpcy5zZXRGaWVsZENsb2NrKGVudGl0eSwgZW50aXR5SWQsIGZpZWxkLCBsYW1wb3J0LCBkZXZpY2VJZCk7XHJcbiAgfVxyXG5cclxuICAvKiogQnVmZmVyIGFuIG9wIHRoYXQgYXJyaXZlZCBiZWZvcmUgaXRzIHRhcmdldCdzIGNyZWF0ZSAoMysgZGV2aWNlIHJlb3JkZXJpbmcpLiAqL1xyXG4gIHByaXZhdGUgYnVmZmVyUGVuZGluZ09wKG9wOiBPcCk6IHZvaWQge1xyXG4gICAgdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZShcclxuICAgICAgICBgSU5TRVJUIE9SIElHTk9SRSBJTlRPIHBlbmRpbmdfb3BzKG9wX2lkLCBkZXZpY2VfaWQsIGFjdG9yX2lkLCBsYW1wb3J0LCBhdCwgZW50aXR5LCBlbnRpdHlfaWQsIGFjdGlvbiwgcGF5bG9hZClcclxuICAgICAgICAgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyw/KWAsXHJcbiAgICAgIClcclxuICAgICAgLnJ1bihvcC5vcElkLCBvcC5kZXZpY2VJZCwgb3AuYWN0b3JJZCwgb3AubGFtcG9ydCwgb3AuYXQsIG9wLmVudGl0eSwgb3AuZW50aXR5SWQsIG9wLmFjdGlvbiwgSlNPTi5zdHJpbmdpZnkob3AucGF5bG9hZCkpO1xyXG4gIH1cclxuXHJcbiAgLyoqIFJlcGxheSBidWZmZXJlZCBzZXRzL2RlbGV0ZXMgZm9yIGFuIGVudGl0eSBvbmNlIGl0cyBjcmVhdGUgaGFzIGxhbmRlZC4gKi9cclxuICBwcml2YXRlIHJlcGxheVBlbmRpbmdPcHMoZW50aXR5OiBPcFsnZW50aXR5J10sIGVudGl0eUlkOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHBlbmRpbmdfb3BzIFdIRVJFIGVudGl0eT0/IEFORCBlbnRpdHlfaWQ9PyBPUkRFUiBCWSBsYW1wb3J0LCBkZXZpY2VfaWQnKVxyXG4gICAgICAuYWxsKGVudGl0eSwgZW50aXR5SWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XHJcbiAgICBpZiAocm93cy5sZW5ndGggPT09IDApIHJldHVybjtcclxuICAgIHRoaXMuZGIucHJlcGFyZSgnREVMRVRFIEZST00gcGVuZGluZ19vcHMgV0hFUkUgZW50aXR5PT8gQU5EIGVudGl0eV9pZD0/JykucnVuKGVudGl0eSwgZW50aXR5SWQpO1xyXG4gICAgZm9yIChjb25zdCByIG9mIHJvd3MpIHtcclxuICAgICAgdGhpcy5hcHBseVJlbW90ZU9wKHtcclxuICAgICAgICBvcElkOiBTdHJpbmcoci5vcF9pZCksIGRldmljZUlkOiBTdHJpbmcoci5kZXZpY2VfaWQpLCBhY3RvcklkOiBTdHJpbmcoci5hY3Rvcl9pZCksXHJcbiAgICAgICAgbGFtcG9ydDogTnVtYmVyKHIubGFtcG9ydCksIGF0OiBTdHJpbmcoci5hdCksIGVudGl0eTogci5lbnRpdHkgYXMgT3BbJ2VudGl0eSddLFxyXG4gICAgICAgIGVudGl0eUlkOiBTdHJpbmcoci5lbnRpdHlfaWQpLCBhY3Rpb246IHIuYWN0aW9uIGFzIE9wWydhY3Rpb24nXSxcclxuICAgICAgICBwYXlsb2FkOiBKU09OLnBhcnNlKFN0cmluZyhyLnBheWxvYWQpKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFwcGx5UmVtb3RlU2V0KG9wOiBPcCk6IHZvaWQge1xyXG4gICAgLy8gVGFyZ2V0IHJvdyBtYXkgbm90IGV4aXN0IHlldCAob3BzIGZyb20gYSB0aGlyZCBkZXZpY2UgY2FuIGFycml2ZSBiZWZvcmUgdGhlXHJcbiAgICAvLyBvcmlnaW5hdGluZyBkZXZpY2UncyBjcmVhdGUpIFx1MjAxNCBidWZmZXIgYW5kIHJlcGxheSBhZnRlciB0aGUgY3JlYXRlLlxyXG4gICAgY29uc3Qgcm93RXhpc3RzID0gdGhpcy5kYi5wcmVwYXJlKGBTRUxFQ1QgMSBGUk9NICR7dGhpcy50YWJsZUZvcihvcC5lbnRpdHkpfSBXSEVSRSBpZD0/YCkuZ2V0KG9wLmVudGl0eUlkKTtcclxuICAgIGlmICghcm93RXhpc3RzKSB7XHJcbiAgICAgIHRoaXMuYnVmZmVyUGVuZGluZ09wKG9wKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZmllbGRzID0gKG9wLnBheWxvYWQuZmllbGRzID8/IHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICAgIGNvbnN0IGJhc2VkT24gPSAob3AucGF5bG9hZC5iYXNlZE9uID8/IHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCB7IGxhbXBvcnQ6IG51bWJlcjsgZGV2aWNlSWQ6IHN0cmluZyB9IHwgbnVsbD47XHJcbiAgICBjb25zdCB3aW5uaW5nOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xyXG5cclxuICAgIGZvciAoY29uc3QgW2ZpZWxkLCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZmllbGRzKSkge1xyXG4gICAgICBjb25zdCBsb2NhbCA9IHRoaXMuZmllbGRDbG9jayhvcC5lbnRpdHksIG9wLmVudGl0eUlkLCBmaWVsZCk7XHJcbiAgICAgIGNvbnN0IGJhc2UgPSBiYXNlZE9uW2ZpZWxkXSA/PyBudWxsO1xyXG5cclxuICAgICAgbGV0IHJlbW90ZVdpbnM6IGJvb2xlYW47XHJcbiAgICAgIGxldCBjb25jdXJyZW50ID0gZmFsc2U7XHJcbiAgICAgIGlmICghbG9jYWwpIHtcclxuICAgICAgICByZW1vdGVXaW5zID0gdHJ1ZTtcclxuICAgICAgfSBlbHNlIGlmIChiYXNlICYmIGJhc2UubGFtcG9ydCA9PT0gbG9jYWwubGFtcG9ydCAmJiBiYXNlLmRldmljZUlkID09PSBsb2NhbC5kZXZpY2VJZCkge1xyXG4gICAgICAgIHJlbW90ZVdpbnMgPSB0cnVlOyAvLyBjbGVhbiBjYXVzYWwgdXBkYXRlOiByZW1vdGUgc2F3IGV4YWN0bHkgb3VyIGN1cnJlbnQgdmFsdWVcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25jdXJyZW50ID0gdHJ1ZTtcclxuICAgICAgICByZW1vdGVXaW5zID0gb3AubGFtcG9ydCA+IGxvY2FsLmxhbXBvcnQgfHwgKG9wLmxhbXBvcnQgPT09IGxvY2FsLmxhbXBvcnQgJiYgb3AuZGV2aWNlSWQgPiBsb2NhbC5kZXZpY2VJZCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjb25jdXJyZW50ICYmIENPTkZMSUNUX1NVUkZBQ0VEX0ZJRUxEUy5oYXMoZmllbGQpICYmIG9wLmVudGl0eSA9PT0gJ2l0ZW0nKSB7XHJcbiAgICAgICAgY29uc3QgY3VyID0gdGhpcy5kYlxyXG4gICAgICAgICAgLnByZXBhcmUoYFNFTEVDVCAke0lURU1fQ09MU1tmaWVsZF19IEFTIHYgRlJPTSBpdGVtcyBXSEVSRSBpZD0/YClcclxuICAgICAgICAgIC5nZXQob3AuZW50aXR5SWQpIGFzIHsgdjogdW5rbm93biB9IHwgdW5kZWZpbmVkO1xyXG4gICAgICAgIGNvbnN0IGxvY2FsVmFsID0gY3VyID8gU3RyaW5nKGN1ci52ID8/ICcnKSA6ICcnO1xyXG4gICAgICAgIGNvbnN0IHJlbW90ZVZhbCA9IFN0cmluZyh2YWx1ZSA/PyAnJyk7XHJcbiAgICAgICAgaWYgKGxvY2FsVmFsICE9PSByZW1vdGVWYWwpIHtcclxuICAgICAgICAgIGNvbnN0IGNvbmZsaWN0OiBTeW5jQ29uZmxpY3QgPSB7XHJcbiAgICAgICAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxyXG4gICAgICAgICAgICBlbnRpdHk6IG9wLmVudGl0eSxcclxuICAgICAgICAgICAgZW50aXR5SWQ6IG9wLmVudGl0eUlkLFxyXG4gICAgICAgICAgICBmaWVsZCxcclxuICAgICAgICAgICAgbG9jYWxWYWx1ZTogbG9jYWxWYWwsXHJcbiAgICAgICAgICAgIHJlbW90ZVZhbHVlOiByZW1vdGVWYWwsXHJcbiAgICAgICAgICAgIHJlbW90ZURldmljZTogb3AuZGV2aWNlSWQsXHJcbiAgICAgICAgICAgIHJlbW90ZUFjdG9yOiBvcC5hY3RvcklkLFxyXG4gICAgICAgICAgICBkZXRlY3RlZEF0OiB0aGlzLm5vdygpLFxyXG4gICAgICAgICAgICByZXNvbHZlZEF0OiBudWxsLFxyXG4gICAgICAgICAgICByZXNvbHV0aW9uOiBudWxsLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHRoaXMuZGJcclxuICAgICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIHN5bmNfY29uZmxpY3RzKGlkLCBlbnRpdHksIGVudGl0eV9pZCwgZmllbGQsIGxvY2FsX3ZhbHVlLCByZW1vdGVfdmFsdWUsIHJlbW90ZV9kZXZpY2UsIHJlbW90ZV9hY3RvciwgZGV0ZWN0ZWRfYXQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPyknKVxyXG4gICAgICAgICAgICAucnVuKGNvbmZsaWN0LmlkLCBjb25mbGljdC5lbnRpdHksIGNvbmZsaWN0LmVudGl0eUlkLCBjb25mbGljdC5maWVsZCwgY29uZmxpY3QubG9jYWxWYWx1ZSwgY29uZmxpY3QucmVtb3RlVmFsdWUsIGNvbmZsaWN0LnJlbW90ZURldmljZSwgY29uZmxpY3QucmVtb3RlQWN0b3IsIGNvbmZsaWN0LmRldGVjdGVkQXQpO1xyXG4gICAgICAgICAgdGhpcy5ldmVudHMub25Db25mbGljdChjb25mbGljdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAocmVtb3RlV2lucykge1xyXG4gICAgICAgIHdpbm5pbmdbZmllbGRdID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy5zZXRGaWVsZENsb2NrKG9wLmVudGl0eSwgb3AuZW50aXR5SWQsIGZpZWxkLCBvcC5sYW1wb3J0LCBvcC5kZXZpY2VJZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoT2JqZWN0LmtleXMod2lubmluZykubGVuZ3RoID09PSAwKSByZXR1cm47XHJcblxyXG4gICAgaWYgKG9wLmVudGl0eSA9PT0gJ2l0ZW0nKSB7XHJcbiAgICAgIC8vIElkZW50IHNldCBtYXkgY29sbGlkZSBsb2NhbGx5IFx1MjAxNCByZXNvbHZlIHdpdGggdGhlIHNhbWUgc21hbGxlci11dWlkLWtlZXBzIHJ1bGUuXHJcbiAgICAgIGlmICgnaWRlbnQnIGluIHdpbm5pbmcpIHtcclxuICAgICAgICBjb25zdCBob2xkZXIgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpZCwgdHlwZSBGUk9NIGl0ZW1zIFdIRVJFIGlkZW50PT8nKS5nZXQoU3RyaW5nKHdpbm5pbmcuaWRlbnQpKSBhc1xyXG4gICAgICAgICAgfCB7IGlkOiBzdHJpbmc7IHR5cGU6IEl0ZW1UeXBlIH1cclxuICAgICAgICAgIHwgdW5kZWZpbmVkO1xyXG4gICAgICAgIGNvbnN0IGN1ciA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIHR5cGUgRlJPTSBpdGVtcyBXSEVSRSBpZD0/JykuZ2V0KG9wLmVudGl0eUlkKSBhcyB7IHR5cGU6IEl0ZW1UeXBlIH0gfCB1bmRlZmluZWQ7XHJcbiAgICAgICAgaWYgKGhvbGRlciAmJiBob2xkZXIuaWQgIT09IG9wLmVudGl0eUlkICYmIGN1cikge1xyXG4gICAgICAgICAgaWYgKG9wLmVudGl0eUlkIDwgaG9sZGVyLmlkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1bXBlZCA9IHRoaXMuYWxsb2NJZGVudChob2xkZXIudHlwZSk7XHJcbiAgICAgICAgICAgIHRoaXMubG9nQWN0aXZpdHkoaG9sZGVyLmlkLCAncmVudW1iZXJlZCcsICdpZGVudCcsIFN0cmluZyh3aW5uaW5nLmlkZW50KSwgYnVtcGVkKTtcclxuICAgICAgICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoaG9sZGVyLmlkLCB7IGlkZW50OiBidW1wZWQgfSk7XHJcbiAgICAgICAgICAgIHRoaXMubG9jYWxTZXQoJ2l0ZW0nLCBob2xkZXIuaWQsIHsgaWRlbnQ6IGJ1bXBlZCB9KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1bXBlZCA9IHRoaXMuYWxsb2NJZGVudChjdXIudHlwZSk7XHJcbiAgICAgICAgICAgIHdpbm5pbmcuaWRlbnQgPSBidW1wZWQ7XHJcbiAgICAgICAgICAgIHRoaXMubG9jYWxTZXQoJ2l0ZW0nLCBvcC5lbnRpdHlJZCwgeyBpZGVudDogYnVtcGVkIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoY3VyKSB7XHJcbiAgICAgICAgICB0aGlzLndpdG5lc3NJZGVudChjdXIudHlwZSwgU3RyaW5nKHdpbm5pbmcuaWRlbnQpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMob3AuZW50aXR5SWQsIHdpbm5pbmcpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2VuZXJpYyBjb2x1bW4gdXBkYXRlIGZvciBvdGhlciBlbnRpdGllcy5cclxuICAgIGNvbnN0IGNvbE1hcDogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nPj4gPSB7XHJcbiAgICAgIGxpbms6IHsgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXHJcbiAgICAgIGNvbW1lbnQ6IHsgYm9keTogJ2JvZHknLCBib2R5VGV4dDogJ2JvZHlfdGV4dCcsIHVwZGF0ZWRBdDogJ3VwZGF0ZWRfYXQnLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcclxuICAgICAgbWlsZXN0b25lOiB7IG5hbWU6ICduYW1lJywgZGVzY3JpcHRpb246ICdkZXNjcmlwdGlvbicsIHRhcmdldERhdGU6ICd0YXJnZXRfZGF0ZScsIHN0YXR1czogJ3N0YXR1cycsIHNvcnQ6ICdzb3J0JywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXHJcbiAgICAgIHJlbGVhc2U6IHsgbmFtZTogJ25hbWUnLCB2ZXJzaW9uOiAndmVyc2lvbicsIHRhcmdldERhdGU6ICd0YXJnZXRfZGF0ZScsIHN0YXR1czogJ3N0YXR1cycsIGdvYWxzOiAnZ29hbHMnLCBub3RlczogJ25vdGVzJywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXHJcbiAgICAgIHVzZXI6IHsgbmFtZTogJ25hbWUnLCBpbml0aWFsczogJ2luaXRpYWxzJywgY29sb3I6ICdjb2xvcicsIGF2YXRhcjogJ2F2YXRhcicgfSxcclxuICAgICAgc2F2ZWRfdmlldzogeyBuYW1lOiAnbmFtZScsIGNvbmZpZzogJ2NvbmZpZycsIHBpbm5lZDogJ3Bpbm5lZCcsIGRlbGV0ZWQ6ICdkZWxldGVkJyB9LFxyXG4gICAgICBhdHRhY2htZW50OiB7IGRlc2NyaXB0aW9uOiAnZGVzY3JpcHRpb24nLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcclxuICAgIH07XHJcbiAgICBjb25zdCBtYXAgPSBjb2xNYXBbb3AuZW50aXR5XTtcclxuICAgIGlmICghbWFwKSByZXR1cm47XHJcbiAgICBjb25zdCBzZXRzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgY29uc3QgdmFsczogdW5rbm93bltdID0gW107XHJcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyh3aW5uaW5nKSkge1xyXG4gICAgICBjb25zdCBjb2wgPSBtYXBba107XHJcbiAgICAgIGlmICghY29sKSBjb250aW51ZTtcclxuICAgICAgc2V0cy5wdXNoKGAke2NvbH09P2ApO1xyXG4gICAgICB2YWxzLnB1c2goayA9PT0gJ2NvbmZpZycgPyBKU09OLnN0cmluZ2lmeSh2KSA6IHYpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFzZXRzLmxlbmd0aCkgcmV0dXJuO1xyXG4gICAgdmFscy5wdXNoKG9wLmVudGl0eUlkKTtcclxuICAgIHRoaXMuZGIucHJlcGFyZShgVVBEQVRFICR7dGhpcy50YWJsZUZvcihvcC5lbnRpdHkpfSBTRVQgJHtzZXRzLmpvaW4oJywgJyl9IFdIRVJFIGlkPT9gKS5ydW4oLi4udmFscyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFwcGx5UmVtb3RlRGVsZXRlKG9wOiBPcCk6IHZvaWQge1xyXG4gICAgY29uc3QgdGFibGUgPSB0aGlzLnRhYmxlRm9yKG9wLmVudGl0eSk7XHJcbiAgICBjb25zdCByb3dFeGlzdHMgPSB0aGlzLmRiLnByZXBhcmUoYFNFTEVDVCAxIEZST00gJHt0YWJsZX0gV0hFUkUgaWQ9P2ApLmdldChvcC5lbnRpdHlJZCk7XHJcbiAgICBpZiAoIXJvd0V4aXN0cykge1xyXG4gICAgICAvLyBEZWxldGUgYXJyaXZlZCBiZWZvcmUgdGhlIGNyZWF0ZSAoMysgZGV2aWNlIHJlb3JkZXJpbmcpIFx1MjAxNCBidWZmZXIgaXQgc28gdGhlXHJcbiAgICAgIC8vIGNyZWF0ZSdzIHJlcGxheSBhcHBsaWVzIGl0IGluc3RlYWQgb2YgcmVzdXJyZWN0aW5nIHRoZSBpdGVtLlxyXG4gICAgICB0aGlzLmJ1ZmZlclBlbmRpbmdPcChvcCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuZGIucHJlcGFyZShgVVBEQVRFICR7dGFibGV9IFNFVCBkZWxldGVkPTEgV0hFUkUgaWQ9P2ApLnJ1bihvcC5lbnRpdHlJZCk7XHJcbiAgICB0aGlzLnNldEZpZWxkQ2xvY2sob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgJ2RlbGV0ZWQnLCBvcC5sYW1wb3J0LCBvcC5kZXZpY2VJZCk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIGNvbmZsaWN0cyAtLS0tLS0tLS0tXHJcbiAgbGlzdENvbmZsaWN0cyhvcGVuT25seSA9IHRydWUpOiBTeW5jQ29uZmxpY3RbXSB7XHJcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxyXG4gICAgICAucHJlcGFyZShgU0VMRUNUICogRlJPTSBzeW5jX2NvbmZsaWN0cyAke29wZW5Pbmx5ID8gJ1dIRVJFIHJlc29sdmVkX2F0IElTIE5VTEwnIDogJyd9IE9SREVSIEJZIGRldGVjdGVkX2F0IERFU0NgKVxyXG4gICAgICAuYWxsKCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcclxuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcclxuICAgICAgaWQ6IFN0cmluZyhyLmlkKSwgZW50aXR5OiBTdHJpbmcoci5lbnRpdHkpLCBlbnRpdHlJZDogU3RyaW5nKHIuZW50aXR5X2lkKSwgZmllbGQ6IFN0cmluZyhyLmZpZWxkKSxcclxuICAgICAgbG9jYWxWYWx1ZTogU3RyaW5nKHIubG9jYWxfdmFsdWUpLCByZW1vdGVWYWx1ZTogU3RyaW5nKHIucmVtb3RlX3ZhbHVlKSxcclxuICAgICAgcmVtb3RlRGV2aWNlOiBTdHJpbmcoci5yZW1vdGVfZGV2aWNlKSwgcmVtb3RlQWN0b3I6IFN0cmluZyhyLnJlbW90ZV9hY3RvciksXHJcbiAgICAgIGRldGVjdGVkQXQ6IFN0cmluZyhyLmRldGVjdGVkX2F0KSxcclxuICAgICAgcmVzb2x2ZWRBdDogci5yZXNvbHZlZF9hdCA/IFN0cmluZyhyLnJlc29sdmVkX2F0KSA6IG51bGwsXHJcbiAgICAgIHJlc29sdXRpb246IChyLnJlc29sdXRpb24gYXMgU3luY0NvbmZsaWN0WydyZXNvbHV0aW9uJ10pID8/IG51bGwsXHJcbiAgICB9KSk7XHJcbiAgfVxyXG5cclxuICByZXNvbHZlQ29uZmxpY3QoaWQ6IHN0cmluZywgcmVzb2x1dGlvbjogJ2xvY2FsJyB8ICdyZW1vdGUnIHwgJ21lcmdlZCcsIG1lcmdlZFZhbHVlPzogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gc3luY19jb25mbGljdHMgV0hFUkUgaWQ9PycpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XHJcbiAgICBpZiAoIXJvdykgcmV0dXJuO1xyXG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcclxuICAgICAgY29uc3QgdmFsdWUgPVxyXG4gICAgICAgIHJlc29sdXRpb24gPT09ICdtZXJnZWQnID8gKG1lcmdlZFZhbHVlID8/ICcnKSA6IHJlc29sdXRpb24gPT09ICdsb2NhbCcgPyBTdHJpbmcocm93LmxvY2FsX3ZhbHVlKSA6IFN0cmluZyhyb3cucmVtb3RlX3ZhbHVlKTtcclxuICAgICAgaWYgKFN0cmluZyhyb3cuZW50aXR5KSA9PT0gJ2l0ZW0nKSB7XHJcbiAgICAgICAgY29uc3QgZmllbGQgPSBTdHJpbmcocm93LmZpZWxkKTtcclxuICAgICAgICBjb25zdCBzdGFtcCA9IHRoaXMubm93KCk7XHJcbiAgICAgICAgY29uc3QgZmllbGRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHsgW2ZpZWxkXTogdmFsdWUsIHVwZGF0ZWRBdDogc3RhbXAsIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH07XHJcbiAgICAgICAgLy8gUmVzb2x2aW5nIGEgYm9keSBjb25mbGljdCBtdXN0IGFsc28gcmVmcmVzaCB0aGUgc2VhcmNoLXRleHQgcHJvamVjdGlvbi5cclxuICAgICAgICBpZiAoZmllbGQgPT09ICdib2R5JykgZmllbGRzLmJvZHlUZXh0ID0gZG9jVG9UZXh0KHZhbHVlKTtcclxuICAgICAgICB0aGlzLmFwcGx5SXRlbUZpZWxkcyhTdHJpbmcocm93LmVudGl0eV9pZCksIGZpZWxkcyk7XHJcbiAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIFN0cmluZyhyb3cuZW50aXR5X2lkKSwgZmllbGRzKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBzeW5jX2NvbmZsaWN0cyBTRVQgcmVzb2x2ZWRfYXQ9PywgcmVzb2x1dGlvbj0/LCByZXNvbHZlZF9ieT0/IFdIRVJFIGlkPT8nKS5ydW4odGhpcy5ub3coKSwgcmVzb2x1dGlvbiwgdGhpcy5hY3RvcklkLCBpZCk7XHJcbiAgICB9KTtcclxuICAgIHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogU3RyaW5nKHJvdy5lbnRpdHkpLCBlbnRpdHlJZDogU3RyaW5nKHJvdy5lbnRpdHlfaWQpIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tLS0tLS0tLSBzeW5jIGV4cG9ydCBoZWxwZXJzIC0tLS0tLS0tLS1cclxuICBvcHNTaW5jZShzZXE6IG51bWJlciwgb3duT25seSA9IHRydWUpOiB7IHNlcTogbnVtYmVyOyBvcDogT3AgfVtdIHtcclxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXHJcbiAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgIGBTRUxFQ1Qgc2VxLCBvcF9pZCwgZGV2aWNlX2lkLCBhY3Rvcl9pZCwgbGFtcG9ydCwgYXQsIGVudGl0eSwgZW50aXR5X2lkLCBhY3Rpb24sIHBheWxvYWRcclxuICAgICAgICAgRlJPTSBvcGxvZyBXSEVSRSBzZXEgPiA/ICR7b3duT25seSA/ICdBTkQgZGV2aWNlX2lkID0gPycgOiAnJ30gT1JERVIgQlkgc2VxIEFTQ2AsXHJcbiAgICAgIClcclxuICAgICAgLmFsbCguLi4ob3duT25seSA/IFtzZXEsIHRoaXMuZGV2aWNlSWRdIDogW3NlcV0pKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xyXG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xyXG4gICAgICBzZXE6IE51bWJlcihyLnNlcSksXHJcbiAgICAgIG9wOiB7XHJcbiAgICAgICAgb3BJZDogU3RyaW5nKHIub3BfaWQpLCBkZXZpY2VJZDogU3RyaW5nKHIuZGV2aWNlX2lkKSwgYWN0b3JJZDogU3RyaW5nKHIuYWN0b3JfaWQpLFxyXG4gICAgICAgIGxhbXBvcnQ6IE51bWJlcihyLmxhbXBvcnQpLCBhdDogU3RyaW5nKHIuYXQpLCBlbnRpdHk6IHIuZW50aXR5IGFzIE9wWydlbnRpdHknXSxcclxuICAgICAgICBlbnRpdHlJZDogU3RyaW5nKHIuZW50aXR5X2lkKSwgYWN0aW9uOiByLmFjdGlvbiBhcyBPcFsnYWN0aW9uJ10sXHJcbiAgICAgICAgcGF5bG9hZDogSlNPTi5wYXJzZShTdHJpbmcoci5wYXlsb2FkKSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXHJcbiAgICAgIH0sXHJcbiAgICB9KSk7XHJcbiAgfVxyXG5cclxuICAvLyAtLS0tLS0tLS0tIHNhbXBsZSBkYXRhIC0tLS0tLS0tLS1cclxuICByZW1vdmVTYW1wbGVEYXRhKCk6IG51bWJlciB7XHJcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xyXG4gICAgICBjb25zdCBpZHMgPSAodGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaWQgRlJPTSBpdGVtcyBXSEVSRSBzYW1wbGU9MSBBTkQgZGVsZXRlZD0wJykuYWxsKCkgYXMgeyBpZDogc3RyaW5nIH1bXSkubWFwKChyKSA9PiByLmlkKTtcclxuICAgICAgZm9yIChjb25zdCBpZCBvZiBpZHMpIHRoaXMuZGVsZXRlSXRlbShpZCk7XHJcbiAgICAgIGZvciAoY29uc3QgbSBvZiB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpZCBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pIHtcclxuICAgICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBtaWxlc3RvbmVzIFNFVCBkZWxldGVkPTEgV0hFUkUgaWQ9PycpLnJ1bihtLmlkKTtcclxuICAgICAgICB0aGlzLmxvY2FsU2V0KCdtaWxlc3RvbmUnLCBtLmlkLCB7IGRlbGV0ZWQ6IDEgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZm9yIChjb25zdCByZWwgb2YgdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaWQgRlJPTSByZWxlYXNlcyBXSEVSRSBzYW1wbGU9MSBBTkQgZGVsZXRlZD0wJykuYWxsKCkgYXMgeyBpZDogc3RyaW5nIH1bXSkge1xyXG4gICAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIHJlbGVhc2VzIFNFVCBkZWxldGVkPTEgV0hFUkUgaWQ9PycpLnJ1bihyZWwuaWQpO1xyXG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ3JlbGVhc2UnLCByZWwuaWQsIHsgZGVsZXRlZDogMSB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gaWRzLmxlbmd0aDtcclxuICAgIH0pO1xyXG4gICAgY29uc3QgbiA9IHR4KCk7XHJcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJyonLCBlbnRpdHlJZDogJyonIH0pO1xyXG4gICAgcmV0dXJuIG47XHJcbiAgfVxyXG59XHJcblxyXG4vLyAtLS0tLS0tLS0tIHJvdyBtYXBwZXJzIC0tLS0tLS0tLS1cclxuZXhwb3J0IGZ1bmN0aW9uIHJvd1RvSXRlbShyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFdvcmtJdGVtIHtcclxuICByZXR1cm4ge1xyXG4gICAgaWQ6IFN0cmluZyhyLmlkKSxcclxuICAgIGlkZW50OiBTdHJpbmcoci5pZGVudCksXHJcbiAgICB0eXBlOiByLnR5cGUgYXMgSXRlbVR5cGUsXHJcbiAgICB0aXRsZTogU3RyaW5nKHIudGl0bGUpLFxyXG4gICAgYm9keTogU3RyaW5nKHIuYm9keSksXHJcbiAgICBib2R5VGV4dDogU3RyaW5nKHIuYm9keV90ZXh0KSxcclxuICAgIHN0YXR1czogU3RyaW5nKHIuc3RhdHVzKSxcclxuICAgIHByaW9yaXR5OiByLnByaW9yaXR5IGFzIFdvcmtJdGVtWydwcmlvcml0eSddLFxyXG4gICAgb3duZXJJZDogKHIub3duZXJfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcclxuICAgIHJlcG9ydGVySWQ6IChyLnJlcG9ydGVyX2lkIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXHJcbiAgICBtaWxlc3RvbmVJZDogKHIubWlsZXN0b25lX2lkIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXHJcbiAgICByZWxlYXNlSWQ6IChyLnJlbGVhc2VfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcclxuICAgIHBhcmVudElkOiAoci5wYXJlbnRfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcclxuICAgIHN0YXJ0RGF0ZTogKHIuc3RhcnRfZGF0ZSBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxyXG4gICAgZHVlRGF0ZTogKHIuZHVlX2RhdGUgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcclxuICAgIGNvbXBsZXRlZEF0OiAoci5jb21wbGV0ZWRfYXQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcclxuICAgIGVmZm9ydDogci5lZmZvcnQgPT0gbnVsbCA/IG51bGwgOiBOdW1iZXIoci5lZmZvcnQpLFxyXG4gICAgY29uZmlkZW5jZTogKHIuY29uZmlkZW5jZSBhcyBXb3JrSXRlbVsnY29uZmlkZW5jZSddKSA/PyBudWxsLFxyXG4gICAgcmlza0xldmVsOiAoci5yaXNrX2xldmVsIGFzIFdvcmtJdGVtWydyaXNrTGV2ZWwnXSkgPz8gbnVsbCxcclxuICAgIGJ1c2luZXNzVmFsdWU6IChyLmJ1c2luZXNzX3ZhbHVlIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXHJcbiAgICBsZWFkZXJzaGlwVmlzaWJsZTogTnVtYmVyKHIubGVhZGVyc2hpcF92aXNpYmxlKSBhcyAwIHwgMSxcclxuICAgIHByb2dyZXNzOiByLnByb2dyZXNzID09IG51bGwgPyBudWxsIDogTnVtYmVyKHIucHJvZ3Jlc3MpLFxyXG4gICAgdGFnczogc2FmZVBhcnNlKFN0cmluZyhyLnRhZ3MpLCBbXSkgYXMgc3RyaW5nW10sXHJcbiAgICBleHRyYTogc2FmZVBhcnNlKFN0cmluZyhyLmV4dHJhKSwge30pIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxyXG4gICAgYXJjaGl2ZWQ6IE51bWJlcihyLmFyY2hpdmVkKSBhcyAwIHwgMSxcclxuICAgIHNhbXBsZTogTnVtYmVyKHIuc2FtcGxlKSBhcyAwIHwgMSxcclxuICAgIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXHJcbiAgICB1cGRhdGVkQXQ6IFN0cmluZyhyLnVwZGF0ZWRfYXQpLFxyXG4gICAgY3JlYXRlZEJ5OiBTdHJpbmcoci5jcmVhdGVkX2J5KSxcclxuICAgIHVwZGF0ZWRCeTogU3RyaW5nKHIudXBkYXRlZF9ieSksXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gcm93VG9MaW5rKHI6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogSXRlbUxpbmsge1xyXG4gIHJldHVybiB7XHJcbiAgICBpZDogU3RyaW5nKHIuaWQpLFxyXG4gICAgZnJvbUlkOiBTdHJpbmcoci5mcm9tX2lkKSxcclxuICAgIHRvSWQ6IFN0cmluZyhyLnRvX2lkKSxcclxuICAgIGtpbmQ6IHIua2luZCBhcyBMaW5rS2luZCxcclxuICAgIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXHJcbiAgICBjcmVhdGVkQnk6IFN0cmluZyhyLmNyZWF0ZWRfYnkpLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhZmVQYXJzZShzOiBzdHJpbmcsIGZhbGxiYWNrOiB1bmtub3duKTogdW5rbm93biB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiBKU09OLnBhcnNlKHMpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIGZhbGxiYWNrO1xyXG4gIH1cclxufVxyXG5cclxuLyoqIENvbnZlcnQgZnJlZSB0ZXh0IHRvIGEgc2FmZSBGVFM1IHByZWZpeCBxdWVyeS4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZ0c1F1ZXJ5KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgY29uc3QgdGVybXMgPSB0ZXh0XHJcbiAgICAucmVwbGFjZSgvWydcIiooKV0vZywgJyAnKVxyXG4gICAgLnNwbGl0KC9cXHMrLylcclxuICAgIC5maWx0ZXIoQm9vbGVhbilcclxuICAgIC5tYXAoKHQpID0+IGBcIiR7dH1cIipgKTtcclxuICByZXR1cm4gdGVybXMuam9pbignICcpIHx8ICdcIlwiJztcclxufVxyXG4iLCAiLy8gU2hhcmVkIGRvbWFpbiB0eXBlcyBcdTIwMTQgc2luZ2xlIHNvdXJjZSBvZiB0cnV0aCBmb3IgbWFpbiBwcm9jZXNzIGFuZCByZW5kZXJlci5cclxuXHJcbi8vIC0tLS0tLS0tLS0gVGVybWlub2xvZ3kgLS0tLS0tLS0tLVxyXG4vLyBVbWJyZWxsYSBub3VuOiBcIldvcmsgSXRlbVwiLiBFdmVyeSB0cmFja2VkIHJlY29yZCBpcyBhIHdvcmsgaXRlbSB3aXRoIGEgdHlwZS5cclxuLy8gSWRlbnRzIGFyZSBwZXItdHlwZSBzZXF1ZW5jZXM6IFRBU0stMTIsIEZFQVQtMywgUkVRLTQxLCBERUMtMTIsIFJJU0stOCwgQkxLLTIsXHJcbi8vIEFDQy01LCBNVEctMTQsIElERUEtNywgUS0zLCBERUYtMSwgUkVTLTQuXHJcblxyXG5leHBvcnQgY29uc3QgSVRFTV9UWVBFUyA9IFtcclxuICAndGFzaycsXHJcbiAgJ2ZlYXR1cmUnLFxyXG4gICdyZXF1aXJlbWVudCcsXHJcbiAgJ3N0b3J5JyxcclxuICAnZGVjaXNpb24nLFxyXG4gICdyaXNrJyxcclxuICAnYmxvY2tlcicsXHJcbiAgJ2FjY2VzcycsXHJcbiAgJ21lZXRpbmcnLFxyXG4gICdpZGVhJyxcclxuICAncXVlc3Rpb24nLFxyXG4gICdkZWZlY3QnLFxyXG4gICdyZXNlYXJjaCcsXHJcbl0gYXMgY29uc3Q7XHJcbmV4cG9ydCB0eXBlIEl0ZW1UeXBlID0gKHR5cGVvZiBJVEVNX1RZUEVTKVtudW1iZXJdO1xyXG5cclxuZXhwb3J0IGNvbnN0IElERU5UX1BSRUZJWDogUmVjb3JkPEl0ZW1UeXBlLCBzdHJpbmc+ID0ge1xyXG4gIHRhc2s6ICdUQVNLJyxcclxuICBmZWF0dXJlOiAnRkVBVCcsXHJcbiAgcmVxdWlyZW1lbnQ6ICdSRVEnLFxyXG4gIHN0b3J5OiAnU1RPUlknLFxyXG4gIGRlY2lzaW9uOiAnREVDJyxcclxuICByaXNrOiAnUklTSycsXHJcbiAgYmxvY2tlcjogJ0JMSycsXHJcbiAgYWNjZXNzOiAnQUNDJyxcclxuICBtZWV0aW5nOiAnTVRHJyxcclxuICBpZGVhOiAnSURFQScsXHJcbiAgcXVlc3Rpb246ICdRJyxcclxuICBkZWZlY3Q6ICdERUYnLFxyXG4gIHJlc2VhcmNoOiAnUkVTJyxcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBUWVBFX0xBQkVMOiBSZWNvcmQ8SXRlbVR5cGUsIHN0cmluZz4gPSB7XHJcbiAgdGFzazogJ1Rhc2snLFxyXG4gIGZlYXR1cmU6ICdGZWF0dXJlJyxcclxuICByZXF1aXJlbWVudDogJ1JlcXVpcmVtZW50JyxcclxuICBzdG9yeTogJ1VzZXIgU3RvcnknLFxyXG4gIGRlY2lzaW9uOiAnRGVjaXNpb24nLFxyXG4gIHJpc2s6ICdSaXNrJyxcclxuICBibG9ja2VyOiAnQmxvY2tlcicsXHJcbiAgYWNjZXNzOiAnQWNjZXNzIFJlcXVlc3QnLFxyXG4gIG1lZXRpbmc6ICdNZWV0aW5nIE5vdGUnLFxyXG4gIGlkZWE6ICdJZGVhJyxcclxuICBxdWVzdGlvbjogJ09wZW4gUXVlc3Rpb24nLFxyXG4gIGRlZmVjdDogJ0RlZmVjdCcsXHJcbiAgcmVzZWFyY2g6ICdSZXNlYXJjaCcsXHJcbn07XHJcblxyXG4vLyAtLS0tLS0tLS0tIFN0YXR1c2VzIC0tLS0tLS0tLS1cclxuLy8gV29yayBzdGF0dXNlcyBhcHBseSB0byBleGVjdXRhYmxlIGl0ZW1zICh0YXNrL2ZlYXR1cmUvcmVxdWlyZW1lbnQvc3RvcnkvZGVmZWN0L3Jlc2VhcmNoL2lkZWEpLlxyXG5leHBvcnQgY29uc3QgV09SS19TVEFUVVNFUyA9IFtcclxuICAnYmFja2xvZycsXHJcbiAgJ3RvZG8nLFxyXG4gICdpbl9wcm9ncmVzcycsXHJcbiAgJ2luX3JldmlldycsXHJcbiAgJ2Jsb2NrZWQnLFxyXG4gICdkb25lJyxcclxuICAnY2FuY2VsbGVkJyxcclxuXSBhcyBjb25zdDtcclxuZXhwb3J0IHR5cGUgV29ya1N0YXR1cyA9ICh0eXBlb2YgV09SS19TVEFUVVNFUylbbnVtYmVyXTtcclxuXHJcbmV4cG9ydCBjb25zdCBERUNJU0lPTl9TVEFUVVNFUyA9IFtcclxuICAncHJvcG9zZWQnLFxyXG4gICdkaXNjdXNzaW5nJyxcclxuICAnYXBwcm92ZWQnLFxyXG4gICdyZWplY3RlZCcsXHJcbiAgJ3JldmlzaXQnLFxyXG4gICdzdXBlcnNlZGVkJyxcclxuXSBhcyBjb25zdDtcclxuZXhwb3J0IHR5cGUgRGVjaXNpb25TdGF0dXMgPSAodHlwZW9mIERFQ0lTSU9OX1NUQVRVU0VTKVtudW1iZXJdO1xyXG5cclxuZXhwb3J0IGNvbnN0IEFDQ0VTU19TVEFUVVNFUyA9IFtcclxuICAnaWRlbnRpZmllZCcsXHJcbiAgJ25vdF9yZXF1ZXN0ZWQnLFxyXG4gICdwcmVwYXJpbmcnLFxyXG4gICdyZXF1ZXN0ZWQnLFxyXG4gICd1bmRlcl9yZXZpZXcnLFxyXG4gICdpbmZvX25lZWRlZCcsXHJcbiAgJ2FwcHJvdmVkJyxcclxuICAncGFydGlhbGx5X2FwcHJvdmVkJyxcclxuICAnZ3JhbnRlZCcsXHJcbiAgJ2RlbmllZCcsXHJcbiAgJ2V4cGlyZWQnLFxyXG4gICdub3RfbmVlZGVkJyxcclxuXSBhcyBjb25zdDtcclxuZXhwb3J0IHR5cGUgQWNjZXNzU3RhdHVzID0gKHR5cGVvZiBBQ0NFU1NfU1RBVFVTRVMpW251bWJlcl07XHJcblxyXG5leHBvcnQgY29uc3QgUklTS19TVEFUVVNFUyA9IFsnb3BlbicsICdtaXRpZ2F0aW5nJywgJ2FjY2VwdGVkJywgJ2Nsb3NlZCddIGFzIGNvbnN0O1xyXG5leHBvcnQgY29uc3QgQkxPQ0tFUl9TVEFUVVNFUyA9IFsnYWN0aXZlJywgJ3dvcmthcm91bmQnLCAncmVzb2x2ZWQnXSBhcyBjb25zdDtcclxuZXhwb3J0IGNvbnN0IFFVRVNUSU9OX1NUQVRVU0VTID0gWydvcGVuJywgJ2Fuc3dlcmVkJywgJ3BhcmtlZCddIGFzIGNvbnN0O1xyXG5leHBvcnQgY29uc3QgTUVFVElOR19TVEFUVVNFUyA9IFsnc2NoZWR1bGVkJywgJ2hlbGQnLCAnc3VtbWFyaXplZCddIGFzIGNvbnN0O1xyXG5cclxuZXhwb3J0IHR5cGUgSXRlbVN0YXR1cyA9IHN0cmluZzsgLy8gdmFsaWRhdGVkIHBlci10eXBlIGJ5IHN0YXR1c2VzRm9yVHlwZSgpXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RhdHVzZXNGb3JUeXBlKHR5cGU6IEl0ZW1UeXBlKTogcmVhZG9ubHkgc3RyaW5nW10ge1xyXG4gIHN3aXRjaCAodHlwZSkge1xyXG4gICAgY2FzZSAnZGVjaXNpb24nOlxyXG4gICAgICByZXR1cm4gREVDSVNJT05fU1RBVFVTRVM7XHJcbiAgICBjYXNlICdhY2Nlc3MnOlxyXG4gICAgICByZXR1cm4gQUNDRVNTX1NUQVRVU0VTO1xyXG4gICAgY2FzZSAncmlzayc6XHJcbiAgICAgIHJldHVybiBSSVNLX1NUQVRVU0VTO1xyXG4gICAgY2FzZSAnYmxvY2tlcic6XHJcbiAgICAgIHJldHVybiBCTE9DS0VSX1NUQVRVU0VTO1xyXG4gICAgY2FzZSAncXVlc3Rpb24nOlxyXG4gICAgICByZXR1cm4gUVVFU1RJT05fU1RBVFVTRVM7XHJcbiAgICBjYXNlICdtZWV0aW5nJzpcclxuICAgICAgcmV0dXJuIE1FRVRJTkdfU1RBVFVTRVM7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICByZXR1cm4gV09SS19TVEFUVVNFUztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBTVEFUVVNfTEFCRUw6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgYmFja2xvZzogJ0JhY2tsb2cnLFxyXG4gIHRvZG86ICdUbyBEbycsXHJcbiAgaW5fcHJvZ3Jlc3M6ICdJbiBQcm9ncmVzcycsXHJcbiAgaW5fcmV2aWV3OiAnSW4gUmV2aWV3JyxcclxuICBibG9ja2VkOiAnQmxvY2tlZCcsXHJcbiAgZG9uZTogJ0RvbmUnLFxyXG4gIGNhbmNlbGxlZDogJ0NhbmNlbGxlZCcsXHJcbiAgcHJvcG9zZWQ6ICdQcm9wb3NlZCcsXHJcbiAgZGlzY3Vzc2luZzogJ0Rpc2N1c3NpbmcnLFxyXG4gIGFwcHJvdmVkOiAnQXBwcm92ZWQnLFxyXG4gIHJlamVjdGVkOiAnUmVqZWN0ZWQnLFxyXG4gIHJldmlzaXQ6ICdSZXZpc2l0IExhdGVyJyxcclxuICBzdXBlcnNlZGVkOiAnU3VwZXJzZWRlZCcsXHJcbiAgaWRlbnRpZmllZDogJ0lkZW50aWZpZWQnLFxyXG4gIG5vdF9yZXF1ZXN0ZWQ6ICdOb3QgUmVxdWVzdGVkJyxcclxuICBwcmVwYXJpbmc6ICdQcmVwYXJpbmcgUmVxdWVzdCcsXHJcbiAgcmVxdWVzdGVkOiAnUmVxdWVzdGVkJyxcclxuICB1bmRlcl9yZXZpZXc6ICdVbmRlciBSZXZpZXcnLFxyXG4gIGluZm9fbmVlZGVkOiAnTW9yZSBJbmZvIE5lZWRlZCcsXHJcbiAgcGFydGlhbGx5X2FwcHJvdmVkOiAnUGFydGlhbGx5IEFwcHJvdmVkJyxcclxuICBncmFudGVkOiAnR3JhbnRlZCcsXHJcbiAgZGVuaWVkOiAnRGVuaWVkJyxcclxuICBleHBpcmVkOiAnRXhwaXJlZCcsXHJcbiAgbm90X25lZWRlZDogJ05vIExvbmdlciBOZWVkZWQnLFxyXG4gIG9wZW46ICdPcGVuJyxcclxuICBtaXRpZ2F0aW5nOiAnTWl0aWdhdGluZycsXHJcbiAgYWNjZXB0ZWQ6ICdBY2NlcHRlZCcsXHJcbiAgY2xvc2VkOiAnQ2xvc2VkJyxcclxuICBhY3RpdmU6ICdBY3RpdmUnLFxyXG4gIHdvcmthcm91bmQ6ICdXb3JrYXJvdW5kIEluIFBsYWNlJyxcclxuICByZXNvbHZlZDogJ1Jlc29sdmVkJyxcclxuICBhbnN3ZXJlZDogJ0Fuc3dlcmVkJyxcclxuICBwYXJrZWQ6ICdQYXJrZWQnLFxyXG4gIHNjaGVkdWxlZDogJ1NjaGVkdWxlZCcsXHJcbiAgaGVsZDogJ0hlbGQnLFxyXG4gIHN1bW1hcml6ZWQ6ICdTdW1tYXJpemVkJyxcclxufTtcclxuXHJcbi8qKiBTdGF0dXNlcyB0aGF0IGNvdW50IGFzIFwiY2xvc2VkL3Rlcm1pbmFsXCIgZm9yIHByb2dyZXNzICsgZGFzaGJvYXJkcy4gKi9cclxuZXhwb3J0IGNvbnN0IFRFUk1JTkFMX1NUQVRVU0VTID0gbmV3IFNldChbXHJcbiAgJ2RvbmUnLFxyXG4gICdjYW5jZWxsZWQnLFxyXG4gICdyZWplY3RlZCcsXHJcbiAgJ3N1cGVyc2VkZWQnLFxyXG4gICdncmFudGVkJyxcclxuICAnZGVuaWVkJyxcclxuICAnZXhwaXJlZCcsXHJcbiAgJ25vdF9uZWVkZWQnLFxyXG4gICdjbG9zZWQnLFxyXG4gICdyZXNvbHZlZCcsXHJcbiAgJ2Fuc3dlcmVkJyxcclxuICAnc3VtbWFyaXplZCcsXHJcbiAgJ2FjY2VwdGVkJyxcclxuXSk7XHJcblxyXG5leHBvcnQgY29uc3QgUFJJT1JJVElFUyA9IFsndXJnZW50JywgJ2hpZ2gnLCAnbWVkaXVtJywgJ2xvdycsICdub25lJ10gYXMgY29uc3Q7XHJcbmV4cG9ydCB0eXBlIFByaW9yaXR5ID0gKHR5cGVvZiBQUklPUklUSUVTKVtudW1iZXJdO1xyXG5cclxuLy8gLS0tLS0tLS0tLSBMaW5rcyAtLS0tLS0tLS0tXHJcbmV4cG9ydCBjb25zdCBMSU5LX0tJTkRTID0gW1xyXG4gICdyZWxhdGVzJywgLy8gZ2VuZXJpYyBiaWRpcmVjdGlvbmFsXHJcbiAgJ2Jsb2NrcycsIC8vIGZyb20gYmxvY2tzIHRvXHJcbiAgJ2ltcGxlbWVudHMnLCAvLyB0YXNrIGltcGxlbWVudHMgcmVxdWlyZW1lbnQvZmVhdHVyZVxyXG4gICdzdXBwb3J0cycsIC8vIHJlcXVpcmVtZW50IHN1cHBvcnRzIGZlYXR1cmVcclxuICAnc2hhcGVkX2J5JywgLy8gaXRlbSBzaGFwZWQgYnkgZGVjaXNpb25cclxuICAncmVxdWlyZXNfYWNjZXNzJywgLy8gaXRlbSByZXF1aXJlcyBhY2Nlc3MgcmVjb3JkXHJcbiAgJ2Rpc2N1c3NlZF9pbicsIC8vIGl0ZW0gZGlzY3Vzc2VkIGluIG1lZXRpbmdcclxuICAndmFsaWRhdGVzJywgLy8gdGVzdC9kZWZlY3QgdmFsaWRhdGVzIHJlcXVpcmVtZW50XHJcbiAgJ3N1cGVyc2VkZXMnLCAvLyBkZWNpc2lvbiBzdXBlcnNlZGVzIGRlY2lzaW9uXHJcbiAgJ3BhcmVudCcsIC8vIGZyb20gaXMgcGFyZW50IG9mIHRvIChhbHNvIG1pcnJvcmVkIHZpYSBpdGVtcy5wYXJlbnRfaWQpXHJcbl0gYXMgY29uc3Q7XHJcbmV4cG9ydCB0eXBlIExpbmtLaW5kID0gKHR5cGVvZiBMSU5LX0tJTkRTKVtudW1iZXJdO1xyXG5cclxuZXhwb3J0IGNvbnN0IExJTktfTEFCRUw6IFJlY29yZDxMaW5rS2luZCwgW3N0cmluZywgc3RyaW5nXT4gPSB7XHJcbiAgLy8gW2xhYmVsIGZyb20tPnRvLCBsYWJlbCB0by0+ZnJvbV1cclxuICByZWxhdGVzOiBbJ3JlbGF0ZXMgdG8nLCAncmVsYXRlcyB0byddLFxyXG4gIGJsb2NrczogWydibG9ja3MnLCAnYmxvY2tlZCBieSddLFxyXG4gIGltcGxlbWVudHM6IFsnaW1wbGVtZW50cycsICdpbXBsZW1lbnRlZCBieSddLFxyXG4gIHN1cHBvcnRzOiBbJ3N1cHBvcnRzJywgJ3N1cHBvcnRlZCBieSddLFxyXG4gIHNoYXBlZF9ieTogWydzaGFwZWQgYnknLCAnc2hhcGVkJ10sXHJcbiAgcmVxdWlyZXNfYWNjZXNzOiBbJ3JlcXVpcmVzIGFjY2VzcycsICdyZXF1aXJlZCBmb3InXSxcclxuICBkaXNjdXNzZWRfaW46IFsnZGlzY3Vzc2VkIGluJywgJ2Rpc2N1c3NlZCddLFxyXG4gIHZhbGlkYXRlczogWyd2YWxpZGF0ZXMnLCAndmFsaWRhdGVkIGJ5J10sXHJcbiAgc3VwZXJzZWRlczogWydzdXBlcnNlZGVzJywgJ3N1cGVyc2VkZWQgYnknXSxcclxuICBwYXJlbnQ6IFsncGFyZW50IG9mJywgJ2NoaWxkIG9mJ10sXHJcbn07XHJcblxyXG4vLyAtLS0tLS0tLS0tIENvcmUgcmVjb3JkcyAtLS0tLS0tLS0tXHJcbmV4cG9ydCBpbnRlcmZhY2UgV29ya0l0ZW0ge1xyXG4gIGlkOiBzdHJpbmc7IC8vIHV1aWQgXHUyMDE0IGNhbm9uaWNhbCBpZGVudGl0eSwgdXNlZCBieSBhbGwgcmVmZXJlbmNlc1xyXG4gIGlkZW50OiBzdHJpbmc7IC8vIGRpc3BsYXkgaWQgZS5nLiBSRVEtNDEgKG1heSBiZSByZW51bWJlcmVkIG9uIHN5bmMgY29sbGlzaW9uKVxyXG4gIHR5cGU6IEl0ZW1UeXBlO1xyXG4gIHRpdGxlOiBzdHJpbmc7XHJcbiAgYm9keTogc3RyaW5nOyAvLyByaWNoIGRvYyBKU09OIChlZGl0b3IgZG9jdW1lbnQpLCAnJyB3aGVuIGVtcHR5XHJcbiAgYm9keVRleHQ6IHN0cmluZzsgLy8gcGxhaW4gdGV4dCBwcm9qZWN0aW9uIGZvciBzZWFyY2hcclxuICBzdGF0dXM6IHN0cmluZztcclxuICBwcmlvcml0eTogUHJpb3JpdHk7XHJcbiAgb3duZXJJZDogc3RyaW5nIHwgbnVsbDtcclxuICByZXBvcnRlcklkOiBzdHJpbmcgfCBudWxsO1xyXG4gIG1pbGVzdG9uZUlkOiBzdHJpbmcgfCBudWxsO1xyXG4gIHJlbGVhc2VJZDogc3RyaW5nIHwgbnVsbDtcclxuICBwYXJlbnRJZDogc3RyaW5nIHwgbnVsbDtcclxuICBzdGFydERhdGU6IHN0cmluZyB8IG51bGw7IC8vIElTTyBkYXRlXHJcbiAgZHVlRGF0ZTogc3RyaW5nIHwgbnVsbDtcclxuICBjb21wbGV0ZWRBdDogc3RyaW5nIHwgbnVsbDsgLy8gSVNPIGRhdGV0aW1lXHJcbiAgZWZmb3J0OiBudW1iZXIgfCBudWxsOyAvLyBwb2ludHMvZGF5cywgdW5pdCBpcyB0ZWFtIGNvbnZlbnRpb25cclxuICBjb25maWRlbmNlOiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgbnVsbDtcclxuICByaXNrTGV2ZWw6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAnY3JpdGljYWwnIHwgbnVsbDtcclxuICBidXNpbmVzc1ZhbHVlOiBzdHJpbmcgfCBudWxsO1xyXG4gIGxlYWRlcnNoaXBWaXNpYmxlOiAwIHwgMTtcclxuICBwcm9ncmVzczogbnVtYmVyIHwgbnVsbDsgLy8gMC0xMDAgbWFudWFsIG92ZXJyaWRlOyBudWxsID0gZGVyaXZlZFxyXG4gIHRhZ3M6IHN0cmluZ1tdO1xyXG4gIGV4dHJhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjsgLy8gdHlwZS1zcGVjaWZpYyBmaWVsZHMgKHNlZSBkb2NzL1RFUk1JTk9MT0dZLm1kKVxyXG4gIGFyY2hpdmVkOiAwIHwgMTtcclxuICBzYW1wbGU6IDAgfCAxOyAvLyBzZWVkZWQgc2FtcGxlIGRhdGEgZmxhZ1xyXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xyXG4gIGNyZWF0ZWRCeTogc3RyaW5nO1xyXG4gIHVwZGF0ZWRCeTogc3RyaW5nO1xyXG59XHJcblxyXG4vLyBUeXBlLXNwZWNpZmljIGBleHRyYWAgc2hhcGVzIChkb2N1bWVudGVkLCBub3QgZW5mb3JjZWQgYnkgREIpOlxyXG4vLyBhY2Nlc3M6ICAgeyBzeXN0ZW0sIGFjY2Vzc1R5cGUsIGJ1c2luZXNzUmVhc29uLCByZXF1ZXN0ZWRGcm9tLCByZXF1ZXN0RGF0ZSxcclxuLy8gICAgICAgICAgICAgYXBwcm92ZWRCeSwgZGF0ZUdyYW50ZWQsIGV4cGlyYXRpb25EYXRlLCByZW5ld2FsRGF0ZSwgc2VjdXJpdHlOb3RlcywgbmV4dEFjdGlvbiwgZm9sbG93VXBEYXRlIH1cclxuLy8gZGVjaXNpb246IHsgY29udGV4dCwgcHJvYmxlbSwgb3B0aW9uczogW3t0aXRsZSwgbm90ZXMsIHNlbGVjdGVkfV0sIHJlYXNvbmluZyxcclxuLy8gICAgICAgICAgICAgdHJhZGVvZmZzLCBjb25zZXF1ZW5jZXMsIHJldmlld0RhdGUsIGNvbnRyaWJ1dG9yczogc3RyaW5nW10gfVxyXG4vLyBtZWV0aW5nOiAgeyBkYXRlLCB0aW1lLCBhdHRlbmRlZXM6IHN0cmluZ1tdLCBwdXJwb3NlLCBhZ2VuZGEsIGZvbGxvd1VwRGF0ZSB9XHJcbi8vIHJpc2s6ICAgICB7IGxpa2VsaWhvb2QsIGltcGFjdCwgbWl0aWdhdGlvbiwgdHJpZ2dlciB9XHJcbi8vIGJsb2NrZXI6ICB7IHdhaXRpbmdPbiwgc2luY2UsIGVzY2FsYXRlZFRvIH1cclxuLy8gcmVxdWlyZW1lbnQ6IHsgYWNjZXB0YW5jZUNyaXRlcmlhLCB0ZXN0aW5nTm90ZXMsIHNlY3VyaXR5Q29uc2lkZXJhdGlvbnMgfVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJdGVtTGluayB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBmcm9tSWQ6IHN0cmluZztcclxuICB0b0lkOiBzdHJpbmc7XHJcbiAga2luZDogTGlua0tpbmQ7XHJcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XHJcbiAgY3JlYXRlZEJ5OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ29tbWVudCB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBpdGVtSWQ6IHN0cmluZztcclxuICBhdXRob3JJZDogc3RyaW5nO1xyXG4gIGJvZHk6IHN0cmluZzsgLy8gcmljaCBkb2MgSlNPTlxyXG4gIGJvZHlUZXh0OiBzdHJpbmc7XHJcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XHJcbiAgdXBkYXRlZEF0OiBzdHJpbmcgfCBudWxsO1xyXG4gIHVwZGF0ZWRCeT86IHN0cmluZyB8IG51bGw7XHJcbiAgZGVsZXRlZDogMCB8IDE7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQXR0YWNobWVudCB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBpdGVtSWQ6IHN0cmluZztcclxuICBmaWxlbmFtZTogc3RyaW5nO1xyXG4gIG1pbWU6IHN0cmluZztcclxuICBzaXplOiBudW1iZXI7XHJcbiAgc2hhMjU2OiBzdHJpbmc7XHJcbiAgZGVzY3JpcHRpb246IHN0cmluZyB8IG51bGw7XHJcbiAgdXBsb2FkZWRCeTogc3RyaW5nO1xyXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG4gIGRlbGV0ZWQ6IDAgfCAxO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFjdGl2aXR5RW50cnkge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgaXRlbUlkOiBzdHJpbmcgfCBudWxsO1xyXG4gIGFjdG9ySWQ6IHN0cmluZztcclxuICBraW5kOiBzdHJpbmc7IC8vIGNyZWF0ZWQgfCB1cGRhdGVkIHwgc3RhdHVzIHwgY29tbWVudCB8IGxpbmsgfCBhdHRhY2htZW50IHwgYXJjaGl2ZWQgfCByZXN0b3JlZCB8IC4uLlxyXG4gIGZpZWxkOiBzdHJpbmcgfCBudWxsO1xyXG4gIG9sZFZhbHVlOiBzdHJpbmcgfCBudWxsO1xyXG4gIG5ld1ZhbHVlOiBzdHJpbmcgfCBudWxsO1xyXG4gIGF0OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSXRlbVZlcnNpb24ge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgaXRlbUlkOiBzdHJpbmc7XHJcbiAgdmVyc2lvbjogbnVtYmVyO1xyXG4gIHRpdGxlOiBzdHJpbmc7XHJcbiAgYm9keTogc3RyaW5nO1xyXG4gIHNhdmVkQnk6IHN0cmluZztcclxuICBzYXZlZEF0OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTWlsZXN0b25lIHtcclxuICBpZDogc3RyaW5nO1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xyXG4gIHRhcmdldERhdGU6IHN0cmluZyB8IG51bGw7XHJcbiAgc3RhdHVzOiAncGxhbm5lZCcgfCAnYWN0aXZlJyB8ICdkb25lJztcclxuICBzb3J0OiBudW1iZXI7XHJcbiAgc2FtcGxlOiAwIHwgMTtcclxuICBjcmVhdGVkQXQ/OiBzdHJpbmc7XHJcbiAgY3JlYXRlZEJ5Pzogc3RyaW5nO1xyXG4gIHVwZGF0ZWRBdD86IHN0cmluZztcclxuICB1cGRhdGVkQnk/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVsZWFzZSB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgdmVyc2lvbjogc3RyaW5nO1xyXG4gIHRhcmdldERhdGU6IHN0cmluZyB8IG51bGw7XHJcbiAgc3RhdHVzOiAncGxhbm5lZCcgfCAnaW5fcHJvZ3Jlc3MnIHwgJ3JlbGVhc2VkJyB8ICdjYW5jZWxsZWQnO1xyXG4gIGdvYWxzOiBzdHJpbmc7XHJcbiAgbm90ZXM6IHN0cmluZzsgLy8gcmVsZWFzZSBub3RlcyByaWNoIGRvY1xyXG4gIHNhbXBsZTogMCB8IDE7XHJcbiAgY3JlYXRlZEF0Pzogc3RyaW5nO1xyXG4gIGNyZWF0ZWRCeT86IHN0cmluZztcclxuICB1cGRhdGVkQXQ/OiBzdHJpbmc7XHJcbiAgdXBkYXRlZEJ5Pzogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFVzZXIge1xyXG4gIGlkOiBzdHJpbmc7IC8vIHN0YWJsZSBzbHVnLCBlLmcuICdqb2huJywgJ21hcmsnXHJcbiAgbmFtZTogc3RyaW5nO1xyXG4gIGluaXRpYWxzOiBzdHJpbmc7XHJcbiAgY29sb3I6IHN0cmluZztcclxuICBhdmF0YXI/OiBzdHJpbmcgfCBudWxsOyAvLyBpbWFnZSBkYXRhIFVSTDsgbnVsbC9hYnNlbnQgPSByZW5kZXIgaW5pdGlhbHMgb24gY29sb3JcclxuICBjcmVhdGVkQXQ6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTYXZlZFZpZXcge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgbmFtZTogc3RyaW5nO1xyXG4gIGNvbmZpZzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47IC8vIHt2aWV3LCBmaWx0ZXJzLCBzb3J0LCBncm91cH1cclxuICBwaW5uZWQ6IDAgfCAxO1xyXG4gIGNyZWF0ZWRCeTogc3RyaW5nO1xyXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG59XHJcblxyXG4vLyAtLS0tLS0tLS0tIFBlci11c2VyIHZpZXcgbGF5b3V0IHByZWZlcmVuY2VzIChsb2NhbCwgbm90IHN5bmNlZCkgLS0tLS0tLS0tLVxyXG5leHBvcnQgdHlwZSBWaWV3U2l6ZSA9ICdzbWFsbCcgfCAnc3RhbmRhcmQnIHwgJ2xhcmdlJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVmlld0l0ZW1QcmVmIHtcclxuICBrZXk6IHN0cmluZzsgLy8gc3RhYmxlIGNhcmQvY29sdW1uIGtleVxyXG4gIHZpc2libGU6IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2luZ2xlVmlld1ByZWZzIHtcclxuICBzaXplOiBWaWV3U2l6ZTtcclxuICBpdGVtczogVmlld0l0ZW1QcmVmW107IC8vIG9yZGVyZWQ7IGRyaXZlcyBhcnJhbmdlbWVudCArIHZpc2liaWxpdHlcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWaWV3UHJlZnMge1xyXG4gIGJvYXJkPzogU2luZ2xlVmlld1ByZWZzO1xyXG4gIGRhc2hib2FyZD86IFNpbmdsZVZpZXdQcmVmcztcclxufVxyXG5cclxuLy8gLS0tLS0tLS0tLSBTeW5jIC0tLS0tLS0tLS1cclxuZXhwb3J0IGludGVyZmFjZSBPcCB7XHJcbiAgb3BJZDogc3RyaW5nOyAvLyB1dWlkXHJcbiAgZGV2aWNlSWQ6IHN0cmluZztcclxuICBhY3RvcklkOiBzdHJpbmc7XHJcbiAgbGFtcG9ydDogbnVtYmVyO1xyXG4gIGF0OiBzdHJpbmc7IC8vIHdhbGwgY2xvY2ssIGluZm9ybWF0aW9uYWwgb25seSBcdTIwMTQgb3JkZXJpbmcgdXNlcyBsYW1wb3J0XHJcbiAgZW50aXR5OiAnaXRlbScgfCAnbGluaycgfCAnY29tbWVudCcgfCAnYXR0YWNobWVudCcgfCAnbWlsZXN0b25lJyB8ICdyZWxlYXNlJyB8ICd1c2VyJyB8ICdzYXZlZF92aWV3JyB8ICd0YWdzZXQnO1xyXG4gIGVudGl0eUlkOiBzdHJpbmc7XHJcbiAgYWN0aW9uOiAnY3JlYXRlJyB8ICdzZXQnIHwgJ2RlbGV0ZSc7XHJcbiAgLy8gY3JlYXRlOiBwYXlsb2FkID0gZnVsbCByZWNvcmQuIHNldDogcGF5bG9hZCA9IHtmaWVsZDogdmFsdWUsLi4ufS4gZGVsZXRlOiBwYXlsb2FkID0ge30uXHJcbiAgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU3luY0NvbmZsaWN0IHtcclxuICBpZDogc3RyaW5nO1xyXG4gIGVudGl0eTogc3RyaW5nO1xyXG4gIGVudGl0eUlkOiBzdHJpbmc7XHJcbiAgZmllbGQ6IHN0cmluZztcclxuICBsb2NhbFZhbHVlOiBzdHJpbmc7XHJcbiAgcmVtb3RlVmFsdWU6IHN0cmluZztcclxuICByZW1vdGVEZXZpY2U6IHN0cmluZztcclxuICByZW1vdGVBY3Rvcjogc3RyaW5nO1xyXG4gIGRldGVjdGVkQXQ6IHN0cmluZztcclxuICByZXNvbHZlZEF0OiBzdHJpbmcgfCBudWxsO1xyXG4gIHJlc29sdXRpb246ICdsb2NhbCcgfCAncmVtb3RlJyB8ICdtZXJnZWQnIHwgbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgU3luY1N0YXR1c1N0YXRlID0gJ2Rpc2FibGVkJyB8ICdpZGxlJyB8ICdzeW5jaW5nJyB8ICdvZmZsaW5lJyB8ICdlcnJvcic7XHJcbmV4cG9ydCBpbnRlcmZhY2UgU3luY1N0YXR1cyB7XHJcbiAgc3RhdGU6IFN5bmNTdGF0dXNTdGF0ZTtcclxuICBmb2xkZXI6IHN0cmluZyB8IG51bGw7XHJcbiAgbGFzdFN5bmNBdDogc3RyaW5nIHwgbnVsbDtcclxuICBsYXN0RXJyb3I6IHN0cmluZyB8IG51bGw7XHJcbiAgcGVuZGluZ09wczogbnVtYmVyO1xyXG4gIG9wZW5Db25mbGljdHM6IG51bWJlcjtcclxuICBwZWVyczogeyBkZXZpY2VJZDogc3RyaW5nOyB1c2VyTmFtZTogc3RyaW5nIHwgbnVsbDsgbGFzdFNlZW5BdDogc3RyaW5nIHwgbnVsbCB9W107XHJcbn1cclxuXHJcbi8vIC0tLS0tLS0tLS0gUXVlcmllcyAtLS0tLS0tLS0tXHJcbmV4cG9ydCBpbnRlcmZhY2UgSXRlbUZpbHRlciB7XHJcbiAgdHlwZXM/OiBJdGVtVHlwZVtdO1xyXG4gIHN0YXR1c2VzPzogc3RyaW5nW107XHJcbiAgcHJpb3JpdGllcz86IFByaW9yaXR5W107XHJcbiAgb3duZXJJZHM/OiAoc3RyaW5nIHwgbnVsbClbXTtcclxuICBtaWxlc3RvbmVJZD86IHN0cmluZztcclxuICByZWxlYXNlSWQ/OiBzdHJpbmc7XHJcbiAgdGFnPzogc3RyaW5nO1xyXG4gIHRleHQ/OiBzdHJpbmc7IC8vIEZUUyBxdWVyeVxyXG4gIGFyY2hpdmVkPzogYm9vbGVhbjsgLy8gZGVmYXVsdCBmYWxzZVxyXG4gIG92ZXJkdWU/OiBib29sZWFuO1xyXG4gIGR1ZVdpdGhpbkRheXM/OiBudW1iZXI7XHJcbiAgbGVhZGVyc2hpcFZpc2libGU/OiBib29sZWFuO1xyXG4gIHVwZGF0ZWRTaW5jZT86IHN0cmluZztcclxuICBwYXJlbnRJZD86IHN0cmluZztcclxuICBzYW1wbGU/OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEl0ZW1Tb3J0IHtcclxuICBmaWVsZDogJ2lkZW50JyB8ICd0aXRsZScgfCAnc3RhdHVzJyB8ICdwcmlvcml0eScgfCAnZHVlRGF0ZScgfCAnY3JlYXRlZEF0JyB8ICd1cGRhdGVkQXQnIHwgJ21hbnVhbCc7XHJcbiAgZGlyOiAnYXNjJyB8ICdkZXNjJztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZWFyY2hSZXN1bHQge1xyXG4gIGl0ZW06IFdvcmtJdGVtO1xyXG4gIHNuaXBwZXQ6IHN0cmluZyB8IG51bGw7XHJcbiAgc2NvcmU6IG51bWJlcjtcclxufVxyXG4iLCAiLy8gUmljaC1kb2MgaGVscGVycyBzaGFyZWQgYnkgbWFpbiBwcm9jZXNzIGFuZCByZW5kZXJlci5cclxuXHJcbi8qKiBFeHRyYWN0IHBsYWluIHRleHQgZnJvbSBhIHN0b3JlZCBlZGl0b3IgZG9jdW1lbnQgKFRpcFRhcCBKU09OIHN0cmluZykuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBkb2NUb1RleHQoYm9keTogc3RyaW5nKTogc3RyaW5nIHtcclxuICBpZiAoIWJvZHkpIHJldHVybiAnJztcclxuICB0cnkge1xyXG4gICAgY29uc3QgZG9jID0gSlNPTi5wYXJzZShib2R5KSBhcyB7IGNvbnRlbnQ/OiB1bmtub3duW10gfTtcclxuICAgIGNvbnN0IHdhbGsgPSAobm9kZXM6IHVua25vd25bXSk6IHN0cmluZyA9PlxyXG4gICAgICBub2Rlc1xyXG4gICAgICAgIC5tYXAoKG4pID0+IHtcclxuICAgICAgICAgIGNvbnN0IG5vZGUgPSBuIGFzIHsgdHlwZT86IHN0cmluZzsgdGV4dD86IHN0cmluZzsgY29udGVudD86IHVua25vd25bXSB9O1xyXG4gICAgICAgICAgaWYgKG5vZGUudGV4dCkgcmV0dXJuIG5vZGUudGV4dDtcclxuICAgICAgICAgIGNvbnN0IGlubmVyID0gbm9kZS5jb250ZW50ID8gd2Fsayhub2RlLmNvbnRlbnQpIDogJyc7XHJcbiAgICAgICAgICByZXR1cm4gbm9kZS50eXBlID09PSAncGFyYWdyYXBoJyB8fCBub2RlLnR5cGU/LnN0YXJ0c1dpdGgoJ2hlYWRpbmcnKSA/IGlubmVyICsgJ1xcbicgOiBpbm5lcjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5qb2luKCcnKTtcclxuICAgIHJldHVybiB3YWxrKGRvYy5jb250ZW50ID8/IFtdKS50cmltKCk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gYm9keTtcclxuICB9XHJcbn1cclxuXHJcbi8qKiBXcmFwIHBsYWluIHRleHQgaW50byBhIG1pbmltYWwgZWRpdG9yIGRvY3VtZW50LiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdGV4dFRvRG9jKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcclxuICAgIHR5cGU6ICdkb2MnLFxyXG4gICAgY29udGVudDogdGV4dC5zcGxpdCgvXFxuezIsfS8pLm1hcCgocCkgPT4gKHtcclxuICAgICAgdHlwZTogJ3BhcmFncmFwaCcsXHJcbiAgICAgIGNvbnRlbnQ6IHAgPyBbeyB0eXBlOiAndGV4dCcsIHRleHQ6IHAgfV0gOiBbXSxcclxuICAgIH0pKSxcclxuICB9KTtcclxufVxyXG4iLCAiLy8gU3luY1RyYW5zcG9ydDogdGhlIHNlYW0gYmV0d2VlbiBUZXRoZXIgYW5kIHdoYXRldmVyIG1vdmVzIGJ5dGVzIGJldHdlZW4gbWFjaGluZXMuXHJcbi8vIHYxIHNoaXBzIEZvbGRlclRyYW5zcG9ydCAoYSBPbmVEcml2ZS9TaGFyZVBvaW50LXN5bmNlZCBmb2xkZXIpLiBUaGUgaW50ZXJmYWNlIGlzXHJcbi8vIGRlbGliZXJhdGVseSBkdW1iIFx1MjAxNCBhcHBlbmQtb25seSBiYXRjaGVzIG91dCwgYmF0Y2hlcyBpbiBcdTIwMTQgc28gYSBmdXR1cmUgQXp1cmUgU1FMIC9cclxuLy8gRGF0YXZlcnNlIC8gaW50ZXJuYWwgQVBJIHRyYW5zcG9ydCBzbG90cyBpbiB3aXRob3V0IHRvdWNoaW5nIG1lcmdlIGxvZ2ljLlxyXG5cclxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xyXG5pbXBvcnQgdHlwZSB7IE9wIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGVlckluZm8ge1xyXG4gIGRldmljZUlkOiBzdHJpbmc7XHJcbiAgdXNlck5hbWU6IHN0cmluZyB8IG51bGw7XHJcbiAgbGFzdFNlZW5BdDogc3RyaW5nIHwgbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBPcEJhdGNoRmlsZSB7XHJcbiAgZGV2aWNlSWQ6IHN0cmluZztcclxuICBmaWxlTmFtZTogc3RyaW5nOyAvLyBzb3J0YWJsZSwgdW5pcXVlIHBlciBkZXZpY2VcclxuICBvcHM6IE9wW107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU3luY1RyYW5zcG9ydCB7XHJcbiAgLyoqIEh1bWFuLXJlYWRhYmxlIGxvY2F0aW9uIGZvciB0aGUgVUkgKFwid2hlcmUgaXMgbXkgZGF0YVwiKS4gKi9cclxuICBsb2NhdGlvbigpOiBzdHJpbmc7XHJcbiAgLyoqIFRydWUgd2hlbiB0aGUgYmFja2luZyBtZWRpdW0gaXMgcmVhY2hhYmxlIHJpZ2h0IG5vdy4gKi9cclxuICBhdmFpbGFibGUoKTogYm9vbGVhbjtcclxuICAvKiogUHVibGlzaCBhIGJhdGNoIG9mIHRoaXMgZGV2aWNlJ3Mgb3BzLiBNdXN0IGJlIGF0b21pYyAoYWxsLW9yLW5vdGhpbmcgdmlzaWJsZSkuICovXHJcbiAgcHVibGlzaE9wcyhkZXZpY2VJZDogc3RyaW5nLCBiYXRjaE5hbWU6IHN0cmluZywgb3BzOiBPcFtdKTogUHJvbWlzZTx2b2lkPjtcclxuICAvKiogTGlzdCBwZWVyIGJhdGNoIGZpbGUgbmFtZXMgKHNvcnRlZCBhc2NlbmRpbmcpIG5ld2VyIHRoYW4gYGFmdGVyRmlsZWAgZm9yIGVhY2ggcGVlci4gKi9cclxuICBsaXN0UGVlckJhdGNoZXMob3duRGV2aWNlSWQ6IHN0cmluZywgYWZ0ZXJGaWxlQnlEZXZpY2U6IE1hcDxzdHJpbmcsIHN0cmluZyB8IG51bGw+KTogUHJvbWlzZTx7IGRldmljZUlkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfVtdPjtcclxuICAvKiogRmV0Y2ggb25lIGJhdGNoLiAqL1xyXG4gIGZldGNoQmF0Y2goZGV2aWNlSWQ6IHN0cmluZywgZmlsZU5hbWU6IHN0cmluZyk6IFByb21pc2U8T3BbXT47XHJcbiAgLyoqIEFubm91bmNlIHByZXNlbmNlIChvd24gZmlsZSBvbmx5IFx1MjAxNCBubyB3cml0ZSBjb250ZW50aW9uKS4gKi9cclxuICBhbm5vdW5jZShkZXZpY2VJZDogc3RyaW5nLCB1c2VyTmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcclxuICAvKiogQWxsIGFubm91bmNlZCBkZXZpY2VzLiAqL1xyXG4gIGxpc3RQZWVycygpOiBQcm9taXNlPFBlZXJJbmZvW10+O1xyXG4gIC8qKiBTdG9yZSBhbiBhdHRhY2htZW50IGJsb2IgY29udGVudC1hZGRyZXNzZWQgYnkgc2hhMjU2LiBSZXR1cm5zIHRydWUgaWYgbmV3bHkgc3RvcmVkLiAqL1xyXG4gIHB1dEJsb2Ioc2hhMjU2OiBzdHJpbmcsIGRhdGE6IEJ1ZmZlcik6IFByb21pc2U8Ym9vbGVhbj47XHJcbiAgLyoqIEZldGNoIGFuIGF0dGFjaG1lbnQgYmxvYiwgbnVsbCBpZiBub3QgKHlldCkgcHJlc2VudC4gKi9cclxuICBnZXRCbG9iKHNoYTI1Njogc3RyaW5nKTogUHJvbWlzZTxCdWZmZXIgfCBudWxsPjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZvbGRlclRyYW5zcG9ydCBcdTIwMTQgc2hhcmVkLWZvbGRlciBsYXlvdXQ6XHJcbiAqICAgPHJvb3Q+L29wcy88ZGV2aWNlSWQ+LzAwMDAwMDAwMDAxLmpzb25sICAgb3AgYmF0Y2hlcywgb25lIEpTT04gb3AgcGVyIGxpbmVcclxuICogICA8cm9vdD4vb3BzLzxkZXZpY2VJZD4vZGV2aWNlLmpzb24gICAgICAgICAgcHJlc2VuY2UgKyBpZGVudGl0eVxyXG4gKiAgIDxyb290Pi9ibG9icy88YWE+LzxzaGEyNTY+ICAgICAgICAgICAgICAgICBjb250ZW50LWFkZHJlc3NlZCBhdHRhY2htZW50c1xyXG4gKlxyXG4gKiBDb3JyZWN0bmVzcyBydWxlczpcclxuICogLSBBIGRldmljZSB3cml0ZXMgT05MWSB1bmRlciBpdHMgb3duIG9wcy88ZGV2aWNlSWQ+LyBkaXJlY3RvcnkgXHUyMTkyIG5vIHdyaXRlIGNvbnRlbnRpb24sXHJcbiAqICAgbm8gc2hhcmVkLWZpbGUgbG9ja2luZywgbm8gU1FMaXRlLW92ZXItT25lRHJpdmUgY29ycnVwdGlvbiBjbGFzcy5cclxuICogLSBGaWxlcyBhcmUgd3JpdHRlbiB0byBhIHRlbXAgbmFtZSB0aGVuIHJlbmFtZWQgXHUyMTkyIHJlYWRlcnMgbmV2ZXIgc2VlIHBhcnRpYWwgYmF0Y2hlcy5cclxuICogLSBCYXRjaGVzIGFyZSBpbW11dGFibGUgb25jZSBwdWJsaXNoZWQuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRm9sZGVyVHJhbnNwb3J0IGltcGxlbWVudHMgU3luY1RyYW5zcG9ydCB7XHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByb290OiBzdHJpbmcpIHt9XHJcblxyXG4gIGxvY2F0aW9uKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290O1xyXG4gIH1cclxuXHJcbiAgYXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgZnMubWtkaXJTeW5jKHBhdGguam9pbih0aGlzLnJvb3QsICdvcHMnKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgb3BzRGlyKGRldmljZUlkOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHBhdGguam9pbih0aGlzLnJvb3QsICdvcHMnLCBkZXZpY2VJZCk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBwdWJsaXNoT3BzKGRldmljZUlkOiBzdHJpbmcsIGJhdGNoTmFtZTogc3RyaW5nLCBvcHM6IE9wW10pOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IGRpciA9IHRoaXMub3BzRGlyKGRldmljZUlkKTtcclxuICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgY29uc3QgZmluYWxQYXRoID0gcGF0aC5qb2luKGRpciwgYmF0Y2hOYW1lKTtcclxuICAgIGNvbnN0IHRtcFBhdGggPSBmaW5hbFBhdGggKyAnLnRtcCc7XHJcbiAgICBjb25zdCBsaW5lcyA9IG9wcy5tYXAoKG8pID0+IEpTT04uc3RyaW5naWZ5KG8pKS5qb2luKCdcXG4nKSArICdcXG4nO1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyh0bXBQYXRoLCBsaW5lcywgJ3V0ZjgnKTtcclxuICAgIGZzLnJlbmFtZVN5bmModG1wUGF0aCwgZmluYWxQYXRoKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGxpc3RQZWVyQmF0Y2hlcyhcclxuICAgIG93bkRldmljZUlkOiBzdHJpbmcsXHJcbiAgICBhZnRlckZpbGVCeURldmljZTogTWFwPHN0cmluZywgc3RyaW5nIHwgbnVsbD4sXHJcbiAgKTogUHJvbWlzZTx7IGRldmljZUlkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfVtdPiB7XHJcbiAgICBjb25zdCBvcHNSb290ID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ29wcycpO1xyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKG9wc1Jvb3QpKSByZXR1cm4gW107XHJcbiAgICBjb25zdCBvdXQ6IHsgZGV2aWNlSWQ6IHN0cmluZzsgZmlsZU5hbWU6IHN0cmluZyB9W10gPSBbXTtcclxuICAgIGZvciAoY29uc3QgZGV2IG9mIGZzLnJlYWRkaXJTeW5jKG9wc1Jvb3QsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KSkge1xyXG4gICAgICBpZiAoIWRldi5pc0RpcmVjdG9yeSgpIHx8IGRldi5uYW1lID09PSBvd25EZXZpY2VJZCkgY29udGludWU7XHJcbiAgICAgIGNvbnN0IGFmdGVyID0gYWZ0ZXJGaWxlQnlEZXZpY2UuZ2V0KGRldi5uYW1lKSA/PyBudWxsO1xyXG4gICAgICBjb25zdCBmaWxlcyA9IGZzXHJcbiAgICAgICAgLnJlYWRkaXJTeW5jKHBhdGguam9pbihvcHNSb290LCBkZXYubmFtZSkpXHJcbiAgICAgICAgLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aCgnLmpzb25sJykpXHJcbiAgICAgICAgLnNvcnQoKTtcclxuICAgICAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB7XHJcbiAgICAgICAgaWYgKGFmdGVyICYmIGYgPD0gYWZ0ZXIpIGNvbnRpbnVlO1xyXG4gICAgICAgIG91dC5wdXNoKHsgZGV2aWNlSWQ6IGRldi5uYW1lLCBmaWxlTmFtZTogZiB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG91dDtcclxuICB9XHJcblxyXG4gIGFzeW5jIGZldGNoQmF0Y2goZGV2aWNlSWQ6IHN0cmluZywgZmlsZU5hbWU6IHN0cmluZyk6IFByb21pc2U8T3BbXT4ge1xyXG4gICAgY29uc3QgcCA9IHBhdGguam9pbih0aGlzLm9wc0RpcihkZXZpY2VJZCksIGZpbGVOYW1lKTtcclxuICAgIGNvbnN0IHRleHQgPSBmcy5yZWFkRmlsZVN5bmMocCwgJ3V0ZjgnKTtcclxuICAgIGNvbnN0IG9wczogT3BbXSA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBsaW5lIG9mIHRleHQuc3BsaXQoJ1xcbicpKSB7XHJcbiAgICAgIGNvbnN0IHRyaW1tZWQgPSBsaW5lLnRyaW0oKTtcclxuICAgICAgaWYgKCF0cmltbWVkKSBjb250aW51ZTtcclxuICAgICAgb3BzLnB1c2goSlNPTi5wYXJzZSh0cmltbWVkKSBhcyBPcCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb3BzO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgYW5ub3VuY2UoZGV2aWNlSWQ6IHN0cmluZywgdXNlck5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgZGlyID0gdGhpcy5vcHNEaXIoZGV2aWNlSWQpO1xyXG4gICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICBjb25zdCBwID0gcGF0aC5qb2luKGRpciwgJ2RldmljZS5qc29uJyk7XHJcbiAgICBjb25zdCB0bXAgPSBwICsgJy50bXAnO1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyh0bXAsIEpTT04uc3RyaW5naWZ5KHsgZGV2aWNlSWQsIHVzZXJOYW1lLCBsYXN0U2VlbkF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSksICd1dGY4Jyk7XHJcbiAgICBmcy5yZW5hbWVTeW5jKHRtcCwgcCk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBsaXN0UGVlcnMoKTogUHJvbWlzZTxQZWVySW5mb1tdPiB7XHJcbiAgICBjb25zdCBvcHNSb290ID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ29wcycpO1xyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKG9wc1Jvb3QpKSByZXR1cm4gW107XHJcbiAgICBjb25zdCBwZWVyczogUGVlckluZm9bXSA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBkZXYgb2YgZnMucmVhZGRpclN5bmMob3BzUm9vdCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pKSB7XHJcbiAgICAgIGlmICghZGV2LmlzRGlyZWN0b3J5KCkpIGNvbnRpbnVlO1xyXG4gICAgICBjb25zdCBwID0gcGF0aC5qb2luKG9wc1Jvb3QsIGRldi5uYW1lLCAnZGV2aWNlLmpzb24nKTtcclxuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHApKSB7XHJcbiAgICAgICAgcGVlcnMucHVzaCh7IGRldmljZUlkOiBkZXYubmFtZSwgdXNlck5hbWU6IG51bGwsIGxhc3RTZWVuQXQ6IG51bGwgfSk7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBpbmZvID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocCwgJ3V0ZjgnKSkgYXMgUGVlckluZm87XHJcbiAgICAgICAgcGVlcnMucHVzaCh7IGRldmljZUlkOiBkZXYubmFtZSwgdXNlck5hbWU6IGluZm8udXNlck5hbWUgPz8gbnVsbCwgbGFzdFNlZW5BdDogaW5mby5sYXN0U2VlbkF0ID8/IG51bGwgfSk7XHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIHBlZXJzLnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIHVzZXJOYW1lOiBudWxsLCBsYXN0U2VlbkF0OiBudWxsIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGVlcnM7XHJcbiAgfVxyXG5cclxuICBhc3luYyBwdXRCbG9iKHNoYTI1Njogc3RyaW5nLCBkYXRhOiBCdWZmZXIpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIGNvbnN0IGRpciA9IHBhdGguam9pbih0aGlzLnJvb3QsICdibG9icycsIHNoYTI1Ni5zbGljZSgwLCAyKSk7XHJcbiAgICBjb25zdCBwID0gcGF0aC5qb2luKGRpciwgc2hhMjU2KTtcclxuICAgIGlmIChmcy5leGlzdHNTeW5jKHApKSByZXR1cm4gZmFsc2U7XHJcbiAgICBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICAgIGNvbnN0IHRtcCA9IHAgKyAnLnRtcC0nICsgcHJvY2Vzcy5waWQ7XHJcbiAgICBmcy53cml0ZUZpbGVTeW5jKHRtcCwgZGF0YSk7XHJcbiAgICB0cnkge1xyXG4gICAgICBmcy5yZW5hbWVTeW5jKHRtcCwgcCk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgZnMucm1TeW5jKHRtcCwgeyBmb3JjZTogdHJ1ZSB9KTsgLy8gcGVlciB3b24gdGhlIHJhY2U7IGNvbnRlbnQtYWRkcmVzc2VkIHNvIGlkZW50aWNhbFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXRCbG9iKHNoYTI1Njogc3RyaW5nKTogUHJvbWlzZTxCdWZmZXIgfCBudWxsPiB7XHJcbiAgICBjb25zdCBwID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ2Jsb2JzJywgc2hhMjU2LnNsaWNlKDAsIDIpLCBzaGEyNTYpO1xyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKHApKSByZXR1cm4gbnVsbDtcclxuICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMocCk7XHJcbiAgfVxyXG59XHJcbiIsICIvLyBTeW5jRW5naW5lOiBwZXJpb2RpYyArIGV2ZW50LWRyaXZlbiBleHBvcnQvaW1wb3J0IGxvb3Agb3ZlciBhIFN5bmNUcmFuc3BvcnQuXHJcbi8vIExvY2FsLWZpcnN0OiB0aGUgYXBwIGlzIGZ1bGx5IHVzYWJsZSB3aXRoIHN5bmMgZGlzYWJsZWQgb3IgdGhlIGZvbGRlciBvZmZsaW5lO1xyXG4vLyBvcHMgcXVldWUgaW4gdGhlIG9wbG9nIGFuZCBmbHVzaCB3aGVuIHRoZSB0cmFuc3BvcnQgcmV0dXJucy5cclxuXHJcbmltcG9ydCB0eXBlIHsgU3RvcmUgfSBmcm9tICcuLi9kYi9zdG9yZSc7XHJcbmltcG9ydCB7IGdldE1ldGEsIHNldE1ldGEgfSBmcm9tICcuLi9kYi9kYic7XHJcbmltcG9ydCB0eXBlIHsgU3luY1RyYW5zcG9ydCB9IGZyb20gJy4vdHJhbnNwb3J0JztcclxuaW1wb3J0IHR5cGUgeyBTeW5jU3RhdHVzLCBTeW5jU3RhdHVzU3RhdGUgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xyXG5cclxuY29uc3QgRVhQT1JUX0RFQk9VTkNFX01TID0gMV81MDA7XHJcbmNvbnN0IFBPTExfSU5URVJWQUxfTVMgPSA1XzAwMDtcclxuXHJcbmV4cG9ydCBjbGFzcyBTeW5jRW5naW5lIHtcclxuICBwcml2YXRlIHRyYW5zcG9ydDogU3luY1RyYW5zcG9ydCB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgdGltZXI6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSBleHBvcnRUaW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIHJ1bm5pbmcgPSBmYWxzZTtcclxuICBwcml2YXRlIGN1cnJlbnQ6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKTtcclxuICBwcml2YXRlIHN0YXRlOiBTeW5jU3RhdHVzU3RhdGUgPSAnZGlzYWJsZWQnO1xyXG4gIHByaXZhdGUgbGFzdEVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIGxhc3RTeW5jQXQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgdXNlck5hbWU6IHN0cmluZztcclxuICBwcml2YXRlIG9uU3RhdHVzOiAoczogU3luY1N0YXR1cykgPT4gdm9pZDtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIHN0b3JlOiBTdG9yZSxcclxuICAgIHVzZXJOYW1lOiBzdHJpbmcsXHJcbiAgICBvblN0YXR1czogKHM6IFN5bmNTdGF0dXMpID0+IHZvaWQsXHJcbiAgKSB7XHJcbiAgICB0aGlzLnVzZXJOYW1lID0gdXNlck5hbWU7XHJcbiAgICB0aGlzLm9uU3RhdHVzID0gb25TdGF0dXM7XHJcbiAgfVxyXG5cclxuICBzZXRUcmFuc3BvcnQodHJhbnNwb3J0OiBTeW5jVHJhbnNwb3J0IHwgbnVsbCk6IHZvaWQge1xyXG4gICAgdGhpcy50cmFuc3BvcnQgPSB0cmFuc3BvcnQ7XHJcbiAgICBpZiAodGhpcy50aW1lcikgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVyKTtcclxuICAgIHRoaXMudGltZXIgPSBudWxsO1xyXG4gICAgaWYgKHRyYW5zcG9ydCkge1xyXG4gICAgICAvLyBTeW5jIGN1cnNvcnMgYmVsb25nIHRvIGEgc3BlY2lmaWMgZm9sZGVyLiBQb2ludGluZyBhdCBhIGRpZmZlcmVudCBmb2xkZXJcclxuICAgICAgLy8gbXVzdCByZS1wdWJsaXNoIGV2ZXJ5dGhpbmcgKG9wLWlkIGRlZHVwIG1ha2VzIHRoYXQgc2FmZSkgYW5kIHJlLWltcG9ydFxyXG4gICAgICAvLyBwZWVycyBmcm9tIHNjcmF0Y2ggXHUyMDE0IG90aGVyd2lzZSB0aGUgbmV3IGZvbGRlciBnZXRzIGEgcGVybWFuZW50bHlcclxuICAgICAgLy8gaW5jb21wbGV0ZSBkYXRhc2V0LlxyXG4gICAgICBjb25zdCBmb2xkZXJLZXkgPSB0cmFuc3BvcnQubG9jYXRpb24oKTtcclxuICAgICAgY29uc3Qga25vd25Gb2xkZXIgPSBnZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdzeW5jX2ZvbGRlcl9rZXknKTtcclxuICAgICAgaWYgKGtub3duRm9sZGVyICE9PSBmb2xkZXJLZXkpIHtcclxuICAgICAgICBzZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdsYXN0X2V4cG9ydGVkX3NlcScsICcwJyk7XHJcbiAgICAgICAgdGhpcy5zdG9yZS5kYi5wcmVwYXJlKCdERUxFVEUgRlJPTSBzeW5jX3BlZXJzJykucnVuKCk7XHJcbiAgICAgICAgc2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnc3luY19mb2xkZXJfa2V5JywgZm9sZGVyS2V5KTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnN0YXRlID0gJ2lkbGUnO1xyXG4gICAgICB0aGlzLnRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4gdm9pZCB0aGlzLmN5Y2xlKCksIFBPTExfSU5URVJWQUxfTVMpO1xyXG4gICAgICB2b2lkIHRoaXMuY3ljbGUoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuc3RhdGUgPSAnZGlzYWJsZWQnO1xyXG4gICAgICB0aGlzLmVtaXRTdGF0dXMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKiBVcGRhdGUgdGhlIGFubm91bmNlZCBkaXNwbGF5IG5hbWUgKGlkZW50aXR5IGNhbiBiZSBzZXQgYWZ0ZXIgYm9vdCkuICovXHJcbiAgc2V0VXNlck5hbWUobmFtZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICB0aGlzLnVzZXJOYW1lID0gbmFtZTtcclxuICB9XHJcblxyXG4gIC8qKiBDYWxsIGFmdGVyIGFueSBsb2NhbCBtdXRhdGlvbiBcdTIwMTQgZGVib3VuY2VkIGV4cG9ydCBzbyByYXBpZCBlZGl0cyBiYXRjaC4gKi9cclxuICBub3RlTG9jYWxDaGFuZ2UoKTogdm9pZCB7XHJcbiAgICBpZiAoIXRoaXMudHJhbnNwb3J0KSByZXR1cm47XHJcbiAgICBpZiAodGhpcy5leHBvcnRUaW1lcikgY2xlYXJUaW1lb3V0KHRoaXMuZXhwb3J0VGltZXIpO1xyXG4gICAgdGhpcy5leHBvcnRUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gdm9pZCB0aGlzLmN5Y2xlKCksIEVYUE9SVF9ERUJPVU5DRV9NUyk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBjeWNsZSgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICghdGhpcy50cmFuc3BvcnQgfHwgdGhpcy5ydW5uaW5nKSByZXR1cm4gdGhpcy5jdXJyZW50O1xyXG4gICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcclxuICAgIGxldCByZWxlYXNlITogKCkgPT4gdm9pZDtcclxuICAgIHRoaXMuY3VycmVudCA9IG5ldyBQcm9taXNlKChyKSA9PiAocmVsZWFzZSA9IHIpKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGlmICghdGhpcy50cmFuc3BvcnQuYXZhaWxhYmxlKCkpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKCdvZmZsaW5lJywgJ1N5bmMgZm9sZGVyIGlzIG5vdCByZWFjaGFibGUnKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5zZXRTdGF0ZSgnc3luY2luZycsIG51bGwpO1xyXG4gICAgICBhd2FpdCB0aGlzLmV4cG9ydE9wcygpO1xyXG4gICAgICBhd2FpdCB0aGlzLmltcG9ydE9wcygpO1xyXG4gICAgICBhd2FpdCB0aGlzLnRyYW5zcG9ydC5hbm5vdW5jZSh0aGlzLnN0b3JlLmRldmljZUlkLCB0aGlzLnVzZXJOYW1lKTtcclxuICAgICAgdGhpcy5sYXN0U3luY0F0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xyXG4gICAgICB0aGlzLnNldFN0YXRlKCdpZGxlJywgbnVsbCk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSgnZXJyb3InLCBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycikpO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XHJcbiAgICAgIHJlbGVhc2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgZXhwb3J0T3BzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgaWYgKCF0aGlzLnRyYW5zcG9ydCkgcmV0dXJuO1xyXG4gICAgY29uc3QgbGFzdEV4cG9ydGVkID0gTnVtYmVyKGdldE1ldGEodGhpcy5zdG9yZS5kYiwgJ2xhc3RfZXhwb3J0ZWRfc2VxJykgPz8gJzAnKTtcclxuICAgIGNvbnN0IHBlbmRpbmcgPSB0aGlzLnN0b3JlLm9wc1NpbmNlKGxhc3RFeHBvcnRlZCwgdHJ1ZSk7XHJcbiAgICBpZiAocGVuZGluZy5sZW5ndGggPT09IDApIHJldHVybjtcclxuICAgIGNvbnN0IG1heFNlcSA9IHBlbmRpbmdbcGVuZGluZy5sZW5ndGggLSAxXS5zZXE7XHJcbiAgICBjb25zdCBiYXRjaE5hbWUgPSBTdHJpbmcobWF4U2VxKS5wYWRTdGFydCgxMiwgJzAnKSArICcuanNvbmwnO1xyXG4gICAgYXdhaXQgdGhpcy50cmFuc3BvcnQucHVibGlzaE9wcyhcclxuICAgICAgdGhpcy5zdG9yZS5kZXZpY2VJZCxcclxuICAgICAgYmF0Y2hOYW1lLFxyXG4gICAgICBwZW5kaW5nLm1hcCgocCkgPT4gcC5vcCksXHJcbiAgICApO1xyXG4gICAgc2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnbGFzdF9leHBvcnRlZF9zZXEnLCBTdHJpbmcobWF4U2VxKSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGltcG9ydE9wcygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICghdGhpcy50cmFuc3BvcnQpIHJldHVybjtcclxuICAgIGNvbnN0IHBlZXJzID0gdGhpcy5zdG9yZS5kYlxyXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIGRldmljZV9pZCwgbGFzdF9maWxlIEZST00gc3luY19wZWVycycpXHJcbiAgICAgIC5hbGwoKSBhcyB7IGRldmljZV9pZDogc3RyaW5nOyBsYXN0X2ZpbGU6IHN0cmluZyB8IG51bGwgfVtdO1xyXG4gICAgY29uc3QgYWZ0ZXJCeURldmljZSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmcgfCBudWxsPihwZWVycy5tYXAoKHApID0+IFtwLmRldmljZV9pZCwgcC5sYXN0X2ZpbGVdKSk7XHJcblxyXG4gICAgY29uc3QgYmF0Y2hlcyA9IGF3YWl0IHRoaXMudHJhbnNwb3J0Lmxpc3RQZWVyQmF0Y2hlcyh0aGlzLnN0b3JlLmRldmljZUlkLCBhZnRlckJ5RGV2aWNlKTtcclxuICAgIC8vIEJhdGNoZXMgbXVzdCBhcHBseSBzdHJpY3RseSBpbiBmaWxlbmFtZSBvcmRlciBwZXIgZGV2aWNlLiBJZiBvbmUgZmlsZSBpc1xyXG4gICAgLy8gdW5yZWFkYWJsZSAoZS5nLiBzdGlsbCBzeW5jaW5nIGRvd24pLCBTVE9QIHRoYXQgZGV2aWNlIGZvciB0aGlzIGN5Y2xlIFx1MjAxNFxyXG4gICAgLy8gYWR2YW5jaW5nIHBhc3QgaXQgd291bGQgcGVybWFuZW50bHkgc2tpcCBpdHMgb3BzLlxyXG4gICAgY29uc3Qgc3RhbGxlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG4gICAgZm9yIChjb25zdCBiIG9mIGJhdGNoZXMpIHtcclxuICAgICAgaWYgKHN0YWxsZWQuaGFzKGIuZGV2aWNlSWQpKSBjb250aW51ZTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBvcHMgPSBhd2FpdCB0aGlzLnRyYW5zcG9ydC5mZXRjaEJhdGNoKGIuZGV2aWNlSWQsIGIuZmlsZU5hbWUpO1xyXG4gICAgICAgIHRoaXMuc3RvcmUuYXBwbHlSZW1vdGVPcHMob3BzKTtcclxuICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgc3RhbGxlZC5hZGQoYi5kZXZpY2VJZCk7IC8vIHJldHJ5IGZyb20gdGhpcyBmaWxlIG5leHQgY3ljbGU7IGN1cnNvciB1bnRvdWNoZWRcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnN0b3JlLmRiXHJcbiAgICAgICAgLnByZXBhcmUoXHJcbiAgICAgICAgICBgSU5TRVJUIElOVE8gc3luY19wZWVycyhkZXZpY2VfaWQsIGxhc3RfZmlsZSwgbGFzdF9zZWVuX2F0KSBWQUxVRVMoPyw/LD8pXHJcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoZGV2aWNlX2lkKSBETyBVUERBVEUgU0VUIGxhc3RfZmlsZT1leGNsdWRlZC5sYXN0X2ZpbGUsIGxhc3Rfc2Vlbl9hdD1leGNsdWRlZC5sYXN0X3NlZW5fYXRgLFxyXG4gICAgICAgIClcclxuICAgICAgICAucnVuKGIuZGV2aWNlSWQsIGIuZmlsZU5hbWUsIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVmcmVzaCBwZWVyIGRpc3BsYXkgbmFtZXMgZnJvbSBhbm5vdW5jZW1lbnRzLlxyXG4gICAgZm9yIChjb25zdCBwIG9mIGF3YWl0IHRoaXMudHJhbnNwb3J0Lmxpc3RQZWVycygpKSB7XHJcbiAgICAgIGlmIChwLmRldmljZUlkID09PSB0aGlzLnN0b3JlLmRldmljZUlkKSBjb250aW51ZTtcclxuICAgICAgdGhpcy5zdG9yZS5kYlxyXG4gICAgICAgIC5wcmVwYXJlKFxyXG4gICAgICAgICAgYElOU0VSVCBJTlRPIHN5bmNfcGVlcnMoZGV2aWNlX2lkLCB1c2VyX25hbWUsIGxhc3Rfc2Vlbl9hdCkgVkFMVUVTKD8sPyw/KVxyXG4gICAgICAgICAgIE9OIENPTkZMSUNUKGRldmljZV9pZCkgRE8gVVBEQVRFIFNFVCB1c2VyX25hbWU9Q09BTEVTQ0UoZXhjbHVkZWQudXNlcl9uYW1lLCBzeW5jX3BlZXJzLnVzZXJfbmFtZSksXHJcbiAgICAgICAgICAgICBsYXN0X3NlZW5fYXQ9Q09BTEVTQ0UoZXhjbHVkZWQubGFzdF9zZWVuX2F0LCBzeW5jX3BlZXJzLmxhc3Rfc2Vlbl9hdClgLFxyXG4gICAgICAgIClcclxuICAgICAgICAucnVuKHAuZGV2aWNlSWQsIHAudXNlck5hbWUsIHAubGFzdFNlZW5BdCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldFN0YXRlKHN0YXRlOiBTeW5jU3RhdHVzU3RhdGUsIGVycm9yOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XHJcbiAgICB0aGlzLnN0YXRlID0gc3RhdGU7XHJcbiAgICB0aGlzLmxhc3RFcnJvciA9IGVycm9yO1xyXG4gICAgdGhpcy5lbWl0U3RhdHVzKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGVtaXRTdGF0dXMoKTogdm9pZCB7XHJcbiAgICB0aGlzLm9uU3RhdHVzKHRoaXMuc3RhdHVzKCkpO1xyXG4gIH1cclxuXHJcbiAgc3RhdHVzKCk6IFN5bmNTdGF0dXMge1xyXG4gICAgY29uc3QgbGFzdEV4cG9ydGVkID0gTnVtYmVyKGdldE1ldGEodGhpcy5zdG9yZS5kYiwgJ2xhc3RfZXhwb3J0ZWRfc2VxJykgPz8gJzAnKTtcclxuICAgIGNvbnN0IHBlbmRpbmdSb3cgPSB0aGlzLnN0b3JlLmRiXHJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgQ09VTlQoKikgQVMgYyBGUk9NIG9wbG9nIFdIRVJFIHNlcSA+ID8gQU5EIGRldmljZV9pZCA9ID8nKVxyXG4gICAgICAuZ2V0KGxhc3RFeHBvcnRlZCwgdGhpcy5zdG9yZS5kZXZpY2VJZCkgYXMgeyBjOiBudW1iZXIgfTtcclxuICAgIGNvbnN0IGNvbmZsaWN0Um93ID0gdGhpcy5zdG9yZS5kYlxyXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIENPVU5UKCopIEFTIGMgRlJPTSBzeW5jX2NvbmZsaWN0cyBXSEVSRSByZXNvbHZlZF9hdCBJUyBOVUxMJylcclxuICAgICAgLmdldCgpIGFzIHsgYzogbnVtYmVyIH07XHJcbiAgICBjb25zdCBwZWVycyA9IHRoaXMuc3RvcmUuZGJcclxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBkZXZpY2VfaWQgQVMgZGV2aWNlSWQsIHVzZXJfbmFtZSBBUyB1c2VyTmFtZSwgbGFzdF9zZWVuX2F0IEFTIGxhc3RTZWVuQXQgRlJPTSBzeW5jX3BlZXJzJylcclxuICAgICAgLmFsbCgpIGFzIFN5bmNTdGF0dXNbJ3BlZXJzJ107XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdGF0ZTogdGhpcy5zdGF0ZSxcclxuICAgICAgZm9sZGVyOiB0aGlzLnRyYW5zcG9ydCA/IHRoaXMudHJhbnNwb3J0LmxvY2F0aW9uKCkgOiBudWxsLFxyXG4gICAgICBsYXN0U3luY0F0OiB0aGlzLmxhc3RTeW5jQXQsXHJcbiAgICAgIGxhc3RFcnJvcjogdGhpcy5sYXN0RXJyb3IsXHJcbiAgICAgIHBlbmRpbmdPcHM6IHBlbmRpbmdSb3cuYyxcclxuICAgICAgb3BlbkNvbmZsaWN0czogY29uZmxpY3RSb3cuYyxcclxuICAgICAgcGVlcnMsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqIFN0b3BzIHRpbWVycyBhbmQgd2FpdHMgZm9yIGFueSBpbi1mbGlnaHQgY3ljbGUgXHUyMDE0IHNhZmUgdG8gY2xvc2UgdGhlIERCIGFmdGVyd2FyZHMuICovXHJcbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICh0aGlzLnRpbWVyKSBjbGVhckludGVydmFsKHRoaXMudGltZXIpO1xyXG4gICAgaWYgKHRoaXMuZXhwb3J0VGltZXIpIGNsZWFyVGltZW91dCh0aGlzLmV4cG9ydFRpbWVyKTtcclxuICAgIHRoaXMudGltZXIgPSBudWxsO1xyXG4gICAgdGhpcy5leHBvcnRUaW1lciA9IG51bGw7XHJcbiAgICBhd2FpdCB0aGlzLmN1cnJlbnQ7XHJcbiAgfVxyXG59XHJcbiIsICIvLyBTYW1wbGUgU3VwcG9ydCBBSSBwcm9qZWN0IGRhdGEuIEV2ZXJ5IHJlY29yZCBjYXJyaWVzIHNhbXBsZT0xIGFuZCBhIFtTQU1QTEVdIHRpdGxlXHJcbi8vIG1hcmtlciBjb252ZW50aW9uIGlzIE5PVCB1c2VkIFx1MjAxNCB0aGUgc2FtcGxlIGZsYWcgZHJpdmVzIGJhZGdlcyArIG9uZS1jbGljayByZW1vdmFsLlxyXG4vLyBObyByZWFsIGNvbmZpZGVudGlhbCBkYXRhOiBuYW1lcyBvZiBzeXN0ZW1zIGFyZSBnZW5lcmljLCBjb250ZW50cyBhcmUgaWxsdXN0cmF0aXZlLlxyXG5cclxuaW1wb3J0IHR5cGUgeyBTdG9yZSB9IGZyb20gJy4vc3RvcmUnO1xyXG5pbXBvcnQgdHlwZSB7IEl0ZW1UeXBlLCBQcmlvcml0eSB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XHJcblxyXG5pbnRlcmZhY2UgU2VlZEl0ZW0ge1xyXG4gIHR5cGU6IEl0ZW1UeXBlO1xyXG4gIHRpdGxlOiBzdHJpbmc7XHJcbiAgYm9keVRleHQ/OiBzdHJpbmc7XHJcbiAgc3RhdHVzPzogc3RyaW5nO1xyXG4gIHByaW9yaXR5PzogUHJpb3JpdHk7XHJcbiAgb3duZXI/OiAnam9obicgfCAnbWFyaycgfCBudWxsO1xyXG4gIGR1ZURhdGU/OiBzdHJpbmc7XHJcbiAgdGFncz86IHN0cmluZ1tdO1xyXG4gIGV4dHJhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcbiAgbWlsZXN0b25lPzogc3RyaW5nO1xyXG4gIGxlYWRlcnNoaXBWaXNpYmxlPzogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRTZWVkRGF0YShzdG9yZTogU3RvcmUpOiBudW1iZXIge1xyXG4gIC8vIFByb2JlIGRpcmVjdGx5IChsaXN0SXRlbXMgaGlkZXMgYXJjaGl2ZWQgcm93cyBcdTIwMTQgYXJjaGl2ZWQgc2FtcGxlcyBtdXN0IHN0aWxsIGJsb2NrIGEgcmVsb2FkKS5cclxuICBjb25zdCBleGlzdGluZyA9IHN0b3JlLmRiLnByZXBhcmUoJ1NFTEVDVCAxIEZST00gaXRlbXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCBMSU1JVCAxJykuZ2V0KCk7XHJcbiAgaWYgKGV4aXN0aW5nKSByZXR1cm4gMDsgLy8gYWxyZWFkeSBsb2FkZWRcclxuXHJcbiAgY29uc3QgbTEgPSBzdG9yZS51cHNlcnRNaWxlc3RvbmUoeyBuYW1lOiAnRGlzY292ZXJ5ICYgQWNjZXNzJywgdGFyZ2V0RGF0ZTogJzIwMjYtMDgtMTUnLCBzdGF0dXM6ICdhY3RpdmUnLCBzb3J0OiAxLCBzYW1wbGU6IDEsIGRlc2NyaXB0aW9uOiAnU2VjdXJlIHN5c3RlbSBhY2Nlc3MsIGludmVudG9yeSBrbm93bGVkZ2Ugc291cmNlcywgY29uZmlybSBzY29wZSB3aXRoIGxlYWRlcnNoaXAuJyB9KTtcclxuICBjb25zdCBtMiA9IHN0b3JlLnVwc2VydE1pbGVzdG9uZSh7IG5hbWU6ICdLbm93bGVkZ2UgUGlwZWxpbmUgTVZQJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTAtMDEnLCBzdGF0dXM6ICdwbGFubmVkJywgc29ydDogMiwgc2FtcGxlOiAxLCBkZXNjcmlwdGlvbjogJ0luZ2VzdCwgY2xlYW4sIGFuZCBpbmRleCB0aGUgZmlyc3Qga25vd2xlZGdlIGRvbWFpbiBlbmQgdG8gZW5kLicgfSk7XHJcbiAgY29uc3QgbTMgPSBzdG9yZS51cHNlcnRNaWxlc3RvbmUoeyBuYW1lOiAnUGlsb3Qgd2l0aCBTdXBwb3J0IFRlYW0nLCB0YXJnZXREYXRlOiAnMjAyNi0xMi0wMScsIHN0YXR1czogJ3BsYW5uZWQnLCBzb3J0OiAzLCBzYW1wbGU6IDEsIGRlc2NyaXB0aW9uOiAnTGltaXRlZCBwaWxvdDogbWVhc3VyZSBkZWZsZWN0aW9uLCBhY2N1cmFjeSwgYW5kIGFnZW50IHNhdGlzZmFjdGlvbi4nIH0pO1xyXG4gIHN0b3JlLnVwc2VydFJlbGVhc2UoeyBuYW1lOiAnU3VwcG9ydCBBSSBQaWxvdCAwLjEnLCB2ZXJzaW9uOiAnMC4xJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTEtMTUnLCBzdGF0dXM6ICdwbGFubmVkJywgZ29hbHM6ICdGaXJzdCBpbnRlcm5hbCBwaWxvdCBidWlsZDogc2luZ2xlIGtub3dsZWRnZSBkb21haW4sIDEwIHN1cHBvcnQgYWdlbnRzLCBmZWVkYmFjayBsb29wIGluIHBsYWNlLicsIHNhbXBsZTogMSB9KTtcclxuXHJcbiAgY29uc3QgbWlsZXN0b25lSWQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7IG0xOiBtMS5pZCwgbTI6IG0yLmlkLCBtMzogbTMuaWQgfTtcclxuXHJcbiAgY29uc3QgaXRlbXM6IChTZWVkSXRlbSAmIHsga2V5OiBzdHJpbmcgfSlbXSA9IFtcclxuICAgIC8vIEZlYXR1cmVzXHJcbiAgICB7IGtleTogJ2ZlYXRBbnN3ZXInLCB0eXBlOiAnZmVhdHVyZScsIHRpdGxlOiAnQUkgYW5zd2VyIGdlbmVyYXRpb24gb3ZlciBrbm93bGVkZ2UgYmFzZScsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTInLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgYm9keVRleHQ6ICdDb3JlIGNhcGFiaWxpdHk6IGdpdmVuIGEgc3VwcG9ydCBxdWVzdGlvbiwgcmV0cmlldmUgcmVsZXZhbnQga25vd2xlZGdlIGFydGljbGVzIGFuZCBnZW5lcmF0ZSBhIGdyb3VuZGVkLCBjaXRlZCBhbnN3ZXIuJyB9LFxyXG4gICAgeyBrZXk6ICdmZWF0SW5nZXN0JywgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0tub3dsZWRnZSBpbmdlc3Rpb24gcGlwZWxpbmUgKFNhbGVzZm9yY2UgS0EgZXhwb3J0KScsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBib2R5VGV4dDogJ0V4cG9ydCBrbm93bGVkZ2UgYXJ0aWNsZXMsIG5vcm1hbGl6ZSB0byBjbGVhbiB0ZXh0LCBjaHVuaywgYW5kIGluZGV4IGZvciByZXRyaWV2YWwuJyB9LFxyXG4gICAgeyBrZXk6ICdmZWF0RmVlZGJhY2snLCB0eXBlOiAnZmVhdHVyZScsIHRpdGxlOiAnQWdlbnQgZmVlZGJhY2sgY2FwdHVyZSAodGh1bWJzICsgcmVhc29uIGNvZGVzKScsIHN0YXR1czogJ2JhY2tsb2cnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnbWFyaycsIG1pbGVzdG9uZTogJ20zJywgYm9keVRleHQ6ICdQaWxvdCBhZ2VudHMgcmF0ZSBlYWNoIEFJIGFuc3dlcjsgcmVhc29ucyBmZWVkIHRoZSBxdWFsaXR5IGRhc2hib2FyZC4nIH0sXHJcblxyXG4gICAgLy8gUmVxdWlyZW1lbnRzXHJcbiAgICB7IGtleTogJ3JlcUNpdGF0aW9ucycsIHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnRXZlcnkgQUkgYW5zd2VyIG11c3QgY2l0ZSBpdHMgc291cmNlIGFydGljbGVzJywgc3RhdHVzOiAndG9kbycsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgZXh0cmE6IHsgYWNjZXB0YW5jZUNyaXRlcmlhOiAnQW5zd2VyIFVJIHNob3dzIGF0IGxlYXN0IG9uZSBzb3VyY2UgbGluayBwZXIgYW5zd2VyOyB1bmNpdGVkIGFuc3dlcnMgYXJlIHN1cHByZXNzZWQuJywgc2VjdXJpdHlDb25zaWRlcmF0aW9uczogJ0NpdGF0aW9ucyBtdXN0IG5vdCBleHBvc2UgcmVzdHJpY3RlZCBhcnRpY2xlcyB0byB1bmF1dGhvcml6ZWQgYWdlbnRzLicgfSB9LFxyXG4gICAgeyBrZXk6ICdyZXFQSEknLCB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ05vIFBISSBvciBjdXN0b21lciBkYXRhIG1heSBsZWF2ZSBhcHByb3ZlZCBzeXN0ZW1zJywgc3RhdHVzOiAnaW5fcHJvZ3Jlc3MnLCBwcmlvcml0eTogJ3VyZ2VudCcsIG93bmVyOiAnbWFyaycsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBhY2NlcHRhbmNlQ3JpdGVyaWE6ICdEYXRhIGZsb3cgZGlhZ3JhbSBhcHByb3ZlZCBieSBzZWN1cml0eTsgRExQIHNjYW4gb2YgcGlwZWxpbmUgb3V0cHV0IHNob3dzIHplcm8gUEhJLicsIHNlY3VyaXR5Q29uc2lkZXJhdGlvbnM6ICdCbG9ja2luZyByZXF1aXJlbWVudCBmb3IgYW55IGV4dGVybmFsIEFJIHNlcnZpY2UuJyB9IH0sXHJcbiAgICB7IGtleTogJ3JlcUZyZXNobmVzcycsIHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnS25vd2xlZGdlIGluZGV4IHJlZnJlc2hlcyB3aXRoaW4gMjRoIG9mIGFydGljbGUgdXBkYXRlcycsIHN0YXR1czogJ2JhY2tsb2cnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgZXh0cmE6IHsgYWNjZXB0YW5jZUNyaXRlcmlhOiAnQXJ0aWNsZSBlZGl0ZWQgaW4gc291cmNlIHN5c3RlbSBhcHBlYXJzIGluIHJldHJpZXZhbCByZXN1bHRzIHdpdGhpbiAyNCBob3Vycy4nIH0gfSxcclxuXHJcbiAgICAvLyBUYXNrc1xyXG4gICAgeyBrZXk6ICd0YXNrRXhwb3J0JywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0J1aWxkIFNhbGVzZm9yY2Uga25vd2xlZGdlIGFydGljbGUgZXhwb3J0IHNjcmlwdCcsIHN0YXR1czogJ2RvbmUnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMScsIGJvZHlUZXh0OiAnRXhwb3J0IGFsbCBwdWJsaXNoZWQgS0FzIHdpdGggbWV0YWRhdGEgdG8gc3RydWN0dXJlZCBmaWxlcy4nIH0sXHJcbiAgICB7IGtleTogJ3Rhc2tDbGVhbicsIHR5cGU6ICd0YXNrJywgdGl0bGU6ICdIVE1MXHUyMTkyY2xlYW4gdGV4dCBub3JtYWxpemF0aW9uIGZvciBleHBvcnRlZCBhcnRpY2xlcycsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTInLCBkdWVEYXRlOiAnMjAyNi0wNy0yNCcgfSxcclxuICAgIHsga2V5OiAndGFza0V2YWwnLCB0eXBlOiAndGFzaycsIHRpdGxlOiAnRHJhZnQgYW5zd2VyLXF1YWxpdHkgZXZhbHVhdGlvbiBydWJyaWMnLCBzdGF0dXM6ICd0b2RvJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcjogJ21hcmsnLCBtaWxlc3RvbmU6ICdtMicsIGR1ZURhdGU6ICcyMDI2LTA3LTMxJyB9LFxyXG4gICAgeyBrZXk6ICd0YXNrSW52ZW50b3J5JywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0ludmVudG9yeSBjYW5kaWRhdGUga25vd2xlZGdlIGRvbWFpbnMgYW5kIGFydGljbGUgY291bnRzJywgc3RhdHVzOiAnZG9uZScsIHByaW9yaXR5OiAnbWVkaXVtJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTEnIH0sXHJcblxyXG4gICAgLy8gQWNjZXNzIHJlcXVlc3RzXHJcbiAgICB7IGtleTogJ2FjY1NmQXBpJywgdHlwZTogJ2FjY2VzcycsIHRpdGxlOiAnU2FsZXNmb3JjZSBBUEkgYWNjZXNzIChLbm93bGVkZ2Ugb2JqZWN0LCByZWFkKScsIHN0YXR1czogJ3JlcXVlc3RlZCcsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdqb2huJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IHN5c3RlbTogJ1NhbGVzZm9yY2UgU2VydmljZSBDbG91ZCcsIGFjY2Vzc1R5cGU6ICdBUEkgcmVhZCAoS25vd2xlZGdlIG9iamVjdCknLCBidXNpbmVzc1JlYXNvbjogJ0F1dG9tYXRlZCBleHBvcnQgb2Yga25vd2xlZGdlIGFydGljbGVzIGZvciB0aGUgaW5nZXN0aW9uIHBpcGVsaW5lLicsIHJlcXVlc3RlZEZyb206ICdTYWxlc2ZvcmNlIHBsYXRmb3JtIHRlYW0nLCByZXF1ZXN0RGF0ZTogJzIwMjYtMDYtMzAnLCBuZXh0QWN0aW9uOiAnRm9sbG93IHVwIHdpdGggcGxhdGZvcm0gdGVhbSBsZWFkJywgZm9sbG93VXBEYXRlOiAnMjAyNi0wNy0xNScgfSB9LFxyXG4gICAgeyBrZXk6ICdhY2NBenVyZScsIHR5cGU6ICdhY2Nlc3MnLCB0aXRsZTogJ0F6dXJlIE9wZW5BSSBzZXJ2aWNlIHByb3Zpc2lvbmluZyBpbiBNY0tlc3NvbiB0ZW5hbnQnLCBzdGF0dXM6ICd1bmRlcl9yZXZpZXcnLCBwcmlvcml0eTogJ3VyZ2VudCcsIG93bmVyOiAnbWFyaycsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBzeXN0ZW06ICdBenVyZSBPcGVuQUkgKE1jS2Vzc29uIHRlbmFudCknLCBhY2Nlc3NUeXBlOiAnUmVzb3VyY2UgcHJvdmlzaW9uaW5nICsgQVBJIGtleXMnLCBidXNpbmVzc1JlYXNvbjogJ0FwcHJvdmVkLXRlbmFudCBMTE0gcmVxdWlyZWQgZm9yIGFuc3dlciBnZW5lcmF0aW9uIHdpdGhvdXQgZGF0YSBlZ3Jlc3MuJywgcmVxdWVzdGVkRnJvbTogJ0Nsb3VkIHBsYXRmb3JtIC8gc2VjdXJpdHknLCByZXF1ZXN0RGF0ZTogJzIwMjYtMDYtMjInLCBuZXh0QWN0aW9uOiAnU2VjdXJpdHkgcmV2aWV3IG1lZXRpbmcnLCBmb2xsb3dVcERhdGU6ICcyMDI2LTA3LTE4JyB9IH0sXHJcbiAgICB7IGtleTogJ2FjY1NwJywgdHlwZTogJ2FjY2VzcycsIHRpdGxlOiAnU2hhcmVQb2ludCBzaXRlIGZvciBwaWxvdCBkb2N1bWVudGF0aW9uJywgc3RhdHVzOiAnZ3JhbnRlZCcsIHByaW9yaXR5OiAnbG93Jywgb3duZXI6ICdtYXJrJywgZXh0cmE6IHsgc3lzdGVtOiAnU2hhcmVQb2ludCBPbmxpbmUnLCBhY2Nlc3NUeXBlOiAnU2l0ZSBvd25lcicsIGJ1c2luZXNzUmVhc29uOiAnU2hhcmVkIGRvY3VtZW50YXRpb24gYW5kIHBpbG90IGFydGlmYWN0cy4nLCByZXF1ZXN0ZWRGcm9tOiAnSVQgc2VydmljZSBkZXNrJywgcmVxdWVzdERhdGU6ICcyMDI2LTA2LTEwJywgYXBwcm92ZWRCeTogJ0lUIHNlcnZpY2UgZGVzaycsIGRhdGVHcmFudGVkOiAnMjAyNi0wNi0xMicgfSB9LFxyXG5cclxuICAgIC8vIERlY2lzaW9uc1xyXG4gICAgeyBrZXk6ICdkZWNUZW5hbnQnLCB0eXBlOiAnZGVjaXNpb24nLCB0aXRsZTogJ1VzZSB0ZW5hbnQtaG9zdGVkIEF6dXJlIE9wZW5BSSwgbm90IHB1YmxpYyBBUElzJywgc3RhdHVzOiAnYXBwcm92ZWQnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgY29udGV4dDogJ0Fuc3dlciBnZW5lcmF0aW9uIG5lZWRzIGFuIExMTS4gUHVibGljIEFJIEFQSXMgYXJlIHVuYXBwcm92ZWQgZm9yIGludGVybmFsIGRhdGEuJywgcHJvYmxlbTogJ1doaWNoIExMTSBob3N0aW5nIHBhdGggc2F0aXNmaWVzIHNlY3VyaXR5IHdoaWxlIHVuYmxvY2tpbmcgdGhlIHBpbG90PycsIG9wdGlvbnM6IFt7IHRpdGxlOiAnUHVibGljIEFQSSAoT3BlbkFJL0FudGhyb3BpYyBkaXJlY3QpJywgbm90ZXM6ICdGYXN0IGJ1dCB1bmFwcHJvdmVkIGZvciBpbnRlcm5hbCBkYXRhJywgc2VsZWN0ZWQ6IGZhbHNlIH0sIHsgdGl0bGU6ICdBenVyZSBPcGVuQUkgaW4gTWNLZXNzb24gdGVuYW50Jywgbm90ZXM6ICdEYXRhIHN0YXlzIGluIHRlbmFudDsgcHJvY3VyZW1lbnQgKyBwcm92aXNpb25pbmcgcmVxdWlyZWQnLCBzZWxlY3RlZDogdHJ1ZSB9LCB7IHRpdGxlOiAnTG9jYWwgb3Blbi13ZWlnaHRzIG1vZGVsJywgbm90ZXM6ICdObyBlZ3Jlc3MgYnV0IHdlYWtlciBxdWFsaXR5IGFuZCBoZWF2eSBpbmZyYScsIHNlbGVjdGVkOiBmYWxzZSB9XSwgcmVhc29uaW5nOiAnVGVuYW50IGhvc3Rpbmcga2VlcHMgZGF0YSBpbnNpZGUgYXBwcm92ZWQgYm91bmRhcnkgYW5kIGhhcyBhbiBleGlzdGluZyBlbnRlcnByaXNlIGFncmVlbWVudCBwYXRoLicsIHRyYWRlb2ZmczogJ1Nsb3dlciBzdGFydDsgY2FwYWNpdHkgcXVvdGFzOyBtb2RlbCBhdmFpbGFiaWxpdHkgbGFncyBwdWJsaWMgQVBJcy4nIH0gfSxcclxuICAgIHsga2V5OiAnZGVjRG9tYWluJywgdHlwZTogJ2RlY2lzaW9uJywgdGl0bGU6ICdQaWxvdCBzY29wZTogc3RhcnQgd2l0aCBvbmUgaGlnaC12b2x1bWUga25vd2xlZGdlIGRvbWFpbicsIHN0YXR1czogJ2Rpc2N1c3NpbmcnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIGV4dHJhOiB7IGNvbnRleHQ6ICdLbm93bGVkZ2UgYmFzZSBzcGFucyBtYW55IHByb2R1Y3QgYXJlYXMgd2l0aCB1bmV2ZW4gcXVhbGl0eS4nLCBwcm9ibGVtOiAnUGlsb3QgZXZlcnl0aGluZyBvciBvbmUgZG9tYWluIGZpcnN0PycsIG9wdGlvbnM6IFt7IHRpdGxlOiAnU2luZ2xlIGRvbWFpbiBwaWxvdCcsIG5vdGVzOiAnQ2xlYW5lciBtZWFzdXJlbWVudCwgZmFzdGVyIGl0ZXJhdGlvbicsIHNlbGVjdGVkOiB0cnVlIH0sIHsgdGl0bGU6ICdBbGwgZG9tYWlucyBhdCBvbmNlJywgbm90ZXM6ICdCcm9hZGVyIGltcGFjdCwgZGlsdXRlZCBxdWFsaXR5IHNpZ25hbCcsIHNlbGVjdGVkOiBmYWxzZSB9XSwgcmVhc29uaW5nOiAnU2luZ2xlLWRvbWFpbiBnaXZlcyBhIGNsZWFuIGFjY3VyYWN5IGJhc2VsaW5lIGFuZCBjb250YWluYWJsZSByZXZpZXcgbG9hZC4nIH0gfSxcclxuXHJcbiAgICAvLyBSaXNrc1xyXG4gICAgeyBrZXk6ICdyaXNrUXVhbGl0eScsIHR5cGU6ICdyaXNrJywgdGl0bGU6ICdLbm93bGVkZ2UgYXJ0aWNsZSBxdWFsaXR5IHRvbyBsb3cgZm9yIGdyb3VuZGVkIGFuc3dlcnMnLCBzdGF0dXM6ICdvcGVuJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IGxpa2VsaWhvb2Q6ICdtZWRpdW0nLCBpbXBhY3Q6ICdoaWdoJywgbWl0aWdhdGlvbjogJ1F1YWxpdHkgYXVkaXQgb2YgdGhlIHBpbG90IGRvbWFpbiBiZWZvcmUgaW5kZXhpbmc7IGFydGljbGUgY2xlYW51cCBiYWNrbG9nIHdpdGggdGhlIGtub3dsZWRnZSB0ZWFtLicgfSB9LFxyXG4gICAgeyBrZXk6ICdyaXNrQWNjZXNzJywgdHlwZTogJ3Jpc2snLCB0aXRsZTogJ0FjY2VzcyBhcHByb3ZhbHMgc2xpcCBhbmQgc3RhbGwgdGhlIHBpcGVsaW5lIGJ1aWxkJywgc3RhdHVzOiAnbWl0aWdhdGluZycsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnbWFyaycsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBsaWtlbGlob29kOiAnaGlnaCcsIGltcGFjdDogJ2hpZ2gnLCBtaXRpZ2F0aW9uOiAnV2Vla2x5IGZvbGxvdy11cHM7IGxlYWRlcnNoaXAgZXNjYWxhdGlvbiBwYXRoIGFncmVlZDsgYnVpbGQgcGlwZWxpbmUgYWdhaW5zdCBleHBvcnRlZCBzYW1wbGUgZGF0YSBtZWFud2hpbGUuJyB9IH0sXHJcblxyXG4gICAgLy8gQmxvY2tlcnNcclxuICAgIHsga2V5OiAnYmxrQXp1cmUnLCB0eXBlOiAnYmxvY2tlcicsIHRpdGxlOiAnQ2Fubm90IGdlbmVyYXRlIGFuc3dlcnMgdW50aWwgQXp1cmUgT3BlbkFJIGlzIHByb3Zpc2lvbmVkJywgc3RhdHVzOiAnYWN0aXZlJywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgd2FpdGluZ09uOiAnQ2xvdWQgcGxhdGZvcm0gdGVhbSAvIHNlY3VyaXR5IHJldmlldycsIHNpbmNlOiAnMjAyNi0wNi0yMicgfSB9LFxyXG5cclxuICAgIC8vIE1lZXRpbmdcclxuICAgIHsga2V5OiAnbXRnS2lja29mZicsIHR5cGU6ICdtZWV0aW5nJywgdGl0bGU6ICdTdXBwb3J0IEFJIGtpY2tvZmYgd2l0aCBrbm93bGVkZ2UgbGVhZGVyc2hpcCcsIHN0YXR1czogJ3N1bW1hcml6ZWQnLCBvd25lcjogJ2pvaG4nLCBleHRyYTogeyBkYXRlOiAnMjAyNi0wNi0xOCcsIHRpbWU6ICcxMDowMCBBTScsIGF0dGVuZGVlczogWydKb2huJywgJ01hcmsnLCAnQWxsZW4nLCAnR2VvcmdlJ10sIHB1cnBvc2U6ICdBbGlnbiBvbiBwaWxvdCBzY29wZSwgYWNjZXNzIG5lZWRzLCBhbmQgc3VjY2VzcyBtZWFzdXJlcy4nLCBhZ2VuZGE6ICcxLiBWaXNpb24gIDIuIFBpbG90IHNjb3BlICAzLiBBY2Nlc3MgcmVxdWVzdHMgIDQuIFRpbWVsaW5lJyB9LCBib2R5VGV4dDogJ0FncmVlZCB0byBzaW5nbGUtZG9tYWluIHBpbG90LiBBbGxlbiB0byBzcG9uc29yIGFjY2VzcyByZXF1ZXN0cy4gU3VjY2VzcyA9IGRlZmxlY3Rpb24gcmF0ZSArIGFnZW50IHNhdGlzZmFjdGlvbi4gTmV4dCBjaGVjay1pbiBpbiA0IHdlZWtzLicgfSxcclxuXHJcbiAgICAvLyBRdWVzdGlvbnMgLyBpZGVhcyAvIHJlc2VhcmNoXHJcbiAgICB7IGtleTogJ3FNZXRyaWNzJywgdHlwZTogJ3F1ZXN0aW9uJywgdGl0bGU6ICdXaGljaCBkZWZsZWN0aW9uIG1ldHJpYyBkb2VzIHN1cHBvcnQgbGVhZGVyc2hpcCBhbHJlYWR5IHRydXN0PycsIHN0YXR1czogJ29wZW4nLCBvd25lcjogJ21hcmsnLCBleHRyYToge30gfSxcclxuICAgIHsga2V5OiAnaWRlYVRyaWFnZScsIHR5cGU6ICdpZGVhJywgdGl0bGU6ICdBdXRvLXRyaWFnZSBpbmJvdW5kIGNhc2VzIGJ5IGtub3dsZWRnZSBjb3ZlcmFnZScsIHN0YXR1czogJ2JhY2tsb2cnLCBvd25lcjogJ2pvaG4nLCBib2R5VGV4dDogJ0lmIHJldHJpZXZhbCBjb25maWRlbmNlIGlzIGhpZ2gsIHN1Z2dlc3QgS0ItZmlyc3QgcmVzcG9uc2UgYmVmb3JlIGh1bWFuIHRyaWFnZS4nIH0sXHJcbiAgICB7IGtleTogJ3Jlc1JhZycsIHR5cGU6ICdyZXNlYXJjaCcsIHRpdGxlOiAnUmV0cmlldmFsIHN0cmF0ZWd5IGNvbXBhcmlzb246IGh5YnJpZCB2cyBwdXJlIHZlY3RvcicsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgb3duZXI6ICdqb2huJywgYm9keVRleHQ6ICdFYXJseSByZXN1bHQ6IGh5YnJpZCAoQk0yNSArIHZlY3Rvcikgbm90aWNlYWJseSBiZXR0ZXIgb24gcHJvZHVjdC1jb2RlIHF1ZXJpZXMuJyB9LFxyXG4gIF07XHJcblxyXG4gIGNvbnN0IGNyZWF0ZWQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xyXG4gIGZvciAoY29uc3QgcyBvZiBpdGVtcykge1xyXG4gICAgY29uc3QgaXRlbSA9IHN0b3JlLmNyZWF0ZUl0ZW0oe1xyXG4gICAgICB0eXBlOiBzLnR5cGUsXHJcbiAgICAgIHRpdGxlOiBzLnRpdGxlLFxyXG4gICAgICBzdGF0dXM6IHMuc3RhdHVzLFxyXG4gICAgICBwcmlvcml0eTogcy5wcmlvcml0eSA/PyAnbm9uZScsXHJcbiAgICAgIG93bmVySWQ6IHMub3duZXIgPz8gbnVsbCxcclxuICAgICAgbWlsZXN0b25lSWQ6IHMubWlsZXN0b25lID8gbWlsZXN0b25lSWRbcy5taWxlc3RvbmVdIDogbnVsbCxcclxuICAgICAgZHVlRGF0ZTogcy5kdWVEYXRlID8/IG51bGwsXHJcbiAgICAgIHRhZ3M6IHMudGFncyA/PyBbXSxcclxuICAgICAgZXh0cmE6IHMuZXh0cmEgPz8ge30sXHJcbiAgICAgIGxlYWRlcnNoaXBWaXNpYmxlOiBzLmxlYWRlcnNoaXBWaXNpYmxlID8gMSA6IDAsXHJcbiAgICAgIGJvZHlUZXh0OiBzLmJvZHlUZXh0ID8/ICcnLFxyXG4gICAgICBib2R5OiBzLmJvZHlUZXh0ID8gdGV4dERvYyhzLmJvZHlUZXh0KSA6ICcnLFxyXG4gICAgICBzYW1wbGU6IDEsXHJcbiAgICB9KTtcclxuICAgIGNyZWF0ZWQuc2V0KHMua2V5LCBpdGVtLmlkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxpbmsgPSAoYTogc3RyaW5nLCBiOiBzdHJpbmcsIGtpbmQ6IFBhcmFtZXRlcnM8U3RvcmVbJ2FkZExpbmsnXT5bMl0pID0+IHtcclxuICAgIGNvbnN0IGZyb21JZCA9IGNyZWF0ZWQuZ2V0KGEpO1xyXG4gICAgY29uc3QgdG9JZCA9IGNyZWF0ZWQuZ2V0KGIpO1xyXG4gICAgaWYgKGZyb21JZCAmJiB0b0lkKSBzdG9yZS5hZGRMaW5rKGZyb21JZCwgdG9JZCwga2luZCk7XHJcbiAgfTtcclxuXHJcbiAgbGluaygndGFza0NsZWFuJywgJ2ZlYXRJbmdlc3QnLCAnaW1wbGVtZW50cycpO1xyXG4gIGxpbmsoJ3Rhc2tFeHBvcnQnLCAnZmVhdEluZ2VzdCcsICdpbXBsZW1lbnRzJyk7XHJcbiAgbGluaygncmVxQ2l0YXRpb25zJywgJ2ZlYXRBbnN3ZXInLCAnc3VwcG9ydHMnKTtcclxuICBsaW5rKCdyZXFQSEknLCAnZmVhdEFuc3dlcicsICdzdXBwb3J0cycpO1xyXG4gIGxpbmsoJ3JlcUZyZXNobmVzcycsICdmZWF0SW5nZXN0JywgJ3N1cHBvcnRzJyk7XHJcbiAgbGluaygnZmVhdEFuc3dlcicsICdkZWNUZW5hbnQnLCAnc2hhcGVkX2J5Jyk7XHJcbiAgbGluaygnZmVhdEFuc3dlcicsICdhY2NBenVyZScsICdyZXF1aXJlc19hY2Nlc3MnKTtcclxuICBsaW5rKCdmZWF0SW5nZXN0JywgJ2FjY1NmQXBpJywgJ3JlcXVpcmVzX2FjY2VzcycpO1xyXG4gIGxpbmsoJ2Jsa0F6dXJlJywgJ2ZlYXRBbnN3ZXInLCAnYmxvY2tzJyk7XHJcbiAgbGluaygnZGVjRG9tYWluJywgJ210Z0tpY2tvZmYnLCAnZGlzY3Vzc2VkX2luJyk7XHJcbiAgbGluaygncmlza0FjY2VzcycsICdhY2NBenVyZScsICdyZWxhdGVzJyk7XHJcblxyXG4gIHJldHVybiBpdGVtcy5sZW5ndGg7XHJcbn1cclxuXHJcbi8qKiBNaW5pbWFsIHJpY2gtZG9jIHdyYXBwZXIgZm9yIHNlZWQgYm9keSB0ZXh0IChvbmUgcGFyYWdyYXBoKS4gKi9cclxuZnVuY3Rpb24gdGV4dERvYyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh7IHR5cGU6ICdkb2MnLCBjb250ZW50OiBbeyB0eXBlOiAncGFyYWdyYXBoJywgY29udGVudDogW3sgdHlwZTogJ3RleHQnLCB0ZXh0IH1dIH1dIH0pO1xyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSx1QkFBcUI7QUFDckIsb0JBQW1CO0FBQ25CLElBQUFBLGtCQUFlO0FBQ2YsSUFBQUMsb0JBQWlCO0FBQ2pCLHFCQUFlOzs7QUNSZiw0QkFBcUI7QUFDckIsdUJBQWlCO0FBQ2pCLHFCQUFlO0FBQ2YseUJBQW1COzs7QUNNWixJQUFNLGFBQTBCO0FBQUEsRUFDckM7QUFBQSxJQUNFLFNBQVM7QUFBQSxJQUNULE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFpT1A7QUFBQSxFQUNBO0FBQUEsSUFDRSxTQUFTO0FBQUEsSUFDVCxNQUFN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TUFBTTtBQUNsRCxRQUFNLE9BQU8sTUFBTSxXQUFXLEVBQUUsTUFBTSxRQUFRLE9BQU8sT0FBTyxDQUFDO0FBQzdELFFBQU0sSUFBSSxNQUFNLFdBQVcsS0FBSyxJQUFJLE1BQU0sV0FBVztBQUNyRCxRQUFNLGNBQWMsRUFBRSxFQUFFO0FBQ3hCLFFBQU0sV0FBVyxLQUFLLEVBQUU7QUFHeEIsUUFBTSxPQUFPLElBQUksR0FBRyxRQUFRLHFEQUFxRCxFQUFFLElBQUksRUFBRSxFQUFFO0FBQzNGLGdCQUFBQSxRQUFPLE1BQU0sS0FBSyxTQUFTLENBQUM7QUFDNUIsZ0JBQUFBLFFBQU8sTUFBTSxLQUFLLFlBQVksTUFBTTtBQUNwQyxRQUFNLE9BQU8sSUFBSSxHQUFHLFFBQVEsOERBQThELEVBQUUsSUFBSSxLQUFLLEVBQUU7QUFDdkcsZ0JBQUFBLFFBQU8sTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUM1QixnQkFBQUEsUUFBTyxNQUFNLEtBQUssWUFBWSxNQUFNO0FBQ3BDLGdCQUFBQSxRQUFPLEdBQUcsS0FBSyxVQUFVO0FBR3pCLGdCQUFBQSxRQUFPLEdBQUcsSUFBSSxHQUFHLFFBQVEsbUNBQW1DLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQztBQUN2RSxnQkFBQUEsUUFBTyxHQUFHLElBQUksR0FBRyxRQUFRLGdDQUFnQyxFQUFFLElBQUksS0FBSyxFQUFFLENBQUM7QUFHdkUsUUFBTSxNQUFNLE1BQU0sWUFBWSxLQUFLLElBQUksRUFBRTtBQUN6QyxnQkFBQUEsUUFBTyxHQUFHLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLFNBQVMsQ0FBQztBQUMvQyxnQkFBQUEsUUFBTyxHQUFHLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLGlCQUFpQixDQUFDO0FBQ3ZELE1BQUksR0FBRyxNQUFNO0FBQ2YsQ0FBQzsiLAogICJuYW1lcyI6IFsiaW1wb3J0X25vZGVfZnMiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJmcyIsICJwYXRoIiwgIkRhdGFiYXNlIiwgImNyeXB0byIsICJpbXBvcnRfbm9kZV9jcnlwdG8iLCAiY3J5cHRvIiwgIml0ZW0iLCAiaW1wb3J0X25vZGVfZnMiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJmcyIsICJwYXRoIiwgInRtcCIsICJmcyIsICJwYXRoIiwgIm9zIiwgImFzc2VydCJdCn0K
