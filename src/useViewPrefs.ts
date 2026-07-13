// Reads + persists per-user view layout prefs. Updates the store optimistically so
// the view and the Customize popover both react instantly; disk write is async.
import { useApp } from './store';
import { api } from './api';
import { resolvePrefs, toSaved, type CanonicalItem, type ResolvedPrefs } from './viewPrefs';

export function useViewPrefs(viewKey: 'board' | 'dashboard', canonical: CanonicalItem[]) {
  const settings = useApp((s) => s.settings);
  const setSettings = useApp((s) => s.setSettings);

  const resolved = resolvePrefs(canonical, settings?.viewPrefs?.[viewKey]);
  const defaults = resolvePrefs(canonical, undefined);

  const update = (next: ResolvedPrefs) => {
    if (!settings) return;
    const viewPrefs = { ...(settings.viewPrefs ?? {}), [viewKey]: toSaved(next) };
    setSettings({ ...settings, viewPrefs }); // instant, drives view + popover
    void api.settings.set({ viewPrefs }); // persist to local settings.json
  };

  return { resolved, defaults, update };
}
