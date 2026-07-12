import { create } from 'zustand';
import { api, type AppSettings, type AppInfo } from './api';
import type { Milestone, Release, SyncStatus, User, ItemType } from '@shared/types';

export type Route =
  | { view: 'dashboard' }
  | { view: 'items'; types?: ItemType[]; title: string }
  | { view: 'board' }
  | { view: 'roadmap' }
  | { view: 'access' }
  | { view: 'decisions' }
  | { view: 'meetings' }
  | { view: 'risks' }
  | { view: 'reports' }
  | { view: 'present' }
  | { view: 'activity' }
  | { view: 'conflicts' }
  | { view: 'settings' }
  | { view: 'item'; id: string };

interface AppState {
  ready: boolean;
  info: AppInfo | null;
  settings: AppSettings | null;
  users: User[];
  milestones: Milestone[];
  releases: Release[];
  syncStatus: SyncStatus | null;
  route: Route;
  routeStack: Route[];
  dataTick: number; // bump → views refetch
  paletteOpen: boolean;
  createOpen: boolean;

  init(): Promise<void>;
  navigate(r: Route): void;
  back(): void;
  openItem(id: string): void;
  refreshMeta(): Promise<void>;
  setSettings(s: AppSettings): void;
  setPalette(open: boolean): void;
  setCreate(open: boolean): void;
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  info: null,
  settings: null,
  users: [],
  milestones: [],
  releases: [],
  syncStatus: null,
  route: { view: 'dashboard' },
  routeStack: [],
  dataTick: 0,
  paletteOpen: false,
  createOpen: false,

  async init() {
    const [info, settings, syncStatus] = await Promise.all([api.app.info(), api.settings.get(), api.sync.status()]);
    await get().refreshMeta();
    set({ info, settings, syncStatus, ready: true });

    api.sync.onStatus((s) => set({ syncStatus: s }));
    api.events.onDataChanged(() => {
      set((st) => ({ dataTick: st.dataTick + 1 }));
      void get().refreshMeta();
    });
  },

  navigate(r) {
    set((st) => ({ route: r, routeStack: [...st.routeStack.slice(-30), st.route] }));
  },

  back() {
    set((st) => {
      const stack = [...st.routeStack];
      const prev = stack.pop();
      return prev ? { route: prev, routeStack: stack } : {};
    });
  },

  openItem(id) {
    get().navigate({ view: 'item', id });
  },

  async refreshMeta() {
    const [users, milestones, releases] = await Promise.all([
      api.users.list(),
      api.milestones.list(),
      api.releases.list(),
    ]);
    set({ users, milestones, releases });
  },

  setSettings(s) {
    set({ settings: s });
  },

  setPalette(open) {
    set({ paletteOpen: open });
  },

  setCreate(open) {
    set({ createOpen: open });
  },
}));

export function userById(users: User[], id: string | null): User | null {
  return users.find((u) => u.id === id) ?? null;
}
