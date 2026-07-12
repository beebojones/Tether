// Ctrl+K palette: fuzzy navigation + FTS item search + quick create.
import { useEffect, useRef, useState } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import { api } from '../api';
import { useApp, type Route } from '../store';
import { TypeIcon, StatusBadge } from './ui';
import type { SearchResult, ItemType } from '@shared/types';
import { TYPE_LABEL, ITEM_TYPES } from '@shared/types';
import CreateItemDialog from './CreateItemDialog';
import './command-palette.css';

interface NavCommand {
  kind: 'nav';
  label: string;
  route: Route;
}
interface CreateCommand {
  kind: 'create';
  label: string;
  type: ItemType;
}
type Command = NavCommand | CreateCommand;

const NAV_COMMANDS: NavCommand[] = [
  { kind: 'nav', label: 'Go to Dashboard', route: { view: 'dashboard' } },
  { kind: 'nav', label: 'Go to All Work', route: { view: 'items', title: 'All Work' } },
  { kind: 'nav', label: 'Go to Board', route: { view: 'board' } },
  { kind: 'nav', label: 'Go to Roadmap', route: { view: 'roadmap' } },
  { kind: 'nav', label: 'Go to Access Tracker', route: { view: 'access' } },
  { kind: 'nav', label: 'Go to Decisions', route: { view: 'decisions' } },
  { kind: 'nav', label: 'Go to Meetings', route: { view: 'meetings' } },
  { kind: 'nav', label: 'Go to Risks & Blockers', route: { view: 'risks' } },
  { kind: 'nav', label: 'Go to Reports', route: { view: 'reports' } },
  { kind: 'nav', label: 'Go to Activity', route: { view: 'activity' } },
  { kind: 'nav', label: 'Go to Conflicts', route: { view: 'conflicts' } },
  { kind: 'nav', label: 'Go to Settings', route: { view: 'settings' } },
];

const CREATE_COMMANDS: CreateCommand[] = ITEM_TYPES.map((t) => ({
  kind: 'create' as const,
  label: `Create ${TYPE_LABEL[t]}`,
  type: t,
}));

export default function CommandPalette() {
  const { setPalette, navigate, openItem } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [createType, setCreateType] = useState<ItemType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 2) {
        void api.items.search(query, 12).then(setResults);
      } else {
        setResults([]);
      }
    }, 120);
    return () => clearTimeout(t);
  }, [query]);

  const q = query.trim().toLowerCase();
  const commands: Command[] = q
    ? [...NAV_COMMANDS, ...CREATE_COMMANDS].filter((c) => c.label.toLowerCase().includes(q))
    : NAV_COMMANDS.slice(0, 6);

  const rows: ({ kind: 'item'; result: SearchResult } | Command)[] = [
    ...results.map((r) => ({ kind: 'item' as const, result: r })),
    ...commands,
  ];

  useEffect(() => setSelected(0), [query, results.length]);

  const run = (row: (typeof rows)[number]) => {
    if (row.kind === 'item') {
      openItem(row.result.item.id);
      setPalette(false);
    } else if (row.kind === 'nav') {
      navigate(row.route);
      setPalette(false);
    } else {
      setCreateType(row.type);
    }
  };

  if (createType) {
    return <CreateItemDialog defaultType={createType} onClose={() => setPalette(false)} />;
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setPalette(false)}>
      <div className="palette" role="dialog" aria-label="Command palette">
        <div className="palette-input">
          <Search size={15} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search items, or type a command…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, rows.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
              if (e.key === 'Enter' && rows[selected]) run(rows[selected]);
            }}
          />
        </div>
        <div className="palette-rows">
          {rows.length === 0 && <div className="palette-empty">No matches</div>}
          {rows.map((row, i) => (
            <div
              key={row.kind === 'item' ? row.result.item.id : row.label}
              className={`palette-row ${i === selected ? 'selected' : ''}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => run(row)}
            >
              {row.kind === 'item' ? (
                <>
                  <TypeIcon type={row.result.item.type} size={14} />
                  <span className="ident">{row.result.item.ident}</span>
                  <span className="palette-title">{row.result.item.title}</span>
                  <StatusBadge status={row.result.item.status} />
                </>
              ) : (
                <>
                  <CornerDownLeft size={13} style={{ color: 'var(--text-faint)' }} />
                  <span className="palette-title">{row.label}</span>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
