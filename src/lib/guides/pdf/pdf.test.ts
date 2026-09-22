import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME, layoutGuide } from './layout'
import { parseMarkdown } from './markdown'
import { glyphFor, parseTtf, subsetTtf, widthPer1000 } from './ttf'
import { measure, PdfDocument } from './writer'

const FONT = resolve(__dirname, '../../../../scripts/data/durres-guide/fonts/Inter-Regular.ttf')
const ttfBytes = new Uint8Array(readFileSync(FONT))

describe('ttf', () => {
  const font = parseTtf(ttfBytes)

  it('maps the characters the seven locales need to glyphs', () => {
    for (const ch of 'AaëçËÇłąęśżźćńóüößÜÄÖ€²–„”«»АяЁёІіЇїЄєҐґ') {
      expect(glyphFor(font, ch.codePointAt(0)!), ch).toBeGreaterThan(0)
    }
    expect(glyphFor(font, 0x1f600)).toBe(0)
  })

  it('reads advance widths in 1/1000 em', () => {
    const space = widthPer1000(font, glyphFor(font, 0x20))
    const m = widthPer1000(font, glyphFor(font, 0x4d))
    expect(space).toBeGreaterThan(100)
    expect(m).toBeGreaterThan(space)
  })

  it('writes a smaller font that still parses and keeps the used glyphs', () => {
    const used = new Set(['D', 'u', 'r', 'ë', 's', 'Ж'].map((c) => glyphFor(font, c.codePointAt(0)!)))
    const subset = subsetTtf(font, used)
    expect(subset.length).toBeLessThan(ttfBytes.length / 4)
    const again = parseTtf(subset)
    expect(again.numGlyphs).toBe(font.numGlyphs)
    expect(again.unitsPerEm).toBe(font.unitsPerEm)
    for (const g of used) {
      expect(again.loca[g + 1] - again.loca[g], `glyph ${g} kept`).toBeGreaterThan(0)
      expect(again.advances[g]).toBe(font.advances[g])
    }
    // An unused glyph is empty in the subset.
    const unused = glyphFor(font, 'Q'.codePointAt(0)!)
    expect(again.loca[unused + 1] - again.loca[unused]).toBe(0)
    expect(again.indexToLocFormat).toBe(1)
  })
})

describe('PdfDocument', () => {
  it('produces a parseable PDF with the text, a link and one embedded font', () => {
    const doc = new PdfDocument({ title: 'Tëst — Дуррес', author: 'Domlivo', lang: 'sq', creationDate: new Date('2026-09-20T00:00:00Z') })
    const font = doc.addFont(ttfBytes)
    const page = doc.addPage(595.28, 841.89)
    page.text(font, 12, 50, 800, 'Përshëndetje Дуррес', { bold: true })
    page.link(50, 795, 100, 14, 'https://www.domlivo.com/sq/albania/durres')
    const bytes = doc.finish()
    const text = Buffer.from(bytes).toString('latin1')

    expect(text.startsWith('%PDF-1.4\n')).toBe(true)
    expect(text.endsWith('%%EOF\n')).toBe(true)
    expect(text).toContain('/Type /Catalog')
    expect(text).toContain('/Lang (sq)')
    expect(text).toContain('/Subtype /CIDFontType2')
    expect(text).toContain('/CIDToGIDMap /Identity')
    expect(text).toContain('/URI (https://www.domlivo.com/sq/albania/durres)')
    expect(text).toContain('/Title <FEFF')
    expect(text).toContain('/Count 1')

    // The xref offsets point at the objects they claim to.
    const startxref = Number(/startxref\n(\d+)\n%%EOF/.exec(text)![1])
    expect(text.slice(startxref, startxref + 4)).toBe('xref')
    const entries = text.slice(startxref).split('\n').filter((l) => /^\d{10} 00000 n $/.test(l))
    expect(entries.length).toBeGreaterThan(5)
    entries.forEach((line, i) => {
      const at = Number(line.slice(0, 10))
      expect(text.slice(at, at + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`)
    })

    // The content stream inflates to the drawing operators.
    const m = /<< \/Length (\d+) \/Filter \/FlateDecode >>\nstream\n/g
    let found = false
    for (const hit of text.matchAll(m)) {
      const start = hit.index! + hit[0].length
      const len = Number(hit[1])
      const inflated = inflateSync(Buffer.from(bytes.subarray(start, start + len))).toString('latin1')
      if (inflated.includes(' Tj')) {
        found = true
        expect(inflated).toContain('/F1 12 Tf')
        expect(inflated).toContain('2 Tr')
      }
    }
    expect(found).toBe(true)
    expect(font.used.size).toBeGreaterThan(10)
  })

  it('measures text from the font widths', () => {
    const doc = new PdfDocument({ title: 't', author: 'a', lang: 'en', creationDate: new Date(0) })
    const font = doc.addFont(ttfBytes)
    expect(measure(font, 'Durrës', 10)).toBeGreaterThan(measure(font, 'Durr', 10))
    expect(measure(font, '', 10)).toBe(0)
  })
})

describe('layoutGuide', () => {
  it('flows a document over pages, repeats nothing it should not and honours page breaks', () => {
    const long = Array.from({ length: 40 }, (_, i) => `Paragraph ${i} ${'word '.repeat(60)}`).join('\n\n')
    const blocks = parseMarkdown(`# Title\n\n${long}\n\n---\n\n## After the break\n\nText.`)
    const doc = new PdfDocument({ title: 't', author: 'a', lang: 'en', creationDate: new Date(0) })
    const font = doc.addFont(ttfBytes)
    const pages = layoutGuide(doc, { ...DEFAULT_THEME, font }, { blocks, brand: 'Domlivo', footer: 'Footer', pageLabel: '{page}/{pages}' }, 9)
    expect(pages).toBeGreaterThan(3)
    expect(doc.pageCount).toBe(pages)
    const bytes = doc.finish()
    expect(bytes.length).toBeGreaterThan(1000)
  })

  it('splits a long table across pages and repeats the header', () => {
    const rows = Array.from({ length: 80 }, (_, i) => `| Row ${i} | value ${i} |`).join('\n')
    const blocks = parseMarkdown(`| Name | Value |\n|---|---|\n${rows}`)
    const doc = new PdfDocument({ title: 't', author: 'a', lang: 'en', creationDate: new Date(0) })
    const font = doc.addFont(ttfBytes)
    const pages = layoutGuide(doc, { ...DEFAULT_THEME, font }, { blocks, brand: 'Domlivo', footer: 'Footer', pageLabel: '{page}' })
    expect(pages).toBeGreaterThan(1)
    expect(doc.pageCount).toBe(pages)
  })
})
