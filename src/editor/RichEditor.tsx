// RichEditor: the Jira-style editor. Fixed toolbar + bubble menu + slash menu +
// @mentions + smart links + tables + callouts + expand + code blocks + autosave.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, BubbleMenu, type Editor } from '@tiptap/react';
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
  Link2, Image as ImageIcon, Baseline, Maximize2, Minimize2, Search, X, Check, ChevronDown,
} from 'lucide-react';
import { Callout, CALLOUT_KINDS } from './extensions/Callout';
import { Expand, ExpandSummary } from './extensions/Expand';
import { SmartLink, setSmartLinkNavigate, invalidateSmartLinkCache } from './extensions/SmartLink';
import { SlashCommand } from './extensions/SlashCommand';
import { ListStyles } from './extensions/ListStyles';
import { SuggestionMenu, type MenuItem } from './SuggestionMenu';
import { useApp } from '../store';
import './editor.css';

const lowlight = createLowlight(common);

const CODE_LANGUAGES = [
  { value: 'plaintext', label: 'Plain text' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'css', label: 'CSS' },
  { value: 'xml', label: 'HTML / XML' },
  { value: 'markdown', label: 'Markdown' },
];

export interface RichEditorProps {
  content: string; // doc JSON string or ''
  placeholder?: string;
  onSave: (docJson: string, plainText: string) => void | Promise<void>;
  onSelectionText?: (text: string) => void; // for convert-selection-to-item flows
  autofocus?: boolean;
}

/** Insert image files into the editor as base64 (local-first: images ride inside the
    doc, so they sync with the item and need no separate blob fetch to render). */
async function insertImageFiles(editor: Editor, files: FileList | File[]): Promise<void> {
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue;
    if (file.size > 8 * 1024 * 1024) {
      alert(`"${file.name}" is larger than 8 MB. Attach large images via the Attachments panel instead.`);
      continue;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
  }
}

// Hoisted out of the component so it isn't a new type on every render (the editor
// re-renders on every keystroke/selection change; an inline component would remount
// every toolbar button each time — the source of intermittent dead-click bugs).
function B({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button type="button" className={`tb ${active ? 'active' : ''}`} title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }} aria-label={title} aria-pressed={active}>
      {children}
    </button>
  );
}

interface ListStyleOption { value: string; label: string; swatch?: string }

/** A list toolbar button: main click toggles the list; the caret opens a menu to
    pick a per-list style (applied to the current list, creating it if needed). */
