/**
 * Just enough TrueType to embed a font in a PDF: the glyph lookup and advance
 * widths the typesetter needs, and a subsetter that keeps only the glyphs a
 * document uses so seven PDFs do not each carry a 900 KB font.
 *
 * Pure: bytes in, bytes out. No dependency, on purpose — the project has no
 * PDF or font library and the Hobby plan cannot afford one at request time,
 * so the guides are rendered once, at build time, by this code.
 *
 * Glyph ids are kept stable in the subset (unused glyphs become empty), which
 * is what a CIDFontType2 with an Identity CIDToGIDMap expects.
 */

export type TtfTable = { offset: number; length: number }

export type TtfFont = {
  bytes: Uint8Array
  tables: Map<string, TtfTable>
  unitsPerEm: number
  ascender: number
  descender: number
  capHeight: number
  bbox: [number, number, number, number]
  numGlyphs: number
  indexToLocFormat: number
  /** Unicode code point → glyph id (from the BMP format-4 cmap). */
  cmap: Map<number, number>
  /** Advance width per glyph id, font units. */
  advances: Uint16Array
  loca: Uint32Array
}

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

function tag(bytes: Uint8Array, at: number): string {
  return String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3])
}

function readTables(bytes: Uint8Array): Map<string, TtfTable> {
  const dv = view(bytes)
  const numTables = dv.getUint16(4)
  const tables = new Map<string, TtfTable>()
  for (let i = 0; i < numTables; i++) {
    const at = 12 + i * 16
    tables.set(tag(bytes, at), { offset: dv.getUint32(at + 8), length: dv.getUint32(at + 12) })
  }
  return tables
}

/** Format 4 (BMP) subtable of the (3,1) Unicode cmap, or the first Unicode one found. */
function readCmap(bytes: Uint8Array, table: TtfTable): Map<number, number> {
  const dv = view(bytes)
  const base = table.offset
  const n = dv.getUint16(base + 2)
  let chosen = -1
  for (let i = 0; i < n; i++) {
    const at = base + 4 + i * 8
    const platform = dv.getUint16(at)
    const encoding = dv.getUint16(at + 2)
    const offset = dv.getUint32(at + 4)
    const format = dv.getUint16(base + offset)
    if (format !== 4) continue
    if (platform === 3 && encoding === 1) {
      chosen = base + offset
      break
    }
    if (platform === 0 && chosen < 0) chosen = base + offset
  }
  const map = new Map<number, number>()
  if (chosen < 0) return map
  const segCountX2 = dv.getUint16(chosen + 6)
  const segCount = segCountX2 / 2
  const endAt = chosen + 14
  const startAt = endAt + segCountX2 + 2
  const deltaAt = startAt + segCountX2
  const rangeAt = deltaAt + segCountX2
  for (let s = 0; s < segCount; s++) {
    const end = dv.getUint16(endAt + s * 2)
    const start = dv.getUint16(startAt + s * 2)
    const delta = dv.getInt16(deltaAt + s * 2)
    const rangeOffset = dv.getUint16(rangeAt + s * 2)
    if (start === 0xffff) continue
    for (let c = start; c <= end; c++) {
      let gid: number
      if (rangeOffset === 0) {
        gid = (c + delta) & 0xffff
      } else {
        const glyphAt = rangeAt + s * 2 + rangeOffset + (c - start) * 2
        if (glyphAt + 1 >= bytes.length) continue
        gid = dv.getUint16(glyphAt)
        if (gid !== 0) gid = (gid + delta) & 0xffff
      }
      if (gid !== 0) map.set(c, gid)
    }
  }
  return map
}

export function parseTtf(bytes: Uint8Array): TtfFont {
  const dv = view(bytes)
  const tables = readTables(bytes)
  const need = (name: string): TtfTable => {
    const t = tables.get(name)
    if (!t) throw new Error(`TrueType font has no ${name} table`)
    return t
  }
  const head = need('head')
  const hhea = need('hhea')
  const maxp = need('maxp')
  const hmtx = need('hmtx')
  const loca = need('loca')
  need('glyf')

  const unitsPerEm = dv.getUint16(head.offset + 18)
  const indexToLocFormat = dv.getInt16(head.offset + 50)
  const bbox: [number, number, number, number] = [
    dv.getInt16(head.offset + 36),
    dv.getInt16(head.offset + 38),
    dv.getInt16(head.offset + 40),
    dv.getInt16(head.offset + 42),
  ]
  const ascender = dv.getInt16(hhea.offset + 4)
  const descender = dv.getInt16(hhea.offset + 6)
  const numberOfHMetrics = dv.getUint16(hhea.offset + 34)
  const numGlyphs = dv.getUint16(maxp.offset + 4)

  const advances = new Uint16Array(numGlyphs)
  let last = 0
  for (let g = 0; g < numGlyphs; g++) {
    if (g < numberOfHMetrics) last = dv.getUint16(hmtx.offset + g * 4)
    advances[g] = last
  }

  const locaArr = new Uint32Array(numGlyphs + 1)
  for (let g = 0; g <= numGlyphs; g++) {
    locaArr[g] = indexToLocFormat === 0 ? dv.getUint16(loca.offset + g * 2) * 2 : dv.getUint32(loca.offset + g * 4)
  }

  const os2 = tables.get('OS/2')
  let capHeight = Math.round(unitsPerEm * 0.7)
  if (os2 && dv.getUint16(os2.offset) >= 2 && os2.length >= 90) capHeight = dv.getInt16(os2.offset + 88)

  return {
    bytes,
    tables,
    unitsPerEm,
    ascender,
    descender,
    capHeight,
    bbox,
    numGlyphs,
    indexToLocFormat,
    cmap: readCmap(bytes, need('cmap')),
    advances,
    loca: locaArr,
  }
}

