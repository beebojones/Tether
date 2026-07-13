// Per-line list styles.
//  - Bullet marker + numbered style: plain nodes, so a global data-attribute
//    (data-list-style on the <li> / <ol>) is enough.
//  - Checkbox shape: TaskItem uses a custom nodeView that builds its own <li> and
//    ignores global attributes, so we extend it to (1) declare a `shape` attribute
//    and (2) reflect it onto the rendered <li> via the nodeView.
// Task items with no explicit shape fall back to the global default
// (data-checkbox-shape on <html>).
import { Extension } from '@tiptap/core';
import TaskItem from '@tiptap/extension-task-item';

export type BulletStyle = 'disc' | 'circle' | 'square' | 'hexagon';
export type OrderedStyle = 'decimal' | 'lower-alpha' | 'lower-roman' | 'upper-alpha' | 'upper-roman';
export type CheckboxShape = 'circle' | 'square' | 'hexagon';

function listStyleAttr() {
  return {
    listStyle: {
      default: null as string | null,
      parseHTML: (el: HTMLElement) => el.getAttribute('data-list-style'),
      renderHTML: (attrs: Record<string, unknown>) =>
        attrs.listStyle ? { 'data-list-style': attrs.listStyle } : {},
    },
  };
}

// Bullet markers (per listItem) and numbered style (per orderedList).
export const ListStyles = Extension.create({
  name: 'listStyles',
  addGlobalAttributes() {
    return [
      { types: ['orderedList'], attributes: listStyleAttr() },
      { types: ['listItem'], attributes: listStyleAttr() },
    ];
  },
});

/* eslint-disable @typescript-eslint/no-explicit-any */
// Checkbox shape (per taskItem), rendered onto the <li> through the nodeView.
export const StyledTaskItem = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      shape: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-shape'),
        renderHTML: (attrs: Record<string, unknown>) => (attrs.shape ? { 'data-shape': attrs.shape } : {}),
      },
    };
  },
  addNodeView() {
    const parent = this.parent?.();
    if (!parent) return undefined as any;
    return (props: any) => {
      const view: any = (parent as any)(props);
      const apply = (node: any) => {
        const dom = view?.dom as HTMLElement | undefined;
        if (!dom) return;
        if (node.attrs.shape) dom.setAttribute('data-shape', node.attrs.shape);
        else dom.removeAttribute('data-shape');
      };
      apply(props.node);
      const origUpdate = view.update ? view.update.bind(view) : null;
      view.update = (node: any, ...rest: any[]) => {
        const ok = origUpdate ? origUpdate(node, ...rest) : true;
        if (ok) apply(node);
        return ok;
      };
      return view;
    };
  },
});
