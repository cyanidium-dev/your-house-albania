/**
 * Resolves localized field from Sanity by project locale.
 * Sanity: en, uk, ru, sq, it, pl. Project: en, uk, ru, al, it, pl (al = sq).
 */
const LOCALE_MAP: Record<string, string> = {
  en: 'en',
  uk: 'uk',
  ru: 'ru',
  sq: 'sq',
  al: 'sq',
  it: 'it',
  pl: 'pl',
};

export function resolveLocalizedString(
  field: { en?: string; uk?: string; ru?: string; sq?: string; it?: string; pl?: string } | null | undefined,
  locale: string
): string {
  if (!field) return '';
  const key = LOCALE_MAP[locale] ?? 'en';
  return (field as Record<string, string>)[key] ?? field.en ?? '';
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
  field: { en?: string; uk?: string; ru?: string; sq?: string; it?: string; pl?: string } | null | undefined,
  locale: string
): string {
  if (!field) return '';
  const key = LOCALE_MAP[locale] ?? 'en';
  const value = (field as Record<string, string>)[key];
  return typeof value === 'string' ? value.trim() : '';
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
  const value = (field as Record<string, unknown>)[key] ?? (field as Record<string, unknown>).en;
  if (Array.isArray(value)) return value;
  // A `localizedText` field: the editor typed prose, not blocks.
  if (typeof value === 'string') return textToPortableBlocks(value, key);
  return [];
}
