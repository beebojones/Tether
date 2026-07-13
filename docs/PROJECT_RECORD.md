# Tether — Living Project Record

*Last updated: 2026-07-12*

## Ownership

Tether is independent software — the personal intellectual property of John Crouch,
designed and developed entirely on his personal computer. It is not a McKesson
application, is not affiliated with McKesson, and nothing in its identity, metadata,
or branding implies ownership, sponsorship, endorsement, or official status by any
organization. Enterprise names appear only as editable project content (e.g. the
sample data) or in documentation describing the project currently being managed.

## Vision

Tether is a general-purpose collaborative project workspace and single source of
truth for a small team. It replaces scattered chats, emails, notes, and spreadsheets
with one fast desktop app shared across computers — tracking work, requirements,
decisions, risks, blockers, system-access requests, meetings, milestones, and
releases, and turning all of it into leadership-ready updates on demand.

**First project managed in Tether:** the Support AI initiative (John Crouch + Mark Bidinger).
"Support AI" is project content, not application identity — Tether stays reusable
for future projects.

## Users

- **John Crouch** — primary organizer, knowledge systems builder, support-domain
  expert. Needs powerful editing, organization, reporting, presentation.
- **Mark Bidinger** — technical collaborator. Needs a shared current view, full
  edit capability from his own computer.
- **Secondary** (exports only): Allen, George, Jessica, knowledge/support
  leadership, security and IT reviewers.

## Naming

Name: **Tether** — chosen by John (2026-07-12): the app that keeps two computers,
two people, and one project tied together. Earlier working name "Keystone" retired;
repo folder name is historical.

## Terminology (selected)

Umbrella noun: **Work Item**. Types with per-type ident sequences:

| Type | Prefix | Statuses |
|---|---|---|
| Task | TASK- | backlog → todo → in progress → in review → blocked → done / cancelled |
| Feature | FEAT- | (work statuses) |
| Requirement | REQ- | (work statuses) |
| User Story | STORY- | (work statuses) |
| Decision | DEC- | proposed / discussing / approved / rejected / revisit / superseded |
| Risk | RISK- | open / mitigating / accepted / closed |
| Blocker | BLK- | active / workaround / resolved |
| Access Request | ACC- | identified / not requested / preparing / requested / under review / info needed / approved / partially approved / granted / denied / expired / no longer needed |
| Meeting Note | MTG- | scheduled / held / summarized |
| Idea | IDEA- | (work statuses) |
| Open Question | Q- | open / answered / parked |
| Defect | DEF- | (work statuses) |
| Research | RES- | (work statuses) |

Rationale: "Work Item" is neutral and leadership-friendly; per-type prefixes make
IDs self-describing in conversation ("ACC-5 is still under review"). Canonical
identity is a UUID; the ident is display-level and can be renumbered safely on
sync collisions (references never break because links use UUIDs).

Link kinds: relates, blocks/blocked-by, implements, supports, shaped-by,
requires-access, discussed-in, validates, supersedes, parent/child.

## Architecture (selected)

- **Electron + React + TypeScript** desktop app (user-confirmed 2026-07-12).
  Chosen over PySide6/pywebview/Tauri because the Jira-grade editor requires
  ProseMirror-class web tech; MSVC present for native modules; NSIS per-user
  installer needs no admin rights.
- **SQLite (better-sqlite3, WAL)** local store per machine — always fully usable offline.
- **Op-log synchronization** over a shared folder (see SYNC_ARCHITECTURE.md).
- Main process owns all data access; renderer talks through a typed contextBridge
  IPC surface (contextIsolation on, nodeIntegration off, strict CSP in prod builds).
- FTS5 powers search; field-granular oplog powers sync, history, and audit.

## Design direction (working selection)

