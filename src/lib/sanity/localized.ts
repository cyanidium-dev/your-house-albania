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
export function resolveLocalizedContent(
  field:
    | { en?: unknown[]; uk?: unknown[]; ru?: unknown[]; sq?: unknown[]; it?: unknown[]; pl?: unknown[] }
    | unknown[]
    | null
    | undefined,
  locale: string
): unknown[] {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  const key = LOCALE_MAP[locale] ?? 'en';
  const arr = (field as Record<string, unknown[]>)[key] ?? (field as Record<string, unknown[]>).en;
  return Array.isArray(arr) ? arr : [];
}
