import { resolveLocalizedString, resolveLocalizedStringStrict } from "@/lib/sanity/localized";
import type {
  PurchaseCostCalcSectionDoc,
  RoiCalcPresetDoc,
  RoiCalcSectionDoc,
} from "@/lib/sanity/queries/landing";
import type { PurchaseCostItem } from "@/lib/calculators/purchaseCost";

/**
 * Text of the calculator sections for the standalone calculator pages.
 *
 * The source landing (`CALCULATOR_SOURCE_LANDING_SLUG`) is an English-only
 * page, so its labels, notes and disclaimers exist in Sanity in English alone.
 * The numbers (kind, value, cap, presets, tax rate) always come from Sanity;
 * the words come, in order, from the field's own value in the page's locale,
 * from `messages/*.json` → `CalculatorPages.cms` (keyed by the item's `_key`,
 * with the item's own figure passed in, so a changed fee never leaves a stale
 * number in a translation), and finally from the English value.
 */

/** Returns the message for `key`, or `null` when the locale has none. */
export type CmsTranslate = (key: string, values?: Record<string, string | number>) => string | null;

const SANITY_LOCALES = ["en", "uk", "ru", "sq", "it", "pl", "de", "fr"] as const;

/** A localized-field object carrying one resolved value under every key, for the section components. */
function everywhere(value: string): Record<string, string> {
  return Object.fromEntries(SANITY_LOCALES.map((l) => [l, value]));
}

function pick(
  field: unknown,
  locale: string,
  tr: CmsTranslate,
  key: string,
  values?: Record<string, string | number>,
): string {
  const english = resolveLocalizedString(field as never, "en");
  if (locale === "en") return english;
  return resolveLocalizedStringStrict(field as never, locale) || tr(key, values) || english;
}

export function formatPercent(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(value / 100);
}

export function formatEur(locale: string, amount: number): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    // "€", not the "EUR" code some locales (uk) print by default.
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type LocalizedCostItem = PurchaseCostItem & { key: string };

export type LocalizedPurchaseSection = {
  /** Shape `PurchaseCostCalcSection` reads; no title or subtitle (the page has its own H1). */
  section: {
    enabled: true;
    disclaimer: Record<string, string>;
    items: Array<{ _key: string; kind: string; value: number; capEur?: number; label: Record<string, string>; note?: Record<string, string> }>;
  };
  items: LocalizedCostItem[];
  disclaimer: string;
};

export function localizePurchaseSection(
  doc: PurchaseCostCalcSectionDoc | null,
  locale: string,
  tr: CmsTranslate,
): LocalizedPurchaseSection | null {
  if (!doc || doc.enabled === false) return null;
  const disclaimer = pick(doc.disclaimer, locale, tr, "cms.purchaseDisclaimer");
  if (!disclaimer) return null;

  const items: LocalizedCostItem[] = [];
  (Array.isArray(doc.items) ? doc.items : []).forEach((item, i) => {
    const kind = item.kind === "percent" ? "percent" : item.kind === "fixed" ? "fixed" : null;
    const value = Number(item.value);
    if (!kind || !Number.isFinite(value) || value < 0) return;
    const key = item._key || `item${i}`;
    const figure = kind === "percent" ? formatPercent(locale, value) : formatEur(locale, value);
    const values = { pct: figure, amount: figure };
    const label = pick(item.label, locale, tr, `cms.items.${key}.label`, values);
    if (!label) return;
    const note = pick(item.note, locale, tr, `cms.items.${key}.note`, values) || undefined;
    const capEur = Number(item.capEur);
    items.push({
      key,
      label,
      kind,
      value,
      ...(Number.isFinite(capEur) && capEur > 0 ? { capEur } : {}),
      ...(note ? { note } : {}),
    });
  });
  if (items.length === 0) return null;

  return {
    section: {
      enabled: true,
      disclaimer: everywhere(disclaimer),
      items: items.map((item) => ({
        _key: item.key,
        kind: item.kind,
        value: item.value,
        ...(item.capEur ? { capEur: item.capEur } : {}),
        label: everywhere(item.label),
        ...(item.note ? { note: everywhere(item.note) } : {}),
      })),
    },
    items,
    disclaimer,
  };
}

export type LocalizedPreset = {
  key: string;
  label: string;
  rentalType: "ltr" | "str";
  monthlyRentEur?: number;
  adrEur?: number;
  occupancyPct?: number;
  seasonNightsCap?: number;
  mgmtFeePct?: number;
};

export type LocalizedRoiSection = {
  /** Shape `RoiCalcSection` reads; no title or subtitle (the page has its own H1). */
  section: {
    enabled: true;
    disclaimer: Record<string, string>;
    taxRatePct: number;
    presets: Array<Omit<RoiCalcPresetDoc, "label"> & { label: Record<string, string> }>;
  };
  presets: LocalizedPreset[];
  taxRatePct: number;
  disclaimer: string;
};

export function localizeRoiSection(
  doc: RoiCalcSectionDoc | null,
  locale: string,
  tr: CmsTranslate,
): LocalizedRoiSection | null {
  if (!doc || doc.enabled === false) return null;
  const disclaimer = pick(doc.disclaimer, locale, tr, "cms.roiDisclaimer");
  if (!disclaimer) return null;
  // Same rule as `RoiCalcSection`: 15% when the field is empty.
  const taxRatePct = Number.isFinite(Number(doc.taxRatePct))
    ? Math.min(100, Math.max(0, Number(doc.taxRatePct)))
    : 15;

  const presets: LocalizedPreset[] = [];
  const raw: LocalizedRoiSection["section"]["presets"] = [];
  (Array.isArray(doc.presets) ? doc.presets : []).forEach((p, i) => {
    const rentalType = p.rentalType === "str" ? "str" : p.rentalType === "ltr" ? "ltr" : null;
    if (!rentalType) return;
    const key = p._key || String(i);
    const label = pick(p.label, locale, tr, `cms.presets.${key}`, {
      pct: formatPercent(locale, Number(p.mgmtFeePct) || 0),
    });
    if (!label) return;
    presets.push({
      key,
      label,
      rentalType,
      ...(typeof p.monthlyRentEur === "number" ? { monthlyRentEur: p.monthlyRentEur } : {}),
      ...(typeof p.adrEur === "number" ? { adrEur: p.adrEur } : {}),
      ...(typeof p.occupancyPct === "number" ? { occupancyPct: p.occupancyPct } : {}),
      ...(typeof p.seasonNightsCap === "number" ? { seasonNightsCap: p.seasonNightsCap } : {}),
      ...(typeof p.mgmtFeePct === "number" ? { mgmtFeePct: p.mgmtFeePct } : {}),
    });
    raw.push({ ...p, _key: key, label: everywhere(label) });
  });

  return {
    section: { enabled: true, disclaimer: everywhere(disclaimer), taxRatePct, presets: raw },
    presets,
    taxRatePct,
    disclaimer,
  };
}
