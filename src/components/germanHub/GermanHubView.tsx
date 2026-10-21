import { getTranslations } from "next-intl/server";
import Link from "@/components/shared/Link";
import PropertyCard from "@/components/shared/property/PropertyCard";
import BlogCard from "@/components/shared/Blog/blogCard";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { FaqAccordion } from "@/components/shared/faq/FaqAccordion";
import { FaqJsonLd } from "@/components/shared/FaqJsonLd";
import { ItemListJsonLd } from "@/components/shared/ItemListJsonLd";
import { PriceTableSection } from "@/components/landing/sections/PriceTableSection";
import { LeadFormSection } from "@/components/landing/sections/LeadFormSection";
import { PartnerLandingHero } from "@/components/partnerLandings/PartnerLandingHero";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { textLinkClass } from "@/components/catalog/depthUi";
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
import { MIN_HEADLINE_SAMPLE } from "@/lib/priceIndex/snapshot";
import { methodologyPath } from "@/lib/priceIndex/publish";
import {
  GERMAN_HUB_FAQ_LINKS,
  GERMAN_HUB_GUIDE_SLUGS,
  GERMAN_HUB_SEA_LANDING_PATH,
  GERMAN_HUB_SEA_MAX_METERS,
  GERMAN_HUB_SEA_PER_CITY,
  germanHubPath,
} from "@/lib/germanHub/config";
import type { GermanHubData } from "@/lib/germanHub/load";
import { cn } from "@/lib/utils";

const loc = (value: string) => ({ en: value, uk: value, ru: value, sq: value, it: value, pl: value, de: value });

/** The German article each FAQ answer points to, by question number. */
const FAQ_ARTICLE: Record<number, string> = {
  1: GERMAN_HUB_GUIDE_SLUGS[0],
  2: GERMAN_HUB_FAQ_LINKS.notary,
  3: GERMAN_HUB_GUIDE_SLUGS[0],
  4: GERMAN_HUB_GUIDE_SLUGS[1],
  5: GERMAN_HUB_GUIDE_SLUGS[3],
  6: GERMAN_HUB_FAQ_LINKS.foreigners,
};

/**
 * The German hub, `/de/albanien-immobilien`. Every figure is the live Price
 * Index or a listing; the FAQ answers repeat facts the German articles state
 * with their sources, and each links the article. A block whose data is
 * missing is not rendered. Copy: `messages/de.json` `GermanHub`.
 */
