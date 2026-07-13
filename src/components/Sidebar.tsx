import { useEffect, useState } from 'react';
import {
  LayoutDashboard, ListTodo, KanbanSquare, Map, KeyRound, Scale, CalendarDays,
  AlertTriangle, FileBarChart, History, GitMerge, Settings, Plus,
} from 'lucide-react';
import { useApp, userById } from '../store';
import { api } from '../api';
import { Avatar } from './ui';
import TetherMark from './TetherMark';
import type { Route } from '../store';

const NAV: { section: string; entries: { label: string; icon: typeof LayoutDashboard; route: Route }[] }[] = [
  {
    section: 'Project',
    entries: [
      { label: 'Dashboard', icon: LayoutDashboard, route: { view: 'dashboard' } },
      { label: 'All Work', icon: ListTodo, route: { view: 'items', title: 'All Work' } },
      { label: 'Board', icon: KanbanSquare, route: { view: 'board' } },
      { label: 'Roadmap', icon: Map, route: { view: 'roadmap' } },
    ],
  },
  {
    section: 'Records',
    entries: [
      { label: 'Access Tracker', icon: KeyRound, route: { view: 'access' } },
      { label: 'Decisions', icon: Scale, route: { view: 'decisions' } },
      { label: 'Meetings', icon: CalendarDays, route: { view: 'meetings' } },
      { label: 'Risks & Blockers', icon: AlertTriangle, route: { view: 'risks' } },
    ],
  },
  {
    section: 'Insight',
    entries: [
      { label: 'Reports', icon: FileBarChart, route: { view: 'reports' } },
      { label: 'Activity', icon: History, route: { view: 'activity' } },
    ],
  },
];

export default function Sidebar() {
  const { route, navigate, settings, syncStatus, setCreate } = useApp();
  const dataTick = useApp((s) => s.dataTick);
  const [conflictCount, setConflictCount] = useState(0);

  useEffect(() => {
    void api.conflicts.list(true).then((c) => setConflictCount(c.length));
  }, [dataTick, syncStatus?.openConflicts]);

  const users = useApp((s) => s.users);
  const identity = settings?.currentUser;
  // Prefer the DB user (carries the avatar) over the settings identity (which does not).
  const user = identity ? userById(users, identity.id) ?? { ...identity, createdAt: '' } : null;

  const isActive = (r: Route) =>
    r.view === route.view && (r.view !== 'items' || (route.view === 'items' && route.title === (r as { title?: string }).title));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo"><TetherMark size={16} /></div>
        <div>
          <div className="name">Tether</div>
          <div className="sub">Project Workspace</div>
        </div>
      </div>

      <div style={{ padding: '2px 12px 0' }}>
        <button className="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCreate(true)}>
          <Plus size={14} /> New item
          <kbd style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.16)', border: 'none', color: '#fff' }}>C</kbd>
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((sec) => (
          <div className="nav-section" key={sec.section}>
            <div className="nav-section-label">{sec.section}</div>
            {sec.entries.map((e) => (
              <button key={e.label} className={`nav-item ${isActive(e.route) ? 'active' : ''}`} onClick={() => navigate(e.route)}>
                <e.icon size={15} />
                {e.label}
              </button>
            ))}
          </div>
        ))}
        <div className="nav-section">
          <div className="nav-section-label">System</div>
          <button className={`nav-item ${route.view === 'conflicts' ? 'active' : ''}`} onClick={() => navigate({ view: 'conflicts' })}>
            <GitMerge size={15} />
            Conflicts
            {conflictCount > 0 && <span className="warn-count">{conflictCount}</span>}
          </button>
          <button className={`nav-item ${route.view === 'settings' ? 'active' : ''}`} onClick={() => navigate({ view: 'settings' })}>
            <Settings size={15} />
            Settings
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <Avatar user={user} size="lg" />
        <div className="who">
          <div className="n">{user?.name ?? 'Not set'}</div>
          <div className="r">{syncStatus?.folder ? 'Shared project' : 'Local only'}</div>
        </div>
      </div>
    </aside>
  );
}
