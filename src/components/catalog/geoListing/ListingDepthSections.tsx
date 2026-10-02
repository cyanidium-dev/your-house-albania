import Link from "@/components/shared/Link";
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
import { GuideDownloadCard } from "@/components/guides/GuideDownloadCard";
import type { SeoContentSection } from "@/lib/seo/pages";
import { FaqAccordion } from "@/components/shared/faq/FaqAccordion";
import { ZoneStatsAutoSection } from "@/components/landing/sections/ZoneStatsAutoSection";
import { EntityCard } from "@/components/landing/sections/impl/EntityCard";
import { fetchLatestZoneMetricsByZoneId } from "@/lib/sanity/queries/zoneMetrics";
import { fetchPublishedDistrictsByCity } from "@/lib/sanity/queries/district";
import {
  balancedGridClass,
  CONTAINER,
  Section,
  SectionHeading,
  SECTION_TITLE,
  SPLIT,
  SPLIT_ASIDE,
  SPLIT_MAIN,
} from "@/components/shared/layout";
import {
  StatTiles,
  chipClass,
  chipLinkClass,
  countClass,
  noteClass,
  subheadClass,
  textLinkClass,
} from "@/components/catalog/depthUi";

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

/** The lead magnet card keeps its own, smaller heading: it is a card inside a section. */
const cardHeadingClass = "mt-2 text-xl md:text-2xl font-semibold text-dark dark:text-white";

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
  const [t, tFacts, tChip, tCatalog, priceIndex, decisions, cityIn, faqRaw, districtTitles, placeDoc] =
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
      districtSlug ? fetchDistrictBySlugs(citySlug, districtSlug) : fetchCityLandingByCitySlug(citySlug),
    ]);
  const infoExists = Boolean(placeDoc);

  const districtName = districtLabel || districtSlug || "";
  const placeName = districtSlug ? `${districtName}, ${cityLabel}` : cityLabel;
  // Albanian puts the city in the locative after "në", as the district title template does.
  const placeIn = districtSlug ? `${districtName}, ${cityIn || cityLabel}` : cityIn || cityLabel;
  const names = { place: placeName, placeIn, city: cityLabel, cityIn: cityIn || cityLabel };

  const rows = decisions ?? [];
  const facts = want("priceStats") ? placePriceFacts(priceIndex, districtSlug) : null;
  const slices = facts ? placeSliceCounts({ rows, place, locale }) : [];
  const districts = want("districtLinks") ? districtLinkTargets({ rows, place, locale }) : [];
  // Too few live listings for price statistics (Shëngjin had two): the page
  // shows the place's research figures instead, the same record its /info
  // page opens with, and — on a city with no district chips — the city's
  // districts as cards. The page used to end at the grid and one generic line.
  const zoneId = !facts
    ? districtSlug
      ? (placeDoc as { _id?: string } | null)?._id
      : (placeDoc as { linkedZoneId?: string } | null)?.linkedZoneId
    : undefined;
  const [researchRecord, cityDistricts] = await Promise.all([
    zoneId ? fetchLatestZoneMetricsByZoneId(zoneId) : Promise.resolve(null),
    !districtSlug && districts.length === 0 ? fetchPublishedDistrictsByCity(citySlug) : Promise.resolve([]),
  ]);
  const tDistricts = cityDistricts.length > 0 ? await getTranslations({ locale, namespace: "Districts" }) : null;
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

  if (
    !facts &&
    !researchRecord &&
    districts.length === 0 &&
    cityDistricts.length === 0 &&
    !showFaq &&
    !want("buyingCosts")
  ) {
    return null;
  }

  return (
    <>
      {facts ? (
        <Section aria-labelledby="listing-prices">
          <SectionHeading id="listing-prices" title={t("prices.title", names)} lead={t("prices.lead")} />
          <StatTiles stats={stats} />
          {slices.length > 0 ? (
            <>
              <h3 className={`mt-8 ${subheadClass}`}>{t("prices.slices")}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
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
          <p className={`mt-6 ${noteClass}`}>
            {t("prices.asOf", { date: asOf, count: facts.count })}{" "}
            {infoHref ? (
              <Link href={infoHref} className={textLinkClass}>
                {infoLabel}
              </Link>
            ) : null}
          </p>
        </Section>
      ) : null}

      {!facts && researchRecord ? (
        <ZoneStatsAutoSection locale={locale} record={researchRecord} titleOverride={infoLabel} />
      ) : null}

      {/* The lead magnet, right after the numbers it expands on. Renders only
          for Durrës; the card is static and the form inside is the island. */}
      <div className={CONTAINER}>
        <GuideDownloadCard
          locale={locale}
          citySlug={citySlug}
          subject={{ city: citySlug, ...(districtSlug ? { district: districtSlug } : {}) }}
          headingClassName={cardHeadingClass}
        />
      </div>

      {districts.length > 0 ? (
        <Section aria-labelledby="listing-districts">
          <SectionHeading
            id="listing-districts"
            title={districtSlug ? t("districts.siblingsTitle", names) : t("districts.title", names)}
          />
          <ul className="flex flex-wrap gap-2">
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
            <p className="mt-6 text-sm">
              <Link href={cityHref} className={textLinkClass}>
                {t("districts.allInCity", names)}
              </Link>
            </p>
          ) : null}
        </Section>
      ) : null}

      {cityDistricts.length > 0 && tDistricts ? (
        <Section aria-labelledby="listing-city-districts">
          <SectionHeading
            id="listing-city-districts"
            title={tDistricts("hubTitle", { city: cityIn || cityLabel })}
            trailing={
              infoHref ? (
                <Link href={infoHref} className={textLinkClass}>
                  {infoLabel}
                </Link>
              ) : undefined
            }
          />
          <div className={balancedGridClass(cityDistricts.length)}>
            {cityDistricts.map((d) => {
              const title = resolveLocalizedString(d.title as never, locale) || d.slug || "";
              return (
                <EntityCard
                  key={d._id ?? d.slug}
                  href={districtInfoPath(locale, citySlug, d.slug!, countrySlug)}
                  title={title}
                  imageUrl={d.heroImage?.asset?.url}
                  imageAlt={d.heroImage?.alt || title}
                  shortDescription={resolveLocalizedString(d.shortDescription as never, locale) || undefined}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  compact
                />
              );
            })}
          </div>
        </Section>
      ) : null}

      {showFaq ? (
        <Section aria-labelledby="listing-faq">
          <div className={SPLIT}>
            <div className={`${SPLIT_ASIDE} lg:sticky lg:top-28 lg:self-start`}>
              <h2 id="listing-faq" className={SECTION_TITLE}>
                {t("faq.title", names)}
              </h2>
              {infoHref && (faq.hasMore || !districtSlug) ? (
                <p className="mt-5 text-base">
                  <Link href={infoHref} className={textLinkClass}>
                    {t("faq.more", names)}
                  </Link>
                </p>
              ) : null}
            </div>
            <FaqAccordion
              className={SPLIT_MAIN}
              idPrefix="listing-faq"
              items={faq.shown.map((item) => ({
                question: item.question,
                answer:
                  typeof item.answer === "string" ? (
                    <p className="whitespace-pre-line">{item.answer}</p>
                  ) : (
                    <PortableText value={item.answer as PortableTextBlock[]} components={answerComponents} />
                  ),
              }))}
            />
          </div>
        </Section>
      ) : null}

      {want("buyingCosts") ? (
        <BuyingCostsSection locale={locale} medianFlatPrice={facts?.medianFlatPrice ?? null} />
      ) : null}
    </>
  );
}
