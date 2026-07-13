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

### Corporate network / SSL

On a corporate network that intercepts TLS (many do), `npm install` or
`npm run rebuild` may fail with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` — often
surfaced by npm as the misleading `Exit handler never called!`. The proxy
re-signs traffic with an internal root certificate that Node does not trust by
default. Tell Node to use the Windows certificate store (which has that root),
then re-run the failed command:

```powershell
$env:NODE_OPTIONS = "--use-system-ca"   # this shell; Node 18+/22+/24
npm install
npm run rebuild
```

This only affects developers **building from source** on such a network. The
packaged installer (`npm run dist`) bundles everything, so end users are
unaffected.

### Electron binary fails to extract (hangs, or `cli.js` cannot find Electron)

Installing `electron` downloads a ~128 MB runtime in a `postinstall` step and
unzips it into `node_modules/electron/dist`. On some Windows machines (often
due to antivirus scanning the temp files it writes) the `extract-zip` step
**hangs and never completes** — `npm install` looks fine, but the extraction
silently does nothing, leaving no `node_modules/electron/path.txt`. Later,
`npm run dev` crashes in `node_modules/electron/cli.js` because it cannot find
the binary.

The download itself usually succeeds; only the extract step fails. Recover by
extracting the already-downloaded zip yourself:

```powershell
# 1. Find the cached zip (downloaded by the failed install):
#    %LOCALAPPDATA%\electron\Cache\<hash>\electron-v<version>-win32-x64.zip
$zip  = (Get-ChildItem "$env:LOCALAPPDATA\electron\Cache" -Recurse -Filter *.zip | Select-Object -First 1).FullName
$dist = "node_modules\electron\dist"

# 2. Extract with .NET (bypasses the hanging extract-zip):
if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($zip, $dist)

# 3. Write the path.txt Electron looks for:
Set-Content node_modules\electron\path.txt "electron.exe" -NoNewline -Encoding ascii
```

Verify with `node -e "console.log(require('electron'))"` — it should print the
path to `dist\electron.exe`.

### Building on a different CPU architecture than you'll run on

If the repo/lockfile was last touched on an **arm64** machine but you're on
**x64** (or vice versa), the arch-specific pieces must be built for *your*
machine: run `npm run rebuild` (recompiles `better-sqlite3` against Electron's
ABI), and Electron/esbuild/rollup will fetch the matching native binaries
automatically. A clean `npm install` on modern npm resolves these correctly
because the lockfile lists every platform's optional binary.

## Walkthrough

Open the hosted walkthrough from any device:

<https://chroma-walkthrough.vercel.app/tether/>

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

1. Pick your identity (John Crouch / Mark Bidinger / custom).
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
  `Ctrl+K` add/edit link, `Ctrl+F` find in document, markdown shortcuts
  (`# `, `- `, `1. `, `> `, `` ``` ``), `Ctrl+B/I/U`. Toolbar adds text/highlight
  color, image insert (also drag-drop or paste), code-block language, and full screen.

## Documentation

- [`docs/PROJECT_RECORD.md`](docs/PROJECT_RECORD.md) — living record: vision, decisions, status, limitations
- [`docs/SYNC_ARCHITECTURE.md`](docs/SYNC_ARCHITECTURE.md) — sync design + option ranking + migration path
- [`docs/SECURITY.md`](docs/SECURITY.md) — security review document
- [`docs/RELEASING.md`](docs/RELEASING.md) — build, release, and update workflow
- [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) — day-to-day usage
- [`docs/walkthrough/index.html`](docs/walkthrough/index.html) — static product walkthrough / presentation
