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
  }
];

// electron/db/db.ts
function openDatabase(dataDir) {
  import_node_fs.default.mkdirSync(dataDir, { recursive: true });
  const dbPath = import_node_path.default.join(dataDir, "keystone.db");
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
    this.logActivity(id, archived ? "archived" : "restored");
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
    this.db.prepare("UPDATE saved_views SET deleted=1 WHERE id=?").run(id);
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
        this.applyRemoteOp(op);
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
      for (const f of Object.keys(record)) this.setFieldClock("item", item.id, f, op.lamport, op.deviceId);
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
    for (const f of Object.keys(record)) this.setFieldClock(op.entity, op.entityId, f, op.lamport, op.deviceId);
  }
  applyRemoteSet(op) {
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
        this.applyItemFields(String(row.entity_id), { [field]: value, updatedAt: this.now(), updatedBy: this.actorId });
        this.localSet("item", String(row.entity_id), { [field]: value, updatedAt: this.now(), updatedBy: this.actorId });
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
      this.state = "idle";
      this.timer = setInterval(() => void this.cycle(), POLL_INTERVAL_MS);
      void this.cycle();
    } else {
      this.state = "disabled";
      this.emitStatus();
    }
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
    for (const b of batches) {
      let ops;
      try {
        ops = await this.transport.fetchBatch(b.deviceId, b.fileName);
      } catch {
        continue;
      }
      this.store.applyRemoteOps(ops);
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
  const existing = store.listItems({ sample: true, archived: void 0 }, { field: "createdAt", dir: "asc" }, 1);
  if (existing.length > 0) return 0;
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
  const p = import_node_fs3.default.mkdtempSync(import_node_path3.default.join(import_node_os.default.tmpdir(), `keystone-${name}-`));
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
  const dbPath = import_node_path3.default.join(dir, "keystone.db");
  const fd = import_node_fs3.default.openSync(dbPath, "r+");
  import_node_fs3.default.writeSync(fd, Buffer.from("GARBAGEGARBAGEGARBAGE"), 0, 21, 0);
  import_node_fs3.default.closeSync(fd);
  import_strict.default.throws(() => openDatabase(dir), /integrity|malformed|not a database/i);
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vdGVzdHMvY29yZS50ZXN0LnRzIiwgIi4uL2VsZWN0cm9uL2RiL2RiLnRzIiwgIi4uL2VsZWN0cm9uL2RiL21pZ3JhdGlvbnMudHMiLCAiLi4vZWxlY3Ryb24vZGIvc3RvcmUudHMiLCAiLi4vc2hhcmVkL3R5cGVzLnRzIiwgIi4uL2VsZWN0cm9uL3N5bmMvdHJhbnNwb3J0LnRzIiwgIi4uL2VsZWN0cm9uL3N5bmMvZW5naW5lLnRzIiwgIi4uL2VsZWN0cm9uL2RiL3NlZWQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIENvcmUgZGF0YS1sYXllciArIHN5bmMgdGVzdHMuIFJ1biB3aXRoOiBucG0gdGVzdFxuLy8gKGJ1bmRsZWQgYnkgc2NyaXB0cy9ydW4tdGVzdHMubWpzIGFuZCBleGVjdXRlZCB1bmRlciBFbGVjdHJvbidzIE5vZGUgdmlhIEVMRUNUUk9OX1JVTl9BU19OT0RFXG4vLyAgc28gYmV0dGVyLXNxbGl0ZTMncyBFbGVjdHJvbi1BQkkgYnVpbGQgbG9hZHMuKVxuXG5pbXBvcnQgeyB0ZXN0IH0gZnJvbSAnbm9kZTp0ZXN0JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnbm9kZTphc3NlcnQvc3RyaWN0JztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgb3MgZnJvbSAnbm9kZTpvcyc7XG5pbXBvcnQgeyBvcGVuRGF0YWJhc2UsIHR5cGUgRGJDb250ZXh0IH0gZnJvbSAnLi4vZWxlY3Ryb24vZGIvZGInO1xuaW1wb3J0IHsgU3RvcmUgfSBmcm9tICcuLi9lbGVjdHJvbi9kYi9zdG9yZSc7XG5pbXBvcnQgeyBGb2xkZXJUcmFuc3BvcnQgfSBmcm9tICcuLi9lbGVjdHJvbi9zeW5jL3RyYW5zcG9ydCc7XG5pbXBvcnQgeyBTeW5jRW5naW5lIH0gZnJvbSAnLi4vZWxlY3Ryb24vc3luYy9lbmdpbmUnO1xuaW1wb3J0IHsgbG9hZFNlZWREYXRhIH0gZnJvbSAnLi4vZWxlY3Ryb24vZGIvc2VlZCc7XG5cbmZ1bmN0aW9uIHRtcChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwID0gZnMubWtkdGVtcFN5bmMocGF0aC5qb2luKG9zLnRtcGRpcigpLCBga2V5c3RvbmUtJHtuYW1lfS1gKSk7XG4gIHJldHVybiBwO1xufVxuXG5mdW5jdGlvbiBta1N0b3JlKG5hbWU6IHN0cmluZywgYWN0b3I6IHN0cmluZyk6IHsgY3R4OiBEYkNvbnRleHQ7IHN0b3JlOiBTdG9yZSB9IHtcbiAgY29uc3QgY3R4ID0gb3BlbkRhdGFiYXNlKHRtcChuYW1lKSk7XG4gIGNvbnN0IHN0b3JlID0gbmV3IFN0b3JlKGN0eCwgYWN0b3IpO1xuICByZXR1cm4geyBjdHgsIHN0b3JlIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN5bmNCb3RoKGE6IHsgc3RvcmU6IFN0b3JlIH0sIGI6IHsgc3RvcmU6IFN0b3JlIH0sIGZvbGRlcjogc3RyaW5nLCB1c2VyQSA9ICdKb2huJywgdXNlckIgPSAnTWFyaycpIHtcbiAgY29uc3QgZWEgPSBuZXcgU3luY0VuZ2luZShhLnN0b3JlLCB1c2VyQSwgKCkgPT4ge30pO1xuICBjb25zdCBlYiA9IG5ldyBTeW5jRW5naW5lKGIuc3RvcmUsIHVzZXJCLCAoKSA9PiB7fSk7XG4gIGVhLnNldFRyYW5zcG9ydChuZXcgRm9sZGVyVHJhbnNwb3J0KGZvbGRlcikpO1xuICBlYi5zZXRUcmFuc3BvcnQobmV3IEZvbGRlclRyYW5zcG9ydChmb2xkZXIpKTtcbiAgLy8gVHdvIGN5Y2xlcyBlYWNoIHNvIHJlbnVtYmVyLXJlYnJvYWRjYXN0cyBhbmQgY3Jvc3MtaW1wb3J0cyBzZXR0bGUuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgYXdhaXQgZWEuY3ljbGUoKTtcbiAgICBhd2FpdCBlYi5jeWNsZSgpO1xuICB9XG4gIGF3YWl0IGVhLnN0b3AoKTtcbiAgYXdhaXQgZWIuc3RvcCgpO1xufVxuXG50ZXN0KCdtaWdyYXRpb25zIGNyZWF0ZSBzY2hlbWEgYW5kIGRldmljZSBpZGVudGl0eScsICgpID0+IHtcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdtaWcnLCAnam9obicpO1xuICBhc3NlcnQub2soY3R4LmRldmljZUlkLmxlbmd0aCA+IDEwKTtcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmxpc3RJdGVtcygpLmxlbmd0aCwgMCk7XG4gIGN0eC5kYi5jbG9zZSgpO1xufSk7XG5cbnRlc3QoJ2l0ZW0gQ1JVRCwgaWRlbnQgYWxsb2NhdGlvbiwgYWN0aXZpdHksIHNlYXJjaCcsICgpID0+IHtcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdjcnVkJywgJ2pvaG4nKTtcbiAgY29uc3QgaXRlbSA9IHN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ0Fuc3dlcnMgbXVzdCBjaXRlIHNvdXJjZXMnIH0pO1xuICBhc3NlcnQuZXF1YWwoaXRlbS5pZGVudCwgJ1JFUS0xJyk7XG4gIGFzc2VydC5lcXVhbChpdGVtLnN0YXR1cywgJ2JhY2tsb2cnKTtcblxuICBjb25zdCBzZWNvbmQgPSBzdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3JlcXVpcmVtZW50JywgdGl0bGU6ICdBbm90aGVyIHJlcXVpcmVtZW50JyB9KTtcbiAgYXNzZXJ0LmVxdWFsKHNlY29uZC5pZGVudCwgJ1JFUS0yJyk7XG5cbiAgc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICdoaWdoJyB9KTtcbiAgY29uc3QgZ290ID0gc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSE7XG4gIGFzc2VydC5lcXVhbChnb3Quc3RhdHVzLCAnaW5fcHJvZ3Jlc3MnKTtcbiAgYXNzZXJ0LmVxdWFsKGdvdC5wcmlvcml0eSwgJ2hpZ2gnKTtcblxuICAvLyBkb25lIFx1MjE5MiBjb21wbGV0ZWRBdCBzZXRcbiAgc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHN0YXR1czogJ2RvbmUnIH0pO1xuICBhc3NlcnQub2soc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEuY29tcGxldGVkQXQpO1xuXG4gIC8vIHNlYXJjaCBoaXRzIHRpdGxlXG4gIGNvbnN0IHJlc3VsdHMgPSBzdG9yZS5zZWFyY2goJ2NpdGUgc291cmNlcycpO1xuICBhc3NlcnQub2socmVzdWx0cy5zb21lKChyKSA9PiByLml0ZW0uaWQgPT09IGl0ZW0uaWQpKTtcblxuICAvLyBieSBpZGVudFxuICBhc3NlcnQuZXF1YWwoc3RvcmUuZ2V0SXRlbUJ5SWRlbnQoJ3JlcS0xJykhLmlkLCBpdGVtLmlkKTtcblxuICBjb25zdCBhY3Rpdml0eSA9IHN0b3JlLmFjdGl2aXR5Rm9yKGl0ZW0uaWQpIGFzIHsga2luZDogc3RyaW5nIH1bXTtcbiAgYXNzZXJ0Lm9rKGFjdGl2aXR5LnNvbWUoKGEpID0+IGEua2luZCA9PT0gJ2NyZWF0ZWQnKSk7XG4gIGFzc2VydC5vayhhY3Rpdml0eS5zb21lKChhKSA9PiBhLmtpbmQgPT09ICd1cGRhdGVkJykpO1xuXG4gIC8vIGRlbGV0ZSBoaWRlcyBmcm9tIHF1ZXJpZXNcbiAgc3RvcmUuZGVsZXRlSXRlbShzZWNvbmQuaWQpO1xuICBhc3NlcnQuZXF1YWwoc3RvcmUuZ2V0SXRlbShzZWNvbmQuaWQpLCBudWxsKTtcbiAgY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnbGlua3MsIGNvbW1lbnRzLCB2ZXJzaW9ucycsICgpID0+IHtcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdyZWwnLCAnam9obicpO1xuICBjb25zdCBhID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdCdWlsZCBleHBvcnQnIH0pO1xuICBjb25zdCBiID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdmZWF0dXJlJywgdGl0bGU6ICdJbmdlc3Rpb24gcGlwZWxpbmUnIH0pO1xuICBzdG9yZS5hZGRMaW5rKGEuaWQsIGIuaWQsICdpbXBsZW1lbnRzJyk7XG4gIGNvbnN0IGxpbmtzID0gc3RvcmUubGlua3NGb3IoYS5pZCk7XG4gIGFzc2VydC5lcXVhbChsaW5rcy5sZW5ndGgsIDEpO1xuICBhc3NlcnQuZXF1YWwobGlua3NbMF0ub3RoZXIuaWQsIGIuaWQpO1xuICBhc3NlcnQuZXF1YWwobGlua3NbMF0uZGlyZWN0aW9uLCAnb3V0Jyk7XG5cbiAgc3RvcmUuYWRkQ29tbWVudChhLmlkLCAne1widHlwZVwiOlwiZG9jXCJ9JywgJ2xvb2tzIGdvb2QnKTtcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmNvbW1lbnRzRm9yKGEuaWQpLmxlbmd0aCwgMSk7XG5cbiAgc3RvcmUuc2F2ZVZlcnNpb24oYS5pZCk7XG4gIHN0b3JlLnVwZGF0ZUl0ZW0oYS5pZCwgeyB0aXRsZTogJ0J1aWxkIGV4cG9ydCB2MicgfSk7XG4gIGNvbnN0IHZlcnNpb25zID0gc3RvcmUudmVyc2lvbnNGb3IoYS5pZCkgYXMgeyB0aXRsZTogc3RyaW5nIH1bXTtcbiAgYXNzZXJ0LmVxdWFsKHZlcnNpb25zLmxlbmd0aCwgMSk7XG4gIGFzc2VydC5lcXVhbCh2ZXJzaW9uc1swXS50aXRsZSwgJ0J1aWxkIGV4cG9ydCcpO1xuICBjdHguZGIuY2xvc2UoKTtcbn0pO1xuXG50ZXN0KCdzeW5jOiB0d28gZGV2aWNlcyBjb252ZXJnZSB0aHJvdWdoIGEgc2hhcmVkIGZvbGRlcicsIGFzeW5jICgpID0+IHtcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ3N5bmNBJywgJ2pvaG4nKTtcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ3N5bmNCJywgJ21hcmsnKTtcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWQnKTtcblxuICBjb25zdCBpdGVtQSA9IGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdGcm9tIEpvaG4nIH0pO1xuICBjb25zdCBpdGVtQiA9IGIuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdkZWNpc2lvbicsIHRpdGxlOiAnRnJvbSBNYXJrJyB9KTtcblxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuXG4gIGFzc2VydC5vayhiLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpLCAnQiByZWNlaXZlZCBBIGl0ZW0nKTtcbiAgYXNzZXJ0Lm9rKGEuc3RvcmUuZ2V0SXRlbShpdGVtQi5pZCksICdBIHJlY2VpdmVkIEIgaXRlbScpO1xuICBhc3NlcnQuZXF1YWwoYi5zdG9yZS5nZXRJdGVtKGl0ZW1BLmlkKSEudGl0bGUsICdGcm9tIEpvaG4nKTtcblxuICAvLyBFZGl0IG9uIEIgcHJvcGFnYXRlcyB0byBBXG4gIGIuc3RvcmUudXBkYXRlSXRlbShpdGVtQS5pZCwgeyBzdGF0dXM6ICdpbl9wcm9ncmVzcycgfSk7XG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XG4gIGFzc2VydC5lcXVhbChhLnN0b3JlLmdldEl0ZW0oaXRlbUEuaWQpIS5zdGF0dXMsICdpbl9wcm9ncmVzcycpO1xuXG4gIGEuY3R4LmRiLmNsb3NlKCk7XG4gIGIuY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnc3luYzogY29uY3VycmVudCB0aXRsZSBlZGl0cyBzdXJmYWNlIGEgY29uZmxpY3QsIExXVyBhcHBsaWVzLCByZXNvbHV0aW9uIGNvbnZlcmdlcycsIGFzeW5jICgpID0+IHtcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ2NvbmZBJywgJ2pvaG4nKTtcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ2NvbmZCJywgJ21hcmsnKTtcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRjJyk7XG5cbiAgY29uc3QgaXRlbSA9IGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdPcmlnaW5hbCcgfSk7XG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XG4gIGFzc2VydC5vayhiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkpO1xuXG4gIC8vIEJvdGggZWRpdCB0aGUgdGl0bGUgd2hpbGUgXCJvZmZsaW5lXCIgKG5vIHN5bmMgYmV0d2VlbiBlZGl0cykuXG4gIGEuc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHRpdGxlOiAnSm9obiB2ZXJzaW9uJyB9KTtcbiAgYi5zdG9yZS51cGRhdGVJdGVtKGl0ZW0uaWQsIHsgdGl0bGU6ICdNYXJrIHZlcnNpb24nIH0pO1xuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuXG4gIC8vIEJvdGggc2lkZXMgc2hvdyB0aGUgc2FtZSBMV1cgd2lubmVyLlxuICBjb25zdCB0YSA9IGEuc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEudGl0bGU7XG4gIGNvbnN0IHRiID0gYi5zdG9yZS5nZXRJdGVtKGl0ZW0uaWQpIS50aXRsZTtcbiAgYXNzZXJ0LmVxdWFsKHRhLCB0YiwgJ0xXVyBjb252ZXJnZWQnKTtcblxuICAvLyBBdCBsZWFzdCBvbmUgc2lkZSByZWNvcmRlZCBhIGNvbmZsaWN0IGZvciByZXZpZXcuXG4gIGNvbnN0IGNvbmZsaWN0cyA9IFsuLi5hLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSksIC4uLmIuc3RvcmUubGlzdENvbmZsaWN0cyh0cnVlKV07XG4gIGFzc2VydC5vayhjb25mbGljdHMubGVuZ3RoID49IDEsICdjb25mbGljdCBzdXJmYWNlZCcpO1xuICBhc3NlcnQub2soY29uZmxpY3RzLnNvbWUoKGMpID0+IGMuZmllbGQgPT09ICd0aXRsZScpKTtcblxuICAvLyBSZXNvbHZpbmcgd2l0aCBhIG1lcmdlZCB2YWx1ZSBwcm9wYWdhdGVzLlxuICBjb25zdCBzaWRlID0gYS5zdG9yZS5saXN0Q29uZmxpY3RzKHRydWUpLmxlbmd0aCA/IGEgOiBiO1xuICBjb25zdCBjb25mbGljdCA9IHNpZGUuc3RvcmUubGlzdENvbmZsaWN0cyh0cnVlKVswXTtcbiAgc2lkZS5zdG9yZS5yZXNvbHZlQ29uZmxpY3QoY29uZmxpY3QuaWQsICdtZXJnZWQnLCAnTWVyZ2VkIHRpdGxlJyk7XG4gIGF3YWl0IHN5bmNCb3RoKGEsIGIsIGZvbGRlcik7XG4gIGFzc2VydC5lcXVhbChhLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlLCAnTWVyZ2VkIHRpdGxlJyk7XG4gIGFzc2VydC5lcXVhbChiLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlLCAnTWVyZ2VkIHRpdGxlJyk7XG5cbiAgYS5jdHguZGIuY2xvc2UoKTtcbiAgYi5jdHguZGIuY2xvc2UoKTtcbn0pO1xuXG50ZXN0KCdzeW5jOiBpZGVudCBjb2xsaXNpb24gcmVudW1iZXJzIGFuZCBjb252ZXJnZXMnLCBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IGEgPSBta1N0b3JlKCdpZEEnLCAnam9obicpO1xuICBjb25zdCBiID0gbWtTdG9yZSgnaWRCJywgJ21hcmsnKTtcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRpJyk7XG5cbiAgLy8gQm90aCBjcmVhdGUgVEFTSy0xIG9mZmxpbmUuXG4gIGNvbnN0IGlhID0gYS5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0EgdGFzaycgfSk7XG4gIGNvbnN0IGliID0gYi5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0IgdGFzaycgfSk7XG4gIGFzc2VydC5lcXVhbChpYS5pZGVudCwgJ1RBU0stMScpO1xuICBhc3NlcnQuZXF1YWwoaWIuaWRlbnQsICdUQVNLLTEnKTtcblxuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpOyAvLyBleHRyYSByb3VuZHMgdG8gc2V0dGxlIHJlbnVtYmVyIGJyb2FkY2FzdHNcblxuICBjb25zdCBhSWRlbnRzID0gW2Euc3RvcmUuZ2V0SXRlbShpYS5pZCkhLmlkZW50LCBhLnN0b3JlLmdldEl0ZW0oaWIuaWQpIS5pZGVudF0uc29ydCgpO1xuICBjb25zdCBiSWRlbnRzID0gW2Iuc3RvcmUuZ2V0SXRlbShpYS5pZCkhLmlkZW50LCBiLnN0b3JlLmdldEl0ZW0oaWIuaWQpIS5pZGVudF0uc29ydCgpO1xuICBhc3NlcnQubm90RXF1YWwoYUlkZW50c1swXSwgYUlkZW50c1sxXSwgJ2lkZW50cyB1bmlxdWUgb24gQScpO1xuICBhc3NlcnQubm90RXF1YWwoYklkZW50c1swXSwgYklkZW50c1sxXSwgJ2lkZW50cyB1bmlxdWUgb24gQicpO1xuICBhc3NlcnQuZGVlcEVxdWFsKGFJZGVudHMsIGJJZGVudHMsICdib3RoIHNpZGVzIGFncmVlIG9uIGlkZW50cycpO1xuXG4gIGEuY3R4LmRiLmNsb3NlKCk7XG4gIGIuY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnc3luYzogb2ZmbGluZSBlZGl0cyBxdWV1ZSBhbmQgZmx1c2ggd2hlbiBmb2xkZXIgcmV0dXJucycsIGFzeW5jICgpID0+IHtcbiAgY29uc3QgYSA9IG1rU3RvcmUoJ29mZkEnLCAnam9obicpO1xuICBjb25zdCBmb2xkZXIgPSB0bXAoJ3NoYXJlZG8nKTtcbiAgY29uc3QgZW5naW5lID0gbmV3IFN5bmNFbmdpbmUoYS5zdG9yZSwgJ0pvaG4nLCAoKSA9PiB7fSk7XG5cbiAgYS5zdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ01hZGUgb2ZmbGluZScgfSk7XG4gIGFzc2VydC5vayhlbmdpbmUuc3RhdHVzKCkucGVuZGluZ09wcyA+IDAgfHwgZW5naW5lLnN0YXR1cygpLnN0YXRlID09PSAnZGlzYWJsZWQnKTtcblxuICBlbmdpbmUuc2V0VHJhbnNwb3J0KG5ldyBGb2xkZXJUcmFuc3BvcnQoZm9sZGVyKSk7XG4gIGF3YWl0IGVuZ2luZS5jeWNsZSgpO1xuICBhc3NlcnQuZXF1YWwoZW5naW5lLnN0YXR1cygpLnBlbmRpbmdPcHMsIDAsICdvcHMgZXhwb3J0ZWQgYWZ0ZXIgdHJhbnNwb3J0IGF0dGFjaGVkJyk7XG4gIGF3YWl0IGVuZ2luZS5zdG9wKCk7XG4gIGEuY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnc2VlZCBkYXRhIGxvYWRzLCBpcyBmbGFnZ2VkLCBhbmQgcmVtb3ZlcyBjbGVhbmx5JywgKCkgPT4ge1xuICBjb25zdCB7IGN0eCwgc3RvcmUgfSA9IG1rU3RvcmUoJ3NlZWQnLCAnam9obicpO1xuICBjb25zdCBuID0gbG9hZFNlZWREYXRhKHN0b3JlKTtcbiAgYXNzZXJ0Lm9rKG4gPiAxNSk7XG4gIGNvbnN0IHNhbXBsZXMgPSBzdG9yZS5saXN0SXRlbXMoeyBzYW1wbGU6IHRydWUgfSwgeyBmaWVsZDogJ2NyZWF0ZWRBdCcsIGRpcjogJ2FzYycgfSwgMTAwKTtcbiAgYXNzZXJ0LmVxdWFsKHNhbXBsZXMubGVuZ3RoLCBuKTtcbiAgLy8gbGlua3MgZXhpc3RcbiAgY29uc3Qgd2l0aExpbmtzID0gc2FtcGxlcy5maWx0ZXIoKHMpID0+IHN0b3JlLmxpbmtzRm9yKHMuaWQpLmxlbmd0aCA+IDApO1xuICBhc3NlcnQub2sod2l0aExpbmtzLmxlbmd0aCA+IDUpO1xuXG4gIGNvbnN0IHJlbW92ZWQgPSBzdG9yZS5yZW1vdmVTYW1wbGVEYXRhKCk7XG4gIGFzc2VydC5lcXVhbChyZW1vdmVkLCBuKTtcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmxpc3RJdGVtcyh7fSwgeyBmaWVsZDogJ2NyZWF0ZWRBdCcsIGRpcjogJ2FzYycgfSwgMTAwKS5sZW5ndGgsIDApO1xuICBjdHguZGIuY2xvc2UoKTtcbn0pO1xuXG50ZXN0KCdkYXRhYmFzZSBpbnRlZ3JpdHkgZ3VhcmQgcXVhcmFudGluZXMgY29ycnVwdGlvbicsICgpID0+IHtcbiAgY29uc3QgZGlyID0gdG1wKCdjb3JydXB0Jyk7XG4gIGNvbnN0IGN0eCA9IG9wZW5EYXRhYmFzZShkaXIpO1xuICBjdHguZGIuY2xvc2UoKTtcbiAgLy8gU3RvbXAgdGhlIGZpbGUgaGVhZGVyLlxuICBjb25zdCBkYlBhdGggPSBwYXRoLmpvaW4oZGlyLCAna2V5c3RvbmUuZGInKTtcbiAgY29uc3QgZmQgPSBmcy5vcGVuU3luYyhkYlBhdGgsICdyKycpO1xuICBmcy53cml0ZVN5bmMoZmQsIEJ1ZmZlci5mcm9tKCdHQVJCQUdFR0FSQkFHRUdBUkJBR0UnKSwgMCwgMjEsIDApO1xuICBmcy5jbG9zZVN5bmMoZmQpO1xuICBhc3NlcnQudGhyb3dzKCgpID0+IG9wZW5EYXRhYmFzZShkaXIpLCAvaW50ZWdyaXR5fG1hbGZvcm1lZHxub3QgYSBkYXRhYmFzZS9pKTtcbn0pO1xuIiwgImltcG9ydCBEYXRhYmFzZSBmcm9tICdiZXR0ZXItc3FsaXRlMyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IGNyeXB0byBmcm9tICdub2RlOmNyeXB0byc7XG5pbXBvcnQgeyBNSUdSQVRJT05TIH0gZnJvbSAnLi9taWdyYXRpb25zJztcblxuZXhwb3J0IHR5cGUgREIgPSBEYXRhYmFzZS5EYXRhYmFzZTtcblxuZXhwb3J0IGludGVyZmFjZSBEYkNvbnRleHQge1xuICBkYjogREI7XG4gIGRldmljZUlkOiBzdHJpbmc7XG4gIGRhdGFEaXI6IHN0cmluZztcbiAgZGJQYXRoOiBzdHJpbmc7XG59XG5cbi8qKlxuICogT3BlbnMgKG9yIGNyZWF0ZXMpIHRoZSBLZXlzdG9uZSBkYXRhYmFzZSwgYXBwbGllcyBwZW5kaW5nIG1pZ3JhdGlvbnMsXG4gKiBhbmQgZ3VhcmFudGVlcyBkZXZpY2UgaWRlbnRpdHkgbWV0YWRhdGEuXG4gKlxuICogU2FmZXR5IHBvc3R1cmU6IFdBTCBtb2RlICsgaW50ZWdyaXR5IGNoZWNrIG9uIG9wZW4gKyB0aW1lc3RhbXBlZCBiYWNrdXBcbiAqIGJlZm9yZSBhbnkgbWlncmF0aW9uIGJleW9uZCB2ZXJzaW9uIDAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvcGVuRGF0YWJhc2UoZGF0YURpcjogc3RyaW5nKTogRGJDb250ZXh0IHtcbiAgZnMubWtkaXJTeW5jKGRhdGFEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICBjb25zdCBkYlBhdGggPSBwYXRoLmpvaW4oZGF0YURpciwgJ2tleXN0b25lLmRiJyk7XG4gIGNvbnN0IGV4aXN0ZWQgPSBmcy5leGlzdHNTeW5jKGRiUGF0aCk7XG5cbiAgY29uc3QgZGIgPSBuZXcgRGF0YWJhc2UoZGJQYXRoKTtcbiAgZGIucHJhZ21hKCdqb3VybmFsX21vZGUgPSBXQUwnKTtcbiAgZGIucHJhZ21hKCdmb3JlaWduX2tleXMgPSBPTicpO1xuICBkYi5wcmFnbWEoJ3N5bmNocm9ub3VzID0gTk9STUFMJyk7XG5cbiAgaWYgKGV4aXN0ZWQpIHtcbiAgICBjb25zdCBjaGVjayA9IGRiLnByYWdtYSgncXVpY2tfY2hlY2snLCB7IHNpbXBsZTogdHJ1ZSB9KTtcbiAgICBpZiAoY2hlY2sgIT09ICdvaycpIHtcbiAgICAgIC8vIFByZXNlcnZlIHRoZSBkYW1hZ2VkIGZpbGUgZm9yIHJlY292ZXJ5IGFuZCBmYWlsIGxvdWRseSBcdTIwMTQgbmV2ZXIgcnVuIG9uIGEgY29ycnVwdCBkYi5cbiAgICAgIGNvbnN0IHF1YXJhbnRpbmUgPSBkYlBhdGggKyAnLmNvcnJ1cHQtJyArIERhdGUubm93KCk7XG4gICAgICBkYi5jbG9zZSgpO1xuICAgICAgZnMuY29weUZpbGVTeW5jKGRiUGF0aCwgcXVhcmFudGluZSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBEYXRhYmFzZSBmYWlsZWQgaW50ZWdyaXR5IGNoZWNrICgke2NoZWNrfSkuIERhbWFnZWQgY29weSBwcmVzZXJ2ZWQgYXQgJHtxdWFyYW50aW5lfS4gYCArXG4gICAgICAgICAgJ1Jlc3RvcmUgZnJvbSBhIGJhY2t1cCBpbiB0aGUgYmFja3Vwcy8gZm9sZGVyLicsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5TWlncmF0aW9ucyhkYiwgZGF0YURpciwgZGJQYXRoLCBleGlzdGVkKTtcblxuICBjb25zdCBkZXZpY2VJZCA9IGVuc3VyZU1ldGEoZGIsICdkZXZpY2VfaWQnLCAoKSA9PiBjcnlwdG8ucmFuZG9tVVVJRCgpKTtcbiAgZW5zdXJlTWV0YShkYiwgJ3Byb2plY3RfaWQnLCAoKSA9PiBjcnlwdG8ucmFuZG9tVVVJRCgpKTtcblxuICByZXR1cm4geyBkYiwgZGV2aWNlSWQsIGRhdGFEaXIsIGRiUGF0aCB9O1xufVxuXG5mdW5jdGlvbiBhcHBseU1pZ3JhdGlvbnMoZGI6IERCLCBkYXRhRGlyOiBzdHJpbmcsIGRiUGF0aDogc3RyaW5nLCBleGlzdGVkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGhhc01ldGEgPSBkYlxuICAgIC5wcmVwYXJlKFwiU0VMRUNUIENPVU5UKCopIEFTIGMgRlJPTSBzcWxpdGVfbWFzdGVyIFdIRVJFIHR5cGU9J3RhYmxlJyBBTkQgbmFtZT0nbWV0YSdcIilcbiAgICAuZ2V0KCkgYXMgeyBjOiBudW1iZXIgfTtcbiAgbGV0IHZlcnNpb24gPSAwO1xuICBpZiAoaGFzTWV0YS5jID4gMCkge1xuICAgIGNvbnN0IHJvdyA9IGRiLnByZXBhcmUoXCJTRUxFQ1QgdmFsdWUgRlJPTSBtZXRhIFdIRVJFIGtleT0nc2NoZW1hX3ZlcnNpb24nXCIpLmdldCgpIGFzXG4gICAgICB8IHsgdmFsdWU6IHN0cmluZyB9XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICB2ZXJzaW9uID0gcm93ID8gTnVtYmVyKHJvdy52YWx1ZSkgOiAwO1xuICB9XG5cbiAgY29uc3QgcGVuZGluZyA9IE1JR1JBVElPTlMuZmlsdGVyKChtKSA9PiBtLnZlcnNpb24gPiB2ZXJzaW9uKTtcbiAgaWYgKHBlbmRpbmcubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgaWYgKGV4aXN0ZWQgJiYgdmVyc2lvbiA+IDApIHtcbiAgICBjb25zdCBiYWNrdXBEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ2JhY2t1cHMnKTtcbiAgICBmcy5ta2RpclN5bmMoYmFja3VwRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zdCBzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyk7XG4gICAgZnMuY29weUZpbGVTeW5jKGRiUGF0aCwgcGF0aC5qb2luKGJhY2t1cERpciwgYHByZS1taWdyYXRpb24tdiR7dmVyc2lvbn0tJHtzdGFtcH0uZGJgKSk7XG4gIH1cblxuICBjb25zdCBydW4gPSBkYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgZm9yIChjb25zdCBtIG9mIHBlbmRpbmcpIHtcbiAgICAgIGRiLmV4ZWMobS5zcWwpO1xuICAgICAgZGIucHJlcGFyZShcbiAgICAgICAgXCJJTlNFUlQgSU5UTyBtZXRhKGtleSx2YWx1ZSkgVkFMVUVTKCdzY2hlbWFfdmVyc2lvbicsPykgXCIgK1xuICAgICAgICAgIFwiT04gQ09ORkxJQ1Qoa2V5KSBETyBVUERBVEUgU0VUIHZhbHVlPWV4Y2x1ZGVkLnZhbHVlXCIsXG4gICAgICApLnJ1bihTdHJpbmcobS52ZXJzaW9uKSk7XG4gICAgfVxuICB9KTtcbiAgcnVuKCk7XG59XG5cbmZ1bmN0aW9uIGVuc3VyZU1ldGEoZGI6IERCLCBrZXk6IHN0cmluZywgbWFrZTogKCkgPT4gc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgcm93ID0gZGIucHJlcGFyZSgnU0VMRUNUIHZhbHVlIEZST00gbWV0YSBXSEVSRSBrZXk9PycpLmdldChrZXkpIGFzXG4gICAgfCB7IHZhbHVlOiBzdHJpbmcgfVxuICAgIHwgdW5kZWZpbmVkO1xuICBpZiAocm93KSByZXR1cm4gcm93LnZhbHVlO1xuICBjb25zdCB2YWx1ZSA9IG1ha2UoKTtcbiAgZGIucHJlcGFyZSgnSU5TRVJUIElOVE8gbWV0YShrZXksdmFsdWUpIFZBTFVFUyg/LD8pJykucnVuKGtleSwgdmFsdWUpO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXRhKGRiOiBEQiwga2V5OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3Qgcm93ID0gZGIucHJlcGFyZSgnU0VMRUNUIHZhbHVlIEZST00gbWV0YSBXSEVSRSBrZXk9PycpLmdldChrZXkpIGFzXG4gICAgfCB7IHZhbHVlOiBzdHJpbmcgfVxuICAgIHwgdW5kZWZpbmVkO1xuICByZXR1cm4gcm93ID8gcm93LnZhbHVlIDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1ldGEoZGI6IERCLCBrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBkYi5wcmVwYXJlKFxuICAgICdJTlNFUlQgSU5UTyBtZXRhKGtleSx2YWx1ZSkgVkFMVUVTKD8sPykgT04gQ09ORkxJQ1Qoa2V5KSBETyBVUERBVEUgU0VUIHZhbHVlPWV4Y2x1ZGVkLnZhbHVlJyxcbiAgKS5ydW4oa2V5LCB2YWx1ZSk7XG59XG5cbi8qKiBNYW51YWwgYmFja3VwOiBjb25zaXN0ZW50IHNuYXBzaG90IHZpYSBTUUxpdGUgYmFja3VwIEFQSS4gUmV0dXJucyBiYWNrdXAgcGF0aC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBiYWNrdXBEYXRhYmFzZShjdHg6IERiQ29udGV4dCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGJhY2t1cERpciA9IHBhdGguam9pbihjdHguZGF0YURpciwgJ2JhY2t1cHMnKTtcbiAgZnMubWtkaXJTeW5jKGJhY2t1cERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IHN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgJy0nKTtcbiAgY29uc3QgZGVzdCA9IHBhdGguam9pbihiYWNrdXBEaXIsIGBrZXlzdG9uZS0ke3N0YW1wfS5kYmApO1xuICBhd2FpdCBjdHguZGIuYmFja3VwKGRlc3QpO1xuICByZXR1cm4gZGVzdDtcbn1cbiIsICIvLyBWZXJzaW9uZWQgc2NoZW1hIG1pZ3JhdGlvbnMuIE5ldmVyIGVkaXQgYSBzaGlwcGVkIG1pZ3JhdGlvbiBcdTIwMTQgYXBwZW5kIGEgbmV3IG9uZS5cbi8vIFJ1bm5lcjogZGIudHMgYXBwbHlNaWdyYXRpb25zKCkuIEVhY2ggbWlncmF0aW9uIHJ1bnMgaW4gYSB0cmFuc2FjdGlvbi5cblxuZXhwb3J0IGludGVyZmFjZSBNaWdyYXRpb24ge1xuICB2ZXJzaW9uOiBudW1iZXI7XG4gIG5hbWU6IHN0cmluZztcbiAgc3FsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBNSUdSQVRJT05TOiBNaWdyYXRpb25bXSA9IFtcbiAge1xuICAgIHZlcnNpb246IDEsXG4gICAgbmFtZTogJ2NvcmUtc2NoZW1hJyxcbiAgICBzcWw6IGBcbkNSRUFURSBUQUJMRSBtZXRhIChcbiAga2V5IFRFWFQgUFJJTUFSWSBLRVksXG4gIHZhbHVlIFRFWFQgTk9UIE5VTExcbik7XG5cbkNSRUFURSBUQUJMRSB1c2VycyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIG5hbWUgVEVYVCBOT1QgTlVMTCxcbiAgaW5pdGlhbHMgVEVYVCBOT1QgTlVMTCxcbiAgY29sb3IgVEVYVCBOT1QgTlVMTCxcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMXG4pO1xuXG5DUkVBVEUgVEFCTEUgaXRlbXMgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBpZGVudCBURVhUIE5PVCBOVUxMIFVOSVFVRSxcbiAgdHlwZSBURVhUIE5PVCBOVUxMLFxuICB0aXRsZSBURVhUIE5PVCBOVUxMLFxuICBib2R5IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcbiAgYm9keV90ZXh0IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcbiAgc3RhdHVzIFRFWFQgTk9UIE5VTEwsXG4gIHByaW9yaXR5IFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnbm9uZScsXG4gIG93bmVyX2lkIFRFWFQsXG4gIHJlcG9ydGVyX2lkIFRFWFQsXG4gIG1pbGVzdG9uZV9pZCBURVhULFxuICByZWxlYXNlX2lkIFRFWFQsXG4gIHBhcmVudF9pZCBURVhULFxuICBzdGFydF9kYXRlIFRFWFQsXG4gIGR1ZV9kYXRlIFRFWFQsXG4gIGNvbXBsZXRlZF9hdCBURVhULFxuICBlZmZvcnQgUkVBTCxcbiAgY29uZmlkZW5jZSBURVhULFxuICByaXNrX2xldmVsIFRFWFQsXG4gIGJ1c2luZXNzX3ZhbHVlIFRFWFQsXG4gIGxlYWRlcnNoaXBfdmlzaWJsZSBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcbiAgcHJvZ3Jlc3MgSU5URUdFUixcbiAgdGFncyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ1tdJyxcbiAgZXh0cmEgVEVYVCBOT1QgTlVMTCBERUZBVUxUICd7fScsXG4gIGFyY2hpdmVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBzYW1wbGUgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcbiAgdXBkYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxuICBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTEwsXG4gIHVwZGF0ZWRfYnkgVEVYVCBOT1QgTlVMTFxuKTtcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfdHlwZSBPTiBpdGVtcyh0eXBlKSBXSEVSRSBkZWxldGVkID0gMDtcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfc3RhdHVzIE9OIGl0ZW1zKHN0YXR1cykgV0hFUkUgZGVsZXRlZCA9IDA7XG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX293bmVyIE9OIGl0ZW1zKG93bmVyX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfbWlsZXN0b25lIE9OIGl0ZW1zKG1pbGVzdG9uZV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX3JlbGVhc2UgT04gaXRlbXMocmVsZWFzZV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX3BhcmVudCBPTiBpdGVtcyhwYXJlbnRfaWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIElOREVYIGlkeF9pdGVtc191cGRhdGVkIE9OIGl0ZW1zKHVwZGF0ZWRfYXQpO1xuXG5DUkVBVEUgVEFCTEUgaWRlbnRfY291bnRlcnMgKFxuICB0eXBlIFRFWFQgUFJJTUFSWSBLRVksXG4gIG5leHQgSU5URUdFUiBOT1QgTlVMTFxuKTtcblxuQ1JFQVRFIFRBQkxFIGxpbmtzIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgZnJvbV9pZCBURVhUIE5PVCBOVUxMLFxuICB0b19pZCBURVhUIE5PVCBOVUxMLFxuICBraW5kIFRFWFQgTk9UIE5VTEwsXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcbiAgY3JlYXRlZF9ieSBURVhUIE5PVCBOVUxMXG4pO1xuQ1JFQVRFIElOREVYIGlkeF9saW5rc19mcm9tIE9OIGxpbmtzKGZyb21faWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIElOREVYIGlkeF9saW5rc190byBPTiBsaW5rcyh0b19pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XG5DUkVBVEUgVU5JUVVFIElOREVYIGlkeF9saW5rc191bmlxIE9OIGxpbmtzKGZyb21faWQsIHRvX2lkLCBraW5kKTtcblxuQ1JFQVRFIFRBQkxFIGNvbW1lbnRzIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgaXRlbV9pZCBURVhUIE5PVCBOVUxMLFxuICBhdXRob3JfaWQgVEVYVCBOT1QgTlVMTCxcbiAgYm9keSBURVhUIE5PVCBOVUxMLFxuICBib2R5X3RleHQgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxuICBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXG4gIHVwZGF0ZWRfYXQgVEVYVCxcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMFxuKTtcbkNSRUFURSBJTkRFWCBpZHhfY29tbWVudHNfaXRlbSBPTiBjb21tZW50cyhpdGVtX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcblxuQ1JFQVRFIFRBQkxFIGF0dGFjaG1lbnRzIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgaXRlbV9pZCBURVhUIE5PVCBOVUxMLFxuICBmaWxlbmFtZSBURVhUIE5PVCBOVUxMLFxuICBtaW1lIFRFWFQgTk9UIE5VTEwsXG4gIHNpemUgSU5URUdFUiBOT1QgTlVMTCxcbiAgc2hhMjU2IFRFWFQgTk9UIE5VTEwsXG4gIGRlc2NyaXB0aW9uIFRFWFQsXG4gIHVwbG9hZGVkX2J5IFRFWFQgTk9UIE5VTEwsXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMFxuKTtcbkNSRUFURSBJTkRFWCBpZHhfYXR0YWNobWVudHNfaXRlbSBPTiBhdHRhY2htZW50cyhpdGVtX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcblxuQ1JFQVRFIFRBQkxFIGFjdGl2aXR5IChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgaXRlbV9pZCBURVhULFxuICBhY3Rvcl9pZCBURVhUIE5PVCBOVUxMLFxuICBraW5kIFRFWFQgTk9UIE5VTEwsXG4gIGZpZWxkIFRFWFQsXG4gIG9sZF92YWx1ZSBURVhULFxuICBuZXdfdmFsdWUgVEVYVCxcbiAgYXQgVEVYVCBOT1QgTlVMTFxuKTtcbkNSRUFURSBJTkRFWCBpZHhfYWN0aXZpdHlfaXRlbSBPTiBhY3Rpdml0eShpdGVtX2lkKTtcbkNSRUFURSBJTkRFWCBpZHhfYWN0aXZpdHlfYXQgT04gYWN0aXZpdHkoYXQpO1xuXG5DUkVBVEUgVEFCTEUgaXRlbV92ZXJzaW9ucyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGl0ZW1faWQgVEVYVCBOT1QgTlVMTCxcbiAgdmVyc2lvbiBJTlRFR0VSIE5PVCBOVUxMLFxuICB0aXRsZSBURVhUIE5PVCBOVUxMLFxuICBib2R5IFRFWFQgTk9UIE5VTEwsXG4gIHNhdmVkX2J5IFRFWFQgTk9UIE5VTEwsXG4gIHNhdmVkX2F0IFRFWFQgTk9UIE5VTExcbik7XG5DUkVBVEUgSU5ERVggaWR4X3ZlcnNpb25zX2l0ZW0gT04gaXRlbV92ZXJzaW9ucyhpdGVtX2lkLCB2ZXJzaW9uKTtcblxuQ1JFQVRFIFRBQkxFIG1pbGVzdG9uZXMgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXG4gIGRlc2NyaXB0aW9uIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcbiAgdGFyZ2V0X2RhdGUgVEVYVCxcbiAgc3RhdHVzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAncGxhbm5lZCcsXG4gIHNvcnQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gIHNhbXBsZSBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMFxuKTtcblxuQ1JFQVRFIFRBQkxFIHJlbGVhc2VzIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgbmFtZSBURVhUIE5PVCBOVUxMLFxuICB2ZXJzaW9uIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcbiAgdGFyZ2V0X2RhdGUgVEVYVCxcbiAgc3RhdHVzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAncGxhbm5lZCcsXG4gIGdvYWxzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnJyxcbiAgbm90ZXMgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxuICBzYW1wbGUgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcbik7XG5cbkNSRUFURSBUQUJMRSBzYXZlZF92aWV3cyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIG5hbWUgVEVYVCBOT1QgTlVMTCxcbiAgY29uZmlnIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAne30nLFxuICBwaW5uZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gIGNyZWF0ZWRfYnkgVEVYVCBOT1QgTlVMTCxcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwXG4pO1xuXG4tLSBBcHBlbmQtb25seSBvcGVyYXRpb24gbG9nLiBTb3VyY2UgZm9yIHN5bmMgZXhwb3J0OyBwZWVycycgb3BzIHJlY29yZGVkIHdpdGggb3JpZ2luIGRldmljZS5cbkNSRUFURSBUQUJMRSBvcGxvZyAoXG4gIHNlcSBJTlRFR0VSIFBSSU1BUlkgS0VZIEFVVE9JTkNSRU1FTlQsXG4gIG9wX2lkIFRFWFQgTk9UIE5VTEwgVU5JUVVFLFxuICBkZXZpY2VfaWQgVEVYVCBOT1QgTlVMTCxcbiAgYWN0b3JfaWQgVEVYVCBOT1QgTlVMTCxcbiAgbGFtcG9ydCBJTlRFR0VSIE5PVCBOVUxMLFxuICBhdCBURVhUIE5PVCBOVUxMLFxuICBlbnRpdHkgVEVYVCBOT1QgTlVMTCxcbiAgZW50aXR5X2lkIFRFWFQgTk9UIE5VTEwsXG4gIGFjdGlvbiBURVhUIE5PVCBOVUxMLFxuICBwYXlsb2FkIFRFWFQgTk9UIE5VTExcbik7XG5DUkVBVEUgSU5ERVggaWR4X29wbG9nX2VudGl0eSBPTiBvcGxvZyhlbnRpdHksIGVudGl0eV9pZCk7XG5DUkVBVEUgSU5ERVggaWR4X29wbG9nX2RldmljZSBPTiBvcGxvZyhkZXZpY2VfaWQsIHNlcSk7XG5cbi0tIEZpZWxkLWxldmVsIHdyaXRlIHJlZ2lzdHJ5IGZvciBMV1cgbWVyZ2U6IGxhc3QgKGxhbXBvcnQsIGRldmljZSkgdGhhdCB3cm90ZSBlYWNoIGZpZWxkLlxuQ1JFQVRFIFRBQkxFIGZpZWxkX2Nsb2NrIChcbiAgZW50aXR5IFRFWFQgTk9UIE5VTEwsXG4gIGVudGl0eV9pZCBURVhUIE5PVCBOVUxMLFxuICBmaWVsZCBURVhUIE5PVCBOVUxMLFxuICBsYW1wb3J0IElOVEVHRVIgTk9UIE5VTEwsXG4gIGRldmljZV9pZCBURVhUIE5PVCBOVUxMLFxuICBQUklNQVJZIEtFWSAoZW50aXR5LCBlbnRpdHlfaWQsIGZpZWxkKVxuKTtcblxuQ1JFQVRFIFRBQkxFIHN5bmNfY29uZmxpY3RzIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgZW50aXR5IFRFWFQgTk9UIE5VTEwsXG4gIGVudGl0eV9pZCBURVhUIE5PVCBOVUxMLFxuICBmaWVsZCBURVhUIE5PVCBOVUxMLFxuICBsb2NhbF92YWx1ZSBURVhUIE5PVCBOVUxMLFxuICByZW1vdGVfdmFsdWUgVEVYVCBOT1QgTlVMTCxcbiAgcmVtb3RlX2RldmljZSBURVhUIE5PVCBOVUxMLFxuICByZW1vdGVfYWN0b3IgVEVYVCBOT1QgTlVMTCxcbiAgZGV0ZWN0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcbiAgcmVzb2x2ZWRfYXQgVEVYVCxcbiAgcmVzb2x1dGlvbiBURVhUXG4pO1xuXG4tLSBQZXItcGVlciBpbXBvcnQgcHJvZ3Jlc3M6IGhpZ2hlc3QgZmlsZSBzZXF1ZW5jZSBjb25zdW1lZCBwZXIgZGV2aWNlLlxuQ1JFQVRFIFRBQkxFIHN5bmNfcGVlcnMgKFxuICBkZXZpY2VfaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgdXNlcl9uYW1lIFRFWFQsXG4gIGxhc3RfZmlsZSBURVhULFxuICBsYXN0X3NlZW5fYXQgVEVYVFxuKTtcblxuQ1JFQVRFIFZJUlRVQUwgVEFCTEUgaXRlbXNfZnRzIFVTSU5HIGZ0czUoXG4gIGlkZW50LCB0aXRsZSwgYm9keV90ZXh0LCB0YWdzLFxuICBjb250ZW50PSdpdGVtcycsIGNvbnRlbnRfcm93aWQ9J3Jvd2lkJyxcbiAgdG9rZW5pemU9J3VuaWNvZGU2MSdcbik7XG5cbkNSRUFURSBUUklHR0VSIGl0ZW1zX2Z0c19haSBBRlRFUiBJTlNFUlQgT04gaXRlbXMgQkVHSU5cbiAgSU5TRVJUIElOVE8gaXRlbXNfZnRzKHJvd2lkLCBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncylcbiAgVkFMVUVTIChuZXcucm93aWQsIG5ldy5pZGVudCwgbmV3LnRpdGxlLCBuZXcuYm9keV90ZXh0LCBuZXcudGFncyk7XG5FTkQ7XG5DUkVBVEUgVFJJR0dFUiBpdGVtc19mdHNfYWQgQUZURVIgREVMRVRFIE9OIGl0ZW1zIEJFR0lOXG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhpdGVtc19mdHMsIHJvd2lkLCBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncylcbiAgVkFMVUVTICgnZGVsZXRlJywgb2xkLnJvd2lkLCBvbGQuaWRlbnQsIG9sZC50aXRsZSwgb2xkLmJvZHlfdGV4dCwgb2xkLnRhZ3MpO1xuRU5EO1xuQ1JFQVRFIFRSSUdHRVIgaXRlbXNfZnRzX2F1IEFGVEVSIFVQREFURSBPTiBpdGVtcyBCRUdJTlxuICBJTlNFUlQgSU5UTyBpdGVtc19mdHMoaXRlbXNfZnRzLCByb3dpZCwgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MpXG4gIFZBTFVFUyAoJ2RlbGV0ZScsIG9sZC5yb3dpZCwgb2xkLmlkZW50LCBvbGQudGl0bGUsIG9sZC5ib2R5X3RleHQsIG9sZC50YWdzKTtcbiAgSU5TRVJUIElOVE8gaXRlbXNfZnRzKHJvd2lkLCBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncylcbiAgVkFMVUVTIChuZXcucm93aWQsIG5ldy5pZGVudCwgbmV3LnRpdGxlLCBuZXcuYm9keV90ZXh0LCBuZXcudGFncyk7XG5FTkQ7XG5gLFxuICB9LFxuXTtcbiIsICIvLyBTdG9yZTogdGhlIHNpbmdsZSB3cml0ZSBwYXRoLiBFdmVyeSBtdXRhdGlvbiAobG9jYWwgb3IgcmVtb3RlKSBmbG93cyB0aHJvdWdoIGhlcmUgc29cbi8vIFNRTGl0ZSBzdGF0ZSwgdGhlIG9wbG9nLCBmaWVsZCBjbG9ja3MsIGFjdGl2aXR5IGhpc3RvcnksIGFuZCBGVFMgc3RheSBjb25zaXN0ZW50LlxuLy9cbi8vIFN5bmMgbW9kZWwgKHNlZSBkb2NzL1NZTkNfQVJDSElURUNUVVJFLm1kKTpcbi8vIC0gTG9jYWwgbXV0YXRpb25zIGFwcGVuZCBmaWVsZC1ncmFudWxhciBvcHMgdG8gb3Bsb2cgKGxhbXBvcnQgY2xvY2sgKyBkZXZpY2UgaWQpLlxuLy8gLSAnc2V0JyBvcHMgY2FycnkgYmFzZWRPbiA9IHRoZSAobGFtcG9ydCxkZXZpY2UpIGVhY2ggZmllbGQgaGFkIHdoZW4gd3JpdHRlbixcbi8vICAgbGV0dGluZyB0aGUgaW1wb3J0ZXIgZGlzdGluZ3Vpc2ggY2xlYW4gY2F1c2FsIHVwZGF0ZXMgZnJvbSB0cnVlIGNvbmN1cnJlbnQgZWRpdHMuXG4vLyAtIENvbmN1cnJlbnQgZWRpdHMgcmVzb2x2ZSBieSBMV1cgKGxhbXBvcnQsIGRldmljZUlkIHRpZWJyZWFrKS4gRm9yIGNvbnRlbnQgZmllbGRzXG4vLyAgICh0aXRsZSwgYm9keSkgdGhlIGxvc2luZyB2YWx1ZSBpcyBwcmVzZXJ2ZWQgaW4gc3luY19jb25mbGljdHMgZm9yIG1hbnVhbCByZXZpZXcuXG5cbmltcG9ydCBjcnlwdG8gZnJvbSAnbm9kZTpjcnlwdG8nO1xuaW1wb3J0IHR5cGUgeyBEQiwgRGJDb250ZXh0IH0gZnJvbSAnLi9kYic7XG5pbXBvcnQgeyBnZXRNZXRhLCBzZXRNZXRhIH0gZnJvbSAnLi9kYic7XG5pbXBvcnQgdHlwZSB7XG4gIEl0ZW1GaWx0ZXIsXG4gIEl0ZW1Tb3J0LFxuICBJdGVtVHlwZSxcbiAgT3AsXG4gIFdvcmtJdGVtLFxuICBJdGVtTGluayxcbiAgQ29tbWVudCxcbiAgTWlsZXN0b25lLFxuICBSZWxlYXNlLFxuICBTYXZlZFZpZXcsXG4gIFVzZXIsXG4gIExpbmtLaW5kLFxuICBTZWFyY2hSZXN1bHQsXG4gIFN5bmNDb25mbGljdCxcbn0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcbmltcG9ydCB7IElERU5UX1BSRUZJWCwgc3RhdHVzZXNGb3JUeXBlLCBURVJNSU5BTF9TVEFUVVNFUyB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5cbmNvbnN0IENPTkZMSUNUX1NVUkZBQ0VEX0ZJRUxEUyA9IG5ldyBTZXQoWyd0aXRsZScsICdib2R5J10pO1xuXG4vLyBjYW1lbENhc2UgZmllbGQgLT4gaXRlbXMgY29sdW1uXG5jb25zdCBJVEVNX0NPTFM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIGlkZW50OiAnaWRlbnQnLFxuICB0eXBlOiAndHlwZScsXG4gIHRpdGxlOiAndGl0bGUnLFxuICBib2R5OiAnYm9keScsXG4gIGJvZHlUZXh0OiAnYm9keV90ZXh0JyxcbiAgc3RhdHVzOiAnc3RhdHVzJyxcbiAgcHJpb3JpdHk6ICdwcmlvcml0eScsXG4gIG93bmVySWQ6ICdvd25lcl9pZCcsXG4gIHJlcG9ydGVySWQ6ICdyZXBvcnRlcl9pZCcsXG4gIG1pbGVzdG9uZUlkOiAnbWlsZXN0b25lX2lkJyxcbiAgcmVsZWFzZUlkOiAncmVsZWFzZV9pZCcsXG4gIHBhcmVudElkOiAncGFyZW50X2lkJyxcbiAgc3RhcnREYXRlOiAnc3RhcnRfZGF0ZScsXG4gIGR1ZURhdGU6ICdkdWVfZGF0ZScsXG4gIGNvbXBsZXRlZEF0OiAnY29tcGxldGVkX2F0JyxcbiAgZWZmb3J0OiAnZWZmb3J0JyxcbiAgY29uZmlkZW5jZTogJ2NvbmZpZGVuY2UnLFxuICByaXNrTGV2ZWw6ICdyaXNrX2xldmVsJyxcbiAgYnVzaW5lc3NWYWx1ZTogJ2J1c2luZXNzX3ZhbHVlJyxcbiAgbGVhZGVyc2hpcFZpc2libGU6ICdsZWFkZXJzaGlwX3Zpc2libGUnLFxuICBwcm9ncmVzczogJ3Byb2dyZXNzJyxcbiAgdGFnczogJ3RhZ3MnLFxuICBleHRyYTogJ2V4dHJhJyxcbiAgYXJjaGl2ZWQ6ICdhcmNoaXZlZCcsXG4gIHNhbXBsZTogJ3NhbXBsZScsXG4gIGRlbGV0ZWQ6ICdkZWxldGVkJyxcbiAgdXBkYXRlZEF0OiAndXBkYXRlZF9hdCcsXG4gIHVwZGF0ZWRCeTogJ3VwZGF0ZWRfYnknLFxufTtcblxuY29uc3QgSlNPTl9JVEVNX0ZJRUxEUyA9IG5ldyBTZXQoWyd0YWdzJywgJ2V4dHJhJ10pO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN0b3JlRXZlbnRzIHtcbiAgb25DaGFuZ2U6ICh3aGF0OiB7IGVudGl0eTogc3RyaW5nOyBlbnRpdHlJZDogc3RyaW5nIH0pID0+IHZvaWQ7XG4gIG9uQ29uZmxpY3Q6IChjb25mbGljdDogU3luY0NvbmZsaWN0KSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgU3RvcmUge1xuICByZWFkb25seSBkYjogREI7XG4gIHJlYWRvbmx5IGRldmljZUlkOiBzdHJpbmc7XG4gIGFjdG9ySWQ6IHN0cmluZztcbiAgcHJpdmF0ZSBldmVudHM6IFN0b3JlRXZlbnRzO1xuXG4gIGNvbnN0cnVjdG9yKGN0eDogRGJDb250ZXh0LCBhY3RvcklkOiBzdHJpbmcsIGV2ZW50cz86IFBhcnRpYWw8U3RvcmVFdmVudHM+KSB7XG4gICAgdGhpcy5kYiA9IGN0eC5kYjtcbiAgICB0aGlzLmRldmljZUlkID0gY3R4LmRldmljZUlkO1xuICAgIHRoaXMuYWN0b3JJZCA9IGFjdG9ySWQ7XG4gICAgdGhpcy5ldmVudHMgPSB7XG4gICAgICBvbkNoYW5nZTogZXZlbnRzPy5vbkNoYW5nZSA/PyAoKCkgPT4ge30pLFxuICAgICAgb25Db25mbGljdDogZXZlbnRzPy5vbkNvbmZsaWN0ID8/ICgoKSA9PiB7fSksXG4gICAgfTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gY2xvY2tzIC0tLS0tLS0tLS1cbiAgcHJpdmF0ZSB0aWNrTGFtcG9ydCgpOiBudW1iZXIge1xuICAgIGNvbnN0IGN1ciA9IE51bWJlcihnZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JykgPz8gJzAnKSArIDE7XG4gICAgc2V0TWV0YSh0aGlzLmRiLCAnbGFtcG9ydCcsIFN0cmluZyhjdXIpKTtcbiAgICByZXR1cm4gY3VyO1xuICB9XG5cbiAgcHJpdmF0ZSB3aXRuZXNzTGFtcG9ydChyZW1vdGU6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGN1ciA9IE51bWJlcihnZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JykgPz8gJzAnKTtcbiAgICBpZiAocmVtb3RlID4gY3VyKSBzZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JywgU3RyaW5nKHJlbW90ZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3coKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaWVsZENsb2NrKGVudGl0eTogc3RyaW5nLCBlbnRpdHlJZDogc3RyaW5nLCBmaWVsZDogc3RyaW5nKTogeyBsYW1wb3J0OiBudW1iZXI7IGRldmljZUlkOiBzdHJpbmcgfSB8IG51bGwge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgbGFtcG9ydCwgZGV2aWNlX2lkIEZST00gZmllbGRfY2xvY2sgV0hFUkUgZW50aXR5PT8gQU5EIGVudGl0eV9pZD0/IEFORCBmaWVsZD0/JylcbiAgICAgIC5nZXQoZW50aXR5LCBlbnRpdHlJZCwgZmllbGQpIGFzIHsgbGFtcG9ydDogbnVtYmVyOyBkZXZpY2VfaWQ6IHN0cmluZyB9IHwgdW5kZWZpbmVkO1xuICAgIHJldHVybiByb3cgPyB7IGxhbXBvcnQ6IHJvdy5sYW1wb3J0LCBkZXZpY2VJZDogcm93LmRldmljZV9pZCB9IDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgc2V0RmllbGRDbG9jayhlbnRpdHk6IHN0cmluZywgZW50aXR5SWQ6IHN0cmluZywgZmllbGQ6IHN0cmluZywgbGFtcG9ydDogbnVtYmVyLCBkZXZpY2VJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5kYlxuICAgICAgLnByZXBhcmUoXG4gICAgICAgIGBJTlNFUlQgSU5UTyBmaWVsZF9jbG9jayhlbnRpdHksIGVudGl0eV9pZCwgZmllbGQsIGxhbXBvcnQsIGRldmljZV9pZCkgVkFMVUVTKD8sPyw/LD8sPylcbiAgICAgICAgIE9OIENPTkZMSUNUKGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZCkgRE8gVVBEQVRFIFNFVCBsYW1wb3J0PWV4Y2x1ZGVkLmxhbXBvcnQsIGRldmljZV9pZD1leGNsdWRlZC5kZXZpY2VfaWRgLFxuICAgICAgKVxuICAgICAgLnJ1bihlbnRpdHksIGVudGl0eUlkLCBmaWVsZCwgbGFtcG9ydCwgZGV2aWNlSWQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBvcGxvZyAtLS0tLS0tLS0tXG4gIHByaXZhdGUgYXBwZW5kT3Aob3A6IE9wKTogdm9pZCB7XG4gICAgdGhpcy5kYlxuICAgICAgLnByZXBhcmUoXG4gICAgICAgIGBJTlNFUlQgSU5UTyBvcGxvZyhvcF9pZCwgZGV2aWNlX2lkLCBhY3Rvcl9pZCwgbGFtcG9ydCwgYXQsIGVudGl0eSwgZW50aXR5X2lkLCBhY3Rpb24sIHBheWxvYWQpXG4gICAgICAgICBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LD8pYCxcbiAgICAgIClcbiAgICAgIC5ydW4ob3Aub3BJZCwgb3AuZGV2aWNlSWQsIG9wLmFjdG9ySWQsIG9wLmxhbXBvcnQsIG9wLmF0LCBvcC5lbnRpdHksIG9wLmVudGl0eUlkLCBvcC5hY3Rpb24sIEpTT04uc3RyaW5naWZ5KG9wLnBheWxvYWQpKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9jYWxPcChcbiAgICBlbnRpdHk6IE9wWydlbnRpdHknXSxcbiAgICBlbnRpdHlJZDogc3RyaW5nLFxuICAgIGFjdGlvbjogT3BbJ2FjdGlvbiddLFxuICAgIHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApOiBPcCB7XG4gICAgY29uc3QgbGFtcG9ydCA9IHRoaXMudGlja0xhbXBvcnQoKTtcbiAgICBjb25zdCBvcDogT3AgPSB7XG4gICAgICBvcElkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgZGV2aWNlSWQ6IHRoaXMuZGV2aWNlSWQsXG4gICAgICBhY3RvcklkOiB0aGlzLmFjdG9ySWQsXG4gICAgICBsYW1wb3J0LFxuICAgICAgYXQ6IHRoaXMubm93KCksXG4gICAgICBlbnRpdHksXG4gICAgICBlbnRpdHlJZCxcbiAgICAgIGFjdGlvbixcbiAgICAgIHBheWxvYWQsXG4gICAgfTtcbiAgICB0aGlzLmFwcGVuZE9wKG9wKTtcbiAgICByZXR1cm4gb3A7XG4gIH1cblxuICAvKiogTG9jYWwgJ3NldCc6IHJlY29yZHMgYmFzZWRPbiBjbG9ja3MgdGhlbiBhZHZhbmNlcyB0aGVtLiAqL1xuICBwcml2YXRlIGxvY2FsU2V0KGVudGl0eTogT3BbJ2VudGl0eSddLCBlbnRpdHlJZDogc3RyaW5nLCBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3QgYmFzZWRPbjogUmVjb3JkPHN0cmluZywgeyBsYW1wb3J0OiBudW1iZXI7IGRldmljZUlkOiBzdHJpbmcgfSB8IG51bGw+ID0ge307XG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKGZpZWxkcykpIGJhc2VkT25bZl0gPSB0aGlzLmZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZik7XG4gICAgY29uc3Qgb3AgPSB0aGlzLmxvY2FsT3AoZW50aXR5LCBlbnRpdHlJZCwgJ3NldCcsIHsgZmllbGRzLCBiYXNlZE9uIH0pO1xuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhmaWVsZHMpKSB0aGlzLnNldEZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgdGhpcy5kZXZpY2VJZCk7XG4gIH1cblxuICBwcml2YXRlIGxvY2FsQ3JlYXRlKGVudGl0eTogT3BbJ2VudGl0eSddLCBlbnRpdHlJZDogc3RyaW5nLCByZWNvcmQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3Qgb3AgPSB0aGlzLmxvY2FsT3AoZW50aXR5LCBlbnRpdHlJZCwgJ2NyZWF0ZScsIHsgcmVjb3JkIH0pO1xuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhyZWNvcmQpKSB0aGlzLnNldEZpZWxkQ2xvY2soZW50aXR5LCBlbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgdGhpcy5kZXZpY2VJZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGlkZW50IGFsbG9jYXRpb24gLS0tLS0tLS0tLVxuICBhbGxvY0lkZW50KHR5cGU6IEl0ZW1UeXBlKTogc3RyaW5nIHtcbiAgICBjb25zdCBwcmVmaXggPSBJREVOVF9QUkVGSVhbdHlwZV07XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgbmV4dCBGUk9NIGlkZW50X2NvdW50ZXJzIFdIRVJFIHR5cGU9PycpLmdldCh0eXBlKSBhc1xuICAgICAgfCB7IG5leHQ6IG51bWJlciB9XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBsZXQgbiA9IHJvdyA/IHJvdy5uZXh0IDogMTtcbiAgICAvLyBTa2lwIG51bWJlcnMgYWxyZWFkeSB0YWtlbiAoaW1wb3J0cyBtYXkgaGF2ZSBhZHZhbmNlZCB1c2FnZSBwYXN0IG91ciBjb3VudGVyKS5cbiAgICB3aGlsZSAodGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIGl0ZW1zIFdIRVJFIGlkZW50PT8nKS5nZXQoYCR7cHJlZml4fS0ke259YCkpIG4rKztcbiAgICB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gaWRlbnRfY291bnRlcnModHlwZSxuZXh0KSBWQUxVRVMoPyw/KSBPTiBDT05GTElDVCh0eXBlKSBETyBVUERBVEUgU0VUIG5leHQ9PycpXG4gICAgICAucnVuKHR5cGUsIG4gKyAxLCBuICsgMSk7XG4gICAgcmV0dXJuIGAke3ByZWZpeH0tJHtufWA7XG4gIH1cblxuICAvKiogQWR2YW5jZSB0aGUgbG9jYWwgY291bnRlciBwYXN0IGFuIGlkZW50IG9ic2VydmVkIGZyb20gYSBwZWVyLiAqL1xuICBwcml2YXRlIHdpdG5lc3NJZGVudCh0eXBlOiBJdGVtVHlwZSwgaWRlbnQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IG0gPSAvLShcXGQrKSQvLmV4ZWMoaWRlbnQpO1xuICAgIGlmICghbSkgcmV0dXJuO1xuICAgIGNvbnN0IG4gPSBOdW1iZXIobVsxXSk7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgbmV4dCBGUk9NIGlkZW50X2NvdW50ZXJzIFdIRVJFIHR5cGU9PycpLmdldCh0eXBlKSBhc1xuICAgICAgfCB7IG5leHQ6IG51bWJlciB9XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBpZiAoIXJvdyB8fCByb3cubmV4dCA8PSBuKSB7XG4gICAgICB0aGlzLmRiXG4gICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBpZGVudF9jb3VudGVycyh0eXBlLG5leHQpIFZBTFVFUyg/LD8pIE9OIENPTkZMSUNUKHR5cGUpIERPIFVQREFURSBTRVQgbmV4dD0/JylcbiAgICAgICAgLnJ1bih0eXBlLCBuICsgMSwgbiArIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gYWN0aXZpdHkgLS0tLS0tLS0tLVxuICBwcml2YXRlIGxvZ0FjdGl2aXR5KGl0ZW1JZDogc3RyaW5nIHwgbnVsbCwga2luZDogc3RyaW5nLCBmaWVsZD86IHN0cmluZyB8IG51bGwsIG9sZFY/OiB1bmtub3duLCBuZXdWPzogdW5rbm93bik6IHZvaWQge1xuICAgIHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBhY3Rpdml0eShpZCwgaXRlbV9pZCwgYWN0b3JfaWQsIGtpbmQsIGZpZWxkLCBvbGRfdmFsdWUsIG5ld192YWx1ZSwgYXQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8pJylcbiAgICAgIC5ydW4oXG4gICAgICAgIGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgIGl0ZW1JZCxcbiAgICAgICAgdGhpcy5hY3RvcklkLFxuICAgICAgICBraW5kLFxuICAgICAgICBmaWVsZCA/PyBudWxsLFxuICAgICAgICBvbGRWID09IG51bGwgPyBudWxsIDogU3RyaW5nKG9sZFYpLnNsaWNlKDAsIDUwMCksXG4gICAgICAgIG5ld1YgPT0gbnVsbCA/IG51bGwgOiBTdHJpbmcobmV3Vikuc2xpY2UoMCwgNTAwKSxcbiAgICAgICAgdGhpcy5ub3coKSxcbiAgICAgICk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGl0ZW1zIC0tLS0tLS0tLS1cbiAgY3JlYXRlSXRlbShpbnB1dDogUGFydGlhbDxXb3JrSXRlbT4gJiB7IHR5cGU6IEl0ZW1UeXBlOyB0aXRsZTogc3RyaW5nIH0pOiBXb3JrSXRlbSB7XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIGNvbnN0IGlkID0gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICAgIGNvbnN0IGlkZW50ID0gdGhpcy5hbGxvY0lkZW50KGlucHV0LnR5cGUpO1xuICAgICAgY29uc3Qgbm93ID0gdGhpcy5ub3coKTtcbiAgICAgIGNvbnN0IHN0YXR1c2VzID0gc3RhdHVzZXNGb3JUeXBlKGlucHV0LnR5cGUpO1xuICAgICAgY29uc3QgaXRlbTogV29ya0l0ZW0gPSB7XG4gICAgICAgIGlkLFxuICAgICAgICBpZGVudCxcbiAgICAgICAgdHlwZTogaW5wdXQudHlwZSxcbiAgICAgICAgdGl0bGU6IGlucHV0LnRpdGxlLFxuICAgICAgICBib2R5OiBpbnB1dC5ib2R5ID8/ICcnLFxuICAgICAgICBib2R5VGV4dDogaW5wdXQuYm9keVRleHQgPz8gJycsXG4gICAgICAgIHN0YXR1czogaW5wdXQuc3RhdHVzICYmIHN0YXR1c2VzLmluY2x1ZGVzKGlucHV0LnN0YXR1cykgPyBpbnB1dC5zdGF0dXMgOiBzdGF0dXNlc1swXSxcbiAgICAgICAgcHJpb3JpdHk6IGlucHV0LnByaW9yaXR5ID8/ICdub25lJyxcbiAgICAgICAgb3duZXJJZDogaW5wdXQub3duZXJJZCA/PyBudWxsLFxuICAgICAgICByZXBvcnRlcklkOiBpbnB1dC5yZXBvcnRlcklkID8/IHRoaXMuYWN0b3JJZCxcbiAgICAgICAgbWlsZXN0b25lSWQ6IGlucHV0Lm1pbGVzdG9uZUlkID8/IG51bGwsXG4gICAgICAgIHJlbGVhc2VJZDogaW5wdXQucmVsZWFzZUlkID8/IG51bGwsXG4gICAgICAgIHBhcmVudElkOiBpbnB1dC5wYXJlbnRJZCA/PyBudWxsLFxuICAgICAgICBzdGFydERhdGU6IGlucHV0LnN0YXJ0RGF0ZSA/PyBudWxsLFxuICAgICAgICBkdWVEYXRlOiBpbnB1dC5kdWVEYXRlID8/IG51bGwsXG4gICAgICAgIGNvbXBsZXRlZEF0OiBudWxsLFxuICAgICAgICBlZmZvcnQ6IGlucHV0LmVmZm9ydCA/PyBudWxsLFxuICAgICAgICBjb25maWRlbmNlOiBpbnB1dC5jb25maWRlbmNlID8/IG51bGwsXG4gICAgICAgIHJpc2tMZXZlbDogaW5wdXQucmlza0xldmVsID8/IG51bGwsXG4gICAgICAgIGJ1c2luZXNzVmFsdWU6IGlucHV0LmJ1c2luZXNzVmFsdWUgPz8gbnVsbCxcbiAgICAgICAgbGVhZGVyc2hpcFZpc2libGU6IGlucHV0LmxlYWRlcnNoaXBWaXNpYmxlID8/IDAsXG4gICAgICAgIHByb2dyZXNzOiBpbnB1dC5wcm9ncmVzcyA/PyBudWxsLFxuICAgICAgICB0YWdzOiBpbnB1dC50YWdzID8/IFtdLFxuICAgICAgICBleHRyYTogaW5wdXQuZXh0cmEgPz8ge30sXG4gICAgICAgIGFyY2hpdmVkOiAwLFxuICAgICAgICBzYW1wbGU6IGlucHV0LnNhbXBsZSA/PyAwLFxuICAgICAgICBjcmVhdGVkQXQ6IG5vdyxcbiAgICAgICAgdXBkYXRlZEF0OiBub3csXG4gICAgICAgIGNyZWF0ZWRCeTogdGhpcy5hY3RvcklkLFxuICAgICAgICB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCxcbiAgICAgIH07XG4gICAgICB0aGlzLmluc2VydEl0ZW1Sb3coaXRlbSk7XG4gICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdpdGVtJywgaWQsIHRoaXMuaXRlbVRvUmVjb3JkKGl0ZW0pKTtcbiAgICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsICdjcmVhdGVkJywgbnVsbCwgbnVsbCwgaXRlbS50aXRsZSk7XG4gICAgICByZXR1cm4gaXRlbTtcbiAgICB9KTtcbiAgICBjb25zdCBpdGVtID0gdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaXRlbS5pZCB9KTtcbiAgICByZXR1cm4gaXRlbTtcbiAgfVxuXG4gIHByaXZhdGUgaXRlbVRvUmVjb3JkKGl0ZW06IFdvcmtJdGVtKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICAgIHJldHVybiB7IC4uLml0ZW0sIHRhZ3M6IGl0ZW0udGFncywgZXh0cmE6IGl0ZW0uZXh0cmEgfTtcbiAgfVxuXG4gIHByaXZhdGUgaW5zZXJ0SXRlbVJvdyhpOiBXb3JrSXRlbSk6IHZvaWQge1xuICAgIHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKFxuICAgICAgICBgSU5TRVJUIElOVE8gaXRlbXMoaWQsIGlkZW50LCB0eXBlLCB0aXRsZSwgYm9keSwgYm9keV90ZXh0LCBzdGF0dXMsIHByaW9yaXR5LCBvd25lcl9pZCwgcmVwb3J0ZXJfaWQsXG4gICAgICAgICAgbWlsZXN0b25lX2lkLCByZWxlYXNlX2lkLCBwYXJlbnRfaWQsIHN0YXJ0X2RhdGUsIGR1ZV9kYXRlLCBjb21wbGV0ZWRfYXQsIGVmZm9ydCwgY29uZmlkZW5jZSxcbiAgICAgICAgICByaXNrX2xldmVsLCBidXNpbmVzc192YWx1ZSwgbGVhZGVyc2hpcF92aXNpYmxlLCBwcm9ncmVzcywgdGFncywgZXh0cmEsIGFyY2hpdmVkLCBzYW1wbGUsIGRlbGV0ZWQsXG4gICAgICAgICAgY3JlYXRlZF9hdCwgdXBkYXRlZF9hdCwgY3JlYXRlZF9ieSwgdXBkYXRlZF9ieSlcbiAgICAgICAgIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sMCw/LD8sPyw/KWAsXG4gICAgICApXG4gICAgICAucnVuKFxuICAgICAgICBpLmlkLCBpLmlkZW50LCBpLnR5cGUsIGkudGl0bGUsIGkuYm9keSwgaS5ib2R5VGV4dCwgaS5zdGF0dXMsIGkucHJpb3JpdHksIGkub3duZXJJZCwgaS5yZXBvcnRlcklkLFxuICAgICAgICBpLm1pbGVzdG9uZUlkLCBpLnJlbGVhc2VJZCwgaS5wYXJlbnRJZCwgaS5zdGFydERhdGUsIGkuZHVlRGF0ZSwgaS5jb21wbGV0ZWRBdCwgaS5lZmZvcnQsIGkuY29uZmlkZW5jZSxcbiAgICAgICAgaS5yaXNrTGV2ZWwsIGkuYnVzaW5lc3NWYWx1ZSwgaS5sZWFkZXJzaGlwVmlzaWJsZSwgaS5wcm9ncmVzcywgSlNPTi5zdHJpbmdpZnkoaS50YWdzKSwgSlNPTi5zdHJpbmdpZnkoaS5leHRyYSksXG4gICAgICAgIGkuYXJjaGl2ZWQsIGkuc2FtcGxlLCBpLmNyZWF0ZWRBdCwgaS51cGRhdGVkQXQsIGkuY3JlYXRlZEJ5LCBpLnVwZGF0ZWRCeSxcbiAgICAgICk7XG4gIH1cblxuICB1cGRhdGVJdGVtKGlkOiBzdHJpbmcsIGZpZWxkczogUGFydGlhbDxXb3JrSXRlbT4pOiBXb3JrSXRlbSB8IG51bGwge1xuICAgIGNvbnN0IGJlZm9yZSA9IHRoaXMuZ2V0SXRlbShpZCk7XG4gICAgaWYgKCFiZWZvcmUpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IGNoYW5nZWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoZmllbGRzKSkge1xuICAgICAgaWYgKCEoayBpbiBJVEVNX0NPTFMpIHx8IGsgPT09ICdkZWxldGVkJykgY29udGludWU7XG4gICAgICBjb25zdCBwcmV2ID0gKGJlZm9yZSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrXTtcbiAgICAgIGNvbnN0IHNhbWUgPSBKU09OX0lURU1fRklFTERTLmhhcyhrKSA/IEpTT04uc3RyaW5naWZ5KHByZXYpID09PSBKU09OLnN0cmluZ2lmeSh2KSA6IHByZXYgPT09IHY7XG4gICAgICBpZiAoIXNhbWUpIGNoYW5nZWRba10gPSB2O1xuICAgIH1cbiAgICBpZiAoT2JqZWN0LmtleXMoY2hhbmdlZCkubGVuZ3RoID09PSAwKSByZXR1cm4gYmVmb3JlO1xuXG4gICAgLy8gU3RhdHVzIHRyYW5zaXRpb25zIG1haW50YWluIGNvbXBsZXRlZEF0IGF1dG9tYXRpY2FsbHkuXG4gICAgaWYgKCdzdGF0dXMnIGluIGNoYW5nZWQpIHtcbiAgICAgIGNvbnN0IHRlcm1pbmFsTm93ID0gVEVSTUlOQUxfU1RBVFVTRVMuaGFzKFN0cmluZyhjaGFuZ2VkLnN0YXR1cykpO1xuICAgICAgY29uc3QgdGVybWluYWxCZWZvcmUgPSBURVJNSU5BTF9TVEFUVVNFUy5oYXMoYmVmb3JlLnN0YXR1cyk7XG4gICAgICBpZiAodGVybWluYWxOb3cgJiYgIXRlcm1pbmFsQmVmb3JlKSBjaGFuZ2VkLmNvbXBsZXRlZEF0ID0gdGhpcy5ub3coKTtcbiAgICAgIGlmICghdGVybWluYWxOb3cgJiYgdGVybWluYWxCZWZvcmUpIGNoYW5nZWQuY29tcGxldGVkQXQgPSBudWxsO1xuICAgIH1cbiAgICBjaGFuZ2VkLnVwZGF0ZWRBdCA9IHRoaXMubm93KCk7XG4gICAgY2hhbmdlZC51cGRhdGVkQnkgPSB0aGlzLmFjdG9ySWQ7XG5cbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoaWQsIGNoYW5nZWQpO1xuICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGlkLCBjaGFuZ2VkKTtcbiAgICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKGNoYW5nZWQpKSB7XG4gICAgICAgIGlmIChrID09PSAndXBkYXRlZEF0JyB8fCBrID09PSAndXBkYXRlZEJ5JykgY29udGludWU7XG4gICAgICAgIGlmIChrID09PSAnYm9keScgfHwgayA9PT0gJ2JvZHlUZXh0JykgY29udGludWU7IC8vIGJvZHkgZWRpdHMgbG9nZ2VkIGFzIG9uZSAnZWRpdGVkJyBlbnRyeVxuICAgICAgICB0aGlzLmxvZ0FjdGl2aXR5KGlkLCAndXBkYXRlZCcsIGssIChiZWZvcmUgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba10sIEpTT05fSVRFTV9GSUVMRFMuaGFzKGspID8gSlNPTi5zdHJpbmdpZnkodikgOiB2KTtcbiAgICAgIH1cbiAgICAgIGlmICgnYm9keScgaW4gY2hhbmdlZCkgdGhpcy5sb2dBY3Rpdml0eShpZCwgJ2VkaXRlZCcsICdib2R5Jyk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaWQgfSk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0SXRlbShpZCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5SXRlbUZpZWxkcyhpZDogc3RyaW5nLCBmaWVsZHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZCB7XG4gICAgY29uc3Qgc2V0czogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCB2YWxzOiB1bmtub3duW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XG4gICAgICBjb25zdCBjb2wgPSBJVEVNX0NPTFNba107XG4gICAgICBpZiAoIWNvbCkgY29udGludWU7XG4gICAgICBzZXRzLnB1c2goYCR7Y29sfT0/YCk7XG4gICAgICB2YWxzLnB1c2goSlNPTl9JVEVNX0ZJRUxEUy5oYXMoaykgPyBKU09OLnN0cmluZ2lmeSh2KSA6IHYpO1xuICAgIH1cbiAgICBpZiAoc2V0cy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICB2YWxzLnB1c2goaWQpO1xuICAgIHRoaXMuZGIucHJlcGFyZShgVVBEQVRFIGl0ZW1zIFNFVCAke3NldHMuam9pbignLCAnKX0gV0hFUkUgaWQ9P2ApLnJ1biguLi52YWxzKTtcbiAgfVxuXG4gIGFyY2hpdmVJdGVtKGlkOiBzdHJpbmcsIGFyY2hpdmVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy51cGRhdGVJdGVtKGlkLCB7IGFyY2hpdmVkOiBhcmNoaXZlZCA/IDEgOiAwIH0gYXMgUGFydGlhbDxXb3JrSXRlbT4pO1xuICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsIGFyY2hpdmVkID8gJ2FyY2hpdmVkJyA6ICdyZXN0b3JlZCcpO1xuICB9XG5cbiAgZGVsZXRlSXRlbShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGl0ZW1zIFNFVCBkZWxldGVkPTEsIHVwZGF0ZWRfYXQ9PywgdXBkYXRlZF9ieT0/IFdIRVJFIGlkPT8nKS5ydW4odGhpcy5ub3coKSwgdGhpcy5hY3RvcklkLCBpZCk7XG4gICAgICB0aGlzLmxvY2FsT3AoJ2l0ZW0nLCBpZCwgJ2RlbGV0ZScsIHt9KTtcbiAgICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsICdkZWxldGVkJyk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2l0ZW0nLCBlbnRpdHlJZDogaWQgfSk7XG4gIH1cblxuICBnZXRJdGVtKGlkOiBzdHJpbmcpOiBXb3JrSXRlbSB8IG51bGwge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBpdGVtcyBXSEVSRSBpZD0/IEFORCBkZWxldGVkPTAnKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICAgIHJldHVybiByb3cgPyByb3dUb0l0ZW0ocm93KSA6IG51bGw7XG4gIH1cblxuICBnZXRJdGVtQnlJZGVudChpZGVudDogc3RyaW5nKTogV29ya0l0ZW0gfCBudWxsIHtcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PyBDT0xMQVRFIE5PQ0FTRSBBTkQgZGVsZXRlZD0wJykuZ2V0KGlkZW50KSBhc1xuICAgICAgfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgICAgfCB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHJvdyA/IHJvd1RvSXRlbShyb3cpIDogbnVsbDtcbiAgfVxuXG4gIGxpc3RJdGVtcyhmaWx0ZXI6IEl0ZW1GaWx0ZXIgPSB7fSwgc29ydDogSXRlbVNvcnQgPSB7IGZpZWxkOiAndXBkYXRlZEF0JywgZGlyOiAnZGVzYycgfSwgbGltaXQgPSA1MDAsIG9mZnNldCA9IDApOiBXb3JrSXRlbVtdIHtcbiAgICBjb25zdCB3aGVyZTogc3RyaW5nW10gPSBbJ2RlbGV0ZWQ9MCddO1xuICAgIGNvbnN0IHZhbHM6IHVua25vd25bXSA9IFtdO1xuICAgIGlmIChmaWx0ZXIuYXJjaGl2ZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgd2hlcmUucHVzaCgnYXJjaGl2ZWQ9PycpO1xuICAgICAgdmFscy5wdXNoKGZpbHRlci5hcmNoaXZlZCA/IDEgOiAwKTtcbiAgICB9IGVsc2Ugd2hlcmUucHVzaCgnYXJjaGl2ZWQ9MCcpO1xuICAgIGlmIChmaWx0ZXIudHlwZXM/Lmxlbmd0aCkge1xuICAgICAgd2hlcmUucHVzaChgdHlwZSBJTiAoJHtmaWx0ZXIudHlwZXMubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcbiAgICAgIHZhbHMucHVzaCguLi5maWx0ZXIudHlwZXMpO1xuICAgIH1cbiAgICBpZiAoZmlsdGVyLnN0YXR1c2VzPy5sZW5ndGgpIHtcbiAgICAgIHdoZXJlLnB1c2goYHN0YXR1cyBJTiAoJHtmaWx0ZXIuc3RhdHVzZXMubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcbiAgICAgIHZhbHMucHVzaCguLi5maWx0ZXIuc3RhdHVzZXMpO1xuICAgIH1cbiAgICBpZiAoZmlsdGVyLnByaW9yaXRpZXM/Lmxlbmd0aCkge1xuICAgICAgd2hlcmUucHVzaChgcHJpb3JpdHkgSU4gKCR7ZmlsdGVyLnByaW9yaXRpZXMubWFwKCgpID0+ICc/Jykuam9pbignLCcpfSlgKTtcbiAgICAgIHZhbHMucHVzaCguLi5maWx0ZXIucHJpb3JpdGllcyk7XG4gICAgfVxuICAgIGlmIChmaWx0ZXIub3duZXJJZHM/Lmxlbmd0aCkge1xuICAgICAgY29uc3Qgbm9uTnVsbCA9IGZpbHRlci5vd25lcklkcy5maWx0ZXIoKG8pID0+IG8gIT09IG51bGwpO1xuICAgICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgICBpZiAobm9uTnVsbC5sZW5ndGgpIHtcbiAgICAgICAgcGFydHMucHVzaChgb3duZXJfaWQgSU4gKCR7bm9uTnVsbC5tYXAoKCkgPT4gJz8nKS5qb2luKCcsJyl9KWApO1xuICAgICAgICB2YWxzLnB1c2goLi4ubm9uTnVsbCk7XG4gICAgICB9XG4gICAgICBpZiAoZmlsdGVyLm93bmVySWRzLmluY2x1ZGVzKG51bGwpKSBwYXJ0cy5wdXNoKCdvd25lcl9pZCBJUyBOVUxMJyk7XG4gICAgICB3aGVyZS5wdXNoKGAoJHtwYXJ0cy5qb2luKCcgT1IgJyl9KWApO1xuICAgIH1cbiAgICBpZiAoZmlsdGVyLm1pbGVzdG9uZUlkKSB7IHdoZXJlLnB1c2goJ21pbGVzdG9uZV9pZD0/Jyk7IHZhbHMucHVzaChmaWx0ZXIubWlsZXN0b25lSWQpOyB9XG4gICAgaWYgKGZpbHRlci5yZWxlYXNlSWQpIHsgd2hlcmUucHVzaCgncmVsZWFzZV9pZD0/Jyk7IHZhbHMucHVzaChmaWx0ZXIucmVsZWFzZUlkKTsgfVxuICAgIGlmIChmaWx0ZXIucGFyZW50SWQpIHsgd2hlcmUucHVzaCgncGFyZW50X2lkPT8nKTsgdmFscy5wdXNoKGZpbHRlci5wYXJlbnRJZCk7IH1cbiAgICBpZiAoZmlsdGVyLnRhZykgeyB3aGVyZS5wdXNoKFwidGFncyBMSUtFID9cIik7IHZhbHMucHVzaChgJSR7SlNPTi5zdHJpbmdpZnkoZmlsdGVyLnRhZyl9JWApOyB9XG4gICAgaWYgKGZpbHRlci5vdmVyZHVlKSB7IHdoZXJlLnB1c2goXCJkdWVfZGF0ZSBJUyBOT1QgTlVMTCBBTkQgZHVlX2RhdGUgPCBkYXRlKCdub3cnKSBBTkQgY29tcGxldGVkX2F0IElTIE5VTExcIik7IH1cbiAgICBpZiAoZmlsdGVyLmR1ZVdpdGhpbkRheXMgIT0gbnVsbCkge1xuICAgICAgd2hlcmUucHVzaChcImR1ZV9kYXRlIElTIE5PVCBOVUxMIEFORCBkdWVfZGF0ZSA8PSBkYXRlKCdub3cnLCA/KSBBTkQgY29tcGxldGVkX2F0IElTIE5VTExcIik7XG4gICAgICB2YWxzLnB1c2goYCske2ZpbHRlci5kdWVXaXRoaW5EYXlzfSBkYXlzYCk7XG4gICAgfVxuICAgIGlmIChmaWx0ZXIubGVhZGVyc2hpcFZpc2libGUpIHdoZXJlLnB1c2goJ2xlYWRlcnNoaXBfdmlzaWJsZT0xJyk7XG4gICAgaWYgKGZpbHRlci51cGRhdGVkU2luY2UpIHsgd2hlcmUucHVzaCgndXBkYXRlZF9hdCA+PSA/Jyk7IHZhbHMucHVzaChmaWx0ZXIudXBkYXRlZFNpbmNlKTsgfVxuICAgIGlmIChmaWx0ZXIuc2FtcGxlICE9PSB1bmRlZmluZWQpIHsgd2hlcmUucHVzaCgnc2FtcGxlPT8nKTsgdmFscy5wdXNoKGZpbHRlci5zYW1wbGUgPyAxIDogMCk7IH1cbiAgICBpZiAoZmlsdGVyLnRleHQpIHtcbiAgICAgIHdoZXJlLnB1c2goJ3Jvd2lkIElOIChTRUxFQ1Qgcm93aWQgRlJPTSBpdGVtc19mdHMgV0hFUkUgaXRlbXNfZnRzIE1BVENIID8pJyk7XG4gICAgICB2YWxzLnB1c2goZnRzUXVlcnkoZmlsdGVyLnRleHQpKTtcbiAgICB9XG5cbiAgICBjb25zdCBzb3J0Q29sOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgaWRlbnQ6ICdpZGVudCcsXG4gICAgICB0aXRsZTogJ3RpdGxlIENPTExBVEUgTk9DQVNFJyxcbiAgICAgIHN0YXR1czogJ3N0YXR1cycsXG4gICAgICBwcmlvcml0eTogXCJDQVNFIHByaW9yaXR5IFdIRU4gJ3VyZ2VudCcgVEhFTiAwIFdIRU4gJ2hpZ2gnIFRIRU4gMSBXSEVOICdtZWRpdW0nIFRIRU4gMiBXSEVOICdsb3cnIFRIRU4gMyBFTFNFIDQgRU5EXCIsXG4gICAgICBkdWVEYXRlOiAnZHVlX2RhdGUgSVMgTlVMTCwgZHVlX2RhdGUnLFxuICAgICAgY3JlYXRlZEF0OiAnY3JlYXRlZF9hdCcsXG4gICAgICB1cGRhdGVkQXQ6ICd1cGRhdGVkX2F0JyxcbiAgICAgIG1hbnVhbDogJ3VwZGF0ZWRfYXQnLFxuICAgIH07XG4gICAgY29uc3Qgb3JkZXIgPSBgJHtzb3J0Q29sW3NvcnQuZmllbGRdID8/ICd1cGRhdGVkX2F0J30gJHtzb3J0LmRpciA9PT0gJ2FzYycgPyAnQVNDJyA6ICdERVNDJ31gO1xuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXG4gICAgICAucHJlcGFyZShgU0VMRUNUICogRlJPTSBpdGVtcyBXSEVSRSAke3doZXJlLmpvaW4oJyBBTkQgJyl9IE9SREVSIEJZICR7b3JkZXJ9IExJTUlUID8gT0ZGU0VUID9gKVxuICAgICAgLmFsbCguLi52YWxzLCBsaW1pdCwgb2Zmc2V0KSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIHJldHVybiByb3dzLm1hcChyb3dUb0l0ZW0pO1xuICB9XG5cbiAgc2VhcmNoKHRleHQ6IHN0cmluZywgbGltaXQgPSAzMCk6IFNlYXJjaFJlc3VsdFtdIHtcbiAgICBpZiAoIXRleHQudHJpbSgpKSByZXR1cm4gW107XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKFxuICAgICAgICBgU0VMRUNUIGl0ZW1zLiosIHNuaXBwZXQoaXRlbXNfZnRzLCAyLCAnPDwnLCAnPj4nLCAnXHUyMDI2JywgMTIpIEFTIHNuaXAsIHJhbmsgQVMgc2NvcmVcbiAgICAgICAgIEZST00gaXRlbXNfZnRzIEpPSU4gaXRlbXMgT04gaXRlbXMucm93aWQgPSBpdGVtc19mdHMucm93aWRcbiAgICAgICAgIFdIRVJFIGl0ZW1zX2Z0cyBNQVRDSCA/IEFORCBpdGVtcy5kZWxldGVkPTAgQU5EIGl0ZW1zLmFyY2hpdmVkPTBcbiAgICAgICAgIE9SREVSIEJZIHJhbmsgTElNSVQgP2AsXG4gICAgICApXG4gICAgICAuYWxsKGZ0c1F1ZXJ5KHRleHQpLCBsaW1pdCkgYXMgKFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYgeyBzbmlwOiBzdHJpbmc7IHNjb3JlOiBudW1iZXIgfSlbXTtcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7IGl0ZW06IHJvd1RvSXRlbShyKSwgc25pcHBldDogci5zbmlwLCBzY29yZTogci5zY29yZSB9KSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGxpbmtzIC0tLS0tLS0tLS1cbiAgYWRkTGluayhmcm9tSWQ6IHN0cmluZywgdG9JZDogc3RyaW5nLCBraW5kOiBMaW5rS2luZCk6IEl0ZW1MaW5rIHwgbnVsbCB7XG4gICAgaWYgKGZyb21JZCA9PT0gdG9JZCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUICogRlJPTSBsaW5rcyBXSEVSRSBmcm9tX2lkPT8gQU5EIHRvX2lkPT8gQU5EIGtpbmQ9PycpXG4gICAgICAuZ2V0KGZyb21JZCwgdG9JZCwga2luZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gICAgaWYgKGV4aXN0aW5nICYmICFleGlzdGluZy5kZWxldGVkKSByZXR1cm4gcm93VG9MaW5rKGV4aXN0aW5nKTtcbiAgICBjb25zdCBsaW5rOiBJdGVtTGluayA9IHtcbiAgICAgIGlkOiBleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5pZCkgOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgZnJvbUlkLFxuICAgICAgdG9JZCxcbiAgICAgIGtpbmQsXG4gICAgICBjcmVhdGVkQXQ6IHRoaXMubm93KCksXG4gICAgICBjcmVhdGVkQnk6IHRoaXMuYWN0b3JJZCxcbiAgICB9O1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgbGlua3MgU0VUIGRlbGV0ZWQ9MCBXSEVSRSBpZD0/JykucnVuKGxpbmsuaWQpO1xuICAgICAgICB0aGlzLmxvY2FsU2V0KCdsaW5rJywgbGluay5pZCwgeyBkZWxldGVkOiAwIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBsaW5rcyhpZCwgZnJvbV9pZCwgdG9faWQsIGtpbmQsIGRlbGV0ZWQsIGNyZWF0ZWRfYXQsIGNyZWF0ZWRfYnkpIFZBTFVFUyg/LD8sPyw/LDAsPyw/KScpXG4gICAgICAgICAgLnJ1bihsaW5rLmlkLCBmcm9tSWQsIHRvSWQsIGtpbmQsIGxpbmsuY3JlYXRlZEF0LCBsaW5rLmNyZWF0ZWRCeSk7XG4gICAgICAgIHRoaXMubG9jYWxDcmVhdGUoJ2xpbmsnLCBsaW5rLmlkLCB7IC4uLmxpbmsgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLmxvZ0FjdGl2aXR5KGZyb21JZCwgJ2xpbmsnLCBraW5kLCBudWxsLCB0b0lkKTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnbGluaycsIGVudGl0eUlkOiBsaW5rLmlkIH0pO1xuICAgIHJldHVybiBsaW5rO1xuICB9XG5cbiAgcmVtb3ZlTGluayhpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgZnJvbV9pZCwga2luZCwgdG9faWQgRlJPTSBsaW5rcyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhc1xuICAgICAgfCB7IGZyb21faWQ6IHN0cmluZzsga2luZDogc3RyaW5nOyB0b19pZDogc3RyaW5nIH1cbiAgICAgIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBsaW5rcyBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT8nKS5ydW4oaWQpO1xuICAgICAgdGhpcy5sb2NhbFNldCgnbGluaycsIGlkLCB7IGRlbGV0ZWQ6IDEgfSk7XG4gICAgICBpZiAocm93KSB0aGlzLmxvZ0FjdGl2aXR5KHJvdy5mcm9tX2lkLCAndW5saW5rJywgcm93LmtpbmQsIHJvdy50b19pZCwgbnVsbCk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2xpbmsnLCBlbnRpdHlJZDogaWQgfSk7XG4gIH1cblxuICBsaW5rc0ZvcihpdGVtSWQ6IHN0cmluZyk6IHsgbGluazogSXRlbUxpbms7IGRpcmVjdGlvbjogJ291dCcgfCAnaW4nOyBvdGhlcjogV29ya0l0ZW0gfVtdIHtcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gbGlua3MgV0hFUkUgKGZyb21faWQ9PyBPUiB0b19pZD0/KSBBTkQgZGVsZXRlZD0wJylcbiAgICAgIC5hbGwoaXRlbUlkLCBpdGVtSWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XG4gICAgY29uc3Qgb3V0OiB7IGxpbms6IEl0ZW1MaW5rOyBkaXJlY3Rpb246ICdvdXQnIHwgJ2luJzsgb3RoZXI6IFdvcmtJdGVtIH1bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgciBvZiByb3dzKSB7XG4gICAgICBjb25zdCBsaW5rID0gcm93VG9MaW5rKHIpO1xuICAgICAgY29uc3QgZGlyZWN0aW9uID0gbGluay5mcm9tSWQgPT09IGl0ZW1JZCA/ICdvdXQnIDogJ2luJztcbiAgICAgIGNvbnN0IG90aGVyID0gdGhpcy5nZXRJdGVtKGRpcmVjdGlvbiA9PT0gJ291dCcgPyBsaW5rLnRvSWQgOiBsaW5rLmZyb21JZCk7XG4gICAgICBpZiAob3RoZXIpIG91dC5wdXNoKHsgbGluaywgZGlyZWN0aW9uLCBvdGhlciB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gY29tbWVudHMgLS0tLS0tLS0tLVxuICBhZGRDb21tZW50KGl0ZW1JZDogc3RyaW5nLCBib2R5OiBzdHJpbmcsIGJvZHlUZXh0OiBzdHJpbmcpOiBDb21tZW50IHtcbiAgICBjb25zdCBjOiBDb21tZW50ID0ge1xuICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICBpdGVtSWQsXG4gICAgICBhdXRob3JJZDogdGhpcy5hY3RvcklkLFxuICAgICAgYm9keSxcbiAgICAgIGJvZHlUZXh0LFxuICAgICAgY3JlYXRlZEF0OiB0aGlzLm5vdygpLFxuICAgICAgdXBkYXRlZEF0OiBudWxsLFxuICAgICAgZGVsZXRlZDogMCxcbiAgICB9O1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiXG4gICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBjb21tZW50cyhpZCwgaXRlbV9pZCwgYXV0aG9yX2lkLCBib2R5LCBib2R5X3RleHQsIGNyZWF0ZWRfYXQsIHVwZGF0ZWRfYXQsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LDApJylcbiAgICAgICAgLnJ1bihjLmlkLCBjLml0ZW1JZCwgYy5hdXRob3JJZCwgYy5ib2R5LCBjLmJvZHlUZXh0LCBjLmNyZWF0ZWRBdCwgYy51cGRhdGVkQXQpO1xuICAgICAgdGhpcy5sb2NhbENyZWF0ZSgnY29tbWVudCcsIGMuaWQsIHsgLi4uYyB9KTtcbiAgICAgIHRoaXMubG9nQWN0aXZpdHkoaXRlbUlkLCAnY29tbWVudCcsIG51bGwsIG51bGwsIGJvZHlUZXh0LnNsaWNlKDAsIDIwMCkpO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdjb21tZW50JywgZW50aXR5SWQ6IGMuaWQgfSk7XG4gICAgcmV0dXJuIGM7XG4gIH1cblxuICB1cGRhdGVDb21tZW50KGlkOiBzdHJpbmcsIGJvZHk6IHN0cmluZywgYm9keVRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGZpZWxkcyA9IHsgYm9keSwgYm9keVRleHQsIHVwZGF0ZWRBdDogdGhpcy5ub3coKSB9O1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBjb21tZW50cyBTRVQgYm9keT0/LCBib2R5X3RleHQ9PywgdXBkYXRlZF9hdD0/IFdIRVJFIGlkPT8nKS5ydW4oYm9keSwgYm9keVRleHQsIGZpZWxkcy51cGRhdGVkQXQsIGlkKTtcbiAgICAgIHRoaXMubG9jYWxTZXQoJ2NvbW1lbnQnLCBpZCwgZmllbGRzKTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnY29tbWVudCcsIGVudGl0eUlkOiBpZCB9KTtcbiAgfVxuXG4gIGRlbGV0ZUNvbW1lbnQoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBjb21tZW50cyBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT8nKS5ydW4oaWQpO1xuICAgICAgdGhpcy5sb2NhbFNldCgnY29tbWVudCcsIGlkLCB7IGRlbGV0ZWQ6IDEgfSk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2NvbW1lbnQnLCBlbnRpdHlJZDogaWQgfSk7XG4gIH1cblxuICBjb21tZW50c0ZvcihpdGVtSWQ6IHN0cmluZyk6IENvbW1lbnRbXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIGNvbW1lbnRzIFdIRVJFIGl0ZW1faWQ9PyBBTkQgZGVsZXRlZD0wIE9SREVSIEJZIGNyZWF0ZWRfYXQgQVNDJylcbiAgICAgIC5hbGwoaXRlbUlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcbiAgICAgIGlkOiBTdHJpbmcoci5pZCksXG4gICAgICBpdGVtSWQ6IFN0cmluZyhyLml0ZW1faWQpLFxuICAgICAgYXV0aG9ySWQ6IFN0cmluZyhyLmF1dGhvcl9pZCksXG4gICAgICBib2R5OiBTdHJpbmcoci5ib2R5KSxcbiAgICAgIGJvZHlUZXh0OiBTdHJpbmcoci5ib2R5X3RleHQpLFxuICAgICAgY3JlYXRlZEF0OiBTdHJpbmcoci5jcmVhdGVkX2F0KSxcbiAgICAgIHVwZGF0ZWRBdDogci51cGRhdGVkX2F0ID8gU3RyaW5nKHIudXBkYXRlZF9hdCkgOiBudWxsLFxuICAgICAgZGVsZXRlZDogMCxcbiAgICB9KSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIHZlcnNpb25zIC0tLS0tLS0tLS1cbiAgc2F2ZVZlcnNpb24oaXRlbUlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRJdGVtKGl0ZW1JZCk7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgY29uc3QgbGFzdCA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIE1BWCh2ZXJzaW9uKSBBUyB2IEZST00gaXRlbV92ZXJzaW9ucyBXSEVSRSBpdGVtX2lkPT8nKS5nZXQoaXRlbUlkKSBhcyB7IHY6IG51bWJlciB8IG51bGwgfTtcbiAgICB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gaXRlbV92ZXJzaW9ucyhpZCwgaXRlbV9pZCwgdmVyc2lvbiwgdGl0bGUsIGJvZHksIHNhdmVkX2J5LCBzYXZlZF9hdCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8pJylcbiAgICAgIC5ydW4oY3J5cHRvLnJhbmRvbVVVSUQoKSwgaXRlbUlkLCAobGFzdC52ID8/IDApICsgMSwgaXRlbS50aXRsZSwgaXRlbS5ib2R5LCB0aGlzLmFjdG9ySWQsIHRoaXMubm93KCkpO1xuICB9XG5cbiAgdmVyc2lvbnNGb3IoaXRlbUlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBpZCwgaXRlbV9pZCBBUyBpdGVtSWQsIHZlcnNpb24sIHRpdGxlLCBib2R5LCBzYXZlZF9ieSBBUyBzYXZlZEJ5LCBzYXZlZF9hdCBBUyBzYXZlZEF0IEZST00gaXRlbV92ZXJzaW9ucyBXSEVSRSBpdGVtX2lkPT8gT1JERVIgQlkgdmVyc2lvbiBERVNDJylcbiAgICAgIC5hbGwoaXRlbUlkKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gdXNlcnMgLS0tLS0tLS0tLVxuICB1cHNlcnRVc2VyKHU6IHsgaWQ6IHN0cmluZzsgbmFtZTogc3RyaW5nOyBpbml0aWFsczogc3RyaW5nOyBjb2xvcjogc3RyaW5nIH0pOiBVc2VyIHtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSB1c2VycyBXSEVSRSBpZD0/JykuZ2V0KHUuaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHVzZXI6IFVzZXIgPSB7XG4gICAgICAuLi51LFxuICAgICAgY3JlYXRlZEF0OiBleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5jcmVhdGVkX2F0KSA6IHRoaXMubm93KCksXG4gICAgfTtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5kYlxuICAgICAgICAucHJlcGFyZShcbiAgICAgICAgICBgSU5TRVJUIElOVE8gdXNlcnMoaWQsIG5hbWUsIGluaXRpYWxzLCBjb2xvciwgY3JlYXRlZF9hdCkgVkFMVUVTKD8sPyw/LD8sPylcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT1leGNsdWRlZC5uYW1lLCBpbml0aWFscz1leGNsdWRlZC5pbml0aWFscywgY29sb3I9ZXhjbHVkZWQuY29sb3JgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4odXNlci5pZCwgdXNlci5uYW1lLCB1c2VyLmluaXRpYWxzLCB1c2VyLmNvbG9yLCB1c2VyLmNyZWF0ZWRBdCk7XG4gICAgICBpZiAoIWV4aXN0aW5nKSB0aGlzLmxvY2FsQ3JlYXRlKCd1c2VyJywgdXNlci5pZCwgeyAuLi51c2VyIH0pO1xuICAgICAgZWxzZSB0aGlzLmxvY2FsU2V0KCd1c2VyJywgdXNlci5pZCwgeyBuYW1lOiB1c2VyLm5hbWUsIGluaXRpYWxzOiB1c2VyLmluaXRpYWxzLCBjb2xvcjogdXNlci5jb2xvciB9KTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHJldHVybiB1c2VyO1xuICB9XG5cbiAgbGlzdFVzZXJzKCk6IFVzZXJbXSB7XG4gICAgcmV0dXJuICh0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBjcmVhdGVkX2F0IEFTIGNyZWF0ZWRBdCBGUk9NIHVzZXJzJykuYWxsKCkgYXMgVXNlcltdKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gbWlsZXN0b25lcyAvIHJlbGVhc2VzIC0tLS0tLS0tLS1cbiAgdXBzZXJ0TWlsZXN0b25lKG06IFBhcnRpYWw8TWlsZXN0b25lPiAmIHsgbmFtZTogc3RyaW5nIH0pOiBNaWxlc3RvbmUge1xuICAgIGNvbnN0IGlkID0gbS5pZCA/PyBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgaWQ9PycpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgcmVjOiBNaWxlc3RvbmUgPSB7XG4gICAgICBpZCxcbiAgICAgIG5hbWU6IG0ubmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBtLmRlc2NyaXB0aW9uID8/IChleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5kZXNjcmlwdGlvbikgOiAnJyksXG4gICAgICB0YXJnZXREYXRlOiBtLnRhcmdldERhdGUgPz8gKGV4aXN0aW5nID8gKGV4aXN0aW5nLnRhcmdldF9kYXRlIGFzIHN0cmluZyB8IG51bGwpIDogbnVsbCksXG4gICAgICBzdGF0dXM6IChtLnN0YXR1cyA/PyAoZXhpc3RpbmcgPyBleGlzdGluZy5zdGF0dXMgOiAncGxhbm5lZCcpKSBhcyBNaWxlc3RvbmVbJ3N0YXR1cyddLFxuICAgICAgc29ydDogbS5zb3J0ID8/IChleGlzdGluZyA/IE51bWJlcihleGlzdGluZy5zb3J0KSA6IDApLFxuICAgICAgc2FtcGxlOiBtLnNhbXBsZSA/PyAoZXhpc3RpbmcgPyAoTnVtYmVyKGV4aXN0aW5nLnNhbXBsZSkgYXMgMCB8IDEpIDogMCksXG4gICAgfTtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5kYlxuICAgICAgICAucHJlcGFyZShcbiAgICAgICAgICBgSU5TRVJUIElOVE8gbWlsZXN0b25lcyhpZCwgbmFtZSwgZGVzY3JpcHRpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIHNvcnQsIHNhbXBsZSwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sMClcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCBkZXNjcmlwdGlvbj0/LCB0YXJnZXRfZGF0ZT0/LCBzdGF0dXM9Pywgc29ydD0/LCBkZWxldGVkPTBgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4ocmVjLmlkLCByZWMubmFtZSwgcmVjLmRlc2NyaXB0aW9uLCByZWMudGFyZ2V0RGF0ZSwgcmVjLnN0YXR1cywgcmVjLnNvcnQsIHJlYy5zYW1wbGUsXG4gICAgICAgICAgICAgcmVjLm5hbWUsIHJlYy5kZXNjcmlwdGlvbiwgcmVjLnRhcmdldERhdGUsIHJlYy5zdGF0dXMsIHJlYy5zb3J0KTtcbiAgICAgIGlmICghZXhpc3RpbmcpIHRoaXMubG9jYWxDcmVhdGUoJ21pbGVzdG9uZScsIGlkLCB7IC4uLnJlYyB9KTtcbiAgICAgIGVsc2UgdGhpcy5sb2NhbFNldCgnbWlsZXN0b25lJywgaWQsIHsgbmFtZTogcmVjLm5hbWUsIGRlc2NyaXB0aW9uOiByZWMuZGVzY3JpcHRpb24sIHRhcmdldERhdGU6IHJlYy50YXJnZXREYXRlLCBzdGF0dXM6IHJlYy5zdGF0dXMsIHNvcnQ6IHJlYy5zb3J0IH0pO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdtaWxlc3RvbmUnLCBlbnRpdHlJZDogaWQgfSk7XG4gICAgcmV0dXJuIHJlYztcbiAgfVxuXG4gIGxpc3RNaWxlc3RvbmVzKCk6IE1pbGVzdG9uZVtdIHtcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgZGVsZXRlZD0wIE9SREVSIEJZIHNvcnQsIHRhcmdldF9kYXRlJykuYWxsKCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7XG4gICAgICBpZDogU3RyaW5nKHIuaWQpLCBuYW1lOiBTdHJpbmcoci5uYW1lKSwgZGVzY3JpcHRpb246IFN0cmluZyhyLmRlc2NyaXB0aW9uKSxcbiAgICAgIHRhcmdldERhdGU6IHIudGFyZ2V0X2RhdGUgPyBTdHJpbmcoci50YXJnZXRfZGF0ZSkgOiBudWxsLFxuICAgICAgc3RhdHVzOiByLnN0YXR1cyBhcyBNaWxlc3RvbmVbJ3N0YXR1cyddLCBzb3J0OiBOdW1iZXIoci5zb3J0KSwgc2FtcGxlOiBOdW1iZXIoci5zYW1wbGUpIGFzIDAgfCAxLFxuICAgIH0pKTtcbiAgfVxuXG4gIHVwc2VydFJlbGVhc2UobTogUGFydGlhbDxSZWxlYXNlPiAmIHsgbmFtZTogc3RyaW5nIH0pOiBSZWxlYXNlIHtcbiAgICBjb25zdCBpZCA9IG0uaWQgPz8gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSByZWxlYXNlcyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCByZWM6IFJlbGVhc2UgPSB7XG4gICAgICBpZCxcbiAgICAgIG5hbWU6IG0ubmFtZSxcbiAgICAgIHZlcnNpb246IG0udmVyc2lvbiA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3RpbmcudmVyc2lvbikgOiAnJyksXG4gICAgICB0YXJnZXREYXRlOiBtLnRhcmdldERhdGUgPz8gKGV4aXN0aW5nID8gKGV4aXN0aW5nLnRhcmdldF9kYXRlIGFzIHN0cmluZyB8IG51bGwpIDogbnVsbCksXG4gICAgICBzdGF0dXM6IChtLnN0YXR1cyA/PyAoZXhpc3RpbmcgPyBleGlzdGluZy5zdGF0dXMgOiAncGxhbm5lZCcpKSBhcyBSZWxlYXNlWydzdGF0dXMnXSxcbiAgICAgIGdvYWxzOiBtLmdvYWxzID8/IChleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5nb2FscykgOiAnJyksXG4gICAgICBub3RlczogbS5ub3RlcyA/PyAoZXhpc3RpbmcgPyBTdHJpbmcoZXhpc3Rpbmcubm90ZXMpIDogJycpLFxuICAgICAgc2FtcGxlOiBtLnNhbXBsZSA/PyAoZXhpc3RpbmcgPyAoTnVtYmVyKGV4aXN0aW5nLnNhbXBsZSkgYXMgMCB8IDEpIDogMCksXG4gICAgfTtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5kYlxuICAgICAgICAucHJlcGFyZShcbiAgICAgICAgICBgSU5TRVJUIElOVE8gcmVsZWFzZXMoaWQsIG5hbWUsIHZlcnNpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIGdvYWxzLCBub3Rlcywgc2FtcGxlLCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LDApXG4gICAgICAgICAgIE9OIENPTkZMSUNUKGlkKSBETyBVUERBVEUgU0VUIG5hbWU9PywgdmVyc2lvbj0/LCB0YXJnZXRfZGF0ZT0/LCBzdGF0dXM9PywgZ29hbHM9Pywgbm90ZXM9PywgZGVsZXRlZD0wYCxcbiAgICAgICAgKVxuICAgICAgICAucnVuKHJlYy5pZCwgcmVjLm5hbWUsIHJlYy52ZXJzaW9uLCByZWMudGFyZ2V0RGF0ZSwgcmVjLnN0YXR1cywgcmVjLmdvYWxzLCByZWMubm90ZXMsIHJlYy5zYW1wbGUsXG4gICAgICAgICAgICAgcmVjLm5hbWUsIHJlYy52ZXJzaW9uLCByZWMudGFyZ2V0RGF0ZSwgcmVjLnN0YXR1cywgcmVjLmdvYWxzLCByZWMubm90ZXMpO1xuICAgICAgaWYgKCFleGlzdGluZykgdGhpcy5sb2NhbENyZWF0ZSgncmVsZWFzZScsIGlkLCB7IC4uLnJlYyB9KTtcbiAgICAgIGVsc2UgdGhpcy5sb2NhbFNldCgncmVsZWFzZScsIGlkLCB7IG5hbWU6IHJlYy5uYW1lLCB2ZXJzaW9uOiByZWMudmVyc2lvbiwgdGFyZ2V0RGF0ZTogcmVjLnRhcmdldERhdGUsIHN0YXR1czogcmVjLnN0YXR1cywgZ29hbHM6IHJlYy5nb2Fscywgbm90ZXM6IHJlYy5ub3RlcyB9KTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAncmVsZWFzZScsIGVudGl0eUlkOiBpZCB9KTtcbiAgICByZXR1cm4gcmVjO1xuICB9XG5cbiAgbGlzdFJlbGVhc2VzKCk6IFJlbGVhc2VbXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSByZWxlYXNlcyBXSEVSRSBkZWxldGVkPTAgT1JERVIgQlkgdGFyZ2V0X2RhdGUnKS5hbGwoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcbiAgICAgIGlkOiBTdHJpbmcoci5pZCksIG5hbWU6IFN0cmluZyhyLm5hbWUpLCB2ZXJzaW9uOiBTdHJpbmcoci52ZXJzaW9uKSxcbiAgICAgIHRhcmdldERhdGU6IHIudGFyZ2V0X2RhdGUgPyBTdHJpbmcoci50YXJnZXRfZGF0ZSkgOiBudWxsLFxuICAgICAgc3RhdHVzOiByLnN0YXR1cyBhcyBSZWxlYXNlWydzdGF0dXMnXSwgZ29hbHM6IFN0cmluZyhyLmdvYWxzKSwgbm90ZXM6IFN0cmluZyhyLm5vdGVzKSxcbiAgICAgIHNhbXBsZTogTnVtYmVyKHIuc2FtcGxlKSBhcyAwIHwgMSxcbiAgICB9KSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIHNhdmVkIHZpZXdzIC0tLS0tLS0tLS1cbiAgc2F2ZVZpZXcodjogUGFydGlhbDxTYXZlZFZpZXc+ICYgeyBuYW1lOiBzdHJpbmc7IGNvbmZpZzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfSk6IFNhdmVkVmlldyB7XG4gICAgY29uc3QgaWQgPSB2LmlkID8/IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgY29uc3QgcmVjOiBTYXZlZFZpZXcgPSB7XG4gICAgICBpZCwgbmFtZTogdi5uYW1lLCBjb25maWc6IHYuY29uZmlnLCBwaW5uZWQ6IHYucGlubmVkID8/IDAsXG4gICAgICBjcmVhdGVkQnk6IHRoaXMuYWN0b3JJZCwgY3JlYXRlZEF0OiB0aGlzLm5vdygpLFxuICAgIH07XG4gICAgdGhpcy5kYlxuICAgICAgLnByZXBhcmUoXG4gICAgICAgIGBJTlNFUlQgSU5UTyBzYXZlZF92aWV3cyhpZCwgbmFtZSwgY29uZmlnLCBwaW5uZWQsIGNyZWF0ZWRfYnksIGNyZWF0ZWRfYXQsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPywwKVxuICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCBjb25maWc9PywgcGlubmVkPT8sIGRlbGV0ZWQ9MGAsXG4gICAgICApXG4gICAgICAucnVuKGlkLCByZWMubmFtZSwgSlNPTi5zdHJpbmdpZnkocmVjLmNvbmZpZyksIHJlYy5waW5uZWQsIHJlYy5jcmVhdGVkQnksIHJlYy5jcmVhdGVkQXQsXG4gICAgICAgICAgIHJlYy5uYW1lLCBKU09OLnN0cmluZ2lmeShyZWMuY29uZmlnKSwgcmVjLnBpbm5lZCk7XG4gICAgcmV0dXJuIHJlYztcbiAgfVxuXG4gIGxpc3RWaWV3cygpOiBTYXZlZFZpZXdbXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBzYXZlZF92aWV3cyBXSEVSRSBkZWxldGVkPTAgT1JERVIgQlkgcGlubmVkIERFU0MsIG5hbWUnKS5hbGwoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcbiAgICAgIGlkOiBTdHJpbmcoci5pZCksIG5hbWU6IFN0cmluZyhyLm5hbWUpLFxuICAgICAgY29uZmlnOiBKU09OLnBhcnNlKFN0cmluZyhyLmNvbmZpZykpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgICAgcGlubmVkOiBOdW1iZXIoci5waW5uZWQpIGFzIDAgfCAxLCBjcmVhdGVkQnk6IFN0cmluZyhyLmNyZWF0ZWRfYnkpLCBjcmVhdGVkQXQ6IFN0cmluZyhyLmNyZWF0ZWRfYXQpLFxuICAgIH0pKTtcbiAgfVxuXG4gIGRlbGV0ZVZpZXcoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIHNhdmVkX3ZpZXdzIFNFVCBkZWxldGVkPTEgV0hFUkUgaWQ9PycpLnJ1bihpZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGFjdGl2aXR5IC0tLS0tLS0tLS1cbiAgYWN0aXZpdHlGb3IoaXRlbUlkOiBzdHJpbmcgfCBudWxsLCBsaW1pdCA9IDEwMCkge1xuICAgIGlmIChpdGVtSWQpIHtcbiAgICAgIHJldHVybiB0aGlzLmRiXG4gICAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgaWQsIGl0ZW1faWQgQVMgaXRlbUlkLCBhY3Rvcl9pZCBBUyBhY3RvcklkLCBraW5kLCBmaWVsZCwgb2xkX3ZhbHVlIEFTIG9sZFZhbHVlLCBuZXdfdmFsdWUgQVMgbmV3VmFsdWUsIGF0IEZST00gYWN0aXZpdHkgV0hFUkUgaXRlbV9pZD0/IE9SREVSIEJZIGF0IERFU0MgTElNSVQgPycpXG4gICAgICAgIC5hbGwoaXRlbUlkLCBsaW1pdCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIGlkLCBpdGVtX2lkIEFTIGl0ZW1JZCwgYWN0b3JfaWQgQVMgYWN0b3JJZCwga2luZCwgZmllbGQsIG9sZF92YWx1ZSBBUyBvbGRWYWx1ZSwgbmV3X3ZhbHVlIEFTIG5ld1ZhbHVlLCBhdCBGUk9NIGFjdGl2aXR5IE9SREVSIEJZIGF0IERFU0MgTElNSVQgPycpXG4gICAgICAuYWxsKGxpbWl0KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gcmVtb3RlIG9wIGFwcGxpY2F0aW9uIC0tLS0tLS0tLS1cbiAgLyoqIEFwcGx5IGEgYmF0Y2ggb2YgcmVtb3RlIG9wcyBpbnNpZGUgb25lIHRyYW5zYWN0aW9uLiBSZXR1cm5zIGNvdW50IGFwcGxpZWQgKG5vbi1kdXBsaWNhdGUpLiAqL1xuICBhcHBseVJlbW90ZU9wcyhvcHM6IE9wW10pOiBudW1iZXIge1xuICAgIGxldCBhcHBsaWVkID0gMDtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBvcCBvZiBvcHMpIHtcbiAgICAgICAgaWYgKG9wLmRldmljZUlkID09PSB0aGlzLmRldmljZUlkKSBjb250aW51ZTsgLy8gb3VyIG93biBvcHMgZWNob2VkIGJhY2tcbiAgICAgICAgY29uc3QgZHVwID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgMSBGUk9NIG9wbG9nIFdIRVJFIG9wX2lkPT8nKS5nZXQob3Aub3BJZCk7XG4gICAgICAgIGlmIChkdXApIGNvbnRpbnVlO1xuICAgICAgICB0aGlzLndpdG5lc3NMYW1wb3J0KG9wLmxhbXBvcnQpO1xuICAgICAgICB0aGlzLmFwcGVuZE9wKG9wKTtcbiAgICAgICAgdGhpcy5hcHBseVJlbW90ZU9wKG9wKTtcbiAgICAgICAgYXBwbGllZCsrO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgaWYgKGFwcGxpZWQgPiAwKSB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJyonLCBlbnRpdHlJZDogJyonIH0pO1xuICAgIHJldHVybiBhcHBsaWVkO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVJlbW90ZU9wKG9wOiBPcCk6IHZvaWQge1xuICAgIHN3aXRjaCAob3AuYWN0aW9uKSB7XG4gICAgICBjYXNlICdjcmVhdGUnOlxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlQ3JlYXRlKG9wKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzZXQnOlxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlU2V0KG9wKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdkZWxldGUnOlxuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlRGVsZXRlKG9wKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB0YWJsZUZvcihlbnRpdHk6IE9wWydlbnRpdHknXSk6IHN0cmluZyB7XG4gICAgc3dpdGNoIChlbnRpdHkpIHtcbiAgICAgIGNhc2UgJ2l0ZW0nOiByZXR1cm4gJ2l0ZW1zJztcbiAgICAgIGNhc2UgJ2xpbmsnOiByZXR1cm4gJ2xpbmtzJztcbiAgICAgIGNhc2UgJ2NvbW1lbnQnOiByZXR1cm4gJ2NvbW1lbnRzJztcbiAgICAgIGNhc2UgJ21pbGVzdG9uZSc6IHJldHVybiAnbWlsZXN0b25lcyc7XG4gICAgICBjYXNlICdyZWxlYXNlJzogcmV0dXJuICdyZWxlYXNlcyc7XG4gICAgICBjYXNlICd1c2VyJzogcmV0dXJuICd1c2Vycyc7XG4gICAgICBjYXNlICdzYXZlZF92aWV3JzogcmV0dXJuICdzYXZlZF92aWV3cyc7XG4gICAgICBjYXNlICdhdHRhY2htZW50JzogcmV0dXJuICdhdHRhY2htZW50cyc7XG4gICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gZW50aXR5ICR7ZW50aXR5fWApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlSZW1vdGVDcmVhdGUob3A6IE9wKTogdm9pZCB7XG4gICAgY29uc3QgcmVjb3JkID0gb3AucGF5bG9hZC5yZWNvcmQgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgaWYgKCFyZWNvcmQpIHJldHVybjtcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMudGFibGVGb3Iob3AuZW50aXR5KTtcbiAgICBjb25zdCBleGlzdHMgPSB0aGlzLmRiLnByZXBhcmUoYFNFTEVDVCAxIEZST00gJHt0YWJsZX0gV0hFUkUgaWQ9P2ApLmdldChvcC5lbnRpdHlJZCk7XG4gICAgaWYgKGV4aXN0cykgcmV0dXJuOyAvLyBjcmVhdGUgaXMgaWRlbXBvdGVudCBwZXIgdXVpZFxuXG4gICAgaWYgKG9wLmVudGl0eSA9PT0gJ2l0ZW0nKSB7XG4gICAgICBsZXQgaXRlbSA9IHsgLi4uKHJlY29yZCBhcyB1bmtub3duIGFzIFdvcmtJdGVtKSB9O1xuICAgICAgLy8gSWRlbnQgY29sbGlzaW9uOiBhbm90aGVyIGl0ZW0gKGRpZmZlcmVudCB1dWlkKSBhbHJlYWR5IGhvbGRzIHRoaXMgaWRlbnQuXG4gICAgICAvLyBEZXRlcm1pbmlzdGljIHJ1bGUgXHUyMDE0IHRoZSBzbWFsbGVyIHV1aWQga2VlcHMgdGhlIGNvbnRlc3RlZCBpZGVudCBcdTIwMTQgc28gYm90aFxuICAgICAgLy8gZGV2aWNlcyByZXNvbHZlIHRoZSBzYW1lIGNvbGxpc2lvbiBpZGVudGljYWxseSBhbmQgY29udmVyZ2Ugd2l0aG91dCBwaW5nLXBvbmcuXG4gICAgICBjb25zdCBob2xkZXIgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpZCwgdHlwZSBGUk9NIGl0ZW1zIFdIRVJFIGlkZW50PT8nKS5nZXQoaXRlbS5pZGVudCkgYXNcbiAgICAgICAgfCB7IGlkOiBzdHJpbmc7IHR5cGU6IEl0ZW1UeXBlIH1cbiAgICAgICAgfCB1bmRlZmluZWQ7XG4gICAgICBpZiAoaG9sZGVyICYmIGhvbGRlci5pZCAhPT0gaXRlbS5pZCkge1xuICAgICAgICBpZiAoaXRlbS5pZCA8IGhvbGRlci5pZCkge1xuICAgICAgICAgIC8vIEluY29taW5nIGl0ZW0ga2VlcHMgdGhlIGlkZW50OyByZW51bWJlciB0aGUgbG9jYWwgaG9sZGVyIGFuZCBicm9hZGNhc3QuXG4gICAgICAgICAgY29uc3QgYnVtcGVkID0gdGhpcy5hbGxvY0lkZW50KGhvbGRlci50eXBlKTtcbiAgICAgICAgICB0aGlzLmxvZ0FjdGl2aXR5KGhvbGRlci5pZCwgJ3JlbnVtYmVyZWQnLCAnaWRlbnQnLCBpdGVtLmlkZW50LCBidW1wZWQpO1xuICAgICAgICAgIHRoaXMuYXBwbHlJdGVtRmllbGRzKGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xuICAgICAgICAgIHRoaXMubG9jYWxTZXQoJ2l0ZW0nLCBob2xkZXIuaWQsIHsgaWRlbnQ6IGJ1bXBlZCB9KTtcbiAgICAgICAgICB0aGlzLmluc2VydEl0ZW1Sb3coaXRlbSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgbmV3SWRlbnQgPSB0aGlzLmFsbG9jSWRlbnQoaXRlbS50eXBlKTtcbiAgICAgICAgICB0aGlzLmxvZ0FjdGl2aXR5KGl0ZW0uaWQsICdyZW51bWJlcmVkJywgJ2lkZW50JywgaXRlbS5pZGVudCwgbmV3SWRlbnQpO1xuICAgICAgICAgIGl0ZW0gPSB7IC4uLml0ZW0sIGlkZW50OiBuZXdJZGVudCB9O1xuICAgICAgICAgIHRoaXMuaW5zZXJ0SXRlbVJvdyhpdGVtKTtcbiAgICAgICAgICB0aGlzLmxvY2FsU2V0KCdpdGVtJywgaXRlbS5pZCwgeyBpZGVudDogbmV3SWRlbnQgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW5zZXJ0SXRlbVJvdyhpdGVtKTtcbiAgICAgIH1cbiAgICAgIHRoaXMud2l0bmVzc0lkZW50KGl0ZW0udHlwZSwgaXRlbS5pZGVudCk7XG4gICAgICBmb3IgKGNvbnN0IGYgb2YgT2JqZWN0LmtleXMocmVjb3JkKSkgdGhpcy5zZXRGaWVsZENsb2NrKCdpdGVtJywgaXRlbS5pZCwgZiwgb3AubGFtcG9ydCwgb3AuZGV2aWNlSWQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEdlbmVyaWMgaW5zZXJ0IGZvciBvdGhlciBlbnRpdGllcy5cbiAgICBjb25zdCBpbnNlcnRlcnM6IFJlY29yZDxzdHJpbmcsICgpID0+IHZvaWQ+ID0ge1xuICAgICAgbGluazogKCkgPT4ge1xuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgSXRlbUxpbmsgJiB7IGRlbGV0ZWQ/OiBudW1iZXIgfTtcbiAgICAgICAgdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gbGlua3MoaWQsIGZyb21faWQsIHRvX2lkLCBraW5kLCBkZWxldGVkLCBjcmVhdGVkX2F0LCBjcmVhdGVkX2J5KSBWQUxVRVMoPyw/LD8sPyw/LD8sPyknKVxuICAgICAgICAgIC5ydW4oci5pZCwgci5mcm9tSWQsIHIudG9JZCwgci5raW5kLCByLmRlbGV0ZWQgPz8gMCwgci5jcmVhdGVkQXQsIHIuY3JlYXRlZEJ5KTtcbiAgICAgIH0sXG4gICAgICBjb21tZW50OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBDb21tZW50O1xuICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBjb21tZW50cyhpZCwgaXRlbV9pZCwgYXV0aG9yX2lkLCBib2R5LCBib2R5X3RleHQsIGNyZWF0ZWRfYXQsIHVwZGF0ZWRfYXQsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8pJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIuaXRlbUlkLCByLmF1dGhvcklkLCByLmJvZHksIHIuYm9keVRleHQsIHIuY3JlYXRlZEF0LCByLnVwZGF0ZWRBdCwgci5kZWxldGVkID8/IDApO1xuICAgICAgfSxcbiAgICAgIG1pbGVzdG9uZTogKCkgPT4ge1xuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgTWlsZXN0b25lO1xuICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBtaWxlc3RvbmVzKGlkLCBuYW1lLCBkZXNjcmlwdGlvbiwgdGFyZ2V0X2RhdGUsIHN0YXR1cywgc29ydCwgc2FtcGxlLCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPywwKScpXG4gICAgICAgICAgLnJ1bihyLmlkLCByLm5hbWUsIHIuZGVzY3JpcHRpb24sIHIudGFyZ2V0RGF0ZSwgci5zdGF0dXMsIHIuc29ydCwgci5zYW1wbGUgPz8gMCk7XG4gICAgICB9LFxuICAgICAgcmVsZWFzZTogKCkgPT4ge1xuICAgICAgICBjb25zdCByID0gcmVjb3JkIGFzIHVua25vd24gYXMgUmVsZWFzZTtcbiAgICAgICAgdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gcmVsZWFzZXMoaWQsIG5hbWUsIHZlcnNpb24sIHRhcmdldF9kYXRlLCBzdGF0dXMsIGdvYWxzLCBub3Rlcywgc2FtcGxlLCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPyw/LDApJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgci52ZXJzaW9uLCByLnRhcmdldERhdGUsIHIuc3RhdHVzLCByLmdvYWxzLCByLm5vdGVzLCByLnNhbXBsZSA/PyAwKTtcbiAgICAgIH0sXG4gICAgICB1c2VyOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBVc2VyO1xuICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyB1c2VycyhpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBjcmVhdGVkX2F0KSBWQUxVRVMoPyw/LD8sPyw/KScpXG4gICAgICAgICAgLnJ1bihyLmlkLCByLm5hbWUsIHIuaW5pdGlhbHMsIHIuY29sb3IsIHIuY3JlYXRlZEF0KTtcbiAgICAgIH0sXG4gICAgICBzYXZlZF92aWV3OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBTYXZlZFZpZXc7XG4gICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIHNhdmVkX3ZpZXdzKGlkLCBuYW1lLCBjb25maWcsIHBpbm5lZCwgY3JlYXRlZF9ieSwgY3JlYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LDApJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgSlNPTi5zdHJpbmdpZnkoci5jb25maWcpLCByLnBpbm5lZCwgci5jcmVhdGVkQnksIHIuY3JlYXRlZEF0KTtcbiAgICAgIH0sXG4gICAgICBhdHRhY2htZW50OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBpbXBvcnQoJy4uLy4uL3NoYXJlZC90eXBlcycpLkF0dGFjaG1lbnQ7XG4gICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIGF0dGFjaG1lbnRzKGlkLCBpdGVtX2lkLCBmaWxlbmFtZSwgbWltZSwgc2l6ZSwgc2hhMjU2LCBkZXNjcmlwdGlvbiwgdXBsb2FkZWRfYnksIGNyZWF0ZWRfYXQsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPyw/KScpXG4gICAgICAgICAgLnJ1bihyLmlkLCByLml0ZW1JZCwgci5maWxlbmFtZSwgci5taW1lLCByLnNpemUsIHIuc2hhMjU2LCByLmRlc2NyaXB0aW9uLCByLnVwbG9hZGVkQnksIHIuY3JlYXRlZEF0LCByLmRlbGV0ZWQgPz8gMCk7XG4gICAgICB9LFxuICAgIH07XG4gICAgaW5zZXJ0ZXJzW29wLmVudGl0eV0/LigpO1xuICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhyZWNvcmQpKSB0aGlzLnNldEZpZWxkQ2xvY2sob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgZiwgb3AubGFtcG9ydCwgb3AuZGV2aWNlSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVJlbW90ZVNldChvcDogT3ApOiB2b2lkIHtcbiAgICBjb25zdCBmaWVsZHMgPSAob3AucGF5bG9hZC5maWVsZHMgPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgIGNvbnN0IGJhc2VkT24gPSAob3AucGF5bG9hZC5iYXNlZE9uID8/IHt9KSBhcyBSZWNvcmQ8c3RyaW5nLCB7IGxhbXBvcnQ6IG51bWJlcjsgZGV2aWNlSWQ6IHN0cmluZyB9IHwgbnVsbD47XG4gICAgY29uc3Qgd2lubmluZzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcblxuICAgIGZvciAoY29uc3QgW2ZpZWxkLCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZmllbGRzKSkge1xuICAgICAgY29uc3QgbG9jYWwgPSB0aGlzLmZpZWxkQ2xvY2sob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgZmllbGQpO1xuICAgICAgY29uc3QgYmFzZSA9IGJhc2VkT25bZmllbGRdID8/IG51bGw7XG5cbiAgICAgIGxldCByZW1vdGVXaW5zOiBib29sZWFuO1xuICAgICAgbGV0IGNvbmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlmICghbG9jYWwpIHtcbiAgICAgICAgcmVtb3RlV2lucyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGJhc2UgJiYgYmFzZS5sYW1wb3J0ID09PSBsb2NhbC5sYW1wb3J0ICYmIGJhc2UuZGV2aWNlSWQgPT09IGxvY2FsLmRldmljZUlkKSB7XG4gICAgICAgIHJlbW90ZVdpbnMgPSB0cnVlOyAvLyBjbGVhbiBjYXVzYWwgdXBkYXRlOiByZW1vdGUgc2F3IGV4YWN0bHkgb3VyIGN1cnJlbnQgdmFsdWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmN1cnJlbnQgPSB0cnVlO1xuICAgICAgICByZW1vdGVXaW5zID0gb3AubGFtcG9ydCA+IGxvY2FsLmxhbXBvcnQgfHwgKG9wLmxhbXBvcnQgPT09IGxvY2FsLmxhbXBvcnQgJiYgb3AuZGV2aWNlSWQgPiBsb2NhbC5kZXZpY2VJZCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25jdXJyZW50ICYmIENPTkZMSUNUX1NVUkZBQ0VEX0ZJRUxEUy5oYXMoZmllbGQpICYmIG9wLmVudGl0eSA9PT0gJ2l0ZW0nKSB7XG4gICAgICAgIGNvbnN0IGN1ciA9IHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZShgU0VMRUNUICR7SVRFTV9DT0xTW2ZpZWxkXX0gQVMgdiBGUk9NIGl0ZW1zIFdIRVJFIGlkPT9gKVxuICAgICAgICAgIC5nZXQob3AuZW50aXR5SWQpIGFzIHsgdjogdW5rbm93biB9IHwgdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCBsb2NhbFZhbCA9IGN1ciA/IFN0cmluZyhjdXIudiA/PyAnJykgOiAnJztcbiAgICAgICAgY29uc3QgcmVtb3RlVmFsID0gU3RyaW5nKHZhbHVlID8/ICcnKTtcbiAgICAgICAgaWYgKGxvY2FsVmFsICE9PSByZW1vdGVWYWwpIHtcbiAgICAgICAgICBjb25zdCBjb25mbGljdDogU3luY0NvbmZsaWN0ID0ge1xuICAgICAgICAgICAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgICAgICBlbnRpdHk6IG9wLmVudGl0eSxcbiAgICAgICAgICAgIGVudGl0eUlkOiBvcC5lbnRpdHlJZCxcbiAgICAgICAgICAgIGZpZWxkLFxuICAgICAgICAgICAgbG9jYWxWYWx1ZTogbG9jYWxWYWwsXG4gICAgICAgICAgICByZW1vdGVWYWx1ZTogcmVtb3RlVmFsLFxuICAgICAgICAgICAgcmVtb3RlRGV2aWNlOiBvcC5kZXZpY2VJZCxcbiAgICAgICAgICAgIHJlbW90ZUFjdG9yOiBvcC5hY3RvcklkLFxuICAgICAgICAgICAgZGV0ZWN0ZWRBdDogdGhpcy5ub3coKSxcbiAgICAgICAgICAgIHJlc29sdmVkQXQ6IG51bGwsXG4gICAgICAgICAgICByZXNvbHV0aW9uOiBudWxsLFxuICAgICAgICAgIH07XG4gICAgICAgICAgdGhpcy5kYlxuICAgICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIHN5bmNfY29uZmxpY3RzKGlkLCBlbnRpdHksIGVudGl0eV9pZCwgZmllbGQsIGxvY2FsX3ZhbHVlLCByZW1vdGVfdmFsdWUsIHJlbW90ZV9kZXZpY2UsIHJlbW90ZV9hY3RvciwgZGV0ZWN0ZWRfYXQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPyknKVxuICAgICAgICAgICAgLnJ1bihjb25mbGljdC5pZCwgY29uZmxpY3QuZW50aXR5LCBjb25mbGljdC5lbnRpdHlJZCwgY29uZmxpY3QuZmllbGQsIGNvbmZsaWN0LmxvY2FsVmFsdWUsIGNvbmZsaWN0LnJlbW90ZVZhbHVlLCBjb25mbGljdC5yZW1vdGVEZXZpY2UsIGNvbmZsaWN0LnJlbW90ZUFjdG9yLCBjb25mbGljdC5kZXRlY3RlZEF0KTtcbiAgICAgICAgICB0aGlzLmV2ZW50cy5vbkNvbmZsaWN0KGNvbmZsaWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocmVtb3RlV2lucykge1xuICAgICAgICB3aW5uaW5nW2ZpZWxkXSA9IHZhbHVlO1xuICAgICAgICB0aGlzLnNldEZpZWxkQ2xvY2sob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgZmllbGQsIG9wLmxhbXBvcnQsIG9wLmRldmljZUlkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0LmtleXMod2lubmluZykubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICBpZiAob3AuZW50aXR5ID09PSAnaXRlbScpIHtcbiAgICAgIC8vIElkZW50IHNldCBtYXkgY29sbGlkZSBsb2NhbGx5IFx1MjAxNCByZXNvbHZlIHdpdGggdGhlIHNhbWUgc21hbGxlci11dWlkLWtlZXBzIHJ1bGUuXG4gICAgICBpZiAoJ2lkZW50JyBpbiB3aW5uaW5nKSB7XG4gICAgICAgIGNvbnN0IGhvbGRlciA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkLCB0eXBlIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PycpLmdldChTdHJpbmcod2lubmluZy5pZGVudCkpIGFzXG4gICAgICAgICAgfCB7IGlkOiBzdHJpbmc7IHR5cGU6IEl0ZW1UeXBlIH1cbiAgICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgY3VyID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgdHlwZSBGUk9NIGl0ZW1zIFdIRVJFIGlkPT8nKS5nZXQob3AuZW50aXR5SWQpIGFzIHsgdHlwZTogSXRlbVR5cGUgfSB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGhvbGRlciAmJiBob2xkZXIuaWQgIT09IG9wLmVudGl0eUlkICYmIGN1cikge1xuICAgICAgICAgIGlmIChvcC5lbnRpdHlJZCA8IGhvbGRlci5pZCkge1xuICAgICAgICAgICAgY29uc3QgYnVtcGVkID0gdGhpcy5hbGxvY0lkZW50KGhvbGRlci50eXBlKTtcbiAgICAgICAgICAgIHRoaXMubG9nQWN0aXZpdHkoaG9sZGVyLmlkLCAncmVudW1iZXJlZCcsICdpZGVudCcsIFN0cmluZyh3aW5uaW5nLmlkZW50KSwgYnVtcGVkKTtcbiAgICAgICAgICAgIHRoaXMuYXBwbHlJdGVtRmllbGRzKGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xuICAgICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBidW1wZWQgPSB0aGlzLmFsbG9jSWRlbnQoY3VyLnR5cGUpO1xuICAgICAgICAgICAgd2lubmluZy5pZGVudCA9IGJ1bXBlZDtcbiAgICAgICAgICAgIHRoaXMubG9jYWxTZXQoJ2l0ZW0nLCBvcC5lbnRpdHlJZCwgeyBpZGVudDogYnVtcGVkIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChjdXIpIHtcbiAgICAgICAgICB0aGlzLndpdG5lc3NJZGVudChjdXIudHlwZSwgU3RyaW5nKHdpbm5pbmcuaWRlbnQpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMob3AuZW50aXR5SWQsIHdpbm5pbmcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEdlbmVyaWMgY29sdW1uIHVwZGF0ZSBmb3Igb3RoZXIgZW50aXRpZXMuXG4gICAgY29uc3QgY29sTWFwOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+PiA9IHtcbiAgICAgIGxpbms6IHsgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXG4gICAgICBjb21tZW50OiB7IGJvZHk6ICdib2R5JywgYm9keVRleHQ6ICdib2R5X3RleHQnLCB1cGRhdGVkQXQ6ICd1cGRhdGVkX2F0JywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXG4gICAgICBtaWxlc3RvbmU6IHsgbmFtZTogJ25hbWUnLCBkZXNjcmlwdGlvbjogJ2Rlc2NyaXB0aW9uJywgdGFyZ2V0RGF0ZTogJ3RhcmdldF9kYXRlJywgc3RhdHVzOiAnc3RhdHVzJywgc29ydDogJ3NvcnQnLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICAgIHJlbGVhc2U6IHsgbmFtZTogJ25hbWUnLCB2ZXJzaW9uOiAndmVyc2lvbicsIHRhcmdldERhdGU6ICd0YXJnZXRfZGF0ZScsIHN0YXR1czogJ3N0YXR1cycsIGdvYWxzOiAnZ29hbHMnLCBub3RlczogJ25vdGVzJywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXG4gICAgICB1c2VyOiB7IG5hbWU6ICduYW1lJywgaW5pdGlhbHM6ICdpbml0aWFscycsIGNvbG9yOiAnY29sb3InIH0sXG4gICAgICBzYXZlZF92aWV3OiB7IG5hbWU6ICduYW1lJywgY29uZmlnOiAnY29uZmlnJywgcGlubmVkOiAncGlubmVkJywgZGVsZXRlZDogJ2RlbGV0ZWQnIH0sXG4gICAgICBhdHRhY2htZW50OiB7IGRlc2NyaXB0aW9uOiAnZGVzY3JpcHRpb24nLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICB9O1xuICAgIGNvbnN0IG1hcCA9IGNvbE1hcFtvcC5lbnRpdHldO1xuICAgIGlmICghbWFwKSByZXR1cm47XG4gICAgY29uc3Qgc2V0czogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCB2YWxzOiB1bmtub3duW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyh3aW5uaW5nKSkge1xuICAgICAgY29uc3QgY29sID0gbWFwW2tdO1xuICAgICAgaWYgKCFjb2wpIGNvbnRpbnVlO1xuICAgICAgc2V0cy5wdXNoKGAke2NvbH09P2ApO1xuICAgICAgdmFscy5wdXNoKGsgPT09ICdjb25maWcnID8gSlNPTi5zdHJpbmdpZnkodikgOiB2KTtcbiAgICB9XG4gICAgaWYgKCFzZXRzLmxlbmd0aCkgcmV0dXJuO1xuICAgIHZhbHMucHVzaChvcC5lbnRpdHlJZCk7XG4gICAgdGhpcy5kYi5wcmVwYXJlKGBVUERBVEUgJHt0aGlzLnRhYmxlRm9yKG9wLmVudGl0eSl9IFNFVCAke3NldHMuam9pbignLCAnKX0gV0hFUkUgaWQ9P2ApLnJ1biguLi52YWxzKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlSZW1vdGVEZWxldGUob3A6IE9wKTogdm9pZCB7XG4gICAgY29uc3QgdGFibGUgPSB0aGlzLnRhYmxlRm9yKG9wLmVudGl0eSk7XG4gICAgdGhpcy5kYi5wcmVwYXJlKGBVUERBVEUgJHt0YWJsZX0gU0VUIGRlbGV0ZWQ9MSBXSEVSRSBpZD0/YCkucnVuKG9wLmVudGl0eUlkKTtcbiAgICB0aGlzLnNldEZpZWxkQ2xvY2sob3AuZW50aXR5LCBvcC5lbnRpdHlJZCwgJ2RlbGV0ZWQnLCBvcC5sYW1wb3J0LCBvcC5kZXZpY2VJZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIGNvbmZsaWN0cyAtLS0tLS0tLS0tXG4gIGxpc3RDb25mbGljdHMob3Blbk9ubHkgPSB0cnVlKTogU3luY0NvbmZsaWN0W10ge1xuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXG4gICAgICAucHJlcGFyZShgU0VMRUNUICogRlJPTSBzeW5jX2NvbmZsaWN0cyAke29wZW5Pbmx5ID8gJ1dIRVJFIHJlc29sdmVkX2F0IElTIE5VTEwnIDogJyd9IE9SREVSIEJZIGRldGVjdGVkX2F0IERFU0NgKVxuICAgICAgLmFsbCgpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xuICAgICAgaWQ6IFN0cmluZyhyLmlkKSwgZW50aXR5OiBTdHJpbmcoci5lbnRpdHkpLCBlbnRpdHlJZDogU3RyaW5nKHIuZW50aXR5X2lkKSwgZmllbGQ6IFN0cmluZyhyLmZpZWxkKSxcbiAgICAgIGxvY2FsVmFsdWU6IFN0cmluZyhyLmxvY2FsX3ZhbHVlKSwgcmVtb3RlVmFsdWU6IFN0cmluZyhyLnJlbW90ZV92YWx1ZSksXG4gICAgICByZW1vdGVEZXZpY2U6IFN0cmluZyhyLnJlbW90ZV9kZXZpY2UpLCByZW1vdGVBY3RvcjogU3RyaW5nKHIucmVtb3RlX2FjdG9yKSxcbiAgICAgIGRldGVjdGVkQXQ6IFN0cmluZyhyLmRldGVjdGVkX2F0KSxcbiAgICAgIHJlc29sdmVkQXQ6IHIucmVzb2x2ZWRfYXQgPyBTdHJpbmcoci5yZXNvbHZlZF9hdCkgOiBudWxsLFxuICAgICAgcmVzb2x1dGlvbjogKHIucmVzb2x1dGlvbiBhcyBTeW5jQ29uZmxpY3RbJ3Jlc29sdXRpb24nXSkgPz8gbnVsbCxcbiAgICB9KSk7XG4gIH1cblxuICByZXNvbHZlQ29uZmxpY3QoaWQ6IHN0cmluZywgcmVzb2x1dGlvbjogJ2xvY2FsJyB8ICdyZW1vdGUnIHwgJ21lcmdlZCcsIG1lcmdlZFZhbHVlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHN5bmNfY29uZmxpY3RzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICAgIGlmICghcm93KSByZXR1cm47XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID1cbiAgICAgICAgcmVzb2x1dGlvbiA9PT0gJ21lcmdlZCcgPyAobWVyZ2VkVmFsdWUgPz8gJycpIDogcmVzb2x1dGlvbiA9PT0gJ2xvY2FsJyA/IFN0cmluZyhyb3cubG9jYWxfdmFsdWUpIDogU3RyaW5nKHJvdy5yZW1vdGVfdmFsdWUpO1xuICAgICAgaWYgKFN0cmluZyhyb3cuZW50aXR5KSA9PT0gJ2l0ZW0nKSB7XG4gICAgICAgIGNvbnN0IGZpZWxkID0gU3RyaW5nKHJvdy5maWVsZCk7XG4gICAgICAgIHRoaXMuYXBwbHlJdGVtRmllbGRzKFN0cmluZyhyb3cuZW50aXR5X2lkKSwgeyBbZmllbGRdOiB2YWx1ZSwgdXBkYXRlZEF0OiB0aGlzLm5vdygpLCB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCB9KTtcbiAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIFN0cmluZyhyb3cuZW50aXR5X2lkKSwgeyBbZmllbGRdOiB2YWx1ZSwgdXBkYXRlZEF0OiB0aGlzLm5vdygpLCB1cGRhdGVkQnk6IHRoaXMuYWN0b3JJZCB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIHN5bmNfY29uZmxpY3RzIFNFVCByZXNvbHZlZF9hdD0/LCByZXNvbHV0aW9uPT8gV0hFUkUgaWQ9PycpLnJ1bih0aGlzLm5vdygpLCByZXNvbHV0aW9uLCBpZCk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogU3RyaW5nKHJvdy5lbnRpdHkpLCBlbnRpdHlJZDogU3RyaW5nKHJvdy5lbnRpdHlfaWQpIH0pO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBzeW5jIGV4cG9ydCBoZWxwZXJzIC0tLS0tLS0tLS1cbiAgb3BzU2luY2Uoc2VxOiBudW1iZXIsIG93bk9ubHkgPSB0cnVlKTogeyBzZXE6IG51bWJlcjsgb3A6IE9wIH1bXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKFxuICAgICAgICBgU0VMRUNUIHNlcSwgb3BfaWQsIGRldmljZV9pZCwgYWN0b3JfaWQsIGxhbXBvcnQsIGF0LCBlbnRpdHksIGVudGl0eV9pZCwgYWN0aW9uLCBwYXlsb2FkXG4gICAgICAgICBGUk9NIG9wbG9nIFdIRVJFIHNlcSA+ID8gJHtvd25Pbmx5ID8gJ0FORCBkZXZpY2VfaWQgPSA/JyA6ICcnfSBPUkRFUiBCWSBzZXEgQVNDYCxcbiAgICAgIClcbiAgICAgIC5hbGwoLi4uKG93bk9ubHkgPyBbc2VxLCB0aGlzLmRldmljZUlkXSA6IFtzZXFdKSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7XG4gICAgICBzZXE6IE51bWJlcihyLnNlcSksXG4gICAgICBvcDoge1xuICAgICAgICBvcElkOiBTdHJpbmcoci5vcF9pZCksIGRldmljZUlkOiBTdHJpbmcoci5kZXZpY2VfaWQpLCBhY3RvcklkOiBTdHJpbmcoci5hY3Rvcl9pZCksXG4gICAgICAgIGxhbXBvcnQ6IE51bWJlcihyLmxhbXBvcnQpLCBhdDogU3RyaW5nKHIuYXQpLCBlbnRpdHk6IHIuZW50aXR5IGFzIE9wWydlbnRpdHknXSxcbiAgICAgICAgZW50aXR5SWQ6IFN0cmluZyhyLmVudGl0eV9pZCksIGFjdGlvbjogci5hY3Rpb24gYXMgT3BbJ2FjdGlvbiddLFxuICAgICAgICBwYXlsb2FkOiBKU09OLnBhcnNlKFN0cmluZyhyLnBheWxvYWQpKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAgIH0sXG4gICAgfSkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBzYW1wbGUgZGF0YSAtLS0tLS0tLS0tXG4gIHJlbW92ZVNhbXBsZURhdGEoKTogbnVtYmVyIHtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgY29uc3QgaWRzID0gKHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkIEZST00gaXRlbXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pLm1hcCgocikgPT4gci5pZCk7XG4gICAgICBmb3IgKGNvbnN0IGlkIG9mIGlkcykgdGhpcy5kZWxldGVJdGVtKGlkKTtcbiAgICAgIGZvciAoY29uc3QgbSBvZiB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBpZCBGUk9NIG1pbGVzdG9uZXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pIHtcbiAgICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgbWlsZXN0b25lcyBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT8nKS5ydW4obS5pZCk7XG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ21pbGVzdG9uZScsIG0uaWQsIHsgZGVsZXRlZDogMSB9KTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgcmVsIG9mIHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkIEZST00gcmVsZWFzZXMgV0hFUkUgc2FtcGxlPTEgQU5EIGRlbGV0ZWQ9MCcpLmFsbCgpIGFzIHsgaWQ6IHN0cmluZyB9W10pIHtcbiAgICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgcmVsZWFzZXMgU0VUIGRlbGV0ZWQ9MSBXSEVSRSBpZD0/JykucnVuKHJlbC5pZCk7XG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ3JlbGVhc2UnLCByZWwuaWQsIHsgZGVsZXRlZDogMSB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpZHMubGVuZ3RoO1xuICAgIH0pO1xuICAgIGNvbnN0IG4gPSB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnKicsIGVudGl0eUlkOiAnKicgfSk7XG4gICAgcmV0dXJuIG47XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLSByb3cgbWFwcGVycyAtLS0tLS0tLS0tXG5leHBvcnQgZnVuY3Rpb24gcm93VG9JdGVtKHI6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogV29ya0l0ZW0ge1xuICByZXR1cm4ge1xuICAgIGlkOiBTdHJpbmcoci5pZCksXG4gICAgaWRlbnQ6IFN0cmluZyhyLmlkZW50KSxcbiAgICB0eXBlOiByLnR5cGUgYXMgSXRlbVR5cGUsXG4gICAgdGl0bGU6IFN0cmluZyhyLnRpdGxlKSxcbiAgICBib2R5OiBTdHJpbmcoci5ib2R5KSxcbiAgICBib2R5VGV4dDogU3RyaW5nKHIuYm9keV90ZXh0KSxcbiAgICBzdGF0dXM6IFN0cmluZyhyLnN0YXR1cyksXG4gICAgcHJpb3JpdHk6IHIucHJpb3JpdHkgYXMgV29ya0l0ZW1bJ3ByaW9yaXR5J10sXG4gICAgb3duZXJJZDogKHIub3duZXJfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICByZXBvcnRlcklkOiAoci5yZXBvcnRlcl9pZCBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxuICAgIG1pbGVzdG9uZUlkOiAoci5taWxlc3RvbmVfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICByZWxlYXNlSWQ6IChyLnJlbGVhc2VfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBwYXJlbnRJZDogKHIucGFyZW50X2lkIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXG4gICAgc3RhcnREYXRlOiAoci5zdGFydF9kYXRlIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXG4gICAgZHVlRGF0ZTogKHIuZHVlX2RhdGUgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBjb21wbGV0ZWRBdDogKHIuY29tcGxldGVkX2F0IGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXG4gICAgZWZmb3J0OiByLmVmZm9ydCA9PSBudWxsID8gbnVsbCA6IE51bWJlcihyLmVmZm9ydCksXG4gICAgY29uZmlkZW5jZTogKHIuY29uZmlkZW5jZSBhcyBXb3JrSXRlbVsnY29uZmlkZW5jZSddKSA/PyBudWxsLFxuICAgIHJpc2tMZXZlbDogKHIucmlza19sZXZlbCBhcyBXb3JrSXRlbVsncmlza0xldmVsJ10pID8/IG51bGwsXG4gICAgYnVzaW5lc3NWYWx1ZTogKHIuYnVzaW5lc3NfdmFsdWUgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBsZWFkZXJzaGlwVmlzaWJsZTogTnVtYmVyKHIubGVhZGVyc2hpcF92aXNpYmxlKSBhcyAwIHwgMSxcbiAgICBwcm9ncmVzczogci5wcm9ncmVzcyA9PSBudWxsID8gbnVsbCA6IE51bWJlcihyLnByb2dyZXNzKSxcbiAgICB0YWdzOiBzYWZlUGFyc2UoU3RyaW5nKHIudGFncyksIFtdKSBhcyBzdHJpbmdbXSxcbiAgICBleHRyYTogc2FmZVBhcnNlKFN0cmluZyhyLmV4dHJhKSwge30pIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIGFyY2hpdmVkOiBOdW1iZXIoci5hcmNoaXZlZCkgYXMgMCB8IDEsXG4gICAgc2FtcGxlOiBOdW1iZXIoci5zYW1wbGUpIGFzIDAgfCAxLFxuICAgIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXG4gICAgdXBkYXRlZEF0OiBTdHJpbmcoci51cGRhdGVkX2F0KSxcbiAgICBjcmVhdGVkQnk6IFN0cmluZyhyLmNyZWF0ZWRfYnkpLFxuICAgIHVwZGF0ZWRCeTogU3RyaW5nKHIudXBkYXRlZF9ieSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJvd1RvTGluayhyOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IEl0ZW1MaW5rIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogU3RyaW5nKHIuaWQpLFxuICAgIGZyb21JZDogU3RyaW5nKHIuZnJvbV9pZCksXG4gICAgdG9JZDogU3RyaW5nKHIudG9faWQpLFxuICAgIGtpbmQ6IHIua2luZCBhcyBMaW5rS2luZCxcbiAgICBjcmVhdGVkQXQ6IFN0cmluZyhyLmNyZWF0ZWRfYXQpLFxuICAgIGNyZWF0ZWRCeTogU3RyaW5nKHIuY3JlYXRlZF9ieSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNhZmVQYXJzZShzOiBzdHJpbmcsIGZhbGxiYWNrOiB1bmtub3duKTogdW5rbm93biB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2Uocyk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxsYmFjaztcbiAgfVxufVxuXG4vKiogQ29udmVydCBmcmVlIHRleHQgdG8gYSBzYWZlIEZUUzUgcHJlZml4IHF1ZXJ5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZ0c1F1ZXJ5KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRlcm1zID0gdGV4dFxuICAgIC5yZXBsYWNlKC9bJ1wiKigpXS9nLCAnICcpXG4gICAgLnNwbGl0KC9cXHMrLylcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLm1hcCgodCkgPT4gYFwiJHt0fVwiKmApO1xuICByZXR1cm4gdGVybXMuam9pbignICcpIHx8ICdcIlwiJztcbn1cbiIsICIvLyBTaGFyZWQgZG9tYWluIHR5cGVzIFx1MjAxNCBzaW5nbGUgc291cmNlIG9mIHRydXRoIGZvciBtYWluIHByb2Nlc3MgYW5kIHJlbmRlcmVyLlxuXG4vLyAtLS0tLS0tLS0tIFRlcm1pbm9sb2d5IC0tLS0tLS0tLS1cbi8vIFVtYnJlbGxhIG5vdW46IFwiV29yayBJdGVtXCIuIEV2ZXJ5IHRyYWNrZWQgcmVjb3JkIGlzIGEgd29yayBpdGVtIHdpdGggYSB0eXBlLlxuLy8gSWRlbnRzIGFyZSBwZXItdHlwZSBzZXF1ZW5jZXM6IFRBU0stMTIsIEZFQVQtMywgUkVRLTQxLCBERUMtMTIsIFJJU0stOCwgQkxLLTIsXG4vLyBBQ0MtNSwgTVRHLTE0LCBJREVBLTcsIFEtMywgREVGLTEsIFJFUy00LlxuXG5leHBvcnQgY29uc3QgSVRFTV9UWVBFUyA9IFtcbiAgJ3Rhc2snLFxuICAnZmVhdHVyZScsXG4gICdyZXF1aXJlbWVudCcsXG4gICdzdG9yeScsXG4gICdkZWNpc2lvbicsXG4gICdyaXNrJyxcbiAgJ2Jsb2NrZXInLFxuICAnYWNjZXNzJyxcbiAgJ21lZXRpbmcnLFxuICAnaWRlYScsXG4gICdxdWVzdGlvbicsXG4gICdkZWZlY3QnLFxuICAncmVzZWFyY2gnLFxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEl0ZW1UeXBlID0gKHR5cGVvZiBJVEVNX1RZUEVTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgSURFTlRfUFJFRklYOiBSZWNvcmQ8SXRlbVR5cGUsIHN0cmluZz4gPSB7XG4gIHRhc2s6ICdUQVNLJyxcbiAgZmVhdHVyZTogJ0ZFQVQnLFxuICByZXF1aXJlbWVudDogJ1JFUScsXG4gIHN0b3J5OiAnU1RPUlknLFxuICBkZWNpc2lvbjogJ0RFQycsXG4gIHJpc2s6ICdSSVNLJyxcbiAgYmxvY2tlcjogJ0JMSycsXG4gIGFjY2VzczogJ0FDQycsXG4gIG1lZXRpbmc6ICdNVEcnLFxuICBpZGVhOiAnSURFQScsXG4gIHF1ZXN0aW9uOiAnUScsXG4gIGRlZmVjdDogJ0RFRicsXG4gIHJlc2VhcmNoOiAnUkVTJyxcbn07XG5cbmV4cG9ydCBjb25zdCBUWVBFX0xBQkVMOiBSZWNvcmQ8SXRlbVR5cGUsIHN0cmluZz4gPSB7XG4gIHRhc2s6ICdUYXNrJyxcbiAgZmVhdHVyZTogJ0ZlYXR1cmUnLFxuICByZXF1aXJlbWVudDogJ1JlcXVpcmVtZW50JyxcbiAgc3Rvcnk6ICdVc2VyIFN0b3J5JyxcbiAgZGVjaXNpb246ICdEZWNpc2lvbicsXG4gIHJpc2s6ICdSaXNrJyxcbiAgYmxvY2tlcjogJ0Jsb2NrZXInLFxuICBhY2Nlc3M6ICdBY2Nlc3MgUmVxdWVzdCcsXG4gIG1lZXRpbmc6ICdNZWV0aW5nIE5vdGUnLFxuICBpZGVhOiAnSWRlYScsXG4gIHF1ZXN0aW9uOiAnT3BlbiBRdWVzdGlvbicsXG4gIGRlZmVjdDogJ0RlZmVjdCcsXG4gIHJlc2VhcmNoOiAnUmVzZWFyY2gnLFxufTtcblxuLy8gLS0tLS0tLS0tLSBTdGF0dXNlcyAtLS0tLS0tLS0tXG4vLyBXb3JrIHN0YXR1c2VzIGFwcGx5IHRvIGV4ZWN1dGFibGUgaXRlbXMgKHRhc2svZmVhdHVyZS9yZXF1aXJlbWVudC9zdG9yeS9kZWZlY3QvcmVzZWFyY2gvaWRlYSkuXG5leHBvcnQgY29uc3QgV09SS19TVEFUVVNFUyA9IFtcbiAgJ2JhY2tsb2cnLFxuICAndG9kbycsXG4gICdpbl9wcm9ncmVzcycsXG4gICdpbl9yZXZpZXcnLFxuICAnYmxvY2tlZCcsXG4gICdkb25lJyxcbiAgJ2NhbmNlbGxlZCcsXG5dIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgV29ya1N0YXR1cyA9ICh0eXBlb2YgV09SS19TVEFUVVNFUylbbnVtYmVyXTtcblxuZXhwb3J0IGNvbnN0IERFQ0lTSU9OX1NUQVRVU0VTID0gW1xuICAncHJvcG9zZWQnLFxuICAnZGlzY3Vzc2luZycsXG4gICdhcHByb3ZlZCcsXG4gICdyZWplY3RlZCcsXG4gICdyZXZpc2l0JyxcbiAgJ3N1cGVyc2VkZWQnLFxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIERlY2lzaW9uU3RhdHVzID0gKHR5cGVvZiBERUNJU0lPTl9TVEFUVVNFUylbbnVtYmVyXTtcblxuZXhwb3J0IGNvbnN0IEFDQ0VTU19TVEFUVVNFUyA9IFtcbiAgJ2lkZW50aWZpZWQnLFxuICAnbm90X3JlcXVlc3RlZCcsXG4gICdwcmVwYXJpbmcnLFxuICAncmVxdWVzdGVkJyxcbiAgJ3VuZGVyX3JldmlldycsXG4gICdpbmZvX25lZWRlZCcsXG4gICdhcHByb3ZlZCcsXG4gICdwYXJ0aWFsbHlfYXBwcm92ZWQnLFxuICAnZ3JhbnRlZCcsXG4gICdkZW5pZWQnLFxuICAnZXhwaXJlZCcsXG4gICdub3RfbmVlZGVkJyxcbl0gYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBBY2Nlc3NTdGF0dXMgPSAodHlwZW9mIEFDQ0VTU19TVEFUVVNFUylbbnVtYmVyXTtcblxuZXhwb3J0IGNvbnN0IFJJU0tfU1RBVFVTRVMgPSBbJ29wZW4nLCAnbWl0aWdhdGluZycsICdhY2NlcHRlZCcsICdjbG9zZWQnXSBhcyBjb25zdDtcbmV4cG9ydCBjb25zdCBCTE9DS0VSX1NUQVRVU0VTID0gWydhY3RpdmUnLCAnd29ya2Fyb3VuZCcsICdyZXNvbHZlZCddIGFzIGNvbnN0O1xuZXhwb3J0IGNvbnN0IFFVRVNUSU9OX1NUQVRVU0VTID0gWydvcGVuJywgJ2Fuc3dlcmVkJywgJ3BhcmtlZCddIGFzIGNvbnN0O1xuZXhwb3J0IGNvbnN0IE1FRVRJTkdfU1RBVFVTRVMgPSBbJ3NjaGVkdWxlZCcsICdoZWxkJywgJ3N1bW1hcml6ZWQnXSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgSXRlbVN0YXR1cyA9IHN0cmluZzsgLy8gdmFsaWRhdGVkIHBlci10eXBlIGJ5IHN0YXR1c2VzRm9yVHlwZSgpXG5cbmV4cG9ydCBmdW5jdGlvbiBzdGF0dXNlc0ZvclR5cGUodHlwZTogSXRlbVR5cGUpOiByZWFkb25seSBzdHJpbmdbXSB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ2RlY2lzaW9uJzpcbiAgICAgIHJldHVybiBERUNJU0lPTl9TVEFUVVNFUztcbiAgICBjYXNlICdhY2Nlc3MnOlxuICAgICAgcmV0dXJuIEFDQ0VTU19TVEFUVVNFUztcbiAgICBjYXNlICdyaXNrJzpcbiAgICAgIHJldHVybiBSSVNLX1NUQVRVU0VTO1xuICAgIGNhc2UgJ2Jsb2NrZXInOlxuICAgICAgcmV0dXJuIEJMT0NLRVJfU1RBVFVTRVM7XG4gICAgY2FzZSAncXVlc3Rpb24nOlxuICAgICAgcmV0dXJuIFFVRVNUSU9OX1NUQVRVU0VTO1xuICAgIGNhc2UgJ21lZXRpbmcnOlxuICAgICAgcmV0dXJuIE1FRVRJTkdfU1RBVFVTRVM7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBXT1JLX1NUQVRVU0VTO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBTVEFUVVNfTEFCRUw6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIGJhY2tsb2c6ICdCYWNrbG9nJyxcbiAgdG9kbzogJ1RvIERvJyxcbiAgaW5fcHJvZ3Jlc3M6ICdJbiBQcm9ncmVzcycsXG4gIGluX3JldmlldzogJ0luIFJldmlldycsXG4gIGJsb2NrZWQ6ICdCbG9ja2VkJyxcbiAgZG9uZTogJ0RvbmUnLFxuICBjYW5jZWxsZWQ6ICdDYW5jZWxsZWQnLFxuICBwcm9wb3NlZDogJ1Byb3Bvc2VkJyxcbiAgZGlzY3Vzc2luZzogJ0Rpc2N1c3NpbmcnLFxuICBhcHByb3ZlZDogJ0FwcHJvdmVkJyxcbiAgcmVqZWN0ZWQ6ICdSZWplY3RlZCcsXG4gIHJldmlzaXQ6ICdSZXZpc2l0IExhdGVyJyxcbiAgc3VwZXJzZWRlZDogJ1N1cGVyc2VkZWQnLFxuICBpZGVudGlmaWVkOiAnSWRlbnRpZmllZCcsXG4gIG5vdF9yZXF1ZXN0ZWQ6ICdOb3QgUmVxdWVzdGVkJyxcbiAgcHJlcGFyaW5nOiAnUHJlcGFyaW5nIFJlcXVlc3QnLFxuICByZXF1ZXN0ZWQ6ICdSZXF1ZXN0ZWQnLFxuICB1bmRlcl9yZXZpZXc6ICdVbmRlciBSZXZpZXcnLFxuICBpbmZvX25lZWRlZDogJ01vcmUgSW5mbyBOZWVkZWQnLFxuICBwYXJ0aWFsbHlfYXBwcm92ZWQ6ICdQYXJ0aWFsbHkgQXBwcm92ZWQnLFxuICBncmFudGVkOiAnR3JhbnRlZCcsXG4gIGRlbmllZDogJ0RlbmllZCcsXG4gIGV4cGlyZWQ6ICdFeHBpcmVkJyxcbiAgbm90X25lZWRlZDogJ05vIExvbmdlciBOZWVkZWQnLFxuICBvcGVuOiAnT3BlbicsXG4gIG1pdGlnYXRpbmc6ICdNaXRpZ2F0aW5nJyxcbiAgYWNjZXB0ZWQ6ICdBY2NlcHRlZCcsXG4gIGNsb3NlZDogJ0Nsb3NlZCcsXG4gIGFjdGl2ZTogJ0FjdGl2ZScsXG4gIHdvcmthcm91bmQ6ICdXb3JrYXJvdW5kIEluIFBsYWNlJyxcbiAgcmVzb2x2ZWQ6ICdSZXNvbHZlZCcsXG4gIGFuc3dlcmVkOiAnQW5zd2VyZWQnLFxuICBwYXJrZWQ6ICdQYXJrZWQnLFxuICBzY2hlZHVsZWQ6ICdTY2hlZHVsZWQnLFxuICBoZWxkOiAnSGVsZCcsXG4gIHN1bW1hcml6ZWQ6ICdTdW1tYXJpemVkJyxcbn07XG5cbi8qKiBTdGF0dXNlcyB0aGF0IGNvdW50IGFzIFwiY2xvc2VkL3Rlcm1pbmFsXCIgZm9yIHByb2dyZXNzICsgZGFzaGJvYXJkcy4gKi9cbmV4cG9ydCBjb25zdCBURVJNSU5BTF9TVEFUVVNFUyA9IG5ldyBTZXQoW1xuICAnZG9uZScsXG4gICdjYW5jZWxsZWQnLFxuICAncmVqZWN0ZWQnLFxuICAnc3VwZXJzZWRlZCcsXG4gICdncmFudGVkJyxcbiAgJ2RlbmllZCcsXG4gICdleHBpcmVkJyxcbiAgJ25vdF9uZWVkZWQnLFxuICAnY2xvc2VkJyxcbiAgJ3Jlc29sdmVkJyxcbiAgJ2Fuc3dlcmVkJyxcbiAgJ3N1bW1hcml6ZWQnLFxuICAnYWNjZXB0ZWQnLFxuXSk7XG5cbmV4cG9ydCBjb25zdCBQUklPUklUSUVTID0gWyd1cmdlbnQnLCAnaGlnaCcsICdtZWRpdW0nLCAnbG93JywgJ25vbmUnXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIFByaW9yaXR5ID0gKHR5cGVvZiBQUklPUklUSUVTKVtudW1iZXJdO1xuXG4vLyAtLS0tLS0tLS0tIExpbmtzIC0tLS0tLS0tLS1cbmV4cG9ydCBjb25zdCBMSU5LX0tJTkRTID0gW1xuICAncmVsYXRlcycsIC8vIGdlbmVyaWMgYmlkaXJlY3Rpb25hbFxuICAnYmxvY2tzJywgLy8gZnJvbSBibG9ja3MgdG9cbiAgJ2ltcGxlbWVudHMnLCAvLyB0YXNrIGltcGxlbWVudHMgcmVxdWlyZW1lbnQvZmVhdHVyZVxuICAnc3VwcG9ydHMnLCAvLyByZXF1aXJlbWVudCBzdXBwb3J0cyBmZWF0dXJlXG4gICdzaGFwZWRfYnknLCAvLyBpdGVtIHNoYXBlZCBieSBkZWNpc2lvblxuICAncmVxdWlyZXNfYWNjZXNzJywgLy8gaXRlbSByZXF1aXJlcyBhY2Nlc3MgcmVjb3JkXG4gICdkaXNjdXNzZWRfaW4nLCAvLyBpdGVtIGRpc2N1c3NlZCBpbiBtZWV0aW5nXG4gICd2YWxpZGF0ZXMnLCAvLyB0ZXN0L2RlZmVjdCB2YWxpZGF0ZXMgcmVxdWlyZW1lbnRcbiAgJ3N1cGVyc2VkZXMnLCAvLyBkZWNpc2lvbiBzdXBlcnNlZGVzIGRlY2lzaW9uXG4gICdwYXJlbnQnLCAvLyBmcm9tIGlzIHBhcmVudCBvZiB0byAoYWxzbyBtaXJyb3JlZCB2aWEgaXRlbXMucGFyZW50X2lkKVxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIExpbmtLaW5kID0gKHR5cGVvZiBMSU5LX0tJTkRTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgTElOS19MQUJFTDogUmVjb3JkPExpbmtLaW5kLCBbc3RyaW5nLCBzdHJpbmddPiA9IHtcbiAgLy8gW2xhYmVsIGZyb20tPnRvLCBsYWJlbCB0by0+ZnJvbV1cbiAgcmVsYXRlczogWydyZWxhdGVzIHRvJywgJ3JlbGF0ZXMgdG8nXSxcbiAgYmxvY2tzOiBbJ2Jsb2NrcycsICdibG9ja2VkIGJ5J10sXG4gIGltcGxlbWVudHM6IFsnaW1wbGVtZW50cycsICdpbXBsZW1lbnRlZCBieSddLFxuICBzdXBwb3J0czogWydzdXBwb3J0cycsICdzdXBwb3J0ZWQgYnknXSxcbiAgc2hhcGVkX2J5OiBbJ3NoYXBlZCBieScsICdzaGFwZWQnXSxcbiAgcmVxdWlyZXNfYWNjZXNzOiBbJ3JlcXVpcmVzIGFjY2VzcycsICdyZXF1aXJlZCBmb3InXSxcbiAgZGlzY3Vzc2VkX2luOiBbJ2Rpc2N1c3NlZCBpbicsICdkaXNjdXNzZWQnXSxcbiAgdmFsaWRhdGVzOiBbJ3ZhbGlkYXRlcycsICd2YWxpZGF0ZWQgYnknXSxcbiAgc3VwZXJzZWRlczogWydzdXBlcnNlZGVzJywgJ3N1cGVyc2VkZWQgYnknXSxcbiAgcGFyZW50OiBbJ3BhcmVudCBvZicsICdjaGlsZCBvZiddLFxufTtcblxuLy8gLS0tLS0tLS0tLSBDb3JlIHJlY29yZHMgLS0tLS0tLS0tLVxuZXhwb3J0IGludGVyZmFjZSBXb3JrSXRlbSB7XG4gIGlkOiBzdHJpbmc7IC8vIHV1aWQgXHUyMDE0IGNhbm9uaWNhbCBpZGVudGl0eSwgdXNlZCBieSBhbGwgcmVmZXJlbmNlc1xuICBpZGVudDogc3RyaW5nOyAvLyBkaXNwbGF5IGlkIGUuZy4gUkVRLTQxIChtYXkgYmUgcmVudW1iZXJlZCBvbiBzeW5jIGNvbGxpc2lvbilcbiAgdHlwZTogSXRlbVR5cGU7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGJvZHk6IHN0cmluZzsgLy8gcmljaCBkb2MgSlNPTiAoZWRpdG9yIGRvY3VtZW50KSwgJycgd2hlbiBlbXB0eVxuICBib2R5VGV4dDogc3RyaW5nOyAvLyBwbGFpbiB0ZXh0IHByb2plY3Rpb24gZm9yIHNlYXJjaFxuICBzdGF0dXM6IHN0cmluZztcbiAgcHJpb3JpdHk6IFByaW9yaXR5O1xuICBvd25lcklkOiBzdHJpbmcgfCBudWxsO1xuICByZXBvcnRlcklkOiBzdHJpbmcgfCBudWxsO1xuICBtaWxlc3RvbmVJZDogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZUlkOiBzdHJpbmcgfCBudWxsO1xuICBwYXJlbnRJZDogc3RyaW5nIHwgbnVsbDtcbiAgc3RhcnREYXRlOiBzdHJpbmcgfCBudWxsOyAvLyBJU08gZGF0ZVxuICBkdWVEYXRlOiBzdHJpbmcgfCBudWxsO1xuICBjb21wbGV0ZWRBdDogc3RyaW5nIHwgbnVsbDsgLy8gSVNPIGRhdGV0aW1lXG4gIGVmZm9ydDogbnVtYmVyIHwgbnVsbDsgLy8gcG9pbnRzL2RheXMsIHVuaXQgaXMgdGVhbSBjb252ZW50aW9uXG4gIGNvbmZpZGVuY2U6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCBudWxsO1xuICByaXNrTGV2ZWw6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAnY3JpdGljYWwnIHwgbnVsbDtcbiAgYnVzaW5lc3NWYWx1ZTogc3RyaW5nIHwgbnVsbDtcbiAgbGVhZGVyc2hpcFZpc2libGU6IDAgfCAxO1xuICBwcm9ncmVzczogbnVtYmVyIHwgbnVsbDsgLy8gMC0xMDAgbWFudWFsIG92ZXJyaWRlOyBudWxsID0gZGVyaXZlZFxuICB0YWdzOiBzdHJpbmdbXTtcbiAgZXh0cmE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+OyAvLyB0eXBlLXNwZWNpZmljIGZpZWxkcyAoc2VlIGRvY3MvVEVSTUlOT0xPR1kubWQpXG4gIGFyY2hpdmVkOiAwIHwgMTtcbiAgc2FtcGxlOiAwIHwgMTsgLy8gc2VlZGVkIHNhbXBsZSBkYXRhIGZsYWdcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xuICBjcmVhdGVkQnk6IHN0cmluZztcbiAgdXBkYXRlZEJ5OiBzdHJpbmc7XG59XG5cbi8vIFR5cGUtc3BlY2lmaWMgYGV4dHJhYCBzaGFwZXMgKGRvY3VtZW50ZWQsIG5vdCBlbmZvcmNlZCBieSBEQik6XG4vLyBhY2Nlc3M6ICAgeyBzeXN0ZW0sIGFjY2Vzc1R5cGUsIGJ1c2luZXNzUmVhc29uLCByZXF1ZXN0ZWRGcm9tLCByZXF1ZXN0RGF0ZSxcbi8vICAgICAgICAgICAgIGFwcHJvdmVkQnksIGRhdGVHcmFudGVkLCBleHBpcmF0aW9uRGF0ZSwgcmVuZXdhbERhdGUsIHNlY3VyaXR5Tm90ZXMsIG5leHRBY3Rpb24sIGZvbGxvd1VwRGF0ZSB9XG4vLyBkZWNpc2lvbjogeyBjb250ZXh0LCBwcm9ibGVtLCBvcHRpb25zOiBbe3RpdGxlLCBub3Rlcywgc2VsZWN0ZWR9XSwgcmVhc29uaW5nLFxuLy8gICAgICAgICAgICAgdHJhZGVvZmZzLCBjb25zZXF1ZW5jZXMsIHJldmlld0RhdGUsIGNvbnRyaWJ1dG9yczogc3RyaW5nW10gfVxuLy8gbWVldGluZzogIHsgZGF0ZSwgdGltZSwgYXR0ZW5kZWVzOiBzdHJpbmdbXSwgcHVycG9zZSwgYWdlbmRhLCBmb2xsb3dVcERhdGUgfVxuLy8gcmlzazogICAgIHsgbGlrZWxpaG9vZCwgaW1wYWN0LCBtaXRpZ2F0aW9uLCB0cmlnZ2VyIH1cbi8vIGJsb2NrZXI6ICB7IHdhaXRpbmdPbiwgc2luY2UsIGVzY2FsYXRlZFRvIH1cbi8vIHJlcXVpcmVtZW50OiB7IGFjY2VwdGFuY2VDcml0ZXJpYSwgdGVzdGluZ05vdGVzLCBzZWN1cml0eUNvbnNpZGVyYXRpb25zIH1cblxuZXhwb3J0IGludGVyZmFjZSBJdGVtTGluayB7XG4gIGlkOiBzdHJpbmc7XG4gIGZyb21JZDogc3RyaW5nO1xuICB0b0lkOiBzdHJpbmc7XG4gIGtpbmQ6IExpbmtLaW5kO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgY3JlYXRlZEJ5OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tbWVudCB7XG4gIGlkOiBzdHJpbmc7XG4gIGl0ZW1JZDogc3RyaW5nO1xuICBhdXRob3JJZDogc3RyaW5nO1xuICBib2R5OiBzdHJpbmc7IC8vIHJpY2ggZG9jIEpTT05cbiAgYm9keVRleHQ6IHN0cmluZztcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nIHwgbnVsbDtcbiAgZGVsZXRlZDogMCB8IDE7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXR0YWNobWVudCB7XG4gIGlkOiBzdHJpbmc7XG4gIGl0ZW1JZDogc3RyaW5nO1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICBtaW1lOiBzdHJpbmc7XG4gIHNpemU6IG51bWJlcjtcbiAgc2hhMjU2OiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCBudWxsO1xuICB1cGxvYWRlZEJ5OiBzdHJpbmc7XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xuICBkZWxldGVkOiAwIHwgMTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBY3Rpdml0eUVudHJ5IHtcbiAgaWQ6IHN0cmluZztcbiAgaXRlbUlkOiBzdHJpbmcgfCBudWxsO1xuICBhY3RvcklkOiBzdHJpbmc7XG4gIGtpbmQ6IHN0cmluZzsgLy8gY3JlYXRlZCB8IHVwZGF0ZWQgfCBzdGF0dXMgfCBjb21tZW50IHwgbGluayB8IGF0dGFjaG1lbnQgfCBhcmNoaXZlZCB8IHJlc3RvcmVkIHwgLi4uXG4gIGZpZWxkOiBzdHJpbmcgfCBudWxsO1xuICBvbGRWYWx1ZTogc3RyaW5nIHwgbnVsbDtcbiAgbmV3VmFsdWU6IHN0cmluZyB8IG51bGw7XG4gIGF0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSXRlbVZlcnNpb24ge1xuICBpZDogc3RyaW5nO1xuICBpdGVtSWQ6IHN0cmluZztcbiAgdmVyc2lvbjogbnVtYmVyO1xuICB0aXRsZTogc3RyaW5nO1xuICBib2R5OiBzdHJpbmc7XG4gIHNhdmVkQnk6IHN0cmluZztcbiAgc2F2ZWRBdDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbGVzdG9uZSB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgdGFyZ2V0RGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgc3RhdHVzOiAncGxhbm5lZCcgfCAnYWN0aXZlJyB8ICdkb25lJztcbiAgc29ydDogbnVtYmVyO1xuICBzYW1wbGU6IDAgfCAxO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlbGVhc2Uge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIHZlcnNpb246IHN0cmluZztcbiAgdGFyZ2V0RGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgc3RhdHVzOiAncGxhbm5lZCcgfCAnaW5fcHJvZ3Jlc3MnIHwgJ3JlbGVhc2VkJyB8ICdjYW5jZWxsZWQnO1xuICBnb2Fsczogc3RyaW5nO1xuICBub3Rlczogc3RyaW5nOyAvLyByZWxlYXNlIG5vdGVzIHJpY2ggZG9jXG4gIHNhbXBsZTogMCB8IDE7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlciB7XG4gIGlkOiBzdHJpbmc7IC8vIHN0YWJsZSBzbHVnLCBlLmcuICdqb2huJywgJ21hcmsnXG4gIG5hbWU6IHN0cmluZztcbiAgaW5pdGlhbHM6IHN0cmluZztcbiAgY29sb3I6IHN0cmluZztcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2F2ZWRWaWV3IHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBjb25maWc6IFJlY29yZDxzdHJpbmcsIHVua25vd24+OyAvLyB7dmlldywgZmlsdGVycywgc29ydCwgZ3JvdXB9XG4gIHBpbm5lZDogMCB8IDE7XG4gIGNyZWF0ZWRCeTogc3RyaW5nO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbn1cblxuLy8gLS0tLS0tLS0tLSBTeW5jIC0tLS0tLS0tLS1cbmV4cG9ydCBpbnRlcmZhY2UgT3Age1xuICBvcElkOiBzdHJpbmc7IC8vIHV1aWRcbiAgZGV2aWNlSWQ6IHN0cmluZztcbiAgYWN0b3JJZDogc3RyaW5nO1xuICBsYW1wb3J0OiBudW1iZXI7XG4gIGF0OiBzdHJpbmc7IC8vIHdhbGwgY2xvY2ssIGluZm9ybWF0aW9uYWwgb25seSBcdTIwMTQgb3JkZXJpbmcgdXNlcyBsYW1wb3J0XG4gIGVudGl0eTogJ2l0ZW0nIHwgJ2xpbmsnIHwgJ2NvbW1lbnQnIHwgJ2F0dGFjaG1lbnQnIHwgJ21pbGVzdG9uZScgfCAncmVsZWFzZScgfCAndXNlcicgfCAnc2F2ZWRfdmlldycgfCAndGFnc2V0JztcbiAgZW50aXR5SWQ6IHN0cmluZztcbiAgYWN0aW9uOiAnY3JlYXRlJyB8ICdzZXQnIHwgJ2RlbGV0ZSc7XG4gIC8vIGNyZWF0ZTogcGF5bG9hZCA9IGZ1bGwgcmVjb3JkLiBzZXQ6IHBheWxvYWQgPSB7ZmllbGQ6IHZhbHVlLC4uLn0uIGRlbGV0ZTogcGF5bG9hZCA9IHt9LlxuICBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTeW5jQ29uZmxpY3Qge1xuICBpZDogc3RyaW5nO1xuICBlbnRpdHk6IHN0cmluZztcbiAgZW50aXR5SWQ6IHN0cmluZztcbiAgZmllbGQ6IHN0cmluZztcbiAgbG9jYWxWYWx1ZTogc3RyaW5nO1xuICByZW1vdGVWYWx1ZTogc3RyaW5nO1xuICByZW1vdGVEZXZpY2U6IHN0cmluZztcbiAgcmVtb3RlQWN0b3I6IHN0cmluZztcbiAgZGV0ZWN0ZWRBdDogc3RyaW5nO1xuICByZXNvbHZlZEF0OiBzdHJpbmcgfCBudWxsO1xuICByZXNvbHV0aW9uOiAnbG9jYWwnIHwgJ3JlbW90ZScgfCAnbWVyZ2VkJyB8IG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIFN5bmNTdGF0dXNTdGF0ZSA9ICdkaXNhYmxlZCcgfCAnaWRsZScgfCAnc3luY2luZycgfCAnb2ZmbGluZScgfCAnZXJyb3InO1xuZXhwb3J0IGludGVyZmFjZSBTeW5jU3RhdHVzIHtcbiAgc3RhdGU6IFN5bmNTdGF0dXNTdGF0ZTtcbiAgZm9sZGVyOiBzdHJpbmcgfCBudWxsO1xuICBsYXN0U3luY0F0OiBzdHJpbmcgfCBudWxsO1xuICBsYXN0RXJyb3I6IHN0cmluZyB8IG51bGw7XG4gIHBlbmRpbmdPcHM6IG51bWJlcjtcbiAgb3BlbkNvbmZsaWN0czogbnVtYmVyO1xuICBwZWVyczogeyBkZXZpY2VJZDogc3RyaW5nOyB1c2VyTmFtZTogc3RyaW5nIHwgbnVsbDsgbGFzdFNlZW5BdDogc3RyaW5nIHwgbnVsbCB9W107XG59XG5cbi8vIC0tLS0tLS0tLS0gUXVlcmllcyAtLS0tLS0tLS0tXG5leHBvcnQgaW50ZXJmYWNlIEl0ZW1GaWx0ZXIge1xuICB0eXBlcz86IEl0ZW1UeXBlW107XG4gIHN0YXR1c2VzPzogc3RyaW5nW107XG4gIHByaW9yaXRpZXM/OiBQcmlvcml0eVtdO1xuICBvd25lcklkcz86IChzdHJpbmcgfCBudWxsKVtdO1xuICBtaWxlc3RvbmVJZD86IHN0cmluZztcbiAgcmVsZWFzZUlkPzogc3RyaW5nO1xuICB0YWc/OiBzdHJpbmc7XG4gIHRleHQ/OiBzdHJpbmc7IC8vIEZUUyBxdWVyeVxuICBhcmNoaXZlZD86IGJvb2xlYW47IC8vIGRlZmF1bHQgZmFsc2VcbiAgb3ZlcmR1ZT86IGJvb2xlYW47XG4gIGR1ZVdpdGhpbkRheXM/OiBudW1iZXI7XG4gIGxlYWRlcnNoaXBWaXNpYmxlPzogYm9vbGVhbjtcbiAgdXBkYXRlZFNpbmNlPzogc3RyaW5nO1xuICBwYXJlbnRJZD86IHN0cmluZztcbiAgc2FtcGxlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJdGVtU29ydCB7XG4gIGZpZWxkOiAnaWRlbnQnIHwgJ3RpdGxlJyB8ICdzdGF0dXMnIHwgJ3ByaW9yaXR5JyB8ICdkdWVEYXRlJyB8ICdjcmVhdGVkQXQnIHwgJ3VwZGF0ZWRBdCcgfCAnbWFudWFsJztcbiAgZGlyOiAnYXNjJyB8ICdkZXNjJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWFyY2hSZXN1bHQge1xuICBpdGVtOiBXb3JrSXRlbTtcbiAgc25pcHBldDogc3RyaW5nIHwgbnVsbDtcbiAgc2NvcmU6IG51bWJlcjtcbn1cbiIsICIvLyBTeW5jVHJhbnNwb3J0OiB0aGUgc2VhbSBiZXR3ZWVuIEtleXN0b25lIGFuZCB3aGF0ZXZlciBtb3ZlcyBieXRlcyBiZXR3ZWVuIG1hY2hpbmVzLlxuLy8gdjEgc2hpcHMgRm9sZGVyVHJhbnNwb3J0IChhIE9uZURyaXZlL1NoYXJlUG9pbnQtc3luY2VkIGZvbGRlcikuIFRoZSBpbnRlcmZhY2UgaXNcbi8vIGRlbGliZXJhdGVseSBkdW1iIFx1MjAxNCBhcHBlbmQtb25seSBiYXRjaGVzIG91dCwgYmF0Y2hlcyBpbiBcdTIwMTQgc28gYSBmdXR1cmUgQXp1cmUgU1FMIC9cbi8vIERhdGF2ZXJzZSAvIGludGVybmFsIEFQSSB0cmFuc3BvcnQgc2xvdHMgaW4gd2l0aG91dCB0b3VjaGluZyBtZXJnZSBsb2dpYy5cblxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB0eXBlIHsgT3AgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBlZXJJbmZvIHtcbiAgZGV2aWNlSWQ6IHN0cmluZztcbiAgdXNlck5hbWU6IHN0cmluZyB8IG51bGw7XG4gIGxhc3RTZWVuQXQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3BCYXRjaEZpbGUge1xuICBkZXZpY2VJZDogc3RyaW5nO1xuICBmaWxlTmFtZTogc3RyaW5nOyAvLyBzb3J0YWJsZSwgdW5pcXVlIHBlciBkZXZpY2VcbiAgb3BzOiBPcFtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN5bmNUcmFuc3BvcnQge1xuICAvKiogSHVtYW4tcmVhZGFibGUgbG9jYXRpb24gZm9yIHRoZSBVSSAoXCJ3aGVyZSBpcyBteSBkYXRhXCIpLiAqL1xuICBsb2NhdGlvbigpOiBzdHJpbmc7XG4gIC8qKiBUcnVlIHdoZW4gdGhlIGJhY2tpbmcgbWVkaXVtIGlzIHJlYWNoYWJsZSByaWdodCBub3cuICovXG4gIGF2YWlsYWJsZSgpOiBib29sZWFuO1xuICAvKiogUHVibGlzaCBhIGJhdGNoIG9mIHRoaXMgZGV2aWNlJ3Mgb3BzLiBNdXN0IGJlIGF0b21pYyAoYWxsLW9yLW5vdGhpbmcgdmlzaWJsZSkuICovXG4gIHB1Ymxpc2hPcHMoZGV2aWNlSWQ6IHN0cmluZywgYmF0Y2hOYW1lOiBzdHJpbmcsIG9wczogT3BbXSk6IFByb21pc2U8dm9pZD47XG4gIC8qKiBMaXN0IHBlZXIgYmF0Y2ggZmlsZSBuYW1lcyAoc29ydGVkIGFzY2VuZGluZykgbmV3ZXIgdGhhbiBgYWZ0ZXJGaWxlYCBmb3IgZWFjaCBwZWVyLiAqL1xuICBsaXN0UGVlckJhdGNoZXMob3duRGV2aWNlSWQ6IHN0cmluZywgYWZ0ZXJGaWxlQnlEZXZpY2U6IE1hcDxzdHJpbmcsIHN0cmluZyB8IG51bGw+KTogUHJvbWlzZTx7IGRldmljZUlkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfVtdPjtcbiAgLyoqIEZldGNoIG9uZSBiYXRjaC4gKi9cbiAgZmV0Y2hCYXRjaChkZXZpY2VJZDogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nKTogUHJvbWlzZTxPcFtdPjtcbiAgLyoqIEFubm91bmNlIHByZXNlbmNlIChvd24gZmlsZSBvbmx5IFx1MjAxNCBubyB3cml0ZSBjb250ZW50aW9uKS4gKi9cbiAgYW5ub3VuY2UoZGV2aWNlSWQ6IHN0cmluZywgdXNlck5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG4gIC8qKiBBbGwgYW5ub3VuY2VkIGRldmljZXMuICovXG4gIGxpc3RQZWVycygpOiBQcm9taXNlPFBlZXJJbmZvW10+O1xuICAvKiogU3RvcmUgYW4gYXR0YWNobWVudCBibG9iIGNvbnRlbnQtYWRkcmVzc2VkIGJ5IHNoYTI1Ni4gUmV0dXJucyB0cnVlIGlmIG5ld2x5IHN0b3JlZC4gKi9cbiAgcHV0QmxvYihzaGEyNTY6IHN0cmluZywgZGF0YTogQnVmZmVyKTogUHJvbWlzZTxib29sZWFuPjtcbiAgLyoqIEZldGNoIGFuIGF0dGFjaG1lbnQgYmxvYiwgbnVsbCBpZiBub3QgKHlldCkgcHJlc2VudC4gKi9cbiAgZ2V0QmxvYihzaGEyNTY6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyIHwgbnVsbD47XG59XG5cbi8qKlxuICogRm9sZGVyVHJhbnNwb3J0IFx1MjAxNCBzaGFyZWQtZm9sZGVyIGxheW91dDpcbiAqICAgPHJvb3Q+L29wcy88ZGV2aWNlSWQ+LzAwMDAwMDAwMDAxLmpzb25sICAgb3AgYmF0Y2hlcywgb25lIEpTT04gb3AgcGVyIGxpbmVcbiAqICAgPHJvb3Q+L29wcy88ZGV2aWNlSWQ+L2RldmljZS5qc29uICAgICAgICAgIHByZXNlbmNlICsgaWRlbnRpdHlcbiAqICAgPHJvb3Q+L2Jsb2JzLzxhYT4vPHNoYTI1Nj4gICAgICAgICAgICAgICAgIGNvbnRlbnQtYWRkcmVzc2VkIGF0dGFjaG1lbnRzXG4gKlxuICogQ29ycmVjdG5lc3MgcnVsZXM6XG4gKiAtIEEgZGV2aWNlIHdyaXRlcyBPTkxZIHVuZGVyIGl0cyBvd24gb3BzLzxkZXZpY2VJZD4vIGRpcmVjdG9yeSBcdTIxOTIgbm8gd3JpdGUgY29udGVudGlvbixcbiAqICAgbm8gc2hhcmVkLWZpbGUgbG9ja2luZywgbm8gU1FMaXRlLW92ZXItT25lRHJpdmUgY29ycnVwdGlvbiBjbGFzcy5cbiAqIC0gRmlsZXMgYXJlIHdyaXR0ZW4gdG8gYSB0ZW1wIG5hbWUgdGhlbiByZW5hbWVkIFx1MjE5MiByZWFkZXJzIG5ldmVyIHNlZSBwYXJ0aWFsIGJhdGNoZXMuXG4gKiAtIEJhdGNoZXMgYXJlIGltbXV0YWJsZSBvbmNlIHB1Ymxpc2hlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIEZvbGRlclRyYW5zcG9ydCBpbXBsZW1lbnRzIFN5bmNUcmFuc3BvcnQge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IHN0cmluZykge31cblxuICBsb2NhdGlvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJvb3Q7XG4gIH1cblxuICBhdmFpbGFibGUoKTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4odGhpcy5yb290LCAnb3BzJyksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvcHNEaXIoZGV2aWNlSWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHBhdGguam9pbih0aGlzLnJvb3QsICdvcHMnLCBkZXZpY2VJZCk7XG4gIH1cblxuICBhc3luYyBwdWJsaXNoT3BzKGRldmljZUlkOiBzdHJpbmcsIGJhdGNoTmFtZTogc3RyaW5nLCBvcHM6IE9wW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBkaXIgPSB0aGlzLm9wc0RpcihkZXZpY2VJZCk7XG4gICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgY29uc3QgZmluYWxQYXRoID0gcGF0aC5qb2luKGRpciwgYmF0Y2hOYW1lKTtcbiAgICBjb25zdCB0bXBQYXRoID0gZmluYWxQYXRoICsgJy50bXAnO1xuICAgIGNvbnN0IGxpbmVzID0gb3BzLm1hcCgobykgPT4gSlNPTi5zdHJpbmdpZnkobykpLmpvaW4oJ1xcbicpICsgJ1xcbic7XG4gICAgZnMud3JpdGVGaWxlU3luYyh0bXBQYXRoLCBsaW5lcywgJ3V0ZjgnKTtcbiAgICBmcy5yZW5hbWVTeW5jKHRtcFBhdGgsIGZpbmFsUGF0aCk7XG4gIH1cblxuICBhc3luYyBsaXN0UGVlckJhdGNoZXMoXG4gICAgb3duRGV2aWNlSWQ6IHN0cmluZyxcbiAgICBhZnRlckZpbGVCeURldmljZTogTWFwPHN0cmluZywgc3RyaW5nIHwgbnVsbD4sXG4gICk6IFByb21pc2U8eyBkZXZpY2VJZDogc3RyaW5nOyBmaWxlTmFtZTogc3RyaW5nIH1bXT4ge1xuICAgIGNvbnN0IG9wc1Jvb3QgPSBwYXRoLmpvaW4odGhpcy5yb290LCAnb3BzJyk7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKG9wc1Jvb3QpKSByZXR1cm4gW107XG4gICAgY29uc3Qgb3V0OiB7IGRldmljZUlkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfVtdID0gW107XG4gICAgZm9yIChjb25zdCBkZXYgb2YgZnMucmVhZGRpclN5bmMob3BzUm9vdCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pKSB7XG4gICAgICBpZiAoIWRldi5pc0RpcmVjdG9yeSgpIHx8IGRldi5uYW1lID09PSBvd25EZXZpY2VJZCkgY29udGludWU7XG4gICAgICBjb25zdCBhZnRlciA9IGFmdGVyRmlsZUJ5RGV2aWNlLmdldChkZXYubmFtZSkgPz8gbnVsbDtcbiAgICAgIGNvbnN0IGZpbGVzID0gZnNcbiAgICAgICAgLnJlYWRkaXJTeW5jKHBhdGguam9pbihvcHNSb290LCBkZXYubmFtZSkpXG4gICAgICAgIC5maWx0ZXIoKGYpID0+IGYuZW5kc1dpdGgoJy5qc29ubCcpKVxuICAgICAgICAuc29ydCgpO1xuICAgICAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB7XG4gICAgICAgIGlmIChhZnRlciAmJiBmIDw9IGFmdGVyKSBjb250aW51ZTtcbiAgICAgICAgb3V0LnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIGZpbGVOYW1lOiBmIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgYXN5bmMgZmV0Y2hCYXRjaChkZXZpY2VJZDogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nKTogUHJvbWlzZTxPcFtdPiB7XG4gICAgY29uc3QgcCA9IHBhdGguam9pbih0aGlzLm9wc0RpcihkZXZpY2VJZCksIGZpbGVOYW1lKTtcbiAgICBjb25zdCB0ZXh0ID0gZnMucmVhZEZpbGVTeW5jKHAsICd1dGY4Jyk7XG4gICAgY29uc3Qgb3BzOiBPcFtdID0gW107XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIHRleHQuc3BsaXQoJ1xcbicpKSB7XG4gICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gICAgICBpZiAoIXRyaW1tZWQpIGNvbnRpbnVlO1xuICAgICAgb3BzLnB1c2goSlNPTi5wYXJzZSh0cmltbWVkKSBhcyBPcCk7XG4gICAgfVxuICAgIHJldHVybiBvcHM7XG4gIH1cblxuICBhc3luYyBhbm5vdW5jZShkZXZpY2VJZDogc3RyaW5nLCB1c2VyTmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGlyID0gdGhpcy5vcHNEaXIoZGV2aWNlSWQpO1xuICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4oZGlyLCAnZGV2aWNlLmpzb24nKTtcbiAgICBjb25zdCB0bXAgPSBwICsgJy50bXAnO1xuICAgIGZzLndyaXRlRmlsZVN5bmModG1wLCBKU09OLnN0cmluZ2lmeSh7IGRldmljZUlkLCB1c2VyTmFtZSwgbGFzdFNlZW5BdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pLCAndXRmOCcpO1xuICAgIGZzLnJlbmFtZVN5bmModG1wLCBwKTtcbiAgfVxuXG4gIGFzeW5jIGxpc3RQZWVycygpOiBQcm9taXNlPFBlZXJJbmZvW10+IHtcbiAgICBjb25zdCBvcHNSb290ID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ29wcycpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhvcHNSb290KSkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IHBlZXJzOiBQZWVySW5mb1tdID0gW107XG4gICAgZm9yIChjb25zdCBkZXYgb2YgZnMucmVhZGRpclN5bmMob3BzUm9vdCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pKSB7XG4gICAgICBpZiAoIWRldi5pc0RpcmVjdG9yeSgpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4ob3BzUm9vdCwgZGV2Lm5hbWUsICdkZXZpY2UuanNvbicpO1xuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHApKSB7XG4gICAgICAgIHBlZXJzLnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIHVzZXJOYW1lOiBudWxsLCBsYXN0U2VlbkF0OiBudWxsIH0pO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGluZm8gPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwLCAndXRmOCcpKSBhcyBQZWVySW5mbztcbiAgICAgICAgcGVlcnMucHVzaCh7IGRldmljZUlkOiBkZXYubmFtZSwgdXNlck5hbWU6IGluZm8udXNlck5hbWUgPz8gbnVsbCwgbGFzdFNlZW5BdDogaW5mby5sYXN0U2VlbkF0ID8/IG51bGwgfSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgcGVlcnMucHVzaCh7IGRldmljZUlkOiBkZXYubmFtZSwgdXNlck5hbWU6IG51bGwsIGxhc3RTZWVuQXQ6IG51bGwgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwZWVycztcbiAgfVxuXG4gIGFzeW5jIHB1dEJsb2Ioc2hhMjU2OiBzdHJpbmcsIGRhdGE6IEJ1ZmZlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRpciA9IHBhdGguam9pbih0aGlzLnJvb3QsICdibG9icycsIHNoYTI1Ni5zbGljZSgwLCAyKSk7XG4gICAgY29uc3QgcCA9IHBhdGguam9pbihkaXIsIHNoYTI1Nik7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMocCkpIHJldHVybiBmYWxzZTtcbiAgICBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zdCB0bXAgPSBwICsgJy50bXAtJyArIHByb2Nlc3MucGlkO1xuICAgIGZzLndyaXRlRmlsZVN5bmModG1wLCBkYXRhKTtcbiAgICB0cnkge1xuICAgICAgZnMucmVuYW1lU3luYyh0bXAsIHApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgZnMucm1TeW5jKHRtcCwgeyBmb3JjZTogdHJ1ZSB9KTsgLy8gcGVlciB3b24gdGhlIHJhY2U7IGNvbnRlbnQtYWRkcmVzc2VkIHNvIGlkZW50aWNhbFxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGdldEJsb2Ioc2hhMjU2OiBzdHJpbmcpOiBQcm9taXNlPEJ1ZmZlciB8IG51bGw+IHtcbiAgICBjb25zdCBwID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ2Jsb2JzJywgc2hhMjU2LnNsaWNlKDAsIDIpLCBzaGEyNTYpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhwKSkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhwKTtcbiAgfVxufVxuIiwgIi8vIFN5bmNFbmdpbmU6IHBlcmlvZGljICsgZXZlbnQtZHJpdmVuIGV4cG9ydC9pbXBvcnQgbG9vcCBvdmVyIGEgU3luY1RyYW5zcG9ydC5cbi8vIExvY2FsLWZpcnN0OiB0aGUgYXBwIGlzIGZ1bGx5IHVzYWJsZSB3aXRoIHN5bmMgZGlzYWJsZWQgb3IgdGhlIGZvbGRlciBvZmZsaW5lO1xuLy8gb3BzIHF1ZXVlIGluIHRoZSBvcGxvZyBhbmQgZmx1c2ggd2hlbiB0aGUgdHJhbnNwb3J0IHJldHVybnMuXG5cbmltcG9ydCB0eXBlIHsgU3RvcmUgfSBmcm9tICcuLi9kYi9zdG9yZSc7XG5pbXBvcnQgeyBnZXRNZXRhLCBzZXRNZXRhIH0gZnJvbSAnLi4vZGIvZGInO1xuaW1wb3J0IHR5cGUgeyBTeW5jVHJhbnNwb3J0IH0gZnJvbSAnLi90cmFuc3BvcnQnO1xuaW1wb3J0IHR5cGUgeyBTeW5jU3RhdHVzLCBTeW5jU3RhdHVzU3RhdGUgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuXG5jb25zdCBFWFBPUlRfREVCT1VOQ0VfTVMgPSAxXzUwMDtcbmNvbnN0IFBPTExfSU5URVJWQUxfTVMgPSA1XzAwMDtcblxuZXhwb3J0IGNsYXNzIFN5bmNFbmdpbmUge1xuICBwcml2YXRlIHRyYW5zcG9ydDogU3luY1RyYW5zcG9ydCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGV4cG9ydFRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJ1bm5pbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXJyZW50OiBQcm9taXNlPHZvaWQ+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIHByaXZhdGUgc3RhdGU6IFN5bmNTdGF0dXNTdGF0ZSA9ICdkaXNhYmxlZCc7XG4gIHByaXZhdGUgbGFzdEVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsYXN0U3luY0F0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB1c2VyTmFtZTogc3RyaW5nO1xuICBwcml2YXRlIG9uU3RhdHVzOiAoczogU3luY1N0YXR1cykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHN0b3JlOiBTdG9yZSxcbiAgICB1c2VyTmFtZTogc3RyaW5nLFxuICAgIG9uU3RhdHVzOiAoczogU3luY1N0YXR1cykgPT4gdm9pZCxcbiAgKSB7XG4gICAgdGhpcy51c2VyTmFtZSA9IHVzZXJOYW1lO1xuICAgIHRoaXMub25TdGF0dXMgPSBvblN0YXR1cztcbiAgfVxuXG4gIHNldFRyYW5zcG9ydCh0cmFuc3BvcnQ6IFN5bmNUcmFuc3BvcnQgfCBudWxsKTogdm9pZCB7XG4gICAgdGhpcy50cmFuc3BvcnQgPSB0cmFuc3BvcnQ7XG4gICAgaWYgKHRoaXMudGltZXIpIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcik7XG4gICAgdGhpcy50aW1lciA9IG51bGw7XG4gICAgaWYgKHRyYW5zcG9ydCkge1xuICAgICAgdGhpcy5zdGF0ZSA9ICdpZGxlJztcbiAgICAgIHRoaXMudGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB2b2lkIHRoaXMuY3ljbGUoKSwgUE9MTF9JTlRFUlZBTF9NUyk7XG4gICAgICB2b2lkIHRoaXMuY3ljbGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZSA9ICdkaXNhYmxlZCc7XG4gICAgICB0aGlzLmVtaXRTdGF0dXMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2FsbCBhZnRlciBhbnkgbG9jYWwgbXV0YXRpb24gXHUyMDE0IGRlYm91bmNlZCBleHBvcnQgc28gcmFwaWQgZWRpdHMgYmF0Y2guICovXG4gIG5vdGVMb2NhbENoYW5nZSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMudHJhbnNwb3J0KSByZXR1cm47XG4gICAgaWYgKHRoaXMuZXhwb3J0VGltZXIpIGNsZWFyVGltZW91dCh0aGlzLmV4cG9ydFRpbWVyKTtcbiAgICB0aGlzLmV4cG9ydFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB2b2lkIHRoaXMuY3ljbGUoKSwgRVhQT1JUX0RFQk9VTkNFX01TKTtcbiAgfVxuXG4gIGFzeW5jIGN5Y2xlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy50cmFuc3BvcnQgfHwgdGhpcy5ydW5uaW5nKSByZXR1cm4gdGhpcy5jdXJyZW50O1xuICAgIHRoaXMucnVubmluZyA9IHRydWU7XG4gICAgbGV0IHJlbGVhc2UhOiAoKSA9PiB2b2lkO1xuICAgIHRoaXMuY3VycmVudCA9IG5ldyBQcm9taXNlKChyKSA9PiAocmVsZWFzZSA9IHIpKTtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLnRyYW5zcG9ydC5hdmFpbGFibGUoKSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKCdvZmZsaW5lJywgJ1N5bmMgZm9sZGVyIGlzIG5vdCByZWFjaGFibGUnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5zZXRTdGF0ZSgnc3luY2luZycsIG51bGwpO1xuICAgICAgYXdhaXQgdGhpcy5leHBvcnRPcHMoKTtcbiAgICAgIGF3YWl0IHRoaXMuaW1wb3J0T3BzKCk7XG4gICAgICBhd2FpdCB0aGlzLnRyYW5zcG9ydC5hbm5vdW5jZSh0aGlzLnN0b3JlLmRldmljZUlkLCB0aGlzLnVzZXJOYW1lKTtcbiAgICAgIHRoaXMubGFzdFN5bmNBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgIHRoaXMuc2V0U3RhdGUoJ2lkbGUnLCBudWxsKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoJ2Vycm9yJywgZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICByZWxlYXNlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBleHBvcnRPcHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnRyYW5zcG9ydCkgcmV0dXJuO1xuICAgIGNvbnN0IGxhc3RFeHBvcnRlZCA9IE51bWJlcihnZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdsYXN0X2V4cG9ydGVkX3NlcScpID8/ICcwJyk7XG4gICAgY29uc3QgcGVuZGluZyA9IHRoaXMuc3RvcmUub3BzU2luY2UobGFzdEV4cG9ydGVkLCB0cnVlKTtcbiAgICBpZiAocGVuZGluZy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBjb25zdCBtYXhTZXEgPSBwZW5kaW5nW3BlbmRpbmcubGVuZ3RoIC0gMV0uc2VxO1xuICAgIGNvbnN0IGJhdGNoTmFtZSA9IFN0cmluZyhtYXhTZXEpLnBhZFN0YXJ0KDEyLCAnMCcpICsgJy5qc29ubCc7XG4gICAgYXdhaXQgdGhpcy50cmFuc3BvcnQucHVibGlzaE9wcyhcbiAgICAgIHRoaXMuc3RvcmUuZGV2aWNlSWQsXG4gICAgICBiYXRjaE5hbWUsXG4gICAgICBwZW5kaW5nLm1hcCgocCkgPT4gcC5vcCksXG4gICAgKTtcbiAgICBzZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdsYXN0X2V4cG9ydGVkX3NlcScsIFN0cmluZyhtYXhTZXEpKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW1wb3J0T3BzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy50cmFuc3BvcnQpIHJldHVybjtcbiAgICBjb25zdCBwZWVycyA9IHRoaXMuc3RvcmUuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgZGV2aWNlX2lkLCBsYXN0X2ZpbGUgRlJPTSBzeW5jX3BlZXJzJylcbiAgICAgIC5hbGwoKSBhcyB7IGRldmljZV9pZDogc3RyaW5nOyBsYXN0X2ZpbGU6IHN0cmluZyB8IG51bGwgfVtdO1xuICAgIGNvbnN0IGFmdGVyQnlEZXZpY2UgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nIHwgbnVsbD4ocGVlcnMubWFwKChwKSA9PiBbcC5kZXZpY2VfaWQsIHAubGFzdF9maWxlXSkpO1xuXG4gICAgY29uc3QgYmF0Y2hlcyA9IGF3YWl0IHRoaXMudHJhbnNwb3J0Lmxpc3RQZWVyQmF0Y2hlcyh0aGlzLnN0b3JlLmRldmljZUlkLCBhZnRlckJ5RGV2aWNlKTtcbiAgICBmb3IgKGNvbnN0IGIgb2YgYmF0Y2hlcykge1xuICAgICAgbGV0IG9wcztcbiAgICAgIHRyeSB7XG4gICAgICAgIG9wcyA9IGF3YWl0IHRoaXMudHJhbnNwb3J0LmZldGNoQmF0Y2goYi5kZXZpY2VJZCwgYi5maWxlTmFtZSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gUGFydGlhbGx5IHN5bmNlZCBvciB1bnJlYWRhYmxlIGZpbGUgXHUyMDE0IGxlYXZlIGN1cnNvciBhbG9uZSwgcmV0cnkgbmV4dCBjeWNsZS5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLnN0b3JlLmFwcGx5UmVtb3RlT3BzKG9wcyk7XG4gICAgICB0aGlzLnN0b3JlLmRiXG4gICAgICAgIC5wcmVwYXJlKFxuICAgICAgICAgIGBJTlNFUlQgSU5UTyBzeW5jX3BlZXJzKGRldmljZV9pZCwgbGFzdF9maWxlLCBsYXN0X3NlZW5fYXQpIFZBTFVFUyg/LD8sPylcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoZGV2aWNlX2lkKSBETyBVUERBVEUgU0VUIGxhc3RfZmlsZT1leGNsdWRlZC5sYXN0X2ZpbGUsIGxhc3Rfc2Vlbl9hdD1leGNsdWRlZC5sYXN0X3NlZW5fYXRgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4oYi5kZXZpY2VJZCwgYi5maWxlTmFtZSwgbmV3IERhdGUoKS50b0lTT1N0cmluZygpKTtcbiAgICB9XG5cbiAgICAvLyBSZWZyZXNoIHBlZXIgZGlzcGxheSBuYW1lcyBmcm9tIGFubm91bmNlbWVudHMuXG4gICAgZm9yIChjb25zdCBwIG9mIGF3YWl0IHRoaXMudHJhbnNwb3J0Lmxpc3RQZWVycygpKSB7XG4gICAgICBpZiAocC5kZXZpY2VJZCA9PT0gdGhpcy5zdG9yZS5kZXZpY2VJZCkgY29udGludWU7XG4gICAgICB0aGlzLnN0b3JlLmRiXG4gICAgICAgIC5wcmVwYXJlKFxuICAgICAgICAgIGBJTlNFUlQgSU5UTyBzeW5jX3BlZXJzKGRldmljZV9pZCwgdXNlcl9uYW1lLCBsYXN0X3NlZW5fYXQpIFZBTFVFUyg/LD8sPylcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoZGV2aWNlX2lkKSBETyBVUERBVEUgU0VUIHVzZXJfbmFtZT1DT0FMRVNDRShleGNsdWRlZC51c2VyX25hbWUsIHN5bmNfcGVlcnMudXNlcl9uYW1lKSxcbiAgICAgICAgICAgICBsYXN0X3NlZW5fYXQ9Q09BTEVTQ0UoZXhjbHVkZWQubGFzdF9zZWVuX2F0LCBzeW5jX3BlZXJzLmxhc3Rfc2Vlbl9hdClgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4ocC5kZXZpY2VJZCwgcC51c2VyTmFtZSwgcC5sYXN0U2VlbkF0KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldFN0YXRlKHN0YXRlOiBTeW5jU3RhdHVzU3RhdGUsIGVycm9yOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMubGFzdEVycm9yID0gZXJyb3I7XG4gICAgdGhpcy5lbWl0U3RhdHVzKCk7XG4gIH1cblxuICBwcml2YXRlIGVtaXRTdGF0dXMoKTogdm9pZCB7XG4gICAgdGhpcy5vblN0YXR1cyh0aGlzLnN0YXR1cygpKTtcbiAgfVxuXG4gIHN0YXR1cygpOiBTeW5jU3RhdHVzIHtcbiAgICBjb25zdCBsYXN0RXhwb3J0ZWQgPSBOdW1iZXIoZ2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnbGFzdF9leHBvcnRlZF9zZXEnKSA/PyAnMCcpO1xuICAgIGNvbnN0IHBlbmRpbmdSb3cgPSB0aGlzLnN0b3JlLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIENPVU5UKCopIEFTIGMgRlJPTSBvcGxvZyBXSEVSRSBzZXEgPiA/IEFORCBkZXZpY2VfaWQgPSA/JylcbiAgICAgIC5nZXQobGFzdEV4cG9ydGVkLCB0aGlzLnN0b3JlLmRldmljZUlkKSBhcyB7IGM6IG51bWJlciB9O1xuICAgIGNvbnN0IGNvbmZsaWN0Um93ID0gdGhpcy5zdG9yZS5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBDT1VOVCgqKSBBUyBjIEZST00gc3luY19jb25mbGljdHMgV0hFUkUgcmVzb2x2ZWRfYXQgSVMgTlVMTCcpXG4gICAgICAuZ2V0KCkgYXMgeyBjOiBudW1iZXIgfTtcbiAgICBjb25zdCBwZWVycyA9IHRoaXMuc3RvcmUuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgZGV2aWNlX2lkIEFTIGRldmljZUlkLCB1c2VyX25hbWUgQVMgdXNlck5hbWUsIGxhc3Rfc2Vlbl9hdCBBUyBsYXN0U2VlbkF0IEZST00gc3luY19wZWVycycpXG4gICAgICAuYWxsKCkgYXMgU3luY1N0YXR1c1sncGVlcnMnXTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdGU6IHRoaXMuc3RhdGUsXG4gICAgICBmb2xkZXI6IHRoaXMudHJhbnNwb3J0ID8gdGhpcy50cmFuc3BvcnQubG9jYXRpb24oKSA6IG51bGwsXG4gICAgICBsYXN0U3luY0F0OiB0aGlzLmxhc3RTeW5jQXQsXG4gICAgICBsYXN0RXJyb3I6IHRoaXMubGFzdEVycm9yLFxuICAgICAgcGVuZGluZ09wczogcGVuZGluZ1Jvdy5jLFxuICAgICAgb3BlbkNvbmZsaWN0czogY29uZmxpY3RSb3cuYyxcbiAgICAgIHBlZXJzLFxuICAgIH07XG4gIH1cblxuICAvKiogU3RvcHMgdGltZXJzIGFuZCB3YWl0cyBmb3IgYW55IGluLWZsaWdodCBjeWNsZSBcdTIwMTQgc2FmZSB0byBjbG9zZSB0aGUgREIgYWZ0ZXJ3YXJkcy4gKi9cbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy50aW1lcikgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVyKTtcbiAgICBpZiAodGhpcy5leHBvcnRUaW1lcikgY2xlYXJUaW1lb3V0KHRoaXMuZXhwb3J0VGltZXIpO1xuICAgIHRoaXMudGltZXIgPSBudWxsO1xuICAgIHRoaXMuZXhwb3J0VGltZXIgPSBudWxsO1xuICAgIGF3YWl0IHRoaXMuY3VycmVudDtcbiAgfVxufVxuIiwgIi8vIFNhbXBsZSBTdXBwb3J0IEFJIHByb2plY3QgZGF0YS4gRXZlcnkgcmVjb3JkIGNhcnJpZXMgc2FtcGxlPTEgYW5kIGEgW1NBTVBMRV0gdGl0bGVcbi8vIG1hcmtlciBjb252ZW50aW9uIGlzIE5PVCB1c2VkIFx1MjAxNCB0aGUgc2FtcGxlIGZsYWcgZHJpdmVzIGJhZGdlcyArIG9uZS1jbGljayByZW1vdmFsLlxuLy8gTm8gcmVhbCBNY0tlc3NvbiBkYXRhOiBuYW1lcyBvZiBzeXN0ZW1zIGFyZSBnZW5lcmljLCBjb250ZW50cyBhcmUgaWxsdXN0cmF0aXZlLlxuXG5pbXBvcnQgdHlwZSB7IFN0b3JlIH0gZnJvbSAnLi9zdG9yZSc7XG5pbXBvcnQgdHlwZSB7IEl0ZW1UeXBlLCBQcmlvcml0eSB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5cbmludGVyZmFjZSBTZWVkSXRlbSB7XG4gIHR5cGU6IEl0ZW1UeXBlO1xuICB0aXRsZTogc3RyaW5nO1xuICBib2R5VGV4dD86IHN0cmluZztcbiAgc3RhdHVzPzogc3RyaW5nO1xuICBwcmlvcml0eT86IFByaW9yaXR5O1xuICBvd25lcj86ICdqb2huJyB8ICdtYXJrJyB8IG51bGw7XG4gIGR1ZURhdGU/OiBzdHJpbmc7XG4gIHRhZ3M/OiBzdHJpbmdbXTtcbiAgZXh0cmE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgbWlsZXN0b25lPzogc3RyaW5nO1xuICBsZWFkZXJzaGlwVmlzaWJsZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkU2VlZERhdGEoc3RvcmU6IFN0b3JlKTogbnVtYmVyIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBzdG9yZS5saXN0SXRlbXMoeyBzYW1wbGU6IHRydWUsIGFyY2hpdmVkOiB1bmRlZmluZWQgfSwgeyBmaWVsZDogJ2NyZWF0ZWRBdCcsIGRpcjogJ2FzYycgfSwgMSk7XG4gIGlmIChleGlzdGluZy5sZW5ndGggPiAwKSByZXR1cm4gMDsgLy8gYWxyZWFkeSBsb2FkZWRcblxuICBjb25zdCBtMSA9IHN0b3JlLnVwc2VydE1pbGVzdG9uZSh7IG5hbWU6ICdEaXNjb3ZlcnkgJiBBY2Nlc3MnLCB0YXJnZXREYXRlOiAnMjAyNi0wOC0xNScsIHN0YXR1czogJ2FjdGl2ZScsIHNvcnQ6IDEsIHNhbXBsZTogMSwgZGVzY3JpcHRpb246ICdTZWN1cmUgc3lzdGVtIGFjY2VzcywgaW52ZW50b3J5IGtub3dsZWRnZSBzb3VyY2VzLCBjb25maXJtIHNjb3BlIHdpdGggbGVhZGVyc2hpcC4nIH0pO1xuICBjb25zdCBtMiA9IHN0b3JlLnVwc2VydE1pbGVzdG9uZSh7IG5hbWU6ICdLbm93bGVkZ2UgUGlwZWxpbmUgTVZQJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTAtMDEnLCBzdGF0dXM6ICdwbGFubmVkJywgc29ydDogMiwgc2FtcGxlOiAxLCBkZXNjcmlwdGlvbjogJ0luZ2VzdCwgY2xlYW4sIGFuZCBpbmRleCB0aGUgZmlyc3Qga25vd2xlZGdlIGRvbWFpbiBlbmQgdG8gZW5kLicgfSk7XG4gIGNvbnN0IG0zID0gc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgbmFtZTogJ1BpbG90IHdpdGggU3VwcG9ydCBUZWFtJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTItMDEnLCBzdGF0dXM6ICdwbGFubmVkJywgc29ydDogMywgc2FtcGxlOiAxLCBkZXNjcmlwdGlvbjogJ0xpbWl0ZWQgcGlsb3Q6IG1lYXN1cmUgZGVmbGVjdGlvbiwgYWNjdXJhY3ksIGFuZCBhZ2VudCBzYXRpc2ZhY3Rpb24uJyB9KTtcbiAgc3RvcmUudXBzZXJ0UmVsZWFzZSh7IG5hbWU6ICdTdXBwb3J0IEFJIFBpbG90IDAuMScsIHZlcnNpb246ICcwLjEnLCB0YXJnZXREYXRlOiAnMjAyNi0xMS0xNScsIHN0YXR1czogJ3BsYW5uZWQnLCBnb2FsczogJ0ZpcnN0IGludGVybmFsIHBpbG90IGJ1aWxkOiBzaW5nbGUga25vd2xlZGdlIGRvbWFpbiwgMTAgc3VwcG9ydCBhZ2VudHMsIGZlZWRiYWNrIGxvb3AgaW4gcGxhY2UuJywgc2FtcGxlOiAxIH0pO1xuXG4gIGNvbnN0IG1pbGVzdG9uZUlkOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0geyBtMTogbTEuaWQsIG0yOiBtMi5pZCwgbTM6IG0zLmlkIH07XG5cbiAgY29uc3QgaXRlbXM6IChTZWVkSXRlbSAmIHsga2V5OiBzdHJpbmcgfSlbXSA9IFtcbiAgICAvLyBGZWF0dXJlc1xuICAgIHsga2V5OiAnZmVhdEFuc3dlcicsIHR5cGU6ICdmZWF0dXJlJywgdGl0bGU6ICdBSSBhbnN3ZXIgZ2VuZXJhdGlvbiBvdmVyIGtub3dsZWRnZSBiYXNlJywgc3RhdHVzOiAnaW5fcHJvZ3Jlc3MnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBib2R5VGV4dDogJ0NvcmUgY2FwYWJpbGl0eTogZ2l2ZW4gYSBzdXBwb3J0IHF1ZXN0aW9uLCByZXRyaWV2ZSByZWxldmFudCBrbm93bGVkZ2UgYXJ0aWNsZXMgYW5kIGdlbmVyYXRlIGEgZ3JvdW5kZWQsIGNpdGVkIGFuc3dlci4nIH0sXG4gICAgeyBrZXk6ICdmZWF0SW5nZXN0JywgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0tub3dsZWRnZSBpbmdlc3Rpb24gcGlwZWxpbmUgKFNhbGVzZm9yY2UgS0EgZXhwb3J0KScsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBib2R5VGV4dDogJ0V4cG9ydCBrbm93bGVkZ2UgYXJ0aWNsZXMsIG5vcm1hbGl6ZSB0byBjbGVhbiB0ZXh0LCBjaHVuaywgYW5kIGluZGV4IGZvciByZXRyaWV2YWwuJyB9LFxuICAgIHsga2V5OiAnZmVhdEZlZWRiYWNrJywgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0FnZW50IGZlZWRiYWNrIGNhcHR1cmUgKHRodW1icyArIHJlYXNvbiBjb2RlcyknLCBzdGF0dXM6ICdiYWNrbG9nJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcjogJ21hcmsnLCBtaWxlc3RvbmU6ICdtMycsIGJvZHlUZXh0OiAnUGlsb3QgYWdlbnRzIHJhdGUgZWFjaCBBSSBhbnN3ZXI7IHJlYXNvbnMgZmVlZCB0aGUgcXVhbGl0eSBkYXNoYm9hcmQuJyB9LFxuXG4gICAgLy8gUmVxdWlyZW1lbnRzXG4gICAgeyBrZXk6ICdyZXFDaXRhdGlvbnMnLCB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ0V2ZXJ5IEFJIGFuc3dlciBtdXN0IGNpdGUgaXRzIHNvdXJjZSBhcnRpY2xlcycsIHN0YXR1czogJ3RvZG8nLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGV4dHJhOiB7IGFjY2VwdGFuY2VDcml0ZXJpYTogJ0Fuc3dlciBVSSBzaG93cyBhdCBsZWFzdCBvbmUgc291cmNlIGxpbmsgcGVyIGFuc3dlcjsgdW5jaXRlZCBhbnN3ZXJzIGFyZSBzdXBwcmVzc2VkLicsIHNlY3VyaXR5Q29uc2lkZXJhdGlvbnM6ICdDaXRhdGlvbnMgbXVzdCBub3QgZXhwb3NlIHJlc3RyaWN0ZWQgYXJ0aWNsZXMgdG8gdW5hdXRob3JpemVkIGFnZW50cy4nIH0gfSxcbiAgICB7IGtleTogJ3JlcVBISScsIHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnTm8gUEhJIG9yIGN1c3RvbWVyIGRhdGEgbWF5IGxlYXZlIGFwcHJvdmVkIHN5c3RlbXMnLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdtYXJrJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IGFjY2VwdGFuY2VDcml0ZXJpYTogJ0RhdGEgZmxvdyBkaWFncmFtIGFwcHJvdmVkIGJ5IHNlY3VyaXR5OyBETFAgc2NhbiBvZiBwaXBlbGluZSBvdXRwdXQgc2hvd3MgemVybyBQSEkuJywgc2VjdXJpdHlDb25zaWRlcmF0aW9uczogJ0Jsb2NraW5nIHJlcXVpcmVtZW50IGZvciBhbnkgZXh0ZXJuYWwgQUkgc2VydmljZS4nIH0gfSxcbiAgICB7IGtleTogJ3JlcUZyZXNobmVzcycsIHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnS25vd2xlZGdlIGluZGV4IHJlZnJlc2hlcyB3aXRoaW4gMjRoIG9mIGFydGljbGUgdXBkYXRlcycsIHN0YXR1czogJ2JhY2tsb2cnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgZXh0cmE6IHsgYWNjZXB0YW5jZUNyaXRlcmlhOiAnQXJ0aWNsZSBlZGl0ZWQgaW4gc291cmNlIHN5c3RlbSBhcHBlYXJzIGluIHJldHJpZXZhbCByZXN1bHRzIHdpdGhpbiAyNCBob3Vycy4nIH0gfSxcblxuICAgIC8vIFRhc2tzXG4gICAgeyBrZXk6ICd0YXNrRXhwb3J0JywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0J1aWxkIFNhbGVzZm9yY2Uga25vd2xlZGdlIGFydGljbGUgZXhwb3J0IHNjcmlwdCcsIHN0YXR1czogJ2RvbmUnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMScsIGJvZHlUZXh0OiAnRXhwb3J0IGFsbCBwdWJsaXNoZWQgS0FzIHdpdGggbWV0YWRhdGEgdG8gc3RydWN0dXJlZCBmaWxlcy4nIH0sXG4gICAgeyBrZXk6ICd0YXNrQ2xlYW4nLCB0eXBlOiAndGFzaycsIHRpdGxlOiAnSFRNTFx1MjE5MmNsZWFuIHRleHQgbm9ybWFsaXphdGlvbiBmb3IgZXhwb3J0ZWQgYXJ0aWNsZXMnLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgZHVlRGF0ZTogJzIwMjYtMDctMjQnIH0sXG4gICAgeyBrZXk6ICd0YXNrRXZhbCcsIHR5cGU6ICd0YXNrJywgdGl0bGU6ICdEcmFmdCBhbnN3ZXItcXVhbGl0eSBldmFsdWF0aW9uIHJ1YnJpYycsIHN0YXR1czogJ3RvZG8nLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnbWFyaycsIG1pbGVzdG9uZTogJ20yJywgZHVlRGF0ZTogJzIwMjYtMDctMzEnIH0sXG4gICAgeyBrZXk6ICd0YXNrSW52ZW50b3J5JywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0ludmVudG9yeSBjYW5kaWRhdGUga25vd2xlZGdlIGRvbWFpbnMgYW5kIGFydGljbGUgY291bnRzJywgc3RhdHVzOiAnZG9uZScsIHByaW9yaXR5OiAnbWVkaXVtJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTEnIH0sXG5cbiAgICAvLyBBY2Nlc3MgcmVxdWVzdHNcbiAgICB7IGtleTogJ2FjY1NmQXBpJywgdHlwZTogJ2FjY2VzcycsIHRpdGxlOiAnU2FsZXNmb3JjZSBBUEkgYWNjZXNzIChLbm93bGVkZ2Ugb2JqZWN0LCByZWFkKScsIHN0YXR1czogJ3JlcXVlc3RlZCcsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdqb2huJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IHN5c3RlbTogJ1NhbGVzZm9yY2UgU2VydmljZSBDbG91ZCcsIGFjY2Vzc1R5cGU6ICdBUEkgcmVhZCAoS25vd2xlZGdlIG9iamVjdCknLCBidXNpbmVzc1JlYXNvbjogJ0F1dG9tYXRlZCBleHBvcnQgb2Yga25vd2xlZGdlIGFydGljbGVzIGZvciB0aGUgaW5nZXN0aW9uIHBpcGVsaW5lLicsIHJlcXVlc3RlZEZyb206ICdTYWxlc2ZvcmNlIHBsYXRmb3JtIHRlYW0nLCByZXF1ZXN0RGF0ZTogJzIwMjYtMDYtMzAnLCBuZXh0QWN0aW9uOiAnRm9sbG93IHVwIHdpdGggcGxhdGZvcm0gdGVhbSBsZWFkJywgZm9sbG93VXBEYXRlOiAnMjAyNi0wNy0xNScgfSB9LFxuICAgIHsga2V5OiAnYWNjQXp1cmUnLCB0eXBlOiAnYWNjZXNzJywgdGl0bGU6ICdBenVyZSBPcGVuQUkgc2VydmljZSBwcm92aXNpb25pbmcgaW4gTWNLZXNzb24gdGVuYW50Jywgc3RhdHVzOiAndW5kZXJfcmV2aWV3JywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgc3lzdGVtOiAnQXp1cmUgT3BlbkFJIChNY0tlc3NvbiB0ZW5hbnQpJywgYWNjZXNzVHlwZTogJ1Jlc291cmNlIHByb3Zpc2lvbmluZyArIEFQSSBrZXlzJywgYnVzaW5lc3NSZWFzb246ICdBcHByb3ZlZC10ZW5hbnQgTExNIHJlcXVpcmVkIGZvciBhbnN3ZXIgZ2VuZXJhdGlvbiB3aXRob3V0IGRhdGEgZWdyZXNzLicsIHJlcXVlc3RlZEZyb206ICdDbG91ZCBwbGF0Zm9ybSAvIHNlY3VyaXR5JywgcmVxdWVzdERhdGU6ICcyMDI2LTA2LTIyJywgbmV4dEFjdGlvbjogJ1NlY3VyaXR5IHJldmlldyBtZWV0aW5nJywgZm9sbG93VXBEYXRlOiAnMjAyNi0wNy0xOCcgfSB9LFxuICAgIHsga2V5OiAnYWNjU3AnLCB0eXBlOiAnYWNjZXNzJywgdGl0bGU6ICdTaGFyZVBvaW50IHNpdGUgZm9yIHBpbG90IGRvY3VtZW50YXRpb24nLCBzdGF0dXM6ICdncmFudGVkJywgcHJpb3JpdHk6ICdsb3cnLCBvd25lcjogJ21hcmsnLCBleHRyYTogeyBzeXN0ZW06ICdTaGFyZVBvaW50IE9ubGluZScsIGFjY2Vzc1R5cGU6ICdTaXRlIG93bmVyJywgYnVzaW5lc3NSZWFzb246ICdTaGFyZWQgZG9jdW1lbnRhdGlvbiBhbmQgcGlsb3QgYXJ0aWZhY3RzLicsIHJlcXVlc3RlZEZyb206ICdJVCBzZXJ2aWNlIGRlc2snLCByZXF1ZXN0RGF0ZTogJzIwMjYtMDYtMTAnLCBhcHByb3ZlZEJ5OiAnSVQgc2VydmljZSBkZXNrJywgZGF0ZUdyYW50ZWQ6ICcyMDI2LTA2LTEyJyB9IH0sXG5cbiAgICAvLyBEZWNpc2lvbnNcbiAgICB7IGtleTogJ2RlY1RlbmFudCcsIHR5cGU6ICdkZWNpc2lvbicsIHRpdGxlOiAnVXNlIHRlbmFudC1ob3N0ZWQgQXp1cmUgT3BlbkFJLCBub3QgcHVibGljIEFQSXMnLCBzdGF0dXM6ICdhcHByb3ZlZCcsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnbWFyaycsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBjb250ZXh0OiAnQW5zd2VyIGdlbmVyYXRpb24gbmVlZHMgYW4gTExNLiBQdWJsaWMgQUkgQVBJcyBhcmUgdW5hcHByb3ZlZCBmb3IgaW50ZXJuYWwgZGF0YS4nLCBwcm9ibGVtOiAnV2hpY2ggTExNIGhvc3RpbmcgcGF0aCBzYXRpc2ZpZXMgc2VjdXJpdHkgd2hpbGUgdW5ibG9ja2luZyB0aGUgcGlsb3Q/Jywgb3B0aW9uczogW3sgdGl0bGU6ICdQdWJsaWMgQVBJIChPcGVuQUkvQW50aHJvcGljIGRpcmVjdCknLCBub3RlczogJ0Zhc3QgYnV0IHVuYXBwcm92ZWQgZm9yIGludGVybmFsIGRhdGEnLCBzZWxlY3RlZDogZmFsc2UgfSwgeyB0aXRsZTogJ0F6dXJlIE9wZW5BSSBpbiBNY0tlc3NvbiB0ZW5hbnQnLCBub3RlczogJ0RhdGEgc3RheXMgaW4gdGVuYW50OyBwcm9jdXJlbWVudCArIHByb3Zpc2lvbmluZyByZXF1aXJlZCcsIHNlbGVjdGVkOiB0cnVlIH0sIHsgdGl0bGU6ICdMb2NhbCBvcGVuLXdlaWdodHMgbW9kZWwnLCBub3RlczogJ05vIGVncmVzcyBidXQgd2Vha2VyIHF1YWxpdHkgYW5kIGhlYXZ5IGluZnJhJywgc2VsZWN0ZWQ6IGZhbHNlIH1dLCByZWFzb25pbmc6ICdUZW5hbnQgaG9zdGluZyBrZWVwcyBkYXRhIGluc2lkZSBhcHByb3ZlZCBib3VuZGFyeSBhbmQgaGFzIGFuIGV4aXN0aW5nIGVudGVycHJpc2UgYWdyZWVtZW50IHBhdGguJywgdHJhZGVvZmZzOiAnU2xvd2VyIHN0YXJ0OyBjYXBhY2l0eSBxdW90YXM7IG1vZGVsIGF2YWlsYWJpbGl0eSBsYWdzIHB1YmxpYyBBUElzLicgfSB9LFxuICAgIHsga2V5OiAnZGVjRG9tYWluJywgdHlwZTogJ2RlY2lzaW9uJywgdGl0bGU6ICdQaWxvdCBzY29wZTogc3RhcnQgd2l0aCBvbmUgaGlnaC12b2x1bWUga25vd2xlZGdlIGRvbWFpbicsIHN0YXR1czogJ2Rpc2N1c3NpbmcnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIGV4dHJhOiB7IGNvbnRleHQ6ICdLbm93bGVkZ2UgYmFzZSBzcGFucyBtYW55IHByb2R1Y3QgYXJlYXMgd2l0aCB1bmV2ZW4gcXVhbGl0eS4nLCBwcm9ibGVtOiAnUGlsb3QgZXZlcnl0aGluZyBvciBvbmUgZG9tYWluIGZpcnN0PycsIG9wdGlvbnM6IFt7IHRpdGxlOiAnU2luZ2xlIGRvbWFpbiBwaWxvdCcsIG5vdGVzOiAnQ2xlYW5lciBtZWFzdXJlbWVudCwgZmFzdGVyIGl0ZXJhdGlvbicsIHNlbGVjdGVkOiB0cnVlIH0sIHsgdGl0bGU6ICdBbGwgZG9tYWlucyBhdCBvbmNlJywgbm90ZXM6ICdCcm9hZGVyIGltcGFjdCwgZGlsdXRlZCBxdWFsaXR5IHNpZ25hbCcsIHNlbGVjdGVkOiBmYWxzZSB9XSwgcmVhc29uaW5nOiAnU2luZ2xlLWRvbWFpbiBnaXZlcyBhIGNsZWFuIGFjY3VyYWN5IGJhc2VsaW5lIGFuZCBjb250YWluYWJsZSByZXZpZXcgbG9hZC4nIH0gfSxcblxuICAgIC8vIFJpc2tzXG4gICAgeyBrZXk6ICdyaXNrUXVhbGl0eScsIHR5cGU6ICdyaXNrJywgdGl0bGU6ICdLbm93bGVkZ2UgYXJ0aWNsZSBxdWFsaXR5IHRvbyBsb3cgZm9yIGdyb3VuZGVkIGFuc3dlcnMnLCBzdGF0dXM6ICdvcGVuJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IGxpa2VsaWhvb2Q6ICdtZWRpdW0nLCBpbXBhY3Q6ICdoaWdoJywgbWl0aWdhdGlvbjogJ1F1YWxpdHkgYXVkaXQgb2YgdGhlIHBpbG90IGRvbWFpbiBiZWZvcmUgaW5kZXhpbmc7IGFydGljbGUgY2xlYW51cCBiYWNrbG9nIHdpdGggdGhlIGtub3dsZWRnZSB0ZWFtLicgfSB9LFxuICAgIHsga2V5OiAncmlza0FjY2VzcycsIHR5cGU6ICdyaXNrJywgdGl0bGU6ICdBY2Nlc3MgYXBwcm92YWxzIHNsaXAgYW5kIHN0YWxsIHRoZSBwaXBlbGluZSBidWlsZCcsIHN0YXR1czogJ21pdGlnYXRpbmcnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgbGlrZWxpaG9vZDogJ2hpZ2gnLCBpbXBhY3Q6ICdoaWdoJywgbWl0aWdhdGlvbjogJ1dlZWtseSBmb2xsb3ctdXBzOyBsZWFkZXJzaGlwIGVzY2FsYXRpb24gcGF0aCBhZ3JlZWQ7IGJ1aWxkIHBpcGVsaW5lIGFnYWluc3QgZXhwb3J0ZWQgc2FtcGxlIGRhdGEgbWVhbndoaWxlLicgfSB9LFxuXG4gICAgLy8gQmxvY2tlcnNcbiAgICB7IGtleTogJ2Jsa0F6dXJlJywgdHlwZTogJ2Jsb2NrZXInLCB0aXRsZTogJ0Nhbm5vdCBnZW5lcmF0ZSBhbnN3ZXJzIHVudGlsIEF6dXJlIE9wZW5BSSBpcyBwcm92aXNpb25lZCcsIHN0YXR1czogJ2FjdGl2ZScsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdtYXJrJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IHdhaXRpbmdPbjogJ0Nsb3VkIHBsYXRmb3JtIHRlYW0gLyBzZWN1cml0eSByZXZpZXcnLCBzaW5jZTogJzIwMjYtMDYtMjInIH0gfSxcblxuICAgIC8vIE1lZXRpbmdcbiAgICB7IGtleTogJ210Z0tpY2tvZmYnLCB0eXBlOiAnbWVldGluZycsIHRpdGxlOiAnU3VwcG9ydCBBSSBraWNrb2ZmIHdpdGgga25vd2xlZGdlIGxlYWRlcnNoaXAnLCBzdGF0dXM6ICdzdW1tYXJpemVkJywgb3duZXI6ICdqb2huJywgZXh0cmE6IHsgZGF0ZTogJzIwMjYtMDYtMTgnLCB0aW1lOiAnMTA6MDAgQU0nLCBhdHRlbmRlZXM6IFsnSm9obicsICdNYXJrJywgJ0FsbGVuJywgJ0dlb3JnZSddLCBwdXJwb3NlOiAnQWxpZ24gb24gcGlsb3Qgc2NvcGUsIGFjY2VzcyBuZWVkcywgYW5kIHN1Y2Nlc3MgbWVhc3VyZXMuJywgYWdlbmRhOiAnMS4gVmlzaW9uICAyLiBQaWxvdCBzY29wZSAgMy4gQWNjZXNzIHJlcXVlc3RzICA0LiBUaW1lbGluZScgfSwgYm9keVRleHQ6ICdBZ3JlZWQgdG8gc2luZ2xlLWRvbWFpbiBwaWxvdC4gQWxsZW4gdG8gc3BvbnNvciBhY2Nlc3MgcmVxdWVzdHMuIFN1Y2Nlc3MgPSBkZWZsZWN0aW9uIHJhdGUgKyBhZ2VudCBzYXRpc2ZhY3Rpb24uIE5leHQgY2hlY2staW4gaW4gNCB3ZWVrcy4nIH0sXG5cbiAgICAvLyBRdWVzdGlvbnMgLyBpZGVhcyAvIHJlc2VhcmNoXG4gICAgeyBrZXk6ICdxTWV0cmljcycsIHR5cGU6ICdxdWVzdGlvbicsIHRpdGxlOiAnV2hpY2ggZGVmbGVjdGlvbiBtZXRyaWMgZG9lcyBzdXBwb3J0IGxlYWRlcnNoaXAgYWxyZWFkeSB0cnVzdD8nLCBzdGF0dXM6ICdvcGVuJywgb3duZXI6ICdtYXJrJywgZXh0cmE6IHt9IH0sXG4gICAgeyBrZXk6ICdpZGVhVHJpYWdlJywgdHlwZTogJ2lkZWEnLCB0aXRsZTogJ0F1dG8tdHJpYWdlIGluYm91bmQgY2FzZXMgYnkga25vd2xlZGdlIGNvdmVyYWdlJywgc3RhdHVzOiAnYmFja2xvZycsIG93bmVyOiAnam9obicsIGJvZHlUZXh0OiAnSWYgcmV0cmlldmFsIGNvbmZpZGVuY2UgaXMgaGlnaCwgc3VnZ2VzdCBLQi1maXJzdCByZXNwb25zZSBiZWZvcmUgaHVtYW4gdHJpYWdlLicgfSxcbiAgICB7IGtleTogJ3Jlc1JhZycsIHR5cGU6ICdyZXNlYXJjaCcsIHRpdGxlOiAnUmV0cmlldmFsIHN0cmF0ZWd5IGNvbXBhcmlzb246IGh5YnJpZCB2cyBwdXJlIHZlY3RvcicsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgb3duZXI6ICdqb2huJywgYm9keVRleHQ6ICdFYXJseSByZXN1bHQ6IGh5YnJpZCAoQk0yNSArIHZlY3Rvcikgbm90aWNlYWJseSBiZXR0ZXIgb24gcHJvZHVjdC1jb2RlIHF1ZXJpZXMuJyB9LFxuICBdO1xuXG4gIGNvbnN0IGNyZWF0ZWQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IHMgb2YgaXRlbXMpIHtcbiAgICBjb25zdCBpdGVtID0gc3RvcmUuY3JlYXRlSXRlbSh7XG4gICAgICB0eXBlOiBzLnR5cGUsXG4gICAgICB0aXRsZTogcy50aXRsZSxcbiAgICAgIHN0YXR1czogcy5zdGF0dXMsXG4gICAgICBwcmlvcml0eTogcy5wcmlvcml0eSA/PyAnbm9uZScsXG4gICAgICBvd25lcklkOiBzLm93bmVyID8/IG51bGwsXG4gICAgICBtaWxlc3RvbmVJZDogcy5taWxlc3RvbmUgPyBtaWxlc3RvbmVJZFtzLm1pbGVzdG9uZV0gOiBudWxsLFxuICAgICAgZHVlRGF0ZTogcy5kdWVEYXRlID8/IG51bGwsXG4gICAgICB0YWdzOiBzLnRhZ3MgPz8gW10sXG4gICAgICBleHRyYTogcy5leHRyYSA/PyB7fSxcbiAgICAgIGxlYWRlcnNoaXBWaXNpYmxlOiBzLmxlYWRlcnNoaXBWaXNpYmxlID8gMSA6IDAsXG4gICAgICBib2R5VGV4dDogcy5ib2R5VGV4dCA/PyAnJyxcbiAgICAgIGJvZHk6IHMuYm9keVRleHQgPyB0ZXh0RG9jKHMuYm9keVRleHQpIDogJycsXG4gICAgICBzYW1wbGU6IDEsXG4gICAgfSk7XG4gICAgY3JlYXRlZC5zZXQocy5rZXksIGl0ZW0uaWQpO1xuICB9XG5cbiAgY29uc3QgbGluayA9IChhOiBzdHJpbmcsIGI6IHN0cmluZywga2luZDogUGFyYW1ldGVyczxTdG9yZVsnYWRkTGluayddPlsyXSkgPT4ge1xuICAgIGNvbnN0IGZyb21JZCA9IGNyZWF0ZWQuZ2V0KGEpO1xuICAgIGNvbnN0IHRvSWQgPSBjcmVhdGVkLmdldChiKTtcbiAgICBpZiAoZnJvbUlkICYmIHRvSWQpIHN0b3JlLmFkZExpbmsoZnJvbUlkLCB0b0lkLCBraW5kKTtcbiAgfTtcblxuICBsaW5rKCd0YXNrQ2xlYW4nLCAnZmVhdEluZ2VzdCcsICdpbXBsZW1lbnRzJyk7XG4gIGxpbmsoJ3Rhc2tFeHBvcnQnLCAnZmVhdEluZ2VzdCcsICdpbXBsZW1lbnRzJyk7XG4gIGxpbmsoJ3JlcUNpdGF0aW9ucycsICdmZWF0QW5zd2VyJywgJ3N1cHBvcnRzJyk7XG4gIGxpbmsoJ3JlcVBISScsICdmZWF0QW5zd2VyJywgJ3N1cHBvcnRzJyk7XG4gIGxpbmsoJ3JlcUZyZXNobmVzcycsICdmZWF0SW5nZXN0JywgJ3N1cHBvcnRzJyk7XG4gIGxpbmsoJ2ZlYXRBbnN3ZXInLCAnZGVjVGVuYW50JywgJ3NoYXBlZF9ieScpO1xuICBsaW5rKCdmZWF0QW5zd2VyJywgJ2FjY0F6dXJlJywgJ3JlcXVpcmVzX2FjY2VzcycpO1xuICBsaW5rKCdmZWF0SW5nZXN0JywgJ2FjY1NmQXBpJywgJ3JlcXVpcmVzX2FjY2VzcycpO1xuICBsaW5rKCdibGtBenVyZScsICdmZWF0QW5zd2VyJywgJ2Jsb2NrcycpO1xuICBsaW5rKCdkZWNEb21haW4nLCAnbXRnS2lja29mZicsICdkaXNjdXNzZWRfaW4nKTtcbiAgbGluaygncmlza0FjY2VzcycsICdhY2NBenVyZScsICdyZWxhdGVzJyk7XG5cbiAgcmV0dXJuIGl0ZW1zLmxlbmd0aDtcbn1cblxuLyoqIE1pbmltYWwgcmljaC1kb2Mgd3JhcHBlciBmb3Igc2VlZCBib2R5IHRleHQgKG9uZSBwYXJhZ3JhcGgpLiAqL1xuZnVuY3Rpb24gdGV4dERvYyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiAnZG9jJywgY29udGVudDogW3sgdHlwZTogJ3BhcmFncmFwaCcsIGNvbnRlbnQ6IFt7IHR5cGU6ICd0ZXh0JywgdGV4dCB9XSB9XSB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSx1QkFBcUI7QUFDckIsb0JBQW1CO0FBQ25CLElBQUFBLGtCQUFlO0FBQ2YsSUFBQUMsb0JBQWlCO0FBQ2pCLHFCQUFlOzs7QUNSZiw0QkFBcUI7QUFDckIsdUJBQWlCO0FBQ2pCLHFCQUFlO0FBQ2YseUJBQW1COzs7QUNNWixJQUFNLGFBQTBCO0FBQUEsRUFDckM7QUFBQSxJQUNFLFNBQVM7QUFBQSxJQUNULE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFB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QUcsR0FBRztBQUN6RixnQkFBQUEsUUFBTyxNQUFNLFFBQVEsUUFBUSxDQUFDO0FBRTlCLFFBQU0sWUFBWSxRQUFRLE9BQU8sQ0FBQyxNQUFNLE1BQU0sU0FBUyxFQUFFLEVBQUUsRUFBRSxTQUFTLENBQUM7QUFDdkUsZ0JBQUFBLFFBQU8sR0FBRyxVQUFVLFNBQVMsQ0FBQztBQUU5QixRQUFNLFVBQVUsTUFBTSxpQkFBaUI7QUFDdkMsZ0JBQUFBLFFBQU8sTUFBTSxTQUFTLENBQUM7QUFDdkIsZ0JBQUFBLFFBQU8sTUFBTSxNQUFNLFVBQVUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxhQUFhLEtBQUssTUFBTSxHQUFHLEdBQUcsRUFBRSxRQUFRLENBQUM7QUFDbkYsTUFBSSxHQUFHLE1BQU07QUFDZixDQUFDO0FBQUEsSUFFRCx1QkFBSyxtREFBbUQsTUFBTTtBQUM1RCxRQUFNLE1BQU0sSUFBSSxTQUFTO0FBQ3pCLFFBQU0sTUFBTSxhQUFhLEdBQUc7QUFDNUIsTUFBSSxHQUFHLE1BQU07QUFFYixRQUFNLFNBQVMsa0JBQUFGLFFBQUssS0FBSyxLQUFLLGFBQWE7QUFDM0MsUUFBTSxLQUFLLGdCQUFBRCxRQUFHLFNBQVMsUUFBUSxJQUFJO0FBQ25DLGtCQUFBQSxRQUFHLFVBQVUsSUFBSSxPQUFPLEtBQUssdUJBQXVCLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDL0Qsa0JBQUFBLFFBQUcsVUFBVSxFQUFFO0FBQ2YsZ0JBQUFHLFFBQU8sT0FBTyxNQUFNLGFBQWEsR0FBRyxHQUFHLHFDQUFxQztBQUM5RSxDQUFDOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImZzIiwgInBhdGgiLCAiRGF0YWJhc2UiLCAiY3J5cHRvIiwgImltcG9ydF9ub2RlX2NyeXB0byIsICJjcnlwdG8iLCAiaXRlbSIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImZzIiwgInBhdGgiLCAidG1wIiwgImZzIiwgInBhdGgiLCAib3MiLCAiYXNzZXJ0Il0KfQo=
