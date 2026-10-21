import { translateContent } from '@/lib/i18n/contentTranslations';

/**
 * Resolves localized field from Sanity by project locale.
 * Sanity: en, uk, ru, sq, it, pl, de. Project: en, uk, ru, al, it, pl, de (al = sq).
 * `fr` has no values in Sanity (the dataset is at its attribute cap): its
 * text comes from the repository's translations of the English value
 * (`lib/i18n/contentTranslations.ts`), else English.
 */
const LOCALE_MAP: Record<string, string> = {
  en: 'en',
  uk: 'uk',
  ru: 'ru',
  sq: 'sq',
  al: 'sq',
  it: 'it',
  pl: 'pl',
  de: 'de',
  fr: 'fr',
};

export function resolveLocalizedString(
  field: { en?: string; uk?: string; ru?: string; sq?: string; it?: string; pl?: string; de?: string } | null | undefined,
  locale: string
): string {
  if (!field) return '';
  const key = LOCALE_MAP[locale] ?? 'en';
  const value = (field as Record<string, string>)[key];
  if (value != null) return value;
  return translateContent(key, field.en) ?? field.en ?? '';
}

/**
 * Same lookup, but without the English fallback: returns '' when the field has
 * no value for this exact locale.
 *
 * Use where an English string would be worse than a generated localized one —
 * a Polish visitor reading an English <title> is a lost click, and the loose
 * resolver cannot tell "authored in English" from "fell back to English".
 */
export function resolveLocalizedStringStrict(
  field: { en?: string; uk?: string; ru?: string; sq?: string; it?: string; pl?: string; de?: string } | null | undefined,
  locale: string
): string {
  if (!field) return '';
  const key = LOCALE_MAP[locale] ?? 'en';
  const value = (field as Record<string, string>)[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  return translateContent(key, field.en)?.trim() ?? '';
}

/** Resolves localized portable text (content) by locale. Returns block array. */
/**
 * Plain text → Portable Text paragraphs, one block per blank-line-separated
 * paragraph. The catalog SEO fields (`catalogSeoPage.intro`, `bottomText`)
 * are `localizedText` — strings — while the pages render them with
 * `PortableText`; the resolver used to hand a string to an array check and
 * every catalog page silently dropped its copy. Keys are deterministic so a
 * re-render does not remount the paragraphs.
 */
export function textToPortableBlocks(text: string, keyPrefix = 'p'): unknown[] {
  return text
    .split(/\n\s*\n/)
    .map((para) => para.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((para, i) => ({
      _type: 'block',
      _key: `${keyPrefix}-${i}`,
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: `${keyPrefix}-${i}-0`, text: para, marks: [] }],
    }));
}

type LocalizedContentValue = unknown[] | string;

export function resolveLocalizedContent(
  field:
    | {
        en?: LocalizedContentValue;
        uk?: LocalizedContentValue;
        ru?: LocalizedContentValue;
        sq?: LocalizedContentValue;
        it?: LocalizedContentValue;
        pl?: LocalizedContentValue;
        de?: LocalizedContentValue;
      }
    | unknown[]
    | string
    | null
    | undefined,
  locale: string
): unknown[] {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') return textToPortableBlocks(field);
  const key = LOCALE_MAP[locale] ?? 'en';
  const own = (field as Record<string, unknown>)[key];
  const en = (field as Record<string, unknown>).en;
  if (own == null && key !== 'en') {
    if (typeof en === 'string') {
      const text = translateContent(key, en);
      if (text) return textToPortableBlocks(text, key);
    } else if (Array.isArray(en)) {
      return translatePortableBlocks(en, key);
    }
  }
  const value = own ?? en;
  if (Array.isArray(value)) return value;
  // A `localizedText` field: the editor typed prose, not blocks.
  if (typeof value === 'string') return textToPortableBlocks(value, key);
  return [];
}

type PortableSpan = { _type?: string; text?: string; marks?: unknown[] };
type PortableBlock = { _type?: string; _key?: string; children?: PortableSpan[]; markDefs?: unknown[] };

/**
 * English Portable Text in a locale whose text lives in the repository: each
 * plain paragraph (no links or other annotations) with a translation becomes
 * one span of the translated text; anything else stays as it is, so a link
 * is never dropped to make a paragraph read in the other language.
 */
function translatePortableBlocks(blocks: unknown[], locale: string): unknown[] {
  return blocks.map((raw) => {
    const block = raw as PortableBlock;
    if (block?._type !== 'block' || !Array.isArray(block.children) || (block.markDefs?.length ?? 0) > 0) return raw;
    const text = translateContent(locale, block.children.map((c) => c.text ?? '').join(''));
    if (!text) return raw;
    return { ...block, children: [{ _type: 'span', _key: `${block._key ?? 'b'}-${locale}`, text, marks: [] }] };
  });
}
