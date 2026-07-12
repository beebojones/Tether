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
};

export default function Topbar() {
  const { route, back, routeStack, syncStatus, setPalette, navigate } = useApp();

  const title = route.view === 'items' ? route.title : ROUTE_TITLES[route.view] ?? '';
  const sync = syncStatus;

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
        onClick={() => (sync?.state === 'disabled' ? navigate({ view: 'settings' }) : void api.sync.now())}
        title={sync?.lastError ?? (sync?.folder ? `Sync folder: ${sync.folder}` : 'Configure sync in Settings')}
      >
        <span className={`dot ${sync?.state ?? 'disabled'}`} />
        {syncLabel}
        {sync && sync.state !== 'disabled' && <RefreshCw size={12} />}
      </button>
    </header>
  );
}
