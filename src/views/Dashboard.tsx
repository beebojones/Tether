// Project dashboard: answers "what needs attention" from live data — no decorative metrics.
import { useEffect, useState } from 'react';
import { AlertTriangle, KeyRound, Scale, Clock, CheckCircle2, Activity as ActivityIcon } from 'lucide-react';
import type { WorkItem, ActivityEntry } from '@shared/types';
import { api } from '../api';
import { useApp } from '../store';
import { useItems, TypeIcon, StatusBadge, fmtDate, fmtDateTime } from '../components/ui';
import { describeActivity } from './ItemDetail';
import ProjectHealth from '../components/ProjectHealth';
import ViewCustomizer from '../components/ViewCustomizer';
import { useViewPrefs } from '../useViewPrefs';
import { visibleKeys, type CanonicalItem } from '../viewPrefs';
import './dashboard.css';

const DASHBOARD_CARDS: CanonicalItem[] = [
  { key: 'in-progress', label: 'In progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'access', label: 'Access requests in flight' },
  { key: 'decisions', label: 'Decisions needed' },
  { key: 'due', label: 'Due soon / overdue' },
  { key: 'completed', label: 'Completed this week' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'activity', label: 'Recent activity' },
];

export default function Dashboard() {
  const { openItem, milestones, users, navigate } = useApp();
  const dataTick = useApp((s) => s.dataTick);
  const { resolved, defaults, update } = useViewPrefs('dashboard', DASHBOARD_CARDS);
  const cardProps = (key: string) => {
    const idx = resolved.items.findIndex((i) => i.key === key);
    return { order: idx < 0 ? 999 : idx, hidden: idx < 0 ? true : !resolved.items[idx].visible };
  };

  const { items: inProgress } = useItems({ statuses: ['in_progress', 'in_review'] }, { field: 'priority', dir: 'asc' }, 12);
  const { items: blocked } = useItems({ types: ['blocker'], statuses: ['active'] }, { field: 'priority', dir: 'asc' }, 10);
  const { items: blockedWork } = useItems({ statuses: ['blocked'] }, { field: 'priority', dir: 'asc' }, 10);
  const { items: accessWaiting } = useItems({ types: ['access'], statuses: ['requested', 'under_review', 'info_needed', 'preparing', 'identified'] }, { field: 'updatedAt', dir: 'desc' }, 10);
  const { items: openDecisions } = useItems({ types: ['decision'], statuses: ['proposed', 'discussing'] }, { field: 'updatedAt', dir: 'desc' }, 8);
  const { items: dueSoon } = useItems({ dueWithinDays: 7 }, { field: 'dueDate', dir: 'asc' }, 10);
  const { items: overdue } = useItems({ overdue: true }, { field: 'dueDate', dir: 'asc' }, 10);
  const { items: allOpen } = useItems({}, { field: 'updatedAt', dir: 'desc' }, 1000);

  const [recent, setRecent] = useState<ActivityEntry[]>([]);
  const [completedWeek, setCompletedWeek] = useState<WorkItem[]>([]);

  useEffect(() => {
    void api.activity.for(null, 14).then(setRecent);
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    void api.items
      .list({ updatedSince: weekAgo }, { field: 'updatedAt', dir: 'desc' }, 200)
      .then((rows) => setCompletedWeek(rows.filter((r) => r.completedAt && r.completedAt >= weekAgo)));
  }, [dataTick]);

  const Row = ({ it, right }: { it: WorkItem; right?: React.ReactNode }) => (
    <div className="dash-row" onClick={() => openItem(it.id)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && openItem(it.id)}>
      <TypeIcon type={it.type} size={13} />
      <span className="ident">{it.ident}</span>
      <span className="dash-row-title">{it.title}</span>
      {right ?? <StatusBadge status={it.status} />}
    </div>
  );

  return (
    <div className="view-pad dashboard">
      <div className="view-header">
        <h1>Dashboard</h1>
        <div className="spacer" />
        <ProjectHealth
          blocked={blocked.length + blockedWork.length}
          overdue={overdue.length}
          accessWaiting={accessWaiting.length}
          openDecisions={openDecisions.length}
          openHighRisks={allOpen.filter((i) => i.type === 'risk' && (i.status === 'open' || i.status === 'mitigating') && (i.priority === 'high' || i.priority === 'urgent')).length}
        />
        <ViewCustomizer noun="cards" prefs={resolved} defaults={defaults} onChange={update} />
      </div>

      <div className="dash-grid" data-size={resolved.size}>
        <Card {...cardProps('in-progress')} title="In progress" icon={<ActivityIcon size={14} />} onMore={() => navigate({ view: 'items', title: 'All Work' })}>
          {inProgress.length === 0 && <Empty text="Nothing in flight. Pick something from the backlog." />}
          {inProgress.map((it) => <Row key={it.id} it={it} />)}
        </Card>

        <Card {...cardProps('blocked')} title="Blocked" icon={<AlertTriangle size={14} />} tone={blocked.length + blockedWork.length > 0 ? 'danger' : undefined}
          onMore={() => navigate({ view: 'risks' })}>
          {blocked.length + blockedWork.length === 0 && <Empty text="No active blockers." />}
          {blocked.map((it) => <Row key={it.id} it={it} />)}
          {blockedWork.map((it) => <Row key={it.id} it={it} />)}
        </Card>

        <Card {...cardProps('access')} title="Access requests in flight" icon={<KeyRound size={14} />} tone={accessWaiting.length > 0 ? 'warning' : undefined}
          onMore={() => navigate({ view: 'access' })}>
          {accessWaiting.length === 0 && <Empty text="No pending access requests." />}
          {accessWaiting.map((it) => <Row key={it.id} it={it} />)}
        </Card>

        <Card {...cardProps('decisions')} title="Decisions needed" icon={<Scale size={14} />} onMore={() => navigate({ view: 'decisions' })}>
          {openDecisions.length === 0 && <Empty text="No open decisions." />}
          {openDecisions.map((it) => <Row key={it.id} it={it} />)}
        </Card>

        <Card {...cardProps('due')} title="Due soon / overdue" icon={<Clock size={14} />} tone={overdue.length > 0 ? 'danger' : undefined}>
          {overdue.length === 0 && dueSoon.length === 0 && <Empty text="Nothing due in the next 7 days." />}
          {overdue.map((it) => (
            <Row key={it.id} it={it} right={<span className="due overdue">{fmtDate(it.dueDate)} · overdue</span>} />
          ))}
          {dueSoon.filter((d) => !overdue.some((o) => o.id === d.id)).map((it) => (
            <Row key={it.id} it={it} right={<span className="due">{fmtDate(it.dueDate)}</span>} />
          ))}
        </Card>

        <Card {...cardProps('completed')} title="Completed this week" icon={<CheckCircle2 size={14} />} tone="success">
          {completedWeek.length === 0 && <Empty text="Nothing completed yet this week." />}
          {completedWeek.slice(0, 10).map((it) => <Row key={it.id} it={it} />)}
        </Card>

        <Card {...cardProps('milestones')} title="Milestones" wide>
          {milestones.length === 0 && <Empty text="No milestones defined. Add them in Roadmap." />}
          {milestones.map((m) => {
            const inMs = allOpen.filter((i) => i.milestoneId === m.id);
            const done = inMs.filter((i) => i.completedAt).length;
            const pct = inMs.length ? Math.round((done / inMs.length) * 100) : 0;
            return (
              <div key={m.id} className="milestone-row" onClick={() => navigate({ view: 'roadmap' })} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate({ view: 'roadmap' })}>
                <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{m.name}</span>
                <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{m.targetDate ? fmtDate(m.targetDate) : 'No date'}</span>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <span className="muted" style={{ fontSize: 'var(--fs-xs)', minWidth: 70, textAlign: 'right' }}>{done}/{inMs.length} · {pct}%</span>
              </div>
            );
          })}
        </Card>

        <Card {...cardProps('activity')} title="Recent activity" wide onMore={() => navigate({ view: 'activity' })}>
          {recent.length === 0 && <Empty text="No activity yet." />}
          {recent.map((a) => (
            <div key={a.id} className="dash-activity" onClick={() => a.itemId && openItem(a.itemId)} role={a.itemId ? 'button' : undefined}>
              <span className="muted" style={{ whiteSpace: 'nowrap', fontSize: 'var(--fs-xs)' }}>{fmtDateTime(a.at)}</span>
              <span style={{ fontSize: 'var(--fs-sm)' }}>{describeActivity(a, users)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, icon, children, tone, wide, onMore, order, hidden }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode;
  tone?: 'danger' | 'warning' | 'success'; wide?: boolean; onMore?: () => void;
  order?: number; hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <section className={`dash-card ${tone ?? ''} ${wide ? 'wide' : ''}`} style={{ order }}>
      <div className="dash-card-head">
        {icon}
        {title}
        <span style={{ flex: 1 }} />
        {onMore && <button className="ghost" style={{ fontSize: 'var(--fs-xs)', padding: '2px 8px' }} onClick={onMore}>View all</button>}
      </div>
      <div className="dash-card-body">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="muted" style={{ fontSize: 'var(--fs-sm)', padding: '6px 0' }}>{text}</div>;
}