/** Glyph id for a code point; `0` (.notdef) when the font lacks it. */
export function glyphFor(font: TtfFont, codePoint: number): number {
  return font.cmap.get(codePoint) ?? 0
}

/** Advance width of a glyph in 1/1000 text-space units, as PDF widths are expressed. */
export function widthPer1000(font: TtfFont, gid: number): number {
  const adv = font.advances[gid] ?? 0
  return Math.round((adv * 1000) / font.unitsPerEm)
}

/** Component glyph ids of a composite glyph, so a subset keeps what "é" is built from. */
function componentsOf(font: TtfFont, gid: number): number[] {
  const glyf = font.tables.get('glyf')!
  const start = font.loca[gid]
  const end = font.loca[gid + 1]
  if (end <= start) return []
  const dv = view(font.bytes)
  const at = glyf.offset + start
  const contours = dv.getInt16(at)
  if (contours >= 0) return []
  const out: number[] = []
  let p = at + 10
  for (;;) {
    const flags = dv.getUint16(p)
    out.push(dv.getUint16(p + 2))
    p += 4
    p += flags & 0x0001 ? 4 : 2
    if (flags & 0x0008) p += 2
    else if (flags & 0x0040) p += 4
    else if (flags & 0x0080) p += 8
    if (!(flags & 0x0020)) break
  }
  return out
}

function checksum(bytes: Uint8Array): number {
  let sum = 0
  const dv = view(bytes)
  const whole = bytes.length - (bytes.length % 4)
  for (let i = 0; i < whole; i += 4) sum = (sum + dv.getUint32(i)) >>> 0
  if (whole < bytes.length) {
    const tail = new Uint8Array(4)
    tail.set(bytes.subarray(whole))
    sum = (sum + view(tail).getUint32(0)) >>> 0
  }
  return sum
}

function pad4(n: number): number {
  return (n + 3) & ~3
}

/** Tables a PDF reader needs for a CIDFontType2; everything else (layout, variations, names) is dropped. */
const KEEP_TABLES = ['OS/2', 'cmap', 'cvt ', 'fpgm', 'gasp', 'head', 'hhea', 'hmtx', 'maxp', 'prep'] as const

/**
 * Rebuilds the font with only `usedGids` (plus their composite parts) in
 * `glyf`; every other glyph has zero length. `loca` is written in the long
 * format and `head.indexToLocFormat` set to match.
 */
export function subsetTtf(font: TtfFont, usedGids: Iterable<number>): Uint8Array {
  const keep = new Set<number>([0])
  const stack = [...usedGids]
  while (stack.length) {
    const g = stack.pop()!
    if (g < 0 || g >= font.numGlyphs || keep.has(g)) continue
    keep.add(g)
    for (const c of componentsOf(font, g)) if (!keep.has(c)) stack.push(c)
  }

  const glyf = font.tables.get('glyf')!
  const loca = new Uint32Array(font.numGlyphs + 1)
  const chunks: Uint8Array[] = []
  let cursor = 0
  for (let g = 0; g < font.numGlyphs; g++) {
    loca[g] = cursor
    if (!keep.has(g)) continue
    const start = font.loca[g]
    const end = font.loca[g + 1]
    if (end <= start) continue
    const len = pad4(end - start)
    const chunk = new Uint8Array(len)
    chunk.set(font.bytes.subarray(glyf.offset + start, glyf.offset + end))
    chunks.push(chunk)
    cursor += len
  }
  loca[font.numGlyphs] = cursor
  const glyfBytes = new Uint8Array(cursor)
  let o = 0
  for (const c of chunks) {
    glyfBytes.set(c, o)
    o += c.length
  }
  const locaBytes = new Uint8Array(loca.length * 4)
  const locaView = view(locaBytes)
  loca.forEach((v, i) => locaView.setUint32(i * 4, v))

  const tables: Array<{ tag: string; data: Uint8Array }> = []
  for (const name of KEEP_TABLES) {
    const t = font.tables.get(name)
    if (!t) continue
    const data = new Uint8Array(font.bytes.subarray(t.offset, t.offset + t.length))
    if (name === 'head') {
      const dv = view(data)
      dv.setUint32(8, 0) // checkSumAdjustment, recomputed below
      dv.setInt16(50, 1) // long loca offsets
    }
    tables.push({ tag: name, data })
  }
  tables.push({ tag: 'glyf', data: glyfBytes })
  tables.push({ tag: 'loca', data: locaBytes })
  tables.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0))

  const numTables = tables.length
  const headerLen = 12 + numTables * 16
  let total = headerLen
  for (const t of tables) total += pad4(t.data.length)
  const out = new Uint8Array(total)
  const dv = view(out)
  dv.setUint32(0, 0x00010000)
  dv.setUint16(4, numTables)
  let maxPow = 1
  let log = 0
  while (maxPow * 2 <= numTables) {
    maxPow *= 2
    log++
  }
  dv.setUint16(6, maxPow * 16)
  dv.setUint16(8, log)
  dv.setUint16(10, numTables * 16 - maxPow * 16)

  let offset = headerLen
  let headAt = -1
  tables.forEach((t, i) => {
    const rec = 12 + i * 16
    out.set(new TextEncoder().encode(t.tag), rec)
    dv.setUint32(rec + 4, checksum(t.data))
    dv.setUint32(rec + 8, offset)
    dv.setUint32(rec + 12, t.data.length)
    out.set(t.data, offset)
    if (t.tag === 'head') headAt = offset
    offset += pad4(t.data.length)
  })
  if (headAt >= 0) {
    const adjust = (0xb1b0afba - checksum(out)) >>> 0
    dv.setUint32(headAt + 8, adjust)
  }
  return out
}
