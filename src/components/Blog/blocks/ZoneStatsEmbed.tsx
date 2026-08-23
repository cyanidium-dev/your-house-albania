import Link from "next/link";
import { useTranslations } from "next-intl";
import { resolveLocalizedString } from "@/lib/sanity/localized";

export type ZoneStatsEmbedValue = {
  zone?: {
    _type?: string;
    title?: unknown;
    slug?: string;
    isPublished?: boolean;
    citySlug?: string;
    countrySlug?: string;
    metrics?: {
      priceAllMin?: number | null;
      priceAllMax?: number | null;
      priceNewMin?: number | null;
      priceNewMax?: number | null;
      priceResaleMin?: number | null;
      priceResaleMax?: number | null;
      grossYieldLtrPct?: number | null;
      periodLabel?: string | null;
      basis?: string | null;
      confidence?: string | null;
    } | null;
  } | null;
};

function band(min?: number | null, max?: number | null): string | null {
  if (typeof min !== "number" || typeof max !== "number") return null;
  return `€${min.toLocaleString("en-US")}–${max.toLocaleString("en-US")}/m²`;
}

/**
 * Inline card showing a zone's price bands, read from `zoneMetrics` at render
 * time rather than copied into the article. A tracker of numbers that can move
 * has no business being restated in prose.
 *
 * Renders nothing when the reference is missing, the zone is unpublished, or
 * the record has no band at all — a dangling reference must never reach a
 * reader as an error, and an empty card is worse than no card.
 *
 * Field coverage across the 60 live records, measured 2026-08-23: `priceAll`
 * 36, `priceNew` 18, `priceResale` 14, `grossYieldLtrPct` **0**. The yield row
 * is kept because the field exists and will fill, but nothing depends on it.
 */
export function ZoneStatsEmbed({ value, locale }: { value: ZoneStatsEmbedValue; locale: string }) {
  const t = useTranslations("Blog");
  const zone = value?.zone;
  if (!zone || zone.isPublished === false) return null;

  const m = zone.metrics;
  if (!m) return null;

  const rows: Array<{ label: string; value: string }> = [];
  const all = band(m.priceAllMin, m.priceAllMax);
  const fresh = band(m.priceNewMin, m.priceNewMax);
  const resale = band(m.priceResaleMin, m.priceResaleMax);
  if (all) rows.push({ label: t("zoneStatsAll"), value: all });
  if (fresh) rows.push({ label: t("zoneStatsNew"), value: fresh });
  if (resale) rows.push({ label: t("zoneStatsResale"), value: resale });
  if (typeof m.grossYieldLtrPct === "number") {
    rows.push({ label: t("zoneStatsYield"), value: `${m.grossYieldLtrPct}%` });
  }
  if (rows.length === 0) return null;

  const name = resolveLocalizedString(zone.title as never, locale) || zone.slug || "";
  // A city links to its own info page; a district sits under its city. Getting
  // this wrong builds /albania/vlore/districts/vlore, which 404s.
  const href = !zone.countrySlug || !zone.slug
    ? null
    : zone._type === "city"
      ? `/${locale}/${zone.countrySlug}/${zone.slug}/info`
      : zone.citySlug
        ? `/${locale}/${zone.countrySlug}/${zone.citySlug}/districts/${zone.slug}`
        : null;

  // The AEO formula asks for the confidence level beside the number: an
  // assistant quoting a range should be able to say how firm it is.
  const footnote = [m.periodLabel, m.basis, m.confidence].filter(Boolean).join(" · ");

  return (
    <aside className="border border-dark/10 dark:border-white/20 rounded-lg p-5 my-8">
      <p className="text-dark/60 dark:text-white/60 text-xs uppercase tracking-wide mb-1">
        {t("zoneStatsTitle")}
      </p>
      <p className="text-dark dark:text-white font-semibold mb-4">
        {href ? (
          <Link href={href} className="hover:text-primary">
            {name}
          </Link>
        ) : (
          name
        )}
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-dark/60 dark:text-white/60 text-xs">{r.label}</dt>
            <dd className="text-dark dark:text-white text-base font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
      {footnote && (
        <p className="text-dark/50 dark:text-white/50 text-xs mt-4">{footnote}</p>
      )}
    </aside>
  );
}
