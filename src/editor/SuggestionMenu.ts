// Minimal floating suggestion menu (no tippy dependency) shared by the slash
// command and @mention pickers. Renders into document.body, positioned by the
// caret clientRect supplied by @tiptap/suggestion.
export interface MenuItem {
  key: string;
  label: string;
  hint?: string;
  section?: string;
  run: () => void;
}

export class SuggestionMenu {
  private el: HTMLDivElement;
  private items: MenuItem[] = [];
  private selected = 0;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'suggestion-menu';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
  }

  update(items: MenuItem[], rect: DOMRect | null): void {
    this.items = items;
    this.selected = Math.min(this.selected, Math.max(0, items.length - 1));
    if (!rect || items.length === 0) {
      this.hide();
      return;
    }
    this.render();
    this.el.style.display = 'block';
    const menuH = Math.min(320, items.length * 34 + 16);
    const below = rect.bottom + 6;
    const top = below + menuH > window.innerHeight ? rect.top - menuH - 6 : below;
    this.el.style.top = `${Math.max(8, top)}px`;
    this.el.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
  }

  private render(): void {
    this.el.innerHTML = '';
    let lastSection: string | undefined;
    this.items.forEach((item, i) => {
      if (item.section && item.section !== lastSection) {
        const sec = document.createElement('div');
        sec.className = 'suggestion-section';
        sec.textContent = item.section;
        this.el.appendChild(sec);
        lastSection = item.section;
      }
      const row = document.createElement('div');
      row.className = 'suggestion-row' + (i === this.selected ? ' selected' : '');
      const label = document.createElement('span');
      label.textContent = item.label;
      row.appendChild(label);
      if (item.hint) {
        const hint = document.createElement('span');
        hint.className = 'suggestion-hint';
        hint.textContent = item.hint;
        row.appendChild(hint);
      }
      row.addEventListener('mousedown', (e) => {
        e.preventDefault();
        item.run();
      });
      row.addEventListener('mouseenter', () => {
        this.selected = i;
        this.render();
      });
      this.el.appendChild(row);
    });
  }

  onKeyDown(event: KeyboardEvent): boolean {
    if (this.el.style.display === 'none') return false;
    if (event.key === 'ArrowDown') {
      this.selected = (this.selected + 1) % this.items.length;
      this.render();
      return true;
    }
    if (event.key === 'ArrowUp') {
      this.selected = (this.selected - 1 + this.items.length) % this.items.length;
      this.render();
      return true;
    }
    if (event.key === 'Enter') {
      this.items[this.selected]?.run();
      return true;
    }
    if (event.key === 'Escape') {
      this.hide();
      return true;
    }
    return false;
  }

  hide(): void {
    this.el.style.display = 'none';
  }

  destroy(): void {
    this.el.remove();
  }
}
