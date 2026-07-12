import { generateSnapshotHtml } from '../src/reports/snapshot';
import { generateDeckHtml } from '../src/reports/deck';
import type { WorkItem, Milestone, User } from '../shared/types';

const days = (n: number) => new Date(Date.now() + n * 864e5).toISOString();
const users: User[] = [
  { id: 'john', name: 'John Crouch', initials: 'JC', color: '#6E8BFF', createdAt: days(-30) },
  { id: 'mark', name: 'Mark', initials: 'M', color: '#4CC38A', createdAt: days(-30) },
];
const milestones: Milestone[] = [
  { id: 'm1', name: 'Discovery & Access', description: '', targetDate: days(34).slice(0, 10), status: 'active', sort: 1, sample: 1 },
  { id: 'm2', name: 'Knowledge Pipeline MVP', description: '', targetDate: days(81).slice(0, 10), status: 'planned', sort: 2, sample: 1 },
  { id: 'm3', name: 'Pilot with Support Team', description: '', targetDate: days(142).slice(0, 10), status: 'planned', sort: 3, sample: 1 },
];
let n = 0;
function mk(p: Partial<WorkItem> & { type: WorkItem['type']; title: string; status: string }): WorkItem {
  n++;
  return {
    id: 'i' + n, ident: p.ident ?? `X-${n}`, type: p.type, title: p.title, body: '', bodyText: '',
    status: p.status, priority: p.priority ?? 'medium', ownerId: p.ownerId ?? 'john', reporterId: 'john',
    milestoneId: p.milestoneId ?? null, releaseId: null, parentId: null, startDate: null,
    dueDate: p.dueDate ?? null, completedAt: p.completedAt ?? null, effort: null, confidence: null,
    riskLevel: null, businessValue: null, leadershipVisible: 1, progress: null, tags: [], extra: p.extra ?? {},
    archived: 0, sample: 1, createdAt: days(-20), updatedAt: days(0), createdBy: 'john', updatedBy: 'john',
  };
}
const items: WorkItem[] = [
  mk({ type: 'task', ident: 'TASK-1', title: 'Build Salesforce knowledge article export script', status: 'done', completedAt: days(-2), milestoneId: 'm1' }),
  mk({ type: 'task', ident: 'TASK-4', title: 'Inventory candidate knowledge domains and article counts', status: 'done', completedAt: days(-4), milestoneId: 'm1' }),
  mk({ type: 'feature', ident: 'FEAT-1', title: 'AI answer generation over knowledge base', status: 'in_progress', priority: 'high', milestoneId: 'm2' }),
  mk({ type: 'feature', ident: 'FEAT-2', title: 'Knowledge ingestion pipeline (Salesforce KA export)', status: 'in_progress', priority: 'urgent', milestoneId: 'm2' }),
  mk({ type: 'task', ident: 'TASK-2', title: 'HTML→clean text normalization for exported articles', status: 'in_progress', ownerId: 'john', dueDate: days(9).slice(0, 10), milestoneId: 'm2' }),
  mk({ type: 'task', ident: 'TASK-5', title: 'Set up retrieval evaluation harness', status: 'in_review', ownerId: 'mark', dueDate: days(6).slice(0, 10), milestoneId: 'm2' }),
  mk({ type: 'blocker', ident: 'BLK-1', title: 'Cannot generate answers until Azure OpenAI is provisioned', status: 'active', priority: 'urgent', ownerId: 'mark', extra: { waitingOn: 'Cloud platform team / security review' } }),
  mk({ type: 'access', ident: 'ACC-1', title: 'Salesforce API access (Knowledge object, read)', status: 'requested', priority: 'urgent', extra: { system: 'Salesforce Service Cloud', nextAction: 'Follow up with platform team lead' } }),
  mk({ type: 'access', ident: 'ACC-2', title: 'Azure OpenAI service provisioning in McKesson tenant', status: 'under_review', priority: 'urgent', ownerId: 'mark', extra: { system: 'Azure OpenAI (McKesson tenant)', nextAction: 'Security review meeting' } }),
  mk({ type: 'decision', ident: 'DEC-2', title: 'Pilot scope: start with one high-volume knowledge domain', status: 'discussing' }),
  mk({ type: 'risk', ident: 'RISK-1', title: 'Knowledge article quality too low for grounded answers', status: 'open', priority: 'high', extra: { mitigation: 'Quality audit of the pilot domain before indexing' } }),
  mk({ type: 'risk', ident: 'RISK-2', title: 'Access approvals slip and stall the pipeline build', status: 'mitigating', priority: 'high', ownerId: 'mark', extra: { mitigation: 'Weekly follow-ups; leadership escalation path agreed' } }),
  mk({ type: 'task', ident: 'TASK-3', title: 'Draft answer-quality evaluation rubric', status: 'todo', ownerId: 'mark', dueDate: days(3).slice(0, 10), milestoneId: 'm2' }),
];
export const html = generateSnapshotHtml({ items, milestones, users, preparedBy: 'John Crouch' });
export const deckHtml = generateDeckHtml({ items, milestones, users, preparedBy: 'John Crouch' });
