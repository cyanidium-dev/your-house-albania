/** Each language in its own name: a visitor looks for the one they read. */
export const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  uk: 'Українська',
  ru: 'Русский',
  sq: 'Shqip',
  it: 'Italiano',
  pl: 'Polski',
  de: 'Deutsch',
  fr: 'Français',
}

export function localeName(locale: string): string {
  return LOCALE_NAMES[locale] ?? locale.toUpperCase()
}
