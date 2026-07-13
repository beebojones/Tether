# Releasing & Updating Tether

## Build a release

```bash
npm version patch            # or minor/major — updates package.json + git tag
npm test                     # must be green
npm run dist                 # → release/Tether Setup <version>-{arm64,x64}.exe
```

Two installers are produced: **arm64** (John's Windows-on-ARM machine) and **x64**
(standard corporate laptops — Mark Bidinger). electron-builder rebuilds the native SQLite
module per architecture during packaging; the `postdist` script restores the local
arm64 build so `npm run dev` and `npm test` keep working afterwards. Close any
running Tether/Electron instance before `npm run dist` — an open app locks the
native module and `release/` directory.

The installer is **per-user** (no admin rights needed) and creates Start-menu and
desktop shortcuts. Uninstall via Windows Settings → Apps.

## Distribute to Mark Bidinger (documented manual workflow)

Tether deliberately ships **without a self-updating downloader** — an updater that
fetches and executes remote binaries is exactly what enterprise security teams flag.
Until signed infrastructure exists, releases move through the same trusted channel
as the project data:

1. Build the installer and compute its hash:
   ```powershell
   Get-FileHash "release/Tether Setup 0.1.0.exe" -Algorithm SHA256
   ```
2. Copy the installer into the shared folder under `releases/<version>/` together
   with `RELEASE_NOTES.md` and the SHA256 hash.
3. Mark verifies the hash matches, then runs the installer — it upgrades in place.
4. Database migrations run automatically on first launch of the new version, with
   an automatic pre-migration backup in `data/backups/`.

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
- electron-updater against an internal release share can be added later; the
  version-check abstraction lives in the release workflow, not the app, on purpose.
