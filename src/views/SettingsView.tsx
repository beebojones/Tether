// Settings: identity, sync folder, sample data, backup, data locations, about.
import { useEffect, useState } from 'react';
import { FolderOpen, Database, Download, Trash2, RefreshCw } from 'lucide-react';
import { api, type AppInfo } from '../api';
import { useApp } from '../store';
import { fmtDateTime } from '../components/ui';

export default function SettingsView() {
  const { settings, setSettings, syncStatus } = useApp();
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void api.app.info().then(setInfo);
  }, []);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 4000);
  };

  const chooseSyncFolder = async () => {
    const folder = await api.settings.chooseSyncFolder();
    if (!folder) return;
    await api.sync.configure(folder);
    setSettings(await api.settings.get());
    flash('Sync folder configured. Point the other computer at the same folder.');
  };

  const disableSync = async () => {
    await api.sync.configure(null);
    setSettings(await api.settings.get());
    flash('Sync disabled — working local-only. Your data stays on this computer.');
  };

  return (
    <div className="view-pad" style={{ maxWidth: 760 }}>
      <div className="view-header"><h1>Settings</h1></div>
      {msg && <div className="toast" style={{ position: 'static', marginBottom: 14 }}>{msg}</div>}

      <Section title="Identity">
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }}>
          Signed in as <strong style={{ color: 'var(--text-primary)' }}>{settings?.currentUser?.name}</strong> ({settings?.currentUser?.id}).
          Identity marks who created and changed each record.
        </p>
      </Section>

      <Section title="Collaboration & sync">
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 10 }}>
          Tether shares the project through a folder synced by OneDrive or SharePoint.
          Each computer writes only its own change files — the database itself never crosses the wire, which avoids corruption.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => void chooseSyncFolder()}><FolderOpen size={14} /> {settings?.syncFolder ? 'Change folder…' : 'Choose shared folder…'}</button>
          {settings?.syncFolder && <button onClick={() => void disableSync()}>Disable sync</button>}
          {settings?.syncFolder && <button onClick={() => void api.sync.now()}><RefreshCw size={13} /> Sync now</button>}
        </div>
        <dl className="kv">
          <dt>Mode</dt><dd>{settings?.syncFolder ? 'Shared folder' : 'Local-only'}</dd>
          {settings?.syncFolder && <><dt>Folder</dt><dd className="mono">{settings.syncFolder}</dd></>}
          {syncStatus?.lastSyncAt && <><dt>Last sync</dt><dd>{fmtDateTime(syncStatus.lastSyncAt)}</dd></>}
          {syncStatus && syncStatus.pendingOps > 0 && <><dt>Pending changes</dt><dd>{syncStatus.pendingOps} queued for export</dd></>}
          {syncStatus?.lastError && <><dt>Last error</dt><dd style={{ color: 'var(--danger)' }}>{syncStatus.lastError}</dd></>}
          {(syncStatus?.peers?.length ?? 0) > 0 && (
            <>
              <dt>Peers</dt>
              <dd>{syncStatus!.peers.map((p) => `${p.userName ?? p.deviceId.slice(0, 8)}${p.lastSeenAt ? ` (seen ${fmtDateTime(p.lastSeenAt)})` : ''}`).join(', ')}</dd>
            </>
          )}
        </dl>
      </Section>

      <Section title="Sample data">
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 10 }}>
          Sample Support AI records are marked with a SAMPLE badge. Remove them when you start entering real work.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => void api.seed.load().then((n) => flash(n ? `Loaded ${n} sample records.` : 'Sample data already present.'))}>
            <Database size={14} /> Load sample data
          </button>
          <button className="danger" onClick={() => void api.seed.remove().then((n) => flash(`Removed ${n} sample records.`))}>
            <Trash2 size={14} /> Remove all sample data
          </button>
        </div>
      </Section>

      <Section title="Backup & data">
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={() => void api.app.backup().then((p) => flash(`Backup saved: ${p}`))}>
            <Download size={14} /> Back up database now
          </button>
        </div>
        <dl className="kv">
          <dt>Database</dt><dd className="mono">{info?.dbPath}</dd>
          <dt>Data folder</dt><dd className="mono">{info?.dataDir}</dd>
          <dt>Device ID</dt><dd className="mono">{info?.deviceId}</dd>
          <dt>Version</dt><dd>{info?.version}</dd>
        </dl>
        <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 10 }}>
          All project data lives on this computer (and in the shared folder when sync is enabled). Nothing is sent to any external service.
          Automatic backups are taken before every schema migration; manual backups land in the backups folder shown above.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="dash-card" style={{ marginBottom: 16, padding: '14px 18px' }}>
      <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 10 }}>{title}</h2>
      {children}
    </section>
  );
}
