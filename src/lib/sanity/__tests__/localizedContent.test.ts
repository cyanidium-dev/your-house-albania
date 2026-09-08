import { describe, expect, it } from 'vitest';
import { resolveLocalizedContent, textToPortableBlocks } from '../localized';

describe('textToPortableBlocks', () => {
  it('makes one paragraph block per blank-line-separated paragraph', () => {
    const blocks = textToPortableBlocks('First para.\n\nSecond para,\nsame paragraph.\n\n\n') as Array<{
      _type: string;
      children: Array<{ text: string }>;
    }>;
    expect(blocks).toHaveLength(2);
    expect(blocks[0]._type).toBe('block');
    expect(blocks[0].children[0].text).toBe('First para.');
    expect(blocks[1].children[0].text).toBe('Second para, same paragraph.');
  });

  it('returns nothing for empty text', () => {
    expect(textToPortableBlocks('   \n\n ')).toEqual([]);
  });
});

describe('resolveLocalizedContent', () => {
  it('keeps Portable Text arrays as they are', () => {
    const blocks = [{ _type: 'block', children: [] }];
    expect(resolveLocalizedContent({ sq: blocks }, 'sq')).toBe(blocks);
  });

  it('turns a localizedText string into paragraphs — the catalog SEO copy case', () => {
    const out = resolveLocalizedContent({ sq: 'Katalogu i pronave.\n\nFiltro sipas çmimit.' }, 'sq') as Array<{
      children: Array<{ text: string }>;
    }>;
    expect(out).toHaveLength(2);
    expect(out[1].children[0].text).toBe('Filtro sipas çmimit.');
  });

  it('falls back to English when the locale is empty', () => {
    const out = resolveLocalizedContent({ en: 'Only English.' }, 'pl') as Array<{ children: Array<{ text: string }> }>;
    expect(out[0].children[0].text).toBe('Only English.');
  });
});
