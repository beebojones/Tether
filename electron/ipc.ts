// IPC surface: every renderer capability goes through here. Handlers are thin —
// validation + delegation to Store / SyncEngine / AttachmentManager / Settings.

import { ipcMain, dialog, shell, app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

import type { Store } from './db/store';
import type { SyncEngine } from './sync/engine';
import { FolderTransport } from './sync/transport';
import type { AttachmentManager } from './attachments';
import type { Settings, UserIdentity } from './settings';
import { backupDatabase, listBackups, stageRestore, type DbContext } from './db/db';
import { loadSeedData } from './db/seed';
import { checkForUpdates, installPendingUpdate } from './updater';
import type { ItemFilter, ItemSort, ItemType, LinkKind, Priority, WorkItem } from '../shared/types';

export interface IpcDeps {
  ctx: DbContext;
  store: Store;
  sync: SyncEngine;
  attachments: AttachmentManager;
  settings: Settings;
  getWindow: () => BrowserWindow | null;
}

export function registerIpc(deps: IpcDeps): void {
  const { ctx, store, sync, attachments, settings } = deps;

  const afterMutation = () => sync.noteLocalChange();

  // ---------- app ----------
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    dataDir: ctx.dataDir,
    dbPath: ctx.dbPath,
    deviceId: ctx.deviceId,
  }));

  ipcMain.handle('app:backup', async () => {
    const off = settings.get().syncFolder ? path.join(settings.get().syncFolder!, 'backups') : null;
    return backupDatabase(ctx, { retention: settings.get().backupRetention, offMachineDir: off });
  });
  ipcMain.handle('app:backups:list', () => listBackups(ctx));
  ipcMain.handle('app:backups:restore', (_e, name: string) => stageRestore(ctx, name));

  ipcMain.handle('app:checkUpdate', async () =>
    checkForUpdates(deps.getWindow(), settings.get().syncFolder, app.getVersion()),
  );
  ipcMain.handle('app:installUpdate', async () => installPendingUpdate());

  // ---------- settings / identity ----------
  ipcMain.handle('settings:get', () => settings.get());
  ipcMain.handle('settings:set', (_e, patch: Record<string, unknown>) => {
    const allowed: (keyof ReturnType<Settings['get']>)[] = ['density', 'checkboxShape', 'projectName', 'seedLoaded', 'viewPrefs'];
    const clean: Record<string, unknown> = {};
    for (const k of allowed) if (k in patch) clean[k] = patch[k];
    return settings.set(clean);
  });

  ipcMain.handle('settings:setUser', (_e, user: UserIdentity) => {
    if (!user?.id || !user?.name) throw new Error('User id and name are required');
    const clean: UserIdentity = {
      id: String(user.id).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32),
      name: String(user.name).slice(0, 80),
      initials: String(user.initials || user.name.slice(0, 2)).toUpperCase().slice(0, 3),
      color: /^#[0-9a-fA-F]{6}$/.test(String(user.color)) ? user.color : '#6E8BFF',
    };
    settings.set({ currentUser: clean });
    store.actorId = clean.id;
    store.upsertUser(clean);
    sync.setUserName(clean.name);
    afterMutation();
    return settings.get();
  });

  ipcMain.handle('settings:chooseSyncFolder', async () => {
    const win = deps.getWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      title: 'Choose the shared sync folder (a OneDrive or SharePoint-synced directory)',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('sync:configure', (_e, folder: string | null) => {
    if (folder) {
      if (!fs.existsSync(folder)) throw new Error('Folder does not exist');
      settings.set({ syncFolder: folder });
      sync.setTransport(new FolderTransport(folder));
    } else {
      settings.set({ syncFolder: null });
      sync.setTransport(null);
    }
    return sync.status();
  });

  ipcMain.handle('sync:status', () => sync.status());
  ipcMain.handle('sync:now', async () => {
    await sync.cycle();
    await attachments.ensureBlobsPushed();
    return sync.status();
  });

  // ---------- items ----------
  ipcMain.handle('items:list', (_e, filter: ItemFilter, sort: ItemSort, limit?: number, offset?: number) =>
    store.listItems(filter ?? {}, sort ?? { field: 'updatedAt', dir: 'desc' }, limit ?? 500, offset ?? 0),
  );
  ipcMain.handle('items:get', (_e, id: string) => store.getItem(id));
  ipcMain.handle('items:getByIdent', (_e, ident: string) => store.getItemByIdent(ident));
  ipcMain.handle('items:create', (_e, input: Partial<WorkItem> & { type: ItemType; title: string }) => {
    if (!input?.type || !input?.title?.trim()) throw new Error('Type and title are required');
    const item = store.createItem(input);
    afterMutation();
    return item;
  });
  ipcMain.handle('items:update', (_e, id: string, fields: Partial<WorkItem>) => {
    const item = store.updateItem(id, fields);
    afterMutation();
    return item;
  });
  ipcMain.handle('items:archive', (_e, id: string, archived: boolean) => {
    store.archiveItem(id, archived);
    afterMutation();
  });
  ipcMain.handle('items:delete', (_e, id: string) => {
    store.deleteItem(id);
    afterMutation();
  });
  ipcMain.handle('items:search', (_e, text: string, limit?: number) => store.search(text, limit ?? 30));

  // ---------- links ----------
  ipcMain.handle('links:add', (_e, fromId: string, toId: string, kind: LinkKind) => {
    const link = store.addLink(fromId, toId, kind);
    afterMutation();
    return link;
  });
  ipcMain.handle('links:remove', (_e, id: string) => {
    store.removeLink(id);
    afterMutation();
  });
  ipcMain.handle('links:for', (_e, itemId: string) => store.linksFor(itemId));

  // ---------- comments ----------
  ipcMain.handle('comments:add', (_e, itemId: string, body: string, bodyText: string) => {
    const c = store.addComment(itemId, body, bodyText);
    afterMutation();
    return c;
  });
  ipcMain.handle('comments:update', (_e, id: string, body: string, bodyText: string) => {
    store.updateComment(id, body, bodyText);
    afterMutation();
  });
  ipcMain.handle('comments:delete', (_e, id: string) => {
    store.deleteComment(id);
    afterMutation();
  });
  ipcMain.handle('comments:for', (_e, itemId: string) => store.commentsFor(itemId));

  // ---------- versions / activity ----------
  ipcMain.handle('versions:save', (_e, itemId: string) => store.saveVersion(itemId));
  ipcMain.handle('versions:for', (_e, itemId: string) => store.versionsFor(itemId));
  ipcMain.handle('activity:for', (_e, itemId: string | null, limit?: number) => store.activityFor(itemId, limit ?? 100));

  // ---------- users / milestones / releases / views ----------
  ipcMain.handle('users:list', () => store.listUsers());
  ipcMain.handle('users:setAvatar', (_e, id: string, avatar: string | null) => {
    if (avatar !== null) {
      if (typeof avatar !== 'string' || !avatar.startsWith('data:image/'))
        throw new Error('Avatar must be an image data URL or null');
      if (avatar.length > 700_000) throw new Error('Avatar image is too large (keep it under ~500KB)');
    }
    const u = store.setUserAvatar(id, avatar);
    afterMutation();
    return u;
  });
  ipcMain.handle('milestones:list', () => store.listMilestones());
  ipcMain.handle('milestones:upsert', (_e, m) => {
    const rec = store.upsertMilestone(m);
    afterMutation();
    return rec;
  });
  ipcMain.handle('releases:list', () => store.listReleases());
  ipcMain.handle('releases:upsert', (_e, r) => {
    const rec = store.upsertRelease(r);
    afterMutation();
    return rec;
  });
  ipcMain.handle('views:list', () => store.listViews());
  ipcMain.handle('views:save', (_e, v) => store.saveView(v));
  ipcMain.handle('views:delete', (_e, id: string) => store.deleteView(id));

  // ---------- conflicts ----------
  ipcMain.handle('conflicts:list', (_e, openOnly?: boolean) => store.listConflicts(openOnly ?? true));
  ipcMain.handle('conflicts:resolve', (_e, id: string, resolution: 'local' | 'remote' | 'merged', mergedValue?: string) => {
    store.resolveConflict(id, resolution, mergedValue);
    afterMutation();
  });

  // ---------- attachments ----------
  ipcMain.handle('attachments:pick', async (_e, itemId: string) => {
    const win = deps.getWindow();
    if (!win) return [];
    const result = await dialog.showOpenDialog(win, { properties: ['openFile', 'multiSelections'] });
    if (result.canceled) return [];
    const added = [];
    for (const p of result.filePaths) {
      added.push(await attachments.addFromPath(itemId, p, null));
    }
    afterMutation();
    return added;
  });
  ipcMain.handle('attachments:for', (_e, itemId: string) => attachments.listFor(itemId));
  ipcMain.handle('attachments:open', async (_e, id: string) => {
    const p = await attachments.materialize(id);
    if (!p) throw new Error('Attachment content is not available yet (peer may still be syncing it)');
    await shell.openPath(p);
  });
  ipcMain.handle('attachments:remove', (_e, id: string) => {
    attachments.remove(id);
    afterMutation();
  });

  // ---------- seed data ----------
  ipcMain.handle('seed:load', () => {
    const n = loadSeedData(store);
    settings.set({ seedLoaded: true });
    afterMutation();
    return n;
  });
  ipcMain.handle('seed:remove', () => {
    const n = store.removeSampleData();
    settings.set({ seedLoaded: false });
    afterMutation();
    return n;
  });

  // ---------- export ----------
  ipcMain.handle('export:save', async (_e, defaultName: string, content: string) => {
    const win = deps.getWindow();
    if (!win) return null;
    const result = await dialog.showSaveDialog(win, {
      defaultPath: defaultName,
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'HTML', extensions: ['html'] },
        { name: 'Text', extensions: ['txt'] },
      ],
    });
    if (result.canceled || !result.filePath) return null;
    fs.writeFileSync(result.filePath, content, 'utf8');
    return result.filePath;
  });

  // Render HTML to PDF with Chromium's print engine — used for the Leadership
  // Snapshot. The HTML never leaves the machine.
  ipcMain.handle('export:pdf', async (_e, defaultName: string, html: string) => {
    const win = deps.getWindow();
    if (!win) return null;
    const result = await dialog.showSaveDialog(win, {
      defaultPath: defaultName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (result.canceled || !result.filePath) return null;

    const tmpDir = path.join(ctx.dataDir, 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    const tmpHtml = path.join(tmpDir, `export-${Date.now()}.html`);
    fs.writeFileSync(tmpHtml, html, 'utf8');

    const printer = new BrowserWindow({
      show: false,
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    });
    try {
      await printer.loadFile(tmpHtml);
      // Give the reveal animations a moment, then print (print CSS forces final states).
      await new Promise((r) => setTimeout(r, 350));
      const pdf = await printer.webContents.printToPDF({
        printBackground: true,
        margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
      });
      fs.writeFileSync(result.filePath, pdf);
      return result.filePath;
    } finally {
      printer.destroy();
      fs.rmSync(tmpHtml, { force: true });
    }
  });
}
