/**
 * Portable Text → plain text (for JSON-LD, excerpts, metadata).
 * Concatenates span texts within a block; blocks are separated by newlines.
 */

type PortableSpan = { _type?: string; text?: unknown };
type PortableBlock = { _type?: string; children?: unknown };

export function portableTextToPlainText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const block of blocks as PortableBlock[]) {
    if (!block || typeof block !== 'object') continue;
    const children = Array.isArray(block.children) ? (block.children as PortableSpan[]) : [];
    const text = children
      .map((span) => (typeof span?.text === 'string' ? span.text : ''))
      .join('')
      .trim();
    if (text) parts.push(text);
  }
  return parts.join('\n');
}
