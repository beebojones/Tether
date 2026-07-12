// Roadmap: milestones with progress + contained work; releases with scope; inline editing.
import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import type { Milestone, Release } from '@shared/types';
import { api } from '../api';
import { useApp } from '../store';
import { useItems, fmtDate, Modal, TypeIcon, StatusBadge } from '../components/ui';

export default function RoadmapView() {
  const { milestones, releases, refreshMeta, openItem } = useApp();
  const { items } = useItems({}, { field: 'dueDate', dir: 'asc' }, 2000);
  const [editMilestone, setEditMilestone] = useState<Partial<Milestone> | null>(null);
  const [editRelease, setEditRelease] = useState<Partial<Release> | null>(null);

  return (
    <div className="view-pad">
      <div className="view-header">
        <h1>Roadmap</h1>
        <div className="spacer" />
        <button onClick={() => setEditRelease({})}><Plus size={14} /> New release</button>
        <button className="primary" onClick={() => setEditMilestone({})}><Plus size={14} /> New milestone</button>
      </div>

      {milestones.length === 0 && (
        <div className="empty-state">
          <div className="big">No milestones yet</div>
          Milestones structure the roadmap and drive dashboard progress.
        </div>
      )}

      {milestones.map((m) => {
        const inMs = items.filter((i) => i.milestoneId === m.id);
        const done = inMs.filter((i) => i.completedAt).length;
        const pct = inMs.length ? Math.round((done / inMs.length) * 100) : 0;
        return (
          <section key={m.id} className="dash-card" style={{ marginBottom: 14 }}>
            <div className="dash-card-head" style={{ textTransform: 'none', fontSize: 'var(--fs-md)', letterSpacing: 0 }}>
              {m.name}
              {m.sample === 1 && <span className="sample-badge">SAMPLE</span>}
              <span className="muted" style={{ fontWeight: 400, fontSize: 'var(--fs-xs)' }}>
                {m.targetDate ? `Target ${fmtDate(m.targetDate)}` : 'No target date'} · {m.status}
              </span>
              <span style={{ flex: 1 }} />
              <span className="muted" style={{ fontSize: 'var(--fs-xs)', fontWeight: 400 }}>{done}/{inMs.length} done · {pct}%</span>
              <button className="ghost" onClick={() => setEditMilestone(m)} aria-label={`Edit ${m.name}`}><Pencil size={13} /></button>
            </div>
            <div style={{ padding: '0 14px' }}>
              <div className="progress-track" style={{ marginBottom: 10 }}>
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              {m.description && <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 10 }}>{m.description}</p>}
            </div>
            <div className="dash-card-body">
              {inMs.map((it) => (
                <div key={it.id} className="dash-row" onClick={() => openItem(it.id)} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openItem(it.id)}>
                  <TypeIcon type={it.type} size={13} />
                  <span className="ident">{it.ident}</span>
                  <span className="dash-row-title">{it.title}</span>
                  {it.dueDate && <span className="due">{fmtDate(it.dueDate)}</span>}
                  <StatusBadge status={it.status} />
                </div>
              ))}
              {inMs.length === 0 && <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>No items assigned to this milestone yet.</div>}
            </div>
          </section>
        );
      })}

      <h2 style={{ fontSize: 'var(--fs-xl)', margin: '26px 0 12px' }}>Releases</h2>
      {releases.length === 0 && <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>No releases planned yet.</p>}
      {releases.map((r) => {
        const inRel = items.filter((i) => i.releaseId === r.id);
        const done = inRel.filter((i) => i.completedAt).length;
        return (
          <section key={r.id} className="dash-card" style={{ marginBottom: 14 }}>
            <div className="dash-card-head" style={{ textTransform: 'none', fontSize: 'var(--fs-md)', letterSpacing: 0 }}>
              {r.name} {r.version && <span className="ident">v{r.version}</span>}
              {r.sample === 1 && <span className="sample-badge">SAMPLE</span>}
              <span className="muted" style={{ fontWeight: 400, fontSize: 'var(--fs-xs)' }}>
                {r.targetDate ? `Target ${fmtDate(r.targetDate)}` : 'No date'} · {r.status.replace('_', ' ')}
              </span>
              <span style={{ flex: 1 }} />
              <span className="muted" style={{ fontSize: 'var(--fs-xs)', fontWeight: 400 }}>{done}/{inRel.length} done</span>
              <button className="ghost" onClick={() => setEditRelease(r)} aria-label={`Edit ${r.name}`}><Pencil size={13} /></button>
            </div>
            {r.goals && <p className="muted" style={{ fontSize: 'var(--fs-sm)', padding: '0 14px 10px' }}>{r.goals}</p>}
            <div className="dash-card-body">
              {inRel.map((it) => (
                <div key={it.id} className="dash-row" onClick={() => openItem(it.id)} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openItem(it.id)}>
                  <TypeIcon type={it.type} size={13} />
                  <span className="ident">{it.ident}</span>
                  <span className="dash-row-title">{it.title}</span>
                  <StatusBadge status={it.status} />
                </div>
              ))}
              {inRel.length === 0 && <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>No items scoped to this release yet.</div>}
            </div>
          </section>
        );
      })}

      {editMilestone && (
        <MilestoneDialog initial={editMilestone} onClose={() => { setEditMilestone(null); void refreshMeta(); }} />
      )}
      {editRelease && (
        <ReleaseDialog initial={editRelease} onClose={() => { setEditRelease(null); void refreshMeta(); }} />
      )}
    </div>
  );
}

