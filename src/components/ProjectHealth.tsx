// Transparent project health: computed from named signals, basis always shown.
import { useState } from 'react';
import { Modal } from './ui';

interface Signals {
  blocked: number;
  overdue: number;
  accessWaiting: number;
  openDecisions: number;
  openHighRisks: number;
}

export default function ProjectHealth(signals: Signals) {
  const [show, setShow] = useState(false);

  const reasons: { text: string; weight: number }[] = [];
  if (signals.blocked > 0) reasons.push({ text: `${signals.blocked} blocked item${signals.blocked > 1 ? 's' : ''}`, weight: 2 });
  if (signals.overdue > 0) reasons.push({ text: `${signals.overdue} overdue item${signals.overdue > 1 ? 's' : ''}`, weight: 2 });
  if (signals.openHighRisks > 0) reasons.push({ text: `${signals.openHighRisks} unresolved high risk${signals.openHighRisks > 1 ? 's' : ''}`, weight: 2 });
  if (signals.accessWaiting > 2) reasons.push({ text: `${signals.accessWaiting} access requests unresolved`, weight: 1 });
  if (signals.openDecisions > 3) reasons.push({ text: `${signals.openDecisions} decisions open`, weight: 1 });

  const score = reasons.reduce((s, r) => s + r.weight, 0);
  const level = score === 0 ? 'good' : score <= 3 ? 'watch' : 'at-risk';
  const label = level === 'good' ? 'On track' : level === 'watch' ? 'Needs attention' : 'At risk';
  const color = level === 'good' ? 'var(--success)' : level === 'watch' ? 'var(--warning)' : 'var(--danger)';

  return (
    <>
      <button className="sync-pill" onClick={() => setShow(true)} title="Project health — click for the basis">
        <span className="dot" style={{ background: color }} />
        {label}
      </button>
      {show && (
        <Modal title="Project health" onClose={() => setShow(false)}>
          <p style={{ fontSize: 'var(--fs-md)', marginBottom: 10 }}>
            Status: <strong style={{ color }}>{label}</strong>
          </p>
          {reasons.length === 0 ? (
            <p style={{ fontSize: 'var(--fs-sm)' }} className="muted">
              No blocked work, no overdue items, no unresolved high risks, access requests and decisions under control.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }} className="muted">This status is based on:</p>
              <ul style={{ paddingLeft: 20, fontSize: 'var(--fs-sm)', lineHeight: 1.8 }}>
                {reasons.map((r) => <li key={r.text}>{r.text}</li>)}
              </ul>
            </>
          )}
          <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 12 }}>
            Health is recomputed from live data on every dashboard load — it is never a manually painted traffic light.
          </p>
        </Modal>
      )}
    </>
  );
}
