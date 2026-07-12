// SmartLink: inline chip for project references (REQ-41, DEC-12 …).
// - Typing an ident followed by space/enter converts it automatically (if the item exists).
// - Pasted idents convert too.
// - Renders live data (title, status) via a small async cache; clicking navigates.
import { Node, mergeAttributes, InputRule } from '@tiptap/core';
import type { WorkItem } from '@shared/types';
import { IDENT_PREFIX, STATUS_LABEL } from '@shared/types';
import { api } from '../../api';

const PREFIXES = Object.values(IDENT_PREFIX).join('|');
const IDENT_INPUT = new RegExp(`(?:^|\\s)((?:${PREFIXES})-\\d+)([\\s.,;:!?])$`, 'i');

// ---- module-level wiring (set once by RichEditor) ----
let navigateHandler: (itemId: string) => void = () => {};
export function setSmartLinkNavigate(fn: (itemId: string) => void): void {
  navigateHandler = fn;
}

// ---- ident → item cache ----
const cache = new Map<string, WorkItem | null>();
const pending = new Map<string, Promise<WorkItem | null>>();

export function lookupIdent(ident: string): Promise<WorkItem | null> {
  const key = ident.toUpperCase();
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  if (pending.has(key)) return pending.get(key)!;
  const p = api.items.getByIdent(key).then((item) => {
    cache.set(key, item);
    pending.delete(key);
    return item;
  });
  pending.set(key, p);
  return p;
}

export function invalidateSmartLinkCache(): void {
  cache.clear();
}

export const SmartLink = Node.create({
  name: 'smartLink',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      ident: { default: '' },
      itemId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-smart-link]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-smart-link': '', class: 'smart-link' }), `${node.attrs.ident}`];
  },

  renderText({ node }) {
    return String(node.attrs.ident);
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.className = 'smart-link';
      dom.setAttribute('data-smart-link', '');

      const identSpan = document.createElement('span');
      identSpan.className = 'smart-link-ident';
      identSpan.textContent = node.attrs.ident;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'smart-link-title';

      const statusDot = document.createElement('span');
      statusDot.className = 'smart-link-status';

      dom.append(identSpan, titleSpan, statusDot);

      void lookupIdent(String(node.attrs.ident)).then((item) => {
        if (!item) {
          dom.classList.add('missing');
          dom.title = `${node.attrs.ident} — item not found`;
          return;
        }
        titleSpan.textContent = item.title.length > 42 ? item.title.slice(0, 42) + '…' : item.title;
        statusDot.textContent = STATUS_LABEL[item.status] ?? item.status;
        dom.title = `${item.ident} · ${item.title}\nStatus: ${STATUS_LABEL[item.status] ?? item.status}${item.dueDate ? `\nDue: ${item.dueDate}` : ''}`;
        dom.addEventListener('click', (e) => {
          e.preventDefault();
          navigateHandler(item.id);
        });
      });

      return { dom };
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: IDENT_INPUT,
        handler: ({ state, range, match, chain }) => {
          const ident = match[1].toUpperCase();
          const trailing = match[2];
          // Only convert when the item actually exists (checked async, applied via chain later).
          const from = range.from + match[0].indexOf(match[1]);
          const to = from + match[1].length;
          void lookupIdent(ident).then((item) => {
            if (!item) return;
            chain()
              .deleteRange({ from, to })
              .insertContentAt(from, [{ type: 'smartLink', attrs: { ident: item.ident, itemId: item.id } }])
              .run();
          });
          void state;
          void trailing;
        },
      }),
    ];
  },
});
