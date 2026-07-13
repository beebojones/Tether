// Reusable "Customize" popover for Board/Dashboard: size selector + drag-to-reorder
// list with show/hide toggles. Persists nothing itself — calls onChange with the
// next ResolvedPrefs; the parent saves it to local settings.
import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Eye, EyeOff, GripVertical } from 'lucide-react';
import type { ViewSize } from '@shared/types';
import { type ResolvedPrefs, type ResolvedItem } from '../viewPrefs';
import './viewCustomizer.css';

const SIZES: { value: ViewSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'standard', label: 'Standard' },
  { value: 'large', label: 'Large' },
];

export default function ViewCustomizer({
  noun,
  prefs,
  defaults,
  onChange,
}: {
  noun: string; // "cards" | "columns"
  prefs: ResolvedPrefs;
  defaults: ResolvedPrefs;
  onChange: (next: ResolvedPrefs) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const setSize = (size: ViewSize) => onChange({ ...prefs, size });

  const toggle = (key: string) =>
    onChange({ ...prefs, items: prefs.items.map((i) => (i.key === key ? { ...i, visible: !i.visible } : i)) });

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= prefs.items.length) return;
    const items = prefs.items.slice();
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    onChange({ ...prefs, items });
  };

  const visibleCount = prefs.items.filter((i) => i.visible).length;

  return (
    <div className="vcz" ref={rootRef}>
      <button className="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open} title={`Customize this view`}>
        <SlidersHorizontal size={14} /> Customize
      </button>
      {open && (
        <div className="vcz-pop" role="dialog" aria-label="Customize view">
          <div className="vcz-section-label">Card size</div>
          <div className="vcz-sizes">
            {SIZES.map((s) => (
              <button
                key={s.value}
                className={prefs.size === s.value ? 'active' : ''}
                onClick={() => setSize(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="vcz-section-label">
            Show &amp; arrange {noun}
            <span className="muted">{visibleCount}/{prefs.items.length}</span>
          </div>
          <ul className="vcz-list">
            {prefs.items.map((item: ResolvedItem, idx) => (
              <li
                key={item.key}
                className={`vcz-item ${item.visible ? '' : 'hidden'} ${dragIndex === idx ? 'dragging' : ''}`}
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== idx) {
                    move(dragIndex, idx);
                    setDragIndex(idx);
                  }
                }}
              >
                <GripVertical size={14} className="vcz-grip" aria-hidden />
                <span className="vcz-item-label">{item.label}</span>
                <button
                  className="vcz-eye"
                  onClick={() => toggle(item.key)}
                  title={item.visible ? `Hide` : `Show`}
                  aria-label={item.visible ? `Hide ${item.label}` : `Show ${item.label}`}
                >
                  {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </li>
            ))}
          </ul>

          <div className="vcz-foot">
            <button className="ghost" onClick={() => onChange(defaults)}>Reset to default</button>
          </div>
        </div>
      )}
    </div>
  );
}
