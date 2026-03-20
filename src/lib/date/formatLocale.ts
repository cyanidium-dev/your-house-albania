/**
 * Maps app locale codes to date-fns locale for locale-aware date formatting.
 * Fallback to enUS for unknown locales.
 */
import { format as formatDate } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { uk } from "date-fns/locale/uk";
import { ru } from "date-fns/locale/ru";
import { sq } from "date-fns/locale/sq";
import { it } from "date-fns/locale/it";

const LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  uk,
  ru,
  sq,
  al: sq,
  it,
};

type Locale = typeof enUS;

export function getDateFnsLocale(appLocale: string): Locale {
  return LOCALE_MAP[appLocale] ?? enUS;
}

/**
 * Format a date with locale-aware month/day names.
 */
export function formatDateLocale(
  date: Date,
  formatStr: string,
  appLocale: string
): string {
  const locale = getDateFnsLocale(appLocale);
  return formatDate(date, formatStr, { locale });
}
