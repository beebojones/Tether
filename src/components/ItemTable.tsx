// Shared item table with grouping, sorting, quick status/priority edit, row click → detail.
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { WorkItem, ItemSort, Priority } from '@shared/types';
import { STATUS_LABEL, PRIORITIES, statusesForType } from '@shared/types';
import { TypeIcon, StatusBadge, PriorityMark, OwnerAvatar, fmtDate, isOverdue } from './ui';
import { api } from '../api';
import { useApp } from '../store';
import './item-table.css';

export type GroupBy = 'none' | 'status' | 'type' | 'priority' | 'owner' | 'milestone';

export default function ItemTable({ items, groupBy = 'none', emptyText }: {
  items: WorkItem[];
  groupBy?: GroupBy;
  emptyText?: string;
}) {
  const { openItem, users, milestones, settings } = useApp();
  const myId = settings?.currentUser?.id ?? null;
  // A row is "changed by someone else" if the last editor isn't me and it happened recently.
  const changedByOther = (it: WorkItem) =>
    !!it.updatedBy && it.updatedBy !== myId && it.createdAt !== it.updatedAt &&
    Date.now() - new Date(it.updatedAt).getTime() < 3 * 864e5;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'all', label: '', items }];
    const map = new Map<string, WorkItem[]>();
    for (const it of items) {
      let key: string;
      switch (groupBy) {
        case 'status': key = it.status; break;
        case 'type': key = it.type; break;
        case 'priority': key = it.priority; break;
        case 'owner': key = it.ownerId ?? '(unassigned)'; break;
        case 'milestone': key = it.milestoneId ?? '(no milestone)'; break;
        default: key = 'all';
      }
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return [...map.entries()].map(([key, groupItems]) => {
      let label = key;
      if (groupBy === 'status') label = STATUS_LABEL[key] ?? key;
      if (groupBy === 'owner') label = users.find((u) => u.id === key)?.name ?? key;
      if (groupBy === 'milestone') label = milestones.find((m) => m.id === key)?.name ?? key;
      if (groupBy === 'priority' || groupBy === 'type') label = key[0].toUpperCase() + key.slice(1);
      return { key, label, items: groupItems };
    });
  }, [items, groupBy, users, milestones]);

  if (items.length === 0) {
    return <div className="empty-state"><div className="big">Nothing here yet</div>{emptyText ?? 'Create an item to get started.'}</div>;
  }

  return (
    <div className="item-table">
      {groups.map((g) => (
        <div key={g.key}>
          {groupBy !== 'none' && (
            <button
              className="group-head"
              onClick={() =>
                setCollapsed((s) => {
                  const next = new Set(s);
                  if (next.has(g.key)) next.delete(g.key);
                  else next.add(g.key);
                  return next;
                })
              }
            >
              {collapsed.has(g.key) ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              {g.label}
              <span className="muted" style={{ fontWeight: 400 }}>{g.items.length}</span>
            </button>
          )}
          {!collapsed.has(g.key) &&
            g.items.map((it) => (
              <div key={it.id} className="item-row" onClick={() => openItem(it.id)} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openItem(it.id)}>
                <PriorityQuick item={it} />
                <TypeIcon type={it.type} size={14} />
                <span className="ident">{it.ident}</span>
                <span className="item-title">
                  {it.title}
                  {changedByOther(it) && (
                    <span className="changed-dot" title={`Recently changed by ${users.find((u) => u.id === it.updatedBy)?.name ?? it.updatedBy}`} />
                  )}
                  {it.sample === 1 && <span className="sample-badge" style={{ marginLeft: 8 }}>SAMPLE</span>}
                </span>
                {it.dueDate && (
                  <span className={`due ${isOverdue(it) ? 'overdue' : ''}`}>{fmtDate(it.dueDate)}</span>
                )}
                <StatusQuick item={it} />
                <OwnerAvatar ownerId={it.ownerId} />
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

function StatusQuick({ item }: { item: WorkItem }) {
  const [open, setOpen] = useState(false);
  const statuses = statusesForType(item.type);
  return (
    <span style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <span onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }} role="button" tabIndex={0}
        aria-label={`Change status (${item.status})`}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(!open)}>
        <StatusBadge status={item.status} />
      </span>
      {open && (
        <QuickMenu onClose={() => setOpen(false)}>
          {statuses.map((s) => (
            <button key={s} className="ghost quick-opt" onClick={() => { void api.items.update(item.id, { status: s }); setOpen(false); }}>
              <StatusBadge status={s} />
            </button>
          ))}
        </QuickMenu>
      )}
    </span>
  );
}

function PriorityQuick({ item }: { item: WorkItem }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', width: 22, textAlign: 'center' }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <span onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }} role="button" tabIndex={0}
        aria-label={`Change priority (${item.priority})`}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(!open)}>
        <PriorityMark priority={item.priority} />
      </span>
      {open && (
        <QuickMenu onClose={() => setOpen(false)}>
          {PRIORITIES.map((p) => (
            <button key={p} className="ghost quick-opt" onClick={() => { void api.items.update(item.id, { priority: p as Priority }); setOpen(false); }}>
              <PriorityMark priority={p as Priority} showLabel />
            </button>
          ))}
        </QuickMenu>
      )}
    </span>
  );
}

function QuickMenu({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
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
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={onClose} />
      <div className="quick-menu" role="menu">{children}</div>
    </>
  );
}
