import { describe, expect, it } from 'vitest'
import { blocks, spans } from './assistantMarkdown'

describe('spans', () => {
  it('turns **bold** into a bold span instead of literal asterisks', () => {
    expect(spans('Валовая доходность: **9,0%** годовых')).toEqual([
      { kind: 'text', value: 'Валовая доходность: ' },
      { kind: 'bold', value: '9,0%' },
      { kind: 'text', value: ' годовых' },
    ])
  })

  it('handles italic in both spellings and inline code', () => {
    expect(spans('*раз* и _два_ и `код`')).toEqual([
      { kind: 'italic', value: 'раз' },
      { kind: 'text', value: ' и ' },
      { kind: 'italic', value: 'два' },
      { kind: 'text', value: ' и ' },
      { kind: 'code', value: 'код' },
    ])
  })

  it('leaves an unmatched marker as ordinary text', () => {
    // Prices like "2 * 3" and stray asterisks must not eat the rest of the line.
    expect(spans('цена ** без пары')).toEqual([{ kind: 'text', value: 'цена ** без пары' }])
  })

  it('prefers bold over italic on the same run', () => {
    expect(spans('**жирный**')).toEqual([{ kind: 'bold', value: 'жирный' }])
  })
})

describe('blocks', () => {
  it('keeps consecutive lines in one paragraph', () => {
    expect(blocks('первая строка\nвторая строка')).toEqual([
      { kind: 'p', lines: ['первая строка', 'вторая строка'] },
    ])
  })

  it('splits paragraphs on a blank line', () => {
    expect(blocks('раз\n\nдва')).toEqual([
      { kind: 'p', lines: ['раз'] },
      { kind: 'p', lines: ['два'] },
    ])
  })

  it('groups bullets into one list', () => {
    // What the assistant actually writes when it lists yield figures.
    expect(blocks('- Валовая: 9%\n- Чистая: 7,7%')).toEqual([
      { kind: 'ul', items: ['Валовая: 9%', 'Чистая: 7,7%'] },
    ])
  })

  it('accepts the three bullet markers the model mixes', () => {
    expect(blocks('- раз\n* два\n• три')).toEqual([{ kind: 'ul', items: ['раз', 'два', 'три'] }])
  })

  it('separates a list from the prose around it', () => {
    expect(blocks('Итого:\n- раз\nи всё')).toEqual([
      { kind: 'p', lines: ['Итого:'] },
      { kind: 'ul', items: ['раз'] },
      { kind: 'p', lines: ['и всё'] },
    ])
  })

  it('drops empty output rather than rendering blank nodes', () => {
    expect(blocks('')).toEqual([])
    expect(blocks('\n\n  \n')).toEqual([])
  })
})
