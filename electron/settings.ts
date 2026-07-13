// App settings persisted to <userData>/settings.json. No secrets live here.
import fs from 'node:fs';
import path from 'node:path';
import type { ViewPrefs } from '../shared/types';

export interface UserIdentity {
  id: string; // 'john' | 'mark' | future slug
  name: string;
  initials: string;
  color: string;
}

export interface AppSettings {
  currentUser: UserIdentity | null;
  syncFolder: string | null; // OneDrive/SharePoint-synced directory; null = local-only mode
  density: 'compact' | 'comfortable';
  checkboxShape: 'square' | 'circle' | 'hexagon'; // task-list checkbox shape; per-user, local
  projectName: string; // display name used by reports/exports/presentation — editable content
  seedLoaded: boolean;
  viewPrefs: ViewPrefs; // per-user Board/Dashboard layout; local-only, never synced
}

const DEFAULTS: AppSettings = {
  currentUser: null,
  syncFolder: null,
  density: 'compact',
  checkboxShape: 'circle',
  projectName: 'Support AI',
  seedLoaded: false,
  viewPrefs: {},
};

export class Settings {
  private file: string;
  private data: AppSettings;

  constructor(userDataDir: string) {
    this.file = path.join(userDataDir, 'settings.json');
    this.data = { ...DEFAULTS };
    try {
      if (fs.existsSync(this.file)) {
        this.data = { ...DEFAULTS, ...(JSON.parse(fs.readFileSync(this.file, 'utf8')) as Partial<AppSettings>) };
      }
    } catch {
      // Corrupt settings: keep defaults, preserve the broken file for inspection.
      try {
        fs.copyFileSync(this.file, this.file + '.corrupt');
      } catch { /* ignore */ }
    }
  }

  get(): AppSettings {
    return { ...this.data };
  }

  set(patch: Partial<AppSettings>): AppSettings {
    this.data = { ...this.data, ...patch };
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(tmp, this.file);
    return this.get();
  }
}
