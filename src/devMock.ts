// Dev-only in-browser mock of the Electron bridge. Lets the renderer run in a plain
// browser (Vite dev server) for visual QA, screenshots, and UI smoke tests without
// Electron. NEVER active inside the real app — main.tsx installs it only when
// window.tether is absent (i.e., not running under Electron).
//
// Query params: ?view=<route>  ?theme=<meridian|ember|aurora|slate>
import type {
  WorkItem, ItemFilter, ItemSort, ItemType, Comment, Attachment, ItemLink, Milestone,
  Release, SavedView, SyncConflict, SyncStatus, User, SearchResult, ActivityEntry, ItemVersion,
  Priority, LinkKind,
} from '@shared/types';
import { IDENT_PREFIX, statusesForType, TERMINAL_STATUSES } from '@shared/types';

const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

let idc = 0;
const uid = () => `mock-${++idc}`;

const users: User[] = [
  { id: 'john', name: 'John Crouch', initials: 'JC', color: '#6E8BFF', createdAt: daysAgo(30) },
  { id: 'mark', name: 'Mark', initials: 'M', color: '#4CC38A', createdAt: daysAgo(30) },
];

const milestones: Milestone[] = [
  { id: 'm1', name: 'Discovery & Access', description: 'Secure system access, inventory knowledge sources, confirm scope.', targetDate: daysAhead(34), status: 'active', sort: 1, sample: 1 },
  { id: 'm2', name: 'Knowledge Pipeline MVP', description: 'Ingest, clean, and index the first knowledge domain end to end.', targetDate: daysAhead(81), status: 'planned', sort: 2, sample: 1 },
  { id: 'm3', name: 'Pilot with Support Team', description: 'Limited pilot: measure deflection, accuracy, satisfaction.', targetDate: daysAhead(142), status: 'planned', sort: 3, sample: 1 },
];

const releases: Release[] = [
  { id: 'r1', name: 'Support AI Pilot 0.1', version: '0.1', targetDate: daysAhead(126), status: 'planned', goals: 'First internal pilot: single knowledge domain, 10 agents, feedback loop.', notes: '', sample: 1 },
];

const counters: Partial<Record<ItemType, number>> = {};
function mk(p: Partial<WorkItem> & { type: ItemType; title: string }): WorkItem {
  const n = (counters[p.type] = (counters[p.type] ?? 0) + 1);
  const created = p.createdAt ?? daysAgo(Math.floor(Math.random() * 20) + 2);
  return {
    id: uid(),
    ident: `${IDENT_PREFIX[p.type]}-${n}`,
    type: p.type,
    title: p.title,
    body: p.bodyText
      ? JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: p.bodyText }] }] })
      : '',
    bodyText: p.bodyText ?? '',
    status: p.status ?? statusesForType(p.type)[0],
    priority: p.priority ?? 'medium',
    ownerId: p.ownerId ?? null,
    reporterId: 'john',
    milestoneId: p.milestoneId ?? null,
    releaseId: p.releaseId ?? null,
    parentId: null,
    startDate: null,
    dueDate: p.dueDate ?? null,
    completedAt: p.completedAt ?? (p.status && TERMINAL_STATUSES.has(p.status) ? daysAgo(2) : null),
    effort: null,
    confidence: null,
    riskLevel: null,
    businessValue: null,
    leadershipVisible: p.leadershipVisible ?? 0,
    progress: null,
    tags: p.tags ?? [],
    extra: p.extra ?? {},
    archived: 0,
    sample: 1,
    createdAt: created,
    updatedAt: p.updatedAt ?? daysAgo(Math.floor(Math.random() * 3)),
    createdBy: 'john',
    updatedBy: Math.random() > 0.5 ? 'john' : 'mark',
  };
}

