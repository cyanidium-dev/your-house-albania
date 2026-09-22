import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown, substitute } from './markdown'

describe('parseInline', () => {
  it('splits bold and links out of plain text', () => {
    expect(parseInline('a **b** [c](https://x.y/z) d')).toEqual([
      { text: 'a ' },
      { text: 'b', bold: true },
      { text: ' ' },
      { text: 'c', href: 'https://x.y/z' },
      { text: ' d' },
    ])
  })

  it('leaves text without markup as one run', () => {
    expect(parseInline('€1,200–1,700/m²')).toEqual([{ text: '€1,200–1,700/m²' }])
  })
})

describe('parseMarkdown', () => {
  it('parses headings, paragraphs, lists, tables, notes and page breaks', () => {
    const blocks = parseMarkdown(
      [
        '# Title',
        '',
        'Para line one',
        'line two',
        '',
        '## Section',
        '- one',
        '- two',
        '  continued',
        '1. first',
        '2) second',
        '| A | B |',
        '|---|---|',
        '| 1 | 2 |',
        '> note text',
        '> more',
        '---',
        '### Sub',
      ].join('\n'),
    )
    expect(blocks.map((b) => b.kind)).toEqual([
      'heading',
      'paragraph',
      'heading',
      'list',
      'list',
      'table',
      'note',
      'pagebreak',
      'heading',
    ])
    const para = blocks[1]
    expect(para.kind === 'paragraph' && para.inlines[0].text).toBe('Para line one line two')
    const bullets = blocks[3]
    expect(bullets.kind === 'list' && !bullets.ordered && bullets.items.map((i) => i[0].text)).toEqual(['one', 'two continued'])
    const numbered = blocks[4]
    expect(numbered.kind === 'list' && numbered.ordered && numbered.items.length).toBe(2)
    const table = blocks[5]
    expect(table.kind === 'table' && table.header.map((c) => c[0].text)).toEqual(['A', 'B'])
    expect(table.kind === 'table' && table.rows[0].map((c) => c[0].text)).toEqual(['1', '2'])
    const note = blocks[6]
    expect(note.kind === 'note' && note.inlines[0].text).toBe('note text more')
    const sub = blocks[8]
    expect(sub.kind === 'heading' && sub.level).toBe(3)
  })

  it('handles CRLF sources', () => {
    const blocks = parseMarkdown('# A\r\n\r\nB\r\n')
    expect(blocks).toHaveLength(2)
  })
})

describe('substitute', () => {
  const data = { city: { medianPerSqm: '1,413' }, 'districts': { 'golem-durres': { flats: '79' } }, beds: { '1+1': { flats: '151' } } }

  it('replaces nested placeholders, including slugs with dashes and pluses', () => {
    expect(substitute('{{city.medianPerSqm}} / {{districts.golem-durres.flats}} / {{ beds.1+1.flats }}', data)).toBe(
      '1,413 / 79 / 151',
    )
  })

  it('throws on an unknown placeholder so a typo cannot ship', () => {
    expect(() => substitute('{{city.nope}}', data)).toThrow(/Unknown placeholder/)
  })
})
