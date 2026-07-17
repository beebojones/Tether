// Settings: identity, sync folder, sample data, local agent access, backups, data locations, about.
import { useEffect, useRef, useState } from 'react';
import { FolderOpen, Database, Download, Trash2, RefreshCw, RotateCcw, Eye, EyeOff, Copy } from 'lucide-react';
import { api, type AppInfo, type BackupInfo } from '../api';
import { useApp } from '../store';
import { fmtDateTime, Avatar } from '../components/ui';
import TetherMark from '../components/TetherMark';
import type { User } from '../../shared/types';

// Read once at load: a long-running window shouldn't show a stale year at New Year.
const COPYRIGHT_YEAR = new Date().getFullYear();

// Soft admin: whose Settings shows the Team panel. NOT an enforced permission — Tether is
// local-first and the shared folder grants full write to everyone — this only hides the UI
// from non-admins. Anyone determined could still create members another way.
const ADMIN_IDS = new Set(['john']);

export default function SettingsView() {
  const { settings, setSettings, syncStatus, users, refreshMeta } = useApp();
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [token, setToken] = useState<{ token: string; path: string } | null>(null);
  const [tokenShown, setTokenShown] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const tokenField = useRef<HTMLInputElement>(null);
  // Which user id the next avatar file selection applies to: self, or a teammate via the admin panel.
  const [avatarTarget, setAvatarTarget] = useState<string | null>(null);

  useEffect(() => {
    void api.app.info().then(setInfo);
    void api.app.backupsList().then(setBackups);
    void api.app.localApiToken().then(setToken);
  }, []);

  // Re-read after the toggle flips: the token file is minted on the next enabled boot.
  useEffect(() => {
    if (settings?.localApiEnabled && !token) void api.app.localApiToken().then(setToken);
  }, [settings?.localApiEnabled, token]);

  // Destructive and one misclick from Copy, so name what breaks before doing it.
  const rotateToken = async () => {
    const ok = window.confirm(
      'Regenerate the access token?\n\nThe current token stops working immediately. Any agent ' +
        'using it — a registered MCP server, a script, a saved copy — must be updated with the ' +
        'new one before it can reach Tether again.',
    );
    if (!ok) return;
    setToken(await api.app.localApiRotateToken());
    setTokenShown(true); // you need to see it to go update whatever just broke
    flash('New token generated. The old one no longer works — update any agent using it.');
  };

  // Clipboard writes can be refused (unfocused document, locked-down policy). Never
  // fail silently: reveal + select the field so Ctrl+C still works.
  const copyToken = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token.token);
      flash('Access token copied to the clipboard.');
    } catch {
      setTokenShown(true);
      tokenField.current?.select();
      flash("Couldn't reach the clipboard — the token is selected, press Ctrl+C to copy it.");
    }
  };

  const refreshBackups = () => void api.app.backupsList().then(setBackups);

  const backupNow = async () => {
    const p = await api.app.backup();
    refreshBackups();
    flash(`Backup saved: ${p}`);
  };

  const restoreBackup = async (name: string) => {
    const ok = window.confirm(
      `Restore from ${name}?\n\nYour current database will be quarantined and replaced with this backup ` +
        `the next time Tether starts. Nothing changes until you restart.`,
    );
    if (!ok) return;
    await api.app.backupsRestore(name);
    flash('Restore staged. Restart Tether to apply it — your current database is quarantined and replaced on next launch.');
  };

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 4000);
  };

  const currentUser = settings?.currentUser ?? null;
  const dbUser = users.find((u) => u.id === currentUser?.id) ?? null;

  // Open the file picker aimed at a specific user (self, or a teammate from the admin panel).
  const pickAvatarFor = (id: string) => {
    setAvatarTarget(id);
    avatarInput.current?.click();
  };

  // Downscale any chosen image to a 256px square (cover) data URL, then store it on the target user.
  const onAvatarFile = (file: File | undefined) => {
    const targetId = avatarTarget ?? currentUser?.id ?? null;
    if (!file || !targetId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const S = 256;
        const canvas = document.createElement('canvas');
        canvas.width = S;
        canvas.height = S;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const scale = Math.max(S / img.width, S / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
        void api.users.setAvatar(targetId, canvas.toDataURL('image/png')).then(() => {
          void refreshMeta();
          flash('Avatar updated.');
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeAvatarFor = (id: string) => {
    void api.users.setAvatar(id, null).then(() => {
      void refreshMeta();
      flash('Avatar removed.');
    });
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

  // Main process shows native dialogs for every outcome (up to date, prompt to
  // install, verification failure). We just trigger it and surface a light note.
  const checkForUpdates = async () => {
    flash('Checking the shared folder for updates…');
    const res = await api.app.checkUpdate();
    if (res.status === 'up-to-date') flash(`You're on the latest version (${res.current}).`);
    else if (res.status === 'no-folder') flash('Configure a shared folder to receive updates.');
    else if (res.status === 'error') flash(`Update check failed: ${res.message}`);
    else setMsg(null); // 'update-available' → the in-app banner appears
  };

  return (
    <div className="view-pad" style={{ maxWidth: 760 }}>
      <div className="view-header"><h1>Settings</h1></div>
      {msg && <div className="toast" style={{ position: 'static', marginBottom: 14 }}>{msg}</div>}

      <Section title="Identity">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <Avatar user={dbUser} size="lg" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => currentUser && pickAvatarFor(currentUser.id)} disabled={!currentUser}>
              {dbUser?.avatar ? 'Change avatar…' : 'Set avatar…'}
            </button>
            {dbUser?.avatar && currentUser && <button className="danger" onClick={() => removeAvatarFor(currentUser.id)}>Remove</button>}
          </div>
          <input
            ref={avatarInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              onAvatarFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 6 }}>
          Signed in as <strong style={{ color: 'var(--text-primary)' }}>{settings?.currentUser?.name}</strong> ({settings?.currentUser?.id}).
          Identity marks who created and changed each record.
        </p>
        <p className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
          Make one with the Neon Avatar Maker (tools/avatar-maker), export a chip, and set it here. Your avatar syncs to teammates.
        </p>
      </Section>

      {currentUser && ADMIN_IDS.has(currentUser.id) && (
        <TeamAdmin
          users={users}
          flash={flash}
          refresh={refreshMeta}
          onPickAvatar={pickAvatarFor}
          onRemoveAvatar={removeAvatarFor}
        />
      )}

      <Section title="Project">
        <div className="form-row" style={{ maxWidth: 320 }}>
          <label htmlFor="set-project">Project name</label>
          <input
            id="set-project"
            type="text"
            defaultValue={settings?.projectName ?? ''}
            placeholder="e.g. Support AI"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== settings?.projectName) void api.settings.set({ projectName: v }).then(setSettings);
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
          <p className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
            Used as the title in reports, the slide deck, and presentation mode.
          </p>
        </div>
      </Section>

      <Section title="Appearance">
        <div className="form-row" style={{ maxWidth: 320 }}>
          <label htmlFor="set-density">Density</label>
          <select
            id="set-density"
            value={settings?.density ?? 'compact'}
            onChange={(e) => void api.settings.set({ density: e.target.value as 'compact' | 'comfortable' }).then(setSettings)}
          >
            <option value="compact">Compact — more on screen (default)</option>
            <option value="comfortable">Comfortable — larger rows and text</option>
          </select>
        </div>
        <div className="form-row" style={{ maxWidth: 320, marginTop: 12 }}>
          <label htmlFor="set-checkbox">Checkbox shape</label>
          <select
            id="set-checkbox"
            value={settings?.checkboxShape ?? 'circle'}
            onChange={(e) => void api.settings.set({ checkboxShape: e.target.value as 'square' | 'circle' | 'hexagon' }).then(setSettings)}
          >
            <option value="circle">Circle (default)</option>
            <option value="square">Square</option>
            <option value="hexagon">Hexagon</option>
          </select>
          <p className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
            Shape of task-list checkboxes in the editor.
          </p>
        </div>
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

      <Section title="Local agent access">
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 10 }}>
          Off by default. Serves this workspace to local AI agents on
          <span className="mono"> 127.0.0.1</span> — loopback only, never exposed to the network.
        </p>
        <ToggleRow
          id="set-localapi"
          checked={settings?.localApiEnabled ?? false}
          onChange={(v) => void api.settings.set({ localApiEnabled: v }).then(setSettings)}
          label="Read this workspace"
        />
        <ToggleRow
          id="set-localapi-writes"
          sub
          checked={settings?.localApiAllowWrites ?? false}
          disabled={!settings?.localApiEnabled}
          onChange={(v) => void api.settings.set({ localApiAllowWrites: v }).then(setSettings)}
          label="…and make changes"
        />
        <div className="form-row" style={{ maxWidth: 160, marginTop: 10 }}>
          <label htmlFor="set-localapi-port">Port</label>
          <input
            id="set-localapi-port"
            type="number"
            min={1024}
            max={65535}
            defaultValue={settings?.localApiPort ?? 8787}
            onBlur={(e) => {
              const v = parseInt(e.target.value, 10);
              if (Number.isFinite(v) && v >= 1024 && v <= 65535 && v !== settings?.localApiPort)
                void api.settings.set({ localApiPort: v }).then(setSettings);
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
        </div>
        <div className="token-row">
          <label htmlFor="set-localapi-token">Access token</label>
          {token ? (
            <>
              <input
                id="set-localapi-token"
                ref={tokenField}
                className="mono token-field"
                readOnly
                type={tokenShown ? 'text' : 'password'}
                value={token.token}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button className="ghost" onClick={() => setTokenShown((v) => !v)}>
                {tokenShown ? <EyeOff size={12} /> : <Eye size={12} />}
                {tokenShown ? 'Hide' : 'Reveal'}
              </button>
              <button className="ghost" onClick={() => void copyToken()}>
                <Copy size={12} /> Copy
              </button>
              <button className="ghost" onClick={() => void rotateToken()} title="Replace this token">
                <RefreshCw size={12} /> Regenerate
              </button>
            </>
          ) : (
            <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
              Created on the first restart after you switch access on.
            </span>
          )}
        </div>
        <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 10 }}>
          Changes take effect after a restart. The token is unique to this computer and never syncs — share it
          only with agents you trust.
        </p>
      </Section>

      <Section title="Backups">
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 10 }}>
          Snapshots are integrity-checked before they're written, kept newest-first, and pruned to the retention limit.
        </p>
        <ToggleRow
          id="set-autobackup"
          checked={settings?.autoBackup ?? true}
          onChange={(v) => void api.settings.set({ autoBackup: v }).then(setSettings)}
          label="Automatically back up on a timer"
        />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
          <div className="form-row" style={{ maxWidth: 150 }}>
            <label htmlFor="set-backup-interval">Interval (minutes)</label>
            <input
              id="set-backup-interval"
              type="number"
              min={1}
              disabled={!(settings?.autoBackup ?? true)}
              defaultValue={settings?.backupIntervalMin ?? 15}
              onBlur={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isFinite(v) && v >= 1 && v !== settings?.backupIntervalMin)
                  void api.settings.set({ backupIntervalMin: v }).then(setSettings);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
          </div>
          <div className="form-row" style={{ maxWidth: 150 }}>
            <label htmlFor="set-backup-retention">Keep (snapshots)</label>
            <input
              id="set-backup-retention"
              type="number"
              min={1}
              defaultValue={settings?.backupRetention ?? 20}
              onBlur={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isFinite(v) && v >= 1 && v !== settings?.backupRetention)
                  void api.settings.set({ backupRetention: v }).then(setSettings);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 4 }}>
          <button onClick={() => void backupNow()}>
            <Download size={14} /> Back up now
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {backups.length === 0 && (
            <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>No backups yet — use “Back up now” to make one.</p>
          )}
          {backups.map((b) => (
            <div
              key={b.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 10px',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-sm)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="mono"
                  style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {b.name}
                </div>
                <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                  {fmtBytes(b.size)} · {fmtDateTime(b.mtime)}
                </div>
              </div>
              <button onClick={() => void restoreBackup(b.name)}>
                <RotateCcw size={13} /> Restore
              </button>
            </div>
          ))}
        </div>
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

      <Section title="Data">
        <dl className="kv">
          <dt>Database</dt><dd className="mono">{info?.dbPath}</dd>
          <dt>Data folder</dt><dd className="mono">{info?.dataDir}</dd>
          <dt>Device ID</dt><dd className="mono">{info?.deviceId}</dd>
        </dl>
        <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 10 }}>
          All project data lives on this computer (and in the shared folder when sync is enabled). Nothing is sent to any external service.
          Backups land in the <span className="mono">backups</span> folder inside the data folder above; the Backups section manages them.
        </p>
      </Section>

      <Section title="About">
        <div className="about-row">
          <div className="about-logo"><TetherMark size={20} /></div>
          <div>
            <div className="about-name">
              Tether <span className="ident">v{info?.version ?? '…'}</span>
            </div>
            <div className="muted about-legal">© {COPYRIGHT_YEAR} John Crouch. All rights reserved.</div>
          </div>
          <div className="about-actions">
            <button onClick={() => void checkForUpdates()}>
              <RefreshCw size={13} /> Check for updates
            </button>
          </div>
        </div>
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