const items: WorkItem[] = [
  mk({ type: 'feature', title: 'AI answer generation over knowledge base', status: 'in_progress', priority: 'high', ownerId: 'john', milestoneId: 'm2', leadershipVisible: 1, bodyText: 'Core capability: given a support question, retrieve relevant knowledge articles and generate a grounded, cited answer with links back to the source articles.' }),
  mk({ type: 'feature', title: 'Knowledge ingestion pipeline (Salesforce KA export)', status: 'in_progress', priority: 'urgent', ownerId: 'john', milestoneId: 'm2', leadershipVisible: 1, bodyText: 'Export knowledge articles, normalize to clean text, chunk, and index for retrieval.' }),
  mk({ type: 'feature', title: 'Agent feedback capture (thumbs + reason codes)', status: 'backlog', priority: 'medium', ownerId: 'mark', milestoneId: 'm3' }),
  mk({ type: 'requirement', title: 'Every AI answer must cite its source articles', status: 'todo', priority: 'high', ownerId: 'john', milestoneId: 'm2', extra: { acceptanceCriteria: 'Answer UI shows at least one source link per answer; uncited answers are suppressed.' } }),
  mk({ type: 'requirement', title: 'No PHI or customer data may leave approved systems', status: 'in_progress', priority: 'urgent', ownerId: 'mark', leadershipVisible: 1, extra: { securityConsiderations: 'Blocking requirement for any external AI service.' } }),
  mk({ type: 'task', title: 'Build Salesforce knowledge article export script', status: 'done', priority: 'high', ownerId: 'john', milestoneId: 'm1', completedAt: daysAgo(3) }),
  mk({ type: 'task', title: 'HTML→clean text normalization for exported articles', status: 'in_progress', priority: 'high', ownerId: 'john', milestoneId: 'm2', dueDate: daysAhead(9) }),
  mk({ type: 'task', title: 'Draft answer-quality evaluation rubric', status: 'todo', priority: 'medium', ownerId: 'mark', milestoneId: 'm2', dueDate: daysAhead(3) }),
  mk({ type: 'task', title: 'Inventory candidate knowledge domains and article counts', status: 'done', priority: 'medium', ownerId: 'john', milestoneId: 'm1', completedAt: daysAgo(5) }),
  mk({ type: 'task', title: 'Set up retrieval evaluation harness', status: 'in_review', priority: 'medium', ownerId: 'mark', milestoneId: 'm2', dueDate: daysAhead(6) }),
  mk({ type: 'access', title: 'Salesforce API access (Knowledge object, read)', status: 'requested', priority: 'urgent', ownerId: 'john', leadershipVisible: 1, extra: { system: 'Salesforce Service Cloud', accessType: 'API read (Knowledge object)', businessReason: 'Automated export of knowledge articles for the ingestion pipeline.', requestedFrom: 'Salesforce platform team', requestDate: daysAgo(12).slice(0, 10), nextAction: 'Follow up with platform team lead', followUpDate: daysAhead(3) } }),
  mk({ type: 'access', title: 'Azure OpenAI service provisioning in McKesson tenant', status: 'under_review', priority: 'urgent', ownerId: 'mark', leadershipVisible: 1, extra: { system: 'Azure OpenAI (McKesson tenant)', accessType: 'Resource provisioning + API keys', businessReason: 'Approved-tenant LLM required for answer generation without data egress.', requestedFrom: 'Cloud platform / security', nextAction: 'Security review meeting', followUpDate: daysAhead(6) } }),
  mk({ type: 'access', title: 'SharePoint site for pilot documentation', status: 'granted', priority: 'low', ownerId: 'mark', extra: { system: 'SharePoint Online', accessType: 'Site owner', approvedBy: 'IT service desk', dateGranted: daysAgo(20).slice(0, 10) } }),
  mk({ type: 'decision', title: 'Use tenant-hosted Azure OpenAI, not public APIs', status: 'approved', priority: 'high', ownerId: 'mark', leadershipVisible: 1, extra: { context: 'Answer generation needs an LLM. Public AI APIs are unapproved for internal data.', reasoning: 'Tenant hosting keeps data inside the approved boundary.', tradeoffs: 'Slower start; capacity quotas.' } }),
  mk({ type: 'decision', title: 'Pilot scope: start with one high-volume knowledge domain', status: 'discussing', priority: 'medium', ownerId: 'john', extra: { context: 'Knowledge base spans many product areas with uneven quality.', problem: 'Pilot everything or one domain first?' } }),
  mk({ type: 'risk', title: 'Knowledge article quality too low for grounded answers', status: 'open', priority: 'high', ownerId: 'john', leadershipVisible: 1, extra: { likelihood: 'medium', impact: 'high', mitigation: 'Quality audit of the pilot domain before indexing.' } }),
  mk({ type: 'risk', title: 'Access approvals slip and stall the pipeline build', status: 'mitigating', priority: 'high', ownerId: 'mark', leadershipVisible: 1, extra: { likelihood: 'high', impact: 'high', mitigation: 'Weekly follow-ups; leadership escalation path agreed.' } }),
  mk({ type: 'blocker', title: 'Cannot generate answers until Azure OpenAI is provisioned', status: 'active', priority: 'urgent', ownerId: 'mark', leadershipVisible: 1, extra: { waitingOn: 'Cloud platform team / security review', since: daysAgo(18).slice(0, 10) } }),
  mk({ type: 'meeting', title: 'Support AI kickoff with knowledge leadership', status: 'summarized', ownerId: 'john', extra: { date: daysAgo(24).slice(0, 10), time: '10:00 AM', attendees: ['John', 'Mark', 'Allen', 'George'], purpose: 'Align on pilot scope, access needs, and success measures.' }, bodyText: 'Agreed to single-domain pilot. Allen to sponsor access requests. Success = deflection rate + agent satisfaction. Next check-in in 4 weeks.' }),
  mk({ type: 'question', title: 'Which deflection metric does support leadership already trust?', status: 'open', ownerId: 'mark' }),
  mk({ type: 'idea', title: 'Auto-triage inbound cases by knowledge coverage', status: 'backlog', ownerId: 'john' }),
  mk({ type: 'research', title: 'Retrieval strategy comparison: hybrid vs pure vector', status: 'in_progress', ownerId: 'john', bodyText: 'Early result: hybrid (BM25 + vector) noticeably better on product-code queries.' }),
];