export async function GermanHubView({ locale, data }: { locale: string; data: GermanHubData }) {
  const { snapshot, cityRows, leadCities, seaListings, guides, siteSettings, baseUrl } = data;
  const [t, tCrumbs, messengerContext] = await Promise.all([
    getTranslations({ locale, namespace: "GermanHub" }),
    getTranslations({ locale, namespace: "Breadcrumbs" }),
    getMessengerContext({ locale, placement: "landing" }),
  ]);
  const base = baseUrl.replace(/\/$/, "");
  const pagePath = germanHubPath();
  const pageUrl = `${base}${pagePath}`;

  const number = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const money = (n: number) => formatMoney(n, "EUR", locale);
  const date = snapshot ? formatBlogDate(new Date(snapshot.computedAt), locale) : "";
  const cityName = (row: { slug: string; title?: unknown }) => resolveLocalizedString(row.title as never, locale) || row.slug;
  const cityHref = (row: { slug: string; country: string }) =>
    catalogFilterPath({ locale, country: row.country, trustedCityCountrySlug: row.country, city: row.slug });
  const blogHref = (slug: string) => `/${locale}/blog/${slug}`;

  const figures = leadCities
    .map((c) => t("leadFigure", { city: cityName(c), median: money(c.medianPerSqm!), count: c.count }))
    .join(", ");
  const durres = cityRows.find((c) => c.slug === "durres");

  const crumbs = buildFlatCrumbs({ locale, homeLabel: tCrumbs("home"), label: t("breadcrumb") });
  const jsonLdCrumbs = toBreadcrumbJsonLdItems(crumbs, pagePath);

  const cards = await attachMarketPositionToCards(seaListings.map((row) => mapCatalogPropertyToCard(row, locale)));
  const hero = seaListings[0];

  const faq = [1, 2, 3, 4, 5, 6].map((n) => {
    const question = t(`faq.q${n}`);
    let answer: string;
    if (n === 4) {
      answer =
        durres?.medianPerSqm && date
          ? t("faq.a4", { date, durresMedian: money(durres.medianPerSqm) })
          : t("faq.a4NoData");
    } else if (n === 5) {
      answer =
        figures && durres?.p20 && durres?.p80 && date
          ? t("faq.a5", { date, figures, durresP20: money(durres.p20), durresP80: money(durres.p80) })
          : t("faq.a5NoData");
    } else {
      answer = t(`faq.a${n}`);
    }
    return { n, question, answer, href: blogHref(FAQ_ARTICLE[n]) };
  });

  const messengers = resolveMessengers(
    (siteSettings as { socialLinks?: SocialLinkInput[] } | null)?.socialLinks,
    locale,
    messengerContext,
  );

  return (
    <main>
      <BreadcrumbJsonLd items={jsonLdCrumbs} baseUrl={base} />
      <ItemListJsonLd
        locale={locale}
        baseUrl={base}
        items={cards.map((card) => ({
          name: card.name,
          slug: card.slug,
          href: card._href,
          image: card.images[0]?.src ?? null,
        }))}
        collection={{ name: t("h1"), url: pageUrl, placeName: "Albanien" }}
      />
      <FaqJsonLd items={faq.map((f) => ({ question: f.question, answer: f.answer }))} />

      <PartnerLandingHero
        breadcrumb={<Breadcrumb items={crumbs} overHero />}
        label={t("label")}
        title={t("h1")}
        lead={figures && date ? t("lead", { date, figures, sea: cards.length }) : t("leadNoData")}
        image={hero?.mainImageUrl ? { src: hero.mainImageUrl, alt: t("heroAlt") } : null}
        footer={
          <Link href={nonGeoDealListingPath(locale, "sale")} className={`${textLinkClass} !text-white`}>
            {t("allSale")}
          </Link>
        }
      />

      {snapshot && cityRows.length > 0 ? (
        <PriceTableSection
          locale={locale}
          section={{
            title: loc(t("table.title")),
            subtitle: loc(t("table.lead")),
            labelHeader: loc(t("table.colCity")),
            columns: [loc(t("table.colMedian")), loc(t("table.colFrom")), loc(t("table.colCount")), loc(t("table.colSample"))],
            rows: cityRows.map((c) => ({
              _key: c.slug,
              label: loc(cityName(c)),
              cells: [
                loc(c.medianPerSqm !== null ? money(c.medianPerSqm) : t("table.lowSample")),
                loc(c.flatPriceFrom !== null ? money(c.flatPriceFrom) : "—"),
                loc(number(c.listings)),
                loc(number(c.count)),
              ],
              href: cityHref(c),
            })),
            caption: t("table.caption", { date }),
            footnote: t("table.footnote", { min: MIN_HEADLINE_SAMPLE }),
            lastUpdated: snapshot.computedAt,
          }}
        />
      ) : null}
      {snapshot ? (
        <section className="-mt-6 md:-mt-8 pb-6 md:pb-8">
          <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
            <p className={BODY_TEXT}>
              <Link href={`/${locale}/prices`} className={textLinkClass}>
                {t("table.pricesLink")}
              </Link>
              {" · "}
              <Link href={methodologyPath(locale)} className={textLinkClass}>
                {t("table.methodologyLink")}
              </Link>
            </p>
          </div>
        </section>
      ) : null}

      {cards.length > 0 ? (
        <Section aria-labelledby="hub-sea">
          <SectionHeading
            id="hub-sea"
            title={t("sea.title", { count: cards.length })}
            lead={t("sea.lead", { metres: number(GERMAN_HUB_SEA_MAX_METERS), perCity: GERMAN_HUB_SEA_PER_CITY })}
            trailing={
              <Link href={GERMAN_HUB_SEA_LANDING_PATH} className={brandButtonClass("secondary", undefined, "md")}>
                {t("sea.all")}
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

      {guides.length > 0 ? (
        <Section aria-labelledby="hub-guides">
          <SectionHeading
            id="hub-guides"
            title={t("guides.title")}
            lead={t("guides.lead")}
            trailing={
              <Link href={`/${locale}/blog`} className={brandButtonClass("secondary", undefined, "md")}>
                {t("guides.allBlog")}
              </Link>
            }
          />
          <div className={balancedGridClass(guides.length)}>
            {guides.map((guide) => (
              <BlogCard
                key={guide.slug}
                locale={locale}
                blog={{
                  title: guide.title,
                  slug: guide.slug,
                  excerpt: guide.excerpt ?? undefined,
                  coverImage: guide.coverImage?.asset?.url ?? undefined,
                  publishedAt: guide.publishedAt ?? undefined,
                  readMoreLabel: t("guides.readMore"),
                }}
              />
            ))}
          </div>
        </Section>
      ) : null}

      <Section aria-labelledby="hub-faq">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="hub-faq" className={SECTION_TITLE}>
              {t("faq.title")}
            </h2>
            <p className={cn(SECTION_LEAD, "mt-3")}>{t("faq.lead")}</p>
          </div>
          <div className={SPLIT_MAIN}>
            <FaqAccordion
              idPrefix="hub-faq"
              items={faq.map((f) => ({
                question: f.question,
                answer: (
                  <>
                    <p>{f.answer}</p>
                    <p className="mt-3">
                      <Link href={f.href} className={textLinkClass}>
                        {t("faq.more")}
                      </Link>
                    </p>
                  </>
                ),
              }))}
            />
          </div>
        </div>
      </Section>

      <LeadFormSection
        locale={locale}
        anchorId="anfrage"
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
        budgetOptions={[]}
        withMessage
        messengers={messengers.length ? messengers : null}
      />
    </main>
  );
}
