// Type-specific structured fields rendered from a per-type schema.
// Edits merge into item.extra and save on blur.
import { useState } from 'react';
import type { WorkItem, ItemType } from '@shared/types';

interface FieldDef {
  key: string;
  label: string;
  kind: 'text' | 'multiline' | 'date' | 'select' | 'list';
  options?: string[];
  placeholder?: string;
}

const SCHEMAS: Partial<Record<ItemType, { title: string; fields: FieldDef[] }>> = {
  access: {
    title: 'Access details',
    fields: [
      { key: 'system', label: 'System / resource', kind: 'text', placeholder: 'e.g. Salesforce Service Cloud' },
      { key: 'accessType', label: 'Type of access', kind: 'text', placeholder: 'e.g. API read, site owner' },
      { key: 'businessReason', label: 'Business reason', kind: 'multiline' },
      { key: 'requestedFrom', label: 'Requested from', kind: 'text' },
      { key: 'requestDate', label: 'Request date', kind: 'date' },
      { key: 'approvedBy', label: 'Approved by', kind: 'text' },
      { key: 'dateGranted', label: 'Date granted', kind: 'date' },
      { key: 'expirationDate', label: 'Expiration date', kind: 'date' },
      { key: 'renewalDate', label: 'Renewal date', kind: 'date' },
      { key: 'securityNotes', label: 'Security notes', kind: 'multiline' },
      { key: 'nextAction', label: 'Next action', kind: 'text' },
      { key: 'followUpDate', label: 'Follow-up date', kind: 'date' },
    ],
  },
  decision: {
    title: 'Decision record',
    fields: [
      { key: 'context', label: 'Context', kind: 'multiline' },
      { key: 'problem', label: 'Problem', kind: 'multiline' },
      { key: 'reasoning', label: 'Reasoning', kind: 'multiline' },
      { key: 'tradeoffs', label: 'Trade-offs', kind: 'multiline' },
      { key: 'consequences', label: 'Consequences', kind: 'multiline' },
      { key: 'reviewDate', label: 'Review date', kind: 'date' },
    ],
  },
  meeting: {
    title: 'Meeting details',
    fields: [
      { key: 'date', label: 'Date', kind: 'date' },
      { key: 'time', label: 'Time', kind: 'text', placeholder: 'e.g. 10:00 AM' },
      { key: 'attendees', label: 'Attendees', kind: 'list', placeholder: 'Comma-separated names' },
      { key: 'purpose', label: 'Purpose', kind: 'multiline' },
      { key: 'agenda', label: 'Agenda', kind: 'multiline' },
      { key: 'followUpDate', label: 'Follow-up date', kind: 'date' },
    ],
  },
  risk: {
    title: 'Risk assessment',
    fields: [
      { key: 'likelihood', label: 'Likelihood', kind: 'select', options: ['low', 'medium', 'high'] },
      { key: 'impact', label: 'Impact', kind: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'mitigation', label: 'Mitigation plan', kind: 'multiline' },
      { key: 'trigger', label: 'Trigger / early warning', kind: 'text' },
    ],
  },
  blocker: {
    title: 'Blocker details',
    fields: [
      { key: 'waitingOn', label: 'Waiting on', kind: 'text', placeholder: 'Person, team, or system' },
      { key: 'since', label: 'Blocked since', kind: 'date' },
      { key: 'escalatedTo', label: 'Escalated to', kind: 'text' },
    ],
  },
  requirement: {
    title: 'Requirement details',
    fields: [
      { key: 'acceptanceCriteria', label: 'Acceptance criteria', kind: 'multiline' },
      { key: 'testingNotes', label: 'Testing notes', kind: 'multiline' },
      { key: 'securityConsiderations', label: 'Security considerations', kind: 'multiline' },
    ],
  },
};

export default function ExtraFields({ item, onSave }: { item: WorkItem; onSave: (extra: Record<string, unknown>) => void }) {
  const schema = SCHEMAS[item.type];
  if (!schema) return null;
  return (
    <section className="detail-section">
      <div className="detail-section-head">{schema.title}</div>
      <div className="form-grid">
        {schema.fields.map((f) => (
          <Field key={f.key} def={f} item={item} onSave={onSave} />
        ))}
      </div>
    </section>
  );
}

function Field({ def, item, onSave }: { def: FieldDef; item: WorkItem; onSave: (extra: Record<string, unknown>) => void }) {
  const raw = item.extra[def.key];
  const initial = def.kind === 'list' ? (Array.isArray(raw) ? (raw as string[]).join(', ') : '') : raw == null ? '' : String(raw);
  const [v, setV] = useState(initial);

  const commit = () => {
    if (v === initial) return;
    const value = def.kind === 'list' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v || undefined;
    onSave({ ...item.extra, [def.key]: value });
  };

  const id = `xf-${def.key}`;
  const full = def.kind === 'multiline';
  return (
    <div className="form-row" style={full ? { gridColumn: '1 / -1' } : undefined}>
      <label htmlFor={id}>{def.label}</label>
      {def.kind === 'multiline' ? (
        <textarea id={id} value={v} rows={2} placeholder={def.placeholder} onChange={(e) => setV(e.target.value)} onBlur={commit} />
      ) : def.kind === 'select' ? (
        <select id={id} value={v} onChange={(e) => { setV(e.target.value); }} onBlur={commit}>
          <option value="">—</option>
          {def.options?.map((o) => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}
        </select>
      ) : (
        <input id={id} type={def.kind === 'date' ? 'date' : 'text'} value={v} placeholder={def.placeholder}
          onChange={(e) => setV(e.target.value)} onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
      )}
    </div>
  );
}
