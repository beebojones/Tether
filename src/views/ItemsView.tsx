// Generic filterable work-item list. Powers "All Work" and any type-scoped list.
// Supports saved views: the current filter/group/sort combo can be named and recalled.
import { useEffect, useState } from 'react';
import { Plus, Bookmark, X } from 'lucide-react';
import type { ItemType, ItemFilter, ItemSort, Priority, SavedView } from '@shared/types';
import { ITEM_TYPES, TYPE_LABEL, STATUS_LABEL, PRIORITIES, statusesForType, WORK_STATUSES } from '@shared/types';
import { useItems } from '../components/ui';
import ItemTable, { type GroupBy } from '../components/ItemTable';
import CreateItemDialog from '../components/CreateItemDialog';
import { api } from '../api';
import { useApp } from '../store';

interface ViewConfig {
  typeFilter: ItemType | '';
  statusFilter: string;
  priorityFilter: Priority | '';
  ownerFilter: string;
  groupBy: GroupBy;
  sort: ItemSort;
  archivedOnly: boolean;
}

const DEFAULT_CONFIG: ViewConfig = {
  typeFilter: '',
  statusFilter: '',
  priorityFilter: '',
  ownerFilter: '',
  groupBy: 'status',
  sort: { field: 'updatedAt', dir: 'desc' },
  archivedOnly: false,
};

export default function ItemsView({ types, title }: { types?: ItemType[]; title: string }) {
  const users = useApp((s) => s.users);
  const [cfg, setCfg] = useState<ViewConfig>(DEFAULT_CONFIG);
  const [showCreate, setShowCreate] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState('');
  const [savingName, setSavingName] = useState<string | null>(null);

  const set = <K extends keyof ViewConfig>(k: K, v: ViewConfig[K]) => {
    setCfg((c) => ({ ...c, [k]: v }));
    setActiveViewId('');
  };

  useEffect(() => {
    void api.views.list().then(setSavedViews);
  }, []);

  // Status options follow the selected type (decisions/access/etc. have their own
  // pipelines); with no type selected, offer the union of all statuses.
  const statusOptions: readonly string[] = cfg.typeFilter
    ? statusesForType(cfg.typeFilter)
    : types?.length === 1
      ? statusesForType(types[0])
      : [...new Set([...WORK_STATUSES, ...ITEM_TYPES.flatMap((t) => statusesForType(t))])];

  const filter: ItemFilter = {
    types: cfg.typeFilter ? [cfg.typeFilter] : types,
    statuses: cfg.statusFilter ? [cfg.statusFilter] : undefined,
    priorities: cfg.priorityFilter ? [cfg.priorityFilter] : undefined,
    ownerIds: cfg.ownerFilter ? [cfg.ownerFilter === '(none)' ? null : cfg.ownerFilter] : undefined,
    archived: cfg.archivedOnly ? true : undefined,
  };

  const { items, loading } = useItems(filter, cfg.sort);

  const applySavedView = (id: string) => {
    setActiveViewId(id);
    const v = savedViews.find((x) => x.id === id);
    if (v) setCfg({ ...DEFAULT_CONFIG, ...(v.config as unknown as ViewConfig) });
  };

  const saveCurrentView = async () => {
    const name = savingName?.trim();
    if (!name) return;
    const v = await api.views.save({ name, config: cfg as unknown as Record<string, unknown> });
    setSavedViews(await api.views.list());
    setActiveViewId(v.id);
    setSavingName(null);
  };

  const deleteActiveView = async () => {
    if (!activeViewId) return;
    await api.views.delete(activeViewId);
    setSavedViews(await api.views.list());
    setActiveViewId('');
  };

  return (
    <div className="view-pad">
      <div className="view-header">
        <h1>{title}</h1>
        <span className="muted">{items.length}</span>
        <div className="spacer" />
        {savedViews.length > 0 && (
          <select value={activeViewId} onChange={(e) => applySavedView(e.target.value)} aria-label="Saved views">
            <option value="">Saved views…</option>
            {savedViews.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        )}
        {activeViewId && (
          <button className="ghost" title="Delete this saved view" onClick={() => void deleteActiveView()} aria-label="Delete saved view">
            <X size={13} />
          </button>
        )}
        <button onClick={() => setSavingName('')} title="Save current filters as a view">
          <Bookmark size={13} /> Save view
        </button>
        <button className="primary" onClick={() => setShowCreate(true)}><Plus size={14} /> New</button>
      </div>

      {savingName !== null && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <input
            type="text"
            autoFocus
            placeholder="View name, e.g. “My urgent work”"
            value={savingName}
            onChange={(e) => setSavingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void saveCurrentView();
              if (e.key === 'Escape') setSavingName(null);
            }}
            aria-label="Saved view name"
          />
          <button className="primary" onClick={() => void saveCurrentView()} disabled={!savingName.trim()}>Save</button>
          <button className="ghost" onClick={() => setSavingName(null)}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {!types && (
          <select value={cfg.typeFilter} onChange={(e) => { set('typeFilter', e.target.value as ItemType | ''); set('statusFilter', ''); }} aria-label="Filter by type">
            <option value="">All types</option>
            {ITEM_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        )}
        <select value={cfg.statusFilter} onChange={(e) => set('statusFilter', e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
        </select>
        <select value={cfg.priorityFilter} onChange={(e) => set('priorityFilter', e.target.value as Priority | '')} aria-label="Filter by priority">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select value={cfg.ownerFilter} onChange={(e) => set('ownerFilter', e.target.value)} aria-label="Filter by owner">
          <option value="">All owners</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          <option value="(none)">Unassigned</option>
        </select>
        <span style={{ flex: 1 }} />
        <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)' }}>
          <input type="checkbox" checked={cfg.archivedOnly} onChange={(e) => set('archivedOnly', e.target.checked)} />
          Archived only
        </label>
        <select value={cfg.groupBy} onChange={(e) => set('groupBy', e.target.value as GroupBy)} aria-label="Group by">
          <option value="none">No grouping</option>
          <option value="status">Group: Status</option>
          <option value="type">Group: Type</option>
          <option value="priority">Group: Priority</option>
          <option value="owner">Group: Owner</option>
          <option value="milestone">Group: Milestone</option>
        </select>
        <select
          value={`${cfg.sort.field}:${cfg.sort.dir}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split(':');
            set('sort', { field: field as ItemSort['field'], dir: dir as 'asc' | 'desc' });
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

      {loading ? <div className="muted">Loading…</div> : <ItemTable items={items} groupBy={cfg.groupBy} />}
      {showCreate && <CreateItemDialog onClose={() => setShowCreate(false)} defaultType={types?.[0]} />}
    </div>
  );
}
