/**
 * The small slice of Markdown the assistant actually produces, parsed into
 * plain data. Rendering lives in `AssistantText.tsx`; this file is the logic,
 * which keeps it testable without a JSX transform.
 *
 * The model writes `**bold**`, the occasional `*italic*` and `-` bullet lists,
 * and before this those reached the screen as literal asterisks. A full
 * Markdown library is a large dependency for four constructs, and running model
 * output through `dangerouslySetInnerHTML` would hand a text generator a route
 * into the DOM — so the parser emits spans the renderer turns into React nodes,
 * and anything it does not recognise stays ordinary text.
 */

/** `**bold**`, `*italic*`, `_italic_`, `` `code` `` — first match wins, left to right. */
const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`)/g

const BULLET = /^\s*[-*•]\s+/

export type Span =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }
  | { kind: 'code'; value: string }

export type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }

/** Splits one line into styled spans. Unmatched markers stay literal. */
export function spans(text: string): Span[] {
  const out: Span[] = []

  for (const part of text.split(INLINE)) {
    if (!part) continue

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      out.push({ kind: 'bold', value: part.slice(2, -2) })
    } else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      out.push({ kind: 'code', value: part.slice(1, -1) })
    } else if (
      (part.startsWith('*') && part.endsWith('*') && part.length > 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length > 2)
    ) {
      out.push({ kind: 'italic', value: part.slice(1, -1) })
    } else {
      out.push({ kind: 'text', value: part })
    }
  }

  return out
}

/** Groups lines into paragraphs and bullet lists. */
export function blocks(text: string): Block[] {
  const out: Block[] = []

  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    const last = out[out.length - 1]

    if (!line.trim()) {
      // A blank line closes whatever was open.
      if (last) out.push({ kind: 'p', lines: [] })
      continue
    }

    if (BULLET.test(line)) {
      const item = line.replace(BULLET, '')
      if (last?.kind === 'ul') last.items.push(item)
      else out.push({ kind: 'ul', items: [item] })
      continue
    }

    if (last?.kind === 'p' && last.lines.length > 0) last.lines.push(line)
    else out.push({ kind: 'p', lines: [line] })
  }

  return out.filter((b) => (b.kind === 'ul' ? b.items.length > 0 : b.lines.length > 0))
}
