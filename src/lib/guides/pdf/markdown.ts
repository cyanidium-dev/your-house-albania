/**
 * The small Markdown dialect the guide sources are written in, parsed into
 * blocks the PDF typesetter draws. Supported on purpose and nothing else:
 *
 *   # / ## / ###      headings
 *   paragraphs        blank-line separated; `**bold**` and `[text](url)` inline
 *   - item            bullet lists (`*` too)
 *   1. item           numbered lists
 *   | a | b |         pipe tables with a `|---|` separator line
 *   > text            a note box
 *   ---               page break
 *
 * Pure and tested; the same parser serves all seven locales.
 */

export type Inline = { text: string; bold?: boolean; href?: string }

export type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; inlines: Inline[] }
  | { kind: 'paragraph'; inlines: Inline[] }
  | { kind: 'list'; ordered: boolean; items: Inline[][] }
  | { kind: 'table'; header: Inline[][]; rows: Inline[][][] }
  | { kind: 'note'; inlines: Inline[] }
  | { kind: 'pagebreak' }

const INLINE_TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g

/** Splits `**bold**` and `[text](url)` out of a line; plain runs keep their spaces. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const m of text.matchAll(INLINE_TOKEN)) {
    const at = m.index ?? 0
    if (at > last) out.push({ text: text.slice(last, at) })
    const tok = m[0]
    if (tok.startsWith('**')) {
      out.push({ text: tok.slice(2, -2), bold: true })
    } else {
      const close = tok.indexOf('](')
      out.push({ text: tok.slice(1, close), href: tok.slice(close + 2, -1) })
    }
    last = at + tok.length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out.filter((r) => r.text.length > 0)
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((c) => c.trim())
}

function isSeparatorRow(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line)
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []

  const flushPara = () => {
    if (para.length === 0) return
    blocks.push({ kind: 'paragraph', inlines: parseInline(para.join(' ')) })
    para = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const t = line.trim()

    if (t === '') {
      flushPara()
      continue
    }
    if (/^---+$/.test(t)) {
      flushPara()
      blocks.push({ kind: 'pagebreak' })
      continue
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(t)
    if (heading) {
      flushPara()
      blocks.push({ kind: 'heading', level: heading[1].length as 1 | 2 | 3, inlines: parseInline(heading[2].trim()) })
      continue
    }
    if (t.startsWith('>')) {
      flushPara()
      const parts = [t.replace(/^>\s?/, '')]
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('>')) {
        i++
        parts.push(lines[i].trim().replace(/^>\s?/, ''))
      }
      blocks.push({ kind: 'note', inlines: parseInline(parts.join(' ')) })
      continue
    }
    if (t.startsWith('|')) {
      flushPara()
      const header = splitRow(t).map(parseInline)
      const rows: Inline[][][] = []
      if (i + 1 < lines.length && isSeparatorRow(lines[i + 1])) i++
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
        i++
        rows.push(splitRow(lines[i]).map(parseInline))
      }
      blocks.push({ kind: 'table', header, rows })
      continue
    }
    const bullet = /^[-*]\s+(.+)$/.exec(t)
    const numbered = /^\d+[.)]\s+(.+)$/.exec(t)
    if (bullet || numbered) {
      flushPara()
      const ordered = Boolean(numbered)
      const items: Inline[][] = []
      let cur = (bullet ?? numbered)![1]
      while (i + 1 < lines.length) {
        const next = lines[i + 1]
        const nt = next.trim()
        const nb = ordered ? /^\d+[.)]\s+(.+)$/.exec(nt) : /^[-*]\s+(.+)$/.exec(nt)
        if (nb) {
          items.push(parseInline(cur))
          cur = nb[1]
          i++
        } else if (nt !== '' && /^\s{2,}/.test(next) && !/^[-*]\s|^\d+[.)]\s|^#|^\||^>/.test(nt)) {
          // Indented continuation of the current item.
          cur += ` ${nt}`
          i++
        } else break
      }
      items.push(parseInline(cur))
      blocks.push({ kind: 'list', ordered, items })
      continue
    }
    para.push(t)
  }
  flushPara()
  return blocks
}

/** `{{path.to.value}}` → the value from `data`; a missing path throws so a typo cannot ship as "undefined". */
export function substitute(source: string, data: Record<string, unknown>): string {
  return source.replace(/\{\{\s*([a-zA-Z0-9_.+-]+)\s*\}\}/g, (_m, path: string) => {
    let cur: unknown = data
    for (const key of path.split('.')) {
      if (cur === null || typeof cur !== 'object' || !(key in (cur as Record<string, unknown>))) {
        throw new Error(`Unknown placeholder {{${path}}}`)
      }
      cur = (cur as Record<string, unknown>)[key]
    }
    if (cur === null || cur === undefined) throw new Error(`Placeholder {{${path}}} has no value`)
    return String(cur)
  })
}
