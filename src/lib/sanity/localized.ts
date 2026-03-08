/**
 * Resolves localized field from Sanity by project locale.
 * Sanity: en, uk, ru, sq, it. Project: en, uk, ru, al, it (al = sq).
 */
const LOCALE_MAP: Record<string, string> = {
  en: 'en',
  uk: 'uk',
  ru: 'ru',
  al: 'sq',
  it: 'it',
};

export function resolveLocalizedString(
  field: { en?: string; uk?: string; ru?: string; sq?: string; it?: string } | null | undefined,
  locale: string
): string {
  if (!field) return '';
  const key = LOCALE_MAP[locale] ?? 'en';
  return (field as Record<string, string>)[key] ?? field.en ?? '';
}

/** Resolves localized portable text (content) by locale. Returns block array. */
export function resolveLocalizedContent(
  field:
    | { en?: unknown[]; uk?: unknown[]; ru?: unknown[]; sq?: unknown[]; it?: unknown[] }
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
