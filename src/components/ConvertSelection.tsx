// Convert selected editor text into a new work item (task/decision/risk/blocker/
// requirement/access/question), linked back to the source. The core meeting-notes flow.
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { ItemType, WorkItem, LinkKind } from '@shared/types';
import { TYPE_LABEL } from '@shared/types';
import { api } from '../api';
import { TypeIcon } from './ui';

const CONVERT_TYPES: ItemType[] = ['task', 'decision', 'blocker', 'risk', 'requirement', 'access', 'question', 'idea'];

/** Link kind connecting the new item back to its source. */
function backLink(source: WorkItem): LinkKind {
  return source.type === 'meeting' ? 'discussed_in' : 'relates';
}

export default function ConvertSelection({ sourceItem, text, onConverted }: {
  sourceItem: WorkItem;
  text: string;
  onConverted: (created: WorkItem) => void;
}) {
  const [busy, setBusy] = useState<ItemType | null>(null);

  const convert = async (type: ItemType) => {
    if (busy) return;
    setBusy(type);
    try {
      const title = text.trim().split('\n')[0].slice(0, 140);
      const bodyText = text.trim();
      const created = await api.items.create({
        type,
        title,
        bodyText,
        body: JSON.stringify({
          type: 'doc',
          content: bodyText.split(/\n+/).map((p) => ({ type: 'paragraph', content: p ? [{ type: 'text', text: p }] : [] })),
        }),
      });
      await api.links.add(created.id, sourceItem.id, backLink(sourceItem));
      onConverted(created);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="convert-bar">
      <Sparkles size={13} style={{ color: 'var(--accent-strong)' }} />
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>Convert selection to:</span>
      {CONVERT_TYPES.map((t) => (
        <button key={t} className="ghost" disabled={busy !== null}
          onClick={() => void convert(t)} style={{ fontSize: 'var(--fs-xs)', padding: '3px 8px' }}>
          <TypeIcon type={t} size={12} /> {busy === t ? 'Creating…' : TYPE_LABEL[t]}
        </button>
      ))}
    </div>
  );
}
