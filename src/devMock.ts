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
  { id: 'alex', name: 'Alex Rivera', initials: 'AR', color: '#6E8BFF', createdAt: daysAgo(30) },
  { id: 'sam', name: 'Sam Chen', initials: 'SC', color: '#4CC38A', createdAt: daysAgo(30) },
];

const milestones: Milestone[] = [
  { id: 'm1', name: 'Foundations & Setup', description: 'Stand up environments, CI, and project scaffolding; confirm scope.', targetDate: daysAhead(34), status: 'active', sort: 1, sample: 1 },
  { id: 'm2', name: 'Core Product MVP', description: 'Build the first end-to-end user flow from sign-up to first value.', targetDate: daysAhead(81), status: 'planned', sort: 2, sample: 1 },
  { id: 'm3', name: 'Beta with Early Users', description: 'Limited beta: gather feedback, measure activation and satisfaction.', targetDate: daysAhead(142), status: 'planned', sort: 3, sample: 1 },
];

const releases: Release[] = [
  { id: 'r1', name: 'Project Atlas Beta 0.1', version: '0.1', targetDate: daysAhead(126), status: 'planned', goals: 'First public beta: core flow, 10 early users, feedback loop.', notes: '', sample: 1 },
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
    reporterId: 'alex',
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
    createdBy: 'alex',
    updatedBy: Math.random() > 0.5 ? 'alex' : 'sam',
  };
}

const items: WorkItem[] = [
  mk({ type: 'feature', title: 'User onboarding flow', status: 'in_progress', priority: 'high', ownerId: 'alex', milestoneId: 'm2', leadershipVisible: 1, bodyText: 'Core capability: guide a new user from sign-up through account setup to their first completed action, with progress cues and sensible defaults.' }),
  mk({ type: 'feature', title: 'Data import pipeline (CSV upload)', status: 'in_progress', priority: 'urgent', ownerId: 'alex', milestoneId: 'm2', leadershipVisible: 1, bodyText: 'Let users upload a CSV, validate and normalize the rows, map columns, and load records into the workspace.' }),
  mk({ type: 'feature', title: 'In-app feedback widget (rating + comment)', status: 'backlog', priority: 'medium', ownerId: 'sam', milestoneId: 'm3' }),
  mk({ type: 'requirement', title: 'All destructive actions require confirmation', status: 'todo', priority: 'high', ownerId: 'alex', milestoneId: 'm2', extra: { acceptanceCriteria: 'Every delete or archive action shows a confirm dialog and can be undone within 10 seconds.' } }),
  mk({ type: 'requirement', title: 'User data must be encrypted at rest', status: 'in_progress', priority: 'urgent', ownerId: 'sam', leadershipVisible: 1, extra: { securityConsiderations: 'Blocking requirement for handling any user data in beta.' } }),
  mk({ type: 'task', title: 'Set up CI/CD pipeline', status: 'done', priority: 'high', ownerId: 'alex', milestoneId: 'm1', completedAt: daysAgo(3) }),
  mk({ type: 'task', title: 'Build CSV parser and row validation', status: 'in_progress', priority: 'high', ownerId: 'alex', milestoneId: 'm2', dueDate: daysAhead(9) }),
  mk({ type: 'task', title: 'Draft QA test plan for the core flow', status: 'todo', priority: 'medium', ownerId: 'sam', milestoneId: 'm2', dueDate: daysAhead(3) }),
  mk({ type: 'task', title: 'Audit existing data sources and record volumes', status: 'done', priority: 'medium', ownerId: 'alex', milestoneId: 'm1', completedAt: daysAgo(5) }),
  mk({ type: 'task', title: 'Set up end-to-end test harness', status: 'in_review', priority: 'medium', ownerId: 'sam', milestoneId: 'm2', dueDate: daysAhead(6) }),
  mk({ type: 'access', title: 'Production database read access (replica)', status: 'requested', priority: 'urgent', ownerId: 'alex', leadershipVisible: 1, extra: { system: 'Production PostgreSQL', accessType: 'Read-only replica', businessReason: 'Verify real data shapes for the import pipeline.', requestedFrom: 'Platform team', requestDate: daysAgo(12).slice(0, 10), nextAction: 'Follow up with platform team lead', followUpDate: daysAhead(3) } }),
  mk({ type: 'access', title: 'Cloud hosting environment provisioning', status: 'under_review', priority: 'urgent', ownerId: 'sam', leadershipVisible: 1, extra: { system: 'Cloud hosting (staging + prod)', accessType: 'Environment provisioning + deploy keys', businessReason: 'Managed environment required to deploy and run the beta.', requestedFrom: 'Infrastructure team', nextAction: 'Provisioning review meeting', followUpDate: daysAhead(6) } }),
  mk({ type: 'access', title: 'Shared drive for project documentation', status: 'granted', priority: 'low', ownerId: 'sam', extra: { system: 'Shared drive', accessType: 'Folder owner', approvedBy: 'IT service desk', dateGranted: daysAgo(20).slice(0, 10) } }),
  mk({ type: 'decision', title: 'Use managed cloud hosting, not self-hosted', status: 'approved', priority: 'high', ownerId: 'sam', leadershipVisible: 1, extra: { context: 'The beta needs a hosting target and the team is small.', reasoning: 'Managed hosting reduces ops burden and lets the team ship faster.', tradeoffs: 'Higher monthly cost; some vendor lock-in.' } }),
  mk({ type: 'decision', title: 'Beta scope: start with one customer segment', status: 'discussing', priority: 'medium', ownerId: 'alex', extra: { context: 'The product could serve several segments with different needs.', problem: 'Launch broadly or focus on one segment first?' } }),
  mk({ type: 'risk', title: 'Third-party API rate limits could throttle imports', status: 'open', priority: 'high', ownerId: 'alex', leadershipVisible: 1, extra: { likelihood: 'medium', impact: 'high', mitigation: 'Add caching and backoff; request higher limits before beta.' } }),
  mk({ type: 'risk', title: 'Access approvals slip and stall environment setup', status: 'mitigating', priority: 'high', ownerId: 'sam', leadershipVisible: 1, extra: { likelihood: 'high', impact: 'high', mitigation: 'Weekly follow-ups; leadership escalation path agreed.' } }),
  mk({ type: 'blocker', title: 'Cannot deploy until the hosting environment is provisioned', status: 'active', priority: 'urgent', ownerId: 'sam', leadershipVisible: 1, extra: { waitingOn: 'Infrastructure team / provisioning review', since: daysAgo(18).slice(0, 10) } }),
  mk({ type: 'meeting', title: 'Project Atlas kickoff with product leadership', status: 'summarized', ownerId: 'alex', extra: { date: daysAgo(24).slice(0, 10), time: '10:00 AM', attendees: ['Alex', 'Sam', 'Priya', 'Jordan'], purpose: 'Align on beta scope, environment needs, and success measures.' }, bodyText: 'Agreed to a single-segment beta. Priya to sponsor access requests. Success = activation rate + user satisfaction. Next check-in in 4 weeks.' }),
  mk({ type: 'question', title: 'Which activation metric does product leadership already track?', status: 'open', ownerId: 'sam' }),
  mk({ type: 'idea', title: 'Auto-suggest templates based on recent user activity', status: 'backlog', ownerId: 'alex' }),
  mk({ type: 'research', title: 'State management approach: comparison of options', status: 'in_progress', ownerId: 'alex', bodyText: 'Early result: a lightweight store fits the app better than a full framework for our current scale.' }),
];

