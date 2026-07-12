# Synchronization Architecture

## Requirement

John and Mark, two McKesson computers, same project, near-real-time sharing,
no silent overwrites, enterprise-acceptable data location, offline-safe.

## Options evaluated

| Option | Security/data location | Approval burden | Real-time | Offline | Conflicts | Verdict |
|---|---|---|---|---|---|---|
| **Shared-folder op-log (OneDrive/SharePoint)** | Data stays in McKesson M365 tenant, existing DLP/audit applies | None beyond a shared folder | Near-real-time (file sync latency) | Excellent (local-first) | Handled in app (LWW + review) | **Selected v1** |
| Azure SQL / Azure App Service API | Tenant cloud, strong | Provisioning + security review + cost | Yes | Needs cache layer | Server-side possible | **Best production upgrade** — requires internal review |
| Dataverse / Microsoft Lists | M365 tenant | License + env provisioning; Lists too weak for rich relational data | Moderate | Weak | Weak | Not recommended for this data model |
| SQL Server on-prem | Internal | DBA + network access requests | Yes | Needs cache | Server-side | Viable but heavyweight for 2 users |
| Neon / external Postgres | **Data leaves McKesson** | Unlikely approvable for internal project data | Yes | Needs cache | Yes | **Not recommended** (works for out-of-tenant demos only) |
| SQLite file directly in OneDrive | n/a | None | — | — | — | **Rejected**: WAL/locking over file sync corrupts databases |
| Git-based sync | Depends on host | GitHub Enterprise approval | Poor UX | Good | Manual | Rejected — wrong tool for app data |

**Classification** (per product principles): shared-folder op-log = *technically
possible + likely enterprise-friendly* (uses only already-approved OneDrive/SharePoint);
Azure SQL = *requires internal review*; Neon/external SaaS = *not recommended* for
real project data. Nothing here is claimed McKesson-**approved** — no approval
evidence exists yet; see SECURITY.md for the review package.

## Selected design: local-first + append-only op-log over a synced folder

Each machine owns a private SQLite database (WAL). Every mutation is written as a
**field-granular operation** to a local oplog with:

- `opId` (uuid), `deviceId`, `actorId`
- `lamport` logical clock (ticks on every local op; fast-forwards on import)
- `basedOn` — for each field set, the (lamport, deviceId) the writer *observed*,
  which lets the importer distinguish clean sequential updates from true
  concurrent edits without vector clocks

### Shared folder layout

```
<shared>/ops/<deviceId>/000000000042.jsonl   # immutable op batches (one JSON op/line)
<shared>/ops/<deviceId>/device.json          # presence: device id, user, last seen
<shared>/blobs/<aa>/<sha256>                 # content-addressed attachments
```

**A device only ever writes inside its own `ops/<deviceId>/` directory.** Batches
are written to a temp name and renamed, so readers never observe partial files.
This eliminates the entire shared-file-locking/corruption class that makes "SQLite
on OneDrive" unsafe — the database file never crosses the wire.

### Merge rules

1. Duplicate ops (seen `opId`) are skipped — idempotent imports.
2. `create` inserts if the UUID is new.
3. `set`: per field —
   - no local clock → apply;
   - `basedOn` matches local clock → clean causal update, apply silently;
   - otherwise **concurrent**: winner = higher (lamport, deviceId). For content
     fields (`title`, `body`) the losing value is preserved in `sync_conflicts`
     and surfaced in the Conflicts view (keep mine / use theirs / merge by hand).
     Scalar fields (status, dates, owner…) settle by LWW silently.
4. `delete` = soft delete (tombstone rows keep history intact).
5. Display idents (TASK-12): collision between different UUIDs resolves by the
   deterministic *smaller-UUID-keeps-the-ident* rule; the loser is renumbered and
   the renumber is broadcast. Both devices compute the identical outcome
   (covered by `tests/core.test.ts`).

### Failure behavior

- Folder unreachable → engine reports **offline**, ops queue locally, auto-flush on return.
- Partially synced/unreadable batch → skipped this cycle, retried next (cursor not advanced).
- App fully usable with sync disabled (local-only mode is a first-class configuration).

### Transport abstraction

`SyncTransport` (publish/list/fetch/announce/blobs) is the only surface the engine
touches. The production-upgrade path is an `AzureSqlTransport` or internal-API
transport implementing the same five methods — zero changes to merge logic or UI.

## Migration path

1. **Now (dev/demo/local):** local-only mode — no folder needed.
2. **v1 production:** OneDrive/SharePoint shared folder both users can reach.
3. **Later (if the team grows / IT prefers):** Azure SQL or internal API transport
   after McKesson review; oplog replays into the new backend, so migration is an
   export/import, not a rewrite.
