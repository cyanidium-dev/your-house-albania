/**
 * A minimal PDF 1.4 writer: pages with text, rules, filled boxes and link
 * annotations, one or more embedded TrueType fonts (CIDFontType2, Identity-H,
 * with a ToUnicode map so the text can be searched and copied), streams
 * deflated with Node's zlib. Enough for a text guide; nothing more.
 *
 * Output is deterministic for the same input (no timestamps of its own, no
 * random IDs), so regenerating an unchanged guide leaves git quiet.
 */

import { deflateSync } from 'node:zlib'
import { glyphFor, parseTtf, subsetTtf, widthPer1000, type TtfFont } from './ttf'

export type Rgb = [number, number, number]

export type PdfFont = {
  /** `/F1`, `/F2`… in page resources. */
  readonly name: string
  readonly ttf: TtfFont
  /** Glyphs drawn so far; only these are embedded. */
  readonly used: Set<number>
  /** Code point → glyph, so ToUnicode can be written from what was drawn. */
  readonly unicode: Map<number, number>
}

export type TextOptions = {
  color?: Rgb
  /** Synthetic bold: fill plus a thin stroke of the same colour. */
  bold?: boolean
  /** Extra space added after each glyph, points (letterspacing). */
  charSpacing?: number
}

const FALLBACK_CHAR = 0x003f // '?'

function fmt(n: number): string {
  const r = Math.round(n * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/\.?0+$/, '')
}

function color(rgb: Rgb, op: 'rg' | 'RG'): string {
  return `${fmt(rgb[0])} ${fmt(rgb[1])} ${fmt(rgb[2])} ${op}`
}

/** PDF literal string: only ASCII, with the delimiters escaped. */
function literal(s: string): string {
  const ascii = Array.from(s)
    .map((ch) => (ch.charCodeAt(0) < 128 ? ch : encodeURIComponent(ch)))
    .join('')
  return `(${ascii.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')})`
}

/** PDF text string as UTF-16BE with BOM, hex-encoded — safe for any title. */
function textString(s: string): string {
  let hex = 'FEFF'
  for (let i = 0; i < s.length; i++) hex += s.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase()
  return `<${hex}>`
}

function pdfDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `(D:${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z)`
}

/** Width of `text` in points at `size`, from the font's advance widths. */
export function measure(font: PdfFont, text: string, size: number, charSpacing = 0): number {
  let w = 0
  let n = 0
  for (const ch of text) {
    const cp = ch.codePointAt(0)!
    let gid = glyphFor(font.ttf, cp)
    if (gid === 0) gid = glyphFor(font.ttf, FALLBACK_CHAR)
    w += widthPer1000(font.ttf, gid)
    n++
  }
  return (w * size) / 1000 + n * charSpacing
}

export class PdfPage {
  readonly width: number
  readonly height: number
  private ops: string[] = []
  private annots: string[] = []

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  /** Draws `text` with its baseline at (x, y); PDF y grows upwards. Returns the advance. */
  text(font: PdfFont, size: number, x: number, y: number, text: string, opts: TextOptions = {}): number {
    let hex = ''
    for (const ch of text) {
      const cp = ch.codePointAt(0)!
      let gid = glyphFor(font.ttf, cp)
      if (gid === 0) gid = glyphFor(font.ttf, FALLBACK_CHAR)
      font.used.add(gid)
      if (!font.unicode.has(gid)) font.unicode.set(gid, cp)
      hex += gid.toString(16).padStart(4, '0')
    }
    const rgb = opts.color ?? [0, 0, 0]
    const parts = ['BT', `/${font.name} ${fmt(size)} Tf`]
    parts.push(color(rgb, 'rg'))
    if (opts.bold) parts.push(color(rgb, 'RG'), `${fmt(size * 0.028)} w`, '2 Tr')
    else parts.push('0 Tr')
    if (opts.charSpacing) parts.push(`${fmt(opts.charSpacing)} Tc`)
    parts.push(`1 0 0 1 ${fmt(x)} ${fmt(y)} Tm`, `<${hex}> Tj`)
    if (opts.charSpacing) parts.push('0 Tc')
    parts.push('ET')
    this.ops.push(parts.join(' '))
    return measure(font, text, size, opts.charSpacing)
  }

