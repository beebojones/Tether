// Item detail: title/body editing, type-specific fields, right rail properties,
// links, comments, attachments, activity, versions.
// Body uses a debounced plain editor v1 — replaced by the rich editor module (in progress).
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Archive, ArchiveRestore, Trash2, Link2, Paperclip, MessageSquare, History, X, ExternalLink, Plus,
} from 'lucide-react';
import type { WorkItem, Comment, Attachment, LinkKind, Priority, ItemVersion, ActivityEntry } from '@shared/types';
import { TYPE_LABEL, statusesForType, STATUS_LABEL, PRIORITIES, LINK_KINDS, LINK_LABEL } from '@shared/types';
import { api, type LinkedItem } from '../api';
import { useApp, userById } from '../store';
import { TypeIcon, StatusBadge, PriorityMark, Avatar, Modal, fmtDateTime, fmtDate } from '../components/ui';
import ExtraFields from '../components/ExtraFields';
import RichEditor from '../editor/RichEditor';
import ConvertSelection from '../components/ConvertSelection';
import './item-detail.css';

export default function ItemDetail({ id }: { id: string }) {
  const { users, milestones, releases, openItem, back, settings } = useApp();
  const dataTick = useApp((s) => s.dataTick);
  const [item, setItem] = useState<WorkItem | null>(null);
  const [links, setLinks] = useState<LinkedItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [versions, setVersions] = useState<ItemVersion[]>([]);
  const [tab, setTab] = useState<'comments' | 'activity' | 'versions'>('comments');
  const [showLink, setShowLink] = useState(false);
  const [selectionText, setSelectionText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const reload = useCallback(async () => {
    const it = await api.items.get(id);
    if (!it) {
      setNotFound(true);
      return;
    }
    setItem(it);
    const [l, c, a, act, v] = await Promise.all([
      api.links.for(id), api.comments.for(id), api.attachments.for(id), api.activity.for(id, 50), api.versions.for(id),
    ]);
    setLinks(l);
    setComments(c);
    setAttachments(a);
    setActivity(act);
    setVersions(v);
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload, dataTick]);

  if (notFound) {
    return (
      <div className="view-pad">
        <div className="empty-state"><div className="big">Item not found</div>It may have been deleted on another device.</div>
      </div>
    );
  }
  if (!item) return <div className="view-pad muted">Loading…</div>;

  const update = (fields: Partial<WorkItem>) => void api.items.update(id, fields).then(() => reload());
  const statuses = statusesForType(item.type);

  return (
    <div className="detail">
      <div className="detail-main">
        <div className="detail-head">
          <TypeIcon type={item.type} size={16} />
          <span className="ident" style={{ fontSize: 'var(--fs-sm)' }}>{item.ident}</span>
          <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{TYPE_LABEL[item.type]}</span>
          {item.sample === 1 && <span className="sample-badge">SAMPLE</span>}
          {item.archived === 1 && <span className="badge" style={{ color: 'var(--warning)', background: 'var(--warning-soft)' }}>Archived</span>}
          <span style={{ flex: 1 }} />
          <button className="ghost" title="Save version snapshot" onClick={() => void api.versions.save(id).then(reload)}>
            <History size={14} /> Snapshot
          </button>
          <button className="ghost" title={item.archived ? 'Restore' : 'Archive'}
            onClick={() => void api.items.archive(id, item.archived === 0).then(reload)}>
            {item.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          </button>
          <button className="ghost" title="Delete" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} />
          </button>
        </div>

        <TitleEditor key={item.id + item.updatedAt + ':t'} value={item.title} onSave={(title) => title.trim() && update({ title: title.trim() })} />

        <RichEditor
          key={item.id + ':b'}
          content={item.body}
          onSave={async (body, bodyText) => { await api.items.update(item.id, { body, bodyText }); }}
          onSelectionText={setSelectionText}
        />
        {selectionText.trim().length > 3 && (
          <ConvertSelection sourceItem={item} text={selectionText} onConverted={() => { setSelectionText(''); void reload(); }} />
        )}

        <ExtraFields item={item} onSave={(extra) => update({ extra })} />

        {/* Links */}
        <section className="detail-section">
          <div className="detail-section-head">
            <Link2 size={14} /> Linked items
            <span style={{ flex: 1 }} />
            <button className="ghost" onClick={() => setShowLink(true)}><Plus size={13} /> Link</button>
          </div>
          {links.length === 0 && <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>No links yet. Connect this to related work, decisions, or access needs.</div>}
          {links.map(({ link, direction, other }) => (
            <div key={link.id} className="link-row" onClick={() => openItem(other.id)} role="button" tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openItem(other.id)}>
              <span className="link-kind">{LINK_LABEL[link.kind][direction === 'out' ? 0 : 1]}</span>
              <TypeIcon type={other.type} size={13} />
              <span className="ident">{other.ident}</span>
              <span className="item-title">{other.title}</span>
              <StatusBadge status={other.status} />
              <button className="ghost" title="Remove link" onClick={(e) => { e.stopPropagation(); void api.links.remove(link.id).then(reload); }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </section>

        {/* Attachments */}
        <section className="detail-section">
          <div className="detail-section-head">
            <Paperclip size={14} /> Attachments
            <span style={{ flex: 1 }} />
            <button className="ghost" onClick={() => void api.attachments.pick(id).then(reload)}><Plus size={13} /> Add files</button>
          </div>
          {attachments.map((a) => (
            <div key={a.id} className="link-row" onClick={() => void api.attachments.open(a.id).catch((e) => alert(e.message))}
              role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && void api.attachments.open(a.id)}>
              <ExternalLink size={13} style={{ color: 'var(--text-muted)' }} />
              <span className="item-title">{a.filename}</span>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{fmtSize(a.size)} · {userById(users, a.uploadedBy)?.name ?? a.uploadedBy} · {fmtDate(a.createdAt)}</span>
              <button className="ghost" title="Remove" onClick={(e) => { e.stopPropagation(); void api.attachments.remove(a.id).then(reload); }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </section>

        {/* Tabs: comments / activity / versions */}
        <section className="detail-section">
          <div className="detail-tabs">
            <button className={tab === 'comments' ? 'active' : ''} onClick={() => setTab('comments')}>
              <MessageSquare size={13} /> Comments {comments.length > 0 && <span className="muted">{comments.length}</span>}
            </button>
            <button className={tab === 'activity' ? 'active' : ''} onClick={() => setTab('activity')}>
              <History size={13} /> Activity
            </button>
            <button className={tab === 'versions' ? 'active' : ''} onClick={() => setTab('versions')}>
              Versions {versions.length > 0 && <span className="muted">{versions.length}</span>}
            </button>
          </div>
          {tab === 'comments' && <Comments itemId={id} comments={comments} onChanged={reload} />}
          {tab === 'activity' && <ActivityList entries={activity} />}
          {tab === 'versions' && <VersionList versions={versions} current={item} onRestore={(v) => update({ title: v.title, body: v.body })} />}
        </section>
      </div>

      {/* Right rail */}
      <aside className="detail-rail">
        <RailField label="Status">
          <select value={item.status} onChange={(e) => update({ status: e.target.value })} aria-label="Status">
            {statuses.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
          </select>
        </RailField>
        <RailField label="Priority">
          <select value={item.priority} onChange={(e) => update({ priority: e.target.value as Priority })} aria-label="Priority">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
          </select>
        </RailField>
        <RailField label="Owner">
          <select value={item.ownerId ?? ''} onChange={(e) => update({ ownerId: e.target.value || null })} aria-label="Owner">
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </RailField>
        <RailField label="Milestone">
          <select value={item.milestoneId ?? ''} onChange={(e) => update({ milestoneId: e.target.value || null })} aria-label="Milestone">
            <option value="">None</option>
            {milestones.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </RailField>
        <RailField label="Release">
          <select value={item.releaseId ?? ''} onChange={(e) => update({ releaseId: e.target.value || null })} aria-label="Release">
            <option value="">None</option>
            {releases.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </RailField>
        <RailField label="Start date">
          <input type="date" value={item.startDate ?? ''} onChange={(e) => update({ startDate: e.target.value || null })} aria-label="Start date" />
        </RailField>
        <RailField label="Due date">
          <input type="date" value={item.dueDate ?? ''} onChange={(e) => update({ dueDate: e.target.value || null })} aria-label="Due date" />
        </RailField>
        <RailField label="Tags">
          <TagEditor tags={item.tags} onChange={(tags) => update({ tags })} />
        </RailField>
        <RailField label="Leadership visible">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
            <input type="checkbox" checked={item.leadershipVisible === 1}
              onChange={(e) => update({ leadershipVisible: e.target.checked ? 1 : 0 })} />
            Include in leadership reports
          </label>
        </RailField>
        <div className="rail-meta">
          <div>Created {fmtDateTime(item.createdAt)} by {userById(users, item.createdBy)?.name ?? item.createdBy}</div>
          <div>Updated {fmtDateTime(item.updatedAt)} by {userById(users, item.updatedBy)?.name ?? item.updatedBy}</div>
          {item.completedAt && <div>Completed {fmtDateTime(item.completedAt)}</div>}
        </div>
      </aside>

      {showLink && <LinkDialog itemId={id} onClose={() => { setShowLink(false); void reload(); }} />}
      {confirmDelete && (
        <Modal
          title="Delete this item?"
          onClose={() => setConfirmDelete(false)}
          footer={
            <>
              <button className="ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="danger" onClick={() => { void api.items.delete(id); back(); }}>Delete {item.ident}</button>
            </>
          }
        >
          <p style={{ fontSize: 'var(--fs-sm)' }}>
            <strong>{item.ident} — {item.title}</strong> will be removed from all views and lists.
            Its history remains in the change log. Consider archiving instead if you may need it later.
          </p>
        </Modal>
      )}
    </div>
  );
}

function RailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rail-field">
      <div className="rail-label">{label}</div>
      {children}
    </div>
  );
}

function TitleEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <input
      className="detail-title"
      type="text"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onSave(v)}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      aria-label="Title"
    />
  );
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: tags.length ? 6 : 0 }}>
        {tags.map((t) => (
          <span key={t} className="badge" style={{ color: 'var(--text-secondary)', background: 'var(--bg-raised)' }}>
            {t}
            <button className="ghost" style={{ padding: 0 }} onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        placeholder="Add tag…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && input.trim() && !tags.includes(input.trim())) {
            onChange([...tags, input.trim()]);
            setInput('');
          }
        }}
        style={{ width: '100%' }}
        aria-label="Add tag"
      />
    </div>
  );
}

function Comments({ itemId, comments, onChanged }: { itemId: string; comments: Comment[]; onChanged: () => void }) {
  const users = useApp((s) => s.users);
  const [text, setText] = useState('');
  const submit = async () => {
    if (!text.trim()) return;
    const body = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });
    await api.comments.add(itemId, body, text);
    setText('');
    onChanged();
  };
  return (
    <div>
      {comments.map((c) => (
        <div key={c.id} className="comment">
          <Avatar user={userById(users, c.authorId)} />
          <div style={{ flex: 1 }}>
            <div className="comment-head">
              <strong>{userById(users, c.authorId)?.name ?? c.authorId}</strong>
              <span className="muted">{fmtDateTime(c.createdAt)}{c.updatedAt ? ' (edited)' : ''}</span>
              <span style={{ flex: 1 }} />
              <button className="ghost" title="Delete comment" onClick={() => void api.comments.delete(c.id).then(onChanged)}>
                <X size={11} />
              </button>
            </div>
            <div className="comment-body">{c.bodyText}</div>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <textarea
          value={text}
          placeholder="Write a comment… (Ctrl+Enter to post)"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && void submit()}
          rows={2}
          style={{ flex: 1 }}
          aria-label="Comment"
        />
        <button className="primary" onClick={() => void submit()} disabled={!text.trim()}>Post</button>
      </div>
    </div>
  );
}

function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  const users = useApp((s) => s.users);
  return (
    <div>
      {entries.length === 0 && <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>No activity recorded.</div>}
      {entries.map((a) => (
        <div key={a.id} className="activity-row">
          <span className="muted" style={{ fontSize: 'var(--fs-xs)', whiteSpace: 'nowrap' }}>{fmtDateTime(a.at)}</span>
          <span style={{ fontSize: 'var(--fs-sm)' }}>{describeActivity(a, users)}</span>
        </div>
      ))}
    </div>
  );
}

export function describeActivity(a: ActivityEntry, users: { id: string; name: string }[]): string {
  const who = users.find((u) => u.id === a.actorId)?.name ?? a.actorId;
  switch (a.kind) {
    case 'created': return `${who} created this item`;
    case 'edited': return `${who} edited the description`;
    case 'updated': return `${who} changed ${a.field} ${a.oldValue ? `from "${trunc(a.oldValue)}" ` : ''}to "${trunc(a.newValue ?? '')}"`;
    case 'comment': return `${who} commented: "${trunc(a.newValue ?? '')}"`;
    case 'link': return `${who} added a "${a.field}" link`;
    case 'unlink': return `${who} removed a "${a.field}" link`;
    case 'archived': return `${who} archived this item`;
    case 'restored': return `${who} restored this item`;
    case 'deleted': return `${who} deleted this item`;
    case 'renumbered': return `Item renumbered from ${a.oldValue} to ${a.newValue} after a sync collision`;
    default: return `${who} — ${a.kind}`;
  }
}

function trunc(s: string, n = 60): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function VersionList({ versions, current, onRestore }: { versions: ItemVersion[]; current: WorkItem; onRestore: (v: ItemVersion) => void }) {
  const users = useApp((s) => s.users);
  const [preview, setPreview] = useState<ItemVersion | null>(null);
  return (
    <div>
      {versions.length === 0 && (
        <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          No snapshots yet. Use “Snapshot” in the header to save a restorable version of the title and description.
        </div>
      )}
      {versions.map((v) => (
        <div key={v.id} className="activity-row">
          <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>v{v.version}</span>
          <span style={{ fontSize: 'var(--fs-sm)', flex: 1 }}>{v.title}</span>
          <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
            {userById(users, v.savedBy)?.name ?? v.savedBy} · {fmtDateTime(v.savedAt)}
          </span>
          <button className="ghost" onClick={() => setPreview(v)}>Compare</button>
          <button className="ghost" onClick={() => onRestore(v)}>Restore</button>
        </div>
      ))}
      {preview && (
        <Modal title={`Version ${preview.version} vs current`} onClose={() => setPreview(null)} width={760}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div className="rail-label">Version {preview.version}</div>
              <div className="version-pane">{preview.title}{'\n\n'}{docToText(preview.body)}</div>
            </div>
            <div>
              <div className="rail-label">Current</div>
              <div className="version-pane">{current.title}{'\n\n'}{current.bodyText}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function docToText(body: string): string {
  if (!body) return '';
  try {
    const doc = JSON.parse(body) as { content?: unknown[] };
    const walk = (nodes: unknown[]): string =>
      nodes
        .map((n) => {
          const node = n as { type?: string; text?: string; content?: unknown[] };
          if (node.text) return node.text;
          const inner = node.content ? walk(node.content) : '';
          return node.type === 'paragraph' || node.type?.startsWith('heading') ? inner + '\n\n' : inner;
        })
        .join('');
    return walk(doc.content ?? []).trim();
  } catch {
    return body;
  }
}

function LinkDialog({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WorkItem[]>([]);
  const [kind, setKind] = useState<LinkKind>('relates');

  useEffect(() => {
    const t = setTimeout(() => {
      void api.items.search(query, 10).then((rs) => setResults(rs.map((r) => r.item).filter((i) => i.id !== itemId)));
    }, 150);
    return () => clearTimeout(t);
  }, [query, itemId]);

  return (
    <Modal title="Link to another item" onClose={onClose}>
      <div className="form-row">
        <label htmlFor="lk-kind">Relationship</label>
        <select id="lk-kind" value={kind} onChange={(e) => setKind(e.target.value as LinkKind)}>
          {LINK_KINDS.filter((k) => k !== 'parent').map((k) => (
            <option key={k} value={k}>{LINK_LABEL[k][0]}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="lk-q">Find item</label>
        <input id="lk-q" type="text" autoFocus placeholder="Search by title or ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div>
        {results.map((r) => (
          <div key={r.id} className="link-row" onClick={() => void api.links.add(itemId, r.id, kind).then(onClose)} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && void api.links.add(itemId, r.id, kind).then(onClose)}>
            <TypeIcon type={r.type} size={13} />
            <span className="ident">{r.ident}</span>
            <span className="item-title">{r.title}</span>
            <StatusBadge status={r.status} />
          </div>
        ))}
        {query.trim().length >= 2 && results.length === 0 && <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>No matches.</div>}
      </div>
    </Modal>
  );
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
