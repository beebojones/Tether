// Leadership Deck: self-contained HTML slide deck generated from live project data.
// Open in any browser, present fullscreen: ← → / Space / click to advance, Esc shows
// overview counter. No dependencies, no network. Tether-indigo accent.
import type { WorkItem, Milestone, User } from '@shared/types';
import { STATUS_LABEL } from '@shared/types';

export interface DeckData {
  items: WorkItem[];
  milestones: Milestone[];
  users: User[];
  preparedBy: string;
  projectName: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function generateDeckHtml({ items, milestones, users, preparedBy, projectName }: DeckData): string {
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const owner = (id: string | null) => users.find((u) => u.id === id)?.name ?? 'Unassigned';
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

  const active = items.filter((i) => i.status === 'in_progress' || i.status === 'in_review');
  const completedWeek = items.filter((i) => i.completedAt && i.completedAt >= weekAgo);
  const blockers = items.filter((i) => (i.type === 'blocker' && i.status === 'active') || i.status === 'blocked');
  const accessOpen = items.filter((i) => i.type === 'access' && !['granted', 'denied', 'not_needed', 'expired'].includes(i.status));
  const risks = items.filter((i) => i.type === 'risk' && (i.status === 'open' || i.status === 'mitigating'));
  const decisionsOpen = items.filter((i) => i.type === 'decision' && (i.status === 'proposed' || i.status === 'discussing'));
  const upcoming = items.filter((i) => i.dueDate && !i.completedAt).sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1)).slice(0, 5);

  const list = (rows: WorkItem[], empty: string, note?: (i: WorkItem) => string) =>
    rows.length === 0
      ? `<p class="empty">${esc(empty)}</p>`
      : `<div class="rows">${rows
          .slice(0, 6)
          .map(
            (i) => `
        <div class="row">
          <span class="rid">${esc(i.ident)}</span>
          <span class="rtitle">${esc(i.title)}${note && note(i) ? `<span class="rnote">${note(i)}</span>` : ''}</span>
          <span class="rmeta">${esc(STATUS_LABEL[i.status] ?? i.status)} · ${esc(owner(i.ownerId))}</span>
        </div>`,
          )
          .join('')}${rows.length > 6 ? `<p class="empty">+ ${rows.length - 6} more in Tether</p>` : ''}</div>`;

  const slides: { title: string; body: string; kicker?: string }[] = [];

  slides.push({
    title: '__TITLE__',
    body: `
      <div class="titleslide">
        <div class="brand"><svg width="44" height="44" viewBox="0 0 512 512" fill="none" stroke="#fff" stroke-width="52" stroke-linecap="round" aria-hidden="true"><circle cx="168" cy="256" r="92"/><circle cx="400" cy="256" r="44"/><line x1="260" y1="256" x2="356" y2="256"/></svg></div>
        <h1>${esc(projectName)}</h1>
        <p class="sub">Project status · ${esc(today)}</p>
        <p class="byline">Prepared by ${esc(preparedBy)} · Live data from Tether</p>
      </div>`,
  });

  slides.push({
    kicker: 'Where we are',
    title: 'The numbers',
    body: `
      <div class="statgrid">
        <div class="bigstat"><div class="n">${active.length}</div><div class="l">In progress</div></div>
        <div class="bigstat good"><div class="n">${completedWeek.length}</div><div class="l">Completed this week</div></div>
        <div class="bigstat ${blockers.length ? 'bad' : 'good'}"><div class="n">${blockers.length}</div><div class="l">Blocked</div></div>
        <div class="bigstat ${accessOpen.length ? 'warn' : 'good'}"><div class="n">${accessOpen.length}</div><div class="l">Access pending</div></div>
        <div class="bigstat ${decisionsOpen.length ? 'warn' : 'good'}"><div class="n">${decisionsOpen.length}</div><div class="l">Decisions open</div></div>
        <div class="bigstat ${risks.length ? 'warn' : 'good'}"><div class="n">${risks.length}</div><div class="l">Active risks</div></div>
      </div>`,
  });

  if (milestones.length) {
    slides.push({
      kicker: 'Roadmap',
      title: 'Milestones',
      body: `<div class="msgrid">${milestones
        .map((m) => {
          const inMs = items.filter((i) => i.milestoneId === m.id);
          const done = inMs.filter((i) => i.completedAt).length;
          const pct = inMs.length ? Math.round((done / inMs.length) * 100) : 0;
          return `
          <div class="ms">
            <div class="mshead"><span>${esc(m.name)}</span><span class="rmeta">${m.targetDate ? esc(m.targetDate) + ' · ' : ''}${pct}%</span></div>
            <div class="bar"><div class="fillbar" style="width:${pct}%"></div></div>
          </div>`;
        })
        .join('')}</div>`,
    });
  }

  if (completedWeek.length) slides.push({ kicker: 'Momentum', title: 'Delivered this week', body: list(completedWeek, '') });
  slides.push({ kicker: 'Now', title: 'Current focus', body: list(active, 'Nothing currently in progress.') });
  slides.push({
    kicker: 'Friction',
    title: blockers.length ? 'Blocked & waiting' : 'Nothing is blocked',
    body: list(blockers, 'No active blockers — path is clear.', (i) =>
      i.extra.waitingOn ? `Waiting on ${esc(String(i.extra.waitingOn))}` : ''),
  });
  if (accessOpen.length) {
    slides.push({
      kicker: 'Asks',
      title: 'Access we need',
      body: list(accessOpen, '', (i) => (i.extra.system ? esc(String(i.extra.system)) : '')),
    });
  }
  if (decisionsOpen.length) {
    slides.push({ kicker: 'Asks', title: 'Decisions we need', body: list(decisionsOpen, '') });
  }
  if (risks.length) {
    slides.push({
      kicker: 'Watchlist',
      title: 'Risks we’re managing',
      body: list(risks, '', (i) => (i.extra.mitigation ? `Mitigation: ${esc(String(i.extra.mitigation))}` : '')),
    });
  }
  if (upcoming.length) {
    slides.push({ kicker: 'Next', title: 'Coming up', body: list(upcoming, '', (i) => `Due ${esc(i.dueDate ?? '')}`) });
  }
  slides.push({
    title: '__TITLE__',
    body: `
      <div class="titleslide">
        <h1>Questions?</h1>
        <p class="sub">Every item shown is tracked, linked, and current in Tether.</p>
      </div>`,
  });

  const slideHtml = slides
    .map(
      (s, i) => `
    <section class="slide" data-i="${i}">
      ${s.title === '__TITLE__' ? s.body : `
      ${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ''}
      <h2>${esc(s.title)}</h2>
      ${s.body}`}
    </section>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(projectName)} — Status Deck — ${esc(today)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background:
      radial-gradient(1200px 700px at 12% -10%, rgba(110,139,255,0.14), transparent 60%),
      radial-gradient(1000px 600px at 95% 112%, rgba(155,110,242,0.12), transparent 60%),
      #0a0c12;
    color: #fff; overflow: hidden;
  }
  .slide {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; justify-content: center;
    padding: 60px; max-width: 1000px; margin: 0 auto;
    opacity: 0; transform: translateX(28px); pointer-events: none;
    transition: opacity 420ms cubic-bezier(0.16,1,0.3,1), transform 420ms cubic-bezier(0.16,1,0.3,1);
  }
  .slide.current { opacity: 1; transform: none; pointer-events: auto; }
  .slide.prev { transform: translateX(-28px); }
  .kicker { font-size: 14px; font-weight: 700; letter-spacing: 2.2px; text-transform: uppercase; color: #6e8bff; margin-bottom: 14px; }
  h2 { font-size: clamp(34px, 5vw, 56px); letter-spacing: -1px; margin-bottom: 40px; }
  .titleslide { text-align: center; }
  .brand {
    width: 84px; height: 84px; margin: 0 auto 28px; border-radius: 22px;
    background: linear-gradient(135deg, #8b7bff, #e264b4);
    display: flex; align-items: center; justify-content: center;
    font-size: 40px; font-weight: 800; box-shadow: 0 0 60px rgba(110,139,255,0.35);
  }
  h1 { font-size: clamp(52px, 8vw, 92px); letter-spacing: -2.5px; }
  .sub { font-size: clamp(18px, 2.4vw, 26px); color: #a8b2c9; margin-top: 14px; }
  .byline { color: #6b7692; font-size: 15px; margin-top: 20px; }
  .statgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
  .bigstat { background: rgba(30,37,58,0.55); border: 1px solid rgba(130,150,210,0.16); border-radius: 16px; padding: 34px 20px; text-align: center; backdrop-filter: blur(10px); }
  .bigstat .n { font-size: clamp(48px, 7vw, 84px); font-weight: 800; letter-spacing: -2px; }
  .bigstat .l { color: #a8b2c9; font-size: clamp(13px, 1.5vw, 17px); margin-top: 4px; }
  .bigstat.good .n { color: #4cc38a; } .bigstat.warn .n { color: #f2b04c; } .bigstat.bad .n { color: #f2647c; }
  .rows { display: flex; flex-direction: column; gap: 14px; }
  .row { display: flex; align-items: baseline; gap: 18px; background: rgba(30,37,58,0.55); border: 1px solid rgba(130,150,210,0.14); border-radius: 12px; padding: 16px 22px; }
  .rid { font-family: Consolas, monospace; color: #6e8bff; font-size: clamp(13px, 1.4vw, 16px); white-space: nowrap; }
  .rtitle { flex: 1; font-size: clamp(17px, 2vw, 23px); min-width: 0; }
  .rnote { display: block; color: #a8b2c9; font-size: 0.72em; margin-top: 3px; }
  .rmeta { color: #6b7692; font-size: clamp(12px, 1.3vw, 15px); white-space: nowrap; }
  .empty { color: #a8b2c9; font-size: 20px; }
  .msgrid { display: flex; flex-direction: column; gap: 34px; }
  .mshead { display: flex; justify-content: space-between; font-size: clamp(18px, 2.2vw, 24px); margin-bottom: 12px; }
  .bar { height: 12px; background: rgba(130,150,210,0.14); border-radius: 6px; overflow: hidden; }
  .fillbar { height: 100%; background: linear-gradient(90deg, #8b7bff, #e264b4); border-radius: 6px; transform-origin: left; }
  .current .fillbar { animation: sweep 900ms cubic-bezier(0.16,1,0.3,1) 200ms both; }
  @keyframes sweep { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  .hud { position: fixed; bottom: 22px; right: 28px; color: #6b7692; font-size: 14px; font-family: Consolas, monospace; }
  .hint { position: fixed; bottom: 22px; left: 28px; color: #4a5470; font-size: 13px; }
  @media (prefers-reduced-motion: reduce) {
    .slide { transition: none; }
    .current .fillbar { animation: none; }
  }
</style>
</head>
<body>
${slideHtml}
<div class="hud"><span id="cur">1</span> / ${slides.length}</div>
<div class="hint">← → or click to navigate</div>
<script>
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var cur = 0;
  function show(n) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function (s, i) {
      s.classList.toggle('current', i === n);
      s.classList.toggle('prev', i < n);
    });
    cur = n;
    document.getElementById('cur').textContent = String(n + 1);
  }
  document.addEventListener('keydown', function (e) {
    var k = e.key || '';
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || e.keyCode === 39) show(cur + 1);
    if (k === 'ArrowLeft' || k === 'PageUp' || e.keyCode === 37) show(cur - 1);
    if (k === 'Home') show(0);
    if (k === 'End') show(slides.length - 1);
  });
  document.addEventListener('click', function (e) {
    if (e.clientX > window.innerWidth * 0.25) show(cur + 1); else show(cur - 1);
  });
  show(0);
})();
</script>
</body>
</html>`;
}