const byKey = (t: string, n: number) => items.find((i) => i.ident === `${IDENT_PREFIX[t as ItemType]}-${n}`)!;
const links: ItemLink[] = [
  { id: uid(), fromId: byKey('task', 2).id, toId: byKey('feature', 2).id, kind: 'implements', createdAt: daysAgo(9), createdBy: 'alex' },
  { id: uid(), fromId: byKey('requirement', 1).id, toId: byKey('feature', 1).id, kind: 'supports', createdAt: daysAgo(9), createdBy: 'alex' },
  { id: uid(), fromId: byKey('feature', 1).id, toId: byKey('decision', 1).id, kind: 'shaped_by', createdAt: daysAgo(8), createdBy: 'sam' },
  { id: uid(), fromId: byKey('feature', 1).id, toId: byKey('access', 2).id, kind: 'requires_access', createdAt: daysAgo(8), createdBy: 'sam' },
  { id: uid(), fromId: byKey('blocker', 1).id, toId: byKey('feature', 1).id, kind: 'blocks', createdAt: daysAgo(8), createdBy: 'sam' },
  { id: uid(), fromId: byKey('decision', 2).id, toId: byKey('meeting', 1).id, kind: 'discussed_in', createdAt: daysAgo(7), createdBy: 'alex' },
];

const comments: Comment[] = [
  { id: uid(), itemId: byKey('feature', 1).id, authorId: 'sam', body: '', bodyText: 'The end-to-end test harness is nearly ready — we can baseline the flow as soon as it lands.', createdAt: daysAgo(2), updatedAt: null, deleted: 0 },
  { id: uid(), itemId: byKey('feature', 1).id, authorId: 'alex', body: '', bodyText: 'The confirmation requirement (REQ-1) shapes the dialog copy — see the decision record.', createdAt: daysAgo(1), updatedAt: null, deleted: 0 },
];

