import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { MarketMoney } from "@/components/shared/property/MarketMoney";
import {
  fetchCityLandingByCitySlug,
  fetchCityListingPriceIndex,
  fetchDistrictBySlugs,
  fetchDistrictListingCounts,
  fetchPlaceFaqItems,
  fetchSeoPageDecisions,
} from "@/lib/sanity/client";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { catalogFilterPath, cityInfoPath, districtInfoPath } from "@/lib/routes/catalog";
import { resolveLocaleHref } from "@/lib/routes/resolveLocaleHref";
import { resolveCityDisplayName } from "@/lib/seo/listingSeoCopy";
import {
  LISTING_FAQ_MIN,
  districtLinkTargets,
  pickListingFaq,
  placePriceFacts,
  placeSliceCounts,
} from "@/lib/catalog/listingDepth";
import { resolveListingFaqItems } from "@/lib/catalog/listingFaq";
import { BuyingCostsSection } from "@/components/catalog/geoListing/BuyingCostsSection";
import type { SeoContentSection } from "@/lib/seo/pages";

type Props = {
  locale: string;
  countrySlug: string;
  citySlug: string;
  /** The city's name in this locale, nominative ("Durrës", "Durazzo"). */
  cityLabel: string;
  districtSlug?: string;
  districtLabel?: string;
  /** Which of the blocks this page family carries (`SEO_PAGE_FAMILIES[…].contentSections`). */
  sections: readonly SeoContentSection[];
};

const h2Class = "text-dark dark:text-white text-xl md:text-2xl font-semibold";
const leadClass = "mt-2 text-sm text-dark/60 dark:text-white/60 max-w-3xl";
const chipClass =
  "inline-flex items-center gap-1.5 rounded-full border border-dark/10 dark:border-white/20 px-3 py-1.5 text-sm font-medium text-dark dark:text-white";
const chipLinkClass = `${chipClass} hover:border-primary hover:text-primary transition-colors`;
const countClass = "text-dark/50 dark:text-white/50 tabular-nums";
const textLinkClass = "text-primary font-medium underline-offset-4 hover:underline";

/**
 * What a listing page says under its cards: what homes here cost, how the
 * stock splits, where else to look in the city, the questions buyers ask, and
 * what buying costs a foreigner.
 *
 * The page used to end at the grid — about 200 words and no `<h2>` — while the
 * category pages it competes with carry counts by room type, price statistics
 * and a fee explainer. Everything here is either computed from the live
 * listings (the same cached queries the `/info` price table, the facet chips
 * and the sitemap read) or already written in the CMS; nothing is invented
 * per page. Rendered only on pages the registry indexes — a filtered or
 * noindexed listing skips the work.
 *
 * No FAQPage markup: the questions belong to the place's `/info` or district
 * page, which already declares them.
 */
