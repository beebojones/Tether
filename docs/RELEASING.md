# Releasing & Updating Tether

## Build a release

```bash
npm version patch            # or minor/major — updates package.json + git tag
npm test                     # must be green
npm run dist                 # → release/Tether Setup <version>.exe
```

One installer covers **both** arm64 (John's Windows-on-ARM machine) and x64
(standard corporate laptops — Mark Bidinger); NSIS picks the right binaries for
the machine it's run on. `npm run dist` (`scripts/dist.mjs`) builds the app,
packages it, then rebuilds the native SQLite module for local dev (whatever this
machine's own arch is), so `npm run dev` and `npm test` keep working afterwards.
Close any running Tether/Electron instance before `npm run dist` — an open app
locks the native module and `release/` directory.

The installer is **one-click** (Discord/Slack-style — no wizard pages) and
**per-user** (no admin rights needed). Uninstall via Windows Settings → Apps.

### Why packaging happens outside `C:\Workspace`

On managed McKesson laptops, the endpoint agent (SentinelOne, alongside Windows
Defender) locks newly-written executables specifically inside `C:\Workspace` long
enough that electron-builder's rename-into-place step fails with
`EPERM: operation not permitted, rename ... unpacked`. Confirmed by building to a
location outside `C:\Workspace`, which succeeds immediately with no lock at all.

`scripts/dist.mjs` works around this automatically: it packages into a temp folder
outside `C:\Workspace`, then copies just the finished installer (not the ~500MB
unpacked app folders) into this project's `release/`. A short retry loop remains
as a safety net in case that temp location is ever also monitored. No IT ticket
or admin rights needed — this is transparent to `npm run dist` / `npm run release`.

## Distribute to Mark Bidinger (documented manual workflow)

Tether deliberately ships **without a remote self-updating downloader** — an updater
that fetches and executes binaries from the public internet is exactly what enterprise
security teams flag. Instead it checks the **shared release folder** (already synced to
disk by OneDrive/SharePoint — no network call), verifies the installer's SHA256 before
running it, and prompts the user (see *Auto-update* below). Releases move through the
same trusted channel as the project data:

1. Build the installer and compute its hash:
   ```powershell
   Get-FileHash "release/Tether Setup 0.1.0.exe" -Algorithm SHA256
   ```
2. Copy the installer into the shared folder under `releases/<version>/` together
   with `RELEASE_NOTES.md` and the SHA256 hash.
3. Mark verifies the hash matches, then runs the installer — it upgrades in place.
4. Database migrations run automatically on first launch of the new version, with
   an automatic pre-migration backup in `data/backups/`.

## Auto-update

Tether checks for updates by reading the shared release folder — **no network calls
of its own** (see `docs/SECURITY.md`). Implemented in `electron/updater.ts`.

- **When:** silently on launch (packaged builds only, when a shared folder is set),
  and on demand via Settings → Backup & data → **Check for updates**.
- **What it does:** scans `<shared folder>/releases/` for the highest `x.y.z` folder
  newer than the running version whose `Tether Setup <version>.exe` is present.
- **Verification (fail-closed):** computes the installer's SHA256 and compares it to
  the `SHA256.txt` staged beside it. If the file is missing or the hash does not
  match, it refuses to install and tells the user — it never runs an unverified binary.
- **Install:** prompts ("Install now / Later"); on accept it launches the installer
  and quits so files can be replaced. Data and settings are preserved; a backup runs
  automatically before any migration.
- **Rollout note:** the updater only becomes active once a user is running a build
  that contains it. Ship this version manually once (both users); subsequent releases
  staged in `releases/<version>/` are picked up automatically.

## Version compatibility

- The sync format is append-only JSONL with per-op schema; unknown fields are ignored,
  so a device one version behind keeps syncing.
- Schema migrations are one-way per machine; both users should upgrade within the
  same working session when a release note says "contains a schema migration".

## Rollback

Reinstall the previous installer from `releases/<version>/`, then restore the newest
matching backup from `%APPDATA%/Tether/data/backups/` if a migration had
already run.

## Release checklist

- [ ] `npm test` green
- [ ] `npx tsc --noEmit` clean
- [ ] Fresh-profile smoke test: onboarding → create item → edit → search → report
- [ ] Two-instance sync smoke test against a scratch folder
- [ ] Dependency audit: `npm audit` reviewed; Electron on a supported major
- [ ] Release notes written; hash published alongside installer

## Future (requires signing / deployment infrastructure)

- Code-signing certificate → removes SmartScreen friction, enables Intune/Software
  Center distribution.
- ~~electron-updater against an internal release share can be added later~~ —
  **done**: a folder-based updater (`electron/updater.ts`) watches the shared
  release share with no network calls. See *Auto-update* above. A signed
  electron-updater over HTTPS remains a future option if signing infra lands.
