// Shared domain types — single source of truth for main process and renderer.

// ---------- Terminology ----------
// Umbrella noun: "Work Item". Every tracked record is a work item with a type.
// Idents are per-type sequences: TASK-12, FEAT-3, REQ-41, DEC-12, RISK-8, BLK-2,
// ACC-5, MTG-14, IDEA-7, Q-3, DEF-1, RES-4.

export const ITEM_TYPES = [
  'task',
  'feature',
  'requirement',
  'story',
  'decision',
  'risk',
  'blocker',
  'access',
  'meeting',
  'idea',
  'question',
  'defect',
  'research',
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const IDENT_PREFIX: Record<ItemType, string> = {
  task: 'TASK',
  feature: 'FEAT',
  requirement: 'REQ',
  story: 'STORY',
  decision: 'DEC',
  risk: 'RISK',
  blocker: 'BLK',
  access: 'ACC',
  meeting: 'MTG',
  idea: 'IDEA',
  question: 'Q',
  defect: 'DEF',
  research: 'RES',
};

export const TYPE_LABEL: Record<ItemType, string> = {
  task: 'Task',
  feature: 'Feature',
  requirement: 'Requirement',
  story: 'User Story',
  decision: 'Decision',
  risk: 'Risk',
  blocker: 'Blocker',
  access: 'Access Request',
  meeting: 'Meeting Note',
  idea: 'Idea',
  question: 'Open Question',
  defect: 'Defect',
  research: 'Research',
};

// ---------- Statuses ----------
// Work statuses apply to executable items (task/feature/requirement/story/defect/research/idea).
export const WORK_STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'blocked',
  'done',
  'cancelled',
] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export const DECISION_STATUSES = [
  'proposed',
  'discussing',
  'approved',
  'rejected',
  'revisit',
  'superseded',
] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const ACCESS_STATUSES = [
  'identified',
  'not_requested',
  'preparing',
  'requested',
  'under_review',
  'info_needed',
  'approved',
  'partially_approved',
  'granted',
  'denied',
  'expired',
  'not_needed',
] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const RISK_STATUSES = ['open', 'mitigating', 'accepted', 'closed'] as const;
export const BLOCKER_STATUSES = ['active', 'workaround', 'resolved'] as const;
export const QUESTION_STATUSES = ['open', 'answered', 'parked'] as const;
export const MEETING_STATUSES = ['scheduled', 'held', 'summarized'] as const;

export type ItemStatus = string; // validated per-type by statusesForType()

export function statusesForType(type: ItemType): readonly string[] {
  switch (type) {
    case 'decision':
      return DECISION_STATUSES;
    case 'access':
      return ACCESS_STATUSES;
    case 'risk':
      return RISK_STATUSES;
    case 'blocker':
      return BLOCKER_STATUSES;
    case 'question':
      return QUESTION_STATUSES;
    case 'meeting':
      return MEETING_STATUSES;
    default:
      return WORK_STATUSES;
  }
}

export const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  blocked: 'Blocked',
  done: 'Done',
  cancelled: 'Cancelled',
  proposed: 'Proposed',
  discussing: 'Discussing',
  approved: 'Approved',
  rejected: 'Rejected',
  revisit: 'Revisit Later',
  superseded: 'Superseded',
  identified: 'Identified',
  not_requested: 'Not Requested',
  preparing: 'Preparing Request',
  requested: 'Requested',
  under_review: 'Under Review',
  info_needed: 'More Info Needed',
  partially_approved: 'Partially Approved',
  granted: 'Granted',
  denied: 'Denied',
  expired: 'Expired',
  not_needed: 'No Longer Needed',
  open: 'Open',
  mitigating: 'Mitigating',
  accepted: 'Accepted',
  closed: 'Closed',
  active: 'Active',
  workaround: 'Workaround In Place',
  resolved: 'Resolved',
  answered: 'Answered',
  parked: 'Parked',
  scheduled: 'Scheduled',
  held: 'Held',
  summarized: 'Summarized',
};

/** Statuses that count as "closed/terminal" for progress + dashboards. */
export const TERMINAL_STATUSES = new Set([
  'done',
  'cancelled',
  'rejected',
  'superseded',
  'granted',
  'denied',
  'expired',
  'not_needed',
  'closed',
  'resolved',
  'answered',
  'summarized',
  'accepted',
]);

export const PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'] as const;
export type Priority = (typeof PRIORITIES)[number];

// ---------- Links ----------
export const LINK_KINDS = [
  'relates', // generic bidirectional
  'blocks', // from blocks to
  'implements', // task implements requirement/feature
  'supports', // requirement supports feature
  'shaped_by', // item shaped by decision
  'requires_access', // item requires access record
  'discussed_in', // item discussed in meeting
  'validates', // test/defect validates requirement
  'supersedes', // decision supersedes decision
  'parent', // from is parent of to (also mirrored via items.parent_id)
] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export const LINK_LABEL: Record<LinkKind, [string, string]> = {
  // [label from->to, label to->from]
  relates: ['relates to', 'relates to'],
  blocks: ['blocks', 'blocked by'],
  implements: ['implements', 'implemented by'],
  supports: ['supports', 'supported by'],
  shaped_by: ['shaped by', 'shaped'],
  requires_access: ['requires access', 'required for'],
  discussed_in: ['discussed in', 'discussed'],
  validates: ['validates', 'validated by'],
  supersedes: ['supersedes', 'superseded by'],
  parent: ['parent of', 'child of'],
};

