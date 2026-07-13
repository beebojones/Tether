# Tether — Collaborative Project Workspace

A desktop workspace and single source of truth for a small team's projects.
Tracks work items, requirements, decisions, risks, blockers, access requests,
meetings, milestones, and releases — shared between computers through a
folder-based sync (e.g. OneDrive/SharePoint), with leadership reports and a
presentation mode generated from live data.

Tether is independent software © John Crouch — not affiliated with, sponsored by,
or endorsed by any organization. The first project managed in Tether is the
Support AI initiative; "Support AI" is project content, not application identity.

## Quick start (development)

```bash
npm install
npm run rebuild     # once — builds better-sqlite3 against Electron
npm run dev         # Vite + Electron with hot reload
npm test            # data-layer + sync test suite
npm run dist        # Windows installer → release/
```

## Walkthrough

The product walkthrough is a static HTML presentation in
[`docs/walkthrough/index.html`](docs/walkthrough/index.html).

GitHub displays that file as source. To view it as the actual presentation,
run this from the repo:

```bash
npm run walkthrough
```

That starts a local server for `docs/walkthrough`, opens the page in your
browser, and picks an available port starting at `5200`.

## First run

1. Pick your identity (John / Mark / custom).
2. Optionally choose the shared sync folder (a OneDrive- or SharePoint-synced
   directory both users can reach). Skip it to work local-only; configure later
   in Settings.
3. Optionally load the sample Support AI project to explore. Every sample record
   is badged SAMPLE and removable in one click from Settings.

## Where data lives

| What | Where |
|---|---|
| Database | `%APPDATA%/Tether/data/tether.db` (SQLite, WAL) |
| Backups | `%APPDATA%/Tether/data/backups/` (auto before migrations + manual) |
| Attachments | `%APPDATA%/Tether/data/attachments/` (content-addressed) |
| Settings | `%APPDATA%/Tether/settings.json` (no secrets) |
| Shared sync data | `<your shared folder>/ops/…` and `/blobs/…` (JSONL change files) |

The app makes **no network calls of its own** — synchronization rides entirely on
the OneDrive/SharePoint client. See `docs/SECURITY.md`.

## How sync works

Tether is local-first. Each computer has its own private SQLite database under
`%APPDATA%/Tether`; the SQLite file is never placed in OneDrive or SharePoint.
When someone edits a work item, Tether records that change as a field-level
operation in a local oplog, then publishes immutable JSONL batches into the
chosen shared folder:

```text
<shared folder>/ops/<deviceId>/000000000042.jsonl
<shared folder>/ops/<deviceId>/device.json
<shared folder>/blobs/<sha-prefix>/<sha256>
```

Each device only writes to its own `ops/<deviceId>/` directory. Other devices
read those batches, skip any operation they have already seen, and replay new
operations into their own local database. If the shared folder is unavailable,
edits queue locally and flush when the folder comes back.

Conflicts are handled in the app rather than silently overwriting text. Scalar
fields like status or priority settle by last-writer-wins using Lamport clocks.
Concurrent title/body edits are preserved in the Conflicts view so the user can
keep one version or merge by hand. Display IDs such as `TASK-12` are display-only;
UUIDs are canonical, so deterministic renumbering cannot break links.

## Why not Neon/Postgres?

Neon or another hosted Postgres service would be a good technical fit for a
public demo or a fully approved cloud deployment, but it is intentionally not the
v1 sync path for Tether:

- Project data may belong inside an employer-managed M365 tenant. A third-party
  hosted database can move that data outside the approved boundary.
- Neon would require credentials, network calls, service provisioning, access
  review, backup/retention decisions, and a different operational model.
- Offline-first behavior would still require a local cache and merge layer, so a
  server database would not remove the hardest part of sync.
- The shared-folder oplog works with infrastructure the users may already have:
  OneDrive or SharePoint handles transport, ACLs, audit, encryption, retention,
  and DLP, while Tether keeps the merge/audit logic local and inspectable.

The sync layer is abstracted behind a transport interface, so a future approved
backend such as Azure SQL, an internal API, or Postgres can reuse the same oplog
and merge rules. See [`docs/SYNC_ARCHITECTURE.md`](docs/SYNC_ARCHITECTURE.md)
for the fuller design.

## Keyboard

- `Ctrl+K` — search / command palette
- `Alt+←` — back
- In the editor: `/` block menu, `@` mention, type `REQ-1 ` to smart-link an item,
  markdown shortcuts (`# `, `- `, `1. `, `> `, `` ``` ``), `Ctrl+B/I/U`

## Documentation

- [`docs/PROJECT_RECORD.md`](docs/PROJECT_RECORD.md) — living record: vision, decisions, status, limitations
- [`docs/SYNC_ARCHITECTURE.md`](docs/SYNC_ARCHITECTURE.md) — sync design + option ranking + migration path
- [`docs/SECURITY.md`](docs/SECURITY.md) — security review document
- [`docs/RELEASING.md`](docs/RELEASING.md) — build, release, and update workflow
- [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) — day-to-day usage
- [`docs/walkthrough/index.html`](docs/walkthrough/index.html) — static product walkthrough / presentation
