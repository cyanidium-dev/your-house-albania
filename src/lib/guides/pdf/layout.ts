/**
 * Lays Markdown blocks out on A4 pages: greedy word wrapping from the font's
 * advance widths, headings kept with the text that follows them, tables that
 * repeat their header when they cross a page, link annotations under link
 * runs, and a footer with the disclaimer and the page number on every page.
 */

import type { Block, Inline } from './markdown'
import { measure, type PdfDocument, type PdfFont, type PdfPage, type Rgb } from './writer'

export const A4 = { width: 595.28, height: 841.89 } as const

export type LayoutTheme = {
  font: PdfFont
  margin: { top: number; right: number; bottom: number; left: number }
  bodySize: number
  lineHeight: number
  ink: Rgb
  muted: Rgb
  accent: Rgb
  rule: Rgb
  panel: Rgb
}

export const DEFAULT_THEME: Omit<LayoutTheme, 'font'> = {
  margin: { top: 60, right: 54, bottom: 64, left: 54 },
  bodySize: 10,
  lineHeight: 1.45,
  ink: [0.13, 0.15, 0.18],
  muted: [0.42, 0.45, 0.5],
  accent: [0.05, 0.36, 0.62],
  rule: [0.82, 0.84, 0.87],
  panel: [0.95, 0.96, 0.97],
}

export type LayoutInput = {
  blocks: Block[]
  /** Small brand line above the first heading. */
  brand: string
  /** Left part of the footer, every page. */
  footer: string
  /** Right part of the footer, with `{page}` and `{pages}`. */
  pageLabel: string
}

type Word = { text: string; bold?: boolean; href?: string; width: number }
type Line = { words: Word[]; width: number }

const SPACE = ' '

function words(theme: LayoutTheme, inlines: Inline[], size: number): Word[] {
  const out: Word[] = []
  for (const run of inlines) {
    const parts = run.text.split(/(\s+)/)
    for (const part of parts) {
      if (part === '') continue
      if (/^\s+$/.test(part)) {
        out.push({ text: SPACE, width: measure(theme.font, SPACE, size) })
        continue
      }
      out.push({ text: part, bold: run.bold, href: run.href, width: measure(theme.font, part, size) })
    }
  }
  return out
}

/** Greedy wrap; a word longer than the line goes on its own line and overflows rather than breaking mid-word. */
function wrap(items: Word[], maxWidth: number): Line[] {
  const lines: Line[] = []
  let cur: Word[] = []
  let width = 0
  const flush = () => {
    while (cur.length && cur[cur.length - 1].text === SPACE) cur.pop()
    while (cur.length && cur[0].text === SPACE) cur.shift()
    lines.push({ words: cur, width: cur.reduce((s, w) => s + w.width, 0) })
    cur = []
    width = 0
  }
  for (const w of items) {
    if (w.text === SPACE) {
      if (cur.length === 0) continue
      cur.push(w)
      width += w.width
      continue
    }
    if (width + w.width > maxWidth && cur.some((x) => x.text !== SPACE)) flush()
    cur.push(w)
    width += w.width
  }
  if (cur.some((x) => x.text !== SPACE)) flush()
  return lines
}

class Flow {
  readonly doc: PdfDocument
  readonly theme: LayoutTheme
  readonly input: LayoutInput
  page!: PdfPage
  y = 0
  pageNo = 0
  readonly totalPages: number | null

  constructor(doc: PdfDocument, theme: LayoutTheme, input: LayoutInput, totalPages: number | null) {
    this.doc = doc
    this.theme = theme
    this.input = input
    this.totalPages = totalPages
    this.newPage()
  }

  get left(): number {
    return this.theme.margin.left
  }

  get contentWidth(): number {
    return A4.width - this.theme.margin.left - this.theme.margin.right
  }

  get bottom(): number {
    return this.theme.margin.bottom
  }

  newPage(): void {
    this.page = this.doc.addPage(A4.width, A4.height)
    this.pageNo++
    this.y = A4.height - this.theme.margin.top
    this.footer()
  }

