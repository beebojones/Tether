import { contextBridge, ipcRenderer } from 'electron';

// Thin typed bridge. The renderer never touches Node APIs directly.
const invoke = (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args);

const api = {
  app: {
    info: () => invoke('app:info'),
    backup: () => invoke('app:backup'),
    backupsList: () => invoke('app:backups:list'),
    backupsRestore: (name: string) => invoke('app:backups:restore', name),
    checkUpdate: () => invoke('app:checkUpdate'),
    installUpdate: () => invoke('app:installUpdate'),
    onUpdateAvailable: (cb: (info: { version: string; current: string }) => void) => {
      const listener = (_e: unknown, info: { version: string; current: string }) => cb(info);
      ipcRenderer.on('update:available', listener);
      return () => ipcRenderer.removeListener('update:available', listener);
    },
  },
  settings: {
    get: () => invoke('settings:get'),
    set: (patch: Record<string, unknown>) => invoke('settings:set', patch),
    setUser: (user: unknown) => invoke('settings:setUser', user),
    chooseSyncFolder: () => invoke('settings:chooseSyncFolder'),
  },
  sync: {
    configure: (folder: string | null) => invoke('sync:configure', folder),
    status: () => invoke('sync:status'),
    now: () => invoke('sync:now'),
    onStatus: (cb: (s: unknown) => void) => {
      const listener = (_e: unknown, s: unknown) => cb(s);
      ipcRenderer.on('sync:status', listener);
      return () => ipcRenderer.removeListener('sync:status', listener);
    },
  },
  items: {
    list: (filter: unknown, sort: unknown, limit?: number, offset?: number) => invoke('items:list', filter, sort, limit, offset),
    get: (id: string) => invoke('items:get', id),
    getByIdent: (ident: string) => invoke('items:getByIdent', ident),
    create: (input: unknown) => invoke('items:create', input),
    update: (id: string, fields: unknown) => invoke('items:update', id, fields),
    archive: (id: string, archived: boolean) => invoke('items:archive', id, archived),
    delete: (id: string) => invoke('items:delete', id),
    search: (text: string, limit?: number) => invoke('items:search', text, limit),
  },
  links: {
    add: (fromId: string, toId: string, kind: string) => invoke('links:add', fromId, toId, kind),
    remove: (id: string) => invoke('links:remove', id),
    for: (itemId: string) => invoke('links:for', itemId),
  },
  comments: {
    add: (itemId: string, body: string, bodyText: string) => invoke('comments:add', itemId, body, bodyText),
    update: (id: string, body: string, bodyText: string) => invoke('comments:update', id, body, bodyText),
    delete: (id: string) => invoke('comments:delete', id),
    for: (itemId: string) => invoke('comments:for', itemId),
  },
  versions: {
    save: (itemId: string) => invoke('versions:save', itemId),
    for: (itemId: string) => invoke('versions:for', itemId),
  },
  activity: {
    for: (itemId: string | null, limit?: number) => invoke('activity:for', itemId, limit),
  },
  users: {
    list: () => invoke('users:list'),
    setAvatar: (id: string, avatar: string | null) => invoke('users:setAvatar', id, avatar),
  },
  milestones: {
    list: () => invoke('milestones:list'),
    upsert: (m: unknown) => invoke('milestones:upsert', m),
  },
  releases: {
    list: () => invoke('releases:list'),
    upsert: (r: unknown) => invoke('releases:upsert', r),
  },
  views: {
    list: () => invoke('views:list'),
    save: (v: unknown) => invoke('views:save', v),
    delete: (id: string) => invoke('views:delete', id),
  },
  conflicts: {
    list: (openOnly?: boolean) => invoke('conflicts:list', openOnly),
    resolve: (id: string, resolution: string, mergedValue?: string) => invoke('conflicts:resolve', id, resolution, mergedValue),
  },
  attachments: {
    pick: (itemId: string) => invoke('attachments:pick', itemId),
    for: (itemId: string) => invoke('attachments:for', itemId),
    open: (id: string) => invoke('attachments:open', id),
    remove: (id: string) => invoke('attachments:remove', id),
  },
  seed: {
    load: () => invoke('seed:load'),
    remove: () => invoke('seed:remove'),
  },
  export: {
    save: (defaultName: string, content: string) => invoke('export:save', defaultName, content),
    pdf: (defaultName: string, html: string) => invoke('export:pdf', defaultName, html),
  },
  events: {
    onDataChanged: (cb: (what: { entity: string; entityId: string }) => void) => {
      const listener = (_e: unknown, what: { entity: string; entityId: string }) => cb(what);
      ipcRenderer.on('data:changed', listener);
      return () => ipcRenderer.removeListener('data:changed', listener);
    },
  },
};

contextBridge.exposeInMainWorld('tether', api);

export type TetherApi = typeof api;