const activity: ActivityEntry[] = [
  { id: uid(), itemId: byKey('task', 2).id, actorId: 'alex', kind: 'updated', field: 'status', oldValue: 'todo', newValue: 'in_progress', at: daysAgo(0.2) },
  { id: uid(), itemId: byKey('access', 2).id, actorId: 'sam', kind: 'updated', field: 'status', oldValue: 'requested', newValue: 'under_review', at: daysAgo(0.6) },
  { id: uid(), itemId: byKey('feature', 1).id, actorId: 'sam', kind: 'comment', field: null, oldValue: null, newValue: 'The end-to-end test harness is nearly ready…', at: daysAgo(1) },
  { id: uid(), itemId: byKey('task', 1).id, actorId: 'alex', kind: 'updated', field: 'status', oldValue: 'in_review', newValue: 'done', at: daysAgo(3) },
  { id: uid(), itemId: byKey('decision', 1).id, actorId: 'sam', kind: 'updated', field: 'status', oldValue: 'discussing', newValue: 'approved', at: daysAgo(4) },
  { id: uid(), itemId: byKey('meeting', 1).id, actorId: 'alex', kind: 'created', field: null, oldValue: null, newValue: 'Project Atlas kickoff with product leadership', at: daysAgo(24) },
];

const conflicts: SyncConflict[] = [
  {
    id: uid(), entity: 'item', entityId: byKey('requirement', 2).id, field: 'title',
    localValue: 'User data must be encrypted at rest',
    remoteValue: 'All user data must be encrypted at rest and in transit',
    remoteDevice: 'sam-device', remoteActor: 'sam', detectedAt: daysAgo(0.1), resolvedAt: null, resolution: null,
  },
];

const versions: ItemVersion[] = [];
const savedViews: SavedView[] = [];
let mockDensity: 'compact' | 'comfortable' = 'compact';
let mockCheckboxShape: 'square' | 'circle' | 'hexagon' = 'circle';
let mockProjectName = 'Project Atlas';
let mockViewPrefs: import('@shared/types').ViewPrefs = {};
let mockLocalApiEnabled = false;
let mockLocalApiPort = 8787;
let mockLocalApiAllowWrites = false;
let mockAutoBackup = true;
let mockBackupIntervalMin = 15;
let mockBackupRetention = 20;
const mockBackups: { name: string; size: number; mtime: string }[] = [
  { name: `tether-${daysAgo(0.02).replace(/[:.]/g, '-')}.db`, size: 393216, mtime: daysAgo(0.02) },
  { name: `tether-${daysAgo(1).replace(/[:.]/g, '-')}.db`, size: 385024, mtime: daysAgo(1) },
];
let mockUpdateCb: ((info: { version: string; current: string }) => void) | null = null;
let mockToken = {
  token: 'preview0000token0000not0000real0000abcd0000ef12',
  path: '(browser preview) local-api-token.txt',
};
const listeners = new Set<(w: { entity: string; entityId: string }) => void>();
const emit = () => listeners.forEach((l) => l({ entity: '*', entityId: '*' }));