function ListSplitButton({ editor, icon, title, listType, styleKey, active, onToggle, options }: {
  editor: Editor;
  icon: React.ReactNode;
  title: string;
  listType: 'bulletList' | 'orderedList' | 'taskList';
  styleKey: 'listStyle' | 'shape';
  active: boolean;
  onToggle: () => void;
  options: ListStyleOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onEsc); };
  }, [open]);

  const apply = (value: string) => {
    const chain = editor.chain().focus();
    if (!editor.isActive(listType)) {
      if (listType === 'bulletList') chain.toggleBulletList();
      else if (listType === 'orderedList') chain.toggleOrderedList();
      else chain.toggleTaskList();
    }
    chain.updateAttributes(listType, { [styleKey]: value }).run();
    setOpen(false);
  };
  const current = editor.getAttributes(listType)[styleKey] as string | undefined;

  return (
    <div className="tb-split" ref={ref}>
      <button type="button" className={`tb tb-split-main ${active ? 'active' : ''}`} title={title}
        onMouseDown={(e) => { e.preventDefault(); onToggle(); }} aria-label={title} aria-pressed={active}>
        {icon}
      </button>
      <button type="button" className="tb tb-split-caret" title={`${title} — choose style`}
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }} aria-label={`${title} style options`} aria-expanded={open}>
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="tb-split-menu" role="menu">
          {options.map((o) => (
            <button key={o.value} type="button" role="menuitem"
              className={`tb-split-item ${current === o.value || (!current && o === options[0]) ? 'active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); apply(o.value); }}>
              {o.swatch !== undefined
                ? <span className={`ls-swatch ls-${listType} ls-${o.value}`} aria-hidden>{o.swatch}</span>
                : <span className="ls-swatch" aria-hidden />}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const BULLET_OPTIONS: ListStyleOption[] = [
  { value: 'disc', label: 'Disc', swatch: '' },
  { value: 'circle', label: 'Circle', swatch: '' },
  { value: 'square', label: 'Square', swatch: '' },
  { value: 'hexagon', label: 'Hexagon', swatch: '' },
];
const ORDERED_OPTIONS: ListStyleOption[] = [
  { value: 'decimal', label: '1.  2.  3.' },
  { value: 'lower-alpha', label: 'a.  b.  c.' },
  { value: 'lower-roman', label: 'i.  ii.  iii.' },
  { value: 'upper-alpha', label: 'A.  B.  C.' },
  { value: 'upper-roman', label: 'I.  II.  III.' },
];
const TASK_OPTIONS: ListStyleOption[] = [
  { value: 'circle', label: 'Circle', swatch: '' },
  { value: 'square', label: 'Square', swatch: '' },
  { value: 'hexagon', label: 'Hexagon', swatch: '' },
];

export default function RichEditor({ content, placeholder, onSave, onSelectionText, autofocus }: RichEditorProps) {
  const { users, openItem } = useApp();
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef<{ json: string; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const findState = useRef<{ query: string; positions: number[]; index: number }>({ query: '', positions: [], index: 0 });
  const editorRef = useRef<Editor | null>(null);

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
      ListStyles,
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
      editorProps: {
        handlePaste: (view, event) => {
          const files = event.clipboardData?.files;
          if (files && files.length && Array.from(files).some((f) => f.type.startsWith('image/'))) {
            event.preventDefault();
            void insertImageFiles((view as unknown as { editor?: Editor }).editor ?? editorRef.current!, files);
            return true;
          }
          return false;
        },
        handleDrop: (view, event) => {
          const files = (event as DragEvent).dataTransfer?.files;
          if (files && files.length && Array.from(files).some((f) => f.type.startsWith('image/'))) {
            event.preventDefault();
            void insertImageFiles((view as unknown as { editor?: Editor }).editor ?? editorRef.current!, files);
            return true;
          }
          return false;
        },
      },
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

  editorRef.current = editor;

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

  // ---- Link ----
  const openLinkEditor = useCallback(() => {
    if (!editorRef.current) return;
    const existing = editorRef.current.getAttributes('link').href as string | undefined;
    setLinkUrl(existing ?? '');
    setLinkOpen(true);
  }, []);
  const applyLink = () => {
    const ed = editorRef.current;
    if (!ed) return;
    const url = linkUrl.trim();
    if (!url) {
      ed.chain().focus().unsetLink().run();
    } else {
      const href = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
      ed.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setLinkOpen(false);
  };

  // ---- Find in document ----
  const runFind = useCallback((query: string, advance: 1 | 0) => {
    const ed = editorRef.current;
    if (!ed) return;
    const q = query.trim().toLowerCase();
    if (!q) {
      findState.current = { query: '', positions: [], index: 0 };
      return;
    }
    if (findState.current.query !== q) {
      // Rebuild match positions across all text nodes.
      const positions: number[] = [];
      ed.state.doc.descendants((node, pos) => {
        if (node.isText && node.text) {
          const text = node.text.toLowerCase();
          let i = text.indexOf(q);
          while (i !== -1) {
            positions.push(pos + i);
            i = text.indexOf(q, i + 1);
          }
        }
        return true;
      });
      findState.current = { query: q, positions, index: 0 };
    } else if (advance) {
      findState.current.index = (findState.current.index + 1) % Math.max(1, findState.current.positions.length);
    }
    const { positions, index } = findState.current;
    if (!positions.length) return;
    const from = positions[index];
    ed.chain().focus().setTextSelection({ from, to: from + q.length }).scrollIntoView().run();
  }, []);

  // Editor-scoped shortcuts: Ctrl/Cmd+K link, Ctrl/Cmd+F find.
  const onRootKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      e.stopPropagation();
      openLinkEditor();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      e.stopPropagation();
      setFindOpen(true);
    }
    if (e.key === 'Escape' && fullscreen) setFullscreen(false);
  };

  if (!editor) return null;

  const textColorAttr = editor.getAttributes('textStyle').color as string | undefined;
  const curTextColor = textColorAttr ?? '#a495ff';
  const curHighlight = (editor.getAttributes('highlight').color as string | undefined)?.slice(0, 7) || '#f2b04c';

  return (
    <div
      ref={rootRef}
      className={`rich-editor ${fullscreen ? 'fullscreen' : ''}`}
      onBlur={() => { if (latest.current) void flush(); }}
      onKeyDown={onRootKeyDown}
    >
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) void insertImageFiles(editor, e.target.files);
          e.target.value = '';
        }}
      />
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
        <B title="Link (Ctrl+K)" active={editor.isActive('link')} onClick={openLinkEditor}><Link2 size={14} /></B>
        <label className="tb tb-color" title="Text color">
          <Baseline size={14} style={{ color: textColorAttr ?? 'currentColor' }} />
          <input type="color" value={curTextColor}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
        </label>
        {textColorAttr && <B title="Clear text color" onClick={() => editor.chain().focus().unsetColor().run()}><X size={12} /></B>}
        <label className="tb tb-color" title="Highlight color" style={{ background: editor.isActive('highlight') ? 'var(--accent-soft)' : undefined }}>
          <Highlighter size={14} />
          <input type="color" value={curHighlight}
            onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value + '59' }).run()} />
        </label>
        {editor.isActive('highlight') && <B title="Clear highlight" onClick={() => editor.chain().focus().unsetHighlight().run()}><X size={12} /></B>}
        <B title="Subscript" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}><SubIcon size={14} /></B>
        <B title="Superscript" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}><SupIcon size={14} /></B>
        <span className="tb-sep" />
        <ListSplitButton editor={editor} title="Bulleted list" listType="bulletList" styleKey="listStyle"
          active={editor.isActive('bulletList')} onToggle={() => editor.chain().focus().toggleBulletList().run()}
          icon={<List size={14} />} options={BULLET_OPTIONS} />
        <ListSplitButton editor={editor} title="Numbered list" listType="orderedList" styleKey="listStyle"
          active={editor.isActive('orderedList')} onToggle={() => editor.chain().focus().toggleOrderedList().run()}
          icon={<ListOrdered size={14} />} options={ORDERED_OPTIONS} />
        <ListSplitButton editor={editor} title="Task list" listType="taskList" styleKey="shape"
          active={editor.isActive('taskList')} onToggle={() => editor.chain().focus().toggleTaskList().run()}
          icon={<ListChecks size={14} />} options={TASK_OPTIONS} />
        <B title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></B>
        <span className="tb-sep" />
        <B title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon size={14} /></B>
        <B title="Insert image" onClick={() => fileInput.current?.click()}><ImageIcon size={14} /></B>
        <B title="Info callout" active={editor.isActive('callout')} onClick={() => editor.chain().focus().toggleCallout('info').run()}><Info size={14} /></B>
        <B title="Expandable section" onClick={() => editor.chain().focus().setExpand().run()}><PanelTopClose size={14} /></B>
        <B title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={14} /></B>
        <span className="tb-sep" />
        <B title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={14} /></B>
        <B title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={14} /></B>
        <span className="tb-sep" />
        <B title="Find in document (Ctrl+F)" active={findOpen} onClick={() => setFindOpen((v) => !v)}><Search size={14} /></B>
        <B title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'} active={fullscreen} onClick={() => setFullscreen((v) => !v)}>
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </B>
        <span style={{ flex: 1 }} />
        <span className={`save-state-inline ${saveState}`}>
          {saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : 'Editing…'}
        </span>
      </div>

      {linkOpen && (
        <div className="editor-subbar">
          <Link2 size={13} />
          <input
            type="text"
            autoFocus
            placeholder="https://…  (empty to remove)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
              if (e.key === 'Escape') setLinkOpen(false);
            }}
          />
          <button className="tb" title="Apply link" onMouseDown={(e) => { e.preventDefault(); applyLink(); }}><Check size={14} /></button>
          <button className="tb" title="Cancel" onMouseDown={(e) => { e.preventDefault(); setLinkOpen(false); }}><X size={14} /></button>
        </div>
      )}

      {findOpen && (
        <div className="editor-subbar">
          <Search size={13} />
          <input
            type="text"
            autoFocus
            placeholder="Find in this description…"
            value={findQuery}
            onChange={(e) => { setFindQuery(e.target.value); runFind(e.target.value, 0); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); runFind(findQuery, 1); }
              if (e.key === 'Escape') setFindOpen(false);
            }}
          />
          <span className="muted" style={{ fontSize: 'var(--fs-xs)', minWidth: 60, textAlign: 'right' }}>
            {findState.current.positions.length
              ? `${findState.current.index + 1} / ${findState.current.positions.length}`
              : findQuery.trim() ? 'none' : ''}
          </span>
          <button className="tb" title="Next (Enter)" onMouseDown={(e) => { e.preventDefault(); runFind(findQuery, 1); }}>Next</button>
          <button className="tb" title="Close" onMouseDown={(e) => { e.preventDefault(); setFindOpen(false); }}><X size={14} /></button>
        </div>
      )}

      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} shouldShow={({ from, to }) => from !== to}>
        <div className="bubble-bar">
          <B title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={13} /></B>
          <B title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={13} /></B>
          <B title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={13} /></B>
          <B title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: 'rgba(242,176,76,0.35)' }).run()}><Highlighter size={13} /></B>
          <B title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={13} /></B>
          <B title="Link (Ctrl+K)" active={editor.isActive('link')} onClick={openLinkEditor}><Link2 size={13} /></B>
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
      {editor.isActive('codeBlock') && (
        <div className="table-controls">
          <span className="muted" style={{ fontSize: 'var(--fs-xs)', alignSelf: 'center' }}>Language</span>
          <select
            value={(editor.getAttributes('codeBlock').language as string) || 'plaintext'}
            onChange={(e) => editor.chain().focus().updateAttributes('codeBlock', { language: e.target.value }).run()}
            aria-label="Code block language"
          >
            {CODE_LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
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