export async function ListingDepthSections({
  locale,
  countrySlug,
  citySlug,
  cityLabel,
  districtSlug,
  districtLabel,
  sections,
}: Props) {
  const want = (section: SeoContentSection) => sections.includes(section);
  if (!want("priceStats") && !want("districtLinks") && !want("faq") && !want("buyingCosts")) return null;

  const place = { country: countrySlug, city: citySlug, district: districtSlug };
  const [t, tFacts, tChip, tCatalog, priceIndex, decisions, cityIn, faqRaw, districtTitles, infoExists] =
    await Promise.all([
      getTranslations({ locale, namespace: "Catalog.depth" }),
      getTranslations({ locale, namespace: "Catalog.facts" }),
      getTranslations({ locale, namespace: "Catalog.facetNav.chip" }),
      getTranslations({ locale, namespace: "Catalog" }),
      fetchCityListingPriceIndex(citySlug),
      fetchSeoPageDecisions(),
      resolveCityDisplayName(citySlug, locale),
      want("faq") ? fetchPlaceFaqItems(citySlug, districtSlug) : Promise.resolve([]),
      want("districtLinks") ? fetchDistrictListingCounts(citySlug) : Promise.resolve([]),
      districtSlug
        ? fetchDistrictBySlugs(citySlug, districtSlug).then(Boolean)
        : fetchCityLandingByCitySlug(citySlug).then(Boolean),
    ]);

  const districtName = districtLabel || districtSlug || "";
  const placeName = districtSlug ? `${districtName}, ${cityLabel}` : cityLabel;
  // Albanian puts the city in the locative after "në", as the district title template does.
  const placeIn = districtSlug ? `${districtName}, ${cityIn || cityLabel}` : cityIn || cityLabel;
  const names = { place: placeName, placeIn, city: cityLabel, cityIn: cityIn || cityLabel };

  const rows = decisions ?? [];
  const facts = want("priceStats") ? placePriceFacts(priceIndex, districtSlug) : null;
  const slices = facts ? placeSliceCounts({ rows, place, locale }) : [];
  const districts = want("districtLinks") ? districtLinkTargets({ rows, place, locale }) : [];
  const faqAll = resolveListingFaqItems(faqRaw, locale);
  const faq = pickListingFaq(faqAll, districtSlug ? "district" : "city");
  const showFaq = faq.shown.length >= LISTING_FAQ_MIN;

  const infoHref = !infoExists
    ? null
    : districtSlug
      ? districtInfoPath(locale, citySlug, districtSlug, countrySlug)
      : cityInfoPath(locale, citySlug, countrySlug);
  const infoLabel = districtSlug
    ? tCatalog("districtInfoLink", { place: placeName })
    : tCatalog("cityInfoLink", { place: placeName });
  const cityHref = catalogFilterPath({ locale, country: countrySlug, trustedCityCountrySlug: countrySlug, city: citySlug });

  const number = (n: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
  const asOf = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Tirane" }).format(
    new Date(),
  );
  const districtTitle = (slug: string) => {
    const title = districtTitles.find((d) => d.slug === slug)?.title;
    return (title ? resolveLocalizedString(title as never, locale) : "") || slug;
  };

  const answerComponents: PortableTextComponents = {
    block: { normal: ({ children }) => <p className="mt-2 first:mt-0">{children}</p> },
    marks: {
      link: ({ children, value }) => (
        <a href={resolveLocaleHref(String((value as { href?: string })?.href ?? ""), locale)} className={textLinkClass}>
          {children}
        </a>
      ),
    },
  };

  const stats: Array<{ label: string; value: React.ReactNode }> = facts
    ? [
        { label: t("prices.listings"), value: number(facts.count) },
        ...(facts.medianFlatPrice
          ? [{ label: t("prices.medianPrice"), value: <MarketMoney min={facts.medianFlatPrice} step={100} locale={locale} /> }]
          : []),
        ...(facts.medianFlatPricePerSqm
          ? [{ label: t("prices.medianSqm"), value: <MarketMoney min={facts.medianFlatPricePerSqm} step={10} locale={locale} /> }]
          : []),
        ...(facts.flatPriceFrom
          ? [{ label: t("prices.from"), value: <MarketMoney min={facts.flatPriceFrom} step={100} locale={locale} /> }]
          : []),
      ]
    : [];

  if (!facts && districts.length === 0 && !showFaq && !want("buyingCosts")) return null;

  return (
    <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pb-10 grid gap-10">
      {facts ? (
        <section aria-labelledby="listing-prices">
          <h2 id="listing-prices" className={h2Class}>
            {t("prices.title", names)}
          </h2>
          <p className={leadClass}>{t("prices.lead")}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-dark/10 dark:border-white/15 p-4">
                <dt className="text-xs text-dark/60 dark:text-white/60">{stat.label}</dt>
                <dd className="mt-1 text-lg font-semibold text-dark dark:text-white tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
          {slices.length > 0 ? (
            <>
              <h3 className="mt-5 text-sm font-semibold text-dark/70 dark:text-white/70">{t("prices.slices")}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {slices.map((slice) => {
                  const body = (
                    <>
                      {tChip(slice.facet)}
                      <span className={countClass}>{number(slice.count)}</span>
                    </>
                  );
                  return (
                    <li key={slice.facet}>
                      {slice.linkable ? (
                        <Link
                          href={catalogFilterPath({
                            locale,
                            country: countrySlug,
                            trustedCityCountrySlug: countrySlug,
                            city: citySlug,
                            district: districtSlug,
                            facet: slice.facet,
                          })}
                          className={chipLinkClass}
                        >
                          {body}
                        </Link>
                      ) : (
                        <span className={chipClass}>{body}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
          <p className="mt-4 text-xs text-dark/50 dark:text-white/50">
            {t("prices.asOf", { date: asOf, count: facts.count })}{" "}
            {infoHref ? (
              <Link href={infoHref} className={textLinkClass}>
                {infoLabel}
              </Link>
            ) : null}
          </p>
        </section>
      ) : null}

      {districts.length > 0 ? (
        <section aria-labelledby="listing-districts">
          <h2 id="listing-districts" className={h2Class}>
            {districtSlug ? t("districts.siblingsTitle", names) : t("districts.title", names)}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {districts.map((d) => (
              <li key={d.district}>
                <Link
                  href={catalogFilterPath({
                    locale,
                    country: countrySlug,
                    trustedCityCountrySlug: countrySlug,
                    city: citySlug,
                    district: d.district,
                  })}
                  className={chipLinkClass}
                >
                  {districtTitle(d.district)}
                  <span className={countClass}>{tFacts("count", { count: d.count })}</span>
                </Link>
              </li>
            ))}
          </ul>
          {districtSlug ? (
            <p className="mt-4 text-sm">
              <Link href={cityHref} className={textLinkClass}>
                {t("districts.allInCity", names)}
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}

      {showFaq ? (
        <section aria-labelledby="listing-faq">
          <h2 id="listing-faq" className={h2Class}>
            {t("faq.title", names)}
          </h2>
          <div className="mt-4 grid gap-5 max-w-3xl">
            {faq.shown.map((item) => (
              <div key={item.key}>
                <h3 className="text-base font-semibold text-dark dark:text-white">{item.question}</h3>
                <div className="mt-1 text-sm leading-relaxed text-dark/75 dark:text-white/75">
                  {typeof item.answer === "string" ? (
                    <p className="whitespace-pre-line">{item.answer}</p>
                  ) : (
                    <PortableText value={item.answer as PortableTextBlock[]} components={answerComponents} />
                  )}
                </div>
              </div>
            ))}
          </div>
          {infoHref && (faq.hasMore || !districtSlug) ? (
            <p className="mt-4 text-sm">
              <Link href={infoHref} className={textLinkClass}>
                {t("faq.more", names)}
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}

      {want("buyingCosts") ? (
        <BuyingCostsSection locale={locale} medianFlatPrice={facts?.medianFlatPrice ?? null} headingClassName={h2Class} />
      ) : null}
    </div>
  );
}
