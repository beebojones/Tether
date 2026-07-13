// Kanban board over work statuses. Columns reflow into a responsive grid (count
// follows window width), and which columns show, their order, and size are
// per-user customizable (local prefs).
import { useState } from 'react';
import type { WorkItem } from '@shared/types';
import { WORK_STATUSES, STATUS_LABEL } from '@shared/types';
import { useItems, TypeIcon, PriorityMark, OwnerAvatar, fmtDate, isOverdue } from '../components/ui';
import ViewCustomizer from '../components/ViewCustomizer';
import { useViewPrefs } from '../useViewPrefs';
import { visibleKeys, type CanonicalItem } from '../viewPrefs';
import { api } from '../api';
import { useApp } from '../store';
import './board.css';

const BOARD_TYPES = ['task', 'feature', 'requirement', 'story', 'defect', 'research', 'idea'] as const;
const BOARD_COLUMNS: CanonicalItem[] = WORK_STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s] }));

export default function BoardView() {
  const { openItem } = useApp();
  const { items } = useItems({ types: [...BOARD_TYPES] }, { field: 'priority', dir: 'asc' }, 1000);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const { resolved, defaults, update } = useViewPrefs('board', BOARD_COLUMNS);

  const byStatus = new Map<string, WorkItem[]>();
  for (const s of WORK_STATUSES) byStatus.set(s, []);
  for (const it of items) byStatus.get(it.status)?.push(it);

  const columns = visibleKeys(resolved);

  return (
    <div className="board-wrap">
      <div className="view-header">
        <h1>Board</h1>
        <div className="spacer" />
        <ViewCustomizer noun="columns" prefs={resolved} defaults={defaults} onChange={update} />
      </div>

      {columns.length === 0 ? (
        <div className="muted" style={{ padding: 'var(--sp-4)' }}>
          All columns are hidden. Use Customize to show some.
        </div>
      ) : (
        <div className="board" data-size={resolved.size}>
          {columns.map((status) => (
            <div
              key={status}
              className={`board-col ${dragOver === status ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
              onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData('text/tether-item');
                if (id) void api.items.update(id, { status });
              }}
            >
              <div className="board-col-head">
                {STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status}
                <span className="muted">{byStatus.get(status)?.length ?? 0}</span>
              </div>
              <div className="board-col-cards">
                {(byStatus.get(status) ?? []).map((it) => (
                  <div
                    key={it.id}
                    className="board-card"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/tether-item', it.id)}
                    onClick={() => openItem(it.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openItem(it.id)}
                  >
                    <div className="board-card-top">
                      <TypeIcon type={it.type} size={13} />
                      <span className="ident">{it.ident}</span>
                      <span style={{ flex: 1 }} />
                      <PriorityMark priority={it.priority} />
                    </div>
                    <div className="board-card-title">{it.title}</div>
                    <div className="board-card-bottom">
                      {it.dueDate && <span className={`due ${isOverdue(it) ? 'overdue' : ''}`}>{fmtDate(it.dueDate)}</span>}
                      {it.sample === 1 && <span className="sample-badge">SAMPLE</span>}
                      <span style={{ flex: 1 }} />
                      <OwnerAvatar ownerId={it.ownerId} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
