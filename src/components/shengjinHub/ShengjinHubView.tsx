import { getTranslations } from "next-intl/server";
import Link from "@/components/shared/Link";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { FaqAccordion } from "@/components/shared/faq/FaqAccordion";
import { FaqJsonLd } from "@/components/shared/FaqJsonLd";
import { ItemListJsonLd } from "@/components/shared/ItemListJsonLd";
import { PriceTableSection } from "@/components/landing/sections/PriceTableSection";
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
import { buildFlatCrumbs, toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";
import { calculatorPath } from "@/lib/calculatorPages/config";
import { methodologyPath } from "@/lib/priceIndex/publish";
import { MIN_HEADLINE_SAMPLE } from "@/lib/priceIndex/snapshot";
import { isSeoPageIndexableIn, seoPageId, seoPageKeyFromListingRoute } from "@/lib/seo/pages";
import { landingSitemapLocales } from "@/lib/sanity/landingSitemapPaths";
import { routing } from "@/i18n/routing";
import {
  SHENGJIN_CITY,
  SHENGJIN_COUNTRY,
  SHENGJIN_HUB_FACETS,
  SHENGJIN_HUB_TYPES,
  SHENGJIN_SEA_MAX_METERS,
  shengjinHubPath,
} from "@/lib/shengjinHub/config";
import { cheaperByPercent } from "@/lib/shengjinHub/facts";
import type { ShengjinHubData } from "@/lib/shengjinHub/load";
import { cn } from "@/lib/utils";

const loc = (value: string) => ({ en: value, uk: value, ru: value, sq: value, it: value, pl: value, de: value, fr: value });

/**
 * The Shëngjin hub, `/{locale}/shengjin`. Every figure is the live Price
 * Index or a listing; a block whose data is missing is not rendered. The
 * buying-cost answers repeat what the purchase cost calculator and the
 * German hub state with their sources. Copy: `messages/*.json` `ShengjinHub`.
 */
export async function ShengjinHubView({ locale, data }: { locale: string; data: ShengjinHubData }) {
  const { snapshot, city, compare, flats, seaCount, budget, layouts, seaListings, guides, decisions, siteSettings, baseUrl } = data;
  const [t, tCrumbs, messengerContext] = await Promise.all([
    getTranslations({ locale, namespace: "ShengjinHub" }),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
    getMessengerContext({ locale, placement: "landing" }),
  ]);
  const base = baseUrl.replace(/\/$/, "");
  const pagePath = shengjinHubPath(locale);
  const pageUrl = `${base}${pagePath}`;

  const number = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const date = snapshot ? formatBlogDate(new Date(snapshot.computedAt), locale) : "";
  const cityName = (row: { slug: string; title?: unknown }) => resolveLocalizedString(row.title as never, locale) || row.slug;
  const cityHref = (slug: string, country: string) =>
    catalogFilterPath({ locale, country, trustedCityCountrySlug: country, city: slug });
  const shengjinHref = cityHref(SHENGJIN_CITY, SHENGJIN_COUNTRY);
  const districtsHref = `/${locale}/${SHENGJIN_COUNTRY}/${SHENGJIN_CITY}/districts`;

  const shengjin = compare.find((c) => c.slug === SHENGJIN_CITY) ?? null;
  const durres = compare.find((c) => c.slug === "durres") ?? null;
  const median = shengjin?.medianPerSqm ?? null;
  const from = shengjin?.flatPriceFrom ?? null;
  const medianFlat = shengjin?.medianFlatPrice ?? null;
  const listings = city?.listings ?? flats.length;
  const cheaper = cheaperByPercent(median, durres?.medianPerSqm ?? null);

  // Facet pages the registry indexes in this locale (ADR 004: no link to a noindex page).
  const facetLinks = SHENGJIN_HUB_FACETS.flatMap((facet) => {
    const key = seoPageKeyFromListingRoute({ country: SHENGJIN_COUNTRY, city: SHENGJIN_CITY, facet });
    if (!key || !decisions) return [];
    const id = seoPageId(key);
    const row = decisions.find((r) => seoPageId(r.decision.key) === id);
    if (!row || !isSeoPageIndexableIn(row.decision, locale)) return [];
    const count = city?.facets[facet]?.listings ?? 0;
    if (count === 0) return [];
    return [
      {
        facet,
        count,
        href: catalogFilterPath({ locale, country: SHENGJIN_COUNTRY, trustedCityCountrySlug: SHENGJIN_COUNTRY, city: SHENGJIN_CITY, facet }),
        label: t(`facets.${facet}`, { count }),
      },
    ];
  });

  // City + type pages (`/albania/shengjin/sale/studio`) the registry indexes in this locale, counted over the live flats.
  const typeLinks = SHENGJIN_HUB_TYPES.flatMap((type) => {
    const key = seoPageKeyFromListingRoute({ country: SHENGJIN_COUNTRY, city: SHENGJIN_CITY, dealSegment: "sale", type });
    if (!key || !decisions) return [];
    const id = seoPageId(key);
    const row = decisions.find((r) => seoPageId(r.decision.key) === id);
    if (!row || !isSeoPageIndexableIn(row.decision, locale)) return [];
    const count = flats.filter((f) => f.typeSlug === type).length;
    if (count === 0) return [];
    return [
      {
        href: catalogFilterPath({
          locale,
          country: SHENGJIN_COUNTRY,
          trustedCityCountrySlug: SHENGJIN_COUNTRY,
          city: SHENGJIN_CITY,
          dealType: "sale",
          propertyType: type,
        }),
        label: t(`types.${type}`, { count }),
      },
    ];
  });
  const sliceLinks = [...facetLinks, ...typeLinks];

  const guideLinks = guides.flatMap((g) => {
    if (g.noIndex === true) return [];
    if (!landingSitemapLocales(g.locales ?? [], routing.locales).includes(locale)) return [];
    const title = resolveLocalizedString(g.title as never, locale);
    return title ? [{ href: `/${locale}/guides/${encodeURIComponent(g.slug)}`, title }] : [];
  });

  const crumbs = buildFlatCrumbs({ locale, homeLabel: tCrumbs("home"), label: t("breadcrumb") });
  const jsonLdCrumbs = toBreadcrumbJsonLdItems(crumbs, pagePath);

  const cards = await attachMarketPositionToCards(seaListings.map((row) => mapCatalogPropertyToCard(row, locale)));

  const figures =
    median !== null && from !== null && date
      ? t("figures", { median: money(median), from: money(from), listings })
      : "";
  const lead =
    figures && durres?.medianPerSqm
      ? t("lead", { date, figures, durresMedian: money(durres.medianPerSqm), sea: seaCount })
      : figures
        ? t("leadNoDurres", { date, figures, sea: seaCount })
        : t("leadNoData");

  const tiles = [
    median !== null ? { label: t("tiles.median"), value: `${money(median)}/m²` } : null,
    medianFlat !== null ? { label: t("tiles.medianFlat"), value: money(medianFlat) } : null,
    from !== null ? { label: t("tiles.from"), value: money(from) } : null,
    { label: t("tiles.sea", { metres: number(SHENGJIN_SEA_MAX_METERS) }), value: `${number(seaCount)} / ${number(flats.length)}` },
  ].filter((x): x is { label: string; value: string } => x !== null);

  const bandLabel = (b: { from: number; to: number | null }) =>
    b.to === null ? t("budget.bandOver", { from: money(b.from) }) : b.from === 0 ? t("budget.bandUnder", { to: money(b.to) }) : t("budget.band", { from: money(b.from), to: money(b.to) });

  const faq = [
    {
      q: t("faq.q1"),
      a:
        median !== null && from !== null && medianFlat !== null && date
          ? t("faq.a1", { date, median: money(median), from: money(from), medianFlat: money(medianFlat), count: shengjin?.count ?? 0 })
          : t("faq.a1NoData"),
    },
    {
      q: t("faq.q2"),
      a:
        cheaper !== null && durres?.medianPerSqm && median !== null && date
          ? t("faq.a2", { date, median: money(median), durresMedian: money(durres.medianPerSqm), percent: cheaper })
          : t("faq.a2NoData"),
    },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6", { sea: seaCount, metres: number(SHENGJIN_SEA_MAX_METERS) }) },
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
          items={cards.map((card) => ({
            name: card.name,
            slug: card.slug,
            href: card._href,
            image: card.images[0]?.src ?? null,
          }))}
          collection={{ name: t("h1"), url: pageUrl, placeName: "Shëngjin" }}
        />
      ) : null}
      <FaqJsonLd items={faq.map((f) => ({ question: f.q, answer: f.a }))} />

      <PartnerLandingHero
        breadcrumb={<Breadcrumb items={crumbs} overHero />}
        label={t("label")}
        title={t("h1")}
        lead={lead}
        // The page sells the town by the sea: its beach, not one flat's room.
        image={null}
        place={SHENGJIN_CITY}
        footer={
          <Link href={shengjinHref} className={`${textLinkClass} !text-white`}>
            {t("allListings", { count: listings })}
          </Link>
        }
      />

      <Section aria-labelledby="shengjin-why">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="shengjin-why" className={SECTION_TITLE}>
              {t("why.title")}
            </h2>
            <StatTiles stats={tiles} className="mt-6 !grid-cols-2 lg:!grid-cols-2" />
            {date ? <p className={cn("mt-3 text-xs text-dark/50 dark:text-white/50")}>{t("why.tilesNote", { date })}</p> : null}
          </div>
          <div className={cn(SPLIT_MAIN, "space-y-4")}>
            <p className={BODY_TEXT}>{t("why.p1")}</p>
            <p className={BODY_TEXT}>
              {cheaper !== null && durres?.medianPerSqm && median !== null
                ? t("why.p2", { percent: cheaper, median: money(median), durresMedian: money(durres.medianPerSqm) })
                : t("why.p2NoData")}
            </p>
            <p className={BODY_TEXT}>{t("why.p3")}</p>
            <p className={BODY_TEXT}>
              <Link href={districtsHref} className={textLinkClass}>
                {t("why.districtsLink")}
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {snapshot && compare.length > 1 ? (
        <PriceTableSection
          locale={locale}
          section={{
            title: loc(t("compare.title")),
            subtitle: loc(t("compare.lead")),
            labelHeader: loc(t("compare.colCity")),
            columns: [loc(t("compare.colMedian")), loc(t("compare.colMedianFlat")), loc(t("compare.colFrom")), loc(t("compare.colListings")), loc(t("compare.colSample"))],
            rows: compare.map((c) => ({
              _key: c.slug,
              label: loc(cityName(c)),
              cells: [
                loc(c.medianPerSqm !== null ? (c.reliable ? money(c.medianPerSqm) : t("compare.indicative", { value: money(c.medianPerSqm) })) : t("compare.lowSample")),
                loc(c.medianFlatPrice !== null ? money(c.medianFlatPrice) : "—"),
                loc(c.flatPriceFrom !== null ? money(c.flatPriceFrom) : "—"),
                loc(number(c.listings)),
                loc(number(c.count)),
              ],
              href: cityHref(c.slug, c.country),
            })),
            caption: t("compare.caption", { date }),
            footnote: t("compare.footnote", { min: MIN_HEADLINE_SAMPLE }),
            lastUpdated: snapshot.computedAt,
          }}
        />
      ) : null}
      {snapshot ? (
        <section className="-mt-6 md:-mt-8 pb-6 md:pb-8">
          <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
            <p className={BODY_TEXT}>
              <Link href={`/${locale}/prices`} className={textLinkClass}>
                {t("compare.pricesLink")}
              </Link>
              {" · "}
              <Link href={methodologyPath(locale)} className={textLinkClass}>
                {t("compare.methodologyLink")}
              </Link>
            </p>
          </div>
        </section>
      ) : null}

      {flats.length > 0 ? (
        <Section aria-labelledby="shengjin-budget">
          <div className={SPLIT}>
            <div className={SPLIT_ASIDE}>
              <h2 id="shengjin-budget" className={SECTION_TITLE}>
                {t("budget.title")}
              </h2>
              <p className={cn(SECTION_LEAD, "mt-3")}>{t("budget.lead", { date })}</p>
              {sliceLinks.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                  {sliceLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={textLinkClass}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className={cn(SPLIT_MAIN, "space-y-8")}>
              <table className="w-full text-left text-sm md:text-base">
                <caption className="sr-only">{t("budget.caption", { date })}</caption>
                <thead>
                  <tr className="text-dark/60 dark:text-white/60">
                    <th scope="col" className="py-2 pr-4 font-medium">{t("budget.colBudget")}</th>
                    <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("budget.colFlats")}</th>
                    <th scope="col" className="py-2 font-medium tabular-nums">{t("budget.colSea")}</th>
                  </tr>
                </thead>
                <tbody>
                  {budget.map((b) => (
                    <tr key={`${b.from}-${b.to ?? "open"}`} className="border-t border-dark/10 dark:border-white/10">
                      <th scope="row" className="py-2.5 pr-4 font-medium text-dark dark:text-white">{bandLabel(b)}</th>
                      <td className="py-2.5 pr-4 tabular-nums">{number(b.count)}</td>
                      <td className="py-2.5 tabular-nums">{number(b.bySea)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {layouts.length > 0 ? (
                <table className="w-full text-left text-sm md:text-base">
                  <caption className="sr-only">{t("layouts.caption", { date })}</caption>
                  <thead>
                    <tr className="text-dark/60 dark:text-white/60">
                      <th scope="col" className="py-2 pr-4 font-medium">{t("layouts.colLayout")}</th>
                      <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("layouts.colCount")}</th>
                      <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("layouts.colFrom")}</th>
                      <th scope="col" className="py-2 font-medium tabular-nums">{t("layouts.colMedian")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {layouts.map((row) => (
                      <tr key={row.key} className="border-t border-dark/10 dark:border-white/10">
                        <th scope="row" className="py-2.5 pr-4 font-medium text-dark dark:text-white">{t(`layouts.${row.key}`)}</th>
                        <td className="py-2.5 pr-4 tabular-nums">{number(row.count)}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{row.from !== null ? money(row.from) : "—"}</td>
                        <td className="py-2.5 tabular-nums">{row.median !== null ? money(row.median) : t("layouts.fewFlats")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              <p className="text-xs text-dark/50 dark:text-white/50">{t("budget.note")}</p>
            </div>
          </div>
        </Section>
      ) : null}

      {cards.length > 0 ? (
        <Section aria-labelledby="shengjin-sea">
          <SectionHeading
            id="shengjin-sea"
            title={t("sea.title", { count: cards.length })}
            lead={t("sea.lead", { metres: number(SHENGJIN_SEA_MAX_METERS), total: seaCount })}
            trailing={
              <Link href={shengjinHref} className={brandButtonClass("secondary", undefined, "md")}>
                {t("sea.all", { count: listings })}
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

      <Section aria-labelledby="shengjin-costs">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="shengjin-costs" className={SECTION_TITLE}>
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

      <Section aria-labelledby="shengjin-faq">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="shengjin-faq" className={SECTION_TITLE}>
              {t("faq.title")}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{t("faq.lead")}</p>
            {guideLinks.length > 0 ? (
              <ul className="mt-5 space-y-2">
                {guideLinks.map((g) => (
                  <li key={g.href}>
                    <Link href={g.href} className={textLinkClass}>
                      {g.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className={SPLIT_MAIN}>
            <FaqAccordion idPrefix="shengjin-faq" items={faq.map((f) => ({ question: f.q, answer: <p>{f.a}</p> }))} />
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
