import { getTranslations } from "next-intl/server";
import Link from "@/components/shared/Link";
import PropertyCard from "@/components/shared/property/PropertyCard";
import BlogCard from "@/components/shared/Blog/blogCard";
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
import { MIN_HEADLINE_SAMPLE } from "@/lib/priceIndex/snapshot";
import { landingSitemapLocales } from "@/lib/sanity/landingSitemapPaths";
import { routing } from "@/i18n/routing";
import { shengjinHubPath } from "@/lib/shengjinHub/config";
import { seaFlatsPath } from "@/lib/seaFlats/config";
import { INVESTMENT_HUB_MAX_PRICE, INVESTMENT_HUB_PER_CITY, RENTAL_INCOME_TAX_PCT, investmentHubPath } from "@/lib/investmentHub/config";
import type { InvestmentHubData } from "@/lib/investmentHub/load";
import { cn } from "@/lib/utils";

/**
 * The investment hub. Every price is the live Price Index, every yield is
 * the calculator's model over the index and the rents data sheet; a block
 * whose data is missing is not rendered. Tax and legal answers repeat what
 * the tax article and the hubs state with their sources. Copy:
 * `messages/{locale}.json` `InvestmentHub`.
 */
export async function InvestmentHubView({ locale, data }: { locale: string; data: InvestmentHubData }) {
  const { snapshot, cities, bestYield, cheapest, newBuilds, cards: cardRows, underCap, articles, guide, siteSettings, baseUrl } = data;
  const [t, tCrumbs, messengerContext] = await Promise.all([
    getTranslations({ locale, namespace: "InvestmentHub" }),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
    getMessengerContext({ locale, placement: "landing" }),
  ]);
  const base = baseUrl.replace(/\/$/, "");
  const pagePath = investmentHubPath(locale);
  const pageUrl = `${base}${pagePath}`;

  const number = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const pct = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n);
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const date = snapshot ? formatBlogDate(new Date(snapshot.computedAt), locale) : formatBlogDate(new Date(), locale);
  const cityName = (row: { slug: string; title?: unknown }) => resolveLocalizedString(row.title as never, locale) || row.slug;
  const cityHref = (row: { slug: string; country: string }) =>
    catalogFilterPath({ locale, country: row.country, trustedCityCountrySlug: row.country, city: row.slug });
  const newBuildsHref = `/${locale}/investment/new-builds`;
  const allSaleHref = nonGeoDealListingPath(locale, "sale");
  const seaHref = seaFlatsPath(locale);
  const guideHref =
    guide && guide.noIndex !== true && landingSitemapLocales(guide.locales ?? [], routing.locales).includes(locale)
      ? `/${locale}/guides/${encodeURIComponent(guide.slug)}`
      : null;

  const crumbs = buildFlatCrumbs({ locale, homeLabel: tCrumbs("home"), label: t("breadcrumb") });
  const jsonLdCrumbs = toBreadcrumbJsonLdItems(crumbs, pagePath);
  const cards = await attachMarketPositionToCards(cardRows.map((row) => mapCatalogPropertyToCard(row, locale)));

  const national = snapshot?.national ?? null;
  const hasFigures = !!national && national.median !== null && national.flatPriceFrom !== null;
  const lead = hasFigures
    ? bestYield
      ? t("lead", {
          date,
          median: money(national!.median!),
          flats: national!.flats,
          from: money(national!.flatPriceFrom!),
          city: cityName(bestYield),
          yieldMin: pct(bestYield.grossYield!.min),
          yieldMax: pct(bestYield.grossYield!.max),
        })
      : t("leadNoYield", { date, median: money(national!.median!), flats: national!.flats, from: money(national!.flatPriceFrom!) })
    : t("leadNoData");

  const tiles = [
    national?.median !== null && national ? { label: t("tiles.median"), value: `${money(national.median!)}/m²` } : null,
    national?.flatPriceFrom !== null && national ? { label: t("tiles.from"), value: money(national.flatPriceFrom!) } : null,
    bestYield ? { label: t("tiles.yield", { city: cityName(bestYield) }), value: `${pct(bestYield.grossYield!.min)}-${pct(bestYield.grossYield!.max)} %` } : null,
    { label: t("tiles.newBuilds"), value: number(newBuilds) },
  ].filter((x): x is { label: string; value: string } => x !== null);

  const faq = [
    {
      q: t("faq.q1"),
      a: bestYield
        ? t("faq.a1", {
            date,
            city: cityName(bestYield),
            price: money(bestYield.oneBedPrice!),
            rentMin: money(bestYield.rent!.min),
            rentMax: money(bestYield.rent!.max),
            grossMin: pct(bestYield.grossYield!.min),
            grossMax: pct(bestYield.grossYield!.max),
            netMin: pct(bestYield.netYield!.min),
            netMax: pct(bestYield.netYield!.max),
          })
        : t("faq.a1NoData"),
    },
    {
      q: t("faq.q2"),
      a: cheapest ? t("faq.a2", { date, city: cityName(cheapest), median: money(cheapest.medianPerSqm!), count: cheapest.count }) : t("faq.a2NoData"),
    },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4", { tax: RENTAL_INCOME_TAX_PCT }) },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6", { count: newBuilds }) },
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
        image={null}
        place="durres"
        footer={
          <Link href={allSaleHref} className={`${textLinkClass} !text-white`}>
            {t("allSale")}
          </Link>
        }
      />

      <Section aria-labelledby="inv-why">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="inv-why" className={SECTION_TITLE}>
              {t("why.title")}
            </h2>
            <StatTiles stats={tiles} className="mt-6 !grid-cols-2 lg:!grid-cols-2" />
            <p className="mt-3 text-xs text-dark/50 dark:text-white/50">{t("why.tilesNote", { date })}</p>
          </div>
          <div className={cn(SPLIT_MAIN, "space-y-4")}>
            <p className={BODY_TEXT}>{t("why.p1")}</p>
            <p className={BODY_TEXT}>{t("why.p2")}</p>
            <p className={BODY_TEXT}>{t("why.p3")}</p>
            <p className={BODY_TEXT}>{t("why.p4")}</p>
          </div>
        </div>
      </Section>

      {cities.length > 0 ? (
        <Section aria-labelledby="inv-cities">
          <div className={SPLIT}>
            <div className={SPLIT_ASIDE}>
              <h2 id="inv-cities" className={SECTION_TITLE}>
                {t("table.title")}
              </h2>
              <p className={cn(SECTION_LEAD, "mt-3")}>{t("table.lead", { date })}</p>
              <p className={cn(BODY_TEXT, "mt-5")}>
                <Link href={calculatorPath(locale, "rental")} className={textLinkClass}>
                  {t("table.calculatorLink")}
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
                    <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("table.colMedian")}</th>
                    <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("table.colOneBed")}</th>
                    <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("table.colRent")}</th>
                    <th scope="col" className="py-2 pr-4 font-medium tabular-nums">{t("table.colGross")}</th>
                    <th scope="col" className="py-2 font-medium tabular-nums">{t("table.colNet")}</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map((c) => (
                    <tr key={c.slug} className="border-t border-dark/10 dark:border-white/10">
                      <th scope="row" className="py-2.5 pr-4 font-medium text-dark dark:text-white">
                        <Link href={cityHref(c)} className={textLinkClass}>
                          {cityName(c)}
                        </Link>
                        <span className="block text-xs font-normal text-dark/50 dark:text-white/50">
                          {t("table.sample", { count: c.count })}
                        </span>
                      </th>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {c.medianPerSqm !== null ? (c.reliable ? money(c.medianPerSqm) : t("table.indicative", { value: money(c.medianPerSqm) })) : t("table.lowSample")}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">{c.oneBedPrice !== null ? money(c.oneBedPrice) : "—"}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{c.rent ? `${money(c.rent.min)}-${money(c.rent.max)}` : "—"}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{c.grossYield ? `${pct(c.grossYield.min)}-${pct(c.grossYield.max)} %` : "—"}</td>
                      <td className="py-2.5 tabular-nums">{c.netYield ? `${pct(c.netYield.min)}-${pct(c.netYield.max)} %` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-dark/50 dark:text-white/50">{t("table.note", { min: MIN_HEADLINE_SAMPLE, tax: RENTAL_INCOME_TAX_PCT })}</p>
            </div>
          </div>
        </Section>
      ) : null}

      <Section aria-labelledby="inv-strategies">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="inv-strategies" className={SECTION_TITLE}>
              {t("strategies.title")}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{t("strategies.lead")}</p>
          </div>
          <div className={cn(SPLIT_MAIN, "space-y-6")}>
            {(["ltr", "str", "offplan", "cheap"] as const).map((key) => {
              const href =
                key === "offplan" ? newBuildsHref : key === "cheap" ? shengjinHubPath(locale) : key === "str" ? (seaHref ?? allSaleHref) : cityHref({ slug: "durres", country: "albania" });
              return (
                <div key={key}>
                  <h3 className="font-display text-xl md:text-2xl font-medium text-dark dark:text-white">{t(`strategies.${key}.title`)}</h3>
                  <p className={cn(BODY_TEXT, "mt-2")}>{t(`strategies.${key}.body`)}</p>
                  <p className="mt-2">
                    <Link href={href} className={textLinkClass}>
                      {t(`strategies.${key}.link`)}
                    </Link>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {cards.length > 0 ? (
        <Section aria-labelledby="inv-cards">
          <SectionHeading
            id="inv-cards"
            title={t("cards.title", { count: cards.length })}
            lead={t("cards.lead", { cap: money(INVESTMENT_HUB_MAX_PRICE), perCity: INVESTMENT_HUB_PER_CITY, total: underCap })}
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

      <Section aria-labelledby="inv-taxes">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="inv-taxes" className={SECTION_TITLE}>
              {t("taxes.title")}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{t("taxes.lead")}</p>
          </div>
          <div className={cn(SPLIT_MAIN, "space-y-4")}>
            <p className={BODY_TEXT}>{t("taxes.p1")}</p>
            <p className={BODY_TEXT}>{t("taxes.p2")}</p>
            <p className={BODY_TEXT}>{t("taxes.p3")}</p>
            <p className={BODY_TEXT}>
              <Link href={calculatorPath(locale, "purchase")} className={textLinkClass}>
                {t("taxes.calculatorLink")}
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {articles.length > 0 ? (
        <Section aria-labelledby="inv-articles">
          <SectionHeading
            id="inv-articles"
            title={t("articles.title")}
            lead={t("articles.lead")}
            trailing={
              guideHref ? (
                <Link href={guideHref} className={brandButtonClass("secondary", undefined, "md")}>
                  {t("articles.guide")}
                </Link>
              ) : undefined
            }
          />
          <div className={balancedGridClass(articles.length)}>
            {articles.map((a) => {
              const title = resolveLocalizedString(a.title as never, locale);
              if (!title) return null;
              return (
                <BlogCard
                  key={a.slug}
                  locale={locale}
                  blog={{
                    title,
                    slug: a.slug,
                    excerpt: resolveLocalizedString(a.excerpt as never, locale) || undefined,
                    coverImage: a.coverImage?.asset?.url ?? undefined,
                    publishedAt: a.publishedAt ?? undefined,
                    readMoreLabel: t("articles.readMore"),
                  }}
                />
              );
            })}
          </div>
        </Section>
      ) : null}

      <Section aria-labelledby="inv-faq">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="inv-faq" className={SECTION_TITLE}>
              {t("faq.title")}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{t("faq.lead")}</p>
          </div>
          <div className={SPLIT_MAIN}>
            <FaqAccordion idPrefix="inv-faq" items={faq.map((f) => ({ question: f.q, answer: <p>{f.a}</p> }))} />
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
