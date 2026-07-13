import { useEffect, useState } from 'react';
import { GitCompare } from 'lucide-react';
import type { ActivityEntry } from '@shared/types';
import { api } from '../api';
import { useApp } from '../store';
import { fmtDateTime } from '../components/ui';
import { describeActivity, activityHasDiff, ChangeDiff } from './ItemDetail';

export default function ActivityView() {
  const { users, openItem } = useApp();
  const dataTick = useApp((s) => s.dataTick);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [diffEntry, setDiffEntry] = useState<ActivityEntry | null>(null);

  useEffect(() => {
    void api.activity.for(null, 300).then(setEntries);
  }, [dataTick]);

  return (
    <div className="view-pad">
      <div className="view-header">
        <h1>Activity</h1>
        <span className="muted">Every change, newest first — nothing is ever hard-deleted</span>
      </div>
      {entries.length === 0 && <div className="empty-state"><div className="big">No activity yet</div></div>}
      <div className="item-table" style={{ padding: '4px 0' }}>
        {entries.map((a) => {
          const diff = activityHasDiff(a);
          return (
            <div key={a.id} className="activity-row" style={{ padding: '6px 14px', cursor: diff || a.itemId ? 'pointer' : 'default', gap: 10 }}
              onClick={() => (diff ? setDiffEntry(a) : a.itemId && openItem(a.itemId))}
              role={diff || a.itemId ? 'button' : undefined}
              tabIndex={diff || a.itemId ? 0 : undefined}
              onKeyDown={(e) => e.key === 'Enter' && (diff ? setDiffEntry(a) : a.itemId && openItem(a.itemId))}>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)', minWidth: 120 }}>{fmtDateTime(a.at)}</span>
              <span style={{ fontSize: 'var(--fs-sm)', flex: 1 }}>{describeActivity(a, users)}</span>
              {diff && <span className="diff-tag"><GitCompare size={11} style={{ marginRight: 4, verticalAlign: '-1px' }} />before / after</span>}
            </div>
          );
        })}
      </div>
      {diffEntry && <ChangeDiff entry={diffEntry} onClose={() => setDiffEntry(null)} />}
    </div>
  );
}
