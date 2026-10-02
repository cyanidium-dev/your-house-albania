import Link from "@/components/shared/Link";
import { getTranslations } from "next-intl/server";
import { MarketMoney } from "@/components/shared/property/MarketMoney";
import { BuyingCostsSection } from "@/components/catalog/geoListing/BuyingCostsSection";
import { fetchCatalogFilterOptions, fetchNationalListingPriceIndex, fetchSeoPageDecisions } from "@/lib/sanity/client";
import { catalogFilterPath } from "@/lib/routes/catalog";
import { canonicalNonGeoDealListingPath } from "@/lib/routes/listingRouteResolver";
import { printablePriceFacts } from "@/lib/catalog/listingDepth";
import { hubCities, hubCityDistricts, hubTypes } from "@/lib/catalog/saleHubDepth";
import { Section, SectionHeading } from "@/components/shared/layout";
import {
  StatTiles,
  chipClass,
  chipLinkClass,
  countClass,
  noteClass,
  subheadClass,
  textLinkClass,
} from "@/components/catalog/depthUi";

const cellClass = "px-4 sm:px-5 py-3.5 text-right tabular-nums whitespace-nowrap";

/** A price table with one row says what the tiles above it already said. */
const MIN_PRICE_TABLE_ROWS = 2;

/**
 * What the national `/sale` hub says under its cards: what homes cost across
 * the country and city by city, where the stock is, how it splits by type, and
 * what buying costs a foreigner.
 *
 * The hub ranks for "property for sale in Albania" in seven languages and used
 * to end at the grid, with no `<h2>` at all. Every figure here is computed from
 * the live listings by the arithmetic the city pages use
 * (`lib/catalog/listingPriceSummary`), in one tag-cached query; what may be
 * printed and what may be linked is decided in `lib/catalog/saleHubDepth`.
 *
 * Rendered by the bare, indexable hub only (`NonGeoDealListingPage`).
 *
 * No FAQ: the CMS has no questions written for this page (the nearest set
 * belongs to `/investment/sale`), and none are invented here.
 */
