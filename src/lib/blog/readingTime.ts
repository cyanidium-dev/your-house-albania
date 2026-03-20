/** Words per minute for reading time calculation. */
const WPM = 200;

type PortableTextBlock = {
  _type?: string;
  children?: Array<{ _type?: string; text?: string }>;
  text?: string;
  [key: string]: unknown;
};

/** Recursively extracts text from Portable Text blocks. */
function extractTextFromBlocks(blocks: unknown[]): string {
  let text = '';
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const b = block as PortableTextBlock;
    if (b.children && Array.isArray(b.children)) {
      for (const child of b.children) {
        if (child?.text && typeof child.text === 'string') {
          text += child.text + ' ';
        }
      }
    }
    if (b.text && typeof b.text === 'string') {
      text += b.text + ' ';
    }
    // Recurse into nested blocks (e.g. list items, callouts)
    if (Array.isArray(b.content)) {
      text += extractTextFromBlocks(b.content);
    }
    if (Array.isArray(b.items)) {
      for (const item of b.items) {
        if (item && typeof item === 'object' && Array.isArray((item as { question?: unknown; answer?: unknown[] }).answer)) {
          text += extractTextFromBlocks((item as { answer: unknown[] }).answer);
        }
        if (item && typeof item === 'object' && Array.isArray((item as { cells?: string[] }).cells)) {
          text += ((item as { cells: string[] }).cells).join(' ');
        }
      }
    }
    if (Array.isArray(b.rows)) {
      for (const row of b.rows) {
        if (row?.cells && Array.isArray(row.cells)) {
          text += row.cells.join(' ') + ' ';
        }
      }
    }
    if (Array.isArray(b.posts)) {
      for (const p of b.posts) {
        if (p?.excerpt && typeof p.excerpt === 'string') text += p.excerpt + ' ';
        if (p?.title && typeof p.title === 'object') {
          text += Object.values(p.title).filter(Boolean).join(' ') + ' ';
        }
      }
    }
    if (Array.isArray(b.properties)) {
      for (const prop of b.properties) {
        if (prop?.title && typeof prop.title === 'object') {
          text += Object.values(prop.title).filter(Boolean).join(' ') + ' ';
        }
        if (prop?.shortDescription && typeof prop.shortDescription === 'object') {
          text += Object.values(prop.shortDescription).filter(Boolean).join(' ') + ' ';
        }
      }
    }
  }
  return text;
}

/**
 * Computes reading time in minutes from Portable Text content blocks.
 * Uses ~200 words per minute. Returns at least 1 for non-empty content.
 */
export function computeReadingTime(contentBlocks: unknown[]): number {
  if (!Array.isArray(contentBlocks) || contentBlocks.length === 0) return 0;
  const text = extractTextFromBlocks(contentBlocks);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  const minutes = Math.ceil(words / WPM);
  return Math.max(1, minutes);
}
