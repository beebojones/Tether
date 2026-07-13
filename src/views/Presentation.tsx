// Presentation mode: full-screen leadership walkthrough built from live project data.
// ← → or Space to navigate, Esc to exit. Designed for screen sharing.
import { useEffect, useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { WorkItem } from '@shared/types';
import { STATUS_LABEL } from '@shared/types';
import { useApp } from '../store';
import { useItems, TypeIcon, fmtDate } from '../components/ui';
import TetherMark from '../components/TetherMark';
import './presentation.css';

export default function Presentation({ onExit }: { onExit: () => void }) {
  const { milestones, users, settings } = useApp();
  const { items } = useItems({}, { field: 'updatedAt', dir: 'desc' }, 2000);
  const [slide, setSlide] = useState(0);
  const projectName = settings?.projectName?.trim() || 'Project';

  const slides = useMemo(
    () => buildSlides(items, milestones, users, projectName),
    [items, milestones, users, projectName],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') setSlide((s) => Math.min(s + 1, slides.length - 1));
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setSlide((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length, onExit]);

  // Clamp: a data refetch can shrink the slide list while presenting.
  const idx = Math.min(slide, slides.length - 1);
  const current = slides[idx];

  return (
    <div className="present-root">
      <div className="present-slide" key={idx}>
        {current}
      </div>
      <div className="present-nav">
        <button className="ghost" onClick={() => setSlide(Math.max(idx - 1, 0))} disabled={idx === 0} aria-label="Previous slide">
          <ChevronLeft size={18} />
        </button>
        <span className="present-counter">{idx + 1} / {slides.length}</span>
        <button className="ghost" onClick={() => setSlide(Math.min(idx + 1, slides.length - 1))} disabled={idx === slides.length - 1} aria-label="Next slide">
          <ChevronRight size={18} />
        </button>
      </div>
      <button className="ghost present-exit" onClick={onExit} aria-label="Exit presentation"><X size={18} /></button>
    </div>
  );
}

function buildSlides(
  items: WorkItem[],
  milestones: { id: string; name: string; targetDate: string | null }[],
  users: { id: string; name: string }[],
  projectName: string,
): React.ReactNode[] {
  const owner = (id: string | null) => users.find((u) => u.id === id)?.name ?? 'Unassigned';
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const completedWeek = items.filter((i) => i.completedAt && i.completedAt >= weekAgo);
  const active = items.filter((i) => i.status === 'in_progress' || i.status === 'in_review');
  const blockers = items.filter((i) => (i.type === 'blocker' && i.status === 'active') || i.status === 'blocked');
  const accessOpen = items.filter((i) => i.type === 'access' && !['granted', 'denied', 'not_needed', 'expired'].includes(i.status));
  const risks = items.filter((i) => i.type === 'risk' && (i.status === 'open' || i.status === 'mitigating'));
  const decisionsOpen = items.filter((i) => i.type === 'decision' && (i.status === 'proposed' || i.status === 'discussing'));
  const upcoming = items.filter((i) => i.dueDate && !i.completedAt).sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1)).slice(0, 8);

  const List = ({ rows, showOwner = true }: { rows: WorkItem[]; showOwner?: boolean }) => (
    <ul className="present-list">
      {rows.slice(0, 8).map((i) => (
        <li key={i.id}>
          <TypeIcon type={i.type} size={18} />
          <span className="p-ident">{i.ident}</span>
          <span className="p-title">{i.title}</span>
          <span className="p-meta">{STATUS_LABEL[i.status] ?? i.status}{showOwner ? ` · ${owner(i.ownerId)}` : ''}</span>
        </li>
      ))}
      {rows.length === 0 && <li className="p-none">None — clear.</li>}
      {rows.length > 8 && <li className="p-none">+ {rows.length - 8} more in Tether</li>}
    </ul>
  );

  const slides: React.ReactNode[] = [];

  slides.push(
    <div className="present-title">
      <div className="present-logo"><TetherMark size={44} /></div>
      <h1>{projectName}</h1>
      <p>Project status walkthrough</p>
      <p className="p-date">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>,
  );

  slides.push(
    <div>
      <h2>Where we are</h2>
      <div className="present-stats">
        <Stat n={active.length} label="In progress" />
        <Stat n={completedWeek.length} label="Completed this week" tone="good" />
        <Stat n={blockers.length} label="Blocked" tone={blockers.length ? 'bad' : 'good'} />
        <Stat n={accessOpen.length} label="Access pending" tone={accessOpen.length ? 'warn' : 'good'} />
        <Stat n={decisionsOpen.length} label="Decisions open" tone={decisionsOpen.length ? 'warn' : 'good'} />
        <Stat n={risks.length} label="Active risks" tone={risks.length ? 'warn' : 'good'} />
      </div>
    </div>,
  );

  if (milestones.length) {
    slides.push(
      <div>
        <h2>Milestones</h2>
        <div className="present-milestones">
          {milestones.map((m) => {
            const inMs = items.filter((i) => i.milestoneId === m.id);
            const done = inMs.filter((i) => i.completedAt).length;
            const pct = inMs.length ? Math.round((done / inMs.length) * 100) : 0;
            return (
              <div key={m.id} className="pm-row">
                <div className="pm-head">
                  <span>{m.name}</span>
                  <span className="p-meta">{m.targetDate ? fmtDate(m.targetDate) : ''} · {pct}%</span>
                </div>
                <div className="pm-track"><div className="pm-fill" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>,
    );
  }

  if (completedWeek.length) slides.push(<div><h2>Delivered this week</h2><List rows={completedWeek} /></div>);
  slides.push(<div><h2>Current focus</h2><List rows={active} /></div>);
  slides.push(<div><h2>Blocked &amp; waiting</h2><List rows={blockers} /></div>);
  if (accessOpen.length) slides.push(<div><h2>Access needed</h2><List rows={accessOpen} /></div>);
  if (risks.length) slides.push(<div><h2>Risks we're watching</h2><List rows={risks} /></div>);
  if (decisionsOpen.length) slides.push(<div><h2>Decisions we need</h2><List rows={decisionsOpen} /></div>);
  if (upcoming.length) slides.push(<div><h2>Coming up</h2><List rows={upcoming} /></div>);

  slides.push(
    <div className="present-title">
      <h1>Questions?</h1>
      <p>Full detail lives in Tether — every item on these slides is tracked, linked, and current.</p>
    </div>,
  );

  return slides;
}

function Stat({ n, label, tone }: { n: number; label: string; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <div className={`present-stat ${tone ?? ''}`}>
      <div className="ps-n">{n}</div>
      <div className="ps-l">{label}</div>
    </div>
  );
}
