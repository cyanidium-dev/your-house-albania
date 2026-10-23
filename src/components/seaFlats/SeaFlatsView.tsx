import { getTranslations } from "next-intl/server";
import Link from "@/components/shared/Link";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { FaqAccordion } from "@/components/shared/faq/FaqAccordion";
import { FaqJsonLd } from "@/components/shared/FaqJsonLd";
import { ItemListJsonLd } from "@/components/shared/ItemListJsonLd";
import { LeadFormSection } from "@/components/landing/sections/LeadFormSection";
import { PartnerLandingHero } from "@/components/partnerLandings/PartnerLandingHero";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { StatTiles, textLinkClass } from "@/components/catalog/depthUi";
import {
  BODY_TEXT,
  Section,
  SectionHeading,
  SECTION_LEAD,
  SECTION_TITLE,
  SPLIT,
  SPLIT_ASIDE,
  SPLIT_MAIN,
  balancedGridClass,
} from "@/components/shared/layout";
import { mapCatalogPropertyToCard } from "@/lib/sanity/propertyAdapter";
import { attachMarketPositionToCards } from "@/lib/property/marketPosition";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { resolveMessengers } from "@/lib/contacts/messengers";
import { getMessengerContext } from "@/lib/contacts/messengerContext.server";
import type { SocialLinkInput } from "@/lib/footer/socialChannels";
import { formatMoney } from "@/lib/currency/format";
import { formatBlogDate } from "@/lib/date/formatLocale";
import { catalogFilterPath } from "@/lib/routes/catalog";
import { nonGeoDealListingPath } from "@/lib/routes/catalogPathPrimitives";
import { buildFlatCrumbs, toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";
import { calculatorPath } from "@/lib/calculatorPages/config";
import { methodologyPath } from "@/lib/priceIndex/publish";
import { shengjinHubPath } from "@/lib/shengjinHub/config";
import { SEA_FLATS_MAX_METERS, SEA_FLATS_PER_CITY, seaFlatsPath } from "@/lib/seaFlats/config";
import type { SeaFlatsData } from "@/lib/seaFlats/load";
import { cn } from "@/lib/utils";

/**
 * The seaside flats landing of one market language. Every figure is a live
 * listing; a block whose data is missing is not rendered. The cost and legal
 * answers repeat what the hubs and the purchase cost calculator state with
 * their sources. Copy: `messages/{locale}.json` `SeaFlats`.
 */
export async function SeaFlatsView({ locale, data }: { locale: string; data: SeaFlatsData }) {
  const { figures, totalFlats, cities, cheapestCity, cards: cardRows, computedAt, siteSettings, baseUrl } = data;
  const [t, tCrumbs, messengerContext] = await Promise.all([
    getTranslations({ locale, namespace: "SeaFlats" }),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
    getMessengerContext({ locale, placement: "landing" }),
  ]);
  const base = baseUrl.replace(/\/$/, "");
  const pagePath = seaFlatsPath(locale) ?? `/${locale}`;
  const pageUrl = `${base}${pagePath}`;

  const number = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const date = formatBlogDate(computedAt ? new Date(computedAt) : new Date(), locale);
  const cityName = (row: { citySlug: string; cityTitle?: unknown }) => resolveLocalizedString(row.cityTitle as never, locale) || row.citySlug;
  const cityHref = (row: { citySlug: string; country: string }) =>
    catalogFilterPath({ locale, country: row.country, trustedCityCountrySlug: row.country, city: row.citySlug });
  const allSaleHref = nonGeoDealListingPath(locale, "sale");

  const crumbs = buildFlatCrumbs({ locale, homeLabel: tCrumbs("home"), label: t("breadcrumb") });
  const jsonLdCrumbs = toBreadcrumbJsonLdItems(crumbs, pagePath);
  const cards = await attachMarketPositionToCards(cardRows.map((row) => mapCatalogPropertyToCard(row, locale)));

  const hasFigures = figures.count > 0 && figures.from !== null;
  const citiesLine = cities
    .slice(0, 4)
    .map((c) => t("cityFigure", { city: cityName(c), count: c.count }))
    .join(", ");
  const lead = hasFigures
    ? t("lead", { date, count: figures.count, total: totalFlats, from: money(figures.from!), cities: citiesLine })
    : t("leadNoData");

  const tiles = [
    { label: t("tiles.sea", { metres: number(SEA_FLATS_MAX_METERS) }), value: `${number(figures.count)} / ${number(totalFlats)}` },
    figures.from !== null ? { label: t("tiles.from"), value: money(figures.from) } : null,
    figures.medianPerSqm !== null ? { label: t("tiles.medianPerSqm"), value: `${money(figures.medianPerSqm)}/m²` } : null,
    { label: t("tiles.beachfront"), value: number(figures.beachfront) },
  ].filter((x): x is { label: string; value: string } => x !== null);

  const faq = [
    {
      q: t("faq.q1"),
      a:
        hasFigures && figures.medianPerSqm !== null && figures.medianPrice !== null
          ? t("faq.a1", { date, count: figures.count, from: money(figures.from!), medianPerSqm: money(figures.medianPerSqm), medianPrice: money(figures.medianPrice) })
          : t("faq.a1NoData"),
    },
    {
      q: t("faq.q2"),
      a: cheapestCity
        ? t("faq.a2", { date, city: cityName(cheapestCity), median: money(cheapestCity.medianPerSqm!), count: cheapestCity.count })
        : t("faq.a2NoData"),
    },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6", { metres: number(SEA_FLATS_MAX_METERS) }) },
  ];

  const messengers = resolveMessengers(
    (siteSettings as { socialLinks?: SocialLinkInput[] } | null)?.socialLinks,
    locale,
    messengerContext,
  );

  return (
    <main>
      <BreadcrumbJsonLd items={jsonLdCrumbs} baseUrl={base} />
      {cards.length > 0 ? (
        <ItemListJsonLd
          locale={locale}
          baseUrl={base}
          items={cards.map((card) => ({ name: card.name, slug: card.slug, href: card._href, image: card.images[0]?.src ?? null }))}
          collection={{ name: t("h1"), url: pageUrl, placeName: t("country") }}
        />
      ) : null}
      <FaqJsonLd items={faq.map((f) => ({ question: f.q, answer: f.a }))} />

      <PartnerLandingHero
        breadcrumb={<Breadcrumb items={crumbs} overHero />}
        label={t("label")}
        title={t("h1")}
        lead={lead}
        // The page sells the coast: the coast photograph, not one flat's room.
        image={null}
        place={null}
        footer={
          <Link href={allSaleHref} className={`${textLinkClass} !text-white`}>
            {t("allSale")}
          </Link>
        }
      />

      <Section aria-labelledby="sea-why">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="sea-why" className={SECTION_TITLE}>
              {t("why.title")}
            </h2>
            <StatTiles stats={tiles} className="mt-6 !grid-cols-2 lg:!grid-cols-2" />
            <p className="mt-3 text-xs text-dark/50 dark:text-white/50">{t("why.tilesNote", { date })}</p>
          </div>
          <div className={cn(SPLIT_MAIN, "space-y-4")}>
            <p className={BODY_TEXT}>{t("why.p1")}</p>
            <p className={BODY_TEXT}>
              {cheapestCity
                ? t("why.p2", { city: cityName(cheapestCity), median: money(cheapestCity.medianPerSqm!) })
                : t("why.p2NoData")}
            </p>
            <p className={BODY_TEXT}>{t("why.p3")}</p>
            <p className={BODY_TEXT}>
              <Link href={shengjinHubPath(locale)} className={textLinkClass}>
                {t("why.shengjinLink")}
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {cities.length > 0 ? (
        <Section aria-labelledby="sea-cities">
          <div className={SPLIT}>
            <div className={SPLIT_ASIDE}>
              <h2 id="sea-cities" className={SECTION_TITLE}>
                {t("table.title")}
              </h2>
              <p className={cn(SECTION_LEAD, "mt-3")}>{t("table.lead", { date })}</p>
              <p className={cn(BODY_TEXT, "mt-5")}>
                <Link href={`/${locale}/prices`} className={textLinkClass}>
                  {t("table.pricesLink")}
                </Link>
                {" · "}
                <Link href={methodologyPath(locale)} className={textLinkClass}>
                  {t("table.methodologyLink")}
                </Link>
              </p>
            </div>
            <div className={SPLIT_MAIN}>
              <table className="w-full text-left text-sm md:text-base">
                <caption className="sr-only">{t("table.caption", { date })}</caption>
                <thead>
                  <tr className="text-dark/60 dark:text-white/60">
                    <th scope="col" className="py-2 pr-4 font-medium">{t("table.colCity")}</th>
                    <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("table.colCount")}</th>
                    <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("table.colBeachfront")}</th>
                    <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("table.colFrom")}</th>
                    <th scope="col" className="py-2 font-medium tabular-nums">{t("table.colMedian")}</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map((c) => (
                    <tr key={c.citySlug} className="border-t border-dark/10 dark:border-white/10">
                      <th scope="row" className="py-2.5 pr-4 font-medium text-dark dark:text-white">
                        <Link href={cityHref(c)} className={textLinkClass}>
                          {cityName(c)}
                        </Link>
                      </th>
                      <td className="py-2.5 pr-4 tabular-nums">{number(c.count)}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{number(c.beachfront)}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{c.from !== null ? money(c.from) : "—"}</td>
                      <td className="py-2.5 tabular-nums">{c.medianPerSqm !== null ? money(c.medianPerSqm) : t("table.fewFlats")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-dark/50 dark:text-white/50">{t("table.note")}</p>
            </div>
          </div>
        </Section>
      ) : null}

      {cards.length > 0 ? (
        <Section aria-labelledby="sea-cards">
          <SectionHeading
            id="sea-cards"
            title={t("cards.title", { count: cards.length })}
            lead={t("cards.lead", { metres: number(SEA_FLATS_MAX_METERS), perCity: SEA_FLATS_PER_CITY, total: figures.count })}
            trailing={
              <Link href={allSaleHref} className={brandButtonClass("secondary", undefined, "md")}>
                {t("cards.all")}
              </Link>
            }
          />
          <div className={balancedGridClass(cards.length)}>
            {cards.map((card) => (
              <PropertyCard key={card.slug} item={card} locale={locale} fillHeight />
            ))}
          </div>
        </Section>
      ) : null}

      <Section aria-labelledby="sea-costs">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="sea-costs" className={SECTION_TITLE}>
              {t("costs.title")}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{t("costs.lead")}</p>
          </div>
          <div className={cn(SPLIT_MAIN, "space-y-4")}>
            <p className={BODY_TEXT}>{t("costs.p1")}</p>
            <p className={BODY_TEXT}>{t("costs.p2")}</p>
            <p className={BODY_TEXT}>{t("costs.p3")}</p>
            <p className={BODY_TEXT}>
              <Link href={calculatorPath(locale, "purchase")} className={textLinkClass}>
                {t("costs.calculatorLink")}
              </Link>
              {" · "}
              <Link href={calculatorPath(locale, "rental")} className={textLinkClass}>
                {t("costs.yieldLink")}
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="sea-faq">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="sea-faq" className={SECTION_TITLE}>
              {t("faq.title")}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{t("faq.lead")}</p>
          </div>
          <div className={SPLIT_MAIN}>
            <FaqAccordion idPrefix="sea-faq" items={faq.map((f) => ({ question: f.q, answer: <p>{f.a}</p> }))} />
          </div>
        </div>
      </Section>

      <LeadFormSection
        locale={locale}
        anchorId="request"
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
        budgetOptions={[]}
        withMessage
        messengers={messengers.length ? messengers : null}
      />
    </main>
  );
}
