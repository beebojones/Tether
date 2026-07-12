// Sample Support AI project data. Every record carries sample=1 and a [SAMPLE] title
// marker convention is NOT used — the sample flag drives badges + one-click removal.
// No real McKesson data: names of systems are generic, contents are illustrative.

import type { Store } from './store';
import type { ItemType, Priority } from '../../shared/types';

interface SeedItem {
  type: ItemType;
  title: string;
  bodyText?: string;
  status?: string;
  priority?: Priority;
  owner?: 'john' | 'mark' | null;
  dueDate?: string;
  tags?: string[];
  extra?: Record<string, unknown>;
  milestone?: string;
  leadershipVisible?: boolean;
}

export function loadSeedData(store: Store): number {
  // Probe directly (listItems hides archived rows — archived samples must still block a reload).
  const existing = store.db.prepare('SELECT 1 FROM items WHERE sample=1 AND deleted=0 LIMIT 1').get();
  if (existing) return 0; // already loaded

  const m1 = store.upsertMilestone({ name: 'Discovery & Access', targetDate: '2026-08-15', status: 'active', sort: 1, sample: 1, description: 'Secure system access, inventory knowledge sources, confirm scope with leadership.' });
  const m2 = store.upsertMilestone({ name: 'Knowledge Pipeline MVP', targetDate: '2026-10-01', status: 'planned', sort: 2, sample: 1, description: 'Ingest, clean, and index the first knowledge domain end to end.' });
  const m3 = store.upsertMilestone({ name: 'Pilot with Support Team', targetDate: '2026-12-01', status: 'planned', sort: 3, sample: 1, description: 'Limited pilot: measure deflection, accuracy, and agent satisfaction.' });
  store.upsertRelease({ name: 'Support AI Pilot 0.1', version: '0.1', targetDate: '2026-11-15', status: 'planned', goals: 'First internal pilot build: single knowledge domain, 10 support agents, feedback loop in place.', sample: 1 });

  const milestoneId: Record<string, string> = { m1: m1.id, m2: m2.id, m3: m3.id };

  const items: (SeedItem & { key: string })[] = [
    // Features
    { key: 'featAnswer', type: 'feature', title: 'AI answer generation over knowledge base', status: 'in_progress', priority: 'high', owner: 'john', milestone: 'm2', leadershipVisible: true, bodyText: 'Core capability: given a support question, retrieve relevant knowledge articles and generate a grounded, cited answer.' },
    { key: 'featIngest', type: 'feature', title: 'Knowledge ingestion pipeline (Salesforce KA export)', status: 'in_progress', priority: 'urgent', owner: 'john', milestone: 'm2', leadershipVisible: true, bodyText: 'Export knowledge articles, normalize to clean text, chunk, and index for retrieval.' },
    { key: 'featFeedback', type: 'feature', title: 'Agent feedback capture (thumbs + reason codes)', status: 'backlog', priority: 'medium', owner: 'mark', milestone: 'm3', bodyText: 'Pilot agents rate each AI answer; reasons feed the quality dashboard.' },

    // Requirements
    { key: 'reqCitations', type: 'requirement', title: 'Every AI answer must cite its source articles', status: 'todo', priority: 'high', owner: 'john', milestone: 'm2', extra: { acceptanceCriteria: 'Answer UI shows at least one source link per answer; uncited answers are suppressed.', securityConsiderations: 'Citations must not expose restricted articles to unauthorized agents.' } },
    { key: 'reqPHI', type: 'requirement', title: 'No PHI or customer data may leave approved systems', status: 'in_progress', priority: 'urgent', owner: 'mark', leadershipVisible: true, extra: { acceptanceCriteria: 'Data flow diagram approved by security; DLP scan of pipeline output shows zero PHI.', securityConsiderations: 'Blocking requirement for any external AI service.' } },
    { key: 'reqFreshness', type: 'requirement', title: 'Knowledge index refreshes within 24h of article updates', status: 'backlog', priority: 'medium', owner: 'john', milestone: 'm2', extra: { acceptanceCriteria: 'Article edited in source system appears in retrieval results within 24 hours.' } },

    // Tasks
    { key: 'taskExport', type: 'task', title: 'Build Salesforce knowledge article export script', status: 'done', priority: 'high', owner: 'john', milestone: 'm1', bodyText: 'Export all published KAs with metadata to structured files.' },
    { key: 'taskClean', type: 'task', title: 'HTML→clean text normalization for exported articles', status: 'in_progress', priority: 'high', owner: 'john', milestone: 'm2', dueDate: '2026-07-24' },
    { key: 'taskEval', type: 'task', title: 'Draft answer-quality evaluation rubric', status: 'todo', priority: 'medium', owner: 'mark', milestone: 'm2', dueDate: '2026-07-31' },
    { key: 'taskInventory', type: 'task', title: 'Inventory candidate knowledge domains and article counts', status: 'done', priority: 'medium', owner: 'john', milestone: 'm1' },

    // Access requests
    { key: 'accSfApi', type: 'access', title: 'Salesforce API access (Knowledge object, read)', status: 'requested', priority: 'urgent', owner: 'john', leadershipVisible: true, extra: { system: 'Salesforce Service Cloud', accessType: 'API read (Knowledge object)', businessReason: 'Automated export of knowledge articles for the ingestion pipeline.', requestedFrom: 'Salesforce platform team', requestDate: '2026-06-30', nextAction: 'Follow up with platform team lead', followUpDate: '2026-07-15' } },
    { key: 'accAzure', type: 'access', title: 'Azure OpenAI service provisioning in McKesson tenant', status: 'under_review', priority: 'urgent', owner: 'mark', leadershipVisible: true, extra: { system: 'Azure OpenAI (McKesson tenant)', accessType: 'Resource provisioning + API keys', businessReason: 'Approved-tenant LLM required for answer generation without data egress.', requestedFrom: 'Cloud platform / security', requestDate: '2026-06-22', nextAction: 'Security review meeting', followUpDate: '2026-07-18' } },
    { key: 'accSp', type: 'access', title: 'SharePoint site for pilot documentation', status: 'granted', priority: 'low', owner: 'mark', extra: { system: 'SharePoint Online', accessType: 'Site owner', businessReason: 'Shared documentation and pilot artifacts.', requestedFrom: 'IT service desk', requestDate: '2026-06-10', approvedBy: 'IT service desk', dateGranted: '2026-06-12' } },

    // Decisions
    { key: 'decTenant', type: 'decision', title: 'Use tenant-hosted Azure OpenAI, not public APIs', status: 'approved', priority: 'high', owner: 'mark', leadershipVisible: true, extra: { context: 'Answer generation needs an LLM. Public AI APIs are unapproved for internal data.', problem: 'Which LLM hosting path satisfies security while unblocking the pilot?', options: [{ title: 'Public API (OpenAI/Anthropic direct)', notes: 'Fast but unapproved for internal data', selected: false }, { title: 'Azure OpenAI in McKesson tenant', notes: 'Data stays in tenant; procurement + provisioning required', selected: true }, { title: 'Local open-weights model', notes: 'No egress but weaker quality and heavy infra', selected: false }], reasoning: 'Tenant hosting keeps data inside approved boundary and has an existing enterprise agreement path.', tradeoffs: 'Slower start; capacity quotas; model availability lags public APIs.' } },
    { key: 'decDomain', type: 'decision', title: 'Pilot scope: start with one high-volume knowledge domain', status: 'discussing', priority: 'medium', owner: 'john', extra: { context: 'Knowledge base spans many product areas with uneven quality.', problem: 'Pilot everything or one domain first?', options: [{ title: 'Single domain pilot', notes: 'Cleaner measurement, faster iteration', selected: true }, { title: 'All domains at once', notes: 'Broader impact, diluted quality signal', selected: false }], reasoning: 'Single-domain gives a clean accuracy baseline and containable review load.' } },

    // Risks
    { key: 'riskQuality', type: 'risk', title: 'Knowledge article quality too low for grounded answers', status: 'open', priority: 'high', owner: 'john', leadershipVisible: true, extra: { likelihood: 'medium', impact: 'high', mitigation: 'Quality audit of the pilot domain before indexing; article cleanup backlog with the knowledge team.' } },
    { key: 'riskAccess', type: 'risk', title: 'Access approvals slip and stall the pipeline build', status: 'mitigating', priority: 'high', owner: 'mark', leadershipVisible: true, extra: { likelihood: 'high', impact: 'high', mitigation: 'Weekly follow-ups; leadership escalation path agreed; build pipeline against exported sample data meanwhile.' } },

    // Blockers
    { key: 'blkAzure', type: 'blocker', title: 'Cannot generate answers until Azure OpenAI is provisioned', status: 'active', priority: 'urgent', owner: 'mark', leadershipVisible: true, extra: { waitingOn: 'Cloud platform team / security review', since: '2026-06-22' } },

    // Meeting
    { key: 'mtgKickoff', type: 'meeting', title: 'Support AI kickoff with knowledge leadership', status: 'summarized', owner: 'john', extra: { date: '2026-06-18', time: '10:00 AM', attendees: ['John', 'Mark', 'Allen', 'George'], purpose: 'Align on pilot scope, access needs, and success measures.', agenda: '1. Vision  2. Pilot scope  3. Access requests  4. Timeline' }, bodyText: 'Agreed to single-domain pilot. Allen to sponsor access requests. Success = deflection rate + agent satisfaction. Next check-in in 4 weeks.' },

    // Questions / ideas / research
    { key: 'qMetrics', type: 'question', title: 'Which deflection metric does support leadership already trust?', status: 'open', owner: 'mark', extra: {} },
    { key: 'ideaTriage', type: 'idea', title: 'Auto-triage inbound cases by knowledge coverage', status: 'backlog', owner: 'john', bodyText: 'If retrieval confidence is high, suggest KB-first response before human triage.' },
    { key: 'resRag', type: 'research', title: 'Retrieval strategy comparison: hybrid vs pure vector', status: 'in_progress', owner: 'john', bodyText: 'Early result: hybrid (BM25 + vector) noticeably better on product-code queries.' },
  ];

  const created = new Map<string, string>();
  for (const s of items) {
    const item = store.createItem({
      type: s.type,
      title: s.title,
      status: s.status,
      priority: s.priority ?? 'none',
      ownerId: s.owner ?? null,
      milestoneId: s.milestone ? milestoneId[s.milestone] : null,
      dueDate: s.dueDate ?? null,
      tags: s.tags ?? [],
      extra: s.extra ?? {},
      leadershipVisible: s.leadershipVisible ? 1 : 0,
      bodyText: s.bodyText ?? '',
      body: s.bodyText ? textDoc(s.bodyText) : '',
      sample: 1,
    });
    created.set(s.key, item.id);
  }

  const link = (a: string, b: string, kind: Parameters<Store['addLink']>[2]) => {
    const fromId = created.get(a);
    const toId = created.get(b);
    if (fromId && toId) store.addLink(fromId, toId, kind);
  };

  link('taskClean', 'featIngest', 'implements');
  link('taskExport', 'featIngest', 'implements');
  link('reqCitations', 'featAnswer', 'supports');
  link('reqPHI', 'featAnswer', 'supports');
  link('reqFreshness', 'featIngest', 'supports');
  link('featAnswer', 'decTenant', 'shaped_by');
  link('featAnswer', 'accAzure', 'requires_access');
  link('featIngest', 'accSfApi', 'requires_access');
  link('blkAzure', 'featAnswer', 'blocks');
  link('decDomain', 'mtgKickoff', 'discussed_in');
  link('riskAccess', 'accAzure', 'relates');

  return items.length;
}

/** Minimal rich-doc wrapper for seed body text (one paragraph). */
function textDoc(text: string): string {
  return JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });
}
