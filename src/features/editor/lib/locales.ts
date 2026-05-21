/**
 * Locales the editor is allowed to switch between.
 *
 * Mirrors `routing.locales` from `src/i18n/routing.ts` but stays decoupled so
 * the editor module does not depend on `next-intl` internals beyond message
 * loading.
 */
export const EDITOR_LOCALES = ['en', 'ru', 'sq', 'it', 'uk'] as const;
export type Locale = (typeof EDITOR_LOCALES)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (EDITOR_LOCALES as readonly string[]).includes(value);
}

export function coerceLocale(value: unknown, fallback: Locale = 'en'): Locale {
  return isLocale(value) ? value : fallback;
}