export async function SaleHubDepthSections({ locale }: { locale: string }) {
  const [t, tDepth, tFacts, tTypes, index, decisions, options] = await Promise.all([
    getTranslations({ locale, namespace: "Catalog.saleHub" }),
    getTranslations({ locale, namespace: "Catalog.depth" }),
    getTranslations({ locale, namespace: "Catalog.facts" }),
    getTranslations({ locale, namespace: "Seo.listing.types" }),
    fetchNationalListingPriceIndex(),
    fetchSeoPageDecisions(),
    fetchCatalogFilterOptions(locale),
  ]);

  const rows = decisions ?? [];
  const facts = printablePriceFacts(index?.national);
  const cities = index ? hubCities({ cities: index.cities, rows, locale }) : [];
  const cityDistricts = hubCityDistricts({ cities, rows, locale });
  // Rendered on the indexable hub only, so the catalogue-wide CMS noindex is off here.
  const types = index ? hubTypes({ types: index.types, hubNoindex: false }) : [];
  const priceRows = cities.filter((c) => c.inPriceTable);
  const showPriceTable = priceRows.length >= MIN_PRICE_TABLE_ROWS;

  const number = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const asOf = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Tirane" }).format(
    new Date(),
  );
  const cityLabel = (slug: string) => options.locations.find((l) => l.value.toLowerCase() === slug)?.label || slug;
  const districtLabel = (slug: string) => options.districts.find((d) => d.value.toLowerCase() === slug)?.label || slug;
  const typeLabel = (slug: string) =>
    (tTypes.has(slug) ? tTypes(slug) : "") || options.propertyTypes.find((p) => p.value.toLowerCase() === slug)?.label || slug;
  const cityHref = (city: { citySlug: string; countrySlug: string | null }) =>
    catalogFilterPath({
      locale,
      country: city.countrySlug ?? undefined,
      trustedCityCountrySlug: city.countrySlug ?? undefined,
      city: city.citySlug,
    });
  const cityName = (city: (typeof cities)[number], className: string) =>
    city.linkable && city.countrySlug ? (
      <Link href={cityHref(city)} className={className}>
        {cityLabel(city.citySlug)}
      </Link>
    ) : (
      cityLabel(city.citySlug)
    );

  const stats: Array<{ label: string; value: React.ReactNode }> = facts
    ? [
        { label: tDepth("prices.listings"), value: number(facts.count) },
        ...(facts.medianFlatPrice
          ? [{ label: tDepth("prices.medianPrice"), value: <MarketMoney min={facts.medianFlatPrice} step={100} locale={locale} /> }]
          : []),
        ...(facts.medianFlatPricePerSqm
          ? [{ label: tDepth("prices.medianSqm"), value: <MarketMoney min={facts.medianFlatPricePerSqm} step={10} locale={locale} /> }]
          : []),
        ...(facts.flatPriceFrom
          ? [{ label: tDepth("prices.from"), value: <MarketMoney min={facts.flatPriceFrom} step={100} locale={locale} /> }]
          : []),
      ]
    : [];

  return (
    <>
      {facts ? (
        <Section aria-labelledby="hub-prices">
          <SectionHeading id="hub-prices" title={t("prices.title")} lead={tDepth("prices.lead")} />
          <StatTiles stats={stats} />
          {showPriceTable ? (
            <div className="mt-8 overflow-x-auto rounded-2xl border border-dark/10 dark:border-white/15">
              <table className="w-full border-collapse text-left text-sm sm:text-base text-dark dark:text-white">
                <caption className="sr-only">{t("prices.byCity")}</caption>
                <thead className="bg-dark/[0.04] dark:bg-white/5">
                  <tr>
                    <th scope="col" className="px-4 sm:px-5 py-3.5 font-semibold border-b border-dark/10 dark:border-white/15">
                      {t("prices.city")}
                    </th>
                    <th scope="col" className={`${cellClass} font-semibold border-b border-dark/10 dark:border-white/15`}>
                      {tDepth("prices.listings")}
                    </th>
                    <th scope="col" className={`${cellClass} font-semibold border-b border-dark/10 dark:border-white/15`}>
                      {tDepth("prices.medianPrice")}
                    </th>
                    <th scope="col" className={`${cellClass} font-semibold border-b border-dark/10 dark:border-white/15`}>
                      {tDepth("prices.medianSqm")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {priceRows.map((city) => (
                    <tr key={city.citySlug} className="even:bg-dark/[0.02] dark:even:bg-white/[0.03]">
                      <th scope="row" className="px-4 sm:px-5 py-3.5 font-medium border-t border-dark/5 dark:border-white/10">
                        {cityName(city, textLinkClass)}
                      </th>
                      <td className={`${cellClass} border-t border-dark/5 dark:border-white/10`}>{number(city.count)}</td>
                      <td className={`${cellClass} border-t border-dark/5 dark:border-white/10`}>
                        {city.medianFlatPrice ? <MarketMoney min={city.medianFlatPrice} step={100} locale={locale} /> : "—"}
                      </td>
                      <td className={`${cellClass} border-t border-dark/5 dark:border-white/10`}>
                        {city.medianFlatPricePerSqm ? (
                          <MarketMoney min={city.medianFlatPricePerSqm} step={10} locale={locale} />
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <p className={`mt-4 ${noteClass}`}>{tDepth("prices.asOf", { date: asOf, count: facts.count })}</p>
        </Section>
      ) : null}

      {cities.length > 0 ? (
        <Section aria-labelledby="hub-cities">
          <SectionHeading id="hub-cities" title={t("cities.title")} />
          <ul className="flex flex-wrap gap-2">
            {cities.map((city) => {
              const body = (
                <>
                  {cityLabel(city.citySlug)}
                  <span className={countClass}>{tFacts("count", { count: city.count })}</span>
                </>
              );
              return (
                <li key={city.citySlug}>
                  {city.linkable && city.countrySlug ? (
                    <Link href={cityHref(city)} className={chipLinkClass}>
                      {body}
                    </Link>
                  ) : (
                    <span className={chipClass}>{body}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {cityDistricts.map((group) => (
            <div key={group.citySlug}>
              <h3 className={`mt-8 ${subheadClass}`}>{t("cities.districts", { city: cityLabel(group.citySlug) })}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.districts.map((d) => (
                  <li key={d.district}>
                    <Link
                      href={catalogFilterPath({
                        locale,
                        country: group.countrySlug,
                        trustedCityCountrySlug: group.countrySlug,
                        city: group.citySlug,
                        district: d.district,
                      })}
                      className={chipLinkClass}
                    >
                      {districtLabel(d.district)}
                      <span className={countClass}>{number(d.count)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      ) : null}

      {types.length > 0 ? (
        <Section aria-labelledby="hub-types">
          <SectionHeading id="hub-types" title={t("types.title")} />
          <ul className="flex flex-wrap gap-2">
            {types.map((type) => {
              const body = (
                <>
                  {typeLabel(type.typeSlug)}
                  <span className={countClass}>{number(type.count)}</span>
                </>
              );
              return (
                <li key={type.typeSlug}>
                  {type.linkable ? (
                    <Link href={canonicalNonGeoDealListingPath(locale, "sale", type.typeSlug)} className={chipLinkClass}>
                      {body}
                    </Link>
                  ) : (
                    <span className={chipClass}>{body}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      <BuyingCostsSection locale={locale} medianFlatPrice={facts?.medianFlatPrice ?? null} />
    </>
  );
}
