import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useItems } from '../components/ui';
import ItemTable from '../components/ItemTable';
import CreateItemDialog from '../components/CreateItemDialog';

export default function DecisionsView() {
  const { items } = useItems({ types: ['decision'] }, { field: 'updatedAt', dir: 'desc' }, 1000);
  const [showCreate, setShowCreate] = useState(false);
  const open = items.filter((i) => i.status === 'proposed' || i.status === 'discussing');

  return (
    <div className="view-pad">
      <div className="view-header">
        <h1>Decisions</h1>
        <span className="muted">{open.length} open · {items.length} total</span>
        <div className="spacer" />
        <button className="primary" onClick={() => setShowCreate(true)}><Plus size={14} /> New decision</button>
      </div>
      <ItemTable items={items} groupBy="status" emptyText="Record product, architecture, and security decisions so the reasoning survives." />
      {showCreate && <CreateItemDialog defaultType="decision" onClose={() => setShowCreate(false)} />}
    </div>
  );
}
