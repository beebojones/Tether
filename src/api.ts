// Typed facade over the preload bridge.
import type {
  WorkItem, ItemFilter, ItemSort, ItemType, LinkKind, Comment, Attachment, ItemLink,
  Milestone, Release, SavedView, SyncConflict, SyncStatus, User, SearchResult, ItemVersion,
  ActivityEntry,
} from '@shared/types';

export interface AppInfo {
  version: string;
  dataDir: string;
  dbPath: string;
  deviceId: string;
}

export interface UserIdentity {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface AppSettings {
  currentUser: UserIdentity | null;
  syncFolder: string | null;
  theme: 'dark' | 'light';
  seedLoaded: boolean;
}

export interface LinkedItem {
  link: ItemLink;
  direction: 'out' | 'in';
  other: WorkItem;
}

interface Bridge {
  app: { info(): Promise<AppInfo>; backup(): Promise<string> };
  settings: {
    get(): Promise<AppSettings>;
    set(p: Partial<AppSettings>): Promise<AppSettings>;
    setUser(u: UserIdentity): Promise<AppSettings>;
    chooseSyncFolder(): Promise<string | null>;
  };
  sync: {
    configure(folder: string | null): Promise<SyncStatus>;
    status(): Promise<SyncStatus>;
    now(): Promise<SyncStatus>;
    onStatus(cb: (s: SyncStatus) => void): () => void;
  };
  items: {
    list(filter: ItemFilter, sort: ItemSort, limit?: number, offset?: number): Promise<WorkItem[]>;
    get(id: string): Promise<WorkItem | null>;
    getByIdent(ident: string): Promise<WorkItem | null>;
    create(input: Partial<WorkItem> & { type: ItemType; title: string }): Promise<WorkItem>;
    update(id: string, fields: Partial<WorkItem>): Promise<WorkItem | null>;
    archive(id: string, archived: boolean): Promise<void>;
    delete(id: string): Promise<void>;
    search(text: string, limit?: number): Promise<SearchResult[]>;
  };
  links: {
    add(fromId: string, toId: string, kind: LinkKind): Promise<ItemLink | null>;
    remove(id: string): Promise<void>;
    for(itemId: string): Promise<LinkedItem[]>;
  };
  comments: {
    add(itemId: string, body: string, bodyText: string): Promise<Comment>;
    update(id: string, body: string, bodyText: string): Promise<void>;
    delete(id: string): Promise<void>;
    for(itemId: string): Promise<Comment[]>;
  };
  versions: {
    save(itemId: string): Promise<void>;
    for(itemId: string): Promise<ItemVersion[]>;
  };
  activity: { for(itemId: string | null, limit?: number): Promise<ActivityEntry[]> };
  users: { list(): Promise<User[]> };
  milestones: { list(): Promise<Milestone[]>; upsert(m: Partial<Milestone> & { name: string }): Promise<Milestone> };
  releases: { list(): Promise<Release[]>; upsert(r: Partial<Release> & { name: string }): Promise<Release> };
  views: { list(): Promise<SavedView[]>; save(v: Partial<SavedView> & { name: string; config: Record<string, unknown> }): Promise<SavedView>; delete(id: string): Promise<void> };
  conflicts: {
    list(openOnly?: boolean): Promise<SyncConflict[]>;
    resolve(id: string, resolution: 'local' | 'remote' | 'merged', mergedValue?: string): Promise<void>;
  };
  attachments: {
    pick(itemId: string): Promise<Attachment[]>;
    for(itemId: string): Promise<Attachment[]>;
    open(id: string): Promise<void>;
    remove(id: string): Promise<void>;
  };
  seed: { load(): Promise<number>; remove(): Promise<number> };
  export: { save(defaultName: string, content: string): Promise<string | null> };
  events: {
    onDataChanged(cb: (what: { entity: string; entityId: string }) => void): () => void;
  };
}

declare global {
  interface Window {
    keystone: Bridge;
  }
}

export const api: Bridge = window.keystone;
