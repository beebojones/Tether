// Leadership reporting: generate a status report from live data, review/edit, export.
import { useMemo, useState } from 'react';
import { FileDown, ClipboardCopy, RefreshCw, MonitorPlay, Sparkles } from 'lucide-react';
import type { WorkItem } from '@shared/types';
import { STATUS_LABEL, TYPE_LABEL } from '@shared/types';
import { api } from '../api';
import { useApp } from '../store';
import { useItems } from '../components/ui';
import { generateSnapshotHtml } from '../reports/snapshot';
import { generateDeckHtml } from '../reports/deck';

type ReportKind = 'leadership' | 'blockers' | 'access' | 'decisions' | 'full';

const REPORT_LABEL: Record<ReportKind, string> = {
  leadership: 'Leadership update',
  blockers: 'Blockers & risks report',
  access: 'Access needs report',
  decisions: 'Decision summary',
  full: 'Full project status',
};

export default function ReportsView() {
  const { milestones, users, navigate, settings } = useApp();
  const { items } = useItems({}, { field: 'updatedAt', dir: 'desc' }, 2000);
  const [kind, setKind] = useState<ReportKind>('leadership');
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState<string | null>(null);

  const projectName = settings?.projectName?.trim() || 'Project';
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';

  const snapshotHtml = () =>
    generateSnapshotHtml({ items, milestones, users, preparedBy: settings?.currentUser?.name ?? 'Tether', projectName });

  const flashSaved = (saved: string | null) => {
    if (!saved) return;
    setSnapshotSaved(saved);
    setTimeout(() => setSnapshotSaved(null), 6000);
  };

  const stamp = () => new Date().toISOString().slice(0, 10);
  const exportSnapshot = async () => flashSaved(await api.export.save(`${slug}-snapshot-${stamp()}.html`, snapshotHtml()));
  const exportPdf = async () => flashSaved(await api.export.pdf(`${slug}-snapshot-${stamp()}.pdf`, snapshotHtml()));
  const exportDeck = async () =>
    flashSaved(
      await api.export.save(
        `${slug}-deck-${stamp()}.html`,
        generateDeckHtml({ items, milestones, users, preparedBy: settings?.currentUser?.name ?? 'Tether', projectName }),
      ),
    );

  const generated = useMemo(
    () => generateReport(kind, items, milestones, users, projectName),
    [kind, items, milestones, users, projectName],
  );
  const content = draft ?? generated;

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="view-pad">
      <div className="view-header">
        <h1>Reports</h1>
        <div className="spacer" />
        <button onClick={() => navigate({ view: 'present' })}><MonitorPlay size={13} /> Presentation mode</button>
        <select value={kind} onChange={(e) => { setKind(e.target.value as ReportKind); setDraft(null); }} aria-label="Report type">
          {(Object.keys(REPORT_LABEL) as ReportKind[]).map((k) => (
            <option key={k} value={k}>{REPORT_LABEL[k]}</option>
          ))}
        </select>
        <button onClick={() => setDraft(null)} title="Regenerate from current data"><RefreshCw size={13} /> Regenerate</button>
        <button onClick={() => void copy()}><ClipboardCopy size={13} /> {copied ? 'Copied!' : 'Copy for Teams/email'}</button>
        <button onClick={() => void api.export.save(`${kind}-report-${new Date().toISOString().slice(0, 10)}.md`, content)}>
          <FileDown size={13} /> Save as file
        </button>
        <button className="primary" onClick={() => void exportSnapshot()} title="Animated standalone HTML status page — opens in any browser">
          <Sparkles size={13} /> Snapshot (HTML)
        </button>
        <button className="primary" onClick={() => void exportDeck()} title="Full-screen slide deck — arrow keys to present, share as a single file">
          <MonitorPlay size={13} /> Deck (HTML)
        </button>
        <button className="primary" onClick={() => void exportPdf()} title="Snapshot rendered straight to PDF">
          <FileDown size={13} /> PDF
        </button>
      </div>

      {snapshotSaved && (
        <div className="toast" style={{ position: 'static', marginBottom: 10 }}>
          Snapshot saved: <span className="mono">{snapshotSaved}</span> — open it in a browser, share it, or print to PDF.
        </div>
      )}

      <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 12 }}>
        Generated from current project data. Edit below before exporting — your edits are kept until you regenerate.
        “Leadership snapshot” exports a polished standalone HTML status page instead.
      </p>

      <textarea
        value={content}
        onChange={(e) => setDraft(e.target.value)}
        style={{ width: '100%', minHeight: '58vh', fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.6 }}
        aria-label="Report content"
      />
    </div>
  );
}

