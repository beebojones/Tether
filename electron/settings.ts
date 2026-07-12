// App settings persisted to <userData>/settings.json. No secrets live here.
import fs from 'node:fs';
import path from 'node:path';

export interface UserIdentity {
  id: string; // 'john' | 'mark' | future slug
  name: string;
  initials: string;
  color: string;
}

export interface AppSettings {
  currentUser: UserIdentity | null;
  syncFolder: string | null; // OneDrive/SharePoint-synced directory; null = local-only mode
  theme: 'dark' | 'light';
  density: 'compact' | 'comfortable';
  seedLoaded: boolean;
}

const DEFAULTS: AppSettings = {
  currentUser: null,
  syncFolder: null,
  theme: 'dark',
  density: 'compact',
  seedLoaded: false,
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
