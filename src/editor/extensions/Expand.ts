// Expandable/collapsible section with an editable summary line.
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    expand: {
      setExpand: () => ReturnType;
    };
  }
}

export const Expand = Node.create({
  name: 'expand',
  group: 'block',
  content: 'expandSummary block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (el) => el.getAttribute('data-open') !== 'false',
        renderHTML: (attrs) => ({ 'data-open': String(attrs.open) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-expand]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-expand': '', class: 'expand' }), 0];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.className = 'expand';
      dom.setAttribute('data-open', String(node.attrs.open));

      const toggle = document.createElement('button');
      toggle.className = 'expand-toggle';
      toggle.type = 'button';
      toggle.contentEditable = 'false';
      toggle.setAttribute('aria-label', 'Toggle section');
      toggle.textContent = node.attrs.open ? '▾' : '▸';
      toggle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (pos == null) return;
        // Read current state from the live doc — the `node` closure goes stale after
        // the first update (the node view DOM is reused, this listener is not rebound).
        const liveNode = editor.view.state.doc.nodeAt(pos);
        const isOpen = (liveNode?.attrs.open as boolean | undefined) ?? true;
        editor.view.dispatch(editor.view.state.tr.setNodeAttribute(pos, 'open', !isOpen));
      });

      const contentDOM = document.createElement('div');
      contentDOM.className = 'expand-body';

      dom.appendChild(toggle);
      dom.appendChild(contentDOM);
      return {
        dom,
        contentDOM,
        update: (updated) => {
          if (updated.type.name !== 'expand') return false;
          dom.setAttribute('data-open', String(updated.attrs.open));
          toggle.textContent = updated.attrs.open ? '▾' : '▸';
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      setExpand:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: 'expand',
            attrs: { open: true },
            content: [
              { type: 'expandSummary', content: [{ type: 'text', text: 'Section' }] },
              { type: 'paragraph' },
            ],
          }),
    };
  },
});

export const ExpandSummary = Node.create({
  name: 'expandSummary',
  content: 'inline*',
  defining: true,
  selectable: false,

  parseHTML() {
    return [{ tag: 'div[data-expand-summary]' }];
  },

  renderHTML() {
    return ['div', { 'data-expand-summary': '', class: 'expand-summary' }, 0];
  },
});
