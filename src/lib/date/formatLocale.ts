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

/** Locale-appropriate date format for blog: day-first (d MMM yyyy) for EU locales, month-first for en. */
const BLOG_DATE_FORMAT: Record<string, string> = {
  en: "MMM d, yyyy",
  uk: "d MMM yyyy",
  ru: "d MMM yyyy",
  sq: "d MMM yyyy",
  al: "d MMM yyyy",
  it: "d MMM yyyy",
};

/** Format a date for blog UI using locale-appropriate format. */
export function formatBlogDate(date: Date, appLocale: string): string {
  const formatStr = BLOG_DATE_FORMAT[appLocale] ?? BLOG_DATE_FORMAT.en;
  return formatDateLocale(date, formatStr, appLocale);
}
