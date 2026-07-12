// Access tracker: pipeline overview + full register grouped by status.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ACCESS_STATUSES, STATUS_LABEL } from '@shared/types';
import { useItems } from '../components/ui';
import ItemTable from '../components/ItemTable';
import CreateItemDialog from '../components/CreateItemDialog';

// Statuses that mean "someone must act" — surfaced first.
const ATTENTION = new Set(['identified', 'not_requested', 'preparing', 'info_needed', 'expired']);
const WAITING = new Set(['requested', 'under_review']);

export default function AccessView() {
  const { items } = useItems({ types: ['access'] }, { field: 'updatedAt', dir: 'desc' }, 1000);
  const [showCreate, setShowCreate] = useState(false);

  const counts = new Map<string, number>();
  for (const it of items) counts.set(it.status, (counts.get(it.status) ?? 0) + 1);

  const needsAction = items.filter((i) => ATTENTION.has(i.status));
  const waiting = items.filter((i) => WAITING.has(i.status));

  return (
    <div className="view-pad">
      <div className="view-header">
        <h1>Access Tracker</h1>
        <div className="spacer" />
        <button className="primary" onClick={() => setShowCreate(true)}><Plus size={14} /> New access request</button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        {ACCESS_STATUSES.filter((s) => (counts.get(s) ?? 0) > 0).map((s) => (
          <div key={s} className="badge" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '6px 12px' }}>
            {STATUS_LABEL[s]}: <strong style={{ color: 'var(--text-primary)' }}>{counts.get(s)}</strong>
          </div>
        ))}
      </div>

      {needsAction.length > 0 && (
        <>
          <h3 style={{ fontSize: 'var(--fs-md)', color: 'var(--warning)', margin: '4px 0 8px' }}>Needs action ({needsAction.length})</h3>
          <ItemTable items={needsAction} />
          <div style={{ height: 20 }} />
        </>
      )}
      {waiting.length > 0 && (
        <>
          <h3 style={{ fontSize: 'var(--fs-md)', color: 'var(--text-secondary)', margin: '4px 0 8px' }}>Waiting on others ({waiting.length})</h3>
          <ItemTable items={waiting} />
          <div style={{ height: 20 }} />
        </>
      )}
      <h3 style={{ fontSize: 'var(--fs-md)', color: 'var(--text-secondary)', margin: '4px 0 8px' }}>All access records</h3>
      <ItemTable items={items} groupBy="status" emptyText="Track every system, API, and environment access the project needs." />

      {showCreate && <CreateItemDialog defaultType="access" onClose={() => setShowCreate(false)} />}
    </div>
  );
}