const byKey = (t: string, n: number) => items.find((i) => i.ident === `${IDENT_PREFIX[t as ItemType]}-${n}`)!;
const links: ItemLink[] = [
  { id: uid(), fromId: byKey('task', 2).id, toId: byKey('feature', 2).id, kind: 'implements', createdAt: daysAgo(9), createdBy: 'john' },
  { id: uid(), fromId: byKey('requirement', 1).id, toId: byKey('feature', 1).id, kind: 'supports', createdAt: daysAgo(9), createdBy: 'john' },
  { id: uid(), fromId: byKey('feature', 1).id, toId: byKey('decision', 1).id, kind: 'shaped_by', createdAt: daysAgo(8), createdBy: 'mark' },
  { id: uid(), fromId: byKey('feature', 1).id, toId: byKey('access', 2).id, kind: 'requires_access', createdAt: daysAgo(8), createdBy: 'mark' },
  { id: uid(), fromId: byKey('blocker', 1).id, toId: byKey('feature', 1).id, kind: 'blocks', createdAt: daysAgo(8), createdBy: 'mark' },
  { id: uid(), fromId: byKey('decision', 2).id, toId: byKey('meeting', 1).id, kind: 'discussed_in', createdAt: daysAgo(7), createdBy: 'john' },
];

const comments: Comment[] = [
  { id: uid(), itemId: byKey('feature', 1).id, authorId: 'mark', body: '', bodyText: 'Retrieval eval harness is nearly ready — we can baseline as soon as the index lands.', createdAt: daysAgo(2), updatedAt: null, deleted: 0 },
  { id: uid(), itemId: byKey('feature', 1).id, authorId: 'john', body: '', bodyText: 'Citations requirement (REQ-1) shapes the prompt format — see the decision record.', createdAt: daysAgo(1), updatedAt: null, deleted: 0 },
];

