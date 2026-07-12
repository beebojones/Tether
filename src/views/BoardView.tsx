// Kanban board over work statuses with HTML5 drag-and-drop between columns.
import { useState } from 'react';
import type { WorkItem } from '@shared/types';
import { WORK_STATUSES, STATUS_LABEL } from '@shared/types';
import { useItems, TypeIcon, PriorityMark, OwnerAvatar, fmtDate, isOverdue } from '../components/ui';
import { api } from '../api';
import { useApp } from '../store';
import './board.css';

const BOARD_TYPES = ['task', 'feature', 'requirement', 'story', 'defect', 'research', 'idea'] as const;

export default function BoardView() {
  const { openItem } = useApp();
  const { items } = useItems({ types: [...BOARD_TYPES] }, { field: 'priority', dir: 'asc' }, 1000);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const byStatus = new Map<string, WorkItem[]>();
  for (const s of WORK_STATUSES) byStatus.set(s, []);
  for (const it of items) byStatus.get(it.status)?.push(it);

  return (
    <div className="board">
      {WORK_STATUSES.map((status) => (
        <div
          key={status}
          className={`board-col ${dragOver === status ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
          onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(null);
            const id = e.dataTransfer.getData('text/keystone-item');
            if (id) void api.items.update(id, { status });
          }}
        >
          <div className="board-col-head">
            {STATUS_LABEL[status]}
            <span className="muted">{byStatus.get(status)?.length ?? 0}</span>
          </div>
          <div className="board-col-cards">
            {(byStatus.get(status) ?? []).map((it) => (
              <div
                key={it.id}
                className="board-card"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/keystone-item', it.id)}
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
  );
}