**Meridian** — Linear-class dark UI: deep neutral surfaces (#0D1017 base), indigo
accent (#6E8BFF), high density, subtle depth, crisp Lucide icons, Segoe UI Variable.
Alternatives presented (Graphite & Ember warm-dark, Aurora Glass, Slate Pro light)
remain open until John ratifies; all styling flows from `src/styles/tokens.css`
so a direction swap is a token change.

## Decisions log

| # | Date | Decision | Why |
|---|---|---|---|
| 1 | 2026-07-12 | Electron + React + TS (user-confirmed) | Editor fidelity; toolchain present; packaging |
| 2 | 2026-07-12 | better-sqlite3 over node:sqlite | Battle-tested; MSVC available; node:sqlite still experimental |
| 3 | 2026-07-12 | Folder-based op-log sync as v1 transport | Zero new services to approve; data stays in M365 tenant; SQLite file itself never shared |
| 4 | 2026-07-12 | Field-level LWW + surfaced conflicts for title/body | Silent scalar merges are fine; content merges must be human-reviewed |
| 5 | 2026-07-12 | Ident collisions resolved by smaller-UUID-keeps rule | Deterministic on both devices; converges without ping-pong (test-covered) |
| 6 | 2026-07-12 | Per-type ident prefixes (REQ-41, DEC-12) | Self-describing IDs in speech and reports |
| 7 | 2026-07-12 | UUID canonical identity, ident display-only | Renumbering never breaks links |
| 8 | 2026-07-12 | Tests run under Electron's Node (ELECTRON_RUN_AS_NODE) | Single native-module build for app + tests |
| 9 | 2026-07-12 | Ship both arm64 + x64 Windows installers | John's dev machine is Windows-on-ARM (Snapdragon); Mark's corporate laptop presumed x64. electron-builder rebuilds better-sqlite3 per arch during dist |

## Status

### Done
- Repo, toolchain, build scripts, typecheck clean
- Schema v1 + migration runner + pre-migration auto-backup + corruption quarantine
- Store DAL: items/links/comments/versions/activity/milestones/releases/views/users
- Oplog with lamport clocks + basedOn causality; FTS5 search
- Sync engine + FolderTransport; conflict surfacing + resolution (keep/use/merge)
- App shell: Meridian tokens, sidebar, topbar w/ sync pill, command palette (Ctrl+K)
- Views: Dashboard (live cards + explained project health), All Work (filters/group/sort),
  Board (drag between statuses), Roadmap (milestones/releases + progress), Access Tracker,
  Decisions, Meetings, Risks & Blockers, Reports (5 generated report types + copy/export),
  Activity feed, Conflicts review, Settings (identity/sync/sample data/backup), Onboarding
- Item detail: title/body autosave editing, type-specific structured fields, links,
  comments, attachments, activity, version snapshots + compare/restore
- Seeded Support AI sample project (23 items, linked, SAMPLE-flagged, one-click remove)
- 9 passing tests incl. two-device convergence, conflicts, ident collisions, offline queue

### Done (continued)
- Rich text editor (TipTap): full toolbar + bubble menu + slash menu, @mentions,
  smart links (REQ-1 → live chip), tables w/ row/col controls, 5 callout types,
  expandable sections, task lists, code blocks with a language dropdown,
  hyperlinks (add/edit/remove, Ctrl+K), text + highlight color pickers, image
  insert / drag-drop / paste (base64, syncs in the doc), find-in-document (Ctrl+F),
  full-screen editing, autosave with visible save state, version snapshot/compare/restore
- Meeting-note text→item conversion flow (convert selection to task/decision/risk/etc.)
- Presentation mode; leadership snapshot + deck + PDF exports
- Packaging (electron-builder NSIS, arm64 + x64) + update workflow docs

### Not started
- Relationship graph view (nice-to-have)
- DOCX/PPTX export renderers (HTML/PDF/deck exist)
- Image resize handles in the editor (images insert + display responsively today)

## Known limitations
- Body editor is plain-text v1 (doc format already rich-compatible)
- Sync latency = OneDrive/SharePoint file propagation (seconds to ~a minute typical)
- Attachment blobs sync on demand; very large files bounded at 100 MB
- No per-item permissions — the shared folder IS the access boundary (by design for a 2-person team)

## How to run

```
npm install
npm run rebuild      # once, builds better-sqlite3 for Electron
npm run dev          # dev app (Vite + Electron)
npm test             # data-layer + sync tests
npm run dist         # NSIS installer into release/
```

Data lives in `%APPDATA%/Tether/data/tether.db` (per user), backups in
`data/backups/`, settings in `settings.json` alongside.

## Identity decisions (ratified by John, 2026-07-12 evening)

| Decision | Choice |
|---|---|
| Theme | **Nocturne + Horizon's ember**: violet night surfaces, violet→ember brand gradient, ember floor glow in the ambient wash |
| Logo | **Bond** — two nodes, one taut line; white mark on violet→ember tile; `src/components/TetherMark.tsx`, icon at `build/icon.svg` → `build/icon.ico` (scripts/build-icon.mjs) |
| Fonts | **Space Grotesk** (display) + **Inter** (UI) + **Fira Code** (mono), bundled offline under `src/assets/fonts/` (SIL OFL) |
| App ID | **com.beebojones.tether** (confirmed) |
| Project name | Editable setting (Settings → Project); flows into reports, deck, snapshot, presentation. "Support AI" is the first project's name, not the app's |
