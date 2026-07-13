// Per-list style attributes. Adds `listStyle` to bullet/ordered lists and `shape`
// to task lists, rendered as data-attributes the CSS keys off. Each list keeps its
// own style; task lists with no explicit shape fall back to the global default
// (data-checkbox-shape on <html>).
import { Extension } from '@tiptap/core';

export type BulletStyle = 'disc' | 'circle' | 'square' | 'hexagon';
export type OrderedStyle = 'decimal' | 'lower-alpha' | 'lower-roman' | 'upper-alpha' | 'upper-roman';
export type CheckboxShape = 'circle' | 'square' | 'hexagon';

function dataAttr(name: string) {
  return {
    default: null as string | null,
    parseHTML: (el: HTMLElement) => el.getAttribute(name),
    renderHTML: (attrs: Record<string, unknown>) => {
      const key = name === 'data-list-style' ? 'listStyle' : 'shape';
      const v = attrs[key];
      return v ? { [name]: v } : {};
    },
  };
}

export const ListStyles = Extension.create({
  name: 'listStyles',
  addGlobalAttributes() {
    return [
      { types: ['bulletList'], attributes: { listStyle: dataAttr('data-list-style') } },
      { types: ['orderedList'], attributes: { listStyle: dataAttr('data-list-style') } },
      { types: ['taskList'], attributes: { shape: dataAttr('data-shape') } },
    ];
  },
});