// Admin-only: create members and manage everyone's avatar. All writes reuse the same synced
// upsert/setAvatar the rest of the app uses, so they propagate through the op-log like any edit.
function TeamAdmin({ users, flash, refresh, onPickAvatar, onRemoveAvatar }: {
  users: User[];
  flash: (m: string) => void;
  refresh: () => void;
  onPickAvatar: (id: string) => void;
  onRemoveAvatar: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [initials, setInitials] = useState('');
  const [color, setColor] = useState('#6E8BFF');
  const [busy, setBusy] = useState(false);

  // Same derivations onboarding uses, so a member created here matches one who self-onboards.
  const deriveId = (n: string) => n.trim().toLowerCase().split(/\s+/)[0] ?? '';
  const deriveInitials = (n: string) => n.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const create = async () => {
    const finalName = name.trim();
    const finalId = (id.trim() || deriveId(finalName)).toLowerCase();
    const finalInitials = (initials.trim() || deriveInitials(finalName)).toUpperCase().slice(0, 3);
    if (!finalName || !finalId || busy) return;
    if (users.some((u) => u.id === finalId)) {
      flash(`A member with id "${finalId}" already exists — pick a different id, or set their avatar above.`);
      return;
    }
    setBusy(true);
    try {
      await api.users.upsert({ id: finalId, name: finalName, initials: finalInitials, color });
      refresh();
      flash(`Added ${finalName} (${finalId}) — they sync to everyone and appear in owner menus.`);
      setName(''); setId(''); setInitials(''); setColor('#6E8BFF');
    } catch (e) {
      flash(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Team (admin)">
      <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 10 }}>
        Set up members and their avatars for the whole team. Everything here syncs to everyone.
        This panel is shown only to you — a convenience, not an enforced permission.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {users.map((u) => (
          <div
            key={u.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
              background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)',
            }}
          >
            <Avatar user={u} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-sm)' }}>{u.name}</div>
              <div className="muted mono" style={{ fontSize: 'var(--fs-xs)' }}>{u.id}</div>
            </div>
            <button onClick={() => onPickAvatar(u.id)}>{u.avatar ? 'Change avatar…' : 'Set avatar…'}</button>
            {u.avatar && <button className="danger" onClick={() => onRemoveAvatar(u.id)}>Remove</button>}
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, marginBottom: 8 }}>Add a member</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-row" style={{ maxWidth: 200 }}>
          <label htmlFor="tm-name">Full name</label>
          <input id="tm-name" type="text" placeholder="e.g. Allen Hill" value={name}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void create()} />
        </div>
        <div className="form-row" style={{ maxWidth: 140 }}>
          <label htmlFor="tm-id">Id (slug)</label>
          <input id="tm-id" type="text" placeholder={deriveId(name) || 'allen'} value={id}
            onChange={(e) => setId(e.target.value)} />
        </div>
        <div className="form-row" style={{ maxWidth: 90 }}>
          <label htmlFor="tm-initials">Initials</label>
          <input id="tm-initials" type="text" placeholder={deriveInitials(name) || 'AH'} value={initials}
            onChange={(e) => setInitials(e.target.value)} maxLength={3} />
        </div>
        <div className="form-row" style={{ maxWidth: 70 }}>
          <label htmlFor="tm-color">Color</label>
          <input id="tm-color" type="color" value={color} onChange={(e) => setColor(e.target.value)}
            style={{ height: 32, padding: 2 }} />
        </div>
        <button className="primary" onClick={() => void create()} disabled={!name.trim() || busy}>
          {busy ? 'Adding…' : 'Add member'}
        </button>
      </div>
      <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 8 }}>
        The member appears for everyone immediately. When they install Tether and pick this identity, they
        adopt this row — the avatar and details you set here are preserved.
      </p>
    </Section>
  );
}

// Checkbox-backed toggle row matching the app's existing label+checkbox pattern.
// `sub` indents and lightens the row so it reads as subordinate to the row above.
function ToggleRow({ id, checked, disabled, onChange, label, sub }: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        marginLeft: sub ? 26 : 0,
        marginBottom: 8,
      }}
    >
      <input id={id} type="checkbox" className="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}