const syncStatus: SyncStatus = {
  state: 'idle',
  folder: 'C:\\Users\\arivera\\OneDrive\\Tether-Shared',
  lastSyncAt: daysAgo(0.001),
  lastError: null,
  pendingOps: 0,
  openConflicts: conflicts.filter((c) => !c.resolvedAt).length,
  peers: [{ deviceId: 'sam-device', userName: 'Sam Chen', lastSeenAt: daysAgo(0.01) }],
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
      backup: async () => {
        const name = `tether-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
        mockBackups.unshift({ name, size: 262144 + Math.floor(Math.random() * 131072), mtime: now() });
        return `(browser preview) backups/${name}`;
      },
      backupsList: async () => mockBackups,
      backupsRestore: async () => ({ restartRequired: true as const }),
      localApiToken: async () => mockToken,
      localApiRotateToken: async () => {
        mockToken = { ...mockToken, token: 'preview' + Math.random().toString(16).slice(2).padEnd(40, '0') };
        return mockToken;
      },
      checkUpdate: async () => {
        // browser preview: simulate an available update so the banner can be seen
        setTimeout(() => mockUpdateCb?.({ version: '0.1.2', current: '0.1.0-browser-preview' }), 50);
        return { status: 'update-available' as const, version: '0.1.2' };
      },
      installUpdate: async () => ({ ok: true }),
      onUpdateAvailable: (cb: (info: { version: string; current: string }) => void) => {
        mockUpdateCb = cb;
        return () => { mockUpdateCb = null; };
      },
    },
    settings: {
      get: async () => ({
        currentUser: { id: 'alex', name: 'Alex Rivera', initials: 'AR', color: '#6E8BFF' },
        syncFolder: syncStatus.folder,
        density: mockDensity,
        checkboxShape: mockCheckboxShape,
        projectName: mockProjectName,
        seedLoaded: true,
        viewPrefs: mockViewPrefs,
        localApiEnabled: mockLocalApiEnabled,
        localApiPort: mockLocalApiPort,
        localApiAllowWrites: mockLocalApiAllowWrites,
        autoBackup: mockAutoBackup,
        backupIntervalMin: mockBackupIntervalMin,
        backupRetention: mockBackupRetention,
      }),
      set: async (patch: {
        density?: 'compact' | 'comfortable';
        checkboxShape?: 'square' | 'circle' | 'hexagon';
        projectName?: string;
        viewPrefs?: import('@shared/types').ViewPrefs;
        localApiEnabled?: boolean;
        localApiPort?: number;
        localApiAllowWrites?: boolean;
        autoBackup?: boolean;
        backupIntervalMin?: number;
        backupRetention?: number;
      }) => {
        if (patch.density) mockDensity = patch.density;
        if (patch.checkboxShape) mockCheckboxShape = patch.checkboxShape;
        if (patch.projectName !== undefined) mockProjectName = patch.projectName;
        if (patch.viewPrefs !== undefined) mockViewPrefs = patch.viewPrefs;
        if (patch.localApiEnabled !== undefined) mockLocalApiEnabled = patch.localApiEnabled;
        if (patch.localApiPort !== undefined) mockLocalApiPort = patch.localApiPort;
        if (patch.localApiAllowWrites !== undefined) mockLocalApiAllowWrites = patch.localApiAllowWrites;
        if (patch.autoBackup !== undefined) mockAutoBackup = patch.autoBackup;
        if (patch.backupIntervalMin !== undefined) mockBackupIntervalMin = patch.backupIntervalMin;
        if (patch.backupRetention !== undefined) mockBackupRetention = patch.backupRetention;
        return bridge.settings.get();
      },
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
        activity.unshift({ id: uid(), itemId: item.id, actorId: 'alex', kind: 'created', field: null, oldValue: null, newValue: item.title, at: now() });
        emit();
        return item;
      },
      update: async (id: string, fields: Partial<WorkItem>) => {
        const item = items.find((i) => i.id === id);
        if (!item) return null;
        Object.assign(item, fields, { updatedAt: now(), updatedBy: 'alex' });
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
        const link: ItemLink = { id: uid(), fromId, toId, kind, createdAt: now(), createdBy: 'alex' };
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
        const c: Comment = { id: uid(), itemId, authorId: 'alex', body, bodyText, createdAt: now(), updatedAt: null, deleted: 0 };
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
        if (item) versions.push({ id: uid(), itemId, version: versions.filter((v) => v.itemId === itemId).length + 1, title: item.title, body: item.body, savedBy: 'alex', savedAt: now() });
      },
      for: async (itemId: string) => versions.filter((v) => v.itemId === itemId).reverse(),
    },
    activity: {
      for: async (itemId: string | null, limit = 100) =>
        (itemId ? activity.filter((a) => a.itemId === itemId) : activity).slice(0, limit),
    },
    users: {
      list: async () => users,
      upsert: async (u: { id: string; name: string; initials: string; color: string }) => {
        const existing = users.find((x) => x.id === u.id);
        if (existing) Object.assign(existing, u);
        else users.push({ ...u, avatar: null, createdAt: now() });
        return users.find((x) => x.id === u.id)!;
      },
      setAvatar: async (id: string, avatar: string | null) => {
        const u = users.find((x) => x.id === id);
        if (u) u.avatar = avatar;
        return u ?? null;
      },
      delete: async (id: string) => {
        const i = users.findIndex((x) => x.id === id);
        if (i >= 0) users.splice(i, 1);
        return users;
      },
    },
    milestones: { list: async () => milestones, upsert: async (m: Milestone) => m },
    releases: { list: async () => releases, upsert: async (r: Release) => r },
    views: {
      list: async () => savedViews,
      save: async (v: SavedView) => {
        savedViews.push({ ...v, id: v.id ?? uid(), createdBy: 'alex', createdAt: now(), pinned: v.pinned ?? 0 });
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
      pdf: async (_defaultName: string, html: string) => {
        // Browser preview: open the document and hand off to the browser's print-to-PDF.
        const w = window.open('', '_blank');
        if (!w) return null;
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 600);
        return '(browser preview — use the print dialog to save as PDF)';
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
