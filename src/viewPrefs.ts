// Reconciles saved per-user view prefs against the canonical set of cards/columns
// a view actually has, so new cards appear automatically and removed ones drop.
import type { SingleViewPrefs, ViewSize } from '@shared/types';

export interface CanonicalItem {
  key: string;
  label: string;
}
export interface ResolvedItem extends CanonicalItem {
  visible: boolean;
}
export interface ResolvedPrefs {
  size: ViewSize;
  items: ResolvedItem[];
}

export function resolvePrefs(canonical: CanonicalItem[], saved?: SingleViewPrefs): ResolvedPrefs {
  const size: ViewSize = saved?.size ?? 'standard';
  const labelByKey = new Map(canonical.map((c) => [c.key, c.label]));
  const items: ResolvedItem[] = [];
  const seen = new Set<string>();

  // 1. saved order/visibility first (dropping keys that are no longer canonical)
  for (const s of saved?.items ?? []) {
    const label = labelByKey.get(s.key);
    if (label !== undefined && !seen.has(s.key)) {
      items.push({ key: s.key, label, visible: s.visible });
      seen.add(s.key);
    }
  }
  // 2. append any new canonical items, visible by default
  for (const c of canonical) {
    if (!seen.has(c.key)) {
      items.push({ key: c.key, label: c.label, visible: true });
      seen.add(c.key);
    }
  }
  return { size, items };
}

export function toSaved(resolved: ResolvedPrefs): SingleViewPrefs {
  return { size: resolved.size, items: resolved.items.map((i) => ({ key: i.key, visible: i.visible })) };
}

/** Ordered keys of the visible items — what the view should render, in order. */
export function visibleKeys(resolved: ResolvedPrefs): string[] {
  return resolved.items.filter((i) => i.visible).map((i) => i.key);
}
