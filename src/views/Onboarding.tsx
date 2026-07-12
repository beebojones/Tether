// First-run setup: identity + optional sync folder + optional sample data.
import { useState } from 'react';
import { api } from '../api';
import { useApp } from '../store';
import './onboarding.css';

const PRESETS = [
  { id: 'john', name: 'John Crouch', initials: 'JC', color: '#6E8BFF' },
  { id: 'mark', name: 'Mark', initials: 'M', color: '#4CC38A' },
];

export default function Onboarding() {
  const { setSettings } = useApp();
  const [name, setName] = useState('');
  const [syncFolder, setSyncFolder] = useState<string | null>(null);
  const [loadSample, setLoadSample] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickPreset = (p: (typeof PRESETS)[number]) => setName(p.name);

  const finish = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const preset = PRESETS.find((p) => p.name === name.trim());
      const id = preset?.id ?? name.trim().toLowerCase().split(/\s+/)[0];
      const initials = preset?.initials ?? name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
      const color = preset?.color ?? '#6E8BFF';
      let settings = await api.settings.setUser({ id, name: name.trim(), initials, color });
      if (syncFolder) {
        await api.sync.configure(syncFolder);
        settings = await api.settings.get();
      }
      if (loadSample) await api.seed.load();
      setSettings(await api.settings.get());
      void settings;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="ob-card">
        <div className="ob-logo">T</div>
        <h1>Welcome to Tether</h1>
        <p className="muted">The workspace for the Support AI project. Set up your identity to begin.</p>

        <div className="form-row" style={{ marginTop: 24 }}>
          <label htmlFor="ob-name">Who are you?</label>
          <div className="ob-presets">
            {PRESETS.map((p) => (
              <button key={p.id} className={name === p.name ? 'primary' : ''} onClick={() => pickPreset(p)}>
                <span className="avatar" style={{ background: p.color }}>{p.initials}</span>
                {p.name}
              </button>
            ))}
          </div>
          <input id="ob-name" type="text" placeholder="Or type your name…" value={name}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void finish()} />
        </div>

        <div className="form-row">
          <div className="rail-label" style={{ textTransform: 'none', letterSpacing: 0 }}>Shared project folder <span className="muted">(optional — set later in Settings)</span></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => void api.settings.chooseSyncFolder().then((f) => f && setSyncFolder(f))}>
              Choose folder…
            </button>
            <span className="muted mono" style={{ fontSize: 'var(--fs-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {syncFolder ?? 'Local-only until configured'}
            </span>
          </div>
          <p className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
            Point both computers at the same OneDrive or SharePoint-synced folder to share the project.
          </p>
        </div>

        <label className="ob-check">
          <input type="checkbox" checked={loadSample} onChange={(e) => setLoadSample(e.target.checked)} />
          Load sample Support AI project data (removable anytime)
        </label>

        {error && <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', marginTop: 8 }}>{error}</div>}

        <button className="primary ob-go" onClick={() => void finish()} disabled={!name.trim() || busy}>
          {busy ? 'Setting up…' : 'Enter workspace'}
        </button>
      </div>
    </div>
  );
}
