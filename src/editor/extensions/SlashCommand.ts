// "/" command menu: insert headings, lists, tables, callouts, code, expand, etc.
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import type { Editor, Range } from '@tiptap/core';
import { SuggestionMenu, type MenuItem } from '../SuggestionMenu';
import { CALLOUT_KINDS } from './Callout';

interface SlashDef {
  label: string;
  keywords: string;
  section: string;
  run: (editor: Editor, range: Range) => void;
}

const DEFS: SlashDef[] = [
  { label: 'Heading 1', keywords: 'h1 title', section: 'Text', run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 1 }).run() },
  { label: 'Heading 2', keywords: 'h2', section: 'Text', run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 2 }).run() },
  { label: 'Heading 3', keywords: 'h3', section: 'Text', run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 3 }).run() },
  { label: 'Bulleted list', keywords: 'ul bullet', section: 'Lists', run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
  { label: 'Numbered list', keywords: 'ol ordered', section: 'Lists', run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run() },
  { label: 'Task list', keywords: 'todo checklist checkbox', section: 'Lists', run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run() },
  { label: 'Table', keywords: 'table grid', section: 'Blocks', run: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { label: 'Code block', keywords: 'code snippet', section: 'Blocks', run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run() },
  { label: 'Quote', keywords: 'blockquote', section: 'Blocks', run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run() },
  { label: 'Divider', keywords: 'hr rule line', section: 'Blocks', run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
  { label: 'Expandable section', keywords: 'expand collapse details toggle', section: 'Blocks', run: (e, r) => e.chain().focus().deleteRange(r).setExpand().run() },
  ...CALLOUT_KINDS.map((kind) => ({
    label: `${kind[0].toUpperCase() + kind.slice(1)} callout`,
    keywords: `callout panel ${kind}`,
    section: 'Callouts',
    run: (e: Editor, r: Range) => e.chain().focus().deleteRange(r).setCallout(kind).run(),
  })),
];

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    const menu = new SuggestionMenu();
    // The menu element lives on document.body — remove it with the editor.
    this.editor.on('destroy', () => menu.destroy());
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }) => {
          (props as SlashDef).run(editor as Editor, range);
        },
        items: ({ query }) => {
          const q = query.toLowerCase();
          return DEFS.filter((d) => d.label.toLowerCase().includes(q) || d.keywords.includes(q)).slice(0, 12);
        },
        render: () => ({
          onStart: (props) => {
            const items: MenuItem[] = (props.items as SlashDef[]).map((d) => ({
              key: d.label,
              label: d.label,
              section: d.section,
              run: () => props.command(d),
            }));
            menu.update(items, props.clientRect?.() ?? null);
          },
          onUpdate: (props) => {
            const items: MenuItem[] = (props.items as SlashDef[]).map((d) => ({
              key: d.label,
              label: d.label,
              section: d.section,
              run: () => props.command(d),
            }));
            menu.update(items, props.clientRect?.() ?? null);
          },
          onKeyDown: (props) => menu.onKeyDown(props.event),
          onExit: () => menu.hide(),
        }),
      }),
    ];
  },
});