function MilestoneDialog({ initial, onClose }: { initial: Partial<Milestone>; onClose: () => void }) {
  const [name, setName] = useState(initial.name ?? '');
  const [targetDate, setTargetDate] = useState(initial.targetDate ?? '');
  const [status, setStatus] = useState<Milestone['status']>(initial.status ?? 'planned');
  const [description, setDescription] = useState(initial.description ?? '');
  const save = async () => {
    if (!name.trim()) return;
    await api.milestones.upsert({ ...initial, name: name.trim(), targetDate: targetDate || null, status, description });
    onClose();
  };
  return (
    <Modal title={initial.id ? 'Edit milestone' : 'New milestone'} onClose={onClose}
      footer={<><button className="ghost" onClick={onClose}>Cancel</button><button className="primary" onClick={() => void save()} disabled={!name.trim()}>Save</button></>}>
      <div className="form-row"><label htmlFor="ms-name">Name</label>
        <input id="ms-name" type="text" autoFocus value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="form-grid">
        <div className="form-row"><label htmlFor="ms-date">Target date</label>
          <input id="ms-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
        <div className="form-row"><label htmlFor="ms-status">Status</label>
          <select id="ms-status" value={status} onChange={(e) => setStatus(e.target.value as Milestone['status'])}>
            <option value="planned">Planned</option><option value="active">Active</option><option value="done">Done</option>
          </select></div>
      </div>
      <div className="form-row"><label htmlFor="ms-desc">Description</label>
        <textarea id="ms-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
    </Modal>
  );
}

function ReleaseDialog({ initial, onClose }: { initial: Partial<Release>; onClose: () => void }) {
  const [name, setName] = useState(initial.name ?? '');
  const [version, setVersion] = useState(initial.version ?? '');
  const [targetDate, setTargetDate] = useState(initial.targetDate ?? '');
  const [status, setStatus] = useState<Release['status']>(initial.status ?? 'planned');
  const [goals, setGoals] = useState(initial.goals ?? '');
  const save = async () => {
    if (!name.trim()) return;
    await api.releases.upsert({ ...initial, name: name.trim(), version, targetDate: targetDate || null, status, goals });
    onClose();
  };
  return (
    <Modal title={initial.id ? 'Edit release' : 'New release'} onClose={onClose}
      footer={<><button className="ghost" onClick={onClose}>Cancel</button><button className="primary" onClick={() => void save()} disabled={!name.trim()}>Save</button></>}>
      <div className="form-row"><label htmlFor="rl-name">Name</label>
        <input id="rl-name" type="text" autoFocus value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="form-grid">
        <div className="form-row"><label htmlFor="rl-ver">Version</label>
          <input id="rl-ver" type="text" placeholder="0.1" value={version} onChange={(e) => setVersion(e.target.value)} /></div>
        <div className="form-row"><label htmlFor="rl-date">Target date</label>
          <input id="rl-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
        <div className="form-row"><label htmlFor="rl-status">Status</label>
          <select id="rl-status" value={status} onChange={(e) => setStatus(e.target.value as Release['status'])}>
            <option value="planned">Planned</option><option value="in_progress">In progress</option>
            <option value="released">Released</option><option value="cancelled">Cancelled</option>
          </select></div>
      </div>
      <div className="form-row"><label htmlFor="rl-goals">Goals</label>
        <textarea id="rl-goals" rows={3} value={goals} onChange={(e) => setGoals(e.target.value)} /></div>
    </Modal>
  );
}