  private footer(): void {
    const { theme } = this
    const size = 7.5
    const y = 34
    this.page.line(this.left, y + 12, A4.width - theme.margin.right, y + 12, theme.rule, 0.4)
    const label = this.input.pageLabel
      .replace('{page}', String(this.pageNo))
      .replace('{pages}', this.totalPages === null ? '?' : String(this.totalPages))
    const labelWidth = measure(theme.font, label, size)
    this.page.text(theme.font, size, A4.width - theme.margin.right - labelWidth, y, label, { color: theme.muted })
    // The disclaimer may not fit beside the page label on one line: wrap it.
    const maxWidth = this.contentWidth - labelWidth - 16
    const lines = wrap(words(theme, [{ text: this.input.footer }], size), maxWidth)
    let fy = y
    for (const line of lines.slice(0, 2)) {
      this.drawLine(line, this.left, fy, size, theme.muted)
      fy -= size * 1.3
    }
  }

  ensure(height: number): void {
    if (this.y - height < this.bottom) this.newPage()
  }

  drawLine(line: Line, x: number, y: number, size: number, color: Rgb): void {
    let cx = x
    for (const w of line.words) {
      if (w.text !== SPACE) {
        const runColor = w.href ? this.theme.accent : color
        this.page.text(this.theme.font, size, cx, y, w.text, { color: runColor, bold: w.bold })
        if (w.href) {
          this.page.line(cx, y - 1.5, cx + w.width, y - 1.5, this.theme.accent, 0.4)
          this.page.link(cx - 1, y - 3, w.width + 2, size + 3, w.href)
        }
      }
      cx += w.width
    }
  }

  paragraph(inlines: Inline[], opts: { size?: number; color?: Rgb; indent?: number; after?: number; width?: number } = {}): void {
    const size = opts.size ?? this.theme.bodySize
    const lh = size * this.theme.lineHeight
    const x = this.left + (opts.indent ?? 0)
    const lines = wrap(words(this.theme, inlines, size), (opts.width ?? this.contentWidth) - (opts.indent ?? 0))
    for (let i = 0; i < lines.length; i++) {
      this.ensure(lh)
      this.y -= lh
      this.drawLine(lines[i], x, this.y + lh - size, size, opts.color ?? this.theme.ink)
    }
    this.y -= opts.after ?? lh * 0.55
  }

  heading(level: 1 | 2 | 3, inlines: Inline[]): void {
    const size = level === 1 ? 22 : level === 2 ? 14.5 : 11.5
    const lh = size * 1.25
    const lines = wrap(words(this.theme, inlines, size), this.contentWidth)
    const before = level === 1 ? 4 : level === 2 ? 14 : 8
    // Keep the heading with at least two lines of what follows.
    this.ensure(before + lines.length * lh + this.theme.bodySize * this.theme.lineHeight * 2.5)
    this.y -= before
    for (const line of lines) {
      this.y -= lh
      this.drawLine(line, this.left, this.y + lh - size, size, this.theme.ink)
    }
    if (level === 2) {
      this.y -= 4
      this.page.line(this.left, this.y, this.left + 28, this.y, this.theme.accent, 1.2)
      this.y -= 6
    } else {
      this.y -= level === 1 ? 6 : 3
    }
  }

  list(ordered: boolean, items: Inline[][]): void {
    const size = this.theme.bodySize
    const lh = size * this.theme.lineHeight
    const indent = 16
    items.forEach((item, i) => {
      const marker = ordered ? `${i + 1}.` : '•'
      const lines = wrap(words(this.theme, item, size), this.contentWidth - indent)
      this.ensure(lh)
      let first = true
      for (const line of lines) {
        this.ensure(lh)
        this.y -= lh
        if (first) {
          this.page.text(this.theme.font, size, this.left + (ordered ? 0 : 4), this.y + lh - size, marker, { color: this.theme.accent })
          first = false
        }
        this.drawLine(line, this.left + indent, this.y + lh - size, size, this.theme.ink)
      }
      this.y -= lh * 0.2
    })
    this.y -= lh * 0.45
  }

