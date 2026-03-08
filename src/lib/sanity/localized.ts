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