const activity: ActivityEntry[] = [
  { id: uid(), itemId: byKey('task', 2).id, actorId: 'john', kind: 'updated', field: 'status', oldValue: 'todo', newValue: 'in_progress', at: daysAgo(0.2) },
  { id: uid(), itemId: byKey('access', 2).id, actorId: 'mark', kind: 'updated', field: 'status', oldValue: 'requested', newValue: 'under_review', at: daysAgo(0.6) },
  { id: uid(), itemId: byKey('feature', 1).id, actorId: 'mark', kind: 'comment', field: null, oldValue: null, newValue: 'Retrieval eval harness is nearly ready…', at: daysAgo(1) },
  { id: uid(), itemId: byKey('task', 1).id, actorId: 'john', kind: 'updated', field: 'status', oldValue: 'in_review', newValue: 'done', at: daysAgo(3) },
  { id: uid(), itemId: byKey('decision', 1).id, actorId: 'mark', kind: 'updated', field: 'status', oldValue: 'discussing', newValue: 'approved', at: daysAgo(4) },
  { id: uid(), itemId: byKey('meeting', 1).id, actorId: 'john', kind: 'created', field: null, oldValue: null, newValue: 'Support AI kickoff with knowledge leadership', at: daysAgo(24) },
];

const conflicts: SyncConflict[] = [
  {
    id: uid(), entity: 'item', entityId: byKey('requirement', 2).id, field: 'title',
    localValue: 'No PHI or customer data may leave approved systems',
    remoteValue: 'No PHI, PII, or customer data may leave McKesson-approved systems',
    remoteDevice: 'mark-device', remoteActor: 'mark', detectedAt: daysAgo(0.1), resolvedAt: null, resolution: null,
  },
];

const versions: ItemVersion[] = [];
const savedViews: SavedView[] = [];
const listeners = new Set<(w: { entity: string; entityId: string }) => void>();
const emit = () => listeners.forEach((l) => l({ entity: '*', entityId: '*' }));

const syncStatus: SyncStatus = {
  state: 'idle',
  folder: 'C:\\Users\\jcrouch\\OneDrive - McKesson\\SupportAI-Shared',
  lastSyncAt: daysAgo(0.001),
  lastError: null,
  pendingOps: 0,
  openConflicts: conflicts.filter((c) => !c.resolvedAt).length,
  peers: [{ deviceId: 'mark-device', userName: 'Mark', lastSeenAt: daysAgo(0.01) }],
};

function applyFilter(filter: ItemFilter): WorkItem[] {
  let out = items.filter((i) => i.archived === (filter.archived ? 1 : 0));
  if (filter.types?.length) out = out.filter((i) => filter.types!.includes(i.type));
  if (filter.statuses?.length) out = out.filter((i) => filter.statuses!.includes(i.status));
  if (filter.priorities?.length) out = out.filter((i) => filter.priorities!.includes(i.priority));
  if (filter.ownerIds?.length) out = out.filter((i) => filter.ownerIds!.includes(i.ownerId));
  if (filter.milestoneId) out = out.filter((i) => i.milestoneId === filter.milestoneId);
  if (filter.releaseId) out = out.filter((i) => i.releaseId === filter.releaseId);
  if (filter.overdue) out = out.filter((i) => i.dueDate && !i.completedAt && i.dueDate < now().slice(0, 10));
  if (filter.dueWithinDays != null) out = out.filter((i) => i.dueDate && !i.completedAt && i.dueDate <= daysAhead(filter.dueWithinDays!));
  if (filter.leadershipVisible) out = out.filter((i) => i.leadershipVisible === 1);
  if (filter.updatedSince) out = out.filter((i) => i.updatedAt >= filter.updatedSince!);
  if (filter.sample !== undefined) out = out.filter((i) => i.sample === (filter.sample ? 1 : 0));
  if (filter.text) {
    const q = filter.text.toLowerCase();
    out = out.filter((i) => i.title.toLowerCase().includes(q) || i.bodyText.toLowerCase().includes(q) || i.ident.toLowerCase().includes(q));
  }
  return out;
}

