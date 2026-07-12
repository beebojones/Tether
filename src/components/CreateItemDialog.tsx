import { useState } from 'react';
import { Modal, TypeIcon } from './ui';
import { api } from '../api';
import { useApp } from '../store';
import { ITEM_TYPES, TYPE_LABEL, PRIORITIES, statusesForType, STATUS_LABEL, type ItemType, type Priority } from '@shared/types';

export default function CreateItemDialog({ onClose, defaultType }: { onClose: () => void; defaultType?: ItemType }) {
  const { users, milestones, openItem, settings } = useApp();
  const [type, setType] = useState<ItemType>(defaultType ?? 'task');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<string>('');
  const [ownerId, setOwnerId] = useState<string>(settings?.currentUser?.id ?? '');
  const [milestoneId, setMilestoneId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statuses = statusesForType(type);

  const submit = async (openAfter: boolean) => {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const item = await api.items.create({
        type,
        title: title.trim(),
        priority,
        status: status || undefined,
        ownerId: ownerId || null,
        milestoneId: milestoneId || null,
        dueDate: dueDate || null,
      });
      if (openAfter) {
        openItem(item.id);
        onClose();
      } else {
        setTitle('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={<><TypeIcon type={type} /> New {TYPE_LABEL[type]}</>}
      onClose={onClose}
      footer={
        <>
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button onClick={() => void submit(false)} disabled={!title.trim() || busy}>Create &amp; add another</button>
          <button className="primary" onClick={() => void submit(true)} disabled={!title.trim() || busy}>Create</button>
        </>
      }
    >
      <div className="form-row">
        <label htmlFor="ci-type">Type</label>
        <select id="ci-type" value={type} onChange={(e) => { setType(e.target.value as ItemType); setStatus(''); }}>
          {ITEM_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABEL[t]}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="ci-title">Title</label>
        <input
          id="ci-title"
          type="text"
          autoFocus
          placeholder={`What is this ${TYPE_LABEL[type].toLowerCase()} about?`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void submit(true)}
        />
      </div>
      <div className="form-grid">
        <div className="form-row">
          <label htmlFor="ci-status">Status</label>
          <select id="ci-status" value={status || statuses[0]} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="ci-priority">Priority</label>
          <select id="ci-priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="ci-owner">Owner</label>
          <select id="ci-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="ci-milestone">Milestone</label>
          <select id="ci-milestone" value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
            <option value="">None</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="ci-due">Due date</label>
          <input id="ci-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      {error && <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)' }}>{error}</div>}
    </Modal>
  );
}