  note(inlines: Inline[]): void {
    const size = this.theme.bodySize - 0.5
    const lh = size * this.theme.lineHeight
    const pad = 9
    const lines = wrap(words(this.theme, inlines, size), this.contentWidth - pad * 2 - 4)
    const height = lines.length * lh + pad * 2
    this.ensure(height)
    this.page.rect(this.left, this.y - height, this.contentWidth, height, this.theme.panel)
    this.page.rect(this.left, this.y - height, 3, height, this.theme.accent)
    let y = this.y - pad
    for (const line of lines) {
      y -= lh
      this.drawLine(line, this.left + pad + 4, y + lh - size, size, this.theme.ink)
    }
    this.y -= height + lh * 0.7
  }

  table(header: Inline[][], rows: Inline[][][]): void {
    const size = this.theme.bodySize - 1
    const lh = size * this.theme.lineHeight
    const padX = 6
    const padY = 4
    const cols = Math.max(header.length, ...rows.map((r) => r.length))
    const natural = new Array<number>(cols).fill(0)
    const all = [header, ...rows]
    for (const row of all) {
      row.forEach((cell, c) => {
        const w = words(this.theme, cell, size).reduce((s, x) => s + x.width, 0) + padX * 2
        natural[c] = Math.max(natural[c], w)
      })
    }
    const total = natural.reduce((a, b) => a + b, 0)
    const avail = this.contentWidth
    const cap = avail * 0.55
    const weights = natural.map((w) => Math.min(w, cap))
    const wsum = weights.reduce((a, b) => a + b, 0)
    const widths = total <= avail ? natural.map((w) => w + ((avail - total) * w) / total) : weights.map((w) => (w / wsum) * avail)

    const layoutRow = (row: Inline[][]) => {
      const cells = widths.map((w, c) => wrap(words(this.theme, row[c] ?? [], size), w - padX * 2))
      const lines = Math.max(1, ...cells.map((c) => c.length))
      return { cells, height: lines * lh + padY * 2 }
    }
    const drawRow = (row: Inline[][], isHeader: boolean) => {
      const { cells, height } = layoutRow(row)
      this.ensure(height)
      if (isHeader) this.page.rect(this.left, this.y - height, avail, height, this.theme.panel)
      let x = this.left
      cells.forEach((lines, c) => {
        let y = this.y - padY
        for (const line of lines) {
          y -= lh
          this.drawLine(line, x + padX, y + lh - size, size, this.theme.ink)
        }
        x += widths[c]
      })
      this.y -= height
      this.page.line(this.left, this.y, this.left + avail, this.y, this.theme.rule, 0.4)
    }

    const headerHeight = layoutRow(header).height
    const firstRow = rows.length ? layoutRow(rows[0]).height : 0
    this.ensure(headerHeight + firstRow)
    this.page.line(this.left, this.y, this.left + avail, this.y, this.theme.rule, 0.4)
    drawRow(header.map((cell) => cell.map((r) => ({ ...r, bold: true }))), true)
    for (const row of rows) {
      const { height } = layoutRow(row)
      if (this.y - height < this.bottom) {
        this.newPage()
        this.page.line(this.left, this.y, this.left + avail, this.y, this.theme.rule, 0.4)
        drawRow(header.map((cell) => cell.map((r) => ({ ...r, bold: true }))), true)
      }
      drawRow(row, false)
    }
    this.y -= lh * 0.8
  }

  brand(): void {
    const size = 8.5
    this.page.text(this.theme.font, size, this.left, this.y - size, this.input.brand.toUpperCase(), {
      color: this.theme.accent,
      bold: true,
      charSpacing: 1.4,
    })
    this.y -= size + 10
  }
}

export function layoutGuide(doc: PdfDocument, theme: LayoutTheme, input: LayoutInput, totalPages: number | null = null): number {
  const flow = new Flow(doc, theme, input, totalPages)
  flow.brand()
  for (const block of input.blocks) {
    switch (block.kind) {
      case 'heading':
        flow.heading(block.level, block.inlines)
        break
      case 'paragraph':
        flow.paragraph(block.inlines)
        break
      case 'list':
        flow.list(block.ordered, block.items)
        break
      case 'table':
        flow.table(block.header, block.rows)
        break
      case 'note':
        flow.note(block.inlines)
        break
      case 'pagebreak':
        flow.newPage()
        break
    }
  }
  return flow.pageNo
}
