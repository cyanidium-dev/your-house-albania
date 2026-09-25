/**
 * `og:locale` for a site locale. Open Graph wants `language_TERRITORY`; the
 * territory is the country where each language's readers of this site are,
 * not a linguistic claim.
 */
const OG_LOCALES: Record<string, string> = {
  en: "en_US",
  uk: "uk_UA",
  ru: "ru_RU",
  sq: "sq_AL",
  it: "it_IT",
  pl: "pl_PL",
  de: "de_DE",
};

export function ogLocale(locale: string | undefined): string | undefined {
  if (!locale) return undefined;
  return OG_LOCALES[locale];
}
