import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useItems } from '../components/ui';
import ItemTable from '../components/ItemTable';
import CreateItemDialog from '../components/CreateItemDialog';

export default function MeetingsView() {
  const { items } = useItems({ types: ['meeting'] }, { field: 'createdAt', dir: 'desc' }, 1000);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="view-pad">
      <div className="view-header">
        <h1>Meetings</h1>
        <span className="muted">{items.length}</span>
        <div className="spacer" />
        <button className="primary" onClick={() => setShowCreate(true)}><Plus size={14} /> New meeting note</button>
      </div>
      <ItemTable items={items} emptyText="Capture meeting notes, then convert lines into tasks, decisions, and access requests." />
      {showCreate && <CreateItemDialog defaultType="meeting" onClose={() => setShowCreate(false)} />}
    </div>
  );
}