function generateReport(
  kind: ReportKind,
  items: WorkItem[],
  milestones: { id: string; name: string; targetDate: string | null }[],
  users: { id: string; name: string }[],
  projectName: string,
): string {
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const owner = (id: string | null) => users.find((u) => u.id === id)?.name ?? 'Unassigned';
  const line = (i: WorkItem, extra = '') => `- **${i.ident}** ${i.title} — ${STATUS_LABEL[i.status] ?? i.status}, ${owner(i.ownerId)}${extra}`;

  const active = items.filter((i) => i.status === 'in_progress' || i.status === 'in_review');
  const blockers = items.filter((i) => i.type === 'blocker' && i.status === 'active');
  const blockedWork = items.filter((i) => i.status === 'blocked');
  const risks = items.filter((i) => i.type === 'risk' && (i.status === 'open' || i.status === 'mitigating'));
  const accessOpen = items.filter((i) => i.type === 'access' && !['granted', 'denied', 'not_needed', 'expired'].includes(i.status));
  const decisionsOpen = items.filter((i) => i.type === 'decision' && (i.status === 'proposed' || i.status === 'discussing'));
  const decisionsMade = items.filter((i) => i.type === 'decision' && i.status === 'approved');
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const completedWeek = items.filter((i) => i.completedAt && i.completedAt >= weekAgo);
  const upcoming = items.filter((i) => i.dueDate && !i.completedAt).sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1)).slice(0, 10);

  const sections: string[] = [];
  const h = (t: string) => `\n## ${t}\n`;

  if (kind === 'leadership' || kind === 'full') {
    sections.push(`# ${projectName} — ${REPORT_LABEL[kind]}\n*${today}*\n`);
    sections.push(h('Summary'));
    sections.push(
      `- ${active.length} work item${active.length === 1 ? '' : 's'} in progress` +
      `\n- ${completedWeek.length} completed in the last 7 days` +
      `\n- ${blockers.length + blockedWork.length} blocked · ${accessOpen.length} access request${accessOpen.length === 1 ? '' : 's'} pending · ${decisionsOpen.length} decision${decisionsOpen.length === 1 ? '' : 's'} open` +
      `\n- ${risks.length} active risk${risks.length === 1 ? '' : 's'}`,
    );
    if (milestones.length) {
      sections.push(h('Milestones'));
      for (const m of milestones) {
        const inMs = items.filter((i) => i.milestoneId === m.id);
        const done = inMs.filter((i) => i.completedAt).length;
        const pct = inMs.length ? Math.round((done / inMs.length) * 100) : 0;
        sections.push(`- **${m.name}** — ${pct}% (${done}/${inMs.length})${m.targetDate ? `, target ${m.targetDate}` : ''}`);
      }
    }
    if (completedWeek.length) {
      sections.push(h('Completed this week'));
      completedWeek.forEach((i) => sections.push(line(i)));
    }
    if (active.length) {
      sections.push(h('In progress'));
      active.forEach((i) => sections.push(line(i)));
    }
  }

  if (kind === 'leadership' || kind === 'blockers' || kind === 'full') {
    if (blockers.length + blockedWork.length) {
      sections.push(h('Blocked'));
      [...blockers, ...blockedWork].forEach((i) => {
        const waitingOn = i.extra.waitingOn ? `, waiting on ${String(i.extra.waitingOn)}` : '';
        sections.push(line(i, waitingOn));
      });
    }
    if (risks.length && kind !== 'leadership') {
      sections.push(h('Risks'));
      risks.forEach((i) => {
        const lm = i.extra.likelihood && i.extra.impact ? ` (likelihood ${String(i.extra.likelihood)}, impact ${String(i.extra.impact)})` : '';
        sections.push(line(i, lm));
      });
    } else if (risks.length) {
      sections.push(h('Top risks'));
      risks.slice(0, 5).forEach((i) => sections.push(line(i)));
    }
  }

  if (kind === 'leadership' || kind === 'access' || kind === 'full') {
    if (accessOpen.length) {
      sections.push(h('Access needs'));
      accessOpen.forEach((i) => {
        const sys = i.extra.system ? ` — ${String(i.extra.system)}` : '';
        const next = i.extra.nextAction ? `. Next: ${String(i.extra.nextAction)}` : '';
        sections.push(line(i, `${sys}${next}`));
      });
    }
  }

  if (kind === 'decisions' || kind === 'full') {
    sections.push(h('Decisions made'));
    decisionsMade.length
      ? decisionsMade.forEach((i) => sections.push(line(i, i.extra.reasoning ? ` — ${String(i.extra.reasoning)}` : '')))
      : sections.push('- None recorded yet');
  }
  if (kind === 'leadership' || kind === 'decisions' || kind === 'full') {
    if (decisionsOpen.length) {
      sections.push(h('Decisions needed'));
      decisionsOpen.forEach((i) => sections.push(line(i)));
    }
  }

  if (kind === 'leadership' || kind === 'full') {
    if (upcoming.length) {
      sections.push(h('Coming up'));
      upcoming.forEach((i) => sections.push(line(i, ` — due ${i.dueDate}`)));
    }
  }

  if (kind === 'blockers') {
    if (blockers.length + blockedWork.length + risks.length === 0) sections.push('\nNo active blockers or open risks. 🎉');
    sections.unshift(`# ${projectName} — Blockers & risks\n*${today}*\n`);
  }
  if (kind === 'access') {
    if (accessOpen.length === 0) sections.push('\nNo pending access requests.');
    sections.unshift(`# ${projectName} — Access needs\n*${today}*\n`);
  }
  if (kind === 'decisions') {
    sections.unshift(`# ${projectName} — Decision summary\n*${today}*\n`);
  }

  if (kind === 'full') {
    const byType = new Map<string, number>();
    for (const i of items) byType.set(i.type, (byType.get(i.type) ?? 0) + 1);
    sections.push(h('Inventory'));
    for (const [t, n] of byType) sections.push(`- ${TYPE_LABEL[t as WorkItem['type']] ?? t}: ${n}`);
  }

  return sections.join('\n');
}
