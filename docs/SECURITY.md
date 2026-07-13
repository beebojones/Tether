# Security Review Document — Tether

*For security / IT reviewers evaluating Tether in any environment. Last updated 2026-07-12.*

**Ownership:** Tether is independent software, the personal intellectual property of
John Crouch. It is not affiliated with, sponsored by, or endorsed by any employer or
third party. Enterprise names appearing in sample data or project records are content
managed *by* the application, not part of the application's identity.

## What data is stored

Project-management records for whatever projects the users create (work items,
requirements, decisions, risks, blockers, access-request tracking — metadata about
access, never credentials — meeting notes, comments, attachments, change history).
No PHI, no customer data, no credentials are intended or required to be stored.

## Where it is stored

- **Local:** SQLite database at `%APPDATA%/Tether/data/tether.db`
  on each user's machine. Backups in `data/backups/`.
- **Shared (only when sync is configured):** JSON change files and attachment blobs
  in a folder the users choose — typically one synced by OneDrive/SharePoint, in
  which case the data inherits that tenant's encryption at rest, DLP, retention,
  and audit controls.
- **Nowhere else.** The application makes **zero network calls of its own** — no
  telemetry, no analytics, no update pings, no external APIs, no AI services.
  Transport security is entirely delegated to the OneDrive/SharePoint client.

## How it is transmitted

The app itself performs no transmission. It reads/writes files in a local folder;
the folder's sync client (e.g. OneDrive) moves them (TLS in transit, AES at rest,
per that platform's guarantees).

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

## What may require approval in a managed environment (honest list)

If Tether is run on employer-managed machines, the *operators* should expect these
items to need their organization's sign-off (nothing here is claimed pre-approved):

| Item | Status |
|---|---|
| Running an unsigned third-party tool on managed machines | May require exception/allowlisting depending on endpoint policy |
| A shared OneDrive/SharePoint folder between the two users | Standard M365 sharing — normally self-service |
| Any future hosted sync backend (e.g. Azure SQL, internal API) | Requires provisioning + security review by that organization |
| Any future AI-assisted features (summarization etc.) | **Not implemented**; would require an approved AI service first |
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
`%APPDATA%/Tether/`; sync artifacts are human-readable JSONL. Run
`npm test` for the data-safety test suite (corruption quarantine, conflict handling,
offline queueing).
