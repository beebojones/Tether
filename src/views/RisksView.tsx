import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useItems } from '../components/ui';
import ItemTable from '../components/ItemTable';
import CreateItemDialog from '../components/CreateItemDialog';
import type { ItemType } from '@shared/types';

export default function RisksView() {
  const { items: risks } = useItems({ types: ['risk'] }, { field: 'priority', dir: 'asc' }, 500);
  const { items: blockers } = useItems({ types: ['blocker'] }, { field: 'priority', dir: 'asc' }, 500);
  const [createType, setCreateType] = useState<ItemType | null>(null);

  const activeBlockers = blockers.filter((b) => b.status === 'active');

  return (
    <div className="view-pad">
      <div className="view-header">
        <h1>Risks &amp; Blockers</h1>
        <div className="spacer" />
        <button onClick={() => setCreateType('risk')}><Plus size={14} /> New risk</button>
        <button className="primary" onClick={() => setCreateType('blocker')}><Plus size={14} /> New blocker</button>
      </div>

      <h3 style={{ fontSize: 'var(--fs-md)', color: activeBlockers.length ? 'var(--danger)' : 'var(--text-secondary)', margin: '4px 0 8px' }}>
        Blockers {activeBlockers.length > 0 && `— ${activeBlockers.length} active`}
      </h3>
      <ItemTable items={blockers} groupBy="status" emptyText="Nothing is blocking the project right now." />
      <div style={{ height: 24 }} />
      <h3 style={{ fontSize: 'var(--fs-md)', color: 'var(--text-secondary)', margin: '4px 0 8px' }}>Risks</h3>
      <ItemTable items={risks} groupBy="status" emptyText="Track what could go wrong before it does." />

      {createType && <CreateItemDialog defaultType={createType} onClose={() => setCreateType(null)} />}
    </div>
  );
}
