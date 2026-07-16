import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import { openDatabase, backupDatabase } from './db/db';
import { Store } from './db/store';
import { SyncEngine } from './sync/engine';
import { FolderTransport } from './sync/transport';
import { AttachmentManager } from './attachments';
import { Settings } from './settings';
import { registerIpc } from './ipc';
import { checkForUpdates } from './updater';
import { startLocalApi, type LocalApiHandle } from './localapi';

let win: BrowserWindow | null = null;
// Declared up here because registerIpc closes over it before startLocalApi assigns it.
let localApi: LocalApiHandle | null = null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0D1017',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  win.once('ready-to-show', () => win?.show());

  // External links open in the system browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl && url.startsWith(devUrl)) return;
    if (!url.startsWith('file://')) e.preventDefault();
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    // Mirror renderer console to stdout in dev so failures are visible headlessly.
    win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
      if (level >= 2) console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    });
    void win.loadURL(devUrl);
  } else {
    void win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.on('closed', () => {
    win = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    try {
      boot();
    } catch (err) {
      // Fail loudly, never hang on a blank window — corrupt DB instructions included.
      console.error('[tether boot]', err);
      dialog.showErrorBox(
        'Tether could not start',
        (err instanceof Error ? err.message : String(err)) +
          '\n\nYour data folder is %APPDATA%/Tether/data — backups live in its backups/ subfolder.',
      );
      app.quit();
    }
  });

  function boot(): void {
    const userData = app.getPath('userData');
    const settings = new Settings(userData);
    const ctx = openDatabase(path.join(userData, 'data'));

    const currentUser = settings.get().currentUser;
    const store = new Store(ctx, currentUser?.id ?? 'unknown', {
      onChange: (what) => win?.webContents.send('data:changed', what),
      onConflict: () => win?.webContents.send('data:changed', { entity: 'conflict', entityId: '*' }),
    });
    if (currentUser) store.upsertUser(currentUser);

    // Teammates' ops used to apply without leaving any activity, so their history was
    // invisible here. Rebuild it from the op-log we already hold. Idempotent (activity ids
    // derive from op ids), so this is a no-op once caught up.
    const derived = store.backfillRemoteActivity();
    if (derived > 0) console.log(`[tether] derived ${derived} activity entries from teammates' ops`);

    const sync = new SyncEngine(store, currentUser?.name ?? 'Unknown', (s) =>
      win?.webContents.send('sync:status', s),
    );
    const attachments = new AttachmentManager(store, ctx.dataDir, () =>
      settings.get().syncFolder ? new FolderTransport(settings.get().syncFolder!) : null,
    );

    const syncFolder = settings.get().syncFolder;
    if (syncFolder) sync.setTransport(new FolderTransport(syncFolder));

    registerIpc({ ctx, store, sync, attachments, settings, getWindow: () => win, getLocalApi: () => localApi });

    // Optional loopback read API for local agents (Claude via tether-mcp).
    // OFF unless settings.localApiEnabled or TETHER_LOCAL_API=1. Reuses Store,
    // so it can never bypass the op-log / sync path.
    localApi = startLocalApi({ store, ctx, sync, settings, userDataDir: userData });
    app.on('before-quit', () => localApi?.close());

    // Timed, integrity-gated snapshots with rolling retention. Copies off-machine
    // into <syncFolder>/backups when a sync folder is set, so a dead disk can't
    // take both the db and its backups. The op-log sync remains the real-time layer.
    if (settings.get().autoBackup) {
      const runBackup = () => {
        const cfg = settings.get();
        const off = cfg.syncFolder ? path.join(cfg.syncFolder, 'backups') : null;
        backupDatabase(ctx, { retention: cfg.backupRetention, offMachineDir: off })
          .then((p) => console.log('[tether] auto-backup ->', p))
          .catch((err) => console.error('[tether] auto-backup failed:', err));
      };
      setTimeout(runBackup, 30_000); // one fresh snapshot shortly after launch
      setInterval(runBackup, Math.max(1, settings.get().backupIntervalMin) * 60_000);
    }

    createWindow();

    // Silent startup check against the shared release folder (packaged only).
    // Reads the OneDrive/SharePoint-synced folder from disk — no network calls.
    if (app.isPackaged && syncFolder) {
      win?.webContents.once('did-finish-load', () => {
        setTimeout(() => {
          void checkForUpdates(win, syncFolder, app.getVersion());
        }, 2500);
      });
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('before-quit', () => {
    // Flush any queued sync work best-effort; DB is WAL so plain close is safe.
    ipcMain.removeAllListeners();
  });
}