function applySort(rows: WorkItem[], sort: ItemSort): WorkItem[] {
  const dir = sort.dir === 'asc' ? 1 : -1;
  const pr: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
  return [...rows].sort((a, b) => {
    switch (sort.field) {
      case 'priority': return (pr[a.priority] - pr[b.priority]) * dir;
      case 'dueDate': return ((a.dueDate ?? '9999') < (b.dueDate ?? '9999') ? -1 : 1) * dir;
      case 'ident': return a.ident.localeCompare(b.ident, undefined, { numeric: true }) * dir;
      case 'title': return a.title.localeCompare(b.title) * dir;
      case 'createdAt': return (a.createdAt < b.createdAt ? -1 : 1) * dir;
      default: return (a.updatedAt < b.updatedAt ? -1 : 1) * dir;
    }
  });
}

export function installDevMock(): void {
  const bridge = {
    app: {
      info: async () => ({ version: '0.1.0-browser-preview', dataDir: '(browser preview — no disk)', dbPath: '(browser preview)', deviceId: 'preview-device' }),
      backup: async () => '(browser preview — backup unavailable)',
    },
    settings: {
      get: async () => ({ currentUser: { id: 'john', name: 'John Crouch', initials: 'JC', color: '#6E8BFF' }, syncFolder: syncStatus.folder, theme: 'dark' as const, seedLoaded: true }),
      set: async () => bridge.settings.get(),
      setUser: async () => bridge.settings.get(),
      chooseSyncFolder: async () => null,
    },
    sync: {
      configure: async () => syncStatus,
      status: async () => ({ ...syncStatus, openConflicts: conflicts.filter((c) => !c.resolvedAt).length }),
      now: async () => syncStatus,
      onStatus: () => () => {},
    },
    items: {
      list: async (filter: ItemFilter, sort: ItemSort, limit = 500) => applySort(applyFilter(filter ?? {}), sort ?? { field: 'updatedAt', dir: 'desc' }).slice(0, limit),
      get: async (id: string) => items.find((i) => i.id === id) ?? null,
      getByIdent: async (ident: string) => items.find((i) => i.ident.toLowerCase() === ident.toLowerCase()) ?? null,
      create: async (input: Partial<WorkItem> & { type: ItemType; title: string }) => {
        const item = mk({ ...input, status: input.status, createdAt: now(), updatedAt: now() });
        items.unshift(item);
        activity.unshift({ id: uid(), itemId: item.id, actorId: 'john', kind: 'created', field: null, oldValue: null, newValue: item.title, at: now() });
        emit();
        return item;
      },
      update: async (id: string, fields: Partial<WorkItem>) => {
        const item = items.find((i) => i.id === id);
        if (!item) return null;
        Object.assign(item, fields, { updatedAt: now(), updatedBy: 'john' });
        if (fields.status) item.completedAt = TERMINAL_STATUSES.has(fields.status) ? now() : null;
        emit();
        return item;
      },
      archive: async (id: string, archived: boolean) => {
        const item = items.find((i) => i.id === id);
        if (item) item.archived = archived ? 1 : 0;
        emit();
      },
      delete: async (id: string) => {
        const idx = items.findIndex((i) => i.id === id);
        if (idx >= 0) items.splice(idx, 1);
        emit();
      },
      search: async (text: string, limit = 30): Promise<SearchResult[]> =>
        applyFilter({ text }).slice(0, limit).map((item) => ({ item, snippet: item.bodyText.slice(0, 80) || null, score: 0 })),
    },
    links: {
      add: async (fromId: string, toId: string, kind: LinkKind) => {
        const link: ItemLink = { id: uid(), fromId, toId, kind, createdAt: now(), createdBy: 'john' };
        links.push(link);
        emit();
        return link;
      },
      remove: async (id: string) => {
        const idx = links.findIndex((l) => l.id === id);
        if (idx >= 0) links.splice(idx, 1);
        emit();
      },
      for: async (itemId: string) =>
        links
          .filter((l) => l.fromId === itemId || l.toId === itemId)
          .map((link) => {
            const direction = link.fromId === itemId ? ('out' as const) : ('in' as const);
            const other = items.find((i) => i.id === (direction === 'out' ? link.toId : link.fromId));
            return other ? { link, direction, other } : null;
          })
          .filter(Boolean),
    },
    comments: {
      add: async (itemId: string, body: string, bodyText: string) => {
        const c: Comment = { id: uid(), itemId, authorId: 'john', body, bodyText, createdAt: now(), updatedAt: null, deleted: 0 };
        comments.push(c);
        emit();
        return c;
      },
      update: async () => {},
      delete: async (id: string) => {
        const idx = comments.findIndex((c) => c.id === id);
        if (idx >= 0) comments.splice(idx, 1);
        emit();
      },
      for: async (itemId: string) => comments.filter((c) => c.itemId === itemId),
    },
    versions: {
      save: async (itemId: string) => {
        const item = items.find((i) => i.id === itemId);
        if (item) versions.push({ id: uid(), itemId, version: versions.filter((v) => v.itemId === itemId).length + 1, title: item.title, body: item.body, savedBy: 'john', savedAt: now() });
      },
      for: async (itemId: string) => versions.filter((v) => v.itemId === itemId).reverse(),
    },
    activity: {
      for: async (itemId: string | null, limit = 100) =>
        (itemId ? activity.filter((a) => a.itemId === itemId) : activity).slice(0, limit),
    },
    users: { list: async () => users },
    milestones: { list: async () => milestones, upsert: async (m: Milestone) => m },
    releases: { list: async () => releases, upsert: async (r: Release) => r },
    views: {
      list: async () => savedViews,
      save: async (v: SavedView) => {
        savedViews.push({ ...v, id: v.id ?? uid(), createdBy: 'john', createdAt: now(), pinned: v.pinned ?? 0 });
        return savedViews[savedViews.length - 1];
      },
      delete: async (id: string) => {
        const idx = savedViews.findIndex((v) => v.id === id);
        if (idx >= 0) savedViews.splice(idx, 1);
      },
    },
    conflicts: {
      list: async (openOnly = true) => (openOnly ? conflicts.filter((c) => !c.resolvedAt) : conflicts),
      resolve: async (id: string, resolution: 'local' | 'remote' | 'merged', mergedValue?: string) => {
        const c = conflicts.find((x) => x.id === id);
        if (!c) return;
        c.resolvedAt = now();
        c.resolution = resolution;
        const item = items.find((i) => i.id === c.entityId);
        if (item && c.field === 'title') item.title = resolution === 'merged' ? (mergedValue ?? item.title) : resolution === 'local' ? c.localValue : c.remoteValue;
        emit();
      },
    },
    attachments: {
      pick: async () => [] as Attachment[],
      for: async () => [] as Attachment[],
      open: async () => { throw new Error('Attachments are unavailable in the browser preview'); },
      remove: async () => {},
    },
    seed: { load: async () => 0, remove: async () => 0 },
    export: {
      save: async (defaultName: string, content: string) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = defaultName;
        a.click();
        return defaultName;
      },
    },
    events: {
      onDataChanged: (cb: (w: { entity: string; entityId: string }) => void) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
    },
  };

  (window as unknown as { tether: typeof bridge }).tether = bridge;
}