  rect(x: number, y: number, w: number, h: number, fill: Rgb): void {
    this.ops.push(`${color(fill, 'rg')} ${fmt(x)} ${fmt(y)} ${fmt(w)} ${fmt(h)} re f`)
  }

  line(x1: number, y1: number, x2: number, y2: number, stroke: Rgb, width = 0.5): void {
    this.ops.push(`${color(stroke, 'RG')} ${fmt(width)} w ${fmt(x1)} ${fmt(y1)} m ${fmt(x2)} ${fmt(y2)} l S`)
  }

  /** A clickable area opening `url` in the reader. */
  link(x: number, y: number, w: number, h: number, url: string): void {
    this.annots.push(
      `<< /Type /Annot /Subtype /Link /Rect [${fmt(x)} ${fmt(y)} ${fmt(x + w)} ${fmt(y + h)}] /Border [0 0 0] /A << /S /URI /URI ${literal(url)} >> >>`,
    )
  }

  /** @internal */
  content(): string {
    return this.ops.join('\n')
  }

  /** @internal */
  annotations(): string[] {
    return this.annots
  }
}

export type PdfMeta = {
  title: string
  author: string
  subject?: string
  keywords?: string
  /** BCP 47, e.g. `de`; goes to the catalog so readers announce the language. */
  lang: string
  creationDate: Date
}

type PdfObject = { body: Uint8Array | string }

