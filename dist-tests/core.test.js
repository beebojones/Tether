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
  logActivity(itemId, kind, field, oldV, newV) {
    this.db.prepare("INSERT INTO activity(id, item_id, actor_id, kind, field, old_value, new_value, at) VALUES(?,?,?,?,?,?,?,?)").run(
      import_node_crypto2.default.randomUUID(),
      itemId,
      this.actorId,
      kind,
      field ?? null,
      oldV == null ? null : String(oldV).slice(0, 500),
      newV == null ? null : String(newV).slice(0, 500),
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
      if ("body" in changed) this.logActivity(id, "edited", "body");
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
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE items SET deleted=1, updated_at=?, updated_by=? WHERE id=?").run(this.now(), this.actorId, id);
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
    const fields = { body, bodyText, updatedAt: this.now() };
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE comments SET body=?, body_text=?, updated_at=? WHERE id=?").run(body, bodyText, fields.updatedAt, id);
      this.localSet("comment", id, fields);
    });
    tx();
    this.events.onChange({ entity: "comment", entityId: id });
  }
  deleteComment(id) {
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE comments SET deleted=1 WHERE id=?").run(id);
      this.localSet("comment", id, { deleted: 1 });
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
    const rec = {
      id,
      name: m.name,
      description: m.description ?? (existing ? String(existing.description) : ""),
      targetDate: m.targetDate ?? (existing ? existing.target_date : null),
      status: m.status ?? (existing ? existing.status : "planned"),
      sort: m.sort ?? (existing ? Number(existing.sort) : 0),
      sample: m.sample ?? (existing ? Number(existing.sample) : 0)
    };
    const tx = this.db.transaction(() => {
      this.db.prepare(
        `INSERT INTO milestones(id, name, description, target_date, status, sort, sample, deleted) VALUES(?,?,?,?,?,?,?,0)
           ON CONFLICT(id) DO UPDATE SET name=?, description=?, target_date=?, status=?, sort=?, deleted=0`
      ).run(
        rec.id,
        rec.name,
        rec.description,
        rec.targetDate,
        rec.status,
        rec.sort,
        rec.sample,
        rec.name,
        rec.description,
        rec.targetDate,
        rec.status,
        rec.sort
      );
      if (!existing) this.localCreate("milestone", id, { ...rec });
      else this.localSet("milestone", id, { name: rec.name, description: rec.description, targetDate: rec.targetDate, status: rec.status, sort: rec.sort });
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
      sample: Number(r.sample)
    }));
  }
  upsertRelease(m) {
    const id = m.id ?? import_node_crypto2.default.randomUUID();
    const existing = this.db.prepare("SELECT * FROM releases WHERE id=?").get(id);
    const rec = {
      id,
      name: m.name,
      version: m.version ?? (existing ? String(existing.version) : ""),
      targetDate: m.targetDate ?? (existing ? existing.target_date : null),
      status: m.status ?? (existing ? existing.status : "planned"),
      goals: m.goals ?? (existing ? String(existing.goals) : ""),
      notes: m.notes ?? (existing ? String(existing.notes) : ""),
      sample: m.sample ?? (existing ? Number(existing.sample) : 0)
    };
    const tx = this.db.transaction(() => {
      this.db.prepare(
        `INSERT INTO releases(id, name, version, target_date, status, goals, notes, sample, deleted) VALUES(?,?,?,?,?,?,?,?,0)
           ON CONFLICT(id) DO UPDATE SET name=?, version=?, target_date=?, status=?, goals=?, notes=?, deleted=0`
      ).run(
        rec.id,
        rec.name,
        rec.version,
        rec.targetDate,
        rec.status,
        rec.goals,
        rec.notes,
        rec.sample,
        rec.name,
        rec.version,
        rec.targetDate,
        rec.status,
        rec.goals,
        rec.notes
      );
      if (!existing) this.localCreate("release", id, { ...rec });
      else this.localSet("release", id, { name: rec.name, version: rec.version, targetDate: rec.targetDate, status: rec.status, goals: rec.goals, notes: rec.notes });
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
      sample: Number(r.sample)
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
    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE saved_views SET deleted=1 WHERE id=?").run(id);
      this.localSet("saved_view", id, { deleted: 1 });
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
      this.db.prepare("UPDATE sync_conflicts SET resolved_at=?, resolution=? WHERE id=?").run(this.now(), resolution, id);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vdGVzdHMvY29yZS50ZXN0LnRzIiwgIi4uL2VsZWN0cm9uL2RiL2RiLnRzIiwgIi4uL2VsZWN0cm9uL2RiL21pZ3JhdGlvbnMudHMiLCAiLi4vZWxlY3Ryb24vZGIvc3RvcmUudHMiLCAiLi4vc2hhcmVkL3R5cGVzLnRzIiwgIi4uL3NoYXJlZC9kb2MudHMiLCAiLi4vZWxlY3Ryb24vc3luYy90cmFuc3BvcnQudHMiLCAiLi4vZWxlY3Ryb24vc3luYy9lbmdpbmUudHMiLCAiLi4vZWxlY3Ryb24vZGIvc2VlZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gQ29yZSBkYXRhLWxheWVyICsgc3luYyB0ZXN0cy4gUnVuIHdpdGg6IG5wbSB0ZXN0XG4vLyAoYnVuZGxlZCBieSBzY3JpcHRzL3J1bi10ZXN0cy5tanMgYW5kIGV4ZWN1dGVkIHVuZGVyIEVsZWN0cm9uJ3MgTm9kZSB2aWEgRUxFQ1RST05fUlVOX0FTX05PREVcbi8vICBzbyBiZXR0ZXItc3FsaXRlMydzIEVsZWN0cm9uLUFCSSBidWlsZCBsb2Fkcy4pXG5cbmltcG9ydCB7IHRlc3QgfSBmcm9tICdub2RlOnRlc3QnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdub2RlOmFzc2VydC9zdHJpY3QnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCBvcyBmcm9tICdub2RlOm9zJztcbmltcG9ydCB7IG9wZW5EYXRhYmFzZSwgdHlwZSBEYkNvbnRleHQgfSBmcm9tICcuLi9lbGVjdHJvbi9kYi9kYic7XG5pbXBvcnQgeyBTdG9yZSB9IGZyb20gJy4uL2VsZWN0cm9uL2RiL3N0b3JlJztcbmltcG9ydCB7IEZvbGRlclRyYW5zcG9ydCB9IGZyb20gJy4uL2VsZWN0cm9uL3N5bmMvdHJhbnNwb3J0JztcbmltcG9ydCB7IFN5bmNFbmdpbmUgfSBmcm9tICcuLi9lbGVjdHJvbi9zeW5jL2VuZ2luZSc7XG5pbXBvcnQgeyBsb2FkU2VlZERhdGEgfSBmcm9tICcuLi9lbGVjdHJvbi9kYi9zZWVkJztcblxuZnVuY3Rpb24gdG1wKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHAgPSBmcy5ta2R0ZW1wU3luYyhwYXRoLmpvaW4ob3MudG1wZGlyKCksIGB0ZXRoZXItJHtuYW1lfS1gKSk7XG4gIHJldHVybiBwO1xufVxuXG5mdW5jdGlvbiBta1N0b3JlKG5hbWU6IHN0cmluZywgYWN0b3I6IHN0cmluZyk6IHsgY3R4OiBEYkNvbnRleHQ7IHN0b3JlOiBTdG9yZSB9IHtcbiAgY29uc3QgY3R4ID0gb3BlbkRhdGFiYXNlKHRtcChuYW1lKSk7XG4gIGNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKGN0eCwgYWN0b3IpO1xuICByZXR1cm4geyBjdHgsIHN0b3JlIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN5bmNCb3RoKGE6IHsgc3RvcmU6IFN0b3JlIH0sIGI6IHsgc3RvcmU6IFN0b3JlIH0sIGZvbGRlcjogc3RyaW5nLCB1c2VyQSA9ICdKb2huJywgdXNlckIgPSAnTWFyaycpIHtcbiAgY29uc3QgZWEgPSBuZXcgU3luY0VuZ2luZShhLnN0b3JlLCB1c2VyQSwgKCkgPT4ge30pO1xuICBjb25zdCBlYiA9IG5ldyBTeW5jRW5naW5lKGIuc3RvcmUsIHVzZXJCLCAoKSA9PiB7fSk7XG4gIGVhLnNldFRyYW5zcG9ydChuZXcgRm9sZGVyVHJhbnNwb3J0KGZvbGRlcikpO1xuICBlYi5zZXRUcmFuc3BvcnQobmV3IEZvbGRlclRyYW5zcG9ydChmb2xkZXIpKTtcbiAgLy8gVHdvIGN5Y2xlcyBlYWNoIHNvIHJlbnVtYmVyLXJlYnJvYWRjYXN0cyBhbmQgY3Jvc3MtaW1wb3J0cyBzZXR0bGUuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgYXdhaXQgZWEuY3ljbGUoKTtcbiAgICBhd2FpdCBlYi5jeWNsZSgpO1xuICB9XG4gIGF3YWl0IGVhLnN0b3AoKTtcbiAgYXdhaXQgZWIuc3RvcCgpO1xufVxuXG50ZXN0KCdtaWdyYXRpb25zIGNyZWF0ZSBzY2hlbWEgYW5kIGRldmljZSBpZGVudGl0eScsICgpID0+IHtcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdtaWcnLCAnam9obicpO1xuICBhc3NlcnQub2soY3R4LmRldmljZUlkLmxlbmd0aCA+IDEwKTtcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmxpc3RJdGVtcygpLmxlbmd0aCwgMCk7XG4gIGN0eC5kYi5jbG9zZSgpO1xufSk7XG5cbnRlc3QoJ2l0ZW0gQ1JVRCwgaWRlbnQgYWxsb2NhdGlvbiwgYWN0aXZpdHksIHNlYXJjaCcsICgpID0+IHtcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdjcnVkJywgJ2pvaG4nKTtcbiAgY29uc3QgaXRlbSA9IHN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ0Fuc3dlcnMgbXVzdCBjaXRlIHNvdXJjZXMnIH0pO1xuICBhc3NlcnQuZXF1YWwoaXRlbS5pZGVudCwgJ1JFUS0xJyk7XG4gIGFzc2VydC5lcXVhbChpdGVtLnN0YXR1cywgJ2JhY2tsb2cnKTtcblxuICBjb25zdCBzZWNvbmQgPSBzdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3JlcXVpcmVtZW50JywgdGl0bGU6ICdBbm90aGVyIHJlcXVpcmVtZW50JyB9KTtcbiAgYXNzZXJ0LmVxdWFsKHNlY29uZC5pZGVudCwgJ1JFUS0yJyk7XG5cbiAgc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICdoaWdoJyB9KTtcbiAgY29uc3QgZ290ID0gc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSE7XG4gIGFzc2VydC5lcXVhbChnb3Quc3RhdHVzLCAnaW5fcHJvZ3Jlc3MnKTtcbiAgYXNzZXJ0LmVxdWFsKGdvdC5wcmlvcml0eSwgJ2hpZ2gnKTtcblxuICAvLyBkb25lIFx1MjE5MiBjb21wbGV0ZWRBdCBzZXRcbiAgc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHN0YXR1czogJ2RvbmUnIH0pO1xuICBhc3NlcnQub2soc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEuY29tcGxldGVkQXQpO1xuXG4gIC8vIHNlYXJjaCBoaXRzIHRpdGxlXG4gIGNvbnN0IHJlc3VsdHMgPSBzdG9yZS5zZWFyY2goJ2NpdGUgc291cmNlcycpO1xuICBhc3NlcnQub2socmVzdWx0cy5zb21lKChyKSA9PiByLml0ZW0uaWQgPT09IGl0ZW0uaWQpKTtcblxuICAvLyBieSBpZGVudFxuICBhc3NlcnQuZXF1YWwoc3RvcmUuZ2V0SXRlbUJ5SWRlbnQoJ3JlcS0xJykhLmlkLCBpdGVtLmlkKTtcblxuICBjb25zdCBhY3Rpdml0eSA9IHN0b3JlLmFjdGl2aXR5Rm9yKGl0ZW0uaWQpIGFzIHsga2luZDogc3RyaW5nIH1bXTtcbiAgYXNzZXJ0Lm9rKGFjdGl2aXR5LnNvbWUoKGEpID0+IGEua2luZCA9PT0gJ2NyZWF0ZWQnKSk7XG4gIGFzc2VydC5vayhhY3Rpdml0eS5zb21lKChhKSA9PiBhLmtpbmQgPT09ICd1cGRhdGVkJykpO1xuXG4gIC8vIGRlbGV0ZSBoaWRlcyBmcm9tIHF1ZXJpZXNcbiAgc3RvcmUuZGVsZXRlSXRlbShzZWNvbmQuaWQpO1xuICBhc3NlcnQuZXF1YWwoc3RvcmUuZ2V0SXRlbShzZWNvbmQuaWQpLCBudWxsKTtcbiAgY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnbGlua3MsIGNvbW1lbnRzLCB2ZXJzaW9ucycsICgpID0+IHtcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdyZWwnLCAnam9obicpO1xuICBjb25zdCBhID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdCdWlsZCBleHBvcnQnIH0pO1xuICBjb25zdCBiID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdmZWF0dXJlJywgdGl0bGU6ICdJbmdlc3Rpb24gcGlwZWxpbmUnIH0pO1xuICBzdG9yZS5hZGRMaW5rKGEuaWQsIGIuaWQsICdpbXBsZW1lbnRzJyk7XG4gIGNvbnN0IGxpbmtzID0gc3RvcmUubGlua3NGb3IoYS5pZCk7XG4gIGFzc2VydC5lcXVhbChsaW5rcy5sZW5ndGgsIDEpO1xuICBhc3NlcnQuZXF1YWwobGlua3NbMF0ub3RoZXIuaWQsIGIuaWQpO1xuICBhc3NlcnQuZXF1YWwobGlua3NbMF0uZGlyZWN0aW9uLCAnb3V0Jyk7XG5cbiAgc3RvcmUuYWRkQ29tbWVudChhLmlkLCAne1widHlwZVwiOlwiZG9jXCJ9JywgJ2xvb2tzIGdvb2QnKTtcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmNvbW1lbnRzRm9yKGEuaWQpLmxlbmd0aCwgMSk7XG5cbiAgc3RvcmUuc2F2ZVZlcnNpb24oYS5pZCk7XG4gIHN0b3JlLnVwZGF0ZUl0ZW0oYS5pZCwgeyB0aXRsZTogJ0J1aWxkIGV4cG9ydCB2MicgfSk7XG4gIGNvbnN0IHZlcnNpb25zID0gc3RvcmUudmVyc2lvbnNGb3IoYS5pZCkgYXMgeyB0aXRsZTogc3RyaW5nIH1bXTtcbiAgYXNzZXJ0LmVxdWFsKHZlcnNpb25zLmxlbmd0aCwgMSk7XG4gIGFzc2VydC5lcXVhbCh2ZXJzaW9uc1swXS50aXRsZSwgJ0J1aWxkIGV4cG9ydCcpO1xuICBjdHguZGIuY2xvc2UoKTtcbn0pO1xuXG50ZXN0KCdzeW5jOiB0d28gZGV2aWNlcyBjb252ZXJnZSB0aHJvdWdoIGEgc2hhcmVkIGZvbGRlcicsIGFzeW5jICgpID0+IHtcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ3N5bmNBJywgJ2pvaG4nKTtcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ3N5bmNCJywgJ21hcmsnKTtcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWQnKTtcblxuICBjb25zdCBpdGVtQSA9IGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdGcm9tIEpvaG4nIH0pO1xuICBjb25zdCBpdGVtQiA9IGIuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdkZWNpc2lvbicsIHRpdGxlOiAnRnJvbSBNYXJrJyB9KTtcblxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuXG4gIGFzc2VydC5vayhiLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpLCAnQiByZWNlaXZlZCBBIGl0ZW0nKTtcbiAgYXNzZXJ0Lm9rKGEuc3RvcmUuZ2V0SXRlbShpdGVtQi5pZCksICdBIHJlY2VpdmVkIEIgaXRlbScpO1xuICBhc3NlcnQuZXF1YWwoYi5zdG9yZS5nZXRJdGVtKGl0ZW1BLmlkKSEudGl0bGUsICdGcm9tIEpvaG4nKTtcblxuICAvLyBFZGl0IG9uIEIgcHJvcGFnYXRlcyB0byBBXG4gIGIuc3RvcmUudXBkYXRlSXRlbShpdGVtQS5pZCwgeyBzdGF0dXM6ICdpbl9wcm9ncmVzcycgfSk7XG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XG4gIGFzc2VydC5lcXVhbChhLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpIS5zdGF0dXMsICdpbl9wcm9ncmVzcycpO1xuXG4gIGEuY3R4LmRiLmNsb3NlKCk7XG4gIGIuY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnc3luYzogY29uY3VycmVudCB0aXRsZSBlZGl0cyBzdXJmYWNlIGEgY29uZmxpY3QsIExXVyBhcHBsaWVzLCByZXNvbHV0aW9uIGNvbnZlcmdlcycsIGFzeW5jICgpID0+IHtcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ2NvbmZBJywgJ2pvaG4nKTtcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ2NvbmZCJywgJ21hcmsnKTtcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRjJyk7XG5cbiAgY29uc3QgaXRlbSA9IGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdPcmlnaW5hbCcgfSk7XG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XG4gIGFzc2VydC5vayhiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkpO1xuXG4gIC8vIEJvdGggZWRpdCB0aGUgdGl0bGUgd2hpbGUgXCJvZmZsaW5lXCIgKG5vIHN5bmMgYmV0d2VlbiBlZGl0cykuXG4gIGEuc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHRpdGxlOiAnSm9obiB2ZXJzaW9uJyB9KTtcbiAgYi5zdG9yZS51cGRhdGVJdGVtKGl0ZW0uaWQsIHsgdGl0bGU6ICdNYXJrIHZlcnNpb24nIH0pO1xuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuXG4gIC8vIEJvdGggc2lkZXMgc2hvdyB0aGUgc2FtZSBMV1cgd2lubmVyLlxuICBjb25zdCB0YSA9IGEuc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEudGl0bGU7XG4gIGNvbnN0IHRiID0gYi5zdG9yZS5nZXRJdGVtKGl0ZW0uaWQpIS50aXRsZTtcbiAgYXNzZXJ0LmVxdWFsKHRhLCB0YiwgJ0xXVyBjb252ZXJnZWQnKTtcblxuICAvLyBBdCBsZWFzdCBvbmUgc2lkZSByZWNvcmRlZCBhIGNvbmZsaWN0IGZvciByZXZpZXcuXG4gIGNvbnN0IGNvbmZsaWN0cyA9IFsuLi5hLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSksIC4uLmIuc3RvcmUubGlzdENvbmZsaWN0cyh0cnVlKV07XG4gIGFzc2VydC5vayhjb25mbGljdHMubGVuZ3RoID49IDEsICdjb25mbGljdCBzdXJmYWNlZCcpO1xuICBhc3NlcnQub2soY29uZmxpY3RzLnNvbWUoKGMpID0+IGMuZmllbGQgPT09ICd0aXRsZScpKTtcblxuICAvLyBSZXNvbHZpbmcgd2l0aCBhIG1lcmdlZCB2YWx1ZSBwcm9wYWdhdGVzLlxuICBjb25zdCBzaWRlID0gYS5zdG9yZS5saXN0Q29uZmxpY3RzKHRydWUpLmxlbmd0aCA/IGEgOiBiO1xuICBjb25zdCBjb25mbGljdCA9IHNpZGUuc3RvcmUubGlzdENvbmZsaWN0cyh0cnVlKVswXTtcbiAgc2lkZS5zdG9yZS5yZXNvbHZlQ29uZmxpY3QoY29uZmxpY3QuaWQsICdtZXJnZWQnLCAnTWVyZ2VkIHRpdGxlJyk7XG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XG4gIGFzc2VydC5lcXVhbChhLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlLCAnTWVyZ2VkIHRpdGxlJyk7XG4gIGFzc2VydC5lcXVhbChiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlLCAnTWVyZ2VkIHRpdGxlJyk7XG5cbiAgYS5jdHguZGIuY2xvc2UoKTtcbiAgYi5jdHguZGIuY2xvc2UoKTtcbn0pO1xuXG50ZXN0KCdzeW5jOiBpZGVudCBjb2xsaXNpb24gcmVudW1iZXJzIGFuZCBjb252ZXJnZXMnLCBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IGEgPSBta1N0b3JlKCdpZEEnLCAnam9obicpO1xuICBjb25zdCBiID0gbWtTdG9yZSgnaWRCJywgJ21hcmsnKTtcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRpJyk7XG5cbiAgLy8gQm90aCBjcmVhdGUgVEFTSy0xIG9mZmxpbmUuXG4gIGNvbnN0IGlhID0gYS5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0EgdGFzaycgfSk7XG4gIGNvbnN0IGliID0gYi5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0IgdGFzaycgfSk7XG4gIGFzc2VydC5lcXVhbChpYS5pZGVudCwgJ1RBU0stMScpO1xuICBhc3NlcnQuZXF1YWwoaWIuaWRlbnQsICdUQVNLLTEnKTtcblxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpOyAvLyBleHRyYSByb3VuZHMgdG8gc2V0dGxlIHJlbnVtYmVyIGJyb2FkY2FzdHNcblxuICBjb25zdCBhSWRlbnRzID0gW2Euc3RvcmUuZ2V0SXRlbShpYS5pZCkhLmlkZW50LCBhLnN0b3JlLmdldEl0ZW0oaWIuaWQpIS5pZGVudF0uc29ydCgpO1xuICBjb25zdCBiSWRlbnRzID0gW2Iuc3RvcmUuZ2V0SXRlbShpYS5pZCkhLmlkZW50LCBiLnN0b3JlLmdldEl0ZW0oaWIuaWQpIS5pZGVudF0uc29ydCgpO1xuICBhc3NlcnQubm90RXF1YWwoYUlkZW50c1swXSwgYUlkZW50c1sxXSwgJ2lkZW50cyB1bmlxdWUgb24gQScpO1xuICBhc3NlcnQubm90RXF1YWwoYklkZW50c1swXSwgYklkZW50c1sxXSwgJ2lkZW50cyB1bmlxdWUgb24gQicpO1xuICBhc3NlcnQuZGVlcEVxdWFsKGFJZGVudHMsIGJJZGVudHMsICdib3RoIHNpZGVzIGFncmVlIG9uIGlkZW50cycpO1xuXG4gIGEuY3R4LmRiLmNsb3NlKCk7XG4gIGIuY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnc3luYzogb2ZmbGluZSBlZGl0cyBxdWV1ZSBhbmQgZmx1c2ggd2hlbiBmb2xkZXIgcmV0dXJucycsIGFzeW5jICgpID0+IHtcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ29mZkEnLCAnam9obicpO1xuICBjb25zdCBmb2xkZXIgPSB0bXAoJ3NoYXJlZG8nKTtcbiAgY29uc3QgZW5naW5lID0gbmV3IFN5bmNFbmdpbmUoYS5zdG9yZSwgJ0pvaG4nLCAoKSA9PiB7fSk7XG5cbiAgYS5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ01hZGUgb2ZmbGluZScgfSk7XG4gIGFzc2VydC5vayhlbmdpbmUuc3RhdHVzKCkucGVuZGluZ09wcyA+IDAgfHwgZW5naW5lLnN0YXR1cygpLnN0YXRlID09PSAnZGlzYWJsZWQnKTtcblxuICBlbmdpbmUuc2V0VHJhbnNwb3J0KG5ldyBGb2xkZXJUcmFuc3BvcnQoZm9sZGVyKSk7XG4gIGF3YWl0IGVuZ2luZS5jeWNsZSgpO1xuICBhc3NlcnQuZXF1YWwoZW5naW5lLnN0YXR1cygpLnBlbmRpbmdPcHMsIDAsICdvcHMgZXhwb3J0ZWQgYWZ0ZXIgdHJhbnNwb3J0IGF0dGFjaGVkJyk7XG4gIGF3YWl0IGVuZ2luZS5zdG9wKCk7XG4gIGEuY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnc2VlZCBkYXRhIGxvYWRzLCBpcyBmbGFnZ2VkLCBhbmQgcmVtb3ZlcyBjbGVhbmx5JywgKCkgPT4ge1xuICBjb25zdCB7IGN0eCwgc3RvcmUgfSA9IG1rU3RvcmUoJ3NlZWQnLCAnam9obicpO1xuICBjb25zdCBuID0gbG9hZFNlZWREYXRhKHN0b3JlKTtcbiAgYXNzZXJ0Lm9rKG4gPiAxNSk7XG4gIGNvbnN0IHNhbXBsZXMgPSBzdG9yZS5saXN0SXRlbXMoeyBzYW1wbGU6IHRydWUgfSwgeyBmaWVsZDogJ2NyZWF0ZWRBdCcsIGRpcjogJ2FzYycgfSwgMTAwKTtcbiAgYXNzZXJ0LmVxdWFsKHNhbXBsZXMubGVuZ3RoLCBuKTtcbiAgLy8gbGlua3MgZXhpc3RcbiAgY29uc3Qgd2l0aExpbmtzID0gc2FtcGxlcy5maWx0ZXIoKHMpID0+IHN0b3JlLmxpbmtzRm9yKHMuaWQpLmxlbmd0aCA+IDApO1xuICBhc3NlcnQub2sod2l0aExpbmtzLmxlbmd0aCA+IDUpO1xuXG4gIGNvbnN0IHJlbW92ZWQgPSBzdG9yZS5yZW1vdmVTYW1wbGVEYXRhKCk7XG4gIGFzc2VydC5lcXVhbChyZW1vdmVkLCBuKTtcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmxpc3RJdGVtcyh7fSwgeyBmaWVsZDogJ2NyZWF0ZWRBdCcsIGRpcjogJ2FzYycgfSwgMTAwKS5sZW5ndGgsIDApO1xuICBjdHguZGIuY2xvc2UoKTtcbn0pO1xuXG50ZXN0KCdkYXRhYmFzZSBpbnRlZ3JpdHkgZ3VhcmQgcXVhcmFudGluZXMgY29ycnVwdGlvbicsICgpID0+IHtcbiAgY29uc3QgZGlyID0gdG1wKCdjb3JydXB0Jyk7XG4gIGNvbnN0IGN0eCA9IG9wZW5EYXRhYmFzZShkaXIpO1xuICBjdHguZGIuY2xvc2UoKTtcbiAgLy8gU3RvbXAgdGhlIGZpbGUgaGVhZGVyLlxuICBjb25zdCBkYlBhdGggPSBwYXRoLmpvaW4oZGlyLCAndGV0aGVyLmRiJyk7XG4gIGNvbnN0IGZkID0gZnMub3BlblN5bmMoZGJQYXRoLCAncisnKTtcbiAgZnMud3JpdGVTeW5jKGZkLCBCdWZmZXIuZnJvbSgnR0FSQkFHRUdBUkJBR0VHQVJCQUdFJyksIDAsIDIxLCAwKTtcbiAgZnMuY2xvc2VTeW5jKGZkKTtcbiAgYXNzZXJ0LnRocm93cygoKSA9PiBvcGVuRGF0YWJhc2UoZGlyKSwgL2ludGVncml0eXxtYWxmb3JtZWR8bm90IGEgZGF0YWJhc2UvaSk7XG59KTtcblxudGVzdCgnb3V0LW9mLW9yZGVyIHJlbW90ZSBvcHM6IHNldC9kZWxldGUgYXJyaXZpbmcgYmVmb3JlIGNyZWF0ZSBhcmUgYnVmZmVyZWQsIG5vdCBsb3N0JywgKCkgPT4ge1xuICBjb25zdCBhID0gbWtTdG9yZSgncmVvcmRlcicsICdqb2huJyk7XG4gIC8vIFNpbXVsYXRlIGRldmljZSBDIHJlY2VpdmluZyBCJ3Mgb3BzIGFib3V0IGFuIGl0ZW0gQkVGT1JFIEEncyBjcmVhdGUgb2YgaXQuXG4gIGNvbnN0IGl0ZW1JZCA9ICcwMDAwMDAwMC1hYWFhLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEnO1xuICBjb25zdCBzZXRPcCA9IHtcbiAgICBvcElkOiAnb3Atc2V0LTEnLCBkZXZpY2VJZDogJ2RldmljZS1CJywgYWN0b3JJZDogJ21hcmsnLCBsYW1wb3J0OiAxMCwgYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBlbnRpdHk6ICdpdGVtJyBhcyBjb25zdCwgZW50aXR5SWQ6IGl0ZW1JZCwgYWN0aW9uOiAnc2V0JyBhcyBjb25zdCxcbiAgICBwYXlsb2FkOiB7IGZpZWxkczogeyBzdGF0dXM6ICdpbl9wcm9ncmVzcycgfSwgYmFzZWRPbjogeyBzdGF0dXM6IG51bGwgfSB9LFxuICB9O1xuICBjb25zdCBjcmVhdGVPcCA9IHtcbiAgICBvcElkOiAnb3AtY3JlYXRlLTEnLCBkZXZpY2VJZDogJ2RldmljZS1BJywgYWN0b3JJZDogJ2pvaG4nLCBsYW1wb3J0OiA1LCBhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIGVudGl0eTogJ2l0ZW0nIGFzIGNvbnN0LCBlbnRpdHlJZDogaXRlbUlkLCBhY3Rpb246ICdjcmVhdGUnIGFzIGNvbnN0LFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIHJlY29yZDoge1xuICAgICAgICBpZDogaXRlbUlkLCBpZGVudDogJ1RBU0stOTAwJywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ1Jlb3JkZXJlZCBpdGVtJywgYm9keTogJycsIGJvZHlUZXh0OiAnJyxcbiAgICAgICAgc3RhdHVzOiAndG9kbycsIHByaW9yaXR5OiAnbWVkaXVtJywgb3duZXJJZDogbnVsbCwgcmVwb3J0ZXJJZDogJ2pvaG4nLCBtaWxlc3RvbmVJZDogbnVsbCxcbiAgICAgICAgcmVsZWFzZUlkOiBudWxsLCBwYXJlbnRJZDogbnVsbCwgc3RhcnREYXRlOiBudWxsLCBkdWVEYXRlOiBudWxsLCBjb21wbGV0ZWRBdDogbnVsbCxcbiAgICAgICAgZWZmb3J0OiBudWxsLCBjb25maWRlbmNlOiBudWxsLCByaXNrTGV2ZWw6IG51bGwsIGJ1c2luZXNzVmFsdWU6IG51bGwsIGxlYWRlcnNoaXBWaXNpYmxlOiAwLFxuICAgICAgICBwcm9ncmVzczogbnVsbCwgdGFnczogW10sIGV4dHJhOiB7fSwgYXJjaGl2ZWQ6IDAsIHNhbXBsZTogMCxcbiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksIHVwZGF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBjcmVhdGVkQnk6ICdqb2huJywgdXBkYXRlZEJ5OiAnam9obicsXG4gICAgICB9LFxuICAgIH0sXG4gIH07XG5cbiAgLy8gU2V0IGFycml2ZXMgZmlyc3QgXHUyMDE0IG11c3QgYnVmZmVyLCBpdGVtIG11c3Qgbm90IGV4aXN0IHlldC5cbiAgYS5zdG9yZS5hcHBseVJlbW90ZU9wcyhbc2V0T3BdKTtcbiAgYXNzZXJ0LmVxdWFsKGEuc3RvcmUuZ2V0SXRlbShpdGVtSWQpLCBudWxsKTtcblxuICAvLyBDcmVhdGUgYXJyaXZlcyBcdTIwMTQgaXRlbSBhcHBlYXJzIEFORCB0aGUgYnVmZmVyZWQgc2V0IHJlcGxheXMgb24gdG9wLlxuICBhLnN0b3JlLmFwcGx5UmVtb3RlT3BzKFtjcmVhdGVPcF0pO1xuICBjb25zdCBpdGVtID0gYS5zdG9yZS5nZXRJdGVtKGl0ZW1JZCk7XG4gIGFzc2VydC5vayhpdGVtLCAnaXRlbSBjcmVhdGVkJyk7XG4gIGFzc2VydC5lcXVhbChpdGVtIS5zdGF0dXMsICdpbl9wcm9ncmVzcycsICdidWZmZXJlZCBzZXQgYXBwbGllZCBhZnRlciBjcmVhdGUnKTtcblxuICAvLyBEZWxldGUtYmVmb3JlLWNyZWF0ZSBtdXN0IG5vdCByZXN1cnJlY3Q6IGZyZXNoIGVudGl0eSwgZGVsZXRlIGZpcnN0LCB0aGVuIGNyZWF0ZS5cbiAgY29uc3QgaXRlbTIgPSAnMDAwMDAwMDAtYmJiYi00MDAwLTgwMDAtMDAwMDAwMDAwMDAyJztcbiAgYS5zdG9yZS5hcHBseVJlbW90ZU9wcyhbXG4gICAgeyAuLi5zZXRPcCwgb3BJZDogJ29wLWRlbC0yJywgZW50aXR5SWQ6IGl0ZW0yLCBhY3Rpb246ICdkZWxldGUnIGFzIGNvbnN0LCBsYW1wb3J0OiAyMCwgcGF5bG9hZDoge30gfSxcbiAgXSk7XG4gIGEuc3RvcmUuYXBwbHlSZW1vdGVPcHMoW1xuICAgIHsgLi4uY3JlYXRlT3AsIG9wSWQ6ICdvcC1jcmVhdGUtMicsIGVudGl0eUlkOiBpdGVtMiwgbGFtcG9ydDogNixcbiAgICAgIHBheWxvYWQ6IHsgcmVjb3JkOiB7IC4uLihjcmVhdGVPcC5wYXlsb2FkLnJlY29yZCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiksIGlkOiBpdGVtMiwgaWRlbnQ6ICdUQVNLLTkwMScgfSB9IH0sXG4gIF0pO1xuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW0yKSwgbnVsbCwgJ2RlbGV0ZS1iZWZvcmUtY3JlYXRlIGRvZXMgbm90IHJlc3VycmVjdCB0aGUgaXRlbScpO1xuXG4gIGEuY3R4LmRiLmNsb3NlKCk7XG59KTtcbiIsICJpbXBvcnQgRGF0YWJhc2UgZnJvbSAnYmV0dGVyLXNxbGl0ZTMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBjcnlwdG8gZnJvbSAnbm9kZTpjcnlwdG8nO1xuaW1wb3J0IHsgTUlHUkFUSU9OUyB9IGZyb20gJy4vbWlncmF0aW9ucyc7XG5cbmV4cG9ydCB0eXBlIERCID0gRGF0YWJhc2UuRGF0YWJhc2U7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGJDb250ZXh0IHtcbiAgZGI6IERCO1xuICBkZXZpY2VJZDogc3RyaW5nO1xuICBkYXRhRGlyOiBzdHJpbmc7XG4gIGRiUGF0aDogc3RyaW5nO1xufVxuXG4vKipcbiAqIE9wZW5zIChvciBjcmVhdGVzKSB0aGUgVGV0aGVyIGRhdGFiYXNlLCBhcHBsaWVzIHBlbmRpbmcgbWlncmF0aW9ucyxcbiAqIGFuZCBndWFyYW50ZWVzIGRldmljZSBpZGVudGl0eSBtZXRhZGF0YS5cbiAqXG4gKiBTYWZldHkgcG9zdHVyZTogV0FMIG1vZGUgKyBpbnRlZ3JpdHkgY2hlY2sgb24gb3BlbiArIHRpbWVzdGFtcGVkIGJhY2t1cFxuICogYmVmb3JlIGFueSBtaWdyYXRpb24gYmV5b25kIHZlcnNpb24gMC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9wZW5EYXRhYmFzZShkYXRhRGlyOiBzdHJpbmcpOiBEYkNvbnRleHQge1xuICBmcy5ta2RpclN5bmMoZGF0YURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IGRiUGF0aCA9IHBhdGguam9pbihkYXRhRGlyLCAndGV0aGVyLmRiJyk7XG4gIGNvbnN0IGV4aXN0ZWQgPSBmcy5leGlzdHNTeW5jKGRiUGF0aCk7XG5cbiAgY29uc3QgZGIgPSBuZXcgRGF0YWJhc2UoZGJQYXRoKTtcbiAgZGIucHJhZ21hKCdqb3VybmFsX21vZGUgPSBXQUwnKTtcbiAgZGIucHJhZ21hKCdmb3JlaWduX2tleXMgPSBPTicpO1xuICBkYi5wcmFnbWEoJ3N5bmNocm9ub3VzID0gTk9STUFMJyk7XG5cbiAgaWYgKGV4aXN0ZWQpIHtcbiAgICBjb25zdCBjaGVjayA9IGRiLnByYWdtYSgncXVpY2tfY2hlY2snLCB7IHNpbXBsZTogdHJ1ZSB9KTtcbiAgICBpZiAoY2hlY2sgIT09ICdvaycpIHtcbiAgICAgIC8vIFByZXNlcnZlIHRoZSBkYW1hZ2VkIGZpbGUgZm9yIHJlY292ZXJ5IGFuZCBmYWlsIGxvdWRseSBcdTIwMTQgbmV2ZXIgcnVuIG9uIGEgY29ycnVwdCBkYi5cbiAgICAgIGNvbnN0IHF1YXJhbnRpbmUgPSBkYlBhdGggKyAnLmNvcnJ1cHQtJyArIERhdGUubm93KCk7XG4gICAgICBkYi5jbG9zZSgpO1xuICAgICAgZnMuY29weUZpbGVTeW5jKGRiUGF0aCwgcXVhcmFudGluZSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBEYXRhYmFzZSBmYWlsZWQgaW50ZWdyaXR5IGNoZWNrICgke2NoZWNrfSkuIERhbWFnZWQgY29weSBwcmVzZXJ2ZWQgYXQgJHtxdWFyYW50aW5lfS4gYCArXG4gICAgICAgICAgJ1Jlc3RvcmUgZnJvbSBhIGJhY2t1cCBpbiB0aGUgYmFja3Vwcy8gZm9sZGVyLicsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5TWlncmF0aW9ucyhkYiwgZGF0YURpciwgZGJQYXRoLCBleGlzdGVkKTtcblxuICBjb25zdCBkZXZpY2VJZCA9IGVuc3VyZU1ldGEoZGIsICdkZXZpY2VfaWQnLCAoKSA9PiBjcnlwdG8ucmFuZG9tVVVJRCgpKTtcbiAgZW5zdXJlTWV0YShkYiwgJ3Byb2plY3RfaWQnLCAoKSA9PiBjcnlwdG8ucmFuZG9tVVVJRCgpKTtcblxuICByZXR1cm4geyBkYiwgZGV2aWNlSWQsIGRhdGFEaXIsIGRiUGF0aCB9O1xufVxuXG5mdW5jdGlvbiBhcHBseU1pZ3JhdGlvbnMoZGI6IERCLCBkYXRhRGlyOiBzdHJpbmcsIGRiUGF0aDogc3RyaW5nLCBleGlzdGVkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGhhc01ldGEgPSBkYlxuICAgIC5wcmVwYXJlKFwiU0VMRUNUIENPVU5UKCopIEFTIGMgRlJPTSBzcWxpdGVfbWFzdGVyIFdIRVJFIHR5cGU9J3RhYmxlJyBBTkQgbmFtZT0nbWV0YSdcIilcbiAgICAuZ2V0KCkgYXMgeyBjOiBudW1iZXIgfTtcbiAgbGV0IHZlcnNpb24gPSAwO1xuICBpZiAoaGFzTWV0YS5jID4gMCkge1xuICAgIGNvbnN0IHJvdyA9IGRiLnByZXBhcmUoXCJTRUxFQ1QgdmFsdWUgRlJPTSBtZXRhIFdIRVJFIGtleT0nc2NoZW1hX3ZlcnNpb24nXCIpLmdldCgpIGFzXG4gICAgICB8IHsgdmFsdWU6IHN0cmluZyB9XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICB2ZXJzaW9uID0gcm93ID8gTnVtYmVyKHJvdy52YWx1ZSkgOiAwO1xuICB9XG5cbiAgY29uc3QgcGVuZGluZyA9IE1JR1JBVElPTlMuZmlsdGVyKChtKSA9PiBtLnZlcnNpb24gPiB2ZXJzaW9uKTtcbiAgaWYgKHBlbmRpbmcubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgaWYgKGV4aXN0ZWQgJiYgdmVyc2lvbiA+IDApIHtcbiAgICBjb25zdCBiYWNrdXBEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ2JhY2t1cHMnKTtcbiAgICBmcy5ta2RpclN5bmMoYmFja3VwRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zdCBzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyk7XG4gICAgZnMuY29weUZpbGVTeW5jKGRiUGF0aCwgcGF0aC5qb2luKGJhY2t1cERpciwgYHByZS1taWdyYXRpb24tdiR7dmVyc2lvbn0tJHtzdGFtcH0uZGJgKSk7XG4gIH1cblxuICBjb25zdCBydW4gPSBkYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgZm9yIChjb25zdCBtIG9mIHBlbmRpbmcpIHtcbiAgICAgIGRiLmV4ZWMobS5zcWwpO1xuICAgICAgZGIucHJlcGFyZShcbiAgICAgICAgXCJJTlNFUlQgSU5UTyBtZXRhKGtleSx2YWx1ZSkgVkFMVUVTKCdzY2hlbWFfdmVyc2lvbicsPykgXCIgK1xuICAgICAgICAgIFwiT04gQ09ORkxJQ1Qoa2V5KSBETyBVUERBVEUgU0VUIHZhbHVlPWV4Y2x1ZGVkLnZhbHVlXCIsXG4gICAgICApLnJ1bihTdHJpbmcobS52ZXJzaW9uKSk7XG4gICAgfVxuICB9KTtcbiAgcnVuKCk7XG59XG5cbmZ1bmN0aW9uIGVuc3VyZU1ldGEoZGI6IERCLCBrZXk6IHN0cmluZywgbWFrZTogKCkgPT4gc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgcm93ID0gZGIucHJlcGFyZSgnU0VMRUNUIHZhbHVlIEZST00gbWV0YSBXSEVSRSBrZXk9PycpLmdldChrZXkpIGFzXG4gICAgfCB7IHZhbHVlOiBzdHJpbmcgfVxuICAgIHwgdW5kZWZpbmVkO1xuICBpZiAocm93KSByZXR1cm4gcm93LnZhbHVlO1xuICBjb25zdCB2YWx1ZSA9IG1ha2UoKTtcbiAgZGIucHJlcGFyZSgnSU5TRVJUIElOVE8gbWV0YShrZXksdmFsdWUpIFZBTFVFUyg/LD8pJykucnVuKGtleSwgdmFsdWUpO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXRhKGRiOiBEQiwga2V5OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3Qgcm93ID0gZGIucHJlcGFyZSgnU0VMRUNUIHZhbHVlIEZST00gbWV0YSBXSEVSRSBrZXk9PycpLmdldChrZXkpIGFzXG4gICAgfCB7IHZhbHVlOiBzdHJpbmcgfVxuICAgIHwgdW5kZWZpbmVkO1xuICByZXR1cm4gcm93ID8gcm93LnZhbHVlIDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1ldGEoZGI6IERCLCBrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBkYi5wcmVwYXJlKFxuICAgICdJTlNFUlQgSU5UTyBtZXRhKGtleSx2YWx1ZSkgVkFMVUVTKD8sPykgT04gQ09ORkxJQ1Qoa2V5KSBETyBVUERBVEUgU0VUIHZhbHVlPWV4Y2x1ZGVkLnZhbHVlJyxcbiAgKS5ydW4oa2V5LCB2YWx1ZSk7XG59XG5cbi8qKiBNYW51YWwgYmFja3VwOiBjb25zaXN0ZW50IHNuYXBzaG90IHZpYSBTUUxpdGUgYmFja3VwIEFQSS4gUmV0dXJucyBiYWNrdXAgcGF0aC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBiYWNrdXBEYXRhYmFzZShjdHg6IERiQ29udGV4dCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGJhY2t1cERpciA9IHBhdGguam9pbihjdHguZGF0YURpciwgJ2JhY2t1cHMnKTtcbiAgZnMubWtkaXJTeW5jKGJhY2t1cERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IHN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKTtcbiAgY29uc3QgZGVzdCA9IHBhdGguam9pbihiYWNrdXBEaXIsIGB0ZXRoZXItJHtzdGFtcH0uZGJgKTtcbiAgYXdhaXQgY3R4LmRiLmJhY2t1cChkZXN0KTtcbiAgcmV0dXJuIGRlc3Q7XG59XG4iLCAiLy8gVmVyc2lvbmVkIHNjaGVtYSBtaWdyYXRpb25zLiBOZXZlciBlZGl0IGEgc2hpcHBlZCBtaWdyYXRpb24gXHUyMDE0IGFwcGVuZCBhIG5ldyBvbmUuXG4vLyBSdW5uZXI6IGRiLnRzIGFwcGx5TWlncmF0aW9ucygpLiBFYWNoIG1pZ3JhdGlvbiBydW5zIGluIGEgdHJhbnNhY3Rpb24uXG5cbmV4cG9ydCBpbnRlcmZhY2UgTWlncmF0aW9uIHtcbiAgdmVyc2lvbjogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG4gIHNxbDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgTUlHUkFUSU9OUzogTWlncmF0aW9uW10gPSBbXG4gIHtcbiAgICB2ZXJzaW9uOiAxLFxuICAgIG5hbWU6ICdjb3JlLXNjaGVtYScsXG4gICAgc3FsOiBgXG5DUkVBVEUgVEFCTEUgbWV0YSAoXG4gIGtleSBURVhUIFBSSU1BUlkgS0VZLFxuICB2YWx1ZSBURVhUIE5PVCBOVUxMXG4pO1xuXG5DUkVBVEUgVEFCTEUgdXNlcnMgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXG4gIGluaXRpYWxzIFRFWFQgTk9UIE5VTEwsXG4gIGNvbG9yIFRFWFQgTk9UIE5VTEwsXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTFxuKTtcblxuQ1JFQVRFIFRBQkxFIGl0ZW1zIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgaWRlbnQgVEVYVCBOT1QgTlVMTCBVTklRVUUsXG4gIHR5cGUgVEVYVCBOT1QgTlVMTCxcbiAgdGl0bGUgVEVYVCBOT1QgTlVMTCxcbiAgYm9keSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIGJvZHlfdGV4dCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIHN0YXR1cyBURVhUIE5PVCBOVUxMLFxuICBwcmlvcml0eSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ25vbmUnLFxuICBvd25lcl9pZCBURVhULFxuICByZXBvcnRlcl9pZCBURVhULFxuICBtaWxlc3RvbmVfaWQgVEVYVCxcbiAgcmVsZWFzZV9pZCBURVhULFxuICBwYXJlbnRfaWQgVEVYVCxcbiAgc3RhcnRfZGF0ZSBURVhULFxuICBkdWVfZGF0ZSBURVhULFxuICBjb21wbGV0ZWRfYXQgVEVYVCxcbiAgZWZmb3J0IFJFQUwsXG4gIGNvbmZpZGVuY2UgVEVYVCxcbiAgcmlza19sZXZlbCBURVhULFxuICBidXNpbmVzc192YWx1ZSBURVhULFxuICBsZWFkZXJzaGlwX3Zpc2libGUgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gIHByb2dyZXNzIElOVEVHRVIsXG4gIHRhZ3MgVEVYVCBOT1QgTlVMTCBERUZBVUxUICdbXScsXG4gIGV4dHJhIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAne30nLFxuICBhcmNoaXZlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcbiAgc2FtcGxlIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXG4gIHVwZGF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcbiAgY3JlYXRlZF9ieSBURVhUIE5PVCBOVUxMLFxuICB1cGRhdGVkX2J5IFRFWFQgTk9UIE5VTExcbik7XG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX3R5cGUgT04gaXRlbXModHlwZSkgV0hFUkUgZGVsZXRlZCA9IDA7XG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX3N0YXR1cyBPTiBpdGVtcyhzdGF0dXMpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19vd25lciBPTiBpdGVtcyhvd25lcl9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX21pbGVzdG9uZSBPTiBpdGVtcyhtaWxlc3RvbmVfaWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19yZWxlYXNlIE9OIGl0ZW1zKHJlbGVhc2VfaWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19wYXJlbnQgT04gaXRlbXMocGFyZW50X2lkKSBXSEVSRSBkZWxldGVkID0gMDtcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfdXBkYXRlZCBPTiBpdGVtcyh1cGRhdGVkX2F0KTtcblxuQ1JFQVRFIFRBQkxFIGlkZW50X2NvdW50ZXJzIChcbiAgdHlwZSBURVhUIFBSSU1BUlkgS0VZLFxuICBuZXh0IElOVEVHRVIgTk9UIE5VTExcbik7XG5cbkNSRUFURSBUQUJMRSBsaW5rcyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGZyb21faWQgVEVYVCBOT1QgTlVMTCxcbiAgdG9faWQgVEVYVCBOT1QgTlVMTCxcbiAga2luZCBURVhUIE5PVCBOVUxMLFxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXG4gIGNyZWF0ZWRfYnkgVEVYVCBOT1QgTlVMTFxuKTtcbkNSRUFURSBJTkRFWCBpZHhfbGlua3NfZnJvbSBPTiBsaW5rcyhmcm9tX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcbkNSRUFURSBJTkRFWCBpZHhfbGlua3NfdG8gT04gbGlua3ModG9faWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIFVOSVFVRSBJTkRFWCBpZHhfbGlua3NfdW5pcSBPTiBsaW5rcyhmcm9tX2lkLCB0b19pZCwga2luZCk7XG5cbkNSRUFURSBUQUJMRSBjb21tZW50cyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGl0ZW1faWQgVEVYVCBOT1QgTlVMTCxcbiAgYXV0aG9yX2lkIFRFWFQgTk9UIE5VTEwsXG4gIGJvZHkgVEVYVCBOT1QgTlVMTCxcbiAgYm9keV90ZXh0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxuICB1cGRhdGVkX2F0IFRFWFQsXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcbik7XG5DUkVBVEUgSU5ERVggaWR4X2NvbW1lbnRzX2l0ZW0gT04gY29tbWVudHMoaXRlbV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XG5cbkNSRUFURSBUQUJMRSBhdHRhY2htZW50cyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGl0ZW1faWQgVEVYVCBOT1QgTlVMTCxcbiAgZmlsZW5hbWUgVEVYVCBOT1QgTlVMTCxcbiAgbWltZSBURVhUIE5PVCBOVUxMLFxuICBzaXplIElOVEVHRVIgTk9UIE5VTEwsXG4gIHNoYTI1NiBURVhUIE5PVCBOVUxMLFxuICBkZXNjcmlwdGlvbiBURVhULFxuICB1cGxvYWRlZF9ieSBURVhUIE5PVCBOVUxMLFxuICBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcbik7XG5DUkVBVEUgSU5ERVggaWR4X2F0dGFjaG1lbnRzX2l0ZW0gT04gYXR0YWNobWVudHMoaXRlbV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XG5cbkNSRUFURSBUQUJMRSBhY3Rpdml0eSAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGl0ZW1faWQgVEVYVCxcbiAgYWN0b3JfaWQgVEVYVCBOT1QgTlVMTCxcbiAga2luZCBURVhUIE5PVCBOVUxMLFxuICBmaWVsZCBURVhULFxuICBvbGRfdmFsdWUgVEVYVCxcbiAgbmV3X3ZhbHVlIFRFWFQsXG4gIGF0IFRFWFQgTk9UIE5VTExcbik7XG5DUkVBVEUgSU5ERVggaWR4X2FjdGl2aXR5X2l0ZW0gT04gYWN0aXZpdHkoaXRlbV9pZCk7XG5DUkVBVEUgSU5ERVggaWR4X2FjdGl2aXR5X2F0IE9OIGFjdGl2aXR5KGF0KTtcblxuQ1JFQVRFIFRBQkxFIGl0ZW1fdmVyc2lvbnMgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBpdGVtX2lkIFRFWFQgTk9UIE5VTEwsXG4gIHZlcnNpb24gSU5URUdFUiBOT1QgTlVMTCxcbiAgdGl0bGUgVEVYVCBOT1QgTlVMTCxcbiAgYm9keSBURVhUIE5PVCBOVUxMLFxuICBzYXZlZF9ieSBURVhUIE5PVCBOVUxMLFxuICBzYXZlZF9hdCBURVhUIE5PVCBOVUxMXG4pO1xuQ1JFQVRFIElOREVYIGlkeF92ZXJzaW9uc19pdGVtIE9OIGl0ZW1fdmVyc2lvbnMoaXRlbV9pZCwgdmVyc2lvbik7XG5cbkNSRUFURSBUQUJMRSBtaWxlc3RvbmVzIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgbmFtZSBURVhUIE5PVCBOVUxMLFxuICBkZXNjcmlwdGlvbiBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIHRhcmdldF9kYXRlIFRFWFQsXG4gIHN0YXR1cyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ3BsYW5uZWQnLFxuICBzb3J0IElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBzYW1wbGUgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcbik7XG5cbkNSRUFURSBUQUJMRSByZWxlYXNlcyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIG5hbWUgVEVYVCBOT1QgTlVMTCxcbiAgdmVyc2lvbiBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIHRhcmdldF9kYXRlIFRFWFQsXG4gIHN0YXR1cyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ3BsYW5uZWQnLFxuICBnb2FscyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIG5vdGVzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcbiAgc2FtcGxlIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwXG4pO1xuXG5DUkVBVEUgVEFCTEUgc2F2ZWRfdmlld3MgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXG4gIGNvbmZpZyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ3t9JyxcbiAgcGlubmVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTEwsXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMFxuKTtcblxuLS0gQXBwZW5kLW9ubHkgb3BlcmF0aW9uIGxvZy4gU291cmNlIGZvciBzeW5jIGV4cG9ydDsgcGVlcnMnIG9wcyByZWNvcmRlZCB3aXRoIG9yaWdpbiBkZXZpY2UuXG5DUkVBVEUgVEFCTEUgb3Bsb2cgKFxuICBzZXEgSU5URUdFUiBQUklNQVJZIEtFWSBBVVRPSU5DUkVNRU5ULFxuICBvcF9pZCBURVhUIE5PVCBOVUxMIFVOSVFVRSxcbiAgZGV2aWNlX2lkIFRFWFQgTk9UIE5VTEwsXG4gIGFjdG9yX2lkIFRFWFQgTk9UIE5VTEwsXG4gIGxhbXBvcnQgSU5URUdFUiBOT1QgTlVMTCxcbiAgYXQgVEVYVCBOT1QgTlVMTCxcbiAgZW50aXR5IFRFWFQgTk9UIE5VTEwsXG4gIGVudGl0eV9pZCBURVhUIE5PVCBOVUxMLFxuICBhY3Rpb24gVEVYVCBOT1QgTlVMTCxcbiAgcGF5bG9hZCBURVhUIE5PVCBOVUxMXG4pO1xuQ1JFQVRFIElOREVYIGlkeF9vcGxvZ19lbnRpdHkgT04gb3Bsb2coZW50aXR5LCBlbnRpdHlfaWQpO1xuQ1JFQVRFIElOREVYIGlkeF9vcGxvZ19kZXZpY2UgT04gb3Bsb2coZGV2aWNlX2lkLCBzZXEpO1xuXG4tLSBGaWVsZC1sZXZlbCB3cml0ZSByZWdpc3RyeSBmb3IgTFdXIG1lcmdlOiBsYXN0IChsYW1wb3J0LCBkZXZpY2UpIHRoYXQgd3JvdGUgZWFjaCBmaWVsZC5cbkNSRUFURSBUQUJMRSBmaWVsZF9jbG9jayAoXG4gIGVudGl0eSBURVhUIE5PVCBOVUxMLFxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcbiAgZmllbGQgVEVYVCBOT1QgTlVMTCxcbiAgbGFtcG9ydCBJTlRFR0VSIE5PVCBOVUxMLFxuICBkZXZpY2VfaWQgVEVYVCBOT1QgTlVMTCxcbiAgUFJJTUFSWSBLRVkgKGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZClcbik7XG5cbkNSRUFURSBUQUJMRSBzeW5jX2NvbmZsaWN0cyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGVudGl0eSBURVhUIE5PVCBOVUxMLFxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcbiAgZmllbGQgVEVYVCBOT1QgTlVMTCxcbiAgbG9jYWxfdmFsdWUgVEVYVCBOT1QgTlVMTCxcbiAgcmVtb3RlX3ZhbHVlIFRFWFQgTk9UIE5VTEwsXG4gIHJlbW90ZV9kZXZpY2UgVEVYVCBOT1QgTlVMTCxcbiAgcmVtb3RlX2FjdG9yIFRFWFQgTk9UIE5VTEwsXG4gIGRldGVjdGVkX2F0IFRFWFQgTk9UIE5VTEwsXG4gIHJlc29sdmVkX2F0IFRFWFQsXG4gIHJlc29sdXRpb24gVEVYVFxuKTtcblxuLS0gUGVyLXBlZXIgaW1wb3J0IHByb2dyZXNzOiBoaWdoZXN0IGZpbGUgc2VxdWVuY2UgY29uc3VtZWQgcGVyIGRldmljZS5cbkNSRUFURSBUQUJMRSBzeW5jX3BlZXJzIChcbiAgZGV2aWNlX2lkIFRFWFQgUFJJTUFSWSBLRVksXG4gIHVzZXJfbmFtZSBURVhULFxuICBsYXN0X2ZpbGUgVEVYVCxcbiAgbGFzdF9zZWVuX2F0IFRFWFRcbik7XG5cbkNSRUFURSBWSVJUVUFMIFRBQkxFIGl0ZW1zX2Z0cyBVU0lORyBmdHM1KFxuICBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncyxcbiAgY29udGVudD0naXRlbXMnLCBjb250ZW50X3Jvd2lkPSdyb3dpZCcsXG4gIHRva2VuaXplPSd1bmljb2RlNjEnXG4pO1xuXG5DUkVBVEUgVFJJR0dFUiBpdGVtc19mdHNfYWkgQUZURVIgSU5TRVJUIE9OIGl0ZW1zIEJFR0lOXG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhyb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXG4gIFZBTFVFUyAobmV3LnJvd2lkLCBuZXcuaWRlbnQsIG5ldy50aXRsZSwgbmV3LmJvZHlfdGV4dCwgbmV3LnRhZ3MpO1xuRU5EO1xuQ1JFQVRFIFRSSUdHRVIgaXRlbXNfZnRzX2FkIEFGVEVSIERFTEVURSBPTiBpdGVtcyBCRUdJTlxuICBJTlNFUlQgSU5UTyBpdGVtc19mdHMoaXRlbXNfZnRzLCByb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXG4gIFZBTFVFUyAoJ2RlbGV0ZScsIG9sZC5yb3dpZCwgb2xkLmlkZW50LCBvbGQudGl0bGUsIG9sZC5ib2R5X3RleHQsIG9sZC50YWdzKTtcbkVORDtcbkNSRUFURSBUUklHR0VSIGl0ZW1zX2Z0c19hdSBBRlRFUiBVUERBVEUgT04gaXRlbXMgQkVHSU5cbiAgSU5TRVJUIElOVE8gaXRlbXNfZnRzKGl0ZW1zX2Z0cywgcm93aWQsIGlkZW50LCB0aXRsZSwgYm9keV90ZXh0LCB0YWdzKVxuICBWQUxVRVMgKCdkZWxldGUnLCBvbGQucm93aWQsIG9sZC5pZGVudCwgb2xkLnRpdGxlLCBvbGQuYm9keV90ZXh0LCBvbGQudGFncyk7XG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhyb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXG4gIFZBTFVFUyAobmV3LnJvd2lkLCBuZXcuaWRlbnQsIG5ldy50aXRsZSwgbmV3LmJvZHlfdGV4dCwgbmV3LnRhZ3MpO1xuRU5EO1xuYCxcbiAgfSxcbiAge1xuICAgIHZlcnNpb246IDIsXG4gICAgbmFtZTogJ3BlbmRpbmctb3BzLWJ1ZmZlcicsXG4gICAgc3FsOiBgXG4tLSBPcHMgdGhhdCBhcnJpdmVkIGJlZm9yZSB0aGUgY3JlYXRlIG9mIHRoZWlyIHRhcmdldCBlbnRpdHkgKHBvc3NpYmxlIHdpdGggMytcbi0tIGRldmljZXMsIHNpbmNlIG9yZGVyaW5nIGlzIG9ubHkgZ3VhcmFudGVlZCBwZXIgZGV2aWNlKS4gQnVmZmVyZWQgaGVyZSBhbmRcbi0tIHJlcGxheWVkIG9uY2UgdGhlIGNyZWF0ZSBsYW5kcy5cbkNSRUFURSBUQUJMRSBwZW5kaW5nX29wcyAoXG4gIG9wX2lkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGRldmljZV9pZCBURVhUIE5PVCBOVUxMLFxuICBhY3Rvcl9pZCBURVhUIE5PVCBOVUxMLFxuICBsYW1wb3J0IElOVEVHRVIgTk9UIE5VTEwsXG4gIGF0IFRFWFQgTk9UIE5VTEwsXG4gIGVudGl0eSBURVhUIE5PVCBOVUxMLFxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcbiAgYWN0aW9uIFRFWFQgTk9UIE5VTEwsXG4gIHBheWxvYWQgVEVYVCBOT1QgTlVMTFxuKTtcbkNSRUFURSBJTkRFWCBpZHhfcGVuZGluZ19lbnRpdHkgT04gcGVuZGluZ19vcHMoZW50aXR5LCBlbnRpdHlfaWQpO1xuYCxcbiAgfSxcbl07XG4iLCAiLy8gU3RvcmU6IHRoZSBzaW5nbGUgd3JpdGUgcGF0aC4gRXZlcnkgbXV0YXRpb24gKGxvY2FsIG9yIHJlbW90ZSkgZmxvd3MgdGhyb3VnaCBoZXJlIHNvXG4vLyBTUUxpdGUgc3RhdGUsIHRoZSBvcGxvZywgZmllbGQgY2xvY2tzLCBhY3Rpdml0eSBoaXN0b3J5LCBhbmQgRlRTIHN0YXkgY29uc2lzdGVudC5cbi8vXG4vLyBTeW5jIG1vZGVsIChzZWUgZG9jcy9TWU5DX0FSQ0hJVEVDVFVSRS5tZCk6XG4vLyAtIExvY2FsIG11dGF0aW9ucyBhcHBlbmQgZmllbGQtZ3JhbnVsYXIgb3BzIHRvIG9wbG9nIChsYW1wb3J0IGNsb2NrICsgZGV2aWNlIGlkKS5cbi8vIC0gJ3NldCcgb3BzIGNhcnJ5IGJhc2VkT24gPSB0aGUgKGxhbXBvcnQsZGV2aWNlKSBlYWNoIGZpZWxkIGhhZCB3aGVuIHdyaXR0ZW4sXG4vLyAgIGxldHRpbmcgdGhlIGltcG9ydGVyIGRpc3Rpbmd1aXNoIGNsZWFuIGNhdXNhbCB1cGRhdGVzIGZyb20gdHJ1ZSBjb25jdXJyZW50IGVkaXRzLlxuLy8gLSBDb25jdXJyZW50IGVkaXRzIHJlc29sdmUgYnkgTFdXIChsYW1wb3J0LCBkZXZpY2VJZCB0aWVicmVhaykuIEZvciBjb250ZW50IGZpZWxkc1xuLy8gICAodGl0bGUsIGJvZHkpIHRoZSBsb3NpbmcgdmFsdWUgaXMgcHJlc2VydmVkIGluIHN5bmNfY29uZmxpY3RzIGZvciBtYW51YWwgcmV2aWV3LlxuXG5pbXBvcnQgY3J5cHRvIGZyb20gJ25vZGU6Y3J5cHRvJztcbmltcG9ydCB0eXBlIHsgREIsIERiQ29udGV4dCB9IGZyb20gJy4vZGInO1xuaW1wb3J0IHsgZ2V0TWV0YSwgc2V0TWV0YSB9IGZyb20gJy4vZGInO1xuaW1wb3J0IHR5cGUge1xuICBJdGVtRmlsdGVyLFxuICBJdGVtU29ydCxcbiAgSXRlbVR5cGUsXG4gIE9wLFxuICBXb3JrSXRlbSxcbiAgSXRlbUxpbmssXG4gIENvbW1lbnQsXG4gIE1pbGVzdG9uZSxcbiAgUmVsZWFzZSxcbiAgU2F2ZWRWaWV3LFxuICBVc2VyLFxuICBMaW5rS2luZCxcbiAgU2VhcmNoUmVzdWx0LFxuICBTeW5jQ29uZmxpY3QsXG59IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5pbXBvcnQgeyBJREVOVF9QUkVGSVgsIHN0YXR1c2VzRm9yVHlwZSwgVEVSTUlOQUxfU1RBVFVTRVMgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuaW1wb3J0IHsgZG9jVG9UZXh0IH0gZnJvbSAnLi4vLi4vc2hhcmVkL2RvYyc7XG5cbmNvbnN0IENPTkZMSUNUX1NVUkZBQ0VEX0ZJRUxEUyA9IG5ldyBTZXQoWyd0aXRsZScsICdib2R5J10pO1xuXG4vLyBjYW1lbENhc2UgZmllbGQgLT4gaXRlbXMgY29sdW1uXG5jb25zdCBJVEVNX0NPTFM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIGlkZW50OiAnaWRlbnQnLFxuICB0eXBlOiAndHlwZScsXG4gIHRpdGxlOiAndGl0bGUnLFxuICBib2R5OiAnYm9keScsXG4gIGJvZHlUZXh0OiAnYm9keV90ZXh0JyxcbiAgc3RhdHVzOiAnc3RhdHVzJyxcbiAgcHJpb3JpdHk6ICdwcmlvcml0eScsXG4gIG93bmVySWQ6ICdvd25lcl9pZCcsXG4gIHJlcG9ydGVySWQ6ICdyZXBvcnRlcl9pZCcsXG4gIG1pbGVzdG9uZUlkOiAnbWlsZXN0b25lX2lkJyxcbiAgcmVsZWFzZUlkOiAncmVsZWFzZV9pZCcsXG4gIHBhcmVudElkOiAncGFyZW50X2lkJyxcbiAgc3RhcnREYXRlOiAnc3RhcnRfZGF0ZScsXG4gIGR1ZURhdGU6ICdkdWVfZGF0ZScsXG4gIGNvbXBsZXRlZEF0OiAnY29tcGxldGVkX2F0JyxcbiAgZWZmb3J0OiAnZWZmb3J0JyxcbiAgY29uZmlkZW5jZTogJ2NvbmZpZGVuY2UnLFxuICByaXNrTGV2ZWw6ICdyaXNrX2xldmVsJyxcbiAgYnVzaW5lc3NWYWx1ZTogJ2J1c2luZXNzX3ZhbHVlJyxcbiAgbGVhZGVyc2hpcFZpc2libGU6ICdsZWFkZXJzaGlwX3Zpc2libGUnLFxuICBwcm9ncmVzczogJ3Byb2dyZXNzJyxcbiAgdGFnczogJ3RhZ3MnLFxuICBleHRyYTogJ2V4dHJhJyxcbiAgYXJjaGl2ZWQ6ICdhcmNoaXZlZCcsXG4gIHNhbXBsZTogJ3NhbXBsZScsXG4gIGRlbGV0ZWQ6ICdkZWxldGVkJyxcbiAgdXBkYXRlZEF0OiAndXBkYXRlZF9hdCcsXG4gIHVwZGF0ZWRCeTogJ3VwZGF0ZWRfYnknLFxufTtcblxuY29uc3QgSlNPTl9JVEVNX0ZJRUxEUyA9IG5ldyBTZXQoWyd0YWdzJywgJ2V4dHJhJ10pO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN0b3JlRXZlbnRzIHtcbiAgb25DaGFuZ2U6ICh3aGF0OiB7IGVudGl0eTogc3RyaW5nOyBlbnRpdHlJZDogc3RyaW5nIH0pID0+IHZvaWQ7XG4gIG9uQ29uZmxpY3Q6IChjb25mbGljdDogU3luY0NvbmZsaWN0KSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgU3RvcmUge1xuICByZWFkb25seSBkYjogREI7XG4gIHJlYWRvbmx5IGRldmljZUlkOiBzdHJpbmc7XG4gIGFjdG9ySWQ6IHN0cmluZztcbiAgcHJpdmF0ZSBldmVudHM6IFN0b3JlRXZlbnRzO1xuXG4gIGNvbnN0cnVjdG9yKGN0eDogRGJDb250ZXh0LCBhY3RvcklkOiBzdHJpbmcsIGV2ZW50cz86IFBhcnRpYWw8U3RvcmVFdmVudHM+KSB7XG4gICAgdGhpcy5kYiA9IGN0eC5kYjtcbiAgICB0aGlzLmRldmljZUlkID0gY3R4LmRldmljZUlkO1xuICAgIHRoaXMuYWN0b3JJZCA9IGFjdG9ySWQ7XG4gICAgdGhpcy5ldmVudHMgPSB7XG4gICAgICBvbkNoYW5nZTogZXZlbnRzPy5vbkNoYW5nZSA/PyAoKCkgPT4ge30pLFxuICAgICAgb25Db25mbGljdDogZXZlbnRzPy5vbkNvbmZsaWN0ID8/ICgoKSA9PiB7fSksXG4gICAgfTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gY2xvY2tzIC0tLS0tLS0tLS1cbiAgcHJpdmF0ZSB0aWNrTGFtcG9ydCgpOiBudW1iZXIge1xuICAgIGNvbnN0IGN1ciA9IE51bWJlcihnZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JykgPz8gJzAnKSArIDE7XG4gICAgc2V0TWV0YSh0aGlzLmRiLCAnbGFtcG9ydCcsIFN0cmluZyhjdXIpKTtcbiAgICByZXR1cm4gY3VyO1xuICB9XG5cbiAgcHJpdmF0ZSB3aXRuZXNzTGFtcG9ydChyZW1vdGU6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGN1ciA9IE51bWJlcihnZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JykgPz8gJzAnKTtcbiAgICBpZiAocmVtb3RlID4gY3VyKSBzZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JywgU3RyaW5nKHJlbW90ZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3coKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaWVsZENsb2NrKGVudGl0eTogc3RyaW5nLCBlbnRpdHlJZDogc3RyaW5nLCBmaWVsZDogc3RyaW5nKTogeyBsYW1wb3J0OiBudW1iZXI7IGRldmljZUlkOiBzdHJpbmcgfSB8IG51bGwge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgbGFtcG9ydCwgZGV2aWNlX2lkIEZST00gZmllbGRfY2xvY2sgV0hFUkUgZW50aXR5PT8gQU5EIGVudGl0eV9pZD0/IEFORCBmaWVsZD0/JylcbiAgICAgIC5nZXQoZW50aXR5LCBlbnRpdHlJZCwgZmllbGQpIGFzIHsgbGFtcG9ydDogbnVtYmVyOyBkZXZpY2VfaWQ6IHN0cmluZyB9IHwgdW5kZWZpbmVkO1xuICAgIHJldHVybiByb3cgPyB7IGxhbXBvcnQ6IHJvdy5sYW1wb3J0LCBkZXZpY2VJZDogcm93LmRldmljZV9pZCB9IDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgc2V0RmllbGRDbG9jayhlbnRpdHk6IHN0cmluZywgZW50aXR5SWQ6IHN0cmluZywgZmllbGQ6IHN0cmluZywgbGFtcG9ydDogbnVtYmVyLCBkZXZpY2VJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5kYlxuICAgICAgLnByZXBhcmUoXG4gICAgICAgIGBJTlNFUlQgSU5UTyBmaWVsZF9jbG9jayhlbnRpdHksIGVudGl0eV9pZCwgZmllbGQsIGxhbXBvcnQsIGRldmljZV9pZCkgVkFMVUVTKD8sPyw/LD8sPylcbiAgICAgICAgIE9OIENPTkZMSUNUKGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZCkgRE8gVVBEQVRFIFNFVCBsYW1wb3J0PWV4Y2x1ZGVkLmxhbXBvcnQsIGRldmljZV9pZD1leGNsdWRlZC5kZXZpY2VfaWRgLFxuICAgICAgKVxuICAgICAgLnJ1bihlbnRpdHksIGVudGl0eUlkLCBmaWVsZCwgbGFtcG9ydCwgZGV2aWNlSWQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBvcGxvZyAtLS0tLS0tLS0tXG4gIHByaXZhdGUgYXBwZW5kT3Aob3A6IE9wKTogdm9pZCB7XG4gICAgdGhpcy5kYlxuICAgICAgLnByZXBhcmUoXG4gICAgICAgIGBJTlNFUlQgSU5UTyBvcGxvZyhvcF9pZCwgZGV2aWNlX2lkLCBhY3Rvcl9pZCwgbGFtcG9ydCwgYXQsIGVudGl0eSwgZW50aXR5X2lkLCBhY3Rpb24sIHBheWxvYWQpXG4gICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LD8pYCxcbiAgICAgIClcbiAgICAgIC5ydW4ob3Aub3BJZCwgb3AuZGV2aWNlSWQsIG9wLmFjdG9ySWQsIG9wLmxhbXBvcnQsIG9wLmF0LCBvcC5lbnRpdHksIG9wLmVudGl0eUlkLCBvcC5hY3Rpb24sIEpTT04uc3RyaW5naWZ5KG9wLnBheWxvYWQpKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9jYWxPcChcbiAgICBlbnRpdHk6IE9wWydlbnRpdHknXSxcbiAgICBlbnRpdHlJZDogc3RyaW5nLFxuICAgIGFjdGlvbjogT3BbJ2FjdGlvbiddLFxuICAgIHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApOiBPcCB7XG4gICAgY29uc3QgbGFtcG9ydCA9IHRoaXMudGlja0xhbXBvcnQoKTtcbiAgICBjb25zdCBvcDogT3AgPSB7XG4gICAgICBvcElkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgZGV2aWNlSWQ6IHRoaXMuZGV2aWNlSWQsXG4gICAgICBhY3RvcklkOiB0aGlzLmFjdG9ySWQsXG4gICAgICBsYW1wb3J0LFxuICAgICAgYXQ6IHRoaXMubm93KCksXG4gICAgICBlbnRpdHksXG4gICAgICBlbnRpdHlJZCxcbiAgICAgIGFjdGlvbixcbiAgICAgIHBheWxvYWQsXG4gICAgfTtcbiAgICB0aGlzLmFwcGVuZE9wKG9wKTtcbiAgICByZXR1cm4gb3A7XG4gIH1cblxuICAvKiogTG9jYWwgJ3NldCc6IHJlY29yZHMgYmFzZWRPbiBjbG9ja3MgdGhlbiBhZHZhbmNlcyB0aGVtLiAqL1xuICBwcml2YXRlIGxvY2FsU2V0KGVudGl0eTogT3BbJ2VudGl0eSddLCBlbnRpdHlJZDogc3RyaW5nLCBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3QgYmFzZWRPbjogUmVjb3JkPHN0cmluZywgeyBsYW1wb3J0OiBudW1iZXI7IGRldmljZUlkOiBzdHJpbmcgfSB8IG51bGw+ID0ge307XG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKGZpZWxkcykpIGJhc2VkT25bZl0gPSB0aGlzLmZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZik7XG4gICAgY29uc3Qgb3AgPSB0aGlzLmxvY2FsT3AoZW50aXR5LCBlbnRpdHlJZCwgJ3NldCcsIHsgZmllbGRzLCBiYXNlZE9uIH0pO1xuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhmaWVsZHMpKSB0aGlzLnNldEZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgdGhpcy5kZXZpY2VJZCk7XG4gIH1cblxuICBwcml2YXRlIGxvY2FsQ3JlYXRlKGVudGl0eTogT3BbJ2VudGl0eSddLCBlbnRpdHlJZDogc3RyaW5nLCByZWNvcmQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3Qgb3AgPSB0aGlzLmxvY2FsT3AoZW50aXR5LCBlbnRpdHlJZCwgJ2NyZWF0ZScsIHsgcmVjb3JkIH0pO1xuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhyZWNvcmQpKSB0aGlzLnNldEZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgdGhpcy5kZXZpY2VJZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGlkZW50IGFsbG9jYXRpb24gLS0tLS0tLS0tLVxuICBhbGxvY0lkZW50KHR5cGU6IEl0ZW1UeXBlKTogc3RyaW5nIHtcbiAgICBjb25zdCBwcmVmaXggPSBJREVOVF9QUkVGSVhbdHlwZV07XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgbmV4dCBGUk9NIGlkZW50X2NvdW50ZXJzIFdIRVJFIHR5cGU9PycpLmdldCh0eXBlKSBhc1xuICAgICAgfCB7IG5leHQ6IG51bWJlciB9XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBsZXQgbiA9IHJvdyA/IHJvdy5uZXh0IDogMTtcbiAgICAvLyBTa2lwIG51bWJlcnMgYWxyZWFkeSB0YWtlbiAoaW1wb3J0cyBtYXkgaGF2ZSBhZHZhbmNlZCB1c2FnZSBwYXN0IG91ciBjb3VudGVyKS5cbiAgICB3aGlsZSAodGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIGl0ZW1zIFdIRVJFIGlkZW50PT8nKS5nZXQoYCR7cHJlZml4fS0ke259YCkpIG4rKztcbiAgICB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gaWRlbnRfY291bnRlcnModHlwZSxuZXh0KSBWQUxVRVMoPyw/KSBPTiBDT05GTElDVCh0eXBlKSBETyBVUERBVEUgU0VUIG5leHQ9PycpXG4gICAgICAucnVuKHR5cGUsIG4gKyAxLCBuICsgMSk7XG4gICAgcmV0dXJuIGAke3ByZWZpeH0tJHtufWA7XG4gIH1cblxuICAvKiogQWR2YW5jZSB0aGUgbG9jYWwgY291bnRlciBwYXN0IGFuIGlkZW50IG9ic2VydmVkIGZyb20gYSBwZWVyLiAqL1xuICBwcml2YXRlIHdpdG5lc3NJZGVudCh0eXBlOiBJdGVtVHlwZSwgaWRlbnQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IG0gPSAvLShcXGQrKSQvLmV4ZWMoaWRlbnQpO1xuICAgIGlmICghbSkgcmV0dXJuO1xuICAgIGNvbnN0IG4gPSBOdW1iZXIobVsxXSk7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgbmV4dCBGUk9NIGlkZW50X2NvdW50ZXJzIFdIRVJFIHR5cGU9PycpLmdldCh0eXBlKSBhc1xuICAgICAgfCB7IG5leHQ6IG51bWJlciB9XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBpZiAoIXJvdyB8fCByb3cubmV4dCA8PSBuKSB7XG4gICAgICB0aGlzLmRiXG4gICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBpZGVudF9jb3VudGVycyh0eXBlLG5leHQpIFZBTFVFUyg/LD8pIE9OIENPTkZMSUNUKHR5cGUpIERPIFVQREFURSBTRVQgbmV4dD0/JylcbiAgICAgICAgLnJ1bih0eXBlLCBuICsgMSwgbiArIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gYWN0aXZpdHkgLS0tLS0tLS0tLVxuICBwcml2YXRlIGxvZ0FjdGl2aXR5KGl0ZW1JZDogc3RyaW5nIHwgbnVsbCwga2luZDogc3RyaW5nLCBmaWVsZD86IHN0cmluZyB8IG51bGwsIG9sZFY/OiB1bmtub3duLCBuZXdWPzogdW5rbm93bik6IHZvaWQge1xuICAgIHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBhY3Rpdml0eShpZCwgaXRlbV9pZCwgYWN0b3JfaWQsIGtpbmQsIGZpZWxkLCBvbGRfdmFsdWUsIG5ld192YWx1ZSwgYXQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8pJylcbiAgICAgIC5ydW4oXG4gICAgICAgIGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgIGl0ZW1JZCxcbiAgICAgICAgdGhpcy5hY3RvcklkLFxuICAgICAgICBraW5kLFxuICAgICAgICBmaWVsZCA/PyBudWxsLFxuICAgICAgICBvbGRWID09IG51bGwgPyBudWxsIDogU3RyaW5nKG9sZFYpLnNsaWNlKDAsIDUwMCksXG4gICAgICAgIG5ld1YgPT0gbnVsbCA/IG51bGwgOiBTdHJpbmcobmV3Vikuc2xpY2UoMCwgNTAwKSxcbiAgICAgICAgdGhpcy5ub3coKSxcbiAgICAgICk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGl0ZW1zIC0tLS0tLS0tLS1cbiAgY3JlYXRlSXRlbShpbnB1dDogUGFydGlhbDxXb3JrSXRlbT4gJiB7IHR5cGU6IEl0ZW1UeXBlOyB0aXRsZTogc3RyaW5nIH0pOiBXb3JrSXRlbSB7XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIGNvbnN0IGlkID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICAgIGNvbnN0IGlkZW50ID0gdGhpcy5hbGxvY0lkZW50KGlucHV0LnR5cGUpO1xuICAgICAgY29uc3Qgbm93ID0gdGhpcy5ub3coKTtcbiAgICAgIGNvbnN0IHN0YXR1c2VzID0gc3RhdHVzZXNGb3JUeXBlKGlucHV0LnR5cGUpO1xuICAgICAgY29uc3QgaXRlbTogV29ya0l0ZW0gPSB7XG4gICAgICAgIGlkLFxuICAgICAgICBpZGVudCxcbiAgICAgICAgdHlwZTogaW5wdXQudHlwZSxcbiAgICAgICAgdGl0bGU6IGlucHV0LnRpdGxlLFxuICAgICAgICBib2R5OiBpbnB1dC5ib2R5ID8/ICcnLFxuICAgICAgICBib2R5VGV4dDogaW5wdXQuYm9keVRleHQgPz8gJycsXG4gICAgICAgIHN0YXR1czogaW5wdXQuc3RhdHVzICYmIHN0YXR1c2VzLmluY2x1ZGVzKGlucHV0LnN0YXR1cykgPyBpbnB1dC5zdGF0dXMgOiBzdGF0dXNlc1swXSxcbiAgICAgICAgcHJpb3JpdHk6IGlucHV0LnByaW9yaXR5ID8/ICdub25lJyxcbiAgICAgICAgb3duZXJJZDogaW5wdXQub3duZXJJZCA/PyBudWxsLFxuICAgICAgICByZXBvcnRlcklkOiBpbnB1dC5yZXBvcnRlcklkID8/IHRoaXMuYWN0b3JJZCxcbiAgICAgICAgbWlsZXN0b25lSWQ6IGlucHV0Lm1pbGVzdG9uZUlkID8/IG51bGwsXG4gICAgICAgIHJlbGVhc2VJZDogaW5wdXQucmVsZWFzZUlkID8/IG51bGwsXG4gICAgICAgIHBhcmVudElkOiBpbnB1dC5wYXJlbnRJZCA/PyBudWxsLFxuICAgICAgICBzdGFydERhdGU6IGlucHV0LnN0YXJ0RGF0ZSA/PyBudWxsLFxuICAgICAgICBkdWVEYXRlOiBpbnB1dC5kdWVEYXRlID8/IG51bGwsXG4gICAgICAgIGNvbXBsZXRlZEF0OiBudWxsLFxuICAgICAgICBlZmZvcnQ6IGlucHV0LmVmZm9ydCA/PyBudWxsLFxuICAgICAgICBjb25maWRlbmNlOiBpbnB1dC5jb25maWRlbmNlID8/IG51bGwsXG4gICAgICAgIHJpc2tMZXZlbDogaW5wdXQucmlza0xldmVsID8/IG51bGwsXG4gICAgICAgIGJ1c2luZXNzVmFsdWU6IGlucHV0LmJ1c2luZXNzVmFsdWUgPz8gbnVsbCxcbiAgICAgICAgbGVhZGVyc2hpcFZpc2libGU6IGlucHV0LmxlYWRlcnNoaXBWaXNpYmxlID8/IDAsXG4gICAgICAgIHByb2dyZXNzOiBpbnB1dC5wcm9ncmVzcyA/PyBudWxsLFxuICAgICAgICB0YWdzOiBpbnB1dC50YWdzID8/IFtdLFxuICAgICAgICBleHRyYTogaW5wdXQuZXh0cmEgPz8ge30sXG4gICAgICAgIGFyY2hpdmVkOiAwLFxuICAgICAgICBzYW1wbGU6IGlucHV0LnNhbXBsZSA/PyAwLFxuICAgICAgICBjcmVhdGVkQXQ6IG5vdyxcbiAgICAgICAgdXBkYXRlZEF0OiBub3csXG4gICAgICAgIGNyZWF0ZWRCeTogdGhpcy5hY3RvcklkLFxuICAgICAgICB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCxcbiAgICAgIH07XG4gICAgICB0aGlzLmluc2VydEl0ZW1Sb3coaXRlbSk7XG4gICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdpdGVtJywgaWQsIHRoaXMuaXRlbVRvUmVjb3JkKGl0ZW0pKTtcbiAgICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsICdjcmVhdGVkJywgbnVsbCwgbnVsbCwgaXRlbS50aXRsZSk7XG4gICAgICByZXR1cm4gaXRlbTtcbiAgICB9KTtcbiAgICBjb25zdCBpdGVtID0gdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaXRlbS5pZCB9KTtcbiAgICByZXR1cm4gaXRlbTtcbiAgfVxuXG4gIHByaXZhdGUgaXRlbVRvUmVjb3JkKGl0ZW06IFdvcmtJdGVtKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICAgIHJldHVybiB7IC4uLml0ZW0sIHRhZ3M6IGl0ZW0udGFncywgZXh0cmE6IGl0ZW0uZXh0cmEgfTtcbiAgfVxuXG4gIHByaXZhdGUgaW5zZXJ0SXRlbVJvdyhpOiBXb3JrSXRlbSk6IHZvaWQge1xuICAgIHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKFxuICAgICAgICBgSU5TRVJUIElOVE8gaXRlbXMoaWQsIGlkZW50LCB0eXBlLCB0aXRsZSwgYm9keSwgYm9keV90ZXh0LCBzdGF0dXMsIHByaW9yaXR5LCBvd25lcl9pZCwgcmVwb3J0ZXJfaWQsXG4gICAgICAgICAgbWlsZXN0b25lX2lkLCByZWxlYXNlX2lkLCBwYXJlbnRfaWQsIHN0YXJ0X2RhdGUsIGR1ZV9kYXRlLCBjb21wbGV0ZWRfYXQsIGVmZm9ydCwgY29uZmlkZW5jZSxcbiAgICAgICAgICByaXNrX2xldmVsLCBidXNpbmVzc192YWx1ZSwgbGVhZGVyc2hpcF92aXNpYmxlLCBwcm9ncmVzcywgdGFncywgZXh0cmEsIGFyY2hpdmVkLCBzYW1wbGUsIGRlbGV0ZWQsXG4gICAgICAgICAgY3JlYXRlZF9hdCwgdXBkYXRlZF9hdCwgY3JlYXRlZF9ieSwgdXBkYXRlZF9ieSlcbiAgICAgICAgIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sMCw/LD8sPyw/KWAsXG4gICAgICApXG4gICAgICAucnVuKFxuICAgICAgICBpLmlkLCBpLmlkZW50LCBpLnR5cGUsIGkudGl0bGUsIGkuYm9keSwgaS5ib2R5VGV4dCwgaS5zdGF0dXMsIGkucHJpb3JpdHksIGkub3duZXJJZCwgaS5yZXBvcnRlcklkLFxuICAgICAgICBpLm1pbGVzdG9uZUlkLCBpLnJlbGVhc2VJZCwgaS5wYXJlbnRJZCwgaS5zdGFydERhdGUsIGkuZHVlRGF0ZSwgaS5jb21wbGV0ZWRBdCwgaS5lZmZvcnQsIGkuY29uZmlkZW5jZSxcbiAgICAgICAgaS5yaXNrTGV2ZWwsIGkuYnVzaW5lc3NWYWx1ZSwgaS5sZWFkZXJzaGlwVmlzaWJsZSwgaS5wcm9ncmVzcywgSlNPTi5zdHJpbmdpZnkoaS50YWdzKSwgSlNPTi5zdHJpbmdpZnkoaS5leHRyYSksXG4gICAgICAgIGkuYXJjaGl2ZWQsIGkuc2FtcGxlLCBpLmNyZWF0ZWRBdCwgaS51cGRhdGVkQXQsIGkuY3JlYXRlZEJ5LCBpLnVwZGF0ZWRCeSxcbiAgICAgICk7XG4gIH1cblxuICB1cGRhdGVJdGVtKGlkOiBzdHJpbmcsIGZpZWxkczogUGFydGlhbDxXb3JrSXRlbT4pOiBXb3JrSXRlbSB8IG51bGwge1xuICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuZ2V0SXRlbShpZCk7XG4gICAgaWYgKCFiZWZvcmUpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IGNoYW5nZWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoZmllbGRzKSkge1xuICAgICAgaWYgKCEoayBpbiBJVEVNX0NPTFMpIHx8IGsgPT09ICdkZWxldGVkJykgY29udGludWU7XG4gICAgICBjb25zdCBwcmV2ID0gKGJlZm9yZSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrXTtcbiAgICAgIGNvbnN0IHNhbWUgPSBKU09OX0lURU1fRklFTERTLmhhcyhrKSA/IEpTT04uc3RyaW5naWZ5KHByZXYpID09PSBKU09OLnN0cmluZ2lmeSh2KSA6IHByZXYgPT09IHY7XG4gICAgICBpZiAoIXNhbWUpIGNoYW5nZWRba10gPSB2O1xuICAgIH1cbiAgICBpZiAoT2JqZWN0LmtleXMoY2hhbmdlZCkubGVuZ3RoID09PSAwKSByZXR1cm4gYmVmb3JlO1xuXG4gICAgLy8gU3RhdHVzIHRyYW5zaXRpb25zIG1haW50YWluIGNvbXBsZXRlZEF0IGF1dG9tYXRpY2FsbHkuXG4gICAgaWYgKCdzdGF0dXMnIGluIGNoYW5nZWQpIHtcbiAgICAgIGNvbnN0IHRlcm1pbmFsTm93ID0gVEVSTUlOQUxfU1RBVFVTRVMuaGFzKFN0cmluZyhjaGFuZ2VkLnN0YXR1cykpO1xuICAgICAgY29uc3QgdGVybWluYWxCZWZvcmUgPSBURVJNSU5BTF9TVEFUVVNFUy5oYXMoYmVmb3JlLnN0YXR1cyk7XG4gICAgICBpZiAodGVybWluYWxOb3cgJiYgIXRlcm1pbmFsQmVmb3JlKSBjaGFuZ2VkLmNvbXBsZXRlZEF0ID0gdGhpcy5ub3coKTtcbiAgICAgIGlmICghdGVybWluYWxOb3cgJiYgdGVybWluYWxCZWZvcmUpIGNoYW5nZWQuY29tcGxldGVkQXQgPSBudWxsO1xuICAgIH1cbiAgICBjaGFuZ2VkLnVwZGF0ZWRBdCA9IHRoaXMubm93KCk7XG4gICAgY2hhbmdlZC51cGRhdGVkQnkgPSB0aGlzLmFjdG9ySWQ7XG5cbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoaWQsIGNoYW5nZWQpO1xuICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGlkLCBjaGFuZ2VkKTtcbiAgICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKGNoYW5nZWQpKSB7XG4gICAgICAgIGlmIChrID09PSAndXBkYXRlZEF0JyB8fCBrID09PSAndXBkYXRlZEJ5JykgY29udGludWU7XG4gICAgICAgIGlmIChrID09PSAnYm9keScgfHwgayA9PT0gJ2JvZHlUZXh0JykgY29udGludWU7IC8vIGJvZHkgZWRpdHMgbG9nZ2VkIGFzIG9uZSAnZWRpdGVkJyBlbnRyeVxuICAgICAgICB0aGlzLmxvZ0FjdGl2aXR5KGlkLCAndXBkYXRlZCcsIGssIChiZWZvcmUgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba10sIEpTT05fSVRFTV9GSUVMRFMuaGFzKGspID8gSlNPTi5zdHJpbmdpZnkodikgOiB2KTtcbiAgICAgIH1cbiAgICAgIGlmICgnYm9keScgaW4gY2hhbmdlZCkgdGhpcy5sb2dBY3Rpdml0eShpZCwgJ2VkaXRlZCcsICdib2R5Jyk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaWQgfSk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0SXRlbShpZCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5SXRlbUZpZWxkcyhpZDogc3RyaW5nLCBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3Qgc2V0czogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCB2YWxzOiB1bmtub3duW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XG4gICAgICBjb25zdCBjb2wgPSBJVEVNX0NPTFNba107XG4gICAgICBpZiAoIWNvbCkgY29udGludWU7XG4gICAgICBzZXRzLnB1c2goYCR7Y29sfT0/YCk7XG4gICAgICB2YWxzLnB1c2goSlNPTl9JVEVNX0ZJRUxEUy5oYXMoaykgPyBKU09OLnN0cmluZ2lmeSh2KSA6IHYpO1xuICAgIH1cbiAgICBpZiAoc2V0cy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICB2YWxzLnB1c2goaWQpO1xuICAgIHRoaXMuZGIucHJlcGFyZShgVVBEQVRFIGl0ZW1zIFNFVCAke3NldHMuam9pbignLCAnKX0gV0hFUkUgaWQ9P2ApLnJ1biguLi52YWxzKTtcbiAgfVxuXG4gIGFyY2hpdmVJdGVtKGlkOiBzdHJpbmcsIGFyY2hpdmVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgLy8gdXBkYXRlSXRlbSBhbHJlYWR5IHdyaXRlcyB0aGUgYWN0aXZpdHkgZW50cnkgZm9yIHRoZSBhcmNoaXZlZC1maWVsZCBjaGFuZ2UuXG4gICAgdGhpcy51cGRhdGVJdGVtKGlkLCB7IGFyY2hpdmVkOiBhcmNoaXZlZCA/IDEgOiAwIH0gYXMgUGFydGlhbDxXb3JrSXRlbT4pO1xuICB9XG5cbiAgZGVsZXRlSXRlbShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGl0ZW1zIFNFVCBkZWxldGVkPTEsIHVwZGF0ZWRfYXQ9PywgdXBkYXRlZF9ieT0/IFdIRVJFIGlkPT8nKS5ydW4odGhpcy5ub3coKSwgdGhpcy5hY3RvcklkLCBpZCk7XG4gICAgICB0aGlzLmxvY2FsT3AoJ2l0ZW0nLCBpZCwgJ2RlbGV0ZScsIHt9KTtcbiAgICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsICdkZWxldGVkJyk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaWQgfSk7XG4gIH1cblxuICBnZXRJdGVtKGlkOiBzdHJpbmcpOiBXb3JrSXRlbSB8IG51bGwge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBpdGVtcyBXSEVSRSBpZD0/IEFORCBkZWxldGVkPTAnKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICAgIHJldHVybiByb3cgPyByb3dUb0l0ZW0ocm93KSA6IG51bGw7XG4gIH1cblxuICBnZXRJdGVtQnlJZGVudChpZGVudDogc3RyaW5nKTogV29ya0l0ZW0gfCBudWxsIHtcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PyBDT0xMQVRFIE5PQ0FTRSBBTkQgZGVsZXRlZD0wJykuZ2V0KGlkZW50KSBhc1xuICAgICAgfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgICAgfCB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHJvdyA/IHJvd1RvSXRlbShyb3cpIDogbnVsbDtcbiAgfVxuXG4gIGxpc3RJdGVtcyhmaWx0ZXI6IEl0ZW1GaWx0ZXIgPSB7fSwgc29ydDogSXRlbVNvcnQgPSB7IGZpZWxkOiAndXBkYXRlZEF0JywgZGlyOiAnZGVzYycgfSwgbGltaXQgPSA1MDAsIG9mZnNldCA9IDApOiBXb3JrSXRlbVtdIHtcbiAgICBjb25zdCB3aGVyZTogc3RyaW5nW10gPSBbJ2RlbGV0ZWQ9MCddO1xuICAgIGNvbnN0IHZhbHM6IHVua25vd25bXSA9IFtdO1xuICAgIGlmIChmaWx0ZXIuYXJjaGl2ZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgd2hlcmUucHVzaCgnYXJjaGl2ZWQ9PycpO1xuICAgICAgdmFscy5wdXNoKGZpbHRlci5hcmNoaXZlZCA/IDEgOiAwKTtcbiAgICB9IGVsc2Ugd2hlcmUucHVzaCgnYXJjaGl2ZWQ9MCcpO1xuICAgIGlmIChmaWx0ZXIudHlwZXM/Lmxlbmd0aCkge1xuICAgICAgd2hlcmUucHVzaChgdHlwZSBJTiAoJHtmaWx0ZXIudHlwZXMubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcbiAgICAgIHZhbHMucHVzaCguLi5maWx0ZXIudHlwZXMpO1xuICAgIH1cbiAgICBpZiAoZmlsdGVyLnN0YXR1c2VzPy5sZW5ndGgpIHtcbiAgICAgIHdoZXJlLnB1c2goYHN0YXR1cyBJTiAoJHtmaWx0ZXIuc3RhdHVzZXMubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcbiAgICAgIHZhbHMucHVzaCguLi5maWx0ZXIuc3RhdHVzZXMpO1xuICAgIH1cbiAgICBpZiAoZmlsdGVyLnByaW9yaXRpZXM/Lmxlbmd0aCkge1xuICAgICAgd2hlcmUucHVzaChgcHJpb3JpdHkgSU4gKCR7ZmlsdGVyLnByaW9yaXRpZXMubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcbiAgICAgIHZhbHMucHVzaCguLi5maWx0ZXIucHJpb3JpdGllcyk7XG4gICAgfVxuICAgIGlmIChmaWx0ZXIub3duZXJJZHM/Lmxlbmd0aCkge1xuICAgICAgY29uc3Qgbm9uTnVsbCA9IGZpbHRlci5vd25lcklkcy5maWx0ZXIoKG8pID0+IG8gIT09IG51bGwpO1xuICAgICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgICBpZiAobm9uTnVsbC5sZW5ndGgpIHtcbiAgICAgICAgcGFydHMucHVzaChgb3duZXJfaWQgSU4gKCR7bm9uTnVsbC5tYXAoKCkgPT4gJz8nKS5qb2luKCcsJyl9KWApO1xuICAgICAgICB2YWxzLnB1c2goLi4ubm9uTnVsbCk7XG4gICAgICB9XG4gICAgICBpZiAoZmlsdGVyLm93bmVySWRzLmluY2x1ZGVzKG51bGwpKSBwYXJ0cy5wdXNoKCdvd25lcl9pZCBJUyBOVUxMJyk7XG4gICAgICB3aGVyZS5wdXNoKGAoJHtwYXJ0cy5qb2luKCcgT1IgJyl9KWApO1xuICAgIH1cbiAgICBpZiAoZmlsdGVyLm1pbGVzdG9uZUlkKSB7IHdoZXJlLnB1c2goJ21pbGVzdG9uZV9pZD0/Jyk7IHZhbHMucHVzaChmaWx0ZXIubWlsZXN0b25lSWQpOyB9XG4gICAgaWYgKGZpbHRlci5yZWxlYXNlSWQpIHsgd2hlcmUucHVzaCgncmVsZWFzZV9pZD0/Jyk7IHZhbHMucHVzaChmaWx0ZXIucmVsZWFzZUlkKTsgfVxuICAgIGlmIChmaWx0ZXIucGFyZW50SWQpIHsgd2hlcmUucHVzaCgncGFyZW50X2lkPT8nKTsgdmFscy5wdXNoKGZpbHRlci5wYXJlbnRJZCk7IH1cbiAgICBpZiAoZmlsdGVyLnRhZykgeyB3aGVyZS5wdXNoKFwidGFncyBMSUtFID9cIik7IHZhbHMucHVzaChgJSR7SlNPTi5zdHJpbmdpZnkoZmlsdGVyLnRhZyl9JWApOyB9XG4gICAgaWYgKGZpbHRlci5vdmVyZHVlKSB7IHdoZXJlLnB1c2goXCJkdWVfZGF0ZSBJUyBOT1QgTlVMTCBBTkQgZHVlX2RhdGUgPCBkYXRlKCdub3cnKSBBTkQgY29tcGxldGVkX2F0IElTIE5VTExcIik7IH1cbiAgICBpZiAoZmlsdGVyLmR1ZVdpdGhpbkRheXMgIT0gbnVsbCkge1xuICAgICAgd2hlcmUucHVzaChcImR1ZV9kYXRlIElTIE5PVCBOVUxMIEFORCBkdWVfZGF0ZSA8PSBkYXRlKCdub3cnLCA/KSBBTkQgY29tcGxldGVkX2F0IElTIE5VTExcIik7XG4gICAgICB2YWxzLnB1c2goYCske2ZpbHRlci5kdWVXaXRoaW5EYXlzfSBkYXlzYCk7XG4gICAgfVxuICAgIGlmIChmaWx0ZXIubGVhZGVyc2hpcFZpc2libGUpIHdoZXJlLnB1c2goJ2xlYWRlcnNoaXBfdmlzaWJsZT0xJyk7XG4gICAgaWYgKGZpbHRlci51cGRhdGVkU2luY2UpIHsgd2hlcmUucHVzaCgndXBkYXRlZF9hdCA+PSA/Jyk7IHZhbHMucHVzaChmaWx0ZXIudXBkYXRlZFNpbmNlKTsgfVxuICAgIGlmIChmaWx0ZXIuc2FtcGxlICE9PSB1bmRlZmluZWQpIHsgd2hlcmUucHVzaCgnc2FtcGxlPT8nKTsgdmFscy5wdXNoKGZpbHRlci5zYW1wbGUgPyAxIDogMCk7IH1cbiAgICBpZiAoZmlsdGVyLnRleHQpIHtcbiAgICAgIHdoZXJlLnB1c2goJ3Jvd2lkIElOIChTRUxFQ1Qgcm93aWQgRlJPTSBpdGVtc19mdHMgV0hFUkUgaXRlbXNfZnRzIE1BVENIID8pJyk7XG4gICAgICB2YWxzLnB1c2goZnRzUXVlcnkoZmlsdGVyLnRleHQpKTtcbiAgICB9XG5cbiAgICBjb25zdCBzb3J0Q29sOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgaWRlbnQ6ICdpZGVudCcsXG4gICAgICB0aXRsZTogJ3RpdGxlIENPTExBVEUgTk9DQVNFJyxcbiAgICAgIHN0YXR1czogJ3N0YXR1cycsXG4gICAgICBwcmlvcml0eTogXCJDQVNFIHByaW9yaXR5IFdIRU4gJ3VyZ2VudCcgVEhFTiAwIFdIRU4gJ2hpZ2gnIFRIRU4gMSBXSEVOICdtZWRpdW0nIFRIRU4gMiBXSEVOICdsb3cnIFRIRU4gMyBFTFNFIDQgRU5EXCIsXG4gICAgICBkdWVEYXRlOiAnZHVlX2RhdGUgSVMgTlVMTCwgZHVlX2RhdGUnLFxuICAgICAgY3JlYXRlZEF0OiAnY3JlYXRlZF9hdCcsXG4gICAgICB1cGRhdGVkQXQ6ICd1cGRhdGVkX2F0JyxcbiAgICAgIG1hbnVhbDogJ3VwZGF0ZWRfYXQnLFxuICAgIH07XG4gICAgY29uc3Qgb3JkZXIgPSBgJHtzb3J0Q29sW3NvcnQuZmllbGRdID8/ICd1cGRhdGVkX2F0J30gJHtzb3J0LmRpciA9PT0gJ2FzYycgPyAnQVNDJyA6ICdERVNDJ31gO1xuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXG4gICAgICAucHJlcGFyZShgU0VMRUNUICogRlJPTSBpdGVtcyBXSEVSRSAke3doZXJlLmpvaW4oJyBBTkQgJyl9IE9SREVSIEJZICR7b3JkZXJ9IExJTUlUID8gT0ZGU0VUID9gKVxuICAgICAgLmFsbCguLi52YWxzLCBsaW1pdCwgb2Zmc2V0KSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIHJldHVybiByb3dzLm1hcChyb3dUb0l0ZW0pO1xuICB9XG5cbiAgc2VhcmNoKHRleHQ6IHN0cmluZywgbGltaXQgPSAzMCk6IFNlYXJjaFJlc3VsdFtdIHtcbiAgICBpZiAoIXRleHQudHJpbSgpKSByZXR1cm4gW107XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKFxuICAgICAgICBgU0VMRUNUIGl0ZW1zLiosIHNuaXBwZXQoaXRlbXNfZnRzLCAyLCAnPDwnLCAnPj4nLCAnXHUyMDI2JywgMTIpIEFTIHNuaXAsIHJhbmsgQVMgc2NvcmVcbiAgICAgICAgIEZST00gaXRlbXNfZnRzIEpPSU4gaXRlbXMgT04gaXRlbXMucm93aWQgPSBpdGVtc19mdHMucm93aWRcbiAgICAgICAgIFdIRVJFIGl0ZW1zX2Z0cyBNQVRDSCA/IEFORCBpdGVtcy5kZWxldGVkPTAgQU5EIGl0ZW1zLmFyY2hpdmVkPTBcbiAgICAgICAgIE9SREVSIEJZIHJhbmsgTElNSVQgP2AsXG4gICAgICApXG4gICAgICAuYWxsKGZ0c1F1ZXJ5KHRleHQpLCBsaW1pdCkgYXMgKFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYgeyBzbmlwOiBzdHJpbmc7IHNjb3JlOiBudW1iZXIgfSlbXTtcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7IGl0ZW06IHJvd1RvSXRlbShyKSwgc25pcHBldDogci5zbmlwLCBzY29yZTogci5zY29yZSB9KSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGxpbmtzIC0tLS0tLS0tLS1cbiAgYWRkTGluayhmcm9tSWQ6IHN0cmluZywgdG9JZDogc3RyaW5nLCBraW5kOiBMaW5rS2luZCk6IEl0ZW1MaW5rIHwgbnVsbCB7XG4gICAgaWYgKGZyb21JZCA9PT0gdG9JZCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUICogRlJPTSBsaW5rcyBXSEVSRSBmcm9tX2lkPT8gQU5EIHRvX2lkPT8gQU5EIGtpbmQ9PycpXG4gICAgICAuZ2V0KGZyb21JZCwgdG9JZCwga2luZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gICAgaWYgKGV4aXN0aW5nICYmICFleGlzdGluZy5kZWxldGVkKSByZXR1cm4gcm93VG9MaW5rKGV4aXN0aW5nKTtcbiAgICBjb25zdCBsaW5rOiBJdGVtTGluayA9IHtcbiAgICAgIGlkOiBleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5pZCkgOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgZnJvbUlkLFxuICAgICAgdG9JZCxcbiAgICAgIGtpbmQsXG4gICAgICBjcmVhdGVkQXQ6IHRoaXMubm93KCksXG4gICAgICBjcmVhdGVkQnk6IHRoaXMuYWN0b3JJZCxcbiAgICB9O1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgbGlua3MgU0VUIGRlbGV0ZWQ9MCBXSEVSRSBpZD0/JykucnVuKGxpbmsuaWQpO1xuICAgICAgICB0aGlzLmxvY2FsU2V0KCdsaW5rJywgbGluay5pZCwgeyBkZWxldGVkOiAwIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBsaW5rcyhpZCwgZnJvbV9pZCwgdG9faWQsIGtpbmQsIGRlbGV0ZWQsIGNyZWF0ZWRfYXQsIGNyZWF0ZWRfYnkpIFZBTFVFUyg/LD8sPyw/LDAsPyw/KScpXG4gICAgICAgICAgLnJ1bihsaW5rLmlkLCBmcm9tSWQsIHRvSWQsIGtpbmQsIGxpbmsuY3JlYXRlZEF0LCBsaW5rLmNyZWF0ZWRCeSk7XG4gICAgICAgIHRoaXMubG9jYWxDcmVhdGUoJ2xpbmsnLCBsaW5rLmlkLCB7IC4uLmxpbmsgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KGZyb21JZCwgJ2xpbmsnLCBraW5kLCBudWxsLCB0b0lkKTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnbGluaycsIGVudGl0eUlkOiBsaW5rLmlkIH0pO1xuICAgIHJldHVybiBsaW5rO1xuICB9XG5cbiAgcmVtb3ZlTGluayhpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgZnJvbV9pZCwga2luZCwgdG9faWQgRlJPTSBsaW5rcyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhc1xuICAgICAgfCB7IGZyb21faWQ6IHN0cmluZzsga2luZDogc3RyaW5nOyB0b19pZDogc3RyaW5nIH1cbiAgICAgIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBsaW5rcyBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT8nKS5ydW4oaWQpO1xuICAgICAgdGhpcy5sb2NhbFNldCgnbGluaycsIGlkLCB7IGRlbGV0ZWQ6IDEgfSk7XG4gICAgICBpZiAocm93KSB0aGlzLmxvZ0FjdGl2aXR5KHJvdy5mcm9tX2lkLCAndW5saW5rJywgcm93LmtpbmQsIHJvdy50b19pZCwgbnVsbCk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2xpbmsnLCBlbnRpdHlJZDogaWQgfSk7XG4gIH1cblxuICBsaW5rc0ZvcihpdGVtSWQ6IHN0cmluZyk6IHsgbGluazogSXRlbUxpbms7IGRpcmVjdGlvbjogJ291dCcgfCAnaW4nOyBvdGhlcjogV29ya0l0ZW0gfVtdIHtcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gbGlua3MgV0hFUkUgKGZyb21faWQ9PyBPUiB0b19pZD0/KSBBTkQgZGVsZXRlZD0wJylcbiAgICAgIC5hbGwoaXRlbUlkLCBpdGVtSWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XG4gICAgY29uc3Qgb3V0OiB7IGxpbms6IEl0ZW1MaW5rOyBkaXJlY3Rpb246ICdvdXQnIHwgJ2luJzsgb3RoZXI6IFdvcmtJdGVtIH1bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgciBvZiByb3dzKSB7XG4gICAgICBjb25zdCBsaW5rID0gcm93VG9MaW5rKHIpO1xuICAgICAgY29uc3QgZGlyZWN0aW9uID0gbGluay5mcm9tSWQgPT09IGl0ZW1JZCA/ICdvdXQnIDogJ2luJztcbiAgICAgIGNvbnN0IG90aGVyID0gdGhpcy5nZXRJdGVtKGRpcmVjdGlvbiA9PT0gJ291dCcgPyBsaW5rLnRvSWQgOiBsaW5rLmZyb21JZCk7XG4gICAgICBpZiAob3RoZXIpIG91dC5wdXNoKHsgbGluaywgZGlyZWN0aW9uLCBvdGhlciB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gY29tbWVudHMgLS0tLS0tLS0tLVxuICBhZGRDb21tZW50KGl0ZW1JZDogc3RyaW5nLCBib2R5OiBzdHJpbmcsIGJvZHlUZXh0OiBzdHJpbmcpOiBDb21tZW50IHtcbiAgICBjb25zdCBjOiBDb21tZW50ID0ge1xuICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICBpdGVtSWQsXG4gICAgICBhdXRob3JJZDogdGhpcy5hY3RvcklkLFxuICAgICAgYm9keSxcbiAgICAgIGJvZHlUZXh0LFxuICAgICAgY3JlYXRlZEF0OiB0aGlzLm5vdygpLFxuICAgICAgdXBkYXRlZEF0OiBudWxsLFxuICAgICAgZGVsZXRlZDogMCxcbiAgICB9O1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiXG4gICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBjb21tZW50cyhpZCwgaXRlbV9pZCwgYXV0aG9yX2lkLCBib2R5LCBib2R5X3RleHQsIGNyZWF0ZWRfYXQsIHVwZGF0ZWRfYXQsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LDApJylcbiAgICAgICAgLnJ1bihjLmlkLCBjLml0ZW1JZCwgYy5hdXRob3JJZCwgYy5ib2R5LCBjLmJvZHlUZXh0LCBjLmNyZWF0ZWRBdCwgYy51cGRhdGVkQXQpO1xuICAgICAgdGhpcy5sb2NhbENyZWF0ZSgnY29tbWVudCcsIGMuaWQsIHsgLi4uYyB9KTtcbiAgICAgIHRoaXMubG9nQWN0aXZpdHkoaXRlbUlkLCAnY29tbWVudCcsIG51bGwsIG51bGwsIGJvZHlUZXh0LnNsaWNlKDAsIDIwMCkpO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdjb21tZW50JywgZW50aXR5SWQ6IGMuaWQgfSk7XG4gICAgcmV0dXJuIGM7XG4gIH1cblxuICB1cGRhdGVDb21tZW50KGlkOiBzdHJpbmcsIGJvZHk6IHN0cmluZywgYm9keVRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGZpZWxkcyA9IHsgYm9keSwgYm9keVRleHQsIHVwZGF0ZWRBdDogdGhpcy5ub3coKSB9O1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBjb21tZW50cyBTRVQgYm9keT0/LCBib2R5X3RleHQ9PywgdXBkYXRlZF9hdD0/IFdIRVJFIGlkPT8nKS5ydW4oYm9keSwgYm9keVRleHQsIGZpZWxkcy51cGRhdGVkQXQsIGlkKTtcbiAgICAgIHRoaXMubG9jYWxTZXQoJ2NvbW1lbnQnLCBpZCwgZmllbGRzKTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnY29tbWVudCcsIGVudGl0eUlkOiBpZCB9KTtcbiAgfVxuXG4gIGRlbGV0ZUNvbW1lbnQoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBjb21tZW50cyBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT8nKS5ydW4oaWQpO1xuICAgICAgdGhpcy5sb2NhbFNldCgnY29tbWVudCcsIGlkLCB7IGRlbGV0ZWQ6IDEgfSk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2NvbW1lbnQnLCBlbnRpdHlJZDogaWQgfSk7XG4gIH1cblxuICBjb21tZW50c0ZvcihpdGVtSWQ6IHN0cmluZyk6IENvbW1lbnRbXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIGNvbW1lbnRzIFdIRVJFIGl0ZW1faWQ9PyBBTkQgZGVsZXRlZD0wIE9SREVSIEJZIGNyZWF0ZWRfYXQgQVNDJylcbiAgICAgIC5hbGwoaXRlbUlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcbiAgICAgIGlkOiBTdHJpbmcoci5pZCksXG4gICAgICBpdGVtSWQ6IFN0cmluZyhyLml0ZW1faWQpLFxuICAgICAgYXV0aG9ySWQ6IFN0cmluZyhyLmF1dGhvcl9pZCksXG4gICAgICBib2R5OiBTdHJpbmcoci5ib2R5KSxcbiAgICAgIGJvZHlUZXh0OiBTdHJpbmcoci5ib2R5X3RleHQpLFxuICAgICAgY3JlYXRlZEF0OiBTdHJpbmcoci5jcmVhdGVkX2F0KSxcbiAgICAgIHVwZGF0ZWRBdDogci51cGRhdGVkX2F0ID8gU3RyaW5nKHIudXBkYXRlZF9hdCkgOiBudWxsLFxuICAgICAgZGVsZXRlZDogMCxcbiAgICB9KSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIHZlcnNpb25zIC0tLS0tLS0tLS1cbiAgc2F2ZVZlcnNpb24oaXRlbUlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRJdGVtKGl0ZW1JZCk7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgY29uc3QgbGFzdCA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIE1BWCh2ZXJzaW9uKSBBUyB2IEZST00gaXRlbV92ZXJzaW9ucyBXSEVSRSBpdGVtX2lkPT8nKS5nZXQoaXRlbUlkKSBhcyB7IHY6IG51bWJlciB8IG51bGwgfTtcbiAgICB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gaXRlbV92ZXJzaW9ucyhpZCwgaXRlbV9pZCwgdmVyc2lvbiwgdGl0bGUsIGJvZHksIHNhdmVkX2J5LCBzYXZlZF9hdCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8pJylcbiAgICAgIC5ydW4oY3J5cHRvLnJhbmRvbVVVSUQoKSwgaXRlbUlkLCAobGFzdC52ID8/IDApICsgMSwgaXRlbS50aXRsZSwgaXRlbS5ib2R5LCB0aGlzLmFjdG9ySWQsIHRoaXMubm93KCkpO1xuICB9XG5cbiAgdmVyc2lvbnNGb3IoaXRlbUlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBpZCwgaXRlbV9pZCBBUyBpdGVtSWQsIHZlcnNpb24sIHRpdGxlLCBib2R5LCBzYXZlZF9ieSBBUyBzYXZlZEJ5LCBzYXZlZF9hdCBBUyBzYXZlZEF0IEZST00gaXRlbV92ZXJzaW9ucyBXSEVSRSBpdGVtX2lkPT8gT1JERVIgQlkgdmVyc2lvbiBERVNDJylcbiAgICAgIC5hbGwoaXRlbUlkKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gdXNlcnMgLS0tLS0tLS0tLVxuICB1cHNlcnRVc2VyKHU6IHsgaWQ6IHN0cmluZzsgbmFtZTogc3RyaW5nOyBpbml0aWFsczogc3RyaW5nOyBjb2xvcjogc3RyaW5nIH0pOiBVc2VyIHtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSB1c2VycyBXSEVSRSBpZD0/JykuZ2V0KHUuaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHVzZXI6IFVzZXIgPSB7XG4gICAgICAuLi51LFxuICAgICAgY3JlYXRlZEF0OiBleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5jcmVhdGVkX2F0KSA6IHRoaXMubm93KCksXG4gICAgfTtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5kYlxuICAgICAgICAucHJlcGFyZShcbiAgICAgICAgICBgSU5TRVJUIElOVE8gdXNlcnMoaWQsIG5hbWUsIGluaXRpYWxzLCBjb2xvciwgY3JlYXRlZF9hdCkgVkFMVUVTKD8sPyw/LD8sPylcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT1leGNsdWRlZC5uYW1lLCBpbml0aWFscz1leGNsdWRlZC5pbml0aWFscywgY29sb3I9ZXhjbHVkZWQuY29sb3JgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4odXNlci5pZCwgdXNlci5uYW1lLCB1c2VyLmluaXRpYWxzLCB1c2VyLmNvbG9yLCB1c2VyLmNyZWF0ZWRBdCk7XG4gICAgICBpZiAoIWV4aXN0aW5nKSB0aGlzLmxvY2FsQ3JlYXRlKCd1c2VyJywgdXNlci5pZCwgeyAuLi51c2VyIH0pO1xuICAgICAgZWxzZSB0aGlzLmxvY2FsU2V0KCd1c2VyJywgdXNlci5pZCwgeyBuYW1lOiB1c2VyLm5hbWUsIGluaXRpYWxzOiB1c2VyLmluaXRpYWxzLCBjb2xvcjogdXNlci5jb2xvciB9KTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHJldHVybiB1c2VyO1xuICB9XG5cbiAgbGlzdFVzZXJzKCk6IFVzZXJbXSB7XG4gICAgcmV0dXJuICh0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBjcmVhdGVkX2F0IEFTIGNyZWF0ZWRBdCBGUk9NIHVzZXJzJykuYWxsKCkgYXMgVXNlcltdKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gbWlsZXN0b25lcyAvIHJlbGVhc2VzIC0tLS0tLS0tLS1cbiAgdXBzZXJ0TWlsZXN0b25lKG06IFBhcnRpYWw8TWlsZXN0b25lPiAmIHsgbmFtZTogc3RyaW5nIH0pOiBNaWxlc3RvbmUge1xuICAgIGNvbnN0IGlkID0gbS5pZCA/PyBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgaWQ9PycpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgcmVjOiBNaWxlc3RvbmUgPSB7XG4gICAgICBpZCxcbiAgICAgIG5hbWU6IG0ubmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBtLmRlc2NyaXB0aW9uID8/IChleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5kZXNjcmlwdGlvbikgOiAnJyksXG4gICAgICB0YXJnZXREYXRlOiBtLnRhcmdldERhdGUgPz8gKGV4aXN0aW5nID8gKGV4aXN0aW5nLnRhcmdldF9kYXRlIGFzIHN0cmluZyB8IG51bGwpIDogbnVsbCksXG4gICAgICBzdGF0dXM6IChtLnN0YXR1cyA/PyAoZXhpc3RpbmcgPyBleGlzdGluZy5zdGF0dXMgOiAncGxhbm5lZCcpKSBhcyBNaWxlc3RvbmVbJ3N0YXR1cyddLFxuICAgICAgc29ydDogbS5zb3J0ID8/IChleGlzdGluZyA/IE51bWJlcihleGlzdGluZy5zb3J0KSA6IDApLFxuICAgICAgc2FtcGxlOiBtLnNhbXBsZSA/PyAoZXhpc3RpbmcgPyAoTnVtYmVyKGV4aXN0aW5nLnNhbXBsZSkgYXMgMCB8IDEpIDogMCksXG4gICAgfTtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5kYlxuICAgICAgICAucHJlcGFyZShcbiAgICAgICAgICBgSU5TRVJUIElOVE8gbWlsZXN0b25lcyhpZCwgbmFtZSwgZGVzY3JpcHRpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIHNvcnQsIHNhbXBsZSwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sMClcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCBkZXNjcmlwdGlvbj0/LCB0YXJnZXRfZGF0ZT0/LCBzdGF0dXM9Pywgc29ydD0/LCBkZWxldGVkPTBgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4ocmVjLmlkLCByZWMubmFtZSwgcmVjLmRlc2NyaXB0aW9uLCByZWMudGFyZ2V0RGF0ZSwgcmVjLnN0YXR1cywgcmVjLnNvcnQsIHJlYy5zYW1wbGUsXG4gICAgICAgICAgICAgcmVjLm5hbWUsIHJlYy5kZXNjcmlwdGlvbiwgcmVjLnRhcmdldERhdGUsIHJlYy5zdGF0dXMsIHJlYy5zb3J0KTtcbiAgICAgIGlmICghZXhpc3RpbmcpIHRoaXMubG9jYWxDcmVhdGUoJ21pbGVzdG9uZScsIGlkLCB7IC4uLnJlYyB9KTtcbiAgICAgIGVsc2UgdGhpcy5sb2NhbFNldCgnbWlsZXN0b25lJywgaWQsIHsgbmFtZTogcmVjLm5hbWUsIGRlc2NyaXB0aW9uOiByZWMuZGVzY3JpcHRpb24sIHRhcmdldERhdGU6IHJlYy50YXJnZXREYXRlLCBzdGF0dXM6IHJlYy5zdGF0dXMsIHNvcnQ6IHJlYy5zb3J0IH0pO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdtaWxlc3RvbmUnLCBlbnRpdHlJZDogaWQgfSk7XG4gICAgcmV0dXJuIHJlYztcbiAgfVxuXG4gIGxpc3RNaWxlc3RvbmVzKCk6IE1pbGVzdG9uZVtdIHtcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgZGVsZXRlZD0wIE9SREVSIEJZIHNvcnQsIHRhcmdldF9kYXRlJykuYWxsKCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7XG4gICAgICBpZDogU3RyaW5nKHIuaWQpLCBuYW1lOiBTdHJpbmcoci5uYW1lKSwgZGVzY3JpcHRpb246IFN0cmluZyhyLmRlc2NyaXB0aW9uKSxcbiAgICAgIHRhcmdldERhdGU6IHIudGFyZ2V0X2RhdGUgPyBTdHJpbmcoci50YXJnZXRfZGF0ZSkgOiBudWxsLFxuICAgICAgc3RhdHVzOiByLnN0YXR1cyBhcyBNaWxlc3RvbmVbJ3N0YXR1cyddLCBzb3J0OiBOdW1iZXIoci5zb3J0KSwgc2FtcGxlOiBOdW1iZXIoci5zYW1wbGUpIGFzIDAgfCAxLFxuICAgIH0pKTtcbiAgfVxuXG4gIHVwc2VydFJlbGVhc2UobTogUGFydGlhbDxSZWxlYXNlPiAmIHsgbmFtZTogc3RyaW5nIH0pOiBSZWxlYXNlIHtcbiAgICBjb25zdCBpZCA9IG0uaWQgPz8gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSByZWxlYXNlcyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCByZWM6IFJlbGVhc2UgPSB7XG4gICAgICBpZCxcbiAgICAgIG5hbWU6IG0ubmFtZSxcbiAgICAgIHZlcnNpb246IG0udmVyc2lvbiA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcudmVyc2lvbikgOiAnJyksXG4gICAgICB0YXJnZXREYXRlOiBtLnRhcmdldERhdGUgPz8gKGV4aXN0aW5nID8gKGV4aXN0aW5nLnRhcmdldF9kYXRlIGFzIHN0cmluZyB8IG51bGwpIDogbnVsbCksXG4gICAgICBzdGF0dXM6IChtLnN0YXR1cyA/PyAoZXhpc3RpbmcgPyBleGlzdGluZy5zdGF0dXMgOiAncGxhbm5lZCcpKSBhcyBSZWxlYXNlWydzdGF0dXMnXSxcbiAgICAgIGdvYWxzOiBtLmdvYWxzID8/IChleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5nb2FscykgOiAnJyksXG4gICAgICBub3RlczogbS5ub3RlcyA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3Rpbmcubm90ZXMpIDogJycpLFxuICAgICAgc2FtcGxlOiBtLnNhbXBsZSA/PyAoZXhpc3RpbmcgPyAoTnVtYmVyKGV4aXN0aW5nLnNhbXBsZSkgYXMgMCB8IDEpIDogMCksXG4gICAgfTtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5kYlxuICAgICAgICAucHJlcGFyZShcbiAgICAgICAgICBgSU5TRVJUIElOVE8gcmVsZWFzZXMoaWQsIG5hbWUsIHZlcnNpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIGdvYWxzLCBub3Rlcywgc2FtcGxlLCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LDApXG4gICAgICAgICAgIE9OIENPTkZMSUNUKGlkKSBETyBVUERBVEUgU0VUIG5hbWU9PywgdmVyc2lvbj0/LCB0YXJnZXRfZGF0ZT0/LCBzdGF0dXM9PywgZ29hbHM9Pywgbm90ZXM9PywgZGVsZXRlZD0wYCxcbiAgICAgICAgKVxuICAgICAgICAucnVuKHJlYy5pZCwgcmVjLm5hbWUsIHJlYy52ZXJzaW9uLCByZWMudGFyZ2V0RGF0ZSwgcmVjLnN0YXR1cywgcmVjLmdvYWxzLCByZWMubm90ZXMsIHJlYy5zYW1wbGUsXG4gICAgICAgICAgICAgcmVjLm5hbWUsIHJlYy52ZXJzaW9uLCByZWMudGFyZ2V0RGF0ZSwgcmVjLnN0YXR1cywgcmVjLmdvYWxzLCByZWMubm90ZXMpO1xuICAgICAgaWYgKCFleGlzdGluZykgdGhpcy5sb2NhbENyZWF0ZSgncmVsZWFzZScsIGlkLCB7IC4uLnJlYyB9KTtcbiAgICAgIGVsc2UgdGhpcy5sb2NhbFNldCgncmVsZWFzZScsIGlkLCB7IG5hbWU6IHJlYy5uYW1lLCB2ZXJzaW9uOiByZWMudmVyc2lvbiwgdGFyZ2V0RGF0ZTogcmVjLnRhcmdldERhdGUsIHN0YXR1czogcmVjLnN0YXR1cywgZ29hbHM6IHJlYy5nb2Fscywgbm90ZXM6IHJlYy5ub3RlcyB9KTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAncmVsZWFzZScsIGVudGl0eUlkOiBpZCB9KTtcbiAgICByZXR1cm4gcmVjO1xuICB9XG5cbiAgbGlzdFJlbGVhc2VzKCk6IFJlbGVhc2VbXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSByZWxlYXNlcyBXSEVSRSBkZWxldGVkPTAgT1JERVIgQlkgdGFyZ2V0X2RhdGUnKS5hbGwoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcbiAgICAgIGlkOiBTdHJpbmcoci5pZCksIG5hbWU6IFN0cmluZyhyLm5hbWUpLCB2ZXJzaW9uOiBTdHJpbmcoci52ZXJzaW9uKSxcbiAgICAgIHRhcmdldERhdGU6IHIudGFyZ2V0X2RhdGUgPyBTdHJpbmcoci50YXJnZXRfZGF0ZSkgOiBudWxsLFxuICAgICAgc3RhdHVzOiByLnN0YXR1cyBhcyBSZWxlYXNlWydzdGF0dXMnXSwgZ29hbHM6IFN0cmluZyhyLmdvYWxzKSwgbm90ZXM6IFN0cmluZyhyLm5vdGVzKSxcbiAgICAgIHNhbXBsZTogTnVtYmVyKHIuc2FtcGxlKSBhcyAwIHwgMSxcbiAgICB9KSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIHNhdmVkIHZpZXdzIC0tLS0tLS0tLS1cbiAgc2F2ZVZpZXcodjogUGFydGlhbDxTYXZlZFZpZXc+ICYgeyBuYW1lOiBzdHJpbmc7IGNvbmZpZzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfSk6IFNhdmVkVmlldyB7XG4gICAgY29uc3QgaWQgPSB2LmlkID8/IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgY29uc3QgcmVjOiBTYXZlZFZpZXcgPSB7XG4gICAgICBpZCwgbmFtZTogdi5uYW1lLCBjb25maWc6IHYuY29uZmlnLCBwaW5uZWQ6IHYucGlubmVkID8/IDAsXG4gICAgICBjcmVhdGVkQnk6IHRoaXMuYWN0b3JJZCwgY3JlYXRlZEF0OiB0aGlzLm5vdygpLFxuICAgIH07XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAxIEZST00gc2F2ZWRfdmlld3MgV0hFUkUgaWQ9PycpLmdldChpZCk7XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMuZGJcbiAgICAgICAgLnByZXBhcmUoXG4gICAgICAgICAgYElOU0VSVCBJTlRPIHNhdmVkX3ZpZXdzKGlkLCBuYW1lLCBjb25maWcsIHBpbm5lZCwgY3JlYXRlZF9ieSwgY3JlYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LDApXG4gICAgICAgICAgIE9OIENPTkZMSUNUKGlkKSBETyBVUERBVEUgU0VUIG5hbWU9PywgY29uZmlnPT8sIHBpbm5lZD0/LCBkZWxldGVkPTBgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4oaWQsIHJlYy5uYW1lLCBKU09OLnN0cmluZ2lmeShyZWMuY29uZmlnKSwgcmVjLnBpbm5lZCwgcmVjLmNyZWF0ZWRCeSwgcmVjLmNyZWF0ZWRBdCxcbiAgICAgICAgICAgICByZWMubmFtZSwgSlNPTi5zdHJpbmdpZnkocmVjLmNvbmZpZyksIHJlYy5waW5uZWQpO1xuICAgICAgaWYgKCFleGlzdGluZykgdGhpcy5sb2NhbENyZWF0ZSgnc2F2ZWRfdmlldycsIGlkLCB7IC4uLnJlYyB9KTtcbiAgICAgIGVsc2UgdGhpcy5sb2NhbFNldCgnc2F2ZWRfdmlldycsIGlkLCB7IG5hbWU6IHJlYy5uYW1lLCBjb25maWc6IHJlYy5jb25maWcsIHBpbm5lZDogcmVjLnBpbm5lZCB9KTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHJldHVybiByZWM7XG4gIH1cblxuICBsaXN0Vmlld3MoKTogU2F2ZWRWaWV3W10ge1xuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gc2F2ZWRfdmlld3MgV0hFUkUgZGVsZXRlZD0wIE9SREVSIEJZIHBpbm5lZCBERVNDLCBuYW1lJykuYWxsKCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7XG4gICAgICBpZDogU3RyaW5nKHIuaWQpLCBuYW1lOiBTdHJpbmcoci5uYW1lKSxcbiAgICAgIGNvbmZpZzogSlNPTi5wYXJzZShTdHJpbmcoci5jb25maWcpKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAgIHBpbm5lZDogTnVtYmVyKHIucGlubmVkKSBhcyAwIHwgMSwgY3JlYXRlZEJ5OiBTdHJpbmcoci5jcmVhdGVkX2J5KSwgY3JlYXRlZEF0OiBTdHJpbmcoci5jcmVhdGVkX2F0KSxcbiAgICB9KSk7XG4gIH1cblxuICBkZWxldGVWaWV3KGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgc2F2ZWRfdmlld3MgU0VUIGRlbGV0ZWQ9MSBXSEVSRSBpZD0/JykucnVuKGlkKTtcbiAgICAgIHRoaXMubG9jYWxTZXQoJ3NhdmVkX3ZpZXcnLCBpZCwgeyBkZWxldGVkOiAxIH0pO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGFjdGl2aXR5IC0tLS0tLS0tLS1cbiAgYWN0aXZpdHlGb3IoaXRlbUlkOiBzdHJpbmcgfCBudWxsLCBsaW1pdCA9IDEwMCkge1xuICAgIGlmIChpdGVtSWQpIHtcbiAgICAgIHJldHVybiB0aGlzLmRiXG4gICAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgaWQsIGl0ZW1faWQgQVMgaXRlbUlkLCBhY3Rvcl9pZCBBUyBhY3RvcklkLCBraW5kLCBmaWVsZCwgb2xkX3ZhbHVlIEFTIG9sZFZhbHVlLCBuZXdfdmFsdWUgQVMgbmV3VmFsdWUsIGF0IEZST00gYWN0aXZpdHkgV0hFUkUgaXRlbV9pZD0/IE9SREVSIEJZIGF0IERFU0MgTElNSVQgPycpXG4gICAgICAgIC5hbGwoaXRlbUlkLCBsaW1pdCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIGlkLCBpdGVtX2lkIEFTIGl0ZW1JZCwgYWN0b3JfaWQgQVMgYWN0b3JJZCwga2luZCwgZmllbGQsIG9sZF92YWx1ZSBBUyBvbGRWYWx1ZSwgbmV3X3ZhbHVlIEFTIG5ld1ZhbHVlLCBhdCBGUk9NIGFjdGl2aXR5IE9SREVSIEJZIGF0IERFU0MgTElNSVQgPycpXG4gICAgICAuYWxsKGxpbWl0KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gcmVtb3RlIG9wIGFwcGxpY2F0aW9uIC0tLS0tLS0tLS1cbiAgLyoqIEFwcGx5IGEgYmF0Y2ggb2YgcmVtb3RlIG9wcyBpbnNpZGUgb25lIHRyYW5zYWN0aW9uLiBSZXR1cm5zIGNvdW50IGFwcGxpZWQgKG5vbi1kdXBsaWNhdGUpLiAqL1xuICBhcHBseVJlbW90ZU9wcyhvcHM6IE9wW10pOiBudW1iZXIge1xuICAgIGxldCBhcHBsaWVkID0gMDtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBvcCBvZiBvcHMpIHtcbiAgICAgICAgaWYgKG9wLmRldmljZUlkID09PSB0aGlzLmRldmljZUlkKSBjb250aW51ZTsgLy8gb3VyIG93biBvcHMgZWNob2VkIGJhY2tcbiAgICAgICAgY29uc3QgZHVwID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIG9wbG9nIFdIRVJFIG9wX2lkPT8nKS5nZXQob3Aub3BJZCk7XG4gICAgICAgIGlmIChkdXApIGNvbnRpbnVlO1xuICAgICAgICB0aGlzLndpdG5lc3NMYW1wb3J0KG9wLmxhbXBvcnQpO1xuICAgICAgICB0aGlzLmFwcGVuZE9wKG9wKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aGlzLmFwcGx5UmVtb3RlT3Aob3ApO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAvLyBRdWFyYW50aW5lIGEgcG9pc29uIG9wIGluc3RlYWQgb2Ygd2VkZ2luZyB0aGUgd2hvbGUgaW1wb3J0OiBpdCBpcyBhbHJlYWR5XG4gICAgICAgICAgLy8gcmVjb3JkZWQgaW4gdGhlIG9wbG9nIChzbyBpdCB3b24ndCByZXRyeSBmb3JldmVyKSBhbmQgbG9nZ2VkIGZvciBkaWFnbm9zaXMuXG4gICAgICAgICAgY29uc29sZS5lcnJvcihgW3N5bmNdIGZhaWxlZCB0byBhcHBseSBvcCAke29wLm9wSWR9ICgke29wLmVudGl0eX0vJHtvcC5hY3Rpb259KTpgLCBlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGFwcGxpZWQrKztcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIGlmIChhcHBsaWVkID4gMCkgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICcqJywgZW50aXR5SWQ6ICcqJyB9KTtcbiAgICByZXR1cm4gYXBwbGllZDtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlSZW1vdGVPcChvcDogT3ApOiB2b2lkIHtcbiAgICBzd2l0Y2ggKG9wLmFjdGlvbikge1xuICAgICAgY2FzZSAnY3JlYXRlJzpcbiAgICAgICAgdGhpcy5hcHBseVJlbW90ZUNyZWF0ZShvcCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc2V0JzpcbiAgICAgICAgdGhpcy5hcHBseVJlbW90ZVNldChvcCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgdGhpcy5hcHBseVJlbW90ZURlbGV0ZShvcCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdGFibGVGb3IoZW50aXR5OiBPcFsnZW50aXR5J10pOiBzdHJpbmcge1xuICAgIHN3aXRjaCAoZW50aXR5KSB7XG4gICAgICBjYXNlICdpdGVtJzogcmV0dXJuICdpdGVtcyc7XG4gICAgICBjYXNlICdsaW5rJzogcmV0dXJuICdsaW5rcyc7XG4gICAgICBjYXNlICdjb21tZW50JzogcmV0dXJuICdjb21tZW50cyc7XG4gICAgICBjYXNlICdtaWxlc3RvbmUnOiByZXR1cm4gJ21pbGVzdG9uZXMnO1xuICAgICAgY2FzZSAncmVsZWFzZSc6IHJldHVybiAncmVsZWFzZXMnO1xuICAgICAgY2FzZSAndXNlcic6IHJldHVybiAndXNlcnMnO1xuICAgICAgY2FzZSAnc2F2ZWRfdmlldyc6IHJldHVybiAnc2F2ZWRfdmlld3MnO1xuICAgICAgY2FzZSAnYXR0YWNobWVudCc6IHJldHVybiAnYXR0YWNobWVudHMnO1xuICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIGVudGl0eSAke2VudGl0eX1gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UmVtb3RlQ3JlYXRlKG9wOiBPcCk6IHZvaWQge1xuICAgIGNvbnN0IHJlY29yZCA9IG9wLnBheWxvYWQucmVjb3JkIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgIGlmICghcmVjb3JkKSByZXR1cm47XG4gICAgY29uc3QgdGFibGUgPSB0aGlzLnRhYmxlRm9yKG9wLmVudGl0eSk7XG4gICAgY29uc3QgZXhpc3RzID0gdGhpcy5kYi5wcmVwYXJlKGBTRUxFQ1QgMSBGUk9NICR7dGFibGV9IFdIRVJFIGlkPT9gKS5nZXQob3AuZW50aXR5SWQpO1xuICAgIGlmIChleGlzdHMpIHJldHVybjsgLy8gY3JlYXRlIGlzIGlkZW1wb3RlbnQgcGVyIHV1aWRcblxuICAgIGlmIChvcC5lbnRpdHkgPT09ICdpdGVtJykge1xuICAgICAgbGV0IGl0ZW0gPSB7IC4uLihyZWNvcmQgYXMgdW5rbm93biBhcyBXb3JrSXRlbSkgfTtcbiAgICAgIC8vIElkZW50IGNvbGxpc2lvbjogYW5vdGhlciBpdGVtIChkaWZmZXJlbnQgdXVpZCkgYWxyZWFkeSBob2xkcyB0aGlzIGlkZW50LlxuICAgICAgLy8gRGV0ZXJtaW5pc3RpYyBydWxlIFx1MjAxNCB0aGUgc21hbGxlciB1dWlkIGtlZXBzIHRoZSBjb250ZXN0ZWQgaWRlbnQgXHUyMDE0IHNvIGJvdGhcbiAgICAgIC8vIGRldmljZXMgcmVzb2x2ZSB0aGUgc2FtZSBjb2xsaXNpb24gaWRlbnRpY2FsbHkgYW5kIGNvbnZlcmdlIHdpdGhvdXQgcGluZy1wb25nLlxuICAgICAgY29uc3QgaG9sZGVyID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaWQsIHR5cGUgRlJPTSBpdGVtcyBXSEVSRSBpZGVudD0/JykuZ2V0KGl0ZW0uaWRlbnQpIGFzXG4gICAgICAgIHwgeyBpZDogc3RyaW5nOyB0eXBlOiBJdGVtVHlwZSB9XG4gICAgICAgIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGhvbGRlciAmJiBob2xkZXIuaWQgIT09IGl0ZW0uaWQpIHtcbiAgICAgICAgaWYgKGl0ZW0uaWQgPCBob2xkZXIuaWQpIHtcbiAgICAgICAgICAvLyBJbmNvbWluZyBpdGVtIGtlZXBzIHRoZSBpZGVudDsgcmVudW1iZXIgdGhlIGxvY2FsIGhvbGRlciBhbmQgYnJvYWRjYXN0LlxuICAgICAgICAgIGNvbnN0IGJ1bXBlZCA9IHRoaXMuYWxsb2NJZGVudChob2xkZXIudHlwZSk7XG4gICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShob2xkZXIuaWQsICdyZW51bWJlcmVkJywgJ2lkZW50JywgaXRlbS5pZGVudCwgYnVtcGVkKTtcbiAgICAgICAgICB0aGlzLmFwcGx5SXRlbUZpZWxkcyhob2xkZXIuaWQsIHsgaWRlbnQ6IGJ1bXBlZCB9KTtcbiAgICAgICAgICB0aGlzLmxvY2FsU2V0KCdpdGVtJywgaG9sZGVyLmlkLCB7IGlkZW50OiBidW1wZWQgfSk7XG4gICAgICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IG5ld0lkZW50ID0gdGhpcy5hbGxvY0lkZW50KGl0ZW0udHlwZSk7XG4gICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShpdGVtLmlkLCAncmVudW1iZXJlZCcsICdpZGVudCcsIGl0ZW0uaWRlbnQsIG5ld0lkZW50KTtcbiAgICAgICAgICBpdGVtID0geyAuLi5pdGVtLCBpZGVudDogbmV3SWRlbnQgfTtcbiAgICAgICAgICB0aGlzLmluc2VydEl0ZW1Sb3coaXRlbSk7XG4gICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGl0ZW0uaWQsIHsgaWRlbnQ6IG5ld0lkZW50IH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmluc2VydEl0ZW1Sb3coaXRlbSk7XG4gICAgICB9XG4gICAgICB0aGlzLndpdG5lc3NJZGVudChpdGVtLnR5cGUsIGl0ZW0uaWRlbnQpO1xuICAgICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKHJlY29yZCkpIHRoaXMuc2V0RmllbGRDbG9ja0lmTmV3ZXIoJ2l0ZW0nLCBpdGVtLmlkLCBmLCBvcC5sYW1wb3J0LCBvcC5kZXZpY2VJZCk7XG4gICAgICB0aGlzLnJlcGxheVBlbmRpbmdPcHMob3AuZW50aXR5LCBvcC5lbnRpdHlJZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gR2VuZXJpYyBpbnNlcnQgZm9yIG90aGVyIGVudGl0aWVzLlxuICAgIGNvbnN0IGluc2VydGVyczogUmVjb3JkPHN0cmluZywgKCkgPT4gdm9pZD4gPSB7XG4gICAgICBsaW5rOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBJdGVtTGluayAmIHsgZGVsZXRlZD86IG51bWJlciB9O1xuICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBsaW5rcyhpZCwgZnJvbV9pZCwgdG9faWQsIGtpbmQsIGRlbGV0ZWQsIGNyZWF0ZWRfYXQsIGNyZWF0ZWRfYnkpIFZBTFVFUyg/LD8sPyw/LD8sPyw/KScpXG4gICAgICAgICAgLnJ1bihyLmlkLCByLmZyb21JZCwgci50b0lkLCByLmtpbmQsIHIuZGVsZXRlZCA/PyAwLCByLmNyZWF0ZWRBdCwgci5jcmVhdGVkQnkpO1xuICAgICAgfSxcbiAgICAgIGNvbW1lbnQ6ICgpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHJlY29yZCBhcyB1bmtub3duIGFzIENvbW1lbnQ7XG4gICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIGNvbW1lbnRzKGlkLCBpdGVtX2lkLCBhdXRob3JfaWQsIGJvZHksIGJvZHlfdGV4dCwgY3JlYXRlZF9hdCwgdXBkYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyknKVxuICAgICAgICAgIC5ydW4oci5pZCwgci5pdGVtSWQsIHIuYXV0aG9ySWQsIHIuYm9keSwgci5ib2R5VGV4dCwgci5jcmVhdGVkQXQsIHIudXBkYXRlZEF0LCByLmRlbGV0ZWQgPz8gMCk7XG4gICAgICB9LFxuICAgICAgbWlsZXN0b25lOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBNaWxlc3RvbmU7XG4gICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIG1pbGVzdG9uZXMoaWQsIG5hbWUsIGRlc2NyaXB0aW9uLCB0YXJnZXRfZGF0ZSwgc3RhdHVzLCBzb3J0LCBzYW1wbGUsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LDApJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgci5kZXNjcmlwdGlvbiwgci50YXJnZXREYXRlLCByLnN0YXR1cywgci5zb3J0LCByLnNhbXBsZSA/PyAwKTtcbiAgICAgIH0sXG4gICAgICByZWxlYXNlOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBSZWxlYXNlO1xuICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyByZWxlYXNlcyhpZCwgbmFtZSwgdmVyc2lvbiwgdGFyZ2V0X2RhdGUsIHN0YXR1cywgZ29hbHMsIG5vdGVzLCBzYW1wbGUsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sMCknKVxuICAgICAgICAgIC5ydW4oci5pZCwgci5uYW1lLCByLnZlcnNpb24sIHIudGFyZ2V0RGF0ZSwgci5zdGF0dXMsIHIuZ29hbHMsIHIubm90ZXMsIHIuc2FtcGxlID8/IDApO1xuICAgICAgfSxcbiAgICAgIHVzZXI6ICgpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHJlY29yZCBhcyB1bmtub3duIGFzIFVzZXI7XG4gICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIHVzZXJzKGlkLCBuYW1lLCBpbml0aWFscywgY29sb3IsIGNyZWF0ZWRfYXQpIFZBTFVFUyg/LD8sPyw/LD8pJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgci5pbml0aWFscywgci5jb2xvciwgci5jcmVhdGVkQXQpO1xuICAgICAgfSxcbiAgICAgIHNhdmVkX3ZpZXc6ICgpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHJlY29yZCBhcyB1bmtub3duIGFzIFNhdmVkVmlldztcbiAgICAgICAgdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gc2F2ZWRfdmlld3MoaWQsIG5hbWUsIGNvbmZpZywgcGlubmVkLCBjcmVhdGVkX2J5LCBjcmVhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sMCknKVxuICAgICAgICAgIC5ydW4oci5pZCwgci5uYW1lLCBKU09OLnN0cmluZ2lmeShyLmNvbmZpZyksIHIucGlubmVkLCByLmNyZWF0ZWRCeSwgci5jcmVhdGVkQXQpO1xuICAgICAgfSxcbiAgICAgIGF0dGFjaG1lbnQ6ICgpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHJlY29yZCBhcyB1bmtub3duIGFzIGltcG9ydCgnLi4vLi4vc2hhcmVkL3R5cGVzJykuQXR0YWNobWVudDtcbiAgICAgICAgdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gYXR0YWNobWVudHMoaWQsIGl0ZW1faWQsIGZpbGVuYW1lLCBtaW1lLCBzaXplLCBzaGEyNTYsIGRlc2NyaXB0aW9uLCB1cGxvYWRlZF9ieSwgY3JlYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyw/LD8pJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIuaXRlbUlkLCByLmZpbGVuYW1lLCByLm1pbWUsIHIuc2l6ZSwgci5zaGEyNTYsIHIuZGVzY3JpcHRpb24sIHIudXBsb2FkZWRCeSwgci5jcmVhdGVkQXQsIHIuZGVsZXRlZCA/PyAwKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgICBpbnNlcnRlcnNbb3AuZW50aXR5XT8uKCk7XG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKHJlY29yZCkpIHRoaXMuc2V0RmllbGRDbG9ja0lmTmV3ZXIob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgb3AuZGV2aWNlSWQpO1xuICAgIHRoaXMucmVwbGF5UGVuZGluZ09wcyhvcC5lbnRpdHksIG9wLmVudGl0eUlkKTtcbiAgfVxuXG4gIC8qKiBTZXQgYSBmaWVsZCBjbG9jayBvbmx5IGlmIHRoZSBpbmNvbWluZyB3cml0ZSBpcyBuZXdlciBcdTIwMTQgY3JlYXRlcyBtdXN0IG5ldmVyXG4gICAgICByZWdyZXNzIGNsb2NrcyBzdGFtcGVkIGJ5IGJ1ZmZlcmVkL2VhcmxpZXItYXJyaXZpbmcgc2V0cy4gKi9cbiAgcHJpdmF0ZSBzZXRGaWVsZENsb2NrSWZOZXdlcihlbnRpdHk6IHN0cmluZywgZW50aXR5SWQ6IHN0cmluZywgZmllbGQ6IHN0cmluZywgbGFtcG9ydDogbnVtYmVyLCBkZXZpY2VJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgY3VyID0gdGhpcy5maWVsZENsb2NrKGVudGl0eSwgZW50aXR5SWQsIGZpZWxkKTtcbiAgICBpZiAoY3VyICYmIChjdXIubGFtcG9ydCA+IGxhbXBvcnQgfHwgKGN1ci5sYW1wb3J0ID09PSBsYW1wb3J0ICYmIGN1ci5kZXZpY2VJZCA+IGRldmljZUlkKSkpIHJldHVybjtcbiAgICB0aGlzLnNldEZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZmllbGQsIGxhbXBvcnQsIGRldmljZUlkKTtcbiAgfVxuXG4gIC8qKiBCdWZmZXIgYW4gb3AgdGhhdCBhcnJpdmVkIGJlZm9yZSBpdHMgdGFyZ2V0J3MgY3JlYXRlICgzKyBkZXZpY2UgcmVvcmRlcmluZykuICovXG4gIHByaXZhdGUgYnVmZmVyUGVuZGluZ09wKG9wOiBPcCk6IHZvaWQge1xuICAgIHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKFxuICAgICAgICBgSU5TRVJUIE9SIElHTk9SRSBJTlRPIHBlbmRpbmdfb3BzKG9wX2lkLCBkZXZpY2VfaWQsIGFjdG9yX2lkLCBsYW1wb3J0LCBhdCwgZW50aXR5LCBlbnRpdHlfaWQsIGFjdGlvbiwgcGF5bG9hZClcbiAgICAgICAgIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPylgLFxuICAgICAgKVxuICAgICAgLnJ1bihvcC5vcElkLCBvcC5kZXZpY2VJZCwgb3AuYWN0b3JJZCwgb3AubGFtcG9ydCwgb3AuYXQsIG9wLmVudGl0eSwgb3AuZW50aXR5SWQsIG9wLmFjdGlvbiwgSlNPTi5zdHJpbmdpZnkob3AucGF5bG9hZCkpO1xuICB9XG5cbiAgLyoqIFJlcGxheSBidWZmZXJlZCBzZXRzL2RlbGV0ZXMgZm9yIGFuIGVudGl0eSBvbmNlIGl0cyBjcmVhdGUgaGFzIGxhbmRlZC4gKi9cbiAgcHJpdmF0ZSByZXBsYXlQZW5kaW5nT3BzKGVudGl0eTogT3BbJ2VudGl0eSddLCBlbnRpdHlJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHBlbmRpbmdfb3BzIFdIRVJFIGVudGl0eT0/IEFORCBlbnRpdHlfaWQ9PyBPUkRFUiBCWSBsYW1wb3J0LCBkZXZpY2VfaWQnKVxuICAgICAgLmFsbChlbnRpdHksIGVudGl0eUlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIGlmIChyb3dzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIHRoaXMuZGIucHJlcGFyZSgnREVMRVRFIEZST00gcGVuZGluZ19vcHMgV0hFUkUgZW50aXR5PT8gQU5EIGVudGl0eV9pZD0/JykucnVuKGVudGl0eSwgZW50aXR5SWQpO1xuICAgIGZvciAoY29uc3QgciBvZiByb3dzKSB7XG4gICAgICB0aGlzLmFwcGx5UmVtb3RlT3Aoe1xuICAgICAgICBvcElkOiBTdHJpbmcoci5vcF9pZCksIGRldmljZUlkOiBTdHJpbmcoci5kZXZpY2VfaWQpLCBhY3RvcklkOiBTdHJpbmcoci5hY3Rvcl9pZCksXG4gICAgICAgIGxhbXBvcnQ6IE51bWJlcihyLmxhbXBvcnQpLCBhdDogU3RyaW5nKHIuYXQpLCBlbnRpdHk6IHIuZW50aXR5IGFzIE9wWydlbnRpdHknXSxcbiAgICAgICAgZW50aXR5SWQ6IFN0cmluZyhyLmVudGl0eV9pZCksIGFjdGlvbjogci5hY3Rpb24gYXMgT3BbJ2FjdGlvbiddLFxuICAgICAgICBwYXlsb2FkOiBKU09OLnBhcnNlKFN0cmluZyhyLnBheWxvYWQpKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlSZW1vdGVTZXQob3A6IE9wKTogdm9pZCB7XG4gICAgLy8gVGFyZ2V0IHJvdyBtYXkgbm90IGV4aXN0IHlldCAob3BzIGZyb20gYSB0aGlyZCBkZXZpY2UgY2FuIGFycml2ZSBiZWZvcmUgdGhlXG4gICAgLy8gb3JpZ2luYXRpbmcgZGV2aWNlJ3MgY3JlYXRlKSBcdTIwMTQgYnVmZmVyIGFuZCByZXBsYXkgYWZ0ZXIgdGhlIGNyZWF0ZS5cbiAgICBjb25zdCByb3dFeGlzdHMgPSB0aGlzLmRiLnByZXBhcmUoYFNFTEVDVCAxIEZST00gJHt0aGlzLnRhYmxlRm9yKG9wLmVudGl0eSl9IFdIRVJFIGlkPT9gKS5nZXQob3AuZW50aXR5SWQpO1xuICAgIGlmICghcm93RXhpc3RzKSB7XG4gICAgICB0aGlzLmJ1ZmZlclBlbmRpbmdPcChvcCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGZpZWxkcyA9IChvcC5wYXlsb2FkLmZpZWxkcyA/PyB7fSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgY29uc3QgYmFzZWRPbiA9IChvcC5wYXlsb2FkLmJhc2VkT24gPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHsgbGFtcG9ydDogbnVtYmVyOyBkZXZpY2VJZDogc3RyaW5nIH0gfCBudWxsPjtcbiAgICBjb25zdCB3aW5uaW5nOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBbZmllbGQsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XG4gICAgICBjb25zdCBsb2NhbCA9IHRoaXMuZmllbGRDbG9jayhvcC5lbnRpdHksIG9wLmVudGl0eUlkLCBmaWVsZCk7XG4gICAgICBjb25zdCBiYXNlID0gYmFzZWRPbltmaWVsZF0gPz8gbnVsbDtcblxuICAgICAgbGV0IHJlbW90ZVdpbnM6IGJvb2xlYW47XG4gICAgICBsZXQgY29uY3VycmVudCA9IGZhbHNlO1xuICAgICAgaWYgKCFsb2NhbCkge1xuICAgICAgICByZW1vdGVXaW5zID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoYmFzZSAmJiBiYXNlLmxhbXBvcnQgPT09IGxvY2FsLmxhbXBvcnQgJiYgYmFzZS5kZXZpY2VJZCA9PT0gbG9jYWwuZGV2aWNlSWQpIHtcbiAgICAgICAgcmVtb3RlV2lucyA9IHRydWU7IC8vIGNsZWFuIGNhdXNhbCB1cGRhdGU6IHJlbW90ZSBzYXcgZXhhY3RseSBvdXIgY3VycmVudCB2YWx1ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uY3VycmVudCA9IHRydWU7XG4gICAgICAgIHJlbW90ZVdpbnMgPSBvcC5sYW1wb3J0ID4gbG9jYWwubGFtcG9ydCB8fCAob3AubGFtcG9ydCA9PT0gbG9jYWwubGFtcG9ydCAmJiBvcC5kZXZpY2VJZCA+IGxvY2FsLmRldmljZUlkKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmN1cnJlbnQgJiYgQ09ORkxJQ1RfU1VSRkFDRURfRklFTERTLmhhcyhmaWVsZCkgJiYgb3AuZW50aXR5ID09PSAnaXRlbScpIHtcbiAgICAgICAgY29uc3QgY3VyID0gdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKGBTRUxFQ1QgJHtJVEVNX0NPTFNbZmllbGRdfSBBUyB2IEZST00gaXRlbXMgV0hFUkUgaWQ9P2ApXG4gICAgICAgICAgLmdldChvcC5lbnRpdHlJZCkgYXMgeyB2OiB1bmtub3duIH0gfCB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnN0IGxvY2FsVmFsID0gY3VyID8gU3RyaW5nKGN1ci52ID8/ICcnKSA6ICcnO1xuICAgICAgICBjb25zdCByZW1vdGVWYWwgPSBTdHJpbmcodmFsdWUgPz8gJycpO1xuICAgICAgICBpZiAobG9jYWxWYWwgIT09IHJlbW90ZVZhbCkge1xuICAgICAgICAgIGNvbnN0IGNvbmZsaWN0OiBTeW5jQ29uZmxpY3QgPSB7XG4gICAgICAgICAgICBpZDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICAgIGVudGl0eTogb3AuZW50aXR5LFxuICAgICAgICAgICAgZW50aXR5SWQ6IG9wLmVudGl0eUlkLFxuICAgICAgICAgICAgZmllbGQsXG4gICAgICAgICAgICBsb2NhbFZhbHVlOiBsb2NhbFZhbCxcbiAgICAgICAgICAgIHJlbW90ZVZhbHVlOiByZW1vdGVWYWwsXG4gICAgICAgICAgICByZW1vdGVEZXZpY2U6IG9wLmRldmljZUlkLFxuICAgICAgICAgICAgcmVtb3RlQWN0b3I6IG9wLmFjdG9ySWQsXG4gICAgICAgICAgICBkZXRlY3RlZEF0OiB0aGlzLm5vdygpLFxuICAgICAgICAgICAgcmVzb2x2ZWRBdDogbnVsbCxcbiAgICAgICAgICAgIHJlc29sdXRpb246IG51bGwsXG4gICAgICAgICAgfTtcbiAgICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gc3luY19jb25mbGljdHMoaWQsIGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZCwgbG9jYWxfdmFsdWUsIHJlbW90ZV92YWx1ZSwgcmVtb3RlX2RldmljZSwgcmVtb3RlX2FjdG9yLCBkZXRlY3RlZF9hdCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyw/KScpXG4gICAgICAgICAgICAucnVuKGNvbmZsaWN0LmlkLCBjb25mbGljdC5lbnRpdHksIGNvbmZsaWN0LmVudGl0eUlkLCBjb25mbGljdC5maWVsZCwgY29uZmxpY3QubG9jYWxWYWx1ZSwgY29uZmxpY3QucmVtb3RlVmFsdWUsIGNvbmZsaWN0LnJlbW90ZURldmljZSwgY29uZmxpY3QucmVtb3RlQWN0b3IsIGNvbmZsaWN0LmRldGVjdGVkQXQpO1xuICAgICAgICAgIHRoaXMuZXZlbnRzLm9uQ29uZmxpY3QoY29uZmxpY3QpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChyZW1vdGVXaW5zKSB7XG4gICAgICAgIHdpbm5pbmdbZmllbGRdID0gdmFsdWU7XG4gICAgICAgIHRoaXMuc2V0RmllbGRDbG9jayhvcC5lbnRpdHksIG9wLmVudGl0eUlkLCBmaWVsZCwgb3AubGFtcG9ydCwgb3AuZGV2aWNlSWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChPYmplY3Qua2V5cyh3aW5uaW5nKS5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIGlmIChvcC5lbnRpdHkgPT09ICdpdGVtJykge1xuICAgICAgLy8gSWRlbnQgc2V0IG1heSBjb2xsaWRlIGxvY2FsbHkgXHUyMDE0IHJlc29sdmUgd2l0aCB0aGUgc2FtZSBzbWFsbGVyLXV1aWQta2VlcHMgcnVsZS5cbiAgICAgIGlmICgnaWRlbnQnIGluIHdpbm5pbmcpIHtcbiAgICAgICAgY29uc3QgaG9sZGVyID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaWQsIHR5cGUgRlJPTSBpdGVtcyBXSEVSRSBpZGVudD0/JykuZ2V0KFN0cmluZyh3aW5uaW5nLmlkZW50KSkgYXNcbiAgICAgICAgICB8IHsgaWQ6IHN0cmluZzsgdHlwZTogSXRlbVR5cGUgfVxuICAgICAgICAgIHwgdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCBjdXIgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCB0eXBlIEZST00gaXRlbXMgV0hFUkUgaWQ9PycpLmdldChvcC5lbnRpdHlJZCkgYXMgeyB0eXBlOiBJdGVtVHlwZSB9IHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAoaG9sZGVyICYmIGhvbGRlci5pZCAhPT0gb3AuZW50aXR5SWQgJiYgY3VyKSB7XG4gICAgICAgICAgaWYgKG9wLmVudGl0eUlkIDwgaG9sZGVyLmlkKSB7XG4gICAgICAgICAgICBjb25zdCBidW1wZWQgPSB0aGlzLmFsbG9jSWRlbnQoaG9sZGVyLnR5cGUpO1xuICAgICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShob2xkZXIuaWQsICdyZW51bWJlcmVkJywgJ2lkZW50JywgU3RyaW5nKHdpbm5pbmcuaWRlbnQpLCBidW1wZWQpO1xuICAgICAgICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoaG9sZGVyLmlkLCB7IGlkZW50OiBidW1wZWQgfSk7XG4gICAgICAgICAgICB0aGlzLmxvY2FsU2V0KCdpdGVtJywgaG9sZGVyLmlkLCB7IGlkZW50OiBidW1wZWQgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1bXBlZCA9IHRoaXMuYWxsb2NJZGVudChjdXIudHlwZSk7XG4gICAgICAgICAgICB3aW5uaW5nLmlkZW50ID0gYnVtcGVkO1xuICAgICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIG9wLmVudGl0eUlkLCB7IGlkZW50OiBidW1wZWQgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGN1cikge1xuICAgICAgICAgIHRoaXMud2l0bmVzc0lkZW50KGN1ci50eXBlLCBTdHJpbmcod2lubmluZy5pZGVudCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmFwcGx5SXRlbUZpZWxkcyhvcC5lbnRpdHlJZCwgd2lubmluZyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gR2VuZXJpYyBjb2x1bW4gdXBkYXRlIGZvciBvdGhlciBlbnRpdGllcy5cbiAgICBjb25zdCBjb2xNYXA6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHN0cmluZz4+ID0ge1xuICAgICAgbGluazogeyBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICAgIGNvbW1lbnQ6IHsgYm9keTogJ2JvZHknLCBib2R5VGV4dDogJ2JvZHlfdGV4dCcsIHVwZGF0ZWRBdDogJ3VwZGF0ZWRfYXQnLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICAgIG1pbGVzdG9uZTogeyBuYW1lOiAnbmFtZScsIGRlc2NyaXB0aW9uOiAnZGVzY3JpcHRpb24nLCB0YXJnZXREYXRlOiAndGFyZ2V0X2RhdGUnLCBzdGF0dXM6ICdzdGF0dXMnLCBzb3J0OiAnc29ydCcsIGRlbGV0ZWQ6ICdkZWxldGVkJyB9LFxuICAgICAgcmVsZWFzZTogeyBuYW1lOiAnbmFtZScsIHZlcnNpb246ICd2ZXJzaW9uJywgdGFyZ2V0RGF0ZTogJ3RhcmdldF9kYXRlJywgc3RhdHVzOiAnc3RhdHVzJywgZ29hbHM6ICdnb2FscycsIG5vdGVzOiAnbm90ZXMnLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICAgIHVzZXI6IHsgbmFtZTogJ25hbWUnLCBpbml0aWFsczogJ2luaXRpYWxzJywgY29sb3I6ICdjb2xvcicgfSxcbiAgICAgIHNhdmVkX3ZpZXc6IHsgbmFtZTogJ25hbWUnLCBjb25maWc6ICdjb25maWcnLCBwaW5uZWQ6ICdwaW5uZWQnLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICAgIGF0dGFjaG1lbnQ6IHsgZGVzY3JpcHRpb246ICdkZXNjcmlwdGlvbicsIGRlbGV0ZWQ6ICdkZWxldGVkJyB9LFxuICAgIH07XG4gICAgY29uc3QgbWFwID0gY29sTWFwW29wLmVudGl0eV07XG4gICAgaWYgKCFtYXApIHJldHVybjtcbiAgICBjb25zdCBzZXRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHZhbHM6IHVua25vd25bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKHdpbm5pbmcpKSB7XG4gICAgICBjb25zdCBjb2wgPSBtYXBba107XG4gICAgICBpZiAoIWNvbCkgY29udGludWU7XG4gICAgICBzZXRzLnB1c2goYCR7Y29sfT0/YCk7XG4gICAgICB2YWxzLnB1c2goayA9PT0gJ2NvbmZpZycgPyBKU09OLnN0cmluZ2lmeSh2KSA6IHYpO1xuICAgIH1cbiAgICBpZiAoIXNldHMubGVuZ3RoKSByZXR1cm47XG4gICAgdmFscy5wdXNoKG9wLmVudGl0eUlkKTtcbiAgICB0aGlzLmRiLnByZXBhcmUoYFVQREFURSAke3RoaXMudGFibGVGb3Iob3AuZW50aXR5KX0gU0VUICR7c2V0cy5qb2luKCcsICcpfSBXSEVSRSBpZD0/YCkucnVuKC4uLnZhbHMpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVJlbW90ZURlbGV0ZShvcDogT3ApOiB2b2lkIHtcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMudGFibGVGb3Iob3AuZW50aXR5KTtcbiAgICBjb25zdCByb3dFeGlzdHMgPSB0aGlzLmRiLnByZXBhcmUoYFNFTEVDVCAxIEZST00gJHt0YWJsZX0gV0hFUkUgaWQ9P2ApLmdldChvcC5lbnRpdHlJZCk7XG4gICAgaWYgKCFyb3dFeGlzdHMpIHtcbiAgICAgIC8vIERlbGV0ZSBhcnJpdmVkIGJlZm9yZSB0aGUgY3JlYXRlICgzKyBkZXZpY2UgcmVvcmRlcmluZykgXHUyMDE0IGJ1ZmZlciBpdCBzbyB0aGVcbiAgICAgIC8vIGNyZWF0ZSdzIHJlcGxheSBhcHBsaWVzIGl0IGluc3RlYWQgb2YgcmVzdXJyZWN0aW5nIHRoZSBpdGVtLlxuICAgICAgdGhpcy5idWZmZXJQZW5kaW5nT3Aob3ApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRiLnByZXBhcmUoYFVQREFURSAke3RhYmxlfSBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT9gKS5ydW4ob3AuZW50aXR5SWQpO1xuICAgIHRoaXMuc2V0RmllbGRDbG9jayhvcC5lbnRpdHksIG9wLmVudGl0eUlkLCAnZGVsZXRlZCcsIG9wLmxhbXBvcnQsIG9wLmRldmljZUlkKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gY29uZmxpY3RzIC0tLS0tLS0tLS1cbiAgbGlzdENvbmZsaWN0cyhvcGVuT25seSA9IHRydWUpOiBTeW5jQ29uZmxpY3RbXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKGBTRUxFQ1QgKiBGUk9NIHN5bmNfY29uZmxpY3RzICR7b3Blbk9ubHkgPyAnV0hFUkUgcmVzb2x2ZWRfYXQgSVMgTlVMTCcgOiAnJ30gT1JERVIgQlkgZGV0ZWN0ZWRfYXQgREVTQ2ApXG4gICAgICAuYWxsKCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7XG4gICAgICBpZDogU3RyaW5nKHIuaWQpLCBlbnRpdHk6IFN0cmluZyhyLmVudGl0eSksIGVudGl0eUlkOiBTdHJpbmcoci5lbnRpdHlfaWQpLCBmaWVsZDogU3RyaW5nKHIuZmllbGQpLFxuICAgICAgbG9jYWxWYWx1ZTogU3RyaW5nKHIubG9jYWxfdmFsdWUpLCByZW1vdGVWYWx1ZTogU3RyaW5nKHIucmVtb3RlX3ZhbHVlKSxcbiAgICAgIHJlbW90ZURldmljZTogU3RyaW5nKHIucmVtb3RlX2RldmljZSksIHJlbW90ZUFjdG9yOiBTdHJpbmcoci5yZW1vdGVfYWN0b3IpLFxuICAgICAgZGV0ZWN0ZWRBdDogU3RyaW5nKHIuZGV0ZWN0ZWRfYXQpLFxuICAgICAgcmVzb2x2ZWRBdDogci5yZXNvbHZlZF9hdCA/IFN0cmluZyhyLnJlc29sdmVkX2F0KSA6IG51bGwsXG4gICAgICByZXNvbHV0aW9uOiAoci5yZXNvbHV0aW9uIGFzIFN5bmNDb25mbGljdFsncmVzb2x1dGlvbiddKSA/PyBudWxsLFxuICAgIH0pKTtcbiAgfVxuXG4gIHJlc29sdmVDb25mbGljdChpZDogc3RyaW5nLCByZXNvbHV0aW9uOiAnbG9jYWwnIHwgJ3JlbW90ZScgfCAnbWVyZ2VkJywgbWVyZ2VkVmFsdWU/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gc3luY19jb25mbGljdHMgV0hFUkUgaWQ9PycpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gICAgaWYgKCFyb3cpIHJldHVybjtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPVxuICAgICAgICByZXNvbHV0aW9uID09PSAnbWVyZ2VkJyA/IChtZXJnZWRWYWx1ZSA/PyAnJykgOiByZXNvbHV0aW9uID09PSAnbG9jYWwnID8gU3RyaW5nKHJvdy5sb2NhbF92YWx1ZSkgOiBTdHJpbmcocm93LnJlbW90ZV92YWx1ZSk7XG4gICAgICBpZiAoU3RyaW5nKHJvdy5lbnRpdHkpID09PSAnaXRlbScpIHtcbiAgICAgICAgY29uc3QgZmllbGQgPSBTdHJpbmcocm93LmZpZWxkKTtcbiAgICAgICAgY29uc3Qgc3RhbXAgPSB0aGlzLm5vdygpO1xuICAgICAgICBjb25zdCBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0geyBbZmllbGRdOiB2YWx1ZSwgdXBkYXRlZEF0OiBzdGFtcCwgdXBkYXRlZEJ5OiB0aGlzLmFjdG9ySWQgfTtcbiAgICAgICAgLy8gUmVzb2x2aW5nIGEgYm9keSBjb25mbGljdCBtdXN0IGFsc28gcmVmcmVzaCB0aGUgc2VhcmNoLXRleHQgcHJvamVjdGlvbi5cbiAgICAgICAgaWYgKGZpZWxkID09PSAnYm9keScpIGZpZWxkcy5ib2R5VGV4dCA9IGRvY1RvVGV4dCh2YWx1ZSk7XG4gICAgICAgIHRoaXMuYXBwbHlJdGVtRmllbGRzKFN0cmluZyhyb3cuZW50aXR5X2lkKSwgZmllbGRzKTtcbiAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIFN0cmluZyhyb3cuZW50aXR5X2lkKSwgZmllbGRzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIHN5bmNfY29uZmxpY3RzIFNFVCByZXNvbHZlZF9hdD0/LCByZXNvbHV0aW9uPT8gV0hFUkUgaWQ9PycpLnJ1bih0aGlzLm5vdygpLCByZXNvbHV0aW9uLCBpZCk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogU3RyaW5nKHJvdy5lbnRpdHkpLCBlbnRpdHlJZDogU3RyaW5nKHJvdy5lbnRpdHlfaWQpIH0pO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBzeW5jIGV4cG9ydCBoZWxwZXJzIC0tLS0tLS0tLS1cbiAgb3BzU2luY2Uoc2VxOiBudW1iZXIsIG93bk9ubHkgPSB0cnVlKTogeyBzZXE6IG51bWJlcjsgb3A6IE9wIH1bXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKFxuICAgICAgICBgU0VMRUNUIHNlcSwgb3BfaWQsIGRldmljZV9pZCwgYWN0b3JfaWQsIGxhbXBvcnQsIGF0LCBlbnRpdHksIGVudGl0eV9pZCwgYWN0aW9uLCBwYXlsb2FkXG4gICAgICAgICBGUk9NIG9wbG9nIFdIRVJFIHNlcSA+ID8gJHtvd25Pbmx5ID8gJ0FORCBkZXZpY2VfaWQgPSA/JyA6ICcnfSBPUkRFUiBCWSBzZXEgQVNDYCxcbiAgICAgIClcbiAgICAgIC5hbGwoLi4uKG93bk9ubHkgPyBbc2VxLCB0aGlzLmRldmljZUlkXSA6IFtzZXFdKSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7XG4gICAgICBzZXE6IE51bWJlcihyLnNlcSksXG4gICAgICBvcDoge1xuICAgICAgICBvcElkOiBTdHJpbmcoci5vcF9pZCksIGRldmljZUlkOiBTdHJpbmcoci5kZXZpY2VfaWQpLCBhY3RvcklkOiBTdHJpbmcoci5hY3Rvcl9pZCksXG4gICAgICAgIGxhbXBvcnQ6IE51bWJlcihyLmxhbXBvcnQpLCBhdDogU3RyaW5nKHIuYXQpLCBlbnRpdHk6IHIuZW50aXR5IGFzIE9wWydlbnRpdHknXSxcbiAgICAgICAgZW50aXR5SWQ6IFN0cmluZyhyLmVudGl0eV9pZCksIGFjdGlvbjogci5hY3Rpb24gYXMgT3BbJ2FjdGlvbiddLFxuICAgICAgICBwYXlsb2FkOiBKU09OLnBhcnNlKFN0cmluZyhyLnBheWxvYWQpKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAgIH0sXG4gICAgfSkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBzYW1wbGUgZGF0YSAtLS0tLS0tLS0tXG4gIHJlbW92ZVNhbXBsZURhdGEoKTogbnVtYmVyIHtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgY29uc3QgaWRzID0gKHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkIEZST00gaXRlbXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pLm1hcCgocikgPT4gci5pZCk7XG4gICAgICBmb3IgKGNvbnN0IGlkIG9mIGlkcykgdGhpcy5kZWxldGVJdGVtKGlkKTtcbiAgICAgIGZvciAoY29uc3QgbSBvZiB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpZCBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pIHtcbiAgICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgbWlsZXN0b25lcyBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT8nKS5ydW4obS5pZCk7XG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ21pbGVzdG9uZScsIG0uaWQsIHsgZGVsZXRlZDogMSB9KTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgcmVsIG9mIHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkIEZST00gcmVsZWFzZXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pIHtcbiAgICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgcmVsZWFzZXMgU0VUIGRlbGV0ZWQ9MSBXSEVSRSBpZD0/JykucnVuKHJlbC5pZCk7XG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ3JlbGVhc2UnLCByZWwuaWQsIHsgZGVsZXRlZDogMSB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpZHMubGVuZ3RoO1xuICAgIH0pO1xuICAgIGNvbnN0IG4gPSB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnKicsIGVudGl0eUlkOiAnKicgfSk7XG4gICAgcmV0dXJuIG47XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLSByb3cgbWFwcGVycyAtLS0tLS0tLS0tXG5leHBvcnQgZnVuY3Rpb24gcm93VG9JdGVtKHI6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogV29ya0l0ZW0ge1xuICByZXR1cm4ge1xuICAgIGlkOiBTdHJpbmcoci5pZCksXG4gICAgaWRlbnQ6IFN0cmluZyhyLmlkZW50KSxcbiAgICB0eXBlOiByLnR5cGUgYXMgSXRlbVR5cGUsXG4gICAgdGl0bGU6IFN0cmluZyhyLnRpdGxlKSxcbiAgICBib2R5OiBTdHJpbmcoci5ib2R5KSxcbiAgICBib2R5VGV4dDogU3RyaW5nKHIuYm9keV90ZXh0KSxcbiAgICBzdGF0dXM6IFN0cmluZyhyLnN0YXR1cyksXG4gICAgcHJpb3JpdHk6IHIucHJpb3JpdHkgYXMgV29ya0l0ZW1bJ3ByaW9yaXR5J10sXG4gICAgb3duZXJJZDogKHIub3duZXJfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICByZXBvcnRlcklkOiAoci5yZXBvcnRlcl9pZCBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxuICAgIG1pbGVzdG9uZUlkOiAoci5taWxlc3RvbmVfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICByZWxlYXNlSWQ6IChyLnJlbGVhc2VfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBwYXJlbnRJZDogKHIucGFyZW50X2lkIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXG4gICAgc3RhcnREYXRlOiAoci5zdGFydF9kYXRlIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXG4gICAgZHVlRGF0ZTogKHIuZHVlX2RhdGUgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBjb21wbGV0ZWRBdDogKHIuY29tcGxldGVkX2F0IGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXG4gICAgZWZmb3J0OiByLmVmZm9ydCA9PSBudWxsID8gbnVsbCA6IE51bWJlcihyLmVmZm9ydCksXG4gICAgY29uZmlkZW5jZTogKHIuY29uZmlkZW5jZSBhcyBXb3JrSXRlbVsnY29uZmlkZW5jZSddKSA/PyBudWxsLFxuICAgIHJpc2tMZXZlbDogKHIucmlza19sZXZlbCBhcyBXb3JrSXRlbVsncmlza0xldmVsJ10pID8/IG51bGwsXG4gICAgYnVzaW5lc3NWYWx1ZTogKHIuYnVzaW5lc3NfdmFsdWUgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBsZWFkZXJzaGlwVmlzaWJsZTogTnVtYmVyKHIubGVhZGVyc2hpcF92aXNpYmxlKSBhcyAwIHwgMSxcbiAgICBwcm9ncmVzczogci5wcm9ncmVzcyA9PSBudWxsID8gbnVsbCA6IE51bWJlcihyLnByb2dyZXNzKSxcbiAgICB0YWdzOiBzYWZlUGFyc2UoU3RyaW5nKHIudGFncyksIFtdKSBhcyBzdHJpbmdbXSxcbiAgICBleHRyYTogc2FmZVBhcnNlKFN0cmluZyhyLmV4dHJhKSwge30pIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIGFyY2hpdmVkOiBOdW1iZXIoci5hcmNoaXZlZCkgYXMgMCB8IDEsXG4gICAgc2FtcGxlOiBOdW1iZXIoci5zYW1wbGUpIGFzIDAgfCAxLFxuICAgIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXG4gICAgdXBkYXRlZEF0OiBTdHJpbmcoci51cGRhdGVkX2F0KSxcbiAgICBjcmVhdGVkQnk6IFN0cmluZyhyLmNyZWF0ZWRfYnkpLFxuICAgIHVwZGF0ZWRCeTogU3RyaW5nKHIudXBkYXRlZF9ieSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJvd1RvTGluayhyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IEl0ZW1MaW5rIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogU3RyaW5nKHIuaWQpLFxuICAgIGZyb21JZDogU3RyaW5nKHIuZnJvbV9pZCksXG4gICAgdG9JZDogU3RyaW5nKHIudG9faWQpLFxuICAgIGtpbmQ6IHIua2luZCBhcyBMaW5rS2luZCxcbiAgICBjcmVhdGVkQXQ6IFN0cmluZyhyLmNyZWF0ZWRfYXQpLFxuICAgIGNyZWF0ZWRCeTogU3RyaW5nKHIuY3JlYXRlZF9ieSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNhZmVQYXJzZShzOiBzdHJpbmcsIGZhbGxiYWNrOiB1bmtub3duKTogdW5rbm93biB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2Uocyk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxsYmFjaztcbiAgfVxufVxuXG4vKiogQ29udmVydCBmcmVlIHRleHQgdG8gYSBzYWZlIEZUUzUgcHJlZml4IHF1ZXJ5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZ0c1F1ZXJ5KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRlcm1zID0gdGV4dFxuICAgIC5yZXBsYWNlKC9bJ1wiKigpXS9nLCAnICcpXG4gICAgLnNwbGl0KC9cXHMrLylcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLm1hcCgodCkgPT4gYFwiJHt0fVwiKmApO1xuICByZXR1cm4gdGVybXMuam9pbignICcpIHx8ICdcIlwiJztcbn1cbiIsICIvLyBTaGFyZWQgZG9tYWluIHR5cGVzIFx1MjAxNCBzaW5nbGUgc291cmNlIG9mIHRydXRoIGZvciBtYWluIHByb2Nlc3MgYW5kIHJlbmRlcmVyLlxuXG4vLyAtLS0tLS0tLS0tIFRlcm1pbm9sb2d5IC0tLS0tLS0tLS1cbi8vIFVtYnJlbGxhIG5vdW46IFwiV29yayBJdGVtXCIuIEV2ZXJ5IHRyYWNrZWQgcmVjb3JkIGlzIGEgd29yayBpdGVtIHdpdGggYSB0eXBlLlxuLy8gSWRlbnRzIGFyZSBwZXItdHlwZSBzZXF1ZW5jZXM6IFRBU0stMTIsIEZFQVQtMywgUkVRLTQxLCBERUMtMTIsIFJJU0stOCwgQkxLLTIsXG4vLyBBQ0MtNSwgTVRHLTE0LCBJREVBLTcsIFEtMywgREVGLTEsIFJFUy00LlxuXG5leHBvcnQgY29uc3QgSVRFTV9UWVBFUyA9IFtcbiAgJ3Rhc2snLFxuICAnZmVhdHVyZScsXG4gICdyZXF1aXJlbWVudCcsXG4gICdzdG9yeScsXG4gICdkZWNpc2lvbicsXG4gICdyaXNrJyxcbiAgJ2Jsb2NrZXInLFxuICAnYWNjZXNzJyxcbiAgJ21lZXRpbmcnLFxuICAnaWRlYScsXG4gICdxdWVzdGlvbicsXG4gICdkZWZlY3QnLFxuICAncmVzZWFyY2gnLFxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEl0ZW1UeXBlID0gKHR5cGVvZiBJVEVNX1RZUEVTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgSURFTlRfUFJFRklYOiBSZWNvcmQ8SXRlbVR5cGUsIHN0cmluZz4gPSB7XG4gIHRhc2s6ICdUQVNLJyxcbiAgZmVhdHVyZTogJ0ZFQVQnLFxuICByZXF1aXJlbWVudDogJ1JFUScsXG4gIHN0b3J5OiAnU1RPUlknLFxuICBkZWNpc2lvbjogJ0RFQycsXG4gIHJpc2s6ICdSSVNLJyxcbiAgYmxvY2tlcjogJ0JMSycsXG4gIGFjY2VzczogJ0FDQycsXG4gIG1lZXRpbmc6ICdNVEcnLFxuICBpZGVhOiAnSURFQScsXG4gIHF1ZXN0aW9uOiAnUScsXG4gIGRlZmVjdDogJ0RFRicsXG4gIHJlc2VhcmNoOiAnUkVTJyxcbn07XG5cbmV4cG9ydCBjb25zdCBUWVBFX0xBQkVMOiBSZWNvcmQ8SXRlbVR5cGUsIHN0cmluZz4gPSB7XG4gIHRhc2s6ICdUYXNrJyxcbiAgZmVhdHVyZTogJ0ZlYXR1cmUnLFxuICByZXF1aXJlbWVudDogJ1JlcXVpcmVtZW50JyxcbiAgc3Rvcnk6ICdVc2VyIFN0b3J5JyxcbiAgZGVjaXNpb246ICdEZWNpc2lvbicsXG4gIHJpc2s6ICdSaXNrJyxcbiAgYmxvY2tlcjogJ0Jsb2NrZXInLFxuICBhY2Nlc3M6ICdBY2Nlc3MgUmVxdWVzdCcsXG4gIG1lZXRpbmc6ICdNZWV0aW5nIE5vdGUnLFxuICBpZGVhOiAnSWRlYScsXG4gIHF1ZXN0aW9uOiAnT3BlbiBRdWVzdGlvbicsXG4gIGRlZmVjdDogJ0RlZmVjdCcsXG4gIHJlc2VhcmNoOiAnUmVzZWFyY2gnLFxufTtcblxuLy8gLS0tLS0tLS0tLSBTdGF0dXNlcyAtLS0tLS0tLS0tXG4vLyBXb3JrIHN0YXR1c2VzIGFwcGx5IHRvIGV4ZWN1dGFibGUgaXRlbXMgKHRhc2svZmVhdHVyZS9yZXF1aXJlbWVudC9zdG9yeS9kZWZlY3QvcmVzZWFyY2gvaWRlYSkuXG5leHBvcnQgY29uc3QgV09SS19TVEFUVVNFUyA9IFtcbiAgJ2JhY2tsb2cnLFxuICAndG9kbycsXG4gICdpbl9wcm9ncmVzcycsXG4gICdpbl9yZXZpZXcnLFxuICAnYmxvY2tlZCcsXG4gICdkb25lJyxcbiAgJ2NhbmNlbGxlZCcsXG5dIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgV29ya1N0YXR1cyA9ICh0eXBlb2YgV09SS19TVEFUVVNFUylbbnVtYmVyXTtcblxuZXhwb3J0IGNvbnN0IERFQ0lTSU9OX1NUQVRVU0VTID0gW1xuICAncHJvcG9zZWQnLFxuICAnZGlzY3Vzc2luZycsXG4gICdhcHByb3ZlZCcsXG4gICdyZWplY3RlZCcsXG4gICdyZXZpc2l0JyxcbiAgJ3N1cGVyc2VkZWQnLFxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIERlY2lzaW9uU3RhdHVzID0gKHR5cGVvZiBERUNJU0lPTl9TVEFUVVNFUylbbnVtYmVyXTtcblxuZXhwb3J0IGNvbnN0IEFDQ0VTU19TVEFUVVNFUyA9IFtcbiAgJ2lkZW50aWZpZWQnLFxuICAnbm90X3JlcXVlc3RlZCcsXG4gICdwcmVwYXJpbmcnLFxuICAncmVxdWVzdGVkJyxcbiAgJ3VuZGVyX3JldmlldycsXG4gICdpbmZvX25lZWRlZCcsXG4gICdhcHByb3ZlZCcsXG4gICdwYXJ0aWFsbHlfYXBwcm92ZWQnLFxuICAnZ3JhbnRlZCcsXG4gICdkZW5pZWQnLFxuICAnZXhwaXJlZCcsXG4gICdub3RfbmVlZGVkJyxcbl0gYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBY2Nlc3NTdGF0dXMgPSAodHlwZW9mIEFDQ0VTU19TVEFUVVNFUylbbnVtYmVyXTtcblxuZXhwb3J0IGNvbnN0IFJJU0tfU1RBVFVTRVMgPSBbJ29wZW4nLCAnbWl0aWdhdGluZycsICdhY2NlcHRlZCcsICdjbG9zZWQnXSBhcyBjb25zdDtcbmV4cG9ydCBjb25zdCBCTE9DS0VSX1NUQVRVU0VTID0gWydhY3RpdmUnLCAnd29ya2Fyb3VuZCcsICdyZXNvbHZlZCddIGFzIGNvbnN0O1xuZXhwb3J0IGNvbnN0IFFVRVNUSU9OX1NUQVRVU0VTID0gWydvcGVuJywgJ2Fuc3dlcmVkJywgJ3BhcmtlZCddIGFzIGNvbnN0O1xuZXhwb3J0IGNvbnN0IE1FRVRJTkdfU1RBVFVTRVMgPSBbJ3NjaGVkdWxlZCcsICdoZWxkJywgJ3N1bW1hcml6ZWQnXSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgSXRlbVN0YXR1cyA9IHN0cmluZzsgLy8gdmFsaWRhdGVkIHBlci10eXBlIGJ5IHN0YXR1c2VzRm9yVHlwZSgpXG5cbmV4cG9ydCBmdW5jdGlvbiBzdGF0dXNlc0ZvclR5cGUodHlwZTogSXRlbVR5cGUpOiByZWFkb25seSBzdHJpbmdbXSB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ2RlY2lzaW9uJzpcbiAgICAgIHJldHVybiBERUNJU0lPTl9TVEFUVVNFUztcbiAgICBjYXNlICdhY2Nlc3MnOlxuICAgICAgcmV0dXJuIEFDQ0VTU19TVEFUVVNFUztcbiAgICBjYXNlICdyaXNrJzpcbiAgICAgIHJldHVybiBSSVNLX1NUQVRVU0VTO1xuICAgIGNhc2UgJ2Jsb2NrZXInOlxuICAgICAgcmV0dXJuIEJMT0NLRVJfU1RBVFVTRVM7XG4gICAgY2FzZSAncXVlc3Rpb24nOlxuICAgICAgcmV0dXJuIFFVRVNUSU9OX1NUQVRVU0VTO1xuICAgIGNhc2UgJ21lZXRpbmcnOlxuICAgICAgcmV0dXJuIE1FRVRJTkdfU1RBVFVTRVM7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBXT1JLX1NUQVRVU0VTO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBTVEFUVVNfTEFCRUw6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIGJhY2tsb2c6ICdCYWNrbG9nJyxcbiAgdG9kbzogJ1RvIERvJyxcbiAgaW5fcHJvZ3Jlc3M6ICdJbiBQcm9ncmVzcycsXG4gIGluX3JldmlldzogJ0luIFJldmlldycsXG4gIGJsb2NrZWQ6ICdCbG9ja2VkJyxcbiAgZG9uZTogJ0RvbmUnLFxuICBjYW5jZWxsZWQ6ICdDYW5jZWxsZWQnLFxuICBwcm9wb3NlZDogJ1Byb3Bvc2VkJyxcbiAgZGlzY3Vzc2luZzogJ0Rpc2N1c3NpbmcnLFxuICBhcHByb3ZlZDogJ0FwcHJvdmVkJyxcbiAgcmVqZWN0ZWQ6ICdSZWplY3RlZCcsXG4gIHJldmlzaXQ6ICdSZXZpc2l0IExhdGVyJyxcbiAgc3VwZXJzZWRlZDogJ1N1cGVyc2VkZWQnLFxuICBpZGVudGlmaWVkOiAnSWRlbnRpZmllZCcsXG4gIG5vdF9yZXF1ZXN0ZWQ6ICdOb3QgUmVxdWVzdGVkJyxcbiAgcHJlcGFyaW5nOiAnUHJlcGFyaW5nIFJlcXVlc3QnLFxuICByZXF1ZXN0ZWQ6ICdSZXF1ZXN0ZWQnLFxuICB1bmRlcl9yZXZpZXc6ICdVbmRlciBSZXZpZXcnLFxuICBpbmZvX25lZWRlZDogJ01vcmUgSW5mbyBOZWVkZWQnLFxuICBwYXJ0aWFsbHlfYXBwcm92ZWQ6ICdQYXJ0aWFsbHkgQXBwcm92ZWQnLFxuICBncmFudGVkOiAnR3JhbnRlZCcsXG4gIGRlbmllZDogJ0RlbmllZCcsXG4gIGV4cGlyZWQ6ICdFeHBpcmVkJyxcbiAgbm90X25lZWRlZDogJ05vIExvbmdlciBOZWVkZWQnLFxuICBvcGVuOiAnT3BlbicsXG4gIG1pdGlnYXRpbmc6ICdNaXRpZ2F0aW5nJyxcbiAgYWNjZXB0ZWQ6ICdBY2NlcHRlZCcsXG4gIGNsb3NlZDogJ0Nsb3NlZCcsXG4gIGFjdGl2ZTogJ0FjdGl2ZScsXG4gIHdvcmthcm91bmQ6ICdXb3JrYXJvdW5kIEluIFBsYWNlJyxcbiAgcmVzb2x2ZWQ6ICdSZXNvbHZlZCcsXG4gIGFuc3dlcmVkOiAnQW5zd2VyZWQnLFxuICBwYXJrZWQ6ICdQYXJrZWQnLFxuICBzY2hlZHVsZWQ6ICdTY2hlZHVsZWQnLFxuICBoZWxkOiAnSGVsZCcsXG4gIHN1bW1hcml6ZWQ6ICdTdW1tYXJpemVkJyxcbn07XG5cbi8qKiBTdGF0dXNlcyB0aGF0IGNvdW50IGFzIFwiY2xvc2VkL3Rlcm1pbmFsXCIgZm9yIHByb2dyZXNzICsgZGFzaGJvYXJkcy4gKi9cbmV4cG9ydCBjb25zdCBURVJNSU5BTF9TVEFUVVNFUyA9IG5ldyBTZXQoW1xuICAnZG9uZScsXG4gICdjYW5jZWxsZWQnLFxuICAncmVqZWN0ZWQnLFxuICAnc3VwZXJzZWRlZCcsXG4gICdncmFudGVkJyxcbiAgJ2RlbmllZCcsXG4gICdleHBpcmVkJyxcbiAgJ25vdF9uZWVkZWQnLFxuICAnY2xvc2VkJyxcbiAgJ3Jlc29sdmVkJyxcbiAgJ2Fuc3dlcmVkJyxcbiAgJ3N1bW1hcml6ZWQnLFxuICAnYWNjZXB0ZWQnLFxuXSk7XG5cbmV4cG9ydCBjb25zdCBQUklPUklUSUVTID0gWyd1cmdlbnQnLCAnaGlnaCcsICdtZWRpdW0nLCAnbG93JywgJ25vbmUnXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIFByaW9yaXR5ID0gKHR5cGVvZiBQUklPUklUSUVTKVtudW1iZXJdO1xuXG4vLyAtLS0tLS0tLS0tIExpbmtzIC0tLS0tLS0tLS1cbmV4cG9ydCBjb25zdCBMSU5LX0tJTkRTID0gW1xuICAncmVsYXRlcycsIC8vIGdlbmVyaWMgYmlkaXJlY3Rpb25hbFxuICAnYmxvY2tzJywgLy8gZnJvbSBibG9ja3MgdG9cbiAgJ2ltcGxlbWVudHMnLCAvLyB0YXNrIGltcGxlbWVudHMgcmVxdWlyZW1lbnQvZmVhdHVyZVxuICAnc3VwcG9ydHMnLCAvLyByZXF1aXJlbWVudCBzdXBwb3J0cyBmZWF0dXJlXG4gICdzaGFwZWRfYnknLCAvLyBpdGVtIHNoYXBlZCBieSBkZWNpc2lvblxuICAncmVxdWlyZXNfYWNjZXNzJywgLy8gaXRlbSByZXF1aXJlcyBhY2Nlc3MgcmVjb3JkXG4gICdkaXNjdXNzZWRfaW4nLCAvLyBpdGVtIGRpc2N1c3NlZCBpbiBtZWV0aW5nXG4gICd2YWxpZGF0ZXMnLCAvLyB0ZXN0L2RlZmVjdCB2YWxpZGF0ZXMgcmVxdWlyZW1lbnRcbiAgJ3N1cGVyc2VkZXMnLCAvLyBkZWNpc2lvbiBzdXBlcnNlZGVzIGRlY2lzaW9uXG4gICdwYXJlbnQnLCAvLyBmcm9tIGlzIHBhcmVudCBvZiB0byAoYWxzbyBtaXJyb3JlZCB2aWEgaXRlbXMucGFyZW50X2lkKVxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIExpbmtLaW5kID0gKHR5cGVvZiBMSU5LX0tJTkRTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgTElOS19MQUJFTDogUmVjb3JkPExpbmtLaW5kLCBbc3RyaW5nLCBzdHJpbmddPiA9IHtcbiAgLy8gW2xhYmVsIGZyb20tPnRvLCBsYWJlbCB0by0+ZnJvbV1cbiAgcmVsYXRlczogWydyZWxhdGVzIHRvJywgJ3JlbGF0ZXMgdG8nXSxcbiAgYmxvY2tzOiBbJ2Jsb2NrcycsICdibG9ja2VkIGJ5J10sXG4gIGltcGxlbWVudHM6IFsnaW1wbGVtZW50cycsICdpbXBsZW1lbnRlZCBieSddLFxuICBzdXBwb3J0czogWydzdXBwb3J0cycsICdzdXBwb3J0ZWQgYnknXSxcbiAgc2hhcGVkX2J5OiBbJ3NoYXBlZCBieScsICdzaGFwZWQnXSxcbiAgcmVxdWlyZXNfYWNjZXNzOiBbJ3JlcXVpcmVzIGFjY2VzcycsICdyZXF1aXJlZCBmb3InXSxcbiAgZGlzY3Vzc2VkX2luOiBbJ2Rpc2N1c3NlZCBpbicsICdkaXNjdXNzZWQnXSxcbiAgdmFsaWRhdGVzOiBbJ3ZhbGlkYXRlcycsICd2YWxpZGF0ZWQgYnknXSxcbiAgc3VwZXJzZWRlczogWydzdXBlcnNlZGVzJywgJ3N1cGVyc2VkZWQgYnknXSxcbiAgcGFyZW50OiBbJ3BhcmVudCBvZicsICdjaGlsZCBvZiddLFxufTtcblxuLy8gLS0tLS0tLS0tLSBDb3JlIHJlY29yZHMgLS0tLS0tLS0tLVxuZXhwb3J0IGludGVyZmFjZSBXb3JrSXRlbSB7XG4gIGlkOiBzdHJpbmc7IC8vIHV1aWQgXHUyMDE0IGNhbm9uaWNhbCBpZGVudGl0eSwgdXNlZCBieSBhbGwgcmVmZXJlbmNlc1xuICBpZGVudDogc3RyaW5nOyAvLyBkaXNwbGF5IGlkIGUuZy4gUkVRLTQxIChtYXkgYmUgcmVudW1iZXJlZCBvbiBzeW5jIGNvbGxpc2lvbilcbiAgdHlwZTogSXRlbVR5cGU7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGJvZHk6IHN0cmluZzsgLy8gcmljaCBkb2MgSlNPTiAoZWRpdG9yIGRvY3VtZW50KSwgJycgd2hlbiBlbXB0eVxuICBib2R5VGV4dDogc3RyaW5nOyAvLyBwbGFpbiB0ZXh0IHByb2plY3Rpb24gZm9yIHNlYXJjaFxuICBzdGF0dXM6IHN0cmluZztcbiAgcHJpb3JpdHk6IFByaW9yaXR5O1xuICBvd25lcklkOiBzdHJpbmcgfCBudWxsO1xuICByZXBvcnRlcklkOiBzdHJpbmcgfCBudWxsO1xuICBtaWxlc3RvbmVJZDogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZUlkOiBzdHJpbmcgfCBudWxsO1xuICBwYXJlbnRJZDogc3RyaW5nIHwgbnVsbDtcbiAgc3RhcnREYXRlOiBzdHJpbmcgfCBudWxsOyAvLyBJU08gZGF0ZVxuICBkdWVEYXRlOiBzdHJpbmcgfCBudWxsO1xuICBjb21wbGV0ZWRBdDogc3RyaW5nIHwgbnVsbDsgLy8gSVNPIGRhdGV0aW1lXG4gIGVmZm9ydDogbnVtYmVyIHwgbnVsbDsgLy8gcG9pbnRzL2RheXMsIHVuaXQgaXMgdGVhbSBjb252ZW50aW9uXG4gIGNvbmZpZGVuY2U6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCBudWxsO1xuICByaXNrTGV2ZWw6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAnY3JpdGljYWwnIHwgbnVsbDtcbiAgYnVzaW5lc3NWYWx1ZTogc3RyaW5nIHwgbnVsbDtcbiAgbGVhZGVyc2hpcFZpc2libGU6IDAgfCAxO1xuICBwcm9ncmVzczogbnVtYmVyIHwgbnVsbDsgLy8gMC0xMDAgbWFudWFsIG92ZXJyaWRlOyBudWxsID0gZGVyaXZlZFxuICB0YWdzOiBzdHJpbmdbXTtcbiAgZXh0cmE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+OyAvLyB0eXBlLXNwZWNpZmljIGZpZWxkcyAoc2VlIGRvY3MvVEVSTUlOT0xPR1kubWQpXG4gIGFyY2hpdmVkOiAwIHwgMTtcbiAgc2FtcGxlOiAwIHwgMTsgLy8gc2VlZGVkIHNhbXBsZSBkYXRhIGZsYWdcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xuICBjcmVhdGVkQnk6IHN0cmluZztcbiAgdXBkYXRlZEJ5OiBzdHJpbmc7XG59XG5cbi8vIFR5cGUtc3BlY2lmaWMgYGV4dHJhYCBzaGFwZXMgKGRvY3VtZW50ZWQsIG5vdCBlbmZvcmNlZCBieSBEQik6XG4vLyBhY2Nlc3M6ICAgeyBzeXN0ZW0sIGFjY2Vzc1R5cGUsIGJ1c2luZXNzUmVhc29uLCByZXF1ZXN0ZWRGcm9tLCByZXF1ZXN0RGF0ZSxcbi8vICAgICAgICAgICAgIGFwcHJvdmVkQnksIGRhdGVHcmFudGVkLCBleHBpcmF0aW9uRGF0ZSwgcmVuZXdhbERhdGUsIHNlY3VyaXR5Tm90ZXMsIG5leHRBY3Rpb24sIGZvbGxvd1VwRGF0ZSB9XG4vLyBkZWNpc2lvbjogeyBjb250ZXh0LCBwcm9ibGVtLCBvcHRpb25zOiBbe3RpdGxlLCBub3Rlcywgc2VsZWN0ZWR9XSwgcmVhc29uaW5nLFxuLy8gICAgICAgICAgICAgdHJhZGVvZmZzLCBjb25zZXF1ZW5jZXMsIHJldmlld0RhdGUsIGNvbnRyaWJ1dG9yczogc3RyaW5nW10gfVxuLy8gbWVldGluZzogIHsgZGF0ZSwgdGltZSwgYXR0ZW5kZWVzOiBzdHJpbmdbXSwgcHVycG9zZSwgYWdlbmRhLCBmb2xsb3dVcERhdGUgfVxuLy8gcmlzazogICAgIHsgbGlrZWxpaG9vZCwgaW1wYWN0LCBtaXRpZ2F0aW9uLCB0cmlnZ2VyIH1cbi8vIGJsb2NrZXI6ICB7IHdhaXRpbmdPbiwgc2luY2UsIGVzY2FsYXRlZFRvIH1cbi8vIHJlcXVpcmVtZW50OiB7IGFjY2VwdGFuY2VDcml0ZXJpYSwgdGVzdGluZ05vdGVzLCBzZWN1cml0eUNvbnNpZGVyYXRpb25zIH1cblxuZXhwb3J0IGludGVyZmFjZSBJdGVtTGluayB7XG4gIGlkOiBzdHJpbmc7XG4gIGZyb21JZDogc3RyaW5nO1xuICB0b0lkOiBzdHJpbmc7XG4gIGtpbmQ6IExpbmtLaW5kO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgY3JlYXRlZEJ5OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tbWVudCB7XG4gIGlkOiBzdHJpbmc7XG4gIGl0ZW1JZDogc3RyaW5nO1xuICBhdXRob3JJZDogc3RyaW5nO1xuICBib2R5OiBzdHJpbmc7IC8vIHJpY2ggZG9jIEpTT05cbiAgYm9keVRleHQ6IHN0cmluZztcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nIHwgbnVsbDtcbiAgZGVsZXRlZDogMCB8IDE7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXR0YWNobWVudCB7XG4gIGlkOiBzdHJpbmc7XG4gIGl0ZW1JZDogc3RyaW5nO1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICBtaW1lOiBzdHJpbmc7XG4gIHNpemU6IG51bWJlcjtcbiAgc2hhMjU2OiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCBudWxsO1xuICB1cGxvYWRlZEJ5OiBzdHJpbmc7XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xuICBkZWxldGVkOiAwIHwgMTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBY3Rpdml0eUVudHJ5IHtcbiAgaWQ6IHN0cmluZztcbiAgaXRlbUlkOiBzdHJpbmcgfCBudWxsO1xuICBhY3RvcklkOiBzdHJpbmc7XG4gIGtpbmQ6IHN0cmluZzsgLy8gY3JlYXRlZCB8IHVwZGF0ZWQgfCBzdGF0dXMgfCBjb21tZW50IHwgbGluayB8IGF0dGFjaG1lbnQgfCBhcmNoaXZlZCB8IHJlc3RvcmVkIHwgLi4uXG4gIGZpZWxkOiBzdHJpbmcgfCBudWxsO1xuICBvbGRWYWx1ZTogc3RyaW5nIHwgbnVsbDtcbiAgbmV3VmFsdWU6IHN0cmluZyB8IG51bGw7XG4gIGF0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSXRlbVZlcnNpb24ge1xuICBpZDogc3RyaW5nO1xuICBpdGVtSWQ6IHN0cmluZztcbiAgdmVyc2lvbjogbnVtYmVyO1xuICB0aXRsZTogc3RyaW5nO1xuICBib2R5OiBzdHJpbmc7XG4gIHNhdmVkQnk6IHN0cmluZztcbiAgc2F2ZWRBdDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbGVzdG9uZSB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgdGFyZ2V0RGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgc3RhdHVzOiAncGxhbm5lZCcgfCAnYWN0aXZlJyB8ICdkb25lJztcbiAgc29ydDogbnVtYmVyO1xuICBzYW1wbGU6IDAgfCAxO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlbGVhc2Uge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIHZlcnNpb246IHN0cmluZztcbiAgdGFyZ2V0RGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgc3RhdHVzOiAncGxhbm5lZCcgfCAnaW5fcHJvZ3Jlc3MnIHwgJ3JlbGVhc2VkJyB8ICdjYW5jZWxsZWQnO1xuICBnb2Fsczogc3RyaW5nO1xuICBub3Rlczogc3RyaW5nOyAvLyByZWxlYXNlIG5vdGVzIHJpY2ggZG9jXG4gIHNhbXBsZTogMCB8IDE7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlciB7XG4gIGlkOiBzdHJpbmc7IC8vIHN0YWJsZSBzbHVnLCBlLmcuICdqb2huJywgJ21hcmsnXG4gIG5hbWU6IHN0cmluZztcbiAgaW5pdGlhbHM6IHN0cmluZztcbiAgY29sb3I6IHN0cmluZztcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2F2ZWRWaWV3IHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBjb25maWc6IFJlY29yZDxzdHJpbmcsIHVua25vd24+OyAvLyB7dmlldywgZmlsdGVycywgc29ydCwgZ3JvdXB9XG4gIHBpbm5lZDogMCB8IDE7XG4gIGNyZWF0ZWRCeTogc3RyaW5nO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbn1cblxuLy8gLS0tLS0tLS0tLSBTeW5jIC0tLS0tLS0tLS1cbmV4cG9ydCBpbnRlcmZhY2UgT3Age1xuICBvcElkOiBzdHJpbmc7IC8vIHV1aWRcbiAgZGV2aWNlSWQ6IHN0cmluZztcbiAgYWN0b3JJZDogc3RyaW5nO1xuICBsYW1wb3J0OiBudW1iZXI7XG4gIGF0OiBzdHJpbmc7IC8vIHdhbGwgY2xvY2ssIGluZm9ybWF0aW9uYWwgb25seSBcdTIwMTQgb3JkZXJpbmcgdXNlcyBsYW1wb3J0XG4gIGVudGl0eTogJ2l0ZW0nIHwgJ2xpbmsnIHwgJ2NvbW1lbnQnIHwgJ2F0dGFjaG1lbnQnIHwgJ21pbGVzdG9uZScgfCAncmVsZWFzZScgfCAndXNlcicgfCAnc2F2ZWRfdmlldycgfCAndGFnc2V0JztcbiAgZW50aXR5SWQ6IHN0cmluZztcbiAgYWN0aW9uOiAnY3JlYXRlJyB8ICdzZXQnIHwgJ2RlbGV0ZSc7XG4gIC8vIGNyZWF0ZTogcGF5bG9hZCA9IGZ1bGwgcmVjb3JkLiBzZXQ6IHBheWxvYWQgPSB7ZmllbGQ6IHZhbHVlLC4uLn0uIGRlbGV0ZTogcGF5bG9hZCA9IHt9LlxuICBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTeW5jQ29uZmxpY3Qge1xuICBpZDogc3RyaW5nO1xuICBlbnRpdHk6IHN0cmluZztcbiAgZW50aXR5SWQ6IHN0cmluZztcbiAgZmllbGQ6IHN0cmluZztcbiAgbG9jYWxWYWx1ZTogc3RyaW5nO1xuICByZW1vdGVWYWx1ZTogc3RyaW5nO1xuICByZW1vdGVEZXZpY2U6IHN0cmluZztcbiAgcmVtb3RlQWN0b3I6IHN0cmluZztcbiAgZGV0ZWN0ZWRBdDogc3RyaW5nO1xuICByZXNvbHZlZEF0OiBzdHJpbmcgfCBudWxsO1xuICByZXNvbHV0aW9uOiAnbG9jYWwnIHwgJ3JlbW90ZScgfCAnbWVyZ2VkJyB8IG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIFN5bmNTdGF0dXNTdGF0ZSA9ICdkaXNhYmxlZCcgfCAnaWRsZScgfCAnc3luY2luZycgfCAnb2ZmbGluZScgfCAnZXJyb3InO1xuZXhwb3J0IGludGVyZmFjZSBTeW5jU3RhdHVzIHtcbiAgc3RhdGU6IFN5bmNTdGF0dXNTdGF0ZTtcbiAgZm9sZGVyOiBzdHJpbmcgfCBudWxsO1xuICBsYXN0U3luY0F0OiBzdHJpbmcgfCBudWxsO1xuICBsYXN0RXJyb3I6IHN0cmluZyB8IG51bGw7XG4gIHBlbmRpbmdPcHM6IG51bWJlcjtcbiAgb3BlbkNvbmZsaWN0czogbnVtYmVyO1xuICBwZWVyczogeyBkZXZpY2VJZDogc3RyaW5nOyB1c2VyTmFtZTogc3RyaW5nIHwgbnVsbDsgbGFzdFNlZW5BdDogc3RyaW5nIHwgbnVsbCB9W107XG59XG5cbi8vIC0tLS0tLS0tLS0gUXVlcmllcyAtLS0tLS0tLS0tXG5leHBvcnQgaW50ZXJmYWNlIEl0ZW1GaWx0ZXIge1xuICB0eXBlcz86IEl0ZW1UeXBlW107XG4gIHN0YXR1c2VzPzogc3RyaW5nW107XG4gIHByaW9yaXRpZXM/OiBQcmlvcml0eVtdO1xuICBvd25lcklkcz86IChzdHJpbmcgfCBudWxsKVtdO1xuICBtaWxlc3RvbmVJZD86IHN0cmluZztcbiAgcmVsZWFzZUlkPzogc3RyaW5nO1xuICB0YWc/OiBzdHJpbmc7XG4gIHRleHQ/OiBzdHJpbmc7IC8vIEZUUyBxdWVyeVxuICBhcmNoaXZlZD86IGJvb2xlYW47IC8vIGRlZmF1bHQgZmFsc2VcbiAgb3ZlcmR1ZT86IGJvb2xlYW47XG4gIGR1ZVdpdGhpbkRheXM/OiBudW1iZXI7XG4gIGxlYWRlcnNoaXBWaXNpYmxlPzogYm9vbGVhbjtcbiAgdXBkYXRlZFNpbmNlPzogc3RyaW5nO1xuICBwYXJlbnRJZD86IHN0cmluZztcbiAgc2FtcGxlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJdGVtU29ydCB7XG4gIGZpZWxkOiAnaWRlbnQnIHwgJ3RpdGxlJyB8ICdzdGF0dXMnIHwgJ3ByaW9yaXR5JyB8ICdkdWVEYXRlJyB8ICdjcmVhdGVkQXQnIHwgJ3VwZGF0ZWRBdCcgfCAnbWFudWFsJztcbiAgZGlyOiAnYXNjJyB8ICdkZXNjJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWFyY2hSZXN1bHQge1xuICBpdGVtOiBXb3JrSXRlbTtcbiAgc25pcHBldDogc3RyaW5nIHwgbnVsbDtcbiAgc2NvcmU6IG51bWJlcjtcbn1cbiIsICIvLyBSaWNoLWRvYyBoZWxwZXJzIHNoYXJlZCBieSBtYWluIHByb2Nlc3MgYW5kIHJlbmRlcmVyLlxuXG4vKiogRXh0cmFjdCBwbGFpbiB0ZXh0IGZyb20gYSBzdG9yZWQgZWRpdG9yIGRvY3VtZW50IChUaXBUYXAgSlNPTiBzdHJpbmcpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRvY1RvVGV4dChib2R5OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWJvZHkpIHJldHVybiAnJztcbiAgdHJ5IHtcbiAgICBjb25zdCBkb2MgPSBKU09OLnBhcnNlKGJvZHkpIGFzIHsgY29udGVudD86IHVua25vd25bXSB9O1xuICAgIGNvbnN0IHdhbGsgPSAobm9kZXM6IHVua25vd25bXSk6IHN0cmluZyA9PlxuICAgICAgbm9kZXNcbiAgICAgICAgLm1hcCgobikgPT4ge1xuICAgICAgICAgIGNvbnN0IG5vZGUgPSBuIGFzIHsgdHlwZT86IHN0cmluZzsgdGV4dD86IHN0cmluZzsgY29udGVudD86IHVua25vd25bXSB9O1xuICAgICAgICAgIGlmIChub2RlLnRleHQpIHJldHVybiBub2RlLnRleHQ7XG4gICAgICAgICAgY29uc3QgaW5uZXIgPSBub2RlLmNvbnRlbnQgPyB3YWxrKG5vZGUuY29udGVudCkgOiAnJztcbiAgICAgICAgICByZXR1cm4gbm9kZS50eXBlID09PSAncGFyYWdyYXBoJyB8fCBub2RlLnR5cGU/LnN0YXJ0c1dpdGgoJ2hlYWRpbmcnKSA/IGlubmVyICsgJ1xcbicgOiBpbm5lcjtcbiAgICAgICAgfSlcbiAgICAgICAgLmpvaW4oJycpO1xuICAgIHJldHVybiB3YWxrKGRvYy5jb250ZW50ID8/IFtdKS50cmltKCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBib2R5O1xuICB9XG59XG5cbi8qKiBXcmFwIHBsYWluIHRleHQgaW50byBhIG1pbmltYWwgZWRpdG9yIGRvY3VtZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRUb0RvYyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgIHR5cGU6ICdkb2MnLFxuICAgIGNvbnRlbnQ6IHRleHQuc3BsaXQoL1xcbnsyLH0vKS5tYXAoKHApID0+ICh7XG4gICAgICB0eXBlOiAncGFyYWdyYXBoJyxcbiAgICAgIGNvbnRlbnQ6IHAgPyBbeyB0eXBlOiAndGV4dCcsIHRleHQ6IHAgfV0gOiBbXSxcbiAgICB9KSksXG4gIH0pO1xufVxuIiwgIi8vIFN5bmNUcmFuc3BvcnQ6IHRoZSBzZWFtIGJldHdlZW4gVGV0aGVyIGFuZCB3aGF0ZXZlciBtb3ZlcyBieXRlcyBiZXR3ZWVuIG1hY2hpbmVzLlxuLy8gdjEgc2hpcHMgRm9sZGVyVHJhbnNwb3J0IChhIE9uZURyaXZlL1NoYXJlUG9pbnQtc3luY2VkIGZvbGRlcikuIFRoZSBpbnRlcmZhY2UgaXNcbi8vIGRlbGliZXJhdGVseSBkdW1iIFx1MjAxNCBhcHBlbmQtb25seSBiYXRjaGVzIG91dCwgYmF0Y2hlcyBpbiBcdTIwMTQgc28gYSBmdXR1cmUgQXp1cmUgU1FMIC9cbi8vIERhdGF2ZXJzZSAvIGludGVybmFsIEFQSSB0cmFuc3BvcnQgc2xvdHMgaW4gd2l0aG91dCB0b3VjaGluZyBtZXJnZSBsb2dpYy5cblxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB0eXBlIHsgT3AgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBlZXJJbmZvIHtcbiAgZGV2aWNlSWQ6IHN0cmluZztcbiAgdXNlck5hbWU6IHN0cmluZyB8IG51bGw7XG4gIGxhc3RTZWVuQXQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3BCYXRjaEZpbGUge1xuICBkZXZpY2VJZDogc3RyaW5nO1xuICBmaWxlTmFtZTogc3RyaW5nOyAvLyBzb3J0YWJsZSwgdW5pcXVlIHBlciBkZXZpY2VcbiAgb3BzOiBPcFtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN5bmNUcmFuc3BvcnQge1xuICAvKiogSHVtYW4tcmVhZGFibGUgbG9jYXRpb24gZm9yIHRoZSBVSSAoXCJ3aGVyZSBpcyBteSBkYXRhXCIpLiAqL1xuICBsb2NhdGlvbigpOiBzdHJpbmc7XG4gIC8qKiBUcnVlIHdoZW4gdGhlIGJhY2tpbmcgbWVkaXVtIGlzIHJlYWNoYWJsZSByaWdodCBub3cuICovXG4gIGF2YWlsYWJsZSgpOiBib29sZWFuO1xuICAvKiogUHVibGlzaCBhIGJhdGNoIG9mIHRoaXMgZGV2aWNlJ3Mgb3BzLiBNdXN0IGJlIGF0b21pYyAoYWxsLW9yLW5vdGhpbmcgdmlzaWJsZSkuICovXG4gIHB1Ymxpc2hPcHMoZGV2aWNlSWQ6IHN0cmluZywgYmF0Y2hOYW1lOiBzdHJpbmcsIG9wczogT3BbXSk6IFByb21pc2U8dm9pZD47XG4gIC8qKiBMaXN0IHBlZXIgYmF0Y2ggZmlsZSBuYW1lcyAoc29ydGVkIGFzY2VuZGluZykgbmV3ZXIgdGhhbiBgYWZ0ZXJGaWxlYCBmb3IgZWFjaCBwZWVyLiAqL1xuICBsaXN0UGVlckJhdGNoZXMob3duRGV2aWNlSWQ6IHN0cmluZywgYWZ0ZXJGaWxlQnlEZXZpY2U6IE1hcDxzdHJpbmcsIHN0cmluZyB8IG51bGw+KTogUHJvbWlzZTx7IGRldmljZUlkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfVtdPjtcbiAgLyoqIEZldGNoIG9uZSBiYXRjaC4gKi9cbiAgZmV0Y2hCYXRjaChkZXZpY2VJZDogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nKTogUHJvbWlzZTxPcFtdPjtcbiAgLyoqIEFubm91bmNlIHByZXNlbmNlIChvd24gZmlsZSBvbmx5IFx1MjAxNCBubyB3cml0ZSBjb250ZW50aW9uKS4gKi9cbiAgYW5ub3VuY2UoZGV2aWNlSWQ6IHN0cmluZywgdXNlck5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG4gIC8qKiBBbGwgYW5ub3VuY2VkIGRldmljZXMuICovXG4gIGxpc3RQZWVycygpOiBQcm9taXNlPFBlZXJJbmZvW10+O1xuICAvKiogU3RvcmUgYW4gYXR0YWNobWVudCBibG9iIGNvbnRlbnQtYWRkcmVzc2VkIGJ5IHNoYTI1Ni4gUmV0dXJucyB0cnVlIGlmIG5ld2x5IHN0b3JlZC4gKi9cbiAgcHV0QmxvYihzaGEyNTY6IHN0cmluZywgZGF0YTogQnVmZmVyKTogUHJvbWlzZTxib29sZWFuPjtcbiAgLyoqIEZldGNoIGFuIGF0dGFjaG1lbnQgYmxvYiwgbnVsbCBpZiBub3QgKHlldCkgcHJlc2VudC4gKi9cbiAgZ2V0QmxvYihzaGEyNTY6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyIHwgbnVsbD47XG59XG5cbi8qKlxuICogRm9sZGVyVHJhbnNwb3J0IFx1MjAxNCBzaGFyZWQtZm9sZGVyIGxheW91dDpcbiAqICAgPHJvb3Q+L29wcy88ZGV2aWNlSWQ+LzAwMDAwMDAwMDAxLmpzb25sICAgb3AgYmF0Y2hlcywgb25lIEpTT04gb3AgcGVyIGxpbmVcbiAqICAgPHJvb3Q+L29wcy88ZGV2aWNlSWQ+L2RldmljZS5qc29uICAgICAgICAgIHByZXNlbmNlICsgaWRlbnRpdHlcbiAqICAgPHJvb3Q+L2Jsb2JzLzxhYT4vPHNoYTI1Nj4gICAgICAgICAgICAgICAgIGNvbnRlbnQtYWRkcmVzc2VkIGF0dGFjaG1lbnRzXG4gKlxuICogQ29ycmVjdG5lc3MgcnVsZXM6XG4gKiAtIEEgZGV2aWNlIHdyaXRlcyBPTkxZIHVuZGVyIGl0cyBvd24gb3BzLzxkZXZpY2VJZD4vIGRpcmVjdG9yeSBcdTIxOTIgbm8gd3JpdGUgY29udGVudGlvbixcbiAqICAgbm8gc2hhcmVkLWZpbGUgbG9ja2luZywgbm8gU1FMaXRlLW92ZXItT25lRHJpdmUgY29ycnVwdGlvbiBjbGFzcy5cbiAqIC0gRmlsZXMgYXJlIHdyaXR0ZW4gdG8gYSB0ZW1wIG5hbWUgdGhlbiByZW5hbWVkIFx1MjE5MiByZWFkZXJzIG5ldmVyIHNlZSBwYXJ0aWFsIGJhdGNoZXMuXG4gKiAtIEJhdGNoZXMgYXJlIGltbXV0YWJsZSBvbmNlIHB1Ymxpc2hlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIEZvbGRlclRyYW5zcG9ydCBpbXBsZW1lbnRzIFN5bmNUcmFuc3BvcnQge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IHN0cmluZykge31cblxuICBsb2NhdGlvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJvb3Q7XG4gIH1cblxuICBhdmFpbGFibGUoKTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4odGhpcy5yb290LCAnb3BzJyksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvcHNEaXIoZGV2aWNlSWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHBhdGguam9pbih0aGlzLnJvb3QsICdvcHMnLCBkZXZpY2VJZCk7XG4gIH1cblxuICBhc3luYyBwdWJsaXNoT3BzKGRldmljZUlkOiBzdHJpbmcsIGJhdGNoTmFtZTogc3RyaW5nLCBvcHM6IE9wW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBkaXIgPSB0aGlzLm9wc0RpcihkZXZpY2VJZCk7XG4gICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgY29uc3QgZmluYWxQYXRoID0gcGF0aC5qb2luKGRpciwgYmF0Y2hOYW1lKTtcbiAgICBjb25zdCB0bXBQYXRoID0gZmluYWxQYXRoICsgJy50bXAnO1xuICAgIGNvbnN0IGxpbmVzID0gb3BzLm1hcCgobykgPT4gSlNPTi5zdHJpbmdpZnkobykpLmpvaW4oJ1xcbicpICsgJ1xcbic7XG4gICAgZnMud3JpdGVGaWxlU3luYyh0bXBQYXRoLCBsaW5lcywgJ3V0ZjgnKTtcbiAgICBmcy5yZW5hbWVTeW5jKHRtcFBhdGgsIGZpbmFsUGF0aCk7XG4gIH1cblxuICBhc3luYyBsaXN0UGVlckJhdGNoZXMoXG4gICAgb3duRGV2aWNlSWQ6IHN0cmluZyxcbiAgICBhZnRlckZpbGVCeURldmljZTogTWFwPHN0cmluZywgc3RyaW5nIHwgbnVsbD4sXG4gICk6IFByb21pc2U8eyBkZXZpY2VJZDogc3RyaW5nOyBmaWxlTmFtZTogc3RyaW5nIH1bXT4ge1xuICAgIGNvbnN0IG9wc1Jvb3QgPSBwYXRoLmpvaW4odGhpcy5yb290LCAnb3BzJyk7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKG9wc1Jvb3QpKSByZXR1cm4gW107XG4gICAgY29uc3Qgb3V0OiB7IGRldmljZUlkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfVtdID0gW107XG4gICAgZm9yIChjb25zdCBkZXYgb2YgZnMucmVhZGRpclN5bmMob3BzUm9vdCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pKSB7XG4gICAgICBpZiAoIWRldi5pc0RpcmVjdG9yeSgpIHx8IGRldi5uYW1lID09PSBvd25EZXZpY2VJZCkgY29udGludWU7XG4gICAgICBjb25zdCBhZnRlciA9IGFmdGVyRmlsZUJ5RGV2aWNlLmdldChkZXYubmFtZSkgPz8gbnVsbDtcbiAgICAgIGNvbnN0IGZpbGVzID0gZnNcbiAgICAgICAgLnJlYWRkaXJTeW5jKHBhdGguam9pbihvcHNSb290LCBkZXYubmFtZSkpXG4gICAgICAgIC5maWx0ZXIoKGYpID0+IGYuZW5kc1dpdGgoJy5qc29ubCcpKVxuICAgICAgICAuc29ydCgpO1xuICAgICAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB7XG4gICAgICAgIGlmIChhZnRlciAmJiBmIDw9IGFmdGVyKSBjb250aW51ZTtcbiAgICAgICAgb3V0LnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIGZpbGVOYW1lOiBmIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgYXN5bmMgZmV0Y2hCYXRjaChkZXZpY2VJZDogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nKTogUHJvbWlzZTxPcFtdPiB7XG4gICAgY29uc3QgcCA9IHBhdGguam9pbih0aGlzLm9wc0RpcihkZXZpY2VJZCksIGZpbGVOYW1lKTtcbiAgICBjb25zdCB0ZXh0ID0gZnMucmVhZEZpbGVTeW5jKHAsICd1dGY4Jyk7XG4gICAgY29uc3Qgb3BzOiBPcFtdID0gW107XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIHRleHQuc3BsaXQoJ1xcbicpKSB7XG4gICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gICAgICBpZiAoIXRyaW1tZWQpIGNvbnRpbnVlO1xuICAgICAgb3BzLnB1c2goSlNPTi5wYXJzZSh0cmltbWVkKSBhcyBPcCk7XG4gICAgfVxuICAgIHJldHVybiBvcHM7XG4gIH1cblxuICBhc3luYyBhbm5vdW5jZShkZXZpY2VJZDogc3RyaW5nLCB1c2VyTmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGlyID0gdGhpcy5vcHNEaXIoZGV2aWNlSWQpO1xuICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4oZGlyLCAnZGV2aWNlLmpzb24nKTtcbiAgICBjb25zdCB0bXAgPSBwICsgJy50bXAnO1xuICAgIGZzLndyaXRlRmlsZVN5bmModG1wLCBKU09OLnN0cmluZ2lmeSh7IGRldmljZUlkLCB1c2VyTmFtZSwgbGFzdFNlZW5BdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pLCAndXRmOCcpO1xuICAgIGZzLnJlbmFtZVN5bmModG1wLCBwKTtcbiAgfVxuXG4gIGFzeW5jIGxpc3RQZWVycygpOiBQcm9taXNlPFBlZXJJbmZvW10+IHtcbiAgICBjb25zdCBvcHNSb290ID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ29wcycpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhvcHNSb290KSkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IHBlZXJzOiBQZWVySW5mb1tdID0gW107XG4gICAgZm9yIChjb25zdCBkZXYgb2YgZnMucmVhZGRpclN5bmMob3BzUm9vdCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pKSB7XG4gICAgICBpZiAoIWRldi5pc0RpcmVjdG9yeSgpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4ob3BzUm9vdCwgZGV2Lm5hbWUsICdkZXZpY2UuanNvbicpO1xuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHApKSB7XG4gICAgICAgIHBlZXJzLnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIHVzZXJOYW1lOiBudWxsLCBsYXN0U2VlbkF0OiBudWxsIH0pO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGluZm8gPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwLCAndXRmOCcpKSBhcyBQZWVySW5mbztcbiAgICAgICAgcGVlcnMucHVzaCh7IGRldmljZUlkOiBkZXYubmFtZSwgdXNlck5hbWU6IGluZm8udXNlck5hbWUgPz8gbnVsbCwgbGFzdFNlZW5BdDogaW5mby5sYXN0U2VlbkF0ID8/IG51bGwgfSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgcGVlcnMucHVzaCh7IGRldmljZUlkOiBkZXYubmFtZSwgdXNlck5hbWU6IG51bGwsIGxhc3RTZWVuQXQ6IG51bGwgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwZWVycztcbiAgfVxuXG4gIGFzeW5jIHB1dEJsb2Ioc2hhMjU2OiBzdHJpbmcsIGRhdGE6IEJ1ZmZlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRpciA9IHBhdGguam9pbih0aGlzLnJvb3QsICdibG9icycsIHNoYTI1Ni5zbGljZSgwLCAyKSk7XG4gICAgY29uc3QgcCA9IHBhdGguam9pbihkaXIsIHNoYTI1Nik7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMocCkpIHJldHVybiBmYWxzZTtcbiAgICBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zdCB0bXAgPSBwICsgJy50bXAtJyArIHByb2Nlc3MucGlkO1xuICAgIGZzLndyaXRlRmlsZVN5bmModG1wLCBkYXRhKTtcbiAgICB0cnkge1xuICAgICAgZnMucmVuYW1lU3luYyh0bXAsIHApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgZnMucm1TeW5jKHRtcCwgeyBmb3JjZTogdHJ1ZSB9KTsgLy8gcGVlciB3b24gdGhlIHJhY2U7IGNvbnRlbnQtYWRkcmVzc2VkIHNvIGlkZW50aWNhbFxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGdldEJsb2Ioc2hhMjU2OiBzdHJpbmcpOiBQcm9taXNlPEJ1ZmZlciB8IG51bGw+IHtcbiAgICBjb25zdCBwID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ2Jsb2JzJywgc2hhMjU2LnNsaWNlKDAsIDIpLCBzaGEyNTYpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhwKSkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhwKTtcbiAgfVxufVxuIiwgIi8vIFN5bmNFbmdpbmU6IHBlcmlvZGljICsgZXZlbnQtZHJpdmVuIGV4cG9ydC9pbXBvcnQgbG9vcCBvdmVyIGEgU3luY1RyYW5zcG9ydC5cbi8vIExvY2FsLWZpcnN0OiB0aGUgYXBwIGlzIGZ1bGx5IHVzYWJsZSB3aXRoIHN5bmMgZGlzYWJsZWQgb3IgdGhlIGZvbGRlciBvZmZsaW5lO1xuLy8gb3BzIHF1ZXVlIGluIHRoZSBvcGxvZyBhbmQgZmx1c2ggd2hlbiB0aGUgdHJhbnNwb3J0IHJldHVybnMuXG5cbmltcG9ydCB0eXBlIHsgU3RvcmUgfSBmcm9tICcuLi9kYi9zdG9yZSc7XG5pbXBvcnQgeyBnZXRNZXRhLCBzZXRNZXRhIH0gZnJvbSAnLi4vZGIvZGInO1xuaW1wb3J0IHR5cGUgeyBTeW5jVHJhbnNwb3J0IH0gZnJvbSAnLi90cmFuc3BvcnQnO1xuaW1wb3J0IHR5cGUgeyBTeW5jU3RhdHVzLCBTeW5jU3RhdHVzU3RhdGUgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuXG5jb25zdCBFWFBPUlRfREVCT1VOQ0VfTVMgPSAxXzUwMDtcbmNvbnN0IFBPTExfSU5URVJWQUxfTVMgPSA1XzAwMDtcblxuZXhwb3J0IGNsYXNzIFN5bmNFbmdpbmUge1xuICBwcml2YXRlIHRyYW5zcG9ydDogU3luY1RyYW5zcG9ydCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGV4cG9ydFRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJ1bm5pbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXJyZW50OiBQcm9taXNlPHZvaWQ+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIHByaXZhdGUgc3RhdGU6IFN5bmNTdGF0dXNTdGF0ZSA9ICdkaXNhYmxlZCc7XG4gIHByaXZhdGUgbGFzdEVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsYXN0U3luY0F0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB1c2VyTmFtZTogc3RyaW5nO1xuICBwcml2YXRlIG9uU3RhdHVzOiAoczogU3luY1N0YXR1cykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHN0b3JlOiBTdG9yZSxcbiAgICB1c2VyTmFtZTogc3RyaW5nLFxuICAgIG9uU3RhdHVzOiAoczogU3luY1N0YXR1cykgPT4gdm9pZCxcbiAgKSB7XG4gICAgdGhpcy51c2VyTmFtZSA9IHVzZXJOYW1lO1xuICAgIHRoaXMub25TdGF0dXMgPSBvblN0YXR1cztcbiAgfVxuXG4gIHNldFRyYW5zcG9ydCh0cmFuc3BvcnQ6IFN5bmNUcmFuc3BvcnQgfCBudWxsKTogdm9pZCB7XG4gICAgdGhpcy50cmFuc3BvcnQgPSB0cmFuc3BvcnQ7XG4gICAgaWYgKHRoaXMudGltZXIpIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcik7XG4gICAgdGhpcy50aW1lciA9IG51bGw7XG4gICAgaWYgKHRyYW5zcG9ydCkge1xuICAgICAgLy8gU3luYyBjdXJzb3JzIGJlbG9uZyB0byBhIHNwZWNpZmljIGZvbGRlci4gUG9pbnRpbmcgYXQgYSBkaWZmZXJlbnQgZm9sZGVyXG4gICAgICAvLyBtdXN0IHJlLXB1Ymxpc2ggZXZlcnl0aGluZyAob3AtaWQgZGVkdXAgbWFrZXMgdGhhdCBzYWZlKSBhbmQgcmUtaW1wb3J0XG4gICAgICAvLyBwZWVycyBmcm9tIHNjcmF0Y2ggXHUyMDE0IG90aGVyd2lzZSB0aGUgbmV3IGZvbGRlciBnZXRzIGEgcGVybWFuZW50bHlcbiAgICAgIC8vIGluY29tcGxldGUgZGF0YXNldC5cbiAgICAgIGNvbnN0IGZvbGRlcktleSA9IHRyYW5zcG9ydC5sb2NhdGlvbigpO1xuICAgICAgY29uc3Qga25vd25Gb2xkZXIgPSBnZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdzeW5jX2ZvbGRlcl9rZXknKTtcbiAgICAgIGlmIChrbm93bkZvbGRlciAhPT0gZm9sZGVyS2V5KSB7XG4gICAgICAgIHNldE1ldGEodGhpcy5zdG9yZS5kYiwgJ2xhc3RfZXhwb3J0ZWRfc2VxJywgJzAnKTtcbiAgICAgICAgdGhpcy5zdG9yZS5kYi5wcmVwYXJlKCdERUxFVEUgRlJPTSBzeW5jX3BlZXJzJykucnVuKCk7XG4gICAgICAgIHNldE1ldGEodGhpcy5zdG9yZS5kYiwgJ3N5bmNfZm9sZGVyX2tleScsIGZvbGRlcktleSk7XG4gICAgICB9XG4gICAgICB0aGlzLnN0YXRlID0gJ2lkbGUnO1xuICAgICAgdGhpcy50aW1lciA9IHNldEludGVydmFsKCgpID0+IHZvaWQgdGhpcy5jeWNsZSgpLCBQT0xMX0lOVEVSVkFMX01TKTtcbiAgICAgIHZvaWQgdGhpcy5jeWNsZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0YXRlID0gJ2Rpc2FibGVkJztcbiAgICAgIHRoaXMuZW1pdFN0YXR1cygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIGFubm91bmNlZCBkaXNwbGF5IG5hbWUgKGlkZW50aXR5IGNhbiBiZSBzZXQgYWZ0ZXIgYm9vdCkuICovXG4gIHNldFVzZXJOYW1lKG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMudXNlck5hbWUgPSBuYW1lO1xuICB9XG5cbiAgLyoqIENhbGwgYWZ0ZXIgYW55IGxvY2FsIG11dGF0aW9uIFx1MjAxNCBkZWJvdW5jZWQgZXhwb3J0IHNvIHJhcGlkIGVkaXRzIGJhdGNoLiAqL1xuICBub3RlTG9jYWxDaGFuZ2UoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnRyYW5zcG9ydCkgcmV0dXJuO1xuICAgIGlmICh0aGlzLmV4cG9ydFRpbWVyKSBjbGVhclRpbWVvdXQodGhpcy5leHBvcnRUaW1lcik7XG4gICAgdGhpcy5leHBvcnRUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gdm9pZCB0aGlzLmN5Y2xlKCksIEVYUE9SVF9ERUJPVU5DRV9NUyk7XG4gIH1cblxuICBhc3luYyBjeWNsZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMudHJhbnNwb3J0IHx8IHRoaXMucnVubmluZykgcmV0dXJuIHRoaXMuY3VycmVudDtcbiAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCByZWxlYXNlITogKCkgPT4gdm9pZDtcbiAgICB0aGlzLmN1cnJlbnQgPSBuZXcgUHJvbWlzZSgocikgPT4gKHJlbGVhc2UgPSByKSk7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy50cmFuc3BvcnQuYXZhaWxhYmxlKCkpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSgnb2ZmbGluZScsICdTeW5jIGZvbGRlciBpcyBub3QgcmVhY2hhYmxlJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0U3RhdGUoJ3N5bmNpbmcnLCBudWxsKTtcbiAgICAgIGF3YWl0IHRoaXMuZXhwb3J0T3BzKCk7XG4gICAgICBhd2FpdCB0aGlzLmltcG9ydE9wcygpO1xuICAgICAgYXdhaXQgdGhpcy50cmFuc3BvcnQuYW5ub3VuY2UodGhpcy5zdG9yZS5kZXZpY2VJZCwgdGhpcy51c2VyTmFtZSk7XG4gICAgICB0aGlzLmxhc3RTeW5jQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICB0aGlzLnNldFN0YXRlKCdpZGxlJywgbnVsbCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKCdlcnJvcicsIGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgICAgcmVsZWFzZSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZXhwb3J0T3BzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy50cmFuc3BvcnQpIHJldHVybjtcbiAgICBjb25zdCBsYXN0RXhwb3J0ZWQgPSBOdW1iZXIoZ2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnbGFzdF9leHBvcnRlZF9zZXEnKSA/PyAnMCcpO1xuICAgIGNvbnN0IHBlbmRpbmcgPSB0aGlzLnN0b3JlLm9wc1NpbmNlKGxhc3RFeHBvcnRlZCwgdHJ1ZSk7XG4gICAgaWYgKHBlbmRpbmcubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgY29uc3QgbWF4U2VxID0gcGVuZGluZ1twZW5kaW5nLmxlbmd0aCAtIDFdLnNlcTtcbiAgICBjb25zdCBiYXRjaE5hbWUgPSBTdHJpbmcobWF4U2VxKS5wYWRTdGFydCgxMiwgJzAnKSArICcuanNvbmwnO1xuICAgIGF3YWl0IHRoaXMudHJhbnNwb3J0LnB1Ymxpc2hPcHMoXG4gICAgICB0aGlzLnN0b3JlLmRldmljZUlkLFxuICAgICAgYmF0Y2hOYW1lLFxuICAgICAgcGVuZGluZy5tYXAoKHApID0+IHAub3ApLFxuICAgICk7XG4gICAgc2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnbGFzdF9leHBvcnRlZF9zZXEnLCBTdHJpbmcobWF4U2VxKSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGltcG9ydE9wcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMudHJhbnNwb3J0KSByZXR1cm47XG4gICAgY29uc3QgcGVlcnMgPSB0aGlzLnN0b3JlLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIGRldmljZV9pZCwgbGFzdF9maWxlIEZST00gc3luY19wZWVycycpXG4gICAgICAuYWxsKCkgYXMgeyBkZXZpY2VfaWQ6IHN0cmluZzsgbGFzdF9maWxlOiBzdHJpbmcgfCBudWxsIH1bXTtcbiAgICBjb25zdCBhZnRlckJ5RGV2aWNlID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZyB8IG51bGw+KHBlZXJzLm1hcCgocCkgPT4gW3AuZGV2aWNlX2lkLCBwLmxhc3RfZmlsZV0pKTtcblxuICAgIGNvbnN0IGJhdGNoZXMgPSBhd2FpdCB0aGlzLnRyYW5zcG9ydC5saXN0UGVlckJhdGNoZXModGhpcy5zdG9yZS5kZXZpY2VJZCwgYWZ0ZXJCeURldmljZSk7XG4gICAgLy8gQmF0Y2hlcyBtdXN0IGFwcGx5IHN0cmljdGx5IGluIGZpbGVuYW1lIG9yZGVyIHBlciBkZXZpY2UuIElmIG9uZSBmaWxlIGlzXG4gICAgLy8gdW5yZWFkYWJsZSAoZS5nLiBzdGlsbCBzeW5jaW5nIGRvd24pLCBTVE9QIHRoYXQgZGV2aWNlIGZvciB0aGlzIGN5Y2xlIFx1MjAxNFxuICAgIC8vIGFkdmFuY2luZyBwYXN0IGl0IHdvdWxkIHBlcm1hbmVudGx5IHNraXAgaXRzIG9wcy5cbiAgICBjb25zdCBzdGFsbGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCBiIG9mIGJhdGNoZXMpIHtcbiAgICAgIGlmIChzdGFsbGVkLmhhcyhiLmRldmljZUlkKSkgY29udGludWU7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBvcHMgPSBhd2FpdCB0aGlzLnRyYW5zcG9ydC5mZXRjaEJhdGNoKGIuZGV2aWNlSWQsIGIuZmlsZU5hbWUpO1xuICAgICAgICB0aGlzLnN0b3JlLmFwcGx5UmVtb3RlT3BzKG9wcyk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgc3RhbGxlZC5hZGQoYi5kZXZpY2VJZCk7IC8vIHJldHJ5IGZyb20gdGhpcyBmaWxlIG5leHQgY3ljbGU7IGN1cnNvciB1bnRvdWNoZWRcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLnN0b3JlLmRiXG4gICAgICAgIC5wcmVwYXJlKFxuICAgICAgICAgIGBJTlNFUlQgSU5UTyBzeW5jX3BlZXJzKGRldmljZV9pZCwgbGFzdF9maWxlLCBsYXN0X3NlZW5fYXQpIFZBTFVFUyg/LD8sPylcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoZGV2aWNlX2lkKSBETyBVUERBVEUgU0VUIGxhc3RfZmlsZT1leGNsdWRlZC5sYXN0X2ZpbGUsIGxhc3Rfc2Vlbl9hdD1leGNsdWRlZC5sYXN0X3NlZW5fYXRgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4oYi5kZXZpY2VJZCwgYi5maWxlTmFtZSwgbmV3IERhdGUoKS50b0lTT1N0cmluZygpKTtcbiAgICB9XG5cbiAgICAvLyBSZWZyZXNoIHBlZXIgZGlzcGxheSBuYW1lcyBmcm9tIGFubm91bmNlbWVudHMuXG4gICAgZm9yIChjb25zdCBwIG9mIGF3YWl0IHRoaXMudHJhbnNwb3J0Lmxpc3RQZWVycygpKSB7XG4gICAgICBpZiAocC5kZXZpY2VJZCA9PT0gdGhpcy5zdG9yZS5kZXZpY2VJZCkgY29udGludWU7XG4gICAgICB0aGlzLnN0b3JlLmRiXG4gICAgICAgIC5wcmVwYXJlKFxuICAgICAgICAgIGBJTlNFUlQgSU5UTyBzeW5jX3BlZXJzKGRldmljZV9pZCwgdXNlcl9uYW1lLCBsYXN0X3NlZW5fYXQpIFZBTFVFUyg/LD8sPylcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoZGV2aWNlX2lkKSBETyBVUERBVEUgU0VUIHVzZXJfbmFtZT1DT0FMRVNDRShleGNsdWRlZC51c2VyX25hbWUsIHN5bmNfcGVlcnMudXNlcl9uYW1lKSxcbiAgICAgICAgICAgICBsYXN0X3NlZW5fYXQ9Q09BTEVTQ0UoZXhjbHVkZWQubGFzdF9zZWVuX2F0LCBzeW5jX3BlZXJzLmxhc3Rfc2Vlbl9hdClgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4ocC5kZXZpY2VJZCwgcC51c2VyTmFtZSwgcC5sYXN0U2VlbkF0KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldFN0YXRlKHN0YXRlOiBTeW5jU3RhdHVzU3RhdGUsIGVycm9yOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMubGFzdEVycm9yID0gZXJyb3I7XG4gICAgdGhpcy5lbWl0U3RhdHVzKCk7XG4gIH1cblxuICBwcml2YXRlIGVtaXRTdGF0dXMoKTogdm9pZCB7XG4gICAgdGhpcy5vblN0YXR1cyh0aGlzLnN0YXR1cygpKTtcbiAgfVxuXG4gIHN0YXR1cygpOiBTeW5jU3RhdHVzIHtcbiAgICBjb25zdCBsYXN0RXhwb3J0ZWQgPSBOdW1iZXIoZ2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnbGFzdF9leHBvcnRlZF9zZXEnKSA/PyAnMCcpO1xuICAgIGNvbnN0IHBlbmRpbmdSb3cgPSB0aGlzLnN0b3JlLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIENPVU5UKCopIEFTIGMgRlJPTSBvcGxvZyBXSEVSRSBzZXEgPiA/IEFORCBkZXZpY2VfaWQgPSA/JylcbiAgICAgIC5nZXQobGFzdEV4cG9ydGVkLCB0aGlzLnN0b3JlLmRldmljZUlkKSBhcyB7IGM6IG51bWJlciB9O1xuICAgIGNvbnN0IGNvbmZsaWN0Um93ID0gdGhpcy5zdG9yZS5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBDT1VOVCgqKSBBUyBjIEZST00gc3luY19jb25mbGljdHMgV0hFUkUgcmVzb2x2ZWRfYXQgSVMgTlVMTCcpXG4gICAgICAuZ2V0KCkgYXMgeyBjOiBudW1iZXIgfTtcbiAgICBjb25zdCBwZWVycyA9IHRoaXMuc3RvcmUuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgZGV2aWNlX2lkIEFTIGRldmljZUlkLCB1c2VyX25hbWUgQVMgdXNlck5hbWUsIGxhc3Rfc2Vlbl9hdCBBUyBsYXN0U2VlbkF0IEZST00gc3luY19wZWVycycpXG4gICAgICAuYWxsKCkgYXMgU3luY1N0YXR1c1sncGVlcnMnXTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdGU6IHRoaXMuc3RhdGUsXG4gICAgICBmb2xkZXI6IHRoaXMudHJhbnNwb3J0ID8gdGhpcy50cmFuc3BvcnQubG9jYXRpb24oKSA6IG51bGwsXG4gICAgICBsYXN0U3luY0F0OiB0aGlzLmxhc3RTeW5jQXQsXG4gICAgICBsYXN0RXJyb3I6IHRoaXMubGFzdEVycm9yLFxuICAgICAgcGVuZGluZ09wczogcGVuZGluZ1Jvdy5jLFxuICAgICAgb3BlbkNvbmZsaWN0czogY29uZmxpY3RSb3cuYyxcbiAgICAgIHBlZXJzLFxuICAgIH07XG4gIH1cblxuICAvKiogU3RvcHMgdGltZXJzIGFuZCB3YWl0cyBmb3IgYW55IGluLWZsaWdodCBjeWNsZSBcdTIwMTQgc2FmZSB0byBjbG9zZSB0aGUgREIgYWZ0ZXJ3YXJkcy4gKi9cbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy50aW1lcikgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVyKTtcbiAgICBpZiAodGhpcy5leHBvcnRUaW1lcikgY2xlYXJUaW1lb3V0KHRoaXMuZXhwb3J0VGltZXIpO1xuICAgIHRoaXMudGltZXIgPSBudWxsO1xuICAgIHRoaXMuZXhwb3J0VGltZXIgPSBudWxsO1xuICAgIGF3YWl0IHRoaXMuY3VycmVudDtcbiAgfVxufVxuIiwgIi8vIFNhbXBsZSBTdXBwb3J0IEFJIHByb2plY3QgZGF0YS4gRXZlcnkgcmVjb3JkIGNhcnJpZXMgc2FtcGxlPTEgYW5kIGEgW1NBTVBMRV0gdGl0bGVcbi8vIG1hcmtlciBjb252ZW50aW9uIGlzIE5PVCB1c2VkIFx1MjAxNCB0aGUgc2FtcGxlIGZsYWcgZHJpdmVzIGJhZGdlcyArIG9uZS1jbGljayByZW1vdmFsLlxuLy8gTm8gcmVhbCBNY0tlc3NvbiBkYXRhOiBuYW1lcyBvZiBzeXN0ZW1zIGFyZSBnZW5lcmljLCBjb250ZW50cyBhcmUgaWxsdXN0cmF0aXZlLlxuXG5pbXBvcnQgdHlwZSB7IFN0b3JlIH0gZnJvbSAnLi9zdG9yZSc7XG5pbXBvcnQgdHlwZSB7IEl0ZW1UeXBlLCBQcmlvcml0eSB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5cbmludGVyZmFjZSBTZWVkSXRlbSB7XG4gIHR5cGU6IEl0ZW1UeXBlO1xuICB0aXRsZTogc3RyaW5nO1xuICBib2R5VGV4dD86IHN0cmluZztcbiAgc3RhdHVzPzogc3RyaW5nO1xuICBwcmlvcml0eT86IFByaW9yaXR5O1xuICBvd25lcj86ICdqb2huJyB8ICdtYXJrJyB8IG51bGw7XG4gIGR1ZURhdGU/OiBzdHJpbmc7XG4gIHRhZ3M/OiBzdHJpbmdbXTtcbiAgZXh0cmE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgbWlsZXN0b25lPzogc3RyaW5nO1xuICBsZWFkZXJzaGlwVmlzaWJsZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkU2VlZERhdGEoc3RvcmU6IFN0b3JlKTogbnVtYmVyIHtcbiAgLy8gUHJvYmUgZGlyZWN0bHkgKGxpc3RJdGVtcyBoaWRlcyBhcmNoaXZlZCByb3dzIFx1MjAxNCBhcmNoaXZlZCBzYW1wbGVzIG11c3Qgc3RpbGwgYmxvY2sgYSByZWxvYWQpLlxuICBjb25zdCBleGlzdGluZyA9IHN0b3JlLmRiLnByZXBhcmUoJ1NFTEVDVCAxIEZST00gaXRlbXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCBMSU1JVCAxJykuZ2V0KCk7XG4gIGlmIChleGlzdGluZykgcmV0dXJuIDA7IC8vIGFscmVhZHkgbG9hZGVkXG5cbiAgY29uc3QgbTEgPSBzdG9yZS51cHNlcnRNaWxlc3RvbmUoeyBuYW1lOiAnRGlzY292ZXJ5ICYgQWNjZXNzJywgdGFyZ2V0RGF0ZTogJzIwMjYtMDgtMTUnLCBzdGF0dXM6ICdhY3RpdmUnLCBzb3J0OiAxLCBzYW1wbGU6IDEsIGRlc2NyaXB0aW9uOiAnU2VjdXJlIHN5c3RlbSBhY2Nlc3MsIGludmVudG9yeSBrbm93bGVkZ2Ugc291cmNlcywgY29uZmlybSBzY29wZSB3aXRoIGxlYWRlcnNoaXAuJyB9KTtcbiAgY29uc3QgbTIgPSBzdG9yZS51cHNlcnRNaWxlc3RvbmUoeyBuYW1lOiAnS25vd2xlZGdlIFBpcGVsaW5lIE1WUCcsIHRhcmdldERhdGU6ICcyMDI2LTEwLTAxJywgc3RhdHVzOiAncGxhbm5lZCcsIHNvcnQ6IDIsIHNhbXBsZTogMSwgZGVzY3JpcHRpb246ICdJbmdlc3QsIGNsZWFuLCBhbmQgaW5kZXggdGhlIGZpcnN0IGtub3dsZWRnZSBkb21haW4gZW5kIHRvIGVuZC4nIH0pO1xuICBjb25zdCBtMyA9IHN0b3JlLnVwc2VydE1pbGVzdG9uZSh7IG5hbWU6ICdQaWxvdCB3aXRoIFN1cHBvcnQgVGVhbScsIHRhcmdldERhdGU6ICcyMDI2LTEyLTAxJywgc3RhdHVzOiAncGxhbm5lZCcsIHNvcnQ6IDMsIHNhbXBsZTogMSwgZGVzY3JpcHRpb246ICdMaW1pdGVkIHBpbG90OiBtZWFzdXJlIGRlZmxlY3Rpb24sIGFjY3VyYWN5LCBhbmQgYWdlbnQgc2F0aXNmYWN0aW9uLicgfSk7XG4gIHN0b3JlLnVwc2VydFJlbGVhc2UoeyBuYW1lOiAnU3VwcG9ydCBBSSBQaWxvdCAwLjEnLCB2ZXJzaW9uOiAnMC4xJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTEtMTUnLCBzdGF0dXM6ICdwbGFubmVkJywgZ29hbHM6ICdGaXJzdCBpbnRlcm5hbCBwaWxvdCBidWlsZDogc2luZ2xlIGtub3dsZWRnZSBkb21haW4sIDEwIHN1cHBvcnQgYWdlbnRzLCBmZWVkYmFjayBsb29wIGluIHBsYWNlLicsIHNhbXBsZTogMSB9KTtcblxuICBjb25zdCBtaWxlc3RvbmVJZDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHsgbTE6IG0xLmlkLCBtMjogbTIuaWQsIG0zOiBtMy5pZCB9O1xuXG4gIGNvbnN0IGl0ZW1zOiAoU2VlZEl0ZW0gJiB7IGtleTogc3RyaW5nIH0pW10gPSBbXG4gICAgLy8gRmVhdHVyZXNcbiAgICB7IGtleTogJ2ZlYXRBbnN3ZXInLCB0eXBlOiAnZmVhdHVyZScsIHRpdGxlOiAnQUkgYW5zd2VyIGdlbmVyYXRpb24gb3ZlciBrbm93bGVkZ2UgYmFzZScsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTInLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgYm9keVRleHQ6ICdDb3JlIGNhcGFiaWxpdHk6IGdpdmVuIGEgc3VwcG9ydCBxdWVzdGlvbiwgcmV0cmlldmUgcmVsZXZhbnQga25vd2xlZGdlIGFydGljbGVzIGFuZCBnZW5lcmF0ZSBhIGdyb3VuZGVkLCBjaXRlZCBhbnN3ZXIuJyB9LFxuICAgIHsga2V5OiAnZmVhdEluZ2VzdCcsIHR5cGU6ICdmZWF0dXJlJywgdGl0bGU6ICdLbm93bGVkZ2UgaW5nZXN0aW9uIHBpcGVsaW5lIChTYWxlc2ZvcmNlIEtBIGV4cG9ydCknLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTInLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgYm9keVRleHQ6ICdFeHBvcnQga25vd2xlZGdlIGFydGljbGVzLCBub3JtYWxpemUgdG8gY2xlYW4gdGV4dCwgY2h1bmssIGFuZCBpbmRleCBmb3IgcmV0cmlldmFsLicgfSxcbiAgICB7IGtleTogJ2ZlYXRGZWVkYmFjaycsIHR5cGU6ICdmZWF0dXJlJywgdGl0bGU6ICdBZ2VudCBmZWVkYmFjayBjYXB0dXJlICh0aHVtYnMgKyByZWFzb24gY29kZXMpJywgc3RhdHVzOiAnYmFja2xvZycsIHByaW9yaXR5OiAnbWVkaXVtJywgb3duZXI6ICdtYXJrJywgbWlsZXN0b25lOiAnbTMnLCBib2R5VGV4dDogJ1BpbG90IGFnZW50cyByYXRlIGVhY2ggQUkgYW5zd2VyOyByZWFzb25zIGZlZWQgdGhlIHF1YWxpdHkgZGFzaGJvYXJkLicgfSxcblxuICAgIC8vIFJlcXVpcmVtZW50c1xuICAgIHsga2V5OiAncmVxQ2l0YXRpb25zJywgdHlwZTogJ3JlcXVpcmVtZW50JywgdGl0bGU6ICdFdmVyeSBBSSBhbnN3ZXIgbXVzdCBjaXRlIGl0cyBzb3VyY2UgYXJ0aWNsZXMnLCBzdGF0dXM6ICd0b2RvJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTInLCBleHRyYTogeyBhY2NlcHRhbmNlQ3JpdGVyaWE6ICdBbnN3ZXIgVUkgc2hvd3MgYXQgbGVhc3Qgb25lIHNvdXJjZSBsaW5rIHBlciBhbnN3ZXI7IHVuY2l0ZWQgYW5zd2VycyBhcmUgc3VwcHJlc3NlZC4nLCBzZWN1cml0eUNvbnNpZGVyYXRpb25zOiAnQ2l0YXRpb25zIG11c3Qgbm90IGV4cG9zZSByZXN0cmljdGVkIGFydGljbGVzIHRvIHVuYXV0aG9yaXplZCBhZ2VudHMuJyB9IH0sXG4gICAgeyBrZXk6ICdyZXFQSEknLCB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ05vIFBISSBvciBjdXN0b21lciBkYXRhIG1heSBsZWF2ZSBhcHByb3ZlZCBzeXN0ZW1zJywgc3RhdHVzOiAnaW5fcHJvZ3Jlc3MnLCBwcmlvcml0eTogJ3VyZ2VudCcsIG93bmVyOiAnbWFyaycsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBhY2NlcHRhbmNlQ3JpdGVyaWE6ICdEYXRhIGZsb3cgZGlhZ3JhbSBhcHByb3ZlZCBieSBzZWN1cml0eTsgRExQIHNjYW4gb2YgcGlwZWxpbmUgb3V0cHV0IHNob3dzIHplcm8gUEhJLicsIHNlY3VyaXR5Q29uc2lkZXJhdGlvbnM6ICdCbG9ja2luZyByZXF1aXJlbWVudCBmb3IgYW55IGV4dGVybmFsIEFJIHNlcnZpY2UuJyB9IH0sXG4gICAgeyBrZXk6ICdyZXFGcmVzaG5lc3MnLCB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ0tub3dsZWRnZSBpbmRleCByZWZyZXNoZXMgd2l0aGluIDI0aCBvZiBhcnRpY2xlIHVwZGF0ZXMnLCBzdGF0dXM6ICdiYWNrbG9nJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGV4dHJhOiB7IGFjY2VwdGFuY2VDcml0ZXJpYTogJ0FydGljbGUgZWRpdGVkIGluIHNvdXJjZSBzeXN0ZW0gYXBwZWFycyBpbiByZXRyaWV2YWwgcmVzdWx0cyB3aXRoaW4gMjQgaG91cnMuJyB9IH0sXG5cbiAgICAvLyBUYXNrc1xuICAgIHsga2V5OiAndGFza0V4cG9ydCcsIHR5cGU6ICd0YXNrJywgdGl0bGU6ICdCdWlsZCBTYWxlc2ZvcmNlIGtub3dsZWRnZSBhcnRpY2xlIGV4cG9ydCBzY3JpcHQnLCBzdGF0dXM6ICdkb25lJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTEnLCBib2R5VGV4dDogJ0V4cG9ydCBhbGwgcHVibGlzaGVkIEtBcyB3aXRoIG1ldGFkYXRhIHRvIHN0cnVjdHVyZWQgZmlsZXMuJyB9LFxuICAgIHsga2V5OiAndGFza0NsZWFuJywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0hUTUxcdTIxOTJjbGVhbiB0ZXh0IG5vcm1hbGl6YXRpb24gZm9yIGV4cG9ydGVkIGFydGljbGVzJywgc3RhdHVzOiAnaW5fcHJvZ3Jlc3MnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGR1ZURhdGU6ICcyMDI2LTA3LTI0JyB9LFxuICAgIHsga2V5OiAndGFza0V2YWwnLCB0eXBlOiAndGFzaycsIHRpdGxlOiAnRHJhZnQgYW5zd2VyLXF1YWxpdHkgZXZhbHVhdGlvbiBydWJyaWMnLCBzdGF0dXM6ICd0b2RvJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcjogJ21hcmsnLCBtaWxlc3RvbmU6ICdtMicsIGR1ZURhdGU6ICcyMDI2LTA3LTMxJyB9LFxuICAgIHsga2V5OiAndGFza0ludmVudG9yeScsIHR5cGU6ICd0YXNrJywgdGl0bGU6ICdJbnZlbnRvcnkgY2FuZGlkYXRlIGtub3dsZWRnZSBkb21haW5zIGFuZCBhcnRpY2xlIGNvdW50cycsIHN0YXR1czogJ2RvbmUnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20xJyB9LFxuXG4gICAgLy8gQWNjZXNzIHJlcXVlc3RzXG4gICAgeyBrZXk6ICdhY2NTZkFwaScsIHR5cGU6ICdhY2Nlc3MnLCB0aXRsZTogJ1NhbGVzZm9yY2UgQVBJIGFjY2VzcyAoS25vd2xlZGdlIG9iamVjdCwgcmVhZCknLCBzdGF0dXM6ICdyZXF1ZXN0ZWQnLCBwcmlvcml0eTogJ3VyZ2VudCcsIG93bmVyOiAnam9obicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBzeXN0ZW06ICdTYWxlc2ZvcmNlIFNlcnZpY2UgQ2xvdWQnLCBhY2Nlc3NUeXBlOiAnQVBJIHJlYWQgKEtub3dsZWRnZSBvYmplY3QpJywgYnVzaW5lc3NSZWFzb246ICdBdXRvbWF0ZWQgZXhwb3J0IG9mIGtub3dsZWRnZSBhcnRpY2xlcyBmb3IgdGhlIGluZ2VzdGlvbiBwaXBlbGluZS4nLCByZXF1ZXN0ZWRGcm9tOiAnU2FsZXNmb3JjZSBwbGF0Zm9ybSB0ZWFtJywgcmVxdWVzdERhdGU6ICcyMDI2LTA2LTMwJywgbmV4dEFjdGlvbjogJ0ZvbGxvdyB1cCB3aXRoIHBsYXRmb3JtIHRlYW0gbGVhZCcsIGZvbGxvd1VwRGF0ZTogJzIwMjYtMDctMTUnIH0gfSxcbiAgICB7IGtleTogJ2FjY0F6dXJlJywgdHlwZTogJ2FjY2VzcycsIHRpdGxlOiAnQXp1cmUgT3BlbkFJIHNlcnZpY2UgcHJvdmlzaW9uaW5nIGluIE1jS2Vzc29uIHRlbmFudCcsIHN0YXR1czogJ3VuZGVyX3JldmlldycsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdtYXJrJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IHN5c3RlbTogJ0F6dXJlIE9wZW5BSSAoTWNLZXNzb24gdGVuYW50KScsIGFjY2Vzc1R5cGU6ICdSZXNvdXJjZSBwcm92aXNpb25pbmcgKyBBUEkga2V5cycsIGJ1c2luZXNzUmVhc29uOiAnQXBwcm92ZWQtdGVuYW50IExMTSByZXF1aXJlZCBmb3IgYW5zd2VyIGdlbmVyYXRpb24gd2l0aG91dCBkYXRhIGVncmVzcy4nLCByZXF1ZXN0ZWRGcm9tOiAnQ2xvdWQgcGxhdGZvcm0gLyBzZWN1cml0eScsIHJlcXVlc3REYXRlOiAnMjAyNi0wNi0yMicsIG5leHRBY3Rpb246ICdTZWN1cml0eSByZXZpZXcgbWVldGluZycsIGZvbGxvd1VwRGF0ZTogJzIwMjYtMDctMTgnIH0gfSxcbiAgICB7IGtleTogJ2FjY1NwJywgdHlwZTogJ2FjY2VzcycsIHRpdGxlOiAnU2hhcmVQb2ludCBzaXRlIGZvciBwaWxvdCBkb2N1bWVudGF0aW9uJywgc3RhdHVzOiAnZ3JhbnRlZCcsIHByaW9yaXR5OiAnbG93Jywgb3duZXI6ICdtYXJrJywgZXh0cmE6IHsgc3lzdGVtOiAnU2hhcmVQb2ludCBPbmxpbmUnLCBhY2Nlc3NUeXBlOiAnU2l0ZSBvd25lcicsIGJ1c2luZXNzUmVhc29uOiAnU2hhcmVkIGRvY3VtZW50YXRpb24gYW5kIHBpbG90IGFydGlmYWN0cy4nLCByZXF1ZXN0ZWRGcm9tOiAnSVQgc2VydmljZSBkZXNrJywgcmVxdWVzdERhdGU6ICcyMDI2LTA2LTEwJywgYXBwcm92ZWRCeTogJ0lUIHNlcnZpY2UgZGVzaycsIGRhdGVHcmFudGVkOiAnMjAyNi0wNi0xMicgfSB9LFxuXG4gICAgLy8gRGVjaXNpb25zXG4gICAgeyBrZXk6ICdkZWNUZW5hbnQnLCB0eXBlOiAnZGVjaXNpb24nLCB0aXRsZTogJ1VzZSB0ZW5hbnQtaG9zdGVkIEF6dXJlIE9wZW5BSSwgbm90IHB1YmxpYyBBUElzJywgc3RhdHVzOiAnYXBwcm92ZWQnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgY29udGV4dDogJ0Fuc3dlciBnZW5lcmF0aW9uIG5lZWRzIGFuIExMTS4gUHVibGljIEFJIEFQSXMgYXJlIHVuYXBwcm92ZWQgZm9yIGludGVybmFsIGRhdGEuJywgcHJvYmxlbTogJ1doaWNoIExMTSBob3N0aW5nIHBhdGggc2F0aXNmaWVzIHNlY3VyaXR5IHdoaWxlIHVuYmxvY2tpbmcgdGhlIHBpbG90PycsIG9wdGlvbnM6IFt7IHRpdGxlOiAnUHVibGljIEFQSSAoT3BlbkFJL0FudGhyb3BpYyBkaXJlY3QpJywgbm90ZXM6ICdGYXN0IGJ1dCB1bmFwcHJvdmVkIGZvciBpbnRlcm5hbCBkYXRhJywgc2VsZWN0ZWQ6IGZhbHNlIH0sIHsgdGl0bGU6ICdBenVyZSBPcGVuQUkgaW4gTWNLZXNzb24gdGVuYW50Jywgbm90ZXM6ICdEYXRhIHN0YXlzIGluIHRlbmFudDsgcHJvY3VyZW1lbnQgKyBwcm92aXNpb25pbmcgcmVxdWlyZWQnLCBzZWxlY3RlZDogdHJ1ZSB9LCB7IHRpdGxlOiAnTG9jYWwgb3Blbi13ZWlnaHRzIG1vZGVsJywgbm90ZXM6ICdObyBlZ3Jlc3MgYnV0IHdlYWtlciBxdWFsaXR5IGFuZCBoZWF2eSBpbmZyYScsIHNlbGVjdGVkOiBmYWxzZSB9XSwgcmVhc29uaW5nOiAnVGVuYW50IGhvc3Rpbmcga2VlcHMgZGF0YSBpbnNpZGUgYXBwcm92ZWQgYm91bmRhcnkgYW5kIGhhcyBhbiBleGlzdGluZyBlbnRlcnByaXNlIGFncmVlbWVudCBwYXRoLicsIHRyYWRlb2ZmczogJ1Nsb3dlciBzdGFydDsgY2FwYWNpdHkgcXVvdGFzOyBtb2RlbCBhdmFpbGFiaWxpdHkgbGFncyBwdWJsaWMgQVBJcy4nIH0gfSxcbiAgICB7IGtleTogJ2RlY0RvbWFpbicsIHR5cGU6ICdkZWNpc2lvbicsIHRpdGxlOiAnUGlsb3Qgc2NvcGU6IHN0YXJ0IHdpdGggb25lIGhpZ2gtdm9sdW1lIGtub3dsZWRnZSBkb21haW4nLCBzdGF0dXM6ICdkaXNjdXNzaW5nJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcjogJ2pvaG4nLCBleHRyYTogeyBjb250ZXh0OiAnS25vd2xlZGdlIGJhc2Ugc3BhbnMgbWFueSBwcm9kdWN0IGFyZWFzIHdpdGggdW5ldmVuIHF1YWxpdHkuJywgcHJvYmxlbTogJ1BpbG90IGV2ZXJ5dGhpbmcgb3Igb25lIGRvbWFpbiBmaXJzdD8nLCBvcHRpb25zOiBbeyB0aXRsZTogJ1NpbmdsZSBkb21haW4gcGlsb3QnLCBub3RlczogJ0NsZWFuZXIgbWVhc3VyZW1lbnQsIGZhc3RlciBpdGVyYXRpb24nLCBzZWxlY3RlZDogdHJ1ZSB9LCB7IHRpdGxlOiAnQWxsIGRvbWFpbnMgYXQgb25jZScsIG5vdGVzOiAnQnJvYWRlciBpbXBhY3QsIGRpbHV0ZWQgcXVhbGl0eSBzaWduYWwnLCBzZWxlY3RlZDogZmFsc2UgfV0sIHJlYXNvbmluZzogJ1NpbmdsZS1kb21haW4gZ2l2ZXMgYSBjbGVhbiBhY2N1cmFjeSBiYXNlbGluZSBhbmQgY29udGFpbmFibGUgcmV2aWV3IGxvYWQuJyB9IH0sXG5cbiAgICAvLyBSaXNrc1xuICAgIHsga2V5OiAncmlza1F1YWxpdHknLCB0eXBlOiAncmlzaycsIHRpdGxlOiAnS25vd2xlZGdlIGFydGljbGUgcXVhbGl0eSB0b28gbG93IGZvciBncm91bmRlZCBhbnN3ZXJzJywgc3RhdHVzOiAnb3BlbicsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnam9obicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBsaWtlbGlob29kOiAnbWVkaXVtJywgaW1wYWN0OiAnaGlnaCcsIG1pdGlnYXRpb246ICdRdWFsaXR5IGF1ZGl0IG9mIHRoZSBwaWxvdCBkb21haW4gYmVmb3JlIGluZGV4aW5nOyBhcnRpY2xlIGNsZWFudXAgYmFja2xvZyB3aXRoIHRoZSBrbm93bGVkZ2UgdGVhbS4nIH0gfSxcbiAgICB7IGtleTogJ3Jpc2tBY2Nlc3MnLCB0eXBlOiAncmlzaycsIHRpdGxlOiAnQWNjZXNzIGFwcHJvdmFscyBzbGlwIGFuZCBzdGFsbCB0aGUgcGlwZWxpbmUgYnVpbGQnLCBzdGF0dXM6ICdtaXRpZ2F0aW5nJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdtYXJrJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IGxpa2VsaWhvb2Q6ICdoaWdoJywgaW1wYWN0OiAnaGlnaCcsIG1pdGlnYXRpb246ICdXZWVrbHkgZm9sbG93LXVwczsgbGVhZGVyc2hpcCBlc2NhbGF0aW9uIHBhdGggYWdyZWVkOyBidWlsZCBwaXBlbGluZSBhZ2FpbnN0IGV4cG9ydGVkIHNhbXBsZSBkYXRhIG1lYW53aGlsZS4nIH0gfSxcblxuICAgIC8vIEJsb2NrZXJzXG4gICAgeyBrZXk6ICdibGtBenVyZScsIHR5cGU6ICdibG9ja2VyJywgdGl0bGU6ICdDYW5ub3QgZ2VuZXJhdGUgYW5zd2VycyB1bnRpbCBBenVyZSBPcGVuQUkgaXMgcHJvdmlzaW9uZWQnLCBzdGF0dXM6ICdhY3RpdmUnLCBwcmlvcml0eTogJ3VyZ2VudCcsIG93bmVyOiAnbWFyaycsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyB3YWl0aW5nT246ICdDbG91ZCBwbGF0Zm9ybSB0ZWFtIC8gc2VjdXJpdHkgcmV2aWV3Jywgc2luY2U6ICcyMDI2LTA2LTIyJyB9IH0sXG5cbiAgICAvLyBNZWV0aW5nXG4gICAgeyBrZXk6ICdtdGdLaWNrb2ZmJywgdHlwZTogJ21lZXRpbmcnLCB0aXRsZTogJ1N1cHBvcnQgQUkga2lja29mZiB3aXRoIGtub3dsZWRnZSBsZWFkZXJzaGlwJywgc3RhdHVzOiAnc3VtbWFyaXplZCcsIG93bmVyOiAnam9obicsIGV4dHJhOiB7IGRhdGU6ICcyMDI2LTA2LTE4JywgdGltZTogJzEwOjAwIEFNJywgYXR0ZW5kZWVzOiBbJ0pvaG4nLCAnTWFyaycsICdBbGxlbicsICdHZW9yZ2UnXSwgcHVycG9zZTogJ0FsaWduIG9uIHBpbG90IHNjb3BlLCBhY2Nlc3MgbmVlZHMsIGFuZCBzdWNjZXNzIG1lYXN1cmVzLicsIGFnZW5kYTogJzEuIFZpc2lvbiAgMi4gUGlsb3Qgc2NvcGUgIDMuIEFjY2VzcyByZXF1ZXN0cyAgNC4gVGltZWxpbmUnIH0sIGJvZHlUZXh0OiAnQWdyZWVkIHRvIHNpbmdsZS1kb21haW4gcGlsb3QuIEFsbGVuIHRvIHNwb25zb3IgYWNjZXNzIHJlcXVlc3RzLiBTdWNjZXNzID0gZGVmbGVjdGlvbiByYXRlICsgYWdlbnQgc2F0aXNmYWN0aW9uLiBOZXh0IGNoZWNrLWluIGluIDQgd2Vla3MuJyB9LFxuXG4gICAgLy8gUXVlc3Rpb25zIC8gaWRlYXMgLyByZXNlYXJjaFxuICAgIHsga2V5OiAncU1ldHJpY3MnLCB0eXBlOiAncXVlc3Rpb24nLCB0aXRsZTogJ1doaWNoIGRlZmxlY3Rpb24gbWV0cmljIGRvZXMgc3VwcG9ydCBsZWFkZXJzaGlwIGFscmVhZHkgdHJ1c3Q/Jywgc3RhdHVzOiAnb3BlbicsIG93bmVyOiAnbWFyaycsIGV4dHJhOiB7fSB9LFxuICAgIHsga2V5OiAnaWRlYVRyaWFnZScsIHR5cGU6ICdpZGVhJywgdGl0bGU6ICdBdXRvLXRyaWFnZSBpbmJvdW5kIGNhc2VzIGJ5IGtub3dsZWRnZSBjb3ZlcmFnZScsIHN0YXR1czogJ2JhY2tsb2cnLCBvd25lcjogJ2pvaG4nLCBib2R5VGV4dDogJ0lmIHJldHJpZXZhbCBjb25maWRlbmNlIGlzIGhpZ2gsIHN1Z2dlc3QgS0ItZmlyc3QgcmVzcG9uc2UgYmVmb3JlIGh1bWFuIHRyaWFnZS4nIH0sXG4gICAgeyBrZXk6ICdyZXNSYWcnLCB0eXBlOiAncmVzZWFyY2gnLCB0aXRsZTogJ1JldHJpZXZhbCBzdHJhdGVneSBjb21wYXJpc29uOiBoeWJyaWQgdnMgcHVyZSB2ZWN0b3InLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIG93bmVyOiAnam9obicsIGJvZHlUZXh0OiAnRWFybHkgcmVzdWx0OiBoeWJyaWQgKEJNMjUgKyB2ZWN0b3IpIG5vdGljZWFibHkgYmV0dGVyIG9uIHByb2R1Y3QtY29kZSBxdWVyaWVzLicgfSxcbiAgXTtcblxuICBjb25zdCBjcmVhdGVkID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBzIG9mIGl0ZW1zKSB7XG4gICAgY29uc3QgaXRlbSA9IHN0b3JlLmNyZWF0ZUl0ZW0oe1xuICAgICAgdHlwZTogcy50eXBlLFxuICAgICAgdGl0bGU6IHMudGl0bGUsXG4gICAgICBzdGF0dXM6IHMuc3RhdHVzLFxuICAgICAgcHJpb3JpdHk6IHMucHJpb3JpdHkgPz8gJ25vbmUnLFxuICAgICAgb3duZXJJZDogcy5vd25lciA/PyBudWxsLFxuICAgICAgbWlsZXN0b25lSWQ6IHMubWlsZXN0b25lID8gbWlsZXN0b25lSWRbcy5taWxlc3RvbmVdIDogbnVsbCxcbiAgICAgIGR1ZURhdGU6IHMuZHVlRGF0ZSA/PyBudWxsLFxuICAgICAgdGFnczogcy50YWdzID8/IFtdLFxuICAgICAgZXh0cmE6IHMuZXh0cmEgPz8ge30sXG4gICAgICBsZWFkZXJzaGlwVmlzaWJsZTogcy5sZWFkZXJzaGlwVmlzaWJsZSA/IDEgOiAwLFxuICAgICAgYm9keVRleHQ6IHMuYm9keVRleHQgPz8gJycsXG4gICAgICBib2R5OiBzLmJvZHlUZXh0ID8gdGV4dERvYyhzLmJvZHlUZXh0KSA6ICcnLFxuICAgICAgc2FtcGxlOiAxLFxuICAgIH0pO1xuICAgIGNyZWF0ZWQuc2V0KHMua2V5LCBpdGVtLmlkKTtcbiAgfVxuXG4gIGNvbnN0IGxpbmsgPSAoYTogc3RyaW5nLCBiOiBzdHJpbmcsIGtpbmQ6IFBhcmFtZXRlcnM8U3RvcmVbJ2FkZExpbmsnXT5bMl0pID0+IHtcbiAgICBjb25zdCBmcm9tSWQgPSBjcmVhdGVkLmdldChhKTtcbiAgICBjb25zdCB0b0lkID0gY3JlYXRlZC5nZXQoYik7XG4gICAgaWYgKGZyb21JZCAmJiB0b0lkKSBzdG9yZS5hZGRMaW5rKGZyb21JZCwgdG9JZCwga2luZCk7XG4gIH07XG5cbiAgbGluaygndGFza0NsZWFuJywgJ2ZlYXRJbmdlc3QnLCAnaW1wbGVtZW50cycpO1xuICBsaW5rKCd0YXNrRXhwb3J0JywgJ2ZlYXRJbmdlc3QnLCAnaW1wbGVtZW50cycpO1xuICBsaW5rKCdyZXFDaXRhdGlvbnMnLCAnZmVhdEFuc3dlcicsICdzdXBwb3J0cycpO1xuICBsaW5rKCdyZXFQSEknLCAnZmVhdEFuc3dlcicsICdzdXBwb3J0cycpO1xuICBsaW5rKCdyZXFGcmVzaG5lc3MnLCAnZmVhdEluZ2VzdCcsICdzdXBwb3J0cycpO1xuICBsaW5rKCdmZWF0QW5zd2VyJywgJ2RlY1RlbmFudCcsICdzaGFwZWRfYnknKTtcbiAgbGluaygnZmVhdEFuc3dlcicsICdhY2NBenVyZScsICdyZXF1aXJlc19hY2Nlc3MnKTtcbiAgbGluaygnZmVhdEluZ2VzdCcsICdhY2NTZkFwaScsICdyZXF1aXJlc19hY2Nlc3MnKTtcbiAgbGluaygnYmxrQXp1cmUnLCAnZmVhdEFuc3dlcicsICdibG9ja3MnKTtcbiAgbGluaygnZGVjRG9tYWluJywgJ210Z0tpY2tvZmYnLCAnZGlzY3Vzc2VkX2luJyk7XG4gIGxpbmsoJ3Jpc2tBY2Nlc3MnLCAnYWNjQXp1cmUnLCAncmVsYXRlcycpO1xuXG4gIHJldHVybiBpdGVtcy5sZW5ndGg7XG59XG5cbi8qKiBNaW5pbWFsIHJpY2gtZG9jIHdyYXBwZXIgZm9yIHNlZWQgYm9keSB0ZXh0IChvbmUgcGFyYWdyYXBoKS4gKi9cbmZ1bmN0aW9uIHRleHREb2ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHsgdHlwZTogJ2RvYycsIGNvbnRlbnQ6IFt7IHR5cGU6ICdwYXJhZ3JhcGgnLCBjb250ZW50OiBbeyB0eXBlOiAndGV4dCcsIHRleHQgfV0gfV0gfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAi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Q0FBQyxRQUFRLENBQUM7QUFDakMsUUFBTSxPQUFPLEVBQUUsTUFBTSxRQUFRLE1BQU07QUFDbkMsZ0JBQUFBLFFBQU8sR0FBRyxNQUFNLGNBQWM7QUFDOUIsZ0JBQUFBLFFBQU8sTUFBTSxLQUFNLFFBQVEsZUFBZSxtQ0FBbUM7QUFHN0UsUUFBTSxRQUFRO0FBQ2QsSUFBRSxNQUFNLGVBQWU7QUFBQSxJQUNyQixFQUFFLEdBQUcsT0FBTyxNQUFNLFlBQVksVUFBVSxPQUFPLFFBQVEsVUFBbUIsU0FBUyxJQUFJLFNBQVMsQ0FBQyxFQUFFO0FBQUEsRUFDckcsQ0FBQztBQUNELElBQUUsTUFBTSxlQUFlO0FBQUEsSUFDckI7QUFBQSxNQUFFLEdBQUc7QUFBQSxNQUFVLE1BQU07QUFBQSxNQUFlLFVBQVU7QUFBQSxNQUFPLFNBQVM7QUFBQSxNQUM1RCxTQUFTLEVBQUUsUUFBUSxFQUFFLEdBQUksU0FBUyxRQUFRLFFBQW9DLElBQUksT0FBTyxPQUFPLFdBQVcsRUFBRTtBQUFBLElBQUU7QUFBQSxFQUNuSCxDQUFDO0FBQ0QsZ0JBQUFBLFFBQU8sTUFBTSxFQUFFLE1BQU0sUUFBUSxLQUFLLEdBQUcsTUFBTSxrREFBa0Q7QUFFN0YsSUFBRSxJQUFJLEdBQUcsTUFBTTtBQUNqQixDQUFDOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImZzIiwgInBhdGgiLCAiRGF0YWJhc2UiLCAiY3J5cHRvIiwgImltcG9ydF9ub2RlX2NyeXB0byIsICJjcnlwdG8iLCAiaXRlbSIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImZzIiwgInBhdGgiLCAidG1wIiwgImZzIiwgInBhdGgiLCAib3MiLCAiYXNzZXJ0Il0KfQo=
