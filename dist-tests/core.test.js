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
    return this.db.prepare("SELECT id, name, initials, color, created_at AS createdAt FROM users").all();
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
        this.db.prepare("INSERT OR IGNORE INTO users(id, name, initials, color, created_at) VALUES(?,?,?,?,?)").run(r.id, r.name, r.initials, r.color, r.createdAt);
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
      user: { name: "name", initials: "initials", color: "color" },
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vdGVzdHMvY29yZS50ZXN0LnRzIiwgIi4uL2VsZWN0cm9uL2RiL2RiLnRzIiwgIi4uL2VsZWN0cm9uL2RiL21pZ3JhdGlvbnMudHMiLCAiLi4vZWxlY3Ryb24vZGIvc3RvcmUudHMiLCAiLi4vc2hhcmVkL3R5cGVzLnRzIiwgIi4uL3NoYXJlZC9kb2MudHMiLCAiLi4vZWxlY3Ryb24vc3luYy90cmFuc3BvcnQudHMiLCAiLi4vZWxlY3Ryb24vc3luYy9lbmdpbmUudHMiLCAiLi4vZWxlY3Ryb24vZGIvc2VlZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gQ29yZSBkYXRhLWxheWVyICsgc3luYyB0ZXN0cy4gUnVuIHdpdGg6IG5wbSB0ZXN0XG4vLyAoYnVuZGxlZCBieSBzY3JpcHRzL3J1bi10ZXN0cy5tanMgYW5kIGV4ZWN1dGVkIHVuZGVyIEVsZWN0cm9uJ3MgTm9kZSB2aWEgRUxFQ1RST05fUlVOX0FTX05PREVcbi8vICBzbyBiZXR0ZXItc3FsaXRlMydzIEVsZWN0cm9uLUFCSSBidWlsZCBsb2Fkcy4pXG5cbmltcG9ydCB7IHRlc3QgfSBmcm9tICdub2RlOnRlc3QnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdub2RlOmFzc2VydC9zdHJpY3QnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCBvcyBmcm9tICdub2RlOm9zJztcbmltcG9ydCB7IG9wZW5EYXRhYmFzZSwgdHlwZSBEYkNvbnRleHQgfSBmcm9tICcuLi9lbGVjdHJvbi9kYi9kYic7XG5pbXBvcnQgeyBTdG9yZSB9IGZyb20gJy4uL2VsZWN0cm9uL2RiL3N0b3JlJztcbmltcG9ydCB7IEZvbGRlclRyYW5zcG9ydCB9IGZyb20gJy4uL2VsZWN0cm9uL3N5bmMvdHJhbnNwb3J0JztcbmltcG9ydCB7IFN5bmNFbmdpbmUgfSBmcm9tICcuLi9lbGVjdHJvbi9zeW5jL2VuZ2luZSc7XG5pbXBvcnQgeyBsb2FkU2VlZERhdGEgfSBmcm9tICcuLi9lbGVjdHJvbi9kYi9zZWVkJztcblxuZnVuY3Rpb24gdG1wKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHAgPSBmcy5ta2R0ZW1wU3luYyhwYXRoLmpvaW4ob3MudG1wZGlyKCksIGB0ZXRoZXItJHtuYW1lfS1gKSk7XG4gIHJldHVybiBwO1xufVxuXG5mdW5jdGlvbiBta1N0b3JlKG5hbWU6IHN0cmluZywgYWN0b3I6IHN0cmluZyk6IHsgY3R4OiBEYkNvbnRleHQ7IHN0b3JlOiBTdG9yZSB9IHtcbiAgY29uc3QgY3R4ID0gb3BlbkRhdGFiYXNlKHRtcChuYW1lKSk7XG4gIGNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKGN0eCwgYWN0b3IpO1xuICByZXR1cm4geyBjdHgsIHN0b3JlIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN5bmNCb3RoKGE6IHsgc3RvcmU6IFN0b3JlIH0sIGI6IHsgc3RvcmU6IFN0b3JlIH0sIGZvbGRlcjogc3RyaW5nLCB1c2VyQSA9ICdKb2huJywgdXNlckIgPSAnTWFyaycpIHtcbiAgY29uc3QgZWEgPSBuZXcgU3luY0VuZ2luZShhLnN0b3JlLCB1c2VyQSwgKCkgPT4ge30pO1xuICBjb25zdCBlYiA9IG5ldyBTeW5jRW5naW5lKGIuc3RvcmUsIHVzZXJCLCAoKSA9PiB7fSk7XG4gIGVhLnNldFRyYW5zcG9ydChuZXcgRm9sZGVyVHJhbnNwb3J0KGZvbGRlcikpO1xuICBlYi5zZXRUcmFuc3BvcnQobmV3IEZvbGRlclRyYW5zcG9ydChmb2xkZXIpKTtcbiAgLy8gVHdvIGN5Y2xlcyBlYWNoIHNvIHJlbnVtYmVyLXJlYnJvYWRjYXN0cyBhbmQgY3Jvc3MtaW1wb3J0cyBzZXR0bGUuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgYXdhaXQgZWEuY3ljbGUoKTtcbiAgICBhd2FpdCBlYi5jeWNsZSgpO1xuICB9XG4gIGF3YWl0IGVhLnN0b3AoKTtcbiAgYXdhaXQgZWIuc3RvcCgpO1xufVxuXG50ZXN0KCdtaWdyYXRpb25zIGNyZWF0ZSBzY2hlbWEgYW5kIGRldmljZSBpZGVudGl0eScsICgpID0+IHtcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdtaWcnLCAnam9obicpO1xuICBhc3NlcnQub2soY3R4LmRldmljZUlkLmxlbmd0aCA+IDEwKTtcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmxpc3RJdGVtcygpLmxlbmd0aCwgMCk7XG4gIGN0eC5kYi5jbG9zZSgpO1xufSk7XG5cbnRlc3QoJ2l0ZW0gQ1JVRCwgaWRlbnQgYWxsb2NhdGlvbiwgYWN0aXZpdHksIHNlYXJjaCcsICgpID0+IHtcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdjcnVkJywgJ2pvaG4nKTtcbiAgY29uc3QgaXRlbSA9IHN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ0Fuc3dlcnMgbXVzdCBjaXRlIHNvdXJjZXMnIH0pO1xuICBhc3NlcnQuZXF1YWwoaXRlbS5pZGVudCwgJ1JFUS0xJyk7XG4gIGFzc2VydC5lcXVhbChpdGVtLnN0YXR1cywgJ2JhY2tsb2cnKTtcblxuICBjb25zdCBzZWNvbmQgPSBzdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3JlcXVpcmVtZW50JywgdGl0bGU6ICdBbm90aGVyIHJlcXVpcmVtZW50JyB9KTtcbiAgYXNzZXJ0LmVxdWFsKHNlY29uZC5pZGVudCwgJ1JFUS0yJyk7XG5cbiAgc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICdoaWdoJyB9KTtcbiAgY29uc3QgZ290ID0gc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSE7XG4gIGFzc2VydC5lcXVhbChnb3Quc3RhdHVzLCAnaW5fcHJvZ3Jlc3MnKTtcbiAgYXNzZXJ0LmVxdWFsKGdvdC5wcmlvcml0eSwgJ2hpZ2gnKTtcblxuICAvLyBkb25lIFx1MjE5MiBjb21wbGV0ZWRBdCBzZXRcbiAgc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHN0YXR1czogJ2RvbmUnIH0pO1xuICBhc3NlcnQub2soc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEuY29tcGxldGVkQXQpO1xuXG4gIC8vIHNlYXJjaCBoaXRzIHRpdGxlXG4gIGNvbnN0IHJlc3VsdHMgPSBzdG9yZS5zZWFyY2goJ2NpdGUgc291cmNlcycpO1xuICBhc3NlcnQub2socmVzdWx0cy5zb21lKChyKSA9PiByLml0ZW0uaWQgPT09IGl0ZW0uaWQpKTtcblxuICAvLyBieSBpZGVudFxuICBhc3NlcnQuZXF1YWwoc3RvcmUuZ2V0SXRlbUJ5SWRlbnQoJ3JlcS0xJykhLmlkLCBpdGVtLmlkKTtcblxuICBjb25zdCBhY3Rpdml0eSA9IHN0b3JlLmFjdGl2aXR5Rm9yKGl0ZW0uaWQpIGFzIHsga2luZDogc3RyaW5nIH1bXTtcbiAgYXNzZXJ0Lm9rKGFjdGl2aXR5LnNvbWUoKGEpID0+IGEua2luZCA9PT0gJ2NyZWF0ZWQnKSk7XG4gIGFzc2VydC5vayhhY3Rpdml0eS5zb21lKChhKSA9PiBhLmtpbmQgPT09ICd1cGRhdGVkJykpO1xuXG4gIC8vIGRlbGV0ZSBoaWRlcyBmcm9tIHF1ZXJpZXNcbiAgc3RvcmUuZGVsZXRlSXRlbShzZWNvbmQuaWQpO1xuICBhc3NlcnQuZXF1YWwoc3RvcmUuZ2V0SXRlbShzZWNvbmQuaWQpLCBudWxsKTtcbiAgY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnbGlua3MsIGNvbW1lbnRzLCB2ZXJzaW9ucycsICgpID0+IHtcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdyZWwnLCAnam9obicpO1xuICBjb25zdCBhID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdCdWlsZCBleHBvcnQnIH0pO1xuICBjb25zdCBiID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdmZWF0dXJlJywgdGl0bGU6ICdJbmdlc3Rpb24gcGlwZWxpbmUnIH0pO1xuICBzdG9yZS5hZGRMaW5rKGEuaWQsIGIuaWQsICdpbXBsZW1lbnRzJyk7XG4gIGNvbnN0IGxpbmtzID0gc3RvcmUubGlua3NGb3IoYS5pZCk7XG4gIGFzc2VydC5lcXVhbChsaW5rcy5sZW5ndGgsIDEpO1xuICBhc3NlcnQuZXF1YWwobGlua3NbMF0ub3RoZXIuaWQsIGIuaWQpO1xuICBhc3NlcnQuZXF1YWwobGlua3NbMF0uZGlyZWN0aW9uLCAnb3V0Jyk7XG5cbiAgc3RvcmUuYWRkQ29tbWVudChhLmlkLCAne1widHlwZVwiOlwiZG9jXCJ9JywgJ2xvb2tzIGdvb2QnKTtcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmNvbW1lbnRzRm9yKGEuaWQpLmxlbmd0aCwgMSk7XG5cbiAgc3RvcmUuc2F2ZVZlcnNpb24oYS5pZCk7XG4gIHN0b3JlLnVwZGF0ZUl0ZW0oYS5pZCwgeyB0aXRsZTogJ0J1aWxkIGV4cG9ydCB2MicgfSk7XG4gIGNvbnN0IHZlcnNpb25zID0gc3RvcmUudmVyc2lvbnNGb3IoYS5pZCkgYXMgeyB0aXRsZTogc3RyaW5nIH1bXTtcbiAgYXNzZXJ0LmVxdWFsKHZlcnNpb25zLmxlbmd0aCwgMSk7XG4gIGFzc2VydC5lcXVhbCh2ZXJzaW9uc1swXS50aXRsZSwgJ0J1aWxkIGV4cG9ydCcpO1xuICBjdHguZGIuY2xvc2UoKTtcbn0pO1xuXG50ZXN0KCdzeW5jOiB0d28gZGV2aWNlcyBjb252ZXJnZSB0aHJvdWdoIGEgc2hhcmVkIGZvbGRlcicsIGFzeW5jICgpID0+IHtcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ3N5bmNBJywgJ2pvaG4nKTtcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ3N5bmNCJywgJ21hcmsnKTtcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWQnKTtcblxuICBjb25zdCBpdGVtQSA9IGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdGcm9tIEpvaG4nIH0pO1xuICBjb25zdCBpdGVtQiA9IGIuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdkZWNpc2lvbicsIHRpdGxlOiAnRnJvbSBNYXJrJyB9KTtcblxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuXG4gIGFzc2VydC5vayhiLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpLCAnQiByZWNlaXZlZCBBIGl0ZW0nKTtcbiAgYXNzZXJ0Lm9rKGEuc3RvcmUuZ2V0SXRlbShpdGVtQi5pZCksICdBIHJlY2VpdmVkIEIgaXRlbScpO1xuICBhc3NlcnQuZXF1YWwoYi5zdG9yZS5nZXRJdGVtKGl0ZW1BLmlkKSEudGl0bGUsICdGcm9tIEpvaG4nKTtcblxuICAvLyBFZGl0IG9uIEIgcHJvcGFnYXRlcyB0byBBXG4gIGIuc3RvcmUudXBkYXRlSXRlbShpdGVtQS5pZCwgeyBzdGF0dXM6ICdpbl9wcm9ncmVzcycgfSk7XG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XG4gIGFzc2VydC5lcXVhbChhLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpIS5zdGF0dXMsICdpbl9wcm9ncmVzcycpO1xuXG4gIGEuY3R4LmRiLmNsb3NlKCk7XG4gIGIuY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnc3luYzogY29uY3VycmVudCB0aXRsZSBlZGl0cyBzdXJmYWNlIGEgY29uZmxpY3QsIExXVyBhcHBsaWVzLCByZXNvbHV0aW9uIGNvbnZlcmdlcycsIGFzeW5jICgpID0+IHtcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ2NvbmZBJywgJ2pvaG4nKTtcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ2NvbmZCJywgJ21hcmsnKTtcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRjJyk7XG5cbiAgY29uc3QgaXRlbSA9IGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdPcmlnaW5hbCcgfSk7XG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XG4gIGFzc2VydC5vayhiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkpO1xuXG4gIC8vIEJvdGggZWRpdCB0aGUgdGl0bGUgd2hpbGUgXCJvZmZsaW5lXCIgKG5vIHN5bmMgYmV0d2VlbiBlZGl0cykuXG4gIGEuc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHRpdGxlOiAnSm9obiB2ZXJzaW9uJyB9KTtcbiAgYi5zdG9yZS51cGRhdGVJdGVtKGl0ZW0uaWQsIHsgdGl0bGU6ICdNYXJrIHZlcnNpb24nIH0pO1xuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuXG4gIC8vIEJvdGggc2lkZXMgc2hvdyB0aGUgc2FtZSBMV1cgd2lubmVyLlxuICBjb25zdCB0YSA9IGEuc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEudGl0bGU7XG4gIGNvbnN0IHRiID0gYi5zdG9yZS5nZXRJdGVtKGl0ZW0uaWQpIS50aXRsZTtcbiAgYXNzZXJ0LmVxdWFsKHRhLCB0YiwgJ0xXVyBjb252ZXJnZWQnKTtcblxuICAvLyBBdCBsZWFzdCBvbmUgc2lkZSByZWNvcmRlZCBhIGNvbmZsaWN0IGZvciByZXZpZXcuXG4gIGNvbnN0IGNvbmZsaWN0cyA9IFsuLi5hLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSksIC4uLmIuc3RvcmUubGlzdENvbmZsaWN0cyh0cnVlKV07XG4gIGFzc2VydC5vayhjb25mbGljdHMubGVuZ3RoID49IDEsICdjb25mbGljdCBzdXJmYWNlZCcpO1xuICBhc3NlcnQub2soY29uZmxpY3RzLnNvbWUoKGMpID0+IGMuZmllbGQgPT09ICd0aXRsZScpKTtcblxuICAvLyBSZXNvbHZpbmcgd2l0aCBhIG1lcmdlZCB2YWx1ZSBwcm9wYWdhdGVzLlxuICBjb25zdCBzaWRlID0gYS5zdG9yZS5saXN0Q29uZmxpY3RzKHRydWUpLmxlbmd0aCA/IGEgOiBiO1xuICBjb25zdCBjb25mbGljdCA9IHNpZGUuc3RvcmUubGlzdENvbmZsaWN0cyh0cnVlKVswXTtcbiAgc2lkZS5zdG9yZS5yZXNvbHZlQ29uZmxpY3QoY29uZmxpY3QuaWQsICdtZXJnZWQnLCAnTWVyZ2VkIHRpdGxlJyk7XG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XG4gIGFzc2VydC5lcXVhbChhLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlLCAnTWVyZ2VkIHRpdGxlJyk7XG4gIGFzc2VydC5lcXVhbChiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlLCAnTWVyZ2VkIHRpdGxlJyk7XG5cbiAgYS5jdHguZGIuY2xvc2UoKTtcbiAgYi5jdHguZGIuY2xvc2UoKTtcbn0pO1xuXG50ZXN0KCdzeW5jOiBpZGVudCBjb2xsaXNpb24gcmVudW1iZXJzIGFuZCBjb252ZXJnZXMnLCBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IGEgPSBta1N0b3JlKCdpZEEnLCAnam9obicpO1xuICBjb25zdCBiID0gbWtTdG9yZSgnaWRCJywgJ21hcmsnKTtcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRpJyk7XG5cbiAgLy8gQm90aCBjcmVhdGUgVEFTSy0xIG9mZmxpbmUuXG4gIGNvbnN0IGlhID0gYS5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0EgdGFzaycgfSk7XG4gIGNvbnN0IGliID0gYi5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0IgdGFzaycgfSk7XG4gIGFzc2VydC5lcXVhbChpYS5pZGVudCwgJ1RBU0stMScpO1xuICBhc3NlcnQuZXF1YWwoaWIuaWRlbnQsICdUQVNLLTEnKTtcblxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpOyAvLyBleHRyYSByb3VuZHMgdG8gc2V0dGxlIHJlbnVtYmVyIGJyb2FkY2FzdHNcblxuICBjb25zdCBhSWRlbnRzID0gW2Euc3RvcmUuZ2V0SXRlbShpYS5pZCkhLmlkZW50LCBhLnN0b3JlLmdldEl0ZW0oaWIuaWQpIS5pZGVudF0uc29ydCgpO1xuICBjb25zdCBiSWRlbnRzID0gW2Iuc3RvcmUuZ2V0SXRlbShpYS5pZCkhLmlkZW50LCBiLnN0b3JlLmdldEl0ZW0oaWIuaWQpIS5pZGVudF0uc29ydCgpO1xuICBhc3NlcnQubm90RXF1YWwoYUlkZW50c1swXSwgYUlkZW50c1sxXSwgJ2lkZW50cyB1bmlxdWUgb24gQScpO1xuICBhc3NlcnQubm90RXF1YWwoYklkZW50c1swXSwgYklkZW50c1sxXSwgJ2lkZW50cyB1bmlxdWUgb24gQicpO1xuICBhc3NlcnQuZGVlcEVxdWFsKGFJZGVudHMsIGJJZGVudHMsICdib3RoIHNpZGVzIGFncmVlIG9uIGlkZW50cycpO1xuXG4gIGEuY3R4LmRiLmNsb3NlKCk7XG4gIGIuY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnc3luYzogb2ZmbGluZSBlZGl0cyBxdWV1ZSBhbmQgZmx1c2ggd2hlbiBmb2xkZXIgcmV0dXJucycsIGFzeW5jICgpID0+IHtcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ29mZkEnLCAnam9obicpO1xuICBjb25zdCBmb2xkZXIgPSB0bXAoJ3NoYXJlZG8nKTtcbiAgY29uc3QgZW5naW5lID0gbmV3IFN5bmNFbmdpbmUoYS5zdG9yZSwgJ0pvaG4nLCAoKSA9PiB7fSk7XG5cbiAgYS5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ01hZGUgb2ZmbGluZScgfSk7XG4gIGFzc2VydC5vayhlbmdpbmUuc3RhdHVzKCkucGVuZGluZ09wcyA+IDAgfHwgZW5naW5lLnN0YXR1cygpLnN0YXRlID09PSAnZGlzYWJsZWQnKTtcblxuICBlbmdpbmUuc2V0VHJhbnNwb3J0KG5ldyBGb2xkZXJUcmFuc3BvcnQoZm9sZGVyKSk7XG4gIGF3YWl0IGVuZ2luZS5jeWNsZSgpO1xuICBhc3NlcnQuZXF1YWwoZW5naW5lLnN0YXR1cygpLnBlbmRpbmdPcHMsIDAsICdvcHMgZXhwb3J0ZWQgYWZ0ZXIgdHJhbnNwb3J0IGF0dGFjaGVkJyk7XG4gIGF3YWl0IGVuZ2luZS5zdG9wKCk7XG4gIGEuY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnc2VlZCBkYXRhIGxvYWRzLCBpcyBmbGFnZ2VkLCBhbmQgcmVtb3ZlcyBjbGVhbmx5JywgKCkgPT4ge1xuICBjb25zdCB7IGN0eCwgc3RvcmUgfSA9IG1rU3RvcmUoJ3NlZWQnLCAnam9obicpO1xuICBjb25zdCBuID0gbG9hZFNlZWREYXRhKHN0b3JlKTtcbiAgYXNzZXJ0Lm9rKG4gPiAxNSk7XG4gIGNvbnN0IHNhbXBsZXMgPSBzdG9yZS5saXN0SXRlbXMoeyBzYW1wbGU6IHRydWUgfSwgeyBmaWVsZDogJ2NyZWF0ZWRBdCcsIGRpcjogJ2FzYycgfSwgMTAwKTtcbiAgYXNzZXJ0LmVxdWFsKHNhbXBsZXMubGVuZ3RoLCBuKTtcbiAgLy8gbGlua3MgZXhpc3RcbiAgY29uc3Qgd2l0aExpbmtzID0gc2FtcGxlcy5maWx0ZXIoKHMpID0+IHN0b3JlLmxpbmtzRm9yKHMuaWQpLmxlbmd0aCA+IDApO1xuICBhc3NlcnQub2sod2l0aExpbmtzLmxlbmd0aCA+IDUpO1xuXG4gIGNvbnN0IHJlbW92ZWQgPSBzdG9yZS5yZW1vdmVTYW1wbGVEYXRhKCk7XG4gIGFzc2VydC5lcXVhbChyZW1vdmVkLCBuKTtcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmxpc3RJdGVtcyh7fSwgeyBmaWVsZDogJ2NyZWF0ZWRBdCcsIGRpcjogJ2FzYycgfSwgMTAwKS5sZW5ndGgsIDApO1xuICBjdHguZGIuY2xvc2UoKTtcbn0pO1xuXG50ZXN0KCdkYXRhYmFzZSBpbnRlZ3JpdHkgZ3VhcmQgcXVhcmFudGluZXMgY29ycnVwdGlvbicsICgpID0+IHtcbiAgY29uc3QgZGlyID0gdG1wKCdjb3JydXB0Jyk7XG4gIGNvbnN0IGN0eCA9IG9wZW5EYXRhYmFzZShkaXIpO1xuICBjdHguZGIuY2xvc2UoKTtcbiAgLy8gU3RvbXAgdGhlIGZpbGUgaGVhZGVyLlxuICBjb25zdCBkYlBhdGggPSBwYXRoLmpvaW4oZGlyLCAndGV0aGVyLmRiJyk7XG4gIGNvbnN0IGZkID0gZnMub3BlblN5bmMoZGJQYXRoLCAncisnKTtcbiAgZnMud3JpdGVTeW5jKGZkLCBCdWZmZXIuZnJvbSgnR0FSQkFHRUdBUkJBR0VHQVJCQUdFJyksIDAsIDIxLCAwKTtcbiAgZnMuY2xvc2VTeW5jKGZkKTtcbiAgYXNzZXJ0LnRocm93cygoKSA9PiBvcGVuRGF0YWJhc2UoZGlyKSwgL2ludGVncml0eXxtYWxmb3JtZWR8bm90IGEgZGF0YWJhc2UvaSk7XG59KTtcblxudGVzdCgnb3V0LW9mLW9yZGVyIHJlbW90ZSBvcHM6IHNldC9kZWxldGUgYXJyaXZpbmcgYmVmb3JlIGNyZWF0ZSBhcmUgYnVmZmVyZWQsIG5vdCBsb3N0JywgKCkgPT4ge1xuICBjb25zdCBhID0gbWtTdG9yZSgncmVvcmRlcicsICdqb2huJyk7XG4gIC8vIFNpbXVsYXRlIGRldmljZSBDIHJlY2VpdmluZyBCJ3Mgb3BzIGFib3V0IGFuIGl0ZW0gQkVGT1JFIEEncyBjcmVhdGUgb2YgaXQuXG4gIGNvbnN0IGl0ZW1JZCA9ICcwMDAwMDAwMC1hYWFhLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEnO1xuICBjb25zdCBzZXRPcCA9IHtcbiAgICBvcElkOiAnb3Atc2V0LTEnLCBkZXZpY2VJZDogJ2RldmljZS1CJywgYWN0b3JJZDogJ21hcmsnLCBsYW1wb3J0OiAxMCwgYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBlbnRpdHk6ICdpdGVtJyBhcyBjb25zdCwgZW50aXR5SWQ6IGl0ZW1JZCwgYWN0aW9uOiAnc2V0JyBhcyBjb25zdCxcbiAgICBwYXlsb2FkOiB7IGZpZWxkczogeyBzdGF0dXM6ICdpbl9wcm9ncmVzcycgfSwgYmFzZWRPbjogeyBzdGF0dXM6IG51bGwgfSB9LFxuICB9O1xuICBjb25zdCBjcmVhdGVPcCA9IHtcbiAgICBvcElkOiAnb3AtY3JlYXRlLTEnLCBkZXZpY2VJZDogJ2RldmljZS1BJywgYWN0b3JJZDogJ2pvaG4nLCBsYW1wb3J0OiA1LCBhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIGVudGl0eTogJ2l0ZW0nIGFzIGNvbnN0LCBlbnRpdHlJZDogaXRlbUlkLCBhY3Rpb246ICdjcmVhdGUnIGFzIGNvbnN0LFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIHJlY29yZDoge1xuICAgICAgICBpZDogaXRlbUlkLCBpZGVudDogJ1RBU0stOTAwJywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ1Jlb3JkZXJlZCBpdGVtJywgYm9keTogJycsIGJvZHlUZXh0OiAnJyxcbiAgICAgICAgc3RhdHVzOiAndG9kbycsIHByaW9yaXR5OiAnbWVkaXVtJywgb3duZXJJZDogbnVsbCwgcmVwb3J0ZXJJZDogJ2pvaG4nLCBtaWxlc3RvbmVJZDogbnVsbCxcbiAgICAgICAgcmVsZWFzZUlkOiBudWxsLCBwYXJlbnRJZDogbnVsbCwgc3RhcnREYXRlOiBudWxsLCBkdWVEYXRlOiBudWxsLCBjb21wbGV0ZWRBdDogbnVsbCxcbiAgICAgICAgZWZmb3J0OiBudWxsLCBjb25maWRlbmNlOiBudWxsLCByaXNrTGV2ZWw6IG51bGwsIGJ1c2luZXNzVmFsdWU6IG51bGwsIGxlYWRlcnNoaXBWaXNpYmxlOiAwLFxuICAgICAgICBwcm9ncmVzczogbnVsbCwgdGFnczogW10sIGV4dHJhOiB7fSwgYXJjaGl2ZWQ6IDAsIHNhbXBsZTogMCxcbiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksIHVwZGF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBjcmVhdGVkQnk6ICdqb2huJywgdXBkYXRlZEJ5OiAnam9obicsXG4gICAgICB9LFxuICAgIH0sXG4gIH07XG5cbiAgLy8gU2V0IGFycml2ZXMgZmlyc3QgXHUyMDE0IG11c3QgYnVmZmVyLCBpdGVtIG11c3Qgbm90IGV4aXN0IHlldC5cbiAgYS5zdG9yZS5hcHBseVJlbW90ZU9wcyhbc2V0T3BdKTtcbiAgYXNzZXJ0LmVxdWFsKGEuc3RvcmUuZ2V0SXRlbShpdGVtSWQpLCBudWxsKTtcblxuICAvLyBDcmVhdGUgYXJyaXZlcyBcdTIwMTQgaXRlbSBhcHBlYXJzIEFORCB0aGUgYnVmZmVyZWQgc2V0IHJlcGxheXMgb24gdG9wLlxuICBhLnN0b3JlLmFwcGx5UmVtb3RlT3BzKFtjcmVhdGVPcF0pO1xuICBjb25zdCBpdGVtID0gYS5zdG9yZS5nZXRJdGVtKGl0ZW1JZCk7XG4gIGFzc2VydC5vayhpdGVtLCAnaXRlbSBjcmVhdGVkJyk7XG4gIGFzc2VydC5lcXVhbChpdGVtIS5zdGF0dXMsICdpbl9wcm9ncmVzcycsICdidWZmZXJlZCBzZXQgYXBwbGllZCBhZnRlciBjcmVhdGUnKTtcblxuICAvLyBEZWxldGUtYmVmb3JlLWNyZWF0ZSBtdXN0IG5vdCByZXN1cnJlY3Q6IGZyZXNoIGVudGl0eSwgZGVsZXRlIGZpcnN0LCB0aGVuIGNyZWF0ZS5cbiAgY29uc3QgaXRlbTIgPSAnMDAwMDAwMDAtYmJiYi00MDAwLTgwMDAtMDAwMDAwMDAwMDAyJztcbiAgYS5zdG9yZS5hcHBseVJlbW90ZU9wcyhbXG4gICAgeyAuLi5zZXRPcCwgb3BJZDogJ29wLWRlbC0yJywgZW50aXR5SWQ6IGl0ZW0yLCBhY3Rpb246ICdkZWxldGUnIGFzIGNvbnN0LCBsYW1wb3J0OiAyMCwgcGF5bG9hZDoge30gfSxcbiAgXSk7XG4gIGEuc3RvcmUuYXBwbHlSZW1vdGVPcHMoW1xuICAgIHsgLi4uY3JlYXRlT3AsIG9wSWQ6ICdvcC1jcmVhdGUtMicsIGVudGl0eUlkOiBpdGVtMiwgbGFtcG9ydDogNixcbiAgICAgIHBheWxvYWQ6IHsgcmVjb3JkOiB7IC4uLihjcmVhdGVPcC5wYXlsb2FkLnJlY29yZCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiksIGlkOiBpdGVtMiwgaWRlbnQ6ICdUQVNLLTkwMScgfSB9IH0sXG4gIF0pO1xuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW0yKSwgbnVsbCwgJ2RlbGV0ZS1iZWZvcmUtY3JlYXRlIGRvZXMgbm90IHJlc3VycmVjdCB0aGUgaXRlbScpO1xuXG4gIGEuY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnYXVkaXRhYmlsaXR5OiBtaWxlc3RvbmVzL3JlbGVhc2VzIGNhcnJ5IGNyZWF0ZWQrdXBkYXRlZCBhdHRyaWJ1dGlvbiBhbmQgbG9nIGFjdGl2aXR5JywgKCkgPT4ge1xuICBjb25zdCB7IGN0eCwgc3RvcmUgfSA9IG1rU3RvcmUoJ2F1ZGl0LW1zJywgJ2pvaG4nKTtcbiAgY29uc3QgbSA9IHN0b3JlLnVwc2VydE1pbGVzdG9uZSh7IG5hbWU6ICdEaXNjb3ZlcnknIH0pO1xuICBjb25zdCByb3cgPSBjdHguZGIucHJlcGFyZSgnU0VMRUNUIGNyZWF0ZWRfYXQsIGNyZWF0ZWRfYnksIHVwZGF0ZWRfYXQsIHVwZGF0ZWRfYnkgRlJPTSBtaWxlc3RvbmVzIFdIRVJFIGlkPT8nKS5nZXQobS5pZCkgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgYXNzZXJ0Lm9rKHJvdy5jcmVhdGVkX2F0ICYmIHJvdy5jcmVhdGVkX2J5ID09PSAnam9obicgJiYgcm93LnVwZGF0ZWRfYXQgJiYgcm93LnVwZGF0ZWRfYnkgPT09ICdqb2huJyk7XG4gIGNvbnN0IGFjdCA9IHN0b3JlLmFjdGl2aXR5Rm9yKG51bGwsIDUwKSBhcyB7IGtpbmQ6IHN0cmluZzsgbmV3VmFsdWU6IHN0cmluZyB8IG51bGwgfVtdO1xuICBhc3NlcnQub2soYWN0LnNvbWUoKGEpID0+IGEua2luZCA9PT0gJ21pbGVzdG9uZV9jcmVhdGVkJyAmJiBhLm5ld1ZhbHVlID09PSAnRGlzY292ZXJ5JykpO1xuXG4gIC8vIFVwZGF0ZSBieSBhIGRpZmZlcmVudCBhY3RvciAtPiB1cGRhdGVkX2J5IGNoYW5nZXMsIGFjdGl2aXR5IGxvZ2dlZC5cbiAgc3RvcmUuYWN0b3JJZCA9ICdtYXJrJztcbiAgc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgaWQ6IG0uaWQsIG5hbWU6ICdEaXNjb3ZlcnkgJiBBY2Nlc3MnIH0pO1xuICBjb25zdCByb3cyID0gY3R4LmRiLnByZXBhcmUoJ1NFTEVDVCBjcmVhdGVkX2J5LCB1cGRhdGVkX2J5IEZST00gbWlsZXN0b25lcyBXSEVSRSBpZD0/JykuZ2V0KG0uaWQpIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIGFzc2VydC5lcXVhbChyb3cyLmNyZWF0ZWRfYnksICdqb2huJywgJ2NyZWF0b3IgcHJlc2VydmVkJyk7XG4gIGFzc2VydC5lcXVhbChyb3cyLnVwZGF0ZWRfYnksICdtYXJrJywgJ2xhc3QgZWRpdG9yIHJlY29yZGVkJyk7XG4gIGFzc2VydC5vaygoc3RvcmUuYWN0aXZpdHlGb3IobnVsbCwgNTApIGFzIHsga2luZDogc3RyaW5nIH1bXSkuc29tZSgoYSkgPT4gYS5raW5kID09PSAnbWlsZXN0b25lX3VwZGF0ZWQnKSk7XG4gIGN0eC5kYi5jbG9zZSgpO1xufSk7XG5cbnRlc3QoJ2F1ZGl0YWJpbGl0eTogc29mdC1kZWxldGUgb25seSwgZGVsZXRlcyBhdHRyaWJ1dGVkIGFuZCBsb2dnZWQsIG5vdGhpbmcgcGh5c2ljYWxseSByZW1vdmVkJywgKCkgPT4ge1xuICBjb25zdCB7IGN0eCwgc3RvcmUgfSA9IG1rU3RvcmUoJ2F1ZGl0LWRlbCcsICdqb2huJyk7XG4gIGNvbnN0IGl0ZW0gPSBzdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ1RlbXAnIH0pO1xuICBjb25zdCBjID0gc3RvcmUuYWRkQ29tbWVudChpdGVtLmlkLCAne30nLCAnYSBjb21tZW50Jyk7XG4gIHN0b3JlLmRlbGV0ZUNvbW1lbnQoYy5pZCk7XG4gIHN0b3JlLmRlbGV0ZUl0ZW0oaXRlbS5pZCk7XG5cbiAgLy8gUm93cyBzdGlsbCBwaHlzaWNhbGx5IHByZXNlbnQgKHNvZnQgZGVsZXRlKSwgd2l0aCBhdHRyaWJ1dGlvbi5cbiAgY29uc3QgY3JvdyA9IGN0eC5kYi5wcmVwYXJlKCdTRUxFQ1QgZGVsZXRlZCwgZGVsZXRlZF9ieSBGUk9NIGNvbW1lbnRzIFdIRVJFIGlkPT8nKS5nZXQoYy5pZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gIGFzc2VydC5lcXVhbChjcm93LmRlbGV0ZWQsIDEpO1xuICBhc3NlcnQuZXF1YWwoY3Jvdy5kZWxldGVkX2J5LCAnam9obicpO1xuICBjb25zdCBpcm93ID0gY3R4LmRiLnByZXBhcmUoJ1NFTEVDVCBkZWxldGVkLCBkZWxldGVkX2J5LCBkZWxldGVkX2F0IEZST00gaXRlbXMgV0hFUkUgaWQ9PycpLmdldChpdGVtLmlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgYXNzZXJ0LmVxdWFsKGlyb3cuZGVsZXRlZCwgMSk7XG4gIGFzc2VydC5lcXVhbChpcm93LmRlbGV0ZWRfYnksICdqb2huJyk7XG4gIGFzc2VydC5vayhpcm93LmRlbGV0ZWRfYXQpO1xuXG4gIC8vIEJvdGggcGh5c2ljYWwgcm93cyByZW1haW4gaW4gdGhlIGZpbGUuXG4gIGFzc2VydC5vayhjdHguZGIucHJlcGFyZSgnU0VMRUNUIDEgRlJPTSBjb21tZW50cyBXSEVSRSBpZD0/JykuZ2V0KGMuaWQpKTtcbiAgYXNzZXJ0Lm9rKGN0eC5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIGl0ZW1zIFdIRVJFIGlkPT8nKS5nZXQoaXRlbS5pZCkpO1xuXG4gIC8vIERlbGV0aW9ucyBhcmUgaW4gdGhlIGFjdGl2aXR5IGxvZy5cbiAgY29uc3QgYWN0ID0gc3RvcmUuYWN0aXZpdHlGb3IoaXRlbS5pZCwgNTApIGFzIHsga2luZDogc3RyaW5nIH1bXTtcbiAgYXNzZXJ0Lm9rKGFjdC5zb21lKChhKSA9PiBhLmtpbmQgPT09ICdkZWxldGVkJykpO1xuICBhc3NlcnQub2soYWN0LnNvbWUoKGEpID0+IGEua2luZCA9PT0gJ2NvbW1lbnRfZGVsZXRlZCcpKTtcbiAgY3R4LmRiLmNsb3NlKCk7XG59KTtcbiIsICJpbXBvcnQgRGF0YWJhc2UgZnJvbSAnYmV0dGVyLXNxbGl0ZTMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBjcnlwdG8gZnJvbSAnbm9kZTpjcnlwdG8nO1xuaW1wb3J0IHsgTUlHUkFUSU9OUyB9IGZyb20gJy4vbWlncmF0aW9ucyc7XG5cbmV4cG9ydCB0eXBlIERCID0gRGF0YWJhc2UuRGF0YWJhc2U7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGJDb250ZXh0IHtcbiAgZGI6IERCO1xuICBkZXZpY2VJZDogc3RyaW5nO1xuICBkYXRhRGlyOiBzdHJpbmc7XG4gIGRiUGF0aDogc3RyaW5nO1xufVxuXG4vKipcbiAqIE9wZW5zIChvciBjcmVhdGVzKSB0aGUgVGV0aGVyIGRhdGFiYXNlLCBhcHBsaWVzIHBlbmRpbmcgbWlncmF0aW9ucyxcbiAqIGFuZCBndWFyYW50ZWVzIGRldmljZSBpZGVudGl0eSBtZXRhZGF0YS5cbiAqXG4gKiBTYWZldHkgcG9zdHVyZTogV0FMIG1vZGUgKyBpbnRlZ3JpdHkgY2hlY2sgb24gb3BlbiArIHRpbWVzdGFtcGVkIGJhY2t1cFxuICogYmVmb3JlIGFueSBtaWdyYXRpb24gYmV5b25kIHZlcnNpb24gMC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9wZW5EYXRhYmFzZShkYXRhRGlyOiBzdHJpbmcpOiBEYkNvbnRleHQge1xuICBmcy5ta2RpclN5bmMoZGF0YURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IGRiUGF0aCA9IHBhdGguam9pbihkYXRhRGlyLCAndGV0aGVyLmRiJyk7XG4gIGNvbnN0IGV4aXN0ZWQgPSBmcy5leGlzdHNTeW5jKGRiUGF0aCk7XG5cbiAgY29uc3QgZGIgPSBuZXcgRGF0YWJhc2UoZGJQYXRoKTtcbiAgZGIucHJhZ21hKCdqb3VybmFsX21vZGUgPSBXQUwnKTtcbiAgZGIucHJhZ21hKCdmb3JlaWduX2tleXMgPSBPTicpO1xuICBkYi5wcmFnbWEoJ3N5bmNocm9ub3VzID0gTk9STUFMJyk7XG5cbiAgaWYgKGV4aXN0ZWQpIHtcbiAgICBjb25zdCBjaGVjayA9IGRiLnByYWdtYSgncXVpY2tfY2hlY2snLCB7IHNpbXBsZTogdHJ1ZSB9KTtcbiAgICBpZiAoY2hlY2sgIT09ICdvaycpIHtcbiAgICAgIC8vIFByZXNlcnZlIHRoZSBkYW1hZ2VkIGZpbGUgZm9yIHJlY292ZXJ5IGFuZCBmYWlsIGxvdWRseSBcdTIwMTQgbmV2ZXIgcnVuIG9uIGEgY29ycnVwdCBkYi5cbiAgICAgIGNvbnN0IHF1YXJhbnRpbmUgPSBkYlBhdGggKyAnLmNvcnJ1cHQtJyArIERhdGUubm93KCk7XG4gICAgICBkYi5jbG9zZSgpO1xuICAgICAgZnMuY29weUZpbGVTeW5jKGRiUGF0aCwgcXVhcmFudGluZSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBEYXRhYmFzZSBmYWlsZWQgaW50ZWdyaXR5IGNoZWNrICgke2NoZWNrfSkuIERhbWFnZWQgY29weSBwcmVzZXJ2ZWQgYXQgJHtxdWFyYW50aW5lfS4gYCArXG4gICAgICAgICAgJ1Jlc3RvcmUgZnJvbSBhIGJhY2t1cCBpbiB0aGUgYmFja3Vwcy8gZm9sZGVyLicsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5TWlncmF0aW9ucyhkYiwgZGF0YURpciwgZGJQYXRoLCBleGlzdGVkKTtcblxuICBjb25zdCBkZXZpY2VJZCA9IGVuc3VyZU1ldGEoZGIsICdkZXZpY2VfaWQnLCAoKSA9PiBjcnlwdG8ucmFuZG9tVVVJRCgpKTtcbiAgZW5zdXJlTWV0YShkYiwgJ3Byb2plY3RfaWQnLCAoKSA9PiBjcnlwdG8ucmFuZG9tVVVJRCgpKTtcblxuICByZXR1cm4geyBkYiwgZGV2aWNlSWQsIGRhdGFEaXIsIGRiUGF0aCB9O1xufVxuXG5mdW5jdGlvbiBhcHBseU1pZ3JhdGlvbnMoZGI6IERCLCBkYXRhRGlyOiBzdHJpbmcsIGRiUGF0aDogc3RyaW5nLCBleGlzdGVkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGhhc01ldGEgPSBkYlxuICAgIC5wcmVwYXJlKFwiU0VMRUNUIENPVU5UKCopIEFTIGMgRlJPTSBzcWxpdGVfbWFzdGVyIFdIRVJFIHR5cGU9J3RhYmxlJyBBTkQgbmFtZT0nbWV0YSdcIilcbiAgICAuZ2V0KCkgYXMgeyBjOiBudW1iZXIgfTtcbiAgbGV0IHZlcnNpb24gPSAwO1xuICBpZiAoaGFzTWV0YS5jID4gMCkge1xuICAgIGNvbnN0IHJvdyA9IGRiLnByZXBhcmUoXCJTRUxFQ1QgdmFsdWUgRlJPTSBtZXRhIFdIRVJFIGtleT0nc2NoZW1hX3ZlcnNpb24nXCIpLmdldCgpIGFzXG4gICAgICB8IHsgdmFsdWU6IHN0cmluZyB9XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICB2ZXJzaW9uID0gcm93ID8gTnVtYmVyKHJvdy52YWx1ZSkgOiAwO1xuICB9XG5cbiAgY29uc3QgcGVuZGluZyA9IE1JR1JBVElPTlMuZmlsdGVyKChtKSA9PiBtLnZlcnNpb24gPiB2ZXJzaW9uKTtcbiAgaWYgKHBlbmRpbmcubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgaWYgKGV4aXN0ZWQgJiYgdmVyc2lvbiA+IDApIHtcbiAgICBjb25zdCBiYWNrdXBEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ2JhY2t1cHMnKTtcbiAgICBmcy5ta2RpclN5bmMoYmFja3VwRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zdCBzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyk7XG4gICAgZnMuY29weUZpbGVTeW5jKGRiUGF0aCwgcGF0aC5qb2luKGJhY2t1cERpciwgYHByZS1taWdyYXRpb24tdiR7dmVyc2lvbn0tJHtzdGFtcH0uZGJgKSk7XG4gIH1cblxuICBjb25zdCBydW4gPSBkYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgZm9yIChjb25zdCBtIG9mIHBlbmRpbmcpIHtcbiAgICAgIGRiLmV4ZWMobS5zcWwpO1xuICAgICAgZGIucHJlcGFyZShcbiAgICAgICAgXCJJTlNFUlQgSU5UTyBtZXRhKGtleSx2YWx1ZSkgVkFMVUVTKCdzY2hlbWFfdmVyc2lvbicsPykgXCIgK1xuICAgICAgICAgIFwiT04gQ09ORkxJQ1Qoa2V5KSBETyBVUERBVEUgU0VUIHZhbHVlPWV4Y2x1ZGVkLnZhbHVlXCIsXG4gICAgICApLnJ1bihTdHJpbmcobS52ZXJzaW9uKSk7XG4gICAgfVxuICB9KTtcbiAgcnVuKCk7XG59XG5cbmZ1bmN0aW9uIGVuc3VyZU1ldGEoZGI6IERCLCBrZXk6IHN0cmluZywgbWFrZTogKCkgPT4gc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgcm93ID0gZGIucHJlcGFyZSgnU0VMRUNUIHZhbHVlIEZST00gbWV0YSBXSEVSRSBrZXk9PycpLmdldChrZXkpIGFzXG4gICAgfCB7IHZhbHVlOiBzdHJpbmcgfVxuICAgIHwgdW5kZWZpbmVkO1xuICBpZiAocm93KSByZXR1cm4gcm93LnZhbHVlO1xuICBjb25zdCB2YWx1ZSA9IG1ha2UoKTtcbiAgZGIucHJlcGFyZSgnSU5TRVJUIElOVE8gbWV0YShrZXksdmFsdWUpIFZBTFVFUyg/LD8pJykucnVuKGtleSwgdmFsdWUpO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXRhKGRiOiBEQiwga2V5OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3Qgcm93ID0gZGIucHJlcGFyZSgnU0VMRUNUIHZhbHVlIEZST00gbWV0YSBXSEVSRSBrZXk9PycpLmdldChrZXkpIGFzXG4gICAgfCB7IHZhbHVlOiBzdHJpbmcgfVxuICAgIHwgdW5kZWZpbmVkO1xuICByZXR1cm4gcm93ID8gcm93LnZhbHVlIDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1ldGEoZGI6IERCLCBrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBkYi5wcmVwYXJlKFxuICAgICdJTlNFUlQgSU5UTyBtZXRhKGtleSx2YWx1ZSkgVkFMVUVTKD8sPykgT04gQ09ORkxJQ1Qoa2V5KSBETyBVUERBVEUgU0VUIHZhbHVlPWV4Y2x1ZGVkLnZhbHVlJyxcbiAgKS5ydW4oa2V5LCB2YWx1ZSk7XG59XG5cbi8qKiBNYW51YWwgYmFja3VwOiBjb25zaXN0ZW50IHNuYXBzaG90IHZpYSBTUUxpdGUgYmFja3VwIEFQSS4gUmV0dXJucyBiYWNrdXAgcGF0aC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBiYWNrdXBEYXRhYmFzZShjdHg6IERiQ29udGV4dCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGJhY2t1cERpciA9IHBhdGguam9pbihjdHguZGF0YURpciwgJ2JhY2t1cHMnKTtcbiAgZnMubWtkaXJTeW5jKGJhY2t1cERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IHN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKTtcbiAgY29uc3QgZGVzdCA9IHBhdGguam9pbihiYWNrdXBEaXIsIGB0ZXRoZXItJHtzdGFtcH0uZGJgKTtcbiAgYXdhaXQgY3R4LmRiLmJhY2t1cChkZXN0KTtcbiAgcmV0dXJuIGRlc3Q7XG59XG4iLCAiLy8gVmVyc2lvbmVkIHNjaGVtYSBtaWdyYXRpb25zLiBOZXZlciBlZGl0IGEgc2hpcHBlZCBtaWdyYXRpb24gXHUyMDE0IGFwcGVuZCBhIG5ldyBvbmUuXG4vLyBSdW5uZXI6IGRiLnRzIGFwcGx5TWlncmF0aW9ucygpLiBFYWNoIG1pZ3JhdGlvbiBydW5zIGluIGEgdHJhbnNhY3Rpb24uXG5cbmV4cG9ydCBpbnRlcmZhY2UgTWlncmF0aW9uIHtcbiAgdmVyc2lvbjogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG4gIHNxbDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgTUlHUkFUSU9OUzogTWlncmF0aW9uW10gPSBbXG4gIHtcbiAgICB2ZXJzaW9uOiAxLFxuICAgIG5hbWU6ICdjb3JlLXNjaGVtYScsXG4gICAgc3FsOiBgXG5DUkVBVEUgVEFCTEUgbWV0YSAoXG4gIGtleSBURVhUIFBSSU1BUlkgS0VZLFxuICB2YWx1ZSBURVhUIE5PVCBOVUxMXG4pO1xuXG5DUkVBVEUgVEFCTEUgdXNlcnMgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXG4gIGluaXRpYWxzIFRFWFQgTk9UIE5VTEwsXG4gIGNvbG9yIFRFWFQgTk9UIE5VTEwsXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTFxuKTtcblxuQ1JFQVRFIFRBQkxFIGl0ZW1zIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgaWRlbnQgVEVYVCBOT1QgTlVMTCBVTklRVUUsXG4gIHR5cGUgVEVYVCBOT1QgTlVMTCxcbiAgdGl0bGUgVEVYVCBOT1QgTlVMTCxcbiAgYm9keSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIGJvZHlfdGV4dCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIHN0YXR1cyBURVhUIE5PVCBOVUxMLFxuICBwcmlvcml0eSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ25vbmUnLFxuICBvd25lcl9pZCBURVhULFxuICByZXBvcnRlcl9pZCBURVhULFxuICBtaWxlc3RvbmVfaWQgVEVYVCxcbiAgcmVsZWFzZV9pZCBURVhULFxuICBwYXJlbnRfaWQgVEVYVCxcbiAgc3RhcnRfZGF0ZSBURVhULFxuICBkdWVfZGF0ZSBURVhULFxuICBjb21wbGV0ZWRfYXQgVEVYVCxcbiAgZWZmb3J0IFJFQUwsXG4gIGNvbmZpZGVuY2UgVEVYVCxcbiAgcmlza19sZXZlbCBURVhULFxuICBidXNpbmVzc192YWx1ZSBURVhULFxuICBsZWFkZXJzaGlwX3Zpc2libGUgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gIHByb2dyZXNzIElOVEVHRVIsXG4gIHRhZ3MgVEVYVCBOT1QgTlVMTCBERUZBVUxUICdbXScsXG4gIGV4dHJhIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAne30nLFxuICBhcmNoaXZlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcbiAgc2FtcGxlIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXG4gIHVwZGF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcbiAgY3JlYXRlZF9ieSBURVhUIE5PVCBOVUxMLFxuICB1cGRhdGVkX2J5IFRFWFQgTk9UIE5VTExcbik7XG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX3R5cGUgT04gaXRlbXModHlwZSkgV0hFUkUgZGVsZXRlZCA9IDA7XG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX3N0YXR1cyBPTiBpdGVtcyhzdGF0dXMpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19vd25lciBPTiBpdGVtcyhvd25lcl9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX21pbGVzdG9uZSBPTiBpdGVtcyhtaWxlc3RvbmVfaWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19yZWxlYXNlIE9OIGl0ZW1zKHJlbGVhc2VfaWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19wYXJlbnQgT04gaXRlbXMocGFyZW50X2lkKSBXSEVSRSBkZWxldGVkID0gMDtcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfdXBkYXRlZCBPTiBpdGVtcyh1cGRhdGVkX2F0KTtcblxuQ1JFQVRFIFRBQkxFIGlkZW50X2NvdW50ZXJzIChcbiAgdHlwZSBURVhUIFBSSU1BUlkgS0VZLFxuICBuZXh0IElOVEVHRVIgTk9UIE5VTExcbik7XG5cbkNSRUFURSBUQUJMRSBsaW5rcyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGZyb21faWQgVEVYVCBOT1QgTlVMTCxcbiAgdG9faWQgVEVYVCBOT1QgTlVMTCxcbiAga2luZCBURVhUIE5PVCBOVUxMLFxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXG4gIGNyZWF0ZWRfYnkgVEVYVCBOT1QgTlVMTFxuKTtcbkNSRUFURSBJTkRFWCBpZHhfbGlua3NfZnJvbSBPTiBsaW5rcyhmcm9tX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcbkNSRUFURSBJTkRFWCBpZHhfbGlua3NfdG8gT04gbGlua3ModG9faWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIFVOSVFVRSBJTkRFWCBpZHhfbGlua3NfdW5pcSBPTiBsaW5rcyhmcm9tX2lkLCB0b19pZCwga2luZCk7XG5cbkNSRUFURSBUQUJMRSBjb21tZW50cyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGl0ZW1faWQgVEVYVCBOT1QgTlVMTCxcbiAgYXV0aG9yX2lkIFRFWFQgTk9UIE5VTEwsXG4gIGJvZHkgVEVYVCBOT1QgTlVMTCxcbiAgYm9keV90ZXh0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxuICB1cGRhdGVkX2F0IFRFWFQsXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcbik7XG5DUkVBVEUgSU5ERVggaWR4X2NvbW1lbnRzX2l0ZW0gT04gY29tbWVudHMoaXRlbV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XG5cbkNSRUFURSBUQUJMRSBhdHRhY2htZW50cyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGl0ZW1faWQgVEVYVCBOT1QgTlVMTCxcbiAgZmlsZW5hbWUgVEVYVCBOT1QgTlVMTCxcbiAgbWltZSBURVhUIE5PVCBOVUxMLFxuICBzaXplIElOVEVHRVIgTk9UIE5VTEwsXG4gIHNoYTI1NiBURVhUIE5PVCBOVUxMLFxuICBkZXNjcmlwdGlvbiBURVhULFxuICB1cGxvYWRlZF9ieSBURVhUIE5PVCBOVUxMLFxuICBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcbik7XG5DUkVBVEUgSU5ERVggaWR4X2F0dGFjaG1lbnRzX2l0ZW0gT04gYXR0YWNobWVudHMoaXRlbV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XG5cbkNSRUFURSBUQUJMRSBhY3Rpdml0eSAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGl0ZW1faWQgVEVYVCxcbiAgYWN0b3JfaWQgVEVYVCBOT1QgTlVMTCxcbiAga2luZCBURVhUIE5PVCBOVUxMLFxuICBmaWVsZCBURVhULFxuICBvbGRfdmFsdWUgVEVYVCxcbiAgbmV3X3ZhbHVlIFRFWFQsXG4gIGF0IFRFWFQgTk9UIE5VTExcbik7XG5DUkVBVEUgSU5ERVggaWR4X2FjdGl2aXR5X2l0ZW0gT04gYWN0aXZpdHkoaXRlbV9pZCk7XG5DUkVBVEUgSU5ERVggaWR4X2FjdGl2aXR5X2F0IE9OIGFjdGl2aXR5KGF0KTtcblxuQ1JFQVRFIFRBQkxFIGl0ZW1fdmVyc2lvbnMgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBpdGVtX2lkIFRFWFQgTk9UIE5VTEwsXG4gIHZlcnNpb24gSU5URUdFUiBOT1QgTlVMTCxcbiAgdGl0bGUgVEVYVCBOT1QgTlVMTCxcbiAgYm9keSBURVhUIE5PVCBOVUxMLFxuICBzYXZlZF9ieSBURVhUIE5PVCBOVUxMLFxuICBzYXZlZF9hdCBURVhUIE5PVCBOVUxMXG4pO1xuQ1JFQVRFIElOREVYIGlkeF92ZXJzaW9uc19pdGVtIE9OIGl0ZW1fdmVyc2lvbnMoaXRlbV9pZCwgdmVyc2lvbik7XG5cbkNSRUFURSBUQUJMRSBtaWxlc3RvbmVzIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgbmFtZSBURVhUIE5PVCBOVUxMLFxuICBkZXNjcmlwdGlvbiBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIHRhcmdldF9kYXRlIFRFWFQsXG4gIHN0YXR1cyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ3BsYW5uZWQnLFxuICBzb3J0IElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBzYW1wbGUgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcbik7XG5cbkNSRUFURSBUQUJMRSByZWxlYXNlcyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIG5hbWUgVEVYVCBOT1QgTlVMTCxcbiAgdmVyc2lvbiBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIHRhcmdldF9kYXRlIFRFWFQsXG4gIHN0YXR1cyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ3BsYW5uZWQnLFxuICBnb2FscyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIG5vdGVzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcbiAgc2FtcGxlIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwXG4pO1xuXG5DUkVBVEUgVEFCTEUgc2F2ZWRfdmlld3MgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXG4gIGNvbmZpZyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ3t9JyxcbiAgcGlubmVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTEwsXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMFxuKTtcblxuLS0gQXBwZW5kLW9ubHkgb3BlcmF0aW9uIGxvZy4gU291cmNlIGZvciBzeW5jIGV4cG9ydDsgcGVlcnMnIG9wcyByZWNvcmRlZCB3aXRoIG9yaWdpbiBkZXZpY2UuXG5DUkVBVEUgVEFCTEUgb3Bsb2cgKFxuICBzZXEgSU5URUdFUiBQUklNQVJZIEtFWSBBVVRPSU5DUkVNRU5ULFxuICBvcF9pZCBURVhUIE5PVCBOVUxMIFVOSVFVRSxcbiAgZGV2aWNlX2lkIFRFWFQgTk9UIE5VTEwsXG4gIGFjdG9yX2lkIFRFWFQgTk9UIE5VTEwsXG4gIGxhbXBvcnQgSU5URUdFUiBOT1QgTlVMTCxcbiAgYXQgVEVYVCBOT1QgTlVMTCxcbiAgZW50aXR5IFRFWFQgTk9UIE5VTEwsXG4gIGVudGl0eV9pZCBURVhUIE5PVCBOVUxMLFxuICBhY3Rpb24gVEVYVCBOT1QgTlVMTCxcbiAgcGF5bG9hZCBURVhUIE5PVCBOVUxMXG4pO1xuQ1JFQVRFIElOREVYIGlkeF9vcGxvZ19lbnRpdHkgT04gb3Bsb2coZW50aXR5LCBlbnRpdHlfaWQpO1xuQ1JFQVRFIElOREVYIGlkeF9vcGxvZ19kZXZpY2UgT04gb3Bsb2coZGV2aWNlX2lkLCBzZXEpO1xuXG4tLSBGaWVsZC1sZXZlbCB3cml0ZSByZWdpc3RyeSBmb3IgTFdXIG1lcmdlOiBsYXN0IChsYW1wb3J0LCBkZXZpY2UpIHRoYXQgd3JvdGUgZWFjaCBmaWVsZC5cbkNSRUFURSBUQUJMRSBmaWVsZF9jbG9jayAoXG4gIGVudGl0eSBURVhUIE5PVCBOVUxMLFxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcbiAgZmllbGQgVEVYVCBOT1QgTlVMTCxcbiAgbGFtcG9ydCBJTlRFR0VSIE5PVCBOVUxMLFxuICBkZXZpY2VfaWQgVEVYVCBOT1QgTlVMTCxcbiAgUFJJTUFSWSBLRVkgKGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZClcbik7XG5cbkNSRUFURSBUQUJMRSBzeW5jX2NvbmZsaWN0cyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGVudGl0eSBURVhUIE5PVCBOVUxMLFxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcbiAgZmllbGQgVEVYVCBOT1QgTlVMTCxcbiAgbG9jYWxfdmFsdWUgVEVYVCBOT1QgTlVMTCxcbiAgcmVtb3RlX3ZhbHVlIFRFWFQgTk9UIE5VTEwsXG4gIHJlbW90ZV9kZXZpY2UgVEVYVCBOT1QgTlVMTCxcbiAgcmVtb3RlX2FjdG9yIFRFWFQgTk9UIE5VTEwsXG4gIGRldGVjdGVkX2F0IFRFWFQgTk9UIE5VTEwsXG4gIHJlc29sdmVkX2F0IFRFWFQsXG4gIHJlc29sdXRpb24gVEVYVFxuKTtcblxuLS0gUGVyLXBlZXIgaW1wb3J0IHByb2dyZXNzOiBoaWdoZXN0IGZpbGUgc2VxdWVuY2UgY29uc3VtZWQgcGVyIGRldmljZS5cbkNSRUFURSBUQUJMRSBzeW5jX3BlZXJzIChcbiAgZGV2aWNlX2lkIFRFWFQgUFJJTUFSWSBLRVksXG4gIHVzZXJfbmFtZSBURVhULFxuICBsYXN0X2ZpbGUgVEVYVCxcbiAgbGFzdF9zZWVuX2F0IFRFWFRcbik7XG5cbkNSRUFURSBWSVJUVUFMIFRBQkxFIGl0ZW1zX2Z0cyBVU0lORyBmdHM1KFxuICBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncyxcbiAgY29udGVudD0naXRlbXMnLCBjb250ZW50X3Jvd2lkPSdyb3dpZCcsXG4gIHRva2VuaXplPSd1bmljb2RlNjEnXG4pO1xuXG5DUkVBVEUgVFJJR0dFUiBpdGVtc19mdHNfYWkgQUZURVIgSU5TRVJUIE9OIGl0ZW1zIEJFR0lOXG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhyb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXG4gIFZBTFVFUyAobmV3LnJvd2lkLCBuZXcuaWRlbnQsIG5ldy50aXRsZSwgbmV3LmJvZHlfdGV4dCwgbmV3LnRhZ3MpO1xuRU5EO1xuQ1JFQVRFIFRSSUdHRVIgaXRlbXNfZnRzX2FkIEFGVEVSIERFTEVURSBPTiBpdGVtcyBCRUdJTlxuICBJTlNFUlQgSU5UTyBpdGVtc19mdHMoaXRlbXNfZnRzLCByb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXG4gIFZBTFVFUyAoJ2RlbGV0ZScsIG9sZC5yb3dpZCwgb2xkLmlkZW50LCBvbGQudGl0bGUsIG9sZC5ib2R5X3RleHQsIG9sZC50YWdzKTtcbkVORDtcbkNSRUFURSBUUklHR0VSIGl0ZW1zX2Z0c19hdSBBRlRFUiBVUERBVEUgT04gaXRlbXMgQkVHSU5cbiAgSU5TRVJUIElOVE8gaXRlbXNfZnRzKGl0ZW1zX2Z0cywgcm93aWQsIGlkZW50LCB0aXRsZSwgYm9keV90ZXh0LCB0YWdzKVxuICBWQUxVRVMgKCdkZWxldGUnLCBvbGQucm93aWQsIG9sZC5pZGVudCwgb2xkLnRpdGxlLCBvbGQuYm9keV90ZXh0LCBvbGQudGFncyk7XG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhyb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXG4gIFZBTFVFUyAobmV3LnJvd2lkLCBuZXcuaWRlbnQsIG5ldy50aXRsZSwgbmV3LmJvZHlfdGV4dCwgbmV3LnRhZ3MpO1xuRU5EO1xuYCxcbiAgfSxcbiAge1xuICAgIHZlcnNpb246IDIsXG4gICAgbmFtZTogJ3BlbmRpbmctb3BzLWJ1ZmZlcicsXG4gICAgc3FsOiBgXG4tLSBPcHMgdGhhdCBhcnJpdmVkIGJlZm9yZSB0aGUgY3JlYXRlIG9mIHRoZWlyIHRhcmdldCBlbnRpdHkgKHBvc3NpYmxlIHdpdGggMytcbi0tIGRldmljZXMsIHNpbmNlIG9yZGVyaW5nIGlzIG9ubHkgZ3VhcmFudGVlZCBwZXIgZGV2aWNlKS4gQnVmZmVyZWQgaGVyZSBhbmRcbi0tIHJlcGxheWVkIG9uY2UgdGhlIGNyZWF0ZSBsYW5kcy5cbkNSRUFURSBUQUJMRSBwZW5kaW5nX29wcyAoXG4gIG9wX2lkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGRldmljZV9pZCBURVhUIE5PVCBOVUxMLFxuICBhY3Rvcl9pZCBURVhUIE5PVCBOVUxMLFxuICBsYW1wb3J0IElOVEVHRVIgTk9UIE5VTEwsXG4gIGF0IFRFWFQgTk9UIE5VTEwsXG4gIGVudGl0eSBURVhUIE5PVCBOVUxMLFxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcbiAgYWN0aW9uIFRFWFQgTk9UIE5VTEwsXG4gIHBheWxvYWQgVEVYVCBOT1QgTlVMTFxuKTtcbkNSRUFURSBJTkRFWCBpZHhfcGVuZGluZ19lbnRpdHkgT04gcGVuZGluZ19vcHMoZW50aXR5LCBlbnRpdHlfaWQpO1xuYCxcbiAgfSxcbiAge1xuICAgIHZlcnNpb246IDMsXG4gICAgbmFtZTogJ2Z1bGwtYXVkaXRhYmlsaXR5JyxcbiAgICBzcWw6IGBcbi0tIEV2ZXJ5IHVzZXItZGF0YSB0YWJsZSBnZXRzIGNyZWF0ZWQvdXBkYXRlZCBhdHRyaWJ1dGlvbiBhbmQgc29mdC1kZWxldGVcbi0tIGF0dHJpYnV0aW9uIHNvIFwid2hvIGNyZWF0ZWQvY2hhbmdlZC9kZWxldGVkIHRoaXMsIGFuZCB3aGVuXCIgaXMgYWx3YXlzIGFuc3dlcmFibGVcbi0tIGZyb20gdGhlIHNjaGVtYSwgbm90IGp1c3QgdGhlIG9wIGxvZy5cblxuLS0gTWlsZXN0b25lcyArIHJlbGVhc2VzIGhhZCBubyBhdWRpdCBjb2x1bW5zIGF0IGFsbC5cbkFMVEVSIFRBQkxFIG1pbGVzdG9uZXMgQUREIENPTFVNTiBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcbkFMVEVSIFRBQkxFIG1pbGVzdG9uZXMgQUREIENPTFVNTiBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcbkFMVEVSIFRBQkxFIG1pbGVzdG9uZXMgQUREIENPTFVNTiB1cGRhdGVkX2F0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcbkFMVEVSIFRBQkxFIG1pbGVzdG9uZXMgQUREIENPTFVNTiB1cGRhdGVkX2J5IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcbkFMVEVSIFRBQkxFIHJlbGVhc2VzIEFERCBDT0xVTU4gY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJyc7XG5BTFRFUiBUQUJMRSByZWxlYXNlcyBBREQgQ09MVU1OIGNyZWF0ZWRfYnkgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnO1xuQUxURVIgVEFCTEUgcmVsZWFzZXMgQUREIENPTFVNTiB1cGRhdGVkX2F0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJztcbkFMVEVSIFRBQkxFIHJlbGVhc2VzIEFERCBDT0xVTU4gdXBkYXRlZF9ieSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJyc7XG5cbi0tIENvbW1lbnQgZWRpdHMvZGVsZXRlcyB3ZXJlIHVuYXR0cmlidXRlZC5cbkFMVEVSIFRBQkxFIGNvbW1lbnRzIEFERCBDT0xVTU4gdXBkYXRlZF9ieSBURVhUO1xuQUxURVIgVEFCTEUgY29tbWVudHMgQUREIENPTFVNTiBkZWxldGVkX2F0IFRFWFQ7XG5BTFRFUiBUQUJMRSBjb21tZW50cyBBREQgQ09MVU1OIGRlbGV0ZWRfYnkgVEVYVDtcblxuLS0gQXR0YWNobWVudCByZW1vdmFsIHdhcyB1bmF0dHJpYnV0ZWQuXG5BTFRFUiBUQUJMRSBhdHRhY2htZW50cyBBREQgQ09MVU1OIGRlbGV0ZWRfYXQgVEVYVDtcbkFMVEVSIFRBQkxFIGF0dGFjaG1lbnRzIEFERCBDT0xVTU4gZGVsZXRlZF9ieSBURVhUO1xuXG4tLSBMaW5rIHJlbW92YWwgYXR0cmlidXRpb24gb24gdGhlIHJvdyAobm90IG9ubHkgaW4gdGhlIGFjdGl2aXR5IGZlZWQpLlxuQUxURVIgVEFCTEUgbGlua3MgQUREIENPTFVNTiBkZWxldGVkX2F0IFRFWFQ7XG5BTFRFUiBUQUJMRSBsaW5rcyBBREQgQ09MVU1OIGRlbGV0ZWRfYnkgVEVYVDtcblxuLS0gU2F2ZWQgdmlldyAvIGl0ZW0gZGVsZXRlIGF0dHJpYnV0aW9uIG9uIHRoZSByb3cuXG5BTFRFUiBUQUJMRSBzYXZlZF92aWV3cyBBREQgQ09MVU1OIHVwZGF0ZWRfYXQgVEVYVDtcbkFMVEVSIFRBQkxFIHNhdmVkX3ZpZXdzIEFERCBDT0xVTU4gdXBkYXRlZF9ieSBURVhUO1xuQUxURVIgVEFCTEUgc2F2ZWRfdmlld3MgQUREIENPTFVNTiBkZWxldGVkX2F0IFRFWFQ7XG5BTFRFUiBUQUJMRSBzYXZlZF92aWV3cyBBREQgQ09MVU1OIGRlbGV0ZWRfYnkgVEVYVDtcbkFMVEVSIFRBQkxFIGl0ZW1zIEFERCBDT0xVTU4gZGVsZXRlZF9hdCBURVhUO1xuQUxURVIgVEFCTEUgaXRlbXMgQUREIENPTFVNTiBkZWxldGVkX2J5IFRFWFQ7XG5cbi0tIFdobyByZXNvbHZlZCBhIHN5bmMgY29uZmxpY3QuXG5BTFRFUiBUQUJMRSBzeW5jX2NvbmZsaWN0cyBBREQgQ09MVU1OIHJlc29sdmVkX2J5IFRFWFQ7XG5cbi0tIEJhY2tmaWxsIGV4aXN0aW5nIG1pbGVzdG9uZS9yZWxlYXNlIHJvd3Mgc28gYXVkaXQgdGltZXN0YW1wcyBhcmUgbmV2ZXIgYmxhbmsuXG5VUERBVEUgbWlsZXN0b25lcyBTRVQgY3JlYXRlZF9hdCA9IGRhdGV0aW1lKCdub3cnKSwgdXBkYXRlZF9hdCA9IGRhdGV0aW1lKCdub3cnKSBXSEVSRSBjcmVhdGVkX2F0ID0gJyc7XG5VUERBVEUgcmVsZWFzZXMgU0VUIGNyZWF0ZWRfYXQgPSBkYXRldGltZSgnbm93JyksIHVwZGF0ZWRfYXQgPSBkYXRldGltZSgnbm93JykgV0hFUkUgY3JlYXRlZF9hdCA9ICcnO1xuYCxcbiAgfSxcbl07XG4iLCAiLy8gU3RvcmU6IHRoZSBzaW5nbGUgd3JpdGUgcGF0aC4gRXZlcnkgbXV0YXRpb24gKGxvY2FsIG9yIHJlbW90ZSkgZmxvd3MgdGhyb3VnaCBoZXJlIHNvXG4vLyBTUUxpdGUgc3RhdGUsIHRoZSBvcGxvZywgZmllbGQgY2xvY2tzLCBhY3Rpdml0eSBoaXN0b3J5LCBhbmQgRlRTIHN0YXkgY29uc2lzdGVudC5cbi8vXG4vLyBTeW5jIG1vZGVsIChzZWUgZG9jcy9TWU5DX0FSQ0hJVEVDVFVSRS5tZCk6XG4vLyAtIExvY2FsIG11dGF0aW9ucyBhcHBlbmQgZmllbGQtZ3JhbnVsYXIgb3BzIHRvIG9wbG9nIChsYW1wb3J0IGNsb2NrICsgZGV2aWNlIGlkKS5cbi8vIC0gJ3NldCcgb3BzIGNhcnJ5IGJhc2VkT24gPSB0aGUgKGxhbXBvcnQsZGV2aWNlKSBlYWNoIGZpZWxkIGhhZCB3aGVuIHdyaXR0ZW4sXG4vLyAgIGxldHRpbmcgdGhlIGltcG9ydGVyIGRpc3Rpbmd1aXNoIGNsZWFuIGNhdXNhbCB1cGRhdGVzIGZyb20gdHJ1ZSBjb25jdXJyZW50IGVkaXRzLlxuLy8gLSBDb25jdXJyZW50IGVkaXRzIHJlc29sdmUgYnkgTFdXIChsYW1wb3J0LCBkZXZpY2VJZCB0aWVicmVhaykuIEZvciBjb250ZW50IGZpZWxkc1xuLy8gICAodGl0bGUsIGJvZHkpIHRoZSBsb3NpbmcgdmFsdWUgaXMgcHJlc2VydmVkIGluIHN5bmNfY29uZmxpY3RzIGZvciBtYW51YWwgcmV2aWV3LlxuXG5pbXBvcnQgY3J5cHRvIGZyb20gJ25vZGU6Y3J5cHRvJztcbmltcG9ydCB0eXBlIHsgREIsIERiQ29udGV4dCB9IGZyb20gJy4vZGInO1xuaW1wb3J0IHsgZ2V0TWV0YSwgc2V0TWV0YSB9IGZyb20gJy4vZGInO1xuaW1wb3J0IHR5cGUge1xuICBJdGVtRmlsdGVyLFxuICBJdGVtU29ydCxcbiAgSXRlbVR5cGUsXG4gIE9wLFxuICBXb3JrSXRlbSxcbiAgSXRlbUxpbmssXG4gIENvbW1lbnQsXG4gIE1pbGVzdG9uZSxcbiAgUmVsZWFzZSxcbiAgU2F2ZWRWaWV3LFxuICBVc2VyLFxuICBMaW5rS2luZCxcbiAgU2VhcmNoUmVzdWx0LFxuICBTeW5jQ29uZmxpY3QsXG59IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5pbXBvcnQgeyBJREVOVF9QUkVGSVgsIHN0YXR1c2VzRm9yVHlwZSwgVEVSTUlOQUxfU1RBVFVTRVMgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuaW1wb3J0IHsgZG9jVG9UZXh0IH0gZnJvbSAnLi4vLi4vc2hhcmVkL2RvYyc7XG5cbmNvbnN0IENPTkZMSUNUX1NVUkZBQ0VEX0ZJRUxEUyA9IG5ldyBTZXQoWyd0aXRsZScsICdib2R5J10pO1xuXG4vLyBjYW1lbENhc2UgZmllbGQgLT4gaXRlbXMgY29sdW1uXG5jb25zdCBJVEVNX0NPTFM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIGlkZW50OiAnaWRlbnQnLFxuICB0eXBlOiAndHlwZScsXG4gIHRpdGxlOiAndGl0bGUnLFxuICBib2R5OiAnYm9keScsXG4gIGJvZHlUZXh0OiAnYm9keV90ZXh0JyxcbiAgc3RhdHVzOiAnc3RhdHVzJyxcbiAgcHJpb3JpdHk6ICdwcmlvcml0eScsXG4gIG93bmVySWQ6ICdvd25lcl9pZCcsXG4gIHJlcG9ydGVySWQ6ICdyZXBvcnRlcl9pZCcsXG4gIG1pbGVzdG9uZUlkOiAnbWlsZXN0b25lX2lkJyxcbiAgcmVsZWFzZUlkOiAncmVsZWFzZV9pZCcsXG4gIHBhcmVudElkOiAncGFyZW50X2lkJyxcbiAgc3RhcnREYXRlOiAnc3RhcnRfZGF0ZScsXG4gIGR1ZURhdGU6ICdkdWVfZGF0ZScsXG4gIGNvbXBsZXRlZEF0OiAnY29tcGxldGVkX2F0JyxcbiAgZWZmb3J0OiAnZWZmb3J0JyxcbiAgY29uZmlkZW5jZTogJ2NvbmZpZGVuY2UnLFxuICByaXNrTGV2ZWw6ICdyaXNrX2xldmVsJyxcbiAgYnVzaW5lc3NWYWx1ZTogJ2J1c2luZXNzX3ZhbHVlJyxcbiAgbGVhZGVyc2hpcFZpc2libGU6ICdsZWFkZXJzaGlwX3Zpc2libGUnLFxuICBwcm9ncmVzczogJ3Byb2dyZXNzJyxcbiAgdGFnczogJ3RhZ3MnLFxuICBleHRyYTogJ2V4dHJhJyxcbiAgYXJjaGl2ZWQ6ICdhcmNoaXZlZCcsXG4gIHNhbXBsZTogJ3NhbXBsZScsXG4gIGRlbGV0ZWQ6ICdkZWxldGVkJyxcbiAgdXBkYXRlZEF0OiAndXBkYXRlZF9hdCcsXG4gIHVwZGF0ZWRCeTogJ3VwZGF0ZWRfYnknLFxufTtcblxuY29uc3QgSlNPTl9JVEVNX0ZJRUxEUyA9IG5ldyBTZXQoWyd0YWdzJywgJ2V4dHJhJ10pO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN0b3JlRXZlbnRzIHtcbiAgb25DaGFuZ2U6ICh3aGF0OiB7IGVudGl0eTogc3RyaW5nOyBlbnRpdHlJZDogc3RyaW5nIH0pID0+IHZvaWQ7XG4gIG9uQ29uZmxpY3Q6IChjb25mbGljdDogU3luY0NvbmZsaWN0KSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgU3RvcmUge1xuICByZWFkb25seSBkYjogREI7XG4gIHJlYWRvbmx5IGRldmljZUlkOiBzdHJpbmc7XG4gIGFjdG9ySWQ6IHN0cmluZztcbiAgcHJpdmF0ZSBldmVudHM6IFN0b3JlRXZlbnRzO1xuXG4gIGNvbnN0cnVjdG9yKGN0eDogRGJDb250ZXh0LCBhY3RvcklkOiBzdHJpbmcsIGV2ZW50cz86IFBhcnRpYWw8U3RvcmVFdmVudHM+KSB7XG4gICAgdGhpcy5kYiA9IGN0eC5kYjtcbiAgICB0aGlzLmRldmljZUlkID0gY3R4LmRldmljZUlkO1xuICAgIHRoaXMuYWN0b3JJZCA9IGFjdG9ySWQ7XG4gICAgdGhpcy5ldmVudHMgPSB7XG4gICAgICBvbkNoYW5nZTogZXZlbnRzPy5vbkNoYW5nZSA/PyAoKCkgPT4ge30pLFxuICAgICAgb25Db25mbGljdDogZXZlbnRzPy5vbkNvbmZsaWN0ID8/ICgoKSA9PiB7fSksXG4gICAgfTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gY2xvY2tzIC0tLS0tLS0tLS1cbiAgcHJpdmF0ZSB0aWNrTGFtcG9ydCgpOiBudW1iZXIge1xuICAgIGNvbnN0IGN1ciA9IE51bWJlcihnZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JykgPz8gJzAnKSArIDE7XG4gICAgc2V0TWV0YSh0aGlzLmRiLCAnbGFtcG9ydCcsIFN0cmluZyhjdXIpKTtcbiAgICByZXR1cm4gY3VyO1xuICB9XG5cbiAgcHJpdmF0ZSB3aXRuZXNzTGFtcG9ydChyZW1vdGU6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGN1ciA9IE51bWJlcihnZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JykgPz8gJzAnKTtcbiAgICBpZiAocmVtb3RlID4gY3VyKSBzZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JywgU3RyaW5nKHJlbW90ZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3coKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaWVsZENsb2NrKGVudGl0eTogc3RyaW5nLCBlbnRpdHlJZDogc3RyaW5nLCBmaWVsZDogc3RyaW5nKTogeyBsYW1wb3J0OiBudW1iZXI7IGRldmljZUlkOiBzdHJpbmcgfSB8IG51bGwge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgbGFtcG9ydCwgZGV2aWNlX2lkIEZST00gZmllbGRfY2xvY2sgV0hFUkUgZW50aXR5PT8gQU5EIGVudGl0eV9pZD0/IEFORCBmaWVsZD0/JylcbiAgICAgIC5nZXQoZW50aXR5LCBlbnRpdHlJZCwgZmllbGQpIGFzIHsgbGFtcG9ydDogbnVtYmVyOyBkZXZpY2VfaWQ6IHN0cmluZyB9IHwgdW5kZWZpbmVkO1xuICAgIHJldHVybiByb3cgPyB7IGxhbXBvcnQ6IHJvdy5sYW1wb3J0LCBkZXZpY2VJZDogcm93LmRldmljZV9pZCB9IDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgc2V0RmllbGRDbG9jayhlbnRpdHk6IHN0cmluZywgZW50aXR5SWQ6IHN0cmluZywgZmllbGQ6IHN0cmluZywgbGFtcG9ydDogbnVtYmVyLCBkZXZpY2VJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5kYlxuICAgICAgLnByZXBhcmUoXG4gICAgICAgIGBJTlNFUlQgSU5UTyBmaWVsZF9jbG9jayhlbnRpdHksIGVudGl0eV9pZCwgZmllbGQsIGxhbXBvcnQsIGRldmljZV9pZCkgVkFMVUVTKD8sPyw/LD8sPylcbiAgICAgICAgIE9OIENPTkZMSUNUKGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZCkgRE8gVVBEQVRFIFNFVCBsYW1wb3J0PWV4Y2x1ZGVkLmxhbXBvcnQsIGRldmljZV9pZD1leGNsdWRlZC5kZXZpY2VfaWRgLFxuICAgICAgKVxuICAgICAgLnJ1bihlbnRpdHksIGVudGl0eUlkLCBmaWVsZCwgbGFtcG9ydCwgZGV2aWNlSWQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBvcGxvZyAtLS0tLS0tLS0tXG4gIHByaXZhdGUgYXBwZW5kT3Aob3A6IE9wKTogdm9pZCB7XG4gICAgdGhpcy5kYlxuICAgICAgLnByZXBhcmUoXG4gICAgICAgIGBJTlNFUlQgSU5UTyBvcGxvZyhvcF9pZCwgZGV2aWNlX2lkLCBhY3Rvcl9pZCwgbGFtcG9ydCwgYXQsIGVudGl0eSwgZW50aXR5X2lkLCBhY3Rpb24sIHBheWxvYWQpXG4gICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LD8pYCxcbiAgICAgIClcbiAgICAgIC5ydW4ob3Aub3BJZCwgb3AuZGV2aWNlSWQsIG9wLmFjdG9ySWQsIG9wLmxhbXBvcnQsIG9wLmF0LCBvcC5lbnRpdHksIG9wLmVudGl0eUlkLCBvcC5hY3Rpb24sIEpTT04uc3RyaW5naWZ5KG9wLnBheWxvYWQpKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9jYWxPcChcbiAgICBlbnRpdHk6IE9wWydlbnRpdHknXSxcbiAgICBlbnRpdHlJZDogc3RyaW5nLFxuICAgIGFjdGlvbjogT3BbJ2FjdGlvbiddLFxuICAgIHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApOiBPcCB7XG4gICAgY29uc3QgbGFtcG9ydCA9IHRoaXMudGlja0xhbXBvcnQoKTtcbiAgICBjb25zdCBvcDogT3AgPSB7XG4gICAgICBvcElkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgZGV2aWNlSWQ6IHRoaXMuZGV2aWNlSWQsXG4gICAgICBhY3RvcklkOiB0aGlzLmFjdG9ySWQsXG4gICAgICBsYW1wb3J0LFxuICAgICAgYXQ6IHRoaXMubm93KCksXG4gICAgICBlbnRpdHksXG4gICAgICBlbnRpdHlJZCxcbiAgICAgIGFjdGlvbixcbiAgICAgIHBheWxvYWQsXG4gICAgfTtcbiAgICB0aGlzLmFwcGVuZE9wKG9wKTtcbiAgICByZXR1cm4gb3A7XG4gIH1cblxuICAvKiogTG9jYWwgJ3NldCc6IHJlY29yZHMgYmFzZWRPbiBjbG9ja3MgdGhlbiBhZHZhbmNlcyB0aGVtLiAqL1xuICBwcml2YXRlIGxvY2FsU2V0KGVudGl0eTogT3BbJ2VudGl0eSddLCBlbnRpdHlJZDogc3RyaW5nLCBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3QgYmFzZWRPbjogUmVjb3JkPHN0cmluZywgeyBsYW1wb3J0OiBudW1iZXI7IGRldmljZUlkOiBzdHJpbmcgfSB8IG51bGw+ID0ge307XG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKGZpZWxkcykpIGJhc2VkT25bZl0gPSB0aGlzLmZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZik7XG4gICAgY29uc3Qgb3AgPSB0aGlzLmxvY2FsT3AoZW50aXR5LCBlbnRpdHlJZCwgJ3NldCcsIHsgZmllbGRzLCBiYXNlZE9uIH0pO1xuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhmaWVsZHMpKSB0aGlzLnNldEZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgdGhpcy5kZXZpY2VJZCk7XG4gIH1cblxuICBwcml2YXRlIGxvY2FsQ3JlYXRlKGVudGl0eTogT3BbJ2VudGl0eSddLCBlbnRpdHlJZDogc3RyaW5nLCByZWNvcmQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3Qgb3AgPSB0aGlzLmxvY2FsT3AoZW50aXR5LCBlbnRpdHlJZCwgJ2NyZWF0ZScsIHsgcmVjb3JkIH0pO1xuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhyZWNvcmQpKSB0aGlzLnNldEZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgdGhpcy5kZXZpY2VJZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGlkZW50IGFsbG9jYXRpb24gLS0tLS0tLS0tLVxuICBhbGxvY0lkZW50KHR5cGU6IEl0ZW1UeXBlKTogc3RyaW5nIHtcbiAgICBjb25zdCBwcmVmaXggPSBJREVOVF9QUkVGSVhbdHlwZV07XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgbmV4dCBGUk9NIGlkZW50X2NvdW50ZXJzIFdIRVJFIHR5cGU9PycpLmdldCh0eXBlKSBhc1xuICAgICAgfCB7IG5leHQ6IG51bWJlciB9XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBsZXQgbiA9IHJvdyA/IHJvdy5uZXh0IDogMTtcbiAgICAvLyBTa2lwIG51bWJlcnMgYWxyZWFkeSB0YWtlbiAoaW1wb3J0cyBtYXkgaGF2ZSBhZHZhbmNlZCB1c2FnZSBwYXN0IG91ciBjb3VudGVyKS5cbiAgICB3aGlsZSAodGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIGl0ZW1zIFdIRVJFIGlkZW50PT8nKS5nZXQoYCR7cHJlZml4fS0ke259YCkpIG4rKztcbiAgICB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gaWRlbnRfY291bnRlcnModHlwZSxuZXh0KSBWQUxVRVMoPyw/KSBPTiBDT05GTElDVCh0eXBlKSBETyBVUERBVEUgU0VUIG5leHQ9PycpXG4gICAgICAucnVuKHR5cGUsIG4gKyAxLCBuICsgMSk7XG4gICAgcmV0dXJuIGAke3ByZWZpeH0tJHtufWA7XG4gIH1cblxuICAvKiogQWR2YW5jZSB0aGUgbG9jYWwgY291bnRlciBwYXN0IGFuIGlkZW50IG9ic2VydmVkIGZyb20gYSBwZWVyLiAqL1xuICBwcml2YXRlIHdpdG5lc3NJZGVudCh0eXBlOiBJdGVtVHlwZSwgaWRlbnQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IG0gPSAvLShcXGQrKSQvLmV4ZWMoaWRlbnQpO1xuICAgIGlmICghbSkgcmV0dXJuO1xuICAgIGNvbnN0IG4gPSBOdW1iZXIobVsxXSk7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgbmV4dCBGUk9NIGlkZW50X2NvdW50ZXJzIFdIRVJFIHR5cGU9PycpLmdldCh0eXBlKSBhc1xuICAgICAgfCB7IG5leHQ6IG51bWJlciB9XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBpZiAoIXJvdyB8fCByb3cubmV4dCA8PSBuKSB7XG4gICAgICB0aGlzLmRiXG4gICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBpZGVudF9jb3VudGVycyh0eXBlLG5leHQpIFZBTFVFUyg/LD8pIE9OIENPTkZMSUNUKHR5cGUpIERPIFVQREFURSBTRVQgbmV4dD0/JylcbiAgICAgICAgLnJ1bih0eXBlLCBuICsgMSwgbiArIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gYWN0aXZpdHkgLS0tLS0tLS0tLVxuICAvKiogUHVibGljIGFjdGl2aXR5IGhvb2sgZm9yIGNvbGxhYm9yYXRvcnMgb3V0c2lkZSBTdG9yZSAoZS5nLiBBdHRhY2htZW50TWFuYWdlcikuICovXG4gIHJlY29yZEFjdGl2aXR5KGl0ZW1JZDogc3RyaW5nIHwgbnVsbCwga2luZDogc3RyaW5nLCBvbGRWPzogdW5rbm93biwgbmV3Vj86IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLmxvZ0FjdGl2aXR5KGl0ZW1JZCwga2luZCwgbnVsbCwgb2xkViwgbmV3Vik7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdhY3Rpdml0eScsIGVudGl0eUlkOiBpdGVtSWQgPz8gJyonIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2dBY3Rpdml0eShpdGVtSWQ6IHN0cmluZyB8IG51bGwsIGtpbmQ6IHN0cmluZywgZmllbGQ/OiBzdHJpbmcgfCBudWxsLCBvbGRWPzogdW5rbm93biwgbmV3Vj86IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gYWN0aXZpdHkoaWQsIGl0ZW1faWQsIGFjdG9yX2lkLCBraW5kLCBmaWVsZCwgb2xkX3ZhbHVlLCBuZXdfdmFsdWUsIGF0KSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/KScpXG4gICAgICAucnVuKFxuICAgICAgICBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICBpdGVtSWQsXG4gICAgICAgIHRoaXMuYWN0b3JJZCxcbiAgICAgICAga2luZCxcbiAgICAgICAgZmllbGQgPz8gbnVsbCxcbiAgICAgICAgb2xkViA9PSBudWxsID8gbnVsbCA6IFN0cmluZyhvbGRWKS5zbGljZSgwLCA4MDAwKSxcbiAgICAgICAgbmV3ViA9PSBudWxsID8gbnVsbCA6IFN0cmluZyhuZXdWKS5zbGljZSgwLCA4MDAwKSxcbiAgICAgICAgdGhpcy5ub3coKSxcbiAgICAgICk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGl0ZW1zIC0tLS0tLS0tLS1cbiAgY3JlYXRlSXRlbShpbnB1dDogUGFydGlhbDxXb3JrSXRlbT4gJiB7IHR5cGU6IEl0ZW1UeXBlOyB0aXRsZTogc3RyaW5nIH0pOiBXb3JrSXRlbSB7XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIGNvbnN0IGlkID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICAgIGNvbnN0IGlkZW50ID0gdGhpcy5hbGxvY0lkZW50KGlucHV0LnR5cGUpO1xuICAgICAgY29uc3Qgbm93ID0gdGhpcy5ub3coKTtcbiAgICAgIGNvbnN0IHN0YXR1c2VzID0gc3RhdHVzZXNGb3JUeXBlKGlucHV0LnR5cGUpO1xuICAgICAgY29uc3QgaXRlbTogV29ya0l0ZW0gPSB7XG4gICAgICAgIGlkLFxuICAgICAgICBpZGVudCxcbiAgICAgICAgdHlwZTogaW5wdXQudHlwZSxcbiAgICAgICAgdGl0bGU6IGlucHV0LnRpdGxlLFxuICAgICAgICBib2R5OiBpbnB1dC5ib2R5ID8/ICcnLFxuICAgICAgICBib2R5VGV4dDogaW5wdXQuYm9keVRleHQgPz8gJycsXG4gICAgICAgIHN0YXR1czogaW5wdXQuc3RhdHVzICYmIHN0YXR1c2VzLmluY2x1ZGVzKGlucHV0LnN0YXR1cykgPyBpbnB1dC5zdGF0dXMgOiBzdGF0dXNlc1swXSxcbiAgICAgICAgcHJpb3JpdHk6IGlucHV0LnByaW9yaXR5ID8/ICdub25lJyxcbiAgICAgICAgb3duZXJJZDogaW5wdXQub3duZXJJZCA/PyBudWxsLFxuICAgICAgICByZXBvcnRlcklkOiBpbnB1dC5yZXBvcnRlcklkID8/IHRoaXMuYWN0b3JJZCxcbiAgICAgICAgbWlsZXN0b25lSWQ6IGlucHV0Lm1pbGVzdG9uZUlkID8/IG51bGwsXG4gICAgICAgIHJlbGVhc2VJZDogaW5wdXQucmVsZWFzZUlkID8/IG51bGwsXG4gICAgICAgIHBhcmVudElkOiBpbnB1dC5wYXJlbnRJZCA/PyBudWxsLFxuICAgICAgICBzdGFydERhdGU6IGlucHV0LnN0YXJ0RGF0ZSA/PyBudWxsLFxuICAgICAgICBkdWVEYXRlOiBpbnB1dC5kdWVEYXRlID8/IG51bGwsXG4gICAgICAgIGNvbXBsZXRlZEF0OiBudWxsLFxuICAgICAgICBlZmZvcnQ6IGlucHV0LmVmZm9ydCA/PyBudWxsLFxuICAgICAgICBjb25maWRlbmNlOiBpbnB1dC5jb25maWRlbmNlID8/IG51bGwsXG4gICAgICAgIHJpc2tMZXZlbDogaW5wdXQucmlza0xldmVsID8/IG51bGwsXG4gICAgICAgIGJ1c2luZXNzVmFsdWU6IGlucHV0LmJ1c2luZXNzVmFsdWUgPz8gbnVsbCxcbiAgICAgICAgbGVhZGVyc2hpcFZpc2libGU6IGlucHV0LmxlYWRlcnNoaXBWaXNpYmxlID8/IDAsXG4gICAgICAgIHByb2dyZXNzOiBpbnB1dC5wcm9ncmVzcyA/PyBudWxsLFxuICAgICAgICB0YWdzOiBpbnB1dC50YWdzID8/IFtdLFxuICAgICAgICBleHRyYTogaW5wdXQuZXh0cmEgPz8ge30sXG4gICAgICAgIGFyY2hpdmVkOiAwLFxuICAgICAgICBzYW1wbGU6IGlucHV0LnNhbXBsZSA/PyAwLFxuICAgICAgICBjcmVhdGVkQXQ6IG5vdyxcbiAgICAgICAgdXBkYXRlZEF0OiBub3csXG4gICAgICAgIGNyZWF0ZWRCeTogdGhpcy5hY3RvcklkLFxuICAgICAgICB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCxcbiAgICAgIH07XG4gICAgICB0aGlzLmluc2VydEl0ZW1Sb3coaXRlbSk7XG4gICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdpdGVtJywgaWQsIHRoaXMuaXRlbVRvUmVjb3JkKGl0ZW0pKTtcbiAgICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsICdjcmVhdGVkJywgbnVsbCwgbnVsbCwgaXRlbS50aXRsZSk7XG4gICAgICByZXR1cm4gaXRlbTtcbiAgICB9KTtcbiAgICBjb25zdCBpdGVtID0gdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaXRlbS5pZCB9KTtcbiAgICByZXR1cm4gaXRlbTtcbiAgfVxuXG4gIHByaXZhdGUgaXRlbVRvUmVjb3JkKGl0ZW06IFdvcmtJdGVtKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICAgIHJldHVybiB7IC4uLml0ZW0sIHRhZ3M6IGl0ZW0udGFncywgZXh0cmE6IGl0ZW0uZXh0cmEgfTtcbiAgfVxuXG4gIHByaXZhdGUgaW5zZXJ0SXRlbVJvdyhpOiBXb3JrSXRlbSk6IHZvaWQge1xuICAgIHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKFxuICAgICAgICBgSU5TRVJUIElOVE8gaXRlbXMoaWQsIGlkZW50LCB0eXBlLCB0aXRsZSwgYm9keSwgYm9keV90ZXh0LCBzdGF0dXMsIHByaW9yaXR5LCBvd25lcl9pZCwgcmVwb3J0ZXJfaWQsXG4gICAgICAgICAgbWlsZXN0b25lX2lkLCByZWxlYXNlX2lkLCBwYXJlbnRfaWQsIHN0YXJ0X2RhdGUsIGR1ZV9kYXRlLCBjb21wbGV0ZWRfYXQsIGVmZm9ydCwgY29uZmlkZW5jZSxcbiAgICAgICAgICByaXNrX2xldmVsLCBidXNpbmVzc192YWx1ZSwgbGVhZGVyc2hpcF92aXNpYmxlLCBwcm9ncmVzcywgdGFncywgZXh0cmEsIGFyY2hpdmVkLCBzYW1wbGUsIGRlbGV0ZWQsXG4gICAgICAgICAgY3JlYXRlZF9hdCwgdXBkYXRlZF9hdCwgY3JlYXRlZF9ieSwgdXBkYXRlZF9ieSlcbiAgICAgICAgIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sMCw/LD8sPyw/KWAsXG4gICAgICApXG4gICAgICAucnVuKFxuICAgICAgICBpLmlkLCBpLmlkZW50LCBpLnR5cGUsIGkudGl0bGUsIGkuYm9keSwgaS5ib2R5VGV4dCwgaS5zdGF0dXMsIGkucHJpb3JpdHksIGkub3duZXJJZCwgaS5yZXBvcnRlcklkLFxuICAgICAgICBpLm1pbGVzdG9uZUlkLCBpLnJlbGVhc2VJZCwgaS5wYXJlbnRJZCwgaS5zdGFydERhdGUsIGkuZHVlRGF0ZSwgaS5jb21wbGV0ZWRBdCwgaS5lZmZvcnQsIGkuY29uZmlkZW5jZSxcbiAgICAgICAgaS5yaXNrTGV2ZWwsIGkuYnVzaW5lc3NWYWx1ZSwgaS5sZWFkZXJzaGlwVmlzaWJsZSwgaS5wcm9ncmVzcywgSlNPTi5zdHJpbmdpZnkoaS50YWdzKSwgSlNPTi5zdHJpbmdpZnkoaS5leHRyYSksXG4gICAgICAgIGkuYXJjaGl2ZWQsIGkuc2FtcGxlLCBpLmNyZWF0ZWRBdCwgaS51cGRhdGVkQXQsIGkuY3JlYXRlZEJ5LCBpLnVwZGF0ZWRCeSxcbiAgICAgICk7XG4gIH1cblxuICB1cGRhdGVJdGVtKGlkOiBzdHJpbmcsIGZpZWxkczogUGFydGlhbDxXb3JrSXRlbT4pOiBXb3JrSXRlbSB8IG51bGwge1xuICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuZ2V0SXRlbShpZCk7XG4gICAgaWYgKCFiZWZvcmUpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IGNoYW5nZWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoZmllbGRzKSkge1xuICAgICAgaWYgKCEoayBpbiBJVEVNX0NPTFMpIHx8IGsgPT09ICdkZWxldGVkJykgY29udGludWU7XG4gICAgICBjb25zdCBwcmV2ID0gKGJlZm9yZSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrXTtcbiAgICAgIGNvbnN0IHNhbWUgPSBKU09OX0lURU1fRklFTERTLmhhcyhrKSA/IEpTT04uc3RyaW5naWZ5KHByZXYpID09PSBKU09OLnN0cmluZ2lmeSh2KSA6IHByZXYgPT09IHY7XG4gICAgICBpZiAoIXNhbWUpIGNoYW5nZWRba10gPSB2O1xuICAgIH1cbiAgICBpZiAoT2JqZWN0LmtleXMoY2hhbmdlZCkubGVuZ3RoID09PSAwKSByZXR1cm4gYmVmb3JlO1xuXG4gICAgLy8gU3RhdHVzIHRyYW5zaXRpb25zIG1haW50YWluIGNvbXBsZXRlZEF0IGF1dG9tYXRpY2FsbHkuXG4gICAgaWYgKCdzdGF0dXMnIGluIGNoYW5nZWQpIHtcbiAgICAgIGNvbnN0IHRlcm1pbmFsTm93ID0gVEVSTUlOQUxfU1RBVFVTRVMuaGFzKFN0cmluZyhjaGFuZ2VkLnN0YXR1cykpO1xuICAgICAgY29uc3QgdGVybWluYWxCZWZvcmUgPSBURVJNSU5BTF9TVEFUVVNFUy5oYXMoYmVmb3JlLnN0YXR1cyk7XG4gICAgICBpZiAodGVybWluYWxOb3cgJiYgIXRlcm1pbmFsQmVmb3JlKSBjaGFuZ2VkLmNvbXBsZXRlZEF0ID0gdGhpcy5ub3coKTtcbiAgICAgIGlmICghdGVybWluYWxOb3cgJiYgdGVybWluYWxCZWZvcmUpIGNoYW5nZWQuY29tcGxldGVkQXQgPSBudWxsO1xuICAgIH1cbiAgICBjaGFuZ2VkLnVwZGF0ZWRBdCA9IHRoaXMubm93KCk7XG4gICAgY2hhbmdlZC51cGRhdGVkQnkgPSB0aGlzLmFjdG9ySWQ7XG5cbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoaWQsIGNoYW5nZWQpO1xuICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGlkLCBjaGFuZ2VkKTtcbiAgICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKGNoYW5nZWQpKSB7XG4gICAgICAgIGlmIChrID09PSAndXBkYXRlZEF0JyB8fCBrID09PSAndXBkYXRlZEJ5JykgY29udGludWU7XG4gICAgICAgIGlmIChrID09PSAnYm9keScgfHwgayA9PT0gJ2JvZHlUZXh0JykgY29udGludWU7IC8vIGJvZHkgZWRpdHMgbG9nZ2VkIGFzIG9uZSAnZWRpdGVkJyBlbnRyeVxuICAgICAgICB0aGlzLmxvZ0FjdGl2aXR5KGlkLCAndXBkYXRlZCcsIGssIChiZWZvcmUgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba10sIEpTT05fSVRFTV9GSUVMRFMuaGFzKGspID8gSlNPTi5zdHJpbmdpZnkodikgOiB2KTtcbiAgICAgIH1cbiAgICAgIC8vIEJvZHkgZWRpdDogcmVjb3JkIG9sZC9uZXcgcGxhaW4gdGV4dCBzbyB0aGUgYWN0aXZpdHkgZGlmZiBjYW4gc2hvdyBiZWZvcmUvYWZ0ZXIuXG4gICAgICBpZiAoJ2JvZHknIGluIGNoYW5nZWQgfHwgJ2JvZHlUZXh0JyBpbiBjaGFuZ2VkKSB7XG4gICAgICAgIGNvbnN0IG5ld1RleHQgPSAnYm9keVRleHQnIGluIGNoYW5nZWQgPyBTdHJpbmcoY2hhbmdlZC5ib2R5VGV4dCA/PyAnJykgOiBiZWZvcmUuYm9keVRleHQ7XG4gICAgICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsICdlZGl0ZWQnLCAnYm9keScsIGJlZm9yZS5ib2R5VGV4dCwgbmV3VGV4dCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaWQgfSk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0SXRlbShpZCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5SXRlbUZpZWxkcyhpZDogc3RyaW5nLCBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3Qgc2V0czogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCB2YWxzOiB1bmtub3duW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XG4gICAgICBjb25zdCBjb2wgPSBJVEVNX0NPTFNba107XG4gICAgICBpZiAoIWNvbCkgY29udGludWU7XG4gICAgICBzZXRzLnB1c2goYCR7Y29sfT0/YCk7XG4gICAgICB2YWxzLnB1c2goSlNPTl9JVEVNX0ZJRUxEUy5oYXMoaykgPyBKU09OLnN0cmluZ2lmeSh2KSA6IHYpO1xuICAgIH1cbiAgICBpZiAoc2V0cy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICB2YWxzLnB1c2goaWQpO1xuICAgIHRoaXMuZGIucHJlcGFyZShgVVBEQVRFIGl0ZW1zIFNFVCAke3NldHMuam9pbignLCAnKX0gV0hFUkUgaWQ9P2ApLnJ1biguLi52YWxzKTtcbiAgfVxuXG4gIGFyY2hpdmVJdGVtKGlkOiBzdHJpbmcsIGFyY2hpdmVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgLy8gdXBkYXRlSXRlbSBhbHJlYWR5IHdyaXRlcyB0aGUgYWN0aXZpdHkgZW50cnkgZm9yIHRoZSBhcmNoaXZlZC1maWVsZCBjaGFuZ2UuXG4gICAgdGhpcy51cGRhdGVJdGVtKGlkLCB7IGFyY2hpdmVkOiBhcmNoaXZlZCA/IDEgOiAwIH0gYXMgUGFydGlhbDxXb3JrSXRlbT4pO1xuICB9XG5cbiAgZGVsZXRlSXRlbShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3Qgc3RhbXAgPSB0aGlzLm5vdygpO1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBpdGVtcyBTRVQgZGVsZXRlZD0xLCBkZWxldGVkX2F0PT8sIGRlbGV0ZWRfYnk9PywgdXBkYXRlZF9hdD0/LCB1cGRhdGVkX2J5PT8gV0hFUkUgaWQ9PycpXG4gICAgICAgIC5ydW4oc3RhbXAsIHRoaXMuYWN0b3JJZCwgc3RhbXAsIHRoaXMuYWN0b3JJZCwgaWQpO1xuICAgICAgdGhpcy5sb2NhbE9wKCdpdGVtJywgaWQsICdkZWxldGUnLCB7fSk7XG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KGlkLCAnZGVsZXRlZCcpO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdpdGVtJywgZW50aXR5SWQ6IGlkIH0pO1xuICB9XG5cbiAgZ2V0SXRlbShpZDogc3RyaW5nKTogV29ya0l0ZW0gfCBudWxsIHtcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gaXRlbXMgV0hFUkUgaWQ9PyBBTkQgZGVsZXRlZD0wJykuZ2V0KGlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gcm93ID8gcm93VG9JdGVtKHJvdykgOiBudWxsO1xuICB9XG5cbiAgZ2V0SXRlbUJ5SWRlbnQoaWRlbnQ6IHN0cmluZyk6IFdvcmtJdGVtIHwgbnVsbCB7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIGl0ZW1zIFdIRVJFIGlkZW50PT8gQ09MTEFURSBOT0NBU0UgQU5EIGRlbGV0ZWQ9MCcpLmdldChpZGVudCkgYXNcbiAgICAgIHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICAgIHwgdW5kZWZpbmVkO1xuICAgIHJldHVybiByb3cgPyByb3dUb0l0ZW0ocm93KSA6IG51bGw7XG4gIH1cblxuICBsaXN0SXRlbXMoZmlsdGVyOiBJdGVtRmlsdGVyID0ge30sIHNvcnQ6IEl0ZW1Tb3J0ID0geyBmaWVsZDogJ3VwZGF0ZWRBdCcsIGRpcjogJ2Rlc2MnIH0sIGxpbWl0ID0gNTAwLCBvZmZzZXQgPSAwKTogV29ya0l0ZW1bXSB7XG4gICAgY29uc3Qgd2hlcmU6IHN0cmluZ1tdID0gWydkZWxldGVkPTAnXTtcbiAgICBjb25zdCB2YWxzOiB1bmtub3duW10gPSBbXTtcbiAgICBpZiAoZmlsdGVyLmFyY2hpdmVkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHdoZXJlLnB1c2goJ2FyY2hpdmVkPT8nKTtcbiAgICAgIHZhbHMucHVzaChmaWx0ZXIuYXJjaGl2ZWQgPyAxIDogMCk7XG4gICAgfSBlbHNlIHdoZXJlLnB1c2goJ2FyY2hpdmVkPTAnKTtcbiAgICBpZiAoZmlsdGVyLnR5cGVzPy5sZW5ndGgpIHtcbiAgICAgIHdoZXJlLnB1c2goYHR5cGUgSU4gKCR7ZmlsdGVyLnR5cGVzLm1hcCgoKSA9PiAnPycpLmpvaW4oJywnKX0pYCk7XG4gICAgICB2YWxzLnB1c2goLi4uZmlsdGVyLnR5cGVzKTtcbiAgICB9XG4gICAgaWYgKGZpbHRlci5zdGF0dXNlcz8ubGVuZ3RoKSB7XG4gICAgICB3aGVyZS5wdXNoKGBzdGF0dXMgSU4gKCR7ZmlsdGVyLnN0YXR1c2VzLm1hcCgoKSA9PiAnPycpLmpvaW4oJywnKX0pYCk7XG4gICAgICB2YWxzLnB1c2goLi4uZmlsdGVyLnN0YXR1c2VzKTtcbiAgICB9XG4gICAgaWYgKGZpbHRlci5wcmlvcml0aWVzPy5sZW5ndGgpIHtcbiAgICAgIHdoZXJlLnB1c2goYHByaW9yaXR5IElOICgke2ZpbHRlci5wcmlvcml0aWVzLm1hcCgoKSA9PiAnPycpLmpvaW4oJywnKX0pYCk7XG4gICAgICB2YWxzLnB1c2goLi4uZmlsdGVyLnByaW9yaXRpZXMpO1xuICAgIH1cbiAgICBpZiAoZmlsdGVyLm93bmVySWRzPy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG5vbk51bGwgPSBmaWx0ZXIub3duZXJJZHMuZmlsdGVyKChvKSA9PiBvICE9PSBudWxsKTtcbiAgICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgaWYgKG5vbk51bGwubGVuZ3RoKSB7XG4gICAgICAgIHBhcnRzLnB1c2goYG93bmVyX2lkIElOICgke25vbk51bGwubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcbiAgICAgICAgdmFscy5wdXNoKC4uLm5vbk51bGwpO1xuICAgICAgfVxuICAgICAgaWYgKGZpbHRlci5vd25lcklkcy5pbmNsdWRlcyhudWxsKSkgcGFydHMucHVzaCgnb3duZXJfaWQgSVMgTlVMTCcpO1xuICAgICAgd2hlcmUucHVzaChgKCR7cGFydHMuam9pbignIE9SICcpfSlgKTtcbiAgICB9XG4gICAgaWYgKGZpbHRlci5taWxlc3RvbmVJZCkgeyB3aGVyZS5wdXNoKCdtaWxlc3RvbmVfaWQ9PycpOyB2YWxzLnB1c2goZmlsdGVyLm1pbGVzdG9uZUlkKTsgfVxuICAgIGlmIChmaWx0ZXIucmVsZWFzZUlkKSB7IHdoZXJlLnB1c2goJ3JlbGVhc2VfaWQ9PycpOyB2YWxzLnB1c2goZmlsdGVyLnJlbGVhc2VJZCk7IH1cbiAgICBpZiAoZmlsdGVyLnBhcmVudElkKSB7IHdoZXJlLnB1c2goJ3BhcmVudF9pZD0/Jyk7IHZhbHMucHVzaChmaWx0ZXIucGFyZW50SWQpOyB9XG4gICAgaWYgKGZpbHRlci50YWcpIHsgd2hlcmUucHVzaChcInRhZ3MgTElLRSA/XCIpOyB2YWxzLnB1c2goYCUke0pTT04uc3RyaW5naWZ5KGZpbHRlci50YWcpfSVgKTsgfVxuICAgIGlmIChmaWx0ZXIub3ZlcmR1ZSkgeyB3aGVyZS5wdXNoKFwiZHVlX2RhdGUgSVMgTk9UIE5VTEwgQU5EIGR1ZV9kYXRlIDwgZGF0ZSgnbm93JykgQU5EIGNvbXBsZXRlZF9hdCBJUyBOVUxMXCIpOyB9XG4gICAgaWYgKGZpbHRlci5kdWVXaXRoaW5EYXlzICE9IG51bGwpIHtcbiAgICAgIHdoZXJlLnB1c2goXCJkdWVfZGF0ZSBJUyBOT1QgTlVMTCBBTkQgZHVlX2RhdGUgPD0gZGF0ZSgnbm93JywgPykgQU5EIGNvbXBsZXRlZF9hdCBJUyBOVUxMXCIpO1xuICAgICAgdmFscy5wdXNoKGArJHtmaWx0ZXIuZHVlV2l0aGluRGF5c30gZGF5c2ApO1xuICAgIH1cbiAgICBpZiAoZmlsdGVyLmxlYWRlcnNoaXBWaXNpYmxlKSB3aGVyZS5wdXNoKCdsZWFkZXJzaGlwX3Zpc2libGU9MScpO1xuICAgIGlmIChmaWx0ZXIudXBkYXRlZFNpbmNlKSB7IHdoZXJlLnB1c2goJ3VwZGF0ZWRfYXQgPj0gPycpOyB2YWxzLnB1c2goZmlsdGVyLnVwZGF0ZWRTaW5jZSk7IH1cbiAgICBpZiAoZmlsdGVyLnNhbXBsZSAhPT0gdW5kZWZpbmVkKSB7IHdoZXJlLnB1c2goJ3NhbXBsZT0/Jyk7IHZhbHMucHVzaChmaWx0ZXIuc2FtcGxlID8gMSA6IDApOyB9XG4gICAgaWYgKGZpbHRlci50ZXh0KSB7XG4gICAgICB3aGVyZS5wdXNoKCdyb3dpZCBJTiAoU0VMRUNUIHJvd2lkIEZST00gaXRlbXNfZnRzIFdIRVJFIGl0ZW1zX2Z0cyBNQVRDSCA/KScpO1xuICAgICAgdmFscy5wdXNoKGZ0c1F1ZXJ5KGZpbHRlci50ZXh0KSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc29ydENvbDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgIGlkZW50OiAnaWRlbnQnLFxuICAgICAgdGl0bGU6ICd0aXRsZSBDT0xMQVRFIE5PQ0FTRScsXG4gICAgICBzdGF0dXM6ICdzdGF0dXMnLFxuICAgICAgcHJpb3JpdHk6IFwiQ0FTRSBwcmlvcml0eSBXSEVOICd1cmdlbnQnIFRIRU4gMCBXSEVOICdoaWdoJyBUSEVOIDEgV0hFTiAnbWVkaXVtJyBUSEVOIDIgV0hFTiAnbG93JyBUSEVOIDMgRUxTRSA0IEVORFwiLFxuICAgICAgZHVlRGF0ZTogJ2R1ZV9kYXRlIElTIE5VTEwsIGR1ZV9kYXRlJyxcbiAgICAgIGNyZWF0ZWRBdDogJ2NyZWF0ZWRfYXQnLFxuICAgICAgdXBkYXRlZEF0OiAndXBkYXRlZF9hdCcsXG4gICAgICBtYW51YWw6ICd1cGRhdGVkX2F0JyxcbiAgICB9O1xuICAgIGNvbnN0IG9yZGVyID0gYCR7c29ydENvbFtzb3J0LmZpZWxkXSA/PyAndXBkYXRlZF9hdCd9ICR7c29ydC5kaXIgPT09ICdhc2MnID8gJ0FTQycgOiAnREVTQyd9YDtcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxuICAgICAgLnByZXBhcmUoYFNFTEVDVCAqIEZST00gaXRlbXMgV0hFUkUgJHt3aGVyZS5qb2luKCcgQU5EICcpfSBPUkRFUiBCWSAke29yZGVyfSBMSU1JVCA/IE9GRlNFVCA/YClcbiAgICAgIC5hbGwoLi4udmFscywgbGltaXQsIG9mZnNldCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICByZXR1cm4gcm93cy5tYXAocm93VG9JdGVtKTtcbiAgfVxuXG4gIHNlYXJjaCh0ZXh0OiBzdHJpbmcsIGxpbWl0ID0gMzApOiBTZWFyY2hSZXN1bHRbXSB7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXG4gICAgICAucHJlcGFyZShcbiAgICAgICAgYFNFTEVDVCBpdGVtcy4qLCBzbmlwcGV0KGl0ZW1zX2Z0cywgMiwgJzw8JywgJz4+JywgJ1x1MjAyNicsIDEyKSBBUyBzbmlwLCByYW5rIEFTIHNjb3JlXG4gICAgICAgICBGUk9NIGl0ZW1zX2Z0cyBKT0lOIGl0ZW1zIE9OIGl0ZW1zLnJvd2lkID0gaXRlbXNfZnRzLnJvd2lkXG4gICAgICAgICBXSEVSRSBpdGVtc19mdHMgTUFUQ0ggPyBBTkQgaXRlbXMuZGVsZXRlZD0wIEFORCBpdGVtcy5hcmNoaXZlZD0wXG4gICAgICAgICBPUkRFUiBCWSByYW5rIExJTUlUID9gLFxuICAgICAgKVxuICAgICAgLmFsbChmdHNRdWVyeSh0ZXh0KSwgbGltaXQpIGFzIChSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiAmIHsgc25pcDogc3RyaW5nOyBzY29yZTogbnVtYmVyIH0pW107XG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoeyBpdGVtOiByb3dUb0l0ZW0ociksIHNuaXBwZXQ6IHIuc25pcCwgc2NvcmU6IHIuc2NvcmUgfSkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBsaW5rcyAtLS0tLS0tLS0tXG4gIGFkZExpbmsoZnJvbUlkOiBzdHJpbmcsIHRvSWQ6IHN0cmluZywga2luZDogTGlua0tpbmQpOiBJdGVtTGluayB8IG51bGwge1xuICAgIGlmIChmcm9tSWQgPT09IHRvSWQpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gbGlua3MgV0hFUkUgZnJvbV9pZD0/IEFORCB0b19pZD0/IEFORCBraW5kPT8nKVxuICAgICAgLmdldChmcm9tSWQsIHRvSWQsIGtpbmQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICAgIGlmIChleGlzdGluZyAmJiAhZXhpc3RpbmcuZGVsZXRlZCkgcmV0dXJuIHJvd1RvTGluayhleGlzdGluZyk7XG4gICAgY29uc3QgbGluazogSXRlbUxpbmsgPSB7XG4gICAgICBpZDogZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuaWQpIDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgIGZyb21JZCxcbiAgICAgIHRvSWQsXG4gICAgICBraW5kLFxuICAgICAgY3JlYXRlZEF0OiB0aGlzLm5vdygpLFxuICAgICAgY3JlYXRlZEJ5OiB0aGlzLmFjdG9ySWQsXG4gICAgfTtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGxpbmtzIFNFVCBkZWxldGVkPTAgV0hFUkUgaWQ9PycpLnJ1bihsaW5rLmlkKTtcbiAgICAgICAgdGhpcy5sb2NhbFNldCgnbGluaycsIGxpbmsuaWQsIHsgZGVsZXRlZDogMCB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gbGlua3MoaWQsIGZyb21faWQsIHRvX2lkLCBraW5kLCBkZWxldGVkLCBjcmVhdGVkX2F0LCBjcmVhdGVkX2J5KSBWQUxVRVMoPyw/LD8sPywwLD8sPyknKVxuICAgICAgICAgIC5ydW4obGluay5pZCwgZnJvbUlkLCB0b0lkLCBraW5kLCBsaW5rLmNyZWF0ZWRBdCwgbGluay5jcmVhdGVkQnkpO1xuICAgICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdsaW5rJywgbGluay5pZCwgeyAuLi5saW5rIH0pO1xuICAgICAgfVxuICAgICAgdGhpcy5sb2dBY3Rpdml0eShmcm9tSWQsICdsaW5rJywga2luZCwgbnVsbCwgdG9JZCk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2xpbmsnLCBlbnRpdHlJZDogbGluay5pZCB9KTtcbiAgICByZXR1cm4gbGluaztcbiAgfVxuXG4gIHJlbW92ZUxpbmsoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGZyb21faWQsIGtpbmQsIHRvX2lkIEZST00gbGlua3MgV0hFUkUgaWQ9PycpLmdldChpZCkgYXNcbiAgICAgIHwgeyBmcm9tX2lkOiBzdHJpbmc7IGtpbmQ6IHN0cmluZzsgdG9faWQ6IHN0cmluZyB9XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgbGlua3MgU0VUIGRlbGV0ZWQ9MSBXSEVSRSBpZD0/JykucnVuKGlkKTtcbiAgICAgIHRoaXMubG9jYWxTZXQoJ2xpbmsnLCBpZCwgeyBkZWxldGVkOiAxIH0pO1xuICAgICAgaWYgKHJvdykgdGhpcy5sb2dBY3Rpdml0eShyb3cuZnJvbV9pZCwgJ3VubGluaycsIHJvdy5raW5kLCByb3cudG9faWQsIG51bGwpO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdsaW5rJywgZW50aXR5SWQ6IGlkIH0pO1xuICB9XG5cbiAgbGlua3NGb3IoaXRlbUlkOiBzdHJpbmcpOiB7IGxpbms6IEl0ZW1MaW5rOyBkaXJlY3Rpb246ICdvdXQnIHwgJ2luJzsgb3RoZXI6IFdvcmtJdGVtIH1bXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIGxpbmtzIFdIRVJFIChmcm9tX2lkPT8gT1IgdG9faWQ9PykgQU5EIGRlbGV0ZWQ9MCcpXG4gICAgICAuYWxsKGl0ZW1JZCwgaXRlbUlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIGNvbnN0IG91dDogeyBsaW5rOiBJdGVtTGluazsgZGlyZWN0aW9uOiAnb3V0JyB8ICdpbic7IG90aGVyOiBXb3JrSXRlbSB9W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHIgb2Ygcm93cykge1xuICAgICAgY29uc3QgbGluayA9IHJvd1RvTGluayhyKTtcbiAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGxpbmsuZnJvbUlkID09PSBpdGVtSWQgPyAnb3V0JyA6ICdpbic7XG4gICAgICBjb25zdCBvdGhlciA9IHRoaXMuZ2V0SXRlbShkaXJlY3Rpb24gPT09ICdvdXQnID8gbGluay50b0lkIDogbGluay5mcm9tSWQpO1xuICAgICAgaWYgKG90aGVyKSBvdXQucHVzaCh7IGxpbmssIGRpcmVjdGlvbiwgb3RoZXIgfSk7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGNvbW1lbnRzIC0tLS0tLS0tLS1cbiAgYWRkQ29tbWVudChpdGVtSWQ6IHN0cmluZywgYm9keTogc3RyaW5nLCBib2R5VGV4dDogc3RyaW5nKTogQ29tbWVudCB7XG4gICAgY29uc3QgYzogQ29tbWVudCA9IHtcbiAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgaXRlbUlkLFxuICAgICAgYXV0aG9ySWQ6IHRoaXMuYWN0b3JJZCxcbiAgICAgIGJvZHksXG4gICAgICBib2R5VGV4dCxcbiAgICAgIGNyZWF0ZWRBdDogdGhpcy5ub3coKSxcbiAgICAgIHVwZGF0ZWRBdDogbnVsbCxcbiAgICAgIGRlbGV0ZWQ6IDAsXG4gICAgfTtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5kYlxuICAgICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gY29tbWVudHMoaWQsIGl0ZW1faWQsIGF1dGhvcl9pZCwgYm9keSwgYm9keV90ZXh0LCBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPywwKScpXG4gICAgICAgIC5ydW4oYy5pZCwgYy5pdGVtSWQsIGMuYXV0aG9ySWQsIGMuYm9keSwgYy5ib2R5VGV4dCwgYy5jcmVhdGVkQXQsIGMudXBkYXRlZEF0KTtcbiAgICAgIHRoaXMubG9jYWxDcmVhdGUoJ2NvbW1lbnQnLCBjLmlkLCB7IC4uLmMgfSk7XG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KGl0ZW1JZCwgJ2NvbW1lbnQnLCBudWxsLCBudWxsLCBib2R5VGV4dC5zbGljZSgwLCAyMDApKTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnY29tbWVudCcsIGVudGl0eUlkOiBjLmlkIH0pO1xuICAgIHJldHVybiBjO1xuICB9XG5cbiAgdXBkYXRlQ29tbWVudChpZDogc3RyaW5nLCBib2R5OiBzdHJpbmcsIGJvZHlUZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpdGVtX2lkIEZST00gY29tbWVudHMgV0hFUkUgaWQ9PycpLmdldChpZCkgYXMgeyBpdGVtX2lkOiBzdHJpbmcgfSB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCBmaWVsZHMgPSB7IGJvZHksIGJvZHlUZXh0LCB1cGRhdGVkQXQ6IHRoaXMubm93KCksIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH07XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGNvbW1lbnRzIFNFVCBib2R5PT8sIGJvZHlfdGV4dD0/LCB1cGRhdGVkX2F0PT8sIHVwZGF0ZWRfYnk9PyBXSEVSRSBpZD0/JylcbiAgICAgICAgLnJ1bihib2R5LCBib2R5VGV4dCwgZmllbGRzLnVwZGF0ZWRBdCwgZmllbGRzLnVwZGF0ZWRCeSwgaWQpO1xuICAgICAgdGhpcy5sb2NhbFNldCgnY29tbWVudCcsIGlkLCBmaWVsZHMpO1xuICAgICAgaWYgKHJvdykgdGhpcy5sb2dBY3Rpdml0eShyb3cuaXRlbV9pZCwgJ2NvbW1lbnRfZWRpdGVkJywgbnVsbCwgbnVsbCwgYm9keVRleHQuc2xpY2UoMCwgMjAwKSk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2NvbW1lbnQnLCBlbnRpdHlJZDogaWQgfSk7XG4gIH1cblxuICBkZWxldGVDb21tZW50KGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpdGVtX2lkLCBib2R5X3RleHQgRlJPTSBjb21tZW50cyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhc1xuICAgICAgfCB7IGl0ZW1faWQ6IHN0cmluZzsgYm9keV90ZXh0OiBzdHJpbmcgfVxuICAgICAgfCB1bmRlZmluZWQ7XG4gICAgY29uc3Qgc3RhbXAgPSB0aGlzLm5vdygpO1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBjb21tZW50cyBTRVQgZGVsZXRlZD0xLCBkZWxldGVkX2F0PT8sIGRlbGV0ZWRfYnk9PyBXSEVSRSBpZD0/JykucnVuKHN0YW1wLCB0aGlzLmFjdG9ySWQsIGlkKTtcbiAgICAgIHRoaXMubG9jYWxTZXQoJ2NvbW1lbnQnLCBpZCwgeyBkZWxldGVkOiAxLCBkZWxldGVkQXQ6IHN0YW1wLCBkZWxldGVkQnk6IHRoaXMuYWN0b3JJZCB9KTtcbiAgICAgIGlmIChyb3cpIHRoaXMubG9nQWN0aXZpdHkocm93Lml0ZW1faWQsICdjb21tZW50X2RlbGV0ZWQnLCBudWxsLCByb3cuYm9keV90ZXh0LnNsaWNlKDAsIDIwMCksIG51bGwpO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdjb21tZW50JywgZW50aXR5SWQ6IGlkIH0pO1xuICB9XG5cbiAgY29tbWVudHNGb3IoaXRlbUlkOiBzdHJpbmcpOiBDb21tZW50W10ge1xuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUICogRlJPTSBjb21tZW50cyBXSEVSRSBpdGVtX2lkPT8gQU5EIGRlbGV0ZWQ9MCBPUkRFUiBCWSBjcmVhdGVkX2F0IEFTQycpXG4gICAgICAuYWxsKGl0ZW1JZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7XG4gICAgICBpZDogU3RyaW5nKHIuaWQpLFxuICAgICAgaXRlbUlkOiBTdHJpbmcoci5pdGVtX2lkKSxcbiAgICAgIGF1dGhvcklkOiBTdHJpbmcoci5hdXRob3JfaWQpLFxuICAgICAgYm9keTogU3RyaW5nKHIuYm9keSksXG4gICAgICBib2R5VGV4dDogU3RyaW5nKHIuYm9keV90ZXh0KSxcbiAgICAgIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXG4gICAgICB1cGRhdGVkQXQ6IHIudXBkYXRlZF9hdCA/IFN0cmluZyhyLnVwZGF0ZWRfYXQpIDogbnVsbCxcbiAgICAgIGRlbGV0ZWQ6IDAsXG4gICAgfSkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSB2ZXJzaW9ucyAtLS0tLS0tLS0tXG4gIHNhdmVWZXJzaW9uKGl0ZW1JZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0SXRlbShpdGVtSWQpO1xuICAgIGlmICghaXRlbSkgcmV0dXJuO1xuICAgIGNvbnN0IGxhc3QgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBNQVgodmVyc2lvbikgQVMgdiBGUk9NIGl0ZW1fdmVyc2lvbnMgV0hFUkUgaXRlbV9pZD0/JykuZ2V0KGl0ZW1JZCkgYXMgeyB2OiBudW1iZXIgfCBudWxsIH07XG4gICAgdGhpcy5kYlxuICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIGl0ZW1fdmVyc2lvbnMoaWQsIGl0ZW1faWQsIHZlcnNpb24sIHRpdGxlLCBib2R5LCBzYXZlZF9ieSwgc2F2ZWRfYXQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/KScpXG4gICAgICAucnVuKGNyeXB0by5yYW5kb21VVUlEKCksIGl0ZW1JZCwgKGxhc3QudiA/PyAwKSArIDEsIGl0ZW0udGl0bGUsIGl0ZW0uYm9keSwgdGhpcy5hY3RvcklkLCB0aGlzLm5vdygpKTtcbiAgfVxuXG4gIHZlcnNpb25zRm9yKGl0ZW1JZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgaWQsIGl0ZW1faWQgQVMgaXRlbUlkLCB2ZXJzaW9uLCB0aXRsZSwgYm9keSwgc2F2ZWRfYnkgQVMgc2F2ZWRCeSwgc2F2ZWRfYXQgQVMgc2F2ZWRBdCBGUk9NIGl0ZW1fdmVyc2lvbnMgV0hFUkUgaXRlbV9pZD0/IE9SREVSIEJZIHZlcnNpb24gREVTQycpXG4gICAgICAuYWxsKGl0ZW1JZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIHVzZXJzIC0tLS0tLS0tLS1cbiAgdXBzZXJ0VXNlcih1OiB7IGlkOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgaW5pdGlhbHM6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9KTogVXNlciB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gdXNlcnMgV0hFUkUgaWQ9PycpLmdldCh1LmlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCB1c2VyOiBVc2VyID0ge1xuICAgICAgLi4udSxcbiAgICAgIGNyZWF0ZWRBdDogZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuY3JlYXRlZF9hdCkgOiB0aGlzLm5vdygpLFxuICAgIH07XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMuZGJcbiAgICAgICAgLnByZXBhcmUoXG4gICAgICAgICAgYElOU0VSVCBJTlRPIHVzZXJzKGlkLCBuYW1lLCBpbml0aWFscywgY29sb3IsIGNyZWF0ZWRfYXQpIFZBTFVFUyg/LD8sPyw/LD8pXG4gICAgICAgICAgIE9OIENPTkZMSUNUKGlkKSBETyBVUERBVEUgU0VUIG5hbWU9ZXhjbHVkZWQubmFtZSwgaW5pdGlhbHM9ZXhjbHVkZWQuaW5pdGlhbHMsIGNvbG9yPWV4Y2x1ZGVkLmNvbG9yYCxcbiAgICAgICAgKVxuICAgICAgICAucnVuKHVzZXIuaWQsIHVzZXIubmFtZSwgdXNlci5pbml0aWFscywgdXNlci5jb2xvciwgdXNlci5jcmVhdGVkQXQpO1xuICAgICAgaWYgKCFleGlzdGluZykgdGhpcy5sb2NhbENyZWF0ZSgndXNlcicsIHVzZXIuaWQsIHsgLi4udXNlciB9KTtcbiAgICAgIGVsc2UgdGhpcy5sb2NhbFNldCgndXNlcicsIHVzZXIuaWQsIHsgbmFtZTogdXNlci5uYW1lLCBpbml0aWFsczogdXNlci5pbml0aWFscywgY29sb3I6IHVzZXIuY29sb3IgfSk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICByZXR1cm4gdXNlcjtcbiAgfVxuXG4gIGxpc3RVc2VycygpOiBVc2VyW10ge1xuICAgIHJldHVybiAodGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaWQsIG5hbWUsIGluaXRpYWxzLCBjb2xvciwgY3JlYXRlZF9hdCBBUyBjcmVhdGVkQXQgRlJPTSB1c2VycycpLmFsbCgpIGFzIFVzZXJbXSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIG1pbGVzdG9uZXMgLyByZWxlYXNlcyAtLS0tLS0tLS0tXG4gIHVwc2VydE1pbGVzdG9uZShtOiBQYXJ0aWFsPE1pbGVzdG9uZT4gJiB7IG5hbWU6IHN0cmluZyB9KTogTWlsZXN0b25lIHtcbiAgICBjb25zdCBpZCA9IG0uaWQgPz8gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBtaWxlc3RvbmVzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IG5vdyA9IHRoaXMubm93KCk7XG4gICAgY29uc3QgY3JlYXRlZEF0ID0gZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuY3JlYXRlZF9hdCB8fCBub3cpIDogbm93O1xuICAgIGNvbnN0IGNyZWF0ZWRCeSA9IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmNyZWF0ZWRfYnkgfHwgdGhpcy5hY3RvcklkKSA6IHRoaXMuYWN0b3JJZDtcbiAgICBjb25zdCByZWM6IE1pbGVzdG9uZSA9IHtcbiAgICAgIGlkLFxuICAgICAgbmFtZTogbS5uYW1lLFxuICAgICAgZGVzY3JpcHRpb246IG0uZGVzY3JpcHRpb24gPz8gKGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmRlc2NyaXB0aW9uKSA6ICcnKSxcbiAgICAgIHRhcmdldERhdGU6IG0udGFyZ2V0RGF0ZSA/PyAoZXhpc3RpbmcgPyAoZXhpc3RpbmcudGFyZ2V0X2RhdGUgYXMgc3RyaW5nIHwgbnVsbCkgOiBudWxsKSxcbiAgICAgIHN0YXR1czogKG0uc3RhdHVzID8/IChleGlzdGluZyA/IGV4aXN0aW5nLnN0YXR1cyA6ICdwbGFubmVkJykpIGFzIE1pbGVzdG9uZVsnc3RhdHVzJ10sXG4gICAgICBzb3J0OiBtLnNvcnQgPz8gKGV4aXN0aW5nID8gTnVtYmVyKGV4aXN0aW5nLnNvcnQpIDogMCksXG4gICAgICBzYW1wbGU6IG0uc2FtcGxlID8/IChleGlzdGluZyA/IChOdW1iZXIoZXhpc3Rpbmcuc2FtcGxlKSBhcyAwIHwgMSkgOiAwKSxcbiAgICAgIGNyZWF0ZWRBdCwgY3JlYXRlZEJ5LCB1cGRhdGVkQXQ6IG5vdywgdXBkYXRlZEJ5OiB0aGlzLmFjdG9ySWQsXG4gICAgfTtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5kYlxuICAgICAgICAucHJlcGFyZShcbiAgICAgICAgICBgSU5TRVJUIElOVE8gbWlsZXN0b25lcyhpZCwgbmFtZSwgZGVzY3JpcHRpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIHNvcnQsIHNhbXBsZSwgZGVsZXRlZCwgY3JlYXRlZF9hdCwgY3JlYXRlZF9ieSwgdXBkYXRlZF9hdCwgdXBkYXRlZF9ieSlcbiAgICAgICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPywwLD8sPyw/LD8pXG4gICAgICAgICAgIE9OIENPTkZMSUNUKGlkKSBETyBVUERBVEUgU0VUIG5hbWU9PywgZGVzY3JpcHRpb249PywgdGFyZ2V0X2RhdGU9Pywgc3RhdHVzPT8sIHNvcnQ9PywgZGVsZXRlZD0wLCB1cGRhdGVkX2F0PT8sIHVwZGF0ZWRfYnk9P2AsXG4gICAgICAgIClcbiAgICAgICAgLnJ1bihyZWMuaWQsIHJlYy5uYW1lLCByZWMuZGVzY3JpcHRpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuc29ydCwgcmVjLnNhbXBsZSwgY3JlYXRlZEF0LCBjcmVhdGVkQnksIG5vdywgdGhpcy5hY3RvcklkLFxuICAgICAgICAgICAgIHJlYy5uYW1lLCByZWMuZGVzY3JpcHRpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuc29ydCwgbm93LCB0aGlzLmFjdG9ySWQpO1xuICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdtaWxlc3RvbmUnLCBpZCwgeyAuLi5yZWMgfSk7XG4gICAgICAgIHRoaXMubG9nQWN0aXZpdHkobnVsbCwgJ21pbGVzdG9uZV9jcmVhdGVkJywgJ21pbGVzdG9uZScsIG51bGwsIHJlYy5uYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ21pbGVzdG9uZScsIGlkLCB7IG5hbWU6IHJlYy5uYW1lLCBkZXNjcmlwdGlvbjogcmVjLmRlc2NyaXB0aW9uLCB0YXJnZXREYXRlOiByZWMudGFyZ2V0RGF0ZSwgc3RhdHVzOiByZWMuc3RhdHVzLCBzb3J0OiByZWMuc29ydCwgdXBkYXRlZEF0OiBub3csIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH0pO1xuICAgICAgICB0aGlzLmxvZ0FjdGl2aXR5KG51bGwsICdtaWxlc3RvbmVfdXBkYXRlZCcsICdtaWxlc3RvbmUnLCBTdHJpbmcoZXhpc3RpbmcubmFtZSksIHJlYy5uYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnbWlsZXN0b25lJywgZW50aXR5SWQ6IGlkIH0pO1xuICAgIHJldHVybiByZWM7XG4gIH1cblxuICBsaXN0TWlsZXN0b25lcygpOiBNaWxlc3RvbmVbXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBtaWxlc3RvbmVzIFdIRVJFIGRlbGV0ZWQ9MCBPUkRFUiBCWSBzb3J0LCB0YXJnZXRfZGF0ZScpLmFsbCgpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xuICAgICAgaWQ6IFN0cmluZyhyLmlkKSwgbmFtZTogU3RyaW5nKHIubmFtZSksIGRlc2NyaXB0aW9uOiBTdHJpbmcoci5kZXNjcmlwdGlvbiksXG4gICAgICB0YXJnZXREYXRlOiByLnRhcmdldF9kYXRlID8gU3RyaW5nKHIudGFyZ2V0X2RhdGUpIDogbnVsbCxcbiAgICAgIHN0YXR1czogci5zdGF0dXMgYXMgTWlsZXN0b25lWydzdGF0dXMnXSwgc29ydDogTnVtYmVyKHIuc29ydCksIHNhbXBsZTogTnVtYmVyKHIuc2FtcGxlKSBhcyAwIHwgMSxcbiAgICAgIGNyZWF0ZWRBdDogci5jcmVhdGVkX2F0ID8gU3RyaW5nKHIuY3JlYXRlZF9hdCkgOiAnJywgY3JlYXRlZEJ5OiByLmNyZWF0ZWRfYnkgPyBTdHJpbmcoci5jcmVhdGVkX2J5KSA6ICcnLFxuICAgICAgdXBkYXRlZEF0OiByLnVwZGF0ZWRfYXQgPyBTdHJpbmcoci51cGRhdGVkX2F0KSA6ICcnLCB1cGRhdGVkQnk6IHIudXBkYXRlZF9ieSA/IFN0cmluZyhyLnVwZGF0ZWRfYnkpIDogJycsXG4gICAgfSkpO1xuICB9XG5cbiAgdXBzZXJ0UmVsZWFzZShtOiBQYXJ0aWFsPFJlbGVhc2U+ICYgeyBuYW1lOiBzdHJpbmcgfSk6IFJlbGVhc2Uge1xuICAgIGNvbnN0IGlkID0gbS5pZCA/PyBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHJlbGVhc2VzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IG5vdyA9IHRoaXMubm93KCk7XG4gICAgY29uc3QgY3JlYXRlZEF0ID0gZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcuY3JlYXRlZF9hdCB8fCBub3cpIDogbm93O1xuICAgIGNvbnN0IGNyZWF0ZWRCeSA9IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmNyZWF0ZWRfYnkgfHwgdGhpcy5hY3RvcklkKSA6IHRoaXMuYWN0b3JJZDtcbiAgICBjb25zdCByZWM6IFJlbGVhc2UgPSB7XG4gICAgICBpZCxcbiAgICAgIG5hbWU6IG0ubmFtZSxcbiAgICAgIHZlcnNpb246IG0udmVyc2lvbiA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcudmVyc2lvbikgOiAnJyksXG4gICAgICB0YXJnZXREYXRlOiBtLnRhcmdldERhdGUgPz8gKGV4aXN0aW5nID8gKGV4aXN0aW5nLnRhcmdldF9kYXRlIGFzIHN0cmluZyB8IG51bGwpIDogbnVsbCksXG4gICAgICBzdGF0dXM6IChtLnN0YXR1cyA/PyAoZXhpc3RpbmcgPyBleGlzdGluZy5zdGF0dXMgOiAncGxhbm5lZCcpKSBhcyBSZWxlYXNlWydzdGF0dXMnXSxcbiAgICAgIGdvYWxzOiBtLmdvYWxzID8/IChleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5nb2FscykgOiAnJyksXG4gICAgICBub3RlczogbS5ub3RlcyA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3Rpbmcubm90ZXMpIDogJycpLFxuICAgICAgc2FtcGxlOiBtLnNhbXBsZSA/PyAoZXhpc3RpbmcgPyAoTnVtYmVyKGV4aXN0aW5nLnNhbXBsZSkgYXMgMCB8IDEpIDogMCksXG4gICAgICBjcmVhdGVkQXQsIGNyZWF0ZWRCeSwgdXBkYXRlZEF0OiBub3csIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkLFxuICAgIH07XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMuZGJcbiAgICAgICAgLnByZXBhcmUoXG4gICAgICAgICAgYElOU0VSVCBJTlRPIHJlbGVhc2VzKGlkLCBuYW1lLCB2ZXJzaW9uLCB0YXJnZXRfZGF0ZSwgc3RhdHVzLCBnb2Fscywgbm90ZXMsIHNhbXBsZSwgZGVsZXRlZCwgY3JlYXRlZF9hdCwgY3JlYXRlZF9ieSwgdXBkYXRlZF9hdCwgdXBkYXRlZF9ieSlcbiAgICAgICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LDAsPyw/LD8sPylcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCB2ZXJzaW9uPT8sIHRhcmdldF9kYXRlPT8sIHN0YXR1cz0/LCBnb2Fscz0/LCBub3Rlcz0/LCBkZWxldGVkPTAsIHVwZGF0ZWRfYXQ9PywgdXBkYXRlZF9ieT0/YCxcbiAgICAgICAgKVxuICAgICAgICAucnVuKHJlYy5pZCwgcmVjLm5hbWUsIHJlYy52ZXJzaW9uLCByZWMudGFyZ2V0RGF0ZSwgcmVjLnN0YXR1cywgcmVjLmdvYWxzLCByZWMubm90ZXMsIHJlYy5zYW1wbGUsIGNyZWF0ZWRBdCwgY3JlYXRlZEJ5LCBub3csIHRoaXMuYWN0b3JJZCxcbiAgICAgICAgICAgICByZWMubmFtZSwgcmVjLnZlcnNpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuZ29hbHMsIHJlYy5ub3Rlcywgbm93LCB0aGlzLmFjdG9ySWQpO1xuICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdyZWxlYXNlJywgaWQsIHsgLi4ucmVjIH0pO1xuICAgICAgICB0aGlzLmxvZ0FjdGl2aXR5KG51bGwsICdyZWxlYXNlX2NyZWF0ZWQnLCAncmVsZWFzZScsIG51bGwsIHJlYy5uYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ3JlbGVhc2UnLCBpZCwgeyBuYW1lOiByZWMubmFtZSwgdmVyc2lvbjogcmVjLnZlcnNpb24sIHRhcmdldERhdGU6IHJlYy50YXJnZXREYXRlLCBzdGF0dXM6IHJlYy5zdGF0dXMsIGdvYWxzOiByZWMuZ29hbHMsIG5vdGVzOiByZWMubm90ZXMsIHVwZGF0ZWRBdDogbm93LCB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCB9KTtcbiAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShudWxsLCAncmVsZWFzZV91cGRhdGVkJywgJ3JlbGVhc2UnLCBTdHJpbmcoZXhpc3RpbmcubmFtZSksIHJlYy5uYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAncmVsZWFzZScsIGVudGl0eUlkOiBpZCB9KTtcbiAgICByZXR1cm4gcmVjO1xuICB9XG5cbiAgbGlzdFJlbGVhc2VzKCk6IFJlbGVhc2VbXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSByZWxlYXNlcyBXSEVSRSBkZWxldGVkPTAgT1JERVIgQlkgdGFyZ2V0X2RhdGUnKS5hbGwoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcbiAgICAgIGlkOiBTdHJpbmcoci5pZCksIG5hbWU6IFN0cmluZyhyLm5hbWUpLCB2ZXJzaW9uOiBTdHJpbmcoci52ZXJzaW9uKSxcbiAgICAgIHRhcmdldERhdGU6IHIudGFyZ2V0X2RhdGUgPyBTdHJpbmcoci50YXJnZXRfZGF0ZSkgOiBudWxsLFxuICAgICAgc3RhdHVzOiByLnN0YXR1cyBhcyBSZWxlYXNlWydzdGF0dXMnXSwgZ29hbHM6IFN0cmluZyhyLmdvYWxzKSwgbm90ZXM6IFN0cmluZyhyLm5vdGVzKSxcbiAgICAgIHNhbXBsZTogTnVtYmVyKHIuc2FtcGxlKSBhcyAwIHwgMSxcbiAgICAgIGNyZWF0ZWRBdDogci5jcmVhdGVkX2F0ID8gU3RyaW5nKHIuY3JlYXRlZF9hdCkgOiAnJywgY3JlYXRlZEJ5OiByLmNyZWF0ZWRfYnkgPyBTdHJpbmcoci5jcmVhdGVkX2J5KSA6ICcnLFxuICAgICAgdXBkYXRlZEF0OiByLnVwZGF0ZWRfYXQgPyBTdHJpbmcoci51cGRhdGVkX2F0KSA6ICcnLCB1cGRhdGVkQnk6IHIudXBkYXRlZF9ieSA/IFN0cmluZyhyLnVwZGF0ZWRfYnkpIDogJycsXG4gICAgfSkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBzYXZlZCB2aWV3cyAtLS0tLS0tLS0tXG4gIHNhdmVWaWV3KHY6IFBhcnRpYWw8U2F2ZWRWaWV3PiAmIHsgbmFtZTogc3RyaW5nOyBjb25maWc6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0pOiBTYXZlZFZpZXcge1xuICAgIGNvbnN0IGlkID0gdi5pZCA/PyBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgIGNvbnN0IHJlYzogU2F2ZWRWaWV3ID0ge1xuICAgICAgaWQsIG5hbWU6IHYubmFtZSwgY29uZmlnOiB2LmNvbmZpZywgcGlubmVkOiB2LnBpbm5lZCA/PyAwLFxuICAgICAgY3JlYXRlZEJ5OiB0aGlzLmFjdG9ySWQsIGNyZWF0ZWRBdDogdGhpcy5ub3coKSxcbiAgICB9O1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIHNhdmVkX3ZpZXdzIFdIRVJFIGlkPT8nKS5nZXQoaWQpO1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiXG4gICAgICAgIC5wcmVwYXJlKFxuICAgICAgICAgIGBJTlNFUlQgSU5UTyBzYXZlZF92aWV3cyhpZCwgbmFtZSwgY29uZmlnLCBwaW5uZWQsIGNyZWF0ZWRfYnksIGNyZWF0ZWRfYXQsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPywwKVxuICAgICAgICAgICBPTiBDT05GTElDVChpZCkgRE8gVVBEQVRFIFNFVCBuYW1lPT8sIGNvbmZpZz0/LCBwaW5uZWQ9PywgZGVsZXRlZD0wYCxcbiAgICAgICAgKVxuICAgICAgICAucnVuKGlkLCByZWMubmFtZSwgSlNPTi5zdHJpbmdpZnkocmVjLmNvbmZpZyksIHJlYy5waW5uZWQsIHJlYy5jcmVhdGVkQnksIHJlYy5jcmVhdGVkQXQsXG4gICAgICAgICAgICAgcmVjLm5hbWUsIEpTT04uc3RyaW5naWZ5KHJlYy5jb25maWcpLCByZWMucGlubmVkKTtcbiAgICAgIGlmICghZXhpc3RpbmcpIHRoaXMubG9jYWxDcmVhdGUoJ3NhdmVkX3ZpZXcnLCBpZCwgeyAuLi5yZWMgfSk7XG4gICAgICBlbHNlIHRoaXMubG9jYWxTZXQoJ3NhdmVkX3ZpZXcnLCBpZCwgeyBuYW1lOiByZWMubmFtZSwgY29uZmlnOiByZWMuY29uZmlnLCBwaW5uZWQ6IHJlYy5waW5uZWQgfSk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICByZXR1cm4gcmVjO1xuICB9XG5cbiAgbGlzdFZpZXdzKCk6IFNhdmVkVmlld1tdIHtcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHNhdmVkX3ZpZXdzIFdIRVJFIGRlbGV0ZWQ9MCBPUkRFUiBCWSBwaW5uZWQgREVTQywgbmFtZScpLmFsbCgpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xuICAgICAgaWQ6IFN0cmluZyhyLmlkKSwgbmFtZTogU3RyaW5nKHIubmFtZSksXG4gICAgICBjb25maWc6IEpTT04ucGFyc2UoU3RyaW5nKHIuY29uZmlnKSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgICBwaW5uZWQ6IE51bWJlcihyLnBpbm5lZCkgYXMgMCB8IDEsIGNyZWF0ZWRCeTogU3RyaW5nKHIuY3JlYXRlZF9ieSksIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXG4gICAgfSkpO1xuICB9XG5cbiAgZGVsZXRlVmlldyhpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgbmFtZSBGUk9NIHNhdmVkX3ZpZXdzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIHsgbmFtZTogc3RyaW5nIH0gfCB1bmRlZmluZWQ7XG4gICAgY29uc3Qgc3RhbXAgPSB0aGlzLm5vdygpO1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBzYXZlZF92aWV3cyBTRVQgZGVsZXRlZD0xLCBkZWxldGVkX2F0PT8sIGRlbGV0ZWRfYnk9PyBXSEVSRSBpZD0/JykucnVuKHN0YW1wLCB0aGlzLmFjdG9ySWQsIGlkKTtcbiAgICAgIHRoaXMubG9jYWxTZXQoJ3NhdmVkX3ZpZXcnLCBpZCwgeyBkZWxldGVkOiAxLCBkZWxldGVkQXQ6IHN0YW1wLCBkZWxldGVkQnk6IHRoaXMuYWN0b3JJZCB9KTtcbiAgICAgIHRoaXMubG9nQWN0aXZpdHkobnVsbCwgJ3ZpZXdfZGVsZXRlZCcsICdzYXZlZF92aWV3Jywgcm93ID8gcm93Lm5hbWUgOiBudWxsLCBudWxsKTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBhY3Rpdml0eSAtLS0tLS0tLS0tXG4gIGFjdGl2aXR5Rm9yKGl0ZW1JZDogc3RyaW5nIHwgbnVsbCwgbGltaXQgPSAxMDApIHtcbiAgICBpZiAoaXRlbUlkKSB7XG4gICAgICByZXR1cm4gdGhpcy5kYlxuICAgICAgICAucHJlcGFyZSgnU0VMRUNUIGlkLCBpdGVtX2lkIEFTIGl0ZW1JZCwgYWN0b3JfaWQgQVMgYWN0b3JJZCwga2luZCwgZmllbGQsIG9sZF92YWx1ZSBBUyBvbGRWYWx1ZSwgbmV3X3ZhbHVlIEFTIG5ld1ZhbHVlLCBhdCBGUk9NIGFjdGl2aXR5IFdIRVJFIGl0ZW1faWQ9PyBPUkRFUiBCWSBhdCBERVNDIExJTUlUID8nKVxuICAgICAgICAuYWxsKGl0ZW1JZCwgbGltaXQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBpZCwgaXRlbV9pZCBBUyBpdGVtSWQsIGFjdG9yX2lkIEFTIGFjdG9ySWQsIGtpbmQsIGZpZWxkLCBvbGRfdmFsdWUgQVMgb2xkVmFsdWUsIG5ld192YWx1ZSBBUyBuZXdWYWx1ZSwgYXQgRlJPTSBhY3Rpdml0eSBPUkRFUiBCWSBhdCBERVNDIExJTUlUID8nKVxuICAgICAgLmFsbChsaW1pdCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIHJlbW90ZSBvcCBhcHBsaWNhdGlvbiAtLS0tLS0tLS0tXG4gIC8qKiBBcHBseSBhIGJhdGNoIG9mIHJlbW90ZSBvcHMgaW5zaWRlIG9uZSB0cmFuc2FjdGlvbi4gUmV0dXJucyBjb3VudCBhcHBsaWVkIChub24tZHVwbGljYXRlKS4gKi9cbiAgYXBwbHlSZW1vdGVPcHMob3BzOiBPcFtdKTogbnVtYmVyIHtcbiAgICBsZXQgYXBwbGllZCA9IDA7XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIGZvciAoY29uc3Qgb3Agb2Ygb3BzKSB7XG4gICAgICAgIGlmIChvcC5kZXZpY2VJZCA9PT0gdGhpcy5kZXZpY2VJZCkgY29udGludWU7IC8vIG91ciBvd24gb3BzIGVjaG9lZCBiYWNrXG4gICAgICAgIGNvbnN0IGR1cCA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIDEgRlJPTSBvcGxvZyBXSEVSRSBvcF9pZD0/JykuZ2V0KG9wLm9wSWQpO1xuICAgICAgICBpZiAoZHVwKSBjb250aW51ZTtcbiAgICAgICAgdGhpcy53aXRuZXNzTGFtcG9ydChvcC5sYW1wb3J0KTtcbiAgICAgICAgdGhpcy5hcHBlbmRPcChvcCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdGhpcy5hcHBseVJlbW90ZU9wKG9wKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgLy8gUXVhcmFudGluZSBhIHBvaXNvbiBvcCBpbnN0ZWFkIG9mIHdlZGdpbmcgdGhlIHdob2xlIGltcG9ydDogaXQgaXMgYWxyZWFkeVxuICAgICAgICAgIC8vIHJlY29yZGVkIGluIHRoZSBvcGxvZyAoc28gaXQgd29uJ3QgcmV0cnkgZm9yZXZlcikgYW5kIGxvZ2dlZCBmb3IgZGlhZ25vc2lzLlxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtzeW5jXSBmYWlsZWQgdG8gYXBwbHkgb3AgJHtvcC5vcElkfSAoJHtvcC5lbnRpdHl9LyR7b3AuYWN0aW9ufSk6YCwgZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBhcHBsaWVkKys7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICBpZiAoYXBwbGllZCA+IDApIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnKicsIGVudGl0eUlkOiAnKicgfSk7XG4gICAgcmV0dXJuIGFwcGxpZWQ7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UmVtb3RlT3Aob3A6IE9wKTogdm9pZCB7XG4gICAgc3dpdGNoIChvcC5hY3Rpb24pIHtcbiAgICAgIGNhc2UgJ2NyZWF0ZSc6XG4gICAgICAgIHRoaXMuYXBwbHlSZW1vdGVDcmVhdGUob3ApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3NldCc6XG4gICAgICAgIHRoaXMuYXBwbHlSZW1vdGVTZXQob3ApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2RlbGV0ZSc6XG4gICAgICAgIHRoaXMuYXBwbHlSZW1vdGVEZWxldGUob3ApO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHRhYmxlRm9yKGVudGl0eTogT3BbJ2VudGl0eSddKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKGVudGl0eSkge1xuICAgICAgY2FzZSAnaXRlbSc6IHJldHVybiAnaXRlbXMnO1xuICAgICAgY2FzZSAnbGluayc6IHJldHVybiAnbGlua3MnO1xuICAgICAgY2FzZSAnY29tbWVudCc6IHJldHVybiAnY29tbWVudHMnO1xuICAgICAgY2FzZSAnbWlsZXN0b25lJzogcmV0dXJuICdtaWxlc3RvbmVzJztcbiAgICAgIGNhc2UgJ3JlbGVhc2UnOiByZXR1cm4gJ3JlbGVhc2VzJztcbiAgICAgIGNhc2UgJ3VzZXInOiByZXR1cm4gJ3VzZXJzJztcbiAgICAgIGNhc2UgJ3NhdmVkX3ZpZXcnOiByZXR1cm4gJ3NhdmVkX3ZpZXdzJztcbiAgICAgIGNhc2UgJ2F0dGFjaG1lbnQnOiByZXR1cm4gJ2F0dGFjaG1lbnRzJztcbiAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgdW5rbm93biBlbnRpdHkgJHtlbnRpdHl9YCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVJlbW90ZUNyZWF0ZShvcDogT3ApOiB2b2lkIHtcbiAgICBjb25zdCByZWNvcmQgPSBvcC5wYXlsb2FkLnJlY29yZCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICBpZiAoIXJlY29yZCkgcmV0dXJuO1xuICAgIGNvbnN0IHRhYmxlID0gdGhpcy50YWJsZUZvcihvcC5lbnRpdHkpO1xuICAgIGNvbnN0IGV4aXN0cyA9IHRoaXMuZGIucHJlcGFyZShgU0VMRUNUIDEgRlJPTSAke3RhYmxlfSBXSEVSRSBpZD0/YCkuZ2V0KG9wLmVudGl0eUlkKTtcbiAgICBpZiAoZXhpc3RzKSByZXR1cm47IC8vIGNyZWF0ZSBpcyBpZGVtcG90ZW50IHBlciB1dWlkXG5cbiAgICBpZiAob3AuZW50aXR5ID09PSAnaXRlbScpIHtcbiAgICAgIGxldCBpdGVtID0geyAuLi4ocmVjb3JkIGFzIHVua25vd24gYXMgV29ya0l0ZW0pIH07XG4gICAgICAvLyBJZGVudCBjb2xsaXNpb246IGFub3RoZXIgaXRlbSAoZGlmZmVyZW50IHV1aWQpIGFscmVhZHkgaG9sZHMgdGhpcyBpZGVudC5cbiAgICAgIC8vIERldGVybWluaXN0aWMgcnVsZSBcdTIwMTQgdGhlIHNtYWxsZXIgdXVpZCBrZWVwcyB0aGUgY29udGVzdGVkIGlkZW50IFx1MjAxNCBzbyBib3RoXG4gICAgICAvLyBkZXZpY2VzIHJlc29sdmUgdGhlIHNhbWUgY29sbGlzaW9uIGlkZW50aWNhbGx5IGFuZCBjb252ZXJnZSB3aXRob3V0IHBpbmctcG9uZy5cbiAgICAgIGNvbnN0IGhvbGRlciA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkLCB0eXBlIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PycpLmdldChpdGVtLmlkZW50KSBhc1xuICAgICAgICB8IHsgaWQ6IHN0cmluZzsgdHlwZTogSXRlbVR5cGUgfVxuICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChob2xkZXIgJiYgaG9sZGVyLmlkICE9PSBpdGVtLmlkKSB7XG4gICAgICAgIGlmIChpdGVtLmlkIDwgaG9sZGVyLmlkKSB7XG4gICAgICAgICAgLy8gSW5jb21pbmcgaXRlbSBrZWVwcyB0aGUgaWRlbnQ7IHJlbnVtYmVyIHRoZSBsb2NhbCBob2xkZXIgYW5kIGJyb2FkY2FzdC5cbiAgICAgICAgICBjb25zdCBidW1wZWQgPSB0aGlzLmFsbG9jSWRlbnQoaG9sZGVyLnR5cGUpO1xuICAgICAgICAgIHRoaXMubG9nQWN0aXZpdHkoaG9sZGVyLmlkLCAncmVudW1iZXJlZCcsICdpZGVudCcsIGl0ZW0uaWRlbnQsIGJ1bXBlZCk7XG4gICAgICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoaG9sZGVyLmlkLCB7IGlkZW50OiBidW1wZWQgfSk7XG4gICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xuICAgICAgICAgIHRoaXMuaW5zZXJ0SXRlbVJvdyhpdGVtKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBuZXdJZGVudCA9IHRoaXMuYWxsb2NJZGVudChpdGVtLnR5cGUpO1xuICAgICAgICAgIHRoaXMubG9nQWN0aXZpdHkoaXRlbS5pZCwgJ3JlbnVtYmVyZWQnLCAnaWRlbnQnLCBpdGVtLmlkZW50LCBuZXdJZGVudCk7XG4gICAgICAgICAgaXRlbSA9IHsgLi4uaXRlbSwgaWRlbnQ6IG5ld0lkZW50IH07XG4gICAgICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xuICAgICAgICAgIHRoaXMubG9jYWxTZXQoJ2l0ZW0nLCBpdGVtLmlkLCB7IGlkZW50OiBuZXdJZGVudCB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xuICAgICAgfVxuICAgICAgdGhpcy53aXRuZXNzSWRlbnQoaXRlbS50eXBlLCBpdGVtLmlkZW50KTtcbiAgICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhyZWNvcmQpKSB0aGlzLnNldEZpZWxkQ2xvY2tJZk5ld2VyKCdpdGVtJywgaXRlbS5pZCwgZiwgb3AubGFtcG9ydCwgb3AuZGV2aWNlSWQpO1xuICAgICAgdGhpcy5yZXBsYXlQZW5kaW5nT3BzKG9wLmVudGl0eSwgb3AuZW50aXR5SWQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEdlbmVyaWMgaW5zZXJ0IGZvciBvdGhlciBlbnRpdGllcy5cbiAgICBjb25zdCBpbnNlcnRlcnM6IFJlY29yZDxzdHJpbmcsICgpID0+IHZvaWQ+ID0ge1xuICAgICAgbGluazogKCkgPT4ge1xuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgSXRlbUxpbmsgJiB7IGRlbGV0ZWQ/OiBudW1iZXIgfTtcbiAgICAgICAgdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gbGlua3MoaWQsIGZyb21faWQsIHRvX2lkLCBraW5kLCBkZWxldGVkLCBjcmVhdGVkX2F0LCBjcmVhdGVkX2J5KSBWQUxVRVMoPyw/LD8sPyw/LD8sPyknKVxuICAgICAgICAgIC5ydW4oci5pZCwgci5mcm9tSWQsIHIudG9JZCwgci5raW5kLCByLmRlbGV0ZWQgPz8gMCwgci5jcmVhdGVkQXQsIHIuY3JlYXRlZEJ5KTtcbiAgICAgIH0sXG4gICAgICBjb21tZW50OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBDb21tZW50O1xuICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBjb21tZW50cyhpZCwgaXRlbV9pZCwgYXV0aG9yX2lkLCBib2R5LCBib2R5X3RleHQsIGNyZWF0ZWRfYXQsIHVwZGF0ZWRfYXQsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8pJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIuaXRlbUlkLCByLmF1dGhvcklkLCByLmJvZHksIHIuYm9keVRleHQsIHIuY3JlYXRlZEF0LCByLnVwZGF0ZWRBdCwgci5kZWxldGVkID8/IDApO1xuICAgICAgfSxcbiAgICAgIG1pbGVzdG9uZTogKCkgPT4ge1xuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgTWlsZXN0b25lO1xuICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBtaWxlc3RvbmVzKGlkLCBuYW1lLCBkZXNjcmlwdGlvbiwgdGFyZ2V0X2RhdGUsIHN0YXR1cywgc29ydCwgc2FtcGxlLCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPywwKScpXG4gICAgICAgICAgLnJ1bihyLmlkLCByLm5hbWUsIHIuZGVzY3JpcHRpb24sIHIudGFyZ2V0RGF0ZSwgci5zdGF0dXMsIHIuc29ydCwgci5zYW1wbGUgPz8gMCk7XG4gICAgICB9LFxuICAgICAgcmVsZWFzZTogKCkgPT4ge1xuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgUmVsZWFzZTtcbiAgICAgICAgdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gcmVsZWFzZXMoaWQsIG5hbWUsIHZlcnNpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIGdvYWxzLCBub3Rlcywgc2FtcGxlLCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LDApJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgci52ZXJzaW9uLCByLnRhcmdldERhdGUsIHIuc3RhdHVzLCByLmdvYWxzLCByLm5vdGVzLCByLnNhbXBsZSA/PyAwKTtcbiAgICAgIH0sXG4gICAgICB1c2VyOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBVc2VyO1xuICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyB1c2VycyhpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBjcmVhdGVkX2F0KSBWQUxVRVMoPyw/LD8sPyw/KScpXG4gICAgICAgICAgLnJ1bihyLmlkLCByLm5hbWUsIHIuaW5pdGlhbHMsIHIuY29sb3IsIHIuY3JlYXRlZEF0KTtcbiAgICAgIH0sXG4gICAgICBzYXZlZF92aWV3OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBTYXZlZFZpZXc7XG4gICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIHNhdmVkX3ZpZXdzKGlkLCBuYW1lLCBjb25maWcsIHBpbm5lZCwgY3JlYXRlZF9ieSwgY3JlYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LDApJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgSlNPTi5zdHJpbmdpZnkoci5jb25maWcpLCByLnBpbm5lZCwgci5jcmVhdGVkQnksIHIuY3JlYXRlZEF0KTtcbiAgICAgIH0sXG4gICAgICBhdHRhY2htZW50OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBpbXBvcnQoJy4uLy4uL3NoYXJlZC90eXBlcycpLkF0dGFjaG1lbnQ7XG4gICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIGF0dGFjaG1lbnRzKGlkLCBpdGVtX2lkLCBmaWxlbmFtZSwgbWltZSwgc2l6ZSwgc2hhMjU2LCBkZXNjcmlwdGlvbiwgdXBsb2FkZWRfYnksIGNyZWF0ZWRfYXQsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPyw/KScpXG4gICAgICAgICAgLnJ1bihyLmlkLCByLml0ZW1JZCwgci5maWxlbmFtZSwgci5taW1lLCByLnNpemUsIHIuc2hhMjU2LCByLmRlc2NyaXB0aW9uLCByLnVwbG9hZGVkQnksIHIuY3JlYXRlZEF0LCByLmRlbGV0ZWQgPz8gMCk7XG4gICAgICB9LFxuICAgIH07XG4gICAgaW5zZXJ0ZXJzW29wLmVudGl0eV0/LigpO1xuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhyZWNvcmQpKSB0aGlzLnNldEZpZWxkQ2xvY2tJZk5ld2VyKG9wLmVudGl0eSwgb3AuZW50aXR5SWQsIGYsIG9wLmxhbXBvcnQsIG9wLmRldmljZUlkKTtcbiAgICB0aGlzLnJlcGxheVBlbmRpbmdPcHMob3AuZW50aXR5LCBvcC5lbnRpdHlJZCk7XG4gIH1cblxuICAvKiogU2V0IGEgZmllbGQgY2xvY2sgb25seSBpZiB0aGUgaW5jb21pbmcgd3JpdGUgaXMgbmV3ZXIgXHUyMDE0IGNyZWF0ZXMgbXVzdCBuZXZlclxuICAgICAgcmVncmVzcyBjbG9ja3Mgc3RhbXBlZCBieSBidWZmZXJlZC9lYXJsaWVyLWFycml2aW5nIHNldHMuICovXG4gIHByaXZhdGUgc2V0RmllbGRDbG9ja0lmTmV3ZXIoZW50aXR5OiBzdHJpbmcsIGVudGl0eUlkOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIGxhbXBvcnQ6IG51bWJlciwgZGV2aWNlSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGN1ciA9IHRoaXMuZmllbGRDbG9jayhlbnRpdHksIGVudGl0eUlkLCBmaWVsZCk7XG4gICAgaWYgKGN1ciAmJiAoY3VyLmxhbXBvcnQgPiBsYW1wb3J0IHx8IChjdXIubGFtcG9ydCA9PT0gbGFtcG9ydCAmJiBjdXIuZGV2aWNlSWQgPiBkZXZpY2VJZCkpKSByZXR1cm47XG4gICAgdGhpcy5zZXRGaWVsZENsb2NrKGVudGl0eSwgZW50aXR5SWQsIGZpZWxkLCBsYW1wb3J0LCBkZXZpY2VJZCk7XG4gIH1cblxuICAvKiogQnVmZmVyIGFuIG9wIHRoYXQgYXJyaXZlZCBiZWZvcmUgaXRzIHRhcmdldCdzIGNyZWF0ZSAoMysgZGV2aWNlIHJlb3JkZXJpbmcpLiAqL1xuICBwcml2YXRlIGJ1ZmZlclBlbmRpbmdPcChvcDogT3ApOiB2b2lkIHtcbiAgICB0aGlzLmRiXG4gICAgICAucHJlcGFyZShcbiAgICAgICAgYElOU0VSVCBPUiBJR05PUkUgSU5UTyBwZW5kaW5nX29wcyhvcF9pZCwgZGV2aWNlX2lkLCBhY3Rvcl9pZCwgbGFtcG9ydCwgYXQsIGVudGl0eSwgZW50aXR5X2lkLCBhY3Rpb24sIHBheWxvYWQpXG4gICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LD8pYCxcbiAgICAgIClcbiAgICAgIC5ydW4ob3Aub3BJZCwgb3AuZGV2aWNlSWQsIG9wLmFjdG9ySWQsIG9wLmxhbXBvcnQsIG9wLmF0LCBvcC5lbnRpdHksIG9wLmVudGl0eUlkLCBvcC5hY3Rpb24sIEpTT04uc3RyaW5naWZ5KG9wLnBheWxvYWQpKTtcbiAgfVxuXG4gIC8qKiBSZXBsYXkgYnVmZmVyZWQgc2V0cy9kZWxldGVzIGZvciBhbiBlbnRpdHkgb25jZSBpdHMgY3JlYXRlIGhhcyBsYW5kZWQuICovXG4gIHByaXZhdGUgcmVwbGF5UGVuZGluZ09wcyhlbnRpdHk6IE9wWydlbnRpdHknXSwgZW50aXR5SWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUICogRlJPTSBwZW5kaW5nX29wcyBXSEVSRSBlbnRpdHk9PyBBTkQgZW50aXR5X2lkPT8gT1JERVIgQlkgbGFtcG9ydCwgZGV2aWNlX2lkJylcbiAgICAgIC5hbGwoZW50aXR5LCBlbnRpdHlJZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICBpZiAocm93cy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICB0aGlzLmRiLnByZXBhcmUoJ0RFTEVURSBGUk9NIHBlbmRpbmdfb3BzIFdIRVJFIGVudGl0eT0/IEFORCBlbnRpdHlfaWQ9PycpLnJ1bihlbnRpdHksIGVudGl0eUlkKTtcbiAgICBmb3IgKGNvbnN0IHIgb2Ygcm93cykge1xuICAgICAgdGhpcy5hcHBseVJlbW90ZU9wKHtcbiAgICAgICAgb3BJZDogU3RyaW5nKHIub3BfaWQpLCBkZXZpY2VJZDogU3RyaW5nKHIuZGV2aWNlX2lkKSwgYWN0b3JJZDogU3RyaW5nKHIuYWN0b3JfaWQpLFxuICAgICAgICBsYW1wb3J0OiBOdW1iZXIoci5sYW1wb3J0KSwgYXQ6IFN0cmluZyhyLmF0KSwgZW50aXR5OiByLmVudGl0eSBhcyBPcFsnZW50aXR5J10sXG4gICAgICAgIGVudGl0eUlkOiBTdHJpbmcoci5lbnRpdHlfaWQpLCBhY3Rpb246IHIuYWN0aW9uIGFzIE9wWydhY3Rpb24nXSxcbiAgICAgICAgcGF5bG9hZDogSlNPTi5wYXJzZShTdHJpbmcoci5wYXlsb2FkKSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UmVtb3RlU2V0KG9wOiBPcCk6IHZvaWQge1xuICAgIC8vIFRhcmdldCByb3cgbWF5IG5vdCBleGlzdCB5ZXQgKG9wcyBmcm9tIGEgdGhpcmQgZGV2aWNlIGNhbiBhcnJpdmUgYmVmb3JlIHRoZVxuICAgIC8vIG9yaWdpbmF0aW5nIGRldmljZSdzIGNyZWF0ZSkgXHUyMDE0IGJ1ZmZlciBhbmQgcmVwbGF5IGFmdGVyIHRoZSBjcmVhdGUuXG4gICAgY29uc3Qgcm93RXhpc3RzID0gdGhpcy5kYi5wcmVwYXJlKGBTRUxFQ1QgMSBGUk9NICR7dGhpcy50YWJsZUZvcihvcC5lbnRpdHkpfSBXSEVSRSBpZD0/YCkuZ2V0KG9wLmVudGl0eUlkKTtcbiAgICBpZiAoIXJvd0V4aXN0cykge1xuICAgICAgdGhpcy5idWZmZXJQZW5kaW5nT3Aob3ApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBmaWVsZHMgPSAob3AucGF5bG9hZC5maWVsZHMgPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgIGNvbnN0IGJhc2VkT24gPSAob3AucGF5bG9hZC5iYXNlZE9uID8/IHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCB7IGxhbXBvcnQ6IG51bWJlcjsgZGV2aWNlSWQ6IHN0cmluZyB9IHwgbnVsbD47XG4gICAgY29uc3Qgd2lubmluZzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcblxuICAgIGZvciAoY29uc3QgW2ZpZWxkLCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZmllbGRzKSkge1xuICAgICAgY29uc3QgbG9jYWwgPSB0aGlzLmZpZWxkQ2xvY2sob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgZmllbGQpO1xuICAgICAgY29uc3QgYmFzZSA9IGJhc2VkT25bZmllbGRdID8/IG51bGw7XG5cbiAgICAgIGxldCByZW1vdGVXaW5zOiBib29sZWFuO1xuICAgICAgbGV0IGNvbmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlmICghbG9jYWwpIHtcbiAgICAgICAgcmVtb3RlV2lucyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGJhc2UgJiYgYmFzZS5sYW1wb3J0ID09PSBsb2NhbC5sYW1wb3J0ICYmIGJhc2UuZGV2aWNlSWQgPT09IGxvY2FsLmRldmljZUlkKSB7XG4gICAgICAgIHJlbW90ZVdpbnMgPSB0cnVlOyAvLyBjbGVhbiBjYXVzYWwgdXBkYXRlOiByZW1vdGUgc2F3IGV4YWN0bHkgb3VyIGN1cnJlbnQgdmFsdWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICByZW1vdGVXaW5zID0gb3AubGFtcG9ydCA+IGxvY2FsLmxhbXBvcnQgfHwgKG9wLmxhbXBvcnQgPT09IGxvY2FsLmxhbXBvcnQgJiYgb3AuZGV2aWNlSWQgPiBsb2NhbC5kZXZpY2VJZCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25jdXJyZW50ICYmIENPTkZMSUNUX1NVUkZBQ0VEX0ZJRUxEUy5oYXMoZmllbGQpICYmIG9wLmVudGl0eSA9PT0gJ2l0ZW0nKSB7XG4gICAgICAgIGNvbnN0IGN1ciA9IHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZShgU0VMRUNUICR7SVRFTV9DT0xTW2ZpZWxkXX0gQVMgdiBGUk9NIGl0ZW1zIFdIRVJFIGlkPT9gKVxuICAgICAgICAgIC5nZXQob3AuZW50aXR5SWQpIGFzIHsgdjogdW5rbm93biB9IHwgdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCBsb2NhbFZhbCA9IGN1ciA/IFN0cmluZyhjdXIudiA/PyAnJykgOiAnJztcbiAgICAgICAgY29uc3QgcmVtb3RlVmFsID0gU3RyaW5nKHZhbHVlID8/ICcnKTtcbiAgICAgICAgaWYgKGxvY2FsVmFsICE9PSByZW1vdGVWYWwpIHtcbiAgICAgICAgICBjb25zdCBjb25mbGljdDogU3luY0NvbmZsaWN0ID0ge1xuICAgICAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgICAgICBlbnRpdHk6IG9wLmVudGl0eSxcbiAgICAgICAgICAgIGVudGl0eUlkOiBvcC5lbnRpdHlJZCxcbiAgICAgICAgICAgIGZpZWxkLFxuICAgICAgICAgICAgbG9jYWxWYWx1ZTogbG9jYWxWYWwsXG4gICAgICAgICAgICByZW1vdGVWYWx1ZTogcmVtb3RlVmFsLFxuICAgICAgICAgICAgcmVtb3RlRGV2aWNlOiBvcC5kZXZpY2VJZCxcbiAgICAgICAgICAgIHJlbW90ZUFjdG9yOiBvcC5hY3RvcklkLFxuICAgICAgICAgICAgZGV0ZWN0ZWRBdDogdGhpcy5ub3coKSxcbiAgICAgICAgICAgIHJlc29sdmVkQXQ6IG51bGwsXG4gICAgICAgICAgICByZXNvbHV0aW9uOiBudWxsLFxuICAgICAgICAgIH07XG4gICAgICAgICAgdGhpcy5kYlxuICAgICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIHN5bmNfY29uZmxpY3RzKGlkLCBlbnRpdHksIGVudGl0eV9pZCwgZmllbGQsIGxvY2FsX3ZhbHVlLCByZW1vdGVfdmFsdWUsIHJlbW90ZV9kZXZpY2UsIHJlbW90ZV9hY3RvciwgZGV0ZWN0ZWRfYXQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPyknKVxuICAgICAgICAgICAgLnJ1bihjb25mbGljdC5pZCwgY29uZmxpY3QuZW50aXR5LCBjb25mbGljdC5lbnRpdHlJZCwgY29uZmxpY3QuZmllbGQsIGNvbmZsaWN0LmxvY2FsVmFsdWUsIGNvbmZsaWN0LnJlbW90ZVZhbHVlLCBjb25mbGljdC5yZW1vdGVEZXZpY2UsIGNvbmZsaWN0LnJlbW90ZUFjdG9yLCBjb25mbGljdC5kZXRlY3RlZEF0KTtcbiAgICAgICAgICB0aGlzLmV2ZW50cy5vbkNvbmZsaWN0KGNvbmZsaWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocmVtb3RlV2lucykge1xuICAgICAgICB3aW5uaW5nW2ZpZWxkXSA9IHZhbHVlO1xuICAgICAgICB0aGlzLnNldEZpZWxkQ2xvY2sob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgZmllbGQsIG9wLmxhbXBvcnQsIG9wLmRldmljZUlkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0LmtleXMod2lubmluZykubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICBpZiAob3AuZW50aXR5ID09PSAnaXRlbScpIHtcbiAgICAgIC8vIElkZW50IHNldCBtYXkgY29sbGlkZSBsb2NhbGx5IFx1MjAxNCByZXNvbHZlIHdpdGggdGhlIHNhbWUgc21hbGxlci11dWlkLWtlZXBzIHJ1bGUuXG4gICAgICBpZiAoJ2lkZW50JyBpbiB3aW5uaW5nKSB7XG4gICAgICAgIGNvbnN0IGhvbGRlciA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkLCB0eXBlIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PycpLmdldChTdHJpbmcod2lubmluZy5pZGVudCkpIGFzXG4gICAgICAgICAgfCB7IGlkOiBzdHJpbmc7IHR5cGU6IEl0ZW1UeXBlIH1cbiAgICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgY3VyID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgdHlwZSBGUk9NIGl0ZW1zIFdIRVJFIGlkPT8nKS5nZXQob3AuZW50aXR5SWQpIGFzIHsgdHlwZTogSXRlbVR5cGUgfSB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGhvbGRlciAmJiBob2xkZXIuaWQgIT09IG9wLmVudGl0eUlkICYmIGN1cikge1xuICAgICAgICAgIGlmIChvcC5lbnRpdHlJZCA8IGhvbGRlci5pZCkge1xuICAgICAgICAgICAgY29uc3QgYnVtcGVkID0gdGhpcy5hbGxvY0lkZW50KGhvbGRlci50eXBlKTtcbiAgICAgICAgICAgIHRoaXMubG9nQWN0aXZpdHkoaG9sZGVyLmlkLCAncmVudW1iZXJlZCcsICdpZGVudCcsIFN0cmluZyh3aW5uaW5nLmlkZW50KSwgYnVtcGVkKTtcbiAgICAgICAgICAgIHRoaXMuYXBwbHlJdGVtRmllbGRzKGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xuICAgICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBidW1wZWQgPSB0aGlzLmFsbG9jSWRlbnQoY3VyLnR5cGUpO1xuICAgICAgICAgICAgd2lubmluZy5pZGVudCA9IGJ1bXBlZDtcbiAgICAgICAgICAgIHRoaXMubG9jYWxTZXQoJ2l0ZW0nLCBvcC5lbnRpdHlJZCwgeyBpZGVudDogYnVtcGVkIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChjdXIpIHtcbiAgICAgICAgICB0aGlzLndpdG5lc3NJZGVudChjdXIudHlwZSwgU3RyaW5nKHdpbm5pbmcuaWRlbnQpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMob3AuZW50aXR5SWQsIHdpbm5pbmcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEdlbmVyaWMgY29sdW1uIHVwZGF0ZSBmb3Igb3RoZXIgZW50aXRpZXMuXG4gICAgY29uc3QgY29sTWFwOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+PiA9IHtcbiAgICAgIGxpbms6IHsgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXG4gICAgICBjb21tZW50OiB7IGJvZHk6ICdib2R5JywgYm9keVRleHQ6ICdib2R5X3RleHQnLCB1cGRhdGVkQXQ6ICd1cGRhdGVkX2F0JywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXG4gICAgICBtaWxlc3RvbmU6IHsgbmFtZTogJ25hbWUnLCBkZXNjcmlwdGlvbjogJ2Rlc2NyaXB0aW9uJywgdGFyZ2V0RGF0ZTogJ3RhcmdldF9kYXRlJywgc3RhdHVzOiAnc3RhdHVzJywgc29ydDogJ3NvcnQnLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICAgIHJlbGVhc2U6IHsgbmFtZTogJ25hbWUnLCB2ZXJzaW9uOiAndmVyc2lvbicsIHRhcmdldERhdGU6ICd0YXJnZXRfZGF0ZScsIHN0YXR1czogJ3N0YXR1cycsIGdvYWxzOiAnZ29hbHMnLCBub3RlczogJ25vdGVzJywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXG4gICAgICB1c2VyOiB7IG5hbWU6ICduYW1lJywgaW5pdGlhbHM6ICdpbml0aWFscycsIGNvbG9yOiAnY29sb3InIH0sXG4gICAgICBzYXZlZF92aWV3OiB7IG5hbWU6ICduYW1lJywgY29uZmlnOiAnY29uZmlnJywgcGlubmVkOiAncGlubmVkJywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXG4gICAgICBhdHRhY2htZW50OiB7IGRlc2NyaXB0aW9uOiAnZGVzY3JpcHRpb24nLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICB9O1xuICAgIGNvbnN0IG1hcCA9IGNvbE1hcFtvcC5lbnRpdHldO1xuICAgIGlmICghbWFwKSByZXR1cm47XG4gICAgY29uc3Qgc2V0czogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCB2YWxzOiB1bmtub3duW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyh3aW5uaW5nKSkge1xuICAgICAgY29uc3QgY29sID0gbWFwW2tdO1xuICAgICAgaWYgKCFjb2wpIGNvbnRpbnVlO1xuICAgICAgc2V0cy5wdXNoKGAke2NvbH09P2ApO1xuICAgICAgdmFscy5wdXNoKGsgPT09ICdjb25maWcnID8gSlNPTi5zdHJpbmdpZnkodikgOiB2KTtcbiAgICB9XG4gICAgaWYgKCFzZXRzLmxlbmd0aCkgcmV0dXJuO1xuICAgIHZhbHMucHVzaChvcC5lbnRpdHlJZCk7XG4gICAgdGhpcy5kYi5wcmVwYXJlKGBVUERBVEUgJHt0aGlzLnRhYmxlRm9yKG9wLmVudGl0eSl9IFNFVCAke3NldHMuam9pbignLCAnKX0gV0hFUkUgaWQ9P2ApLnJ1biguLi52YWxzKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlSZW1vdGVEZWxldGUob3A6IE9wKTogdm9pZCB7XG4gICAgY29uc3QgdGFibGUgPSB0aGlzLnRhYmxlRm9yKG9wLmVudGl0eSk7XG4gICAgY29uc3Qgcm93RXhpc3RzID0gdGhpcy5kYi5wcmVwYXJlKGBTRUxFQ1QgMSBGUk9NICR7dGFibGV9IFdIRVJFIGlkPT9gKS5nZXQob3AuZW50aXR5SWQpO1xuICAgIGlmICghcm93RXhpc3RzKSB7XG4gICAgICAvLyBEZWxldGUgYXJyaXZlZCBiZWZvcmUgdGhlIGNyZWF0ZSAoMysgZGV2aWNlIHJlb3JkZXJpbmcpIFx1MjAxNCBidWZmZXIgaXQgc28gdGhlXG4gICAgICAvLyBjcmVhdGUncyByZXBsYXkgYXBwbGllcyBpdCBpbnN0ZWFkIG9mIHJlc3VycmVjdGluZyB0aGUgaXRlbS5cbiAgICAgIHRoaXMuYnVmZmVyUGVuZGluZ09wKG9wKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5kYi5wcmVwYXJlKGBVUERBVEUgJHt0YWJsZX0gU0VUIGRlbGV0ZWQ9MSBXSEVSRSBpZD0/YCkucnVuKG9wLmVudGl0eUlkKTtcbiAgICB0aGlzLnNldEZpZWxkQ2xvY2sob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgJ2RlbGV0ZWQnLCBvcC5sYW1wb3J0LCBvcC5kZXZpY2VJZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGNvbmZsaWN0cyAtLS0tLS0tLS0tXG4gIGxpc3RDb25mbGljdHMob3Blbk9ubHkgPSB0cnVlKTogU3luY0NvbmZsaWN0W10ge1xuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXG4gICAgICAucHJlcGFyZShgU0VMRUNUICogRlJPTSBzeW5jX2NvbmZsaWN0cyAke29wZW5Pbmx5ID8gJ1dIRVJFIHJlc29sdmVkX2F0IElTIE5VTEwnIDogJyd9IE9SREVSIEJZIGRldGVjdGVkX2F0IERFU0NgKVxuICAgICAgLmFsbCgpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xuICAgICAgaWQ6IFN0cmluZyhyLmlkKSwgZW50aXR5OiBTdHJpbmcoci5lbnRpdHkpLCBlbnRpdHlJZDogU3RyaW5nKHIuZW50aXR5X2lkKSwgZmllbGQ6IFN0cmluZyhyLmZpZWxkKSxcbiAgICAgIGxvY2FsVmFsdWU6IFN0cmluZyhyLmxvY2FsX3ZhbHVlKSwgcmVtb3RlVmFsdWU6IFN0cmluZyhyLnJlbW90ZV92YWx1ZSksXG4gICAgICByZW1vdGVEZXZpY2U6IFN0cmluZyhyLnJlbW90ZV9kZXZpY2UpLCByZW1vdGVBY3RvcjogU3RyaW5nKHIucmVtb3RlX2FjdG9yKSxcbiAgICAgIGRldGVjdGVkQXQ6IFN0cmluZyhyLmRldGVjdGVkX2F0KSxcbiAgICAgIHJlc29sdmVkQXQ6IHIucmVzb2x2ZWRfYXQgPyBTdHJpbmcoci5yZXNvbHZlZF9hdCkgOiBudWxsLFxuICAgICAgcmVzb2x1dGlvbjogKHIucmVzb2x1dGlvbiBhcyBTeW5jQ29uZmxpY3RbJ3Jlc29sdXRpb24nXSkgPz8gbnVsbCxcbiAgICB9KSk7XG4gIH1cblxuICByZXNvbHZlQ29uZmxpY3QoaWQ6IHN0cmluZywgcmVzb2x1dGlvbjogJ2xvY2FsJyB8ICdyZW1vdGUnIHwgJ21lcmdlZCcsIG1lcmdlZFZhbHVlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHN5bmNfY29uZmxpY3RzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICAgIGlmICghcm93KSByZXR1cm47XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID1cbiAgICAgICAgcmVzb2x1dGlvbiA9PT0gJ21lcmdlZCcgPyAobWVyZ2VkVmFsdWUgPz8gJycpIDogcmVzb2x1dGlvbiA9PT0gJ2xvY2FsJyA/IFN0cmluZyhyb3cubG9jYWxfdmFsdWUpIDogU3RyaW5nKHJvdy5yZW1vdGVfdmFsdWUpO1xuICAgICAgaWYgKFN0cmluZyhyb3cuZW50aXR5KSA9PT0gJ2l0ZW0nKSB7XG4gICAgICAgIGNvbnN0IGZpZWxkID0gU3RyaW5nKHJvdy5maWVsZCk7XG4gICAgICAgIGNvbnN0IHN0YW1wID0gdGhpcy5ub3coKTtcbiAgICAgICAgY29uc3QgZmllbGRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHsgW2ZpZWxkXTogdmFsdWUsIHVwZGF0ZWRBdDogc3RhbXAsIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH07XG4gICAgICAgIC8vIFJlc29sdmluZyBhIGJvZHkgY29uZmxpY3QgbXVzdCBhbHNvIHJlZnJlc2ggdGhlIHNlYXJjaC10ZXh0IHByb2plY3Rpb24uXG4gICAgICAgIGlmIChmaWVsZCA9PT0gJ2JvZHknKSBmaWVsZHMuYm9keVRleHQgPSBkb2NUb1RleHQodmFsdWUpO1xuICAgICAgICB0aGlzLmFwcGx5SXRlbUZpZWxkcyhTdHJpbmcocm93LmVudGl0eV9pZCksIGZpZWxkcyk7XG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ2l0ZW0nLCBTdHJpbmcocm93LmVudGl0eV9pZCksIGZpZWxkcyk7XG4gICAgICB9XG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBzeW5jX2NvbmZsaWN0cyBTRVQgcmVzb2x2ZWRfYXQ9PywgcmVzb2x1dGlvbj0/LCByZXNvbHZlZF9ieT0/IFdIRVJFIGlkPT8nKS5ydW4odGhpcy5ub3coKSwgcmVzb2x1dGlvbiwgdGhpcy5hY3RvcklkLCBpZCk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogU3RyaW5nKHJvdy5lbnRpdHkpLCBlbnRpdHlJZDogU3RyaW5nKHJvdy5lbnRpdHlfaWQpIH0pO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBzeW5jIGV4cG9ydCBoZWxwZXJzIC0tLS0tLS0tLS1cbiAgb3BzU2luY2Uoc2VxOiBudW1iZXIsIG93bk9ubHkgPSB0cnVlKTogeyBzZXE6IG51bWJlcjsgb3A6IE9wIH1bXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKFxuICAgICAgICBgU0VMRUNUIHNlcSwgb3BfaWQsIGRldmljZV9pZCwgYWN0b3JfaWQsIGxhbXBvcnQsIGF0LCBlbnRpdHksIGVudGl0eV9pZCwgYWN0aW9uLCBwYXlsb2FkXG4gICAgICAgICBGUk9NIG9wbG9nIFdIRVJFIHNlcSA+ID8gJHtvd25Pbmx5ID8gJ0FORCBkZXZpY2VfaWQgPSA/JyA6ICcnfSBPUkRFUiBCWSBzZXEgQVNDYCxcbiAgICAgIClcbiAgICAgIC5hbGwoLi4uKG93bk9ubHkgPyBbc2VxLCB0aGlzLmRldmljZUlkXSA6IFtzZXFdKSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7XG4gICAgICBzZXE6IE51bWJlcihyLnNlcSksXG4gICAgICBvcDoge1xuICAgICAgICBvcElkOiBTdHJpbmcoci5vcF9pZCksIGRldmljZUlkOiBTdHJpbmcoci5kZXZpY2VfaWQpLCBhY3RvcklkOiBTdHJpbmcoci5hY3Rvcl9pZCksXG4gICAgICAgIGxhbXBvcnQ6IE51bWJlcihyLmxhbXBvcnQpLCBhdDogU3RyaW5nKHIuYXQpLCBlbnRpdHk6IHIuZW50aXR5IGFzIE9wWydlbnRpdHknXSxcbiAgICAgICAgZW50aXR5SWQ6IFN0cmluZyhyLmVudGl0eV9pZCksIGFjdGlvbjogci5hY3Rpb24gYXMgT3BbJ2FjdGlvbiddLFxuICAgICAgICBwYXlsb2FkOiBKU09OLnBhcnNlKFN0cmluZyhyLnBheWxvYWQpKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAgIH0sXG4gICAgfSkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBzYW1wbGUgZGF0YSAtLS0tLS0tLS0tXG4gIHJlbW92ZVNhbXBsZURhdGEoKTogbnVtYmVyIHtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgY29uc3QgaWRzID0gKHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkIEZST00gaXRlbXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pLm1hcCgocikgPT4gci5pZCk7XG4gICAgICBmb3IgKGNvbnN0IGlkIG9mIGlkcykgdGhpcy5kZWxldGVJdGVtKGlkKTtcbiAgICAgIGZvciAoY29uc3QgbSBvZiB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpZCBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pIHtcbiAgICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgbWlsZXN0b25lcyBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT8nKS5ydW4obS5pZCk7XG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ21pbGVzdG9uZScsIG0uaWQsIHsgZGVsZXRlZDogMSB9KTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgcmVsIG9mIHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkIEZST00gcmVsZWFzZXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pIHtcbiAgICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgcmVsZWFzZXMgU0VUIGRlbGV0ZWQ9MSBXSEVSRSBpZD0/JykucnVuKHJlbC5pZCk7XG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ3JlbGVhc2UnLCByZWwuaWQsIHsgZGVsZXRlZDogMSB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpZHMubGVuZ3RoO1xuICAgIH0pO1xuICAgIGNvbnN0IG4gPSB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnKicsIGVudGl0eUlkOiAnKicgfSk7XG4gICAgcmV0dXJuIG47XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLSByb3cgbWFwcGVycyAtLS0tLS0tLS0tXG5leHBvcnQgZnVuY3Rpb24gcm93VG9JdGVtKHI6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogV29ya0l0ZW0ge1xuICByZXR1cm4ge1xuICAgIGlkOiBTdHJpbmcoci5pZCksXG4gICAgaWRlbnQ6IFN0cmluZyhyLmlkZW50KSxcbiAgICB0eXBlOiByLnR5cGUgYXMgSXRlbVR5cGUsXG4gICAgdGl0bGU6IFN0cmluZyhyLnRpdGxlKSxcbiAgICBib2R5OiBTdHJpbmcoci5ib2R5KSxcbiAgICBib2R5VGV4dDogU3RyaW5nKHIuYm9keV90ZXh0KSxcbiAgICBzdGF0dXM6IFN0cmluZyhyLnN0YXR1cyksXG4gICAgcHJpb3JpdHk6IHIucHJpb3JpdHkgYXMgV29ya0l0ZW1bJ3ByaW9yaXR5J10sXG4gICAgb3duZXJJZDogKHIub3duZXJfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICByZXBvcnRlcklkOiAoci5yZXBvcnRlcl9pZCBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxuICAgIG1pbGVzdG9uZUlkOiAoci5taWxlc3RvbmVfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICByZWxlYXNlSWQ6IChyLnJlbGVhc2VfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBwYXJlbnRJZDogKHIucGFyZW50X2lkIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXG4gICAgc3RhcnREYXRlOiAoci5zdGFydF9kYXRlIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXG4gICAgZHVlRGF0ZTogKHIuZHVlX2RhdGUgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBjb21wbGV0ZWRBdDogKHIuY29tcGxldGVkX2F0IGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXG4gICAgZWZmb3J0OiByLmVmZm9ydCA9PSBudWxsID8gbnVsbCA6IE51bWJlcihyLmVmZm9ydCksXG4gICAgY29uZmlkZW5jZTogKHIuY29uZmlkZW5jZSBhcyBXb3JrSXRlbVsnY29uZmlkZW5jZSddKSA/PyBudWxsLFxuICAgIHJpc2tMZXZlbDogKHIucmlza19sZXZlbCBhcyBXb3JrSXRlbVsncmlza0xldmVsJ10pID8/IG51bGwsXG4gICAgYnVzaW5lc3NWYWx1ZTogKHIuYnVzaW5lc3NfdmFsdWUgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBsZWFkZXJzaGlwVmlzaWJsZTogTnVtYmVyKHIubGVhZGVyc2hpcF92aXNpYmxlKSBhcyAwIHwgMSxcbiAgICBwcm9ncmVzczogci5wcm9ncmVzcyA9PSBudWxsID8gbnVsbCA6IE51bWJlcihyLnByb2dyZXNzKSxcbiAgICB0YWdzOiBzYWZlUGFyc2UoU3RyaW5nKHIudGFncyksIFtdKSBhcyBzdHJpbmdbXSxcbiAgICBleHRyYTogc2FmZVBhcnNlKFN0cmluZyhyLmV4dHJhKSwge30pIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIGFyY2hpdmVkOiBOdW1iZXIoci5hcmNoaXZlZCkgYXMgMCB8IDEsXG4gICAgc2FtcGxlOiBOdW1iZXIoci5zYW1wbGUpIGFzIDAgfCAxLFxuICAgIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXG4gICAgdXBkYXRlZEF0OiBTdHJpbmcoci51cGRhdGVkX2F0KSxcbiAgICBjcmVhdGVkQnk6IFN0cmluZyhyLmNyZWF0ZWRfYnkpLFxuICAgIHVwZGF0ZWRCeTogU3RyaW5nKHIudXBkYXRlZF9ieSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJvd1RvTGluayhyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IEl0ZW1MaW5rIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogU3RyaW5nKHIuaWQpLFxuICAgIGZyb21JZDogU3RyaW5nKHIuZnJvbV9pZCksXG4gICAgdG9JZDogU3RyaW5nKHIudG9faWQpLFxuICAgIGtpbmQ6IHIua2luZCBhcyBMaW5rS2luZCxcbiAgICBjcmVhdGVkQXQ6IFN0cmluZyhyLmNyZWF0ZWRfYXQpLFxuICAgIGNyZWF0ZWRCeTogU3RyaW5nKHIuY3JlYXRlZF9ieSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNhZmVQYXJzZShzOiBzdHJpbmcsIGZhbGxiYWNrOiB1bmtub3duKTogdW5rbm93biB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2Uocyk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxsYmFjaztcbiAgfVxufVxuXG4vKiogQ29udmVydCBmcmVlIHRleHQgdG8gYSBzYWZlIEZUUzUgcHJlZml4IHF1ZXJ5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZ0c1F1ZXJ5KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRlcm1zID0gdGV4dFxuICAgIC5yZXBsYWNlKC9bJ1wiKigpXS9nLCAnICcpXG4gICAgLnNwbGl0KC9cXHMrLylcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLm1hcCgodCkgPT4gYFwiJHt0fVwiKmApO1xuICByZXR1cm4gdGVybXMuam9pbignICcpIHx8ICdcIlwiJztcbn1cbiIsICIvLyBTaGFyZWQgZG9tYWluIHR5cGVzIFx1MjAxNCBzaW5nbGUgc291cmNlIG9mIHRydXRoIGZvciBtYWluIHByb2Nlc3MgYW5kIHJlbmRlcmVyLlxuXG4vLyAtLS0tLS0tLS0tIFRlcm1pbm9sb2d5IC0tLS0tLS0tLS1cbi8vIFVtYnJlbGxhIG5vdW46IFwiV29yayBJdGVtXCIuIEV2ZXJ5IHRyYWNrZWQgcmVjb3JkIGlzIGEgd29yayBpdGVtIHdpdGggYSB0eXBlLlxuLy8gSWRlbnRzIGFyZSBwZXItdHlwZSBzZXF1ZW5jZXM6IFRBU0stMTIsIEZFQVQtMywgUkVRLTQxLCBERUMtMTIsIFJJU0stOCwgQkxLLTIsXG4vLyBBQ0MtNSwgTVRHLTE0LCBJREVBLTcsIFEtMywgREVGLTEsIFJFUy00LlxuXG5leHBvcnQgY29uc3QgSVRFTV9UWVBFUyA9IFtcbiAgJ3Rhc2snLFxuICAnZmVhdHVyZScsXG4gICdyZXF1aXJlbWVudCcsXG4gICdzdG9yeScsXG4gICdkZWNpc2lvbicsXG4gICdyaXNrJyxcbiAgJ2Jsb2NrZXInLFxuICAnYWNjZXNzJyxcbiAgJ21lZXRpbmcnLFxuICAnaWRlYScsXG4gICdxdWVzdGlvbicsXG4gICdkZWZlY3QnLFxuICAncmVzZWFyY2gnLFxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEl0ZW1UeXBlID0gKHR5cGVvZiBJVEVNX1RZUEVTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgSURFTlRfUFJFRklYOiBSZWNvcmQ8SXRlbVR5cGUsIHN0cmluZz4gPSB7XG4gIHRhc2s6ICdUQVNLJyxcbiAgZmVhdHVyZTogJ0ZFQVQnLFxuICByZXF1aXJlbWVudDogJ1JFUScsXG4gIHN0b3J5OiAnU1RPUlknLFxuICBkZWNpc2lvbjogJ0RFQycsXG4gIHJpc2s6ICdSSVNLJyxcbiAgYmxvY2tlcjogJ0JMSycsXG4gIGFjY2VzczogJ0FDQycsXG4gIG1lZXRpbmc6ICdNVEcnLFxuICBpZGVhOiAnSURFQScsXG4gIHF1ZXN0aW9uOiAnUScsXG4gIGRlZmVjdDogJ0RFRicsXG4gIHJlc2VhcmNoOiAnUkVTJyxcbn07XG5cbmV4cG9ydCBjb25zdCBUWVBFX0xBQkVMOiBSZWNvcmQ8SXRlbVR5cGUsIHN0cmluZz4gPSB7XG4gIHRhc2s6ICdUYXNrJyxcbiAgZmVhdHVyZTogJ0ZlYXR1cmUnLFxuICByZXF1aXJlbWVudDogJ1JlcXVpcmVtZW50JyxcbiAgc3Rvcnk6ICdVc2VyIFN0b3J5JyxcbiAgZGVjaXNpb246ICdEZWNpc2lvbicsXG4gIHJpc2s6ICdSaXNrJyxcbiAgYmxvY2tlcjogJ0Jsb2NrZXInLFxuICBhY2Nlc3M6ICdBY2Nlc3MgUmVxdWVzdCcsXG4gIG1lZXRpbmc6ICdNZWV0aW5nIE5vdGUnLFxuICBpZGVhOiAnSWRlYScsXG4gIHF1ZXN0aW9uOiAnT3BlbiBRdWVzdGlvbicsXG4gIGRlZmVjdDogJ0RlZmVjdCcsXG4gIHJlc2VhcmNoOiAnUmVzZWFyY2gnLFxufTtcblxuLy8gLS0tLS0tLS0tLSBTdGF0dXNlcyAtLS0tLS0tLS0tXG4vLyBXb3JrIHN0YXR1c2VzIGFwcGx5IHRvIGV4ZWN1dGFibGUgaXRlbXMgKHRhc2svZmVhdHVyZS9yZXF1aXJlbWVudC9zdG9yeS9kZWZlY3QvcmVzZWFyY2gvaWRlYSkuXG5leHBvcnQgY29uc3QgV09SS19TVEFUVVNFUyA9IFtcbiAgJ2JhY2tsb2cnLFxuICAndG9kbycsXG4gICdpbl9wcm9ncmVzcycsXG4gICdpbl9yZXZpZXcnLFxuICAnYmxvY2tlZCcsXG4gICdkb25lJyxcbiAgJ2NhbmNlbGxlZCcsXG5dIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgV29ya1N0YXR1cyA9ICh0eXBlb2YgV09SS19TVEFUVVNFUylbbnVtYmVyXTtcblxuZXhwb3J0IGNvbnN0IERFQ0lTSU9OX1NUQVRVU0VTID0gW1xuICAncHJvcG9zZWQnLFxuICAnZGlzY3Vzc2luZycsXG4gICdhcHByb3ZlZCcsXG4gICdyZWplY3RlZCcsXG4gICdyZXZpc2l0JyxcbiAgJ3N1cGVyc2VkZWQnLFxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIERlY2lzaW9uU3RhdHVzID0gKHR5cGVvZiBERUNJU0lPTl9TVEFUVVNFUylbbnVtYmVyXTtcblxuZXhwb3J0IGNvbnN0IEFDQ0VTU19TVEFUVVNFUyA9IFtcbiAgJ2lkZW50aWZpZWQnLFxuICAnbm90X3JlcXVlc3RlZCcsXG4gICdwcmVwYXJpbmcnLFxuICAncmVxdWVzdGVkJyxcbiAgJ3VuZGVyX3JldmlldycsXG4gICdpbmZvX25lZWRlZCcsXG4gICdhcHByb3ZlZCcsXG4gICdwYXJ0aWFsbHlfYXBwcm92ZWQnLFxuICAnZ3JhbnRlZCcsXG4gICdkZW5pZWQnLFxuICAnZXhwaXJlZCcsXG4gICdub3RfbmVlZGVkJyxcbl0gYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBY2Nlc3NTdGF0dXMgPSAodHlwZW9mIEFDQ0VTU19TVEFUVVNFUylbbnVtYmVyXTtcblxuZXhwb3J0IGNvbnN0IFJJU0tfU1RBVFVTRVMgPSBbJ29wZW4nLCAnbWl0aWdhdGluZycsICdhY2NlcHRlZCcsICdjbG9zZWQnXSBhcyBjb25zdDtcbmV4cG9ydCBjb25zdCBCTE9DS0VSX1NUQVRVU0VTID0gWydhY3RpdmUnLCAnd29ya2Fyb3VuZCcsICdyZXNvbHZlZCddIGFzIGNvbnN0O1xuZXhwb3J0IGNvbnN0IFFVRVNUSU9OX1NUQVRVU0VTID0gWydvcGVuJywgJ2Fuc3dlcmVkJywgJ3BhcmtlZCddIGFzIGNvbnN0O1xuZXhwb3J0IGNvbnN0IE1FRVRJTkdfU1RBVFVTRVMgPSBbJ3NjaGVkdWxlZCcsICdoZWxkJywgJ3N1bW1hcml6ZWQnXSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgSXRlbVN0YXR1cyA9IHN0cmluZzsgLy8gdmFsaWRhdGVkIHBlci10eXBlIGJ5IHN0YXR1c2VzRm9yVHlwZSgpXG5cbmV4cG9ydCBmdW5jdGlvbiBzdGF0dXNlc0ZvclR5cGUodHlwZTogSXRlbVR5cGUpOiByZWFkb25seSBzdHJpbmdbXSB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ2RlY2lzaW9uJzpcbiAgICAgIHJldHVybiBERUNJU0lPTl9TVEFUVVNFUztcbiAgICBjYXNlICdhY2Nlc3MnOlxuICAgICAgcmV0dXJuIEFDQ0VTU19TVEFUVVNFUztcbiAgICBjYXNlICdyaXNrJzpcbiAgICAgIHJldHVybiBSSVNLX1NUQVRVU0VTO1xuICAgIGNhc2UgJ2Jsb2NrZXInOlxuICAgICAgcmV0dXJuIEJMT0NLRVJfU1RBVFVTRVM7XG4gICAgY2FzZSAncXVlc3Rpb24nOlxuICAgICAgcmV0dXJuIFFVRVNUSU9OX1NUQVRVU0VTO1xuICAgIGNhc2UgJ21lZXRpbmcnOlxuICAgICAgcmV0dXJuIE1FRVRJTkdfU1RBVFVTRVM7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBXT1JLX1NUQVRVU0VTO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBTVEFUVVNfTEFCRUw6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIGJhY2tsb2c6ICdCYWNrbG9nJyxcbiAgdG9kbzogJ1RvIERvJyxcbiAgaW5fcHJvZ3Jlc3M6ICdJbiBQcm9ncmVzcycsXG4gIGluX3JldmlldzogJ0luIFJldmlldycsXG4gIGJsb2NrZWQ6ICdCbG9ja2VkJyxcbiAgZG9uZTogJ0RvbmUnLFxuICBjYW5jZWxsZWQ6ICdDYW5jZWxsZWQnLFxuICBwcm9wb3NlZDogJ1Byb3Bvc2VkJyxcbiAgZGlzY3Vzc2luZzogJ0Rpc2N1c3NpbmcnLFxuICBhcHByb3ZlZDogJ0FwcHJvdmVkJyxcbiAgcmVqZWN0ZWQ6ICdSZWplY3RlZCcsXG4gIHJldmlzaXQ6ICdSZXZpc2l0IExhdGVyJyxcbiAgc3VwZXJzZWRlZDogJ1N1cGVyc2VkZWQnLFxuICBpZGVudGlmaWVkOiAnSWRlbnRpZmllZCcsXG4gIG5vdF9yZXF1ZXN0ZWQ6ICdOb3QgUmVxdWVzdGVkJyxcbiAgcHJlcGFyaW5nOiAnUHJlcGFyaW5nIFJlcXVlc3QnLFxuICByZXF1ZXN0ZWQ6ICdSZXF1ZXN0ZWQnLFxuICB1bmRlcl9yZXZpZXc6ICdVbmRlciBSZXZpZXcnLFxuICBpbmZvX25lZWRlZDogJ01vcmUgSW5mbyBOZWVkZWQnLFxuICBwYXJ0aWFsbHlfYXBwcm92ZWQ6ICdQYXJ0aWFsbHkgQXBwcm92ZWQnLFxuICBncmFudGVkOiAnR3JhbnRlZCcsXG4gIGRlbmllZDogJ0RlbmllZCcsXG4gIGV4cGlyZWQ6ICdFeHBpcmVkJyxcbiAgbm90X25lZWRlZDogJ05vIExvbmdlciBOZWVkZWQnLFxuICBvcGVuOiAnT3BlbicsXG4gIG1pdGlnYXRpbmc6ICdNaXRpZ2F0aW5nJyxcbiAgYWNjZXB0ZWQ6ICdBY2NlcHRlZCcsXG4gIGNsb3NlZDogJ0Nsb3NlZCcsXG4gIGFjdGl2ZTogJ0FjdGl2ZScsXG4gIHdvcmthcm91bmQ6ICdXb3JrYXJvdW5kIEluIFBsYWNlJyxcbiAgcmVzb2x2ZWQ6ICdSZXNvbHZlZCcsXG4gIGFuc3dlcmVkOiAnQW5zd2VyZWQnLFxuICBwYXJrZWQ6ICdQYXJrZWQnLFxuICBzY2hlZHVsZWQ6ICdTY2hlZHVsZWQnLFxuICBoZWxkOiAnSGVsZCcsXG4gIHN1bW1hcml6ZWQ6ICdTdW1tYXJpemVkJyxcbn07XG5cbi8qKiBTdGF0dXNlcyB0aGF0IGNvdW50IGFzIFwiY2xvc2VkL3Rlcm1pbmFsXCIgZm9yIHByb2dyZXNzICsgZGFzaGJvYXJkcy4gKi9cbmV4cG9ydCBjb25zdCBURVJNSU5BTF9TVEFUVVNFUyA9IG5ldyBTZXQoW1xuICAnZG9uZScsXG4gICdjYW5jZWxsZWQnLFxuICAncmVqZWN0ZWQnLFxuICAnc3VwZXJzZWRlZCcsXG4gICdncmFudGVkJyxcbiAgJ2RlbmllZCcsXG4gICdleHBpcmVkJyxcbiAgJ25vdF9uZWVkZWQnLFxuICAnY2xvc2VkJyxcbiAgJ3Jlc29sdmVkJyxcbiAgJ2Fuc3dlcmVkJyxcbiAgJ3N1bW1hcml6ZWQnLFxuICAnYWNjZXB0ZWQnLFxuXSk7XG5cbmV4cG9ydCBjb25zdCBQUklPUklUSUVTID0gWyd1cmdlbnQnLCAnaGlnaCcsICdtZWRpdW0nLCAnbG93JywgJ25vbmUnXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIFByaW9yaXR5ID0gKHR5cGVvZiBQUklPUklUSUVTKVtudW1iZXJdO1xuXG4vLyAtLS0tLS0tLS0tIExpbmtzIC0tLS0tLS0tLS1cbmV4cG9ydCBjb25zdCBMSU5LX0tJTkRTID0gW1xuICAncmVsYXRlcycsIC8vIGdlbmVyaWMgYmlkaXJlY3Rpb25hbFxuICAnYmxvY2tzJywgLy8gZnJvbSBibG9ja3MgdG9cbiAgJ2ltcGxlbWVudHMnLCAvLyB0YXNrIGltcGxlbWVudHMgcmVxdWlyZW1lbnQvZmVhdHVyZVxuICAnc3VwcG9ydHMnLCAvLyByZXF1aXJlbWVudCBzdXBwb3J0cyBmZWF0dXJlXG4gICdzaGFwZWRfYnknLCAvLyBpdGVtIHNoYXBlZCBieSBkZWNpc2lvblxuICAncmVxdWlyZXNfYWNjZXNzJywgLy8gaXRlbSByZXF1aXJlcyBhY2Nlc3MgcmVjb3JkXG4gICdkaXNjdXNzZWRfaW4nLCAvLyBpdGVtIGRpc2N1c3NlZCBpbiBtZWV0aW5nXG4gICd2YWxpZGF0ZXMnLCAvLyB0ZXN0L2RlZmVjdCB2YWxpZGF0ZXMgcmVxdWlyZW1lbnRcbiAgJ3N1cGVyc2VkZXMnLCAvLyBkZWNpc2lvbiBzdXBlcnNlZGVzIGRlY2lzaW9uXG4gICdwYXJlbnQnLCAvLyBmcm9tIGlzIHBhcmVudCBvZiB0byAoYWxzbyBtaXJyb3JlZCB2aWEgaXRlbXMucGFyZW50X2lkKVxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIExpbmtLaW5kID0gKHR5cGVvZiBMSU5LX0tJTkRTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgTElOS19MQUJFTDogUmVjb3JkPExpbmtLaW5kLCBbc3RyaW5nLCBzdHJpbmddPiA9IHtcbiAgLy8gW2xhYmVsIGZyb20tPnRvLCBsYWJlbCB0by0+ZnJvbV1cbiAgcmVsYXRlczogWydyZWxhdGVzIHRvJywgJ3JlbGF0ZXMgdG8nXSxcbiAgYmxvY2tzOiBbJ2Jsb2NrcycsICdibG9ja2VkIGJ5J10sXG4gIGltcGxlbWVudHM6IFsnaW1wbGVtZW50cycsICdpbXBsZW1lbnRlZCBieSddLFxuICBzdXBwb3J0czogWydzdXBwb3J0cycsICdzdXBwb3J0ZWQgYnknXSxcbiAgc2hhcGVkX2J5OiBbJ3NoYXBlZCBieScsICdzaGFwZWQnXSxcbiAgcmVxdWlyZXNfYWNjZXNzOiBbJ3JlcXVpcmVzIGFjY2VzcycsICdyZXF1aXJlZCBmb3InXSxcbiAgZGlzY3Vzc2VkX2luOiBbJ2Rpc2N1c3NlZCBpbicsICdkaXNjdXNzZWQnXSxcbiAgdmFsaWRhdGVzOiBbJ3ZhbGlkYXRlcycsICd2YWxpZGF0ZWQgYnknXSxcbiAgc3VwZXJzZWRlczogWydzdXBlcnNlZGVzJywgJ3N1cGVyc2VkZWQgYnknXSxcbiAgcGFyZW50OiBbJ3BhcmVudCBvZicsICdjaGlsZCBvZiddLFxufTtcblxuLy8gLS0tLS0tLS0tLSBDb3JlIHJlY29yZHMgLS0tLS0tLS0tLVxuZXhwb3J0IGludGVyZmFjZSBXb3JrSXRlbSB7XG4gIGlkOiBzdHJpbmc7IC8vIHV1aWQgXHUyMDE0IGNhbm9uaWNhbCBpZGVudGl0eSwgdXNlZCBieSBhbGwgcmVmZXJlbmNlc1xuICBpZGVudDogc3RyaW5nOyAvLyBkaXNwbGF5IGlkIGUuZy4gUkVRLTQxIChtYXkgYmUgcmVudW1iZXJlZCBvbiBzeW5jIGNvbGxpc2lvbilcbiAgdHlwZTogSXRlbVR5cGU7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGJvZHk6IHN0cmluZzsgLy8gcmljaCBkb2MgSlNPTiAoZWRpdG9yIGRvY3VtZW50KSwgJycgd2hlbiBlbXB0eVxuICBib2R5VGV4dDogc3RyaW5nOyAvLyBwbGFpbiB0ZXh0IHByb2plY3Rpb24gZm9yIHNlYXJjaFxuICBzdGF0dXM6IHN0cmluZztcbiAgcHJpb3JpdHk6IFByaW9yaXR5O1xuICBvd25lcklkOiBzdHJpbmcgfCBudWxsO1xuICByZXBvcnRlcklkOiBzdHJpbmcgfCBudWxsO1xuICBtaWxlc3RvbmVJZDogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZUlkOiBzdHJpbmcgfCBudWxsO1xuICBwYXJlbnRJZDogc3RyaW5nIHwgbnVsbDtcbiAgc3RhcnREYXRlOiBzdHJpbmcgfCBudWxsOyAvLyBJU08gZGF0ZVxuICBkdWVEYXRlOiBzdHJpbmcgfCBudWxsO1xuICBjb21wbGV0ZWRBdDogc3RyaW5nIHwgbnVsbDsgLy8gSVNPIGRhdGV0aW1lXG4gIGVmZm9ydDogbnVtYmVyIHwgbnVsbDsgLy8gcG9pbnRzL2RheXMsIHVuaXQgaXMgdGVhbSBjb252ZW50aW9uXG4gIGNvbmZpZGVuY2U6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCBudWxsO1xuICByaXNrTGV2ZWw6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAnY3JpdGljYWwnIHwgbnVsbDtcbiAgYnVzaW5lc3NWYWx1ZTogc3RyaW5nIHwgbnVsbDtcbiAgbGVhZGVyc2hpcFZpc2libGU6IDAgfCAxO1xuICBwcm9ncmVzczogbnVtYmVyIHwgbnVsbDsgLy8gMC0xMDAgbWFudWFsIG92ZXJyaWRlOyBudWxsID0gZGVyaXZlZFxuICB0YWdzOiBzdHJpbmdbXTtcbiAgZXh0cmE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+OyAvLyB0eXBlLXNwZWNpZmljIGZpZWxkcyAoc2VlIGRvY3MvVEVSTUlOT0xPR1kubWQpXG4gIGFyY2hpdmVkOiAwIHwgMTtcbiAgc2FtcGxlOiAwIHwgMTsgLy8gc2VlZGVkIHNhbXBsZSBkYXRhIGZsYWdcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xuICBjcmVhdGVkQnk6IHN0cmluZztcbiAgdXBkYXRlZEJ5OiBzdHJpbmc7XG59XG5cbi8vIFR5cGUtc3BlY2lmaWMgYGV4dHJhYCBzaGFwZXMgKGRvY3VtZW50ZWQsIG5vdCBlbmZvcmNlZCBieSBEQik6XG4vLyBhY2Nlc3M6ICAgeyBzeXN0ZW0sIGFjY2Vzc1R5cGUsIGJ1c2luZXNzUmVhc29uLCByZXF1ZXN0ZWRGcm9tLCByZXF1ZXN0RGF0ZSxcbi8vICAgICAgICAgICAgIGFwcHJvdmVkQnksIGRhdGVHcmFudGVkLCBleHBpcmF0aW9uRGF0ZSwgcmVuZXdhbERhdGUsIHNlY3VyaXR5Tm90ZXMsIG5leHRBY3Rpb24sIGZvbGxvd1VwRGF0ZSB9XG4vLyBkZWNpc2lvbjogeyBjb250ZXh0LCBwcm9ibGVtLCBvcHRpb25zOiBbe3RpdGxlLCBub3Rlcywgc2VsZWN0ZWR9XSwgcmVhc29uaW5nLFxuLy8gICAgICAgICAgICAgdHJhZGVvZmZzLCBjb25zZXF1ZW5jZXMsIHJldmlld0RhdGUsIGNvbnRyaWJ1dG9yczogc3RyaW5nW10gfVxuLy8gbWVldGluZzogIHsgZGF0ZSwgdGltZSwgYXR0ZW5kZWVzOiBzdHJpbmdbXSwgcHVycG9zZSwgYWdlbmRhLCBmb2xsb3dVcERhdGUgfVxuLy8gcmlzazogICAgIHsgbGlrZWxpaG9vZCwgaW1wYWN0LCBtaXRpZ2F0aW9uLCB0cmlnZ2VyIH1cbi8vIGJsb2NrZXI6ICB7IHdhaXRpbmdPbiwgc2luY2UsIGVzY2FsYXRlZFRvIH1cbi8vIHJlcXVpcmVtZW50OiB7IGFjY2VwdGFuY2VDcml0ZXJpYSwgdGVzdGluZ05vdGVzLCBzZWN1cml0eUNvbnNpZGVyYXRpb25zIH1cblxuZXhwb3J0IGludGVyZmFjZSBJdGVtTGluayB7XG4gIGlkOiBzdHJpbmc7XG4gIGZyb21JZDogc3RyaW5nO1xuICB0b0lkOiBzdHJpbmc7XG4gIGtpbmQ6IExpbmtLaW5kO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgY3JlYXRlZEJ5OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tbWVudCB7XG4gIGlkOiBzdHJpbmc7XG4gIGl0ZW1JZDogc3RyaW5nO1xuICBhdXRob3JJZDogc3RyaW5nO1xuICBib2R5OiBzdHJpbmc7IC8vIHJpY2ggZG9jIEpTT05cbiAgYm9keVRleHQ6IHN0cmluZztcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nIHwgbnVsbDtcbiAgdXBkYXRlZEJ5Pzogc3RyaW5nIHwgbnVsbDtcbiAgZGVsZXRlZDogMCB8IDE7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXR0YWNobWVudCB7XG4gIGlkOiBzdHJpbmc7XG4gIGl0ZW1JZDogc3RyaW5nO1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICBtaW1lOiBzdHJpbmc7XG4gIHNpemU6IG51bWJlcjtcbiAgc2hhMjU2OiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCBudWxsO1xuICB1cGxvYWRlZEJ5OiBzdHJpbmc7XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xuICBkZWxldGVkOiAwIHwgMTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBY3Rpdml0eUVudHJ5IHtcbiAgaWQ6IHN0cmluZztcbiAgaXRlbUlkOiBzdHJpbmcgfCBudWxsO1xuICBhY3RvcklkOiBzdHJpbmc7XG4gIGtpbmQ6IHN0cmluZzsgLy8gY3JlYXRlZCB8IHVwZGF0ZWQgfCBzdGF0dXMgfCBjb21tZW50IHwgbGluayB8IGF0dGFjaG1lbnQgfCBhcmNoaXZlZCB8IHJlc3RvcmVkIHwgLi4uXG4gIGZpZWxkOiBzdHJpbmcgfCBudWxsO1xuICBvbGRWYWx1ZTogc3RyaW5nIHwgbnVsbDtcbiAgbmV3VmFsdWU6IHN0cmluZyB8IG51bGw7XG4gIGF0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSXRlbVZlcnNpb24ge1xuICBpZDogc3RyaW5nO1xuICBpdGVtSWQ6IHN0cmluZztcbiAgdmVyc2lvbjogbnVtYmVyO1xuICB0aXRsZTogc3RyaW5nO1xuICBib2R5OiBzdHJpbmc7XG4gIHNhdmVkQnk6IHN0cmluZztcbiAgc2F2ZWRBdDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbGVzdG9uZSB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgdGFyZ2V0RGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgc3RhdHVzOiAncGxhbm5lZCcgfCAnYWN0aXZlJyB8ICdkb25lJztcbiAgc29ydDogbnVtYmVyO1xuICBzYW1wbGU6IDAgfCAxO1xuICBjcmVhdGVkQXQ/OiBzdHJpbmc7XG4gIGNyZWF0ZWRCeT86IHN0cmluZztcbiAgdXBkYXRlZEF0Pzogc3RyaW5nO1xuICB1cGRhdGVkQnk/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVsZWFzZSB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgdmVyc2lvbjogc3RyaW5nO1xuICB0YXJnZXREYXRlOiBzdHJpbmcgfCBudWxsO1xuICBzdGF0dXM6ICdwbGFubmVkJyB8ICdpbl9wcm9ncmVzcycgfCAncmVsZWFzZWQnIHwgJ2NhbmNlbGxlZCc7XG4gIGdvYWxzOiBzdHJpbmc7XG4gIG5vdGVzOiBzdHJpbmc7IC8vIHJlbGVhc2Ugbm90ZXMgcmljaCBkb2NcbiAgc2FtcGxlOiAwIHwgMTtcbiAgY3JlYXRlZEF0Pzogc3RyaW5nO1xuICBjcmVhdGVkQnk/OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdD86IHN0cmluZztcbiAgdXBkYXRlZEJ5Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVzZXIge1xuICBpZDogc3RyaW5nOyAvLyBzdGFibGUgc2x1ZywgZS5nLiAnam9obicsICdtYXJrJ1xuICBuYW1lOiBzdHJpbmc7XG4gIGluaXRpYWxzOiBzdHJpbmc7XG4gIGNvbG9yOiBzdHJpbmc7XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNhdmVkVmlldyB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgY29uZmlnOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjsgLy8ge3ZpZXcsIGZpbHRlcnMsIHNvcnQsIGdyb3VwfVxuICBwaW5uZWQ6IDAgfCAxO1xuICBjcmVhdGVkQnk6IHN0cmluZztcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG59XG5cbi8vIC0tLS0tLS0tLS0gU3luYyAtLS0tLS0tLS0tXG5leHBvcnQgaW50ZXJmYWNlIE9wIHtcbiAgb3BJZDogc3RyaW5nOyAvLyB1dWlkXG4gIGRldmljZUlkOiBzdHJpbmc7XG4gIGFjdG9ySWQ6IHN0cmluZztcbiAgbGFtcG9ydDogbnVtYmVyO1xuICBhdDogc3RyaW5nOyAvLyB3YWxsIGNsb2NrLCBpbmZvcm1hdGlvbmFsIG9ubHkgXHUyMDE0IG9yZGVyaW5nIHVzZXMgbGFtcG9ydFxuICBlbnRpdHk6ICdpdGVtJyB8ICdsaW5rJyB8ICdjb21tZW50JyB8ICdhdHRhY2htZW50JyB8ICdtaWxlc3RvbmUnIHwgJ3JlbGVhc2UnIHwgJ3VzZXInIHwgJ3NhdmVkX3ZpZXcnIHwgJ3RhZ3NldCc7XG4gIGVudGl0eUlkOiBzdHJpbmc7XG4gIGFjdGlvbjogJ2NyZWF0ZScgfCAnc2V0JyB8ICdkZWxldGUnO1xuICAvLyBjcmVhdGU6IHBheWxvYWQgPSBmdWxsIHJlY29yZC4gc2V0OiBwYXlsb2FkID0ge2ZpZWxkOiB2YWx1ZSwuLi59LiBkZWxldGU6IHBheWxvYWQgPSB7fS5cbiAgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3luY0NvbmZsaWN0IHtcbiAgaWQ6IHN0cmluZztcbiAgZW50aXR5OiBzdHJpbmc7XG4gIGVudGl0eUlkOiBzdHJpbmc7XG4gIGZpZWxkOiBzdHJpbmc7XG4gIGxvY2FsVmFsdWU6IHN0cmluZztcbiAgcmVtb3RlVmFsdWU6IHN0cmluZztcbiAgcmVtb3RlRGV2aWNlOiBzdHJpbmc7XG4gIHJlbW90ZUFjdG9yOiBzdHJpbmc7XG4gIGRldGVjdGVkQXQ6IHN0cmluZztcbiAgcmVzb2x2ZWRBdDogc3RyaW5nIHwgbnVsbDtcbiAgcmVzb2x1dGlvbjogJ2xvY2FsJyB8ICdyZW1vdGUnIHwgJ21lcmdlZCcgfCBudWxsO1xufVxuXG5leHBvcnQgdHlwZSBTeW5jU3RhdHVzU3RhdGUgPSAnZGlzYWJsZWQnIHwgJ2lkbGUnIHwgJ3N5bmNpbmcnIHwgJ29mZmxpbmUnIHwgJ2Vycm9yJztcbmV4cG9ydCBpbnRlcmZhY2UgU3luY1N0YXR1cyB7XG4gIHN0YXRlOiBTeW5jU3RhdHVzU3RhdGU7XG4gIGZvbGRlcjogc3RyaW5nIHwgbnVsbDtcbiAgbGFzdFN5bmNBdDogc3RyaW5nIHwgbnVsbDtcbiAgbGFzdEVycm9yOiBzdHJpbmcgfCBudWxsO1xuICBwZW5kaW5nT3BzOiBudW1iZXI7XG4gIG9wZW5Db25mbGljdHM6IG51bWJlcjtcbiAgcGVlcnM6IHsgZGV2aWNlSWQ6IHN0cmluZzsgdXNlck5hbWU6IHN0cmluZyB8IG51bGw7IGxhc3RTZWVuQXQ6IHN0cmluZyB8IG51bGwgfVtdO1xufVxuXG4vLyAtLS0tLS0tLS0tIFF1ZXJpZXMgLS0tLS0tLS0tLVxuZXhwb3J0IGludGVyZmFjZSBJdGVtRmlsdGVyIHtcbiAgdHlwZXM/OiBJdGVtVHlwZVtdO1xuICBzdGF0dXNlcz86IHN0cmluZ1tdO1xuICBwcmlvcml0aWVzPzogUHJpb3JpdHlbXTtcbiAgb3duZXJJZHM/OiAoc3RyaW5nIHwgbnVsbClbXTtcbiAgbWlsZXN0b25lSWQ/OiBzdHJpbmc7XG4gIHJlbGVhc2VJZD86IHN0cmluZztcbiAgdGFnPzogc3RyaW5nO1xuICB0ZXh0Pzogc3RyaW5nOyAvLyBGVFMgcXVlcnlcbiAgYXJjaGl2ZWQ/OiBib29sZWFuOyAvLyBkZWZhdWx0IGZhbHNlXG4gIG92ZXJkdWU/OiBib29sZWFuO1xuICBkdWVXaXRoaW5EYXlzPzogbnVtYmVyO1xuICBsZWFkZXJzaGlwVmlzaWJsZT86IGJvb2xlYW47XG4gIHVwZGF0ZWRTaW5jZT86IHN0cmluZztcbiAgcGFyZW50SWQ/OiBzdHJpbmc7XG4gIHNhbXBsZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSXRlbVNvcnQge1xuICBmaWVsZDogJ2lkZW50JyB8ICd0aXRsZScgfCAnc3RhdHVzJyB8ICdwcmlvcml0eScgfCAnZHVlRGF0ZScgfCAnY3JlYXRlZEF0JyB8ICd1cGRhdGVkQXQnIHwgJ21hbnVhbCc7XG4gIGRpcjogJ2FzYycgfCAnZGVzYyc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoUmVzdWx0IHtcbiAgaXRlbTogV29ya0l0ZW07XG4gIHNuaXBwZXQ6IHN0cmluZyB8IG51bGw7XG4gIHNjb3JlOiBudW1iZXI7XG59XG4iLCAiLy8gUmljaC1kb2MgaGVscGVycyBzaGFyZWQgYnkgbWFpbiBwcm9jZXNzIGFuZCByZW5kZXJlci5cblxuLyoqIEV4dHJhY3QgcGxhaW4gdGV4dCBmcm9tIGEgc3RvcmVkIGVkaXRvciBkb2N1bWVudCAoVGlwVGFwIEpTT04gc3RyaW5nKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkb2NUb1RleHQoYm9keTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFib2R5KSByZXR1cm4gJyc7XG4gIHRyeSB7XG4gICAgY29uc3QgZG9jID0gSlNPTi5wYXJzZShib2R5KSBhcyB7IGNvbnRlbnQ/OiB1bmtub3duW10gfTtcbiAgICBjb25zdCB3YWxrID0gKG5vZGVzOiB1bmtub3duW10pOiBzdHJpbmcgPT5cbiAgICAgIG5vZGVzXG4gICAgICAgIC5tYXAoKG4pID0+IHtcbiAgICAgICAgICBjb25zdCBub2RlID0gbiBhcyB7IHR5cGU/OiBzdHJpbmc7IHRleHQ/OiBzdHJpbmc7IGNvbnRlbnQ/OiB1bmtub3duW10gfTtcbiAgICAgICAgICBpZiAobm9kZS50ZXh0KSByZXR1cm4gbm9kZS50ZXh0O1xuICAgICAgICAgIGNvbnN0IGlubmVyID0gbm9kZS5jb250ZW50ID8gd2Fsayhub2RlLmNvbnRlbnQpIDogJyc7XG4gICAgICAgICAgcmV0dXJuIG5vZGUudHlwZSA9PT0gJ3BhcmFncmFwaCcgfHwgbm9kZS50eXBlPy5zdGFydHNXaXRoKCdoZWFkaW5nJykgPyBpbm5lciArICdcXG4nIDogaW5uZXI7XG4gICAgICAgIH0pXG4gICAgICAgIC5qb2luKCcnKTtcbiAgICByZXR1cm4gd2Fsayhkb2MuY29udGVudCA/PyBbXSkudHJpbSgpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gYm9keTtcbiAgfVxufVxuXG4vKiogV3JhcCBwbGFpbiB0ZXh0IGludG8gYSBtaW5pbWFsIGVkaXRvciBkb2N1bWVudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0VG9Eb2ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICB0eXBlOiAnZG9jJyxcbiAgICBjb250ZW50OiB0ZXh0LnNwbGl0KC9cXG57Mix9LykubWFwKChwKSA9PiAoe1xuICAgICAgdHlwZTogJ3BhcmFncmFwaCcsXG4gICAgICBjb250ZW50OiBwID8gW3sgdHlwZTogJ3RleHQnLCB0ZXh0OiBwIH1dIDogW10sXG4gICAgfSkpLFxuICB9KTtcbn1cbiIsICIvLyBTeW5jVHJhbnNwb3J0OiB0aGUgc2VhbSBiZXR3ZWVuIFRldGhlciBhbmQgd2hhdGV2ZXIgbW92ZXMgYnl0ZXMgYmV0d2VlbiBtYWNoaW5lcy5cbi8vIHYxIHNoaXBzIEZvbGRlclRyYW5zcG9ydCAoYSBPbmVEcml2ZS9TaGFyZVBvaW50LXN5bmNlZCBmb2xkZXIpLiBUaGUgaW50ZXJmYWNlIGlzXG4vLyBkZWxpYmVyYXRlbHkgZHVtYiBcdTIwMTQgYXBwZW5kLW9ubHkgYmF0Y2hlcyBvdXQsIGJhdGNoZXMgaW4gXHUyMDE0IHNvIGEgZnV0dXJlIEF6dXJlIFNRTCAvXG4vLyBEYXRhdmVyc2UgLyBpbnRlcm5hbCBBUEkgdHJhbnNwb3J0IHNsb3RzIGluIHdpdGhvdXQgdG91Y2hpbmcgbWVyZ2UgbG9naWMuXG5cbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgdHlwZSB7IE9wIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcblxuZXhwb3J0IGludGVyZmFjZSBQZWVySW5mbyB7XG4gIGRldmljZUlkOiBzdHJpbmc7XG4gIHVzZXJOYW1lOiBzdHJpbmcgfCBudWxsO1xuICBsYXN0U2VlbkF0OiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9wQmF0Y2hGaWxlIHtcbiAgZGV2aWNlSWQ6IHN0cmluZztcbiAgZmlsZU5hbWU6IHN0cmluZzsgLy8gc29ydGFibGUsIHVuaXF1ZSBwZXIgZGV2aWNlXG4gIG9wczogT3BbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTeW5jVHJhbnNwb3J0IHtcbiAgLyoqIEh1bWFuLXJlYWRhYmxlIGxvY2F0aW9uIGZvciB0aGUgVUkgKFwid2hlcmUgaXMgbXkgZGF0YVwiKS4gKi9cbiAgbG9jYXRpb24oKTogc3RyaW5nO1xuICAvKiogVHJ1ZSB3aGVuIHRoZSBiYWNraW5nIG1lZGl1bSBpcyByZWFjaGFibGUgcmlnaHQgbm93LiAqL1xuICBhdmFpbGFibGUoKTogYm9vbGVhbjtcbiAgLyoqIFB1Ymxpc2ggYSBiYXRjaCBvZiB0aGlzIGRldmljZSdzIG9wcy4gTXVzdCBiZSBhdG9taWMgKGFsbC1vci1ub3RoaW5nIHZpc2libGUpLiAqL1xuICBwdWJsaXNoT3BzKGRldmljZUlkOiBzdHJpbmcsIGJhdGNoTmFtZTogc3RyaW5nLCBvcHM6IE9wW10pOiBQcm9taXNlPHZvaWQ+O1xuICAvKiogTGlzdCBwZWVyIGJhdGNoIGZpbGUgbmFtZXMgKHNvcnRlZCBhc2NlbmRpbmcpIG5ld2VyIHRoYW4gYGFmdGVyRmlsZWAgZm9yIGVhY2ggcGVlci4gKi9cbiAgbGlzdFBlZXJCYXRjaGVzKG93bkRldmljZUlkOiBzdHJpbmcsIGFmdGVyRmlsZUJ5RGV2aWNlOiBNYXA8c3RyaW5nLCBzdHJpbmcgfCBudWxsPik6IFByb21pc2U8eyBkZXZpY2VJZDogc3RyaW5nOyBmaWxlTmFtZTogc3RyaW5nIH1bXT47XG4gIC8qKiBGZXRjaCBvbmUgYmF0Y2guICovXG4gIGZldGNoQmF0Y2goZGV2aWNlSWQ6IHN0cmluZywgZmlsZU5hbWU6IHN0cmluZyk6IFByb21pc2U8T3BbXT47XG4gIC8qKiBBbm5vdW5jZSBwcmVzZW5jZSAob3duIGZpbGUgb25seSBcdTIwMTQgbm8gd3JpdGUgY29udGVudGlvbikuICovXG4gIGFubm91bmNlKGRldmljZUlkOiBzdHJpbmcsIHVzZXJOYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xuICAvKiogQWxsIGFubm91bmNlZCBkZXZpY2VzLiAqL1xuICBsaXN0UGVlcnMoKTogUHJvbWlzZTxQZWVySW5mb1tdPjtcbiAgLyoqIFN0b3JlIGFuIGF0dGFjaG1lbnQgYmxvYiBjb250ZW50LWFkZHJlc3NlZCBieSBzaGEyNTYuIFJldHVybnMgdHJ1ZSBpZiBuZXdseSBzdG9yZWQuICovXG4gIHB1dEJsb2Ioc2hhMjU2OiBzdHJpbmcsIGRhdGE6IEJ1ZmZlcik6IFByb21pc2U8Ym9vbGVhbj47XG4gIC8qKiBGZXRjaCBhbiBhdHRhY2htZW50IGJsb2IsIG51bGwgaWYgbm90ICh5ZXQpIHByZXNlbnQuICovXG4gIGdldEJsb2Ioc2hhMjU2OiBzdHJpbmcpOiBQcm9taXNlPEJ1ZmZlciB8IG51bGw+O1xufVxuXG4vKipcbiAqIEZvbGRlclRyYW5zcG9ydCBcdTIwMTQgc2hhcmVkLWZvbGRlciBsYXlvdXQ6XG4gKiAgIDxyb290Pi9vcHMvPGRldmljZUlkPi8wMDAwMDAwMDAwMS5qc29ubCAgIG9wIGJhdGNoZXMsIG9uZSBKU09OIG9wIHBlciBsaW5lXG4gKiAgIDxyb290Pi9vcHMvPGRldmljZUlkPi9kZXZpY2UuanNvbiAgICAgICAgICBwcmVzZW5jZSArIGlkZW50aXR5XG4gKiAgIDxyb290Pi9ibG9icy88YWE+LzxzaGEyNTY+ICAgICAgICAgICAgICAgICBjb250ZW50LWFkZHJlc3NlZCBhdHRhY2htZW50c1xuICpcbiAqIENvcnJlY3RuZXNzIHJ1bGVzOlxuICogLSBBIGRldmljZSB3cml0ZXMgT05MWSB1bmRlciBpdHMgb3duIG9wcy88ZGV2aWNlSWQ+LyBkaXJlY3RvcnkgXHUyMTkyIG5vIHdyaXRlIGNvbnRlbnRpb24sXG4gKiAgIG5vIHNoYXJlZC1maWxlIGxvY2tpbmcsIG5vIFNRTGl0ZS1vdmVyLU9uZURyaXZlIGNvcnJ1cHRpb24gY2xhc3MuXG4gKiAtIEZpbGVzIGFyZSB3cml0dGVuIHRvIGEgdGVtcCBuYW1lIHRoZW4gcmVuYW1lZCBcdTIxOTIgcmVhZGVycyBuZXZlciBzZWUgcGFydGlhbCBiYXRjaGVzLlxuICogLSBCYXRjaGVzIGFyZSBpbW11dGFibGUgb25jZSBwdWJsaXNoZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBGb2xkZXJUcmFuc3BvcnQgaW1wbGVtZW50cyBTeW5jVHJhbnNwb3J0IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByb290OiBzdHJpbmcpIHt9XG5cbiAgbG9jYXRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5yb290O1xuICB9XG5cbiAgYXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBmcy5ta2RpclN5bmMocGF0aC5qb2luKHRoaXMucm9vdCwgJ29wcycpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb3BzRGlyKGRldmljZUlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBwYXRoLmpvaW4odGhpcy5yb290LCAnb3BzJywgZGV2aWNlSWQpO1xuICB9XG5cbiAgYXN5bmMgcHVibGlzaE9wcyhkZXZpY2VJZDogc3RyaW5nLCBiYXRjaE5hbWU6IHN0cmluZywgb3BzOiBPcFtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGlyID0gdGhpcy5vcHNEaXIoZGV2aWNlSWQpO1xuICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGNvbnN0IGZpbmFsUGF0aCA9IHBhdGguam9pbihkaXIsIGJhdGNoTmFtZSk7XG4gICAgY29uc3QgdG1wUGF0aCA9IGZpbmFsUGF0aCArICcudG1wJztcbiAgICBjb25zdCBsaW5lcyA9IG9wcy5tYXAoKG8pID0+IEpTT04uc3RyaW5naWZ5KG8pKS5qb2luKCdcXG4nKSArICdcXG4nO1xuICAgIGZzLndyaXRlRmlsZVN5bmModG1wUGF0aCwgbGluZXMsICd1dGY4Jyk7XG4gICAgZnMucmVuYW1lU3luYyh0bXBQYXRoLCBmaW5hbFBhdGgpO1xuICB9XG5cbiAgYXN5bmMgbGlzdFBlZXJCYXRjaGVzKFxuICAgIG93bkRldmljZUlkOiBzdHJpbmcsXG4gICAgYWZ0ZXJGaWxlQnlEZXZpY2U6IE1hcDxzdHJpbmcsIHN0cmluZyB8IG51bGw+LFxuICApOiBQcm9taXNlPHsgZGV2aWNlSWQ6IHN0cmluZzsgZmlsZU5hbWU6IHN0cmluZyB9W10+IHtcbiAgICBjb25zdCBvcHNSb290ID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ29wcycpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhvcHNSb290KSkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IG91dDogeyBkZXZpY2VJZDogc3RyaW5nOyBmaWxlTmFtZTogc3RyaW5nIH1bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgZGV2IG9mIGZzLnJlYWRkaXJTeW5jKG9wc1Jvb3QsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KSkge1xuICAgICAgaWYgKCFkZXYuaXNEaXJlY3RvcnkoKSB8fCBkZXYubmFtZSA9PT0gb3duRGV2aWNlSWQpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgYWZ0ZXIgPSBhZnRlckZpbGVCeURldmljZS5nZXQoZGV2Lm5hbWUpID8/IG51bGw7XG4gICAgICBjb25zdCBmaWxlcyA9IGZzXG4gICAgICAgIC5yZWFkZGlyU3luYyhwYXRoLmpvaW4ob3BzUm9vdCwgZGV2Lm5hbWUpKVxuICAgICAgICAuZmlsdGVyKChmKSA9PiBmLmVuZHNXaXRoKCcuanNvbmwnKSlcbiAgICAgICAgLnNvcnQoKTtcbiAgICAgIGZvciAoY29uc3QgZiBvZiBmaWxlcykge1xuICAgICAgICBpZiAoYWZ0ZXIgJiYgZiA8PSBhZnRlcikgY29udGludWU7XG4gICAgICAgIG91dC5wdXNoKHsgZGV2aWNlSWQ6IGRldi5uYW1lLCBmaWxlTmFtZTogZiB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGFzeW5jIGZldGNoQmF0Y2goZGV2aWNlSWQ6IHN0cmluZywgZmlsZU5hbWU6IHN0cmluZyk6IFByb21pc2U8T3BbXT4ge1xuICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4odGhpcy5vcHNEaXIoZGV2aWNlSWQpLCBmaWxlTmFtZSk7XG4gICAgY29uc3QgdGV4dCA9IGZzLnJlYWRGaWxlU3luYyhwLCAndXRmOCcpO1xuICAgIGNvbnN0IG9wczogT3BbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgbGluZSBvZiB0ZXh0LnNwbGl0KCdcXG4nKSkge1xuICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgICAgaWYgKCF0cmltbWVkKSBjb250aW51ZTtcbiAgICAgIG9wcy5wdXNoKEpTT04ucGFyc2UodHJpbW1lZCkgYXMgT3ApO1xuICAgIH1cbiAgICByZXR1cm4gb3BzO1xuICB9XG5cbiAgYXN5bmMgYW5ub3VuY2UoZGV2aWNlSWQ6IHN0cmluZywgdXNlck5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGRpciA9IHRoaXMub3BzRGlyKGRldmljZUlkKTtcbiAgICBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zdCBwID0gcGF0aC5qb2luKGRpciwgJ2RldmljZS5qc29uJyk7XG4gICAgY29uc3QgdG1wID0gcCArICcudG1wJztcbiAgICBmcy53cml0ZUZpbGVTeW5jKHRtcCwgSlNPTi5zdHJpbmdpZnkoeyBkZXZpY2VJZCwgdXNlck5hbWUsIGxhc3RTZWVuQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9KSwgJ3V0ZjgnKTtcbiAgICBmcy5yZW5hbWVTeW5jKHRtcCwgcCk7XG4gIH1cblxuICBhc3luYyBsaXN0UGVlcnMoKTogUHJvbWlzZTxQZWVySW5mb1tdPiB7XG4gICAgY29uc3Qgb3BzUm9vdCA9IHBhdGguam9pbih0aGlzLnJvb3QsICdvcHMnKTtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMob3BzUm9vdCkpIHJldHVybiBbXTtcbiAgICBjb25zdCBwZWVyczogUGVlckluZm9bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgZGV2IG9mIGZzLnJlYWRkaXJTeW5jKG9wc1Jvb3QsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KSkge1xuICAgICAgaWYgKCFkZXYuaXNEaXJlY3RvcnkoKSkgY29udGludWU7XG4gICAgICBjb25zdCBwID0gcGF0aC5qb2luKG9wc1Jvb3QsIGRldi5uYW1lLCAnZGV2aWNlLmpzb24nKTtcbiAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwKSkge1xuICAgICAgICBwZWVycy5wdXNoKHsgZGV2aWNlSWQ6IGRldi5uYW1lLCB1c2VyTmFtZTogbnVsbCwgbGFzdFNlZW5BdDogbnVsbCB9KTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBpbmZvID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocCwgJ3V0ZjgnKSkgYXMgUGVlckluZm87XG4gICAgICAgIHBlZXJzLnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIHVzZXJOYW1lOiBpbmZvLnVzZXJOYW1lID8/IG51bGwsIGxhc3RTZWVuQXQ6IGluZm8ubGFzdFNlZW5BdCA/PyBudWxsIH0pO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHBlZXJzLnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIHVzZXJOYW1lOiBudWxsLCBsYXN0U2VlbkF0OiBudWxsIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cblxuICBhc3luYyBwdXRCbG9iKHNoYTI1Njogc3RyaW5nLCBkYXRhOiBCdWZmZXIpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBkaXIgPSBwYXRoLmpvaW4odGhpcy5yb290LCAnYmxvYnMnLCBzaGEyNTYuc2xpY2UoMCwgMikpO1xuICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4oZGlyLCBzaGEyNTYpO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKHApKSByZXR1cm4gZmFsc2U7XG4gICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgY29uc3QgdG1wID0gcCArICcudG1wLScgKyBwcm9jZXNzLnBpZDtcbiAgICBmcy53cml0ZUZpbGVTeW5jKHRtcCwgZGF0YSk7XG4gICAgdHJ5IHtcbiAgICAgIGZzLnJlbmFtZVN5bmModG1wLCBwKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGZzLnJtU3luYyh0bXAsIHsgZm9yY2U6IHRydWUgfSk7IC8vIHBlZXIgd29uIHRoZSByYWNlOyBjb250ZW50LWFkZHJlc3NlZCBzbyBpZGVudGljYWxcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBnZXRCbG9iKHNoYTI1Njogc3RyaW5nKTogUHJvbWlzZTxCdWZmZXIgfCBudWxsPiB7XG4gICAgY29uc3QgcCA9IHBhdGguam9pbih0aGlzLnJvb3QsICdibG9icycsIHNoYTI1Ni5zbGljZSgwLCAyKSwgc2hhMjU2KTtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMocCkpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMocCk7XG4gIH1cbn1cbiIsICIvLyBTeW5jRW5naW5lOiBwZXJpb2RpYyArIGV2ZW50LWRyaXZlbiBleHBvcnQvaW1wb3J0IGxvb3Agb3ZlciBhIFN5bmNUcmFuc3BvcnQuXG4vLyBMb2NhbC1maXJzdDogdGhlIGFwcCBpcyBmdWxseSB1c2FibGUgd2l0aCBzeW5jIGRpc2FibGVkIG9yIHRoZSBmb2xkZXIgb2ZmbGluZTtcbi8vIG9wcyBxdWV1ZSBpbiB0aGUgb3Bsb2cgYW5kIGZsdXNoIHdoZW4gdGhlIHRyYW5zcG9ydCByZXR1cm5zLlxuXG5pbXBvcnQgdHlwZSB7IFN0b3JlIH0gZnJvbSAnLi4vZGIvc3RvcmUnO1xuaW1wb3J0IHsgZ2V0TWV0YSwgc2V0TWV0YSB9IGZyb20gJy4uL2RiL2RiJztcbmltcG9ydCB0eXBlIHsgU3luY1RyYW5zcG9ydCB9IGZyb20gJy4vdHJhbnNwb3J0JztcbmltcG9ydCB0eXBlIHsgU3luY1N0YXR1cywgU3luY1N0YXR1c1N0YXRlIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcblxuY29uc3QgRVhQT1JUX0RFQk9VTkNFX01TID0gMV81MDA7XG5jb25zdCBQT0xMX0lOVEVSVkFMX01TID0gNV8wMDA7XG5cbmV4cG9ydCBjbGFzcyBTeW5jRW5naW5lIHtcbiAgcHJpdmF0ZSB0cmFuc3BvcnQ6IFN5bmNUcmFuc3BvcnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB0aW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBleHBvcnRUaW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBydW5uaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgY3VycmVudDogUHJvbWlzZTx2b2lkPiA9IFByb21pc2UucmVzb2x2ZSgpO1xuICBwcml2YXRlIHN0YXRlOiBTeW5jU3RhdHVzU3RhdGUgPSAnZGlzYWJsZWQnO1xuICBwcml2YXRlIGxhc3RFcnJvcjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbGFzdFN5bmNBdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdXNlck5hbWU6IHN0cmluZztcbiAgcHJpdmF0ZSBvblN0YXR1czogKHM6IFN5bmNTdGF0dXMpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBzdG9yZTogU3RvcmUsXG4gICAgdXNlck5hbWU6IHN0cmluZyxcbiAgICBvblN0YXR1czogKHM6IFN5bmNTdGF0dXMpID0+IHZvaWQsXG4gICkge1xuICAgIHRoaXMudXNlck5hbWUgPSB1c2VyTmFtZTtcbiAgICB0aGlzLm9uU3RhdHVzID0gb25TdGF0dXM7XG4gIH1cblxuICBzZXRUcmFuc3BvcnQodHJhbnNwb3J0OiBTeW5jVHJhbnNwb3J0IHwgbnVsbCk6IHZvaWQge1xuICAgIHRoaXMudHJhbnNwb3J0ID0gdHJhbnNwb3J0O1xuICAgIGlmICh0aGlzLnRpbWVyKSBjbGVhckludGVydmFsKHRoaXMudGltZXIpO1xuICAgIHRoaXMudGltZXIgPSBudWxsO1xuICAgIGlmICh0cmFuc3BvcnQpIHtcbiAgICAgIC8vIFN5bmMgY3Vyc29ycyBiZWxvbmcgdG8gYSBzcGVjaWZpYyBmb2xkZXIuIFBvaW50aW5nIGF0IGEgZGlmZmVyZW50IGZvbGRlclxuICAgICAgLy8gbXVzdCByZS1wdWJsaXNoIGV2ZXJ5dGhpbmcgKG9wLWlkIGRlZHVwIG1ha2VzIHRoYXQgc2FmZSkgYW5kIHJlLWltcG9ydFxuICAgICAgLy8gcGVlcnMgZnJvbSBzY3JhdGNoIFx1MjAxNCBvdGhlcndpc2UgdGhlIG5ldyBmb2xkZXIgZ2V0cyBhIHBlcm1hbmVudGx5XG4gICAgICAvLyBpbmNvbXBsZXRlIGRhdGFzZXQuXG4gICAgICBjb25zdCBmb2xkZXJLZXkgPSB0cmFuc3BvcnQubG9jYXRpb24oKTtcbiAgICAgIGNvbnN0IGtub3duRm9sZGVyID0gZ2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnc3luY19mb2xkZXJfa2V5Jyk7XG4gICAgICBpZiAoa25vd25Gb2xkZXIgIT09IGZvbGRlcktleSkge1xuICAgICAgICBzZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdsYXN0X2V4cG9ydGVkX3NlcScsICcwJyk7XG4gICAgICAgIHRoaXMuc3RvcmUuZGIucHJlcGFyZSgnREVMRVRFIEZST00gc3luY19wZWVycycpLnJ1bigpO1xuICAgICAgICBzZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdzeW5jX2ZvbGRlcl9rZXknLCBmb2xkZXJLZXkpO1xuICAgICAgfVxuICAgICAgdGhpcy5zdGF0ZSA9ICdpZGxlJztcbiAgICAgIHRoaXMudGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB2b2lkIHRoaXMuY3ljbGUoKSwgUE9MTF9JTlRFUlZBTF9NUyk7XG4gICAgICB2b2lkIHRoaXMuY3ljbGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZSA9ICdkaXNhYmxlZCc7XG4gICAgICB0aGlzLmVtaXRTdGF0dXMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBhbm5vdW5jZWQgZGlzcGxheSBuYW1lIChpZGVudGl0eSBjYW4gYmUgc2V0IGFmdGVyIGJvb3QpLiAqL1xuICBzZXRVc2VyTmFtZShuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnVzZXJOYW1lID0gbmFtZTtcbiAgfVxuXG4gIC8qKiBDYWxsIGFmdGVyIGFueSBsb2NhbCBtdXRhdGlvbiBcdTIwMTQgZGVib3VuY2VkIGV4cG9ydCBzbyByYXBpZCBlZGl0cyBiYXRjaC4gKi9cbiAgbm90ZUxvY2FsQ2hhbmdlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy50cmFuc3BvcnQpIHJldHVybjtcbiAgICBpZiAodGhpcy5leHBvcnRUaW1lcikgY2xlYXJUaW1lb3V0KHRoaXMuZXhwb3J0VGltZXIpO1xuICAgIHRoaXMuZXhwb3J0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHZvaWQgdGhpcy5jeWNsZSgpLCBFWFBPUlRfREVCT1VOQ0VfTVMpO1xuICB9XG5cbiAgYXN5bmMgY3ljbGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnRyYW5zcG9ydCB8fCB0aGlzLnJ1bm5pbmcpIHJldHVybiB0aGlzLmN1cnJlbnQ7XG4gICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgcmVsZWFzZSE6ICgpID0+IHZvaWQ7XG4gICAgdGhpcy5jdXJyZW50ID0gbmV3IFByb21pc2UoKHIpID0+IChyZWxlYXNlID0gcikpO1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMudHJhbnNwb3J0LmF2YWlsYWJsZSgpKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoJ29mZmxpbmUnLCAnU3luYyBmb2xkZXIgaXMgbm90IHJlYWNoYWJsZScpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnNldFN0YXRlKCdzeW5jaW5nJywgbnVsbCk7XG4gICAgICBhd2FpdCB0aGlzLmV4cG9ydE9wcygpO1xuICAgICAgYXdhaXQgdGhpcy5pbXBvcnRPcHMoKTtcbiAgICAgIGF3YWl0IHRoaXMudHJhbnNwb3J0LmFubm91bmNlKHRoaXMuc3RvcmUuZGV2aWNlSWQsIHRoaXMudXNlck5hbWUpO1xuICAgICAgdGhpcy5sYXN0U3luY0F0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgdGhpcy5zZXRTdGF0ZSgnaWRsZScsIG51bGwpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5zZXRTdGF0ZSgnZXJyb3InLCBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycikpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgIHJlbGVhc2UoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGV4cG9ydE9wcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMudHJhbnNwb3J0KSByZXR1cm47XG4gICAgY29uc3QgbGFzdEV4cG9ydGVkID0gTnVtYmVyKGdldE1ldGEodGhpcy5zdG9yZS5kYiwgJ2xhc3RfZXhwb3J0ZWRfc2VxJykgPz8gJzAnKTtcbiAgICBjb25zdCBwZW5kaW5nID0gdGhpcy5zdG9yZS5vcHNTaW5jZShsYXN0RXhwb3J0ZWQsIHRydWUpO1xuICAgIGlmIChwZW5kaW5nLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGNvbnN0IG1heFNlcSA9IHBlbmRpbmdbcGVuZGluZy5sZW5ndGggLSAxXS5zZXE7XG4gICAgY29uc3QgYmF0Y2hOYW1lID0gU3RyaW5nKG1heFNlcSkucGFkU3RhcnQoMTIsICcwJykgKyAnLmpzb25sJztcbiAgICBhd2FpdCB0aGlzLnRyYW5zcG9ydC5wdWJsaXNoT3BzKFxuICAgICAgdGhpcy5zdG9yZS5kZXZpY2VJZCxcbiAgICAgIGJhdGNoTmFtZSxcbiAgICAgIHBlbmRpbmcubWFwKChwKSA9PiBwLm9wKSxcbiAgICApO1xuICAgIHNldE1ldGEodGhpcy5zdG9yZS5kYiwgJ2xhc3RfZXhwb3J0ZWRfc2VxJywgU3RyaW5nKG1heFNlcSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbXBvcnRPcHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnRyYW5zcG9ydCkgcmV0dXJuO1xuICAgIGNvbnN0IHBlZXJzID0gdGhpcy5zdG9yZS5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBkZXZpY2VfaWQsIGxhc3RfZmlsZSBGUk9NIHN5bmNfcGVlcnMnKVxuICAgICAgLmFsbCgpIGFzIHsgZGV2aWNlX2lkOiBzdHJpbmc7IGxhc3RfZmlsZTogc3RyaW5nIHwgbnVsbCB9W107XG4gICAgY29uc3QgYWZ0ZXJCeURldmljZSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmcgfCBudWxsPihwZWVycy5tYXAoKHApID0+IFtwLmRldmljZV9pZCwgcC5sYXN0X2ZpbGVdKSk7XG5cbiAgICBjb25zdCBiYXRjaGVzID0gYXdhaXQgdGhpcy50cmFuc3BvcnQubGlzdFBlZXJCYXRjaGVzKHRoaXMuc3RvcmUuZGV2aWNlSWQsIGFmdGVyQnlEZXZpY2UpO1xuICAgIC8vIEJhdGNoZXMgbXVzdCBhcHBseSBzdHJpY3RseSBpbiBmaWxlbmFtZSBvcmRlciBwZXIgZGV2aWNlLiBJZiBvbmUgZmlsZSBpc1xuICAgIC8vIHVucmVhZGFibGUgKGUuZy4gc3RpbGwgc3luY2luZyBkb3duKSwgU1RPUCB0aGF0IGRldmljZSBmb3IgdGhpcyBjeWNsZSBcdTIwMTRcbiAgICAvLyBhZHZhbmNpbmcgcGFzdCBpdCB3b3VsZCBwZXJtYW5lbnRseSBza2lwIGl0cyBvcHMuXG4gICAgY29uc3Qgc3RhbGxlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGZvciAoY29uc3QgYiBvZiBiYXRjaGVzKSB7XG4gICAgICBpZiAoc3RhbGxlZC5oYXMoYi5kZXZpY2VJZCkpIGNvbnRpbnVlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgb3BzID0gYXdhaXQgdGhpcy50cmFuc3BvcnQuZmV0Y2hCYXRjaChiLmRldmljZUlkLCBiLmZpbGVOYW1lKTtcbiAgICAgICAgdGhpcy5zdG9yZS5hcHBseVJlbW90ZU9wcyhvcHMpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHN0YWxsZWQuYWRkKGIuZGV2aWNlSWQpOyAvLyByZXRyeSBmcm9tIHRoaXMgZmlsZSBuZXh0IGN5Y2xlOyBjdXJzb3IgdW50b3VjaGVkXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5zdG9yZS5kYlxuICAgICAgICAucHJlcGFyZShcbiAgICAgICAgICBgSU5TRVJUIElOVE8gc3luY19wZWVycyhkZXZpY2VfaWQsIGxhc3RfZmlsZSwgbGFzdF9zZWVuX2F0KSBWQUxVRVMoPyw/LD8pXG4gICAgICAgICAgIE9OIENPTkZMSUNUKGRldmljZV9pZCkgRE8gVVBEQVRFIFNFVCBsYXN0X2ZpbGU9ZXhjbHVkZWQubGFzdF9maWxlLCBsYXN0X3NlZW5fYXQ9ZXhjbHVkZWQubGFzdF9zZWVuX2F0YCxcbiAgICAgICAgKVxuICAgICAgICAucnVuKGIuZGV2aWNlSWQsIGIuZmlsZU5hbWUsIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSk7XG4gICAgfVxuXG4gICAgLy8gUmVmcmVzaCBwZWVyIGRpc3BsYXkgbmFtZXMgZnJvbSBhbm5vdW5jZW1lbnRzLlxuICAgIGZvciAoY29uc3QgcCBvZiBhd2FpdCB0aGlzLnRyYW5zcG9ydC5saXN0UGVlcnMoKSkge1xuICAgICAgaWYgKHAuZGV2aWNlSWQgPT09IHRoaXMuc3RvcmUuZGV2aWNlSWQpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5zdG9yZS5kYlxuICAgICAgICAucHJlcGFyZShcbiAgICAgICAgICBgSU5TRVJUIElOVE8gc3luY19wZWVycyhkZXZpY2VfaWQsIHVzZXJfbmFtZSwgbGFzdF9zZWVuX2F0KSBWQUxVRVMoPyw/LD8pXG4gICAgICAgICAgIE9OIENPTkZMSUNUKGRldmljZV9pZCkgRE8gVVBEQVRFIFNFVCB1c2VyX25hbWU9Q09BTEVTQ0UoZXhjbHVkZWQudXNlcl9uYW1lLCBzeW5jX3BlZXJzLnVzZXJfbmFtZSksXG4gICAgICAgICAgICAgbGFzdF9zZWVuX2F0PUNPQUxFU0NFKGV4Y2x1ZGVkLmxhc3Rfc2Vlbl9hdCwgc3luY19wZWVycy5sYXN0X3NlZW5fYXQpYCxcbiAgICAgICAgKVxuICAgICAgICAucnVuKHAuZGV2aWNlSWQsIHAudXNlck5hbWUsIHAubGFzdFNlZW5BdCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRTdGF0ZShzdGF0ZTogU3luY1N0YXR1c1N0YXRlLCBlcnJvcjogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB0aGlzLmxhc3RFcnJvciA9IGVycm9yO1xuICAgIHRoaXMuZW1pdFN0YXR1cygpO1xuICB9XG5cbiAgcHJpdmF0ZSBlbWl0U3RhdHVzKCk6IHZvaWQge1xuICAgIHRoaXMub25TdGF0dXModGhpcy5zdGF0dXMoKSk7XG4gIH1cblxuICBzdGF0dXMoKTogU3luY1N0YXR1cyB7XG4gICAgY29uc3QgbGFzdEV4cG9ydGVkID0gTnVtYmVyKGdldE1ldGEodGhpcy5zdG9yZS5kYiwgJ2xhc3RfZXhwb3J0ZWRfc2VxJykgPz8gJzAnKTtcbiAgICBjb25zdCBwZW5kaW5nUm93ID0gdGhpcy5zdG9yZS5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBDT1VOVCgqKSBBUyBjIEZST00gb3Bsb2cgV0hFUkUgc2VxID4gPyBBTkQgZGV2aWNlX2lkID0gPycpXG4gICAgICAuZ2V0KGxhc3RFeHBvcnRlZCwgdGhpcy5zdG9yZS5kZXZpY2VJZCkgYXMgeyBjOiBudW1iZXIgfTtcbiAgICBjb25zdCBjb25mbGljdFJvdyA9IHRoaXMuc3RvcmUuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgQ09VTlQoKikgQVMgYyBGUk9NIHN5bmNfY29uZmxpY3RzIFdIRVJFIHJlc29sdmVkX2F0IElTIE5VTEwnKVxuICAgICAgLmdldCgpIGFzIHsgYzogbnVtYmVyIH07XG4gICAgY29uc3QgcGVlcnMgPSB0aGlzLnN0b3JlLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIGRldmljZV9pZCBBUyBkZXZpY2VJZCwgdXNlcl9uYW1lIEFTIHVzZXJOYW1lLCBsYXN0X3NlZW5fYXQgQVMgbGFzdFNlZW5BdCBGUk9NIHN5bmNfcGVlcnMnKVxuICAgICAgLmFsbCgpIGFzIFN5bmNTdGF0dXNbJ3BlZXJzJ107XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXRlOiB0aGlzLnN0YXRlLFxuICAgICAgZm9sZGVyOiB0aGlzLnRyYW5zcG9ydCA/IHRoaXMudHJhbnNwb3J0LmxvY2F0aW9uKCkgOiBudWxsLFxuICAgICAgbGFzdFN5bmNBdDogdGhpcy5sYXN0U3luY0F0LFxuICAgICAgbGFzdEVycm9yOiB0aGlzLmxhc3RFcnJvcixcbiAgICAgIHBlbmRpbmdPcHM6IHBlbmRpbmdSb3cuYyxcbiAgICAgIG9wZW5Db25mbGljdHM6IGNvbmZsaWN0Um93LmMsXG4gICAgICBwZWVycyxcbiAgICB9O1xuICB9XG5cbiAgLyoqIFN0b3BzIHRpbWVycyBhbmQgd2FpdHMgZm9yIGFueSBpbi1mbGlnaHQgY3ljbGUgXHUyMDE0IHNhZmUgdG8gY2xvc2UgdGhlIERCIGFmdGVyd2FyZHMuICovXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMudGltZXIpIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcik7XG4gICAgaWYgKHRoaXMuZXhwb3J0VGltZXIpIGNsZWFyVGltZW91dCh0aGlzLmV4cG9ydFRpbWVyKTtcbiAgICB0aGlzLnRpbWVyID0gbnVsbDtcbiAgICB0aGlzLmV4cG9ydFRpbWVyID0gbnVsbDtcbiAgICBhd2FpdCB0aGlzLmN1cnJlbnQ7XG4gIH1cbn1cbiIsICIvLyBTYW1wbGUgU3VwcG9ydCBBSSBwcm9qZWN0IGRhdGEuIEV2ZXJ5IHJlY29yZCBjYXJyaWVzIHNhbXBsZT0xIGFuZCBhIFtTQU1QTEVdIHRpdGxlXG4vLyBtYXJrZXIgY29udmVudGlvbiBpcyBOT1QgdXNlZCBcdTIwMTQgdGhlIHNhbXBsZSBmbGFnIGRyaXZlcyBiYWRnZXMgKyBvbmUtY2xpY2sgcmVtb3ZhbC5cbi8vIE5vIHJlYWwgY29uZmlkZW50aWFsIGRhdGE6IG5hbWVzIG9mIHN5c3RlbXMgYXJlIGdlbmVyaWMsIGNvbnRlbnRzIGFyZSBpbGx1c3RyYXRpdmUuXG5cbmltcG9ydCB0eXBlIHsgU3RvcmUgfSBmcm9tICcuL3N0b3JlJztcbmltcG9ydCB0eXBlIHsgSXRlbVR5cGUsIFByaW9yaXR5IH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcblxuaW50ZXJmYWNlIFNlZWRJdGVtIHtcbiAgdHlwZTogSXRlbVR5cGU7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGJvZHlUZXh0Pzogc3RyaW5nO1xuICBzdGF0dXM/OiBzdHJpbmc7XG4gIHByaW9yaXR5PzogUHJpb3JpdHk7XG4gIG93bmVyPzogJ2pvaG4nIHwgJ21hcmsnIHwgbnVsbDtcbiAgZHVlRGF0ZT86IHN0cmluZztcbiAgdGFncz86IHN0cmluZ1tdO1xuICBleHRyYT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICBtaWxlc3RvbmU/OiBzdHJpbmc7XG4gIGxlYWRlcnNoaXBWaXNpYmxlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRTZWVkRGF0YShzdG9yZTogU3RvcmUpOiBudW1iZXIge1xuICAvLyBQcm9iZSBkaXJlY3RseSAobGlzdEl0ZW1zIGhpZGVzIGFyY2hpdmVkIHJvd3MgXHUyMDE0IGFyY2hpdmVkIHNhbXBsZXMgbXVzdCBzdGlsbCBibG9jayBhIHJlbG9hZCkuXG4gIGNvbnN0IGV4aXN0aW5nID0gc3RvcmUuZGIucHJlcGFyZSgnU0VMRUNUIDEgRlJPTSBpdGVtcyBXSEVSRSBzYW1wbGU9MSBBTkQgZGVsZXRlZD0wIExJTUlUIDEnKS5nZXQoKTtcbiAgaWYgKGV4aXN0aW5nKSByZXR1cm4gMDsgLy8gYWxyZWFkeSBsb2FkZWRcblxuICBjb25zdCBtMSA9IHN0b3JlLnVwc2VydE1pbGVzdG9uZSh7IG5hbWU6ICdEaXNjb3ZlcnkgJiBBY2Nlc3MnLCB0YXJnZXREYXRlOiAnMjAyNi0wOC0xNScsIHN0YXR1czogJ2FjdGl2ZScsIHNvcnQ6IDEsIHNhbXBsZTogMSwgZGVzY3JpcHRpb246ICdTZWN1cmUgc3lzdGVtIGFjY2VzcywgaW52ZW50b3J5IGtub3dsZWRnZSBzb3VyY2VzLCBjb25maXJtIHNjb3BlIHdpdGggbGVhZGVyc2hpcC4nIH0pO1xuICBjb25zdCBtMiA9IHN0b3JlLnVwc2VydE1pbGVzdG9uZSh7IG5hbWU6ICdLbm93bGVkZ2UgUGlwZWxpbmUgTVZQJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTAtMDEnLCBzdGF0dXM6ICdwbGFubmVkJywgc29ydDogMiwgc2FtcGxlOiAxLCBkZXNjcmlwdGlvbjogJ0luZ2VzdCwgY2xlYW4sIGFuZCBpbmRleCB0aGUgZmlyc3Qga25vd2xlZGdlIGRvbWFpbiBlbmQgdG8gZW5kLicgfSk7XG4gIGNvbnN0IG0zID0gc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgbmFtZTogJ1BpbG90IHdpdGggU3VwcG9ydCBUZWFtJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTItMDEnLCBzdGF0dXM6ICdwbGFubmVkJywgc29ydDogMywgc2FtcGxlOiAxLCBkZXNjcmlwdGlvbjogJ0xpbWl0ZWQgcGlsb3Q6IG1lYXN1cmUgZGVmbGVjdGlvbiwgYWNjdXJhY3ksIGFuZCBhZ2VudCBzYXRpc2ZhY3Rpb24uJyB9KTtcbiAgc3RvcmUudXBzZXJ0UmVsZWFzZSh7IG5hbWU6ICdTdXBwb3J0IEFJIFBpbG90IDAuMScsIHZlcnNpb246ICcwLjEnLCB0YXJnZXREYXRlOiAnMjAyNi0xMS0xNScsIHN0YXR1czogJ3BsYW5uZWQnLCBnb2FsczogJ0ZpcnN0IGludGVybmFsIHBpbG90IGJ1aWxkOiBzaW5nbGUga25vd2xlZGdlIGRvbWFpbiwgMTAgc3VwcG9ydCBhZ2VudHMsIGZlZWRiYWNrIGxvb3AgaW4gcGxhY2UuJywgc2FtcGxlOiAxIH0pO1xuXG4gIGNvbnN0IG1pbGVzdG9uZUlkOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0geyBtMTogbTEuaWQsIG0yOiBtMi5pZCwgbTM6IG0zLmlkIH07XG5cbiAgY29uc3QgaXRlbXM6IChTZWVkSXRlbSAmIHsga2V5OiBzdHJpbmcgfSlbXSA9IFtcbiAgICAvLyBGZWF0dXJlc1xuICAgIHsga2V5OiAnZmVhdEFuc3dlcicsIHR5cGU6ICdmZWF0dXJlJywgdGl0bGU6ICdBSSBhbnN3ZXIgZ2VuZXJhdGlvbiBvdmVyIGtub3dsZWRnZSBiYXNlJywgc3RhdHVzOiAnaW5fcHJvZ3Jlc3MnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBib2R5VGV4dDogJ0NvcmUgY2FwYWJpbGl0eTogZ2l2ZW4gYSBzdXBwb3J0IHF1ZXN0aW9uLCByZXRyaWV2ZSByZWxldmFudCBrbm93bGVkZ2UgYXJ0aWNsZXMgYW5kIGdlbmVyYXRlIGEgZ3JvdW5kZWQsIGNpdGVkIGFuc3dlci4nIH0sXG4gICAgeyBrZXk6ICdmZWF0SW5nZXN0JywgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0tub3dsZWRnZSBpbmdlc3Rpb24gcGlwZWxpbmUgKFNhbGVzZm9yY2UgS0EgZXhwb3J0KScsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBib2R5VGV4dDogJ0V4cG9ydCBrbm93bGVkZ2UgYXJ0aWNsZXMsIG5vcm1hbGl6ZSB0byBjbGVhbiB0ZXh0LCBjaHVuaywgYW5kIGluZGV4IGZvciByZXRyaWV2YWwuJyB9LFxuICAgIHsga2V5OiAnZmVhdEZlZWRiYWNrJywgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0FnZW50IGZlZWRiYWNrIGNhcHR1cmUgKHRodW1icyArIHJlYXNvbiBjb2RlcyknLCBzdGF0dXM6ICdiYWNrbG9nJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcjogJ21hcmsnLCBtaWxlc3RvbmU6ICdtMycsIGJvZHlUZXh0OiAnUGlsb3QgYWdlbnRzIHJhdGUgZWFjaCBBSSBhbnN3ZXI7IHJlYXNvbnMgZmVlZCB0aGUgcXVhbGl0eSBkYXNoYm9hcmQuJyB9LFxuXG4gICAgLy8gUmVxdWlyZW1lbnRzXG4gICAgeyBrZXk6ICdyZXFDaXRhdGlvbnMnLCB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ0V2ZXJ5IEFJIGFuc3dlciBtdXN0IGNpdGUgaXRzIHNvdXJjZSBhcnRpY2xlcycsIHN0YXR1czogJ3RvZG8nLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGV4dHJhOiB7IGFjY2VwdGFuY2VDcml0ZXJpYTogJ0Fuc3dlciBVSSBzaG93cyBhdCBsZWFzdCBvbmUgc291cmNlIGxpbmsgcGVyIGFuc3dlcjsgdW5jaXRlZCBhbnN3ZXJzIGFyZSBzdXBwcmVzc2VkLicsIHNlY3VyaXR5Q29uc2lkZXJhdGlvbnM6ICdDaXRhdGlvbnMgbXVzdCBub3QgZXhwb3NlIHJlc3RyaWN0ZWQgYXJ0aWNsZXMgdG8gdW5hdXRob3JpemVkIGFnZW50cy4nIH0gfSxcbiAgICB7IGtleTogJ3JlcVBISScsIHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnTm8gUEhJIG9yIGN1c3RvbWVyIGRhdGEgbWF5IGxlYXZlIGFwcHJvdmVkIHN5c3RlbXMnLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdtYXJrJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IGFjY2VwdGFuY2VDcml0ZXJpYTogJ0RhdGEgZmxvdyBkaWFncmFtIGFwcHJvdmVkIGJ5IHNlY3VyaXR5OyBETFAgc2NhbiBvZiBwaXBlbGluZSBvdXRwdXQgc2hvd3MgemVybyBQSEkuJywgc2VjdXJpdHlDb25zaWRlcmF0aW9uczogJ0Jsb2NraW5nIHJlcXVpcmVtZW50IGZvciBhbnkgZXh0ZXJuYWwgQUkgc2VydmljZS4nIH0gfSxcbiAgICB7IGtleTogJ3JlcUZyZXNobmVzcycsIHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnS25vd2xlZGdlIGluZGV4IHJlZnJlc2hlcyB3aXRoaW4gMjRoIG9mIGFydGljbGUgdXBkYXRlcycsIHN0YXR1czogJ2JhY2tsb2cnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgZXh0cmE6IHsgYWNjZXB0YW5jZUNyaXRlcmlhOiAnQXJ0aWNsZSBlZGl0ZWQgaW4gc291cmNlIHN5c3RlbSBhcHBlYXJzIGluIHJldHJpZXZhbCByZXN1bHRzIHdpdGhpbiAyNCBob3Vycy4nIH0gfSxcblxuICAgIC8vIFRhc2tzXG4gICAgeyBrZXk6ICd0YXNrRXhwb3J0JywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0J1aWxkIFNhbGVzZm9yY2Uga25vd2xlZGdlIGFydGljbGUgZXhwb3J0IHNjcmlwdCcsIHN0YXR1czogJ2RvbmUnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMScsIGJvZHlUZXh0OiAnRXhwb3J0IGFsbCBwdWJsaXNoZWQgS0FzIHdpdGggbWV0YWRhdGEgdG8gc3RydWN0dXJlZCBmaWxlcy4nIH0sXG4gICAgeyBrZXk6ICd0YXNrQ2xlYW4nLCB0eXBlOiAndGFzaycsIHRpdGxlOiAnSFRNTFx1MjE5MmNsZWFuIHRleHQgbm9ybWFsaXphdGlvbiBmb3IgZXhwb3J0ZWQgYXJ0aWNsZXMnLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgZHVlRGF0ZTogJzIwMjYtMDctMjQnIH0sXG4gICAgeyBrZXk6ICd0YXNrRXZhbCcsIHR5cGU6ICd0YXNrJywgdGl0bGU6ICdEcmFmdCBhbnN3ZXItcXVhbGl0eSBldmFsdWF0aW9uIHJ1YnJpYycsIHN0YXR1czogJ3RvZG8nLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnbWFyaycsIG1pbGVzdG9uZTogJ20yJywgZHVlRGF0ZTogJzIwMjYtMDctMzEnIH0sXG4gICAgeyBrZXk6ICd0YXNrSW52ZW50b3J5JywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0ludmVudG9yeSBjYW5kaWRhdGUga25vd2xlZGdlIGRvbWFpbnMgYW5kIGFydGljbGUgY291bnRzJywgc3RhdHVzOiAnZG9uZScsIHByaW9yaXR5OiAnbWVkaXVtJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTEnIH0sXG5cbiAgICAvLyBBY2Nlc3MgcmVxdWVzdHNcbiAgICB7IGtleTogJ2FjY1NmQXBpJywgdHlwZTogJ2FjY2VzcycsIHRpdGxlOiAnU2FsZXNmb3JjZSBBUEkgYWNjZXNzIChLbm93bGVkZ2Ugb2JqZWN0LCByZWFkKScsIHN0YXR1czogJ3JlcXVlc3RlZCcsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdqb2huJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IHN5c3RlbTogJ1NhbGVzZm9yY2UgU2VydmljZSBDbG91ZCcsIGFjY2Vzc1R5cGU6ICdBUEkgcmVhZCAoS25vd2xlZGdlIG9iamVjdCknLCBidXNpbmVzc1JlYXNvbjogJ0F1dG9tYXRlZCBleHBvcnQgb2Yga25vd2xlZGdlIGFydGljbGVzIGZvciB0aGUgaW5nZXN0aW9uIHBpcGVsaW5lLicsIHJlcXVlc3RlZEZyb206ICdTYWxlc2ZvcmNlIHBsYXRmb3JtIHRlYW0nLCByZXF1ZXN0RGF0ZTogJzIwMjYtMDYtMzAnLCBuZXh0QWN0aW9uOiAnRm9sbG93IHVwIHdpdGggcGxhdGZvcm0gdGVhbSBsZWFkJywgZm9sbG93VXBEYXRlOiAnMjAyNi0wNy0xNScgfSB9LFxuICAgIHsga2V5OiAnYWNjQXp1cmUnLCB0eXBlOiAnYWNjZXNzJywgdGl0bGU6ICdBenVyZSBPcGVuQUkgc2VydmljZSBwcm92aXNpb25pbmcgaW4gTWNLZXNzb24gdGVuYW50Jywgc3RhdHVzOiAndW5kZXJfcmV2aWV3JywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgc3lzdGVtOiAnQXp1cmUgT3BlbkFJIChNY0tlc3NvbiB0ZW5hbnQpJywgYWNjZXNzVHlwZTogJ1Jlc291cmNlIHByb3Zpc2lvbmluZyArIEFQSSBrZXlzJywgYnVzaW5lc3NSZWFzb246ICdBcHByb3ZlZC10ZW5hbnQgTExNIHJlcXVpcmVkIGZvciBhbnN3ZXIgZ2VuZXJhdGlvbiB3aXRob3V0IGRhdGEgZWdyZXNzLicsIHJlcXVlc3RlZEZyb206ICdDbG91ZCBwbGF0Zm9ybSAvIHNlY3VyaXR5JywgcmVxdWVzdERhdGU6ICcyMDI2LTA2LTIyJywgbmV4dEFjdGlvbjogJ1NlY3VyaXR5IHJldmlldyBtZWV0aW5nJywgZm9sbG93VXBEYXRlOiAnMjAyNi0wNy0xOCcgfSB9LFxuICAgIHsga2V5OiAnYWNjU3AnLCB0eXBlOiAnYWNjZXNzJywgdGl0bGU6ICdTaGFyZVBvaW50IHNpdGUgZm9yIHBpbG90IGRvY3VtZW50YXRpb24nLCBzdGF0dXM6ICdncmFudGVkJywgcHJpb3JpdHk6ICdsb3cnLCBvd25lcjogJ21hcmsnLCBleHRyYTogeyBzeXN0ZW06ICdTaGFyZVBvaW50IE9ubGluZScsIGFjY2Vzc1R5cGU6ICdTaXRlIG93bmVyJywgYnVzaW5lc3NSZWFzb246ICdTaGFyZWQgZG9jdW1lbnRhdGlvbiBhbmQgcGlsb3QgYXJ0aWZhY3RzLicsIHJlcXVlc3RlZEZyb206ICdJVCBzZXJ2aWNlIGRlc2snLCByZXF1ZXN0RGF0ZTogJzIwMjYtMDYtMTAnLCBhcHByb3ZlZEJ5OiAnSVQgc2VydmljZSBkZXNrJywgZGF0ZUdyYW50ZWQ6ICcyMDI2LTA2LTEyJyB9IH0sXG5cbiAgICAvLyBEZWNpc2lvbnNcbiAgICB7IGtleTogJ2RlY1RlbmFudCcsIHR5cGU6ICdkZWNpc2lvbicsIHRpdGxlOiAnVXNlIHRlbmFudC1ob3N0ZWQgQXp1cmUgT3BlbkFJLCBub3QgcHVibGljIEFQSXMnLCBzdGF0dXM6ICdhcHByb3ZlZCcsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnbWFyaycsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBjb250ZXh0OiAnQW5zd2VyIGdlbmVyYXRpb24gbmVlZHMgYW4gTExNLiBQdWJsaWMgQUkgQVBJcyBhcmUgdW5hcHByb3ZlZCBmb3IgaW50ZXJuYWwgZGF0YS4nLCBwcm9ibGVtOiAnV2hpY2ggTExNIGhvc3RpbmcgcGF0aCBzYXRpc2ZpZXMgc2VjdXJpdHkgd2hpbGUgdW5ibG9ja2luZyB0aGUgcGlsb3Q/Jywgb3B0aW9uczogW3sgdGl0bGU6ICdQdWJsaWMgQVBJIChPcGVuQUkvQW50aHJvcGljIGRpcmVjdCknLCBub3RlczogJ0Zhc3QgYnV0IHVuYXBwcm92ZWQgZm9yIGludGVybmFsIGRhdGEnLCBzZWxlY3RlZDogZmFsc2UgfSwgeyB0aXRsZTogJ0F6dXJlIE9wZW5BSSBpbiBNY0tlc3NvbiB0ZW5hbnQnLCBub3RlczogJ0RhdGEgc3RheXMgaW4gdGVuYW50OyBwcm9jdXJlbWVudCArIHByb3Zpc2lvbmluZyByZXF1aXJlZCcsIHNlbGVjdGVkOiB0cnVlIH0sIHsgdGl0bGU6ICdMb2NhbCBvcGVuLXdlaWdodHMgbW9kZWwnLCBub3RlczogJ05vIGVncmVzcyBidXQgd2Vha2VyIHF1YWxpdHkgYW5kIGhlYXZ5IGluZnJhJywgc2VsZWN0ZWQ6IGZhbHNlIH1dLCByZWFzb25pbmc6ICdUZW5hbnQgaG9zdGluZyBrZWVwcyBkYXRhIGluc2lkZSBhcHByb3ZlZCBib3VuZGFyeSBhbmQgaGFzIGFuIGV4aXN0aW5nIGVudGVycHJpc2UgYWdyZWVtZW50IHBhdGguJywgdHJhZGVvZmZzOiAnU2xvd2VyIHN0YXJ0OyBjYXBhY2l0eSBxdW90YXM7IG1vZGVsIGF2YWlsYWJpbGl0eSBsYWdzIHB1YmxpYyBBUElzLicgfSB9LFxuICAgIHsga2V5OiAnZGVjRG9tYWluJywgdHlwZTogJ2RlY2lzaW9uJywgdGl0bGU6ICdQaWxvdCBzY29wZTogc3RhcnQgd2l0aCBvbmUgaGlnaC12b2x1bWUga25vd2xlZGdlIGRvbWFpbicsIHN0YXR1czogJ2Rpc2N1c3NpbmcnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIGV4dHJhOiB7IGNvbnRleHQ6ICdLbm93bGVkZ2UgYmFzZSBzcGFucyBtYW55IHByb2R1Y3QgYXJlYXMgd2l0aCB1bmV2ZW4gcXVhbGl0eS4nLCBwcm9ibGVtOiAnUGlsb3QgZXZlcnl0aGluZyBvciBvbmUgZG9tYWluIGZpcnN0PycsIG9wdGlvbnM6IFt7IHRpdGxlOiAnU2luZ2xlIGRvbWFpbiBwaWxvdCcsIG5vdGVzOiAnQ2xlYW5lciBtZWFzdXJlbWVudCwgZmFzdGVyIGl0ZXJhdGlvbicsIHNlbGVjdGVkOiB0cnVlIH0sIHsgdGl0bGU6ICdBbGwgZG9tYWlucyBhdCBvbmNlJywgbm90ZXM6ICdCcm9hZGVyIGltcGFjdCwgZGlsdXRlZCBxdWFsaXR5IHNpZ25hbCcsIHNlbGVjdGVkOiBmYWxzZSB9XSwgcmVhc29uaW5nOiAnU2luZ2xlLWRvbWFpbiBnaXZlcyBhIGNsZWFuIGFjY3VyYWN5IGJhc2VsaW5lIGFuZCBjb250YWluYWJsZSByZXZpZXcgbG9hZC4nIH0gfSxcblxuICAgIC8vIFJpc2tzXG4gICAgeyBrZXk6ICdyaXNrUXVhbGl0eScsIHR5cGU6ICdyaXNrJywgdGl0bGU6ICdLbm93bGVkZ2UgYXJ0aWNsZSBxdWFsaXR5IHRvbyBsb3cgZm9yIGdyb3VuZGVkIGFuc3dlcnMnLCBzdGF0dXM6ICdvcGVuJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IGxpa2VsaWhvb2Q6ICdtZWRpdW0nLCBpbXBhY3Q6ICdoaWdoJywgbWl0aWdhdGlvbjogJ1F1YWxpdHkgYXVkaXQgb2YgdGhlIHBpbG90IGRvbWFpbiBiZWZvcmUgaW5kZXhpbmc7IGFydGljbGUgY2xlYW51cCBiYWNrbG9nIHdpdGggdGhlIGtub3dsZWRnZSB0ZWFtLicgfSB9LFxuICAgIHsga2V5OiAncmlza0FjY2VzcycsIHR5cGU6ICdyaXNrJywgdGl0bGU6ICdBY2Nlc3MgYXBwcm92YWxzIHNsaXAgYW5kIHN0YWxsIHRoZSBwaXBlbGluZSBidWlsZCcsIHN0YXR1czogJ21pdGlnYXRpbmcnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgbGlrZWxpaG9vZDogJ2hpZ2gnLCBpbXBhY3Q6ICdoaWdoJywgbWl0aWdhdGlvbjogJ1dlZWtseSBmb2xsb3ctdXBzOyBsZWFkZXJzaGlwIGVzY2FsYXRpb24gcGF0aCBhZ3JlZWQ7IGJ1aWxkIHBpcGVsaW5lIGFnYWluc3QgZXhwb3J0ZWQgc2FtcGxlIGRhdGEgbWVhbndoaWxlLicgfSB9LFxuXG4gICAgLy8gQmxvY2tlcnNcbiAgICB7IGtleTogJ2Jsa0F6dXJlJywgdHlwZTogJ2Jsb2NrZXInLCB0aXRsZTogJ0Nhbm5vdCBnZW5lcmF0ZSBhbnN3ZXJzIHVudGlsIEF6dXJlIE9wZW5BSSBpcyBwcm92aXNpb25lZCcsIHN0YXR1czogJ2FjdGl2ZScsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdtYXJrJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IHdhaXRpbmdPbjogJ0Nsb3VkIHBsYXRmb3JtIHRlYW0gLyBzZWN1cml0eSByZXZpZXcnLCBzaW5jZTogJzIwMjYtMDYtMjInIH0gfSxcblxuICAgIC8vIE1lZXRpbmdcbiAgICB7IGtleTogJ210Z0tpY2tvZmYnLCB0eXBlOiAnbWVldGluZycsIHRpdGxlOiAnU3VwcG9ydCBBSSBraWNrb2ZmIHdpdGgga25vd2xlZGdlIGxlYWRlcnNoaXAnLCBzdGF0dXM6ICdzdW1tYXJpemVkJywgb3duZXI6ICdqb2huJywgZXh0cmE6IHsgZGF0ZTogJzIwMjYtMDYtMTgnLCB0aW1lOiAnMTA6MDAgQU0nLCBhdHRlbmRlZXM6IFsnSm9obicsICdNYXJrJywgJ0FsbGVuJywgJ0dlb3JnZSddLCBwdXJwb3NlOiAnQWxpZ24gb24gcGlsb3Qgc2NvcGUsIGFjY2VzcyBuZWVkcywgYW5kIHN1Y2Nlc3MgbWVhc3VyZXMuJywgYWdlbmRhOiAnMS4gVmlzaW9uICAyLiBQaWxvdCBzY29wZSAgMy4gQWNjZXNzIHJlcXVlc3RzICA0LiBUaW1lbGluZScgfSwgYm9keVRleHQ6ICdBZ3JlZWQgdG8gc2luZ2xlLWRvbWFpbiBwaWxvdC4gQWxsZW4gdG8gc3BvbnNvciBhY2Nlc3MgcmVxdWVzdHMuIFN1Y2Nlc3MgPSBkZWZsZWN0aW9uIHJhdGUgKyBhZ2VudCBzYXRpc2ZhY3Rpb24uIE5leHQgY2hlY2staW4gaW4gNCB3ZWVrcy4nIH0sXG5cbiAgICAvLyBRdWVzdGlvbnMgLyBpZGVhcyAvIHJlc2VhcmNoXG4gICAgeyBrZXk6ICdxTWV0cmljcycsIHR5cGU6ICdxdWVzdGlvbicsIHRpdGxlOiAnV2hpY2ggZGVmbGVjdGlvbiBtZXRyaWMgZG9lcyBzdXBwb3J0IGxlYWRlcnNoaXAgYWxyZWFkeSB0cnVzdD8nLCBzdGF0dXM6ICdvcGVuJywgb3duZXI6ICdtYXJrJywgZXh0cmE6IHt9IH0sXG4gICAgeyBrZXk6ICdpZGVhVHJpYWdlJywgdHlwZTogJ2lkZWEnLCB0aXRsZTogJ0F1dG8tdHJpYWdlIGluYm91bmQgY2FzZXMgYnkga25vd2xlZGdlIGNvdmVyYWdlJywgc3RhdHVzOiAnYmFja2xvZycsIG93bmVyOiAnam9obicsIGJvZHlUZXh0OiAnSWYgcmV0cmlldmFsIGNvbmZpZGVuY2UgaXMgaGlnaCwgc3VnZ2VzdCBLQi1maXJzdCByZXNwb25zZSBiZWZvcmUgaHVtYW4gdHJpYWdlLicgfSxcbiAgICB7IGtleTogJ3Jlc1JhZycsIHR5cGU6ICdyZXNlYXJjaCcsIHRpdGxlOiAnUmV0cmlldmFsIHN0cmF0ZWd5IGNvbXBhcmlzb246IGh5YnJpZCB2cyBwdXJlIHZlY3RvcicsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgb3duZXI6ICdqb2huJywgYm9keVRleHQ6ICdFYXJseSByZXN1bHQ6IGh5YnJpZCAoQk0yNSArIHZlY3Rvcikgbm90aWNlYWJseSBiZXR0ZXIgb24gcHJvZHVjdC1jb2RlIHF1ZXJpZXMuJyB9LFxuICBdO1xuXG4gIGNvbnN0IGNyZWF0ZWQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IHMgb2YgaXRlbXMpIHtcbiAgICBjb25zdCBpdGVtID0gc3RvcmUuY3JlYXRlSXRlbSh7XG4gICAgICB0eXBlOiBzLnR5cGUsXG4gICAgICB0aXRsZTogcy50aXRsZSxcbiAgICAgIHN0YXR1czogcy5zdGF0dXMsXG4gICAgICBwcmlvcml0eTogcy5wcmlvcml0eSA/PyAnbm9uZScsXG4gICAgICBvd25lcklkOiBzLm93bmVyID8/IG51bGwsXG4gICAgICBtaWxlc3RvbmVJZDogcy5taWxlc3RvbmUgPyBtaWxlc3RvbmVJZFtzLm1pbGVzdG9uZV0gOiBudWxsLFxuICAgICAgZHVlRGF0ZTogcy5kdWVEYXRlID8/IG51bGwsXG4gICAgICB0YWdzOiBzLnRhZ3MgPz8gW10sXG4gICAgICBleHRyYTogcy5leHRyYSA/PyB7fSxcbiAgICAgIGxlYWRlcnNoaXBWaXNpYmxlOiBzLmxlYWRlcnNoaXBWaXNpYmxlID8gMSA6IDAsXG4gICAgICBib2R5VGV4dDogcy5ib2R5VGV4dCA/PyAnJyxcbiAgICAgIGJvZHk6IHMuYm9keVRleHQgPyB0ZXh0RG9jKHMuYm9keVRleHQpIDogJycsXG4gICAgICBzYW1wbGU6IDEsXG4gICAgfSk7XG4gICAgY3JlYXRlZC5zZXQocy5rZXksIGl0ZW0uaWQpO1xuICB9XG5cbiAgY29uc3QgbGluayA9IChhOiBzdHJpbmcsIGI6IHN0cmluZywga2luZDogUGFyYW1ldGVyczxTdG9yZVsnYWRkTGluayddPlsyXSkgPT4ge1xuICAgIGNvbnN0IGZyb21JZCA9IGNyZWF0ZWQuZ2V0KGEpO1xuICAgIGNvbnN0IHRvSWQgPSBjcmVhdGVkLmdldChiKTtcbiAgICBpZiAoZnJvbUlkICYmIHRvSWQpIHN0b3JlLmFkZExpbmsoZnJvbUlkLCB0b0lkLCBraW5kKTtcbiAgfTtcblxuICBsaW5rKCd0YXNrQ2xlYW4nLCAnZmVhdEluZ2VzdCcsICdpbXBsZW1lbnRzJyk7XG4gIGxpbmsoJ3Rhc2tFeHBvcnQnLCAnZmVhdEluZ2VzdCcsICdpbXBsZW1lbnRzJyk7XG4gIGxpbmsoJ3JlcUNpdGF0aW9ucycsICdmZWF0QW5zd2VyJywgJ3N1cHBvcnRzJyk7XG4gIGxpbmsoJ3JlcVBISScsICdmZWF0QW5zd2VyJywgJ3N1cHBvcnRzJyk7XG4gIGxpbmsoJ3JlcUZyZXNobmVzcycsICdmZWF0SW5nZXN0JywgJ3N1cHBvcnRzJyk7XG4gIGxpbmsoJ2ZlYXRBbnN3ZXInLCAnZGVjVGVuYW50JywgJ3NoYXBlZF9ieScpO1xuICBsaW5rKCdmZWF0QW5zd2VyJywgJ2FjY0F6dXJlJywgJ3JlcXVpcmVzX2FjY2VzcycpO1xuICBsaW5rKCdmZWF0SW5nZXN0JywgJ2FjY1NmQXBpJywgJ3JlcXVpcmVzX2FjY2VzcycpO1xuICBsaW5rKCdibGtBenVyZScsICdmZWF0QW5zd2VyJywgJ2Jsb2NrcycpO1xuICBsaW5rKCdkZWNEb21haW4nLCAnbXRnS2lja29mZicsICdkaXNjdXNzZWRfaW4nKTtcbiAgbGluaygncmlza0FjY2VzcycsICdhY2NBenVyZScsICdyZWxhdGVzJyk7XG5cbiAgcmV0dXJuIGl0ZW1zLmxlbmd0aDtcbn1cblxuLyoqIE1pbmltYWwgcmljaC1kb2Mgd3JhcHBlciBmb3Igc2VlZCBib2R5IHRleHQgKG9uZSBwYXJhZ3JhcGgpLiAqL1xuZnVuY3Rpb24gdGV4dERvYyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiAnZG9jJywgY29udGVudDogW3sgdHlwZTogJ3BhcmFncmFwaCcsIGNvbnRlbnQ6IFt7IHR5cGU6ICd0ZXh0JywgdGV4dCB9XSB9XSB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSx1QkFBcUI7QUFDckIsb0JBQW1CO0FBQ25CLElBQUFBLGtCQUFlO0FBQ2YsSUFBQUMsb0JBQWlCO0FBQ2pCLHFCQUFlOzs7QUNSZiw0QkFBcUI7QUFDckIsdUJBQWlCO0FBQ2pCLHFCQUFlO0FBQ2YseUJBQW1COzs7QUNNWixJQUFNLGFBQTBCO0FBQUEsRUFDckM7QUFBQSxJQUNFLFNBQVM7QUFBQSxJQUNULE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFpT1A7QUFBQSxFQUNBO0FBQUEsSUFDRSxTQUFTO0FBQUEsSUFDVCxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFB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RUFBRSxDQUFDO0FBQ3ZFLGdCQUFBQSxRQUFPLEdBQUcsSUFBSSxHQUFHLFFBQVEsZ0NBQWdDLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUd2RSxRQUFNLE1BQU0sTUFBTSxZQUFZLEtBQUssSUFBSSxFQUFFO0FBQ3pDLGdCQUFBQSxRQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsU0FBUyxDQUFDO0FBQy9DLGdCQUFBQSxRQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsaUJBQWlCLENBQUM7QUFDdkQsTUFBSSxHQUFHLE1BQU07QUFDZixDQUFDOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImZzIiwgInBhdGgiLCAiRGF0YWJhc2UiLCAiY3J5cHRvIiwgImltcG9ydF9ub2RlX2NyeXB0byIsICJjcnlwdG8iLCAiaXRlbSIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImZzIiwgInBhdGgiLCAidG1wIiwgImZzIiwgInBhdGgiLCAib3MiLCAiYXNzZXJ0Il0KfQo=
