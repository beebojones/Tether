import { useState } from 'react';
import { ArrowLeft, Search, RefreshCw } from 'lucide-react';
import { useApp } from '../store';
import { api } from '../api';

const ROUTE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  board: 'Board',
  roadmap: 'Roadmap',
  access: 'Access Tracker',
  decisions: 'Decisions',
  meetings: 'Meetings',
  risks: 'Risks & Blockers',
  reports: 'Reports',
  activity: 'Activity',
  conflicts: 'Sync Conflicts',
  settings: 'Settings',
  item: 'Item',
  present: 'Presentation',
};

export default function Topbar() {
  const { route, back, routeStack, syncStatus, setPalette, navigate } = useApp();
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const title = route.view === 'items' ? route.title : ROUTE_TITLES[route.view] ?? '';
  const sync = syncStatus;

  // Click the pill to force a sync ("re-save"). The icon spins for at least ~700ms
  // even when the sync is instant, so the click always visibly reacts, then a brief
  // "Saved" confirms it's as synced as it can be.
  const reSave = async () => {
    if (sync?.state === 'disabled') { navigate({ view: 'settings' }); return; }
    setSaving(true);
    try {
      await Promise.all([api.sync.now(), new Promise((r) => setTimeout(r, 700))]);
    } finally {
      setSaving(false);
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const syncLabel = !sync || sync.state === 'disabled'
    ? 'Local only'
    : sync.state === 'idle'
      ? sync.pendingOps > 0 ? `${sync.pendingOps} pending` : 'Synced'
      : sync.state === 'syncing'
        ? 'Syncing…'
        : sync.state === 'offline'
          ? 'Offline — changes queued'
          : 'Sync error';

  return (
    <header className="topbar">
      {routeStack.length > 0 && (
        <button className="ghost" onClick={back} title="Back (Alt+←)" aria-label="Back">
          <ArrowLeft size={15} />
        </button>
      )}
      <div className="crumb">{title}</div>
      <div className="spacer" />
      <div className="search-hint" onClick={() => setPalette(true)} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setPalette(true)}>
        <Search size={13} />
        Search or jump to…
        <kbd style={{ marginLeft: 'auto' }}>Ctrl K</kbd>
      </div>
      <button
        className="sync-pill"
        onClick={() => void reSave()}
        title={sync?.state === 'disabled' ? 'Configure sync in Settings' : (sync?.lastError ?? (sync?.folder ? `Sync now — folder: ${sync.folder}` : 'Sync now'))}
      >
        <span className={`dot ${sync?.state ?? 'disabled'}`} />
        {savedFlash ? 'Saved' : syncLabel}
        {sync && sync.state !== 'disabled' && <RefreshCw size={12} className={saving ? 'spin' : ''} />}
      </button>
    </header>
  );
}
