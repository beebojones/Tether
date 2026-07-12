// Leadership Snapshot: a polished, self-contained HTML document generated from live
// project data. Opens in any browser, prints cleanly to PDF, attaches to email —
// no Tether install needed to read it. No external assets (enterprise-safe).
import type { WorkItem, Milestone, User } from '@shared/types';
import { STATUS_LABEL } from '@shared/types';

export interface SnapshotData {
  items: WorkItem[];
  milestones: Milestone[];
  users: User[];
  preparedBy: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function generateSnapshotHtml({ items, milestones, users, preparedBy }: SnapshotData): string {
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const owner = (id: string | null) => users.find((u) => u.id === id)?.name ?? 'Unassigned';
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

  const active = items.filter((i) => i.status === 'in_progress' || i.status === 'in_review');
  const completedWeek = items.filter((i) => i.completedAt && i.completedAt >= weekAgo);
  const blockers = items.filter((i) => (i.type === 'blocker' && i.status === 'active') || i.status === 'blocked');
  const accessOpen = items.filter((i) => i.type === 'access' && !['granted', 'denied', 'not_needed', 'expired'].includes(i.status));
  const risks = items.filter((i) => i.type === 'risk' && (i.status === 'open' || i.status === 'mitigating'));
  const decisionsOpen = items.filter((i) => i.type === 'decision' && (i.status === 'proposed' || i.status === 'discussing'));
  const upcoming = items.filter((i) => i.dueDate && !i.completedAt).sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1)).slice(0, 8);

  const health =
    blockers.length + risks.filter((r) => r.priority === 'urgent' || r.priority === 'high').length > 2
      ? { label: 'At risk', color: '#c2384f' }
      : blockers.length + accessOpen.length > 0
        ? { label: 'Needs attention', color: '#a86a00' }
        : { label: 'On track', color: '#1d7a4d' };

  const stat = (n: number, label: string, tone = '#20242c') =>
    `<div class="stat"><div class="stat-n" style="color:${tone}">${n}</div><div class="stat-l">${esc(label)}</div></div>`;

  const row = (i: WorkItem, extra = '') => `
    <tr>
      <td class="ident">${esc(i.ident)}</td>
      <td>${esc(i.title)}${extra}</td>
      <td class="dim">${esc(STATUS_LABEL[i.status] ?? i.status)}</td>
      <td class="dim">${esc(owner(i.ownerId))}</td>
    </tr>`;

  const section = (title: string, rows: WorkItem[], emptyText: string, extraFor?: (i: WorkItem) => string) => `
    <section>
      <h2>${esc(title)}</h2>
      ${rows.length === 0
        ? `<p class="empty">${esc(emptyText)}</p>`
        : `<table><tbody>${rows.map((i) => row(i, extraFor ? extraFor(i) : '')).join('')}</tbody></table>`}
    </section>`;

  const milestoneBars = milestones
    .map((m) => {
      const inMs = items.filter((i) => i.milestoneId === m.id);
      const done = inMs.filter((i) => i.completedAt).length;
      const pct = inMs.length ? Math.round((done / inMs.length) * 100) : 0;
      return `
      <div class="ms">
        <div class="ms-head"><span>${esc(m.name)}</span><span class="dim">${m.targetDate ? `target ${esc(m.targetDate)} · ` : ''}${pct}% (${done}/${inMs.length})</span></div>
        <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
      </div>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Support AI — Status Snapshot — ${esc(today)}</title>
<style>
  :root { color-scheme: light; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #20242c; background: #f6f7f9;
    line-height: 1.5; font-size: 15px;
  }
  .page { max-width: 860px; margin: 0 auto; padding: 48px 40px 64px; background: #fff; min-height: 100vh; }
  header { border-bottom: 3px solid #2d5bd7; padding-bottom: 22px; margin-bottom: 28px; }
  .kicker { font-size: 12px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #2d5bd7; }
  h1 { font-size: 32px; letter-spacing: -0.5px; margin: 6px 0 4px; }
  .meta { color: #6a7386; font-size: 13.5px; }
  .health { display: inline-block; font-weight: 700; font-size: 13px; padding: 3px 12px; border-radius: 99px; color: #fff; margin-left: 10px; vertical-align: 2px; }
  .stats { display: flex; gap: 14px; margin: 26px 0 6px; flex-wrap: wrap; }
  .stat { flex: 1; min-width: 110px; background: #f3f5f9; border-radius: 10px; padding: 16px 14px; text-align: center; }
  .stat-n { font-size: 32px; font-weight: 800; letter-spacing: -1px; }
  .stat-l { font-size: 12px; color: #6a7386; margin-top: 2px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 1.1px; color: #2d3546; margin: 30px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e4e7ee; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 7px 10px 7px 0; border-bottom: 1px solid #eef0f5; vertical-align: top; font-size: 14px; }
  .ident { font-family: Consolas, monospace; font-size: 12px; color: #2d5bd7; white-space: nowrap; width: 70px; }
  .dim { color: #6a7386; font-size: 13px; white-space: nowrap; }
  .empty { color: #6a7386; font-size: 13.5px; font-style: italic; }
  .ms { margin-bottom: 14px; }
  .ms-head { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; margin-bottom: 5px; }
  .bar { height: 9px; background: #e9ecf3; border-radius: 5px; overflow: hidden; }
  .fill { height: 100%; background: linear-gradient(90deg, #2d5bd7, #7a3fd1); border-radius: 5px; }
  .note { font-size: 12.5px; color: #6a7386; margin-top: 2px; }
  footer { margin-top: 44px; padding-top: 14px; border-top: 1px solid #e4e7ee; color: #8a92a5; font-size: 12px; display: flex; justify-content: space-between; }
  @media print {
    body { background: #fff; }
    .page { padding: 0; max-width: none; }
    section { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">
  <header>
    <div class="kicker">McKesson · Support AI Initiative</div>
    <h1>Project Status Snapshot<span class="health" style="background:${health.color}">${health.label}</span></h1>
    <div class="meta">${esc(today)} · Prepared by ${esc(preparedBy)} · Generated from live project data in Tether</div>
  </header>

  <div class="stats">
    ${stat(active.length, 'In progress')}
    ${stat(completedWeek.length, 'Completed this week', '#1d7a4d')}
    ${stat(blockers.length, 'Blocked', blockers.length ? '#c2384f' : '#1d7a4d')}
    ${stat(accessOpen.length, 'Access pending', accessOpen.length ? '#a86a00' : '#1d7a4d')}
    ${stat(decisionsOpen.length, 'Decisions open', decisionsOpen.length ? '#a86a00' : '#1d7a4d')}
    ${stat(risks.length, 'Active risks', risks.length ? '#a86a00' : '#1d7a4d')}
  </div>

  ${milestones.length ? `<section><h2>Milestones</h2>${milestoneBars}</section>` : ''}

  ${section('Delivered this week', completedWeek, 'Nothing completed in the last 7 days.')}
  ${section('Current focus', active, 'Nothing currently in progress.')}
  ${section('Blocked & waiting', blockers, 'No active blockers.', (i) =>
    i.extra.waitingOn ? `<div class="note">Waiting on ${esc(String(i.extra.waitingOn))}</div>` : '')}
  ${section('Access needed', accessOpen, 'No pending access requests.', (i) =>
    i.extra.system ? `<div class="note">${esc(String(i.extra.system))}${i.extra.nextAction ? ` — next: ${esc(String(i.extra.nextAction))}` : ''}</div>` : '')}
  ${section('Decisions needed from leadership', decisionsOpen, 'No decisions waiting.')}
  ${section('Risks being watched', risks, 'No open risks.', (i) =>
    i.extra.mitigation ? `<div class="note">Mitigation: ${esc(String(i.extra.mitigation))}</div>` : '')}
  ${section('Coming up', upcoming, 'No dated work upcoming.', (i) =>
    `<div class="note">Due ${esc(i.dueDate ?? '')}</div>`)}

  <footer>
    <span>Support AI · Tether workspace</span>
    <span>Every item above is tracked and linked — ask for detail on any ID.</span>
  </footer>
</div>
</body>
</html>`;
}
