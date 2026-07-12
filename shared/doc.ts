// Rich-doc helpers shared by main process and renderer.

/** Extract plain text from a stored editor document (TipTap JSON string). */
export function docToText(body: string): string {
  if (!body) return '';
  try {
    const doc = JSON.parse(body) as { content?: unknown[] };
    const walk = (nodes: unknown[]): string =>
      nodes
        .map((n) => {
          const node = n as { type?: string; text?: string; content?: unknown[] };
          if (node.text) return node.text;
          const inner = node.content ? walk(node.content) : '';
          return node.type === 'paragraph' || node.type?.startsWith('heading') ? inner + '\n' : inner;
        })
        .join('');
    return walk(doc.content ?? []).trim();
  } catch {
    return body;
  }
}

/** Wrap plain text into a minimal editor document. */
export function textToDoc(text: string): string {
  return JSON.stringify({
    type: 'doc',
    content: text.split(/\n{2,}/).map((p) => ({
      type: 'paragraph',
      content: p ? [{ type: 'text', text: p }] : [],
    })),
  });
}
