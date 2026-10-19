/**
 * Live Domlivo Price Index figures inside CMS copy.
 *
 * An editor who wants the city's figure in a sentence, an FAQ answer or a meta
 * description writes a token instead of a number, so the copy can never drift
 * from the table (Durrës carried "about €1,450/m²" in its copy beside a live
 * €1,500 for weeks):
 *
 *   {{median:durres}}  → 1,500     median asking price per m², locale digits
 *   {{p20:durres}}     → 1,240     20th percentile per m²
 *   {{p80:durres}}     → 1,944     80th percentile per m²
 *   {{count:durres}}   → 511       flats in the sample
 *   {{date:durres}}    → 19 October 2026, in the page's language
 *
 * The currency sign and the unit stay in the copy ("€{{median:durres}}/m²"),
 * where each language already writes them its own way. A token for a city the
 * index does not have, or a figure it cannot compute, becomes "—".
 */
import { formatBlogDate } from "@/lib/date/formatLocale";
import { findIndexCity, type PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";

const TOKEN = /\{\{\s*(median|p20|p80|count|date)\s*:\s*([a-z0-9-]+)\s*\}\}/g;

export function replacePriceIndexTokens(text: string, snapshot: PriceIndexSnapshot | null, locale: string): string {
  if (!text.includes("{{")) return text;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  return text.replace(TOKEN, (_match, field: string, citySlug: string) => {
    const city = findIndexCity(snapshot, citySlug);
    if (!snapshot || !city) return "—";
    if (field === "date") return formatBlogDate(new Date(snapshot.computedAt), locale);
    const value = field === "count" ? city.count : city[field as "median" | "p20" | "p80"];
    return typeof value === "number" ? number.format(value) : "—";
  });
}

/**
 * Every string in a CMS document with its tokens replaced; a new tree, the
 * cached original untouched. Objects without a token come back as they were.
 */
export function interpolatePriceIndexTokens<T>(value: T, snapshot: PriceIndexSnapshot | null, locale: string): T {
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return v.includes("{{") ? replacePriceIndexTokens(v, snapshot, locale) : v;
    if (Array.isArray(v)) {
      let changed = false;
      const out = v.map((item) => {
        const next = walk(item);
        if (next !== item) changed = true;
        return next;
      });
      return changed ? out : v;
    }
    if (v && typeof v === "object") {
      let changed = false;
      const out: Record<string, unknown> = {};
      for (const [k, item] of Object.entries(v as Record<string, unknown>)) {
        const next = walk(item);
        if (next !== item) changed = true;
        out[k] = next;
      }
      return changed ? out : v;
    }
    return v;
  };
  return walk(value) as T;
}