// ---------- Core records ----------
export interface WorkItem {
  id: string; // uuid — canonical identity, used by all references
  ident: string; // display id e.g. REQ-41 (may be renumbered on sync collision)
  type: ItemType;
  title: string;
  body: string; // rich doc JSON (editor document), '' when empty
  bodyText: string; // plain text projection for search
  status: string;
  priority: Priority;
  ownerId: string | null;
  reporterId: string | null;
  milestoneId: string | null;
  releaseId: string | null;
  parentId: string | null;
  startDate: string | null; // ISO date
  dueDate: string | null;
  completedAt: string | null; // ISO datetime
  effort: number | null; // points/days, unit is team convention
  confidence: 'low' | 'medium' | 'high' | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | null;
  businessValue: string | null;
  leadershipVisible: 0 | 1;
  progress: number | null; // 0-100 manual override; null = derived
  tags: string[];
  extra: Record<string, unknown>; // type-specific fields (see docs/TERMINOLOGY.md)
  archived: 0 | 1;
  sample: 0 | 1; // seeded sample data flag
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// Type-specific `extra` shapes (documented, not enforced by DB):
// access:   { system, accessType, businessReason, requestedFrom, requestDate,
//             approvedBy, dateGranted, expirationDate, renewalDate, securityNotes, nextAction, followUpDate }
// decision: { context, problem, options: [{title, notes, selected}], reasoning,
//             tradeoffs, consequences, reviewDate, contributors: string[] }
// meeting:  { date, time, attendees: string[], purpose, agenda, followUpDate }
// risk:     { likelihood, impact, mitigation, trigger }
// blocker:  { waitingOn, since, escalatedTo }
// requirement: { acceptanceCriteria, testingNotes, securityConsiderations }

export interface ItemLink {
  id: string;
  fromId: string;
  toId: string;
  kind: LinkKind;
  createdAt: string;
  createdBy: string;
}

export interface Comment {
  id: string;
  itemId: string;
  authorId: string;
  body: string; // rich doc JSON
  bodyText: string;
  createdAt: string;
  updatedAt: string | null;
  deleted: 0 | 1;
}

export interface Attachment {
  id: string;
  itemId: string;
  filename: string;
  mime: string;
  size: number;
  sha256: string;
  description: string | null;
  uploadedBy: string;
  createdAt: string;
  deleted: 0 | 1;
}

export interface ActivityEntry {
  id: string;
  itemId: string | null;
  actorId: string;
  kind: string; // created | updated | status | comment | link | attachment | archived | restored | ...
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  at: string;
}

export interface ItemVersion {
  id: string;
  itemId: string;
  version: number;
  title: string;
  body: string;
  savedBy: string;
  savedAt: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: string | null;
  status: 'planned' | 'active' | 'done';
  sort: number;
  sample: 0 | 1;
}

export interface Release {
  id: string;
  name: string;
  version: string;
  targetDate: string | null;
  status: 'planned' | 'in_progress' | 'released' | 'cancelled';
  goals: string;
  notes: string; // release notes rich doc
  sample: 0 | 1;
}

export interface User {
  id: string; // stable slug, e.g. 'john', 'mark'
  name: string;
  initials: string;
  color: string;
  createdAt: string;
}

export interface SavedView {
  id: string;
  name: string;
  config: Record<string, unknown>; // {view, filters, sort, group}
  pinned: 0 | 1;
  createdBy: string;
  createdAt: string;
}

// ---------- Sync ----------
export interface Op {
  opId: string; // uuid
  deviceId: string;
  actorId: string;
  lamport: number;
  at: string; // wall clock, informational only — ordering uses lamport
  entity: 'item' | 'link' | 'comment' | 'attachment' | 'milestone' | 'release' | 'user' | 'saved_view' | 'tagset';
  entityId: string;
  action: 'create' | 'set' | 'delete';
  // create: payload = full record. set: payload = {field: value,...}. delete: payload = {}.
  payload: Record<string, unknown>;
}

export interface SyncConflict {
  id: string;
  entity: string;
  entityId: string;
  field: string;
  localValue: string;
  remoteValue: string;
  remoteDevice: string;
  remoteActor: string;
  detectedAt: string;
  resolvedAt: string | null;
  resolution: 'local' | 'remote' | 'merged' | null;
}

export type SyncStatusState = 'disabled' | 'idle' | 'syncing' | 'offline' | 'error';
export interface SyncStatus {
  state: SyncStatusState;
  folder: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  pendingOps: number;
  openConflicts: number;
  peers: { deviceId: string; userName: string | null; lastSeenAt: string | null }[];
}

// ---------- Queries ----------
export interface ItemFilter {
  types?: ItemType[];
  statuses?: string[];
  priorities?: Priority[];
  ownerIds?: (string | null)[];
  milestoneId?: string;
  releaseId?: string;
  tag?: string;
  text?: string; // FTS query
  archived?: boolean; // default false
  overdue?: boolean;
  dueWithinDays?: number;
  leadershipVisible?: boolean;
  updatedSince?: string;
  parentId?: string;
  sample?: boolean;
}

export interface ItemSort {
  field: 'ident' | 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'manual';
  dir: 'asc' | 'desc';
}

export interface SearchResult {
  item: WorkItem;
  snippet: string | null;
  score: number;
}
