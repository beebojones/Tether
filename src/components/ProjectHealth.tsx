// Transparent project health: computed from named signals, basis always shown.
import { useState } from 'react';
import { Modal } from './ui';
import { useApp, type Route } from '../store';

interface Signals {
  blocked: number;
  overdue: number;
  accessWaiting: number;
  openDecisions: number;
  openHighRisks: number;
}

export default function ProjectHealth(signals: Signals) {
  const [show, setShow] = useState(false);
  const navigate = useApp((s) => s.navigate);

  const reasons: { text: string; weight: number; route: Route }[] = [];
  if (signals.blocked > 0) reasons.push({ text: `${signals.blocked} blocked item${signals.blocked > 1 ? 's' : ''}`, weight: 2, route: { view: 'risks' } });
  if (signals.overdue > 0) reasons.push({ text: `${signals.overdue} overdue item${signals.overdue > 1 ? 's' : ''}`, weight: 2, route: { view: 'items', title: 'All Work' } });
  if (signals.openHighRisks > 0) reasons.push({ text: `${signals.openHighRisks} unresolved high risk${signals.openHighRisks > 1 ? 's' : ''}`, weight: 2, route: { view: 'risks' } });
  if (signals.accessWaiting > 2) reasons.push({ text: `${signals.accessWaiting} access requests unresolved`, weight: 1, route: { view: 'access' } });
  if (signals.openDecisions > 3) reasons.push({ text: `${signals.openDecisions} decisions open`, weight: 1, route: { view: 'decisions' } });

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
              <p style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }} className="muted">This status is based on (click to go there):</p>
              <ul className="health-reasons">
                {reasons.map((r) => (
                  <li key={r.text}>
                    <button type="button" onClick={() => { navigate(r.route); setShow(false); }}>
                      {r.text}
                    </button>
                  </li>
                ))}
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
