import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/base.css';

async function boot() {
  // Browser preview: when not running under Electron, install the dev mock bridge
  // (visual QA / screenshots only — never active in the packaged app).
  if (!window.tether) {
    const { installDevMock } = await import('./devMock');
    installDevMock();

    const params = new URLSearchParams(window.location.search);
    const theme = params.get('theme');
    if (theme && /^[a-z]+$/.test(theme) && theme !== 'meridian') {
      await import(`./styles/themes/${theme}.css`);
    }
    const view = params.get('view');
    if (view) {
      const { useApp } = await import('./store');
      const unsub = useApp.subscribe((s) => {
        if (s.ready) {
          unsub();
          const routes: Record<string, object> = {
            dashboard: { view: 'dashboard' },
            items: { view: 'items', title: 'All Work' },
            board: { view: 'board' },
            roadmap: { view: 'roadmap' },
            access: { view: 'access' },
            decisions: { view: 'decisions' },
            meetings: { view: 'meetings' },
            risks: { view: 'risks' },
            reports: { view: 'reports' },
            activity: { view: 'activity' },
            conflicts: { view: 'conflicts' },
            settings: { view: 'settings' },
            present: { view: 'present' },
          };
          const target = routes[view];
          if (target) setTimeout(() => useApp.getState().navigate(target as never), 50);
          if (view === 'item') {
            // open the first feature item (rich detail for screenshots)
            setTimeout(() => {
              void window.tether.items.list({ types: ['feature'] }, { field: 'ident', dir: 'asc' }, 1).then((rows) => {
                const first = (rows as { id: string }[])[0];
                if (first) useApp.getState().openItem(first.id);
              });
            }, 80);
          }
        }
      });
    }
  }

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void boot();
