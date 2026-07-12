// Sync conflict review: side-by-side versions, keep local/remote or hand-merge.
import { useEffect, useState } from 'react';
import type { SyncConflict, WorkItem } from '@shared/types';
import { api } from '../api';
import { useApp } from '../store';
import { fmtDateTime, Modal } from '../components/ui';

export default function ConflictsView() {
  const { users, openItem } = useApp();
  const dataTick = useApp((s) => s.dataTick);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [itemsById, setItemsById] = useState<Map<string, WorkItem>>(new Map());
  const [merging, setMerging] = useState<SyncConflict | null>(null);
  const [mergeText, setMergeText] = useState('');

  useEffect(() => {
    void (async () => {
      const cs = await api.conflicts.list(true);
      setConflicts(cs);
      const map = new Map<string, WorkItem>();
      for (const c of cs) {
        if (c.entity === 'item' && !map.has(c.entityId)) {
          const it = await api.items.get(c.entityId);
          if (it) map.set(c.entityId, it);
        }
      }
      setItemsById(map);
    })();
  }, [dataTick]);

  const resolve = (c: SyncConflict, resolution: 'local' | 'remote' | 'merged', merged?: string) =>
    void api.conflicts.resolve(c.id, resolution, merged).then(() => setMerging(null));

  return (
    <div className="view-pad">
      <div className="view-header">
        <h1>Sync Conflicts</h1>
        <span className="muted">{conflicts.length} open</span>
      </div>
      {conflicts.length === 0 && (
        <div className="empty-state">
          <div className="big">No conflicts</div>
          When you and your teammate edit the same text at the same time, both versions appear here for review — nothing is silently overwritten.
        </div>
      )}
      {conflicts.map((c) => {
        const item = itemsById.get(c.entityId);
        const who = users.find((u) => u.id === c.remoteActor)?.name ?? c.remoteActor;
        // Which version is on screen right now? LWW may have applied either side —
        // compare against the item's current field value instead of assuming.
        const currentValue = item ? (c.field === 'title' ? item.title : item.body) : null;
        const remoteShown = currentValue !== null && currentValue === c.remoteValue;
        const shownBadge = (
          <span className="badge" style={{ color: 'var(--success)', background: 'var(--success-soft)', marginLeft: 8 }}>
            currently shown
          </span>
        );
        return (
          <section key={c.id} className="dash-card" style={{ marginBottom: 14 }}>
            <div className="dash-card-head" style={{ textTransform: 'none', letterSpacing: 0 }}>
              Concurrent edit on <strong>{c.field}</strong> of{' '}
              {item ? (
                <button className="ghost" style={{ padding: '0 4px' }} onClick={() => openItem(item.id)}>
                  {item.ident} — {item.title}
                </button>
              ) : (
                c.entityId
              )}
              <span style={{ flex: 1 }} />
              <span className="muted" style={{ fontWeight: 400, fontSize: 'var(--fs-xs)' }}>
                {who}'s edit arrived {fmtDateTime(c.detectedAt)}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 14px 12px' }}>
              <div>
                <div className="rail-label">Your version{!remoteShown && shownBadge}</div>
                <div className="version-pane">{renderVal(c.field, c.localValue)}</div>
              </div>
              <div>
                <div className="rail-label">{who}'s version{remoteShown && shownBadge}</div>
                <div className="version-pane">{renderVal(c.field, c.remoteValue)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px', justifyContent: 'flex-end' }}>
              <button onClick={() => resolve(c, 'local')}>Keep your version</button>
              <button onClick={() => resolve(c, 'remote')}>Keep {who}'s version</button>
              <button className="primary" onClick={() => { setMerging(c); setMergeText(renderVal(c.field, c.localValue) + '\n\n---\n\n' + renderVal(c.field, c.remoteValue)); }}>
                Merge by hand…
              </button>
            </div>
          </section>
        );
      })}

      {merging && (
        <Modal title="Merge versions" onClose={() => setMerging(null)} width={720}
          footer={
            <>
              <button className="ghost" onClick={() => setMerging(null)}>Cancel</button>
              <button className="primary" onClick={() => resolve(merging, 'merged', mergeField(merging.field, mergeText))}>Save merged version</button>
            </>
          }>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }}>
            Edit the combined text below. Both versions are included, separated by ---.
          </p>
          <textarea rows={14} style={{ width: '100%' }} value={mergeText} onChange={(e) => setMergeText(e.target.value)} />
        </Modal>
      )}
    </div>
  );
}

/** Body values are rich-doc JSON; show plain text. Title values are plain already. */
function renderVal(field: string, value: string): string {
  if (field !== 'body') return value;
  try {
    const doc = JSON.parse(value) as { content?: unknown[] };
    const walk = (nodes: unknown[]): string =>
      nodes.map((n) => {
        const node = n as { text?: string; content?: unknown[]; type?: string };
        if (node.text) return node.text;
        const inner = node.content ? walk(node.content) : '';
        return node.type === 'paragraph' ? inner + '\n\n' : inner;
      }).join('');
    return walk(doc.content ?? []).trim();
  } catch {
    return value;
  }
}

/** Merged body text goes back as a simple rich doc. */
function mergeField(field: string, text: string): string {
  if (field !== 'body') return text;
  return JSON.stringify({
    type: 'doc',
    content: text.split(/\n{2,}/).map((p) => ({ type: 'paragraph', content: p ? [{ type: 'text', text: p }] : [] })),
  });
}
