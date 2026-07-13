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

## Keyboard

- `Ctrl+K` — search / command palette
- `Alt+←` — back
- In the editor: `/` block menu, `@` mention, type `REQ-1 ` to smart-link an item,
  markdown shortcuts (`# `, `- `, `1. `, `> `, `` ``` ``), `Ctrl+B/I/U`

## Documentation

- `docs/PROJECT_RECORD.md` — living record: vision, decisions, status, limitations
- `docs/SYNC_ARCHITECTURE.md` — sync design + option ranking + migration path
- `docs/SECURITY.md` — security review document
- `docs/RELEASING.md` — build, release, and update workflow
- `docs/USER_GUIDE.md` — day-to-day usage
- `docs/walkthrough/index.html` — static product walkthrough / presentation

Open the walkthrough locally with:

```bash
npm run walkthrough
```
