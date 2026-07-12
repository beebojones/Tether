import { useEffect } from 'react';
import { useApp } from './store';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Onboarding from './views/Onboarding';
import Dashboard from './views/Dashboard';
import ItemsView from './views/ItemsView';
import BoardView from './views/BoardView';
import ItemDetail from './views/ItemDetail';
import AccessView from './views/AccessView';
import DecisionsView from './views/DecisionsView';
import MeetingsView from './views/MeetingsView';
import RisksView from './views/RisksView';
import RoadmapView from './views/RoadmapView';
import ReportsView from './views/ReportsView';
import Presentation from './views/Presentation';
import ActivityView from './views/ActivityView';
import ConflictsView from './views/ConflictsView';
import SettingsView from './views/SettingsView';
import CommandPalette from './components/CommandPalette';
import './styles/app.css';

export default function App() {
  const { ready, settings, route, init, setPalette, paletteOpen, back } = useApp();

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(!useApp.getState().paletteOpen);
      }
      if (e.key === 'Escape' && useApp.getState().paletteOpen) setPalette(false);
      // Alt+Left = back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPalette, back]);

  if (!ready) {
    return <div className="boot">Loading Tether…</div>;
  }

  if (!settings?.currentUser) {
    return <Onboarding />;
  }

  return (
    <div className="app-frame">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content">{renderRoute(route)}</main>
      </div>
      {paletteOpen && <CommandPalette />}
    </div>
  );
}

function PresentRoute() {
  const { back } = useApp();
  return <Presentation onExit={back} />;
}

function renderRoute(route: ReturnType<typeof useApp.getState>['route']) {
  switch (route.view) {
    case 'dashboard': return <Dashboard />;
    case 'items': return <ItemsView key={route.title} types={route.types} title={route.title} />;
    case 'board': return <BoardView />;
    case 'roadmap': return <RoadmapView />;
    case 'access': return <AccessView />;
    case 'decisions': return <DecisionsView />;
    case 'meetings': return <MeetingsView />;
    case 'risks': return <RisksView />;
    case 'reports': return <ReportsView />;
    case 'present': return <PresentRoute />;
    case 'activity': return <ActivityView />;
    case 'conflicts': return <ConflictsView />;
    case 'settings': return <SettingsView />;
    case 'item': return <ItemDetail key={route.id} id={route.id} />;
  }
}
