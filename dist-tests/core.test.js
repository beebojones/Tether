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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vdGVzdHMvY29yZS50ZXN0LnRzIiwgIi4uL2VsZWN0cm9uL2RiL2RiLnRzIiwgIi4uL2VsZWN0cm9uL2RiL21pZ3JhdGlvbnMudHMiLCAiLi4vZWxlY3Ryb24vZGIvc3RvcmUudHMiLCAiLi4vc2hhcmVkL3R5cGVzLnRzIiwgIi4uL2VsZWN0cm9uL3N5bmMvdHJhbnNwb3J0LnRzIiwgIi4uL2VsZWN0cm9uL3N5bmMvZW5naW5lLnRzIiwgIi4uL2VsZWN0cm9uL2RiL3NlZWQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIENvcmUgZGF0YS1sYXllciArIHN5bmMgdGVzdHMuIFJ1biB3aXRoOiBucG0gdGVzdFxuLy8gKGJ1bmRsZWQgYnkgc2NyaXB0cy9ydW4tdGVzdHMubWpzIGFuZCBleGVjdXRlZCB1bmRlciBFbGVjdHJvbidzIE5vZGUgdmlhIEVMRUNUUk9OX1JVTl9BU19OT0RFXG4vLyAgc28gYmV0dGVyLXNxbGl0ZTMncyBFbGVjdHJvbi1BQkkgYnVpbGQgbG9hZHMuKVxuXG5pbXBvcnQgeyB0ZXN0IH0gZnJvbSAnbm9kZTp0ZXN0JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnbm9kZTphc3NlcnQvc3RyaWN0JztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgb3MgZnJvbSAnbm9kZTpvcyc7XG5pbXBvcnQgeyBvcGVuRGF0YWJhc2UsIHR5cGUgRGJDb250ZXh0IH0gZnJvbSAnLi4vZWxlY3Ryb24vZGIvZGInO1xuaW1wb3J0IHsgU3RvcmUgfSBmcm9tICcuLi9lbGVjdHJvbi9kYi9zdG9yZSc7XG5pbXBvcnQgeyBGb2xkZXJUcmFuc3BvcnQgfSBmcm9tICcuLi9lbGVjdHJvbi9zeW5jL3RyYW5zcG9ydCc7XG5pbXBvcnQgeyBTeW5jRW5naW5lIH0gZnJvbSAnLi4vZWxlY3Ryb24vc3luYy9lbmdpbmUnO1xuaW1wb3J0IHsgbG9hZFNlZWREYXRhIH0gZnJvbSAnLi4vZWxlY3Ryb24vZGIvc2VlZCc7XG5cbmZ1bmN0aW9uIHRtcChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwID0gZnMubWtkdGVtcFN5bmMocGF0aC5qb2luKG9zLnRtcGRpcigpLCBgdGV0aGVyLSR7bmFtZX0tYCkpO1xuICByZXR1cm4gcDtcbn1cblxuZnVuY3Rpb24gbWtTdG9yZShuYW1lOiBzdHJpbmcsIGFjdG9yOiBzdHJpbmcpOiB7IGN0eDogRGJDb250ZXh0OyBzdG9yZTogU3RvcmUgfSB7XG4gIGNvbnN0IGN0eCA9IG9wZW5EYXRhYmFzZSh0bXAobmFtZSkpO1xuICBjb25zdCBzdG9yZSA9IG5ldyBTdG9yZShjdHgsIGFjdG9yKTtcbiAgcmV0dXJuIHsgY3R4LCBzdG9yZSB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBzeW5jQm90aChhOiB7IHN0b3JlOiBTdG9yZSB9LCBiOiB7IHN0b3JlOiBTdG9yZSB9LCBmb2xkZXI6IHN0cmluZywgdXNlckEgPSAnSm9obicsIHVzZXJCID0gJ01hcmsnKSB7XG4gIGNvbnN0IGVhID0gbmV3IFN5bmNFbmdpbmUoYS5zdG9yZSwgdXNlckEsICgpID0+IHt9KTtcbiAgY29uc3QgZWIgPSBuZXcgU3luY0VuZ2luZShiLnN0b3JlLCB1c2VyQiwgKCkgPT4ge30pO1xuICBlYS5zZXRUcmFuc3BvcnQobmV3IEZvbGRlclRyYW5zcG9ydChmb2xkZXIpKTtcbiAgZWIuc2V0VHJhbnNwb3J0KG5ldyBGb2xkZXJUcmFuc3BvcnQoZm9sZGVyKSk7XG4gIC8vIFR3byBjeWNsZXMgZWFjaCBzbyByZW51bWJlci1yZWJyb2FkY2FzdHMgYW5kIGNyb3NzLWltcG9ydHMgc2V0dGxlLlxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgIGF3YWl0IGVhLmN5Y2xlKCk7XG4gICAgYXdhaXQgZWIuY3ljbGUoKTtcbiAgfVxuICBhd2FpdCBlYS5zdG9wKCk7XG4gIGF3YWl0IGViLnN0b3AoKTtcbn1cblxudGVzdCgnbWlncmF0aW9ucyBjcmVhdGUgc2NoZW1hIGFuZCBkZXZpY2UgaWRlbnRpdHknLCAoKSA9PiB7XG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgnbWlnJywgJ2pvaG4nKTtcbiAgYXNzZXJ0Lm9rKGN0eC5kZXZpY2VJZC5sZW5ndGggPiAxMCk7XG4gIGFzc2VydC5lcXVhbChzdG9yZS5saXN0SXRlbXMoKS5sZW5ndGgsIDApO1xuICBjdHguZGIuY2xvc2UoKTtcbn0pO1xuXG50ZXN0KCdpdGVtIENSVUQsIGlkZW50IGFsbG9jYXRpb24sIGFjdGl2aXR5LCBzZWFyY2gnLCAoKSA9PiB7XG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgnY3J1ZCcsICdqb2huJyk7XG4gIGNvbnN0IGl0ZW0gPSBzdG9yZS5jcmVhdGVJdGVtKHsgdHlwZTogJ3JlcXVpcmVtZW50JywgdGl0bGU6ICdBbnN3ZXJzIG11c3QgY2l0ZSBzb3VyY2VzJyB9KTtcbiAgYXNzZXJ0LmVxdWFsKGl0ZW0uaWRlbnQsICdSRVEtMScpO1xuICBhc3NlcnQuZXF1YWwoaXRlbS5zdGF0dXMsICdiYWNrbG9nJyk7XG5cbiAgY29uc3Qgc2Vjb25kID0gc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnQW5vdGhlciByZXF1aXJlbWVudCcgfSk7XG4gIGFzc2VydC5lcXVhbChzZWNvbmQuaWRlbnQsICdSRVEtMicpO1xuXG4gIHN0b3JlLnVwZGF0ZUl0ZW0oaXRlbS5pZCwgeyBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAnaGlnaCcgfSk7XG4gIGNvbnN0IGdvdCA9IHN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhO1xuICBhc3NlcnQuZXF1YWwoZ290LnN0YXR1cywgJ2luX3Byb2dyZXNzJyk7XG4gIGFzc2VydC5lcXVhbChnb3QucHJpb3JpdHksICdoaWdoJyk7XG5cbiAgLy8gZG9uZSBcdTIxOTIgY29tcGxldGVkQXQgc2V0XG4gIHN0b3JlLnVwZGF0ZUl0ZW0oaXRlbS5pZCwgeyBzdGF0dXM6ICdkb25lJyB9KTtcbiAgYXNzZXJ0Lm9rKHN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLmNvbXBsZXRlZEF0KTtcblxuICAvLyBzZWFyY2ggaGl0cyB0aXRsZVxuICBjb25zdCByZXN1bHRzID0gc3RvcmUuc2VhcmNoKCdjaXRlIHNvdXJjZXMnKTtcbiAgYXNzZXJ0Lm9rKHJlc3VsdHMuc29tZSgocikgPT4gci5pdGVtLmlkID09PSBpdGVtLmlkKSk7XG5cbiAgLy8gYnkgaWRlbnRcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmdldEl0ZW1CeUlkZW50KCdyZXEtMScpIS5pZCwgaXRlbS5pZCk7XG5cbiAgY29uc3QgYWN0aXZpdHkgPSBzdG9yZS5hY3Rpdml0eUZvcihpdGVtLmlkKSBhcyB7IGtpbmQ6IHN0cmluZyB9W107XG4gIGFzc2VydC5vayhhY3Rpdml0eS5zb21lKChhKSA9PiBhLmtpbmQgPT09ICdjcmVhdGVkJykpO1xuICBhc3NlcnQub2soYWN0aXZpdHkuc29tZSgoYSkgPT4gYS5raW5kID09PSAndXBkYXRlZCcpKTtcblxuICAvLyBkZWxldGUgaGlkZXMgZnJvbSBxdWVyaWVzXG4gIHN0b3JlLmRlbGV0ZUl0ZW0oc2Vjb25kLmlkKTtcbiAgYXNzZXJ0LmVxdWFsKHN0b3JlLmdldEl0ZW0oc2Vjb25kLmlkKSwgbnVsbCk7XG4gIGN0eC5kYi5jbG9zZSgpO1xufSk7XG5cbnRlc3QoJ2xpbmtzLCBjb21tZW50cywgdmVyc2lvbnMnLCAoKSA9PiB7XG4gIGNvbnN0IHsgY3R4LCBzdG9yZSB9ID0gbWtTdG9yZSgncmVsJywgJ2pvaG4nKTtcbiAgY29uc3QgYSA9IHN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnQnVpbGQgZXhwb3J0JyB9KTtcbiAgY29uc3QgYiA9IHN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAnZmVhdHVyZScsIHRpdGxlOiAnSW5nZXN0aW9uIHBpcGVsaW5lJyB9KTtcbiAgc3RvcmUuYWRkTGluayhhLmlkLCBiLmlkLCAnaW1wbGVtZW50cycpO1xuICBjb25zdCBsaW5rcyA9IHN0b3JlLmxpbmtzRm9yKGEuaWQpO1xuICBhc3NlcnQuZXF1YWwobGlua3MubGVuZ3RoLCAxKTtcbiAgYXNzZXJ0LmVxdWFsKGxpbmtzWzBdLm90aGVyLmlkLCBiLmlkKTtcbiAgYXNzZXJ0LmVxdWFsKGxpbmtzWzBdLmRpcmVjdGlvbiwgJ291dCcpO1xuXG4gIHN0b3JlLmFkZENvbW1lbnQoYS5pZCwgJ3tcInR5cGVcIjpcImRvY1wifScsICdsb29rcyBnb29kJyk7XG4gIGFzc2VydC5lcXVhbChzdG9yZS5jb21tZW50c0ZvcihhLmlkKS5sZW5ndGgsIDEpO1xuXG4gIHN0b3JlLnNhdmVWZXJzaW9uKGEuaWQpO1xuICBzdG9yZS51cGRhdGVJdGVtKGEuaWQsIHsgdGl0bGU6ICdCdWlsZCBleHBvcnQgdjInIH0pO1xuICBjb25zdCB2ZXJzaW9ucyA9IHN0b3JlLnZlcnNpb25zRm9yKGEuaWQpIGFzIHsgdGl0bGU6IHN0cmluZyB9W107XG4gIGFzc2VydC5lcXVhbCh2ZXJzaW9ucy5sZW5ndGgsIDEpO1xuICBhc3NlcnQuZXF1YWwodmVyc2lvbnNbMF0udGl0bGUsICdCdWlsZCBleHBvcnQnKTtcbiAgY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnc3luYzogdHdvIGRldmljZXMgY29udmVyZ2UgdGhyb3VnaCBhIHNoYXJlZCBmb2xkZXInLCBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IGEgPSBta1N0b3JlKCdzeW5jQScsICdqb2huJyk7XG4gIGNvbnN0IGIgPSBta1N0b3JlKCdzeW5jQicsICdtYXJrJyk7XG4gIGNvbnN0IGZvbGRlciA9IHRtcCgnc2hhcmVkJyk7XG5cbiAgY29uc3QgaXRlbUEgPSBhLnN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnRnJvbSBKb2huJyB9KTtcbiAgY29uc3QgaXRlbUIgPSBiLnN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAnZGVjaXNpb24nLCB0aXRsZTogJ0Zyb20gTWFyaycgfSk7XG5cbiAgYXdhaXQgc3luY0JvdGgoYSwgYiwgZm9sZGVyKTtcblxuICBhc3NlcnQub2soYi5zdG9yZS5nZXRJdGVtKGl0ZW1BLmlkKSwgJ0IgcmVjZWl2ZWQgQSBpdGVtJyk7XG4gIGFzc2VydC5vayhhLnN0b3JlLmdldEl0ZW0oaXRlbUIuaWQpLCAnQSByZWNlaXZlZCBCIGl0ZW0nKTtcbiAgYXNzZXJ0LmVxdWFsKGIuc3RvcmUuZ2V0SXRlbShpdGVtQS5pZCkhLnRpdGxlLCAnRnJvbSBKb2huJyk7XG5cbiAgLy8gRWRpdCBvbiBCIHByb3BhZ2F0ZXMgdG8gQVxuICBiLnN0b3JlLnVwZGF0ZUl0ZW0oaXRlbUEuaWQsIHsgc3RhdHVzOiAnaW5fcHJvZ3Jlc3MnIH0pO1xuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW1BLmlkKSEuc3RhdHVzLCAnaW5fcHJvZ3Jlc3MnKTtcblxuICBhLmN0eC5kYi5jbG9zZSgpO1xuICBiLmN0eC5kYi5jbG9zZSgpO1xufSk7XG5cbnRlc3QoJ3N5bmM6IGNvbmN1cnJlbnQgdGl0bGUgZWRpdHMgc3VyZmFjZSBhIGNvbmZsaWN0LCBMV1cgYXBwbGllcywgcmVzb2x1dGlvbiBjb252ZXJnZXMnLCBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IGEgPSBta1N0b3JlKCdjb25mQScsICdqb2huJyk7XG4gIGNvbnN0IGIgPSBta1N0b3JlKCdjb25mQicsICdtYXJrJyk7XG4gIGNvbnN0IGZvbGRlciA9IHRtcCgnc2hhcmVkYycpO1xuXG4gIGNvbnN0IGl0ZW0gPSBhLnN0b3JlLmNyZWF0ZUl0ZW0oeyB0eXBlOiAndGFzaycsIHRpdGxlOiAnT3JpZ2luYWwnIH0pO1xuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuICBhc3NlcnQub2soYi5zdG9yZS5nZXRJdGVtKGl0ZW0uaWQpKTtcblxuICAvLyBCb3RoIGVkaXQgdGhlIHRpdGxlIHdoaWxlIFwib2ZmbGluZVwiIChubyBzeW5jIGJldHdlZW4gZWRpdHMpLlxuICBhLnN0b3JlLnVwZGF0ZUl0ZW0oaXRlbS5pZCwgeyB0aXRsZTogJ0pvaG4gdmVyc2lvbicgfSk7XG4gIGIuc3RvcmUudXBkYXRlSXRlbShpdGVtLmlkLCB7IHRpdGxlOiAnTWFyayB2ZXJzaW9uJyB9KTtcbiAgYXdhaXQgc3luY0JvdGgoYSwgYiwgZm9sZGVyKTtcblxuICAvLyBCb3RoIHNpZGVzIHNob3cgdGhlIHNhbWUgTFdXIHdpbm5lci5cbiAgY29uc3QgdGEgPSBhLnN0b3JlLmdldEl0ZW0oaXRlbS5pZCkhLnRpdGxlO1xuICBjb25zdCB0YiA9IGIuc3RvcmUuZ2V0SXRlbShpdGVtLmlkKSEudGl0bGU7XG4gIGFzc2VydC5lcXVhbCh0YSwgdGIsICdMV1cgY29udmVyZ2VkJyk7XG5cbiAgLy8gQXQgbGVhc3Qgb25lIHNpZGUgcmVjb3JkZWQgYSBjb25mbGljdCBmb3IgcmV2aWV3LlxuICBjb25zdCBjb25mbGljdHMgPSBbLi4uYS5zdG9yZS5saXN0Q29uZmxpY3RzKHRydWUpLCAuLi5iLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSldO1xuICBhc3NlcnQub2soY29uZmxpY3RzLmxlbmd0aCA+PSAxLCAnY29uZmxpY3Qgc3VyZmFjZWQnKTtcbiAgYXNzZXJ0Lm9rKGNvbmZsaWN0cy5zb21lKChjKSA9PiBjLmZpZWxkID09PSAndGl0bGUnKSk7XG5cbiAgLy8gUmVzb2x2aW5nIHdpdGggYSBtZXJnZWQgdmFsdWUgcHJvcGFnYXRlcy5cbiAgY29uc3Qgc2lkZSA9IGEuc3RvcmUubGlzdENvbmZsaWN0cyh0cnVlKS5sZW5ndGggPyBhIDogYjtcbiAgY29uc3QgY29uZmxpY3QgPSBzaWRlLnN0b3JlLmxpc3RDb25mbGljdHModHJ1ZSlbMF07XG4gIHNpZGUuc3RvcmUucmVzb2x2ZUNvbmZsaWN0KGNvbmZsaWN0LmlkLCAnbWVyZ2VkJywgJ01lcmdlZCB0aXRsZScpO1xuICBhd2FpdCBzeW5jQm90aChhLCBiLCBmb2xkZXIpO1xuICBhc3NlcnQuZXF1YWwoYS5zdG9yZS5nZXRJdGVtKGl0ZW0uaWQpIS50aXRsZSwgJ01lcmdlZCB0aXRsZScpO1xuICBhc3NlcnQuZXF1YWwoYi5zdG9yZS5nZXRJdGVtKGl0ZW0uaWQpIS50aXRsZSwgJ01lcmdlZCB0aXRsZScpO1xuXG4gIGEuY3R4LmRiLmNsb3NlKCk7XG4gIGIuY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnc3luYzogaWRlbnQgY29sbGlzaW9uIHJlbnVtYmVycyBhbmQgY29udmVyZ2VzJywgYXN5bmMgKCkgPT4ge1xuICBjb25zdCBhID0gbWtTdG9yZSgnaWRBJywgJ2pvaG4nKTtcbiAgY29uc3QgYiA9IG1rU3RvcmUoJ2lkQicsICdtYXJrJyk7XG4gIGNvbnN0IGZvbGRlciA9IHRtcCgnc2hhcmVkaScpO1xuXG4gIC8vIEJvdGggY3JlYXRlIFRBU0stMSBvZmZsaW5lLlxuICBjb25zdCBpYSA9IGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdBIHRhc2snIH0pO1xuICBjb25zdCBpYiA9IGIuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdCIHRhc2snIH0pO1xuICBhc3NlcnQuZXF1YWwoaWEuaWRlbnQsICdUQVNLLTEnKTtcbiAgYXNzZXJ0LmVxdWFsKGliLmlkZW50LCAnVEFTSy0xJyk7XG5cbiAgYXdhaXQgc3luY0JvdGgoYSwgYiwgZm9sZGVyKTtcbiAgYXdhaXQgc3luY0JvdGgoYSwgYiwgZm9sZGVyKTsgLy8gZXh0cmEgcm91bmRzIHRvIHNldHRsZSByZW51bWJlciBicm9hZGNhc3RzXG5cbiAgY29uc3QgYUlkZW50cyA9IFthLnN0b3JlLmdldEl0ZW0oaWEuaWQpIS5pZGVudCwgYS5zdG9yZS5nZXRJdGVtKGliLmlkKSEuaWRlbnRdLnNvcnQoKTtcbiAgY29uc3QgYklkZW50cyA9IFtiLnN0b3JlLmdldEl0ZW0oaWEuaWQpIS5pZGVudCwgYi5zdG9yZS5nZXRJdGVtKGliLmlkKSEuaWRlbnRdLnNvcnQoKTtcbiAgYXNzZXJ0Lm5vdEVxdWFsKGFJZGVudHNbMF0sIGFJZGVudHNbMV0sICdpZGVudHMgdW5pcXVlIG9uIEEnKTtcbiAgYXNzZXJ0Lm5vdEVxdWFsKGJJZGVudHNbMF0sIGJJZGVudHNbMV0sICdpZGVudHMgdW5pcXVlIG9uIEInKTtcbiAgYXNzZXJ0LmRlZXBFcXVhbChhSWRlbnRzLCBiSWRlbnRzLCAnYm90aCBzaWRlcyBhZ3JlZSBvbiBpZGVudHMnKTtcblxuICBhLmN0eC5kYi5jbG9zZSgpO1xuICBiLmN0eC5kYi5jbG9zZSgpO1xufSk7XG5cbnRlc3QoJ3N5bmM6IG9mZmxpbmUgZWRpdHMgcXVldWUgYW5kIGZsdXNoIHdoZW4gZm9sZGVyIHJldHVybnMnLCBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IGEgPSBta1N0b3JlKCdvZmZBJywgJ2pvaG4nKTtcbiAgY29uc3QgZm9sZGVyID0gdG1wKCdzaGFyZWRvJyk7XG4gIGNvbnN0IGVuZ2luZSA9IG5ldyBTeW5jRW5naW5lKGEuc3RvcmUsICdKb2huJywgKCkgPT4ge30pO1xuXG4gIGEuc3RvcmUuY3JlYXRlSXRlbSh7IHR5cGU6ICd0YXNrJywgdGl0bGU6ICdNYWRlIG9mZmxpbmUnIH0pO1xuICBhc3NlcnQub2soZW5naW5lLnN0YXR1cygpLnBlbmRpbmdPcHMgPiAwIHx8IGVuZ2luZS5zdGF0dXMoKS5zdGF0ZSA9PT0gJ2Rpc2FibGVkJyk7XG5cbiAgZW5naW5lLnNldFRyYW5zcG9ydChuZXcgRm9sZGVyVHJhbnNwb3J0KGZvbGRlcikpO1xuICBhd2FpdCBlbmdpbmUuY3ljbGUoKTtcbiAgYXNzZXJ0LmVxdWFsKGVuZ2luZS5zdGF0dXMoKS5wZW5kaW5nT3BzLCAwLCAnb3BzIGV4cG9ydGVkIGFmdGVyIHRyYW5zcG9ydCBhdHRhY2hlZCcpO1xuICBhd2FpdCBlbmdpbmUuc3RvcCgpO1xuICBhLmN0eC5kYi5jbG9zZSgpO1xufSk7XG5cbnRlc3QoJ3NlZWQgZGF0YSBsb2FkcywgaXMgZmxhZ2dlZCwgYW5kIHJlbW92ZXMgY2xlYW5seScsICgpID0+IHtcbiAgY29uc3QgeyBjdHgsIHN0b3JlIH0gPSBta1N0b3JlKCdzZWVkJywgJ2pvaG4nKTtcbiAgY29uc3QgbiA9IGxvYWRTZWVkRGF0YShzdG9yZSk7XG4gIGFzc2VydC5vayhuID4gMTUpO1xuICBjb25zdCBzYW1wbGVzID0gc3RvcmUubGlzdEl0ZW1zKHsgc2FtcGxlOiB0cnVlIH0sIHsgZmllbGQ6ICdjcmVhdGVkQXQnLCBkaXI6ICdhc2MnIH0sIDEwMCk7XG4gIGFzc2VydC5lcXVhbChzYW1wbGVzLmxlbmd0aCwgbik7XG4gIC8vIGxpbmtzIGV4aXN0XG4gIGNvbnN0IHdpdGhMaW5rcyA9IHNhbXBsZXMuZmlsdGVyKChzKSA9PiBzdG9yZS5saW5rc0ZvcihzLmlkKS5sZW5ndGggPiAwKTtcbiAgYXNzZXJ0Lm9rKHdpdGhMaW5rcy5sZW5ndGggPiA1KTtcblxuICBjb25zdCByZW1vdmVkID0gc3RvcmUucmVtb3ZlU2FtcGxlRGF0YSgpO1xuICBhc3NlcnQuZXF1YWwocmVtb3ZlZCwgbik7XG4gIGFzc2VydC5lcXVhbChzdG9yZS5saXN0SXRlbXMoe30sIHsgZmllbGQ6ICdjcmVhdGVkQXQnLCBkaXI6ICdhc2MnIH0sIDEwMCkubGVuZ3RoLCAwKTtcbiAgY3R4LmRiLmNsb3NlKCk7XG59KTtcblxudGVzdCgnZGF0YWJhc2UgaW50ZWdyaXR5IGd1YXJkIHF1YXJhbnRpbmVzIGNvcnJ1cHRpb24nLCAoKSA9PiB7XG4gIGNvbnN0IGRpciA9IHRtcCgnY29ycnVwdCcpO1xuICBjb25zdCBjdHggPSBvcGVuRGF0YWJhc2UoZGlyKTtcbiAgY3R4LmRiLmNsb3NlKCk7XG4gIC8vIFN0b21wIHRoZSBmaWxlIGhlYWRlci5cbiAgY29uc3QgZGJQYXRoID0gcGF0aC5qb2luKGRpciwgJ3RldGhlci5kYicpO1xuICBjb25zdCBmZCA9IGZzLm9wZW5TeW5jKGRiUGF0aCwgJ3IrJyk7XG4gIGZzLndyaXRlU3luYyhmZCwgQnVmZmVyLmZyb20oJ0dBUkJBR0VHQVJCQUdFR0FSQkFHRScpLCAwLCAyMSwgMCk7XG4gIGZzLmNsb3NlU3luYyhmZCk7XG4gIGFzc2VydC50aHJvd3MoKCkgPT4gb3BlbkRhdGFiYXNlKGRpciksIC9pbnRlZ3JpdHl8bWFsZm9ybWVkfG5vdCBhIGRhdGFiYXNlL2kpO1xufSk7XG4iLCAiaW1wb3J0IERhdGFiYXNlIGZyb20gJ2JldHRlci1zcWxpdGUzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgY3J5cHRvIGZyb20gJ25vZGU6Y3J5cHRvJztcbmltcG9ydCB7IE1JR1JBVElPTlMgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuXG5leHBvcnQgdHlwZSBEQiA9IERhdGFiYXNlLkRhdGFiYXNlO1xuXG5leHBvcnQgaW50ZXJmYWNlIERiQ29udGV4dCB7XG4gIGRiOiBEQjtcbiAgZGV2aWNlSWQ6IHN0cmluZztcbiAgZGF0YURpcjogc3RyaW5nO1xuICBkYlBhdGg6IHN0cmluZztcbn1cblxuLyoqXG4gKiBPcGVucyAob3IgY3JlYXRlcykgdGhlIFRldGhlciBkYXRhYmFzZSwgYXBwbGllcyBwZW5kaW5nIG1pZ3JhdGlvbnMsXG4gKiBhbmQgZ3VhcmFudGVlcyBkZXZpY2UgaWRlbnRpdHkgbWV0YWRhdGEuXG4gKlxuICogU2FmZXR5IHBvc3R1cmU6IFdBTCBtb2RlICsgaW50ZWdyaXR5IGNoZWNrIG9uIG9wZW4gKyB0aW1lc3RhbXBlZCBiYWNrdXBcbiAqIGJlZm9yZSBhbnkgbWlncmF0aW9uIGJleW9uZCB2ZXJzaW9uIDAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvcGVuRGF0YWJhc2UoZGF0YURpcjogc3RyaW5nKTogRGJDb250ZXh0IHtcbiAgZnMubWtkaXJTeW5jKGRhdGFEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICBjb25zdCBkYlBhdGggPSBwYXRoLmpvaW4oZGF0YURpciwgJ3RldGhlci5kYicpO1xuICBjb25zdCBleGlzdGVkID0gZnMuZXhpc3RzU3luYyhkYlBhdGgpO1xuXG4gIGNvbnN0IGRiID0gbmV3IERhdGFiYXNlKGRiUGF0aCk7XG4gIGRiLnByYWdtYSgnam91cm5hbF9tb2RlID0gV0FMJyk7XG4gIGRiLnByYWdtYSgnZm9yZWlnbl9rZXlzID0gT04nKTtcbiAgZGIucHJhZ21hKCdzeW5jaHJvbm91cyA9IE5PUk1BTCcpO1xuXG4gIGlmIChleGlzdGVkKSB7XG4gICAgY29uc3QgY2hlY2sgPSBkYi5wcmFnbWEoJ3F1aWNrX2NoZWNrJywgeyBzaW1wbGU6IHRydWUgfSk7XG4gICAgaWYgKGNoZWNrICE9PSAnb2snKSB7XG4gICAgICAvLyBQcmVzZXJ2ZSB0aGUgZGFtYWdlZCBmaWxlIGZvciByZWNvdmVyeSBhbmQgZmFpbCBsb3VkbHkgXHUyMDE0IG5ldmVyIHJ1biBvbiBhIGNvcnJ1cHQgZGIuXG4gICAgICBjb25zdCBxdWFyYW50aW5lID0gZGJQYXRoICsgJy5jb3JydXB0LScgKyBEYXRlLm5vdygpO1xuICAgICAgZGIuY2xvc2UoKTtcbiAgICAgIGZzLmNvcHlGaWxlU3luYyhkYlBhdGgsIHF1YXJhbnRpbmUpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRGF0YWJhc2UgZmFpbGVkIGludGVncml0eSBjaGVjayAoJHtjaGVja30pLiBEYW1hZ2VkIGNvcHkgcHJlc2VydmVkIGF0ICR7cXVhcmFudGluZX0uIGAgK1xuICAgICAgICAgICdSZXN0b3JlIGZyb20gYSBiYWNrdXAgaW4gdGhlIGJhY2t1cHMvIGZvbGRlci4nLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBhcHBseU1pZ3JhdGlvbnMoZGIsIGRhdGFEaXIsIGRiUGF0aCwgZXhpc3RlZCk7XG5cbiAgY29uc3QgZGV2aWNlSWQgPSBlbnN1cmVNZXRhKGRiLCAnZGV2aWNlX2lkJywgKCkgPT4gY3J5cHRvLnJhbmRvbVVVSUQoKSk7XG4gIGVuc3VyZU1ldGEoZGIsICdwcm9qZWN0X2lkJywgKCkgPT4gY3J5cHRvLnJhbmRvbVVVSUQoKSk7XG5cbiAgcmV0dXJuIHsgZGIsIGRldmljZUlkLCBkYXRhRGlyLCBkYlBhdGggfTtcbn1cblxuZnVuY3Rpb24gYXBwbHlNaWdyYXRpb25zKGRiOiBEQiwgZGF0YURpcjogc3RyaW5nLCBkYlBhdGg6IHN0cmluZywgZXhpc3RlZDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBoYXNNZXRhID0gZGJcbiAgICAucHJlcGFyZShcIlNFTEVDVCBDT1VOVCgqKSBBUyBjIEZST00gc3FsaXRlX21hc3RlciBXSEVSRSB0eXBlPSd0YWJsZScgQU5EIG5hbWU9J21ldGEnXCIpXG4gICAgLmdldCgpIGFzIHsgYzogbnVtYmVyIH07XG4gIGxldCB2ZXJzaW9uID0gMDtcbiAgaWYgKGhhc01ldGEuYyA+IDApIHtcbiAgICBjb25zdCByb3cgPSBkYi5wcmVwYXJlKFwiU0VMRUNUIHZhbHVlIEZST00gbWV0YSBXSEVSRSBrZXk9J3NjaGVtYV92ZXJzaW9uJ1wiKS5nZXQoKSBhc1xuICAgICAgfCB7IHZhbHVlOiBzdHJpbmcgfVxuICAgICAgfCB1bmRlZmluZWQ7XG4gICAgdmVyc2lvbiA9IHJvdyA/IE51bWJlcihyb3cudmFsdWUpIDogMDtcbiAgfVxuXG4gIGNvbnN0IHBlbmRpbmcgPSBNSUdSQVRJT05TLmZpbHRlcigobSkgPT4gbS52ZXJzaW9uID4gdmVyc2lvbik7XG4gIGlmIChwZW5kaW5nLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGlmIChleGlzdGVkICYmIHZlcnNpb24gPiAwKSB7XG4gICAgY29uc3QgYmFja3VwRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICdiYWNrdXBzJyk7XG4gICAgZnMubWtkaXJTeW5jKGJhY2t1cERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgY29uc3Qgc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCAnLScpO1xuICAgIGZzLmNvcHlGaWxlU3luYyhkYlBhdGgsIHBhdGguam9pbihiYWNrdXBEaXIsIGBwcmUtbWlncmF0aW9uLXYke3ZlcnNpb259LSR7c3RhbXB9LmRiYCkpO1xuICB9XG5cbiAgY29uc3QgcnVuID0gZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgIGZvciAoY29uc3QgbSBvZiBwZW5kaW5nKSB7XG4gICAgICBkYi5leGVjKG0uc3FsKTtcbiAgICAgIGRiLnByZXBhcmUoXG4gICAgICAgIFwiSU5TRVJUIElOVE8gbWV0YShrZXksdmFsdWUpIFZBTFVFUygnc2NoZW1hX3ZlcnNpb24nLD8pIFwiICtcbiAgICAgICAgICBcIk9OIENPTkZMSUNUKGtleSkgRE8gVVBEQVRFIFNFVCB2YWx1ZT1leGNsdWRlZC52YWx1ZVwiLFxuICAgICAgKS5ydW4oU3RyaW5nKG0udmVyc2lvbikpO1xuICAgIH1cbiAgfSk7XG4gIHJ1bigpO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVNZXRhKGRiOiBEQiwga2V5OiBzdHJpbmcsIG1ha2U6ICgpID0+IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHJvdyA9IGRiLnByZXBhcmUoJ1NFTEVDVCB2YWx1ZSBGUk9NIG1ldGEgV0hFUkUga2V5PT8nKS5nZXQoa2V5KSBhc1xuICAgIHwgeyB2YWx1ZTogc3RyaW5nIH1cbiAgICB8IHVuZGVmaW5lZDtcbiAgaWYgKHJvdykgcmV0dXJuIHJvdy52YWx1ZTtcbiAgY29uc3QgdmFsdWUgPSBtYWtlKCk7XG4gIGRiLnByZXBhcmUoJ0lOU0VSVCBJTlRPIG1ldGEoa2V5LHZhbHVlKSBWQUxVRVMoPyw/KScpLnJ1bihrZXksIHZhbHVlKTtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWV0YShkYjogREIsIGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHJvdyA9IGRiLnByZXBhcmUoJ1NFTEVDVCB2YWx1ZSBGUk9NIG1ldGEgV0hFUkUga2V5PT8nKS5nZXQoa2V5KSBhc1xuICAgIHwgeyB2YWx1ZTogc3RyaW5nIH1cbiAgICB8IHVuZGVmaW5lZDtcbiAgcmV0dXJuIHJvdyA/IHJvdy52YWx1ZSA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRNZXRhKGRiOiBEQiwga2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgZGIucHJlcGFyZShcbiAgICAnSU5TRVJUIElOVE8gbWV0YShrZXksdmFsdWUpIFZBTFVFUyg/LD8pIE9OIENPTkZMSUNUKGtleSkgRE8gVVBEQVRFIFNFVCB2YWx1ZT1leGNsdWRlZC52YWx1ZScsXG4gICkucnVuKGtleSwgdmFsdWUpO1xufVxuXG4vKiogTWFudWFsIGJhY2t1cDogY29uc2lzdGVudCBzbmFwc2hvdCB2aWEgU1FMaXRlIGJhY2t1cCBBUEkuIFJldHVybnMgYmFja3VwIHBhdGguICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYmFja3VwRGF0YWJhc2UoY3R4OiBEYkNvbnRleHQpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBiYWNrdXBEaXIgPSBwYXRoLmpvaW4oY3R4LmRhdGFEaXIsICdiYWNrdXBzJyk7XG4gIGZzLm1rZGlyU3luYyhiYWNrdXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICBjb25zdCBzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyk7XG4gIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4oYmFja3VwRGlyLCBgdGV0aGVyLSR7c3RhbXB9LmRiYCk7XG4gIGF3YWl0IGN0eC5kYi5iYWNrdXAoZGVzdCk7XG4gIHJldHVybiBkZXN0O1xufVxuIiwgIi8vIFZlcnNpb25lZCBzY2hlbWEgbWlncmF0aW9ucy4gTmV2ZXIgZWRpdCBhIHNoaXBwZWQgbWlncmF0aW9uIFx1MjAxNCBhcHBlbmQgYSBuZXcgb25lLlxuLy8gUnVubmVyOiBkYi50cyBhcHBseU1pZ3JhdGlvbnMoKS4gRWFjaCBtaWdyYXRpb24gcnVucyBpbiBhIHRyYW5zYWN0aW9uLlxuXG5leHBvcnQgaW50ZXJmYWNlIE1pZ3JhdGlvbiB7XG4gIHZlcnNpb246IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xuICBzcWw6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IE1JR1JBVElPTlM6IE1pZ3JhdGlvbltdID0gW1xuICB7XG4gICAgdmVyc2lvbjogMSxcbiAgICBuYW1lOiAnY29yZS1zY2hlbWEnLFxuICAgIHNxbDogYFxuQ1JFQVRFIFRBQkxFIG1ldGEgKFxuICBrZXkgVEVYVCBQUklNQVJZIEtFWSxcbiAgdmFsdWUgVEVYVCBOT1QgTlVMTFxuKTtcblxuQ1JFQVRFIFRBQkxFIHVzZXJzIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgbmFtZSBURVhUIE5PVCBOVUxMLFxuICBpbml0aWFscyBURVhUIE5PVCBOVUxMLFxuICBjb2xvciBURVhUIE5PVCBOVUxMLFxuICBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTExcbik7XG5cbkNSRUFURSBUQUJMRSBpdGVtcyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIGlkZW50IFRFWFQgTk9UIE5VTEwgVU5JUVVFLFxuICB0eXBlIFRFWFQgTk9UIE5VTEwsXG4gIHRpdGxlIFRFWFQgTk9UIE5VTEwsXG4gIGJvZHkgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxuICBib2R5X3RleHQgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxuICBzdGF0dXMgVEVYVCBOT1QgTlVMTCxcbiAgcHJpb3JpdHkgVEVYVCBOT1QgTlVMTCBERUZBVUxUICdub25lJyxcbiAgb3duZXJfaWQgVEVYVCxcbiAgcmVwb3J0ZXJfaWQgVEVYVCxcbiAgbWlsZXN0b25lX2lkIFRFWFQsXG4gIHJlbGVhc2VfaWQgVEVYVCxcbiAgcGFyZW50X2lkIFRFWFQsXG4gIHN0YXJ0X2RhdGUgVEVYVCxcbiAgZHVlX2RhdGUgVEVYVCxcbiAgY29tcGxldGVkX2F0IFRFWFQsXG4gIGVmZm9ydCBSRUFMLFxuICBjb25maWRlbmNlIFRFWFQsXG4gIHJpc2tfbGV2ZWwgVEVYVCxcbiAgYnVzaW5lc3NfdmFsdWUgVEVYVCxcbiAgbGVhZGVyc2hpcF92aXNpYmxlIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBwcm9ncmVzcyBJTlRFR0VSLFxuICB0YWdzIFRFWFQgTk9UIE5VTEwgREVGQVVMVCAnW10nLFxuICBleHRyYSBURVhUIE5PVCBOVUxMIERFRkFVTFQgJ3t9JyxcbiAgYXJjaGl2ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDAsXG4gIHNhbXBsZSBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxuICB1cGRhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXG4gIGNyZWF0ZWRfYnkgVEVYVCBOT1QgTlVMTCxcbiAgdXBkYXRlZF9ieSBURVhUIE5PVCBOVUxMXG4pO1xuQ1JFQVRFIElOREVYIGlkeF9pdGVtc190eXBlIE9OIGl0ZW1zKHR5cGUpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19zdGF0dXMgT04gaXRlbXMoc3RhdHVzKSBXSEVSRSBkZWxldGVkID0gMDtcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfb3duZXIgT04gaXRlbXMob3duZXJfaWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuQ1JFQVRFIElOREVYIGlkeF9pdGVtc19taWxlc3RvbmUgT04gaXRlbXMobWlsZXN0b25lX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfcmVsZWFzZSBPTiBpdGVtcyhyZWxlYXNlX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcbkNSRUFURSBJTkRFWCBpZHhfaXRlbXNfcGFyZW50IE9OIGl0ZW1zKHBhcmVudF9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XG5DUkVBVEUgSU5ERVggaWR4X2l0ZW1zX3VwZGF0ZWQgT04gaXRlbXModXBkYXRlZF9hdCk7XG5cbkNSRUFURSBUQUJMRSBpZGVudF9jb3VudGVycyAoXG4gIHR5cGUgVEVYVCBQUklNQVJZIEtFWSxcbiAgbmV4dCBJTlRFR0VSIE5PVCBOVUxMXG4pO1xuXG5DUkVBVEUgVEFCTEUgbGlua3MgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBmcm9tX2lkIFRFWFQgTk9UIE5VTEwsXG4gIHRvX2lkIFRFWFQgTk9UIE5VTEwsXG4gIGtpbmQgVEVYVCBOT1QgTlVMTCxcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxuICBjcmVhdGVkX2J5IFRFWFQgTk9UIE5VTExcbik7XG5DUkVBVEUgSU5ERVggaWR4X2xpbmtzX2Zyb20gT04gbGlua3MoZnJvbV9pZCkgV0hFUkUgZGVsZXRlZCA9IDA7XG5DUkVBVEUgSU5ERVggaWR4X2xpbmtzX3RvIE9OIGxpbmtzKHRvX2lkKSBXSEVSRSBkZWxldGVkID0gMDtcbkNSRUFURSBVTklRVUUgSU5ERVggaWR4X2xpbmtzX3VuaXEgT04gbGlua3MoZnJvbV9pZCwgdG9faWQsIGtpbmQpO1xuXG5DUkVBVEUgVEFCTEUgY29tbWVudHMgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBpdGVtX2lkIFRFWFQgTk9UIE5VTEwsXG4gIGF1dGhvcl9pZCBURVhUIE5PVCBOVUxMLFxuICBib2R5IFRFWFQgTk9UIE5VTEwsXG4gIGJvZHlfdGV4dCBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIGNyZWF0ZWRfYXQgVEVYVCBOT1QgTlVMTCxcbiAgdXBkYXRlZF9hdCBURVhULFxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwXG4pO1xuQ1JFQVRFIElOREVYIGlkeF9jb21tZW50c19pdGVtIE9OIGNvbW1lbnRzKGl0ZW1faWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuXG5DUkVBVEUgVEFCTEUgYXR0YWNobWVudHMgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBpdGVtX2lkIFRFWFQgTk9UIE5VTEwsXG4gIGZpbGVuYW1lIFRFWFQgTk9UIE5VTEwsXG4gIG1pbWUgVEVYVCBOT1QgTlVMTCxcbiAgc2l6ZSBJTlRFR0VSIE5PVCBOVUxMLFxuICBzaGEyNTYgVEVYVCBOT1QgTlVMTCxcbiAgZGVzY3JpcHRpb24gVEVYVCxcbiAgdXBsb2FkZWRfYnkgVEVYVCBOT1QgTlVMTCxcbiAgY3JlYXRlZF9hdCBURVhUIE5PVCBOVUxMLFxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwXG4pO1xuQ1JFQVRFIElOREVYIGlkeF9hdHRhY2htZW50c19pdGVtIE9OIGF0dGFjaG1lbnRzKGl0ZW1faWQpIFdIRVJFIGRlbGV0ZWQgPSAwO1xuXG5DUkVBVEUgVEFCTEUgYWN0aXZpdHkgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBpdGVtX2lkIFRFWFQsXG4gIGFjdG9yX2lkIFRFWFQgTk9UIE5VTEwsXG4gIGtpbmQgVEVYVCBOT1QgTlVMTCxcbiAgZmllbGQgVEVYVCxcbiAgb2xkX3ZhbHVlIFRFWFQsXG4gIG5ld192YWx1ZSBURVhULFxuICBhdCBURVhUIE5PVCBOVUxMXG4pO1xuQ1JFQVRFIElOREVYIGlkeF9hY3Rpdml0eV9pdGVtIE9OIGFjdGl2aXR5KGl0ZW1faWQpO1xuQ1JFQVRFIElOREVYIGlkeF9hY3Rpdml0eV9hdCBPTiBhY3Rpdml0eShhdCk7XG5cbkNSRUFURSBUQUJMRSBpdGVtX3ZlcnNpb25zIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgaXRlbV9pZCBURVhUIE5PVCBOVUxMLFxuICB2ZXJzaW9uIElOVEVHRVIgTk9UIE5VTEwsXG4gIHRpdGxlIFRFWFQgTk9UIE5VTEwsXG4gIGJvZHkgVEVYVCBOT1QgTlVMTCxcbiAgc2F2ZWRfYnkgVEVYVCBOT1QgTlVMTCxcbiAgc2F2ZWRfYXQgVEVYVCBOT1QgTlVMTFxuKTtcbkNSRUFURSBJTkRFWCBpZHhfdmVyc2lvbnNfaXRlbSBPTiBpdGVtX3ZlcnNpb25zKGl0ZW1faWQsIHZlcnNpb24pO1xuXG5DUkVBVEUgVEFCTEUgbWlsZXN0b25lcyAoXG4gIGlkIFRFWFQgUFJJTUFSWSBLRVksXG4gIG5hbWUgVEVYVCBOT1QgTlVMTCxcbiAgZGVzY3JpcHRpb24gVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxuICB0YXJnZXRfZGF0ZSBURVhULFxuICBzdGF0dXMgVEVYVCBOT1QgTlVMTCBERUZBVUxUICdwbGFubmVkJyxcbiAgc29ydCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcbiAgc2FtcGxlIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwLFxuICBkZWxldGVkIElOVEVHRVIgTk9UIE5VTEwgREVGQVVMVCAwXG4pO1xuXG5DUkVBVEUgVEFCTEUgcmVsZWFzZXMgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBuYW1lIFRFWFQgTk9UIE5VTEwsXG4gIHZlcnNpb24gVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxuICB0YXJnZXRfZGF0ZSBURVhULFxuICBzdGF0dXMgVEVYVCBOT1QgTlVMTCBERUZBVUxUICdwbGFubmVkJyxcbiAgZ29hbHMgVEVYVCBOT1QgTlVMTCBERUZBVUxUICcnLFxuICBub3RlcyBURVhUIE5PVCBOVUxMIERFRkFVTFQgJycsXG4gIHNhbXBsZSBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcbiAgZGVsZXRlZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMFxuKTtcblxuQ1JFQVRFIFRBQkxFIHNhdmVkX3ZpZXdzIChcbiAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgbmFtZSBURVhUIE5PVCBOVUxMLFxuICBjb25maWcgVEVYVCBOT1QgTlVMTCBERUZBVUxUICd7fScsXG4gIHBpbm5lZCBJTlRFR0VSIE5PVCBOVUxMIERFRkFVTFQgMCxcbiAgY3JlYXRlZF9ieSBURVhUIE5PVCBOVUxMLFxuICBjcmVhdGVkX2F0IFRFWFQgTk9UIE5VTEwsXG4gIGRlbGV0ZWQgSU5URUdFUiBOT1QgTlVMTCBERUZBVUxUIDBcbik7XG5cbi0tIEFwcGVuZC1vbmx5IG9wZXJhdGlvbiBsb2cuIFNvdXJjZSBmb3Igc3luYyBleHBvcnQ7IHBlZXJzJyBvcHMgcmVjb3JkZWQgd2l0aCBvcmlnaW4gZGV2aWNlLlxuQ1JFQVRFIFRBQkxFIG9wbG9nIChcbiAgc2VxIElOVEVHRVIgUFJJTUFSWSBLRVkgQVVUT0lOQ1JFTUVOVCxcbiAgb3BfaWQgVEVYVCBOT1QgTlVMTCBVTklRVUUsXG4gIGRldmljZV9pZCBURVhUIE5PVCBOVUxMLFxuICBhY3Rvcl9pZCBURVhUIE5PVCBOVUxMLFxuICBsYW1wb3J0IElOVEVHRVIgTk9UIE5VTEwsXG4gIGF0IFRFWFQgTk9UIE5VTEwsXG4gIGVudGl0eSBURVhUIE5PVCBOVUxMLFxuICBlbnRpdHlfaWQgVEVYVCBOT1QgTlVMTCxcbiAgYWN0aW9uIFRFWFQgTk9UIE5VTEwsXG4gIHBheWxvYWQgVEVYVCBOT1QgTlVMTFxuKTtcbkNSRUFURSBJTkRFWCBpZHhfb3Bsb2dfZW50aXR5IE9OIG9wbG9nKGVudGl0eSwgZW50aXR5X2lkKTtcbkNSRUFURSBJTkRFWCBpZHhfb3Bsb2dfZGV2aWNlIE9OIG9wbG9nKGRldmljZV9pZCwgc2VxKTtcblxuLS0gRmllbGQtbGV2ZWwgd3JpdGUgcmVnaXN0cnkgZm9yIExXVyBtZXJnZTogbGFzdCAobGFtcG9ydCwgZGV2aWNlKSB0aGF0IHdyb3RlIGVhY2ggZmllbGQuXG5DUkVBVEUgVEFCTEUgZmllbGRfY2xvY2sgKFxuICBlbnRpdHkgVEVYVCBOT1QgTlVMTCxcbiAgZW50aXR5X2lkIFRFWFQgTk9UIE5VTEwsXG4gIGZpZWxkIFRFWFQgTk9UIE5VTEwsXG4gIGxhbXBvcnQgSU5URUdFUiBOT1QgTlVMTCxcbiAgZGV2aWNlX2lkIFRFWFQgTk9UIE5VTEwsXG4gIFBSSU1BUlkgS0VZIChlbnRpdHksIGVudGl0eV9pZCwgZmllbGQpXG4pO1xuXG5DUkVBVEUgVEFCTEUgc3luY19jb25mbGljdHMgKFxuICBpZCBURVhUIFBSSU1BUlkgS0VZLFxuICBlbnRpdHkgVEVYVCBOT1QgTlVMTCxcbiAgZW50aXR5X2lkIFRFWFQgTk9UIE5VTEwsXG4gIGZpZWxkIFRFWFQgTk9UIE5VTEwsXG4gIGxvY2FsX3ZhbHVlIFRFWFQgTk9UIE5VTEwsXG4gIHJlbW90ZV92YWx1ZSBURVhUIE5PVCBOVUxMLFxuICByZW1vdGVfZGV2aWNlIFRFWFQgTk9UIE5VTEwsXG4gIHJlbW90ZV9hY3RvciBURVhUIE5PVCBOVUxMLFxuICBkZXRlY3RlZF9hdCBURVhUIE5PVCBOVUxMLFxuICByZXNvbHZlZF9hdCBURVhULFxuICByZXNvbHV0aW9uIFRFWFRcbik7XG5cbi0tIFBlci1wZWVyIGltcG9ydCBwcm9ncmVzczogaGlnaGVzdCBmaWxlIHNlcXVlbmNlIGNvbnN1bWVkIHBlciBkZXZpY2UuXG5DUkVBVEUgVEFCTEUgc3luY19wZWVycyAoXG4gIGRldmljZV9pZCBURVhUIFBSSU1BUlkgS0VZLFxuICB1c2VyX25hbWUgVEVYVCxcbiAgbGFzdF9maWxlIFRFWFQsXG4gIGxhc3Rfc2Vlbl9hdCBURVhUXG4pO1xuXG5DUkVBVEUgVklSVFVBTCBUQUJMRSBpdGVtc19mdHMgVVNJTkcgZnRzNShcbiAgaWRlbnQsIHRpdGxlLCBib2R5X3RleHQsIHRhZ3MsXG4gIGNvbnRlbnQ9J2l0ZW1zJywgY29udGVudF9yb3dpZD0ncm93aWQnLFxuICB0b2tlbml6ZT0ndW5pY29kZTYxJ1xuKTtcblxuQ1JFQVRFIFRSSUdHRVIgaXRlbXNfZnRzX2FpIEFGVEVSIElOU0VSVCBPTiBpdGVtcyBCRUdJTlxuICBJTlNFUlQgSU5UTyBpdGVtc19mdHMocm93aWQsIGlkZW50LCB0aXRsZSwgYm9keV90ZXh0LCB0YWdzKVxuICBWQUxVRVMgKG5ldy5yb3dpZCwgbmV3LmlkZW50LCBuZXcudGl0bGUsIG5ldy5ib2R5X3RleHQsIG5ldy50YWdzKTtcbkVORDtcbkNSRUFURSBUUklHR0VSIGl0ZW1zX2Z0c19hZCBBRlRFUiBERUxFVEUgT04gaXRlbXMgQkVHSU5cbiAgSU5TRVJUIElOVE8gaXRlbXNfZnRzKGl0ZW1zX2Z0cywgcm93aWQsIGlkZW50LCB0aXRsZSwgYm9keV90ZXh0LCB0YWdzKVxuICBWQUxVRVMgKCdkZWxldGUnLCBvbGQucm93aWQsIG9sZC5pZGVudCwgb2xkLnRpdGxlLCBvbGQuYm9keV90ZXh0LCBvbGQudGFncyk7XG5FTkQ7XG5DUkVBVEUgVFJJR0dFUiBpdGVtc19mdHNfYXUgQUZURVIgVVBEQVRFIE9OIGl0ZW1zIEJFR0lOXG4gIElOU0VSVCBJTlRPIGl0ZW1zX2Z0cyhpdGVtc19mdHMsIHJvd2lkLCBpZGVudCwgdGl0bGUsIGJvZHlfdGV4dCwgdGFncylcbiAgVkFMVUVTICgnZGVsZXRlJywgb2xkLnJvd2lkLCBvbGQuaWRlbnQsIG9sZC50aXRsZSwgb2xkLmJvZHlfdGV4dCwgb2xkLnRhZ3MpO1xuICBJTlNFUlQgSU5UTyBpdGVtc19mdHMocm93aWQsIGlkZW50LCB0aXRsZSwgYm9keV90ZXh0LCB0YWdzKVxuICBWQUxVRVMgKG5ldy5yb3dpZCwgbmV3LmlkZW50LCBuZXcudGl0bGUsIG5ldy5ib2R5X3RleHQsIG5ldy50YWdzKTtcbkVORDtcbmAsXG4gIH0sXG5dO1xuIiwgIi8vIFN0b3JlOiB0aGUgc2luZ2xlIHdyaXRlIHBhdGguIEV2ZXJ5IG11dGF0aW9uIChsb2NhbCBvciByZW1vdGUpIGZsb3dzIHRocm91Z2ggaGVyZSBzb1xuLy8gU1FMaXRlIHN0YXRlLCB0aGUgb3Bsb2csIGZpZWxkIGNsb2NrcywgYWN0aXZpdHkgaGlzdG9yeSwgYW5kIEZUUyBzdGF5IGNvbnNpc3RlbnQuXG4vL1xuLy8gU3luYyBtb2RlbCAoc2VlIGRvY3MvU1lOQ19BUkNISVRFQ1RVUkUubWQpOlxuLy8gLSBMb2NhbCBtdXRhdGlvbnMgYXBwZW5kIGZpZWxkLWdyYW51bGFyIG9wcyB0byBvcGxvZyAobGFtcG9ydCBjbG9jayArIGRldmljZSBpZCkuXG4vLyAtICdzZXQnIG9wcyBjYXJyeSBiYXNlZE9uID0gdGhlIChsYW1wb3J0LGRldmljZSkgZWFjaCBmaWVsZCBoYWQgd2hlbiB3cml0dGVuLFxuLy8gICBsZXR0aW5nIHRoZSBpbXBvcnRlciBkaXN0aW5ndWlzaCBjbGVhbiBjYXVzYWwgdXBkYXRlcyBmcm9tIHRydWUgY29uY3VycmVudCBlZGl0cy5cbi8vIC0gQ29uY3VycmVudCBlZGl0cyByZXNvbHZlIGJ5IExXVyAobGFtcG9ydCwgZGV2aWNlSWQgdGllYnJlYWspLiBGb3IgY29udGVudCBmaWVsZHNcbi8vICAgKHRpdGxlLCBib2R5KSB0aGUgbG9zaW5nIHZhbHVlIGlzIHByZXNlcnZlZCBpbiBzeW5jX2NvbmZsaWN0cyBmb3IgbWFudWFsIHJldmlldy5cblxuaW1wb3J0IGNyeXB0byBmcm9tICdub2RlOmNyeXB0byc7XG5pbXBvcnQgdHlwZSB7IERCLCBEYkNvbnRleHQgfSBmcm9tICcuL2RiJztcbmltcG9ydCB7IGdldE1ldGEsIHNldE1ldGEgfSBmcm9tICcuL2RiJztcbmltcG9ydCB0eXBlIHtcbiAgSXRlbUZpbHRlcixcbiAgSXRlbVNvcnQsXG4gIEl0ZW1UeXBlLFxuICBPcCxcbiAgV29ya0l0ZW0sXG4gIEl0ZW1MaW5rLFxuICBDb21tZW50LFxuICBNaWxlc3RvbmUsXG4gIFJlbGVhc2UsXG4gIFNhdmVkVmlldyxcbiAgVXNlcixcbiAgTGlua0tpbmQsXG4gIFNlYXJjaFJlc3VsdCxcbiAgU3luY0NvbmZsaWN0LFxufSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuaW1wb3J0IHsgSURFTlRfUFJFRklYLCBzdGF0dXNlc0ZvclR5cGUsIFRFUk1JTkFMX1NUQVRVU0VTIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcblxuY29uc3QgQ09ORkxJQ1RfU1VSRkFDRURfRklFTERTID0gbmV3IFNldChbJ3RpdGxlJywgJ2JvZHknXSk7XG5cbi8vIGNhbWVsQ2FzZSBmaWVsZCAtPiBpdGVtcyBjb2x1bW5cbmNvbnN0IElURU1fQ09MUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgaWRlbnQ6ICdpZGVudCcsXG4gIHR5cGU6ICd0eXBlJyxcbiAgdGl0bGU6ICd0aXRsZScsXG4gIGJvZHk6ICdib2R5JyxcbiAgYm9keVRleHQ6ICdib2R5X3RleHQnLFxuICBzdGF0dXM6ICdzdGF0dXMnLFxuICBwcmlvcml0eTogJ3ByaW9yaXR5JyxcbiAgb3duZXJJZDogJ293bmVyX2lkJyxcbiAgcmVwb3J0ZXJJZDogJ3JlcG9ydGVyX2lkJyxcbiAgbWlsZXN0b25lSWQ6ICdtaWxlc3RvbmVfaWQnLFxuICByZWxlYXNlSWQ6ICdyZWxlYXNlX2lkJyxcbiAgcGFyZW50SWQ6ICdwYXJlbnRfaWQnLFxuICBzdGFydERhdGU6ICdzdGFydF9kYXRlJyxcbiAgZHVlRGF0ZTogJ2R1ZV9kYXRlJyxcbiAgY29tcGxldGVkQXQ6ICdjb21wbGV0ZWRfYXQnLFxuICBlZmZvcnQ6ICdlZmZvcnQnLFxuICBjb25maWRlbmNlOiAnY29uZmlkZW5jZScsXG4gIHJpc2tMZXZlbDogJ3Jpc2tfbGV2ZWwnLFxuICBidXNpbmVzc1ZhbHVlOiAnYnVzaW5lc3NfdmFsdWUnLFxuICBsZWFkZXJzaGlwVmlzaWJsZTogJ2xlYWRlcnNoaXBfdmlzaWJsZScsXG4gIHByb2dyZXNzOiAncHJvZ3Jlc3MnLFxuICB0YWdzOiAndGFncycsXG4gIGV4dHJhOiAnZXh0cmEnLFxuICBhcmNoaXZlZDogJ2FyY2hpdmVkJyxcbiAgc2FtcGxlOiAnc2FtcGxlJyxcbiAgZGVsZXRlZDogJ2RlbGV0ZWQnLFxuICB1cGRhdGVkQXQ6ICd1cGRhdGVkX2F0JyxcbiAgdXBkYXRlZEJ5OiAndXBkYXRlZF9ieScsXG59O1xuXG5jb25zdCBKU09OX0lURU1fRklFTERTID0gbmV3IFNldChbJ3RhZ3MnLCAnZXh0cmEnXSk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmVFdmVudHMge1xuICBvbkNoYW5nZTogKHdoYXQ6IHsgZW50aXR5OiBzdHJpbmc7IGVudGl0eUlkOiBzdHJpbmcgfSkgPT4gdm9pZDtcbiAgb25Db25mbGljdDogKGNvbmZsaWN0OiBTeW5jQ29uZmxpY3QpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBTdG9yZSB7XG4gIHJlYWRvbmx5IGRiOiBEQjtcbiAgcmVhZG9ubHkgZGV2aWNlSWQ6IHN0cmluZztcbiAgYWN0b3JJZDogc3RyaW5nO1xuICBwcml2YXRlIGV2ZW50czogU3RvcmVFdmVudHM7XG5cbiAgY29uc3RydWN0b3IoY3R4OiBEYkNvbnRleHQsIGFjdG9ySWQ6IHN0cmluZywgZXZlbnRzPzogUGFydGlhbDxTdG9yZUV2ZW50cz4pIHtcbiAgICB0aGlzLmRiID0gY3R4LmRiO1xuICAgIHRoaXMuZGV2aWNlSWQgPSBjdHguZGV2aWNlSWQ7XG4gICAgdGhpcy5hY3RvcklkID0gYWN0b3JJZDtcbiAgICB0aGlzLmV2ZW50cyA9IHtcbiAgICAgIG9uQ2hhbmdlOiBldmVudHM/Lm9uQ2hhbmdlID8/ICgoKSA9PiB7fSksXG4gICAgICBvbkNvbmZsaWN0OiBldmVudHM/Lm9uQ29uZmxpY3QgPz8gKCgpID0+IHt9KSxcbiAgICB9O1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBjbG9ja3MgLS0tLS0tLS0tLVxuICBwcml2YXRlIHRpY2tMYW1wb3J0KCk6IG51bWJlciB7XG4gICAgY29uc3QgY3VyID0gTnVtYmVyKGdldE1ldGEodGhpcy5kYiwgJ2xhbXBvcnQnKSA/PyAnMCcpICsgMTtcbiAgICBzZXRNZXRhKHRoaXMuZGIsICdsYW1wb3J0JywgU3RyaW5nKGN1cikpO1xuICAgIHJldHVybiBjdXI7XG4gIH1cblxuICBwcml2YXRlIHdpdG5lc3NMYW1wb3J0KHJlbW90ZTogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgY3VyID0gTnVtYmVyKGdldE1ldGEodGhpcy5kYiwgJ2xhbXBvcnQnKSA/PyAnMCcpO1xuICAgIGlmIChyZW1vdGUgPiBjdXIpIHNldE1ldGEodGhpcy5kYiwgJ2xhbXBvcnQnLCBTdHJpbmcocmVtb3RlKSk7XG4gIH1cblxuICBwcml2YXRlIG5vdygpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gIH1cblxuICBwcml2YXRlIGZpZWxkQ2xvY2soZW50aXR5OiBzdHJpbmcsIGVudGl0eUlkOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcpOiB7IGxhbXBvcnQ6IG51bWJlcjsgZGV2aWNlSWQ6IHN0cmluZyB9IHwgbnVsbCB7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBsYW1wb3J0LCBkZXZpY2VfaWQgRlJPTSBmaWVsZF9jbG9jayBXSEVSRSBlbnRpdHk9PyBBTkQgZW50aXR5X2lkPT8gQU5EIGZpZWxkPT8nKVxuICAgICAgLmdldChlbnRpdHksIGVudGl0eUlkLCBmaWVsZCkgYXMgeyBsYW1wb3J0OiBudW1iZXI7IGRldmljZV9pZDogc3RyaW5nIH0gfCB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHJvdyA/IHsgbGFtcG9ydDogcm93LmxhbXBvcnQsIGRldmljZUlkOiByb3cuZGV2aWNlX2lkIH0gOiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRGaWVsZENsb2NrKGVudGl0eTogc3RyaW5nLCBlbnRpdHlJZDogc3RyaW5nLCBmaWVsZDogc3RyaW5nLCBsYW1wb3J0OiBudW1iZXIsIGRldmljZUlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmRiXG4gICAgICAucHJlcGFyZShcbiAgICAgICAgYElOU0VSVCBJTlRPIGZpZWxkX2Nsb2NrKGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZCwgbGFtcG9ydCwgZGV2aWNlX2lkKSBWQUxVRVMoPyw/LD8sPyw/KVxuICAgICAgICAgT04gQ09ORkxJQ1QoZW50aXR5LCBlbnRpdHlfaWQsIGZpZWxkKSBETyBVUERBVEUgU0VUIGxhbXBvcnQ9ZXhjbHVkZWQubGFtcG9ydCwgZGV2aWNlX2lkPWV4Y2x1ZGVkLmRldmljZV9pZGAsXG4gICAgICApXG4gICAgICAucnVuKGVudGl0eSwgZW50aXR5SWQsIGZpZWxkLCBsYW1wb3J0LCBkZXZpY2VJZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIG9wbG9nIC0tLS0tLS0tLS1cbiAgcHJpdmF0ZSBhcHBlbmRPcChvcDogT3ApOiB2b2lkIHtcbiAgICB0aGlzLmRiXG4gICAgICAucHJlcGFyZShcbiAgICAgICAgYElOU0VSVCBJTlRPIG9wbG9nKG9wX2lkLCBkZXZpY2VfaWQsIGFjdG9yX2lkLCBsYW1wb3J0LCBhdCwgZW50aXR5LCBlbnRpdHlfaWQsIGFjdGlvbiwgcGF5bG9hZClcbiAgICAgICAgIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sPylgLFxuICAgICAgKVxuICAgICAgLnJ1bihvcC5vcElkLCBvcC5kZXZpY2VJZCwgb3AuYWN0b3JJZCwgb3AubGFtcG9ydCwgb3AuYXQsIG9wLmVudGl0eSwgb3AuZW50aXR5SWQsIG9wLmFjdGlvbiwgSlNPTi5zdHJpbmdpZnkob3AucGF5bG9hZCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2NhbE9wKFxuICAgIGVudGl0eTogT3BbJ2VudGl0eSddLFxuICAgIGVudGl0eUlkOiBzdHJpbmcsXG4gICAgYWN0aW9uOiBPcFsnYWN0aW9uJ10sXG4gICAgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICk6IE9wIHtcbiAgICBjb25zdCBsYW1wb3J0ID0gdGhpcy50aWNrTGFtcG9ydCgpO1xuICAgIGNvbnN0IG9wOiBPcCA9IHtcbiAgICAgIG9wSWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICBkZXZpY2VJZDogdGhpcy5kZXZpY2VJZCxcbiAgICAgIGFjdG9ySWQ6IHRoaXMuYWN0b3JJZCxcbiAgICAgIGxhbXBvcnQsXG4gICAgICBhdDogdGhpcy5ub3coKSxcbiAgICAgIGVudGl0eSxcbiAgICAgIGVudGl0eUlkLFxuICAgICAgYWN0aW9uLFxuICAgICAgcGF5bG9hZCxcbiAgICB9O1xuICAgIHRoaXMuYXBwZW5kT3Aob3ApO1xuICAgIHJldHVybiBvcDtcbiAgfVxuXG4gIC8qKiBMb2NhbCAnc2V0JzogcmVjb3JkcyBiYXNlZE9uIGNsb2NrcyB0aGVuIGFkdmFuY2VzIHRoZW0uICovXG4gIHByaXZhdGUgbG9jYWxTZXQoZW50aXR5OiBPcFsnZW50aXR5J10sIGVudGl0eUlkOiBzdHJpbmcsIGZpZWxkczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkIHtcbiAgICBjb25zdCBiYXNlZE9uOiBSZWNvcmQ8c3RyaW5nLCB7IGxhbXBvcnQ6IG51bWJlcjsgZGV2aWNlSWQ6IHN0cmluZyB9IHwgbnVsbD4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IGYgb2YgT2JqZWN0LmtleXMoZmllbGRzKSkgYmFzZWRPbltmXSA9IHRoaXMuZmllbGRDbG9jayhlbnRpdHksIGVudGl0eUlkLCBmKTtcbiAgICBjb25zdCBvcCA9IHRoaXMubG9jYWxPcChlbnRpdHksIGVudGl0eUlkLCAnc2V0JywgeyBmaWVsZHMsIGJhc2VkT24gfSk7XG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKGZpZWxkcykpIHRoaXMuc2V0RmllbGRDbG9jayhlbnRpdHksIGVudGl0eUlkLCBmLCBvcC5sYW1wb3J0LCB0aGlzLmRldmljZUlkKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9jYWxDcmVhdGUoZW50aXR5OiBPcFsnZW50aXR5J10sIGVudGl0eUlkOiBzdHJpbmcsIHJlY29yZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkIHtcbiAgICBjb25zdCBvcCA9IHRoaXMubG9jYWxPcChlbnRpdHksIGVudGl0eUlkLCAnY3JlYXRlJywgeyByZWNvcmQgfSk7XG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKHJlY29yZCkpIHRoaXMuc2V0RmllbGRDbG9jayhlbnRpdHksIGVudGl0eUlkLCBmLCBvcC5sYW1wb3J0LCB0aGlzLmRldmljZUlkKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gaWRlbnQgYWxsb2NhdGlvbiAtLS0tLS0tLS0tXG4gIGFsbG9jSWRlbnQodHlwZTogSXRlbVR5cGUpOiBzdHJpbmcge1xuICAgIGNvbnN0IHByZWZpeCA9IElERU5UX1BSRUZJWFt0eXBlXTtcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBuZXh0IEZST00gaWRlbnRfY291bnRlcnMgV0hFUkUgdHlwZT0/JykuZ2V0KHR5cGUpIGFzXG4gICAgICB8IHsgbmV4dDogbnVtYmVyIH1cbiAgICAgIHwgdW5kZWZpbmVkO1xuICAgIGxldCBuID0gcm93ID8gcm93Lm5leHQgOiAxO1xuICAgIC8vIFNraXAgbnVtYmVycyBhbHJlYWR5IHRha2VuIChpbXBvcnRzIG1heSBoYXZlIGFkdmFuY2VkIHVzYWdlIHBhc3Qgb3VyIGNvdW50ZXIpLlxuICAgIHdoaWxlICh0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAxIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PycpLmdldChgJHtwcmVmaXh9LSR7bn1gKSkgbisrO1xuICAgIHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBpZGVudF9jb3VudGVycyh0eXBlLG5leHQpIFZBTFVFUyg/LD8pIE9OIENPTkZMSUNUKHR5cGUpIERPIFVQREFURSBTRVQgbmV4dD0/JylcbiAgICAgIC5ydW4odHlwZSwgbiArIDEsIG4gKyAxKTtcbiAgICByZXR1cm4gYCR7cHJlZml4fS0ke259YDtcbiAgfVxuXG4gIC8qKiBBZHZhbmNlIHRoZSBsb2NhbCBjb3VudGVyIHBhc3QgYW4gaWRlbnQgb2JzZXJ2ZWQgZnJvbSBhIHBlZXIuICovXG4gIHByaXZhdGUgd2l0bmVzc0lkZW50KHR5cGU6IEl0ZW1UeXBlLCBpZGVudDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgbSA9IC8tKFxcZCspJC8uZXhlYyhpZGVudCk7XG4gICAgaWYgKCFtKSByZXR1cm47XG4gICAgY29uc3QgbiA9IE51bWJlcihtWzFdKTtcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBuZXh0IEZST00gaWRlbnRfY291bnRlcnMgV0hFUkUgdHlwZT0/JykuZ2V0KHR5cGUpIGFzXG4gICAgICB8IHsgbmV4dDogbnVtYmVyIH1cbiAgICAgIHwgdW5kZWZpbmVkO1xuICAgIGlmICghcm93IHx8IHJvdy5uZXh0IDw9IG4pIHtcbiAgICAgIHRoaXMuZGJcbiAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIGlkZW50X2NvdW50ZXJzKHR5cGUsbmV4dCkgVkFMVUVTKD8sPykgT04gQ09ORkxJQ1QodHlwZSkgRE8gVVBEQVRFIFNFVCBuZXh0PT8nKVxuICAgICAgICAucnVuKHR5cGUsIG4gKyAxLCBuICsgMSk7XG4gICAgfVxuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBhY3Rpdml0eSAtLS0tLS0tLS0tXG4gIHByaXZhdGUgbG9nQWN0aXZpdHkoaXRlbUlkOiBzdHJpbmcgfCBudWxsLCBraW5kOiBzdHJpbmcsIGZpZWxkPzogc3RyaW5nIHwgbnVsbCwgb2xkVj86IHVua25vd24sIG5ld1Y/OiB1bmtub3duKTogdm9pZCB7XG4gICAgdGhpcy5kYlxuICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIGFjdGl2aXR5KGlkLCBpdGVtX2lkLCBhY3Rvcl9pZCwga2luZCwgZmllbGQsIG9sZF92YWx1ZSwgbmV3X3ZhbHVlLCBhdCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyknKVxuICAgICAgLnJ1bihcbiAgICAgICAgY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgaXRlbUlkLFxuICAgICAgICB0aGlzLmFjdG9ySWQsXG4gICAgICAgIGtpbmQsXG4gICAgICAgIGZpZWxkID8/IG51bGwsXG4gICAgICAgIG9sZFYgPT0gbnVsbCA/IG51bGwgOiBTdHJpbmcob2xkVikuc2xpY2UoMCwgNTAwKSxcbiAgICAgICAgbmV3ViA9PSBudWxsID8gbnVsbCA6IFN0cmluZyhuZXdWKS5zbGljZSgwLCA1MDApLFxuICAgICAgICB0aGlzLm5vdygpLFxuICAgICAgKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gaXRlbXMgLS0tLS0tLS0tLVxuICBjcmVhdGVJdGVtKGlucHV0OiBQYXJ0aWFsPFdvcmtJdGVtPiAmIHsgdHlwZTogSXRlbVR5cGU7IHRpdGxlOiBzdHJpbmcgfSk6IFdvcmtJdGVtIHtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgY29uc3QgaWQgPSBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgY29uc3QgaWRlbnQgPSB0aGlzLmFsbG9jSWRlbnQoaW5wdXQudHlwZSk7XG4gICAgICBjb25zdCBub3cgPSB0aGlzLm5vdygpO1xuICAgICAgY29uc3Qgc3RhdHVzZXMgPSBzdGF0dXNlc0ZvclR5cGUoaW5wdXQudHlwZSk7XG4gICAgICBjb25zdCBpdGVtOiBXb3JrSXRlbSA9IHtcbiAgICAgICAgaWQsXG4gICAgICAgIGlkZW50LFxuICAgICAgICB0eXBlOiBpbnB1dC50eXBlLFxuICAgICAgICB0aXRsZTogaW5wdXQudGl0bGUsXG4gICAgICAgIGJvZHk6IGlucHV0LmJvZHkgPz8gJycsXG4gICAgICAgIGJvZHlUZXh0OiBpbnB1dC5ib2R5VGV4dCA/PyAnJyxcbiAgICAgICAgc3RhdHVzOiBpbnB1dC5zdGF0dXMgJiYgc3RhdHVzZXMuaW5jbHVkZXMoaW5wdXQuc3RhdHVzKSA/IGlucHV0LnN0YXR1cyA6IHN0YXR1c2VzWzBdLFxuICAgICAgICBwcmlvcml0eTogaW5wdXQucHJpb3JpdHkgPz8gJ25vbmUnLFxuICAgICAgICBvd25lcklkOiBpbnB1dC5vd25lcklkID8/IG51bGwsXG4gICAgICAgIHJlcG9ydGVySWQ6IGlucHV0LnJlcG9ydGVySWQgPz8gdGhpcy5hY3RvcklkLFxuICAgICAgICBtaWxlc3RvbmVJZDogaW5wdXQubWlsZXN0b25lSWQgPz8gbnVsbCxcbiAgICAgICAgcmVsZWFzZUlkOiBpbnB1dC5yZWxlYXNlSWQgPz8gbnVsbCxcbiAgICAgICAgcGFyZW50SWQ6IGlucHV0LnBhcmVudElkID8/IG51bGwsXG4gICAgICAgIHN0YXJ0RGF0ZTogaW5wdXQuc3RhcnREYXRlID8/IG51bGwsXG4gICAgICAgIGR1ZURhdGU6IGlucHV0LmR1ZURhdGUgPz8gbnVsbCxcbiAgICAgICAgY29tcGxldGVkQXQ6IG51bGwsXG4gICAgICAgIGVmZm9ydDogaW5wdXQuZWZmb3J0ID8/IG51bGwsXG4gICAgICAgIGNvbmZpZGVuY2U6IGlucHV0LmNvbmZpZGVuY2UgPz8gbnVsbCxcbiAgICAgICAgcmlza0xldmVsOiBpbnB1dC5yaXNrTGV2ZWwgPz8gbnVsbCxcbiAgICAgICAgYnVzaW5lc3NWYWx1ZTogaW5wdXQuYnVzaW5lc3NWYWx1ZSA/PyBudWxsLFxuICAgICAgICBsZWFkZXJzaGlwVmlzaWJsZTogaW5wdXQubGVhZGVyc2hpcFZpc2libGUgPz8gMCxcbiAgICAgICAgcHJvZ3Jlc3M6IGlucHV0LnByb2dyZXNzID8/IG51bGwsXG4gICAgICAgIHRhZ3M6IGlucHV0LnRhZ3MgPz8gW10sXG4gICAgICAgIGV4dHJhOiBpbnB1dC5leHRyYSA/PyB7fSxcbiAgICAgICAgYXJjaGl2ZWQ6IDAsXG4gICAgICAgIHNhbXBsZTogaW5wdXQuc2FtcGxlID8/IDAsXG4gICAgICAgIGNyZWF0ZWRBdDogbm93LFxuICAgICAgICB1cGRhdGVkQXQ6IG5vdyxcbiAgICAgICAgY3JlYXRlZEJ5OiB0aGlzLmFjdG9ySWQsXG4gICAgICAgIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkLFxuICAgICAgfTtcbiAgICAgIHRoaXMuaW5zZXJ0SXRlbVJvdyhpdGVtKTtcbiAgICAgIHRoaXMubG9jYWxDcmVhdGUoJ2l0ZW0nLCBpZCwgdGhpcy5pdGVtVG9SZWNvcmQoaXRlbSkpO1xuICAgICAgdGhpcy5sb2dBY3Rpdml0eShpZCwgJ2NyZWF0ZWQnLCBudWxsLCBudWxsLCBpdGVtLnRpdGxlKTtcbiAgICAgIHJldHVybiBpdGVtO1xuICAgIH0pO1xuICAgIGNvbnN0IGl0ZW0gPSB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnaXRlbScsIGVudGl0eUlkOiBpdGVtLmlkIH0pO1xuICAgIHJldHVybiBpdGVtO1xuICB9XG5cbiAgcHJpdmF0ZSBpdGVtVG9SZWNvcmQoaXRlbTogV29ya0l0ZW0pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gICAgcmV0dXJuIHsgLi4uaXRlbSwgdGFnczogaXRlbS50YWdzLCBleHRyYTogaXRlbS5leHRyYSB9O1xuICB9XG5cbiAgcHJpdmF0ZSBpbnNlcnRJdGVtUm93KGk6IFdvcmtJdGVtKTogdm9pZCB7XG4gICAgdGhpcy5kYlxuICAgICAgLnByZXBhcmUoXG4gICAgICAgIGBJTlNFUlQgSU5UTyBpdGVtcyhpZCwgaWRlbnQsIHR5cGUsIHRpdGxlLCBib2R5LCBib2R5X3RleHQsIHN0YXR1cywgcHJpb3JpdHksIG93bmVyX2lkLCByZXBvcnRlcl9pZCxcbiAgICAgICAgICBtaWxlc3RvbmVfaWQsIHJlbGVhc2VfaWQsIHBhcmVudF9pZCwgc3RhcnRfZGF0ZSwgZHVlX2RhdGUsIGNvbXBsZXRlZF9hdCwgZWZmb3J0LCBjb25maWRlbmNlLFxuICAgICAgICAgIHJpc2tfbGV2ZWwsIGJ1c2luZXNzX3ZhbHVlLCBsZWFkZXJzaGlwX3Zpc2libGUsIHByb2dyZXNzLCB0YWdzLCBleHRyYSwgYXJjaGl2ZWQsIHNhbXBsZSwgZGVsZXRlZCxcbiAgICAgICAgICBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0LCBjcmVhdGVkX2J5LCB1cGRhdGVkX2J5KVxuICAgICAgICAgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPyw/LD8sPywwLD8sPyw/LD8pYCxcbiAgICAgIClcbiAgICAgIC5ydW4oXG4gICAgICAgIGkuaWQsIGkuaWRlbnQsIGkudHlwZSwgaS50aXRsZSwgaS5ib2R5LCBpLmJvZHlUZXh0LCBpLnN0YXR1cywgaS5wcmlvcml0eSwgaS5vd25lcklkLCBpLnJlcG9ydGVySWQsXG4gICAgICAgIGkubWlsZXN0b25lSWQsIGkucmVsZWFzZUlkLCBpLnBhcmVudElkLCBpLnN0YXJ0RGF0ZSwgaS5kdWVEYXRlLCBpLmNvbXBsZXRlZEF0LCBpLmVmZm9ydCwgaS5jb25maWRlbmNlLFxuICAgICAgICBpLnJpc2tMZXZlbCwgaS5idXNpbmVzc1ZhbHVlLCBpLmxlYWRlcnNoaXBWaXNpYmxlLCBpLnByb2dyZXNzLCBKU09OLnN0cmluZ2lmeShpLnRhZ3MpLCBKU09OLnN0cmluZ2lmeShpLmV4dHJhKSxcbiAgICAgICAgaS5hcmNoaXZlZCwgaS5zYW1wbGUsIGkuY3JlYXRlZEF0LCBpLnVwZGF0ZWRBdCwgaS5jcmVhdGVkQnksIGkudXBkYXRlZEJ5LFxuICAgICAgKTtcbiAgfVxuXG4gIHVwZGF0ZUl0ZW0oaWQ6IHN0cmluZywgZmllbGRzOiBQYXJ0aWFsPFdvcmtJdGVtPik6IFdvcmtJdGVtIHwgbnVsbCB7XG4gICAgY29uc3QgYmVmb3JlID0gdGhpcy5nZXRJdGVtKGlkKTtcbiAgICBpZiAoIWJlZm9yZSkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgY2hhbmdlZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XG4gICAgICBpZiAoIShrIGluIElURU1fQ09MUykgfHwgayA9PT0gJ2RlbGV0ZWQnKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHByZXYgPSAoYmVmb3JlIGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tdO1xuICAgICAgY29uc3Qgc2FtZSA9IEpTT05fSVRFTV9GSUVMRFMuaGFzKGspID8gSlNPTi5zdHJpbmdpZnkocHJldikgPT09IEpTT04uc3RyaW5naWZ5KHYpIDogcHJldiA9PT0gdjtcbiAgICAgIGlmICghc2FtZSkgY2hhbmdlZFtrXSA9IHY7XG4gICAgfVxuICAgIGlmIChPYmplY3Qua2V5cyhjaGFuZ2VkKS5sZW5ndGggPT09IDApIHJldHVybiBiZWZvcmU7XG5cbiAgICAvLyBTdGF0dXMgdHJhbnNpdGlvbnMgbWFpbnRhaW4gY29tcGxldGVkQXQgYXV0b21hdGljYWxseS5cbiAgICBpZiAoJ3N0YXR1cycgaW4gY2hhbmdlZCkge1xuICAgICAgY29uc3QgdGVybWluYWxOb3cgPSBURVJNSU5BTF9TVEFUVVNFUy5oYXMoU3RyaW5nKGNoYW5nZWQuc3RhdHVzKSk7XG4gICAgICBjb25zdCB0ZXJtaW5hbEJlZm9yZSA9IFRFUk1JTkFMX1NUQVRVU0VTLmhhcyhiZWZvcmUuc3RhdHVzKTtcbiAgICAgIGlmICh0ZXJtaW5hbE5vdyAmJiAhdGVybWluYWxCZWZvcmUpIGNoYW5nZWQuY29tcGxldGVkQXQgPSB0aGlzLm5vdygpO1xuICAgICAgaWYgKCF0ZXJtaW5hbE5vdyAmJiB0ZXJtaW5hbEJlZm9yZSkgY2hhbmdlZC5jb21wbGV0ZWRBdCA9IG51bGw7XG4gICAgfVxuICAgIGNoYW5nZWQudXBkYXRlZEF0ID0gdGhpcy5ub3coKTtcbiAgICBjaGFuZ2VkLnVwZGF0ZWRCeSA9IHRoaXMuYWN0b3JJZDtcblxuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmFwcGx5SXRlbUZpZWxkcyhpZCwgY2hhbmdlZCk7XG4gICAgICB0aGlzLmxvY2FsU2V0KCdpdGVtJywgaWQsIGNoYW5nZWQpO1xuICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoY2hhbmdlZCkpIHtcbiAgICAgICAgaWYgKGsgPT09ICd1cGRhdGVkQXQnIHx8IGsgPT09ICd1cGRhdGVkQnknKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGsgPT09ICdib2R5JyB8fCBrID09PSAnYm9keVRleHQnKSBjb250aW51ZTsgLy8gYm9keSBlZGl0cyBsb2dnZWQgYXMgb25lICdlZGl0ZWQnIGVudHJ5XG4gICAgICAgIHRoaXMubG9nQWN0aXZpdHkoaWQsICd1cGRhdGVkJywgaywgKGJlZm9yZSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrXSwgSlNPTl9JVEVNX0ZJRUxEUy5oYXMoaykgPyBKU09OLnN0cmluZ2lmeSh2KSA6IHYpO1xuICAgICAgfVxuICAgICAgaWYgKCdib2R5JyBpbiBjaGFuZ2VkKSB0aGlzLmxvZ0FjdGl2aXR5KGlkLCAnZWRpdGVkJywgJ2JvZHknKTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnaXRlbScsIGVudGl0eUlkOiBpZCB9KTtcbiAgICByZXR1cm4gdGhpcy5nZXRJdGVtKGlkKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlJdGVtRmllbGRzKGlkOiBzdHJpbmcsIGZpZWxkczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkIHtcbiAgICBjb25zdCBzZXRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHZhbHM6IHVua25vd25bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKGZpZWxkcykpIHtcbiAgICAgIGNvbnN0IGNvbCA9IElURU1fQ09MU1trXTtcbiAgICAgIGlmICghY29sKSBjb250aW51ZTtcbiAgICAgIHNldHMucHVzaChgJHtjb2x9PT9gKTtcbiAgICAgIHZhbHMucHVzaChKU09OX0lURU1fRklFTERTLmhhcyhrKSA/IEpTT04uc3RyaW5naWZ5KHYpIDogdik7XG4gICAgfVxuICAgIGlmIChzZXRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIHZhbHMucHVzaChpZCk7XG4gICAgdGhpcy5kYi5wcmVwYXJlKGBVUERBVEUgaXRlbXMgU0VUICR7c2V0cy5qb2luKCcsICcpfSBXSEVSRSBpZD0/YCkucnVuKC4uLnZhbHMpO1xuICB9XG5cbiAgYXJjaGl2ZUl0ZW0oaWQ6IHN0cmluZywgYXJjaGl2ZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUl0ZW0oaWQsIHsgYXJjaGl2ZWQ6IGFyY2hpdmVkID8gMSA6IDAgfSBhcyBQYXJ0aWFsPFdvcmtJdGVtPik7XG4gICAgdGhpcy5sb2dBY3Rpdml0eShpZCwgYXJjaGl2ZWQgPyAnYXJjaGl2ZWQnIDogJ3Jlc3RvcmVkJyk7XG4gIH1cblxuICBkZWxldGVJdGVtKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgaXRlbXMgU0VUIGRlbGV0ZWQ9MSwgdXBkYXRlZF9hdD0/LCB1cGRhdGVkX2J5PT8gV0hFUkUgaWQ9PycpLnJ1bih0aGlzLm5vdygpLCB0aGlzLmFjdG9ySWQsIGlkKTtcbiAgICAgIHRoaXMubG9jYWxPcCgnaXRlbScsIGlkLCAnZGVsZXRlJywge30pO1xuICAgICAgdGhpcy5sb2dBY3Rpdml0eShpZCwgJ2RlbGV0ZWQnKTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnaXRlbScsIGVudGl0eUlkOiBpZCB9KTtcbiAgfVxuXG4gIGdldEl0ZW0oaWQ6IHN0cmluZyk6IFdvcmtJdGVtIHwgbnVsbCB7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIGl0ZW1zIFdIRVJFIGlkPT8gQU5EIGRlbGV0ZWQ9MCcpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHJvdyA/IHJvd1RvSXRlbShyb3cpIDogbnVsbDtcbiAgfVxuXG4gIGdldEl0ZW1CeUlkZW50KGlkZW50OiBzdHJpbmcpOiBXb3JrSXRlbSB8IG51bGwge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUICogRlJPTSBpdGVtcyBXSEVSRSBpZGVudD0/IENPTExBVEUgTk9DQVNFIEFORCBkZWxldGVkPTAnKS5nZXQoaWRlbnQpIGFzXG4gICAgICB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gcm93ID8gcm93VG9JdGVtKHJvdykgOiBudWxsO1xuICB9XG5cbiAgbGlzdEl0ZW1zKGZpbHRlcjogSXRlbUZpbHRlciA9IHt9LCBzb3J0OiBJdGVtU29ydCA9IHsgZmllbGQ6ICd1cGRhdGVkQXQnLCBkaXI6ICdkZXNjJyB9LCBsaW1pdCA9IDUwMCwgb2Zmc2V0ID0gMCk6IFdvcmtJdGVtW10ge1xuICAgIGNvbnN0IHdoZXJlOiBzdHJpbmdbXSA9IFsnZGVsZXRlZD0wJ107XG4gICAgY29uc3QgdmFsczogdW5rbm93bltdID0gW107XG4gICAgaWYgKGZpbHRlci5hcmNoaXZlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB3aGVyZS5wdXNoKCdhcmNoaXZlZD0/Jyk7XG4gICAgICB2YWxzLnB1c2goZmlsdGVyLmFyY2hpdmVkID8gMSA6IDApO1xuICAgIH0gZWxzZSB3aGVyZS5wdXNoKCdhcmNoaXZlZD0wJyk7XG4gICAgaWYgKGZpbHRlci50eXBlcz8ubGVuZ3RoKSB7XG4gICAgICB3aGVyZS5wdXNoKGB0eXBlIElOICgke2ZpbHRlci50eXBlcy5tYXAoKCkgPT4gJz8nKS5qb2luKCcsJyl9KWApO1xuICAgICAgdmFscy5wdXNoKC4uLmZpbHRlci50eXBlcyk7XG4gICAgfVxuICAgIGlmIChmaWx0ZXIuc3RhdHVzZXM/Lmxlbmd0aCkge1xuICAgICAgd2hlcmUucHVzaChgc3RhdHVzIElOICgke2ZpbHRlci5zdGF0dXNlcy5tYXAoKCkgPT4gJz8nKS5qb2luKCcsJyl9KWApO1xuICAgICAgdmFscy5wdXNoKC4uLmZpbHRlci5zdGF0dXNlcyk7XG4gICAgfVxuICAgIGlmIChmaWx0ZXIucHJpb3JpdGllcz8ubGVuZ3RoKSB7XG4gICAgICB3aGVyZS5wdXNoKGBwcmlvcml0eSBJTiAoJHtmaWx0ZXIucHJpb3JpdGllcy5tYXAoKCkgPT4gJz8nKS5qb2luKCcsJyl9KWApO1xuICAgICAgdmFscy5wdXNoKC4uLmZpbHRlci5wcmlvcml0aWVzKTtcbiAgICB9XG4gICAgaWYgKGZpbHRlci5vd25lcklkcz8ubGVuZ3RoKSB7XG4gICAgICBjb25zdCBub25OdWxsID0gZmlsdGVyLm93bmVySWRzLmZpbHRlcigobykgPT4gbyAhPT0gbnVsbCk7XG4gICAgICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgICAgIGlmIChub25OdWxsLmxlbmd0aCkge1xuICAgICAgICBwYXJ0cy5wdXNoKGBvd25lcl9pZCBJTiAoJHtub25OdWxsLm1hcCgoKSA9PiAnPycpLmpvaW4oJywnKX0pYCk7XG4gICAgICAgIHZhbHMucHVzaCguLi5ub25OdWxsKTtcbiAgICAgIH1cbiAgICAgIGlmIChmaWx0ZXIub3duZXJJZHMuaW5jbHVkZXMobnVsbCkpIHBhcnRzLnB1c2goJ293bmVyX2lkIElTIE5VTEwnKTtcbiAgICAgIHdoZXJlLnB1c2goYCgke3BhcnRzLmpvaW4oJyBPUiAnKX0pYCk7XG4gICAgfVxuICAgIGlmIChmaWx0ZXIubWlsZXN0b25lSWQpIHsgd2hlcmUucHVzaCgnbWlsZXN0b25lX2lkPT8nKTsgdmFscy5wdXNoKGZpbHRlci5taWxlc3RvbmVJZCk7IH1cbiAgICBpZiAoZmlsdGVyLnJlbGVhc2VJZCkgeyB3aGVyZS5wdXNoKCdyZWxlYXNlX2lkPT8nKTsgdmFscy5wdXNoKGZpbHRlci5yZWxlYXNlSWQpOyB9XG4gICAgaWYgKGZpbHRlci5wYXJlbnRJZCkgeyB3aGVyZS5wdXNoKCdwYXJlbnRfaWQ9PycpOyB2YWxzLnB1c2goZmlsdGVyLnBhcmVudElkKTsgfVxuICAgIGlmIChmaWx0ZXIudGFnKSB7IHdoZXJlLnB1c2goXCJ0YWdzIExJS0UgP1wiKTsgdmFscy5wdXNoKGAlJHtKU09OLnN0cmluZ2lmeShmaWx0ZXIudGFnKX0lYCk7IH1cbiAgICBpZiAoZmlsdGVyLm92ZXJkdWUpIHsgd2hlcmUucHVzaChcImR1ZV9kYXRlIElTIE5PVCBOVUxMIEFORCBkdWVfZGF0ZSA8IGRhdGUoJ25vdycpIEFORCBjb21wbGV0ZWRfYXQgSVMgTlVMTFwiKTsgfVxuICAgIGlmIChmaWx0ZXIuZHVlV2l0aGluRGF5cyAhPSBudWxsKSB7XG4gICAgICB3aGVyZS5wdXNoKFwiZHVlX2RhdGUgSVMgTk9UIE5VTEwgQU5EIGR1ZV9kYXRlIDw9IGRhdGUoJ25vdycsID8pIEFORCBjb21wbGV0ZWRfYXQgSVMgTlVMTFwiKTtcbiAgICAgIHZhbHMucHVzaChgKyR7ZmlsdGVyLmR1ZVdpdGhpbkRheXN9IGRheXNgKTtcbiAgICB9XG4gICAgaWYgKGZpbHRlci5sZWFkZXJzaGlwVmlzaWJsZSkgd2hlcmUucHVzaCgnbGVhZGVyc2hpcF92aXNpYmxlPTEnKTtcbiAgICBpZiAoZmlsdGVyLnVwZGF0ZWRTaW5jZSkgeyB3aGVyZS5wdXNoKCd1cGRhdGVkX2F0ID49ID8nKTsgdmFscy5wdXNoKGZpbHRlci51cGRhdGVkU2luY2UpOyB9XG4gICAgaWYgKGZpbHRlci5zYW1wbGUgIT09IHVuZGVmaW5lZCkgeyB3aGVyZS5wdXNoKCdzYW1wbGU9PycpOyB2YWxzLnB1c2goZmlsdGVyLnNhbXBsZSA/IDEgOiAwKTsgfVxuICAgIGlmIChmaWx0ZXIudGV4dCkge1xuICAgICAgd2hlcmUucHVzaCgncm93aWQgSU4gKFNFTEVDVCByb3dpZCBGUk9NIGl0ZW1zX2Z0cyBXSEVSRSBpdGVtc19mdHMgTUFUQ0ggPyknKTtcbiAgICAgIHZhbHMucHVzaChmdHNRdWVyeShmaWx0ZXIudGV4dCkpO1xuICAgIH1cblxuICAgIGNvbnN0IHNvcnRDb2w6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICBpZGVudDogJ2lkZW50JyxcbiAgICAgIHRpdGxlOiAndGl0bGUgQ09MTEFURSBOT0NBU0UnLFxuICAgICAgc3RhdHVzOiAnc3RhdHVzJyxcbiAgICAgIHByaW9yaXR5OiBcIkNBU0UgcHJpb3JpdHkgV0hFTiAndXJnZW50JyBUSEVOIDAgV0hFTiAnaGlnaCcgVEhFTiAxIFdIRU4gJ21lZGl1bScgVEhFTiAyIFdIRU4gJ2xvdycgVEhFTiAzIEVMU0UgNCBFTkRcIixcbiAgICAgIGR1ZURhdGU6ICdkdWVfZGF0ZSBJUyBOVUxMLCBkdWVfZGF0ZScsXG4gICAgICBjcmVhdGVkQXQ6ICdjcmVhdGVkX2F0JyxcbiAgICAgIHVwZGF0ZWRBdDogJ3VwZGF0ZWRfYXQnLFxuICAgICAgbWFudWFsOiAndXBkYXRlZF9hdCcsXG4gICAgfTtcbiAgICBjb25zdCBvcmRlciA9IGAke3NvcnRDb2xbc29ydC5maWVsZF0gPz8gJ3VwZGF0ZWRfYXQnfSAke3NvcnQuZGlyID09PSAnYXNjJyA/ICdBU0MnIDogJ0RFU0MnfWA7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKGBTRUxFQ1QgKiBGUk9NIGl0ZW1zIFdIRVJFICR7d2hlcmUuam9pbignIEFORCAnKX0gT1JERVIgQlkgJHtvcmRlcn0gTElNSVQgPyBPRkZTRVQgP2ApXG4gICAgICAuYWxsKC4uLnZhbHMsIGxpbWl0LCBvZmZzZXQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XG4gICAgcmV0dXJuIHJvd3MubWFwKHJvd1RvSXRlbSk7XG4gIH1cblxuICBzZWFyY2godGV4dDogc3RyaW5nLCBsaW1pdCA9IDMwKTogU2VhcmNoUmVzdWx0W10ge1xuICAgIGlmICghdGV4dC50cmltKCkpIHJldHVybiBbXTtcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxuICAgICAgLnByZXBhcmUoXG4gICAgICAgIGBTRUxFQ1QgaXRlbXMuKiwgc25pcHBldChpdGVtc19mdHMsIDIsICc8PCcsICc+PicsICdcdTIwMjYnLCAxMikgQVMgc25pcCwgcmFuayBBUyBzY29yZVxuICAgICAgICAgRlJPTSBpdGVtc19mdHMgSk9JTiBpdGVtcyBPTiBpdGVtcy5yb3dpZCA9IGl0ZW1zX2Z0cy5yb3dpZFxuICAgICAgICAgV0hFUkUgaXRlbXNfZnRzIE1BVENIID8gQU5EIGl0ZW1zLmRlbGV0ZWQ9MCBBTkQgaXRlbXMuYXJjaGl2ZWQ9MFxuICAgICAgICAgT1JERVIgQlkgcmFuayBMSU1JVCA/YCxcbiAgICAgIClcbiAgICAgIC5hbGwoZnRzUXVlcnkodGV4dCksIGxpbWl0KSBhcyAoUmVjb3JkPHN0cmluZywgdW5rbm93bj4gJiB7IHNuaXA6IHN0cmluZzsgc2NvcmU6IG51bWJlciB9KVtdO1xuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHsgaXRlbTogcm93VG9JdGVtKHIpLCBzbmlwcGV0OiByLnNuaXAsIHNjb3JlOiByLnNjb3JlIH0pKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gbGlua3MgLS0tLS0tLS0tLVxuICBhZGRMaW5rKGZyb21JZDogc3RyaW5nLCB0b0lkOiBzdHJpbmcsIGtpbmQ6IExpbmtLaW5kKTogSXRlbUxpbmsgfCBudWxsIHtcbiAgICBpZiAoZnJvbUlkID09PSB0b0lkKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIGxpbmtzIFdIRVJFIGZyb21faWQ9PyBBTkQgdG9faWQ9PyBBTkQga2luZD0/JylcbiAgICAgIC5nZXQoZnJvbUlkLCB0b0lkLCBraW5kKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZXhpc3RpbmcgJiYgIWV4aXN0aW5nLmRlbGV0ZWQpIHJldHVybiByb3dUb0xpbmsoZXhpc3RpbmcpO1xuICAgIGNvbnN0IGxpbms6IEl0ZW1MaW5rID0ge1xuICAgICAgaWQ6IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmlkKSA6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICBmcm9tSWQsXG4gICAgICB0b0lkLFxuICAgICAga2luZCxcbiAgICAgIGNyZWF0ZWRBdDogdGhpcy5ub3coKSxcbiAgICAgIGNyZWF0ZWRCeTogdGhpcy5hY3RvcklkLFxuICAgIH07XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBsaW5rcyBTRVQgZGVsZXRlZD0wIFdIRVJFIGlkPT8nKS5ydW4obGluay5pZCk7XG4gICAgICAgIHRoaXMubG9jYWxTZXQoJ2xpbmsnLCBsaW5rLmlkLCB7IGRlbGV0ZWQ6IDAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIGxpbmtzKGlkLCBmcm9tX2lkLCB0b19pZCwga2luZCwgZGVsZXRlZCwgY3JlYXRlZF9hdCwgY3JlYXRlZF9ieSkgVkFMVUVTKD8sPyw/LD8sMCw/LD8pJylcbiAgICAgICAgICAucnVuKGxpbmsuaWQsIGZyb21JZCwgdG9JZCwga2luZCwgbGluay5jcmVhdGVkQXQsIGxpbmsuY3JlYXRlZEJ5KTtcbiAgICAgICAgdGhpcy5sb2NhbENyZWF0ZSgnbGluaycsIGxpbmsuaWQsIHsgLi4ubGluayB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMubG9nQWN0aXZpdHkoZnJvbUlkLCAnbGluaycsIGtpbmQsIG51bGwsIHRvSWQpO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdsaW5rJywgZW50aXR5SWQ6IGxpbmsuaWQgfSk7XG4gICAgcmV0dXJuIGxpbms7XG4gIH1cblxuICByZW1vdmVMaW5rKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCBmcm9tX2lkLCBraW5kLCB0b19pZCBGUk9NIGxpbmtzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzXG4gICAgICB8IHsgZnJvbV9pZDogc3RyaW5nOyBraW5kOiBzdHJpbmc7IHRvX2lkOiBzdHJpbmcgfVxuICAgICAgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGxpbmtzIFNFVCBkZWxldGVkPTEgV0hFUkUgaWQ9PycpLnJ1bihpZCk7XG4gICAgICB0aGlzLmxvY2FsU2V0KCdsaW5rJywgaWQsIHsgZGVsZXRlZDogMSB9KTtcbiAgICAgIGlmIChyb3cpIHRoaXMubG9nQWN0aXZpdHkocm93LmZyb21faWQsICd1bmxpbmsnLCByb3cua2luZCwgcm93LnRvX2lkLCBudWxsKTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnbGluaycsIGVudGl0eUlkOiBpZCB9KTtcbiAgfVxuXG4gIGxpbmtzRm9yKGl0ZW1JZDogc3RyaW5nKTogeyBsaW5rOiBJdGVtTGluazsgZGlyZWN0aW9uOiAnb3V0JyB8ICdpbic7IG90aGVyOiBXb3JrSXRlbSB9W10ge1xuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUICogRlJPTSBsaW5rcyBXSEVSRSAoZnJvbV9pZD0/IE9SIHRvX2lkPT8pIEFORCBkZWxldGVkPTAnKVxuICAgICAgLmFsbChpdGVtSWQsIGl0ZW1JZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICBjb25zdCBvdXQ6IHsgbGluazogSXRlbUxpbms7IGRpcmVjdGlvbjogJ291dCcgfCAnaW4nOyBvdGhlcjogV29ya0l0ZW0gfVtdID0gW107XG4gICAgZm9yIChjb25zdCByIG9mIHJvd3MpIHtcbiAgICAgIGNvbnN0IGxpbmsgPSByb3dUb0xpbmsocik7XG4gICAgICBjb25zdCBkaXJlY3Rpb24gPSBsaW5rLmZyb21JZCA9PT0gaXRlbUlkID8gJ291dCcgOiAnaW4nO1xuICAgICAgY29uc3Qgb3RoZXIgPSB0aGlzLmdldEl0ZW0oZGlyZWN0aW9uID09PSAnb3V0JyA/IGxpbmsudG9JZCA6IGxpbmsuZnJvbUlkKTtcbiAgICAgIGlmIChvdGhlcikgb3V0LnB1c2goeyBsaW5rLCBkaXJlY3Rpb24sIG90aGVyIH0pO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBjb21tZW50cyAtLS0tLS0tLS0tXG4gIGFkZENvbW1lbnQoaXRlbUlkOiBzdHJpbmcsIGJvZHk6IHN0cmluZywgYm9keVRleHQ6IHN0cmluZyk6IENvbW1lbnQge1xuICAgIGNvbnN0IGM6IENvbW1lbnQgPSB7XG4gICAgICBpZDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgIGl0ZW1JZCxcbiAgICAgIGF1dGhvcklkOiB0aGlzLmFjdG9ySWQsXG4gICAgICBib2R5LFxuICAgICAgYm9keVRleHQsXG4gICAgICBjcmVhdGVkQXQ6IHRoaXMubm93KCksXG4gICAgICB1cGRhdGVkQXQ6IG51bGwsXG4gICAgICBkZWxldGVkOiAwLFxuICAgIH07XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMuZGJcbiAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBJTlRPIGNvbW1lbnRzKGlkLCBpdGVtX2lkLCBhdXRob3JfaWQsIGJvZHksIGJvZHlfdGV4dCwgY3JlYXRlZF9hdCwgdXBkYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sMCknKVxuICAgICAgICAucnVuKGMuaWQsIGMuaXRlbUlkLCBjLmF1dGhvcklkLCBjLmJvZHksIGMuYm9keVRleHQsIGMuY3JlYXRlZEF0LCBjLnVwZGF0ZWRBdCk7XG4gICAgICB0aGlzLmxvY2FsQ3JlYXRlKCdjb21tZW50JywgYy5pZCwgeyAuLi5jIH0pO1xuICAgICAgdGhpcy5sb2dBY3Rpdml0eShpdGVtSWQsICdjb21tZW50JywgbnVsbCwgbnVsbCwgYm9keVRleHQuc2xpY2UoMCwgMjAwKSk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ2NvbW1lbnQnLCBlbnRpdHlJZDogYy5pZCB9KTtcbiAgICByZXR1cm4gYztcbiAgfVxuXG4gIHVwZGF0ZUNvbW1lbnQoaWQ6IHN0cmluZywgYm9keTogc3RyaW5nLCBib2R5VGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZmllbGRzID0geyBib2R5LCBib2R5VGV4dCwgdXBkYXRlZEF0OiB0aGlzLm5vdygpIH07XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGNvbW1lbnRzIFNFVCBib2R5PT8sIGJvZHlfdGV4dD0/LCB1cGRhdGVkX2F0PT8gV0hFUkUgaWQ9PycpLnJ1bihib2R5LCBib2R5VGV4dCwgZmllbGRzLnVwZGF0ZWRBdCwgaWQpO1xuICAgICAgdGhpcy5sb2NhbFNldCgnY29tbWVudCcsIGlkLCBmaWVsZHMpO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdjb21tZW50JywgZW50aXR5SWQ6IGlkIH0pO1xuICB9XG5cbiAgZGVsZXRlQ29tbWVudChpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMuZGIucHJlcGFyZSgnVVBEQVRFIGNvbW1lbnRzIFNFVCBkZWxldGVkPTEgV0hFUkUgaWQ9PycpLnJ1bihpZCk7XG4gICAgICB0aGlzLmxvY2FsU2V0KCdjb21tZW50JywgaWQsIHsgZGVsZXRlZDogMSB9KTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnY29tbWVudCcsIGVudGl0eUlkOiBpZCB9KTtcbiAgfVxuXG4gIGNvbW1lbnRzRm9yKGl0ZW1JZDogc3RyaW5nKTogQ29tbWVudFtdIHtcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gY29tbWVudHMgV0hFUkUgaXRlbV9pZD0/IEFORCBkZWxldGVkPTAgT1JERVIgQlkgY3JlYXRlZF9hdCBBU0MnKVxuICAgICAgLmFsbChpdGVtSWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xuICAgICAgaWQ6IFN0cmluZyhyLmlkKSxcbiAgICAgIGl0ZW1JZDogU3RyaW5nKHIuaXRlbV9pZCksXG4gICAgICBhdXRob3JJZDogU3RyaW5nKHIuYXV0aG9yX2lkKSxcbiAgICAgIGJvZHk6IFN0cmluZyhyLmJvZHkpLFxuICAgICAgYm9keVRleHQ6IFN0cmluZyhyLmJvZHlfdGV4dCksXG4gICAgICBjcmVhdGVkQXQ6IFN0cmluZyhyLmNyZWF0ZWRfYXQpLFxuICAgICAgdXBkYXRlZEF0OiByLnVwZGF0ZWRfYXQgPyBTdHJpbmcoci51cGRhdGVkX2F0KSA6IG51bGwsXG4gICAgICBkZWxldGVkOiAwLFxuICAgIH0pKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gdmVyc2lvbnMgLS0tLS0tLS0tLVxuICBzYXZlVmVyc2lvbihpdGVtSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmdldEl0ZW0oaXRlbUlkKTtcbiAgICBpZiAoIWl0ZW0pIHJldHVybjtcbiAgICBjb25zdCBsYXN0ID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgTUFYKHZlcnNpb24pIEFTIHYgRlJPTSBpdGVtX3ZlcnNpb25zIFdIRVJFIGl0ZW1faWQ9PycpLmdldChpdGVtSWQpIGFzIHsgdjogbnVtYmVyIHwgbnVsbCB9O1xuICAgIHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdJTlNFUlQgSU5UTyBpdGVtX3ZlcnNpb25zKGlkLCBpdGVtX2lkLCB2ZXJzaW9uLCB0aXRsZSwgYm9keSwgc2F2ZWRfYnksIHNhdmVkX2F0KSBWQUxVRVMoPyw/LD8sPyw/LD8sPyknKVxuICAgICAgLnJ1bihjcnlwdG8ucmFuZG9tVVVJRCgpLCBpdGVtSWQsIChsYXN0LnYgPz8gMCkgKyAxLCBpdGVtLnRpdGxlLCBpdGVtLmJvZHksIHRoaXMuYWN0b3JJZCwgdGhpcy5ub3coKSk7XG4gIH1cblxuICB2ZXJzaW9uc0ZvcihpdGVtSWQ6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIGlkLCBpdGVtX2lkIEFTIGl0ZW1JZCwgdmVyc2lvbiwgdGl0bGUsIGJvZHksIHNhdmVkX2J5IEFTIHNhdmVkQnksIHNhdmVkX2F0IEFTIHNhdmVkQXQgRlJPTSBpdGVtX3ZlcnNpb25zIFdIRVJFIGl0ZW1faWQ9PyBPUkRFUiBCWSB2ZXJzaW9uIERFU0MnKVxuICAgICAgLmFsbChpdGVtSWQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSB1c2VycyAtLS0tLS0tLS0tXG4gIHVwc2VydFVzZXIodTogeyBpZDogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IGluaXRpYWxzOiBzdHJpbmc7IGNvbG9yOiBzdHJpbmcgfSk6IFVzZXIge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHVzZXJzIFdIRVJFIGlkPT8nKS5nZXQodS5pZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgdXNlcjogVXNlciA9IHtcbiAgICAgIC4uLnUsXG4gICAgICBjcmVhdGVkQXQ6IGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmNyZWF0ZWRfYXQpIDogdGhpcy5ub3coKSxcbiAgICB9O1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiXG4gICAgICAgIC5wcmVwYXJlKFxuICAgICAgICAgIGBJTlNFUlQgSU5UTyB1c2VycyhpZCwgbmFtZSwgaW5pdGlhbHMsIGNvbG9yLCBjcmVhdGVkX2F0KSBWQUxVRVMoPyw/LD8sPyw/KVxuICAgICAgICAgICBPTiBDT05GTElDVChpZCkgRE8gVVBEQVRFIFNFVCBuYW1lPWV4Y2x1ZGVkLm5hbWUsIGluaXRpYWxzPWV4Y2x1ZGVkLmluaXRpYWxzLCBjb2xvcj1leGNsdWRlZC5jb2xvcmAsXG4gICAgICAgIClcbiAgICAgICAgLnJ1bih1c2VyLmlkLCB1c2VyLm5hbWUsIHVzZXIuaW5pdGlhbHMsIHVzZXIuY29sb3IsIHVzZXIuY3JlYXRlZEF0KTtcbiAgICAgIGlmICghZXhpc3RpbmcpIHRoaXMubG9jYWxDcmVhdGUoJ3VzZXInLCB1c2VyLmlkLCB7IC4uLnVzZXIgfSk7XG4gICAgICBlbHNlIHRoaXMubG9jYWxTZXQoJ3VzZXInLCB1c2VyLmlkLCB7IG5hbWU6IHVzZXIubmFtZSwgaW5pdGlhbHM6IHVzZXIuaW5pdGlhbHMsIGNvbG9yOiB1c2VyLmNvbG9yIH0pO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgcmV0dXJuIHVzZXI7XG4gIH1cblxuICBsaXN0VXNlcnMoKTogVXNlcltdIHtcbiAgICByZXR1cm4gKHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkLCBuYW1lLCBpbml0aWFscywgY29sb3IsIGNyZWF0ZWRfYXQgQVMgY3JlYXRlZEF0IEZST00gdXNlcnMnKS5hbGwoKSBhcyBVc2VyW10pO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSBtaWxlc3RvbmVzIC8gcmVsZWFzZXMgLS0tLS0tLS0tLVxuICB1cHNlcnRNaWxlc3RvbmUobTogUGFydGlhbDxNaWxlc3RvbmU+ICYgeyBuYW1lOiBzdHJpbmcgfSk6IE1pbGVzdG9uZSB7XG4gICAgY29uc3QgaWQgPSBtLmlkID8/IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gbWlsZXN0b25lcyBXSEVSRSBpZD0/JykuZ2V0KGlkKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCByZWM6IE1pbGVzdG9uZSA9IHtcbiAgICAgIGlkLFxuICAgICAgbmFtZTogbS5uYW1lLFxuICAgICAgZGVzY3JpcHRpb246IG0uZGVzY3JpcHRpb24gPz8gKGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmRlc2NyaXB0aW9uKSA6ICcnKSxcbiAgICAgIHRhcmdldERhdGU6IG0udGFyZ2V0RGF0ZSA/PyAoZXhpc3RpbmcgPyAoZXhpc3RpbmcudGFyZ2V0X2RhdGUgYXMgc3RyaW5nIHwgbnVsbCkgOiBudWxsKSxcbiAgICAgIHN0YXR1czogKG0uc3RhdHVzID8/IChleGlzdGluZyA/IGV4aXN0aW5nLnN0YXR1cyA6ICdwbGFubmVkJykpIGFzIE1pbGVzdG9uZVsnc3RhdHVzJ10sXG4gICAgICBzb3J0OiBtLnNvcnQgPz8gKGV4aXN0aW5nID8gTnVtYmVyKGV4aXN0aW5nLnNvcnQpIDogMCksXG4gICAgICBzYW1wbGU6IG0uc2FtcGxlID8/IChleGlzdGluZyA/IChOdW1iZXIoZXhpc3Rpbmcuc2FtcGxlKSBhcyAwIHwgMSkgOiAwKSxcbiAgICB9O1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiXG4gICAgICAgIC5wcmVwYXJlKFxuICAgICAgICAgIGBJTlNFUlQgSU5UTyBtaWxlc3RvbmVzKGlkLCBuYW1lLCBkZXNjcmlwdGlvbiwgdGFyZ2V0X2RhdGUsIHN0YXR1cywgc29ydCwgc2FtcGxlLCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sPywwKVxuICAgICAgICAgICBPTiBDT05GTElDVChpZCkgRE8gVVBEQVRFIFNFVCBuYW1lPT8sIGRlc2NyaXB0aW9uPT8sIHRhcmdldF9kYXRlPT8sIHN0YXR1cz0/LCBzb3J0PT8sIGRlbGV0ZWQ9MGAsXG4gICAgICAgIClcbiAgICAgICAgLnJ1bihyZWMuaWQsIHJlYy5uYW1lLCByZWMuZGVzY3JpcHRpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuc29ydCwgcmVjLnNhbXBsZSxcbiAgICAgICAgICAgICByZWMubmFtZSwgcmVjLmRlc2NyaXB0aW9uLCByZWMudGFyZ2V0RGF0ZSwgcmVjLnN0YXR1cywgcmVjLnNvcnQpO1xuICAgICAgaWYgKCFleGlzdGluZykgdGhpcy5sb2NhbENyZWF0ZSgnbWlsZXN0b25lJywgaWQsIHsgLi4ucmVjIH0pO1xuICAgICAgZWxzZSB0aGlzLmxvY2FsU2V0KCdtaWxlc3RvbmUnLCBpZCwgeyBuYW1lOiByZWMubmFtZSwgZGVzY3JpcHRpb246IHJlYy5kZXNjcmlwdGlvbiwgdGFyZ2V0RGF0ZTogcmVjLnRhcmdldERhdGUsIHN0YXR1czogcmVjLnN0YXR1cywgc29ydDogcmVjLnNvcnQgfSk7XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICB0aGlzLmV2ZW50cy5vbkNoYW5nZSh7IGVudGl0eTogJ21pbGVzdG9uZScsIGVudGl0eUlkOiBpZCB9KTtcbiAgICByZXR1cm4gcmVjO1xuICB9XG5cbiAgbGlzdE1pbGVzdG9uZXMoKTogTWlsZXN0b25lW10ge1xuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gbWlsZXN0b25lcyBXSEVSRSBkZWxldGVkPTAgT1JERVIgQlkgc29ydCwgdGFyZ2V0X2RhdGUnKS5hbGwoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcbiAgICAgIGlkOiBTdHJpbmcoci5pZCksIG5hbWU6IFN0cmluZyhyLm5hbWUpLCBkZXNjcmlwdGlvbjogU3RyaW5nKHIuZGVzY3JpcHRpb24pLFxuICAgICAgdGFyZ2V0RGF0ZTogci50YXJnZXRfZGF0ZSA/IFN0cmluZyhyLnRhcmdldF9kYXRlKSA6IG51bGwsXG4gICAgICBzdGF0dXM6IHIuc3RhdHVzIGFzIE1pbGVzdG9uZVsnc3RhdHVzJ10sIHNvcnQ6IE51bWJlcihyLnNvcnQpLCBzYW1wbGU6IE51bWJlcihyLnNhbXBsZSkgYXMgMCB8IDEsXG4gICAgfSkpO1xuICB9XG5cbiAgdXBzZXJ0UmVsZWFzZShtOiBQYXJ0aWFsPFJlbGVhc2U+ICYgeyBuYW1lOiBzdHJpbmcgfSk6IFJlbGVhc2Uge1xuICAgIGNvbnN0IGlkID0gbS5pZCA/PyBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHJlbGVhc2VzIFdIRVJFIGlkPT8nKS5nZXQoaWQpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHJlYzogUmVsZWFzZSA9IHtcbiAgICAgIGlkLFxuICAgICAgbmFtZTogbS5uYW1lLFxuICAgICAgdmVyc2lvbjogbS52ZXJzaW9uID8/IChleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy52ZXJzaW9uKSA6ICcnKSxcbiAgICAgIHRhcmdldERhdGU6IG0udGFyZ2V0RGF0ZSA/PyAoZXhpc3RpbmcgPyAoZXhpc3RpbmcudGFyZ2V0X2RhdGUgYXMgc3RyaW5nIHwgbnVsbCkgOiBudWxsKSxcbiAgICAgIHN0YXR1czogKG0uc3RhdHVzID8/IChleGlzdGluZyA/IGV4aXN0aW5nLnN0YXR1cyA6ICdwbGFubmVkJykpIGFzIFJlbGVhc2VbJ3N0YXR1cyddLFxuICAgICAgZ29hbHM6IG0uZ29hbHMgPz8gKGV4aXN0aW5nID8gU3RyaW5nKGV4aXN0aW5nLmdvYWxzKSA6ICcnKSxcbiAgICAgIG5vdGVzOiBtLm5vdGVzID8/IChleGlzdGluZyA/IFN0cmluZyhleGlzdGluZy5ub3RlcykgOiAnJyksXG4gICAgICBzYW1wbGU6IG0uc2FtcGxlID8/IChleGlzdGluZyA/IChOdW1iZXIoZXhpc3Rpbmcuc2FtcGxlKSBhcyAwIHwgMSkgOiAwKSxcbiAgICB9O1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLmRiXG4gICAgICAgIC5wcmVwYXJlKFxuICAgICAgICAgIGBJTlNFUlQgSU5UTyByZWxlYXNlcyhpZCwgbmFtZSwgdmVyc2lvbiwgdGFyZ2V0X2RhdGUsIHN0YXR1cywgZ29hbHMsIG5vdGVzLCBzYW1wbGUsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sMClcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoaWQpIERPIFVQREFURSBTRVQgbmFtZT0/LCB2ZXJzaW9uPT8sIHRhcmdldF9kYXRlPT8sIHN0YXR1cz0/LCBnb2Fscz0/LCBub3Rlcz0/LCBkZWxldGVkPTBgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4ocmVjLmlkLCByZWMubmFtZSwgcmVjLnZlcnNpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuZ29hbHMsIHJlYy5ub3RlcywgcmVjLnNhbXBsZSxcbiAgICAgICAgICAgICByZWMubmFtZSwgcmVjLnZlcnNpb24sIHJlYy50YXJnZXREYXRlLCByZWMuc3RhdHVzLCByZWMuZ29hbHMsIHJlYy5ub3Rlcyk7XG4gICAgICBpZiAoIWV4aXN0aW5nKSB0aGlzLmxvY2FsQ3JlYXRlKCdyZWxlYXNlJywgaWQsIHsgLi4ucmVjIH0pO1xuICAgICAgZWxzZSB0aGlzLmxvY2FsU2V0KCdyZWxlYXNlJywgaWQsIHsgbmFtZTogcmVjLm5hbWUsIHZlcnNpb246IHJlYy52ZXJzaW9uLCB0YXJnZXREYXRlOiByZWMudGFyZ2V0RGF0ZSwgc3RhdHVzOiByZWMuc3RhdHVzLCBnb2FsczogcmVjLmdvYWxzLCBub3RlczogcmVjLm5vdGVzIH0pO1xuICAgIH0pO1xuICAgIHR4KCk7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICdyZWxlYXNlJywgZW50aXR5SWQ6IGlkIH0pO1xuICAgIHJldHVybiByZWM7XG4gIH1cblxuICBsaXN0UmVsZWFzZXMoKTogUmVsZWFzZVtdIHtcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHJlbGVhc2VzIFdIRVJFIGRlbGV0ZWQ9MCBPUkRFUiBCWSB0YXJnZXRfZGF0ZScpLmFsbCgpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xuICAgICAgaWQ6IFN0cmluZyhyLmlkKSwgbmFtZTogU3RyaW5nKHIubmFtZSksIHZlcnNpb246IFN0cmluZyhyLnZlcnNpb24pLFxuICAgICAgdGFyZ2V0RGF0ZTogci50YXJnZXRfZGF0ZSA/IFN0cmluZyhyLnRhcmdldF9kYXRlKSA6IG51bGwsXG4gICAgICBzdGF0dXM6IHIuc3RhdHVzIGFzIFJlbGVhc2VbJ3N0YXR1cyddLCBnb2FsczogU3RyaW5nKHIuZ29hbHMpLCBub3RlczogU3RyaW5nKHIubm90ZXMpLFxuICAgICAgc2FtcGxlOiBOdW1iZXIoci5zYW1wbGUpIGFzIDAgfCAxLFxuICAgIH0pKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gc2F2ZWQgdmlld3MgLS0tLS0tLS0tLVxuICBzYXZlVmlldyh2OiBQYXJ0aWFsPFNhdmVkVmlldz4gJiB7IG5hbWU6IHN0cmluZzsgY29uZmlnOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB9KTogU2F2ZWRWaWV3IHtcbiAgICBjb25zdCBpZCA9IHYuaWQgPz8gY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgICBjb25zdCByZWM6IFNhdmVkVmlldyA9IHtcbiAgICAgIGlkLCBuYW1lOiB2Lm5hbWUsIGNvbmZpZzogdi5jb25maWcsIHBpbm5lZDogdi5waW5uZWQgPz8gMCxcbiAgICAgIGNyZWF0ZWRCeTogdGhpcy5hY3RvcklkLCBjcmVhdGVkQXQ6IHRoaXMubm93KCksXG4gICAgfTtcbiAgICB0aGlzLmRiXG4gICAgICAucHJlcGFyZShcbiAgICAgICAgYElOU0VSVCBJTlRPIHNhdmVkX3ZpZXdzKGlkLCBuYW1lLCBjb25maWcsIHBpbm5lZCwgY3JlYXRlZF9ieSwgY3JlYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LDApXG4gICAgICAgICBPTiBDT05GTElDVChpZCkgRE8gVVBEQVRFIFNFVCBuYW1lPT8sIGNvbmZpZz0/LCBwaW5uZWQ9PywgZGVsZXRlZD0wYCxcbiAgICAgIClcbiAgICAgIC5ydW4oaWQsIHJlYy5uYW1lLCBKU09OLnN0cmluZ2lmeShyZWMuY29uZmlnKSwgcmVjLnBpbm5lZCwgcmVjLmNyZWF0ZWRCeSwgcmVjLmNyZWF0ZWRBdCxcbiAgICAgICAgICAgcmVjLm5hbWUsIEpTT04uc3RyaW5naWZ5KHJlYy5jb25maWcpLCByZWMucGlubmVkKTtcbiAgICByZXR1cm4gcmVjO1xuICB9XG5cbiAgbGlzdFZpZXdzKCk6IFNhdmVkVmlld1tdIHtcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgKiBGUk9NIHNhdmVkX3ZpZXdzIFdIRVJFIGRlbGV0ZWQ9MCBPUkRFUiBCWSBwaW5uZWQgREVTQywgbmFtZScpLmFsbCgpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+W107XG4gICAgcmV0dXJuIHJvd3MubWFwKChyKSA9PiAoe1xuICAgICAgaWQ6IFN0cmluZyhyLmlkKSwgbmFtZTogU3RyaW5nKHIubmFtZSksXG4gICAgICBjb25maWc6IEpTT04ucGFyc2UoU3RyaW5nKHIuY29uZmlnKSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgICBwaW5uZWQ6IE51bWJlcihyLnBpbm5lZCkgYXMgMCB8IDEsIGNyZWF0ZWRCeTogU3RyaW5nKHIuY3JlYXRlZF9ieSksIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXG4gICAgfSkpO1xuICB9XG5cbiAgZGVsZXRlVmlldyhpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgc2F2ZWRfdmlld3MgU0VUIGRlbGV0ZWQ9MSBXSEVSRSBpZD0/JykucnVuKGlkKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gYWN0aXZpdHkgLS0tLS0tLS0tLVxuICBhY3Rpdml0eUZvcihpdGVtSWQ6IHN0cmluZyB8IG51bGwsIGxpbWl0ID0gMTAwKSB7XG4gICAgaWYgKGl0ZW1JZCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGJcbiAgICAgICAgLnByZXBhcmUoJ1NFTEVDVCBpZCwgaXRlbV9pZCBBUyBpdGVtSWQsIGFjdG9yX2lkIEFTIGFjdG9ySWQsIGtpbmQsIGZpZWxkLCBvbGRfdmFsdWUgQVMgb2xkVmFsdWUsIG5ld192YWx1ZSBBUyBuZXdWYWx1ZSwgYXQgRlJPTSBhY3Rpdml0eSBXSEVSRSBpdGVtX2lkPT8gT1JERVIgQlkgYXQgREVTQyBMSU1JVCA/JylcbiAgICAgICAgLmFsbChpdGVtSWQsIGxpbWl0KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgaWQsIGl0ZW1faWQgQVMgaXRlbUlkLCBhY3Rvcl9pZCBBUyBhY3RvcklkLCBraW5kLCBmaWVsZCwgb2xkX3ZhbHVlIEFTIG9sZFZhbHVlLCBuZXdfdmFsdWUgQVMgbmV3VmFsdWUsIGF0IEZST00gYWN0aXZpdHkgT1JERVIgQlkgYXQgREVTQyBMSU1JVCA/JylcbiAgICAgIC5hbGwobGltaXQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLSByZW1vdGUgb3AgYXBwbGljYXRpb24gLS0tLS0tLS0tLVxuICAvKiogQXBwbHkgYSBiYXRjaCBvZiByZW1vdGUgb3BzIGluc2lkZSBvbmUgdHJhbnNhY3Rpb24uIFJldHVybnMgY291bnQgYXBwbGllZCAobm9uLWR1cGxpY2F0ZSkuICovXG4gIGFwcGx5UmVtb3RlT3BzKG9wczogT3BbXSk6IG51bWJlciB7XG4gICAgbGV0IGFwcGxpZWQgPSAwO1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IG9wIG9mIG9wcykge1xuICAgICAgICBpZiAob3AuZGV2aWNlSWQgPT09IHRoaXMuZGV2aWNlSWQpIGNvbnRpbnVlOyAvLyBvdXIgb3duIG9wcyBlY2hvZWQgYmFja1xuICAgICAgICBjb25zdCBkdXAgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAxIEZST00gb3Bsb2cgV0hFUkUgb3BfaWQ9PycpLmdldChvcC5vcElkKTtcbiAgICAgICAgaWYgKGR1cCkgY29udGludWU7XG4gICAgICAgIHRoaXMud2l0bmVzc0xhbXBvcnQob3AubGFtcG9ydCk7XG4gICAgICAgIHRoaXMuYXBwZW5kT3Aob3ApO1xuICAgICAgICB0aGlzLmFwcGx5UmVtb3RlT3Aob3ApO1xuICAgICAgICBhcHBsaWVkKys7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdHgoKTtcbiAgICBpZiAoYXBwbGllZCA+IDApIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiAnKicsIGVudGl0eUlkOiAnKicgfSk7XG4gICAgcmV0dXJuIGFwcGxpZWQ7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UmVtb3RlT3Aob3A6IE9wKTogdm9pZCB7XG4gICAgc3dpdGNoIChvcC5hY3Rpb24pIHtcbiAgICAgIGNhc2UgJ2NyZWF0ZSc6XG4gICAgICAgIHRoaXMuYXBwbHlSZW1vdGVDcmVhdGUob3ApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3NldCc6XG4gICAgICAgIHRoaXMuYXBwbHlSZW1vdGVTZXQob3ApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2RlbGV0ZSc6XG4gICAgICAgIHRoaXMuYXBwbHlSZW1vdGVEZWxldGUob3ApO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHRhYmxlRm9yKGVudGl0eTogT3BbJ2VudGl0eSddKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKGVudGl0eSkge1xuICAgICAgY2FzZSAnaXRlbSc6IHJldHVybiAnaXRlbXMnO1xuICAgICAgY2FzZSAnbGluayc6IHJldHVybiAnbGlua3MnO1xuICAgICAgY2FzZSAnY29tbWVudCc6IHJldHVybiAnY29tbWVudHMnO1xuICAgICAgY2FzZSAnbWlsZXN0b25lJzogcmV0dXJuICdtaWxlc3RvbmVzJztcbiAgICAgIGNhc2UgJ3JlbGVhc2UnOiByZXR1cm4gJ3JlbGVhc2VzJztcbiAgICAgIGNhc2UgJ3VzZXInOiByZXR1cm4gJ3VzZXJzJztcbiAgICAgIGNhc2UgJ3NhdmVkX3ZpZXcnOiByZXR1cm4gJ3NhdmVkX3ZpZXdzJztcbiAgICAgIGNhc2UgJ2F0dGFjaG1lbnQnOiByZXR1cm4gJ2F0dGFjaG1lbnRzJztcbiAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgdW5rbm93biBlbnRpdHkgJHtlbnRpdHl9YCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVJlbW90ZUNyZWF0ZShvcDogT3ApOiB2b2lkIHtcbiAgICBjb25zdCByZWNvcmQgPSBvcC5wYXlsb2FkLnJlY29yZCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICBpZiAoIXJlY29yZCkgcmV0dXJuO1xuICAgIGNvbnN0IHRhYmxlID0gdGhpcy50YWJsZUZvcihvcC5lbnRpdHkpO1xuICAgIGNvbnN0IGV4aXN0cyA9IHRoaXMuZGIucHJlcGFyZShgU0VMRUNUIDEgRlJPTSAke3RhYmxlfSBXSEVSRSBpZD0/YCkuZ2V0KG9wLmVudGl0eUlkKTtcbiAgICBpZiAoZXhpc3RzKSByZXR1cm47IC8vIGNyZWF0ZSBpcyBpZGVtcG90ZW50IHBlciB1dWlkXG5cbiAgICBpZiAob3AuZW50aXR5ID09PSAnaXRlbScpIHtcbiAgICAgIGxldCBpdGVtID0geyAuLi4ocmVjb3JkIGFzIHVua25vd24gYXMgV29ya0l0ZW0pIH07XG4gICAgICAvLyBJZGVudCBjb2xsaXNpb246IGFub3RoZXIgaXRlbSAoZGlmZmVyZW50IHV1aWQpIGFscmVhZHkgaG9sZHMgdGhpcyBpZGVudC5cbiAgICAgIC8vIERldGVybWluaXN0aWMgcnVsZSBcdTIwMTQgdGhlIHNtYWxsZXIgdXVpZCBrZWVwcyB0aGUgY29udGVzdGVkIGlkZW50IFx1MjAxNCBzbyBib3RoXG4gICAgICAvLyBkZXZpY2VzIHJlc29sdmUgdGhlIHNhbWUgY29sbGlzaW9uIGlkZW50aWNhbGx5IGFuZCBjb252ZXJnZSB3aXRob3V0IHBpbmctcG9uZy5cbiAgICAgIGNvbnN0IGhvbGRlciA9IHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkLCB0eXBlIEZST00gaXRlbXMgV0hFUkUgaWRlbnQ9PycpLmdldChpdGVtLmlkZW50KSBhc1xuICAgICAgICB8IHsgaWQ6IHN0cmluZzsgdHlwZTogSXRlbVR5cGUgfVxuICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChob2xkZXIgJiYgaG9sZGVyLmlkICE9PSBpdGVtLmlkKSB7XG4gICAgICAgIGlmIChpdGVtLmlkIDwgaG9sZGVyLmlkKSB7XG4gICAgICAgICAgLy8gSW5jb21pbmcgaXRlbSBrZWVwcyB0aGUgaWRlbnQ7IHJlbnVtYmVyIHRoZSBsb2NhbCBob2xkZXIgYW5kIGJyb2FkY2FzdC5cbiAgICAgICAgICBjb25zdCBidW1wZWQgPSB0aGlzLmFsbG9jSWRlbnQoaG9sZGVyLnR5cGUpO1xuICAgICAgICAgIHRoaXMubG9nQWN0aXZpdHkoaG9sZGVyLmlkLCAncmVudW1iZXJlZCcsICdpZGVudCcsIGl0ZW0uaWRlbnQsIGJ1bXBlZCk7XG4gICAgICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoaG9sZGVyLmlkLCB7IGlkZW50OiBidW1wZWQgfSk7XG4gICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIGhvbGRlci5pZCwgeyBpZGVudDogYnVtcGVkIH0pO1xuICAgICAgICAgIHRoaXMuaW5zZXJ0SXRlbVJvdyhpdGVtKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBuZXdJZGVudCA9IHRoaXMuYWxsb2NJZGVudChpdGVtLnR5cGUpO1xuICAgICAgICAgIHRoaXMubG9nQWN0aXZpdHkoaXRlbS5pZCwgJ3JlbnVtYmVyZWQnLCAnaWRlbnQnLCBpdGVtLmlkZW50LCBuZXdJZGVudCk7XG4gICAgICAgICAgaXRlbSA9IHsgLi4uaXRlbSwgaWRlbnQ6IG5ld0lkZW50IH07XG4gICAgICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xuICAgICAgICAgIHRoaXMubG9jYWxTZXQoJ2l0ZW0nLCBpdGVtLmlkLCB7IGlkZW50OiBuZXdJZGVudCB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5pbnNlcnRJdGVtUm93KGl0ZW0pO1xuICAgICAgfVxuICAgICAgdGhpcy53aXRuZXNzSWRlbnQoaXRlbS50eXBlLCBpdGVtLmlkZW50KTtcbiAgICAgIGZvciAoY29uc3QgZiBvZiBPYmplY3Qua2V5cyhyZWNvcmQpKSB0aGlzLnNldEZpZWxkQ2xvY2soJ2l0ZW0nLCBpdGVtLmlkLCBmLCBvcC5sYW1wb3J0LCBvcC5kZXZpY2VJZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gR2VuZXJpYyBpbnNlcnQgZm9yIG90aGVyIGVudGl0aWVzLlxuICAgIGNvbnN0IGluc2VydGVyczogUmVjb3JkPHN0cmluZywgKCkgPT4gdm9pZD4gPSB7XG4gICAgICBsaW5rOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBJdGVtTGluayAmIHsgZGVsZXRlZD86IG51bWJlciB9O1xuICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyBsaW5rcyhpZCwgZnJvbV9pZCwgdG9faWQsIGtpbmQsIGRlbGV0ZWQsIGNyZWF0ZWRfYXQsIGNyZWF0ZWRfYnkpIFZBTFVFUyg/LD8sPyw/LD8sPyw/KScpXG4gICAgICAgICAgLnJ1bihyLmlkLCByLmZyb21JZCwgci50b0lkLCByLmtpbmQsIHIuZGVsZXRlZCA/PyAwLCByLmNyZWF0ZWRBdCwgci5jcmVhdGVkQnkpO1xuICAgICAgfSxcbiAgICAgIGNvbW1lbnQ6ICgpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHJlY29yZCBhcyB1bmtub3duIGFzIENvbW1lbnQ7XG4gICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIGNvbW1lbnRzKGlkLCBpdGVtX2lkLCBhdXRob3JfaWQsIGJvZHksIGJvZHlfdGV4dCwgY3JlYXRlZF9hdCwgdXBkYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyknKVxuICAgICAgICAgIC5ydW4oci5pZCwgci5pdGVtSWQsIHIuYXV0aG9ySWQsIHIuYm9keSwgci5ib2R5VGV4dCwgci5jcmVhdGVkQXQsIHIudXBkYXRlZEF0LCByLmRlbGV0ZWQgPz8gMCk7XG4gICAgICB9LFxuICAgICAgbWlsZXN0b25lOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBNaWxlc3RvbmU7XG4gICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIG1pbGVzdG9uZXMoaWQsIG5hbWUsIGRlc2NyaXB0aW9uLCB0YXJnZXRfZGF0ZSwgc3RhdHVzLCBzb3J0LCBzYW1wbGUsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LDApJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgci5kZXNjcmlwdGlvbiwgci50YXJnZXREYXRlLCByLnN0YXR1cywgci5zb3J0LCByLnNhbXBsZSA/PyAwKTtcbiAgICAgIH0sXG4gICAgICByZWxlYXNlOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZWNvcmQgYXMgdW5rbm93biBhcyBSZWxlYXNlO1xuICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgLnByZXBhcmUoJ0lOU0VSVCBPUiBJR05PUkUgSU5UTyByZWxlYXNlcyhpZCwgbmFtZSwgdmVyc2lvbiwgdGFyZ2V0X2RhdGUsIHN0YXR1cywgZ29hbHMsIG5vdGVzLCBzYW1wbGUsIGRlbGV0ZWQpIFZBTFVFUyg/LD8sPyw/LD8sPyw/LD8sMCknKVxuICAgICAgICAgIC5ydW4oci5pZCwgci5uYW1lLCByLnZlcnNpb24sIHIudGFyZ2V0RGF0ZSwgci5zdGF0dXMsIHIuZ29hbHMsIHIubm90ZXMsIHIuc2FtcGxlID8/IDApO1xuICAgICAgfSxcbiAgICAgIHVzZXI6ICgpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHJlY29yZCBhcyB1bmtub3duIGFzIFVzZXI7XG4gICAgICAgIHRoaXMuZGJcbiAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIE9SIElHTk9SRSBJTlRPIHVzZXJzKGlkLCBuYW1lLCBpbml0aWFscywgY29sb3IsIGNyZWF0ZWRfYXQpIFZBTFVFUyg/LD8sPyw/LD8pJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIubmFtZSwgci5pbml0aWFscywgci5jb2xvciwgci5jcmVhdGVkQXQpO1xuICAgICAgfSxcbiAgICAgIHNhdmVkX3ZpZXc6ICgpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHJlY29yZCBhcyB1bmtub3duIGFzIFNhdmVkVmlldztcbiAgICAgICAgdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gc2F2ZWRfdmlld3MoaWQsIG5hbWUsIGNvbmZpZywgcGlubmVkLCBjcmVhdGVkX2J5LCBjcmVhdGVkX2F0LCBkZWxldGVkKSBWQUxVRVMoPyw/LD8sPyw/LD8sMCknKVxuICAgICAgICAgIC5ydW4oci5pZCwgci5uYW1lLCBKU09OLnN0cmluZ2lmeShyLmNvbmZpZyksIHIucGlubmVkLCByLmNyZWF0ZWRCeSwgci5jcmVhdGVkQXQpO1xuICAgICAgfSxcbiAgICAgIGF0dGFjaG1lbnQ6ICgpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHJlY29yZCBhcyB1bmtub3duIGFzIGltcG9ydCgnLi4vLi4vc2hhcmVkL3R5cGVzJykuQXR0YWNobWVudDtcbiAgICAgICAgdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKCdJTlNFUlQgT1IgSUdOT1JFIElOVE8gYXR0YWNobWVudHMoaWQsIGl0ZW1faWQsIGZpbGVuYW1lLCBtaW1lLCBzaXplLCBzaGEyNTYsIGRlc2NyaXB0aW9uLCB1cGxvYWRlZF9ieSwgY3JlYXRlZF9hdCwgZGVsZXRlZCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyw/LD8pJylcbiAgICAgICAgICAucnVuKHIuaWQsIHIuaXRlbUlkLCByLmZpbGVuYW1lLCByLm1pbWUsIHIuc2l6ZSwgci5zaGEyNTYsIHIuZGVzY3JpcHRpb24sIHIudXBsb2FkZWRCeSwgci5jcmVhdGVkQXQsIHIuZGVsZXRlZCA/PyAwKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgICBpbnNlcnRlcnNbb3AuZW50aXR5XT8uKCk7XG4gICAgZm9yIChjb25zdCBmIG9mIE9iamVjdC5rZXlzKHJlY29yZCkpIHRoaXMuc2V0RmllbGRDbG9jayhvcC5lbnRpdHksIG9wLmVudGl0eUlkLCBmLCBvcC5sYW1wb3J0LCBvcC5kZXZpY2VJZCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UmVtb3RlU2V0KG9wOiBPcCk6IHZvaWQge1xuICAgIGNvbnN0IGZpZWxkcyA9IChvcC5wYXlsb2FkLmZpZWxkcyA/PyB7fSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgY29uc3QgYmFzZWRPbiA9IChvcC5wYXlsb2FkLmJhc2VkT24gPz8ge30pIGFzIFJlY29yZDxzdHJpbmcsIHsgbGFtcG9ydDogbnVtYmVyOyBkZXZpY2VJZDogc3RyaW5nIH0gfCBudWxsPjtcbiAgICBjb25zdCB3aW5uaW5nOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBbZmllbGQsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XG4gICAgICBjb25zdCBsb2NhbCA9IHRoaXMuZmllbGRDbG9jayhvcC5lbnRpdHksIG9wLmVudGl0eUlkLCBmaWVsZCk7XG4gICAgICBjb25zdCBiYXNlID0gYmFzZWRPbltmaWVsZF0gPz8gbnVsbDtcblxuICAgICAgbGV0IHJlbW90ZVdpbnM6IGJvb2xlYW47XG4gICAgICBsZXQgY29uY3VycmVudCA9IGZhbHNlO1xuICAgICAgaWYgKCFsb2NhbCkge1xuICAgICAgICByZW1vdGVXaW5zID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoYmFzZSAmJiBiYXNlLmxhbXBvcnQgPT09IGxvY2FsLmxhbXBvcnQgJiYgYmFzZS5kZXZpY2VJZCA9PT0gbG9jYWwuZGV2aWNlSWQpIHtcbiAgICAgICAgcmVtb3RlV2lucyA9IHRydWU7IC8vIGNsZWFuIGNhdXNhbCB1cGRhdGU6IHJlbW90ZSBzYXcgZXhhY3RseSBvdXIgY3VycmVudCB2YWx1ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uY3VycmVudCA9IHRydWU7XG4gICAgICAgIHJlbW90ZVdpbnMgPSBvcC5sYW1wb3J0ID4gbG9jYWwubGFtcG9ydCB8fCAob3AubGFtcG9ydCA9PT0gbG9jYWwubGFtcG9ydCAmJiBvcC5kZXZpY2VJZCA+IGxvY2FsLmRldmljZUlkKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmN1cnJlbnQgJiYgQ09ORkxJQ1RfU1VSRkFDRURfRklFTERTLmhhcyhmaWVsZCkgJiYgb3AuZW50aXR5ID09PSAnaXRlbScpIHtcbiAgICAgICAgY29uc3QgY3VyID0gdGhpcy5kYlxuICAgICAgICAgIC5wcmVwYXJlKGBTRUxFQ1QgJHtJVEVNX0NPTFNbZmllbGRdfSBBUyB2IEZST00gaXRlbXMgV0hFUkUgaWQ9P2ApXG4gICAgICAgICAgLmdldChvcC5lbnRpdHlJZCkgYXMgeyB2OiB1bmtub3duIH0gfCB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnN0IGxvY2FsVmFsID0gY3VyID8gU3RyaW5nKGN1ci52ID8/ICcnKSA6ICcnO1xuICAgICAgICBjb25zdCByZW1vdGVWYWwgPSBTdHJpbmcodmFsdWUgPz8gJycpO1xuICAgICAgICBpZiAobG9jYWxWYWwgIT09IHJlbW90ZVZhbCkge1xuICAgICAgICAgIGNvbnN0IGNvbmZsaWN0OiBTeW5jQ29uZmxpY3QgPSB7XG4gICAgICAgICAgICBpZDogY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICAgICAgICAgIGVudGl0eTogb3AuZW50aXR5LFxuICAgICAgICAgICAgZW50aXR5SWQ6IG9wLmVudGl0eUlkLFxuICAgICAgICAgICAgZmllbGQsXG4gICAgICAgICAgICBsb2NhbFZhbHVlOiBsb2NhbFZhbCxcbiAgICAgICAgICAgIHJlbW90ZVZhbHVlOiByZW1vdGVWYWwsXG4gICAgICAgICAgICByZW1vdGVEZXZpY2U6IG9wLmRldmljZUlkLFxuICAgICAgICAgICAgcmVtb3RlQWN0b3I6IG9wLmFjdG9ySWQsXG4gICAgICAgICAgICBkZXRlY3RlZEF0OiB0aGlzLm5vdygpLFxuICAgICAgICAgICAgcmVzb2x2ZWRBdDogbnVsbCxcbiAgICAgICAgICAgIHJlc29sdXRpb246IG51bGwsXG4gICAgICAgICAgfTtcbiAgICAgICAgICB0aGlzLmRiXG4gICAgICAgICAgICAucHJlcGFyZSgnSU5TRVJUIElOVE8gc3luY19jb25mbGljdHMoaWQsIGVudGl0eSwgZW50aXR5X2lkLCBmaWVsZCwgbG9jYWxfdmFsdWUsIHJlbW90ZV92YWx1ZSwgcmVtb3RlX2RldmljZSwgcmVtb3RlX2FjdG9yLCBkZXRlY3RlZF9hdCkgVkFMVUVTKD8sPyw/LD8sPyw/LD8sPyw/KScpXG4gICAgICAgICAgICAucnVuKGNvbmZsaWN0LmlkLCBjb25mbGljdC5lbnRpdHksIGNvbmZsaWN0LmVudGl0eUlkLCBjb25mbGljdC5maWVsZCwgY29uZmxpY3QubG9jYWxWYWx1ZSwgY29uZmxpY3QucmVtb3RlVmFsdWUsIGNvbmZsaWN0LnJlbW90ZURldmljZSwgY29uZmxpY3QucmVtb3RlQWN0b3IsIGNvbmZsaWN0LmRldGVjdGVkQXQpO1xuICAgICAgICAgIHRoaXMuZXZlbnRzLm9uQ29uZmxpY3QoY29uZmxpY3QpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChyZW1vdGVXaW5zKSB7XG4gICAgICAgIHdpbm5pbmdbZmllbGRdID0gdmFsdWU7XG4gICAgICAgIHRoaXMuc2V0RmllbGRDbG9jayhvcC5lbnRpdHksIG9wLmVudGl0eUlkLCBmaWVsZCwgb3AubGFtcG9ydCwgb3AuZGV2aWNlSWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChPYmplY3Qua2V5cyh3aW5uaW5nKS5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIGlmIChvcC5lbnRpdHkgPT09ICdpdGVtJykge1xuICAgICAgLy8gSWRlbnQgc2V0IG1heSBjb2xsaWRlIGxvY2FsbHkgXHUyMDE0IHJlc29sdmUgd2l0aCB0aGUgc2FtZSBzbWFsbGVyLXV1aWQta2VlcHMgcnVsZS5cbiAgICAgIGlmICgnaWRlbnQnIGluIHdpbm5pbmcpIHtcbiAgICAgICAgY29uc3QgaG9sZGVyID0gdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaWQsIHR5cGUgRlJPTSBpdGVtcyBXSEVSRSBpZGVudD0/JykuZ2V0KFN0cmluZyh3aW5uaW5nLmlkZW50KSkgYXNcbiAgICAgICAgICB8IHsgaWQ6IHN0cmluZzsgdHlwZTogSXRlbVR5cGUgfVxuICAgICAgICAgIHwgdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCBjdXIgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCB0eXBlIEZST00gaXRlbXMgV0hFUkUgaWQ9PycpLmdldChvcC5lbnRpdHlJZCkgYXMgeyB0eXBlOiBJdGVtVHlwZSB9IHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAoaG9sZGVyICYmIGhvbGRlci5pZCAhPT0gb3AuZW50aXR5SWQgJiYgY3VyKSB7XG4gICAgICAgICAgaWYgKG9wLmVudGl0eUlkIDwgaG9sZGVyLmlkKSB7XG4gICAgICAgICAgICBjb25zdCBidW1wZWQgPSB0aGlzLmFsbG9jSWRlbnQoaG9sZGVyLnR5cGUpO1xuICAgICAgICAgICAgdGhpcy5sb2dBY3Rpdml0eShob2xkZXIuaWQsICdyZW51bWJlcmVkJywgJ2lkZW50JywgU3RyaW5nKHdpbm5pbmcuaWRlbnQpLCBidW1wZWQpO1xuICAgICAgICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoaG9sZGVyLmlkLCB7IGlkZW50OiBidW1wZWQgfSk7XG4gICAgICAgICAgICB0aGlzLmxvY2FsU2V0KCdpdGVtJywgaG9sZGVyLmlkLCB7IGlkZW50OiBidW1wZWQgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1bXBlZCA9IHRoaXMuYWxsb2NJZGVudChjdXIudHlwZSk7XG4gICAgICAgICAgICB3aW5uaW5nLmlkZW50ID0gYnVtcGVkO1xuICAgICAgICAgICAgdGhpcy5sb2NhbFNldCgnaXRlbScsIG9wLmVudGl0eUlkLCB7IGlkZW50OiBidW1wZWQgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGN1cikge1xuICAgICAgICAgIHRoaXMud2l0bmVzc0lkZW50KGN1ci50eXBlLCBTdHJpbmcod2lubmluZy5pZGVudCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmFwcGx5SXRlbUZpZWxkcyhvcC5lbnRpdHlJZCwgd2lubmluZyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gR2VuZXJpYyBjb2x1bW4gdXBkYXRlIGZvciBvdGhlciBlbnRpdGllcy5cbiAgICBjb25zdCBjb2xNYXA6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHN0cmluZz4+ID0ge1xuICAgICAgbGluazogeyBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICAgIGNvbW1lbnQ6IHsgYm9keTogJ2JvZHknLCBib2R5VGV4dDogJ2JvZHlfdGV4dCcsIHVwZGF0ZWRBdDogJ3VwZGF0ZWRfYXQnLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICAgIG1pbGVzdG9uZTogeyBuYW1lOiAnbmFtZScsIGRlc2NyaXB0aW9uOiAnZGVzY3JpcHRpb24nLCB0YXJnZXREYXRlOiAndGFyZ2V0X2RhdGUnLCBzdGF0dXM6ICdzdGF0dXMnLCBzb3J0OiAnc29ydCcsIGRlbGV0ZWQ6ICdkZWxldGVkJyB9LFxuICAgICAgcmVsZWFzZTogeyBuYW1lOiAnbmFtZScsIHZlcnNpb246ICd2ZXJzaW9uJywgdGFyZ2V0RGF0ZTogJ3RhcmdldF9kYXRlJywgc3RhdHVzOiAnc3RhdHVzJywgZ29hbHM6ICdnb2FscycsIG5vdGVzOiAnbm90ZXMnLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICAgIHVzZXI6IHsgbmFtZTogJ25hbWUnLCBpbml0aWFsczogJ2luaXRpYWxzJywgY29sb3I6ICdjb2xvcicgfSxcbiAgICAgIHNhdmVkX3ZpZXc6IHsgbmFtZTogJ25hbWUnLCBjb25maWc6ICdjb25maWcnLCBwaW5uZWQ6ICdwaW5uZWQnLCBkZWxldGVkOiAnZGVsZXRlZCcgfSxcbiAgICAgIGF0dGFjaG1lbnQ6IHsgZGVzY3JpcHRpb246ICdkZXNjcmlwdGlvbicsIGRlbGV0ZWQ6ICdkZWxldGVkJyB9LFxuICAgIH07XG4gICAgY29uc3QgbWFwID0gY29sTWFwW29wLmVudGl0eV07XG4gICAgaWYgKCFtYXApIHJldHVybjtcbiAgICBjb25zdCBzZXRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHZhbHM6IHVua25vd25bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKHdpbm5pbmcpKSB7XG4gICAgICBjb25zdCBjb2wgPSBtYXBba107XG4gICAgICBpZiAoIWNvbCkgY29udGludWU7XG4gICAgICBzZXRzLnB1c2goYCR7Y29sfT0/YCk7XG4gICAgICB2YWxzLnB1c2goayA9PT0gJ2NvbmZpZycgPyBKU09OLnN0cmluZ2lmeSh2KSA6IHYpO1xuICAgIH1cbiAgICBpZiAoIXNldHMubGVuZ3RoKSByZXR1cm47XG4gICAgdmFscy5wdXNoKG9wLmVudGl0eUlkKTtcbiAgICB0aGlzLmRiLnByZXBhcmUoYFVQREFURSAke3RoaXMudGFibGVGb3Iob3AuZW50aXR5KX0gU0VUICR7c2V0cy5qb2luKCcsICcpfSBXSEVSRSBpZD0/YCkucnVuKC4uLnZhbHMpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVJlbW90ZURlbGV0ZShvcDogT3ApOiB2b2lkIHtcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMudGFibGVGb3Iob3AuZW50aXR5KTtcbiAgICB0aGlzLmRiLnByZXBhcmUoYFVQREFURSAke3RhYmxlfSBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT9gKS5ydW4ob3AuZW50aXR5SWQpO1xuICAgIHRoaXMuc2V0RmllbGRDbG9jayhvcC5lbnRpdHksIG9wLmVudGl0eUlkLCAnZGVsZXRlZCcsIG9wLmxhbXBvcnQsIG9wLmRldmljZUlkKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gY29uZmxpY3RzIC0tLS0tLS0tLS1cbiAgbGlzdENvbmZsaWN0cyhvcGVuT25seSA9IHRydWUpOiBTeW5jQ29uZmxpY3RbXSB7XG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZGJcbiAgICAgIC5wcmVwYXJlKGBTRUxFQ1QgKiBGUk9NIHN5bmNfY29uZmxpY3RzICR7b3Blbk9ubHkgPyAnV0hFUkUgcmVzb2x2ZWRfYXQgSVMgTlVMTCcgOiAnJ30gT1JERVIgQlkgZGV0ZWN0ZWRfYXQgREVTQ2ApXG4gICAgICAuYWxsKCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXTtcbiAgICByZXR1cm4gcm93cy5tYXAoKHIpID0+ICh7XG4gICAgICBpZDogU3RyaW5nKHIuaWQpLCBlbnRpdHk6IFN0cmluZyhyLmVudGl0eSksIGVudGl0eUlkOiBTdHJpbmcoci5lbnRpdHlfaWQpLCBmaWVsZDogU3RyaW5nKHIuZmllbGQpLFxuICAgICAgbG9jYWxWYWx1ZTogU3RyaW5nKHIubG9jYWxfdmFsdWUpLCByZW1vdGVWYWx1ZTogU3RyaW5nKHIucmVtb3RlX3ZhbHVlKSxcbiAgICAgIHJlbW90ZURldmljZTogU3RyaW5nKHIucmVtb3RlX2RldmljZSksIHJlbW90ZUFjdG9yOiBTdHJpbmcoci5yZW1vdGVfYWN0b3IpLFxuICAgICAgZGV0ZWN0ZWRBdDogU3RyaW5nKHIuZGV0ZWN0ZWRfYXQpLFxuICAgICAgcmVzb2x2ZWRBdDogci5yZXNvbHZlZF9hdCA/IFN0cmluZyhyLnJlc29sdmVkX2F0KSA6IG51bGwsXG4gICAgICByZXNvbHV0aW9uOiAoci5yZXNvbHV0aW9uIGFzIFN5bmNDb25mbGljdFsncmVzb2x1dGlvbiddKSA/PyBudWxsLFxuICAgIH0pKTtcbiAgfVxuXG4gIHJlc29sdmVDb25mbGljdChpZDogc3RyaW5nLCByZXNvbHV0aW9uOiAnbG9jYWwnIHwgJ3JlbW90ZScgfCAnbWVyZ2VkJywgbWVyZ2VkVmFsdWU/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCByb3cgPSB0aGlzLmRiLnByZXBhcmUoJ1NFTEVDVCAqIEZST00gc3luY19jb25mbGljdHMgV0hFUkUgaWQ9PycpLmdldChpZCkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQ7XG4gICAgaWYgKCFyb3cpIHJldHVybjtcbiAgICBjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oKCkgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPVxuICAgICAgICByZXNvbHV0aW9uID09PSAnbWVyZ2VkJyA/IChtZXJnZWRWYWx1ZSA/PyAnJykgOiByZXNvbHV0aW9uID09PSAnbG9jYWwnID8gU3RyaW5nKHJvdy5sb2NhbF92YWx1ZSkgOiBTdHJpbmcocm93LnJlbW90ZV92YWx1ZSk7XG4gICAgICBpZiAoU3RyaW5nKHJvdy5lbnRpdHkpID09PSAnaXRlbScpIHtcbiAgICAgICAgY29uc3QgZmllbGQgPSBTdHJpbmcocm93LmZpZWxkKTtcbiAgICAgICAgdGhpcy5hcHBseUl0ZW1GaWVsZHMoU3RyaW5nKHJvdy5lbnRpdHlfaWQpLCB7IFtmaWVsZF06IHZhbHVlLCB1cGRhdGVkQXQ6IHRoaXMubm93KCksIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH0pO1xuICAgICAgICB0aGlzLmxvY2FsU2V0KCdpdGVtJywgU3RyaW5nKHJvdy5lbnRpdHlfaWQpLCB7IFtmaWVsZF06IHZhbHVlLCB1cGRhdGVkQXQ6IHRoaXMubm93KCksIHVwZGF0ZWRCeTogdGhpcy5hY3RvcklkIH0pO1xuICAgICAgfVxuICAgICAgdGhpcy5kYi5wcmVwYXJlKCdVUERBVEUgc3luY19jb25mbGljdHMgU0VUIHJlc29sdmVkX2F0PT8sIHJlc29sdXRpb249PyBXSEVSRSBpZD0/JykucnVuKHRoaXMubm93KCksIHJlc29sdXRpb24sIGlkKTtcbiAgICB9KTtcbiAgICB0eCgpO1xuICAgIHRoaXMuZXZlbnRzLm9uQ2hhbmdlKHsgZW50aXR5OiBTdHJpbmcocm93LmVudGl0eSksIGVudGl0eUlkOiBTdHJpbmcocm93LmVudGl0eV9pZCkgfSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIHN5bmMgZXhwb3J0IGhlbHBlcnMgLS0tLS0tLS0tLVxuICBvcHNTaW5jZShzZXE6IG51bWJlciwgb3duT25seSA9IHRydWUpOiB7IHNlcTogbnVtYmVyOyBvcDogT3AgfVtdIHtcbiAgICBjb25zdCByb3dzID0gdGhpcy5kYlxuICAgICAgLnByZXBhcmUoXG4gICAgICAgIGBTRUxFQ1Qgc2VxLCBvcF9pZCwgZGV2aWNlX2lkLCBhY3Rvcl9pZCwgbGFtcG9ydCwgYXQsIGVudGl0eSwgZW50aXR5X2lkLCBhY3Rpb24sIHBheWxvYWRcbiAgICAgICAgIEZST00gb3Bsb2cgV0hFUkUgc2VxID4gPyAke293bk9ubHkgPyAnQU5EIGRldmljZV9pZCA9ID8nIDogJyd9IE9SREVSIEJZIHNlcSBBU0NgLFxuICAgICAgKVxuICAgICAgLmFsbCguLi4ob3duT25seSA/IFtzZXEsIHRoaXMuZGV2aWNlSWRdIDogW3NlcV0pKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdO1xuICAgIHJldHVybiByb3dzLm1hcCgocikgPT4gKHtcbiAgICAgIHNlcTogTnVtYmVyKHIuc2VxKSxcbiAgICAgIG9wOiB7XG4gICAgICAgIG9wSWQ6IFN0cmluZyhyLm9wX2lkKSwgZGV2aWNlSWQ6IFN0cmluZyhyLmRldmljZV9pZCksIGFjdG9ySWQ6IFN0cmluZyhyLmFjdG9yX2lkKSxcbiAgICAgICAgbGFtcG9ydDogTnVtYmVyKHIubGFtcG9ydCksIGF0OiBTdHJpbmcoci5hdCksIGVudGl0eTogci5lbnRpdHkgYXMgT3BbJ2VudGl0eSddLFxuICAgICAgICBlbnRpdHlJZDogU3RyaW5nKHIuZW50aXR5X2lkKSwgYWN0aW9uOiByLmFjdGlvbiBhcyBPcFsnYWN0aW9uJ10sXG4gICAgICAgIHBheWxvYWQ6IEpTT04ucGFyc2UoU3RyaW5nKHIucGF5bG9hZCkpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgICAgfSxcbiAgICB9KSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIHNhbXBsZSBkYXRhIC0tLS0tLS0tLS1cbiAgcmVtb3ZlU2FtcGxlRGF0YSgpOiBudW1iZXIge1xuICAgIGNvbnN0IHR4ID0gdGhpcy5kYi50cmFuc2FjdGlvbigoKSA9PiB7XG4gICAgICBjb25zdCBpZHMgPSAodGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaWQgRlJPTSBpdGVtcyBXSEVSRSBzYW1wbGU9MSBBTkQgZGVsZXRlZD0wJykuYWxsKCkgYXMgeyBpZDogc3RyaW5nIH1bXSkubWFwKChyKSA9PiByLmlkKTtcbiAgICAgIGZvciAoY29uc3QgaWQgb2YgaWRzKSB0aGlzLmRlbGV0ZUl0ZW0oaWQpO1xuICAgICAgZm9yIChjb25zdCBtIG9mIHRoaXMuZGIucHJlcGFyZSgnU0VMRUNUIGlkIEZST00gbWlsZXN0b25lcyBXSEVSRSBzYW1wbGU9MSBBTkQgZGVsZXRlZD0wJykuYWxsKCkgYXMgeyBpZDogc3RyaW5nIH1bXSkge1xuICAgICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSBtaWxlc3RvbmVzIFNFVCBkZWxldGVkPTEgV0hFUkUgaWQ9PycpLnJ1bihtLmlkKTtcbiAgICAgICAgdGhpcy5sb2NhbFNldCgnbWlsZXN0b25lJywgbS5pZCwgeyBkZWxldGVkOiAxIH0pO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCByZWwgb2YgdGhpcy5kYi5wcmVwYXJlKCdTRUxFQ1QgaWQgRlJPTSByZWxlYXNlcyBXSEVSRSBzYW1wbGU9MSBBTkQgZGVsZXRlZD0wJykuYWxsKCkgYXMgeyBpZDogc3RyaW5nIH1bXSkge1xuICAgICAgICB0aGlzLmRiLnByZXBhcmUoJ1VQREFURSByZWxlYXNlcyBTRVQgZGVsZXRlZD0xIFdIRVJFIGlkPT8nKS5ydW4ocmVsLmlkKTtcbiAgICAgICAgdGhpcy5sb2NhbFNldCgncmVsZWFzZScsIHJlbC5pZCwgeyBkZWxldGVkOiAxIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGlkcy5sZW5ndGg7XG4gICAgfSk7XG4gICAgY29uc3QgbiA9IHR4KCk7XG4gICAgdGhpcy5ldmVudHMub25DaGFuZ2UoeyBlbnRpdHk6ICcqJywgZW50aXR5SWQ6ICcqJyB9KTtcbiAgICByZXR1cm4gbjtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tIHJvdyBtYXBwZXJzIC0tLS0tLS0tLS1cbmV4cG9ydCBmdW5jdGlvbiByb3dUb0l0ZW0ocjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBXb3JrSXRlbSB7XG4gIHJldHVybiB7XG4gICAgaWQ6IFN0cmluZyhyLmlkKSxcbiAgICBpZGVudDogU3RyaW5nKHIuaWRlbnQpLFxuICAgIHR5cGU6IHIudHlwZSBhcyBJdGVtVHlwZSxcbiAgICB0aXRsZTogU3RyaW5nKHIudGl0bGUpLFxuICAgIGJvZHk6IFN0cmluZyhyLmJvZHkpLFxuICAgIGJvZHlUZXh0OiBTdHJpbmcoci5ib2R5X3RleHQpLFxuICAgIHN0YXR1czogU3RyaW5nKHIuc3RhdHVzKSxcbiAgICBwcmlvcml0eTogci5wcmlvcml0eSBhcyBXb3JrSXRlbVsncHJpb3JpdHknXSxcbiAgICBvd25lcklkOiAoci5vd25lcl9pZCBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxuICAgIHJlcG9ydGVySWQ6IChyLnJlcG9ydGVyX2lkIGFzIHN0cmluZyB8IG51bGwpID8/IG51bGwsXG4gICAgbWlsZXN0b25lSWQ6IChyLm1pbGVzdG9uZV9pZCBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxuICAgIHJlbGVhc2VJZDogKHIucmVsZWFzZV9pZCBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxuICAgIHBhcmVudElkOiAoci5wYXJlbnRfaWQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBzdGFydERhdGU6IChyLnN0YXJ0X2RhdGUgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBkdWVEYXRlOiAoci5kdWVfZGF0ZSBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxuICAgIGNvbXBsZXRlZEF0OiAoci5jb21wbGV0ZWRfYXQgYXMgc3RyaW5nIHwgbnVsbCkgPz8gbnVsbCxcbiAgICBlZmZvcnQ6IHIuZWZmb3J0ID09IG51bGwgPyBudWxsIDogTnVtYmVyKHIuZWZmb3J0KSxcbiAgICBjb25maWRlbmNlOiAoci5jb25maWRlbmNlIGFzIFdvcmtJdGVtWydjb25maWRlbmNlJ10pID8/IG51bGwsXG4gICAgcmlza0xldmVsOiAoci5yaXNrX2xldmVsIGFzIFdvcmtJdGVtWydyaXNrTGV2ZWwnXSkgPz8gbnVsbCxcbiAgICBidXNpbmVzc1ZhbHVlOiAoci5idXNpbmVzc192YWx1ZSBhcyBzdHJpbmcgfCBudWxsKSA/PyBudWxsLFxuICAgIGxlYWRlcnNoaXBWaXNpYmxlOiBOdW1iZXIoci5sZWFkZXJzaGlwX3Zpc2libGUpIGFzIDAgfCAxLFxuICAgIHByb2dyZXNzOiByLnByb2dyZXNzID09IG51bGwgPyBudWxsIDogTnVtYmVyKHIucHJvZ3Jlc3MpLFxuICAgIHRhZ3M6IHNhZmVQYXJzZShTdHJpbmcoci50YWdzKSwgW10pIGFzIHN0cmluZ1tdLFxuICAgIGV4dHJhOiBzYWZlUGFyc2UoU3RyaW5nKHIuZXh0cmEpLCB7fSkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgYXJjaGl2ZWQ6IE51bWJlcihyLmFyY2hpdmVkKSBhcyAwIHwgMSxcbiAgICBzYW1wbGU6IE51bWJlcihyLnNhbXBsZSkgYXMgMCB8IDEsXG4gICAgY3JlYXRlZEF0OiBTdHJpbmcoci5jcmVhdGVkX2F0KSxcbiAgICB1cGRhdGVkQXQ6IFN0cmluZyhyLnVwZGF0ZWRfYXQpLFxuICAgIGNyZWF0ZWRCeTogU3RyaW5nKHIuY3JlYXRlZF9ieSksXG4gICAgdXBkYXRlZEJ5OiBTdHJpbmcoci51cGRhdGVkX2J5KSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gcm93VG9MaW5rKHI6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogSXRlbUxpbmsge1xuICByZXR1cm4ge1xuICAgIGlkOiBTdHJpbmcoci5pZCksXG4gICAgZnJvbUlkOiBTdHJpbmcoci5mcm9tX2lkKSxcbiAgICB0b0lkOiBTdHJpbmcoci50b19pZCksXG4gICAga2luZDogci5raW5kIGFzIExpbmtLaW5kLFxuICAgIGNyZWF0ZWRBdDogU3RyaW5nKHIuY3JlYXRlZF9hdCksXG4gICAgY3JlYXRlZEJ5OiBTdHJpbmcoci5jcmVhdGVkX2J5KSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gc2FmZVBhcnNlKHM6IHN0cmluZywgZmFsbGJhY2s6IHVua25vd24pOiB1bmtub3duIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShzKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG59XG5cbi8qKiBDb252ZXJ0IGZyZWUgdGV4dCB0byBhIHNhZmUgRlRTNSBwcmVmaXggcXVlcnkuICovXG5leHBvcnQgZnVuY3Rpb24gZnRzUXVlcnkodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdGVybXMgPSB0ZXh0XG4gICAgLnJlcGxhY2UoL1snXCIqKCldL2csICcgJylcbiAgICAuc3BsaXQoL1xccysvKVxuICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAubWFwKCh0KSA9PiBgXCIke3R9XCIqYCk7XG4gIHJldHVybiB0ZXJtcy5qb2luKCcgJykgfHwgJ1wiXCInO1xufVxuIiwgIi8vIFNoYXJlZCBkb21haW4gdHlwZXMgXHUyMDE0IHNpbmdsZSBzb3VyY2Ugb2YgdHJ1dGggZm9yIG1haW4gcHJvY2VzcyBhbmQgcmVuZGVyZXIuXG5cbi8vIC0tLS0tLS0tLS0gVGVybWlub2xvZ3kgLS0tLS0tLS0tLVxuLy8gVW1icmVsbGEgbm91bjogXCJXb3JrIEl0ZW1cIi4gRXZlcnkgdHJhY2tlZCByZWNvcmQgaXMgYSB3b3JrIGl0ZW0gd2l0aCBhIHR5cGUuXG4vLyBJZGVudHMgYXJlIHBlci10eXBlIHNlcXVlbmNlczogVEFTSy0xMiwgRkVBVC0zLCBSRVEtNDEsIERFQy0xMiwgUklTSy04LCBCTEstMixcbi8vIEFDQy01LCBNVEctMTQsIElERUEtNywgUS0zLCBERUYtMSwgUkVTLTQuXG5cbmV4cG9ydCBjb25zdCBJVEVNX1RZUEVTID0gW1xuICAndGFzaycsXG4gICdmZWF0dXJlJyxcbiAgJ3JlcXVpcmVtZW50JyxcbiAgJ3N0b3J5JyxcbiAgJ2RlY2lzaW9uJyxcbiAgJ3Jpc2snLFxuICAnYmxvY2tlcicsXG4gICdhY2Nlc3MnLFxuICAnbWVldGluZycsXG4gICdpZGVhJyxcbiAgJ3F1ZXN0aW9uJyxcbiAgJ2RlZmVjdCcsXG4gICdyZXNlYXJjaCcsXG5dIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgSXRlbVR5cGUgPSAodHlwZW9mIElURU1fVFlQRVMpW251bWJlcl07XG5cbmV4cG9ydCBjb25zdCBJREVOVF9QUkVGSVg6IFJlY29yZDxJdGVtVHlwZSwgc3RyaW5nPiA9IHtcbiAgdGFzazogJ1RBU0snLFxuICBmZWF0dXJlOiAnRkVBVCcsXG4gIHJlcXVpcmVtZW50OiAnUkVRJyxcbiAgc3Rvcnk6ICdTVE9SWScsXG4gIGRlY2lzaW9uOiAnREVDJyxcbiAgcmlzazogJ1JJU0snLFxuICBibG9ja2VyOiAnQkxLJyxcbiAgYWNjZXNzOiAnQUNDJyxcbiAgbWVldGluZzogJ01URycsXG4gIGlkZWE6ICdJREVBJyxcbiAgcXVlc3Rpb246ICdRJyxcbiAgZGVmZWN0OiAnREVGJyxcbiAgcmVzZWFyY2g6ICdSRVMnLFxufTtcblxuZXhwb3J0IGNvbnN0IFRZUEVfTEFCRUw6IFJlY29yZDxJdGVtVHlwZSwgc3RyaW5nPiA9IHtcbiAgdGFzazogJ1Rhc2snLFxuICBmZWF0dXJlOiAnRmVhdHVyZScsXG4gIHJlcXVpcmVtZW50OiAnUmVxdWlyZW1lbnQnLFxuICBzdG9yeTogJ1VzZXIgU3RvcnknLFxuICBkZWNpc2lvbjogJ0RlY2lzaW9uJyxcbiAgcmlzazogJ1Jpc2snLFxuICBibG9ja2VyOiAnQmxvY2tlcicsXG4gIGFjY2VzczogJ0FjY2VzcyBSZXF1ZXN0JyxcbiAgbWVldGluZzogJ01lZXRpbmcgTm90ZScsXG4gIGlkZWE6ICdJZGVhJyxcbiAgcXVlc3Rpb246ICdPcGVuIFF1ZXN0aW9uJyxcbiAgZGVmZWN0OiAnRGVmZWN0JyxcbiAgcmVzZWFyY2g6ICdSZXNlYXJjaCcsXG59O1xuXG4vLyAtLS0tLS0tLS0tIFN0YXR1c2VzIC0tLS0tLS0tLS1cbi8vIFdvcmsgc3RhdHVzZXMgYXBwbHkgdG8gZXhlY3V0YWJsZSBpdGVtcyAodGFzay9mZWF0dXJlL3JlcXVpcmVtZW50L3N0b3J5L2RlZmVjdC9yZXNlYXJjaC9pZGVhKS5cbmV4cG9ydCBjb25zdCBXT1JLX1NUQVRVU0VTID0gW1xuICAnYmFja2xvZycsXG4gICd0b2RvJyxcbiAgJ2luX3Byb2dyZXNzJyxcbiAgJ2luX3JldmlldycsXG4gICdibG9ja2VkJyxcbiAgJ2RvbmUnLFxuICAnY2FuY2VsbGVkJyxcbl0gYXMgY29uc3Q7XG5leHBvcnQgdHlwZSBXb3JrU3RhdHVzID0gKHR5cGVvZiBXT1JLX1NUQVRVU0VTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgREVDSVNJT05fU1RBVFVTRVMgPSBbXG4gICdwcm9wb3NlZCcsXG4gICdkaXNjdXNzaW5nJyxcbiAgJ2FwcHJvdmVkJyxcbiAgJ3JlamVjdGVkJyxcbiAgJ3JldmlzaXQnLFxuICAnc3VwZXJzZWRlZCcsXG5dIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgRGVjaXNpb25TdGF0dXMgPSAodHlwZW9mIERFQ0lTSU9OX1NUQVRVU0VTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgQUNDRVNTX1NUQVRVU0VTID0gW1xuICAnaWRlbnRpZmllZCcsXG4gICdub3RfcmVxdWVzdGVkJyxcbiAgJ3ByZXBhcmluZycsXG4gICdyZXF1ZXN0ZWQnLFxuICAndW5kZXJfcmV2aWV3JyxcbiAgJ2luZm9fbmVlZGVkJyxcbiAgJ2FwcHJvdmVkJyxcbiAgJ3BhcnRpYWxseV9hcHByb3ZlZCcsXG4gICdncmFudGVkJyxcbiAgJ2RlbmllZCcsXG4gICdleHBpcmVkJyxcbiAgJ25vdF9uZWVkZWQnLFxuXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEFjY2Vzc1N0YXR1cyA9ICh0eXBlb2YgQUNDRVNTX1NUQVRVU0VTKVtudW1iZXJdO1xuXG5leHBvcnQgY29uc3QgUklTS19TVEFUVVNFUyA9IFsnb3BlbicsICdtaXRpZ2F0aW5nJywgJ2FjY2VwdGVkJywgJ2Nsb3NlZCddIGFzIGNvbnN0O1xuZXhwb3J0IGNvbnN0IEJMT0NLRVJfU1RBVFVTRVMgPSBbJ2FjdGl2ZScsICd3b3JrYXJvdW5kJywgJ3Jlc29sdmVkJ10gYXMgY29uc3Q7XG5leHBvcnQgY29uc3QgUVVFU1RJT05fU1RBVFVTRVMgPSBbJ29wZW4nLCAnYW5zd2VyZWQnLCAncGFya2VkJ10gYXMgY29uc3Q7XG5leHBvcnQgY29uc3QgTUVFVElOR19TVEFUVVNFUyA9IFsnc2NoZWR1bGVkJywgJ2hlbGQnLCAnc3VtbWFyaXplZCddIGFzIGNvbnN0O1xuXG5leHBvcnQgdHlwZSBJdGVtU3RhdHVzID0gc3RyaW5nOyAvLyB2YWxpZGF0ZWQgcGVyLXR5cGUgYnkgc3RhdHVzZXNGb3JUeXBlKClcblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXR1c2VzRm9yVHlwZSh0eXBlOiBJdGVtVHlwZSk6IHJlYWRvbmx5IHN0cmluZ1tdIHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAnZGVjaXNpb24nOlxuICAgICAgcmV0dXJuIERFQ0lTSU9OX1NUQVRVU0VTO1xuICAgIGNhc2UgJ2FjY2Vzcyc6XG4gICAgICByZXR1cm4gQUNDRVNTX1NUQVRVU0VTO1xuICAgIGNhc2UgJ3Jpc2snOlxuICAgICAgcmV0dXJuIFJJU0tfU1RBVFVTRVM7XG4gICAgY2FzZSAnYmxvY2tlcic6XG4gICAgICByZXR1cm4gQkxPQ0tFUl9TVEFUVVNFUztcbiAgICBjYXNlICdxdWVzdGlvbic6XG4gICAgICByZXR1cm4gUVVFU1RJT05fU1RBVFVTRVM7XG4gICAgY2FzZSAnbWVldGluZyc6XG4gICAgICByZXR1cm4gTUVFVElOR19TVEFUVVNFUztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIFdPUktfU1RBVFVTRVM7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFNUQVRVU19MQUJFTDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgYmFja2xvZzogJ0JhY2tsb2cnLFxuICB0b2RvOiAnVG8gRG8nLFxuICBpbl9wcm9ncmVzczogJ0luIFByb2dyZXNzJyxcbiAgaW5fcmV2aWV3OiAnSW4gUmV2aWV3JyxcbiAgYmxvY2tlZDogJ0Jsb2NrZWQnLFxuICBkb25lOiAnRG9uZScsXG4gIGNhbmNlbGxlZDogJ0NhbmNlbGxlZCcsXG4gIHByb3Bvc2VkOiAnUHJvcG9zZWQnLFxuICBkaXNjdXNzaW5nOiAnRGlzY3Vzc2luZycsXG4gIGFwcHJvdmVkOiAnQXBwcm92ZWQnLFxuICByZWplY3RlZDogJ1JlamVjdGVkJyxcbiAgcmV2aXNpdDogJ1JldmlzaXQgTGF0ZXInLFxuICBzdXBlcnNlZGVkOiAnU3VwZXJzZWRlZCcsXG4gIGlkZW50aWZpZWQ6ICdJZGVudGlmaWVkJyxcbiAgbm90X3JlcXVlc3RlZDogJ05vdCBSZXF1ZXN0ZWQnLFxuICBwcmVwYXJpbmc6ICdQcmVwYXJpbmcgUmVxdWVzdCcsXG4gIHJlcXVlc3RlZDogJ1JlcXVlc3RlZCcsXG4gIHVuZGVyX3JldmlldzogJ1VuZGVyIFJldmlldycsXG4gIGluZm9fbmVlZGVkOiAnTW9yZSBJbmZvIE5lZWRlZCcsXG4gIHBhcnRpYWxseV9hcHByb3ZlZDogJ1BhcnRpYWxseSBBcHByb3ZlZCcsXG4gIGdyYW50ZWQ6ICdHcmFudGVkJyxcbiAgZGVuaWVkOiAnRGVuaWVkJyxcbiAgZXhwaXJlZDogJ0V4cGlyZWQnLFxuICBub3RfbmVlZGVkOiAnTm8gTG9uZ2VyIE5lZWRlZCcsXG4gIG9wZW46ICdPcGVuJyxcbiAgbWl0aWdhdGluZzogJ01pdGlnYXRpbmcnLFxuICBhY2NlcHRlZDogJ0FjY2VwdGVkJyxcbiAgY2xvc2VkOiAnQ2xvc2VkJyxcbiAgYWN0aXZlOiAnQWN0aXZlJyxcbiAgd29ya2Fyb3VuZDogJ1dvcmthcm91bmQgSW4gUGxhY2UnLFxuICByZXNvbHZlZDogJ1Jlc29sdmVkJyxcbiAgYW5zd2VyZWQ6ICdBbnN3ZXJlZCcsXG4gIHBhcmtlZDogJ1BhcmtlZCcsXG4gIHNjaGVkdWxlZDogJ1NjaGVkdWxlZCcsXG4gIGhlbGQ6ICdIZWxkJyxcbiAgc3VtbWFyaXplZDogJ1N1bW1hcml6ZWQnLFxufTtcblxuLyoqIFN0YXR1c2VzIHRoYXQgY291bnQgYXMgXCJjbG9zZWQvdGVybWluYWxcIiBmb3IgcHJvZ3Jlc3MgKyBkYXNoYm9hcmRzLiAqL1xuZXhwb3J0IGNvbnN0IFRFUk1JTkFMX1NUQVRVU0VTID0gbmV3IFNldChbXG4gICdkb25lJyxcbiAgJ2NhbmNlbGxlZCcsXG4gICdyZWplY3RlZCcsXG4gICdzdXBlcnNlZGVkJyxcbiAgJ2dyYW50ZWQnLFxuICAnZGVuaWVkJyxcbiAgJ2V4cGlyZWQnLFxuICAnbm90X25lZWRlZCcsXG4gICdjbG9zZWQnLFxuICAncmVzb2x2ZWQnLFxuICAnYW5zd2VyZWQnLFxuICAnc3VtbWFyaXplZCcsXG4gICdhY2NlcHRlZCcsXG5dKTtcblxuZXhwb3J0IGNvbnN0IFBSSU9SSVRJRVMgPSBbJ3VyZ2VudCcsICdoaWdoJywgJ21lZGl1bScsICdsb3cnLCAnbm9uZSddIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgUHJpb3JpdHkgPSAodHlwZW9mIFBSSU9SSVRJRVMpW251bWJlcl07XG5cbi8vIC0tLS0tLS0tLS0gTGlua3MgLS0tLS0tLS0tLVxuZXhwb3J0IGNvbnN0IExJTktfS0lORFMgPSBbXG4gICdyZWxhdGVzJywgLy8gZ2VuZXJpYyBiaWRpcmVjdGlvbmFsXG4gICdibG9ja3MnLCAvLyBmcm9tIGJsb2NrcyB0b1xuICAnaW1wbGVtZW50cycsIC8vIHRhc2sgaW1wbGVtZW50cyByZXF1aXJlbWVudC9mZWF0dXJlXG4gICdzdXBwb3J0cycsIC8vIHJlcXVpcmVtZW50IHN1cHBvcnRzIGZlYXR1cmVcbiAgJ3NoYXBlZF9ieScsIC8vIGl0ZW0gc2hhcGVkIGJ5IGRlY2lzaW9uXG4gICdyZXF1aXJlc19hY2Nlc3MnLCAvLyBpdGVtIHJlcXVpcmVzIGFjY2VzcyByZWNvcmRcbiAgJ2Rpc2N1c3NlZF9pbicsIC8vIGl0ZW0gZGlzY3Vzc2VkIGluIG1lZXRpbmdcbiAgJ3ZhbGlkYXRlcycsIC8vIHRlc3QvZGVmZWN0IHZhbGlkYXRlcyByZXF1aXJlbWVudFxuICAnc3VwZXJzZWRlcycsIC8vIGRlY2lzaW9uIHN1cGVyc2VkZXMgZGVjaXNpb25cbiAgJ3BhcmVudCcsIC8vIGZyb20gaXMgcGFyZW50IG9mIHRvIChhbHNvIG1pcnJvcmVkIHZpYSBpdGVtcy5wYXJlbnRfaWQpXG5dIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgTGlua0tpbmQgPSAodHlwZW9mIExJTktfS0lORFMpW251bWJlcl07XG5cbmV4cG9ydCBjb25zdCBMSU5LX0xBQkVMOiBSZWNvcmQ8TGlua0tpbmQsIFtzdHJpbmcsIHN0cmluZ10+ID0ge1xuICAvLyBbbGFiZWwgZnJvbS0+dG8sIGxhYmVsIHRvLT5mcm9tXVxuICByZWxhdGVzOiBbJ3JlbGF0ZXMgdG8nLCAncmVsYXRlcyB0byddLFxuICBibG9ja3M6IFsnYmxvY2tzJywgJ2Jsb2NrZWQgYnknXSxcbiAgaW1wbGVtZW50czogWydpbXBsZW1lbnRzJywgJ2ltcGxlbWVudGVkIGJ5J10sXG4gIHN1cHBvcnRzOiBbJ3N1cHBvcnRzJywgJ3N1cHBvcnRlZCBieSddLFxuICBzaGFwZWRfYnk6IFsnc2hhcGVkIGJ5JywgJ3NoYXBlZCddLFxuICByZXF1aXJlc19hY2Nlc3M6IFsncmVxdWlyZXMgYWNjZXNzJywgJ3JlcXVpcmVkIGZvciddLFxuICBkaXNjdXNzZWRfaW46IFsnZGlzY3Vzc2VkIGluJywgJ2Rpc2N1c3NlZCddLFxuICB2YWxpZGF0ZXM6IFsndmFsaWRhdGVzJywgJ3ZhbGlkYXRlZCBieSddLFxuICBzdXBlcnNlZGVzOiBbJ3N1cGVyc2VkZXMnLCAnc3VwZXJzZWRlZCBieSddLFxuICBwYXJlbnQ6IFsncGFyZW50IG9mJywgJ2NoaWxkIG9mJ10sXG59O1xuXG4vLyAtLS0tLS0tLS0tIENvcmUgcmVjb3JkcyAtLS0tLS0tLS0tXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtJdGVtIHtcbiAgaWQ6IHN0cmluZzsgLy8gdXVpZCBcdTIwMTQgY2Fub25pY2FsIGlkZW50aXR5LCB1c2VkIGJ5IGFsbCByZWZlcmVuY2VzXG4gIGlkZW50OiBzdHJpbmc7IC8vIGRpc3BsYXkgaWQgZS5nLiBSRVEtNDEgKG1heSBiZSByZW51bWJlcmVkIG9uIHN5bmMgY29sbGlzaW9uKVxuICB0eXBlOiBJdGVtVHlwZTtcbiAgdGl0bGU6IHN0cmluZztcbiAgYm9keTogc3RyaW5nOyAvLyByaWNoIGRvYyBKU09OIChlZGl0b3IgZG9jdW1lbnQpLCAnJyB3aGVuIGVtcHR5XG4gIGJvZHlUZXh0OiBzdHJpbmc7IC8vIHBsYWluIHRleHQgcHJvamVjdGlvbiBmb3Igc2VhcmNoXG4gIHN0YXR1czogc3RyaW5nO1xuICBwcmlvcml0eTogUHJpb3JpdHk7XG4gIG93bmVySWQ6IHN0cmluZyB8IG51bGw7XG4gIHJlcG9ydGVySWQ6IHN0cmluZyB8IG51bGw7XG4gIG1pbGVzdG9uZUlkOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlSWQ6IHN0cmluZyB8IG51bGw7XG4gIHBhcmVudElkOiBzdHJpbmcgfCBudWxsO1xuICBzdGFydERhdGU6IHN0cmluZyB8IG51bGw7IC8vIElTTyBkYXRlXG4gIGR1ZURhdGU6IHN0cmluZyB8IG51bGw7XG4gIGNvbXBsZXRlZEF0OiBzdHJpbmcgfCBudWxsOyAvLyBJU08gZGF0ZXRpbWVcbiAgZWZmb3J0OiBudW1iZXIgfCBudWxsOyAvLyBwb2ludHMvZGF5cywgdW5pdCBpcyB0ZWFtIGNvbnZlbnRpb25cbiAgY29uZmlkZW5jZTogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJyB8IG51bGw7XG4gIHJpc2tMZXZlbDogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJyB8ICdjcml0aWNhbCcgfCBudWxsO1xuICBidXNpbmVzc1ZhbHVlOiBzdHJpbmcgfCBudWxsO1xuICBsZWFkZXJzaGlwVmlzaWJsZTogMCB8IDE7XG4gIHByb2dyZXNzOiBudW1iZXIgfCBudWxsOyAvLyAwLTEwMCBtYW51YWwgb3ZlcnJpZGU7IG51bGwgPSBkZXJpdmVkXG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBleHRyYTogUmVjb3JkPHN0cmluZywgdW5rbm93bj47IC8vIHR5cGUtc3BlY2lmaWMgZmllbGRzIChzZWUgZG9jcy9URVJNSU5PTE9HWS5tZClcbiAgYXJjaGl2ZWQ6IDAgfCAxO1xuICBzYW1wbGU6IDAgfCAxOyAvLyBzZWVkZWQgc2FtcGxlIGRhdGEgZmxhZ1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgdXBkYXRlZEF0OiBzdHJpbmc7XG4gIGNyZWF0ZWRCeTogc3RyaW5nO1xuICB1cGRhdGVkQnk6IHN0cmluZztcbn1cblxuLy8gVHlwZS1zcGVjaWZpYyBgZXh0cmFgIHNoYXBlcyAoZG9jdW1lbnRlZCwgbm90IGVuZm9yY2VkIGJ5IERCKTpcbi8vIGFjY2VzczogICB7IHN5c3RlbSwgYWNjZXNzVHlwZSwgYnVzaW5lc3NSZWFzb24sIHJlcXVlc3RlZEZyb20sIHJlcXVlc3REYXRlLFxuLy8gICAgICAgICAgICAgYXBwcm92ZWRCeSwgZGF0ZUdyYW50ZWQsIGV4cGlyYXRpb25EYXRlLCByZW5ld2FsRGF0ZSwgc2VjdXJpdHlOb3RlcywgbmV4dEFjdGlvbiwgZm9sbG93VXBEYXRlIH1cbi8vIGRlY2lzaW9uOiB7IGNvbnRleHQsIHByb2JsZW0sIG9wdGlvbnM6IFt7dGl0bGUsIG5vdGVzLCBzZWxlY3RlZH1dLCByZWFzb25pbmcsXG4vLyAgICAgICAgICAgICB0cmFkZW9mZnMsIGNvbnNlcXVlbmNlcywgcmV2aWV3RGF0ZSwgY29udHJpYnV0b3JzOiBzdHJpbmdbXSB9XG4vLyBtZWV0aW5nOiAgeyBkYXRlLCB0aW1lLCBhdHRlbmRlZXM6IHN0cmluZ1tdLCBwdXJwb3NlLCBhZ2VuZGEsIGZvbGxvd1VwRGF0ZSB9XG4vLyByaXNrOiAgICAgeyBsaWtlbGlob29kLCBpbXBhY3QsIG1pdGlnYXRpb24sIHRyaWdnZXIgfVxuLy8gYmxvY2tlcjogIHsgd2FpdGluZ09uLCBzaW5jZSwgZXNjYWxhdGVkVG8gfVxuLy8gcmVxdWlyZW1lbnQ6IHsgYWNjZXB0YW5jZUNyaXRlcmlhLCB0ZXN0aW5nTm90ZXMsIHNlY3VyaXR5Q29uc2lkZXJhdGlvbnMgfVxuXG5leHBvcnQgaW50ZXJmYWNlIEl0ZW1MaW5rIHtcbiAgaWQ6IHN0cmluZztcbiAgZnJvbUlkOiBzdHJpbmc7XG4gIHRvSWQ6IHN0cmluZztcbiAga2luZDogTGlua0tpbmQ7XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xuICBjcmVhdGVkQnk6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21tZW50IHtcbiAgaWQ6IHN0cmluZztcbiAgaXRlbUlkOiBzdHJpbmc7XG4gIGF1dGhvcklkOiBzdHJpbmc7XG4gIGJvZHk6IHN0cmluZzsgLy8gcmljaCBkb2MgSlNPTlxuICBib2R5VGV4dDogc3RyaW5nO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgdXBkYXRlZEF0OiBzdHJpbmcgfCBudWxsO1xuICBkZWxldGVkOiAwIHwgMTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBdHRhY2htZW50IHtcbiAgaWQ6IHN0cmluZztcbiAgaXRlbUlkOiBzdHJpbmc7XG4gIGZpbGVuYW1lOiBzdHJpbmc7XG4gIG1pbWU6IHN0cmluZztcbiAgc2l6ZTogbnVtYmVyO1xuICBzaGEyNTY6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZyB8IG51bGw7XG4gIHVwbG9hZGVkQnk6IHN0cmluZztcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIGRlbGV0ZWQ6IDAgfCAxO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFjdGl2aXR5RW50cnkge1xuICBpZDogc3RyaW5nO1xuICBpdGVtSWQ6IHN0cmluZyB8IG51bGw7XG4gIGFjdG9ySWQ6IHN0cmluZztcbiAga2luZDogc3RyaW5nOyAvLyBjcmVhdGVkIHwgdXBkYXRlZCB8IHN0YXR1cyB8IGNvbW1lbnQgfCBsaW5rIHwgYXR0YWNobWVudCB8IGFyY2hpdmVkIHwgcmVzdG9yZWQgfCAuLi5cbiAgZmllbGQ6IHN0cmluZyB8IG51bGw7XG4gIG9sZFZhbHVlOiBzdHJpbmcgfCBudWxsO1xuICBuZXdWYWx1ZTogc3RyaW5nIHwgbnVsbDtcbiAgYXQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJdGVtVmVyc2lvbiB7XG4gIGlkOiBzdHJpbmc7XG4gIGl0ZW1JZDogc3RyaW5nO1xuICB2ZXJzaW9uOiBudW1iZXI7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGJvZHk6IHN0cmluZztcbiAgc2F2ZWRCeTogc3RyaW5nO1xuICBzYXZlZEF0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWlsZXN0b25lIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICB0YXJnZXREYXRlOiBzdHJpbmcgfCBudWxsO1xuICBzdGF0dXM6ICdwbGFubmVkJyB8ICdhY3RpdmUnIHwgJ2RvbmUnO1xuICBzb3J0OiBudW1iZXI7XG4gIHNhbXBsZTogMCB8IDE7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVsZWFzZSB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgdmVyc2lvbjogc3RyaW5nO1xuICB0YXJnZXREYXRlOiBzdHJpbmcgfCBudWxsO1xuICBzdGF0dXM6ICdwbGFubmVkJyB8ICdpbl9wcm9ncmVzcycgfCAncmVsZWFzZWQnIHwgJ2NhbmNlbGxlZCc7XG4gIGdvYWxzOiBzdHJpbmc7XG4gIG5vdGVzOiBzdHJpbmc7IC8vIHJlbGVhc2Ugbm90ZXMgcmljaCBkb2NcbiAgc2FtcGxlOiAwIHwgMTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBVc2VyIHtcbiAgaWQ6IHN0cmluZzsgLy8gc3RhYmxlIHNsdWcsIGUuZy4gJ2pvaG4nLCAnbWFyaydcbiAgbmFtZTogc3RyaW5nO1xuICBpbml0aWFsczogc3RyaW5nO1xuICBjb2xvcjogc3RyaW5nO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTYXZlZFZpZXcge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbmZpZzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47IC8vIHt2aWV3LCBmaWx0ZXJzLCBzb3J0LCBncm91cH1cbiAgcGlubmVkOiAwIHwgMTtcbiAgY3JlYXRlZEJ5OiBzdHJpbmc7XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xufVxuXG4vLyAtLS0tLS0tLS0tIFN5bmMgLS0tLS0tLS0tLVxuZXhwb3J0IGludGVyZmFjZSBPcCB7XG4gIG9wSWQ6IHN0cmluZzsgLy8gdXVpZFxuICBkZXZpY2VJZDogc3RyaW5nO1xuICBhY3RvcklkOiBzdHJpbmc7XG4gIGxhbXBvcnQ6IG51bWJlcjtcbiAgYXQ6IHN0cmluZzsgLy8gd2FsbCBjbG9jaywgaW5mb3JtYXRpb25hbCBvbmx5IFx1MjAxNCBvcmRlcmluZyB1c2VzIGxhbXBvcnRcbiAgZW50aXR5OiAnaXRlbScgfCAnbGluaycgfCAnY29tbWVudCcgfCAnYXR0YWNobWVudCcgfCAnbWlsZXN0b25lJyB8ICdyZWxlYXNlJyB8ICd1c2VyJyB8ICdzYXZlZF92aWV3JyB8ICd0YWdzZXQnO1xuICBlbnRpdHlJZDogc3RyaW5nO1xuICBhY3Rpb246ICdjcmVhdGUnIHwgJ3NldCcgfCAnZGVsZXRlJztcbiAgLy8gY3JlYXRlOiBwYXlsb2FkID0gZnVsbCByZWNvcmQuIHNldDogcGF5bG9hZCA9IHtmaWVsZDogdmFsdWUsLi4ufS4gZGVsZXRlOiBwYXlsb2FkID0ge30uXG4gIHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN5bmNDb25mbGljdCB7XG4gIGlkOiBzdHJpbmc7XG4gIGVudGl0eTogc3RyaW5nO1xuICBlbnRpdHlJZDogc3RyaW5nO1xuICBmaWVsZDogc3RyaW5nO1xuICBsb2NhbFZhbHVlOiBzdHJpbmc7XG4gIHJlbW90ZVZhbHVlOiBzdHJpbmc7XG4gIHJlbW90ZURldmljZTogc3RyaW5nO1xuICByZW1vdGVBY3Rvcjogc3RyaW5nO1xuICBkZXRlY3RlZEF0OiBzdHJpbmc7XG4gIHJlc29sdmVkQXQ6IHN0cmluZyB8IG51bGw7XG4gIHJlc29sdXRpb246ICdsb2NhbCcgfCAncmVtb3RlJyB8ICdtZXJnZWQnIHwgbnVsbDtcbn1cblxuZXhwb3J0IHR5cGUgU3luY1N0YXR1c1N0YXRlID0gJ2Rpc2FibGVkJyB8ICdpZGxlJyB8ICdzeW5jaW5nJyB8ICdvZmZsaW5lJyB8ICdlcnJvcic7XG5leHBvcnQgaW50ZXJmYWNlIFN5bmNTdGF0dXMge1xuICBzdGF0ZTogU3luY1N0YXR1c1N0YXRlO1xuICBmb2xkZXI6IHN0cmluZyB8IG51bGw7XG4gIGxhc3RTeW5jQXQ6IHN0cmluZyB8IG51bGw7XG4gIGxhc3RFcnJvcjogc3RyaW5nIHwgbnVsbDtcbiAgcGVuZGluZ09wczogbnVtYmVyO1xuICBvcGVuQ29uZmxpY3RzOiBudW1iZXI7XG4gIHBlZXJzOiB7IGRldmljZUlkOiBzdHJpbmc7IHVzZXJOYW1lOiBzdHJpbmcgfCBudWxsOyBsYXN0U2VlbkF0OiBzdHJpbmcgfCBudWxsIH1bXTtcbn1cblxuLy8gLS0tLS0tLS0tLSBRdWVyaWVzIC0tLS0tLS0tLS1cbmV4cG9ydCBpbnRlcmZhY2UgSXRlbUZpbHRlciB7XG4gIHR5cGVzPzogSXRlbVR5cGVbXTtcbiAgc3RhdHVzZXM/OiBzdHJpbmdbXTtcbiAgcHJpb3JpdGllcz86IFByaW9yaXR5W107XG4gIG93bmVySWRzPzogKHN0cmluZyB8IG51bGwpW107XG4gIG1pbGVzdG9uZUlkPzogc3RyaW5nO1xuICByZWxlYXNlSWQ/OiBzdHJpbmc7XG4gIHRhZz86IHN0cmluZztcbiAgdGV4dD86IHN0cmluZzsgLy8gRlRTIHF1ZXJ5XG4gIGFyY2hpdmVkPzogYm9vbGVhbjsgLy8gZGVmYXVsdCBmYWxzZVxuICBvdmVyZHVlPzogYm9vbGVhbjtcbiAgZHVlV2l0aGluRGF5cz86IG51bWJlcjtcbiAgbGVhZGVyc2hpcFZpc2libGU/OiBib29sZWFuO1xuICB1cGRhdGVkU2luY2U/OiBzdHJpbmc7XG4gIHBhcmVudElkPzogc3RyaW5nO1xuICBzYW1wbGU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEl0ZW1Tb3J0IHtcbiAgZmllbGQ6ICdpZGVudCcgfCAndGl0bGUnIHwgJ3N0YXR1cycgfCAncHJpb3JpdHknIHwgJ2R1ZURhdGUnIHwgJ2NyZWF0ZWRBdCcgfCAndXBkYXRlZEF0JyB8ICdtYW51YWwnO1xuICBkaXI6ICdhc2MnIHwgJ2Rlc2MnO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlYXJjaFJlc3VsdCB7XG4gIGl0ZW06IFdvcmtJdGVtO1xuICBzbmlwcGV0OiBzdHJpbmcgfCBudWxsO1xuICBzY29yZTogbnVtYmVyO1xufVxuIiwgIi8vIFN5bmNUcmFuc3BvcnQ6IHRoZSBzZWFtIGJldHdlZW4gVGV0aGVyIGFuZCB3aGF0ZXZlciBtb3ZlcyBieXRlcyBiZXR3ZWVuIG1hY2hpbmVzLlxuLy8gdjEgc2hpcHMgRm9sZGVyVHJhbnNwb3J0IChhIE9uZURyaXZlL1NoYXJlUG9pbnQtc3luY2VkIGZvbGRlcikuIFRoZSBpbnRlcmZhY2UgaXNcbi8vIGRlbGliZXJhdGVseSBkdW1iIFx1MjAxNCBhcHBlbmQtb25seSBiYXRjaGVzIG91dCwgYmF0Y2hlcyBpbiBcdTIwMTQgc28gYSBmdXR1cmUgQXp1cmUgU1FMIC9cbi8vIERhdGF2ZXJzZSAvIGludGVybmFsIEFQSSB0cmFuc3BvcnQgc2xvdHMgaW4gd2l0aG91dCB0b3VjaGluZyBtZXJnZSBsb2dpYy5cblxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB0eXBlIHsgT3AgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBlZXJJbmZvIHtcbiAgZGV2aWNlSWQ6IHN0cmluZztcbiAgdXNlck5hbWU6IHN0cmluZyB8IG51bGw7XG4gIGxhc3RTZWVuQXQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3BCYXRjaEZpbGUge1xuICBkZXZpY2VJZDogc3RyaW5nO1xuICBmaWxlTmFtZTogc3RyaW5nOyAvLyBzb3J0YWJsZSwgdW5pcXVlIHBlciBkZXZpY2VcbiAgb3BzOiBPcFtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN5bmNUcmFuc3BvcnQge1xuICAvKiogSHVtYW4tcmVhZGFibGUgbG9jYXRpb24gZm9yIHRoZSBVSSAoXCJ3aGVyZSBpcyBteSBkYXRhXCIpLiAqL1xuICBsb2NhdGlvbigpOiBzdHJpbmc7XG4gIC8qKiBUcnVlIHdoZW4gdGhlIGJhY2tpbmcgbWVkaXVtIGlzIHJlYWNoYWJsZSByaWdodCBub3cuICovXG4gIGF2YWlsYWJsZSgpOiBib29sZWFuO1xuICAvKiogUHVibGlzaCBhIGJhdGNoIG9mIHRoaXMgZGV2aWNlJ3Mgb3BzLiBNdXN0IGJlIGF0b21pYyAoYWxsLW9yLW5vdGhpbmcgdmlzaWJsZSkuICovXG4gIHB1Ymxpc2hPcHMoZGV2aWNlSWQ6IHN0cmluZywgYmF0Y2hOYW1lOiBzdHJpbmcsIG9wczogT3BbXSk6IFByb21pc2U8dm9pZD47XG4gIC8qKiBMaXN0IHBlZXIgYmF0Y2ggZmlsZSBuYW1lcyAoc29ydGVkIGFzY2VuZGluZykgbmV3ZXIgdGhhbiBgYWZ0ZXJGaWxlYCBmb3IgZWFjaCBwZWVyLiAqL1xuICBsaXN0UGVlckJhdGNoZXMob3duRGV2aWNlSWQ6IHN0cmluZywgYWZ0ZXJGaWxlQnlEZXZpY2U6IE1hcDxzdHJpbmcsIHN0cmluZyB8IG51bGw+KTogUHJvbWlzZTx7IGRldmljZUlkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfVtdPjtcbiAgLyoqIEZldGNoIG9uZSBiYXRjaC4gKi9cbiAgZmV0Y2hCYXRjaChkZXZpY2VJZDogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nKTogUHJvbWlzZTxPcFtdPjtcbiAgLyoqIEFubm91bmNlIHByZXNlbmNlIChvd24gZmlsZSBvbmx5IFx1MjAxNCBubyB3cml0ZSBjb250ZW50aW9uKS4gKi9cbiAgYW5ub3VuY2UoZGV2aWNlSWQ6IHN0cmluZywgdXNlck5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG4gIC8qKiBBbGwgYW5ub3VuY2VkIGRldmljZXMuICovXG4gIGxpc3RQZWVycygpOiBQcm9taXNlPFBlZXJJbmZvW10+O1xuICAvKiogU3RvcmUgYW4gYXR0YWNobWVudCBibG9iIGNvbnRlbnQtYWRkcmVzc2VkIGJ5IHNoYTI1Ni4gUmV0dXJucyB0cnVlIGlmIG5ld2x5IHN0b3JlZC4gKi9cbiAgcHV0QmxvYihzaGEyNTY6IHN0cmluZywgZGF0YTogQnVmZmVyKTogUHJvbWlzZTxib29sZWFuPjtcbiAgLyoqIEZldGNoIGFuIGF0dGFjaG1lbnQgYmxvYiwgbnVsbCBpZiBub3QgKHlldCkgcHJlc2VudC4gKi9cbiAgZ2V0QmxvYihzaGEyNTY6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyIHwgbnVsbD47XG59XG5cbi8qKlxuICogRm9sZGVyVHJhbnNwb3J0IFx1MjAxNCBzaGFyZWQtZm9sZGVyIGxheW91dDpcbiAqICAgPHJvb3Q+L29wcy88ZGV2aWNlSWQ+LzAwMDAwMDAwMDAxLmpzb25sICAgb3AgYmF0Y2hlcywgb25lIEpTT04gb3AgcGVyIGxpbmVcbiAqICAgPHJvb3Q+L29wcy88ZGV2aWNlSWQ+L2RldmljZS5qc29uICAgICAgICAgIHByZXNlbmNlICsgaWRlbnRpdHlcbiAqICAgPHJvb3Q+L2Jsb2JzLzxhYT4vPHNoYTI1Nj4gICAgICAgICAgICAgICAgIGNvbnRlbnQtYWRkcmVzc2VkIGF0dGFjaG1lbnRzXG4gKlxuICogQ29ycmVjdG5lc3MgcnVsZXM6XG4gKiAtIEEgZGV2aWNlIHdyaXRlcyBPTkxZIHVuZGVyIGl0cyBvd24gb3BzLzxkZXZpY2VJZD4vIGRpcmVjdG9yeSBcdTIxOTIgbm8gd3JpdGUgY29udGVudGlvbixcbiAqICAgbm8gc2hhcmVkLWZpbGUgbG9ja2luZywgbm8gU1FMaXRlLW92ZXItT25lRHJpdmUgY29ycnVwdGlvbiBjbGFzcy5cbiAqIC0gRmlsZXMgYXJlIHdyaXR0ZW4gdG8gYSB0ZW1wIG5hbWUgdGhlbiByZW5hbWVkIFx1MjE5MiByZWFkZXJzIG5ldmVyIHNlZSBwYXJ0aWFsIGJhdGNoZXMuXG4gKiAtIEJhdGNoZXMgYXJlIGltbXV0YWJsZSBvbmNlIHB1Ymxpc2hlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIEZvbGRlclRyYW5zcG9ydCBpbXBsZW1lbnRzIFN5bmNUcmFuc3BvcnQge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IHN0cmluZykge31cblxuICBsb2NhdGlvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJvb3Q7XG4gIH1cblxuICBhdmFpbGFibGUoKTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4odGhpcy5yb290LCAnb3BzJyksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvcHNEaXIoZGV2aWNlSWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHBhdGguam9pbih0aGlzLnJvb3QsICdvcHMnLCBkZXZpY2VJZCk7XG4gIH1cblxuICBhc3luYyBwdWJsaXNoT3BzKGRldmljZUlkOiBzdHJpbmcsIGJhdGNoTmFtZTogc3RyaW5nLCBvcHM6IE9wW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBkaXIgPSB0aGlzLm9wc0RpcihkZXZpY2VJZCk7XG4gICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgY29uc3QgZmluYWxQYXRoID0gcGF0aC5qb2luKGRpciwgYmF0Y2hOYW1lKTtcbiAgICBjb25zdCB0bXBQYXRoID0gZmluYWxQYXRoICsgJy50bXAnO1xuICAgIGNvbnN0IGxpbmVzID0gb3BzLm1hcCgobykgPT4gSlNPTi5zdHJpbmdpZnkobykpLmpvaW4oJ1xcbicpICsgJ1xcbic7XG4gICAgZnMud3JpdGVGaWxlU3luYyh0bXBQYXRoLCBsaW5lcywgJ3V0ZjgnKTtcbiAgICBmcy5yZW5hbWVTeW5jKHRtcFBhdGgsIGZpbmFsUGF0aCk7XG4gIH1cblxuICBhc3luYyBsaXN0UGVlckJhdGNoZXMoXG4gICAgb3duRGV2aWNlSWQ6IHN0cmluZyxcbiAgICBhZnRlckZpbGVCeURldmljZTogTWFwPHN0cmluZywgc3RyaW5nIHwgbnVsbD4sXG4gICk6IFByb21pc2U8eyBkZXZpY2VJZDogc3RyaW5nOyBmaWxlTmFtZTogc3RyaW5nIH1bXT4ge1xuICAgIGNvbnN0IG9wc1Jvb3QgPSBwYXRoLmpvaW4odGhpcy5yb290LCAnb3BzJyk7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKG9wc1Jvb3QpKSByZXR1cm4gW107XG4gICAgY29uc3Qgb3V0OiB7IGRldmljZUlkOiBzdHJpbmc7IGZpbGVOYW1lOiBzdHJpbmcgfVtdID0gW107XG4gICAgZm9yIChjb25zdCBkZXYgb2YgZnMucmVhZGRpclN5bmMob3BzUm9vdCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pKSB7XG4gICAgICBpZiAoIWRldi5pc0RpcmVjdG9yeSgpIHx8IGRldi5uYW1lID09PSBvd25EZXZpY2VJZCkgY29udGludWU7XG4gICAgICBjb25zdCBhZnRlciA9IGFmdGVyRmlsZUJ5RGV2aWNlLmdldChkZXYubmFtZSkgPz8gbnVsbDtcbiAgICAgIGNvbnN0IGZpbGVzID0gZnNcbiAgICAgICAgLnJlYWRkaXJTeW5jKHBhdGguam9pbihvcHNSb290LCBkZXYubmFtZSkpXG4gICAgICAgIC5maWx0ZXIoKGYpID0+IGYuZW5kc1dpdGgoJy5qc29ubCcpKVxuICAgICAgICAuc29ydCgpO1xuICAgICAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB7XG4gICAgICAgIGlmIChhZnRlciAmJiBmIDw9IGFmdGVyKSBjb250aW51ZTtcbiAgICAgICAgb3V0LnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIGZpbGVOYW1lOiBmIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgYXN5bmMgZmV0Y2hCYXRjaChkZXZpY2VJZDogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nKTogUHJvbWlzZTxPcFtdPiB7XG4gICAgY29uc3QgcCA9IHBhdGguam9pbih0aGlzLm9wc0RpcihkZXZpY2VJZCksIGZpbGVOYW1lKTtcbiAgICBjb25zdCB0ZXh0ID0gZnMucmVhZEZpbGVTeW5jKHAsICd1dGY4Jyk7XG4gICAgY29uc3Qgb3BzOiBPcFtdID0gW107XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIHRleHQuc3BsaXQoJ1xcbicpKSB7XG4gICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gICAgICBpZiAoIXRyaW1tZWQpIGNvbnRpbnVlO1xuICAgICAgb3BzLnB1c2goSlNPTi5wYXJzZSh0cmltbWVkKSBhcyBPcCk7XG4gICAgfVxuICAgIHJldHVybiBvcHM7XG4gIH1cblxuICBhc3luYyBhbm5vdW5jZShkZXZpY2VJZDogc3RyaW5nLCB1c2VyTmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGlyID0gdGhpcy5vcHNEaXIoZGV2aWNlSWQpO1xuICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4oZGlyLCAnZGV2aWNlLmpzb24nKTtcbiAgICBjb25zdCB0bXAgPSBwICsgJy50bXAnO1xuICAgIGZzLndyaXRlRmlsZVN5bmModG1wLCBKU09OLnN0cmluZ2lmeSh7IGRldmljZUlkLCB1c2VyTmFtZSwgbGFzdFNlZW5BdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pLCAndXRmOCcpO1xuICAgIGZzLnJlbmFtZVN5bmModG1wLCBwKTtcbiAgfVxuXG4gIGFzeW5jIGxpc3RQZWVycygpOiBQcm9taXNlPFBlZXJJbmZvW10+IHtcbiAgICBjb25zdCBvcHNSb290ID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ29wcycpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhvcHNSb290KSkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IHBlZXJzOiBQZWVySW5mb1tdID0gW107XG4gICAgZm9yIChjb25zdCBkZXYgb2YgZnMucmVhZGRpclN5bmMob3BzUm9vdCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pKSB7XG4gICAgICBpZiAoIWRldi5pc0RpcmVjdG9yeSgpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4ob3BzUm9vdCwgZGV2Lm5hbWUsICdkZXZpY2UuanNvbicpO1xuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHApKSB7XG4gICAgICAgIHBlZXJzLnB1c2goeyBkZXZpY2VJZDogZGV2Lm5hbWUsIHVzZXJOYW1lOiBudWxsLCBsYXN0U2VlbkF0OiBudWxsIH0pO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGluZm8gPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwLCAndXRmOCcpKSBhcyBQZWVySW5mbztcbiAgICAgICAgcGVlcnMucHVzaCh7IGRldmljZUlkOiBkZXYubmFtZSwgdXNlck5hbWU6IGluZm8udXNlck5hbWUgPz8gbnVsbCwgbGFzdFNlZW5BdDogaW5mby5sYXN0U2VlbkF0ID8/IG51bGwgfSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgcGVlcnMucHVzaCh7IGRldmljZUlkOiBkZXYubmFtZSwgdXNlck5hbWU6IG51bGwsIGxhc3RTZWVuQXQ6IG51bGwgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwZWVycztcbiAgfVxuXG4gIGFzeW5jIHB1dEJsb2Ioc2hhMjU2OiBzdHJpbmcsIGRhdGE6IEJ1ZmZlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRpciA9IHBhdGguam9pbih0aGlzLnJvb3QsICdibG9icycsIHNoYTI1Ni5zbGljZSgwLCAyKSk7XG4gICAgY29uc3QgcCA9IHBhdGguam9pbihkaXIsIHNoYTI1Nik7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMocCkpIHJldHVybiBmYWxzZTtcbiAgICBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zdCB0bXAgPSBwICsgJy50bXAtJyArIHByb2Nlc3MucGlkO1xuICAgIGZzLndyaXRlRmlsZVN5bmModG1wLCBkYXRhKTtcbiAgICB0cnkge1xuICAgICAgZnMucmVuYW1lU3luYyh0bXAsIHApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgZnMucm1TeW5jKHRtcCwgeyBmb3JjZTogdHJ1ZSB9KTsgLy8gcGVlciB3b24gdGhlIHJhY2U7IGNvbnRlbnQtYWRkcmVzc2VkIHNvIGlkZW50aWNhbFxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGdldEJsb2Ioc2hhMjU2OiBzdHJpbmcpOiBQcm9taXNlPEJ1ZmZlciB8IG51bGw+IHtcbiAgICBjb25zdCBwID0gcGF0aC5qb2luKHRoaXMucm9vdCwgJ2Jsb2JzJywgc2hhMjU2LnNsaWNlKDAsIDIpLCBzaGEyNTYpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhwKSkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhwKTtcbiAgfVxufVxuIiwgIi8vIFN5bmNFbmdpbmU6IHBlcmlvZGljICsgZXZlbnQtZHJpdmVuIGV4cG9ydC9pbXBvcnQgbG9vcCBvdmVyIGEgU3luY1RyYW5zcG9ydC5cbi8vIExvY2FsLWZpcnN0OiB0aGUgYXBwIGlzIGZ1bGx5IHVzYWJsZSB3aXRoIHN5bmMgZGlzYWJsZWQgb3IgdGhlIGZvbGRlciBvZmZsaW5lO1xuLy8gb3BzIHF1ZXVlIGluIHRoZSBvcGxvZyBhbmQgZmx1c2ggd2hlbiB0aGUgdHJhbnNwb3J0IHJldHVybnMuXG5cbmltcG9ydCB0eXBlIHsgU3RvcmUgfSBmcm9tICcuLi9kYi9zdG9yZSc7XG5pbXBvcnQgeyBnZXRNZXRhLCBzZXRNZXRhIH0gZnJvbSAnLi4vZGIvZGInO1xuaW1wb3J0IHR5cGUgeyBTeW5jVHJhbnNwb3J0IH0gZnJvbSAnLi90cmFuc3BvcnQnO1xuaW1wb3J0IHR5cGUgeyBTeW5jU3RhdHVzLCBTeW5jU3RhdHVzU3RhdGUgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuXG5jb25zdCBFWFBPUlRfREVCT1VOQ0VfTVMgPSAxXzUwMDtcbmNvbnN0IFBPTExfSU5URVJWQUxfTVMgPSA1XzAwMDtcblxuZXhwb3J0IGNsYXNzIFN5bmNFbmdpbmUge1xuICBwcml2YXRlIHRyYW5zcG9ydDogU3luY1RyYW5zcG9ydCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGV4cG9ydFRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJ1bm5pbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjdXJyZW50OiBQcm9taXNlPHZvaWQ+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIHByaXZhdGUgc3RhdGU6IFN5bmNTdGF0dXNTdGF0ZSA9ICdkaXNhYmxlZCc7XG4gIHByaXZhdGUgbGFzdEVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsYXN0U3luY0F0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB1c2VyTmFtZTogc3RyaW5nO1xuICBwcml2YXRlIG9uU3RhdHVzOiAoczogU3luY1N0YXR1cykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHN0b3JlOiBTdG9yZSxcbiAgICB1c2VyTmFtZTogc3RyaW5nLFxuICAgIG9uU3RhdHVzOiAoczogU3luY1N0YXR1cykgPT4gdm9pZCxcbiAgKSB7XG4gICAgdGhpcy51c2VyTmFtZSA9IHVzZXJOYW1lO1xuICAgIHRoaXMub25TdGF0dXMgPSBvblN0YXR1cztcbiAgfVxuXG4gIHNldFRyYW5zcG9ydCh0cmFuc3BvcnQ6IFN5bmNUcmFuc3BvcnQgfCBudWxsKTogdm9pZCB7XG4gICAgdGhpcy50cmFuc3BvcnQgPSB0cmFuc3BvcnQ7XG4gICAgaWYgKHRoaXMudGltZXIpIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcik7XG4gICAgdGhpcy50aW1lciA9IG51bGw7XG4gICAgaWYgKHRyYW5zcG9ydCkge1xuICAgICAgdGhpcy5zdGF0ZSA9ICdpZGxlJztcbiAgICAgIHRoaXMudGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB2b2lkIHRoaXMuY3ljbGUoKSwgUE9MTF9JTlRFUlZBTF9NUyk7XG4gICAgICB2b2lkIHRoaXMuY3ljbGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZSA9ICdkaXNhYmxlZCc7XG4gICAgICB0aGlzLmVtaXRTdGF0dXMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2FsbCBhZnRlciBhbnkgbG9jYWwgbXV0YXRpb24gXHUyMDE0IGRlYm91bmNlZCBleHBvcnQgc28gcmFwaWQgZWRpdHMgYmF0Y2guICovXG4gIG5vdGVMb2NhbENoYW5nZSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMudHJhbnNwb3J0KSByZXR1cm47XG4gICAgaWYgKHRoaXMuZXhwb3J0VGltZXIpIGNsZWFyVGltZW91dCh0aGlzLmV4cG9ydFRpbWVyKTtcbiAgICB0aGlzLmV4cG9ydFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB2b2lkIHRoaXMuY3ljbGUoKSwgRVhQT1JUX0RFQk9VTkNFX01TKTtcbiAgfVxuXG4gIGFzeW5jIGN5Y2xlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy50cmFuc3BvcnQgfHwgdGhpcy5ydW5uaW5nKSByZXR1cm4gdGhpcy5jdXJyZW50O1xuICAgIHRoaXMucnVubmluZyA9IHRydWU7XG4gICAgbGV0IHJlbGVhc2UhOiAoKSA9PiB2b2lkO1xuICAgIHRoaXMuY3VycmVudCA9IG5ldyBQcm9taXNlKChyKSA9PiAocmVsZWFzZSA9IHIpKTtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLnRyYW5zcG9ydC5hdmFpbGFibGUoKSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKCdvZmZsaW5lJywgJ1N5bmMgZm9sZGVyIGlzIG5vdCByZWFjaGFibGUnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5zZXRTdGF0ZSgnc3luY2luZycsIG51bGwpO1xuICAgICAgYXdhaXQgdGhpcy5leHBvcnRPcHMoKTtcbiAgICAgIGF3YWl0IHRoaXMuaW1wb3J0T3BzKCk7XG4gICAgICBhd2FpdCB0aGlzLnRyYW5zcG9ydC5hbm5vdW5jZSh0aGlzLnN0b3JlLmRldmljZUlkLCB0aGlzLnVzZXJOYW1lKTtcbiAgICAgIHRoaXMubGFzdFN5bmNBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgIHRoaXMuc2V0U3RhdGUoJ2lkbGUnLCBudWxsKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoJ2Vycm9yJywgZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICByZWxlYXNlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBleHBvcnRPcHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnRyYW5zcG9ydCkgcmV0dXJuO1xuICAgIGNvbnN0IGxhc3RFeHBvcnRlZCA9IE51bWJlcihnZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdsYXN0X2V4cG9ydGVkX3NlcScpID8/ICcwJyk7XG4gICAgY29uc3QgcGVuZGluZyA9IHRoaXMuc3RvcmUub3BzU2luY2UobGFzdEV4cG9ydGVkLCB0cnVlKTtcbiAgICBpZiAocGVuZGluZy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBjb25zdCBtYXhTZXEgPSBwZW5kaW5nW3BlbmRpbmcubGVuZ3RoIC0gMV0uc2VxO1xuICAgIGNvbnN0IGJhdGNoTmFtZSA9IFN0cmluZyhtYXhTZXEpLnBhZFN0YXJ0KDEyLCAnMCcpICsgJy5qc29ubCc7XG4gICAgYXdhaXQgdGhpcy50cmFuc3BvcnQucHVibGlzaE9wcyhcbiAgICAgIHRoaXMuc3RvcmUuZGV2aWNlSWQsXG4gICAgICBiYXRjaE5hbWUsXG4gICAgICBwZW5kaW5nLm1hcCgocCkgPT4gcC5vcCksXG4gICAgKTtcbiAgICBzZXRNZXRhKHRoaXMuc3RvcmUuZGIsICdsYXN0X2V4cG9ydGVkX3NlcScsIFN0cmluZyhtYXhTZXEpKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW1wb3J0T3BzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy50cmFuc3BvcnQpIHJldHVybjtcbiAgICBjb25zdCBwZWVycyA9IHRoaXMuc3RvcmUuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgZGV2aWNlX2lkLCBsYXN0X2ZpbGUgRlJPTSBzeW5jX3BlZXJzJylcbiAgICAgIC5hbGwoKSBhcyB7IGRldmljZV9pZDogc3RyaW5nOyBsYXN0X2ZpbGU6IHN0cmluZyB8IG51bGwgfVtdO1xuICAgIGNvbnN0IGFmdGVyQnlEZXZpY2UgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nIHwgbnVsbD4ocGVlcnMubWFwKChwKSA9PiBbcC5kZXZpY2VfaWQsIHAubGFzdF9maWxlXSkpO1xuXG4gICAgY29uc3QgYmF0Y2hlcyA9IGF3YWl0IHRoaXMudHJhbnNwb3J0Lmxpc3RQZWVyQmF0Y2hlcyh0aGlzLnN0b3JlLmRldmljZUlkLCBhZnRlckJ5RGV2aWNlKTtcbiAgICBmb3IgKGNvbnN0IGIgb2YgYmF0Y2hlcykge1xuICAgICAgbGV0IG9wcztcbiAgICAgIHRyeSB7XG4gICAgICAgIG9wcyA9IGF3YWl0IHRoaXMudHJhbnNwb3J0LmZldGNoQmF0Y2goYi5kZXZpY2VJZCwgYi5maWxlTmFtZSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gUGFydGlhbGx5IHN5bmNlZCBvciB1bnJlYWRhYmxlIGZpbGUgXHUyMDE0IGxlYXZlIGN1cnNvciBhbG9uZSwgcmV0cnkgbmV4dCBjeWNsZS5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLnN0b3JlLmFwcGx5UmVtb3RlT3BzKG9wcyk7XG4gICAgICB0aGlzLnN0b3JlLmRiXG4gICAgICAgIC5wcmVwYXJlKFxuICAgICAgICAgIGBJTlNFUlQgSU5UTyBzeW5jX3BlZXJzKGRldmljZV9pZCwgbGFzdF9maWxlLCBsYXN0X3NlZW5fYXQpIFZBTFVFUyg/LD8sPylcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoZGV2aWNlX2lkKSBETyBVUERBVEUgU0VUIGxhc3RfZmlsZT1leGNsdWRlZC5sYXN0X2ZpbGUsIGxhc3Rfc2Vlbl9hdD1leGNsdWRlZC5sYXN0X3NlZW5fYXRgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4oYi5kZXZpY2VJZCwgYi5maWxlTmFtZSwgbmV3IERhdGUoKS50b0lTT1N0cmluZygpKTtcbiAgICB9XG5cbiAgICAvLyBSZWZyZXNoIHBlZXIgZGlzcGxheSBuYW1lcyBmcm9tIGFubm91bmNlbWVudHMuXG4gICAgZm9yIChjb25zdCBwIG9mIGF3YWl0IHRoaXMudHJhbnNwb3J0Lmxpc3RQZWVycygpKSB7XG4gICAgICBpZiAocC5kZXZpY2VJZCA9PT0gdGhpcy5zdG9yZS5kZXZpY2VJZCkgY29udGludWU7XG4gICAgICB0aGlzLnN0b3JlLmRiXG4gICAgICAgIC5wcmVwYXJlKFxuICAgICAgICAgIGBJTlNFUlQgSU5UTyBzeW5jX3BlZXJzKGRldmljZV9pZCwgdXNlcl9uYW1lLCBsYXN0X3NlZW5fYXQpIFZBTFVFUyg/LD8sPylcbiAgICAgICAgICAgT04gQ09ORkxJQ1QoZGV2aWNlX2lkKSBETyBVUERBVEUgU0VUIHVzZXJfbmFtZT1DT0FMRVNDRShleGNsdWRlZC51c2VyX25hbWUsIHN5bmNfcGVlcnMudXNlcl9uYW1lKSxcbiAgICAgICAgICAgICBsYXN0X3NlZW5fYXQ9Q09BTEVTQ0UoZXhjbHVkZWQubGFzdF9zZWVuX2F0LCBzeW5jX3BlZXJzLmxhc3Rfc2Vlbl9hdClgLFxuICAgICAgICApXG4gICAgICAgIC5ydW4ocC5kZXZpY2VJZCwgcC51c2VyTmFtZSwgcC5sYXN0U2VlbkF0KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldFN0YXRlKHN0YXRlOiBTeW5jU3RhdHVzU3RhdGUsIGVycm9yOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMubGFzdEVycm9yID0gZXJyb3I7XG4gICAgdGhpcy5lbWl0U3RhdHVzKCk7XG4gIH1cblxuICBwcml2YXRlIGVtaXRTdGF0dXMoKTogdm9pZCB7XG4gICAgdGhpcy5vblN0YXR1cyh0aGlzLnN0YXR1cygpKTtcbiAgfVxuXG4gIHN0YXR1cygpOiBTeW5jU3RhdHVzIHtcbiAgICBjb25zdCBsYXN0RXhwb3J0ZWQgPSBOdW1iZXIoZ2V0TWV0YSh0aGlzLnN0b3JlLmRiLCAnbGFzdF9leHBvcnRlZF9zZXEnKSA/PyAnMCcpO1xuICAgIGNvbnN0IHBlbmRpbmdSb3cgPSB0aGlzLnN0b3JlLmRiXG4gICAgICAucHJlcGFyZSgnU0VMRUNUIENPVU5UKCopIEFTIGMgRlJPTSBvcGxvZyBXSEVSRSBzZXEgPiA/IEFORCBkZXZpY2VfaWQgPSA/JylcbiAgICAgIC5nZXQobGFzdEV4cG9ydGVkLCB0aGlzLnN0b3JlLmRldmljZUlkKSBhcyB7IGM6IG51bWJlciB9O1xuICAgIGNvbnN0IGNvbmZsaWN0Um93ID0gdGhpcy5zdG9yZS5kYlxuICAgICAgLnByZXBhcmUoJ1NFTEVDVCBDT1VOVCgqKSBBUyBjIEZST00gc3luY19jb25mbGljdHMgV0hFUkUgcmVzb2x2ZWRfYXQgSVMgTlVMTCcpXG4gICAgICAuZ2V0KCkgYXMgeyBjOiBudW1iZXIgfTtcbiAgICBjb25zdCBwZWVycyA9IHRoaXMuc3RvcmUuZGJcbiAgICAgIC5wcmVwYXJlKCdTRUxFQ1QgZGV2aWNlX2lkIEFTIGRldmljZUlkLCB1c2VyX25hbWUgQVMgdXNlck5hbWUsIGxhc3Rfc2Vlbl9hdCBBUyBsYXN0U2VlbkF0IEZST00gc3luY19wZWVycycpXG4gICAgICAuYWxsKCkgYXMgU3luY1N0YXR1c1sncGVlcnMnXTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdGU6IHRoaXMuc3RhdGUsXG4gICAgICBmb2xkZXI6IHRoaXMudHJhbnNwb3J0ID8gdGhpcy50cmFuc3BvcnQubG9jYXRpb24oKSA6IG51bGwsXG4gICAgICBsYXN0U3luY0F0OiB0aGlzLmxhc3RTeW5jQXQsXG4gICAgICBsYXN0RXJyb3I6IHRoaXMubGFzdEVycm9yLFxuICAgICAgcGVuZGluZ09wczogcGVuZGluZ1Jvdy5jLFxuICAgICAgb3BlbkNvbmZsaWN0czogY29uZmxpY3RSb3cuYyxcbiAgICAgIHBlZXJzLFxuICAgIH07XG4gIH1cblxuICAvKiogU3RvcHMgdGltZXJzIGFuZCB3YWl0cyBmb3IgYW55IGluLWZsaWdodCBjeWNsZSBcdTIwMTQgc2FmZSB0byBjbG9zZSB0aGUgREIgYWZ0ZXJ3YXJkcy4gKi9cbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy50aW1lcikgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVyKTtcbiAgICBpZiAodGhpcy5leHBvcnRUaW1lcikgY2xlYXJUaW1lb3V0KHRoaXMuZXhwb3J0VGltZXIpO1xuICAgIHRoaXMudGltZXIgPSBudWxsO1xuICAgIHRoaXMuZXhwb3J0VGltZXIgPSBudWxsO1xuICAgIGF3YWl0IHRoaXMuY3VycmVudDtcbiAgfVxufVxuIiwgIi8vIFNhbXBsZSBTdXBwb3J0IEFJIHByb2plY3QgZGF0YS4gRXZlcnkgcmVjb3JkIGNhcnJpZXMgc2FtcGxlPTEgYW5kIGEgW1NBTVBMRV0gdGl0bGVcbi8vIG1hcmtlciBjb252ZW50aW9uIGlzIE5PVCB1c2VkIFx1MjAxNCB0aGUgc2FtcGxlIGZsYWcgZHJpdmVzIGJhZGdlcyArIG9uZS1jbGljayByZW1vdmFsLlxuLy8gTm8gcmVhbCBNY0tlc3NvbiBkYXRhOiBuYW1lcyBvZiBzeXN0ZW1zIGFyZSBnZW5lcmljLCBjb250ZW50cyBhcmUgaWxsdXN0cmF0aXZlLlxuXG5pbXBvcnQgdHlwZSB7IFN0b3JlIH0gZnJvbSAnLi9zdG9yZSc7XG5pbXBvcnQgdHlwZSB7IEl0ZW1UeXBlLCBQcmlvcml0eSB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5cbmludGVyZmFjZSBTZWVkSXRlbSB7XG4gIHR5cGU6IEl0ZW1UeXBlO1xuICB0aXRsZTogc3RyaW5nO1xuICBib2R5VGV4dD86IHN0cmluZztcbiAgc3RhdHVzPzogc3RyaW5nO1xuICBwcmlvcml0eT86IFByaW9yaXR5O1xuICBvd25lcj86ICdqb2huJyB8ICdtYXJrJyB8IG51bGw7XG4gIGR1ZURhdGU/OiBzdHJpbmc7XG4gIHRhZ3M/OiBzdHJpbmdbXTtcbiAgZXh0cmE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgbWlsZXN0b25lPzogc3RyaW5nO1xuICBsZWFkZXJzaGlwVmlzaWJsZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkU2VlZERhdGEoc3RvcmU6IFN0b3JlKTogbnVtYmVyIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBzdG9yZS5saXN0SXRlbXMoeyBzYW1wbGU6IHRydWUsIGFyY2hpdmVkOiB1bmRlZmluZWQgfSwgeyBmaWVsZDogJ2NyZWF0ZWRBdCcsIGRpcjogJ2FzYycgfSwgMSk7XG4gIGlmIChleGlzdGluZy5sZW5ndGggPiAwKSByZXR1cm4gMDsgLy8gYWxyZWFkeSBsb2FkZWRcblxuICBjb25zdCBtMSA9IHN0b3JlLnVwc2VydE1pbGVzdG9uZSh7IG5hbWU6ICdEaXNjb3ZlcnkgJiBBY2Nlc3MnLCB0YXJnZXREYXRlOiAnMjAyNi0wOC0xNScsIHN0YXR1czogJ2FjdGl2ZScsIHNvcnQ6IDEsIHNhbXBsZTogMSwgZGVzY3JpcHRpb246ICdTZWN1cmUgc3lzdGVtIGFjY2VzcywgaW52ZW50b3J5IGtub3dsZWRnZSBzb3VyY2VzLCBjb25maXJtIHNjb3BlIHdpdGggbGVhZGVyc2hpcC4nIH0pO1xuICBjb25zdCBtMiA9IHN0b3JlLnVwc2VydE1pbGVzdG9uZSh7IG5hbWU6ICdLbm93bGVkZ2UgUGlwZWxpbmUgTVZQJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTAtMDEnLCBzdGF0dXM6ICdwbGFubmVkJywgc29ydDogMiwgc2FtcGxlOiAxLCBkZXNjcmlwdGlvbjogJ0luZ2VzdCwgY2xlYW4sIGFuZCBpbmRleCB0aGUgZmlyc3Qga25vd2xlZGdlIGRvbWFpbiBlbmQgdG8gZW5kLicgfSk7XG4gIGNvbnN0IG0zID0gc3RvcmUudXBzZXJ0TWlsZXN0b25lKHsgbmFtZTogJ1BpbG90IHdpdGggU3VwcG9ydCBUZWFtJywgdGFyZ2V0RGF0ZTogJzIwMjYtMTItMDEnLCBzdGF0dXM6ICdwbGFubmVkJywgc29ydDogMywgc2FtcGxlOiAxLCBkZXNjcmlwdGlvbjogJ0xpbWl0ZWQgcGlsb3Q6IG1lYXN1cmUgZGVmbGVjdGlvbiwgYWNjdXJhY3ksIGFuZCBhZ2VudCBzYXRpc2ZhY3Rpb24uJyB9KTtcbiAgc3RvcmUudXBzZXJ0UmVsZWFzZSh7IG5hbWU6ICdTdXBwb3J0IEFJIFBpbG90IDAuMScsIHZlcnNpb246ICcwLjEnLCB0YXJnZXREYXRlOiAnMjAyNi0xMS0xNScsIHN0YXR1czogJ3BsYW5uZWQnLCBnb2FsczogJ0ZpcnN0IGludGVybmFsIHBpbG90IGJ1aWxkOiBzaW5nbGUga25vd2xlZGdlIGRvbWFpbiwgMTAgc3VwcG9ydCBhZ2VudHMsIGZlZWRiYWNrIGxvb3AgaW4gcGxhY2UuJywgc2FtcGxlOiAxIH0pO1xuXG4gIGNvbnN0IG1pbGVzdG9uZUlkOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0geyBtMTogbTEuaWQsIG0yOiBtMi5pZCwgbTM6IG0zLmlkIH07XG5cbiAgY29uc3QgaXRlbXM6IChTZWVkSXRlbSAmIHsga2V5OiBzdHJpbmcgfSlbXSA9IFtcbiAgICAvLyBGZWF0dXJlc1xuICAgIHsga2V5OiAnZmVhdEFuc3dlcicsIHR5cGU6ICdmZWF0dXJlJywgdGl0bGU6ICdBSSBhbnN3ZXIgZ2VuZXJhdGlvbiBvdmVyIGtub3dsZWRnZSBiYXNlJywgc3RhdHVzOiAnaW5fcHJvZ3Jlc3MnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBib2R5VGV4dDogJ0NvcmUgY2FwYWJpbGl0eTogZ2l2ZW4gYSBzdXBwb3J0IHF1ZXN0aW9uLCByZXRyaWV2ZSByZWxldmFudCBrbm93bGVkZ2UgYXJ0aWNsZXMgYW5kIGdlbmVyYXRlIGEgZ3JvdW5kZWQsIGNpdGVkIGFuc3dlci4nIH0sXG4gICAgeyBrZXk6ICdmZWF0SW5nZXN0JywgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0tub3dsZWRnZSBpbmdlc3Rpb24gcGlwZWxpbmUgKFNhbGVzZm9yY2UgS0EgZXhwb3J0KScsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBib2R5VGV4dDogJ0V4cG9ydCBrbm93bGVkZ2UgYXJ0aWNsZXMsIG5vcm1hbGl6ZSB0byBjbGVhbiB0ZXh0LCBjaHVuaywgYW5kIGluZGV4IGZvciByZXRyaWV2YWwuJyB9LFxuICAgIHsga2V5OiAnZmVhdEZlZWRiYWNrJywgdHlwZTogJ2ZlYXR1cmUnLCB0aXRsZTogJ0FnZW50IGZlZWRiYWNrIGNhcHR1cmUgKHRodW1icyArIHJlYXNvbiBjb2RlcyknLCBzdGF0dXM6ICdiYWNrbG9nJywgcHJpb3JpdHk6ICdtZWRpdW0nLCBvd25lcjogJ21hcmsnLCBtaWxlc3RvbmU6ICdtMycsIGJvZHlUZXh0OiAnUGlsb3QgYWdlbnRzIHJhdGUgZWFjaCBBSSBhbnN3ZXI7IHJlYXNvbnMgZmVlZCB0aGUgcXVhbGl0eSBkYXNoYm9hcmQuJyB9LFxuXG4gICAgLy8gUmVxdWlyZW1lbnRzXG4gICAgeyBrZXk6ICdyZXFDaXRhdGlvbnMnLCB0eXBlOiAncmVxdWlyZW1lbnQnLCB0aXRsZTogJ0V2ZXJ5IEFJIGFuc3dlciBtdXN0IGNpdGUgaXRzIHNvdXJjZSBhcnRpY2xlcycsIHN0YXR1czogJ3RvZG8nLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMicsIGV4dHJhOiB7IGFjY2VwdGFuY2VDcml0ZXJpYTogJ0Fuc3dlciBVSSBzaG93cyBhdCBsZWFzdCBvbmUgc291cmNlIGxpbmsgcGVyIGFuc3dlcjsgdW5jaXRlZCBhbnN3ZXJzIGFyZSBzdXBwcmVzc2VkLicsIHNlY3VyaXR5Q29uc2lkZXJhdGlvbnM6ICdDaXRhdGlvbnMgbXVzdCBub3QgZXhwb3NlIHJlc3RyaWN0ZWQgYXJ0aWNsZXMgdG8gdW5hdXRob3JpemVkIGFnZW50cy4nIH0gfSxcbiAgICB7IGtleTogJ3JlcVBISScsIHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnTm8gUEhJIG9yIGN1c3RvbWVyIGRhdGEgbWF5IGxlYXZlIGFwcHJvdmVkIHN5c3RlbXMnLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdtYXJrJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IGFjY2VwdGFuY2VDcml0ZXJpYTogJ0RhdGEgZmxvdyBkaWFncmFtIGFwcHJvdmVkIGJ5IHNlY3VyaXR5OyBETFAgc2NhbiBvZiBwaXBlbGluZSBvdXRwdXQgc2hvd3MgemVybyBQSEkuJywgc2VjdXJpdHlDb25zaWRlcmF0aW9uczogJ0Jsb2NraW5nIHJlcXVpcmVtZW50IGZvciBhbnkgZXh0ZXJuYWwgQUkgc2VydmljZS4nIH0gfSxcbiAgICB7IGtleTogJ3JlcUZyZXNobmVzcycsIHR5cGU6ICdyZXF1aXJlbWVudCcsIHRpdGxlOiAnS25vd2xlZGdlIGluZGV4IHJlZnJlc2hlcyB3aXRoaW4gMjRoIG9mIGFydGljbGUgdXBkYXRlcycsIHN0YXR1czogJ2JhY2tsb2cnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgZXh0cmE6IHsgYWNjZXB0YW5jZUNyaXRlcmlhOiAnQXJ0aWNsZSBlZGl0ZWQgaW4gc291cmNlIHN5c3RlbSBhcHBlYXJzIGluIHJldHJpZXZhbCByZXN1bHRzIHdpdGhpbiAyNCBob3Vycy4nIH0gfSxcblxuICAgIC8vIFRhc2tzXG4gICAgeyBrZXk6ICd0YXNrRXhwb3J0JywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0J1aWxkIFNhbGVzZm9yY2Uga25vd2xlZGdlIGFydGljbGUgZXhwb3J0IHNjcmlwdCcsIHN0YXR1czogJ2RvbmUnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ2pvaG4nLCBtaWxlc3RvbmU6ICdtMScsIGJvZHlUZXh0OiAnRXhwb3J0IGFsbCBwdWJsaXNoZWQgS0FzIHdpdGggbWV0YWRhdGEgdG8gc3RydWN0dXJlZCBmaWxlcy4nIH0sXG4gICAgeyBrZXk6ICd0YXNrQ2xlYW4nLCB0eXBlOiAndGFzaycsIHRpdGxlOiAnSFRNTFx1MjE5MmNsZWFuIHRleHQgbm9ybWFsaXphdGlvbiBmb3IgZXhwb3J0ZWQgYXJ0aWNsZXMnLCBzdGF0dXM6ICdpbl9wcm9ncmVzcycsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnam9obicsIG1pbGVzdG9uZTogJ20yJywgZHVlRGF0ZTogJzIwMjYtMDctMjQnIH0sXG4gICAgeyBrZXk6ICd0YXNrRXZhbCcsIHR5cGU6ICd0YXNrJywgdGl0bGU6ICdEcmFmdCBhbnN3ZXItcXVhbGl0eSBldmFsdWF0aW9uIHJ1YnJpYycsIHN0YXR1czogJ3RvZG8nLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnbWFyaycsIG1pbGVzdG9uZTogJ20yJywgZHVlRGF0ZTogJzIwMjYtMDctMzEnIH0sXG4gICAgeyBrZXk6ICd0YXNrSW52ZW50b3J5JywgdHlwZTogJ3Rhc2snLCB0aXRsZTogJ0ludmVudG9yeSBjYW5kaWRhdGUga25vd2xlZGdlIGRvbWFpbnMgYW5kIGFydGljbGUgY291bnRzJywgc3RhdHVzOiAnZG9uZScsIHByaW9yaXR5OiAnbWVkaXVtJywgb3duZXI6ICdqb2huJywgbWlsZXN0b25lOiAnbTEnIH0sXG5cbiAgICAvLyBBY2Nlc3MgcmVxdWVzdHNcbiAgICB7IGtleTogJ2FjY1NmQXBpJywgdHlwZTogJ2FjY2VzcycsIHRpdGxlOiAnU2FsZXNmb3JjZSBBUEkgYWNjZXNzIChLbm93bGVkZ2Ugb2JqZWN0LCByZWFkKScsIHN0YXR1czogJ3JlcXVlc3RlZCcsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdqb2huJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IHN5c3RlbTogJ1NhbGVzZm9yY2UgU2VydmljZSBDbG91ZCcsIGFjY2Vzc1R5cGU6ICdBUEkgcmVhZCAoS25vd2xlZGdlIG9iamVjdCknLCBidXNpbmVzc1JlYXNvbjogJ0F1dG9tYXRlZCBleHBvcnQgb2Yga25vd2xlZGdlIGFydGljbGVzIGZvciB0aGUgaW5nZXN0aW9uIHBpcGVsaW5lLicsIHJlcXVlc3RlZEZyb206ICdTYWxlc2ZvcmNlIHBsYXRmb3JtIHRlYW0nLCByZXF1ZXN0RGF0ZTogJzIwMjYtMDYtMzAnLCBuZXh0QWN0aW9uOiAnRm9sbG93IHVwIHdpdGggcGxhdGZvcm0gdGVhbSBsZWFkJywgZm9sbG93VXBEYXRlOiAnMjAyNi0wNy0xNScgfSB9LFxuICAgIHsga2V5OiAnYWNjQXp1cmUnLCB0eXBlOiAnYWNjZXNzJywgdGl0bGU6ICdBenVyZSBPcGVuQUkgc2VydmljZSBwcm92aXNpb25pbmcgaW4gTWNLZXNzb24gdGVuYW50Jywgc3RhdHVzOiAndW5kZXJfcmV2aWV3JywgcHJpb3JpdHk6ICd1cmdlbnQnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgc3lzdGVtOiAnQXp1cmUgT3BlbkFJIChNY0tlc3NvbiB0ZW5hbnQpJywgYWNjZXNzVHlwZTogJ1Jlc291cmNlIHByb3Zpc2lvbmluZyArIEFQSSBrZXlzJywgYnVzaW5lc3NSZWFzb246ICdBcHByb3ZlZC10ZW5hbnQgTExNIHJlcXVpcmVkIGZvciBhbnN3ZXIgZ2VuZXJhdGlvbiB3aXRob3V0IGRhdGEgZWdyZXNzLicsIHJlcXVlc3RlZEZyb206ICdDbG91ZCBwbGF0Zm9ybSAvIHNlY3VyaXR5JywgcmVxdWVzdERhdGU6ICcyMDI2LTA2LTIyJywgbmV4dEFjdGlvbjogJ1NlY3VyaXR5IHJldmlldyBtZWV0aW5nJywgZm9sbG93VXBEYXRlOiAnMjAyNi0wNy0xOCcgfSB9LFxuICAgIHsga2V5OiAnYWNjU3AnLCB0eXBlOiAnYWNjZXNzJywgdGl0bGU6ICdTaGFyZVBvaW50IHNpdGUgZm9yIHBpbG90IGRvY3VtZW50YXRpb24nLCBzdGF0dXM6ICdncmFudGVkJywgcHJpb3JpdHk6ICdsb3cnLCBvd25lcjogJ21hcmsnLCBleHRyYTogeyBzeXN0ZW06ICdTaGFyZVBvaW50IE9ubGluZScsIGFjY2Vzc1R5cGU6ICdTaXRlIG93bmVyJywgYnVzaW5lc3NSZWFzb246ICdTaGFyZWQgZG9jdW1lbnRhdGlvbiBhbmQgcGlsb3QgYXJ0aWZhY3RzLicsIHJlcXVlc3RlZEZyb206ICdJVCBzZXJ2aWNlIGRlc2snLCByZXF1ZXN0RGF0ZTogJzIwMjYtMDYtMTAnLCBhcHByb3ZlZEJ5OiAnSVQgc2VydmljZSBkZXNrJywgZGF0ZUdyYW50ZWQ6ICcyMDI2LTA2LTEyJyB9IH0sXG5cbiAgICAvLyBEZWNpc2lvbnNcbiAgICB7IGtleTogJ2RlY1RlbmFudCcsIHR5cGU6ICdkZWNpc2lvbicsIHRpdGxlOiAnVXNlIHRlbmFudC1ob3N0ZWQgQXp1cmUgT3BlbkFJLCBub3QgcHVibGljIEFQSXMnLCBzdGF0dXM6ICdhcHByb3ZlZCcsIHByaW9yaXR5OiAnaGlnaCcsIG93bmVyOiAnbWFyaycsIGxlYWRlcnNoaXBWaXNpYmxlOiB0cnVlLCBleHRyYTogeyBjb250ZXh0OiAnQW5zd2VyIGdlbmVyYXRpb24gbmVlZHMgYW4gTExNLiBQdWJsaWMgQUkgQVBJcyBhcmUgdW5hcHByb3ZlZCBmb3IgaW50ZXJuYWwgZGF0YS4nLCBwcm9ibGVtOiAnV2hpY2ggTExNIGhvc3RpbmcgcGF0aCBzYXRpc2ZpZXMgc2VjdXJpdHkgd2hpbGUgdW5ibG9ja2luZyB0aGUgcGlsb3Q/Jywgb3B0aW9uczogW3sgdGl0bGU6ICdQdWJsaWMgQVBJIChPcGVuQUkvQW50aHJvcGljIGRpcmVjdCknLCBub3RlczogJ0Zhc3QgYnV0IHVuYXBwcm92ZWQgZm9yIGludGVybmFsIGRhdGEnLCBzZWxlY3RlZDogZmFsc2UgfSwgeyB0aXRsZTogJ0F6dXJlIE9wZW5BSSBpbiBNY0tlc3NvbiB0ZW5hbnQnLCBub3RlczogJ0RhdGEgc3RheXMgaW4gdGVuYW50OyBwcm9jdXJlbWVudCArIHByb3Zpc2lvbmluZyByZXF1aXJlZCcsIHNlbGVjdGVkOiB0cnVlIH0sIHsgdGl0bGU6ICdMb2NhbCBvcGVuLXdlaWdodHMgbW9kZWwnLCBub3RlczogJ05vIGVncmVzcyBidXQgd2Vha2VyIHF1YWxpdHkgYW5kIGhlYXZ5IGluZnJhJywgc2VsZWN0ZWQ6IGZhbHNlIH1dLCByZWFzb25pbmc6ICdUZW5hbnQgaG9zdGluZyBrZWVwcyBkYXRhIGluc2lkZSBhcHByb3ZlZCBib3VuZGFyeSBhbmQgaGFzIGFuIGV4aXN0aW5nIGVudGVycHJpc2UgYWdyZWVtZW50IHBhdGguJywgdHJhZGVvZmZzOiAnU2xvd2VyIHN0YXJ0OyBjYXBhY2l0eSBxdW90YXM7IG1vZGVsIGF2YWlsYWJpbGl0eSBsYWdzIHB1YmxpYyBBUElzLicgfSB9LFxuICAgIHsga2V5OiAnZGVjRG9tYWluJywgdHlwZTogJ2RlY2lzaW9uJywgdGl0bGU6ICdQaWxvdCBzY29wZTogc3RhcnQgd2l0aCBvbmUgaGlnaC12b2x1bWUga25vd2xlZGdlIGRvbWFpbicsIHN0YXR1czogJ2Rpc2N1c3NpbmcnLCBwcmlvcml0eTogJ21lZGl1bScsIG93bmVyOiAnam9obicsIGV4dHJhOiB7IGNvbnRleHQ6ICdLbm93bGVkZ2UgYmFzZSBzcGFucyBtYW55IHByb2R1Y3QgYXJlYXMgd2l0aCB1bmV2ZW4gcXVhbGl0eS4nLCBwcm9ibGVtOiAnUGlsb3QgZXZlcnl0aGluZyBvciBvbmUgZG9tYWluIGZpcnN0PycsIG9wdGlvbnM6IFt7IHRpdGxlOiAnU2luZ2xlIGRvbWFpbiBwaWxvdCcsIG5vdGVzOiAnQ2xlYW5lciBtZWFzdXJlbWVudCwgZmFzdGVyIGl0ZXJhdGlvbicsIHNlbGVjdGVkOiB0cnVlIH0sIHsgdGl0bGU6ICdBbGwgZG9tYWlucyBhdCBvbmNlJywgbm90ZXM6ICdCcm9hZGVyIGltcGFjdCwgZGlsdXRlZCBxdWFsaXR5IHNpZ25hbCcsIHNlbGVjdGVkOiBmYWxzZSB9XSwgcmVhc29uaW5nOiAnU2luZ2xlLWRvbWFpbiBnaXZlcyBhIGNsZWFuIGFjY3VyYWN5IGJhc2VsaW5lIGFuZCBjb250YWluYWJsZSByZXZpZXcgbG9hZC4nIH0gfSxcblxuICAgIC8vIFJpc2tzXG4gICAgeyBrZXk6ICdyaXNrUXVhbGl0eScsIHR5cGU6ICdyaXNrJywgdGl0bGU6ICdLbm93bGVkZ2UgYXJ0aWNsZSBxdWFsaXR5IHRvbyBsb3cgZm9yIGdyb3VuZGVkIGFuc3dlcnMnLCBzdGF0dXM6ICdvcGVuJywgcHJpb3JpdHk6ICdoaWdoJywgb3duZXI6ICdqb2huJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IGxpa2VsaWhvb2Q6ICdtZWRpdW0nLCBpbXBhY3Q6ICdoaWdoJywgbWl0aWdhdGlvbjogJ1F1YWxpdHkgYXVkaXQgb2YgdGhlIHBpbG90IGRvbWFpbiBiZWZvcmUgaW5kZXhpbmc7IGFydGljbGUgY2xlYW51cCBiYWNrbG9nIHdpdGggdGhlIGtub3dsZWRnZSB0ZWFtLicgfSB9LFxuICAgIHsga2V5OiAncmlza0FjY2VzcycsIHR5cGU6ICdyaXNrJywgdGl0bGU6ICdBY2Nlc3MgYXBwcm92YWxzIHNsaXAgYW5kIHN0YWxsIHRoZSBwaXBlbGluZSBidWlsZCcsIHN0YXR1czogJ21pdGlnYXRpbmcnLCBwcmlvcml0eTogJ2hpZ2gnLCBvd25lcjogJ21hcmsnLCBsZWFkZXJzaGlwVmlzaWJsZTogdHJ1ZSwgZXh0cmE6IHsgbGlrZWxpaG9vZDogJ2hpZ2gnLCBpbXBhY3Q6ICdoaWdoJywgbWl0aWdhdGlvbjogJ1dlZWtseSBmb2xsb3ctdXBzOyBsZWFkZXJzaGlwIGVzY2FsYXRpb24gcGF0aCBhZ3JlZWQ7IGJ1aWxkIHBpcGVsaW5lIGFnYWluc3QgZXhwb3J0ZWQgc2FtcGxlIGRhdGEgbWVhbndoaWxlLicgfSB9LFxuXG4gICAgLy8gQmxvY2tlcnNcbiAgICB7IGtleTogJ2Jsa0F6dXJlJywgdHlwZTogJ2Jsb2NrZXInLCB0aXRsZTogJ0Nhbm5vdCBnZW5lcmF0ZSBhbnN3ZXJzIHVudGlsIEF6dXJlIE9wZW5BSSBpcyBwcm92aXNpb25lZCcsIHN0YXR1czogJ2FjdGl2ZScsIHByaW9yaXR5OiAndXJnZW50Jywgb3duZXI6ICdtYXJrJywgbGVhZGVyc2hpcFZpc2libGU6IHRydWUsIGV4dHJhOiB7IHdhaXRpbmdPbjogJ0Nsb3VkIHBsYXRmb3JtIHRlYW0gLyBzZWN1cml0eSByZXZpZXcnLCBzaW5jZTogJzIwMjYtMDYtMjInIH0gfSxcblxuICAgIC8vIE1lZXRpbmdcbiAgICB7IGtleTogJ210Z0tpY2tvZmYnLCB0eXBlOiAnbWVldGluZycsIHRpdGxlOiAnU3VwcG9ydCBBSSBraWNrb2ZmIHdpdGgga25vd2xlZGdlIGxlYWRlcnNoaXAnLCBzdGF0dXM6ICdzdW1tYXJpemVkJywgb3duZXI6ICdqb2huJywgZXh0cmE6IHsgZGF0ZTogJzIwMjYtMDYtMTgnLCB0aW1lOiAnMTA6MDAgQU0nLCBhdHRlbmRlZXM6IFsnSm9obicsICdNYXJrJywgJ0FsbGVuJywgJ0dlb3JnZSddLCBwdXJwb3NlOiAnQWxpZ24gb24gcGlsb3Qgc2NvcGUsIGFjY2VzcyBuZWVkcywgYW5kIHN1Y2Nlc3MgbWVhc3VyZXMuJywgYWdlbmRhOiAnMS4gVmlzaW9uICAyLiBQaWxvdCBzY29wZSAgMy4gQWNjZXNzIHJlcXVlc3RzICA0LiBUaW1lbGluZScgfSwgYm9keVRleHQ6ICdBZ3JlZWQgdG8gc2luZ2xlLWRvbWFpbiBwaWxvdC4gQWxsZW4gdG8gc3BvbnNvciBhY2Nlc3MgcmVxdWVzdHMuIFN1Y2Nlc3MgPSBkZWZsZWN0aW9uIHJhdGUgKyBhZ2VudCBzYXRpc2ZhY3Rpb24uIE5leHQgY2hlY2staW4gaW4gNCB3ZWVrcy4nIH0sXG5cbiAgICAvLyBRdWVzdGlvbnMgLyBpZGVhcyAvIHJlc2VhcmNoXG4gICAgeyBrZXk6ICdxTWV0cmljcycsIHR5cGU6ICdxdWVzdGlvbicsIHRpdGxlOiAnV2hpY2ggZGVmbGVjdGlvbiBtZXRyaWMgZG9lcyBzdXBwb3J0IGxlYWRlcnNoaXAgYWxyZWFkeSB0cnVzdD8nLCBzdGF0dXM6ICdvcGVuJywgb3duZXI6ICdtYXJrJywgZXh0cmE6IHt9IH0sXG4gICAgeyBrZXk6ICdpZGVhVHJpYWdlJywgdHlwZTogJ2lkZWEnLCB0aXRsZTogJ0F1dG8tdHJpYWdlIGluYm91bmQgY2FzZXMgYnkga25vd2xlZGdlIGNvdmVyYWdlJywgc3RhdHVzOiAnYmFja2xvZycsIG93bmVyOiAnam9obicsIGJvZHlUZXh0OiAnSWYgcmV0cmlldmFsIGNvbmZpZGVuY2UgaXMgaGlnaCwgc3VnZ2VzdCBLQi1maXJzdCByZXNwb25zZSBiZWZvcmUgaHVtYW4gdHJpYWdlLicgfSxcbiAgICB7IGtleTogJ3Jlc1JhZycsIHR5cGU6ICdyZXNlYXJjaCcsIHRpdGxlOiAnUmV0cmlldmFsIHN0cmF0ZWd5IGNvbXBhcmlzb246IGh5YnJpZCB2cyBwdXJlIHZlY3RvcicsIHN0YXR1czogJ2luX3Byb2dyZXNzJywgb3duZXI6ICdqb2huJywgYm9keVRleHQ6ICdFYXJseSByZXN1bHQ6IGh5YnJpZCAoQk0yNSArIHZlY3Rvcikgbm90aWNlYWJseSBiZXR0ZXIgb24gcHJvZHVjdC1jb2RlIHF1ZXJpZXMuJyB9LFxuICBdO1xuXG4gIGNvbnN0IGNyZWF0ZWQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IHMgb2YgaXRlbXMpIHtcbiAgICBjb25zdCBpdGVtID0gc3RvcmUuY3JlYXRlSXRlbSh7XG4gICAgICB0eXBlOiBzLnR5cGUsXG4gICAgICB0aXRsZTogcy50aXRsZSxcbiAgICAgIHN0YXR1czogcy5zdGF0dXMsXG4gICAgICBwcmlvcml0eTogcy5wcmlvcml0eSA/PyAnbm9uZScsXG4gICAgICBvd25lcklkOiBzLm93bmVyID8/IG51bGwsXG4gICAgICBtaWxlc3RvbmVJZDogcy5taWxlc3RvbmUgPyBtaWxlc3RvbmVJZFtzLm1pbGVzdG9uZV0gOiBudWxsLFxuICAgICAgZHVlRGF0ZTogcy5kdWVEYXRlID8/IG51bGwsXG4gICAgICB0YWdzOiBzLnRhZ3MgPz8gW10sXG4gICAgICBleHRyYTogcy5leHRyYSA/PyB7fSxcbiAgICAgIGxlYWRlcnNoaXBWaXNpYmxlOiBzLmxlYWRlcnNoaXBWaXNpYmxlID8gMSA6IDAsXG4gICAgICBib2R5VGV4dDogcy5ib2R5VGV4dCA/PyAnJyxcbiAgICAgIGJvZHk6IHMuYm9keVRleHQgPyB0ZXh0RG9jKHMuYm9keVRleHQpIDogJycsXG4gICAgICBzYW1wbGU6IDEsXG4gICAgfSk7XG4gICAgY3JlYXRlZC5zZXQocy5rZXksIGl0ZW0uaWQpO1xuICB9XG5cbiAgY29uc3QgbGluayA9IChhOiBzdHJpbmcsIGI6IHN0cmluZywga2luZDogUGFyYW1ldGVyczxTdG9yZVsnYWRkTGluayddPlsyXSkgPT4ge1xuICAgIGNvbnN0IGZyb21JZCA9IGNyZWF0ZWQuZ2V0KGEpO1xuICAgIGNvbnN0IHRvSWQgPSBjcmVhdGVkLmdldChiKTtcbiAgICBpZiAoZnJvbUlkICYmIHRvSWQpIHN0b3JlLmFkZExpbmsoZnJvbUlkLCB0b0lkLCBraW5kKTtcbiAgfTtcblxuICBsaW5rKCd0YXNrQ2xlYW4nLCAnZmVhdEluZ2VzdCcsICdpbXBsZW1lbnRzJyk7XG4gIGxpbmsoJ3Rhc2tFeHBvcnQnLCAnZmVhdEluZ2VzdCcsICdpbXBsZW1lbnRzJyk7XG4gIGxpbmsoJ3JlcUNpdGF0aW9ucycsICdmZWF0QW5zd2VyJywgJ3N1cHBvcnRzJyk7XG4gIGxpbmsoJ3JlcVBISScsICdmZWF0QW5zd2VyJywgJ3N1cHBvcnRzJyk7XG4gIGxpbmsoJ3JlcUZyZXNobmVzcycsICdmZWF0SW5nZXN0JywgJ3N1cHBvcnRzJyk7XG4gIGxpbmsoJ2ZlYXRBbnN3ZXInLCAnZGVjVGVuYW50JywgJ3NoYXBlZF9ieScpO1xuICBsaW5rKCdmZWF0QW5zd2VyJywgJ2FjY0F6dXJlJywgJ3JlcXVpcmVzX2FjY2VzcycpO1xuICBsaW5rKCdmZWF0SW5nZXN0JywgJ2FjY1NmQXBpJywgJ3JlcXVpcmVzX2FjY2VzcycpO1xuICBsaW5rKCdibGtBenVyZScsICdmZWF0QW5zd2VyJywgJ2Jsb2NrcycpO1xuICBsaW5rKCdkZWNEb21haW4nLCAnbXRnS2lja29mZicsICdkaXNjdXNzZWRfaW4nKTtcbiAgbGluaygncmlza0FjY2VzcycsICdhY2NBenVyZScsICdyZWxhdGVzJyk7XG5cbiAgcmV0dXJuIGl0ZW1zLmxlbmd0aDtcbn1cblxuLyoqIE1pbmltYWwgcmljaC1kb2Mgd3JhcHBlciBmb3Igc2VlZCBib2R5IHRleHQgKG9uZSBwYXJhZ3JhcGgpLiAqL1xuZnVuY3Rpb24gdGV4dERvYyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiAnZG9jJywgY29udGVudDogW3sgdHlwZTogJ3BhcmFncmFwaCcsIGNvbnRlbnQ6IFt7IHR5cGU6ICd0ZXh0JywgdGV4dCB9XSB9XSB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSx1QkFBcUI7QUFDckIsb0JBQW1CO0FBQ25CLElBQUFBLGtCQUFlO0FBQ2YsSUFBQUMsb0JBQWlCO0FBQ2pCLHFCQUFlOzs7QUNSZiw0QkFBcUI7QUFDckIsdUJBQWlCO0FBQ2pCLHFCQUFlO0FBQ2YseUJBQW1COzs7QUNNWixJQUFNLGFBQTBCO0FBQUEsRUFDckM7QUFBQSxJQUNFLFNBQVM7QUFBQSxJQUNULE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtB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RixnQkFBQUEsUUFBTyxNQUFNLFFBQVEsUUFBUSxDQUFDO0FBRTlCLFFBQU0sWUFBWSxRQUFRLE9BQU8sQ0FBQyxNQUFNLE1BQU0sU0FBUyxFQUFFLEVBQUUsRUFBRSxTQUFTLENBQUM7QUFDdkUsZ0JBQUFBLFFBQU8sR0FBRyxVQUFVLFNBQVMsQ0FBQztBQUU5QixRQUFNLFVBQVUsTUFBTSxpQkFBaUI7QUFDdkMsZ0JBQUFBLFFBQU8sTUFBTSxTQUFTLENBQUM7QUFDdkIsZ0JBQUFBLFFBQU8sTUFBTSxNQUFNLFVBQVUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxhQUFhLEtBQUssTUFBTSxHQUFHLEdBQUcsRUFBRSxRQUFRLENBQUM7QUFDbkYsTUFBSSxHQUFHLE1BQU07QUFDZixDQUFDO0FBQUEsSUFFRCx1QkFBSyxtREFBbUQsTUFBTTtBQUM1RCxRQUFNLE1BQU0sSUFBSSxTQUFTO0FBQ3pCLFFBQU0sTUFBTSxhQUFhLEdBQUc7QUFDNUIsTUFBSSxHQUFHLE1BQU07QUFFYixRQUFNLFNBQVMsa0JBQUFGLFFBQUssS0FBSyxLQUFLLFdBQVc7QUFDekMsUUFBTSxLQUFLLGdCQUFBRCxRQUFHLFNBQVMsUUFBUSxJQUFJO0FBQ25DLGtCQUFBQSxRQUFHLFVBQVUsSUFBSSxPQUFPLEtBQUssdUJBQXVCLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDL0Qsa0JBQUFBLFFBQUcsVUFBVSxFQUFFO0FBQ2YsZ0JBQUFHLFFBQU8sT0FBTyxNQUFNLGFBQWEsR0FBRyxHQUFHLHFDQUFxQztBQUM5RSxDQUFDOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImZzIiwgInBhdGgiLCAiRGF0YWJhc2UiLCAiY3J5cHRvIiwgImltcG9ydF9ub2RlX2NyeXB0byIsICJjcnlwdG8iLCAiaXRlbSIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImZzIiwgInBhdGgiLCAidG1wIiwgImZzIiwgInBhdGgiLCAib3MiLCAiYXNzZXJ0Il0KfQo=
