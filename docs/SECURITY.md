# Security Review Document — Keystone

*For McKesson security / IT reviewers. Last updated 2026-07-12.*

## What data is stored

Project-management records for the Support AI initiative: work items, requirements,
decisions, risks, blockers, access-request tracking (metadata about access — never
credentials), meeting notes, comments, attachments, and change history. No PHI, no
customer data, no credentials are intended or required to be stored.

## Where it is stored

- **Local:** SQLite database at `%APPDATA%/supportai-keystone/data/keystone.db`
  on each user's McKesson-managed machine. Backups in `data/backups/`.
- **Shared (only when sync is configured):** JSON change files and attachment blobs
  in a OneDrive/SharePoint-synced folder chosen by the users — i.e., inside the
  McKesson Microsoft 365 tenant, inheriting its encryption at rest, DLP, retention,
  and audit controls.
- **Nowhere else.** The application makes **zero network calls of its own** — no
  telemetry, no analytics, no update pings, no external APIs, no AI services.
  Transport security is entirely delegated to the OneDrive/SharePoint client.

## How it is transmitted

The app itself performs no transmission. It reads/writes files in a local folder;
Microsoft's sync client moves them within the tenant (TLS in transit, AES at rest,
per Microsoft 365 platform guarantees).

## Who can access it

Whoever can open the shared folder. Access control **is** the folder's ACL
(SharePoint/OneDrive sharing) — deliberately reusing the enterprise's existing,
audited permission system rather than inventing a parallel one for a two-person team.
Every record carries created-by / updated-by and a full field-level change history
(oplog), providing per-user auditability.

## Third-party components

Electron, React, better-sqlite3, zustand, lucide-react, TipTap (editor), Vite/esbuild
(build-time only). All open-source, npm-sourced, lockfile-pinned. No SaaS services.

## Application hardening

- `contextIsolation: true`, `nodeIntegration: false`; renderer reaches the system
  only through an explicit, typed IPC allowlist.
- Strict CSP injected into production builds (`default-src 'self'`; no remote script/img/font).
- External links open in the system browser; in-app navigation to non-app URLs blocked.
- `shell.openPath` restricted to files inside the app's own data directory.
- Attachments are content-addressed (SHA-256) and integrity-verified on transfer;
  100 MB cap; never executed, only opened via the OS default handler at user request.
- Database: WAL journaling, `quick_check` on open, corrupt files quarantined (never
  written to), automatic backup before every schema migration.
- No secrets exist in the app; nothing sensitive is logged; settings file contains
  only display identity, theme, and the sync folder path.

## What requires McKesson approval (honest list)

| Item | Status |
|---|---|
| Running an unsigned internal tool on managed machines | May require exception/allowlisting depending on endpoint policy |
| A shared OneDrive/SharePoint folder for the two users | Standard M365 sharing — normally self-service |
| Any future Azure SQL / internal API sync backend | Requires provisioning + security review |
| Any future AI-assisted features (summarization etc.) | **Not implemented**; would require approved tenant AI service first |
| Code signing certificate for the installer | Recommended before broad distribution |

## Remaining risks

- Installer is unsigned until a signing cert is available (SmartScreen warning; mitigated
  by documented hash verification in the release workflow).
- A user could point the sync folder at a personal/non-tenant location — mitigated by
  documentation and the Settings screen displaying the folder prominently; a
  domain-restriction guard is a candidate hardening item.
- Electron/Chromium CVE cadence requires periodic dependency bumps (documented in
  the release checklist).

## How to review

Everything is local and inspectable: source in this repo; runtime files under
`%APPDATA%/supportai-keystone/`; sync artifacts are human-readable JSONL. Run
`npm test` for the data-safety test suite (corruption quarantine, conflict handling,
offline queueing).
