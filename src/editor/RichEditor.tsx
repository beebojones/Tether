// RichEditor: the Jira-style editor. Fixed toolbar + bubble menu + slash menu +
// @mentions + smart links + tables + callouts + expand + code blocks + autosave.
import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Image from '@tiptap/extension-image';
import Mention from '@tiptap/extension-mention';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, List, ListOrdered,
  ListChecks, Quote, Table as TableIcon, Minus, Undo2, Redo2, Highlighter,
  Subscript as SubIcon, Superscript as SupIcon, PanelTopClose, Info,
} from 'lucide-react';
import { Callout, CALLOUT_KINDS } from './extensions/Callout';
import { Expand, ExpandSummary } from './extensions/Expand';
import { SmartLink, setSmartLinkNavigate, invalidateSmartLinkCache } from './extensions/SmartLink';
import { SlashCommand } from './extensions/SlashCommand';
import { SuggestionMenu, type MenuItem } from './SuggestionMenu';
import { useApp } from '../store';
import './editor.css';

const lowlight = createLowlight(common);

export interface RichEditorProps {
  content: string; // doc JSON string or ''
  placeholder?: string;
  onSave: (docJson: string, plainText: string) => void | Promise<void>;
  onSelectionText?: (text: string) => void; // for convert-selection-to-item flows
  autofocus?: boolean;
}

export default function RichEditor({ content, placeholder, onSave, onSelectionText, autofocus }: RichEditorProps) {
  const { users, openItem } = useApp();
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef<{ json: string; text: string } | null>(null);

  useEffect(() => {
    setSmartLinkNavigate(openItem);
  }, [openItem]);

  const mentionMenu = useMemo(() => new SuggestionMenu(), []);
  useEffect(() => () => mentionMenu.destroy(), [mentionMenu]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({ codeBlock: false, heading: { levels: [1, 2, 3] } }),
      CodeBlockLowlight.configure({ lowlight }),
      Underline,
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write, type “/” for blocks, “@” to mention, or paste an item ID like REQ-1…' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ allowBase64: true }),
      Callout,
      Expand,
      ExpandSummary,
      SmartLink,
      SlashCommand,
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        suggestion: {
          char: '@',
          items: ({ query }) =>
            users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6),
          render: () => ({
            onStart: (props) => {
              const items: MenuItem[] = (props.items as typeof users).map((u) => ({
                key: u.id,
                label: u.name,
                run: () => props.command({ id: u.id, label: u.name }),
              }));
              mentionMenu.update(items, props.clientRect?.() ?? null);
            },
            onUpdate: (props) => {
              const items: MenuItem[] = (props.items as typeof users).map((u) => ({
                key: u.id,
                label: u.name,
                run: () => props.command({ id: u.id, label: u.name }),
              }));
              mentionMenu.update(items, props.clientRect?.() ?? null);
            },
            onKeyDown: (props) => mentionMenu.onKeyDown(props.event),
            onExit: () => mentionMenu.hide(),
          }),
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users.length],
  );

  const editor = useEditor(
    {
      extensions,
      content: parseContent(content),
      autofocus: autofocus ?? false,
      onUpdate: ({ editor }) => {
        setSaveState('dirty');
        latest.current = { json: JSON.stringify(editor.getJSON()), text: editor.getText({ blockSeparator: '\n' }) };
        clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), 900);
      },
      onSelectionUpdate: ({ editor }) => {
        if (!onSelectionText) return;
        const { from, to } = editor.state.selection;
        onSelectionText(from === to ? '' : editor.state.doc.textBetween(from, to, '\n'));
      },
    },
    [extensions],
  );

  const flush = async () => {
    if (!latest.current) return;
    setSaveState('saving');
    const { json, text } = latest.current;
    latest.current = null;
    await onSave(json, text);
    invalidateSmartLinkCache();
    setSaveState((s) => (latest.current ? s : 'saved'));
  };

  // Flush on unmount / blur so nothing is lost.
  // Flush on unmount AND on editor recreation (extensions change, e.g. a new user
  // appears for mentions) so no in-flight edit is ever dropped.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (latest.current) void flush();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [extensions],
  );

  if (!editor) return null;

  const B = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button type="button" className={`tb ${active ? 'active' : ''}`} title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }} aria-label={title} aria-pressed={active}>
      {children}
    </button>
  );

  return (
    <div className="rich-editor" onBlur={() => { if (latest.current) void flush(); }}>
      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        <select
          className="tb-block"
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1'
            : editor.isActive('heading', { level: 2 }) ? 'h2'
            : editor.isActive('heading', { level: 3 }) ? 'h3'
            : 'p'
          }
          onChange={(e) => {
            const v = e.target.value;
            const chain = editor.chain().focus();
            if (v === 'p') chain.setParagraph().run();
            else chain.setNode('heading', { level: Number(v[1]) as 1 | 2 | 3 }).run();
          }}
          aria-label="Text style"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <span className="tb-sep" />
        <B title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></B>
        <B title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></B>
        <B title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></B>
        <B title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></B>
        <B title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={14} /></B>
        <B title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: 'rgba(242,176,76,0.35)' }).run()}><Highlighter size={14} /></B>
        <B title="Subscript" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}><SubIcon size={14} /></B>
        <B title="Superscript" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}><SupIcon size={14} /></B>
        <span className="tb-sep" />
        <B title="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></B>
        <B title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></B>
        <B title="Task list" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks size={14} /></B>
        <B title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></B>
        <span className="tb-sep" />
        <B title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon size={14} /></B>
        <B title="Info callout" active={editor.isActive('callout')} onClick={() => editor.chain().focus().toggleCallout('info').run()}><Info size={14} /></B>
        <B title="Expandable section" onClick={() => editor.chain().focus().setExpand().run()}><PanelTopClose size={14} /></B>
        <B title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={14} /></B>
        <span className="tb-sep" />
        <B title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={14} /></B>
        <B title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={14} /></B>
        <span style={{ flex: 1 }} />
        <span className={`save-state-inline ${saveState}`}>
          {saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : 'Editing…'}
        </span>
      </div>

      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} shouldShow={({ from, to }) => from !== to}>
        <div className="bubble-bar">
          <B title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={13} /></B>
          <B title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={13} /></B>
          <B title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={13} /></B>
          <B title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: 'rgba(242,176,76,0.35)' }).run()}><Highlighter size={13} /></B>
          <B title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={13} /></B>
        </div>
      </BubbleMenu>

      {/* Table controls appear when inside a table */}
      {editor.isActive('table') && (
        <div className="table-controls">
          <button onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</button>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Column</button>
          <button onClick={() => editor.chain().focus().deleteRow().run()}>− Row</button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()}>− Column</button>
          <button onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Header row</button>
          <button className="danger" onClick={() => editor.chain().focus().deleteTable().run()}>Delete table</button>
        </div>
      )}
      {editor.isActive('callout') && (
        <div className="table-controls">
          {CALLOUT_KINDS.map((k) => (
            <button key={k} onClick={() => editor.chain().focus().updateAttributes('callout', { kind: k }).run()}>{k}</button>
          ))}
          <button onClick={() => editor.chain().focus().unsetCallout().run()}>Remove callout</button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function parseContent(content: string): object | string {
  if (!content) return '';
  try {
    return JSON.parse(content) as object;
  } catch {
    return content; // legacy plain text
  }
}
