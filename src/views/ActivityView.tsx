import { useEffect, useState } from 'react';
import type { ActivityEntry } from '@shared/types';
import { api } from '../api';
import { useApp } from '../store';
import { fmtDateTime } from '../components/ui';
import { describeActivity } from './ItemDetail';

export default function ActivityView() {
  const { users, openItem } = useApp();
  const dataTick = useApp((s) => s.dataTick);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    void api.activity.for(null, 300).then(setEntries);
  }, [dataTick]);

  return (
    <div className="view-pad">
      <div className="view-header"><h1>Activity</h1><span className="muted">Everything that changed, newest first</span></div>
      {entries.length === 0 && <div className="empty-state"><div className="big">No activity yet</div></div>}
      <div className="item-table" style={{ padding: '4px 0' }}>
        {entries.map((a) => (
          <div key={a.id} className="activity-row" style={{ padding: '6px 14px', cursor: a.itemId ? 'pointer' : 'default' }}
            onClick={() => a.itemId && openItem(a.itemId)}>
            <span className="muted" style={{ fontSize: 'var(--fs-xs)', minWidth: 120 }}>{fmtDateTime(a.at)}</span>
            <span style={{ fontSize: 'var(--fs-sm)' }}>{describeActivity(a, users)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