function bytesOf(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

export class PdfDocument {
  private objects: (PdfObject | null)[] = []
  private pages: PdfPage[] = []
  private fonts: PdfFont[] = []
  private meta: PdfMeta

  constructor(meta: PdfMeta) {
    this.meta = meta
  }

  private reserve(): number {
    this.objects.push(null)
    return this.objects.length
  }

  private set(id: number, body: string | Uint8Array): void {
    this.objects[id - 1] = { body }
  }

  private stream(id: number, dict: string, data: Uint8Array): void {
    const packed = deflateSync(data)
    const head = bytesOf(`<< ${dict ? `${dict} ` : ''}/Length ${packed.length} /Filter /FlateDecode >>\nstream\n`)
    const tail = bytesOf('\nendstream')
    const out = new Uint8Array(head.length + packed.length + tail.length)
    out.set(head, 0)
    out.set(packed, head.length)
    out.set(tail, head.length + packed.length)
    this.set(id, out)
  }

  addFont(ttfBytes: Uint8Array): PdfFont {
    const font: PdfFont = {
      name: `F${this.fonts.length + 1}`,
      ttf: parseTtf(ttfBytes),
      used: new Set<number>(),
      unicode: new Map<number, number>(),
    }
    this.fonts.push(font)
    return font
  }

  addPage(width: number, height: number): PdfPage {
    const page = new PdfPage(width, height)
    this.pages.push(page)
    return page
  }

  get pageCount(): number {
    return this.pages.length
  }

  private writeFont(font: PdfFont, index: number): number {
    const { ttf } = font
    const subset = subsetTtf(ttf, font.used)
    const tagName = `${String.fromCharCode(65 + (index % 26)).repeat(6)}+Guide${index}`
    const scale = 1000 / ttf.unitsPerEm

    const fileId = this.reserve()
    this.stream(fileId, `/Length1 ${subset.length}`, subset)

    const descriptorId = this.reserve()
    this.set(
      descriptorId,
      `<< /Type /FontDescriptor /FontName /${tagName} /Flags 4 /FontBBox [${ttf.bbox.map((v) => fmt(v * scale)).join(' ')}] /ItalicAngle 0 /Ascent ${fmt(ttf.ascender * scale)} /Descent ${fmt(ttf.descender * scale)} /CapHeight ${fmt(ttf.capHeight * scale)} /StemV 80 /FontFile2 ${fileId} 0 R >>`,
    )

    const gids = [...font.used].sort((a, b) => a - b)
    const widths = gids.map((g) => `${g} [${widthPer1000(ttf, g)}]`).join(' ')
    const cidId = this.reserve()
    this.set(
      cidId,
      `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${tagName} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${descriptorId} 0 R /DW 1000 /W [${widths}] /CIDToGIDMap /Identity >>`,
    )

    const entries = gids
      .filter((g) => font.unicode.has(g))
      .map((g) => {
        const cp = font.unicode.get(g)!
        const units = String.fromCodePoint(cp)
        let hex = ''
        for (let i = 0; i < units.length; i++) hex += units.charCodeAt(i).toString(16).padStart(4, '0')
        return `<${g.toString(16).padStart(4, '0')}> <${hex}>`
      })
    const blocks: string[] = []
    for (let i = 0; i < entries.length; i += 100) {
      const chunk = entries.slice(i, i + 100)
      blocks.push(`${chunk.length} beginbfchar\n${chunk.join('\n')}\nendbfchar`)
    }
    const cmap = [
      '/CIDInit /ProcSet findresource begin',
      '12 dict begin',
      'begincmap',
      '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def',
      '/CMapName /Adobe-Identity-UCS def',
      '/CMapType 2 def',
      '1 begincodespacerange',
      '<0000> <FFFF>',
      'endcodespacerange',
      ...blocks,
      'endcmap',
      'CMapName currentdict /CMap defineresource pop',
      'end',
      'end',
    ].join('\n')
    const toUnicodeId = this.reserve()
    this.stream(toUnicodeId, '', bytesOf(cmap))

    const type0Id = this.reserve()
    this.set(
      type0Id,
      `<< /Type /Font /Subtype /Type0 /BaseFont /${tagName} /Encoding /Identity-H /DescendantFonts [${cidId} 0 R] /ToUnicode ${toUnicodeId} 0 R >>`,
    )
    return type0Id
  }

  finish(): Uint8Array {
    const catalogId = this.reserve()
    const pagesId = this.reserve()
    const infoId = this.reserve()

    const fontIds = this.fonts.map((f, i) => ({ name: f.name, id: this.writeFont(f, i) }))
    const fontDict = `<< ${fontIds.map((f) => `/${f.name} ${f.id} 0 R`).join(' ')} >>`

    const pageIds: number[] = []
    for (const page of this.pages) {
      const contentId = this.reserve()
      this.stream(contentId, '', bytesOf(page.content()))
      const annots = page.annotations()
      const pageId = this.reserve()
      this.set(
        pageId,
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${fmt(page.width)} ${fmt(page.height)}] /Contents ${contentId} 0 R /Resources << /Font ${fontDict} /ProcSet [/PDF /Text] >>${
          annots.length ? ` /Annots [${annots.join(' ')}]` : ''
        } >>`,
      )
      pageIds.push(pageId)
    }

    this.set(pagesId, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`)
    this.set(
      catalogId,
      `<< /Type /Catalog /Pages ${pagesId} 0 R /Lang ${literal(this.meta.lang)} /PageMode /UseNone /ViewerPreferences << /DisplayDocTitle true >> >>`,
    )
    this.set(
      infoId,
      `<< /Title ${textString(this.meta.title)} /Author ${textString(this.meta.author)}${
        this.meta.subject ? ` /Subject ${textString(this.meta.subject)}` : ''
      }${this.meta.keywords ? ` /Keywords ${textString(this.meta.keywords)}` : ''} /Creator (Domlivo guide builder) /Producer (Domlivo guide builder) /CreationDate ${pdfDate(
        this.meta.creationDate,
      )} /ModDate ${pdfDate(this.meta.creationDate)} >>`,
    )

    const chunks: Uint8Array[] = []
    let offset = 0
    const push = (b: Uint8Array) => {
      chunks.push(b)
      offset += b.length
    }
    push(bytesOf('%PDF-1.4\n'))
    push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]))
    const offsets: number[] = []
    this.objects.forEach((obj, i) => {
      if (!obj) throw new Error(`PDF object ${i + 1} was reserved but never written`)
      offsets.push(offset)
      push(bytesOf(`${i + 1} 0 obj\n`))
      push(typeof obj.body === 'string' ? bytesOf(obj.body) : obj.body)
      push(bytesOf('\nendobj\n'))
    })
    const xrefAt = offset
    let xref = `xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \n`
    for (const o of offsets) xref += `${String(o).padStart(10, '0')} 00000 n \n`
    push(bytesOf(xref))
    push(
      bytesOf(
        `trailer\n<< /Size ${this.objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`,
      ),
    )

    const out = new Uint8Array(offset)
    let at = 0
    for (const c of chunks) {
      out.set(c, at)
      at += c.length
    }
    return out
  }
}
