// In-app update banner. Replaces the native OS dialog: main verifies a new release
// in the shared folder and emits `update:available`; this slides in, themed to match
// Tether, and drives the install through the app (not browser chrome).
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { api } from '../api';
import TetherMark from './TetherMark';
import './updateBanner.css';

export default function UpdateBanner() {
  const [info, setInfo] = useState<{ version: string; current: string } | null>(null);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => api.app.onUpdateAvailable((i) => { setInfo(i); setError(null); }), []);

  if (!info) return null;

  const install = async () => {
    setInstalling(true);
    setError(null);
    const res = await api.app.installUpdate();
    // On success the app quits as the installer launches; only a failure returns here.
    if (!res.ok) {
      setInstalling(false);
      setError(res.message ?? 'Could not start the update.');
    }
  };

  return (
    <div className="update-banner" role="alertdialog" aria-label={`Tether ${info.version} available`}>
      <div className="update-banner-icon"><TetherMark size={20} /></div>
      <div className="update-banner-body">
        <div className="update-banner-title">Update available</div>
        <div className="update-banner-sub">
          Tether {info.version} is ready. Your data and settings are preserved, with an automatic backup.
        </div>
        {error && <div className="update-banner-error">{error}</div>}
        <div className="update-banner-actions">
          <button className="update-banner-install" onClick={() => void install()} disabled={installing}>
            <Download size={13} /> {installing ? 'Installing…' : 'Install now'}
          </button>
          <button className="update-banner-later" onClick={() => setInfo(null)} disabled={installing}>Later</button>
        </div>
      </div>
      <button className="update-banner-close" onClick={() => setInfo(null)} aria-label="Dismiss" disabled={installing}>
        <X size={13} />
      </button>
    </div>
  );
}
