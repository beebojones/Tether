// Generic filterable work-item list. Powers "All Work" and any type-scoped list.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { ItemType, ItemFilter, ItemSort, Priority } from '@shared/types';
import { ITEM_TYPES, TYPE_LABEL, WORK_STATUSES, STATUS_LABEL, PRIORITIES } from '@shared/types';
import { useItems } from '../components/ui';
import ItemTable, { type GroupBy } from '../components/ItemTable';
import CreateItemDialog from '../components/CreateItemDialog';
import { useApp } from '../store';

export default function ItemsView({ types, title }: { types?: ItemType[]; title: string }) {
  const users = useApp((s) => s.users);
  const [typeFilter, setTypeFilter] = useState<ItemType | ''>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [sort, setSort] = useState<ItemSort>({ field: 'updatedAt', dir: 'desc' });
  const [showArchived, setShowArchived] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const filter: ItemFilter = {
    types: typeFilter ? [typeFilter] : types,
    statuses: statusFilter ? [statusFilter] : undefined,
    priorities: priorityFilter ? [priorityFilter] : undefined,
    ownerIds: ownerFilter ? [ownerFilter === '(none)' ? null : ownerFilter] : undefined,
    archived: showArchived ? true : undefined,
  };

  const { items, loading } = useItems(filter, sort);

  return (
    <div className="view-pad">
      <div className="view-header">
        <h1>{title}</h1>
        <span className="muted">{items.length}</span>
        <div className="spacer" />
        <button className="primary" onClick={() => setShowCreate(true)}><Plus size={14} /> New</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {!types && (
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ItemType | '')} aria-label="Filter by type">
            <option value="">All types</option>
            {ITEM_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        )}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {WORK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as Priority | '')} aria-label="Filter by priority">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} aria-label="Filter by owner">
          <option value="">All owners</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          <option value="(none)">Unassigned</option>
        </select>
        <span style={{ flex: 1 }} />
        <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)' }}>
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Archived
        </label>
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} aria-label="Group by">
          <option value="none">No grouping</option>
          <option value="status">Group: Status</option>
          <option value="type">Group: Type</option>
          <option value="priority">Group: Priority</option>
          <option value="owner">Group: Owner</option>
          <option value="milestone">Group: Milestone</option>
        </select>
        <select
          value={`${sort.field}:${sort.dir}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split(':');
            setSort({ field: field as ItemSort['field'], dir: dir as 'asc' | 'desc' });
          }}
          aria-label="Sort"
        >
          <option value="updatedAt:desc">Recently updated</option>
          <option value="createdAt:desc">Newest</option>
          <option value="priority:asc">Priority</option>
          <option value="dueDate:asc">Due date</option>
          <option value="ident:asc">ID</option>
          <option value="title:asc">Title</option>
        </select>
      </div>

      {loading ? <div className="muted">Loading…</div> : <ItemTable items={items} groupBy={groupBy} />}
      {showCreate && <CreateItemDialog onClose={() => setShowCreate(false)} defaultType={types?.[0]} />}
    </div>
  );
}
