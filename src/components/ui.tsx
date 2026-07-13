// Small shared building blocks: avatars, badges, type icons, modal, data hooks.
import { useEffect, useState, type ReactNode } from 'react';
import {
  CheckSquare, Puzzle, FileText, BookOpen, Scale, AlertTriangle, OctagonX, KeyRound,
  CalendarDays, Lightbulb, HelpCircle, Bug, FlaskConical, type LucideIcon,
} from 'lucide-react';
import type { ItemType, Priority, WorkItem, ItemFilter, ItemSort } from '@shared/types';
import { STATUS_LABEL, TYPE_LABEL } from '@shared/types';
import type { User } from '@shared/types';
import { api } from '../api';
import { useApp, userById } from '../store';

export const TYPE_ICON: Record<ItemType, LucideIcon> = {
  task: CheckSquare,
  feature: Puzzle,
  requirement: FileText,
  story: BookOpen,
  decision: Scale,
  risk: AlertTriangle,
  blocker: OctagonX,
  access: KeyRound,
  meeting: CalendarDays,
  idea: Lightbulb,
  question: HelpCircle,
  defect: Bug,
  research: FlaskConical,
};

export const TYPE_COLOR: Record<ItemType, string> = {
  task: 'var(--st-progress)',
  feature: '#9b6ef2',
  requirement: '#4cb8c4',
  story: '#4cb8c4',
  decision: 'var(--warning)',
  risk: '#f2864c',
  blocker: 'var(--danger)',
  access: '#e8c14c',
  meeting: 'var(--success)',
  idea: '#d9a5f0',
  question: 'var(--text-secondary)',
  defect: 'var(--danger)',
  research: '#6ec4b8',
};

export function TypeIcon({ type, size = 15 }: { type: ItemType; size?: number }) {
  const Icon = TYPE_ICON[type];
  return <Icon size={size} color={TYPE_COLOR[type]} aria-label={TYPE_LABEL[type]} />;
}

const STATUS_COLOR: Record<string, string> = {
  backlog: 'var(--st-backlog)', todo: 'var(--st-todo)', in_progress: 'var(--st-progress)',
  in_review: 'var(--st-review)', blocked: 'var(--st-blocked)', done: 'var(--st-done)',
  cancelled: 'var(--st-cancelled)',
  proposed: 'var(--st-todo)', discussing: 'var(--st-progress)', approved: 'var(--st-done)',
  rejected: 'var(--st-cancelled)', revisit: 'var(--st-warning)', superseded: 'var(--st-cancelled)',
  identified: 'var(--st-backlog)', not_requested: 'var(--st-backlog)', preparing: 'var(--st-todo)',
  requested: 'var(--st-progress)', under_review: 'var(--st-review)', info_needed: 'var(--st-warning)',
  partially_approved: 'var(--st-warning)', granted: 'var(--st-done)', denied: 'var(--st-blocked)',
  expired: 'var(--st-warning)', not_needed: 'var(--st-cancelled)',
  open: 'var(--st-warning)', mitigating: 'var(--st-progress)', accepted: 'var(--st-backlog)', closed: 'var(--st-done)',
  active: 'var(--st-blocked)', workaround: 'var(--st-warning)', resolved: 'var(--st-done)',
  answered: 'var(--st-done)', parked: 'var(--st-backlog)',
  scheduled: 'var(--st-todo)', held: 'var(--st-progress)', summarized: 'var(--st-done)',
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? 'var(--text-muted)';
  return (
    <span className="badge" style={{ color, background: 'color-mix(in srgb, ' + color + ' 13%, transparent)' }}>
      <span className="bdot" />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: 'var(--pr-urgent)', high: 'var(--pr-high)', medium: 'var(--pr-medium)',
  low: 'var(--pr-low)', none: 'var(--text-faint)',
};
const PRIORITY_GLYPH: Record<Priority, string> = { urgent: '▲!', high: '▲', medium: '◆', low: '▽', none: '—' };

export function PriorityMark({ priority, showLabel = false }: { priority: Priority; showLabel?: boolean }) {
  return (
    <span title={`Priority: ${priority}`} style={{ color: PRIORITY_COLOR[priority], fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {PRIORITY_GLYPH[priority]}{showLabel ? ` ${priority}` : ''}
    </span>
  );
}

export function Avatar({ user, size }: { user: User | null; size?: 'lg' }) {
  if (!user) {
    return (
      <span className={`avatar ${size ?? ''}`} style={{ background: 'var(--bg-raised)', color: 'var(--text-faint)', border: '1px dashed var(--border-strong)' }} title="Unassigned">
        ·
      </span>
    );
  }
  return (
    <span
      className={`avatar ${size ?? ''}`}
      style={user.avatar ? { padding: 0, overflow: 'hidden' } : { background: user.color }}
      title={user.name}
    >
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }}
        />
      ) : (
        user.initials
      )}
    </span>
  );
}

export function OwnerAvatar({ ownerId }: { ownerId: string | null }) {
  const users = useApp((s) => s.users);
  return <Avatar user={userById(users, ownerId)} />;
}

export function Modal({ title, onClose, children, footer, width }: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={width ? { width } : undefined} role="dialog" aria-modal="true">
        <div className="modal-head">{title}</div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/** Fetch items reactively: refetches when data changes anywhere (local edit or sync). */
export function useItems(filter: ItemFilter, sort: ItemSort = { field: 'updatedAt', dir: 'desc' }, limit = 500) {
  const dataTick = useApp((s) => s.dataTick);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify({ filter, sort, limit });
  useEffect(() => {
    let alive = true;
    api.items
      .list(filter, sort, limit)
      .then((rows) => {
        if (alive) {
          setItems(rows);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('items:list failed', err);
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, dataTick]);
  return { items, loading };
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`;
}

export function isOverdue(item: WorkItem): boolean {
  return !!item.dueDate && !item.completedAt && item.dueDate < new Date().toISOString().slice(0, 10);
}
