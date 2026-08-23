import Link from "next/link";
import { useTranslations } from "next-intl";
import { resolveLocalizedString } from "@/lib/sanity/localized";

export type ZoneStatsEmbedValue = {
  zone?: {
    title?: unknown;
    slug?: string;
    isPublished?: boolean;
    citySlug?: string;
    countrySlug?: string;
    metrics?: {
      priceNewMin?: number;
      priceNewMax?: number;
      priceResaleMin?: number;
      priceResaleMax?: number;
      grossYield?: number;
      period?: string;
    } | null;
  } | null;
};

function band(min?: number, max?: number): string | null {
  if (typeof min !== "number" || typeof max !== "number") return null;
  return `€${min.toLocaleString("en-US")}–${max.toLocaleString("en-US")}/m²`;
}

/**
 * Inline card showing a zone's price band and yield, read from `zoneMetrics`
 * at render time rather than copied into the article.
 *
 * Renders nothing when the reference is missing, the zone is unpublished, or
 * there are no metrics — a dangling reference must never reach a reader as an
 * error, and an empty card is worse than no card.
 */
export function ZoneStatsEmbed({ value, locale }: { value: ZoneStatsEmbedValue; locale: string }) {
  const t = useTranslations("Blog");
  const zone = value?.zone;
  if (!zone || zone.isPublished === false) return null;

  const metrics = zone.metrics;
  if (!metrics) return null;

  const rows = [
    band(metrics.priceNewMin, metrics.priceNewMax),
    band(metrics.priceResaleMin, metrics.priceResaleMax),
  ].filter((r): r is string => Boolean(r));
  const yieldPct = typeof metrics.grossYield === "number" ? `${metrics.grossYield}%` : null;
  if (rows.length === 0 && !yieldPct) return null;

  const name = resolveLocalizedString(zone.title as never, locale) || zone.slug || "";
  const href =
    zone.countrySlug && zone.citySlug && zone.slug
      ? `/${locale}/${zone.countrySlug}/${zone.citySlug}/districts/${zone.slug}`
      : null;

  return (
    <aside className="border border-dark/10 dark:border-white/20 rounded-lg p-5 my-8">
      <p className="text-dark/60 dark:text-white/60 text-xs uppercase tracking-wide mb-1">
        {t("zoneStatsTitle")}
      </p>
      <p className="text-dark dark:text-white font-semibold mb-3">
        {href ? (
          <Link href={href} className="hover:text-primary">
            {name}
          </Link>
        ) : (
          name
        )}
      </p>
      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        {rows.map((r, i) => (
          <div key={i}>
            <dd className="text-dark dark:text-white text-base">{r}</dd>
          </div>
        ))}
        {yieldPct && (
          <div>
            <dd className="text-dark dark:text-white text-base">{yieldPct}</dd>
          </div>
        )}
      </dl>
      {metrics.period && (
        <p className="text-dark/50 dark:text-white/50 text-xs mt-3">{metrics.period}</p>
      )}
    </aside>
  );
}
